"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  AttendanceAccess,
  AttendanceEventItem,
  AttendanceRecord,
  AttendanceStats,
  AttendanceStudentItem,
} from "./types";
import { AttendanceHeader } from "./attendance-header";
import { AttendanceStats as StatsGrid } from "./attendance-stats";
import { AttendanceList } from "./attendance-list";
import { AttendanceEventDrawer } from "./attendance-event-drawer";
import { AttendanceStudentDrawer } from "./attendance-student-drawer";
import styles from "./attendance-view.module.css";

type ApiRecord = {
  id: string;
  status: AttendanceRecord["status"];
  scannedAt: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  eventId: string;
  studentId: string;
  student: {
    firstName: string;
    lastName: string;
    studentNo: string;
    section: { name: string } | null;
  };
  event: { title: string; startsAt: string };
};

export type AttendanceViewProps = {
  events: AttendanceEventItem[];
  students: AttendanceStudentItem[];
  stats: AttendanceStats;
  access: AttendanceAccess;
};

function formatScheduleDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
}

export function AttendanceView({
  events,
  students,
  stats,
  access,
}: AttendanceViewProps) {
  const [selectedEvent, setSelectedEvent] =
    useState<AttendanceEventItem | null>(null);
  const [selectedStudent, setSelectedStudent] =
    useState<AttendanceStudentItem | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();

  const openStudentId = selectedStudent?.id ?? null;
  const openEventId = selectedEvent?.id ?? null;
  const openId = openStudentId ?? openEventId;

  useEffect(() => {
    if (!openId) return;
    let cancelled = false;
    async function loadRecords() {
      try {
        const qs = openStudentId
          ? `studentId=${encodeURIComponent(openId ?? "")}`
          : `eventId=${encodeURIComponent(openId ?? "")}`;
        const res = await fetch(`/api/attendance?${qs}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load attendance records.");
        const data: { records: ApiRecord[] } = await res.json();
        if (cancelled) return;
        setRecords(
          data.records.map((r) => ({
            id: r.id,
            eventId: r.eventId,
            studentId: r.studentId,
            status: r.status,
            scannedAt: r.scannedAt,
            eventTitle: r.event.title,
            scheduleDate: formatScheduleDate(r.event.startsAt),
            studentName: `${r.student.firstName} ${r.student.lastName}`.trim(),
            sectionName: r.student.section?.name ?? "—",
            checkedInAt: r.checkedInAt,
            checkedOutAt: r.checkedOutAt,
          })),
        );
      } catch {
        if (!cancelled) setRecords([]);
      }
    }
    void loadRecords();
    return () => {
      cancelled = true;
    };
  }, [openStudentId, openEventId, openId, refreshKey]);

  const handleAttendanceChanged = () => {
    setRefreshKey((k) => k + 1);
    router.refresh();
  };

  if (!access.view) return null;

  return (
    <div className={styles.page}>
      <AttendanceHeader termName={stats.termName} canScan={false} />

      <StatsGrid stats={stats} />

      <AttendanceList
        events={events}
        students={students}
        canScan={false}
        onScan={() => {}}
        onEventView={(e) => setSelectedEvent(e)}
        onStudentView={(s) => setSelectedStudent(s)}
      />

      {selectedEvent && (
        <AttendanceEventDrawer
          event={selectedEvent}
          students={students.map((s) => ({
            id: s.id,
            name: s.name,
            sectionName: s.sectionName,
          }))}
          records={records.filter((r) => r.eventId === selectedEvent.id)}
          canScan={false}
          canEdit={access.edit}
          onScan={() => {}}
          onClose={() => setSelectedEvent(null)}
          onChanged={handleAttendanceChanged}
        />
      )}

      {selectedStudent && (
        <AttendanceStudentDrawer
          student={selectedStudent}
          records={records.filter((r) => r.studentId === selectedStudent.id)}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}