"use client";

import { isValidElement, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, GraduationCap, Menu, Search, X } from "lucide-react";
import { MAIN_NAV, SYSTEM_NAV } from "@/lib/constants/dashboard";
import { savePersistedView, saveViewSnapshot } from "@/lib/view-store";
import { UserMenu } from "./user-menu";
import styles from "./admin-shell.module.css";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type AdminShellProps = {
  userName: string;
  roleLabel: string;
  isSuperAdmin?: boolean;
  children: React.ReactNode;
  snapshot?: boolean;
};

export function AdminShell({
  userName,
  roleLabel,
  isSuperAdmin = false,
  children,
  snapshot = true,
}: AdminShellProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!snapshot) return;
    saveViewSnapshot(pathname, {
      view: children,
      userName,
      roleLabel,
      isSuperAdmin,
    });
    if (isValidElement(children) && typeof children.props === "object" && children.props !== null) {
      savePersistedView(pathname, {
        props: children.props as Record<string, unknown>,
        userName,
        roleLabel,
        isSuperAdmin,
      });
    }
  }, [pathname, children, userName, roleLabel, isSuperAdmin, snapshot]);

  const canManagePrograms = isSuperAdmin || roleLabel === "Super Admin";

  const isActive = (href: string) =>
    href !== "#" && (pathname === href || pathname.startsWith(`${href}/`));

  return (
    <div className={styles.shell}>
      {open && <div className={styles.backdrop} onClick={() => setOpen(false)} />}

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarBrand}>
          <span className={styles.brandLogo}>
            <GraduationCap size={14} />
          </span>
          <span className={styles.brandName}>FHUSOCOM</span>
          <button
            type="button"
            className={styles.sidebarClose}
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          <div className={styles.navSection}>Main</div>
          {MAIN_NAV.map((item) => {
            const Icon = item.icon;
            const active = item.active ?? isActive(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={active ? styles.navLinkActive : styles.navLink}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className={styles.navSection}>System</div>
          {SYSTEM_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href} className={styles.navLink}>
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userChip}>
            <span className={styles.userAvatar}>{initials(userName)}</span>
            <span className={styles.userMeta}>
              <span className={styles.userName}>{userName}</span>
              <span className={styles.userRole}>{roleLabel}</span>
            </span>
          </div>
        </div>
      </aside>

      <div className={styles.content}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              type="button"
              className={styles.menuBtn}
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <span className={styles.crumbRoot}>FHUSOCOM Admin</span>
            <span className={styles.crumbSep}>/</span>
            <span className={styles.crumbCurrent}>Dashboard</span>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.search}>
              <Search size={14} />
              <input type="text" placeholder="Search..." className={styles.searchInput} />
            </div>
            <button type="button" className={styles.iconBtn} title="Notifications">
              <Bell size={16} />
              <span className={styles.bellDot} />
            </button>
            <span className={styles.divider} />
            <UserMenu userName={userName} roleLabel={roleLabel} isSuperAdmin={canManagePrograms} />
          </div>
        </header>

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
