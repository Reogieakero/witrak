import { Button } from "./button";
import styles from "./modal-actions.module.css";

type ModalActionsProps = {
  onCancel?: () => void;
  cancelLabel?: string;
  confirmLabel?: string;
  confirmType?: "button" | "submit";
  confirmForm?: string;
  onConfirm?: () => void;
  disabled?: boolean;
};

export function ModalActions({
  onCancel,
  cancelLabel = "Cancel",
  confirmLabel,
  confirmType = "button",
  confirmForm,
  onConfirm,
  disabled,
}: ModalActionsProps) {
  return (
    <div className={styles.actions}>
      {onCancel && (
        <Button variant="secondary" size="md" onClick={onCancel} type="button">
          {cancelLabel}
        </Button>
      )}
      {confirmLabel && (
        <Button
          variant="primary"
          size="md"
          type={confirmType}
          form={confirmForm}
          onClick={onConfirm}
          disabled={disabled}
        >
          {confirmLabel}
        </Button>
      )}
    </div>
  );
}