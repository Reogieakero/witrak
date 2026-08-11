import { auth } from "@/auth";
import { SignOutButton } from "@/app/components/sign-out-button";
import styles from "./page.module.css";

export default async function Home() {
  const session = await auth();

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>FHUSOCOM Dashboard</h1>

      {session?.access ? (
        <div className={styles.card}>
          <p>
            Signed in as <span className={styles.email}>{session.user?.email}</span>
          </p>
          <div>
            <p className={styles.sectionLabel}>Permissions</p>
            <div className={styles.pills}>
              {session.access.permissions.map((p) => (
                <span key={p} className={styles.pill}>
                  {p}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className={styles.sectionLabel}>Scope</p>
            <p className={styles.muted}>
              {session.access.scopeSectionIds === null
                ? "Faculty-wide (all sections)"
                : `Sections: ${session.access.scopeSectionIds.length} ${
                    session.access.scopeSectionIds.length === 0 ? "(no scoped access)" : ""
                  }`}
            </p>
          </div>
          <SignOutButton />
        </div>
      ) : (
        <p className={styles.notSignedIn}>Not signed in.</p>
      )}
    </main>
  );
}
