"use client";

import { useState } from "react";
import {
  Activity,
  BarChart3,
  Info,
  ShieldAlert,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Modal } from "@/app/components/ui/modal";
import styles from "./dashboard-info.module.css";

type Section = { icon: LucideIcon; title: string; text: string };

const SECTIONS: Section[] = [
  {
    icon: Users,
    title: "Stat Cards",
    text: "At-a-glance totals for students, officers, programs, and events, plus the current attendance rate, fee collection progress, and pending flags, role requests, and fee proofs.",
  },
  {
    icon: ShieldAlert,
    title: "Sanction Flags",
    text: "Students whose absence count crossed a configured threshold, shown here while they await review by the Discipline Officer.",
  },
  {
    icon: UserPlus,
    title: "Role Requests",
    text: "Pending Year/Program Rep applications that are waiting for scope assignment by a Super Admin.",
  },
  {
    icon: Zap,
    title: "Quick Actions",
    text: "Shortcuts to common officer tasks such as creating events, scanning attendance, and managing fees.",
  },
  {
    icon: BarChart3,
    title: "Attendance Analytics",
    text: "Three views: the event attendance trend (line chart), fee collection vs. target (donut chart), and per-course, per-year-level attendance performance (bar chart).",
  },
  {
    icon: Activity,
    title: "Recent Audit Activity",
    text: "An append-only log of officer actions, ordered newest first and paginated 10 entries per page.",
  },
];

export function DashboardInfo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={styles.infoButton}
        onClick={() => setOpen(true)}
        aria-label="About this dashboard"
        title="About this dashboard"
      >
        <Info size={16} />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="About this dashboard">
        <p className={styles.intro}>
          This dashboard gives officers and Super Admins a single view of the organization&apos;s
          operations. Here is what each section shows:
        </p>
        <ul className={styles.list}>
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.title} className={styles.item}>
                <span className={styles.itemIcon}>
                  <Icon size={15} />
                </span>
                <span className={styles.itemText}>
                  <span className={styles.itemTitle}>{s.title}</span>
                  <span className={styles.itemDesc}>{s.text}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </Modal>
    </>
  );
}
