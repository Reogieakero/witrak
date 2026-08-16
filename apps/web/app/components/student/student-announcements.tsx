"use client";

import { useState } from "react";
import { CalendarCheck2, HandCoins, Megaphone, ShieldAlert } from "lucide-react";
import type { StudentAnnouncementItem } from "./types";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Modal } from "@/app/components/ui/modal";
import base from "./student-feed.module.css";
import styles from "./student-announcements.module.css";

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
  const [selected, setSelected] = useState<StudentAnnouncementItem | null>(null);

  return (
    <section id="announcements" className={base.card}>
      <header className={base.header}>
        <div className={base.heading}>
          <span className={base.headingIcon}>
            <Megaphone size={16} />
          </span>
          <div>
            <h3 className={base.title}>Announcements</h3>
            <p className={base.subtitle}>Latest news from the student government</p>
          </div>
        </div>
        <Badge tone="brand">{announcements.length > 0 ? `${announcements.length} recent` : "No news"}</Badge>
      </header>

      <div className={base.feed}>
        {announcements.length === 0 && (
          <p className={base.empty}>No announcements yet.</p>
        )}
        {announcements.map((a) => (
          <button
            key={a.id}
            type="button"
            className={base.feedItem}
            onClick={() => setSelected(a)}
            aria-label={`View announcement: ${a.title}`}
          >
            <span className={base.feedIcon}>{iconFor(a.title)}</span>
            <div className={base.feedBody}>
              <span className={base.feedTitle}>{a.title}</span>
              <p className={base.feedText}>{a.body}</p>
              <div className={base.feedMeta}>
                <Badge tone={toneFor(a.title)}>Update</Badge>
                <span className={base.feedDate}>{a.createdAt}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={
          <span className={styles.modalTitle}>
            <span className={styles.modalTitleIcon}>
              {selected ? iconFor(selected.title) : <Megaphone size={16} />}
            </span>
            <span>Announcement</span>
          </span>
        }
        footer={
          <div className={styles.modalFooter}>
            <Button type="button" variant="secondary" size="sm" onClick={() => setSelected(null)}>
              Close
            </Button>
          </div>
        }
      >
        {selected && (
          <div className={styles.article}>
            <span className={styles.articleBadge}>
              <Badge tone={toneFor(selected.title)}>Update</Badge>
            </span>
            <h4 className={styles.articleTitle}>{selected.title}</h4>
            <div className={styles.articleMeta}>
              <span>{selected.createdAt}</span>
              <span className={styles.metaDot}>·</span>
              <span>by {selected.authorName}</span>
            </div>
            <div className={styles.articleBody}>{selected.body}</div>
          </div>
        )}
      </Modal>
    </section>
  );
}