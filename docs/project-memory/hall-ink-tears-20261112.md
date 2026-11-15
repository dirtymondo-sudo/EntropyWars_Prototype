---
name: hall-ink-tears-20261112
description: "Black screen tears" in the Main Hall (dashed black bars across the far floor) = Entropy Style ink depth taps on texel seams; fixed PR #1234
metadata:
  type: project
  modified: 2026-11-12T17:24:31.369Z
---
mondo 11-12 (Firefox M1, WebGPU, ?likeness=1): "there are these black screen tears now" in the Main Hall. Thread (thread in the owner project). SHIPPED PR #1234, token 20261112-wholestep-02-cors, three-post.js fb93f9b2.

- Cause: NOT lighting / shadows. The ink line (three-post.js `_StyleShader` / `_ngStyle`) read depth a fraction of a texel out; nearest sampling snapped up/down reads unevenly on some screen rows, so a flat speckled floor took ink across the whole row. Tell-tale: bars sit on the SAME screen rows whatever the camera does, far floor only.
- Fix "THE WHOLE STEP": depth reads on texel centres, whole texels apart, in-between widths blend two tests (GLSL `sEdge`, TSL `edgeAt`). Note in docs/notes/rendering-loading-perf.md.
- Reproduced only with Ink Lines Thin at 2x pixel ratio (1.5 texels) on headless SwiftShader WebGPU; Medium (2.4) was clean here. His Mac NOT confirmed. If he still sees bars: ask Settings > Video Ink Lines + Render Scale values, and suspect depth texture size differing from `uDRes`.
- His same message also said far walls are unlit until he walks close (hall feels dark): a SEPARATE thread, not fixed here. Seen in the cloud shots too (far stairs / walls dim).
- Harness that worked (5 min a load): ctl server from /mnt/project-files/balance/weak-races-harness (setup.sh), `require('playwright')` default chromium, WebGPU flags from [[sandbox-webgpu]], `?hq&nomenu3d&ew_gpu=webgpu`, viewport 320x200 dpr 2 while loading then 864x540; wait `ThreeRenderer.hq.gate().pending === 0`; a screenshot takes 1-3 min. Proof /mnt/project-files/hall-ink-tears/. Related [[shader-style-20261112]].
