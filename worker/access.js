/**
 * Cloudflare Access checks for /admin and /api/admin.
 * The JWT is the Cf-Access-Jwt-Assertion header (or the CF_Authorization cookie).
 * Certs come from https://<ACCESS_TEAM_DOMAIN>/cdn-cgi/access/certs.
 */

export const DEFAULT_ADMIN_EMAIL = "kazybekkhairulla@gmail.com"

const certCache = { domain: "", exp: 0, keys: [] }

export function adminAllowList(env) {
	const configured = typeof env?.ADMIN_EMAILS === "string" ? env.ADMIN_EMAILS.trim() : ""
	const source = configured || DEFAULT_ADMIN_EMAIL
	return source
		.split(",")
		.map((item) => item.trim().toLowerCase())
		.filter(Boolean)
}

export function accessTeamDomain(env) {
	return String(env?.ACCESS_TEAM_DOMAIN || "")
		.trim()
		.replace(/^https?:\/\//, "")
		.replace(/\/+$/, "")
}

export function readAccessToken(request) {
	const header = request.headers.get("Cf-Access-Jwt-Assertion")
	if (header) return header.trim()
	const cookie = request.headers.get("Cookie") || ""
	const match = cookie.match(/(?:^|;\s*)CF_Authorization=([^;]+)/)
	return match ? decodeURIComponent(match[1]) : ""
}

export async function authorizeAdmin(request, env) {
	const domain = accessTeamDomain(env)
	const aud = typeof env?.ACCESS_AUD === "string" ? env.ACCESS_AUD.trim() : ""
	if (!domain || !aud) {
		return { ok: false, status: 401, error: "Admin sign-in is not configured." }
	}

	const token = readAccessToken(request)
	if (!token) return { ok: false, status: 401, error: "Sign in with Cloudflare Access." }

	const keys = await loadCerts(domain)
	const identity = await verifyAccessJwt(token, {
		audience: aud,
		issuer: `https://${domain}`,
		keys,
	})
	if (!identity?.email) return { ok: false, status: 401, error: "Sign in with Cloudflare Access." }

	const allowed = adminAllowList(env)
	if (!allowed.includes(identity.email)) {
		return { ok: false, status: 403, error: "This account is not an admin." }
	}
	return { ok: true, email: identity.email }
}

export async function verifyAccessJwt(token, { audience, issuer, keys }) {
	const parts = String(token || "").split(".")
	if (parts.length !== 3) return null
	let header
	let payload
	try {
		header = decodeJson(parts[0])
		payload = decodeJson(parts[1])
	} catch {
		return null
	}
	if (!header || header.alg !== "RS256" || !header.kid) return null
	if (!payload || typeof payload !== "object") return null

	const now = Math.floor(Date.now() / 1000)
	if (typeof payload.exp !== "number" || payload.exp < now - 30) return null
	if (typeof payload.nbf === "number" && payload.nbf > now + 30) return null
	if (payload.iss !== issuer) return null
	if (!audienceMatches(payload.aud, audience)) return null

	const jwk = (keys || []).find((key) => key && key.kid === header.kid && key.kty === "RSA")
	if (!jwk) return null

	const signed = new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
	const signature = base64UrlToBytes(parts[2])
	const cryptoKey = await crypto.subtle.importKey(
		"jwk",
		{ kty: "RSA", n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
		{ name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
		false,
		["verify"]
	)
	const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", cryptoKey, signature, signed)
	if (!valid) return null

	const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : ""
	if (!email) return null
	return { email }
}

async function loadCerts(domain) {
	if (certCache.domain === domain && certCache.exp > Date.now() && certCache.keys.length) return certCache.keys
	const response = await fetch(`https://${domain}/cdn-cgi/access/certs`)
	if (!response.ok) return []
	const body = await response.json()
	const keys = Array.isArray(body?.keys) ? body.keys : []
	certCache.domain = domain
	certCache.exp = Date.now() + 10 * 60 * 1000
	certCache.keys = keys
	return keys
}

function audienceMatches(aud, expected) {
	if (typeof aud === "string") return aud === expected
	if (Array.isArray(aud)) return aud.some((item) => item === expected)
	return false
}

function decodeJson(segment) {
	return JSON.parse(new TextDecoder().decode(base64UrlToBytes(segment)))
}

function base64UrlToBytes(segment) {
	const pad = (4 - (segment.length % 4)) % 4
	const padded = segment.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad)
	const binary = atob(padded)
	const bytes = new Uint8Array(binary.length)
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
	return bytes
}
