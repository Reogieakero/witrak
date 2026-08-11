import { NextResponse } from "next/server";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { requirePermission } from "@/lib/permissions";
import { handleError } from "@/lib/api";

export async function GET() {
  try {
    const session = await auth();
    requirePermission(session?.access, "events_view");

    const events = await prisma.event.findMany({
      orderBy: { startsAt: "desc" },
      include: { _count: { select: { attendances: true } } },
      take: 50,
    });

    return NextResponse.json({ events });
  } catch (e) {
    return handleError(e);
  }
}
