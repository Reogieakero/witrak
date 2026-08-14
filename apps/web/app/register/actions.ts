"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { ScopeType } from "@fhusocom/db";
import { prisma } from "@fhusocom/db";

export async function registerStudent(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const studentNo = String(formData.get("studentNo") ?? "").trim();

  if (!email) return { ok: false, error: "Email is required." };
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  if (!firstName || !lastName) {
    return { ok: false, error: "First and last name are required." };
  }
  if (!studentNo) {
    return { ok: false, error: "Student number is required." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const role = await prisma.role.findUnique({ where: { name: "Student" } });

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, name: `${firstName} ${lastName}`.trim(), passwordHash },
      });
      if (role) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: role.id,
            scopeType: ScopeType.FACULTY,
            assignedBy: user.id,
          },
        });
      }
      await tx.student.create({
        data: { firstName, lastName, studentNo, userId: user.id },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message.includes("studentNo")) {
      return {
        ok: false,
        error: "That student number is already registered. Use the officer portal if you believe this is a mistake.",
      };
    }
    if (e instanceof Error && e.message.includes("email")) {
      return { ok: false, error: "An account with that email already exists. Try signing in instead." };
    }
    return { ok: false, error: "Registration failed. Please check your details and try again." };
  }

  redirect("/login?registered=1");
}