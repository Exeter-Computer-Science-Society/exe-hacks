"use client"

import { useEffect, useState } from "react"

import { apiFor, call, when } from "../ApplicationsReview/api"

export function CheckIn({ base = "/admin" }) {
	const api = apiFor(base)
	const [query, setQuery] = useState("")
	const [applied, setApplied] = useState("")
	const [everyone, setEveryone] = useState(false)
	const [result, setResult] = useState(null)
	const [error, setError] = useState("")
	const [busy, setBusy] = useState(0)
	const [version, setVersion] = useState(0)

	const params = new URLSearchParams({ sort: "name", limit: "100" })
	if (!everyone) params.set("status", "admitted")
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

	async function toggle(row) {
		const checkingIn = !row.checked_in_at
		if (checkingIn && row.status !== "accepted" && row.status !== "confirmed") {
			if (!window.confirm(`${row.first_name} is "${row.status}", not accepted. Check them in anyway?`)) return
		}
		setBusy(row.id)
		try {
			await call(`${api}/applications/${row.id}/checkin`, { method: "POST", body: JSON.stringify({ checked_in: checkingIn }) })
			setVersion((v) => v + 1)
		} catch (cause) {
			setError(cause.message)
		} finally {
			setBusy(0)
		}
	}

	const admitted = (result?.statusCounts?.accepted || 0) + (result?.statusCounts?.confirmed || 0)

	return (
		<div className="cc ar">
			<p className="mono admin-count">
				{result ? `${result.checkedIn} checked in · ${admitted} accepted or confirmed` : "Loading…"}
			</p>
			<form
				className="admin-tools"
				onSubmit={(event) => {
					event.preventDefault()
					setApplied(query.trim())
				}}
			>
				<label className="sponsor-field">
					<span>Find a hacker</span>
					<input type="search" value={query} autoFocus onChange={(event) => setQuery(event.target.value)} placeholder="First or last name, email" />
				</label>
				<button type="submit" className="btn btn-primary">
					Search
				</button>
				<label className="sponsor-check">
					<input type="checkbox" checked={everyone} onChange={(event) => setEveryone(event.target.checked)} />
					<span>Include people not accepted</span>
				</label>
			</form>
			{error ? (
				<p className="sponsor-form-error" role="alert">
					{error}
				</p>
			) : null}
			{result && result.rows.length === 0 ? <p className="cc-faint">Nobody matches.</p> : null}
			<ul className="cc-list ar-checkin">
				{(result?.rows || []).map((row) => (
					<li key={row.id} className={`cc-item${row.checked_in_at ? " ar-in" : ""}`}>
						<span className="mono">{row.checked_in_at ? "IN" : "  "}</span>
						<div className="cc-item-body">
							<div className="cc-item-title">
								{row.first_name} {row.last_name}
							</div>
							<p className="cc-item-meta mono">
								{row.email} · {row.school} · {row.status}
								{row.checked_in_at ? ` · checked in ${when(row.checked_in_at)}` : ""}
							</p>
						</div>
						<button type="button" className={row.checked_in_at ? "btn btn-ghost ar-small" : "btn btn-primary ar-small"} disabled={busy === row.id} onClick={() => toggle(row)}>
							{row.checked_in_at ? "Undo" : "Check in"}
						</button>
					</li>
				))}
			</ul>
		</div>
	)
}
