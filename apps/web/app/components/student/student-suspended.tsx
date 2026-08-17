import { ShieldAlert } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import styles from "./student-suspended.module.css";

export function StudentSuspended() {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <span className={styles.icon}>
          <ShieldAlert size={28} />
        </span>
        <h1 className={styles.title}>Account suspended</h1>
        <p className={styles.text}>
          Your student account has been suspended by the student government. You
          can no longer access fees, events, attendance, or other student
          services until your account is reinstated.
        </p>
        <p className={styles.hint}>
          If you believe this is a mistake, please contact an officer of the
          student government for assistance.
        </p>
        <Button
          href="/login/students"
          variant="secondary"
          size="md"
          className={styles.cta}
        >
          Back to sign in
        </Button>
      </div>
    </div>
  );
}