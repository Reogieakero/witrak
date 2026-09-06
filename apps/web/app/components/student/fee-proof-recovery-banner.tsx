"use client";

import { useState } from "react";
import { AlertTriangle, Upload, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import styles from "./fee-proof-recovery-banner.module.css";

export function FeeProofRecoveryBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className={styles.banner} role="status" aria-live="polite">
      <div className={styles.head}>
        <span className={styles.icon} aria-hidden="true">
          <AlertTriangle size={18} />
        </span>
        <span className={styles.title}>Did you pay your fees?</span>
        <button
          type="button"
          className={styles.dismissBtn}
          onClick={() => setVisible(false)}
          aria-label="Dismiss this notice"
          title="Dismiss this notice"
        >
          <X size={16} />
        </button>
      </div>

      <p className={styles.body}>
        During the recent system recovery, fee payment proofs may not have been
        restored. If you already paid your fees, please re-upload your proof of
        payment so the Treasurer can verify it again.
      </p>

      <Button href="/dashboard/fees" className={styles.cta}>
        <Upload size={16} />
        Upload Fee Proof
      </Button>
    </div>
  );
}
