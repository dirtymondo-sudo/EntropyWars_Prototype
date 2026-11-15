---
name: dc-interior-polish-20261115
description: Disaster City interior polish pass LIVE PR #1408 (11-15): bake-time interior-polish.js fixes flicker / roof props / clipping for all 99 walk-ins; Zombie in the air fixed PR #1410
metadata:
  type: project
  modified: 2026-11-15T09:11:40.075Z
---
Thread (thread in the owner project) "interior polish" (mondo 11-15: rugs flicker, desks through chairs, zombie floating; 09:07 floating orchestra over the concert hall dome).

- LIVE PR #1408 merged 11-15 ~09:40 UTC, data.js 195b593e, three-renderer.js 8a26e406, token 20261115-inpolish-01-cors.
- `docs/disaster-city/interior-polish.js` runs LAST in `node bake-disaster-city.js` over every hollow texbuilding (DC_NO_POLISH=1 skips, DC_POLISH_LOG=1 lists what is left). District threads need not fix these by hand any more: floor:true on every interior prop, coplanar faces 6 mm apart, rugs over the floor sheet, linings out to 0.33 m, props out of walls / ceilings / each other.
- `docs/disaster-city/measure-props.js` writes prop-sizes.json (model boxes). RERUN after adding models to an interior; an unmeasured key is left alone by the polish.
- Facts: a walk-in draws floor at +0.03, inside walls 0.30 m in from the row edge, ceiling H-0.32. A prop without `floor: true` stands on the wall TOP (roof). Prop `y` < 1 = lift, >= 1 = height (bake adds ground: a district tool must NOT add ground itself; E.js putProp did = orchestra 12 m up).
- `round_table` = Camelot's 5.2 m Round Table (use tulip_table). `school_desk` draws its own blue chair. `instrument_guitar` is 2.66 m at catalogue size.
- Cloud browser: `node playtest_city.js site_prebuilt_downtown_streets '<views>' --flags=EW_HQ_NO_PROP_BATCH` DOES draw GLB props when the CDN cache is warm (shots/.cdn-cache); teleport `y` is added to the level; use fp + `ThreeRenderer.hq.dev.lookAt(x,z,pitch)` in a view's eval (third person camera goes through walls). `ThreeRenderer.hq.dev.residents(race)` reads a resident's state.
- ZOMBIE IN THE AIR FIXED PR #1410 (11-15): a resident given its body while already asleep took its height from _hqNavQuery at the bed = top of the bed's ghost block / wall (39 of 55 beds); the Zombie sleeps 8:00 to 18:00 so it always showed. Now hqTerrainHeight at the bed. Not seen on screen: headless a resident's model stays `loading` forever. Waits mondo's Mac look. Related [[disaster-city-residents-20261114]].
