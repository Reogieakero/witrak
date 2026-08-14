"use client";

import { useState } from "react";
import { AuditLogStatsGrid } from "./audit-log-stats";
import { AuditLogFeed } from "./audit-log-feed";
import { AuditLogSidebar } from "./audit-log-sidebar";
import { AuditLogModals } from "./audit-log-modals";
import type {
  AuditLogViewProps,
  AuditModuleKey,
} from "./types";
import styles from "./audit-log-view.module.css";

export function AuditLogView({ entries, stats }: AuditLogViewProps) {
  const [query, setQuery] = useState("");
  const [module, setModule] = useState<AuditModuleKey>("all");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<number | null>(null);

  const handleQuery = (q: string) => {
    setQuery(q);
    setPage(1);
  };

  const handleModule = (m: AuditModuleKey) => {
    setModule(m);
    setPage(1);
  };

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <div className={styles.mainCol}>
          <div className={styles.pageHeader}>
            <div>
              <div className={styles.titleRow}>
                <h1 className={styles.pageTitle}>Audit Log</h1>
                <span className={styles.termBadge}>Super Admin only</span>
              </div>
              <p className={styles.pageSubtitle}>
                A running record of important actions, like assigning roles and verifying
                payments. Entries can&apos;t be edited or removed once recorded.
              </p>
            </div>
          </div>

          <AuditLogStatsGrid stats={stats} />

          <AuditLogFeed
            entries={entries}
            query={query}
            module={module}
            page={page}
            onQuery={handleQuery}
            onModule={handleModule}
            onPageChange={setPage}
            onView={(id) => setDetailId(id)}
          />
        </div>

        <AuditLogSidebar entries={entries} stats={stats} />
      </div>

      <AuditLogModals
        entries={entries}
        detailId={detailId}
        onCloseDetail={() => setDetailId(null)}
      />
    </div>
  );
}
