import { redirect } from "next/navigation";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import StudentHomeView from "@/app/components/student/student-home";
import { StudentSuspended } from "@/app/components/student/student-suspended";
import { StudentShell } from "@/app/components/student-shell";

export default async function StudentDashboardPage({
  searchParams,
}: {
  searchParams: { walkthrough?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login/students");

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true, suspended: true, sectionId: true, imageUrl: true },
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

  const forceWalkthrough = searchParams.walkthrough === "1";

  // Incomplete profiles (no section and/or no photo) must finish setup first.
  const needsSection = !student.sectionId;
  const needsPhoto = !student.imageUrl;

  return (
    <StudentHomeView
      studentId={student.id}
      userName={session.user.name ?? "Student"}
      forceWalkthrough={forceWalkthrough}
      needsSection={needsSection}
      needsPhoto={needsPhoto}
    />
  );
}