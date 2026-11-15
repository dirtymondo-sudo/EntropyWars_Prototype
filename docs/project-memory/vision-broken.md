---
name: vision-broken
description: PR #178 (2026-10-09) replaced AWR with VISION 2-6 + own CRT stat, team-sight targeting, new Broken status
metadata:
  type: project
  modified: 2026-10-09T07:28:56.366Z
---
PR #178 merged 2026-10-09 (thread "vision stat / Break"). AWR no longer exists anywhere; races have `vision` (2-6 tiles) and `crt` (%).
Targeting (human AND CPU, fog on or off) needs the team to see the tile: data.js VISION_RULES, map.js teamSeesTile/isInVision/visionGatesTargeting.
LOS-free spells skip caster LOS but still need team sight (mondo's spotter rule). Blind = vision 1 + 50% miss + NO team sight (mondo 2026-10-18 rejected PR #300's team-sight change: "if i am blind then i shouldnt have team vision"); Jammed = no shared sight. PR #303: while a Blind/Jammed unit acts, map.js fogSoloUnit makes computeVisibleTiles show only its own sight (enemies hidden + unclickable). PR #379: clickTile fog gate lets move, jump AND climb clicks through on fogged tiles (Blind vision 1 < jump reach). Quick-menu Move+Attack checks sight from the landing tile.
Fog default stays ON, fog grid OFF. Broken status (STATUS_DEFS.broken) = getUnitPassives [] ; passive flyers fall (battle.js breakUnitPassives).
On Crash Loop, Needle Work, Sucker Punch, Demonic Claw, Divine Smite. AI weights lastSeenHunt_v1 / breakValue_v1 added (default 1).
Sync zip r2-sync/ENTROPY_WARS_SYNC_20261009-0728.zip. Notes: docs/notes/champions-combat.md "VISION + BROKEN".
**How to apply:** new gates must use visionGatesTargeting/spellVisionGate, never `state.fogOfWar && !autoPlayers`. See [[ai-training]].
