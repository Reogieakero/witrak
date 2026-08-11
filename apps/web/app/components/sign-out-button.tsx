"use client";

import { signOut } from "next-auth/react";
import styles from "./sign-out-button.module.css";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ redirectTo: "/login" })}
      className={styles.button}
    >
      Sign out
    </button>
  );
}
