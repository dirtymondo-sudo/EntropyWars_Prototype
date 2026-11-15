---
name: disaster-city-shared-pieces-20261113
description: Disaster City shared pieces thread (11-13): city swing doors on hollow texbuildings, pack shop block true-size rule, front rule, twelve city_* whole pack buildings, pack claims list
metadata:
  type: project
  modified: 2026-11-13T17:06:09.309Z
---
Thread (thread in the owner project) "Build shared city doors and shop scale" (spawned by mistake as a tenth "D.O.O.R. Headquarters district": the city has only nine districts; that label is the hub name in the HUD strip). It serves the nine district threads of mondo's 11-13 16:41 ask (architect every building; working swing doors; shop blocks too small; pizza + gas station packs).

- PR #1264 (live): three-renderer.js `_hqBuildTexDoors` / `_hqTickCityDoors`: every `texbuilding` with `hollow: true` hangs a swinging catalogue leaf (row `leaf`, `leafDouble`, `leaf:'none'`; default `leaf_lobby_glass_double`); kill switch `EW_NO_CITY_DOORS`. bake-disaster-city.js: a row's `w` runs along its FRONT (east/west buildings stood a quarter turn off), `packFit()` keeps pack shop blocks at 0.9 to 1.15 of true size (a block's row `w` IS its scale).
- PR #1266 (live): twelve catalogue props `city_*` (pizzeria, diner, burgerpiz, 6twelve, laundry, vhs_shop, house, quequis_house, gas_store, gas_canopy, gas_sign, taco_stand), real size, entrance +Z, R2 `Assets/world/packs/elbolilloduro/ebd_<scene>_city_*.glb`, cut by bake-pack-pieces.py `city_*` jobs (pip bpy + apt unrar work in the cloud; packs in /mnt/project-files/asset-packs/elbolilloduro/).
- Claims (one district per building): docs/disaster-city/pack-claims.md. Uncut + free: Pizzeria scene's 21 and Tacos scene's 27 small photo-front buildings.
- NOT SEEN ON SCREEN: the auto-mode classifier refused the headless browser run (CLAUDE.md RULE #1c, no playtest unless mondo asks). Door + shop scale + props are checked by reading, node --check and Blender renders only. If mondo asks for a playtest, prove the door swing first.
- Preview: /mnt/project-files/disaster-city-shared/pack_buildings_cut.jpg. Notes: docs/notes/areas-complexes.md "DISASTER CITY, THE SHARED PIECES".
Related [[disaster-city-144-20261113]]
- PR #1274 (main): THE ONE DISTRICT HOOK. bake-disaster-city.js loads docs/disaster-city/districts/<LETTER>.js (R C F U H E I S B); exports tailor(PLAN, plotOf) / apply(ctx) / build(ctx); never put district code in the shared tool. Spec in docs/disaster-city/pack-claims.md. Gold rule: [[gold-rule-city-20261113]].
- PR #1296: arch row over a roof-walk plateau stands on the ground (data.js `archGround`). PR #1298 THE BIG WINDOWS (mondo 18:49: urban window sheets too small; bottom row never windows): texbuilding skin + arch rows repeat a window sheet once per 3.5 m storey, ground storey gets a base (`HQ_TEXB.bigWin`, part `keyBase`, `win:'keep'`). Shipped unseen on screen. Notes areas-complexes.md "THE BIG WINDOWS".
- DARK GLASS APPROVED (mondo 11-13 19:02, Financial thread): he likes the near-black urban GlassWindow sheets on glass towers / offices; use where it fits in any district, never lighten with gain/glow. Hotel (Financial) gets an interior as an exception.
- PR #1343 + #1346: stadium_downtown road link moved onto the P03-00 road dead end (its "BOWL / STADIUM" sign showed inside the boxing gym); trees within 2.5 m of a walk-in building are MOVED to the nearest clear yard square by the bake (first shipped as a drop: the coordinator sent it back, never delete content mondo did not name).
