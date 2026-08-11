import { GET } from "./route";
import { auth } from "@/auth";
import { prisma } from "@fhusocom/db";

jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@fhusocom/db", () => ({
  prisma: { event: { findMany: jest.fn() } },
}));

const mockAuth = auth as jest.Mock;
const mockFindMany = prisma.event.findMany as jest.Mock;

describe("GET /api/events", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockFindMany.mockReset();
  });

  it("returns 403 when the session lacks events_view", async () => {
    mockAuth.mockResolvedValue({
      access: { permissions: [], scopeSectionIds: null },
    });

    const res = await GET();
    expect(res.status).toBe(403);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("returns events for an authorized user", async () => {
    mockAuth.mockResolvedValue({
      access: { permissions: ["events_view"], scopeSectionIds: null },
    });
    mockFindMany.mockResolvedValue([{ id: "evt1", title: "Founding Day" }]);

    const res = await GET();
    expect(res.status).toBe(200);
    expect(mockFindMany).toHaveBeenCalled();
    await expect(res.json()).resolves.toEqual({
      events: [{ id: "evt1", title: "Founding Day" }],
    });
  });
});
