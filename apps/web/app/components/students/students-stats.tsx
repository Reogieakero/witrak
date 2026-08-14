"use client";

import { GraduationCap, CircleCheck, Ban, Layers } from "lucide-react";
import { Tooltip } from "@/app/components/ui/tooltip";
import type { StudentStats as StudentStatsType } from "./types";
import styles from "./students-stats.module.css";

export function StudentsStatsGrid({ stats }: { stats: StudentStatsType }) {
  return (
    <div className={styles.statGrid}>
      <Tooltip
        content="Students with a system account this term."
        className={styles.statTooltip}
      >
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Student Accounts</div>
          <div className={styles.statSub}>with login access</div>
          <div className={styles.statIcon}>
            <GraduationCap size={18} />
          </div>
        </div>
      </Tooltip>

      <Tooltip
        content="Accounts that can currently sign in."
        className={styles.statTooltip}
      >
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.active}</div>
          <div className={styles.statLabel}>Active</div>
          <div className={styles.statSub}>can sign in</div>
          <div className={styles.statIcon}>
            <CircleCheck size={18} />
          </div>
        </div>
      </Tooltip>

      <Tooltip
        content="Accounts blocked until reinstated."
        className={styles.statTooltip}
      >
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.suspended}</div>
          <div className={styles.statLabel}>Suspended</div>
          <div className={styles.statSub}>until reinstated</div>
          <div className={styles.statIcon}>
            <Ban size={18} />
          </div>
        </div>
      </Tooltip>

      <Tooltip
        content="Distinct programs represented."
        className={styles.statTooltip}
      >
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.programs}</div>
          <div className={styles.statLabel}>Programs</div>
          <div className={styles.statSub}>across the faculty</div>
          <div className={styles.statIcon}>
            <Layers size={18} />
          </div>
        </div>
      </Tooltip>
    </div>
  );
}