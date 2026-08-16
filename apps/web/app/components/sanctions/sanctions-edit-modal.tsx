"use client";

import { PencilLine, Info } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { ModalShell, ModalHeader } from "./sanctions-modal-shell";
import type { SanctionItem, FormHandler } from "./types";
import styles from "./sanctions-modals.module.css";

export function EditModal({
  item,
  onEdit,
  onClose,
}: {
  item: SanctionItem;
  onEdit: FormHandler;
  onClose: () => void;
}) {
  return (
    <ModalShell onClose={onClose}>
      <ModalHeader
        tone="soft"
        icon={<PencilLine size={16} />}
        title="Edit Sanction"
        subtitle={item.studentName}
        onClose={onClose}
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onEdit(new FormData(e.currentTarget));
        }}
      >
        <input type="hidden" name="sanctionId" value={item.id} />
        <div className={styles.body}>
          <div className={styles.field}>
            <label>Title</label>
            <input
              type="text"
              name="title"
              defaultValue={item.title}
              placeholder="Sanction title"
              required
            />
          </div>
          <div className={styles.field}>
            <label>Reason</label>
            <textarea
              name="reason"
              rows={4}
              defaultValue={item.reason}
              placeholder="Describe the sanction and attached evidence…"
              required
            />
          </div>
          <p className={styles.note}>
            <Info size={12} className={styles.flexNone} />
            <span>
              Edits are restricted to the supreme. The absences, rule, evidence, and
              outcome are unchanged.
            </span>
          </p>
        </div>
        <div className={styles.footer}>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm">
            Save Changes
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
