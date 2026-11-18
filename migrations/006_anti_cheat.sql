-- 006_anti_cheat.sql — THE CHEAT GUARD (2026-11-18, mondo: players must not be able to edit their wallets).
-- daily_pay: what the server paid one account on one UTC day, by kind ('cpu' = banked VS-CPU / friendly match pay,
--   'sync' = story / achievement gold from /api/progress/sync, 'units' = races the captured ledger added,
--   'sell' = sell-backs paid beyond what the account spent). Each kind has a daily ceiling in server.js CHEAT_CAPS.
-- match_payouts: one ticket per account per ranked match the SERVER recorded; /api/economy/bank pays a ranked
--   match only against an unused ticket.
-- players.spent_total / refunded_total: a sell-back may give back what was spent, never more (plus a small daily
--   allowance for found items). players.sync_owed: story gold over the day's ceiling, paid on later days.
-- server_settings: one-off server values (the Relationship Web's password hash).
CREATE TABLE IF NOT EXISTS daily_pay (
  player_id TEXT NOT NULL,
  day       TEXT NOT NULL,
  kind      TEXT NOT NULL,
  amount    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (player_id, day, kind)
);
CREATE TABLE IF NOT EXISTS match_payouts (
  player_id  TEXT NOT NULL,
  match_id   TEXT NOT NULL,
  used       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (player_id, match_id)
);
ALTER TABLE players ADD COLUMN spent_total INTEGER NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN refunded_total INTEGER NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN sync_owed INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS server_settings (
  k TEXT PRIMARY KEY,
  v TEXT NOT NULL
);
