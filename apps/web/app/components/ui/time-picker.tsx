"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, ChevronDown } from "lucide-react";
import styles from "./time-picker.module.css";

type TimePickerProps = {
  name: string;
  value?: string;
};

const HOURS = Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i));
const MINUTES = Array.from({ length: 12 }, (_, i) =>
  String(i * 5).padStart(2, "0"),
);
const PERIODS = ["AM", "PM"] as const;

function toTime(value?: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const ph = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(ph.getUTCHours())}:${pad(ph.getUTCMinutes())}`;
}

function from24to12(time: string): { hour: number; minute: string; period: "AM" | "PM" } {
  if (!time) return { hour: 12, minute: "00", period: "AM" };
  let [h, m] = time.split(":").map(Number);
  const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return { hour, minute: String(m).padStart(2, "0"), period };
}

function to24(hour: number, minute: string, period: "AM" | "PM"): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  let h = hour % 12;
  if (period === "PM") h += 12;
  return `${pad(h)}:${minute}`;
}

function formatTime(time: string): string {
  const { hour, minute, period } = from24to12(time);
  return `${String(hour).padStart(2, "0")}:${minute} ${period}`;
}

export function TimePicker({ name, value }: TimePickerProps) {
  const [time, setTime] = useState(() => toTime(value));
  const [open, setOpen] = useState(false);
  const [field, setField] = useState<"hour" | "minute" | "period" | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setField(null);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const { hour, minute, period } = from24to12(time);
  const displayValue = time ? formatTime(time) : "Select time";

  return (
    <div ref={rootRef} className={styles.root} data-open={open || undefined}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Clock size={14} />
        <span className={styles.triggerText}>{displayValue}</span>
        <ChevronDown size={14} className={styles.chevron} />
      </button>

      <input type="hidden" name={name} value={time} />

      {open && (
        <div className={styles.popover} role="dialog">
          <div className={styles.timeRow}>
            <div className={styles.timeField}>
              <span className={styles.timeLabel}>Hour</span>
              <button
                type="button"
                className={styles.timeBtn}
                onClick={() => setField(field === "hour" ? null : "hour")}
                data-active={field === "hour" || undefined}
              >
                {time ? String(hour).padStart(2, "0") : "--"}
                <ChevronDown size={12} />
              </button>
              {field === "hour" && (
                <div className={styles.timeMenu}>
                  {HOURS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      className={styles.menuItem}
                      data-selected={hour === h || undefined}
                      onClick={() => {
                        const next = to24(h, minute, period);
                        setTime(next);
                        setField("minute");
                      }}
                    >
                      {String(h).padStart(2, "0")}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className={styles.timeColon}>:</span>
            <div className={styles.timeField}>
              <span className={styles.timeLabel}>Minute</span>
              <button
                type="button"
                className={styles.timeBtn}
                onClick={() => setField(field === "minute" ? null : "minute")}
                data-active={field === "minute" || undefined}
              >
                {time ? minute : "--"}
                <ChevronDown size={12} />
              </button>
              {field === "minute" && (
                <div className={styles.timeMenu}>
                  {MINUTES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={styles.menuItem}
                      data-selected={minute === m || undefined}
                      onClick={() => {
                        setTime(to24(hour, m, period));
                        setField("period");
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.timeField}>
              <span className={styles.timeLabel}>AM / PM</span>
              <button
                type="button"
                className={styles.timeBtn}
                onClick={() => setField(field === "period" ? null : "period")}
                data-active={field === "period" || undefined}
              >
                {time ? period : "--"}
                <ChevronDown size={12} />
              </button>
              {field === "period" && (
                <div className={styles.timeMenu}>
                  {PERIODS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={styles.menuItem}
                      data-selected={period === p || undefined}
                      onClick={() => {
                        setTime(to24(hour, minute, p));
                        setField(null);
                        setOpen(false);
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
