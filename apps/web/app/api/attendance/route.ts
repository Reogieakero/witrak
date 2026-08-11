import { NextResponse } from "next/server";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { requirePermission, studentInScope } from "@/lib/permissions";
import { handleError } from "@/lib/api";

export async function GET() {
  try {
    const session = await auth();
    const access = session?.access;
    requirePermission(access, "attendance_view");

    const records = await prisma.attendance.findMany({
      where: { student: studentInScope(access) },
      include: {
        student: { select: { firstName: true, lastName: true, studentNo: true } },
        event: { select: { title: true, startsAt: true } },
      },
      orderBy: { scannedAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ records });
  } catch (e) {
    return handleError(e);
  }
}
