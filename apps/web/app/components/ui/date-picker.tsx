"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarClock, ChevronDown } from "lucide-react";
import styles from "./date-picker.module.css";

type DatePickerProps = {
  name: string;
  value?: string;
  allowPast?: boolean;
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function toDate(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function toInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function DatePicker({ name, value, allowPast = false }: DatePickerProps) {
  const [date, setDate] = useState<Date | null>(() => toDate(value));
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => {
    const base = date ?? new Date();
    return { year: base.getFullYear(), month: base.getMonth() };
  });
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const displayValue = date
    ? date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Select date";

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" },
  );

  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const leading = new Date(cursor.year, cursor.month, 1).getDay();

  const pick = (day: number) => {
    const next = new Date(cursor.year, cursor.month, day);
    setDate(next);
    setOpen(false);
  };

  const shiftMonth = (dir: number) => {
    const next = new Date(cursor.year, cursor.month + dir, 1);
    setCursor({ year: next.getFullYear(), month: next.getMonth() });
  };

  const isSameDay = (day: number) => {
    if (!date) return false;
    return (
      date.getFullYear() === cursor.year &&
      date.getMonth() === cursor.month &&
      date.getDate() === day
    );
  };

  const isPast = (day: number) => {
    if (allowPast) return false;
    const d = new Date(cursor.year, cursor.month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d.getTime() < today.getTime();
  };

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-open={open || undefined}
    >
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <CalendarClock size={14} />
        <span className={styles.triggerText}>{displayValue}</span>
        <ChevronDown size={14} className={styles.chevron} />
      </button>

      <input type="hidden" name={name} value={date ? toInputValue(date) : ""} />

      {open && (
        <div className={styles.popover} role="dialog">
          <div className={styles.calHead}>
            <button
              type="button"
              className={styles.navBtn}
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
            >
              ‹
            </button>
            <span className={styles.monthLabel}>{monthLabel}</span>
            <button
              type="button"
              className={styles.navBtn}
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className={styles.weekdays}>
            {WEEKDAYS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>

          <div className={styles.grid}>
            {Array.from({ length: leading }).map((_, i) => (
              <span key={`lead-${i}`} className={styles.blank} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const past = isPast(day);
              return (
                <button
                  key={day}
                  type="button"
                  className={styles.day}
                  data-selected={isSameDay(day) || undefined}
                  data-disabled={past || undefined}
                  onClick={() => pick(day)}
                  disabled={past}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
