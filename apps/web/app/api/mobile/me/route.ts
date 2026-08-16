import { NextResponse } from "next/server";
import { mobileSessionFromRequest } from "@/lib/mobile/session";

export async function GET(request: Request) {
  try {
    const session = await mobileSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({
      user: { name: session.name, role: session.roleLabel },
      canScan: session.access.permissions.includes("attendance_scan"),
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
  }
}
