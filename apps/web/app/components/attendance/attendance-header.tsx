"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { InfoModal } from "@/app/components/ui/info-modal";
import styles from "./attendance-header.module.css";

export type AttendanceHeaderProps = {
  canScan: boolean;
  onScan?: () => void;
};

export function AttendanceHeader({
  canScan,
  onScan,
}: AttendanceHeaderProps) {
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <div className={styles.headRow}>
      <div>
        <div className={styles.titleLine}>
          <h1 className={styles.title}>Attendance</h1>
        </div>
        <p className={styles.subtitle}>
          Track check-ins per event via QR scan, review records, and correct
          entries.
        </p>
      </div>
      <div className={styles.actions}>
        {canScan && onScan && (
          <Button variant="primary" size="md" onClick={onScan}>
            Scan Attendance
          </Button>
        )}
        <button
          type="button"
          className={styles.infoBtn}
          onClick={() => setInfoOpen(true)}
          aria-label="About attendance"
          title="About attendance"
        >
          <Info size={16} />
        </button>
      </div>

      <InfoModal
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        title="About Attendance"
        subtitle="How attendance works"
        description={
          <>
            <p className={styles.infoBody}>
              Attendance is logged per event via QR scan at check-in. Here&apos;s
              a quick overview:
            </p>
            <ul className={styles.infoList}>
              <li>
                <strong>Scan</strong> — Officers scan student QR codes at the
                door using the event passcode.
              </li>
              <li>
                <strong>Records</strong> — Each scan becomes a present, late, or
                absent record tied to an event.
              </li>
              <li>
                <strong>Scope</strong> — Year Reps can only scan and view their
                assigned sections.
              </li>
              <li>
                <strong>Correct</strong> — Only Super Admins and Secretaries can
                edit or correct records.
              </li>
            </ul>
          </>
        }
      />
    </div>
  );
}
