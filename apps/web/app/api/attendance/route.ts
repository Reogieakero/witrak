import { NextResponse } from "next/server";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { requirePermission, studentInScope } from "@/lib/permissions";
import { handleError } from "@/lib/api";

export async function GET(request?: Request) {
  try {
    const session = await auth();
    const access = session?.access;
    requirePermission(access, "attendance_view");

    const studentId = request ? new URL(request.url).searchParams.get("studentId") : null;
    const eventId = request ? new URL(request.url).searchParams.get("eventId") : null;

    const records = await prisma.attendance.findMany({
      where: {
        student: studentInScope(access),
        ...(studentId ? { studentId } : {}),
        ...(eventId ? { eventId } : {}),
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            studentNo: true,
            section: { select: { name: true } },
          },
        },
        event: { select: { title: true, startsAt: true } },
      },
      orderBy: { scannedAt: "desc" },
    });

    return NextResponse.json({ records });
  } catch (e) {
    return handleError(e);
  }
}
