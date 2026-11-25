---
name: firefox-120gb-bitmaps-20261123
description: mondo's Firefox hit 120 GB (11-23): three leaks fixed (GLB ImageBitmaps #2498; hero lamp list #2510; three.js draw records #2512), numbers, how to probe
metadata:
  type: project
---
Thread (owner-project id) "Fix Firefox using 120 GB of memory". Related [[hall-crash-trail-20261115]], [[no-chrome-20261123]].

- LEAK 1, PR #2498 (live): memory budget drops (`_mmEvict`/`_mmRigEvict`) never closed GLB ImageBitmaps. `_mmCloseBitmaps`. Pictures 621->1423 MB over 4 room changes before, flat ~640 after. Off EW_KEEP_DROPPED_BITMAPS.
- LEAK 2, PR #2510 (live): the hero lamp kept the room's casters (`L._ew_gate.list/.seen`) and outlives the room. `_hqHeroGateDrop`, `_hqUnlinkLeft`, `_hqScrubLeft` in `_hqLeave`. Off EW_KEEP_LEFT_TREES. Pieces after leaving the Clearing: 51.1K -> 15.5K.
- LEAK 3, PR #2512 (live 11-24, three-renderer 747336ba, token 20261124-drawrec-01-cors): three r186 `renderer._objects._renderObjects` Set keeps a RenderObject per drawn object until object/material/geometry fires 'dispose'; shared prop materials never do. `_hqUnlinkLeft` dispatches {type:'dispose'} on left pieces. 15.5K -> 8.9K (lobby alone ~6.1K). RULE: throwing away drawn objects with shared materials => dispatch 'dispose' on them.
- Waiting: mondo to confirm no more crashes on his Mac.
- PROBE: session scratchpad memprobe.js (`--serve` on :7777: /eval, /q "Proto|fn" runs on queryObjects results, /hop). Heap snapshots crash the cloud tab. queryObjects MUST use objectGroup + release; a /q fn that THROWS leaks its 8M array (restart the probe). Find holders: Object.prototype scan grouping objects whose own values are detached pieces by constructor+keys.
- Server 503 = stale: merge main, restart npm start.
