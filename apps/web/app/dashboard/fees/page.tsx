import { redirect } from "next/navigation";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { money } from "@/lib/constants/dashboard";
import { getTermContext } from "@/lib/terms";
import { StudentShell } from "@/app/components/student-shell";
import { StudentFeesPage } from "@/app/components/student/student-fees-page";
import { StudentSuspended } from "@/app/components/student/student-suspended";

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

export default async function StudentFeesRoute() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login/students");

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true, suspended: true },
  });
  if (!student) redirect("/admin/dashboard");

  // Suspended accounts get no access to the fees page.
  if (student.suspended) {
    return (
      <StudentShell userName={session.user.name ?? "Student"} roleLabel="Student" crumb="My Fees">
        <StudentSuspended />
      </StudentShell>
    );
  }

  await getTermContext();

  const [fees, proofs, paymentMethods] = await Promise.all([
    prisma.fee.findMany({ orderBy: { dueDate: "asc" } }),
    prisma.feeProof.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        feeId: true,
        status: true,
        fileUrl: true,
        method: true,
        reference: true,
        accountName: true,
        rejectionReason: true,
        createdAt: true,
        verifiedAt: true,
        verifiedBy: { select: { name: true } },
      },
    }),
    prisma.paymentMethod.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        type: true,
        accountName: true,
        accountNumber: true,
        instructions: true,
      },
    }),
  ]);

  const latestByFee = new Map<string, (typeof proofs)[number]>();
  for (const p of proofs) {
    if (!latestByFee.has(p.feeId)) latestByFee.set(p.feeId, p);
  }

  const feeStatements = fees.map((f) => {
    const latest = latestByFee.get(f.id);
    return {
      id: f.id,
      title: f.title,
      amount: money.format(Number(f.amount)),
      amountValue: Number(f.amount),
      dueDate: fmtDate(f.dueDate),
      status: latest ? latest.status : "UNPAID",
      submittedAt: latest ? fmtDate(latest.createdAt) : undefined,
      proof: latest
        ? {
            id: latest.id,
            status: latest.status,
            method: latest.method,
            reference: latest.reference,
            accountName: latest.accountName,
            fileUrl: latest.fileUrl,
            submittedAt: fmtDate(latest.createdAt),
            verifiedByName: latest.verifiedBy?.name ?? null,
            verifiedAt: latest.verifiedAt ? fmtDate(latest.verifiedAt) : null,
            rejectionReason: latest.rejectionReason,
          }
        : undefined,
    } as const;
  });

  const totalAmount = fees.reduce((sum, f) => sum + Number(f.amount), 0);
  const paidAmount = feeStatements
    .filter((f) => f.status === "PAID")
    .reduce((sum, f) => sum + f.amountValue, 0);
  const balanceAmount = totalAmount - paidAmount;
  const pendingCount = feeStatements.filter((f) => f.status === "PENDING").length;
  const usedReferences = [
    ...new Set(
      proofs
        .map((p) => p.reference?.trim())
        .filter((r): r is string => Boolean(r)),
    ),
  ];

  return (
    <StudentShell
      userName={session.user.name ?? "Student"}
      roleLabel="Student"
      crumb="My Fees"
    >
      <StudentFeesPage
        fees={feeStatements}
        totalAmount={money.format(totalAmount)}
        paidAmount={money.format(paidAmount)}
        balanceAmount={money.format(balanceAmount)}
        pendingCount={pendingCount}
        paymentMethods={paymentMethods}
        usedReferences={usedReferences}
      />
    </StudentShell>
  );
}