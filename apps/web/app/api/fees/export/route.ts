import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { requirePermission } from "@/lib/permissions";
import { handleError } from "@/lib/api";
import { getTermContext, termRange } from "@/lib/terms";
import type { BalanceStatus } from "@/app/components/fees/types";

const STATUS_LABEL: Record<BalanceStatus, string> = {
  PAID: "Paid",
  PENDING: "Pending",
  REJECTED: "Rejected",
  UNPAID: "Unpaid",
};

const HEADER_FILL = "FF1D4ED8";
const HEADER_FONT = { bold: true, color: { argb: "FFFFFFFF" } };
const ALT_FILL = "FFF3F6FC";

function sanitizeSheetName(name: string): string {
  const cleaned = name.replace(/[\\/?*[\]:]/g, " ").replace(/\s+/g, " ").trim();
  return (cleaned || "Fee").slice(0, 31);
}

function uniqueSheetName(base: string, used: Set<string>): string {
  const clean = sanitizeSheetName(base);
  let candidate = clean;
  let i = 2;
  while (used.has(candidate)) {
    const suffix = ` ${i}`;
    candidate = `${clean.slice(0, 31 - suffix.length)}${suffix}`;
    i += 1;
  }
  used.add(candidate);
  return candidate;
}

function slugify(name: string): string {
  return (
    (name || "current-term")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "current-term"
  );
}

export async function GET() {
  try {
    const session = await auth();
    requirePermission(session?.access, "fees_view");

    const { term } = await getTermContext();
    const range = termRange(term);
    const termName = term?.name ?? "Current Term";

    const [fees, proofs, students] = await Promise.all([
      prisma.fee.findMany({
        where: range ? { createdAt: range } : undefined,
        orderBy: { dueDate: "desc" },
      }),
      prisma.feeProof.findMany({
        where: range ? { createdAt: range } : undefined,
        orderBy: { createdAt: "desc" },
        include: { fee: true },
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
    ]);

    const latestByStudentFee = new Map<string, (typeof proofs)[number]>();
    for (const p of proofs) {
      const key = `${p.studentId}:${p.feeId}`;
      if (!latestByStudentFee.has(key)) latestByStudentFee.set(key, p);
    }

    const sectionLabel = (section: {
      name: string | null;
      programYear: { level: number; program: { code: string } } | null;
    } | null): string =>
      section?.programYear
        ? `${section.programYear.program.code}-${section.name}`
        : "—";

    const statusOf = (studentId: string, feeId: string): BalanceStatus =>
      latestByStudentFee.get(`${studentId}:${feeId}`)?.status ?? "UNPAID";

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "FhuSoCom";
    workbook.created = new Date();

    const summary = workbook.addWorksheet("Summary");
    summary.columns = [
      { key: "fee", width: 28 },
      { key: "amount", width: 14 },
      { key: "students", width: 10 },
      { key: "paid", width: 10 },
      { key: "pending", width: 10 },
      { key: "rejected", width: 10 },
      { key: "unpaid", width: 10 },
      { key: "collected", width: 14 },
      { key: "pct", width: 14 },
    ];

    summary.getRow(1).values = [`Fee Collection Summary — ${termName}`];
    summary.getRow(1).font = { bold: true, size: 14 };

    const summaryHeader = summary.addRow([
      "Fee",
      "Amount",
      "Students",
      "Paid",
      "Pending",
      "Rejected",
      "Unpaid",
      "Collected",
      "Collection %",
    ]);
    summaryHeader.eachCell((cell) => {
      cell.font = HEADER_FONT;
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: HEADER_FILL },
      };
      cell.alignment = { vertical: "middle" };
    });

    const usedSheetNames = new Set<string>(["Summary"]);
    const money = new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 0,
    });

    let grandStudents = 0;
    let grandPaid = 0;
    let grandPending = 0;
    let grandRejected = 0;
    let grandUnpaid = 0;
    let grandCollected = 0;
    let grandTarget = 0;

    for (const fee of fees) {
      const amount = Number(fee.amount);
      const studentsCount = students.length;
      const counts = { PAID: 0, PENDING: 0, REJECTED: 0, UNPAID: 0 } as Record<
        BalanceStatus,
        number
      >;
      let collected = 0;

      for (const student of students) {
        const status = statusOf(student.id, fee.id);
        counts[status] += 1;
        if (status === "PAID") collected += amount;
      }

      const pct =
        studentsCount > 0 ? Math.round((counts.PAID / studentsCount) * 100) : 0;

      summary.addRow({
        fee: fee.title,
        amount: amount,
        students: studentsCount,
        paid: counts.PAID,
        pending: counts.PENDING,
        rejected: counts.REJECTED,
        unpaid: counts.UNPAID,
        collected: collected,
        pct: `${pct}%`,
      });

      grandStudents += studentsCount;
      grandPaid += counts.PAID;
      grandPending += counts.PENDING;
      grandRejected += counts.REJECTED;
      grandUnpaid += counts.UNPAID;
      grandCollected += collected;
      grandTarget += amount * studentsCount;

      const ws = workbook.addWorksheet(uniqueSheetName(fee.title, usedSheetNames));
      ws.columns = [
        { key: "no", width: 14 },
        { key: "name", width: 32 },
        { key: "section", width: 16 },
        { key: "year", width: 11 },
        { key: "program", width: 12 },
        { key: "status", width: 12 },
        { key: "due", width: 14 },
      ];

      const feeHeader = ws.addRow([
        fee.title,
        money.format(amount),
        `Due ${fee.dueDate.toLocaleDateString("en-PH")}`,
      ]);
      feeHeader.font = { bold: true, size: 12 };
      ws.mergeCells(`A${feeHeader.number}:G${feeHeader.number}`);

      const headerRow = ws.addRow([
        "Student No",
        "Student Name",
        "Section",
        "Year Level",
        "Program",
        "Status",
        "Amount Due",
      ]);
      headerRow.eachCell((cell) => {
        cell.font = HEADER_FONT;
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: HEADER_FILL },
        };
        cell.alignment = { vertical: "middle" };
      });

      for (const [i, student] of students.entries()) {
        const status = statusOf(student.id, fee.id);
        const row = ws.addRow({
          no: student.studentNo,
          name: `${student.firstName} ${student.lastName}`.trim(),
          section: sectionLabel(student.section),
          year: student.section?.programYear.level ?? 0,
          program: student.section?.programYear.program.code ?? "—",
          status: STATUS_LABEL[status],
          due: status === "PAID" ? 0 : amount,
        });
        if (i % 2 === 1) {
          row.eachCell((cell) => {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ALT_FILL } };
          });
        }
      }

      const totalsRow = ws.addRow([
        "TOTAL",
        "",
        "",
        "",
        "",
        `${counts.PAID} paid`,
        money.format(collected),
      ]);
      totalsRow.font = { bold: true };

      ws.views = [{ state: "frozen", ySplit: headerRow.number }];
      ws.autoFilter = {
        from: { row: headerRow.number, column: 1 },
        to: { row: Math.max(headerRow.number + 1, ws.rowCount - 1), column: 7 },
      };
    }

    const totalPct = grandTarget > 0 ? Math.round((grandCollected / grandTarget) * 100) : 0;
    summary.addRow({
      fee: "TOTAL",
      amount: "",
      students: grandStudents,
      paid: grandPaid,
      pending: grandPending,
      rejected: grandRejected,
      unpaid: grandUnpaid,
      collected: grandCollected,
      pct: `${totalPct}%`,
    }).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    const body = new Uint8Array(buffer);

    const filename = `fhusocom-fees-${slugify(termName)}.xlsx`;
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    return handleError(e);
  }
}