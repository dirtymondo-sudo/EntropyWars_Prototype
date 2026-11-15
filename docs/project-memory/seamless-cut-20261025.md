---
name: seamless-cut-20261025
description: PR #527 (10-25) walk↔fight transition pass — map's own enemies only, no unit lamps in story fights, rig carry, light-count match, quiet compile; flagged calls
metadata:
  type: project
  modified: 2026-10-25T15:05:35.090Z
---
PR #527 merged 2026-10-25 (mondo: "big frame drop transitioning from exploration to battle ... units get ring lights ... ditch encounters spawning multiple new enemies").

- Encounters fight ONLY the struck native + companions walking with it on the map (data.js hqEncounterLaunch). His decision.
- Story field fights: no per-unit lamps (three-post rebuildUnitLights); PvP keeps them.
- Rigs carry walk→fight→walk, rescaled across tile sizes (_rigCarry*, _rigRescale).
- THE SAME LIGHT COUNT: classic WebGL recompiles every lit shader when the point-light COUNT changes; walk pads with the board's dark lights (_lightMatch*). Any new standing PointLight in the battle scene or HQ breaks the match → recompile at the cut.
- THE QUIET COMPILE rev 2 (PR #530): never skips a frame; hides only pieces whose shader is still building.
- InstancedMesh raycast override (cached instance spheres) — field wall-fade rays were ~40% main thread.
- Harness numbers: entry worst frame 10.6→4.7 s, back 3.0→1.1 s (software GL).

mondo picked (10-25 card): other natives on the fight's board do NOT join — keep it as is. Still unanswered flags: lone native fights alone; ENCOUNTER TABLE group range adds no one; walk draws 4 dark point lights.

NO HELD FRAME (PR #530, 10-25): mondo was FURIOUS that a still picture was held over the cut ("should be zero seconds, no freeze ... its the same room!!"). Never hold a snapshot/freeze frame over a transition to hide loading. The strike's snapshot now fades on the fight's first drawn frame; the way back fades the debrief picture on the room's first frame with the walker in it (onFirstFrame), not at READY. Zip ENTROPY_WARS_SYNC_20261025-2229.
Proof: /mnt/project-files/seamless-transition/. Notes: docs/notes/seamless-field-encounter.md "THE SEAMLESS CUT". [[recent-prs-20261021]]
