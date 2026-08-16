"use server";

import { revalidatePath } from "next/cache";
import { prisma, recomputeSanctionTriggers } from "@fhusocom/db";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { invalidateByPrefix } from "@/lib/cache";

export type SanctionFineRow = {
  absenceCount: number;
  title: string;
  description: string;
};

export async function saveSanctionFines(
  rows: SanctionFineRow[],
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized." };
  if (!hasPermission(session.access, "sanctions_create")) {
    return { ok: false, error: "Missing permission: sanctions.create." };
  }

  const cleaned = rows
    .map((r) => ({
      absenceCount: Number(r.absenceCount),
      title: String(r.title ?? "").trim(),
      description: String(r.description ?? "").trim(),
    }))
    .filter(
      (r) =>
        Number.isInteger(r.absenceCount) &&
        r.absenceCount >= 1 &&
        r.absenceCount <= 99 &&
        r.title.length > 0,
    );

  if (cleaned.length === 0) {
    return { ok: false, error: "No valid sanction requirements to save." };
  }

  try {
    await prisma.$transaction(
      cleaned.map((r) =>
        prisma.sanctionFine.upsert({
          where: { absenceCount: r.absenceCount },
          create: r,
          update: { title: r.title, description: r.description },
        }),
      ),
    );

    // Re-resolve every in-scope student's sanction against the updated
    // catalog so sanctions always reflect the current absence-count fines.
    const scopeSectionIds = session.access?.scopeSectionIds ?? null;
    const students = await prisma.student.findMany({
      where: scopeSectionIds ? { sectionId: { in: scopeSectionIds } } : {},
      select: { id: true },
    });
    for (const s of students) {
      await recomputeSanctionTriggers(s.id);
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not save sanction requirements.",
    };
  }

  await invalidateByPrefix("sanctions:");
  revalidatePath("/admin/sanctions");
  return { ok: true };
}
