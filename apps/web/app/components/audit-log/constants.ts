import type { AuditModuleKey } from "./types";

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  ROLE_ASSIGNED: "Role assigned",
  ROLE_REVOKED: "Role revoked",
  SCOPE_CHANGED: "Scope changed",
  ROLE_REQUEST_REJECTED: "Request rejected",
  SANCTION_CREATED: "Sanction created",
  SANCTION_RESOLVED: "Sanction resolved",
  FLAG_DISMISSED: "Flag dismissed",
  FLAG_AUTO_DISMISSED: "Flag auto-dismissed",
  PAYMENT_VERIFIED: "Fee verified",
  PAYMENT_REJECTED: "Payment rejected",
  MEMBER_SUSPENDED: "Member suspended",
  MEMBER_REINSTATED: "Member reinstated",
  MEMBER_AUTHORIZATION_REMOVED: "Authorization removed",
};

export const AUDIT_MODULE_FILTERS: { value: AuditModuleKey; label: string }[] = [
  { value: "all", label: "All" },
  { value: "roles", label: "Roles" },
  { value: "sanctions", label: "Sanctions" },
  { value: "fees", label: "Fees" },
  { value: "members", label: "Members" },
];
