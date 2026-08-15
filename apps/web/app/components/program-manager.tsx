"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen,
  GraduationCap,
  Loader2,
  PencilLine,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { sileo } from "sileo";
import { Modal } from "@/app/components/ui/modal";
import { Button } from "@/app/components/ui/button";
import { Select } from "@/app/components/ui/select";
import { LoadingOverlay } from "@/app/components/ui/loading-overlay";
import { ConfirmationModal } from "@/app/components/ui/confirmation-modal";
import {
  getProgramStructure,
  createProgram,
  updateProgram,
  deleteProgram,
  createSection,
  updateSection,
  deleteSection,
  type ProgramRow,
} from "@/app/admin/programs/actions";
import styles from "./program-manager.module.css";

type FormMode =
  | { kind: "program"; program?: ProgramRow }
  | { kind: "section"; program: ProgramRow; section?: { id: string; name: string } }
  | null;

export function ProgramManager({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<FormMode>(null);
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<
    | { kind: "program"; label: string; token: string; id: string }
    | { kind: "section"; label: string; token: string; id: string }
    | null
  >(null);
  const [isMutating, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getProgramStructure()
      .then((data) => {
        if (cancelled) return;
        setPrograms(data);
        setLoadError(null);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : "Could not load programs.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const refresh = () => {
    setLoading(true);
    setLoadError(null);
    return getProgramStructure()
      .then(setPrograms)
      .catch((e) =>
        setLoadError(e instanceof Error ? e.message : "Could not load programs."),
      )
      .finally(() => setLoading(false));
  };

  const run = (label: string, fn: () => Promise<{ ok: boolean; error?: string }>) => {
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
            icon: <BookOpen />,
          }),
        });
        if (result.ok) {
          setMode(null);
          setConfirmDelete(null);
          await refresh();
        }
      } finally {
        setBusy(false);
        setBusyLabel(null);
      }
    });
  };

  const handleProgram = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const code = String(fd.get("code") || "");
    const name = String(fd.get("name") || "");
    if (mode?.kind === "program" && mode.program) {
      run("Program updated", () => updateProgram({ id: mode.program!.id, code, name }));
    } else {
      run("Program created", () => createProgram({ code, name }));
    }
  };

  const handleSection = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "");
    const programYearId = String(fd.get("programYearId") || "");
    if (mode?.kind === "section" && mode.section) {
      run("Section updated", () => updateSection({ id: mode.section!.id, name }));
    } else if (programYearId) {
      run("Section created", () => createSection({ programYearId, name }));
    }
  };

  const confirmRemove = () => {
    if (!confirmDelete) return;
    if (confirmDelete.kind === "program") {
      run("Program deleted", () => deleteProgram(confirmDelete.id));
    } else {
      run("Section deleted", () => deleteSection(confirmDelete.id));
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={
          <span className={styles.modalTitle}>
            <span className={styles.headIcon}>
              <GraduationCap size={16} />
            </span>
            <span>
              <span className={styles.titleLine}>Programs &amp; Sections</span>
              <span className={styles.subtitle}>
                Add or edit the programs and sections in the faculty.
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
      {loading && <div className={styles.loading}>Loading programs…</div>}

      {!loading && loadError && (
        <div className={styles.error}>
          <span>{loadError}</span>
          <Button variant="secondary" size="sm" onClick={refresh} type="button">
            Retry
          </Button>
        </div>
      )}

      {!loading && !loadError && !mode && (
        <div className={styles.body}>
          <div className={styles.bodyHead}>
            <span className={styles.bodyCount}>
              {programs.length} {programs.length === 1 ? "program" : "programs"}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setMode({ kind: "program" })}
              disabled={isMutating}
            >
              <Plus size={14} />
              Add Program
            </Button>
          </div>

          {programs.length === 0 ? (
            <div className={styles.empty}>
              No programs yet. Add the first program to get started.
            </div>
          ) : (
            <div className={styles.list}>
              {programs.map((p) => (
                <div key={p.id} className={styles.programCard}>
                  <div className={styles.programHead}>
                    <div className={styles.programMeta}>
                      <span className={styles.programName}>{p.name}</span>
                      <span className={styles.programCode}>{p.code}</span>
                    </div>
                    <div className={styles.programActions}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setMode({ kind: "program", program: p })}
                        disabled={isMutating}
                      >
                        <PencilLine size={13} />
                        Edit
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setMode({ kind: "section", program: p })
                        }
                        disabled={isMutating}
                      >
                        <Plus size={13} />
                        Section
                      </Button>
                      <button
                        type="button"
                        className={styles.iconDanger}
                        onClick={() =>
                          setConfirmDelete({
                            kind: "program",
                            label: p.name,
                            token: p.code,
                            id: p.id,
                          })
                        }
                        aria-label={`Delete ${p.name}`}
                        title="Delete program"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.yearLevels}>
                    {p.yearLevels.map((yl) => (
                      <div key={yl.id} className={styles.yearBlock}>
                        <span className={styles.yearLabel}>Year {yl.level}</span>
                        <div className={styles.sectionChips}>
                          {yl.sections.length === 0 && (
                            <span className={styles.noSections}>No sections</span>
                          )}
                          {yl.sections.map((s) => (
                            <span key={s.id} className={styles.sectionChip}>
                              {s.name}
                              <button
                                type="button"
                                className={styles.chipEdit}
                                onClick={() =>
                                  setMode({
                                    kind: "section",
                                    program: p,
                                    section: s,
                                  })
                                }
                                aria-label={`Edit section ${s.name}`}
                                title={`Edit ${s.name}`}
                              >
                                <PencilLine size={11} />
                              </button>
                              <button
                                type="button"
                                className={styles.chipDelete}
                                onClick={() =>
                                  setConfirmDelete({
                                    kind: "section",
                                    label: `${p.code} Y${yl.level}-${s.name}`,
                                    token: s.name,
                                    id: s.id,
                                  })
                                }
                                aria-label={`Delete section ${s.name}`}
                                title={`Delete ${s.name}`}
                              >
                                <X size={11} />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && !loadError && mode?.kind === "program" && (
        <ProgramForm mode={mode} busy={busy} onCancel={() => setMode(null)} onSubmit={handleProgram} />
      )}

      {!loading && !loadError && mode?.kind === "section" && (
        <SectionForm
          mode={mode}
          busy={busy}
          onCancel={() => setMode(null)}
          onSubmit={handleSection}
        />
      )}

      {confirmDelete && (
        <ConfirmationModal
          open
          title={
            confirmDelete.kind === "program"
              ? "Delete this program?"
              : "Delete this section?"
          }
          description={
            <>
              You are about to delete{" "}
              <strong>{confirmDelete.label}</strong>
              {confirmDelete.kind === "program" ? (
                <>
                  . Programs with existing sections or students cannot be deleted.
                </>
              ) : (
                <>. Sections with existing students cannot be deleted.</>
              )}{" "}
              This cannot be undone. Type{" "}
              <code className={styles.token}>{confirmDelete.token}</code> to continue.
            </>
          }
          confirmLabel={
            confirmDelete.kind === "program" ? "Delete Program" : "Delete Section"
          }
          confirmToken={confirmDelete.token}
          onConfirm={confirmRemove}
          onClose={() => setConfirmDelete(null)}
        />
      )}

      </Modal>

      {typeof document !== "undefined" &&
        createPortal(
          <LoadingOverlay open={busy || isMutating} label={busyLabel ?? "Working…"} />,
          document.body,
        )}
    </>
  );
}

function ProgramForm({
  mode,
  busy,
  onCancel,
  onSubmit,
}: {
  mode: Extract<FormMode, { kind: "program" }>;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}) {
  const editing = mode.program;
  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.formTitle}>{editing ? "Edit Program" : "Add Program"}</div>
      <div className={styles.field}>
        <label className={styles.label}>
          Program code <span className={styles.required}>*</span>
        </label>
        <input
          name="code"
          className={styles.input}
          defaultValue={editing?.code ?? ""}
          placeholder="e.g. BS-CS"
          maxLength={20}
          required
        />
        <span className={styles.hint}>
          Short code shown in the system, e.g. <strong>BSPSYCH</strong>.
        </span>
      </div>
      <div className={styles.field}>
        <label className={styles.label}>
          Program name <span className={styles.required}>*</span>
        </label>
        <input
          name="name"
          className={styles.input}
          defaultValue={editing?.name ?? ""}
          placeholder="e.g. BS Computer Science"
          maxLength={120}
          required
        />
      </div>
      <div className={styles.formActions}>
        <Button variant="secondary" size="md" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button variant="primary" size="md" type="submit" disabled={busy}>
          {busy ? "Saving…" : editing ? "Save Changes" : "Add Program"}
        </Button>
      </div>
    </form>
  );
}

function SectionForm({
  mode,
  busy,
  onCancel,
  onSubmit,
}: {
  mode: Extract<FormMode, { kind: "section" }>;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}) {
  const editing = mode.section;
  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.formTitle}>
        {editing ? "Edit Section" : `Add Section · ${mode.program.code}`}
      </div>
      <div className={styles.field}>
        <label className={styles.label}>
          Year level <span className={styles.required}>*</span>
        </label>
        <Select
          name="programYearId"
          value={editing ? mode.program.yearLevels.find((yl) => yl.sections.some((s) => s.id === editing.id))?.id : undefined}
          options={mode.program.yearLevels.map((yl) => ({
            value: yl.id,
            label: `Year ${yl.level}`,
          }))}
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>
          Section name <span className={styles.required}>*</span>
        </label>
        <input
          name="name"
          className={styles.input}
          defaultValue={editing?.name ?? ""}
          placeholder="e.g. A"
          maxLength={4}
          required
        />
        <span className={styles.hint}>
          One letter per section, e.g. <strong>A</strong>, <strong>B</strong>.
        </span>
      </div>
      <div className={styles.formActions}>
        <Button variant="secondary" size="md" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button variant="primary" size="md" type="submit" disabled={busy}>
          {busy ? "Saving…" : editing ? "Save Changes" : "Add Section"}
        </Button>
      </div>
    </form>
  );
}