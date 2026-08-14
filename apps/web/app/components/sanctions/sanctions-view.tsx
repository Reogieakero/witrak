"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Loader2, PencilLine, Trash2 } from "lucide-react";
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
  createSanctionRule,
  updateSanctionRule,
  deleteSanctionRule,
  updateSanction,
} from "@/app/admin/sanctions/actions";
import type {
  SanctionsViewProps,
  SanctionsListTab,
  SanctionRuleOption,
  SanctionItem,
  SanctionsModal,
  SanctionsDrawer,
} from "./types";
import styles from "./sanctions-view.module.css";

const DEFAULT_RULES: SanctionRuleOption[] = [
  {
    id: "__default_warn",
    label: "3 absences",
    threshold: 3,
    scopeType: "FACULTY",
    scopeLabel: "Faculty-wide",
    period: "SEMESTER",
    active: true,
  },
  {
    id: "__default_flag",
    label: "5 absences",
    threshold: 5,
    scopeType: "FACULTY",
    scopeLabel: "Faculty-wide",
    period: "SEMESTER",
    active: true,
  },
];

export function SanctionsView({
  sanctions,
  stats,
  rules,
  activityLogs,
  canCreate,
  canResolve,
  scopeOptions,
}: SanctionsViewProps) {
  const router = useRouter();
  const [tab, setTab] = useState<SanctionsListTab>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<SanctionsModal | null>(null);
  const [drawer, setDrawer] = useState<SanctionsDrawer | null>(null);
  const [deletingRule, setDeletingRule] = useState(false);
  const [ruleBusy, setRuleBusy] = useState<null | "adding" | "saving">(null);
  const [resolvingSanction, setResolvingSanction] = useState(false);
  const [confirmResolve, setConfirmResolve] = useState<SanctionItem | null>(null);
  const [isMutating, startTransition] = useTransition();

  const flagRuleSource = rules.filter((r) => r.active).length ? rules.filter((r) => r.active) : DEFAULT_RULES;
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
          router.refresh();
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
        router.refresh();
      }
    });
  };

  const handleCreateRule = (formData: FormData) => {
    const absenceThreshold = Number(formData.get("absenceThreshold"));
    const scopeType = String(formData.get("scopeType") || "FACULTY") as
      | "FACULTY"
      | "PROGRAM"
      | "PROGRAM_YEAR"
      | "SECTION";
    const period = String(formData.get("period") || "SEMESTER") as "SEMESTER" | "EVENT_SERIES";
    const programId = String(formData.get("programId") || "") || undefined;
    const programYearId = String(formData.get("programYearId") || "") || undefined;
    const sectionId = String(formData.get("sectionId") || "") || undefined;
    const active = formData.get("active") === "on";
    if (!Number.isFinite(absenceThreshold) || absenceThreshold < 1) return;
    setRuleBusy("adding");
    startTransition(async () => {
      try {
        const result = await sileo.promise(
          () =>
            createSanctionRule({
              absenceThreshold,
              scopeType,
              period,
              programId,
              programYearId,
              sectionId,
              active,
            }),
          {
            loading: { title: "Adding rule", description: "Creating the sanction rule...", icon: <Loader2 /> },
            success: { title: "Rule added", description: "New sanction rule is active.", icon: <ShieldAlert /> },
            error: (err) => ({ title: "Could not add rule", description: err instanceof Error ? err.message : "Please try again.", icon: <ShieldAlert /> }),
          },
        );
        if (result.ok) {
          setModal(null);
          router.refresh();
        }
      } finally {
        setRuleBusy(null);
      }
    });
  };

  const handleDeleteRule = (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    setDeletingRule(true);
    startTransition(async () => {
      try {
        const result = await sileo.promise(
          () => deleteSanctionRule(ruleId),
          {
            loading: { title: "Deleting rule", description: "Removing the sanction rule...", icon: <Loader2 /> },
            success: { title: "Rule deleted", description: rule ? `${rule.label} was removed.` : "The rule was removed.", icon: <Trash2 /> },
            error: (err) => ({ title: "Could not delete rule", description: err instanceof Error ? err.message : "Please try again.", icon: <ShieldAlert /> }),
          },
        );
        if (result.ok) {
          router.refresh();
        }
      } finally {
        setDeletingRule(false);
      }
    });
  };

  const handleEditRule = (formData: FormData) => {
    const id = String(formData.get("id") || "");
    const absenceThreshold = Number(formData.get("absenceThreshold"));
    const scopeType = String(formData.get("scopeType") || "FACULTY") as
      | "FACULTY"
      | "PROGRAM"
      | "PROGRAM_YEAR"
      | "SECTION";
    const period = String(formData.get("period") || "SEMESTER") as "SEMESTER" | "EVENT_SERIES";
    const programId = String(formData.get("programId") || "") || undefined;
    const programYearId = String(formData.get("programYearId") || "") || undefined;
    const sectionId = String(formData.get("sectionId") || "") || undefined;
    const active = formData.get("active") === "on";
    if (!id || !Number.isFinite(absenceThreshold) || absenceThreshold < 1) return;
    setRuleBusy("saving");
    startTransition(async () => {
      try {
        const result = await sileo.promise(
          () =>
            updateSanctionRule({
              id,
              absenceThreshold,
              scopeType,
              period,
              programId,
              programYearId,
              sectionId,
              active,
            }),
          {
            loading: { title: "Saving rule", description: "Updating the sanction rule...", icon: <Loader2 /> },
            success: { title: "Rule updated", description: "The sanction rule was saved.", icon: <PencilLine /> },
            error: (err) => ({ title: "Could not save rule", description: err instanceof Error ? err.message : "Please try again.", icon: <ShieldAlert /> }),
          },
        );
        if (result.ok) {
          setModal(null);
          router.refresh();
        }
      } finally {
        setRuleBusy(null);
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
              <span className={styles.termBadge}>{stats.termName}</span>
            </div>
            <p className={styles.pageSubtitle}>
              Sanctions are issued automatically when a student&apos;s absences reach
              the set limit. Mark a sanction as cleared once the student has met the
              requirement. Sanction records stay private.
            </p>
          </div>
          {canCreate && (
<div className={styles.actions}>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setDrawer({ kind: "activity" })}
            >
              Activity Logs
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setModal({ kind: "rule" })}
              disabled={isMutating}
            >
              Add Rule
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

      <SanctionsSidebar
        rules={rules}
        canEdit={canEdit}
        onEditRule={(ruleId) => setModal({ kind: "editRule", id: ruleId })}
        onDeleteRule={handleDeleteRule}
      />

      <SanctionsModals
        sanctions={sanctions}
        rules={flagRuleSource}
        activityLogs={activityLogs}
        modal={modal}
        drawer={drawer}
        onCloseModal={() => setModal(null)}
        onCloseDrawer={() => setDrawer(null)}
        onCreateRule={handleCreateRule}
        onEditRule={handleEditRule}
        onEdit={handleEdit}
        canCreate={canCreate}
        scopeOptions={scopeOptions}
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
              resolution and cannot be undone. Type the student's name to continue.
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
        open={deletingRule || resolvingSanction || ruleBusy !== null}
        label={
          deletingRule
            ? "Deleting sanction rule…"
            : resolvingSanction
              ? "Clearing sanction…"
              : ruleBusy === "saving"
                ? "Saving sanction rule…"
                : "Adding sanction rule…"
        }
      />
    </div>
  );
}