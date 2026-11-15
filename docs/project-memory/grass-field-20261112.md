---
name: grass-field-20261112
description: THE GRASS FIELD (thick stylised grass) SHIPPED 11-12 PR #1173: his words, what it is, setting, what was and was not checked
metadata:
  type: project
  modified: 2026-11-12T05:00:45.722Z
---
mondo 11-12 linked github.com/fromtheghost/ghibli-grass: "try implementing some more stylistic grass. AAA game like genshin impact". Thread (thread in the owner project). This overrides the 09-29 "no grass blades" rule for this ask only (old sparse tufts `GRASS.enabled:false` stay off). Related [[visual-rules]] [[calm-rollout-20261111]].

- The repo has NO LICENCE (all rights reserved): nothing copied, technique rebuilt.
- MOCK-UP on branch claude/project-thread-4m0cq0 (commit bead7a3, NOT merged, no ?v= bump): three-renderer.js THE GRASS FIELD (`GGRASS`, `_ggBuild`, `_ggMat`, `_ggTick`, node twin `_ewNodeGGrass`), off unless `?grassfield=1` / `window.EW_GRASS_FIELD`. Live retune: `EW_GGRASS` + `EW_GGRASS_REBUILD()`.
- Design: one merged mesh of 5-corner blades on grass squares + the room's own grass past the board edge (terrain rooms whose floor is a grass key; paths, rock, water, walls skipped); root wears the ground's colour, tips lighter, warm/cool patches; rolling gust + flutter in the vertex shader; Lambert with normal up, receives shadows; press map texture (4 texels/square) lays blades down under units.
- Shots /mnt/project-files/ghibli-grass-20261112/ (pair_close, pair_wide, after_move_hud, wind.gif). Seen only on the node renderer's WebGL2 backend, Fairy Forest 12x12. Not seen: real WebGPU, classic WebGL fallback, frame cost, other maps, exploration rooms, online guest.
- LESSONS: (1) blades must NOT write depth and draw last of the solid things (renderOrder 50): then tile highlights, rings, zones lie on top of the grass with no extra code; a lifted highlight plate looked like a glass box. (2) DoubleSide + no depth write gave black blades on the node renderer; fix = FrontSide with every blade wound both ways. (3) Ground albedo as lit on Fairy Forest is about linear (0.12, 0.21, 0.05), far brighter than the calm sheet average x tint. (4) Zoom in the harness: ~14 wheel events of -100 (each is one 0.1 step).
- Left for the build if he says yes: Settings row (Off/Low/High density), fog of war, burnt / dug / liquid / blood squares pressing the grass, colour per floor key (purple grass), exploration rooms, perf numbers on a weak PC.

SECOND LOOK 11-11 11:14 PM his words on the first (thin 5-corner blades, random yaw): "im imagining it being more thick and fluffy. The way it is now just looks gross. You dont have to use that repo". Rebuilt (same branch): each tuft is a 7-corner three-point CLUMP (`_GG_SHAPES.crown`; `tongue` = round pads, read as scales) that turns its face to the camera in the shader (`aGgS` along `_ggRightU`), 24x24 a square, 0.11-0.21 tile tall, 0.07 wide, almost no per-tuft colour jitter, drawn far to near (`_ggFace` counting sort, redone when the camera turns ~10 deg) so near tops cover far feet. ~104k tufts on Fairy Forest with a 5-square meadow round the board. Shots fluffy_*.jpg/gif in the same folder. Waiting on his pick again.
LESSON: thin, randomly turned, high-contrast blades read as scattered leaves ("gross"); he wants thick + soft. Do not go back to the thin look.

SHIPPED 11-12 PR #1173 (?v=20261112-grassfield-01-cors, three-renderer.js 0acea515 + ui.js 0719bfbd live): he tapped "Yes, build the pointed clumps" 11:27 PM. ON BY DEFAULT in battles; Settings > Video > Grass High / Low / Off (`ThreeRenderer.setGrassField`, `ew_grassField`); kill switch `window.EW_NO_GRASS_FIELD`. Full notes: docs/notes/maps-terrain-battle.md "THE GRASS FIELD". Proof /mnt/project-files/ghibli-grass-20261112/final_*.jpg.
- COLOUR LESSON (replaces lesson 3 above): give vertex colours in the sheet's SCREEN values (average of raw sRGB / 255), not linear: the game's materials read sheets that way. Linear matched only in shade and was 2-3x too dark in sun (Stonehenge).
- Tufts climbed Stonehenge's stones until stepped squares (ground range > 0.35 square) and rock squares were skipped.
- Checked on screen: WebGL2 node renderer (Fairy Forest, Stonehenge, Looking-Glass), real WebGPU SwiftShader + classic WebGL (Fairy Forest), fog on. NOT checked: voxel boards, purple grass, online 2-seat, a real weak GPU (overdraw is the risk; Low/Off exist), exploration rooms (not built: battle-only; PvP demo goal first).

CALMER WIND 11-12 PR #1180 (?v=20261112-grasscalm-01-cors, three-renderer.js 42a791f4 live): his words on the first live build "it's maybe a little too wavy" (said in another thread, "i meant the grass"). Only the sway changed: wind 0.45 -> 0.24, sheen 0.30 -> 0.18, new rows gust 0.80 (was 1.25) + flutter 0.05 (was 0.10). Proof sway_before_after.gif (Stonehenge, WebGL2 node). Waiting on his word whether it is calm enough; if still too wavy lower `GGRASS.wind` again, nothing else.
HARNESS LESSON: screenshots take 3-6 s each, so motion proof needs a stopped clock: `EW_DISABLE_GRASS_WIND=true; EW_GRASS_WIND_T=<s>` then step it per shot.
