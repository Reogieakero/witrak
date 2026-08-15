"use server";

import { revalidatePath } from "next/cache";
import { prisma, ScopeType } from "@fhusocom/db";
import { auth } from "@/auth";
import { hasPermission, type UserAccess } from "@/lib/permissions";
import { invalidateByPrefix } from "@/lib/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type SessionWithUser = {
  user: { id: string };
  access: UserAccess | null;
};

async function currentSession(): Promise<SessionWithUser> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    throw new Error("Your session is no longer valid. Please sign out and sign in again.");
  }

  return { user: { id: session.user.id }, access: session.access ?? null };
}

export async function createStudent(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const session = await currentSession();
  if (!hasPermission(session.access, "users_manage_roles")) {
    return { ok: false, error: "Missing permission: users.manage_roles." };
  }

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const studentNo = String(formData.get("studentNo") ?? "").trim();
  const sectionId = String(formData.get("sectionId") ?? "").trim() || null;

  if (!firstName || !lastName) {
    return { ok: false, error: "First and last name are required." };
  }
  if (!studentNo) {
    return { ok: false, error: "Student number is required." };
  }
  if (firstName.length > 100 || lastName.length > 100) {
    return { ok: false, error: "Names must be under 100 characters." };
  }
  if (studentNo.length > 40) {
    return { ok: false, error: "Student number is too long." };
  }

  const email = `${studentNo.replace(/[^a-zA-Z0-9.-]/g, "").toLowerCase()}@fhusocom.edu`;

  const existing = await prisma.student.findFirst({
    where: { OR: [{ studentNo }, { user: { email } }] },
    select: { id: true },
  });
  if (existing) {
    return { ok: false, error: "A student with that student number or account already exists." };
  }

  // Provision a Supabase Auth identity (default password) so the officer can
  // sign in. Best-effort: if the admin client is unavailable the account is
  // still created without a linked auth identity.
  let supabaseId: string | null = null;
  try {
    const supabase = getSupabaseAdmin();
    const name = `${firstName} ${lastName}`.trim();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: "ChangeMe123!",
      email_confirm: true,
      user_metadata: { name },
    });
    if (error && /already been registered/i.test(error.message)) {
      const list = await supabase.auth.admin.listUsers();
      supabaseId = list.data.users.find((u) => u.email === email)?.id ?? null;
    } else if (data?.user) {
      supabaseId = data.user.id;
    }
  } catch {
    supabaseId = null;
  }

  try {
    const role = await prisma.role.findUnique({ where: { name: "Student" } });

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, name: `${firstName} ${lastName}`.trim(), supabaseId },
      });
      if (role) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: role.id,
            scopeType: ScopeType.FACULTY,
            assignedBy: session.user.id,
          },
        });
      }
      await tx.student.create({
        data: { firstName, lastName, studentNo, sectionId, userId: user.id },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message.includes("studentNo")) {
      return { ok: false, error: "A student with that student number already exists." };
    }
    if (e instanceof Error && e.message.includes("email")) {
      return { ok: false, error: "An account for that student number already exists." };
    }
    return { ok: false, error: "A student with that student number already exists." };
  }

  await invalidateByPrefix("members:");
  revalidatePath("/admin/members");
  return { ok: true };
}

export async function updateStudent(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const session = await currentSession();
  if (!hasPermission(session.access, "users_manage_roles")) {
    return { ok: false, error: "Missing permission: users.manage_roles." };
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "Member id is required." };

  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Member not found." };

  const sectionId = String(formData.get("sectionId") ?? "").trim() || null;

  await prisma.student.update({ where: { id }, data: { sectionId } });

  await invalidateByPrefix("members:");
  revalidatePath("/admin/members");
  return { ok: true };
}

export async function approveRoleRequest(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await currentSession();
  if (!hasPermission(session.access, "users_manage_roles")) {
    return { ok: false, error: "Missing permission: users.manage_roles." };
  }

  const request = await prisma.roleRequest.findUnique({
    where: { id },
    include: { user: { select: { name: true } } },
  });
  if (!request) return { ok: false, error: "Request not found." };
  if (request.status !== "PENDING") {
    return { ok: false, error: "This request has already been reviewed." };
  }

  const scopeType =
    request.requestedScopeType === "SECTION"
      ? ScopeType.SECTION
      : ScopeType.PROGRAM_YEAR;

  await prisma.$transaction([
    prisma.userRole.create({
      data: {
        userId: request.userId,
        roleId: request.requestedRoleId,
        scopeType,
        programYearId: request.requestedProgramYearId,
        sectionId: request.requestedSectionId,
        assignedBy: session.user.id,
      },
    }),
    prisma.roleRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "ROLE_ASSIGNED",
        targetId: request.userId,
        details: {
          role: request.requestedRoleId,
          scopeType,
          programYearId: request.requestedProgramYearId,
          sectionId: request.requestedSectionId,
          member: request.user.name,
        },
      },
    }),
  ]);

  await invalidateByPrefix("members:");
  revalidatePath("/admin/members");
  return { ok: true };
}

export async function suspendMember(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await currentSession();
  if (!hasPermission(session.access, "users_manage_roles")) {
    return { ok: false, error: "Missing permission: users.manage_roles." };
  }

  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Member not found." };

  const suspended = !existing.suspended;

  await prisma.$transaction([
    prisma.student.update({ where: { id }, data: { suspended } }),
    prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: suspended ? "MEMBER_SUSPENDED" : "MEMBER_REINSTATED",
        targetId: id,
        details: { member: `${existing.firstName} ${existing.lastName}`.trim() },
      },
    }),
  ]);

  await invalidateByPrefix("members:");
  revalidatePath("/admin/members");
  return { ok: true };
}

export async function removeAuthorization(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await currentSession();
  if (!hasPermission(session.access, "users_manage_roles")) {
    return { ok: false, error: "Missing permission: users.manage_roles." };
  }

  const existing = await prisma.student.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true } } },
  });
  if (!existing) return { ok: false, error: "Member not found." };

  const userId = existing.user?.id;

  await prisma.$transaction([
    prisma.student.update({ where: { id }, data: { sectionId: null } }),
    ...(userId
      ? [
          prisma.userRole.deleteMany({ where: { userId } }),
          prisma.roleRequest.updateMany({
            where: { userId, status: "PENDING" },
            data: {
              status: "REJECTED",
              reviewedById: session.user.id,
              reviewedAt: new Date(),
            },
          }),
        ]
      : []),
    prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "MEMBER_AUTHORIZATION_REMOVED",
        targetId: id,
        details: { member: `${existing.firstName} ${existing.lastName}`.trim() },
      },
    }),
  ]);

  await invalidateByPrefix("members:");
  revalidatePath("/admin/members");
  return { ok: true };
}

export async function rejectRoleRequest(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await currentSession();
  if (!hasPermission(session.access, "users_manage_roles")) {
    return { ok: false, error: "Missing permission: users.manage_roles." };
  }

  const request = await prisma.roleRequest.findUnique({
    where: { id },
    include: { user: { select: { name: true } } },
  });
  if (!request) return { ok: false, error: "Request not found." };
  if (request.status !== "PENDING") {
    return { ok: false, error: "This request has already been reviewed." };
  }

  await prisma.$transaction([
    prisma.roleRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "ROLE_REQUEST_REJECTED",
        targetId: request.userId,
        details: { role: request.requestedRoleId, member: request.user.name },
      },
    }),
  ]);

  await invalidateByPrefix("members:");
  revalidatePath("/admin/members");
  return { ok: true };
}
