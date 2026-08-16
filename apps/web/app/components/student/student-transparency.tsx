"use client";

import { useState } from "react";
import { Download, ExternalLink, FileText, FolderOpen } from "lucide-react";
import type { StudentTransparencyItem } from "./types";
import { Drawer } from "@/app/components/ui/drawer";
import base from "./student-feed.module.css";
import styles from "./student-transparency.module.css";

const TONE_FOLDER: Record<StudentTransparencyItem["categoryTone"], string> = {
  green: "#047857",
  violet: "#6d28d9",
  amber: "#b45309",
  brand: "#1d4ed8",
};

const TONE_FILE: Record<StudentTransparencyItem["categoryTone"], string> = {
  green: "#34d399",
  violet: "#a78bfa",
  amber: "#fbbf24",
  brand: "#60a5fa",
};

function fileExt(url: string): string {
  const clean = url.split("?")[0];
  const match = /\.([a-zA-Z0-9]+)$/.exec(clean);
  return (match?.[1] ?? "FILE").toUpperCase();
}

function isPdf(url: string): boolean {
  return fileExt(url) === "PDF";
}

function isImage(url: string): boolean {
  return ["JPG", "JPEG", "PNG", "GIF", "WEBP", "SVG"].includes(fileExt(url));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type FolderCardProps = {
  item: StudentTransparencyItem;
  open: boolean;
  onOpen: () => void;
};

function FolderCard({ item, open, onOpen }: FolderCardProps) {
  const color = TONE_FOLDER[item.categoryTone];
  const fileColor = TONE_FILE[item.categoryTone];

  return (
    <button
      type="button"
      className={`${styles.folderCard}${open ? ` ${styles.folderOpen}` : ""}`}
      onClick={onOpen}
      title={`View ${item.title}`}
      aria-label={`Open ${item.title}`}
    >
      <div className={styles.folderContainer}>
        <svg className={styles.folderBack} viewBox="0 0 50 40" fill="none" aria-hidden="true">
          <path
            d="M0 4C0 1.79086 1.79086 0 4 0H16.524C17.721 0 18.8415 0.54051 19.574 1.4673L22.426 5.0654C23.1585 5.99219 24.279 6.5327 25.476 6.5327H46C48.2091 6.5327 50 8.32356 50 10.5327V36C50 38.2091 48.2091 40 46 40H4C1.79086 40 0 38.2091 0 36V4Z"
            fill={color}
          />
        </svg>

        <div className={styles.file} style={{ background: fileColor }}>
          <div className={styles.shine} />
          <FileText size={14} className={styles.fileIcon} />
          <div className={styles.fileText}>{item.title}</div>
          <div className={styles.fileTag}>{item.categoryLabel}</div>
        </div>

        <div className={styles.folderFrontWrapper}>
          <svg className={styles.folderFront} viewBox="0 0 50 34" fill="none" aria-hidden="true">
            <path
              d="M0 4C0 1.79086 1.79086 0 4 0H46C48.2091 0 50 1.79086 50 4V30C50 32.2091 48.2091 34 46 34H4C1.79086 34 0 32.2091 0 30V4Z"
              fill={color}
              fillOpacity="0.65"
            />
          </svg>
          <div className={styles.folderLabel} />
          <div className={styles.counter}>
            <span className={styles.statusDot} />
            <span className={styles.counterLabel}>FILE</span>
            <span className={styles.counterNumber}>01</span>
          </div>
        </div>
      </div>
      <span className={styles.folderTitle}>{item.title}</span>
    </button>
  );
}

type StudentTransparencyProps = {
  items: StudentTransparencyItem[];
  allItems: StudentTransparencyItem[];
  count: number;
};

export function StudentTransparency({ items, allItems, count }: StudentTransparencyProps) {
  const [selected, setSelected] = useState<StudentTransparencyItem | null>(null);
  const [showAll, setShowAll] = useState(false);

  return (
    <section id="transparency" className={base.card}>
      <header className={base.header}>
        <div className={base.heading}>
          <span className={base.headingIcon}>
            <FolderOpen size={16} />
          </span>
          <div>
            <h3 className={base.title}>Transparency</h3>
            <p className={base.subtitle}>{count} financial documents and reports</p>
          </div>
        </div>
        <button type="button" className={styles.link} onClick={() => setShowAll(true)}>
          View all files
        </button>
      </header>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>
            <FolderOpen size={20} />
          </span>
          <span className={styles.emptyTitle}>No files uploaded yet.</span>
        </div>
      ) : (
        <div className={styles.folderGrid}>
          {items.map((f) => (
            <FolderCard
              key={f.id}
              item={f}
              open={selected?.id === f.id}
              onOpen={() => setSelected(f)}
            />
          ))}
        </div>
      )}

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        wide
        title={
          selected ? (
            <span className={styles.titleWrap}>
              <span className={styles.titleIcon}>
                <FolderOpen size={16} />
              </span>
              <span>
                <span className={styles.titleLine}>Document</span>
                <span className={styles.subtitle}>{selected.title}</span>
              </span>
            </span>
          ) : undefined
        }
        footer={
          selected ? (
            <div className={styles.footerActions}>
              <a
                className={styles.primaryBtn}
                href={selected.fileUrl}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink size={14} />
                Open in new tab
              </a>
              <a className={styles.ghostBtn} href={selected.fileUrl} download>
                <Download size={14} />
                Download
              </a>
            </div>
          ) : undefined
        }
      >
        {selected && (
          <div className={styles.viewer}>
            <div className={styles.viewerMeta}>
              Uploaded by {selected.uploadedBy} · {formatDate(selected.uploadedAt)}
            </div>
            {isPdf(selected.fileUrl) ? (
              <iframe
                src={selected.fileUrl}
                className={styles.pdfFrame}
                title={selected.title}
              />
            ) : isImage(selected.fileUrl) ? (
              <div className={styles.imageFrameWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selected.fileUrl}
                  alt={selected.title}
                  className={styles.imageFrame}
                />
              </div>
            ) : (
              <div className={styles.viewerFallback}>
                <FileText size={32} />
                <p>Preview not available for this file type.</p>
                <p className={styles.viewerFallbackHint}>
                  Open the file in a new tab to view it.
                </p>
              </div>
            )}
          </div>
        )}
      </Drawer>
      <Drawer
        open={showAll}
        onClose={() => setShowAll(false)}
        wide
        title={
          <span className={styles.titleWrap}>
            <span className={styles.titleIcon}>
              <FolderOpen size={16} />
            </span>
            <span>
              <span className={styles.titleLine}>All files</span>
              <span className={styles.subtitle}>
                {count} document{count === 1 ? "" : "s"} uploaded
              </span>
            </span>
          </span>
        }
      >
        <div className={styles.folderGrid}>
          {allItems.length === 0 && <p className={styles.allEmpty}>No files uploaded yet.</p>}
          {allItems.map((f) => (
            <FolderCard
              key={f.id}
              item={f}
              open={selected?.id === f.id}
              onOpen={() => {
                setShowAll(false);
                setSelected(f);
              }}
            />
          ))}
        </div>
      </Drawer>
    </section>
  );
}
