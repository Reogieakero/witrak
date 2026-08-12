import { redirect } from "next/navigation";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { AdminShell } from "@/app/components/admin-shell";
import { AttendanceView } from "@/app/components/attendance/attendance-view";
import type {
  AttendanceEventItem,
  AttendanceStats,
  AttendanceStudentItem,
} from "@/app/components/attendance/types";

const PRESENT_STATUSES = ["PRESENT", "LATE"];
const ABSENT_STATUSES = ["ABSENT", "EXCUSED"];

function eventStatus(
  startsAt: Date,
  endsAt: Date,
  now: Date,
): "live" | "upcoming" | "past" {
  if (startsAt <= now && now < endsAt) return "live";
  if (startsAt > now) return "upcoming";
  return "past";
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default async function AdminAttendancePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const access = session.access;
  if (!hasPermission(access, "attendance_view")) redirect("/dashboard");

  const now = new Date();

  const scope = access?.scopeSectionIds ?? null;

  const [user, events, attendanceRows, studentRows, activeTerm] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          roles: { include: { role: { select: { name: true } } } },
        },
      }),
      prisma.event.findMany({
        orderBy: { startsAt: "desc" },
        select: {
          id: true,
          title: true,
          location: true,
          requiresAttendance: true,
          startsAt: true,
          endsAt: true,
        },
      }),
      prisma.attendance.findMany({
        where: scope
          ? { student: { sectionId: { in: scope } } }
          : undefined,
        orderBy: { scannedAt: "desc" },
        select: {
          id: true,
          status: true,
          scannedAt: true,
          eventId: true,
          studentId: true,
          student: {
            select: {
              id: true,
              studentNo: true,
              firstName: true,
              lastName: true,
              section: {
                select: {
                  name: true,
                  programYear: {
                    select: {
                      level: true,
                      program: { select: { code: true } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.student.findMany({
        where: scope ? { sectionId: { in: scope } } : undefined,
        orderBy: { lastName: "asc" },
        select: {
          id: true,
          studentNo: true,
          firstName: true,
          lastName: true,
          section: {
            select: {
              name: true,
              programYear: {
                select: {
                  level: true,
                  program: { select: { code: true } },
                },
              },
            },
          },
        },
      }),
      prisma.academicTerm.findFirst({ where: { isActive: true } }),
    ]);

  const attByEvent = new Map<
    string,
    { present: number; late: number; absent: number; total: number }
  >();

  const pastAttendanceEventIds = new Set(
    events
      .filter(
        (e) =>
          e.requiresAttendance &&
          eventStatus(e.startsAt, e.endsAt, now) === "past",
      )
      .map((e) => e.id),
  );
  const pastAttendanceCount = pastAttendanceEventIds.size;

  const studentPast = new Map<string, { present: number; late: number }>();
  const studentOther = new Map<
    string,
    { present: number; late: number; absent: number }
  >();

  let presentTotal = 0;
  let attendedTotal = 0;
  let scannedToday = 0;

  for (const row of attendanceRows) {
    const evAgg = attByEvent.get(row.eventId) ?? {
      present: 0,
      late: 0,
      absent: 0,
      total: 0,
    };
    evAgg.total += 1;
    if (row.status === "PRESENT") evAgg.present += 1;
    else if (row.status === "LATE") evAgg.late += 1;
    else evAgg.absent += 1;
    attByEvent.set(row.eventId, evAgg);

    if (pastAttendanceEventIds.has(row.eventId)) {
      const p = studentPast.get(row.studentId) ?? { present: 0, late: 0 };
      if (row.status === "PRESENT") p.present += 1;
      else if (row.status === "LATE") p.late += 1;
      studentPast.set(row.studentId, p);
    } else {
      const o = studentOther.get(row.studentId) ?? {
        present: 0,
        late: 0,
        absent: 0,
      };
      if (row.status === "PRESENT") o.present += 1;
      else if (row.status === "LATE") o.late += 1;
      else o.absent += 1;
      studentOther.set(row.studentId, o);
    }

    if (PRESENT_STATUSES.includes(row.status)) {
      presentTotal += 1;
      attendedTotal += 1;
    }
    if (ABSENT_STATUSES.includes(row.status)) attendedTotal += 1;
    if (isSameDay(row.scannedAt, now)) scannedToday += 1;
  }

  const canScan = hasPermission(access, "attendance_scan");
  const canEdit = hasPermission(access, "attendance_edit");

  const eventItems: AttendanceEventItem[] = events.map((e) => {
    const agg = attByEvent.get(e.id) ?? {
      present: 0,
      late: 0,
      absent: 0,
      total: 0,
    };
    const status = eventStatus(e.startsAt, e.endsAt, now);
    const present = agg.present;
    const late = agg.late;
    let absent = agg.absent;
    let total = agg.total;
    if (e.requiresAttendance && status === "past") {
      total = studentRows.length;
      absent = Math.max(0, total - present - late);
    }
    const rate = total ? Math.round(((present + late) / total) * 100) : 0;
    return {
      id: e.id,
      title: e.title,
      location: e.location,
      month: e.startsAt.toLocaleDateString("en-PH", { month: "short" }),
      day: e.startsAt.getDate(),
      scheduleDate: e.startsAt.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
      }),
      scheduleTime: `${e.startsAt.toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
      })} – ${e.endsAt.toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      status,
      present,
      late,
      absent,
      total,
      rate,
      canScan: canScan && e.requiresAttendance && status !== "past",
    };
  });

  const studentItems: AttendanceStudentItem[] = studentRows.map((s) => {
    const past = studentPast.get(s.id) ?? { present: 0, late: 0 };
    const other = studentOther.get(s.id) ?? { present: 0, late: 0, absent: 0 };
    const present = past.present + other.present;
    const late = past.late + other.late;
    const absent =
      Math.max(0, pastAttendanceCount - past.present - past.late) +
      other.absent;
    const total = present + late + absent;
    const rate = total ? Math.round(((present + late) / total) * 100) : 0;
    return {
      id: s.id,
      name: `${s.firstName} ${s.lastName}`.trim(),
      sectionName: s.section?.name ?? "—",
      studentNo: s.studentNo,
      programCode: s.section?.programYear.program.code ?? "—",
      yearLevel: s.section?.programYear.level ?? 0,
      present,
      late,
      absent,
      rate,
    };
  });

  const eventsWithAttendance = eventItems.filter((e) => e.total > 0);
  const totalRecords = attendanceRows.length;
  const expected =
    studentRows.length * eventsWithAttendance.length +
    eventItems.filter((e) => e.status === "live").length * studentRows.length;
  const liveEvent = eventItems.find((e) => e.status === "live");
  const presentRate = totalRecords
    ? Math.round((presentTotal / totalRecords) * 100)
    : 0;

  const stats: AttendanceStats = {
    totalRecords,
    presentRate,
    scannedToday,
    liveEventTitle: liveEvent?.title ?? null,
    expected,
    attended: attendedTotal,
    absences: Math.max(0, expected - attendedTotal),
    termName: activeTerm?.name ?? "Current Term",
    eventCount: eventsWithAttendance.length,
    presentTotal,
  };

  const userName = user?.name ?? "Officer";
  const isSuperAdmin =
    user?.roles.some((r) => r.role.name === "Super Admin") ?? false;
  const roleLabel = isSuperAdmin
    ? "Super Admin"
    : (user?.roles[0]?.role.name ?? "Officer");

  return (
    <AdminShell userName={userName} roleLabel={roleLabel}>
      <AttendanceView
        events={eventItems}
        students={studentItems}
        stats={stats}
        access={{ scan: canScan, edit: canEdit, view: true }}
      />
    </AdminShell>
  );
}
