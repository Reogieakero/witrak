import { CalendarClock, Download, Gauge, Plus, QrCode, Zap } from "lucide-react";
import type { EventItem, EventsAccess, EventsStats } from "./types";
import { Badge } from "@/app/components/ui/badge";
import styles from "./event-sidebar.module.css";

export type EventSidebarProps = {
  items: EventItem[];
  stats: EventsStats;
  access: EventsAccess;
  onCreate?: () => void;
};

export function EventSidebar({ items, stats, access, onCreate }: EventSidebarProps) {
  const upcoming = items
    .filter((e) => e.status !== "past")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, 4);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.card}>
        <div className={styles.cardHead}>
          <h3 className={styles.cardTitle}>
            <CalendarClock size={16} />
            Upcoming
          </h3>
          <Badge tone="brand">{upcoming.length}</Badge>
        </div>
        <div className={styles.upcoming}>
          {upcoming.length === 0 && (
            <p className={styles.empty}>No upcoming events scheduled.</p>
          )}
          {upcoming.map((e) => (
            <div
              key={e.id}
              className={e.status === "live" ? styles.itemLive : styles.item}
            >
              <div className={styles.dateBox}>
                <span className={styles.dateMonth}>{e.month}</span>
                <span className={styles.dateDay}>{e.day}</span>
              </div>
              <div className={styles.meta}>
                <span className={styles.title}>{e.title}</span>
                <span className={styles.time}>{e.scheduleTime}</span>
              </div>
              {e.status === "live" ? (
                <span className={styles.liveBadge}>
                  <span className={styles.liveDot} />
                  LIVE
                </span>
              ) : e.daysUntil !== null ? (
                <span className={styles.days}>{e.daysUntil}d</span>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>
          <Gauge size={16} />
          Attendance Snapshot
        </h3>
        <div className={styles.snapshotHead}>
          <div>
            <span className={styles.snapshotValue}>
              {stats.avgRate}
              <span className={styles.snapshotSuffix}>%</span>
            </span>
            <span className={styles.snapshotLabel}>overall present rate</span>
          </div>
          <Badge tone="green">on track</Badge>
        </div>
        <div className={styles.snapshotBar}>
          <span style={{ width: `${stats.avgRate}%` }} />
        </div>
        <div className={styles.snapshotMeta}>
          <span>Target 95%</span>
          <span>
            {stats.avgRate >= 95
              ? "on target"
              : `${95 - stats.avgRate} pts short`}
          </span>
        </div>
        <div className={styles.snapshotStats}>
          <div>
            <div className={styles.snapshotStatValue}>{stats.total}</div>
            <div className={styles.snapshotStatLabel}>Events</div>
          </div>
          <div>
            <div className={styles.snapshotStatValue}>{stats.presentTotal}</div>
            <div className={styles.snapshotStatLabel}>Present</div>
          </div>
          <div>
            <div className={styles.snapshotStatValue}>{stats.attendanceTotal}</div>
            <div className={styles.snapshotStatLabel}>Records</div>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>
          <Zap size={16} />
          Quick Actions
        </h3>
        <div className={styles.actions}>
          {access.create && onCreate && (
            <button type="button" className={styles.primary} onClick={onCreate}>
              <Plus size={14} />
              New Event
            </button>
          )}
          <button type="button" className={styles.ghost}>
            <QrCode size={14} />
            Scan Attendance
          </button>
          <button type="button" className={styles.ghost}>
            <Download size={14} />
            Export List
          </button>
        </div>
      </div>
    </aside>
  );
}