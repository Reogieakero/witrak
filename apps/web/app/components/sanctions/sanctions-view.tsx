"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, ShieldAlert, Loader2, PencilLine } from "lucide-react";
import { sileo } from "sileo";
import { Button } from "@/app/components/ui/button";
import { LoadingOverlay } from "@/app/components/ui/loading-overlay";
import { ConfirmationModal } from "@/app/components/ui/confirmation-modal";
import { SanctionsStatsGrid } from "./sanctions-stats";
import { SanctionsTables } from "./sanctions-tables";
import { SanctionsModals } from "./sanctions-modals";
import { SanctionsSidebar } from "./sanctions-sidebar";
import {
  resolveSanction,
  updateSanction,
  recomputeSanctions,
} from "@/app/admin/sanctions/actions";
import { saveSanctionFines } from "@/app/admin/sanctions/fines-actions";
import type {
  SanctionsViewProps,
  SanctionsListTab,
  SanctionItem,
  SanctionsModal,
  SanctionsDrawer,
  SanctionFineRow,
} from "./types";
import styles from "./sanctions-view.module.css";

export function SanctionsView({
  sanctions,
  stats,
  activityLogs,
  fines,
  canCreate,
  canResolve,
}: SanctionsViewProps) {
  const router = useRouter();
  const [tab, setTab] = useState<SanctionsListTab>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<SanctionsModal | null>(null);
  const [drawer, setDrawer] = useState<SanctionsDrawer | null>(null);
  const [resolvingSanction, setResolvingSanction] = useState(false);
  const [confirmResolve, setConfirmResolve] = useState<SanctionItem | null>(null);
  const [recomputing, setRecomputing] = useState(false);
  const [savingFines, setSavingFines] = useState(false);
  const [isMutating, startTransition] = useTransition();

  const canEdit = canCreate;

  const handleTab = (next: SanctionsListTab) => {
    setTab(next);
    setPage(1);
  };

  const handleQuery = (next: string) => {
    setQuery(next);
    setPage(1);
  };

  const requestResolve = (sanctionId: string) => {
    const item = sanctions.find((s) => s.id === sanctionId);
    if (item) setConfirmResolve(item);
  };

  const handleResolve = (sanctionId: string) => {
    if (!sanctionId) return;
    setResolvingSanction(true);
    startTransition(async () => {
      try {
        const result = await sileo.promise(
          () => resolveSanction({ sanctionId }),
          {
            loading: { title: "Resolving sanction", description: "Marking the sanction cleared...", icon: <Loader2 /> },
            success: { title: "Sanction cleared", description: "The sanction was marked as Cleared.", icon: <ShieldAlert /> },
            error: (err) => ({ title: "Could not resolve", description: err instanceof Error ? err.message : "Please try again.", icon: <ShieldAlert /> }),
          },
        );
        if (result.ok) {
          setConfirmResolve(null);
          setDrawer(null);
          await router.refresh();
        }
      } finally {
        setResolvingSanction(false);
      }
    });
  };

  const handleEdit = (formData: FormData) => {
    const sanctionId = String(formData.get("sanctionId") || "");
    const title = String(formData.get("title") || "");
    const reason = String(formData.get("reason") || "");
    if (!sanctionId) return;
    startTransition(async () => {
      const result = await sileo.promise(
        () => updateSanction({ sanctionId, title, reason }),
        {
          loading: { title: "Saving changes", description: "Updating the sanction record...", icon: <Loader2 /> },
          success: { title: "Sanction updated", description: "The record was saved.", icon: <PencilLine /> },
          error: (err) => ({ title: "Could not save", description: err instanceof Error ? err.message : "Please try again.", icon: <ShieldAlert /> }),
        },
      );
        if (result.ok) {
          setModal(null);
          setDrawer(null);
          await router.refresh();
        }
    });
  };

  const handleRecompute = () => {
    setRecomputing(true);
    startTransition(async () => {
      try {
        let createdCount = 0;
        let updatedCount = 0;
        const result = await sileo.promise(
          () =>
            recomputeSanctions().then((r) => {
              createdCount = r.created;
              updatedCount = r.updated;
              return r;
            }),
          {
            loading: {
              title: "Recomputing sanctions",
              description: "Checking students against their absence counts…",
              icon: <Loader2 />,
            },
            success: () => {
              const parts: string[] = [];
              if (createdCount > 0)
                parts.push(
                  `${createdCount} sanction${createdCount === 1 ? "" : "s"} issued`,
                );
              if (updatedCount > 0)
                parts.push(
                  `${updatedCount} updated to match absence count`,
                );
              return {
                title: "Sanctions recomputed",
                description:
                  parts.length > 0 ? parts.join(", ") + "." : "No changes needed.",
                icon: <RefreshCw />,
              };
            },
            error: (err) => ({
              title: "Could not recompute",
              description: err instanceof Error ? err.message : "Please try again.",
              icon: <ShieldAlert />,
            }),
          },
        );
        if (result.ok) {
          await router.refresh();
        }
      } finally {
        setRecomputing(false);
      }
    });
  };

  const handleSaveFines = (rows: SanctionFineRow[]) => {
    setSavingFines(true);
    startTransition(async () => {
      try {
        const result = await sileo.promise(() => saveSanctionFines(rows), {
          loading: { title: "Saving requirements", description: "Updating sanction requirements…", icon: <Loader2 /> },
          success: { title: "Requirements saved", description: "Sanction requirements were updated.", icon: <PencilLine /> },
          error: (err) => ({ title: "Could not save", description: err instanceof Error ? err.message : "Please try again.", icon: <ShieldAlert /> }),
        });
        if (result.ok) {
          setModal(null);
          await router.refresh();
        }
      } finally {
        setSavingFines(false);
      }
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.mainCol}>
        <div className={styles.pageHeader}>
          <div>
            <div className={styles.titleRow}>
              <h1 className={styles.pageTitle}>Sanctions</h1>
            </div>
            <p className={styles.pageSubtitle}>
              Sanctions are issued automatically based on each student&apos;s
              number of absences.
            </p>
          </div>
          {canCreate && (
            <div className={styles.actions}>
              <Button
                variant="primary"
                size="md"
                onClick={() => setDrawer({ kind: "activity" })}
              >
                Activity Logs
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setModal({ kind: "fines" })}
                disabled={isMutating}
              >
                Sanction Fines
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleRecompute}
                disabled={isMutating}
              >
                Recompute
              </Button>
            </div>
          )}
        </div>

        <SanctionsStatsGrid stats={stats} />

        <SanctionsTables
          sanctions={sanctions}
          tab={tab}
          onTab={handleTab}
          query={query}
          onQuery={handleQuery}
          page={page}
          onPageChange={setPage}
          canResolve={canResolve}
          canEdit={canEdit}
          onView={(sanctionId) => setDrawer({ kind: "sanction", id: sanctionId })}
          onResolve={requestResolve}
          onEdit={(sanctionId) => setModal({ kind: "edit", id: sanctionId })}
          disabled={isMutating}
        />
      </div>

      <SanctionsSidebar fines={fines} />

      <SanctionsModals
        sanctions={sanctions}
        activityLogs={activityLogs}
        fines={fines}
        modal={modal}
        drawer={drawer}
        onCloseModal={() => setModal(null)}
        onCloseDrawer={() => setDrawer(null)}
        onEdit={handleEdit}
        onSaveFines={handleSaveFines}
        canCreate={canCreate}
        onEditFor={(sanctionId) => setModal({ kind: "edit", id: sanctionId })}
        onResolve={requestResolve}
      />

      {confirmResolve && (
        <ConfirmationModal
          open
          title="Clear this sanction?"
          description={
            <>
              You are about to mark the sanction for{" "}
              <strong>{confirmResolve.studentName}</strong> as Cleared. This records the
              resolution and cannot be undone. Type the student&apos;s name to continue.
            </>
          }
          confirmLabel="Clear Sanction"
          confirmToken={confirmResolve.studentName}
          variant="brand"
          onConfirm={() => handleResolve(confirmResolve.id)}
          onClose={() => setConfirmResolve(null)}
        />
      )}

      <LoadingOverlay
        open={resolvingSanction || isMutating || recomputing || savingFines}
        label={
          recomputing
            ? "Recomputing sanctions…"
            : resolvingSanction
              ? "Clearing sanction…"
              : "Saving…"
        }
      />
    </div>
  );
}
