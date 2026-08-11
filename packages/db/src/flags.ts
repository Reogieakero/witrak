import { prisma, FlagStatus } from "./index";

export async function assertNoPendingFlag(params: {
  studentId: string;
  ruleId: string;
  periodRef: string;
}): Promise<void> {
  const existing = await prisma.sanctionFlag.findFirst({
    where: {
      studentId: params.studentId,
      ruleId: params.ruleId,
      periodRef: params.periodRef,
      status: FlagStatus.PENDING,
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error(
      "A pending sanction flag already exists for this student/rule/period.",
    );
  }
}
