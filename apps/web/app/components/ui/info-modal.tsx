"use client";

import { Info } from "lucide-react";
import { Modal } from "./modal";
import { Button } from "./button";
import styles from "./info-modal.module.css";

type InfoModalProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  description: React.ReactNode;
  confirmLabel?: string;
  onConfirm?: () => void;
  onClose: () => void;
};

export function InfoModal({
  open,
  title,
  subtitle = "Good to know",
  description,
  confirmLabel = "Got it",
  onConfirm,
  onClose,
}: InfoModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <span className={styles.titleWrap}>
          <span className={styles.titleIcon}>
            <Info size={16} />
          </span>
          <span>
            <span className={styles.titleLine}>{title}</span>
            <span className={styles.subtitle}>{subtitle}</span>
          </span>
        </span>
      }
      footer={
        <div className={styles.footer}>
          <Button
            variant="primary"
            size="md"
            onClick={onConfirm ?? onClose}
            type="button"
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className={styles.body}>{description}</div>
    </Modal>
  );
}
