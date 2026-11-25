---
name: perf-city-glows-20261118
description: Disaster City 60 FPS restart thread 11-18: joined glows PR #2086, what the replayed meshes are, what was tried and dropped, cloud harness lessons
metadata:
  type: project
  modified: 2026-11-18T04:47:34.732Z
---
Thread (owner-project id) (restart of [[perf-city-60fps-20261115]], [[perf-city-meshprice-20261115]]). His 11-18 F3: 36 FPS, 2,126 replayed meshes. 216K "chars" tris = 6 bodies x2 passes, normal.
- PR #2086 THE JOINED GLOWS (token glows-01, three-renderer bb9f9eea live): 386 shell glow sprites (one picture) -> one SpriteNodeMaterial mesh per 96 m square. Cloud: shell rest 296 -> 10, glows 29 in view. Pixel test 3/255. Off EW_HQ_NO_GLOW_BATCH. Waiting his Shift+F3.
- Dropped: instance cells 128 m (more meshes in view, 526 -> 588); signs padded to pow2 width (far mips differ up to 101/255).
- Written NOT shipped: same-size sign canvases into sheet stacks (cut-out + opaque), diff in session scratchpad signstack.diff (lost with container); idea simple to redo in _hqStackTex/_hqStackKey.
- 11-18 05:59-11:51 PRs #2090-#2133 (tick lens, nav grid, hidden cells/people, walk/check split, merged quarter, rig pregrow, bundle spikes, left-alone-by-name): 35 -> 45.5 FPS steady; details in rendering-loading-perf.md. #2121 regressed, replaced by #2133. Spikes (thread in the owner project) owns walker/batch/chunks/stage/_mm/camera. Left: shell bundle check (10K kids), replays 3.5 ms, shell still-walk pose compare.
- Next by cloud squares line: cut-out signs ~420, opaque sign canvases ~88, many looks ~140 (split multi-material pieces), instance cells ~520.
- Cloud: EW_PROBE_GL=webgpu in probe-fast.js; full city ~10 GB unless GLB bitmaps shrunk; WebGPU device gets lost later (counts only); a long run OOM-killed the worker once. Merge main before every run (STALE page).
- PR #2134 THE FRONT DESK + SCAN ALARM (token frontdesk-01, three-renderer 4797defc): mondo angry 11-18 that features keep scanning the whole room. `_ewDeskQueue/_ewDeskTake` (add-hook arrivals); shadow flags, hero caster list, instance fresh check read arrivals only; F3 "Scene walks" line; CLAUDE.md RULE #1e. Handed _hqBlockerFloor + chunk spheres to spikes thread. His idea (one observer) = registry; next: move more features onto desk lists.
- PR #2136 ONE-BY-ONE PASS (token onebyone-01, three-renderer 5a83906b): his 12:18 F3 alarm named _hqInstAdd 47K (37 ms spikes), _hqLodScan 74K/2s, _css2dRender 77K/s -> incremental inst add (fresh + leftSet only), LOD + CSS2D on desk. Waiting his F3 (Scene walks line should have no !!).
- 11-19: his 12:31 F3 = 40.8 FPS, Scene walks clean (only lens). PR #2154 (token firstdraw-01, three-renderer 740f1717): slow frames show shader builds + new pipelines; bundle spikes 12 ms+. Suspect Firefox in-line pipeline builds on first draws (shadow classic 68 ms, 0.5-1 s gaps). Waiting his F3.
- 11-19 memory profile (his OK): ~5 MB/s garbage, mostly three WebGL internals; GC = minor part of drops. PR #2157 (token 20261119-garbagecut-01-cors, three-renderer cdbac887): _hqSeaRules cached, _hqNavGridAt reuses G.out. Spikes thread got its allocators list.
- 11-19 PR #2159 one-stamp bundle targets + spike names slowest group; #2162 held pieces hashed once (shell check 1.59 ms); #2163 GPU frees 48/frame + lens row 'render: gpu frees' (token freespread-01). His 13:44 F3 after walking: 40.1 FPS, 1 slow frame.
- 11-19 PR #2164 THE DIP LOG (token diplog-01): always-on dip recorder in the walk; Shift+F3 'Dips this session' lists each dip (time, length, lowest FPS, worst gap, where, top parts, what happened). His ask: stability not average.
- 11-19 PR #2166 (token rigdesk-01): rig light list on front desk (was whole-scene recursion on every add = 7-8 ms slow frames; scan alarm misses hand recursions), new bodies use rest-pose bounds (22+11 ms first frame).
