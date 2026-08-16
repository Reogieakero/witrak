"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Camera, Check, Pencil, QrCode, Upload, User, X } from "lucide-react";
import QRCode from "react-qr-code";
import { sileo } from "sileo";
import { Modal } from "@/app/components/ui/modal";
import {
  getStudentProfile,
  updateStudentProfile,
  uploadStudentAvatar,
  type StudentProfile,
} from "@/app/dashboard/profile/actions";
import styles from "./student-profile-modal.module.css";

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
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setTab("profile");
      setEditing(false);
      setLoading(true);
      const data = await getStudentProfile();
      if (cancelled) return;
      setProfile(data);
      if (data) {
        setFirstName(data.firstName);
        setLastName(data.lastName);
        setSuffix(data.suffix ?? "");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

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
    >
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
              </div>
              <div className={styles.editActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => {
                    setEditing(false);
                    if (profile) {
                      setFirstName(profile.firstName);
                      setLastName(profile.lastName);
                      setSuffix(profile.suffix ?? "");
                    }
                  }}
                >
                  <X size={13} />
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.saveBtn}
                  onClick={handleSave}
                  disabled={isPending || !firstName.trim() || !lastName.trim()}
                >
                  <Check size={13} />
                  Save changes
                </button>
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