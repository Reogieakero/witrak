"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { EventItem } from "./types";
import styles from "./event-calendar.module.css";

export type EventCalendarProps = {
  items: EventItem[];
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type DayEvent = {
  status: "live" | "upcoming" | "past";
  title: string;
  requiresAttendance: boolean;
};

function dateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function eventStatus(e: EventItem): DayEvent["status"] {
  return e.status;
}

export function EventCalendar({ items }: EventCalendarProps) {
  const now = new Date();
  const [cursor, setCursor] = useState({
    year: now.getFullYear(),
    month: now.getMonth(),
  });

  const byDay = new Map<string, DayEvent[]>();
  for (const e of items) {
    const key = dateKey(new Date(e.startsAt));
    const list = byDay.get(key) ?? [];
    list.push({
      status: eventStatus(e),
      title: e.title,
      requiresAttendance: e.requiresAttendance,
    });
    byDay.set(key, list);
  }

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" },
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

  return (
    <div className={styles.calendar}>
      <div className={styles.head}>
        <h3 className={styles.monthLabel}>{monthLabel}</h3>
        <div className={styles.nav}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button type="button" className={styles.todayBtn} onClick={goToday}>
            Today
          </button>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className={styles.weekdays}>
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
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
          const tone = dayTone(events);

          return (
            <div
              key={key}
              className={styles.cell}
              data-tone={tone}
              data-today={today || undefined}
            >
              <span className={styles.dayNum} data-today={today || undefined}>
                {day}
              </span>
              <div className={styles.events}>
                {events.slice(0, 2).map((ev, i) => (
                  <span
                    key={i}
                    className={styles.eventRow}
                    data-status={ev.status}
                    title={ev.title}
                  >
                    <span className={styles.eventDot} data-status={ev.status} />
                    <span className={styles.eventName}>
                      {ev.title}
                      {ev.requiresAttendance ? "*" : ""}
                    </span>
                  </span>
                ))}
                {events.length > 2 && (
                  <span className={styles.more}>+{events.length - 2} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} data-tone="upcoming" />
          Brand event
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} data-tone="live" />
          Live today
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} data-tone="past" />
          Past event
        </span>
        <span className={styles.legendNote}>* requires attendance</span>
      </div>
    </div>
  );
}

function dayTone(events: DayEvent[]): "live" | "upcoming" | "past" | "none" {
  if (events.length === 0) return "none";
  if (events.some((e) => e.status === "live")) return "live";
  if (events.some((e) => e.status === "upcoming")) return "upcoming";
  return "past";
}