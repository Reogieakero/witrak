import { BadgeCheck, ScanLine, Timer } from "lucide-react";
import type { AttendanceStats } from "./types";
import { Tooltip } from "@/app/components/ui/tooltip";
import styles from "./attendance-stats.module.css";

export type AttendanceStatsProps = {
  stats: AttendanceStats;
};

function Hint({ title, body, source }: { title: string; body: string; source: string }) {
  return (
    <>
      <span className={styles.hintTitle}>{title}</span>
      <span>{body}</span>
      <span className={styles.hintSource}>{source}</span>
    </>
  );
}

export function AttendanceStats({ stats }: AttendanceStatsProps) {
  return (
    <div className={styles.statGrid}>
      <Tooltip
        className={styles.statTooltip}
        content={
          <Hint
            title="Total Records"
            body="All scanned attendance rows across every event, including corrections."
            source="Source: Attendance table"
          />
        }
      >
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <ScanLine size={20} />
          </div>
          <div className={styles.statValue}>{stats.totalRecords}</div>
          <div className={styles.statLabel}>Total Records</div>
          <div className={styles.statSub}>
            across {stats.eventCount} attended events
          </div>
        </div>
      </Tooltip>

      <Tooltip
        className={styles.statTooltip}
        content={
          <Hint
            title="Present Rate"
            body="Share of captured attendance records marked present or late."
            source="Source: Attendance table (PRESENT + LATE ÷ all records)"
          />
        }
      >
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <BadgeCheck size={20} />
          </div>
          <div className={styles.statValue}>
            {stats.presentRate}
            <span className={styles.statValueSuffix}>%</span>
          </div>
          <div className={styles.statLabel}>Present Rate</div>
          <div className={styles.statBar}>
            <span style={{ width: `${stats.presentRate}%` }} />
          </div>
        </div>
      </Tooltip>

      <Tooltip
        className={styles.statTooltip}
        content={
          <Hint
            title="Scanned Today"
            body="Attendance logs captured today, plus the currently live event if one is running."
            source="Source: Attendance table (scanned today)"
          />
        }
      >
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Timer size={20} />
          </div>
          <div className={styles.statValue}>{stats.scannedToday}</div>
          <div className={styles.statLabel}>Scanned Today</div>
          <div className={styles.statSub}>
            {stats.liveEventTitle ?? "no live event running"}
          </div>
        </div>
      </Tooltip>
    </div>
  );
}
