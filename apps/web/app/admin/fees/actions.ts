"use server";

import { revalidatePath } from "next/cache";
import { prisma, AuditAction } from "@fhusocom/db";
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

export type CreateFeeInput = {
  title: string;
  amount: number;
  dueDate: string;
};

export async function createFee(
  input: CreateFeeInput,
): Promise<{ ok: boolean; error?: string }> {
  const session = await currentSession();
  if (!hasPermission(session.access, "fees_create")) {
    return { ok: false, error: "Missing permission: fees.create." };
  }

  const title = String(input.title ?? "").trim();
  if (!title) return { ok: false, error: "Fee title is required." };

  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Amount must be greater than zero." };
  }

  const dueDate = new Date(input.dueDate);
  if (Number.isNaN(dueDate.getTime())) {
    return { ok: false, error: "A valid due date is required." };
  }

  await prisma.fee.create({
    data: {
      title,
      amount,
      dueDate,
      createdById: session.user.id,
    },
  });

  revalidatePath("/admin/fees");
  return { ok: true };
}

export type UpdateFeeInput = CreateFeeInput & { id: string };

export async function updateFee(
  input: UpdateFeeInput,
): Promise<{ ok: boolean; error?: string }> {
  const session = await currentSession();
  if (!hasPermission(session.access, "fees_create")) {
    return { ok: false, error: "Missing permission: fees.create." };
  }

  const title = String(input.title ?? "").trim();
  if (!title) return { ok: false, error: "Fee title is required." };

  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Amount must be greater than zero." };
  }

  const dueDate = new Date(input.dueDate);
  if (Number.isNaN(dueDate.getTime())) {
    return { ok: false, error: "A valid due date is required." };
  }

  const fee = await prisma.fee.findUnique({ where: { id: input.id } });
  if (!fee) return { ok: false, error: "Fee not found." };

  await prisma.fee.update({
    where: { id: fee.id },
    data: { title, amount, dueDate },
  });

  revalidatePath("/admin/fees");
  return { ok: true };
}

export async function deleteFee(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await currentSession();
  if (!hasPermission(session.access, "fees_create")) {
    return { ok: false, error: "Missing permission: fees.create." };
  }

  const fee = await prisma.fee.findUnique({ where: { id } });
  if (!fee) return { ok: false, error: "Fee not found." };

  await prisma.$transaction(async (tx) => {
    await tx.feeProof.deleteMany({ where: { feeId: id } });
    await tx.fee.delete({ where: { id } });
  });

  revalidatePath("/admin/fees");
  return { ok: true };
}

export type VerifyFeeProofInput = {
  proofId: string;
  decision: "approve" | "reject";
  rejectionReason?: string;
};

export async function verifyFeeProof(
  input: VerifyFeeProofInput,
): Promise<{ ok: boolean; error?: string }> {
  const session = await currentSession();
  if (!hasPermission(session.access, "fees_verify_payment")) {
    return { ok: false, error: "Missing permission: fees.verify_payment." };
  }

  const proof = await prisma.feeProof.findUnique({
    where: { id: input.proofId },
    include: {
      fee: { select: { id: true, title: true, amount: true } },
      student: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!proof) return { ok: false, error: "Proof not found." };
  if (proof.status !== "PENDING") {
    return { ok: false, error: "Only pending proofs can be verified." };
  }

  if (input.decision === "reject") {
    const reason = String(input.rejectionReason ?? "").trim();
    if (!reason) {
      return { ok: false, error: "A rejection reason is required." };
    }
  }

  const status = input.decision === "approve" ? "PAID" : "REJECTED";
  const action =
    input.decision === "approve"
      ? AuditAction.PAYMENT_VERIFIED
      : AuditAction.PAYMENT_REJECTED;
  const studentName = `${proof.student.firstName} ${proof.student.lastName}`.trim();

  await prisma.$transaction(async (tx) => {
    await tx.feeProof.update({
      where: { id: proof.id },
      data: {
        status,
        rejectionReason:
          input.decision === "reject"
            ? String(input.rejectionReason ?? "").trim()
            : null,
        verifiedById: session.user.id,
        verifiedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        action,
        actorId: session.user.id,
        targetId: proof.id,
        details: {
          student: studentName,
          fee: proof.fee.title,
          amount: proof.fee.amount.toString(),
          reason: input.decision === "reject" ? String(input.rejectionReason ?? "").trim() : undefined,
        },
      },
    });
  });

  revalidatePath("/admin/fees");
  return { ok: true };
}