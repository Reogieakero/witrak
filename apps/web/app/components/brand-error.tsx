"use client";

import Link from "next/link";
import styles from "./brand-error.module.css";

type BrandErrorAction = {
  label: string;
  href?: string;
  onClick?: () => void;
};

type BrandErrorProps = {
  code: string;
  title: string;
  message: string;
  primary: BrandErrorAction;
  secondary?: BrandErrorAction;
};

export function BrandError({
  code,
  title,
  message,
  primary,
  secondary,
}: BrandErrorProps) {
  const Primary =
    primary.href !== undefined ? (
      <Link href={primary.href} className={styles.primaryBtn}>
        {primary.label}
      </Link>
    ) : (
      <button
        type="button"
        className={styles.primaryBtn}
        onClick={primary.onClick}
      >
        {primary.label}
      </button>
    );

  const Secondary =
    secondary === undefined ? null : secondary.href !== undefined ? (
      <Link href={secondary.href} className={styles.secondaryBtn}>
        {secondary.label}
      </Link>
    ) : (
      <button
        type="button"
        className={styles.secondaryBtn}
        onClick={secondary.onClick}
      >
        {secondary.label}
      </button>
    );

  return (
    <main className={styles.wrap}>
      <div className={styles.blobA} />
      <div className={styles.blobB} />

      <div className={styles.card}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandLogo}>
            <img src="/logo-favicon.png" alt="Liberalis" />
          </span>
          <span className={styles.brandName}>Liberalis</span>
        </Link>

        <div className={styles.code}>{code}</div>

        <h1 className={styles.title}>{title}</h1>
        <p className={styles.message}>{message}</p>

        <div className={styles.actions}>
          {Primary}
          {Secondary}
        </div>
      </div>

      <p className={styles.footer}>
        &copy; {new Date().getFullYear()} Liberalis. Student Government
        Management System.
      </p>
    </main>
  );
}