"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./modal.module.css";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** When false, overlay-click and Escape won't close the dialog. Defaults to true. */
  dismissable?: boolean;
};

export function Modal({ open, onClose, title, footer, children, dismissable = true }: ModalProps) {
  useEffect(() => {
    if (!open || !dismissable) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, dismissable]);

  if (!open) return null;

  return createPortal(
    <div className={styles.overlay} onClick={dismissable ? onClose : undefined} role="dialog" aria-modal="true">
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          {title && <h2 className={styles.title}>{title}</h2>}
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
