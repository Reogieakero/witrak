import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
if (!url || !token) {
  console.error("Missing UPSTASH env vars");
  process.exit(1);
}
const redis = new Redis({ url, token });

const prefix = "attendance:*";
let cursor = 0;
let deleted = 0;
do {
  const [next, keys] = await redis.scan(cursor, { match: prefix, count: 100 });
  cursor = Number(next);
  if (keys.length) {
    await redis.del(...keys);
    deleted += keys.length;
  }
} while (cursor !== 0);

console.log(`Deleted ${deleted} attendance cache keys`);
