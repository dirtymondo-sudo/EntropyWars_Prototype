-- 002_economy.sql — account-economy columns (formerly added ad-hoc by
-- server.js ensureEconomyColumns). On the live database these columns
-- already exist; the runner tolerates the "duplicate column" errors and
-- records the migration as applied.

ALTER TABLE players ADD COLUMN gold INTEGER NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN unlocked_units TEXT NOT NULL DEFAULT '[]';
ALTER TABLE players ADD COLUMN free_tokens INTEGER NOT NULL DEFAULT 0;
