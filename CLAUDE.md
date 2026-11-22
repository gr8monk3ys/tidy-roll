# tidy-roll

## Agent skills

### Issue tracker

GitHub Issues on `gr8monk3ys/tidy-roll`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, label string equal to role name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Checks

`npm run check` from the repo root runs everything CI runs: extension tests, then mobile (lint, typecheck, dependency-cruiser, vitest) and site (typecheck, build). `npm --prefix site run e2e` runs the Playwright smoke test and needs `npx playwright install chromium` once.
