---
name: spell-vfx-fx5-20261026
description: Spell look fix batch FX-5 (plain support/board casts) — PR #565 merged 10-26, zip 20261026-2152, calls flagged, harness tips
metadata:
  type: project
  modified: 2026-10-26T21:52:56.718Z
---
FX-5 of the spell VFX fix pass ([[spell-vfx-audit-20261026]]): PR #565 merged 2026-10-26, token 20261026-fx5-1-cors,
zip /mnt/project-files/r2-sync/ENTROPY_WARS_SYNC_20261026-2152.zip. Notes + before/after sheets in
/mnt/project-files/spell-vfx-audit/fix/FX-5/.

Built: own looks for war cries / scans / domes / Exhaust Cloud / Lunar Regen (moon GLB) / Time Rewind (clock GLB) /
Hellfire Crown / Stone Skin (three-vfx-effects.js "FX-5" section, _CAP_SIGS). Escapes: `_ESC_LOOKS` + renderer
`escStyle` (fly/swing/eject/dive/blink) through animateDisplacement, relayed via online.js displace-anim. Bipod = sniper GLB on floor.

Calls flagged to mondo (not changed): Omni-Vision/Cosmic Sight text fixed to the 3x3 reveal (mondo 10-26, PR #566);
statUp gold rings stay shared by all buffs; Spring Snare laid prop still dreamcatcher.
Missing models appended: horse (Saddle Up), ejection seat, polaroid, spring jaws, sandbags.

Harness tips (added only to the FX-5 thread's /tmp copy of sv-run.js, not the shared one): SV_DIRECT=1 skips HUD (escapes draw nothing on the board-click path until FX-CAM);
SV_PROBE="<js expr>" logs an eval after prep. Self-cast cam zoom 7.13 crops anything >1.3 tiles over a head (FX-CAM's).
