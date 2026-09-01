# ELEMENTAL_TYPES_PLAN.md — Elemental affinities (weak / resist / immune / absorb)

Status: **P0+P1+P2 SHIPPED** (2026-09-01). P3 (knowledge UI: inspect-panel
resist row, codex grid, forecast badges) and P4 remain open. This doc is the
anti-"start over" memory for the elemental-types feature.

## DECISIONS (2026-09-01, from the user)
1. **Multipliers**: weak ×1.5 / resist ×0.5 / immune ×0 / absorb→heal. Locked.
2. **Knowledge model**: affinities always visible (no discovery mechanic).
3. **Water→wet**: YES — implemented as ONE central hook in applyDamageToUnit
   (every water-element damage hit calls `_soakUnit`, douses burn, sets up
   conduction/flash-freeze). No per-spell wiring, future water spells inherit.
4. **Lightning↔stun**: stun is lightning's PAIRED status — as a *rider*
   coupling only (ELEMENT_RIDER_STATUS): a stun applied by a lightning-element
   hit is subject to lightning affinity; a psychic/other stun is not. Not
   every lightning spell applies stun (raceStunRay + raceTaserBolt do).
5. **No press-turn coupling.** Element results never grant or deny press.
6. **Arcane clarified**: it is just a flavor tag like the other nine —
   elementally NEUTRAL, exactly like an untagged spell. The "almighty"
   framing only means: never promote it to a combat element. The element
   layer never touches the type chart — an arcane anomaly spell vs an unholy
   unit resolves the type matchup + STAB exactly as before; elements only
   ever ADD a second multiplier for the six combat elements. Secondary
   always, override never.

## IMPLEMENTED (2026-09-01) — what shipped where
- data.js: SPELL_ELEMENTS / COMBAT_ELEMENTS / ELEMENT_AFFINITY_TIERS /
  ELEMENT_AFFINITY_MULT / ELEMENT_ICONS / ELEMENTAL_STATUS /
  ELEMENT_RIDER_STATUS / statusAffinityElement / RACE_ELEMENT_AFFINITY /
  getRaceElementAffinity / unitElementAffinity (all exported on window),
  new doc comment above SPELL_LIBRARY, poison DoT tick tagged
  spellElement:'poison', 32-spell tagging pass (ice 4, lightning 4, water 3,
  poison 8, fire 4, earth 5 incl. golem's dup Boulder Hurl, sonic 4) +
  deliberate-none note on Atomic Breath.
- battle.js: getSpellElement (tag-first, 15 values, exported) with
  classifySpellElement now a thin reaction mapper over it (ice→cold; a tag
  can no longer be regex-overridden); `spellElement` threaded through every
  spell-damage call site (incl. _delayedSpells records); pure
  calcElementAffinityMult beside calcElementComboMult; applyDamageToUnit:
  affinity derivation (spellElement || mapped opts.element), absorb merged
  into the Thermal Regen drink path, immune early-out (IMMUNE float, block
  SFX, no statuses), weak/resist folded into the capped _offMult with
  callouts + log lines, combo element now derived from spellElement too,
  status payloads stamped with _element, central water→soak post-hit hook;
  applyStatusPayload elemental status-immunity gate beside immuneStatus.
- state.js: getStatusApplyChance affinity coupling (resist ×0.5 outside the
  0.6 floor, immune/absorb → 0); delayed-spell detonations pass
  spellElement + stamp _element on their status payloads.
- ui.js: _estimateSpellDamage mirrors affinity (immune/absorb → 0 forecast,
  weak/resist inside the capped product).
- ai.js: estDamage mirrors affinity (immune/absorb → 0 beside the
  healedByElement check; weak/resist in the capped product) — the AI hunts
  weaknesses and avoids walls with no new behavior code.
- Tests: damage.test.js (calcElementAffinityMult in CALC_FNS + delegation +
  tier table vs data.js), content-schema.test.js (tag vocabulary, affinity
  table validity/sparseness, coupling maps, weakness-exploitability ≥5,
  kaiju absorb↔Thermal Regen agreement). Full `npm test`: 76 pass.

Original proposal follows (audit + design rationale + the P3/P4 backlog —
file:line anchors are from the 2026-09-01 pre-implementation audit).

---

## 0. TL;DR

- Spells already carry an `element:` tag (219 of 448 spells, 15 values,
  documented at data.js:3707). Today it is **VFX-only** — the engine's
  `classifySpellElement` (battle.js:2241) only honours `fire`/`lightning` and
  emits `'cold'` (not `'ice'`), so **189 of the 219 tags are invisible to combat**.
- The engine already contains every building block of an SMT-style system:
  a per-element multiplier table (`calcElementComboMult`, battle.js:203 —
  lightning+soaked ×1.5, lightning+dry-tech ×0.5+Overclock, fire+soaked ×0.75),
  an absorb tier (`healedByElement`, kaiju's Thermal Regen), elemental statuses
  (burn/frozen/poison), terrain reactions, and elemental tile casts.
- Plan: split the 15 tags into **6 COMBAT elements** (fire, ice, lightning,
  water, poison, earth) that enter a sparse per-race affinity table
  (`weak ×1.5 / resist ×0.5 / immune ×0 / absorb → heal`), and keep the other 9
  as **FLAVOR** tags (VFX/filters only) that can be promoted later. `arcane`
  is explicitly the "almighty" escape valve — never resisted, never boosted.
- The multiplier slots into the capped `_offMult` product right after the type
  chart (battle.js:20147), as a pure function next to `calcElementComboMult` so
  `damage.test.js` guards it. It must be mirrored in the 3 UI forecast
  estimators and the AI damage oracle or previews/AI desync.
- Before any of that lands, a **content pass**: ~60–70 of the 135 untagged
  damage spells have obvious elements; lightning (3 tagged damage spells),
  water (3 distinct) and ice (6) need the tagging pass + a few future spells
  to be viable weakness axes.

---

## 1. Why do this (design goals)

1. **A second tactical axis, orthogonal to the type chart.** The main types
   (human/divine/unholy/anomaly/tech/alien) are *identity*: fixed per race,
   symmetric wheel, drive drafting/team-building, rewarded via STAB. Elements
   are *payload*: chosen per equipped spell. A divine fire spell and an unholy
   fire spell hit the type chart differently but the fire affinity identically
   — exactly the "divine spell that does fire damage OR unholy spell that does
   fire damage" goal. Types decide who you bring; elements decide which tool
   you use this turn.
2. **Loadout depth.** Spells are equipped (equipCost) — coverage vs STAB
   becomes a real deckbuilding decision (bring Thunderbolt for the sea races
   even though it's off-type for your Black Mage's race).
3. **Race identity beyond stats.** 96 races currently differ by stats, kit and
   2 type slots. "Yeti drinks ice, burns like kindling" is cheap, legible
   identity — and the roster's `biomes` field already encodes most of it.
4. **Unifies scattered hardcoded systems.** Soaked-shock, dry-tech Overclock,
   soaked-fire, Thermal Regen absorb, zodiac resonance, terrain reactions —
   all one-off element mechanics today. An affinity layer makes them one
   legible system instead of secret tech.
5. **A lever for future spells.** Every new damage spell gets an element and
   automatically plugs into affinities, statuses, VFX theming and AI scoring.
6. **The AI exploits it for free.** `estDamage` (ai.js:346) mirrors the damage
   pipeline; once the multiplier is mirrored there, the AI hunts weaknesses
   with no extra behavior code.

## 2. What exists today (audit, 2026-09-01)

### 2a. The tag
- `element:` on 219/448 spells (62 SPELL_LIBRARY + 386 unique RACE_ABILITIES).
  Doc comment data.js:3707-3713 declares it "organizational, NOT a combat type".
- Damage-dealing spells (dmg>0 / dashDamage / turretDmg / hitDamages /
  type==='damage'): **268 total, 133 tagged / 135 untagged (50.4%)**.
- Tagged damage spells per element: metal 24 · light 16 · fire 15 · earth 14 ·
  psychic 9 · arcane 8 · shadow 8 · water 6 (only 3 distinct — the sea-race
  trio is shared by 5 races) · poison 6 · ice 6 · nature 5 · wind 5 · blood 5 ·
  **lightning 3 · sonic 3**.
- 9 races have **zero** element-tagged abilities: ai, barbarella, honda civic,
  juggernaut, minotaur, necromancer, santa clause, super sentai, symbiote.

### 2b. The engine gap (fix first)
`classifySpellElement` (battle.js:2241-2249, exported on window at 2253):
- `_ELEMENT_REGEX` has only 3 keys, so the tag is trusted **only** for
  `fire`/`lightning`; everything else falls to a name-regex that outputs
  `'lightning'|'fire'|'cold'|null`. Over the real 448 spells: null 411,
  fire 17, lightning 12, cold 8.
- Actively misclassified (regex beats tag): `radiantBolt` (light→"lightning",
  "Bolt"), `raceSuppressiveFire` (metal→"fire"), `raceHailMary` (wind→"cold",
  "Hail").
- Ice-tagged but invisible (name lacks a keyword): `racePermafrost`,
  `raceAvalancheStrike`, `raceAbsoluteZero`.
- Several resolvers never thread `opts.element` at all: cross, barrage, bomb,
  delayed, lifeDrain, dash, leapStrike (battle.js:4281-5000 region);
  `doAttack` passes no element (battle.js:42294) — fine, basic attacks stay
  elementless (see §3e).

### 2c. Existing elemental mechanics (precedents to build on, not break)
- `calcElementComboMult` (battle.js:203-221, PURE block, unit-tested at
  damage.test.js:207): lightning+soaked ×1.5 "SOAKED!"/"SHORT CIRCUIT",
  lightning+dry-tech ×0.5 + Overclock buff ("SUPERCHARGED"), fire+soaked ×0.75.
  Folded into the capped `_offMult` at battle.js:20256-20269.
- Absorb tier precedent: `healedByElement:'fire'` on PASSIVE_DEFS.thermalRegen
  (data.js:2541, kaiju) — damage becomes healing, early return at
  battle.js:20066-20084; AI respects it (ai.js:354-359).
- Post-hit combos: ice+wet → stun (FLASH-FREEZE), fire+wet → clears wet
  ("Dried out"), fire vs frozen → thaw (battle.js:20563-20593); fire cannot be
  applied to a soaked unit (battle.js:6049-6055).
- Zodiac resonance ×1.25 keyed to fire/lightning/cold (battle.js:2364-2371,
  20242-20252).
- Elemental tile casts `_elementalTileCastInfo` (battle.js:3141) — HM-style
  lightning→water/metal, fire→ice/trees, cold→water.
- Terrain reactions `_reactLightningWater` / `_reactFireForest` / etc.
  (battle.js:2658+).

### 2d. The type chart being layered under
- `TYPE_CHART` data.js:152-183 (`resists:` field is display-only dead data —
  codex ui.js:7605 is its only consumer); `STAB_MULTIPLIER = 1.25` data.js:185.
- `getTypeDamageMultiplier` (state.js:3034): strong ×1.30, weak ×0.75,
  dual-type cancels to ×1.0, × STAB 1.25. Applied at battle.js:20146-20147
  inside `_offMult` (cap `MAX_OFFENSIVE_MULT = 3.0`).

### 2e. Status system hooks
- `STATUS_DEFS` data.js:8329-8942 (37 statuses; no element field, no resist
  field). Clean element pairings already in the content: fire→burn (5/5 of
  fire's status appliers), ice→frozen (ice spells are the ONLY frozen
  appliers), poison→poison. Leaky: 12 untagged spells apply burn, 8 apply
  poison (auto-tag candidates). Lightning applies no stun/shock anywhere;
  water spells apply slow (never wet — wet comes from terrain/weather only).
- Stick chance is centralized: `getStatusApplyChance` (state.js:3404-3431),
  per-status base table + INT diff modifier — **the** hook for "resist also
  hardens against the paired status".
- Only existing immunity mechanism: `immuneStatus` on passives, checked by
  `unitPassiveBlocksStatus` (data.js:2621) from `applyStatusPayload`
  (battle.js:6061-6067).

### 2f. Race data shape
`RACE_PROFILES` (data.js:2008-2505, 96 races): `{label, faction, types[]}` +
runtime-injected `biomes`. **No resist/affinity field exists anywhere.**
Sibling tables keyed by race id are the established pattern (RACE_PASSIVES,
RACE_BASE_STATS, RACE_ABILITIES...). Units copy race identity in `createUnit`
(map.js:7332), but the cleaner runtime-read pattern is a live helper like
`unitPassiveValue` (data.js:2614) — no serialization changes, automatically
parity-safe online.

### 2g. Content bugs found during the audit (fix in the tagging pass)
- Duplicate spell id `raceBoulderHurl`: giant's copy is `element:'earth'`,
  golem/king kong's copy is untagged — one loses the `SPELL_BY_ID` race.
- Duplicate spell id `raceAbsolution` (seraphim vs priest, both untagged).
- The 3 regex misclassifications and 3 invisible ice spells listed in §2b.

---

## 3. Design

### 3a. Two tiers of elements
- **COMBAT elements** (enter the affinity chart): `fire, ice, lightning,
  water, poison, earth`. Chosen because each has (or nearly has) a status
  pairing, engine machinery, and enough spells after the tagging pass.
- **FLAVOR elements** (VFX/filter only, exactly as today): `light, shadow,
  psychic, sonic, arcane, metal, nature, wind, blood`. All 15 tags stay valid
  on spells; only combat elements are consulted by the affinity table, so a
  flavor element can be **promoted later purely by adding data** (affinity
  rows + maybe a status pairing) — this is the "seamless with future spells"
  property.
- Rationale for the exclusions:
  - `light`/`shadow` would double-count the divine/unholy type chart (undead
    are already unholy-typed and weak to divine spellType). Keep the holy-war
    fantasy in the type chart.
  - `metal` (24 dmg spells, 23 physical — guns & blades) is a weapon tag;
    making it resistable creates stealth physical-resist on top of DEF and
    nukes Gunslinger/Sniper kits. Never promote.
  - `arcane` is the **almighty** slot: raw magic that no affinity touches.
    Gives future spell design an escape valve vs resist-stacking, exactly like
    SMT's Almighty. Document on the tag: "arcane is never weak/resisted".
  - `psychic` is the best future promotion (9 dmg spells; mindless/machine
    immunity is great flavor); `sonic` next once the siren kit is tagged
    (its 4 sonic-flavored attacks are all untagged today). `wind`, `nature`,
    `blood` stay flavor indefinitely unless content grows.

### 3b. Affinity tiers & multipliers
Stored as strings (legible, schema-checkable), resolved through one map:

```js
// data.js — next to TYPE_CHART
const ELEMENT_AFFINITY_MULT = { weak: 1.5, resist: 0.5, immune: 0 };
// 'absorb' is not a multiplier — it converts damage to healing (see 3d)
```

- **weak ×1.5 / resist ×0.5 / immune ×0 / absorb → heal.** Deliberately wider
  than the type chart's ×1.30/×0.75 so the two layers read differently in
  play: types are a steady lean, element hits are dramatic swings (the SMT
  feel). Both live inside the capped `_offMult` product (cap 3.0), so worst
  case type-strong × STAB × elem-weak = 1.30×1.25×1.5 ≈ ×2.44 pre-cap — big
  but bounded.
- **Neutral is the default.** The table is sparse: most races have 0–2
  entries; immune/absorb are signature-only (a handful of races). No race
  gets more than 2 weaknesses or 3 non-neutral rows total.

### 3c. Data shape

```js
// data.js — sibling table, same pattern as RACE_PASSIVES
const RACE_ELEMENT_AFFINITY = {
    yeti:      { ice: 'resist', fire: 'weak' },
    'ice queen': { ice: 'immune', fire: 'weak' },
    robot:     { poison: 'immune', water: 'weak' },
    // ... (§4)
};
// data.js — runtime read, exported on window like unitPassiveValue
function unitElementAffinity(unit, element) {
    const race = unit && (unit.race || (unit.baseUnit && unit.baseUnit.race));
    const t = race && RACE_ELEMENT_AFFINITY[race];
    return (t && t[element]) || null;   // 'weak'|'resist'|'immune'|'absorb'|null
}
```

Live read, not stamped on the unit instance → nothing new in state-sync, and a
data.js balance patch retunes affinities without touching save/serialize.
(If per-unit overrides are ever wanted — equipment that grants a resist — add
an `unit.elementAffinityOverride` merge in this one helper.)

### 3d. Damage math

```js
// battle.js PURE DAMAGE MATH block (~line 221, next to calcElementComboMult)
function calcElementAffinityMult(affinity) {
    if (affinity === 'weak')   return { mult: 1.5, note: 'elemWeak' };
    if (affinity === 'resist') return { mult: 0.5, note: 'elemResist' };
    if (affinity === 'immune') return { mult: 0,   note: 'elemImmune' };
    return { mult: 1, note: null };
}
```

- Applied in `applyDamageToUnit` immediately after the type-chart line
  (battle.js:20147), folded into `_offMult`. NOT post-armor — PLAYTEST_NOTES
  2352-2356 records why (the old post-armor elemental layer evaporated
  defense).
- **absorb**: handled where `healedByElement` already is
  (battle.js:20066-20084) — extend that early-out to also consult
  `unitElementAffinity(target, element) === 'absorb'`. Migrate
  thermalRegen's `healedByElement:'fire'` to `kaiju: { fire: 'absorb' }` and
  keep the passive for its other bits (immuneStatus burn), or leave both and
  check affinity first — either way ONE code path does absorption.
- **immune (×0)**: short-circuit like absorb (skip floaters/status/press), show
  `IMMUNE` float (precedent: the immuneStatus IMMUNE float, battle.js:6061-6067).
- **Stacking rules** (document in code):
  - Type chart × STAB × element affinity × soak/tech combos all multiply
    inside the capped product. Emergent play is intended: soaking your own
    fire-weak unit tempers fire (1.5 × 0.75); a soaked lightning-weak aquatic
    takes 1.5 × 1.5.
  - The existing dry-tech ×0.5+Overclock combo is mechanical races' lightning
    identity — therefore mechanical races stay lightning-NEUTRAL in the
    affinity table (§4) so the conditional wet/dry dynamic keeps mattering.
- **Callout/forecast honesty**: back the element multiplier out of the blended
  note exactly like STAB is backed out of `getTypeCombatNote`
  (state.js:3060; the trap is documented at battle.js:20149-20165 and
  JRPG_FLOW_ANALYSIS.md:185-210). New callouts via `_multCallout`
  (battle.js:20108): `×1.5 FIRE WEAK!` / `×0.5 RESIST` / `IMMUNE` / `ABSORB`.

### 3e. Scope of what carries an element
- Damage spells: element from the tag (via the new `getSpellElement`, §6 P0).
- Basic attacks: **elementless, always neutral** — the safe fallback tool
  (SMT's un-resisted Phys niche without adding a phys element). This also
  keeps the 9 no-element races functional on day one.
- DoT ticks: burn already passes `element:'fire'` (data.js:8375) — affinity
  applies to DoTs automatically (a fire-resist unit takes half burn tick;
  immune takes none). Poison DoT gets `element:'poison'` in the tagging pass.
- Terrain/weather damage (lava, drowning, blizzard): tag their
  applyDamageToUnit calls with the obvious element — affinity covers them for
  free (lava vs kaiju already heals via the fire path today).

### 3f. Status coupling
In `getStatusApplyChance` (state.js:3404), after the base/INT math:

```js
const PAIRED_STATUS_ELEMENT = { burn:'fire', frozen:'ice', poison:'poison' };
// resist → ×0.5 stick chance, immune/absorb → 0, weak → +0.10 (pre-clamp)
```

Start with only the 3 clean pairs (fire/burn, ice/frozen, poison/poison).
Water→wet and lightning→shock are NOT pairs today (no spell applies wet; no
shock status exists) — see §11 open questions before inventing one.

### 3g. What makes elements distinct from the main types (the answer, condensed)
| | Main types | Elements |
|---|---|---|
| Attached to | the UNIT (race identity, 1–2 slots) | the SPELL (payload) |
| Structure | closed 6-wheel, symmetric, everything matters | sparse per-race exceptions, mostly neutral |
| Magnitude | ×1.30 / ×0.75, steady | ×1.5 / ×0.5 / 0 / absorb, spiky |
| Rewarded by | STAB ×1.25 (identity casting) | no STAB — coverage is the reward |
| Drives | drafting / team comp | loadout + per-turn tool choice |
| Extra hooks | press turns, XP bonus | statuses, terrain, weather, combos |
No elemental STAB, ever — that would collapse the two layers into one.

---

## 4. Starter affinity table (PROPOSAL — tune freely, keep sparse)

Guided by `biomes` + kits. Clusters, with per-race rows to be written in
data.js when implemented:

- **Polar** (`polar` biome): yeti `{ice:resist, fire:weak}` · ice queen
  `{ice:immune, fire:weak}` · santa clause `{ice:resist}` · loch ness monster
  `{ice:resist, water:resist, lightning:weak}`.
- **Aquatic** (`deep_sea`): siren / mermaid / atlantean / kraken
  `{water:resist, lightning:weak}` (stacks with soaked-shock — intended
  glass-cannon-vs-storms identity). Pirate stays neutral (sailor, not fish).
- **Infernal** (`infernal`): demon, demon prince/princess, halfdemon, fallen
  angel, overlord `{fire:resist, ice:weak}` (demon also `{poison:resist}`).
  Goatman `{fire:resist}`.
- **Undead**: skeleton `{poison:immune, fire:weak}` · zombie `{poison:resist,
  fire:weak}` · ghost `{poison:immune}` · vampire `{fire:weak}` · necromancer
  `{poison:resist}` · ghoul `{poison:resist}` · gargoyle (stone, not flesh)
  `{poison:immune, earth:resist}`.
- **Mechanical** (`neon_city`/tech): robot, android, droid, ai, honda civic,
  mech `{poison:immune, water:weak}` — water is the anti-machine element
  (gives thin water offense a real niche); **lightning stays neutral** so the
  existing dry=Overclock / wet=short-circuit dynamic remains their story.
  Cyborg/super sentai (half-flesh): `{poison:resist}` only.
- **Stone & earth**: golem `{poison:immune, earth:resist, water:weak}` ·
  giant `{earth:resist}` · cyclops `{earth:resist}`.
- **Beasts & wilds**: dragon `{fire:resist, ice:weak}` · dinosaur `{ice:weak}`
  (ice age) · kaiju `{fire:absorb}` (replaces/mirrors thermalRegen) ·
  king kong, bigfoot `{earth:resist}`.
- **Everyone else: neutral.** Humans and most divine/anomaly races carry no
  rows — neutrality must stay the common case or the chart becomes homework.

Balance invariants for whatever the final table is (§7 tests):
1. Every weakness is exploitable — at least ~8 reasonably accessible damage
   spells of that element exist after the tagging pass.
2. No race is element-weak to the same axis its TYPE is weak to in a way that
   makes a common kit hit it >×2.2 pre-cap (spot-check the big overlaps).
3. Mirror of BALANCE_NOTES.md:443 ("every race retains ≥1 STAB damage move"):
   every race keeps ≥1 damage option not resisted/absorbed by any single
   common defensive cluster (basic attacks satisfy this floor automatically).

---

## 5. Content pass — tagging backlog

135/268 damage spells are untagged; ~60–70 are mechanically obvious. High
value first (these unlock thin elements):

- **ice**: raceIceSpear, raceDiamondDust, raceBlizzardPresent (all currently
  only caught — or missed — by the name regex).
- **lightning**: raceTaserBolt, sentaiYellowThunder, raceShockwaveClap(?),
  raceEMPGrenade, raceStunRay(?) → takes lightning from 3 to ~7. Lightning is
  the element with the most engine machinery and the fewest attacks — also the
  top candidate for the planned new spells.
- **water**: raceTidalSlam, raceDepthCharge, raceCallOfTheDeep,
  raceWalkThePlank, raceTentacleLash(?) → water from 3 distinct to ~7.
- **poison**: raceVenomFang, raceCorrosiveSplash, raceToxicNova,
  raceFormicAcid, raceInfectiousBite, raceAbsorb(?) — plus every untagged
  spell that applies the poison status (8 exist).
- **fire**: every untagged burn-applier (12 exist), raceDragonfire (!! —
  currently fire only via name regex; the kaiju-vs-Dragonfire AI fix depends
  on it), raceAtomicBreath (fire or keep untagged-almighty? decide),
  sharedNuke is already tagged fire.
- **earth**: raceStonefall, raceStoneDrop, raceStoneThrow, raceBoneToss(?),
  raceTremor-family already tagged, golem's raceBoulderHurl (fix the dup id —
  rename golem/kong's copy or share giant's tagged object).
- **sonic** (flavor for now, tag anyway for the future promotion): the siren
  block — raceSonicBreaker, raceDeafeningWail, raceSonicBoomerang,
  raceCallOfTheDeep(water?), plus raceShockwaveClap if not lightning.
- Leave genuinely elementless things untagged (Improvise, A Really Good
  Punch, Truth Bomb...) — untagged = neutral is a valid, permanent state.

**Rule for future spells** (add to the data.js doc comment): every new DAMAGE
spell must either carry an `element:` or a `// element: none (deliberate)`
note. Combat-element spells that apply a status should apply the paired one.

Data bugs to fix in the same pass: the two duplicate ids (§2g), the three
regex misclassifications (§2b) — all disappear once `getSpellElement` is
tag-first (§6 P0) and the dups get unique ids.

---

## 6. Implementation map (phased; file:line anchors from the 2026-09-01 audit)

### P0 — Engine plumbing (no gameplay change, ship alone)
1. New `getSpellElement(spell)` in battle.js: returns `spell.element || null`
   for ALL 15 values — tag always wins; name-regex only as fallback for
   untagged spells, and only for fire/lightning/cold-ish guesses. Keep
   `classifySpellElement` as the terrain-reaction/zodiac vocabulary
   (fire/lightning/cold) — implement it as a thin mapper over
   `getSpellElement` (`ice→cold`, water/earth/etc→null) so the two can't
   drift. Keep `_SFX_EL_ALIAS` (battle.js:45115) in sync. Export both.
2. Thread `opts.element` through the resolvers that drop it: cross, barrage,
   bomb, delayed, lifeDrain, dash, leapStrike (battle.js:4281-5000);
   `_applyDamageSpellHit`/aoe/line/multiHit/ricochet already pass it.
3. Verify VFX theming (`_resolveTheme`, three-vfx-effects.js:161) is
   unaffected — it already reads the tag correctly for all 15.

### P1 — Data
4. Tagging pass (§5) + dup-id fixes. Pure data.js edit.
5. `RACE_ELEMENT_AFFINITY` + `ELEMENT_AFFINITY_MULT` + `unitElementAffinity`
   in data.js (§3c), exported on window (data.js:13512 export block).
6. Schema tests: extend content-schema.test.js — element values ∈ the 15;
   affinity keys ∈ races; affinity elements ∈ combat set; tiers ∈
   weak/resist/immune/absorb. Add the §4 balance invariants as warnings.

### P2 — Combat (the actual feature)
7. `calcElementAffinityMult` in the PURE block (battle.js:~221); fold into
   `_offMult` right after the type mult (battle.js:20147); absorb/immune
   early-outs beside `healedByElement` (battle.js:20066-20084); callouts via
   `_multCallout` (battle.js:20108) + log line + battle dialogue.
8. Status coupling in `getStatusApplyChance` (state.js:3404) for
   burn/frozen/poison (§3f).
9. Mirror the multiplier in ALL FOUR re-implementations or previews/AI lie:
   `_estimateSpellDamage` ui.js:10822 · `_estimateBasicAttackDamage`
   ui.js:10910 (no-op, attacks are elementless) · `_estimateComboDamage`
   ui.js:10996 · AI `estDamage` ai.js:388-390 (+ absorb early-out beside the
   existing healedByElement check at ai.js:354-359).
10. damage.test.js: add `calcElementAffinityMult` to `CALC_FNS` (line 64) and
    the delegation map (~107-120); table test modeled on the
    `elemental combo table` test (line 207). NOTE the purity contract
    (line 94): the calc fn must not touch state/window — pass the affinity
    string in.

### P3 — UI/UX (knowledge layer; SMT lives or dies on this)
11. Inspect panel (`renderSelectedUnitPanel`, ui.js:3843): one resist row —
    `Weak 🔥 · Resist ❄ · Null ☠`. Codex dossier: affinity grid next to the
    type matchups (`_codexBuildTypeMatchups`, ui.js:7598).
12. Forecast/preview: element note in `getPreviewEffect` (ui.js:~3390-3610)
    and the target-drum blades (hud.js:3448-3531) — reuse the `superEff`/`▼`
    affordances with element coloring; intent badge at ui.js:11255.
13. Spell cards: show the element badge in battle (the library browser
    already has one, ui.js:8685).
14. Floaters: new `_multCallout` texts relay to the guest for free via the
    `'floating-text'` relay (online.js:1088/3298). Optional polish: relay the
    weakness battle-dialogue line and blood tier (both host-only today —
    battle.js:20545, `_vfxBlood`).

### P4 — Later / optional
15. **Press-turn integration**: element weakness grants press tier like
    type-strong does — extend `_pressOutcomeForHit` (battle.js:24363) and AI
    `_pressTier` (ai.js:453). Use MAX(type tier, element tier), never
    additive. Ship separately and playtest — this is the biggest power swing
    in the whole plan.
16. Promote `psychic` (mindless immunity: robot/zombie/skeleton/golem) and
    `sonic` once tagged content exists.
17. New-spell waves fill lightning/water gaps; consider weather↔element
    boosts (blizzard buffs ice etc. — zodiac resonance is the precedent).

### Online parity (RULE #2 checklist)
Damage is host-computed and HP rides state-sync → the multiplier itself is
parity-safe with zero work. Floater texts relay free-form. Only the optional
dialogue/blood-tier relays in P3.14 need new relay handling. Affinity reads
are live from data.js on both sides (same file version via the ?v= token) —
no `_serializeState` changes.

---

## 7. Tests & invariants (summary)
- damage.test.js: purity + delegation + table for `calcElementAffinityMult`.
- content-schema.test.js: tag vocabulary, affinity table validity, combat-set
  membership, ≤2 weaknesses per race, immune/absorb count ceiling.
- Balance audit script (repo-root tooling, load-data.js based, like
  check-grades.js): per-element damage-spell coverage vs every declared
  weakness; the §4 invariants; prints the SMT-style chart for eyeballing.

## 8. Open questions (decide before P2)
1. **Multiplier magnitudes** — 1.5/0.5 proposed; 1.4/0.6 if the swing feels
   too spiky with type chart + STAB stacked.
2. **Knowledge model** — affinities always visible in inspect/codex
   (proposed: yes — PvP-fair, zero new state) vs SMT-style discovered-on-hit
   (needs per-player knowledge state + serialization + fog interactions;
   expensive, revisit post-launch).
3. **Press turns** — in (P4) or out? Recommend: out at first, evaluate after
   the multiplier has been felt.
4. **Shock/wet as spell statuses** — should lightning get a paired status
   (new 'shock' or reuse stun) and should water spells apply `wet` (huge
   combo implications: every water caster enables their own lightning
   follow-up)? Recommend: water→wet on the big water spells (it's the combo
   the engine was built for), no new shock status.
5. **Atomic Breath / Nuke class** — fire, or deliberately untagged
   (almighty-ish)? Affects kaiju mirror matches (fire:absorb).
