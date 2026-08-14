"use client";

import { Download, GraduationCap, Info } from "lucide-react";
import type { StudentsSidebarProps, StudentAccount } from "./types";
import styles from "./students-sidebar.module.css";

function exportCsv(rows: StudentAccount[]) {
  const header = "Name,Student No,Email,Status,Program,Year,Section,Roles\n";
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const yearLabel = (level: number | null) =>
    level ? `${level}${["th", "st", "nd", "rd"][level] ?? "th"} Year` : "";
  const body = rows
    .map((s) =>
      [
        escape(s.name),
        escape(s.studentNo),
        escape(s.email),
        s.suspended ? "Suspended" : "Active",
        s.programCode ?? "",
        yearLabel(s.yearLevel),
        s.sectionName ?? "",
        escape(s.roles.join("; ")),
      ].join(","),
    )
    .join("\n");
  const blob = new Blob([header + body], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "student-accounts.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function StudentsSidebar({
  students,
}: StudentsSidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>
          <GraduationCap size={16} />
          Quick Actions
        </h3>
        <div className={styles.quickGrid}>
          <button
            type="button"
            className={styles.quickTile}
            onClick={() => exportCsv(students)}
          >
            <span className={styles.quickIcon}>
              <Download size={14} />
            </span>
            <span className={styles.quickMeta}>
              <span className={styles.quickLabel}>Export Accounts</span>
              <span className={styles.quickSub}>Download CSV</span>
            </span>
          </button>
        </div>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>
          <Info size={16} />
          About Accounts
        </h3>
        <div className={styles.list}>
          <div className={styles.infoRow}>
            <span className={styles.infoDot} data-tone="brand" />
            <span className={styles.infoText}>
              Students <strong>auto-register</strong> a system account from the member roster.
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoDot} data-tone="green" />
            <span className={styles.infoText}>
              Active accounts can sign in and check in to events.
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoDot} data-tone="amber" />
            <span className={styles.infoText}>
              Suspended accounts are blocked until reinstated by an admin.
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoDot} data-tone="red" />
            <span className={styles.infoText}>
              Removing authorization revokes roles and pending requests.
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}