"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HandCoins, Loader2, PlusCircle, PencilLine, Trash2 } from "lucide-react";
import { sileo } from "sileo";
import { Button } from "@/app/components/ui/button";
import { LoadingOverlay } from "@/app/components/ui/loading-overlay";
import { ConfirmationModal } from "@/app/components/ui/confirmation-modal";
import { FeesStatsGrid } from "./fees-stats";
import { FeesTables } from "./fees-tables";
import { FeesModals } from "./fees-modals";
import { FeesSidebar } from "./fees-sidebar";
import { createFee, updateFee, deleteFee, verifyFeeProof, recordPayment, upsertPaymentMethod, deletePaymentMethod } from "@/app/admin/fees/actions";
import type {
  FeesViewProps,
  FeesListTab,
  FeesModal,
  FeesDrawer,
  FeeItem,
  PaymentMethodItem,
} from "./types";
import styles from "./fees-view.module.css";

export function FeesView({
  fees,
  proofRows,
  balanceRows,
  paymentMethods,
  stats,
  canCreate,
  canVerify,
}: FeesViewProps) {
  const router = useRouter();
  const [tab, setTab] = useState<FeesListTab>("balances");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<FeesModal | null>(null);
  const [drawer, setDrawer] = useState<FeesDrawer | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<FeeItem | null>(null);
  const [confirmDeleteMethod, setConfirmDeleteMethod] = useState<PaymentMethodItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [isMutating, startTransition] = useTransition();

  const pendingProofs = proofRows.filter((p) => p.status === "PENDING");
  const students = balanceRows.map((r) => ({
    id: r.id,
    name: r.studentName,
    studentNo: r.studentNo,
  }));

  const handleTab = (next: FeesListTab) => {
    setTab(next);
    setPage(1);
  };

  const handleQuery = (next: string) => {
    setQuery(next);
    setPage(1);
  };

  const handleCreate = (formData: FormData) => {
    const title = String(formData.get("title") || "");
    const amount = Number(formData.get("amount"));
    const dueDate = String(formData.get("dueDate") || "");
    if (!title || !Number.isFinite(amount) || amount <= 0 || !dueDate) return;
    setBusy(true);
    setBusyLabel("Posting the new fee…");
    startTransition(async () => {
      try {
        const result = await sileo.promise(
          () => createFee({ title, amount, dueDate }),
          {
            loading: { title: "Creating fee", description: "Posting the new fee…", icon: <Loader2 /> },
            success: { title: "Fee created", description: `${title} is now visible to students.`, icon: <PlusCircle /> },
            error: (err) => ({ title: "Could not create fee", description: err instanceof Error ? err.message : "Please try again.", icon: <HandCoins /> }),
          },
        );
        if (result.ok) {
          setModal(null);
          await router.refresh();
        }
      } finally {
        setBusy(false);
        setBusyLabel(null);
      }
    });
  };

  const handleUpdateFee = (formData: FormData) => {
    const id = String(formData.get("id") || "");
    const title = String(formData.get("title") || "");
    const amount = Number(formData.get("amount"));
    const dueDate = String(formData.get("dueDate") || "");
    if (!id || !title || !Number.isFinite(amount) || amount <= 0 || !dueDate) return;
    setBusy(true);
    setBusyLabel("Saving fee changes…");
    startTransition(async () => {
      try {
        const result = await sileo.promise(
          () => updateFee({ id, title, amount, dueDate }),
          {
            loading: { title: "Saving fee", description: "Updating the fee details…", icon: <Loader2 /> },
            success: { title: "Fee updated", description: `${title} was saved.`, icon: <PencilLine /> },
            error: (err) => ({ title: "Could not update fee", description: err instanceof Error ? err.message : "Please try again.", icon: <HandCoins /> }),
          },
        );
        if (result.ok) {
          setModal(null);
          await router.refresh();
        }
      } finally {
        setBusy(false);
        setBusyLabel(null);
      }
    });
  };

  const handleDeleteFee = (feeId: string) => {
    const fee = fees.find((f) => f.id === feeId);
    setBusy(true);
    setBusyLabel("Deleting fee…");
    startTransition(async () => {
      try {
        const result = await sileo.promise(
          () => deleteFee(feeId),
          {
            loading: { title: "Deleting fee", description: "Removing the fee and its proofs…", icon: <Loader2 /> },
            success: { title: "Fee deleted", description: fee ? `${fee.title} was removed.` : "The fee was removed.", icon: <Trash2 /> },
            error: (err) => ({ title: "Could not delete fee", description: err instanceof Error ? err.message : "Please try again.", icon: <HandCoins /> }),
          },
        );
        if (result.ok) {
          setConfirmDelete(null);
          await router.refresh();
        }
      } finally {
        setBusy(false);
        setBusyLabel(null);
      }
    });
  };

  const handleVerify = (
    proofId: string,
    decision: "approve" | "reject",
    reason?: string,
  ) => {
    setBusy(true);
    setBusyLabel(
      decision === "approve" ? "Verifying payment…" : "Recording rejection…",
    );
    startTransition(async () => {
      try {
        const result = await sileo.promise(
          () => verifyFeeProof({ proofId, decision, rejectionReason: reason }),
          {
            loading: {
              title: decision === "approve" ? "Verifying payment" : "Rejecting proof",
              description: decision === "approve" ? "Marking the payment as paid…" : "Recording the rejection…",
              icon: <Loader2 />,
            },
            success: {
              title: decision === "approve" ? "Payment verified" : "Proof rejected",
              description: decision === "approve" ? "The student balance updated." : "The student will see the reason.",
              icon: <HandCoins />,
            },
            error: (err) => ({ title: "Could not update proof", description: err instanceof Error ? err.message : "Please try again.", icon: <HandCoins /> }),
          },
        );
        if (result.ok) {
          setModal(null);
          setDrawer(null);
          await router.refresh();
        }
      } finally {
        setBusy(false);
        setBusyLabel(null);
      }
    });
  };

  const handleRecordPayment = (input: {
    studentId: string;
    feeId: string;
    method?: string;
    reference?: string;
    accountName?: string;
  }) => {
    setBusy(true);
    setBusyLabel("Recording payment…");
    startTransition(async () => {
      try {
        const result = await sileo.promise(
          () => recordPayment(input),
          {
            loading: { title: "Recording payment", description: "Saving the payment details…", icon: <Loader2 /> },
            success: { title: "Payment recorded", description: "The student balance is marked as paid.", icon: <HandCoins /> },
            error: (err) => ({ title: "Could not record payment", description: err instanceof Error ? err.message : "Please try again.", icon: <HandCoins /> }),
          },
        );
        if (result.ok) {
          setModal(null);
          await router.refresh();
        }
      } finally {
        setBusy(false);
        setBusyLabel(null);
      }
    });
  };

  const handleUpsertMethod = (input: {
    id?: string;
    type: string;
    accountName: string;
    accountNumber?: string;
    instructions?: string;
    active?: boolean;
  }) => {
    setBusy(true);
    setBusyLabel(input.id ? "Updating method…" : "Adding method…");
    startTransition(async () => {
      try {
        const result = await sileo.promise(
          () => upsertPaymentMethod(input),
          {
            loading: { title: input.id ? "Updating method" : "Adding method", description: "Saving payment method…", icon: <Loader2 /> },
            success: { title: "Payment method saved", description: "Students will see this under where to pay.", icon: <HandCoins /> },
            error: (err) => ({ title: "Could not save method", description: err instanceof Error ? err.message : "Please try again.", icon: <HandCoins /> }),
          },
        );
        if (result.ok) {
          setModal(null);
          await router.refresh();
        }
      } finally {
        setBusy(false);
        setBusyLabel(null);
      }
    });
  };

  const handleDeleteMethod = (id: string) => {
    setBusy(true);
    setBusyLabel("Removing method…");
    startTransition(async () => {
      try {
        const result = await sileo.promise(
          () => deletePaymentMethod(id),
          {
            loading: { title: "Removing method", description: "Deleting payment method…", icon: <Loader2 /> },
            success: { title: "Method removed", description: "It no longer appears to students.", icon: <HandCoins /> },
            error: (err) => ({ title: "Could not remove method", description: err instanceof Error ? err.message : "Please try again.", icon: <HandCoins /> }),
          },
        );
        if (result.ok) {
          setConfirmDeleteMethod(null);
          await router.refresh();
        }
      } finally {
        setBusy(false);
        setBusyLabel(null);
      }
    });
  };

  const openProof = (proofId: string) => {
    const exists = proofRows.some((p) => p.id === proofId);
    if (exists) setDrawer({ kind: "proof", proofId });
  };

  return (
    <div className={styles.page}>
      <div className={styles.mainCol}>
        <div className={styles.pageHeader}>
          <div>
            <div className={styles.titleRow}>
              <h1 className={styles.pageTitle}>Fees</h1>
              <span className={styles.termBadge}>{stats.termName}</span>
            </div>
            <p className={styles.pageSubtitle}>
              Post student fees (e.g. membership fee, org shirt) and track every
              student&apos;s payment status. Students upload receipts, which you
              approve or reject.
            </p>
          </div>
          {canCreate && (
            <div className={styles.actions}>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setModal({ kind: "fee" })}
                disabled={isMutating}
              >
                New Fee
              </Button>
            </div>
          )}
        </div>

        <FeesStatsGrid stats={stats} />

        <FeesTables
          fees={fees}
          proofRows={proofRows}
          balanceRows={balanceRows}
          tab={tab}
          query={query}
          page={page}
          canVerify={canVerify}
          onTab={handleTab}
          onQuery={handleQuery}
          onPageChange={setPage}
          onOpenProof={openProof}
          onVerify={(proofId) => setModal({ kind: "verify", proofId })}
          disabled={isMutating}
        />
      </div>

      <FeesSidebar
        canCreate={canCreate}
        canVerify={canVerify}
        pendingProofId={pendingProofs[0]?.id}
        onCreateFee={() => setModal({ kind: "fee" })}
        onVerifyQuick={() => {
          const first = pendingProofs[0];
          if (first) setModal({ kind: "verify", proofId: first.id });
        }}
        onPaymentDetails={() => {
          const latest = proofRows[0];
          if (latest) setDrawer({ kind: "proof", proofId: latest.id });
        }}
        onRecordPayment={() => setModal({ kind: "record" })}
        paymentMethods={paymentMethods}
        onAddMethod={() => setModal({ kind: "method" })}
        onEditMethod={(id) => setModal({ kind: "editMethod", id })}
        onDeleteMethod={(m) => setConfirmDeleteMethod(m)}
        fees={fees}
        onEditFee={(feeId) => setModal({ kind: "edit", feeId })}
        onDeleteFee={(feeId) => {
          const fee = fees.find((f) => f.id === feeId) ?? null;
          setConfirmDelete(fee);
        }}
        stats={stats}
      />

      <FeesModals
        fees={fees}
        proofs={proofRows}
        students={students}
        paymentMethods={paymentMethods}
        modal={modal}
        drawer={drawer}
        busy={busy}
        onCloseModal={() => setModal(null)}
        onCloseDrawer={() => setDrawer(null)}
        onCreateFee={handleCreate}
        onEditFee={handleUpdateFee}
        onVerify={handleVerify}
        onRecordPayment={handleRecordPayment}
        onUpsertMethod={handleUpsertMethod}
      />

      {confirmDelete && (
        <ConfirmationModal
          open
          title="Delete this fee?"
          description={
            <>
              You are about to delete <strong>{confirmDelete.title}</strong> (₱
              {confirmDelete.amountValue.toFixed(2)}). All payment proofs and balance
              records for this fee will also be removed. This cannot be undone. Type the
              fee title to continue.
            </>
          }
          confirmLabel="Delete Fee"
          confirmToken={confirmDelete.title}
          onConfirm={() => handleDeleteFee(confirmDelete.id)}
          onClose={() => setConfirmDelete(null)}
        />
      )}

      {confirmDeleteMethod && (
        <ConfirmationModal
          open
          title="Remove this payment method?"
          description={
            <>
              <strong>{confirmDeleteMethod.accountName}</strong> (
              {confirmDeleteMethod.type.charAt(0) +
                confirmDeleteMethod.type.slice(1).toLowerCase()}
              ) will no longer be shown to students as a place to pay. This cannot be
              undone.
            </>
          }
          confirmLabel="Remove Method"
          confirmToken={confirmDeleteMethod.accountName}
          onConfirm={() => handleDeleteMethod(confirmDeleteMethod.id)}
          onClose={() => setConfirmDeleteMethod(null)}
        />
      )}

      <LoadingOverlay open={busy || isMutating} label={busyLabel ?? "Working…"} />
    </div>
  );
}