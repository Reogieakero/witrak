import {
  CalendarDays,
  Landmark,
  Megaphone,
  QrCode,
  ScrollText,
  ShieldAlert,
} from "lucide-react";
import shared from "./landing.module.css";
import styles from "./features.module.css";

const FEATURES = [
  {
    icon: QrCode,
    title: "Daily Attendance",
    text: "Officers scan QR codes at check-in. Attendance rate is visible the same day.",
  },
  {
    icon: CalendarDays,
    title: "Events",
    text: "Create and publish events with built-in attendance tracking and reminders.",
  },
  {
    icon: Landmark,
    title: "Fees",
    text: "Publish dues, let members submit proof of payment, and verify manually.",
  },
  {
    icon: ScrollText,
    title: "Transparency",
    text: "Publish financial reports every member can review — no more 'ask the treasurer.'",
  },
  {
    icon: ShieldAlert,
    title: "Sanctions",
    text: "Private disciplinary records with a clear resolve and appeal workflow.",
  },
  {
    icon: Megaphone,
    title: "Announcements",
    text: "Broadcast updates to the whole organization from one clean channel.",
  },
];

export function Features() {
  return (
    <section id="features" className={styles.section}>
      <div className={shared.container}>
        <div className={shared.sectionHead}>
          <span className={shared.sectionTag}>Features</span>
          <h2 className={shared.sectionTitle}>
            Everything your council tracks, automated
          </h2>
          <p className={shared.sectionText}>
            Seven modules that replace the stack of spreadsheets, forms, and
            group chats — with records that stay current by default.
          </p>
        </div>
        <div className={styles.grid}>
          {FEATURES.map((f) => (
            <div key={f.title} className={styles.card}>
              <div className={styles.icon}>
                <f.icon size={20} />
              </div>
              <h3 className={styles.title}>{f.title}</h3>
              <p className={styles.text}>{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
