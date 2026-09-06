import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();

type AuthUser = {
  id: string;
  email: string;
  name?: string;
  created_at: string;
};

async function main() {
  const data = JSON.parse(fs.readFileSync("recovered-auth-users.json", "utf8"));
  const realUsers: AuthUser[] = data.real;
  console.log(`Loaded ${realUsers.length} real auth users from file.`);

  const existingUsers = await prisma.user.findMany({
    select: { supabaseId: true, id: true, student: { select: { id: true } } },
    where: { supabaseId: { in: realUsers.map((u) => u.id) } },
  });
  const existingSupabaseIds = new Set(existingUsers.map((u) => u.supabaseId));
  console.log(`Already have ${existingSupabaseIds.size} User records.`);

  const toCreate = realUsers.filter((u) => !existingSupabaseIds.has(u.id));
  console.log(`Need to create ${toCreate.length} User records.`);

  if (toCreate.length > 0) {
    await prisma.user.createMany({
      data: toCreate.map((u) => ({
        email: u.email,
        name: u.name ?? "",
        supabaseId: u.id,
      })),
      skipDuplicates: true,
    });
    console.log(`Created ${toCreate.length} User records.`);
  }

  const allUsers = await prisma.user.findMany({
    where: { supabaseId: { in: realUsers.map((u) => u.id) } },
    select: { id: true, supabaseId: true, student: { select: { id: true } } },
  });

  const existingStudentUserIds = new Set(
    allUsers.filter((u) => u.student).map((u) => u.id),
  );
  console.log(`Already have ${existingStudentUserIds.size} Student records.`);

  const toCreateStudents = allUsers.filter(
    (u) => !u.student && !existingStudentUserIds.has(u.id),
  );
  console.log(`Need to create ${toCreateStudents.length} Student records.`);

  if (toCreateStudents.length > 0) {
    const studentData = toCreateStudents.map((u, i) => ({
      userId: u.id,
      studentNo: `RESTORE-${Date.now()}-${i}`,
      firstName: "",
      lastName: "",
    }));
    await prisma.student.createMany({
      data: studentData,
      skipDuplicates: true,
    });
    console.log(`Created ${toCreateStudents.length} Student records.`);
  }

  const total = await prisma.user.count();
  const totalStudents = await prisma.student.count();
  console.log(`\nFinal DB state: ${total} users, ${totalStudents} students.`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
