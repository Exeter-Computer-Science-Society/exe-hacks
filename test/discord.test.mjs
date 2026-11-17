import assert from "node:assert/strict"
import { afterEach, test } from "node:test"

import { SESSION_COOKIE, STATE_COOKIE, sign } from "../worker/discord-auth.js"
import worker from "../worker/index.js"
import { buildDigest, notifyNewApplication, postToDiscord, webhookUrl } from "../worker/notify.js"
import { createDb } from "./d1-shim.mjs"

const HOOK = "https://discord.com/api/webhooks/123456789/abc-DEF_ghi"
const SECRET = "s".repeat(40)
const realFetch = globalThis.fetch
let calls = []

function mockFetch(routes = {}) {
	calls = []
	globalThis.fetch = async (input, init = {}) => {
		const url = String(input)
		calls.push({ url, init })
		for (const [prefix, handler] of Object.entries(routes)) if (url.startsWith(prefix)) return handler(url, init)
		if (url === HOOK) return new Response(null, { status: 204 })
		throw new Error(`unexpected fetch ${url}`)
	}
}

afterEach(() => {
	globalThis.fetch = realFetch
})

const hookCalls = () => calls.filter((call) => call.url === HOOK).map((call) => JSON.parse(call.init.body))

function ctx() {
	const tasks = []
	return { waitUntil: (promise) => tasks.push(promise), done: () => Promise.all(tasks) }
}

function env(overrides = {}) {
	return {
		DB: createDb(),
		ASSETS: { fetch: async () => new Response("dashboard shell") },
		DISCORD_CLIENT_ID: "111111111111111111",
		DISCORD_CLIENT_SECRET: "client-secret",
		SESSION_SECRET: SECRET,
		DISCORD_ADMIN_IDS: "222222222222222222",
		...overrides,
	}
}

const req = (path, init = {}) => new Request(`https://exehacks.excs.uk${path}`, init)

// ---------- webhook updates ----------

test("webhook does nothing when DISCORD_WEBHOOK_URL is unset or not a Discord webhook", async () => {
	mockFetch()
	assert.equal(await postToDiscord({}, "hi"), false)
	assert.equal(await postToDiscord({ DISCORD_WEBHOOK_URL: "https://evil.example/api/webhooks/1/x" }, "hi"), false)
	assert.equal(webhookUrl({ DISCORD_WEBHOOK_URL: "http://discord.com/api/webhooks/1/x" }), "")
	assert.equal(calls.length, 0)
})

test("webhook posts with mentions switched off", async () => {
	mockFetch()
	assert.equal(await postToDiscord({ DISCORD_WEBHOOK_URL: HOOK }, "@everyone hello"), true)
	const [body] = hookCalls()
	assert.deepEqual(body.allowed_mentions, { parse: [] })
})

test("new application message is a count only", async () => {
	mockFetch()
	const e = env({ DISCORD_WEBHOOK_URL: HOOK })
	e.DB.sqlite.exec(`INSERT INTO hacker_applications (first_name, last_name, email, age, school, level_of_study, course, graduation_year, country, tshirt_size, hackathons_attended, experience_level, team_status, why, heard_from, mlh_code_of_conduct, mlh_data_sharing, privacy_consent)
		VALUES ('Ada', 'Lovelace', 'ada@example.com', '20', 'Exeter', 'Undergraduate', 'CS', 2027, 'United Kingdom', 'M', '0', 'beginner', 'solo', 'why', 'Friend', 1, 1, 1)`)
	await notifyNewApplication(e)
	const [body] = hookCalls()
	assert.equal(body.content, "New hacker application. 1 / 150 so far.")
	assert.equal(/Ada|Lovelace|ada@example/.test(body.content), false)
})

test("no webhook, no database read for new applications", async () => {
	mockFetch()
	assert.equal(await notifyNewApplication({ DB: null }), false)
})

test("marking an item Blocking posts once; other edits stay quiet", async () => {
	mockFetch()
	const session = await sign({ sub: "222222222222222222", name: "kazy", via: "id", exp: Math.floor(Date.now() / 1000) + 600 }, SECRET)
	const e = env({ DISCORD_WEBHOOK_URL: HOOK })
	const headers = { cookie: `${SESSION_COOKIE}=${session}`, "content-type": "application/json", origin: "https://exehacks.excs.uk" }

	let c = ctx()
	const created = await worker.fetch(req("/api/team/items", { method: "POST", headers, body: JSON.stringify({ section: "venue", title: "Staff rota" }) }), e, c)
	await c.done()
	const { item } = await created.json()
	assert.equal(hookCalls().length, 0)

	c = ctx()
	await worker.fetch(req(`/api/team/items/${item.id}`, { method: "PATCH", headers, body: JSON.stringify({ tone: "danger" }) }), e, c)
	await c.done()
	assert.equal(hookCalls().length, 1)
	assert.match(hookCalls()[0].content, /^Blocking in Venue: Staff rota \(marked by discord:kazy\)/)

	c = ctx()
	await worker.fetch(req(`/api/team/items/${item.id}`, { method: "PATCH", headers, body: JSON.stringify({ detail: "still blocked" }) }), e, c)
	await c.done()
	assert.equal(hookCalls().length, 1)
})

test("daily digest sums up counts and blocking items", async () => {
	const db = createDb()
	db.sqlite.exec(`INSERT INTO interest (first_name, email, consent) VALUES ('a', 'a@example.com', 1)`)
	db.sqlite.exec(`INSERT INTO command_centre_items (section, title, tone) VALUES ('venue', 'Staff rota', 'danger'), ('mlh', 'Book call', '')`)
	const digest = await buildDigest(db, Date.parse("2027-02-04T11:00:00Z"))
	assert.match(digest, /2 days to go/)
	assert.match(digest, /Hacker applications: 0 \/ 150/)
	assert.match(digest, /Interest sign-ups: 1/)
	assert.match(digest, /Open tracker items: 2, blocking: 1\n- Staff rota/)
	assert.equal(digest.includes("a@example.com"), false)
})

test("cron handler posts the digest, and does nothing without the secret", async () => {
	mockFetch()
	let c = ctx()
	await worker.scheduled({}, env({ DISCORD_WEBHOOK_URL: HOOK }), c)
	await c.done()
	assert.equal(hookCalls().length, 1)
	c = ctx()
	await worker.scheduled({}, env(), c)
	await c.done()
	assert.equal(hookCalls().length, 1)
})

// ---------- Discord sign-in ----------

function discordRoutes({ id = "222222222222222222", roles = [] } = {}) {
	return {
		"https://discord.com/api/oauth2/token": () => Response.json({ access_token: "user-token" }),
		"https://discord.com/api/v10/users/@me/guilds/": () => Response.json({ roles }),
		"https://discord.com/api/v10/users/@me": () => Response.json({ id, username: "kazy" }),
	}
}

async function signIn(e, routes) {
	const start = await worker.fetch(req("/auth/discord/login?next=/team/"), e)
	assert.equal(start.status, 302)
	const location = new URL(start.headers.get("location"))
	const state = location.searchParams.get("state")
	const stateCookie = start.headers.get("set-cookie").split(";")[0]
	mockFetch(routes)
	return worker.fetch(req(`/auth/discord/callback?code=abc&state=${state}`, { headers: { cookie: stateCookie } }), e)
}

const sessionFrom = (response) =>
	response.headers
		.getSetCookie()
		.map((value) => value.split(";")[0])
		.find((value) => value.startsWith(`${SESSION_COOKIE}=`) && value.length > SESSION_COOKIE.length + 1)

test("login redirects to Discord with state and PKCE", async () => {
	const response = await worker.fetch(req("/auth/discord/login"), env())
	const location = new URL(response.headers.get("location"))
	assert.equal(location.origin + location.pathname, "https://discord.com/oauth2/authorize")
	assert.equal(location.searchParams.get("scope"), "identify")
	assert.equal(location.searchParams.get("code_challenge_method"), "S256")
	assert.ok(location.searchParams.get("state"))
	assert.match(response.headers.get("set-cookie"), new RegExp(`^${STATE_COOKIE}=.+HttpOnly; Secure; SameSite=Lax`))
})

test("Discord sign-in off when secrets are missing", async () => {
	assert.equal((await worker.fetch(req("/auth/discord/login"), env({ SESSION_SECRET: "" }))).status, 503)
	assert.equal((await worker.fetch(req("/auth/discord/login"), env({ DISCORD_ADMIN_IDS: "" }))).status, 503)
})

test("allow-listed Discord ID gets a session that opens /team and the API", async () => {
	const e = env()
	const callback = await signIn(e, discordRoutes())
	assert.equal(callback.status, 302)
	assert.equal(callback.headers.get("location"), "/team/")
	const session = sessionFrom(callback)
	assert.ok(session)
	const page = await worker.fetch(req("/team/", { headers: { cookie: session } }), e)
	assert.equal(await page.text(), "dashboard shell")
	const overview = await worker.fetch(req("/api/team/overview", { headers: { cookie: session } }), e)
	assert.equal(overview.status, 200)
	assert.equal((await overview.json()).viewer, "discord:kazy")

	// Removing the ID from the list ends the session straight away.
	const removed = await worker.fetch(req("/api/team/overview", { headers: { cookie: session } }), { ...e, DISCORD_ADMIN_IDS: "333333333333333333" })
	assert.equal(removed.status, 401)
})

test("role in the ExeHacks server also works", async () => {
	const e = env({ DISCORD_ADMIN_IDS: "", DISCORD_GUILD_ID: "444444444444444444", DISCORD_ADMIN_ROLE_IDS: "555555555555555555" })
	const callback = await signIn(e, discordRoutes({ id: "666666666666666666", roles: ["555555555555555555"] }))
	assert.equal(callback.status, 302)
	assert.ok(sessionFrom(callback))
	assert.ok(calls.some((call) => call.url === "https://discord.com/api/v10/users/@me/guilds/444444444444444444/member"))
})

test("unknown Discord user is refused", async () => {
	const callback = await signIn(env(), discordRoutes({ id: "999999999999999999" }))
	assert.equal(callback.status, 403)
	assert.equal(sessionFrom(callback), undefined)
})

test("wrong state is refused before Discord is called", async () => {
	mockFetch()
	const response = await worker.fetch(req("/auth/discord/callback?code=abc&state=nope"), env())
	assert.equal(response.status, 400)
	assert.equal(calls.length, 0)
})

test("/team never serves the dashboard without a valid session", async () => {
	const e = env()
	const none = await worker.fetch(req("/team/"), e)
	assert.equal(none.status, 401)
	assert.match(await none.text(), /Sign in with Discord/)
	const forged = await sign({ sub: "222222222222222222", name: "x", via: "id", exp: Math.floor(Date.now() / 1000) + 600 }, "x".repeat(40))
	assert.equal((await worker.fetch(req("/team/signups/", { headers: { cookie: `${SESSION_COOKIE}=${forged}` } }), e)).status, 401)
	const expired = await sign({ sub: "222222222222222222", name: "x", via: "id", exp: 1 }, SECRET)
	assert.equal((await worker.fetch(req("/api/team/tables", { headers: { cookie: `${SESSION_COOKIE}=${expired}` } }), e)).status, 401)
	assert.equal((await worker.fetch(req("/api/team/overview"), { ...e, SESSION_SECRET: "" })).status, 401)
})
