const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/
const JSON_LIMIT = 200
const CSV_LIMIT = 10000

export async function listTables(db) {
	const { results } = await db
		.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`)
		.all()
	return (results || []).map((row) => row.name).filter((name) => IDENT.test(name))
}

export async function readTable(db, table, { search = "", limit = JSON_LIMIT, offset = 0 } = {}) {
	const tables = await listTables(db)
	if (!tables.includes(table) || !IDENT.test(table)) return null

	const columns = await columnNames(db, table)
	const { where, binds } = searchClause(columns, search)
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
	}
}

export async function readTableCsv(db, table, search = "") {
	const page = await readTable(db, table, { search, limit: CSV_LIMIT, offset: 0 })
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
	const where = `WHERE ${columns.map((name) => `CAST(${name} AS TEXT) LIKE ? ESCAPE '\\'`).join(" OR ")}`
	return { where, binds: columns.map(() => pattern) }
}

function orderBy(columns) {
	const parts = []
	if (columns.includes("created_at")) parts.push("created_at DESC")
	if (columns.includes("id")) parts.push("id DESC")
	return parts.length ? `ORDER BY ${parts.join(", ")}` : ""
}
