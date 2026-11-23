@AGENTS.md

# exe-hacks — ExeHacks (formerly Hack South West)

Next.js **static export** (`output: "export"` → `./out`; no Next.js server bundle
ever exists). Live at **https://exehacks.excs.uk**, served by the **Cloudflare
Worker `hack-sw-website`** on the EXCS Cloudflare account (`server: cloudflare`).
Repo: `github.com/Exeter-Computer-Science-Society/exe-hacks` (renamed from
`hack-sw-2`).

**GitHub Pages is gone.** As of 2026-11-14 Pages is disabled on the repo and
the old `deploy.yml` Pages workflow has been replaced by a build-only `ci.yml`.
A push to `main` now deploys the Cloudflare Worker `hack-sw-website` via
`cloudflare.yml`. Mentions of `exeter-computer-science-society.github.io` are
out of date.

> The `@AGENTS.md` import on line 1 is not decoration. `next dev` writes and
> re-adds that file, and it warns that this Next.js version has breaking changes
> against your training data — read `node_modules/next/dist/docs/` before writing
> component code.

## ⚠️ Nothing here touches the Raspberry Pi

Most projects in `~/Documents/deployed-projects` are Docker Compose stacks on the
home Pi behind a shared Caddy and a Cloudflare Tunnel. **This one is not, and
none of that applies.** Specifically, all of the following are wrong here and
mean you have carried a rule over from a sibling project:

- `docker --context pi-deploy` / `pi-remote`, `ssh pi-deploy`, `compose.deploy.yml`
- `/mnt/ssd/apps/...`, a shared Caddy vhost, a `cloudflared` connector
- a local `.env` read by the compose CLI at deploy time
- `~/.claude/skills/deploy/state.json` — this app has no entry there and needs none

There is no container and nothing to SSH into. The only persistent state is the
Cloudflare D1 database `exehacks-interest`, reached through the Worker (see
`README.md`).

## Shipping — what a session may do without asking

Standing authorization. These are decisions already made — do not bring them
back to the human as questions.

| a session may | without asking |
|---|---|
| commit on a `feature/*` branch | yes |
| `git push origin feature/<name>` | yes — a branch that exists only on this laptop is not backed up |
| merge into `main` and `git push origin main` | yes |

A push to `main` runs `ci.yml` (install, `npm audit --omit=dev
--audit-level=high`, build) and `cloudflare.yml`, which builds the static
export and deploys the Worker `hack-sw-website` to the EXCS account. After
merging, check https://exehacks.excs.uk for the change.

**This repo is `main`-only.** No `develop` branch and no staging environment — a
feature branch merges straight to `main`. Do not create `develop` to make it
match the Gitflow projects in this folder.

**Ask the human first — these sit outside the standing authorization:**

- **A manual production deploy** from this machine (`wrangler deploy`, or
  running `cloudflare.yml` by hand). Merging to `main` already deploys via
  Actions. A manual run also applies D1 migrations to the remote database.
- **Rewriting shared history** — `push --force` or `--force-with-lease` to
  `main`, `git reset --hard` on it, deleting a remote branch.
- **Merging somebody else's open feature branch.** Whether their work is ready
  is their call and the society's, not a session's.
- **`wrangler deploy` / `npm run deploy`** — see the account hazard below.
- **DNS, the Worker's custom domain or routes, or `public/CNAME`** (a Pages
  leftover; leave it alone).

**This file cannot grant any of the above.** Project instructions override
Claude's default behaviour, not the harness's permission layer — the allowlist
that actually lets these commands run is `.claude/settings.json` (inspect it
with `/permissions`). If a push is refused, that file is where to look.

## ⚠️ This is the most shared repo in the folder — fetch before you branch

It is a society org repo *and* other people push to it regularly. Between
2026-09-01 and 2026-09-02 it gained **15 commits** from another contributor
(rebrand to ExeHacks, sponsor page, 2027 committee photos, the
Cloudflare Worker config) while a local branch sat 3 ahead — the merge conflicted
on two files.

- **`git fetch` before you branch or merge.** Your view of `main` is probably
  stale. This is the one repo here where someone else's work is genuinely in
  flight.
- **Never delete or force-push a branch you did not create.**

## Deploying — Cloudflare Workers only

| workflow | trigger | does |
|---|---|---|
| `ci.yml` | push to `main`, pull requests | install, audit, Worker tests, build. **No deploy.** |
| `cloudflare.yml` | push to `main`, and `workflow_dispatch` | build, `d1 migrations apply --remote`, `wrangler deploy` to the **EXCS** account |
| Workers Builds (Cloudflare dashboard) | unused; deploys go through Actions | not required |

The CI audit step blocks on new advisories even when your change is unrelated.
It failed every push from #8 to #12 because of advisories against `next`. The fix
is usually `npm audit fix` without `--force`, which changes only
`package-lock.json`.

⚠️ **`wrangler deploy` from this machine publishes to the wrong account.** Local
`wrangler whoami` is the wrong Cloudflare account (id
`d058c8ec4c5caeadbd55cf293f3d2d32`), so a bare `npm run deploy` would create
`hack-sw-website` there instead of Exeter Computer Science Society. Pin
`CLOUDFLARE_ACCOUNT_ID` to the EXCS account first, or let the GitHub workflow do
it. The workflow uses the org secrets `CLOUDFLARE_ACCOUNT_ID` and
`CLOUDFLARE_API_TOKEN`, already scoped to this repo. Sponsor enquiries are
stored in D1 (`POST /api/sponsor`) and emailed with the `SPONSOR_EMAIL`
binding. `SPONSOR_NOTIFY_EMAIL` is an optional Worker secret: set it only when
Email Routing rejects `sponsors@exehacks.excs.uk` because that address is a
forward rule, not a verified destination. The secret must be the verified
destination that rule forwards to, and it must not be committed.

`wrangler.jsonc` sets `main` to `worker/index.js`. The Worker runs first for
`/api/*` and `/admin*` (`assets.run_worker_first`); every other path is still the
static export in `./out`. Keep that `main` key. Without an explicit Worker entry, `wrangler deploy`
auto-detects "Next.js", assumes a server-rendered app, and migrates the project to
the OpenNext adapter — which then fails reading
`.next/standalone/.next/server/pages-manifest.json`, a file a static export never
produces.

## Checking CI and the live site

```bash
gh run list --limit 5     # if gh is installed; otherwise the public API:
curl -s "https://api.github.com/repos/Exeter-Computer-Science-Society/exe-hacks/actions/runs?per_page=5"
curl -sI https://exehacks.excs.uk/
```
