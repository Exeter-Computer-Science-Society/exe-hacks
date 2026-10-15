"use client"

import { useEffect, useState } from "react"

export function AdminConsole() {
	const [tables, setTables] = useState([])
	const [table, setTable] = useState("")
	const [query, setQuery] = useState("")
	const [applied, setApplied] = useState("")
	const [result, setResult] = useState(null)
	const [error, setError] = useState("")
	const [loading, setLoading] = useState(true)

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
				setTable(names.includes("interest") ? "interest" : names[0] || "")
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
	}, [table, applied])

	const csvParams = new URLSearchParams()
	if (applied) csvParams.set("q", applied)
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
					{result.count} {result.count === 1 ? "row" : "rows"}
					{applied ? ` matching “${applied}”` : ""}
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
