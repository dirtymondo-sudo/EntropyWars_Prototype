---
name: severed-parts-20261029
description: PR #682 (10-29) Halloween pack Body_part pieces in Zombie/Ghoul/Undead/Necromancer/Flesheater gory spells + finishers; calls flagged
metadata:
  type: project
  modified: 2026-10-29T22:42:18.191Z
---
PR #682 merged 2026-10-29, token 20261029-hwparts-02-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261029-2241.zip.
Code: three-vfx-effects.js block "THE SEVERED PARTS" (`_bp*`, `_BP_ON_BURST` keyed by spell id on fire('burst')), on the shared
loader ThreeRenderer.halloweenClone (PR #677). Notes: docs/notes/spells-vfx.md "THE SEVERED PARTS". Proof: /mnt/project-files/severed-parts/.
Looks only. Tear (bites/claws), Hands (Grab, Grave Grip, Rigormortis), Feast (Cannibalize, Carrion Feast), Raise the Dead,
Plaguefield rain, Shambling Horde kick; finishers Pile-On, Feeding Time, Grave Robbery/Six Feet Under, Recruited.
Calls flagged to mondo: shared bites (Ghoulish Bite, Frenzy, Terror Pounce, Infectious Bite) tear only for the 5 dead races;
finisher parts only for those races and not on the stage preview; Body/Body_01 left to the coffins thread.
Sibling Halloween threads 10-29: candy (#677/#681), coffins, headstones (#683). [[gore-rules]] [[blood-vfx-20261025]]
