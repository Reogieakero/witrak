"use client";

import { X } from "lucide-react";
import styles from "./sanctions-modals.module.css";

export type ModalTone = "soft" | "green" | "violet" | "rose";

export function ModalShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.modal}>{children}</div>
    </div>
  );
}

export function ModalHeader({
  icon,
  tone,
  title,
  subtitle,
  onClose,
}: {
  icon: React.ReactNode;
  tone: ModalTone;
  title: string;
  subtitle: string;
  onClose: () => void;
}) {
  return (
    <div className={styles.modalHeader}>
      <div className={styles.headerLeft}>
        <div className={`${styles.iconTile} ${styles[`icon${tone[0].toUpperCase()}${tone.slice(1)}`]}`}>
          {icon}
        </div>
        <div>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      </div>
      <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
        <X size={16} />
      </button>
    </div>
  );
}

export function DrawerShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.drawer}>{children}</div>
    </div>
  );
}
