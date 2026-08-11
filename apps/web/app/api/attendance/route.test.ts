import { GET } from "./route";
import { auth } from "@/auth";
import { prisma } from "@fhusocom/db";

jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@fhusocom/db", () => ({
  prisma: { attendance: { findMany: jest.fn() } },
}));

const mockAuth = auth as jest.Mock;
const mockFindMany = prisma.attendance.findMany as jest.Mock;

describe("GET /api/attendance", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockFindMany.mockReset();
  });

  it("returns 403 when the session lacks attendance_view", async () => {
    mockAuth.mockResolvedValue({
      access: { permissions: [], scopeSectionIds: null },
    });

    const res = await GET();
    expect(res.status).toBe(403);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("returns records for an authorized faculty-wide user", async () => {
    mockAuth.mockResolvedValue({
      access: { permissions: ["attendance_view"], scopeSectionIds: null },
    });
    mockFindMany.mockResolvedValue([
      { id: "att1", student: { firstName: "Jane", lastName: "Doe" } },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    expect(mockFindMany).toHaveBeenCalled();
    await expect(res.json()).resolves.toEqual({
      records: [{ id: "att1", student: { firstName: "Jane", lastName: "Doe" } }],
    });
  });

  it("passes a scope filter for section-scoped access", async () => {
    mockAuth.mockResolvedValue({
      access: { permissions: ["attendance_view"], scopeSectionIds: ["s1"] },
    });
    mockFindMany.mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { student: { sectionId: { in: ["s1"] } } },
      }),
    );
  });
});
