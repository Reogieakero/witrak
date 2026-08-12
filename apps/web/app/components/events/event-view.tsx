import {
  CalendarDays,
  Clock3,
  MapPin,
  ScanLine,
  Target,
  UserRound,
  Users,
} from "lucide-react";
import type { EventItem } from "./types";
import { Drawer } from "@/app/components/ui/drawer";
import { Button } from "@/app/components/ui/button";
import styles from "./event-view.module.css";

export type EventViewProps = {
  event: EventItem;
  access: { edit: boolean; delete: boolean };
  onClose: () => void;
  onEdit?: () => void;
};

export function EventView({
  event,
  access,
  onClose,
  onEdit,
}: EventViewProps) {
  const live = event.status === "live";
  const upcoming = event.status === "upcoming";
  const past = event.status === "past";
  const rate = event.attendanceRate ?? 0;

  return (
    <Drawer
      open
      onClose={onClose}
      title={<span>Event Details</span>}
      footer={
        <div className={styles.footer}>
          <div className={styles.footerRight}>
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              Close
            </Button>
            {access.edit && onEdit && (
              <Button type="button" variant="primary" size="md" onClick={onEdit}>
                Edit Event
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className={styles.view}>
        <div className={styles.hero} data-status={event.status}>
          <div className={styles.heroDate}>
            <span className={styles.heroMonth}>{event.month}</span>
            <span className={styles.heroDay}>{event.day}</span>
          </div>
          <div className={styles.heroBody}>
            <div className={styles.statusRow}>
              {live && (
                <span className={styles.statusLive}>
                  <span className={styles.statusDot} />
                  LIVE
                </span>
              )}
              {upcoming && <span className={styles.statusUpcoming}>UPCOMING</span>}
              {past && <span className={styles.statusPast}>COMPLETED</span>}
              {event.programName && (
                <span className={styles.programChip}>
                  <Target size={12} />
                  {event.programName}
                </span>
              )}
            </div>
            <h3 className={styles.heroTitle}>{event.title}</h3>
            {event.description ? (
              <p className={styles.heroDesc}>{event.description}</p>
            ) : (
              <p className={styles.heroDescMuted}>No description provided.</p>
            )}
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.gridItem}>
            <span className={styles.gridIcon}>
              <CalendarDays size={15} />
            </span>
            <div>
              <span className={styles.gridLabel}>Date</span>
              <span className={styles.gridValue}>{event.scheduleDate}</span>
            </div>
          </div>
          <div className={styles.gridItem}>
            <span className={styles.gridIcon}>
              <Clock3 size={15} />
            </span>
            <div>
              <span className={styles.gridLabel}>Time</span>
              <span className={styles.gridValue}>{event.scheduleTime}</span>
            </div>
          </div>
          <div className={styles.gridItem}>
            <span className={styles.gridIcon}>
              <MapPin size={15} />
            </span>
            <div>
              <span className={styles.gridLabel}>Location</span>
              <span className={styles.gridValue}>{event.location || "TBA"}</span>
            </div>
          </div>
          <div className={styles.gridItem}>
            <span className={styles.gridIcon}>
              <Target size={15} />
            </span>
            <div>
              <span className={styles.gridLabel}>Audience</span>
              <span className={styles.gridValue}>
                {event.programName ?? "All (faculty-wide)"}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.attendance}>
          <div className={styles.attHead}>
            <span className={styles.attTitle}>
              <Users size={14} />
              Attendance
            </span>
            {event.requiresAttendance ? (
              <span className={styles.attChip}>
                <ScanLine size={12} />
                Scan enabled
              </span>
            ) : (
              <span className={styles.attChipMuted}>No scan required</span>
            )}
          </div>

          <div className={styles.attBody}>
            <div
              className={styles.attRing}
              data-rate={rate >= 95 ? "good" : rate >= 75 ? "ok" : "low"}
              style={{ "--p": rate } as React.CSSProperties}
            >
              <span className={styles.attRingInner}>
                <span className={styles.attRingValue}>{rate}</span>
                <span className={styles.attRingSuffix}>%</span>
              </span>
            </div>
            <div className={styles.attStats}>
              <div className={styles.attStat}>
                <span className={styles.attStatValue}>{event.attendancePresent}</span>
                <span className={styles.attStatLabel}>Present</span>
              </div>
              <div className={styles.attStat}>
                <span className={styles.attStatValue}>{event.attendanceTotal}</span>
                <span className={styles.attStatLabel}>Records</span>
              </div>
              {past && (
                <div className={styles.attStat}>
                  <span className={styles.attStatValue}>
                    {event.attendanceTotal ? 100 - rate : 0}
                    <span className={styles.attStatUnit}>%</span>
                  </span>
                  <span className={styles.attStatLabel}>Absent</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.organizer}>
          <span className={styles.organizerIcon}>
            <UserRound size={16} />
          </span>
          <div>
            <span className={styles.organizerLabel}>Organized by</span>
            <span className={styles.organizerName}>{event.createdByName}</span>
          </div>
        </div>
      </div>
    </Drawer>
  );
}