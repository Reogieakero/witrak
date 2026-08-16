"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { prisma, ScopeType } from "@fhusocom/db";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { uploadStudentImage } from "@/lib/supabase-storage";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type CompleteProfileResult = { ok: boolean; error?: string };

export async function completeStudentProfile(
  formData: FormData,
): Promise<CompleteProfileResult> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { ok: false, error: "Your session has expired. Please sign in again." };
  }

  const email = user.email.toLowerCase().trim();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const suffix = String(formData.get("suffix") ?? "").trim() || null;
  const studentNo = String(formData.get("studentNo") ?? "").trim();
  const programId = String(formData.get("programId") ?? "").trim() || null;
  const programYearId = String(formData.get("programYearId") ?? "").trim() || null;
  const sectionId = String(formData.get("sectionId") ?? "").trim() || null;

  if (!firstName || !lastName) {
    return { ok: false, error: "First and last name are required." };
  }
  if (!studentNo) {
    return { ok: false, error: "Student number is required." };
  }
  if (!/^20\d{2}-\d{4}$/.test(studentNo)) {
    return { ok: false, error: "Student number must follow the format 20XX-XXXX (e.g. 2025-0001)." };
  }
  if (!programId) {
    return { ok: false, error: "Please select your program." };
  }
  if (!programYearId) {
    return { ok: false, error: "Please select your year level." };
  }

  const yearLevel = await prisma.yearLevel.findUnique({
    where: { id: programYearId },
    select: { programId: true },
  });
  if (!yearLevel || yearLevel.programId !== programId) {
    return { ok: false, error: "The selected year level does not match your program." };
  }

  if (sectionId) {
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      select: { programYearId: true },
    });
    if (!section || section.programYearId !== programYearId) {
      return { ok: false, error: "The selected section does not match your year level." };
    }
  }

  let imageUrl: string | null = null;
  let imagePath: string | null = null;
  const file = formData.get("image") as File | null;
  if (!file || file.size === 0) {
    return { ok: false, error: "Please upload your profile photo." };
  }
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
    const res = await uploadStudentImage(imagePath, buffer, file.type || "image/png");
    imageUrl = res.publicUrl;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Image upload failed." };
  }

  try {
    const role = await prisma.role.findUnique({ where: { name: "Student" } });

    await prisma.$transaction(async (tx) => {
      let dbUser = await tx.user.findFirst({
        where: { email, deletedAt: null },
      });

      if (!dbUser) {
        dbUser = await tx.user.create({
          data: {
            email,
            name: `${firstName} ${lastName}${suffix ? `, ${suffix}` : ""}`.trim(),
            supabaseId: user.id,
          },
        });
      }

      if (role) {
        await tx.userRole.create({
          data: {
            userId: dbUser.id,
            roleId: role.id,
            scopeType: ScopeType.FACULTY,
            assignedBy: dbUser.id,
          },
        });
      }

      await tx.student.create({
        data: {
          firstName,
          lastName,
          suffix,
          studentNo,
          sectionId,
          imageUrl,
          imagePath,
          userId: dbUser.id,
        },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message.includes("studentNo")) {
      return {
        ok: false,
        error: "That student number is already registered. Use the officer portal if you believe this is a mistake.",
      };
    }
    if (e instanceof Error && e.message.includes("email")) {
      return { ok: false, error: "An account with that email already exists. Try signing in instead." };
    }
    return { ok: false, error: "Profile setup failed. Please check your details and try again." };
  }

  const next = String(formData.get("next") ?? "/dashboard");
  redirect(next);
}