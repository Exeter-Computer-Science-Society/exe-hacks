"use client"

import { useEffect, useState } from "react"

import { APPLICATION_STATUSES, EXPERIENCE_LEVELS, LEVELS_OF_STUDY, TEAM_STATUSES } from "../../apply/options"
import { apiFor, call, fillTemplate, STATUS_TONE, when } from "./api"

const AI_FILTERS = [
	{ value: "", label: "Any" },
	{ value: "screened", label: "Screened" },
	{ value: "unscreened", label: "Not screened" },
	{ value: "accept", label: "Suggests accept" },
	{ value: "waitlist", label: "Suggests waitlist" },
	{ value: "review", label: "Suggests a closer look" },
]
const SORTS = [
	{ value: "newest", label: "Newest first" },
	{ value: "oldest", label: "Oldest first" },
	{ value: "ai", label: "AI score, high first" },
	{ value: "name", label: "Name" },
]
const TEMPLATE_LABEL = { accepted: "Accept", waitlisted: "Waitlist", rejected: "Reject" }
const label = (list, value) => (list.find((item) => (item.value ?? item) === value)?.label || value || "").split(":")[0]

function Pill({ status }) {
	return <span className={`cc-pill${STATUS_TONE[status] ? ` cc-tone-${STATUS_TONE[status]}` : ""}`}>{status}</span>
}

function Field({ name, children }) {
	if (children == null || children === "") return null
	return (
		<div className="ar-field">
			<dt>{name}</dt>
			<dd>{children}</dd>
		</div>
	)
}

function safeHref(value, kind) {
	const raw = String(value || "").trim()
	if (!raw) return ""
	if (kind === "github") {
		const name = raw.replace(/^https?:\/\/(www\.)?github\.com\//i, "").replace(/\/+$/, "").split("/")[0]
		return /^[A-Za-z0-9-]{1,39}$/.test(name) ? `https://github.com/${name}` : ""
	}
	return /^https:\/\/([a-z]{2,3}\.)?linkedin\.com\//i.test(raw) ? raw : ""
}

function AiSuggestion({ screenings, onRun, running, unavailable }) {
	const latest = screenings?.[0]
	return (
		<section className="ar-ai" aria-label="AI suggestion">
			<div className="ar-ai-head">
				<span className="section-tag">AI suggestion</span>
				<button type="button" className="btn btn-ghost ar-small" onClick={onRun} disabled={running}>
					{running ? "Screening…" : latest ? "Run again" : "Run AI screener"}
				</button>
			</div>
			<p className="cc-faint">Suggestion only. It never accepts or rejects anyone. A reviewer decides.</p>
			{unavailable ? <p className="sponsor-form-error">{unavailable}</p> : null}
			{latest ? (
				<>
					<p className="ar-ai-score">
						<span className="num mono">{latest.score}</span>/100 · suggests <strong>{latest.suggestion === "review" ? "a closer look" : latest.suggestion}</strong>
					</p>
					<p className="cc-item-detail">{latest.rationale}</p>
					{latest.signals ? (
						<p className="cc-item-meta mono">
							Answer {latest.signals.answer?.points}/50 · GitHub {latest.signals.github?.points}/30 · Experience {latest.signals.experience?.points}/10 · LinkedIn {latest.signals.linkedin?.points}/5 · Connection {latest.signals.connection?.points}/5
						</p>
					) : null}
					<p className="cc-faint mono">
						{when(latest.created_at)} · {latest.created_by} · {latest.model}
					</p>
				</>
			) : (
				<p className="cc-faint">Not screened yet.</p>
			)}
		</section>
	)
}

function EmailDraft({ application, templates }) {
	const [which, setWhich] = useState(TEMPLATE_LABEL[application.status] ? application.status : "accepted")
	const [copied, setCopied] = useState("")
	const template = templates.find((item) => item.status === which)
	if (!template) return null
	const subject = fillTemplate(template.subject, application)
	const body = fillTemplate(template.body, application)
	const mailto = `mailto:${encodeURIComponent(application.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
	async function copy(text, what) {
		try {
			await navigator.clipboard.writeText(text)
			setCopied(what)
		} catch {
			setCopied("")
		}
	}
	return (
		<section className="ar-email" aria-label="Decision email draft">
			<div className="ar-ai-head">
				<span className="section-tag">Email draft</span>
				<select value={which} onChange={(event) => setWhich(event.target.value)} aria-label="Which email">
					{Object.entries(TEMPLATE_LABEL).map(([value, text]) => (
						<option key={value} value={value}>
							{text}
						</option>
					))}
				</select>
			</div>
			<p className="cc-faint">Nothing is sent from the site. Copy it, or open it in your mail app and send it yourself.</p>
			<p className="mono ar-subject">{subject}</p>
			<pre className="ar-body">{body}</pre>
			<div className="cc-form-actions">
				<button type="button" className="btn btn-ghost ar-small" onClick={() => copy(application.email, "email")}>
					{copied === "email" ? "Copied" : "Copy address"}
				</button>
				<button type="button" className="btn btn-ghost ar-small" onClick={() => copy(subject, "subject")}>
					{copied === "subject" ? "Copied" : "Copy subject"}
				</button>
				<button type="button" className="btn btn-ghost ar-small" onClick={() => copy(body, "body")}>
					{copied === "body" ? "Copied" : "Copy body"}
				</button>
				<a className="btn btn-primary ar-small" href={mailto}>
					Open in mail app
				</a>
			</div>
		</section>
	)
}

function Detail({ api, id, templates, onChanged }) {
	const [data, setData] = useState(null)
	const [form, setForm] = useState({ status: "pending", notes: "", connection: false })
	const [message, setMessage] = useState("")
	const [busy, setBusy] = useState(false)
	const [running, setRunning] = useState(false)
	const [unavailable, setUnavailable] = useState("")

	useEffect(() => {
		let cancel = false
		call(`${api}/applications/${id}`)
			.then((body) => {
				if (cancel) return
				setData(body)
				setForm({ status: body.application.status, notes: body.review.notes || "", connection: Boolean(body.review.connection) })
				setMessage("")
				setUnavailable("")
			})
			.catch((cause) => {
				if (!cancel) setMessage(cause.message)
			})
		return () => {
			cancel = true
		}
	}, [api, id])

	if (!data) return <p className="mono">{message || "Loading…"}</p>
	const a = data.application
	const review = data.review
	const github = safeHref(a.github, "github")
	const linkedin = safeHref(a.linkedin, "linkedin")

	async function save(event) {
		event.preventDefault()
		setBusy(true)
		setMessage("")
		try {
			const body = await call(`${api}/applications/${id}`, { method: "PATCH", body: JSON.stringify(form) })
			setData(body)
			setMessage("Saved.")
			onChanged()
		} catch (cause) {
			setMessage(cause.message)
		} finally {
			setBusy(false)
		}
	}

	async function screen() {
		setRunning(true)
		setUnavailable("")
		try {
			const body = await call(`${api}/applications/${id}/screen`, { method: "POST" })
			setData((current) => ({ ...current, screenings: [body.screening, ...(current.screenings || [])] }))
			onChanged()
		} catch (cause) {
			setUnavailable(cause.message)
		} finally {
			setRunning(false)
		}
	}

	return (
		<div className="ar-detail">
			<header className="ar-detail-head">
				<h2 className="cc-section-title">
					{a.first_name} {a.last_name}
				</h2>
				<Pill status={a.status} />
			</header>
			<dl className="ar-fields">
				<Field name="Email">{a.email}</Field>
				<Field name="Phone">{a.phone}</Field>
				<Field name="University">{a.school}</Field>
				<Field name="Study">
					{a.level_of_study}, {a.course}, graduating {a.graduation_year}
				</Field>
				<Field name="Country">{a.country}</Field>
				<Field name="Age">{a.age}</Field>
				<Field name="Hackathons">{label([{ value: "0", label: "None yet" }, { value: "1-2", label: "1 to 2" }, { value: "3+", label: "3 or more" }], a.hackathons_attended)}</Field>
				<Field name="Experience">{label(EXPERIENCE_LEVELS, a.experience_level)}</Field>
				<Field name="Team">{label(TEAM_STATUSES, a.team_status)}</Field>
				<Field name="GitHub">
					{github ? (
						<a href={github} target="_blank" rel="noopener noreferrer">
							{github.replace("https://", "")}
						</a>
					) : (
						a.github
					)}
				</Field>
				<Field name="LinkedIn">
					{linkedin ? (
						<a href={linkedin} target="_blank" rel="noopener noreferrer">
							Profile
						</a>
					) : (
						a.linkedin
					)}
				</Field>
				<Field name="Discord">{a.discord}</Field>
				<Field name="Dietary">{a.dietary}</Field>
				<Field name="Accessibility">{a.accessibility}</Field>
				<Field name="T-shirt">{a.tshirt_size}</Field>
				<Field name="Heard from">{a.heard_from}</Field>
				<Field name="Applied">{when(a.created_at)}</Field>
				<Field name="Checked in">{data.checkin ? `${when(data.checkin.checked_in_at)} by ${data.checkin.checked_in_by}` : null}</Field>
			</dl>
			<div className="ar-why">
				<span className="section-tag">Why ExeHacks</span>
				<p>{a.why}</p>
			</div>

			<form className="cc-form ar-review" onSubmit={save}>
				<label className="sponsor-field">
					<span>Decision</span>
					<select value={form.status} onChange={(event) => setForm((f) => ({ ...f, status: event.target.value }))}>
						{APPLICATION_STATUSES.map((status) => (
							<option key={status} value={status}>
								{status}
							</option>
						))}
					</select>
				</label>
				<label className="sponsor-check ar-connection">
					<input type="checkbox" checked={form.connection} onChange={(event) => setForm((f) => ({ ...f, connection: event.target.checked }))} />
					<span>Known connection or mutuals (small boost in the AI suggestion only)</span>
				</label>
				<label className="sponsor-field cc-wide">
					<span>Reviewer notes (team only)</span>
					<textarea value={form.notes} onChange={(event) => setForm((f) => ({ ...f, notes: event.target.value }))} maxLength={4000} rows={3} />
				</label>
				<div className="cc-form-actions cc-wide">
					<button type="submit" className="btn btn-primary" disabled={busy}>
						{busy ? "Saving…" : "Save review"}
					</button>
					{message ? <span className="mono cc-notice">{message}</span> : null}
				</div>
				<p className="cc-faint cc-wide mono">
					{review.decided_by ? `Decision ${review.decided_status} by ${review.decided_by}, ${when(review.decided_at)}` : "No decision recorded yet."}
					{review.updated_by ? ` · last edit ${review.updated_by}` : ""}
				</p>
			</form>

			<AiSuggestion screenings={data.screenings} onRun={screen} running={running} unavailable={unavailable} />
			<EmailDraft key={`${id}-${a.status}`} application={a} templates={templates} />
		</div>
	)
}

function TemplateEditor({ api, templates, setTemplates }) {
	const [which, setWhich] = useState("accepted")
	const current = templates.find((item) => item.status === which)
	const [draft, setDraft] = useState(null)
	const [message, setMessage] = useState("")
	const value = draft && draft.status === which ? draft : current
	if (!current) return null

	async function save(method) {
		setMessage("")
		try {
			const body = await call(`${api}/email-templates/${which}`, method === "PUT" ? { method, body: JSON.stringify({ subject: value.subject, body: value.body }) } : { method })
			setTemplates(body.templates)
			setDraft(null)
			setMessage(method === "PUT" ? "Template saved." : "Back to the default.")
		} catch (cause) {
			setMessage(cause.message)
		}
	}

	return (
		<details className="gcard cc-section ar-templates">
			<summary className="cc-section-title">Decision email templates</summary>
			<p className="cc-faint">
				Placeholders: {"{first_name}"}, {"{last_name}"}, {"{full_name}"}, {"{event_name}"}, {"{event_dates}"}. Shared by the whole team.
			</p>
			<div className="admin-tabs">
				{Object.entries(TEMPLATE_LABEL).map(([status, text]) => (
					<button key={status} type="button" className={status === which ? "btn btn-primary ar-small" : "btn btn-ghost ar-small"} onClick={() => setWhich(status)}>
						{text}
					</button>
				))}
			</div>
			<div className="cc-form">
				<label className="sponsor-field cc-wide">
					<span>Subject</span>
					<input value={value.subject} maxLength={200} onChange={(event) => setDraft({ ...value, status: which, subject: event.target.value })} />
				</label>
				<label className="sponsor-field cc-wide">
					<span>Body</span>
					<textarea value={value.body} maxLength={5000} rows={10} onChange={(event) => setDraft({ ...value, status: which, body: event.target.value })} />
				</label>
				<div className="cc-form-actions cc-wide">
					<button type="button" className="btn btn-primary ar-small" onClick={() => save("PUT")}>
						Save template
					</button>
					{!current.isDefault ? (
						<button type="button" className="btn btn-ghost ar-small" onClick={() => save("DELETE")}>
							Reset to default
						</button>
					) : null}
					<span className="mono cc-faint">{message || (current.isDefault ? "Default text" : `Edited by ${current.updated_by}, ${when(current.updated_at)}`)}</span>
				</div>
			</div>
		</details>
	)
}

export function ApplicationsReview({ base = "/admin" }) {
	const api = apiFor(base)
	const [filters, setFilters] = useState({ status: "", experience: "", level: "", team: "", ai: "", connection: "", sort: "newest" })
	const [query, setQuery] = useState("")
	const [applied, setApplied] = useState("")
	const [result, setResult] = useState(null)
	const [error, setError] = useState("")
	const [selected, setSelected] = useState(null)
	const [templates, setTemplates] = useState([])
	const [version, setVersion] = useState(0)

	const params = new URLSearchParams()
	for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value)
	if (applied) params.set("q", applied)
	const qs = params.toString()

	useEffect(() => {
		let cancel = false
		call(`${api}/applications?${qs}`)
			.then((body) => {
				if (!cancel) {
					setResult(body)
					setError("")
				}
			})
			.catch((cause) => {
				if (!cancel) setError(cause.message)
			})
		return () => {
			cancel = true
		}
	}, [api, qs, version])

	useEffect(() => {
		let cancel = false
		call(`${api}/email-templates`)
			.then((body) => {
				if (!cancel) setTemplates(body.templates)
			})
			.catch(() => {})
		return () => {
			cancel = true
		}
	}, [api])

	const set = (key) => (event) => setFilters((current) => ({ ...current, [key]: event.target.value }))
	const counts = result?.statusCounts || {}

	return (
		<div className="cc ar">
			<p className="mono admin-count">
				{APPLICATION_STATUSES.map((status) => `${status} ${counts[status] || 0}`).join(" · ")}
			</p>

			<TemplateEditor api={api} templates={templates} setTemplates={setTemplates} />

			<form
				className="admin-tools"
				onSubmit={(event) => {
					event.preventDefault()
					setApplied(query.trim())
				}}
			>
				<label className="sponsor-field">
					<span>Search</span>
					<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, email, university…" />
				</label>
				<button type="submit" className="btn btn-ghost">
					Search
				</button>
				<label className="sponsor-field">
					<span>Status</span>
					<select value={filters.status} onChange={set("status")}>
						<option value="">Any</option>
						<option value="admitted">Accepted or confirmed</option>
						{APPLICATION_STATUSES.map((status) => (
							<option key={status} value={status}>
								{status}
							</option>
						))}
					</select>
				</label>
				<label className="sponsor-field">
					<span>AI suggestion</span>
					<select value={filters.ai} onChange={set("ai")}>
						{AI_FILTERS.map((item) => (
							<option key={item.value} value={item.value}>
								{item.label}
							</option>
						))}
					</select>
				</label>
				<label className="sponsor-field">
					<span>Experience</span>
					<select value={filters.experience} onChange={set("experience")}>
						<option value="">Any</option>
						{EXPERIENCE_LEVELS.map((item) => (
							<option key={item.value} value={item.value}>
								{label(EXPERIENCE_LEVELS, item.value)}
							</option>
						))}
					</select>
				</label>
				<label className="sponsor-field">
					<span>Level of study</span>
					<select value={filters.level} onChange={set("level")}>
						<option value="">Any</option>
						{LEVELS_OF_STUDY.map((item) => (
							<option key={item} value={item}>
								{item}
							</option>
						))}
					</select>
				</label>
				<label className="sponsor-field">
					<span>Team</span>
					<select value={filters.team} onChange={set("team")}>
						<option value="">Any</option>
						{TEAM_STATUSES.map((item) => (
							<option key={item.value} value={item.value}>
								{item.label}
							</option>
						))}
					</select>
				</label>
				<label className="sponsor-field">
					<span>Connection</span>
					<select value={filters.connection} onChange={set("connection")}>
						<option value="">Any</option>
						<option value="1">Known connection</option>
					</select>
				</label>
				<label className="sponsor-field">
					<span>Sort</span>
					<select value={filters.sort} onChange={set("sort")}>
						{SORTS.map((item) => (
							<option key={item.value} value={item.value}>
								{item.label}
							</option>
						))}
					</select>
				</label>
				<a className="btn btn-primary" href={`${api}/applications.csv?${qs}`}>
					Download CSV
				</a>
			</form>

			{error ? (
				<p className="sponsor-form-error" role="alert">
					{error}
				</p>
			) : null}
			{!result && !error ? <p className="mono">Loading…</p> : null}

			{result ? (
				<div className="ar-layout">
					<div className="admin-table-wrap ar-list">
						<p className="mono admin-count">{result.count === 1 ? "1 application" : `${result.count} applications`}</p>
						{result.rows.length === 0 ? <p className="cc-faint">No applications match.</p> : null}
						{result.rows.length > 0 ? (
							<table className="admin-table">
								<thead>
									<tr>
										<th scope="col">Name</th>
										<th scope="col">University</th>
										<th scope="col">Status</th>
										<th scope="col">AI</th>
									</tr>
								</thead>
								<tbody>
									{result.rows.map((row) => (
										<tr key={row.id} className={row.id === selected ? "ar-selected" : undefined}>
											<td>
												<button type="button" className="cc-link" onClick={() => setSelected(row.id)}>
													{row.first_name} {row.last_name}
												</button>
												{row.connection ? <span className="cc-faint"> · connection</span> : null}
											</td>
											<td>{row.school}</td>
											<td>
												<Pill status={row.status} />
											</td>
											<td className="mono">{row.ai_score == null ? "" : `${row.ai_score} ${row.ai_suggestion === "review" ? "look" : row.ai_suggestion}`}</td>
										</tr>
									))}
								</tbody>
							</table>
						) : null}
					</div>
					<div className="gcard cc-section ar-panel">
						{selected ? (
							<Detail key={selected} api={api} id={selected} templates={templates} onChanged={() => setVersion((v) => v + 1)} />
						) : (
							<p className="cc-faint">Pick an application to review it.</p>
						)}
					</div>
				</div>
			) : null}
		</div>
	)
}
