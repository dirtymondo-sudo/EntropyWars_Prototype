---
name: ai-three-clocks-design
description: CPU AI "Three Clocks" plan (10-23) and its BUILD in PR #424 (ai.js v4.16): Tactics fight/siege/search/intercept/anchor/heal, race clocks, search map, Hard draft; calls flagged to mondo.
metadata:
  type: project
  modified: 2026-10-23T04:25:55.228Z
---

10-23: mondo asked how to make the AI/training better; plan page https://claude.ai/artifact/DxJ7TXUQbgdjUZ3yCxKVN2. Same day he said build it all and call the jobs TACTICS (plus Heal), player-settable for auto battle (the separate "Unit tactics auto battle" thread owns the player UI: battle.js setUnitTactic → unit.tactic).

BUILT in PR #424 (merged 93c043e, token 20261023-tactics-02-cors, zip ENTROPY_WARS_SYNC_20261023-0425). Notes: docs/notes/champions-combat.md "THE TACTICS + THE RACE CLOCKS".
- API: window.AI_TACTICS, aiTacticFor, aiTacticReason, aiSetTacticPersona, aiRaceClocksFor. unit.tactic = forced (×1.5). CPU jobs in ai.js _tacticJobs, never on unit/state.
- Kill-switches: EW_AI_NO_TACTICS / EW_AI_NO_CLOCKS / EW_AI_NO_SEARCHMAP. Easy = no plan/clocks. Player's own auto units always Normal.
- New weights at defaults (no reset): raceRoundValue_v1 200, searchKeyValue_v1 180, searchCenterPrior_v1 4, keyCarrierDenial_v1 800, anchorCaution_v1 1, tacticCommitment_v1 1, hardReplyFactor_v1 0.5.
- A/B no longer tests 20 keys (18 gen-40 flat + killBonusScore + cubeWindowBonus); values kept. Strength Test sparring: Key Rusher / Cube Rusher / Turtle.

Calls the thread made (flag to mondo, unconfirmed): centre-column Key prior (rule knowledge from placement code, weight 4, 1 = off); Hard-only plan draft of CPU races in VS CPU; Easy loses the plan; flat Cube window replaced by clock value when clocks on. Not built: endgame starts, many-weight steps, plan-drafted training teams, Entropy-gauge spacing, killBonus/killBase merge.

BROWSER CHECK 10-23 (PR #430, ai.js v4.17, zip ENTROPY_WARS_SYNC_20261023-0526): 3 VS CPU Arena matches (scratchpad harness pt.js, ~50 min per match on SwiftShader), no JS errors, no match reached a win before the limit (Hard: CPU 5-4 kills at r19, hit the Cube twice). Fixed job swapping each round (+60 keep bonus) and the Cube alarm (fresh sightings, 3 squares, 2 on 8-11 wide boards). Then PR #442 (v4.18, zip ENTROPY_WARS_SYNC_20261023-0652): Search always gets a unit when Keys matter (kept fighter becomes searcher); CPU-assigned jobs damp other move goals x0.75; Search Inspect valued off the Keys clock (_keyClockValue) and scans FIRST with 2 AP before a one-AP hit/heal/item. Verified in browser: Sheriff found a Key r7. The Siege 'walk back' was Big Kick knockback, not AI.

[[hands-on-playtest]] [[playtest-cube]] [[win-condition-balance]]
