"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Megaphone,
  CalendarDays,
  UserCheck,
  FileText,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useEventsModal } from "./events-modal-context";
import styles from "./student-mobile-nav.module.css";

type NavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  target?: string;
  href?: string;
  modal?: boolean;
};

const ITEMS: NavItem[] = [
  { key: "home", label: "Home", icon: Home },
  { key: "announcements", label: "News", icon: Megaphone, target: "section-announcements" },
  { key: "events", label: "Events", icon: CalendarDays, target: "section-events", modal: true },
  { key: "attendance", label: "Attendance", icon: UserCheck, target: "section-attendance" },
  { key: "transparency", label: "Docs", icon: FileText, target: "section-transparency" },
  { key: "fees", label: "Fees", icon: Wallet, href: "/dashboard/fees" },
];

export function StudentMobileNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { openEvents } = useEventsModal();
  const [active, setActive] = useState("home");

  const go = (item: NavItem) => {
    if (item.modal) {
      if (pathname === "/dashboard") {
        openEvents();
      } else {
        router.push("/dashboard");
      }
      setActive(item.key);
      return;
    }
    if (item.href) {
      router.push(item.href);
      return;
    }
    if (item.target) {
      const el = document.getElementById(item.target);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setActive(item.key);
        return;
      }
      if (pathname !== "/dashboard") router.push("/dashboard");
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    setActive("home");
  };

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY < 80) setActive("home");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = ITEMS.map((i) => i.target)
      .filter(Boolean)
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0];
        if (top) {
          const key = ITEMS.find((i) => i.target === top.target.id)?.key;
          if (key) setActive(key);
        }
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <nav className={styles.nav} aria-label="Student navigation">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.key;
        return (
          <button
            key={item.key}
            type="button"
            className={`${styles.item} ${isActive ? styles.active : ""}`}
            onClick={() => go(item)}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon size={20} className={styles.icon} />
            <span className={styles.label}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
