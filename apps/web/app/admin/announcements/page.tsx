import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { AdminShell } from "@/app/components/admin-shell";
import { AnnouncementsView } from "@/app/components/announcements/announcements-view";
import type {
  AnnouncementItem,
  AnnouncementStats,
  ProgramOption,
} from "@/app/components/announcements/types";

function formatDateTime(d: Date): string {
  const date = d.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
}

export default async function AdminAnnouncementsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const access = session.access;
  if (!hasPermission(access, "announcements_view")) redirect("/dashboard");

  const [user, announcements, activeTerm, programs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        roles: { include: { role: { select: { name: true } } } },
      },
    }),
    prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: {
            name: true,
            roles: { include: { role: { select: { name: true } } } },
          },
        },
        program: { select: { name: true } },
      },
    }),
    prisma.academicTerm.findFirst({ where: { isActive: true } }),
    prisma.program.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!user) redirect("/login");

  const canCreate = hasPermission(access, "announcements_create");
  const canEdit = hasPermission(access, "announcements_edit");
  const canDelete = hasPermission(access, "announcements_delete");

  const items: AnnouncementItem[] = announcements.map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    authorName: a.createdBy.name ?? "Officer",
    authorRole: a.createdBy.roles[0]?.role.name ?? "Officer",
    createdAt: formatDateTime(a.createdAt),
    imageUrl: a.imageUrl,
    audience:
      a.scopeType === "PROGRAM" && a.program ? a.program.name : "All students",
    scopeType: a.scopeType,
    programId: a.programId,
  }));

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const stats: AnnouncementStats = {
    total: items.length,
    thisWeek: announcements.filter((a) => a.createdAt >= weekAgo).length,
    authors: new Set(items.map((i) => i.authorName)).size,
    termName: activeTerm?.name ?? "Current Term",
  };

  const userName = user?.name ?? "Officer";
  const isSuperAdmin =
    user?.roles.some((r) => r.role.name === "Super Admin") ?? false;
  const roleLabel = isSuperAdmin
    ? "Super Admin"
    : user?.roles[0]?.role.name ?? "Officer";

  return (
    <AdminShell userName={userName} roleLabel={roleLabel}>
      <AnnouncementsView
        announcements={items}
        stats={stats}
        programs={programs.map((p) => ({ id: p.id, name: p.name, code: p.code }))}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        userName={userName}
        roleLabel={roleLabel}
      />
    </AdminShell>
  );
}
