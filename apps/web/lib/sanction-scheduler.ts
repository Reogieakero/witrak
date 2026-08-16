import { recomputeAllSanctions } from "@fhusocom/db";
import { getRedisClient } from "./cache";

const RECOMPUTE_INTERVAL_MS = 4 * 60 * 60 * 1000;
const LAST_RUN_KEY = "sanctions:recompute:lastRunAt";

export type ScheduledRecomputeResult = {
  ran: boolean;
  created?: number;
  updated?: number;
};

/**
 * Runs the sanction recompute at most once every 4 hours (tracked in Redis).
 * When Redis is unavailable the check is skipped, so the app never blocks on
 * this — admins can always trigger a recompute manually.
 */
export async function maybeRunScheduledSanctionRecompute(): Promise<ScheduledRecomputeResult> {
  const redis = getRedisClient();
  if (!redis) return { ran: false };

  try {
    const lastRun = await redis.get<string>(LAST_RUN_KEY);
    if (lastRun && Date.now() - Number(lastRun) < RECOMPUTE_INTERVAL_MS) {
      return { ran: false };
    }
  } catch {
    return { ran: false };
  }

  try {
    const result = await recomputeAllSanctions();
    try {
      await redis.set(LAST_RUN_KEY, String(Date.now()));
    } catch {
      // ignore timestamp write failures — the recompute still completed
    }
    return { ran: true, created: result.created, updated: result.updated };
  } catch {
    return { ran: false };
  }
}
