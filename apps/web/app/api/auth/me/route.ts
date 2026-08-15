import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ user: null, access: null }, { status: 401 });
  }
  return NextResponse.json({ user: session.user, access: session.access });
}
