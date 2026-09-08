# CHAMP REWORK PLAN — stats, kits, twin nodes, new mechanics

> **STATUS 2026-09-07 — PHASE 1 SHIPPED (this file's §2–§3, §7):** every one of
> the 96 statlines in `RACE_BASE_STATS` (data.js) was re-derived from one
> shared vocabulary and one power budget; four default jobs moved
> (`RACE_DEFAULT_JOBS`); `npm run grades` (check-grades.js) now FAILS when a
> race leaves the budget band or a reworked champ stops matching the words it
> was designed from. Token `20260907f-cors` → `20260907g-cors`.
> **PHASE 2 SHIPPED 2026-09-07 (§4, §4.6):** twin nodes are live — a race-tree
> entry may be a 2-id array, one alternate equips per node, the builder shows
> a ⇄ badge and a picker (the Freelancer socket overlay, generalised), the
> legality / repair / random-walk functions and content-schema tests know the
> shape. Nine races wear the §6 pairs whose two spells both exist today.
> Token `20260907g-cors` → `20260907h-cors`.
> **PHASE 3 SHIPPED 2026-09-07 (§5.2, §9.3):** the passive batch — all 20
> `PASSIVE_DEFS` rows exist (Incorporeal absorbed Spectral Passage), 15
> races wear them today (gangster's Shank and nun's Devout wait for their
> races in Phase 6), every hook field has its engine consumer, and three
> statuses the passives need shipped early from §5.1 (`bleed`, `goo`, the
> `wolfForm` stance carrier). Initiative now reads LIVE SPD (stages count)
> and Quickdraw wins ties. `champ-rework.test.js` guards the batch; the
> check-grades planned-allowance rows are gone for every shipped passive.
> Token `20260907l-cors` → `20260907m-cors`. See §5.7 for what differs from
> the §5.2 table.
> **PHASE 4 SHIPPED 2026-09-07 (§5.1, §5.6, §9.4):** the status batch — all
> 19 remaining §5.1 rows exist in `STATUS_DEFS` (haunted, corroded,
> grievous, feared, possessed, infected, stoneform, soulBound, voodoo,
> shadowRealm, tethered, incendiary, sparkling, levitating, blessed,
> monster, extendedClips, carForm, mechaForm; shield is a real library row)
> with GENERIC hook fields the engine reads (countsAs, blockSpells,
> basicAttackStatus, hpMaxMult, grantsFlight, shedMotes, linkEcho, the
> rope, the fear flight, the realm gates, onApply/onRemove), the four
> registries know them, and §5.6 landed: 34 non-capstone stage spells are
> ±1 (Calcify −2; the three ring-3 capstones keep ±2). Control
> (possessed/infected) is rows + partner fields only — the hand-off lands
> with the `possess` kind in wave B. Token `20260907n-cors` →
> `20260907o-cors`. See §5.8.
> **Phases 5–6 are PLANNED here, not built** — the new spells (with their
> VFX / animation / cinematic specs) and the two new champs. §10 lists the
> yes/no decisions the owner should make (items 14–15 came out of Phase 2;
> 17–19 out of Phase 3; 20–24 out of Phase 4).

This is the single planning doc for the owner's 2026-09-07 "champ reworks"
notes. It is written so that any later session can build one phase from it
without re-deriving anything: every number is here, every new mechanic names
the engine hook it lands in, and every new spell has its presentation spec.
Existing rules it builds on (do not re-invent): STAT_REWORK.md (0–100 ruler,
letter bands, SPD → tiles), SPELL_TREE_REDESIGN.md (13-node tree, ring
ladder 25/50/75/100, single-status rule, setup → payoff), SPELL_CINEMATICS.md
(shot library, Void Stage, family treatments), BALANCE_NOTES.md (how passes
are measured).

---

## 0. How to read this doc

| Section | What it is | State |
|---|---|---|
| §1 | The rules already in the game that the rework leans on | reference |
| §2 | The vocabulary: the owner's words → numbers; the power budget; the checkable constraints | **shipped** |
| §3 | "Speed is both" — what changed, who is fast now | **shipped** |
| §4 | Twin nodes — "each node could have 2 abilities and you pick one" | **shipped** (Phase 2, §4.6) |
| §5 | New game-wide systems the kits need: statuses, passives, spell kinds/flags, terrain, forms, control, links, the shadow realm, summons | §5.2 passives **shipped** (Phase 3, see §5.7); the rest planned (Phase 4+) |
| §6 | The champs — 27 reworked + 2 new: role, stats, passives, race pillar, every new spell with numbers + presentation | planned (Phase 5–6), stats shipped |
| §7 | The roster sweep — before/after table for all 96 races | **shipped** |
| §8 | The per-spell presentation checklist (VFX / anim / cinematic / SFX / AI / online) | reference for Phase 5 |
| §9 | Build order, file touch lists, tests, cache-bust tokens | plan |
| §10 | Decisions the owner should make (yes/no) | open |

---

## 1. Ground rules already in the game

- **Six core stats on one 0–100 ruler** (ATK, M.ATK, DEF, M.DEF, SPD, AWR):
  letter = `ceil(stat/20)` → **F 1–20 · C 21–40 · B 41–60 · A 61–80 · S 81–100**
  (`STAT_GRADE_BANDS`, `statGrade`). HP and MP are raw pools with their own
  bands (HP: S ≥700 · A ≥620 · B ≥540 · C ≥460 · F below; MP: S ≥235 · A ≥190 ·
  B ≥140 · C ≥80 · F below).
- **SPD is movement AND initiative already.** `moveFromSpd` (data.js) gives one
  tile per letter (F 1 · C 2 · B 3 · A 4 · S 5, cap 5), and
  `buildBlitzTurnOrder` (state.js) sorts the blitz order by SPD descending
  (Trick Room reverses it). The map-crossing guard is the halved SECOND move
  (`getMoveRangeThisTurn`: `ceil(move/2)` tiles, spends all remaining AP).
  SPD 90+ also unlocks the 2-high jump (`RACE_NIMBLE_JUMP` gate).
- **A stat stage = ±20 = one letter = one tile for SPD** (`STAT_STAGE_STEP`),
  no stage-count cap, ruler-clamped at apply and read time, per-application
  ledger `unit.statStageMods`.
- **The tree**: root (Basic Attack) + three 4-node pillars (RACE / PRIMARY job /
  SECONDARY job), strict chains, 6-slot budget, at most one capstone. Ring
  costs are POSITIONAL: **r1 25 · r2 50 · r3 75 · r4★ 100 MP**
  (`TREE_RING_MP_COSTS`, `applyTreeRingCosts`). Ring tier: r1–2 = I, r3 = II,
  r4 = III (content-schema tests enforce it).
- **Kit grammar** (SPELL_TREE_REDESIGN §2): r1 opener · r2 tool · r3 payoff ·
  r4★ capstone. **One named status per cast** (§2.1) — a status may bundle
  effects (Discord is −2 ATK / −1 DEF), but a spell never applies two named
  statuses. Every status wants a `bonusVsStatus` payoff somewhere (§2.2).
- **Passives**: `PASSIVE_DEFS` / `RACE_PASSIVES` (data.js), **max 2 per unit**,
  `flying` auto-occupies one slot for `SKY_RACES` (map.js). Hooks read
  `unitPassiveValue(unit, key)` / `unitPassiveBlocksStatus` — never the race.
  party-builder.js `RACE_TRAITS` is display-only and overlays the registry.
- **Day / night**: `getCurrentCyclePhase` (map.js) — odd rounds are day, even
  rounds are night (Mystery Dungeon: odd floors day). The werewolf already
  swaps to a human model/sprite by day (sprites.js `WEREWOLF_DAY_SPRITE_*`,
  `getRace3DModel`); `sleepPreference: 'nocturnal'` today only nudges ±8 ATK /
  ±5 DEF / ±5 M.ATK / ±14 AWR.
- **Death / respawn** (blitz modes): `unit._respawnIn = min(2^(deaths−1), 8)`
  → **1, 2, 4, 8 rounds** (map.js death handler); `processRespawns` (map.js)
  places the unit back in its spawn zone (FFA: scattered). Real-time Strike
  mode has its own ms timers.
- **Opportunity attacks**: `checkOpportunityAttack` (battle.js) — 30% base
  ±SPD/AWR diff, clamped 10–70%, damage = half the enemy's ATK − armor.
- **Range**: `getEffectiveRange` = job-kit range (`JOB_KITS`: Sniper 3,
  Gunslinger / Agent / Psychic 2, everything else 1) + 1, + overclock /
  camouflage / high-ground / weather bonuses.
- **Existing precedents the new mechanics copy**: the Sedan already has TWO
  MODELS (boneless car for idle/move, rigged robot for actions — sprites.js
  `overrideForms`, battle.js `UNIT_ANIM_OVERRIDES`); the necromancer's
  `raiseDead` spawns an uncontrolled zombie ENTITY in `state.turrets`
  (attackable, fogged, acts at end of round) — the summon template; the
  fairy sheds pixie-dust motes on tiles she leaves (battle.js hardcoded
  passive) — the glitter-trail template; `deployPair` is the two-click
  targeting precedent; Contract (`_contractCasterId`) and Chivalry
  (`_guardedBy`) are the "linked unit" precedents; Camouflage / Mist Form
  are the invisibility precedents; `SPELL_KIND_META` (battle.js) is the
  single registry every new kind MUST be added to.

---

## 2. The vocabulary — words → numbers (SHIPPED)

### 2.1 Core stats (ATK, M.ATK, DEF, M.DEF, AWR)

| The owner's word | Grade | Number used |
|---|---|---|
| none / 0 / "if any" | F | 0–15 |
| terrible / very low | F | 16–20 |
| low / not good / squishy (defenses) | C | 21–40 |
| meh / ok / mid / decent | B | 41–60 |
| good / high | A | 61–80 |
| very high / strong / great | S | 81–100 |

"kinda low" = low C (30–36) · "decent-high" = top A (76–80) · "high" on a
damage stat = 72–82. When the owner named two stats against each other
("M.DEF higher than DEF, decent both") both land in B/A and the inequality is
a checked constraint (§2.4).

### 2.2 Speed (tiles + initiative) and pools

| Word | SPD grade | Tiles | Word | HP | MP |
|---|---|---|---|---|---|
| terrible movement | F (≤20) | 1 | terrible / very low | F <460 | martial 40–110 |
| slow / not very fast / low | C (21–40) | 2 | low / squishy | C 460–539 | hybrid 120–160 |
| ok / decent | B (41–60) | 3 | mid / decent | B 540–619 | caster 190–260 |
| kinda fast / good / great | A (61–80) | 4 | decent-high / high | A 620–699 | |
| fast af / one of the fastest | S (81–100) | 5 | very high | S ≥700 | |

### 2.3 The power budget — "none too OP or UP when it comes to stats"

One number per race, in ATK-equivalents, checked by `npm run grades`:

```
budget = HP/12.5 + MP/6.7 + ATK + M.ATK + DEF/1.5 + M.DEF/2 + 0.8·SPD + AWR/14
       + 8·(job-kit basic-attack range − 1)
       + passive allowance
TARGET 262, band ±5 % (249–275). Every race must sit inside it.
```

- The HP/MP/ATK/DEF/M.DEF/AWR weights are the game's own pre-rework value
  weighting (data.js RACE_BASE_STATS header) translated to the 0–100 ruler.
- **SPD is the one big re-weighting: 0.8/pt = 16 per tile** (it was ~0.4).
  STAT_REWORK §3 already said a tile is worth 15–20 stat points of anything
  else; now that SPD is also initiative it has to be priced that way, or
  every roster fast unit is free.
- **Range is priced** (8 per point above 1) because it comes from the race's
  locked default job, i.e. it is a stat-sheet fact.
- **Passive allowances** (check-grades.js `PASSIVE_VALUE` for live passives,
  `PLANNED_PASSIVE_ALLOWANCE` per race for the ones in §5.2 — delete a
  planned row the day the passive ships so it isn't counted twice):
  flying 10 · incorporeal 18 · longshot 40 · point blank 8 · pure negativity
  12 · serrated 12 · cryptid 10 · return of the dead 10 · reach 8 · oozing 8 ·
  bloodcraze 8 · ray gun 8 · mad genius 6 · bone deep 6 · hemophage 6 ·
  devout 8 · quickdraw 4 · thermal regen 4 · charm/stagger immunities 2 ·
  power core −6 (it is a tax with a rebate).
- Werewolf's budget is the **average of day and night** (night = day + the
  Lycanthropy stages, §6.4).
- Result: roster mean 265, sd 9.5 (was mean 270, sd 22 under the same
  formula); 65 of 96 lines moved. The two dumps are gone: gargoyle (was 190,
  SPD 8 — one tile) and marksman (199) are in the band; the three
  over-budget "good at everything" lines (chosen one 325, ghost 323,
  telepath 309) came down.

### 2.4 The comparatives, made checkable

Every "X has decent attack but not as much as Y" line in the notes became a
row in check-grades.js `CONSTRAINTS` (25 champs today, gangster + nun join
when they exist). Examples: yeti ATK > santa ATK, yeti SPD > santa SPD, yeti
M.ATK < santa M.ATK; robin hood ATK > marksman ATK, SPD > marksman SPD, HP and
M.DEF > marksman, kit range ≤ marksman; atlantean SPD > marksman SPD; ghost
ATK === 0; werewolf day ATK ≤ 60 and night ATK/SPD ≥ 81. The full list is
the source of truth — read the tool, not this paragraph.

### 2.5 Non-stat knobs the vocabulary maps to

| Note | Where it lives |
|---|---|
| "no basic attack range" / "melee" | default job kit range 1 |
| "long range" / "high attack range" | Sniper kit (3) — QB, marksman, robin hood, gargoyle→no longer |
| "potentially infinite range on anyone visible" | marksman **Longshot** passive (§5.2) |
| "long melee range (2 tiles)" | dinosaur **Reach** passive; dragon **Dragon Reach** |
| "only targetable from ≤3 tiles" | bigfoot **Cryptid** passive |
| "dead for half the time" | skeleton **Bone Deep** passive |
| "respawn where they died" | zombie **Return of the Dead** passive |
| "spells cost a lot, hits regain mana" | cyborg **Power Core** passive |
| "AOE CC" vs "less AOE" | counted per pillar in §6 (santa 3 area spells, yeti 1) |

---

## 3. Speed is both — what changed (SHIPPED)

Nothing in the engine had to change: SPD already drives both tiles and the
blitz order (§1). What changed is the ROSTER: STAT_REWORK's migration
deliberately preserved every old tile count, so the 2026-08-29 roster had
**zero A/S-speed units** (41 B, 51 C, 4 F). "There SHOULD be S-speed units"
was sanctioned there; this pass creates them and prices them:

| Unit | SPD | Tiles | Why |
|---|---|---|---|
| Sedan (car form) | 84 S | 5 | "one of the fastest" — mecha form drops to C (§6.2) |
| Werewolf at night | 100 S | 5 | "fast af" — day form is 40 C (§6.4) |
| Cowboy | 72 A | 4 | "good movement speed (horse)" |
| Fairy | 64 A | 4 | "good speed" |
| Quarterback | 62 A | 4 | "kinda fast" |
| Superhero | 62 A | 4 | "great speed" (kept at the A floor — four A stats already) |
| Gangster (new) | 64 A | 4 | "good speed" |

Everything an A/S speedster gets is paid for: the second move is halved
(4→2, 5→3 tiles), and 16 budget points per tile came out of the rest of the
line (the QB is C-defenses/F-magic; the sedan's M.DEF is C).

Sweep rule for the other races: **tile counts were preserved** (the
normalizer may jitter SPD inside its 20-band to re-order initiative, never
across a band). Speed-identity rethinks for non-listed races are a follow-up
decision, not a side effect.

---

## 4. Twin nodes — "each node could have 2 abilities and you have to pick one" (Phase 2)

### 4.1 The rule

A race-pillar node may hold **two alternates**. Exactly one of them can be
equipped; it occupies the node (1 slot, the node's ring cost and tier).
Choosing the other alternate later is a free respec in the builder. Job
pillars stay single (the job pillar is the class identity; the race pillar is
where the flavor lives). Cap: **at most 4 NEW spells per race branch** (owner
rule) — twins are how they fit without deleting anything.

### 4.2 Data model (data.js)

```js
// RACE_TREE rows keep 4 entries. An entry is a spell id OR a 2-element array.
'quarterback': ['raceBulletPass', ['raceBlitz', 'raceQbSneak'], ['raceAudible', 'raceSpikeTheBall'], 'raceHailMary'],
```

- `getRaceTreeSpells(race, cls)` returns the row with arrays intact.
- `buildUnitSpellTree(race, cls, sec, equippedIds)`: node `R{i}` resolves to
  the equipped alternate if one is equipped, else the FIRST alternate (the
  node's "face"); the tree object gains `alts: { R2: ['raceBlitz','raceQbSneak'] }`.
- `buildTreeRingIndex`: both alternates get the node's ring (so
  `applyTreeRingCosts` prices them 25/50/75/100 by position — no new rule).
- Tier: both alternates carry the node's ring tier (r1–2 I, r3 II, r4 III).
- `isTreeLoadoutLegal`: adds "at most one id from each twin pair"; adjacency
  is by node key, so path logic is untouched. `treeLegalSubset` drops the
  later alternate if both are present (repair for stale saves).
- `buildTreeLegalLoadout` (AI / random / auto-fill): picks an alternate at
  random per twin node. `flWildcardPool` (Freelancer) excludes both
  alternates of the unit's race pillar.
- Saves: `customSpells` is still a flat id list — **no save-format change**.
- Online: host validation already funnels through `treeLegalSubset`
  (online.js ~1869) — no new relay.
- Spell Library dev tool (`EWSpellMods` learnset moves) must accept arrays
  when it re-runs `applyTreeRingCosts`.

### 4.3 Party builder (party-builder.js `SpellTreePanel`, ~1206)

- A twin node renders as a split chip (⇄ badge) showing the face alternate.
- Clicking an unequipped twin node opens the SAME two-option picker the
  Freelancer wildcard sockets already use (dashed-gold chips) — one popover,
  both alternates with their full tooltips (`buildSpellTooltip`), pick one =
  equip it via the existing click-to-auto-path.
- An equipped twin node shows a small "swap" affordance; swapping is
  unequip + equip and obeys the sever-blocking rule.
- The battle HUD needs nothing: only equipped ids exist at match time.

### 4.4 Tests (content-schema.test.js)

Rows are 4 entries; each entry is a string or a 2-string array; every id is in
that race's `RACE_ABILITIES` and in no job tree; the two alternates of a twin
must share the ring's tier (capstone twins both III); no id may appear in two
nodes; random walks stay legal; a loadout with both alternates is illegal and
`treeLegalSubset` repairs it to one.

### 4.5 Free wins on day one (no new spells needed)

These off-tree abilities already exist and can be twinned immediately:
QB `raceSpikeTheBall` · sedan `raceRoboPunch` · werewolf `racePounce` · ki
fighter `raceFlurryOfBlows` + `raceKiWave` · dragon `sharedFissure` · demon
`raceWingGust` · shaman `sharedHexOfToil` + `sharedEgoDeath` · atlantean
`raceFlood` · skeleton `sharedFissure` · bigfoot `raceBigKick` · gargoyle
`raceGothicRampart` + `raceWingGust` · black goo `raceOozeTrail` · robin hood
`raceBombArrow` + `racePoisonArrow` · superhero `sharedNebula` · mad scientist
`sharedShrinkRay` + `freeEnergy` · vampire `raceLifetap`. §6 places them.

---

### 4.6 SHIPPED 2026-09-07 — what landed, and where it differs from §4.2

**Rows now twinned** (data.js `RACE_TREE`; `A ⇄ B`, A = face):

| Race | r1 | r2 | r3 | r4★ | Ring-cost moves |
|---|---|---|---|---|---|
| quarterback | Bullet Pass | Blitz | Audible ⇄ Spike the Ball | Hail Mary | Spike 25 → 75 |
| honda civic | Ram Charge | Exhaust Cloud | Robo Punch ⇄ Nitro Boost | Vehicular Manslaughter | Robo Punch 25 → 75 |
| ki fighter | Ki Volley ⇄ Flurry of Blows | Ki Charge ⇄ Ki Wave | Instant Transmission | Dragon Fist | — |
| atlantean | Whirlpool | Water Pulse | Temporal Tide | Poseidon's Wrath ⇄ Great Flood | — |
| skeleton | Bone Toss | Reassemble | Poison Swamp ⇄ Fissure | Marrowstorm | — |
| bigfoot | Big Kick ⇄ Tremor Stomp | Blurry Photo | Trunk Throw | Sasquatch Smash | Tremor Stomp 75 → 25 · Trunk Throw 25 → 75 |
| gargoyle | Wing Attack ⇄ Stonefall | Gothic Rampart | Calcify | Stone Drop | Rampart 25 → 50 · Perch Form off-tree |
| robinhood | Fire Arrow ⇄ Poison Arrow | Steal from the Rich ⇄ Bomb Arrow | Splitting Arrow | Arrow Rain | Bomb Arrow 25 → 50 |
| shaman | Herbal Remedy | Spirit Walk | Ayahuasca Retreat | Bad Trip ⇄ Ego Death | — |

Every §6 pair with a NEW spell in it lands with that spell (Phase 5). The
bigfoot / gargoyle rows are the §6 pillar ORDER too (Trunk Throw is tier II,
so ring 3 is where it belongs; Perch Form leaves the tree as §6.17 says and
stays an off-tree race ability until Stoneform replaces it).

**Deviations from §4.2 (deliberate):**
- `getRaceTreeSpells(race, cls)` still returns a FLAT list — the faces — so
  every pre-twin caller (builder defaults, battle.js optimize, the balance
  export) keeps working unchanged. The row with pairs intact is
  `getRaceTreeRow`; `getRaceTreeAlts` gives `{ R3: [a, b] }`;
  `getRaceTreeAllIds` flattens both alternates. battle.js was not touched.
- **Great Flood twins at r4, not r3** (§6.12 said Temporal Tide ⇄ Great
  Flood): it is tier III — the mermaid's capstone — and the twin rule says
  both alternates carry the node's tier, so ring 3 is illegal for it. When
  Tsunami★ lands, decide whether it displaces Flood or joins it (§10 #15).
- The face in Clash is the first alternate that isn't a banned movement
  spell, so a sealed dash never hides its castable twin.
- `treeLegalSubset` keeps the FIRST alternate it meets in the wish-list and
  drops the other (stale saves that somehow hold both repair to one);
  `buildTreeLegalLoadout` rebuilds the tree after every pick so a walked-on
  alternate becomes its node (about half of random walks pick a non-face).
- Freelancer: race twins resolve the same way; the wildcard pool excludes
  both alternates; the other alternate of an equipped twin is reported as
  `unplaced` (illegal) rather than silently socketed.

**Builder (party-builder.js):** twin chips carry a ⇄ badge (gold when the
node is clickable) and print "⇄ <other name>" under the face name. An
UNEQUIPPED twin opens the picker instead of auto-equipping its face; an
EQUIPPED twin unequips on click, and its badge opens the picker to SWAP IN
PLACE (same node, so it can never sever the chain). The picker is the
Freelancer socket overlay generalised (one overlay, two sources — §10 #10
taken as yes). Legal-id scrubbing (`legalCustomSpellIds`) accepts both
alternates; `treeLegalSubset` still enforces one.

**Tests:** content-schema.test.js — rows are 4 entries, each a string or a
2-string array, ids known / owned / not on a job tree / never on two nodes,
capstone twins both tier III, the one-alternate rule, repair, random walks
(twin races and Freelancer), pool exclusion.

**Not twinned (no permanent home in §6):** werewolf Pounce, dragon Fissure,
demon Wing Attack, shaman Hex of Agony, black goo Ooze Trail, superhero
Nebula, mad scientist Shrink Ray + Free Energy, vampire Lifetap — §4.5
listed them, §6's final pillars have no node for them. Interim twins would
have to be undone in Phase 5, so they wait for §10 #14.

---

## 5. New game-wide systems (Phases 3–4)

Everything below is named once here and referenced from §6. Each row says
where the hook lands. Rule of thumb from CLAUDE.md RULE #2: every one of
these is host-computed and reaches the guest through unit state (status maps,
`statStageMods`, new `_fields` — check `_serializeState`'s skip list) plus the
VFX intents that `VFX3D.fire` already relays.

### 5.1 New statuses (`STATUS_DEFS` + `STATUS_LIBRARY_DESCS`; animated ones also in state.js `_STATUS_EFFECT_IDS`, colors in hud.js `_HRLG_SB_COLORS`; hard CC also in ai.js `HARD_CC`)

| id | Label | Kind | Effect (fields) | Applied by | Payoff |
|---|---|---|---|---|---|
| `haunted` | Haunted | debuff, DOT | 28 magic/round (ignore armor), 3 rounds | Ghost Haunt | Boo ×1.5 vs Haunted |
| `bleed` | Bleeding | debuff, DOT | 20 physical/round, 2 rounds; `_MF_DOT` already lists it | Robin Hood passive (every physical hit) | Piercing Arrow ×1.5 vs Bleeding |
| `corroded` | Corroded | debuff, DOT | 44/round (fire+poison), 2 rounds; **counts as Burn AND Poison** for every `bonusVsStatus` check | Mad Scientist Chemical Concoction | Plandemic ×1.5 |
| `goo` | Gooed | debuff bundle | `healTakenMult 0.5`, `moveDelta −1`, `magicDamageTakenMult 1.25`, 2 rounds | Black Goo (passive contact, Goo Shot, Splash, goo terrain) | Absorb ×1.5 vs Gooed |
| `grievous` | Grievous Wound | debuff | `healTakenMult 0.5`, 2 rounds — **the requested "reduces healing received"** | Ghoul Frenzy, Gangster Stomp Out | Blood Frenzy already auto-targets low HP |
| `feared` | Feared | debuff, hard CC | on its next activation the unit must spend its move fleeing away from the source (engine-driven forced move, `_fearSourceId`) and cannot attack/cast; 1 round | Ghoul Fear | Terror Pounce ×1.5 vs Feared |
| `possessed` | Possessed | debuff, control | the unit is CONTROLLED by the caster's player for `activations` (1–2); fields `_controllerPlayer`, `_possessLeft`; may use its whole kit | Ghost Possession (1), Succubus Enthrall (1), Vampire Thrall Bite (1) | — |
| `infected` | Infected | debuff, control | the zombie variant: controlled for 4 activations, **melee only** (`blockSpells`), +1 ATK stage, +1 SPD stage | Zombie Infect | Shambling Horde ×1.5 |
| `stoneform` | Stoneform | buff | `blockMove`, `blockAction`, `damageTakenMult 0`, regen 15 % max HP/round, 2 rounds; not cleansable | Gargoyle Stoneform | — |
| `soulBound` | Soul-Bound | debuff, link | paired with `_boundToId`: when either takes damage the other takes 30 % (45 % while the demon has a live +M.ATK stage), 3 rounds | Demon Soul Bind | Devour Soul ×1.5 |
| `voodoo` | Voodoo | debuff, link | enemy linked to an ALLY (`_voodooAllyId`): when the ally takes damage the enemy takes 50 %, 3 rounds | Shaman Voodoo | Bad Trip ×1.5 |
| `shadowRealm` | In the Shadow Realm | marker (both units) | the pair is invisible AND untargetable to everyone else, immune to everything not from each other, cannot be healed by others, 2 rounds; `_realmPartnerId` | Demon Shadow Realm★ | — |
| `tethered` | Roped | debuff | cannot move on its own; whenever the cowboy moves the target is dragged behind him tile-for-tile (stops on blockers), 20 dmg per tile dragged; 2 rounds | Cowboy Lasso (rework) | High Noon ×1.5 vs Roped (replaces vs Stagger) |
| `incendiary` | Incendiary Rounds | buff (self) | `basicAttackStatus: {burn, 2}`, 2 rounds | Marksman Incendiary Rounds | Fire for Effect ×1.5 vs Burn (replaces vs Slow) |
| `sparkling` | Sparkling | buff | +1 SPD stage; sheds glitter motes on tiles it leaves (fairy-trail system); an enemy stepping on a mote is Blinded 1; 2 rounds | Fairy Sparkle | Glitter Bomb ×1.5 vs Blind |
| `levitating` | Levitating | buff | temporary flight: auto-ascend to clearance on apply, `canFly` true, auto-land on expiry, 2 rounds | Fairy Fairy Dust | high-ground damage bonus (existing) |
| `blessed` | Blessed | buff bundle | +1 DEF stage, +1 M.DEF stage, regen 40/round, 3 rounds | Nun Blessing | — |
| `monster` | Monstrous | buff bundle | `blockSpells`, +1 ATK/SPD/DEF/M.DEF stage, +1 melee range, +25 % max HP; 3 rounds | Mad Scientist Monster Serum | — |
| `extendedClips` | Extended Clips | buff bundle (team) | +1 RNG, +1 ATK stage, 3 rounds | Gangster Extended Clips★ | — |
| `carForm` / `mechaForm` | Car / Mecha | statChange carriers (stance) | mecha: −3 SPD stages, +1 DEF, +2 M.DEF stages, +2 RNG; model = robot | Sedan Transform | — |
| `wolfForm` | The Beast | statChange carrier | +2 ATK, +3 SPD, +2 DEF, +1 M.DEF stages while night | Werewolf Lycanthropy (auto) | — |
| `shield` | Shielded | (already exists as a display category; make it a real library row) | `unit.shield` HP barrier | Nun Prayer, existing shield spells | — |

### 5.2 New passives (`PASSIVE_DEFS` + `RACE_PASSIVES`; hook fields consumed where noted)

| id | Race | Hook field(s) | Consumed in |
|---|---|---|---|
| `incorporeal` | ghost (REPLACES spectralPassage — same passive, both effects) | `phasing:true`, `immuneDamageType:'physical'` | pathing (existing); `applyDamageToUnit` early-out when `opts.damageType === 'physical'` (basic attacks, physical spells, opp attacks, fall damage; DOTs untouched) |
| `lycanthropy` | werewolf | `dayNightForms: { night: {atk:2, spd:3, def:2, mdef:1} }` | round-start hook applies/removes the `wolfForm` carrier on phase flips; replaces `sleepPreference: 'nocturnal'` for the werewolf; model swap already keyed on the cycle |
| `bloodcraze` | werewolf | `lowHpBonus: { threshold: 0.30, dmgMult: 1.25, spdStages: 1 }` | damage pipeline (vs targets ≤30 %), `getEffectiveSpd` (+1 stage while any VISIBLE enemy ≤30 %) |
| `boneDeep` | skeleton | `respawnMult: 0.5` | map.js death handler → 1, 1, 2, 4 rounds |
| `returnOfTheDead` | zombie | `respawnAtDeathTile: true` | `processRespawns`: death tile if free, else nearest free, else spawn zone |
| `reach` / `dragonReach` | dinosaur / dragon | `rangeBonus: 1` | `getEffectiveRange` |
| `cryptid` | bigfoot | `targetableWithin: 3` | `computeVisibleTiles` (enemy viewers see him only within 3), attack/spell target gate, AI vision |
| `shank` | gangster | `oppAttackChance: 1.0`, `oppAttackMult: 1.5` | `checkOpportunityAttack` |
| `pureNegativity` | ghoul | `immuneKind: 'debuff'`, `immuneStatDown: true` | `applyStatusPayload`, `applyStatStageBoost` (negative stages) |
| `serrated` | robin hood | `physicalHitStatus: { id:'bleed', duration:2 }` | `doAttack`, `_applyDamageSpellHit` (physical) |
| `longshot` | marksman | `basicAttackRange: 99` | `getEffectiveRange` for basic attacks only; LOS + fog still required |
| `pointBlank` | marksman | `closeRangeBonus: { within: 2, mult: 1.3 }` | basic-attack damage |
| `oozing` | black goo | `contactStatus: 'goo'`, `trailTerrain: 'goo'` | `doAttack` (both directions when melee), end of the unit's turn paints its tile |
| `powerCore` | cyborg | `spellCostMult: 1.5`, `mpOnBasicHit: 25`, `mpFromMagicDamage: 0.30` | `getSpellCost`, `doAttack`, `applyDamageToUnit` |
| `madGenius` | mad scientist | `stagePerRounds: { int: 1, every: 3 }`, `resetOnDeath: true` | end-of-round tick, death handler |
| `rayGun` | mad scientist | `basicAttackMagic: true`, `basicAttackRangeBonus: 1` | `doAttack` uses M.ATK vs M.DEF, range +1 |
| `devout` | nun | `healMult: 1.2` | `applyHealingToUnit` (source-based) |
| `quickdraw` | cowboy (already a DESIGN row) | `speedTiePriority: true` | `buildBlitzTurnOrder` |
| `fairyDustTrail` | fairy (already coded) | — | register for display honesty only |

Slot check (max 2, flying counts): ghost = flying + incorporeal · dragon =
flying + dragonReach · werewolf = lycanthropy + bloodcraze · marksman =
longshot + pointBlank · mad scientist = madGenius + rayGun · everyone else ≤2.

### 5.3 New spell kinds and flags (`SPELL_KIND_META` + `doSpell` + ai.js `scoreSpell` + the targeting prompt table)

| Kind / flag | Meta | What it does | Used by |
|---|---|---|---|
| `transform` | selfCast, fogExempt | toggles between two stance carriers (`formA`/`formB` ids); permanent until re-cast; model swap through `overrideForms` | Sedan |
| `possess` | offensive, breaksStealth | applies `possessed`/`infected`; the controlled unit's activation is run by the caster's player (human: normal UI; CPU: the AI takes the turn for that side); `activations` field | Ghost, Succubus, Vampire, Zombie |
| `link` | offensive | two-click targeting (the `deployPair` flow): pick A then B, applies the link status with partner ids; `linkTargets: 'enemy-enemy'` or `'ally-enemy'` | Demon Soul Bind, Shaman Voodoo |
| `shadowRealm` | offensive | applies `shadowRealm` to caster + target; both get the Void Stage treatment for the duration | Demon Shadow Realm★ |
| `transfer` | allyOnly, two-click | take `takePct` of A's max HP (never below 1) and heal B for `givePct` of it (M.ATK-scaled) | Shaman Sacrifice |
| `steal` | offensive | moves the target's hourglasses/keys and item to the caster, then `dmg` | Gangster Hit a Lick |
| `summonUnit` | tileTargeted | spawns an entity in `state.turrets` (the raiseDead template) with `summonDef: { move, dmg, hits, reveals }`; acts at end of round, chases the nearest enemy; `maxActivePerCaster: 1` | Cowboy Whistle, Mad Scientist Summon Creation |
| `tackle` | offensive | charge to the target, then push it along the charge line up to `pushDistance`; collision → `collisionBonus` + Stagger | Superhero Sky Tackle |
| `dashThenShoot` | tileTargeted | dash (existing) then a ranged `dmg` shot at the best enemy within `shotRange` of the landing tile | Gangster Drive-By |
| `cleanseArea` | tileTargeted | 3×3: allies lose debuffs, enemies lose buffs (both cleanses are removals, not applications — single-status rule intact) | Nun Purify |
| `executeBelowPct` (flag on `damage`) | — | if the target is at or below the fraction, the hit kills | Sniper **headshot** (job-wide, 0.15) |
| `onKillHealPct` / `onKillRefundAp` (flags) | — | heal % max HP and refund AP when the hit kills | Dinosaur Jurassic Jaw★ |
| `lineZone` (flag on `line`) | — | every hit tile becomes a `zoneDuration`-round zone applying `zoneStatus` | Dragon Breath |
| `lineWidth: 2–3` | — | verify `_applyLineDamage` honors widths above 1 (Plasma Cannon 2, Tsunami 3) | Cyborg, Atlantean |
| `terrainFlatten: { radius }` (deform mode) | — | sets every footprint height to the LOWEST height in the footprint | Flat Earth |
| `onlyTerrain: 'goo'` (flag on `teleport`) | — | destinations restricted to that terrain, no LOS | Black Goo Icky Surprise |
| `corpseTarget` (reuse `raiseDead` targeting meta) | — | targets an unconsumed corpse tile | Zombie Cannibalize |
| `tetherFollow` (movement hook) | — | after every caster move, drag each `tethered` victim along the path | Cowboy Lasso |

### 5.4 Terrain

- **`goo`** (new `TERRAIN_RULES` row): passable, move cost 2, timed (3
  rounds, reverts to the tile's previous terrain — the first timed terrain;
  store `_prevTerrain` + `_expiresRound` on the tile), applies `goo` to
  enemies entering or ending a turn on it. Texture: reuse the `oil` sprite
  tinted (`EW_TERRAIN_COLORS` row) until the owner uploads `goo.png`.
- **Glitter motes** reuse the fairy's mote object; a mote left by
  `sparkling` carries `blindOnStep: 1`.
- **Flatten** deform mode (§5.3) — battle.js `terrainDeform` handler gets a
  third mode next to `centerDelta`/`edgeDelta`.

### 5.5 Forms, control, links, the shadow realm — engine notes

- **Forms** are just stance carriers (statChange statuses with `stageMod` +
  `rangeDelta`) so every consumer already understands them; the model swap
  rides `_spriteOverride`/`overrideForms` like the Sedan's combat robot does
  today. Werewolf's form is automatic (round parity); Sedan's is a cast.
- **Control** (`possessed`/`infected`): the blitz order stays the same; when
  a controlled unit becomes active, `state.activePlayer` for that activation
  is the controller (`getControllingPlayer(unit)` helper used by the HUD
  gate, the AI trigger and the online guest-emit path). Online: the guest who
  owns the possessed unit must NOT get the controls; the controller does —
  the HUD's "is this my unit" check goes through the helper. The AI already
  plays any unit it is handed (`runComputerTurn`), so CPU control is free.
- **Links** store partner ids on the status entry; `applyDamageToUnit` after
  the hit resolves calls `_procLinks(target, dealt)` (no recursion: linked
  echoes carry `opts._linkEcho`).
- **Shadow Realm** is a pair marker consulted by `_isTileVisibleToViewer`
  (others never see them), the target gates (others can't target them),
  `applyDamageToUnit`/`applyHealingToUnit` (others' effects no-op) and the
  zone/weather ticks (skipped). Presentation: the Void Stage with a new
  `shadow` palette for the whole duration (`opts.maxMs`, the Entropy Strike
  precedent); the relay is the existing `entropy-cine`-style state, plus the
  two units' `shadowRealm` status in state-sync.

### 5.7 SHIPPED 2026-09-07 — Phase 3, the passive batch (what landed, and where it differs from §5.2)

Every row of §5.2 is a `PASSIVE_DEFS` entry (data.js) with the hook field(s)
the table names; `RACE_PASSIVES` wears them on ghost, werewolf, skeleton,
zombie, dinosaur, dragon, bigfoot, ghoul, robinhood, marksman, black goo,
cyborg, mad scientist, fairy and cowboy. Consumers, per hook:

| Passive | Where the engine reads it |
|---|---|
| Incorporeal | battle.js `applyDamageToUnit` — a `damageType:'physical'` hit returns before the pipeline ("👻 PASSES THROUGH", counts as a Press-Turn miss); `phasing` unchanged (map.js `unitIsPhasing`). `spectralPassage` is gone. |
| Lycanthropy | battle.js `_applyRoundStartPassives` (called at match start and in the round transition right BEFORE `buildBlitzTurnOrder`) wears the **`wolfForm`** stance carrier (STATUS_DEFS, `stageMod {atk:2, spd:3, def:2, mdef:1}`) every night round and clears it at dawn. map.js `getSleepAffinityModifier` returns no nudge for a `dayNightForms` unit; the Raider archetype's `sleepPreference` is `'none'`. |
| Bloodcraze | damage: `applyDamageToUnit` offensive product (×1.25 vs targets ≤30 %, pre-hit HP). Speed: `getEffectiveSpd` adds the stage while any enemy ≤30 % is `isUnitSeenByTeam` (fog + concealment + LOS), ruler-clamped. |
| Bone Deep | map.js death handler: `_respawnIn = max(1, round(base × 0.5))` → 1, 1, 2, 4. |
| Return of the Dead | map.js `processRespawns`: `_deathTile` (stamped at death) if open, else the nearest open tile within 3, else the zone path. |
| Reach / Dragon Reach / Ray Gun range | `getEffectiveRange` adds `rangeBonus` + `basicAttackRangeBonus`. |
| Cryptid | battle.js `unitCryptidHiddenFrom(unit, viewer)`: no living unit of the viewer within 3 Manhattan tiles ⇒ concealed. Wired INTO `isUnitConcealedFrom`, so the renderer hides the mesh, the AI's `isConcealed` skips him and the nameplate eye closes — no `computeVisibleTiles` change was needed (§10 #11 taken as yes). `doAttack` and unit-targeted offensive `doSpell` refuse him; tile-targeted sweeps still splash him (the stealth rule). A **Marked** cryptid is exposed, like a marked invisible unit. |
| Shank | `checkOpportunityAttack`: chance `max(rolled, 1.0)`, base damage ×1.5. Def only until the gangster exists. |
| Pure Negativity | `applyStatusPayload` bounces every `kind:'debuff'` status (spell, terrain, statDown carrier); `applyStatStageBoost` strips the negative half of a boost and applies any positive half. |
| Serrated | `applyDamageToUnit` after a landed enemy PHYSICAL hit (basic, ability, opp attack): `applyStatusPayload(bleed, 2)` — resist rolls and immunities apply; `_statusSrc.bleed` credits the tick. |
| Longshot | `getEffectiveRange(unit, opts)`: `max(reach, 99)` unless `opts.item` — every bane/item-throw site (battle, ui ×2, hud ×2, ai) passes `{ item: true }`. LOS (`isRangeBlockedByTerrain`) and the fog gate in `doAttack` still rule. HUD RNG chip prints ∞. |
| Point Blank | `doAttack`: `d ≤ 2` ⇒ damage ×1.3 before crit (💥 callout). |
| Oozing | `doAttack`, melee hits only: the OTHER unit gets `goo` (2 rounds) whichever side the ooze is on. The **trail** half (`trailTerrain`) is NOT in the def yet — it lands with the `goo` terrain in Phase 5 wave C. |
| Power Core | `getSpellMpCostFor` ×1.5; `doAttack` +25 MP on a landed basic hit; `applyDamageToUnit` +30 % of magic damage taken as MP. |
| Mad Genius | `_applyRoundStartPassives` on every 3rd round: `applyStatStageBoost(u, {int:1}, …, {perm:true})` — a **permanent ledger entry** (`{perm:true, left:999}`) that the tick, the statUp/statDown badge timer and a buff purge all skip; the respawn ledger reset is the death reset. |
| Ray Gun | `doAttack`: `pwrInt` on the roll, `damageType:'magic'` (M.DEF soak, INT-axis bonuses), the mark still consumed. |
| Devout | `applyHealingToUnit` ×1.2 when the SOURCE has it (self-heals included). Def only until the nun exists. |
| Quickdraw | state.js `buildBlitzTurnOrder`: quickdraw units head their SPD tier, then the rest (both halves keep the P1/P2 alternation). |
| Pixie Dust Trail | registered for display + budget only (the mote system is unchanged). |

**Engine changes that fell out of it (deliberate):**
- **Initiative reads LIVE SPD.** `buildBlitzTurnOrder` tiers by `getEffectiveSpd` (base + stages, ruler-clamped) instead of the stored stat, so The Beast, Slow, Haste and Audible reorder the round they are worn. Guests rebuild from `_blitzTurnOrderIds`, so nothing new is relayed.
- **Statuses shipped early from §5.1:** `bleed` (20 physical DoT, 2 rounds, `_STATUS_EFFECT_IDS` + HUD colour), `goo` (`moveDelta −1`, **new status fields** `healTakenMult` 0.5 and `magicDamageTakenMult` 1.25 — consumed in `applyHealingToUnit` and `applyDamageToUnit`; Grievous Wound can reuse `healTakenMult`), and `wolfForm` (The Beast). Phase 4 adds the rest.
- **Permanent stat-stage entries** exist now (`statStageMods[i].perm`) — any later "permanent until death" buff can use `applyStatStageBoost(…, { perm: true })`.
- **Budget:** `PLANNED_PASSIVE_ALLOWANCE` keeps only gangster + nun; every shipped id is priced in `PASSIVE_VALUE` (incorporeal 18, lycanthropy 0 — the night stages are averaged in — bloodcraze 8, fairyDustTrail 4, powerCore −6 …). Roster mean/sd unchanged (265 / 9.5); every race still in the band.
- **Tests:** `champ-rework.test.js` (registry integrity + slot cap incl. flying, the §5.2 field table, the statuses' four registries, check-grades pricing/planned-row drift, the werewolf archetype, and source-text guards for every hook consumer, the round-start ordering, the item-reach sites and the perm ledger).

### 5.8 SHIPPED 2026-09-07 — Phase 4, the status batch (what landed, and where it differs from §5.1)

Every §5.1 row that Phase 3 had not already shipped is a `STATUS_DEFS`
entry (data.js, the "Phase 4" block after `wolfForm`; the header comment
above the block lists every hook field and its consumer). All of them are in
`STATUS_LIBRARY_DESCS` (the pause-menu library shows them today), state.js
`_STATUS_EFFECT_IDS`, hud.js `_HRLG_SB_COLORS`, and the mana-formula
tables (`_MF_HARD_CC` / `_MF_DOT` / `_MF_DEBUFF` / `_MF_BUFF`); ai.js
`HARD_CC` counts feared / possessed / infected as denial. Nothing applies
them yet (that is Phase 5) — but the engine already honours each one:

| Status | Where the engine reads it |
|---|---|
| Haunted / Corroded | `onRoundEnd` DoT ticks (28 / 44, armor ignored, applier credited through `_statusSrc` like poison). **Corroded wears `countsAs: ['burn','poison']`** — battle.js `bonusStatusMatches` treats it as both for every `bonusVsStatus` payoff. It does NOT trigger burn-only mechanics (water dousing, lava escalation, Wet immunity) — those key on the burn id on purpose. |
| Grievous Wound | `healTakenMult 0.5` — the Phase 3 field, `applyHealingToUnit`. |
| Feared | `blockAction` + `fear`. state.js `getNextBlitzUnit` is now GENERIC: a status with blockMove AND blockAction skips the activation (stun, frozen, Stoneform); Feared blocks only actions, so the unit activates and battle.js `_continueBlitzWithUnit_impl` spends that activation on `_fearFleeMove` — the reachable `getMoveTiles` tile farthest (Manhattan) from `_fearSourceId`, through the ordinary `doMove` (animation, opportunity attacks, state-sync), then AP 0 and `maybeAdvanceTurn`. Human and CPU alike; "nowhere to run" just ends the turn. |
| Possessed / Infected | Rows + fields only: `control: true`, `_controllerPlayer` / `_possessLeft` stamped by `applyStatusPayload`; Infected also `blockSpells` + `stageMod {atk:1, spd:1}`. **The controller hand-off (§5.5 `getControllingPlayer` in the blitz activation, the HUD ownership gate, the online guest-emit path) is NOT built** — it lands with the `possess` spell kind (wave B). Until then no spell applies either status. |
| Stoneform | `blockMove` + `blockAction` (activation skipped), **`invulnerable: true`** instead of `damageTakenMult 0` (the existing Protected pipeline: "takes no damage", Press-Turn miss), `regenPct 0.15` via `onRoundEnd` (`applyHealingToUnit` preScaled). It is a buff, so cleanse never touches it; `dispelProof: true` is the flag the future purge kinds (`cleanseArea`) must honour. |
| Soul-Bound / Voodoo | `_procLinks(target, dealt, opts)` runs in `applyDamageToUnit` right after HP drops. Soul-Bound: partner `_boundToId` takes `linkEcho` 30 % (`linkEchoBoosted` 45 % while the binder — `_statusSrc.soulBound` — has a live positive M.ATK stage). Voodoo: every enemy whose `_voodooAllyId` is the victim takes 50 %. Echoes resolve like DoT ticks (armor ignored, no offensive multipliers, the link's caster credited) and carry `opts._linkEcho` so they never chain. **Partner ids ride the payload** (`{ id:'soulBound', partnerId }`, `{ id:'voodoo', allyId }`) — the `link` spell kind supplies them. |
| Shadow Realm | `kind: 'marker'`, `realm: true`, `_realmPartnerId` from `payload.partnerId` (apply it to BOTH units). Helpers `unitShadowRealmPartnerId` / `isUnitRealmShieldedFrom(unit, actor)` (on `window` for the AI) gate: `doAttack` + unit-targeted offensive `doSpell` (refused), `applyDamageToUnit` (source-less damage — zones, weather, DoTs — and every non-partner no-op; link echoes pass), `applyHealingToUnit` (sourced heals from non-partners no-op; regen / pixie dust / self-heals pass), `applyStatusPayload` (non-partner statuses bounce), `isUnitConcealedFrom` (hidden from a viewer who owns neither — moot in 2P). Zone/weather TICKS still run and are absorbed by the damage gate rather than skipped. The Void Stage presentation and the AI's target filter arrive with Shadow Realm★ (wave B). |
| Roped | `blockMove` + `dragDamagePerTile 20`; `_tetherCasterId` from the applier. battle.js `_tetherFollow` runs in `finishMoveAt` for EVERY move the roper makes (forced moves included): each victim is dragged into the tile the roper just left (skipped when a unit stands there or the victim can't traverse it), 20 × tiles displaced, rig tween through `ThreeAnim.walkPath`. Simplification vs §5.1: the victim lands on the roper's ORIGIN tile rather than walking the whole path tile-for-tile. |
| Incendiary Rounds | `basicAttackStatus {burn, 2}` — `applyDamageToUnit` after a landed physical hit with no `spellType` (basic + opportunity attacks), next to Serrated. |
| Sparkling | `stageMod {spd:1}` + `shedMotes {blindOnStep:1}`: `finishMoveAt` calls `dropPixieDust(unit, ox, oy, { force, blindOnStep })` for any mote-shedding status (non-fairies included); an enemy stamping such a mote (`checkPixieDustPickup`) is Blinded 1 by the mote's caster. Motes are the fairy's `state.pixieDust` objects (already synced). |
| Levitating | `grantsFlight`: map.js `canFly` reads the raw status; `onApply` → battle.js `levitateUnit` (`_resolveTakeoffZ`, the rig tween); `onRemove` → `forceGroundUnit` (runs BEFORE the key is deleted so the unit still counts as a flyer while it is set down). |
| Blessed | `stageMod {def:1, mdef:1}` + 40 regen `onRoundEnd`. |
| Monstrous | `blockSpells`, `stageMod` ×4, `rangeDelta 1`, `hpMaxMult 1.25` via `onApply` (adds 25 % of max HP to max AND current, guarded by `_monsterHpBonus` so a refresh never stacks) / `onRemove` (takes it back, HP clamped). |
| Extended Clips | `stageMod {atk:1}` + `rangeDelta 1`. |
| Car / Mecha | Visible stance carriers (`stack: 'replace'`, `form`); Mecha `stageMod {spd:-3, def:1, mdef:2}` + `rangeDelta 2`. The `transform` kind and the model swap are wave A. |
| Shield | `kind: 'buff'` + a library desc; still the display badge over `unit.shield`. |

**Engine changes that fell out of it (deliberate):**
- **`unitSpellsBlocked(unit)`** replaces every `unitHasStatus(x, 'silence')` gate in battle.js and ui.js (15 + 2 sites): silence OR any `blockSpells` status (Monstrous, Infected). The refusal text still says "silenced".
- **`rangeDelta` is generic:** `getEffectiveRange` sums every active status' `rangeDelta`. Invisible's +1 now rides its def instead of a hard-code; **Jack of All's RNG +1 is live for the first time** (its desc always promised it; the field was never read).
- **`onApply(unit, src, {refreshed, payload})` / `onRemove(unit)`** def hooks fire from `applyStatusPayload` / `clearStatus`; `removeDebuffs` (the wipe-everything reset) now routes active keys through `clearStatus` so the hooks (and the RenderBus repaint) fire there too.
- **Generic blitz skip** (state.js `getNextBlitzUnit`): blockMove + blockAction ⇒ skipped, same log text as before for stun / frozen.
- **§5.6 retune:** 34 spells went ±2 → ±1 (Howl, Siege Mode, Overcalculate, Underdog Spirit, Sad Backstory, Plot Armor, Oath of Valor, Ayahuasca Retreat, Telepathic Link, Polymorph, Pleiadian Shield, Chitin Armor, Wish Granted, Blood Ritual, Inner Demon, Rally Command, Iron Bulwark, Grim Resolve, Tin Foil Hat, Hellfire Crown, Stone Skin, Nitro Boost, Thick Hide, Ki Charge, Royal Decree, Monkey Business, Death Pact, Audible, End Zone Dance, Steal from the Rich, Forest Ambush, Naughty List, and the Psychic job spell Psychosis); Calcify −3 → −2; Mimicry, Swarm Signal and Awakening (ring-3 capstones) keep ±2. Descriptions changed with the numbers. NOT touched: the Discord STATUS carrier (−2 ATK / −1 DEF, six spells) — it is a status, not a `statStageBoost`; §10 #22 asks.
- **Tests:** champ-rework.test.js Phase 4 block — the §5.1 table (kind + hook fields + the four registries), the promised numbers (incl. Monstrous apply/remove on a stub), the AI / mana / spell-card registries, source-text guards for every consumer (incl. "no site still reads silence alone"), and the §5.6 rule (any ±2 `statStageBoost` must be a ring-3 capstone or Calcify; descs agree).

### 5.9 SHIPPED 2026-09-08 — Phase 5 wave A, the reuse-heavy spell wave (what landed, and where it differs from §6)

Sixteen new spell rows, six renames / retunes, two new kinds, five new
flags, one new status field and one new zone field. Every new spell is a
`RACE_ABILITIES` row on its §6 node (twin arrays in `RACE_TREE`), rides an
existing VFX recipe by family (three-vfx-effects.js `SPELL_MAP['<id>'] =
Object.assign({}, SPELL_MAP['<sibling>'])` block at the end of the pass-3
section; Ice Shard / Grave Chill also sit in the bolt-preset table), and is
guarded by champ-rework.test.js (the `WAVE_A` table).

| Race | Landed | Node |
|---|---|---|
| quarterback | **QB Sneak** `raceQBSneak` (escape 3 + Invisible 1) | r2 Blitz ⇄ QB Sneak |
| honda civic | **Transform** `raceTransform` (`transform`, formA carForm / formB mechaForm) | r2 Transform ⇄ Exhaust Cloud |
| santa clause | **Snowball Volley** `raceSnowballVolley` (aoe 3×3, r4, 80 ice, Slow 1) · **White Christmas** `raceWhiteChristmas` (zoneDebuff 3×3, 2 rounds, Slow 1 each tick, `expireTerrain: 'ice'`) | r1 Coal ⇄ Volley · r3 Naughty List ⇄ White Christmas |
| yeti | **Ice Shard** `raceIceShard` (100 magic, r3, Slow 1) | r1 Frozen Punch ⇄ Ice Shard |
| ki fighter | Ki Volley range 3 → **4** | — |
| marksman | **Incendiary Rounds** `raceIncendiaryRounds` (self buff, `incendiary` 2) · Fire for Effect payoff → ×1.5 vs **Burn** · Take Aim (`headshot`, job-wide) `executeBelowPct: 0.15` | r2 Smoke Screen ⇄ Incendiary Rounds |
| skeleton | **Grave Chill** `raceGraveChill` (100 magic, r3, Slow 1) | r1 Bone Toss ⇄ Grave Chill |
| dinosaur | Apex Charge → **Stampede** (id kept) · **Tail Whip** `raceDinoTailWhip` (100 phys, r1, push 2) · **Apex Roar** `raceApexRoar` (warCry radius 2, +1 ATK) · Jurassic Jaw `onKillHealPct 0.25` + `onKillRefundAp 1` | r1 Primal Roar ⇄ Tail Whip · r3 Fissure ⇄ Apex Roar |
| bigfoot | **Treeline Retreat** `raceTreelineRetreat` (escape 3 + Regen 2) | r2 Blurry Photo ⇄ Treeline Retreat |
| gargoyle | **Stoneform** `raceStoneform` (self buff, `stoneform` 2) · **Perch Form deleted** | r2 Stoneform ⇄ Gothic Rampart |
| robinhood | **Piercing Arrow** `racePiercingArrow` (linePush r5, 120, push 2, `collisionBonus 60`, `collisionStatus root 1`, `collisionStatusBoth`) · Arrow Rain → **Arrow Volley** (id kept), range 4 → 6 | r3 Splitting ⇄ Piercing |
| superhero | **Freeze Breath** `raceFreezeBreath` (line r2, 40 ice, Frozen 1) · **Sky Tackle** `raceSkyTackle` (`tackle`: charge, push 4, `collisionBonus 50`, `collisionStatus stagger`) · Laser Beam → **Heat Vision** (id kept), range 5 → 3 | r2 Invulnerable ⇄ Freeze Breath · r3 Clap ⇄ Sky Tackle |
| cyborg | **Cluster Rockets** `raceClusterRockets` (aoe 3×3, r4, 110, Stagger 1) · **Plasma Cannon** `racePlasmaCannon` (line r4, **lineWidth 2**, 130, Burn 1) | r2 EMP ⇄ Rockets · r3 overclock ⇄ Plasma Cannon |
| conspiracy theorist | Truth Bomb → **Flat Earth** (id kept) + `terrainDeform: { flatten: true, radius: 1 }` | — |

**Engine (battle.js unless noted):**
- `SPELL_KIND_META.transform` / `.tackle`. **transform** branch in `doSpell`:
  clears the worn carrier, applies the other at 99 rounds ("permanent until
  re-cast"), sets `_spriteOverride` from the new `UNIT_ANIM_OVERRIDES[race]
  .formSprites[form]` table (`unitStanceForm` / `_formSpriteFor`; the
  `_applySpriteOverride` / `_revertSpriteOverride` beats now keep a worn
  form's sprite, so the mecha drives, casts and punches as the robot). The
  car wears NO badge at spawn; `carForm` only appears after a transform
  back. New STATUS field **`spellRangeDelta`** (`getEffectiveSpellRange`,
  ranged spells only) — mechaForm wears 2 so Robo Punch reaches 3.
  **tackle** = the damage branch (`spell.kind === 'damage' || 'tackle'`) +
  `_runPostEffects`: after the strike the victim slides `pushDistance`
  down the charge line, the caster lands one tile behind it, a wall or a
  bystander = `collisionBonus` (armour-proof) + `collisionStatus`.
- `_runPostEffects` also applies a **`damage`-kind `pushDistance`** now —
  Synthetic Punch, Rocket Fist and the reptilian's Tail Whip promised a
  knockback their engine never did (only the approach hologram believed
  it). Deliberate fix, veto in §10.
- **Escape-kind `statusEffects` land on the caster** (`escape` branch) —
  Mist Form's Invisible had never applied either; QB Sneak / Treeline
  Retreat / (wave B) Skulk depend on it.
- `_applyLineDamage`: **`getLineSpellLaneOffsets(spell, dx, dy)`** — width 2
  = one lane on the right hand of the firing direction, width 3 = both
  sides; lane cells inside + passable are swept (units, turrets,
  leaveTerrain), the spine keeps the LOS / bore / building logic. Same
  lanes in `getLineSpellRayTiles` (targets + click gate) and the direction
  preview. The AI's line scorer still values the spine only.
  **linePush pin riders** `collisionBonus` / `collisionStatus` /
  `collisionStatusBoth` after `resolveForcedSlide` reports a wall/unit.
- `applyTerrainDeform` **`flatten`** mode: `deform.radius` overrides the
  caller's radius; every footprint tile drops to the footprint's LOWEST
  base height (never raises; walls / mountains / objectives / solid props
  untouched, water settles, architecture re-settles as before).
- **`executeBelowPct`**: `_applyDamageSpellHit` arms it on the HP BEFORE the
  hit and, if the target still stands, `_applyExecuteRider` finishes it
  with a mitigation-proof follow-up (armour ignored, ×4 of what's left).
  Protected / invulnerable / realm-shielded units survive (the damage gate
  no-ops). The delayed Take Aim shot carries it on the `_delayedSpells`
  record; state.js `_detonateDelayedSpell` calls `window._applyExecuteRider`.
- **`onKillHealPct` / `onKillRefundAp`** (`_applyOnKillRiders`, AP capped at
  `UNIT_MAX_AP + _xpBonusAP`).
- zoneDebuff **`expireTerrain`**: stored on the zone, painted on the fade
  tick (walls / mountains / impassable skipped).
- ai.js: `tackle` in `DMG_KINDS` / `PRESS_KINDS`, scored as a hit + 16 per
  carried tile, targeted like damage; `transform` scorer (mecha when an
  enemy is within 4 or HP < 50 %, car otherwise, 0 when already in the
  wanted stance). hud.js spell-card parts, ui.js library filter.
- Online: nothing new to relay — transform is a `doSpell` game-action,
  the carriers + `_spriteOverride` + `_activeZones` ride state-sync, the
  morph aura goes through the relayed `VFX3D.fire`.

**Deviations from §6 (deliberate):**
- The dinosaur's Tail Whip id is **`raceDinoTailWhip`** (the reptilian's
  capstone owns `raceTailWhip`).
- Snowball Volley has no `proj-snowball` class yet (asset wishlist) — it
  rides Blizzard Present's aoe recipe.
- Apex Roar declares BOTH `aoeRadius: 2` and `auraRadius: 2` because the
  warCry branch reads `auraRadius || 3` — Audible's `aoeRadius: 2` has
  always resolved to 3 there (§10 #28).
- Stoneform's "HUD shows the lost activations" is the generic skip log.
- No cooldowns: the engine has no cooldown field; "Cooldown: N" in legacy
  descs is prose only.
- Tests: champ-rework.test.js "Phase 5 wave A" ×3 (the spell table, the
  renames / retunes / retirements, source-text guards for every engine
  site above); content-schema's twin test learned the QB's R2 pair.

### 5.6 Stage-buff retune that this pass makes necessary

STAT_REWORK §7 warned that +2-stage buffs doubled in strength when a stage
became 20 points. With SPD stages now = tiles, **Audible (team +2 SPD) is +2
tiles to the whole team** and Nitro Boost is +2 tiles. Rule for Phase 4:
**non-capstone stage buffs/debuffs are ±1 stage (one letter); capstones may
do ±2.** Affected in the listed kits: Audible, Nitro Boost, Howl, Ki Charge,
End Zone Dance, Forest Ambush, Naughty List, Steal from the Rich, Siege Mode,
Calcify (−3 → −2, it is the only M.ATK debuff and may keep −2). The roster
sweep of the remaining ~37 two-stage race abilities is the same commit.

---

## 6. The champs

Format per entry: **Role** · **Stats** (shipped line, grades, tiles, budget) ·
**Passives** · **Pillar** (r1 → r2 → r3 → r4★; `A ⇄ B` = twin node; NEW =
authored in Phase 5; existing ids reused so their VFX keep firing) · **New
spells** (numbers + presentation) · **Notes**. Costs are never listed — they
are the ring's (25/50/75/100).

### 6.1 Quarterback — the fragile deep threat
- **Role:** fast, long-range physical striker who dies to a stiff breeze.
- **Stats:** HP 540 B · MP 100 C · ATK 82 S · M.ATK 12 F · DEF 26 C · M.DEF 26 C · SPD 62 A (4 tiles) · AWR 84 S · Sniper kit (range 3) · budget 254.
- **Passives:** none new (the existing DESIGN rows Cannon Arm / Blitz stay unbuilt).
- **Pillar:** Bullet Pass → Blitz ⇄ **QB Sneak** (NEW) → Audible ⇄ Spike the Ball → Hail Mary★.
- **QB Sneak** — utility, `escape`, teleport 3 + Invisible 1 (the Mist Form archetype). Presentation: the QB drops into a three-point stance, jukes (the `dodge` clip twice), the camera loses him in a burst of turf (`dust-puff` world layer) and he fades — family "movement/escape" treatment, no bespoke director.
- **Notes:** Audible → +1 SPD stage (§5.6). Hail Mary keeps its bullet-cam sequence (#30).

### 6.2 Sedan (honda civic) — the transformer
- **Role:** two stances. **Car**: one of the fastest units, melee, high ATK, high armor, paper M.DEF. **Mecha**: slow, armored, +2 range.
- **Stats (car, stored):** HP 520 C · MP 90 C · ATK 78 A · M.ATK 10 F · DEF 66 A · M.DEF 26 C · SPD 84 S (5 tiles) · AWR 28 C · budget 269. **Mecha** = car + `mechaForm`: SPD 24 C (2 tiles), DEF 86 S, M.DEF 66 A, range 3 — budget-neutral by construction (−48 SPD, +13 DEF, +20 M.DEF, +16 range).
- **Pillar:** Ram Charge → **Transform** (NEW) ⇄ Exhaust Cloud → Robo Punch ⇄ Nitro Boost → Vehicular Manslaughter★.
- **Transform** — `transform`, 1 AP, self. Car ⇄ Mecha. Presentation: the existing morph (`transformFx` ground ring + the robot model) held as a glam-cam beat (`cineFaceCam` low ¾, `cinePushIn`), a mechanical DOOR-kit clank; guest sees it through the `_spriteOverride` state + `VFX3D.fire('aura', 'raceTransform')`.
- **Notes:** Robo Punch is the mecha-form payoff (range 3 in mecha, ×1.5 vs Stagger); Vehicular Manslaughter is the car-form payoff. Nitro Boost → +1 stage.

### 6.3 Santa Clause — the bulky snow controller
- **Role:** a slow, hard-to-kill AOE crowd-controller. Job **Tank → Black Mage** (shipped).
- **Stats:** HP 580 B · MP 200 A · ATK 34 C · M.ATK 74 A · DEF 46 B · M.DEF 60 B (> DEF) · SPD 30 C (2) · AWR 42 B · budget 272.
- **Pillar:** Lump of Coal ⇄ **Snowball Volley** (NEW) → Sleigh Dash → Naughty List ⇄ **White Christmas** (NEW) → Blizzard Present★. Area spells on the pillar: 3.
- **Snowball Volley** — `aoe` 3×3, range 4, 80 magic (ice), Slow 1. Presentation: a fan of snowballs (`proj-snowball` new projectile class, white spheres) lobbed in an arc, six `flash` puffs on landing, `sig` snow kit for the drift; family aoe treatment.
- **White Christmas** — `zoneDebuff` 3×3, range 4, 2 rounds, Slow 1 reapplied each round, `leaveTerrain: 'ice'` on expiry. Presentation: the existing snow-vortex primitive (Absolute Zero's) at half intensity, crane shot; the ice paints on the last tick.
- **Notes:** Sleigh Dash is the "get into the middle" tool the owner asked for and already exists; Naughty List → −1 stage.

### 6.4 Werewolf — two lives a night
- **Role:** by day a weak human who scouts, hunts keys and creeps toward the backline; by night a 5-tile monster.
- **Stats (day, stored):** HP 560 B · MP 80 C · ATK 50 B · M.ATK 10 F · DEF 40 C · M.DEF 30 C · SPD 40 C (2) · AWR 42 B. **Night:** ATK 90 S · SPD 100 S (5 tiles) · DEF 80 A · M.DEF 50 B. Budget = average = 264.
- **Passives:** **Lycanthropy** (replaces the nocturnal sleep preference) · **Bloodcraze** (+25 % damage vs targets ≤30 % HP; +1 SPD stage while any visible enemy is ≤30 %).
- **Pillar:** Bite ⇄ **Skulk** (NEW) → Howl ⇄ **Keen Nose** (NEW) → Feral Dive → Blood Frenzy★.
- **Skulk** — `escape`, teleport 3 + Invisible 1 (day tool). Presentation: shared with QB Sneak's family treatment, forest palette.
- **Keen Nose** — `scan` variant: reveals hidden/invisible enemies within 4 tiles for 2 rounds and Marks the visible enemy with the lowest HP. Presentation: sniff clip (`idle` variant), a red scent-trail beam (`k-signal` insert) to the mark; guest gets the reveal through the existing scan relay.
- **Notes:** the night stages are the identity — Howl → +1 stage. The wolf/human model swap exists (sprites.js), it just needs the stat side. Blood Frenzy keeps its predator cam.

### 6.5 Yeti — Santa with a punch
- **Role:** a bruiser-mage hybrid: more ATK and SPD than Santa, less M.ATK, one area spell.
- **Stats:** HP 600 B · MP 120 C · ATK 60 B · M.ATK 52 B · DEF 46 B · M.DEF 52 B (> DEF) · SPD 46 B (3) · AWR 14 F · budget 272.
- **Pillar:** Frozen Punch ⇄ **Ice Shard** (NEW) → Ice Slide → Permafrost → Avalanche Strike★. Area spells: 1 (Permafrost). Summon Blizzard stays off-tree.
- **Ice Shard** — `damage` magic 100, range 3, Slow 1 (the single-target spell his new M.ATK exists for). Presentation: existing `_bolt_abszero`-family ice bolt, small; family bolt treatment.

### 6.6 Ghost — the untouchable DOT caster
- **Role:** 0 ATK, immune to physical damage, low M.DEF (magic is the counter), decent speed; haunts from range and steals bodies.
- **Stats:** HP 470 C · MP 240 S · ATK 0 F · M.ATK 88 S · DEF 10 F · M.DEF 34 C · SPD 52 B (3) · AWR 70 A · Psychic kit (2) · budget 268.
- **Passives:** flying · **Incorporeal** (phasing + immune to physical damage; absorbs Spectral Passage).
- **Pillar:** **Haunt** (NEW) → Cold Spot ⇄ Flash Freeze → **Possession** (REWORK) → Boo★.
- **Haunt** — `debuff`, range 5, applies `haunted` (28/round, 3 rounds). Presentation: a pale wisp (`k-stamp`-free) detaches from the ghost, crawls to the victim and sinks in; the victim's badge pulses each tick with the existing DOT camera pan.
- **Possession** — `possess`, range 3, 1 activation, cooldown 3. Presentation: the existing #32 hard-cut face cam on the victim, then the Void Stage `dream` palette for the stolen activation.
- **Notes:** Boo gains ×1.5 vs Haunted (payoff). Cold Spot/Flash Freeze twin frees a node for the rework without deleting anything.

### 6.7 Dragon — decent at everything but armor
- **Stats:** HP 560 B · MP 150 B · ATK 52 B · M.ATK 54 B · DEF 30 C · M.DEF 50 B · SPD 44 B (3) · AWR 28 C · budget 273.
- **Passives:** flying · **Dragon Reach** (basic attack range 2).
- **Pillar:** **Dragon Breath** (NEW) ⇄ Wing Attack → Dragonfear → Dragon Toss → Dragonfire★.
- **Dragon Breath** — `line`, range 3, width 1, 90 magic (fire), Burn 2, `lineZone`: the hit tiles burn for 2 rounds (Burn to anyone ending a turn there). Presentation: the beam reel's fire grammar (side dolly), flame columns `y-locked` on each tile for the zone's life, embers; SFX `burningDamage` on ticks.

### 6.8 Demon — binder of souls
- **Stats:** HP 520 C · MP 190 A · ATK 48 B · M.ATK 76 A · DEF 28 C · M.DEF 48 B · SPD 30 C (2) · AWR 28 C · budget 273.
- **Pillar:** Contract → Infernal Hurl ⇄ **Soul Bind** (NEW) → Devour Soul → Hellmouth★ ⇄ **Shadow Realm★** (NEW).
- **Soul Bind** — `link` enemy↔enemy (two clicks, range 3, both within 4 of each other), `soulBound` 3 rounds: 30 % damage echo, 45 % while the demon carries a live +M.ATK stage. Presentation: a chain of shadow (`k-scripture` insert of the contract) drawn between the two victims, a tether primitive that stays for the duration (the Chivalry tether CSS exists), reverse-OTS beat on the second victim.
- **Shadow Realm★** — `shadowRealm`, range 3, 2 rounds, cooldown 3. Presentation: Void Stage new `shadow` palette held for the whole duration (`maxMs`), witnesses see both units vanish in a black flare; a `k-glitch`-style seam closes behind them.
- **Notes:** Devour Soul gains ×1.5 vs Soul-Bound (in addition to Contract).

### 6.9 Shaman — the spirit broker
- **Stats:** HP 470 C · MP 250 S · ATK 18 F · M.ATK 84 S · DEF 26 C · M.DEF 66 A · SPD 28 C (2) · AWR 56 B · budget 254.
- **Pillar:** Herbal Remedy → Spirit Walk ⇄ **Sacrifice** (NEW) → Ayahuasca Retreat ⇄ **Voodoo** (NEW) → Bad Trip★.
- **Sacrifice** — `transfer` (two clicks, allies within 3): takes 30 % of A's max HP (never lethal), heals B for 150 % of it (M.ATK-scaled). Presentation: the heal letterbox cinematic with a red bead flowing A → B (the Lifetap drain primitive reversed).
- **Voodoo** — `link` ally↔enemy (two clicks, range 3): `voodoo` 3 rounds, 50 % of damage the ally takes hits the enemy. Presentation: a tiny doll insert (`k-stamp`) over the enemy, a pin-prick stagger each echo.
- **Notes:** Bad Trip gains ×1.5 vs Voodoo.

### 6.10 Ki Fighter — the slow striker with a 4-tile reach
- **Stats:** HP 570 B · MP 120 C · ATK 82 S · M.ATK 46 B · DEF 42 B · M.DEF 42 B · SPD 38 C (2) · AWR 28 C · budget 273.
- **Pillar:** Ki Volley (range 3 → **4**) ⇄ Flurry of Blows → Ki Charge ⇄ Ki Wave → Instant Transmission → Dragon Fist★. No new spells.
- **Notes:** Ki Wave is the "kamehameha" the owner floated for the cyborg; it stays here. Ki Charge → +1 stage.

### 6.11 Marksman — everything is terrible except the shot
- **Stats:** HP 440 F · MP 120 C · ATK 80 A · M.ATK 8 F · DEF 20 F · M.DEF 20 F · SPD 18 F (1 tile) · AWR 98 S · Sniper kit · budget 250 (Longshot priced at 40 — the number to revisit with data).
- **Passives:** **Longshot** (basic attacks reach any visible enemy in line of sight) · **Point Blank** (+30 % basic-attack damage within 2 tiles).
- **Pillar:** Suppressive Fire → Smoke Screen ⇄ **Incendiary Rounds** (NEW) → Rangefinder → Fire for Effect★.
- **Incendiary Rounds** — self `buff`, `incendiary` 2 rounds (basic attacks apply Burn 2). Presentation: a magazine-swap insert (`k-terminal`), tracer rounds get an ember tail (`proj-bullet` variant `proj-tracer`).
- **Notes:** Camouflage and Headshot already sit on the Sniper job pillar; **Headshot gains `executeBelowPct: 0.15`** (job-wide — every Sniper). Fire for Effect's payoff flips to ×1.5 vs Burn.

### 6.12 Atlantean — the wave
- **Stats:** HP 580 B · MP 190 A · ATK 62 A · M.ATK 64 A · DEF 26 C · M.DEF 28 C · SPD 28 C (2) · AWR 42 B · melee · budget 257.
- **Pillar:** Whirlpool → Water Pulse → Temporal Tide ⇄ Great Flood → Poseidon's Wrath★ ⇄ **Tsunami★** (NEW).
- **Tsunami★** — `linePush`, range 4, **width 3**, 160 magic (water), push 2, Slow 1. Presentation: the beam reel's side dolly with a three-tile wall of water (the Great Flood surface primitive extruded), units tumble with the push ghosts; crane out on the recede.

### 6.13 Skeleton — sword or spell, back in half the time
- **Stats:** HP 540 B · MP 120 C · ATK 70 A · M.ATK 42 B · DEF 36 C · M.DEF 62 A · SPD 46 B (3) · AWR 28 C · budget 273.
- **Passives:** **Bone Deep** (respawn timer halved: 1, 1, 2, 4).
- **Pillar:** Bone Toss ⇄ **Grave Chill** (NEW) → Reassemble → Poison Swamp ⇄ Fissure → Marrowstorm★.
- **Grave Chill** — `damage` magic 100, range 3, Slow 1 (the single-target spell for the sword-and-sorcery read). Presentation: a skull-shaped cold bolt (`_bolt` preset), bone-dust impact; family bolt treatment.

### 6.14 Dinosaur — the reach bruiser
- **Stats:** HP 720 S · MP 60 F · ATK 74 A · M.ATK 8 F · DEF 72 A · M.DEF 34 C · SPD 46 B (3) · AWR 28 C · budget 260.
- **Passives:** **Reach** (melee range 2).
- **Pillar:** Primal Roar ⇄ **Tail Whip** (NEW) → Stampede (= Apex Charge, renamed) → Fissure ⇄ **Apex Roar** (NEW) → Jurassic Jaw★ (= the owner's Bite).
- **Tail Whip** — `damage` physical 100, range 1, push 2. Presentation: a spin (`Sword_Attack`-slot clip on the tail rig), the target's displacement ghost.
- **Apex Roar** — `warCry` radius 2, allies +1 ATK stage. Presentation: the roar clip with a shockwave ring (`world`), witness cam on an ally.
- **Jurassic Jaw★** gains `onKillHealPct: 0.25, onKillRefundAp: 1`. Stampede: verify the dash lands past the last victim ("gets behind them").

### 6.15 Cowboy — the wrangler
- **Role:** utility: rope, drag, scout, keep range. Not a killer.
- **Stats:** HP 640 A · MP 150 B · ATK 40 C · M.ATK 22 C · DEF 36 C · M.DEF 36 C · SPD 72 A (4) · AWR 84 S · Gunslinger kit (2) · budget 253.
- **Passives:** **Quickdraw** (wins every speed tie).
- **Pillar:** Lasso (REWORK) → Fan the Hammer ⇄ **Dynamite** (NEW) → Quick Draw (range 3 → 5, "Long Rifle") ⇄ **Whistle** (NEW) → High Noon★.
- **Lasso** — `pull` 2 + `tethered` 2 rounds (the owner's "OR" version): the target can't move on its own and is dragged behind the cowboy tile-for-tile as he moves, 20 damage per tile. Presentation: the rope tether primitive (Chivalry tether CSS) that stays attached; each drag replays the walk ghosts for the victim.
- **Dynamite** — `aoe` 3×3, range 3, 110 physical, Stagger 1. Presentation: overhand toss (the contact-bomb presentation), fuse spark, the `nuclear`-lite blast.
- **Whistle** — `summonUnit` "Hound": moves 4/round toward the nearest enemy, reveals invisible units within 3 (Hagstone rule), bites 60 at end of round, 3 hits to destroy, one per cowboy. Presentation: a hound model (asset wishlist) or the existing spider-1 sprite recolored until it lands; witness cam from the hound.
- **Notes:** High Noon's payoff → ×1.5 vs Roped.

### 6.16 Bigfoot — never a clear photo
- **Stats:** HP 700 S · MP 80 C · ATK 80 A · M.ATK 10 F · DEF 56 B · M.DEF 50 B · SPD 44 B (3) · AWR 28 C · budget 267.
- **Passives:** **Cryptid** (enemies can only see/target him within 3 tiles).
- **Pillar:** Big Kick ⇄ Tremor Stomp → Blurry Photo ⇄ **Treeline Retreat** (NEW) → Trunk Throw → Sasquatch Smash★.
- **Treeline Retreat** — `escape` 3 tiles + Regen 2 ("eat berries"). Presentation: a backwards lope into the near-kit trees (the MAP SETTINGS scenery), leaves burst, the regen pulse.
- **Notes:** the disengage + heal the owner asked for is one spell so the passive can re-engage.

### 6.17 Gargoyle — the stone guardian
- **Role:** close-range brawler that can turn to stone. Job **Sniper → Tank** (shipped).
- **Stats:** HP 620 A · MP 90 C · ATK 50 B · M.ATK 14 F · DEF 60 B · M.DEF 58 B · SPD 52 B (3) · AWR 70 A · budget 253.
- **Pillar:** Wing Attack ⇄ Stonefall → **Stoneform** (NEW) ⇄ Gothic Rampart → Calcify → Stone Drop★.
- **Stoneform** — self `buff`, `stoneform` 2 rounds: can't move or act, immune to all damage, regen 15 % max HP per round. Presentation: the Calcify grey-shell primitive at full scale (the whole model petrifies), the HUD shows the lost activations; a crumble burst on expiry.
- **Notes:** Perch Form is retired (Stoneform is its grown-up version).

### 6.18 Zombie — it keeps coming back
- **Stats:** HP 660 A · MP 70 F · ATK 68 A · M.ATK 0 F · DEF 84 S · M.DEF 26 C · SPD 46 B (3) · AWR 28 C · budget 249.
- **Passives:** **Return of the Dead** (respawns on its death tile).
- **Pillar:** Infectious Bite → Zombie Rush ⇄ **Cannibalize** (NEW) → Outbreak ⇄ **Infect** (NEW) → Shambling Horde★.
- **Infect** — `possess` (`infected`): range 1, controls the victim for 4 activations, melee only, +1 ATK / +1 SPD stage. Presentation: the bite from Infectious Bite, then the victim's model gets the `plague_flesh` tint and a shambling walk clip (`Zombie_Walk_Fwd_Loop`, already in the library).
- **Cannibalize** — corpse-targeted (the raiseDead targeting), range 2: heal 35 % max HP, the corpse's respawn timer +2 rounds. Presentation: the heal letterbox with a horror palette; the bone pile prop shrinks.

### 6.19 Gangster (NEW race) — the street enforcer
- **Role:** mid HP/defenses, high ATK, no magic, good speed; punishes anyone who moves near him. Human · Gunslinger (kit 2) · faction space.
- **Stats:** HP 540 B · MP 100 C · ATK 78 A · M.ATK 10 F · DEF 44 B · M.DEF 44 B · SPD 64 A (4) · AWR 56 B · budget 269.
- **Passives:** **Shank** (opportunity attacks always land and deal ×1.5).
- **Pillar:** Stomp Out → Drive-By ⇄ Hit a Lick → Choppa → Extended Clips★ (5 new — everything is new for a new champ).
- **Stomp Out** — `damage` physical 120, range 1, `grievous` 2. **Drive-By** — `dashThenShoot`: dash 3, then a 100 physical shot at an enemy within 3 of the landing tile. **Hit a Lick** — `steal`, range 2, 60 damage, takes keys/hourglasses and the item. **Choppa** — `line`, range 5, 110 physical, `boomerang`-style double pass? no — single pass, `multiHit` feel through 3 rapid impact VFX. **Extended Clips★** — `warCry` radius 3, allies `extendedClips` 3 rounds (+1 RNG, +1 ATK stage).
- **Presentation:** drive-by = the Ram Charge Tokyo-Drift side dolly with muzzle flashes; choppa = the beam reel's bullet grammar; extended clips = glam cam + `k-terminal` "RELOAD" insert.
- **New-race checklist:** §9.5.

### 6.20 Nun (NEW race) — the sister of mercy
- **Role:** low HP/armor, decent M.DEF, no attack, high magic, slow — a pure support. Today the Nun is the priest's female form; this makes her a champ of her own (assets already exist: the priest's female sprite/model/portrait). Human/Divine · White Mage.
- **Stats:** HP 460 C · MP 250 S · ATK 8 F · M.ATK 90 S · DEF 26 C · M.DEF 58 B · SPD 30 C (2) · AWR 70 A · budget 255.
- **Passives:** **Devout** (heals she casts +20 %).
- **Pillar:** Purify ⇄ Smite (shared `raceSmite`) → Blessing → Prayer → Hallelujah★.
- **Purify** — `cleanseArea` 3×3, range 3: allies lose all debuffs, enemies lose all buffs. **Blessing** — `buff` ally, `blessed` 3 rounds. **Prayer** — `shield` ally, 150 HP barrier (M.ATK-scaled) → the `shield` status finally has a library row. **Hallelujah★** — `healAll` 180 + cleanse 2.
- **Presentation:** the heal letterbox family; Purify = a light pillar over the 3×3 with `k-scripture` insert; Hallelujah = the divine host's choir stinger and the Merkaba light-pillar collapse.
- **Decision needed:** separate race (recommended — the female priest assets are already on R2) vs. nun kit on the priest (§10).

### 6.21 Fairy — glitter and lift
- **Stats:** HP 470 C · MP 220 A · ATK 8 F · M.ATK 68 A · DEF 22 C · M.DEF 66 A · SPD 64 A (4) · AWR 70 A · budget 264.
- **Passives:** flying · Pixie Dust Trail (register the coded passive).
- **Pillar:** Glitterburst ⇄ **Sparkle** (NEW) → Pixie Dust ⇄ **Fairy Dust** (NEW) → Trick Room ⇄ **Glitter Bomb** (NEW) → Fae Ring★.
- **Sparkle** — `buff` ally, `sparkling` 2 rounds (+1 SPD stage, sheds blinding glitter motes). **Fairy Dust** — `warCry` radius 3: allies `levitating` 2 rounds (temporary flight, high-ground bonus). **Glitter Bomb** — `aoe` 3×3, range 4, 100 magic (light), Blind 1.
- **Presentation:** Sparkle = the pixie-dust mote system with a gold palette and a trail that persists; Fairy Dust = the bat-transform lift beat for each ally (crane shot); Glitter Bomb = the prismatic kaleidoscope kit at a small radius with a white-out flash for the Blind.

### 6.22 Black Goo — the ooze
- **Role:** slow, low damage, sturdy; everything it touches is gooed. Job **Psychic → Tank** (shipped; melee).
- **Stats:** HP 600 B · MP 160 B · ATK 40 C · M.ATK 46 B · DEF 54 B · M.DEF 54 B · SPD 30 C (2) · AWR 42 B · budget 256.
- **Passives:** **Oozing** (melee contact either way applies Goo; its own tile becomes goo terrain at end of turn).
- **Pillar:** **Goo Shot** (NEW) ⇄ Corrosive Splash → **Icky Surprise** (NEW) ⇄ Absorb → **Splash** (NEW) ⇄ Toxic Nova → Mitosis★.
- **Goo Shot** — `damage` magic 90, range 4, applies Goo BEFORE the damage (so the ×1.25 lands), tile becomes goo. **Icky Surprise** — `teleport` to any goo tile within 6, no LOS. **Splash** — `barrage` radius 1 self-origin, 60 magic, Goo to enemies and goo terrain on the 3×3.
- **Presentation:** goo = the blood-glob pool primitive recolored black (`globColor`), Icky Surprise = the goo melts into the floor (`death` clip reversed) and erupts from the target tile; Absorb gains ×1.5 vs Gooed.

### 6.23 Ghoul — pure negativity
- **Stats:** HP 570 B · MP 110 C · ATK 68 A · M.ATK 20 F · DEF 48 B · M.DEF 48 B · SPD 42 B (3) · AWR 56 B · Agent kit (2) · budget 264.
- **Passives:** **Pure Negativity** (immune to every debuff status and every negative stat stage).
- **Pillar:** Ghoulish Bite ⇄ **Frenzy** (NEW) → Corpse Crawl ⇄ **Fear** (NEW) → Poison Swamp ⇄ Carrion Feast (demoted from capstone, tier II) → **Terror Pounce★** (NEW).
- **Frenzy** — `lifeDrain` physical 120, range 1, drain 30 %, `grievous` 2. **Fear** — `barrage` radius 3 self-origin, 0 damage, `feared` 1 round (the victims flee on their next activation). **Terror Pounce★** — charge 180 physical, ×1.5 vs Feared, strips the target's buffs.
- **Presentation:** Fear = the horror family (D) with the `vignette` grade and a scream stinger, every victim gets the reverse-OTS beat; Terror Pounce = the Blood Frenzy predator cam locking onto the feared victim.

### 6.24 Robin Hood — the bleeding quiver
- **Role:** the marksman's opposite number: stronger, faster, shorter reach, a little sturdier. Sniper kit (3) — still less reach than Longshot.
- **Stats:** HP 500 C · MP 110 C · ATK 88 S · M.ATK 12 F · DEF 22 C · M.DEF 30 C · SPD 48 B (3) · AWR 98 S · budget 259.
- **Passives:** **Serrated** (basic attacks and physical spells apply Bleed 2).
- **Pillar:** Fire Arrow ⇄ Poison Arrow → Steal from the Rich ⇄ Bomb Arrow → Splitting Arrow ⇄ **Piercing Arrow** (NEW) → Arrow Volley★ (= Arrow Rain, renamed, range 4 → 6).
- **Piercing Arrow** — `linePush`, range 5, 120 physical, push 2; on collision with terrain or a unit: +60 damage and BOTH are Rooted 1 ("pinned"). Presentation: bullet cam down the bolt, the collision uses the sky-throw crash beat.

### 6.25 Superhero — everything but magic resistance
- **Stats:** HP 540 B · MP 90 C · ATK 66 A · M.ATK 42 B · DEF 62 A · M.DEF 10 F · SPD 62 A (4) · AWR 28 C · budget 273 (every stat at the floor of its band, four A's — the "good at everything" tax).
- **Passives:** flying (always airborne).
- **Pillar:** Heroic Leap → Invulnerable ⇄ **Freeze Breath** (NEW) → Shockwave Clap ⇄ **Sky Tackle** (NEW) → Heat Vision★ (= Laser Beam, renamed, range 5 → 3).
- **Freeze Breath** — `line`, range 2, length 2, 40 magic (ice), Frozen 1. **Sky Tackle** — `tackle`: charge, then carry the target up to 4 tiles along the line; collision +50 and Stagger.
- **Presentation:** Freeze Breath = the whiteout snow-vortex kit, short; Sky Tackle = the chase cam of the dash with the victim as a displacement ghost the whole way, crash beat on collision.

### 6.26 Mad Scientist — the ray gun
- **Stats:** HP 460 C · MP 230 A · ATK 12 F · M.ATK 84 S · DEF 22 C · M.DEF 30 C · SPD 42 B (3) · AWR 84 S · budget 250.
- **Passives:** **Mad Genius** (+1 M.ATK stage every 3rd round, resets on death) · **Ray Gun** (basic attacks are magic, range 2).
- **Pillar:** Tesla Coil → Cloning Machine ⇄ **Summon Creation** (NEW) → Chemical Concoction (= Chemical Bath, reworked) ⇄ **Monster Serum** (NEW) → Plandemic★.
- **Chemical Concoction** — `aoe` 3×3, range 3, 110 magic, `corroded` 2 (burns AND poisons as ONE status). **Summon Creation** — `summonUnit`: moves 3, melee 90, 4 hits, armored (halves physical), chases the nearest enemy, one per scientist. **Monster Serum** — `buff` ally or creation, `monster` 3 rounds.
- **Presentation:** the creation = a stitched-together model (asset wishlist; fallback = the necromancer's flesh abomination); serum = the Overclock aura in toxic green with the model scaled ×1.3 (the minimize path in reverse).

### 6.27 Cyborg — the reactor
- **Role:** durable tech caster whose spells are expensive but self-refuelling. Job **Raider → Engineer** (shipped).
- **Stats:** HP 560 B · MP 100 C · ATK 46 B · M.ATK 72 A · DEF 46 B · M.DEF 42 B · SPD 46 B (3) · AWR 28 C · budget 272.
- **Passives:** flying · **Power Core** (spells cost ×1.5; basic-attack hits restore 25 MP; taking magic damage restores 30 % of it as MP).
- **Pillar:** Synthetic Punch → EMP Grenade ⇄ **Cluster Rockets** (NEW) → overclock ⇄ **Plasma Cannon** (NEW) → Rocket Toss★.
- **Cluster Rockets** — `aoe` 3×3, range 4, 110 magic, Stagger 1. **Plasma Cannon** — `line`, range 4, **width 2**, 130 magic, Burn 1.
- **Presentation:** rockets = the missile-barrage descent system (the `missile` sprite exists); plasma cannon = the beam reel with a two-tile-wide cylinder and the arm-morph insert.

### 6.28 Conspiracy Theorist — Flat Earth
- **Stats:** unchanged by design (sweep-normalized: budget 250).
- **Change:** Truth Bomb → **Flat Earth★**: same 180 magic single target, range 4, ×1.5 vs Silenced/Poisoned, plus `terrainFlatten: { radius: 1 }` — the 3×3 around the victim collapses to its lowest height. Presentation: the existing capstone beat plus the terrain-deform pipeline's slab animation; a `k-stamp` "FLAT" insert.

### 6.29 Vampire and Succubus — thralls
- **Stats:** sweep-normalized (vampire 268, succubus 274 — no identity change).
- **Vampire:** Bite → Mist Form → Bat Swarm ⇄ **Thrall Bite** (NEW: `possess` 1 activation + 80 physical lifeDrain 25 %) → Predator Drop★.
- **Succubus:** Soul Suck → Charm → Sleep Paralysis ⇄ **Enthrall** (NEW: `possess` 1 activation, range 2, ×1.5 vs Charmed) → Draining Embrace★.
- **Presentation:** both ride the Possession face-cam beat with the `valentine` palette.

---

## 7. The roster sweep (SHIPPED)

Before → **after** for every race (grade beside each number, tiles beside SPD,
budget last). Bold cells changed. `npm run grades` prints the live version.

### 7.1 The reworked champs (27 in the roster; gangster and nun join in Phase 6)

| champ | HP | MP | ATK | M.ATK | DEF | M.DEF | SPD (tiles) | AWR | budget |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **quarterback** | 535 → **540 B** | 100 C | 72 → **82 S** | 22 → **12 F** | 26 C | 27 → **26 C** | 35 (2) → **62 A (4)** | 84 S | 233 → **254** |
| **honda civic** | 640 → **520 C** | 110 → **90 C** | 62 → **78 A** | 25 → **10 F** | 65 → **66 A** | 50 → **26 C** | 51 (3) → **84 S (5)** | 28 C | 266 → **269** |
| **santa clause** (job Tank → **Black Mage**) | 805 → **580 B** | 110 → **200 A** | 52 → **34 C** | 31 → **74 A** | 82 → **46 B** | 84 → **60 B** | 26 (2) → **30 C (2)** | 42 B | 284 → **272** |
| **werewolf** | 635 → **560 B** | 85 → **80 C** | 94 → **50 B** | 10 F | 42 → **40 C** | 32 → **30 C** | 58 (3) → **40 C (2)** | 42 B | 269 → **264** |
| **yeti** | 660 → **600 B** | 75 → **120 C** | 94 → **60 B** | 5 → **52 B** | 44 → **46 B** | 29 → **52 B** | 43 (3) → **46 B (3)** | 28 → **14 F** | 243 → **272** |
| **ghost** | 500 → **470 C** | 240 S | 8 → **0 F** | 92 → **88 S** | 28 → **10 F** | 90 → **34 C** | 53 (3) → **52 B (3)** | 70 A | 323 → **268** |
| **dragon** | 440 → **560 B** | 205 → **150 B** | 40 → **52 B** | 70 → **54 B** | 22 → **30 C** | 84 → **50 B** | 23 (2) → **44 B (3)** | 42 → **28 C** | 272 → **273** |
| **demon** | 520 C | 145 → **190 A** | 36 → **48 B** | 52 → **76 A** | 22 → **28 C** | 54 → **48 B** | 26 (2) → **30 C (2)** | 28 C | 226 → **273** |
| **shaman** | 650 → **470 C** | 240 → **250 S** | 36 → **18 F** | 84 S | 39 → **26 C** | 86 → **66 A** | 26 (2) → **28 C (2)** | 56 B | 302 → **254** |
| **ki fighter** | 665 → **570 B** | 115 → **120 C** | 96 → **82 S** | 31 → **46 B** | 40 → **42 B** | 40 → **42 B** | 60 (3) → **38 C (2)** | 42 → **28 C** | 295 → **273** |
| **marksman** | 500 → **440 F** | 110 → **120 C** | 80 A | 22 → **8 F** | 17 → **20 F** | 27 → **20 F** | 18 F (1) | 98 S | 269 → **250** |
| **atlantean** | 495 → **580 B** | 200 → **190 A** | 22 → **62 A** | 63 → **64 A** | 41 → **26 C** | 75 → **28 C** | 31 (2) → **28 C (2)** | 42 B | 247 → **257** |
| **skeleton** | 615 → **540 B** | 85 → **120 C** | 96 → **70 A** | 22 → **42 B** | 46 → **36 C** | 42 → **62 A** | 60 (3) → **46 B (3)** | 42 → **28 C** | 289 → **273** |
| **dinosaur** | 655 → **720 S** | 70 → **60 F** | 98 → **74 A** | 9 → **8 F** | 37 → **72 A** | 32 → **34 C** | 55 (3) → **46 B (3)** | 28 C | 265 → **260** |
| **cowboy** | 560 → **640 A** | 105 → **150 B** | 78 → **40 C** | 24 → **22 C** | 40 → **36 C** | 40 → **36 C** | 35 (2) → **72 A (4)** | 56 → **84 S** | 253 → **253** |
| **bigfoot** | 710 → **700 S** | 95 → **80 C** | 90 → **80 A** | 24 → **10 F** | 48 → **56 B** | 37 → **50 B** | 21 (2) → **44 B (3)** | 28 C | 264 → **267** |
| **gargoyle** (job Sniper → **Tank**) | 580 → **620 A** | 75 → **90 C** | 66 → **50 B** | 18 → **14 F** | 44 → **60 B** | 24 → **58 B** | 8 (1) → **52 B (3)** | 84 → **70 A** | 221 → **253** |
| **zombie** | 720 → **660 A** | 45 → **70 F** | 60 → **68 A** | 0 F | 66 → **84 S** | 24 → **26 C** | 43 (3) → **46 B (3)** | 14 → **28 C** | 226 → **249** |
| **gangster** (job — → **Gunslinger**) | **540 B** | **100 C** | **78 A** | **10 F** | **44 B** | **44 B** | **64 A (4)** | **56 B** | **269** |
| **nun** (job — → **White Mage**) | **460 C** | **250 S** | **8 F** | **90 S** | **26 C** | **58 B** | **30 C (2)** | **70 A** | **255** |
| **fairy** | 435 → **470 C** | 230 → **220 A** | 8 F | 79 → **68 A** | 26 → **22 C** | 93 → **66 A** | 53 (3) → **64 A (4)** | 70 A | 281 → **264** |
| **black goo** (job Psychic → **Tank**) | 555 → **600 B** | 190 → **160 B** | 22 → **40 C** | 74 → **46 B** | 32 → **54 B** | 75 → **54 B** | 28 (2) → **30 C (2)** | 70 → **42 B** | 271 → **256** |
| **ghoul** | 505 → **570 B** | 130 → **110 C** | 66 → **68 A** | 31 → **20 F** | 26 → **48 B** | 50 → **48 B** | 60 (3) → **42 B (3)** | 70 → **56 B** | 272 → **264** |
| **robinhood** | 530 → **500 C** | 105 → **110 C** | 84 → **88 S** | 28 → **12 F** | 22 C | 32 → **30 C** | 40 (2) → **48 B (3)** | 98 S | 268 → **259** |
| **superhero** | 580 → **540 B** | 120 → **90 C** | 68 → **66 A** | 26 → **42 B** | 50 → **62 A** | 45 → **10 F** | 53 (3) → **62 A (4)** | 56 → **28 C** | 271 → **273** |
| **mad scientist** | 480 → **460 C** | 205 → **230 A** | 20 → **12 F** | 90 → **84 S** | 34 → **22 C** | 86 → **30 C** | 33 (2) → **42 B (3)** | 98 → **84 S** | 292 → **250** |
| **cyborg** (job Raider → **Engineer**) | 635 → **560 B** | 80 → **100 C** | 89 → **46 B** | 17 → **72 A** | 42 → **46 B** | 39 → **42 B** | 58 (3) → **46 B (3)** | 42 → **28 C** | 270 → **272** |

### 7.2 Everyone else — identity-preserving normalization

Rule set the normalizer used (final.js in the session scratchpad; the tool
now guards the result): stats graded S or F are IDENTITY and never move;
every other stat moves in small steps, round-robin, never more than one
letter, never down into F, never a dump stat upward, never a SPD tile change;
HP stays within 385–820 and MP within 40–265. Two hand nudges: ai and
telepath (three S stats plus flight defeat the drift limits — their M.ATK and
M.DEF came down inside S), android (+5 MP to clear the MP-band crowding
check). Big movers: super sentai and demon prince were under-budget and got
real buffs; chosen one, glitch, ai, telepath, overlord and skinwalker were
the over-budget "good at everything" lines and lost 8–14 points across
several stats.

| champ | HP | MP | ATK | M.ATK | DEF | M.DEF | SPD (tiles) | AWR | budget |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **giant** | 795 → **815 S** | 40 → **60 F** | 58 → **62 A** | 0 F | 94 S | 52 → **56 B** | 26 (2) → **28 C (2)** | 14 F | 238 → **250** |
| **robot** | 700 S | 50 F | 74 A | 3 F | 83 S | 35 C | 43 B (3) | 42 B | 251 → **251** |
| **mech** | 625 → **645 A** | 90 → **110 C** | 52 → **54 B** | 30 C | 63 → **65 A** | 26 → **28 C** | 23 (2) → **25 C (2)** | 28 → **42 B** | 239 → **250** |
| **cyclops** | 710 → **700 S** | 75 → **65 F** | 76 A | 25 C | 71 → **69 A** | 35 C | 51 B (3) | 42 B | 278 → **274** |
| **antperson** | 730 → **710 S** | 120 → **100 C** | 94 S | 31 → **29 C** | 46 → **44 B** | 53 → **51 B** | 31 (2) → **29 C (2)** | 42 → **28 C** | 286 → **275** |
| **angel** | 450 F | 220 A | 8 F | 74 A | 36 C | 90 S | 35 C (2) | 56 B | 262 → **262** |
| **nordic** | 590 → **580 B** | 210 → **200 A** | 22 C | 88 S | 31 → **29 C** | 80 → **78 A** | 31 C (2) | 56 → **42 B** | 280 → **274** |
| **scarecrow** | 660 → **650 A** | 160 → **150 B** | 84 S | 30 C | 58 B | 54 B | 23 C (2) | 28 C | 277 → **274** |
| **grey** | 480 → **450 F** | 250 → **220 A** | 8 F | 99 S | 23 → **21 C** | 96 S | 33 (2) → **27 C (2)** | 98 S | 287 → **274** |
| **succubus** | 505 → **495 C** | 230 → **220 A** | 16 F | 87 S | 25 → **23 C** | 86 S | 35 C (2) | 56 B | 277 → **274** |
| **orb of light** | 475 → **415 F** | 255 → **225 A** | 8 F | 104 S | 20 F | 98 S | 33 (2) → **21 C (2)** | 98 S | 294 → **275** |
| **mothman** | 490 C | 215 A | 8 F | 84 S | 25 C | 74 A | 38 C (2) | 98 S | 264 → **264** |
| **siren** | 520 C | 220 A | 8 F | 88 S | 24 C | 85 S | 38 C (2) | 56 B | 263 → **263** |
| **android** | 480 → **470 C** | 145 → **140 B** | 77 → **75 A** | 31 C | 29 → **27 C** | 59 → **57 B** | 60 B (3) | 98 S | 280 → **274** |
| **shadow entity** | 455 → **425 F** | 160 → **130 C** | 44 → **40 C** | 70 → **66 A** | 24 → **22 C** | 66 → **62 A** | 60 (3) → **56 B (3)** | 98 S | 296 → **275** |
| **reptilian** | 470 C | 130 C | 86 S | 31 C | 31 C | 42 B | 55 B (3) | 84 S | 274 → **274** |
| **catgirl** | 485 C | 110 C | 88 S | 26 C | 30 C | 42 B | 60 B (3) | 70 A | 271 → **271** |
| **mantid** | 480 → **440 F** | 220 → **190 A** | 30 → **22 C** | 94 S | 20 F | 58 → **50 B** | 58 (3) → **52 B (3)** | 84 S | 298 → **273** |
| **skinwalker** | 480 → **440 F** | 190 → **160 B** | 34 → **28 C** | 88 S | 26 → **22 C** | 64 → **56 B** | 60 (3) → **54 B (3)** | 84 S | 300 → **275** |
| **seraphim** | 385 F | 260 S | 8 F | 89 S | 15 F | 96 S | 35 C (2) | 56 B | 267 → **267** |
| **djinn** | 400 F | 240 S | 8 F | 83 S | 22 C | 91 S | 35 C (2) | 42 B | 260 → **260** |
| **anubis** | 400 F | 245 S | 8 F | 86 S | 22 C | 93 S | 31 C (2) | 56 B | 253 → **253** |
| **martian** | 515 C | 140 B | 88 S | 30 C | 31 C | 48 B | 35 C (2) | 84 S | 267 → **267** |
| **annunaki** | 555 B | 135 C | 80 A | 31 C | 29 C | 37 C | 11 F (1) | 84 S | 254 → **254** |
| **ai** | 545 → **485 C** | 230 → **200 A** | 18 F | 92 → **86 S** | 44 → **32 C** | 96 → **92 S** | 28 (2) → **22 C (2)** | 84 S | 304 → **274** |
| **machine elves** | 580 → **560 B** | 240 → **220 A** | 18 F | 92 S | 26 → **22 C** | 86 S | 33 (2) → **29 C (2)** | 70 → **42 B** | 286 → **274** |
| **glitch** | 520 → **480 C** | 200 → **170 B** | 30 → **22 C** | 84 S | 31 → **23 C** | 74 → **66 A** | 60 (3) → **54 B (3)** | 70 → **42 B** | 306 → **274** |
| **homosapien** | 595 B | 140 B | 70 A | 28 C | 50 B | 45 B | 33 C (2) | 70 A | 254 → **254** |
| **pirate** | 605 → **595 B** | 110 → **100 C** | 86 S | 24 C | 48 → **46 B** | 43 B | 58 B (3) | 56 B | 279 → **275** |
| **swordfighter** | 595 → **575 B** | 105 → **95 C** | 88 S | 26 → **24 C** | 50 → **48 B** | 45 → **43 B** | 60 (3) → **58 B (3)** | 56 → **42 B** | 285 → **275** |
| **knight** | 655 → **635 A** | 115 → **95 C** | 78 → **76 A** | 31 → **29 C** | 68 → **64 A** | 48 → **46 B** | 46 (3) → **44 B (3)** | 28 C | 289 → **275** |
| **men in black** | 450 → **440 F** | 155 → **145 B** | 40 C | 66 A | 29 → **27 C** | 61 A | 60 B (3) | 98 S | 278 → **274** |
| **telepath** | 505 → **435 F** | 265 → **225 A** | 8 F | 103 → **96 S** | 23 → **21 C** | 98 → **92 S** | 33 (2) → **21 C (2)** | 98 → **84 S** | 309 → **275** |
| **priest** | 460 → **470 C** | 220 → **230 A** | 8 F | 71 A | 36 C | 88 S | 33 C (2) | 56 B | 247 → **249** |
| **wizard** | 415 F | 255 S | 8 F | 90 S | 17 F | 98 S | 31 C (2) | 42 B | 257 → **257** |
| **fortune teller** | 545 B | 210 A | 8 F | 90 S | 25 C | 82 S | 33 C (2) | 98 S | 264 → **264** |
| **nephilim** | 700 → **680 A** | 110 → **90 C** | 72 → **68 A** | 31 → **27 C** | 77 → **73 A** | 40 → **36 C** | 43 (3) → **41 B (3)** | 42 → **28 C** | 294 → **274** |
| **demon prince** | 525 → **555 B** | 135 → **165 B** | 28 C | 66 → **72 A** | 20 F | 53 → **59 B** | 23 (2) → **29 C (2)** | 28 → **56 B** | 226 → **249** |
| **goatman** | 650 → **640 A** | 100 → **90 C** | 94 S | 31 → **29 C** | 42 → **40 C** | 35 → **33 C** | 53 (3) → **51 B (3)** | 28 C | 282 → **274** |
| **mermaid** | 450 F | 225 A | 8 F | 77 A | 34 C | 93 S | 35 C (2) | 56 B | 256 → **256** |
| **demon princess** | 525 C | 215 A | 8 F | 84 S | 25 C | 82 S | 35 C (2) | 56 B | 266 → **266** |
| **dreameater** | 505 → **495 C** | 235 → **225 A** | 8 F | 94 S | 20 F | 93 S | 33 (2) → **31 C (2)** | 84 S | 278 → **274** |
| **halfdemon** | 495 → **485 C** | 145 → **135 C** | 79 → **77 A** | 31 C | 29 → **27 C** | 58 → **56 B** | 60 B (3) | 84 S | 282 → **275** |
| **vampire** | 440 F | 155 B | 61 A | 31 C | 26 C | 50 B | 55 B (3) | 98 S | 268 → **268** |
| **fallen angel** | 480 → **440 F** | 245 → **215 A** | 8 F | 102 S | 23 → **21 C** | 94 S | 38 (2) → **30 C (2)** | 56 → **28 C** | 292 → **274** |
| **voidweaver** | 445 F | 195 A | 40 C | 58 B | 15 F | 69 A | 55 B (3) | 70 A | 256 → **256** |
| **cosmic wraith** | 540 B | 140 B | 83 S | 31 C | 22 C | 43 B | 18 F (1) | 98 S | 252 → **252** |
| **general** | 650 → **630 A** | 105 → **95 C** | 80 → **78 A** | 25 → **23 C** | 63 → **61 A** | 56 → **54 B** | 51 (3) → **49 B (3)** | 42 → **28 C** | 286 → **274** |
| **droid** | 555 → **525 C** | 250 → **220 A** | 15 F | 90 S | 44 → **38 C** | 96 S | 28 (2) → **22 C (2)** | 70 → **42 B** | 291 → **274** |
| **antihero** | 580 B | 115 C | 66 A | 29 C | 49 B | 45 B | 55 B (3) | 56 B | 272 → **272** |
| **conspiracy theorist** | 550 B | 195 A | 18 F | 72 A | 28 C | 71 A | 33 C (2) | 84 S | 250 → **250** |
| **overlord** | 705 → **655 A** | 105 → **75 F** | 90 S | 45 → **37 C** | 55 → **47 B** | 42 → **34 C** | 46 (3) → **42 B (3)** | 28 C | 304 → **275** |
| **chosen one** | 430 → **390 F** | 200 → **170 B** | 68 → **56 B** | 68 → **56 B** | 24 → **22 C** | 71 → **59 B** | 60 (3) → **46 B (3)** | 98 S | 325 → **275** |
| **politician** | 570 B | 165 B | 22 C | 66 A | 46 B | 64 A | 28 C (2) | 84 S | 249 → **249** |
| **gnome** | 580 B | 205 A | 34 C | 36 C | 72 A | 90 S | 28 C (2) | 70 A | 267 → **267** |
| **kaiju** | 655 → **645 A** | 110 C | 100 S | 25 C | 42 B | 24 C | 46 B (3) | 14 F | 276 → **275** |
| **kraken** | 555 B | 205 A | 40 C | 69 A | 37 C | 71 A | 21 C (2) | 56 B | 265 → **265** |
| **loch ness monster** | 770 S | 95 C | 54 B | 31 C | 92 S | 48 B | 21 C (2) | 14 F | 264 → **264** |
| **barbarella** | 485 C | 145 B | 72 A | 31 C | 34 C | 59 B | 58 B (3) | 70 A | 275 → **275** |
| **golem** | 820 S | 40 → **70 F** | 54 → **60 B** | 0 F | 101 S | 46 → **52 B** | 21 (2) → **25 C (2)** | 14 F | 234 → **250** |
| **ice queen** | 410 → **420 F** | 235 → **245 S** | 8 F | 82 S | 22 C | 90 S | 33 C (2) | 56 B | 248 → **250** |
| **juggernaut** | 800 S | 40 F | 84 S | 0 F | 79 A | 48 B | 23 C (2) | 14 F | 250 → **250** |
| **king arthur** | 645 → **635 A** | 90 → **80 C** | 72 → **70 A** | 28 C | 70 → **68 A** | 46 → **44 B** | 53 B (3) | 56 B | 281 → **274** |
| **king kong** | 755 S | 75 F | 100 S | 20 F | 50 B | 32 C | 21 C (2) | 28 C | 260 → **260** |
| **minotaur** | 675 A | 70 F | 94 S | 7 F | 42 B | 37 C | 53 B (3) | 28 C | 256 → **256** |
| **necromancer** | 425 → **445 F** | 230 → **250 S** | 8 F | 78 → **82 S** | 20 F | 86 S | 31 (2) → **33 C (2)** | 42 → **56 B** | 238 → **250** |
| **occulus** | 495 → **485 C** | 210 → **200 A** | 8 F | 84 S | 23 C | 80 A | 53 B (3) | 84 S | 277 → **274** |
| **super sentai** | 640 → **670 A** | 90 → **120 C** | 54 → **58 B** | 23 C | 59 → **65 A** | 40 → **46 B** | 28 (2) → **32 C (2)** | 56 → **70 A** | 227 → **249** |
| **symbiote** | 480 C | 125 C | 70 A | 31 C | 31 C | 50 B | 58 B (3) | 70 A | 263 → **263** |
| **valkraye** | 605 → **585 B** | 100 → **80 C** | 80 → **76 A** | 30 → **26 C** | 53 → **49 B** | 50 → **46 B** | 58 (3) → **56 B (3)** | 56 → **42 B** | 294 → **274** |
| **watcher** | 510 C | 210 A | 8 F | 84 S | 28 C | 82 S | 33 C (2) | 84 S | 266 → **266** |

---

## 8. Presentation checklist — every new spell needs all of these

Per spell, in this order (the pattern PLAYTEST_NOTES "PSYCHEDELIC / COSMIC
SPELL DROP" and "YETI REWORK" document):

1. **data.js** — the `RACE_ABILITIES` entry (id, spellType, element, kind,
   numbers, ONE status, desc), the `RACE_TREE` node (string or twin array),
   `STATUS_DEFS` + `STATUS_LIBRARY_DESCS` for any new status.
2. **battle.js** — `SPELL_KIND_META` row for a new kind; the `doSpell` branch;
   the targeting-prompt string; any passive hook; `CINE_SEQUENCES[id]`
   director when the spell earns a bespoke beat (otherwise the family
   treatment fires by kind); `UNIT_ANIM_OVERRIDES` if a projectile class
   changes.
3. **Animation** — pick the library slot (sprites.js `UAL_SLOTS`: cast, cast
   ranged, melee, dodge, jump, death…) — new clips are the owner's export
   (§9.6 wishlist); never a per-character export.
4. **three-vfx-effects.js** — an `EFFECTS`/`_EFX_DATA` recipe + `SPELL_MAP`
   entry (`impact` / `beam` / `aura` / `descent`), or a `sig*` composer for a
   set-piece; bolt preset in `boltGeometry` for projectiles. No `filter`,
   `will-change: opacity`, or `mix-blend-mode` on particle elements.
5. **audio.js** — SFX key (existing keys first: `physicalAbility`,
   `spellDamage`, `debuff`, `buff`, `teleport`, the DOOR synth kit); exactly
   ONE damage SFX per damage source.
6. **ai.js** — `scoreSpell` branch for a new kind (transform / possess / link
   / shadowRealm / transfer / steal / summonUnit / tackle / dashThenShoot /
   cleanseArea all need one); `HARD_CC` additions (feared, possessed,
   infected, stoneform); weight keys if a new lever matters.
7. **online.js** — new `state.*` or `unit._*` fields off the skip list; any
   host-only banner/camera wrapped like `showTurnBanner`; controlled units
   route the HUD through `getControllingPlayer`.
8. **Tests** — content-schema (spell well-formed, tree legal, tiers), a
   `champ-rework.test.js` for the mechanics (possess hand-off, link echo,
   stoneform immunity, flatten, goo timers), `npm run grades`.
9. **index.html** — the `?v=` bump with every delivery (RULE #1b).

---

## 9. Build order

Each phase is shippable alone and ends with `npm test`, `npm run grades`, a
token bump and the full files in chat.

### 9.1 Phase 1 — stats, jobs, the tool (SHIPPED 2026-09-07)
data.js `RACE_BASE_STATS` (96 lines + header comment), `RACE_DEFAULT_JOBS`
(santa → Black Mage, gargoyle → Tank, black goo → Tank, cyborg → Engineer),
`JOB_KITS` window export; check-grades.js budget + constraints; this doc.

### 9.2 Phase 2 — twin nodes (SHIPPED 2026-09-07)
data.js (`RACE_TREE` rows, `getRaceTreeRow` / `getRaceTreeAlts` /
`getRaceTreeAllIds`, `_resolveRaceNodes`, `buildUnitSpellTree`,
`buildFreelancerTree`, `flWildcardPool`, `_treeSealedIds`,
`isTreeLoadoutLegal`, `treeLegalSubset`, `buildTreeLegalLoadout`,
`buildTreeRingIndex`), party-builder.js (`SpellTreePanel` twin badge +
`onTwinPick`, `twinCandidate` / `twinPickSpell`, the shared node picker,
`legalCustomSpellIds`), content-schema.test.js, index.html token. No new
spells, no engine change, no relay — see §4.6 for the placements.

### 9.3 Phase 3 — the passive batch (SHIPPED 2026-09-07)
data.js (`PASSIVE_DEFS` ×20 with the hook-flag header, `RACE_PASSIVES` ×15
races, `STATUS_DEFS` bleed / goo / wolfForm + `STATUS_LIBRARY_DESCS`, the
Raider archetype's `sleepPreference`), battle.js (`getEffectiveSpd` +
`_bloodcrazeSpdStages`, `checkOpportunityAttack`, `getEffectiveRange(unit,
opts)`, `applyStatStageBoost(…, opts.perm)` + the perm-aware ledger walkers,
`applyStatusPayload`, `applyHealingToUnit`, `applyDamageToUnit`,
`getStatusMagicDamageTakenMultiplier`, `getSpellMpCostFor`,
`isUnitConcealedFrom` + `unitCryptidHiddenFrom`, `doAttack`, `doSpell`,
`_applyRoundStartPassives` at the three turn-order build sites, the bane
reach), map.js (death handler, `processRespawns`, `getSleepAffinityModifier`),
state.js (`buildBlitzTurnOrder`, `_STATUS_EFFECT_IDS`), hud.js (`_HRLG_SB_COLORS`,
RNG ∞, item reach), ui.js + ai.js (item reach), party-builder.js
(`RACE_TRAITS` rows the overlay now owns), check-grades.js, champ-rework.test.js,
this doc. Details and deviations: §5.7.

### 9.4 Phase 4 — statuses + the stage-buff retune (SHIPPED 2026-09-07)
data.js (`STATUS_DEFS` ×19 + shield, `STATUS_LIBRARY_DESCS`, the `_MF_*`
tables, 35 spell rows for §5.6), battle.js (`unitSpellsBlocked`,
`unitShadowRealmPartnerId` / `isUnitRealmShieldedFrom`, `_procLinks`,
`_tetherFollow`, `_fearFleeMove`, `levitateUnit`, `bonusStatusMatches`
countsAs, `getEffectiveRange` rangeDelta, `applyStatusPayload` partner
fields + onApply + realm gate, `clearStatus` onRemove, `removeDebuffs`,
`applyDamageToUnit` realm / incendiary / links, `applyHealingToUnit`,
`doAttack` / `doSpell` realm gates, `finishMoveAt`, `dropPixieDust` /
`checkPixieDustPickup`, the fear branch in `_continueBlitzWithUnit_impl`,
15 silence gates), ui.js (2 silence gates, the spell-card kind read),
state.js (`_STATUS_EFFECT_IDS`, generic `getNextBlitzUnit` skip), hud.js
(colours), ai.js (`HARD_CC`), map.js (`canFly`), champ-rework.test.js,
index.html token. Details and deviations: §5.8.

### 9.5 Phase 5 — spells, in three waves
- **Wave A (reuse-heavy) — SHIPPED 2026-09-08 (§5.9):** QB, sedan
  (`transform`), santa, yeti, ki fighter, marksman (+ headshot execute),
  skeleton, dinosaur, bigfoot, gargoyle, robin hood, superhero (`tackle`),
  cyborg (lineWidth 2), conspiracy theorist (flatten). data.js, battle.js,
  state.js, ai.js, hud.js, ui.js, three-vfx-effects.js,
  champ-rework.test.js, content-schema.test.js, index.html token.
- **Wave B (control + links):** ghost, zombie, demon, shaman, succubus,
  vampire — `possess`, `link`, `shadowRealm`, `transfer`.
- **Wave C (summons, tethers, terrain):** cowboy, mad scientist, black goo,
  fairy, ghoul, atlantean, dragon — `summonUnit`, `tetherFollow`, goo
  terrain, `levitating`, `feared`, width-3 lines, `lineZone`.
- **New races (gangster, nun):** every table a race key touches —
  `AVAILABLE_RACES`, `RACE_PROFILES`, `RACE_DEFAULT_JOBS`, `RACE_CLASS`,
  `RACE_BASE_STATS`, `RACE_PHYSIQUE`, `RACE_ABILITIES`, `RACE_TREE`,
  `EW_RACE_BIOMES`, `CAMPAIGN_RACE_PRICES`, `RACE_ELEMENT_AFFINITY`
  (optional), the DOOR text tables; sprites.js `RACE_SPRITES` /
  `RACE_SPRITE_GENDERS` / `RACE_PORTRAITS` / `RACE_MODELS_3D`; server.js
  `AVAILABLE_RACES` literal (parity test); starter/unlock economy. Gangster
  needs a model + sprite from the owner; the nun reuses the priest's female
  assets (a `<race>:female`-style override already exists for her lines).

### 9.6 Asset wishlist (owner uploads; everything else is CSS/GLB-kit)
Hound model (cowboy) · stitched creation model (mad scientist) · gangster
rigged model + portrait · `goo.png` terrain tile · snowball projectile
sprite · optional clips: sniff (werewolf), tail-spin (dinosaur), stone
crumble (gargoyle), arm-cannon morph (cyborg).

---

## 10. Decisions for the owner (yes/no before Phase 2)

1. **SPD priced at 16 per tile** in the budget — keep? (It is what pushed the
   speedsters' defenses down.)
2. **Job moves** shipped in Phase 1: santa → Black Mage, gargoyle → Tank,
   black goo → Tank, cyborg → Engineer. Veto any and I re-tune the line.
3. **Non-capstone stage buffs → ±1** roster-wide (§5.6).
4. **Headshot executes ≤15 %** for every Sniper (job spell), not just the marksman.
5. **Nun as her own race** (recommended) vs. the nun kit on the priest.
6. **Soul Bind pairs two enemies** (two clicks) — or should it bind the enemy
   to the demon?
7. **Ghost: Incorporeal absorbs Spectral Passage** so the second slot stays
   free for flying.
8. **Cyborg Power Core ×1.5** (not ×2 — ×2 makes ring 4 uncastable on a
   100-MP pool).
9. **Chemical Concoction uses the combined `corroded` DOT** to keep the
   single-status rule (it counts as Burn AND Poison for payoffs).
10. **Twin-node picker reuses the Freelancer socket popover** (one UI, not two).
11. **Bigfoot's Cryptid rule** hides him from enemy CAMERAS too (fog gate) —
    allies always see him.
12. **Flat Earth flattens DOWN** to the lowest tile in the 3×3 (never raises).
13. **Sweep scope:** the other 67 races kept their tile counts and identities;
    say which ones deserve their own rethink and they get a §6 entry.
14. **The unplaced §4.5 free twins** (werewolf Pounce, dragon Fissure, demon
    Wing Attack, shaman Hex of Agony, black goo Ooze Trail, superhero Nebula,
    mad scientist Shrink Ray + Free Energy, vampire Lifetap): §6's final
    pillars have no node for them. Leave them off-tree (Phase 2 did), or name
    the node each should share — an interim twin is one row edit.
15. **Great Flood sits at atlantean r4** (tier III, the mermaid's capstone —
    ring 3 is illegal for it). When Tsunami★ ships: Tsunami replaces Flood
    at r4, or Flood is re-authored as a tier-II variant for ring 3?
16. **Ring-cost moves from the §6 pillar order** — Tremor Stomp 75 → 25 MP
    at bigfoot r1 (125 AOE + Stagger for 25 is the strongest ring-1 area
    spell), Trunk Throw 25 → 75, Robo Punch / Spike the Ball 25 → 75, Bomb
    Arrow / Gothic Rampart 25 → 50. All follow the ring ladder; veto any and
    the pair moves ring.
17. **Initiative now reads live SPD** (Phase 3, §5.7): stage buffs/debuffs
    reorder the NEXT round's turn order, not just movement. Keep? (Reverting
    is one line in state.js `buildBlitzTurnOrder`; The Beast would then be
    5 tiles but still act at its day-form initiative.)
18. **A Marked cryptid is exposed** (Marked pierces Cryptid exactly like it
    pierces Invisible). The alternative is Cryptid ignoring marks — then
    the only counterplay is closing to 3 tiles.
19. **Pure Negativity bounces environmental debuffs too** (lava Burn,
    Drowning, terrain Poison) — "immune to every debuff" taken literally. If
    the ghoul should still drown, the hook needs a source-based carve-out.
20. **Feared flees on the engine's terms** (Phase 4, §5.8): the victim's
    activation is one forced move to the reachable tile farthest from the
    source, then the turn ends — a human never gets to pick the tile. The
    alternative (the human picks any tile that increases distance, the CPU
    auto-picks) costs a move-preview filter; say if you want it.
21. **Stoneform is Protected** (invulnerable — "takes no damage", Press-Turn
    miss) rather than a ×0 multiplier that still runs on-hit riders. Keep?
22. **Discord's −2 ATK stays** (the six Discord spells apply a STATUS whose
    stageMod is −2 ATK / −1 DEF; §5.6 only swept `statStageBoost` spells).
    Sweep it to −1 too?
23. **Roped drags to the roper's origin tile** (one hop per move, not the
    whole path tile-for-tile) — cheaper, and the 20/tile damage still counts
    every tile displaced. Fine, or must the victim trace the path?
24. **Jack of All's RNG +1 is live** now that `rangeDelta` is generic (the
    desc always claimed it). Keep, or drop the field from the def?
25. **The execute rider respects Protected / invulnerable** (wave A): a
    Protected unit at 10 % shrugs off Take Aim. Keep, or should the execute
    pierce shields too?
26. **Mecha's +2 RNG reaches spells** through a new `spellRangeDelta` field
    (Robo Punch at 3); Extended Clips' and Invisible's `rangeDelta` stay
    basic-attack-only. Keep the split, or make `rangeDelta` count for spells
    roster-wide?
27. **Three legacy `damage` spells now really knock back** (Synthetic Punch,
    Rocket Fist, reptilian Tail Whip — their descs always said so) and
    **Mist Form's Invisible now lands** (the escape branch never applied
    it). Both are bug fixes that came with wave A; veto either.
28. **Audible declares `aoeRadius: 2` but the warCry branch reads
    `auraRadius || 3`** — it has always been radius 3 in play. Apex Roar
    wears both fields at 2. Should Audible be 2 (one field edit)?
29. **Wide beams:** a width-2 lane sits on the RIGHT hand of the firing
    direction (Plasma Cannon). Fine, or prefer the left / a UI choice?
30. **Sky Tackle's carry lands the hero one tile behind the body** (never on
    an occupied tile; a blocked landing leaves him where he struck). Fine?
