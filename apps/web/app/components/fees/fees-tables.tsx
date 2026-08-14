"use client";

import {
  FileClock,
  CheckCheck,
  Eye,
  Search,
  Check,
} from "lucide-react";
import { Pagination } from "@/app/components/ui/pagination";
import { SearchInput } from "@/app/components/ui/search-input";
import type {
  FeesTablesProps,
  FeesListTab,
  FeeProofRow,
  StudentBalanceRow,
  BalanceStatus,
} from "./types";
import styles from "./fees-tables.module.css";

const AVATAR_COLORS = ["rose", "amber", "emerald", "violet", "teal", "blue"] as const;
const PAGE_SIZE = 10;

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function avatarClass(color: string): string {
  const key = `avatar${color.charAt(0).toUpperCase()}${color.slice(1)}`;
  return styles[key] ?? styles.avatarBlue;
}

function Avatar({ name }: { name: string }) {
  return (
    <span className={`${styles.avatar} ${avatarClass(avatarColor(name))}`}>
      {initialsOf(name)}
    </span>
  );
}

function Empty({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  const Icon = icon;
  return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>{Icon}</div>
      <span className={styles.emptyTitle}>{title}</span>
      <span className={styles.emptySub}>{sub}</span>
    </div>
  );
}

const STATUS_LABEL: Record<BalanceStatus, string> = {
  PAID: "Paid",
  PENDING: "Pending",
  REJECTED: "Rejected",
  UNPAID: "Unpaid",
};

function statusPillClass(status: BalanceStatus): string {
  switch (status) {
    case "PAID":
      return styles.pillGreen;
    case "PENDING":
      return styles.pillAmber;
    case "REJECTED":
      return styles.pillRose;
    default:
      return styles.pillGray;
  }
}

function BalancesTable({
  rows,
  fees,
  onOpenProof,
}: {
  rows: StudentBalanceRow[];
  fees: FeesTablesProps["fees"];
  onOpenProof: (proofId: string) => void;
}) {
  if (!rows.length) {
    return (
      <Empty
        icon={<Search size={20} />}
        title="No matching students"
        sub="Try a different search."
      />
    );
  }
  return (
    <div className={styles.tableWrap}>
      <table className={styles.balanceTable}>
        <thead>
          <tr>
            <th>Student</th>
            {fees.map((f) => (
              <th key={f.id} className={styles.center}>
                <span className={styles.feeColTitle}>{f.title}</span>
                <span className={styles.feeColAmount}>{f.amount}</span>
              </th>
            ))}
            <th className={styles.center}>Balance</th>
            <th className={styles.center}>Status</th>
            <th className={styles.alignRight}>Proof</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isFull = r.paidInFull;
            return (
              <tr key={r.id}>
                <td>
                  <div className={styles.studentCell}>
                    <Avatar name={r.studentName} />
                    <div>
                      <span className={styles.studentName}>{r.studentName}</span>
                      <span className={styles.studentSub}>{r.studentNo}</span>
                    </div>
                  </div>
                </td>
                {r.cells.map((cell) => (
                  <td key={cell.feeId} className={styles.center}>
                    <button
                      type="button"
                      className={`${styles.statusPill} ${statusPillClass(cell.status)} ${
                        cell.proofId ? styles.statusPillLink : ""
                      }`}
                      title={cell.proofId ? "View proof" : undefined}
                      disabled={!cell.proofId}
                      onClick={() => cell.proofId && onOpenProof(cell.proofId)}
                    >
                      {STATUS_LABEL[cell.status]}
                    </button>
                  </td>
                ))}
                <td>
                  <span className={`${styles.balance} ${isFull ? styles.balanceZero : styles.balanceDue}`}>
                    {r.balance}
                  </span>
                </td>
                <td className={styles.center}>
                  <span className={`${styles.statusBadge} ${isFull ? styles.statusFull : styles.statusBalance}`}>
                    {isFull ? "Paid in full" : "Has balance"}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    {r.cells.some((c) => c.proofId) && (
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.actionGray}`}
                        title="View proofs"
                        onClick={() => {
                          const first = r.cells.find((c) => c.proofId);
                          if (first?.proofId) onOpenProof(first.proofId);
                        }}
                      >
                        <Eye size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ProofList({
  items,
  canVerify,
  onView,
  onVerify,
  filtering,
}: {
  items: FeeProofRow[];
  canVerify: boolean;
  onView: (id: string) => void;
  onVerify: (id: string) => void;
  filtering: boolean;
}) {
  if (!items.length) {
    return (
      <Empty
        icon={filtering ? <Search size={20} /> : <FileClock size={20} />}
        title={filtering ? "No matching proofs" : "No pending proofs"}
        sub={
          filtering
            ? "Try a different search."
            : "Every submitted proof has been verified."
        }
      />
    );
  }
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Student</th>
            <th className={styles.center}>Fee</th>
            <th className={styles.center}>Amount</th>
            <th>Submitted</th>
            <th className={styles.alignRight}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id}>
              <td>
                <div className={styles.studentCell}>
                  <Avatar name={p.studentName} />
                  <div>
                    <span className={styles.studentName}>{p.studentName}</span>
                    <span className={styles.studentSub}>{p.studentNo}</span>
                  </div>
                </div>
              </td>
              <td>
                <span className={styles.feeTitle}>{p.feeTitle}</span>
                <span className={styles.feeSub}>Year {p.yearLevel} · {p.programCode}</span>
              </td>
              <td className={styles.center}>
                <span className={styles.feeAmount}>{p.feeAmount}</span>
              </td>
              <td className={styles.muted}>{p.submittedAt}</td>
              <td>
                <div className={styles.actions}>
                  {canVerify && p.status === "PENDING" && (
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.actionGreen}`}
                      title="Verify payment"
                      onClick={() => onVerify(p.id)}
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.actionGray}`}
                    title="View proof"
                    onClick={() => onView(p.id)}
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VerifiedTable({
  items,
  onView,
  filtering,
}: {
  items: FeeProofRow[];
  onView: (id: string) => void;
  filtering: boolean;
}) {
  if (!items.length) {
    return (
      <Empty
        icon={filtering ? <Search size={20} /> : <CheckCheck size={20} />}
        title={filtering ? "No matching records" : "No verified records"}
        sub={
          filtering
            ? "Try a different search."
            : "Approved and rejected proofs will appear here."
        }
      />
    );
  }
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Student</th>
            <th className={styles.center}>Fee</th>
            <th className={styles.center}>Amount</th>
            <th>Status</th>
            <th>Reviewed by</th>
            <th className={styles.alignRight}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id}>
              <td className={styles.studentName}>{p.studentName}</td>
              <td className={styles.muted}>{p.feeTitle}</td>
              <td className={styles.center}>
                <span className={styles.feeAmount}>{p.feeAmount}</span>
              </td>
              <td>
                <span className={`${styles.statusPill} ${statusPillClass(p.status)}`}>
                  {STATUS_LABEL[p.status]}
                </span>
              </td>
              <td className={styles.muted}>{p.verifiedByName ?? "—"}</td>
              <td>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.actionGray}`}
                    title="View proof"
                    onClick={() => onView(p.id)}
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FeesTables({
  fees,
  proofRows,
  balanceRows,
  tab,
  query,
  page,
  canVerify,
  onTab,
  onQuery,
  onPageChange,
  onOpenProof,
  onVerify,
  disabled,
}: FeesTablesProps) {
  const q = query.trim().toLowerCase();
  const matches = (text: string) => text.toLowerCase().includes(q);

  const filteredBalances = q
    ? balanceRows.filter(
        (r) =>
          matches(r.studentName) ||
          matches(r.studentNo) ||
          matches(r.sectionName),
      )
    : balanceRows;

  const pendingRows = proofRows.filter((p) => p.status === "PENDING");
  const verifiedRows = proofRows.filter(
    (p) => p.status === "PAID" || p.status === "REJECTED",
  );

  const filterPending = q
    ? pendingRows.filter(
        (p) =>
          matches(p.studentName) ||
          matches(p.studentNo) ||
          matches(p.sectionName) ||
          matches(p.feeTitle),
      )
    : pendingRows;
  const filterVerified = q
    ? verifiedRows.filter(
        (p) =>
          matches(p.studentName) ||
          matches(p.studentNo) ||
          matches(p.sectionName) ||
          matches(p.feeTitle),
      )
    : verifiedRows;

  const current =
    tab === "balances" ? filteredBalances : tab === "pending" ? filterPending : filterVerified;

  const pageCount = Math.max(1, Math.ceil(current.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const slice = <T,>(items: T[]) => items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const Tabs: Array<{ id: FeesListTab; label: string; count?: number }> = [
    { id: "balances", label: "Student Balances" },
    { id: "pending", label: "Pending Proofs", count: pendingRows.length },
    { id: "verified", label: "Verified History" },
  ];

  return (
    <div className={styles.card}>
      <div className={styles.tabBar}>
        <div className={styles.tabs}>
          {Tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={disabled}
              onClick={() => onTab(t.id)}
              className={`${styles.tab} ${tab === t.id ? styles.tabActive : ""}`}
            >
              {t.label}
              {typeof t.count === "number" && t.count > 0 && (
                <span className={styles.tabCount}>{t.count}</span>
              )}
            </button>
          ))}
        </div>
        <SearchInput
          value={query}
          onChange={onQuery}
          placeholder="Search students, sections, fees…"
          className={styles.searchInput}
        />
      </div>

      <div className={styles.body}>
        {tab === "balances" && (
          <BalancesTable rows={slice(filteredBalances)} fees={fees} onOpenProof={onOpenProof} />
        )}
        {tab === "pending" && (
          <ProofList
            items={slice(filterPending)}
            canVerify={canVerify}
            onView={onOpenProof}
            onVerify={onVerify}
            filtering={!!q}
          />
        )}
        {tab === "verified" && (
          <VerifiedTable
            items={slice(filterVerified)}
            onView={onOpenProof}
            filtering={!!q}
          />
        )}
      </div>

      <div className={styles.cardFoot}>
        <Pagination
          page={safePage}
          pageCount={pageCount}
          total={current.length}
          pageSize={PAGE_SIZE}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}