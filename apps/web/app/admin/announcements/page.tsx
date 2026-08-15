import { redirect } from "next/navigation";

export const revalidate = 30;
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { cached, CACHE_TTL } from "@/lib/cache";
import { AdminShell } from "@/app/components/admin-shell";
import { AnnouncementsView } from "@/app/components/announcements/announcements-view";
import { getTermContext, termRange } from "@/lib/terms";
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

  const { term } = await getTermContext();
  const range = termRange(term);
  const termKey = term?.id ?? "none";

  const canCreate = hasPermission(access, "announcements_create");
  const canEdit = hasPermission(access, "announcements_edit");
  const canDelete = hasPermission(access, "announcements_delete");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      roles: { include: { role: { select: { name: true } } } },
    },
  });

  const { items, stats, programOptions } = await cached(
    `announcements:${termKey}`,
    CACHE_TTL.MEDIUM,
    async () => {
      const [announcements, programs] = await Promise.all([
        prisma.announcement.findMany({
          where: range ? { createdAt: range } : undefined,
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
        prisma.program.findMany({ orderBy: { name: "asc" } }),
      ]);

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
        termName: term?.name ?? "Current Term",
      };

      const programOptions: ProgramOption[] = programs.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
      }));

      return { items, stats, programOptions };
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
      <AnnouncementsView
        announcements={items}
        stats={stats}
        programs={programOptions}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        userName={userName}
        roleLabel={roleLabel}
      />
    </AdminShell>
  );
}
