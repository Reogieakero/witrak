import "dotenv/config";
import {
  prisma,
  seedPermissions,
  seedRoles,
  seedSuperAdmin,
} from "./bootstrap";

async function main() {
  await seedPermissions();
  await seedRoles();
  const admin = await seedSuperAdmin();

  console.log("\n=== Scaffold summary (system catalog only, no demo data) ===");
  const counts: [string, number][] = [];
  for (const model of [
    "permission", "role", "rolePermission", "user", "userRole",
  ] as const) {
    const delegate = prisma[model as keyof typeof prisma] as { count(): Promise<number> };
    counts.push([model, await delegate.count()]);
  }
  for (const [model, count] of counts) {
    console.log(`${model.padEnd(16)} ${count}`);
  }
  console.log(`Super Admin: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });