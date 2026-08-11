import {
  CalendarDays,
  CheckCircle2,
  QrCode,
  ShieldAlert,
  Timer,
} from "lucide-react";
import shared from "./landing.module.css";
import styles from "./workflow.module.css";

const STEPS = [
  {
    icon: CalendarDays,
    title: "Publish event",
    text: "The Secretary creates the event and turns attendance tracking on.",
  },
  {
    icon: QrCode,
    title: "Scan check-in",
    text: "Officers scan member QR codes as students arrive.",
  },
  {
    icon: Timer,
    title: "Track absences",
    text: "Absences roll up per student and per period, automatically.",
  },
  {
    icon: ShieldAlert,
    title: "Flag for review",
    text: "Crossing a threshold raises a private flag for the Discipline Officer.",
  },
  {
    icon: CheckCircle2,
    title: "Resolve & log",
    text: "The officer resolves the flag and every step lands in the audit log.",
  },
];

export function Workflow() {
  return (
    <section id="workflow" className={styles.section}>
      <div className={shared.container}>
        <div className={shared.sectionHead}>
          <span className={shared.sectionTag}>How it works</span>
          <h2 className={shared.sectionTitle}>
            From event to resolution, one clear flow
          </h2>
          <p className={shared.sectionText}>
            The journey of every attendance record — no silos, no paper
            hand-offs, no lost data.
          </p>
        </div>
        <div className={styles.grid}>
          {STEPS.map((s, i) => (
            <div key={s.title} className={styles.step}>
              <div className={styles.iconWrap}>
                <div className={styles.icon}>
                  <s.icon size={18} />
                </div>
                <span className={styles.number}>{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className={styles.title}>{s.title}</h3>
              <p className={styles.text}>{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
