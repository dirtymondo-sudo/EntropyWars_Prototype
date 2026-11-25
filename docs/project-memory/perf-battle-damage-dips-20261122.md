---
name: perf-battle-damage-dips-20261122
description: mondo's battle dips "when taking damage" (11-22, Firefox Mac WebGPU): name plate canvas uploads, combat log layout, CSS2D walk; PR #2373, what waits for his F3, how the fight was profiled in the cloud
metadata:
  type: project
  modified: 2026-11-22T06:07:53.760Z
---
Thread (owner-project id) "Fix battle frame dips". mondo 11-22: "Still getting a lot of frame dips in battle ... It dips when taking damage". PR #2373 merged, token 20261122-softcanvas-01-cors, three-renderer.js 2a2c5129 + ui.js 1db389d9 live. Notes: docs/notes/rendering-loading-perf.md "THE SOFT CANVASES + THE LOG SCROLLS WITH THE FRAME + THE LABELS' LIST".

- F3 "upload · 158×168 canvas" = a unit's NAME PLATE (`_pmPaint`), repainted + uploaded on every HP change. Fix: on Firefox off-page 2D canvases are `willReadFrequently` and go to the GPU as bytes (writeTexture), not `copyExternalImageToTexture`. Off `EW_NO_SOFT_CANVAS`; force on any browser `EW_SOFT_CANVAS` / `?ew_softcv=1`. F3 line "Soft canvases".
- Combat log: each hit forced a whole-page layout (scrollHeight read); scroll now waits a frame.
- "filterAndFlatten < zOrder" in Scene walks = three's CSS2DRenderer (the CUBE plates); now a kept list.
- Slow frames of exactly ~1000 / 2000 ms with small JS = his tab in the background, not a dip.
- NOT proven on Firefox / Mac (cloud is Chromium). WAITING: his next battle F3; "Slow first-time work" should list no canvas upload stamped after the reload. If it still does, the wait is not the canvas read-back: next suspects are plate repaint count and new CanvasTexture per size change.
- Left alone: ew_grass_field 359K tris (steady GPU cost).

**How to apply:** profile a fight in the cloud with a CDP `Profiler` session around playtest.js's TURN_FN loop (launch through probe-fast.js), then read inclusive time under `applyDamageToUnit` / `showFloatingTextAtTile`; it names DOM / layout costs the F3 lens cannot (React and layout work is outside its "JS" number). `EW_PROBE_GL=webgpu` + `?ew_gpu=webgpu` gives WebGPU counts (black picture, device gets lost: no GPU read-back tests). In page scripts `ThreeRenderer` is a bare global, not `window.ThreeRenderer`.
Related [[perf-city-60fps-20261115]] [[perf-atlantis-skinpick-20261113]]

UPDATE 11-22 12:50 UTC: his city-walk F3 CONFIRMS the soft canvases on Firefox ("3900 sent as bytes, 0.23 ms each", no canvas upload in the slow list). Same thread then took the Disaster City walk (43.6 FPS, "keep trying to get to 60"):
- PR #2387 (token 20261122-outlinebounds-01-cors, three-renderer aa942b78 live): one-frame ~60 ms dips "tick: characters 22" = a new townsperson's OUTLINE copy (`_ew_silhouette`) had its box computed per vertex through the bones in `_hqCharCullSetup`; now rest-pose bounds. Cloud profile `_hqTickChars` 358 -> 13 ms.
- Steady state is still the replayed-mesh price (2,285 in view; 60 FPS wants ~850). Census: the "alone: see-through / cut-out" pieces are cut-out SIGNS with their own canvas (128 px high, many widths); same-size groups could join THE SHEET STACK (~200 fewer meshes, ~1 ms). Not built: cannot be seen in the cloud.
- Cloud: full city on WebGPU crashed the page at "ready" (no texture shrink); classic (llvmpipe) city loads in ~270 s and profiles fine for JS ticks (scratchpad city.js: CDP profile still + teleport walk).
- Asked him (decision card) how to go for 60: keep merging / shorter prop distance / both; and for a Chrome F3 at the same spot.

UPDATE 11-22 ~15:00 UTC: he picked "Keep merging, same look". PR #2391 THE SIGNS STACK (token 20261122-signstack-02-cors, three-renderer de25fd91 live): cut-out signs with canvas pictures join the sheet stacks; one stack a frame is checked for a repainted sign; off `EW_HQ_NO_SIGN_STACK`. Cloud WebGPU city run WORKS if model textures are shrunk to 64 px (scratchpad city2.js SHRINK=1: createImageBitmap wrap), ~6 min; counts only. Still alone at the cloud spot: cut-out 189, sign canvas 72, many looks 163, instance cells 808. NOT seen on a real card: WAITING his Shift+F3 "squares, what each mesh is". Next: pad same-height signs to one layer width, then many looks, then instance cells.

UPDATE 11-22 ~16:10 UTC, FIGHT START FREEZE (his "first fight always freezes?"): NOT first-fight only; every room fight. PR #2405 THE GRASS GROWS IN (token 20261122-grassgrow-01-cors): `_ggBuild` (battle grass field, ~27.7K tufts, 0.6-0.8 s in one go inside `activate`) is now a resumable job, 8 ms a frame, rises in 350 ms; off `EW_NO_GRASS_SLICE`. Lens "JS" does not count the fight's lay (activate / _hqEncounterStart run outside the render). LEFT: `_hqEncounterStart` 250-370 ms (party build, _hqLeave render, hqFieldRegister); the fight's room = ~2,700 unmerged parked copies ("bundles 2453 groups", 31 FPS in battle on his Mac): merge them next. Probe: scratchpad fight.js / fightp.js (two fights back to back via `_hqEncounterFire`, CDP profile, rAF gap recorder); notes rendering-loading-perf.md "THE GRASS GROWS IN".
