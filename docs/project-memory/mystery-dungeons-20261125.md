---
name: mystery-dungeons-20261125
description: 11-25 five mystery-dungeon buildings, 30 floors each (Hotel, Act of God Insurance, Haunted House cellar, D.U.M.B., Internet Archives) + generated Door Cases
metadata:
  type: project
  modified: 2026-11-25T14:52:01.080Z
---
Thread (owner-project id) "Build more mystery-dungeon buildings". Builds on the Hotel ([[building-interiors-plan-20261123]]).
Quest side = side-quests (thread in the owner project), doc https://claude.ai/artifact/KUDvsuDxPB5KtncRaSajFb.

- mondo 11-25: 30 floors each, all doc buildings EXCEPT Hero Tower; the Internet gets its own giver (not DOOR) + an "Archives" dungeon of old web pages.
- data.js block HOTEL-MD: `MD_BUILDINGS` (hotel / office / haunted / dumb / archives), `MD_KITS` furnishing, `mdDef`, `_mdDropOthers` (only one building's floors in memory), boss every 10th floor gating the stairs (`mdGate`), `MD_CASES` + `mdCaseToday` (one case a game day per save: unauthorized door + anomaly on floor N, E closes it after the fight).
- Office tower = ACT OF GOD INSURANCE (P09-00-B1 skyline lobby; branding name was open in the doc, mondo may rename). Floor/top boss names are drafts (Councilman in 1010, Claims Adjuster, Doll in the Wall, Subject Zero ...).
- Archives giver = the Glitch (the doc's suggestion, waits mondo's pick). Floor 30 of the Archives has no boss (story, left open).
- Not done: chapter gates (no chapter flag in game), Locke's board in HQ, arrest via capture door.
- LIVE 11-25 PR #2575 (waits his look + renames). Floor plans /mnt/project-files/mystery-dungeons/.
- Notes: docs/notes/areas-complexes.md "THE MYSTERY DUNGEONS, FIVE BUILDINGS".
