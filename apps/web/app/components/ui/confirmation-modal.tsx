"use client";

import { useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Modal } from "./modal";
import { Button } from "./button";
import styles from "./confirmation-modal.module.css";

type ConfirmationModalProps = {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  confirmToken: string;
  variant?: "danger" | "brand";
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmationModal({
  open,
  title,
  description,
  confirmLabel,
  confirmToken,
  variant = "danger",
  onConfirm,
  onClose,
}: ConfirmationModalProps) {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (open) setTyped("");
  }, [open]);

  const matches = typed.trim() === confirmToken;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <span className={styles.titleWrap}>
          <span className={styles.titleIcon} data-variant={variant}>
            <TriangleAlert size={16} />
          </span>
          <span>
            <span className={styles.titleLine}>{title}</span>
            <span className={styles.subtitle}>This action requires confirmation</span>
          </span>
        </span>
      }
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" size="md" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            size="md"
            onClick={onConfirm}
            disabled={!matches}
            type="button"
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className={styles.body}>
        <p className={styles.description}>{description}</p>
        <label className={styles.inputLabel}>
          Type <code className={styles.token}>{confirmToken}</code> to confirm
        </label>
        <input
          type="text"
          className={styles.input}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={confirmToken}
          autoFocus
        />
      </div>
    </Modal>
  );
}