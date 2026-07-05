import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("../../_lib/rateLimit", () => ({
  rateLimit: vi.fn(() => ({ allowed: true })),
  getClientIp: vi.fn(() => "1.2.3.4"),
}));
vi.mock("../../_utils/mock", () => ({
  generateDisruptions: vi.fn(() => [{ id: "mock-disruption" }]),
  project: vi.fn(() => ({ x: 0.5, y: 0.5 })),
}));

import { GET } from "./route";

function makeReq() {
  return new NextRequest("http://localhost/api/disruptions");
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /api/disruptions", () => {
  it("maps NS v3 disruptions to the app shape", async () => {
    const nsItem = {
      id: "6065640",
      type: "DISRUPTION",
      title: "Den Haag - Rotterdam - Dordrecht.",
      expectedDuration: { description: "Dit duurt ten minste tot dinsdag 7 juli 5:00 uur." },
      publicationSections: [
        {
          section: {
            stations: [
              { coordinate: { lat: 52.08, lng: 4.32 }, countryCode: "NL", stationCode: "GVC" },
              { coordinate: { lat: 51.92, lng: 4.47 }, countryCode: "NL", stationCode: "RTD" },
              { coordinate: { lat: 51.81, lng: 4.66 }, countryCode: "NL", stationCode: "DDR" },
            ],
          },
        },
      ],
      timespans: [
        {
          situation: { label: "Door een stroomstoring: tussen Rotterdam Centraal en Zwijndrecht rijden er geen treinen." },
          additionalTravelTime: { shortLabel: "Extra reistijd 30 min." },
        },
      ],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => [nsItem] })
    );

    const res = await GET(makeReq());

    expect(await res.json()).toEqual([
      {
        id: "6065640",
        type: "storm",
        label: "Den Haag - Rotterdam - Dordrecht",
        center: { x: 0.5, y: 0.5 },
        radius: 0.1,
        severity: 0.8,
        lines: ["GVC → DDR"],
        impact: "Extra reistijd 30 min.",
        message: "Door een stroomstoring: tussen Rotterdam Centraal en Zwijndrecht rijden er geen treinen.",
      },
    ]);
  });

  it("maps MAINTENANCE to a low-severity fog disruption", async () => {
    const nsItem = {
      id: "9001",
      type: "MAINTENANCE",
      title: "Utrecht - Arnhem.",
      timespans: [{ situation: { label: "Door werkzaamheden: tussen Driebergen-Zeist en Ede-Wageningen rijden er geen treinen." } }],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => [nsItem] })
    );

    const res = await GET(makeReq());
    const body = await res.json();

    expect(body[0]).toMatchObject({
      type: "fog",
      severity: 0.45,
      impact: "",
      center: { x: 0.5, y: 0.5 },
      lines: [],
    });
  });

  it("falls back to mock data when NS returns an empty list", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => [] })
    );

    const res = await GET(makeReq());

    expect(await res.json()).toEqual([{ id: "mock-disruption" }]);
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
