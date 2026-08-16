import { BadgeCheck, ShieldAlert, ShieldCheck } from "lucide-react";
import type { StudentSanctionItem } from "./types";
import styles from "./student-card.module.css";

type StudentSanctionsProps = {
  sanctions: StudentSanctionItem[];
  openCount: number;
};

export function StudentSanctions({ sanctions, openCount }: StudentSanctionsProps) {
  const clean = openCount === 0;
  return (
    <section id="sanctions" className={styles.card}>
      <div className={styles.cardHead}>
        <h3 className={styles.cardTitle}>
          <ShieldCheck size={16} className={clean ? styles.iconGreen : styles.iconAmber} />
          My Sanctions
        </h3>
        <span className={clean ? styles.badgeGreen : styles.badgeAmber}>
          {clean ? "Clean" : `${openCount} open`}
        </span>
      </div>

      {clean ? (
        <>
          <p className={styles.text}>
            You have no active sanctions. Keep your attendance above the threshold to stay
            in good standing.
          </p>
          <div className={styles.statusRow}>
            <BadgeCheck size={16} />
            <span>No sanctions on record</span>
          </div>
        </>
      ) : (
        <div className={styles.list}>
          {sanctions.map((s) => (
            <div key={s.id} className={styles.row}>
              <span className={styles.rowIconAmber}>
                <ShieldAlert size={14} />
              </span>
              <div className={styles.rowBody}>
                <span className={styles.rowTitle}>{s.title}</span>
                <span className={styles.rowMeta}>{s.issuedAt}</span>
                {s.requirement ? (
                  <span className={styles.rowHint}>{s.requirement}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}