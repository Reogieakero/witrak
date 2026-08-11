import { QUICK_ACTIONS } from "@/lib/constants/dashboard";
import styles from "./quick-actions.module.css";

export function QuickActions() {
  return (
    <div className={styles.quickWrap}>
      <h3 className={styles.quickTitle}>Quick Actions</h3>
      <div className={styles.quickGrid}>
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <a key={action.label} href="#" className={styles.quickTile}>
              <span className={styles.quickIcon}>
                <Icon size={14} />
              </span>
              <span className={styles.quickMeta}>
                <span className={styles.quickLabel}>{action.label}</span>
                <span className={styles.quickSub}>{action.sub}</span>
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
