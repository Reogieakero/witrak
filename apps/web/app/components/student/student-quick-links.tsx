"use client";

import Link from "next/link";
import { CalendarPlus, Upload, UserCheck } from "lucide-react";
import styles from "./student-quick-links.module.css";
import { useEventsModal } from "./events-modal-context";

export function StudentQuickLinks() {
  const { openEvents } = useEventsModal();

  return (
    <section className={styles.card}>
      <h3 className={styles.title}>Quick Links</h3>
      <div className={styles.grid}>
        <button
          type="button"
          className={styles.tile}
          onClick={openEvents}
        >
          <span className={styles.tileIcon}>
            <CalendarPlus size={14} />
          </span>
          <span className={styles.tileMeta}>
            <span className={styles.tileLabel}>Upcoming Events</span>
            <span className={styles.tileSub}>Schedule & details</span>
          </span>
        </button>
        <Link href="/dashboard/fees" className={styles.tile}>
          <span className={styles.tileIcon}>
            <Upload size={14} />
          </span>
          <span className={styles.tileMeta}>
            <span className={styles.tileLabel}>Upload Fee Proof</span>
            <span className={styles.tileSub}>Submit payment</span>
          </span>
        </Link>
        <Link href="/dashboard#attendance" className={styles.tile}>
          <span className={styles.tileIcon}>
            <UserCheck size={14} />
          </span>
          <span className={styles.tileMeta}>
            <span className={styles.tileLabel}>My Attendance</span>
            <span className={styles.tileSub}>View history</span>
          </span>
        </Link>
      </div>
    </section>
  );
}