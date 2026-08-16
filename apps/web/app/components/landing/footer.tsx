import Link from "next/link";
import styles from "./footer.module.css";

const PRODUCT = [
  { href: "#features", label: "Features" },
  { href: "#roles", label: "Roles" },
  { href: "#workflow", label: "Workflow" },
  { href: "#security", label: "Security" },
];

const RESOURCES = [
  { href: "#faq", label: "FAQ" },
  { href: "/docs", label: "API docs" },
  { href: "/login/students", label: "Sign in" },
];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandCol}>
          <span className={styles.brand}>
            <span className={styles.logo}>
              <img src="/logo-favicon.png" alt="Liberalis" />
            </span>
            Liberalis
          </span>
          <p className={styles.desc}>
            Student Government Management System — built for transparency and
            accountability.
          </p>
        </div>

        <div className={styles.col}>
          <span className={styles.colTitle}>Product</span>
          {PRODUCT.map((l) => (
            <a key={l.href} href={l.href} className={styles.link}>
              {l.label}
            </a>
          ))}
        </div>

        <div className={styles.col}>
          <span className={styles.colTitle}>Resources</span>
          {RESOURCES.map((l) =>
            l.href.startsWith("/") ? (
              <Link key={l.href} href={l.href} className={styles.link}>
                {l.label}
              </Link>
            ) : (
              <a key={l.href} href={l.href} className={styles.link}>
                {l.label}
              </a>
            ),
          )}
        </div>
      </div>
      <div className={styles.bottom}>
        © {new Date().getFullYear()} Liberalis. All rights reserved.
      </div>
    </footer>
  );
}
