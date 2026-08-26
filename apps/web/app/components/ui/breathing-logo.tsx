import styles from "./breathing-logo.module.css";

export function BreathingLogo({
  size = 56,
  alt = "Liberalis-Tracker",
  className,
}: {
  size?: number;
  alt?: string;
  className?: string;
}) {
  return (
    <img
      src="/logo-favicon.png"
      alt={alt}
      width={size}
      height={size}
      className={`${styles.breathing} ${className ?? ""}`}
    />
  );
}
