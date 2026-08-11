import { History, Lock, ShieldCheck, WifiOff } from "lucide-react";
import shared from "./landing.module.css";
import styles from "./security.module.css";

const ITEMS = [
  {
    icon: Lock,
    title: "Access follows the role",
    text: "Each of the 23 permission keys scopes exactly what a role can view or edit.",
  },
  {
    icon: ShieldCheck,
    title: "Sanctions stay private",
    text: "Disciplinary records are visible only to the officers who need them.",
  },
  {
    icon: History,
    title: "Every change is logged",
    text: "The audit trail records who did what, and when — with no silent edits.",
  },
  {
    icon: WifiOff,
    title: "Works even offline",
    text: "Mobile check-in keeps scanning with no signal and syncs the moment you're back.",
  },
];

const VIEWS = [
  { role: "Secretary · attendance", access: "Full detail" },
  { role: "Treasurer · fee records", access: "Full detail" },
  { role: "Discipline Officer · sanctions", access: "Restricted to own cases" },
  { role: "Student · own records", access: "Read-only, own data only" },
];

export function Security() {
  return (
    <section id="security" className={styles.section}>
      <div className={shared.container}>
        <div className={styles.grid}>
          <div>
            <span className={shared.sectionTag}>Security</span>
            <h2 className={shared.sectionTitle}>
              Private records stay private
            </h2>
            <p className={shared.sectionText}>
              Confidentiality isn&apos;t a checkbox — it&apos;s how the whole
              system is built. Roles see exactly the records they were given,
              and every action is traceable.
            </p>
            <div className={styles.items}>
              {ITEMS.map((it) => (
                <div key={it.title} className={styles.item}>
                  <div className={styles.icon}>
                    <it.icon size={18} />
                  </div>
                  <div>
                    <h3 className={styles.itemTitle}>{it.title}</h3>
                    <p className={styles.itemText}>{it.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <ShieldCheck size={16} />
              Access in practice
            </div>
            <div className={styles.views}>
              {VIEWS.map((v) => (
                <div key={v.role} className={styles.view}>
                  <span className={styles.viewRole}>{v.role}</span>
                  <span className={styles.viewAccess}>{v.access}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
