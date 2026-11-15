---
name: unit-tactics-auto-battle
description: PR #439 (10-23) player-set unit Tactics (auto battle) — TACTICS menu, unit.tactic, Tactic turn window, online setTactic; design calls flagged to mondo
metadata:
  type: project
  modified: 2026-10-23T06:40:15.277Z
---
10-23 mondo asked the AI jobs to be "Tactics" the player can put their own units on (auto battle), + Heal. BUILT in PR #439 (merged 2dce4cc, token 20261023-unittactics-01-cors, zip ENTROPY_WARS_SYNC_20261023-0639: battle.js hud.js online.js). Reuses the CPU brain from PR #424 ([[ai-three-clocks-design]]); notes docs/notes/champions-combat.md "THE PLAYER'S TACTICS".
- battle.js setUnitTactic(id, tactic|null) → unit.tactic; unitOnTactic(u) gate folded into _mdUnitAuto (all AI routing). Online: guest emits game-action setTactic, host owns it.
- hud.js: root verb TACTICS (party list + MANUAL + 6 rows); TacticWatch window during a Tactic unit's turn (MANUAL = take control after the AI's current step). Screens in /mnt/project-files/unit-tactics/.
Design calls (flagged to mondo, unconfirmed): Siege greyed with no enemy Cube, Search with no Keys, Intercept with neither, Heal with no heal/revive kind or Healing Potion; Tactic stays through death/respawn and lasts the match only (not saved to the party/team); no Tactic in Mystery Dungeon or tutorial; Tactic units play with full animations in Training tempo (not turbo); window stays up through the AI turn (AI turns are ~1 s, so MANUAL is easiest set from another unit's TACTICS menu).
