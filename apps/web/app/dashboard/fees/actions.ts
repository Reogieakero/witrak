"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { uploadFeeProof } from "@/lib/supabase-storage";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);

export type UploadFeeProofResult = { ok: boolean; error?: string };

export async function uploadFeeProofAction(
  formData: FormData,
): Promise<UploadFeeProofResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Please sign in first." };
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true, suspended: true },
  });
  if (!student) {
    return { ok: false, error: "Student record not found." };
  }
  if (student.suspended) {
    return { ok: false, error: "Your account is suspended and cannot submit payments." };
  }

  const feeId = String(formData.get("feeId") ?? "").trim();
  const method = String(formData.get("method") ?? "").trim();
  const reference = String(formData.get("reference") ?? "").trim();
  const file = formData.get("file") as File | null;

  if (!feeId) return { ok: false, error: "Please choose a fee." };
  if (!file || file.size === 0) return { ok: false, error: "Please attach your proof." };

  const fee = await prisma.fee.findUnique({ where: { id: feeId } });
  if (!fee) return { ok: false, error: "Fee not found." };

  const paid = await prisma.feeProof.findFirst({
    where: { feeId, studentId: student.id, status: "PAID" },
  });
  if (paid) return { ok: false, error: "This fee is already paid." };

  if (reference) {
    const dup = await prisma.feeProof.findFirst({
      where: { reference: { equals: reference, mode: "insensitive" } },
    });
    if (dup) return { ok: false, error: "That reference number is already in use." };
  }

  const existing = await prisma.feeProof.findFirst({
    where: { feeId, studentId: student.id, status: "PENDING" },
  });
  if (existing) {
    return { ok: false, error: "You already have a pending proof for this fee." };
  }

  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: "File must be under 5 MB." };
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return { ok: false, error: "Only JPG, PNG, or PDF files are allowed." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const storedName = `${randomUUID()}.${ext}`;
  const buffer = await file.arrayBuffer();

  let fileUrl: string;
  try {
    const res = await uploadFeeProof(storedName, buffer, file.type);
    fileUrl = res.publicUrl;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Upload failed." };
  }

  await prisma.feeProof.create({
    data: {
      feeId,
      studentId: student.id,
      fileUrl,
      status: "PENDING",
      method: method || null,
      reference: reference || null,
    },
  });

  revalidatePath("/dashboard/fees");
  revalidatePath("/dashboard");
  return { ok: true };
}