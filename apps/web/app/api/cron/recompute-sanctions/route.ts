import { NextResponse } from "next/server";
import { maybeRunScheduledSanctionRecompute } from "@/lib/sanction-scheduler";
import { handleError } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Cron endpoint for the scheduled sanction recompute. Safe to call frequently
 * (e.g. every 15 minutes) — the scheduler only actually recomputes once every
 * 4 hours. Protected by a shared secret via the `x-cron-secret` header.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("x-cron-secret");
  if (secret && header !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await maybeRunScheduledSanctionRecompute();
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}
