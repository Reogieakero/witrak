import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const models = ["Program","YearLevel","Section","Student","User","Role","Permission","RolePermission","UserRole","RoleRequest","AcademicTerm","Event","Attendance","Sanction","SanctionEvidence","SanctionFlag","Fee","FeeProof","TransparencyFile","Announcement","AuditLog"];
  for (const m of models) {
    try {
      const count = await prisma[m].count();
      console.log(m + ": " + count);
    } catch (e) {
      console.log(m + ": ERROR " + String(e.message).split("\n")[0]);
    }
  }
}
main().finally(() => prisma.$disconnect());
