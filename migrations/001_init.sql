-- 001_init.sql — baseline D1 schema, reconstructed from the queries in
-- server.js. CREATE ... IF NOT EXISTS throughout: on the live database
-- (built by hand before this directory existed) every statement is a no-op;
-- on a fresh database this is the complete pre-economy schema.

CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    token TEXT UNIQUE,
    elo INTEGER NOT NULL DEFAULT 1200,
    peak_elo INTEGER NOT NULL DEFAULT 1200,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    total_games INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_seen TEXT
);

CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    winner_id TEXT NOT NULL,
    loser_id TEXT NOT NULL,
    winner_elo_before INTEGER,
    winner_elo_after INTEGER,
    loser_elo_before INTEGER,
    loser_elo_after INTEGER,
    team_size INTEGER,
    map_mode_id TEXT,
    duration_ms INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_matches_winner ON matches (winner_id, created_at);
CREATE INDEX IF NOT EXISTS idx_matches_loser ON matches (loser_id, created_at);

CREATE TABLE IF NOT EXISTS community_maps (
    id TEXT PRIMARY KEY,
    author_id TEXT NOT NULL,
    author_name TEXT,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    map_json TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    team_size INTEGER,
    plays INTEGER NOT NULL DEFAULT 0,
    rating_sum INTEGER NOT NULL DEFAULT 0,
    rating_count INTEGER NOT NULL DEFAULT 0,
    featured INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS map_ratings (
    map_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    rating INTEGER NOT NULL,
    PRIMARY KEY (map_id, player_id)
);
