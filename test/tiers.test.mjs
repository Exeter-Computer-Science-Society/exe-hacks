// Two tiers: the whole team gets the Command Centre (tracker and aggregate counts);
// only reviewers get applicant personal data. Checked on both sign-in paths.
import assert from "node:assert/strict"
import { after, before, test } from "node:test"

import { SESSION_COOKIE, sign } from "../worker/discord-auth.js"
import worker from "../worker/index.js"
import { createDb } from "./d1-shim.mjs"

const TEAM = "excs.cloudflareaccess.com"
const AUD = "aud"
const SECRET = "s".repeat(40)
const ORIGIN = "https://exehacks.excs.uk"
const KAZY = "kazybekkhairulla@gmail.com"
let keys
let realFetch

before(async () => {
	keys = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"])
	const jwk = await crypto.subtle.exportKey("jwk", keys.publicKey)
	realFetch = globalThis.fetch
	globalThis.fetch = async (url) => {
		if (String(url) === `https://${TEAM}/cdn-cgi/access/certs`) return Response.json({ keys: [{ ...jwk, kid: "k1" }] })
		throw new Error(`unexpected fetch ${url}`)
	}
})

after(() => {
	globalThis.fetch = realFetch
})

const b64 = (value) => Buffer.from(JSON.stringify(value)).toString("base64url")
async function accessJwt(email) {
	const now = Math.floor(Date.now() / 1000)
	const head = b64({ alg: "RS256", kid: "k1" })
	const body = b64({ iss: `https://${TEAM}`, aud: [AUD], exp: now + 600, email })
	const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", keys.privateKey, new TextEncoder().encode(`${head}.${body}`))
	return `${head}.${body}.${Buffer.from(sig).toString("base64url")}`
}
const discordSession = (sub, extra = {}) => sign({ sub, name: "user", via: "id", exp: Math.floor(Date.now() / 1000) + 600, ...extra }, SECRET)

function env(overrides = {}) {
	const db = createDb()
	db.sqlite.exec(`INSERT INTO hacker_applications (first_name, last_name, email, age, school, level_of_study, course, graduation_year, country, tshirt_size, hackathons_attended, experience_level, team_status, why, heard_from, mlh_code_of_conduct, mlh_data_sharing, privacy_consent)
		VALUES ('Ada', 'Lovelace', 'ada@example.com', '20', 'Exeter', 'Undergraduate', 'CS', 2027, 'United Kingdom', 'M', '0', 'beginner', 'solo', 'why', 'Friend', 1, 1, 1)`)
	return {
		DB: db,
		ASSETS: { fetch: async () => new Response("shell") },
		ACCESS_TEAM_DOMAIN: TEAM,
		ACCESS_AUD: AUD,
		ADMIN_EMAILS: KAZY,
		ADMIN_TEAM_EMAILS: "piran@example.com, rose@example.com",
		DISCORD_CLIENT_ID: "111111111111111111",
		DISCORD_CLIENT_SECRET: "x",
		SESSION_SECRET: SECRET,
		DISCORD_ADMIN_IDS: "300000000000000000",
		...overrides,
	}
}

const PERSONAL_GET = [
	"/api/X/tables",
	"/api/X/tables/hacker_applications",
	"/api/X/tables/hacker_applications.csv",
	"/api/X/applications",
	"/api/X/applications.csv",
	"/api/X/applications/1",
	"/api/X/email-templates",
]
const PERSONAL_WRITE = [
	["/api/X/applications/1", "PATCH", { status: "accepted" }],
	["/api/X/applications/1/screen", "POST", null],
	["/api/X/applications/1/checkin", "POST", { checked_in: true }],
	["/api/X/email-templates/accepted", "PUT", { subject: "a", body: "b" }],
]

async function expectTier(e, headers, prefix, reviewer) {
	const api = prefix === "/team" ? "/api/team" : "/api/admin"
	const go = (path, init = {}) => worker.fetch(new Request(`${ORIGIN}${path}`, { ...init, headers: { ...headers, ...(init.headers || {}) } }), e)

	const me = await (await go(`${api}/me`)).json()
	assert.equal(me.reviewer, reviewer)
	const overview = await go(`${api}/overview`)
	assert.equal(overview.status, 200)
	const body = await overview.json()
	assert.equal(body.counts.hackers.total, 1)
	assert.equal(JSON.stringify(body).includes("ada@example.com"), false)
	assert.equal((await go(`${prefix}/`)).status, 200)

	const want = reviewer ? [200, 503] : [403]
	for (const path of PERSONAL_GET) {
		const response = await go(path.replace("/api/X", api))
		assert.ok(want.includes(response.status), `${path} gave ${response.status}`)
		if (!reviewer) assert.equal((await response.text()).includes("ada@example.com"), false)
	}
	for (const [path, method, data] of PERSONAL_WRITE) {
		const response = await go(path.replace("/api/X", api), {
			method,
			headers: { origin: ORIGIN, ...(data ? { "content-type": "application/json" } : {}) },
			body: data ? JSON.stringify(data) : undefined,
		})
		// 503 is the screener with no Workers AI binding.
		assert.ok(want.includes(response.status), `${method} ${path} gave ${response.status}`)
	}
	for (const page of ["applications", "checkin", "signups"]) {
		const response = await go(`${prefix}/${page}/`)
		assert.equal(response.status, reviewer ? 200 : 403, `${prefix}/${page}/`)
	}
	if (!reviewer) {
		const row = e.DB.sqlite.prepare("SELECT status FROM hacker_applications WHERE id = 1").get()
		assert.equal(row.status, "pending")
	}
}

test("email path: a team member is not a reviewer when REVIEWER_EMAILS is unset", async () => {
	const e = env()
	await expectTier(e, { "Cf-Access-Jwt-Assertion": await accessJwt("piran@example.com") }, "/admin", false)
})

test("email path: Kazy is always a reviewer, even with no lists set", async () => {
	const e = env({ ADMIN_EMAILS: "", ADMIN_TEAM_EMAILS: "", REVIEWER_EMAILS: "" })
	await expectTier(e, { "Cf-Access-Jwt-Assertion": await accessJwt(KAZY) }, "/admin", true)
})

test("email path: REVIEWER_EMAILS adds reviewers, others stay team", async () => {
	const e = env({ REVIEWER_EMAILS: "Rose@example.com" })
	await expectTier(e, { "Cf-Access-Jwt-Assertion": await accessJwt("rose@example.com") }, "/admin", true)
	await expectTier(env({ REVIEWER_EMAILS: "rose@example.com" }), { "Cf-Access-Jwt-Assertion": await accessJwt("piran@example.com") }, "/admin", false)
})

test("email path: a stranger gets nothing", async () => {
	const response = await worker.fetch(new Request(`${ORIGIN}/api/admin/overview`, { headers: { "Cf-Access-Jwt-Assertion": await accessJwt("x@example.com") } }), env())
	assert.equal(response.status, 403)
})

test("Discord path: team ID is not a reviewer (fail closed)", async () => {
	const cookie = `${SESSION_COOKIE}=${await discordSession("300000000000000000")}`
	await expectTier(env(), { cookie }, "/team", false)
})

test("Discord path: DISCORD_REVIEWER_IDS makes a reviewer, checked live", async () => {
	const cookie = `${SESSION_COOKIE}=${await discordSession("400000000000000000")}`
	await expectTier(env({ DISCORD_REVIEWER_IDS: "400000000000000000" }), { cookie }, "/team", true)
	// Off the reviewer list (and not on the team list): no longer allowed in at all.
	const gone = await worker.fetch(new Request(`${ORIGIN}/api/team/applications`, { headers: { cookie } }), env())
	assert.equal(gone.status, 401)
	// Moved to the team list only: team tier straight away.
	await expectTier(env({ DISCORD_ADMIN_IDS: "400000000000000000" }), { cookie }, "/team", false)
})

test("Discord path: reviewer role from sign-in counts only while the role list is set", async () => {
	const roleEnv = { DISCORD_ADMIN_IDS: "", DISCORD_GUILD_ID: "500000000000000000", DISCORD_REVIEWER_ROLE_IDS: "600000000000000000", DISCORD_ADMIN_ROLE_IDS: "700000000000000000" }
	const reviewerCookie = `${SESSION_COOKIE}=${await discordSession("800000000000000000", { via: "role", rr: true })}`
	await expectTier(env(roleEnv), { cookie: reviewerCookie }, "/team", true)
	const teamCookie = `${SESSION_COOKIE}=${await discordSession("900000000000000000", { via: "role", rr: false })}`
	await expectTier(env(roleEnv), { cookie: teamCookie }, "/team", false)
	await expectTier(env({ ...roleEnv, DISCORD_REVIEWER_ROLE_IDS: "" }), { cookie: reviewerCookie }, "/team", false)
})

test("Discord sign-in records a reviewer role from the server", async () => {
	const e = env({ DISCORD_ADMIN_IDS: "", DISCORD_GUILD_ID: "500000000000000000", DISCORD_REVIEWER_ROLE_IDS: "600000000000000000" })
	const start = await worker.fetch(new Request(`${ORIGIN}/auth/discord/login`), e)
	const scope = new URL(start.headers.get("location")).searchParams.get("scope")
	assert.equal(scope, "identify guilds.members.read")
	const state = new URL(start.headers.get("location")).searchParams.get("state")
	const stateCookie = start.headers.get("set-cookie").split(";")[0]
	const saved = globalThis.fetch
	globalThis.fetch = async (url) => {
		const u = String(url)
		if (u === "https://discord.com/api/oauth2/token") return Response.json({ access_token: "t" })
		if (u.startsWith("https://discord.com/api/v10/users/@me/guilds/")) return Response.json({ roles: ["600000000000000000"] })
		if (u === "https://discord.com/api/v10/users/@me") return Response.json({ id: "810000000000000000", username: "rev" })
		return saved(url)
	}
	try {
		const callback = await worker.fetch(new Request(`${ORIGIN}/auth/discord/callback?code=c&state=${state}`, { headers: { cookie: stateCookie } }), e)
		assert.equal(callback.status, 302)
		const session = callback.headers.getSetCookie().map((v) => v.split(";")[0]).find((v) => v.startsWith(`${SESSION_COOKIE}=`) && v.length > SESSION_COOKIE.length + 1)
		await expectTier(e, { cookie: session }, "/team", true)
	} finally {
		globalThis.fetch = saved
	}
})
