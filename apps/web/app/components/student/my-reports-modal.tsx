"use client";

import { useState } from "react";
import { Calendar, FileText, HandCoins } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Modal } from "@/app/components/ui/modal";
import styles from "./my-reports-modal.module.css";

export type MyReportItem = {
  id: string;
  category: "ATTENDANCE" | "FEES";
  subject: string;
  description: string;
  status: string;
  resolutionNote: string | null;
  eventTitle: string | null;
  feeTitle: string | null;
  createdAt: string;
};

function statusTone(status: string): "green" | "brand" | "amber" | "gray" {
  if (status === "RESOLVED") return "green";
  if (status === "REVIEWED") return "brand";
  if (status === "PENDING") return "amber";
  return "gray";
}

/**
 * My Reports popup on the student home. Opens automatically every time the
 * home loads while the student has reports, so submitted reports and officer
 * verdicts (present / late / excused / absent / fees resolved) are never missed.
 */
export function MyReportsModal({ reports }: { reports: MyReportItem[] }) {
  const [open, setOpen] = useState(reports.length > 0);
  if (reports.length === 0) return null;

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title={
        <span className={styles.modalTitle}>
          <span className={styles.modalTitleIcon}>
            <FileText size={16} />
          </span>
          <span>My Reports</span>
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
        {reports.length === 1
          ? "You have 1 submitted report."
          : `You have ${reports.length} submitted reports.`}
      </p>
      <div className={styles.list}>
        {reports.map((r) => (
          <article key={r.id} className={styles.card}>
            <div className={styles.cardHead}>
              <Badge tone={r.category === "ATTENDANCE" ? "brand" : "violet"}>
                {r.category === "ATTENDANCE" ? "Attendance" : "Fees"}
              </Badge>
              <Badge tone={statusTone(r.status)}>{r.status}</Badge>
            </div>
            <h4 className={styles.cardSubject}>{r.subject}</h4>
            <p className={styles.cardDesc}>{r.description}</p>
            {r.eventTitle && (
              <p className={styles.cardRef}>
                <Calendar size={12} /> Event: {r.eventTitle}
              </p>
            )}
            {r.feeTitle && (
              <p className={styles.cardRef}>
                <HandCoins size={12} /> Fee: {r.feeTitle}
              </p>
            )}
            {r.resolutionNote ? (
              <p className={styles.cardNote}>{r.resolutionNote}</p>
            ) : (
              <p className={styles.cardNoteMuted}>Waiting for officer review.</p>
            )}
            <p className={styles.cardDate}>Submitted {r.createdAt}</p>
          </article>
        ))}
      </div>
    </Modal>
  );
}
