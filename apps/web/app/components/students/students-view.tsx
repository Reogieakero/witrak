"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2 } from "lucide-react";
import { sileo } from "sileo";
import { LoadingOverlay } from "@/app/components/ui/loading-overlay";
import { ConfirmationModal } from "@/app/components/ui/confirmation-modal";
import { StudentsStatsGrid } from "./students-stats";
import { StudentsFeed } from "./students-feed";
import { StudentsModals } from "./students-modals";
import { StudentsSidebar } from "./students-sidebar";
import { suspendStudentAccount } from "@/app/admin/students/actions";
import type {
  StudentsViewProps,
  StudentDrawer,
  StudentConfirm,
  StudentStatusFilter,
} from "./types";
import styles from "./students-view.module.css";

export function StudentsView({
  students,
  stats,
  programs,
  canManage,
}: StudentsViewProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StudentStatusFilter>("all");
  const [programFilter, setProgramFilter] = useState("all");
  const [drawer, setDrawer] = useState<StudentDrawer>(null);
  const [confirm, setConfirm] = useState<StudentConfirm>(null);
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleSuspend = (id: string) => {
    setBusy(true);
    setBusyLabel("Updating account…");
    startTransition(async () => {
      try {
        const result = await sileo.promise(
          () => suspendStudentAccount(id),
          {
            loading: { title: "Updating account", description: "Changing suspension status…", icon: <Loader2 /> },
            success: { title: "Account updated", description: "Suspension status changed.", icon: <GraduationCap /> },
            error: (err) => ({ title: "Could not update", description: err instanceof Error ? err.message : "Please try again.", icon: <GraduationCap /> }),
          },
        );
        if (result.ok) {
          setDrawer(null);
          router.refresh();
        }
      } finally {
        setBusy(false);
        setBusyLabel(null);
      }
    });
  };

  const openView = (id: string) => {
    if (students.some((s) => s.id === id)) setDrawer({ kind: "view", id });
  };

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <div className={styles.mainCol}>
          <div className={styles.pageHeader}>
            <div>
              <div className={styles.titleRow}>
                <h1 className={styles.pageTitle}>Students</h1>
                <span className={styles.termBadge}>Accounts</span>
              </div>
              <p className={styles.pageSubtitle}>
                All students with a system account. Suspend or reinstate access.
              </p>
            </div>
          </div>

          <StudentsStatsGrid stats={stats} />

          <StudentsFeed
            students={students}
            programs={programs}
            query={query}
            page={page}
            statusFilter={statusFilter}
            programFilter={programFilter}
            onQuery={(q) => {
              setQuery(q);
              setPage(1);
            }}
            onPageChange={setPage}
            onStatusChange={(s) => {
              setStatusFilter(s);
              setPage(1);
            }}
            onProgramChange={(p) => {
              setProgramFilter(p);
              setPage(1);
            }}
            onView={openView}
          />
        </div>

        <StudentsSidebar students={students} />
      </div>

      <StudentsModals
        students={students}
        drawer={drawer}
        canManage={canManage}
        onCloseDrawer={() => setDrawer(null)}
        onSuspend={(id) => setConfirm({ kind: "suspend", id })}
      />

      {confirm && (() => {
        const item = students.find((s) => s.id === confirm.id);
        if (!item) return null;
        return (
          <ConfirmationModal
            open
            title={item.suspended ? "Reinstate this account?" : "Suspend this account?"}
            description={
              <>
                {item.suspended
                  ? `${item.name} will be reinstated and can sign in and check in again.`
                  : `${item.name} will be suspended. The account is blocked from signing in and checking in until reinstated.`}{" "}
                Type the student&apos;s name to continue.
              </>
            }
            confirmLabel={
              item.suspended ? "Reinstate Account" : "Suspend Account"
            }
            confirmToken={item.name}
            variant="brand"
            onConfirm={() => {
              setConfirm(null);
              handleSuspend(confirm.id);
            }}
            onClose={() => setConfirm(null)}
          />
        );
      })()}

      <LoadingOverlay open={busy} label={busyLabel ?? "Working…"} />
    </div>
  );
}