/**
 * Discord sign-in for the team dashboard at /team (Worker-native OAuth2).
 *
 * /team and /api/team/* are NOT behind Cloudflare Access, so this Worker is the
 * only gate there. /admin keeps Cloudflare Access (email one-time PIN) in front.
 *
 * GET /auth/discord/login     -> redirect to Discord (scope identify, plus
 *                                guilds.members.read when a role check is set up)
 * GET /auth/discord/callback  -> checks the user, sets a signed session cookie
 * GET /auth/logout            -> clears the session cookie
 *
 * A Discord user gets in if their user ID is in DISCORD_ADMIN_IDS, or they have
 * one of DISCORD_ADMIN_ROLE_IDS in the server DISCORD_GUILD_ID.
 * They are a reviewer (applicant data) only if their ID is in DISCORD_REVIEWER_IDS,
 * or they have one of DISCORD_REVIEWER_ROLE_IDS. Reviewers can always get in.
 * Neither set means no Discord reviewers (fail closed).
 *
 * Worker secrets (never in this repo):
 *   DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, SESSION_SECRET (32+ random chars)
 *   DISCORD_ADMIN_IDS (comma-separated user IDs, optional)
 *   DISCORD_GUILD_ID + DISCORD_ADMIN_ROLE_IDS (optional role check)
 *   DISCORD_REVIEWER_IDS, DISCORD_REVIEWER_ROLE_IDS (optional review group)
 * Missing client ID, client secret or SESSION_SECRET turns Discord sign-in off
 * and every Discord session is refused.
 */

export const SESSION_COOKIE = "__Host-exh_session"
export const STATE_COOKIE = "__Host-exh_oauth"
const SESSION_SECONDS = 8 * 60 * 60
const STATE_SECONDS = 10 * 60
const DISCORD = "https://discord.com"
const SNOWFLAKE = /^\d{5,25}$/

export function listIds(value) {
	return String(value || "")
		.split(/[,\s]+/)
		.map((item) => item.trim())
		.filter((item) => SNOWFLAKE.test(item))
}

export function discordConfig(env) {
	const clientId = String(env?.DISCORD_CLIENT_ID || "").trim()
	const clientSecret = String(env?.DISCORD_CLIENT_SECRET || "").trim()
	const sessionSecret = String(env?.SESSION_SECRET || "")
	const guildId = String(env?.DISCORD_GUILD_ID || "").trim()
	const roleIds = listIds(env?.DISCORD_ADMIN_ROLE_IDS)
	const reviewerRoleIds = listIds(env?.DISCORD_REVIEWER_ROLE_IDS)
	const reviewerIds = listIds(env?.DISCORD_REVIEWER_IDS)
	const userIds = [...new Set([...listIds(env?.DISCORD_ADMIN_IDS), ...reviewerIds])]
	const roleCheck = SNOWFLAKE.test(guildId) && (roleIds.length > 0 || reviewerRoleIds.length > 0)
	const enabled = Boolean(clientId && clientSecret && sessionSecret.length >= 32 && (userIds.length || roleCheck))
	return { enabled, clientId, clientSecret, sessionSecret, guildId, roleIds, reviewerRoleIds, reviewerIds, userIds, roleCheck }
}

export function safeNext(value) {
	const next = String(value || "")
	if (/^\/(team|admin)(\/[A-Za-z0-9/_-]*)?$/.test(next)) return next
	return "/team/"
}

export async function startLogin(request, env) {
	const config = discordConfig(env)
	if (!config.enabled) return text(503, "Discord sign-in is not set up yet. Use email sign-in at /admin.")
	const url = new URL(request.url)
	const state = randomToken()
	const verifier = randomToken() + randomToken()
	const challenge = base64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))))
	const params = new URLSearchParams({
		client_id: config.clientId,
		response_type: "code",
		redirect_uri: `${url.origin}/auth/discord/callback`,
		scope: config.roleCheck ? "identify guilds.members.read" : "identify",
		state,
		code_challenge: challenge,
		code_challenge_method: "S256",
		prompt: "none",
	})
	const stateCookie = await sign({ state, verifier, next: safeNext(url.searchParams.get("next")), exp: now() + STATE_SECONDS }, config.sessionSecret)
	return new Response(null, {
		status: 302,
		headers: {
			location: `${DISCORD}/oauth2/authorize?${params}`,
			"set-cookie": cookie(STATE_COOKIE, stateCookie, STATE_SECONDS),
			"cache-control": "no-store",
		},
	})
}

export async function finishLogin(request, env) {
	const config = discordConfig(env)
	if (!config.enabled) return text(503, "Discord sign-in is not set up yet.")
	const url = new URL(request.url)
	const pending = await verify(readCookie(request, STATE_COOKIE), config.sessionSecret)
	const code = url.searchParams.get("code") || ""
	const clear = cookie(STATE_COOKIE, "", 0)
	if (!pending || !code || pending.state !== url.searchParams.get("state")) {
		return text(400, "That sign-in link expired. Go back and try again.", { "set-cookie": clear })
	}

	try {
		const tokenResponse = await fetch(`${DISCORD}/api/oauth2/token`, {
			method: "POST",
			headers: { "content-type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				client_id: config.clientId,
				client_secret: config.clientSecret,
				grant_type: "authorization_code",
				code,
				redirect_uri: `${url.origin}/auth/discord/callback`,
				code_verifier: pending.verifier,
			}),
		})
		if (!tokenResponse.ok) return text(401, "Discord did not accept that sign-in. Try again.", { "set-cookie": clear })
		const { access_token: accessToken } = await tokenResponse.json()
		const auth = { authorization: `Bearer ${accessToken}` }

		const userResponse = await fetch(`${DISCORD}/api/v10/users/@me`, { headers: auth })
		if (!userResponse.ok) return text(401, "Could not read your Discord account. Try again.", { "set-cookie": clear })
		const user = await userResponse.json()
		const id = String(user?.id || "")
		if (!SNOWFLAKE.test(id)) return text(401, "Could not read your Discord account. Try again.", { "set-cookie": clear })

		let via = config.userIds.includes(id) ? "id" : ""
		let reviewerRole = false
		if (config.roleCheck) {
			const memberResponse = await fetch(`${DISCORD}/api/v10/users/@me/guilds/${config.guildId}/member`, { headers: auth })
			if (memberResponse.ok) {
				const member = await memberResponse.json()
				const roles = Array.isArray(member?.roles) ? member.roles.map(String) : []
				reviewerRole = roles.some((role) => config.reviewerRoleIds.includes(role))
				if (!via && (reviewerRole || roles.some((role) => config.roleIds.includes(role)))) via = "role"
			}
		}
		if (!via) {
			return text(403, "This Discord account is not on the ExeHacks team list. Ask Kazy to add you.", { "set-cookie": clear })
		}

		const name = String(user.username || "").replace(/[^A-Za-z0-9_.]/g, "").slice(0, 40) || id
		const session = await sign({ sub: id, name, via, rr: reviewerRole, exp: now() + SESSION_SECONDS }, config.sessionSecret)
		const headers = new Headers({ location: pending.next, "cache-control": "no-store" })
		headers.append("set-cookie", clear)
		headers.append("set-cookie", cookie(SESSION_COOKIE, session, SESSION_SECONDS))
		return new Response(null, { status: 302, headers })
	} catch (error) {
		console.error("discord sign-in failed", error instanceof Error ? error.name : "error")
		return text(502, "Discord sign-in failed. Try again in a moment.", { "set-cookie": clear })
	}
}

export function logout() {
	return new Response(null, {
		status: 302,
		headers: { location: "/", "set-cookie": cookie(SESSION_COOKIE, "", 0), "cache-control": "no-store" },
	})
}

/**
 * Reads the Discord session cookie. A session made through the ID list stops
 * working as soon as the ID leaves DISCORD_ADMIN_IDS. A role-based session lasts
 * until it expires (8 hours) or the role list changes.
 */
export async function discordIdentity(request, env) {
	const config = discordConfig(env)
	if (!config.enabled) return null
	const session = await verify(readCookie(request, SESSION_COOKIE), config.sessionSecret)
	if (!session || !SNOWFLAKE.test(String(session.sub || ""))) return null
	if (session.via === "id" && !config.userIds.includes(session.sub)) return null
	if (session.via === "role" && !config.roleCheck) return null
	if (session.via !== "id" && session.via !== "role") return null
	// ID-based review access is checked live; role-based lasts until the session expires.
	const reviewer = config.reviewerIds.includes(session.sub) || (session.rr === true && config.roleCheck && config.reviewerRoleIds.length > 0)
	return { email: `discord:${session.name}`, discordId: session.sub, reviewer }
}

export async function sign(payload, secret) {
	const body = base64Url(new TextEncoder().encode(JSON.stringify(payload)))
	const key = await hmacKey(secret)
	const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)))
	return `${body}.${base64Url(mac)}`
}

export async function verify(token, secret) {
	const [body, mac, extra] = String(token || "").split(".")
	if (!body || !mac || extra !== undefined || !secret) return null
	try {
		const key = await hmacKey(secret)
		const ok = await crypto.subtle.verify("HMAC", key, fromBase64Url(mac), new TextEncoder().encode(body))
		if (!ok) return null
		const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body)))
		if (!payload || typeof payload.exp !== "number" || payload.exp < now()) return null
		return payload
	} catch {
		return null
	}
}

export function readCookie(request, name) {
	const header = request.headers.get("Cookie") || ""
	for (const part of header.split(/;\s*/)) {
		const index = part.indexOf("=")
		if (index > 0 && part.slice(0, index) === name) return part.slice(index + 1)
	}
	return ""
}

function cookie(name, value, maxAge) {
	return `${name}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`
}

function hmacKey(secret) {
	return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"])
}

function randomToken() {
	return base64Url(crypto.getRandomValues(new Uint8Array(24)))
}

function now() {
	return Math.floor(Date.now() / 1000)
}

function base64Url(bytes) {
	let binary = ""
	for (const byte of bytes) binary += String.fromCharCode(byte)
	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64Url(value) {
	const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4)
	const binary = atob(padded)
	return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function text(status, message, headers = {}) {
	return new Response(message, {
		status,
		headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", ...headers },
	})
}
