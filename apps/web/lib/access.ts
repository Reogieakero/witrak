import { prisma } from "@fhusocom/db";
import type { UserAccess } from "@/lib/permissions";

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
