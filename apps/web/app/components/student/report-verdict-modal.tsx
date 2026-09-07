"use client";

import { useState } from "react";
import { Calendar, FileCheck2, HandCoins } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Modal } from "@/app/components/ui/modal";
import styles from "./report-verdict-modal.module.css";

export type ReportVerdict = {
  id: string;
  category: "ATTENDANCE" | "FEES";
  subject: string;
  status: string;
  resolutionNote: string | null;
  eventTitle: string | null;
  feeTitle: string | null;
  createdAt: string;
};

function verdictTone(status: string): "green" | "brand" | "amber" | "gray" {
  if (status === "RESOLVED") return "green";
  if (status === "REVIEWED") return "brand";
  return "amber";
}

/**
 * Report verdict popup on the student home. Opens automatically every time
 * the home loads while the student has recently resolved reports, so verdicts
 * (present / late / excused / absent / fees resolved) are never missed.
 */
export function ReportVerdictModal({ verdicts }: { verdicts: ReportVerdict[] }) {
  const [open, setOpen] = useState(verdicts.length > 0);
  if (verdicts.length === 0) return null;

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title={
        <span className={styles.modalTitle}>
          <span className={styles.modalTitleIcon}>
            <FileCheck2 size={16} />
          </span>
          <span>Report updates</span>
        </span>
      }
      footer={
        <div className={styles.modalFooter}>
          <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      }
    >
      <p className={styles.modalSub}>
        {verdicts.length === 1
          ? "An officer gave a verdict on your report."
          : `Officers gave verdicts on ${verdicts.length} of your reports.`}
      </p>
      <div className={styles.list}>
        {verdicts.map((v) => (
          <article key={v.id} className={styles.card}>
            <div className={styles.cardHead}>
              <Badge tone={v.category === "ATTENDANCE" ? "brand" : "violet"}>
                {v.category === "ATTENDANCE" ? "Attendance" : "Fees"}
              </Badge>
              <Badge tone={verdictTone(v.status)}>{v.status}</Badge>
            </div>
            <h4 className={styles.cardSubject}>{v.subject}</h4>
            {v.eventTitle && (
              <p className={styles.cardRef}>
                <Calendar size={12} /> Event: {v.eventTitle}
              </p>
            )}
            {v.feeTitle && (
              <p className={styles.cardRef}>
                <HandCoins size={12} /> Fee: {v.feeTitle}
              </p>
            )}
            {v.resolutionNote ? (
              <p className={styles.cardNote}>{v.resolutionNote}</p>
            ) : (
              <p className={styles.cardNoteMuted}>No officer note attached.</p>
            )}
            <p className={styles.cardDate}>Submitted {v.createdAt}</p>
          </article>
        ))}
      </div>
    </Modal>
  );
}
