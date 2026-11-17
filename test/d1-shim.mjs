// Minimal D1 stand-in over node:sqlite so tests run without Cloudflare.
import { readFileSync, readdirSync } from "node:fs"
import { DatabaseSync } from "node:sqlite"

export function createDb({ migrate = true } = {}) {
	const sqlite = new DatabaseSync(":memory:")
	if (migrate) {
		for (const file of readdirSync(new URL("../migrations/", import.meta.url)).sort()) {
			sqlite.exec(readFileSync(new URL(`../migrations/${file}`, import.meta.url), "utf8"))
		}
	}
	const statement = (sql, params = []) => ({
		bind: (...values) => statement(sql, values),
		first: async () => sqlite.prepare(sql).get(...params) ?? null,
		all: async () => ({ results: sqlite.prepare(sql).all(...params) }),
		run: async () => {
			const info = sqlite.prepare(sql).run(...params)
			return { meta: { changes: Number(info.changes) } }
		},
	})
	return { prepare: (sql) => statement(sql), sqlite }
}
