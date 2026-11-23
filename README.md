This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Interest signups

`/interested/` posts to `POST /api/interest` on the Cloudflare Worker `hack-sw-website`. Rows go into the D1 database `exehacks-interest` (`fca01d5a-1608-4881-a6a0-3a9af696b6b2`). Sponsor enquiries post to `POST /api/sponsor` and land in the same database. The live site is https://exehacks.excs.uk, served by that Worker: `/api/*` and `/admin*` run Worker code, and every other path is the static export in `./out`. GitHub Pages is disabled on this repo.

Deploy from the **Exeter Computer Science Society** Cloudflare account. A login on the wrong Cloudflare account (id `d058c8ec4c5caeadbd55cf293f3d2d32`) would publish `hack-sw-website` there. `wrangler whoami` must show EXCS. Set `CLOUDFLARE_ACCOUNT_ID` to the EXCS account, or let the **Deploy to Cloudflare (EXCS)** GitHub Action (`.github/workflows/cloudflare.yml`) do it. That Action runs on every push to `main`, and can also be started by hand. It uses the org secrets `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`. It builds the static export, applies D1 migrations to the remote database, and deploys the Worker.

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

## Sponsor enquiries

`/sponsor/` and the Sponsor section on the home page post to `POST /api/sponsor`. Each enquiry is a row in `sponsor_enquiries` (`migrations/0005_sponsor_enquiries.sql`): name, email, organisation (`company`), interest (`track`, `workshop`, `booth`, `judging` or `general`) and the note (`message`). A hidden honeypot field (`hp_website`) returns success and stores nothing. The same email, organisation, interest and note is stored once and still returns `200`. A sixth new enquiry from the same email within an hour returns `429`.

The Worker then emails the sponsorship inbox. `wrangler.jsonc` declares a `send_email` binding named `SPONSOR_EMAIL` with no `destination_address`. `sponsors@exehacks.excs.uk` is an Email Routing forward rule on the `exehacks.excs.uk` zone, not a verified destination address, so it cannot be fixed on the binding. The message is sent to the Worker secret `SPONSOR_NOTIFY_EMAIL` when that value is a valid address, and otherwise to `sponsors@exehacks.excs.uk`. The from address is `sponsors@exehacks.excs.uk` and the reply-to is the enquirer's email. The row is inserted first. If the send fails, the error is logged and the API still returns success.

Email Routing accepts Worker sends to verified destination addresses until the zone is onboarded for Email Sending. If a send to `sponsors@exehacks.excs.uk` is rejected for that reason, set the secret to the verified destination the forward rule already uses. That address must already be verified in Email Routing. Do not commit it, and do not put a personal mailbox in the repo or in `wrangler.jsonc`.

```bash
npx wrangler secret put SPONSOR_NOTIFY_EMAIL
```

Leave the secret unset to try `sponsors@exehacks.excs.uk`. `wrangler dev` simulates the binding and writes the message to the log instead of sending it.

`/admin/` lists these rows newest first, with an interest filter, behind the same Cloudflare Access check as the other tables.

```bash
npx wrangler d1 migrations apply exehacks-interest --local
npm test
npm run build
npx wrangler dev --var LOCAL_ADMIN:1
```

`LOCAL_ADMIN=1` signs in `/admin` only for a loopback host when the request has no `CF-Ray` header (wrangler dev). It is not set in `wrangler.jsonc`. Production admin still requires Cloudflare Access.

## The homepage desktop

On screens 1024px and wider the homepage is one screen that does not scroll. The desktop icons open windows. A window drags by its title bar, comes to the front when clicked, and has minimise and close buttons. The taskbar lists the open windows. A long window scrolls inside itself. A link such as `/#faq` opens that window. Below 1024px, and without JavaScript, the same windows stack down a scrolling page.

- `app/components/chrome/windows.js` lists every window: its id, title, desktop icon, and where it starts. Add a window there, then add a `<DeskWindow id="...">` with its content in `app/page.js`.
- `app/components/chrome/Desktop.jsx` is the window manager (open, minimise, close, z-order, dragging, Escape, deep links).
- `app/components/chrome/BootScreen.jsx` is the boot intro. It lasts about 0.8 seconds, plays once per browser tab (`sessionStorage`), ends on any click or key, and does not play at all with `prefers-reduced-motion`. The desktop is already rendered underneath it.
- The layout rules are under "desktop layout" in `app/exehacks.css`.

## Where Register points

Every Register button (taskbar, More menu, the setup window, `register.exe`) reads one constant: `REGISTER_URL` in `app/config.js`.

- Empty (the default): the buttons open the on-site interest form at `/interested/`, which posts to D1 as described above.
- A full `https://` URL, such as the Tito event page: the buttons open that page in a new tab, and the short lines of copy next to them change to match.

Set it either by pasting the URL between the quotes in `app/config.js`, or by setting `NEXT_PUBLIC_REGISTER_URL` when `next build` runs. The value is inlined at build time. The deploy workflow does not pass `NEXT_PUBLIC_REGISTER_URL` to the build today, so for production either edit the constant, or add the variable to the build step in `.github/workflows/cloudflare.yml`.

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

`/admin/` lists every D1 table (newest first, with search and a CSV download). `sponsor_enquiries` has an interest filter. `team_applications` and `hacker_applications` have filter dropdowns (hackers: status, level of study, university, experience, team status, heard from), and the CSV download respects the current search and filters. Future tables, such as registrations, show up without a new page. The CSV link is `/api/admin/tables/<name>.csv`. The bearer export above stays available for scripts.

Put a Cloudflare Access application in front of `exehacks.excs.uk/admin*` and `exehacks.excs.uk/api/admin*`, and allow `kazybekkhairulla@gmail.com`. The Worker still checks the `Cf-Access-Jwt-Assertion` JWT:

- `ACCESS_TEAM_DOMAIN` — team hostname, with or without `https://`
- `ACCESS_AUD` — the Access application's audience (AUD) tag
- `ADMIN_EMAILS` — optional comma-separated allow-list. The default in `wrangler.jsonc` is `kazybekkhairulla@gmail.com`. A non-empty value replaces that default.

Missing Access configuration, a missing JWT, or a bad JWT returns `401`. A valid JWT for an email that is not on the list returns `403`.

### Hackathon Organiser guide

`/admin/handover/` is the handover guide. The text lives in `worker/handover.md` (headings, lists, tables, links). The Worker bundles that file and serves HTML from `GET /api/admin/handover`. It is not part of the static export in `out/`, and the public site never receives the file.

Reading it needs everything `/admin` needs, plus the Hackathon Organiser role:

- `ORGANISER_EMAILS` is a comma-separated list of emails, compared case-insensitively with the email in the Access JWT. Spaces around commas are fine. One or more addresses replace the default entirely, so include every organiser who should keep access. If the variable is missing, blank, or has no email addresses, the Worker uses the default in `worker/organiser.js`. The same default is set in `wrangler.jsonc`: `kazybekkhairulla@gmail.com,kk598@exeter.ac.uk`.
- That address must already be allowed by Cloudflare Access and by `ADMIN_EMAILS`. Another admin gets `403`. Missing or bad sign-in still gets `401`.
- The Worker does not trust the `Cf-Access-Authenticated-User-Email` header on its own. It reads the email from the verified JWT (`Cf-Access-Jwt-Assertion` or the `CF_Authorization` cookie).

The link on `/admin/` is shown only when `GET /api/admin/session` says the signed-in admin is an organiser.

To preview the guide on your machine without Access, leave `ACCESS_TEAM_DOMAIN` unset and set `ORGANISER_DEV_EMAIL` in gitignored `.dev.vars` to an address on the organiser list. That bypass runs only for `localhost` or `127.0.0.1`. Do not set `ORGANISER_DEV_EMAIL` in `wrangler.jsonc` or on the deployed Worker. A real admin preview still needs `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` in `.dev.vars`.

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
