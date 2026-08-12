import { CalendarClock, CalendarX2, Download, Gauge, QrCode, Zap } from "lucide-react";
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
  const hasLive = items.some((e) => e.status === "live");

  const upcoming = items
    .filter((e) => e.status !== "past")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, 4);

  return (
    <aside className={styles.sidebar}>
      <div
        className={styles.card}
        data-live={hasLive || undefined}
      >
        <div className={styles.cardHead}>
          <h3 className={styles.cardTitle}>
            {hasLive ? <Zap size={16} /> : <CalendarClock size={16} />}
            {hasLive ? "Live Event" : "Upcoming"}
          </h3>
          <Badge tone={hasLive ? "amber" : "brand"}>{upcoming.length}</Badge>
        </div>
        <div className={styles.upcoming}>
          {upcoming.length === 0 && (
            <div className={styles.empty}>
              <CalendarX2 size={20} />
              <span>No upcoming events scheduled.</span>
            </div>
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
          <Badge tone="green">on track</Badge>
        </div>
        <div className={styles.gauge}>
          <svg
            className={styles.gaugeSvg}
            viewBox="0 0 200 110"
            role="img"
            aria-label={`Overall attendance rate ${stats.avgRate} percent`}
          >
            <defs>
              <linearGradient id="attRateGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            <path
              d="M 25 105 A 75 75 0 0 1 175 105"
              fill="none"
              stroke="var(--surface-muted)"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <path
              d="M 25 105 A 75 75 0 0 1 175 105"
              fill="none"
              stroke="url(#attRateGradient)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray="235.62"
              strokeDashoffset={235.62 * (1 - stats.avgRate / 100)}
            />
          </svg>
          <div className={styles.gaugeCenter}>
            <span className={styles.snapshotValue}>
              {stats.avgRate}
              <span className={styles.snapshotSuffix}>%</span>
            </span>
            <span className={styles.snapshotLabel}>overall present rate</span>
          </div>
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
            <button type="button" className={styles.quickTile} onClick={onCreate}>
              <span className={styles.quickIcon}>
                <Zap size={14} />
              </span>
              <span className={styles.quickMeta}>
                <span className={styles.quickLabel}>New Event</span>
                <span className={styles.quickSub}>Create an event</span>
              </span>
            </button>
          )}
          <button type="button" className={styles.quickTile}>
            <span className={styles.quickIcon}>
              <QrCode size={14} />
            </span>
            <span className={styles.quickMeta}>
              <span className={styles.quickLabel}>Scan Attendance</span>
              <span className={styles.quickSub}>Log via QR</span>
            </span>
          </button>
          <button type="button" className={styles.quickTile}>
            <span className={styles.quickIcon}>
              <Download size={14} />
            </span>
            <span className={styles.quickMeta}>
              <span className={styles.quickLabel}>Export List</span>
              <span className={styles.quickSub}>Download CSV</span>
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}