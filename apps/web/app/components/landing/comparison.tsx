import shared from "./landing.module.css";
import styles from "./comparison.module.css";

const ROWS = [
  {
    label: "Attendance",
    before: "Paper sign-up sheets passed around the room",
    after: "QR check-in, with the rate visible the same day",
  },
  {
    label: "Fee tracking",
    before: "Screenshots scattered across group chats",
    after: "Proof submitted and verified in one flow",
  },
  {
    label: "Transparency",
    before: "Reports posted late and hard to find",
    after: "Published files every member can review",
  },
  {
    label: "Sanctions",
    before: "Private records in a binder, easy to lose",
    after: "Scoped digital records with a full audit trail",
  },
  {
    label: "Announcements",
    before: "Updates drowned out by message floods",
    after: "One clean broadcast channel for the whole org",
  },
];

export function Comparison() {
  return (
    <section className={styles.section}>
      <div className={shared.container}>
        <div className={shared.sectionHead}>
          <span className={shared.sectionTag}>Before &amp; After</span>
          <h2 className={shared.sectionTitle}>
            The same work, without the paper trail
          </h2>
        </div>
        <div className={styles.table}>
          <div className={styles.headerRow}>
            <div className={styles.headerCell}>Task</div>
            <div className={styles.headerCell}>Before Liberalis</div>
            <div className={`${styles.headerCell} ${styles.headerAfter}`}>
              With Liberalis
            </div>
          </div>
          {ROWS.map((r) => (
            <div key={r.label} className={styles.row}>
              <div className={`${styles.cell} ${styles.label}`}>{r.label}</div>
              <div className={styles.cell}>{r.before}</div>
              <div className={`${styles.cell} ${styles.after}`}>{r.after}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
