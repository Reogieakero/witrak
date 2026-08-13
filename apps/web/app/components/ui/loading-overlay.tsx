"use client";

import { Loader2 } from "lucide-react";
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
        <span className={styles.spinnerWrap}>
          <Loader2 size={22} className={styles.spinner} />
        </span>
        <span className={styles.label}>{label}</span>
      </div>
    </div>
  );
}