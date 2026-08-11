"use client";

import { useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Landmark,
  QrCode,
  ScrollText,
} from "lucide-react";
import shared from "./landing.module.css";
import styles from "./feature-tabs.module.css";

type TabId = "attendance" | "events" | "fees" | "transparency";

const TABS: { id: TabId; label: string; icon: typeof QrCode }[] = [
  { id: "attendance", label: "Attendance", icon: QrCode },
  { id: "events", label: "Events", icon: CalendarDays },
  { id: "fees", label: "Fees", icon: Landmark },
  { id: "transparency", label: "Transparency", icon: ScrollText },
];

const PANELS: Record<
  TabId,
  {
    heading: string;
    bullets: string[];
    mock: { label: string; value: string; tag: string };
  }
> = {
  attendance: {
    heading: "Attendance without the attendance sheet",
    bullets: [
      "Officers scan member QR codes at the door — no paper lists",
      "Absences roll up per student, per section, per period",
      "Attendance rate recalculates in real time as data is entered",
    ],
    mock: {
      label: "Grade 3 · Section A · Aug 12",
      value: "38 / 40 present",
      tag: "94.5% rate",
    },
  },
  events: {
    heading: "Events that run themselves",
    bullets: [
      "Create an event, choose optional attendance, and publish in one step",
      "Members see upcoming events the moment they're announced",
      "Officers get a check-in list generated from the event roster",
    ],
    mock: {
      label: "Founding Day · Aug 28 · 3:00 PM",
      value: "5 RSVPs needed",
      tag: "Attendance open",
    },
  },
  fees: {
    heading: "Fees with proof, not promises",
    bullets: [
      "Officers publish dues with a clear amount and deadline",
      "Members submit proof of payment directly in the portal",
      "The treasurer verifies each submission — the status is on record",
    ],
    mock: {
      label: "Semester dues · ₱150",
      value: "12 awaiting verification",
      tag: "Paid: 118",
    },
  },
  transparency: {
    heading: "Open books, no 'ask the treasurer'",
    bullets: [
      "Financial reports published as files every member can open",
      "Officers attach breakdowns, receipts, and disclosures",
      "Old reports stay accessible — the record is never lost",
    ],
    mock: {
      label: "Q1 financial report",
      value: "Published 2 days ago",
      tag: "Visible to all",
    },
  },
};

export function FeatureTabs() {
  const [active, setActive] = useState<TabId>("attendance");
  const panel = PANELS[active];

  return (
    <section className={styles.section}>
      <div className={shared.container}>
        <div className={shared.sectionHead}>
          <span className={shared.sectionTag}>A closer look</span>
          <h2 className={shared.sectionTitle}>How each module works</h2>
        </div>

        <div className={styles.tabs}>
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`${styles.tab} ${active === t.id ? styles.tabActive : ""}`}
              onClick={() => setActive(t.id)}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        <div className={styles.panel}>
          <div className={styles.copy}>
            <h3 className={styles.heading}>{panel.heading}</h3>
            <ul className={styles.list}>
              {panel.bullets.map((b) => (
                <li key={b} className={styles.bullet}>
                  <CheckCircle2 size={16} className={styles.check} />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.mock}>
            <div className={styles.mockHeader}>
              <span className={styles.mockTitle}>{panel.mock.label}</span>
              <span className={styles.mockTag}>{panel.mock.tag}</span>
            </div>
            <div className={styles.mockValue}>{panel.mock.value}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
