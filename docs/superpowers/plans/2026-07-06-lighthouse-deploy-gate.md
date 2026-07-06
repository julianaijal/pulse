# Lighthouse Deploy Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Block merges to `master` (and therefore production deploys) unless the Vercel preview passes Lighthouse score thresholds.

**Architecture:** A `deployment_status`-triggered GitHub Actions workflow runs `@lhci/cli autorun` against the Vercel preview URL from the event payload. Assertions live in `lighthouserc.json`. Note: GitHub only triggers `deployment_status` workflows from the file on the default branch, so the gate activates for PRs opened after this branch merges; baseline verification runs locally against this branch's preview.

**Tech Stack:** GitHub Actions, @lhci/cli 0.15.x, Vercel GitHub integration.

## Global Constraints

- Thresholds (median of 3 runs, error level): Performance ≥ 0.90; Accessibility, Best Practices, SEO = 1.0
- `is-crawlable` skipped at **collection** time (Vercel previews send `X-Robots-Tag: noindex`); never lower a category threshold to pass
- Commit messages: `PRO-30` in the body, not the title
- PR body must contain `Fixes PRO-30`
- Small atomic commits

---

### Task 1: LHCI config and workflow

**Files:**
- Create: `lighthouserc.json`
- Create: `.github/workflows/lighthouse.yml`

**Interfaces:**
- Consumes: `github.event.deployment_status.target_url` from Vercel's GitHub integration
- Produces: a `lighthouse` check on the deployed commit's SHA (visible on the PR)

- [ ] **Step 1: Create `lighthouserc.json`**

```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "settings": {
        "skipAudits": ["is-crawlable"]
      }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9, "aggregationMethod": "median-run" }],
        "categories:accessibility": ["error", { "minScore": 1, "aggregationMethod": "median-run" }],
        "categories:best-practices": ["error", { "minScore": 1, "aggregationMethod": "median-run" }],
        "categories:seo": ["error", { "minScore": 1, "aggregationMethod": "median-run" }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

The URL is intentionally not in the config — the workflow (or a local baseline run) passes it via `--collect.url`.

- [ ] **Step 2: Create `.github/workflows/lighthouse.yml`**

```yaml
name: Lighthouse

on:
  deployment_status:

jobs:
  lighthouse:
    # Only audit successful Vercel *preview* deployments (environment is
    # "Preview"); production deploy events are skipped.
    if: github.event.deployment_status.state == 'success' && startsWith(github.event.deployment.environment, 'Preview')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - name: Run Lighthouse CI
        run: npx --yes @lhci/cli@0.15.x autorun --collect.url="${{ github.event.deployment_status.target_url }}"
```

Notes: checkout resolves to the deployed commit's SHA, so the branch's own `lighthouserc.json` is used. No `npm ci` — LHCI runs standalone via npx; ubuntu-latest ships Chrome.

- [ ] **Step 3: Validate YAML and JSON parse**

Run: `node -e "JSON.parse(require('fs').readFileSync('lighthouserc.json','utf8')); console.log('json ok')" && npx --yes yaml-lint .github/workflows/lighthouse.yml || python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/lighthouse.yml')); print('yaml ok')"`
Expected: `json ok` and `yaml ok` (either linter suffices).

- [ ] **Step 4: Commit**

```bash
git add lighthouserc.json .github/workflows/lighthouse.yml
git commit -m "$(cat <<'EOF'
ci: add Lighthouse gate on Vercel preview deployments

Runs @lhci/cli against the preview URL on deployment_status; median of
3 runs must score Perf >= 90 and A11y/BP/SEO = 100. is-crawlable is
skipped at collection time because Vercel previews send noindex.

PRO-30

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Push, resolve preview URL, verify reachability

**Files:** none (operational)

**Interfaces:**
- Produces: `PREVIEW_URL` for Task 3

- [ ] **Step 1: Push the branch**

```bash
git push -u origin julianaijal/pro-30-lighthouse-gate
```

- [ ] **Step 2: Wait for the Vercel preview and capture its URL**

Poll the GitHub deployments API for this branch's head SHA until a successful Preview deployment appears (Vercel deploys every pushed branch):

```bash
SHA=$(git rev-parse HEAD)
for i in $(seq 1 30); do
  URL=$(gh api "repos/julianaijal/pulse/deployments?sha=$SHA" --jq '.[0].id' 2>/dev/null | head -1)
  if [ -n "$URL" ]; then
    DEP_ID=$URL
    STATE=$(gh api "repos/julianaijal/pulse/deployments/$DEP_ID/statuses" --jq '.[0].state')
    TARGET=$(gh api "repos/julianaijal/pulse/deployments/$DEP_ID/statuses" --jq '[.[] | select(.state=="success")][0].environment_url // empty')
    [ -n "$TARGET" ] && break
  fi
  sleep 10
done
echo "PREVIEW_URL=$TARGET"
```

Expected: a `https://…vercel.app` URL within ~5 minutes.

- [ ] **Step 3: Verify the preview is publicly reachable (no Deployment Protection wall)**

```bash
curl -s -o /dev/null -w "%{http_code}" "$TARGET"
```

Expected: `200`. If `401`/`403` or a redirect to `vercel.com/sso`: STOP — Deployment Protection is on; present options to the user (disable protection for previews, or add a `x-vercel-protection-bypass` secret) before continuing.

---

### Task 3: Baseline Lighthouse run against the preview

**Files:** possibly app fixes if baseline fails (unknown until run)

- [ ] **Step 1: Run LHCI locally against the preview**

```bash
npx --yes @lhci/cli@0.15.x autorun --collect.url="$TARGET"
```

Expected: all four assertions pass (Perf ≥ 90, A11y/BP/SEO = 100) on the median run.

- [ ] **Step 2: If assertions fail**

- Real findings in our code (missing alt text, contrast, meta description, etc.): fix on this branch in small atomic commits (`PRO-30` in body), then re-run Step 1.
- Findings caused by third-party/Vercel-injected code or preview-only artifacts: STOP and present to the user before adding any exemption. Do not lower thresholds.

---

### Task 4: Create PR and sync Linear

- [ ] **Step 1: Create the PR**

```bash
gh pr create --title "ci: Lighthouse deploy gate on Vercel previews" --body "$(cat <<'EOF'
## Summary
- New `deployment_status` workflow runs Lighthouse CI against every successful Vercel preview deployment
- Median of 3 runs must score Performance >= 90 and Accessibility/Best Practices/SEO = 100, otherwise the check fails and merge is blocked
- `is-crawlable` audit skipped at collection time (Vercel previews send `X-Robots-Tag: noindex`)

Note: GitHub only triggers `deployment_status` workflows from the default branch, so the gate activates for PRs opened after this merges. Baseline verified locally against this branch's preview.

After merge: add `lighthouse` to required status checks on `master`.

Fixes PRO-30

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 2: Move PRO-30 to In Review**

```bash
source .env && curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" -H "Authorization: $LINEAR_API_KEY" \
  --data '{"query":"mutation { issueUpdate(id: \"5484b1b3-20db-4f29-8c01-b9355e4c2092\", input: { stateId: \"8a623c27-bd43-4a20-8b9e-8c0d7167f736\" }) { success issue { identifier state { name } } } }"}'
```

Expected: `state.name == "In Review"`.

---

### Task 5 (post-merge, deferred): Enforce as required check

Run only AFTER the PR merges (adding it earlier would block the introducing PR, whose SHA never receives the check):

```bash
gh api -X PATCH "repos/julianaijal/pulse/branches/master/protection/required_status_checks" \
  -f 'contexts[]=ci' -f 'contexts[]=lighthouse' 2>/dev/null \
  || gh api -X PUT "repos/julianaijal/pulse/branches/master/protection" \
       --input - <<'EOF'
{
  "required_status_checks": { "strict": false, "contexts": ["ci", "lighthouse"] },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null
}
EOF
```

Expected: `lighthouse` listed in required status checks. Verify with:
`gh api repos/julianaijal/pulse/branches/master/protection/required_status_checks --jq '.contexts'`
