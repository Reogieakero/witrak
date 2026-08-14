"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { createPortal } from "react-dom";
import {
  CalendarRange,
  Check,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { sileo } from "sileo";
import { Modal } from "@/app/components/ui/modal";
import { Button } from "@/app/components/ui/button";
import { Select } from "@/app/components/ui/select";
import { DatePicker } from "@/app/components/ui/date-picker";
import { LoadingOverlay } from "@/app/components/ui/loading-overlay";
import { ConfirmationModal } from "@/app/components/ui/confirmation-modal";
import {
  getTerms,
  createTerm,
  setActiveTerm,
  deleteTerm,
  type TermRow,
  type PeriodType,
} from "@/app/admin/terms/actions";
import styles from "./term-manager.module.css";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function toDateInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function TermManager({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [terms, setTerms] = useState<TermRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    label: string;
    token: string;
    id: string;
  } | null>(null);
  const [isMutating, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setAdding(false);
    getTerms()
      .then((data) => {
        if (cancelled) return;
        setTerms(data);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : "Could not load terms.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const refresh = () => {
    setLoading(true);
    setLoadError(null);
    getTerms()
      .then(setTerms)
      .catch((e) =>
        setLoadError(e instanceof Error ? e.message : "Could not load terms."),
      )
      .finally(() => setLoading(false));
  };

  const run = (
    label: string,
    fn: () => Promise<{ ok: boolean; error?: string }>,
  ) => {
    setBusy(true);
    setBusyLabel(`${label}…`);
    startTransition(async () => {
      try {
        const result = await sileo.promise(fn, {
          loading: { title: label, description: "Working…", icon: <Loader2 /> },
          success: { title: "Saved", description: `${label} was saved.`, icon: <Save /> },
          error: (err) => ({
            title: "Could not save",
            description: err instanceof Error ? err.message : "Please try again.",
            icon: <CalendarRange />,
          }),
        });
        if (result.ok) {
          setAdding(false);
          setConfirmDelete(null);
          refresh();
        }
      } finally {
        setBusy(false);
        setBusyLabel(null);
      }
    });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "");
    const periodType = (String(fd.get("periodType") || "SEMESTER") ||
      "SEMESTER") as PeriodType;
    const startsOn = String(fd.get("startsOn") || "");
    const endsOn = String(fd.get("endsOn") || "");
    const setActive = fd.get("setActive") === "on";
    run("Term created", () =>
      createTerm({ name, periodType, startsOn, endsOn, setActive }),
    );
  };

  const handleSetActive = (id: string) => {
    run("Term activated", () => setActiveTerm(id));
  };

  const confirmRemove = () => {
    if (!confirmDelete) return;
    run("Term deleted", () => deleteTerm(confirmDelete.id));
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={
          <span className={styles.modalTitle}>
            <span className={styles.headIcon}>
              <CalendarRange size={16} />
            </span>
            <span>
              <span className={styles.titleLine}>Academic Terms</span>
              <span className={styles.subtitle}>
                Add terms and choose which one is active across the system.
              </span>
            </span>
          </span>
        }
        footer={
          <div className={styles.footer}>
            <Button variant="secondary" size="md" onClick={onClose} type="button">
              Close
            </Button>
          </div>
        }
      >
        {loading && <div className={styles.loading}>Loading terms…</div>}

        {!loading && loadError && (
          <div className={styles.error}>
            <span>{loadError}</span>
            <Button variant="secondary" size="sm" onClick={refresh} type="button">
              Retry
            </Button>
          </div>
        )}

        {!loading && !loadError && !adding && (
          <div className={styles.body}>
            <div className={styles.bodyHead}>
              <span className={styles.bodyCount}>
                {terms.length} {terms.length === 1 ? "term" : "terms"}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setAdding(true)}
                disabled={isMutating}
              >
                <Plus size={14} />
                Add Term
              </Button>
            </div>

            {terms.length === 0 ? (
              <div className={styles.empty}>
                No terms yet. Add the first academic term to get started.
              </div>
            ) : (
              <div className={styles.list}>
                {terms.map((t) => (
                  <div
                    key={t.id}
                    className={`${styles.termCard} ${t.isActive ? styles.termCardActive : ""}`}
                  >
                    <div className={styles.termHead}>
                      <div className={styles.termMeta}>
                        <span className={styles.termName}>{t.name}</span>
                        <span className={styles.termDates}>
                          {formatDate(t.startsOn)} – {formatDate(t.endsOn)}
                        </span>
                      </div>
                      <div className={styles.termActions}>
                        {t.isActive ? (
                          <span className={styles.activeBadge}>
                            <Check size={12} />
                            Active
                          </span>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSetActive(t.id)}
                            disabled={isMutating}
                          >
                            Set active
                          </Button>
                        )}
                        <button
                          type="button"
                          className={styles.iconDanger}
                          onClick={() =>
                            setConfirmDelete({
                              label: t.name,
                              token: t.name,
                              id: t.id,
                            })
                          }
                          aria-label={`Delete ${t.name}`}
                          title="Delete term"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && !loadError && adding && (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formTitle}>Add Term</div>
            <div className={styles.field}>
              <label className={styles.label}>
                Term name <span className={styles.required}>*</span>
              </label>
              <input
                name="name"
                className={styles.input}
                placeholder="e.g. SY 2025-2026 1st Semester"
                maxLength={120}
                required
              />
              <span className={styles.hint}>
                Include the school year and term, e.g.{" "}
                <strong>SY 2025-2026 2nd Semester</strong>.
              </span>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Period type</label>
              <Select
                name="periodType"
                value="SEMESTER"
                options={[
                  { value: "SEMESTER", label: "Semester" },
                  { value: "EVENT_SERIES", label: "Event series" },
                ]}
              />
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Start date <span className={styles.required}>*</span>
                </label>
                <DatePicker name="startsOn" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  End date <span className={styles.required}>*</span>
                </label>
                <DatePicker name="endsOn" />
              </div>
            </div>
            <label className={styles.checkRow}>
              <input type="checkbox" name="setActive" />
              <span>Set as the active term (displayed across the system)</span>
            </label>
            <div className={styles.formActions}>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setAdding(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit" disabled={busy}>
                {busy ? "Saving…" : "Add Term"}
              </Button>
            </div>
          </form>
        )}

        {confirmDelete && (
          <ConfirmationModal
            open
            title="Delete this term?"
            description={
              <>
                You are about to delete <strong>{confirmDelete.label}</strong>. This
                cannot be undone. Type{" "}
                <code className={styles.token}>{confirmDelete.token}</code> to continue.
              </>
            }
            confirmLabel="Delete Term"
            confirmToken={confirmDelete.token}
            onConfirm={confirmRemove}
            onClose={() => setConfirmDelete(null)}
          />
        )}
      </Modal>

      {typeof document !== "undefined" &&
        createPortal(
          <LoadingOverlay open={busy} label={busyLabel ?? "Working…"} />,
          document.body,
        )}
    </>
  );
}
