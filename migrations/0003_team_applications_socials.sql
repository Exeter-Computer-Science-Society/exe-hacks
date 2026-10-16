-- Required in the form and Worker; nullable here because SQLite ALTER TABLE cannot add NOT NULL without a default.
ALTER TABLE team_applications ADD COLUMN discord TEXT;
ALTER TABLE team_applications ADD COLUMN linkedin TEXT;
ALTER TABLE team_applications ADD COLUMN github TEXT;
