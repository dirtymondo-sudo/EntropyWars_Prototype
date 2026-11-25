---
name: story-tools-gaps-20261125
description: 11-25 story toolkit on the Relationship Web story page (facts, gates/endings, checks, mystery ledger, world grid, flow chart, play-through + standings, lore, pitches, cutscene links) BUILT, PRs #2559-#2563; waits his look
metadata:
  type: project
  modified: 2026-11-25T09:45:05.415Z
---
mondo 11-25 asked what tools to add beside the Relationship Web, Story planner and Character sheets (how AAA RPG studios track quests, gates, branches and endings). Research doc: https://claude.ai/artifact/VATSqHLywWbGkeYfn4ANhz. He said "Yeah yeah do all of that" ((thread in the owner project)).

BUILT + merged 11-25 (docs/plans/story-web, /dev/relationship-web, no R2):
- A #2559: Facts tab, quest Opens/Closes when, level, giver, status, Endings (set facts, kill, join, open places), Checks tab.
- B #2560: Mysteries tab (ledger of secrets by chapter), ties with from/until chapter, "Story at" select on the web.
- C #2561: World tab (places / characters by chapter), Flow tab (whole story or one quest).
- D #2562: Play it tab (one path by picked endings, faction standing table, random-path dead ends), Lore tab, Pitches tab.
- E #2563: quest scenes linked to the game's STORY_CUTSCENES (lines, plays-when, fact changes, his cutscene-editor edits, checks).
Defaults I picked (he did not answer): facts are plain sentences; level gates check both party level and chapter level. Cutscene editor stays its own tool, linked by scene.
Proof pictures: /mnt/project-files/story-tools-plan/proof/. Notes: docs/plans/story-web/README.md "The story toolkit".
Not built: tinting the group web by standing; dialogue-with-choices (later, inside the cutscene editor).
Related [[quest-planner-20261122]] [[character-sheet-tool-20261125]] [[relationship-web-tool-20261118]] [[story-source-of-truth]].
