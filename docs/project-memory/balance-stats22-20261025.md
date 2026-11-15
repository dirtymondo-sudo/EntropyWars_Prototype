---
name: balance-stats22-20261025
description: 10-25 stats22 Balance Lab read (what PR #528 fixed / didn't) + PR #531 move/HP pass; all stat calls flagged to mondo
metadata:
  type: project
  modified: 2026-10-25T23:46:23.055Z
---
mondo 10-25 23:39 sent ew-balance-stats22.json (635 Arena matches, builds skiesoff-02 + nofreeze-01, all after PR #528).
File: /mnt/project-files/uploads/hearth/47989451-ddc5-4cb9-952d-3741ad724e08 (stats21 = 859aaf84-..., stats20 = 748e3762-...).
~40 games/race = ±15 noise; method: call a race only when it is off 50 in all 3 runs + analysis.teamAdjusted. Run-to-run r = 0.59.

PR #528 worked: HP cuts Kaiju 81→66, Ghoul 68→53, Flesheater 68→46; Mime 31→60; Nun SPD (move 2) 36→47; Telepath 28→38;
Jack o Lantern 38→48; Clown 36→44. Did not: Mech HP (64→69), Ghost spell trims (68→79), Voidweaver HP (35→22), Rabbit
spells (32→28), Shadow Entity HP, Gnome spells, Jellyfish SPD. SPD/move now top stat (r 0.47) > HP (0.40): Arena score =
kills + tower dmg + Keys + Nexus rounds, so reach wins.

PR #531 (merged, token 20261025-stats22-01-cors, zip ENTROPY_WARS_SYNC_20261025-2346.zip = data.js 8db1b2be):
nerfs Ghost SPD 177→160 (move 4), HP Dragon 1130, Juggernaut 1640, Ki Fighter 1190, Crystal Guardian 1600, Mortar Salvo
70→56, Full Burst 120→105. Buffs SPD 50 Hippie/AI/Mermaid (move 2), SPD 88 Voidweaver/Gnome/Wizard (move 3), HP Rabbit 700,
Catgirl 840, Ninefold Scratch 40/hit. Left for next run: Shadow Entity, Deep Sea Fish, Machine Elves, Eagleman; watch Mime
overshoot. Notes docs/notes/champions-combat.md "STATS22". Related [[balance-stats21-20261025]].
