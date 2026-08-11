import { Plus } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
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
        <button type="button" className={styles.primaryBtn} onClick={onCreate}>
          <Plus size={14} />
          New Event
        </button>
      )}
    </div>
  );
}