"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { InfoModal } from "@/app/components/ui/info-modal";
import styles from "./event-header.module.css";

export type EventHeaderProps = {
  onCreate?: () => void;
};

export function EventHeader({ onCreate }: EventHeaderProps) {
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <div className={styles.headRow}>
      <div>
        <div className={styles.titleLine}>
          <h1 className={styles.title}>Events</h1>
        </div>
        <p className={styles.subtitle}>
          Plan and manage faculty-wide student government events. Attendance
          is logged per event via QR scan.
        </p>
      </div>
      <div className={styles.actions}>
        {onCreate && (
          <Button variant="primary" size="md" onClick={onCreate}>
            New Event
          </Button>
        )}
        <button
          type="button"
          className={styles.infoBtn}
          onClick={() => setInfoOpen(true)}
          aria-label="About events"
          title="About events"
        >
          <Info size={16} />
        </button>
      </div>

      <InfoModal
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        title="About Events"
        subtitle="How events work"
        description={
          <>
            <p className={styles.infoBody}>
              Events are faculty-wide or program-specific activities scheduled
              by officers. Here&apos;s a quick overview:
            </p>
            <ul className={styles.infoList}>
              <li>
                <strong>Create</strong> — Schedule an event with a date, time,
                location, and optional target program.
              </li>
              <li>
                <strong>Attendance</strong> — Turn on QR attendance to let
                officers scan students in at the door with a passcode.
              </li>
              <li>
                <strong>Track</strong> — Monitor live attendance rates on the
                event and in the dashboard.
              </li>
              <li>
                <strong>Manage</strong> — Edit or delete events from the list
                or calendar view.
              </li>
            </ul>
          </>
        }
      />
    </div>
  );
}
