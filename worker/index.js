/**
 * ExeHacks Worker. Static pages are the asset bundle in ./out.
 * This script runs first for /api/* and /admin* (see wrangler.jsonc).
 *
 * POST /api/interest stores a row in D1. A repeated email is still 200, so the
 * response does not say whether that address was already on the list.
 * GET /api/interest/export.csv needs Authorization: Bearer $EXPORT_TOKEN.
 * /admin and /api/admin/* need a Cloudflare Access JWT for an ADMIN_EMAILS address.
 */

import { authorizeAdmin } from "./access.js"
import { listTables, readTable, readTableCsv } from "./admin.js"
import { toCsv } from "./csv.js"

const LIMITS = {
	firstName: 80,
	lastName: 80,
	email: 254,
	university: 120,
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const worker = {
	async fetch(request, env) {
		const url = new URL(request.url)
		const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname

		if (path === "/api/interest") {
			if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405)
			return postInterest(request, env)
		}

		if (path === "/api/interest/export.csv") {
			if (request.method !== "GET") return json({ ok: false, error: "Method not allowed." }, 405)
			return exportCsv(request, env)
		}

		if (path === "/api/admin/tables" || path.startsWith("/api/admin/tables/")) {
			return adminApi(request, env, path)
		}

		if (path.startsWith("/api/")) return json({ ok: false, error: "Not found." }, 404)

		if (path === "/admin" || path.startsWith("/admin/")) {
			const auth = await authorizeAdmin(request, env)
			if (!auth.ok) return html(auth.status, auth.error)
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

	const search = new URL(request.url).searchParams.get("q") || ""
	try {
		if (csv) {
			const page = await readTableCsv(env.DB, table, search)
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
		const page = await readTable(env.DB, table, { search, limit, offset })
		if (!page) return json({ ok: false, error: "Unknown table." }, 404)
		return json({ ok: true, ...page })
	} catch (error) {
		console.error("admin read failed", error instanceof Error ? error.name : "error")
		return json({ ok: false, error: "Could not load that table." }, 500)
	}
}

function clampInt(value, fallback, min, max) {
	const parsed = Number(value)
	if (!Number.isInteger(parsed)) return fallback
	return Math.min(max, Math.max(min, parsed))
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
