"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import styles from "./navbar.module.css";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#roles", label: "Roles" },
  { href: "#workflow", label: "Workflow" },
  { href: "#security", label: "Security" },
  { href: "#faq", label: "FAQ" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.brand}>
          <span className={styles.logo}>
            <img src="/logo-favicon.png" alt="Liberalis" />
          </span>
          Liberalis
        </Link>

        <nav className={styles.links}>
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className={styles.link}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className={styles.actions}>
          <Link href="/login/students" className={styles.signIn}>
            Sign in
          </Link>
          <Button href="/login/students" size="sm" className={styles.headerCta}>
            Get started
          </Button>
          <button
            className={styles.menuToggle}
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className={styles.mobileMenu}>
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={styles.mobileLink}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <Button
            href="/login/students"
            className={styles.mobileCta}
            onClick={() => setOpen(false)}
          >
            Get started
          </Button>
        </nav>
      )}
    </header>
  );
}
