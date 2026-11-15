---
name: spell-audit-harness-20261026
description: The 10-26 every-spell audit (report only): harness in /mnt/project-files/spell-audit/, batches, speed gotchas, first findings
metadata:
  type: project
  modified: 2026-10-26T13:23:39.250Z
---
mondo 10-26: "cast every spell and make sure it works as intended ... based off the spell description. Make a list of
anything broken or off or suspect." REPORT ONLY. Lead thread built the harness; 7 batch threads + lead's B2.

Where: /mnt/project-files/spell-audit/ — BRIEF.md (shared brief), harness/ (setup.sh, sa-lib.js in-page SA.boot/SA.test,
sa-run.js batch runner, sa-report.js, ctl.js+inject.sh+e.sh interactive), batches/ (B1-A, B1-B, B2..B7 id lists +
INDEX.md), findings/<batch>.md (end with DONE), records/. Combined list = findings/COMBINED.md (lead writes it).

How it works: Spell-Lab-style private 12x12 flat board (state._spellLabMode intercepts turn advance), caster race that owns
the spell + 3 homosapien allies vs 4 homosapien enemies, real GAME.doSpell aimed by window._aiPlanCandidates, forecast
via window.forecastSpellPlan, state snapshot diff, rounds via the real triggerEndTurn for every unit.

Speed gotchas (cost an hour): EW_DISABLE_3D_UNITS + abort art/model/audio requests (boots 40-120 s -> 2 s); keep
state.devAutoSim=true on idle pages (sim clock + no-render) or every page draws frames in swiftshader; a page left on
the main menu renders the 3D HQ and starves everything (GPU process 300% CPU); chromium args --use-gl=angle
--use-angle=swiftshader --enable-unsafe-swiftshader (plain --use-gl=swiftshader was 5x slower); 3 games per 4-core box;
boardBusy stays true ~0.5 s per END TURN for visual tails only, so wait for the active-unit hand-off instead.

Record gotchas (B5 thread): the FIRST SA.test after each race boot can miss its AP change and log lines (re-cast before
trusting it). In spell-lab mode a turn-ending cast (damage / Protect) shows NO AP change: the lab hands the caster a fresh
turn (ap back to 2, _spellsUsedThisTurn cleared) — that is how to tell a cast ended the turn.

Probe gotchas (B3 thread): casterHpPct/allyHpPct are FRACTIONS (0.3); `layout` must be the full map, so use
Object.assign(SA.layoutFor(SPELL_BY_ID[id]), {...}); the floor is at reshape minHeight 0, so a "reshapes the ground" check
needs the board raised first (G.applyTerrainDeform(x,y,0,{centerDelta:3})); flyer = E[0].status.levitating=5; E[0].z=2.
B3 done 10-26: findings/B3-lines-multihit-drain-delayed.md (11 broken, 32 off, 10 suspect).

Passive gotchas (B7 thread): sa-run.js skips passives, so test by hand (set unit.passiveRows in-page; build-time hooks
statBonus/armor/inspectBonus need customSpells = 1-2 actives + the passive, else the default kit trims it). Seed
Math.random too or damage won't repeat. B7 done 10-26: findings/B7-passives.md (0 broken, 5 off, 8 suspect).

Finding (10-26): state._activeZones (spell zones) is not reset by prepareBattleStateFromCurrentBuilds (battle.js ~49469),
so a live zone survives backToMainMenu + startMatch into the next match. [[spell-audit-findings-20261026]]
DONE 10-26 ~14:00 UTC: all 8 batches finished; combined list = /mnt/project-files/spell-audit/findings/COMBINED.md
(39 broken / 142 off / 63 suspect findings, grouped by shared cause: row fields some cast paths never read —
statStageBoost, groundsFlyers, terrainDeform, pushDistance, unholyBonus, ignoreArmor, selfHealPct). Report only; nothing fixed.
