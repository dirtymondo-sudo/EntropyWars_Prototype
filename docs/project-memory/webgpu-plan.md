---
name: webgpu-plan
description: WEBGPU_PLAN.md (PR #60): WebGL to WebGPU/TSL port; W0-W4, W6, W5a built; W5 (the flip) moved LAST per mondo
metadata:
  type: project
  modified: 2026-10-04T05:01:46.202Z
---

Plan: WEBGPU_PLAN.md; its §10 log has every phase's details, zips, tokens and mondo's readouts. `?ew_gpu=webgpu|webgl2|webgl`. Sandbox HAS real WebGPU (SwiftShader, page on localhost): [[sandbox-webgpu]]. Default is still WebGL.
Done: W0 #61, freeze fix #62, W6 bundles #63 (+fixes #65 #66 #68), W1 #64, W2 #67, W3 #69 (+fix #70), W4 #71, W5a #72.
ORDER (mondo 2026-10-04, "dont want to switch until that is fixed"): W5 (the flip) is LAST, after W13; battle + spell perf first. W5a #72: zip renderer/ENTROPY_WARS_W5A_PERF.zip, token 20261004-gpu5a-01-cors. Round 2 PR #73: bundle epoch for held resources, lens fixes. Fix 3 PR #74: battle canvas froze while DOM went on = a throw inside one draw aborts the node renderer's whole frame (scene pass is nested in the post chain's first quad); cause was startHitEffect cloning a still-loading sheet (version>0, image null); now THE DRAW GUARD skips a throwing draw (F3/ewdiag 'skipped draws'). F3 'post 0' = frames aborting. Round 4 PR #75: THE SHARED TWINS, identical W2 twins share one node graph, uniforms read per drawn material via twin._ewu_<name> (off ?ew_twinshare=0); sandbox battle builds 716 to 61/min; his F3 after: builds 0, CPU 15 ms, FPS 36. Round 5 PR #78: FIELD BUNDLES, the fight's room (_facilityNearGroup holders + fight instance pass) bundled per holder, off-camera holders skipped; walk-only bundles before. Sandbox HQ-room battle: applyGameMode('prebuilt_downtown_delta'). Round 6 PR #79: battle-start lag = three's shadow pass built a shader per textured material (map alpha); now shared unless alphaTest/transparent (?ew_shadowshare=0); builds at switch 175 to 65. Hitches pass PR #186 (2026-10-12, token 20261012-gpuhitch-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261012-0301.zip): one global light rig + one shared fog (scene swaps keep keys), shared InstancedMesh shaders, bundle frees per group, spell sheet warm; battle-2 start 6 builds, return 2-11. Open: first battle still ~100 builds (fight's own materials).

**Node renderer traps (checked in three 0.186.1):**
- LightsNode bakes each light's id + castShadow into every render object's key: add/remove a light = EVERY material rebuilds (rebuildUnitLights did this per unit change; ~50 builds/frame). `_ewRigTick` copies non-shadow PointLights onto fixed rig lamps (source layers.mask 0, original in `_ew_rigMask`). three drops builds/pipelines at zero use: `_ewKeepSetup` LRU. InstancedMesh UBO named per node id = a shader per mesh: `getUniformBufferLimit = 0` in debug.onNodeBuilderCreated. F3 "Shader builds X/s" should be 0. Off: ?ew_lightrig=0, ?ew_keep=0.
- Shadow pass renders nested inside the first bundle recording; `_ewBunSetup` wraps `_renderScene`. Bundles must run after the negative-renderOrder backdrop.
- Interleaved geometry loses attributes after dispose (`_ewGpuInterleaveFix`). Node effects clear the render-object hook. No tone map in the node post chain. Dresses read normalWorldGeometry, never normalWorld, inside setupDiffuseColor. Node three ignores material clippingPlanes (`_ewNodeClip`).
- A new GLSL hook needs a dress (`_ewNodeDress`), a new ShaderMaterial a TSL twin (`ThreeRenderer.nodeProgram`). TSL `Fn` only, never wgslFn/glslFn.
- TSL `normalView` is NEGATED on a BackSide material (negateOnBackSide): hull/extrude twins use `normalViewGeometry` (PR #205). Scene pass is depth+stencil; `_ewGpuDepthOnlyViews` samples its depth.
- Firefox: WebGPU from 147; never `trackTimestamp`. KTX2 target = WebGPU formats AND a WebGL2 probe.
- Not on the node renderer: ShaderMaterial, onBeforeCompile, EffectComposer, pmndrs, n8ao, troika, quarks, MeshLine. Editor thumbs / character viewer / firmament keep classic WebGLRenderers until W5.

**Why:** don't re-research these or flip before mondo says.
**How to apply:** read WEBGPU_PLAN.md before shader/renderer work; one PR per phase. See [[renderer-plan]], [[perf-lens]].
