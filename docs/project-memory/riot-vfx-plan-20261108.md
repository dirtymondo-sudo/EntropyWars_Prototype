---
name: riot-vfx-plan-20261108
description: 11-08 Riot LoL VFX style guide plan (phases A-D, in code, no Blender); A #1056, B #1057, C #1058, D #1061 all shipped; awaiting his review
metadata:
  type: project
  modified: 2026-11-08T14:30:42.766Z
---
mondo 11-08 sent Riot's League VFX style guide PDF and asked to improve VFX clarity, plan first, no Blender. Thread
"Improve VFX clarity with Riot style guide" (thread in the owner project) (it first reverted all
Blender fire+smoke, PR #1051 [[blender-vfx-research-20261103]]). Plan doc https://claude.ai/artifact/Y9TyT9NUqMHnyjXYcbmZGQ.
Details of each phase: docs/notes/spells-vfx.md "THE RIOT PASS, phase A/B/C". Proof /mnt/project-files/riot-vfx/phase-*/.

- A SHIPPED PR #1056: importance weights, secondary step-back, tinted capped flashes, eased timing. Switch EW_NO_RIOT_VFX
  (kills A+B+C). Result subtle.
- B SHIPPED PR #1057: 7 billows repainted as flat value bands, explosion-orange normal blend, velocity streaks.
  Switch EW_NO_RIOT_VFX_B. Subtle in a real match (white hit flash + fire meshes dominate the hit).
- C SHIPPED PR #1058 (token 20261108-riotvfx-c1-cors): TEAM RIMS on zones / delayed blasts / traps from the viewer's
  seat (ally cyan-blue-violet, enemy pink-red-orange, fill keeps spell colour, rim over danger plates); palette audit:
  only clash psi-pulse mint+magenta -> pink+violet. Switch EW_NO_RIOT_VFX_C. Real 2-player online not run.
- D SHIPPED PR #1061 (token 20261108-riotvfx-d1-cors): short spell-coloured line round the real footprint at the hit
  (not a tile highlight; anticipation-only rule kept), rings centred on an area stop at its edge, delayed-blast
  countdown ring (fills as units finish, gold 75%), blast border follows mask; Fire pass: Fireball/Combust rings on
  target square, Meteor inside 3x3, Inferno + Wall of Fire already matched. Switch EW_NO_RIOT_VFX_D. Last planned
  phase; further per-element passes (ice, lightning...) only if he asks.

**Why:** mondo wants clarity per the guide and rejected sim/photo-style fire+smoke.
**How to apply:** build in order, real-match before/after proof per phase. Proof lesson: force the same caster
(`state._blitzActiveUnitId`), reset `_spellsUsedThisTurn`/`_spellCooldowns`, clear `state._activeZones` between runs;
board marks hide behind per-tile danger plates (renderOrder 6), and a spawn-glow light shaft comes and goes, so shoot
before/after back to back.
