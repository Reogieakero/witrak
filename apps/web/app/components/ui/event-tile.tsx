import { CalendarCheck2, Eye, MapPin, Pencil, Trash2, Users } from "lucide-react";
import type { EventItem } from "@/app/components/events/types";
import { Badge } from "@/app/components/ui/badge";
import styles from "./event-tile.module.css";

export type EventTileProps = {
  event: EventItem;
  onEdit: () => void;
  onDelete: () => void;
};

export function EventTile({ event, onEdit, onDelete }: EventTileProps) {
  const presentRate = event.attendanceRate ?? 0;
  const dateTone =
    event.status === "past" ? "gray" : event.status === "live" ? "amber" : "brand";

  return (
    <div className={styles.tile} data-status={event.status}>
      <div className={styles.top}>
        <div className={styles.dateBox} data-tone={dateTone}>
          <span className={styles.dateMonth}>{event.month}</span>
          <span className={styles.dateDay}>{event.day}</span>
        </div>
        <div className={styles.badges}>
          {event.status === "live" && (
            <span className={styles.liveBadge}>
              <span className={styles.liveDot} />
              LIVE
            </span>
          )}
          {event.status === "past" && <Badge tone="gray">Completed</Badge>}
          {event.requiresAttendance && event.status !== "past" && (
            <Badge tone="green">Attendance</Badge>
          )}
        </div>
      </div>

      <div className={styles.eventIcon}>
        <Users size={18} />
      </div>

      <h3 className={styles.title} title={event.title}>
        {event.title}
      </h3>

      <div className={styles.meta}>
        <span className={styles.metaLine}>
          <CalendarCheck2 size={12} />
          {event.scheduleTime}
        </span>
        <span className={styles.metaLine}>
          <MapPin size={12} />
          {event.location || "TBA"}
        </span>
      </div>

      <div className={styles.metric}>
        {event.status === "live" ? (
          <>
            <span className={styles.metricText}>
              Present {event.attendancePresent} / {event.attendanceTotal}
            </span>
            <div className={styles.metricBar}>
              <span
                className={styles.metricFill}
                data-tone="green"
                style={{ width: `${presentRate}%` }}
              />
            </div>
          </>
        ) : event.status === "upcoming" ? (
          <span className={styles.metricText}>
            {event.daysUntil !== null
              ? `in ${event.daysUntil} day${event.daysUntil === 1 ? "" : "s"}`
              : event.scheduleDate}
          </span>
        ) : (
          <>
            <span className={styles.metricText}>
              {presentRate}% present
            </span>
            <div className={styles.metricBar}>
              <span className={styles.metricFill} style={{ width: `${presentRate}%` }} />
            </div>
          </>
        )}
      </div>

      <div className={styles.foot}>
        <span className={styles.createdBy} title={event.createdByName}>
          by {event.createdByName}
        </span>
        <span className={styles.actions}>
          <button type="button" className={styles.actionBtn} title="View" onClick={onEdit}>
            <Eye size={15} />
          </button>
          {event.canEdit && (
            <button type="button" className={styles.actionBtn} title="Edit" onClick={onEdit}>
              <Pencil size={15} />
            </button>
          )}
          {event.canDelete && (
            <button
              type="button"
              className={styles.actionBtn}
              data-danger
              title="Delete"
              onClick={onDelete}
            >
              <Trash2 size={15} />
            </button>
          )}
        </span>
      </div>
    </div>
  );
}