import { redirect } from "next/navigation";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { cached, CACHE_TTL } from "@/lib/cache";
import { AdminShell } from "@/app/components/admin-shell";
import { AuditLogView } from "@/app/components/audit-log/audit-log-view";
import { getTermContext, termRange } from "@/lib/terms";
import type {
  AuditEntry,
  AuditModuleKey,
  AuditStats,
} from "@/app/components/audit-log/types";

function formatDateTime(d: Date): string {
  const date = d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
}

function relativeTime(d: Date): string {
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function isWithinLastWeek(ts: Date): boolean {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return ts.getTime() >= weekAgo;
}

function moduleForAction(action: string): Exclude<AuditModuleKey, "all"> {
  switch (action) {
    case "ROLE_ASSIGNED":
    case "ROLE_REVOKED":
    case "SCOPE_CHANGED":
    case "ROLE_REQUEST_REJECTED":
      return "roles";
    case "SANCTION_CREATED":
    case "SANCTION_RESOLVED":
    case "FLAG_DISMISSED":
    case "FLAG_AUTO_DISMISSED":
      return "sanctions";
    case "PAYMENT_VERIFIED":
    case "PAYMENT_REJECTED":
      return "fees";
    case "MEMBER_SUSPENDED":
    case "MEMBER_REINSTATED":
    case "MEMBER_AUTHORIZATION_REMOVED":
      return "members";
    default:
      return "roles";
  }
}

function summaryFor(action: string, details: Record<string, unknown>): string {
  switch (action) {
    case "ROLE_ASSIGNED":
      return typeof details.scope === "string" ? `scope: ${details.scope}` : "scope assigned";
    case "PAYMENT_VERIFIED":
      return typeof details.amount === "string" ? `₱${details.amount} → paid` : "paid";
    case "PAYMENT_REJECTED":
      return typeof details.reason === "string" ? String(details.reason) : "rejected";
    case "MEMBER_SUSPENDED":
      return "login disabled";
    case "MEMBER_REINSTATED":
      return "login re-enabled";
    case "MEMBER_AUTHORIZATION_REMOVED":
      return typeof details.permission === "string"
        ? String(details.permission)
        : "authorization removed";
    case "ROLE_REQUEST_REJECTED":
      return typeof details.reason === "string" ? String(details.reason) : "rejected";
    case "ROLE_REVOKED":
      return typeof details.reason === "string" ? String(details.reason) : "revoked";
    case "SCOPE_CHANGED":
      return typeof details.to === "string" ? `→ ${String(details.to)}` : "scope changed";
    case "SANCTION_CREATED":
      return typeof details.rule === "string" ? `auto-issued · ${String(details.rule)}` : "auto-issued";
    case "SANCTION_RESOLVED":
      return "cleared";
    case "FLAG_DISMISSED":
      return "flag dismissed";
    case "FLAG_AUTO_DISMISSED":
      return "auto-dismissed";
    default:
      return "—";
  }
}

function targetDetailFor(
  action: string,
  details: Record<string, unknown>,
): string {
  switch (action) {
    case "ROLE_ASSIGNED":
      return typeof details.role === "string" ? String(details.role) : "Role";
    case "ROLE_REVOKED":
      return typeof details.role === "string" ? String(details.role) : "Role";
    case "SCOPE_CHANGED":
      return typeof details.role === "string" ? String(details.role) : "Scope";
    case "ROLE_REQUEST_REJECTED":
      return typeof details.role === "string" ? String(details.role) : "Role request";
    case "PAYMENT_VERIFIED":
    case "PAYMENT_REJECTED":
      return typeof details.fee === "string" ? String(details.fee) : "Fee";
    case "MEMBER_SUSPENDED":
    case "MEMBER_REINSTATED":
      return typeof details.studentNo === "string" ? String(details.studentNo) : "Student";
    case "MEMBER_AUTHORIZATION_REMOVED":
      return typeof details.note === "string" ? String(details.note) : "Access";
    case "SANCTION_CREATED":
    case "SANCTION_RESOLVED":
      return typeof details.threshold !== "undefined"
        ? `Threshold · ${String(details.threshold)} absences`
        : "Sanction";
    case "FLAG_DISMISSED":
    case "FLAG_AUTO_DISMISSED":
      return "Attendance evidence";
    default:
      return "—";
  }
}

export default async function AdminAuditLogPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const access = session.access;
  if (!hasPermission(access, "audit_view")) redirect("/dashboard");

  const { term } = await getTermContext();
  const range = termRange(term);
  const termKey = term?.id ?? "none";

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      roles: { include: { role: { select: { name: true } } } },
    },
  });

  const { entries, stats } = await cached(
    `audit:${termKey}`,
    CACHE_TTL.SHORT,
    async () => {
      const auditLogs = await prisma.auditLog.findMany({
        where: range ? { timestamp: range } : undefined,
        orderBy: { timestamp: "desc" },
        take: 200,
        include: { actor: { select: { name: true } } },
      });

      const entries: AuditEntry[] = auditLogs.map((l) => {
        const details = (l.details ?? {}) as Record<string, unknown>;
        const mod = moduleForAction(l.action);
        const targetName =
          typeof details.member === "string"
            ? String(details.member)
            : typeof details.name === "string"
              ? String(details.name)
              : "—";
        return {
          id: l.id,
          action: l.action,
          module: mod,
          actorName: l.actor?.name ?? "System",
          actorInitial: initials(l.actor?.name ?? "System"),
          targetName,
          targetDetail: targetDetailFor(l.action, details),
          summary: summaryFor(l.action, details),
          details,
          timestamp: formatDateTime(l.timestamp),
          relative: relativeTime(l.timestamp),
        };
      });

      const stats: AuditStats = {
        total: auditLogs.length,
        thisWeek: auditLogs.filter((l) => isWithinLastWeek(l.timestamp)).length,
        actors: new Set(auditLogs.map((l) => l.actorId ?? "system")).size,
        systemIssued: auditLogs.filter((l) => !l.actorId).length,
        byModule: (["roles", "sanctions", "fees", "members"] as AuditModuleKey[]).map(
          (m) => ({
            module: m,
            label: m === "roles" ? "Roles & Access" : m === "members" ? "Members" : m[0].toUpperCase() + m.slice(1),
            count: entries.filter((e) => e.module === m).length,
          }),
        ),
        termName: term?.name ?? "Current Term",
      };

      return { entries, stats };
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
      <AuditLogView entries={entries} stats={stats} />
    </AdminShell>
  );
}
