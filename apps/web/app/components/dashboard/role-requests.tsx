import { UserPlus } from "lucide-react";
import { scopeLabel, shortName } from "@/lib/dashboard-utils";
import type { ScopedSection, ScopedYearLevel } from "@/lib/dashboard-utils";
import styles from "./role-requests.module.css";

export type RoleRequest = {
  id: string;
  requestedScopeType: string;
  requestedSectionId: string | null;
  requestedProgramYearId: string | null;
  user: { name: string };
  requestedRole: { name: string };
};

type RoleRequestsProps = {
  count: number;
  requests: RoleRequest[];
  sectionById: Map<string, ScopedSection>;
  yearById: Map<string, ScopedYearLevel>;
};

export function RoleRequests({ count, requests, sectionById, yearById }: RoleRequestsProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h3 className={styles.panelTitle}>Role Requests</h3>
        <span className={styles.badgeAmber}>{count} Pending</span>
      </div>

      <div className={styles.panelBody}>
        {requests.length === 0 ? (
          <p className={styles.emptyText}>No pending requests.</p>
        ) : (
          requests.map((rr) => (
            <div key={rr.id} className={styles.reqRow}>
              <span className={styles.reqIcon}>
                <UserPlus size={14} />
              </span>
              <span className={styles.rowMeta}>
                <span className={styles.rowTitle}>
                  {shortName(rr.user.name.split(" ")[0], rr.user.name.split(" ").slice(1).join(" "))}
                </span>
                <span className={styles.rowSub}>
                  {scopeLabel(rr, sectionById, yearById)} · {rr.requestedRole.name}
                </span>
              </span>
              <span className={styles.reqTag}>Pending</span>
            </div>
          ))
        )}
      </div>

      <div className={styles.panelFooter}>
        <span>Awaiting scope assignment</span>
        <span className={styles.panelLink}>Review all</span>
      </div>
    </div>
  );
}
