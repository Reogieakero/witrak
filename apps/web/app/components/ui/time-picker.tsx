"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, ChevronDown } from "lucide-react";
import styles from "./time-picker.module.css";

type TimePickerProps = {
  name: string;
  value?: string;
};

const HOURS = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0"),
);
const MINUTES = Array.from({ length: 12 }, (_, i) =>
  String(i * 5).padStart(2, "0"),
);

function toTime(value?: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const ph = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(ph.getUTCHours())}:${pad(ph.getUTCMinutes())}`;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

export function TimePicker({ name, value }: TimePickerProps) {
  const [time, setTime] = useState(() => toTime(value));
  const [open, setOpen] = useState(false);
  const [field, setField] = useState<"hour" | "minute" | null>(null);
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
                {time ? time.slice(0, 2) : "--"}
                <ChevronDown size={12} />
              </button>
              {field === "hour" && (
                <div className={styles.timeMenu}>
                  {HOURS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      className={styles.menuItem}
                      data-selected={time.slice(0, 2) === h || undefined}
                      onClick={() => {
                        setTime((prev) => `${h}:${prev ? prev.slice(3) : "00"}`);
                        setField("minute");
                      }}
                    >
                      {h}
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
                {time ? time.slice(3) : "--"}
                <ChevronDown size={12} />
              </button>
              {field === "minute" && (
                <div className={styles.timeMenu}>
                  {MINUTES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={styles.menuItem}
                      data-selected={time.slice(3) === m || undefined}
                      onClick={() => {
                        setTime((prev) => `${prev.slice(0, 2)}:${m}`);
                        setField(null);
                        setOpen(false);
                      }}
                    >
                      {m}
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
