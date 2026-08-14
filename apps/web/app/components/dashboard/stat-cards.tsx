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
import {
  StudentTotalCard,
  type EnrollmentTarget,
} from "@/app/components/dashboard/student-total-card";
import styles from "./stat-cards.module.css";

export type StatCardsData = {
  totalStudents: number;
  accountCount: number;
  accountRate: number;
  programCount: number;
  eventCount: number;
  upcomingCount: number;
  presentRate: number;
  collected: number;
  collectedRate: number;
  pendingFeeProofCount: number;
  pendingRoleRequestCount: number;
  activeSanctionCount: number;
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

export function StatCards({
  data,
  enrollmentTargets,
  canEditEnrollment,
}: {
  data: StatCardsData;
  enrollmentTargets?: EnrollmentTarget[];
  canEditEnrollment?: boolean;
}) {
  return (
    <>
      <StatCard title="Student Body" icon={<Users size={14} />}>
        <StudentTotalCard
          total={data.totalStudents}
          programCount={data.programCount}
          programs={enrollmentTargets ?? []}
          canEdit={canEditEnrollment ?? false}
        />
        <MiniStat
          label="With Accounts"
          icon={<UserCheck size={14} />}
          value={data.accountCount.toLocaleString()}
          sub={`${data.accountRate}% registered`}
          hint={
            <Hint
              title="Students With Accounts"
              body={`${data.accountCount.toLocaleString()} students have registered an account in the system, out of ${data.totalStudents.toLocaleString()} total students from official records.`}
              source="Accounts / official total"
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
              body="Share of students present or late versus the expected roster for each event — the faculty-wide total, or the targeted program when the event is program-specific."
              source="Source: Attendance table vs. event targets"
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
              body="Total amount from approved fee payments, compared against the overall fee target."
              source="Verified payments only"
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
              body="Fee payment proofs that still need to be approved by the treasurer."
              source="Waiting on you"
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
          label="Sanctions"
          icon={<AlertTriangle size={14} />}
          value={data.activeSanctionCount.toLocaleString()}
          sub="open"
          tone="red"
          hint={
            <Hint
              title="Open Sanctions"
              body="Sanctions that are still active and awaiting resolution."
              source="Source: Sanction table (status = OPEN)"
            />
          }
        />
      </StatCard>
    </>
  );
}
