import { redirect } from "next/navigation";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { AdminShell } from "@/app/components/admin-shell";
import { EventsView } from "@/app/components/events/events-view";
import type { EventItem, EventsStats } from "@/app/components/events/types";

const PRESENT_STATUSES = ["PRESENT", "LATE"];

function eventStatus(startsAt: Date, endsAt: Date, now: Date): "live" | "upcoming" | "past" {
  if (startsAt <= now && now < endsAt) return "live";
  if (startsAt > now) return "upcoming";
  return "past";
}

function formatDayMonth(d: Date) {
  return {
    month: d.toLocaleDateString("en-PH", { month: "short" }),
    day: d.getDate(),
  };
}

function formatSchedule(startsAt: Date, endsAt: Date) {
  const date = startsAt.toLocaleDateString("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const start = startsAt.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
  const end = endsAt.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
  return { date, time: `${start} – ${end}` };
}

function daysUntil(d: Date, now: Date): number {
  return Math.max(0, Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

export default async function AdminEventsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const access = session.access;
  if (!hasPermission(access, "events_view")) redirect("/dashboard");

  const now = new Date();

  const [user, events, programs, activeTerm, attendanceRows, studentCount] =
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
          description: true,
          startsAt: true,
          endsAt: true,
          location: true,
          requiresAttendance: true,
          scanPassword: true,
          programId: true,
          program: { select: { name: true } },
          createdById: true,
          createdBy: { select: { name: true } },
        },
      }),
      prisma.program.findMany({ orderBy: { code: "asc" } }),
      prisma.academicTerm.findFirst({ where: { isActive: true } }),
      prisma.attendance.findMany({ select: { eventId: true, status: true } }),
      prisma.student.count(),
    ]);

  const attByEvent = new Map<string, { total: number; present: number }>();
  let attendanceTotal = 0;
  let presentTotal = 0;
  for (const row of attendanceRows) {
    const agg = attByEvent.get(row.eventId) ?? { total: 0, present: 0 };
    agg.total += 1;
    if (PRESENT_STATUSES.includes(row.status)) agg.present += 1;
    attByEvent.set(row.eventId, agg);
    attendanceTotal += 1;
    if (PRESENT_STATUSES.includes(row.status)) presentTotal += 1;
  }

  const canCreate = hasPermission(access, "events_create");
  const canEdit = hasPermission(access, "events_edit");
  const canDelete = hasPermission(access, "events_delete");
  const isYearRep =
    user?.roles.some((r) => r.role.name === "Year/Program Rep") ?? false;

  const items: EventItem[] = events.map((e) => {
    const agg = attByEvent.get(e.id) ?? { total: 0, present: 0 };
    const rate = agg.total ? Math.round((agg.present / agg.total) * 100) : 0;
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
      attendanceTotal: agg.total,
      attendancePresent: agg.present,
      attendanceRate: agg.total ? rate : null,
      canEdit: canEdit && (!isYearRep || e.createdById === userId),
      canDelete: canDelete && (!isYearRep || e.createdById === userId),
    };
  });

  const stats: EventsStats = {
    total: items.length,
    upcoming: items.filter((e) => e.status === "upcoming").length,
    live: items.filter((e) => e.status === "live").length,
    past: items.filter((e) => e.status === "past").length,
    avgRate: attendanceTotal ? Math.round((presentTotal / attendanceTotal) * 100) : 0,
    presentTotal,
    attendanceTotal,
    studentCount,
    termName: activeTerm?.name ?? "Current Term",
  };

  const userName = user?.name ?? "Officer";
  const isSuperAdmin = user?.roles.some((r) => r.role.name === "Super Admin") ?? false;
  const roleLabel = isSuperAdmin ? "Super Admin" : (user?.roles[0]?.role.name ?? "Officer");

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