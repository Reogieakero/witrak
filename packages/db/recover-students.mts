import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
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

const prisma = new PrismaClient();

const SEED_MAIL_DOMAIN = "@fhusocom.edu";
const SEED_OFFICER_EMAILS = [
  "secretary@fhusocom.edu",
  "treasurer@fhusocom.edu",
  "discipline.officer@fhusocom.edu",
  "vp@fhusocom.edu",
  "pio@fhusocom.edu",
  "auditor@fhusocom.edu",
  "adviser@fhusocom.edu",
  "liberalistafhusocom@gmail.com",
];

async function listAllAuthUsers() {
  const allUsers: {
    id: string;
    email: string;
    name?: string;
    created_at: string;
  }[] = [];

  let page = 1;
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

    if (data.users.length < 100) break;
    page++;
  }

  return allUsers;
}

function isSeededMock(email: string): boolean {
  const e = email.toLowerCase();
  if (e.endsWith(SEED_MAIL_DOMAIN)) return true;
  if (SEED_OFFICER_EMAILS.includes(e)) return true;
  return false;
}

async function main() {
  console.log("Fetching all auth users from Supabase Auth...");
  const allAuthUsers = await listAllAuthUsers();
  console.log(`Total auth users: ${allAuthUsers.length}`);

  const realUsers = allAuthUsers.filter((u) => !isSeededMock(u.email));
  console.log(`Real users (excluding seeded mocks): ${realUsers.length}`);

  const seedUsers = allAuthUsers.filter((u) => isSeededMock(u.email));
  console.log(`Seeded mock users: ${seedUsers.length}`);

  const output = {
    total: allAuthUsers.length,
    real: realUsers,
    seeded: seedUsers.map((u) => ({ email: u.email })),
  };

  fs.writeFileSync("recovered-auth-users.json", JSON.stringify(output, null, 2));
  console.log("\nSaved full list to recovered-auth-users.json");
  console.log("\n--- Real users ---");
  for (const u of realUsers) {
    console.log(`${u.email}\t${u.name ?? ""}\t${u.id}`);
  }

  console.log("\nRestoring User + Student records for real users...");
  let restored = 0;
  for (const u of realUsers) {
    if (!u.email) continue;

    const supabaseId = u.id;
    const name = u.name ?? "";
    const nameParts = name.split(" ");
    const firstName = nameParts[0] ?? "";
    const lastName =
      nameParts.length > 1
        ? nameParts.slice(1).join(" ")
        : "";

    const user = await prisma.user.upsert({
      where: { supabaseId },
      update: { name },
      create: {
        email: u.email,
        name,
        supabaseId,
      },
    });

    await prisma.student.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        studentNo: `RESTORED-${user.id.slice(-8)}`,
        firstName,
        lastName,
        sectionId: null,
      },
    });

    restored++;
  }

  console.log(`\nRestored ${restored} User + Student records.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
