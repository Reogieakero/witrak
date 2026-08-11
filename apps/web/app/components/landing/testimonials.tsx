import { Star } from "lucide-react";
import shared from "./landing.module.css";
import styles from "./testimonials.module.css";

const ITEMS = [
  {
    quote:
      "Attendance used to take the first ten minutes of every event. Now it's a scan, and I can see the whole section's rate the same day.",
    name: "M. Salazar",
    role: "Secretary",
  },
  {
    quote:
      "I stopped chasing screenshots in the group chat. Members submit proof in the portal and I verify it in one place.",
    name: "J. Reyes",
    role: "Treasurer",
  },
  {
    quote:
      "Flags used to surface at the end of the term. Now the Discipline Officer sees them as soon as a threshold is crossed.",
    name: "A. Garcia",
    role: "Discipline Officer",
  },
];

export function Testimonials() {
  return (
    <section className={styles.section}>
      <div className={shared.container}>
        <div className={shared.sectionHead}>
          <span className={shared.sectionTag}>Testimonials</span>
          <h2 className={shared.sectionTitle}>Loved by the people who run the org</h2>
        </div>
        <div className={styles.grid}>
          {ITEMS.map((t) => (
            <div key={t.name} className={styles.card}>
              <div className={styles.stars}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className={styles.star} />
                ))}
              </div>
              <p className={styles.quote}>“{t.quote}”</p>
              <div className={styles.footer}>
                <span className={styles.avatar}>
                  {t.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
                <div>
                  <div className={styles.name}>{t.name}</div>
                  <div className={styles.role}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
