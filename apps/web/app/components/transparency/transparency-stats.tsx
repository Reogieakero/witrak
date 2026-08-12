import { FolderOpen, HandCoins, CalendarCheck2, ScrollText } from "lucide-react";
import { Tooltip } from "@/app/components/ui/tooltip";
import type { TransparencyStats } from "./types";
import styles from "./transparency-stats.module.css";

export type TransparencyStatsGridProps = {
  stats: TransparencyStats;
};

export function TransparencyStatsGrid({ stats }: TransparencyStatsGridProps) {
  return (
    <div className={styles.statGrid}>
      <Tooltip content="All documents published in the transparency hub, across every category." className={styles.statTooltip}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.totalFiles}</div>
          <div className={styles.statLabel}>Total Files</div>
          <div className={styles.statSub}>across 4 categories</div>
          <div className={styles.statIcon}>
            <FolderOpen size={18} />
          </div>
        </div>
      </Tooltip>

      <Tooltip content="Budgets, disbursements, and other financial records made public for members." className={styles.statTooltip}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.financialCount}</div>
          <div className={styles.statLabel}>Financial Docs</div>
          <div className={styles.statSub}>budgets & disbursements</div>
          <div className={styles.statIcon}>
            <HandCoins size={18} />
          </div>
        </div>
      </Tooltip>

      <Tooltip content="Event programs, schedules, and related files shared with the student body." className={styles.statTooltip}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.eventsCount}</div>
          <div className={styles.statLabel}>Event Files</div>
          <div className={styles.statSub}>programs & schedules</div>
          <div className={styles.statIcon}>
            <CalendarCheck2 size={18} />
          </div>
        </div>
      </Tooltip>

      <Tooltip content="Meeting minutes and organizational reports published for transparency." className={styles.statTooltip}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.minutesCount + stats.reportsCount}</div>
          <div className={styles.statLabel}>Minutes & Reports</div>
          <div className={styles.statSub}>meeting minutes, reports</div>
          <div className={styles.statIcon}>
            <ScrollText size={18} />
          </div>
        </div>
      </Tooltip>
    </div>
  );
}
