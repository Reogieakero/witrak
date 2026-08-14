"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { hasPermission, type UserAccess } from "@/lib/permissions";
import { TERM_REVALIDATE_PATHS } from "@/lib/terms";

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

function requireSuperAdmin(access: UserAccess | null): string | null {
  if (!hasPermission(access, "users_manage_roles")) {
    return "Missing permission: terms.manage.";
  }
  return null;
}

export type PeriodType = "SEMESTER" | "EVENT_SERIES";

export type TermRow = {
  id: string;
  name: string;
  periodType: PeriodType;
  startsOn: string;
  endsOn: string;
  isActive: boolean;
};

function revalidateTerms() {
  for (const path of TERM_REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

export async function getTerms(): Promise<TermRow[]> {
  const session = await currentSession();
  const err = requireSuperAdmin(session.access);
  if (err) throw new Error(err);

  const terms = await prisma.academicTerm.findMany({
    orderBy: [{ startsOn: "desc" }],
  });

  return terms.map((t) => ({
    id: t.id,
    name: t.name,
    periodType: t.periodType,
    startsOn: t.startsOn.toISOString(),
    endsOn: t.endsOn.toISOString(),
    isActive: t.isActive,
  }));
}

export type CreateTermInput = {
  name: string;
  periodType: PeriodType;
  startsOn: string;
  endsOn: string;
  setActive: boolean;
};

export async function createTerm(
  input: CreateTermInput,
): Promise<{ ok: boolean; error?: string }> {
  const session = await currentSession();
  const err = requireSuperAdmin(session.access);
  if (err) return { ok: false, error: err };

  const name = String(input.name ?? "").trim();
  if (!name) return { ok: false, error: "Term name is required." };

  const startsOn = new Date(input.startsOn);
  const endsOn = new Date(input.endsOn);
  if (Number.isNaN(startsOn.getTime()) || Number.isNaN(endsOn.getTime())) {
    return { ok: false, error: "Valid start and end dates are required." };
  }
  if (endsOn < startsOn) {
    return { ok: false, error: "End date must be on or after the start date." };
  }

  const existing = await prisma.academicTerm.findUnique({ where: { name } });
  if (existing) {
    return { ok: false, error: `A term named "${name}" already exists.` };
  }

  if (input.setActive) {
    await prisma.academicTerm.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });
  }

  await prisma.academicTerm.create({
    data: {
      name,
      periodType: input.periodType,
      startsOn,
      endsOn,
      isActive: Boolean(input.setActive),
    },
  });

  revalidateTerms();
  return { ok: true };
}

export async function setActiveTerm(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await currentSession();
  const err = requireSuperAdmin(session.access);
  if (err) return { ok: false, error: err };

  const term = await prisma.academicTerm.findUnique({ where: { id } });
  if (!term) return { ok: false, error: "Term not found." };

  await prisma.$transaction([
    prisma.academicTerm.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    }),
    prisma.academicTerm.update({ where: { id }, data: { isActive: true } }),
  ]);

  revalidateTerms();
  return { ok: true };
}

export async function deleteTerm(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await currentSession();
  const err = requireSuperAdmin(session.access);
  if (err) return { ok: false, error: err };

  const term = await prisma.academicTerm.findUnique({ where: { id } });
  if (!term) return { ok: false, error: "Term not found." };

  await prisma.academicTerm.delete({ where: { id } });

  revalidateTerms();
  return { ok: true };
}
