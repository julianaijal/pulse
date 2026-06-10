# Repo Improvements Design — Pulse (Transit)

Date: 2026-06-10
Status: Approved

## Goal

Bring the repo to a healthier baseline in three sequential sub-projects, each with its own Linear issue and PR:

1. Finish the accessibility sprint (PRO-9, PRO-10)
2. Add a CI workflow (lint + build gate on PRs)
3. Add a Vitest testing foundation for pure logic

## Context

Pulse is a Next.js 16 / React 19 transit PWA (~2,800 lines). Current state:

- Branch `julianaijal/pro-10-a11y-css` is mid-sprint: 3 of 4 PRO-10 tasks done
- PRO-9 (ARIA/keyboard, 8 tasks) is fully planned in `docs/superpowers/plans/2026-04-18-a11y-fixes.md` but not started
- No tests, no CI, no Prettier
- Uncommitted Linear-setup docs changes on the working tree (`.env.example`, `CLAUDE.md`, `README.md`)

## Sub-project 1: Finish the a11y sprint

**Housekeeping:** commit the uncommitted Linear-setup changes (`.env.example`, `CLAUDE.md`, `README.md`) plus the a11y plan doc directly to `master` as a small docs commit. These are unrelated to the PRO-10 branch.

**PRO-10 (current branch `julianaijal/pro-10-a11y-css`):** remaining work is task 4 only — push the branch and open a PR with `Fixes PRO-10` in the body.

**PRO-9:** create branch `julianaijal/pro-9-a11y-aria-keyboard` from `master` and execute the existing 8-task plan:

1. Skip link + Loader `role=status`
2. TabBar roving tabindex + `aria-controls`
3. RhythmView aria-labels + `role=alert`
4. PulseView SVG keyboard access + live regions
5. DepartureRow aria-labels
6. JourneyView stop list semantics
7. StationView outline removal + `aria-busy`
8. Push & open PR with `Fixes PRO-9`

The detailed steps live in `docs/superpowers/plans/2026-04-18-a11y-fixes.md` and are followed as written.

## Sub-project 2: CI workflow

New Linear issue. Add `.github/workflows/ci.yml`:

- Trigger: pull requests targeting `master` (plus pushes to `master`)
- Steps: checkout → setup Node 22 (matches Vercel runtime) → `npm ci` → `npm run lint` → `npm run build`
- No Prettier, no pre-commit hooks, no Dependabot (explicitly out of scope)

## Sub-project 3: Vitest foundation

New Linear issue. Scope: pure logic only — no DOM/component testing tooling.

**Setup:**

- Install `vitest` as a dev dependency with a TypeScript-aware config (`vitest.config.ts`)
- Add `"test": "vitest run"` script to `package.json`

**Test targets:**

- **Rate limiter** (`app/_lib/`): limit enforcement (30 req/min), per-IP isolation, window reset behavior
- **Utility functions** (`app/_utils/`): API client helpers and data transforms
- **API route handlers** (`app/api/departures`, `app/api/disruptions`, `app/api/stations`): success and error paths with the NS API mocked — the real NS API is never called in tests

**CI integration:** add a `npm test` step to the workflow from sub-project 2.

## Sequencing

Strictly sequential: sub-project 1 → 2 → 3. Sub-project 3's CI step depends on sub-project 2's workflow existing.

## Out of scope

- Prettier, husky/lint-staged, Dependabot/Renovate
- Component tests (React Testing Library) and E2E tests (Playwright)
- Performance profiling of PulseView
- Lighthouse/axe audit (recommended as follow-up after the a11y sprint, not part of this work)
