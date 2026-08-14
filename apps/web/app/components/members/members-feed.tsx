"use client";

import { Users, UserPlus, Eye, ShieldOff } from "lucide-react";
import { Pagination } from "@/app/components/ui/pagination";
import { SearchInput } from "@/app/components/ui/search-input";
import { Select } from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import type { MembersFeedProps, MemberItem, MemberStatusFilter } from "./types";
import styles from "./members-feed.module.css";

const PAGE_SIZE = 9;

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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

function MemberCard({
  item,
  onView,
}: {
  item: MemberItem;
  onView: (id: string) => void;
}) {
  const open = () => onView(item.id);

  return (
    <div
      className={styles.item}
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
    >
      <div className={styles.itemHead}>
        <div className={styles.avatar}>{initials(item.name)}</div>
        <div className={styles.itemTitleWrap}>
          <h3 className={styles.itemTitle}>{item.name}</h3>
          <span className={styles.itemNo}>{item.studentNo}</span>
        </div>
        {item.suspended ? (
          <Badge tone="red">Suspended</Badge>
        ) : item.status === "assigned" ? (
          <Badge tone="green">Assigned</Badge>
        ) : (
          <Badge tone="amber">Unassigned</Badge>
        )}
      </div>

      <div className={styles.itemMeta}>
        {item.status === "assigned" ? (
          <span>
            <span className={styles.program}>{item.programCode}</span>
            <span className={styles.dot}>·</span>
            <span>{item.yearLevel ? `${item.yearLevel}${["th", "st", "nd", "rd"][item.yearLevel] ?? "th"} Year` : "—"}</span>
            <span className={styles.dot}>·</span>
            <span>Section {item.sectionName}</span>
          </span>
        ) : (
          <span className={styles.muted}>Not yet placed in a section</span>
        )}
      </div>

      {item.removedAuth && (
        <div className={styles.authRemoved}>
          <ShieldOff size={12} />
          <span>
            Authorization removed by <strong>{item.removedAuth.officerName}</strong>
            {item.removedAuth.removedAt
              ? ` · ${formatDate(item.removedAuth.removedAt)}`
              : ""}
          </span>
        </div>
      )}

      <div className={styles.itemFoot}>
        <button
          type="button"
          className={styles.seeDetails}
          onClick={(e) => {
            e.stopPropagation();
            onView(item.id);
          }}
        >
          <Eye size={14} />
          See details
        </button>
      </div>
    </div>
  );
}

export function MembersFeed({
  members,
  programs,
  query,
  page,
  statusFilter,
  programFilter,
  onQuery,
  onPageChange,
  onStatusChange,
  onProgramChange,
  onView,
}: MembersFeedProps) {
  const q = query.trim().toLowerCase();
  const matches = (m: MemberItem) =>
    !q ||
    m.name.toLowerCase().includes(q) ||
    m.studentNo.toLowerCase().includes(q) ||
    (m.programCode ?? "").toLowerCase().includes(q) ||
    (m.sectionName ?? "").toLowerCase().includes(q);

  const filtered = members.filter((m) => {
    if (statusFilter === "assigned" || statusFilter === "unassigned") {
      if (m.status !== statusFilter) return false;
    } else if (statusFilter === "suspended") {
      if (!m.suspended) return false;
    } else if (statusFilter === "removedAuth") {
      if (!m.removedAuth) return false;
    }
    if (programFilter !== "all" && m.programCode !== programFilter) return false;
    return matches(m);
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const statusOptions: { value: MemberStatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "assigned", label: "Assigned" },
    { value: "unassigned", label: "Unassigned" },
    { value: "suspended", label: "Suspended" },
    { value: "removedAuth", label: "Remove Authorization" },
  ];

  const programOptions = [
    { value: "all", label: "All Programs" },
    ...programs.map((p) => ({ value: p.code, label: p.name })),
  ];

  return (
    <div className={styles.card}>
      <div className={styles.controls}>
        <div className={styles.segment}>
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.segmentBtn} ${
                statusFilter === opt.value ? styles.segmentActive : ""
              }`}
              onClick={() => onStatusChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className={styles.searchGroup}>
          <SearchInput
            value={query}
            onChange={onQuery}
            placeholder="Search name, number, program…"
            className={styles.searchInput}
          />
          <div className={styles.programSelect}>
            <Select
              name="program"
              value={programFilter}
              options={programOptions}
              onChange={onProgramChange}
            />
          </div>
        </div>
      </div>

      <div className={styles.body}>
        {slice.length === 0 ? (
          <Empty
            icon={q ? <UserPlus size={20} /> : <Users size={20} />}
            title={q ? "No matching members" : "No members yet"}
            sub={q ? "Try a different search." : "Add the first student to the directory."}
          />
        ) : (
          <div className={styles.grid}>
            {slice.map((m) => (
              <MemberCard
                key={m.id}
                item={m}
                onView={onView}
              />
            ))}
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
