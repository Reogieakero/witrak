import { KeyRound, ListChecks, UsersRound, Zap } from "lucide-react";
import { Reveal } from "./reveal";
import shared from "./landing.module.css";
import styles from "./getting-started.module.css";

const STEPS = [
  {
    icon: KeyRound,
    title: "Provision accounts",
    text: "Roles seeded for every officer position — one login per person.",
  },
  {
    icon: ListChecks,
    title: "Set up your org",
    text: "Configure sections, programs, and year levels to mirror your council.",
  },
  {
    icon: UsersRound,
    title: "Import members",
    text: "Link student records to accounts so everything is ready to go.",
  },
  {
    icon: Zap,
    title: "Go live",
    text: "Run the current semester — not a blank slate — from day one.",
  },
];

export function GettingStarted() {
  return (
    <section className={styles.section}>
      <div className={shared.container}>
        <div className={shared.sectionHead}>
          <span className={shared.sectionTag}>Getting started</span>
          <h2 className={shared.sectionTitle}>Live in four steps</h2>
          <p className={shared.sectionText}>
            From provisioning to go-live in a single afternoon, with no
            disruption to the current term.
          </p>
        </div>
        <div className={styles.grid}>
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 60}>
              <div className={styles.card}>
                <div className={styles.icon}>
                  <s.icon size={18} />
                </div>
                <h3 className={styles.title}>{s.title}</h3>
                <p className={styles.text}>{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
