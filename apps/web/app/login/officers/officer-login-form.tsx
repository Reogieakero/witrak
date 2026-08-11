"use client";

import { getSession, signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import styles from "./officers.module.css";

export function OfficerLoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      redirect: false,
    });

    if (result?.error) {
      setPending(false);
      setError(
        "We couldn't find an account with those details. Please check and try again.",
      );
      return;
    }

    const session = await getSession();
    if ((session?.access?.permissions?.length ?? 0) === 0) {
      setPending(false);
      setError(
        "This portal is for officers only. Use the student sign in instead.",
      );
      return;
    }

    setPending(false);
    window.location.href = callbackUrl;
  }

  return (
    <form onSubmit={onSubmit} className={styles.form} noValidate>
      <div className={styles.field}>
        <label htmlFor="officerEmail" className={styles.label}>
          Email or Username
        </label>
        <div className={styles.inputWrap}>
          <Mail size={16} className={styles.inputIcon} />
          <input
            id="officerEmail"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@fhusocom.edu"
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.field}>
        <div className={styles.labelRow}>
          <label htmlFor="officerPassword" className={styles.label}>
            Password
          </label>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className={styles.forgot}
          >
            Forgot password?
          </a>
        </div>
        <div className={styles.inputWrap}>
          <Lock size={16} className={styles.inputIcon} />
          <input
            id="officerPassword"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="Enter your password"
            className={`${styles.input} ${styles.inputPassword}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className={styles.toggleBtn}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className={styles.checkRow}>
        <label className={styles.checkLabel}>
          <input type="checkbox" name="remember" className={styles.checkbox} />
          <span className={styles.checkText}>Remember me</span>
        </label>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <Button type="submit" disabled={pending} className={styles.submit}>
        {pending ? (
          <>
            <span className={styles.spinner} />
            Signing in
          </>
        ) : (
          <>
            Sign In <ArrowRight size={16} />
          </>
        )}
      </Button>
    </form>
  );
}
