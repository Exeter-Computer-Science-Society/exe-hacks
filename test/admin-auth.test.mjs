// The Worker must refuse /admin and /api/admin/* on its own, even if the
// Cloudflare Access app in front of it is missing or misconfigured.
import assert from "node:assert/strict"
import { after, before, test } from "node:test"

import worker from "../worker/index.js"
import { createDb } from "./d1-shim.mjs"

const TEAM = "excs.cloudflareaccess.com"
const AUD = "test-aud"
let keys
let realFetch

before(async () => {
	keys = await crypto.subtle.generateKey(
		{ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
		true,
		["sign", "verify"]
	)
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

const b64 = (value) => Buffer.from(typeof value === "string" ? value : JSON.stringify(value)).toString("base64url")

async function token(claims, privateKey = keys.privateKey) {
	const now = Math.floor(Date.now() / 1000)
	const head = b64({ alg: "RS256", kid: "k1", typ: "JWT" })
	const body = b64({ iss: `https://${TEAM}`, aud: [AUD], exp: now + 600, iat: now, ...claims })
	const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, new TextEncoder().encode(`${head}.${body}`))
	return `${head}.${body}.${Buffer.from(sig).toString("base64url")}`
}

function env(overrides = {}) {
	return {
		DB: createDb(),
		ASSETS: { fetch: async () => new Response("admin shell") },
		ACCESS_TEAM_DOMAIN: TEAM,
		ACCESS_AUD: AUD,
		ADMIN_EMAILS: "kazy@example.com",
		ADMIN_TEAM_EMAILS: "piran@example.com",
		...overrides,
	}
}

const req = (path, init = {}) => new Request(`https://exehacks.excs.uk${path}`, init)

test("no token: 401 for the page and the API", async () => {
	assert.equal((await worker.fetch(req("/admin/"), env())).status, 401)
	assert.equal((await worker.fetch(req("/api/admin/overview"), env())).status, 401)
})

test("Access not configured: 401 even with a token", async () => {
	const jwt = await token({ email: "kazy@example.com" })
	const response = await worker.fetch(req("/api/admin/overview", { headers: { "Cf-Access-Jwt-Assertion": jwt } }), env({ ACCESS_AUD: "" }))
	assert.equal(response.status, 401)
})

test("wrong audience or forged signature: 401", async () => {
	const wrongAud = await token({ email: "kazy@example.com", aud: ["other"] })
	assert.equal((await worker.fetch(req("/api/admin/overview", { headers: { "Cf-Access-Jwt-Assertion": wrongAud } }), env())).status, 401)
	const other = await crypto.subtle.generateKey(
		{ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
		true,
		["sign", "verify"]
	)
	const forged = await token({ email: "kazy@example.com" }, other.privateKey)
	assert.equal((await worker.fetch(req("/api/admin/overview", { headers: { "Cf-Access-Jwt-Assertion": forged } }), env())).status, 401)
})

test("signed in but not on the allow-list: 403", async () => {
	const jwt = await token({ email: "stranger@example.com" })
	assert.equal((await worker.fetch(req("/api/admin/overview", { headers: { "Cf-Access-Jwt-Assertion": jwt } }), env())).status, 403)
})

test("team member can read the overview and edit items", async () => {
	const e = env()
	const jwt = await token({ email: "piran@example.com" })
	const headers = { "Cf-Access-Jwt-Assertion": jwt }
	const overview = await worker.fetch(req("/api/admin/overview", { headers }), e)
	assert.equal(overview.status, 200)
	assert.equal((await overview.json()).viewer, "piran@example.com")

	const write = { ...headers, "content-type": "application/json", Origin: "https://exehacks.excs.uk" }
	const created = await worker.fetch(req("/api/admin/items", { method: "POST", headers: write, body: JSON.stringify({ section: "venue", title: "Staff rota", tone: "danger" }) }), e)
	assert.equal(created.status, 201)
	const { item } = await created.json()

	const crossSite = await worker.fetch(req(`/api/admin/items/${item.id}`, { method: "DELETE", headers: { ...headers, Origin: "https://evil.example" } }), e)
	assert.equal(crossSite.status, 403)

	const patched = await worker.fetch(req(`/api/admin/items/${item.id}`, { method: "PATCH", headers: write, body: JSON.stringify({ done: true }) }), e)
	assert.equal((await patched.json()).item.done, 1)

	const removed = await worker.fetch(req(`/api/admin/items/${item.id}`, { method: "DELETE", headers: write }), e)
	assert.equal(removed.status, 200)
})
