-- Sponsor enquiries from /sponsor and the home Sponsor section (POST /api/sponsor).
-- interest matches the form select: track, workshop, booth, judging, general.
CREATE TABLE IF NOT EXISTS sponsor_enquiries (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	name TEXT NOT NULL,
	email TEXT NOT NULL COLLATE NOCASE,
	company TEXT NOT NULL,
	interest TEXT NOT NULL CHECK (interest IN ('track', 'workshop', 'booth', 'judging', 'general')),
	message TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS sponsor_enquiries_email_created ON sponsor_enquiries (email, created_at);
