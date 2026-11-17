export function apiFor(base) {
	return base === "/team" ? "/api/team" : "/api/admin"
}

export async function call(path, options = {}) {
	const response = await fetch(path, {
		...options,
		headers: { accept: "application/json", ...(options.body ? { "content-type": "application/json" } : {}) },
	})
	let body = {}
	try {
		body = await response.json()
	} catch {
		body = {}
	}
	if (!response.ok || body.ok === false) {
		const error = new Error(body.error || "Something went wrong. Try again.")
		error.unavailable = Boolean(body.unavailable)
		throw error
	}
	return body
}

export function when(value) {
	if (!value) return ""
	const date = new Date(/Z$|[+-]\d\d:?\d\d$/.test(value) ? value : `${value.replace(" ", "T")}Z`)
	if (Number.isNaN(date.getTime())) return ""
	return date.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" })
}

export const STATUS_TONE = {
	pending: "",
	accepted: "success",
	confirmed: "success",
	waitlisted: "warning",
	rejected: "danger",
	declined: "danger",
}

export function fillTemplate(text, application) {
	const values = {
		first_name: application.first_name || "",
		last_name: application.last_name || "",
		full_name: [application.first_name, application.last_name].filter(Boolean).join(" "),
		event_name: "ExeHacks 2027",
		event_dates: "Sat 6 to Sun 7 February 2027",
	}
	return String(text || "").replace(/\{(first_name|last_name|full_name|event_name|event_dates)\}/g, (_, key) => values[key])
}
