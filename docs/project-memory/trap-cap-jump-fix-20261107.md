---
name: trap-cap-jump-fix-20261107
description: PR #1018 (11-07) zones/traps family A fixed: deployObject/turret caps per spell (no silent deletes), jump landing runs resolveTileArrival; proven in 2-seat online match
metadata:
  type: project
  modified: 2026-11-07T11:09:20.473Z
---
mondo 11-07 "Go ahead and start those fixes" for PLAYTEST_ZONES_TRAPS_20261107.md; this thread = family A (A1, A2, A3 cap part).
PR #1018 merged, token 20261107-trapcap-02-cors, battle.js 921a248f + ai.js 87d5d0f8 live (sync-zip --upload).
- A1: battle.js deployObject cap counts `o.spellId === spell.id` only; the replaced one logs to owner's seat only. Shed Skin/spawnDecoy cap (3) counts spell-less decoys only.
- A3: deployTurret + real-time _placeTurret cap per spell, never summons/zombies; 5G Tower stores 0 dmg, log names its M.DEF aura. A3's other half (log said "8 dmg") is in the same fix.
- ai.js caps match (deployObject x2, deployTurret).
- A2: doJump `_doPostJump` calls resolveTileArrival(unit,{via:'move'}) after fall damage (traps, bombs, mines, ground, zones, vortex, rune). Landing square only.
- Proof: 2-seat online friendly (ph start --seats 2), /mnt/project-files/playtest-mechanics-20261107/trap-cap-jump-fix/. Harness tips: party builder spells equip with ONE click (double toggles back); online shot clock is short after a move, so do move+jump in one shell call; Escape opens the pause menu.
Notes: docs/notes/champions-combat.md "THE PER-SPELL CAP + THE JUMP LANDING". Related [[playtest-zones-traps-20261107]] [[cpu-traps-20261101]]
