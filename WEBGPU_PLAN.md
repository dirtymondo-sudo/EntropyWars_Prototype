# WEBGPU — WebGLRenderer to WebGPURenderer (TSL), the plan

*Plan document, 2026-10-03. Nothing built yet (see §10, the log). House rules that stand over every phase:
no new game .js files (every change lands in the files that exist, plus index.html); no tests, no CI; mondo
playtests each phase on his machine before the next one starts; every R2 delivery bumps `?v=`; the game must
look the same after each phase unless the phase says otherwise; the WebGL path stays alive, one switch away,
until §7 says it goes.*

mondo's brief (2026-10-03, thread "WebGL to WebGPU"), the parts that decide things:

- "I want to make a plan to switch from webgl to webgpu. I believe webgpu is the future and will allow for
  better performance hopefully. Is this feasible?" — §0.
- "Research webgpu and what can be done with it that will help this be a AAA game in presentation and
  experience." — §1, §2, §5.
- webgpufundamentals.org "WebGPU from WebGL" — §1.

RENDERER_PLAN.md (R1-R7, all built) is the floor this stands on: the game runs three.js 0.186.1 as ES modules
through one import map, with `window.THREE` built by an inline shim. Read it first; its §9 log holds the
lessons (import map first; `typeof` gates on renamed methods fail silently; a NEAREST pass must snap to texel
centres; a changed R2 file always ships with a bumped index.html).

---

## 0. The verdict, in one paragraph

Feasible, yes — as a port of the game's **shader layer**, not a swap of one renderer class for another. three.js
0.186.1 already ships `WebGPURenderer` (`build/three.webgpu.js`), it falls back to a WebGL 2 backend on its own
when WebGPU is missing, every built-in material keeps working on it, GLTFLoader / KTX2Loader / SkeletonUtils /
CSS2DRenderer / three-mesh-bvh keep working on it, and Firefox on an Apple Silicon Mac has WebGPU on by default
since Firefox 147 (§2). What does NOT carry over is everything the game wrote in GLSL: the two global shader
patches (height fog, legacy lights), the 9 `onBeforeCompile` hooks, the 13 shader programs in three-renderer.js
plus the menu sky (340 lines), the VFX shaders, the whole of three-post.js (two post chains, ~700 lines of
GLSL), the external THREE.MeshLine, and three of the R-phase libraries (pmndrs postprocessing, n8ao,
troika-three-text; three.quarks too). All of that becomes TSL (three's node shading language, which compiles to
WGSL on WebGPU and to GLSL on the fallback backend), and the post stack becomes three's `RenderPipeline`. The
**main risk** is not the port, it is the frame: three's WebGPURenderer still costs MORE CPU per non-instanced
draw than WebGLRenderer (open issue #30560; on an M1 Pro with r186, 5,000 separate meshes take 29 ms of CPU
on WebGPU against 7 ms on WebGL, §3), and this game's frame is shaped by draw calls (downtown ~860, the HQ
shadow pass 278). So the plan measures first (W0, on mondo's Mac, before any shader is ported), keeps the WebGL
path one switch away until the WebGPU path has been played for a while, and puts render bundles (the
WebGPU-only answer to that CPU cost) first among the payoff phases. **What it buys** is not a faster frame
today — mondo's frame is 69 FPS at 3.4 ms CPU, so it is pixel-bound at DPR 2, not CPU-bound — but a renderer
with the AAA toolbox built in: compute-shader particles (the fire and smoke three-plume promised), clustered
lighting (1,024 point lights), TRAA and TAAU/FSR1 upscaling (the real DPR 2 win), GTAO / SSGI / SSR,
volumetric light, order-independent transparency, render bundles, a built-in PS1 retro pass, reversed depth,
and GPU timings for the F3 lens (Chrome only for now, §2). §5 ranks them for this game.

---

## 1. WebGPU against WebGL, in the terms of the lesson mondo linked

"WebGPU from WebGL" (webgpufundamentals.org) is written for code that calls the GL API directly. The game
does not: three.js is the API, and the only raw WebGL in the repo is the F3 lens's timer queries, the KTX2
format probe and the boot diagnostic (§4.4). So most of the lesson's differences are three's problem, not
ours, but they explain why the port is what it is:

- **No global state machine.** WebGL sets state call by call (bind this, enable that, draw). WebGPU bakes
  everything a draw needs into an immutable **pipeline** (shaders + vertex layout + blend + depth + stencil),
  binds resources in **bind groups**, and records commands into **command buffers** submitted at once.
  three.js caches pipelines and bind groups per render object; that cache is where its current per-draw CPU
  cost lives (§3), and **render bundles** (pre-recorded command lists for static objects) are how WebGPU
  makes repeated draws nearly free — WebGL has no equivalent.
- **WGSL, not GLSL.** The shader language changes entirely; there is no `#include <chunk>` to patch, no
  `gl_FragColor`, no `texture2DProj`, no `gl_PointSize` (points are quads you build yourself). three.js hides
  this behind **TSL**: JavaScript node functions that emit WGSL or GLSL, so one source runs on both backends.
  TSL is the ONLY way to customise a material on WebGPURenderer: `ShaderMaterial`, `RawShaderMaterial` and
  `onBeforeCompile` do not exist there.
- **Uniform buffers, not uniform calls.** Uniforms live in buffers; a change is a buffer write. In TSL a
  `uniform()` node does this; the game's shared plain-object uniforms (`_EW_HFOG`, `_hlGlobalTime`) map onto
  those.
- **Textures and samplers are separate objects**; texture origin is top-left (three handles the flip);
  clip-space depth is 0..1 (three handles it; it is also why `reversedDepthBuffer` is a one-flag feature on
  WebGPU).
- **Compute shaders and storage buffers.** New. Any per-element work the CPU does today (particle simulation,
  culling, reductions such as the auto-exposure average) can run on the GPU and never come back.
- **Async by design.** Creating the device is a promise (`await renderer.init()`); reading pixels back is
  async (`readRenderTargetPixelsAsync`); shader compilation can be asynchronous (`compileAsync`, non-blocking
  since r184).
- **Not faster per draw by itself.** The lesson says it, the benchmarks say it (§3): WebGPU's win is the
  work it lets you move off the CPU and onto the GPU, not a cheaper `draw()`.

---

## 2. Where it runs (checked 2026-10-03)

Source: gpuweb/gpuweb wiki "Implementation Status", three.js 0.186.1 source, the mvaligursky
webgpu-webgl-benchmarks report (r186, Chrome 151 / Firefox 150 / Safari 26.6 on an M1 Pro).

| Browser | WebGPU on by default |
|---|---|
| Chrome / Edge | 113+ on macOS and Windows; Android 121+; Linux partly (144+ Intel, 147+ NVIDIA Wayland) |
| **Firefox** | **141+ Windows; 145+ macOS on Apple Silicon (macOS 26 only); 147+ every macOS version on Apple Silicon.** Intel Macs: no. Linux: "expected in 2026". |
| Safari | 26+ on macOS, iOS, iPadOS, visionOS |

mondo plays Firefox on an M1 Mac, so he has it provided Firefox is 147 or newer. Check before W0:
`!!navigator.gpu` in the console, or the `?ewdiag=1` report (W0 adds a line naming the backend the game got).

Firefox specifics that shape the plan (its WebGPU is wgpu over Metal, a younger implementation than Chrome's
Dawn):
- **No GPU timestamps on Firefox.** The r186 benchmark report: "Firefox 150 (wgpu on Metal) invalidates the
  device when render passes carry `timestampWrites`". So the `trackTimestamp` constructor option stays OFF on Firefox; the
  F3 lens gets GPU ms in Chrome only (§4.4).
- **No multiple import maps on Firefox** (disabled through at least 154). The page must keep ONE import map,
  and it must still come before anything module-related (R2 hotfix). That decides how the WebGL/WebGPU switch
  is built (§4.1).
- Smaller: an f16 storage-buffer path had to be removed for Firefox in three-gpu-pathtracer; shader
  compilation (naga) is slower on first use than Chrome's. Expect the first frame of a new material to cost
  more; the smooth attach's warm-up (`compileAsync`) matters more, not less.
- The sandbox (headless Chromium, swiftshader) has no WebGPU device. The load check runs the node renderer on
  its WebGL 2 backend (`forceWebGL: true`), which compiles the SAME TSL to GLSL, so shader mistakes still
  show; the WebGPU backend itself is checked on mondo's Mac. Every phase says so in its playtest line.

---

## 3. What it does and does not do for the frame

The numbers (mvaligursky benchmarks, r186, M1 Pro; three.js issues #30560 / #31055; the forum):

- **Separate, non-instanced meshes: WebGPU is slower in three.js today.** 5,000 animated meshes: 7 ms CPU on
  WebGLRenderer, 29 ms on WebGPURenderer. Issue #30560 ("Current UBO system has severe performance issues
  with many render items", Feb 2025, high priority) is still open; the grouping work (PR #32243) reports ~144
  FPS against 30 in its test but has not shipped. This is THE risk for this game: its frame is many small
  meshes (downtown ~860 draws after PR #45; the HQ shadow pass 278 draws / 477K tris in mondo's readout).
- **Instanced: a tie.** 50k instances 1.1-2.3 ms CPU on both; 500k ~1.3 ms. The game's instance pass
  (`_hqInst*`, `_fieldInst*`), the static batch and the R7 particle batches are already on this side.
- **Render bundles (WebGPU only):** a `BundleGroup` records the draws of a static group once and replays
  them; three's `webgpu_performance_renderbundle` example draws 4,000 separate meshes that way. This is the
  answer to the first bullet for everything that does not move: room shells, props, the static batch, the
  shadow pass of all of it. It is W6, and it is why the port is worth it even while #30560 is open.
- **GPU time is the same.** Same triangles, same pixels, same shadow maps. mondo's 69 FPS at 3.4 ms CPU is
  GPU-bound at DPR 2 (four times the pixels of DPR 1). WebGPU does not change that; what changes it is
  rendering fewer pixels and upscaling well (TAAU / FSR1, W8) and a cheaper shadow pass (W11). Both are node
  stack features, neither needs WebGPU strictly, but both come built in on this side and not on the other.
- **Forward lights:** three's node renderer with 32 forward lights measured 53 ms GPU in that report (the
  stock lights node loops every light per fragment, like WebGL). `ClusteredLightsNode` (Forward+, 1,024 point
  lights, 64 per cluster) is the fix and is WebGPU/compute-shaped; W9.

Honest summary for mondo: the switch is a platform move that opens features, not a speed-up on its own. The
go/no-go at W0 is: with plain materials, no post, is the WebGPU frame on his Mac no worse than the WebGL one
in the rotunda, downtown and one battle? If it is worse by more than the lens's noise, W6 (bundles) moves
before W1 and is re-measured; if it is still worse after bundles, the plan stops at W0 and waits for three.

---

## 4. What the port touches (the inventory, 2026-10-03)

Counted in the files, not guessed. Line numbers are 2026-10-03 main.

### 4.1 index.html — the switch and the shim

- The import map (307-324) maps `three` to `three.module.js`. The WebGPU build is a DIFFERENT file:
  `build/three.webgpu.js` (2.28 MB raw + the shared `three.core.js` 1.46 MB; today's `three.module.js` is 0.66
  MB + core) and it does NOT contain WebGLRenderer, so the two paths need two maps and Firefox allows one.
  Decision: a 6-line inline **classic** script, placed where the import map is today, `document.write`s the
  ONE import map, choosing the three build from `localStorage.ew_gpu` / `?ew_gpu=webgl|webgpu` (a
  parser-inserted map, before any module script, so the import-map-first rule holds). The map gains
  `three/webgpu` → `three.webgpu.js` and `three/tsl` → `three.tsl.js` (38 of the display nodes import them).
  Fallback if a document-written map misbehaves in Firefox (W0 checks it first): server.js serves index.html
  with the map substituted per query, since Render runs Express anyway.
- The shim (330-364) imports `three` + the add-ons and assigns `window.THREE`. On the WebGPU path it imports
  from the webgpu build (same `Object.assign({}, THREE)` copy), adds `window.TSL` (the `three/tsl` namespace),
  drops EffectComposer / Pass / UnrealBloom / SMAA / FXAA / CopyShader (WebGL-only), keeps GLTFLoader,
  OBJLoader, SkeletonUtils, CSS2DRenderer, MeshoptDecoder, KTX2Loader, BVH, and adds the post nodes it needs
  from `three/addons/tsl/display/` (bloom, smaa, fxaa, traa, gtao / ssao, dof, gaussianBlur, pixelation,
  retro helpers). `ColorManagement.enabled = false` stays.
- The menu sky backdrop (1799, its own `WebGLRenderer`; the 340-line "Flat-Earth Firmament" fragment shader at
  1814-2153) → W2.
- `diag.gpuProbe` (104-118, raw webgl2 + `WEBGL_debug_renderer_info`) gains `navigator.gpu` →
  `requestAdapter().info` and the backend line.
- `THREE.MeshLine.js` from the CDN (404): dropped on the WebGPU path (W2 replaces it).

### 4.2 three-renderer.js — the material layer

Four renderers exist: the board renderer (31803: `{antialias:false, alpha:true, powerPreference}`,
`outputColorSpace = LinearSRGBColorSpace`, manual `shadowMap.needsUpdate`, `webglcontextlost` handlers,
CSS2D overlay; it draws the battle, the HQ walk, the menu scene and the editor view), the creator viewer
(39720, a second context, sRGB + ACES), the editor thumbnails (editor.js 2947, `preserveDrawingBuffer` +
`toDataURL`) and the menu sky (index.html 1799). WebGPURenderer takes the same constructor options (plus
`forceWebGL`), needs `await renderer.init()` before the first render, supports several canvases, and reports
`renderer.backend.isWebGPUBackend`. Context loss becomes `device.lost`.

**Global patches (both go):**

| Patch | Today | On the node renderer |
|---|---|---|
| `_ewHeightFogPatch` (2062): rewrites `fog_pars_vertex` / `fog_vertex` / `fog_pars_fragment` / `fog_fragment`, injects `uEwHFog` into every ShaderLib | height fog layered on FogExp2, instancing-aware | `scene.fogNode = Fn(...)` built from `positionWorld.y`, `fog()` and `densityFogFactor()` (three's own `webgpu_fog_height` example does exactly this); `_EW_HFOG` becomes `uniform()` nodes written by `_ewHeightFogSet` |
| `_ewLegacyLightPatch` (2111): `getDistanceAttenuation` back to r128's linear ramp, ×π on every light type, `PointLight` / `SpotLight` subclassed with decay 1 | the r128 picture | the same subclasses get node classes: `class EwPointLightNode extends PointLightNode` with the linear ramp in `setupDirect`, registered with `renderer.library.addLight(EwPointLightNode, EwPointLight)` (0.186.1; the migration guide says a later release renames this to `Light.registerNode`), same for spot; the ×π on ambient / hemisphere / directional is one `intensity * Math.PI` at construction on this path (the helper R2 first described and then did not need) |

**The 9 `onBeforeCompile` hooks (11 assignment sites):**

| Hook | Material / where | Anchors today | TSL slot |
|---|---|---|---|
| `_hqAoHook` (2156; set at 41317 `_hqMat` ≈561 call sites, 41561 props) | the HQ's Phong factory | `project_vertex` (instancing branch), `map_fragment` | `MeshPhongNodeMaterial`: `aoNode` = the room-box Fn of `positionWorld` (instancing is automatic in TSL) |
| `_hqTerrainMat` (43266) | HQ terrain field, attributes aBlend / aAO / aPaintA-C | `uv_vertex`, `project_vertex`, `map_fragment` (replaced whole), `emissivemap_fragment` | `colorNode` = triplanar Fn over `attribute('aBlend')` etc.; `aoNode` = `attribute('aAO')`. The biggest single port |
| `_buildFluidTopMat` (2905) | Lambert fluid tops: water, lava, poison | `void main()`, `uv_vertex`, `color_fragment`, `worldpos_vertex`, `emissivemap_fragment` | `colorNode` + `emissiveNode` on `MeshLambertNodeMaterial`; the two scrolling wave sheets read with `texture(t, uv().add(time.mul(v)))` |
| `_getGrassMat` (5976), `_ewWindHook` (27775), `_hqKelpMat` (55804) | grass blades (aBend), tree leaf/bark (instanced), kelp | `common`, `begin_vertex` | `positionNode = positionLocal.add(sway(time, attribute('aBend')))`; the instancing branch disappears |
| `_ewVColorEmissiveHook` (12537) | creator layers / hair, with stencil | `emissivemap_fragment` | `emissiveNode = materialEmissive.mul(vertexColor)`; stencil props carry over unchanged |
| `_injectHorizonFog` (23921), `_wdInject` (30471) | horizon scenery; world-dissolve ground (fbm noise, `discard`, cracks) | `common`, `project_vertex`, `dithering_fragment` | `outputNode` Fn over the lit colour (`output` context) with `Discard()`; the fbm goes through the Transpiler once |
| three-vfx.js `_batchHook` (1743) | the R7 particle batches, `aEwOp` | `common`, `begin_vertex`, `color_fragment` | `opacityNode = instancedBufferAttribute(aEwOp)` on `MeshBasicNodeMaterial` |

Code that keys on hook IDENTITY must key on a string instead: the lens "why" (33969), instance-pass
eligibility (58400: `_hqAoHook` or `_ew_windFn` only), the static-batch key (60319 `_hqBatchId(m.onBeforeCompile)`
+ `customProgramCacheKey`), batch eligibility (60353), the per-instance-shader exclusion (4270). One
`m.userData.ewKey = 'hqAo' | 'wind' | ...` set by each factory replaces all five.

**The shader programs (20 `ShaderMaterial` constructions from 13 programs; no RawShaderMaterial):**

| Program | Draws | TSL form |
|---|---|---|
| `_makeHlMaterial` (799, ~105 lines), `_makeRingMaterial` (847), team reticle meters (1014, ~125 lines) | tile highlights, rings, HP/MP ring meters | `MeshBasicNodeMaterial` with `colorNode` / `opacityNode` Fns (SDF maths transpiles clean) |
| `_makeSilhouetteMaterial` (1083), `_makeModelSilhouetteMaterial` (1160), `_makeSpriteOutlineMaterial` (1250), `_makeModelOutlineMaterial` (1297) | the x-ray twins and team outlines: `GreaterDepth`, stencil, CustomBlending, BackSide, skinning chunks | node materials; skinning is automatic, `depthFunc` / `stencil*` / `blending` / `side` are Material properties and carry over; `gl_FragCoord` scanlines = `screenCoordinate` |
| `_makeAuraShellMat` (6770) | power-aura shells | `positionNode` wobble + additive `colorNode` |
| `_envGroundFS` / `_envWallFS` / `_envDomeFS` (22602-22888, ~270 lines; also `_hqBuildSky` 45801) | the battle / HQ / menu sky dome: stars, nebula, sun, moon, clouds | `MeshBasicNodeMaterial` `colorNode` on the dome; depthTest off and renderOrder as today. Transpiler first, hand-fix after |
| `_ensureRayShaders` (31559-31632) ×2 sites, `_hqAtmosShader` (57885) | god-ray prisms, pools, motes; dust / spores / fireflies / rain as Points with `gl_PointSize` | prisms and pools: `colorNode`; Points: `PointsNodeMaterial` with `sizeNode` / `positionNode`, point coord via `uv()` |
| `_HQ_REFLECT_SHADER` (58131, `texture2DProj` on a render target) | puddles and mirrors | three's `reflector()` node (webgpu_reflection), or a `colorNode` sampling the target at the projected uv |
| index.html sky (1814-2153, 340 lines) | the menu firmament | full-screen `colorNode` on a `QuadMesh`; the largest transpile |
| three-vfx.js `_AMB_*` (3011-3040) | ambient Points | `PointsNodeMaterial` |
| three-vfx-effects.js `_buildFlameVolume` (1032, ~85-line raymarch, `onBeforeRender` writes `uCamLocal`), `_sigEnergyMat` (9201), `_sigOrbShellMat` (10047) | flame volumes, energy shells | `colorNode` Fns; `cameraPosition` and `modelWorldMatrixInverse` nodes replace the per-draw uniform write |
| THREE.MeshLine (three-lightning.js 82-171; the lib lives only on R2) | lightning bolts, tracers | `LineSegments2` + `Line2NodeMaterial` from `three/addons/lines/webgpu/` (world-unit width, additive) |
| three-post.js (§4.3) | the post stack | `RenderPipeline` |

Also: `material.skinning = true` leftovers (1186, 1315, 12694, 15691; three-post 1123) go; `_getCutoutDepthMat`
(3094, RGBADepthPacking `customDepthMaterial` for cutout sprite shadows) goes — the node renderer's shadow pass
copies the material's `alphaTest` and colour node onto its override material itself (Renderer.js 3748-3771). `groundMat.extensions.derivatives` (22938) is a no-op.

### 4.3 three-post.js — the post stack

Both chains are WebGL-only: the classic three EffectComposer chain (RenderPass, `_SsaoPass`, UnrealBloom,
tone map, tilt-shift ×2, FXAA, SMAA, `_cinematicPass`, `_retroPass`) and the R5 pmndrs chain (`_ppInit`:
RenderPass → `EwSsaoPass` / N8AO → Pass A [SMAA|FXAA + AO mix + bloom + tone] → DoF ×2 → Pass B
[cinematic + retro as one effect]). Neither EffectComposer, pmndrs postprocessing nor n8ao runs on
WebGPURenderer. The new chain is three's `RenderPipeline` (named `PostProcessing` until r182):

```
scenePass = pass(scene, camera)            // colour + depth (+ normals via MRT when GTAO is on)
ao        = gtao(depth, normal, camera)    // or ssao(); replaces the classic AO and N8AO (both GLSL)
colour    = scenePass.mul(ao)
colour    = bloom(colour, ...)             // three's mipmap bloom; OFF by default (the bloom rule, PR #51)
colour    = smaa(colour) | fxaa(colour) | traa(colour)   // Settings > AA; TRAA is new
colour    = tiltShift(colour)              // board only: gaussianBlur H/V, or dof() with the board's focus plane
colour    = ewFrame(colour)                // the Cinematic + Retro frags (~260 lines) as ONE TSL Fn: CRT,
                                           // scanlines, vignette, curvature, night grade, spell spotlight,
                                           // trip/hue/warp, zoom blur, ripple; pixel size, posterize, Bayer
                                           // dither, tint, grain, tMask model-only pixelation
pipeline.outputNode = renderOutput(colour) // tone map + sRGB: renderer.toneMapping / outputColorSpace as today
```

- The retro pass could instead be three's own `RetroPassNode` (PS1: vertex snapping, affine texture
  mapping, low resolution) + the CRT helpers (`barrelDistortion`, `scanlines`, `vignette`, `bayerDither`,
  `posterize`, `colorBleeding` — the `webgpu_postprocessing_retro` example). Note the game's retro pass today is
  screen-space only (no vertex snap anywhere); `RetroPassNode` would ADD the PS1 vertex wobble and affine warp
  as a new Settings row, off by default (look change).
- The pixel mask (`_renderPixelMask`, two extra scene renders on layers 7/8 into a half-size target) becomes a
  second `pass()` with those layers.
- Auto exposure (`_aeMeasure`: 16² downsample + synchronous `readRenderTargetPixels`) becomes a 16² pass read
  with `readRenderTargetPixelsAsync` one frame late, or a compute `reduce` (webgpu_compute_reduce); the AE
  controller does not care which.
- HDR: `RenderPipeline` passes are HalfFloat by default; `_hdrSupported` (always false today, R5 log) stops
  mattering. `renderDirect` (split-screen panes) becomes a second pipeline on the pane's render target.
- The `ThreePost.set*` API (55 callers in ui.js and three-renderer.js) keeps every name; the stand-in objects
  from R5 (`_bloomPass`, `_retroPass`...) keep carrying the state, and one `_ppSync` per frame copies it into
  the uniform nodes, as the pmndrs chain does today.
- Shadow type: `PCFSoftShadowMap` is gone on WebGPURenderer (r185; `PCFShadowMap` IS the soft one), so the
  chunk sniff at 2650 goes; VSM is available for the soft look on directional lights (W11).

### 4.4 Renderer-level calls

| Today | On the node renderer |
|---|---|
| `renderer.compile(fake, cam)` (60257, the smooth attach's warm-up) | `renderer.compileAsync(fake, cam)` (non-blocking since r184; r186 compiles node materials in it) — a better warm-up than today's |
| `readRenderTargetPixels` (three-post 133) | `readRenderTargetPixelsAsync` |
| `toDataURL` after a render (creator snapshot 40926, editor thumbs, `_fieldSnapshot` 61288) | same, as long as render and read stay in one task (a WebGPU canvas is cleared after the frame presents); the editor drops `preserveDrawingBuffer` |
| `renderer.capabilities.getMaxAnisotropy()` ×5, `capabilities.isWebGL2` | 16 on WebGPU (the node renderer has no `capabilities`; `hasFeature(name)` after init); `isWebGL2` sites decide HDR + depth texture, both always true here |
| `renderer.extensions.get(...)` (three-post 1498-1500, 2265) | gone; always on |
| `_ktxDetect` (1616: a throwaway WebGL 2 context + a fake renderer object for KTX2Loader) | `ktx2Loader.detectSupport(renderer)` — KTX2Loader already reads `hasFeature('texture-compression-bc'/'astc'/'etc2')` on a WebGPURenderer; the S3TC-sRGB guard goes (WebGPU bc formats have sRGB variants) |
| `info.render.calls/triangles`, `info.memory`, `info.programs.length` | `info.render` and `info.memory` exist; `programs` does not (count `renderer.backend` pipelines instead, or drop the line) |
| `renderer.properties.get(t).__version`, `initTexture` (60263) | `initTexture` exists; the version peek goes |
| `setScissorTest` / `setViewport` (split screen 18998-19056), `localClippingEnabled` + `clippingPlanes` (50156, 58226, editor 1197), `overrideMaterial`, camera layers, `autoClear`, `setRenderTarget`, `setClearColor` | all exist on the node renderer with the same names |
| `webglcontextlost` / `restored` (31833-31850) | `renderer.backend.device.lost.then(...)`: rebuild the renderer, reload the room |
| **The F3 lens** (`_lensHook` 33977 wraps `render`, `renderBufferDirect`, `shadowMap.render`; `EXT_disjoint_timer_query_webgl2` at 34033-34085; `_lensWhy` reads `isShaderMaterial` / hook identity) | `renderer.setRenderObjectFunction((obj, scene, cam, geom, mat, group, lights, ...) => ...)` is the documented per-draw hook: count by kind, skip a kind, time the submit; the `trackTimestamp: true` constructor option (kept only when the device has `timestamp-query`) + `info.render.timestamp` / `resolveTimestampsAsync('render')` give REAL GPU ms per frame on Chrome (never pass it on Firefox, §2); `_lensWhy` reads `ewKey` |

### 4.5 Libraries

| Library (R phase) | On the WebGPU path |
|---|---|
| pmndrs postprocessing 6.39.5 (R5), n8ao (R5) | gone; `RenderPipeline` + `gtao()` (§4.3). The classic chain goes with them |
| troika-three-text 0.52.5 (R6, the HQ plates) | no WebGPU support (its shaders are GLSL injected through `onBeforeCompile`; troika issue #359 open since May 2025, no PR). Decision: the plates become **canvas-painted planes** — each plate's rows painted once into a `CanvasTexture` (the #hqPage look, the two fonts already loaded for the DOM), one `MeshBasicNodeMaterial`, same placement code (`_hqPlateMake`), still occluded and fogged, no library. The CSS2D fallback (`ew_text = 'css'`) stays as the kill switch |
| three.quarks 0.17.1 (R7b, the optional Spell FX Layer) | no WebGPU support (its README lists it as a roadmap item). The layer is off by default and the row stays; on this path it is replaced by W7's compute particles |
| three-mesh-bvh 0.9.15 (R4) | CPU raycasts, renderer-independent: unchanged |
| KTX2Loader (R3), GLTFLoader + meshopt, OBJLoader, SkeletonUtils, CSS2DRenderer | unchanged (KTX2: §4.4) |
| THREE.MeshLine (R2 bucket file) | `Line2NodeMaterial` (§4.2) |

---

## 5. What it buys, ranked for this game

Each line names the three.js 0.186.1 example or node that proves it exists; each becomes a phase in §6 only
after the port (W0-W5) holds.

1. **Render bundles** (`BundleGroup`, `webgpu_performance_renderbundle`). Static rooms, props, the static
   batch and their shadow-pass draws recorded once and replayed: the CPU cost of a draw goes to ~0 for
   everything that does not move. The direct answer to §3's first bullet and to the 278-draw shadow pass.
   WebGPU only (the WebGL 2 backend ignores it, which is fine).
2. **Upscaling + temporal AA** (`TAAUNode`, `FSR1Node`, `TRAANode`; `webgpu_upscaling_taau`,
   `webgpu_upscaling_fsr1`, `webgpu_postprocessing_traa`). Render at ~0.7 of DPR 2 and upscale: the one change
   that attacks mondo's actual bottleneck (pixels at DPR 2). TRAA also replaces SMAA with a steadier image on
   the thin lines this art has (fog grid, outlines, nameplates' underlines).
3. **Compute-shader particles** (`webgpu_compute_particles`, `_rain`, `_snow`, `webgpu_tsl_vfx_flames`,
   `_tornado`, `_linkedparticles`, `webgpu_particles_soft`, `webgpu_volume_fire`). Simulation in a compute pass,
   drawn instanced from storage buffers: hundreds of thousands of particles, soft against depth, no CPU
   matrix writes (R7's `_batchFlush` goes away). This is what three-plume promised and R7b could not have.
   Fire columns, smoke, embers, rain and snow for the HQ atmospheres, blood, debris.
4. **Order-independent transparency** (`OITPassNode`, new in r186; `webgpu_oit`). Overlapping additive and
   alpha VFX stop popping with sort order; the R7 "normal groups draw before additive" workaround goes.
5. **Clustered lighting** (`ClusteredLightsNode`: Forward+, 1,024 point lights, 64 per cluster;
   `webgpu_lights_clustered`). Every torch, lamp, neon sign and spell light as a real light, no 4-light cap, no
   per-light shader cost (§3's 53 ms for 32 forward lights becomes a per-cluster list).
6. **Volumetric lighting** (`webgpu_volume_lighting`, `_traa`, `_rectarea`; `GodraysNode`). Light shafts
   through the HQ corridors' height fog and the Woods canopy, replacing the hand-built `_hqLightShaft` prisms
   with the real thing.
7. **Screen-space GI, AO and reflections** (`GTAONode`, `SSAONode` + `depthAwareBlur` (r186), `SSGINode`,
   `SSRNode` + denoise; `webgpu_postprocessing_ssgi`, `_ssr`). GTAO replaces the classic AO and N8AO (and the
   AO banding class of bugs, since it samples depth the right way); SSGI bounces the torch light off the walls;
   SSR for wet asphalt in Disaster City, the Atlantis floors, the puddle reflectors (replacing the per-reflector
   extra scene render at 58226).
8. **Shadows** (`CSMShadowNode` for outdoor zones, `VSMShadowMap`, `TileShadowNode`, `webgpu_shadowmap_progressive`,
   `webgpu_shadow_contact`). CSM for The Woods / The Beach / The Desert at scale; progressive (accumulated)
   shadows for static rooms, so the per-frame shadow pass draws only what moves; the torch PointLight cube
   maps revisited.
9. **The PS1 look as a first-class pass** (`RetroPassNode`: vertex snapping, affine texture mapping, low
   internal resolution; `PixelationPassNode`; the CRT helpers). Today's retro pass is screen-space only. The
   real wobble, as a Settings row, off by default.
10. **Water zones** (`WaterMesh`, `webgpu_ocean`, `webgpu_caustics`, `webgpu_volume_cloud`, `webgpu_sky`).
    The Beach, Atlantis, The Deep, The Sewers get water that refracts, reflects and casts caustics; the menu
    sky can be three's `SkyMesh` instead of 340 lines of our own.
11. **Depth**: `reversedDepthBuffer: true` (one flag; `webgpu_reversed_depth_buffer`) ends z-fighting on far
    floors in the big rooms; MRT velocity → `MotionBlur` for spell cameras; `dof()` for the board tilt-shift.
12. **GPU timings for the F3 lens** (`trackTimestamp`, `webgpu_performance`): ms per pass from the GPU, not
    `performance.now()` around submit. Chrome only until Firefox fixes `timestampWrites` (§2).
13. **Materials**: `MeshSSSNodeMaterial` (translucent creatures: slimes, ghosts), transmission / dispersion /
    iridescence from GLTF (`webgpu_loader_gltf_*`), `webgpu_parallax_uv` for brick and stone.
14. Research only, not planned: `webgpu_vxgi` (voxel cone tracing GI, r186), `webgpu_deferred`,
    `webgpu_gaussian_splat`.

Not on the list: anything that generates art (the memory rule: reuse R2 assets), sound, and the Babylon /
other-engine question (RENDERER_PLAN §0 stands).

---

## 6. The phases

One PR per phase; mondo plays each on his Mac in Firefox (and once in Chrome for the GPU timings). Order since
2026-10-04 (mondo): W0-W4, W5a (battle and spell performance), W6-W13, then W5 (the flip) LAST. W0-W5 are
the port and must keep the picture; W6+ are the payoff, each behind a Settings row and the F3 lens.

### W0 — The switch and the measure (go/no-go)

1. index.html: the document-written import map (§4.1), `ew_gpu` from localStorage / query, default
   `webgl` (nothing changes for a player). On `webgpu`: the shim imports from `three.webgpu.js`, exports
   `window.THREE` + `window.TSL`, loads KTX2Loader / BVH as today, skips the WebGL-only add-ons.
2. three-renderer.js: `_ewGpu = !!THREE.WebGPURenderer` picks `new THREE.WebGPURenderer({canvas, antialias:
   false, alpha: true, powerPreference, forceWebGL: ew_gpu === 'webgl2'})` for the board renderer and the
   creator viewer; boot awaits `renderer.init()` before the first frame (the title scene's first frame is
   already behind the shim's module). On this path, every factory that would install a hook or a
   ShaderMaterial installs the PLAIN built-in instead (`_ewGpu` early-outs: fog without height, lights without
   the π patch, terrain with its first sheet, no sky dome, no x-ray twins, no post, CSS2D plates, no bolts) —
   the picture is wrong on purpose; W0 only wants the frame.
3. The lens's counting half (`setRenderObjectFunction`, `info.render`) so F3 reads on this path; the
   `trackTimestamp` option only when `!/Firefox/.test(navigator.userAgent)`.
4. `?ewdiag=1` reports the backend (`renderer.backend.isWebGPUBackend`), adapter info, and whether the map was
   document-written.
5. Deliverable: index.html + three-renderer.js (+ three-post.js guard).

mondo measures, same room, same camera, `?ew_gpu=webgl` vs `?ew_gpu=webgpu` (and `webgl2` = the node
renderer's fallback backend, to separate "WebGPU" from "the node renderer"): the rotunda, downtown, one
battle; F3 FPS + CPU ms + draws. The rule in §3 decides: no worse → W1; worse → W6 first, then re-measure;
still worse → stop, log it, wait for three (#30560).

### W1 — The material layer (the picture comes back)

The two global patches and the 9 hooks as §4.2's table, in this order: height fog node; the legacy light
nodes (then the rotunda's light levels match, which is the test for everything after); `_hqAoHook`;
`_hqTerrainMat`; fluid tops; the three sways; vColor emissive; horizon fog + dissolve; the R7 batch hook.
Each factory becomes `_ewGpu ? nodeMaterial : classicMaterial`, both from one helper per effect so the
uniforms are shared. The GLSL functions (fbm, triplanar, caustics) go through `three/addons/transpiler/`
(GLSLDecoder → TSLEncoder) once, by hand-run script in the scratchpad, and the output is pasted and fixed —
the Transpiler "works most of the time". Rule from here: TSL `Fn` only, never `wgslFn` / `glslFn`, so every
shader compiles on both backends and the sandbox load check (WebGL 2 backend) stays meaningful. `ewKey`
replaces hook identity (§4.2). mondo playtests: the HQ height fog, light levels, the terrain, water, wind,
the dissolve, a spell's particles — all against `?ew_gpu=webgl` side by side.

### W2 — The shader programs

§4.2's second table: highlights and rings, the x-ray twins and outlines (stencil refs, GreaterDepth), aura
shells, the sky dome (battle + HQ + menu backdrop: the menu's own renderer becomes a second
WebGPURenderer, or the backdrop joins the board renderer's scene as a `QuadMesh` behind everything), rays,
atmospheres and ambient Points (`PointsNodeMaterial`), the reflector (`reflector()` node), the VFX shaders
(flame volume, energy shells), and MeshLine → `Line2NodeMaterial` for the bolts and tracers. mondo
playtests: the title, a night battle with the moon, a god-ray room, a lightning spell, a puddle.

### W3 — The post stack

three-post.js grows the `RenderPipeline` chain of §4.3 beside the two WebGL chains (`_ppWanted` picks by
renderer kind). The Cinematic + Retro frags transpile into `ewFrame`; AO becomes `gtao()` (the "AO Quality"
row: Classic / N8AO become GTAO / SSAO); bloom stays OFF by default; the AA row gains TRAA; the tilt-shift,
pixel mask and auto exposure as §4.3. Playtest: bloom slider, each AA, each AO, the retro pass with the
model-only mask, the board DoF, split screen, the HDR look unchanged.

### W4 — The libraries, the lens and the edges

Canvas plates for the HQ (§4.5) with the CSS2D kill switch; the quarks row hidden on this path; KTX2 through
`detectSupport(renderer)`; the lens's GPU timings on Chrome; `compileAsync` in the warm-up; the async auto
exposure; `device.lost`; the editor thumbnails and snapshots; the creator viewer; split-screen scissors;
clipping planes in the editor and the carve. Playtest: the Main Hall plates, the creator, the editor, a KTX2
room with the F3 "KTX2 textures" line, and `?ewdiag=1` from Firefox.

### W5a — Battle and spell performance (2026-10-04, before the flip)

mondo: "there are major performance issues with the battles and spells. dont want to switch until that is fixed".
So the flip moves to the END of the plan (after W13) and this phase comes first. Cause and fix in §10 (the light
rig, the kept shaders, the shared instancing shader). Measure: F3 "Shader builds X/s · new pipelines Y/s" reads
0/s in a steady battle and settles back to 0/s after a spell. Off: `?ew_lightrig=0` / `EW_NO_LIGHT_RIG`,
`?ew_keep=0` / `EW_NO_SHADER_KEEP`. Still open after W5a, by mondo's readout: render bundles for the battle board
(today they wrap the HQ only), and the ShaderMaterial / MeshLine twins of a spell that still build once per cast.

### W6 — Render bundles

`BundleGroup` around the static batch output and the attached room shells / props (the HQ instance pass
output included); `needsUpdate` on attach / detach / a prop's move / a light change (bundles bake the
bindings); dynamic things (units, NPCs, VFX, the player) stay outside. The shadow pass benefits by itself.
Measure: F3 CPU ms in the rotunda, downtown and the foyer vs W5. Off: `EW_NO_BUNDLES`.

### W7 — Compute particles and OIT

three-vfx.js gains a compute pool beside the R7 batches: storage buffers (position, velocity, life, colour,
size), one compute `Fn` per behaviour (ember, smoke, spark, rain, snow, debris, blood), drawn as
`InstancedMesh` / `SpriteNodeMaterial` reading the buffers, soft against the scene depth. three-vfx-effects.js
recipes keep calling `ThreeVFX.spawn`; the pool is chosen per kind. The Spell FX Layer row drives the fire
column / smoke plume kinds here instead of quarks. `OITPassNode` for the transparent queue as a Performance
row. Online parity: the layer rides `fire()` as today, so the guest draws it from the relayed event.

### W8 — Upscaling and temporal AA

Settings > Performance: "Render scale" (1.0 / 0.85 / 0.7 of the pixel ratio) with `TAAUNode` (default) or
`FSR1Node` doing the upscale; TRAA at scale 1.0. Measure on mondo's Mac at DPR 2. Known cost: TAAU/TRAA
need motion vectors (`velocity` MRT) and MSAA off; the retro pass runs AFTER the upscale so pixels stay
crisp.

### W9 — Lights

`renderer.lighting` swaps to `ClusteredLightsNode` (r186 allows dynamic swapping of the lighting system);
the "Point lights all/4/2/off" lens toggle becomes moot; torches, lamps, neon, spell lights become real
`PointLight`s with the legacy-ramp node from W1; volumetric lighting in the height-fog rooms as a Polish row.

### W10 — GI and reflections

SSGI (Polish row, off by default), SSR on the materials flagged wet / mirror (replacing the reflector's extra
render), light probe grid for the HQ interiors (`LightProbeGridNode`).

### W11 — Shadows

CSM for the outdoor zones; VSM on the sun; `TileShadowNode` for the big rooms; progressive shadow
accumulation for static rooms (the per-frame shadow pass then draws only movers); the torch cube maps
measured again with the F3 shadow line.

### W12 — Water and sky

`WaterMesh` / ocean / caustics for the water zones; `SkyMesh` for the menu if it matches the dome's look;
`webgpu_volume_cloud` for the Heaven cloud roads.

### W13 — Depth and motion

`reversedDepthBuffer`, `MotionBlur` on spell cameras (velocity MRT from W8), `dof()` on the board.

### W5 — The flip (moved last on 2026-10-04: after battle and spell performance, and after W13)

`ew_gpu` defaults to `webgpu` when `navigator.gpu` exists, `webgl2` (the node renderer's fallback) otherwise;
`?ew_gpu=webgl` keeps the classic renderer for comparison. After mondo has played it for a while and says so:
the classic path goes (one import map, no document.write, no EffectComposer / pmndrs / n8ao / troika /
quarks / MeshLine in index.html; the `_ewGpu` branches collapse; three-post.js loses the two WebGL chains);
CLAUDE.md gets the rules (no `onBeforeCompile`, no `ShaderMaterial`, TSL `Fn` only, no native `wgslFn` /
`glslFn`, `forceWebGL` is the fallback, never `trackTimestamp` on Firefox); RENDERER_PLAN.md gets a pointer.
The `?v=` bump as always.

---

## 7. Risks and the switches

| Risk | What catches it |
|---|---|
| three's per-draw CPU cost (#30560) makes the WebGPU frame slower on mondo's Mac | W0 measures before any port; W6 bundles; the plan stops at W0 if both fail |
| Firefox's wgpu: device loss on timestamps, slower first compile, younger than Dawn | `trackTimestamp` never passed on Firefox; `compileAsync` warm-up; `device.lost` rebuild; `?ew_gpu=webgl2` (node renderer on WebGL 2) and `?ew_gpu=webgl` (classic) until W5 |
| A TSL port changes the look (the π lights, the fog, the terrain) | W1 is played side by side against the classic path, same room same camera; `ColorManagement.enabled = false` stays; `outputColorSpace` linear on the board stays |
| The document-written import map | W0's first check in Firefox; the server-side substitution is the fallback |
| Lost libraries: troika plates, quarks layer, pmndrs chain | canvas plates (no lib), compute particles (W7), RenderPipeline (W3); each old path has its kill switch until W5 |
| The sandbox cannot run a WebGPU device | every phase's load check runs the node renderer on `forceWebGL`; the WebGPU backend is mondo's playtest; `?ewdiag=1` carries the backend line |
| Bundle size: three.webgpu.js is 2.28 MB raw against three.module.js 0.66 MB (both + the shared 1.46 MB core); brotli from jsdelivr | ~0.4 MB more over the wire, once, cached; a `modulepreload` for `three.webgpu.js` after the map |
| r186 is nine days old (2026-09-24) and the node renderer moves fast (PostProcessing → RenderPipeline in r182, PCFSoft removed r185, light registration changing after r186) | pin 0.186.1 for the whole port; bump only between W-phases, with the migration guide read each time |

Kill switches after W5: `?ew_gpu=webgl2` / `localStorage.ew_gpu` (fallback backend), `EW_NO_BUNDLES`,
`EW_NO_COMPUTE_FX`, the Settings rows for every W6+ feature. Players never see dev switches (memory rule).

---

## 8. Load order and the import map after W5

```
<script type="importmap">  { "three": ".../three@0.186.1/build/three.webgpu.js",
                             "three/webgpu": same, "three/tsl": ".../build/three.tsl.js",
                             "three/addons/": ".../examples/jsm/", "three-mesh-bvh": ... }  </script>
<link rel="modulepreload" href=".../three.webgpu.js">   <!-- AFTER the map, always -->
<link rel="modulepreload" href=".../three.core.js">
<script type="module"> import * as THREE from 'three'; import * as TSL from 'three/tsl'; ... window.THREE, window.TSL </script>
<script src="three-renderer.js?v=..." defer> ...
```

Everything else about delivery is RENDERER_PLAN's: R2 scripts in one zip, index.html through the PR, one
`?v=` bump per delivery.

---

## 9. Sources read for this plan (2026-10-03)

- three.js 0.186.1 package source (`npm pack`): `WebGPURenderer.js` (`forceWebGL`, `WebGLBackend`),
  `Renderer.js` (`setRenderObjectFunction`, `compileAsync`, `readRenderTargetPixelsAsync`, `hasFeature`,
  `trackTimestamp`, `reversedDepthBuffer`), `WebGPUBackend.js` (`drawIndexedIndirect` for BatchedMesh, no
  multi-draw), `ShadowNode.js` (PCFSoft slot removed), `KTX2Loader.js` (`isWebGPURenderer` + `hasFeature`),
  `NodeMaterial.js` slot list, `examples/jsm/tsl/display/*` (the node list in §5), `transpiler/`,
  `lines/webgpu/`, `files.json` (230 `webgpu_*` examples).
- gpuweb/gpuweb wiki, Implementation Status (Firefox 141 / 145 / 147; Safari 26; Chrome 113+).
- mvaligursky/webgpu-webgl-benchmarks (r186, M1 Pro; the 7 ms vs 29 ms figure; the Firefox 150
  `timestampWrites` note).
- three.js issues #30560 (open, high priority), #31055 (duplicate of it), PR #32243 (grouping, WIP); the r186
  release notes; the Migration Guide r175-r186.
- protectwise/troika #359 (open); Alchemist0823/three.quarks README (WebGPU on the roadmap).
- Firefox multiple import maps: Bugzilla 1916277 (disabled through 154).
- webgpufundamentals.org "WebGPU from WebGL" (mondo's link; not reachable from the sandbox, summarised from
  knowledge in §1).

---

## 10. The log

- 2026-10-03: plan written; the inventory in §4 counted in main (three-renderer.js, three-post.js,
  three-vfx.js, three-vfx-effects.js, three-lightning.js, editor.js, index.html); three 0.186.1 source read
  from the npm package. Nothing built. W0 waits on mondo's go.
- 2026-10-03: **W0 built** (zip renderer/ENTROPY_WARS_W0_SWITCH.zip). Changed when built:
  - The import map stays static and first (Firefox rule). It gained `three/webgpu` + `three/tsl`; a classic
    script after the shim reads `ew_gpu` (query, else localStorage; default `webgl`) and, only on `webgpu` /
    `webgl2`, document-writes a module that imports `three/webgpu` into `window.THREE_GPU` and reads the
    adapter info. `three.webgpu.js` shares `three.core.js` with the classic build, so the game's `THREE`
    classes work with both renderers. On the node path troika plates and the quarks layer are off.
  - Only the board renderer switches (`_ewMakeBoardRenderer` in three-renderer.js). The creator viewer, the
    editor thumbnails and the menu sky stay on WebGLRenderer.
  - No per-factory `_ewGpu` early-outs: one `setRenderObjectFunction` hook swaps every ShaderMaterial / unknown
    material for a plain cached stand-in (its uniform colour, else grey; transparent ones at 0.35). The node
    renderer ignores onBeforeCompile hooks on its own. Legacy-decay Point/SpotLight subclasses are registered
    with `renderer.library.addLight`.
  - The node renderer reads per-light `shadow.autoUpdate` / `needsUpdate`, not `renderer.shadowMap.*`; the hook
    copies the game's shadow pulse onto the shadow lights on each frame's first draw, so shadow cost matches.
  - No post on this path (three-post.js early-returns). Measure WebGL with post off (F3 lens toggle).
  - F3 lens: a Renderer line; draws/triangles per pass from `info.render.drawCalls` (shadow draws counted once
    per frame and subtracted from the draw that triggered them); GPU ms through `resolveTimestampsAsync` on
    Chrome only (`trackTimestamp` never on Firefox). `?ewdiag=1` prints navigator.gpu, the mode asked, the
    adapter and the board renderer's backend; `ThreeRenderer.gpuStatus()` from the console.
  - KTX2 on the node path waits for `renderer.init()` and calls `detectSupport(renderer)`.
  - Sandbox: the node renderer on its WebGL 2 backend ran the HQ foyer clean (~277 draws vs ~286 classic, KTX2
    ASTC, no page errors). The sandbox Chromium's SwiftShader WebGPU device dies ~16 s in with shadows and
    KTX2 off too, so the WebGPU backend itself is untested here; mondo's Mac is the measure.
- 2026-10-03: **W0 fix 1** (zip renderer/ENTROPY_WARS_W0_FIX1.zip). mondo's first Firefox run on `webgpu` froze the picture
  on the first camera move (the CSS2D door plates kept moving; F3 kept counting). Console: "In a draw command … Buffer with ''
  label has been destroyed". Cause, in three 0.186.1's WebGPU backend: a geometry dispose frees its vertex buffers at once,
  and for an interleaved attribute it frees the InterleavedBuffer's buffer (GLTFLoader shares one per bufferView: the foyer
  has 19 meshes on 6) but keeps it on file, so every later draw of a sibling is on a destroyed buffer and Firefox rejects
  the frame. The WebGL backend forgets the InterleavedBuffer instead, which is why `webgl2` moved. three-renderer.js
  `_ewGpuSafeBuffers`: interleaved buffers are left to the garbage collector; other freed buffers are destroyed at the next
  frame's first render. The Renderer line in F3 now counts uncaptured GPU errors and shows the first. Foyer readouts so far:
  node renderer on WebGL 2 67.6 FPS / CPU 3.9 ms vs the classic renderer's 69 / 3.4 (2026-10-02, post on), plain picture.
- 2026-10-03: **W0 verdict** (mondo's Mac, Firefox, after fix 1). Foyer: webgpu 76.9 FPS / CPU 4.7 ms / 383 draws vs classic
  61.5 / 3.3 / 355 (classic with post). central_egress (downtown), post off on both: classic 79.8 FPS / CPU 6.0 ms / 894
  draws vs webgpu 52.6 / 12.7 ms / 953. The node renderer costs ~2x the CPU per draw: worse, so by §3 W6 moves first.
- 2026-10-03: **W6 built** (zip renderer/ENTROPY_WARS_W6_BUNDLES.zip), out of order on purpose (§3), on the W0 stand-ins.
  Changed from the W6 text:
  - No BundleGroup objects are inserted: the HQ's own groups (each drawn part's shellGroup / propGroup / doorGroup and
    the instance pass group) are flagged in place (`isBundleGroup`, `version`, `static` are all three reads), so no
    game code sees a new parent. charGroup stays out.
  - The "needsUpdate on attach / detach / move / light change" is a per-frame signature (`_ewBunTick`): structure
    (visible tree, geometry + buffers, counts, materials + textures, shadow flags) re-records and counts as churn;
    values (matrices, colour, opacity) re-record only while the group is static, and 5 in 2 s demote it to
    non-static (three re-checks each object, still replayed); lamps + fog + the freed-resource epoch re-record every
    group without counting; the game's LOD level swaps re-record at most once a second; a group whose tree churns 5
    times in 2 s draws classic for 5 s.
  - Bundles are recorded unculled (`_projectObject` wrap); a point light's six faces draw the groups classic and culled.
  - three runs bundles at the END of the pass (after the transparent queue); `addBundle` is replaced so they run first.
  - Every freed buffer / texture / uniform buffer bumps the epoch, so no bundle ever replays a destroyed resource.
  - F3: the Renderer line names the bundles; their draws are NOT in "Draw calls". `ThreeRenderer.bundles()` lists each
    group's re-records by cause. Off: `?ew_bundles=0` or `window.EW_NO_BUNDLES`; `window.EW_BUN_DRY` runs the
    signatures alone (any backend) for the sandbox.
  - Known: a static see-through piece in a bundle now draws before the dynamic opaques (an NPC behind static glass
    is not tinted by it).
- 2026-10-03: **W6 verdict** (mondo's Mac, Firefox, central_egress, WebGPU): bundles on 80.7 FPS / CPU 5.9 ms; bundles off
  (`?ew_bundles=0`) 60.1 / 12.1. The node renderer now costs what the classic one does (6.0 ms): by §3, W1 next.
- 2026-10-03: **W1 built** (zip renderer/ENTROPY_WARS_W1_MATERIALS.zip). Changed from the W1 text:
  - No second factory per effect: the classic material stays the only one. three's node library turns it into a node
    material once per build (`library.fromMaterial`), and `_ewNodeDress` (three-renderer.js) dresses that copy: it walks
    the hook stack (a layer hook, horizon fog or dissolve, records `_ew_base` / `_ew_layer` on itself), picks the base
    by identity (`_hqAoHook`, `_ewVColorEmissiveHook`) or by the `_ewNode` tag a factory leaves (`terrain`, `fluid`,
    `wind`, `grass`, `kelp`; three-vfx.js `fxop`), then adds each layer. The shared `{value}` objects the GLSL hooks
    read become node uniforms that read them every render (`_ewNodeRef`), so nothing ticks twice.
  - A tagged material sets `ewNodeKey = 'ew' + id`: three's node build cache keys on every material property, so two
    terrain rooms with one GLSL program get two node builds (else the second binds the first one's sheets). Identical
    shader code still lands on one GPU program.
  - Lights: the legacy light nodes (×π, r128's cutoff ramp) are registered over three's in `lightNodes`. Height fog: the
    scene's FogExp2 node is replaced (`_nodes.updateFog`) by one with the floor term folded in.
  - The sways offset after instancing (three's positionNode order), so a batched tree's offset is the crown's world
    amplitude ÷ the mesh's own scale; the GLSL put it before the instance matrix. Same picture, the sway's direction no
    longer turns with each copy.
  - No transpiler: the GLSL bodies were short enough to write as TSL `Fn` by hand.
  - Not in W1: the room looks' grade (night mood, vignette, the retro print) is the post stack, W3. Side by side in the
    sandbox (WebGL 2 backend) the node picture is brighter than classic for that reason only; water, lava, terrain,
    the woods' wind and kelp compiled and drew. `ThreeRenderer.nodeLayers()` counts what each layer dressed.
- 2026-10-03: **W6 fix 1** (zip renderer/ENTROPY_WARS_W6_FIX1.zip). mondo, main hall on WebGPU after W1: the lower walls
  black, "textures moving with my camera"; fine with `?ew_bundles=0`. Cause: W6 ran the bundles before everything in the
  pass, so the camera-centred backdrop (env ground renderOrder -50, wall -60, dome -1000, sky / horizon groups; no depth
  test, drawn first so the room covers it) painted over every bundled wall below the horizon. Now the bundles are held
  and run where a renderOrder-0 group sorts (after the negative prefix of the opaque list, before the rest, at the
  latest before the transparents or the pass's end): `_ewBunSetup` wraps `_renderObjects`, `_renderTransparents`,
  `beginRender` / `finishRender`.
- 2026-10-03: **W6 fix 2** (zip renderer/ENTROPY_WARS_W6_FIX2.zip). After fix 1 the hall's floor and lower walls were
  still black (F3: 79 FPS, 16 calls). Real cause: the room warm-up calls `renderer.compile`, which on WebGPURenderer is
  `compileAsync`, so the room's pipelines compile asynchronously. A bundle recorded while a pipeline is still pending
  skips that draw (`Pipelines.isReady` false), and three never re-records a bundle by itself, so the skipped walls
  stayed missing; classic draws just retry next frame. `_ewBunSetup` wraps `_pipelines.isReady`: a miss during a
  recording (not a failed pipeline) flags the group, and `_ewBunTick` re-records it next frame until every pipeline is
  ready (`why.cold` in `ThreeRenderer.bundles()`). Fix 1's order stays (it is the right painter's order anyway).
- 2026-10-03: **W2 the shader programs** (zip renderer/ENTROPY_WARS_W2.zip, supersedes the W6 fix 2 zip). Every
  hand-written GLSL program the game draws now has a TSL twin (`Fn` only) that the node renderer swaps in, keyed by the
  fragment source string (`_ewProgs`, three-renderer.js "THE NODE PROGRAMS"). The classic material stays the one the
  game writes; the twin reads its uniform objects through reference nodes, so nothing upstream changed. Ported:
  highlight, ring, reticle, the two x-ray twins, the two outlines (model outline extrudes in view space in
  `vertexNode`), aura shells, the sky ground / wall / dome, rays, ray pools, ray motes, the HQ atmosphere points and
  rain lines, the reflector (projective `uTexMat`, not `reflector()`, so the HQ's own mirror camera stays), ambient
  points (three-vfx.js), the flame volume raymarch, the energy and orb shells (three-vfx-effects.js) and the MeshLine
  bolts (three-lightning.js; the twin keeps meshline_vert's clip-space ribbon instead of `Line2NodeMaterial`, so
  `THREE.MeshLine` stays). Points that draw sprites go through a per-Points instanced quad proxy
  (`_ewPointProxy`) because WebGPU points are 1 px. Other files register with `ThreeRenderer.nodeProgram(fs, key,
  fn)`. Console: `ThreeRenderer.nodePrograms()` builds one of each and returns `{name: twinned}` (all 21 true on the
  sandbox's WebGL 2 backend); `nodeLayers()` counts `program <key>`. The menu backdrop's own renderer in index.html
  is classic WebGL and was left as it is. A program without a twin still gets the old flat stand-in.
- 2026-10-04: **W6 fix 3** (zip renderer/ENTROPY_WARS_W6_FIX3.zip, three-renderer.js only). The real cause of the hall on
  WebGPU (lower walls black, "textures moving with my camera", fine with `?ew_bundles=0`; fixes 1 and 2 were real but not
  it). three's shadow maps draw from the first lit object's `updateBefore`, i.e. as a nested `render` INSIDE the first
  bundle's recording, and `_renderBundle` ends by setting `_currentRenderBundle = null`, so once the nested render's own
  bundles were done the outer recording went on with no current bundle: every object recorded after the shadow pass
  landed in the GPU bundle but not in three's `renderObjects` list for it (the sandbox count: the shell bundle registered
  1 of its 146 meshes). Those objects were never refreshed again, so a material drawn by nothing else — the static
  batch's merged walls — kept the first frame's camera and lights in its shared uniforms and replayed glued to the view;
  the floor, the first object, was fine; and fix 2's miss flag never saw their pending pipelines ("0 re-records/s").
  `_ewBunSetup` now wraps `_renderScene`: a nested render starts with no current bundle and hands the outer one back.
  `ThreeRenderer.bundles()` reports `recorded` (three's count) per group. Same zip: the KTX2 transcode target on the node
  renderer is now one the classic WebGL contexts can upload too (`_ktxLoader` ANDs the device's formats with a WebGL 2
  probe): Firefox on a Mac offers ASTC on WebGPU but not on WebGL, so the character viewer behind the party builder's hero
  stage drew every unit black. The ?ewdiag build line now reads the real script token.
- 2026-10-04: **W3 the post stack** (zip renderer/ENTROPY_WARS_W3_POST.zip: three-post.js + three-renderer.js, token
  20261004-gpu3-01-cors). three-post.js "WEBGPU_PLAN W3 — THE NODE CHAIN" builds the post on three's `RenderPipeline`
  when the board renderer is the node renderer: the add-ons (`BloomNode`, `FXAANode`, `SMAANode`, `GTAONode`) load by
  dynamic import, then one pipeline per shape `aa|ao|BDF` (cached; `ThreePost.getPostChain()` → `lib: 'node'`,
  `effectsA` the key, `pipelines` the count). Order: scene pass (half float, no stencil) → AO → + bloom → tone map →
  AA → tilt-shift H/V → the frame → canvas, `outputColorTransform` off. The rest of three-post.js drives stand-ins
  with the classic shapes (`_bloomPass`, `_cinematicPass.material.uniforms`, `_retroPass`, `_ssaoPass.aoMat.uniforms`,
  `_dofPassH/V`, `_toneMapPass`), so every `set*`, the scene looks, the night grade and the drama dims write the same
  objects as before and the node graph reads them through reference nodes. Ported as TSL `Fn`: the classic SSAO (16
  kernel taps, the depth-aware 4×4 blur), the tone map (r128 ACES, the GLSL `mat3` column order), the 9-tap tilt-shift,
  the Cinematic + Retro frame (one graph; motion blur inside a uniform `If`; the pixel mask still renders through
  `_renderPixelMask`). Auto exposure reads 16×16 back with `readRenderTargetPixelsAsync` (rows padded to 256 bytes on
  WebGPU). `renderDirect` (split screen, side panes) renders each pane to a half-float target and tone-blits it into
  its viewport. The room warm-up compiles into the scene pass's target (`ThreePost.warmTarget()`) so its pipelines
  match the frame's formats. Differences from the plan as written: **no TRAA** (it needs the velocity MRT, which W8
  builds); the "N8AO" AO row draws GTAO on this path and keeps the classic depth-aware blur (the Settings label still
  says N8AO); bloom reads the raw scene the way the pmndrs chain did; AA runs after the tone map; the scene pass has no
  stencil (WebGPU cannot sample a depth-stencil texture with aspect "all"), so the outlines stay as on W2; lighting
  sync now runs on the node path too. Fixed on the way, found by the load check: (1) three's node effects
  (`RTTNode`, `SMAANode`, the blurs) call `resetRendererState`, which clears the render-object hook, and the scene
  pass renders INSIDE them, so every shader twin, point proxy and the shadow pulse were skipped inside the chain
  ("Material ShaderMaterial is not compatible"); `_ewGpuCompat`'s render wrapper re-arms the hook for a scene render
  that finds it cleared, and QuadMesh / side renders no longer count as the frame's outer render. (2) A three 0.186.1
  bug on both backends: `Geometries.updateAttribute` keeps its per-call map across a geometry dispose, so after one
  only the FIRST attribute of an interleaved geometry is uploaded again and every later draw fails ("no buffer is
  bound to enabled attribute"); every Sprite shares one interleaved quad, so one disposed sprite hid every light halo
  in the HQ (true since W0). `_ewGpuInterleaveFix` uploads an interleaved attribute the renderer holds no record of on
  the spot; drop it when three fixes Geometries. (3) A local `var _ng` (the night grade) in `render()` shadowed the
  chain and crashed every battle frame; renamed. (4) The zodiac wheel rim was the game's one `LineLoop`, which the
  node renderer refuses; it is a closed `Line` now (same picture on both). Sandbox check (`?ew_gpu=webgl2`): HQ lobby
  matches `?ew_gpu=webgl` side by side (halos, AO, grade), the bloom / FXAA / SMAA / retro / GTAO variants build with
  no errors, a battle builds `smaa|classic|-DF` with the DoF band. Next: W4.
- 2026-10-04: **W3 fix 1, the main menu** (zip renderer/ENTROPY_WARS_W3_FIX1.zip: three-post.js + three-renderer.js,
  token 20261004-gpu3-02-cors). mondo: the car, the door and the sky pyramids too pixelated, the whole scene too dark.
  Three causes, each measured against `?ew_gpu=webgl` on the desert menu: (1) the retro grid is `uResolution /
  uPixelSize` with `uResolution` in CSS px, and `resize()` skips while the chain is still loading, so it stayed at the
  boot size (960×540 on a 1100×700 canvas: blockier cells); `_ngRender` now resizes when the canvas size and the grid
  size differ. (2) The tone map in the chain had no classic twin: WebGLRenderer r153+ tone-maps only when it draws to the
  canvas, and the classic post draws into the composer's target, so the classic look has NEVER been tone mapped (and
  three-post.js `_hdrSupported` was always false: `!THREE.NoToneMapping` is `!0`). The node chain dropped that step
  (`_hdr = false`, `_ngTone` kept only for `_ngDirect`); the lamp-lit door leaf went 102 → 72, classic 72. (3) The
  room-box AO dress (`_ewNodeAo`, the `_hqAoHook` twin) read `normalWorld` inside `setupDiffuseColor`; that builds
  three's once-only `normalView` before the lighting does and the lit normal came out wrong, so on every `_hqAoHook`
  material (HQ walls, floors, props: the menu ground and door frame) the sun and spot lights added nothing and the sky
  light read its ground colour. It reads `normalWorldGeometry` now (what the GLSL reads: `mat3(modelMatrix) *
  objectNormal`). After: desert menu floor / frame / leaf / sky equal to classic within one level, full post on.
- 2026-10-04: **W4 the libraries, the lens and the edges** (zip renderer/ENTROPY_WARS_W4.zip: three-renderer.js,
  three-post.js, three-vfx.js, ui.js; token 20261004-gpu4-01-cors). Already done in earlier phases and only checked
  here: KTX2 on the node renderer (W6 fix 3: the device's formats ANDed with a WebGL 2 probe), the lens's GPU timings
  (W0: `trackTimestamp` off on Firefox), the room warm-up (three's `compile` IS `compileAsync` on the node renderer,
  W3 points it at the scene pass's target), the async auto exposure and the split-screen pane blit (W3), the snapshots
  (`_fieldSnapshot`, the creator photo) read back in the same task. New: (1) **the canvas plates**: on the node renderer
  every HQ plate (door, way, portal, counter, sign) is one plane whose rows `_hqCvPaint` paints into a `CanvasTexture`
  (the troika plate's rows, sizes, tones, halo and underline; Cormorant SC 700 + IBM Plex Mono 500, the DOM fonts,
  repainted once `document.fonts` has them); troika is never used there (its glyphs are GLSL). index.html no longer
  sets `EW_NO_GPU_TEXT` on the node modes (W0 forced the CSS2D plates there); `ew_text = 'css'` is still the kill switch.
  F3 "Text (HQ plates) canvas (node renderer)". (2) **The clip planes**: three's node renderer clips only through a
  `ClippingGroup`. A material's own `clippingPlanes` (the elevator halves, the pocket doors, the editor's level band)
  become discards in `_ewNodeClip` (dressed only on materials that carry planes; each plane read off the material at
  every draw); the reflector's mirrored draw lends the scene's children to a `ClippingGroup` for that one render
  instead of `renderer.clippingPlanes`. (3) **The lost device**: `onDeviceLost` (WebGPU backend) rebuilds the board
  renderer on the same canvas (`_ewGpuRebuild`: a new device, the frame loop moved over, the bundles set up again,
  `ThreePost.swapRenderer` drops the chain's pipelines, the exposure readback and the pane blit); three times a session
  at most; the old renderer is not disposed (its dispose would free the shared textures' new copies); the WebGL 2
  backend waits for the browser's context restore. `ThreeRenderer.gpuRebuild()` runs it by hand; `?ewdiag` / F3 print
  "DEVICE LOST ... (rebuilt n×)". `_ewNodeU` now survives a rebuild. (4) The Settings: on the node renderer the "Spell
  FX Layer" row is hidden (three-vfx.js `_qkWanted` is false there too) and the AO Quality row reads Classic / GTAO.
  Not in W4: the editor's thumbnail renderer, the character viewer and the main-menu firmament still make their own
  `WebGLRenderer` (they stay on the classic build until W5 removes it). Sandbox (`?ew_gpu=webgl2`): lobby plates draw
  as canvas planes (24 on the GPU, 0 CSS2D), the barbershop mirror renders (gain 0.9, no throw), 2-3 clip materials
  dressed, a by-hand rebuild keeps drawing with the chain rebuilt, no errors. Next: W5 (the flip) when mondo says so.
- 2026-10-04: **Plan order changed (mondo):** W5 (the flip) moves to the end, after W13; battle and spell performance
  (W5a) comes first. "dont want to switch until that is fixed".
- 2026-10-04: **W5a battle and spell performance** (zip renderer/ENTROPY_WARS_W5A_PERF.zip: three-renderer.js; token
  20261004-gpu5a-01-cors). Node renderer only; classic WebGL untouched. Measured in the sandbox on `?ew_gpu=webgl2`
  (same node builder and pipeline cache as WebGPU). (1) **The cause:** three's node renderer bakes every light's id
  (and castShadow) into each render object's cache key (`LightsNode.customCacheKey`). ThreePost.rebuildUnitLights
  destroys and re-creates the unit PointLights on every unit rebuild (a move, a hit, a turn), and the FX flash pool
  turns lights on and off; each new id changed every lit material's key, the old render objects were disposed, their
  node states hit zero use and three dropped them, so the next frame built every material again (NodeBuilder, then a
  pipeline). A steady battle built ~50 node shaders a frame (537 builds, 108 new pipelines in 10 frames). (2) **The
  light rig** (`_ewRigTick`, three-renderer.js "THE LIGHT RIG"): every non-shadow PointLight in the scene is taken off
  the camera's layers (`layers.mask = 0`, restored on release) and copied each outer frame onto a fixed set of rig
  lamps (grown in steps of 4, at most 64; spares at intensity 0). The lamp ids never change, so the key never changes;
  the lighting math is the same light (same class, world position, colour, intensity, distance, decay: checked lamp
  by lamp in a battle). Shadow-casting lights keep their own (their shadow maps are per light). The spell void stage
  leaves the rig group in place. F3 "Lights point ... · rig X/Y". (3) **The kept shaders** ("THE KEPT SHADERS",
  `_ewKeepSetup`): a node state, pipeline or program at zero use now waits in an LRU (384 / 256 / 512) instead of
  being dropped, so a material that comes back (a spell's second cast, a unit leaving and returning) reuses its
  build. (4) **One instancing shader:** an InstancedMesh small enough for a uniform buffer got a buffer named after
  its node id, so every particle pool (R7 batches) compiled its own vertex shader and pipeline; the builder now gets
  a zero uniform limit for InstancedMesh, which takes three's instanced-attribute path and shares one shader (26 FX
  vertex programs to 1). Results: steady battle 0 builds and 0 new pipelines a frame (39 frames in the window that
  drew 10); first spell cast of a session 142 builds / 53 pipelines / ~695 ms of builds to 34 / 3 / ~222 ms; a
  repeat cast ~15 builds / 2-3 pipelines to 9 / 0 (the 9 are ShaderMaterial and MeshLine twins with unique node
  ids). F3 new line "Shader builds X/s · new pipelines Y/s (session a / b) · kept b/p/g". Off: `?ew_lightrig=0`,
  `?ew_keep=0`. Next: mondo's F3 in a battle and during a spell on `?ew_gpu=webgpu` decides between battle bundles
  and the twin builds.
- 2026-10-04: **W5a round 2** (zip renderer/ENTROPY_WARS_W5A_PERF2.zip: three-renderer.js; token 20261004-gpu5a-02-cors).
  mondo after round 1: "better and playable now but there are still frame drops and the frame rate aint as good as
  webgl" (battle F3: 43.7 FPS, CPU 12.1 ms, 1069 draws: scene 506, post 513, env 296, props 182; bundles 4 groups / 3351
  meshes, 4.9 re-records/s; Shader builds 0/s). (1) **The lens counted the scene twice:** on the node renderer the post
  chain's scene pass runs inside the chain's first quad draw, and `_lensGpuDraw` gave that quad every draw made inside it
  ("post 513" = the scene's 506 + 7 quads). A draw is now only what is left after the renders nested in it counted
  themselves: his frame was ~560 draws, not 1069. (2) **The re-records:** the bundles' freed-resource epoch moved on
  EVERY destroyed uniform buffer / texture / sampler, and a battle frees all the time (each render object that goes frees
  its buffers), so every bundled group re-recorded its meshes several times a second: the frame drops. The epoch now moves
  only for resources a recording holds (`_ewBun.used`, filled from each new recording's render objects' bindings).
  (3) **The check:** a geometry's and a material's share of the signature are hashed once per tick, not once per mesh;
  a demoted (non-static) group skips the matrices; a group the frame does not draw (hidden, or under a hidden parent) is
  neither checked nor bundled. F3 "bundles ..." now says the re-records by cause per second (tree, values, frees, lamps,
  lod, cold, rests) and the check's ms per frame. (4) **The sky wheel:** the zodiac constellation wheel (12 signs: stars,
  halos, dots, glyphs, nebulae, link lines, ~220 draws) had `frustumCulled = false` on every piece and drew every frame
  behind the battle camera; now culled like anything else (checked: no on-screen sprite culled over 24 camera
  directions; the wheel sits inside the camera's far plane) and an idle nebula (opacity 0) is hidden. (5) **The zone
  walls:** the nexus / zone pieces are flat transparent DoubleSide planes, which three draws twice (back, then front):
  `forceSinglePass` halves them with the same picture. Sandbox arena battle: scene pass 959 -> 654 draws (env 319 -> 109,
  props 196 -> 100). New F3 block "Own draw calls by group" names the groups that still cost draws (a bundled group's
  leftovers read "(outside its bundle)"). Still open: the per-draw CPU of three's node renderer (#30560) on what is left;
  the battle board is not bundled (its pieces are mostly backdrop or transparent overlays with their own sort order).
- 2026-10-04: **W5a fix 3, the battle freeze** (zip renderer/ENTROPY_WARS_W5A_FREEZE.zip: three-renderer.js; token
  20261004-gpu5a-03-cors). mondo: "screen freezes but the battle still goes on and i can see the name plates moving";
  F3 "post 0" (the chain's quads never drew). Reproduced in a sandbox AI battle (`?ew_gpu=webgl2`, GTAO on): page error
  "Cannot read properties of null (reading 'complete')" in three's Textures.updateTexture, every frame. `startHitEffect`
  clones the hit sheet and flags the clone for upload; while the sheet is still loading the clone has version 1 and a
  null image, which three's node renderer dereferences (WebGL skips it). The scene pass runs inside the post chain's
  first quad draw, so the throw left render() mid-frame and nothing reached the canvas while the game and its DOM went
  on. Fixes: the spark is skipped until its sheet has a picture; THE DRAW GUARD in the render-object function catches a
  throw in one draw, skips that draw and lets the frame finish (`?ewdiag` / F3 "skipped draws N (first: ...)", one
  console warning per object). Sandbox after: no page errors, post 9 draws. Still open: the W2 twins (each new
  ShaderMaterial / MeshLine instance builds its own node shader: ~4-6 builds/s in an AI battle, the CPU of mondo's 39 ms
  frames).
- 2026-10-04: **W5a round 4, THE SHARED TWINS** (zip renderer/ENTROPY_WARS_W5A_TWINS.zip: three-renderer.js; token
  20261004-gpu5a-04-cors). Each W2 twin built a fresh TSL graph, and a fresh graph is a fresh node build + pipeline, so
  every new tile highlight, outline, MeshLine bolt or skinned ShaderMaterial copy compiled its own shader (sandbox AI
  battle: 716 builds in 60 s). Now `_ewProgTwin` keys a twin by factory + vertex shader hash + defines + uniform names +
  object kind; later twins with the same key reuse the first twin's node properties. Uniform reads stay per material:
  `_ewPU` / `_ewPT` read `twin._ewu_<name>` (a getter onto that material's own `uniforms[name].value`) from the drawn
  material (`frame.material`, OBJECT update per render object). A uniform object shared under two names is ambiguous and
  that twin is not shared. Off: `?ew_twinshare=0` / `window.EW_NO_TWIN_SHARE`. Sandbox after: 61 builds in 60 s, no page
  errors, P1/P2 rings keep their own colours.
