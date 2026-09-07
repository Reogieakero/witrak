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
  Eye,
  HandCoins,
} from "lucide-react";
import { sileo } from "sileo";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Modal } from "@/app/components/ui/modal";
import { Drawer } from "@/app/components/ui/drawer";
import { LoadingOverlay } from "@/app/components/ui/loading-overlay";
import { Select } from "@/app/components/ui/select";
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
  const [viewReport, setViewReport] = useState<ReportItem | null>(null);
  const [absentReason, setAbsentReason] = useState("");
  const [feesNote, setFeesNote] = useState("");
  // Logo overlay label matching the verdict being recorded.
  const [busyLabel, setBusyLabel] = useState<string | null>(null);

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
    setBusyLabel(`Marking ${status.toLowerCase()}…`);
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
      } finally {
        setBusyLabel(null);
      }
    });
  };

  const handleAbsentSubmit = () => {
    if (!absentReport || !absentReason.trim()) return;
    setBusyLabel("Marking absent…");
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
      } finally {
        setBusyLabel(null);
      }
    });
  };

  const handleFeesSubmit = () => {
    if (!resolveFeesReport || !feesNote.trim()) return;
    setBusyLabel("Resolving fees report…");
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
      } finally {
        setBusyLabel(null);
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
          <div className={styles.categorySelect}>
            <Select
              name="category"
              value={categoryFilter}
              options={[
                { value: "all", label: "All categories" },
                { value: "ATTENDANCE", label: "Attendance" },
                { value: "FEES", label: "Fees" },
              ]}
              onChange={(v) => setCategoryFilter(v as CategoryFilter)}
            />
          </div>
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
                    <Badge tone={STATUS_TONES[r.status] ?? "gray"}>
                      {r.status}
                    </Badge>
                  </td>
                  <td className={styles.muted}>{r.createdAt}</td>
                  <td>
                    <div className={styles.actionGroup}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewReport(r)}
                        className={styles.actionBtn}
                      >
                        <Eye size={13} />
                        View all
                      </Button>
                      {r.status === "PENDING" && canManage && (
                        <ReportActions
                          report={r}
                          onAttendanceResolve={handleAttendanceResolve}
                          onAbsentClick={() => setAbsentReport(r)}
                          onFeesClick={() => setResolveFeesReport(r)}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer
        open={!!viewReport}
        onClose={() => setViewReport(null)}
        title={viewReport ? `Report · ${viewReport.subject}` : "Report details"}
      >
        {viewReport && (
          <div className={styles.drawerBody}>
            <div className={styles.detailSection}>
              <span className={styles.sectionLabel}>Student</span>
              <div className={styles.studentCell}>
                <User size={16} />
                <div>
                  <div className={styles.studentName}>
                    {viewReport.studentName}
                  </div>
                  <div className={styles.studentNo}>
                    {viewReport.studentNo} · {viewReport.sectionName} ·{" "}
                    {viewReport.programCode} Y{viewReport.yearLevel}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.detailSection}>
              <span className={styles.sectionLabel}>Category</span>
              <div>
                <Badge
                  tone={viewReport.category === "ATTENDANCE" ? "brand" : "violet"}
                >
                  {viewReport.category === "ATTENDANCE" ? "Attendance" : "Fees"}
                </Badge>
              </div>
            </div>

            <div className={styles.detailSection}>
              <span className={styles.sectionLabel}>Subject</span>
              <p className={styles.par}>{viewReport.subject}</p>
            </div>

            <div className={styles.detailSection}>
              <span className={styles.sectionLabel}>Details</span>
              <p className={styles.par}>{viewReport.description}</p>
            </div>

            {viewReport.eventTitle && (
              <div className={styles.detailSection}>
                <span className={styles.sectionLabel}>Event</span>
                <div className={styles.eventRef}>
                  <Calendar size={12} />
                  {viewReport.eventTitle}
                  {viewReport.eventDate ? ` · ${viewReport.eventDate}` : ""}
                </div>
              </div>
            )}

            {viewReport.feeTitle && (
              <div className={styles.detailSection}>
                <span className={styles.sectionLabel}>Fee</span>
                <div className={styles.eventRef}>
                  <HandCoins size={12} />
                  {viewReport.feeTitle}
                </div>
              </div>
            )}

            <div className={styles.detailSection}>
              <span className={styles.sectionLabel}>Status</span>
              <div>
                <Badge tone={STATUS_TONES[viewReport.status] ?? "gray"}>
                  {viewReport.status}
                </Badge>
              </div>
              {viewReport.resolutionNote && (
                <div className={styles.resolutionNote}>
                  {viewReport.resolutionNote}
                </div>
              )}
            </div>

            <div className={styles.detailSection}>
              <span className={styles.sectionLabel}>Submitted</span>
              <p className={styles.par}>{viewReport.createdAt}</p>
            </div>
          </div>
        )}
      </Drawer>

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

      <LoadingOverlay open={isMutating || busyLabel !== null} label={busyLabel ?? "Working…"} />
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
