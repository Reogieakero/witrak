"use client";

import { useSyncExternalStore } from "react";
import { Calendar, CalendarX, List } from "lucide-react";
import type { EventItem, EventStatus } from "./types";
import { EventTile } from "@/app/components/ui/event-tile";
import { Pagination } from "@/app/components/ui/pagination";
import { SearchInput } from "@/app/components/ui/search-input";
import { EventCalendar } from "./event-calendar";
import styles from "./event-list.module.css";

export type Filter = "all" | EventStatus;

const FILTERS: Filter[] = ["all", "upcoming", "live", "past"];

const STATUS_LABEL: Record<Filter, string> = {
  all: "All",
  upcoming: "Upcoming",
  live: "Live",
  past: "Past",
};

const PAGE_SIZE = 9;
const VIEW_STORAGE_KEY = "fhusocom.events.view";
const VIEW_CHANGE_EVENT = "fhusocom.event-view-change";

function readView(store: Storage): "list" | "calendar" {
  const value = store.getItem(VIEW_STORAGE_KEY);
  return value === "calendar" ? "calendar" : "list";
}

function writeView(view: "list" | "calendar") {
  window.localStorage.setItem(VIEW_STORAGE_KEY, view);
  window.dispatchEvent(new Event(VIEW_CHANGE_EVENT));
}

function subscribeView(onStoreChange: () => void): () => void {
  window.addEventListener(VIEW_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(VIEW_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export type EventListProps = {
  items: EventItem[];
  filter: Filter;
  query: string;
  page: number;
  onPageChange: (page: number) => void;
  onFilter: (filter: Filter) => void;
  onQuery: (query: string) => void;
  onEdit: (event: EventItem) => void;
  onDelete: (event: EventItem) => void;
};

export function EventList({ items, filter, query, page, onPageChange, onFilter, onQuery, onEdit, onDelete }: EventListProps) {
  const view = useSyncExternalStore(subscribeView, () =>
    readView(window.localStorage),
    () => "list",
  );

  const setView = (next: "list" | "calendar") => writeView(next);

  const q = query.trim().toLowerCase();
  const filtered = items.filter((e) => {
    const matchesFilter = filter === "all" || e.status === filter;
    const matchesQuery =
      !q ||
      e.title.toLowerCase().includes(q) ||
      (e.location ?? "").toLowerCase().includes(q);
    return matchesFilter && matchesQuery;
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const notPast = visible
    .filter((e) => e.status !== "past")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const past = visible
    .filter((e) => e.status === "past")
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt));

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <div className={styles.viewToggle}>
          <button
            type="button"
            className={view === "list" ? styles.viewToggleActive : styles.viewToggleIdle}
            onClick={() => setView("list")}
          >
            <List size={14} />
            List
          </button>
          <button
            type="button"
            className={view === "calendar" ? styles.viewToggleActive : styles.viewToggleIdle}
            onClick={() => setView("calendar")}
          >
            <Calendar size={14} />
            Calendar
          </button>
        </div>
        <div className={styles.filters}>
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={filter === f ? styles.filterActive : styles.filterIdle}
              onClick={() => onFilter(f)}
            >
              {STATUS_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      {view === "calendar" ? (
        <div className={styles.calendarBody}>
          <EventCalendar items={filtered} />
        </div>
      ) : (
        <>
          <div className={styles.searchRow}>
            <SearchInput
              value={query}
              onChange={onQuery}
              placeholder="Filter by title or location..."
            />
          </div>

          <div className={styles.listBody}>
            {visible.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>
                  <CalendarX size={24} />
                </div>
                <p className={styles.emptyTitle}>No events found</p>
                <p className={styles.emptySub}>Try adjusting your filters or search query.</p>
              </div>
            ) : (
              <>
                {notPast.length > 0 && (
                  <div className={styles.sectionGrid}>
                    <p className={styles.sectionLabel}>Upcoming &amp; live</p>
                    <div className={styles.tileGrid}>
                      {notPast.map((e) => (
                        <EventTile key={e.id} event={e} onEdit={() => onEdit(e)} onDelete={() => onDelete(e)} />
                      ))}
                    </div>
                  </div>
                )}
                {past.length > 0 && (
                  <div className={styles.sectionGrid}>
                    <p className={styles.sectionLabel}>Past events</p>
                    <div className={styles.tileGrid}>
                      {past.map((e) => (
                        <EventTile key={e.id} event={e} onEdit={() => onEdit(e)} onDelete={() => onDelete(e)} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className={styles.cardFoot}>
            <Pagination
              page={safePage}
              pageCount={pageCount}
              total={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={onPageChange}
            />
          </div>
        </>
      )}
    </div>
  );
}