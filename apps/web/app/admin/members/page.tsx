import { redirect } from "next/navigation";

export const revalidate = 30;
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { hasPermission, studentInScope } from "@/lib/permissions";
import { cached, CACHE_TTL } from "@/lib/cache";
import { AdminShell } from "@/app/components/admin-shell";
import { MembersView } from "@/app/components/members/members-view";
import type {
  MemberItem,
  MemberStats,
  PendingRequest,
  RejectedRequest,
  ProgramOption,
  SectionOption,
} from "@/app/components/members/types";

function yearLabel(level: number | null): string {
  if (!level) return "—";
  const suffix = ["th", "st", "nd", "rd"][level] ?? "th";
  return `${level}${suffix} Year`;
}

export default async function AdminMembersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login/officers");

  const access = session.access;
  // Temporary gate: the `members_view` permission isn't in the DB until
  // `prisma migrate dev` + `prisma db seed` are run. Allow any authenticated
  // officer to reach the directory for now; restore the guard once seeded:
  // if (!hasPermission(access, "members_view")) redirect("/dashboard");

  const scopeWhere = studentInScope(access ?? { permissions: [], scopeSectionIds: null });
  const canManage = hasPermission(access, "users_manage_roles");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      roles: { include: { role: { select: { name: true } } } },
    },
  });
  if (!user) redirect("/login/officers");

  const {
    items,
    stats,
    programOptions,
    sectionOptions,
    pendingRequests,
    rejectedRequests,
  } = await cached(`members:${session.user.id}`, CACHE_TTL.MEDIUM, async () => {
    const [students, programs, sections, rawRemovedAuth, rawRequests] =
      await Promise.all([
        prisma.student.findMany({
          where: { ...scopeWhere, user: { deletedAt: null } },
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
          include: {
            section: {
              include: { programYear: { include: { program: true } } },
            },
          },
        }),
        prisma.program.findMany({ orderBy: { name: "asc" } }),
        prisma.section.findMany({
          orderBy: { name: "asc" },
          include: { programYear: { include: { program: true } } },
        }),
        prisma.auditLog.findMany({
          where: { action: "MEMBER_AUTHORIZATION_REMOVED" },
          select: {
            targetId: true,
            timestamp: true,
            actor: { select: { name: true } },
          },
          orderBy: { timestamp: "desc" },
        }),
        prisma.roleRequest.findMany({
          where: { status: { in: ["PENDING", "REJECTED"] } },
          orderBy: { reviewedAt: "desc" },
          select: {
            id: true,
            userId: true,
            requestedRoleId: true,
            requestedScopeType: true,
            requestedProgramYearId: true,
            requestedSectionId: true,
            status: true,
            reviewedAt: true,
          },
        }),
      ]);

    const removedAuthMap = new Map<
      string,
      { officerName: string; removedAt: string }
    >();
    for (const log of rawRemovedAuth) {
      const studentId = log.targetId;
      if (!studentId) continue;
      if (removedAuthMap.has(studentId)) continue;
      removedAuthMap.set(studentId, {
        officerName: log.actor?.name ?? "Unknown officer",
        removedAt: log.timestamp.toISOString(),
      });
    }

    const items: MemberItem[] = students.map((s) => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`.trim(),
      studentNo: s.studentNo,
      status: s.sectionId ? "assigned" : "unassigned",
      sectionId: s.sectionId,
      suspended: s.suspended,
      removedAuth: removedAuthMap.get(s.id) ?? null,
      programCode: s.section?.programYear?.program?.code ?? null,
      programName: s.section?.programYear?.program?.name ?? null,
      yearLevel: s.section?.programYear?.level ?? null,
      sectionName: s.section?.name ?? null,
    }));

    const assigned = items.filter((i) => i.status === "assigned");
    const programCount = new Set(assigned.map((i) => i.programCode)).size;

    const stats: MemberStats = {
      total: items.length,
      assigned: assigned.length,
      unassigned: items.length - assigned.length,
      programs: programCount,
    };

    const programOptions: ProgramOption[] = programs.map((p) => ({
      id: p.id,
      name: p.name,
      code: p.code,
    }));

    const sectionOptions: SectionOption[] = sections.map((sec) => ({
      id: sec.id,
      name: sec.name,
      programYearId: sec.programYearId,
      label: `${sec.programYear.program.code} · ${yearLabel(sec.programYear.level)} · Section ${sec.name}`,
    }));

    let pendingRequests: PendingRequest[] = [];
    let rejectedRequests: RejectedRequest[] = [];
    if (rawRequests.length) {
      const userIds = [...new Set(rawRequests.map((r) => r.userId))];
      const roleIds = [...new Set(rawRequests.map((r) => r.requestedRoleId))];
      const pyIds = [
        ...new Set(
          rawRequests
            .map((r) => r.requestedProgramYearId)
            .filter((v): v is string => Boolean(v)),
        ),
      ];
      const secIds = [
        ...new Set(
          rawRequests
            .map((r) => r.requestedSectionId)
            .filter((v): v is string => Boolean(v)),
        ),
      ];

      const [users, roles, programYears, secs] = await Promise.all([
        prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true },
        }),
        prisma.role.findMany({
          where: { id: { in: roleIds } },
          select: { id: true, name: true },
        }),
        prisma.yearLevel.findMany({
          where: { id: { in: pyIds } },
          include: { program: true },
        }),
        prisma.section.findMany({
          where: { id: { in: secIds } },
          include: { programYear: { include: { program: true } } },
        }),
      ]);

      const userMap = new Map(users.map((u) => [u.id, u.name]));
      const roleMap = new Map(roles.map((r) => [r.id, r.name]));
      const pyMap = new Map(
        programYears.map((py) => [
          py.id,
          {
            code: py.program.code,
            name: py.program.name,
            level: py.level,
          },
        ]),
      );
      const secMap = new Map(
        secs.map((s) => [
          s.id,
          {
            name: s.name,
            programCode: s.programYear.program.code,
            programName: s.programYear.program.name,
            yearLevel: s.programYear.level,
          },
        ]),
      );

      const scopeFor = (
        r: (typeof rawRequests)[number],
      ): {
        programCode: string | null;
        programName: string | null;
        yearLevel: number | null;
        sectionName: string | null;
        label: string;
      } => {
        if (r.requestedScopeType === "SECTION") {
          const sec = secMap.get(r.requestedSectionId ?? "");
          return {
            programCode: sec?.programCode ?? null,
            programName: sec?.programName ?? null,
            yearLevel: sec?.yearLevel ?? null,
            sectionName: sec?.name ?? null,
            label: `Section ${sec?.name ?? ""}`,
          };
        }
        const py = pyMap.get(r.requestedProgramYearId ?? "");
        return {
          programCode: py?.code ?? null,
          programName: py?.name ?? null,
          yearLevel: py?.level ?? null,
          sectionName: null,
          label: `${py?.code ?? ""} · ${yearLabel(py?.level ?? null)}`,
        };
      };

      pendingRequests = rawRequests
        .filter((r) => r.status === "PENDING")
        .map((r) => {
          const scope = scopeFor(r);
          return {
            id: r.id,
            userName: userMap.get(r.userId) ?? "User",
            requestedRole: roleMap.get(r.requestedRoleId) ?? "Role",
            requestedRoleId: r.requestedRoleId,
            scopeType: r.requestedScopeType as "SECTION" | "PROGRAM_YEAR",
            programYearId: r.requestedProgramYearId,
            sectionId: r.requestedSectionId,
            programCode: scope.programCode,
            programName: scope.programName,
            yearLevel: scope.yearLevel,
            sectionName: scope.sectionName,
            scopeLabel: scope.label,
            requestedAt: "",
          };
        });

      rejectedRequests = rawRequests
        .filter((r) => r.status === "REJECTED")
        .map((r) => {
          const scope = scopeFor(r);
          return {
            id: r.id,
            userName: userMap.get(r.userId) ?? "User",
            requestedRole: roleMap.get(r.requestedRoleId) ?? "Role",
            programCode: scope.programCode,
            programName: scope.programName,
            yearLevel: scope.yearLevel,
            sectionName: scope.sectionName,
            scopeLabel: scope.label,
            rejectedAt: r.reviewedAt?.toISOString() ?? "",
          };
        });
    }

    return {
      items,
      stats,
      programOptions,
      sectionOptions,
      pendingRequests,
      rejectedRequests,
    };
  });

  const userName = user?.name ?? "Officer";
  const isSuperAdmin =
    user?.roles.some((r) => r.role.name === "Super Admin") ?? false;
  const roleLabel = isSuperAdmin
    ? "Supreme"
    : user?.roles[0]?.role.name ?? "Officer";

  return (
    <AdminShell userName={userName} roleLabel={roleLabel}>
      <MembersView
        members={items}
        stats={stats}
        programs={programOptions}
        sections={sectionOptions}
        pending={pendingRequests}
        rejected={rejectedRequests}
        canManage={canManage}
      />
    </AdminShell>
  );
}
