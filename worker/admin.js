const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/
const INTERNAL = /^(_cf_|sqlite_|d1_)/i
export const TEAM_ROLES = ["Sponsorship", "Logistics", "Marketing & Social", "Design", "Tech", "Volunteer Coordinator", "Welfare", "Finance"]
const AVAILABILITY = ["yes", "partly", "no"]
const JSON_LIMIT = 200
const CSV_LIMIT = 10000

export async function listTables(db) {
	const { results } = await db
		.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite\\_%' ESCAPE '\\' ORDER BY name`)
		.all()
	return (results || [])
		.map((row) => row.name)
		.filter((name) => IDENT.test(name) && !INTERNAL.test(name))
}

export async function readTable(db, table, { search = "", filters = {}, limit = JSON_LIMIT, offset = 0 } = {}) {
	const tables = await listTables(db)
	if (!tables.includes(table) || !IDENT.test(table)) return null

	const columns = await columnNames(db, table)
	const clauses = []
	const binds = []
	const found = searchClause(columns, search)
	if (found.where) {
		clauses.push(found.where)
		binds.push(...found.binds)
	}
	const applied = {}
	let options
	if (table === "team_applications") {
		const role = String(filters.role || "")
		if (TEAM_ROLES.includes(role)) {
			clauses.push(`instr('; ' || roles || '; ', '; ' || ? || '; ') > 0`)
			binds.push(role)
			applied.role = role
		}
		const year = String(filters.year || "").trim().slice(0, 200)
		if (year) {
			clauses.push(`course_year = ? COLLATE NOCASE`)
			binds.push(year)
			applied.year = year
		}
		const availability = String(filters.availability || "")
		if (AVAILABILITY.includes(availability)) {
			clauses.push(`availability = ?`)
			binds.push(availability)
			applied.availability = availability
		}
		const { results } = await db
			.prepare(`SELECT DISTINCT course_year AS value FROM team_applications WHERE course_year IS NOT NULL AND course_year != '' ORDER BY course_year COLLATE NOCASE`)
			.all()
		options = { roles: TEAM_ROLES, years: (results || []).map((r) => r.value), availability: AVAILABILITY }
	}
	const where = clauses.length ? `WHERE ${clauses.map((c) => `(${c})`).join(" AND ")}` : ""
	const order = orderBy(columns)
	const total = await db.prepare(`SELECT COUNT(*) AS count FROM ${table} ${where}`).bind(...binds).first()
	const rows = await db
		.prepare(`SELECT * FROM ${table} ${where} ${order} LIMIT ? OFFSET ?`)
		.bind(...binds, limit, offset)
		.all()

	return {
		table,
		columns,
		count: Number(total?.count || 0),
		rows: rows.results || [],
		filters: applied,
		...(options ? { options } : {}),
	}
}

export async function readTableCsv(db, table, search = "", filters = {}) {
	const page = await readTable(db, table, { search, filters, limit: CSV_LIMIT, offset: 0 })
	return page
}

async function columnNames(db, table) {
	const { results } = await db.prepare(`PRAGMA table_info(${table})`).all()
	return (results || []).map((column) => column.name).filter((name) => IDENT.test(name))
}

function searchClause(columns, search) {
	const term = String(search || "").trim().slice(0, 200)
	if (!term || columns.length === 0) return { where: "", binds: [] }
	const pattern = `%${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`
	return { where: `${columns.map((name) => `CAST(${name} AS TEXT) LIKE ? ESCAPE '\\'`).join(" OR ")}`, binds: columns.map(() => pattern) }
}

function orderBy(columns) {
	const parts = []
	if (columns.includes("created_at")) parts.push("created_at DESC")
	if (columns.includes("id")) parts.push("id DESC")
	return parts.length ? `ORDER BY ${parts.join(", ")}` : ""
}
