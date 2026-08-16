"use server";

import { revalidatePath } from "next/cache";
import { prisma, AuditAction, recomputeSanctionTriggers } from "@fhusocom/db";
import { auth } from "@/auth";
import { hasPermission, type UserAccess } from "@/lib/permissions";
import { invalidateByPrefix } from "@/lib/cache";

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

function studentInScopeOf(
  access: UserAccess | null,
  sectionId: string | null | undefined,
): boolean {
  if (!access) return false;
  const scope = access.scopeSectionIds;
  if (scope === null) return true;
  return !!sectionId && scope.includes(sectionId);
}

export type ResolveSanctionInput = {
  sanctionId: string;
};

export async function resolveSanction(
  input: ResolveSanctionInput,
): Promise<{ ok: boolean; error?: string }> {
  const session = await currentSession();
  if (!hasPermission(session.access, "sanctions_resolve")) {
    return { ok: false, error: "Missing permission: sanctions.resolve." };
  }

  const sanction = await prisma.sanction.findUnique({
    where: { id: input.sanctionId },
    include: { student: { select: { sectionId: true } } },
  });
  if (!sanction) return { ok: false, error: "Sanction not found." };
  if (!studentInScopeOf(session.access, sanction.student.sectionId)) {
    return { ok: false, error: "Sanction is outside your scope." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.sanction.update({
      where: { id: sanction.id },
      data: {
        status: "RESOLVED",
        resolvedById: session.user.id,
        resolvedAt: new Date(),
        resolvedNote: "Cleared",
      },
    });

    await tx.auditLog.create({
      data: {
        action: AuditAction.SANCTION_RESOLVED,
        actorId: session.user.id,
        targetId: sanction.id,
        details: { outcome: "Cleared" },
      },
    });
  });

  await invalidateByPrefix("sanctions:");
  revalidatePath("/admin/sanctions");
  return { ok: true };
}

export type UpdateSanctionInput = {
  sanctionId: string;
  title: string;
  reason: string;
};

export async function updateSanction(
  input: UpdateSanctionInput,
): Promise<{ ok: boolean; error?: string }> {
  const session = await currentSession();
  if (!hasPermission(session.access, "sanctions_create")) {
    return { ok: false, error: "Missing permission: sanctions.create." };
  }

  const sanction = await prisma.sanction.findUnique({
    where: { id: input.sanctionId },
    include: { student: { select: { sectionId: true } } },
  });
  if (!sanction) return { ok: false, error: "Sanction not found." };
  if (!studentInScopeOf(session.access, sanction.student.sectionId)) {
    return { ok: false, error: "Sanction is outside your scope." };
  }

  await prisma.sanction.update({
    where: { id: sanction.id },
    data: {
      title: input.title?.trim() || sanction.title,
      reason: input.reason?.trim() || sanction.reason,
    },
  });

  await invalidateByPrefix("sanctions:");
  revalidatePath("/admin/sanctions");
  return { ok: true };
}

export async function recomputeSanctions(): Promise<{
  ok: boolean;
  error?: string;
  created: number;
  updated: number;
}> {
  const session = await currentSession();
  if (!hasPermission(session.access, "sanctions_create")) {
    return { ok: false, error: "Missing permission: sanctions.create.", created: 0, updated: 0 };
  }

  const scopeSectionIds = session.access?.scopeSectionIds ?? null;
  const studentWhere = scopeSectionIds
    ? { sectionId: { in: scopeSectionIds } }
    : {};
  const students = await prisma.student.findMany({
    where: studentWhere,
    select: { id: true },
  });

  let created = 0;
  let updated = 0;
  for (const s of students) {
    const result = await recomputeSanctionTriggers(s.id);
    if (result === "created") created += 1;
    else if (result === "updated") updated += 1;
  }

  await invalidateByPrefix("sanctions:");
  revalidatePath("/admin/sanctions");
  return { ok: true, created, updated };
}
