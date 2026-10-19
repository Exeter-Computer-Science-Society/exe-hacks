/**
 * ExeHacks 2027 hacker applications.
 *
 * GET  /api/apply/status  -> { ok, open } so the static /apply page knows whether to show the form.
 * POST /api/apply         -> validates and stores one row in hacker_applications.
 *
 * The form is closed unless the Worker var APPLICATIONS_OPEN is exactly "true".
 * wrangler.jsonc ships it as "false"; flip it there (or in the dashboard) on opening day.
 */

import {
	AGE_MESSAGE,
	AGES,
	MIN_AGE,
	COUNTRIES,
	EXPERIENCE_LEVELS,
	GRADUATION_YEARS,
	HACKATHONS_ATTENDED,
	HEARD_FROM,
	LEVELS_OF_STUDY,
	TEAM_STATUSES,
	TSHIRT_SIZES,
} from "../app/apply/options.js"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE = /^[0-9+()\s-]{7,30}$/
const DISCORD = /^@?[A-Za-z0-9_.]{2,32}(#[0-9]{4})?$/
const LINKEDIN = /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/\S+$/i
const GITHUB = /^(https?:\/\/(www\.)?github\.com\/)?[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\/?$/i

const values = (list) => new Set(list.map((item) => (typeof item === "string" ? item : item.value)))
const ALLOWED = {
	age: values(AGES),
	level: values(LEVELS_OF_STUDY),
	country: values(COUNTRIES),
	gradYear: values(GRADUATION_YEARS),
	tshirt: values(TSHIRT_SIZES),
	hackathons: values(HACKATHONS_ATTENDED),
	experience: values(EXPERIENCE_LEVELS),
	team: values(TEAM_STATUSES),
	heard: values(HEARD_FROM),
}

export function applicationsOpen(env) {
	return String(env?.APPLICATIONS_OPEN || "").trim().toLowerCase() === "true"
}

/**
 * @param data parsed request body (already same-origin and size checked)
 * @param helpers { clip, clipLong, field, fieldRaw, consentGiven }
 * @returns { ok: true, row } or { ok: false, error }
 */
export function validateApplication(data, { clip, clipLong, field, fieldRaw, consentGiven }) {
	const bad = { ok: false, error: "Check the form and try again." }
	const text = {
		firstName: clip(field(data, "firstName"), 80),
		lastName: clip(field(data, "lastName"), 80),
		email: clip(field(data, "email"), 254),
		phone: clip(field(data, "phone"), 30),
		age: clip(field(data, "age"), 4),
		school: clip(field(data, "school"), 160),
		level: clip(field(data, "levelOfStudy"), 100),
		course: clip(field(data, "course"), 160),
		gradYear: clip(field(data, "graduationYear"), 4),
		country: clip(field(data, "country"), 80),
		dietary: clipLong(field(data, "dietary"), 500),
		accessibility: clipLong(field(data, "accessibility"), 1000),
		tshirt: clip(field(data, "tshirtSize"), 4),
		hackathons: clip(field(data, "hackathonsAttended"), 4),
		experience: clip(field(data, "experienceLevel"), 20),
		team: clip(field(data, "teamStatus"), 20),
		github: clip(field(data, "github"), 200),
		linkedin: clip(field(data, "linkedin"), 200),
		discord: clip(field(data, "discord"), 37),
		why: clipLong(field(data, "why"), 1500),
		heard: clip(field(data, "heardFrom"), 40),
	}
	for (const item of Object.values(text)) if (!item.ok) return bad
	const v = Object.fromEntries(Object.entries(text).map(([key, item]) => [key, item.value]))

	if (!v.firstName) return { ok: false, error: "Add your first name." }
	if (!v.lastName) return { ok: false, error: "Add your last name." }
	if (!EMAIL.test(v.email)) return { ok: false, error: "Add a valid email address." }
	if (v.phone && !PHONE.test(v.phone)) return { ok: false, error: "Check your phone number." }
	if (/^\d{1,3}$/.test(v.age) && Number(v.age) < MIN_AGE) return { ok: false, error: AGE_MESSAGE }
	if (!ALLOWED.age.has(v.age)) return { ok: false, error: "Choose your age." }
	if (!v.school) return { ok: false, error: "Add your university or school." }
	if (!ALLOWED.level.has(v.level)) return { ok: false, error: "Choose your level of study." }
	if (!v.course) return { ok: false, error: "Add your course or major." }
	if (!ALLOWED.gradYear.has(v.gradYear)) return { ok: false, error: "Choose your graduation year." }
	if (!ALLOWED.country.has(v.country)) return { ok: false, error: "Choose your country of residence." }
	if (!ALLOWED.tshirt.has(v.tshirt)) return { ok: false, error: "Choose a t-shirt size." }
	if (!ALLOWED.hackathons.has(v.hackathons)) return { ok: false, error: "Tell us how many hackathons you've been to." }
	if (!ALLOWED.experience.has(v.experience)) return { ok: false, error: "Choose your experience level." }
	if (!ALLOWED.team.has(v.team)) return { ok: false, error: "Tell us about your team." }
	if (v.github && !GITHUB.test(v.github)) return { ok: false, error: "Check your GitHub username or link." }
	if (v.linkedin && !LINKEDIN.test(v.linkedin)) return { ok: false, error: "Check your LinkedIn link." }
	if (v.discord && !DISCORD.test(v.discord)) return { ok: false, error: "Check your Discord username." }
	if (!v.why) return { ok: false, error: "Tell us why you want to come to ExeHacks." }
	if (!ALLOWED.heard.has(v.heard)) return { ok: false, error: "Tell us how you heard about ExeHacks." }

	if (!consentGiven(fieldRaw(data, "mlhCodeOfConduct"))) {
		return { ok: false, error: "You need to agree to the MLH Code of Conduct to apply." }
	}
	if (!consentGiven(fieldRaw(data, "mlhDataSharing"))) {
		return { ok: false, error: "You need to agree to the MLH data sharing, terms and privacy policy to apply." }
	}
	if (!consentGiven(fieldRaw(data, "privacyConsent"))) {
		return { ok: false, error: "You need to agree to EXCS storing your details to apply." }
	}
	const mlhMarketing = consentGiven(fieldRaw(data, "mlhMarketing")) ? 1 : 0

	return {
		ok: true,
		row: {
			first_name: v.firstName,
			last_name: v.lastName,
			email: v.email,
			phone: v.phone || null,
			age: v.age,
			school: v.school,
			level_of_study: v.level,
			course: v.course,
			graduation_year: Number(v.gradYear),
			country: v.country,
			dietary: v.dietary || null,
			accessibility: v.accessibility || null,
			tshirt_size: v.tshirt,
			hackathons_attended: v.hackathons,
			experience_level: v.experience,
			team_status: v.team,
			github: v.github || null,
			linkedin: v.linkedin || null,
			discord: v.discord ? v.discord.replace(/^@/, "") : null,
			why: v.why,
			heard_from: v.heard,
			mlh_code_of_conduct: 1,
			mlh_data_sharing: 1,
			mlh_marketing: mlhMarketing,
			privacy_consent: 1,
		},
	}
}

export async function insertApplication(db, row) {
	const columns = Object.keys(row)
	const sql = `INSERT INTO hacker_applications (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")}) ON CONFLICT(email) DO NOTHING`
	const result = await db.prepare(sql).bind(...columns.map((key) => row[key])).run()
	return { inserted: Number(result?.meta?.changes || 0) > 0 }
}
