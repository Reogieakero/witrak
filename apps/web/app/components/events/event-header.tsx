import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import styles from "./event-header.module.css";

export type EventHeaderProps = {
  termName: string;
  onCreate?: () => void;
};

export function EventHeader({ termName, onCreate }: EventHeaderProps) {
  return (
    <div className={styles.headRow}>
      <div>
        <div className={styles.titleLine}>
          <h1 className={styles.title}>Events</h1>
          <Badge tone="brand">{termName}</Badge>
        </div>
        <p className={styles.subtitle}>
          Plan and manage faculty-wide student government events. Attendance
          is logged per event via QR scan.
        </p>
      </div>
      {onCreate && (
        <Button variant="primary" size="md" onClick={onCreate}>
          New Event
        </Button>
      )}
    </div>
  );
}