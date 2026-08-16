"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { ImagePlus, Loader2 } from "lucide-react";
import { sileo } from "sileo";
import { Button } from "@/app/components/ui/button";
import { Select } from "@/app/components/ui/select";
import { completeStudentProfile } from "./actions";
import styles from "./complete-profile.module.css";

type ProgramOption = { value: string; label: string };
type YearOption = { value: string; label: string; programId: string };
type SectionOption = { value: string; label: string; programYearId: string };

export function CompleteProfileForm({
  email,
  programOptions,
  yearOptions,
  sectionOptions,
}: {
  email: string;
  programOptions: ProgramOption[];
  yearOptions: YearOption[];
  sectionOptions: SectionOption[];
}) {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);
  const [programId, setProgramId] = useState("");
  const [yearId, setYearId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [suffix, setSuffix] = useState("");

  const filteredYears = yearOptions.filter((y) => y.programId === programId);
  const filteredSections = sectionOptions.filter(
    (s) => s.programYearId === yearId,
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    form.set("next", next);

    const file = form.get("image") as File | null;
    if (!file || file.size === 0) {
      setError("Please upload your profile photo.");
      return;
    }

    startTransition(async () => {
      const result = await completeStudentProfile(form);
      if (!result?.ok && result?.error) {
        setError(result.error);
        sileo.error({ title: "Profile setup failed", description: result.error });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className={styles.form} noValidate>
      <div className={styles.avatarField}>
        <label className={styles.avatarLabel}>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Profile preview" className={styles.avatarPreview} />
          ) : (
            <span className={styles.avatarPlaceholder}>
              <ImagePlus size={22} />
            </span>
          )}
          <input
            name="image"
            type="file"
            accept="image/*"
            required
            className={styles.fileInput}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setPreview(URL.createObjectURL(file));
            }}
          />
        </label>
        <span className={styles.avatarHint}>Upload your photo</span>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>Email</span>
        <input
          value={email}
          disabled
          className={styles.input}
          aria-readonly
        />
      </label>

      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>First name</span>
          <input
            name="firstName"
            type="text"
            autoComplete="given-name"
            required
            placeholder="Juan"
            className={styles.input}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Last name</span>
          <input
            name="lastName"
            type="text"
            autoComplete="family-name"
            required
            placeholder="Dela Cruz"
            className={styles.input}
          />
        </label>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>Name suffix (optional)</span>
        <Select
          name="suffix"
          placeholder="None"
          value={suffix}
          onChange={setSuffix}
          options={[
            { value: "Jr.", label: "Jr." },
            { value: "Sr.", label: "Sr." },
            { value: "II", label: "II" },
            { value: "III", label: "III" },
            { value: "IV", label: "IV" },
            { value: "V", label: "V" },
          ]}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Student number</span>
        <input
          name="studentNo"
          type="text"
          required
          pattern="20\d{2}-\d{4}"
          placeholder="e.g. 2025-0001"
          title="Format: 20XX-XXXX"
          className={styles.input}
        />
      </label>

      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>Program</span>
          <Select
            name="programId"
            placeholder="Select program…"
            options={programOptions}
            value={programId}
            onChange={(v) => {
              setProgramId(v);
              setYearId("");
              setSectionId("");
            }}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Year level</span>
          <Select
            name="programYearId"
            placeholder={programId ? "Select year…" : "Select program first"}
            options={filteredYears}
            value={yearId}
            onChange={(v) => {
              setYearId(v);
              setSectionId("");
            }}
          />
        </label>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>Section</span>
        <Select
          name="sectionId"
          placeholder={yearId ? "Select section…" : "Select year first"}
          options={filteredSections}
          value={sectionId}
          onChange={setSectionId}
        />
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <Button type="submit" disabled={pending} className={styles.submit}>
        {pending ? (
          <>
            <Loader2 size={16} className={styles.iconSpin} />
            Setting up…
          </>
        ) : (
          "Complete profile"
        )}
      </Button>
    </form>
  );
}