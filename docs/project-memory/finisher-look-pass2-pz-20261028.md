---
name: finisher-look-pass2-pz-20261028
description: 2026-10-28 finisher pass 2 (P–Z, PR #651): flat banner rays + rush lines off for all finishers, real Light Rays hook (ThreePost.rayBeat), energy shafts, referee pick pending
metadata:
  type: project
  modified: 2026-10-28T17:18:22.614Z
---
mondo 10-28 (furious-ish): Excommunicated's "cheap looking rectangular light rays when this game has actual light rays"; Hail Mary referee was the homo sapien model. PR #651 merged 10-28, token 20261028-finlight-pz-01-cors, zip ENTROPY_WARS_SYNC_20261028-1717 (battle.js, styles-cinematic.css, three-post.js, three-renderer.js, three-vfx-effects.js).

- The cheap rays = the finisher banner's CSS `.ews-fx` conic backdrop. Now hidden for EVERY finisher (`.ews-overlay.ews-fin .ews-fx`), A–Z. `_sigSpeedLinesFx` 2D rush lines also skip while a finisher banner is up.
- Real rays API: `ThreePost.rayBeat({x,y,z,color,strength,inMs,holdMs,outMs,ifIdle})` -> {move, stop}. VFX helpers `_finRays`, `_finRaysAt` (export finRaysAt), `_finLight` (flashLight), `_finShaftMat` (energy shader drop-in for flat cones). battle.js `_FIN_RAYS` table + hit burst for every visible finisher; `_FIN_RAYS_OWN` skips scripts that drive their own. Strength >0.5 washes the frame.
- Split the Arrow halves = `_finCopyBody('victim')` x2 with material clipping planes (`ThreeRenderer.useLocalClipping()`).
- Merged with G–O PR #650 real bodies (`_finBodyMesh` = victim's own model).
- PENDING: referee removed (`REF_RACE = null` in sigHailMary); decision card asked mondo: police officer / mime / supply a model. Set REF_RACE when he answers.
- Shots: /mnt/project-files/finisher-visuals/pz2/. Notes: docs/notes/spells-vfx.md "PASS 2".

Related: [[finisher-visuals-pz-20261028]] [[visual-rules]]
