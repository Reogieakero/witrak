"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Camera, Check, CheckCircle2, Circle, User } from "lucide-react";
import { sileo } from "sileo";
import { Modal } from "@/app/components/ui/modal";
import { Select } from "@/app/components/ui/select";
import { ModalActions } from "@/app/components/ui/modal-actions";
import { LoadingOverlay } from "@/app/components/ui/loading-overlay";
import {
  getStudentPlacementOptions,
  getStudentProfile,
  updateStudentProfile,
  uploadStudentAvatar,
  type StudentPlacementOptions,
  type StudentProfile,
} from "@/app/dashboard/profile/actions";
import styles from "./complete-profile-prompt.module.css";

type CompleteProfilePromptProps = {
  needsSection: boolean;
  needsPhoto: boolean;
};

/**
 * Blocking first-run prompt: students whose section is unassigned and/or who
 * have no profile photo cannot use the dashboard until both are provided.
 * Rendered only when the server detects an incomplete profile.
 */
export function CompleteProfilePrompt({ needsSection, needsPhoto }: CompleteProfilePromptProps) {
  const [open, setOpen] = useState(true);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [options, setOptions] = useState<StudentPlacementOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [programId, setProgramId] = useState("");
  const [yearLevelId, setYearLevelId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studentNo, setStudentNo] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [data, placement] = await Promise.all([
        getStudentProfile(),
        getStudentPlacementOptions(),
      ]);
      if (cancelled) return;
      setProfile(data);
      setOptions(placement);
      if (data) {
        setFirstName(data.firstName);
        setLastName(data.lastName);
        setStudentNo(data.studentNo);
        setProgramId(data.programId ?? "");
        setYearLevelId(data.yearLevelId ?? "");
        setSectionId(data.sectionId ?? "");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Already complete (e.g. finished in another tab) — don't block.
  const alreadyComplete =
    !loading && Boolean(profile?.sectionId && profile?.imageUrl);

  const filteredYears =
    options?.years.filter((y) => y.programId === programId) ?? [];
  const filteredSections =
    options?.sections.filter((s) => s.programYearId === yearLevelId) ?? [];

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setError(null);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  }

  const photoDone = Boolean(profile?.imageUrl || photoFile);
  const sectionDone = Boolean(sectionId);
  const namesDone = Boolean(firstName.trim() && lastName.trim() && studentNo.trim());
  const canSave =
    namesDone &&
    (!needsSection || sectionDone) &&
    (!needsPhoto || photoDone) &&
    !isPending;

  async function handleSave() {
    setError(null);
    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required.");
      return;
    }
    if (!studentNo.trim()) {
      setError("Student number is required.");
      return;
    }
    if (needsSection && !sectionId) {
      setError("Please select your program, year level, and section.");
      return;
    }
    if (needsPhoto && !photoFile && !profile?.imageUrl) {
      setError("Please upload your profile photo.");
      return;
    }
    if (!profile) {
      setError("Profile is still loading. Please try again.");
      return;
    }
    startTransition(async () => {
      try {
        if (photoFile) {
          const formData = new FormData();
          formData.set("file", photoFile);
          const up = await uploadStudentAvatar(formData);
          if (!up.ok) {
            setError(up.error ?? "Photo upload failed.");
            return;
          }
        }
        const result = await updateStudentProfile({
          firstName,
          lastName,
          suffix: profile.suffix ?? "",
          studentNo,
          programId: programId || profile.programId,
          yearLevelId: yearLevelId || profile.yearLevelId,
          sectionId: sectionId || profile.sectionId,
        });
        if (!result.ok) {
          setError(result.error ?? "Could not save your profile.");
          return;
        }
        sileo.success({
          title: "Profile complete",
          description: "Your section and photo have been saved.",
          icon: <Check />,
        });
        setOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <>
      <Modal
        open={open && !alreadyComplete}
        onClose={() => {}}
        dismissable={false}
        title={
          <div className={styles.title}>
            <span className={styles.titleIcon}>
              <User size={16} />
            </span>
            Complete your profile
          </div>
        }
        footer={
          <ModalActions
            confirmLabel={isPending ? "Saving…" : "Save and continue"}
            onConfirm={handleSave}
            disabled={!canSave}
          />
        }
      >
        <p className={styles.intro}>
          Your profile is missing a few required details. Finish setup to
          continue to your dashboard.
        </p>

        <ul className={styles.checklist}>
          <ChecklistItem
            done={!needsSection || sectionDone}
            label={sectionDone ? "Section assigned" : "Section not assigned"}
          />
          <ChecklistItem
            done={!needsPhoto || photoDone}
            label={photoDone ? "Profile photo uploaded" : "Profile photo missing"}
          />
        </ul>

        {loading && <p className={styles.loading}>Loading…</p>}

        {!loading && !profile && (
          <p className={styles.errorRow}>
            <AlertCircle size={14} />
            Could not load your profile. Please reload the page.
          </p>
        )}

        {!loading && profile && (
          <>
            <div className={styles.block}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="promptFirstName">
                  First name
                </label>
                <input
                  id="promptFirstName"
                  className={styles.input}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Juan"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="promptLastName">
                  Last name
                </label>
                <input
                  id="promptLastName"
                  className={styles.input}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Dela Cruz"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="promptStudentNo">
                  Student No.
                </label>
                <input
                  id="promptStudentNo"
                  className={styles.input}
                  value={studentNo}
                  onChange={(e) => setStudentNo(e.target.value)}
                  placeholder="e.g. 2025-0001"
                />
              </div>
            </div>

            {needsSection && (
              <div className={styles.block}>
                <div className={styles.field}>
                  <label className={styles.label}>Program</label>
                  <Select
                    name="programId"
                    placeholder={options ? "Select program…" : "Loading…"}
                    options={options?.programs ?? []}
                    value={programId}
                    onChange={(v) => {
                      setProgramId(v);
                      setYearLevelId("");
                      setSectionId("");
                    }}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Year level</label>
                  <Select
                    name="yearLevelId"
                    placeholder={programId ? "Select year…" : "Select program first"}
                    options={filteredYears}
                    value={yearLevelId}
                    onChange={(v) => {
                      setYearLevelId(v);
                      setSectionId("");
                    }}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Section</label>
                  <Select
                    name="sectionId"
                    placeholder={yearLevelId ? "Select section…" : "Select year first"}
                    options={filteredSections}
                    value={sectionId}
                    onChange={setSectionId}
                  />
                </div>
              </div>
            )}

            {needsPhoto && (
              <div className={styles.block}>
                <span className={styles.label}>Profile photo</span>
                <div className={styles.photoRow}>
                  <span className={styles.photoThumb}>
                    {photoPreview || profile.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photoPreview ?? profile.imageUrl ?? ""}
                        alt="Profile preview"
                        className={styles.photoImg}
                      />
                    ) : (
                      <Camera size={22} />
                    )}
                  </span>
                  <button
                    type="button"
                    className={styles.photoBtn}
                    onClick={() => fileRef.current?.click()}
                  >
                    <Camera size={14} />
                    {photoFile || profile.imageUrl ? "Change photo" : "Upload photo"}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className={styles.hiddenInput}
                    onChange={handlePhoto}
                  />
                </div>
                <p className={styles.hint}>JPG, PNG, or WebP, max 5 MB.</p>
              </div>
            )}

            {error && (
              <p className={styles.errorRow}>
                <AlertCircle size={14} />
                {error}
              </p>
            )}
          </>
        )}
      </Modal>
      <LoadingOverlay open={isPending} label="Saving your profile…" />
    </>
  );
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <li className={`${styles.checkItem} ${done ? styles.checkDone : ""}`}>
      {done ? <CheckCircle2 size={15} /> : <Circle size={15} />}
      <span>{label}</span>
    </li>
  );
}
