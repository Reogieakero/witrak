"use server";

import { revalidatePath } from "next/cache";
import { prisma, AuditAction, backfillSanctionRule } from "@fhusocom/db";
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

export type CreateSanctionRuleInput = {
  absenceThreshold: number;
  scopeType: "FACULTY" | "PROGRAM" | "PROGRAM_YEAR" | "SECTION";
  programId?: string;
  programYearId?: string;
  sectionId?: string;
  period: "SEMESTER" | "EVENT_SERIES";
  active: boolean;
};

export async function createSanctionRule(
  input: CreateSanctionRuleInput,
): Promise<{ ok: boolean; error?: string }> {
  const session = await currentSession();
  if (!hasPermission(session.access, "sanctions_create")) {
    return { ok: false, error: "Missing permission: sanctions.create." };
  }

  const threshold = Number(input.absenceThreshold);
  if (!Number.isInteger(threshold) || threshold < 1 || threshold > 100) {
    return {
      ok: false,
      error: "Absence threshold must be a whole number between 1 and 100.",
    };
  }

  const rule = await prisma.sanctionRule.create({
    data: {
      absenceThreshold: threshold,
      scopeType: input.scopeType,
      programId: input.scopeType === "PROGRAM" ? (input.programId ?? null) : null,
      programYearId:
        input.scopeType === "PROGRAM_YEAR" ? (input.programYearId ?? null) : null,
      sectionId: input.scopeType === "SECTION" ? (input.sectionId ?? null) : null,
      period: input.period,
      active: input.active,
    },
  });

  if (input.active) {
    await backfillSanctionRule(rule.id);
  }

  await invalidateByPrefix("sanctions:");
  revalidatePath("/admin/sanctions");
  return { ok: true };
}

export type UpdateSanctionRuleInput = CreateSanctionRuleInput & { id: string };
export async function updateSanctionRule(
  input: UpdateSanctionRuleInput,
): Promise<{ ok: boolean; error?: string }> {
  const session = await currentSession();
  if (!hasPermission(session.access, "sanctions_create")) {
    return { ok: false, error: "Missing permission: sanctions.create." };
  }

  const threshold = Number(input.absenceThreshold);
  if (!Number.isInteger(threshold) || threshold < 1 || threshold > 100) {
    return {
      ok: false,
      error: "Absence threshold must be a whole number between 1 and 100.",
    };
  }

  const rule = await prisma.sanctionRule.findUnique({ where: { id: input.id } });
  if (!rule) return { ok: false, error: "Sanction rule not found." };

  await prisma.sanctionRule.update({
    where: { id: rule.id },
    data: {
      absenceThreshold: threshold,
      scopeType: input.scopeType,
      programId: input.scopeType === "PROGRAM" ? (input.programId ?? null) : null,
      programYearId:
        input.scopeType === "PROGRAM_YEAR" ? (input.programYearId ?? null) : null,
      sectionId: input.scopeType === "SECTION" ? (input.sectionId ?? null) : null,
      period: input.period,
      active: input.active,
    },
  });

  if (input.active) {
    await backfillSanctionRule(rule.id);
  }

  await invalidateByPrefix("sanctions:");
  revalidatePath("/admin/sanctions");
  return { ok: true };
}

export async function deleteSanctionRule(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await currentSession();
  if (!hasPermission(session.access, "sanctions_create")) {
    return { ok: false, error: "Missing permission: sanctions.create." };
  }

  const rule = await prisma.sanctionRule.findUnique({ where: { id } });
  if (!rule) return { ok: false, error: "Sanction rule not found." };

  await prisma.$transaction(async (tx) => {
    const sanctions = await tx.sanction.findMany({
      where: { ruleId: id },
      select: { id: true },
    });
    const sanctionIds = sanctions.map((s) => s.id);

    if (sanctionIds.length) {
      await tx.sanctionEvidence.deleteMany({
        where: { sanctionId: { in: sanctionIds } },
      });
    }
    await tx.sanction.deleteMany({ where: { ruleId: id } });
    await tx.sanctionFlag.deleteMany({ where: { ruleId: id } });
    await tx.sanctionRule.delete({ where: { id } });
  });

  await invalidateByPrefix("sanctions:");
  revalidatePath("/admin/sanctions");
  return { ok: true };
}
