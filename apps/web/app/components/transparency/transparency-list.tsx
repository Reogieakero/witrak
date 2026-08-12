"use client";

import { useState } from "react";
import { FileText, Eye, Download, Trash2, Search } from "lucide-react";
import type { TransparencyFileItem } from "./types";
import { Badge } from "@/app/components/ui/badge";
import { Pagination } from "@/app/components/ui/pagination";
import styles from "./transparency-list.module.css";

type CategoryFilter = "all" | string;

const PAGE_SIZE = 10;

export type TransparencyListProps = {
  items: TransparencyFileItem[];
  category: CategoryFilter;
  query: string;
  onCategoryChange: (cat: CategoryFilter) => void;
  onQueryChange: (q: string) => void;
  onView: (file: TransparencyFileItem) => void;
  onDelete: (file: TransparencyFileItem) => void;
};

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "financial", label: "Financial" },
  { value: "events", label: "Events" },
  { value: "minutes", label: "Minutes" },
  { value: "reports", label: "Reports" },
] as const;

export function TransparencyList({
  items,
  category,
  query,
  onCategoryChange,
  onQueryChange,
  onView,
  onDelete,
}: TransparencyListProps) {
  const [localQuery, setLocalQuery] = useState(query);
  const [page, setPage] = useState(1);

  const handleSearch = (value: string) => {
    setLocalQuery(value);
    setPage(1);
    onQueryChange(value);
  };

  const handleCategoryChange = (cat: CategoryFilter) => {
    setPage(1);
    onCategoryChange(cat);
  };

  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <div className={styles.filterBar}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => handleCategoryChange(cat.value)}
              className={`${styles.filterChip} ${category === cat.value ? styles.filterChipActive : ""}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className={styles.cardHeadRight}>
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              value={localQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search files..."
              className={styles.searchInput}
            />
          </div>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.tableHead}>
              <th className={styles.th}>File</th>
              <th className={styles.th}>Category</th>
              <th className={styles.th}>Uploaded by</th>
              <th className={styles.th}>Date</th>
              <th className={`${styles.th} ${styles.thActions}`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.emptyCell}>
                  <div className={styles.empty}>
                    <div className={styles.emptyIcon}>
                      <FileText size={20} />
                    </div>
                    <p className={styles.emptyTitle}>No files found</p>
                    <p className={styles.emptyDesc}>Try a different category or search query.</p>
                  </div>
                </td>
              </tr>
            )}
            {pageItems.map((f) => (
              <tr key={f.id} className={styles.row}>
                <td className={styles.td}>
                  <div className={styles.fileCell}>
                    <div className={`${styles.fileIcon} ${styles[`icon${f.categoryTone.charAt(0).toUpperCase() + f.categoryTone.slice(1)}`]}`}>
                      <FileText size={16} />
                    </div>
                    <div className={styles.fileMeta}>
                      <span className={styles.fileTitle}>{f.title}</span>
                      <span className={styles.fileSize}>{f.size || "document"}</span>
                    </div>
                  </div>
                </td>
                <td className={styles.td}>
                  <Badge tone={f.categoryTone as "brand" | "amber" | "red" | "green" | "gray" | "violet"}>{f.categoryLabel}</Badge>
                </td>
                <td className={styles.td}>
                  <span className={styles.uploader}>{f.uploadedBy}</span>
                </td>
                <td className={styles.td}>
                  <span className={styles.date}>{f.uploadedAt}</span>
                </td>
                <td className={`${styles.td} ${styles.tdActions}`}>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      onClick={() => onView(f)}
                      className={styles.actionBtn}
                      title="View file"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onView(f)}
                      className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
                      title="Download"
                    >
                      <Download size={14} />
                    </button>
                    {f.canDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(f)}
                        className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.listFooter}>
        <Pagination
          page={page}
          pageCount={pageCount}
          total={items.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
