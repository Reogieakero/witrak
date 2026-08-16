import { NextResponse } from "next/server";
import { prisma } from "@fhusocom/db";
import { getTermContext, eventInTerm } from "@/lib/terms";

function eventStatus(
  startsAt: Date,
  endsAt: Date,
  now: Date,
): "live" | "upcoming" | "past" {
  if (startsAt <= now && now < endsAt) return "live";
  if (startsAt > now) return "upcoming";
  return "past";
}

export async function GET() {
  try {
    const { term } = await getTermContext();
    const now = new Date();

    const events = await prisma.event.findMany({
      where: { ...eventInTerm(term), requiresAttendance: true },
      orderBy: { startsAt: "desc" },
      select: {
        id: true,
        title: true,
        location: true,
        startsAt: true,
        endsAt: true,
      },
    });

    return NextResponse.json({
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        location: e.location,
        startsAt: e.startsAt.toISOString(),
        endsAt: e.endsAt.toISOString(),
        status: eventStatus(e.startsAt, e.endsAt, now),
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
  }
}
