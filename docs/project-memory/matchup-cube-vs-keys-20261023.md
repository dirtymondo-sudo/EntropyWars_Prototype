---
name: matchup-cube-vs-keys-20261023
description: 10-23 hand-played two-seat online Arena match, Cube team vs Keys team (Area 51 Arena): Cube won R8, Keys 4/5; report link + top bugs. Report only.
metadata:
  type: project
  modified: 2026-10-23T08:45:46.756Z
---

10-23, mondo's "every win-condition combination" ask; this thread = Cube vs Keys. Report https://claude.ai/artifact/S3RPjrYtgW8wQvSPFEweZX ; page + shots /mnt/project-files/matchup-cube-vs-keys/. Nothing changed in code.

Setup: local two-seat online (host P1 Cube Breakers: Superhero/Dragon/Dinosaur/Quarterback; guest P2 Key Hunters: Mothman/Mantid/Robin Hood/Reptilian), Area 51 Arena 12x12, main 1f69668, shot clock 1800 s, Unlock All on.

Result: Cube destroyed R8 (14 basic hits, ~257 avg); Keys 3/5 by R2 but stuck at 4/5; 4-0 kills, all on carriers (each dropped a Key). Decisive: Cube team's Dragon inspected a dropped Key and carried the 5th (Cube team CAN carry Keys; asked mondo if intended). Faster team acts first every round.

Top bugs: Encore uncastable (UI arms Self Target, engine refuses self: hud.js spellTargetMode vs battle.js ~74466); 1-round statuses (Kneecap Root, Camouflage, Take Aim's rooted x1.5) expire at round end before the target acts (asked mondo); Psychic Beam MOVE->CAST aims at a tile not the picked enemy; refund camera stuck in close-up; Far Sight diamond lights out-of-sight tiles; Cube silently missing from Attack when terrain blocks; no marker for searched tiles (Inspect covers only VISION tiles of the 3x3); Cube row "55% · 1t" is HP but reads as hit chance. See [[hands-on-playtest]] [[win-condition-balance]] [[matchup-keys-vs-keys-20261023]].

Follow-up PR #449 (merged 10-23): mondo said any unit can carry a Key; 1-round statuses now last through the unit's next turn (battle.js _statusLandsAfterTurn/_markStatusFresh), Encore targets a finished ally, list picks not re-aimed by camera, Far Sight picks fogged tiles, greyed Cube row with reason, 'HP 55%'. Not changed: default target order (lowest HP, intended), refund two-shot hold (design). Flagged: self-buffs in own turn now last a turn longer; stun after acting costs next turn.

Follow-up PR #468 (merged 10-23, zip ENTROPY_WARS_SYNC_20261023-2135): guest camera stuck in close-up after refund = softResetToUnit called bare armActionCamSettle so the online relay never fired (now window._armActionCamSettle + _ewRelayCamSettle). THE SEARCH MAP: state.searchedByPlayer keeps Inspect/Far Sight tiles (scannedByPlayer is wiped by the scan fade 0.7 s later); shown grey + hovered footprint teal while aiming; death tile and round-10 Key top-up clear marks; guest gets only own set. +KEY floats gold. Flagged, not changed: ai.js reads scannedByPlayer (always empty) for its searched memory; Long Bomb/Updraft caster-blocked cameras; story 'ON FILE' line in Arena debrief.

PR #469 (merged 10-23, zip ENTROPY_WARS_SYNC_20261023-2157): mondo said CPU should remember -> ai.js _aiSearched reads searchedByPlayer. Round-10 Key top-up (spawnPeriodicHourglasses) REMOVED per mondo; it only ADDED up to 3 Keys once, never reshuffled, never ran in Arena (fixed pool).
