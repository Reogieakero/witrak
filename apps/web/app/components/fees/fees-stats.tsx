"use client";

import { Banknote, CheckCheck, FileClock, FileX2 } from "lucide-react";
import { Tooltip } from "@/app/components/ui/tooltip";
import type { FeesStatsGridProps } from "./types";
import styles from "./fees-stats.module.css";

export function FeesStatsGrid({ stats }: FeesStatsGridProps) {
  return (
    <div className={styles.statGrid}>
      <Tooltip
        content="Total amount if every student pays every posted fee this term."
        className={styles.statTooltip}
      >
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.target}</div>
          <div className={styles.statLabel}>Fee Target</div>
          <div className={styles.statSub}>{stats.feeCount} fees active</div>
          <div className={styles.statIcon}>
            <Banknote size={18} />
          </div>
        </div>
      </Tooltip>

      <Tooltip
        content="Amount collected from verified proofs this term."
        className={styles.statTooltip}
      >
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.collected}</div>
          <div className={styles.statLabel}>Collected</div>
          <div className={styles.statSubAccent}>{stats.collectedPct}% of target</div>
          <div className={styles.statIcon}>
            <CheckCheck size={18} />
          </div>
        </div>
      </Tooltip>

      <Tooltip
        content="Proofs of payment awaiting your verification."
        className={styles.statTooltip}
      >
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.pending}</div>
          <div className={styles.statLabel}>Pending Proofs</div>
          <div className={styles.statSub}>awaiting verification</div>
          <div className={styles.statIcon}>
            <FileClock size={18} />
          </div>
        </div>
      </Tooltip>

      <Tooltip
        content="Proofs rejected with a reason this term."
        className={styles.statTooltip}
      >
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.rejected}</div>
          <div className={styles.statLabel}>Rejected</div>
          <div className={styles.statSub}>with reason given</div>
          <div className={styles.statIcon}>
            <FileX2 size={18} />
          </div>
        </div>
      </Tooltip>
    </div>
  );
}