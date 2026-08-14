"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarRange, Check, GraduationCap, LogOut, Monitor, Moon, Sun, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTheme } from "./theme-provider";
import type { Theme } from "./theme-provider";
import { ProgramManager } from "./program-manager";
import { TermManager } from "./term-manager";
import styles from "./user-menu.module.css";

type ThemeOption = { value: Theme; label: string; icon: LucideIcon };

const THEME_OPTIONS: ThemeOption[] = [
  { value: "light", label: "Light mode", icon: Sun },
  { value: "dark", label: "Dark mode", icon: Moon },
  { value: "system", label: "System mode", icon: Monitor },
];

type UserMenuProps = {
  userName: string;
  roleLabel: string;
  isSuperAdmin?: boolean;
};

export function UserMenu({ userName, roleLabel, isSuperAdmin = false }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [programsOpen, setProgramsOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        type="button"
        className={styles.avatarBtn}
        onClick={() => setOpen((v) => !v)}
        aria-label="Open account menu"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={styles.avatarIcon}>
          <User size={16} />
        </span>
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          <div className={styles.menuUser}>
            <span className={styles.userName}>{userName}</span>
            <span className={styles.userRole}>{roleLabel}</span>
          </div>

          <div className={styles.sectionLabel}>Appearance</div>
          <div className={styles.themeGroup} role="group" aria-label="Appearance">
            {THEME_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.themeItem} ${active ? styles.themeItemActive : ""}`}
                  onClick={() => setTheme(opt.value)}
                  role="menuitemradio"
                  aria-checked={active}
                >
                  <Icon size={15} className={styles.themeIcon} />
                  <span className={styles.themeLabel}>{opt.label}</span>
                  {active && <Check size={14} className={styles.themeCheck} />}
                </button>
              );
            })}
          </div>

          {isSuperAdmin && (
            <>
              <div className={styles.divider} />
              <div className={styles.sectionLabel}>System</div>
              <button
                type="button"
                className={styles.themeItem}
                onClick={() => {
                  setOpen(false);
                  setProgramsOpen(true);
                }}
                role="menuitem"
              >
                <GraduationCap size={15} className={styles.themeIcon} />
                <span className={styles.themeLabel}>Programs &amp; Sections</span>
              </button>
              <button
                type="button"
                className={styles.themeItem}
                onClick={() => {
                  setOpen(false);
                  setTermsOpen(true);
                }}
                role="menuitem"
              >
                <CalendarRange size={15} className={styles.themeIcon} />
                <span className={styles.themeLabel}>Academic Terms</span>
              </button>
            </>
          )}

          <div className={styles.divider} />

          <button
            type="button"
            className={styles.logout}
            onClick={() => signOut({ redirectTo: "/login" })}
          >
            <LogOut size={15} />
            Log out
          </button>
        </div>
      )}

      <ProgramManager open={programsOpen} onClose={() => setProgramsOpen(false)} />
      <TermManager open={termsOpen} onClose={() => setTermsOpen(false)} />
    </div>
  );
}