---
name: ladder-wedges-20261113
description: Steel fire escape landings replaced the 25 slanted terrain lumps beside ladders, LIVE PR #1313 11-13; the `landing` terrain row, where, what is unseen
metadata:
  type: project
  modified: 2026-11-13T20:17:27.125Z
---
Thread (thread in the owner project) "Make ladders climbable without ramps". mondo 11-13 19:41: wherever there are ladders there is a raised slanted terrain piece that looks wrong, can be jumped onto, is easy to fall off; he wants to climb the ladder and stand on the platform. He picked "Steel platform you stand on" on the card (19:56).

- LIVE PR #1313 (token 20261113-ladders-01-cors; data.js 6cd16699, three-renderer.js 91e8c7cb). Thread left open for his look.
- What the lump was: the fire escape's halfway LANDING, a terrain `plateau` 1.6 x 2.2 m. Only in city rooms: `site_prebuilt_downtown_streets` 18 (bake-disaster-city.js `escapeAt` loop), `site_prebuilt_cyberpunk_streets` 5 (now 4 rows), `site_prebuilt_downtown_oldstreets` 2. The other 31 ladder rooms climb straight onto real tiers.
- New terrain row `{ k: 'landing', x, z, w, d, h | y, back, gaps? }` (data.js `hqTerrainLandings`): hidden bridge slab + hung ghost walls as rails; ladders take its height. Drawn in three-renderer.js `_hqBuildClimbs`. Notes: docs/notes/areas-complexes.md "THE STEEL LANDING". Any new fire escape should use this row, never a small plateau.
- Tapes: none sat on a lump; tapes and their flags are identical before/after (checked offline in node).
- NOT SEEN ON SCREEN: the browser render was refused (RULE #1c). He owes a look at the platform's look, the rails, climbing both ladders.
- Known, not fixed: Disaster City P01-08-B1 became a walk-in, so its fire escape (landing 0) is a balcony with one ladder and no roof behind it (closed on all sides).
- After merging main in Disaster City always rerun `node bake-disaster-city.js` ([[disaster-city-vertical-20261113]]).
