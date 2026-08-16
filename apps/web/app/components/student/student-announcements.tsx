import { CalendarCheck2, HandCoins, Megaphone, ShieldAlert } from "lucide-react";
import type { StudentAnnouncementItem } from "./types";
import { Badge } from "@/app/components/ui/badge";
import styles from "./student-feed.module.css";

function toneFor(title: string): "brand" | "amber" | "green" | "red" {
  const t = title.toLowerCase();
  if (t.includes("fee") || t.includes("payment")) return "amber";
  if (t.includes("sanction") || t.includes("policy") || t.includes("attendance")) return "red";
  if (t.includes("event") || t.includes("schedule") || t.includes("intramural")) return "brand";
  return "brand";
}

function iconFor(title: string): React.ReactNode {
  const t = title.toLowerCase();
  if (t.includes("fee") || t.includes("payment")) return <HandCoins size={14} />;
  if (t.includes("sanction") || t.includes("policy") || t.includes("attendance"))
    return <ShieldAlert size={14} />;
  return <CalendarCheck2 size={14} />;
}

type StudentAnnouncementsProps = {
  announcements: StudentAnnouncementItem[];
};

export function StudentAnnouncements({ announcements }: StudentAnnouncementsProps) {
  return (
    <section id="announcements" className={styles.card}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <span className={styles.headingIcon}>
            <Megaphone size={16} />
          </span>
          <div>
            <h3 className={styles.title}>Announcements</h3>
            <p className={styles.subtitle}>Latest news from the student government</p>
          </div>
        </div>
        <Badge tone="brand">{announcements.length > 0 ? `${announcements.length} recent` : "No news"}</Badge>
      </header>

      <div className={styles.feed}>
        {announcements.length === 0 && (
          <p className={styles.empty}>No announcements yet.</p>
        )}
        {announcements.map((a) => (
          <div key={a.id} className={styles.feedItem}>
            <span className={styles.feedIcon}>{iconFor(a.title)}</span>
            <div className={styles.feedBody}>
              <span className={styles.feedTitle}>{a.title}</span>
              <p className={styles.feedText}>{a.body}</p>
              <div className={styles.feedMeta}>
                <Badge tone={toneFor(a.title)}>Update</Badge>
                <span className={styles.feedDate}>{a.createdAt}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}