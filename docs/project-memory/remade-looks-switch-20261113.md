---
name: remade-looks-switch-20261113
description: 11-13 PR #1320: Settings > Developer > Remade Race Looks switch (localStorage ew_remade_looks, off by default) makes every unit with no own look wear its race's remade look
metadata:
  type: project
---
Thread (thread in the owner project). mondo 11-13 20:22Z: "a dev option in the settings to use all of these new race looks, saves to where i dont have to retoggle it on reloading the page, but off by default for now".

- LIVE PR #1320: Settings > Developer > Remade Race Looks ON/OFF. sprites.js `remadeLooksOn()` / `setRemadeLooksOn()`, hooked in `getCharacterAppearanceModel` (the one resolver for every drawn unit). Slot's own saved look + USE ORIGINAL MODEL still win; races with no remade look keep Meshy; cast members (cutscene cast) untouched. Viewer-local, not relayed online.
- `?likeness=1` is NOT this: it is the face-likeness picks switch in the creator (ew_likeness).
- Seen on screen in the creator viewer (off / on / on after reload): /mnt/project-files/remade-looks-switch/remade_looks_switch_proof.jpg. NOT seen: battle board with models drawn (only the resolver checked). Notes: docs/notes/character-creator.md "THE REMADE LOOKS SWITCH".
- When he later says "make the remade looks the default": flip the default in `remadeLooksOn()` (related [[meshy-remake-plan-20261112]]).
- 20:45Z his report "Giant just a white naked body in the party builder, face right": `ewm_t2giant_outfit.glb` was 404 on the CDN (repo had it). Uploaded with `sync-zip.js --put`, live. Checker for this fault: resolve every RACE_REMADE_LOOKS asset URL (getCharacterAppearanceAssets) and curl each; all other 267 were 200. Open, told batch 1 thread: fortune teller F look names `ewm_t2fortunetellerf_hat` which has no wear row / GLB (dropped by normalize). LESSON: a bare body on a remade look = check the outfit GLB on the CDN first.
