import ExcelJS from "exceljs";
import { PrismaClient, AttendanceStatus } from "@prisma/client";
const p = new PrismaClient();
const norm = (s: string) => s.trim().toLowerCase().replace(/[^a-zñ\s]/gi, "").replace(/\s+/g, " ");
function fileParts(full: string) {
  const t = norm(full).split(" ").filter(Boolean);
  if (t.length === 0) return { first: "", last: "", key: "|" };
  if (t.length === 1) return { first: t[0], last: "", key: `|${t[0]}` };
  const last = t[t.length - 1];
  const first = t.slice(0, -1).join(" ");
  const fw = t[0];
  return { first, last, key: `${last}|${fw}` };
}
function parseScan(s: string): Date | null {
  // "Aug 26, 03:14 PM" -> 2026-08-26
  const m = s.match(/(\w{3})\s+(\d+),\s+(\d+):(\d+)\s+(AM|PM)/i);
  if (!m) return null;
  const mon: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  let h = parseInt(m[3], 10);
  if (/pm/i.test(m[5]) && h < 12) h += 12;
  if (/am/i.test(m[5]) && h === 12) h = 0;
  return new Date(2026, mon[m[1].toLowerCase()], parseInt(m[2], 10), h, parseInt(m[4], 10));
}
async function m() {
  const students = await p.student.findMany({ include: { user: { select: { id: true, email: true, name: true } } } });
  const idx = new Map<string, typeof students>();
  for (const s of students) {
    const last = norm(s.lastName).split(" ").filter(Boolean);
    const lastKey = last.length ? last[last.length - 1] : "";
    const firstWord = norm(s.firstName).split(" ").filter(Boolean)[0] ?? "";
    const key = s.lastName === "" && s.firstName !== "" && norm(s.firstName).includes(" ")
      ? "" : `${lastKey}|${firstWord}`;
    // handle single-word firstName with space? fallback: use fileParts on user.name
    let k = key;
    if (!lastKey && !firstWord) {
      const fp = fileParts(s.user.name);
      k = fp.key;
    }
    if (!idx.has(k)) idx.set(k, []);
    idx.get(k)!.push(s);
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile("apps/web/public/attendance_FACULTY-_WIDE_DO_DAY.xlsx");
  const ws = wb.worksheets[0];
  type Row = { name: string; no: string; section: string; status: string; scanned: string; checkIn: string };
  const rows: Row[] = [];
  for (let i = 6; i <= ws.rowCount; i++) {
    const r = ws.getRow(i);
    rows.push({
      name: String(r.getCell("A").value ?? ""),
      no: String(r.getCell("B").value ?? ""),
      section: String(r.getCell("C").value ?? ""),
      status: String(r.getCell("D").value ?? ""),
      scanned: String(r.getCell("E").value ?? ""),
      checkIn: String(r.getCell("F").value ?? ""),
    });
  }
  console.log("file rows:", rows.length);

  // match
  const plan = new Map<string, { dbId: string; email: string; realNo: string; row: Row }>(); // dbId -> ...
  const noInUse = new Map<string, string>(); // realNo -> dbId
  let unique = 0, amb = 0, miss = 0, conflict = 0;
  const missNames: string[] = [];
  for (const row of rows) {
    const fp = fileParts(row.name);
    const hit = idx.get(fp.key) ?? [];
    if (hit.length === 1) {
      const s = hit[0];
      const existing = plan.get(s.id);
      if (existing && existing.realNo !== row.no) { conflict++; continue; }
      if (noInUse.has(row.no) && noInUse.get(row.no) !== s.id) { conflict++; continue; }
      plan.set(s.id, { dbId: s.id, email: s.user.email, realNo: row.no, row });
      noInUse.set(row.no, s.id);
      unique++;
    } else if (hit.length > 1) amb++;
    else { miss++; if (missNames.length < 10) missNames.push(`${row.name} [${row.no}]`); }
  }
  console.log(`match unique=${unique} ambiguous=${amb} miss=${miss} conflict=${conflict}`);
  console.log("miss sample:", missNames);

  // check existing studentNo collisions (should be none since all fake)
  const clash = await p.student.findMany({ where: { studentNo: { in: [...noInUse.keys()] } }, select: { studentNo: true } });
  console.log("existing real-No clashes in DB:", clash.length);

  // apply studentNo updates
  let updated = 0;
  for (const [dbId, v] of plan) {
    await p.student.update({ where: { id: dbId }, data: { studentNo: v.realNo } });
    updated++;
  }
  console.log("updated studentNo:", updated);

  // create event
  const admin = await p.user.findUniqueOrThrow({ where: { email: "liberalistafhusocom@gmail.com" } });
  const existing = await p.event.findFirst({ where: { title: { contains: "FACULTY", mode: "insensitive" } } });
  let event;
  if (existing) {
    console.log("event already exists:", existing.id, existing.title);
    event = existing;
  } else {
    event = await p.event.create({
      data: {
        title: "FACULTY-WIDE DO DAY",
        description: "Faculty-wide Day of... (restored from attendance export AY 2026-2027, Aug 26).",
        startsAt: new Date(2026, 7, 26, 13, 0, 0),
        endsAt: new Date(2026, 7, 26, 17, 0, 0),
        location: "Campus",
        requiresAttendance: true,
        hasTimeInOut: false,
        createdById: admin.id,
      },
    });
    console.log("created event:", event.id);
  }

  // create attendance for matched
  let created = 0, skipped = 0;
  for (const [dbId, v] of plan) {
    const scannedAt = parseScan(v.row.scanned) ?? new Date(2026, 7, 26, 15, 0, 0);
    const checkIn = parseScan(v.row.checkIn) ?? scannedAt;
    try {
      await p.attendance.upsert({
        where: { eventId_studentId: { eventId: event.id, studentId: dbId } },
        create: { eventId: event.id, studentId: dbId, status: AttendanceStatus.PRESENT, scannedById: admin.id, scannedAt, checkedInAt: checkIn },
        update: { status: AttendanceStatus.PRESENT, scannedById: admin.id, scannedAt, checkedInAt: checkIn },
      });
      created++;
    } catch (e: any) { skipped++; }
  }
  console.log(`attendance upserted=${created} failed=${skipped}`);
  console.log("event attendance count:", await p.attendance.count({ where: { eventId: event.id } }));
}
m().catch(e => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
