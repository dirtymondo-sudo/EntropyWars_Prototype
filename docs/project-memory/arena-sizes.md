---
name: arena-sizes
description: PvP arena board sizes 9/10/11/12 and 5v5 (PR #255, 2026-10-17): layout, where picks live, which sites lack sizes
metadata:
  type: project
  modified: 2026-10-17T09:00:17.339Z
---

PR #255 (2026-10-17, mondo's ask): every arena site with a 12×12 also has 9×9, 10×10, 11×11 cuts of its own room.
- 9 and 11 = 5v5: 2×3 spawn zone per team, Cube on back-middle tile, 5 units on the rest, 3×3 middle nexus. 10 and 12 = 4v4 (old layout).
- data.js HQ_ARENA_RULES.picks9/10/11, baked by `node bake-arenas.js --size N` (caps scaled from 12×12 by area). Board ids `<site>_<S>x<S>_delta`; the 12 keeps `<site>_delta`. Layout carried on PREBUILT_MAPS entry `.house`, read by map.js `_arenaHouse()`.
- No fit (left out, not loosened): Heaven 10+11; Olympus, Fairy Forest, Agartha, Haunted House 11. Göbekli Tepe + Looking-Glass stay 12 only.
- Pickers: Squad Desk 4v4/5v5 switch (localStorage ew_sq_team), match terminal BOARD SIZE chips, friendly room BOARD SIZE dropdown. Server pool/queue keyed by team size (Quick Play 5v5 needs two 5v5 queuers).
- Browser probe that works in the sandbox: route cdn.jsdelivr.net to npm-installed copies (jsdelivr + cdn.socket.io are policy-blocked); in the "Choose 4 to Deploy" picker click [data-sq-pick-go].
- Offered mondo: Cube on front-middle instead of back-middle; no answer yet.
