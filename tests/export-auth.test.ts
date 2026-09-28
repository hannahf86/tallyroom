import { describe, it, expect, beforeEach } from "vitest";
import { GET } from "../app/api/export/route";

describe("month-end export", () => {
  beforeEach(() => {
    process.env.EXPORT_SECRET = "test-secret";
  });

  it("refuses requests without the secret", async () => {
    const res = await GET(
      new Request("http://localhost/api/export?clientId=any"),
    );
    expect(res.status).toBe(401);
  });

  it("refuses requests with the wrong secret", async () => {
    const res = await GET(
      new Request("http://localhost/api/export?clientId=any", {
        headers: { authorization: "Bearer wrong" },
      }),
    );
    expect(res.status).toBe(401);
  });
});
