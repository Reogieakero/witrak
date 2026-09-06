"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AttendanceStatus,
  prisma,
  recomputeSanctionTriggers,
  AuditAction,
} from "@fhusocom/db";
import { auth } from "@/auth";
import { hasPermission, type UserAccess } from "@/lib/permissions";
import { invalidateByPrefix } from "@/lib/cache";

type SessionWithUser = {
  user: { id: string };
  access: UserAccess | null;
};

async function currentSession(): Promise<SessionWithUser> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login/officers");
  return { user: { id: session.user.id }, access: session.access ?? null };
}

function studentInScopeOf(
  access: UserAccess | null,
  sectionId: string | null | undefined,
): boolean {
  if (!access) return false;
  const scope = access.scopeSectionIds;
  if (scope === null) return true;
  return !!sectionId && scope.includes(sectionId);
}

const ATTENDANCE_REPORT_STATUSES: AttendanceStatus[] = [
  "PRESENT",
  "LATE",
  "EXCUSED",
  "ABSENT",
];

export type ResolveAttendanceReportInput = {
  reportId: string;
  status: "PRESENT" | "LATE" | "EXCUSED" | "ABSENT";
  reason: string;
};

export type ReviewFeesReportInput = {
  reportId: string;
  note: string;
};

export async function resolveAttendanceReport(
  input: ResolveAttendanceReportInput,
): Promise<{ ok: boolean; error?: string }> {
  const session = await currentSession();
  if (!hasPermission(session.access, "reports_manage")) {
    return { ok: false, error: "Missing permission: reports.manage." };
  }

  const status = input.status.toUpperCase() as AttendanceStatus;
  if (!ATTENDANCE_REPORT_STATUSES.includes(status)) {
    return { ok: false, error: "Invalid attendance status." };
  }

  const reason = String(input.reason ?? "").trim();

  const report = await prisma.report.findUnique({
    where: { id: input.reportId },
    include: {
      student: {
        select: {
          id: true,
          studentNo: true,
          firstName: true,
          lastName: true,
          sectionId: true,
        },
      },
      event: {
        select: { id: true, title: true },
      },
    },
  });
  if (!report) return { ok: false, error: "Report not found." };
  if (report.category !== "ATTENDANCE") {
    return { ok: false, error: "This is not an attendance report." };
  }
  if (report.status === "RESOLVED") {
    return { ok: false, error: "This report has already been resolved." };
  }
  if (!studentInScopeOf(session.access, report.student.sectionId)) {
    return { ok: false, error: "Report is outside your scope." };
  }

  if (status === "ABSENT" && !reason) {
    return { ok: false, error: "A reason is required when marking Absent." };
  }

  const studentName = `${report.student.firstName} ${report.student.lastName}`.trim();
  const eventTitle = report.event?.title ?? "Unknown event";

  await prisma.$transaction(async (tx) => {
    await tx.report.update({
      where: { id: report.id },
      data: {
        status: "RESOLVED",
        resolutionNote: reason || null,
      },
    });

    if (report.eventId) {
      const existing = await tx.attendance.findUnique({
        where: {
          eventId_studentId: {
            eventId: report.eventId,
            studentId: report.studentId,
          },
        },
        select: { id: true },
      });

      if (existing) {
        await tx.attendance.update({
          where: { id: existing.id },
          data: { status },
        });
      } else {
        await tx.attendance.create({
          data: {
            eventId: report.eventId,
            studentId: report.studentId,
            status,
            scannedById: session.user.id,
            scannedAt: new Date(),
          },
        });
      }
    }

    await tx.auditLog.create({
      data: {
        action: AuditAction.REPORT_RESOLVED,
        actorId: session.user.id,
        targetId: report.id,
        details: {
          student: studentName,
          studentNo: report.student.studentNo,
          event: eventTitle,
          category: "ATTENDANCE",
          resolution: status,
          reason: reason || undefined,
        },
      },
    });
  });

  if (report.eventId) {
    await recomputeSanctionTriggers(report.studentId);
    await invalidateByPrefix("attendance:");
  }

  await invalidateByPrefix("reports:");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/attendance");
  return { ok: true };
}

export async function reviewFeesReport(
  input: ReviewFeesReportInput,
): Promise<{ ok: boolean; error?: string }> {
  const session = await currentSession();
  if (!hasPermission(session.access, "reports_manage")) {
    return { ok: false, error: "Missing permission: reports.manage." };
  }

  const note = String(input.note ?? "").trim();
  if (!note) return { ok: false, error: "A review note is required." };

  const report = await prisma.report.findUnique({
    where: { id: input.reportId },
    include: {
      student: {
        select: {
          id: true,
          studentNo: true,
          firstName: true,
          lastName: true,
          sectionId: true,
        },
      },
      fee: { select: { title: true } },
    },
  });
  if (!report) return { ok: false, error: "Report not found." };
  if (report.category !== "FEES") {
    return { ok: false, error: "This is not a fees report." };
  }
  if (report.status === "RESOLVED") {
    return { ok: false, error: "This report has already been resolved." };
  }
  if (!studentInScopeOf(session.access, report.student.sectionId)) {
    return { ok: false, error: "Report is outside your scope." };
  }

  const studentName = `${report.student.firstName} ${report.student.lastName}`.trim();
  const feeTitle = report.fee?.title ?? "Unknown fee";

  await prisma.$transaction(async (tx) => {
    await tx.report.update({
      where: { id: report.id },
      data: {
        status: "RESOLVED",
        resolutionNote: note,
      },
    });

    await tx.auditLog.create({
      data: {
        action: AuditAction.REPORT_RESOLVED,
        actorId: session.user.id,
        targetId: report.id,
        details: {
          student: studentName,
          studentNo: report.student.studentNo,
          fee: feeTitle,
          category: "FEES",
          note,
        },
      },
    });
  });

  await invalidateByPrefix("reports:");
  revalidatePath("/admin/reports");
  return { ok: true };
}
