"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { hasPermission, type UserAccess } from "@/lib/permissions";
import { invalidateByPrefix } from "@/lib/cache";

export type SaveEventState = { ok: boolean; error?: string };

function combineDateTime(date: string, time: string): Date | null {
  if (!date || !time) return null;
  const d = new Date(`${date}T${time}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

type SessionWithUser = {
  user: { id: string };
  access: UserAccess | null;
};

async function currentSession(): Promise<SessionWithUser> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login/officers");
  return { user: { id: session.user.id }, access: session.access ?? null };
}

async function isYearRep(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: { include: { role: { select: { name: true } } } } },
  });
  return user?.roles.some((r) => r.role.name === "Year/Program Rep") ?? false;
}

export async function saveEvent(
  _prev: SaveEventState,
  formData: FormData,
): Promise<SaveEventState> {
  const session = await currentSession();

  const id = ((formData.get("id") as string) ?? "").trim() || null;
  const title = ((formData.get("title") as string) ?? "").trim();
  const description = ((formData.get("description") as string) ?? "").trim() || null;
  const startsAt = combineDateTime(
    (formData.get("eventDate") as string) ?? "",
    (formData.get("startTime") as string) ?? "",
  );
  const endsAt = combineDateTime(
    (formData.get("eventDate") as string) ?? "",
    (formData.get("endTime") as string) ?? "",
  );
  const location = ((formData.get("location") as string) ?? "").trim() || null;
  const programId = ((formData.get("programId") as string) ?? "").trim() || null;
  const requiresAttendance = formData.get("requiresAttendance") === "on";
  const scanPassword = ((formData.get("scanPassword") as string) ?? "").trim() || null;

  if (!title || !startsAt || !endsAt) {
    return { ok: false, error: "Title, start, and end are required." };
  }
  if (requiresAttendance && !scanPassword) {
    return { ok: false, error: "Event password is required when attendance is enabled." };
  }
  const startDate = startsAt;
  const endDate = endsAt;
  if (!startDate || !endDate) {
    return { ok: false, error: "Title, start, and end are required." };
  }
  if (endDate <= startDate) {
    return { ok: false, error: "End must be after start." };
  }

  if (id) {
    if (!hasPermission(session.access, "events_edit")) {
      return { ok: false, error: "Missing permission: events.edit." };
    }
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) return { ok: false, error: "Event not found." };
    if ((await isYearRep(session.user.id)) && existing.createdById !== session.user.id) {
      return { ok: false, error: "Year Reps can only edit events they created." };
    }
    await prisma.event.update({
      where: { id },
      data: {
        title,
        description,
        startsAt: startDate,
        endsAt: endDate,
        location,
        programId,
        requiresAttendance,
        scanPassword,
      },
    });
  } else {
    if (!hasPermission(session.access, "events_create")) {
      return { ok: false, error: "Missing permission: events.create." };
    }
    await prisma.event.create({
      data: {
        title,
        description,
        startsAt: startDate,
        endsAt: endDate,
        location,
        programId,
        requiresAttendance,
        scanPassword,
        createdById: session.user.id,
      },
    });
  }

  await invalidateByPrefix("events:list:");
  revalidatePath("/admin/events");
  return { ok: true };
}

export async function deleteEvent(
  eventId: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await currentSession();
  if (!hasPermission(session.access, "events_delete")) {
    return { ok: false, error: "Missing permission: events.delete." };
  }

  const existing = await prisma.event.findUnique({ where: { id: eventId } });
  if (!existing) return { ok: false, error: "Event not found." };
  if ((await isYearRep(session.user.id)) && existing.createdById !== session.user.id) {
    return { ok: false, error: "Year Reps can only delete events they created." };
  }

  await prisma.$transaction(async (tx) => {
    const attendanceRows = await tx.attendance.findMany({
      where: { eventId },
      select: { id: true },
    });
    if (attendanceRows.length > 0) {
      await tx.sanctionEvidence.deleteMany({
        where: { attendanceId: { in: attendanceRows.map((a) => a.id) } },
      });
    }
    await tx.attendance.deleteMany({ where: { eventId } });
    await tx.event.delete({ where: { id: eventId } });
  });
  await invalidateByPrefix("events:list:");
  revalidatePath("/admin/events");
  return { ok: true };
}