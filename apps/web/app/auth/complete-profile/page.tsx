import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@fhusocom/db";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { CompleteProfileForm } from "./complete-profile-form";
import styles from "./complete-profile.module.css";

export const dynamic = "force-dynamic";

export default async function CompleteProfilePage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login/students");
  }

  const email = user.email?.toLowerCase().trim() ?? "";
  const existing = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    select: { id: true, student: { select: { id: true } } },
  });

  if (existing?.student?.id) {
    redirect("/dashboard");
  }

  const programs = await prisma.program.findMany({
    orderBy: { code: "asc" },
    select: { id: true, code: true },
  });

  const yearLevels = await prisma.yearLevel.findMany({
    orderBy: [{ program: { code: "asc" } }, { level: "asc" }],
    include: { program: { select: { code: true } } },
  });

  const sections = await prisma.section.findMany({
    orderBy: [
      { programYear: { program: { code: "asc" } } },
      { programYear: { level: "asc" } },
      { name: "asc" },
    ],
    include: {
      programYear: { include: { program: { select: { code: true } } } },
    },
  });

  const programOptions = programs.map((p) => ({
    value: p.id,
    label: p.code,
  }));

  const yearOptions = yearLevels.map((y) => ({
    value: y.id,
    label: `Year ${y.level}`,
    programId: y.programId,
  }));

  const sectionOptions = sections.map((s) => ({
    value: s.id,
    label: `Section ${s.name}`,
    programYearId: s.programYearId,
  }));

  return (
    <main className={`${styles.main} ${styles.dotGrid}`}>
      <div className={styles.card}>
        <div className={styles.brandRow}>
          <span className={styles.logo}>
            <img src="/logo-favicon.png" alt="Liberalis" />
          </span>
          <span className={styles.brandName}>Liberalis</span>
        </div>

        <h1 className={styles.title}>Complete your student profile</h1>
        <p className={styles.subtitle}>
          Your Google account (<strong>{email}</strong>) is not registered to
          the system yet. Fill in your student details to continue.
        </p>

        <Suspense fallback={null}>
          <CompleteProfileForm
            email={email}
            programOptions={programOptions}
            yearOptions={yearOptions}
            sectionOptions={sectionOptions}
          />
        </Suspense>

        <div className={styles.switch}>
          <Link href="/login/students" className={styles.switchLink}>
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}