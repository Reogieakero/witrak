import { NextResponse } from "next/server";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { requirePermission } from "@/lib/permissions";
import { handleError } from "@/lib/api";
import { cached, CACHE_TTL } from "@/lib/cache";

export async function GET() {
  try {
    const session = await auth();
    requirePermission(session?.access, "events_view");

    const events = await cached(
      `api:events:${session?.user?.id ?? "anon"}`,
      CACHE_TTL.SHORT,
      () =>
        prisma.event.findMany({
          orderBy: { startsAt: "desc" },
          select: {
            id: true,
            title: true,
            description: true,
            startsAt: true,
            endsAt: true,
            location: true,
            requiresAttendance: true,
            programId: true,
            _count: { select: { attendances: true } },
          },
          take: 50,
        }),
    );

    return NextResponse.json({ events });
  } catch (e) {
    return handleError(e);
  }
}
