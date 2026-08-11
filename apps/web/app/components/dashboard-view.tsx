import { redirect } from "next/navigation";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { AdminShell } from "@/app/components/admin-shell";
import { StatCards } from "@/app/components/dashboard/stat-cards";
import { SanctionFlags } from "@/app/components/dashboard/sanction-flags";
import { RoleRequests } from "@/app/components/dashboard/role-requests";
import { QuickActions } from "@/app/components/dashboard/quick-actions";
import { AuditActivity } from "@/app/components/dashboard/audit-activity";
import { Analytics } from "@/app/components/dashboard/analytics";
import { DAY_KEYS } from "@/lib/constants/dashboard";
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
    studentsWithSection,
    attendanceRows,
    eventCount,
    upcomingEvents,
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
    prisma.student.count({ where: { sectionId: { not: null } } }),
    prisma.attendance.findMany({
      select: {
        status: true,
        scannedAt: true,
        student: {
          select: {
            section: {
              select: {
                name: true,
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
          take: 6,
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
  const placementRate = totalStudents
    ? Math.round((studentsWithSection / totalStudents) * 100)
    : 0;

  let attended = 0;
  const monthly = new Map<string, { present: number; total: number }>();
  const heatMap = new Map<string, { count: number; days: { present: number; total: number }[] }>();
  const sectionAgg = new Map<string, { present: number; total: number }>();

  for (const a of attendanceRows) {
    const key = a.scannedAt.toISOString().slice(0, 7);
    const m = monthly.get(key) ?? { present: 0, total: 0 };
    m.total += 1;
    const isAttended = a.status === "PRESENT" || a.status === "LATE";
    if (isAttended) {
      m.present += 1;
      attended += 1;
    }
    monthly.set(key, m);

    const sec = a.student.section;
    if (sec) {
      const label = `${sec.programYear.program.code}-${sec.programYear.level}-${sec.name}`;
      const agg = sectionAgg.get(label) ?? { present: 0, total: 0 };
      agg.total += 1;
      if (isAttended) agg.present += 1;
      sectionAgg.set(label, agg);

      const day = a.scannedAt.getDay();
      if (day >= 1 && day <= 5) {
        const h =
          heatMap.get(label) ??
          { count: 0, days: DAY_KEYS.map(() => ({ present: 0, total: 0 })) };
        h.count += 1;
        const cell = h.days[day - 1];
        cell.total += 1;
        if (isAttended) cell.present += 1;
        heatMap.set(label, h);
      }
    }
  }

  const presentRate = attendanceRows.length
    ? Math.round((attended / attendanceRows.length) * 100)
    : 0;
  const trend = [...monthly.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const chartTrend = trend.slice(-10);

  const topHeat = [...heatMap.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8)
    .map(([label, h]) => ({
      label,
      days: h.days.map((d) => (d.total ? Math.round((d.present / d.total) * 100) : 0)),
    }));

  const sectionBars = [...sectionAgg.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 8)
    .map(([label, agg]) => ({
      label,
      rate: agg.total ? Math.round((agg.present / agg.total) * 100) : 0,
    }))
    .sort((a, b) => b.rate - a.rate);

  const sectionById = new Map<string, ScopedSection>(sections.map((s) => [s.id, s]));
  const yearById = new Map<string, ScopedYearLevel>(yearLevels.map((y) => [y.id, y]));

  const targetIds = [...new Set(recentAuditLogs.map((l) => l.targetId).filter(Boolean))] as string[];
  const targetUsers = targetIds.length
    ? await prisma.user.findMany({
        where: { id: { in: targetIds } },
        select: { id: true, name: true },
      })
    : [];
  const targetById = new Map(targetUsers.map((u) => [u.id, u.name]));

  const termName = activeTerm?.name ?? "Current Term";
  const threshold = pendingFlags[0]?.rule.absenceThreshold ?? 3;
  const roleLabel = isSuperAdmin
    ? "Super Admin"
    : (userWithRoles?.roles[0]?.role.name ?? "Officer");
  const userName = userWithRoles?.name ?? "Officer";

  return (
    <AdminShell userName={userName} roleLabel={roleLabel}>
      <div>
        <h1 className={styles.pageTitle}>Dashboard</h1>
        <p className={styles.pageSubtitle}>
          Monitor events, fees, and student government operations from a centralized dashboard.
        </p>
      </div>

      <div className={styles.statGrid}>
        <StatCards
          data={{
            totalStudents,
            programCount,
            studentsWithSection,
            placementRate,
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
            monthCount={trend.length}
            chartTrend={chartTrend}
            topHeat={topHeat}
            sectionBars={sectionBars}
          />
        </div>
      </div>

      <AuditActivity logs={recentAuditLogs} targetById={targetById} />
    </AdminShell>
  );
}
