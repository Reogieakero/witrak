import { redirect } from "next/navigation";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { money } from "@/lib/constants/dashboard";
import { getTermContext, eventInTerm } from "@/lib/terms";
import { StudentShell } from "@/app/components/student-shell";
import { StudentSuspended } from "@/app/components/student/student-suspended";
import { ReportPage } from "@/app/components/report/report-page";
import type { ReportFeeOption, ReportEventOption } from "@/app/components/report/types";

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  });
}

export default async function ReportRoute() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login/students");

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true, suspended: true },
  });
  if (!student) redirect("/admin/dashboard");

  if (student.suspended) {
    return (
      <StudentShell
        userName={session.user.name ?? "Student"}
        roleLabel="Student"
        crumb="Report"
      >
        <StudentSuspended />
      </StudentShell>
    );
  }

  const { term } = await getTermContext();

  const [fees, events] = await Promise.all([
    prisma.fee.findMany({
      orderBy: { dueDate: "asc" },
      select: { id: true, title: true, amount: true, dueDate: true },
    }),
    prisma.event.findMany({
      where: eventInTerm(term),
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        title: true,
        startsAt: true,
        endsAt: true,
      },
    }),
  ]);

  const feeOptions: ReportFeeOption[] = fees.map((f) => ({
    id: f.id,
    title: f.title,
    amount: money.format(Number(f.amount)),
    dueDate: fmtDate(f.dueDate),
  }));

  const eventOptions: ReportEventOption[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    date: fmtDate(e.startsAt),
  }));

  return (
    <StudentShell
      userName={session.user.name ?? "Student"}
      roleLabel="Student"
      crumb="Report"
    >
      <ReportPage fees={feeOptions} events={eventOptions} />
    </StudentShell>
  );
}
