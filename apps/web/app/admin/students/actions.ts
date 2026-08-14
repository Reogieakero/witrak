"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { hasPermission, type UserAccess } from "@/lib/permissions";

type SessionWithUser = {
  user: { id: string };
  access: UserAccess | null;
};

async function currentSession(): Promise<SessionWithUser> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    throw new Error("Your session is no longer valid. Please sign out and sign in again.");
  }

  return { user: { id: session.user.id }, access: session.access ?? null };
}

export async function suspendStudentAccount(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await currentSession();
  if (!hasPermission(session.access, "users_manage_roles")) {
    return { ok: false, error: "Missing permission: users.manage_roles." };
  }

  const student = await prisma.student.findUnique({
    where: { id },
    include: { user: { select: { id: true } } },
  });
  if (!student) return { ok: false, error: "Student not found." };
  if (!student.user) {
    return { ok: false, error: "This student does not have an account yet." };
  }

  const suspended = !student.suspended;

  await prisma.$transaction([
    prisma.student.update({ where: { id }, data: { suspended } }),
    prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: suspended ? "MEMBER_SUSPENDED" : "MEMBER_REINSTATED",
        targetId: id,
        details: { member: `${student.firstName} ${student.lastName}`.trim() },
      },
    }),
  ]);

  revalidatePath("/admin/students");
  return { ok: true };
}