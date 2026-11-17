/**
 * ExeHacks 2027 Command Centre API (behind Cloudflare Access, see access.js).
 *
 * GET    /api/admin/overview    -> live D1 counts, event facts and every tracker item
 * POST   /api/admin/items       -> add a tracker item
 * PATCH  /api/admin/items/:id   -> edit a tracker item (any subset of fields)
 * DELETE /api/admin/items/:id   -> remove a tracker item
 *
 * Counts only: this route never returns applicant names or emails. Those stay
 * in /admin/signups (the table console), behind the same check.
 */

import { APPLICATION_STATUSES } from "../app/apply/options.js"
import { EVENT, SECTIONS, SECTION_KEYS, TONES } from "../app/admin/tracker.js"

export const ITEM_LIMITS = {
	title: 160,
	detail: 1000,
	status: 60,
	owner: 80,
	due: 40,
	link: 500,
}

const TONE_VALUES = TONES.map((tone) => tone.value)
const MAX_ITEMS = 500

export function parseItemId(path) {
	const match = /^\/api\/admin\/items\/(\d{1,9})$/.exec(path)
	return match ? Number(match[1]) : null
}

/**
 * Checks a create (partial = false) or edit (partial = true) body.
 * Returns { ok: true, item } with only the fields that were sent (edit) or
 * every field with defaults (create), or { ok: false, error }.
 */
export function validateItem(data, { partial = false } = {}) {
	if (!data || typeof data !== "object" || Array.isArray(data)) return { ok: false, error: "Check the item and try again." }
	const item = {}
	const has = (key) => Object.prototype.hasOwnProperty.call(data, key)

	if (!partial || has("section")) {
		const section = String(data.section ?? "")
		if (!SECTION_KEYS.includes(section)) return { ok: false, error: "Pick a section." }
		item.section = section
	}

	if (!partial || has("title")) {
		const title = text(data.title)
		if (!title) return { ok: false, error: "Add a title." }
		if (title.length > ITEM_LIMITS.title) return { ok: false, error: `Keep the title under ${ITEM_LIMITS.title} characters.` }
		item.title = title
	}

	for (const key of ["detail", "status", "owner", "due"]) {
		if (partial && !has(key)) continue
		const value = text(data[key])
		if (value.length > ITEM_LIMITS[key]) return { ok: false, error: `Keep ${key} under ${ITEM_LIMITS[key]} characters.` }
		item[key] = value || null
	}

	if (!partial || has("link")) {
		const link = text(data.link)
		if (link.length > ITEM_LIMITS.link) return { ok: false, error: "That link is too long." }
		if (link && !safeLink(link)) return { ok: false, error: "Links must start with https:// or mailto:." }
		item.link = link || null
	}

	if (!partial || has("tone")) {
		const tone = String(data.tone ?? "")
		if (!TONE_VALUES.includes(tone)) return { ok: false, error: "Pick a status colour." }
		item.tone = tone
	}

	if (!partial || has("done")) {
		const done = data.done
		item.done = done === true || done === 1 || done === "1" || done === "true" ? 1 : 0
	}

	if (!partial || has("sort")) {
		const sort = data.sort === undefined || data.sort === null || data.sort === "" ? 0 : Number(data.sort)
		if (!Number.isInteger(sort) || sort < -100000 || sort > 100000) return { ok: false, error: "Order must be a whole number." }
		item.sort = sort
	}

	if (partial && Object.keys(item).length === 0) return { ok: false, error: "Nothing to change." }
	return { ok: true, item }
}

export function safeLink(value) {
	if (/^mailto:[^\s]+@[^\s]+$/i.test(value)) return true
	try {
		const url = new URL(value)
		return url.protocol === "https:" && Boolean(url.hostname)
	} catch {
		return false
	}
}

export function daysUntil(iso, now = Date.now()) {
	const target = Date.parse(iso)
	if (!Number.isFinite(target)) return null
	return Math.max(0, Math.ceil((target - now) / 86_400_000))
}

export async function readOverview(db, { applicationsOpen, email }) {
	const [interest, team, hackers, items] = await Promise.all([
		countTable(db, "interest"),
		countTable(db, "team_applications"),
		hackerCounts(db),
		listItems(db),
	])
	return {
		viewer: email,
		generatedAt: new Date().toISOString(),
		event: { ...EVENT, daysToGo: daysUntil(EVENT.startsAt) },
		applicationsOpen,
		counts: { interest, teamApplications: team, hackers },
		sections: SECTIONS,
		tones: TONES,
		items,
	}
}

export async function listItems(db) {
	try {
		const { results } = await db
			.prepare(
				`SELECT id, section, title, detail, status, tone, owner, due, link, done, sort, updated_at, updated_by
				 FROM command_centre_items ORDER BY done ASC, sort ASC, id ASC LIMIT ?`
			)
			.bind(MAX_ITEMS)
			.all()
		return results || []
	} catch (error) {
		// Table missing until migration 0005 runs. Show an empty tracker instead of failing.
		if (missingTable(error)) return []
		throw error
	}
}

export async function createItem(db, item, email) {
	const total = await db.prepare(`SELECT COUNT(*) AS n FROM command_centre_items`).first()
	if (Number(total?.n || 0) >= MAX_ITEMS) return { ok: false, status: 409, error: "The tracker is full. Remove old items first." }
	const row = await db
		.prepare(
			`INSERT INTO command_centre_items (section, title, detail, status, tone, owner, due, link, done, sort, updated_by)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			 RETURNING id, section, title, detail, status, tone, owner, due, link, done, sort, updated_at, updated_by`
		)
		.bind(item.section, item.title, item.detail, item.status, item.tone, item.owner, item.due, item.link, item.done, item.sort, email)
		.first()
	return { ok: true, item: row }
}

export async function updateItem(db, id, fields, email) {
	const keys = Object.keys(fields)
	const sets = keys.map((key) => `${key} = ?`)
	const row = await db
		.prepare(
			`UPDATE command_centre_items SET ${sets.join(", ")}, updated_at = datetime('now'), updated_by = ?
			 WHERE id = ?
			 RETURNING id, section, title, detail, status, tone, owner, due, link, done, sort, updated_at, updated_by`
		)
		.bind(...keys.map((key) => fields[key]), email, id)
		.first()
	if (!row) return { ok: false, status: 404, error: "That item no longer exists." }
	return { ok: true, item: row }
}

export async function deleteItem(db, id) {
	const result = await db.prepare(`DELETE FROM command_centre_items WHERE id = ?`).bind(id).run()
	if (!result?.meta?.changes) return { ok: false, status: 404, error: "That item no longer exists." }
	return { ok: true }
}

async function countTable(db, table) {
	try {
		const row = await db.prepare(`SELECT COUNT(*) AS n, MAX(created_at) AS latest FROM ${table}`).first()
		return { total: Number(row?.n || 0), latest: row?.latest || null }
	} catch (error) {
		if (missingTable(error)) return { total: 0, latest: null }
		throw error
	}
}

async function hackerCounts(db) {
	const base = await countTable(db, "hacker_applications")
	const byStatus = Object.fromEntries(APPLICATION_STATUSES.map((status) => [status, 0]))
	let lastWeek = 0
	if (base.total > 0) {
		const { results } = await db.prepare(`SELECT status, COUNT(*) AS n FROM hacker_applications GROUP BY status`).all()
		for (const row of results || []) if (row.status in byStatus) byStatus[row.status] = Number(row.n || 0)
		const week = await db
			.prepare(`SELECT COUNT(*) AS n FROM hacker_applications WHERE created_at >= datetime('now', '-7 days')`)
			.first()
		lastWeek = Number(week?.n || 0)
	}
	return { ...base, byStatus, lastWeek }
}

function missingTable(error) {
	return /no such table/i.test(String(error?.message || error || ""))
}

function text(value) {
	if (value === undefined || value === null) return ""
	return String(value).replace(/\r\n?/g, "\n").trim()
}
