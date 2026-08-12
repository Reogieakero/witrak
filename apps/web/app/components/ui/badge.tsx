import styles from "./badge.module.css";

type BadgeTone = "brand" | "amber" | "red" | "green" | "gray" | "violet";

type BadgeProps = {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
};

export function Badge({ tone = "brand", className = "", children }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[tone]}${className ? ` ${className}` : ""}`}>
      {children}
    </span>
  );
}