import { AlertTriangle } from "lucide-react";
import { initials, shortName, studentSectionLabel } from "@/lib/dashboard-utils";
import type { ScopedSection } from "@/lib/dashboard-utils";
import styles from "./sanction-flags.module.css";

export type SanctionFlag = {
  id: string;
  triggerCount: number;
  rule: { absenceThreshold: number };
  student: {
    firstName: string;
    lastName: string;
    section: ScopedSection | null;
  };
};

type SanctionFlagsProps = {
  count: number;
  threshold: number;
  flags: SanctionFlag[];
};

export function SanctionFlags({ count, threshold, flags }: SanctionFlagsProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h3 className={styles.panelTitle}>Sanction Flags</h3>
        <span className={styles.badgeRed}>
          {count} Flag{count === 1 ? "" : "s"}
        </span>
      </div>

      <div className={styles.panelBody}>
        {flags.length === 0 ? (
          <p className={styles.emptyText}>No open flags.</p>
        ) : (
          flags.map((flag) => (
            <div key={flag.id} className={styles.flagRow}>
              <span className={styles.flagAvatar}>
                {initials(`${flag.student.firstName} ${flag.student.lastName}`)}
              </span>
              <span className={styles.rowMeta}>
                <span className={styles.rowTitle}>
                  {shortName(flag.student.firstName, flag.student.lastName)}
                </span>
                <span className={styles.rowSub}>
                  {studentSectionLabel(flag.student)} · {flag.triggerCount} absences
                </span>
              </span>
              <AlertTriangle size={14} className={styles.flagIcon} />
            </div>
          ))
        )}
      </div>

      <div className={styles.panelFooter}>
        <span>Threshold: &gt;{threshold} absences</span>
        <span className={styles.panelLink}>View all</span>
      </div>
    </div>
  );
}
