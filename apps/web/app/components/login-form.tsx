"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { sileo } from "sileo";
import { Button } from "@/app/components/ui/button";
import { signInWithPassword } from "@/lib/auth-client";
import styles from "./login-form.module.css";

export type LoginFormProps = {
  defaultRedirect?: string;
  submitLabel?: string;
};

export function LoginForm({
  defaultRedirect = "/",
  submitLabel = "Sign in",
}: LoginFormProps) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? defaultRedirect;
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    const result = await signInWithPassword(email, password);

    setPending(false);
    if (!result.ok) {
      setError("Invalid email or password.");
      sileo.error({
        title: "Sign in failed",
        description: "Invalid email or password.",
      });
    } else {
      window.location.href = callbackUrl;
    }
  }

  return (
    <form onSubmit={onSubmit} className={styles.form} noValidate>
      <label className={styles.field}>
        <span className={styles.label}>Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@fhusocom.edu"
          className={styles.input}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className={styles.input}
        />
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <Button type="submit" disabled={pending} className={styles.submit}>
        {pending ? "Signing in…" : submitLabel}
      </Button>
    </form>
  );
}
