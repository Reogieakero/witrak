import styles from "./card.module.css";

type CardProps = {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

export function Card({
  title,
  subtitle,
  icon,
  action,
  className = "",
  children,
}: CardProps) {
  const header = title || action ? (
    <header className={styles.header}>
      <div className={styles.heading}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <div>
          {title && <h2 className={styles.title}>{title}</h2>}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </header>
  ) : null;

  return (
    <section className={`${styles.card} ${className}`}>
      {header}
      {children}
    </section>
  );
}
