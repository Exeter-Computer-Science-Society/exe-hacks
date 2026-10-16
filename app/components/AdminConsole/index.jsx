"use client"

import { useEffect, useState } from "react"

export function AdminConsole() {
	const [tables, setTables] = useState([])
	const [table, setTable] = useState("")
	const [query, setQuery] = useState("")
	const [applied, setApplied] = useState("")
	const [role, setRole] = useState("")
	const [year, setYear] = useState("")
	const [availability, setAvailability] = useState("")
	const [result, setResult] = useState(null)
	const [error, setError] = useState("")
	const [loading, setLoading] = useState(true)

	const isTeam = table === "team_applications"

	useEffect(() => {
		let cancel = false
		async function loadTables() {
			try {
				const response = await fetch("/api/admin/tables", { headers: { accept: "application/json" } })
				const body = await response.json()
				if (!response.ok) throw new Error(body.error || "Could not load tables.")
				if (cancel) return
				const names = Array.isArray(body.tables) ? body.tables : []
				setTables(names)
				setTable(names.includes("team_applications") ? "team_applications" : names.includes("interest") ? "interest" : names[0] || "")
			} catch (cause) {
				if (!cancel) setError(cause instanceof Error ? cause.message : "Could not load tables.")
			} finally {
				if (!cancel) setLoading(false)
			}
		}
		loadTables()
		return () => {
			cancel = true
		}
	}, [])

	useEffect(() => {
		if (!table) return undefined
		let cancel = false
		async function loadRows() {
			setLoading(true)
			setError("")
			try {
				const params = new URLSearchParams()
				if (applied) params.set("q", applied)
				if (isTeam && role) params.set("role", role)
				if (isTeam && year) params.set("year", year)
				if (isTeam && availability) params.set("availability", availability)
				const suffix = params.toString() ? `?${params}` : ""
				const response = await fetch(`/api/admin/tables/${encodeURIComponent(table)}${suffix}`, {
					headers: { accept: "application/json" },
				})
				const body = await response.json()
				if (!response.ok) throw new Error(body.error || "Could not load that table.")
				if (!cancel) setResult(body)
			} catch (cause) {
				if (!cancel) {
					setResult(null)
					setError(cause instanceof Error ? cause.message : "Could not load that table.")
				}
			} finally {
				if (!cancel) setLoading(false)
			}
		}
		loadRows()
		return () => {
			cancel = true
		}
	}, [table, applied, role, year, availability, isTeam])

	const csvParams = new URLSearchParams()
	if (applied) csvParams.set("q", applied)
	if (isTeam && role) csvParams.set("role", role)
	if (isTeam && year) csvParams.set("year", year)
	if (isTeam && availability) csvParams.set("availability", availability)
	const options = result?.options || {}
	const filtered = Boolean(applied || (isTeam && (role || year || availability)))
	const csvHref = table
		? `/api/admin/tables/${encodeURIComponent(table)}.csv${csvParams.toString() ? `?${csvParams}` : ""}`
		: ""

	return (
		<div className="admin-console">
			{tables.length > 0 && (
				<div className="admin-tabs" role="tablist" aria-label="D1 tables">
					{tables.map((name) => (
						<button
							key={name}
							type="button"
							className={name === table ? "btn btn-primary" : "btn btn-ghost"}
							onClick={() => {
								setTable(name)
								setQuery("")
								setApplied("")
								setRole("")
								setYear("")
								setAvailability("")
							}}
						>
							{name}
						</button>
					))}
				</div>
			)}

			<form
				className="admin-tools"
				onSubmit={(event) => {
					event.preventDefault()
					setApplied(query.trim())
				}}
			>
				<label className="sponsor-field" htmlFor="admin-search">
					<span>Search</span>
					<input
						id="admin-search"
						type="search"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Name, email, university…"
					/>
				</label>
				<button type="submit" className="btn btn-ghost">
					Search
				</button>
				{isTeam && (
					<>
						<label className="sponsor-field" htmlFor="admin-role">
							<span>Role</span>
							<select id="admin-role" value={role} onChange={(event) => setRole(event.target.value)}>
								<option value="">Any role</option>
								{(options.roles || []).map((name) => (
									<option key={name} value={name}>
										{name}
									</option>
								))}
							</select>
						</label>
						<label className="sponsor-field" htmlFor="admin-year">
							<span>Course / year</span>
							<select id="admin-year" value={year} onChange={(event) => setYear(event.target.value)}>
								<option value="">Any</option>
								{(options.years || []).map((name) => (
									<option key={name} value={name}>
										{name}
									</option>
								))}
							</select>
						</label>
						<label className="sponsor-field" htmlFor="admin-availability">
							<span>Available 6–7 Feb</span>
							<select id="admin-availability" value={availability} onChange={(event) => setAvailability(event.target.value)}>
								<option value="">Any</option>
								<option value="yes">Yes</option>
								<option value="partly">Partly</option>
								<option value="no">No</option>
							</select>
						</label>
						{filtered && (
							<button
								type="button"
								className="btn btn-ghost"
								onClick={() => {
									setQuery("")
									setApplied("")
									setRole("")
									setYear("")
									setAvailability("")
								}}
							>
								Clear filters
							</button>
						)}
					</>
				)}
				{csvHref && (
					<a className="btn btn-primary" href={csvHref}>
						Download CSV
					</a>
				)}
			</form>

			{error && (
				<p className="sponsor-form-error" role="alert">
					{error}
				</p>
			)}

			{result && (
				<p className="mono admin-count">
					{result.count} {isTeam ? (result.count === 1 ? "applicant" : "applicants") : result.count === 1 ? "row" : "rows"}
					{applied ? ` matching “${applied}”` : ""}
					{isTeam && role ? ` · role: ${role}` : ""}
					{isTeam && year ? ` · ${year}` : ""}
					{isTeam && availability ? ` · available: ${availability}` : ""}
					{table === "interest" ? " · newest first" : ""}
				</p>
			)}

			{loading && <p className="mono">Loading…</p>}

			{result && result.rows.length === 0 && !loading && <p>No rows.</p>}

			{result && result.rows.length > 0 && (
				<div className="admin-table-wrap">
					<table className="admin-table">
						<thead>
							<tr>
								{result.columns.map((column) => (
									<th key={column} scope="col">
										{column}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{result.rows.map((row, index) => (
								<tr key={row.id ?? index}>
									{result.columns.map((column) => (
										<td key={column}>{row[column] == null ? "" : String(row[column])}</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	)
}
