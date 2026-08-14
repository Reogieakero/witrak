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

function requireSuperAdmin(access: UserAccess | null): string | null {
  if (!hasPermission(access, "users_manage_roles")) {
    return "Missing permission: programs.manage.";
  }
  return null;
}

export type ProgramRow = {
  id: string;
  code: string;
  name: string;
  yearLevels: {
    id: string;
    level: number;
    sections: { id: string; name: string }[];
  }[];
};

export async function getProgramStructure(): Promise<ProgramRow[]> {
  const session = await currentSession();
  const err = requireSuperAdmin(session.access);
  if (err) throw new Error(err);

  const programs = await prisma.program.findMany({
    orderBy: { code: "asc" },
    include: {
      yearLevels: {
        orderBy: { level: "asc" },
        include: { sections: { orderBy: { name: "asc" } } },
      },
    },
  });

  return programs.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    yearLevels: p.yearLevels.map((yl) => ({
      id: yl.id,
      level: yl.level,
      sections: yl.sections.map((s) => ({ id: s.id, name: s.name })),
    })),
  }));
}

export type CreateProgramInput = {
  code: string;
  name: string;
};

export async function createProgram(
  input: CreateProgramInput,
): Promise<{ ok: boolean; error?: string }> {
  const session = await currentSession();
  const err = requireSuperAdmin(session.access);
  if (err) return { ok: false, error: err };

  const code = String(input.code ?? "").trim().toUpperCase();
  const name = String(input.name ?? "").trim();
  if (!code) return { ok: false, error: "Program code is required." };
  if (!name) return { ok: false, error: "Program name is required." };

  const existing = await prisma.program.findUnique({ where: { code } });
  if (existing) {
    return { ok: false, error: `A program with code "${code}" already exists.` };
  }

  await prisma.$transaction(async (tx) => {
    const program = await tx.program.create({ data: { code, name } });
    await tx.yearLevel.createMany({
      data: [1, 2, 3, 4].map((level) => ({
        programId: program.id,
        level,
      })),
    });
  });

  revalidatePath("/admin/dashboard");
  return { ok: true };
}

export type UpdateProgramInput = {
  id: string;
  code: string;
  name: string;
};

export async function updateProgram(
  input: UpdateProgramInput,
): Promise<{ ok: boolean; error?: string }> {
  const session = await currentSession();
  const err = requireSuperAdmin(session.access);
  if (err) return { ok: false, error: err };

  const code = String(input.code ?? "").trim().toUpperCase();
  const name = String(input.name ?? "").trim();
  if (!code) return { ok: false, error: "Program code is required." };
  if (!name) return { ok: false, error: "Program name is required." };

  const program = await prisma.program.findUnique({ where: { id: input.id } });
  if (!program) return { ok: false, error: "Program not found." };

  const duplicate = await prisma.program.findFirst({
    where: { code, id: { not: input.id } },
  });
  if (duplicate) {
    return { ok: false, error: `A program with code "${code}" already exists.` };
  }

  await prisma.program.update({
    where: { id: input.id },
    data: { code, name },
  });

  revalidatePath("/admin/dashboard");
  return { ok: true };
}

export async function deleteProgram(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await currentSession();
  const err = requireSuperAdmin(session.access);
  if (err) return { ok: false, error: err };

  const program = await prisma.program.findUnique({ where: { id } });
  if (!program) return { ok: false, error: "Program not found." };

  const sectionCount = await prisma.section.count({
    where: { programYear: { programId: id } },
  });
  const studentCount = await prisma.student.count({
    where: { section: { programYear: { programId: id } } },
  });

  if (sectionCount > 0 || studentCount > 0) {
    return {
      ok: false,
      error:
        "This program still has sections or students. Remove them before deleting the program.",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.yearLevel.deleteMany({ where: { programId: id } });
    await tx.program.delete({ where: { id } });
  });

  revalidatePath("/admin/dashboard");
  return { ok: true };
}

export type CreateSectionInput = {
  programYearId: string;
  name: string;
};

export async function createSection(
  input: CreateSectionInput,
): Promise<{ ok: boolean; error?: string }> {
  const session = await currentSession();
  const err = requireSuperAdmin(session.access);
  if (err) return { ok: false, error: err };

  const name = String(input.name ?? "").trim().toUpperCase();
  if (!name) return { ok: false, error: "Section name is required." };

  const yearLevel = await prisma.yearLevel.findUnique({
    where: { id: input.programYearId },
  });
  if (!yearLevel) return { ok: false, error: "Year level not found." };

  const existing = await prisma.section.findUnique({
    where: { programYearId_name: { programYearId: input.programYearId, name } },
  });
  if (existing) {
    return { ok: false, error: `Section "${name}" already exists here.` };
  }

  await prisma.section.create({
    data: { programYearId: input.programYearId, name },
  });

  revalidatePath("/admin/dashboard");
  return { ok: true };
}

export type UpdateSectionInput = {
  id: string;
  name: string;
};

export async function updateSection(
  input: UpdateSectionInput,
): Promise<{ ok: boolean; error?: string }> {
  const session = await currentSession();
  const err = requireSuperAdmin(session.access);
  if (err) return { ok: false, error: err };

  const name = String(input.name ?? "").trim().toUpperCase();
  if (!name) return { ok: false, error: "Section name is required." };

  const section = await prisma.section.findUnique({
    where: { id: input.id },
    select: { id: true, programYearId: true },
  });
  if (!section) return { ok: false, error: "Section not found." };

  const existing = await prisma.section.findFirst({
    where: {
      programYearId: section.programYearId,
      name,
      id: { not: input.id },
    },
  });
  if (existing) {
    return { ok: false, error: `Section "${name}" already exists here.` };
  }

  await prisma.section.update({
    where: { id: input.id },
    data: { name },
  });

  revalidatePath("/admin/dashboard");
  return { ok: true };
}

export async function deleteSection(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await currentSession();
  const err = requireSuperAdmin(session.access);
  if (err) return { ok: false, error: err };

  const section = await prisma.section.findUnique({ where: { id } });
  if (!section) return { ok: false, error: "Section not found." };

  const studentCount = await prisma.student.count({
    where: { sectionId: id },
  });
  if (studentCount > 0) {
    return {
      ok: false,
      error:
        "This section still has students assigned. Reassign them before deleting the section.",
    };
  }

  await prisma.section.delete({ where: { id } });

  revalidatePath("/admin/dashboard");
  return { ok: true };
}