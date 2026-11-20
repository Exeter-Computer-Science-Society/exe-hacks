import assert from "node:assert/strict"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { DatabaseSync } from "node:sqlite"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

import { SPONSOR_INTERESTS } from "../app/sponsor/options.js"
import worker from "./index.js"
import { HOURLY_LIMIT, SPONSOR_INBOX } from "./sponsor.js"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

function asD1(sqlite) {
	return {
		prepare(sql) {
			const statement = sqlite.prepare(sql)
			let binds = []
			const api = {
				bind(...args) {
					binds = args
					return api
				},
				async run() {
					statement.run(...binds)
					return { success: true }
				},
				async first() {
					return statement.get(...binds) ?? null
				},
				async all() {
					return { results: statement.all(...binds) }
				},
			}
			return api
		},
	}
}

function setup() {
	const sqlite = new DatabaseSync(":memory:")
	const names = readdirSync(join(root, "migrations"))
		.filter((name) => name.endsWith(".sql"))
		.sort()
	for (const name of names) sqlite.exec(readFileSync(join(root, "migrations", name), "utf8"))
	const sent = []
	const env = {
		DB: asD1(sqlite),
		SPONSOR_EMAIL: {
			async send(message) {
				sent.push(message)
			},
		},
		SPONSOR_NOTIFY_EMAIL: "",
		LOCAL_ADMIN: "1",
	}
	return { sqlite, env, sent }
}

function enquiry(overrides = {}) {
	return {
		name: "Ada Lovelace",
		company: "Analytical Engines",
		email: "ada@example.com",
		interest: "track",
		message: "We would like a named prize track.",
		hp_website: "",
		...overrides,
	}
}

function post(body, { origin = "http://example.test", headers = {} } = {}) {
	return new Request("http://example.test/api/sponsor", {
		method: "POST",
		headers: {
			origin,
			"content-type": "application/json",
			...headers,
		},
		body: JSON.stringify(body),
	})
}

async function submit(env, body, options) {
	const response = await worker.fetch(post(body, options), env)
	let payload = null
	try {
		payload = await response.json()
	} catch {
		payload = null
	}
	return { status: response.status, payload }
}

function count(sqlite) {
	return sqlite.prepare("SELECT COUNT(*) AS count FROM sponsor_enquiries").get().count
}

function decodeMail(message) {
	const raw = message.raw
	const [headers, encoded = ""] = raw.split("\r\n\r\n")
	const text = Buffer.from(encoded.replace(/\r\n/g, ""), "base64").toString("utf8")
	return { headers, text, to: message.to, from: message.from }
}

test("stores an enquiry and emails the sponsorship inbox with reply-to", async () => {
	const { sqlite, env, sent } = setup()
	const { status, payload } = await submit(env, enquiry({ name: "José Ada", message: "A note\nwith a line break." }))
	assert.equal(status, 200)
	assert.deepEqual(payload, { ok: true })
	assert.equal(count(sqlite), 1)
	const row = sqlite.prepare("SELECT name, email, company, interest, message FROM sponsor_enquiries").get()
	assert.equal(row.name, "José Ada")
	assert.equal(row.email, "ada@example.com")
	assert.equal(row.company, "Analytical Engines")
	assert.equal(row.interest, "track")
	assert.match(row.message, /line break/)
	assert.equal(sent.length, 1)
	const mail = decodeMail(sent[0])
	assert.equal(mail.to, SPONSOR_INBOX)
	assert.equal(mail.from, SPONSOR_INBOX)
	assert.match(mail.headers, /Reply-To: ada@example.com/)
	assert.match(mail.headers, /Subject: ExeHacks sponsorship enquiry/)
	assert.match(mail.text, /José Ada/)
	assert.match(mail.text, /Named prize track/)
	assert.match(mail.text, /line break/)
})

test("uses SPONSOR_NOTIFY_EMAIL when it is a valid address", async () => {
	const { env, sent } = setup()
	env.SPONSOR_NOTIFY_EMAIL = "desk@example.com"
	const { status } = await submit(env, enquiry())
	assert.equal(status, 200)
	assert.equal(sent[0].to, "desk@example.com")
	assert.match(sent[0].raw, /Reply-To: ada@example.com/)
})

test("ignores an invalid notify address and keeps the public inbox", async () => {
	const { env, sent } = setup()
	env.SPONSOR_NOTIFY_EMAIL = "not an email"
	await submit(env, enquiry())
	assert.equal(sent[0].to, SPONSOR_INBOX)
})

test("keeps the row when email sending fails", async () => {
	const { sqlite, env } = setup()
	env.SPONSOR_EMAIL = {
		async send() {
			const error = new Error("rejected")
			error.code = "E_RECIPIENT_NOT_ALLOWED"
			throw error
		},
	}
	const { status, payload } = await submit(env, enquiry())
	assert.equal(status, 200)
	assert.deepEqual(payload, { ok: true })
	assert.equal(count(sqlite), 1)
})

test("keeps the row when the email binding is missing", async () => {
	const { sqlite, env } = setup()
	delete env.SPONSOR_EMAIL
	const { status } = await submit(env, enquiry())
	assert.equal(status, 200)
	assert.equal(count(sqlite), 1)
})

test("honeypot returns success and stores nothing", async () => {
	const { sqlite, env, sent } = setup()
	const { status, payload } = await submit(env, enquiry({ hp_website: "https://spam.example" }))
	assert.equal(status, 200)
	assert.deepEqual(payload, { ok: true })
	assert.equal(count(sqlite), 0)
	assert.equal(sent.length, 0)
})

test("rejects missing fields, a bad email, a long note and unknown interest", async () => {
	const { sqlite, env, sent } = setup()
	const missing = await submit(env, enquiry({ name: "   " }))
	assert.equal(missing.status, 400)
	assert.equal(missing.payload.field, "name")
	assert.match(missing.payload.error, /name/i)

	const email = await submit(env, enquiry({ email: "not-an-email" }))
	assert.equal(email.status, 400)
	assert.equal(email.payload.field, "email")

	const interest = await submit(env, enquiry({ interest: "prize" }))
	assert.equal(interest.status, 400)
	assert.equal(interest.payload.field, "interest")

	const note = await submit(env, enquiry({ message: "x".repeat(1001) }))
	assert.equal(note.status, 400)
	assert.equal(note.payload.field, "message")

	const control = await submit(env, enquiry({ company: "Bad\u0000Co" }))
	assert.equal(control.status, 400)
	assert.equal(count(sqlite), 0)
	assert.equal(sent.length, 0)
})

test("accepts the organisation field under its old name", async () => {
	const { sqlite, env } = setup()
	const body = enquiry()
	body.org = body.company
	delete body.company
	const { status } = await submit(env, body)
	assert.equal(status, 200)
	assert.equal(sqlite.prepare("SELECT company FROM sponsor_enquiries").get().company, "Analytical Engines")
})

test("accepts every interest value listed for the form", async () => {
	const { sqlite, env } = setup()
	for (const item of SPONSOR_INTERESTS) {
		const { status } = await submit(env, enquiry({ email: `${item.value}@example.com`, interest: item.value }))
		assert.equal(status, 200, item.value)
	}
	assert.equal(count(sqlite), SPONSOR_INTERESTS.length)
	const sql = readFileSync(join(root, "migrations/0005_sponsor_enquiries.sql"), "utf8")
	for (const item of SPONSOR_INTERESTS) assert.match(sql, new RegExp(`'${item.value}'`))
})

test("stores an identical enquiry once", async () => {
	const { sqlite, env, sent } = setup()
	const first = await submit(env, enquiry())
	const second = await submit(env, enquiry({ name: "Someone else" }))
	assert.equal(first.status, 200)
	assert.equal(second.status, 200)
	assert.equal(count(sqlite), 1)
	assert.equal(sent.length, 1)
	assert.equal(sqlite.prepare("SELECT name FROM sponsor_enquiries").get().name, "Ada Lovelace")
})

test("rate limits a burst of different enquiries from one email", async () => {
	const { sqlite, env, sent } = setup()
	for (let i = 0; i < HOURLY_LIMIT; i++) {
		const { status } = await submit(env, enquiry({ message: `Note ${i}` }))
		assert.equal(status, 200)
	}
	const blocked = await submit(env, enquiry({ message: "One more" }))
	assert.equal(blocked.status, 429)
	assert.match(blocked.payload.error, /hour/)
	assert.equal(count(sqlite), HOURLY_LIMIT)
	assert.equal(sent.length, HOURLY_LIMIT)

	sqlite.prepare("UPDATE sponsor_enquiries SET created_at = datetime('now', '-2 hours')").run()
	const later = await submit(env, enquiry({ message: "After the window" }))
	assert.equal(later.status, 200)
	assert.equal(count(sqlite), HOURLY_LIMIT + 1)
})

test("refuses the wrong method, origin and content type", async () => {
	const { env } = setup()
	const get = await worker.fetch(new Request("http://example.test/api/sponsor"), env)
	assert.equal(get.status, 405)

	const cross = await submit(env, enquiry(), { origin: "https://evil.example" })
	assert.equal(cross.status, 403)

	const plain = await worker.fetch(
		new Request("http://example.test/api/sponsor", {
			method: "POST",
			headers: { origin: "http://example.test", "content-type": "text/plain" },
			body: "hello",
		}),
		env
	)
	assert.equal(plain.status, 415)

	const huge = await submit(env, enquiry(), { headers: { "content-length": "20001" } })
	assert.equal(huge.status, 413)
})

test("admin lists sponsor enquiries newest first and can filter by interest", async () => {
	const { sqlite, env } = setup()
	await submit(env, enquiry({ email: "old@example.com", message: "Older note", interest: "booth" }))
	sqlite.prepare("UPDATE sponsor_enquiries SET created_at = datetime('now', '-2 days') WHERE email = ?").run("old@example.com")
	await submit(env, enquiry({ email: "new@example.com", message: "Newer note", interest: "workshop" }))

	const response = await worker.fetch(new Request("http://127.0.0.1/api/admin/tables/sponsor_enquiries?q=note"), env)
	assert.equal(response.status, 200)
	const body = await response.json()
	assert.equal(body.ok, true)
	assert.equal(body.count, 2)
	assert.deepEqual(
		body.rows.map((row) => row.email),
		["new@example.com", "old@example.com"]
	)
	assert.ok(body.columns.includes("company"))
	assert.ok(body.options.interests.some((item) => item.value === "workshop"))

	const filtered = await worker.fetch(
		new Request("http://127.0.0.1/api/admin/tables/sponsor_enquiries?interest=booth"),
		env
	)
	const filteredBody = await filtered.json()
	assert.equal(filteredBody.count, 1)
	assert.equal(filteredBody.rows[0].email, "old@example.com")
	assert.equal(filteredBody.filters.interest, "booth")
})

test("admin stays behind Cloudflare Access unless loopback dev mode is on", async () => {
	const { env } = setup()
	const locked = { ...env, LOCAL_ADMIN: "" }
	const denied = await worker.fetch(new Request("http://127.0.0.1/api/admin/tables/sponsor_enquiries"), locked)
	assert.equal(denied.status, 401)

	const ray = await worker.fetch(
		new Request("http://127.0.0.1/api/admin/tables/sponsor_enquiries", { headers: { "cf-ray": "abc" } }),
		env
	)
	assert.equal(ray.status, 401)

	const publicHost = await worker.fetch(new Request("https://exehacks.excs.uk/api/admin/tables/sponsor_enquiries"), env)
	assert.equal(publicHost.status, 401)
})

test("sponsor mail config does not commit a personal mailbox or Formspree", () => {
	for (const file of ["worker/sponsor.js", "migrations/0005_sponsor_enquiries.sql", "app/components/SponsorForm/index.jsx"]) {
		assert.equal(readFileSync(join(root, file), "utf8").includes("gmail.com"), false, file)
	}
	const wrangler = readFileSync(join(root, "wrangler.jsonc"), "utf8")
	assert.match(wrangler, /"name": "SPONSOR_EMAIL"/)
	assert.equal(wrangler.includes('"destination_address"'), false)
	const pkg = readFileSync(join(root, "package.json"), "utf8")
	assert.equal(pkg.toLowerCase().includes("formspree"), false)
	assert.equal(existsSync(join(root, "formspree.json")), false)
})
