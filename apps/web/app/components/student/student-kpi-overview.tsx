"use client";

import { useState } from "react";
import {
  CalendarCheck2,
  CalendarPlus,
  CalendarX,
  CheckCircle,
  FolderOpen,
  HandCoins,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Wallet,
} from "lucide-react";
import { StatCard, MiniCell } from "./student-stats";
import { Button } from "@/app/components/ui/button";
import { Modal } from "@/app/components/ui/modal";
import statsStyles from "./student-stats.module.css";
import styles from "./student-kpi-overview.module.css";

type KpiKind = "attendance" | "fees" | "events" | "records";

type StudentKpiOverviewProps = {
  totalEvents: number;
  completedEvents: number;
  absences: number;
  balance: string;
  paidAmount: string;
  paidPct: number;
  pendingFeesText?: string;
  upcomingEvents: number;
  liveEvents: number;
  attendedEvents: number;
  openSanctions: number;
  transparencyCount: number;
};

export function StudentKpiOverview(props: StudentKpiOverviewProps) {
  const [active, setActive] = useState<KpiKind | null>(null);

  const tiles: { kind: KpiKind; label: string; value: string; sub: string; icon: React.ReactNode }[] = [
    {
      kind: "attendance",
      label: "Attendance",
      value: `${props.attendedEvents} attended`,
      sub: `${props.absences} absences`,
      icon: <UserCheck size={16} />,
    },
    {
      kind: "fees",
      label: "Fees",
      value: props.balance,
      sub: `${props.pendingFeesText ?? "no pending"}`,
      icon: <HandCoins size={16} />,
    },
    {
      kind: "events",
      label: "Events",
      value: `${props.upcomingEvents} upcoming`,
      sub: `${props.liveEvents} live now`,
      icon: <CalendarCheck2 size={16} />,
    },
    {
      kind: "records",
      label: "Records",
      value: `${props.openSanctions} sanctions`,
      sub: `${props.transparencyCount} files`,
      icon: <ShieldCheck size={16} />,
    },
  ];

  const close = () => setActive(null);

  return (
    <section className={styles.wrap}>
      <div className={styles.outer}>
        <div className={styles.outerHeader}>
          <span className={styles.outerTitle}>My Overview</span>
          <span className={styles.outerHint}>Tap to view details</span>
        </div>
        <div className={styles.grid}>
          {tiles.map((t) => (
            <button
              key={t.kind}
              type="button"
              className={styles.tile}
              onClick={() => setActive(t.kind)}
            >
              <span className={styles.tileIcon}>{t.icon}</span>
              <span className={styles.tileValue}>{t.value}</span>
              <span className={styles.tileLabel}>{t.label}</span>
              <span className={styles.tileSub}>{t.sub}</span>
            </button>
          ))}
        </div>
      </div>

      <Modal
        open={active === "attendance"}
        onClose={close}
        title={<span className={styles.modalTitle}>My Attendance</span>}
        footer={
          <div className={styles.modalFooter}>
            <Button type="button" variant="secondary" size="sm" onClick={close}>
              Close
            </Button>
          </div>
        }
      >
        <StatCard
          title="My Attendance"
          icon={<UserCheck size={14} />}
          cells={[
            <MiniCell
              key="total"
              label="Total Events"
              icon={<CalendarCheck2 size={14} />}
              value={String(props.totalEvents)}
              sub={<span>{props.completedEvents} complete</span>}
            />,
            <MiniCell
              key="abs"
              label="Absences"
              icon={<CalendarX size={14} />}
              value={String(props.absences)}
              sub={<span>this term</span>}
              tone="amber"
            />,
          ]}
        />
      </Modal>

      <Modal
        open={active === "fees"}
        onClose={close}
        title={<span className={styles.modalTitle}>Fees</span>}
        footer={
          <div className={styles.modalFooter}>
            <Button type="button" variant="secondary" size="sm" onClick={close}>
              Close
            </Button>
          </div>
        }
      >
        <StatCard
          title="Fees"
          icon={<HandCoins size={14} />}
          cells={[
            <MiniCell
              key="bal"
              label="Balance"
              icon={<Wallet size={14} />}
              value={props.balance}
              sub={<span>{props.pendingFeesText ?? ""}</span>}
              tone="amber"
            />,
            <MiniCell
              key="paid"
              label="Paid"
              icon={<CheckCircle size={14} />}
              value={props.paidAmount}
              sub={<span>{props.paidPct}% of fees</span>}
              tone="green"
            />,
          ]}
        />
      </Modal>

      <Modal
        open={active === "events"}
        onClose={close}
        title={<span className={styles.modalTitle}>Events</span>}
        footer={
          <div className={styles.modalFooter}>
            <Button type="button" variant="secondary" size="sm" onClick={close}>
              Close
            </Button>
          </div>
        }
      >
        <StatCard
          title="Events"
          icon={<CalendarCheck2 size={14} />}
          cells={[
            <MiniCell
              key="up"
              label="Upcoming"
              icon={<CalendarPlus size={14} />}
              value={String(props.upcomingEvents)}
              sub={<span>{props.liveEvents} live now</span>}
            />,
            <MiniCell
              key="att"
              label="Attended"
              icon={<ShieldCheck size={14} />}
              value={String(props.attendedEvents)}
              sub={<span>this term</span>}
            />,
          ]}
        />
      </Modal>

      <Modal
        open={active === "records"}
        onClose={close}
        title={<span className={styles.modalTitle}>My Records</span>}
        footer={
          <div className={styles.modalFooter}>
            <Button type="button" variant="secondary" size="sm" onClick={close}>
              Close
            </Button>
          </div>
        }
      >
        <StatCard
          title="My Records"
          icon={<ShieldCheck size={14} />}
          cells={[
            <MiniCell
              key="san"
              label="Sanctions"
              icon={<ShieldAlert size={14} />}
              value={String(props.openSanctions)}
              sub={
                props.openSanctions === 0 ? (
                  <span className={statsStyles.okText}>clean record</span>
                ) : (
                  <span>on record</span>
                )
              }
              tone={props.openSanctions === 0 ? "green" : "amber"}
            />,
            <MiniCell
              key="tr"
              label="Transparency"
              icon={<FolderOpen size={14} />}
              value={String(props.transparencyCount)}
              sub={<span>files available</span>}
            />,
          ]}
        />
      </Modal>
    </section>
  );
}