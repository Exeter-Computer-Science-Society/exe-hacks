This is the handover for the ExeHacks Hackathon Organiser (the EXCS Hackathon Director). It says how the event works, where things live, and what to do when you take over.

> Last reviewed November 2026, from the outgoing organiser's notes and this repo. When you change how something works, update `worker/handover.md` in the same pull request. Merge to `main` and the site deploys. This file is in the git repository, so anyone who can read the repo can read it. The website only shows the page to the Hackathon Organiser. Never put a password, token, or key in this file. Name the secret and say it is handed over privately.

On this page:

- [Overview and timeline](#overview-and-timeline)
- [Accounts and where things live](#accounts-and-where-things-live)
- [Email setup](#email-setup)
- [Website, infrastructure and deploy](#website-infrastructure-and-deploy)
- [Partners](#partners)
- [Sponsors](#sponsors)
- [Budget](#budget)
- [Operations documents](#operations-documents)
- [Handover checklist](#handover-checklist)

## Overview and timeline

ExeHacks 2027 is a 24 hour student hackathon run only by the Exeter Computer Science Society (EXCS). It is a national event with a general theme. Tracks can include AI, cloud, hardware, fintech, and security. It is not an AI-only event. Plan for about 150 hackers. Teams are at most 4 people. Submissions go on Devpost. The public site is [https://exehacks.excs.uk](https://exehacks.excs.uk).

The weekend is locked:

- Saturday 6 February 2027. Doors at the Innovation Centre, Exeter, at 09:00. Hacking starts at 11:00 UK time. The UK is on GMT that weekend, so 11:00 UK is 11:00 UTC. The countdown on the homepage uses that instant.
- Sunday 7 February 2027. The event ends at 17:00.
- Age on the application form is 18 or over on Saturday 6 February 2027. The form will not accept a younger age.

Who it is for needs a decision from you. These notes describe the audience as students and graduates within a year of graduating. The application form enforces 18+ and also offers "I'm not currently a student", and graduation years run from 2026 to 2034, so it does not enforce the one-year rule. The public FAQ says people in industry can come too. Pick one story and make the FAQ, the form, and the partner applications match.

The event used to be called Hack South West. Same society, same city, new name. The previous edition (HSW3) was 31 January to 1 February 2026, about 80 hackers, budget £1,450. The Innovation Centre closed at 22:00, hackers moved to the Forum overnight, and the building reopened at 07:30. Plan the 2027 overnight the same way until the university confirms otherwise. See [Operations documents](#operations-documents).

As of November 2026 the current Hackathon Organiser is Kazybek Khairulla, Hackathon Director for EXCS. University email `kk598@exeter.ac.uk`. The Cloudflare Access login on the admin allow-list is `kazybekkhairulla@gmail.com`. Those two addresses are the same person. The address that matters for the website is whichever one Access puts in the sign-in token.

Rough order of work from here:

1. November 2026. Interest list is open. Core-team applications are closed. Hacker applications are built but still closed (see the website section). MLH and Hackathons UK applications were submitted and updated on 17 November 2026. The team Gmail was created on 20 November 2026. Brevo "send as sponsors@" was still being set up.
2. By 8 January 2027. Sign the Hackathons UK partner agreement. Do not use their logo for 2027 before that, and not before they approve the event.
3. Before applications open. Set `APPLICATIONS_OPEN` to `true` and deploy. The advertised opening on the site is Monday 9 November 2026 at 12:00 UK time, and that clock has passed while the flag is still `false`. Opening is a deliberate change, not something the clock does by itself.
4. Saturday 6 February 2027 to Sunday 7 February 2027. The event.
5. MLH member-event applications are usually due about four months before the event. For a February weekend that means early October. This year's was updated in November. Put the deadline in the calendar for the following year as soon as you know the date.

About ten people form the core organising team. You still need a rota, risk assessments, and a run of show with a name on every block.

## Accounts and where things live

Passwords are not in this repo and they are not on this page. The outgoing organiser hands them over privately, then you change them.

| Thing | Where | Notes |
| --- | --- | --- |
| Team inbox | `exehacks.excs@gmail.com` | Shared Gmail, display name "ExeHacks Team". Created 20 November 2026 so the login can move between organisers. |
| Sponsor address | `sponsors@exehacks.excs.uk` | Public address on the website. Cloudflare Email Routing forwards it to the team Gmail. |
| Society mailbox | `excs@groups.exeterguild.com` | Outlook, via the Exeter Students' Guild. Shared. Leave mail unread so the rest of the committee still see it. Set this as the recovery address for the team Gmail. |
| Website | [exehacks.excs.uk](https://exehacks.excs.uk) | Cloudflare Worker `hack-sw-website` on the EXCS Cloudflare account. DNS is the `excs.uk` zone in that account. |
| Code | [exe-hacks](https://github.com/Exeter-Computer-Science-Society/exe-hacks) | GitHub organisation Exeter-Computer-Science-Society. Pushing `main` deploys. There is no `develop` branch and no staging site. |
| Database | D1 `exehacks-interest` | Interest signups, old core-team applications, hacker applications. Binding name `DB`. The database id is in `wrangler.jsonc`. |
| Admin | [/admin/](https://exehacks.excs.uk/admin/) | Cloudflare Access, then the Worker checks the signed-in email. |
| This guide | [/admin/handover/](https://exehacks.excs.uk/admin/handover/) | Hackathon Organiser only. Source file `worker/handover.md`. |
| Interest form | [/interested/](https://exehacks.excs.uk/interested/) | Open. Writes to D1. |
| Hacker applications | [/apply/](https://exehacks.excs.uk/apply/) | Closed until `APPLICATIONS_OPEN` is `true`. |
| Core team form | [/join/](https://exehacks.excs.uk/join/) | Closed. The Worker refuses new writes. |
| Sponsor form | [/sponsor/](https://exehacks.excs.uk/sponsor/) | Formspree. See Sponsors. |
| Devpost, LinkedIn, Instagram | Old "Hack South West" name | The public FAQ still sends people there while the rebrand settles. Get the logins in the private handover. |
| Past files | OneDrive folder "South West Hacks" | On the outgoing organiser's OneDrive. Move it. Shared Google Drive files also sit on the team account. |
| Planning notes | Notion | Original planning home. Get access or export it into the shared drive. |
| MLH | Member event application | Contact Christine Kim. Details under Partners. |
| Hackathons UK | [portal.hackathons.org.uk](https://portal.hackathons.org.uk) | Sign in with a university Microsoft account. Contacts Holly and Adam Drummond. |

Do not use `exesoc@gmail.com`. Exeter Entrepreneurs are not part of this event.

A personal Cloudflare login on this machine can be the wrong account. The account id you must not deploy to is written in `wrangler.jsonc` and `CLAUDE.md` (`d058c8ec4c5caeadbd55cf293f3d2d32`). `wrangler whoami` must show Exeter Computer Science Society. If it does not, stop. Day to day you should not deploy from a laptop at all. Merging to `main` deploys via GitHub Actions.

## Email setup

Sponsor mail goes out of the team inbox only. Never from a personal Gmail or a personal university address.

How a message moves:

1. Someone writes to `sponsors@exehacks.excs.uk` (the address on the site and in `app/config.js` as `CONTACT_EMAIL`).
2. Cloudflare Email Routing, on `exehacks.excs.uk` in the `excs.uk` zone, forwards that message to `exehacks.excs@gmail.com`.
3. You read it in the shared Gmail and reply from there.
4. To make the reply show `sponsors@` as the From address, Gmail "Send mail as" uses a free Brevo SMTP relay. The Brevo account is the team Gmail. That relay was still being set up in November 2026. The SMTP password is handed over privately. Finish the setup if send-as still fails, then send yourself a test from `sponsors@` and reply to it.
5. Recovery email for the team Gmail should be `excs@groups.exeterguild.com`, not a personal address. Otherwise the next handover depends on someone who has left.

The Guild mailbox is shared with the whole society committee. Do not mark messages read unless you were asked to deal with them. Do not delete mail.

Changing Email Routing or DNS is a production change. Do it in the EXCS Cloudflare dashboard only when you mean to, and keep the destination as the team Gmail.

Two different inboxes both matter, and they are easy to mix up:

- Human sponsor replies: team Gmail, via `sponsors@`.
- The website sponsor form, when Formspree is configured, is set in `formspree.json` to email `excs@groups.exeterguild.com`, not the team Gmail. The page copy tells the visitor it goes to `sponsors@`. As of November 2026 the Formspree secrets were not set, so the form does not submit yet. When you turn it on, decide which inbox should actually receive it and make `formspree.json`, the page copy, and Email Routing agree.

## Website, infrastructure and deploy

The site is a Next.js static export. `npm run build` writes plain files to `out/`. There is no Next.js server. Cloudflare serves those files from the Worker `hack-sw-website`. `worker/index.js` runs first for `/api/*` and `/admin*`. Every other path is a file from `out/`.

GitHub Pages is off. Ignore any old `github.io` link.

### What the admin page does

`/admin/` lists every table in the D1 database, newest first, with search and a CSV download. Filters on the CSV match what is on screen.

| Table | What it is | How it is filled |
| --- | --- | --- |
| `interest` | People who asked to be emailed when applications open. Columns include name, email, university, consent, `created_at`. | `POST /api/interest` from `/interested/`. A repeated email is still a success response and does not say whether the address was already on the list. |
| `team_applications` | Core-team applications (sponsorship, logistics, marketing and social, design, tech, volunteer coordinator, welfare, finance), plus Discord, LinkedIn, and GitHub columns. | The form is closed. `POST /api/join` is refused and does not change existing rows. |
| `hacker_applications` | One row per email for ExeHacks 2027. Status moves `pending` to `accepted`, `waitlisted`, or `rejected`, then `confirmed` or `declined`. Holds phone, dietary, and accessibility notes. | `POST /api/apply`. A second application with the same email gets a friendly refusal and is not stored twice. |

Treat those tables as confidential. They are contact details and, for hackers, dietary and access needs. Download a CSV when you need it, and do not leave it in a personal Downloads folder.

Scripts can also download the interest list with `GET /api/interest/export.csv` and `Authorization: Bearer` plus the Worker secret `EXPORT_TOKEN`. The value is handed over privately. Prefer `/admin/` for a person and the bearer token for a script. Rotate `EXPORT_TOKEN` at handover.

Hacker applications stay closed unless the Worker variable `APPLICATIONS_OPEN` is exactly `true`. While it is `false`, `/apply/` explains that applications are not open and `POST /api/apply` is refused. `/apply/?preview=1` shows the form for checking and still does not save anything. The allowed dropdown values live in `app/apply/options.js`, shared by the form and the Worker. To open applications: confirm the D1 migration has been applied (a merge to `main` does that), set `APPLICATIONS_OPEN` to `true` in `wrangler.jsonc`, and deploy.

Confirmed 2027 sponsor logos are a separate list in `app/sponsors.js`. It starts empty. Logos under "Past sponsors" and "Past partners" on the homepage are Hack South West history, edited in `app/components/General/Sponsor/index.jsx`.

### Names of secrets and variables

No values belong in git, in Slack, or in this guide. "Handed over privately" means the outgoing organiser gives you the current value in person or in a private channel, you store it in the place named below, and you rotate anything they will still know.

| Name | Where it is set | What it is for |
| --- | --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub organisation secret, scoped to this repo | Actions deploys to this Cloudflare account. It must be the EXCS account, not the other id in `wrangler.jsonc`. |
| `CLOUDFLARE_API_TOKEN` | GitHub organisation secret | Lets Actions deploy the Worker and apply D1 migrations. Rotate at handover. |
| `FORMSPREE_DEPLOY_KEY` | GitHub secret, optional | Publishes `formspree.json`. If it is missing, the deploy still succeeds and the sponsor form does not work. Missing as of November 2026. |
| `NEXT_PUBLIC_FORMSPREE_PROJECT_ID` | GitHub secret, optional | Baked into the static site at build time so the sponsor form can submit. Once set, the id is visible in the public JavaScript, because the browser has to send it. Still do not paste it into this file. Missing as of November 2026. |
| `EXPORT_TOKEN` | Worker secret (`npx wrangler secret put EXPORT_TOKEN`) | Bearer token for the interest CSV script. Rotate at handover. |
| `ACCESS_TEAM_DOMAIN` | Worker secret | Cloudflare Access team hostname, with or without `https://`. |
| `ACCESS_AUD` | Worker secret | Audience tag of the Access application that protects `/admin`. |
| `ADMIN_EMAILS` | Worker variable in `wrangler.jsonc` | Comma-separated emails allowed into `/admin` after Access. A non-empty value replaces the default `kazybekkhairulla@gmail.com`. |
| `ORGANISER_EMAILS` | Worker variable in `wrangler.jsonc` | Comma-separated Hackathon Organiser emails. See below. |
| `APPLICATIONS_OPEN` | Worker variable in `wrangler.jsonc` | `true` or `false`. Anything other than `true` keeps `/apply` closed. Currently `false`. |
| `ORGANISER_DEV_EMAIL` | Gitignored `.dev.vars` on your machine only | Local preview of this guide. Never set it on the deployed Worker. |

Deploy does not print secret values back. A push to `main` updates code and applies D1 migrations. It does not change secret values. Dashboard edits to a variable that is also in `wrangler.jsonc` can be overwritten on the next deploy, which is how `ADMIN_EMAILS` already behaves. Change the list in `wrangler.jsonc` and merge, so the file and the live Worker stay the same.

### Who can read this guide

There is no accounts table. The role is an email list checked by the Worker.

1. Cloudflare Access sits in front of `exehacks.excs.uk/admin*` and `exehacks.excs.uk/api/admin*`. The policy is currently the organiser only. A new organiser has to be added there, and the outgoing one removed, or they never reach the Worker.
2. The Worker verifies the Access JWT (`Cf-Access-Jwt-Assertion`, or the `CF_Authorization` cookie) using `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD`. It reads the email out of that token. It does not trust the `Cf-Access-Authenticated-User-Email` header by itself, because a request that is not behind Access could set that header.
3. That email must be on `ADMIN_EMAILS`, or the response is 403 ("not an admin"). No token, or a bad token, is 401.
4. For `/admin/handover` and `GET /api/admin/handover` only, the email must also be on `ORGANISER_EMAILS`. Another admin gets 403. The guide HTML is not in the static files or the public JavaScript. The link on `/admin/` appears only after the session check says you are an organiser.

`ORGANISER_EMAILS` format: `ada@exeter.ac.uk, kim@exeter.ac.uk`. Case does not matter. Spaces around commas are fine. If the variable is missing, blank, or contains no email addresses, the Worker uses the default in `worker/organiser.js` (the same two addresses as `wrangler.jsonc`). A list with at least one address replaces that default completely. When you add yourself, include every organiser who should keep access, not only the new address. The address must be the one Access uses, and it must also be on `ADMIN_EMAILS`.

### Deploy

Two GitHub workflows:

- `.github/workflows/ci.yml` runs on pull requests and on `main`. It installs, runs `npm audit --omit=dev --audit-level=high`, and builds. It does not deploy. A new high advisory can fail the check even when your change is unrelated. `npm audit fix` without `--force` is the usual repair, and it should only touch `package-lock.json`.
- `.github/workflows/cloudflare.yml` runs on a push to `main`, and can be started by hand. It publishes Formspree if `FORMSPREE_DEPLOY_KEY` is set, builds, runs `wrangler d1 migrations apply exehacks-interest --remote`, and deploys the Worker to the EXCS account.

Normal path: branch, pull request, merge to `main`, watch the Action, then look at [https://exehacks.excs.uk](https://exehacks.excs.uk). Do not run `npm run deploy` or `wrangler deploy` from a laptop unless you have just checked `wrangler whoami` is EXCS. A manual deploy also applies remote D1 migrations. That is outside the usual path. Ask before you do it.

Local preview is in `README.md`: `npm ci`, `npm run build`, `npm run preview` (`wrangler dev`). Secrets for a faithful admin preview go in gitignored `.dev.vars` (`EXPORT_TOKEN`, `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`). To read this guide on localhost without Access, leave `ACCESS_TEAM_DOMAIN` unset and set `ORGANISER_DEV_EMAIL` to an address on the organiser list. That bypass does nothing if Access is configured, and nothing when the host is not localhost. Never put `ORGANISER_DEV_EMAIL` in `wrangler.jsonc` or the Cloudflare dashboard.

`worker/index.js` must stay as the Worker entry (`main` in `wrangler.jsonc`). Without it, Wrangler assumes a server-rendered Next.js app and the deploy fails, because a static export has no server bundle.

## Partners

### Major League Hacking

MLH (Major League Hacking) member-event application: submitted, then updated on 17 November 2026 to 6 to 7 February 2027 and 150 attendees. Contact: Christine Kim at MLH. Applications are usually due about four months before the event. Tell Christine when the organiser changes.

We are not an MLH event until they say so. The application form already says that. The MLH checkboxes (code of conduct, data sharing, and an optional marketing email) follow MLH's registration wording and live in `app/apply/options.js` and `app/components/ApplyForm/index.jsx`. If the partnership does not happen, do not share applicant data with MLH. The form tells applicants the same thing.

When you are accepted, follow their branding rules and their registration fields. Until then, do not put the MLH logo on the 2027 event as if it were confirmed.

### Hackathons UK

Partner programme application: submitted 17 November 2026, with a budget of £3,000. Portal: [https://portal.hackathons.org.uk](https://portal.hackathons.org.uk), sign in with a university Microsoft account. Pre-event contact: Holly. Also Adam Drummond.

The partner agreement has to be signed by 8 January 2027. Do not use the Hackathons UK logo, and do not call 2027 a Hackathons UK event, until they have approved it and the agreement is signed.

The homepage still shows Hackathons UK under "Past partners", next to Encode Club, because they partnered when the event was Hack South West. That block is history (`app/components/General/Sponsor/index.jsx`). Leave it as history. Do not add a new 2027 logo on top.

They recommend Tito for ticketing. Tito is a paid product. Do not sign up on the society's behalf until the committee has agreed to the cost. Nothing in the current site depends on Tito. The "heard about us" list on the application includes Fixr and Luma as options, which is not the same as having an account there.

Hackathons UK and the university both need to be in the conversation about the overnight venue. See Operations documents.

## Sponsors

About thirty organisations were contacted or on the target list as of November 2026: Vercel, Nvidia, Arm, Replit, Supabase, GitHub, Twilio, Postman, Figma, Mistral, Jane Street, G-Research, Met Office, TPP, Graphcore, Deloitte, and Securious (a warm lead). Write to them from the team inbox (`sponsors@` once send-as works). Do not write from a personal address. A sponsor who replies to a personal thread is easy to lose at the next handover.

2025 cash bands, from the previous event, were £100 to £499, £500 to £999, and £1,000 and above. The website's current tier labels, in `app/sponsors.js`, are `title`, `gold`, `silver`, `bronze`, and `partner`. Say which label you are selling before you send a deck, and keep the deck, the email, and the site on the same names.

What a partner is offered on the public sponsor page: a named track and prize, a logo on the site and in the room, and a slot to talk to the teams (workshop, booth, or judging are optional).

Past sponsors still shown from Hack South West: Liminal (gold), NVIDIA (silver), Superteam Exeter (silver), Solana (bronze), Exeter CS Department (bronze), Tenzing (bronze). Past partners: Encode Club and Hackathons UK. Do not move a past logo into the 2027 list until that organisation has confirmed for this year.

To put a confirmed logo on the site:

1. Add the image under `public/sponsors/` (not `public/images/sponsors/`, which is the old Hack South West set).
2. Append an entry to `SPONSORS` in `app/sponsors.js` with `name`, `logo`, `url`, and `tier`.
3. Merge to `main`. No other code change is required. Do not add a logo before the partnership is confirmed.

The sponsor enquiry form is `/sponsor/`, Formspree form key `sponsorForm`, fields name, org, email, interest, and message. Recipient and secret status are in the email section above. Until the two Formspree GitHub secrets are set, use email rather than the form.

TPP have asked about a society-wide EXCS deal, not only an ExeHacks package. Do not agree that on your own. Take it to the EXCS committee first.

The 2025 pitch deck is in the OneDrive "South West Hacks" folder. Use it as a starting point, then replace the date, the name, and the numbers.

## Budget

Figures from November 2026. Check them against the shared budget sheet before you quote them to a partner or to the Guild. This page is not the accounts.

- Target for ExeHacks 2027: about £2,500 to £3,000.
- Available in November 2026: £1,800.
- Student Alumni Fund: planned, not confirmed on this page. Chase it and write the result into the shared budget.
- Hackathons UK application stated a £3,000 budget. If the real budget moves, tell Holly before the agreement is signed.
- HSW3 (January 2026) ran on £1,450 for about 80 hackers. 2027 is aiming at roughly twice the people, so the old budget is a floor, not a plan.
- The homepage boot screen mentions a prize pool of £500 and above. That line is for visitors. It is not the organising budget. Do not plan catering from it.

Keep the working budget in the shared drive, with the person who holds the EXCS treasurer role able to read it. The site does not store money, invoices, or card details.

## Operations documents

These files exist for Hack South West and need a 2027 version. They are in the outgoing organiser's OneDrive folder "South West Hacks", and some shared Google Drive files are already on the team account. Move the OneDrive folder to a drive the team or the society owns, so it survives the handover. Notion was the original planning space. Export anything that only lives there.

Expect to find, and to rewrite:

- Risk assessments, including the overnight move.
- Agenda and supervision schedule.
- Rota for about ten core organisers. Cover doors, overnight, welfare, and the Sunday close. Every block needs a named person and a deputy.
- Run of show (`RunOfShow.pdf` in the old files). Owners on each item, not only times. The 2027 shape is doors 09:00, hacking 11:00, end 17:00 the next day. The homepage clock matches the 11:00 start.
- Budgets.
- 2025 pitch deck.

Venue overnight is the piece that has bitten before. In 2026 the Innovation Centre closed at 22:00, hackers went to the Forum, and the Centre reopened at 07:30. For 2027, confirm with the university and with Hackathons UK whether the overnight space is the Forum or the Library, what time the Centre actually closes, and who from the team stays awake. Put the answer in the run of show and the risk assessment before you open applications, because dietary numbers, staffing, and the MLH schedule all depend on it.

Welfare and incident contacts should be on the rota, not only in someone's head. The application stores accessibility notes in `hacker_applications`. Read them before the event, with the welfare lead, and do not export that column to sponsors.

## Handover checklist

Do these in order when you take the role. Tick them off in the shared drive. This page does not store ticks.

1. Read this guide, `README.md`, and `CLAUDE.md`. Skim `wrangler.jsonc` so you know the Worker name, the database, and the variables.
2. Take the team Gmail (`exehacks.excs@gmail.com`) from the outgoing organiser, in private. Sign in, change the password, and set the recovery email to `excs@groups.exeterguild.com`.
3. Send a test message to `sponsors@exehacks.excs.uk` and confirm it lands in that Gmail. Finish Brevo "Send mail as" if it is not done. The SMTP password is handed over privately. Send a test from `sponsors@` as well.
4. Get access to the EXCS Guild mailbox. Agree to leave other people's mail unread.
5. Get the shared Google Drive and move the OneDrive "South West Hacks" folder into a drive the society or the team owns. Get Notion access, or export it into that drive. Get the Devpost, LinkedIn, and Instagram logins (still under the Hack South West name). Passwords are handed over privately, then changed.
6. Get added to the GitHub organisation Exeter-Computer-Science-Society, with access to `exe-hacks`. When the handover is finished, remove the outgoing organiser if they are leaving the project.
7. Get access to the EXCS Cloudflare account. Run `wrangler whoami` and confirm it is that account. If you see the other account id from `wrangler.jsonc`, sign out. Do not deploy.
8. Add your Access email to the Cloudflare Access policy for `exehacks.excs.uk/admin*` and `exehacks.excs.uk/api/admin*`. Remove the outgoing organiser. Sign in at [/admin/](https://exehacks.excs.uk/admin/) and confirm the tables load.
9. Put that same email on `ADMIN_EMAILS` and on `ORGANISER_EMAILS` in `wrangler.jsonc`. A non-empty `ORGANISER_EMAILS` replaces the whole list, so keep anyone who should still be an organiser. Remove the outgoing address. Merge to `main` and wait for the deploy. Then open [/admin/handover/](https://exehacks.excs.uk/admin/handover/) and confirm this page loads for you and not for any other admin.
10. Receive, store, and rotate the secrets the outgoing organiser still knows: `EXPORT_TOKEN`, `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, `CLOUDFLARE_API_TOKEN`, `FORMSPREE_DEPLOY_KEY`, the Brevo SMTP password, and the team Gmail password you already changed. Values are handed over privately. Never commit them. `CLOUDFLARE_ACCOUNT_ID` is the EXCS account id, also a GitHub secret. Confirm it, and rotate the API token rather than the account id.
11. If the sponsor form should work, set `FORMSPREE_DEPLOY_KEY` and `NEXT_PUBLIC_FORMSPREE_PROJECT_ID` (both were missing in November 2026) and decide whether Formspree writes to the Guild mailbox or the team Gmail. Send a test enquiry.
12. Email Christine Kim at MLH, and Holly and Adam Drummond at Hackathons UK, with your contact details. Sign the Hackathons UK agreement by 8 January 2027. Do not announce either partnership until it is actually confirmed.
13. Tell the EXCS committee you are the Hackathon Organiser. Take the TPP society-wide idea to them before you agree anything. Introduce yourself to the treasurer and look at the £1,800 and the Student Alumni Fund together.
14. Confirm the overnight plan (Forum or Library, closing time, who stays) with the university and Hackathons UK. Write it into the risk assessment and the run of show.
15. Copy the rota, risk assessments, and run of show forward, with named owners, for 6 to 7 February 2027. Share them from the team drive, not from a personal OneDrive.
16. Decide the public eligibility line (18+ students and recent graduates, or the wider FAQ) and make the FAQ match the form.
17. Before you hand the role on, update this file, move anything new into the shared drive, and rotate the secrets again.
