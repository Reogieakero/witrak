"use client";

import { useState, useTransition } from "react";
import type { EventItem, EventsAccess, EventsStats } from "./types";
import { EventHeader } from "./event-header";
import { EventStats } from "./event-stats";
import { EventList } from "./event-list";
import { EventSidebar } from "./event-sidebar";
import { EventModal } from "./event-modal";
import { deleteEvent } from "@/app/admin/events/actions";
import styles from "./events-view.module.css";

export type EventsViewProps = {
  items: EventItem[];
  stats: EventsStats;
  access: EventsAccess;
};

type ModalState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; event: EventItem };

export function EventsView({ items, stats, access }: EventsViewProps) {
  const [filter, setFilter] = useState<"all" | EventItem["status"]>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });
  const [, startDelete] = useTransition();

  const handleFilter = (f: "all" | EventItem["status"]) => {
    setFilter(f);
    setPage(1);
  };

  const handleQuery = (q: string) => {
    setQuery(q);
    setPage(1);
  };

  const handleDelete = (event: EventItem) => {
    if (window.confirm(`Delete "${event.title}" and its attendance records?`)) {
      startDelete(async () => {
        await deleteEvent(event.id);
      });
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.mainCol}>
        <EventHeader termName={stats.termName} onCreate={access.create ? () => setModal({ mode: "create" }) : undefined} />

        <EventStats stats={stats} items={items} />

        <EventList
          items={items}
          filter={filter}
          query={query}
          page={page}
          onPageChange={setPage}
          onFilter={handleFilter}
          onQuery={handleQuery}
          onEdit={(event) => setModal({ mode: "edit", event })}
          onDelete={handleDelete}
        />
      </div>

      <EventSidebar
        items={items}
        stats={stats}
        access={access}
        onCreate={access.create ? () => setModal({ mode: "create" }) : undefined}
      />

      {modal.mode !== "closed" && (
        <EventModal
          key={modal.mode === "edit" ? modal.event.id : "create"}
          mode={modal.mode}
          event={modal.mode === "edit" ? modal.event : undefined}
          access={access}
          onClose={() => setModal({ mode: "closed" })}
        />
      )}
    </div>
  );
}