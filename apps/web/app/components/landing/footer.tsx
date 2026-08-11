import Link from "next/link";
import { GraduationCap } from "lucide-react";
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
  { href: "/login", label: "Sign in" },
];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandCol}>
          <span className={styles.brand}>
            <span className={styles.logo}>
              <GraduationCap size={16} />
            </span>
            FHUSOCOM
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
        © {new Date().getFullYear()} FHUSOCOM. All rights reserved.
      </div>
    </footer>
  );
}
