"use client";

import { PieChart, Clock3, ShieldCheck, ExternalLink } from "lucide-react";
import type { TransparencyFileItem, TransparencyStats } from "./types";
import { TransparencyFolder } from "./transparency-folder";
import styles from "./transparency-sidebar.module.css";

type TransparencySidebarProps = {
  stats: TransparencyStats;
  items: TransparencyFileItem[];
  onView: (file: TransparencyFileItem) => void;
};

export function TransparencySidebar({ stats, items, onView }: TransparencySidebarProps) {
  const total = stats.totalFiles;

  const categories = [
    { label: "Financial", count: stats.financialCount, color: "var(--green-600)", bg: "var(--green-600)" },
    { label: "Events", count: stats.eventsCount, color: "var(--violet-600)", bg: "var(--violet-600)" },
    { label: "Minutes", count: stats.minutesCount, color: "var(--amber-600)", bg: "var(--amber-600)" },
    { label: "Reports", count: stats.reportsCount, color: "var(--brand-600)", bg: "var(--brand-600)" },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.card}>
        <div className={styles.cardHead}>
          <h3 className={styles.cardTitle}>
            <PieChart size={16} />
            Files by Category
          </h3>
          <span className={styles.cardCount}>{total} total</span>
        </div>
        <div className={styles.categoryList}>
          {categories.map((cat) => {
            const pct = total ? Math.round((cat.count / total) * 100) : 0;
            return (
              <div key={cat.label} className={styles.categoryItem}>
                <div className={styles.categoryHeader}>
                  <div className={styles.categoryIconWrap}>
                    <div className={`${styles.categoryIcon} ${styles[cat.label.toLowerCase()]}`} />
                  </div>
                  <div className={styles.categoryInfo}>
                    <div className={styles.categoryNameRow}>
                      <span className={styles.categoryName}>{cat.label}</span>
                      <span className={styles.categoryCount}>{cat.count}</span>
                    </div>
                    <div className={styles.categoryBar}>
                      <div
                        className={styles.categoryBarFill}
                        style={{ width: `${pct}%`, background: cat.bg }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={`${styles.card} ${styles.recentCard}`}>
        <div className={styles.cardHead}>
          <h3 className={styles.cardTitle}>
            <Clock3 size={16} />
            Recent Uploads
          </h3>
          <span className={styles.cardCount}>{Math.min(items.length, 3)} latest</span>
        </div>
        <TransparencyFolder files={items} onView={onView} />
      </div>

      <div className={`${styles.card} ${styles.policyCard}`}>
        <div className={styles.cardHead}>
          <h3 className={styles.cardTitle}>
            <ShieldCheck size={16} />
            Transparency Policy
          </h3>
        </div>
        <p className={styles.policyText}>
          Financial documents are published by the Treasurer; programs and minutes by the Secretary. All files stay visible to every officer and student for the term.
        </p>
        <div className={styles.policyFooter}>
          <span>Checked · kept on record</span>
          <ExternalLink size={12} />
        </div>
      </div>
    </aside>
  );
}
