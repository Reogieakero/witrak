import { redirect } from "next/navigation";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import StudentHomeView from "@/app/components/student/student-home";
import { StudentSuspended } from "@/app/components/student/student-suspended";
import { StudentShell } from "@/app/components/student-shell";

export default async function StudentDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login/students");

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true, suspended: true },
  });

  // Students land on /dashboard. Officers (no linked student record) go to the
  // admin surface instead.
  if (!student) redirect("/admin/dashboard");

  // Suspended accounts get no access to the student dashboard.
  if (student.suspended) {
    return (
      <StudentShell userName={session.user.name ?? "Student"} roleLabel="Student" crumb="Home">
        <StudentSuspended />
      </StudentShell>
    );
  }

  return <StudentHomeView studentId={student.id} userName={session.user.name ?? "Student"} />;
}