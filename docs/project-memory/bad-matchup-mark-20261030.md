---
name: bad-matchup-mark-20261030
description: Abilities-menu hover now shows red IMMUNE/ABSORBS/REFLECTS and steel-blue RESISTED marks over enemies (PR #701, 2026-10-30)
metadata:
  type: project
  modified: 2026-10-30T07:55:49.769Z
---
mondo asked on 2026-10-30: "the same way i hover over an ability and it shows if it's super effective on a unit, I also want it to show if it is ineffective/resists/absorbs/immune".

PR #701 was merged with token 20261030-badmark-01-cors. Sync zip: r2-sync/ENTROPY_WARS_SYNC_20261030-0755.zip (battle.js 3b4ecc41, three-renderer.js 26f72074, ui.js 008ce692).

- battle.js `forecastBadMatchupOn(caster, target, spell, out)` gets `out` from `forecastPressOn(..., { out })`.
- three-renderer `showPressMarks(ids, halfIds, group, lifts, bad)`.
- ui.js `_ewSeBadBangHtml(kind, word)` draws the mark: the green !'s shape, plus a word plate under it. Red for block, steel blue for resist.
- Only the menu group shows it. The aim forecast plates already had these words.

Calls the thread made (not flagged by mondo):
- Ghost incorporeal shows as "IMMUNE".
- PROTECTED and OUT OF REACH also get the red mark.
- Chivalry-guarded targets get no mark.
- Element-part immune/absorb shows red "FIRE IMMUNE" even though the main part lands, mirroring the plates.

No on-screen check was made (no playtest asked). Related: [[one-super-effective-mark-20261026]]
