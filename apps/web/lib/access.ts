import { prisma } from "@fhusocom/db";
import type { UserAccess } from "@/lib/permissions";

// Mirrors ROLE_SEEDS in packages/db/prisma/bootstrap.ts.
// Used as a fallback so deployments whose Permission/RolePermission rows
// predate a newly-added permission (e.g. reports_view/reports_manage)
// still resolve the correct access without requiring a manual reseed.
// DB rows remain the source of truth; these are unioned in.
const ROLE_PERMISSION_FALLBACK: Record<string, string[]> = {
  Secretary: [
    "attendance_scan",
    "attendance_view",
    "attendance_edit",
    "reports_view",
    "reports_manage",
    "announcements_create",
    "announcements_edit",
    "announcements_delete",
    "announcements_view",
  ],
  Treasurer: [
    "fees_create",
    "fees_verify_payment",
    "fees_view",
    "transparency_upload",
    "transparency_delete",
    "transparency_view",
    "members_view",
  ],
  "Discipline Officer": [
    "sanctions_view",
    "attendance_view",
    "reports_view",
    "reports_manage",
    "members_view",
  ],
  "Year/Program Rep": [
    "events_create",
    "events_edit",
    "events_delete",
    "events_view",
    "attendance_scan",
    "attendance_view",
    "reports_view",
    "members_view",
  ],
  Student: [
    "events_view",
    "attendance_view",
    "sanctions_view_own",
    "fees_view",
    "transparency_view",
    "announcements_view",
  ],
  "Vice President": [
    "events_create",
    "events_edit",
    "events_delete",
    "events_view",
    "attendance_view",
    "reports_view",
    "reports_manage",
    "transparency_view",
    "announcements_create",
    "announcements_delete",
    "announcements_view",
    "members_view",
  ],
  PIO: [
    "transparency_upload",
    "transparency_delete",
    "transparency_view",
    "announcements_create",
    "announcements_edit",
    "announcements_delete",
    "announcements_view",
    "events_view",
    "members_view",
  ],
  Auditor: [
    "fees_view",
    "transparency_view",
    "audit_view",
    "announcements_view",
    "events_view",
    "members_view",
  ],
  Adviser: [
    "transparency_view",
    "audit_view",
    "announcements_view",
    "events_view",
    "attendance_view",
    "reports_view",
    "members_view",
  ],
};

// Full PermissionKey enum from packages/db/prisma/schema.prisma.
// Ensures Super Admin keeps full access even when the DB predates new keys.
const ALL_KNOWN_PERMISSIONS: string[] = [
  "events_create",
  "events_edit",
  "events_delete",
  "events_view",
  "attendance_scan",
  "attendance_view",
  "attendance_edit",
  "transparency_upload",
  "transparency_delete",
  "transparency_view",
  "sanctions_create",
  "sanctions_view",
  "sanctions_view_own",
  "sanctions_resolve",
  "sanctions_appeal_respond",
  "fees_create",
  "fees_verify_payment",
  "fees_view",
  "reports_view",
  "reports_manage",
  "announcements_create",
  "announcements_edit",
  "announcements_delete",
  "announcements_view",
  "members_view",
  "users_manage_roles",
  "audit_view",
];

export async function resolveUserAccess(userId: string): Promise<UserAccess> {
  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    include: {
      roles: {
        include: {
          role: { include: { permissions: { include: { permission: true } } } },
          section: true,
          programYear: { include: { sections: true } },
          program: { include: { sections: true } },
        },
      },
    },
  });

  if (!user) return { permissions: [], scopeSectionIds: null };

  const permissions = new Set<string>();
  const sections = new Set<string>();
  let facultyWide = false;

  for (const userRole of user.roles) {
    for (const rp of userRole.role.permissions) {
      permissions.add(rp.permission.key);
    }

    const roleName = (userRole.role as { name?: unknown }).name;
    if (typeof roleName === "string") {
      if (roleName === "Super Admin") {
        for (const key of ALL_KNOWN_PERMISSIONS) permissions.add(key);
      } else {
        for (const key of ROLE_PERMISSION_FALLBACK[roleName] ?? []) {
          permissions.add(key);
        }
      }
    }

    switch (userRole.scopeType) {
      case "FACULTY":
        facultyWide = true;
        break;
      case "SECTION":
        if (userRole.section) sections.add(userRole.section.id);
        break;
      case "PROGRAM_YEAR":
        for (const s of userRole.programYear?.sections ?? []) sections.add(s.id);
        break;
      case "PROGRAM":
        for (const s of userRole.program?.sections ?? []) sections.add(s.id);
        break;
    }
  }

  return {
    permissions: [...permissions],
    scopeSectionIds: facultyWide ? null : [...sections],
  };
}
