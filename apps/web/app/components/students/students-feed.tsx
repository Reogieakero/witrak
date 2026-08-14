"use client";

import { GraduationCap, Eye } from "lucide-react";
import { Pagination } from "@/app/components/ui/pagination";
import { SearchInput } from "@/app/components/ui/search-input";
import { Select } from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import type {
  StudentsFeedProps,
  StudentAccount,
  StudentStatusFilter,
} from "./types";
import styles from "./students-feed.module.css";

const PAGE_SIZE = 10;

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function yearLabel(level: number | null): string {
  if (!level) return "—";
  const suffix = ["th", "st", "nd", "rd"][level] ?? "th";
  return `${level}${suffix} Year`;
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

export function StudentsFeed({
  students,
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
}: StudentsFeedProps) {
  const q = query.trim().toLowerCase();
  const matches = (s: StudentAccount) =>
    !q ||
    s.name.toLowerCase().includes(q) ||
    s.studentNo.toLowerCase().includes(q) ||
    s.email.toLowerCase().includes(q) ||
    (s.programCode ?? "").toLowerCase().includes(q) ||
    (s.sectionName ?? "").toLowerCase().includes(q);

  const filtered = students.filter((s) => {
    if (statusFilter === "active" && s.suspended) return false;
    if (statusFilter === "suspended" && !s.suspended) return false;
    if (programFilter !== "all" && s.programCode !== programFilter) return false;
    return matches(s);
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const statusOptions: { value: StudentStatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "suspended", label: "Suspended" },
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
            placeholder="Search name, number, email…"
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
            icon={<GraduationCap size={20} />}
            title={q ? "No matching accounts" : "No student accounts yet"}
            sub={q ? "Try a different search." : "Accounts appear once students sign up."}
          />
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.colName}>Student</th>
                  <th className={styles.colNo}>Student No.</th>
                  <th className={styles.colScope}>Program</th>
                  <th className={styles.colScope}>Year · Section</th>
                  <th className={styles.colRole}>Roles</th>
                  <th className={styles.colStatus}>Status</th>
                  <th className={styles.colActions} aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {slice.map((s) => (
                  <tr
                    key={s.id}
                    className={`${styles.row}${
                      s.suspended ? ` ${styles.rowSuspended}` : ""
                    }`}
                  >
                    <td className={styles.colName}>
                      <button
                        type="button"
                        className={styles.nameCell}
                        onClick={() => onView(s.id)}
                        title={`View ${s.name}`}
                      >
                        <span className={styles.avatar}>{initials(s.name)}</span>
                        <span className={styles.nameText}>
                          <span className={styles.nameLine}>{s.name}</span>
                          <span className={styles.emailLine}>{s.email}</span>
                        </span>
                      </button>
                    </td>
                    <td className={styles.colNo}>
                      <span className={styles.mono}>{s.studentNo}</span>
                    </td>
                    <td className={styles.colScope}>
                      {s.sectionId ? (
                        <span className={styles.program}>{s.programCode}</span>
                      ) : (
                        <span className={styles.muted}>—</span>
                      )}
                    </td>
                    <td className={styles.colScope}>
                      {s.sectionId ? (
                        <span>
                          {yearLabel(s.yearLevel)} · {s.sectionName}
                        </span>
                      ) : (
                        <span className={styles.muted}>Not placed</span>
                      )}
                    </td>
                    <td className={styles.colRole}>
                      {s.roles.length > 0 ? (
                        <span className={styles.roles}>
                          {s.roles.slice(0, 2).map((r) => (
                            <span key={r} className={styles.roleTag}>{r}</span>
                          ))}
                          {s.roles.length > 2 && (
                            <span className={styles.roleMore}>+{s.roles.length - 2}</span>
                          )}
                        </span>
                      ) : (
                        <span className={styles.muted}>—</span>
                      )}
                    </td>
                    <td className={styles.colStatus}>
                      {s.suspended ? (
                        <Badge tone="amber">Suspended</Badge>
                      ) : (
                        <Badge tone="green">Active</Badge>
                      )}
                    </td>
                    <td className={styles.colActions}>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.rowBtn}
                          onClick={() => onView(s.id)}
                          title="View details"
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