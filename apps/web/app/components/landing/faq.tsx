import { ChevronDown } from "lucide-react";
import shared from "./landing.module.css";
import styles from "./faq.module.css";

const ITEMS = [
  {
    q: "Does FHUSOCOM replace our existing spreadsheets?",
    a: "Yes. Events, attendance, fees, sanctions, and reports all live in FHUSOCOM — one source of truth instead of files scattered across group chats and folders.",
  },
  {
    q: "Who can see a student's sanction records?",
    a: "Only officers whose role requires it — like the Discipline Officer — and always through scoped permission keys. Students never see each other's records.",
  },
  {
    q: "How does attendance flagging work?",
    a: "Absences roll up per student and per period. When a threshold is crossed, a private flag is raised for the Discipline Officer to review and resolve.",
  },
  {
    q: "How do members submit proof of payment?",
    a: "The treasurer publishes a due with a deadline. Members upload a screenshot or receipt in the portal, and the treasurer verifies it in one place.",
  },
  {
    q: "Can students see their own records?",
    a: "Yes. Every student can view their own attendance, submitted proofs, and standing — read-only, and nothing more than their own data.",
  },
  {
    q: "How are officer accounts created?",
    a: "The Super Admin provisions accounts with roles on day one. Students are linked to their records during setup, so there's no self-registration chaos.",
  },
];

export function Faq() {
  return (
    <section id="faq" className={styles.section}>
      <div className={shared.container}>
        <div className={shared.sectionHead}>
          <span className={shared.sectionTag}>FAQ</span>
          <h2 className={shared.sectionTitle}>Common questions</h2>
        </div>
        <div className={styles.list}>
          {ITEMS.map((it) => (
            <details key={it.q} className={styles.item}>
              <summary className={styles.summary}>
                {it.q}
                <ChevronDown size={16} className={styles.chevron} />
              </summary>
              <p className={styles.answer}>{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
