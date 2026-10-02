# THE RENDERER — three.js r128 to current, then the add-ons

*Plan document, 2026-10-02. Nothing built yet (see §9, the log). House rules that stand over every phase:
no engine switch (§0); no new game .js files (every change lands in the files that exist, plus
index.html); no tests, no CI; mondo playtests each phase on his machine before the next one starts; every
R2 delivery bumps `?v=`; the game must look the same after each phase unless the phase says otherwise.*

mondo's brief (2026-10-02, thread "Babylon.js and three.js add-ons"), the parts that decide things:

- "is babylon.js any use to this game? ... is it worth using it?" — answered no (§0).
- "Are there any other three js things we can use? like we have three lightning, is there anything else
  like that?" — the add-on list (§1), ranked.
- "I want to try all of those, how do i update three js?" — this plan.
- "make a plan doc as well."

---

## 0. The verdict, in one paragraph

Stay on three.js. Babylon.js is a complete engine (scene graph, physics, GUI, audio) and it does nothing
this game needs that three.js plus the add-ons below cannot do; switching means rewriting the renderer,
the VFX, the post stack and the editor (three-renderer.js 62k lines, three-vfx-effects.js 40k, three-post.js
3k, three-vfx.js 3k, plus the three.js calls in editor.js, map.js, battle.js, creator-render.js and
sprites.js: about 110k lines) to arrive back where we are, with no draw-call fix included. The draw-call
fix is instancing and batching, which the perf thread is already doing. What IS out of date is the
three.js version: the game runs **r128 (May 2021)**, loaded as classic `<script>` tags from cdnjs and
jsdelivr (index.html lines 300-335), while the menu's sky shader already runs **r160 as a module** through
an import map (index.html line 335) — two copies of three.js load on every boot today. The plan brings
the game to the current release in two steps that each ship on their own, unifies the two copies, and then
tries the add-ons one PR each so mondo can judge each on its own.

"Three lightning" is not an add-on: `three-lightning.js` (574 lines) is our own file for the sky bolts
(`ThreeLightning.strikeFromSky`, used from battle.js). The outside three.js code we load today, all r128,
all from `examples/js/` (the classic-script build):

| File | What it does for us |
|---|---|
| `EffectComposer`, `RenderPass`, `ShaderPass`, `CopyShader` | the post stack in three-post.js |
| `UnrealBloomPass`, `LuminosityHighPassShader` | bloom |
| `SMAAPass`, `SMAAShader`, `FXAAShader` | anti-aliasing (Settings > AA) |
| `GLTFLoader` + `meshopt_decoder` | every model; the `.opt.glb` files are meshopt-compressed |
| `OBJLoader` | legacy props |
| `SkeletonUtils` | clones rigged units so each has its own skeleton |
| `CSS2DRenderer` | nameplates, damage numbers, door labels (27 `CSS2DObject` uses) |
| `THREE.MeshLine.js` (on R2, our copy) | thick lines: the lightning bolts and tracers |

---

## 1. The add-ons, ranked

Each line says what it would do for THIS game; the phases below say how. None is adopted until its phase
is playtested.

1. **three.js itself, r128 → current.** The biggest win: `BatchedMesh` (many DIFFERENT props in one draw
   call, which is the downtown problem: ~860 draws after PR #45, most of them tiny meshes), faster
   `InstancedMesh`, a working `KTX2Loader`, better shadow and skinning paths, four years of bug fixes.
   Phases R1 + R2.
2. **KTX2 / Basis Universal textures** (`KTX2Loader`, part of three.js; the transcoder files go on R2).
   Textures stay compressed ON the GPU: 4-6× less video memory, faster room attaches, less of the MEM
   line's pressure. Fits the 30k-triangle character goal, since those need their texture memory. Phase R3.
3. **three-mesh-bvh.** Accelerated raycasts against a BVH built per geometry. We raycast in ~65 places
   (walk collision, tile picks, camera collision, the Door Gun hit scan): 10-100× faster each. Phase R4.
4. **pmndrs `postprocessing`.** Replaces the r128 EffectComposer: it merges bloom, grade, the retro pass
   and AA into fewer full-screen passes (fewer passes matter most on mondo's DPR 2 Mac), and brings a
   better SMAA and N8AO ambient occlusion. Phase R5. The biggest rewrite of the list (three-post.js).
5. **troika-three-text.** SDF text drawn on the GPU in place of the CSS2D DOM nameplates and damage
   numbers: no layout thrash when many are on screen, text that sits IN the scene (occluded, fogged).
   Phase R6.
6. **three.quarks.** A GPU particle system (emitters, curves, trails) that could carry the spell
   particles in three-vfx-effects.js. Only if the F3 lens shows VFX as a cost. Phase R7, optional.

Not on the list: the PS1 look. three-post.js already has the retro pass (pixel size, vertex snap,
dither scale and strength); that is tuning, no library adds anything.

---

## 2. What r128 → current breaks (the audit, 2026-10-02)

Checked by loading r128 and r147 in Node and diffing every `THREE.*` name, every prototype method and
every shader string our `onBeforeCompile` hooks `.replace()` against the shader chunks of both versions.

**Already safe (guards in place):** `Matrix4.getInverse` (two call sites, both `if (m.invert) ... else
getInverse`), `THREE.RGBFormat` (guarded by `!== undefined`), `getMaxAnisotropy` (via `capabilities`,
try/catch), GLTFLoader's `setMeshoptDecoder` (guarded). No `THREE.Geometry`, `Face3`, `THREE.Math`,
`WebGLMultisampleRenderTarget`, `gammaFactor` or `applyMatrix` anywhere.

**Breaks at r129-r147 (Phase R1 fixes):**
- The height fog patch (three-renderer.js ~1898, `_ewHeightFogPatch`) rewrites `ShaderChunk.fog_vertex`
  by replacing `varying float fogDepth;` and `fogDepth = - mvPosition.z;`. From r129 the varying is
  `vFogDepth`, so the replace no-ops silently and the HQ height fog vanishes. Fix: match both names.
- `skinning: true` in a `MeshStandardMaterial` constructor (three-renderer.js ~36250) warns from r131
  (skinning is automatic). Drop it.
- All 13 other `#include <...>` anchors we hook (`project_vertex`, `map_fragment`, `color_fragment`,
  `worldpos_vertex`, `emissivemap_fragment`, `common`, `begin_vertex`, `dithering_fragment`, `uv_vertex`,
  `void main() {`) still exist in r147: verified against the r147 chunks.
- `THREE.MeshLine.js` (our R2 copy) uses `ShaderChunk` (13 refs) and `BufferAttribute`; the chunk names
  it includes must be re-verified against the target version; it has no `Geometry` use.
- The `examples/js/` add-on URLs just change their version number: all ten files still ship in r147.

**Found by mondo's first r147 playtest (2026-10-02, fixed in R1b):** the audit above diffed `THREE.*` names and the
shader strings our hooks REPLACE; it did not diff the GLSL helpers our hooks CALL nor a method's semantics. Two
slipped through:
- `mapTexelToLinear()` is gone since r136 (an sRGB texture is decoded by the GPU, `SRGB8_ALPHA8`). The triplanar
  terrain hook (`#include <map_fragment>` replacement, three-renderer.js ~42889) called it, so every field/city
  ground program failed to compile: the ground vanished, the sky and bloom blew out the frame ("light and bloom
  intense in the city"), and the invalid program drew with whatever was bound before it (the texture flicker).
- `SkinnedMesh.boneTransform(index, target)` reads the vertex FROM `target` since r129 (r128 read it from the
  geometry; r151+ names it `applyBoneTransform`). `_skinnedBBox` passed an unset target, every vertex skinned to
  (0,0,0), the box collapsed, and the fit scale went to ~5000× with the model 130 m up ("the rigged models don't
  show"; the sedan has no bones, so it was fine). Fix: `v.fromBufferAttribute(pos, i)` first, `applyBoneTransform`
  when it exists.
Lesson for R2: grep every GLSL identifier our shader strings call against the target version's chunks (the
scratchpad script did that for FUNCTIONS; `mapTexelToLinear` was a per-material `#define`), and read the
migration guide for every method the renderer calls on three objects, not only for removed names.

**Breaks at r148-current (Phase R2 fixes):**
- **r148 deleted `examples/js/`.** Add-ons exist only as ES modules (`examples/jsm/`). The game's 35
  scripts are classic scripts that read the `THREE` global. Fix without new files: index.html gets ONE
  inline `<script type="module">` (before the game scripts) that imports three and each add-on from the
  import map that is ALREADY there (line 335, pointing at r160 today) and assigns them onto
  `window.THREE` (`THREE.EffectComposer = EffectComposer`, and so on, the same names the game uses now).
  The game's `<script src>` tags get `defer`, so they run after the module in document order. The sky
  shader's module then shares that one copy: two copies of three.js become one.
- **r152 colour management.** `sRGBEncoding`/`LinearEncoding`/`texture.encoding`/`renderer.outputEncoding`
  (12 uses, three-renderer.js + three-post.js) become `SRGBColorSpace`/`NoColorSpace`/`texture.colorSpace`/
  `renderer.outputColorSpace`, and `ColorManagement.enabled` defaults to true (hex colours set via
  `Color.set` are read as sRGB and converted to linear, so every `0x..` material colour comes out
  different). Decision: set `THREE.ColorManagement.enabled = false` on boot so the picture matches r128
  exactly, then retune only if mondo wants the newer look. The post stack's grade (three-post.js ~1513)
  assumes sRGB-encoded targets: re-check.
- **r155 lighting.** `useLegacyLights` defaults to false (removed in r165): point and spot light
  intensities are divided by π relative to today and `decay` defaults to 2 (was 1). Every `PointLight`
  (28 constructions) and `SpotLight` needs its intensity × π and `decay: 1` written explicitly (one
  helper, applied at construction). three-vfx.js already sets decay 1.6 on the spell lights.
- `Object3D`/`Material` warnings for unknown constructor keys: sweep the console once.
- `WebGLRenderer.physicallyCorrectLights`, `renderer.gammaOutput`: not used. `Texture.needsUpdate`,
  `BufferGeometry` API, `InstancedMesh`, `AnimationMixer`, `SkinnedMesh`: unchanged in the ways we use
  them.
- `three.min.js` (the UMD build) is gone from the package since r160: the module route above is the
  only route, which is why R2 does the module shim rather than R1.

---

## 3. Phase R1 — r128 → r147 (classic scripts kept)

The last release with `examples/js/`. Low risk, same colour, same lights.

1. index.html: `three.js/r128/three.min.js` → `three@0.147.0/build/three.min.js` on jsdelivr (cdnjs
   stops at an older revision; jsdelivr serves every npm version), and the ten `examples/js/` URLs
   → `three@0.147.0/...`.
2. three-renderer.js: the height fog patch matches `fogDepth` OR `vFogDepth`; drop `skinning: true`.
3. `THREE.MeshLine.js`: verify its `#include` chunk names against r147; fix if any moved.
4. Boot check: load the title, the HQ lobby, one battle, one spell with bloom, the editor, and read the
   console for `THREE.` warnings. Fix each.
5. Deliverable: index.html (repo, Render) + three-renderer.js (+ THREE.MeshLine.js if touched) in one zip.

mondo playtests: HQ height fog is there, shadows, bloom, SMAA, a rigged unit animates, the editor opens.

## 4. Phase R2 — r147 → current (the module shim, one copy of three.js)

Built 2026-10-02 against three@0.186.1 (what shipped; the plan's wording before the build is in git):

1. index.html: ONE import map (`three` → `build/three.module.js`, `three/addons/` → `examples/jsm/`, 0.186.1) and
   ONE inline `<script type="module">` shim right where the r147 script tags were. It imports `three` plus
   EffectComposer, Pass + FullScreenQuad, RenderPass, ShaderPass, UnrealBloomPass, SMAAPass, CopyShader,
   LuminosityHighPassShader, FXAAShader, the three SMAA shaders, CSS2DRenderer + CSS2DObject, OBJLoader,
   GLTFLoader, SkeletonUtils (the namespace) and MeshoptDecoder, copies the frozen namespace into a plain object
   (`Object.assign({}, THREE)` — the game patches ShaderChunk and swaps PointLight on its copy), hangs the add-ons
   on it under the examples/js names (`THREE.Pass.FullScreenQuad` included), sets `ColorManagement.enabled =
   false`, and assigns `window.THREE` + `window.MeshoptDecoder`. Every classic `<script src>` after it carries
   `defer` (a module script is deferred, so the shim runs first only if the game scripts are deferred too); the
   three inline blocks that test for a deferred script's globals (the data.js fallback, the sprites.js fallbacks,
   the first-launch profile hook) became `type="module"` so they keep running after the script they test. The
   sky shader's own module now shares that one copy (it was a second, r160 copy). Two `modulepreload` links.
2. three-renderer.js: `_ewTexSetSRGB` / `_ewTexIsSRGB` / `_ewTexCSKey` (after `_ewHeightFogPatch`) replace the
   twelve `encoding` sites and work on both spellings; the board renderer pins `outputColorSpace =
   LinearSRGBColorSpace` (r152's default is sRGB; r128's was linear and the whole pipeline assumes it), the
   creator viewer `SRGBColorSpace`. `_ewLegacyLightPatch` (revision ≥ 155 only) rewrites `lights_pars_begin`
   ONCE at load: `getDistanceAttenuation` back to r128's linear ramp, `PI *` on the ambient / hemisphere /
   directional / point / spot (and sun) colours, `lightMapIntensity * PI`, and replaces `THREE.PointLight` /
   `THREE.SpotLight` with subclasses whose decay defaults to 1 — so the per-light helper the plan first
   described was not needed: no light construction changed. The r186 load check then found two more breaks the
   static audit cannot see: the current three.js declares `vUv` only for anisotropy (every map reads its own
   `vMapUv` since r151), so the water hook on MeshLambertMaterial (`uWave1/uWave2` after `<color_fragment>`)
   failed to compile — it now carries its own `vEwUv` varying; and `_skinnedBBox` gated its skinned path on
   `typeof n.boneTransform`, gone since r151, so every rig measured its naive box and the fit scale went 94× —
   the gate accepts `applyBoneTransform`. The creator viewer's `THREE.Clock` (deprecated for `Timer`) became a
   two-line delta timer.
3. three-post.js: `_SsaoPass` is a class extending `THREE.Pass` (the module Pass is a class; `Pass.call(this)`
   throws); `PCFSoftShadowMap` is gone in the current three.js (its PCF filters through a hardware shadow
   sampler, which IS the soft look) — the shadow type reads the chunk for `SHADOWMAP_TYPE_PCF_SOFT` and picks
   PCF outright when it is absent, instead of three's per-renderer warning + fallback. `readRenderTargetPixels`
   still exists (the AE measure is untouched); SMAAPass ignores its old size arguments.
4. `THREE.MeshLine.js`: its ten chunk names all exist in r186; untouched.
5. `BatchedMesh` for the static batch: NOT in this PR (the plan said "only if small"). It is R2b, after mondo's
   playtest of R2 — the batch path (`R.batchP`) and the F3 lens are the starting point.
6. Deliverable: index.html (repo, Render) + three-renderer.js + three-post.js (the zip).

mondo playtests: the picture matches R1 (colours, light levels, shadows), the sky shader still runs, the
creator viewer, the water tiles and the rigs all look as before.

## 5. Phase R3 — KTX2 textures

1. `optimize-assets.js` learns `--ktx2`: writes `<name>.ktx2` beside each texture (and inside each GLB
   via `KHR_texture_basisu`) with the `toktx`/`basisu` CLI mondo runs locally; `manifest-assets.js` lists
   them. The game loads a listed `.ktx2` in place of the PNG/JPG, like `.opt.glb` today.
2. index.html shim adds `KTX2Loader`; the Basis transcoder (`basis_transcoder.js/.wasm`) goes on R2 and
   `setTranscoderPath` points at it. GLTFLoader gets `setKTX2Loader`.
3. Deliverable: the tooling (repo), index.html, three-renderer.js, sprites.js if the texture table moves.

Measure: the MEM line before and after in the same room.

## 6. Phase R4 — three-mesh-bvh

1. Shim imports `computeBoundsTree`, `disposeBoundsTree`, `acceleratedRaycast` and installs them on
   `BufferGeometry.prototype` / `Mesh.prototype` (the library's documented one-liner).
2. three-renderer.js builds the tree for room shells, terrain and props once at attach (and disposes it
   at detach: the memory budget counts it). Skinned units are excluded (the tree would be stale per
   frame).
3. Nothing else changes: every existing `Raycaster` call gets faster for free.

Measure: the F3 lens gains a "pick ms" line.

## 7. Phase R5 — pmndrs postprocessing

three-post.js is rebuilt on `EffectComposer` + `EffectPass` from `postprocessing`: bloom
(`BloomEffect`), the grade, the retro pass (as a custom `Effect`, same uniforms as today), SMAA
(`SMAAEffect`), optional N8AO. Settings > Performance and the `ThreePost.set*` API (55 callers in ui.js
and three-renderer.js) keep their names. This is the largest phase after R2 and lands only after R2 has
been played for a while.

## 8. Phase R6 + R7 — troika text, three.quarks

R6: nameplates and damage numbers become `troika-three-text` meshes; the CSS2D ones stay for the door
labels and the editor until proven. Fonts: the game's existing UI font file from R2. R7: three.quarks
only if the lens shows the particle path as a cost; otherwise skipped.

---

## 9. The log

- 2026-10-02: plan written; the audit in §2 run against r128 and r147 (Node, both packages).
- 2026-10-02 R1 built (zip renderer/ENTROPY_WARS_R147.zip): index.html loads `three@0.147.0/build/three.min.js` and the
  ten `examples/js` add-ons at 0.147.0 (jsdelivr; cdnjs stops before r147); three-renderer.js `_ewHeightFogPatch` reads
  the fog varying's name off the chunk (`fogDepth` r128 / `vFogDepth` r129+) and warns if neither anchor bites;
  `skinning: true` dropped from the creator material. THREE.MeshLine.js (our R2 copy) only includes fog + logdepth
  chunks, all still in r147, so it is untouched. Offline load check (sandbox, r147 from npm, stand-in textures): the HQ
  rotunda with the post stack (bloom, SMAA, retro pass) and the field strike into a battle both run with no new console
  error or THREE warning; `THREE.REVISION` 147, the height-fog patch present in both chunks. mondo playtests before R2.
- 2026-10-02 R1b (zip renderer/ENTROPY_WARS_R147B.zip, three-renderer.js only): mondo's playtest found the rigged
  models missing, texture flicker and a blown-out city. Both causes are in §2 "Found by mondo's first r147
  playtest": the terrain hook's `mapTexelToLinear` (program failed) and `boneTransform`'s new target-in semantics
  (bounds collapsed, scale 5000×). Reproduced in the sandbox with the real CDN assets through the proxy (the
  harness's NPM_MIRROR pointed at the scratchpad tarball, `VER=0.128.0|0.147.0`): r128 units at world scale 0.77,
  r147 at 5364 before the fix; the triplanar program listed in `renderer.info.programs` with diagnostics. The
  sandbox cannot show HQ NPC rigs (their GLBs time out behind the 60 s gate at ~2 fps), so the battle probe
  (playtest_field_offline.js + CDN routes) is the rig check.
- 2026-10-02 R1b shipped WITHOUT a `?v=` bump (PR #47 left index.html alone), so the edge kept serving the R1
  three-renderer.js and mondo saw "same exact issues". PR #48 bumped the token to `20261002-r147-02-cors`. Rule for
  every phase: a changed R2 file always ships with a bumped index.html, even when index.html had nothing else to change.
- 2026-10-02 R2 built against three@0.186.1 (zip renderer/ENTROPY_WARS_R186.zip = three-renderer.js + three-post.js;
  index.html via the PR). What shipped is §4 above. The static audit (every `THREE.*` name, every removed prototype
  method, every shader anchor our hooks replace, r147 vs r186) flagged only the encoding constants, `boneTransform`
  and the `Pass` class; the sandbox load check with the real CDN assets (probe_r186.js rotunda + city,
  probe_field_r186.js battle) found two more that no static check can: `vUv` undeclared in the water hook (the
  current three.js declares it only for anisotropy) and the `typeof n.boneTransform` gate in `_skinnedBBox` (rigs
  at fit scale 94× before, 0.75 after — r147 measured 0.77). After the fixes: REV 186, the height-fog patch in both
  chunks, the legacy-light patch hits all 7 anchors, no program with diagnostics in the rotunda, the city or the
  battle, no page error. Lesson, again: a `typeof x.oldName` guard fails SILENTLY on a rename — grep every
  `typeof` gate on a three.js method when bumping. BatchedMesh is R2b, after mondo's playtest.
- 2026-10-02 R2 hotfix (index.html only): the two `modulepreload` links sat BEFORE the import map, and a module fetch
  that starts before the map is parsed voids the map — Firefox then refused the bare `three` specifier in the shim and
  the sky module, no `window.THREE` was ever set, every game script died at parse and the page showed the raw DOM
  (the party builder's overlay) with no title. Chromium tolerated the order, so the sandbox check missed it. The
  import map now comes first, the preloads after it. Lesson: nothing module-related (preload, module script) may
  precede the import map, in any browser.
- 2026-10-02 R2 follow-up (mondo's playtest of R2: "it works now and it looks better"): bloom is OFF by default
  (three-post.js `BLOOM_USER_STRENGTH = 0`, saved under a new `ew_bloomStrength_v4` key so the old stored 0.01 no longer
  keeps the pass on, and `_bloomUser()` makes the player's OFF win over a scene look — before, a look's `bloomStr` or the
  HQ floor of 0.42 overrode a tiny slider value, which is why 0.01 still glowed "bright as fuck"). The "weird lines on the
  main menu" were not the renderer: the 15-door list overflows a short window and Firefox on a Mac with a mouse plugged
  in paints a classic scrollbar down the middle of the title scene — styles-base.css hides it (`scrollbar-width: none`)
  and keeps the labels on one line. The horizontal lines are the retro pass's scanlines, unchanged.
- 2026-10-02 R2 follow-up 2 ("the grey horizontal bars"): the main menu's ground sheet fogged to the biome's pale haze
  while the dome's fog band only reaches below the horizon, so a pale strip stood across the frame on the night sky (worst
  on the antarctica toss; r147 rendered it the same, so not an r186 regression). three-renderer.js `_menuHorizonColor`
  fogs the ground to the dome's deep-space colour at the horizon instead; the far ridges and the igloo now sink into it.
- 2026-10-02 R2b SKIPPED (mondo chose it): `BatchedMesh` saves draw calls only through `WEBGL_multi_draw`, which Firefox has
  never shipped; without it three.js (WebGLRenderer, `isBatchedMesh` branch) issues one `drawElements` per instance, so on
  mondo's Firefox it would draw MORE than the static batch's merged meshes do today. The merge pass (`HQ_BATCH`) stays.
  R3 (KTX2) waits too: ASSET_MANIFEST.json on R2 is still empty (`files: {}`), so it needs mondo to run the optimizer
  locally first. Next is R4.
- 2026-10-02 R4 built: three-mesh-bvh@0.9.15 via the import map, loaded by its own module with a dynamic import (a CDN miss
  leaves `window.EW_BVH_LIB` unset and every ray plain). three-renderer.js "THE BVH" wraps `Mesh.prototype.raycast`: lazy
  trees (≥ 256 tris, a 60k-triangle build budget per 100 ms, a mesh that keeps costing slow rays builds anyway), INDIRECT
  mode (the geometry's index is never reordered: the carve slices and the static batch read index ranges), stale-safe (a
  position/index/draw-range/group change drops the tree; a second change marks the geometry live and it stays plain), never
  skinned/morphing/partial-draw-range. Same hits as plain three in a node check (400 rays, 0 diffs), ~4× faster. The F3 lens
  gains a "Pick (raycasts)" line. Off: `window.EW_NO_BVH`.
