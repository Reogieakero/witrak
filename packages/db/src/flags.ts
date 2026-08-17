import { prisma, FlagStatus, AuditAction } from "./index";

export type RecomputeResult = "none" | "created" | "updated";

export async function recomputeAllSanctions(): Promise<{
  created: number;
  updated: number;
}> {
  const students = await prisma.student.findMany({ select: { id: true } });
  let created = 0;
  let updated = 0;
  for (const s of students) {
    const result = await recomputeSanctionTriggers(s.id);
    if (result === "created") created += 1;
    else if (result === "updated") updated += 1;
  }
  return { created, updated };
}

/**
 * Resolve the sanction requirement for a given absence count. Students are
 * sanctioned purely by how many absences they have — no threshold rules. The
 * requirement is the fine whose `absenceCount` is the largest value <= count
 * (so e.g. 11 absences falls back to the 10-absence fine). Returns null when
 * no fine is defined for that count.
 */
async function resolveFineForCount(
  count: number,
): Promise<{ id: string; title: string; description: string } | null> {
  if (count <= 0) return null;
  const fines = await prisma.sanctionFine.findMany({
    where: { absenceCount: { lte: count } },
    orderBy: { absenceCount: "desc" },
    take: 1,
    select: { id: true, title: true, description: true },
  });
  return fines[0] ?? null;
}

export async function recomputeSanctionTriggers(
  studentId: string,
): Promise<RecomputeResult> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      section: {
        include: { programYear: { include: { program: true } } },
      },
    },
  });

  const activeTerm = await prisma.academicTerm.findFirst({
    where: { isActive: true },
    select: { id: true, name: true, startsOn: true, endsOn: true },
  });
  const periodRef = activeTerm?.id ?? "default";
  const now = new Date();

  const pastEventWhere = activeTerm
    ? {
        requiresAttendance: true,
        startsAt: { gte: activeTerm.startsOn, lte: activeTerm.endsOn },
        endsAt: { lte: now },
      }
    : { requiresAttendance: true, endsAt: { lte: now } };

  const pastEvents = await prisma.event.findMany({
    where: pastEventWhere,
    select: { id: true },
  });
  const pastEventIds = pastEvents.map((e) => e.id);
  const range = activeTerm
    ? { gte: activeTerm.startsOn, lte: activeTerm.endsOn }
    : null;

  const [presentLateCount, otherAbsentCount] = await Promise.all([
    pastEventIds.length
      ? prisma.attendance.count({
          where: {
            studentId,
            status: { in: ["PRESENT", "LATE"] },
            eventId: { in: pastEventIds },
            ...(range ? { scannedAt: range } : {}),
          },
        })
      : Promise.resolve(0),
    prisma.attendance.count({
      where: {
        studentId,
        status: { in: ["ABSENT", "EXCUSED"] },
        ...(pastEventIds.length ? { eventId: { notIn: pastEventIds } } : {}),
        ...(range ? { scannedAt: range } : {}),
        ...(range ? { event: { startsAt: range } } : {}),
      },
    }),
  ]);

  const count =
    Math.max(0, pastEventIds.length - presentLateCount) + otherAbsentCount;
  if (count === 0) return "none";

  const fine = await resolveFineForCount(count);
  if (!fine) return "none";

  const [existingSanction, existingFlag] = await Promise.all([
    prisma.sanction.findFirst({
      where: {
        studentId,
        ...(range ? { issuedAt: range } : {}),
      },
      select: { id: true, status: true, fineId: true },
    }),
    prisma.sanctionFlag.findFirst({
      where: { studentId, periodRef },
      select: { id: true, triggerCount: true },
    }),
  ]);

  // A cleared sanction stays cleared — never reopen it.
  if (existingSanction?.status === "RESOLVED") return "none";

  const absentRows = await prisma.attendance.findMany({
    where: {
      studentId,
      status: { in: ["ABSENT", "EXCUSED"] },
      ...(range ? { scannedAt: range } : {}),
    },
    select: { id: true },
  });

  const reason = `Automatically issued: ${count} absence${
    count === 1 ? "" : "s"
  }. ${fine.description}`;

  // Already sanctioned (open): upgrade in place when the requirement or
  // absence count has changed, instead of freezing at the original issue
  // time. The student still holds exactly one sanction per term.
  if (existingSanction) {
    if (
      existingSanction.fineId === fine.id &&
      (existingFlag?.triggerCount ?? 0) === count
    ) {
      return "none";
    }

    await prisma.$transaction(async (tx) => {
      if (existingFlag) {
        await tx.sanctionFlag.update({
          where: { id: existingFlag.id },
          data: {
            triggerCount: count,
            status: FlagStatus.RESOLVED,
            reviewedAt: new Date(),
          },
        });
      } else {
        await tx.sanctionFlag.create({
          data: {
            studentId,
            periodRef,
            triggerCount: count,
            status: FlagStatus.RESOLVED,
            reviewedAt: new Date(),
          },
        });
      }

      await tx.sanction.update({
        where: { id: existingSanction.id },
        data: {
          fineId: fine.id,
          title: fine.title,
          reason,
          issuedAt: new Date(),
        },
      });

      await tx.sanctionEvidence.deleteMany({
        where: { sanctionId: existingSanction.id },
      });
      if (absentRows.length) {
        await tx.sanctionEvidence.createMany({
          data: absentRows.map((a) => ({
            sanctionId: existingSanction.id,
            attendanceId: a.id,
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          action: AuditAction.SANCTION_CREATED,
          targetId: existingSanction.id,
          details: {
            auto: true,
            upgraded: true,
            title: fine.title,
            absences: count,
          },
        },
      });
    });
    return "updated";
  }

  await prisma.$transaction(async (tx) => {
    await tx.sanctionFlag.create({
      data: {
        studentId,
        periodRef,
        triggerCount: count,
        status: FlagStatus.RESOLVED,
        reviewedAt: new Date(),
      },
    });

    const sanction = await tx.sanction.create({
      data: {
        studentId,
        fineId: fine.id,
        title: fine.title,
        reason,
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
          title: fine.title,
          absences: count,
        },
      },
    });
  });
  return "created";
}
