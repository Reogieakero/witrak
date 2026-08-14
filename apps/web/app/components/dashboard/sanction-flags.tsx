"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { initials, shortName, studentSectionLabel } from "@/lib/dashboard-utils";
import type { ScopedSection } from "@/lib/dashboard-utils";
import { Badge } from "@/app/components/ui/badge";
import styles from "./sanction-flags.module.css";

export type ActiveSanction = {
  id: string;
  title: string;
  issuedAt: Date;
  rule: { absenceThreshold: number } | null;
  student: {
    firstName: string;
    lastName: string;
    section: ScopedSection | null;
  };
};

type SanctionFlagsProps = {
  count: number;
  threshold: number;
  flags: ActiveSanction[];
};

const INTERVAL_MS = 4000;

function riskOf(flag: ActiveSanction): { label: string; cls: string } {
  const t = flag.rule?.absenceThreshold || 1;
  if (t >= 10) return { label: "Critical", cls: styles.riskCritical };
  if (t >= 5) return { label: "High", cls: styles.riskHigh };
  return { label: "Moderate", cls: styles.riskModerate };
}

function flaggedDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

export function SanctionFlags({ count, threshold, flags }: SanctionFlagsProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || flags.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % flags.length), INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused, flags.length]);

  const flag = flags.length ? flags[index % flags.length] : null;

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h3 className={styles.panelTitle}>Active Sanctions</h3>
        <Badge tone="red">
          {count} Open Sanction{count === 1 ? "" : "s"}
        </Badge>
      </div>

      <div
        className={styles.panelBody}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {!flag ? (
          <p className={styles.emptyText}>No open sanctions.</p>
        ) : (
          <div key={flag.id} className={styles.slide}>
            <div className={styles.flagRow}>
              <span className={styles.flagAvatar}>
                {initials(`${flag.student.firstName} ${flag.student.lastName}`)}
              </span>
              <span className={styles.rowMeta}>
                <span className={styles.rowTop}>
                  <span className={styles.rowTitle}>
                    {shortName(flag.student.firstName, flag.student.lastName)}
                  </span>
                  <span className={`${styles.riskPill} ${riskOf(flag).cls}`}>
                    {riskOf(flag).label}
                  </span>
                </span>
                <span className={styles.rowSub}>{studentSectionLabel(flag.student)}</span>
                <span className={styles.rowTitle}>{flag.title}</span>
                <span className={styles.flagMeta}>
                  <span>{flag.rule?.absenceThreshold ?? threshold} absences</span>
                  <span>Issued {flaggedDate(flag.issuedAt)}</span>
                </span>
              </span>
              <AlertTriangle size={15} className={styles.flagIcon} />
            </div>
          </div>
        )}
      </div>

      {flags.length > 1 && (
        <div className={styles.dots}>
          {flags.map((f, i) => (
            <button
              key={f.id}
              type="button"
              aria-label={`Show sanction ${i + 1}`}
              className={`${styles.dot} ${i === index ? styles.dotActive : ""}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}

      <div className={styles.panelFooter}>
        <span>Threshold: &gt;{threshold} absences</span>
        <Link href="/admin/sanctions" className={styles.panelLink}>
          View all
        </Link>
      </div>
    </div>
  );
}
