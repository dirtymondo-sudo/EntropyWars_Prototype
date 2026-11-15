---
name: ai-training-rework-20261029
description: 10-29 trainer rework after the flat 6 h run: paired labs + graded score + SPSA, AI blind spots taught as weights (ai.js v4.20), cloud lab 2x faster with --disable-gpu, proof numbers
metadata:
  type: project
  modified: 2026-10-29T21:28:42.023Z
---

10-29 evening mondo: the 6 h run (382-381) means the training is fundamentally broken; rework it to make the AI strong fast; use current + 5 trained weights as the basis; what does the AI not account for; does it get every option/info. Thread "Rework AI training to make the AI strong".

BUILT (battle.js/map.js/ai.js/train_headless.js): THE PAIRS (Training + Strength Test play each match twice: same arena, teams, engine seed, seats swapped; next pair = next arena); THE GRADED RESULT (score finish = 0.5 win + 0.5 tanh(gap/100)); SPSA replaces the one-weight A/B (every weight ±10% of range per pair, step 0.006×pair result; IndexedDB ai-spsa-v1; A/B code inert). Headless: no shards, every sync SUMS the workers' moves (parallel SPSA). Notes: docs/notes/champions-combat.md "THE TRAINER REWORK".

AI blind spots added as weights (0 = old behaviour): zoneTileValue_v1 (Nexus burn 25% / heal 15% on end tile), nexusHoldValue_v1 (zone points left to the buzzer), oppAttackCaution_v1, healLifeLine_v1, forecastTrust_v1 (AI damage copy was >15% off the on-screen forecast 1 in 5 reads; now scaled to forecastBasicAttack/forecastSpellPlan), arenaPointValue_v1 (was fixed 4, now 8), cubePointsValue_v1 (Cube hit pays ~19 Arena pts). Not built: CPU never Climbs / uses lifts; ignores enemy cooldowns, counters, Overwatch.

Findings: score-decided matches are won by kills (+36 pts avg), Cube (+33), zones (+24). Pair sd ~0.55 (legs diverge fast, pairing helps ~25%). Zone/opp/clock knobs alone: 74-74. Cloud lab: Chromium --disable-gpu (software WebGL in-page) = ~2x matches/min, 10 s boot (GPU process burned a core).

SHIPPED PR #692 (10-30, zip ENTROPY_WARS_SYNC_20261030-0052): 2 h SPSA run (1,962 matches) baked as defaults on top of the 5; schema 15 = old ai-weights-v14 table stays in IDB but is NOT played (flagged). Proof: trained vs old AI 250-197 / 447 (55.9% ±4.6); trained vs untrained 237-203 / 440; untrained vs old 175-157 / 332; Hard reply check vs Normal 7-19 (dropped). 35% of CPU turns walk-only. Report doc: https://claude.ai/artifact/P4ZpH6B75Q5TcpuG8WhvoQ. Cloud box has 4 cores: run ONE 4-worker lab at a time (two at once halved speed).

Harness (scratchpad, copied to project files /mnt/project-files/ai-training/rework-20261029/): duel.js (per-seat brains by eval of another ai.js, per-seat weight tables, EW_REPO snapshot dirs so edits don't leak into a running test), an2.js, probe_fc.js.

[[ai-long-training-20261029]] [[ai-three-clocks-design]] [[sandbox-playtest-speed]]

TACTICS (10-30 lab): Tactics on vs off 235-205 / 440 (53.4%). CPU turns by Tactic: Siege 34%, Fight 31%, Search 15%, Anchor 11%, Intercept 8%, Heal 1%. Cast rate when ready: damage 24%, debuff 9.5%, placeTrap 0.5%, seedPoison 3%; never cast: teleport, cleanse, rallyPull, cannibalize, pulseLattice, doorDeploy, deployPair. Proposed to mondo: Hold (Nexus) + Control (debuff/trap) Tactics, trainable planner thresholds, never-cast fix (decision card pending). Probe: scratchpad spellprobe.js.
