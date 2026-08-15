import type { CSSProperties } from "react";
import styles from "./skeleton.module.css";

type SkeletonProps = {
  width?: string | number;
  height?: string | number;
  radius?: string | number;
  className?: string;
  style?: CSSProperties;
};

export function Skeleton({
  width,
  height,
  radius,
  className,
  style,
}: SkeletonProps) {
  return (
    <span
      className={`${styles.skeleton} ${className ?? ""}`}
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonRows({
  rows = 8,
  columns = 6,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <table className={styles.skeletonTable}>
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r}>
            {Array.from({ length: columns }).map((_, c) => (
              <td key={c} className={c === 0 ? styles.skeletonFirst : undefined}>
                <Skeleton height={14} width={c === 0 ? "70%" : "55%"} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
