"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Camera,
  Check,
  Download,
  Pencil,
  QrCode,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import QRCode from "react-qr-code";
import { sileo } from "sileo";
import { Modal } from "@/app/components/ui/modal";
import { Select } from "@/app/components/ui/select";
import { LoadingOverlay } from "@/app/components/ui/loading-overlay";
import { ModalActions } from "@/app/components/ui/modal-actions";
import { Button } from "@/app/components/ui/button";
import { signOut } from "@/lib/auth-client";
import {
  deactivateAccount,
  exportStudentData,
  getStudentProfile,
  getStudentPlacementOptions,
  updateStudentProfile,
  uploadStudentAvatar,
  type StudentPlacementOptions,
  type StudentProfile,
} from "@/app/dashboard/profile/actions";
import styles from "./student-profile-modal.module.css";

function downloadXlsx(name: string, base64: string) {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

type StudentProfileModalProps = {
  open: boolean;
  onClose: () => void;
  onAvatarChange?: (url: string) => void;
};

type Tab = "profile" | "qr";

export function StudentProfileModal({
  open,
  onClose,
  onAvatarChange,
}: StudentProfileModalProps) {
  const [tab, setTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [options, setOptions] = useState<StudentPlacementOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [studentNo, setStudentNo] = useState("");
  const [programId, setProgramId] = useState("");
  const [yearLevelId, setYearLevelId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deleteView, setDeleteView] = useState<"closed" | "confirm">("closed");
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setTab("profile");
      setEditing(false);
      setDeleteView("closed");
      setLoading(true);
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
        setSuffix(data.suffix ?? "");
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
  }, [open]);

  const filteredYears = options?.years.filter((y) => y.programId === programId) ?? [];
  const filteredSections =
    options?.sections.filter((s) => s.programYearId === yearLevelId) ?? [];

  const qrValue = profile
    ? [
        "Liberalis Student ID",
        `Name: ${profile.firstName} ${profile.lastName}${profile.suffix ? ` ${profile.suffix}` : ""}`,
        `Student No: ${profile.studentNo}`,
        `Section: ${profile.sectionLabel}`,
        `Email: ${profile.email}`,
      ].join("\n")
    : "";

  async function handleSave() {
    startTransition(async () => {
      const result = await sileo.promise(
        () =>
          updateStudentProfile({
            firstName,
            lastName,
            suffix,
            studentNo,
            programId: programId || null,
            yearLevelId: yearLevelId || null,
            sectionId: sectionId || null,
          }),
        {
          loading: { title: "Saving", description: "Updating your profile…", icon: <Pencil /> },
          success: { title: "Profile updated", description: "Your changes have been saved.", icon: <Check /> },
          error: (err) => ({ title: "Could not save", description: err instanceof Error ? err.message : "Please try again.", icon: <Upload /> }),
        },
      );
      if (result.ok) {
        const data = await getStudentProfile();
        setProfile(data);
        setEditing(false);
      }
    });
  }

  function cancelEdit() {
    setEditing(false);
    if (profile) {
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setSuffix(profile.suffix ?? "");
      setStudentNo(profile.studentNo);
      setProgramId(profile.programId ?? "");
      setYearLevelId(profile.yearLevelId ?? "");
      setSectionId(profile.sectionId ?? "");
    }
  }

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      const result = await sileo.promise(
        () => uploadStudentAvatar(formData),
        {
          loading: { title: "Uploading photo", description: "Updating your avatar…", icon: <Upload /> },
          success: { title: "Photo updated", description: "Your avatar has been changed.", icon: <Check /> },
          error: (err) => ({ title: "Could not upload", description: err instanceof Error ? err.message : "Please try again.", icon: <Camera /> }),
        },
      );
      if (result.ok && result.imageUrl) {
        setProfile((prev) => (prev ? { ...prev, imageUrl: result.imageUrl! } : prev));
        onAvatarChange?.(result.imageUrl!);
      }
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  async function handleExport() {
    setExporting(true);
    try {
      const result = await exportStudentData();
      if (!result.ok) {
        sileo.error({ title: "Export failed", description: result.error });
        return;
      }
      downloadXlsx(result.file.name, result.file.content);
      sileo.success({
        title: "Data downloaded",
        description:
          "Your Excel file contains your profile, attendance, sanctions, and fees.",
        icon: <Download />,
      });
    } catch (err) {
      sileo.error({
        title: "Export failed",
        description: err instanceof Error ? err.message : "Please try again.",
        icon: <Download />,
      });
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const result = await deactivateAccount();
      if (!result.ok) {
        sileo.error({ title: "Could not delete account", description: result.error });
        return;
      }
      await signOut();
      router.replace("/");
    } catch (err) {
      sileo.error({
        title: "Could not delete account",
        description: err instanceof Error ? err.message : "Please try again.",
        icon: <Trash2 />,
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className={styles.modalTitle}>
          <span className={styles.modalTitleIcon}>
            <User size={16} />
          </span>
          My Profile
        </div>
      }
      footer={
        deleteView === "confirm" ? (
          <div className={styles.deleteFooter}>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setDeleteView("closed")}
              disabled={exporting || deleting}
            >
              Keep my account
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={handleExport}
              disabled={exporting || deleting}
            >
              <Download size={14} />
              Download my data
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={handleDelete}
              disabled={exporting || deleting}
            >
              <Trash2 size={14} />
              Delete my account
            </Button>
          </div>
        ) : editing ? (
          <ModalActions
            onCancel={cancelEdit}
            cancelLabel="Cancel"
            confirmLabel={isPending ? "Saving…" : "Save changes"}
            onConfirm={handleSave}
            disabled={
              isPending ||
              !firstName.trim() ||
              !lastName.trim() ||
              !studentNo.trim()
            }
          />
        ) : (
          <ModalActions onCancel={onClose} cancelLabel="Close" />
        )
      }
    >
      {deleteView === "confirm" ? (
        <div className={styles.deleteView}>
          <span className={styles.deleteIcon}>
            <AlertTriangle size={20} />
          </span>
          <h3 className={styles.deleteTitle}>Delete your account?</h3>
          <p className={styles.deleteText}>
            Your account will be deactivated and you will no longer be able to
            sign in. Your attendance, sanction, and fee history will be kept
            for admin records.
          </p>
          <p className={styles.deleteText}>
            Would you like to download a copy of your data first?
          </p>
        </div>
      ) : (
        <>
      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "profile"}
          className={`${styles.tab} ${tab === "profile" ? styles.tabActive : ""}`}
          onClick={() => setTab("profile")}
        >
          <User size={14} />
          Profile
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "qr"}
          className={`${styles.tab} ${tab === "qr" ? styles.tabActive : ""}`}
          onClick={() => setTab("qr")}
        >
          <QrCode size={14} />
          QR Code
        </button>
      </div>

      {loading && <div className={styles.loading}>Loading profile…</div>}

      {!loading && !profile && (
        <div className={styles.loading}>Could not load your profile.</div>
      )}

      {!loading && profile && tab === "profile" && (
        <div className={styles.profileBody}>
          <div className={styles.avatarWrap}>
            <span className={styles.avatarLarge}>
              {profile.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.imageUrl} alt="Profile" className={styles.avatarImg} />
              ) : (
                <User size={28} />
              )}
            </span>
            <button
              type="button"
              className={styles.cameraBtn}
              title="Change photo"
              onClick={() => fileRef.current?.click()}
            >
              <Camera size={13} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              className={styles.hiddenInput}
              onChange={handleAvatar}
            />
          </div>

          {!editing ? (
            <>
              <div className={styles.infoGrid}>
                <InfoRow label="Name" value={`${profile.firstName} ${profile.lastName}${profile.suffix ? ` ${profile.suffix}` : ""}`} />
                <InfoRow label="Student No." value={profile.studentNo} />
                <InfoRow label="Section" value={profile.sectionLabel} />
                <InfoRow label="Email" value={profile.email} />
              </div>
              <button
                type="button"
                className={styles.editBtn}
                onClick={() => setEditing(true)}
              >
                <Pencil size={13} />
                Edit details
              </button>
              <button
                type="button"
                className={styles.deleteAccountBtn}
                onClick={() => setDeleteView("confirm")}
              >
                <Trash2 size={13} />
                Delete account
              </button>
            </>
          ) : (
            <div className={styles.editForm}>
              <div className={styles.editGrid}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="profileFirstName">
                    First name
                  </label>
                  <input
                    id="profileFirstName"
                    className={styles.input}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="profileLastName">
                    Last name
                  </label>
                  <input
                    id="profileLastName"
                    className={styles.input}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="profileSuffix">
                    Suffix
                  </label>
                  <input
                    id="profileSuffix"
                    className={styles.input}
                    value={suffix}
                    onChange={(e) => setSuffix(e.target.value)}
                    placeholder="e.g. Jr., III"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="profileStudentNo">
                    Student No.
                  </label>
                  <input
                    id="profileStudentNo"
                    className={styles.input}
                    value={studentNo}
                    onChange={(e) => setStudentNo(e.target.value)}
                    placeholder="e.g. 2025-0001"
                  />
                </div>
              </div>
              <div className={styles.editGrid}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="profileProgram">
                    Program
                  </label>
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
                  <label className={styles.label} htmlFor="profileYear">
                    Year level
                  </label>
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
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="profileSection">
                  Section
                </label>
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
        </div>
      )}

      {!loading && profile && tab === "qr" && (
        <div className={styles.qrBody}>
          <div className={styles.qrCard}>
            <QRCode value={qrValue} size={188} level="M" />
          </div>
          <div className={styles.qrName}>
            {profile.firstName} {profile.lastName}
            {profile.suffix ? ` ${profile.suffix}` : ""}
          </div>
          <div className={styles.qrMeta}>
            <span>{profile.studentNo}</span>
            <span className={styles.qrDot}>·</span>
            <span>{profile.sectionLabel}</span>
          </div>
          <p className={styles.qrHint}>
            Present this code when attending Liberalis activities for quick identity
            scanning.
          </p>
        </div>
      )}
        </>
      )}

      <LoadingOverlay
        open={isPending || exporting || deleting}
        label={
          deleting
            ? "Deleting your account…"
            : exporting
              ? "Preparing your data…"
              : "Saving your profile…"
        }
      />
    </Modal>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value}</span>
    </div>
  );
}