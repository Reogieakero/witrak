"use client";

import { useState } from "react";
import { SlidersHorizontal, ShieldCheck, Pencil, Trash2, ExternalLink, X } from "lucide-react";
import type { SanctionRuleOption } from "./types";
import styles from "./sanctions-sidebar.module.css";

export function SanctionsSidebar({
  rules,
  canEdit,
  onEditRule,
  onDeleteRule,
}: {
  rules: SanctionRuleOption[];
  canEdit: boolean;
  onEditRule: (ruleId: string) => void;
  onDeleteRule: (ruleId: string) => void;
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const activeCount = rules.filter((r) => r.active).length;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.card}>
        <div className={styles.cardHead}>
          <h3 className={styles.cardTitle}>
            <SlidersHorizontal size={16} />
            Sanction Rules
          </h3>
          <span className={styles.cardCount}>
            {activeCount} active / {rules.length}
          </span>
        </div>

        <div className={styles.list}>
          {rules.length === 0 && (
            <p className={styles.empty}>No sanction rules yet. Add one to start issuing.</p>
          )}
          {rules.map((r) =>
            confirmId === r.id ? (
              <div key={r.id} className={styles.item} data-confirm>
                <div className={styles.confirmHead}>
                  <span className={styles.confirmText}>Delete this rule?</span>
                  <button
                    type="button"
                    className={styles.confirmBtn}
                    data-tone="danger"
                    onClick={() => onDeleteRule(r.id)}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    className={styles.confirmBtn}
                    onClick={() => setConfirmId(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={styles.confirmClose}
                    title="Cancel"
                    onClick={() => setConfirmId(null)}
                  >
                    <X size={12} />
                  </button>
                </div>
                <span className={styles.confirmScope}>
                  {r.threshold} absences · {r.scopeLabel}
                </span>
              </div>
            ) : (
              <div key={r.id} className={styles.item} data-inactive={!r.active || undefined}>
                <div className={styles.ruleHead}>
                  <span className={styles.ruleBadge}>{r.threshold} absences</span>
                  {canEdit && (
                    <div className={styles.ruleActions}>
                      <button
                        type="button"
                        className={styles.editBtn}
                        title="Edit rule"
                        onClick={() => onEditRule(r.id)}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        title="Delete rule"
                        onClick={() => setConfirmId(r.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
                <span className={styles.ruleScope}>{r.scopeLabel}</span>
                <div className={styles.ruleMeta}>
                  <span>{r.period === "SEMESTER" ? "Semester" : "Event series"}</span>
                  <span className={r.active ? styles.stateActive : styles.stateInactive}>
                    {r.active ? "Active" : "Paused"}
                  </span>
                </div>
              </div>
            ),
          )}
        </div>
      </div>

      <div className={`${styles.card} ${styles.policyCard}`}>
        <div className={styles.cardHead}>
          <h3 className={styles.cardTitle}>
            <ShieldCheck size={16} />
            Sanction Policy
          </h3>
        </div>
        <p className={styles.policyText}>
          When a student's absences meet an active rule's threshold, a sanction is auto-issued and
          audit-logged; the admin / president clears it once the student fulfills the requirement.
          Records are private (DESIGN.md §7) — visible only to the admin / president and the
          Discipline Officer within their assigned scope.
        </p>
        <div className={styles.policyFooter}>
          <span>Admin edits rules</span>
          <ExternalLink size={12} />
        </div>
      </div>
    </aside>
  );
}
