"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash2, FileText, Loader2 } from "lucide-react";
import { sileo } from "sileo";
import { Button } from "@/app/components/ui/button";
import { LoadingOverlay } from "@/app/components/ui/loading-overlay";
import { ModalActions } from "@/app/components/ui/modal-actions";
import { ConfirmationModal } from "@/app/components/ui/confirmation-modal";
import { Select } from "@/app/components/ui/select";
import type { TransparencyFileItem, TransparencyStats } from "./types";
import { TransparencyStatsGrid } from "./transparency-stats";
import { TransparencyList } from "./transparency-list";
import { TransparencySidebar } from "./transparency-sidebar";
import { deleteTransparencyFile } from "@/app/admin/transparency/actions";
import styles from "./transparency-view.module.css";

type CategoryFilter = "all" | string;

export type TransparencyViewProps = {
  items: TransparencyFileItem[];
  stats: TransparencyStats;
  canUpload: boolean;
};

export function TransparencyView({ items, stats, canUpload }: TransparencyViewProps) {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<"closed" | "upload" | "delete" | "view">("closed");
  const [deleteTarget, setDeleteTarget] = useState<TransparencyFileItem | null>(null);
  const [viewTarget, setViewTarget] = useState<TransparencyFileItem | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, startUpload] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const router = useRouter();

  const filtered = items.filter((f) => {
    const matchesCategory = category === "all" || f.category === category;
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || f.title.toLowerCase().includes(q) || f.uploadedBy.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  const handleUpload = () => {
    setModal("upload");
  };

  const handleView = (file: TransparencyFileItem) => {
    setViewTarget(file);
    setModal("view");
  };

  const handleDeleteClick = (file: TransparencyFileItem) => {
    setDeleteTarget(file);
    setModal("delete");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setUploadFile(file);
  };

  const handleUploadSubmit = async (formData: FormData) => {
    setBusy(true);
    setBusyLabel("Uploading file…");
    startUpload(async () => {
      try {
        const uploadFormData = new FormData();
        const category = (formData.get("category") as string) || "reports";
        const title = (formData.get("title") as string) ?? "";
        uploadFormData.append("title", title.trim());
        uploadFormData.append("category", category);
        const file = formData.get("file") as File | null;
        if (file) uploadFormData.append("file", file);

        const result = await sileo.promise(
          async () => {
            const res = await fetch("/api/transparency/upload", {
              method: "POST",
              body: uploadFormData,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Upload failed.");
            return data;
          },
          {
            loading: {
              title: "Uploading file",
              description: "Publishing your document...",
              icon: <Loader2 />,
            },
            success: {
              title: "File uploaded",
              description: "The document is now visible to all members.",
              icon: <Upload />,
            },
            error: (err) => ({
              title: "Upload failed",
              description: err instanceof Error ? err.message : "Please try again.",
              icon: <FileText />,
            }),
          },
        );
        if (result.ok) {
          setModal("closed");
          setUploadFile(null);
          router.refresh();
        }
      } finally {
        setBusy(false);
        setBusyLabel(null);
      }
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    setBusy(true);
    setBusyLabel("Deleting file…");
    startDelete(async () => {
      try {
        const result = await sileo.promise(
          async () => {
            const res = await deleteTransparencyFile(deleteTarget.id);
            if (!res.ok) throw new Error(res.error ?? "Delete failed.");
            return res;
          },
          {
            loading: {
              title: "Deleting file",
              description: `Removing "${deleteTarget.title}"...`,
              icon: <Trash2 />,
            },
            success: {
              title: "File deleted",
              description: `"${deleteTarget.title}" was removed.`,
              icon: <Trash2 />,
            },
            error: (err) => ({
              title: "Delete failed",
              description: err instanceof Error ? err.message : "Please try again.",
              icon: <FileText />,
            }),
          },
        );
        if (result.ok) {
          setModal("closed");
          setDeleteTarget(null);
          router.refresh();
        }
      } finally {
        setBusy(false);
        setBusyLabel(null);
      }
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.mainCol}>
        <div className={styles.pageHeader}>
          <div>
            <div className={styles.titleRow}>
              <h1 className={styles.pageTitle}>Transparency</h1>
            </div>
            <p className={styles.pageSubtitle}>
              Publish budgets, reports, minutes, and org documents for the whole student body.
            </p>
          </div>
          <div className={styles.actions}>
            {canUpload && (
              <Button variant="primary" size="md" onClick={handleUpload}>
                Upload File
              </Button>
            )}
          </div>
        </div>

        <TransparencyStatsGrid stats={stats} />

        <TransparencyList
          items={filtered}
          category={category}
          query={query}
          onCategoryChange={setCategory}
          onQueryChange={setQuery}
          onView={handleView}
          onDelete={handleDeleteClick}
        />
      </div>

      <TransparencySidebar stats={stats} items={items} onView={handleView} />

      {modal === "view" && viewTarget && (
        <div className={styles.modalOverlay} onClick={() => setModal("closed")}>
          <div className={`${styles.modal} ${styles.viewModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <div className={`${styles.modalIcon} ${styles[`viewIcon${viewTarget.categoryTone.charAt(0).toUpperCase() + viewTarget.categoryTone.slice(1)}`]}`}>
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className={styles.modalTitle}>{viewTarget.title}</h3>
                  <p className={styles.modalSubtitle}>{viewTarget.categoryLabel} · {viewTarget.uploadedAt} · {viewTarget.size || "document"}</p>
                </div>
              </div>
            </div>

            <div className={styles.viewFooter}>
              {viewTarget.fileType && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(viewTarget.fileUrl) ? (
                <div className={styles.viewImageWrapper}>
                  <img
                    src={viewTarget.fileUrl}
                    alt={viewTarget.title}
                    className={styles.viewImage}
                  />
                </div>
              ) : viewTarget.fileType === "pdf" ? (
                <embed
                  src={viewTarget.fileUrl}
                  type="application/pdf"
                  className={styles.viewPdf}
                />
              ) : (
                <div className={styles.viewPlaceholder}>
                  <div className={styles.viewPlaceholderIcon}>
                    <FileText size={32} />
                  </div>
                  <p className={styles.viewPlaceholderText}>No inline preview available for this file type.</p>
                </div>
              )}
            </div>

            <div className={styles.viewActions}>
              <ModalActions
                onCancel={() => setModal("closed")}
                cancelLabel="Close"
                confirmLabel="Download"
                onConfirm={() => {
                  window.open(viewTarget.fileUrl, "_blank", "noopener,noreferrer");
                }}
              />
            </div>
          </div>
        </div>
      )}

      {modal === "upload" && (
        <div className={styles.modalOverlay} onClick={() => setModal("closed")}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <div className={styles.modalIcon}>
                  <Upload size={18} />
                </div>
                <div>
                  <h3 className={styles.modalTitle}>Upload transparency file</h3>
                  <p className={styles.modalSubtitle}>Publish a document for all members to view</p>
                </div>
              </div>
            </div>

            <form id="upload-form" action={handleUploadSubmit} className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="title">File title</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="e.g. Semester 2 Budget Report"
                  required
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Category</label>
                <Select
                  name="category"
                  placeholder="Select category"
                  options={[
                    { value: "financial", label: "Financial" },
                    { value: "events", label: "Events" },
                    { value: "minutes", label: "Minutes" },
                    { value: "reports", label: "Reports" },
                  ]}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>File</label>
                <label className={styles.fileDrop}>
                  <div className={styles.fileDropIcon}>
                    <FileText size={20} />
                  </div>
                  <span className={styles.fileDropText}>Click to choose a PDF or image</span>
                  <span className={styles.fileDropHint}>Max 10 MB</span>
                  <input
                    name="file"
                    type="file"
                    accept=".pdf,image/*"
                    className={styles.fileInput}
                    onChange={handleFileChange}
                    required
                  />
                </label>
              </div>

              {uploadFile && (
                <div className={styles.filePreview}>
                  {uploadFile.type.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={URL.createObjectURL(uploadFile)}
                      alt="preview"
                      className={styles.filePreviewImage}
                    />
                  ) : (
                    <div className={styles.filePreviewPdf}>
                      <FileText size={32} />
                      <span className={styles.filePreviewName}>{uploadFile.name}</span>
                    </div>
                  )}
                </div>
              )}

              <ModalActions
                onCancel={() => { setModal("closed"); setUploadFile(null); }}
                cancelLabel="Cancel"
                confirmLabel="Publish File"
                confirmType="submit"
                confirmForm="upload-form"
              />
            </form>
          </div>
        </div>
      )}

      {modal === "delete" && deleteTarget && (
        <ConfirmationModal
          open
          title="Delete this file?"
          description={
            <>
              You are about to delete <strong>{deleteTarget.title}</strong> from the
              public transparency list. This cannot be undone. Type the file title to
              continue.
            </>
          }
          confirmLabel="Delete File"
          confirmToken={deleteTarget.title}
          variant="danger"
          onConfirm={handleDeleteConfirm}
          onClose={() => setModal("closed")}
        />
      )}

      <LoadingOverlay open={busy || isUploading || isDeleting} label={busyLabel ?? "Working…"} />
    </div>
  );
}
