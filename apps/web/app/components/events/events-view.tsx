"use client";

import { useState, useTransition } from "react";
import { sileo } from "sileo";
import { AlertTriangle, CalendarX2, Loader2 } from "lucide-react";
import type { EventItem, EventsAccess, EventsStats } from "./types";
import { EventHeader } from "./event-header";
import { EventStats } from "./event-stats";
import { EventList } from "./event-list";
import { EventSidebar } from "./event-sidebar";
import { EventModal } from "./event-modal";
import { EventView } from "./event-view";
import { ConfirmationModal } from "@/app/components/ui/confirmation-modal";
import { deleteEvent } from "@/app/admin/events/actions";
import styles from "./events-view.module.css";

export type EventsViewProps = {
  items: EventItem[];
  stats: EventsStats;
  access: EventsAccess;
  programs: { id: string; code: string; name: string }[];
};

type ModalState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "view"; event: EventItem }
  | { mode: "edit"; event: EventItem };

type ConfirmState =
  | { mode: "closed" }
  | { mode: "edit"; event: EventItem }
  | { mode: "delete"; event: EventItem };

export function EventsView({ items, stats, access, programs }: EventsViewProps) {
  const [filter, setFilter] = useState<"all" | EventItem["status"]>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });
  const [confirm, setConfirm] = useState<ConfirmState>({ mode: "closed" });
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
    setConfirm({ mode: "delete", event });
  };

  const confirmEdit = () => {
    if (confirm.mode !== "edit") return;
    setConfirm({ mode: "closed" });
    setModal({ mode: "edit", event: confirm.event });
  };

  const confirmDelete = () => {
    if (confirm.mode !== "delete") return;
    const event = confirm.event;
    setConfirm({ mode: "closed" });
    startDelete(() => {
      void sileo.promise(
        async () => {
          const result = await deleteEvent(event.id);
          if (!result.ok) throw new Error(result.error ?? "Failed to delete.");
          return result;
        },
        {
          loading: {
            title: "Deleting event",
            description: `Removing "${event.title}"…`,
            icon: <Loader2 />,
          },
          success: {
            title: "Event deleted",
            description: `"${event.title}" was removed.`,
            icon: <CalendarX2 />,
          },
          error: (err) => ({
            title: "Couldn't delete event",
            description:
              err instanceof Error ? err.message : "Please try again.",
            icon: <AlertTriangle />,
          }),
        },
      );
    });
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
          onView={(event) => setModal({ mode: "view", event })}
          onEdit={(event) => setConfirm({ mode: "edit", event })}
          onDelete={handleDelete}
        />
      </div>

      <EventSidebar
        items={items}
        stats={stats}
        access={access}
        onCreate={access.create ? () => setModal({ mode: "create" }) : undefined}
      />

      {modal.mode === "view" && (
        <EventView
          event={modal.event}
          access={{
            edit: access.edit && modal.event.canEdit,
            delete: access.delete && modal.event.canDelete,
          }}
          onClose={() => setModal({ mode: "closed" })}
          onEdit={
            modal.event.canEdit
              ? () => setConfirm({ mode: "edit", event: modal.event })
              : undefined
          }
        />
      )}

      {(modal.mode === "create" || modal.mode === "edit") && (
        <EventModal
          key={modal.mode === "edit" ? modal.event.id : "create"}
          mode={modal.mode}
          event={modal.mode === "edit" ? modal.event : undefined}
          access={access}
          programs={programs}
          onClose={() => setModal({ mode: "closed" })}
        />
      )}

      {confirm.mode === "edit" && (
        <ConfirmationModal
          open
          title="Edit this event?"
          description={
            <>
              You are about to edit{" "}
              <strong>{confirm.event.title}</strong>. Type the event ID to
              continue.
            </>
          }
          confirmLabel="Edit Event"
          confirmToken={confirm.event.id}
          variant="brand"
          onConfirm={confirmEdit}
          onClose={() => setConfirm({ mode: "closed" })}
        />
      )}

      {confirm.mode === "delete" && (
        <ConfirmationModal
          open
          title="Delete this event?"
          description={
            <>
              You are about to delete{" "}
              <strong>{confirm.event.title}</strong> and all of its attendance
              records. This cannot be undone. Type the event ID to continue.
            </>
          }
          confirmLabel="Delete Event"
          confirmToken={confirm.event.id}
          variant="danger"
          onConfirm={confirmDelete}
          onClose={() => setConfirm({ mode: "closed" })}
        />
      )}
    </div>
  );
}