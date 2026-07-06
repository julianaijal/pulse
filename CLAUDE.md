# Git
- Always make small, atomic commits — one logical change per commit.

# CI / deploys
- `master` is protected: required checks `ci` and `lighthouse` — a PR only merges when its Vercel preview passes Lighthouse (Perf ≥ 90, A11y/BP/SEO = 100; thresholds in `lighthouserc.json`)
- The `lighthouse` workflow triggers on `deployment_status`; previews sit behind Vercel Deployment Protection — CI authenticates via the `VERCEL_AUTOMATION_BYPASS_SECRET` GitHub Actions secret (send `x-vercel-protection-bypass` + `x-vercel-set-bypass-cookie: true` when auditing previews manually)
- Production CSP in `next.config.ts` must stay unchanged; preview-only allowances (e.g. `vercel.live` for the toolbar) are keyed on `VERCEL_ENV === "preview"`
- Vercel CLI is authenticated locally and the repo is linked (`.vercel/project.json` has projectId/orgId) — use the Vercel REST API for env vars and project settings; `NS_API` targets production + preview
- Direct pushes to `master` bypass the required checks (admin bypass) — only do this for the tiny changes allowed under the Linear policy below

# Linear
- Team: **Product**, identifier prefix: `PRO`
- API key en team ID staan in `.env` als `LINEAR_API_KEY` en `LINEAR_TEAM_ID` — gebruik deze om proactief issues aan te maken via de GraphQL API (`https://api.linear.app/graphql`)
- Workflow state IDs (team Product): In Progress `cf7f41bb-2042-4d1c-98dc-7088e887c5e2`, In Review `8a623c27-bd43-4a20-8b9e-8c0d7167f736`, Done `db9ebde8-f051-4b49-bf9e-e53335d2ce31`
- GraphQL via curl: schrijf de JSON-payload naar een bestand en injecteer variabelen met `jq --arg` — inline heredocs/quoting breken op zsh-escaping (`!`) en placeholder-substitutie
- Branch format: `julianaijal/pro-{number}-{short-description}` (e.g. `julianaijal/pro-12-night-greeting`)
- Always include `Fixes PRO-{number}` in the PR body to link the PR to the Linear issue
- Always include `PRO-{number}` in the commit message body (not the title)
- Create the Linear issue **before** opening the PR, otherwise Linear misses the webhook event
- If a PR was opened before the issue existed, push an empty commit to retrigger the webhook: `git commit --allow-empty -m "chore: trigger Linear sync for PRO-{number}"`

## When to use Linear
- **Significant changes** (new feature, refactor, bug fix, design change): always create a Linear issue first, then branch → PR
- **Tiny changes** (typo, one-line tweak): direct commit to `master` is fine
- Be proactive: if work is about to start on something meaningful, suggest creating a Linear issue before writing any code

## Issue lifecycle
- Keep Linear issue state in sync with the work: move the issue to **In Progress** when starting, **In Review** when the PR opens
- After a PR merges, verify the issue landed in **Done** (the `Fixes PRO-{number}` link should do this automatically); if the webhook missed it, update the state via the GraphQL API
- When asked to "continue" or pick up work: check open PRs first, then the Linear backlog (and any plan in `docs/superpowers/plans/`) to decide what's next
