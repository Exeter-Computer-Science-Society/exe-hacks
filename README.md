This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Interest signups

`/interested/` posts to `POST /api/interest` on the Cloudflare Worker `hack-sw-website`. Rows go into the D1 database `exehacks-interest` (`fca01d5a-1608-4881-a6a0-3a9af696b6b2`). The sponsor enquiry form still uses Formspree. The live site is https://exehacks.excs.uk, served by that Worker: `/api/*` and `/admin*` run Worker code, and every other path is the static export in `./out`. GitHub Pages is disabled on this repo.

Deploy from the **Exeter Computer Science Society** Cloudflare account. A login on the wrong Cloudflare account (id `d058c8ec4c5caeadbd55cf293f3d2d32`) would publish `hack-sw-website` there. `wrangler whoami` must show EXCS. Set `CLOUDFLARE_ACCOUNT_ID` to the EXCS account, or let the **Deploy to Cloudflare (EXCS)** GitHub Action (`.github/workflows/cloudflare.yml`) do it. That Action runs on every push to `main`, and can also be started by hand. It uses the org secrets `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`. Formspree secrets are optional: if they are missing, the Action skips publishing Formspree forms and still deploys the Worker. The sponsor form will not submit until `NEXT_PUBLIC_FORMSPREE_PROJECT_ID` is set.

```bash
npm ci
npm run build
npx wrangler d1 migrations apply exehacks-interest --remote
npx wrangler secret put EXPORT_TOKEN
npx wrangler secret put ACCESS_TEAM_DOMAIN
npx wrangler secret put ACCESS_AUD
npm run deploy
```

The D1 binding is already in `wrangler.jsonc` (`DB` → `exehacks-interest`). `migrations/0001_interest.sql` uses `CREATE TABLE IF NOT EXISTS`, so applying it is safe if the table was created by hand. Do not run `wrangler deploy` from the wrong account.

`EXPORT_TOKEN` is a Worker secret, not a Next.js variable. `wrangler secret put EXPORT_TOKEN` prompts for the value and stores it on `hack-sw-website`. Deploy does not print it back. Local `wrangler dev` reads secrets from a gitignored `.dev.vars` file:

```bash
echo 'EXPORT_TOKEN=choose-a-local-token' > .dev.vars
npx wrangler d1 migrations apply exehacks-interest --local
npm run build
npm run preview
```

Download the list with the bearer token (scripts) or from the admin page (people):

```bash
curl -fsS -H "Authorization: Bearer $EXPORT_TOKEN" \
  https://<worker-host>/api/interest/export.csv \
  -o exehacks-interest.csv
```

A missing or wrong token gets `401`. The same address can register again; the API still returns `200` and does not say whether the email was new.

## Hacker applications (/apply)

`/apply/` is the ExeHacks 2027 hacker application. It posts to `POST /api/apply`, which stores one row per email in `hacker_applications` (`migrations/0004_hacker_applications.sql`). A repeat email gets a friendly 409 and is not stored twice. New rows start with `status = 'pending'`; set `accepted`, `waitlisted`, `rejected`, `confirmed` or `declined` per acceptance wave. Allowed values for every dropdown live in `app/apply/options.js`, shared by the form and the Worker.

The form is **closed by default**. `GET /api/apply/status` returns `{ open }` from the Worker var `APPLICATIONS_OPEN` (`"false"` in `wrangler.jsonc`). While closed, `/apply/` shows "Applications open Mon 9 Nov 2026" with a link to `/interested/`, and `POST /api/apply` returns 403. `/apply/?preview=1` shows the form for checking, but submissions are still refused. To open: apply the migration remotely, set `APPLICATIONS_OPEN` to `"true"`, and redeploy.

```bash
npx wrangler d1 migrations apply exehacks-interest --remote
# local test with the form open:
npx wrangler d1 migrations apply exehacks-interest --local
npm run build && npx wrangler dev --var APPLICATIONS_OPEN:true
```

## Admin

`/admin/` is the ExeHacks 2027 Command Centre: live counts from D1 (interest sign-ups, core-team applications, hacker applications by status, days to go) plus a shared tracker (next actions, venue, MLH, judges, sponsors, core team, website, inbox, links). Anyone on the allow-list can add, edit, tick off or remove tracker items. Each edit records who made it.

- Tracker items live in the D1 table `command_centre_items` (migration `0005_command_centre.sql`), not in this repo, because the repo is public and items name real people and contacts.
- Section names, order and the event facts (dates, capacity) live in `app/admin/tracker.js`. Change them with a PR.
- The overview API returns counts only. Applicant names and emails are only on `/admin/signups/`.

`/admin/signups/` lists every D1 table (newest first, with search and a CSV download). `team_applications` and `hacker_applications` have filter dropdowns (hackers: status, level of study, university, experience, team status, heard from), and the CSV download respects the current search and filters. Future tables, such as registrations, show up without a new page. The CSV link is `/api/admin/tables/<name>.csv`. The bearer export above stays available for scripts.

Admin API: `GET /api/admin/overview`, `POST /api/admin/items`, `PATCH /api/admin/items/<id>`, `DELETE /api/admin/items/<id>`. Writes must come from the site's own origin.

Put a Cloudflare Access application in front of `exehacks.excs.uk/admin*` and `exehacks.excs.uk/api/admin*`, and allow each team member's email. The Worker still checks the `Cf-Access-Jwt-Assertion` JWT, so the pages stay closed even if Access is misconfigured:

- `ACCESS_TEAM_DOMAIN`: team hostname, with or without `https://`
- `ACCESS_AUD`: the Access application's audience (AUD) tag
- `ADMIN_EMAILS`: comma-separated allow-list in `wrangler.jsonc`. Defaults to `kazybekkhairulla@gmail.com`.
- `ADMIN_TEAM_EMAILS`: optional Worker secret, comma-separated. Added to `ADMIN_EMAILS`, so teammates' addresses never land in this public repo. Set it with `npx wrangler secret put ADMIN_TEAM_EMAILS` or in the dashboard (Worker > Settings > Variables and Secrets, type Secret).

Missing Access configuration, a missing JWT, or a bad JWT returns `401`. A valid JWT for an email that is not on either list returns `403`. `npm test` covers these cases.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
