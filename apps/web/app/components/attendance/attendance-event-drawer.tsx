"use client";

import { useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  Loader2,
  Pencil,
  QrCode,
} from "lucide-react";
import type {
  AttendanceEventItem,
  AttendanceRecord,
  AttendanceStatus,
} from "./types";
import { Drawer } from "@/app/components/ui/drawer";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { SearchInput } from "@/app/components/ui/search-input";
import { Pagination } from "@/app/components/ui/pagination";
import { LoadingOverlay } from "@/app/components/ui/loading-overlay";
import { updateAttendanceStatus } from "@/app/admin/attendance/actions";
import { sileo } from "sileo";
import { SkeletonRows } from "@/app/components/ui/skeleton";
import styles from "./attendance-event-drawer.module.css";

export type AttendanceEventDrawerProps = {
  event: AttendanceEventItem;
  students: { id: string; name: string; sectionName: string; programId: string | null }[];
  records: AttendanceRecord[];
  loading?: boolean;
  canScan: boolean;
  canEdit: boolean;
  onClose: () => void;
  onScan: (event: AttendanceEventItem) => void;
  onChanged: () => void;
};

type Row = {
  studentId: string;
  studentName: string;
  sectionName: string;
  status: AttendanceStatus | null;
  scannedAt: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  checkedOutOnly: boolean;
};

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: AttendanceStatus): string {
  switch (status) {
    case "PRESENT":
      return "Present";
    case "LATE":
      return "Late";
    case "ABSENT":
      return "Absent";
    case "EXCUSED":
      return "Excused";
  }
}

export function AttendanceEventDrawer({
  event,
  students,
  records,
  loading = false,
  canScan,
  canEdit,
  onClose,
  onScan,
  onChanged,
}: AttendanceEventDrawerProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useState<
    Map<string, { status: AttendanceStatus; scannedAt: string | null }>
  >(new Map());

  const defaultStatus: AttendanceStatus | null =
    event.status === "past" ? "ABSENT" : null;

  const roster = useMemo(
    () =>
      students.filter(
        (s) => !event.programId || s.programId === event.programId,
      ),
    [students, event.programId],
  );

  const recordByStudent = useMemo(
    () => new Map(records.map((r) => [r.studentId, r])),
    [records],
  );

  const rows: Row[] = useMemo(
    () =>
      roster.map((s) => {
        const r = recordByStudent.get(s.id);
        const optimistic = optimisticStatus.get(s.id);
        return {
          studentId: s.id,
          studentName: s.name,
          sectionName: s.sectionName,
          status: optimistic?.status ?? r?.status ?? defaultStatus,
          scannedAt: optimistic?.scannedAt ?? r?.scannedAt ?? null,
          checkedInAt: r?.checkedInAt ?? null,
          checkedOutAt: r?.checkedOutAt ?? null,
          checkedOutOnly: !!(r?.checkedOutAt && !r?.checkedInAt),
        };
      }),
    [roster, recordByStudent, defaultStatus, optimisticStatus],
  );

  const present = rows.filter((r) => r.status === "PRESENT").length;
  const late = rows.filter((r) => r.status === "LATE").length;
  const absent = rows.filter(
    (r) => r.status === "ABSENT" || r.status === "EXCUSED",
  ).length;
  const allPresent =
    rows.length > 0 && rows.every((r) => r.status === "PRESENT");

  const searchQuery = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (!searchQuery) return true;
        return (
          r.studentName.toLowerCase().includes(searchQuery) ||
          r.sectionName.toLowerCase().includes(searchQuery)
        );
      }),
    [rows, searchQuery],
  );

  const PAGE_SIZE = 20;
  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage = Math.max(1, Math.min(page, pageCount || 1));
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleQueryChange = (q: string) => {
    setQuery(q);
    setPage(1);
  };

  const handleStatusChange = (studentId: string, value: string) => {
    if (!value) return;
    const status = value as AttendanceStatus;
    setEditingId(null);
    setOptimisticStatus((prev) => {
      const next = new Map(prev);
      next.set(studentId, { status, scannedAt: new Date().toISOString() });
      return next;
    });
    startTransition(async () => {
      try {
        await sileo.promise(
          async () => {
            const result = await updateAttendanceStatus({
              eventId: event.id,
              studentId,
              status: value,
            });
            if (!result.ok) {
              throw new Error(result.error ?? "Failed to update status.");
            }
            return result;
          },
          {
            loading: {
              title: "Saving status",
              description: "Updating attendance status…",
              icon: <Loader2 />,
            },
            success: {
              title: "Status updated",
              description: "The attendance status was saved successfully.",
              icon: <CheckCircle2 />,
            },
            error: (err) => ({
              title: "Couldn't update status",
              description:
                err instanceof Error ? err.message : "Please try again.",
              icon: <AlertTriangle />,
            }),
          },
        );
        onChanged();
      } catch {
        setOptimisticStatus((prev) => {
          const next = new Map(prev);
          next.delete(studentId);
          return next;
        });
      } finally {
        setBusy(false);
        setBusyLabel(null);
      }
    });
  };

  return (
    <>
      <Drawer
        open
        onClose={onClose}
        wide
        title={
        <span className={styles.titleWrap}>
          <span className={styles.titleIcon}>
            <CalendarCheck size={16} />
          </span>
          <span>
            <span className={styles.titleLine}>Event Records</span>
            <span className={styles.subtitle}>{event.title}</span>
          </span>
        </span>
      }
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" size="md" onClick={onClose}>
            Close
          </Button>
          {canScan && event.canScan && (
            <Button variant="primary" size="md" onClick={() => onScan(event)}>
              <QrCode size={13} />
              Scan More
            </Button>
          )}
        </div>
      }
    >
      <div className={styles.view}>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue} data-tone="green">
              {present}
            </span>
            <span className={styles.statLabel}>Present</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue} data-tone="amber">
              {late}
            </span>
            <span className={styles.statLabel}>Late</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue} data-tone="red">
              {absent}
            </span>
            <span className={styles.statLabel}>Absent</span>
          </div>
        </div>

        <div className={styles.rateRow}>
          <span>Present rate</span>
          <Badge tone={event.rate >= 90 ? "green" : event.rate >= 75 ? "amber" : "red"}>
            {event.rate}%
          </Badge>
        </div>
        <div className={styles.rateBar}>
          <span style={{ width: `${event.rate}%` }} />
        </div>
        {rows.length > 0 && (
          <div className={styles.rateRow}>
            <span>Attendance status</span>
            <Badge tone={allPresent ? "green" : "amber"}>
              {allPresent ? "All present" : "Partial present"}
            </Badge>
          </div>
        )}

        <div className={styles.schedule}>
          <span className={styles.scheduleItem}>{event.scheduleDate}</span>
          <span className={styles.scheduleItem}>{event.scheduleTime}</span>
          {event.location && (
            <span className={styles.scheduleItem}>{event.location}</span>
          )}
        </div>

        <div className={styles.searchRow}>
          <SearchInput
            value={query}
            onChange={handleQueryChange}
            placeholder="Search by student or section..."
          />
        </div>

        <div className={styles.records}>
          {loading ? (
            <SkeletonRows rows={8} columns={6} />
          ) : rows.length === 0 ? (
            <div className={styles.empty}>
              <QrCode size={20} />
              <span>No registered students for this event.</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <QrCode size={20} />
              <span>No records match your search.</span>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Student</th>
                  <th className={styles.thRight}>Scanned At</th>
                  <th className={styles.thRight}>Check In</th>
                  <th className={styles.thRight}>Check Out</th>
                  <th className={styles.thRight}>Status</th>
                  <th className={styles.right}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((r) => (
                  <tr key={r.studentId}>
                    <td>
                      <span className={styles.studentName}>{r.studentName}</span>
                    </td>
                    <td className={styles.thRight}>
                      <span className={styles.timeCell}>
                        {formatTime(r.scannedAt)}
                      </span>
                    </td>
                    <td className={styles.thRight}>
                      <span className={styles.timeCell}>
                        {formatTime(r.checkedInAt)}
                      </span>
                    </td>
                    <td className={styles.thRight}>
                      <span className={styles.timeCell}>
                        {formatTime(r.checkedOutAt)}
                      </span>
                    </td>
                    <td className={styles.thRight}>
                      {r.checkedOutOnly ? (
                        <Badge tone="red">Checked out only</Badge>
                      ) : r.status === "PRESENT" ? (
                        <Badge tone="green">Present</Badge>
                      ) : r.status === "LATE" ? (
                        <Badge tone="amber">Late</Badge>
                      ) : r.status ? (
                        <Badge tone="red">{statusLabel(r.status)}</Badge>
                      ) : (
                        <Badge tone="red">Not scanned</Badge>
                      )}
                    </td>
                    <td className={styles.right}>
                      {canEdit && (
                        <div className={styles.statusEdit}>
                          <button
                            type="button"
                            className={styles.statusEditBtn}
                            disabled={pending}
                            onClick={() =>
                              setEditingId(
                                editingId === r.studentId ? null : r.studentId,
                              )
                            }
                          >
                            <Pencil size={13} />
                            Edit status
                          </button>
                          {editingId === r.studentId && (
                            <div className={styles.statusMenu}>
                              <button
                                type="button"
                                onClick={() =>
                                  handleStatusChange(r.studentId, "PRESENT")
                                }
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleStatusChange(r.studentId, "LATE")
                                }
                              >
                                Late
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleStatusChange(r.studentId, "ABSENT")
                                }
                              >
                                Absent
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleStatusChange(r.studentId, "EXCUSED")
                                }
                              >
                                Excused
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {filtered.length > 0 && (
          <div className={styles.pagination}>
            <Pagination
              page={currentPage}
              pageCount={pageCount}
              total={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </Drawer>

    {typeof document !== "undefined" &&
      createPortal(
        <LoadingOverlay open={busy || pending} label={busyLabel ?? "Working…"} />,
        document.body,
      )}
    </>
  );
}