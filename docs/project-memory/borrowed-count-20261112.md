---
name: borrowed-count-20261112
description: WebGPU "bindingBuffer destroyed" + "draw failed and was skipped (hq:gaps:floor ... writeBuffer)" on Camelot = three's shared bind-group count stolen by never-drawn render objects; fixed PR #1157
metadata:
  type: project
---
mondo 11-12 pasted a Firefox console log (Camelot fight, WebGPU, three 0.186.1). Thread (thread in the owner project). SHIPPED PR #1157, token 20261112-borrowedcount-01-cors, three-renderer.js e5c11802, sprites.js 87984288.

- Cause: three `Bindings.deleteForRender` decrements the use count of a look's SHARED bind group (`render` group = camera uniform buffer, one per node build) even for a render object whose bindings were never made. THE LATE LOOK hold (`_ewLateSetup`: `O.get` then return) makes those; one disposed before drawing takes the count to 0 and three destroys the buffer under meshes still drawing (any mesh of that look, not only the gap floor).
- Fix: three-renderer.js `_ewGpuSafeBindings` (uninitialised render object gives nothing back; WebGPU uniform buffers destroyed at next frame start via `_ew_freeLater`). Note: docs/notes/rendering-loading-perf.md "THE BORROWED COUNT".
- Proof was a 2-mesh page on real three 0.186.1 in headless Chromium WebGPU (SwiftShader flags `--enable-unsafe-webgpu --use-webgpu-adapter=swiftshader` DO give a working WebGPU device for console/logic proof). He confirmed "its good now" 11-12 03:58Z.
- Same PR: key pickup effect model 404 (`_keyFxUrl` ignored the catalogue `base: 'psxmp'`), mermaid `Swim_Idle_Loop` lib 1 -> 0 (she now floats on the swim idle; his to overturn).
- Reported, untouched: Shasta slopes climbs 3 and 4 rise 0 m (dropped); Camelot ward arc bridges tower_sw_deck / tower_se_deck under 1.95 m headroom on 1 sample.
- Any future "skipped draw ... writeBuffer" or "buffer destroyed" WebGPU report: route to this thread.
