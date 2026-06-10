import { describe, it, expect, vi, afterEach } from "vitest";
import { getStationCodes } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getStationCodes", () => {
  it("maps the NS payload to IStation objects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          payload: [
            { UICCode: "8400058", namen: { lang: "Amsterdam Centraal" }, code: "ASD" },
          ],
        }),
      })
    );

    const result = await getStationCodes("amsterdam");

    expect(result).toEqual([
      { id: "8400058", name: "Amsterdam Centraal", code: "ASD" },
    ]);
  });

  it("returns [] when the response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    expect(await getStationCodes("utrecht")).toEqual([]);
  });

  it("returns [] when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    expect(await getStationCodes("utrecht")).toEqual([]);
  });

  it("URL-encodes the query", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ payload: [] }) });
    vi.stubGlobal("fetch", fetchMock);

    await getStationCodes("den haag");

    expect(fetchMock.mock.calls[0][0]).toContain("q=den%20haag");
  });
});
