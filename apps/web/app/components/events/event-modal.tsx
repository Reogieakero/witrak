"use client";

import { useEffect, useActionState, useRef } from "react";
import { CalendarPlus, MapPin } from "lucide-react";
import type { EventItem, EventsAccess } from "./types";
import { saveEvent } from "@/app/admin/events/actions";
import { Modal } from "@/app/components/ui/modal";
import styles from "./event-modal.module.css";

export type EventModalProps = {
  mode: "create" | "edit";
  event?: EventItem;
  access: EventsAccess;
  onClose: () => void;
};

export function EventModal({ mode, event, access, onClose }: EventModalProps) {
  const [state, formAction, pending] = useActionState(saveEvent, { ok: true });
  const submittedRef = useRef(false);

  const isEdit = mode === "edit";

  useEffect(() => {
    if (submittedRef.current && state.ok && !pending) {
      submittedRef.current = false;
      onClose();
    }
    if (state.ok === false) submittedRef.current = false;
  }, [state, pending, onClose]);

  const action = (formData: FormData) => {
    submittedRef.current = true;
    formAction(formData);
  };

  return (
    <Modal open onClose={onClose}>
      <div className={styles.head}>
        <div className={styles.headIcon}>
          <CalendarPlus size={16} />
        </div>
        <div>
          <h3 className={styles.title}>{isEdit ? "Edit Event" : "New Event"}</h3>
          <p className={styles.subtitle}>
            {isEdit
              ? "Update this scheduled activity"
              : "Schedule a faculty-wide activity"}
          </p>
        </div>
      </div>

      <form action={action} className={styles.form}>
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
            defaultValue={event?.description ?? ""}
            rows={2}
            placeholder="Optional details for attendees..."
            className={styles.area}
          />
        </div>

        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label className={styles.label}>
              Starts at <span className={styles.required}>*</span>
            </label>
            <input
              type="datetime-local"
              name="startsAt"
              defaultValue={toInputValue(event?.startsAt)}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>
              Ends at <span className={styles.required}>*</span>
            </label>
            <input
              type="datetime-local"
              name="endsAt"
              defaultValue={toInputValue(event?.endsAt)}
              className={styles.input}
              required
            />
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

        <label className={styles.check}>
          <input
            type="checkbox"
            name="requiresAttendance"
            defaultChecked={event?.requiresAttendance ?? false}
          />
          <span>Requires attendance (QR scan enabled)</span>
        </label>

        {isEdit && access.yearRep && (
          <p className={styles.note}>
            Year Reps can only edit events they created.
          </p>
        )}

        {state.ok === false && state.error && (
          <p className={styles.error}>{state.error}</p>
        )}

        <div className={styles.foot}>
          <button type="button" className={styles.cancel} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={styles.save} disabled={pending}>
            {pending ? "Saving..." : "Save Event"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function toInputValue(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}