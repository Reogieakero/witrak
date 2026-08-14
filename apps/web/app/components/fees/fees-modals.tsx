"use client";

import { useState, type FormEvent } from "react";
import { PlusCircle, CheckCheck, FileText, Info, XCircle } from "lucide-react";
import { Modal } from "@/app/components/ui/modal";
import { Drawer } from "@/app/components/ui/drawer";
import { ModalActions } from "@/app/components/ui/modal-actions";
import { DatePicker } from "@/app/components/ui/date-picker";
import type { FeesModalsProps, FeeProofRow, FeeItem } from "./types";
import styles from "./fees-modals.module.css";

function proofFor(proofs: FeeProofRow[], proofId?: string): FeeProofRow | undefined {
  return proofs.find((p) => p.id === proofId);
}

function StatusPill({ status }: { status: FeeProofRow["status"] }) {
  const cls =
    status === "PAID"
      ? styles.pillGreen
      : status === "REJECTED"
        ? styles.pillRose
        : styles.pillAmber;
  return <span className={`${styles.pill} ${cls}`}>{status}</span>;
}

export function FeesModals({
  fees,
  proofs,
  modal,
  drawer,
  busy,
  onCloseModal,
  onCloseDrawer,
  onCreateFee,
  onEditFee,
  onVerify,
}: FeesModalsProps) {
  const verifyProof = modal?.kind === "verify" ? proofFor(proofs, modal.proofId) : undefined;
  const drawerProof = drawer?.kind === "proof" ? proofFor(proofs, drawer.proofId) : undefined;
  const editFee = modal?.kind === "edit" ? fees.find((f) => f.id === modal.feeId) : undefined;

  return (
    <>
      {modal?.kind === "fee" && (
        <FeeFormModal busy={busy} onCreateFee={onCreateFee} onEditFee={onEditFee} onClose={onCloseModal} />
      )}
      {modal?.kind === "edit" && editFee && (
        <FeeFormModal
          busy={busy}
          editing={editFee}
          onCreateFee={onCreateFee}
          onEditFee={onEditFee}
          onClose={onCloseModal}
        />
      )}
      {modal?.kind === "verify" && verifyProof && (
        <VerifyModal busy={busy} proof={verifyProof} onVerify={onVerify} onClose={onCloseModal} />
      )}
      {drawer?.kind === "proof" && drawerProof && (
        <ProofDrawer proof={drawerProof} onClose={onCloseDrawer} />
      )}
    </>
  );
}

function FeeFormModal({
  busy,
  editing,
  onCreateFee,
  onEditFee,
  onClose,
}: {
  busy: boolean;
  editing?: FeeItem;
  onCreateFee: FeesModalsProps["onCreateFee"];
  onEditFee: FeesModalsProps["onEditFee"];
  onClose: () => void;
}) {
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (editing) onEditFee(fd);
    else onCreateFee(fd);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={
        <span className={styles.modalTitle}>
          <span className={styles.headIcon}>
            <PlusCircle size={16} />
          </span>
          <span>
            <span className={styles.titleLine}>
              {editing ? "Edit Fee" : "Create Fee"}
            </span>
            <span className={styles.subtitle}>
              {editing
                ? "Update the fee details for this term"
                : "Post a fee for all students this term"}
            </span>
          </span>
        </span>
      }
      footer={
        <ModalActions
          onCancel={onClose}
          cancelLabel={busy ? "Working…" : "Cancel"}
          confirmType="submit"
          confirmForm="fee-form"
          confirmLabel={
            busy
              ? editing
                ? "Saving…"
                : "Creating…"
              : editing
                ? "Save Changes"
                : "Create Fee"
          }
          disabled={busy}
        />
      }
    >
      <form id="fee-form" onSubmit={submit} className={styles.form}>
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <div className={styles.field}>
          <label className={styles.label}>
            Title <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="title"
            required
            defaultValue={editing?.title}
            placeholder="e.g. Semestral Contribution"
            className={styles.input}
          />
        </div>

        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label className={styles.label}>
              Amount (₱) <span className={styles.required}>*</span>
            </label>
            <input
              type="number"
              name="amount"
              min={0.01}
              step="0.01"
              required
              defaultValue={editing?.amountValue}
              placeholder="150.00"
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>
              Due date <span className={styles.required}>*</span>
            </label>
            <DatePicker name="dueDate" value={editing?.dueDateValue} />
          </div>
        </div>

        <p className={styles.note}>
          <Info size={12} className={styles.flexNone} />
          <span>
            Fees apply to all students. Once posted, students can see the fee and
            upload their proof of payment.
          </span>
        </p>
      </form>
    </Modal>
  );
}

function VerifyModal({
  busy,
  proof,
  onVerify,
  onClose,
}: {
  busy: boolean;
  proof: FeeProofRow;
  onVerify: FeesModalsProps["onVerify"];
  onClose: () => void;
}) {
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const reason = String(new FormData(e.currentTarget).get("rejectionReason") || "").trim();
    if (!decision) return;
    if (decision === "reject" && !reason) return;
    onVerify(proof.id, decision, reason);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={
        <span className={styles.modalTitle}>
          <span className={styles.headIconGreen}>
            <CheckCheck size={16} />
          </span>
          <span>
            <span className={styles.titleLine}>Verify Payment</span>
            <span className={styles.subtitle}>{proof.studentName}</span>
          </span>
        </span>
      }
      footer={
        <ModalActions
          onCancel={onClose}
          cancelLabel={busy ? "Working…" : "Cancel"}
          confirmType="submit"
          confirmForm="verify-form"
          confirmLabel={
            busy
              ? decision === "reject"
                ? "Rejecting…"
                : "Verifying…"
              : decision === "reject"
                ? "Reject Proof"
                : "Submit Decision"
          }
          disabled={!decision || busy}
        />
      }
    >
      <form id="verify-form" onSubmit={submit} className={styles.form}>
        <div className={styles.proofSummary}>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>{proof.feeTitle}</span>
            <span className={styles.summaryAmount}>{proof.feeAmount}</span>
          </div>
          <span className={styles.summarySub}>
            Proof: {proof.fileUrl} · submitted {proof.submittedAt}
          </span>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Decision</label>
          <div className={styles.decisionGrid}>
            <button
              type="button"
              className={`${styles.decisionBtn} ${styles.decisionApprove} ${
                decision === "approve" ? styles.decisionSelected : ""
              }`}
              onClick={() => setDecision("approve")}
            >
              <CheckCheck size={14} />
              Approve → Paid
            </button>
            <button
              type="button"
              className={`${styles.decisionBtn} ${styles.decisionReject} ${
                decision === "reject" ? styles.decisionSelected : ""
              }`}
              onClick={() => setDecision("reject")}
            >
              <XCircle size={14} />
              Reject
            </button>
          </div>
        </div>

        {decision === "reject" && (
          <div className={styles.field}>
            <label className={styles.label}>
              Rejection reason <span className={styles.required}>* required</span>
            </label>
            <textarea
              name="rejectionReason"
              rows={3}
              placeholder="Explain why the proof is being rejected (shown to the student)…"
              className={styles.area}
            />
          </div>
        )}

        <p className={styles.note}>
          <Info size={12} className={styles.flexNone} />
          <span>
            Rejections need a reason so the student knows what to fix. Every approval
            or rejection is recorded.
          </span>
        </p>
      </form>
    </Modal>
  );
}

function ProofDrawer({
  proof,
  onClose,
}: {
  proof: FeeProofRow;
  onClose: () => void;
}) {
  return (
    <Drawer
      open
      onClose={onClose}
      title={
        <span className={styles.modalTitle}>
          <span className={styles.headIcon}>
            <FileText size={16} />
          </span>
          <span>
            <span className={styles.titleLine}>Proof of Payment</span>
            <span className={styles.subtitle}>{proof.studentName}</span>
          </span>
        </span>
      }
      footer={
        <ModalActions onCancel={onClose} cancelLabel="Close" />
      }
    >
      <div className={styles.drawerBody}>
        <div className={styles.metrics}>
          <div className={styles.metricTile}>
            <div className={styles.metricValue}>{proof.feeAmount}</div>
            <div className={styles.metricLabel}>Amount</div>
          </div>
          <div className={styles.metricTile}>
            <div className={styles.metricValueStatus}>
              <StatusPill status={proof.status} />
            </div>
            <div className={styles.metricLabel}>Status</div>
          </div>
        </div>

        <div>
          <span className={styles.sectionLabel}>Student</span>
          <p className={styles.par}>
            {proof.studentName} · {proof.studentNo} · {proof.sectionName}
          </p>
        </div>

        <div>
          <span className={styles.sectionLabel}>Fee</span>
          <p className={styles.par}>{proof.feeTitle}</p>
        </div>

        <div>
          <span className={styles.sectionLabel}>Proof file</span>
          <a href={proof.fileUrl} target="_blank" rel="noreferrer" className={styles.fileLink}>
            <FileText size={14} />
            {proof.fileUrl}
          </a>
        </div>

        <div>
          <span className={styles.sectionLabel}>Submitted</span>
          <p className={styles.par}>{proof.submittedAt}</p>
        </div>

        {proof.verifiedByName && (
          <div>
            <span className={styles.sectionLabel}>Reviewed by</span>
            <p className={styles.par}>
              {proof.verifiedByName}
              {proof.verifiedAt ? ` · ${proof.verifiedAt}` : ""}
            </p>
          </div>
        )}

        {proof.status === "REJECTED" && (
          <div className={styles.rejectionBox}>
            <span className={styles.rejectionLabel}>Rejection reason</span>
            <p className={styles.rejectionText}>{proof.rejectionReason ?? "—"}</p>
          </div>
        )}

                <p className={styles.parLight}>
          Check that the file matches the student&apos;s name and the fee amount before
          approving. Rejections need a reason.
        </p>
      </div>
    </Drawer>
  );
}