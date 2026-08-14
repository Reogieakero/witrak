"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AttendanceStatus, prisma, recomputeSanctionTriggers } from "@fhusocom/db";
import { auth } from "@/auth";
import { hasPermission, studentInScope, type UserAccess } from "@/lib/permissions";

type SessionWithUser = {
  user: { id: string };
  access: UserAccess | null;
};

async function currentSession(): Promise<SessionWithUser> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return { user: { id: session.user.id }, access: session.access ?? null };
}

const VALID_STATUSES: AttendanceStatus[] = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "EXCUSED",
];

export type UpdateAttendanceResult = { ok: boolean; error?: string };

export async function updateAttendanceStatus(input: {
  eventId: string;
  studentId: string;
  status: string;
}): Promise<UpdateAttendanceResult> {
  const session = await currentSession();
  const access = session.access;
  if (!hasPermission(access, "attendance_edit")) {
    return { ok: false, error: "Missing permission: attendance.edit." };
  }

  const status = input.status.toUpperCase() as AttendanceStatus;
  if (!VALID_STATUSES.includes(status)) {
    return { ok: false, error: "Invalid attendance status." };
  }

  const student = await prisma.student.findFirst({
    where: {
      id: input.studentId,
      ...(access ? studentInScope(access) : {}),
    },
    select: {
      id: true,
      suspended: true,
      sectionId: true,
      user: { select: { roles: { select: { id: true } } } },
    },
  });
  if (!student) {
    return { ok: false, error: "Student not found or outside your scope." };
  }

  if (student.suspended) {
    return { ok: false, error: "Member is suspended and cannot check in." };
  }

  if (student.sectionId === null && (student.user?.roles.length ?? 0) === 0) {
    const removed = await prisma.auditLog.findFirst({
      where: {
        action: "MEMBER_AUTHORIZATION_REMOVED",
        targetId: input.studentId,
      },
      select: { id: true },
    });
    if (removed) {
      return {
        ok: false,
        error: "Member authorization has been removed and cannot check in.",
      };
    }
  }

  const existing = await prisma.attendance.findUnique({
    where: {
      eventId_studentId: {
        eventId: input.eventId,
        studentId: input.studentId,
      },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.attendance.update({
      where: { id: existing.id },
      data: { status },
    });
  } else {
    await prisma.attendance.create({
      data: {
        eventId: input.eventId,
        studentId: input.studentId,
        status,
        scannedById: session.user.id,
        scannedAt: new Date(),
      },
    });
  }

  await recomputeSanctionTriggers(input.studentId);

  revalidatePath("/admin/attendance");
  return { ok: true };
}
