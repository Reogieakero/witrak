"use client";

import { useState } from "react";
import { ListChecks } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { ModalShell, ModalHeader } from "./sanctions-modal-shell";
import type { SanctionFineRow } from "./types";
import styles from "./sanctions-modals.module.css";

const COUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function FinesModal({
  fines,
  onSave,
  onClose,
}: {
  fines: SanctionFineRow[];
  onSave: (rows: SanctionFineRow[]) => void;
  onClose: () => void;
}) {
  const initial = new Map(fines.map((f) => [f.absenceCount, f]));
  const [rows, setRows] = useState<SanctionFineRow[]>(
    COUNTS.map((c) => {
      const f = initial.get(c);
      return {
        absenceCount: c,
        title: f?.title ?? `${c} Absence${c > 1 ? "s" : ""}`,
        description: f?.description ?? "",
      };
    }),
  );

  const update = (count: number, patch: Partial<SanctionFineRow>) =>
    setRows((prev) =>
      prev.map((r) => (r.absenceCount === count ? { ...r, ...patch } : r)),
    );

  return (
    <ModalShell onClose={onClose}>
      <ModalHeader
        tone="soft"
        icon={<ListChecks size={16} />}
        title="Sanction Requirements"
        subtitle="What each absence count requires the student to submit"
        onClose={onClose}
      />
      <div className={styles.body}>
        <div className={styles.fineBanner}>
          <p className={styles.fineBannerTitle}>Absence Requirement Catalog</p>
          <p className={styles.fineBannerText}>
            Set the item a student must submit for each number of absences. A
            student is sanctioned against the requirement matching the largest
            count at or below their absence total.
          </p>
        </div>
        <div className={styles.fineList}>
          {rows.map((r) => (
            <div key={r.absenceCount} className={styles.fineRow}>
              <div className={styles.fineCount}>
                <span className={styles.fineCountValue}>{r.absenceCount}</span>
                <span className={styles.fineCountUnit}>
                  absence{r.absenceCount === 1 ? "" : "s"}
                </span>
              </div>
              <div className={styles.fineFields}>
                <div className={styles.fineField}>
                  <label
                    className={styles.fineFieldLabel}
                    htmlFor={`fine-title-${r.absenceCount}`}
                  >
                    Requirement title
                  </label>
                  <input
                    id={`fine-title-${r.absenceCount}`}
                    className={styles.fineInput}
                    value={r.title}
                    onChange={(e) =>
                      update(r.absenceCount, { title: e.target.value })
                    }
                    placeholder="e.g. 2 Absences"
                  />
                </div>
                <div className={styles.fineField}>
                  <label
                    className={styles.fineFieldLabel}
                    htmlFor={`fine-description-${r.absenceCount}`}
                  >
                    Instruction
                  </label>
                  <input
                    id={`fine-description-${r.absenceCount}`}
                    className={styles.fineInput}
                    value={r.description}
                    onChange={(e) =>
                      update(r.absenceCount, { description: e.target.value })
                    }
                    placeholder="e.g. Submit 1 notebook to your officer"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.footer}>
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => onSave(rows)}
        >
          Save Requirements
        </Button>
      </div>
    </ModalShell>
  );
}
