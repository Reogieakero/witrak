import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  let page = 1;
  const allUsers: {
    id: string;
    email: string;
    name?: string;
    created_at: string;
  }[] = [];

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) {
      console.error("Error listing users:", error.message);
      break;
    }

    for (const u of data.users) {
      allUsers.push({
        id: u.id,
        email: u.email ?? "",
        name: u.user_metadata?.name,
        created_at: u.created_at,
      });
    }

    console.log(`Page ${page}: ${data.users.length} users`);
    if (data.users.length < 100) break;
    page++;
  }

  console.log(`\nTotal auth users: ${allUsers.length}`);
  console.log("\n--- User list ---");
  for (const u of allUsers) {
    console.log(`${u.email}\t${u.name ?? ""}\t${u.id}`);
  }
}

main().catch(console.error);
