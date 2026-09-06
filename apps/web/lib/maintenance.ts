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
