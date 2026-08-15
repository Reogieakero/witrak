import { redirect } from "next/navigation";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { cached, CACHE_TTL } from "@/lib/cache";
import { AdminShell } from "@/app/components/admin-shell";
import { TransparencyView } from "@/app/components/transparency/transparency-view";
import { getTermContext, termRange } from "@/lib/terms";
import type { TransparencyFileItem, TransparencyStats } from "@/app/components/transparency/types";

type Category = "financial" | "events" | "minutes" | "reports";

const CATEGORY_META: Record<Category, { label: string; tone: "green" | "violet" | "amber" | "brand" }> = {
  financial: { label: "Financial", tone: "green" },
  events: { label: "Events", tone: "violet" },
  minutes: { label: "Minutes", tone: "amber" },
  reports: { label: "Reports", tone: "brand" },
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AdminTransparencyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const access = session.access;
  if (!hasPermission(access, "transparency_view")) redirect("/dashboard");

  const { term } = await getTermContext();
  const range = termRange(term);

  const canUpload = hasPermission(access, "transparency_upload");
  const canDelete = hasPermission(access, "transparency_delete");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      roles: { include: { role: { select: { name: true } } } },
    },
  });

  const { items, stats } = await cached(
    `transparency:${session.user.id}`,
    CACHE_TTL.MEDIUM,
    async () => {
      const files = await prisma.transparencyFile.findMany({
        where: range ? { uploadedAt: range } : undefined,
        orderBy: { uploadedAt: "desc" },
        include: { uploadedBy: { select: { name: true } } },
      });

      const totalFiles = files.length;
      const byCategory = files.reduce<Record<string, number>>((acc, f) => {
        const cat = (f.category as Category) ?? "reports";
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});

      const stats: TransparencyStats = {
        totalFiles,
        termName: term?.name ?? "Current Term",
        financialCount: byCategory.financial || 0,
        eventsCount: byCategory.events || 0,
        minutesCount: byCategory.minutes || 0,
        reportsCount: byCategory.reports || 0,
      };

      const items: TransparencyFileItem[] = files.map((f) => {
        const category = (f.category as Category) ?? "reports";
        const sizeMatch = (f.fileUrl || "").match(/(\d+(?:\.\d+)?)\s*(MB|KB|GB)/i);
        const size = sizeMatch ? sizeMatch[0] : "";
        return {
          id: f.id,
          title: f.title,
          fileUrl: f.fileUrl,
          fileType: f.fileUrl ? f.fileUrl.split(".").pop()?.toLowerCase() : undefined,
          category,
          categoryLabel: CATEGORY_META[category]?.label ?? category,
          categoryTone: CATEGORY_META[category]?.tone ?? "brand",
          uploadedBy: f.uploadedBy?.name ?? "Unknown",
          uploadedAt: formatDate(f.uploadedAt),
          size: size || undefined,
          canDelete,
        };
      });

      return { items, stats };
    },
  );

  const userName = user?.name ?? "Officer";
  const isSuperAdmin = user?.roles.some((r) => r.role.name === "Super Admin") ?? false;
  const roleLabel = isSuperAdmin ? "Super Admin" : (user?.roles[0]?.role.name ?? "Officer");

  return (
    <AdminShell userName={userName} roleLabel={roleLabel}>
      <TransparencyView
        items={items}
        stats={stats}
        canUpload={canUpload}
      />
    </AdminShell>
  );
}
