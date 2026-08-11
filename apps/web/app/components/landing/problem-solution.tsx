import { CheckCircle2, Clock, FolderX, Users } from "lucide-react";
import shared from "./landing.module.css";
import styles from "./problem-solution.module.css";

const ITEMS = [
  {
    icon: FolderX,
    title: "Scattered records",
    text: "Event sign-ups, attendance sheets, and fee proofs live across group chats and shared folders.",
  },
  {
    icon: Clock,
    title: "Missed flags",
    text: "At-risk students are noticed only after absences pile up and deadlines slip by.",
  },
  {
    icon: Users,
    title: "No visibility",
    text: "Members stay in the dark until a report is posted late on a bulletin board.",
  },
  {
    icon: CheckCircle2,
    title: "FHUSOCOM keeps it together",
    text: "Every record digital, current, and visible to exactly the right role — in one place.",
  },
];

export function ProblemSolution() {
  return (
    <section className={styles.section}>
      <div className={shared.container}>
        <div className={shared.sectionHead}>
          <span className={shared.sectionTag}>The Problem</span>
          <h2 className={shared.sectionTitle}>
            Your org already works hard. Tracking shouldn&apos;t be the bottleneck.
          </h2>
        </div>
        <div className={styles.grid}>
          {ITEMS.map((it) => (
            <div key={it.title} className={styles.card}>
              <div className={styles.icon}>
                <it.icon size={18} />
              </div>
              <h3 className={styles.title}>{it.title}</h3>
              <p className={styles.text}>{it.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
