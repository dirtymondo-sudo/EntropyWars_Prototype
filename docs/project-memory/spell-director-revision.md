---
name: spell-director-revision
description: State of the spell director plan after mondo's 2026-09-24 revision (craft + one-model phases, backdrop opt-in)
metadata:
  type: project
  modified: 2026-09-24T03:28:13.152Z
---
2026-09-24: mondo revised SPELL_DIRECTOR_PLAN.md. "Improve the VFX" means lights, particles, 3D objects (realistic beams, gun tracers and muzzle flash, better explosions, red glowing sword scars), NOT a psychedelic backdrop.
- Backdrop / void / trip hue wash is OPT-IN per spell only.
- Spells must reuse the same Meshy models as DOOR HQ. Crossover table: plan §12. Model list: MODEL_INDEX.md.
- Delivery 1: ENTROPY_WARS_SPELL_CRAFT.zip (token 20260924-spell-craft-01-cors): lights, tracer, explosion, scar, lit beam, first model swaps.
- Delivery 2 (same day, session 2): ENTROPY_WARS_SPELL_CRAFT_2.zip in /mnt/project-files/spell-craft-2/ (token 20260924-spell-craft-02-cors). THE CRAFT finished (gatling, shards, ribbons, velocity sparks, particle thinning, hit read), impact ripple built on ULTIMATES ONLY (default; mondo hadn't answered heavy-vs-ultimate), §12 rows done (tank, pen, honda civic, crashed car, astral eyes, HQ procs via _hqOneModel, one loader per file). Next: Phase 4 THE BODY.
- Delivery 3 (session 3): ENTROPY_WARS_SPELL_BODY.zip in /mnt/project-files/spell-body/ (token 20260924-spell-body-01-cors). Phase 4 THE BODY caster side: 18 deferred-bake verb slots + sprites.js SPELL_ANIM_VERBS router; top clip 27%->14%. Superseded same session by ENTROPY_WARS_SPELL_BODY_2.zip in /mnt/project-files/spell-body-2/ (token 20260924-spell-body-02-cors): playtest cut 4 verbs (call/hook/pour/reload moved to existing slots), hitStagger victim reel on enemy shoves + shield breaks, Phase 5 slice 1 = battle.js _COMBO_WORLD world event per combo (21). 
- Delivery 4 (session 4): ENTROPY_WARS_COMBO_CAM.zip in /mnt/project-files/combo-cam/ (token 20260924-combo-cam-01-cors). Phase 5 DONE: combo camera director (COMBO_DIRECTOR_SHOTS, spellId combo:<key> + comboPartnerId relayed), all 21 playtested via repo tool playtest_combocam.js. Needs `npm i --no-save three@0.128.0 react@18 react-dom@18 three.meshline` for probes. Next: Phase 6 THE CAPSTONES (44 bare ultimates). mondo's last upload put spells-vfx.md at the repo ROOT instead of docs/notes/; the root copy is stale.
- Delivery 5 (session 5): ENTROPY_WARS_CAPSTONES.zip in /mnt/project-files/capstones/ (token 20260924-capstones-01-cors). Phase 6 DONE: 44 capstone signatures (three-vfx-effects.js THE CAPSTONES, hooked on the relayed windup/burst in _fireStage) + directors (battle.js CAPSTONE_DIRECTOR_SHOTS via _capSeq); census bare capstones 0. Known pre-existing gap: delayed spells' mark turn runs on the support rig where the delayed family's beats never fire. Next: Phase 7 THE JUICE PASS.
- Delivery 6 (session 6): ENTROPY_WARS_JUICE.zip in /mnt/project-files/juice/ (token 20260924-juice-01-cors). Phase 7 DONE: weight hitstop table (+kill freeze; death slow-mo now queued behind it), 4-word shake with one-kick-per-beat, punch-scaled numbers, per-weight kill confirm + world flinch (VFX3D.juiceHit, relayed), status flourishes (statusFlourish), strike-frame sounds. Kill-switch EW_DISABLE_JUICE. Real fps at Low tier unmeasured (swiftshader). Next: Phase 8 THE NEW CLIPS.
- mondo (2026-09-24) ALLOWED playtesting for the spell director plan (overrides CLAUDE.md RULE #1c for this work). Probes that work here: the real EWCharViewer with CDN URLs routed to rigged_animations/ (cast clips), and window._comboPlayPresentation in a live VS-CPU battle (combos); scripts under /tmp are lost with the container.
- Open: `cross` vs `wooden_cross` duplicate model file (mondo picks one). THE TOWER's tarot card swap is a "maybe".

**Why:** mondo said the backdrop plan misread "improve the VFX", and mixed generated and Meshy art looks inconsistent.
**How to apply:** new spell VFX use the craft kit plus existing Meshy models. Never add a default-on backdrop. Notes go in docs/notes/spells-vfx.md and models-assets.md.
