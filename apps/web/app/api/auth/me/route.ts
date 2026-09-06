import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { MAINTENANCE_MESSAGE, isMaintenanceMode } from "@/lib/maintenance";

export async function GET() {
  // System is down for data recovery — no session info is given out.
  if (isMaintenanceMode()) {
    return NextResponse.json({ error: MAINTENANCE_MESSAGE }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ user: null, access: null }, { status: 401 });
  }
  return NextResponse.json({ user: session.user, access: session.access });
}
