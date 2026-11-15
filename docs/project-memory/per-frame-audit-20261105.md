---
name: per-frame-audit-20261105
description: 11-05 PR #955 per-frame rebuild audit after #939: Float32 instance cache re-uploaded every batch every frame; landings rebuilt all units; node HQ warm-up error flood
metadata:
  type: project
  modified: 2026-11-05T12:31:57.174Z
---
mondo 11-05, furious after #939 crystal loop: "what other random items are rebuilding every object on every frame ... fix any bullshit".

PR #955 (token 20261105-stillframes-01-cors, live: three-renderer.js 4a87769b, battle.js ce6a8004):
- `_hqInstSync` compare cache was Float32Array vs double matrices → never equal → every instance batch re-uploaded every frame (81/frame HQ lobby, 25 Fairy Forest board, both renderers). Now Float64Array.
- rebuildObjects always reset unit serials (full rebuildUnits + plates, 15-50 ms) and rebuilt terrain decorations on every run, and most runs are asset landings during fight load. Landing callbacks now set `_objectsLanded` → `rebuildObjects(true)` keeps units + decorations (units still rebuild if `_fieldGroundCache.key` moved). Hard triggers unchanged.
- battle.js: #boardStage transform + subtitle bar class written only on change.
- Node renderer HQ warm-up fake scene lacked onBeforeRender/layers/children → 600+ uncaught errors per room build, nothing warmed. Fixed.
Clean once loaded (0 allocs/frame): boards, HQ, team room, creator stage. Post chain = N8AO+SMAA, 12 renders/frame, settings-driven.
How to profile: scratchpad harness pattern = init script hooking THREE prototype methods + id-counter probes + MutationObserver, route cdn.entropywars.net/*.js to local files. Cloud swiftshader ~1 fps; boards need ~5 min to finish loading. Notes docs/notes/rendering-loading-perf.md "THE PER-FRAME AUDIT". Related [[crystal-pixelate-flicker-20261105]].
