"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { EventItem } from "./types";
import styles from "./event-calendar.module.css";

export type EventCalendarProps = {
  items: EventItem[];
  onSelect: (event: EventItem) => void;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function EventCalendar({ items, onSelect }: EventCalendarProps) {
  const now = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState({
    year: now.getFullYear(),
    month: now.getMonth(),
  });

  const byDay = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const e of items) {
      const key = dateKey(new Date(e.startsAt));
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    }
    return map;
  }, [items]);

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(
    "en-US",
    { month: "long" },
  );
  const yearLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(
    "en-US",
    { year: "numeric" },
  );

  const first = new Date(cursor.year, cursor.month, 1);
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const leading = first.getDay();

  const shiftMonth = (dir: number) => {
    const next = new Date(cursor.year, cursor.month + dir, 1);
    setCursor({ year: next.getFullYear(), month: next.getMonth() });
  };

  const goToday = () =>
    setCursor({ year: now.getFullYear(), month: now.getMonth() });

  const isToday = (d: Date) =>
    now.getFullYear() === d.getFullYear() &&
    now.getMonth() === d.getMonth() &&
    now.getDate() === d.getDate();

  const atMonthStart = cursor.year === now.getFullYear() && cursor.month === now.getMonth();

  return (
    <div className={styles.calendar}>
      <div className={styles.head}>
        <div className={styles.title}>
          <h3 className={styles.monthLabel}>
            {monthLabel}
            <span className={styles.yearLabel}>{yearLabel}</span>
          </h3>
          <span className={styles.monthMeta}>
            {daysInMonth} days · {byDay.size} with events
          </span>
        </div>
        <div className={styles.nav}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            className={styles.todayBtn}
            onClick={goToday}
            disabled={atMonthStart}
          >
            Today
          </button>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className={styles.weekdays}>
        {WEEKDAYS.map((w, i) => (
          <span key={w} data-weekend={i === 0 || i === 6 || undefined}>
            {w}
          </span>
        ))}
      </div>

      <div className={styles.grid}>
        {Array.from({ length: leading }).map((_, i) => (
          <div key={`lead-${i}`} className={styles.blank} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const day = idx + 1;
          const date = new Date(cursor.year, cursor.month, day);
          const key = dateKey(date);
          const events = byDay.get(key) ?? [];
          const today = isToday(date);
          const weekend = date.getDay() === 0 || date.getDay() === 6;
          const tone = dayTone(events);
          const count = events.length;

          return (
            <button
              type="button"
              key={key}
              className={styles.cell}
              data-tone={tone}
              data-today={today || undefined}
              data-weekend={weekend || undefined}
              data-empty={count === 0 || undefined}
              onClick={() => count > 0 && onSelect(events[0])}
              disabled={count === 0}
              aria-label={
                count > 0
                  ? `View events on ${date.toDateString()}`
                  : undefined
              }
            >
              <div className={styles.cellTop}>
                <span className={styles.dayNum} data-today={today || undefined}>
                  {day}
                </span>
                {count > 0 && (
                  <span className={styles.count} data-tone={tone}>
                    {count}
                  </span>
                )}
              </div>
              <div className={styles.events}>
                {events.slice(0, 2).map((ev) => (
                  <span
                    key={ev.id}
                    className={styles.eventRow}
                    data-status={ev.status}
                    title={ev.title}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(ev);
                    }}
                  >
                    <span className={styles.eventTime}>{ev.scheduleTime}</span>
                    <span className={styles.eventName}>{ev.title}</span>
                    {ev.requiresAttendance && (
                      <span className={styles.eventAtt} title="Requires attendance">
                        QR
                      </span>
                    )}
                  </span>
                ))}
                {count > 2 && (
                  <span className={styles.more}>
                    +{count - 2} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} data-tone="upcoming" />
          Upcoming
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} data-tone="live" />
          Live today
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} data-tone="past" />
          Completed
        </span>
        <span className={styles.legendNote}>QR = attendance required</span>
      </div>
    </div>
  );
}

function dayTone(events: EventItem[]): "live" | "upcoming" | "past" | "none" {
  if (events.length === 0) return "none";
  if (events.some((e) => e.status === "live")) return "live";
  if (events.some((e) => e.status === "upcoming")) return "upcoming";
  return "past";
}
