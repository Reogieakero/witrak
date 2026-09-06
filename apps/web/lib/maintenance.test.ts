import { isMaintenanceMode, isFeesRecoveryNotice, MAINTENANCE_MESSAGE } from "./maintenance";

describe("maintenance flags", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("isMaintenanceMode", () => {
    it("is active when MAINTENANCE_MODE is unset", () => {
      delete process.env.MAINTENANCE_MODE;
      expect(isMaintenanceMode()).toBe(true);
    });

    it("is active when MAINTENANCE_MODE is any value other than 'false'", () => {
      process.env.MAINTENANCE_MODE = "true";
      expect(isMaintenanceMode()).toBe(true);
    });

    it("is inactive when MAINTENANCE_MODE is 'false'", () => {
      process.env.MAINTENANCE_MODE = "false";
      expect(isMaintenanceMode()).toBe(false);
    });
  });

  describe("isFeesRecoveryNotice", () => {
    it("is inactive when FEES_RECOVERY_NOTICE is unset", () => {
      delete process.env.FEES_RECOVERY_NOTICE;
      expect(isFeesRecoveryNotice()).toBe(false);
    });

    it("is active only when FEES_RECOVERY_NOTICE is 'true'", () => {
      process.env.FEES_RECOVERY_NOTICE = "true";
      expect(isFeesRecoveryNotice()).toBe(true);
    });

    it("is inactive for any value other than 'true'", () => {
      process.env.FEES_RECOVERY_NOTICE = "false";
      expect(isFeesRecoveryNotice()).toBe(false);
    });
  });

  describe("messages", () => {
    it("exposes a maintenance message", () => {
      expect(MAINTENANCE_MESSAGE).toContain("data recovery");
    });
  });
});
