---
name: garden-open-air-stage-20261112
description: DOOR HQ garden "dark" when walked into from the pool (mondo 11-12) = open-air room on an indoor stage got no sky dome / lamp masts at the door crossing; fixed PR #1240/#1241
metadata:
  type: project
---
mondo 11-12: "The garden is dark" (walked in from the natatorium, Firefox M1 WebGPU). Thread (thread in the owner project).

- Cause: garden (annex zone), executive `pool`, `site_prebuilt_derelict_deck` are OPEN rooms (own sky) on the stage of an INDOOR zone. A door crossing (`_hqStageSwap`) built no sky dome and no lamp masts: black void overhead, no lamps at night. The world clock did set hemisphere + key to the hour, so by day the ground was lit. Walking back, the pool kept the garden's light (blown white by day, night-lit by night). A fast walker got a plain load (`_hqStageLoad`) with the sky, so it was intermittent.
- Fix PR #1240 (+ #1241 comment/notes): three-renderer.js `_hqStageSkyUp`, `_hqOpenRoomLamps`, `_hqStageAirCross`, `H.sky.air`. Token 20261112-gardensky-02-cors. Note docs/notes/hq-building-rooms.md "THE OPEN-AIR ROOM INDOORS". Proof /mnt/project-files/dark-garden/ (day, night, pool after).
- OPEN: by night the garden is still night-dim (standard outdoor night 0.62 hemi + moon 0.4 + 4 masts 0.9). The `globe_lamp` prop only has a glow sprite, no real light. Offered to him: make the garden's globe lamps cast real light at night. If he says still dark, ask/check his clock hour and do that (careful: globe_lamp is used in other rooms; a catalogue `light` adds lights indoors too).
- Not seen on real WebGPU (headless = WebGL 2 node renderer). The "game has thrown an error" box from the same message is (thread in the owner project).
- Harness: scratch probe served repo .js over `context.route` one at a time; natatorium + garden load in ~6 min; `window._hqClockHour = () => 23` before `_hqEnter` forces night; teleport past the wall (x beyond half width) triggers the stage crossing. Related [[headless-hq-proof-gotchas-20261108]] [[main-hall-far-walls-20261112]].
