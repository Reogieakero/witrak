"use client";

import { useEffect, useState } from "react";
import { UserMenu } from "./user-menu";
import { StudentProfileModal } from "./student/student-profile-modal";
import { StudentMobileNav } from "./student/student-mobile-nav";
import { EventsModalProvider } from "./student/events-modal-context";
import { getStudentAvatar } from "@/app/dashboard/profile/actions";
import styles from "./student-shell.module.css";

type StudentShellProps = {
  userName: string;
  roleLabel: string;
  crumb: string;
  children: React.ReactNode;
};

export function StudentShell({ userName, roleLabel, crumb, children }: StudentShellProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    let active = true;
    getStudentAvatar().then((res) => {
      if (active) setAvatarUrl(res.imageUrl);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <EventsModalProvider>
      <div className={styles.shell}>
      <div className={styles.content}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.brand}>
              <span className={styles.brandLogo}>
                <img src="/logo-favicon.png" alt="Liberalis" />
              </span>
              <span className={styles.crumbRoot}>Liberalis Student</span>
            </span>
            <span className={styles.crumbSep}>/</span>
            <span className={styles.crumbCurrent}>{crumb}</span>
          </div>

          <div className={styles.headerRight}>
            <UserMenu
              userName={userName}
              roleLabel={roleLabel}
              logoutHref="/login/students"
              avatarUrl={avatarUrl}
              onProfile={() => setProfileOpen(true)}
            />
          </div>
        </header>

        <main className={styles.main}>{children}</main>
      </div>

      <StudentProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onAvatarChange={setAvatarUrl}
      />

      <StudentMobileNav />
    </div>
    </EventsModalProvider>
  );
}