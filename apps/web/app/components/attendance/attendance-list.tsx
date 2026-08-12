"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Calendar, QrCode, Users } from "lucide-react";
import type {
  AttendanceEventItem,
  AttendanceStudentItem,
} from "./types";
import { Badge } from "@/app/components/ui/badge";
import { SearchInput } from "@/app/components/ui/search-input";
import { Pagination } from "@/app/components/ui/pagination";
import styles from "./attendance-list.module.css";

export type AttendanceListProps = {
  events: AttendanceEventItem[];
  students: AttendanceStudentItem[];
  canScan: boolean;
  onScan: (event: AttendanceEventItem) => void;
  onEventView: (event: AttendanceEventItem) => void;
  onStudentView: (student: AttendanceStudentItem) => void;
};

type EventFilter = "all" | "live" | "past";

const PAGE_SIZE = 10;

const STORAGE_KEYS = {
  view: "fh-attendance-view",
  filter: "fh-attendance-filter",
};

const STORE_EVENT = "fh-attendance-store";

function subscribeStore(onChange: () => void) {
  window.addEventListener(STORE_EVENT, onChange);
  return () => window.removeEventListener(STORE_EVENT, onChange);
}

function notifyStore() {
  window.dispatchEvent(new Event(STORE_EVENT));
}

function readStoredView(): "event" | "student" {
  if (typeof window === "undefined") return "event";
  return window.localStorage.getItem(STORAGE_KEYS.view) === "student"
    ? "student"
    : "event";
}

function readStoredFilter(): EventFilter {
  if (typeof window === "undefined") return "all";
  const v = window.localStorage.getItem(STORAGE_KEYS.filter);
  return v === "live" || v === "past" ? v : "all";
}

export function AttendanceList({
  events,
  students,
  canScan,
  onScan,
  onEventView,
  onStudentView,
}: AttendanceListProps) {
  const view = useSyncExternalStore(
    subscribeStore,
    readStoredView,
    () => "event" as const,
  );
  const eventFilter = useSyncExternalStore(
    subscribeStore,
    readStoredFilter,
    () => "all" as const,
  );
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const handleViewChange = (v: "event" | "student") => {
    window.localStorage.setItem(STORAGE_KEYS.view, v);
    notifyStore();
    setPage(1);
  };

  const handleFilterChange = (f: EventFilter) => {
    window.localStorage.setItem(STORAGE_KEYS.filter, f);
    notifyStore();
    setPage(1);
  };

  const handleQueryChange = (q: string) => {
    setQuery(q);
    setPage(1);
  };

  const eventQuery = query.trim().toLowerCase();
  const filteredEvents = useMemo(
    () =>
      events.filter((e) => {
        const matchFilter =
          eventFilter === "all" ||
          (eventFilter === "live" ? e.status === "live" : e.status === "past");
        const matchQuery =
          !eventQuery || e.title.toLowerCase().includes(eventQuery);
        return matchFilter && matchQuery;
      }),
    [events, eventFilter, eventQuery],
  );

  const studentQuery = query.trim().toLowerCase();
  const filteredStudents = useMemo(
    () =>
      students.filter((s) => {
        if (!studentQuery) return true;
        return (
          s.name.toLowerCase().includes(studentQuery) ||
          s.studentNo.toLowerCase().includes(studentQuery) ||
          s.sectionName.toLowerCase().includes(studentQuery)
        );
      }),
    [students, studentQuery],
  );

  const eventPageCount = Math.ceil(filteredEvents.length / PAGE_SIZE);
  const studentPageCount = Math.ceil(filteredStudents.length / PAGE_SIZE);
  const activePageCount = view === "event" ? eventPageCount : studentPageCount;
  const currentPage = Math.max(1, Math.min(page, activePageCount || 1));
  const pagedEvents = filteredEvents.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const pagedStudents = filteredStudents.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <div className={styles.viewToggle}>
          <button
            type="button"
            className={view === "event" ? styles.viewToggleActive : styles.viewToggleIdle}
            onClick={() => handleViewChange("event")}
          >
            <Calendar size={14} />
            By Event
          </button>
          <button
            type="button"
            className={view === "student" ? styles.viewToggleActive : styles.viewToggleIdle}
            onClick={() => handleViewChange("student")}
          >
            <Users size={14} />
            By Student
          </button>
        </div>

        {view === "event" && (
          <div className={styles.filters}>
            {(["all", "live", "past"] as const).map((f) => (
              <button
                key={f}
                type="button"
                className={
                  eventFilter === f ? styles.filterActive : styles.filterIdle
                }
                onClick={() => handleFilterChange(f)}
              >
                {f === "all" ? "All" : f === "live" ? "Live" : "Past"}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.searchRow}>
        <SearchInput
          value={query}
          onChange={handleQueryChange}
          placeholder={
            view === "event"
              ? "Filter by event title..."
              : "Search by name, student no., or section..."
          }
        />
      </div>

      {view === "event" ? (
        <div className={styles.body}>
          {filteredEvents.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>
                <QrCode size={24} />
              </div>
              <p className={styles.emptyTitle}>No records found</p>
              <p className={styles.emptySub}>
                Try a different filter or search query.
              </p>
            </div>
          ) : (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th className={styles.center}>Date</th>
                      <th className={styles.center}>Present</th>
                      <th className={styles.center}>Late</th>
                      <th className={styles.center}>Absent</th>
                      <th className={styles.center}>Rate</th>
                      <th className={styles.center}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedEvents.map((e) => (
                      <tr key={e.id}>
                        <td>
                          <div className={styles.cellMain}>
                            <span className={styles.statusDot} data-status={e.status} />
                            <div className={styles.cellText}>
                              <span className={styles.cellTitle}>{e.title}</span>
                              <span className={styles.cellSub}>
                                {e.location ?? "No location"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className={styles.center}>
                          <span className={styles.cellMuted}>{e.scheduleDate}</span>
                        </td>
                        <td className={styles.center}>
                          <span className={styles.present}>{e.present}</span>
                        </td>
                        <td className={styles.center}>
                          <span className={styles.late}>{e.late}</span>
                        </td>
                        <td className={styles.center}>
                          <span className={styles.absent}>{e.absent}</span>
                        </td>
                        <td className={styles.center}>
                          {e.total > 0 ? (
                            <Badge tone={e.rate >= 90 ? "green" : e.rate >= 75 ? "amber" : "red"}>
                              {e.rate}%
                            </Badge>
                          ) : (
                            <span className={styles.cellMuted}>—</span>
                          )}
                        </td>
                        <td className={styles.center}>
                          <div className={styles.actions}>
                            {e.canScan && canScan && (
                              <button
                                type="button"
                                className={styles.scanBtn}
                                onClick={() => onScan(e)}
                                title="Scan attendance"
                              >
                                <QrCode size={15} />
                              </button>
                            )}
                            <button
                              type="button"
                              className={styles.actionBtn}
                              onClick={() => onEventView(e)}
                              title="View records"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
            <Pagination
              page={currentPage}
              pageCount={eventPageCount}
              total={filteredEvents.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
            </>
          )}
        </div>
      ) : (
        <div className={styles.body}>
          {filteredStudents.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>
                <Users size={24} />
              </div>
              <p className={styles.emptyTitle}>No students found</p>
              <p className={styles.emptySub}>Try a different search query.</p>
            </div>
          ) : (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Section</th>
                      <th>Student No.</th>
                      <th className={styles.center}>Present</th>
                      <th className={styles.center}>Late</th>
                      <th className={styles.center}>Absent</th>
                      <th className={styles.center}>Rate</th>
                      <th className={styles.center}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedStudents.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <div className={styles.cellMain}>
                            <span className={styles.avatar}>
                              {s.name
                                .split(" ")
                                .filter(Boolean)
                                .map((w) => w[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </span>
                            <div className={styles.cellText}>
                              <span className={styles.cellTitle}>{s.name}</span>
                              <span className={styles.cellSub}>
                                {s.programCode} · Year {s.yearLevel}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={styles.cellMuted}>{s.sectionName}</span>
                        </td>
                        <td>
                          <span className={styles.cellMuted}>{s.studentNo}</span>
                        </td>
                        <td className={styles.center}>
                          <span className={styles.present}>{s.present}</span>
                        </td>
                        <td className={styles.center}>
                          <span className={styles.late}>{s.late}</span>
                        </td>
                        <td className={styles.center}>
                          <span className={styles.absent}>{s.absent}</span>
                        </td>
                        <td className={styles.center}>
                          <Badge tone={s.rate >= 90 ? "green" : s.rate >= 75 ? "amber" : "red"}>
                            {s.rate}%
                          </Badge>
                        </td>
                        <td className={styles.center}>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => onStudentView(s)}
                            title="View records"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
            <Pagination
              page={currentPage}
              pageCount={studentPageCount}
              total={filteredStudents.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
            </>
          )}
        </div>
      )}
    </div>
  );
}