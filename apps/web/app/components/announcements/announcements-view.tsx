"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Loader2, Trash2 } from "lucide-react";
import { sileo } from "sileo";
import { Button } from "@/app/components/ui/button";
import { LoadingOverlay } from "@/app/components/ui/loading-overlay";
import { ConfirmationModal } from "@/app/components/ui/confirmation-modal";
import { AnnouncementsStatsGrid } from "./announcements-stats";
import { AnnouncementsFeed } from "./announcements-feed";
import { AnnouncementsModals } from "./announcements-modals";
import {
  createAnnouncement,
  editAnnouncement,
  deleteAnnouncement,
} from "@/app/admin/announcements/actions";
import type {
  AnnouncementsViewProps,
  AnnouncementModal,
  AnnouncementDrawer,
  AnnouncementItem,
} from "./types";
import styles from "./announcements-view.module.css";

export function AnnouncementsView({
  announcements,
  stats,
  programs,
  canCreate,
  canEdit,
  canDelete,
  userName,
  roleLabel,
}: AnnouncementsViewProps) {
  const router = useRouter();
  const [items, setItems] = useState<AnnouncementItem[]>(announcements);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<AnnouncementModal | null>(null);
  const [drawer, setDrawer] = useState<AnnouncementDrawer | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AnnouncementItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [isMutating, startTransition] = useTransition();

  useEffect(() => {
    setItems(announcements);
  }, [announcements]);

  function formatDateTimeLocal(d: Date): string {
    const date = d.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
    return `${date} · ${time}`;
  }

  function buildFromForm(formData: FormData): {
    title: string;
    body: string;
    scopeType: string;
    programId: string | null;
    audience: string;
  } {
    const title = String(formData.get("title") || "").trim();
    const body = String(formData.get("body") || "").trim();
    const scopeRaw = String(formData.get("scope") || "all");
    const scopeType = scopeRaw === "program" ? "PROGRAM" : "FACULTY";
    const programId =
      scopeRaw === "program" ? String(formData.get("programId") || "").trim() : null;
    const audience =
      scopeType === "PROGRAM"
        ? programs.find((p) => p.id === programId)?.name ?? "Specific program"
        : "All students";
    return { title, body, scopeType, programId, audience };
  }

  const handleCreate = (formData: FormData) => {
    const title = String(formData.get("title") || "");
    const body = String(formData.get("body") || "");
    if (!title || !body) return;
    setBusy(true);
    setBusyLabel("Publishing announcement…");
    startTransition(async () => {
      try {
        const result = await sileo.promise(
          () => createAnnouncement(formData),
          {
            loading: { title: "Publishing announcement", description: "Posting the announcement…", icon: <Loader2 /> },
            success: { title: "Announcement published", description: "Members can now see it on their surface.", icon: <Megaphone /> },
            error: (err) => ({ title: "Could not publish", description: err instanceof Error ? err.message : "Please try again.", icon: <Megaphone /> }),
          },
        );
        if (result.ok && result.id) {
          const { title, body, scopeType, programId, audience } = buildFromForm(formData);
          setItems((prev) => [
            {
              id: result.id as string,
              title,
              body,
              authorName: userName ?? "You",
              authorRole: roleLabel,
              createdAt: formatDateTimeLocal(new Date()),
              imageUrl: result.imageUrl ?? null,
              audience,
              scopeType,
              programId,
            },
            ...prev,
          ]);
          setModal(null);
          await router.refresh();
        }
      } finally {
        setBusy(false);
        setBusyLabel(null);
      }
    });
  };

  const handleDelete = (announcementId: string) => {
    const announcement = items.find((a) => a.id === announcementId);
    setBusy(true);
    setBusyLabel("Deleting announcement…");
    startTransition(async () => {
      try {
        const result = await sileo.promise(
          () => deleteAnnouncement(announcementId),
          {
            loading: { title: "Deleting announcement", description: "Removing the announcement…", icon: <Loader2 /> },
            success: { title: "Announcement deleted", description: announcement ? `${announcement.title} was removed.` : "The announcement was removed.", icon: <Trash2 /> },
            error: (err) => ({ title: "Could not delete", description: err instanceof Error ? err.message : "Please try again.", icon: <Megaphone /> }),
          },
        );
        if (result.ok) {
          setItems((prev) => prev.filter((a) => a.id !== announcementId));
          setConfirmDelete(null);
          await router.refresh();
        }
      } finally {
        setBusy(false);
        setBusyLabel(null);
      }
    });
  };

  const handleEdit = (announcementId: string) => {
    setDrawer(null);
    setModal({ kind: "edit", id: announcementId });
  };

  const handleUpdate = (formData: FormData) => {
    const id = String(formData.get("id") || "").trim();
    if (!id) return;
    setBusy(true);
    setBusyLabel("Saving changes…");
    startTransition(async () => {
      try {
        const result = await sileo.promise(
          () => editAnnouncement(formData),
          {
            loading: { title: "Saving changes", description: "Updating the announcement…", icon: <Loader2 /> },
            success: { title: "Announcement updated", description: "Your changes have been saved.", icon: <Megaphone /> },
            error: (err) => ({ title: "Could not update", description: err instanceof Error ? err.message : "Please try again.", icon: <Megaphone /> }),
          },
        );
        if (result.ok) {
          const { title, body, scopeType, programId, audience } = buildFromForm(formData);
          const prev = items.find((a) => a.id === id);
          const imageUrl =
            result.imageUrl !== undefined ? result.imageUrl : (prev?.imageUrl ?? null);
          setItems((prevItems) =>
            prevItems.map((a) =>
              a.id === id
                ? { ...a, title, body, scopeType, programId, audience, imageUrl }
                : a,
            ),
          );
          setModal(null);
          await router.refresh();
        }
      } finally {
        setBusy(false);
        setBusyLabel(null);
      }
    });
  };

  const openView = (announcementId: string) => {
    const exists = items.some((a) => a.id === announcementId);
    if (exists) setDrawer({ kind: "view", id: announcementId });
  };

  const triggerDelete = (announcementId: string) => {
    setDrawer(null);
    const item = items.find((a) => a.id === announcementId) ?? null;
    setConfirmDelete(item);
  };

  return (
    <div className={styles.page}>
      <div className={styles.mainCol}>
        <div className={styles.pageHeader}>
          <div>
            <div className={styles.titleRow}>
              <h1 className={styles.pageTitle}>Announcements</h1>
              <span className={styles.termBadge}>{stats.termName}</span>
            </div>
            <p className={styles.pageSubtitle}>
              Publish updates that every member will see. Announcements are shared
              with everyone by default, or with a specific program when you choose one.
            </p>
          </div>
          {canCreate && (
            <div className={styles.actions}>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setModal({ kind: "create" })}
                disabled={isMutating}
              >
                New Announcement
              </Button>
            </div>
          )}
        </div>

        <AnnouncementsStatsGrid stats={stats} />

        <AnnouncementsFeed
          announcements={items}
          query={query}
          page={page}
          onQuery={(q) => {
            setQuery(q);
            setPage(1);
          }}
          onPageChange={setPage}
          onView={openView}
        />
      </div>

      <AnnouncementsModals
        announcements={items}
        programs={programs}
        modal={modal}
        drawer={drawer}
        busy={busy}
        onCloseModal={() => setModal(null)}
        onCloseDrawer={() => setDrawer(null)}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onEdit={handleEdit}
        onDelete={triggerDelete}
      />

      {confirmDelete && (
        <ConfirmationModal
          open
          title="Delete this announcement?"
          description={
            <>
              You are about to delete{" "}
              <strong>{confirmDelete.title}</strong>. Members will no longer see it on
              their surface feed. This cannot be undone. Type the announcement title to
              continue.
            </>
          }
          confirmLabel="Delete Announcement"
          confirmToken={confirmDelete.title}
          onConfirm={() => handleDelete(confirmDelete.id)}
          onClose={() => setConfirmDelete(null)}
        />
      )}

      <LoadingOverlay open={busy || isMutating} label={busyLabel ?? "Working…"} />
    </div>
  );
}
