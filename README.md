This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Interest signups

`/interested/` posts to `POST /api/interest` on the Cloudflare Worker `hack-sw-website`. Rows go into the D1 database `exehacks-interest` (`fca01d5a-1608-4881-a6a0-3a9af696b6b2`). The sponsor enquiry form still uses Formspree. GitHub Pages only serves the static export, so `/api/interest` and `/admin` exist on the Worker, not on Pages.

Deploy from the **Exeter Computer Science Society** Cloudflare account. A login on the wrong Cloudflare account (id `d058c8ec4c5caeadbd55cf293f3d2d32`) would publish `hack-sw-website` there. `wrangler whoami` must show EXCS. Set `CLOUDFLARE_ACCOUNT_ID` to the EXCS account, or run the **Deploy to Cloudflare (EXCS)** GitHub Action (`.github/workflows/cloudflare.yml`), which already uses the EXCS secrets.

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

## Admin

`/admin/` lists every D1 table (interest signups first, newest first, with search and a CSV download). Future tables, such as registrations, show up without a new page. The CSV link is `/api/admin/tables/<name>.csv`. The bearer export above stays available for scripts.

Put a Cloudflare Access application in front of `exehacks.excs.uk/admin*` and `exehacks.excs.uk/api/admin*`, and allow `kazybekkhairulla@gmail.com`. The Worker still checks the `Cf-Access-Jwt-Assertion` JWT:

- `ACCESS_TEAM_DOMAIN` — team hostname, with or without `https://`
- `ACCESS_AUD` — the Access application's audience (AUD) tag
- `ADMIN_EMAILS` — optional comma-separated allow-list. The default in `wrangler.jsonc` is `kazybekkhairulla@gmail.com`. A non-empty value replaces that default.

Missing Access configuration, a missing JWT, or a bad JWT returns `401`. A valid JWT for an email that is not on the list returns `403`.

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
