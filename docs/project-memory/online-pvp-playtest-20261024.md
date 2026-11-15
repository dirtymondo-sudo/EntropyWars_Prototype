---
name: online-pvp-playtest-20261024
description: 10-24 two-seat online PvP playtest (Quick Play ranked Arena 4v4, Bermuda Triangle Arena, main f87c607): report link and top findings, report only
metadata:
  type: project
  modified: 2026-10-24T13:17:36.273Z
---

mondo asked 10-24 for another PvP playtest after the 10-23 fixes, both sides played to win; report only, nothing fixed.
Report (Claude Doc): https://claude.ai/artifact/6eCz5YkErHgFJVkhBY1tAE ; exports + 25 shots in /mnt/project-files/online-pvp-playtest-20261024/.
Host Pirate/Marksman/Krampus/Luchador vs guest Robin Hood/Minotaur/Kaiju/Quarterback. Guest won on time R20, 458-244 (kills 5-4, tower dmg 1349-0, nexus rounds 40-24). No Cube fell.

Top findings:
- Guest debrief says "4 v 3 standing" vs host "3 v 3"; guest Export Last Match has dead Luchador alive 1806/1806 and Marksman on Kaiju's tile (post-match board).
- Guest shot-clock timeouts write NO log line (29 logged, all host units).
- Rows still slide: confirm hit a different enemy 3 times.
- Absorb (Kaiju drinks fire part) still forecast weak, logs super effective, refunds 2 AP.
- three-vfx-effects.js checks window.ThreeRenderer 17x (a const, never on window): spell models (moon, sedan, wreck, cadillac, mushrooms, pines, door leaf) never load. Code read only.
- Fixed since 10-23: guest shot clock, guest gets the round-limit result, no watchdog skip.
- Open question for mondo: Black Sun came twice (R4, R14): does "never the same twice" mean never in a row?

FOLLOW-UP (mondo 10-24 13:07, answers to suggestions 1-8): PR #486 merged (token 20261024-pvpfix-02-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261024-1317.zip): guest timeouts logged by host; host stops state-sync while the victory podium is staged; press dialogue relayed ('press-feedback'); damage chip LETHAL / MAY KILL + absorb heal. mondo rules: press refund shows ONLY AFTER the hit (pre-hit would give away crit); absorb blocks press (already did). REPORT CORRECTIONS: absorb never refunded (red ! was absorb warning); fall warning already existed. Item 2 "rows slide": mondo says rows never move; unproven, maybe harness. Desert move-cost removal + terrain-move indicator and the smaller bugs went to two coordinator threads. Black Sun repeat question unanswered.

PROOF + PR #492 (10-24 14:10, token 20261024-pvpfix-03-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261024-1410.zip): browser two-seat proof showed #486's podium hold BROKE the guest result (throttled final winner snapshot never sent; guest stuck on last round). Fixed: online.js window._ewFlushFinalSync called at top of _stageVictoryPodium. Damage chip now colour-only (words overflowed row; absorb heal dropped). state.js buildMatchRecord counts _dying as dead (guest records off first winner snapshot mid death clip). Screens in online-pvp-playtest-20261024/proof/. Arena 5-round tie goes to SUDDEN DEATH (next kill wins), so proof runs need a kill.

Related: [[online-pvp-playtest-guest-20261023]] [[matchups-20261023]] [[sandbox-playtest-speed]]
