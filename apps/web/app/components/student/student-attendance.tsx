"use client";

import { useState } from "react";
import { UserCheck } from "lucide-react";
import type { StudentAttendanceItem } from "./types";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Modal } from "@/app/components/ui/modal";
import base from "./student-feed.module.css";
import styles from "./student-attendance.module.css";

function eventStatusTone(
  status: StudentAttendanceItem["eventStatus"],
): "red" | "brand" | "gray" {
  if (status === "live") return "red";
  if (status === "upcoming") return "brand";
  return "gray";
}

function eventStatusLabel(status: StudentAttendanceItem["eventStatus"]): string {
  if (status === "live") return "Live now";
  if (status === "upcoming") return "Upcoming";
  return "Completed";
}

function attendanceStatusTone(
  status: StudentAttendanceItem["attendanceStatus"],
): "green" | "amber" | "red" | "gray" {
  if (status === "PRESENT" || status === "EXCUSED") return "green";
  if (status === "LATE") return "amber";
  if (status === "ABSENT") return "red";
  if (status === "NOT_SCANNED" || status === "CHECKED_OUT_ONLY") return "red";
  return "gray";
}

function attendanceStatusLabel(
  status: StudentAttendanceItem["attendanceStatus"],
): string {
  switch (status) {
    case "PRESENT":
      return "Present";
    case "LATE":
      return "Late";
    case "EXCUSED":
      return "Excused";
    case "ABSENT":
      return "Absent";
    case "NOT_SCANNED":
      return "Not scanned";
    case "NOT_YET":
      return "Not yet";
    case "CHECKED_OUT_ONLY":
      return "Checked out only";
    default:
      return "Not recorded";
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

type StudentAttendanceProps = {
  attendance: StudentAttendanceItem[];
};

export function StudentAttendance({ attendance }: StudentAttendanceProps) {
  const [open, setOpen] = useState(false);

  return (
    <section id="attendance" className={base.card}>
      <header className={base.header}>
        <div className={base.heading}>
          <span className={base.headingIcon}>
            <UserCheck size={16} />
          </span>
          <div>
            <h3 className={base.title}>My Attendance</h3>
            <p className={base.subtitle}>Event status and your attendance record</p>
          </div>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
          View all
        </Button>
      </header>

      {attendance.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>
            <UserCheck size={20} />
          </span>
          <span className={styles.emptyTitle}>No attendance recorded yet.</span>
          <span className={styles.emptySub}>
            Events you attend this term will show up here.
          </span>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <AttendanceTable attendance={attendance} />
        </div>
      )}

      {open && (
        <Modal
          open
          onClose={() => setOpen(false)}
          title={
            <span className={styles.modalTitle}>
              <span className={styles.modalTitleIcon}>
                <UserCheck size={16} />
              </span>
              <span>
                <span className={styles.modalTitleLine}>My Attendance</span>
                <span className={styles.modalSubtitle}>
                  Event status and your attendance record
                </span>
              </span>
            </span>
          }
          footer={
            <div className={styles.modalFooter}>
              <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          }
        >
          {attendance.length === 0 ? (
            <p className={base.empty}>No attendance recorded yet.</p>
          ) : (
            <div className={styles.tableWrap}>
              <AttendanceTable attendance={attendance} />
            </div>
          )}
        </Modal>
      )}
    </section>
  );
}

function AttendanceTable({ attendance }: { attendance: StudentAttendanceItem[] }) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Event</th>
          <th className={styles.thCenter}>Event Status</th>
          <th className={styles.thCenter}>Time In</th>
          <th className={styles.thCenter}>Time Out</th>
          <th className={styles.thCenter}>Attendance</th>
        </tr>
      </thead>
      <tbody>
        {attendance.map((a) => (
          <tr key={a.id}>
            <td>
              <span className={styles.eventTitle}>{a.eventTitle}</span>
              <span className={styles.eventMeta}>
                {formatDate(a.startsAt)}
                {a.location ? ` · ${a.location}` : ""}
              </span>
            </td>
            <td className={styles.thCenter}>
              <Badge tone={eventStatusTone(a.eventStatus)}>
                {eventStatusLabel(a.eventStatus)}
              </Badge>
            </td>
            <td className={styles.thCenter}>
              <span className={styles.timeCell}>{formatTime(a.checkedInAt)}</span>
            </td>
            <td className={styles.thCenter}>
              <span className={styles.timeCell}>{formatTime(a.checkedOutAt)}</span>
            </td>
            <td className={styles.thCenter}>
              <Badge tone={attendanceStatusTone(a.attendanceStatus)}>
                {attendanceStatusLabel(a.attendanceStatus)}
              </Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}