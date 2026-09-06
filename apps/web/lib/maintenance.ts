/**
 * Maintenance kill-switch (system down for data recovery).
 *
 * The system is DOWN unless `MAINTENANCE_MODE` is explicitly set to "false".
 * While down, nobody — student, admin, or guest — may view pages, sign in,
 * sign up, or call APIs. Everyone only sees the data-recovery notice at
 * `/maintenance`.
 *
 * To bring the system back up: set `MAINTENANCE_MODE="false"` and redeploy.
 */
export function isMaintenanceMode(): boolean {
  return process.env.MAINTENANCE_MODE !== "false";
}

export const MAINTENANCE_MESSAGE =
  "System is down for data recovery due to data loss. Please try again later.";

/**
 * Recovery notice for students' fee payment proofs.
 *
 * After the system recovery, fee payment proofs may have been lost. While this
 * flag is "true", the student dashboard surfaces a notice asking students to
 * re-upload their proof of payment if they already paid. Clear it (set to
 * "false") once re-uploads are no longer expected.
 *
 * Only meaningful when maintenance mode is OFF — while down, nobody reaches
 * the dashboard.
 */
export function isFeesRecoveryNotice(): boolean {
  return process.env.FEES_RECOVERY_NOTICE === "true";
}

export const FEES_RECOVERY_NOTICE_MESSAGE =
  "During the recent system recovery, your fee payment proofs may not have been restored. If you already paid your fees, please upload your proof of payment again so the Treasurer can verify it.";
