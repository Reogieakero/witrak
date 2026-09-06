"use client";

import { useState, useTransition } from "react";
import { ChevronLeft, FileText, Send, Upload } from "lucide-react";
import Link from "next/link";
import { sileo } from "sileo";
import { Button } from "@/app/components/ui/button";
import { Select } from "@/app/components/ui/select";
import type { SelectOption } from "@/app/components/ui/select";
import { submitReportAction } from "@/app/dashboard/report/actions";
import type { ReportPageProps } from "./types";
import styles from "./report-page.module.css";

export function ReportPage({ fees, events }: ReportPageProps) {
  const [category, setCategory] = useState("ATTENDANCE");
  const [eventId, setEventId] = useState("");
  const [feeId, setFeeId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isMutating, startTransition] = useTransition();

  const categoryOptions: SelectOption[] = [
    { value: "ATTENDANCE", label: "Attendance" },
    { value: "FEES", label: "Fees" },
  ];

  const eventOptions: SelectOption[] = events.map((e) => ({
    value: e.id,
    label: `${e.title} · ${e.date}`,
  }));

  const feeOptions: SelectOption[] = fees.map((f) => ({
    value: f.id,
    label: `${f.title} · ${f.amount} (Due ${f.dueDate})`,
  }));

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await sileo.promise(() => submitReportAction(formData), {
          loading: {
            title: "Submitting report",
            description: "Sending your report to the officers…",
            icon: <Send />,
          },
          success: {
            title: "Report submitted",
            description: "Your report has been received. An officer will review it.",
            icon: <Upload />,
          },
          error: (err) => ({
            title: "Could not submit",
            description:
              err instanceof Error ? err.message : "Please try again.",
            icon: <FileText />,
          }),
        });
        if (category === "ATTENDANCE") setEventId("");
        if (category === "FEES") setFeeId("");
        setSubject("");
        setDescription("");
      } catch {
        /* sileo handles error display */
      }
    });
  }

  return (
    <>
      <Link href="/dashboard" className={styles.backLink}>
        <ChevronLeft size={16} />
        Back to Dashboard
      </Link>

      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Report an Issue</h1>
          <p className={styles.pageSubtitle}>
            Let us know about an attendance or fee problem and an officer will
            review it.
          </p>
        </div>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="reportCategory">
            Category
          </label>
          <Select
            name="category"
            value={category}
            options={categoryOptions}
            onChange={setCategory}
          />
        </div>

        {category === "ATTENDANCE" && (
          <div className={styles.field}>
            <label className={styles.label} htmlFor="reportEventId">
              Event
            </label>
            <Select
              name="eventId"
              value={eventId}
              placeholder={
                eventOptions.length === 0
                  ? "No events available"
                  : "Choose an event…"
              }
              options={eventOptions}
              onChange={setEventId}
            />
            {eventOptions.length === 0 && (
              <p className={styles.fieldHint}>
                No events available for the current term.
              </p>
            )}
          </div>
        )}

        {category === "FEES" && (
          <div className={styles.field}>
            <label className={styles.label} htmlFor="reportFeeId">
              Fee
            </label>
            <Select
              name="feeId"
              value={feeId}
              placeholder={
                feeOptions.length === 0
                  ? "No fees posted"
                  : "Choose a fee…"
              }
              options={feeOptions}
              onChange={setFeeId}
            />
            {feeOptions.length === 0 && (
              <p className={styles.fieldHint}>No fees posted yet.</p>
            )}
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="reportSubject">
            Subject
          </label>
          <input
            id="reportSubject"
            name="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={styles.input}
            placeholder="Brief summary of the issue"
            maxLength={200}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="reportDescription">
            Description
          </label>
          <textarea
            id="reportDescription"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={styles.textarea}
            placeholder="Explain the issue in detail"
            maxLength={2000}
            rows={5}
          />
        </div>

        <Button
          type="submit"
          disabled={isMutating}
          className={styles.submit}
        >
          <Send size={16} />
          Submit Report
        </Button>

        <p className={styles.note}>
          An officer will review your report and respond. You will be notified
          once it is resolved.
        </p>
      </form>
    </>
  );
}
