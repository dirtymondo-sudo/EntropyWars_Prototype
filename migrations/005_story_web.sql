-- 005_story_web.sql — THE RELATIONSHIP WEB's shared save (2026-11-18, mondo: "I work on 2 computers").
-- The story-planning web (docs/plans/story-web/, opened from Settings > Developer) keeps its boards here,
-- one row a document: 'web/index' (board order + deletions) and 'boards/<id>' (one board). No account:
-- every computer that opens the web from the game reads and writes the same rows.
CREATE TABLE IF NOT EXISTS story_web_docs (
  path       TEXT PRIMARY KEY,
  data       TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
