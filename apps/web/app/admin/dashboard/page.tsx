import { redirect } from "next/navigation";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import DashboardView from "@/app/components/dashboard-view";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roles: { include: { role: { select: { name: true } } } } },
  });

  const isSuperAdmin =
    user?.roles.some((r) => r.role.name === "Super Admin") ?? false;

  if (!isSuperAdmin) redirect("/dashboard");

  return <DashboardView />;
}
