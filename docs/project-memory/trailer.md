---
name: trailer
description: The game trailer (2026-09-29): where the video and its capture/edit scripts live, and how to recut it
metadata:
  type: project
  modified: 2026-09-29T09:01:10.301Z
---

Trailer v1 delivered 2026-09-29: /mnt/project-files/trailer/ENTROPY_WARS_TRAILER.mp4 (64 s, 1080p30, SILENT; mondo scores it himself, see the no-sound rule in MEMORY.md).
Structure: VHS DOOR ident, the desert door, cards "EVERY CROSSING IS INSPECTED" / "EVERY ENTITY IS FILED" (the foyer seal's own words), HQ + site walkthrough, Holo Sim spell montage, finishers (World Cleave, The Stomp, Segfault, Pyramid Scheme "AS ABOVE / SO BELOW"), end on the title "ENTROPY WARS / AS ABOVE, SO BELOW".

Scripts: /mnt/project-files/trailer/tools/ (rig.js deterministic Playwright capture, hqshots.js HQ camera moves, spellsurvey.js + finals*.json spells/finishers, edl.py the cut, compose.py renders it). Raw frames were NOT kept (732 MB, scratchpad), so a recut means recapturing the clips it needs.
Limits: the R2 bucket was blocked in the sandbox, so champion models, sprites, the DOOR logo and some textures were missing; fighters wore character-creator bodies. A v2 with the bucket allowed would look much closer to the real game.
