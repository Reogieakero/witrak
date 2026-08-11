import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  CalendarCheck2,
  CalendarPlus,
  Clock,
  FileClock,
  HandCoins,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { money } from "@/lib/constants/dashboard";
import styles from "./stat-cards.module.css";

export type StatCardsData = {
  totalStudents: number;
  programCount: number;
  studentsWithSection: number;
  placementRate: number;
  eventCount: number;
  upcomingCount: number;
  presentRate: number;
  collected: number;
  collectedRate: number;
  pendingFeeProofCount: number;
  pendingRoleRequestCount: number;
  pendingFlagCount: number;
};

type MiniStatProps = {
  label: string;
  icon: React.ReactNode;
  value: string;
  sub: React.ReactNode;
  tone?: "brand" | "amber" | "red";
};

function MiniStat({ label, icon, value, sub, tone = "brand" }: MiniStatProps) {
  const toneCls =
    tone === "amber" ? styles.miniAmber : tone === "red" ? styles.miniRed : styles.miniBrand;
  return (
    <div className={`${styles.miniStat} ${toneCls}`}>
      <div className={styles.miniHeader}>
        <span>{label}</span>
        <span className={styles.miniIcon}>{icon}</span>
      </div>
      <div className={styles.miniValue}>{value}</div>
      <div className={styles.miniSub}>{sub}</div>
    </div>
  );
}

type StatCardProps = {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
};

function StatCard({ title, icon, children }: StatCardProps) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statHeader}>
        <span>{title}</span>
        <span className={styles.statHeaderIcon}>{icon}</span>
      </div>
      <div className={styles.miniGrid}>{children}</div>
    </div>
  );
}

export function StatCards({ data }: { data: StatCardsData }) {
  return (
    <>
      <StatCard title="Student Body" icon={<Users size={14} />}>
        <MiniStat
          label="Total"
          icon={<Users size={14} />}
          value={data.totalStudents.toLocaleString()}
          sub={
            <span className={styles.trendText}>
              <TrendingUp size={11} />
              {data.programCount} programs
            </span>
          }
        />
        <MiniStat
          label="Assigned"
          icon={<UserCheck size={14} />}
          value={data.studentsWithSection.toLocaleString()}
          sub={`${data.placementRate}% rate`}
        />
      </StatCard>

      <StatCard title="Events & Attendance" icon={<CalendarCheck2 size={14} />}>
        <MiniStat
          label="Events"
          icon={<CalendarPlus size={14} />}
          value={data.eventCount.toLocaleString()}
          sub={
            <span className={styles.trendText}>
              <TrendingUp size={11} />
              {data.upcomingCount} upcoming
            </span>
          }
        />
        <MiniStat
          label="Present"
          icon={<UserCheck size={14} />}
          value={`${data.presentRate}%`}
          sub="avg rate"
        />
      </StatCard>

      <StatCard title="Fees" icon={<HandCoins size={14} />}>
        <MiniStat
          label="Collected"
          icon={<Banknote size={14} />}
          value={money.format(data.collected)}
          sub={
            <span className={styles.trendText}>
              <TrendingUp size={11} />
              {data.collectedRate}% target
            </span>
          }
        />
        <MiniStat
          label="Proofs"
          icon={<FileClock size={14} />}
          value={data.pendingFeeProofCount.toLocaleString()}
          sub="needs review"
        />
      </StatCard>

      <StatCard title="Pending Review" icon={<AlertCircle size={14} />}>
        <MiniStat
          label="Role Req."
          icon={<Clock size={14} />}
          value={data.pendingRoleRequestCount.toLocaleString()}
          sub="needs approval"
          tone="amber"
        />
        <MiniStat
          label="Flags"
          icon={<AlertTriangle size={14} />}
          value={data.pendingFlagCount.toLocaleString()}
          sub="follow-up"
          tone="red"
        />
      </StatCard>
    </>
  );
}
