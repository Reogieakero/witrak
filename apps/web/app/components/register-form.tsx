"use client";

import { useState, useTransition } from "react";
import { sileo } from "sileo";
import { Button } from "@/app/components/ui/button";
import { registerStudent } from "@/app/register/actions";
import styles from "./register-form.module.css";

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await registerStudent(form);
      if (!result?.ok && result?.error) {
        setError(result.error);
        sileo.error({ title: "Registration failed", description: result.error });
      }
    });
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
          placeholder="you@liberalis.edu"
          className={styles.input}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Password</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="At least 8 characters"
          className={styles.input}
        />
      </label>

      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>First name</span>
          <input
            name="firstName"
            type="text"
            autoComplete="given-name"
            required
            placeholder="Juan"
            className={styles.input}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Last name</span>
          <input
            name="lastName"
            type="text"
            autoComplete="family-name"
            required
            placeholder="Dela Cruz"
            className={styles.input}
          />
        </label>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>Student number</span>
        <input
          name="studentNo"
          type="text"
          required
          placeholder="e.g. 2025-0001"
          className={styles.input}
        />
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <Button type="submit" disabled={pending} className={styles.submit}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}