import styles from "./attendance-skeleton.module.css";

export function AttendanceSkeleton() {
  return (
    <div className={styles.wrap}>
      <div className={styles.statGrid}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={styles.statCard}>
            <div className={`${styles.skeleton} ${styles.skeletonValue}`} />
            <div className={`${styles.skeleton} ${styles.skeletonLabel}`} />
          </div>
        ))}
      </div>
      <div className={styles.listCard}>
        <div className={styles.listHead}>
          <div className={`${styles.skeleton} ${styles.skeletonToggle}`} />
          <div className={`${styles.skeleton} ${styles.skeletonFilters}`} />
        </div>
        <div className={styles.search}>
          <div className={`${styles.skeleton} ${styles.skeletonSearch}`} />
        </div>
        <div className={styles.rows}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.row}>
              <div className={`${styles.skeleton} ${styles.skeletonRowTitle}`} />
              <div className={`${styles.skeleton} ${styles.skeletonRowChip}`} />
              <div className={`${styles.skeleton} ${styles.skeletonRowBtn}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}