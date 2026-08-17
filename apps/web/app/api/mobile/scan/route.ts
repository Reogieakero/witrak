import { NextResponse } from "next/server";
import { prisma, recomputeSanctionTriggers } from "@fhusocom/db";
import { invalidateByPrefix } from "@/lib/cache";

function eventStatus(
  startsAt: Date,
  endsAt: Date,
  now: Date,
): "live" | "upcoming" | "past" {
  if (startsAt <= now && now < endsAt) return "live";
  if (startsAt > now) return "upcoming";
  return "past";
}

function studentNoFromQr(qrText: string): string | null {
  const match = qrText.match(/Student No:\s*([A-Za-z0-9-]+)/i);
  return match ? match[1] : null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const eventId = body?.eventId;
    const scanPassword = body?.scanPassword;
    const qrText = body?.qrText;

    if (
      typeof eventId !== "string" ||
      typeof scanPassword !== "string" ||
      typeof qrText !== "string"
    ) {
      return NextResponse.json(
        { error: "Missing eventId, scanPassword, or qrText." },
        { status: 400 },
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        requiresAttendance: true,
        scanPassword: true,
        startsAt: true,
        endsAt: true,
        hasTimeInOut: true,
        lateGraceMinutes: true,
        timeIn: true,
        timeOut: true,
        programId: true,
        program: { select: { name: true } },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }
    if (!event.requiresAttendance) {
      return NextResponse.json(
        { error: "This event does not require attendance." },
        { status: 400 },
      );
    }
    if (!event.scanPassword || event.scanPassword !== scanPassword.trim()) {
      return NextResponse.json(
        { error: "Invalid event code." },
        { status: 403 },
      );
    }
    if (eventStatus(event.startsAt, event.endsAt, new Date()) === "past") {
      return NextResponse.json(
        { error: "This event has already ended." },
        { status: 403 },
      );
    }

    const studentNo = studentNoFromQr(qrText);
    if (!studentNo) {
      return NextResponse.json(
        { error: "Could not read the student number from the QR code." },
        { status: 400 },
      );
    }

    const student = await prisma.student.findFirst({
      where: { studentNo },
      select: {
        id: true,
        studentNo: true,
        firstName: true,
        lastName: true,
        suspended: true,
        sectionId: true,
        section: {
          select: {
            name: true,
            programYear: { select: { programId: true } },
          },
        },
        user: { select: { roles: { select: { id: true } } } },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found or outside your scope." },
        { status: 404 },
      );
    }

    if (event.programId) {
      const studentProgramId =
        student.section?.programYear.programId ?? null;
      if (studentProgramId !== event.programId) {
        return NextResponse.json(
          {
            error: `This event is for ${event.program?.name ?? "a specific faculty"} only. This student is not part of that faculty.`,
          },
          { status: 403 },
        );
      }
    }

    if (student.suspended) {
      return NextResponse.json(
        { error: "Member is suspended and cannot check in." },
        { status: 403 },
      );
    }

    if (student.sectionId === null && (student.user?.roles.length ?? 0) === 0) {
      const removed = await prisma.auditLog.findFirst({
        where: {
          action: "MEMBER_AUTHORIZATION_REMOVED",
          targetId: student.id,
        },
        select: { id: true },
      });
      if (removed) {
        return NextResponse.json(
          { error: "Member authorization has been removed and cannot check in." },
          { status: 403 },
        );
      }
    }

    const now = new Date();
    const mode = body?.mode === "checkout" ? "checkout" : "checkin";

    const studentInfo = {
      name: `${student.firstName} ${student.lastName}`.trim(),
      studentNo: student.studentNo,
      section: student.section?.name ?? null,
    };

    if (mode === "checkout") {
      if (!event.hasTimeInOut) {
        return NextResponse.json(
          { error: "This event does not track check-out times." },
          { status: 400 },
        );
      }
      const existing = await prisma.attendance.findUnique({
        where: {
          eventId_studentId: { eventId, studentId: student.id },
        },
        select: { id: true, checkedOutAt: true },
      });
      if (!existing) {
        return NextResponse.json(
          { error: "This student has not checked in yet." },
          { status: 400 },
        );
      }
      if (existing.checkedOutAt) {
        return NextResponse.json({
          ok: true,
          alreadyScanned: true,
          mode,
          message: "This student has already checked out.",
          student: studentInfo,
        });
      }
      await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkedOutAt: now,
          scannedById: null,
          scannedAt: now,
        },
      });
      await recomputeSanctionTriggers(student.id);
      await invalidateByPrefix("attendance:");
      return NextResponse.json({
        ok: true,
        alreadyScanned: false,
        mode,
        message: "Check out recorded for this student.",
        student: studentInfo,
      });
    }

    const isLate =
      event.hasTimeInOut &&
      now.getTime() >
        (event.timeIn ?? event.startsAt).getTime() +
          (event.lateGraceMinutes ?? 0) * 60000;
    const status = isLate ? "LATE" : "PRESENT";

    const existing = await prisma.attendance.findUnique({
      where: {
        eventId_studentId: { eventId, studentId: student.id },
      },
      select: { id: true, status: true },
    });

    const alreadyCheckedIn =
      existing?.status === "PRESENT" || existing?.status === "LATE";
    if (existing) {
      if (!alreadyCheckedIn) {
        await prisma.attendance.update({
          where: { id: existing.id },
          data: {
            status,
            checkedInAt: now,
            scannedById: null,
            scannedAt: now,
          },
        });
      }
    } else {
      await prisma.attendance.create({
        data: {
          eventId,
          studentId: student.id,
          status,
          checkedInAt: now,
          scannedById: null,
          scannedAt: now,
        },
      });
    }

    await recomputeSanctionTriggers(student.id);
    await invalidateByPrefix("attendance:");

    return NextResponse.json({
      ok: true,
      alreadyScanned: alreadyCheckedIn,
      mode,
      status,
      message: alreadyCheckedIn
        ? "This student is already checked in."
        : isLate
          ? "Attendance recorded (late)."
          : existing
            ? "Attendance recorded for this student."
            : "Attendance recorded.",
      student: studentInfo,
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
  }
}
