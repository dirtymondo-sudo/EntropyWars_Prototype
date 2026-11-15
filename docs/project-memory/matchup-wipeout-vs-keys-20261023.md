---
name: matchup-wipeout-vs-keys-20261023
description: 10-23 win-condition matchup thread Wipeout (P2) vs Keys (P1), online two-browser match on Fairy Forest Arena; no winner, killed in R7 by a recovery bug; report link + top findings.
metadata:
  type: project
  modified: 2026-10-23T09:10:01.394Z
---

10-23, one of mondo's "every win-condition pairing" matchup threads. Local two-seat online match (friendly room, Arena, Fairy Forest Arena 10x10, 20 rounds, main at PR #434). P1 Key Hunters (Mothman Far Sight, Robin Hood, Cosmic Wraith, King Arthur, all Binoculars) vs P2 Wipeout Squad (Superhero, Dragon, Antihero, Dinosaur). Report only, nothing fixed: https://claude.ai/artifact/3tgFGJQLKuiuy4XmtBLRyF ; page, shots, raw notes in /mnt/project-files/matchup-wipeout-vs-keys/.

Result: NO WINNER. End of R6 both sockets dropped (likely sandbox slowness) and rejoined; during recovery the host no-active-unit WATCHDOG (battle.js ~53643-53722, no _NET._recovering gate; activations deferred by online.js _ewDeferRecovery) forced maybeAdvanceTurn every 15 s, skipped ALL of round 7, end-of-round Nexus burn killed Antihero, then checksum mismatch -> server.js:2275 "The host changed during recovery" ended the match on both seats. State then: kills 1-2, Keys P1 2 held, 2 loose at G10 by P1 units, 1 hidden.

Other findings: MOVE->CAST forecasts overshoot (4 of 4), in-place ones close; Leap forecast omits Gemini wind x1.25; target-list highlight vs CONFIRM disagree; CHANNEL lit while airborne; Far Sight opens unit list pre-picking caster; Inspect only in tile menu.
Balance read: Wipeout kills low-DEF scouts (Robin, Mothman) in one round and steals dropped Keys; Keys found 4/5 by R3 (centre-first placement + Far Sight) but the 5th is slow; hostile Nexus burn 433+300/round makes a root on your Nexus near-lethal.
Harness: DOM rects of target rows/CONFIRM lag the drawn menu at SwiftShader speed; fire the chip with element.click(). See [[hands-on-playtest]] [[online-pvp-playtest-guest-20261023]] [[online-pvp-playtest-host-20261023]] [[win-condition-balance]].
