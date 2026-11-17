/**
 * ExeHacks Worker. Static pages are the asset bundle in ./out.
 * This script runs first for /api/* and /admin* (see wrangler.jsonc).
 *
 * Writes to /api/join are refused. Core-team applications are closed.
 * That route does not read or change existing team_applications rows.
 * GET /api/apply/status and POST /api/apply serve the hacker application (see apply.js).
 * Hacker applications stay closed unless the var APPLICATIONS_OPEN is "true".
 * POST /api/interest stores a row in D1. A repeated email is still 200, so the
 * response does not say whether that address was already on the list.
 * GET /api/interest/export.csv needs Authorization: Bearer $EXPORT_TOKEN.
 * /admin and /api/admin/* need a Cloudflare Access JWT for an address on
 * ADMIN_EMAILS or ADMIN_TEAM_EMAILS. /admin is the Command Centre (command-centre.js);
 * /admin/signups is the table console. /team and /api/team/* serve the same pages
 * and APIs for Discord sign-in (discord-auth.js). They are not behind Cloudflare
 * Access, so the Worker check is the only gate there.
 * Discord webhook updates (notify.js) run after the response and on the daily cron.
 */

import { authorizeAdmin } from "./access.js"
import { listTables, readTable, readTableCsv } from "./admin.js"
import { applicationsOpen, insertApplication, validateApplication } from "./apply.js"
import { createItem, deleteItem, parseItemId, readOverview, updateItem, validateItem } from "./command-centre.js"
import { discordConfig, finishLogin, logout, startLogin } from "./discord-auth.js"
import { dailyDigest, notifyBlocking, notifyNewApplication } from "./notify.js"
import { toCsv } from "./csv.js"

const LIMITS = {
	firstName: 80,
	lastName: 80,
	email: 254,
	university: 120,
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const worker = {
	async scheduled(controller, env, ctx) {
		ctx.waitUntil(dailyDigest(env))
	},

	async fetch(request, env, ctx) {
		const url = new URL(request.url)
		let path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname
		const later = (promise) => {
			const guarded = Promise.resolve(promise).catch((error) => console.error("background task failed", error instanceof Error ? error.name : "error"))
			if (ctx && typeof ctx.waitUntil === "function") ctx.waitUntil(guarded)
		}

		if (path === "/auth/discord/login") return request.method === "GET" ? startLogin(request, env) : json({ ok: false, error: "Method not allowed." }, 405)
		if (path === "/auth/discord/callback") return request.method === "GET" ? finishLogin(request, env) : json({ ok: false, error: "Method not allowed." }, 405)
		if (path === "/auth/logout") return logout()

		// /api/team/* is the same API as /api/admin/* for people who signed in with Discord.
		if (path === "/api/team" || path.startsWith("/api/team/")) path = `/api/admin${path.slice("/api/team".length)}`

		if (path === "/api/interest") {
			if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405)
			return postInterest(request, env)
		}

		if (path === "/api/join") {
			// Core-team applications are closed. Refuse the write before the body is read.
			if (request.method === "POST" || request.method === "PUT" || request.method === "PATCH" || request.method === "DELETE") {
				return json({ ok: false, closed: true, error: "Core team applications are now closed." }, 403)
			}
			return json({ ok: false, error: "Method not allowed." }, 405)
		}

		if (path === "/api/apply/status") {
			if (request.method !== "GET") return json({ ok: false, error: "Method not allowed." }, 405)
			return json({ ok: true, open: applicationsOpen(env) })
		}

		if (path === "/api/apply") {
			if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405)
			return postApply(request, env, later)
		}

		if (path === "/api/interest/export.csv") {
			if (request.method !== "GET") return json({ ok: false, error: "Method not allowed." }, 405)
			return exportCsv(request, env)
		}

		if (path === "/api/admin/tables" || path.startsWith("/api/admin/tables/")) {
			return adminApi(request, env, path)
		}

		if (path === "/api/admin/overview" || path === "/api/admin/items" || path.startsWith("/api/admin/items/")) {
			return commandCentreApi(request, env, path, later)
		}

		if (path.startsWith("/api/")) return json({ ok: false, error: "Not found." }, 404)

		if (path === "/admin" || path.startsWith("/admin/")) {
			const auth = await authorizeAdmin(request, env)
			if (!auth.ok) return html(auth.status, auth.error)
			return env.ASSETS.fetch(request)
		}

		if (path === "/team" || path.startsWith("/team/")) {
			const auth = await authorizeAdmin(request, env)
			if (!auth.ok) return signInPage(auth.status, discordConfig(env).enabled, path)
			return env.ASSETS.fetch(request)
		}

		return env.ASSETS.fetch(request)
	},
}

export default worker

async function postInterest(request, env) {
	if (!sameOrigin(request)) return json({ ok: false, error: "Forbidden." }, 403)

	const length = Number(request.headers.get("content-length") || 0)
	if (length > 10_000) return json({ ok: false, error: "Check the form and try again." }, 413)

	const parsed = await readBody(request)
	if (parsed.error === "type") return json({ ok: false, error: "Check the form and try again." }, 415)
	if (parsed.error) return json({ ok: false, error: "Check the form and try again." }, 400)

	const data = parsed.data
	if (honeypotTripped(data)) return json({ ok: true })

	const firstName = clip(field(data, "firstName", "first_name"), LIMITS.firstName)
	const lastName = clip(field(data, "lastName", "last_name"), LIMITS.lastName)
	const email = clip(field(data, "email"), LIMITS.email)
	const university = clip(field(data, "university"), LIMITS.university)

	if (!firstName.ok || !lastName.ok || !email.ok || !university.ok) {
		return json({ ok: false, error: "Check the form and try again." }, 400)
	}
	if (!firstName.value) return json({ ok: false, error: "Add your first name." }, 400)
	if (!EMAIL.test(email.value)) return json({ ok: false, error: "Add a valid email address." }, 400)
	if (!consentGiven(fieldRaw(data, "consent"))) {
		return json({ ok: false, error: "Consent is required so we can email you about ExeHacks." }, 400)
	}

	try {
		await env.DB.prepare(
			`INSERT INTO interest (first_name, last_name, email, university, consent)
			 VALUES (?, ?, ?, ?, 1)
			 ON CONFLICT(email) DO NOTHING`
		)
			.bind(firstName.value, lastName.value || null, email.value, university.value || null)
			.run()
	} catch (error) {
		console.error("interest insert failed", error instanceof Error ? error.name : "error")
		return json({ ok: false, error: "We couldn't save that. Try again in a moment." }, 500)
	}

	return json({ ok: true })
}

async function postApply(request, env, later = () => {}) {
	if (!sameOrigin(request)) return json({ ok: false, error: "Forbidden." }, 403)
	if (!applicationsOpen(env)) {
		return json({ ok: false, closed: true, error: "Applications aren't open yet. Register your interest and we'll email you when they open." }, 403)
	}
	const length = Number(request.headers.get("content-length") || 0)
	if (length > 20_000) return json({ ok: false, error: "Check the form and try again." }, 413)

	const parsed = await readBody(request)
	if (parsed.error === "type") return json({ ok: false, error: "Check the form and try again." }, 415)
	if (parsed.error) return json({ ok: false, error: "Check the form and try again." }, 400)
	const data = parsed.data
	if (honeypotTripped(data)) return json({ ok: true })

	const result = validateApplication(data, { clip, clipLong, field, fieldRaw, consentGiven })
	if (!result.ok) return json({ ok: false, error: result.error }, 400)

	try {
		const { inserted } = await insertApplication(env.DB, result.row)
		if (!inserted) {
			return json(
				{
					ok: false,
					duplicate: true,
					error: "You've already applied with this email, so you're all set. We'll be in touch when decisions go out.",
				},
				409
			)
		}
	} catch (error) {
		console.error("hacker application insert failed", error instanceof Error ? error.name : "error")
		return json({ ok: false, error: "We couldn't save that. Try again in a moment." }, 500)
	}
	later(notifyNewApplication(env))
	return json({ ok: true })
}

// Like clip, but allows newlines and tabs in long free-text answers.
function clipLong(value, max) {
	const trimmed = value.trim()
	if (trimmed.length > max) return { ok: false, value: "" }
	if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(trimmed)) return { ok: false, value: "" }
	return { ok: true, value: trimmed }
}

async function exportCsv(request, env) {
	if (!authorized(request, env)) return json({ ok: false, error: "Unauthorized." }, 401)

	let rows
	try {
		const result = await env.DB.prepare(
			`SELECT id, first_name, last_name, email, university, consent, created_at
			 FROM interest
			 ORDER BY id DESC`
		).all()
		rows = result.results ?? []
	} catch (error) {
		console.error("interest export failed", error instanceof Error ? error.name : "error")
		return json({ ok: false, error: "Export failed." }, 500)
	}

	const header = ["id", "first_name", "last_name", "email", "university", "consent", "created_at"]
	return new Response(toCsv(header, rows), {
		status: 200,
		headers: {
			"content-type": "text/csv; charset=utf-8",
			"content-disposition": 'attachment; filename="exehacks-interest.csv"',
			"cache-control": "private, no-store",
			"x-content-type-options": "nosniff",
		},
	})
}

function sameOrigin(request) {
	const origin = request.headers.get("Origin")
	if (!origin) return false
	try {
		return origin === new URL(request.url).origin
	} catch {
		return false
	}
}

function authorized(request, env) {
	const expected = env.EXPORT_TOKEN
	if (typeof expected !== "string" || expected.length === 0) return false
	const header = request.headers.get("Authorization") || ""
	const prefix = "Bearer "
	if (!header.startsWith(prefix)) return false
	return timingSafeEqual(header.slice(prefix.length), expected)
}

function timingSafeEqual(a, b) {
	const encoder = new TextEncoder()
	const left = encoder.encode(a)
	const right = encoder.encode(b)
	let mismatch = left.length === right.length ? 0 : 1
	const length = Math.max(left.length, right.length)
	for (let i = 0; i < length; i++) mismatch |= (left[i] ?? 0) ^ (right[i] ?? 0)
	return mismatch === 0
}

async function readBody(request) {
	const type = (request.headers.get("content-type") || "").toLowerCase()
	if (type.includes("application/json")) {
		try {
			const data = await request.json()
			if (!data || typeof data !== "object" || Array.isArray(data)) return { error: "invalid" }
			return { data }
		} catch {
			return { error: "invalid" }
		}
	}
	if (type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data")) {
		try {
			const form = await request.formData()
			const data = {}
			for (const [key, value] of form.entries()) {
				if (typeof value === "string") data[key] = value
			}
			return { data }
		} catch {
			return { error: "invalid" }
		}
	}
	return { error: "type" }
}

function honeypotTripped(data) {
	const value = data.hp_website
	return typeof value === "string" && value.trim() !== ""
}

function field(data, ...keys) {
	for (const key of keys) {
		if (Object.prototype.hasOwnProperty.call(data, key)) return asText(data[key])
	}
	return ""
}

function fieldRaw(data, key) {
	return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : undefined
}

function asText(value) {
	if (typeof value === "string") return value
	if (typeof value === "number" && Number.isFinite(value)) return String(value)
	return ""
}

function clip(value, max) {
	const trimmed = value.trim()
	if (trimmed.length > max) return { ok: false, value: "" }
	if (/[\u0000-\u001F\u007F]/.test(trimmed)) return { ok: false, value: "" }
	return { ok: true, value: trimmed }
}

function consentGiven(value) {
	if (value === true || value === 1) return true
	if (typeof value !== "string") return false
	const normalized = value.trim().toLowerCase()
	return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on"
}

async function adminApi(request, env, path) {
	if (request.method !== "GET") return json({ ok: false, error: "Method not allowed." }, 405)
	const auth = await authorizeAdmin(request, env)
	if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status)

	if (path === "/api/admin/tables") {
		try {
			const tables = await listTables(env.DB)
			return json({ ok: true, tables })
		} catch (error) {
			console.error("admin tables failed", error instanceof Error ? error.name : "error")
			return json({ ok: false, error: "Could not load tables." }, 500)
		}
	}

	let rest = path.slice("/api/admin/tables/".length)
	const csv = rest.endsWith(".csv")
	if (csv) rest = rest.slice(0, -".csv".length)
	let table
	try {
		table = decodeURIComponent(rest)
	} catch {
		return json({ ok: false, error: "Unknown table." }, 404)
	}

	const params = new URL(request.url).searchParams
	const search = params.get("q") || ""
	const filters = {
		role: params.get("role") || "",
		year: params.get("year") || "",
		availability: params.get("availability") || "",
		level: params.get("level") || "",
		school: params.get("school") || "",
		experience: params.get("experience") || "",
		status: params.get("status") || "",
		team: params.get("team") || "",
		heard: params.get("heard") || "",
	}
	try {
		if (csv) {
			const page = await readTableCsv(env.DB, table, search, filters)
			if (!page) return json({ ok: false, error: "Unknown table." }, 404)
			return new Response(toCsv(page.columns, page.rows), {
				status: 200,
				headers: {
					"content-type": "text/csv; charset=utf-8",
					"content-disposition": `attachment; filename="${table}.csv"`,
					"cache-control": "private, no-store",
					"x-content-type-options": "nosniff",
				},
			})
		}

		const url = new URL(request.url)
		const limit = clampInt(url.searchParams.get("limit"), 200, 1, 500)
		const offset = clampInt(url.searchParams.get("offset"), 0, 0, 100000)
		const page = await readTable(env.DB, table, { search, filters, limit, offset })
		if (!page) return json({ ok: false, error: "Unknown table." }, 404)
		return json({ ok: true, ...page })
	} catch (error) {
		console.error("admin read failed", error instanceof Error ? error.name : "error")
		return json({ ok: false, error: "Could not load that table." }, 500)
	}
}

async function commandCentreApi(request, env, path, later = () => {}) {
	const method = request.method
	const writing = method === "POST" || method === "PATCH" || method === "DELETE"
	if (writing && !sameOrigin(request)) return json({ ok: false, error: "Forbidden." }, 403)

	const auth = await authorizeAdmin(request, env)
	if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status)

	try {
		if (path === "/api/admin/overview") {
			if (method !== "GET") return json({ ok: false, error: "Method not allowed." }, 405)
			const overview = await readOverview(env.DB, { applicationsOpen: applicationsOpen(env), email: auth.email })
			return json({ ok: true, ...overview })
		}

		if (path === "/api/admin/items") {
			if (method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405)
			const body = await readItemBody(request)
			if (!body.ok) return json({ ok: false, error: body.error }, body.status)
			const checked = validateItem(body.data)
			if (!checked.ok) return json({ ok: false, error: checked.error }, 400)
			const created = await createItem(env.DB, checked.item, auth.email)
			if (!created.ok) return json({ ok: false, error: created.error }, created.status)
			if (created.item?.tone === "danger") later(notifyBlocking(env, created.item, auth.email))
			return json({ ok: true, item: created.item }, 201)
		}

		const id = parseItemId(path)
		if (!id) return json({ ok: false, error: "Not found." }, 404)
		if (method === "PATCH") {
			const body = await readItemBody(request)
			if (!body.ok) return json({ ok: false, error: body.error }, body.status)
			const checked = validateItem(body.data, { partial: true })
			if (!checked.ok) return json({ ok: false, error: checked.error }, 400)
			const updated = await updateItem(env.DB, id, checked.item, auth.email)
			if (!updated.ok) return json({ ok: false, error: updated.error }, updated.status)
			if (updated.item?.tone === "danger" && !updated.item.done && updated.previousTone !== "danger") {
				later(notifyBlocking(env, updated.item, auth.email))
			}
			return json({ ok: true, item: updated.item })
		}
		if (method === "DELETE") {
			const removed = await deleteItem(env.DB, id)
			if (!removed.ok) return json({ ok: false, error: removed.error }, removed.status)
			return json({ ok: true })
		}
		return json({ ok: false, error: "Method not allowed." }, 405)
	} catch (error) {
		console.error("command centre failed", error instanceof Error ? error.name : "error")
		return json({ ok: false, error: "Could not reach the tracker. Try again in a moment." }, 500)
	}
}

async function readItemBody(request) {
	const length = Number(request.headers.get("content-length") || 0)
	if (length > 10_000) return { ok: false, status: 413, error: "That item is too long." }
	const type = (request.headers.get("content-type") || "").toLowerCase()
	if (!type.includes("application/json")) return { ok: false, status: 415, error: "Send JSON." }
	const parsed = await readBody(request)
	if (parsed.error) return { ok: false, status: 400, error: "Check the item and try again." }
	return { ok: true, data: parsed.data }
}

function clampInt(value, fallback, min, max) {
	const parsed = Number(value)
	if (!Number.isInteger(parsed)) return fallback
	return Math.min(max, Math.max(min, parsed))
}

function signInPage(status, discordEnabled, path) {
	const next = encodeURIComponent(`${path}/`)
	const discord = discordEnabled
		? `<p><a class="btn" href="/auth/discord/login?next=${next}">Sign in with Discord</a></p>`
		: `<p>Discord sign-in is not set up yet.</p>`
	const note = status === 403 ? "<p>You are signed in, but this account is not on the ExeHacks team list.</p>" : ""
	const body = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Sign in: ExeHacks team</title>
<style>body{background:#08080c;color:#ecedf3;font-family:ui-monospace,monospace;display:grid;place-items:center;min-height:100vh;margin:0}main{max-width:28rem;padding:2rem}h1{font-size:1.4rem}a{color:#05ff61}.btn{display:inline-block;padding:.8rem 1.2rem;border:1px solid #05ff61;text-decoration:none}</style>
<main><h1>ExeHacks team sign-in</h1>${note}${discord}<p><a href="/admin/">Sign in with email instead</a></p></main></html>`
	return new Response(body, {
		status,
		headers: { "content-type": "text/html; charset=utf-8", "cache-control": "private, no-store", "x-content-type-options": "nosniff" },
	})
}

function html(status, message) {
	const safe = String(message || "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char])
	return new Response(`<!doctype html><meta charset="utf-8"><title>ExeHacks admin</title><p>${safe}</p>`, {
		status,
		headers: {
			"content-type": "text/html; charset=utf-8",
			"cache-control": "private, no-store",
			"x-content-type-options": "nosniff",
		},
	})
}

function json(data, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			"content-type": "application/json; charset=utf-8",
			"cache-control": "private, no-store",
			"x-content-type-options": "nosniff",
		},
	})
}
