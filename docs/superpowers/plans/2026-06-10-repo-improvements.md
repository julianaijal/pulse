# Repo Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the a11y sprint (PRO-9/PRO-10), add a GitHub Actions CI gate (lint + build), and add a Vitest testing foundation for pure logic.

**Architecture:** Three sequential sub-projects, each its own Linear issue + PR. Sub-project 1 reuses the existing detailed plan in `docs/superpowers/plans/2026-04-18-a11y-fixes.md`. Sub-project 2 adds `.github/workflows/ci.yml`. Sub-project 3 adds Vitest with colocated `*.test.ts` files covering the rate limiter, `getStationCodes`, and the three API route handlers (NS API always mocked).

**Tech Stack:** Next.js 16 (App Router), TypeScript 5, Vitest, GitHub Actions (Node 22), Linear GraphQL API, `gh` CLI.

**Spec:** `docs/superpowers/specs/2026-06-10-repo-improvements-design.md`

**Sequencing constraint:** Tasks run in order. Tasks 8–13 branch from `master` only after the CI PR (Task 7) has merged, because Task 13 modifies the workflow file Task 7 creates.

---

## Sub-project 1: Finish the a11y sprint

### Task 1: Housekeeping docs commit to master

The uncommitted Linear-setup changes are unrelated to the PRO-10 branch and go straight to `master` (allowed per CLAUDE.md for small docs changes).

**Files:**
- Commit (already modified): `.env.example`, `CLAUDE.md`, `README.md`
- Commit (untracked): `docs/superpowers/plans/2026-04-18-a11y-fixes.md`

- [ ] **Step 1: Verify the housekeeping files are identical on master and the branch**

Run: `git diff master...HEAD -- .env.example CLAUDE.md README.md`
Expected: empty output. If not empty, STOP and ask the user how to proceed.

- [ ] **Step 2: Switch to master carrying the uncommitted changes**

```bash
git checkout master && git pull
```

Expected: checkout succeeds, modified files carry over. If git refuses the checkout because of conflicting local changes, STOP and ask the user.

- [ ] **Step 3: Commit and push**

```bash
git add .env.example CLAUDE.md README.md docs/superpowers/plans/2026-04-18-a11y-fixes.md
git commit -m "docs: add Linear workflow setup and a11y implementation plan"
git push origin master
```

- [ ] **Step 4: Return to the PRO-10 branch**

```bash
git checkout julianaijal/pro-10-a11y-css
```

### Task 2: Open the PRO-10 PR

PRO-10's code work (3 of 4 tasks) is already committed on `julianaijal/pro-10-a11y-css`. Only the PR remains. The Linear issue PRO-10 already exists, so the webhook will fire on PR creation.

- [ ] **Step 1: Verify the branch is clean and contains the a11y commits**

Run: `git status && git log --oneline master..HEAD`
Expected: clean working tree; log shows the three `a11y:` commits plus the design-spec docs commit.

- [ ] **Step 2: Push and create the PR**

```bash
git push -u origin julianaijal/pro-10-a11y-css
gh pr create --title "a11y: CSS fixes — reduced motion, tokens, contrast, rem typography" --body "$(cat <<'EOF'
## Summary
- prefers-reduced-motion media queries for sidebar, tabbar, and loader animations
- Replace hard-coded hex colours in Home.module.scss with design tokens
- Fix warn chip contrast, convert px font-sizes to rem, heading line-height
- Also carries the repo-improvements design spec (docs only)

Fixes PRO-10

## Test plan
- [ ] Verify animations are disabled with "reduce motion" enabled in OS settings
- [ ] Check warn chip contrast with a contrast checker (≥ 4.5:1)
- [ ] Visual regression pass over Home view

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL printed. Report it to the user.

### Task 3: Execute the PRO-9 plan (ARIA & keyboard)

PRO-9 has a complete, detailed plan already written. Do not improvise — follow it.

**Files:** as listed per-task in `docs/superpowers/plans/2026-04-18-a11y-fixes.md` (PRO-9 section).

- [ ] **Step 1: Create the branch from up-to-date master**

```bash
git checkout master && git pull
git checkout -b julianaijal/pro-9-a11y-aria-keyboard
```

- [ ] **Step 2: Execute the PRO-9 section of `docs/superpowers/plans/2026-04-18-a11y-fixes.md`**

Execute its 8 tasks exactly as written there (skip link + Loader role, TabBar roving tabindex, RhythmView labels, PulseView SVG keyboard access, DepartureRow labels, JourneyView stop semantics, StationView outline/aria-busy, push & PR). That document contains the exact file paths, code, and commit messages. Every commit message body must include `PRO-9`. The PR body must include `Fixes PRO-9`.

- [ ] **Step 3: Verify**

Run: `npm run lint && npm run build`
Expected: both pass. Report the PR URL to the user.

---

## Sub-project 2: CI workflow

### Task 4: Create the Linear issue for CI

- [ ] **Step 1: Load Linear credentials**

```bash
export $(grep -E '^LINEAR_(API_KEY|TEAM_ID)=' .env | xargs)
```

- [ ] **Step 2: Create the issue**

```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"mutation(\$input: IssueCreateInput!) { issueCreate(input: \$input) { issue { identifier url } } }\", \"variables\": {\"input\": {\"teamId\": \"$LINEAR_TEAM_ID\", \"title\": \"Add GitHub Actions CI workflow (lint + build)\", \"description\": \"Add .github/workflows/ci.yml that runs eslint and next build on PRs to master and pushes to master, using Node 22. No Prettier, no pre-commit hooks (out of scope per design spec).\"}}}"
```

Expected: JSON containing `"identifier": "PRO-<N>"`. Note the number — it is referenced as `PRO-<CI>` in Task 5.

### Task 5: Add the CI workflow and open the PR

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Verify lint and build pass locally first**

Run: `npm run lint && npm run build`
Expected: both succeed. If not, STOP — fix locally before adding a CI gate that would immediately fail.

- [ ] **Step 2: Create the branch**

```bash
git checkout master && git pull
git checkout -b julianaijal/pro-<CI>-ci-workflow
```

- [ ] **Step 3: Write the workflow file**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [master]
  push:
    branches: [master]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run build
```

- [ ] **Step 4: Commit, push, open PR**

```bash
git add .github/workflows/ci.yml
git commit -m "$(cat <<'EOF'
ci: add GitHub Actions workflow for lint and build

PRO-<CI>
EOF
)"
git push -u origin julianaijal/pro-<CI>-ci-workflow
gh pr create --title "ci: add GitHub Actions lint + build gate" --body "$(cat <<'EOF'
## Summary
- Adds .github/workflows/ci.yml: npm ci → lint → build on PRs to master and pushes to master
- Node 22 with npm cache

Fixes PRO-<CI>

## Test plan
- [ ] CI check appears and passes on this PR

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 5: Verify the CI run passes on the PR**

Run: `gh pr checks --watch`
Expected: the `ci` job passes. Report the PR URL to the user. **This PR must merge before sub-project 3 starts.**

---

## Sub-project 3: Vitest foundation

All tasks below happen on one branch created in Task 7, after the CI PR has merged. Tests are colocated next to the code they test. Use explicit imports from `vitest` (no globals) so `next build` type-checking stays happy.

### Task 6: Create the Linear issue for the testing foundation

- [ ] **Step 1: Create the issue (credentials loaded as in Task 4)**

```bash
export $(grep -E '^LINEAR_(API_KEY|TEAM_ID)=' .env | xargs)
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"mutation(\$input: IssueCreateInput!) { issueCreate(input: \$input) { issue { identifier url } } }\", \"variables\": {\"input\": {\"teamId\": \"$LINEAR_TEAM_ID\", \"title\": \"Add Vitest testing foundation for pure logic\", \"description\": \"Install Vitest; add tests for the rate limiter, getStationCodes, and the three API route handlers with the NS API mocked. Add npm test to the CI workflow. Pure logic only — no DOM/component tooling.\"}}}"
```

Expected: JSON containing `"identifier": "PRO-<N>"`. Referenced as `PRO-<TEST>` below. All commit message bodies in Tasks 7–13 include `PRO-<TEST>`.

### Task 7: Vitest setup + getStationCodes tests

`getStationCodes` (app/_utils/api.tsx:6) wraps the NS stations endpoint: maps `payload[]` to `IStation`, returns `[]` on non-ok responses and on thrown fetch errors.

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (add test script, add vitest devDependency)
- Test: `app/_utils/api.test.ts`

- [ ] **Step 1: Create branch and install Vitest**

```bash
git checkout master && git pull
git checkout -b julianaijal/pro-<TEST>-vitest-foundation
npm install -D vitest
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
});
```

- [ ] **Step 3: Add the test script to `package.json`**

In the `scripts` block, after `"lint": "eslint"`, add:

```json
"test": "vitest run"
```

- [ ] **Step 4: Write the failing tests**

Create `app/_utils/api.test.ts`:

```ts
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
```

- [ ] **Step 5: Run the tests**

Run: `npm test`
Expected: 4 tests PASS (the implementation already exists; these tests pin its behavior).

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts package.json package-lock.json app/_utils/api.test.ts
git commit -m "$(cat <<'EOF'
test: add Vitest setup and getStationCodes tests

PRO-<TEST>
EOF
)"
```

### Task 8: rateLimit tests + ESM-compatible import

`app/_lib/rateLimit.ts` currently loads lru-cache via CJS `require()`, which fails under Vitest's ESM pipeline (`require is not defined`). TDD this: the failing tests force the refactor. The module keeps a module-level cache, so each rate-limit test re-imports a fresh copy via `vi.resetModules()` + dynamic import. `vi.useFakeTimers()` fakes `Date.now()` for window-reset tests.

**Files:**
- Modify: `app/_lib/rateLimit.ts:1-6` (replace `require` with ESM import)
- Create: `types/lru-cache.d.ts`
- Test: `app/_lib/rateLimit.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `app/_lib/rateLimit.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- app/_lib/rateLimit.test.ts`
Expected: FAIL with `require is not defined` (or similar CJS-in-ESM error) when loading `rateLimit.ts`.

- [ ] **Step 3: Add a type declaration for lru-cache v5**

lru-cache 5.x ships no TypeScript types. Create `types/lru-cache.d.ts`:

```ts
declare module "lru-cache" {
  export default class LRUCache<K, V> {
    constructor(opts: { max: number });
    get(key: K): V | undefined;
    set(key: K, value: V): void;
  }
}
```

- [ ] **Step 4: Replace the require with an ESM import**

In `app/_lib/rateLimit.ts`, replace lines 1–16 (everything up to and including `const cache = ...`) with:

```ts
import LRU from "lru-cache";

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 30;

interface Entry {
  count: number;
  windowStart: number;
}

const cache = new LRU<string, Entry>({ max: 5000 });
```

The rest of the file (`rateLimit` and `getClientIp` functions) stays unchanged.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: all tests PASS (this file's 8 + Task 7's 4).

- [ ] **Step 6: Verify the production build still works with the new import**

Run: `npm run lint && npm run build`
Expected: both pass.

- [ ] **Step 7: Commit**

```bash
git add app/_lib/rateLimit.ts app/_lib/rateLimit.test.ts types/lru-cache.d.ts
git commit -m "$(cat <<'EOF'
test: add rateLimit tests; switch lru-cache to ESM import

The CJS require() broke under Vitest's ESM pipeline. Behavior unchanged.

PRO-<TEST>
EOF
)"
```

### Task 9: Stations route tests

`app/api/stations/route.ts` GET: 429 when rate-limited, `[]` for queries shorter than 2 chars, otherwise delegates to `getStationCodes`. Both dependencies are module-mocked so this tests routing logic only.

**Files:**
- Test: `app/api/stations/route.test.ts`

- [ ] **Step 1: Write the tests**

Create `app/api/stations/route.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests**

Run: `npm test -- app/api/stations/route.test.ts`
Expected: 3 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add app/api/stations/route.test.ts
git commit -m "$(cat <<'EOF'
test: add stations route handler tests

PRO-<TEST>
EOF
)"
```

### Task 10: Departures route tests

`app/api/departures/[code]/route.ts` GET: validates the station code against `/^[A-Z0-9]{2,7}$/` (400 on failure), maps NS departures to `IDeparture` (delay minutes, track change detection), passes through non-ok status with `[]`, returns 500 `[]` on fetch errors. `params` is a Promise in Next 16. Rate limiting is module-mocked; the NS API is a stubbed global fetch.

**Files:**
- Test: `app/api/departures/[code]/route.test.ts`

- [ ] **Step 1: Write the tests**

Create `app/api/departures/[code]/route.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests**

Run: `npm test -- "app/api/departures/[code]/route.test.ts"`
Expected: 5 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add "app/api/departures/[code]/route.test.ts"
git commit -m "$(cat <<'EOF'
test: add departures route handler tests

PRO-<TEST>
EOF
)"
```

### Task 11: Disruptions route tests

`app/api/disruptions/route.ts` GET: returns NS payload on success, falls back to `generateDisruptions()` mock data on non-ok responses and fetch errors. The mock module is replaced with a sentinel so the test doesn't depend on the mock generator's shape.

**Files:**
- Test: `app/api/disruptions/route.test.ts`

- [ ] **Step 1: Write the tests**

Create `app/api/disruptions/route.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the full suite**

Run: `npm test`
Expected: all tests PASS (4 + 8 + 3 + 5 + 3 = 23).

- [ ] **Step 3: Commit**

```bash
git add app/api/disruptions/route.test.ts
git commit -m "$(cat <<'EOF'
test: add disruptions route handler tests

PRO-<TEST>
EOF
)"
```

### Task 12: Add the test step to CI

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Add `npm test` between lint and build**

In `.github/workflows/ci.yml`, change:

```yaml
      - run: npm run lint
      - run: npm run build
```

to:

```yaml
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

- [ ] **Step 2: Verify locally**

Run: `npm run lint && npm test && npm run build`
Expected: all three pass.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "$(cat <<'EOF'
ci: run vitest in the CI workflow

PRO-<TEST>
EOF
)"
```

### Task 13: Open the Vitest PR

- [ ] **Step 1: Push and create the PR**

```bash
git push -u origin julianaijal/pro-<TEST>-vitest-foundation
gh pr create --title "test: add Vitest foundation for pure logic" --body "$(cat <<'EOF'
## Summary
- Vitest setup (node environment, explicit imports, `npm test`)
- Tests: rate limiter (window, per-IP, reset), getStationCodes, and all three API route handlers with the NS API mocked
- lru-cache loaded via ESM import instead of require() (behavior unchanged; needed for Vitest)
- CI workflow now runs the test suite

Fixes PRO-<TEST>

## Test plan
- [ ] CI passes on this PR (lint, test, build)
- [ ] Deployed preview behaves identically (rate limiting, departures, search)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 2: Verify CI passes on the PR**

Run: `gh pr checks --watch`
Expected: the `ci` job (now including `npm test`) passes. Report the PR URL to the user.
