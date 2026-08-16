"use client";

import { SlidersHorizontal, ShieldCheck, ExternalLink } from "lucide-react";
import type { SanctionFineRow } from "./types";
import styles from "./sanctions-sidebar.module.css";

export function SanctionsSidebar({ fines }: { fines: SanctionFineRow[] }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.card}>
        <div className={styles.cardHead}>
          <h3 className={styles.cardTitle}>
            <SlidersHorizontal size={16} />
            Absence Requirements
          </h3>
          <span className={styles.cardCount}>{fines.length}</span>
        </div>

        <div className={styles.list}>
          {fines.length === 0 && (
            <p className={styles.empty}>No requirements defined yet.</p>
          )}
          {fines.map((f) => (
            <div key={f.absenceCount} className={styles.item}>
              <div className={styles.ruleHead}>
                <span className={styles.ruleBadge}>
                  {f.absenceCount} {f.absenceCount === 1 ? "absence" : "absences"}
                </span>
              </div>
              <span className={styles.ruleScope}>{f.title}</span>
              <span className={styles.policyText}>{f.description}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={`${styles.card} ${styles.policyCard}`}>
        <div className={styles.cardHead}>
          <h3 className={styles.cardTitle}>
            <ShieldCheck size={16} />
            Sanction Policy
          </h3>
        </div>
        <p className={styles.policyText}>
          When a student reaches an absence count, a sanction is issued automatically
          and tied to the requirement for that count. The supreme clears it
          once the student meets the requirement. Only the admin, the Discipline
          Officer, and the student involved can see these records.
        </p>
        <div className={styles.policyFooter}>
          <span>Edit via Sanction Fines</span>
          <ExternalLink size={12} />
        </div>
      </div>
    </aside>
  );
}
