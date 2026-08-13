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
  fees,
  onEditFee,
  onDeleteFee,
  stats,
}: FeesSidebarProps) {
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
            Fees are faculty-wide records (no scope in Rev. 2, DESIGN.md §9). Collection
            rates recompute from verified <code>FeeProof</code> rows only.
          </p>
        </div>
      </div>
    </aside>
  );
}