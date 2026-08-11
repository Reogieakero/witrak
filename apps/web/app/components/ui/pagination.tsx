"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./pagination.module.css";

type PaginationProps = {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
}: PaginationProps) {
  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const canPrev = page > 1;
  const canNext = page < pageCount;

  return (
    <div className={styles.footer}>
      <span className={styles.info}>
        Showing <strong>{from}–{to}</strong> of {total}
      </span>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.button}
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        <span className={styles.pageInfo}>
          Page {page} of {pageCount}
        </span>
        <button
          type="button"
          className={styles.button}
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
