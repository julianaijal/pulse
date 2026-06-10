import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("../../../_lib/rateLimit", () => ({
  rateLimit: vi.fn(() => ({ allowed: true })),
  getClientIp: vi.fn(() => "1.2.3.4"),
}));

import { GET } from "./route";

function makeReq() {
  return new NextRequest("http://localhost/api/departures/asd");
}

function callWithCode(code: string) {
  return GET(makeReq(), { params: Promise.resolve({ code }) });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /api/departures/[code]", () => {
  it("returns 400 for an invalid station code", async () => {
    const res = await callWithCode("123456789"); // 9 chars, max is 7

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid station code" });
  });

  it("maps NS departures to IDeparture with delay and track change", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          payload: {
            departures: [
              {
                product: { number: "1234", categoryCode: "IC" },
                direction: "Utrecht Centraal",
                plannedDateTime: "2026-06-10T10:00:00+02:00",
                actualDateTime: "2026-06-10T10:05:00+02:00",
                plannedTrack: "4",
                actualTrack: "5",
                cancelled: false,
              },
            ],
          },
        }),
      })
    );

    const res = await callWithCode("asd");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      id: "ASD-0-1234",
      direction: "Utrecht Centraal",
      delayMinutes: 5,
      trainCategory: "IC",
      plannedTrack: "4",
      actualTrack: "5",
      trackChanged: true,
      cancelled: false,
      trainId: "1234",
    });
  });

  it("defaults actual time/track and reports no delay when NS omits them", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          payload: {
            departures: [
              {
                product: { number: "5678", categoryCode: "SPR" },
                direction: "Almere Centrum",
                plannedDateTime: "2026-06-10T11:00:00+02:00",
                plannedTrack: "2",
              },
            ],
          },
        }),
      })
    );

    const res = await callWithCode("asd");
    const body = await res.json();

    expect(body[0]).toMatchObject({
      delayMinutes: 0,
      actualDateTime: "2026-06-10T11:00:00+02:00",
      actualTrack: "2",
      trackChanged: false,
      cancelled: false,
    });
  });

  it("passes through a non-ok NS status with an empty body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 502 })
    );

    const res = await callWithCode("asd");

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual([]);
  });

  it("returns 500 with an empty body when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const res = await callWithCode("asd");

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual([]);
  });
});
