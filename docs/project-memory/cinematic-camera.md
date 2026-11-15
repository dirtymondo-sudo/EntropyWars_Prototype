---
name: cinematic-camera
description: Cinematic camera mode EWCine (PR #152, 2026-10-06): free fly, photo, video, keyframe paths, map select map shots from R2 Assets/MapShots/
metadata:
  type: project
  modified: 2026-10-06T23:43:39.543Z
---
PR #152 merged 2026-10-06 (token 20261006-cinecam-01-cors). Changed R2 files: three-camera.js, three-renderer.js, map.js, ui.js, match-select.js, styles-base.css, styles-cinematic.css. Zip goes to /mnt/project-files/cinematic-cam/.

- Built in, no Theatre.js (studio is AGPL, stalled, React-heavy). Code is three-camera.js `window.EWCine`. Notes are in docs/notes/ui-menus-audio.md under "THE CINEMATIC CAMERA".
- To open it: CAMERA in either pause menu, or F8.
- Map select background: a site's map shot is `<site>.jpg` (hqSiteId). The game reads this browser's IndexedDB `ew_mapshots` first, then R2 `Assets/MapShots/<site>.jpg?v=token`. mondo produces the shots himself (M in the mode) and uploads them.
- Story cutscenes should reuse `EWCine.play(pathJson, {record, onEnd})`. Path keys are in metres.
- Next ideas (not asked yet): a Theatre-style timeline editor, and auto-capturing every map.
