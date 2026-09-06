import { redirect } from "next/navigation";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { cached, CACHE_TTL } from "@/lib/cache";
import { AdminShell } from "@/app/components/admin-shell";
import { ReportsView } from "@/app/components/reports/reports-view";
import { getTermContext, termRange } from "@/lib/terms";
import type { ReportItem, ReportStats } from "@/app/components/reports/types";

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  });
}

export default async function AdminReportsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login/officers");

  const access = session.access;
  if (!hasPermission(access, "reports_view")) redirect("/dashboard");

  const scope = access?.scopeSectionIds ?? null;
  const { term } = await getTermContext();
  const range = termRange(term);
  const termKey = term?.id ?? "none";

  const canManage = hasPermission(access, "reports_manage");

  const { reportItems, stats, userName, roleLabel } = await cached(
    `reports:${termKey}:${session.user.id}:${scope?.join(",") ?? "all"}`,
    CACHE_TTL.SHORT,
    async () => {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          name: true,
          roles: { include: { role: { select: { name: true } } } },
        },
      });

      const rows = await prisma.report.findMany({
        where: {
          ...(scope ? { student: { sectionId: { in: scope } } } : {}),
          ...(range ? { createdAt: range } : {}),
        },
        orderBy: { createdAt: "desc" },
        include: {
          student: {
            select: {
              studentNo: true,
              firstName: true,
              lastName: true,
              section: {
                select: {
                  name: true,
                  programYear: {
                    select: {
                      level: true,
                      program: { select: { code: true } },
                    },
                  },
                },
              },
            },
          },
          event: { select: { title: true, startsAt: true } },
          fee: { select: { title: true } },
        },
      });

      const reportItems: ReportItem[] = rows.map((r) => ({
        id: r.id,
        studentId: r.studentId,
        studentName: `${r.student.firstName} ${r.student.lastName}`.trim(),
        studentNo: r.student.studentNo,
        sectionName: r.student.section?.name ?? "—",
        programCode: r.student.section?.programYear.program.code ?? "—",
        yearLevel: r.student.section?.programYear.level ?? 0,
        category: r.category,
        subject: r.subject,
        description: r.description,
        status: r.status,
        eventId: r.eventId,
        eventTitle: r.event?.title ?? null,
        eventDate: r.event?.startsAt ? fmtDate(r.event.startsAt) : null,
        feeId: r.feeId,
        feeTitle: r.fee?.title ?? null,
        createdAt: fmtDate(r.createdAt),
        resolutionNote: r.resolutionNote,
      }));

      const stats: ReportStats = {
        total: reportItems.length,
        pending: reportItems.filter((r) => r.status === "PENDING").length,
        reviewed: reportItems.filter((r) => r.status === "REVIEWED").length,
        resolved: reportItems.filter((r) => r.status === "RESOLVED").length,
        termName: term?.name ?? "Current Term",
      };

      return {
        reportItems,
        stats,
        userName: user?.name ?? "Officer",
        roleLabel: user?.roles.some((r) => r.role.name === "Super Admin")
          ? "Supreme"
          : user?.roles[0]?.role.name ?? "Officer",
      };
    },
  );

  return (
    <AdminShell userName={userName} roleLabel={roleLabel}>
      <ReportsView
        reports={reportItems}
        stats={stats}
        canManage={canManage}
      />
    </AdminShell>
  );
}
