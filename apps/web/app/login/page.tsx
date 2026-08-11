"use client";

import { signIn } from "next-auth/react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import styles from "./login.module.css";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      redirectTo: callbackUrl,
      redirect: false,
    });

    setPending(false);
    if (result?.error) {
      setError("Invalid email or password.");
    } else if (result?.ok) {
      window.location.href = callbackUrl;
    }
  }

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <label className={styles.field}>
        Email
        <input name="email" type="email" required className={styles.input} />
      </label>
      <label className={styles.field}>
        Password
        <input name="password" type="password" required className={styles.input} />
      </label>
      {error && <p className={styles.error}>{error}</p>}
      <button type="submit" disabled={pending} className={styles.submit}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>FHUSOCOM</h1>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
