"use client";

import { Megaphone, CalendarCheck2, Users } from "lucide-react";
import { Tooltip } from "@/app/components/ui/tooltip";
import type { AnnouncementsStatsGridProps } from "./types";
import styles from "./announcements-stats.module.css";

export function AnnouncementsStatsGrid({ stats }: AnnouncementsStatsGridProps) {
  return (
    <div className={styles.statGrid}>
      <Tooltip content="All announcements published this term." className={styles.statTooltip}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Announcements</div>
          <div className={styles.statSub}>published this term</div>
          <div className={styles.statIcon}>
            <Megaphone size={18} />
          </div>
        </div>
      </Tooltip>

      <Tooltip content="Announcements published in the last 7 days." className={styles.statTooltip}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.thisWeek}</div>
          <div className={styles.statLabel}>This Week</div>
          <div className={styles.statSub}>last 7 days</div>
          <div className={styles.statIcon}>
            <CalendarCheck2 size={18} />
          </div>
        </div>
      </Tooltip>

      <Tooltip content="Distinct officers who published announcements." className={styles.statTooltip}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.authors}</div>
          <div className={styles.statLabel}>Publishers</div>
          <div className={styles.statSub}>distinct authors</div>
          <div className={styles.statIcon}>
            <Users size={18} />
          </div>
        </div>
      </Tooltip>
    </div>
  );
}
