import { redirect } from "next/navigation";
import { prisma, AuditAction } from "@fhusocom/db";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { cached, CACHE_TTL } from "@/lib/cache";
import { AdminShell } from "@/app/components/admin-shell";
import { SanctionsView } from "@/app/components/sanctions/sanctions-view";
import { getTermContext, termRange, sanctionsInTerm } from "@/lib/terms";
import type {
  SanctionItem,
  SanctionStats,
  SanctionRuleOption,
  SanctionsActivityItem,
  SanctionScopeOptions,
} from "@/app/components/sanctions/types";

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(d: Date): string {
  const date = d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
}

function auditDetailsText(details: unknown): string {
  if (!details || typeof details !== "object") return "—";
  const d = details as Record<string, unknown>;
  const parts: string[] = [];
  if (typeof d.title === "string") parts.push(d.title);
  if (typeof d.rule === "string") parts.push(d.rule);
  if (typeof d.reason === "string") parts.push(d.reason);
  return parts.join(" · ") || "—";
}

const SANCTION_AUDIT_ACTIONS: AuditAction[] = [
  AuditAction.SANCTION_CREATED,
  AuditAction.SANCTION_RESOLVED,
  AuditAction.FLAG_DISMISSED,
  AuditAction.FLAG_AUTO_DISMISSED,
];

export default async function AdminSanctionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const access = session.access;
  if (!hasPermission(access, "sanctions_view")) redirect("/dashboard");

  const scope = access?.scopeSectionIds ?? null;
  const studentWhere = scope ? { sectionId: { in: scope } } : undefined;

  const { term } = await getTermContext();
  const range = termRange(term);
  const termKey = term?.id ?? "none";

  const canCreate = hasPermission(access, "sanctions_create");
  const canResolve = hasPermission(access, "sanctions_resolve");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      roles: { include: { role: { select: { name: true } } } },
    },
  });

  const { sanctionItems, stats, ruleOptions, activityLogs, scopeOptions } = await cached(
    `sanctions:${termKey}:${session.user.id}`,
    CACHE_TTL.MEDIUM,
    async () => {
      const [sanctions, rules, auditLogs] = await Promise.all([
        prisma.sanction.findMany({
          where: { ...studentWhere, ...sanctionsInTerm(term) },
          orderBy: { issuedAt: "desc" },
          include: {
            student: {
              select: {
                studentNo: true,
                firstName: true,
                lastName: true,
                section: {
                  select: {
                    name: true,
                    programYear: {
                      select: { level: true, program: { select: { code: true } } },
                    },
                  },
                },
              },
            },
            rule: true,
            evidences: {
              include: {
                attendance: {
                  select: {
                    status: true,
                    event: { select: { title: true, startsAt: true } },
                  },
                },
              },
            },
            resolvedBy: { select: { name: true } },
          },
        }),
        prisma.sanctionRule.findMany({
          orderBy: { absenceThreshold: "asc" },
          include: {
            program: { select: { code: true, name: true } },
            programYear: { select: { level: true } },
            section: { select: { name: true, programYear: { select: { level: true } } } },
          },
        }),
        prisma.auditLog.findMany({
          where: {
            action: { in: SANCTION_AUDIT_ACTIONS },
            ...(range ? { timestamp: range } : {}),
          },
          orderBy: { timestamp: "desc" },
          take: 50,
          include: { actor: { select: { name: true } } },
        }),
      ]);

      const [scopePrograms, scopeProgramYears, scopeSections] = canCreate
        ? await prisma.$transaction([
            prisma.program.findMany({
              select: { id: true, code: true, name: true },
              orderBy: { code: "asc" },
            }),
            prisma.yearLevel.findMany({
              select: { id: true, programId: true, level: true },
              orderBy: { level: "asc" },
            }),
            prisma.section.findMany({
              select: { id: true, name: true, programYearId: true },
              orderBy: { name: "asc" },
            }),
          ])
        : [[], [], []];

      const scopeOptions: SanctionScopeOptions = {
        programs: scopePrograms,
        programYears: scopeProgramYears,
        sections: scopeSections,
      };

      const sanctionItems: SanctionItem[] = sanctions.map((s) => {
        const st = s.student;
        return {
          id: s.id,
          kind: s.status === "RESOLVED" ? "resolved" : "sanction",
          studentName: `${st.firstName} ${st.lastName}`.trim(),
          studentNo: st.studentNo,
          sectionName: st.section?.name ?? "—",
          yearLevel: st.section?.programYear.level ?? 0,
          programCode: st.section?.programYear.program.code ?? "—",
          title: s.title,
          reason: s.reason,
          ruleThreshold: s.rule?.absenceThreshold ?? 0,
          triggerCount: s.rule?.absenceThreshold ?? 0,
          outcome: s.status === "RESOLVED" ? "Cleared" : "Open",
          createdAt: formatDate(s.issuedAt),
          resolvedBy: s.resolvedBy?.name,
          evidence: s.evidences.map((e) => ({
            eventTitle: e.attendance.event?.title ?? "Event",
            date: formatDate(e.attendance.event?.startsAt ?? s.issuedAt),
            status: e.attendance.status,
          })),
        };
      });

      const stats: SanctionStats = {
        activeSanctions: sanctionItems.filter((s) => s.outcome === "Open").length,
        resolved: sanctionItems.filter((s) => s.outcome !== "Open").length,
        total: sanctionItems.length,
        termName: term?.name ?? "Current Term",
      };

      const ruleOptions: SanctionRuleOption[] = rules.map((r) => {
        const scopeLabel =
          r.scopeType === "PROGRAM"
            ? r.program
              ? `${r.program.code} — ${r.program.name}`
              : "Program"
            : r.scopeType === "PROGRAM_YEAR"
              ? r.programYear
                ? `Year ${r.programYear.level}`
                : "Program year"
              : r.scopeType === "SECTION"
                ? r.section
                  ? `Year ${r.section.programYear?.level ?? "?"} — ${r.section.name}`
                  : "Section"
                : "Faculty-wide";
        return {
          id: r.id,
          label: `${r.absenceThreshold} absences`,
          threshold: r.absenceThreshold,
          scopeType: r.scopeType,
          scopeLabel,
          programId: r.programId ?? undefined,
          programYearId: r.programYearId ?? undefined,
          sectionId: r.sectionId ?? undefined,
          period: r.period,
          active: r.active,
        };
      });

      const activityLogs: SanctionsActivityItem[] = auditLogs.map((l) => ({
        id: l.id,
        action: l.action,
        details: auditDetailsText(l.details),
        targetId: l.targetId,
        actorName: l.actor?.name ?? "System",
        when: formatDateTime(l.timestamp),
      }));

      return { sanctionItems, stats, ruleOptions, activityLogs, scopeOptions };
    },
  );

  const userName = user?.name ?? "Officer";
  const isSuperAdmin =
    user?.roles.some((r) => r.role.name === "Super Admin") ?? false;
  const roleLabel = isSuperAdmin
    ? "Super Admin"
    : user?.roles[0]?.role.name ?? "Officer";

  return (
    <AdminShell userName={userName} roleLabel={roleLabel}>
      <SanctionsView
        sanctions={sanctionItems}
        stats={stats}
        rules={ruleOptions}
        activityLogs={activityLogs}
        canCreate={canCreate}
        canResolve={canResolve}
        scopeOptions={scopeOptions}
      />
    </AdminShell>
  );
}
