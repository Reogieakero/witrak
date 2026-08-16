import {
  CalendarCheck2,
  CalendarPlus,
  CalendarX,
  CheckCircle,
  FolderOpen,
  HandCoins,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Wallet,
} from "lucide-react";
import { money } from "@/lib/constants/dashboard";
import styles from "./student-stats.module.css";

type StudentStatsProps = {
  absences: number;
  balance: number;
  paidAmount: string;
  paidPct: number;
  totalEvents: number;
  upcomingEvents: number;
  liveEvents: number;
  completedEvents: number;
  attendedEvents: number;
  openSanctions: number;
  transparencyCount: number;
  pendingFeesText?: string;
};

export function StatCard({
  title,
  icon,
  cells,
}: {
  title: string;
  icon: React.ReactNode;
  cells: React.ReactNode[];
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span>{title}</span>
        <span className={styles.cardIcon}>{icon}</span>
      </div>
      <div className={styles.cellGrid}>{cells}</div>
    </div>
  );
}

export function MiniCell({
  label,
  icon,
  value,
  sub,
  tone = "brand",
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  sub: React.ReactNode;
  tone?: "brand" | "amber" | "green";
}) {
  const toneCls =
    tone === "amber" ? styles.cellAmber : tone === "green" ? styles.cellGreen : styles.cellBrand;
  return (
    <div className={`${styles.cell} ${toneCls}`}>
      <div className={styles.cellHeader}>
        <span>{label}</span>
        <span className={styles.cellIcon}>{icon}</span>
      </div>
      <div className={styles.cellValue}>{value}</div>
      <div className={styles.cellSub}>{sub}</div>
    </div>
  );
}

export function StudentStats(props: StudentStatsProps) {
  return (
    <>
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

      <StatCard
        title="Fees"
        icon={<HandCoins size={14} />}
        cells={[
          <MiniCell
            key="bal"
            label="Balance"
            icon={<Wallet size={14} />}
            value={money.format(props.balance)}
            sub={<span>{props.pendingFeesText ?? ""}</span>}
            tone="amber"
          />,
          <MiniCell
            key="paid"
            label="Paid"
            icon={<CheckCircle size={14} />}
            value={props.paidAmount}
            sub={<span className={styles.okText}>{props.paidPct}% of fees</span>}
            tone="green"
          />,
        ]}
      />

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
                <span className={styles.okText}>clean record</span>
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
    </>
  );
}