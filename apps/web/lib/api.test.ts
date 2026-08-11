import { handleError } from "./api";
import { ForbiddenError } from "./permissions";

describe("handleError", () => {
  it("returns a 403 response for ForbiddenError", async () => {
    const res = handleError(new ForbiddenError("events_view"));
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({
      error: expect.stringContaining("events_view"),
    });
  });

  it("rethrows errors that are not ForbiddenError", () => {
    expect(() => handleError(new Error("boom"))).toThrow("boom");
  });
});
