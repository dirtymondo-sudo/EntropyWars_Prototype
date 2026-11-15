---
name: spell-fx-cam-20261026
description: FX-CAM spell camera fix (PR #567, 10-26) — what changed, the calls flagged, what's left
metadata:
  type: project
---
PR #567 merged 2026-10-26 (token 20261026-fxcam-1-cors, zip ENTROPY_WARS_SYNC_20261026-2205 = battle.js only).
Camera-only pass on spell look audit causes 7/8/11: blink/escape/grapple/Far Sight shots, front-3/4 self shots sized to body,
glide back after turn-ending cast, tilt cap 90 (EW_CINE_SKY_TILT), Eject stays on mech, side-on charge landing, end cap swing,
AoE print later/tighter, summon rise glam, windup drift (EW_DISABLE_WINDUP_DRIFT), OTS swing by size.
Gotcha: every family director calls c.own() at t=0, so any stock-beat code gated on !_cineShotOwned never runs for real spells.
mondo overruled 'glide back host-local' ("online host and guest experience needs to be equal"): PR #568 relays it (cam-action-settle pre). Calls flagged: steal number-before-camera left (timing rule); harness stray range line; fog-hidden escapes no shot.
PR #568 also fixed knockback hold, landings via _spellFocusCamera landUnit (relayed landId), Eject hard cut. Zip ENTROPY_WARS_SYNC_20261026-2225 (battle.js+online.js).
Notes: /mnt/project-files/spell-vfx-audit/fix/FX-CAM/NOTES.md. Related [[spell-vfx-audit-20261026]].
