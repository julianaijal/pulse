import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("../../_utils/api", () => ({
  getStationCodes: vi.fn(),
}));
vi.mock("../../_lib/rateLimit", () => ({
  rateLimit: vi.fn(() => ({ allowed: true })),
  getClientIp: vi.fn(() => "1.2.3.4"),
}));

import { GET } from "./route";
import { getStationCodes } from "../../_utils/api";
import { rateLimit } from "../../_lib/rateLimit";

function makeReq(q?: string) {
  const url =
    q === undefined
      ? "http://localhost/api/stations"
      : `http://localhost/api/stations?q=${encodeURIComponent(q)}`;
  return new NextRequest(url);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockReturnValue({ allowed: true });
  vi.mocked(getStationCodes).mockResolvedValue([]);
});

describe("GET /api/stations", () => {
  it("returns 429 when rate limited", async () => {
    vi.mocked(rateLimit).mockReturnValue({ allowed: false });

    const res = await GET(makeReq("ams"));

    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: "Too many requests" });
  });

  it("returns [] without calling the API for queries shorter than 2 chars", async () => {
    const res = await GET(makeReq("a"));

    expect(await res.json()).toEqual([]);
    expect(getStationCodes).not.toHaveBeenCalled();
  });

  it("returns stations from getStationCodes", async () => {
    const stations = [{ id: "8400058", name: "Amsterdam Centraal", code: "ASD" }];
    vi.mocked(getStationCodes).mockResolvedValue(stations);

    const res = await GET(makeReq("amsterdam"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(stations);
    expect(getStationCodes).toHaveBeenCalledWith("amsterdam");
  });
});
