-- ExeHacks 2027 Command Centre tracker (/admin). Additive only: no existing table changes.
-- One row per tracker item. The team edits these from /admin; the Worker checks the
-- Cloudflare Access JWT and the admin allow-list before any read or write.
-- section values live in worker/command-centre.js (SECTIONS), so new sections need no migration.
CREATE TABLE IF NOT EXISTS command_centre_items (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	section TEXT NOT NULL,
	title TEXT NOT NULL,
	detail TEXT,
	status TEXT,
	tone TEXT NOT NULL DEFAULT '' CHECK (tone IN ('', 'success', 'warning', 'danger')),
	owner TEXT,
	due TEXT,
	link TEXT,
	done INTEGER NOT NULL DEFAULT 0 CHECK (done IN (0, 1)),
	sort INTEGER NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_by TEXT
);
CREATE INDEX IF NOT EXISTS command_centre_items_section ON command_centre_items (section, done, sort, id);
