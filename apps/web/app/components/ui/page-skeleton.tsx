import { Skeleton, SkeletonRows } from "./skeleton";
import styles from "./page-skeleton.module.css";

export type PageSkeletonProps = {
  titleWidth?: string | number;
  statCards?: number;
  rows?: number;
  columns?: number;
};

export function PageSkeleton({
  titleWidth = "38%",
  statCards = 4,
  rows = 8,
  columns = 5,
}: PageSkeletonProps) {
  return (
    <div className={styles.wrap} aria-busy="true" aria-label="Loading content">
      <div className={styles.head}>
        <Skeleton height={28} width={titleWidth} />
        <Skeleton height={38} width={124} radius={10} />
      </div>

      <div className={styles.stats}>
        {Array.from({ length: statCards }).map((_, i) => (
          <div key={i} className={styles.statCard}>
            <Skeleton height={20} width={20} radius={6} />
            <Skeleton height={26} width="55%" />
            <Skeleton height={12} width="70%" />
            <Skeleton height={10} width="45%" />
          </div>
        ))}
      </div>

      <div className={styles.body}>
        <SkeletonRows rows={rows} columns={columns} />
      </div>
    </div>
  );
}
