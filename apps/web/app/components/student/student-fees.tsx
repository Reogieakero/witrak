import { CheckCircle, Clock, HandCoins, Upload } from "lucide-react";
import type { StudentFeeItem } from "./types";
import { Button } from "@/app/components/ui/button";
import styles from "./student-card.module.css";

type StudentFeesProps = {
  fees: StudentFeeItem[];
};

function toneFor(status: StudentFeeItem["status"]): string {
  if (status === "PAID") return styles.rowIconGreen;
  if (status === "PENDING" || status === "REJECTED") return styles.rowIconAmber;
  return styles.rowIconGray;
}

function labelFor(status: StudentFeeItem["status"]): string {
  if (status === "PAID") return "Paid";
  if (status === "PENDING") return "Pending";
  if (status === "REJECTED") return "Rejected";
  return "Unpaid";
}

function labelToneFor(status: StudentFeeItem["status"]): string {
  if (status === "PAID") return styles.badgeGreen;
  if (status === "PENDING" || status === "REJECTED") return styles.badgeAmber;
  return styles.badgeGray;
}

function iconFor(status: StudentFeeItem["status"]): React.ReactNode {
  if (status === "PAID") return <CheckCircle size={14} />;
  if (status === "PENDING" || status === "REJECTED") return <Clock size={14} />;
  return <HandCoins size={14} />;
}

export function StudentFees({ fees }: StudentFeesProps) {
  return (
    <section id="fees" className={styles.card}>
      <div className={styles.cardHead}>
        <h3 className={styles.cardTitle}>
          <HandCoins size={16} className={styles.iconBrand} />
          My Fees
        </h3>
        <a href="/dashboard/fees" className={styles.link}>
          Manage
        </a>
      </div>

      <div className={styles.feesList}>
        {fees.length === 0 && <p className={styles.text}>No fees posted yet.</p>}
        {fees.map((f) => (
          <div key={f.id} className={styles.row}>
            <span className={`${styles.rowIcon} ${toneFor(f.status)}`}>
              {iconFor(f.status)}
            </span>
            <div className={styles.rowBody}>
              <span className={styles.rowTitle}>{f.title}</span>
              <span className={styles.rowMeta}>
                {f.amount} · Due {f.dueDate}
              </span>
            </div>
            <span className={`${styles.badge} ${labelToneFor(f.status)}`}>
              {labelFor(f.status)}
            </span>
          </div>
        ))}
      </div>

      <Button href="/dashboard/fees" className={styles.uploadBtn}>
        <Upload size={16} />
        Upload Proof of Payment
      </Button>
    </section>
  );
}