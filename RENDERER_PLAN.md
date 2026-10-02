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

1. index.html: the import map's version becomes the current release (pin the exact number the day R2
   starts; it is r16x+ and newer than the sky shader's r160, so the sky shader is re-checked too). The
   inline module shim imports `three`, `EffectComposer`, `RenderPass`, `ShaderPass`, `UnrealBloomPass`,
   `SMAAPass`, `CopyShader`, `LuminosityHighPassShader`, `FXAAShader`, `SMAAShader`, `GLTFLoader`,
   `OBJLoader`, `MeshoptDecoder`, `SkeletonUtils`, `CSS2DRenderer`, `CSS2DObject` and assigns them onto
   `window.THREE` under the names the game uses; every game `<script src>` gets `defer`. The r128 and
   r147 script tags go.
2. three-renderer.js + three-post.js: `encoding` → `colorSpace` (12 sites); `ColorManagement.enabled =
   false` at boot; the light helper (intensity × π, decay 1) at every PointLight/SpotLight construction;
   `renderer.useLegacyLights` not referenced (it is gone).
3. `THREE.MeshLine.js`: chunk names re-verified.
4. The console sweep as in R1.
5. `BatchedMesh` is now available: the static batch (`R.batchP`, the "why not merged" list in the F3
   lens) gets a BatchedMesh path for props that differ in geometry but share a material. That is the
   payoff of R2 and goes in as the same PR only if it is small; else it is R2b.
6. Deliverable: index.html + three-renderer.js + three-post.js (+ MeshLine) in one zip.

mondo playtests: the picture matches R1 (colours, light levels), the sky shader still runs, the F3 lens
shows fewer draws downtown if step 5 landed.

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
