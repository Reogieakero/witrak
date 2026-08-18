import {
  AuditAction,
  PermissionKey,
  PrismaClient,
  ScopeType,
} from "@prisma/client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const prisma = new PrismaClient();

// ── Supabase Auth provisioning ───────────────────────────────────────────────
// Accounts are linked to Supabase Auth identities via `User.supabaseId`. The
// admin API creates the auth user; if it already exists (idempotent seeds) we
// resolve its id from the project's user list. Falls back to `null` when the
// Supabase env vars are absent (e.g. DB-only local runs).
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin: SupabaseClient | null = null;
let authUserByEmail: Map<string, string> | null = null;

function getSupabaseAdmin(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return supabaseAdmin;
}

export async function ensureAuthUser(
  email: string,
  password: string,
  name: string,
): Promise<string | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  if (!authUserByEmail) {
    authUserByEmail = new Map();
    let page = 1;
    // Supabase returns a max of 200 users per page.
    for (;;) {
      const { data, error } = await admin.auth.admin.listUsers({
        page,
        perPage: 200,
      });
      if (error) break;
      for (const u of data.users) {
        if (u.email) authUserByEmail.set(u.email, u.id);
      }
      if (data.users.length < 200) break;
      page++;
    }
  }

  const existing = authUserByEmail.get(email);
  if (existing) return existing;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (error) {
    console.warn(`Auth user for ${email} not created: ${error.message}`);
    return null;
  }
  authUserByEmail.set(email, data.user.id);
  return data.user.id;
}

export type RoleSeed = {
  name: string;
  description: string;
  permissions: PermissionKey[];
};

export const ROLE_SEEDS: RoleSeed[] = [
  {
    name: "Super Admin",
    description: "Faculty-wide full access; manages roles. Guarded against lockout.",
    permissions: Object.values(PermissionKey),
  },
  {
    name: "Secretary",
    description: "Events, attendance oversight, transparency uploads, announcements.",
    permissions: [
      PermissionKey.events_create,
      PermissionKey.events_edit,
      PermissionKey.events_delete,
      PermissionKey.events_view,
      PermissionKey.attendance_scan,
      PermissionKey.attendance_view,
      PermissionKey.attendance_edit,
      PermissionKey.transparency_upload,
      PermissionKey.transparency_delete,
      PermissionKey.transparency_view,
      PermissionKey.announcements_create,
      PermissionKey.announcements_edit,
      PermissionKey.announcements_delete,
      PermissionKey.announcements_view,
      PermissionKey.members_view,
    ],
  },
  {
    name: "Treasurer",
    description: "Fees, payment verification, financial transparency files.",
    permissions: [
      PermissionKey.fees_create,
      PermissionKey.fees_verify_payment,
      PermissionKey.fees_view,
      PermissionKey.transparency_upload,
      PermissionKey.transparency_delete,
      PermissionKey.transparency_view,
      PermissionKey.members_view,
    ],
  },
  {
    name: "Discipline Officer",
    description: "Sanctions view within scope (decisions rest with the admin/president) + attendance view for evidence.",
    permissions: [
      PermissionKey.sanctions_view,
      PermissionKey.attendance_view,
      PermissionKey.members_view,
    ],
  },
  {
    name: "Year/Program Rep",
    description: "Events + attendance for their assigned scope.",
    permissions: [
      PermissionKey.events_create,
      PermissionKey.events_edit,
      PermissionKey.events_delete,
      PermissionKey.events_view,
      PermissionKey.attendance_scan,
      PermissionKey.attendance_view,
      PermissionKey.members_view,
    ],
  },
  {
    name: "Student",
    description: "Read-only access to own records.",
    permissions: [
      PermissionKey.events_view,
      PermissionKey.attendance_view,
      PermissionKey.sanctions_view_own,
      PermissionKey.fees_view,
      PermissionKey.transparency_view,
      PermissionKey.announcements_view,
    ],
  },
  {
    name: "Vice President",
    description: "Assists the president across operations and announcements.",
    permissions: [
      PermissionKey.events_create,
      PermissionKey.events_edit,
      PermissionKey.events_delete,
      PermissionKey.events_view,
      PermissionKey.attendance_view,
      PermissionKey.transparency_view,
      PermissionKey.announcements_create,
      PermissionKey.announcements_delete,
      PermissionKey.announcements_view,
      PermissionKey.members_view,
    ],
  },
  {
    name: "PIO",
    description: "Public Information Officer — publishes announcements and transparency files.",
    permissions: [
      PermissionKey.transparency_upload,
      PermissionKey.transparency_delete,
      PermissionKey.transparency_view,
      PermissionKey.announcements_create,
      PermissionKey.announcements_edit,
      PermissionKey.announcements_delete,
      PermissionKey.announcements_view,
      PermissionKey.events_view,
      PermissionKey.members_view,
    ],
  },
  {
    name: "Auditor",
    description: "Reviews fee records and the audit trail.",
    permissions: [
      PermissionKey.fees_view,
      PermissionKey.transparency_view,
      PermissionKey.audit_view,
      PermissionKey.announcements_view,
      PermissionKey.events_view,
      PermissionKey.members_view,
    ],
  },
  {
    name: "Adviser",
    description: "Faculty adviser with read-only oversight.",
    permissions: [
      PermissionKey.transparency_view,
      PermissionKey.audit_view,
      PermissionKey.announcements_view,
      PermissionKey.events_view,
      PermissionKey.attendance_view,
      PermissionKey.members_view,
    ],
  },
];

export async function seedPermissions(): Promise<void> {
  for (const key of Object.values(PermissionKey)) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key },
    });
  }
}

export async function seedRoles(): Promise<void> {
  for (const seed of ROLE_SEEDS) {
    const role = await prisma.role.upsert({
      where: { name: seed.name },
      update: { description: seed.description },
      create: { name: seed.name, description: seed.description },
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    for (const key of seed.permissions) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { key } });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }
}

export async function seedSuperAdmin(): Promise<{ id: string; name: string; email: string }> {
  const email = process.env.SEED_SUPER_ADMIN_EMAIL;
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;
  const name = process.env.SEED_SUPER_ADMIN_NAME ?? "President";

  if (!email || !password) {
    throw new Error("SEED_SUPER_ADMIN_EMAIL / SEED_SUPER_ADMIN_PASSWORD not set.");
  }

  const supabaseId = await ensureAuthUser(email, password, name);
  const role = await prisma.role.findUniqueOrThrow({ where: { name: "Super Admin" } });

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, supabaseId },
    create: { email, name, supabaseId },
  });

  const existing = await prisma.userRole.findFirst({
    where: { userId: user.id, roleId: role.id },
  });
  if (!existing) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
        scopeType: ScopeType.FACULTY,
        assignedBy: user.id,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: AuditAction.ROLE_ASSIGNED,
      targetId: user.id,
      details: { role: "Super Admin", scopeType: "FACULTY" },
    },
  });

  console.log(`Super Admin ready: ${email}`);
  return { id: user.id, name, email };
}