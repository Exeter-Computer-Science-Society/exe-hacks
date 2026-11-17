/**
 * Hacker application review, decision email templates and event-day check-in.
 * Every route here sits behind authorizeAdmin (Access email or Discord session),
 * reached as /api/admin/... or /api/team/....
 *
 * GET    /api/admin/applications                 list with filters (JSON)
 * GET    /api/admin/applications.csv             same list as CSV
 * GET    /api/admin/applications/:id             one application with review, AI runs, check-in
 * PATCH  /api/admin/applications/:id             { status?, notes?, connection? }
 * POST   /api/admin/applications/:id/screen      AI screener (screener.js), suggestion only
 * POST   /api/admin/applications/:id/checkin     { checked_in: true | false }
 * GET    /api/admin/email-templates              decision email templates (defaults merged in)
 * PUT    /api/admin/email-templates/:status      { subject, body }
 * DELETE /api/admin/email-templates/:status      back to the default
 *
 * No route here sends email. The page builds drafts for a person to copy or open in their mail app.
 */

import { APPLICATION_STATUSES, EXPERIENCE_LEVELS, LEVELS_OF_STUDY, TEAM_STATUSES } from "../app/apply/options.js"
import { toCsv } from "./csv.js"
import { screenApplication } from "./screener.js"

export const TEMPLATE_STATUSES = ["accepted", "waitlisted", "rejected"]

export const DEFAULT_TEMPLATES = {
	accepted: {
		subject: "You're in: ExeHacks 2027",
		body: `Hi {first_name},

Great news: you've been accepted to {event_name}, {event_dates} at the University of Exeter.

Please confirm your place by replying to this email so we can plan food, swag and space. If you can no longer come, let us know and we'll offer your spot to someone on the waitlist.

We'll send the schedule, venue details and what to bring closer to the day.

See you there,
Kazybek Khairulla
Hackathon Director, ExeHacks 2027`,
	},
	waitlisted: {
		subject: "ExeHacks 2027: you're on the waitlist",
		body: `Hi {first_name},

Thank you for applying to {event_name}. We had far more applications than places, so we've put you on our waitlist.

Places often open up before the event. If one does, we'll email you straight away.

Thanks again for your interest,
Kazybek Khairulla
Hackathon Director, ExeHacks 2027`,
	},
	rejected: {
		subject: "Your ExeHacks 2027 application",
		body: `Hi {first_name},

Thank you for applying to {event_name}. We had far more applications than places this year, and unfortunately we can't offer you a place this time.

We'd love to see you at future EXCS events, and we hope you'll apply again next year.

Best wishes,
Kazybek Khairulla
Hackathon Director, ExeHacks 2027`,
	},
}

const LIST_COLUMNS = [
	"id",
	"first_name",
	"last_name",
	"email",
	"school",
	"level_of_study",
	"course",
	"graduation_year",
	"experience_level",
	"hackathons_attended",
	"team_status",
	"status",
	"created_at",
	"github",
	"linkedin",
	"notes",
	"connection",
	"decided_by",
	"decided_at",
	"ai_score",
	"ai_suggestion",
	"checked_in_at",
]

const LIST_SQL = `SELECT a.id, a.first_name, a.last_name, a.email, a.school, a.level_of_study, a.course, a.graduation_year,
	a.experience_level, a.hackathons_attended, a.team_status, a.status, a.created_at, a.github, a.linkedin,
	r.notes, COALESCE(r.connection, 0) AS connection, r.decided_by, r.decided_at,
	s.score AS ai_score, s.suggestion AS ai_suggestion, c.checked_in_at
	FROM hacker_applications a
	LEFT JOIN application_reviews r ON r.application_id = a.id
	LEFT JOIN application_screenings s ON s.id = (SELECT MAX(id) FROM application_screenings WHERE application_id = a.id)
	LEFT JOIN checkins c ON c.application_id = a.id`

const SORTS = {
	newest: "a.created_at DESC, a.id DESC",
	oldest: "a.created_at ASC, a.id ASC",
	ai: "ai_score IS NULL, ai_score DESC, a.id ASC",
	name: "a.first_name COLLATE NOCASE, a.last_name COLLATE NOCASE",
}

export function buildFilters(params) {
	const clauses = []
	const binds = []
	const applied = {}
	const status = String(params.get("status") || "")
	if (APPLICATION_STATUSES.includes(status)) {
		clauses.push("a.status = ?")
		binds.push(status)
		applied.status = status
	} else if (status === "admitted") {
		clauses.push("a.status IN ('accepted', 'confirmed')")
		applied.status = status
	}
	const exact = [
		["level", "a.level_of_study", LEVELS_OF_STUDY],
		["experience", "a.experience_level", EXPERIENCE_LEVELS.map((item) => item.value)],
		["team", "a.team_status", TEAM_STATUSES.map((item) => item.value)],
	]
	for (const [key, column, allowed] of exact) {
		const value = String(params.get(key) || "")
		if (allowed.includes(value)) {
			clauses.push(`${column} = ?`)
			binds.push(value)
			applied[key] = value
		}
	}
	const ai = String(params.get("ai") || "")
	if (ai === "screened") clauses.push("s.id IS NOT NULL")
	if (ai === "unscreened") clauses.push("s.id IS NULL")
	if (ai === "accept" || ai === "waitlist" || ai === "review") {
		clauses.push("s.suggestion = ?")
		binds.push(ai)
	}
	if (ai) applied.ai = ai
	const checkin = String(params.get("checkin") || "")
	if (checkin === "in") clauses.push("c.checked_in_at IS NOT NULL")
	if (checkin === "out") clauses.push("c.checked_in_at IS NULL")
	if (checkin === "in" || checkin === "out") applied.checkin = checkin
	if (params.get("connection") === "1") {
		clauses.push("r.connection = 1")
		applied.connection = "1"
	}
	const q = String(params.get("q") || "").trim().slice(0, 200)
	if (q) {
		const pattern = `%${q.replace(/[\\%_]/g, (char) => `\\${char}`)}%`
		const fields = ["a.first_name", "a.last_name", "a.email", "a.school", "(a.first_name || ' ' || a.last_name)"]
		clauses.push(fields.map((field) => `${field} LIKE ? ESCAPE '\\'`).join(" OR "))
		binds.push(...fields.map(() => pattern))
		applied.q = q
	}
	const where = clauses.length ? `WHERE ${clauses.map((clause) => `(${clause})`).join(" AND ")}` : ""
	const sort = SORTS[params.get("sort")] ? String(params.get("sort")) : "newest"
	return { where, binds, applied, order: `ORDER BY ${SORTS[sort]}`, sort }
}

export async function listApplications(db, params, { limit = 200, offset = 0 } = {}) {
	const { where, binds, applied, order, sort } = buildFilters(params)
	const total = await db.prepare(`SELECT COUNT(*) AS n FROM (${LIST_SQL} ${where})`).bind(...binds).first()
	const { results } = await db.prepare(`${LIST_SQL} ${where} ${order} LIMIT ? OFFSET ?`).bind(...binds, limit, offset).all()
	const counts = await db.prepare(`SELECT status, COUNT(*) AS n FROM hacker_applications GROUP BY status`).all()
	const checkedIn = await db.prepare(`SELECT COUNT(*) AS n FROM checkins`).first()
	return {
		count: Number(total?.n || 0),
		rows: results || [],
		filters: applied,
		sort,
		statusCounts: Object.fromEntries((counts.results || []).map((row) => [row.status, Number(row.n)])),
		checkedIn: Number(checkedIn?.n || 0),
	}
}

export async function getApplication(db, id) {
	const application = await db.prepare(`SELECT * FROM hacker_applications WHERE id = ?`).bind(id).first()
	if (!application) return null
	const review = await db.prepare(`SELECT * FROM application_reviews WHERE application_id = ?`).bind(id).first()
	const { results: screenings } = await db
		.prepare(`SELECT id, score, suggestion, rationale, signals, model, created_by, created_at FROM application_screenings WHERE application_id = ? ORDER BY id DESC LIMIT 5`)
		.bind(id)
		.all()
	const checkin = await db.prepare(`SELECT checked_in_at, checked_in_by FROM checkins WHERE application_id = ?`).bind(id).first()
	return {
		application,
		review: review || { application_id: id, notes: null, connection: 0, decided_status: null, decided_by: null, decided_at: null },
		screenings: (screenings || []).map((row) => ({ ...row, signals: safeJson(row.signals) })),
		checkin: checkin || null,
	}
}

export function validateReview(data) {
	if (!data || typeof data !== "object" || Array.isArray(data)) return { ok: false, error: "Check the review and try again." }
	const out = {}
	if ("status" in data) {
		if (!APPLICATION_STATUSES.includes(String(data.status))) return { ok: false, error: "Pick a valid status." }
		out.status = String(data.status)
	}
	if ("notes" in data) {
		const notes = data.notes == null ? "" : String(data.notes).replace(/\r\n?/g, "\n").trim()
		if (notes.length > 4000) return { ok: false, error: "Keep notes under 4000 characters." }
		out.notes = notes || null
	}
	if ("connection" in data) out.connection = data.connection === true || data.connection === 1 || data.connection === "1" ? 1 : 0
	if (!Object.keys(out).length) return { ok: false, error: "Nothing to change." }
	return { ok: true, review: out }
}

export async function saveReview(db, id, review, email) {
	const exists = await db.prepare(`SELECT status FROM hacker_applications WHERE id = ?`).bind(id).first()
	if (!exists) return { ok: false, status: 404, error: "That application no longer exists." }
	await db.prepare(`INSERT INTO application_reviews (application_id, updated_by) VALUES (?, ?) ON CONFLICT(application_id) DO NOTHING`).bind(id, email).run()
	const statements = []
	if (review.status && review.status !== exists.status) {
		statements.push(db.prepare(`UPDATE hacker_applications SET status = ? WHERE id = ?`).bind(review.status, id))
		statements.push(
			db
				.prepare(`UPDATE application_reviews SET decided_status = ?, decided_by = ?, decided_at = datetime('now') WHERE application_id = ?`)
				.bind(review.status, email, id)
		)
	}
	if ("notes" in review) statements.push(db.prepare(`UPDATE application_reviews SET notes = ? WHERE application_id = ?`).bind(review.notes, id))
	if ("connection" in review) statements.push(db.prepare(`UPDATE application_reviews SET connection = ? WHERE application_id = ?`).bind(review.connection, id))
	statements.push(db.prepare(`UPDATE application_reviews SET updated_by = ?, updated_at = datetime('now') WHERE application_id = ?`).bind(email, id))
	for (const statement of statements) await statement.run()
	return { ok: true, ...(await getApplication(db, id)) }
}

export async function setCheckin(db, id, checkedIn, email) {
	const exists = await db.prepare(`SELECT id FROM hacker_applications WHERE id = ?`).bind(id).first()
	if (!exists) return { ok: false, status: 404, error: "That application no longer exists." }
	if (checkedIn) {
		await db.prepare(`INSERT INTO checkins (application_id, checked_in_by) VALUES (?, ?) ON CONFLICT(application_id) DO NOTHING`).bind(id, email).run()
	} else {
		await db.prepare(`DELETE FROM checkins WHERE application_id = ?`).bind(id).run()
	}
	const row = await db.prepare(`SELECT checked_in_at, checked_in_by FROM checkins WHERE application_id = ?`).bind(id).first()
	return { ok: true, checkin: row || null }
}

export async function listTemplates(db) {
	const { results } = await db.prepare(`SELECT status, subject, body, updated_by, updated_at FROM email_templates`).all()
	const stored = Object.fromEntries((results || []).map((row) => [row.status, row]))
	return TEMPLATE_STATUSES.map((status) => ({
		status,
		...(stored[status] || { ...DEFAULT_TEMPLATES[status], updated_by: null, updated_at: null }),
		isDefault: !stored[status],
	}))
}

export function validateTemplate(data) {
	const subject = String(data?.subject ?? "").trim()
	const body = String(data?.body ?? "").replace(/\r\n?/g, "\n").trim()
	if (!subject || subject.length > 200) return { ok: false, error: "Add a subject under 200 characters." }
	if (!body || body.length > 5000) return { ok: false, error: "Add a body under 5000 characters." }
	return { ok: true, template: { subject, body } }
}

/** Routes for the paths above. `path` is already normalised to /api/admin/... */
export async function reviewApi(request, env, path, { auth, json, readJson }) {
	const method = request.method
	const url = new URL(request.url)
	const db = env.DB

	if (path === "/api/admin/applications" || path === "/api/admin/applications.csv") {
		if (method !== "GET") return json({ ok: false, error: "Method not allowed." }, 405)
		if (path.endsWith(".csv")) {
			const page = await listApplications(db, url.searchParams, { limit: 10000 })
			return new Response(toCsv(LIST_COLUMNS, page.rows), {
				headers: {
					"content-type": "text/csv; charset=utf-8",
					"content-disposition": `attachment; filename="hacker_applications_review.csv"`,
					"cache-control": "private, no-store",
					"x-content-type-options": "nosniff",
				},
			})
		}
		const limit = clampInt(url.searchParams.get("limit"), 200, 1, 500)
		const offset = clampInt(url.searchParams.get("offset"), 0, 0, 100000)
		return json({ ok: true, ...(await listApplications(db, url.searchParams, { limit, offset })) })
	}

	const appMatch = /^\/api\/admin\/applications\/(\d{1,9})(?:\/(screen|checkin))?$/.exec(path)
	if (appMatch) {
		const id = Number(appMatch[1])
		const action = appMatch[2]
		if (!action) {
			if (method === "GET") {
				const found = await getApplication(db, id)
				return found ? json({ ok: true, ...found }) : json({ ok: false, error: "Not found." }, 404)
			}
			if (method === "PATCH") {
				const body = await readJson(request)
				if (!body.ok) return json({ ok: false, error: body.error }, body.status)
				const checked = validateReview(body.data)
				if (!checked.ok) return json({ ok: false, error: checked.error }, 400)
				const saved = await saveReview(db, id, checked.review, auth.email)
				return saved.ok ? json(saved) : json({ ok: false, error: saved.error }, saved.status)
			}
			return json({ ok: false, error: "Method not allowed." }, 405)
		}
		if (method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405)
		if (action === "screen") {
			const result = await screenApplication(env, id, auth.email)
			return result.ok ? json(result) : json({ ok: false, unavailable: Boolean(result.unavailable), error: result.error }, result.status || 503)
		}
		const body = await readJson(request)
		if (!body.ok) return json({ ok: false, error: body.error }, body.status)
		const value = body.data.checked_in
		const result = await setCheckin(db, id, value === true || value === 1 || value === "1", auth.email)
		return result.ok ? json(result) : json({ ok: false, error: result.error }, result.status)
	}

	if (path === "/api/admin/email-templates") {
		if (method !== "GET") return json({ ok: false, error: "Method not allowed." }, 405)
		return json({ ok: true, templates: await listTemplates(db) })
	}

	const templateMatch = /^\/api\/admin\/email-templates\/(accepted|waitlisted|rejected)$/.exec(path)
	if (templateMatch) {
		const status = templateMatch[1]
		if (method === "DELETE") {
			await db.prepare(`DELETE FROM email_templates WHERE status = ?`).bind(status).run()
			return json({ ok: true, templates: await listTemplates(db) })
		}
		if (method !== "PUT") return json({ ok: false, error: "Method not allowed." }, 405)
		const body = await readJson(request)
		if (!body.ok) return json({ ok: false, error: body.error }, body.status)
		const checked = validateTemplate(body.data)
		if (!checked.ok) return json({ ok: false, error: checked.error }, 400)
		await db
			.prepare(
				`INSERT INTO email_templates (status, subject, body, updated_by) VALUES (?, ?, ?, ?)
				 ON CONFLICT(status) DO UPDATE SET subject = excluded.subject, body = excluded.body, updated_by = excluded.updated_by, updated_at = datetime('now')`
			)
			.bind(status, checked.template.subject, checked.template.body, auth.email)
			.run()
		return json({ ok: true, templates: await listTemplates(db) })
	}

	return json({ ok: false, error: "Not found." }, 404)
}

function clampInt(value, fallback, min, max) {
	// Number(null) is 0, so a missing parameter must fall back before parsing.
	if (value === null || value === undefined || value === "") return fallback
	const parsed = Number(value)
	if (!Number.isInteger(parsed)) return fallback
	return Math.min(max, Math.max(min, parsed))
}

function safeJson(value) {
	try {
		return JSON.parse(value)
	} catch {
		return null
	}
}
