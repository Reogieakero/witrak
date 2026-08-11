import styles from "./tooltip.module.css";

type TooltipProps = {
  content: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
  children: React.ReactNode;
};

export function Tooltip({ content, side = "top", className = "", children }: TooltipProps) {
  return (
    <span className={`${styles.wrap} ${className}`}>
      {children}
      <span className={`${styles.bubble} ${styles[side]}`} role="tooltip">
        {content}
      </span>
    </span>
  );
}
