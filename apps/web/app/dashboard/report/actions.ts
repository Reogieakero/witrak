"use server";

import { revalidatePath } from "next/cache";
import { prisma, AuditAction } from "@fhusocom/db";
import { auth } from "@/auth";

export type SubmitReportResult = {
  ok: boolean;
  error?: string;
};

export async function submitReportAction(
  formData: FormData,
): Promise<SubmitReportResult> {
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
    return { ok: false, error: "Your account is suspended." };
  }

  const category = String(formData.get("category") ?? "").trim() as "ATTENDANCE" | "FEES";
  const subject = String(formData.get("subject") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const feeId = String(formData.get("feeId") ?? "").trim() || null;
  const eventId = String(formData.get("eventId") ?? "").trim() || null;

  if (!category) return { ok: false, error: "Please select a category." };
  if (!subject) return { ok: false, error: "Please enter a subject." };
  if (!description) return { ok: false, error: "Please enter a description." };
  if (description.length > 2000) {
    return { ok: false, error: "Description must be 2000 characters or less." };
  }

  if (category === "ATTENDANCE" && !eventId) {
    return { ok: false, error: "Please select an event." };
  }

  if (category === "FEES" && !feeId) {
    return { ok: false, error: "Please select a fee." };
  }

  if (feeId) {
    const fee = await prisma.fee.findUnique({ where: { id: feeId } });
    if (!fee) return { ok: false, error: "Fee not found." };
  }

  if (eventId) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return { ok: false, error: "Event not found." };
  }

  await prisma.report.create({
    data: {
      studentId: student.id,
      category,
      feeId,
      eventId,
      subject,
      description,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: AuditAction.REPORT_SUBMITTED,
      actorId: session.user.id,
      details: {
        category,
        subject,
        feeId: feeId ?? undefined,
        eventId: eventId ?? undefined,
      },
    },
  });

  revalidatePath("/dashboard/report");
  return { ok: true };
}
