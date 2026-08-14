"use client";

import {
  HandCoins,
  Landmark,
  Plus,
  CheckCheck,
  XCircle,
  FileClock,
  List,
  Pencil,
  Trash2,
} from "lucide-react";
import type { FeesSidebarProps } from "./types";
import styles from "./fees-sidebar.module.css";

export function FeesSidebar({
  canCreate,
  canVerify,
  pendingProofId,
  onCreateFee,
  onVerifyQuick,
  onPaymentDetails,
  onRecordPayment,
  onAddMethod,
  onEditMethod,
  onDeleteMethod,
  fees,
  paymentMethods,
  onEditFee,
  onDeleteFee,
  stats,
}: FeesSidebarProps) {
  const methodLabel = (type: string) =>
    type.charAt(0) + type.slice(1).toLowerCase();
  return (
    <aside className={styles.sidebar}>
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>
          <HandCoins size={16} />
          Quick Actions
        </h3>
        <div className={styles.quickGrid}>
          {canCreate && (
            <button type="button" className={styles.quickTile} onClick={onCreateFee}>
              <span className={styles.quickIcon}>
                <Plus size={14} />
              </span>
              <span className={styles.quickMeta}>
                <span className={styles.quickLabel}>New Fee</span>
                <span className={styles.quickSub}>Post a fee</span>
              </span>
            </button>
          )}
          {canVerify && (
            <button
              type="button"
              className={styles.quickTile}
              onClick={onVerifyQuick}
              disabled={!pendingProofId}
              title={
                pendingProofId
                  ? "Review the next pending proof"
                  : "No pending proofs to verify"
              }
            >
              <span className={styles.quickIcon}>
                <CheckCheck size={14} />
              </span>
              <span className={styles.quickMeta}>
                <span className={styles.quickLabel}>Verify Payment</span>
                <span className={styles.quickSub}>Approve a proof</span>
              </span>
            </button>
          )}
          {canVerify && (
            <button
              type="button"
              className={styles.quickTile}
              onClick={onVerifyQuick}
              disabled={!pendingProofId}
              title={
                pendingProofId
                  ? "Review the next pending proof"
                  : "No pending proofs to review"
              }
            >
              <span className={styles.quickIcon}>
                <XCircle size={14} />
              </span>
              <span className={styles.quickMeta}>
                <span className={styles.quickLabel}>Reject Payment</span>
                <span className={styles.quickSub}>Reject a proof</span>
              </span>
            </button>
          )}
          {canVerify && (
            <button
              type="button"
              className={styles.quickTile}
              onClick={onRecordPayment}
            >
              <span className={styles.quickIcon}>
                <Landmark size={14} />
              </span>
              <span className={styles.quickMeta}>
                <span className={styles.quickLabel}>Record Payment</span>
                <span className={styles.quickSub}>Add payment details</span>
              </span>
            </button>
          )}
          <button type="button" className={styles.quickTile} onClick={onPaymentDetails}>
            <span className={styles.quickIcon}>
              <FileClock size={14} />
            </span>
            <span className={styles.quickMeta}>
              <span className={styles.quickLabel}>Payment Details</span>
              <span className={styles.quickSub}>View records</span>
            </span>
          </button>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHead}>
          <h3 className={styles.cardTitle}>
            <List size={16} />
            Fees
          </h3>
          <span className={styles.cardCount}>{fees.length}</span>
        </div>
        <div className={styles.feeList}>
          {fees.length === 0 && (
            <p className={styles.empty}>No fees posted yet.</p>
          )}
          {fees.map((f) => (
            <div key={f.id} className={styles.feeItem}>
              <div className={styles.feeHead}>
                <span className={styles.feeTitle}>{f.title}</span>
                {canCreate && (
                  <div className={styles.feeActions}>
                    <button
                      type="button"
                      className={styles.editBtn}
                      title="Edit fee"
                      onClick={() => onEditFee(f.id)}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      title="Delete fee"
                      onClick={() => onDeleteFee(f.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
              <div className={styles.feeMeta}>
                <span className={styles.feeAmount}>{f.amount}</span>
                <span className={styles.feeDue}>Due {f.dueDate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHead}>
          <h3 className={styles.cardTitle}>
            <Landmark size={16} />
            Payment Methods
          </h3>
          {canCreate && (
            <button
              type="button"
              className={styles.addBtn}
              title="Add payment method"
              onClick={onAddMethod}
            >
              <Plus size={13} />
            </button>
          )}
        </div>
        <div className={styles.feeList}>
          {paymentMethods.length === 0 && (
            <p className={styles.empty}>No payment methods added yet.</p>
          )}
          {paymentMethods.map((m) => (
            <div key={m.id} className={styles.feeItem}>
              <div className={styles.feeHead}>
                <span className={styles.feeTitle}>
                  {methodLabel(m.type)}
                  {m.active ? "" : " (hidden)"}
                </span>
                {canCreate && (
                  <div className={styles.feeActions}>
                    <button
                      type="button"
                      className={styles.editBtn}
                      title="Edit method"
                      onClick={() => onEditMethod(m.id)}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      title="Remove method"
                      onClick={() => onDeleteMethod(m)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
              <div className={styles.feeMeta}>
                <span className={styles.feeAmount}>{m.accountName}</span>
                {m.accountNumber && (
                  <span className={styles.feeDue}>{m.accountNumber}</span>
                )}
              </div>
              {m.instructions && (
                <p className={styles.methodNote}>{m.instructions}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.snapHead}>
          <h3 className={styles.cardTitle}>
            <Landmark size={16} />
            Collection Snapshot
          </h3>
          <span className={styles.snapBadge}>{stats.termName}</span>
        </div>
        <div className={styles.snapBody}>
          <div className={styles.snapBarRow}>
            <span className={styles.snapLabel}>Overall collection</span>
            <span className={styles.snapPct}>{stats.collectedPct}%</span>
          </div>
          <div className={styles.snapBar}>
            <div className={styles.snapFill} style={{ width: `${stats.collectedPct}%` }} />
          </div>
          <div className={styles.snapGrid}>
            <div className={styles.snapTile}>
              <div className={styles.snapValue}>{stats.feeCount}</div>
              <div className={styles.snapLabel}>Fees</div>
            </div>
            <div className={styles.snapTile}>
              <div className={styles.snapValueGreen}>{stats.paidCount}</div>
              <div className={styles.snapLabel}>Paid</div>
            </div>
            <div className={styles.snapTile}>
              <div className={styles.snapValueRed}>{stats.rejected}</div>
              <div className={styles.snapLabel}>Rej.</div>
            </div>
          </div>
          <p className={styles.snapNote}>
            These totals count only payments that have been verified, across all
            students in the faculty.
          </p>
        </div>
      </div>
    </aside>
  );
}