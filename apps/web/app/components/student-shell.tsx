"use client";

import { useEffect, useState } from "react";
import { UserMenu } from "./user-menu";
import { StudentProfileModal } from "./student/student-profile-modal";
import { QrWalkthroughModal } from "./student/qr-walkthrough-modal";
import { StudentMobileNav } from "./student/student-mobile-nav";
import { EventsModalProvider } from "./student/events-modal-context";
import { getStudentAvatar } from "@/app/dashboard/profile/actions";
import styles from "./student-shell.module.css";

type StudentShellProps = {
  userName: string;
  roleLabel: string;
  crumb: string;
  children: React.ReactNode;
  forceWalkthrough?: boolean;
};

const QR_WALKTHROUGH_KEY = "lt:qrWalkthroughSeen";

function shouldShowWalkthrough(force: boolean): boolean {
  if (force) return true;
  try {
    return !window.localStorage.getItem(QR_WALKTHROUGH_KEY);
  } catch {
    return true;
  }
}

export function StudentShell({ userName, roleLabel, crumb, children, forceWalkthrough }: StudentShellProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<"profile" | "qr">("profile");
  const [walkthroughOpen, setWalkthroughOpen] = useState(() =>
    shouldShowWalkthrough(forceWalkthrough ?? false),
  );

  useEffect(() => {
    let active = true;
    getStudentAvatar().then((res) => {
      if (active) setAvatarUrl(res.imageUrl);
    });
    return () => {
      active = false;
    };
  }, []);

  function openProfileQr() {
    setWalkthroughOpen(false);
    setProfileTab("qr");
    setProfileOpen(true);
  }

  function dismissWalkthrough() {
    try {
      window.localStorage.setItem(QR_WALKTHROUGH_KEY, "1");
    } catch {
      /* ignore storage failures */
    }
    setWalkthroughOpen(false);
  }

  return (
    <EventsModalProvider>
      <div className={styles.shell}>
      <div className={styles.content}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.brand}>
              <span className={styles.brandLogo}>
                <img src="/logo-favicon.png" alt="Liberalis-Tracker" />
              </span>
              <span className={styles.crumbRoot}>Liberalis-Tracker Student</span>
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
              onProfile={() => {
                setProfileTab("profile");
                setProfileOpen(true);
              }}
            />
          </div>
        </header>

        <main className={styles.main}>{children}</main>
      </div>

      <StudentProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onAvatarChange={setAvatarUrl}
        initialTab={profileTab}
      />

      <QrWalkthroughModal
        open={walkthroughOpen}
        onClose={dismissWalkthrough}
        onShowQr={openProfileQr}
        onDontShowAgain={dismissWalkthrough}
      />

      <StudentMobileNav />
    </div>
    </EventsModalProvider>
  );
}