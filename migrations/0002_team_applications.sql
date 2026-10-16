CREATE TABLE IF NOT EXISTS team_applications (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	full_name TEXT NOT NULL,
	email TEXT NOT NULL COLLATE NOCASE,
	phone TEXT NOT NULL,
	course_year TEXT NOT NULL,
	roles TEXT NOT NULL,
	why TEXT NOT NULL,
	experience TEXT,
	availability TEXT NOT NULL CHECK (availability IN ('yes', 'partly', 'no')),
	consent INTEGER NOT NULL,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS team_applications_email ON team_applications (email);
