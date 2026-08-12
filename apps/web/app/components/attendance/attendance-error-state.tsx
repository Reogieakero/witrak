import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import styles from "./attendance-error-state.module.css";

export type AttendanceErrorStateProps = {
  message?: string;
  onRetry: () => void;
};

export function AttendanceErrorState({
  message,
  onRetry,
}: AttendanceErrorStateProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.icon}>
          <AlertTriangle size={22} />
        </div>
        <h3 className={styles.title}>Couldn&apos;t load attendance</h3>
        <p className={styles.message}>
          {message ?? "Something went wrong while fetching your records."}
        </p>
        <Button variant="primary" size="md" onClick={onRetry}>
          <RefreshCw size={13} />
          Try again
        </Button>
      </div>
    </div>
  );
}