"use client";

import { UserPlus, Download, Zap, XCircle } from "lucide-react";
import type { MembersSidebarProps, MemberItem, RejectedRequest } from "./types";
import styles from "./members-sidebar.module.css";

function exportCsv(rows: MemberItem[]) {
  const header = "Name,Student No,Status,Program,Year,Section\n";
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const body = rows
    .map((m) =>
      [
        escape(m.name),
        escape(m.studentNo),
        m.status,
        m.programCode ?? "",
        m.yearLevel ? `${m.yearLevel}` : "",
        m.sectionName ?? "",
      ].join(","),
    )
    .join("\n");
  const blob = new Blob([header + body], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "members.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function formatTimestamp(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function rejectedSub(r: RejectedRequest): string {
  if (r.sectionName) return `${r.scopeLabel} · ${r.programName ?? r.programCode ?? ""}`;
  return r.scopeLabel;
}

export function MembersSidebar({
  members,
  rejected,
  canManage,
  onAddMember,
}: MembersSidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>
          <Zap size={16} />
          Quick Actions
        </h3>
        <div className={styles.quickGrid}>
          {canManage && (
            <button
              type="button"
              className={styles.quickTile}
              onClick={onAddMember}
            >
              <span className={styles.quickIcon}>
                <UserPlus size={14} />
              </span>
              <span className={styles.quickMeta}>
                <span className={styles.quickLabel}>Add Member</span>
                <span className={styles.quickSub}>Invite a student</span>
              </span>
            </button>
          )}
          <button
            type="button"
            className={styles.quickTile}
            onClick={() => exportCsv(members)}
          >
            <span className={styles.quickIcon}>
              <Download size={14} />
            </span>
            <span className={styles.quickMeta}>
              <span className={styles.quickLabel}>Export Directory</span>
              <span className={styles.quickSub}>Download CSV</span>
            </span>
          </button>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHead}>
          <h3 className={styles.cardTitle}>
            <XCircle size={16} />
            Rejected Requests
          </h3>
          <span className={styles.cardCount}>{rejected.length}</span>
        </div>
        {rejected.length === 0 ? (
          <p className={styles.note}>No rejected role requests yet.</p>
        ) : (
          <div className={styles.scrollList}>
            {rejected.map((r) => (
              <div key={r.id} className={styles.item}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemTitle}>{r.userName}</span>
                  <span className={styles.itemSub}>{r.requestedRole}</span>
                  <span className={styles.itemScope}>{rejectedSub(r)}</span>
                  {r.rejectedAt && (
                    <span className={styles.itemRejected}>
                      <XCircle size={11} />
                      Rejected {formatTimestamp(r.rejectedAt)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}