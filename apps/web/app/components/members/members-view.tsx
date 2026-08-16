"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Loader2,
  UserPlus,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { sileo } from "sileo";
import { Button } from "@/app/components/ui/button";
import { LoadingOverlay } from "@/app/components/ui/loading-overlay";
import { Card } from "@/app/components/ui/card";
import { ConfirmationModal } from "@/app/components/ui/confirmation-modal";
import { MembersStatsGrid } from "./members-stats";
import { MembersFeed } from "./members-feed";
import { MembersModals } from "./members-modals";
import { MembersSidebar } from "./members-sidebar";
import {
  createStudent,
  updateStudent,
  suspendMember,
  removeAuthorization,
  approveRoleRequest,
  rejectRoleRequest,
} from "@/app/admin/members/actions";
import type {
  MembersViewProps,
  MemberModal,
  MemberDrawer,
  MemberConfirm,
  MemberStatusFilter,
  RequestAction,
} from "./types";
import styles from "./members-view.module.css";

export function MembersView({
  members,
  stats,
  programs,
  sections,
  pending,
  rejected,
  canManage,
}: MembersViewProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<MemberStatusFilter>("all");
  const [programFilter, setProgramFilter] = useState("all");
  const [modal, setModal] = useState<MemberModal | null>(null);
  const [drawer, setDrawer] = useState<MemberDrawer | null>(null);
  const [confirm, setConfirm] = useState<MemberConfirm>(null);
  const [requestAction, setRequestAction] = useState<RequestAction>(null);
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [isMutating, startTransition] = useTransition();

  const handleCreate = (formData: FormData) => {
    setBusy(true);
    setBusyLabel("Adding member…");
    startTransition(async () => {
      try {
        const result = await sileo.promise(
          () => createStudent(formData),
          {
            loading: { title: "Adding member", description: "Creating the directory entry…", icon: <Loader2 /> },
            success: { title: "Member added", description: "The student is now in the directory.", icon: <UserPlus /> },
            error: (err) => ({ title: "Could not add", description: err instanceof Error ? err.message : "Please try again.", icon: <Users /> }),
          },
        );
        if (result.ok) {
          setModal(null);
          await router.refresh();
        }
      } finally {
        setBusy(false);
        setBusyLabel(null);
      }
    });
  };

  const handleUpdate = (formData: FormData) => {
    setBusy(true);
    setBusyLabel("Saving changes…");
    startTransition(async () => {
      try {
        const result = await sileo.promise(
          () => updateStudent(formData),
          {
            loading: { title: "Saving changes", description: "Updating the member…", icon: <Loader2 /> },
            success: { title: "Member updated", description: "Section placement saved.", icon: <Users /> },
            error: (err) => ({ title: "Could not update", description: err instanceof Error ? err.message : "Please try again.", icon: <Users /> }),
          },
        );
        if (result.ok) {
          setModal(null);
          await router.refresh();
        }
      } finally {
        setBusy(false);
        setBusyLabel(null);
      }
    });
  };

  const handleApprove = (id: string) => {
    setBusy(true);
    setBusyLabel("Approving request…");
    startTransition(async () => {
      try {
        const result = await sileo.promise(
          () => approveRoleRequest(id),
          {
            loading: { title: "Approving request", description: "Assigning role and scope…", icon: <Loader2 /> },
            success: { title: "Request approved", description: "The representative role is now assigned.", icon: <CheckCircle2 /> },
            error: (err) => ({ title: "Could not approve", description: err instanceof Error ? err.message : "Please try again.", icon: <Users /> }),
          },
        );
        if (result.ok) {
          setRequestAction(null);
          await router.refresh();
        }
      } finally {
        setBusy(false);
        setBusyLabel(null);
      }
    });
  };

  const handleReject = (id: string) => {
    setBusy(true);
    setBusyLabel("Rejecting request…");
    startTransition(async () => {
      try {
        const result = await sileo.promise(
          () => rejectRoleRequest(id),
          {
            loading: { title: "Rejecting request", description: "Recording the decision…", icon: <Loader2 /> },
            success: { title: "Request rejected", description: "The request was closed.", icon: <XCircle /> },
            error: (err) => ({ title: "Could not reject", description: err instanceof Error ? err.message : "Please try again.", icon: <Users /> }),
          },
        );
        if (result.ok) {
          setRequestAction(null);
          await router.refresh();
        }
      } finally {
        setBusy(false);
        setBusyLabel(null);
      }
    });
  };

  const handleSuspend = (id: string) => {
    setBusy(true);
    setBusyLabel("Updating member…");
    startTransition(async () => {
      try {
        const result = await sileo.promise(
          () => suspendMember(id),
          {
            loading: { title: "Updating member", description: "Changing suspension status…", icon: <Loader2 /> },
            success: { title: "Member updated", description: "Suspension status changed.", icon: <Users /> },
            error: (err) => ({ title: "Could not update", description: err instanceof Error ? err.message : "Please try again.", icon: <Users /> }),
          },
        );
        if (result.ok) {
          await router.refresh();
        }
      } finally {
        setBusy(false);
        setBusyLabel(null);
      }
    });
  };

  const handleRemoveAuth = (id: string) => {
    setBusy(true);
    setBusyLabel("Removing authorization…");
    startTransition(async () => {
      try {
        const result = await sileo.promise(
          () => removeAuthorization(id),
          {
            loading: { title: "Removing authorization", description: "Revoking access…", icon: <Loader2 /> },
            success: { title: "Authorization removed", description: "The member's access has been revoked.", icon: <Users /> },
            error: (err) => ({ title: "Could not remove", description: err instanceof Error ? err.message : "Please try again.", icon: <Users /> }),
          },
        );
        if (result.ok) {
          setDrawer(null);
          await router.refresh();
        }
      } finally {
        setBusy(false);
        setBusyLabel(null);
      }
    });
  };

  const openView = (id: string) => {
    if (members.some((m) => m.id === id)) setDrawer({ kind: "view", id });
  };

  const triggerApprove = (id: string) => {
    setRequestAction({ kind: "approve", id });
  };

  const triggerReject = (id: string) => {
    setRequestAction({ kind: "reject", id });
  };

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <div className={styles.mainCol}>
          <div className={styles.pageHeader}>
            <div>
              <div className={styles.titleRow}>
                <h1 className={styles.pageTitle}>Members</h1>
              </div>
            </div>
            {canManage && (
              <div className={styles.actions}>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setModal({ kind: "create" })}
                  disabled={isMutating}
                >
                  Add Member
                </Button>
              </div>
            )}
          </div>

          <MembersStatsGrid stats={stats} />

          <MembersFeed
            members={members}
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

          {canManage && pending.length > 0 && (
            <Card title="Pending role requests" icon={<UserPlus size={16} />}>
              <div className={styles.requestList}>
                {pending.map((r) => (
                  <div key={r.id} className={styles.requestRow}>
                    <div className={styles.requestInfo}>
                      <span className={styles.requestName}>{r.userName}</span>
                      <span className={styles.requestMeta}>
                        {r.requestedRole} · {r.scopeLabel}
                      </span>
                    </div>
                    <div className={styles.requestActions}>
                      <button
                        type="button"
                        className={styles.approveBtn}
                        onClick={() => triggerApprove(r.id)}
                        title="Approve request"
                      >
                        <CheckCircle2 size={14} />
                      </button>
                      <button
                        type="button"
                        className={styles.rejectBtn}
                        onClick={() => triggerReject(r.id)}
                        title="Reject request"
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <MembersSidebar
          members={members}
          rejected={rejected}
          canManage={canManage}
          onAddMember={() => setModal({ kind: "create" })}
        />
      </div>

      <MembersModals
        members={members}
        programs={programs}
        sections={sections}
        modal={modal}
        drawer={drawer}
        requestAction={requestAction}
        pending={pending}
        busy={busy}
        canManage={canManage}
        onCloseModal={() => {
          setModal(null);
          setRequestAction(null);
        }}
        onCloseDrawer={() => setDrawer(null)}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onEdit={(id) => setConfirm({ kind: "edit", id })}
        onSuspend={(id) => setConfirm({ kind: "suspend", id })}
        onRemoveAuth={(id) => setConfirm({ kind: "removeAuth", id })}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      {confirm && (() => {
        const item = members.find((m) => m.id === confirm.id);
        if (!item) return null;
        const isEdit = confirm.kind === "edit";
        const isRemove = confirm.kind === "removeAuth";
        const isSuspend = confirm.kind === "suspend";
        return (
          <ConfirmationModal
            open
            title={
              isEdit
                ? "Edit this member?"
                : isRemove
                  ? "Remove authorization?"
                  : item.suspended
                    ? "Reinstate this member?"
                    : "Suspend this member?"
            }
            description={
              <>
                {isEdit
                  ? `You are about to edit the record for ${item.name}. You can update their section placement.`
                  : isRemove
                    ? `Authorization for ${item.name} will be removed. This unassigns their section and revokes any officer roles. This cannot be undone.`
                    : item.suspended
                      ? `${item.name} will be reinstated and visible in the directory again.`
                      : `${item.name} will be suspended. Suspended members are excluded from directory lists and role assignments.`}{" "}
                Type the member&apos;s name to continue.
              </>
            }
            confirmLabel={
              isEdit
                ? "Continue to Edit"
                : isRemove
                  ? "Remove Authorization"
                  : item.suspended
                    ? "Reinstate Member"
                    : "Suspend Member"
            }
            confirmToken={item.name}
            variant={isRemove ? "danger" : "brand"}
            onConfirm={() => {
              if (isEdit) {
                setConfirm(null);
                setModal({ kind: "edit", id: confirm.id });
              } else if (isSuspend) {
                setConfirm(null);
                handleSuspend(confirm.id);
              } else {
                setConfirm(null);
                handleRemoveAuth(confirm.id);
              }
            }}
            onClose={() => setConfirm(null)}
          />
        );
      })()}

      <LoadingOverlay open={busy || isMutating} label={busyLabel ?? "Working…"} />
    </div>
  );
}
