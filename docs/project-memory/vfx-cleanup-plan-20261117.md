---
name: vfx-cleanup-plan-20261117
description: 11-17 plan to strip generic white spell VFX, new beam kit, reuse the air-door portal look; PR #1966 merged (doc only), waits mondo's OK, Fable to build
metadata:
  type: project
  modified: 2026-11-17T13:02:17.859Z
---
mondo 11-17 ((thread in the owner project)): generic white VFX crowd spells (Blade Waltz hides the sword, Sword Beam's beam looks bad); go through every spell; better beams (anime ki / sci-fi blaster / wand duel); reuse the cutscene portal look. KEEP the orange-red slashes (Dragon Slash combo, the red slash scars `_crSlashScar`). Plan first, then Fable builds with screenshot proof.

PLAN: docs/plans/vfx-cleanup/VFX_CLEANUP_PLAN.md (+ SPELL_TABLE.md, batches/B2..B10 txt, img/, tools/). PR #1966 merged, no game change. Frames also in /mnt/project-files/vfx-cleanup/.
Findings: white comes from SHARED layers: `_stageBurst` (every non-support spell: screen flash, rush lines, ring, speed burst, aftershock), pale `_STAGE_ARCHETYPES` flash colours (Riot pass tints every untinted flash particle with them), noise wash `_NZ` wind/metal/sonic/ice near-white, white in `_sigSlashCombo3D` finisher + `_sigCrescentSlash3D` tip glint, per-square flash layers, generic laser `_spawnLaserBeam3D` (25 line spells). Keep THE HIT BLINK (his 11-04 ask).
Portal he likes = `_sigAirDoor3D` (counter-turning rings, dark void centre, teal->violet bruise, smoke falling out).
Rules: STRIP 548 / REPLACE 315 / BEAM 25 / LEAVE 98 of 986 castable. Switch to add: EW_NO_VFX_CLEANUP. Clash = visual only (prisms, walls, shields); a real beam struggle would be a new rule, ask him.
**How to apply:** batch threads follow VFX_CLEANUP_PLAN.md section 6; capture harness now IN THE REPO: docs/plans/vfx-cleanup/tools/harness/ (setup.sh, then node /tmp/sv/sv-run.js; PR #1982, so the other Fable session can use it). HIS ANSWERS 11-17 (PR #1972/#1975): Sword Beam matches the sword cuts (orange-red); ki/blaster/wand are EXAMPLES, never force a spell into a category; portal only on summons where it makes sense (not e.g. Ringmaster's eagle); sight lasers cyan-blue own/friendly, red-pink enemy. Plan is ready for Fable.
