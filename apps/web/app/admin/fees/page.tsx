import { redirect } from "next/navigation";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { money } from "@/lib/constants/dashboard";
import { AdminShell } from "@/app/components/admin-shell";
import { FeesView } from "@/app/components/fees/fees-view";
import { getTermContext, termRange } from "@/lib/terms";
import type {
  FeeItem,
  FeeProofRow,
  StudentBalanceRow,
  FeeStats,
  BalanceStatus,
} from "@/app/components/fees/types";

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(d: Date): string {
  const date = d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
}

function toInputDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default async function AdminFeesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const access = session.access;
  if (!hasPermission(access, "fees_view")) redirect("/dashboard");
  const { term } = await getTermContext();
  const range = termRange(term);
  const [user, fees, proofs, students, studentTotal, programs, paymentMethods] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          name: true,
          roles: { include: { role: { select: { name: true } } } },
        },
      }),
      prisma.fee.findMany({
        where: range ? { createdAt: range } : undefined,
        orderBy: { dueDate: "desc" },
      }),
      prisma.feeProof.findMany({
        where: range ? { createdAt: range } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          fee: true,
          student: {
            select: {
              id: true,
              studentNo: true,
              firstName: true,
              lastName: true,
              section: {
                select: {
                  name: true,
                  programYear: {
                    select: { level: true, program: { select: { code: true } } },
                  },
                },
              },
            },
          },
          verifiedBy: { select: { name: true } },
        },
      }),
      prisma.student.findMany({
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        include: {
          section: {
            select: {
              name: true,
              programYear: {
                select: { level: true, program: { select: { code: true } } },
              },
            },
          },
        },
      }),
      prisma.student.count(),
      prisma.program.findMany({ select: { enrollmentTarget: true } }),
      prisma.paymentMethod.findMany({ orderBy: { sortOrder: "asc" } }),
    ]);

  const canCreate = hasPermission(access, "fees_create");
  const canVerify = hasPermission(access, "fees_verify_payment");

  const feeItems: FeeItem[] = fees.map((f) => ({
    id: f.id,
    title: f.title,
    amount: money.format(Number(f.amount)),
    amountValue: Number(f.amount),
    dueDate: formatDate(f.dueDate),
    dueDateValue: toInputDate(f.dueDate),
  }));

  const proofRows: FeeProofRow[] = proofs.map((p) => {
    const st = p.student;
    return {
      id: p.id,
      status: p.status,
      studentId: st.id,
      studentName: `${st.firstName} ${st.lastName}`.trim(),
      studentNo: st.studentNo,
      sectionName: st.section?.name ?? "—",
      yearLevel: st.section?.programYear.level ?? 0,
      programCode: st.section?.programYear.program.code ?? "—",
      feeId: p.feeId,
      feeTitle: p.fee.title,
      feeAmount: money.format(Number(p.fee.amount)),
      fileUrl: p.fileUrl,
      method: p.method ?? undefined,
      reference: p.reference ?? undefined,
      accountName: p.accountName ?? undefined,
      submittedAt: formatDateTime(p.createdAt),
      verifiedByName: p.verifiedBy?.name,
      verifiedAt: p.verifiedAt ? formatDateTime(p.verifiedAt) : undefined,
      rejectionReason: p.rejectionReason ?? undefined,
    };
  });

  const latestByStudentFee = new Map<string, (typeof proofs)[number]>();
  for (const p of proofs) {
    const key = `${p.studentId}:${p.feeId}`;
    if (!latestByStudentFee.has(key)) latestByStudentFee.set(key, p);
  }

  const studentSectionLabel = (section: {
    name: string | null;
    programYear: { level: number; program: { code: string } } | null;
  } | null) =>
    section?.programYear
      ? `${section.programYear.program.code}-${section.name}`
      : "—";

  const balanceRows: StudentBalanceRow[] = students.map((student) => {
    let balance = 0;
    const cells = fees.map((fee) => {
      const latest = latestByStudentFee.get(`${student.id}:${fee.id}`);
      const status: BalanceStatus = latest ? latest.status : "UNPAID";
      if (status !== "PAID") balance += Number(fee.amount);
      return { feeId: fee.id, status, proofId: latest?.id };
    });
    return {
      id: student.id,
      studentName: `${student.firstName} ${student.lastName}`.trim(),
      studentNo: student.studentNo,
      sectionName: studentSectionLabel(student.section),
      yearLevel: student.section?.programYear.level ?? 0,
      programCode: student.section?.programYear.program.code ?? "—",
      cells,
      balance: money.format(balance),
      paidInFull: balance === 0,
    };
  });

  const targetTotal = programs.reduce(
    (sum, p) => sum + (p.enrollmentTarget ?? 0),
    0,
  );
  const hasTargets = programs.some((p) => p.enrollmentTarget != null);
  const headcount = hasTargets ? targetTotal : studentTotal;
  const feeTarget = fees.reduce((sum, f) => sum + Number(f.amount) * headcount, 0);
  let collectedRaw = 0;
  let paidCount = 0;
  for (const key of latestByStudentFee.keys()) {
    const latest = latestByStudentFee.get(key);
    if (latest) {
      if (latest.status === "PAID") {
        collectedRaw += Number(latest.fee.amount);
        paidCount += 1;
      }
    }
  }

  const pendingProofRows = proofRows.filter((p) => p.status === "PENDING");

  const stats: FeeStats = {
    target: money.format(feeTarget),
    collected: money.format(collectedRaw),
    collectedPct: feeTarget > 0 ? Math.round((collectedRaw / feeTarget) * 100) : 0,
    pending: pendingProofRows.length,
    rejected: proofRows.filter((p) => p.status === "REJECTED").length,
    termName: term?.name ?? "Current Term",
    feeCount: feeItems.length,
    paidCount,
  };

  const userName = user?.name ?? "Officer";
  const isSuperAdmin =
    user?.roles.some((r) => r.role.name === "Super Admin") ?? false;
  const roleLabel = isSuperAdmin
    ? "Super Admin"
    : user?.roles[0]?.role.name ?? "Officer";

  return (
    <AdminShell userName={userName} roleLabel={roleLabel}>
        <FeesView
          fees={feeItems}
          proofRows={proofRows}
          balanceRows={balanceRows}
          paymentMethods={paymentMethods.map((m) => ({
            id: m.id,
            type: m.type,
            accountName: m.accountName,
            accountNumber: m.accountNumber,
            instructions: m.instructions,
            active: m.active,
          }))}
          stats={stats}
          canCreate={canCreate}
          canVerify={canVerify}
        />
    </AdminShell>
  );
}