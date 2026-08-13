import { prisma, FlagStatus, AuditAction } from "./index";

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

type ScopeSpecificity = 0 | 1 | 2 | 3 | 4;

function ruleSpecificity(rule: {
  scopeType: string;
  programId: string | null;
  programYearId: string | null;
  sectionId: string | null;
}, student: {
  section: {
    id: string;
    programYear: { id: string; program: { id: string } };
  };
}): ScopeSpecificity {
  const section = student.section;
  if (rule.sectionId && rule.sectionId === section.id) return 4;
  if (rule.programYearId && rule.programYearId === section.programYear.id) return 3;
  if (rule.programId && rule.programId === section.programYear.program.id) return 2;
  if (rule.scopeType === "FACULTY") return 1;
  return 0;
}

export async function recomputeSanctionTriggers(studentId: string): Promise<void> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      section: {
        include: { programYear: { include: { program: true } } },
      },
    },
  });
  const section = student?.section;
  if (!section) return;

  const activeTerm = await prisma.academicTerm.findFirst({
    where: { isActive: true },
    select: { id: true, name: true },
  });
  const periodRef = activeTerm?.id ?? "default";

  const count = await prisma.attendance.count({
    where: { studentId, status: "ABSENT" },
  });
  if (count === 0) return;

  const rules = await prisma.sanctionRule.findMany({ where: { active: true } });

  let best: { rule: typeof rules[number]; spec: ScopeSpecificity } | null = null;
  for (const rule of rules) {
    const spec = ruleSpecificity(rule, { section });
    if (spec === 0 || rule.absenceThreshold > count) continue;
    if (!best || spec > best.spec) {
      best = { rule, spec };
      continue;
    }
    if (spec === best.spec && rule.absenceThreshold > best.rule.absenceThreshold) {
      best = { rule, spec };
      continue;
    }
    if (
      spec === best.spec &&
      rule.absenceThreshold === best.rule.absenceThreshold &&
      rule.period === "SEMESTER" &&
      best.rule.period !== "SEMESTER"
    ) {
      best = { rule, spec };
    }
  }
  if (!best) return;
  const rule = best.rule;

  const [existingSanction, existingFlag] = await Promise.all([
    prisma.sanction.findFirst({
      where: { studentId },
      select: { id: true },
    }),
    prisma.sanctionFlag.findFirst({
      where: { studentId, periodRef },
      select: { id: true },
    }),
  ]);
  if (existingSanction || existingFlag) return;

  const absentRows = await prisma.attendance.findMany({
    where: { studentId, status: "ABSENT" },
    select: { id: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.sanctionFlag.create({
      data: {
        studentId,
        ruleId: rule.id,
        periodRef,
        triggerCount: count,
        status: FlagStatus.RESOLVED,
        reviewedAt: new Date(),
      },
    });

    const sanction = await tx.sanction.create({
      data: {
        studentId,
        ruleId: rule.id,
        title: `Excessive absences (${count})`,
        reason: `Automatically issued: ${count} absences ≥ threshold ${rule.absenceThreshold}.`,
        status: "OPEN",
        issuedAt: new Date(),
      },
    });

    if (absentRows.length) {
      await tx.sanctionEvidence.createMany({
        data: absentRows.map((a) => ({
          sanctionId: sanction.id,
          attendanceId: a.id,
        })),
      });
    }

    await tx.auditLog.create({
      data: {
        action: AuditAction.SANCTION_CREATED,
        targetId: sanction.id,
        details: {
          auto: true,
          title: `Excessive absences (${count})`,
          rule: `${rule.absenceThreshold} absences`,
        },
      },
    });
  });
}

export async function backfillSanctionRule(ruleId: string): Promise<void> {
  const rule = await prisma.sanctionRule.findUnique({ where: { id: ruleId } });
  if (!rule || !rule.active) return;

  const scopeWhere =
    rule.scopeType === "PROGRAM" && rule.programId
      ? { section: { programYear: { programId: rule.programId } } }
      : rule.scopeType === "PROGRAM_YEAR" && rule.programYearId
        ? { section: { programYearId: rule.programYearId } }
        : rule.scopeType === "SECTION" && rule.sectionId
          ? { sectionId: rule.sectionId }
          : {};

  const students = await prisma.student.findMany({
    where: scopeWhere,
    select: { id: true },
  });

  const BATCH = 20;
  for (let i = 0; i < students.length; i += BATCH) {
    const chunk = students.slice(i, i + BATCH);
    await Promise.all(chunk.map((s) => recomputeSanctionTriggers(s.id)));
  }
}
