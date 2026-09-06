import { AttendanceStatus, ScopeType } from "@prisma/client";
import { prisma, ensureAuthUser } from "./bootstrap";

// Student numbers to mark PRESENT with scan-in / scan-out for both
// "Buwan ng Wika" events (Morning and Afternoon).
const STUDENT_NUMBERS = [
  "2025-0435", "2024-1563", "2025-0161", "2024-0947",
  "2024-3250", "2026-7192", "2025-1474", "2025-0012",
  "2023-1824", "2024-3188", "2022-1791", "2025-3586",
  "2025-0393", "2025-0064", "2026-0777", "2024-0195",
  "2026-0104", "2023-0281", "2023-0928", "2023-0665",
  "2024-0598", "2025-0482", "2025-0480", "2025-0123",
  "2025-1273", "2026-0402", "2023-2112", "2023-1037",
  "2024-0814", "2025-0763", "2025-0565", "2025-0494",
  "2026-0086", "2025-0438", "2025-0120",   "2024-1251",
  "2025-0094",
  "2024-3200", "2025-0489", "2023-0919",
  "2025-0042", "2025-0513", "2025-0824", "2025-0481",
  "2026-0107", "2025-0727", "2026-0384", "2026-0913",
  "2026-0951", "2026-0672", "2026-0884", "2026-0880",
  "2023-2144",
  "2025-0533", "2023-2383", "2025-0227", "2023-2680",
  "2024-3383", "2026-0590", "2025-0484", "2023-2784",
  "2026-0794", "2024-3189", "2025-2713", "2026-0366",
  "2022-0482", "2026-0537", "2023-2868", "2026-0109",
  "2025-1515", "2026-0275", "2023-2015", "2026-0859",
  "2023-1805", "2026-0248", "2025-0456", "2026-0599",
  "2024-2124", "2026-0577", "2026-7543", "2025-0077",
  "2026-1155", "2026-7206", "2026-1043", "2024-1959",
  "2023-1798", "2023-1778", "2024-3219",
  "2025-1445", "2025-1841", "2025-3586", "2025-1189",
  "2025-2435", "2025-3613", "2025-1009", "2025-0929",
  "2025-0633", "2025-0151", "2025-3312", "2025-1079",
  "2025-2231", "2025-0083", "2025-1136", "2025-2278",
  "2025-2325", "2025-0899", "2025-1682", "2025-0738",
  "2025-1718", "2025-3028", "2025-1021", "2025-3580",
  "2025-2674", "2025-1232", "2025-1459", "2025-3376",
  "2024-1606", "2023-3071", "2024-1017", "2024-1232",
  "2024-1207", "2024-0402", "2024-1307", "2024-2429",
  "2024-2212", "2024-0946", "2024-0461", "2024-1320",
  "2024-0287", "2024-1716", "2024-1544",
];

// Event titles as they appear in the DB (adjust if yours differ).
const MORNING_TITLE = "BUWAN NG WIKA CULMINATION (MORNING)";
const AFTERNOON_TITLE = "BUWAN NG WIKA CULMINATION (AFTERNOON)";

// Scan times per event (local). Adjust to your actual schedule.
const MORNING_IN = new Date("2026-08-28T08:00:00");
const MORNING_OUT = new Date("2026-08-28T10:00:00");
const AFTERNOON_IN = new Date("2026-08-28T13:00:00");
const AFTERNOON_OUT = new Date("2026-08-28T15:00:00");

async function getEvent(title: string) {
  const ev = await prisma.event.findFirst({
    where: { title: { contains: title, mode: "insensitive" } },
    orderBy: { startsAt: "asc" },
  });
  if (!ev) throw new Error(`Event not found matching title: ${title}`);
  return ev;
}

async function ensureStudent(studentNo: string) {
  const existing = await prisma.student.findUnique({ where: { studentNo } });
  if (existing) return existing;

  const email = `${studentNo}@fhusocom.edu`;
  const name = studentNo;
  const supabaseId = await ensureAuthUser(email, "password123", name);
  const user = await prisma.user.create({
    data: { email, name, supabaseId },
  });
  const studentRole = await prisma.role.findUnique({ where: { name: "Student" } });
  if (studentRole) {
    const anyAdmin = await prisma.user.findFirst();
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: studentRole.id,
        scopeType: ScopeType.FACULTY,
        assignedBy: anyAdmin?.id ?? user.id,
      },
    });
  }
  return prisma.student.create({
    data: {
      studentNo,
      firstName: "Unknown",
      lastName: "Student",
      userId: user.id,
    },
  });
}

async function upsertAttendance(
  eventId: string,
  studentId: string,
  scannedById: string,
  checkIn: Date,
  checkOut: Date,
) {
  await prisma.attendance.upsert({
    where: { eventId_studentId: { eventId, studentId } },
    create: {
      eventId,
      studentId,
      status: AttendanceStatus.PRESENT,
      scannedById,
      scannedAt: new Date(),
      checkedInAt: checkIn,
      checkedOutAt: checkOut,
    },
    update: {
      status: AttendanceStatus.PRESENT,
      scannedById,
      scannedAt: new Date(),
      checkedInAt: checkIn,
      checkedOutAt: checkOut,
    },
  });
}

async function main() {
  const morning = await getEvent(MORNING_TITLE);
  const afternoon = await getEvent(AFTERNOON_TITLE);
  const scanner = await prisma.user.findFirstOrThrow({});

  let created = 0;
  let reused = 0;

  for (const no of STUDENT_NUMBERS) {
    const before = await prisma.student.count({ where: { studentNo: no } });
    const student = await ensureStudent(no);
    if (before === 0) created++;

    await upsertAttendance(morning.id, student.id, scanner.id, MORNING_IN, MORNING_OUT);
    await upsertAttendance(afternoon.id, student.id, scanner.id, AFTERNOON_IN, AFTERNOON_OUT);
    reused++;
  }

  console.log(
    `Done. Students processed: ${reused}, new accounts created: ${created}. ` +
      `Scan in/out written for both events: ${MORNING_TITLE} & ${AFTERNOON_TITLE}.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
