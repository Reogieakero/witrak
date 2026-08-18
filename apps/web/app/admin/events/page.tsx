import { redirect } from "next/navigation";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { AdminShell } from "@/app/components/admin-shell";
import { EventsView } from "@/app/components/events/events-view";
import { getTermContext, eventInTerm } from "@/lib/terms";
import { cached, CACHE_TTL } from "@/lib/cache";
import type { EventItem, EventsStats } from "@/app/components/events/types";

const PRESENT_STATUSES = ["PRESENT", "LATE"];

function isPartial(r: {
  checkedInAt: Date | null;
  checkedOutAt: Date | null;
}): boolean {
  return !!r.checkedInAt !== !!r.checkedOutAt;
}

function eventStatus(startsAt: Date, endsAt: Date, now: Date): "live" | "upcoming" | "past" {
  if (startsAt <= now && now < endsAt) return "live";
  if (startsAt > now) return "upcoming";
  return "past";
}

function formatDayMonth(d: Date) {
  return {
    month: d.toLocaleDateString("en-PH", { month: "short", timeZone: "Asia/Manila" }),
    day: Number(
      d.toLocaleDateString("en-PH", { day: "numeric", timeZone: "Asia/Manila" }),
    ),
  };
}

function formatSchedule(startsAt: Date, endsAt: Date) {
  const date = startsAt.toLocaleDateString("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  });
  const start = startsAt.toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  });
  const end = endsAt.toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  });
  return { date, time: `${start} – ${end}` };
}

function daysUntil(d: Date, now: Date): number {
  return Math.max(0, Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

export default async function AdminEventsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login/officers");
  const userId = session.user.id;

  const access = session.access;
  if (!hasPermission(access, "events_view")) redirect("/dashboard");

  const now = new Date();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      roles: { include: { role: { select: { name: true } } } },
    },
  });
  const isYearRep =
    user?.roles.some((r) => r.role.name === "Year/Program Rep") ?? false;
  const canCreate = hasPermission(access, "events_create");
  const canEdit = hasPermission(access, "events_edit");
  const canDelete = hasPermission(access, "events_delete");

  const { term } = await getTermContext();
  const termKey = term?.id ?? "none";

  const { items, stats, programs } = await cached(
    `events:list:${termKey}:${userId}`,
    CACHE_TTL.MEDIUM,
    async () => {
      const [events, programs, studentCount, sectionProgramRows] =
        await Promise.all([
          prisma.event.findMany({
            where: eventInTerm(term),
            orderBy: { startsAt: "desc" },
            select: {
              id: true,
              title: true,
              description: true,
              startsAt: true,
              endsAt: true,
              location: true,
              requiresAttendance: true,
              scanPassword: true,
              hasTimeInOut: true,
              lateGraceMinutes: true,
              timeIn: true,
              timeOut: true,
              programId: true,
              program: { select: { name: true } },
              createdById: true,
              createdBy: { select: { name: true } },
            },
          }),
          prisma.program.findMany({ orderBy: { code: "asc" } }),
          prisma.student.count(),
          prisma.section.findMany({
            select: {
              programYear: { select: { programId: true } },
              _count: { select: { students: true } },
            },
          }),
        ]);

      const attendanceRows = events.length
        ? await prisma.attendance.findMany({
            where: { eventId: { in: events.map((e) => e.id) } },
            select: {
              eventId: true,
              status: true,
              checkedInAt: true,
              checkedOutAt: true,
            },
          })
        : [];

      const termEventIds = new Set(events.map((e) => e.id));

      const programStudentCount = new Map<string, number>();
      for (const s of sectionProgramRows) {
        const pid = s.programYear.programId;
        if (pid) {
          programStudentCount.set(
            pid,
            (programStudentCount.get(pid) ?? 0) + s._count.students,
          );
        }
      }
      const programTargetById = new Map(programs.map((p) => [p.id, p.enrollmentTarget]));
      const targetTotal = programs.reduce((sum, p) => sum + (p.enrollmentTarget ?? 0), 0);
      const hasTargets = programs.some((p) => p.enrollmentTarget != null);
      const displayedTotalStudents = hasTargets ? targetTotal : studentCount;

      const expectedForEvent = (programId: string | null) => {
        if (programId) {
          return programTargetById.get(programId) ?? programStudentCount.get(programId) ?? 0;
        }
        return displayedTotalStudents;
      };

      const presentByEvent = new Map<string, number>();
      const rowCountByEvent = new Map<string, number>();
      let presentTotal = 0;
      for (const row of attendanceRows) {
        if (!termEventIds.has(row.eventId)) continue;
        rowCountByEvent.set(row.eventId, (rowCountByEvent.get(row.eventId) ?? 0) + 1);
        if (PRESENT_STATUSES.includes(row.status) && !isPartial(row)) {
          presentByEvent.set(row.eventId, (presentByEvent.get(row.eventId) ?? 0) + 1);
          presentTotal += 1;
        }
      }

      const expectedTotal = [...events].reduce(
        (sum, e) => (rowCountByEvent.get(e.id) ? sum + expectedForEvent(e.programId) : sum),
        0,
      );

      const items: EventItem[] = events.map((e) => {
        const expected = expectedForEvent(e.programId);
        const present = presentByEvent.get(e.id) ?? 0;
        const hasRows = (rowCountByEvent.get(e.id) ?? 0) > 0;
        const rate = hasRows && expected ? Math.round((present / expected) * 100) : 0;
        const status = eventStatus(e.startsAt, e.endsAt, now);
        const schedule = formatSchedule(e.startsAt, e.endsAt);
        const dm = formatDayMonth(e.startsAt);
        return {
          id: e.id,
          title: e.title,
          description: e.description,
          location: e.location,
          requiresAttendance: e.requiresAttendance,
          scanPassword: e.scanPassword,
          hasTimeInOut: e.hasTimeInOut,
          lateGraceMinutes: e.lateGraceMinutes,
          timeIn: e.timeIn?.toISOString() ?? null,
          timeOut: e.timeOut?.toISOString() ?? null,
          programId: e.programId,
          programName: e.program?.name ?? null,
          createdByName: e.createdBy.name,
          startsAt: e.startsAt.toISOString(),
          endsAt: e.endsAt.toISOString(),
          month: dm.month,
          day: dm.day,
          scheduleDate: schedule.date,
          scheduleTime: schedule.time,
          status,
          daysUntil: status === "upcoming" ? daysUntil(e.startsAt, now) : null,
          attendanceTotal: hasRows ? expected : 0,
          attendancePresent: present,
          attendanceRate: hasRows && expected ? rate : null,
          canEdit: canEdit && (!isYearRep || e.createdById === userId),
          canDelete: canDelete && (!isYearRep || e.createdById === userId),
        };
      });

      const stats: EventsStats = {
        total: items.length,
        upcoming: items.filter((e) => e.status === "upcoming").length,
        live: items.filter((e) => e.status === "live").length,
        past: items.filter((e) => e.status === "past").length,
        avgRate: expectedTotal ? Math.round((presentTotal / expectedTotal) * 100) : 0,
        presentTotal,
        attendanceTotal: expectedTotal,
        studentCount,
        termName: term?.name ?? "Current Term",
      };

      return { items, stats, programs };
    },
  );

  const userName = user?.name ?? "Officer";
  const isSuperAdmin = user?.roles.some((r) => r.role.name === "Super Admin") ?? false;
  const roleLabel = isSuperAdmin ? "Supreme" : (user?.roles[0]?.role.name ?? "Officer");

  return (
    <AdminShell userName={userName} roleLabel={roleLabel}>
      <EventsView
        items={items}
        stats={stats}
        access={{ create: canCreate, edit: canEdit, delete: canDelete, yearRep: isYearRep }}
        programs={programs}
      />
    </AdminShell>
  );
}