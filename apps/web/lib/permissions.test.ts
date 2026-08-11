import { ForbiddenError, hasPermission, requirePermission, studentInScope } from "./permissions";
import type { UserAccess } from "./permissions";

describe("hasPermission", () => {
  const access: UserAccess = { permissions: ["events_view"], scopeSectionIds: null };

  it("returns true when the key is present", () => {
    expect(hasPermission(access, "events_view")).toBe(true);
  });

  it("returns false when the key is missing", () => {
    expect(hasPermission(access, "fees_view")).toBe(false);
  });

  it("returns false for null or undefined access", () => {
    expect(hasPermission(null, "events_view")).toBe(false);
    expect(hasPermission(undefined, "events_view")).toBe(false);
  });
});

describe("requirePermission", () => {
  it("throws ForbiddenError when the permission is missing", () => {
    const access: UserAccess = { permissions: [], scopeSectionIds: null };
    expect(() => requirePermission(access, "events_create")).toThrow(ForbiddenError);
  });

  it("does not throw when the permission is present", () => {
    const access: UserAccess = { permissions: ["events_create"], scopeSectionIds: null };
    expect(() => requirePermission(access, "events_create")).not.toThrow();
  });
});

describe("studentInScope", () => {
  it("returns an empty filter for faculty-wide access", () => {
    const access: UserAccess = { permissions: [], scopeSectionIds: null };
    expect(studentInScope(access)).toEqual({});
  });

  it("filters by the section set for scoped access", () => {
    const access: UserAccess = { permissions: [], scopeSectionIds: ["s1", "s2"] };
    expect(studentInScope(access)).toEqual({ sectionId: { in: ["s1", "s2"] } });
  });

  it("returns an empty in-filter for an empty section set", () => {
    const access: UserAccess = { permissions: [], scopeSectionIds: [] };
    expect(studentInScope(access)).toEqual({ sectionId: { in: [] } });
  });
});
