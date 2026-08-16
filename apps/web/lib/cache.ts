import { Redis } from "@upstash/redis";

let client: Redis | null = null;
let clientFailed = false;

function getClient(): Redis | null {
  if (clientFailed) return null;
  if (client) return client;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    client = new Redis({ url, token });
  } catch {
    clientFailed = true;
    client = null;
  }
  return client;
}

export function getRedisClient(): Redis | null {
  return getClient();
}

export const CACHE_TTL = {
  SHORT: 15,
  MEDIUM: 60,
  LONG: 300,
} as const;

/**
 * Returns a cached value for `key`, or runs `fetcher` and caches the result.
 * Degrades to a direct `fetcher()` call when Redis is unavailable or errors,
 * so a cache outage never breaks the app.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const redis = getClient();
  if (!redis) return fetcher();

  try {
    const hit = await redis.get<T>(key);
    if (hit !== null && hit !== undefined) return hit as T;
  } catch {
    // fall through to a fresh fetch
  }

  const value = await fetcher();
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch {
    // swallow write failures — the value is still returned
  }
  return value;
}

export async function invalidate(key: string): Promise<void> {
  const redis = getClient();
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    // ignore
  }
}

export async function invalidateByPrefix(prefix: string): Promise<void> {
  const redis = getClient();
  if (!redis) return;
  try {
    const keys: string[] = [];
    let cursor = 0;
    do {
      const [next, found] = await redis.scan(cursor, {
        match: `${prefix}*`,
        count: 200,
      });
      cursor = Number(next);
      if (Array.isArray(found)) keys.push(...(found as string[]));
    } while (cursor !== 0);
    if (keys.length) await redis.del(...keys);
  } catch {
    // ignore
  }
}
