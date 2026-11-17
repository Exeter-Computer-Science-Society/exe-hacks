-- Applicant review, AI screener suggestions, decision email templates and event-day check-in.
-- Additive only: new tables, no change to hacker_applications. The decision itself is still
-- hacker_applications.status; these tables hold who decided, notes and the extras.

-- One row per application once anyone reviews it.
CREATE TABLE IF NOT EXISTS application_reviews (
	application_id INTEGER PRIMARY KEY,
	notes TEXT,
	-- Reviewer-set flag: a known connection or mutuals. Small weight in the AI suggestion only.
	connection INTEGER NOT NULL DEFAULT 0 CHECK (connection IN (0, 1)),
	decided_status TEXT,
	decided_by TEXT,
	decided_at TEXT,
	updated_by TEXT,
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- AI screener runs. Suggestions only: nothing here changes an application's status.
CREATE TABLE IF NOT EXISTS application_screenings (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	application_id INTEGER NOT NULL,
	score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
	suggestion TEXT NOT NULL CHECK (suggestion IN ('accept', 'waitlist', 'review')),
	rationale TEXT NOT NULL,
	signals TEXT NOT NULL,
	model TEXT,
	created_by TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS application_screenings_app ON application_screenings (application_id, id);

-- Decision email drafts, edited on the applications page. Defaults live in worker/review.js.
CREATE TABLE IF NOT EXISTS email_templates (
	status TEXT PRIMARY KEY CHECK (status IN ('accepted', 'waitlisted', 'rejected')),
	subject TEXT NOT NULL,
	body TEXT NOT NULL,
	updated_by TEXT,
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Event-day check-in.
CREATE TABLE IF NOT EXISTS checkins (
	application_id INTEGER PRIMARY KEY,
	checked_in_at TEXT NOT NULL DEFAULT (datetime('now')),
	checked_in_by TEXT
);
