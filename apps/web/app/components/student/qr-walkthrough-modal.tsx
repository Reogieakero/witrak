"use client";

import { useState } from "react";
import { QrCode, Sparkles, User, ArrowRight, Check } from "lucide-react";
import { Modal } from "@/app/components/ui/modal";
import { Button } from "@/app/components/ui/button";
import styles from "./qr-walkthrough.module.css";

const STEPS = [
  {
    icon: User,
    title: "Open your profile",
    text: "Tap your avatar in the top-right corner of the screen, then choose “My Profile”.",
  },
  {
    icon: QrCode,
    title: "Open the QR Code tab",
    text: "Inside your profile, switch to the “QR Code” tab to reveal your personal student code.",
  },
];

type QrWalkthroughModalProps = {
  open: boolean;
  onClose: () => void;
  onShowQr: () => void;
  onDontShowAgain?: () => void;
  dismissable?: boolean;
};

export function QrWalkthroughModal({
  open,
  onClose,
  onShowQr,
  onDontShowAgain,
  dismissable = true,
}: QrWalkthroughModalProps) {
  const [step, setStep] = useState(0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className={styles.title}>
          <span className={styles.titleIcon}>
            <Sparkles size={16} />
          </span>
          Welcome! Here&apos;s your QR code
        </div>
      }
      footer={
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.skip}
            onClick={() => {
              onDontShowAgain?.();
              onClose();
            }}
          >
            Don&apos;t show again
          </button>
          <div className={styles.footerRight}>
            {step === 0 ? (
              <Button size="md" onClick={() => setStep(1)}>
                Next
                <ArrowRight size={14} />
              </Button>
            ) : (
              <Button size="md" onClick={onShowQr}>
                <QrCode size={14} />
                Show my QR code
              </Button>
            )}
          </div>
        </div>
      }
    >
      <p className={styles.intro}>
        Your QR code is your student ID for Liberalis-Tracker activities. Present
        it at events for quick identity scanning. Here&apos;s how to find it anytime.
      </p>

      <ol className={styles.steps}>
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = i === step;
          const done = i < step;
          return (
            <li
              key={s.title}
              className={`${styles.step} ${active ? styles.stepActive : ""} ${
                done ? styles.stepDone : ""
              }`}
            >
              <span className={styles.stepIcon}>
                {done ? <Check size={15} /> : <Icon size={15} />}
              </span>
              <div className={styles.stepBody}>
                <span className={styles.stepTitle}>
                  {i + 1}. {s.title}
                </span>
                {active && <span className={styles.stepText}>{s.text}</span>}
              </div>
            </li>
          );
        })}
      </ol>

      {!dismissable && (
        <p className={styles.note}>
          Finish this quick tour to get the most out of your dashboard.
        </p>
      )}
    </Modal>
  );
}
