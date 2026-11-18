"use client"

import { useEffect, useState } from "react"

// Filter dropdowns per table. Options come from the API (result.options[optionsKey]);
// items are strings or { value, label }.
const FILTERS = {
	team_applications: [
		{ key: "role", label: "Role", optionsKey: "roles", any: "Any role" },
		{ key: "year", label: "Course / year", optionsKey: "years" },
		{
			key: "availability",
			label: "Available 6–7 Feb",
			static: [
				{ value: "yes", label: "Yes" },
				{ value: "partly", label: "Partly" },
				{ value: "no", label: "No" },
			],
		},
	],
	hacker_applications: [
		{ key: "status", label: "Status", optionsKey: "statuses" },
		{ key: "level", label: "Level of study", optionsKey: "levels" },
		{ key: "school", label: "University / school", optionsKey: "schools" },
		{ key: "experience", label: "Experience", optionsKey: "experience" },
		{ key: "team", label: "Team status", optionsKey: "teams" },
		{ key: "heard", label: "Heard from", optionsKey: "heard" },
	],
}

const NOUNS = {
	team_applications: ["applicant", "applicants"],
	hacker_applications: ["hacker application", "hacker applications"],
}

function optionValue(item) {
	return typeof item === "string" ? item : item.value
}

function optionLabel(item) {
	if (typeof item === "string") return item
	return item.label.split(":")[0]
}

export function AdminConsole() {
	const [tables, setTables] = useState([])
	const [table, setTable] = useState("")
	const [query, setQuery] = useState("")
	const [applied, setApplied] = useState("")
	const [filters, setFilters] = useState({})
	const [result, setResult] = useState(null)
	const [error, setError] = useState("")
	const [loading, setLoading] = useState(true)

	const tableFilters = FILTERS[table] || []
	const activeFilters = tableFilters.filter((f) => filters[f.key])
	const filterKey = JSON.stringify(filters)

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

	function buildParams() {
		const params = new URLSearchParams()
		if (applied) params.set("q", applied)
		for (const f of tableFilters) if (filters[f.key]) params.set(f.key, filters[f.key])
		return params
	}

	useEffect(() => {
		if (!table) return undefined
		let cancel = false
		async function loadRows() {
			setLoading(true)
			setError("")
			try {
				const params = buildParams()
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [table, applied, filterKey])

	const csvParams = buildParams()
	const options = result?.options || {}
	const filtered = Boolean(applied || activeFilters.length)
	const csvHref = table
		? `/api/admin/tables/${encodeURIComponent(table)}.csv${csvParams.toString() ? `?${csvParams}` : ""}`
		: ""
	const nouns = NOUNS[table]

	function clearAll() {
		setQuery("")
		setApplied("")
		setFilters({})
	}

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
								clearAll()
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
				{tableFilters.map((f) => {
					const items = f.static || options[f.optionsKey] || []
					return (
						<label className="sponsor-field" htmlFor={`admin-${f.key}`} key={f.key}>
							<span>{f.label}</span>
							<select
								id={`admin-${f.key}`}
								value={filters[f.key] || ""}
								onChange={(event) => setFilters((current) => ({ ...current, [f.key]: event.target.value }))}
							>
								<option value="">{f.any || "Any"}</option>
								{items.map((item) => (
									<option key={optionValue(item)} value={optionValue(item)}>
										{optionLabel(item)}
									</option>
								))}
							</select>
						</label>
					)
				})}
				{filtered && tableFilters.length > 0 && (
					<button type="button" className="btn btn-ghost" onClick={clearAll}>
						Clear filters
					</button>
				)}
				{csvHref && (
					<a className="btn btn-primary" href={csvHref}>
						{filtered ? "Download filtered CSV" : "Download CSV"}
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
					{result.count} {nouns ? (result.count === 1 ? nouns[0] : nouns[1]) : result.count === 1 ? "row" : "rows"}
					{applied ? ` matching “${applied}”` : ""}
					{activeFilters.map((f) => ` · ${f.label.toLowerCase()}: ${filters[f.key]}`).join("")}
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
