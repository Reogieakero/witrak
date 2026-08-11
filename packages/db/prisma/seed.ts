import {
  PrismaClient,
  AuditAction,
  PermissionKey,
  ScopeType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type RoleSeed = {
  name: string;
  description: string;
  permissions: PermissionKey[];
};

const ROLE_SEEDS: RoleSeed[] = [
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
      PermissionKey.announcements_delete,
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
    ],
  },
  {
    name: "Discipline Officer",
    description: "Sanctions only (private records) + attendance view for evidence.",
    permissions: [
      PermissionKey.sanctions_create,
      PermissionKey.sanctions_view,
      PermissionKey.sanctions_resolve,
      PermissionKey.sanctions_appeal_respond,
      PermissionKey.attendance_view,
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
];

async function seedPermissions(): Promise<void> {
  for (const key of Object.values(PermissionKey)) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key },
    });
  }
}

async function seedRoles(): Promise<void> {
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

async function seedSuperAdmin(): Promise<void> {
  const email = process.env.SEED_SUPER_ADMIN_EMAIL;
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;
  const name = process.env.SEED_SUPER_ADMIN_NAME ?? "President";

  if (!email || !password) {
    console.warn("SEED_SUPER_ADMIN_EMAIL / SEED_SUPER_ADMIN_PASSWORD not set — skipping Super Admin bootstrap.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const role = await prisma.role.findUniqueOrThrow({ where: { name: "Super Admin" } });

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash },
    create: { email, name, passwordHash },
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
}

async function main(): Promise<void> {
  await seedPermissions();
  await seedRoles();
  await seedSuperAdmin();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
