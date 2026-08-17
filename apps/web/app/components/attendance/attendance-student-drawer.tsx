"use client";

import { useMemo, useState } from "react";
import { UserRound } from "lucide-react";
import type { AttendanceStudentItem, AttendanceStatus } from "./types";
import { Drawer } from "@/app/components/ui/drawer";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { SearchInput } from "@/app/components/ui/search-input";
import { SkeletonRows } from "@/app/components/ui/skeleton";
import styles from "./attendance-student-drawer.module.css";

export type AttendanceStudentDrawerProps = {
  student: AttendanceStudentItem;
  records: {
    id: string;
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
  });
}

export function AttendanceStudentDrawer({
  student,
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

  const searchQuery = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      records.filter((r) => {
        if (!searchQuery) return true;
        return r.eventTitle.toLowerCase().includes(searchQuery);
      }),
    [records, searchQuery],
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
          ) : records.length === 0 ? (
            <div className={styles.empty}>
              <UserRound size={20} />
              <span>No attendance records for this student yet.</span>
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
                  <th className={styles.thRight}>Check In</th>
                  <th className={styles.thRight}>Check Out</th>
                  <th className={styles.thRight}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className={styles.eventTitle}>{r.eventTitle}</span>
                    </td>
                    <td>
                      <span className={styles.cellMuted}>{r.scheduleDate}</span>
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
                      {r.checkedOutAt && !r.checkedInAt ? (
                        <Badge tone="red">Checked out only</Badge>
                      ) : (
                        <Badge
                          tone={
                            r.status === "PRESENT"
                              ? "green"
                              : r.status === "LATE"
                                ? "amber"
                                : "red"
                          }
                        >
                          {r.status === "PRESENT"
                            ? "Present"
                            : r.status === "LATE"
                              ? "Late"
                              : "Absent"}
                        </Badge>
                      )}
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