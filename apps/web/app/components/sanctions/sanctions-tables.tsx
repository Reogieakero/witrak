"use client";

import {
  Inbox,
  ShieldAlert,
  CheckCheck,
  Eye,
  Check,
  Search,
  Pencil,
} from "lucide-react";
import { Pagination } from "@/app/components/ui/pagination";
import { SearchInput } from "@/app/components/ui/search-input";
import type {
  SanctionsTablesProps,
  SanctionsListTab,
  SanctionItem,
} from "./types";
import styles from "./sanctions-tables.module.css";

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

type AllRow = {
  id: string;
  studentName: string;
  studentNo: string;
  sectionName: string;
  yearLevel: number;
  headline: string;
  sub: string;
  pillLabel: string;
  pillTone: "rose" | "amber" | "green" | "violet";
  outcome?: "Open" | "Cleared";
};

function AllTable({
  rows,
  canResolve,
  canEdit,
  onView,
  onResolve,
  onEdit,
  filtering,
  disabled,
}: {
  rows: AllRow[];
  canResolve: boolean;
  canEdit: boolean;
  onView: (id: string) => void;
  onResolve: (id: string) => void;
  onEdit: (id: string) => void;
  filtering?: boolean;
  disabled?: boolean;
}) {
  if (!rows.length) {
    return (
      <Empty
        icon={filtering ? <Search size={20} /> : <Inbox size={20} />}
        title={filtering ? "No matching records" : "No records yet"}
        sub={filtering ? "Try a different search." : "Issued sanctions will appear here."}
      />
    );
  }
  return (
    <div className={styles.tableWrap}>
      <table className={`${styles.table} ${styles.tableWide}`}>
        <thead>
          <tr>
            <th>Student</th>
            <th>Summary</th>
            <th>Type</th>
            <th className={styles.alignRight}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const pillClass =
              r.pillTone === "rose"
                ? styles.pillRose
                : r.pillTone === "amber"
                  ? styles.pillAmber
                  : r.pillTone === "green"
                    ? styles.pillGreen
                    : styles.pillViolet;
            return (
              <tr key={r.id}>
                <td>
                  <div className={styles.studentCell}>
                    <Avatar name={r.studentName} />
                    <div>
                      <span className={styles.studentName}>{r.studentName}</span>
                      <span className={styles.studentSub}>Year {r.yearLevel}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={styles.reasonTitle}>{r.headline}</span>
                  <span className={styles.reasonSub}>{r.sub}</span>
                </td>
                <td>
                  <span className={`${styles.pill} ${pillClass}`}>{r.pillLabel}</span>
                </td>
                <td>
                  <div className={styles.actions}>
                    {canResolve && r.outcome === "Open" && (
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.actionGreen}`}
                        title="Cleared"
                        disabled={disabled}
                        onClick={() => onResolve(r.id)}
                      >
                        <Check size={14} />
                      </button>
                    )}
                    {canEdit && (
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.actionGray}`}
                        title="Edit"
                        disabled={disabled}
                        onClick={() => onEdit(r.id)}
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.actionGray}`}
                      title="View"
                      disabled={disabled}
                      onClick={() => onView(r.id)}
                    >
                      <Eye size={14} />
                    </button>
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

export function SanctionsTables({
  sanctions,
  tab,
  onTab,
  query,
  onQuery,
  page,
  onPageChange,
  canResolve,
  canEdit,
  onView,
  onResolve,
  onEdit,
  disabled,
}: SanctionsTablesProps) {
  const active = sanctions.filter((s) => s.outcome === "Open");
  const resolved = sanctions.filter((s) => s.outcome !== "Open");

  const q = query.trim().toLowerCase();
  const matches = (text: string) => text.toLowerCase().includes(q);
  const filterActive = q
    ? active.filter(
        (s) =>
          matches(s.studentName) ||
          matches(s.studentNo) ||
          matches(s.sectionName) ||
          matches(s.title) ||
          matches(s.reason),
      )
    : active;
  const filterResolved = q
    ? resolved.filter(
        (s) =>
          matches(s.studentName) ||
          matches(s.studentNo) ||
          matches(s.sectionName) ||
          matches(s.title) ||
          matches(s.reason),
      )
    : resolved;

  const sanctionRows: AllRow[] = sanctions.map((s) => ({
    id: s.id,
    studentName: s.studentName,
    studentNo: s.studentNo,
    sectionName: s.sectionName,
    yearLevel: s.yearLevel,
    headline: s.title,
    sub: `${s.ruleThreshold} absences · ${s.createdAt}`,
    pillLabel: s.outcome === "Open" ? "Active" : s.outcome,
    pillTone: s.outcome === "Open" ? "amber" : "green",
    outcome: s.outcome,
  }));
  const filterAll = q
    ? sanctionRows.filter(
        (r) =>
          matches(r.studentName) ||
          matches(r.studentNo) ||
          matches(r.sectionName) ||
          matches(r.headline) ||
          matches(r.sub),
      )
    : sanctionRows;

  const current =
    tab === "all" ? filterAll : tab === "active" ? filterActive : filterResolved;

  const pageCount = Math.max(1, Math.ceil(current.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const slice = (items: unknown[]) => items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const Tabs: Array<{ id: SanctionsListTab; label: string }> = [
    { id: "all", label: "All" },
    { id: "active", label: "Active Sanctions" },
    { id: "resolved", label: "Resolved" },
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
            </button>
          ))}
        </div>
        <SearchInput
          value={query}
          onChange={onQuery}
          placeholder="Search students, sections, reasons…"
          className={styles.searchInput}
        />
      </div>

      <div className={styles.body}>
        {tab === "all" && (
          <AllTable
            rows={slice(filterAll) as AllRow[]}
            canResolve={canResolve}
            canEdit={canEdit}
            onView={onView}
            onResolve={onResolve}
            onEdit={onEdit}
            filtering={!!q}
            disabled={disabled}
          />
        )}
        {tab === "active" && (
          <ActiveTable
            items={slice(filterActive) as SanctionItem[]}
            canResolve={canResolve}
            canEdit={canEdit}
            onResolve={onResolve}
            onView={onView}
            onEdit={onEdit}
            filtering={!!q}
            disabled={disabled}
          />
        )}
        {tab === "resolved" && (
          <ResolvedTable
            items={slice(filterResolved) as SanctionItem[]}
            canEdit={canEdit}
            onView={onView}
            onEdit={onEdit}
            filtering={!!q}
            disabled={disabled}
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

function ActiveTable({
  items,
  canResolve,
  canEdit,
  onResolve,
  onView,
  onEdit,
  filtering,
  disabled,
}: {
  items: SanctionItem[];
  canResolve: boolean;
  canEdit: boolean;
  onResolve: (id: string) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  filtering?: boolean;
  disabled?: boolean;
}) {
  if (!items.length) {
    return (
      <Empty
        icon={filtering ? <Search size={20} /> : <ShieldAlert size={20} />}
        title={filtering ? "No matching sanctions" : "No active sanctions"}
        sub={
          filtering
            ? "Try a different search."
            : "Open sanctions from issued flags will appear here."
        }
      />
    );
  }
  return (
    <div className={styles.tableWrap}>
      <table className={`${styles.table} ${styles.tableWide}`}>
        <thead>
          <tr>
            <th>Student</th>
            <th>Reason</th>
            <th>Issued</th>
            <th className={styles.alignRight}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.id}>
              <td>
                <div className={styles.studentCell}>
                  <Avatar name={s.studentName} />
                  <div>
                    <span className={styles.studentName}>{s.studentName}</span>
                    <span className={styles.studentSub}>{s.studentNo}</span>
                  </div>
                </div>
              </td>
              <td>
                <span className={styles.reasonTitle}>{s.title}</span>
                <span className={styles.reasonSub}>
                  {s.ruleThreshold} absences · {s.createdAt}
                </span>
              </td>
              <td className={styles.muted}>{s.createdAt}</td>
              <td>
                <div className={styles.actions}>
                  {canResolve && (
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.actionGreen}`}
                      title="Cleared"
                      disabled={disabled}
                      onClick={() => onResolve(s.id)}
                    >
                      <Check size={14} />
                    </button>
                  )}
                  {canEdit && (
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.actionGray}`}
                      title="Edit"
                      disabled={disabled}
                      onClick={() => onEdit(s.id)}
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.actionGray}`}
                    title="View"
                    disabled={disabled}
                    onClick={() => onView(s.id)}
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

function ResolvedTable({
  items,
  canEdit,
  onView,
  onEdit,
  filtering,
  disabled,
}: {
  items: SanctionItem[];
  canEdit: boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  filtering?: boolean;
  disabled?: boolean;
}) {
  if (!items.length) {
    return (
      <Empty
        icon={filtering ? <Search size={20} /> : <CheckCheck size={20} />}
        title={filtering ? "No matching sanctions" : "No resolved sanctions"}
        sub={
          filtering
            ? "Try a different search."
            : "Records cleared this term will appear here."
        }
      />
    );
  }
  return (
    <div className={styles.tableWrap}>
      <table className={`${styles.table} ${styles.tableNarrow}`}>
        <thead>
          <tr>
            <th>Student</th>
            <th>Reason</th>
            <th>Resolved by</th>
            <th>Outcome</th>
            <th className={styles.alignRight}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.id}>
              <td className={styles.studentName}>{s.studentName}</td>
              <td className={styles.muted}>{s.reason}</td>
              <td className={styles.muted}>{s.resolvedBy ?? "Officer"}</td>
              <td>
                <span className={`${styles.pill} ${styles.pillGreen}`}>{s.outcome}</span>
              </td>
              <td>
                <div className={styles.actions}>
                  {canEdit && (
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.actionGray}`}
                      title="Edit"
                      disabled={disabled}
                      onClick={() => onEdit(s.id)}
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.actionGray}`}
                    title="View"
                    disabled={disabled}
                    onClick={() => onView(s.id)}
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
