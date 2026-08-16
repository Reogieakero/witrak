import { prisma } from "@fhusocom/db";
import { money } from "@/lib/constants/dashboard";
import { getTermContext, eventInTerm } from "@/lib/terms";
import { StudentShell } from "@/app/components/student-shell";
import { WelcomeBanner } from "@/app/components/student/student-welcome";
import { StudentStats } from "@/app/components/student/student-stats";
import { StudentAnnouncements } from "@/app/components/student/student-announcements";
import { StudentEvents } from "@/app/components/student/student-events";
import { StudentAttendance } from "@/app/components/student/student-attendance";
import { StudentTransparency } from "@/app/components/student/student-transparency";
import { StudentSanctions } from "@/app/components/student/student-sanctions";
import { StudentFees } from "@/app/components/student/student-fees";
import { StudentQuickLinks } from "@/app/components/student/student-quick-links";
import { StudentKpiOverview } from "@/app/components/student/student-kpi-overview";
import type { StudentHomeData } from "@/app/components/student/types";
import styles from "./student-home.module.css";

const CATEGORY_META: Record<
  string,
  { label: string; tone: "green" | "violet" | "amber" | "brand" }
> = {
  financial: { label: "Financial", tone: "green" },
  events: { label: "Events", tone: "violet" },
  minutes: { label: "Minutes", tone: "amber" },
  reports: { label: "Reports", tone: "brand" },
};

export default async function StudentHomeView({
  studentId,
  userName,
}: {
  studentId: string;
  userName: string;
}) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      firstName: true,
      section: {
        select: {
          name: true,
          programYear: {
            select: { level: true, program: { select: { code: true } } },
          },
        },
      },
    },
  });

  if (!student) return null;

  const { term } = await getTermContext();
  const termName = term?.name ?? "Current Term";
  const now = new Date();

  const [fees, proofs, eventRows, announcements, transparencyFiles, sanctions] =
    await Promise.all([
      prisma.fee.findMany({
        orderBy: { dueDate: "asc" },
      }),
      prisma.feeProof.findMany({
        where: { studentId },
        orderBy: { createdAt: "desc" },
        select: { id: true, feeId: true, status: true, createdAt: true },
      }),
      prisma.event.findMany({
        where: eventInTerm(term),
        orderBy: { startsAt: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          location: true,
          startsAt: true,
          endsAt: true,
          requiresAttendance: true,
        },
      }),
      prisma.announcement.findMany({
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          title: true,
          body: true,
          createdAt: true,
          createdBy: { select: { name: true } },
        },
      }),
      prisma.transparencyFile.findMany({
        orderBy: { uploadedAt: "desc" },
        select: {
          id: true,
          title: true,
          fileUrl: true,
          category: true,
          uploadedAt: true,
          uploadedBy: { select: { name: true } },
        },
      }),
      prisma.sanction.findMany({
        where: { studentId },
        orderBy: { issuedAt: "desc" },
        take: 3,
        select: {
          id: true,
          title: true,
          reason: true,
          status: true,
          issuedAt: true,
          fine: { select: { description: true } },
        },
      }),
    ]);

  const fmtDate = (d: Date) =>
    d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  const fmtTime = (d: Date) =>
    d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });

  const totalEvents = eventRows.length;
  const upcomingEvents = eventRows.filter((e) => e.startsAt > now).length;
  const liveEvents = eventRows.filter((e) => e.startsAt <= now && now < e.endsAt).length;
  const completedEvents = eventRows.filter((e) => e.endsAt <= now).length;

  const pastRequiredEventIds = new Set(
    eventRows
      .filter((e) => e.requiresAttendance && e.endsAt <= now)
      .map((e) => e.id),
  );

  const attendanceEvents = [
    ...eventRows.filter((e) => e.startsAt <= now && now < e.endsAt),
    ...eventRows.filter((e) => e.startsAt > now),
    ...[...eventRows.filter((e) => e.endsAt <= now)].reverse(),
  ].slice(0, 6);

  const [totalRecords, presentCount, pastAttendanceRows, otherAbsent, attendanceForEvents] =
    await Promise.all([
      prisma.attendance.count({ where: { studentId } }),
      prisma.attendance.count({
        where: { studentId, status: { in: ["PRESENT", "LATE"] } },
      }),
      prisma.attendance.findMany({
        where: { studentId, eventId: { in: [...pastRequiredEventIds] } },
        select: { status: true },
      }),
      prisma.attendance.count({
        where: {
          studentId,
          status: { in: ["ABSENT", "EXCUSED"] },
          ...(pastRequiredEventIds.size > 0
            ? { eventId: { notIn: [...pastRequiredEventIds] } }
            : {}),
        },
      }),
      prisma.attendance.findMany({
        where: { studentId, eventId: { in: attendanceEvents.map((e) => e.id) } },
        select: { eventId: true, status: true, scannedAt: true },
      }),
    ]);

  let pastPresent = 0;
  let pastLate = 0;
  for (const r of pastAttendanceRows) {
    if (r.status === "PRESENT") pastPresent += 1;
    else if (r.status === "LATE") pastLate += 1;
  }

  const absences =
    Math.max(0, pastRequiredEventIds.size - pastPresent - pastLate) + otherAbsent;
  const attendanceRate =
    totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

  const attendedEvents = presentCount;

  const upcomingEventList = [
    ...eventRows.filter((e) => e.startsAt <= now && now < e.endsAt),
    ...eventRows.filter((e) => e.startsAt > now),
  ].slice(0, 4);

  const latestByFee = new Map<string, (typeof proofs)[number]>();
  for (const p of proofs) {
    if (!latestByFee.has(p.feeId)) latestByFee.set(p.feeId, p);
  }

  const feeItems = fees.map((f) => {
    const latest = latestByFee.get(f.id);
    const status = latest ? latest.status : "UNPAID";
    return {
      id: f.id,
      title: f.title,
      amount: money.format(Number(f.amount)),
      amountValue: Number(f.amount),
      dueDate: fmtDate(f.dueDate),
      status: status as StudentHomeData["fees"][number]["status"],
      proofId: latest?.id,
    };
  });

  const totalFees = fees.reduce((sum, f) => sum + Number(f.amount), 0);
  const paidAmount = feeItems
    .filter((f) => f.status === "PAID")
    .reduce((sum, f) => sum + f.amountValue, 0);
  const balance = totalFees - paidAmount;
  const pendingFees = feeItems.filter((f) => f.status === "PENDING").length;

  const attendanceByEventId = new Map(attendanceForEvents.map((a) => [a.eventId, a]));

  const attendanceItems = attendanceEvents.map((e) => {
    const rec = attendanceByEventId.get(e.id);
    const isLive = e.startsAt <= now && now < e.endsAt;
    const isCompleted = e.endsAt <= now;
    let attendanceStatus: StudentHomeData["attendance"][number]["attendanceStatus"];
    if (rec) {
      attendanceStatus = rec.status;
    } else if (e.requiresAttendance && isCompleted) {
      attendanceStatus = "ABSENT";
    } else if (isLive) {
      attendanceStatus = "NOT_SCANNED";
    } else if (!isCompleted) {
      attendanceStatus = "NOT_YET";
    } else {
      attendanceStatus = "NOT_RECORDED";
    }
    return {
      id: e.id,
      eventTitle: e.title,
      eventStatus: (
        isLive ? "live" : isCompleted ? "completed" : "upcoming"
      ) as StudentHomeData["attendance"][number]["eventStatus"],
      startsAt: e.startsAt.toISOString(),
      location: e.location,
      requiresAttendance: e.requiresAttendance,
      attendanceStatus,
      scannedAt: rec?.scannedAt.toISOString() ?? null,
    };
  });

  const transparencyItems = transparencyFiles.map((f) => {
    const category =
      (f.category as "financial" | "events" | "minutes" | "reports") ?? "reports";
    const meta = CATEGORY_META[category];
    return {
      id: f.id,
      title: f.title,
      fileUrl: f.fileUrl,
      uploadedAt: fmtDate(f.uploadedAt),
      uploadedBy: f.uploadedBy?.name ?? "Unknown",
      category,
      categoryLabel: meta?.label ?? category,
      categoryTone: meta?.tone ?? "brand",
    };
  });

  const sectionLabel = student.section
    ? `${student.section.programYear.program.code} ${student.section.programYear.level}-${student.section.name}`
    : "Unassigned";

  const data: StudentHomeData = {
    studentName: userName,
    firstName: student.firstName,
    sectionLabel,
    termName,
    attendanceRate,
    absences,
    attendedEvents,
    totalEvents,
    upcomingEvents,
    liveEvents,
    completedEvents,
    totalFees,
    totalPaid: paidAmount,
    balance,
    pendingFees,
    openSanctions: sanctions.filter((s) => s.status === "OPEN").length,
    transparencyCount: transparencyFiles.length,
    announcements: announcements.map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      createdAt: fmtDate(a.createdAt),
      authorName: a.createdBy?.name ?? "Unknown",
    })),
    events: upcomingEventList.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      location: e.location,
      startsAt: e.startsAt.toISOString(),
      endsAt: e.endsAt.toISOString(),
      day: e.startsAt.getDate(),
      month: e.startsAt.toLocaleDateString("en-PH", { month: "short" }),
      scheduleTime: fmtTime(e.startsAt),
      requiresAttendance: e.requiresAttendance,
      isLive: e.startsAt <= now && now < e.endsAt,
    })),
    attendance: attendanceItems,
    transparency: transparencyItems.slice(0, 6),
    transparencyAll: transparencyItems,
    fees: feeItems,
    sanctions: sanctions.map((s) => ({
      id: s.id,
      title: s.title,
      reason: s.reason,
      requirement: s.fine?.description ?? null,
      status: s.status,
      issuedAt: fmtDate(s.issuedAt),
    })),
  };

  return (
    <StudentShell userName={userName} roleLabel="Student" crumb="Home">
      <WelcomeBanner
        firstName={data.firstName}
        sectionLabel={data.sectionLabel}
        termName={data.termName}
      />

      <div className={styles.statsDesktop}>
        <div className={styles.statGrid}>
          <StudentStats
            absences={data.absences}
            balance={data.balance}
            paidAmount={money.format(data.totalPaid)}
            paidPct={
              data.totalFees > 0 ? Math.round((data.totalPaid / data.totalFees) * 100) : 0
            }
            totalEvents={data.totalEvents}
            upcomingEvents={data.upcomingEvents}
            liveEvents={data.liveEvents}
            completedEvents={data.completedEvents}
            attendedEvents={data.attendedEvents}
            openSanctions={data.openSanctions}
            transparencyCount={data.transparencyCount}
            pendingFeesText={pendingFees > 0 ? `${pendingFees} pending` : undefined}
          />
        </div>
      </div>

      <StudentKpiOverview
        totalEvents={data.totalEvents}
        completedEvents={data.completedEvents}
        absences={data.absences}
        balance={money.format(data.balance)}
        paidAmount={money.format(data.totalPaid)}
        paidPct={
          data.totalFees > 0 ? Math.round((data.totalPaid / data.totalFees) * 100) : 0
        }
        pendingFeesText={pendingFees > 0 ? `${pendingFees} pending` : undefined}
        upcomingEvents={data.upcomingEvents}
        liveEvents={data.liveEvents}
        attendedEvents={data.attendedEvents}
        openSanctions={data.openSanctions}
        transparencyCount={data.transparencyCount}
      />

      <div className={styles.dashGrid}>
          <div className={styles.leftCol}>
            <div className={styles.halfGrid}>
              <div id="section-announcements" className={styles.section}>
                <StudentAnnouncements announcements={data.announcements} />
              </div>
              <div id="section-events" className={styles.section}>
                <StudentEvents events={data.events} />
              </div>
            </div>
            <div id="section-attendance" className={styles.section}>
              <StudentAttendance attendance={data.attendance} />
            </div>
            <div id="section-transparency" className={styles.section}>
              <StudentTransparency
                items={data.transparency}
                allItems={data.transparencyAll}
                count={data.transparencyCount}
              />
            </div>
          </div>

          <div className={styles.rightCol}>
            <StudentSanctions
              sanctions={data.sanctions}
              openCount={data.openSanctions}
            />
            <StudentFees fees={data.fees} />
            <StudentQuickLinks />
          </div>
        </div>
    </StudentShell>
  );
}