"use client";

import { ScrollText, CalendarCheck, UserCog, Bot } from "lucide-react";
import { Tooltip } from "@/app/components/ui/tooltip";
import type { AuditStats as AuditStatsType } from "./types";
import styles from "./audit-log-stats.module.css";

export function AuditLogStatsGrid({ stats }: { stats: AuditStatsType }) {
  return (
    <div className={styles.statGrid}>
      <Tooltip
        content="All logged entries shown for this view."
        className={styles.statTooltip}
      >
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Logged entries</div>
          <div className={styles.statSub}>in this view</div>
          <div className={styles.statIcon} data-tone="brand">
            <ScrollText size={18} />
          </div>
        </div>
      </Tooltip>

      <Tooltip
        content="Entries recorded in the last 7 days."
        className={styles.statTooltip}
      >
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.thisWeek}</div>
          <div className={styles.statLabel}>This week</div>
          <div className={styles.statSub}>last 7 days</div>
          <div className={styles.statIcon} data-tone="green">
            <CalendarCheck size={18} />
          </div>
        </div>
      </Tooltip>

      <Tooltip
        content="Distinct officers or system actors that wrote entries."
        className={styles.statTooltip}
      >
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.actors}</div>
          <div className={styles.statLabel}>Distinct actors</div>
          <div className={styles.statSub}>officers &amp; system</div>
          <div className={styles.statIcon} data-tone="violet">
            <UserCog size={18} />
          </div>
        </div>
      </Tooltip>

      <Tooltip
        content="Auto-issued entries where no officer was the actor."
        className={styles.statTooltip}
      >
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.systemIssued}</div>
          <div className={styles.statLabel}>System-issued</div>
          <div className={styles.statSub}>auto sanctions &amp; flags</div>
          <div className={styles.statIcon} data-tone="amber">
            <Bot size={18} />
          </div>
        </div>
      </Tooltip>
    </div>
  );
}