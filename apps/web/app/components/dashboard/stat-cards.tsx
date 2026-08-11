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
import { Tooltip } from "@/app/components/ui/tooltip";
import styles from "./stat-cards.module.css";

export type StatCardsData = {
  totalStudents: number;
  totalUsers: number;
  programCount: number;
  completedProfileCount: number;
  profileRate: number;
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
  hint: React.ReactNode;
};

function MiniStat({ label, icon, value, sub, tone = "brand", hint }: MiniStatProps) {
  const toneCls =
    tone === "amber" ? styles.miniAmber : tone === "red" ? styles.miniRed : styles.miniBrand;
  return (
    <Tooltip content={hint}>
      <div className={`${styles.miniStat} ${toneCls}`}>
        <div className={styles.miniHeader}>
          <span>{label}</span>
          <span className={styles.miniIcon}>{icon}</span>
        </div>
        <div className={styles.miniValue}>{value}</div>
        <div className={styles.miniSub}>{sub}</div>
      </div>
    </Tooltip>
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

function Hint({ title, body, source }: { title: string; body: string; source: string }) {
  return (
    <>
      <span className={styles.hintTitle}>{title}</span>
      <span>{body}</span>
      <span className={styles.hintSource}>{source}</span>
    </>
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
          hint={
            <Hint
              title="Total Students"
              body="All registered students across every program."
              source="Source: Student table"
            />
          }
        />
        <MiniStat
          label="Profiled"
          icon={<UserCheck size={14} />}
          value={data.completedProfileCount.toLocaleString()}
          sub={`${data.profileRate}% complete`}
          hint={
            <Hint
              title="Completed Profiles"
              body={`User accounts that finished profiling (linked student with a section assigned), out of ${data.totalUsers} total accounts.`}
              source="Source: User · Student · Section tables"
            />
          }
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
          hint={
            <Hint
              title="Total Events"
              body="All scheduled events, with the count of upcoming ones still ahead."
              source="Source: Event table"
            />
          }
        />
        <MiniStat
          label="Present"
          icon={<UserCheck size={14} />}
          value={`${data.presentRate}%`}
          sub="avg rate"
          hint={
            <Hint
              title="Average Attendance Rate"
              body="Share of QR-scanned logs marked present or late across all events."
              source="Source: Attendance table"
            />
          }
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
          hint={
            <Hint
              title="Fees Collected"
              body="Total amount from verified fee payments, compared against the overall fee target."
              source="Source: Fee · FeeProof tables"
            />
          }
        />
        <MiniStat
          label="Proofs"
          icon={<FileClock size={14} />}
          value={data.pendingFeeProofCount.toLocaleString()}
          sub="needs review"
          hint={
            <Hint
              title="Proofs Pending Review"
              body="Fee proof submissions that still need to be verified by the treasurer."
              source="Source: FeeProof table (status = PENDING)"
            />
          }
        />
      </StatCard>

      <StatCard title="Pending Review" icon={<AlertCircle size={14} />}>
        <MiniStat
          label="Role Req."
          icon={<Clock size={14} />}
          value={data.pendingRoleRequestCount.toLocaleString()}
          sub="needs approval"
          tone="amber"
          hint={
            <Hint
              title="Pending Role Requests"
              body="Role requests from students that are still waiting for approval."
              source="Source: RoleRequest table (status = PENDING)"
            />
          }
        />
        <MiniStat
          label="Flags"
          icon={<AlertTriangle size={14} />}
          value={data.pendingFlagCount.toLocaleString()}
          sub="follow-up"
          tone="red"
          hint={
            <Hint
              title="Open Sanction Flags"
              body="Sanction flags triggered by absence rules that still need follow-up."
              source="Source: SanctionFlag table (status = PENDING)"
            />
          }
        />
      </StatCard>
    </>
  );
}
