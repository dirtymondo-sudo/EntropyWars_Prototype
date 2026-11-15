---
name: black-blood-webgpu-20261111
description: PR #1127 "black ink blots with the blood" = WebGPU-only wrong instance colours on shared instanced meshes; how to reproduce WebGPU-only looks headless
metadata:
  type: project
  modified: 2026-11-11T12:03:44.999Z
---
PR #1127 (2026-11-11, merged + uploaded, token 20261111-blackblood-01-cors). mondo: "black ink blot looking things that
appear with the blood". They were the blood's own floor stains / kill spatter (and a few drops) drawn BLACK on the node
renderer only (WebGPU, where he plays). Nothing removed. Cause: three-renderer.js THE SHARED INSTANCING did not swap the
instance-colour attribute (three 0.186 keeps it as a plain InstancedBufferAttribute), so every three-vfx.js particle batch
and the blood-glob meshes read the FIRST batch's colours. Fix: `_ewInstAttr` / `_ewInstSync` `o._ew_icp`. This corrected
every batched particle tint on WebGPU, not just blood (my inference: other "wrong colour VFX on WebGPU" reports before
11-11 may have been this). Notes: docs/notes/rendering-loading-perf.md "THE BLACK BLOOD".

**How to apply:** a look mondo reports that classic WebGL does not show: reproduce with `?ew_gpu=webgl2` (node renderer on
WebGL 2, same TSL as WebGPU, screenshots work). Harness /mnt/project-files/ink-blots-20261111/tools: blots.js (GPU=webgl2
env; Spell Lab, fireBlood crit/super/kill), marks.js (ONLY=sprite list filter), live.js (kept-open lab, drop cmd/N.js or
N.shot files). Lab needs ~60 s after phase=battle before it draws; lab camera cannot be moved, fire on tile caster+1.
Not seen on real WebGPU. Related [[gore-rules]] [[throw-blood-20261110]]
