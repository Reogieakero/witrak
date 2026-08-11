import { Activity, Banknote, CheckCheck, ShieldAlert, UserCog, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ACTION_LABELS, money } from "@/lib/constants/dashboard";
import styles from "./audit-activity.module.css";

export type AuditLog = {
  id: number;
  action: string;
  targetId: string | null;
  details: unknown;
  timestamp: Date;
  actor: { name: string };
};

type AuditActivityProps = {
  logs: AuditLog[];
  targetById: Map<string, string>;
};

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

function formatDateTime(d: Date): string {
  const date = d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
}

export function AuditActivity({ logs, targetById }: AuditActivityProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h3 className={styles.panelTitle}>Recent Audit Activity</h3>
        <span className={styles.badgeBrand}>Append-only</span>
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
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyCell}>
                  No activity recorded yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
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
                      {log.targetId ? targetById.get(log.targetId) ?? "—" : "—"}
                    </td>
                    <td className={styles.actorCell}>{log.actor.name}</td>
                    <td className={styles.whenCell}>{formatDateTime(log.timestamp)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.panelFooter}>
        <span>All SA actions logged</span>
        <span className={styles.panelLink}>Open log</span>
      </div>
    </div>
  );
}
