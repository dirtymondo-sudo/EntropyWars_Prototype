---
name: skate-invisible-walls-20261115
description: Skateboard-only "invisible walls" at props (Main Hall globe lamps, 11-15) = board dead-stops on any collider touch + overhead parts blocked at full body width; fixed PR #1443
metadata:
  type: project
  modified: 2026-11-15T15:02:07.100Z
---
Thread (thread in the owner project). mondo 11-15: props block him on the board but not on foot (globe lamps, DOOR HQ Main Hall). LIVE PR #1443 (three-renderer.js febc0a68, token 20261115-wayround-01-cors). NOT seen in a browser (RULE #1c); waits his Mac check.

- Cause: board and walker read the SAME colliders (`_hqSurface`). Walker slides round an edge; the board stopped dead (`_hqRideWall`), and `_hqRideObstacleSlide` skips mesh-collider props (`b.mc`). Plus the lamp's globe (r 0.2 m at 1.5-1.9 m, 1 cm pole) was solid at full body disc down to the floor.
- Fix: THE THIN BODY (`_mcBodySolid`, HQ_MC.shoulder 1.3 / headR 0.14: over the shoulders only the head's width blocks) + THE WAY ROUND (in `_hqTickRide`: a blocked step tries the step turned up to ~70° either side). Game-wide.
- **How to apply:** if he says the board still sticks, tune the angles / the 30% trigger in THE WAY ROUND; if bodies clip overhead parts, raise headR. Notes: docs/notes/door-gun-skate-vehicles.md "THE WAY ROUND + THE THIN BODY".
Related [[disaster-city-phantom-walls-20261113]]
