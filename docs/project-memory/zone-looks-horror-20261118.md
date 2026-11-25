---
name: zone-looks-horror-20261118
description: mondo 11-18 retexture of every zone except Disaster City with SBS Horror + Urban Decay packs; the ZONE_LOOKS system in data.js, batch status
metadata:
  type: project
  modified: 2026-11-18T03:51:39.556Z
---
mondo 11-18 ((thread in the owner project)): "use this horror pack and the urban decay texture pack to improve the aesthetics of the game, zone by zone. I especially want the "calm" textures replaced, those textures were only meant to be used on the ground" (and not even on ground where the area calls for better); use blood splatters/stains as detail; Disaster City skipped (had its urban pass).

- PACK: SBS Horror Texture Pack (Screaming Brain Studios, CC0), R2 dirtymondo inbox/SBS Horror Texture Pack/ (left in inbox), copy /mnt/project-files/asset-packs/sbs-horror/. 98 sheets 128px (Brick/Floor/Metal/Misc/Stone/Wall x14-15) + 15 RGBA stains (01-03 blood, 04-05 dirt, 06-09 grime, 10-14 drips, 15 soot). Live on R2 ewmusicsfx `Assets/world/terrain/horror/Horror_<Fam>_<nn>.png` (uploaded 11-18).
- SYSTEM (data.js after CALM_TERRAIN): `ZONE_LOOKS.zones.<zone> = { rooms, wall:{key:sheet}, ground:{key:sheet}, decals:{blood,dirt,grime,drip rates} }`; sheet = 'hz:Brick_09' | 'urban:Name' | 'px:gold'. `zoneLooksApply()` at end of data.js renames keys to twins `zl_<sheet>__<key>` (registered in CALM_TERRAIN.sheets, rule = old key via hqRuleKeyOf) so gameplay unchanged; no bake tool/district file touched. Horror keys `hz_<fam>_<nn>` in editor picker (HORROR group). Decals: `zoneLookDecals` -> three-renderer `_hqBuildMarks` k:'decal' (drips on wall rows + standing arch boxes, pools at the foot). Off: EW_NO_ZONE_LOOKS / EW_NO_ZONE_DECALS.
- Lesson: urban WoodGeneric (bark-like, mondo hates as planks) is the building-wall sheet in Western Town, Woods, Lodge, Shasta, North Pole, Estate: swap to WoodCladding/WoodBeams.
- Batches: 1 Camelot/Estate/Sewers #2084; 2 Woods/Desert/Beach+Dutchman/Mountains+NP/Olympus #2089; 3 Cavern/DUMB/Leylines/Deep #2100; 4 Heaven/Hell/Catacombs/Vatican #2103; 5 Space/Astral/Antarctica/Internet/routes (`routes` zone lists every site_ow_*; add new route rooms by hand) + Hell floor blood #2114; 6 DOOR HQ calm sheets only (his terrazzo/oxblood/teal/ceiling/wallpaper kept) #2116. ALL ZONES BUT DISASTER CITY DONE 11-18 ((thread in the owner project)).
- `floorDecals: {blood,soot,dirt}` per 1000 m2 on painted ground (mondo said yes for Hell). Pass also swaps terrain.gen.wallKey/fenceKey. Stains need terrain rows (HQ shell rooms get none). Scatter keys are rock MODELS, never map. Stone huts read best on horror Brick blocks; plaza flagstone kept; hedges stay calm_hedge.
- Probe: one browser at a time (OOM), --flags=EW_HQ_NO_ENCOUNTER.
