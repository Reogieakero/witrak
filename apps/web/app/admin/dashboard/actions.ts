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
  return { user: { id: session.user.id }, access: session.access ?? null };
}

export type EnrollmentTargetInput = {
  programId: string;
  count: number;
};

export async function updateEnrollmentTargets(
  entries: EnrollmentTargetInput[],
): Promise<{ ok: boolean; error?: string }> {
  const session = await currentSession();
  if (!hasPermission(session.access, "users_manage_roles")) {
    return { ok: false, error: "Missing permission: dashboard.enrollment_targets." };
  }

  if (!Array.isArray(entries) || entries.length === 0) {
    return { ok: false, error: "No program totals were provided." };
  }

  for (const entry of entries) {
    const count = Number(entry.count);
    if (!Number.isInteger(count) || count < 0) {
      return { ok: false, error: "Student totals must be whole numbers of 0 or more." };
    }
  }

  await prisma.$transaction(
    entries.map((entry) =>
      prisma.program.update({
        where: { id: entry.programId },
        data: { enrollmentTarget: Number(entry.count) },
      }),
    ),
  );

  revalidatePath("/admin/dashboard");
  return { ok: true };
}