-- ExeHacks 2027 hacker applications (POST /api/apply). 18+ only, enforced in worker/apply.js.
-- status drives acceptance waves: pending -> accepted / waitlisted / rejected, then confirmed / declined.
CREATE TABLE IF NOT EXISTS hacker_applications (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	first_name TEXT NOT NULL,
	last_name TEXT NOT NULL,
	email TEXT NOT NULL UNIQUE COLLATE NOCASE,
	phone TEXT,
	age TEXT NOT NULL,
	school TEXT NOT NULL,
	level_of_study TEXT NOT NULL,
	course TEXT NOT NULL,
	graduation_year INTEGER NOT NULL,
	country TEXT NOT NULL,
	dietary TEXT,
	accessibility TEXT,
	tshirt_size TEXT NOT NULL,
	hackathons_attended TEXT NOT NULL CHECK (hackathons_attended IN ('0', '1-2', '3+')),
	experience_level TEXT NOT NULL CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
	team_status TEXT NOT NULL CHECK (team_status IN ('have_team', 'looking', 'solo')),
	github TEXT,
	linkedin TEXT,
	discord TEXT,
	why TEXT NOT NULL,
	heard_from TEXT NOT NULL,
	mlh_code_of_conduct INTEGER NOT NULL,
	mlh_data_sharing INTEGER NOT NULL,
	mlh_marketing INTEGER NOT NULL DEFAULT 0,
	privacy_consent INTEGER NOT NULL,
	status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'waitlisted', 'rejected', 'confirmed', 'declined')),
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS hacker_applications_status ON hacker_applications (status);
CREATE INDEX IF NOT EXISTS hacker_applications_created ON hacker_applications (created_at);
