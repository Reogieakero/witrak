import { resolveUserAccess } from "./access";
import { prisma } from "@fhusocom/db";

jest.mock("@fhusocom/db", () => ({
  prisma: {
    user: { findUnique: jest.fn() },
  },
}));

const mockFindUnique = prisma.user.findUnique as jest.Mock;

type PartialUserRole = {
  scopeType?: string;
  section?: { id: string } | null;
  programYear?: { sections: { id: string }[] } | null;
  program?: { sections: { id: string }[] } | null;
  role?: { permissions: { permission: { key: string } }[] };
};

function makeUserRole(overrides: PartialUserRole = {}) {
  return {
    scopeType: "FACULTY",
    section: null,
    programYear: null,
    program: null,
    role: { permissions: [] },
    ...overrides,
  };
}

describe("resolveUserAccess", () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
  });

  it("returns empty access when the user does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);
    await expect(resolveUserAccess("missing")).resolves.toEqual({
      permissions: [],
      scopeSectionIds: null,
    });
  });

  it("collects permission keys and faculty-wide scope", async () => {
    mockFindUnique.mockResolvedValue({
      roles: [
        makeUserRole({
          scopeType: "FACULTY",
          role: {
            permissions: [
              { permission: { key: "events_view" } },
              { permission: { key: "fees_view" } },
            ],
          },
        }),
      ],
    });

    const access = await resolveUserAccess("u1");
    expect(access.permissions).toEqual(
      expect.arrayContaining(["events_view", "fees_view"]),
    );
    expect(access.scopeSectionIds).toBeNull();
  });

  it("resolves section, program-year and program scopes to a section set", async () => {
    mockFindUnique.mockResolvedValue({
      roles: [
        makeUserRole({
          scopeType: "SECTION",
          section: { id: "s1" },
          role: { permissions: [{ permission: { key: "events_view" } }] },
        }),
        makeUserRole({
          scopeType: "PROGRAM_YEAR",
          programYear: { sections: [{ id: "s2" }, { id: "s3" }] },
          role: { permissions: [{ permission: { key: "attendance_view" } }] },
        }),
        makeUserRole({
          scopeType: "PROGRAM",
          program: { sections: [{ id: "s3" }, { id: "s4" }] },
          role: { permissions: [{ permission: { key: "fees_view" } }] },
        }),
      ],
    });

    const access = await resolveUserAccess("u1");
    expect(access.scopeSectionIds).toEqual(
      expect.arrayContaining(["s1", "s2", "s3", "s4"]),
    );
    expect(access.permissions).toHaveLength(3);
  });

  it("grants faculty-wide scope when any role is faculty-scoped", async () => {
    mockFindUnique.mockResolvedValue({
      roles: [
        makeUserRole({
          scopeType: "SECTION",
          section: { id: "s1" },
          role: { permissions: [] },
        }),
        makeUserRole({ scopeType: "FACULTY", role: { permissions: [] } }),
      ],
    });

    const access = await resolveUserAccess("u1");
    expect(access.scopeSectionIds).toBeNull();
  });

  it("ignores scopes that have no resolved sections", async () => {
    mockFindUnique.mockResolvedValue({
      roles: [
        makeUserRole({
          scopeType: "SECTION",
          section: null,
          role: { permissions: [] },
        }),
      ],
    });

    const access = await resolveUserAccess("u1");
    expect(access.scopeSectionIds).toEqual([]);
    expect(access.permissions).toEqual([]);
  });
});
