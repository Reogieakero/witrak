import { CheckCircle2, Clock, PieChart, Users } from "lucide-react";
import styles from "./hero-mockup.module.css";

const TILES = [
  { icon: Users, value: "1,248", label: "Members" },
  { icon: Clock, value: "32", label: "Pending fees" },
  { icon: PieChart, value: "5", label: "Upcoming events" },
];

const ROWS = [
  {
    tag: "attendance",
    title: "Founding Day · Grade 3-A",
    meta: "38 / 40 present",
  },
  {
    tag: "fees",
    title: "Semester dues · proof review",
    meta: "12 awaiting verification",
  },
  {
    tag: "transparency",
    title: "Q1 financial report",
    meta: "Published to all members",
  },
];

export function HeroMockup() {
  return (
    <div className={styles.wrap}>
      <div className={styles.frame}>
        <div className={styles.chrome}>
          <span className={styles.dotRed} />
          <span className={styles.dotAmber} />
          <span className={styles.dotGreen} />
          <div className={styles.url}>liberalis.app/dashboard</div>
        </div>

        <div className={styles.body}>
          <div className={styles.greeting}>
            <div>
              <div className={styles.greetingTitle}>Good day, Supreme</div>
              <div className={styles.greetingSub}>
                Wednesday, August 12 · SY 2026
              </div>
            </div>
            <div className={styles.avatar}>F</div>
          </div>

          <div className={styles.tiles}>
            {TILES.map((t) => (
              <div key={t.label} className={styles.tile}>
                <t.icon size={14} className={styles.tileIcon} />
                <div className={styles.tileValue}>{t.value}</div>
                <div className={styles.tileLabel}>{t.label}</div>
              </div>
            ))}
          </div>

          <div className={styles.list}>
            {ROWS.map((r) => (
              <div key={r.title} className={styles.row}>
                <span className={`${styles.dot} ${styles[r.tag]}`} />
                <div className={styles.rowText}>
                  <div className={styles.rowTitle}>{r.title}</div>
                  <div className={styles.rowMeta}>{r.meta}</div>
                </div>
                <CheckCircle2 size={15} className={styles.check} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
