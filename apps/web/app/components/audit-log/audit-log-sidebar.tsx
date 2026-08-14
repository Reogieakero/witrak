"use client";

import { Download, Info, ShieldCheck } from "lucide-react";
import type { AuditLogSidebarProps } from "./types";
import styles from "./audit-log-sidebar.module.css";

const MODULE_ORDER: { key: string; label: string; tone: string }[] = [
  { key: "roles", label: "Roles & Access", tone: "violet" },
  { key: "sanctions", label: "Sanctions", tone: "rose" },
  { key: "fees", label: "Fees", tone: "green" },
  { key: "members", label: "Members", tone: "amber" },
];

export function AuditLogSidebar({ entries, stats }: AuditLogSidebarProps) {
  const exportCsv = () => {
    const header = "Action,Module,Actor,Target,Details,Timestamp\n";
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const body = entries
      .map((e) =>
        [
          escape(e.action),
          escape(e.module),
          escape(e.actorName),
          escape(e.targetName),
          escape(e.summary),
          escape(e.timestamp),
        ].join(","),
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-log.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const moduleCounts = new Map<string, number>();
  for (const m of MODULE_ORDER) {
    moduleCounts.set(m.key, stats.byModule.find((b) => b.module === m.key)?.count ?? 0);
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>
          <Download size={16} />
          Quick Actions
        </h3>
        <div className={styles.quickGrid}>
          <button type="button" className={styles.quickTile} onClick={exportCsv}>
            <span className={styles.quickIcon}>
              <Download size={14} />
            </span>
            <span className={styles.quickMeta}>
              <span className={styles.quickLabel}>Export CSV</span>
              <span className={styles.quickSub}>Download filtered entries</span>
            </span>
          </button>
        </div>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>
          <ShieldCheck size={16} />
          Access
        </h3>
        <div className={styles.list}>
          <div className={styles.accessRow}>
            <span className={styles.accessRole}>Super Admin</span>
            <span className={styles.accessKey}>
              <ShieldCheck size={11} />
              Can view
            </span>
          </div>
          {["Secretary", "Treasurer", "Disc. Officer", "Year Rep"].map((role) => (
            <div key={role} className={styles.accessRow}>
              <span className={styles.accessRole}>{role}</span>
              <span className={styles.accessNone}>hidden</span>
            </div>
          ))}
        </div>
        <p className={styles.accessNote}>
          Only the Super Admin can view this log.
        </p>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>
          <Info size={16} />
          By Module
        </h3>
        <div className={styles.list}>
          {MODULE_ORDER.map((m) => (
            <div key={m.key} className={styles.moduleRow}>
              <span className={styles.moduleName} data-tone={m.tone}>
                {m.label}
              </span>
              <span className={styles.moduleCount} data-tone={m.tone}>
                {moduleCounts.get(m.key) ?? 0}
              </span>
            </div>
          ))}
        </div>
        <p className={styles.accessNote}>
          Every action by the Super Admin is recorded here automatically.
        </p>
      </div>
    </aside>
  );
}