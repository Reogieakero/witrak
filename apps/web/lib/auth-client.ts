"use client";

import { supabaseBrowser } from "@/lib/supabase/client";

export type SignInResult = {
  ok: boolean;
  error?: string;
};

/** Email + password sign-in via Supabase Auth. Sets the session cookie. */
export async function signInWithPassword(
  email: string,
  password: string,
): Promise<SignInResult> {
  const { error } = await supabaseBrowser.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** OAuth sign-in (e.g. Google) via Supabase Auth. Redirects the browser. */
export async function signInWithOAuth(
  provider: "google" | "github" = "google",
  redirectTo?: string,
): Promise<SignInResult> {
  const { error } = await supabaseBrowser.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** Sign out the current Supabase session and clear the cookie. */
export async function signOut(): Promise<void> {
  await supabaseBrowser.auth.signOut();
}
