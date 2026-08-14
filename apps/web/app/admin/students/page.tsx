import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { hasPermission, studentInScope } from "@/lib/permissions";
import { AdminShell } from "@/app/components/admin-shell";
import { StudentsView } from "@/app/components/students/students-view";
import type {
  StudentAccount,
  StudentStats,
  ProgramOption,
} from "@/app/components/students/types";

export default async function AdminStudentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const access = session.access;
  // Temporary gate: allow any authenticated officer to reach the student
  // accounts directory for now. Restore once seeded:
  // if (!hasPermission(access, "members_view")) redirect("/dashboard");

  const scopeWhere = studentInScope(access ?? { permissions: [], scopeSectionIds: null });

  const [user, students, programs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        roles: { include: { role: { select: { name: true } } } },
      },
    }),
    prisma.student.findMany({
      where: scopeWhere,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      include: {
        section: {
          include: { programYear: { include: { program: true } } },
        },
        user: {
          select: {
            id: true,
            email: true,
            roles: { include: { role: { select: { name: true } } } },
          },
        },
      },
    }),
    prisma.program.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!user) redirect("/login");

  const canManage = hasPermission(access, "users_manage_roles");

  const items: StudentAccount[] = students.map((s) => ({
    id: s.id,
    userId: s.user.id,
    name: `${s.firstName} ${s.lastName}`.trim(),
    studentNo: s.studentNo,
    email: s.user.email,
    suspended: s.suspended,
    sectionId: s.sectionId,
    programCode: s.section?.programYear?.program?.code ?? null,
    programName: s.section?.programYear?.program?.name ?? null,
    yearLevel: s.section?.programYear?.level ?? null,
    sectionName: s.section?.name ?? null,
    roles: s.user.roles.map((ur) => ur.role.name),
  }));

  const assigned = items.filter((i) => i.sectionId !== null);
  const programCount = new Set(assigned.map((i) => i.programCode)).size;

  const stats: StudentStats = {
    total: items.length,
    active: items.filter((i) => !i.suspended).length,
    suspended: items.filter((i) => i.suspended).length,
    programs: programCount,
  };

  const programOptions: ProgramOption[] = programs.map((p) => ({
    id: p.id,
    name: p.name,
    code: p.code,
  }));

  const userName = user?.name ?? "Officer";
  const isSuperAdmin =
    user?.roles.some((r) => r.role.name === "Super Admin") ?? false;
  const roleLabel = isSuperAdmin
    ? "Super Admin"
    : user?.roles[0]?.role.name ?? "Officer";

  return (
    <AdminShell userName={userName} roleLabel={roleLabel}>
      <StudentsView
        students={items}
        stats={stats}
        programs={programOptions}
        canManage={canManage}
      />
    </AdminShell>
  );
}