"use client";

import { Users, CheckCircle2, Clock3, Layers } from "lucide-react";
import { Tooltip } from "@/app/components/ui/tooltip";
import type { MemberStats as MemberStatsType } from "./types";
import styles from "./members-stats.module.css";

export function MembersStatsGrid({ stats }: { stats: MemberStatsType }) {
  return (
    <div className={styles.statGrid}>
      <Tooltip
        content="All students in the directory this term."
        className={styles.statTooltip}
      >
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Members</div>
          <div className={styles.statSub}>enrolled this term</div>
          <div className={styles.statIcon}>
            <Users size={18} />
          </div>
        </div>
      </Tooltip>

      <Tooltip
        content="Students assigned to a section."
        className={styles.statTooltip}
      >
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.assigned}</div>
          <div className={styles.statLabel}>Assigned</div>
          <div className={styles.statSub}>have a section</div>
          <div className={styles.statIcon}>
            <CheckCircle2 size={18} />
          </div>
        </div>
      </Tooltip>

      <Tooltip
        content="Students not yet placed in a section."
        className={styles.statTooltip}
      >
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.unassigned}</div>
          <div className={styles.statLabel}>Unassigned</div>
          <div className={styles.statSub}>awaiting section</div>
          <div className={styles.statIcon}>
            <Clock3 size={18} />
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
