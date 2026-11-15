---
name: spaceship-gunship-20261111
description: Spaceship battle map redone as a lengthwise gunship (PR #1144, 11-11), spawns at bow/stern per mondo; void-room bake rules learnt; green sky = his own fog preset
metadata:
  type: project
  modified: 2026-11-11T23:23:03.690Z
---
mondo 11-11: "redesign the spaceship ... looks nothing like a spaceship ... strategic PVP"; after the first plan (spawns on the wings) he said "why not put the spawn zones at either end of the ship ... it makes the map 1 dimensional". Thread (thread in the owner project).

SHIPPED PR #1144 (?v=20261111-gunship-01-cors, data.js ab6f0ac5 + three-renderer.js cddc202f live): HQ_AREA_SPECS.prebuilt_derelict = compact gunship, bow north. The board is mirrored both ways: spine with spawn decks at the ends and the hatch, sponsons/housings one level up, a pylon past each 2x2 well, gun decks, a 2x2 wing gun two levels up, steel companionways, dishes as cover. Off the board: bridge + canopy, engine block + 5 bells, wings + nacelles. _hqBuildStarship gained bow:'n', canopy, guns, ledges. Proof shots /mnt/project-files/spaceship-redesign-20261111/.

REJECTED 11-11 23:32: "still just looks like a floating rectangle"; he wants it cylindrical, not flat, ramps + stairs, verticality, a real ship outline. Redesign moved to a Fable 5.2 thread (thread in the owner project). Hand-off with bake rules + tools: /mnt/project-files/spaceship-redesign-20261111/HANDOFF.md. Never show him shots with the board fog cleared.

Rules learnt on void deck rooms (bake-arenas judge):
- A 1-square void between plates reads as DECK (hqDeckPlan proud 0.7 m + raster sub 3 / cover 5). Voids need to be 2 squares across, or open to the edge.
- A 2-level drop beside a deck square makes that square rock: keep L2 inside L1.
- The judge's reach is the WALKER's (climbM 1.46 m). Ledge regions need a 3-square ramp in the window or they count against wallMax (12 is at 48 = cap now).

The green space behind every void map is HIS shipped fog preset (index.html SHIPPED-KEYS ew_retro preset "green", fog on, ew_scene_looks "off"), not the map. Never override it. Room looks don't reach him (Map Looks off).

HEADING FIX 11-12 (PR #1169, (thread in the owner project): mondo "the spaceship is flying sideways". Cause: bow turned north in #1144 but prebuilt_derelict env.motion stayed axis 'x'. Now axis 'z', dir -1 (dir applies to linear streams; default 1). Dust streaks rotate onto the z axis on screen. Not looked at: walk on the deck, online, WebGPU, his Mac. A hull whose bow is turned again must turn env.motion with it.
