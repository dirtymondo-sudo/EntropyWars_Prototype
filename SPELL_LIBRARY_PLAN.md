# THE SPELL LIBRARY — the editor as an engine: families, upgrades, passives, the grid, the clips

*Plan document, 2026-09-25. Nothing built. Written from a read-only survey of the 2026-09-25 clone
(the clone carried `bugfix/ENTROPY_WARS_BATTLE_FIXES_2.zip`, token `20260925-bugfix-02-cors`; line
numbers below are that clone's — grep the names, they move). The models for this document's shape are
CAPTURE_PLAN.md and DOOR_GUN_PLAN.md. Read champions-combat.md "THE SPELL TIERS" (the root copy of that
notes file carries the section; the docs/notes copy is older), ui-menus-audio.md "THE TIER RACK" and
"THE LOOK PASS on the tier rack", docs/notes/spells-vfx.md 1073–1186 (the clips), SPELL_DIRECTOR_PLAN.md
Phase 8, and PLAYTEST_NOTES.md 1693+ / 9696+ (the v1 library and the Lab v2 timeline) first.
Implementation threads: each phase in §9 is one delivery; append to §11 when you ship one.*

**The user's ask, in one line:** turn the Spell Library into the place where spells, passives, families
and upgrades are CREATED, EDITED, SORTED, PREVIEWED, ANNOTATED and EXPORTED — so that redesigning the
535 spells into families with modular upgrades is done in a good-looking tool, not in chat, and a later
thread reads one export instead of a conversation.

---

## 0. The verdict — what this rework is, in one paragraph

The library already exists (Settings → Developer → Spell Library, ui.js 9044–10941, ~1,900 lines) and
already does the hard part right: every edit is a sparse diff over the shipped `data.js` tables
(`EWSpellMods`, data.js 18851–19300), applied live, pruned at boot when data.js catches up, exported as
one JSON. What it lacks is the CURRENT GAME (it thinks tiers are `I/II/III` shop prices and knows nothing
of SP, the type wheel's combat elements, passives, roles or families), a WAY TO SEE (no AOE grid, no clip
picker, no preview beyond the Lab), and a SHAPE FOR THE REDESIGN (no tags, no upgrade registry, no
passive rows, no notes). So the plan is: **keep the diff layer and the Spell Lab, rebuild the screen on
top of them, and add five things to the data model** — an explicit `tier`, `families` tags, a `role`
(damage / damage+effect / effect / heal / utility / …), an `aoeMask`, and `notes` — plus three new
registries — `SPELL_FAMILIES`, `SPELL_UPGRADES`, and family PASSIVES that are spell-shaped rows. The
engine work is deliberately small: upgrades resolve to a DERIVED SPELL DEF per unit (`dmg × 1.15` is a
field patch the engine already reads), masks are honoured in the two footprint functions everything else
already calls, and the two new targetings (random, adjacent splash) are RIDERS on the `damage` kind like
`chainProfile` is today. Families-as-pools (every unit picks from 3–5 families, one unique) is the LAST
phase, because it needs the catalogue the user will write in this tool.

---

## 1. The rules, in one page

- **THE LIBRARY is a dev tool** (Settings → Developer). Nothing it does is a player shortcut; what it
  EXPORTS is what a thread bakes into data.js (§4.9, the bake tool). Families, upgrades and family
  passives ARE player-facing once baked and play in full (the user's rule: no dev shortcuts reach
  players).
- **One table for everything a unit can equip**: spells AND family passives are rows in `SPELL_BY_ID`
  with a `kind` (a passive's kind is `'passive'`), a numeric `tier` 1–4 (= its SP, `SPELL_TIER_SP`), a
  `role`, `families` tags, `upgrades` (its allowed upgrade ids), `notes`. The rack (7 slots / 16 SP)
  does not change; a passive row simply occupies a slot.
- **Two kinds of passive**: INHERENT (`PASSIVE_DEFS` + `RACE_PASSIVES`, today's 29 — never a slot,
  never SP, fixed per race) and FAMILY passives (new rows, equipped in a slot, cost their tier in SP,
  live in a family's pool). Both are read through the SAME hook keys (`unitPassiveValue(unit, key)`,
  data.js 3353): `getUnitPassives(unit)` returns race passives + equipped passive rows. That is the whole
  engine trick — every existing hook key works on day one. **THE PASSIVE CAP (the user, 2026-09-25): at
  most 2 of the 7 slots hold passive / equipment rows** (`PASSIVE_SLOT_MAX = 2`; the verdict reason
  `passives`). **THE GEAR POOL (the user, 2026-09-25): today's 17 accessories are UNIVERSAL** — a GEAR
  family every unit's pool carries — while new passives / equipment may belong to specific families.
- **Tiers and costs are the user's to set**: `tier` (= SP) is an explicit number on every row, MP is
  editable (pinned with `manaCostOverride`, the ladder shown as a ghost), AP and cooldown too.
- **Upgrades never change a spell's identity**. An upgrade is a registry row with an SP price and a PATCH
  (`{ dmgMult: 1.15 }`, `{ costDelta: -10 }`, `{ pushDistance: +1 }`, `{ aoe: { preset: 'x' } }`,
  `{ ricochet: … }`, `{ extraTargets: 1, extraTargetsMult: 0.5 }`, `{ statusBonus: … }`,
  `{ deployCapDelta: +1 }`, `{ turret: { dmgMult, hpMult, rangeDelta } }`); a spell lists WHICH upgrades
  it allows; an equipped spell's SP = tier + Σ upgrade SP; the engine sees ONE derived def per unit.
- **Three roles for damage**: `damage` (only), `damageEffect` (less damage + a status/stat effect),
  `effect` (no damage). THE TIER RULE: a `damageEffect` spell with `dmg ≥ 120` must be tier III or IV.
  The editor LINTS it (a red rule badge + a REPORT row) and never auto-fixes. `bonusVsStatus` (the combo
  finisher) is NOT an effect — a damage-only spell may carry it.
- **Families are tags**, not a tree: a spell or passive carries `families: ['fire', 'ordnance']`; a
  family is a `SPELL_FAMILIES` row (name, colour, glyph, `unique: '<race>'` for a character's own). A
  unit's kit (later, §9 Phase 7) is the union of its 3–5 families; until then families are a filter.
- **Every spell attribute is editable** and every attribute is a column: sort and filter by anything
  (damage, role, kind, AOE, element, status, status bonus, tier/SP, MP, AP, range, family, owner, …).
- **The AOE is a picture**: a 7×7 grid editor with presets (single, 3×3, 5×5, diamond 1/2, X, cross 1/2,
  ring, line) and free drawing; a drawn shape is an `aoeMask` (offset list) that the engine, the AI, the
  hover preview, the card tiles and the auto-description all honour.
- **The animation is a dropdown** of the 75 playable SLOTS (grouped by family of motion, with the clip
  name, library, played length, strike time) + the 69 unwired raw clips behind a "RAW CLIP" group, each
  previewed LIVE on the selected race in the editor's viewer stage (`EWCharViewer`, one new
  `playClip(name, lib)` helper); the pick is a def field (`animVerb` / `animSlot`) the classifier reads
  first.
- **Notes ride the export**: `notes` on any row (free text, markdown) and a library-wide `notes`; the
  export carries both plus a human summary.
- **Online**: the host is authoritative and upgrades / passive rows are validated exactly like
  `treeLegalSubset` today; local mods are OFF in an online match (§7 Q11) until baked.

---

## 2. Where it stands today (the survey)

### 2.1 The existing editor (ui.js 9044–10941, index.html 787–796, styles-hud.css 4735–5120, map.js 6801 / 7811)

Two tabs, SPELLS and MOVEPOOLS. Toolbar: search + nine selects (source, type, kind, faction, element,
job, race, sort) + NEW SPELL. A 320 px flat list rail (name, NEW / DEL / ● flags, type / kind / element
badges, ⚔ ✚ ✦ ↔ stats). A detail pane: header verbs (▶ LAB, ⧉ DUPLICATE, ↺ REVERT, ✕ DELETE), LIVES IN
+ JOBS / RACES chips, a flat field grid over `_SLB_FIELD_HELP` (~150 typed keys, ui.js 9083–9210), "+
add field…", the status-chip editor, RAW JSON. Action bar: EDITS ON/OFF, EXPORT JSON, COPY SUMMARY,
IMPORT (replaces the doc), CLEAR APPLIED (prune), DISCARD ALL, OPEN SPELL LAB. The SPELL LAB (ui.js
10086–10576) boots a real 8×8 match, caster vs dummy, casts through `GAME.doSpell`, with pickers
(spell, caster race, job, dummy, distance), LIVE VFX FIELDS (element, projectile, archetype, weight,
travel), and the TIMELINE (10578–10941): SFX / VFX cue tracks on the cast / launch / impact beats,
stored as `sfxCues` / `vfxCues` on the def.

Stale or missing: `_SLB_TIERS = ['I','II','III']` labelled as Hazard Pay prices (tier IV exists and SP
is never shown); no passives; no equipment beyond dead `equipCost` / `equipReq`; AOE only as raw
number fields; no clip picker (the "travel" dropdown is a VFX travel type, not a body clip); `doc.notes`
exists in the schema with no UI; no tags. UX debt the rebuild must not inherit: the whole pane
re-renders through `innerHTML` on every edit (focus and scroll lost), raw internal field names as
labels, help on hover only, one wrapping line of nine selects, a flat unsorted-by-anything-useful
list, destructive import, no undo beyond per-field revert, inline `onclick` string handlers.

### 2.2 The data (data.js)

- **535 rows** in `SPELL_BY_ID` (5905): 59 job/library spells (`SPELL_LIBRARY` 4598), 465 race
  abilities (`RACE_ABILITIES` 6244, 103 races, 575 entries — 34 ids are SHARED kits used by several
  races: `sharedFissure` ×11, `raceWingGust` ×10, `rampart` ×6), 7 door-wheel rows (`DOOR_GUN_SPELLS`
  9077, never borrowable). 506 are reachable in some unit's pool; 29 lib spells sit on no tree.
- **208 def fields** in use (the census script's `field-usage.txt`). `kind` (70 values) is the
  behaviour selector; `type` (damage 302 / utility 90 / buff 74 / debuff 48 / heal 21) the coarse AI +
  UI category; `spellType` the six-faction wheel (`TYPE_CHART` 152); `element` one of 15
  `SPELL_ELEMENTS` (425), of which six are COMBAT elements (`COMBAT_ELEMENTS` 428, the affinity layer
  `RACE_ELEMENT_AFFINITY` 484) and nine are flavour + filters — 338 spells are tagged, 197 are not.
- **Tier is DERIVED, not stored**: `spellTierOf(id)` (18141) = the spell's lowest rung on any
  `CLASS_SPELL_LEARN_ORDER` (17478) / `RACE_TREE` (17545) row + 1; off-row spells fall back to the MP
  ladder. The `tier` STRING field on 177 spells is legacy and disagrees with the live tier on 30+
  (`rampart` 'III' → 4, `radiantBolt` 'II' → 1). MP is forced to the ring price 25/50/75/100
  (`applyTreeRingCosts` 17750) so SP and MP always agree. Tier counts: I 147, II 145, III 123, IV 120.
- **Costs**: `cost` MP (always 25/50/75/100 after boot), `apCost` (1 or 2), `cooldownRounds` (65
  spells), `SPELL_SP_MAX = 16` (18131), `SPELL_SLOT_MAX = 7` (17196), `spellSpCost` = tier (18156).
- **Roles, as the data stands**: damage only 166, damage + status/stat 143, status/stat only 119, heal
  27, utility type 90, AOE (any area field or kind) 175. Damage + status by tier: I 49, II 21, III 30,
  IV 43. Under THE TIER RULE (`dmg ≥ 120`), **7** offenders sit at tier I/II today: `raceTremorStomp`
  (125, T1, stagger), `raceStompOut` (120, T1, grievous), `raceFrenzy` (120, T1, grievous),
  `raceShadowInfiltration` (120, T2, poison), `raceInfernalDecree` (130, T2, burn), `raceApexCharge`
  (130, T2, stagger), `sentaiBlueWave` (120, T2, slow). The other 63 low-tier damage+status rows hit
  40–110.
- **Status**: 63 `STATUS_DEFS` (9870–11051), durations live on the spell (`statusEffects[i].duration`
  1/2/3/5), `bonusVsStatus: { status, mult }` on 84 spells is the combo finisher (battle.js
  `applyDamageToUnit` 30486–30507, ×1.5, ailment not consumed). The MP formula prices statuses through
  `_MF_*` tables (9311–9327) and counts `bonusVsStatus` at half weight.
- **Passives**: `PASSIVE_DEFS` 3134 (29 rows: id, icon, name, desc + HOOK KEYS — `immuneStatus`,
  `lowHpBonus`, `spellCostMult`, `rangeBonus`, `contactStatus`, `trailTerrain`, `healMult`, …),
  `RACE_PASSIVES` 3298 (28 races, ≤ 2 each, `MAX_UNIT_PASSIVES = 2`, `flying` auto-first for sky races),
  read by key through `getUnitPassives` 3332 / `unitPassiveValue` 3353 / `unitPassiveBlocksStatus`
  3361. `JOB_PASSIVES` 4537 (13 jobs) are desc-only; their effects are 25 hard-coded `unit.cls === …`
  checks in battle.js. No passive takes a slot or SP.
- **Equipment**: `EQUIP_DEFS` 127–146, 17 accessories over two `accessory` slots (`EQUIPMENT_SLOTS`
  125); 9 are stat sticks (`computeEquipBonuses` 4013), 8 are hard-coded by id
  (`unitHasAccessory(unit, id)`, map.js 12155; e.g. `martyrs_talisman` battle.js 31055,
  `chrono_locket` 8216, `purity_censer` 7621). No shop (`SHOP_PRICES = {}`); `spelunking_gear` has no
  code reference at all. The consumables (`ITEM_RULES` 4242) are a separate system and stay.
- **VFX / anim on the def**: `projectileOverride` (22), `vfxWeight` (1), `impactSfx` (1), `travelMs`
  (1). `castAnim` / `animVerb` / `animSlot` / `vfxArchetype` / `sfxCues` / `vfxCues`: **0 of 535** —
  the editor lists them, no shipped spell carries one. Presentation is keyed by ID in code (sprites.js
  `SPELL_ANIM_VERBS` 575, three-vfx-effects.js `SPELL_MAP` 1266, battle.js `SPELL_DIRECTOR_ROWS`
  27060).
- **The diff layer** `EWSpellMods` (18851–19300): doc `{ version: 1, enabled, modified: { id: { field:
  val | null } }, added: { id: { …def, _home } }, deleted: [ids], learnsets: { job: [ids] },
  raceAbilities: { race: [ids] }, notes }` in localStorage `ew_spell_mods_v1`; `apply()` 19099 =
  capturePristine → restoreAll → applyDoc → `applyTreeRingCosts`; `POWER_FIELDS` 18889 re-price;
  `prune()` 19221 at boot; `exportDoc` 19153 adds `format`, `exportedAt`, `build`, `summary` lines and a
  `baseline` of pre-edit values.

### 2.3 The engine (battle.js / ui.js / hud.js / ai.js / online.js)

- **Targets**: `SPELL_KIND_META` (704–880) is the per-kind flag table (`offensive`, `tileTargeted`,
  `selfCast`, `allyOnly`, `directional`, `twoClick`, …); `_getSpellValidTargets` (50537–50705) and
  `getSpellRangeTiles` (6831–6910) branch on it, then on a few literal kinds (`line`, door kinds,
  `hinge`). Exposed to the AI as `TargetQuery.spellTargets / spellTiles` (34667–34690).
- **Footprint**: `getSpellAoeArea(spell, cx, cy)` (32134) reads `aoeRadius` + `aoeShape` ∈ round /
  diamond / ring / square; `getCrossArea` (32146) reads `crossRadius` + `diamond` / `diagonal`. Both are
  what `doSpell`'s aoe/cross branches, `_spellGlowTiles` (6266, the tiles RELAYED to the guest),
  `_selfNovaHasTarget`, `findAoeCastCenterForTarget`, `hasSpellTargetInRange` and `previewSpellRange`
  (51517) call. Re-implementations that must stay in step: ui.js `getSpellAoeFootprint` (11222, the
  board hover preview), hud.js `_hrlgSpellShape` / `_hrlgShapeTiles` (3469–3505, the ≤ 5×5 card
  tiles, reused by party-builder.js `pbAoeTiles` 1637–1660), ai.js `getSpellAoeAreaAI` (6243) /
  `_crossFootprintAI` (4808).
- **What exists / doesn't**: chain (`chainProfile` + `chainRadius`, `calcChainTargets` 314), ricochet
  (`kind: 'ricochet'`, `calcBounceTarget` 366, `_applyRicochetDamage` 5290), split beam (`splitCount /
  splitRadius / splitDmg`, 63734–63808), multi-hit (`hitDamages`, 5208), barrage / nova (`aoeOriginSelf`
  + `aoeRadius`, 62507). **No cone. No RANDOM targets** (every multi-pick is deterministic lowest-HP).
  **No adjacent SPLASH** (`extraTargets` at 5521 / 62829 is camera framing only; `splashDmg` is the
  door breach's own). **No tile mask.** Spells never crit (`rollCrit` is basic-attack only;
  `guaranteedCrit` on 2 defs is never read).
- **Damage**: cast-time power at 61315; per-kind resolvers (`_applyDamageSpellHit` 4976,
  `_applyAoeDamage` 5351 — enemies only, `pushFromCenter`, `pullToCenter`, `leaveTerrain`,
  `terrainDeform`) all end in the chokepoint **`applyDamageToUnit`** (30176): affinity → passive
  immunity → `_offMult` product (attack bonus, type chart × STAB, `lowHpBonus`, zodiac, high ground,
  range falloff, `opts.bonusVsStatus`, element combos, weak/resist) → armour → status taken mults →
  shield. MP: **`getSpellMpCostFor(unit, spell)`** (2764) — the one place an MP upgrade plugs in.
  Push / pull: `resolveForcedSlide` (4459), `getUnitPushDistance` (4206), fields `pushDistance`,
  `pullToCenter`, `pullDistance`, `displaceDistance`, `collisionStatus`. Status: `applyStatusEffects`
  (7678) → `applyStatusPayload` (7417). Recoil: `selfDamagePct` 61397.
- **Deployables**: the cap is `spell.maxActivePerCaster`, read per kind at cast (`deployTurret`
  65536, `deployObject` 63884, `summonUnit` 61851, `bomb` 61943, `placeMirror` 61981, `placeTrap`
  62058, `deployPair` 63942, `warpRune` 65234); turret stats `turretHp / turretDmg / turretRange`
  (65554–65556, Engineer +1 range); standing doors cap per PLAYER (`DOOR_GUN_RULES.standingCap`).
- **The rack** (party-builder.js 1527–1801: `pbTierCtx`, `pbSpellVerdict`, `pbTierGrid`,
  `SpellTierPanel`, `TechniquePanel`) and the HQ pause spell screen (map.js, data.js
  `hqPartyTreeCircuit`); legality `isTreeLoadoutLegal` / `treeLegalSubset` (18241 / 18258),
  `spellAddVerdict` (18204) is the one verdict every UI prints; the builder renders hud.js
  `_hrlgSpellBadges` + `_hrlgShapeTiles` — the dev library shares NONE of that.
- **Online**: the host trims a guest's `customSpells` with `treeLegalSubset` on `party-config`
  (online.js 2128–2140) and again in `createUnit` (battle.js 33477); server.js never inspects spells.
  `unit.spells` are the def OBJECTS and ride every snapshot wholesale (`_serializeState` 4584), so a
  modded host's numbers silently reach a vanilla guest — nothing hashes defs. `EWSpellMods` has no
  online guard.
- **AI**: `scoreSpells` (2557) → `findSpellTarget` (4830) → `scoreSpell` (2589) with direct branches for
  ~75 kinds and a GENERIC fallback (3543) on `dmg / heal / statusEffects / statStageBoost / shield`.
  A new kind needs branches in `getSpellAoeAreaAI`, `findSpellTarget`, `scoreSpell`;
  `check-ai-spell-dispatch.js` and `ai-spell-routing.test.js` pin the coverage.

### 2.4 The clips (sprites.js / three-renderer.js)

- **142 raw clips in 5 shared libraries** (`EW_ANIM_LIB_URLS` sprites.js 794): UAL1 (43, Quaternius),
  UAL2 (43), MAL1_Sniper (20), MAL2_Sniper (5), MAL3_Sniper (31, the user's batch, library 4). Six MAL3
  clips are unwired by design (spells-vfx.md 1135). Repo copies of every GLB exist (`rigged_animations/`
  + root) for CI; the game streams them from R2 (~20 MB, cached once per session, the builder already
  pre-streams them at boot).
- **75 SLOTS in `UAL_SLOTS`** (sprites.js 838–1092): 18 locomotion / reaction, 22 eager cast slots
  (`cast castMagic castSupport castHeal castRanged castMelee castThrow castPlant castArrow castKick
  castAOE castUltimate castSlam castConsume castChop castTrap castPunch castClaw castPunchCombo
  castMeleeCombo castDash castTackle`), 39 deferred verb slots (THE BODY's 15 + THE NEW CLIPS' 24),
  5 travelling (`castThrust castUpSlash castLeapSlash castLeapPunch castFlyKick`, hips-in-ground bake +
  `ThreeAnim.clipTravel`). Each row: `{ clip, lib, ts, trim?, strikeAt?, pinHips?, defer?, travel? }`.
  73 of the 142 clips are wired to some slot; 44 per-race `lib:` overrides in `RACE_MODELS_3D`.
- **How a spell picks its clip**: `classifySpellAnimKind(spell)` (sprites.js 672) — the verb table
  `SPELL_ANIM_VERBS` (575: 47 verbs, 321 ids) first, else regex rules over id/name/kind/damageType —
  then `_castChainFor(kind)` (three-renderer.js 12326, 66 kinds → slot fallback chains) →
  `_maybeStartModelAnim` (12443, first baked slot, one-shot capped 1,400 ms). **No def field is read.**
  The cheapest data-only route: a new `animVerb` (a `_castChainFor` kind) or `animSlot` (a raw slot)
  honoured at the top of `classifySpellAnimKind` — the diff layer then persists, applies and exports it
  for free.
- **Preview**: `EWCharViewer` (three-renderer.js 38469–38624, `window.EWCharViewer`): a singleton 3D
  stage that `mount`s into a visible host div, `play(slot, { full, loop })` any baked slot on the mounted
  race, `playSpell(spell)` resolves the chain like the board, `previewSpell(spell)` adds the real VFX,
  `snapshot()` gives a JPEG. Used today by the codex, the builder's hero stage and the HQ. It cannot play
  an UNWIRED raw clip (no baked action) — a ~30-line `playClip(name, lib)` that bakes one ad hoc through
  `_libBakeClips` fixes that. The raw clip lists are not exported anywhere at runtime
  (`_unitGlbCache[url].clips` is private) — a one-line `ThreeRenderer.devLibClips()` getter is needed
  for the RAW CLIP group; `UAL_SLOTS` is already global for the slot group.
- Offline tooling for thumbnails exists (`anim-sheets.js`: Playwright contact sheets per library +
  `stats.json` durations) but pre-rendered thumbnails would be new R2 assets showing the sniper, not
  the race — the live viewer is cheaper and better (§7 Q13).

---

## 3. THE GAP — the user's requests against today

| # | The ask | Today | The gap (where it is built, §) |
|---|---|---|---|
| 1 | Current mechanics: elements, SP tier costs | 15 elements as a filter; tiers `I/II/III` as shop prices; no SP | explicit numeric `tier` (= SP), combat vs flavour element shown, MP ladder shown, the type wheel faction shown (§4.1, §5.3) |
| 2 | Passives in the library | none | inherent passives read-only (`PASSIVE_DEFS`), family passives as editable rows with hook-key fields (§4.5, §5.6) |
| 3 | Edit any attribute | yes, as raw named fields | typed, grouped, labelled editors with help text inline, no re-render on edit (§5.3) |
| 4 | Sort by attribute (damage, type, aoe, dash, utility, heal, status, status bonus, element…) | 7 sort keys, flat list | a TABLE view with every attribute a sortable column + multi-filter chips + saved views (§5.2) |
| 5 | Animation dropdown with previews | none (VFX travel only) | `animVerb` / `animSlot` field + slot/clip dropdown + live viewer preview (§4.6, §5.5) |
| 6 | Notes per spell that ride the export | `doc.notes` unused | `notes` on every row + library notes + a markdown summary in the export (§4.8, §5.7) |
| 7 | Create new spells AND passives | spells only (Black Mage template) | templates per role, passive rows, duplicate-from (§5.8) |
| 8 | Family tag system + filter | none | `families` tags + `SPELL_FAMILIES` registry + a FAMILIES tab (§4.2, §5.6) |
| 9 | 3–5 families per unit, one unique | `RACE_TREE` rungs + job rows | `RACE_FAMILIES`, pool = union of families, rack grouped by family — last phase (§9 Phase 7) |
| 10 | Upgrades / modifiers costing SP, per-spell allowed lists | none | `SPELL_UPGRADES` registry + `upgrades` on the row + loadout `spellUpgrades` + derived defs (§4.4, §6.3) |
| 11 | Damage / damage+effect / effect roles; heavy + status ⇒ tier ≥ III | `type` is coarse; nothing checks | `role` field (auto + override) + THE TIER RULE lint + REPORT (§4.3, §5.9) |
| 12 | Two passive kinds; family passives take a spell slot | none take slots | passive rows in `SPELL_BY_ID`, `getUnitPassives` union (§4.5, §6.4) |
| 13 | Merge equipment into spell slots | 2 accessory slots, 17 items | the 17 become family passives; accessory slots retired (§7 Q5 — a fork) |
| 14 | Random targets; damage to enemies adjacent to the target | neither exists | `randomTargets` and `splash` riders on the damage kind (§4.7, §6.2) |
| 15 | AOE grid editor with presets and free drawing | number fields | `aoeMask` + the grid editor + engine/AI/preview/card support (§4.7, §5.4, §6.1) |
| 16 | Good-looking, easy to read, heavy daily use | terminal codex, crowded, innerHTML re-render | the new shell (§5) on the forge / codex tokens, DOM patching, keyboard, saved views |
| 17 | Categorise spells, propose families / upgrades / redundancies / new spells | — | the catalogue (§9 Phase 6) with the REPORT tab's census + a first sketch (§10) |

---

## 4. THE DATA MODEL (data.js; every field editable, every field exported)

### 4.1 Fields added to a spell row

| Field | Type | Meaning | Read by |
|---|---|---|---|
| `tier` | 1–4 (number; the legacy string is migrated) | THE tier = SP cost. `spellTierOf(id)` reads it FIRST, then falls back to the rung (so nothing breaks before the bake). MP stays the ring ladder (`TREE_RING_MP_COSTS[tier-1]`) unless `manaCostOverride` | data.js `spellTierOf`, `spellSpCost`, `applyTreeRingCosts` |
| `role` | `damage · damageEffect · effect · heal · utility · movement · deploy · terrain · passive` | the spell's ONE identity. `spellRoleOf(def)` derives it (dmg + status/stat ⇒ damageEffect; dmg only ⇒ damage; heal fields ⇒ heal; dash/teleport/escape/leap/swap/pull kinds ⇒ movement; deploy* / summon* / bomb / trap ⇒ deploy; terrain* ⇒ terrain; kind passive ⇒ passive; else effect or utility); `roleOverride` pins it | the editor's lint + REPORT, the rack's badge, the AI's fallback (optional) |
| `families` | `[familyId, …]` | tags; any number | the editor filters, `unitSpellPool` (Phase 7), the rack's grouping |
| `upgrades` | `[upgradeId, …]` | the upgrades THIS spell allows (empty = none) | the rack's upgrade picker, `spellUpgradeVerdict`, the host validator |
| `aoeMask` | `[[dx, dy], …]` (origin `[0,0]` = the centre tile; absent = today's radius/shape fields) | the drawn footprint | `getSpellAoeArea` / `getCrossArea` and the 12 sites in §6.1 |
| `animVerb` / `animSlot` | a `_castChainFor` kind / a `UAL_SLOTS` slot name | the caster clip | `classifySpellAnimKind` (first), `_castChainFor` |
| `randomTargets` | `{ count, scope: 'enemies' \| 'units', distinct: true }` | §4.7 | `_applyDamageSpellHit` rider, AI |
| `splash` | `{ mult: 0.5, radius: 1 \| mask: [...] , team: 'enemies' }` | §4.7 | `_applyDamageSpellHit` rider, AI, previews |
| `notes` | markdown string | the user's intent for look / feel / balance | the export only (never player-facing) |
| `roleOverride`, `tags` (free words) | — | escape hatches | the editor |

Existing fields are NOT renamed (321 verb-table ids, 84 `bonusVsStatus`, the sim stamps all stay).
The three LOS spellings (`ignoresLineOfSight` / `requiresLineOfSight` / `lineOfSight`) get ONE editor
control that writes the canonical one and a lint for the others. Dead fields the engine never reads
(`bonusVsDebuffed`, `guaranteedCrit`, `executeBonusPct`, `selfCenter`, `lineLength`, `equipCost`,
`slotCost`, `equipReq`) are marked DEAD in the field catalogue so the editor stops offering them.

### 4.2 `SPELL_FAMILIES` (new table, beside `SPELL_ELEMENTS`)

`{ id, name, glyph, color, kind: 'element' | 'weapon' | 'discipline' | 'support' | 'signature', desc,
unique: '<race>' | null }`. The 15 elements are seeded as element families (same ids, so `element:
'fire'` and `families: ['fire']` agree; the editor keeps them in step with one click). `unique` marks a
character's own family (the Door Agent's DOOR WHEEL is the precedent — `DOOR_GUN_SPELLS` is already a
never-borrowable pool). Later (Phase 7) `RACE_FAMILIES[race] = [3–5 ids]` and `unitSpellPoolParts`
reads the union; until then `RACE_TREE` stays the pool.

### 4.3 The roles and THE TIER RULE

`spellLint(def)` returns `[{ rule, level, text }]`; rules shipped with Phase 0:
- `tierRule`: `role === 'damageEffect' && dmg >= 120 && tier < 3` → red.
- `roleDrift`: `roleOverride` disagrees with `spellRoleOf` → amber (informational).
- `elementFamily`: `element` set but not in `families` → amber.
- `deadField`: a DEAD field present → amber. `losTriple`: two LOS spellings → red.
- `offPool`: not on any row / family → grey. `nameDup`: duplicate `name` (casts resolve by name) → red.
- `maskVsRadius`: both `aoeMask` and `aoeRadius` → amber (the mask wins).
Lint never edits. The REPORT tab lists every hit; the row shows a badge.

### 4.4 `SPELL_UPGRADES` (new registry) and how an upgrade applies

`{ id, name, glyph, desc, sp: 1, families: [] (optional: only spells in these families may list it),
roles: ['damage', …] (which roles it makes sense on), patch: {…} }`. Patch keys (each ONE engine read):

| Patch key | Effect | Engine site |
|---|---|---|
| `dmgMult` / `dmgDelta` | `dmg × 1.15` / `+20` (also `hitDamages`, `chainProfile`, `splitDmg`, `laneDmg`) | the derived def (no engine change) |
| `costDelta` / `costMult` | MP `−10` / `× 0.8` (floored at 5; NOT snapped to the ladder) | `getSpellMpCostFor` (2764) |
| `apDelta` | AP `−1` (floor 1) | `getSpellApCost` (34894) |
| `cooldownDelta` | rounds | `getSpellCooldownRemaining` |
| `rangeDelta` | tiles | `getEffectiveSpellRange` (6690) |
| `pushDistance` / `pullDistance` (+n) | knockback / blowback / pull | the derived def |
| `aoe: { preset \| mask }` | turns a single target into an area (a damage-only spell gains an AOE; the mask replaces `aoeRadius`) | the derived def + `kind` stays `damage` with a `splash`-style resolution (§6.2), or `kind → 'aoe'` when the spell is tile-targeted |
| `extraTargets: n, extraTargetsMult: 0.5` | "+1 target with less damage" — the next-nearest enemy in range takes `× mult` | new rider in `_applyDamageSpellHit` (shares §6.2's splash code) |
| `ricochet: { radius, mult }` | one bounce to the lowest-HP enemy within `radius` of the victim | reuse `_applyRicochetDamage` as a rider (today it needs `kind: 'ricochet'`) |
| `statusBonus: { status, mult }` | adds / raises `bonusVsStatus` (a combo finisher, allowed on damage-only) | the derived def |
| `statusDuration: +1` / `statusChance` | on `damageEffect` / `effect` rows | the derived def |
| `elementRider: 'fire'` | tags an element-less physical spell (affinity / combos / terrain reactions already read `opts.spellElement`) | the derived def |
| `deployCapDelta: +1` | `maxActivePerCaster + 1` | the 9 cap reads → one `getDeployCap(unit, spell)` |
| `turret: { dmgMult, hpMult, rangeDelta }` | turret upgrades | 65554–65556 |
| `gun: { … }` | the door gun / gun spells' own knobs (`laneDmg`, `arrowDmg`, `bounces`) | the derived def |
| `selfDamagePct: −n`, `drainPct: +n`, `healMult` | recoil / drain / heal riders | the derived def |

Loadout: `meta.customSpells` stays a list of ids; `meta.spellUpgrades = { spellId: [upgradeIds] }` is
added beside it (saves, party-config, last-party, HQ party all carry `meta`). SP used = Σ (tier + Σ
upgrade sp). `spellUpgradeVerdict(race, cls, ids, ups, spellId, upId)` → `{ ok, reason: ok | notAllowed
| sp | cap | dup }` (cap = at most 2 upgrades per spell, §7 Q3). `treeLegalSubset` gains the same
skip-what-does-not-fit repair for upgrades. **The engine sees one def**: `resolveUnitSpellDef(unit,
baseDef, upgradeIds)` builds a derived object `{ …base, _base: id, _ups: [...], dmg: …, … }` at unit
creation (battle.js 33477 / 42780, the same place `treeLegalSubset` runs) — `unit.spells` already holds
def objects and rides the snapshot, so the guest sees the upgraded numbers with NO new relay. The HUD's
badges and the desc bar read the derived def; `describeSpell` runs on it so the text says "+15 %".

### 4.5 Passives

- INHERENT: `PASSIVE_DEFS` + `RACE_PASSIVES` unchanged; the editor shows them read-only per race
  (editable hook values are a later nicety) — "cannot be changed, no SP, no slot".
- FAMILY passives: rows in `SPELL_BY_ID` with `kind: 'passive'`, `role: 'passive'`, `tier`, `families`,
  `notes`, and `hooks: { <hook key>: value }` using the SAME keys `PASSIVE_DEFS` uses today plus the new
  ones the user named: `healOnceBelowPct: { pct: 50, healPct: 40 }` (once per life; a `_passiveSpent`
  ledger like `_talismanSpent`), `physicalElementRider: 'fire'` (physical spells and basics carry the
  element), `regenPerRound: 4` (% max HP), `buildBonus: { dig: +1, build: +1 }` (the builder / digger
  actions read it), `weatherBonus: { storm: { atkStages: +1 } }`, `terrainBonus: { water: { … } }`,
  `zodiacBonus: { earth: { … } }`, `statBonus: { awr: +14 }` (the nine equipment stat sticks), and the
  eight accessory behaviours as keys (`surviveLethalOnce`, `mpOnHit`, `cleanseOnTurn`, …). `kind:
  'passive'` gets a `SPELL_KIND_META` row `{ passive: true }` so `_getSpellValidTargets` never offers it
  and the HUD's spell menu never lists it (it shows in the rack, the inspect card and the codex).
- `getUnitPassives(unit)` = race passives ∪ equipped passive rows' `hooks` (a passive row is wrapped as
  a def with the hook keys at top level, so `unitPassiveValue` needs no change).
- **The cap**: `PASSIVE_SLOT_MAX = 2` — `spellAddVerdict` returns `reason: 'passives'` ("2 PASSIVES MAX")
  for a third passive row; `treeLegalSubset` skips the third (earlier picks win); the rack's SP meter
  shows a ◈ 1/2 pip pair beside the slot pips.
- **The GEAR family is universal**: `SPELL_FAMILIES.gear` (`kind: 'support'`, `universal: true`) is in
  every unit's pool (`unitSpellPoolParts` adds a `gear` part; a Freelancer has it too), and holds the 17
  converted accessories. Passives / equipment made later carry their own `families` and reach only the
  units that own them (Phase 7) — the user's ruling: "the current equipment should be available to all
  characters, while the rest can be specific to families".

### 4.6 The animation pick

`animVerb` (a `_castChainFor` kind; the dropdown's main groups) or `animSlot` (a raw `UAL_SLOTS`
slot; the chain becomes `[slot, ...chainFor(classified kind)]`) or `animClip: { name, lib }` (an
unwired raw clip; Phase 2 bakes it into a synthetic slot `clip:<name>` at load through the deferred
baker, so the board can play it). Read at the top of `classifySpellAnimKind`. `animStrikeMs` optional
override of the strike lead. The verb table `SPELL_ANIM_VERBS` keeps working as the default for the 321
ids it names; a bake (§4.9) writes `animVerb` onto the rows the user changed, so the table and the field
never disagree.

### 4.7 The two new targetings and the mask

- `randomTargets: { count: 3, scope: 'enemies' | 'units', distinct: true }` on a `damage` (or `aoe`
  with `aoeOriginSelf`) row: the cast needs no click beyond the spell (it is `selfCast` in
  `SPELL_KIND_META` when `randomTargets` is set); the host picks `count` targets among legal ones
  (`_getSpellValidTargets` minus fog) with `engineRng` (the seeded stream), resolves each as a `_applyDamageSpellHit`
  with `dmg` (per hit `× randomTargets.mult`, default 1), relays the picks inside the existing cast
  relay (the guest never re-rolls). Fewer legal targets than `count` ⇒ fewer hits unless `distinct:
  false` (then repeats).
- `splash: { mult: 0.5, radius: 1 | mask, team: 'enemies' }` on a `damage` row: after the primary hit,
  every unit of `team` on the tiles around the VICTIM (radius or mask, victim = origin) takes
  `dmg × mult` through `_applyAoeDamage` with `noPush`. This is the single-target-with-area rider the
  user's "3×3 upgrade to a single-target fire spell" is; the `aoe` UPGRADE patch (§4.4) is exactly
  `splash: { mult: 1, mask }`.
- `aoeMask` replaces `aoeRadius` / `aoeShape` / `crossRadius` / `diamond` / `diagonal` when present.
  Presets (`AOE_PRESETS` in data.js, used by the editor and the upgrade patches): `single`, `3x3`,
  `5x5`, `diamond1`, `diamond2`, `x1`, `x2`, `cross1`, `cross2`, `ring1`, `ring2`, `line3`, `line5`,
  `hollow3x3`. A mask is fixed on the board (no rotation, §7 Q8); `orientable` stays the line kinds'
  own flag.

### 4.8 Notes

`notes` (markdown) on every row, family, upgrade and passive; `doc.notes` for the library. The export
carries them verbatim and the summary lists "NOTE <id>: first line". Notes are never shipped to players
(the bake tool strips them into a repo file `docs/spell-notes.md`, keyed by id, so future threads read
them without bloating data.js — §7 Q12).

### 4.9 The export, the import and the bake

- Export doc v2 (`format: 'entropy-wars-spell-mods'`, `version: 2`): the v1 keys + `families`, `upgrades`,
  `passives` (as `added` rows), `raceFamilies`, `notes` per id, `views` (saved filters — dev-only), and
  `summary` (human lines) + `report` (the census counts and the lint list). Import MERGES by default
  (a diff view: rows added / changed / conflicting, pick per row), REPLACE is a second button.
- **`bake-spell-mods.js` (repo tool, new, allowed by CLAUDE.md TOOLING)**: `node bake-spell-mods.js
  <export.json>` rewrites the literal rows in data.js (`SPELL_LIBRARY`, the `RACE_ABILITIES` arrays,
  `RACE_TREE`, `CLASS_SPELL_LEARN_ORDER`, `SPELL_FAMILIES`, `SPELL_UPGRADES`, `RACE_FAMILIES`) from the
  doc, prints the diff, strips notes into `docs/spell-notes.md`, and runs `npm run test:quick`. This is
  how "export → new thread → baked" costs a thread minutes, not a survey. (Field order: the tool writes
  `{ id, name, desc, tier, role, families, …rest in source order }` so diffs stay readable.)

---

## 5. THE UI — THE LIBRARY, rebuilt

Same entry (Settings → Developer, `_goToSpellLibrary`), same page id (`#spellLibraryPage`), same
diff layer, same Spell Lab + timeline (docked, not rewritten). New file? **No** — the R2 upload set is
fixed; the screen stays in ui.js (the old 9044–10085 block is replaced; the Lab and timeline blocks
stay), the CSS in styles-hud.css (the `slb-` block replaced), markup in index.html 787–796. It uses the
FORGE / codex tokens (Cormorant SC heads, DotGothic16 data, `--bc-*` category washes, hud.js
`typeBadgeStyle`, the solid type badges of THE BADGE PASS) so it reads as the same product as the party
builder, and it steals the builder's chips (`_hrlgSpellBadges`, `_hrlgShapeTiles`) rather than drawing
its own.

### 5.1 The frame

```
┌ SPELL LIBRARY · ARCANE ENGINEERING DIVISION ───────────────── 12 edits · EDITS ON · ⇩ EXPORT · ⇪ IMPORT · ▶ LAB ┐
│ [SPELLS] [PASSIVES] [FAMILIES] [UPGRADES] [POOLS] [REPORT]                              🔍 search  · ⌘K   │
├──────────────┬───────────────────────────────────────────────────────┬───────────────────────────────────┤
│ RAIL 240px   │ THE TABLE (or CARDS)                                  │ THE INSPECTOR 420px               │
│ families ▾   │ name · tier · SP · MP · AP · role · elem · kind · dmg │ [STATS][TARGET][EFFECTS][UPGRADES]│
│ roles        │ heal · range · AOE · status · bonus · owner · lint    │ [LOOK][NOTES][RAW]                │
│ elements     │ (click a head = sort, shift-click = second key)       │ 3D stage (viewer) · AOE grid      │
│ kinds        │ 535 rows, virtualised, ↑↓ walk, Enter = inspect       │ fields grouped, help inline       │
│ owner race   │ chips row: filters as removable chips + SAVE VIEW     │ ▶ LAB THIS · ⧉ DUPE · ↺ · ✕       │
│ lint         │                                                       │                                   │
└──────────────┴───────────────────────────────────────────────────────┴───────────────────────────────────┘
```

Under 1,100 px the rail collapses to a drawer and the inspector becomes a sheet; the table hides
columns by priority. Every edit is a DOM patch of the one cell / field (no `innerHTML` of the pane);
the table row updates in place; a toast "spell.dmg 80 → 92" with UNDO (a 50-deep undo stack over the
diff doc, ⌘Z / ⌘⇧Z — the diff layer makes this trivial: push the previous field value).

### 5.2 THE TABLE (sorting and filtering — request 4)

- Columns = every attribute in §4 plus the computed ones: TIER (numeral + SP), MP, AP, CD, ROLE (a
  solid chip in the role colour), ELEMENT (glyph + combat/flavour dot), FACTION (`spellType` badge),
  KIND, DMG (+ `hitDamages` sum), HEAL, RANGE (min–max), AOE (the mini tiles from `_hrlgShapeTiles`,
  mask-aware), STATUS (chips with duration), BONUS (`×1.5 BRN`), PUSH/PULL, DEPLOY (cap), FAMILIES
  (chips), OWNER (race / job / shared ×n), ANIM (verb), LINT (badges), EDIT (● / NEW / DEL).
- Sort by any column, two keys, persisted per view. Filters are CHIPS in the rail (multi-select:
  families, roles, elements, kinds, owners, tiers, "has status", "has bonus", "AOE", "dash", "heal",
  "deploy", "terrain", lint rules, edited only, off-pool) — every chip shows its count. The search box
  matches id / name / desc / notes / families. SAVED VIEWS (name + filters + sort + columns) live in the
  doc's `views` and export with it ("Fire family, by dmg").
- CARDS toggle: the same rows as the builder's chips (name, badges, AOE tiles, SP tag) in a grid — for
  browsing a family visually.
- Bulk: select rows (click / shift / ⌘A on the filtered set) → the inspector shows a BULK panel: add /
  remove a family, set a tier, set an element, add an allowed upgrade, tag notes. One undo step.

### 5.3 THE INSPECTOR — STATS · TARGET · EFFECTS

- Header: name (editable), id (locked; DUPLICATE for a new id), role chip (auto, click to override),
  tier stepper I–IV showing SP and the MP ladder, the owner chips (races / jobs / families — editable),
  lint badges with the rule text, verbs (▶ LAB THIS, ⧉ DUPLICATE, ↺ REVERT, ✕ DELETE / RESTORE).
- STATS: MP (with the formula's suggestion `computeSpellManaCost` as a ghost value + a PIN toggle =
  `manaCostOverride`), AP, cooldown, damage (with the WEAK / MEDIUM / HEAVY / SEVERE presets and the
  ROLE RULE line "damage+effect ≥ 120 needs tier III"), damage type, element (combat elements marked
  ⚔, flavour ✦), faction, self-damage, drain, crit (greyed "spells do not crit" unless the field exists),
  heal, shield, multi-hit editor.
- TARGET: target mode (unit / tile / self / line / random / two-click — a segmented control that writes
  `kind` meta-consistent fields), range min–max, LOS (one control), flight rules, the AOE GRID (§5.4),
  splash (mult, radius or "draw"), random (count, scope, distinct), push / pull / pull-to-centre,
  ground flyers, chain / ricochet / split editors when the kind has them.
- EFFECTS: statuses (the chip editor kept — id, duration, bonusDamage — with `STATUS_DEFS` glyphs),
  stat stages, ally / team statuses, cleanse, `bonusVsStatus` (status list + mult), terrain (create /
  deform / leave / paint with the terrain glyphs), deploy (turret / object / summon / trap / bomb fields
  + cap), weather, delayed / mark, revive, steal.
- Every field: label in words, the internal key in small type, help inline under it (from
  `_SLB_FIELD_HELP`, rewritten as one sentence each), a ↺ per field when modified (amber edge). "+
  field" is a searchable palette (⌘K) instead of a long select.

### 5.4 THE AOE GRID (request 15)

A 7×7 grid (the centre = the target tile, or the caster for self-origin) drawn at 28 px tiles: click
paints, drag paints, right-click erases, the centre is locked ON. A row of PRESET buttons (single, 3×3,
5×5, diamond 1 / 2, X, cross 1 / 2, ring, line 3 / 5, hollow 3×3) stamps `AOE_PRESETS`; MIRROR ↔ ↕ and
ROTATE buttons; a count "9 tiles"; a toggle ORIGIN = target / self (`aoeOriginSelf`). Editing the
grid writes `aoeMask` and clears the radius / shape fields (the lint says so); a spell that still uses
radius fields shows its computed footprint on the same grid (read-only until you click, which converts
it). The same widget, smaller, is the SPLASH shape editor (origin = the victim). The board's hover
preview and the card tiles show the mask the instant it is drawn (they read the def).

### 5.5 THE LOOK — the animation dropdown (request 5)

- The inspector's LOOK tab mounts `EWCharViewer` (the race = the row's owner race, or the last-used
  caster; a race picker above it; the stage is the builder's hero stage, so it costs nothing new) at
  ~300 px, idle-looping.
- ANIMATION: a searchable dropdown in groups — **CAST VERBS** (the 66 `_castChainFor` kinds, each showing
  its resolved first slot and clip: "drain → castDrain · Headache_Relief · MAL3 · 1.4 s · strike 0.6
  s"), **SLOTS** (the 75 `UAL_SLOTS` rows with clip · library · played length · strike · defer / travel
  flags), **RAW CLIPS** (the 69 unwired clips via `devLibClips()`, "not baked — will bake at load"),
  and **AUTO** (what `classifySpellAnimKind` picks today, shown as the ghost default). Hovering an
  option plays it once on the stage; selecting writes `animVerb` / `animSlot` / `animClip`; ▶ FULL and
  🔁 LOOP buttons; a scrubber shows the strike frame (from `strikeAt`), editable as `animStrikeMs`.
  The five travelling slots show a TRAVEL tag and a "moves the unit" note.
- VFX: the Lab's five selects (archetype, projectile, weight, travel type, backdrop opt-in) move here
  with previews through `EWCharViewer.previewSpell` (the real VFX on the stage) — the Lab remains the
  board test. The TIMELINE stays docked in the Lab (cues need the board's beats).
- PREVIEW FEASIBILITY (the user asked): live 3D on the mounted race is feasible now for every slot;
  raw clips need the ~30-line `playClip`; the libraries (~20 MB) are already streamed by the builder at
  boot, so the only cost is a few ms of bake per clip and the 39 deferred slots' idle-tick bake (the
  dropdown greys an option until its bake lands). Pre-rendered GIF thumbnails are NOT recommended (new
  R2 assets, the sniper's body, a render pipeline to maintain). Text-only labels are the fallback when
  WebGL is off.

### 5.6 PASSIVES · FAMILIES · UPGRADES · POOLS tabs

- PASSIVES: two sections. INHERENT (per race: the `RACE_PASSIVES` ids with their `PASSIVE_DEFS` hook
  values, read-only, "fixed to the character, no SP"). FAMILY PASSIVES: the same table + inspector as
  spells, filtered to `kind: 'passive'`, whose EFFECTS tab is the HOOKS editor (a palette of every hook
  key with its type and consumer — one line each — plus the new keys in §4.5). NEW PASSIVE templates:
  stat stick, elemental rider, once-per-life heal, regen, weather / terrain / zodiac bonus, build / dig.
- FAMILIES: the registry as cards (glyph, colour, kind, unique-to, member count, notes); click = the
  table filtered to that family with an ADD MEMBERS palette; drag rows from the table onto a family card
  in the rail. A MATRIX view: races × families (Phase 7's `RACE_FAMILIES`), each cell a count, a ★ for
  the unique family; a race row totals its families (3–5 rule lint).
- UPGRADES: the registry as a table (name, SP, roles, families, the patch as chips "+15 % dmg", "−10
  MP", "ricochet 2 / ×0.5"); an inspector with a PATCH builder (pick a patch key, set the value) and a
  USED BY list. On a spell's UPGRADES tab: the allowed list as toggles over the whole registry, with
  the resolved preview ("Fireball + AOE 3×3 + −10 MP = 80 dmg, 3×3, 40 MP, 3 SP") and ▶ LAB WITH THESE.
- POOLS (the old MOVEPOOLS tab, kept): job learnsets and race rows (`RACE_TREE` twins shown as pairs),
  reorder / add / remove; later the family matrix supersedes it.

### 5.7 NOTES

A NOTES tab per row (markdown textarea with a preview, autosaved to the doc, the first line shown as a
tooltip on the table row's 📝 mark) and a LIBRARY NOTES panel in the REPORT tab (the session brief).
The EXPORT dialog previews the markdown summary that a thread will read: per changed row — what
changed, the note, the lint; per new row — the whole def in a fenced block; the families / upgrades /
passives added. COPY SUMMARY copies that markdown.

### 5.8 Creating (request 7)

NEW ▾ offers: SPELL (from a ROLE template: damage / damage+effect / effect / heal / utility / movement /
deploy / terrain, each pre-filled with the census median for its tier), PASSIVE (templates §5.6),
FAMILY, UPGRADE; and DUPLICATE on any row. New ids are typed once (validated: unique, camelCase) — the
"customSpell[N]" ids go away. A new row is homed in a family (and optionally a race row / job learnset)
from the header chips.

### 5.9 REPORT

The census as live numbers over the CURRENT doc: rows by role × tier, by element, by family, by kind;
damage-only vs damage+effect vs effect; the seven TIER RULE offenders (and any the user creates); the
lint list; the REDUNDANCY view (§10's grouping as a query: same kind + element + status + AOE class,
dmg within 20 — each group a row with its members, so the user can merge / delete / turn one into an
upgrade with a click); coverage: which families have no tier-I row, which races have < 3 families;
the clip spread (the most-played clip %, from `check-spell-presentation.js`'s census, run in-page).

---

## 6. THE ENGINE (battle.js / ui.js / hud.js / ai.js / online.js / three-renderer.js / sprites.js)

### 6.1 The mask (Phase 2) — the sites, so no thread re-searches

1. battle.js `getSpellAoeArea` 32134 and `getCrossArea` 32146: `if (spell.aoeMask) return
   maskTiles(spell.aoeMask, cx, cy)` (bounds-clipped). Everything that calls them inherits it: `doSpell`
   aoe 62483 / cross 62953, `_spellGlowTiles` 6266 (⇒ relayed tiles), `_selfNovaHasTarget` 35594,
   `findAoeCastCenterForTarget` 35641 (the ring centre picker needs the mask's tiles-that-hit-target),
   `hasSpellTargetInRange` 35982.
2. battle.js `previewSpellRange` 51539–51600 (own arms code) and `_focusPlatesForAction` 50820 /
   `_focusPlatesForImpact` 50851 (Manhattan radius → mask bound).
3. battle.js `_fireAoeVfx` 5564 and three-vfx-effects.js's `aoeRadius` ring sizing (1238, presets
   1324–1550): a mask gets `_aoeBound` (its max Chebyshev radius) stamped at load so rings size right.
4. ui.js `getSpellAoeFootprint` 11222 (hover preview) — mask branch first.
5. hud.js `_hrlgSpellShape` 3469 / `_hrlgShapeTiles` 3478 — draw the mask (cap 5×5 for the card, 7×7 in
   the editor); party-builder.js `pbAoeTiles` inherits.
6. ai.js `getSpellAoeAreaAI` 6243 / `_crossFootprintAI` 4808 — mask branch.
7. state.js 1139 (delayed detonation) and battle.js 11082 (deployable blasts) — mask on `delayed` and
   `bomb` rows when present.
8. data.js `describeSpell` 18725 ("hits a 3×3" / "an X"), `computeSpellManaCost` 9371 (`_mfEffectiveTargets`
   counts mask tiles), `EWSpellMods.POWER_FIELDS` (+ `aoeMask`, `splash`, `randomTargets`).
9. online.js: nothing — the host relays tiles (2516) and the def rides the snapshot; the guest's own
   hover / card code reads the same field. Test: `aoe-mask.test.js` (every preset's tile set, the
   bounds clip, parity between battle / ui / hud / ai footprints for every shipped row).

### 6.2 Random targets and splash (Phase 3)

- `SPELL_KIND_META`: a row's `randomTargets` ⇒ `selfCast` (no click) and `offensive`.
  `_getSpellValidTargets` returns the pool; `doSpell`'s damage branch, when `randomTargets` is set,
  picks with `engineRng()` (the seeded stream the host owns — stream discipline: draw once per pick), resolves each hit through `_applyDamageSpellHit`,
  and RELAYS the picked ids in the cast payload (the guest replays the same victims; check the
  `_serializeState` skip list for any new `state._randomPicks`). The director: one strike per victim
  through the existing multi-hit camera (`_setupAoeCameraAndTiming` takes tiles).
- `splash`: after `_applyDamageSpellHit`'s primary hit, `_applySplashDamage(unit, spell, victim,
  spellPower)` = `_applyAoeDamage` on the victim-origin tiles minus the victim with `× mult` and
  `noPush`; VFX: the impact ring at the victim (`VFX.fire('aoe', …, { aoeRadius: bound })`).
  `extraTargets` (the upgrade) = the same function with a "next-nearest enemies in range" tile set.
- ai.js: `scoreSpell` values `randomTargets` as `count × dmg × (enemies in range / count clipped)` and
  `splash` as the primary + Σ adjacent enemies × mult; `findSpellTarget` for splash prefers a victim
  with the most enemy neighbours. `check-ai-spell-dispatch.js` learns the two riders;
  `ai-spell-routing.test.js` pins two shipped rows.
- Tests: `spell-riders.test.js` (a random cast picks `count` distinct legal victims from a seeded RNG;
  splash hits neighbours only, never the victim twice, never allies).

### 6.3 Upgrades (Phase 5)

- data.js: `SPELL_UPGRADES`, `spellUpgradeVerdict`, `loadoutSpUsed` counts upgrades, `treeLegalSubset`
  repairs `spellUpgrades`, `resolveUnitSpellDef` (pure; unit-tested per patch key), `describeSpell`
  on a derived def appends the upgrade lines.
- battle.js: the two `treeLegalSubset` call sites build derived defs into `unit.spells`;
  `getSpellMpCostFor` / `getSpellApCost` read the derived `cost` / `apCost` (already do); the
  `ricochet` / `extraTargets` riders in `_applyDamageSpellHit`; `getDeployCap(unit, spell)` replaces the
  nine `maxActivePerCaster` reads; the turret reads take the patch.
- party-builder.js / map.js (HQ pause): a chip's ⚙ opens the UPGRADES popover (allowed upgrades as
  toggles with SP, the verdict text, the resolved preview line); the SP meter counts them; the
  technique panel shows "Fireball · AOE 3×3 · −10 MP · 3 SP".
- online.js: `party-config` carries `spellUpgrades`; the host runs the repair; the derived defs ride
  the snapshot (no new relay). ai.js: `buildTreeLegalLoadout` spends leftover SP on random allowed
  upgrades (dmg first).
- hud.js: the badge row reads the derived def, so an AOE upgrade shows its tiles in battle.

### 6.4 Family passives and the equipment merge (Phase 4)

- data.js: `kind: 'passive'` rows, `SPELL_KIND_META.passive`, `getUnitPassives` union,
  `unitSpellPoolParts` lists passive rows in the race / job / family pools, the rack renders them as
  chips with a ◈ PASSIVE tag; `MAX_UNIT_PASSIVES` applies to inherent only.
- battle.js: the new hook keys' consumers — `healOnceBelowPct` in `applyDamageToUnit` after the
  Martyr's Talisman check (31055, reuse its `_talismanSpent` pattern as `_passiveSpent[key]`),
  `physicalElementRider` in `getSpellElement` 2591 + the basic-attack element, `regenPerRound` in
  `_applyRoundStartPassives`, `buildBonus` in the build / dig actions, `weatherBonus` / `terrainBonus`
  / `zodiacBonus` in `getEffectiveAttackBonus` (state.js 3467) next to the existing weather / terrain /
  zodiac layers, `statBonus` in `computeEquipBonuses`'s caller (unit stat build).
- The merge (RULED, §7 Q5): the 17 `EQUIP_DEFS` become passive rows in the universal GEAR family
  (`unitSpellPoolParts` lists `gear` for every unit), `unitHasAccessory(unit, id)` becomes `unitHasPassive(unit, id)` at its
  eight call sites, `EQUIPMENT_SLOTS` / the builder's accessory pickers / the HQ bag's gear rows are
  retired (saves: `meta.equipment` ids are mapped onto `customSpells` by `SPELL_ID_RENAMED`-style
  aliasing at read). `spelunking_gear` is dropped (no reader).
- Online: passive rows are ids in `customSpells`, validated by the same repair; hooks read the def —
  nothing new relayed. Tests: `family-passives.test.js` (a passive row occupies a slot and SP, never
  appears in `_getSpellValidTargets`, each new hook key's consumer fires once).

### 6.5 The clip pick (Phase 2)

sprites.js `classifySpellAnimKind`: read `animVerb` / `animSlot` / `animClip` first.
three-renderer.js: `_castChainFor` accepts a slot-first chain; `_libBakeDeferred` bakes `animClip`
rows' synthetic slots from a `SPELL_BY_ID` scan at load (`clip:<name>`); `EWCharViewer.playClip(name,
lib)`; `ThreeRenderer.devLibClips()`. battle.js: `ThreeAnim.castStrikeMs` honours `animStrikeMs`.
Online: the clip is a def field on the caster's def, both peers classify locally — already the case.
Test: `spell-anim-pick.test.js` (a row with `animVerb` classifies to it; a bad verb falls back;
`check-spell-presentation.js` reads the field so its census stays true).

### 6.6 Online safety (Phase 0)

`EWSpellMods.apply()` is skipped (and the UI says "EDITS OFF — online match") when `isOnlineMatch()`
turns true; the diff is re-applied at the match's end. The library screen refuses to open while a match
is live. Until baked, an export is the only way a change reaches another player.

---

## 7. THE OPEN QUESTIONS — every fork, with the default the plan builds unless the user says otherwise

1. **Tier storage.** Store `tier` explicitly on every row (the bake writes it from `spellTierOf`) and
   keep the rung as the fallback? **RULED (the user, 2026-09-25): YES — tiers and spell costs are the
   user's to choose in the editor.** The rack and MP keep working before and after the bake; the editor
   edits one number for the tier and one for MP (pinned).
2. **Do families REPLACE `RACE_TREE` / job rows as the pool** (Phase 7), or overlay them? **Default:
   REPLACE, in Phase 7 only, after the catalogue** — one source of truth; job learnsets become the
   jobs' families (a Black Mage's four are the "Black Magic" family).
3. **Upgrade cost and cap.** Each upgrade has its own SP price (registry, default 1), at most 2
   upgrades per spell? **Default: YES, per-upgrade price, cap 2** — readable chips, and 16 SP still
   forces choices.
4. **Where upgrades are picked.** In the tier rack (a ⚙ on the chip) and the HQ pause spell screen,
   not a new screen? **Default: YES.**
5. **Merge equipment into passives / spell slots?** **RULED (the user, 2026-09-25): YES** — passives
   and equipment are one kind of row; **at most 2 of the 7 slots hold them**; the 17 current
   accessories are UNIVERSAL (the GEAR family in every pool), later passives / equipment may be
   family-specific. The two accessory slots are retired; slots stay 7 and SP 16.
6. **Family passives cost their tier in SP (1–4) like spells?** **Default: YES** (the user set no
   price; a universal gear row defaults to tier I = 1 SP, stat sticks included, until the catalogue
   re-tiers them).
7. **THE TIER RULE threshold.** `dmg ≥ 120` (the MEDIUM preset) and `tier ≥ III`? **Default: YES**,
   lint only; the seven offenders are the user's to re-tier or split in the catalogue.
8. **Mask orientation.** Fixed on the board (a T is always a T), with `orientable` staying the line
   kinds' flag? **Default: FIXED.** Rotating masks to the cast direction is a later flag (`aoeFacing`).
9. **Random targets.** Distinct victims among enemies in range and vision; fewer enemies ⇒ fewer hits?
   **Default: YES** (a `distinct: false` flag allows repeats for a "scatter" feel).
10. **Splash friendly fire.** Enemies only (as `_applyAoeDamage` does today)? **Default: ENEMIES.**
11. **Local mods online.** Off in any online match until baked? **Default: OFF.**
12. **Notes.** Dev-only, stripped by the bake into `docs/spell-notes.md`? **Default: YES.**
13. **Preview.** Live viewer + text labels; no pre-rendered thumbnails? **Default: YES.**
14. **The `role` of `bonusVsStatus`.** A damage-only spell may carry a combo finisher without becoming
    `damageEffect`? **Default: YES** (the user said so).
15. **"Unique family" scope.** One unique family per RACE (a race is a character here; the Door
    Agent's wheel is the model)? **Default: PER RACE.**
16. **The bake tool.** Build `bake-spell-mods.js` in Phase 0 so exports land in data.js by tool, not by
    hand? **Default: YES.**
17. **Spell crits.** Leave spells unable to crit (an upgrade "may crit" would need the crit roll in the
    spell path)? **Default: LEAVE** — a later upgrade if wanted.
18. **Where the library opens from.** Settings → Developer only? **Default: YES**, plus a ⌘⇧L
    shortcut on the title screen.

---

## 8. THE LOOK (so the tool is one the user wants to live in)

- The FORGE TERMINAL's language: a dark plate, Cormorant SC headings, DotGothic16 data, gold
  `#ffd86a` for the selection and the sort key, the category washes (`--bc-hi` / `--bc-lo`) on role
  chips (damage red, effect violet, heal green, utility blue, movement cyan, deploy amber, terrain
  brown, passive silver), the solid type badges and the element glyphs from THE BADGE PASS, family
  colours from the registry as a 3 px left edge on every row.
- Density: 32 px table rows, 13 px data, 11 px small type; the inspector 14 px labels; nothing under
  11 px. Column heads sticky; the inspector header sticky; the grid and the stage never scroll away
  while editing beneath them.
- Motion: none beyond the stage and a 120 ms highlight on a patched cell.
- Keyboard: ↑ ↓ walk rows, Enter inspects, Tab walks fields, ⌘K field / command palette, ⌘F search,
  ⌘Z / ⌘⇧Z, ⌘S export, ⌘L lab, Esc closes the sheet. Every verb has a tooltip with its key.
- Empty / error states in words ("No spell matches these 3 filters — clear one", "This row is shipped
  in data.js — DELETE marks it removed until baked").
- Seen in a probe before delivery: the user allowed builder probes (`playtest_builder.js`); Phase 1
  extends it to `playtest_library.js` (open the screen, sort two columns, edit a field, draw a mask,
  export) and ships the screenshots in the zip, since RULE #1c stops a general playtest.

---

## 9. THE ORDER (phases; each a delivery with its own test; no phase ships a dev shortcut)

| # | Delivery | Files | Test |
|---|---|---|---|
| 0 | **THE SCHEMA**: explicit `tier` (migrated from `spellTierOf`; the legacy string dropped), `role` + `spellRoleOf` + `roleOverride`, `families` + `SPELL_FAMILIES` (elements seeded), `notes`, `upgrades: []`, the DEAD-field list, `spellLint`, `AOE_PRESETS`, `EWSpellMods` v2 (families / upgrades / passives / notes / views, MERGE import, the report in the export), the online guard, **`bake-spell-mods.js`**, content-schema rows for the new fields | data.js (R2 + Render), ui.js (v1 editor reads the v2 doc unchanged), server.js untouched | `spell-schema.test.js` (every row has a numeric tier equal to the old `spellTierOf`; roles cover 535; lint finds exactly the 7 tier-rule offenders; bake round-trips a doc onto a copy of data.js and `load-data` still loads) |
| 1 | **THE SHELL**: the new screen (§5.1–5.3, 5.7–5.9): rail, table + cards, sort / filter chips / saved views, the inspector's STATS · TARGET · EFFECTS · NOTES · RAW, DOM patching + undo, NEW ▾ templates, bulk edit, REPORT, EXPORT preview; the Lab + timeline docked as they are | ui.js, styles-hud.css, index.html, hud.js (`_hrlgShapeTiles` 7×7 option) | `spell-library-ui.test.js` (pure helpers: the column model, the filter model over the census, the undo stack, the summary markdown) + `playtest_library.js` screenshots |
| 2 | **THE GRID + THE LOOK**: `aoeMask` in the 9 sites (§6.1), the grid editor + presets + splash grid, `animVerb` / `animSlot` / `animClip` + the dropdown + the viewer stage (`playClip`, `devLibClips`, the synthetic clip slots), the VFX selects moved to LOOK | battle.js, ui.js, hud.js, ai.js, state.js, data.js, sprites.js, three-renderer.js, three-vfx-effects.js (`_aoeBound`) | `aoe-mask.test.js`, `spell-anim-pick.test.js`; `check-spell-presentation.js` reads the field |
| 3 | **THE TARGETING**: `randomTargets` and `splash` riders (§6.2), the relay check, the AI branches, two shipped example rows (a scatter shot; an impact round) as ADDED rows the user may keep or delete | battle.js, ai.js, online.js (skip-list audit), data.js, ui.js (the TARGET tab's controls go live) | `spell-riders.test.js`, `ai-spell-routing.test.js` rows, `check-ai-spell-dispatch.js` |
| 4 | **DONE 2026-09-26 (§11).** **THE PASSIVES + THE GEAR MERGE (ruled)**: passive rows, `PASSIVE_SLOT_MAX = 2` in the verdict / repair / rack, the universal GEAR family, the hook editor, the new hook keys' consumers, the rack's ◈ PASSIVE chips, the 17 accessories converted, the accessory UI retired, the save migration | data.js, battle.js, state.js, party-builder.js, map.js, hud.js, ui.js | `family-passives.test.js`, `champ-rework.test.js` (inherent passives unchanged), a save-migration pin |
| 5 | **DONE 2026-09-26 (§11).** **THE UPGRADES**: `SPELL_UPGRADES` (the registry seeded with the user's list: +15 % dmg, ricochet, +1 target ×0.5, status bonus, knockback / blowback, AOE preset, −10 MP, +1 deployable, turret ×, gun ×), `resolveUnitSpellDef`, the verdict, the loadout field, the rack's ⚙ popover, the HQ pause popover, `getDeployCap`, the AI's spend, the host validation | data.js, battle.js, party-builder.js, map.js, hud.js, online.js, ai.js, ui.js (UPGRADES tab live) | `spell-upgrades.test.js` (each patch key on a fixture def; SP maths; the repair skips an unaffordable upgrade; a derived def rides `_serializeState`) |
| 6 | **THE CATALOGUE** (the user's second deliverable): a categorisation of the 535 rows into proposed families (with the unique family per race), each spell's ONE identity, the redundancy groups with a verdict each (keep / merge into X / becomes upgrade Y of X / delete), proposed upgrade lists per family, new spell and targeting proposals — delivered as an EXPORT DOC the library imports (families + notes + `upgrades` lists + the merges as deletions with a note) plus `SPELL_CATALOGUE.md`; nothing baked until the user edits and re-exports | the export json + the md (repo) | the REPORT's redundancy query reproduces the groups |
| 7 | **DONE 2026-09-26 (§11).** **THE FAMILIES AS POOLS**: `RACE_FAMILIES` (3–5 per race, one `unique`), `unitSpellPoolParts` from families, the rack grouped by family (tier rows inside each family column or family tabs), the Freelancer's borrow window by family, `treeLegalSubset` on the new pool, the codex's family page | data.js (R2 + Render), party-builder.js, map.js, hud.js, ui.js, online.js (validation only) | `spell-families.test.js` (every race has 3–5 families and one unique; every pool row is reachable; `treeLegalSubset` repairs the old saves) |

`npm run test:quick` before every delivery; the one test that names the phase; `npm test` once before
each zip (the CI rule); `test:full` never (no phase touches rooms). Every R2 delivery bumps `?v=`
(RULE #1b); data.js goes to Render at phases 0, 3, 4, 5 and 7 (the server derives the economy from it).
Phase 1 is the one the user lives in — do not ship it without the probe's screenshots.

---

## 10. THE CATALOGUE — a first-pass sketch from the census (Phase 6 does this properly; the user decides)

Candidate families (counts are today's element tags / kinds, not assignments):

- **Element families** (15, seeded from `SPELL_ELEMENTS`): Fire 26 · Ice 17 · Lightning 16 · Water 17 ·
  Earth 22 · Wind 12 · Poison 22 · Nature 13 · Shadow 27 · Light 38 · Psychic 27 · Sonic 20 · Arcane
  23 · Blood 10 · Metal 47 (Metal is really three: **Guns**, **Blades**, **Ordnance**). 197 rows carry
  no element — most are disciplines below.
- **Weapon / discipline families**: **Blades** (`guardSlash`, `dragonSlash`, `sneakSlash`, `crossSlash`,
  the MAL3 slash verbs), **Guns** (`precisionShot`, `headshot`, `raceQuickDraw`, `raceIncendiaryRounds`,
  the gun turrets), **Ordnance** (`placeBomb`, `raceDynamite`, `raceClusterRockets`, `raceMortarSalvo`,
  `raceMissileBarrage`, `sharedNuke`, `raceFireForEffect`), **Archery** (`raceFireArrow`,
  `racePoisonArrow`, `raceArrowRain`), **Brawling** (kicks, punches, smash, `raceBigKick`,
  `raceSasquatchSmash`), **Athleticism** (dash 13, leapStrike 6, tackle 2, escape 11 — `rampage`,
  `raceBullRush`, `raceSleighDash`, `raceTitanDrop`, `raceCliffCharge`, `racePredatorLeap`),
  **Blink** (teleport 10, swap 4), **Throwing** (`raceBoulderHurl`, `raceStoneThrow`, skyThrow 4).
- **Support / craft families**: **Engineering** (deployTurret 3, deployObject 7, placeMirror, placeTrap,
  bomb, the 5G tower), **Terraforming** (terrainCreate 17, the 26 `terrainDeform` rows, monument 5),
  **Weather** (summonWeather 4), **Holy** (heal 6, healAll 6, revive 2, cleanse, shield 2, aoeShield 9),
  **Warcries / Bard** (warCry 12, encore 2, the sonic buffs), **Hexes** (debuff 32, zoneDebuff 10),
  **Vampirism** (lifeDrain 13, `raceDrainingEmbrace`, `raceSoulDrain`, `raceAbsorb`), **Necromancy**
  (raiseDead, summonUnit, cannibalize, `raceZombieRush`, `raceBoneToss`), **Mind** (possess 5,
  trickRoom, scan / remoteView, the psychic debuffs), **Doors** (the 7 wheel rows + the Door Agent's
  rows — the unique-family precedent).
- **Signature (unique) families**: every race's capstone plus its most idiosyncratic rows (the
  `_sentaiColor` set, `raceMerkaba`, `raceMegazordBlast`, `raceZigguratProtocol`, …) — Phase 6 names one
  per race.

Redundancy groups the census already shows (same kind + element + status + AOE class, dmg within 20;
the REPORT tab runs this live):
- 26 element-less single-target `damage` rows (`guardSlash`, `dragonSlash`, `sneakSlash`,
  `raceZombieRush`, `raceWeighTheHeart`, `raceBoneToss`, `raceBorrowedClaw`, `raceCrashLoop`, …) —
  most want a family and an element rider, several are one spell with a flavour.
- 9 metal single-target shots (`precisionShot`, `headshot`, `crossSlash`, `raceHydraulicCrush`,
  `raceElbowGrease`, `raceBoardingRush`, `raceToBeContinued`, `raceQuickDraw`, …).
- 7 element-less radius-1 salvos (`raceShamblingHorde`, `raceMortarSalvo`, `raceSkyscraperToss`,
  `raceMissileBarrage`, `raceBoneBarrage`, `raceArrowRain`, `sentaiMegazordBlast`) — the user's own
  example: an AOE that is an upgrade of a single-target row in the same family.
- 6 fire damage + burn single targets (`raceHeatRay`, `racePlasmaWhip`, `raceFireArrow`,
  `raceLumpOfCoal`, `sentaiRedSlash`); 5 poison + poison (`poisonDart`, `raceInfectiousBite`,
  `raceVenomFang`, `racePoisonArrow`, `raceTendrilStrike`); 5 plain lifeDrains; 5 earth throws
  (`raceBigKick`, `raceSasquatchSmash`, `raceBoulderHurl`, `raceColossalCrush`, `raceStoneThrow`);
  4 light bolts (`radiantBolt`, `raceSmite`, `raceDivineSmite`, `exorcism`); 4 plain beams
  (`raceBalefulGaze`, `raceEntropicBeam`, `raceAtomicBreath`, `raceJudgmentBeam`); 4 leap strikes;
  4 dashes; 4 earth walls (`rampart` ×2 shared, `raceShieldWall`, `raceZigguratProtocol`).
- Stands on its own by the user's rule: anything with terrain deformation (`meteor`, `sharedNuke`,
  `raceFireForEffect`, `rampart`, the 26 `terrainDeform` rows), pulls, swaps, weather, summons.
- The shared kits (`sharedFissure` ×11 races, `raceWingGust` ×10, `rampart` ×6) are families in
  embryo: the same row on many races IS "these races share the Earth family".

New spell / targeting types the census lacks (beyond the user's random + adjacent splash):
a **cone** (no cone shape exists), a **ring** used as a real spell (the shape exists, ~0 rows), **pierce
vs stop** on lines as an upgrade, a **bouncing heal** (chain on allies), **trap on a unit** (a delayed
mark that detonates on movement), **swap with an ally at range**, **randomised status** (one of a
family's statuses), **conditional damage** beyond `bonusVsStatus` (vs airborne, vs deployables, vs
full HP), **decoy / taunt** rows outside the Tank, and **weather-gated** rows (a Storm family whose rows
change under `WEATHER_REGISTRY`).

---

## 11. Log

- 2026-09-25 — the plan written from the survey (three read-only surveys: the data, the clips, the
  engine; the earlier thread's survey of the v1 editor reused); nothing built. Open questions §7 await
  the user; every phase builds the stated default until answered.
- 2026-09-25 — the user ruled: tiers and spell costs are editable in the library (Q1); equipment and
  passives merge (Q5) with **at most 2 passive / equipment rows among the 7 slots**; the 17 current
  accessories are universal (the GEAR family), later ones may be family-specific.
- 2026-09-26 — **Phase 0 shipped** (thread "Spell library Phase 0", `spell-library/ENTROPY_WARS_SPELL_LIBRARY_0.zip`,
  token `20260925-spell-library-01-cors`). data.js: `spellTierOf` reads the row's explicit numeric `tier` first
  (`spellTierDerived` is the rung fallback) and `bake-spell-mods.js --stamp-tiers` wrote `tier: N` onto all 530
  literal rows (172 legacy `'I'/'II'/'III'` strings replaced — 157 of them disagreed with the live tier);
  `SPELL_ROLES` + `spellRoleOf` / `spellRoleDerived` / `roleOverride`; `SPELL_FAMILIES` (15 elements + `gear`
  universal + `doors` unique to the Door Agent), `SPELL_UPGRADES = {}`, `RACE_FAMILIES = {}`, `spellFamiliesOf`;
  `AOE_PRESETS` (line3/line5 run THROUGH the centre so they fit the 7×7 grid) + `aoeMaskValid / aoeMaskTiles /
  aoeMaskBound / aoeMaskPresetOf`; `SPELL_DEAD_FIELDS`, `SPELL_LOS_FIELDS`, `SPELL_TIER_RULE`; `spellLint` (tierRule,
  roleDrift, elementFamily, familyUnknown, upgradeUnknown, deadField, losTriple, maskInvalid, maskVsRadius,
  tierRange, nameDup, offPool) + `spellLintAll` + `spellReport`; `stampSpellSchema()` runs at boot before the diff
  layer clones (so `role` / `families` / `upgrades` are fields, not edits) and after every `apply()`;
  `PASSIVE_SLOT_MAX = 2` declared (enforced in Phase 4). `EWSpellMods` v2: `families / upgrades / raceFamilies /
  views` groups, `import(obj, { mode: 'merge' | 'replace', pick })` — MERGE is the default, `diff(obj)` lists
  add / same / conflict rows, `export()` adds `spellNotes` + `report`, `prune()` covers the registries,
  `setOnline(on)` + the guard (online.js `applyOnlineRules` → vanilla tables; state.js `transitionTo(MAIN_MENU)`
  → mods back; map.js `_goToSpellLibrary` refuses while online; the v1 screen says "EDITS OFF — online match").
  The v1 editor edits `tier` as a number and offers `role / roleOverride / families / upgrades / aoeMask / notes`.
  Readers of the legacy string moved to `spellTierOf` (battle.js spellBlockReason, hud.js ×2, map.js
  `_cshopRenderSpells` — the old 'III' shop label = the capstone tier 4). Tests: `spell-schema.test.js` (new);
  content-schema.test.js validates the five fields and pins numeric tiers (class trees 1,2,3,4; capstones 4);
  champ-rework / door-race pins numeric. Census: 528 rows — damage 160, damageEffect 143, effect 126, heal 27,
  deploy 27, movement 28, utility 14, terrain 3; the tier rule's 7 offenders as surveyed; 68 rows carry a dead
  field (62 `equipCost`); two rows share the name "Tail Whip"; 29 off-pool. Phase 1 (THE SHELL) is next.
- 2026-09-26 — **Phase 1 shipped** (thread "Spell library Phase 1", `spell-library/ENTROPY_WARS_SPELL_LIBRARY_1.zip`,
  token `20260926-spell-library-02-cors`). THE SHELL replaces the v1 screen in ui.js (the "SPELL LIBRARY v2" block;
  the `_SLB_*` constants, `_SLB_FIELD_HELP`, the Spell Lab and its timeline are kept and still dock on
  `window._slbSetField(id, field, raw, ftype)` / `_slbLabRefreshSpell` / `_goToSpellLibrary`). What it does:
  a filter RAIL (source · roles · tier/SP · families · elements · has · lint · kinds · owner, with live counts,
  OR inside a group, AND across groups); a VIRTUALISED table (32 px rows, only the visible window is in the DOM,
  535 rows scroll at 60 fps) with the §5.2 columns, one-click sort + shift-click for a second key, priorities by
  the centre's width (`_slb2VisibleCols`: pri 2 under 1300 px, pri 1 under 1000 px, sideways scroll for the rest);
  a CARDS view; saved VIEWS (filters + sort, in `EWSpellMods.doc.views`); the INSPECTOR with STATS · TARGET ·
  EFFECTS · UPGRADES · LOOK · NOTES · RAW (the header edits name / tier stepper / MP with the ladder ghost / role
  menu / families / jobs / races / desc with AUTO + GENERATE; every field has ↺ shipped-value revert, ✕ drop,
  and a help line from `_SLB_FIELD_HELP`; statuses and bonusVsStatus are structured editors, LOS a segmented
  control, damage / heal / recoil carry the house-scale presets; the footprint preview draws the 7×7 mask through
  hud.js `_hrlgShapeTiles(shape, { max: 3 })`); DOM PATCHING (`_slb2PatchRow` / `_slb2PatchField` — an edit
  rewrites one row and one field, never the screen); 50-deep UNDO / REDO of the whole doc (`_Slb2UndoStack`,
  ⌘Z / ⌘⇧Z, the toast carries UNDO); NEW ▾ from role templates (census medians) and passive templates, plus new
  family / upgrade; BULK edit over a shift / ⌘ selection (family, tier, element, upgrade, note, delete);
  PASSIVES (family-passive rows + the INHERENT view), FAMILIES (cards + editable registry + members),
  UPGRADES (registry table + PATCH builder), POOLS (job learnsets / race rows, reorder, add by id), REPORT
  (role × tier matrix, the tier rule's offenders, lint by rule, coverage, redundancy groups, spreads, the library
  notes); EXPORT preview (markdown summary + COPY / DOWNLOAD JSON); IMPORT diff (add / same / conflict rows with
  pick, MERGE or REPLACE); ⌘K palette (fields + commands); the online guard text. styles-hud.css: the `.slb2-*`
  sheet replaces `.slb-*` (the Lab's `.slb-lab` / `.slb-tl` rules stay). hud.js: `_hrlgSpellShape` returns the
  mask first, `_hrlgShapeTiles` takes `opts.max`. Tests: `spell-library-ui.test.js` (the pure block — row model,
  footprint, columns, filters, sort, undo, ids, summary — plus the Lab-contract pins). Probe: `playtest_library.js`
  (screenshots to `shots/library/`; the run of 2026-09-26 had zero page errors). Not yet: the AOE grid editor and
  the clip dropdown with the live viewer (Phase 2, THE GRID + THE LOOK, next), random targets / splash (3), the
  passive slot rule in the rack (4), upgrades in the rack (5).
- 2026-09-26 — **Phase 2 shipped** (thread "Spell library Phase 2", `spell-library/ENTROPY_WARS_SPELL_LIBRARY_2.zip`,
  token `20260926-spell-library-03-cors`). THE GRID: the TARGET tab's FOOTPRINT is a 7×7 click grid (click / drag paint,
  right-click erases, the centre locked ON, the 14 `AOE_PRESETS` as buttons, mirror ↔ ↕, rotate, fill, CLEAR, ORIGIN
  target / self); a row without a mask shows its computed footprint and the first click converts it; the same widget,
  smaller, edits `splash.mask` when a row carries a `splash` object (Phase 3's rider). ONE DEVIATION from §5.4, on
  purpose: writing the mask does not CLEAR the radius field — it SETS the kind's radius field (`crossRadius` for cross
  kinds, `blastRadius` for bombs, else `aoeRadius`) to the mask's reach and clears only `aoeShape` / `diamond` /
  `diagonal`, because ~40 engine gates test `spell.aoeRadius` for "is this an area?" (`hasSpellTargetInRange`,
  `computeSpellManaCost`, the hud's card, the AI's scoring…); the lint `maskVsRadius` now fires only when the two
  disagree, and CLEAR restores the shipped radius / shape fields. `aoeMask` is honoured at every §6.1 site plus the
  ones the survey missed (bombs / deployed objects / delayed strikes carry the mask as plain data; zones store it and
  `_zoneTiles` / `_zoneCovers` serve the round tick, gravity, smoke and chain zones; cleanseArea, aoePull, aoeShield,
  terrainCreate flood, teleport arrival, skySlam / leapStrike splash loops; the focus plates; `previewSpellRange`; the
  ring aim for a HOLLOW mask; map.js `_hqAoeTilesHtml` and party-builder.js `pbAoeTiles` draw it; three-vfx-effects.js
  sizes rings / descents / auras by the mask's offsets). `_aoeBound` is stamped by `stampSpellSchema`;
  `_spellAoeReach(spell)` is the one battle.js reader for VFX / camera / deform radii. A single-target kind (damage,
  heal…) gets an amber note on the grid: its mask only lights tiles — area damage on it is the SPLASH rider (Phase 3).
  THE LOOK: `animVerb` / `animSlot` / `animClip` read first by `classifySpellAnimKind` (`SPELL_ANIM_KINDS` = the 58
  `_castChainFor` kinds; a slot pick rides the kind string as `'slot:<slot>/<auto>'`, decoded by `_castChainFor`;
  `'clip:<name>'` is a synthetic slot registered by sprites.js `registerSpellAnimClips` from `stampSpellSchema` and
  baked on demand by `_libBakeSlotNow` — the board warms it before the cast, the viewer through `EWCharViewer.playClip`);
  `animStrikeMs` overrides the strike lead in battle.js and the viewer. The LOOK tab: a race picker + the live
  EWCharViewer stage (▶ FULL · 🔁 LOOP · ■ · ✦ VFX), the pick in words, the strike lead, a searchable list — AUTO ·
  CAST VERBS (each with its resolved first slot + clip + library + length + strike) · SLOTS (75) · RAW CLIPS (69
  unwired, from `ThreeRenderer.devLibClips`) — hover plays, click writes ONE pick and clears the other two; TRAVEL
  (`_animOverride.travel`) moved here from the Lab; archetype · weight · projectile stay the generic LOOK fields.
  check-spell-presentation.js reads the pick. Lint: `animPick` (two picks) and `animClipInvalid`. Tests:
  `aoe-mask.test.js` (the four readers agree on every shipped aoe / cross row and on every preset over four fixture
  kinds; the shaped radius fields now draw their true cells on the card; the lint, the mana formula, `_aoeBound`),
  `spell-anim-pick.test.js`; content-schema.test.js type-checks the five new fields. The probe serves the five
  library GLBs from the repo so RAW CLIPS fills; the race model is R2-only, so the stage reads `ew-cv-fail` in the
  sandbox (the labels work; live it shows the race). Not yet: random targets / splash (Phase 3, next), the passive
  slot rule in the rack (4), upgrades in the rack (5).
- 2026-09-26 — **Phase 3 shipped** (thread "Spell library Phase 3", `spell-library/ENTROPY_WARS_SPELL_LIBRARY_3.zip`,
  token `20260926-spell-library-04-cors`). THE TARGETING: `randomTargets` and `splash` are riders on a `kind: 'damage'`
  row (any other kind ignores them; lint `riderKind` / `riderInvalid`). data.js normalisers `spellRandomTargetsOf` /
  `spellSplashOf` / `splashOffsets` / `splashTilesAround` and the pure `pickRandomTargets(pool, count, distinct, rng)`;
  `computeSpellManaCost` and `describeSpell` read them. battle.js: `_kindMeta` makes a random row selfCast + offensive;
  its POOL is `_getSpellValidTargets` of the row without the rider (`_riderBaseDef`) minus the caster, allies (unless
  scope 'units'), realm-shielded and cryptid-hidden units; doSpell draws with `engineRng` (host only, one draw per
  pick) and `_castRandomTargets` plays the caster's clip + one camera over every pick, then a volley per further pick;
  `_applySplashDamage` runs in `_applyDamageSpellHit` after the primary hit and before the post-effects (units only —
  turrets / doors / buildings on splash tiles are not hit; statuses stay on the primary hit). §7 defaults kept:
  distinct enemies (Q9), splash enemies only (Q10). Online: no new state field (the skip list needs nothing); the
  guest never re-rolls — the extra shots and the splash ring ride a new `'rider-fx'` relay (fog-gated), the damage
  rides state-sync. AI: a random row is cast on the caster once an enemy is in reach and scores mean hit × hits; a
  splash row adds the neighbours' worth and picks the victim with the most round it; check-ai-spell-dispatch.js prints
  a `riders` block. Rack / HQ: 🎲×N and SPL N% badges, a splash row's card shape; board hover previews both. The
  library's TARGET tab: structured rider editors (＋ adds the defaults) + the SPLASH grid from Phase 2; the rail's HAS
  group gains "random / splash". Example rows (registered in SPELL_BY_ID only, on no pool — keep one through POOLS or
  delete it): Scatter Shot `riderScatterShot`, Impact Round `riderImpactRound`. ONE DEVIATION from §6.2: the plan
  routed splash through `_applyAoeDamage`; it has its own unit-only resolver instead, because `_applyAoeDamage` also
  chips turrets at FULL damage, breaks doors and objects, damages buildings and paints `leaveTerrain` — a splash is a
  rider on a single-target hit, not an area cast. The `extraTargets` upgrade (next-nearest enemies) waits for Phase 5
  with the other upgrades. Tests: `spell-riders.test.js` (new), `ai-spell-routing.test.js` (+3). Not playtested live.
  Next: Phase 4 (THE PASSIVES + THE GEAR MERGE).
- 2026-09-26 — **Phase 4 shipped** (thread "Spell library Phase 4", `spell-library/ENTROPY_WARS_SPELL_LIBRARY_4.zip`,
  token `20260926-spell-library-05-cors`). THE PASSIVES + THE GEAR MERGE, as ruled: a passive row (`kind: 'passive'`)
  takes a slot and its tier in SP; **at most `PASSIVE_SLOT_MAX` = 2** per loadout — `spellAddVerdict` reason `'passives'`,
  `isTreeLoadoutLegal`, `treeLegalSubset` (the third skipped, earlier picks win — the online host's check, so nothing new
  in online.js). The 16 accessories are `GEAR_PASSIVES` rows (tier I, family `gear`, universal → `unitSpellPoolParts().gear`
  in every pool); `GEAR_ID_OF_ACCESSORY` maps the retired ids; Spelunking Gear dropped. `getUnitPassives` = inherent
  (MAX_UNIT_PASSIVES) + the equipped rows wrapped (`passiveRowWrap`). `PASSIVE_HOOK_KEYS` catalogues every hook key;
  `passiveHookLint` joins `spellLint` (hookInvalid / hookNone / hookUnknown). Consumers: `statBonus`, `regenPerRound`,
  `healOnceBelowPct`, `physicalElementRider`, `buildBonus`, `weatherBonus` / `terrainBonus` / `zodiacBonus`, plus the
  accessory behaviours as keys (`surviveLethalOnce`, `purgeDebuff`, `spellLock`, `basicEcho`, `revealInvisibleWithin`,
  `revealTrapsWithin`, `grantSpell`). The forge's ◈ PASSIVES row and GEAR boxes, the HQ rack's ◈ row and GEAR section,
  the library's structured HOOKS editor. Saves: `gearMigrateIds` folds an old `equipment` pair into the kit (createUnit's
  three kit paths, the forge, the HQ record). Test `family-passives.test.js`; hq-party / party-builder / spell-library-ui
  pins brought to the merge. Not playtested live. DEVIATIONS, on purpose:
  1. A passive row never sits in `unit.spells`: createUnit moves it to `unit.passiveRows` (ids, ride the snapshot), so no
     spell menu, AI scorer or cooldown path ever meets one. `unit.equipment` is KEPT as the display mirror of the gear rows
     (sprites, badges, the inventory's one-use flare / ward) — the truth is `passiveRows`; `unitHasAccessory` stays as a
     thin reader of the rows for the six map-side gear flags (jetpack flight, binoculars, walkie, flare, ward, telescope),
     which are not hook keys.
  2. The accessory behaviours became hook keys named for what they do (`purgeDebuff`, `basicEcho`, `revealTrapsWithin`, …),
     not §4.5's examples (`mpOnHit`, `cleanseOnTurn`), so any family passive can reuse them.
  3. `physicalElementRider` is read in `applyDamageToUnit` (a physical hit with no element takes it: affinity + combos),
     not `getSpellElement` — the cast's own terrain reaction still follows the spell's element.
  4. `weatherBonus` / `terrainBonus` / `zodiacBonus` are STAT STAGES added in `getStatStageCount` (the Phase 1 templates'
     shape `{ storm: { atkStages: 1 } }`), not multipliers in `getEffectiveAttackBonus`; zodiac keys take a sign, an
     element's three signs, or `'own'`.
  5. AI kits (`buildTreeLegalLoadout`) may roll gear rows (weight 1, capped); the per-job accessory prefs are gone.
  6. The library's NEW ▾ passive defaults to the `gear` family (equippable by every unit at once); retag to scope it.
  7. Fixed a Phase 1 bug: the library's popovers / modals sat outside its click delegation (dead buttons).
  Next: Phase 5 (THE UPGRADES).
- 2026-09-26 — **Phase 5 shipped** (thread "Spell library Phase 5", `spell-library/ENTROPY_WARS_SPELL_LIBRARY_5.zip`,
  token `20260926-spell-library-06-cors`). THE UPGRADES, on the §7 Q3 defaults (own SP price each, at most 2 per spell,
  7 slots / 16 SP, local mods off online). data.js: `SPELL_UPGRADES` seeded with 14 rows (the user's list — +15 % dmg,
  ricochet, +1 target ×0.5, status bonus, knockback / blowback, AOE preset, −10 MP, +1 deployable, turret ×, gun × — plus
  Widen for area casts, +1 range, +1 status round); `SPELL_UPGRADE_MAX = 2`; `spellUpgradeFits` / `spellAllowedUpgrades`;
  `spellUpgradeVerdict`; `treeLegalUpgrades` (the repair); `loadoutSpUsed(ids, ups)`, `spellAddVerdict(…, ups)`,
  `isTreeLoadoutLegal(…, ups)`; `resolveSpellDef` / `resolveUnitSpellDef` (pure; every §4.4 patch key);
  `buildRandomUpgrades`; the lint `upgradeOffFit`; the HQ's `hqPartyUpgradeClick` + the circuit's `upgrades` model.
  Engine: map.js createUnit repairs `meta.spellUpgrades` on the kept kit and builds the derived defs into `unit.spells`
  (`unit.spellUpgrades` holds the ids; the snapshot carries both, no new relay); online.js's party-config receipt runs the
  same repair host-side; battle.js `_applyUpgradeRiders` (Ricochet bounce + Forked extra targets) after the splash, the
  'bounce' rider-fx (relay gains `fromId`); the door gun reads its owner's derived row. UI: the forge's ⚙ cell + the
  technique panel's toggles, the HQ pause rack's ⚙ UPGRADES block, hud.js ⚙n / ↯ / ⑂ badges, the library's UPGRADES tab
  (mode, TRY pair, fit per row) and the registry editor's requires / excl / auto. Test `spell-upgrades.test.js`;
  spell-schema.test.js brought to the seeded registry. Not playtested live. DEVIATIONS, on purpose:
  1. **An empty `upgrades` list means AUTO, not none** (§4.4 said "empty = none"): with every shipped row at `[]` until
     the Phase 6 catalogue, "none" would have shipped a feature no player could reach. AUTO offers every registry row
     with `auto !== false` that FITS the spell; a row pins a CUSTOM list in the library, or NONE with
     `upgradesAuto: false`. The registry rows gained `requires` (a `SPELL_UPGRADE_FITS` test — the patch only means
     something on such a row), `excl` (one of a kind per spell: Ricochet / Forked / Blast / Widen are `spread`) and `auto`.
  2. **No `getDeployCap`**: the nine `maxActivePerCaster` reads already take the spell object, which is now the derived
     def; Surplus is offered only on rows with an explicit cap (`requires: 'deployCap'`), so the per-site kind defaults
     never apply to an upgraded row. The turret reads take the derived `turretDmg` / `turretHp` / `turretRange` the same way.
  3. **The ⚙ opens the forge's technique panel** (the inspector already under the rack) instead of a new popover; the HQ
     pause rack shows the toggles inline under ◈ PASSIVES.
  4. **Ricochet is its own rider** (`ricochetRider`, resolved in `_applyUpgradeRiders` with `calcBounceTarget`), not
     `_applyRicochetDamage`, which lands its own primary hit and needs `kind: 'ricochet'`.
  5. **The AI's spend is `buildRandomUpgrades`**, called where a CPU / RANDOM kit is rolled (state.js
     `applyRandomSpellsAndSecJob`, the forge's RND, the HQ's RANDOM); `buildTreeLegalLoadout` still returns an id list.
  6. **`describeSpell` is untouched**: the derived def's `desc` gains "Upgrades: Empowered (+15 % damage), …"; the library
     shows a TRY pair's resolved numbers instead of ▶ LAB WITH THESE.
  Next: Phase 6 (THE CATALOGUE — the user's second deliverable).
- 2026-09-26 — **Phase 6 shipped** (thread "Spell library Phase 6", `spell-library/ENTROPY_WARS_SPELL_LIBRARY_6.zip`, token
  `20260926-spell-library-07-cors`), from the user's own library export (`entropy-wars-spell-mods-2026-09-26.json`: 90 families,
  359 row edits, 5 spells and the Metal family deleted), baked FIRST; where this plan and the export disagree the export won.
  The user's asks: a bigger ✕ on the FAMILIES member list; POOLS selects families, not spells (Phase 7's direction pulled
  forward); families for every unassigned spell following the user's pattern; families for every unit, 3 to 10 each; a spell in
  exactly one family. Built: 13 new families (Living Stone, Human Grit, Main Character Energy, Deep Sea Anatomy, Prism Lattice,
  Infernal Court, Horns & Hooves, Apex Predator, Grave Hunger, Kaiju Rampage, Ooze Biology, Sentai Colors, Symbiosis); 145 rows
  re-tagged to one family (125 with none, 14 on the deleted Metal, the 2 with two — each kept the user's pick); `RACE_FAMILIES`
  for all 103 races (3–5 each, every RACE_TREE rung inside them); the pool = the tree row + every member of the race's families
  (`unitSpellPoolParts`, `familyMemberIndex`); the POOLS · RACE FAMILIES editor; lint `familyMulti`; SPELL_CATALOGUE.md (the
  generated family / race table). Tests: `spell-families.test.js` (new); spell-schema, content-schema, champ-rework and
  capstone-director pins brought to the export. DEVIATIONS, on purpose:
  1. **Phase 6 was to be a proposal the user edits before anything is baked** (§9); the user asked for the families to be made
     and assigned, so they are baked and live. Every assignment is editable in the library (FAMILIES / POOLS) and re-exportable.
  2. **Phase 7's pool rule is in, its UI is not:** the pool reads `RACE_FAMILIES`, but the rack is still grouped by tier (not by
     family), the Freelancer still borrows by race row, `RACE_TREE` stays (the rungs, the twins, the ring MP prices) and is kept
     inside the families. The user's 3–10 replaces §4.2's 3–5; no family is `unique` (the user's own families set none).
  3. **The redundancy verdicts, per-family upgrade lists and new-spell proposals of §9 row 6 are not in this delivery** (the
     user asked for the categorisation and the pools); the REPORT tab's redundancy query still lists the groups.
  4. **The element-family rule is retired:** the user moved rows out of their element's family (Lightning → Engineering …),
     so `elementFamily` fires only on a row with no family, and a second family is the red `familyMulti`.
  5. **The five deleted spells' tree rungs** took rows of the races' families: reptilian capstone Flat Earth, chosen one R2 Plot
     Armor, anubis R2 Rigormortis, mothman R3 Cryptid Vanish (R1 twins Red Eyes / Dread Aura), popstar R2 Stage Dive alone.
  6. **Bake fixes:** a row a movepool edit drops now MOVES to SPELL_LIBRARY (the export took Green Arrow off the sentai's list
     after re-making it as a heal; deleting it would have lost the edit) — a delete is `deleted`; an empty registry takes its
     rows as one block; two inserts at one spot keep their order.
  7. **The pool's order:** tree row, then the job's four, then the family members, so a job row that sits in a race family
     (Brave Charge in Knighthood) keeps its JOB source in the racks. sprites.js `SPELL_ANIM_VERBS` and battle.js
     `SPELL_DIRECTOR_ROWS` dropped the deleted ids (their capstone director entries stay, unreachable).
  Next: Phase 7's UI (the rack by family, the Freelancer's borrow window by family) once the user has played the pools.


- **2026-09-26 · THE IDENTITY GENERATOR** (not a numbered phase; the user's ask in the thread "Spell library identity
  generator": "an identity generator for any 3 combination of spell families … Krampus: Christmas Spirit, Horns & Hooves,
  Blood Magic, Trickery"). Zip `spell-library/ENTROPY_WARS_SPELL_LIBRARY_IDENTITY.zip`, token `20260926-spell-library-08-cors`.
  1. **The creative half is written, not generated:** the game has no AI at runtime, and a pure mashup of family names reads
     like Mad Libs. So ui.js's DOM-free `SLB IDENTITY` block holds `SLB_IDENTITY_KITS` (every family: who / epithets / look /
     vibe, `|`-separated) and `SLB_IDENTITY_ARCHETYPES` (241 written archetypes, 3-4 families each; the user's seven first).
  2. **The IDENTITY tab** (between POOLS and REPORT): pick 1-4 families (chips, a filter, 🎲 RANDOM, or click an archetype).
     The result: the archetypes WRITTEN FOR THIS COMBO (every pick in it, or all of it in the picks), a name + concept + look
     COMPOSED FROM THE KITS (seeded; ↻ REROLL walks the noun family, the epithets and four name shapes), the SIGNATURE SPELL of
     each family (its top tier), how the pool PLAYS (member roles folded into damage / control / support / mobility /
     building), CLOSE archetypes (two shared), the RACES ON THIS COMBO (two shared) and PAIRS WELL WITH (families beside the
     picks in the archetypes). ⧉ COPY puts it on the clipboard as text. It writes nothing to the doc.
  3. **The IDENTITY KIT editor:** the FAMILIES inspector has four fields (who, epithets, look, vibe). A filled field is the
     family row's `identity: { who: [...], … }`, written through the families registry, so it rides undo, the export and the
     bake; blank keeps the written words (shown as the placeholder). A family with neither (new in the library) falls back to
     its name minus "Magic / Abilities / …", its description and its top members.
  4. A RACE flag marks an archetype whose name is already a race (Kraken, Siren, Yeti …). Test spell-identity.test.js pins a
     kit for every live family, the archetypes' families, the user's seven examples as written matches and the seeding.

- **2026-09-26 · Phase 7 shipped** (thread "Spell library, Phase 7", `spell-library/ENTROPY_WARS_SPELL_LIBRARY_7.zip`, token
  `20260926-spell-library-09-cors`). THE FAMILIES AS POOLS, on the §7 Q2 default (families REPLACE `RACE_TREE` as the pool):
  1. **The pool** (data.js `unitSpellPoolParts`): the race part is the members of the race's families only; `RACE_TREE` is no
     longer read for the pool (it stays the source of the rungs' MP ring, the twins and the DEFAULTS kit, and every rung sits in
     the race's families). `spellReachableIds` (the lint's `offPool`) reads the families, not the tree rows. Old saves repair
     through `treeLegalSubset` as before (an id off the new pool is skipped, never a crash; the online host runs the same check).
  2. **Unique families:** `spellFamilyIsUnique`; `raceFamilyIds` drops a family unique to ANOTHER race, and no Freelancer borrows
     one. No new unique families were authored (the user's own families set none; only the door wheel is unique).
  3. **The Freelancer borrows by family:** `flBorrowFamilyIds(race)` = every family an (owned, in story scope) other race carries,
     minus its own, unique and universal ones; `flRacePool` = their members (minus job rows, as before). The job borrow
     (`flWildcardPool`) is unchanged.
  4. **The racks fold by family** (the default) or by tier, one per-viewer choice shared by the forge and the HQ pause rack
     (localStorage `ew_rack_group`): data.js `spellFamilyGroups(ids, race)` folds a list (the race's families first in its
     RACE_FAMILIES order, then others by name, tier I → IV inside). Forge: the FOLD toggle, a row per family (colour edge, glyph,
     name, n ON), the keyboard grid follows the fold, a Freelancer's one ＋ BORROW row (key `B0`, every tier). HQ: the same FOLD,
     `hqPartyTreeCircuit().families` + `borrowAll`, `hqPartySocketPool(m, 'B0')`. Both borrow windows list family by family with
     a header per family; the forge's gains a TIER filter in the family fold, and a family's name finds its members in search.
  5. **The codex's family page:** the dossier's DOCUMENTED CAPABILITIES reads family by family (ui.js `_codexBuildFamilies`),
     each technique with its tier and numbers; RACE_ABILITIES is the fallback. The library's POOLS page now flags a tree rung
     outside the race's families in red (it is no longer equippable).
  NOT DONE, left for the user: **job families** — §7 Q2's "job learnsets become the jobs' families" would put every member of a
  job's families in its pool (a Warrior's four sit in Knighthood, Sonic, Earth and Light, 33 rows); the job part stays the job's
  four until the user rules. The Phase 6 thread's suggested family merges / renames / splits are untouched. Tests:
  `spell-families.test.js` (+5 Phase 7 tests); hq-intake / hq-party / party-builder / spell-tree-ux pins brought to the family
  pool and fold. Probe: `playtest_builder.js p7` (the forge's TECHNIQUES tab folds by family, no page errors).
