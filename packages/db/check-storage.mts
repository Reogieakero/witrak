import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import fs from "fs";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BUCKETS = ["transparency", "announcements", "students", "fee-proofs"];

async function main() {
  const result: Record<string, { name: string; size: number; updated_at: string }[]> = {};

  for (const bucket of BUCKETS) {
    console.log(`\n=== Bucket: ${bucket} ===`);
    const { data, error } = await admin.storage.from(bucket).list("", {
      limit: 1000,
    });

    if (error) {
      console.error(`Error listing ${bucket}:`, error.message);
      result[bucket] = [];
      continue;
    }

    console.log(`Files: ${data.length}`);
    result[bucket] = data.map((f) => ({
      name: f.name,
      size: f.metadata?.size ?? 0,
      updated_at: f.updated_at ?? "",
    }));

    for (const f of data.slice(0, 10)) {
      console.log(`  ${f.name} (${f.metadata?.size ?? 0} bytes)`);
    }
    if (data.length > 10) console.log(`  ... and ${data.length - 10} more`);
  }

  fs.writeFileSync("storage-inventory.json", JSON.stringify(result, null, 2));
  console.log("\nFull inventory saved to storage-inventory.json");
}

main();
