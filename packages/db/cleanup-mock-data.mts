import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

const OFFICER_EMAILS = [
  "secretary@fhusocom.edu",
  "treasurer@fhusocom.edu",
  "discipline.officer@fhusocom.edu",
  "vp@fhusocom.edu",
  "pio@fhusocom.edu",
  "auditor@fhusocom.edu",
  "adviser@fhusocom.edu",
];

async function main() {
  console.log("=== Cleaning up mock/seed data ===\n");

  // --- Step 1: Delete operational/mock data (events, attendance, sanctions, fees, etc.) ---
  const tables: { label: string; fn: () => Promise<{ count: number }> }[] = [
    { label: "auditLog",            fn: () => p.auditLog.deleteMany({}) },
    { label: "announcement",         fn: () => p.announcement.deleteMany({}) },
    { label: "transparencyFile",    fn: () => p.transparencyFile.deleteMany({}) },
    { label: "feeProof",            fn: () => p.feeProof.deleteMany({}) },
    { label: "fee",                 fn: () => p.fee.deleteMany({}) },
    { label: "sanctionEvidence",    fn: () => p.sanctionEvidence.deleteMany({}) },
    { label: "sanctionFlag",        fn: () => p.sanctionFlag.deleteMany({}) },
    { label: "sanction",            fn: () => p.sanction.deleteMany({}) },
    { label: "sanctionFine",        fn: () => p.sanctionFine.deleteMany({}) },
    { label: "attendance",          fn: () => p.attendance.deleteMany({}) },
    { label: "event",               fn: () => p.event.deleteMany({}) },
    { label: "roleRequest",         fn: () => p.roleRequest.deleteMany({}) },
    { label: "seenState",           fn: () => p.seenState.deleteMany({}) },
  ];

  for (const { label, fn } of tables) {
    const r = await fn();
    console.log(`  Deleted ${r.count} ${label} records`);
  }

  // --- Step 2: Delete UserRole records for mock students (keep officers) ---
  const mockUserRoleDel = await p.userRole.deleteMany({
    where: {
      user: {
        email: {
          startsWith: "student",
          endsWith: "@fhusocom.edu",
        },
      },
    },
  });
  console.log(`  Deleted ${mockUserRoleDel.count} mock student UserRole records`);

  // --- Step 3: Identify mock users (student* + officers, but NOT Super Admin) ---
  const mockUsers = await p.user.findMany({
    where: {
      email: {
        OR: [
          { startsWith: "student", endsWith: "@fhusocom.edu" },
          ...OFFICER_EMAILS.map((e) => ({ email: e })),
        ],
      },
    },
    select: { id: true, email: true },
  });
  console.log(`\n  Found ${mockUsers.length} mock user records (excluding Super Admin)`);
  const mockUserIds = mockUsers.map((u) => u.id);

  // --- Step 4: Delete Student records for mock users ---
  const delStudents = await p.student.deleteMany({ where: { userId: { in: mockUserIds } } });
  console.log(`  Deleted ${delStudents.count} mock Student records`);

  // --- Step 5: Delete User records for mock users ---
  const delUsers = await p.user.deleteMany({ where: { id: { in: mockUserIds } } });
  console.log(`  Deleted ${delUsers.count} mock User records`);

  // --- Final counts ---
  const totalUsers = await p.user.count();
  const totalStudents = await p.student.count();
  const restoredStudents = await p.student.count({
    where: { studentNo: { startsWith: "RESTORED-" } },
  });

  console.log(`\n=== Final state ===`);
  console.log(`  Users: ${totalUsers}`);
  console.log(`  Students: ${totalStudents}`);
  console.log(`  Restored (real) students: ${restoredStudents}`);
  console.log(`  Other students: ${totalStudents - restoredStudents}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await p.$disconnect());
