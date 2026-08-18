"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CalendarCheck2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutGrid,
  MapPin,
  QrCode,
  Radio,
} from "lucide-react";
import type { StudentEventItem } from "./types";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Modal } from "@/app/components/ui/modal";
import base from "./student-feed.module.css";
import styles from "./student-events.module.css";
import { useEventsModal } from "./events-modal-context";

type StudentEventsProps = {
  events: StudentEventItem[];
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function scheduleRange(e: StudentEventItem): string {
  const start = new Date(e.startsAt);
  const end = new Date(e.endsAt);
  const date = start.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  });
  const startTime = start.toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  });
  const endTime = end.toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  });
  return `${date} · ${startTime} – ${endTime}`;
}

function EventStatus({ e }: { e: StudentEventItem }) {
  if (e.isLive) {
    return (
      <Badge tone="red">
        <Radio size={11} />
        Live now
      </Badge>
    );
  }
  if (e.requiresAttendance) {
    return (
      <Badge tone="amber">
        <QrCode size={11} />
        Scan at door
      </Badge>
    );
  }
  return <Badge tone="green">Free entry</Badge>;
}

export function StudentEvents({ events }: StudentEventsProps) {
  const [open, setOpen] = useState(false);
  const [initial, setInitial] = useState<StudentEventItem | null>(null);
  const { trigger } = useEventsModal();
  const lastTrigger = useRef(0);

  useEffect(() => {
    if (trigger === lastTrigger.current) return;
    lastTrigger.current = trigger;
    setInitial(null);
    setOpen(true);
  }, [trigger]);

  const openModal = (event?: StudentEventItem) => {
    setInitial(event ?? null);
    setOpen(true);
  };

  return (
    <section id="events" className={base.card}>
      <header className={base.header}>
        <div className={base.heading}>
          <span className={base.headingIcon}>
            <CalendarCheck2 size={16} />
          </span>
          <div>
            <h3 className={base.title}>Upcoming Events</h3>
            <p className={base.subtitle}>Events you can attend this term</p>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => openModal()}
        >
          View all
        </Button>
      </header>

      <div className={styles.grid}>
        {events.length === 0 && <p className={base.empty}>No upcoming events.</p>}
        {events.map((e) => (
          <button
            key={e.id}
            type="button"
            className={styles.eventItem}
            onClick={() => openModal(e)}
          >
            <div className={styles.eventDate}>
              <span className={styles.eventDay}>{e.day}</span>
              <span className={styles.eventMonth}>{e.month}</span>
            </div>
            <div className={base.feedBody}>
              <span className={base.feedTitle}>{e.title}</span>
              <span className={styles.eventMeta}>
                <CalendarCheck2 size={11} />
                {e.scheduleTime}
              </span>
              <span className={styles.eventMeta}>
                <MapPin size={11} />
                {e.location || "TBA"}
              </span>
              <div className={base.feedMeta}>
                <EventStatus e={e} />
              </div>
            </div>
          </button>
        ))}
      </div>

      {open && (
        <EventsModal
          events={events}
          initial={initial}
          onClose={() => setOpen(false)}
        />
      )}
    </section>
  );
}

function EventsModal({
  events,
  initial,
  onClose,
}: {
  events: StudentEventItem[];
  initial: StudentEventItem | null;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"list" | "calendar">("list");
  const [selected, setSelected] = useState<StudentEventItem | null>(initial);

  return (
    <Modal
      open
      onClose={onClose}
      title={
        <span className={styles.modalTitle}>
          <span className={styles.modalTitleIcon}>
            <CalendarCheck2 size={16} />
          </span>
          <span>
            <span className={styles.modalTitleLine}>Events</span>
            <span className={styles.modalSubtitle}>
              Scheduled activities posted this term
            </span>
          </span>
        </span>
      }
      footer={
        <div className={styles.modalFooter}>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      {selected ? (
        <EventDetails event={selected} onBack={() => setSelected(null)} />
      ) : (
        <>
          <div className={styles.tabs} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "list"}
              className={tab === "list" ? styles.tabActive : styles.tab}
              onClick={() => setTab("list")}
            >
              <LayoutGrid size={14} />
              List
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "calendar"}
              className={tab === "calendar" ? styles.tabActive : styles.tab}
              onClick={() => setTab("calendar")}
            >
              <CalendarDays size={14} />
              Calendar
            </button>
          </div>

          {tab === "list" ? (
            <EventTable events={events} onSelect={setSelected} />
          ) : (
            <StudentCalendar events={events} onSelect={setSelected} />
          )}
        </>
      )}
    </Modal>
  );
}

function EventTable({
  events,
  onSelect,
}: {
  events: StudentEventItem[];
  onSelect: (event: StudentEventItem) => void;
}) {
  if (events.length === 0) {
    return <p className={base.empty}>No events posted yet.</p>;
  }

  return (
    <div className={styles.table}>
      <div className={styles.tableHead}>
        <span className={styles.colEvent}>Event</span>
        <span className={styles.colSchedule}>Schedule</span>
        <span className={styles.colStatus}>Status</span>
      </div>
      {events.map((e) => (
        <button
          key={e.id}
          type="button"
          className={styles.tableRow}
          onClick={() => onSelect(e)}
        >
          <span className={styles.rowEvent}>
            <span className={styles.rowDate}>
              <span className={styles.rowDay}>{e.day}</span>
              <span className={styles.rowMonth}>{e.month}</span>
            </span>
            <span className={styles.rowText}>
              <span className={styles.rowTitle}>{e.title}</span>
              <span className={styles.rowMeta}>
                <MapPin size={11} />
                {e.location || "TBA"}
              </span>
            </span>
          </span>
          <span className={styles.rowSchedule}>{e.scheduleTime}</span>
          <span className={styles.rowStatus}>
            <EventStatus e={e} />
          </span>
        </button>
      ))}
    </div>
  );
}

function StudentCalendar({
  events,
  onSelect,
}: {
  events: StudentEventItem[];
  onSelect: (event: StudentEventItem) => void;
}) {
  const now = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState({
    year: now.getFullYear(),
    month: now.getMonth(),
  });

  const byDay = useMemo(() => {
    const map = new Map<string, StudentEventItem[]>();
    for (const e of events) {
      const key = dateKey(new Date(e.startsAt));
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    }
    return map;
  }, [events]);

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

  const atMonthStart =
    cursor.year === now.getFullYear() && cursor.month === now.getMonth();

  return (
    <div className={styles.calendar}>
      <div className={styles.calHead}>
        <div className={styles.calTitle}>
          <h3 className={styles.calMonthLabel}>
            {monthLabel}
            <span className={styles.calYearLabel}>{yearLabel}</span>
          </h3>
          <span className={styles.calMonthMeta}>
            {daysInMonth} days · {byDay.size} with events
          </span>
        </div>
        <div className={styles.calNav}>
          <button
            type="button"
            className={styles.calNavBtn}
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            className={styles.calTodayBtn}
            onClick={goToday}
            disabled={atMonthStart}
          >
            Today
          </button>
          <button
            type="button"
            className={styles.calNavBtn}
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className={styles.calWeekdays}>
        {WEEKDAYS.map((w, i) => (
          <span key={w} data-weekend={i === 0 || i === 6 || undefined}>
            {w}
          </span>
        ))}
      </div>

      <div className={styles.calGrid}>
        {Array.from({ length: leading }).map((_, i) => (
          <div key={`lead-${i}`} className={styles.calBlank} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const day = idx + 1;
          const date = new Date(cursor.year, cursor.month, day);
          const key = dateKey(date);
          const dayEvents = byDay.get(key) ?? [];
          const today = isToday(date);
          const weekend = date.getDay() === 0 || date.getDay() === 6;
          const tone = dayTone(dayEvents);
          const count = dayEvents.length;

          return (
            <button
              type="button"
              key={key}
              className={styles.calCell}
              data-tone={tone}
              data-today={today || undefined}
              data-weekend={weekend || undefined}
              data-empty={count === 0 || undefined}
              onClick={() => count > 0 && onSelect(dayEvents[0])}
              disabled={count === 0}
              aria-label={
                count > 0
                  ? `View events on ${date.toDateString()}`
                  : undefined
              }
            >
              <span
                className={styles.calDayNum}
                data-today={today || undefined}
              >
                {day}
              </span>
            </button>
          );
        })}
      </div>

      <div className={styles.calLegend}>
        <span className={styles.calLegendItem}>
          <span className={styles.calLegendDot} data-tone="upcoming" />
          Upcoming
        </span>
        <span className={styles.calLegendItem}>
          <span className={styles.calLegendDot} data-tone="live" />
          Live today
        </span>
        <span className={styles.calLegendItem}>
          <span className={styles.calLegendDot} data-tone="past" />
          Completed
        </span>
        <span className={styles.calLegendNote}>QR = attendance required</span>
      </div>
    </div>
  );
}

function dayTone(
  events: StudentEventItem[],
): "live" | "upcoming" | "past" | "none" {
  if (events.length === 0) return "none";
  if (events.some((e) => e.isLive)) return "live";
  const now = new Date();
  if (events.some((e) => new Date(e.endsAt) >= now)) return "upcoming";
  return "past";
}

function EventDetails({
  event,
  onBack,
}: {
  event: StudentEventItem;
  onBack: () => void;
}) {
  return (
    <div className={styles.details}>
      <div className={styles.detailTop}>
        <button type="button" className={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={14} />
        </button>
        <div className={styles.detailHead}>
          <span className={styles.detailTitle}>{event.title}</span>
          <span className={styles.detailBadges}>
            <EventStatus e={event} />
          </span>
        </div>
      </div>

      <div className={styles.infoRow}>
        <span className={styles.infoIcon}>
          <CalendarCheck2 size={14} />
        </span>
        <div className={styles.infoBody}>
          <span className={styles.infoLabel}>Schedule</span>
          <span className={styles.infoValue}>{scheduleRange(event)}</span>
        </div>
      </div>

      <div className={styles.infoRow}>
        <span className={styles.infoIcon}>
          <MapPin size={14} />
        </span>
        <div className={styles.infoBody}>
          <span className={styles.infoLabel}>Location</span>
          <span className={styles.infoValue}>
            {event.location || "To be announced"}
          </span>
        </div>
      </div>

      {event.description && (
        <div className={styles.infoRow}>
          <span className={styles.infoIcon}>
            <FileText size={14} />
          </span>
          <div className={styles.infoBody}>
            <span className={styles.infoLabel}>Details</span>
            <span className={styles.infoValue}>{event.description}</span>
          </div>
        </div>
      )}
    </div>
  );
}