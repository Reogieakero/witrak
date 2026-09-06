import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  const userCount = await p.user.count();
  const studentCount = await p.student.count();
  const restoredStudents = await p.student.count({
    where: { studentNo: { startsWith: "RESTORED-" } },
  });
  const mockStudents = await p.student.count({
    where: { studentNo: { startsWith: "2025-" } },
  });
  const officers = await p.user.count({
    where: { roles: { some: { role: { name: { not: "Student" } } } } },
  });

  const byEmail = await p.user.groupBy({
    by: ["email"],
    where: { email: { endsWith: "@dorsu.edu.ph" } },
    _count: true,
  });

  console.log(`=== Database Recovery Summary ===`);
  console.log(`Total users: ${userCount}`);
  console.log(`Total students: ${studentCount}`);
  console.log(`Restored (real) students: ${restoredStudents}`);
  console.log(`Mock students (from seed): ${mockStudents}`);
  console.log(`Users with officer roles: ${officers}`);
  console.log(`@dorsu.edu.ph users: ${byEmail.length}`);
  await p.$disconnect();
}

main();
