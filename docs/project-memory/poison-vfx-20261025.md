---
name: poison-vfx-20261025
description: PR #517 (10-25) poison pass - venom pool mark on every poison hit, Poison family signatures, new Venom Spit T2 + Venom Burst T3 rows; calls flagged
metadata:
  type: project
  modified: 2026-10-25T10:20:14.487Z
---
PR #517 merged 2026-10-25 (mondo: "do a similar thread on each element ... consistent look ... nice amount of spells for each"; one of the per-element sibling threads after [[nature-vfx-20261025]]).

- THE MARK: three-vfx-effects.js "THE POISON PASS" `_pvAuto` hooks fire() (after `if (!effectDef) return;`) and the bolt pipeline landing (`boltLand`): every element 'poison' row of type damage/debuff lays the venom pool (green, violet rim, popping bubbles, fumes on far side, drips). Goo/ooze/blackoil/thebond rows get a black-oil pool. `pvOwn` defs lay their own. Pull pool follows `p.uid`.
- Signatures: Miasma, Rot, Acid Flask, Corrosive Splash, Tendril Whip, Venom Spit, Venom Burst; Vivisection + Cadaver Claws mapped to an empty `pvSeal_impact` so the pool lands.
- New rows after Miasma: Venom Spit raceVenomSpit T2 100 magic r4 Poison 2, 50 MP; Venom Burst raceVenomBurst T3 125 magic r4 x1.5 vs Poison, 75 MP. THREAD CALLS, flagged to mondo.
- Pre-existing rule oddities seen, NOT changed (flagged): Rot (T3) and Tendril Strike / Plandemic (T4) apply Poison; Formic Acid (T1) has bonus vs Poison.
- Stills: /mnt/project-files/poison-vfx/. Sync zip ENTROPY_WARS_SYNC_20261025-1019.
- Capture tip: Spell Lab casts closer than ~10 s apart often come out as a wide "select a target" frame.
