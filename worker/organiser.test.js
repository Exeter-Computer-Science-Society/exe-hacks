import assert from "node:assert/strict"
import test from "node:test"

import {
	DEFAULT_ORGANISER_EMAILS,
	ORGANISER_ONLY,
	isOrganiserEmail,
	localDevOrganiser,
	organiserAllowList,
	organiserFromAdmin,
} from "./organiser.js"

const current = "kazybekkhairulla@gmail.com"

test("defaults to the current organiser addresses", () => {
	assert.deepEqual(organiserAllowList({}), DEFAULT_ORGANISER_EMAILS.split(","))
	assert.equal(isOrganiserEmail(" KK598@exeter.ac.uk ", {}), true)
	assert.equal(isOrganiserEmail(current, {}), true)
	assert.equal(isOrganiserEmail("someone@exeter.ac.uk", {}), false)
})

test("a non-empty list replaces the default, and a blank list does not", () => {
	const env = { ORGANISER_EMAILS: " New@exeter.ac.uk, extra@exeter.ac.uk " }
	assert.deepEqual(organiserAllowList(env), ["new@exeter.ac.uk", "extra@exeter.ac.uk"])
	assert.equal(isOrganiserEmail(current, env), false)
	assert.deepEqual(organiserAllowList({ ORGANISER_EMAILS: "  ,  " }), DEFAULT_ORGANISER_EMAILS.split(","))
	assert.deepEqual(organiserAllowList({ ORGANISER_EMAILS: "" }), DEFAULT_ORGANISER_EMAILS.split(","))
})

test("admins who are not organisers are forbidden", () => {
	const env = { ORGANISER_EMAILS: current }
	assert.deepEqual(organiserFromAdmin({ ok: false, status: 401, error: "Sign in with Cloudflare Access." }, env), {
		ok: false,
		status: 401,
		error: "Sign in with Cloudflare Access.",
	})
	assert.deepEqual(organiserFromAdmin({ ok: true, email: "other-admin@exeter.ac.uk" }, env), {
		ok: false,
		status: 403,
		error: ORGANISER_ONLY,
	})
	assert.deepEqual(organiserFromAdmin({ ok: true, email: "KazybekKhairulla@Gmail.com" }, env), {
		ok: true,
		email: "KazybekKhairulla@Gmail.com",
		organiser: true,
	})
})

test("local preview bypass stays on loopback and stays off once Access is configured", () => {
	const env = { ORGANISER_DEV_EMAIL: current }
	const allow = (url) => localDevOrganiser({ url }, env)
	assert.equal(allow("http://localhost:8787/admin/handover")?.organiser, true)
	assert.equal(allow("http://127.0.0.1:8787/admin/handover")?.email, current)
	assert.equal(allow("https://exehacks.excs.uk/admin/handover"), null)
	assert.equal(allow("https://hack-sw-website.example.workers.dev/admin/handover"), null)
	assert.equal(localDevOrganiser({ url: "http://localhost/admin/handover" }, { ...env, ACCESS_TEAM_DOMAIN: "team.cloudflareaccess.com" }), null)
	assert.equal(localDevOrganiser({ url: "http://localhost/admin/handover" }, { ORGANISER_DEV_EMAIL: "intruder@exeter.ac.uk" }), null)
	assert.equal(localDevOrganiser({ url: "http://localhost/admin/handover" }, {}), null)
})
