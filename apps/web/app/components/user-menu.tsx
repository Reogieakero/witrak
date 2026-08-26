"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarRange, Check, Eye, EyeOff, GraduationCap, Key, LogOut, Monitor, Moon, Sun, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { signOut, updatePassword } from "@/lib/auth-client";
import { useTheme } from "./theme-provider";
import type { Theme } from "./theme-provider";
import { ProgramManager } from "./program-manager";
import { TermManager } from "./term-manager";
import { Modal } from "./ui/modal";
import { ModalActions } from "./ui/modal-actions";
import { Button } from "./ui/button";
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
  logoutHref?: string;
  avatarUrl?: string | null;
  onProfile?: () => void;
};

export function UserMenu({
  userName,
  roleLabel,
  isSuperAdmin = false,
  logoutHref = "/login/officers",
  avatarUrl,
  onProfile,
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [programsOpen, setProgramsOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    setPasswordBusy(true);
    const result = await updatePassword(newPassword);
    setPasswordBusy(false);
    if (result.ok) {
      setPasswordModalOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPasswordError(result.error ?? "Failed to change password");
    }
  };

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
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className={styles.avatarImg} />
          ) : (
            <User size={16} />
          )}
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

          {onProfile && (
            <>
              <div className={styles.divider} />
              <button
                type="button"
                className={styles.themeItem}
                onClick={() => {
                  setOpen(false);
                  onProfile();
                }}
                role="menuitem"
              >
                <User size={15} className={styles.themeIcon} />
                <span className={styles.themeLabel}>My Profile</span>
              </button>
            </>
          )}

          <div className={styles.divider} />
          <button
            type="button"
            className={styles.themeItem}
            onClick={() => {
              setOpen(false);
              setPasswordModalOpen(true);
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
              setPasswordError("");
            }}
            role="menuitem"
          >
            <Key size={15} className={styles.themeIcon} />
            <span className={styles.themeLabel}>Change Password</span>
          </button>

          <div className={styles.divider} />

          <button
            type="button"
            className={styles.logout}
            onClick={async () => {
              await signOut();
              window.location.href = logoutHref;
            }}
          >
            <LogOut size={15} />
            Log out
          </button>
        </div>
      )}

      <ProgramManager open={programsOpen} onClose={() => setProgramsOpen(false)} />
      <TermManager open={termsOpen} onClose={() => setTermsOpen(false)} />
      <Modal open={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} title="Change Password">
        <form id="password-form" onSubmit={handleChangePassword} className={styles.passwordForm}>
          <div className={styles.formGroup}>
            <label htmlFor="currentPassword" className={styles.formLabel}>
              Current Password
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={styles.formInput}
              autoComplete="current-password"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="newPassword" className={styles.formLabel}>
              New Password
            </label>
            <div className={styles.passwordField}>
              <input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={styles.formInput}
                autoComplete="new-password"
                required
                minLength={8}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowNewPassword((v) => !v)}
                aria-label={showNewPassword ? "Hide new password" : "Show new password"}
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.formLabel}>
              Confirm New Password
            </label>
            <div className={styles.passwordField}>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.formInput}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {passwordError && <p className={styles.formError}>{passwordError}</p>}
          <ModalActions
            confirmForm="password-form"
            confirmLabel="Save"
            confirmType="submit"
            onCancel={() => setPasswordModalOpen(false)}
            disabled={passwordBusy}
          />
        </form>
      </Modal>
    </div>
  );
}