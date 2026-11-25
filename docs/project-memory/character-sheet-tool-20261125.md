---
name: character-sheet-tool-20261125
description: Character Sheet tool beside Relationship Web + Story planner: plan/mock-up posted 11-25, waits mondo's OK; design + storage choice
metadata:
  type: project
  modified: 2026-11-25T08:47:58.961Z
---
11-25 mondo asked for a full Character Sheet tool beside the Relationship Web + Story planner ((thread in the owner project)). Plan + mock-up posted 08:5x UTC (`/mnt/project-files/character-sheet/character_sheet_mockup.png`), He OK'd it at 08:58 UTC and added two asks: a Family section, and a sheet for every character the story mentions (he renames them himself, and deletes the ones that are groups). BUILT + MERGED as PR #2557: a 'Character sheets' tab in the Story planner, doc story/cast, 113 auto story cast. Waits his look.

Design: third screen in docs/plans/story-web/build/app.js (like THE STORY PLANNER), cast list left (Story cast / Named units / All, completeness bar), sections Header, Overview, Inside (want/need/fear/flaw/lie/morals), Secrets (who knows, planted, revealed chapter), History (backstory = the board node's `note`, same field; timeline events), Arc (rows = Story planner chapters they're in), Ties (from board), Voice, In the game (read-only EW_DATA), Questions noticed + own questions; custom fields; hide empty.
Storage: new doc `story/cast` (needs server.js STORY_WEB_PATH regex change), per-sheet `t` merge, keyed by board node id (r:race:g, s:cast, custom id).

EW_WEB_KEY was NOT in this thread's env; read data from /mnt/project-files/story-web-backups/ (another thread writes them). Related [[relationship-web-tool-20261118]] [[story-source-of-truth]].
