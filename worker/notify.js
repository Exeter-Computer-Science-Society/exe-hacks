/**
 * Team updates posted to Discord through an incoming webhook.
 *
 * DISCORD_WEBHOOK_URL is a Worker secret. When it is unset (or not a Discord
 * webhook URL) every function here does nothing. Messages never carry applicant
 * names, emails or answers: counts only. allowed_mentions is empty, so a message
 * can never ping @everyone or a role.
 */

import { EVENT, SECTIONS } from "../app/admin/tracker.js"
import { daysUntil } from "./command-centre.js"

const WEBHOOK = /^https:\/\/(?:ptb\.|canary\.)?(?:discord|discordapp)\.com\/api\/webhooks\/\d+\/[\w-]+$/
const SITE = "https://exehacks.excs.uk"

export function webhookUrl(env) {
	const url = String(env?.DISCORD_WEBHOOK_URL || "").trim()
	return WEBHOOK.test(url) ? url : ""
}

export async function postToDiscord(env, content) {
	const url = webhookUrl(env)
	if (!url || !content) return false
	try {
		const response = await fetch(url, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ content: clip(content, 1900), allowed_mentions: { parse: [] } }),
		})
		if (!response.ok) console.error("discord webhook failed", response.status)
		return response.ok
	} catch (error) {
		console.error("discord webhook failed", error instanceof Error ? error.name : "error")
		return false
	}
}

export async function notifyNewApplication(env) {
	if (!webhookUrl(env)) return false
	const row = await env.DB.prepare(`SELECT COUNT(*) AS n FROM hacker_applications`).first()
	const total = Number(row?.n || 0)
	return postToDiscord(env, `New hacker application. ${total} / ${EVENT.capacity} so far.`)
}

export async function notifyBlocking(env, item, by) {
	if (!webhookUrl(env) || !item) return false
	const section = SECTIONS.find((entry) => entry.key === item.section)?.label || item.section
	const who = by ? ` (marked by ${by})` : ""
	return postToDiscord(env, `Blocking in ${section}: ${plain(item.title)}${who}\n${SITE}/admin/`)
}

export async function dailyDigest(env, nowMs = Date.now()) {
	if (!webhookUrl(env)) return false
	return postToDiscord(env, await buildDigest(env.DB, nowMs))
}

export async function buildDigest(db, nowMs = Date.now()) {
	const hackers = await safeFirst(db, `SELECT COUNT(*) AS n, SUM(created_at >= datetime('now', '-1 day')) AS day FROM hacker_applications`)
	const accepted = await safeFirst(db, `SELECT COUNT(*) AS n FROM hacker_applications WHERE status IN ('accepted', 'confirmed')`)
	const interest = await safeFirst(db, `SELECT COUNT(*) AS n FROM interest`)
	let open = 0
	let blocking = []
	try {
		const { results } = await db.prepare(`SELECT title, tone FROM command_centre_items WHERE done = 0 ORDER BY sort, id`).all()
		open = (results || []).length
		blocking = (results || []).filter((item) => item.tone === "danger").map((item) => plain(item.title))
	} catch {
		// Tracker table not there yet.
	}
	const days = daysUntil(EVENT.startsAt, nowMs)
	const lines = [
		`**ExeHacks daily update** (${days} days to go)`,
		`Hacker applications: ${num(hackers?.n)} / ${EVENT.capacity} (+${num(hackers?.day)} in the last 24h), ${num(accepted?.n)} accepted or confirmed`,
		`Interest sign-ups: ${num(interest?.n)}`,
		`Open tracker items: ${open}, blocking: ${blocking.length}`,
		...blocking.slice(0, 5).map((title) => `- ${title}`),
		blocking.length > 5 ? `- and ${blocking.length - 5} more` : "",
		`${SITE}/admin/`,
	]
	return lines.filter(Boolean).join("\n")
}

async function safeFirst(db, sql) {
	try {
		return await db.prepare(sql).first()
	} catch {
		return null
	}
}

function num(value) {
	return Number(value || 0)
}

// Strip markdown and mention syntax so tracker text shows as written.
function plain(value) {
	return clip(String(value || "").replace(/[\r\n]+/g, " ").replace(/([*_~`|>\\@#<])/g, "\\$1"), 200)
}

function clip(value, max) {
	return value.length > max ? `${value.slice(0, max - 3)}...` : value
}
