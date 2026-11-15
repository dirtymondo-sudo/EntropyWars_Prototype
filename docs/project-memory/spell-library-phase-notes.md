---
name: spell-library-phase-notes
description: Per-phase engine and test details of the spell library build (Phases 0-5): key functions, normalisers, test pins, deviations, CI lesson
metadata:
  type: project
  modified: 2026-09-26T05:34:21.483Z
---
Detail for the phases indexed in [[spell-library-plan]] (zip numbers, cache tokens, §7 defaults live there).

Phase 0 (THE SCHEMA): explicit numeric `tier` on every row; `stampSpellSchema()` runs before EWSpellMods clones and after every apply(); `role` / `families` / `upgrades`; import MERGES by default; online guard setOnline().

Phase 1 (THE SHELL): the "SPELL LIBRARY v2" block in ui.js; the DOM-free `/* SLB2 PURE BEGIN */` block is sliced by spell-library-ui.test.js; every edit goes `_slbSetField` → `_slb2WriteField` → `_slb2AfterEdit`. Probe playtest_library.js needs `npm start` + `--no-save playwright react@18 react-dom@18 three@0.128.0`.

Phase 2 (THE GRID + THE LOOK): `aoeMask` read first at every footprint site; writing a mask SETS the kind's radius field (deviation from §5.4). LOOK picks `animVerb` / `animSlot` / `animClip` / `animStrikeMs`. Tests aoe-mask, spell-anim-pick. Source-pin hazard: several tests slice battle.js regions (extend their sandboxes when helpers move).

Phase 3 (THE TARGETING): `randomTargets` / `splash` riders on `kind: 'damage'` rows only. data.js normalisers `spellRandomTargetsOf` / `spellSplashOf` / `splashOffsets` / `pickRandomTargets`. battle.js `_kindMeta` → selfCast+offensive; pool = `_getSpellValidTargets` of `_riderBaseDef` (row minus rider); host draws with engineRng; `_applySplashDamage` is unit-only (deviation: not `_applyAoeDamage`, which chips turrets/doors/buildings). Guest sees extra shots + ring via the `'rider-fx'` relay. Examples `riderScatterShot` / `riderImpactRound` live in SPELL_BY_ID only (off every pool). Test spell-riders.test.js.

Phase 4 (THE PASSIVES + GEAR MERGE): passive rows kind 'passive' take a slot + tier SP, max 2 (verdict reason 'passives', treeLegalSubset skips the 3rd). 16 GEAR_PASSIVES rows (gearBinoculars…, family gear, universal pool part `gear`); createUnit moves passive rows to unit.passiveRows (ids); unit.equipment is only a display mirror. Hooks catalogue PASSIVE_HOOK_KEYS; weather/terrain/zodiac bonus are stat stages in getStatStageCount. unitHasGear must never go through getUnitPassives (canFly → unitHasJetpack recursion). Old saves: gearMigrateIds. Test family-passives.test.js.

Phase 5 (THE UPGRADES): SPELL_UPGRADES seeded (14 rows); an EMPTY row list = AUTO (every `auto` upgrade that fits via `requires`/roles/families; `upgradesAuto:false` = none) — deviation from §4.4. meta.spellUpgrades {spellId:[ids]}; repair treeLegalUpgrades (online.js receipt + map.js createUnit); derived defs via resolveSpellDef in unit.spells; riders ricochetRider / extraTargets in battle.js _applyUpgradeRiders. Test spell-upgrades.test.js. CI on mondo's Phase 5 commit went red because spell-riders.test.js pinned the splash line as directly followed by `// Post-effects`; the fix (repo-only, thread "Spell library, Phase 5 upgrades", 2026-09-26) lets lines sit in between. Lesson: source-pin tests must not assert adjacency of battle.js lines that later phases will insert between; each phase should run the whole suite after its last edit.
