import { prisma } from "./src/index";

async function main() {
  const activeTerm = await prisma.academicTerm.findFirst({
    where: { isActive: true },
    select: { id: true, startsOn: true, endsOn: true },
  });
  const range = { gte: activeTerm!.startsOn, lte: activeTerm!.endsOn };

  const stale = await prisma.sanctionEvidence.findMany({
    where: {
      sanction: { issuedAt: range },
      attendance: { event: { startsAt: { not: range } } },
    },
    select: { id: true },
  });
  console.log("Stale cross-term evidence to remove:", stale.length);
  if (stale.length) {
    await prisma.sanctionEvidence.deleteMany({
      where: { id: { in: stale.map((e) => e.id) } },
    });
  }

  const total = await prisma.sanction.count();
  const inTerm = await prisma.sanction.findMany({
    where: {
      OR: [
        { evidences: { some: { attendance: { event: { startsAt: range } } } } },
        { issuedAt: range },
      ],
    },
    select: { id: true },
  });
  console.log("Total sanctions:", total, "| visible in active term:", inTerm.length);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());