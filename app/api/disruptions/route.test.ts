import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("../../_lib/rateLimit", () => ({
  rateLimit: vi.fn(() => ({ allowed: true })),
  getClientIp: vi.fn(() => "1.2.3.4"),
}));
vi.mock("../../_utils/mock", () => ({
  generateDisruptions: vi.fn(() => [{ id: "mock-disruption" }]),
}));

import { GET } from "./route";

function makeReq() {
  return new NextRequest("http://localhost/api/disruptions");
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /api/disruptions", () => {
  it("returns the NS payload on success", async () => {
    const disruptions = [{ id: "ns-1", title: "Werkzaamheden Utrecht" }];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ payload: disruptions }),
      })
    );

    const res = await GET(makeReq());

    expect(await res.json()).toEqual(disruptions);
  });

  it("falls back to mock data when NS responds non-ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 502 }));

    const res = await GET(makeReq());

    expect(await res.json()).toEqual([{ id: "mock-disruption" }]);
  });

  it("falls back to mock data when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const res = await GET(makeReq());

    expect(await res.json()).toEqual([{ id: "mock-disruption" }]);
  });
});
