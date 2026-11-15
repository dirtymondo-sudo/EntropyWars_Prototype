---
name: matchup-keys-vs-keys-20261023
description: 10-23 win-condition matchup thread, Keys vs Keys (online two-seat, Area 51 Arena 12x12): P2 won R4 by 5/5 Keys; report link + key balance/bug findings. Report only.
metadata:
  type: project
  modified: 2026-10-23T07:40:26.718Z
---

10-23, part of mondo's "every win condition vs every win condition" set (one thread per pairing). Report only, nothing fixed; mondo picks.
Report: https://claude.ai/artifact/8siq43vA1JeYEszPMUpMyk ; page + shots /mnt/project-files/matchup-keys-vs-keys/.

Result: Rustlers (P2: Cosmic Wraith, Cowboy, Dreameater, Dinosaur) beat Seekers (P1: Robin Hood, Quarterback, Mothman, King Arthur) in ROUND 4 by holding 5/5 Keys. P1 found 2 Keys but Cowboy's Rustle stole both; King Arthur killed the Cowboy, and the enemy Dreameater (next in blitz order) Far Sighted the dropped 3-Key pile from 4 tiles away. 5th Key sat near K2, 2 steps from P2 spawn.

Balance notes (proposals, not rules): Keys mirror ends very fast (R4 vs R12 in the Keys-vs-CPU playtest); Rustle decides the mirror; carrier kills favour whoever acts next (remote Far Sight pickup); fallback Keys near a spawn = home advantage (equal-distance placement would be a NEW rule, needs mondo); vision cap 8 means Inspect never covers the 9th tile, Binoculars+Telescope wasted past 8.

Bugs: Far Sight opens an ally list, silently walks the caster when out of range, uses the one spell/turn without saying so; Gravity Well accepts out-of-range tile then fails, AoE list != lit area; Chain Lightning first hit went to another unit + no ally friendly-fire warning when soaked; move->cast AoE needs 2 CONFIRMs with cursor on CANCEL; Rustle CONFIRM tag stays on old row; quick-menu clicks during slide-in hit the wrong row; [BOOT] and _execAction watchdogs fired online; debrief CASE year differs per seat. See [[win-condition-balance]] [[hands-on-playtest]].

Follow-up PR #466 (merged 10-23, thread "Keys vs Keys fixes"): quick-menu "↳ MOVE" AoE arms placement before the walk (one CONFIRM = MOVE→CAST); AoE footprint tiles with a spared teammate paint grey (forecastSpellPlan hits decide); Rustle "Key taken" line/floats after pull + damage (_stealFromUnit fxDelayMs, Keys still move at once); builder sticky notes shrink above the party bar; builder VISION at cap shows MAX + real gear gain. Left as mondo's rule call: vision cap 8 => Inspect never covers the 9th tile. Shared thread owns menu-row slide misclicks + CONFIRM-vs-row tag.
