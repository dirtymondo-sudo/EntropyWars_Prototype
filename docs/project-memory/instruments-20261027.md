---
name: instruments-20261027
description: Instruments pack (PR #591, 10-27) — mondo's Assets/instruments GLBs: pose prep, editor group, 41 room props, spell/finisher looks, calls flagged
metadata:
  type: project
  modified: 2026-10-27T06:39:57.993Z
---
INSTRUMENTS (PR #591, 2026-10-27; mondo: "Harp for the angels, guitar and tambourine for the hippies, maybe some violin for requiem...
Maximize the use... spells and exploration areas as props. Add them to the editor"). R2 Assets/instruments/ GuitarV1, MaracasV1,
TamburinV1 (+ .fbx unused) and orchestral/ Cello, Cello_bow, Drum, Harp, SeedPod, Violin, Violin_bow, Whistle (.glb).
NO mic, trumpet, piano or horn in the upload (Mic Drop / Last Trumpet / Things That Go Bump still missing; MISSING_MODELS.md).
- three-renderer.js _instrPrep: orchestral files carry showroom node transforms; cleared + per-file pose (upright, face +Z). MUST run
  in both _loadMiscModel and the spells' _oneFileGltf before _ew_bbox (bug: spell warm loaded first → drum sunk, `lay` ignored).
- data.js HQ_CATALOGUE_INSTRUMENTS 15 rows (group "Instruments", foot 0), 41 props in 13 rooms (comments "THE INSTRUMENTS").
- three-vfx-effects.js "THE INSTRUMENTS": _insStage on _fireStage beats (guest-relayed), race-wide angel harp / hippie guitar+tambourine
  / shaman drum+seed pod on EVERY cast, 15 spells + 4 finishers. Bands sit beside/behind bodies (never over unit or numbers).
  Kill-switch EW_NO_INSTRUMENTS.
- Calls flagged to mondo: instruments float beside the caster (not held in hands); race-wide looks on every cast; Last Dance band
  stops at the burst; prop spots. Proof shots /mnt/project-files/instruments-proof/ (SHEET_rooms.jpg, SHEET_spells.jpg).
- Harness gotchas: `pkill -f <name>` from a bash whose command line contains <name> kills itself; ph editor needs "› ENTER ‹"
  click after reload; spell-vfx-audit sv-run works without its setup.sh (run balance weak-races setup + copy harness to /tmp/sv).
