"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { uploadStudentImage } from "@/lib/supabase-storage";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type StudentProfile = {
  id: string;
  studentNo: string;
  firstName: string;
  lastName: string;
  suffix: string | null;
  email: string;
  imageUrl: string | null;
  sectionLabel: string;
};

export type ProfileActionResult = { ok: boolean; error?: string };

async function getCurrentStudent() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.student.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      userId: true,
      studentNo: true,
      firstName: true,
      lastName: true,
      suffix: true,
      imageUrl: true,
      imagePath: true,
      section: {
        select: {
          name: true,
          programYear: {
            select: { level: true, program: { select: { code: true } } },
          },
        },
      },
    },
  });
}

export async function getStudentProfile(): Promise<StudentProfile | null> {
  const student = await getCurrentStudent();
  if (!student) return null;

  const sectionLabel = student.section
    ? `${student.section.programYear.program.code} ${student.section.programYear.level}-${student.section.name}`
    : "Unassigned";

  const user = await prisma.user.findUnique({
    where: { id: student.userId },
    select: { email: true },
  });

  return {
    id: student.id,
    studentNo: student.studentNo,
    firstName: student.firstName,
    lastName: student.lastName,
    suffix: student.suffix,
    email: user?.email ?? "",
    imageUrl: student.imageUrl,
    sectionLabel,
  };
}

export async function getStudentAvatar(): Promise<{ imageUrl: string | null }> {
  const student = await getCurrentStudent();
  return { imageUrl: student?.imageUrl ?? null };
}

export async function updateStudentProfile(input: {
  firstName: string;
  lastName: string;
  suffix: string;
}): Promise<ProfileActionResult> {
  const student = await getCurrentStudent();
  if (!student) return { ok: false, error: "Student record not found." };

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const suffix = input.suffix.trim();

  if (!firstName || !lastName) {
    return { ok: false, error: "First and last name are required." };
  }

  await prisma.student.update({
    where: { id: student.id },
    data: { firstName, lastName, suffix: suffix || null },
  });

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function uploadStudentAvatar(
  formData: FormData,
): Promise<ProfileActionResult & { imageUrl?: string }> {
  const student = await getCurrentStudent();
  if (!student) return { ok: false, error: "Student record not found." };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { ok: false, error: "Please choose an image." };
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: "Image must be under 5 MB." };
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return { ok: false, error: "Only JPG, PNG, or WebP images are allowed." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const storedName = `${student.id}-${randomUUID()}.${ext}`;
  const buffer = await file.arrayBuffer();

  let publicUrl: string;
  try {
    const res = await uploadStudentImage(storedName, buffer, file.type);
    publicUrl = res.publicUrl;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Upload failed." };
  }

  await prisma.student.update({
    where: { id: student.id },
    data: { imageUrl: publicUrl, imagePath: storedName },
  });

  revalidatePath("/dashboard");
  return { ok: true, imageUrl: publicUrl };
}