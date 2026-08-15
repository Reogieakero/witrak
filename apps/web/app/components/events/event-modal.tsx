"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { sileo } from "sileo";
import { AlertTriangle, CalendarCheck, CalendarPlus, KeyRound, Loader2, MapPin } from "lucide-react";
import type { EventItem, EventsAccess } from "./types";
import { saveEvent } from "@/app/admin/events/actions";
import { Drawer } from "@/app/components/ui/drawer";
import { ModalActions } from "@/app/components/ui/modal-actions";
import { Button } from "@/app/components/ui/button";
import { DatePicker } from "@/app/components/ui/date-picker";
import { TimePicker } from "@/app/components/ui/time-picker";
import { Select } from "@/app/components/ui/select";
import { LoadingOverlay } from "@/app/components/ui/loading-overlay";
import styles from "./event-modal.module.css";

export type EventModalProps = {
  mode: "create" | "edit";
  event?: EventItem;
  access: EventsAccess;
  programs: { id: string; code: string; name: string }[];
  onClose: () => void;
};

export function EventModal({
  mode,
  event,
  access,
  programs,
  onClose,
}: EventModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const descRef = useRef<HTMLTextAreaElement>(null);

  const isEdit = mode === "edit";
  const [requiresAttendance, setRequiresAttendance] = useState(
    event?.requiresAttendance ?? false,
  );
  const [scanPassword, setScanPassword] = useState(event?.scanPassword ?? "");

  useEffect(() => {
    const el = descRef.current;
    if (!el) return;
    const resize = () => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    };
    el.addEventListener("input", resize);
    resize();
    return () => el.removeEventListener("input", resize);
  }, []);

  const action = (formData: FormData) => {
    setPending(true);
    setError(null);
    void sileo
      .promise(
        async () => {
          const result = await saveEvent({ ok: true }, formData);
          if (!result.ok) throw new Error(result.error ?? "Something went wrong.");
          return result;
        },
        {
          loading: {
            title: isEdit ? "Saving changes" : "Creating event",
            description: isEdit
              ? "Updating your event…"
              : "Scheduling your event…",
            icon: <Loader2 />,
          },
          success: () => {
            onClose();
            return {
              title: isEdit ? "Event updated" : "Event created",
              description: event?.title ?? "Your event was saved successfully.",
              icon: <CalendarCheck />,
            };
          },
          error: (err) => ({
            title: "Couldn't save event",
            description:
              err instanceof Error ? err.message : "Please check and try again.",
            icon: <AlertTriangle />,
          }),
        },
      )
      .then((result) => {
        if (!result.ok) setError(result.error ?? "Something went wrong.");
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      })
      .finally(() => {
        setPending(false);
      });
  };

  const generatePasscode = () => {
    setScanPassword(
      Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join(""),
    );
  };

  return (
    <>
      <Drawer
        open
        onClose={onClose}
        title={
          <>
            <span className={styles.headIcon}>
              <CalendarPlus size={16} />
            </span>
            <span>
              <span className={styles.titleLine}>
                {isEdit ? "Edit Event" : "New Event"}
              </span>
              <span className={styles.subtitle}>
                {isEdit
                  ? "Update this scheduled activity"
                  : "Schedule a faculty-wide activity"}
              </span>
            </span>
          </>
        }
        footer={
          <ModalActions
            onCancel={onClose}
            cancelLabel="Cancel"
            confirmType="submit"
            confirmForm="event-form"
            confirmLabel={pending ? "Saving..." : "Save Event"}
            disabled={pending}
          />
        }
      >
        <form id="event-form" action={action} className={styles.form}>
        <input type="hidden" name="id" value={event?.id ?? ""} />

        <div className={styles.field}>
          <label className={styles.label}>
            Event title <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="title"
            defaultValue={event?.title ?? ""}
            placeholder="e.g. Student Council Orientation"
            className={styles.input}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <textarea
            name="description"
            ref={descRef}
            defaultValue={event?.description ?? ""}
            rows={2}
            placeholder="Optional details for attendees..."
            className={styles.area}
          />
        </div>

        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label className={styles.label}>
              Event date <span className={styles.required}>*</span>
            </label>
            <DatePicker name="eventDate" value={event?.startsAt} />
          </div>
        </div>

        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label className={styles.label}>
              Start time <span className={styles.required}>*</span>
            </label>
            <TimePicker name="startTime" value={event?.startsAt} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>
              End time <span className={styles.required}>*</span>
            </label>
            <TimePicker name="endTime" value={event?.endsAt} />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Location</label>
          <div className={styles.inputWrap}>
            <MapPin size={14} />
            <input
              type="text"
              name="location"
              defaultValue={event?.location ?? ""}
              placeholder="e.g. Gymnasium"
              className={styles.inputIcon}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Target audience</label>
          <Select
            name="programId"
            value={event?.programId ?? ""}
            placeholder="All (faculty-wide)"
            options={[
              { value: "", label: "All (faculty-wide)" },
              ...programs.map((p) => ({
                value: p.id,
                label: `${p.code} — ${p.name}`,
              })),
            ]}
          />
          <p className={styles.hint}>
            Choose a specific program or keep it faculty-wide.
          </p>
        </div>

        <label className={styles.check}>
          <input
            type="checkbox"
            name="requiresAttendance"
            checked={requiresAttendance}
            onChange={(e) => setRequiresAttendance(e.target.checked)}
          />
          <span>Requires attendance (QR scan enabled)</span>
        </label>

        {requiresAttendance && (
          <div className={styles.field}>
            <label className={styles.label}>
              Event password <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrap}>
              <KeyRound size={14} />
              <input
                type="text"
                name="scanPassword"
                value={scanPassword}
                onChange={(e) => setScanPassword(e.target.value)}
                placeholder="e.g. 6-digit code for the scanner"
                className={styles.inputIcon}
                required
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className={styles.genBtn}
                onClick={generatePasscode}
              >
                Generate
              </Button>
            </div>
            <p className={styles.hint}>
              Officers must enter this on the mobile scanner to unlock
              attendance for this event.
            </p>
          </div>
        )}

        {isEdit && access.yearRep && (
          <p className={styles.note}>
            Year Reps can only edit events they created.
          </p>
        )}

        {error && <p className={styles.error}>{error}</p>}
        </form>
      </Drawer>

      {typeof document !== "undefined" &&
        createPortal(
          <LoadingOverlay
            open={pending}
            label={isEdit ? "Saving changes…" : "Creating event…"}
          />,
          document.body,
        )}
    </>
  );
}