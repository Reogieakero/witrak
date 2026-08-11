"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { hasPermission, type UserAccess } from "@/lib/permissions";

export type SaveEventState = { ok: boolean; error?: string };

type SessionWithUser = {
  user: { id: string };
  access: UserAccess | null;
};

async function currentSession(): Promise<SessionWithUser> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
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
  const startsAt = (formData.get("startsAt") as string) || null;
  const endsAt = (formData.get("endsAt") as string) || null;
  const location = ((formData.get("location") as string) ?? "").trim() || null;
  const requiresAttendance = formData.get("requiresAttendance") === "on";

  if (!title || !startsAt || !endsAt) {
    return { ok: false, error: "Title, start, and end are required." };
  }
  const startDate = new Date(startsAt);
  const endDate = new Date(endsAt);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { ok: false, error: "Invalid date/time values." };
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
        requiresAttendance,
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
        requiresAttendance,
        createdById: session.user.id,
      },
    });
  }

  revalidatePath("/admin/events");
  return { ok: true };
}

export async function deleteEvent(eventId: string): Promise<void> {
  const session = await currentSession();
  if (!hasPermission(session.access, "events_delete")) return;

  const existing = await prisma.event.findUnique({ where: { id: eventId } });
  if (!existing) return;
  if ((await isYearRep(session.user.id)) && existing.createdById !== session.user.id) return;

  await prisma.attendance.deleteMany({ where: { eventId } });
  await prisma.event.delete({ where: { id: eventId } });
  revalidatePath("/admin/events");
}