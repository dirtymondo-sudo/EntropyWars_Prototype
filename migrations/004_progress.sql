-- 004_progress.sql — durable achievement/records progress (ACHIEVEMENTS_PLAN.md
-- §7, Phase 5). One row per player: `data` holds the profile.progress JSON blob
-- AFTER the server-side G-counter merge (mergeProgressBlobs in data.js — the
-- same function the client uses). The blob is monotonic by construction
-- (counters only grow, records only improve, unlocked only unions), so the
-- sync endpoint can merge-and-store on every push with no versioning dance.
-- players.id is a uuid string, hence TEXT (the plan's sketch said INTEGER —
-- that was wrong for this schema).

CREATE TABLE IF NOT EXISTS player_progress (
  player_id  TEXT PRIMARY KEY REFERENCES players(id),
  data       TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
