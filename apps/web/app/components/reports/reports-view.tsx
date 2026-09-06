"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  FileText,
  Loader2,
  User,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { sileo } from "sileo";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Modal } from "@/app/components/ui/modal";
import {
  resolveAttendanceReport,
  reviewFeesReport,
} from "@/app/admin/reports/actions";
import type { ReportItem, ReportStats } from "./types";
import styles from "./reports-view.module.css";

type ActiveTab = "all" | "pending" | "resolved";
type CategoryFilter = "all" | "ATTENDANCE" | "FEES";

const STATUS_TONES: Record<string, "brand" | "amber" | "red" | "green" | "gray" | "violet"> = {
  PENDING: "amber",
  REVIEWED: "brand",
  RESOLVED: "green",
};

export function ReportsView({
  reports,
  stats,
  canManage,
}: {
  reports: ReportItem[];
  stats: ReportStats;
  canManage: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<ActiveTab>("pending");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");
  const [isMutating, startTransition] = useTransition();

  const [absentReport, setAbsentReport] = useState<ReportItem | null>(null);
  const [resolveFeesReport, setResolveFeesReport] = useState<ReportItem | null>(null);
  const [absentReason, setAbsentReason] = useState("");
  const [feesNote, setFeesNote] = useState("");

  const filtered = reports.filter(
    (r) =>
      (tab === "all" ||
        (tab === "pending" && r.status === "PENDING") ||
        (tab === "resolved" &&
          (r.status === "REVIEWED" || r.status === "RESOLVED"))) &&
      (categoryFilter === "all" || r.category === categoryFilter) &&
      (query.trim() === "" ||
        r.subject.toLowerCase().includes(query.toLowerCase()) ||
        r.studentName.toLowerCase().includes(query.toLowerCase()) ||
        r.studentNo.toLowerCase().includes(query.toLowerCase())),
  );

  const handleAttendanceResolve = (
    report: ReportItem,
    status: "PRESENT" | "LATE" | "EXCUSED",
  ) => {
    if (!canManage) return;
    startTransition(async () => {
      try {
        await sileo.promise(
          () => resolveAttendanceReport({ reportId: report.id, status, reason: "" }),
          {
            loading: {
              title: "Resolving report",
              description: `Marking attendance as ${status.toLowerCase()}...`,
              icon: <Loader2 className={styles.spin} />,
            },
            success: {
              title: "Report resolved",
              description: `Attendance set to ${status.toLowerCase()}.`,
              icon: <FileText />,
            },
            error: (err) => ({
              title: "Could not resolve",
              description:
                err instanceof Error ? err.message : "Please try again.",
              icon: <AlertCircle />,
            }),
          },
        );
        await router.refresh();
      } catch {
        /* sileo handles errors */
      }
    });
  };

  const handleAbsentSubmit = () => {
    if (!absentReport || !absentReason.trim()) return;
    startTransition(async () => {
      try {
        await sileo.promise(
          () =>
            resolveAttendanceReport({
              reportId: absentReport.id,
              status: "ABSENT",
              reason: absentReason,
            }),
          {
            loading: {
              title: "Rejecting report",
              description: "Marking attendance as absent...",
              icon: <Loader2 className={styles.spin} />,
            },
            success: {
              title: "Report rejected",
              description: "Attendance set to absent with reason recorded.",
              icon: <FileText />,
            },
            error: (err) => ({
              title: "Could not reject",
              description:
                err instanceof Error ? err.message : "Please try again.",
              icon: <AlertCircle />,
            }),
          },
        );
        setAbsentReport(null);
        setAbsentReason("");
        await router.refresh();
      } catch {
        /* sileo handles errors */
      }
    });
  };

  const handleFeesSubmit = () => {
    if (!resolveFeesReport || !feesNote.trim()) return;
    startTransition(async () => {
      try {
        await sileo.promise(
          () => reviewFeesReport({ reportId: resolveFeesReport.id, note: feesNote }),
          {
            loading: {
              title: "Reviewing report",
              description: "Resolving fees report...",
              icon: <Loader2 className={styles.spin} />,
            },
            success: {
              title: "Report resolved",
              description: "Fees report resolved with your note.",
              icon: <FileText />,
            },
            error: (err) => ({
              title: "Could not resolve",
              description:
                err instanceof Error ? err.message : "Please try again.",
              icon: <AlertCircle />,
            }),
          },
        );
        setResolveFeesReport(null);
        setFeesNote("");
        await router.refresh();
      } catch {
        /* sileo handles errors */
      }
    });
  };

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Reports</h1>
          <p className={styles.pageSubtitle}>
            Student-submitted reports for attendance and fees issues.
          </p>
        </div>
      </header>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Total</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.pending}</div>
          <div className={styles.statLabel}>Pending</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.resolved}</div>
          <div className={styles.statLabel}>Resolved</div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.tabGroup}>
          <button
            type="button"
            className={`${styles.tabBtn} ${tab === "all" ? styles.tabActive : ""}`}
            onClick={() => setTab("all")}
          >
            All
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${tab === "pending" ? styles.tabActive : ""}`}
            onClick={() => setTab("pending")}
          >
            Pending
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${tab === "resolved" ? styles.tabActive : ""}`}
            onClick={() => setTab("resolved")}
          >
            Resolved
          </button>
        </div>

        <div className={styles.filterGroup}>
          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as CategoryFilter)
            }
            className={styles.filterSelect}
          >
            <option value="all">All categories</option>
            <option value="ATTENDANCE">Attendance</option>
            <option value="FEES">Fees</option>
          </select>
          <input
            type="search"
            placeholder="Search reports…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <ClipboardList size={48} />
          <p>No reports match your filters.</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.reportsTable}>
            <thead>
              <tr>
                <th>Student</th>
                <th>Section</th>
                <th>Category</th>
                <th>Subject</th>
                <th>Details</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className={styles.reportRow}>
                  <td className={styles.studentCell}>
                    <User size={16} />
                    <div>
                      <div className={styles.studentName}>
                        {r.studentName}
                      </div>
                      <div className={styles.studentNo}>{r.studentNo}</div>
                    </div>
                  </td>
                  <td>{r.sectionName}</td>
                  <td>
                    <Badge
                      tone={r.category === "ATTENDANCE" ? "brand" : "violet"}
                    >
                      {r.category === "ATTENDANCE"
                        ? "Attendance"
                        : "Fees"}
                    </Badge>
                  </td>
                  <td>{r.subject}</td>
                  <td>
                    <div className={styles.descriptionCell}>
                      {r.description}
                    </div>
                    {r.eventTitle && (
                      <div className={styles.eventRef}>
                        <Calendar size={12} /> Event: {r.eventTitle}
                      </div>
                    )}
                    {r.feeTitle && (
                      <div className={styles.eventRef}>
                        <span className={styles.dot} /> Fee: {r.feeTitle}
                      </div>
                    )}
                  </td>
                  <td>
                    <Badge tone={STATUS_TONES[r.status] ?? "gray"}>
                      {r.status}
                    </Badge>
                    {r.resolutionNote && (
                      <div className={styles.resolutionNote}>
                        {r.resolutionNote}
                      </div>
                    )}
                  </td>
                  <td className={styles.muted}>{r.createdAt}</td>
                  <td>
                    {r.status === "PENDING" && canManage && (
                      <ReportActions
                        report={r}
                        onAttendanceResolve={handleAttendanceResolve}
                        onAbsentClick={() => setAbsentReport(r)}
                        onFeesClick={() => setResolveFeesReport(r)}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!absentReport}
        onClose={() => setAbsentReport(null)}
        title="Mark Absent (Reject Report)"
        footer={
          <div className={styles.modalFooter}>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setAbsentReport(null)}
              type="button"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={handleAbsentSubmit}
              disabled={!absentReason.trim() || isMutating}
              type="button"
            >
              Confirm Absent
            </Button>
          </div>
        }
      >
        <p className={styles.modalDesc}>
          You are rejecting this attendance report. The student&lsquo;s attendance for{" "}
          {absentReport?.eventTitle ?? "this event"} will be set to ABSENT.
          Please provide a reason.
        </p>
        <textarea
          value={absentReason}
          onChange={(e) => setAbsentReason(e.target.value)}
          placeholder="Reason for marking absent..."
          className={styles.reasonTextarea}
          maxLength={500}
          rows={4}
        />
      </Modal>

      <Modal
        open={!!resolveFeesReport}
        onClose={() => setResolveFeesReport(null)}
        title="Resolve Fees Report"
        footer={
          <div className={styles.modalFooter}>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setResolveFeesReport(null)}
              type="button"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleFeesSubmit}
              disabled={!feesNote.trim() || isMutating}
              type="button"
            >
              Resolve
            </Button>
          </div>
        }
      >
        <p className={styles.modalDesc}>
          Add a note to resolve this fees report.
        </p>
        <textarea
          value={feesNote}
          onChange={(e) => setFeesNote(e.target.value)}
          placeholder="Resolution note..."
          className={styles.reasonTextarea}
          maxLength={500}
          rows={4}
        />
      </Modal>
    </div>
  );
}

function ReportActions({
  report,
  onAttendanceResolve,
  onAbsentClick,
  onFeesClick,
}: {
  report: ReportItem;
  onAttendanceResolve: (
    report: ReportItem,
    status: "PRESENT" | "LATE" | "EXCUSED",
  ) => void;
  onAbsentClick: () => void;
  onFeesClick: () => void;
}) {
  if (report.category === "ATTENDANCE") {
    return (
      <div className={styles.actionGroup}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAttendanceResolve(report, "PRESENT")}
          className={styles.actionBtn}
        >
          Present
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAttendanceResolve(report, "LATE")}
          className={styles.actionBtn}
        >
          Late
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAttendanceResolve(report, "EXCUSED")}
          className={styles.actionBtn}
        >
          Excuse
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onAbsentClick}
          className={styles.actionBtnAbsent}
        >
          Absent
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onFeesClick}
      className={styles.actionBtn}
    >
      Resolve
    </Button>
  );
}
