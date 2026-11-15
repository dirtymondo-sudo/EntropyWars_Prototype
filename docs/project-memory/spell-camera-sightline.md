---
name: spell-camera-sightline
description: PR #201/#215 (2026-10-14/15) spell shots crane over raised ground, never sit under 1.15 tiles, frame units by real height
metadata:
  type: project
  modified: 2026-10-15T02:22:59.623Z
---
PR #201 merged 2026-10-14; PR #215 merged 2026-10-15 (token 20261015-lowlens-02-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261015-0222.zip, three-camera.js a0600eae).
- mondo: spell cam "low enough that i can see through the ground"; Call of the Deep "goes low and i can see under the map at the very end"; tall/short units not centred.
- Cause: TPS cine eye floored only at the subject's footing; low lens sat under raised tile tops, occlusion fade ghosted those columns to the board base. CotD pay beat (cineLowTile, tilt 88) measured eye 0.5 tile over floor.
- Fix: three-camera.js `_sightLineFloor` (to pivot + every frame-guard body) + `CINE_MIN_EYE_TILES` 1.15; battle.js `window._camSolidGroundPx`; three-renderer `_occHitFadeable` fades terrain only above the body centre; `_cineTpsAnchor` pivots at CINE_BODY_LIFT 0.58 × height, `camera._tpsSizeK` scales the boom.
- playtest_spellcam.js works in the sandbox only if jsdelivr npm paths are served from a local npm install (proxy blocks jsdelivr); its menu steps still reach battle. Repo copy left unpatched.
Notes: docs/notes/spells-vfx.md "THE SIGHT LINE + THE BODY FRAME", "THE LOWEST LENS". Related: [[action-camera-frame-guard]].
