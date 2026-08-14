"use server";

import { ScopeType } from "@fhusocom/db";
import { revalidatePath } from "next/cache";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { hasPermission, type UserAccess } from "@/lib/permissions";

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

  try {
    await prisma.student.create({
      data: { firstName, lastName, studentNo, sectionId },
    });
  } catch {
    return { ok: false, error: "A student with that student number already exists." };
  }

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

  revalidatePath("/admin/members");
  return { ok: true };
}
