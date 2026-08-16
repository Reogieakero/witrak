import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import shared from "./landing.module.css";
import styles from "./hero.module.css";
import { HeroMockup } from "./hero-mockup";

const STATS = [
  { value: "6", label: "Roles, one login each" },
  { value: "23", label: "Permission keys" },
  { value: "7", label: "Linked modules" },
];

export function Hero() {
  return (
    <section className={`${styles.hero} ${shared.dotGrid}`}>
      <div className={shared.container}>
        <div className={styles.grid}>
          <div>
            <span className={styles.badge}>
              <ShieldCheck size={14} />
              Built for student councils &amp; orgs
            </span>
            <h1 className={styles.title}>
              Run your student government,{" "}
              <span className={styles.accent}>one system,</span> not a
              spreadsheet.
            </h1>
            <p className={styles.subtitle}>
              Liberalis brings events, attendance, fees, sanctions, and
              transparency into one secure portal — so every officer and member
              always sees the current story of the organization.
            </p>

            <div className={styles.ctaRow}>
              <Button href="/login/students">
                Get started <ArrowRight size={16} />
              </Button>
              <Button href="#workflow" variant="secondary">
                See how it works
              </Button>
            </div>

            <div className={styles.statsRow}>
              {STATS.map((s) => (
                <div key={s.label} className={styles.stat}>
                  <span className={styles.statValue}>{s.value}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <HeroMockup />
        </div>
      </div>
    </section>
  );
}
