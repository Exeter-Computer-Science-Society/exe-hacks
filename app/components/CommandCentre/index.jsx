"use client"

import { useCallback, useEffect, useState } from "react"

const EMPTY = { title: "", detail: "", status: "", tone: "", owner: "", due: "", link: "", sort: "" }

async function call(path, options = {}) {
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
	if (!response.ok || body.ok === false) throw new Error(body.error || "Something went wrong. Try again.")
	return body
}

function when(value) {
	if (!value) return ""
	const date = new Date(/Z$|[+-]\d\d:?\d\d$/.test(value) ? value : `${value.replace(" ", "T")}Z`)
	if (Number.isNaN(date.getTime())) return ""
	return date.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" })
}

function Metric({ value, label, detail, tone }) {
	return (
		<div className={`stat cc-metric${tone ? ` cc-tone-${tone}` : ""}`}>
			<div className="num">{value}</div>
			<div className="lab">{label}</div>
			{detail ? <p className="cc-metric-detail">{detail}</p> : null}
		</div>
	)
}

function ItemForm({ initial, tones, onCancel, onSave, saving }) {
	const [form, setForm] = useState({ ...EMPTY, ...initial })
	const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
	return (
		<form
			className="cc-form"
			onSubmit={(event) => {
				event.preventDefault()
				onSave(form)
			}}
		>
			<label className="sponsor-field cc-wide">
				<span>Title</span>
				<input value={form.title} onChange={set("title")} maxLength={160} required />
			</label>
			<label className="sponsor-field cc-wide">
				<span>Detail</span>
				<textarea value={form.detail || ""} onChange={set("detail")} maxLength={1000} rows={3} />
			</label>
			<label className="sponsor-field">
				<span>Status</span>
				<input value={form.status || ""} onChange={set("status")} maxLength={60} placeholder="e.g. Waiting on reply" />
			</label>
			<label className="sponsor-field">
				<span>Colour</span>
				<select value={form.tone || ""} onChange={set("tone")}>
					{tones.map((tone) => (
						<option key={tone.value} value={tone.value}>
							{tone.label}
						</option>
					))}
				</select>
			</label>
			<label className="sponsor-field">
				<span>Owner</span>
				<input value={form.owner || ""} onChange={set("owner")} maxLength={80} />
			</label>
			<label className="sponsor-field">
				<span>Due</span>
				<input value={form.due || ""} onChange={set("due")} maxLength={40} placeholder="e.g. Fri 21 Nov" />
			</label>
			<label className="sponsor-field">
				<span>Link</span>
				<input value={form.link || ""} onChange={set("link")} maxLength={500} placeholder="https://" />
			</label>
			<label className="sponsor-field">
				<span>Order</span>
				<input value={form.sort ?? ""} onChange={set("sort")} inputMode="numeric" placeholder="0" />
			</label>
			<div className="cc-form-actions cc-wide">
				<button type="submit" className="btn btn-primary" disabled={saving}>
					{saving ? "Saving…" : "Save"}
				</button>
				<button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>
					Cancel
				</button>
			</div>
		</form>
	)
}

function Item({ item, tones, onPatch, onDelete, busy }) {
	const [editing, setEditing] = useState(false)
	if (editing) {
		return (
			<li className="cc-item">
				<ItemForm
					initial={item}
					tones={tones}
					saving={busy}
					onCancel={() => setEditing(false)}
					onSave={async (form) => {
						if (await onPatch(item.id, form)) setEditing(false)
					}}
				/>
			</li>
		)
	}
	return (
		<li className={`cc-item${item.done ? " cc-done" : ""}`}>
			<label className="cc-check" title={item.done ? "Mark as not done" : "Mark as done"}>
				<input type="checkbox" checked={Boolean(item.done)} disabled={busy} onChange={(event) => onPatch(item.id, { done: event.target.checked })} />
				<span className="sr-only">Done</span>
			</label>
			<div className="cc-item-body">
				<div className="cc-item-head">
					<span className="cc-item-title">{item.title}</span>
					{item.status ? <span className={`cc-pill${item.tone ? ` cc-tone-${item.tone}` : ""}`}>{item.status}</span> : null}
				</div>
				{item.detail ? <p className="cc-item-detail">{item.detail}</p> : null}
				<p className="cc-item-meta mono">
					{[item.owner && `Owner: ${item.owner}`, item.due && `Due: ${item.due}`].filter(Boolean).join(" · ")}
					{item.link ? (
						<>
							{item.owner || item.due ? " · " : ""}
							<a href={item.link} target="_blank" rel="noopener noreferrer">
								Open link
							</a>
						</>
					) : null}
					{item.updated_by ? (
						<span className="cc-faint">
							{item.owner || item.due || item.link ? " · " : ""}
							Edited {when(item.updated_at)} by {item.updated_by}
						</span>
					) : null}
				</p>
			</div>
			<div className="cc-item-actions">
				<button type="button" className="cc-link" onClick={() => setEditing(true)} disabled={busy}>
					Edit
				</button>
				<button
					type="button"
					className="cc-link"
					disabled={busy}
					onClick={() => {
						if (window.confirm(`Remove "${item.title}"?`)) onDelete(item.id)
					}}
				>
					Remove
				</button>
			</div>
		</li>
	)
}

export function CommandCentre({ base = "/admin" }) {
	const api = base === "/team" ? "/api/team" : "/api/admin"
	const [data, setData] = useState(null)
	const [error, setError] = useState("")
	const [notice, setNotice] = useState("")
	const [busy, setBusy] = useState(false)
	const [adding, setAdding] = useState("")
	const [showDone, setShowDone] = useState(false)

	const load = useCallback(async () => {
		try {
			const body = await call(`${api}/overview`)
			setData(body)
			setError("")
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Could not load the Command Centre.")
		}
	}, [api])

	useEffect(() => {
		let cancel = false
		call(`${api}/overview`)
			.then((body) => {
				if (!cancel) setData(body)
			})
			.catch((cause) => {
				if (!cancel) setError(cause instanceof Error ? cause.message : "Could not load the Command Centre.")
			})
		return () => {
			cancel = true
		}
	}, [api])

	async function mutate(work, message) {
		setBusy(true)
		setNotice("")
		try {
			await work()
			await load()
			if (message) setNotice(message)
			return true
		} catch (cause) {
			setNotice(cause instanceof Error ? cause.message : "Something went wrong. Try again.")
			return false
		} finally {
			setBusy(false)
		}
	}

	const patch = (id, fields) =>
		mutate(() => call(`${api}/items/${id}`, { method: "PATCH", body: JSON.stringify(fields) }))
	const remove = (id) => mutate(() => call(`${api}/items/${id}`, { method: "DELETE" }), "Item removed.")
	const create = (section, form) =>
		mutate(() => call(`${api}/items`, { method: "POST", body: JSON.stringify({ ...form, section }) }), "Item added.")

	if (error && !data) {
		return (
			<p className="sponsor-form-error" role="alert">
				{error}
			</p>
		)
	}
	if (!data) return <p className="mono">Loading…</p>

	const { event, counts, sections, tones, items, applicationsOpen } = data
	const hackers = counts.hackers
	const accepted = (hackers.byStatus?.accepted || 0) + (hackers.byStatus?.confirmed || 0)
	const openItems = items.filter((item) => !item.done)
	const blocking = openItems.filter((item) => item.tone === "danger")

	return (
		<div className="cc">
			<p className="mono admin-count">
				Signed in as {data.viewer} · updated {when(data.generatedAt)} UK time ·{" "}
				<button type="button" className="cc-link" onClick={load} disabled={busy}>
					Refresh
				</button>{" "}
				· <a href={`${base}/signups/`}>Signups and applicant data</a>
				{base === "/team" ? (
					<>
						{" "}
						· <a href="/auth/logout">Sign out</a>
					</>
				) : null}
			</p>

			<div className="cc-metrics">
				<Metric value={event.daysToGo ?? "?"} label="Days to go" detail={event.window} />
				<Metric
					value={`${hackers.total} / ${event.capacity}`}
					label="Hacker applications"
					detail={applicationsOpen ? `Open · ${hackers.lastWeek} in the last 7 days` : "Form closed"}
					tone={applicationsOpen ? "" : "warning"}
				/>
				<Metric value={accepted} label="Accepted or confirmed" detail={`${hackers.byStatus?.pending || 0} pending review`} />
				<Metric value={counts.interest.total} label="Interest sign-ups" detail={counts.interest.latest ? `Latest ${when(counts.interest.latest)}` : ""} />
				<Metric value={counts.teamApplications.total} label="Core team applications" />
				<Metric value={blocking.length} label="Blocking items" detail={`${openItems.length} open items`} tone={blocking.length ? "danger" : "success"} />
			</div>

			{blocking.length > 0 && (
				<div className="cc-callout" role="note">
					<strong>Blocking:</strong> {blocking.map((item) => item.title).join(", ")}
				</div>
			)}

			{notice && (
				<p className="mono cc-notice" role="status">
					{notice}
				</p>
			)}

			<nav className="admin-tabs cc-toc" aria-label="Sections">
				{sections.map((section) => (
					<a key={section.key} className="btn btn-ghost" href={`#cc-${section.key}`}>
						{section.label}
					</a>
				))}
				<label className="cc-toggle mono">
					<input type="checkbox" checked={showDone} onChange={(event) => setShowDone(event.target.checked)} /> Show done items
				</label>
			</nav>

			{items.length === 0 && (
				<p className="cc-empty">The tracker is empty. Add the first item to any section below.</p>
			)}

			<div className="cc-sections">
				{sections.map((section) => {
					const all = items.filter((item) => item.section === section.key)
					const shown = showDone ? all : all.filter((item) => !item.done)
					const hidden = all.length - shown.length
					return (
						<section key={section.key} id={`cc-${section.key}`} className="gcard cc-section">
							<header className="cc-section-head">
								<div>
									<h2 className="cc-section-title">{section.label}</h2>
									<p className="cc-section-hint">{section.hint}</p>
								</div>
								<button
									type="button"
									className="btn btn-ghost cc-add"
									onClick={() => setAdding(adding === section.key ? "" : section.key)}
									disabled={busy}
								>
									{adding === section.key ? "Close" : "Add item"}
								</button>
							</header>
							{adding === section.key && (
								<ItemForm
									initial={EMPTY}
									tones={tones}
									saving={busy}
									onCancel={() => setAdding("")}
									onSave={async (form) => {
										if (await create(section.key, form)) setAdding("")
									}}
								/>
							)}
							{shown.length > 0 ? (
								<ul className="cc-list">
									{shown.map((item) => (
										<Item key={item.id} item={item} tones={tones} busy={busy} onPatch={patch} onDelete={remove} />
									))}
								</ul>
							) : (
								<p className="cc-faint">Nothing open here.</p>
							)}
							{hidden > 0 && <p className="cc-faint mono">{hidden} done and hidden.</p>}
						</section>
					)
				})}
			</div>
		</div>
	)
}
