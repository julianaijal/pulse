# Lighthouse Deploy Gate — Design (PRO-30)

**Goal:** Production can only deploy if the Vercel preview passes Lighthouse. Since production deploys happen on push to `master` (Vercel git integration), the gate is a required PR check: red Lighthouse → merge blocked → no production deploy.

## Decisions

| Question | Decision |
|---|---|
| Pass criteria | Category score floors (not per-audit, not regression-based) |
| Run target | Vercel preview URL (real CDN, real headers) |
| Thresholds | Performance ≥ 90; Accessibility, Best Practices, SEO = 100 |
| Wiring | GitHub Actions workflow on `deployment_status` (Approach A) |

## Architecture

Vercel's GitHub integration creates a deployment per PR push and reports its
status back to GitHub. A new workflow listens for that event — no polling, no
Vercel token:

```
PR push → Vercel builds preview → deployment_status: success (environment: Preview)
        → lighthouse.yml runs @lhci/cli autorun against target_url
        → 3 runs, assert on median → check on the PR head SHA
        → required check on master branch protection → merge/deploy gated
```

### `.github/workflows/lighthouse.yml`
- Trigger: `deployment_status`.
- Job condition: `state == 'success'` and environment is `Preview` (production
  deploy events are skipped).
- Steps: checkout → setup-node 22 (npm cache) → `npm ci` →
  `npx @lhci/cli autorun` with the URL from
  `github.event.deployment_status.target_url`.

### `lighthouserc.json` (repo root)
- `collect`: `numberOfRuns: 3`, URL injected from the workflow, and
  `settings.skipAudits: ["is-crawlable"]` — Vercel previews send
  `X-Robots-Tag: noindex`, which would cap the SEO score below 100 on every
  preview. Skipping the audit at collection time excludes it from the SEO
  category score (merely disabling its assertion would not). Production is
  unaffected.
- `assert` (`aggregationMethod: median-run`, all error level):
  - `categories:performance` ≥ 0.90
  - `categories:accessibility` = 1.0
  - `categories:best-practices` = 1.0
  - `categories:seo` = 1.0
- `upload`: `temporary-public-storage` — each run prints a shareable HTML
  report link in the CI log; no LHCI server to host.

Only `/` is audited — the app is a single view with no other user-facing routes.

## Rollout

1. **Baseline first.** Run Lighthouse against the current preview before
   enabling enforcement. Real findings get fixed on the branch; thresholds are
   not lowered. Anything outside our control (e.g. Vercel-injected scripts)
   goes back to the user before any exemption is added.
2. **Deployment Protection check.** If previews sit behind Vercel
   Authentication, Lighthouse audits the login wall instead of the app. Verify
   the preview is publicly reachable first; if protected, stop and present
   options (disable protection for previews, or a
   `x-vercel-protection-bypass` secret).
3. **Enforcement.** Add the Lighthouse job as a required status check on
   `master` branch protection via `gh api`.

## Error handling

- Workflow only fires on successful preview deploys; failed Vercel builds are
  already surfaced by the existing Vercel check.
- LHCI assertion failures fail the job with a per-assertion table plus report
  links; nothing is retried automatically beyond the 3 collection runs.

## Testing

The introducing PR is its own end-to-end test: its preview must pass the gate
before it can merge. Negative path is verified once by observing an assertion
failure during baseline/tuning (expected while iterating on the branch).

## Known limitations

- A direct push to `master` bypasses any PR gate; that is inherent to the
  Vercel git integration. Branch protection (required checks + no direct
  pushes) is the airtight version — required-check setup is in scope, blocking
  direct pushes is a repo-settings choice left to the user.
- `temporary-public-storage` report links expire after a few days; acceptable
  for a gate whose verdict lives in the check status.
