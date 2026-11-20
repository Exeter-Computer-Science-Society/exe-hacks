/**
 * POST /api/sponsor stores one sponsor enquiry, then best-effort emails the
 * sponsorship inbox. The row is kept even when the email send fails.
 *
 * SPONSOR_EMAIL is the send_email binding. It has no destination_address:
 * sponsors@exehacks.excs.uk is an Email Routing forward rule, not a verified
 * destination. When SPONSOR_NOTIFY_EMAIL is a valid address, mail goes there
 * (set it to the verified destination the forward rule uses). Otherwise mail
 * goes to sponsors@exehacks.excs.uk. Never commit a personal mailbox.
 */

import { CONTACT_EMAIL } from "../app/config.js"
import { SPONSOR_INTERESTS, SPONSOR_LIMITS } from "../app/sponsor/options.js"

export const SPONSOR_INBOX = CONTACT_EMAIL
export const HOURLY_LIMIT = 5

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const INTEREST_VALUES = new Set(SPONSOR_INTERESTS.map((item) => item.value))

export function validateSponsorEnquiry(data, { clip, clipLong, field }) {
	const name = clip(field(data, "name"), SPONSOR_LIMITS.name)
	const company = clip(field(data, "company", "org"), SPONSOR_LIMITS.company)
	const email = clip(field(data, "email"), SPONSOR_LIMITS.email)
	const interest = clip(field(data, "interest"), SPONSOR_LIMITS.interest)
	const message = clipLong(field(data, "message"), SPONSOR_LIMITS.message)

	if (!name.ok) return { ok: false, field: "name", error: "Check the form and try again." }
	if (!company.ok) return { ok: false, field: "company", error: "Check the form and try again." }
	if (!email.ok) return { ok: false, field: "email", error: "Check the form and try again." }
	if (!interest.ok) return { ok: false, field: "interest", error: "Check the form and try again." }
	if (!message.ok) return { ok: false, field: "message", error: "Check the form and try again." }

	if (!name.value) return { ok: false, field: "name", error: "Add your name." }
	if (!company.value) return { ok: false, field: "company", error: "Add your organisation." }
	if (!EMAIL.test(email.value)) return { ok: false, field: "email", error: "Add a valid email address." }
	if (!INTEREST_VALUES.has(interest.value)) return { ok: false, field: "interest", error: "Choose what you're interested in." }
	if (!message.value) return { ok: false, field: "message", error: "Add a short note." }

	return {
		ok: true,
		row: {
			name: name.value,
			email: email.value,
			company: company.value,
			interest: interest.value,
			message: message.value,
		},
	}
}

export function notifyAddress(env) {
	const configured = typeof env?.SPONSOR_NOTIFY_EMAIL === "string" ? env.SPONSOR_NOTIFY_EMAIL.trim() : ""
	if (!configured) return SPONSOR_INBOX
	if (configured.length > SPONSOR_LIMITS.email || !EMAIL.test(configured)) {
		console.error("sponsor notify address invalid")
		return SPONSOR_INBOX
	}
	return configured
}

export async function saveSponsorEnquiry(db, row) {
	const existing = await db
		.prepare(
			`SELECT id FROM sponsor_enquiries
			 WHERE email = ? COLLATE NOCASE AND company = ? AND interest = ? AND message = ?
			 LIMIT 1`
		)
		.bind(row.email, row.company, row.interest, row.message)
		.first()
	if (existing) return { ok: true, duplicate: true }

	const recent = await db
		.prepare(
			`SELECT COUNT(*) AS count FROM sponsor_enquiries
			 WHERE email = ? COLLATE NOCASE
			   AND created_at >= datetime('now', '-1 hour')`
		)
		.bind(row.email)
		.first()
	if (Number(recent?.count || 0) >= HOURLY_LIMIT) {
		return {
			ok: false,
			status: 429,
			error: `You've sent several enquiries in the last hour. Email ${SPONSOR_INBOX} and we'll pick it up.`,
		}
	}

	await db
		.prepare(
			`INSERT INTO sponsor_enquiries (name, email, company, interest, message)
			 VALUES (?, ?, ?, ?, ?)`
		)
		.bind(row.name, row.email, row.company, row.interest, row.message)
		.run()
	return { ok: true, duplicate: false }
}

export function sponsorEnquiryRaw(row, to) {
	const interest = SPONSOR_INTERESTS.find((item) => item.value === row.interest)?.label || row.interest
	const text = [
		"New ExeHacks sponsorship enquiry",
		"",
		`Name: ${row.name}`,
		`Email: ${row.email}`,
		`Organisation: ${row.company}`,
		`Interest: ${interest}`,
		"",
		row.message,
	].join("\n")
	const headers = [
		`From: ExeHacks <${SPONSOR_INBOX}>`,
		`To: ${to}`,
		`Reply-To: ${row.email}`,
		"Subject: ExeHacks sponsorship enquiry",
		`Date: ${new Date().toUTCString()}`,
		`Message-ID: <${crypto.randomUUID()}@exehacks.excs.uk>`,
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=UTF-8",
		"Content-Transfer-Encoding: base64",
	]
	return `${headers.join("\r\n")}\r\n\r\n${wrapBase64(bytesToBase64(new TextEncoder().encode(text)))}`
}

export async function notifySponsor(env, row) {
	const binding = env?.SPONSOR_EMAIL
	if (!binding || typeof binding.send !== "function") {
		console.error("sponsor notify skipped", "binding")
		return
	}
	const to = notifyAddress(env)
	try {
		const message = await buildEmailMessage(SPONSOR_INBOX, to, sponsorEnquiryRaw(row, to))
		await binding.send(message)
	} catch (error) {
		const code = error && typeof error === "object" && "code" in error ? error.code : ""
		console.error("sponsor notify failed", error instanceof Error ? error.name : "error", code || "")
	}
}

async function buildEmailMessage(from, to, raw) {
	let EmailMessage
	try {
		;({ EmailMessage } = await import("cloudflare:email"))
	} catch {
		// Node unit tests have no Worker email built-in. The real binding
		// receives an EmailMessage; the fallback keeps the same envelope.
		return { from, to, raw }
	}
	return new EmailMessage(from, to, raw)
}

function bytesToBase64(bytes) {
	let binary = ""
	for (const byte of bytes) binary += String.fromCharCode(byte)
	return btoa(binary)
}

function wrapBase64(value) {
	const lines = []
	for (let i = 0; i < value.length; i += 76) lines.push(value.slice(i, i + 76))
	return lines.join("\r\n")
}
