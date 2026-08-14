"use client";

import { ShieldAlert, Activity, CheckCheck, Flag } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { ACTION_LABELS } from "@/lib/constants/dashboard";
import { DrawerShell, ModalHeader } from "./sanctions-modal-shell";
import type { SanctionItem, SanctionsActivityItem } from "./types";
import styles from "./sanctions-modals.module.css";

function EvidenceTable({ rows }: { rows: { eventTitle: string; date: string; status: string }[] }) {
  if (!rows.length) {
    return <p className={styles.parLight}>No attendance evidence recorded yet.</p>;
  }
  return (
    <div className={styles.evidenceWrap}>
      <table className={styles.evidenceTable}>
        <thead>
          <tr>
            <th>Event</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e, i) => {
            const absent = e.status.toLowerCase().includes("absent");
            return (
              <tr key={i}>
                <td className={styles.evName}>{e.eventTitle}</td>
                <td className={styles.evDate}>{e.date}</td>
                <td>
                  <span className={`${styles.evStatus} ${absent ? styles.evStatusAbsent : styles.evStatusPresent}`}>
                    {absent ? "Absent" : e.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function SanctionDrawer({
  item,
  canResolve,
  canEdit,
  onResolve,
  onEditFor,
  onClose,
}: {
  item: SanctionItem;
  canResolve: boolean;
  canEdit: boolean;
  onResolve: (id: string) => void;
  onEditFor: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <DrawerShell onClose={onClose}>
      <ModalHeader
        tone="rose"
        icon={<ShieldAlert size={16} />}
        title="Sanction Details"
        subtitle={item.studentName}
        onClose={onClose}
      />
      <div className={styles.drawerBody}>
        <div className={styles.metrics}>
          <div className={styles.metricTile}>
            <div className={`${styles.metricValue} ${styles.metricValueRose}`}>{item.ruleThreshold}</div>
            <div className={styles.metricLabel}>Absences</div>
          </div>
          <div className={styles.metricTile}>
            <div className={`${styles.metricValue} ${item.outcome === "Open" ? styles.metricValueAmber : styles.metricValueGreen}`}>
              {item.outcome}
            </div>
            <div className={styles.metricLabel}>Status</div>
          </div>
        </div>
        <div>
          <span className={styles.sectionLabel}>Reason</span>
          <p className={styles.par}>{item.reason}</p>
        </div>
        <div>
          <span className={styles.sectionLabel}>Attached evidence</span>
          <EvidenceTable rows={item.evidence} />
        </div>
      </div>
      <div className={styles.footer}>
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
          Close
        </Button>
        {canEdit && (
          <Button type="button" variant="secondary" size="sm" onClick={() => onEditFor(item.id)}>
            Edit
          </Button>
        )}
        {canResolve && item.outcome === "Open" && (
          <Button type="button" variant="primary" size="sm" onClick={() => onResolve(item.id)}>
            Cleared
          </Button>
        )}
      </div>
    </DrawerShell>
  );
}

function activityTone(action: string): string {
  switch (action) {
    case "SANCTION_RESOLVED":
      return "green";
    case "SANCTION_CREATED":
      return "rose";
    case "FLAG_DISMISSED":
    case "FLAG_AUTO_DISMISSED":
      return "amber";
    default:
      return "soft";
  }
}

function activityIcon(action: string) {
  switch (action) {
    case "SANCTION_RESOLVED":
      return <CheckCheck size={14} />;
    case "SANCTION_CREATED":
      return <ShieldAlert size={14} />;
    case "FLAG_DISMISSED":
    case "FLAG_AUTO_DISMISSED":
      return <Flag size={14} />;
    default:
      return <Activity size={14} />;
  }
}

export function ActivityDrawer({ logs, onClose }: { logs: SanctionsActivityItem[]; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <ModalHeader
        tone="soft"
        icon={<Activity size={16} />}
        title="Activity Logs"
        subtitle="History of sanction and flag updates"
        onClose={onClose}
      />
      <div className={styles.drawerBody}>
        <p className={styles.parLight}>
          A history of sanction creation, resolution, and flag updates. Entries are
          permanent and can&apos;t be changed or removed.
        </p>
        {logs.length === 0 ? (
          <p className={styles.parLight}>No sanction activity yet.</p>
        ) : (
          <div className={styles.activityList}>
            {logs.map((l) => {
              const tone = activityTone(l.action);
              return (
                <div key={l.id} className={styles.activityItem}>
                  <div
                    className={`${styles.iconTile} ${styles[`icon${tone.charAt(0).toUpperCase()}${tone.slice(1)}`]}`}
                  >
                    {activityIcon(l.action)}
                  </div>
                  <div className={styles.activityText}>
                    <span className={styles.activityLabel}>
                      {ACTION_LABELS[l.action] ?? l.action}
                      <span className={styles.activityRef}>#{l.id}</span>
                    </span>
                    <span className={styles.activityDetail}>{l.details}</span>
                    <span className={styles.activityMeta}>
                      {l.actorName} · {l.when}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className={styles.footer}>
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    </DrawerShell>
  );
}
