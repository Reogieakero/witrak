"use client";

import { FileText } from "lucide-react";
import type { TransparencyFileItem } from "./types";
import styles from "./transparency-folder.module.css";

export function TransparencyFolder({
  files,
  onView,
}: {
  files: TransparencyFileItem[];
  onView: (file: TransparencyFileItem) => void;
}) {
  const latest = files.slice(0, 3);

  return (
    <label className={styles.folderCard}>
      <input type="checkbox" className={styles.folderToggle} />

      <div className={styles.hintWrapper}>
        <span className={styles.hintText}>Click to open</span>
        <svg
          className={styles.hintArrow}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 35 5 C 35 5, 15 5, 10 25 M 10 25 L 3 18 M 10 25 L 18 22"
            stroke="#60a5fa"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className={styles.folderContainer}>
        <svg className={styles.folderBack} viewBox="0 0 50 40" fill="none">
          <path
            d="M0 4C0 1.79086 1.79086 0 4 0H16.524C17.721 0 18.8415 0.54051 19.574 1.4673L22.426 5.0654C23.1585 5.99219 24.279 6.5327 25.476 6.5327H46C48.2091 6.5327 50 8.32356 50 10.5327V36C50 38.2091 48.2091 40 46 40H4C1.79086 40 0 38.2091 0 36V4Z"
            fill="#0056b3"
          />
        </svg>

        <div className={styles.folderSearch}>
          <svg
            className={styles.searchIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" placeholder="Search files..." className={styles.searchInput} />
        </div>

        {latest.map((f, i) => {
          const idx = i + 1;
          return (
            <button
              key={f.id}
              type="button"
              className={`${styles.file} ${styles[`file${idx}`]}`}
              onClick={(e) => {
                e.preventDefault();
                onView(f);
              }}
              title={`View ${f.title}`}
            >
              <div className={styles.shine} />
              <FileText className={styles.fileIcon} />
              <div className={styles.fileText}>{f.title}</div>
              <div className={styles.fileTag}>
                {(f.fileType || "file").toUpperCase()} • {f.size || "—"}
              </div>
            </button>
          );
        })}

        <div className={styles.folderFrontWrapper}>
          <svg className={styles.folderFront} viewBox="0 0 50 34" fill="none">
            <path
              d="M0 4C0 1.79086 1.79086 0 4 0H46C48.2091 0 50 1.79086 50 4V30C50 32.2091 48.2091 34 46 34H4C1.79086 34 0 32.2091 0 30V4Z"
              fill="rgba(0, 123, 255, 0.65)"
            />
          </svg>
          <div className={styles.folderLabel} />
          <div className={styles.counter}>
            <div className={styles.statusDot} />
            <span className={styles.counterLabel}>FILES</span>
            <span className={styles.counterNumber}>
              {String(latest.length).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>
    </label>
  );
}
