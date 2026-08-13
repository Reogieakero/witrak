"use client";

import { ShieldAlert, CheckCheck, Scale } from "lucide-react";
import { Tooltip } from "@/app/components/ui/tooltip";
import type { SanctionsStatsGridProps } from "./types";
import styles from "./sanctions-stats.module.css";

export function SanctionsStatsGrid({ stats }: SanctionsStatsGridProps) {
  return (
    <div className={styles.statGrid}>
      <Tooltip
        content="Sanctions currently open that still need action."
        className={styles.statTooltip}
      >
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.activeSanctions}</div>
          <div className={styles.statLabel}>Active Sanctions</div>
          <div className={styles.statSub}>open status</div>
          <div className={styles.statIcon}>
            <ShieldAlert size={18} />
          </div>
        </div>
      </Tooltip>

      <Tooltip
        content="Sanctions cleared once the student fulfilled the requirement."
        className={styles.statTooltip}
      >
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.resolved}</div>
          <div className={styles.statLabel}>Cleared</div>
          <div className={styles.statSub}>this term</div>
          <div className={styles.statIcon}>
            <CheckCheck size={18} />
          </div>
        </div>
      </Tooltip>

      <Tooltip
        content="All sanctions issued this term."
        className={styles.statTooltip}
      >
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Total Issued</div>
          <div className={styles.statSub}>this term</div>
          <div className={styles.statIcon}>
            <Scale size={18} />
          </div>
        </div>
      </Tooltip>
    </div>
  );
}