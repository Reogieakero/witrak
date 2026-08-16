import Link from "next/link";
import { RegisterForm } from "@/app/components/register-form";
import styles from "./register.module.css";

export default function RegisterPage() {
  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <div className={styles.brandRow}>
          <span className={styles.logo}>
            <img src="/logo-favicon.png" alt="Liberalis" />
          </span>
          <span className={styles.brandName}>Liberalis</span>
        </div>

        <h1 className={styles.title}>Create your student account</h1>
        <p className={styles.subtitle}>
          Sign up with your email, then link your student profile. You&apos;ll
          be signed in once your account is created.
        </p>

        <RegisterForm />

        <div className={styles.switch}>
          <span className={styles.switchText}>Already have an account?</span>
          <Link href="/login/students" className={styles.switchLink}>
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}