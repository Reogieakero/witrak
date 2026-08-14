"use client";

import { ScrollText, Eye } from "lucide-react";
import { Pagination } from "@/app/components/ui/pagination";
import { SearchInput } from "@/app/components/ui/search-input";
import { Badge } from "@/app/components/ui/badge";
import { AUDIT_ACTION_LABELS, AUDIT_MODULE_FILTERS } from "./constants";
import type { AuditEntry, AuditLogFeedProps } from "./types";
import styles from "./audit-log-feed.module.css";

const PAGE_SIZE = 12;

function moduleTone(action: string): "violet" | "red" | "green" | "amber" {
  switch (action) {
    case "ROLE_ASSIGNED":
    case "ROLE_REVOKED":
    case "SCOPE_CHANGED":
    case "ROLE_REQUEST_REJECTED":
      return "violet";
    case "SANCTION_CREATED":
    case "SANCTION_RESOLVED":
    case "FLAG_DISMISSED":
    case "FLAG_AUTO_DISMISSED":
    case "PAYMENT_REJECTED":
      return "red";
    case "PAYMENT_VERIFIED":
      return "green";
    case "MEMBER_SUSPENDED":
      return "amber";
    case "MEMBER_REINSTATED":
      return "green";
    default:
      return "amber";
  }
}

function moduleIcon(action: string): React.ReactNode {
  switch (action) {
    case "ROLE_ASSIGNED":
    case "ROLE_REVOKED":
    case "SCOPE_CHANGED":
    case "ROLE_REQUEST_REJECTED":
      return <span className={styles.actionBadge} data-tone="violet">R</span>;
    case "SANCTION_CREATED":
    case "SANCTION_RESOLVED":
    case "FLAG_DISMISSED":
    case "FLAG_AUTO_DISMISSED":
      return <span className={styles.actionBadge} data-tone="rose">S</span>;
    case "PAYMENT_VERIFIED":
    case "PAYMENT_REJECTED":
      return <span className={styles.actionBadge} data-tone="green">F</span>;
    case "MEMBER_SUSPENDED":
    case "MEMBER_REINSTATED":
    case "MEMBER_AUTHORIZATION_REMOVED":
      return <span className={styles.actionBadge} data-tone="amber">M</span>;
    default:
      return <span className={styles.actionBadge} data-tone="amber">A</span>;
  }
}

function Empty({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>{icon}</div>
      <span className={styles.emptyTitle}>{title}</span>
      <span className={styles.emptySub}>{sub}</span>
    </div>
  );
}

export function AuditLogFeed({
  entries,
  query,
  module,
  page,
  onQuery,
  onModule,
  onPageChange,
  onView,
}: AuditLogFeedProps) {
  const q = query.trim().toLowerCase();
  const matches = (e: AuditEntry) =>
    !q ||
    e.actorName.toLowerCase().includes(q) ||
    e.targetName.toLowerCase().includes(q) ||
    e.action.toLowerCase().includes(q) ||
    (AUDIT_ACTION_LABELS[e.action] ?? "").toLowerCase().includes(q) ||
    e.summary.toLowerCase().includes(q);

  const filtered = entries.filter((e) => {
    if (module !== "all" && e.module !== module) return false;
    return matches(e);
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className={styles.card}>
      <div className={styles.controls}>
        <div className={styles.segment}>
          {AUDIT_MODULE_FILTERS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.segmentBtn} ${
                module === opt.value ? styles.segmentActive : ""
              }`}
              onClick={() => onModule(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className={styles.searchGroup}>
          <SearchInput
            value={query}
            onChange={onQuery}
            placeholder="Search actor, target, action…"
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.body}>
        {slice.length === 0 ? (
          <Empty
            icon={<ScrollText size={20} />}
            title={q ? "No matching entries" : "No audit entries yet"}
            sub={q ? "Try a different search." : "Actions appear here once they are recorded."}
          />
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Target</th>
                  <th>Details</th>
                  <th>Timestamp</th>
                  <th className={styles.colActions} aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {slice.map((e) => (
                  <tr key={e.id} className={styles.row}>
                    <td>
                      <div className={styles.actionCell}>
                        {moduleIcon(e.action)}
                        <div className={styles.actionText}>
                          <span className={styles.actionLine}>
                            {AUDIT_ACTION_LABELS[e.action] ?? e.action}
                          </span>
                          <span className={styles.actionCode}>{e.action}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.actorCell}>
                        <span className={styles.actorAvatar}>{e.actorInitial}</span>
                        <span className={styles.actorName}>{e.actorName}</span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.targetName}>{e.targetName}</span>
                      <span className={styles.targetDetail}>{e.targetDetail}</span>
                    </td>
                    <td>
                      <Badge tone={moduleTone(e.action)} className={styles.summaryBadge}>
                        {e.summary}
                      </Badge>
                    </td>
                    <td>
                      <span className={styles.timeLine}>{e.timestamp}</span>
                      <span className={styles.timeRelative}>{e.relative}</span>
                    </td>
                    <td className={styles.colActions}>
                      <button
                        type="button"
                        className={styles.rowBtn}
                        onClick={() => onView(e.id)}
                        title="View entry"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <div className={styles.cardFoot}>
          <Pagination
            page={safePage}
            pageCount={pageCount}
            total={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
