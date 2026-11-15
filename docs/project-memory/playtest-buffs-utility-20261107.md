---
name: playtest-buffs-utility-20261107
description: 11-07 buff/stance/utility spells playtest (report only): possession-as-ally, charm still attacks/dashes, Encore respawn skip, STUNNED label, missing log lines
metadata:
  type: project
  modified: 2026-11-07T06:00:43.563Z
---

11-07 thread "Playtest buff, stance and utility spells" (thread in the owner project), main b3ab112,
report only, nothing changed. Report: /mnt/project-files/playtest-mechanics-20261107/PLAYTEST_BUFFS_UTILITY_20261107.md
(+ buffs-utility/: shots, ledger, 3 match exports, raw-notes.md). 473 in-scope abilities / 14 families. Part 2 (full family, sent back for sampling): 149 code variants, all proven; 238 cast (69 battle + 169 Spell Lab), 148 share code, 87 covered by sibling reports; per-ability table appended + buffs-utility/lab/.

FIXED: A possession home side PR #998 [[possession-home-side-20261107]]. D lock words + Stoneform greys Items/Guard PR #993 [[status-lock-words-20261107]]. C Encore PR #985 (unitEncoreReady: 0 AP + turn spent (_turnRound) + not respawn sit-out (_respawnSitOutRound); Reprise uses it too).
Bug families: A possession flips unit.player so team spells treat the possessed enemy as ally (Hallelujah cleanse freed
it, Oath buff outlasts it, Chivalry lists it + Knight himself) and the CPU attacks its own possessed teammate;
B charm = blockMove only: charmed units still attack, dash (Rampage), teleport (Nimble Dodge), grapple, siege the Cube;
movement spells never check unitMoveBlockedByStatus (Root/Frozen too, code read); C Encore offers allies who haven't acted
(respawn sit-out units) -> they act in their skip round; D hud.js 6234 MOVE sub "Stunned" for any blockMove status;
E missing log lines (cleanses, Blessing/Regen ticks, Agent Vanish teleport, Chivalry badge, Fortify pill in Pause>Party);
F Hey, Over Here! castable with nobody in range (spends MP+CD; invisible enemy nearby); G text mismatches (Stadium Show
"every 4 rounds" = 3, Skin Swap enemies only, Spellsteal permanent, stick chance hidden).
Part 2 new bugs: I own AOE/line spells hit own summons/decoys (damageTurretAt + deployed-object paths no owner check); J Yo Ho's own cleanse eats its M ATK drop; K Stick-Up/Tithe log raw item id 'healPotion'; E+ Eject!/Reassemble no log line, Free Energy no number; G+ Free Energy skips caster, Anthem line. Overlaps status-effects report M2 (charm) and E (Regen line). Related [[playtest-status-effects-20261107]] [[playtest-elements-20261106]]

Harness tips: support casts leave AP, so END TURN after an auto-ended cast ends the NEXT unit's turn -> check active name
first. Rows reorder when spells go on cooldown: read `ph menu` before clicking coordinates. Online friendly has a 15 s shot
clock: driving two seats by hand loses turns; 12x12 boards take ~3 rounds to meet. Delayed hits (Take Aim) show as
negative "actual" in the harness forecast table. Spell Lab: GAME.doSpell(caster,x,y,z) after caster.spells=[sp]; pause window._spellLabTick to see heal numbers; lab CLEANSE does not end possession (releasePossession(u) first).
