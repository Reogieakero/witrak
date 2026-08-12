import { redirect } from "next/navigation";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { AdminShell } from "@/app/components/admin-shell";
import { StatCards } from "@/app/components/dashboard/stat-cards";
import { SanctionFlags } from "@/app/components/dashboard/sanction-flags";
import { RoleRequests } from "@/app/components/dashboard/role-requests";
import { QuickActions } from "@/app/components/dashboard/quick-actions";
import { AuditActivity } from "@/app/components/dashboard/audit-activity";
import { DashboardInfo } from "@/app/components/dashboard/dashboard-info";
import { Analytics } from "@/app/components/dashboard/analytics";
import type { ScopedSection, ScopedYearLevel } from "@/lib/dashboard-utils";
import styles from "./dashboard-view.module.css";

export default async function DashboardView() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userWithRoles = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      roles: { include: { role: { select: { name: true } } } },
    },
  });

  const isSuperAdmin =
    userWithRoles?.roles.some((r) => r.role.name === "Super Admin") ?? false;

  const now = new Date();

  const [
    totalStudents,
    totalUsers,
    completedProfileCount,
    attendanceRows,
    eventCount,
    upcomingEvents,
    latestEvents,
    fees,
    paidProofs,
    pendingFlags,
    pendingRoleRequestCount,
    pendingFeeProofCount,
    pendingFlagCount,
    programCount,
    activeTerm,
    pendingRoleRequests,
    recentAuditLogs,
    sections,
    yearLevels,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.user.count(),
    prisma.user.count({
      where: { student: { is: { sectionId: { not: null } } } },
    }),
    prisma.attendance.findMany({
      select: {
        eventId: true,
        status: true,
        scannedAt: true,
        student: {
          select: {
            section: {
              select: {
                programYear: {
                  select: { level: true, program: { select: { code: true } } },
                },
              },
            },
          },
        },
      },
    }),
    prisma.event.count(),
    prisma.event.findMany({
      where: { startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      take: 3,
    }),
    prisma.event.findMany({
      where: { startsAt: { lte: now } },
      orderBy: { startsAt: "desc" },
      take: 3,
      select: { id: true, title: true },
    }),
    prisma.fee.findMany({ select: { amount: true } }),
    prisma.feeProof.findMany({
      where: { status: "PAID" },
      select: { fee: { select: { amount: true } } },
    }),
    prisma.sanctionFlag.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        student: {
          include: {
            section: { include: { programYear: { include: { program: true } } } },
          },
        },
        rule: true,
      },
    }),
    prisma.roleRequest.count({ where: { status: "PENDING" } }),
    prisma.feeProof.count({ where: { status: "PENDING" } }),
    prisma.sanctionFlag.count({ where: { status: "PENDING" } }),
    prisma.program.count(),
    prisma.academicTerm.findFirst({ where: { isActive: true } }),
    isSuperAdmin
      ? prisma.roleRequest.findMany({
          where: { status: "PENDING" },
          orderBy: { id: "asc" },
          take: 3,
          include: { user: true, requestedRole: true },
        })
      : [],
    isSuperAdmin
      ? prisma.auditLog.findMany({
          orderBy: { timestamp: "desc" },
          include: { actor: true },
        })
      : [],
    isSuperAdmin
      ? prisma.section.findMany({
          include: { programYear: { include: { program: true } } },
        })
      : [],
    isSuperAdmin
      ? prisma.yearLevel.findMany({ include: { program: true } })
      : [],
  ]);

  const totalFee = fees.reduce((sum, f) => sum + Number(f.amount), 0);
  const collected = paidProofs.reduce((sum, p) => sum + Number(p.fee.amount), 0);
  const collectedRate = totalFee ? Math.round((collected / totalFee) * 100) : 0;
  const profileRate = totalUsers
    ? Math.round((completedProfileCount / totalUsers) * 100)
    : 0;

  let attended = 0;
  const yearAgg = new Map<
    string,
    { code: string; level: number; present: number; total: number }
  >();

  for (const a of attendanceRows) {
    const isAttended = a.status === "PRESENT" || a.status === "LATE";
    if (isAttended) attended += 1;

    const sec = a.student.section;
    if (sec) {
      const py = sec.programYear;
      const key = `${py.program.code}-${py.level}`;
      const agg = yearAgg.get(key) ?? {
        code: py.program.code,
        level: py.level,
        present: 0,
        total: 0,
      };
      agg.total += 1;
      if (isAttended) agg.present += 1;
      yearAgg.set(key, agg);
    }
  }

  const presentRate = attendanceRows.length
    ? Math.round((attended / attendanceRows.length) * 100)
    : 0;

  const eventTrend = [...latestEvents].reverse().map((e) => {
    const rows = attendanceRows.filter((a) => a.eventId === e.id);
    const eventAttended = rows.filter(
      (a) => a.status === "PRESENT" || a.status === "LATE",
    ).length;
    return {
      name: e.title,
      rate: rows.length ? Math.round((eventAttended / rows.length) * 100) : 0,
    };
  });

  const PROGRAM_ORDER: Record<string, number> = {
    "AB-POLSCI": 0,
    BSPSYCH: 1,
    "BS-DEVCOM": 2,
  };
  const PROGRAM_SHORT: Record<string, string> = {
    "AB-POLSCI": "PolSci",
    BSPSYCH: "Psych",
    "BS-DEVCOM": "DevCom",
  };

  const coursesByCode = new Map<
    string,
    { code: string; bars: { level: number; rate: number }[] }
  >();
  for (const agg of yearAgg.values()) {
    const course = coursesByCode.get(agg.code) ?? { code: agg.code, bars: [] };
    course.bars.push({
      level: agg.level,
      rate: agg.total ? Math.round((agg.present / agg.total) * 100) : 0,
    });
    coursesByCode.set(agg.code, course);
  }
  for (const course of coursesByCode.values()) {
    for (let level = 1; level <= 4; level++) {
      if (!course.bars.some((b) => b.level === level)) {
        course.bars.push({ level, rate: 0 });
      }
    }
    course.bars.sort((a, b) => a.level - b.level);
  }

  const yearBars = [...coursesByCode.values()]
    .filter((c) => c.code in PROGRAM_ORDER)
    .sort(
      (a, b) =>
        (PROGRAM_ORDER[a.code] ?? 99) - (PROGRAM_ORDER[b.code] ?? 99),
    )
    .flatMap((c) =>
      c.bars.map((b) => ({
        label: `${PROGRAM_SHORT[c.code] ?? c.code} Y${b.level}`,
        rate: b.rate,
      })),
    );

  const sectionById = new Map<string, ScopedSection>(sections.map((s) => [s.id, s]));
  const yearById = new Map<string, ScopedYearLevel>(yearLevels.map((y) => [y.id, y]));

  const targetIds = [...new Set(recentAuditLogs.map((l) => l.targetId).filter(Boolean))] as string[];
  const targetUsers = targetIds.length
    ? await prisma.user.findMany({
        where: { id: { in: targetIds } },
        select: { id: true, name: true },
      })
    : [];
  const targetById = Object.fromEntries(targetUsers.map((u) => [u.id, u.name]));

  const termName = activeTerm?.name ?? "Current Term";
  const threshold = pendingFlags[0]?.rule.absenceThreshold ?? 3;
  const roleLabel = isSuperAdmin
    ? "Super Admin"
    : (userWithRoles?.roles[0]?.role.name ?? "Officer");
  const userName = userWithRoles?.name ?? "Officer";

  return (
    <AdminShell userName={userName} roleLabel={roleLabel}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSubtitle}>
            Monitor events, fees, and student government operations from a centralized dashboard.
          </p>
        </div>
        <DashboardInfo />
      </div>

      <div className={styles.statGrid}>
        <StatCards
          data={{
            totalStudents,
            totalUsers,
            programCount,
            completedProfileCount,
            profileRate,
            eventCount,
            upcomingCount: upcomingEvents.length,
            presentRate,
            collected,
            collectedRate,
            pendingFeeProofCount,
            pendingRoleRequestCount,
            pendingFlagCount,
          }}
        />
      </div>

      <div className={styles.dashGrid}>
        <div className={styles.leftCol}>
          <SanctionFlags count={pendingFlagCount} threshold={threshold} flags={pendingFlags} />
          <RoleRequests
            count={pendingRoleRequestCount}
            requests={pendingRoleRequests}
            sectionById={sectionById}
            yearById={yearById}
          />
          <QuickActions />
        </div>

        <div className={styles.rightCol}>
          <Analytics
            termName={termName}
            presentRate={presentRate}
            eventTrend={eventTrend}
            collected={collected}
            totalFee={totalFee}
            collectedRate={collectedRate}
            yearBars={yearBars}
          />
        </div>
      </div>

      <AuditActivity logs={recentAuditLogs} targetById={targetById} />
    </AdminShell>
  );
}
