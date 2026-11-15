---
name: spell-vfx-fx4-20261026
description: Spell look fix batch FX-4 (light/arcane + plain attacks/debuffs) — PR #572 merged 10-26, zip 20261026-2324, calls flagged
metadata:
  type: project
  modified: 2026-10-26T23:25:04.727Z
---
FX-4 of the spell VFX fix pass ([[spell-vfx-audit-20261026]]): PR #572 merged 2026-10-26, token 20261026-fx4-2-cors,
zip /mnt/project-files/r2-sync/ENTROPY_WARS_SYNC_20261026-2324.zip (battle.js + three-vfx-effects.js). Notes + 48
before/after sheets in /mnt/project-files/spell-vfx-audit/fix/FX-4/. Code: three-vfx-effects.js "THE FX-4 PASS" (`_f4`),
kill-switch window.EW_DISABLE_FX4.

Key shared changes: divine archetype noOrb; stage pillar/orb skip spells with own look (`_f4OwnLook`); fireZone takes
spellId and colours zone debuffs by element; any floor `flame` layer summons volumetric orange flame (`_flameVolumeInfo`),
so dark spells must not use it. Merkaba: main's landMs timing kept, FX-4 only adds glass faces.

Calls flagged to mondo: Dark Dominion keeps its hellfire pentagram finisher; Stasis white column removed; Shambling Horde
box runners cut (needs zombie crowd model); zone debuff colour by element; Dragonfear flame on every enemy in 3x3.
Missing models appended: frog (Polymorph), running zombies (Shambling Horde), rope (Hogtie).

Gotcha: two threads wrote r2-sync zips in the same UTC minute (2323/2324) and zip appended into the other's file.
Check `ls` the target name first and pick a free minute.
