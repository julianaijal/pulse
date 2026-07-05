import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("../../../_lib/rateLimit", () => ({
  rateLimit: vi.fn(() => ({ allowed: true })),
  getClientIp: vi.fn(() => "1.2.3.4"),
}));

import { GET } from "./route";
import { rateLimit } from "../../../_lib/rateLimit";

function callWithTrain(trainId: string) {
  return GET(new NextRequest(`http://localhost/api/journey/${trainId}`), {
    params: Promise.resolve({ trainId }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockReturnValue({ allowed: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /api/journey/[trainId]", () => {
  it("returns 429 when rate limited", async () => {
    vi.mocked(rateLimit).mockReturnValue({ allowed: false });

    const res = await callWithTrain("1234");

    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: "Too many requests" });
  });

  it("returns 400 for a non-numeric train number", async () => {
    const res = await callWithTrain("t3001");

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid train number" });
  });

  it("returns 400 for a too-long train number", async () => {
    const res = await callWithTrain("1234567"); // 7 digits, max is 6

    expect(res.status).toBe(400);
  });

  it("maps NS stops, filtering PASSING and event-less stops", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          payload: {
            stops: [
              {
                id: "asd_0",
                stop: { name: "Amsterdam Centraal" },
                status: "ORIGIN",
                arrivals: [],
                departures: [
                  {
                    plannedTime: "2026-06-11T08:14:00+02:00",
                    actualTime: "2026-06-11T08:16:00+02:00",
                    plannedTrack: "5",
                    actualTrack: "5",
                    crowdForecast: "HIGH",
                  },
                ],
              },
              {
                id: "dvd_0",
                stop: { name: "Duivendrecht" },
                status: "PASSING",
                arrivals: [],
                departures: [],
              },
              {
                id: "shl_0",
                stop: { name: "Schiphol Airport" },
                status: "STOP",
                arrivals: [
                  {
                    plannedTime: "2026-06-11T08:27:00+02:00",
                    plannedTrack: "3",
                  },
                ],
                departures: [
                  {
                    plannedTime: "2026-06-11T08:28:00+02:00",
                    plannedTrack: "3",
                    actualTrack: "4",
                    crowdForecast: "UNKNOWN",
                  },
                ],
              },
              {
                id: "wsp_0",
                stop: { name: "Weesp" },
                status: "STOP",
                arrivals: [],
                departures: [],
              },
              {
                id: "rtd_0",
                stop: { name: "Rotterdam Centraal" },
                status: "DESTINATION",
                arrivals: [
                  {
                    plannedTime: "2026-06-11T09:12:00+02:00",
                    actualTime: "2026-06-11T09:14:00+02:00",
                    plannedTrack: "15",
                    crowdForecast: "LOW",
                  },
                ],
                departures: [],
              },
            ],
          },
        }),
      })
    );

    const res = await callWithTrain("1234");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual([
      {
        code: "ASD",
        name: "Amsterdam Centraal",
        plannedTime: "2026-06-11T08:14:00+02:00",
        actualTime: "2026-06-11T08:16:00+02:00",
        track: "5",
        status: "ORIGIN",
        crowdForecast: "HIGH",
      },
      {
        code: "SHL",
        name: "Schiphol Airport",
        plannedTime: "2026-06-11T08:28:00+02:00",
        actualTime: "2026-06-11T08:28:00+02:00",
        track: "4",
        status: "STOP",
      },
      {
        code: "RTD",
        name: "Rotterdam Centraal",
        plannedTime: "2026-06-11T09:12:00+02:00",
        actualTime: "2026-06-11T09:14:00+02:00",
        track: "15",
        status: "DESTINATION",
        crowdForecast: "LOW",
      },
    ]);
  });

  it("passes through a non-ok NS status with an empty body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 502 }));

    const res = await callWithTrain("1234");

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual([]);
  });

  it("returns 500 with an empty body when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const res = await callWithTrain("1234");

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual([]);
  });
});
