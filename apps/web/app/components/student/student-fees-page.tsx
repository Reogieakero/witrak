"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, CheckCircle, ChevronLeft, Copy, FileText, HandCoins, Landmark, Loader2, Send, Upload, Wallet } from "lucide-react";
import { sileo } from "sileo";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Select } from "@/app/components/ui/select";
import type { SelectOption } from "@/app/components/ui/select";
import { Modal } from "@/app/components/ui/modal";
import { LoadingOverlay } from "@/app/components/ui/loading-overlay";
import { uploadFeeProofAction } from "@/app/dashboard/fees/actions";
import styles from "./student-fees-page.module.css";

type FeeStatus = "PAID" | "PENDING" | "REJECTED" | "UNPAID";

export type StudentProofItem = {
  id: string;
  status: FeeStatus;
  method: string | null;
  reference: string | null;
  accountName: string | null;
  fileUrl: string;
  submittedAt: string;
  verifiedByName: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
};

export type StudentFeeStatement = {
  id: string;
  title: string;
  amount: string;
  amountValue: number;
  dueDate: string;
  status: FeeStatus;
  submittedAt?: string;
  proof?: StudentProofItem;
};

export type StudentFeesPageData = {
  fees: StudentFeeStatement[];
  totalAmount: string;
  paidAmount: string;
  balanceAmount: string;
  pendingCount: number;
  paymentMethods: StudentPaymentMethodItem[];
  usedReferences: string[];
};

export type StudentPaymentMethodItem = {
  id: string;
  type: string;
  accountName: string;
  accountNumber: string | null;
  instructions: string | null;
};

function statusLabel(status: FeeStatus): string {
  if (status === "PAID") return "Paid";
  if (status === "PENDING") return "Pending";
  if (status === "REJECTED") return "Rejected";
  return "Unpaid";
}

function statusTone(status: FeeStatus): "green" | "amber" | "red" | "gray" {
  if (status === "PAID") return "green";
  if (status === "PENDING") return "amber";
  if (status === "REJECTED") return "red";
  return "gray";
}

export function StudentFeesPage({
  fees,
  totalAmount,
  paidAmount,
  balanceAmount,
  pendingCount,
  paymentMethods,
  usedReferences,
}: StudentFeesPageData) {
  const router = useRouter();
  const [feeId, setFeeId] = useState("");
  const [method, setMethod] = useState("");
  const [reference, setReference] = useState("");
  const [isMutating, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const [detailsFee, setDetailsFee] = useState<StudentFeeStatement | null>(null);
  const [detailsMethod, setDetailsMethod] =
    useState<StudentPaymentMethodItem | null>(null);

  const feeOptions: SelectOption[] = fees
    .filter((f) => f.status !== "PAID")
    .map((f) => ({
      value: f.id,
      label: `${f.title} · ${f.amount}`,
    }));

  const methodOptions: SelectOption[] = paymentMethods.map((m) => {
    const typeLabel = m.type.charAt(0) + m.type.slice(1).toLowerCase();
    const suffix = m.accountNumber ? ` · ${m.accountNumber}` : "";
    return { value: m.id, label: `${typeLabel}${suffix}` };
  });

  const selectedMethod = paymentMethods.find((m) => m.id === method) ?? null;
  const isCash = selectedMethod?.type === "CASH";

  const referenceValue = reference.trim();
  const referenceDuplicate = Boolean(
    referenceValue &&
      usedReferences.some(
        (r) => r.toLowerCase() === referenceValue.toLowerCase(),
      ),
  );

  function handleMethodChange(v: string) {
    setMethod(v);
    const m = paymentMethods.find((x) => x.id === v);
    if (m?.type === "CASH") setReference("");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const methodId = String(formData.get("methodId") ?? "").trim();
    const chosen = paymentMethods.find((m) => m.id === methodId);
    if (chosen) {
      formData.set(
        "method",
        chosen.type.charAt(0) + chosen.type.slice(1).toLowerCase(),
      );
    }
    formData.delete("methodId");
    setSubmitting(true);
    startTransition(async () => {
      try {
        const result = await sileo.promise(
          () => uploadFeeProofAction(formData),
          {
            loading: { title: "Uploading proof", description: "Submitting your payment proof…", icon: <Loader2 /> },
            success: { title: "Proof submitted", description: "The Treasurer will verify your payment.", icon: <Send /> },
            error: (err) => ({ title: "Could not submit", description: err instanceof Error ? err.message : "Please try again.", icon: <Upload /> }),
          },
        );
        if (result.ok) {
          setFeeId("");
          setMethod("");
          setReference("");
          await router.refresh();
        }
      } finally {
        setSubmitting(false);
      }
    });
  }

  return (
    <>
      <Link href="/dashboard" className={styles.backLink}>
        <ChevronLeft size={16} />
        Back to Dashboard
      </Link>

      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>My Fees</h1>
          <p className={styles.pageSubtitle}>
            View your fee obligations and upload proof of payment for verification.
          </p>
        </div>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.stat}>
          <div className={styles.statHeader}>
            <span>Total Fees</span>
            <span className={styles.statIcon}>
              <HandCoins size={14} />
            </span>
          </div>
          <div className={styles.statValue}>{totalAmount}</div>
          <div className={styles.statSub}>this term</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statHeader}>
            <span>Paid</span>
            <span className={`${styles.statIcon} ${styles.iconGreen}`}>
              <CheckCircle size={14} />
            </span>
          </div>
          <div className={styles.statValue}>{paidAmount}</div>
          <div className={`${styles.statSub} ${styles.okText}`}>settled</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statHeader}>
            <span>Balance</span>
            <span className={`${styles.statIcon} ${styles.iconAmber}`}>
              <Wallet size={14} />
            </span>
          </div>
          <div className={styles.statValue}>{balanceAmount}</div>
          <div className={`${styles.statSub} ${styles.amberText}`}>
            {pendingCount > 0 ? `${pendingCount} pending` : "all settled"}
          </div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statHeader}>
            <span>Payment Methods</span>
            <span className={styles.statIcon}>
              <Landmark size={14} />
            </span>
          </div>
          {paymentMethods.length === 0 ? (
            <p className={styles.statSub}>No methods posted yet.</p>
          ) : (
            <PaymentMethodsCarousel
              methods={paymentMethods}
              onSelect={setDetailsMethod}
            />
          )}
        </div>
      </div>

      <div className={styles.bodyGrid}>
        <section className={styles.card}>
          <header className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Fee Statements</h2>
              <p className={styles.cardSubtitle}>All fees issued by the student government</p>
            </div>
          </header>

          <div className={styles.tableWrap}>
            {fees.length === 0 && <p className={styles.empty}>No fees posted yet.</p>}
            {fees.length > 0 && (
              <table className={styles.feeTable}>
                <thead>
                  <tr>
                    <th>Fee</th>
                    <th className={styles.thCenter}>Status</th>
                    <th className={styles.thRight}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <span className={styles.rowTitle}>{f.title}</span>
                        <span className={styles.rowMeta}>
                          {f.amount} · Due {f.dueDate}
                          {f.submittedAt ? ` · Proof submitted ${f.submittedAt}` : ""}
                        </span>
                      </td>
                      <td className={styles.thCenter}>
                        <Badge tone={statusTone(f.status)}>{statusLabel(f.status)}</Badge>
                      </td>
                      <td className={styles.thRight}>
                        <button
                          type="button"
                          className={styles.detailsLink}
                          onClick={() => setDetailsFee(f)}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className={styles.card}>
          <header className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Upload Proof of Payment</h2>
              <p className={styles.cardSubtitle}>Submit your receipt for verification</p>
            </div>
          </header>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="studentFeeId">
                Select Fee
              </label>
              <Select
                name="feeId"
                value={feeId}
                placeholder={
                  feeOptions.length === 0 ? "No payable fees" : "Choose a fee…"
                }
                options={feeOptions}
                onChange={setFeeId}
              />
              {feeOptions.length === 0 && (
                <p className={styles.fieldHint}>
                  All fees are already paid — nothing left to verify.
                </p>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="studentMethod">
                Method
              </label>
              <Select
                name="methodId"
                value={method}
                placeholder={
                  methodOptions.length === 0
                    ? "No payment methods yet"
                    : "Choose a method…"
                }
                options={methodOptions}
                onChange={handleMethodChange}
              />
              {isCash && (
                <p className={styles.fieldHint}>
                  Pay in cash directly to the treasurer and attach your receipt.
                  No reference number needed.
                </p>
              )}
            </div>

            {!isCash && (
              <div className={styles.field}>
                <label className={styles.label} htmlFor="studentReference">
                  Reference No.
                </label>
                <input
                  id="studentReference"
                  name="reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className={styles.input}
                  placeholder="e.g. 1234-5678"
                  aria-invalid={referenceDuplicate || undefined}
                />
                {referenceDuplicate && (
                  <p className={styles.fieldError}>
                    This reference number is already in use.
                  </p>
                )}
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label}>Proof File</label>
              <input
                type="file"
                name="file"
                accept=".jpg,.jpeg,.png,.pdf"
                className={styles.fileInput}
              />
              <p className={styles.hint}>JPG, PNG, or PDF · Max 5 MB</p>
            </div>

            <Button
              type="submit"
              disabled={isMutating || submitting || referenceDuplicate}
              className={styles.submit}
            >
              <Send size={16} />
              Submit for Verification
            </Button>

            <p className={styles.note}>
              Proofs are verified by the Treasurer. You will be notified once your payment
              is approved or rejected.
            </p>
          </form>
        </section>
      </div>

      {detailsFee && (
        <PaymentDetailsModal
          fee={detailsFee}
          onClose={() => setDetailsFee(null)}
        />
      )}

      {detailsMethod && (
        <PaymentMethodModal
          method={detailsMethod}
          onClose={() => setDetailsMethod(null)}
        />
      )}

      <LoadingOverlay open={submitting} label="Uploading proof…" />
    </>
  );
}

function PaymentMethodModal({
  method,
  onClose,
}: {
  method: StudentPaymentMethodItem;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyNumber = async () => {
    if (!method.accountNumber) return;
    try {
      await navigator.clipboard.writeText(method.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={
        <span className={styles.modalTitle}>
          <span className={styles.modalTitleIcon}>
            <Landmark size={16} />
          </span>
          <span>
            <span className={styles.modalTitleLine}>
              {method.type.charAt(0) + method.type.slice(1).toLowerCase()}
            </span>
            <span className={styles.modalSubtitle}>
              {method.accountName}
            </span>
          </span>
        </span>
      }
      footer={
        <div className={styles.modalFooter}>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className={styles.detailBody}>
        <div className={styles.detailSection}>
          <span className={styles.detailLabel}>Account name</span>
          <p className={styles.detailText}>{method.accountName}</p>
        </div>

        {method.accountNumber && (
          <div className={styles.detailSection}>
            <span className={styles.detailLabel}>Account number / reference</span>
            <div className={styles.copyRow}>
              <span className={styles.detailText}>{method.accountNumber}</span>
              <button
                type="button"
                className={styles.copyBtn}
                onClick={copyNumber}
                aria-label="Copy account number"
                title="Copy account number"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        )}

        {method.instructions && (
          <div className={styles.detailSection}>
            <span className={styles.detailLabel}>Instructions</span>
            <p className={styles.detailText}>{method.instructions}</p>
          </div>
        )}

        <p className={styles.detailNote}>
          Send your payment to the account above and upload your proof of payment so
          the Treasurer can verify it.
        </p>
      </div>
    </Modal>
  );
}

function PaymentMethodsCarousel({
  methods,
  onSelect,
}: {
  methods: StudentPaymentMethodItem[];
  onSelect: (method: StudentPaymentMethodItem) => void;
}) {
  return (
    <div className={styles.methodsTrack}>
      {methods.map((m) => (
        <button
          key={m.id}
          type="button"
          className={styles.methodCard}
          onClick={() => onSelect(m)}
          aria-label={`View payment details for ${m.type}`}
        >
          <span className={styles.methodIcon}>
            <Landmark size={14} />
          </span>
          <span className={styles.methodBody}>
            <span className={styles.methodTitle}>
              {m.type.charAt(0) + m.type.slice(1).toLowerCase()}
            </span>
            <span className={styles.methodMeta}>{m.accountName}</span>
            {m.accountNumber && (
              <span className={styles.methodMeta}>{m.accountNumber}</span>
            )}
            {m.instructions && (
              <span className={styles.methodNote}>{m.instructions}</span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

function PaymentDetailsModal({
  fee,
  onClose,
}: {
  fee: StudentFeeStatement;
  onClose: () => void;
}) {
  const proof = fee.proof;

  return (
    <Modal
      open
      onClose={onClose}
      title={
        <span className={styles.modalTitle}>
          <span className={styles.modalTitleIcon}>
            <FileText size={16} />
          </span>
          <span>
            <span className={styles.modalTitleLine}>Payment Details</span>
            <span className={styles.modalSubtitle}>{fee.title}</span>
          </span>
        </span>
      }
      footer={
        <div className={styles.modalFooter}>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className={styles.detailBody}>
        <div className={styles.detailMetrics}>
          <div className={styles.detailMetric}>
            <span className={styles.detailMetricValue}>{fee.amount}</span>
            <span className={styles.detailMetricLabel}>Amount</span>
          </div>
          <div className={styles.detailMetric}>
            <span className={styles.detailMetricValue}>
              <Badge tone={statusTone(fee.status)}>{statusLabel(fee.status)}</Badge>
            </span>
            <span className={styles.detailMetricLabel}>Status</span>
          </div>
          <div className={styles.detailMetric}>
            <span className={styles.detailMetricValue}>{fee.dueDate}</span>
            <span className={styles.detailMetricLabel}>Due date</span>
          </div>
        </div>

        {!proof ? (
          <div className={styles.detailEmpty}>
            <span className={styles.detailEmptyIcon}>
              <HandCoins size={18} />
            </span>
            <span className={styles.detailEmptyTitle}>No proof submitted yet.</span>
            <span className={styles.detailEmptySub}>
              Upload your proof of payment above to be verified by the Treasurer.
            </span>
          </div>
        ) : (
          <>
            {(proof.method || proof.accountName || proof.reference) && (
              <div className={styles.detailSection}>
                <span className={styles.detailLabel}>Payment details</span>
                <p className={styles.detailText}>
                  {proof.method
                    ? proof.method.charAt(0) + proof.method.slice(1).toLowerCase()
                    : "Payment"}
                  {proof.accountName ? ` · ${proof.accountName}` : ""}
                  {proof.reference ? ` · ${proof.reference}` : ""}
                </p>
              </div>
            )}

            {proof.fileUrl && (
              <div className={styles.detailSection}>
                <span className={styles.detailLabel}>Proof file</span>
                <a
                  href={proof.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.detailFileLink}
                >
                  <FileText size={14} />
                  {proof.fileUrl}
                </a>
              </div>
            )}

            <div className={styles.detailSection}>
              <span className={styles.detailLabel}>Submitted</span>
              <p className={styles.detailText}>{proof.submittedAt}</p>
            </div>

            {proof.verifiedByName && (
              <div className={styles.detailSection}>
                <span className={styles.detailLabel}>Reviewed by</span>
                <p className={styles.detailText}>
                  {proof.verifiedByName}
                  {proof.verifiedAt ? ` · ${proof.verifiedAt}` : ""}
                </p>
              </div>
            )}

            {proof.status === "REJECTED" && (
              <div className={styles.detailRejection}>
                <span className={styles.detailRejectionLabel}>Rejection reason</span>
                <p className={styles.detailRejectionText}>
                  {proof.rejectionReason ?? "—"}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}