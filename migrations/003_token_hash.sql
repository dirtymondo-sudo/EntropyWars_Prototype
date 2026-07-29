-- 003_token_hash.sql — hashed-at-rest account tokens. All token lookups go
-- through players.token_hash (SHA-256 hex of the plaintext the client
-- holds); server.js backfills legacy plaintext rows at boot and replaces the
-- old token column value with a '#'-prefixed tombstone that only exists to
-- satisfy the column's UNIQUE constraint.

ALTER TABLE players ADD COLUMN token_hash TEXT;
CREATE INDEX IF NOT EXISTS idx_players_token_hash ON players (token_hash);
