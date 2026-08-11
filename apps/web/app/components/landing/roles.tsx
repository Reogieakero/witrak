import {
  Crown,
  GraduationCap,
  ScrollText,
  Shield,
  Users,
  Wallet,
} from "lucide-react";
import shared from "./landing.module.css";
import styles from "./roles.module.css";

const ROLES = [
  {
    icon: Crown,
    title: "Super Admin",
    text: "Full oversight of roles, permissions, and every record in the system.",
  },
  {
    icon: ScrollText,
    title: "Secretary",
    text: "Owns events, attendance, and the official minutes and announcements.",
  },
  {
    icon: Wallet,
    title: "Treasurer",
    text: "Manages fees, verifies proof of payment, and publishes financial reports.",
  },
  {
    icon: Shield,
    title: "Discipline Officer",
    text: "Handles sanctions privately, with resolve and appeal workflows.",
  },
  {
    icon: Users,
    title: "Year / Program Rep",
    text: "Runs events and checks attendance for their assigned sections.",
  },
  {
    icon: GraduationCap,
    title: "Student",
    text: "Sees their own attendance, dues, and submitted proofs in one view.",
  },
];

export function Roles() {
  return (
    <section id="roles" className={styles.section}>
      <div className={shared.container}>
        <div className={shared.sectionHead}>
          <span className={shared.sectionTag}>Roles</span>
          <h2 className={shared.sectionTitle}>
            One login per person, scoped to their job
          </h2>
          <p className={shared.sectionText}>
            Every officer and member gets exactly the access their role needs —
            and nothing more.
          </p>
        </div>
        <div className={styles.grid}>
          {ROLES.map((r) => (
            <div key={r.title} className={styles.card}>
              <div className={styles.icon}>
                <r.icon size={18} />
              </div>
              <h3 className={styles.title}>{r.title}</h3>
              <p className={styles.text}>{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
