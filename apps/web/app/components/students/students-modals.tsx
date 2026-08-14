"use client";

import { GraduationCap } from "lucide-react";
import { Drawer } from "@/app/components/ui/drawer";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import type {
  StudentsModalsProps,
  StudentAccount,
} from "./types";
import styles from "./students-modals.module.css";

function yearLabel(level: number | null): string {
  if (!level) return "—";
  const suffix = ["th", "st", "nd", "rd"][level] ?? "th";
  return `${level}${suffix} Year`;
}

function ViewDrawer({
  item,
  canManage,
  onSuspend,
  onClose,
}: {
  item: StudentAccount;
  canManage: boolean;
  onSuspend: (id: string) => void;
  onClose: () => void;
}) {  return (
    <Drawer
      open
      onClose={onClose}
      title={
        <span className={styles.modalTitle}>
          <span className={styles.headIcon}>
            <GraduationCap size={16} />
          </span>
          <span>
            <span className={styles.titleLine}>{item.name}</span>
            <span className={styles.subtitle}>{item.studentNo}</span>
          </span>
        </span>
      }
      footer={
        canManage ? (
          <div className={styles.drawerFooter}>
            <div className={styles.drawerFooterGroup}>
              <Button
                type="button"
                variant="primary"
                size="md"
                className={styles.suspendBtn}
                onClick={() => onSuspend(item.id)}
              >
                {item.suspended ? "Reinstate" : "Suspend"}
              </Button>
            </div>
          </div>
        ) : undefined
      }
    >
      <div className={styles.drawerBody}>
        <div className={styles.fieldGroup}>
          <span className={styles.drawerLabel}>Account Status</span>
          {item.suspended ? (
            <Badge tone="amber">Suspended</Badge>
          ) : (
            <Badge tone="green">Active</Badge>
          )}
        </div>
        <div className={styles.detailGrid}>
          <div className={styles.detailCell}>
            <span className={styles.detailLabel}>Email</span>
            <span className={styles.detailValue}>{item.email}</span>
          </div>
          <div className={styles.detailCell}>
            <span className={styles.detailLabel}>Student No.</span>
            <span className={styles.detailValue}>{item.studentNo}</span>
          </div>
          <div className={styles.detailCell}>
            <span className={styles.detailLabel}>Program</span>
            <span className={styles.detailValue}>{item.programName ?? "—"}</span>
          </div>
          <div className={styles.detailCell}>
            <span className={styles.detailLabel}>Year Level</span>
            <span className={styles.detailValue}>{yearLabel(item.yearLevel)}</span>
          </div>
          <div className={styles.detailCell}>
            <span className={styles.detailLabel}>Section</span>
            <span className={styles.detailValue}>
              {item.sectionName ? `Section ${item.sectionName}` : "—"}
            </span>
          </div>
          <div className={styles.detailCell}>
            <span className={styles.detailLabel}>Roles</span>
            <span className={styles.detailValue}>
              {item.roles.length ? item.roles.join(", ") : "Student"}
            </span>
          </div>
        </div>
        <div className={styles.note}>
          Suspending blocks the student from signing in and checking in until
          reinstated.
        </div>
      </div>
    </Drawer>
  );
}

export function StudentsModals({
  students,
  drawer,
  canManage,
  onCloseDrawer,
  onSuspend,
}: StudentsModalsProps) {
  const viewItem =
    drawer?.kind === "view" ? students.find((s) => s.id === drawer.id) : undefined;

  return (
    <>
      {drawer?.kind === "view" && viewItem && (
        <ViewDrawer
          item={viewItem}
          canManage={canManage}
          onSuspend={onSuspend}
          onClose={onCloseDrawer}
        />
      )}
    </>
  );
}