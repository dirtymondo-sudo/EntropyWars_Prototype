---
name: psychic-vfx-20261025
description: PR #515 (10-25) psychic pass - third eye + mind rings on every psychic spell, family signatures, new Mind Blank row (flagged call)
metadata:
  type: project
---
PR #515 merged 2026-10-25 (mondo: "do a similar thread on each element ... consistent look ... nice amount of spells for each"; sibling element passes ran in parallel: sonic #512, water #511, wind #513, metal #516, ...).

- Shared look for every psychic row (element psychic, or vfxElement psychic with no element): THIRD EYE over the caster on windup, MIND RINGS on whoever it lands on (rise for buffs), MIND SIGIL for aoes; psychic got its own theme/beam colour/staging archetypes (psychic / psychicAid / psychicHex, noOrb).
- Hooks: three-vfx-effects.js block "THE PSYCHIC PASS" (after the TELEPATH pz sigs) reassigns the closure bindings fire / _stageArchetype / _beamColorFor — no shared line edited. Rings key off landing intents; staging burst is only a fallback (burst can come ~1 s after impact).
- Signatures: Kinetic Hurl, Telekinetic Slam (owns the pull line), Psychic Beam, Migraine, Mind Shatter, Telepathic Link, Mind Blank.
- New row raceMindBlank: T2, 50 MP, magic 90, r4, Silence 1 — closes the Silence -> Mind Shatter combo gap. THREAD CALL, flagged to mondo.
- Stills: /mnt/project-files/psychic-vfx/. Capture rig: Spell Lab + freeze performance.now() N ms after an intent (one cast per still).

**How to apply:** follow-up psychic looks go in that block; add a row to _PS_OWN when its own signature draws the rings.
