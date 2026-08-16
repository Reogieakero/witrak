import { NextResponse } from "next/server";
import { prisma } from "@fhusocom/db";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const eventId = body?.eventId;
    const scanPassword = body?.scanPassword;

    if (typeof eventId !== "string" || typeof scanPassword !== "string") {
      return NextResponse.json(
        { error: "Missing eventId or scanPassword." },
        { status: 400 },
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, requiresAttendance: true, scanPassword: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }
    if (!event.requiresAttendance) {
      return NextResponse.json(
        { error: "This event does not require attendance." },
        { status: 400 },
      );
    }
    if (!event.scanPassword || event.scanPassword !== scanPassword.trim()) {
      return NextResponse.json(
        { error: "Invalid event code." },
        { status: 403 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
  }
}
