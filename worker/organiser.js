/**
 * Hackathon Organiser role.
 *
 * Admins are addresses on ADMIN_EMAILS with a valid Cloudflare Access JWT
 * (see access.js). Organisers are the subset on ORGANISER_EMAILS. The
 * handover guide is the only route that requires the organiser role.
 *
 * The email comes from the verified JWT, not from the
 * Cf-Access-Authenticated-User-Email header. That header can be set by a
 * caller who reaches the Worker without Access in front of them.
 */

import { accessTeamDomain, authorizeAdmin } from "./access.js"

export const DEFAULT_ORGANISER_EMAILS = "kazybekkhairulla@gmail.com,kk598@exeter.ac.uk"
export const ORGANISER_ONLY = "This page is only for the Hackathon Organiser."

export function organiserAllowList(env) {
	const configured = typeof env?.ORGANISER_EMAILS === "string" ? env.ORGANISER_EMAILS.trim() : ""
	const parsed = parseEmails(configured)
	return parsed.length ? parsed : parseEmails(DEFAULT_ORGANISER_EMAILS)
}

export function isOrganiserEmail(email, env) {
	const normalised = String(email || "").trim().toLowerCase()
	if (!normalised) return false
	return organiserAllowList(env).includes(normalised)
}

export function organiserFromAdmin(auth, env) {
	if (!auth?.ok) return auth || { ok: false, status: 401, error: "Sign in with Cloudflare Access." }
	if (!isOrganiserEmail(auth.email, env)) return { ok: false, status: 403, error: ORGANISER_ONLY }
	return { ok: true, email: auth.email, organiser: true }
}

/**
 * Local `wrangler dev` only, so the guide can be read on this machine.
 * Refuses to run when Access is configured, or when the request host is not
 * loopback. Never set ORGANISER_DEV_EMAIL in wrangler.jsonc or the dashboard.
 */
export function localDevOrganiser(request, env) {
	if (accessTeamDomain(env)) return null
	const email = typeof env?.ORGANISER_DEV_EMAIL === "string" ? env.ORGANISER_DEV_EMAIL.trim().toLowerCase() : ""
	if (!email || !isOrganiserEmail(email, env)) return null
	let host = ""
	try {
		host = new URL(request.url).hostname
	} catch {
		return null
	}
	if (host !== "localhost" && host !== "127.0.0.1" && host !== "::1" && host !== "[::1]") return null
	return { ok: true, email, organiser: true, dev: true }
}

export async function authorizeOrganiser(request, env) {
	const local = localDevOrganiser(request, env)
	if (local) return local
	return organiserFromAdmin(await authorizeAdmin(request, env), env)
}

function parseEmails(value) {
	return String(value || "")
		.split(",")
		.map((item) => item.trim().toLowerCase())
		.filter((item) => item.includes("@"))
}
