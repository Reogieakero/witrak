import { NextResponse } from "next/server";
import { ForbiddenError } from "@/lib/permissions";

export function handleError(e: unknown): NextResponse {
  if (e instanceof ForbiddenError) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }
  throw e;
}
