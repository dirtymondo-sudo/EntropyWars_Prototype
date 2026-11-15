---
name: nature-vfx-20261025
description: PR #509 (10-25) nature pass - Vine Whip + Wrath of the Wild rows, procedural vine/root VFX for 10 nature spells; calls flagged to mondo
metadata:
  type: project
---
PR #509 merged 2026-10-25 (mondo: "badass impressive vfx for nature spells like vines... no solid vine whip or signature nature spell").

- New Nature Magic rows (data.js after Overgrowth): Vine Whip raceVineWhip T2 pull 100 phys r4 pull 2 Root 1, 50 MP; Wrath of the Wild raceWrathOfTheWild T4 single 170 magic r4 x1.5 vs Root, cd 2, 100 MP. All 8 Nature Magic races + Adaptable get them. Stats were THREAD CALLS, flagged to mondo.
- three-vfx-effects.js "THE NATURE PASS" block: _nv* kit (thorned tubes, wood.png bark, leaves, flowers, sigil). Signatures for Vine Whip, Thornlash, Wrath, Overgrowth, Entangling Roots, Bumper Crop, Rejuvenation, Into the Green (raceTreelineRetreat), Healing Seed, Leech Seed. pzOwn bolts re-land impact with _nvLand.
- Generic nature theme/staging archetype now leaves, not poison bubbles; noOrb skips windup + burst glass orbs for nature. T4 ultimates still show the shared lens ripple (ThreePost.impactRipple) - left on purpose.
- Untouched: Poison Seed, Trunk Throw, Herbal Remedy.
- Stills: /mnt/project-files/nature-vfx/. Notes: docs/notes/spells-vfx.md + champions-combat.md "THE NATURE PASS".
