"use client";

import { useMemo, useState } from "react";
import { Activity, Banknote, CheckCheck, ShieldAlert, UserCog, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ACTION_LABELS, money } from "@/lib/constants/dashboard";
import { Badge } from "@/app/components/ui/badge";
import { Pagination } from "@/app/components/ui/pagination";
import styles from "./audit-activity.module.css";

export type AuditLog = {
  id: number;
  action: string;
  targetId: string | null;
  details: unknown;
  timestamp: string;
  actor: { name: string } | null;
};

type AuditActivityProps = {
  logs: AuditLog[];
  targetById: Record<string, string>;
};

const PAGE_SIZE = 10;

function auditStyle(action: string): { icon: LucideIcon; cls: string } {
  switch (action) {
    case "ROLE_ASSIGNED":
    case "SCOPE_CHANGED":
      return { icon: UserCog, cls: styles.auditBlue };
    case "ROLE_REVOKED":
    case "ROLE_REQUEST_REJECTED":
    case "PAYMENT_REJECTED":
      return { icon: X, cls: styles.auditRed };
    case "SANCTION_CREATED":
      return { icon: ShieldAlert, cls: styles.auditAmber };
    case "PAYMENT_VERIFIED":
      return { icon: Banknote, cls: styles.auditGreen };
    case "SANCTION_RESOLVED":
    case "FLAG_DISMISSED":
    case "FLAG_AUTO_DISMISSED":
      return { icon: CheckCheck, cls: styles.auditGreen };
    default:
      return { icon: Activity, cls: styles.auditBlue };
  }
}

function detailText(details: unknown): string {
  if (!details || typeof details !== "object") return "—";
  const d = details as Record<string, unknown>;
  const parts: string[] = [];
  if (typeof d.role === "string") parts.push(d.role);
  if (typeof d.title === "string") parts.push(d.title);
  if (typeof d.fee === "string") {
    parts.push(typeof d.amount === "number" ? `${d.fee} (${money.format(d.amount)})` : d.fee);
  } else if (typeof d.amount === "number") {
    parts.push(money.format(d.amount));
  }
  if (typeof d.rule === "string") parts.push(d.rule);
  if (typeof d.reason === "string") parts.push(d.reason);
  return parts.join(" · ") || "—";
}

function formatDateTime(d: string | Date): string {
  const date = new Date(d);
  return `${date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })} · ${date.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}`;
}

export function AuditActivity({ logs, targetById }: AuditActivityProps) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visibleLogs = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return logs.slice(start, start + PAGE_SIZE);
  }, [logs, safePage]);

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h3 className={styles.panelTitle}>Recent Audit Activity</h3>
        <Badge tone="brand">Permanent record</Badge>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thRef}>Ref</th>
              <th className={styles.thAction}>Action</th>
              <th>Details</th>
              <th className={styles.thTarget}>Target</th>
              <th className={styles.thActor}>Actor</th>
              <th className={styles.thWhen}>When</th>
            </tr>
          </thead>
          <tbody>
            {visibleLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyCell}>
                  No activity recorded yet.
                </td>
              </tr>
            ) : (
              visibleLogs.map((log) => {
                const style = auditStyle(log.action);
                const Icon = style.icon;
                return (
                  <tr key={log.id} className={styles.row}>
                    <td className={styles.refCell}>#{log.id}</td>
                    <td>
                      <span className={styles.actionCell}>
                        <span className={`${styles.auditIcon} ${style.cls}`}>
                          <Icon size={14} />
                        </span>
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className={styles.detailCell}>{detailText(log.details)}</td>
                    <td className={styles.targetCell}>
                      {log.targetId ? targetById[log.targetId] ?? "—" : "—"}
                    </td>
                    <td className={styles.actorCell}>{log.actor?.name ?? "System"}</td>
                    <td className={styles.whenCell}>{formatDateTime(log.timestamp)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={safePage}
        pageCount={pageCount}
        total={logs.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );
}
