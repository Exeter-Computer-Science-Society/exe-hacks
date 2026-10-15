export function toCsv(columns, rows) {
	const lines = [columns.map(csvCell).join(",")]
	for (const row of rows) {
		lines.push(columns.map((key) => csvCell(row?.[key])).join(","))
	}
	return `${lines.join("\r\n")}\r\n`
}

export function csvCell(value) {
	const raw = value == null ? "" : String(value)
	const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw
	if (/[",\r\n]/.test(safe)) return `"${safe.replaceAll('"', '""')}"`
	return safe
}
