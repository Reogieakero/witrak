"use client";

import { useState, type FormEvent } from "react";
import { Users, UserPlus, Pencil, Ban, ShieldOff, CheckCircle2, XCircle } from "lucide-react";
import { Modal } from "@/app/components/ui/modal";
import { Drawer } from "@/app/components/ui/drawer";
import { ModalActions } from "@/app/components/ui/modal-actions";
import { Select } from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import type {
  MembersModalsProps,
  MemberItem,
  SectionOption,
  PendingRequest,
} from "./types";
import styles from "./members-modals.module.css";

function MemberForm({
  submit,
  sections,
  defaultSection = "",
  busy,
  submitLabel,
  title,
  subtitle,
  icon,
  onClose,
}: {
  submit: (e: FormEvent<HTMLFormElement>) => void;
  sections: SectionOption[];
  defaultSection?: string;
  busy: boolean;
  submitLabel: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClose: () => void;
}) {
  const [sectionId, setSectionId] = useState(defaultSection);

  return (
    <Modal
      open
      onClose={onClose}
      title={
        <span className={styles.modalTitle}>
          <span className={styles.headIcon}>{icon}</span>
          <span>
            <span className={styles.titleLine}>{title}</span>
            <span className={styles.subtitle}>{subtitle}</span>
          </span>
        </span>
      }
      footer={
        <ModalActions
          onCancel={onClose}
          cancelLabel={busy ? "Working…" : "Cancel"}
          confirmType="submit"
          confirmForm="member-form"
          confirmLabel={busy ? "Saving…" : submitLabel}
          disabled={busy}
        />
      }
    >
      <form id="member-form" onSubmit={submit} className={styles.form}>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>
              First name <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="firstName"
              required
              placeholder="Juan"
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>
              Last name <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="lastName"
              required
              placeholder="Dela Cruz"
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            Student number <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="studentNo"
            required
            placeholder="2024-00001"
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Section</label>
          <input type="hidden" name="sectionId" value={sectionId} />
          <Select
            name="section"
            value={sectionId}
            placeholder="Unassigned"
            options={[
              { value: "", label: "Unassigned" },
              ...sections.map((s) => ({ value: s.id, label: s.label })),
            ]}
            onChange={setSectionId}
          />
          <span className={styles.hint}>
            Leave unassigned to add the student without a section placement.
          </span>
        </div>
      </form>
    </Modal>
  );
}

function CreateModal({
  sections,
  busy,
  onCreate,
  onClose,
}: {
  sections: SectionOption[];
  busy: boolean;
  onCreate: MembersModalsProps["onCreate"];
  onClose: () => void;
}) {
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onCreate(new FormData(e.currentTarget));
  };

  return (
    <MemberForm
      submit={submit}
      sections={sections}
      busy={busy}
      submitLabel="Add Member"
      title="Add Member"
      subtitle="Add a student to the directory"
      icon={<UserPlus size={16} />}
      onClose={onClose}
    />
  );
}

function EditModal({
  item,
  sections,
  busy,
  onUpdate,
  onClose,
}: {
  item: MemberItem;
  sections: SectionOption[];
  busy: boolean;
  onUpdate: MembersModalsProps["onUpdate"];
  onClose: () => void;
}) {
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("id", item.id);
    onUpdate(fd);
  };

  return (
    <MemberForm
      submit={submit}
      sections={sections}
      defaultSection={item.sectionId ?? ""}
      busy={busy}
      submitLabel="Save Changes"
      title="Edit Member"
      subtitle="Update section placement"
      icon={<Pencil size={16} />}
      onClose={onClose}
    />
  );
}

function ViewDrawer({
  item,
  canManage,
  onEdit,
  onSuspend,
  onRemoveAuth,
  onClose,
}: {
  item: MemberItem;
  canManage: boolean;
  onEdit: (id: string) => void;
  onSuspend: (id: string) => void;
  onRemoveAuth: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <Drawer
      open
      onClose={onClose}
      title={
        <span className={styles.modalTitle}>
          <span className={styles.headIcon}>
            <Users size={16} />
          </span>
          <span>
            <span className={styles.titleLine}>{item.name}</span>
            <span className={styles.subtitle}>{item.studentNo}</span>
          </span>
        </span>
      }
      footer={
        canManage ? (
          <div className={styles.drawerFooter}>
            <div className={styles.drawerFooterGroup}>
              <button
                type="button"
                className={styles.suspendBtn}
                onClick={() => onSuspend(item.id)}
              >
                <Ban size={14} />
                {item.suspended ? "Reinstate" : "Suspend"}
              </button>
              <button
                type="button"
                className={styles.removeAuthBtn}
                onClick={() => onRemoveAuth(item.id)}
              >
                <ShieldOff size={14} />
                Remove Authorization
              </button>
            </div>
            <button
              type="button"
              className={styles.editBtnWide}
              onClick={() => onEdit(item.id)}
            >
              <Pencil size={14} />
              Edit
            </button>
          </div>
        ) : undefined
      }
    >
      <div className={styles.drawerBody}>
        <div className={styles.fieldGroup}>
          <span className={styles.drawerLabel}>Status</span>
          {item.suspended ? (
            <Badge tone="red">Suspended</Badge>
          ) : item.status === "assigned" ? (
            <Badge tone="green">Assigned</Badge>
          ) : (
            <Badge tone="amber">Unassigned</Badge>
          )}
        </div>
        <div className={styles.detailGrid}>
          <div className={styles.detailCell}>
            <span className={styles.detailLabel}>Program</span>
            <span className={styles.detailValue}>{item.programName ?? "—"}</span>
          </div>
          <div className={styles.detailCell}>
            <span className={styles.detailLabel}>Year Level</span>
            <span className={styles.detailValue}>
              {item.yearLevel ? `${item.yearLevel}${["th", "st", "nd", "rd"][item.yearLevel] ?? "th"} Year` : "—"}
            </span>
          </div>
          <div className={styles.detailCell}>
            <span className={styles.detailLabel}>Student No.</span>
            <span className={styles.detailValue}>{item.studentNo}</span>
          </div>
        </div>
        <div className={styles.note}>
          This directory entry is read-only on the student surface. Students never see other students&apos; records.
        </div>
      </div>
    </Drawer>
  );
}

function RequestModal({
  request,
  kind,
  busy,
  onConfirm,
  onClose,
}: {
  request: PendingRequest;
  kind: "approve" | "reject";
  busy: boolean;
  onConfirm: (id: string) => void;
  onClose: () => void;
}) {
  const approve = kind === "approve";
  const yearLabel = request.yearLevel
    ? `${request.yearLevel}${["th", "st", "nd", "rd"][request.yearLevel] ?? "th"} Year`
    : "—";
  return (
    <Modal
      open
      onClose={onClose}
      title={
        <span className={styles.modalTitle}>
          <span className={styles.headIcon} data-variant={approve ? "brand" : "red"}>
            {approve ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          </span>
          <span>
            <span className={styles.titleLine}>
              {approve ? "Approve role request?" : "Reject role request?"}
            </span>
            <span className={styles.subtitle}>Assign scope in the same action</span>
          </span>
        </span>
      }
      footer={
        <ModalActions
          onCancel={onClose}
          cancelLabel={busy ? "Working…" : "Cancel"}
          confirmLabel={busy ? "Working…" : approve ? "Approve & Assign" : "Reject Request"}
          confirmType="button"
          onConfirm={() => onConfirm(request.id)}
          disabled={busy}
        />
      }
    >
      <div className={styles.form}>
        <p className={styles.requestText}>
          You are about to {approve ? "approve" : "reject"}{" "}
          <strong>{request.userName}</strong>&apos;s request for{" "}
          <strong>{request.requestedRole}</strong>
          {approve && (
            <>
              {" "}
              with scope <strong>{request.scopeLabel}</strong>. A scope is required at approval time.
            </>
          )}
          .
        </p>
        <div className={styles.requestGrid}>
          <div className={styles.requestCell}>
            <span className={styles.requestCellLabel}>Program</span>
            <span className={styles.requestCellValue}>
              {request.programName
                ? `${request.programName}${request.programCode ? ` (${request.programCode})` : ""}`
                : "—"}
            </span>
          </div>
          <div className={styles.requestCell}>
            <span className={styles.requestCellLabel}>Year Scope</span>
            <span className={styles.requestCellValue}>{yearLabel}</span>
          </div>
          <div className={styles.requestCell}>
            <span className={styles.requestCellLabel}>Section</span>
            <span className={styles.requestCellValue}>
              {request.sectionName ?? "—"}
            </span>
          </div>
        </div>
        <span className={styles.hint}>
          Every {approve ? "approval" : "rejection"} is audit-logged (
          {approve ? "role.assigned" : "role.request_rejected"}).
        </span>
      </div>
    </Modal>
  );
}

export function MembersModals({
  members,
  sections,
  modal,
  drawer,
  requestAction,
  pending,
  busy,
  canManage,
  onCloseModal,
  onCloseDrawer,
  onCreate,
  onUpdate,
  onEdit,
  onSuspend,
  onRemoveAuth,
  onApprove,
  onReject,
}: MembersModalsProps) {
  const viewItem =
    drawer?.kind === "view" ? members.find((m) => m.id === drawer.id) : undefined;
  const editItem =
    modal?.kind === "edit" ? members.find((m) => m.id === modal.id) : undefined;
  const request =
    requestAction && "id" in requestAction
      ? pending.find((r) => r.id === requestAction.id)
      : undefined;

  return (
    <>
      {modal?.kind === "create" && (
        <CreateModal sections={sections} busy={busy} onCreate={onCreate} onClose={onCloseModal} />
      )}
      {modal?.kind === "edit" && editItem && (
        <EditModal
          item={editItem}
          sections={sections}
          busy={busy}
          onUpdate={onUpdate}
          onClose={onCloseModal}
        />
      )}
      {drawer?.kind === "view" && viewItem && (
        <ViewDrawer
          item={viewItem}
          canManage={canManage}
          onEdit={onEdit}
          onSuspend={onSuspend}
          onRemoveAuth={onRemoveAuth}
          onClose={onCloseDrawer}
        />
      )}
      {requestAction?.kind === "approve" && request && (
        <RequestModal
          request={request}
          kind="approve"
          busy={busy}
          onConfirm={onApprove}
          onClose={onCloseModal}
        />
      )}
      {requestAction?.kind === "reject" && request && (
        <RequestModal
          request={request}
          kind="reject"
          busy={busy}
          onConfirm={onReject}
          onClose={onCloseModal}
        />
      )}
    </>
  );
}
