import { CalendarClock, CalendarDays, Gauge, Timer } from "lucide-react";
import type { EventItem, EventsStats } from "./types";
import styles from "./event-stats.module.css";

export type EventStatsProps = {
  stats: EventsStats;
  items: EventItem[];
};

export function EventStats({ stats, items }: EventStatsProps) {
  const attendanceRequired = items.filter(
    (e) => e.requiresAttendance && e.status !== "past",
  ).length;
  const liveTitle = items.find((e) => e.status === "live")?.title;

  return (
    <div className={styles.statGrid}>
      <div className={styles.statCard}>
        <div className={styles.statIcon}>
          <CalendarDays size={20} />
        </div>
        <div className={styles.statValue}>{stats.total}</div>
        <div className={styles.statLabel}>Total Events</div>
        <div className={styles.statSub}>this academic term</div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statIcon}>
          <CalendarClock size={20} />
        </div>
        <div className={styles.statValue}>{stats.upcoming}</div>
        <div className={styles.statLabel}>Upcoming</div>
        <div className={styles.statSub}>
          {attendanceRequired} require attendance
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statIcon}>
          <Timer size={20} />
        </div>
        <div className={styles.statValue}>{stats.live}</div>
        <div className={styles.statLabel}>Live Now</div>
        <div className={styles.statSub}>{liveTitle ?? "no event running"}</div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statIcon}>
          <Gauge size={20} />
        </div>
        <div className={styles.statValue}>
          {stats.avgRate}
          <span className={styles.statValueSuffix}>%</span>
        </div>
        <div className={styles.statLabel}>Avg Attendance</div>
        <div className={styles.statBar}>
          <span style={{ width: `${stats.avgRate}%` }} />
        </div>
      </div>
    </div>
  );
}
