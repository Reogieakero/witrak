import { prisma } from "@fhusocom/db";

const terms = await prisma.academicTerm.findMany({ orderBy: { startsOn: "desc" } });
console.log("Terms:", terms.map((t) => `${t.name} active=${t.isActive} ${t.startsOn.toISOString().slice(0,10)}..${t.endsOn.toISOString().slice(0,10)}`));

const active = terms.find((t) => t.isActive) ?? terms[0];
const range = { gte: active.startsOn, lte: active.endsOn };

const events = await prisma.event.findMany({
  where: { requiresAttendance: true, startsAt: range, endsAt: { lte: new Date() } },
  select: { id: true, title: true, hasTimeInOut: true, startsAt: true },
});
console.log(`\nPast attendance events in active term: ${events.length}`);

for (const e of events) {
  const rows = await prisma.attendance.findMany({
    where: { eventId: e.id },
    select: { status: true, checkedInAt: true, checkedOutAt: true },
  });
  const present = rows.filter((r) => (r.status === "PRESENT" || r.status === "LATE") && (!e.hasTimeInOut || (r.checkedInAt && r.checkedOutAt))).length;
  console.log(`- ${e.title} [hasTimeInOut=${e.hasTimeInOut}] rows=${rows.length} presentUnderNewLogic=${present}`);
}

const totalAtt = await prisma.attendance.count();
console.log(`\nTotal attendance rows in DB: ${totalAtt}`);
process.exit(0);
