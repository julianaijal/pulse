import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// rateLimit keeps module-level state; re-import a fresh copy per test.
async function freshRateLimit() {
  vi.resetModules();
  return await import("./rateLimit");
}

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows up to 30 requests in one window", async () => {
    const { rateLimit } = await freshRateLimit();
    for (let i = 0; i < 30; i++) {
      expect(rateLimit("1.2.3.4").allowed).toBe(true);
    }
  });

  it("blocks the 31st request within the window", async () => {
    const { rateLimit } = await freshRateLimit();
    for (let i = 0; i < 30; i++) rateLimit("1.2.3.4");

    expect(rateLimit("1.2.3.4").allowed).toBe(false);
  });

  it("tracks IPs independently", async () => {
    const { rateLimit } = await freshRateLimit();
    for (let i = 0; i < 30; i++) rateLimit("1.1.1.1");

    expect(rateLimit("1.1.1.1").allowed).toBe(false);
    expect(rateLimit("2.2.2.2").allowed).toBe(true);
  });

  it("resets after the window passes", async () => {
    const { rateLimit } = await freshRateLimit();
    for (let i = 0; i < 30; i++) rateLimit("1.2.3.4");
    expect(rateLimit("1.2.3.4").allowed).toBe(false);

    vi.advanceTimersByTime(60_001);

    expect(rateLimit("1.2.3.4").allowed).toBe(true);
  });

  it("allows requests with no identifiable IP", async () => {
    const { rateLimit } = await freshRateLimit();

    expect(rateLimit(null).allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  function reqWithHeader(value: string | null) {
    return {
      headers: {
        get: (name: string) => (name === "x-forwarded-for" ? value : null),
      },
    };
  }

  it("returns the first IP from x-forwarded-for", async () => {
    const { getClientIp } = await import("./rateLimit");

    expect(getClientIp(reqWithHeader("1.2.3.4, 5.6.7.8"))).toBe("1.2.3.4");
  });

  it("trims whitespace", async () => {
    const { getClientIp } = await import("./rateLimit");

    expect(getClientIp(reqWithHeader("  9.9.9.9  "))).toBe("9.9.9.9");
  });

  it("returns null when the header is missing", async () => {
    const { getClientIp } = await import("./rateLimit");

    expect(getClientIp(reqWithHeader(null))).toBeNull();
  });
});
