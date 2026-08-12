import Link from "next/link";
import styles from "./button.module.css";

type ButtonVariant = "primary" | "secondary" | "white" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "xl";

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
  children: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick">;

export function Button({
  variant = "primary",
  size = "md",
  href,
  className = "",
  onClick,
  children,
  ...rest
}: ButtonProps) {
  const classes = `${styles.button} ${styles[variant]} ${styles[size]}${
    className ? ` ${className}` : ""
  }`;

  if (href) {
    return (
      <Link href={href} className={classes} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} onClick={onClick} {...rest}>
      {children}
    </button>
  );
}
