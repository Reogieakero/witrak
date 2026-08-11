import { Reveal } from "./reveal";
import styles from "./stat-strip.module.css";

const STATS = [
  { value: "7", label: "Linked modules, one source of truth" },
  { value: "23", label: "Permission keys for fine-grained access" },
  { value: "2", label: "Platforms — web for officers, mobile for check-in" },
  { value: "Real-time", label: "Attendance and fees update as data is entered" },
];

export function StatStrip() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 60}>
              <div className={styles.value}>{s.value}</div>
              <div className={styles.label}>{s.label}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
