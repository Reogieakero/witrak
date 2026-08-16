import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  FlaskConical,
  Landmark,
  ShieldAlert,
  Star,
} from "lucide-react";
import { OfficerLoginForm } from "./officer-login-form";
import styles from "./officers.module.css";

const FEATURES = [
  {
    icon: CalendarDays,
    text: "Events with QR attendance, tracked in real time",
  },
  {
    icon: Landmark,
    text: "Fees verified with proof, published transparently",
  },
  {
    icon: ShieldAlert,
    text: "Sanctions kept private, resolved with a full audit trail",
  },
];

const DEMO_ROLES = [
  { role: "Supreme", desc: "Faculty-wide access, manages roles" },
  { role: "Secretary", desc: "Events, attendance, announcements" },
  { role: "Treasurer", desc: "Fees, payment verification, reports" },
  { role: "Discipline Officer", desc: "Private sanctions and appeals" },
];

export default function OfficersLoginPage() {
  return (
    <main className={styles.main}>
      <aside className={styles.brandPanel}>
        <div className={styles.blobA} />
        <div className={styles.blobB} />

        <div className={styles.brandTop}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandLogo}>
              <img src="/logo-favicon.png" alt="Liberalis" />
            </span>
            <span className={styles.brandName}>Liberalis</span>
          </Link>

          <h1 className={styles.brandHeadline}>
            Run your student government, one system, not a pile of forms.
          </h1>
          <p className={styles.brandSub}>
            Sign in to pick up where your org left off — events, attendance,
            fees, and transparency, all in one portal.
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
            &quot;Payment proofs used to live in my phone&apos;s gallery. Now
            every submission is verified and on record before the
            deadline.&quot;
          </p>
          <div className={styles.testimonialFooter}>
            <span className={styles.avatar}>JR</span>
            <span className={styles.testimonialName}>
              J. Reyes &middot; Treasurer
            </span>
          </div>
        </div>
      </aside>

      <div className={styles.formPanel}>
          <Link href="/" className={styles.mobileBrand}>
            <span className={styles.mobileLogo}>
              <img src="/logo-favicon.png" alt="Liberalis" />
            </span>
            Liberalis
          </Link>

        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={14} />
          Back to homepage
        </Link>

        <div className={styles.inner}>
          <h2 className={styles.title}>Welcome back</h2>
          <p className={styles.subtitle}>
            Sign in to the Liberalis Officer Portal to continue.
          </p>

          <Suspense fallback={null}>
            <OfficerLoginForm />
          </Suspense>

          <p className={styles.note}>
            Supreme, Secretary, Treasurer, Discipline Officer, or Year Rep
            account? Contact your school administrator for access.
          </p>

          <details className={styles.details}>
            <summary className={styles.summary}>
              <FlaskConical size={12} />
              View seeded accounts
              <ChevronDown size={12} className={styles.chevron} />
            </summary>
            <div className={styles.credentialBox}>
              {DEMO_ROLES.map((r) => (
                <div key={r.role} className={styles.credentialRow}>
                  <span>{r.role}</span>
                  <span className={styles.credentialDesc}>{r.desc}</span>
                </div>
              ))}
            </div>
          </details>
        </div>

        <p className={styles.copyright}>
          &copy; {new Date().getFullYear()} Liberalis. All rights reserved.
        </p>
      </div>
    </main>
  );
}
