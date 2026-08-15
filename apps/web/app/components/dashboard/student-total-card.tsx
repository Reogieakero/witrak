"use client";

import { useState, useTransition, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Users, TrendingUp, Loader2, UserCog, Save } from "lucide-react";
import { sileo } from "sileo";
import { Modal } from "@/app/components/ui/modal";
import { ModalActions } from "@/app/components/ui/modal-actions";
import { LoadingOverlay } from "@/app/components/ui/loading-overlay";
import { updateEnrollmentTargets } from "@/app/admin/dashboard/actions";
import statStyles from "./stat-cards.module.css";
import styles from "./student-total-card.module.css";

export type EnrollmentTarget = {
  id: string;
  code: string;
  name: string;
  count: number | null;
};

type StudentTotalCardProps = {
  total: number;
  programCount: number;
  programs: EnrollmentTarget[];
  canEdit: boolean;
};

export function StudentTotalCard({
  total,
  programCount,
  programs,
  canEdit,
}: StudentTotalCardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);

  const openModal = () => {
    setValues(
      Object.fromEntries(
        programs.map((p) => [p.id, p.count == null ? "" : String(p.count)]),
      ),
    );
    setOpen(true);
  };

  const currentTotal = programs.reduce(
    (sum, p) => sum + (parseInt(values[p.id] ?? "", 10) || 0),
    0,
  );

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setBusyLabel("Saving totals…");
    startTransition(async () => {
      try {
        const entries = programs.map((p) => ({
          programId: p.id,
          count: parseInt(values[p.id] ?? "", 10) || 0,
        }));
        const result = await sileo.promise(
          () => updateEnrollmentTargets(entries),
          {
            loading: {
              title: "Saving totals",
              description: "Recording the official student counts…",
              icon: <Loader2 />,
            },
            success: {
              title: "Totals saved",
              description: "The dashboard Total now reflects the official records.",
              icon: <Save />,
            },
            error: (err) => ({
              title: "Could not save totals",
              description: err instanceof Error ? err.message : "Please try again.",
              icon: <UserCog />,
            }),
          },
        );
        if (result.ok) {
          setOpen(false);
          await router.refresh();
        }
      } finally {
        setBusy(false);
        setBusyLabel(null);
      }
    });
  };

  return (
    <>
      <TooltipContent
        total={total}
        programCount={programCount}
        hasTargets={programs.some((p) => p.count != null)}
        onClick={canEdit ? openModal : undefined}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={
          <span className={styles.modalTitle}>
            <span className={styles.headIcon}>
              <Users size={16} />
            </span>
            <span>
              <span className={styles.titleLine}>Total Students by Program</span>
              <span className={styles.subtitle}>
                Enter the official student count per program. The Total card
                updates from the sum of these.
              </span>
            </span>
          </span>
        }
        footer={
          <ModalActions
            onCancel={() => setOpen(false)}
            cancelLabel={isPending ? "Working…" : "Cancel"}
            confirmType="submit"
            confirmForm="enrollment-target-form"
            confirmLabel={isPending ? "Saving…" : "Save Totals"}
            disabled={isPending}
          />
        }
      >
        <form id="enrollment-target-form" onSubmit={handleSubmit}>
          <div className={styles.intro}>
            Based on the official records (e.g. the registrar&apos;s list). Students
            without an account yet still count toward these totals.
          </div>

          <div className={styles.list}>
            {programs.map((p) => (
              <div key={p.id} className={styles.row}>
                <div className={styles.rowLabel}>
                  <span className={styles.rowName}>{p.name}</span>
                  <span className={styles.rowCode}>{p.code}</span>
                </div>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  className={styles.input}
                  value={values[p.id] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [p.id]: e.target.value }))
                  }
                  placeholder="0"
                  aria-label={`Total students for ${p.name}`}
                />
              </div>
            ))}
          </div>

          <div className={styles.summary}>
            <span>Total across programs</span>
            <strong>{currentTotal.toLocaleString()}</strong>
          </div>
        </form>
      </Modal>

      {typeof document !== "undefined" &&
        createPortal(
          <LoadingOverlay open={busy || isPending} label={busyLabel ?? "Working…"} />,
          document.body,
        )}
    </>
  );
}

function TooltipContent({
  total,
  programCount,
  hasTargets,
  onClick,
}: {
  total: number;
  programCount: number;
  hasTargets: boolean;
  onClick?: () => void;
}) {
  const className = `${statStyles.miniStat} ${statStyles.miniBrand}${
    onClick ? ` ${styles.clickable}` : ""
  }`;
  const inner = (
    <>
      <div className={statStyles.miniHeader}>
        <span>Total</span>
        <span className={statStyles.miniIcon}>
          <Users size={14} />
        </span>
      </div>
      <div className={statStyles.miniValue}>{total.toLocaleString()}</div>
      <div className={statStyles.miniSub}>
        <span className={statStyles.trendText}>
          <TrendingUp size={11} />
          {programCount} programs
        </span>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {inner}
      </button>
    );
  }

  return (
    <div className={statStyles.miniStat + " " + statStyles.miniBrand}>
      {inner}
      {hasTargets && (
        <div className={statStyles.miniSub}>
          <span className={styles.manualNote}>official record</span>
        </div>
      )}
    </div>
  );
}