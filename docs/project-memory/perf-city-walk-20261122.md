---
name: perf-city-walk-20261122
description: Disaster City walk F3 of 11-22 18:10Z (36 FPS, JS-bound): what PR #2430 cut, what is unknown, what to read in mondo's next F3
metadata:
  type: project
---
Thread "Fix battle and city frame dips" ((owner-project id)). Follows [[perf-city-60fps-20261115]], [[perf-fight-start-20261122]]. Notes: docs/notes/rendering-loading-perf.md "THE FIRSTS BY BUFFER + THE BATCHES BY TURN".

- His 18:10Z F3 (downtown, Firefox Mac WebGPU): 36 FPS, CPU 22.9 of 27.7 ms = JS-bound now, spread thin (bundle replays 6.2, matrix walk 2.7, classic draws 2.6, bundle check 1.8). 0 re-records/s.
- PR #2430 (merged 11-22, three-renderer.js 34574b6c, token firstsbuf-01): firsts left out when their shared bind groups were already written this render (off EW_BUN_FIRSTS_BY_SHADER; audit EW_BUN_FIRSTS_AUDIT + ThreeRenderer.bundleFirsts()); instance batches compared 1 in 8 a frame (off EW_HQ_INST_MW_EACH); a churning group rests 0.7 s then doubling to 5 s, was fixed 5 s (off EW_BUN_REST_5S); lens "Re-recorded most" names the last piece whose own tree moved.
- NOT KNOWN: what changes the closed rooms' trees ("rooms b|dc:P02-08-B1 tree 73, other 71, rests 15"). Read "last piece whose own tree moved" in his next F3 and stop it at the source.
- NOT OURS (told him): one-frame dips every ~6 s with normal JS = Firefox collector; the 2.7 s dip had every part 1.5-2x slow at once incl. "post: pass begin".
- CLOUD: WebGPU SwiftShader loses the device loading the city on 11-22 ("Instance dropped in popErrorScope", lands in central_egress). Only lobby counts possible: firsts 56 -> 23, audit 24,792 / 0 wrote. Probe: session scratchpad city3.js (ROOM=, FLAGS=, EW_PROBE_GL=webgpu).
- 11-23 PR #2468 (merged, token sharedrefs-01) THE SHARED REFERENCES: after #2430 his 11:35Z F3 still had "firsts 123", ~35 µs each (bindings): every lit shader had its own shared buffer because three makes fresh reference() uniforms for the sun shadow + a fresh screen-size uniform per shader build. `_ewRefShare` makes them one uniform each (off EW_NO_SHARED_REFS). Not covered: point-shadow near/far pair (rooms with a casting point lamp). Expect "firsts" to fall to ~10-20 in his next city F3; if not, run EW_BUN_FIRSTS_DUMP + ThreeRenderer.bundleFirstsDump() and EW_REF_TRACE to see which ids are unique.
- Picture check for node-shader changes in the cloud: `?ew_gpu=webgl2` (node renderer on WebGL2, llvmpipe) gives a real picture; city3.js GPU=webgl2 SHOT='[{}]'.
- "Re-recorded most" now also prints the prop key/model and which counts changed. Rooms P00-10-B1 / P02-08-B1 / P03-09-B1 still rest in bursts (cause unknown).
- Next after that: ~270 classic draws (151 one-of-a-kind props outside bundles, 43 cars, 41 signals), matrix walk 2.8, bundle check 1.6.
- 11-23 PR #2472 (lens only, token changers-01): "changers moved out N [names]" in "Re-recorded most". The ~164 single prop draws downtown are CHANGERS (values changed 3x/20 s, out of their chunk forever), NOT loose cars: on his WebGPU cars are in chunks (rig point lamps); a classic census calls them "lamp" and misleads. A classic EW_BUN_DRY city run gives 0 changers: cannot be reproduced in the cloud. Wait for his F3 names, then stop the value churn at its source.
