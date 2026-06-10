# Git
- Always make small, atomic commits — one logical change per commit.

# Linear
- Team: **Product**, identifier prefix: `PRO`
- API key en team ID staan in `.env` als `LINEAR_API_KEY` en `LINEAR_TEAM_ID` — gebruik deze om proactief issues aan te maken via de GraphQL API (`https://api.linear.app/graphql`)
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
