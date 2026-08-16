import { ArrowRight } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import shared from "./landing.module.css";
import styles from "./cta.module.css";

export function Cta() {
  return (
    <section className={`${styles.section} ${shared.dotGrid}`}>
      <div className={shared.container}>
        <div className={styles.banner}>
          <h2 className={styles.title}>
            Ready to run your student government?
          </h2>
          <p className={styles.text}>
            Get started now, or sign in if your organization is already on
            FHUSOCOM.
          </p>
          <div className={styles.actions}>
            <Button href="/login/students" variant="white">
              Get started <ArrowRight size={16} />
            </Button>
            <Button href="/login/students" variant="outline">
              Sign in
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
