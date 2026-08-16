import { redirect } from "next/navigation";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { AdminShell } from "@/app/components/admin-shell";
import { getTermContext, termRange, eventInTerm, sanctionsInTerm } from "@/lib/terms";
import { cached, CACHE_TTL } from "@/lib/cache";
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
  if (!session?.user?.id) redirect("/login/officers");

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

  const { term } = await getTermContext();
  const range = termRange(term);
  const termKey = term?.id ?? "none";

  const {
    statData,
    enrollmentTargets,
    canEditEnrollment,
    activeSanctionCount,
    flags,
    pendingRoleRequestCount,
    requests,
    collected,
    collectedRate,
    totalFee,
    eventTrend,
    eventPerformance,
    logs,
    targetById,
    sectionByIdRecord,
    yearByIdRecord,
  } = await cached(`dashboard:${termKey}`, CACHE_TTL.MEDIUM, async () => {
    const [
      totalStudents,
      attendanceRows,
      studentProgramRows,
      eventsTargets,
      eventCount,
      upcomingEvents,
      latestEvents,
      allEvents,
      fees,
      feeProofs,
      activeSanctions,
      pendingRoleRequestCount,
      pendingFeeProofCount,
      activeSanctionCount,
      programCount,
      pendingRoleRequests,
      recentAuditLogs,
      sections,
      yearLevels,
      programs,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.attendance.findMany({
        where: range ? { scannedAt: range } : undefined,
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
      prisma.student.findMany({
        select: { section: { select: { programYear: { select: { programId: true } } } } },
      }),
      prisma.event.findMany({
        select: { id: true, programId: true },
      }),
      prisma.event.count({ where: eventInTerm(term) }),
      prisma.event.findMany({
        where: range
          ? { startsAt: { gte: new Date(Math.max(now.getTime(), range.gte.getTime())), lte: range.lte } }
          : { startsAt: { gte: now } },
        orderBy: { startsAt: "asc" },
        take: 3,
      }),
      prisma.event.findMany({
        where: range
          ? { startsAt: { gte: range.gte, lte: new Date(Math.min(now.getTime(), range.lte.getTime())) } }
          : { startsAt: { lte: now } },
        orderBy: { startsAt: "desc" },
        take: 3,
        select: { id: true, title: true },
      }),
      prisma.event.findMany({
        where: eventInTerm(term),
        orderBy: { startsAt: "desc" },
        select: { id: true, title: true },
      }),
      prisma.fee.findMany({
        where: range ? { createdAt: range } : undefined,
        select: { amount: true },
      }),
      prisma.feeProof.findMany({
        where: range ? { createdAt: range } : undefined,
        orderBy: { createdAt: "desc" },
        select: {
          studentId: true,
          feeId: true,
          status: true,
          fee: { select: { amount: true } },
        },
      }),
      prisma.sanction.findMany({
        where: { status: "OPEN", ...sanctionsInTerm(term) },
        orderBy: { issuedAt: "desc" },
        take: 3,
        include: {
          student: {
            include: {
              section: { include: { programYear: { include: { program: true } } } },
            },
          },
          fine: { select: { title: true } },
        },
      }),
      prisma.roleRequest.count({ where: { status: "PENDING" } }),
      prisma.feeProof.count({ where: { status: "PENDING" } }),
      prisma.sanction.count({ where: { status: "OPEN", ...sanctionsInTerm(term) } }),
      prisma.program.count(),
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
            where: range ? { timestamp: range } : undefined,
            orderBy: { timestamp: "desc" },
            include: { actor: true },
          })
        : [],
      isSuperAdmin
        ? prisma.section.findMany({
            include: { programYear: { include: { program: true } } },
          })
        : [],
      prisma.yearLevel.findMany({ include: { program: true } }),
      prisma.program.findMany({
        orderBy: { code: "asc" },
        select: { id: true, code: true, name: true, enrollmentTarget: true },
      }),
    ]);

    const flagRows = activeSanctions.length
      ? await prisma.sanctionFlag.findMany({
          where: { studentId: { in: activeSanctions.map((s) => s.studentId) } },
          select: { studentId: true, triggerCount: true },
        })
      : [];
    const absenceByStudent = new Map(
      flagRows.map((f) => [f.studentId, f.triggerCount]),
    );

    const totalFee = fees.reduce((sum, f) => sum + Number(f.amount), 0);
    const enrollmentTargets = programs.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      count: p.enrollmentTarget,
    }));
    const targetTotal = enrollmentTargets.reduce(
      (sum, p) => sum + (p.count ?? 0),
      0,
    );
    const hasTargets = enrollmentTargets.some((p) => p.count != null);
    const displayedTotalStudents = hasTargets ? targetTotal : totalStudents;
    const accountRate = displayedTotalStudents
      ? Math.round((totalStudents / displayedTotalStudents) * 100)
      : 0;

    const feeTarget = totalFee * displayedTotalStudents;
    const latestByStudentFee = new Map<string, (typeof feeProofs)[number]>();
    for (const p of feeProofs) {
      const key = `${p.studentId}:${p.feeId}`;
      if (!latestByStudentFee.has(key)) latestByStudentFee.set(key, p);
    }
    let collected = 0;
    for (const p of latestByStudentFee.values()) {
      if (p.status === "PAID") collected += Number(p.fee.amount);
    }
    const collectedRate = feeTarget ? Math.round((collected / feeTarget) * 100) : 0;

    const programStudentCount = new Map<string, number>();
    for (const s of studentProgramRows) {
      const pid = s.section?.programYear.programId;
      if (pid) programStudentCount.set(pid, (programStudentCount.get(pid) ?? 0) + 1);
    }
    const programTargetById = new Map(programs.map((p) => [p.id, p.enrollmentTarget]));
    const eventTargetById = new Map(eventsTargets.map((e) => [e.id, e.programId]));

    const expectedForEvent = (eventId: string) => {
      const programId = eventTargetById.get(eventId);
      if (programId) {
        return programTargetById.get(programId) ?? programStudentCount.get(programId) ?? 0;
      }
      return displayedTotalStudents;
    };

    const expectedByEvent = new Map<string, number>();
    const presentByEvent = new Map<string, number>();
    for (const a of attendanceRows) {
      const isAttended = a.status === "PRESENT" || a.status === "LATE";

      const expected = expectedForEvent(a.eventId);
      expectedByEvent.set(a.eventId, Math.max(expectedByEvent.get(a.eventId) ?? 0, expected));
      presentByEvent.set(a.eventId, (presentByEvent.get(a.eventId) ?? 0) + (isAttended ? 1 : 0));
    }

    const expectedTotal = [...expectedByEvent.values()].reduce((sum, n) => sum + n, 0);
    const presentTotal = [...presentByEvent.values()].reduce((sum, n) => sum + n, 0);
    const presentRate = expectedTotal
      ? Math.round((presentTotal / expectedTotal) * 100)
      : 0;
    const avgPresentPerEvent = presentByEvent.size > 0
      ? Math.round(presentTotal / presentByEvent.size)
      : 0;

    const eventTrend = [...latestEvents].reverse().map((e) => {
      const rows = attendanceRows.filter((a) => a.eventId === e.id);
      return {
        name: e.title,
        present: rows.filter((a) => a.status === "PRESENT").length,
        absent: rows.filter((a) => a.status === "ABSENT").length,
        late: rows.filter((a) => a.status === "LATE").length,
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

    const allProgramYearCombos = yearLevels
      .filter((y) => y.program.code in PROGRAM_ORDER)
      .map((y) => ({
        code: y.program.code,
        level: y.level,
        key: `${y.program.code}-${y.level}`,
        label: `${PROGRAM_SHORT[y.program.code] ?? y.program.code} Y${y.level}`,
      }))
      .sort(
        (a, b) =>
          (PROGRAM_ORDER[a.code] ?? 99) - (PROGRAM_ORDER[b.code] ?? 99) ||
          a.level - b.level,
      );

    const presentCountByEvent = new Map<string, Map<string, number>>();
    for (const a of attendanceRows) {
      const sec = a.student.section;
      if (!sec) continue;
      const py = sec.programYear;
      const isAttended = a.status === "PRESENT" || a.status === "LATE";
      if (!isAttended) continue;
      const byKey = presentCountByEvent.get(a.eventId) ?? new Map();
      const key = `${py.program.code}-${py.level}`;
      byKey.set(key, (byKey.get(key) ?? 0) + 1);
      presentCountByEvent.set(a.eventId, byKey);
    }

    const eventPerformance = allEvents
      .map((e) => {
        const byKey = presentCountByEvent.get(e.id) ?? new Map();
        const bars = allProgramYearCombos.map((c) => ({
          label: c.label,
          present: byKey.get(c.key) ?? 0,
        }));
        return { id: e.id, title: e.title, bars };
      })
      .filter((e) => e.bars.some((b) => b.present > 0));

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

    const statData = {
      totalStudents: displayedTotalStudents,
      accountCount: totalStudents,
      accountRate,
      programCount,
      eventCount,
      upcomingCount: upcomingEvents.length,
      presentRate,
      avgPresentPerEvent,
      collected,
      collectedRate,
      pendingFeeProofCount,
      pendingRoleRequestCount,
      activeSanctionCount,
    };

    const flags = activeSanctions.map((s) => ({
      id: s.id,
      title: s.title,
      issuedAt: s.issuedAt.toISOString(),
      absences: absenceByStudent.get(s.studentId) ?? 0,
      student: {
        firstName: s.student.firstName,
        lastName: s.student.lastName,
        section: s.student.section
          ? {
              name: s.student.section.name,
              programYear: {
                level: s.student.section.programYear.level,
                program: { code: s.student.section.programYear.program.code },
              },
            }
          : null,
      },
    }));

    const requests = pendingRoleRequests.map((r) => ({
      id: r.id,
      requestedScopeType: r.requestedScopeType,
      requestedSectionId: r.requestedSectionId,
      requestedProgramYearId: r.requestedProgramYearId,
      user: { name: r.user.name },
      requestedRole: { name: r.requestedRole.name },
    }));

    const logs = recentAuditLogs.map((l) => ({
      id: l.id,
      action: l.action,
      targetId: l.targetId,
      details: l.details,
      timestamp: l.timestamp.toISOString(),
      actor: l.actor ? { name: l.actor.name } : null,
    }));

    return {
      statData,
      enrollmentTargets,
      canEditEnrollment: isSuperAdmin,
      activeSanctionCount,
      flags,
      pendingRoleRequestCount,
      requests,
      collected,
      collectedRate,
      totalFee: feeTarget,
      eventTrend,
      eventPerformance,
      logs,
      targetById,
      sectionByIdRecord: Object.fromEntries(sectionById),
      yearByIdRecord: Object.fromEntries(yearById),
    };
  });

  const sectionById = new Map<string, ScopedSection>(Object.entries(sectionByIdRecord));
  const yearById = new Map<string, ScopedYearLevel>(Object.entries(yearByIdRecord));
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
          data={statData}
          enrollmentTargets={enrollmentTargets}
          canEditEnrollment={canEditEnrollment}
        />
      </div>

      <div className={styles.dashGrid}>
        <div className={styles.leftCol}>
          <SanctionFlags count={activeSanctionCount} flags={flags} />
          <RoleRequests
            count={pendingRoleRequestCount}
            requests={requests}
            sectionById={sectionById}
            yearById={yearById}
          />
          <QuickActions />
        </div>

        <div className={styles.rightCol}>
          <Analytics
            termName={term?.name ?? "Current Term"}
            eventTrend={eventTrend}
            collected={collected}
            totalFee={totalFee}
            collectedRate={collectedRate}
            eventPerformance={eventPerformance}
          />
        </div>
      </div>

      <AuditActivity logs={logs} targetById={targetById} />
    </AdminShell>
  );
}
