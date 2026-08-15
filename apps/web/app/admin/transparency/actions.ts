"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@fhusocom/db";
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

export async function deleteTransparencyFile(
  fileId: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await currentSession();

  if (!hasPermission(session.access, "transparency_delete")) {
    return { ok: false, error: "Missing permission: transparency.delete." };
  }

  const existing = await prisma.transparencyFile.findUnique({ where: { id: fileId } });
  if (!existing) {
    return { ok: false, error: "File not found." };
  }

  await prisma.transparencyFile.delete({ where: { id: fileId } });
  await invalidateByPrefix("transparency:");
  revalidatePath("/admin/transparency");
  return { ok: true };
}
