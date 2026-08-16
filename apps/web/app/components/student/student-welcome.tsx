import { CalendarPlus, Upload } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import styles from "./student-welcome.module.css";

type WelcomeBannerProps = {
  firstName: string;
  sectionLabel: string;
  termName: string;
};

export function WelcomeBanner({ firstName, sectionLabel, termName }: WelcomeBannerProps) {
  return (
    <section className={styles.banner}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>Welcome back</p>
        <h1 className={styles.title}>{firstName}</h1>
        <p className={styles.subtitle}>
          {sectionLabel} · {termName} · Everything you need is on this page.
        </p>
      </div>
      <div className={styles.actions}>
        <Button href="/dashboard/fees" variant="outline" size="md" className={styles.bannerBtn}>
          <Upload size={16} />
          Upload Fee Proof
        </Button>
        <Button href="/dashboard#events" size="md" className={styles.bannerBtn}>
          <CalendarPlus size={16} />
          View Events
        </Button>
      </div>
    </section>
  );
}