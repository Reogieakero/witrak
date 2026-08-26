import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowLeft,
  CalendarDays,
  GraduationCap,
  Landmark,
  Star,
} from "lucide-react";
import { StudentLoginForm } from "./student-login-form";
import styles from "../officers/officers.module.css";

const FEATURES = [
  {
    icon: CalendarDays,
    text: "Events with QR attendance — never miss a roll call",
  },
  {
    icon: Landmark,
    text: "Fees you can view and pay, with proof on record",
  },
  {
    icon: GraduationCap,
    text: "Announcements and transparency, all in one place",
  },
];

export default function StudentsLoginPage() {
  return (
    <main className={styles.main}>
      <aside className={styles.brandPanel}>
        <div className={styles.blobA} />
        <div className={styles.blobB} />

        <div className={styles.brandTop}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandLogo}>
              <img src="/logo-favicon.png" alt="Liberalis-Tracker" />
            </span>
            <span className={styles.brandName}>Liberalis-Tracker</span>
          </Link>

          <h1 className={styles.brandHeadline}>
            Your campus life, one login away.
          </h1>
          <p className={styles.brandSub}>
            Sign in with your school Google account to see events,
            attendance, fees, and announcements built for students.
          </p>

          <div className={styles.features}>
            {FEATURES.map((f) => (
              <div key={f.text} className={styles.feature}>
                <span className={styles.featureIcon}>
                  <f.icon size={16} />
                </span>
                <span className={styles.featureText}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.testimonial}>
          <div className={styles.stars}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={12} className={styles.star} />
            ))}
          </div>
          <p className={styles.quote}>
            &quot;I just tap Google and I&apos;m in — my fees, my attendance,
            my org announcements, all on my phone.&quot;
          </p>
          <div className={styles.testimonialFooter}>
            <span className={styles.avatar}>MA</span>
            <span className={styles.testimonialName}>
              M. Aquino &middot; 2nd Year
            </span>
          </div>
        </div>
      </aside>

      <div className={styles.formPanel}>
        <Link href="/" className={styles.mobileBrand}>
          <span className={styles.mobileLogo}>
            <img src="/logo-favicon.png" alt="Liberalis-Tracker" />
          </span>
          Liberalis-Tracker
        </Link>

        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={14} />
          Back to homepage
        </Link>

        <div className={styles.inner}>
          <h2 className={styles.title}>Student sign in</h2>
          <p className={styles.subtitle}>
            Use your school Google account to continue.
          </p>

          <Suspense fallback={null}>
            <StudentLoginForm />
          </Suspense>

          <p className={styles.note}>
            Students sign in with Google using their school email.
          </p>
        </div>

        <p className={styles.copyright}>
          &copy; {new Date().getFullYear()} Liberalis-Tracker. All rights reserved.
        </p>
      </div>
    </main>
  );
}
