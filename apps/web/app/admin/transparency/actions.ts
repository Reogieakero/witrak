"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { hasPermission, type UserAccess } from "@/lib/permissions";

export type UploadTransparencyState = { ok: boolean; error?: string };

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

export async function uploadTransparencyFile(formData: FormData): Promise<UploadTransparencyState> {
  const session = await currentSession();

  if (!hasPermission(session.access, "transparency_upload")) {
    return { ok: false, error: "Missing permission: transparency.upload." };
  }

  const title = ((formData.get("title") as string) ?? "").trim();
  const category = ((formData.get("category") as string) ?? "").trim() || "reports";
  const file = formData.get("file") as File | null;

  if (!title) {
    return { ok: false, error: "Title is required." };
  }

  let fileUrl = "/placeholder-document.pdf";
  if (file && file.size > 0) {
    fileUrl = `/uploads/${file.name}`;
  }

  await prisma.transparencyFile.create({
    data: {
      title,
      fileUrl,
      category,
      uploadedById: session.user.id,
    },
  });

  revalidatePath("/admin/transparency");
  return { ok: true };
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
  revalidatePath("/admin/transparency");
  return { ok: true };
}
