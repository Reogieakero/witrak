"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { PlusCircle, Megaphone, ImagePlus, X, Pencil } from "lucide-react";
import { Modal } from "@/app/components/ui/modal";
import { Drawer } from "@/app/components/ui/drawer";
import { ModalActions } from "@/app/components/ui/modal-actions";
import { Button } from "@/app/components/ui/button";
import { Select } from "@/app/components/ui/select";
import type {
  AnnouncementsModalsProps,
  AnnouncementItem,
  ProgramOption,
} from "./types";
import styles from "./announcements-modals.module.css";

function AudienceField({
  scope,
  setScope,
  programId,
  setProgramId,
  programs,
}: {
  scope: "all" | "program";
  setScope: (s: "all" | "program") => void;
  programId: string;
  setProgramId: (id: string) => void;
  programs: ProgramOption[];
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>Audience</label>
      <div className={styles.segment}>
        <button
          type="button"
          className={`${styles.segmentBtn} ${scope === "all" ? styles.segmentActive : ""}`}
          onClick={() => setScope("all")}
        >
          All students
        </button>
        <button
          type="button"
          className={`${styles.segmentBtn} ${scope === "program" ? styles.segmentActive : ""}`}
          onClick={() => setScope("program")}
        >
          Specific program
        </button>
      </div>
      {scope === "program" && (
        <Select
          name="programId"
          value={programId}
          onChange={setProgramId}
          placeholder="Select a program…"
          options={programs.map((p) => ({ value: p.id, label: p.name }))}
        />
      )}
    </div>
  );
}

function CreateModal({
  busy,
  onCreate,
  onClose,
  programs,
}: {
  busy: boolean;
  onCreate: AnnouncementsModalsProps["onCreate"];
  onClose: () => void;
  programs: ProgramOption[];
}) {
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scope, setScope] = useState<"all" | "program">("all");
  const [programId, setProgramId] = useState<string>("");

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (file) fd.set("image", file);
    fd.set("scope", scope);
    fd.set("programId", scope === "program" ? programId : "");
    onCreate(fd);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={
        <span className={styles.modalTitle}>
          <span className={styles.headIcon}>
            <PlusCircle size={16} />
          </span>
          <span>
            <span className={styles.titleLine}>Create Announcement</span>
            <span className={styles.subtitle}>Share an update with all students</span>
          </span>
        </span>
      }
      footer={
        <ModalActions
          onCancel={onClose}
          cancelLabel={busy ? "Working…" : "Cancel"}
          confirmType="submit"
          confirmForm="announcement-form"
          confirmLabel={busy ? "Publishing…" : "Publish Announcement"}
          disabled={busy}
        />
      }
    >
      <form id="announcement-form" onSubmit={submit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>
            Title <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="title"
            required
            placeholder="e.g. Midterm Grade Release Schedule"
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            Body <span className={styles.required}>*</span>
          </label>
          <textarea
            name="body"
            required
            rows={5}
            placeholder="Write the full announcement. Keep it clear and actionable."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className={styles.area}
          />
          <span className={styles.hint}>{body.length}/1000 characters</span>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Attach image</label>
          {preview ? (
            <div className={styles.previewWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Announcement preview" className={styles.previewImg} />
              <button
                type="button"
                className={styles.previewRemove}
                onClick={() => setFile(null)}
                title="Remove image"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className={styles.imageButton}>
              <ImagePlus size={16} />
              <span>Add a photo</span>
              <input
                type="file"
                accept="image/*"
                className={styles.hiddenInput}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          )}
          <span className={styles.hint}>Optional. JPG, PNG or GIF, up to 5 MB. Stored in Supabase.</span>
        </div>

        <AudienceField
          scope={scope}
          setScope={setScope}
          programId={programId}
          setProgramId={setProgramId}
          programs={programs}
        />
      </form>
    </Modal>
  );
}

function EditModal({
  item,
  programs,
  busy,
  onUpdate,
  onClose,
}: {
  item: AnnouncementItem;
  programs: ProgramOption[];
  busy: boolean;
  onUpdate: AnnouncementsModalsProps["onUpdate"];
  onClose: () => void;
}) {
  const [body, setBody] = useState(item.body ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [scope, setScope] = useState<"all" | "program">(
    item.scopeType === "PROGRAM" ? "program" : "all",
  );
  const [programId, setProgramId] = useState<string>(item.programId ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("id", item.id);
    if (file) fd.set("image", file);
    fd.set("scope", scope);
    fd.set("programId", scope === "program" ? programId : "");
    fd.set("removeImage", removeImage ? "true" : "false");
    onUpdate(fd);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={
        <span className={styles.modalTitle}>
          <span className={styles.headIcon}>
            <Pencil size={16} />
          </span>
          <span>
            <span className={styles.titleLine}>Edit Announcement</span>
            <span className={styles.subtitle}>Update the announcement details</span>
          </span>
        </span>
      }
      footer={
        <ModalActions
          onCancel={onClose}
          cancelLabel={busy ? "Working…" : "Cancel"}
          confirmType="submit"
          confirmForm="announcement-edit-form"
          confirmLabel={busy ? "Saving…" : "Save Changes"}
          disabled={busy}
        />
      }
    >
      <form id="announcement-edit-form" onSubmit={submit} className={styles.form}>
        <input type="hidden" name="id" value={item.id} />

        <div className={styles.field}>
          <label className={styles.label}>
            Title <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="title"
            required
            defaultValue={item.title}
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            Body <span className={styles.required}>*</span>
          </label>
          <textarea
            name="body"
            required
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className={styles.area}
          />
          <span className={styles.hint}>{body.length}/1000 characters</span>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Attach image</label>
          {file ? (
            <div className={styles.previewWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview ?? ""} alt="Announcement preview" className={styles.previewImg} />
              <button
                type="button"
                className={styles.previewRemove}
                onClick={() => setFile(null)}
                title="Remove image"
              >
                <X size={16} />
              </button>
            </div>
          ) : removeImage ? (
            <div className={styles.imageNote}>
              <span>Image will be removed on save.</span>
              <button
                type="button"
                className={styles.imageLink}
                onClick={() => setRemoveImage(false)}
              >
                Keep current
              </button>
            </div>
          ) : item.imageUrl ? (
            <div className={styles.currentImage}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.imageUrl} alt={item.title} className={styles.previewImg} />
              <div className={styles.imageActions}>
                <button
                  type="button"
                  className={styles.imageLink}
                  onClick={() => fileRef.current?.click()}
                >
                  Replace
                </button>
                <button
                  type="button"
                  className={styles.imageLink}
                  onClick={() => setRemoveImage(true)}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <label className={styles.imageButton}>
              <ImagePlus size={16} />
              <span>Add a photo</span>
              <input
                type="file"
                accept="image/*"
                className={styles.hiddenInput}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className={styles.hiddenInput}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <span className={styles.hint}>Optional. JPG, PNG or GIF, up to 5 MB. Stored in Supabase.</span>
        </div>

        <AudienceField
          scope={scope}
          setScope={setScope}
          programId={programId}
          setProgramId={setProgramId}
          programs={programs}
        />
      </form>
    </Modal>
  );
}

function ViewDrawer({
  item,
  onClose,
  onEdit,
  onDelete,
}: {
  item: AnnouncementItem;
  onClose: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Drawer
      open
      onClose={onClose}
      wide
      title={
        <span className={styles.modalTitle}>
          <span className={styles.headIcon}>
            <Megaphone size={16} />
          </span>
          <span>
            <span className={styles.titleRow}>
              <span className={styles.titleLine}>Announcement</span>
              {item.audience && (
                <span className={styles.audienceBadge}>{item.audience}</span>
              )}
            </span>
            <span className={styles.subtitle}>{item.createdAt}</span>
          </span>
        </span>
      }
      footer={
        <div className={styles.drawerActions}>
          <div className={styles.drawerActionsRight}>
            <Button variant="primary" size="md" onClick={() => onEdit(item.id)}>
              Edit
            </Button>
            <Button variant="danger" size="md" onClick={() => onDelete(item.id)}>
              Delete
            </Button>
          </div>
        </div>
      }
    >
      <div className={styles.drawerBody}>
        {item.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.title} className={styles.drawerImage} />
        )}
        <div className={styles.fieldGroup}>
          <span className={styles.drawerLabel}>Title</span>
          <h3 className={styles.drawerTitle}>{item.title}</h3>
        </div>
        <div className={styles.fieldGroup}>
          <span className={styles.drawerLabel}>Description</span>
          <p className={styles.drawerPar}>{item.body}</p>
        </div>
      </div>
    </Drawer>
  );
}

export function AnnouncementsModals({
  announcements,
  programs,
  modal,
  drawer,
  busy,
  onCloseModal,
  onCloseDrawer,
  onCreate,
  onUpdate,
  onEdit,
  onDelete,
}: AnnouncementsModalsProps) {
  const viewItem =
    drawer?.kind === "view" ? announcements.find((a) => a.id === drawer.id) : undefined;
  const editItem =
    modal?.kind === "edit" ? announcements.find((a) => a.id === modal.id) : undefined;

  return (
    <>
      {modal?.kind === "create" && (
        <CreateModal busy={busy} onCreate={onCreate} onClose={onCloseModal} programs={programs} />
      )}
      {modal?.kind === "edit" && editItem && (
        <EditModal
          item={editItem}
          programs={programs}
          busy={busy}
          onUpdate={onUpdate}
          onClose={onCloseModal}
        />
      )}
      {drawer?.kind === "view" && viewItem && (
        <ViewDrawer item={viewItem} onClose={onCloseDrawer} onEdit={onEdit} onDelete={onDelete} />
      )}
    </>
  );
}
