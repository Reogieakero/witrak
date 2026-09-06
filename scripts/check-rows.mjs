import { prisma } from "@fhusocom/db";

const rows = await prisma.attendance.findMany({
  select: { status: true, checkedInAt: true, checkedOutAt: true, scannedAt: true, event: { select: { title: true, requiresAttendance: true, hasTimeInOut: true, startsAt: true, endsAt: true } } },
  orderBy: { scannedAt: "desc" },
});
for (const r of rows) {
  const now = new Date();
  const isPast = r.event.startsAt <= now && now < r.event.endsAt ? "live" : r.event.startsAt > now ? "upcoming" : "past";
  console.log(`${r.event.title} | reqAtt=${r.event.requiresAttendance} hasTIO=${r.event.hasTimeInOut} status=${r.status} in=${!!r.checkedInAt} out=${!!r.checkedOutAt} eventStatus=${isPast} scanned=${r.scannedAt?.toISOString().slice(0,10)}`);
}
process.exit(0);
