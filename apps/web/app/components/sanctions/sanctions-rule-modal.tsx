"use client";

import { useState } from "react";
import { SlidersHorizontal, Info } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Select } from "@/app/components/ui/select";
import { ModalShell, ModalHeader } from "./sanctions-modal-shell";
import type {
  SanctionScopeOptions,
  SanctionRuleOption,
  SanctionScopeType,
  FormHandler,
} from "./types";
import styles from "./sanctions-modals.module.css";

export function RuleModal({
  scopeOptions,
  editing,
  onCreateRule,
  onEditRule,
  onClose,
}: {
  scopeOptions: SanctionScopeOptions;
  editing?: SanctionRuleOption;
  onCreateRule: FormHandler;
  onEditRule: FormHandler;
  onClose: () => void;
}) {
  const [scopeType, setScopeType] = useState<SanctionScopeType>(
    editing?.scopeType ?? "FACULTY",
  );
  const yearLevelById = new Map(scopeOptions.programYears.map((y) => [y.id, y.level]));

  const scopeOptionsList: { value: string; label: string }[] = [
    { value: "FACULTY", label: "Faculty-wide" },
    { value: "PROGRAM", label: "Program" },
    { value: "SECTION", label: "Section" },
  ];
  if (editing?.scopeType === "PROGRAM_YEAR") {
    scopeOptionsList.splice(2, 0, { value: "PROGRAM_YEAR", label: "Program year" });
  }

  return (
    <ModalShell onClose={onClose}>
      <ModalHeader
        tone="soft"
        icon={<SlidersHorizontal size={16} />}
        title={editing ? "Edit Sanction Rule" : "Add Sanction Rule"}
        subtitle={editing ? `${editing.threshold} absences` : "Threshold that auto-issues a sanction when met"}
        onClose={onClose}
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          if (editing) onEditRule(fd);
          else onCreateRule(fd);
        }}
      >
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <div className={styles.body}>
          <div className={styles.field}>
            <label>Absence threshold</label>
            <input
              type="number"
              name="absenceThreshold"
              min={1}
              max={100}
              required
              defaultValue={editing?.threshold}
              placeholder="e.g. 5"
            />
          </div>
          <div className={styles.field}>
            <label>Scope</label>
            <Select
              name="scopeType"
              value={scopeType}
              placeholder="Faculty-wide"
              onChange={(v) => setScopeType(v as SanctionScopeType)}
              options={scopeOptionsList}
            />
          </div>
          {scopeType === "PROGRAM" && (
            <div className={styles.field}>
              <label>Program</label>
              <Select
                name="programId"
                value={editing?.programId}
                placeholder="Select a program…"
                options={scopeOptions.programs.map((p) => ({
                  value: p.id,
                  label: `${p.code} — ${p.name}`,
                }))}
              />
            </div>
          )}
          {scopeType === "PROGRAM_YEAR" && (
            <div className={styles.field}>
              <label>Program year</label>
              <Select
                name="programYearId"
                value={editing?.programYearId}
                placeholder="Select a year level…"
                options={scopeOptions.programYears.map((y) => ({
                  value: y.id,
                  label: `Year ${y.level}`,
                }))}
              />
            </div>
          )}
          {scopeType === "SECTION" && (
            <div className={styles.field}>
              <label>Section</label>
              <Select
                name="sectionId"
                value={editing?.sectionId}
                placeholder="Select a section…"
                options={scopeOptions.sections.map((s) => ({
                  value: s.id,
                  label: `Year ${yearLevelById.get(s.programYearId) ?? "?"} — ${s.name}`,
                }))}
              />
            </div>
          )}
          <div className={styles.field}>
            <label>Period</label>
            <Select
              name="period"
              value={editing?.period ?? "SEMESTER"}
              placeholder="Semester"
              options={[
                { value: "SEMESTER", label: "Semester" },
                { value: "EVENT_SERIES", label: "Event series" },
              ]}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.checkRow}>
              <input type="checkbox" name="active" defaultChecked={editing?.active ?? true} /> Active
            </label>
          </div>
          <p className={styles.note}>
            <Info size={12} className={styles.flexNone} />
            <span>
              When a student's absences meet the threshold, the sanction is <code>auto-issued</code>;
              the admin / president clears it once the student fulfills the requirement.
            </span>
          </p>
        </div>
        <div className={styles.footer}>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm">
            {editing ? "Save Changes" : "Add Rule"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
