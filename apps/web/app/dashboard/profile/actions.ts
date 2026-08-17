"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import ExcelJS from "exceljs";
import { prisma } from "@fhusocom/db";
import { auth } from "@/auth";
import { uploadStudentImage } from "@/lib/supabase-storage";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type StudentProfile = {
  id: string;
  studentNo: string;
  firstName: string;
  lastName: string;
  suffix: string | null;
  email: string;
  imageUrl: string | null;
  sectionLabel: string;
  programId: string | null;
  yearLevelId: string | null;
  sectionId: string | null;
};

export type ProfileActionResult = { ok: boolean; error?: string };

export type PlacementOption = { value: string; label: string };
export type YearPlacementOption = { value: string; label: string; programId: string };
export type SectionPlacementOption = { value: string; label: string; programYearId: string };
export type StudentPlacementOptions = {
  programs: PlacementOption[];
  years: YearPlacementOption[];
  sections: SectionPlacementOption[];
};

async function getCurrentStudent() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.student.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      userId: true,
      suspended: true,
      studentNo: true,
      firstName: true,
      lastName: true,
      suffix: true,
      imageUrl: true,
      imagePath: true,
      sectionId: true,
      section: {
        select: {
          id: true,
          name: true,
          programYear: {
            select: {
              id: true,
              level: true,
              program: { select: { id: true, code: true } },
            },
          },
        },
      },
    },
  });
}

export async function getStudentProfile(): Promise<StudentProfile | null> {
  const student = await getCurrentStudent();
  if (!student) return null;

  const sectionLabel = student.section
    ? `${student.section.programYear.program.code} ${student.section.programYear.level}-${student.section.name}`
    : "Unassigned";

  const user = await prisma.user.findUnique({
    where: { id: student.userId },
    select: { email: true },
  });

  return {
    id: student.id,
    studentNo: student.studentNo,
    firstName: student.firstName,
    lastName: student.lastName,
    suffix: student.suffix,
    email: user?.email ?? "",
    imageUrl: student.imageUrl,
    sectionLabel,
    programId: student.section?.programYear.program.id ?? null,
    yearLevelId: student.section?.programYear.id ?? null,
    sectionId: student.section?.id ?? null,
  };
}

export async function getStudentPlacementOptions(): Promise<StudentPlacementOptions> {
  const [programs, yearLevels, sections] = await Promise.all([
    prisma.program.findMany({
      orderBy: { code: "asc" },
      select: { id: true, code: true },
    }),
    prisma.yearLevel.findMany({
      orderBy: [{ program: { code: "asc" } }, { level: "asc" }],
      include: { program: { select: { code: true } } },
    }),
    prisma.section.findMany({
      orderBy: [
        { programYear: { program: { code: "asc" } } },
        { programYear: { level: "asc" } },
        { name: "asc" },
      ],
      include: {
        programYear: { include: { program: { select: { code: true } } } },
      },
    }),
  ]);

  return {
    programs: programs.map((p) => ({ value: p.id, label: p.code })),
    years: yearLevels.map((y) => ({
      value: y.id,
      label: `Year ${y.level}`,
      programId: y.programId,
    })),
    sections: sections.map((s) => ({
      value: s.id,
      label: s.name,
      programYearId: s.programYearId,
    })),
  };
}

export async function getStudentAvatar(): Promise<{ imageUrl: string | null }> {
  const student = await getCurrentStudent();
  return { imageUrl: student?.imageUrl ?? null };
}

export async function updateStudentProfile(input: {
  firstName: string;
  lastName: string;
  suffix: string;
  studentNo: string;
  programId: string | null;
  yearLevelId: string | null;
  sectionId: string | null;
}): Promise<ProfileActionResult> {
  const student = await getCurrentStudent();
  if (!student) return { ok: false, error: "Student record not found." };
  if (student.suspended) return { ok: false, error: "Account suspended." };

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const suffix = input.suffix.trim();
  const studentNo = input.studentNo.trim();
  const programId = input.programId?.trim() || null;
  const yearLevelId = input.yearLevelId?.trim() || null;
  const sectionId = input.sectionId?.trim() || null;

  if (!firstName || !lastName) {
    return { ok: false, error: "First and last name are required." };
  }
  if (!studentNo) {
    return { ok: false, error: "Student number is required." };
  }
  if (!/^20\d{2}-\d{4}$/.test(studentNo)) {
    return { ok: false, error: "Student number must follow the format 20XX-XXXX (e.g. 2025-0001)." };
  }

  if (sectionId) {
    if (!programId || !yearLevelId) {
      return { ok: false, error: "Please select your program and year level." };
    }
    const yearLevel = await prisma.yearLevel.findUnique({
      where: { id: yearLevelId },
      select: { programId: true },
    });
    if (!yearLevel || yearLevel.programId !== programId) {
      return { ok: false, error: "The selected year level does not match your program." };
    }
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      select: { programYearId: true },
    });
    if (!section || section.programYearId !== yearLevelId) {
      return { ok: false, error: "The selected section does not match your year level." };
    }
  }

  const duplicate = await prisma.student.findFirst({
    where: { studentNo, id: { not: student.id } },
    select: { id: true },
  });
  if (duplicate) {
    return { ok: false, error: "That student number is already in use by another student." };
  }

  try {
    await prisma.$transaction([
      prisma.student.update({
        where: { id: student.id },
        data: {
          firstName,
          lastName,
          suffix: suffix || null,
          studentNo,
          sectionId: sectionId || null,
        },
      }),
      prisma.user.update({
        where: { id: student.userId },
        data: {
          name: `${firstName} ${lastName}${suffix ? `, ${suffix}` : ""}`.trim(),
        },
      }),
    ]);
  } catch (e) {
    if (e instanceof Error && e.message.includes("studentNo")) {
      return { ok: false, error: "That student number is already in use by another student." };
    }
    throw e;
  }

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function uploadStudentAvatar(
  formData: FormData,
): Promise<ProfileActionResult & { imageUrl?: string }> {
  const student = await getCurrentStudent();
  if (!student) return { ok: false, error: "Student record not found." };
  if (student.suspended) return { ok: false, error: "Account suspended." };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { ok: false, error: "Please choose an image." };
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: "Image must be under 5 MB." };
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return { ok: false, error: "Only JPG, PNG, or WebP images are allowed." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const storedName = `${student.id}-${randomUUID()}.${ext}`;
  const buffer = await file.arrayBuffer();

  let publicUrl: string;
  try {
    const res = await uploadStudentImage(storedName, buffer, file.type);
    publicUrl = res.publicUrl;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Upload failed." };
  }

  await prisma.student.update({
    where: { id: student.id },
    data: { imageUrl: publicUrl, imagePath: storedName },
  });

  revalidatePath("/dashboard");
  return { ok: true, imageUrl: publicUrl };
}

export type ExportDataResult =
  | { ok: true; file: { name: string; content: string } }
  | { ok: false; error: string };

function fmtDate(d: Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().replace("T", " ").slice(0, 19);
}

type SheetRow = (string | number | null)[];
type SheetDef = { title: string; headers: string[]; rows: SheetRow[] };

function addSheet(wb: ExcelJS.Workbook, def: SheetDef): ExcelJS.Worksheet {
  const ws = wb.addWorksheet(def.title);
  const widths = def.headers.map((h, i) => {
    let max = h.length;
    for (const r of def.rows) {
      const len = (r[i] ?? "").toString().length;
      if (len > max) max = len;
    }
    return Math.min(Math.max(max + 2, 12), 60);
  });
  ws.columns = def.headers.map((h, i) => ({ header: h, width: widths[i] }));

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2563EB" },
  };
  headerRow.alignment = { vertical: "middle" };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(def.rows.length + 1, 1), column: def.headers.length },
  };

  for (const r of def.rows) {
    ws.addRow(r.map((v) => (v == null ? "" : v)));
  }
  return ws;
}

/**
 * Generates a single Excel workbook containing every record tied to the
 * current student's account, from registration to today: Profile, Attendance,
 * Sanctions, and Fees. Used for the "download a copy of my data" step before
 * account deactivation.
 */
export async function exportStudentData(): Promise<ExportDataResult> {
  const student = await getCurrentStudent();
  if (!student) return { ok: false, error: "Student record not found." };

  const [user, attendances, sanctions, feeProofs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: student.userId },
      select: { email: true },
    }),
    prisma.attendance.findMany({
      where: { studentId: student.id },
      orderBy: { scannedAt: "asc" },
      include: {
        event: { select: { title: true, startsAt: true, endsAt: true } },
        scannedBy: { select: { name: true } },
      },
    }),
    prisma.sanction.findMany({
      where: { studentId: student.id },
      orderBy: { issuedAt: "asc" },
      include: {
        issuedBy: { select: { name: true } },
        resolvedBy: { select: { name: true } },
        fine: { select: { title: true, absenceCount: true } },
      },
    }),
    prisma.feeProof.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "asc" },
      include: {
        fee: { select: { title: true, amount: true } },
        verifiedBy: { select: { name: true } },
      },
    }),
  ]);

  const sectionLabel = student.section
    ? `${student.section.programYear.program.code} ${student.section.programYear.level}-${student.section.name}`
    : "Unassigned";

  const wb = new ExcelJS.Workbook();
  wb.creator = "FHUSOCOM";
  wb.created = new Date();

  addSheet(wb, {
    title: "Profile",
    headers: ["Field", "Value"],
    rows: [
      ["Student number", student.studentNo],
      ["First name", student.firstName],
      ["Last name", student.lastName],
      ["Suffix", student.suffix ?? ""],
      ["Email", user?.email ?? ""],
      ["Section", sectionLabel],
      ["Profile photo", student.imageUrl ?? ""],
    ],
  });

  addSheet(wb, {
    title: "Attendance",
    headers: ["Event", "Started at", "Status", "Checked in", "Checked out", "Scanned at", "Scanned by"],
    rows: attendances.map((a) => [
      a.event.title,
      fmtDate(a.event.startsAt),
      a.status,
      fmtDate(a.checkedInAt),
      fmtDate(a.checkedOutAt),
      fmtDate(a.scannedAt),
      a.scannedBy?.name ?? "",
    ]),
  });

  addSheet(wb, {
    title: "Sanctions",
    headers: ["Title", "Reason", "Status", "Fine", "Issued at", "Issued by", "Resolved at", "Resolved by", "Resolution note"],
    rows: sanctions.map((s) => [
      s.title,
      s.reason,
      s.status,
      s.fine ? `${s.fine.title} (${s.fine.absenceCount} absences)` : "",
      fmtDate(s.issuedAt),
      s.issuedBy?.name ?? "",
      fmtDate(s.resolvedAt),
      s.resolvedBy?.name ?? "",
      s.resolvedNote ?? "",
    ]),
  });

  addSheet(wb, {
    title: "Fees",
    headers: ["Fee", "Amount", "Method", "Reference", "Status", "Rejection reason", "Submitted at", "Verified at", "Verified by"],
    rows: feeProofs.map((f) => [
      f.fee.title,
      f.fee.amount.toString(),
      f.method ?? "",
      f.reference ?? "",
      f.status,
      f.rejectionReason ?? "",
      fmtDate(f.createdAt),
      fmtDate(f.verifiedAt),
      f.verifiedBy?.name ?? "",
    ]),
  });

  const buffer = await wb.xlsx.writeBuffer();
  const base = student.studentNo.replace(/\W+/g, "_");
  return {
    ok: true,
    file: {
      name: `${base}-data.xlsx`,
      content: Buffer.from(buffer).toString("base64"),
    },
  };
}

/**
 * Deactivates the current student's account: blocks the DB user (soft delete)
 * so they can no longer authenticate, and removes the Supabase auth user.
 * Historical records (attendance, sanctions, fees) are kept for admin audit.
 */
export async function deactivateAccount(): Promise<ProfileActionResult> {
  const student = await getCurrentStudent();
  if (!student) return { ok: false, error: "Student record not found." };
  if (student.suspended) return { ok: false, error: "Account suspended." };

  const user = await prisma.user.findUnique({
    where: { id: student.userId },
    select: { id: true, supabaseId: true },
  });
  if (!user) return { ok: false, error: "User record not found." };

  await prisma.user.update({
    where: { id: user.id },
    data: { deletedAt: new Date() },
  });

  if (user.supabaseId) {
    try {
      await getSupabaseAdmin().auth.admin.deleteUser(user.supabaseId);
    } catch {
      // Non-fatal: the soft delete above already prevents sign-in.
    }
  }

  revalidatePath("/dashboard");
  return { ok: true };
}