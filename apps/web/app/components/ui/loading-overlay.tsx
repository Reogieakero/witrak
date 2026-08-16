"use client";

import { BreathingLogo } from "./breathing-logo";
import styles from "./loading-overlay.module.css";

export function LoadingOverlay({
  open,
  label = "Working…",
}: {
  open: boolean;
  label?: string;
}) {
  if (!open) return null;
  return (
    <div className={styles.overlay} role="status" aria-live="polite">
      <div className={styles.card}>
        <span className={styles.logoWrap}>
          <BreathingLogo size={52} />
        </span>
        <span className={styles.label}>{label}</span>
      </div>
    </div>
  );
}