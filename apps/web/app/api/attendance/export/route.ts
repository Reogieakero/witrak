import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { requirePermission, studentInScope, type UserAccess } from "@/lib/permissions";
import { getTermContext, termRange, eventInTerm } from "@/lib/terms";
import { handleError } from "@/lib/api";

function formatPh(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  });
}

function formatDatePh(d: Date): string {
  return d.toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  });
}

async function loadRows(eventId: string, access: UserAccess, range: { gte: Date; lte: Date } | null) {
  const att = await prisma.attendance.findMany({
    where: {
      eventId,
      student: studentInScope(access),
      ...(range ? { scannedAt: range } : {}),
    },
    orderBy: { scannedAt: "desc" },
    select: {
      status: true,
      scannedAt: true,
      checkedInAt: true,
      checkedOutAt: true,
      student: {
        select: {
          studentNo: true,
          firstName: true,
          lastName: true,
          section: { select: { name: true } },
        },
      },
    },
  });
  return att.map((r) => ({
    studentName: `${r.student.firstName} ${r.student.lastName}`.trim(),
    studentNo: r.student.studentNo,
    section: r.student.section?.name ?? null,
    status: r.status,
    scannedAt: r.scannedAt ? r.scannedAt.toISOString() : null,
    checkedInAt: r.checkedInAt ? r.checkedInAt.toISOString() : null,
    checkedOutAt: r.checkedOutAt ? r.checkedOutAt.toISOString() : null,
  }));
}

async function computeSummary(
  eventId: string,
  access: UserAccess,
  range: { gte: Date; lte: Date } | null,
  registeredTotal: number | null,
): Promise<{ present: number; late: number; absent: number; total: number; rate: number }> {
  const rows = await loadRows(eventId, access, range);
  let present = 0;
  let late = 0;
  let absent = 0;
  for (const r of rows) {
    if (r.status === "PRESENT") present += 1;
    else if (r.status === "LATE") late += 1;
    else absent += 1;
  }
  const total = registeredTotal ?? rows.length;
  const rate = total ? Math.round(((present + late) / total) * 100) : 0;
  return { present, late, absent, total, rate };
}

function statusLabel(s: string): string {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

function safeName(name: string): string {
  return name.replace(/[^\w\-]+/g, "_");
}

async function buildXlsx(events: { id: string; title: string }[], access: UserAccess, range: { gte: Date; lte: Date } | null, termName: string) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "FHUSOCOM";
  wb.created = new Date();
  for (const ev of events) {
    const rows = await loadRows(ev.id, access, range);
    const summary = await computeSummary(ev.id, access, range, null);
    const ws = wb.addWorksheet(ev.title.slice(0, 31));
    ws.columns = [
      { header: "Student", key: "student", width: 28 },
      { header: "Student No.", key: "studentNo", width: 14 },
      { header: "Section", key: "section", width: 16 },
      { header: "Status", key: "status", width: 12 },
      { header: "Scanned At", key: "scannedAt", width: 22 },
      { header: "Check In", key: "checkedInAt", width: 22 },
      { header: "Check Out", key: "checkedOutAt", width: 22 },
    ];
    ws.getRow(1).values = [`Attendance Report — ${ev.title}`, "", "", "", "", "", ""] as ExcelJS.CellValue[];
    ws.getRow(2).values = [termName, "", "", "", "", "", ""] as ExcelJS.CellValue[];
    ws.getRow(3).values = [
      `Present: ${summary.present}`,
      `Late: ${summary.late}`,
      `Absent: ${summary.absent}`,
      `Rate: ${summary.rate}%`,
      "",
      "",
      "",
    ] as ExcelJS.CellValue[];
    ws.getRow(4).values = ["", "", "", "", "", "", ""] as ExcelJS.CellValue[];
    const headerRow = ws.getRow(5);
    headerRow.values = ws.columns.map((c) => (c as ExcelJS.Column).header ?? "") as ExcelJS.CellValue[];
    headerRow.font = { bold: true };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    rows.forEach((r) => {
      const row = ws.addRow({
        student: r.studentName,
        studentNo: r.studentNo,
        section: r.section ?? "—",
        status: statusLabel(r.status),
        scannedAt: formatPh(r.scannedAt),
        checkedInAt: formatPh(r.checkedInAt),
        checkedOutAt: formatPh(r.checkedOutAt),
      });
      const tone =
        r.status === "PRESENT"
          ? "FFDCEDC8"
          : r.status === "LATE"
            ? "FFFEF3C7"
            : "FFFEE2E2";
      row.getCell(4).fill = { type: "pattern", pattern: "solid", fgColor: { argb: tone } };
    });
  }
  const buf = await wb.xlsx.writeBuffer();
  return new Uint8Array(buf as ArrayBuffer);
}

type PdfEvent = { id: string; title: string; location: string | null; startsAt: Date };

const PDF_BLUE = rgb(0.145, 0.388, 0.922);
const PDF_GREEN = rgb(0.086, 0.639, 0.29);
const PDF_AMBER = rgb(0.851, 0.465, 0.024);
const PDF_RED = rgb(0.863, 0.149, 0.149);
const PDF_MUTED = rgb(0.392, 0.455, 0.525);
const PDF_LIGHT = rgb(0.973, 0.98, 0.988);
const PDF_BLACK = rgb(0, 0, 0);

async function buildPdf(
  events: PdfEvent[],
  access: UserAccess,
  range: { gte: Date; lte: Date } | null,
  termName: string,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageW = 595.28;
  const margin = 40;
  const contentW = pageW - margin * 2;
  let page = pdfDoc.addPage([595.28, 841.89]);
  let y = 841.89 - margin;

  const ensureSpace = (needed: number) => {
    if (y - needed < margin) {
      page = pdfDoc.addPage([595.28, 841.89]);
      y = 841.89 - margin;
    }
  };

  page.drawText("FHUSOCOM — Attendance Report", {
    x: margin,
    y: y - 18,
    size: 18,
    font: bold,
    color: PDF_BLACK,
  });
  y -= 18;
  page.drawText(
    `${termName}  |  Generated ${new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" })}`,
    { x: margin, y: y - 12, size: 9, font, color: PDF_MUTED },
  );
  y -= 28;

  const colX = [margin, margin + 200, margin + 270, margin + 360, margin + 430];
  const colW = [196, 66, 86, 66, 116];

  for (const ev of events) {
    ensureSpace(70);
    const rows = await loadRows(ev.id, access, range);
    const summary = await computeSummary(ev.id, access, range, null);

    page.drawText(ev.title, { x: margin, y: y - 14, size: 13, font: bold, color: PDF_BLACK });
    y -= 16;
    const meta = `${formatDatePh(ev.startsAt)}${ev.location ? "  |  " + ev.location : ""}`;
    page.drawText(meta, { x: margin, y: y - 11, size: 9, font, color: PDF_MUTED });
    y -= 13;
    page.drawText(
      `Present: ${summary.present}   Late: ${summary.late}   Absent: ${summary.absent}   Rate: ${summary.rate}%`,
      { x: margin, y: y - 11, size: 9, font, color: PDF_BLACK },
    );
    y -= 18;

    const headers = ["Student", "No.", "Section", "Status", "Scanned At"];
    page.drawRectangle({
      x: margin,
      y: y - 16,
      width: contentW,
      height: 16,
      color: PDF_BLUE,
    });
    headers.forEach((h, i) => {
      page.drawText(h, { x: colX[i] + 4, y: y - 12, size: 8.5, font: bold, color: rgb(1, 1, 1) });
    });
    y -= 16;

    if (rows.length === 0) {
      page.drawText("No records.", { x: colX[0] + 4, y: y - 11, size: 8.5, font, color: PDF_BLACK });
      y -= 16;
    }
    rows.forEach((r, idx) => {
      ensureSpace(15);
      if (idx % 2 === 1) {
        page.drawRectangle({
          x: margin,
          y: y - 13,
          width: contentW,
          height: 15,
          color: PDF_LIGHT,
        });
      }
      const tone =
        r.status === "PRESENT"
          ? PDF_GREEN
          : r.status === "LATE"
            ? PDF_AMBER
            : PDF_RED;
      page.drawText(r.studentName, { x: colX[0] + 4, y: y - 11, size: 8.5, font, color: PDF_BLACK, maxWidth: colW[0] });
      page.drawText(r.studentNo, { x: colX[1] + 4, y: y - 11, size: 8.5, font, color: PDF_BLACK, maxWidth: colW[1] });
      page.drawText(r.section ?? "—", { x: colX[2] + 4, y: y - 11, size: 8.5, font, color: PDF_BLACK, maxWidth: colW[2] });
      page.drawText(statusLabel(r.status), { x: colX[3] + 4, y: y - 11, size: 8.5, font, color: tone });
      page.drawText(formatPh(r.scannedAt), { x: colX[4] + 4, y: y - 11, size: 8.5, font, color: PDF_BLACK, maxWidth: colW[4] });
      y -= 15;
    });
    y -= 14;
  }

  return pdfDoc.save();
}

export async function GET(request?: Request) {
  try {
    const session = await auth();
    const access = session?.access;
    requirePermission(access, "attendance_view");

    const url = request ? new URL(request.url) : null;
    const format = (url?.searchParams.get("format") ?? "xlsx").toLowerCase();
    const eventId = url?.searchParams.get("eventId") ?? null;
    const all = url?.searchParams.get("all") === "1";

    if (format !== "xlsx" && format !== "pdf") {
      return NextResponse.json({ error: "Unsupported format." }, { status: 400 });
    }

    const { term } = await getTermContext();
    const range = termRange(term);
    const termName = term?.name ?? "Current Term";

    let targetEvents: { id: string; title: string; location: string | null; startsAt: Date }[];
    if (eventId) {
      const ev = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, title: true, location: true, startsAt: true },
      });
      if (!ev) return NextResponse.json({ error: "Event not found." }, { status: 404 });
      targetEvents = [ev];
    } else if (all) {
      targetEvents = await prisma.event.findMany({
        where: eventInTerm(term),
        orderBy: { startsAt: "desc" },
        select: { id: true, title: true, location: true, startsAt: true },
      });
    } else {
      return NextResponse.json(
        { error: "Provide eventId or all=1." },
        { status: 400 },
      );
    }

    if (format === "xlsx") {
      const buf = await buildXlsx(
        targetEvents.map((e) => ({ id: e.id, title: e.title })),
        access!,
        range,
        termName,
      );
      const fname = all
        ? `attendance_all_events_${safeName(termName)}.xlsx`
        : `attendance_${safeName(targetEvents[0].title)}.xlsx`;
      return new NextResponse(buf as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${fname}"`,
        },
      });
    }

    // PDF
    const buf = await buildPdf(targetEvents, access!, range, termName);

    const fname = all
      ? `attendance_all_events_${safeName(termName)}.pdf`
      : `attendance_${safeName(targetEvents[0].title)}.pdf`;
    return new NextResponse(buf as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fname}"`,
      },
    });
  } catch (e) {
    return handleError(e);
  }
}
