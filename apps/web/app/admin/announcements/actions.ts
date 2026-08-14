"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma, ScopeType } from "@fhusocom/db";
import { auth } from "@/auth";
import { hasPermission, type UserAccess } from "@/lib/permissions";
import { uploadAnnouncementImage } from "@/lib/supabase-storage";

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

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function createAnnouncement(
  formData: FormData,
): Promise<{ ok: boolean; error?: string; id?: string; imageUrl?: string | null }> {
  const session = await currentSession();
  if (!hasPermission(session.access, "announcements_create")) {
    return { ok: false, error: "Missing permission: announcements.create." };
  }

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false, error: "Announcement title is required." };

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { ok: false, error: "Announcement message is required." };

  const scopeRaw = String(formData.get("scope") ?? "all");
  const scopeType: ScopeType = scopeRaw === "program" ? ScopeType.PROGRAM : ScopeType.FACULTY;

  let programId: string | null = null;
  if (scopeType === ScopeType.PROGRAM) {
    programId = String(formData.get("programId") ?? "").trim();
    if (!programId) {
      return { ok: false, error: "Select a program to target this announcement." };
    }
  }

  let imageUrl: string | null = null;
  let imagePath: string | null = null;
  const file = formData.get("image") as File | null;
  if (file && file.size > 0) {
    if (file.size > MAX_IMAGE_BYTES) {
      return { ok: false, error: "Image must be under 5 MB." };
    }
    if (!file.type.startsWith("image/")) {
      return { ok: false, error: "Only image files are allowed." };
    }
    const ext = file.name.split(".").pop() ?? "png";
    imagePath = `${randomUUID()}.${ext}`;
    const buffer = await file.arrayBuffer();
    try {
      const res = await uploadAnnouncementImage(imagePath, buffer, file.type || "image/png");
      imageUrl = res.publicUrl;
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Image upload failed." };
    }
  }

  const created = await prisma.announcement.create({
    data: {
      title,
      body,
      createdById: session.user.id,
      scopeType,
      programId,
      imageUrl,
      imagePath,
    },
  });

  revalidatePath("/admin/announcements");
  return { ok: true, id: created.id, imageUrl };
}

export async function editAnnouncement(
  formData: FormData,
): Promise<{ ok: boolean; error?: string; imageUrl?: string | null }> {
  const session = await currentSession();
  if (!hasPermission(session.access, "announcements_edit")) {
    return { ok: false, error: "Missing permission: announcements.edit." };
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "Announcement id is required." };

  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Announcement not found." };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false, error: "Announcement title is required." };

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { ok: false, error: "Announcement message is required." };

  const scopeRaw = String(formData.get("scope") ?? "all");
  const scopeType: ScopeType = scopeRaw === "program" ? ScopeType.PROGRAM : ScopeType.FACULTY;
  let programId: string | null = null;
  if (scopeType === ScopeType.PROGRAM) {
    programId = String(formData.get("programId") ?? "").trim();
    if (!programId) {
      return { ok: false, error: "Select a program to target this announcement." };
    }
  }

  const removeImage = formData.get("removeImage") === "true";
  const file = formData.get("image") as File | null;

  let imageUrl = existing.imageUrl;
  let imagePath = existing.imagePath;

  if (removeImage) {
    imageUrl = null;
    imagePath = null;
  } else if (file && file.size > 0) {
    if (file.size > MAX_IMAGE_BYTES) {
      return { ok: false, error: "Image must be under 5 MB." };
    }
    if (!file.type.startsWith("image/")) {
      return { ok: false, error: "Only image files are allowed." };
    }
    const ext = file.name.split(".").pop() ?? "png";
    imagePath = `${randomUUID()}.${ext}`;
    try {
      const res = await uploadAnnouncementImage(
        imagePath,
        await file.arrayBuffer(),
        file.type || "image/png",
      );
      imageUrl = res.publicUrl;
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Image upload failed." };
    }
  }

  await prisma.announcement.update({
    where: { id },
    data: { title, body, scopeType, programId, imageUrl, imagePath },
  });

  revalidatePath("/admin/announcements");
  return { ok: true, imageUrl };
}

export async function deleteAnnouncement(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await currentSession();
  if (!hasPermission(session.access, "announcements_delete")) {
    return { ok: false, error: "Missing permission: announcements.delete." };
  }

  const announcement = await prisma.announcement.findUnique({ where: { id } });
  if (!announcement) return { ok: false, error: "Announcement not found." };

  await prisma.announcement.delete({ where: { id } });

  revalidatePath("/admin/announcements");
  return { ok: true };
}
