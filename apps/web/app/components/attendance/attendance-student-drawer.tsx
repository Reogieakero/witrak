"use client";

import { useMemo, useState } from "react";
import { UserRound } from "lucide-react";
import type {
  AttendanceEventItem,
  AttendanceStudentItem,
  AttendanceStatus,
} from "./types";
import { Drawer } from "@/app/components/ui/drawer";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { SearchInput } from "@/app/components/ui/search-input";
import { SkeletonRows } from "@/app/components/ui/skeleton";
import styles from "./attendance-student-drawer.module.css";

export type AttendanceStudentDrawerProps = {
  student: AttendanceStudentItem;
  events: AttendanceEventItem[];
  records: {
    id: string;
    eventId: string;
    eventTitle: string;
    scheduleDate: string;
    status: AttendanceStatus;
    scannedAt: string;
    checkedInAt: string | null;
    checkedOutAt: string | null;
  }[];
  loading?: boolean;
  onClose: () => void;
};

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  });
}

function statusBadges(rec?: {
  status: AttendanceStatus;
  checkedInAt: string | null;
  checkedOutAt: string | null;
}, eventStatus?: "live" | "upcoming" | "past"): React.ReactNode[] {
  if (!rec) {
    if (eventStatus === "upcoming") {
      return [
        <Badge key="notyet" tone="gray">
          Not yet
        </Badge>,
      ];
    }
    if (eventStatus === "past") {
      return [
        <Badge key="absent" tone="red">
          Absent
        </Badge>,
      ];
    }
    return [
      <Badge key="noscanned" tone="red">
        Not scanned
      </Badge>,
    ];
  }
  const hasIn = !!rec.checkedInAt;
  const hasOut = !!rec.checkedOutAt;
  if (rec.status === "PRESENT" || rec.status === "LATE") {
    if (hasIn !== hasOut) {
      return [
        <Badge key="absent" tone="red">
          Absent
        </Badge>,
        <Badge key="missing" tone="red">
          {hasIn ? "Time out not scanned" : "Time in not scanned"}
        </Badge>,
      ];
    }
    if (rec.status === "LATE") {
      return [
        <Badge key="late" tone="amber">
          Late
        </Badge>,
        <Badge key="present" tone="green">
          Present
        </Badge>,
      ];
    }
    return [
      <Badge key="present" tone="green">
        Present
      </Badge>,
    ];
  }
  if (rec.status === "EXCUSED") {
    return [
      <Badge key="excused" tone="green">
        Excused
      </Badge>,
    ];
  }
  return [
    <Badge key="absent" tone="red">
      Absent
    </Badge>,
  ];
}

export function AttendanceStudentDrawer({
  student,
  events,
  records,
  loading = false,
  onClose,
}: AttendanceStudentDrawerProps) {
  const [query, setQuery] = useState("");

  const initials = student.name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const recordByEvent = useMemo(
    () => new Map(records.map((r) => [r.eventId, r])),
    [records],
  );

  const rows = useMemo(
    () =>
      events
        .filter((e) => e.requiresAttendance)
        .map((e) => {
          const rec = recordByEvent.get(e.id);
          return {
            eventId: e.id,
            eventTitle: e.title,
            scheduleDate: e.scheduleDate,
            scheduleTime: e.scheduleTime,
            scannedAt: rec?.scannedAt ?? null,
            checkedInAt: rec?.checkedInAt ?? null,
            checkedOutAt: rec?.checkedOutAt ?? null,
            badges: statusBadges(rec, e.status),
          };
        })
        .sort((a, b) => b.eventId.localeCompare(a.eventId)),
    [events, recordByEvent],
  );

  const searchQuery = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (!searchQuery) return true;
        return r.eventTitle.toLowerCase().includes(searchQuery);
      }),
    [rows, searchQuery],
  );

  return (
    <Drawer
      open
      onClose={onClose}
      wide
      title={
        <span className={styles.titleWrap}>
          <span className={styles.avatar}>{initials}</span>
          <span>
            <span className={styles.titleLine}>{student.name}</span>
            <span className={styles.subtitle}>
              {student.studentNo} · {student.programCode}
            </span>
          </span>
        </span>
      }
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className={styles.view}>
        <div className={styles.metaCard}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Section</span>
            <span className={styles.metaValue}>{student.sectionName}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Year Level</span>
            <span className={styles.metaValue}>
              Year {student.yearLevel}
            </span>
          </div>
        </div>

        <div className={styles.rateCard}>
          <div className={styles.rateRow}>
            <span>Overall attendance rate</span>
            <Badge tone={student.rate >= 90 ? "green" : student.rate >= 75 ? "amber" : "red"}>
              {student.rate}%
            </Badge>
          </div>
          <div className={styles.rateBar}>
            <span style={{ width: `${student.rate}%` }} />
          </div>
          <div className={styles.rateCounts}>
            <span className={styles.countGreen}>{student.present} present</span>
            <span className={styles.countAmber}>{student.late} late</span>
            <span className={styles.countRed}>{student.absent} absent</span>
          </div>
        </div>

        <div className={styles.searchRow}>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by event title..."
          />
        </div>

        <div className={styles.records}>
          {loading ? (
            <SkeletonRows rows={8} columns={6} />
          ) : rows.length === 0 ? (
            <div className={styles.empty}>
              <UserRound size={20} />
              <span>No attendance events for this student yet.</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <UserRound size={20} />
              <span>No records match your search.</span>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Date</th>
                  <th className={styles.thRight}>Scanned At</th>
                  <th className={styles.thRight}>Time In</th>
                  <th className={styles.thRight}>Time Out</th>
                  <th className={styles.thRight}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.eventId}>
                    <td>
                      <span className={styles.eventTitle}>{r.eventTitle}</span>
                    </td>
                    <td>
                      <span className={styles.cellMuted}>{r.scheduleDate}</span>
                      <span className={styles.cellMuted}>{r.scheduleTime}</span>
                    </td>
                    <td className={styles.thRight}>
                      <span className={styles.timeCell}>{formatTime(r.scannedAt)}</span>
                    </td>
                    <td className={styles.thRight}>
                      <span className={styles.timeCell}>{formatTime(r.checkedInAt)}</span>
                    </td>
                    <td className={styles.thRight}>
                      <span className={styles.timeCell}>{formatTime(r.checkedOutAt)}</span>
                    </td>
                    <td className={styles.thRight}>
                      <span className={styles.badgeGroup}>{r.badges}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Drawer>
  );
}
