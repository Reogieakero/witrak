import { redirect } from "next/navigation";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import StudentHomeView from "@/app/components/student/student-home";

export default async function StudentDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login/students");

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  // Students land on /dashboard. Officers (no linked student record) go to the
  // admin surface instead.
  if (!student) redirect("/admin/dashboard");

  return <StudentHomeView studentId={student.id} userName={session.user.name ?? "Student"} />;
}