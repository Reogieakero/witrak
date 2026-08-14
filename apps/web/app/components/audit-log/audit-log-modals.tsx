"use client";

import { ScrollText, ShieldCheck } from "lucide-react";
import { Drawer } from "@/app/components/ui/drawer";
import { Badge } from "@/app/components/ui/badge";
import { AUDIT_ACTION_LABELS } from "./constants";
import type { AuditLogModalsProps } from "./types";
import styles from "./audit-log-modals.module.css";

export function AuditLogModals({
  entries,
  detailId,
  onCloseDetail,
}: AuditLogModalsProps) {
  const item = entries.find((e) => e.id === detailId);

  if (!item) return null;

  const json = JSON.stringify(item.details, null, 2);

  return (
    <Drawer
      open
      onClose={onCloseDetail}
      title={
        <span className={styles.modalTitle}>
          <span className={styles.headIcon}>
            <ScrollText size={16} />
          </span>
          <span>
            <span className={styles.titleLine}>Audit Entry</span>
            <span className={styles.subtitle}>#{item.id} · {item.relative}</span>
          </span>
        </span>
      }
    >
      <div className={styles.drawerBody}>
        <div className={styles.actionRow}>
          <Badge tone="violet">ACTION</Badge>
          <span className={styles.actionName}>
            {AUDIT_ACTION_LABELS[item.action] ?? item.action}
          </span>
        </div>

        <div className={styles.detailGroup}>
          <span className={styles.drawerLabel}>Actor</span>
          <div className={styles.personRow}>
            <span className={styles.actorAvatar}>{item.actorInitial}</span>
            <div>
              <span className={styles.personName}>{item.actorName}</span>
              <span className={styles.personMeta}>actor</span>
            </div>
          </div>
        </div>

        <div className={styles.detailGroup}>
          <span className={styles.drawerLabel}>Target</span>
          <div>
            <span className={styles.targetLine}>{item.targetName}</span>
            <span className={styles.targetMeta}>{item.targetDetail}</span>
          </div>
        </div>

        <div className={styles.detailGroup}>
          <span className={styles.drawerLabel}>Details · JSON snapshot</span>
          <pre className={styles.json}>{json}</pre>
        </div>

        <div className={styles.detailGroup}>
          <span className={styles.drawerLabel}>Timestamp</span>
          <span className={styles.timeValue}>{item.timestamp}</span>
        </div>

        <p className={styles.note}>
          <ShieldCheck size={13} />
          This entry is a permanent record and can&apos;t be changed or removed.
        </p>
      </div>
    </Drawer>
  );
}