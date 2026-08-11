import Link from "next/link";
import { Suspense } from "react";
import { GraduationCap } from "lucide-react";
import { LoginForm } from "@/app/components/login-form";
import styles from "./login-card.module.css";

export default function LoginPage() {
  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <div className={styles.brandRow}>
          <span className={styles.logo}>
            <GraduationCap size={20} />
          </span>
          <span className={styles.brandName}>FHUSOCOM</span>
        </div>

        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.subtitle}>
          Welcome back — sign in to your account.
        </p>

        <Suspense fallback={null}>
          <LoginForm submitLabel="Sign in" />
        </Suspense>

        <div className={styles.switch}>
          <Link href="/login/officers" className={styles.switchLink}>
            Officer sign in
          </Link>
          <span className={styles.divider}>·</span>
          <Link href="/" className={styles.switchLink}>
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
