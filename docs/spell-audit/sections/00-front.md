# SPELL FAMILY AUDIT — findings and plan (2026-09-30)

_Status: COMPLETE as a plan (2026-09-30). This front matter synthesizes the 15 verified audit sections below, finishes the
design-skeptic pass that was interrupted on R.1 and R.3 (fixes marked `[skeptic-2: …]`), and reconciles every place the
sections disagreed (§11). Nothing here has been applied to `data.js`; nothing has been playtested. Checked against the
2026-09-30 data (`docs/spell-audit/data/`, re-dumped and diffed identical on the day of synthesis)._

## 1. How to read this plan

**What was asked** (mondo, 2026-09-30): audit races × spell families for internal sense (the "yeti has nothing to do
with Christmas" test); find repetitive spells inside families (delete / move / merge / make into an upgrade); find
families that need spells, with options; flag wrong tiers and MP costs; aim for a T1–T4 ladder per family and give a view
on 3 vs 4 tiers; and audit the whole thing as a tactical JRPG (synergies, many viable strategies, balance). Renames and
rewrites are allowed.

**The layout.**

| Part | What it is | Use it to |
|---|---|---|
| §1–§5 (this front matter) | The verdict, the rules, the two structural decisions (tiers, MP) | Decide |
| §6 Master change tables | Every change the plan makes, one table per kind, reconciled | Apply (the Spell Library export works from these) |
| §7 Race pools after the plan | All 124 races: families before → after, rung swaps, pool and tier shape | Check a race |
| §8 Team archetypes after the plan | The 12 archetypes with the plan's fixes in place | Check the strategy space |
| §9 Implementation order | Batches A–D, what goes in each, the checks after each bake | Ship it |
| §10 Decisions for mondo | The open questions, each with a recommendation | Rule |
| §11 Reconciliation log | Every point where two sections disagreed and which way the plan goes | Audit the audit |
| F. Cross-family audit | Redundancy groups, tier corrections, dead fields, upgrades, the tier question — the evidence | Look up why |
| S. Synergy and team building | The status economy, archetypes, balance flags, passives, kit templates — the evidence | Look up why |
| F.g1–F.g9 Family blocks | Every family: identity, races, rows now, problems, changes, additions, upgrades | Look up a family |
| R.1–R.4 Race fit | Every race: now, fit, proposed families, pool gaps, identity | Look up a race |

**Precedence.** Where the front matter and a section disagree, the front matter wins: the section text is the evidence,
§6/§7 are the plan. Inside the sections: the RACE section wins on membership (which families a race wears), the
FAMILY section wins on the spells (what a row becomes), the cross-family audit wins on tier and cost when the family
section is silent, and a `[skeptic]` / `[skeptic-2]` / SKEPTIC / STRUCK note beats the sentence it corrects. Every
override the synthesis made is listed in §11 with its reason.

**Verb tags** (used in every table): DELETE · MERGE (fold into another row) · MOVE (change family) · RENAME · RETIER ·
RECOST (MP / AP / CD / range) · RETUNE (numbers at the same tier) · RETYPE (damage type / element) · REWRITE (the
mechanic changes) · DESC (description only) · UPGRADE (the row becomes an upgrade) · PASSIVE (the row becomes a passive
row) · NEW. Families: KEEP · GROW · DELETE · MERGE · RENAME · UNIQUE.

**The house scale** (from the data: median of the live rows per tier; every NEW number in this plan follows it):

| Tier = SP | MP | Single-target dmg | Area dmg (r1) | Status alone | AP |
|---|---|---|---|---|---|
| T1 | 25 | ~100 (80 with a rider) | ~80 | one status, 1–2 rounds (Anchor: Rooted 2) · one stat stage | 1 |
| T2 | 50 | ~130 (110 with a rider) | ~100–110 | two statuses or a zone · two stages | 1 |
| T3 | 75 | ~125–135 with a rider | ~125 | hard CC (stun/possess) · a team aura | 1 |
| T4 | 100 | ~180 (160 with a rider) | ~160 (r2 or 5×5) | categorical only (see §4) | 1; 2 only when categorical |

THE TIER RULE (Spell Library lint `tierRule`): a `damageEffect` row with dmg ≥ 120 must be T3 or T4.

## 2. The verdict

**The system is right; the catalogue needs a hard edit.** Families-as-pools (the 2026-09-26 Phase 6/7 change) works: a
race is who it is because of what it can learn, and a family can be read as a character. The status engine — cheap
setters, expensive finishers, `bonusVsStatus` payoffs, 1-round windows that make the setup a teammate's job — is the
right spine for a tactical JRPG, and Stagger, Burn, Poison, Slow, Discord and Root already run on it. What is wrong is
the content poured into the system by several export passes:

1. **Families worn for their element, not their identity.** About 25 races carry a family because an element matched
   (Ice on the loch ness monster and santa, Cosmic on the antihero and superhero, Agriculture on king kong, Fire on the
   martian, Necromancy on the zombie …) — the yeti test fails for each.
2. **Redundancy.** 15 rows that all say "raise ATK by 1 stage" at T1, T2 and T3; five identical DEF+1 rows; nine near-copy
   shields and nine near-copy escapes; same-family twins (Ice Shard / Ice Spear, Nuke / Fire for Effect, Scorched Earth /
   Wall of Fire); rows that are just another row plus a shipped upgrade (Impact Round = Blast, Ricochet = Ricochet).
3. **Tiers and prices that disagree with the data.** Seven rows break THE TIER RULE; T1s that out-hit T3s (Pounce 120 vs
   Ambush Lunge 125); 2-AP T1s; T4s pinned at 25 MP; 23 families with two to four T4s and 33 with none.
4. **Statuses that go nowhere.** Marked has seven setters and no finisher; Blind, Grievous, Minimize, Invisible, Blessed
   are setup-only; Ice freezes three ways and pays nothing.
5. **Empty and stub families.** Nine registries with no rows; about twenty with one or two; 74 families missing a tier.
6. **Descriptions that lie.** Dead fields the auto-describer still writes ("always crits", "more damage the lower their
   HP", "bonus vs debuffed") and live mechanics nobody wrote down (Thunderbolt's chain, Time Rewind's echo, eight
   unwritten cleanses).
7. **Pools off the target.** 7 (fortune teller) to 27 (annunaki, starfish), with Cosmic + Water/Earth stacks producing
   8–10 T4s in one pool.

**What the plan does, in numbers** (computed by applying the reconciled change set to the 2026-09-30 data):

| | Today | After the plan |
|---|---|---|
| Families | 130 (9 empty) | 122 — 8 deleted or folded (Acting Chops, Archaeology, Culinary Arts, Music Theory, Persuasion; Astrology → Fortune Telling; Stone Age → Giant Abilities; Astronaut Camp, its row → Alien Weapons); 4 empty ones built (Gambling, Animal Handling, Mirror Magic, Internet Addiction) |
| Rows (distinct) | 553 (524 active + 29 passive) | 656 (625 active + 31 passive) plus 45 new family-passive rows (§6.4): 360 existing rows changed · 25 removed (20 deleted, 4 merged, 1 → upgrade) · 2 become passives · 22 change family · 82 change tier (13 of them the Q1 T4 folds) · 128 new rows |
| Active rows by tier T1/T2/T3/T4 | 144 / 144 / 121 / 115 | 160 / 183 / 170 / 112 |
| Families with 2+ T4s | 23 | 0 (one T4 per family, §4) |
| Families missing a tier | 74 | 12 (each by design: a family may skip a tier) |
| T4 rows at 2 AP | 45 of 115 | about 36 of 112, each categorical (revive, summon, r2 area, terrain, duel) |
| THE TIER RULE offenders | 7 | 0 |
| Race pools min / median / max | 7 / 17 / 27 | 13 / 19 / 28 — five races above 24 (§10 Q6) |
| Families per race (3 / 4 / 5) | 73 / 48 / 3 | 75 / 46 / 3 — none under 3, none over 5 |
| Races whose families change | — | 64 |
| Races whose rungs change | — | 67 — every rung sits inside its race's after-plan families |
| Family passives / new upgrade rows | 0 / 14 shipped upgrades | 47 passives (20 data-only) / 35 new upgrade rows (3 data-only, 1 partly; one `addStatus` patch key unlocks 8 more) |

**What the synthesis corrected in the audit itself** (verified in the code, §11.2): the "MP gate" that S §4 called the
biggest balance problem does not exist in PvP — every unit is built at level 100 with base MP + 100, so the MP floor and
the eleven 75-MP T4 pins are dropped (§5); Wet is not dead (the elemental combo layer already pays it); Levitating already
unlocks the flight-only rows; a rung whose ring differs from its tier is legal (tiers are explicit since 2026-09-26).

**What it costs.** Batches A–C (§9) are Spell Library work — row edits, registry edits, new rows — baked with
`bake-spell-mods.js` and shipped as `data.js` + an `index.html` token bump; no engine change. Batch D is engine work in
battle.js / data.js (and online.js for any new on-screen moment): about 20 new row mechanics, about 25 new passive hook
keys and a dozen upgrade patch keys (§6.5), none of which blocks A–C. Everything is model-written against the data and
the rules and is **not playtested**; the numbers follow the house scale (§1) and want mondo's taste pass, the new rows
above all.

## 3. Principles — the rules every change in this plan obeys

These are the audit's working rules, stated once. Every row in §6 and §7 was checked against them (the skeptic passes
did it per section; the synthesis re-checked the whole change set against the data in one pass, §2).

1. **A family is an identity, not an element.** A race wears a family because the family is about that race — its lore,
   its body, its job — never because the two share an element or a pun (the yeti test: a yeti is cold, but it has
   nothing to do with Christmas). A race keeps an off-theme family only when removing it would break rule 3 and no
   better paired swap exists; §7 says so where it happens.
2. **One family per spell.** A row belongs to exactly one family. "Shared" means several races wear the family; a row
   never sits in two. A single-race family is fine (Piracy, Sentai Colors, D.O.O.R. Gun); a family on no race must be
   empty or deleted.
3. **Three families minimum per race, five maximum** (the maximum is today's line; §10 asks whether to lift it). Every
   REMOVE that would drop a race to two families is paired with an ADD in the same change.
4. **Rungs live inside the race's families.** Every `RACE_TREE` rung must be a member of one of the race's after-plan
   families (the bake refuses anything else). A row that is deleted, merged, moved out of a family, or re-familied
   takes a named rung replacement with it — for every race that holds it, not just the one being edited. A rung's
   replacement keeps the old rung's tier where possible (a rung's ring must equal its tier somewhere).
5. **The cheapest live instance of an effect sets its tier.** A self ATK+1 is a T1 (End Zone Dance). A Rooted 2 is a T1
   (Anchor). A single 100-damage hit is a T1. Anything that sells the same effect higher must add something the tier
   pays for, or come down.
6. **THE TIER RULE.** A `damageEffect` row with dmg ≥ 120 is T3 or T4.
7. **A bigger version is an upgrade, not a spell.** A row that is another row plus area, range, damage or duration is
   the smaller row plus Blast / Widen / Long Reach / Empowered / Lingering, and goes. A row survives as the "discount"
   only when its SP price is lower than the base + upgrade price AND its family has no better use for the slot.
8. **Same-family duplicates die; cross-family near-duplicates survive** only when each family needs the slot and the
   tier matches the cheapest instance.
9. **One T4 per family, and a T4 is categorically bigger than a T3** (§4): a 5×5 or r2 area, a self-contained finisher,
   an area hard-CC, a revive, a summon, a team-wide aura, a terrain rewrite, or an execute. "A T3 plus 35 damage" is a
   T3.
10. **2 AP is a price for something categorical.** A T1 never costs 2 AP; a T2 almost never; a T4 costs 2 AP only when
    it is bigger than a 1-AP T4 (r2 + status, revive, summon).
11. **Every setup has a payoff somewhere the setter can reach.** A status that seven families apply and nobody pays
    (Marked) is dead weight; every setup family gets at least one payoff in-family or in a family its races commonly
    pair with. A status that does nothing (Wet, Scanner) gets a meaning or leaves.
12. **The race's MP must cover its own T4 once.** Base MP is final and regenerates 3% a round; a race that cannot cast
    its own ladder is a race with half a kit (§5).
13. **The description is generated from live fields.** A sentence that promises a mechanic the engine does not read is
    a bug: wire the mechanic or delete the field (and the sentence goes with it). Reverse lies (a live mechanic the text
    hides — Thunderbolt's chain, Time Rewind's echo, eight unwritten cleanses) get written.
14. **No vague proposals.** Every NEW row in this plan has an id, family, tier, role/kind, element/type, MP, AP, CD,
    range, area, damage and statuses; every REWRITE says its new numbers; every "either/or" picks one.

## 4. Three tiers or four — recommendation: keep four, and make T4 mean something

**What the data says** (F §5, re-checked): T4 holds 119 rows (115 distinct), and 103 of them are damage (61) or
damage + effect (42); movement has no T4, terrain none. 45 of the 119 cost 2 AP — and a 2-AP T4 deals 180 / 2 = 90 per
AP, less than a 1-AP T3's 125. Damage per MP falls every tier (4.0 → 2.0 → 1.67 → 1.6), so the reason to buy a higher
tier is burst per action, not efficiency. 23 families hold two to four T4s; 33 populated families hold none. The top
tier is therefore not a tier of kind — it is "a T3 plus 35 damage", stacked unevenly.

**The two options.**

| | Keep 4 tiers, one T4 per family (recommended) | Fold to 3 tiers (T4 → capstone T3) |
|---|---|---|
| SP max / slots | 16 SP / 7 slots, unchanged | must drop to 12 SP, or a 7-slot kit fills with four 100-MP capstones |
| Kit shapes | 4+3+3+2+2+1+1 (one ult), 4+4+3+2+2+1 (two ults), 3+3+3+3+2+1+1 (no ult) … five real shapes | 3+3+2+2+1+1, 3+2+2+2+1+1+1, 3+3+3+1+1+1 — three shapes |
| What T4 means | ONE row per family, categorically bigger than a T3 (§3 rule 9): 5×5 / r2, self-contained finisher, area hard-CC, revive, summon, team aura, terrain rewrite, execute | nothing: the capstone is a T3 with a 100-MP pin, and the categorical rule has to be enforced by MP pin + CD instead of by tier |
| The 33 families with no T4 | stay without one (a family may skip a tier) or get one only where the family needs an ender (§6.3) | become "complete" for free |
| Work | fold ~25 surplus T4s to T3 (75 MP, 135 dmg, keep their riders) — data only | rewrite the `tier` field on 119 rows (`bake-spell-mods.js --stamp-tiers`), SP max 16 → 12, MP ladder becomes 25/50/75 + a 100 pin |
| Team building | the T4 is the row a player builds the rest of the kit around: set up its finisher with the T1/T2 statuses, protect its turn with the T2 escape | flatter: every capstone competes with every T3 for the same slots |

**Recommendation: keep four tiers and enforce one T4 per family.** The binding rule is the count (one per family); the
"categorical" test only decides WHICH row keeps T4 when a family holds several. A self-contained finisher that loses
the contest (Dark Lullaby, Bad Trip, Tidal Slam) folds to T3 at 75 MP / 135 damage and keeps its finisher — it loses
25 damage, nothing else. SP max stays 16 and the passive cap stays 2; the "one T4, two T3, two T2, two T1" kit becomes
true by construction instead of by convention. The fold list (which T4 each family keeps, and where the others go) is
§6.2's RETIER table; the families that keep 2 T4s after the plan, each with its reason, are listed under it.

**If mondo prefers three tiers:** every row this plan keeps at T4 becomes a T3 with `cost: 100` pinned (its CD / 2 AP
kept as the gate); every "→ T3" row becomes an ordinary T3 at 75; SP max becomes 12; the passive cap stays 2; the
MP ladder is 25 / 50 / 75 plus the capstone pin at 100; the `tier` field is rewritten by
`bake-spell-mods.js --stamp-tiers` from one Spell Library export. No engine change is needed — tier is already just the
SP number. Everything else in this plan is tier-count-agnostic.

## 5. The MP economy — corrected

**The sections got this one wrong, and the correction changes the plan.** S §4 ("the MP gate is the biggest balance
problem in the data"), S §3, S §6 and several race blocks (giant, robot, zombie, bigfoot, werewolf …) reason from the
BASE MP in `RACE_BASE_STATS` — juggernaut 40, robot 50, giant 60 — and conclude that 25 races "can never cast" their
100-MP T4s. That misses the level system. `computeUnitStats` does return `mp: base.mp`, but every unit is then built at
a level (`setUnitLevel`, battle.js) and `levelStatGains` (data.js) adds MP: at level L the pool is
`(base + 100) × (0.30 + 0.70 × ((L−1)/99)^1.35)`, so **at level 100 every unit has base + 100 MP**. Every PvP mode builds
at the cap (`MODE_LEVEL_RULES.pvpNormalizedLevel = LEVEL_CAP = 100`, map.js "PvP normalization"); story builds at the
party level. Computed from the live functions (2026-09-30 data):

| Level | MP min | MP median | MP max | races under 50 | under 75 | under 100 |
|---|---|---|---|---|---|---|
| 5 (a fresh story profile) | 43 | 76 | 111 | 4 | 61 | 105 |
| 25 | 56 | 99 | 145 | 0 | 14 | 63 |
| 50 | 80 | 140 | 206 | 0 | 0 | 8 |
| 100 (every PvP mode) | 140 | 245 | 360 | 0 | 0 | 0 |

The 25 "low-MP" races at level 100: juggernaut 140, robot 150, giant 160, dinosaur 160, cyclops 165, zombie / golem /
minotaur 170, overlord / king kong 175, bigfoot / werewolf / king arthur / valkraye 180, gargoyle / goatman / nephilim /
superhero / honda civic / sharkman / luchador 190, swordfighter / knight / general / loch ness monster 195.

**What that means.**
- **PvP is fine as built.** Every race casts its own T4 at least once (a 140–195-MP bruiser: one T4 plus a T1 or two; a
  300–360-MP caster: three big casts). That is the caster / martial split the MP pools were tuned for in the 2026-08-12
  ladder ("a fresh caster opens with ~4 casts of its starter spell, a fresh martial gets ~2"). Field regen is 3% of max
  a round (4–5 MP for a bruiser, ~11 for a caster), 15% in the spawn zone.
- **The stagger loop works in PvP.** Giant at 160: Stonefall (25) → Colossal Crush (100) is castable once, with 35 to spare.
- **Story mode below level ~40 is where MP binds**, by design and harder than intended for four races: at party level 5,
  juggernaut 43, robot 46, giant 49 and dinosaur 49 cannot cast a single T2. That is a story-curve question
  (`EW_MP_L1_FRAC`, or a base-MP floor of ~70 for those four), not a spell-ladder question.

**So the plan does NOT:** floor base MP at 100, raise giant to 150 / robot to 130 (R.1), or pin bruiser T4s to 75 MP by
row override (S §4, S §3's werewolf / bigfoot / zombie fixes, F.g5's Savage Maul at 75). Those pins would break "tier =
SP = the MP ladder" to solve a problem PvP does not have. Every such pin in the sections is reverted to its ladder cost
in §6 and logged in §11. **§10 Q2** asks the one real question: whether the four lowest pools should get a story-mode
floor.

**What stays true from S §4:** a 2-AP T4 can never follow its own 1-round setup in one activation — that is what makes
the setup a teammate's job, and it is good; and the tier skews (Cosmic stacked on Water or Earth → 26–27-row pools with
8–10 T4s; Beast Abilities' 5×T1 → bottom-heavy minotaur / dinosaur / king kong) are real and are fixed in §6.

## 6. Master change tables

Generated from the reconciled change set (every section's proposals, the precedence rules of §1, and the synthesis's
resolutions in §11). Source tags: F.g1–F.g9 family block · F§ cross-family audit · S synergy · R.1–R.4 race block ·
★ synthesis resolution. Tiers are after the plan; "Q1" marks a change that applies only if mondo keeps four tiers (§4).

### 6.1 The family registry — every family, before → after

| Family `id` | Verdict | Rows | Ladder after T1/T2/T3/T4 (+passives) | Races before → after | Notes |
|---|---|---|---|---|---|
| Acting Chops `actingchops` | DELETE | 0 → 0 | — | 0 → 0 |  |
| Agriculture `agriculture` | KEEP | 3 → 5 | 1/1/1/1 +1p | 9 → 7 · −bigfoot, −king kong |  |
| Alien Weapons `alientechnology` | KEEP | 5 → 7 | 2/2/2/1 | 5 → 4 · +annunaki · −nordic, −black goo |  |
| Ancient Knowledge `ancientknowledge` | RENAME | 4 → 5 | 1/1/2/1 | 5 → 7 · +atlantean, +golem | RENAME → Ancient Knowledge |
| Animal Handling `animalhandling` | GROW | 0 → 4 | 1/1/1/1 | 0 → 1 · +ringmaster |  |
| Apex Predator `apexpredator` | KEEP | 4 → 5 | 1/2/1/1 | 2 → 3 · +werewolf |  |
| Arachnid Powers `arachnid` | GROW | 3 → 4 | 1/1/1/1 | 1 → 1 |  |
| Arcane Magic `arcane` | GROW | 4 → 5 | 1/2/1/1 | 3 → 3 |  |
| Archaeology `archaeology` | DELETE | 0 → 0 | — | 0 → 0 |  |
| Archery `archery` | KEEP | 7 → 5 | 1/1/2/1 | 1 → 1 |  |
| Artificial Intelligence `artificialintelligence` | KEEP | 4 → 4 | 1/1/1/1 | 2 → 3 · +droid |  |
| Astral Projection `astralprojection` | GROW | 2 → 3 | 1/1/1/0 | 3 → 4 · +fortune teller |  |
| Astrology `astrology` | MERGE → Fortune Telling | 1 → 0 | — | 1 → 0 |  |
| Astronaut Camp `astronautcamp` | DELETE | 1 → 0 | — | 2 → 0 |  |
| Athleticism `athleticism` | KEEP | 4 → 5 | 1/2/1/1 | 12 → 14 · +bigfoot, +superhero, +symbiote · −astronaut |  |
| Beast Abilties `beastabilities` | KEEP | 7 → 4 | 2/1/1/0 | 7 → 9 · +dragon, +loch ness monster, +deep sea fish · −skinwalker |  |
| Bible Study `biblestudy` | KEEP | 7 → 6 | 2/1/2/1 | 3 → 3 |  |
| Black Magic `blackmagic` | GROW | 4 → 5 | 1/2/1/1 | 4 → 5 · +cult leader |  |
| Blood Magic `blood` | GROW | 3 → 5 | 1/2/1/1 | 5 → 5 |  |
| Bone Density `bonedensity` | KEEP | 4 → 4 | 1/1/1/1 | 2 → 2 |  |
| Camelot Powers `royalty` | KEEP | 4 → 4 | 1/1/1/1 | 2 → 2 | UNIQUE: king arthur (NOT applied: R keeps knight) |
| Cephalopod Anatomy `tentacleappendages` | RENAME | 1 → 4 | 1/2/1/0 | 1 → 1 | RENAME → Cephalopod Anatomy |
| Chemistry `chemistry` | GROW | 1 → 4 | 1/1/1/1 | 2 → 2 | RENAME → Chemistry |
| Christmas Spirit `christmasspirit` | KEEP | 5 → 6 | 1/2/2/1 | 2 → 2 |  |
| Computer Hacking Skills `computerhacking` | KEEP | 6 → 7 | 1/2/2/1 +1p | 4 → 5 · +ghost |  |
| Conspiracy Knowledge `conspiracyknowledge` | KEEP | 4 → 4 | 1/1/1/1 | 2 → 2 |  |
| Cosmic Abilities `cosmic` | KEEP | 11 → 11 | 3/1/6/1 | 8 → 6 · +ice queen · −superhero, −antihero, −starfish |  |
| Cowboy Skills `cowboyskills` | GROW | 3 → 4 | 1/1/1/1 | 2 → 2 |  |
| Cryptid Abilities `cryptid` | KEEP | 3 → 4 | 1/1/1/1 | 7 → 7 · +kraken · −tree person |  |
| Culinary Arts `culinaryarts` | DELETE | 0 → 0 | — | 0 → 0 |  |
| Cult of Personality `cult` | GROW | 3 → 4 | 1/1/1/1 | 1 → 2 · +politician |  |
| D.O.O.R. Gun `doors` | KEEP | 7 → 9 | 1/4/3/1 | 1 → 1 | UNIQUE: door agent |
| D.O.O.R. Training `door` | KEEP | 5 → 6 | 1/3/1/1 | 1 → 1 |  |
| Deep Sea Anatomy `deepsea` | KEEP | 5 → 4 | 1/1/1/1 | 8 → 7 · −kaiju |  |
| Deep State Connections `deepstate` | GROW | 2 → 3 | 1/1/1/0 | 3 → 4 · +conspiracy theorist |  |
| Demonic Abilities `demonicabilities` | KEEP | 8 → 7 | 2/2/2/1 | 5 → 6 · +overlord |  |
| Desert Acclimation `desertacclimation` | GROW | 2 → 4 | 1/1/1/1 | 3 → 2 · −golem |  |
| Dirty Fighting `dirtyfighting` | KEEP | 7 → 7 | 3/1/2/1 | 9 → 9 |  |
| Dragon Abilities `dragonabilities` | KEEP | 4 → 5 | 1/2/1/1 | 1 → 1 |  |
| Dream Predation `astral` | KEEP | 4 → 5 | 1/2/1/1 | 2 → 2 |  |
| Driving Skills `drivingskills` | KEEP | 5 → 5 | 1/2/1/1 | 2 → 1 · −police officer |  |
| Earth Abilities `earth` | KEEP | 9 → 9 | 3/3/2/1 | 11 → 9 · −annunaki, −gnome |  |
| Engineering `engineering` | KEEP | 5 → 5 | 1/1/1/1 +1p | 2 → 4 · +ai, +santa clause |  |
| Eyesight `eyesight` | KEEP | 5 → 5 | 1/2/1/1 | 2 → 2 |  |
| Fae Magic `fae` | KEEP | 6 → 5 | 2/1/1/1 | 3 → 2 · −rabbit |  |
| Fallen Angelic Powers `fallenangel` | GROW | 4 → 5 | 1/1/2/1 | 2 → 2 |  |
| Feline Anatomy `feline` | GROW | 2 → 4 | 1/1/1/1 | 1 → 1 |  |
| Fire Magic `fire` | KEEP | 4 → 4 | 1/1/1/1 | 7 → 5 · −martian, −overlord |  |
| Football IQ `football` | KEEP | 7 → 7 | 2/2/2/1 | 1 → 1 |  |
| Fortune Telling `fortunetelling` | GROW | 3 → 6 | 1/3/1/1 | 1 → 1 |  |
| Fractal Pattern Recognition `fractal` | KEEP | 3 → 4 | 1/1/1/1 | 3 → 3 |  |
| Galactic Federation Protocol `galacticfederation` | GROW | 3 → 4 | 1/1/2/0 | 1 → 1 |  |
| Gambling `gambling` | GROW | 0 → 4 | 1/1/1/1 | 0 → 1 · +bunny girl |  |
| Gear `gear` | KEEP | 16 → 16 | 0/0/0/0 +16p | 0 → 0 | universal |
| Giant Abilities `titan` | KEEP | 4 → 7 | 1/3/2/1 | 4 → 6 · +kaiju, +king kong |  |
| Grave Hunger `ghoulish` | KEEP | 5 → 5 | 1/2/1/1 | 2 → 2 · +zombie · −dreameater |  |
| Great Ape `apeintelligence` | RENAME | 3 → 4 | 1/1/1/1 | 1 → 1 | RENAME → Great Ape |
| Gun Training `weaponstraining` | KEEP | 8 → 6 | 1/2/2/1 | 6 → 6 |  |
| Healing Magic `healingmagic` | KEEP | 3 → 4 | 1/1/1/1 | 7 → 4 · −ice queen, −cult leader, −hippie |  |
| Heavenly Duties `angelic` | KEEP | 7 → 8 | 1/3/3/1 | 6 → 4 · −priest, −valkraye |  |
| Hidden Technology `advancedtechnology` | KEEP | 5 → 6 | 2/1/2/1 | 5 → 6 · +gnome |  |
| Holy Defense `holydefense` | KEEP | 6 → 5 | 1/2/1/1 | 2 → 2 |  |
| Horns & Hooves `horns` | KEEP | 5 → 5 | 2/1/1/1 | 3 → 3 |  |
| Horseback Riding `horsebackriding` | GROW | 1 → 4 | 1/1/1/1 | 3 → 3 · +king arthur · −cowboy |  |
| Human Grit `humangrit` | KEEP | 5 → 4 | 1/1/1/1 | 5 → 10 · +superhero, +antihero, +ki fighter, +police officer, +astronaut |  |
| Hunting Skills `huntingskills` | KEEP | 4 → 3 | 1/1/1/0 | 4 → 3 · −werewolf |  |
| Ice Magic `ice` | KEEP | 8 → 8 | 2/3/2/1 | 6 → 3 · −atlantean, −loch ness monster, −santa clause |  |
| Infernal Court `infernalcourt` | KEEP | 7 → 7 | 1/2/3/1 | 3 → 3 |  |
| Insectoid Anatomy `insectoid` | KEEP | 5 → 6 | 2/1/1/1 +1p | 4 → 4 |  |
| Internet Addiction `internetaddiction` | GROW | 0 → 3 | 1/1/1/0 | 2 → 1 · −ai |  |
| Jellyfish `jellyfish` | KEEP | 4 → 5 | 1/2/1/1 | 1 → 1 |  |
| Kaiju Rampage `kaiju` | KEEP | 4 → 4 | 1/1/1/1 | 2 → 2 | UNIQUE: kaiju (NOT applied: R keeps king kong) |
| Ki Energy `ki` | GROW | 4 → 5 | 1/2/1/1 | 1 → 1 | UNIQUE: ki fighter |
| Knighthood `knight` | GROW | 3 → 4 | 1/1/1/1 | 2 → 3 · +valkraye |  |
| Light `light` | KEEP | 8 → 8 | 2/2/3/1 | 8 → 7 · −deep sea fish |  |
| Lightning Magic `lightning` | GROW | 2 → 5 | 1/2/1/1 | 2 → 2 |  |
| Living Stone `livingstone` | KEEP | 4 → 4 | 0/2/1/1 | 3 → 3 |  |
| Machinery `machinery` | KEEP | 1 → 5 | 2/1/1/1 | 2 → 2 |  |
| Main Character Energy `maincharacter` | GROW | 5 → 7 | 2/1/3/1 | 2 → 2 |  |
| Marksmanship `marksmanship` | GROW | 3 → 4 | 1/1/1/1 | 5 → 3 · +sheriff · −annunaki, −cosmic wraith, −quarterback |  |
| Martial Arts `martialarts` | GROW | 4 → 5 | 2/1/1/1 | 3 → 3 |  |
| Mech Pilot Skills `mecha` | GROW | 3 → 4 | 1/1/1/1 | 1 → 1 |  |
| Meditation `meditation` | GROW | 2 → 4 | 1/1/1/1 | 2 → 2 |  |
| Military Combat `militarysupport` | KEEP | 9 → 8 | 3/2/2/1 | 4 → 4 |  |
| Mirror Magic `mirrormagic` | GROW | 0 → 4 | 1/1/1/1 | 0 → 1 · +rabbit |  |
| Mothman `mothman` | GROW | 2 → 4 | 1/1/1/1 | 1 → 1 |  |
| Music Theory `musictheory` | DELETE | 0 → 0 | — | 1 → 0 |  |
| Nature Magic `nature` | KEEP | 4 → 5 | 1/2/1/1 | 7 → 7 |  |
| Necromancy `necromancy` | GROW | 4 → 7 | 1/2/3/1 | 3 → 2 · −zombie |  |
| Ooze Biology `ooze` | KEEP | 6 → 6 | 2/2/1/1 | 2 → 2 |  |
| Persuasion `persuasion` | DELETE | 0 → 0 | — | 1 → 0 |  |
| Piracy `piracy` | KEEP | 6 → 6 | 2/2/1/1 | 1 → 1 |  |
| Poison Abilities `poison` | KEEP | 5 → 7 | 4/1/1/1 | 12 → 10 · +necromancer · −symbiote, −jellyfish, −deep sea fish |  |
| Police Training `policetraining` | KEEP | 5 → 5 | 1/2/1/1 | 2 → 2 |  |
| Politics `politics` | GROW | 2 → 4 | 0/2/1/1 | 1 → 1 |  |
| Poltergeist Abilities `haunted` | KEEP | 5 → 5 | 2/1/1/1 | 4 → 4 |  |
| Prism Lattice `prismlattice` | KEEP | 4 → 5 | 2/1/1/1 | 2 → 3 · +ice queen |  |
| Psychedelics `psychadelic` | RENAME | 2 → 5 | 1/0/3/1 | 4 → 4 | RENAME → Psychedelics |
| Psychic Abilities `psychic` | KEEP | 8 → 9 | 3/2/3/1 | 7 → 7 · +nordic, +mothman · −chosen one, −professor |  |
| Robotic Hardware `robot` | KEEP | 7 → 5 | 1/2/1/1 | 5 → 5 |  |
| Robotic Weapons `cyberpunkweapons` | KEEP | 5 → 5 | 2/1/1/1 | 4 → 4 |  |
| Ropework `ropework` | GROW | 2 → 5 | 2/1/1/1 | 3 → 4 · +homosapien |  |
| Sasquatch Abilties `sasquatch` | GROW | 2 → 3 | 1/1/0/1 | 1 → 2 · +yeti |  |
| Scarecrow Abilities `scarecrow` | RENAME | 3 → 4 | 1/1/1/1 | 1 → 1 | RENAME → Scarecrow Abilities; UNIQUE: scarecrow |
| Seduction `seduction` | KEEP | 5 → 5 | 2/1/1/1 | 6 → 7 · +demon princess |  |
| Sentai Colors `sentai` | KEEP | 6 → 6 | 2/2/1/1 | 1 → 1 |  |
| Shadow `shadow` | KEEP | 8 → 8 | 1/4/2/1 | 7 → 10 · +dreameater, +voidweaver, +chosen one |  |
| Sonic `sonic` | KEEP | 10 → 9 | 3/2/3/1 | 3 → 3 |  |
| Spy Gear `spygear` | KEEP | 7 → 7 | 1/4/1/1 | 4 → 5 · +antihero, +barbarella · −shadow entity |  |
| Stage Presence `stagepresence` | KEEP | 5 → 6 | 1/2/2/1 | 5 → 3 · −clown, −bunny girl |  |
| Stone Age `stoneage` | MERGE → Giant Abilities | 1 → 0 | — | 1 → 0 |  |
| Street Smarts `streetsmarts` | GROW | 3 → 4 | 1/1/1/1 | 1 → 1 |  |
| Superhero Powers `superheropowers` | KEEP | 5 → 5 | 1/2/1/1 | 3 → 3 |  |
| Swordsmanship `swordsmanship` | KEEP | 5 → 4 | 1/1/1/1 | 5 → 5 |  |
| Symbiosis `symbiosis` | KEEP | 3 → 5 | 1/1/1/1 +1p | 1 → 2 · +black goo |  |
| Teamwork `teamwork` | GROW | 3 → 5 | 1/1/2/1 | 9 → 9 |  |
| Temporal Abilities `temporal` | KEEP | 4 → 6 | 1/2/2/1 | 5 → 6 · +shadow entity, +atlantean · −cult leader |  |
| Thievery `thievery` | GROW | 1 → 3 | 1/1/1/0 | 2 → 3 · +gangster |  |
| Training `training` | KEEP | 13 → 10 | 0/0/0/0 +10p | 0 → 0 | universal |
| Trap Making `trapmaking` | GROW | 3 → 4 | 1/1/1/1 | 2 → 2 |  |
| Trickery `trickery` | GROW | 4 → 7 | 3/1/2/1 | 10 → 10 · +android · −ghost |  |
| UFO Features `ufo` | KEEP | 6 → 6 | 1/2/2/1 | 2 → 2 |  |
| Unethical Science `unethicalscience` | KEEP | 4 → 5 | 1/2/1/1 | 1 → 1 |  |
| Vampiric Abilities `vampiricabilties` | KEEP | 5 → 6 | 2/1/2/1 | 1 → 1 |  |
| Water Abilities `water` | KEEP | 8 → 9 | 2/2/4/1 | 10 → 10 |  |
| Werewolf Powers `werewolf` | GROW | 2 → 4 | 1/1/1/1 | 1 → 1 |  |
| Wind Control `wind` | GROW | 3 → 5 | 1/2/1/1 | 7 → 4 · −angel, −mothman, −kraken |  |
| Winter Warfare `winter` | GROW | 3 → 5 | 2/1/1/1 | 4 → 3 · −ice queen |  |
| Witchcraft `witchcraft` | GROW | 3 → 4 | 1/1/1/1 | 4 → 4 |  |
| Zombie Behavior `zombie` | GROW | 5 → 6 | 1/2/2/1 | 1 → 1 |  |

130 families in the table (8 deleted or merged, 0 created).

### 6.2 Every changed row, by family (after-plan family)

One line per existing row the plan touches. Verbs in order of application; the source tag says which section the
adopted wording comes from (other sections' competing proposals are in §11). Rows not listed are unchanged.

**Agriculture** `agriculture`
- **Green Thumb** `passiveGreenThumb` T1 — MOVE → Agriculture (F.g9): Becomes Agriculture's family passive (tier 1, same hooks): only the seed races use it (Agriculture seeds, Nature's Trunk Throw, Blood's Life Sap). Cross-slice.
- **Healing Seed** `healingSeed` T1 · rung hippie#1 — DESC (F.g1): Proposal: 'heals allies within 1 tile for 40/turn for 3 rounds, then sprouts a tree'. Surface the engine's real values if they differ.
- **Poison Seed** `poisonSeed` T2 — DESC (F.g1): Proposal: 'enemies within 1 tile take Poison 1 each round for 3 rounds, then sprouts'. Surface the engine's real values if they differ.
- **Leech Seed** `leechSeed` T4 — RETIER T4→T3 (F.g1): T4 -> T3, 100MP -> 75MP. · DESC (F.g1): Proposal: '50/turn from the target to the caster for 3 rounds'. Surface the engine's real values if they differ.

**Alien Weapons** `alientechnology`
- **Stun Ray** `raceStunRay` T1 · rung barbarella#1 — RETIER T1→T2 (F.g4): T1 → T2 (50MP); keep 100 + Stun 1, rng 4 — the most over-tuned T1 in the slice · RECOST (F.g4): add CD2
- **Gravity Boots** `raceGravityBoots` T2 · rung barbarella#2, astronaut#2 — MOVE → Alien Weapons (F.g4): from the deleted Astronaut Camp, unchanged (teleport 3, 50MP) as Alien Weapons' T2 movement row; barbarella lore "anti-gravity propulsion"; her rung 2 stays valid
- **Plasma Whip** `racePlasmaWhip` T3 · rung barbarella#3 — REWRITE (F.g4): T3, 125 fire/physical, line w1, rng 2 → 3 (the whip cracks through every enemy in the lane), Burn 2. "It reaches further than it should and burns where it lands." A different shape from Heat Ray (alias raceLavaLamp)

**Ancient Knowledge** `ancientknowledge`
- **Pyramid Protocol** `raceZigguratProtocol` T2 · rung annunaki#2, professor#2 — RETUNE (F§): (section: RECOST) Pyramid Protocol 80 → 60.
- **Ancient Magic** `raceAncientMagic` T4 · rung djinn#4, professor#4 — RETIER T4→T3 (★): T4 → T3 (75 MP), dmg → 135; keeps F.g2's Silence 1 (and synergy's Silence ×1.5 finisher is dropped — a row that sets and pays the same status in one cast is Mind Shatter's job) [Q1: one T4 per family — applies only if mondo … · REWRITE (F.g2): T4 100MP 1AP rng 4: 180 -> 170 magic + Silence 1. 'The old words unmake theirs.' Distinct from Weigh; feeds Mind Shatter's silence finisher (occulus/professor) and Call of the Deep (atlantean).
- **Weigh the Heart** `raceWeighTheHeart` T4 · rung anubis#4 — REWRITE (F.g2): T4 100MP 1AP rng 4: 180 -> 160 magic, x1.5 when the target is under 50% HP (240) - wire executeBonusPct (0.5) in battle.js damage path AND remove it from SPELL_DEAD_FIELDS; DROP the stagger x1.5 finisher. The honest execute.

**Apex Predator** `apexpredator`
- **Primal Roar** `racePrimalRoar` T1 · rung dinosaur#1 — MERGE → Apex Roar (F.g5): one roar: Primal Roar folds into Apex Roar (Discord 2 half). The Primal Roar id no longer exists.
- **Tail Whip** `raceDinoTailWhip` T1 · rung dinosaur#1 — MOVE → Apex Predator (F.g5): beastabilities → apexpredator: becomes Apex's T1 attack (100 phys, push 2, rng 1); dinosaur and sharkman have tails; keeps dinosaur's rung-1 alternate valid (Apex MERGE then makes dinosaur rung 1 = raceDinoTailWhip alone).
- **Stampede** `raceApexCharge` T2 · rung dinosaur#2, sharkman#2 — RETIER T2→T3 (F.g5): T2 → T3 (75 MP): damage+effect ≥120 is T3+ (skeptic). Section: dinosaur rung 2 and sharkman rung 2 stay raceApexCharge — · REWRITE (F.g5): T3, 75 MP, 2 AP, rng 3: 130 phys to the target, dashDamage 50 to every enemy on the path, Stagger 1 on everything hit, caster ends behind the target. The path damage buys the second AP.
- **Apex Roar** `raceApexRoar` T3 · rung dinosaur#3 — RETIER T3→T2 (F.g5): T3 → T2 (50 MP) as the merged roar. · REWRITE (F.g5): merged roar: T2 50 MP, enemies within 2 get Discord 2 AND allies within 2 get +1 ATK stage. Desc: "The whole valley hears it. Everything near the apex flinches; everything behind it bares its teeth."
- **Jurassic Jaw** `raceJurassicJaw` T4 · rung dinosaur#4, sharkman#4 — RETUNE (F§): (section: RECOST) 180 → 160.

**Arachnid Powers** `arachnid`
- **Web Shoot** `raceWebLaunch` T1 — RETYPE (F.g6): damageType physical → magic (element arcane), keep 80 / rng 4 / Rooted 1 (voidweaver atk 40 / int 58; one damage type per race). Desc: "A thread of void-silk. WEAK arcane damage and the target is Rooted for a round."
- **Dimensional Web** `raceDimensionalWeb` T3 · rung voidweaver#3 — REWRITE (F.g6): zone 3×3 for 2 rounds, rng 4, 75 MP; enemies inside are Rooted 1 at the start of each of their turns (re-applied while they stand in it) instead of Slow 2. Desc: "Weave a web between dimensions. Whatever stands in it cannot leave." Burst root (Web Snare) vs persistent root (this, no damage).

**Arcane Magic** `arcane`
- **Arcane Sigil** `raceArcaneBlast` T1 · rung wizard#1 — RETUNE (F.g1): dmg 100 -> 80, cross r3 (13 tiles) -> r2.
- **Polymorph** `racePolymorph` T3 · rung wizard#3 — REWRITE (F.g1): T3 75MP CD3; 2AP -> 1AP; Silence 2 + ATK -1 stage (replaces ATK -1 + M ATK -1). Desc: 'Something small and harmless. Ribbit.' The frog cannot cast; Silence feeds Call of the Deep, Sonic Breaker, Mind Shatter, Dark Lullaby.
- **Wish Granted** `raceWishGranted` T3 · rung djinn#3 — RETIER T3→T2 (F.g1): T3 -> T2, 75MP -> 50MP. Djinn rung 3 -> Polymorph; Wish Granted becomes his rung-2 alt. · RETYPE (F.g1): element blank -> arcane. · REWRITE (F.g1): ally +1 ATK AND +1 M ATK stage (was ATK only), cleanse 2. · DESC (F§): Reverse lie: desc does not mention the cleanse (cleanse: 2); write it (Immortal Cycle `raceJellyRebirth` "cleanses 2 debuffs" is the model text).

**Archery** `archery`
- **Poison Arrow** `racePoisonArrow` T1 · rung robinhood#1 — UPGRADE (F.g8): The row is deleted and becomes the family-scoped upgrade Poisoned Tips (1 SP, families ['archery'], requires 'dmg', patch { addStatus: { id: 'poison', duration: 2 } } — new patch key that adds a status entry to the row). Poison … · DESC (★): ★ the upgrade it becomes is Venom Coat (F.g8's Poisoned Tips merged with S's Venom Coat and F.g6's Envenomed Mandibles — one `addStatus: {poison, 2}` upgrade, §6.4); robin hood's rung 1 falls back to Fire Arrow
- **Bomb Arrow** `raceBombArrow` T2 · rung robinhood#2 — REWRITE (F.g8): dmg 80 → 90, add Burn 1 (fire/physical — a powder charge burns). Stays T2 50 MP aoe r1 rng 4. Desc: "An arrow with a powder charge lashed to the head. Deals MEDIUM physical damage to All Enemies in a 3×3 and sets them alight for a round." Now the area setup for Splitting Arrow (×1.5 vs Burn).
- **Green Arrow** `sentaiGreenArrow` T2 — DELETE (F.g8): Identity drift (Super Sentai leftover, a DC-hero pun; Robin has no healer role — a heal belongs to Healing Magic), off the MP ladder (T2 at 25 MP), broken status:undefined entry. Nobody's rung.
- **Arrow Volley** `raceArrowRain` T4 · rung robinhood#4 — REWRITE (F.g8): Add ignoresLineOfSight: true (a volley arcs over cover — the rider the only 1-AP rider-less 160 aoe r1 lacks). Stays T4 160 physical aoe r1 rng 6 1 AP. Desc: "Loose high and let gravity do the rest. HEAVY physical damage to every enemy in a 3×3 up to 6 tiles away — the arrows come down over any wall."

**Artificial Intelligence** `artificialintelligence`
- **Predictive Model** `racePredictiveModel` T1 · rung ai#1 — REWRITE (F.g4): T1 25MP 1AP, rng 4, single: keep Marked 3, add −1 M DEF stage (stage:mdef-1) so the row does something on its own turn (Psychosis T2 is mdef −1 alone at 50MP)
- **Overcalculate** `raceOvercalculate` T2 · rung ai#2 — REWRITE (F.g4): self buff T2 50MP 1AP rng 0: INT (M ATK) +1 stage and M DEF +1 stage (stage:int+1,mdef+1; was stage:atk+1). "Run the numbers again. Then again." For its owners (ATK 18 ai / 22 glitch / 15 droid)
- **Recursive Loop** `raceRecursiveLoop` T3 · rung ai#3 — RECOST (F.g4): rng 3 → 4 · REWRITE (F.g4): 125 magic; replace the dead bonusVsDebuffed with finisher Marked ×1.5 (187 on a Marked target). The first Marked payoff in the game; turns Knife Throw, Red Eyes, Implant, Dead Eye and Demonic Claw teammates into setup.

**Athleticism** `athleticism`
- **Nimble Dodge** `raceNimbleDodge` T2 · rung catgirl#2, bunny girl#2, rabbit#2 — RECOST (F§): RECOST: CD3 → CD2 and 2 → 3 tiles (= QB Sneak); otherwise it is the worst of six identical rows at the same tier.
- **Rampage** `rampage` T4 · rung luchador#4 — REWRITE (F.g7): T4 100 MP 1 AP, rng 4, 170 physical on the target (was 160), 64 to every enemy on the path, target Staggered 1. The merged row, still in Athleticism (luchador rung 4 + juggernaut rung 4).
- **Unstoppable Charge** `raceUnstoppableCharge` T4 · rung juggernaut#4 — MERGE → Rampage (F.g7): the two T4 dash charges become one row (rampage is REWRITTEN to carry the Stagger).

**Beast Abilties** `beastabilities`
- **Pounce** `racePounce` T1 — RETUNE (F.g5): dmg 120 → 100 (T1 single house scale; keeps rng 3 + charge as its value).
- **Predator Leap** `racePredatorLeap` T1 — DELETE (F.g5): Pounce covers the T1 close; Feral Dive covers the leap-from-height. Not a rung.
- **Ambush Lunge** `raceAmbushLunge` T3 · rung sharkman#3 — DELETE (F.g5): a bare 125 charge at 75 MP; Feral Dive is the T3.
- **Feral Dive** `raceFeralDive` T3 · rung werewolf#3 — KEEP (F.g5): kept: the owning family section points a rung at it

**Bible Study** `biblestudy`
- **Sermon** `raceCultSermon` T1 — RETIER T1→T2 (F.g2): T1 -> T2 (25MP -> 50MP): team-wide Blessed (it dominated single-target Blessing at T1) is a T2 payload. · RETYPE (F.g2): element shadow -> light; spellType unholy -> divine. · DESC (F.g2): 'Gather round. Allies within 2 tiles are Blessed for 2 rounds — they have heard the word.' (was 'the word is him')
- **Absolution** `raceAbsolution` T2 · rung seraphim#2 — RETIER T2→T1 (F.g2): T2 -> T1 (50MP -> 25MP): heal 80 + full cleanse single is a T1 next to Herbal Remedy (T1, 160 + cleanse 2). The section's 'DELETE the dead seraphim row at data.js:6090' is a duplicate definition, NOT this row - see engine record. · DESC (F§): desc must say it cleanses all (cleanse 99).
- **Blessing** `raceBlessing` T2 · rung nun#2 — RETIER T2→T1 (F.g2): T2 -> T1 (50MP -> 25MP): single Blessed 3 rounds is the family cheap opener; Sermon is the T2 team version.
- **Prayer** `racePrayer` T3 · rung nun#3 — REWRITE (F.g2): T3 75MP 1AP rng 3: shield 150 -> 200 AND the ally is Blessed 2 rounds (barrier + blessing; distinct from Psychic Barrier and from Blessing).
- **Exorcism** `exorcism` T4 · rung priest#4 — RETIER T4→T3 (F§): biblestudy: Exorcism → T3 135 with its finisher — the contract/hexed payoff still lands. · RETUNE (F§): 160 → 135.
- **Hallelujah** `raceHallelujah` T4 · rung nun#4 — REWRITE (F.g2): Blessed allies are healed x1.5 (180 -> 270): the Blessed payoff (Blessed had SETUP 2 / PAYOFF 0). Needs healBonusVsStatus in the healAll path.

**Black Magic** `blackmagic`
- **Death Pact** `raceDeathPact` T1 — REWRITE (F.g3): self ATK +2 stages, costs 25% max HP (never fatal), CD 3, 25MP 1AP. "Sign here." A real pact (was a plain ATK+1). Section: "the goatman/krampus/skinwalker row" — NOTE races.json skinwalker is ATK 28 / INT 88, and the added cult leader is ATK 26
- **Sacrifice** `raceSacrifice` T2 — RECOST (F.g3): MP 25 → 50 (T2 ladder; was off-ladder)
- **Voodoo** `raceVoodoo` T3 — RETIER T3→T2 (F.g3): T3 → T2 (50MP; was pinned at 25MP); effect unchanged (enemy takes 50% of the linked ally's damage for 3 rounds) · DESC (F.g3): add to the description: "Needle Work and Baphomet's Rite hit Voodoo targets harder."
- **Baphomet's Rite** `raceBaphometsRite` T4 · rung goatman#4, krampus#4 — REWRITE (F.g3): AP 2 → 1 (keep the 15% HP cost — the identity); finisher Stagger ×1.5 → Stagger,Voodoo ×1.5. 160 fire/magic aoe r1 rng 4 unchanged

**Blood Magic** `blood`
- **Summon Blood Rain** `sharedSummonBloodRain` T1 — RETIER T1→T2 (F.g1): T1 -> T2, 25MP -> 50MP, 2AP -> 1AP (weather summons on Thunderstorm/Sandstorm pricing). · DESC (F.g1): Proposal (row is opaque): 'Blood rain for 3 rounds: every unit heals 10% of the damage it deals; healing spells heal half.'
- **Blood Ritual** `raceBloodRitual` T3 · rung goatman#3 — RETIER T3→T1 (F.g1): T3 -> T1, 75MP -> 25MP; keep +1 ATK, 10% HP cost. Goatman rung 3 -> Life Sap. · RECOST (F.g1): add CD2 (SKEPTIC: without it a 10%-HP T1 strictly dominates Inner Demon - T1, +1 ATK, 20% HP, CD2 - on demon and demon prince, who own both). · RETYPE (F.g1): element blank -> blood.
- **Life Sap** `lifeDrain` T3 — RETYPE (F.g1): element shadow -> blood. · REWRITE (F.g1): finisher Poison x1.5 -> Poison OR Grievous x1.5 (multi-status finisher like Bad Trip) so the family own Hemorrhage sets it up (vampire has no Poison in his pool).

**Bone Density** `bonedensity`
- **Reassemble** `raceReassemble` T2 · rung skeleton#2 — REWRITE (R.1): T2 50MP 1AP self: teleport 3 tiles + heal 20% max HP (was selfHeal 30%) — sustain and movement in one; skeleton rung 2 keeps T2

**Camelot Powers** `royalty`
- **Excalibur Strike** `raceExcaliburStrike` T4 · rung king arthur#4 — RECOST (F.g2): MP 100 -> 75 (pinned override); Burn 2 stays (Arthur's setup for Dragon Slash, Swordsmanship T4 burn x1.5).

**Cephalopod Anatomy** `tentacleappendages`
- **Tentacle Lash** `raceTentacleLash` T1 · rung kraken#1 — RETYPE (F.g6): damageType physical → magic (element water), keep 80 / rng 3 / pull 2 (kraken atk 40 / int 69). Desc: "An arm from below the surface. WEAK water damage and the target is dragged two tiles toward you."
- **Ink Cloud** `raceInkCloud` T2 · rung kraken#2, deep sea fish#2 — MOVE → Cephalopod Anatomy (F.g6): deepsea → tentacleappendages (only a cephalopod sprays ink); kraken rung 2 stays legal.

**Chemistry** `chemistry`
- **Chemical Concoction** `raceOvercharge` T3 · rung mad scientist#3, professor#3 — RETUNE (F.g4): Chemical Concoction 110 → 125 (T3 area house)

**Christmas Spirit** `christmasspirit`
- **Sleigh Dash** `raceSleighDash` T2 · rung santa clause#2 — RETYPE (F.g1): element blank -> ice. · DESC (F§): Desc ("dealing WEAK physical damage to enemies along the path") omits the main hit (130 to the TARGET plus path damage).
- **Naughty List** `raceNaughtyList` T3 · rung santa clause#3, krampus#3 — RETIER T3→T2 (F.g1): T3 -> T2, 75MP -> 50MP. Rung n sits at tier n: the list stays a rung for both races, now at rung 2. · RETYPE (F.g1): element blank -> shadow. · REWRITE (F.g1): Marked 3 + ATK -1 stage (was ATK -1 only). Desc: 'You know what you did. The target is on the list.'
- **Blizzard Present** `raceBlizzardPresent` T4 · rung santa clause#4 — REWRITE (F.g1): Frozen 2 -> Frozen 1; add finisher Marked x1.5 (the present hits the naughty harder; first Marked payoff in the game). 3x3 160 1AP CD2 unchanged.

**Computer Hacking Skills** `computerhacking`
- **Field Operative** `passiveFieldOperative` T1 — MOVE → Computer Hacking Skills (F.g9): Becomes Computer Hacking's family passive (tier 1, same hooks): only the hacking races use System Analysis scanners. Cross-slice.
- **Memory Leak** `raceMemoryLeak` T2 · rung glitch#2 — REWRITE (F§): REWRITE for T2: jammed 2 + the target loses 30 MP (`mpDrain` — new key; the "leak").
- **System Analysis** `raceSystemAnalysis` T2 · rung droid#2 — REWRITE (F.g4): rng 5, Scanner 2 plus −1 M DEF stage. "Every port open, every weakness listed." The caster's setup for Crash Loop / Recursive Loop / System Crash · REWRITE (★): ★ apply Marked 2 instead of Scanner 2 (the Scanner status is display-only — read by nothing); keeps F.g4's rng 5 and M DEF −1. It becomes the setup for F.g4's Recursive Loop (Marked ×1.5)
- **Blue Screen** `raceBlueScreen` T3 · rung glitch#3 — REWRITE (F.g4): 1AP (was 2), CD2, rng 3 → 4, 80 magic + Stun 1 (was no damage). Taser's price point one tier up with range and damage
- **Firewall Protocol** `raceFirewallProtocol` T3 · rung droid#3 — RECOST (F.g4): 2AP → 1AP · RETUNE (F.g4): shield 120 → 150 (T3 3×3 shield between Luminous Shield T2 140 r0 and Overtinker T4 160 r2)
- **Neural Hack** `raceNeuralHack` T3 · rung android#3 — DELETE (F.g4): T3 Jammed 1 is strictly worse than Memory Leak (T2 Jammed 2) — Memory Leak covers it

**Conspiracy Knowledge** `conspiracyknowledge`
- **Tin Foil Hat** `raceTinFoilHat` T1 · rung conspiracy theorist#1 — REWRITE (F.g8): Single-ally M.DEF +1 stage (rng 2) → kind warCry, aura r2, M.DEF +1 stage to every ally within 2 (25 MP, T1). Desc: "Hats on, everybody. Every ally within 2 tiles gains +1 M.DEF stage." conspiracy theorist rung 1.
- **Fluoride Water** `raceFluorideWater` T3 · rung conspiracy theorist#3 — RETUNE (F.g8): dmg 125 → 105 (keep Silence 2, aoe r1, rng 3, 75 MP 1 AP) — the area Silence is the value; the damage gives some back.

**Cosmic Abilities** `cosmic`
- **Entropic Beam** `raceEntropicBeam` T1 · rung cosmic wraith#1 — REWRITE (F.g4): 100 → 90, drop stage:def-1, keep finisher Slow ×1.5, 1AP. Still the best T1 line for a Slow team, no longer three effects for 25MP
- **Cosmic Sight** `raceCosmicSight` T2 · rung watcher#2 — RECOST (F.g4): rng 6 → 4 to match the text ("within 4 tiles"); the text stays
- **Phase Walk** `racePhaseWalk` T2 · rung cosmic wraith#2 — RETIER T2→T1 (F§): RETIER → T1 (3-tile teleport = Mirror Blink T1).
- **Cosmic Slam** `raceCosmicSlam` T3 · rung antihero#3 — RECOST (F.g4): 2AP → 1AP; REMOVE the dead selfCenter field (already rng 0 / aoe r1 = self-centred 3×3). Final: T3 75MP 1AP, 125 physical, rng 0, aoe r1, Stagger 1, terrainDeform center −1
- **Nebula** `sharedNebula` T3 · rung cosmic wraith#3 — REWRITE (F.g4): T3, 75MP, 3×3 (aoe r1; was 5×5), 125 (was 135), Burn 2, 1AP (was 2) CD2. New text: "Birth a star and let it burn — MEDIUM magic damage in a 3×3, everything the starfire touches keeps burning." Loses the supernova line (the orb's row) · DESC (F§): "goes SUPERNOVA" — Supernova `raceSupernova` is a different row in the same family; rename the sentence (a nebula collapses, it does not go supernova). Row is 135 aoe r2 + burn 2.
- **Black Hole** `sharedBlackHole` T4 — RECOST (F.g4): 75MP → 100MP (ladder); pull + Slow + grounds flyers at 160 5×5 kept
- **Heat Death** `raceHeatDeath` T4 · rung cosmic wraith#4 — RETIER T4→T3 (★): T4 → T3 (75 MP); keeps F.g4's real zone at T3 numbers: 3×3, 2 rounds, 70 magic per round (140 total), Slow 1 on entry, 1 AP [Q1: one T4 per family — applies only if mondo keeps 4 tiers] · REWRITE (F.g4): make the zone real and priced: 3×3 zone, 2 rounds, 90 magic to every enemy inside at the end of each round (180 total), Slow 1 on entry, 100MP 2AP. "Nothing inside gets warmer again." · DESC (F§): rewrite the desc as one blast (not a 2-turn zone).
- **Star Decree** `raceStarDecree` T4 · rung annunaki#4 — RETIER T4→T3 (F§): cosmic: Star Decree → T3 delayed 135. · RETUNE (F§): 160 → 135.
- **Supernova** `raceSupernova` T4 · rung orb of light#4 — RETIER T4→T3 (★): T4 → T3 (75 MP), dmg → 135; self-area r2, DEF −1, 1 AP (F §5: Nebula's shape) [Q1: one T4 per family — applies only if mondo keeps 4 tiers]

**Cowboy Skills** `cowboyskills`
- **Fan the Hammer** `raceFanTheHammer` T2 · rung cowboy#2, sheriff#2 — RETIER T2→T1 (F.g8): T2 → T1 (25 MP). The section says sheriff's rung raceFanTheHammer "stays legal" (family); extractor: sheriff rung 2 = raceFanTheHammer and cowboy rung 2 = [raceFanTheHammer, raceDynamite] then hold a T1 row on rung 2 — tier … · REWRITE (F.g8): The point-blank spray: kind barrage, self-aoe r1 (every enemy adjacent to the caster), dmg 100 → 80, rng 2 → 0 (T1 25 MP per the RETIER). Desc: "Six shots from the hip. WEAK physical damage to every enemy next to you." The T1 answer to being rushed — neither race has a close-range passive (Point Blank is the marksman's and …
- **High Noon** `raceHighNoon` T4 · rung cowboy#4, sheriff#4 — RECOST (F.g8): 2 AP → 1 AP (keep 100 MP). Rest unchanged: T4 180 physical rng 6, ignores LoS, ×1.5 vs Stagger/Roped. · DESC (F§): "Always a critical hit." is a lie — delete the `guaranteedCrit` field; the "one bullet through every wall" is `ignoresLineOfSight` and is real.

**Cryptid Abilities** `cryptid`
- **Dread Aura** `raceDreadAura` T1 · rung bigfoot#1, mothman#1 — DESC (F§): "ATK lowered by 2 stages and DEF by 1 stage" is true (status discord 2) but four different texts for one status; use the status name (Discord) so Discord's 6 payoffs read as payoffs.
- **Blurry Photo** `raceRealityShift` T2 · rung bigfoot#2 — DELETE (F.g5): Cryptid Vanish covers it (both "go invisible for 2").
- **Cryptid Vanish** `raceCryptidVanish` T3 · rung mothman#3, loch ness monster#3 — RETIER T3→T2 (F.g5): T3 → T2 (50 MP): teleport 2 + Invisible 2, CD2 unchanged; parity with Mist Form / Corpse Crawl / Nimble Dodge. Section: "Mothman rung 3 and loch ness rung 3 stay valid" —

**Cult of Personality** `cult`
- **Tithe** `raceCultTithe` T2 — MOVE → Cult of Personality (F.g2): biblestudy -> cult: a cult-leader row (raceCult* id, unholy, shadow, 'everything you own belongs to the family'); Cult of Personality gets its missing T1. · RETIER T2→T1 (F.g2): T2 -> T1 (already costs 25MP; 50 dmg + steal 1 item is a T1 payload).
- **Indoctrinate** `raceCultIndoctrinate` T3 · rung cult leader#3 — REWRITE (F.g2): Add bonusVsStatus { status: 'charm', mult: 2 } on the possess row (exactly Enthrall's field at data.js:6296 - two activations if the target is Charmed). Kool-Aid -> Indoctrinate becomes a two-turn plan.

**D.O.O.R. Training** `door`
- **Door Dash** `raceDoorDash` T1 · rung door agent#1 — RETIER T1→T2 (F.g7): T1 → T2 (50 MP), keep teleport 5 and no CD (a 5-tile no-CD teleport at 25 MP was six free teleports on a 170-MP unit).

**Deep Sea Anatomy** `deepsea`
- **Depth Charge** `raceDepthCharge` T3 · rung kraken#3, deep sea fish#3 — REWRITE (F.g6): 125 physical 3×3, rng 4, finisher ×1.5 vs WET instead of Discord. Desc: "It goes off under the surface. Anything soaked — or standing in the water — takes the shock through its body." Stays the bruiser rung (sharkman 92, deep sea fish 84, nessie 54); water-tile case needs the bonusVsStatus → _unitIsSoaked engine line. …
- **Poseidon's Wrath** `racePoseidonsWrath` T4 — RECOST (F.g6): 75 MP → 100 MP (T4 ladder), keep 170 / 2 AP / water-only.

**Deep State Connections** `deepstate`
- **Black Budget** `raceBlackBudget` T2 · rung politician#2 — RETUNE (F.g8): Overclock duration 1 → 2 rounds (matches overclock). Stays T2 50 MP. Desc: "Money that was never appropriated. Overclocks a Single Ally for 2 rounds: +1 ATK stage, +1 MOV (tech units also +1 RNG)." politician rung 2.
- **Brainwash** `raceBrainwash` T3 · rung telepath#3 — REWRITE (F.g8): T3 75 MP 1 AP, CD 3 (new), rng 3, single: kind possess (Possession / Enthrall / Indoctrinate plumbing), Possessed 2 (its next activation is yours) and Discord 2 left behind when the programming wears off (was a plain Discord 2 bolt, the only user of _DISCORD_BOLT). Desc: "Everyone has something, and we have it. A Single Enemy …

**Demonic Abilities** `demonicabilities`
- **Inner Demon** `raceInnerDemon` T1 · rung halfdemon#1 — DELETE (F.g3): self ATK+1 duplicated by Grim Resolve (Shadow) / Blood Ritual (Blood) / Hellfire Crown (Infernal Court) for every physical race here; succubus (ATK 16) and fallen angel (ATK 8) never wanted it
- **Soul Bind** `raceSoulBind` T2 · rung demon#2 — REWRITE (F.g3): 30% shared damage; 45% while either bound target is Contracted (in-family trigger replaces the dead "demon's M ATK raised" clause); everything else unchanged
- **Devour Soul** `raceVoidContract` T3 · rung demon#3 — RECOST (F.g3): Devour Soul AP 2 → 1 (125 + 50% drain at 75MP is Life Sap's tier; the finisher earns the T3 slot)
- **Demonic Claw** `raceDemonicClaw` T4 · rung halfdemon#4 — RETIER T4→T3 (★): T4 → T3 (75 MP), dmg → 135; keeps F.g3's Contract / Soul Bound ×1.5 finisher (drops Marked per F.g3) [Q1: one T4 per family — applies only if mondo keeps 4 tiers] · REWRITE (F.g3): 180 physical melee unchanged; drop Marked 2 (zero payoffs today); add finisher Contract/SoulBound ×1.5 — ATK-scaling payoff for demon prince / halfdemon, mirroring Devour Soul.

**Dirty Fighting** `dirtyfighting`
- **Body Check** `raceBodyCheck` T1 · rung juggernaut#1, luchador#1 — REWRITE (F.g7): 100 physical, rng 1, push 2, applies Stagger 1, no finisher (was finisher ×1.5 vs Stagger). The family's own setup.
- **Curb Stomp** `raceStompOut` T1 · rung gangster#1 — REWRITE (F.g7): 100 physical (was 120), Grievous 2, finisher ×1.5 vs Stagger. Body Check → Curb Stomp = 150 + a wound for two T1 rows.
- **Dark Justice** `raceDarkJustice` T1 · rung antihero#1, clown#1 — REWRITE (F.g7): charge rng 3, 100 physical, bonusVsStatus: [grievous, silence] ×1.5 (the live list form High Noon uses) — "bonus damage to the Wounded or Silenced"; drop the dead bonusVsDebuffed.
- **Iron Grip** `ironGrip` T2 — REWRITE (F.g7): T2 50 MP 1 AP, rng 1, 80 physical (was no damage) + Root 2 + grounds flyers. The grab that also hurts (Cuffed T3 is 60 + Root 2).
- **Brutal Slam** `raceBrutalSlam` T3 · rung juggernaut#3, luchador#3 — REWRITE (F.g7): T3 75 MP 1 AP, self-aoe r1, 110 physical (was 125), every enemy hit takes Grievous 2. "The anti-heal area — a role no other AoE in the game has" (
- **No Mercy** `raceNoMercy` T4 · rung antihero#4, clown#4, goblin#4 — REWRITE (F.g7): 180 physical, rng 1, 2 AP, finisher ×1.5 vs Stagger, executePct: 0.25 (outright kill below 25% HP, the live Walk the Plank field); drop the dead executeBonusPct. · REWRITE (★): ★ use `executeBelowPct: 0.25` (live on damage rows, judged before the hit — Take Aim's key) instead of F.g7's `executePct`, which battle.js reads only inside Walk the Plank's terrain flow

**Dragon Abilities** `dragonabilities`
- **Dragonfear** `raceDragonfear` T2 · rung dragon#2 — REWRITE (F.g5): T2, 50 MP, rng 4, aoe r1: Feared 1 (must flee) AND Burn 1 to every enemy in the 3×3 (was Discord 2 self-aoe r3). Desc: "Ancient terror, roared down from above. They run, and they run burning." Not a copy of Fear (shadow T2 self-aoe r3 Feared 1) nor of Dread Aura. · DESC (F§): "ATK lowered by 2 stages and DEF by 1 stage" is true (status discord 2) but four different texts for one status; use the status name (Discord) so Discord's 6 payoffs read as payoffs.
- **Dragon Toss** `raceDragonToss` T3 · rung dragon#3 — DESC (R.3): Numbers kept (T3, base 70 + dmgPerLevel 25 over carryHeight 5, collisionBonus 60, finisher burn×1.5, requiresFlight): the description should say the base hit is light and the payload is the fall/collision.
- **Dragonfire** `raceDragonfire` T4 · rung dragon#4 — REWRITE (F.g5): 160 fire/magic line w1 rng 4, Burn 3 (was 2), finisher burn ×1.5 (was none). Breath → Dragonfire is now the family's loop.

**Dream Predation** `astral`
- **Nightmare Pulse** `raceNightmarePulse` T3 · rung dreameater#3 — RETYPE (F.g3): -/magic → psychic/magic · REWRITE (F.g3): T3 damage/lifeDrain, psychic/magic, 75MP 1AP, rng 0 → 3, aoe r1 targeted (not self-centred), dmg 125, drain 25%, finisher Stun ×1.5. "The dream finishes eating." AOE payoff for Sleep Paralysis / Eternal Slumber, cast from the back line
- **Sleep Paralysis** `raceSleepParalysis` T3 · rung succubus#3 — RETIER T3→T2 (F.g3): T3 → T2 (50MP): same tier and shape as Taser (police T2, 70 + Stun 1, CD2); the T2 now sets up the T1 · REWRITE (F.g3): dmg 125 → 60, status Root 2 → Stun 1 (sleep paralysis = cannot move OR act), rng 3, CD 2

**Driving Skills** `drivingskills`
- **Transform** `raceTransform` T2 · rung honda civic#2 — DESC (F.g4): new text: "Stand up into the combat platform (the civic's mecha; a cruiser's riot rig) — −3 SPD, +1 DEF and +2 M DEF stages, +2 RNG — or fold back down." Numbers unchanged; stops assuming a Honda
- **Nitro Boost** `raceNitroBoost` T3 · rung honda civic#3 — REWRITE (F.g4): T3, 75MP 1AP, self: Overclock 2 (ATK +1, MOV +1) + SPD +1 stage (was SPD +1 only). "Floor it." The pre-charge buff for Ram Charge / Vehicular Manslaughter
- **Vehicular Manslaughter** `raceMissileBarrage` T4 · rung honda civic#4 — REWRITE (F.g4): Vehicular Manslaughter: T4, 100MP 1AP (was 2AP), damage/dash line w1 rng 4 (was 3×3 aoe): drives through every enemy along the line for 160 physical, finisher Discord ×1.5, ends on the far tile. "It was an accident. Four times." Exhaust Cloud → Manslaughter is the in-family chain (the existing dash kind already hits every tile …

**Earth Abilities** `earth`
- **Fissure** `sharedFissure` T1 · rung nephilim#3, dinosaur#3, gnome#1, golem#3 — RETIER T1→T2 (F.g1): T1 -> T2, 25MP -> 50MP; keep 100, chasm terrain, Stagger 1 (Flash Freeze makes 3 tiles of ice for 50MP at T2).
- **Tremor Stomp** `raceTremorStomp` T1 · rung tree person#1 — RETUNE (F.g1): self 3x3 dmg 125 -> 80 (T1 area house; was the same spell as Fee Fi Fo Fum T3 125). Keep at T1 (tree person rung 1 stays).
- **Ground Slam** `groundSlam` T3 — REWRITE (F.g1): Remove the dead selfCenter field (row is already rng 0 self-centred); no behaviour change. Keep Slow 2 (Earth's one Slow source for Tidal Slam / Judgment payoffs).
- **Rampart** `rampart` T4 · rung crystal guardian#4 — RETIER T4→T2 (F.g1): T4 -> T2, 100MP -> 50MP (matches Walls of Camelot: tiles3, wall 2 high, 60 dmg). Canonical id rampart (alias sharedRampart).
- **Stone Drop** `raceStoneDrop` T4 · rung gargoyle#4 — RETIER T4→T3 (F§): earth: Stone Drop → T3 125 skyDrop. · RETUNE (F§): 150 → 125.

**Engineering** `engineering`
- **Tinker** `passiveTinker` T1 — MOVE → Engineering (F.g9): Becomes Engineering's family passive (tier 1, same hooks): useless to ~120 of 124 races (only droid, gnome use turrets / Repair). Cross-slice: the engineering block should confirm.
- **Deploy Turret** `deployTurret` T2 — RETUNE (F.g4): turret hp 60 → 80 (inherits Clockwork's one virtue — baked into the base row, although the block calls +20 HP "exactly what an upgrade is for")
- **Clockwork Turret** `raceClockworkTurret` T3 · rung gnome#3 — DELETE (F.g4): dominated by Deploy Turret (T2, 50MP, two turrets at 110); its only virtue (+20 turret HP) "is exactly what an upgrade is for" — covered by Deploy Turret + Overclocked turret / Surplus
- **Overtinker** `raceOvertinker` T4 · rung gnome#4 — RECOST (F.g4): 2AP → 1AP, add CD2 (the other seven aoeShield rows are 1AP)

**Eyesight** `eyesight`
- **Hypnotic Pulse** `raceHypnoticPulse` T3 · rung occulus#3 — REWRITE (F.g5): T3, 75 MP, rng 3, aoe r1: Stun 1 to every enemy in the 3×3 (was single target). Desc: "Everything that looks back stops." A damage-free 3×3 stun at 1 AP; single-target stun stays Alien Weapons' T1. Rung swap (Races paragraph): cyclops rung 2 raceBalefulGaze → raceHypnoticPulse —

**Fae Magic** `fae`
- **Pixie Dust** `racePixieDust` T2 · rung fairy#2, mushroom girl#2 — DELETE (F.g9): Three ally-mobility buffs at T1–T2 do one job three times; Pixie Dust (+2 MOV 2 turns) is the weakest and least distinct — Fairy Dust (flight) is the family's mobility buff. The status name lives on as the glitter-mote array.
- **Glitter Bomb** `raceGlitterBomb` T3 · rung fairy#3 — RETUNE (F.g9): dmg 100 → 120 (T3 area scale ~125; keeps Blind 1). fairy rung 3 (pair with Trick Room).
- **Fae Ring** `raceFaeRing` T4 · rung fairy#4 — REWRITE (S): fae T4 damage/aoe nature/magic 100MP 2AP dmg 160 ring: ADD finisher:blind×1.5 ("the blinded stumble onto the ring") — fairy/mushroom girl/rabbit loop Glitter Bomb T3 → Fae Ring T4 (175 MP).

**Fallen Angelic Powers** `fallenangel`
- **Fallen Grace** `raceFallenGrace` T1 · rung fallen angel#1, nephilim#1 — RETUNE (F.g3): dmg 100 → 80; Burn 1 stays (the setup row, not the nuke). Was a 100-dmg T1 cross AOE (house T1 area ≈80)
- **Abyssal Wings** `raceAbyssalWings` T2 · rung fallen angel#2, nephilim#2 — REWRITE (F.g3): T2 movement/dash, no element, 50MP 1AP CD 2, self: fly up to 4 tiles (teleportDistance:4, the Spirit Walk field; path ignores ground and units) and land under Protect 1. "Spread the black wings." Reposition-plus-guard instead of a 4th Protect-buff row: nephilim reaches melee for Descending Wrath in one action; fallen angel …
- **Descending Wrath** `raceDescendingWrath` T4 · rung fallen angel#4 — RETIER T4→T3 (F§): fallenangel: Descending Wrath → T3 135 skySlam. · RECOST (F§): RECOST 2 AP → 1 AP (Stone Drop is the same shape at 1 AP). · RETUNE (F§): 160 → 135.
- **Wrath of the Watchers** `raceWrathOfTheWatchers` T4 · rung nephilim#4 — REWRITE (F.g3): dmg 180 → 160 (house T4 area); finisher Stagger ×1.5 → Burn ×1.5 (fed by Fallen Grace; Stagger payoff stays with the infernal royalty via Dark Dominion). 1AP CD2, cross r2, rng 4, Burn 1 unchanged

**Feline Anatomy** `feline`
- **Meow** `raceMeow` T3 · rung catgirl#3 — RETIER T3→T1 (F.g5): T3 → T1 (25 MP), same effect (DEF −1 self-aoe r2); parity with Chest Pound.
- **Ninefold Scratch** `raceNinefoldScratch` T4 · rung catgirl#4 — REWRITE (F.g5): 9 hits × 20 = 180 (was 5 × 32 = 160): T4 single house scale; nine because the name says nine; multi-hit rewards Echo Band / per-hit riders.

**Fire Magic** `fire`
- **Fireball** `fire1` T1 · rung jack o lantern#1 — REWRITE (F.g1): T1 25MP 1AP rng 3 single magic: dmg 80->100 and adds Burn 2. Desc: 'A fist of fire. MEDIUM magic damage; the target keeps burning.' The in-family setup for Meteor (Burn x1.5) and allied Burn payoffs.
- **Scorched Earth** `sharedScorchedEarth` T3 · rung demon prince#3, overlord#3 — DELETE (F.g1): Wall of Fire covers the scorched line better in every column but range (80 vs 70, Burn 2, persists, spreads); its only edge (rng 4) is given to wallOfFire (separate RECOST).
- **Wall of Fire** `wallOfFire` T3 — RECOST (F.g1): rng 3 -> 4 so nothing is lost when Scorched Earth goes.
- **Meteor** `meteor` T4 · rung jack o lantern#4 — DESC (F.g1): Numbers unchanged. Strike 'Destroys buildings' from the desc: the row has status/finisher/groundsFlyers/leaveTerrain/terrainDeform only, no building field.

**Football IQ** `football`
- **End Zone Dance** `raceEndZoneDance` T1 — DELETE (F.g7): one of six T1 self ATK +1 clones; Audible is the family's buff; nobody's rung.
- **Blitz** `raceBlitz` T2 · rung quarterback#2 — RETUNE (F.g7): dmg 100 → 110 (T2 with Stagger; Stampede 130 is a tier offender — 110 is the line).
- **Audible** `raceAudible` T3 · rung quarterback#3 — REWRITE (F.g7): T3 75 MP 1 AP, aura r2 — every ally within 2 gains Overclock 1 (ATK +1 stage, MOV +1; tech allies also +1 RNG) (was SPD +1). Desc: "Check with me."
- **Spike the Ball** `raceSpikeTheBall` T3 · rung quarterback#3 — RETIER T3→T1 (F.g7): T3 → T1 (25 MP), 80 aoe r1 rng 3 — the number was always T1.

**Fortune Telling** `fortunetelling`
- **Star Crossed** `raceStarCrossed` T1 — MOVE → Fortune Telling (F.g2): astrology -> fortunetelling; T1 stays: 70 arcane magic + an affliction by the target zodiac (burn / root+exposed / silence / drowsy), +50% if the sign rules the sky (zodiacReading is read by battle.js). Her new T1 and rung 1.
- **Tarot Draw** `raceTarotDraw` T1 · rung fortune teller#1 — RETIER T1→T2 (F.g2): T1 -> T2 (25MP -> 50MP); keep auraRadius 99, random stat, CD3 (the randomness is a discount, not a T1 licence).
- **Palm Read** `raceSpiritChannel` T2 · rung fortune teller#2 — RENAME → "Séance" (F.g2): 'Palm Read' -> 'Séance'; heal 190 + cleanse 2 stays at T2 (now on par with Heal after its retier). · DESC (F§): Reverse lie: desc does not mention the cleanse (cleanse: 2); write it (Immortal Cycle `raceJellyRebirth` "cleanses 2 debuffs" is the model text).

**Fractal Pattern Recognition** `fractal`
- **Dimensional Fold** `raceDimensionalFold` T1 — RECOST (F.g4): rng 5 → 3 (keep T1 / 25MP; the family's identity utility, priced by range)
- **Fractal Needle** `raceFractalNeedle` T4 · rung mantid#4, voidweaver#4 — DESC (F.g4): new text: "HEAVY magic damage to one enemy; the needle splits and seeks up to two more within 2 tiles for half. Bonus damage to Stunned targets." Row unchanged (170, splitBeam, finisher Stun); old text said "All Enemies in a line"

**Galactic Federation Protocol** `galacticfederation`
- **Federation Beacon** `raceFederationBeacon` T1 — RETIER T1→T2 (F.g4): T1 → T2 (50MP); keep 40 HP regen r4, hp 70; nordic rungs unchanged
- **Stasis Beam** `raceStasisBeam` T3 · rung nordic#3 — REWRITE (F.g4): T3: add 80 light/magic damage to the Stun 1 + groundsFlyers, rng 4, CD2. "Held in the light. Held."
- **Nordic Accord** `raceNordicAccord` T4 · rung nordic#4 — RETIER T4→T3 (F§): fold list → T3 (75 MP): a two-stage team aura is Iron Dome + one stage; T3. · REWRITE (F§): REWRITE kind → `warCry` (aura r99; all allies M DEF+1 & M ATK+1). Same lie (filed as heal, heal 0).

**Gear** `gear`
- **Echo Band** `gearEchoBand` T1 — RETIER T1→T2 (F.g9): T1 → T2 (2 SP): +50% on every basic attack outclasses Brute Force (+20%) and Warpath (+15%) at the same 1 SP.
- **Jetpack** `gearJetpack` T1 — RETIER T1→T2 (F.g9): T1 → T2 (2 SP): permanent flight = the high-ground bonus and terrain immunity for the whole match (Fairy Dust buys 2 rounds of it for 50 MP).
- **Martyr's Talisman** `gearMartyrsTalisman` T1 — RETIER T1→T2 (F.g9): T1 → T2 (2 SP): a per-life death save is Plot Armor / Indomitable Will as a passive.
- **Signal Flare** `gearSignalFlare` T1 — DESC (F.g9): Desc only, to say "one use — thrown up to 8 tiles into the fog, reveals a diamond 6 tiles out from where it lands; the flare is spent" so the two read as different tools (ui.js doFlair: range 8, flairRadius = 6, the accessory is …

**Giant Abilities** `titan`
- **Stone Throw** `raceStoneThrow` T1 · rung cyclops#1 — MOVE → Giant Abilities (F.g5): MOVE IN from stoneage as the T1 ranged option (100 earth/phys rng 5, finisher stun ×1.5, through cover) — same move as the Stone Age block.
- **Thick Hide** `raceThickHide` T2 · rung juggernaut#2 — MOVE → Giant Abilities (F.g7): athleticism → titan ("Giant Abilities has no T1/T2; a thick hide belongs to giants, cyclops, nephilim and the juggernaut"). Juggernaut's T2 rung follows it (juggernaut is on titan).
- **Fee Fi Fo Fum** `raceTitanStep` T3 · rung giant#3 — RETIER T3→T2 (F.g5): T3 → T2 (50 MP), part of the REWRITE. Section: "Giant rung 3 stays raceTitanStep" — · REWRITE (F.g5): T2 (50 MP), effect (no damage), self-aoe r2: every enemy within 2 is Marked 2 (smelled out; invisible broken) and Staggered 1. Desc: "Fee. Fi. Fo. Fum. He knows where you are, and the floor knows it too." Stops being Tremor Stomp (T1 125 self-aoe r1 + Stagger); the family's stagger setup.
- **Colossal Crush** `raceColossalCrush` T4 · rung giant#4 — RETIER T4→T3 (★): T4 → T3 (75 MP), dmg → 135; keeps the Stagger ×1.5 finisher; 1 AP per F.g5 [Q1: one T4 per family — applies only if mondo keeps 4 tiers] · RECOST (F.g5): 2 AP → 1 AP (180 + stagger finisher, same as Jurassic Jaw at 1 AP).
- **Giant Smash** `raceGiantSmash` T4 · rung cyclops#4 — RECOST (F.g5): 1 AP → 2 AP (170 + path 56 + Stun is a two-AP turn; Absolute Zero's freeze costs 2).

**Grave Hunger** `ghoulish`
- **Frenzy** `raceFrenzy` T1 · rung ghoul#1 — RETIER T1→T2 (F.g3): T1 → T2 (50MP); drain 30%, Grievous 2 unchanged. · RETUNE (★): dmg 120 → 110 at T2 (★ F.g3 wrote 130, which breaks THE TIER RULE; F§ §2 and R.3 both say 110 — Absorb is the T2 130 with no status)
- **Carrion Feast** `raceCarrionFeast` T3 · rung ghoul#3 — REWRITE (F.g3): T3, 75MP 1AP CD 2, rng 2: feeds on a gravestone or pile of bones within 2 — heals 50% max HP and raises ATK by 1 stage; the remains are consumed (that unit's respawn delayed 2 rounds). Corpse-gated like Cannibalize (zombie T2, 35%) — the two become a ladder (was self heal 25%, rng 0). Kind not stated (Cannibalize is kind …

**Great Ape** `apeintelligence`
- **Seismic Leap** `raceSeismicLeap` T2 · rung kaiju#2, king kong#2 — MOVE → Great Ape (F.g5): kaiju → apeintelligence: Kong's rung 2 (his Empire State leap); kaiju keeps Stomp for the same job (kaiju rung 2 fix is on the Cataclysm Stomp RETIER record).
- **Monkey Business** `raceApeFury` T3 · rung king kong#3 — RENAME → "Go Ape" (F.g5): "Monkey Business" → "Go Ape" (id raceApeFury is the buff; racePrimalSmash is "Ape Fury" — the id/name mismatch stays). · REWRITE (F.g5): T3, 75 MP, self +2 ATK stages (was +1), selfDamagePct: 0.1 (Blood Ritual T3 gives +1 for the same HP price — this is the bruiser version).
- **Ape Fury** `racePrimalSmash` T4 · rung king kong#4 — REWRITE (F.g5): finisher slow ×1.5 → stagger ×1.5 (Seismic Leap sets it; the loop closes inside the race). 180 phys rng 1, deform unchanged.

**Gun Training** `weaponstraining`
- **Double Pump** `doubleShot` T1 · rung sheriff#1 — REWRITE (F.g8): Drop markedSecondHitBonus (+3 dmg on hit 2 vs Marked — any physical hit already eats the Mark for +40, so pellet 1 consumes it). Keep T1 2 × 60 physical, rng 3, 25 MP. Desc: "Two barrels, no waiting. Deals MEDIUM physical damage to a Single Enemy across 2 hits."
- **Impact Round** `riderImpactRound` T2 — DELETE (F.g8): Impact Round (T2 90 physical single rng 4, 50% splash to adjacent enemies) IS the shipped Blast upgrade (3×3 ×0.5 on a single hit); Blast on Double Pump or Dead Eye covers it exactly; nobody's rung.
- **Ricochet** `ricochet1` T2 — DELETE (F.g8): Ricochet (T2 100 physical single rng 3, bounces to nearby enemies) IS the shipped Ricochet upgrade (bounce ×0.5); nobody's rung.
- **Scatter Shot** `riderScatterShot` T2 — REWRITE (F.g8): Add ignoresLineOfSight: true for the random targets ("it does not need line of sight to the extra victims — make that true"). Stays T2 64 physical to 3 random enemies in rng 4. Desc: "Point it that way and pull. WEAK physical damage to 3 random enemies within 4 tiles — no aim, no line of sight needed."
- **Crossfire** `crossfire` T3 — REWRITE (F.g8): Shape: self-centred cross r2 at rng 0 (Blade Waltz's shape) → cross r1 centred on the TARGET tile at rng 4 (Fallen Grace's shape, rng 4 cross r1). 125 physical, 75 MP 1 AP (T3 unchanged). Desc: "Two shooters' worth of lead on one crossing. Deals MEDIUM physical damage to every enemy on the X around the target."
- **Dead Eye** `deadEye` T4 — REWRITE (F.g8): Drop guaranteedCrit (dead field — SPELL_DEAD_FIELDS, battle.js never reads it; the card lies). Raise the Mark: bonusDamage 40 → 60, duration 2 → 3. Stays T4 180 physical single rng 4. Desc: "One breath, one shot. Deals HEAVY physical damage to a Single Enemy and Marks them for 3 rounds: the next physical hit any ally lands on … · DESC (F§): "Always lands a critical hit." is a lie (`guaranteedCrit` not implemented). Recommend: delete the field, keep 180; desc "180 physical, Marked 2." (Alternative: implement guaranteedCrit in rollCrit and RECOST dmg 180 → 120, since …
- **Extended Clips** `raceExtendedClips` T4 · rung gangster#4 — RETIER T4→T3 (F§): fold list → T3 (75 MP): weaponstraining keeps Dead Eye. (§1 C had kept it at T4.)

**Healing Magic** `healingmagic`
- **Heal** `heal1` T1 · rung starfish#1 — RETIER T1→T2 (F.g2): T1 -> T2 (25MP -> 50MP); numbers stay (192, more on allies under 40% HP): it out-healed every T2 heal.

**Heavenly Duties** `angelic`
- **Divine Light** `raceDivineLight` T1 · rung priest#1 — REWRITE (R.1): T1 heal/heal 25MP 1AP rng 3: heal 140 on the ally AND 70 light/magic damage to every enemy adjacent to that ally (was a plain 140 heal, dominated by Heal)
- **Purify** `racePurify` T1 · rung nun#1 — RETIER T1→T2 (F.g2): T1 -> T2 (25MP -> 50MP): stays the only area cleanse, now above the single-target ones. Nun rungs: the ONE set is recorded on the Bible Study family record.
- **Radiant Bolt** `radiantBolt` T1 · rung angel#1 — DELETE (F.g2): Duplicate of Smite (Light T1 100 light magic, now rng 4) on priest/angel/seraphim/nun; valkraye is a 26-INT bruiser who never wanted a magic bolt.
- **Rapture** `raceRapture` T1 · rung seraphim#1 — RETIER T1→T2 (F.g2): T1 -> T2, 25MP -> 50MP, 2AP -> 1AP. Seraphim rungs -> [raceAbsolution, raceRapture, raceSanctuary, raceMerkaba]. · REWRITE (F.g2): CD2, rng 4 (unchanged): the ally is lifted - Protect 1 round AND Levitating 2 rounds (temporary flight with the high-ground bonus). Now differs from Protect (protect1): pulls a tank out of a melee scrum or over a wall.
- **Miracle** `raceWingsOfMercy` T2 · rung angel#2 — REWRITE (F.g2): Keep the swap; wire healOnSwap in battle.js and set it 60 -> 100 (a T2 heal-lite). Today healOnSwap is read by nothing (data.js:6170 its only occurrence). · DESC (F.g2): CONDITIONAL fallback: until healOnSwap is wired, strike the 'heals on arrival' clause from the desc.
- **Divine Judgment** `raceDivineJudgment` T3 — MOVE → Heavenly Duties (F.g2): holydefense -> angelic: defined in the seraphim's block (data.js:6085) but the seraphim is not on Holy Defense, so only valkraye (INT 26) and crystal guardian (INT 40) could equip a 135 MAGIC cross. Becomes angelic's T3 damage, … · RECOST (F.g2): 50MP -> 75MP (on ladder), 2AP -> 1AP. · RETUNE (F.g2): dmg 135 -> 125; Burn 2 kept.
- **Sanctuary** `raceSanctuary` T3 · rung angel#3, seraphim#3, fallen angel#3 — RETUNE (F.g2): healPerTurn 48 -> 90, zoneDuration 2 -> 3 (270 per ally over 3 rounds if they hold the ground).
- **Divine Smite** `raceDivineSmite` T4 · rung angel#4 — RECOST (F.g2): 2AP -> 1AP; 100MP, 180, +80 vs Unholy stay (the anti-Unholy hammer; Exorcism is the anti-curse one).

**Hidden Technology** `advancedtechnology`
- **Free Energy** `freeEnergy` T1 — RETIER T1→T2 (F.g4): T1 → T2 (50MP) · RETUNE (F.g4): pin the number: restores 40 MP to every ally (the row lists no amount today) — half the cost back to a 4-unit team
- **Tesla Coil** `raceTeslaTrap` T1 · rung mad scientist#1 — RETUNE (F.g4): pin the shock at 80 lightning/magic in the 3×3 (T1 area house; no damage number on the row today); keep 3 charges
- **Classified Weapon** `raceClassifiedWeapon` T4 · rung men in black#4 — RETIER T4→T3 (F§): advancedtechnology: Classified Weapon → T3 135 + jammed finisher. · RETUNE (F§): 180 → 135.

**Holy Defense** `holydefense`
- **Shield Maiden** `raceShieldMaiden` T2 · rung valkraye#2 — REWRITE (F.g2): T2 50MP 1AP, self (was a 120 shield on one ally, rng 3): +1 DEF stage and every enemy within 2 tiles is Taunted 1 round (must attack her). Valkraye rung 2 stays raceShieldMaiden.
- **Divine Swoop** `raceDivineSwoop` T3 · rung valkraye#3 — REWRITE (F§): REWRITE: add Stagger 1 on landing. Identical to Feral Dive today.
- **Chooser of the Slain** `raceChooserOfSlain` T4 · rung valkraye#4 — RECOST (F.g2): MP 100 -> 75 (pinned override, i.e. manaCostOverride); keeps 2AP, revive 60%. The valkraye (80 MP) must be able to cast her rung-4 capstone.

**Horns & Hooves** `horns`
- **Horn Toss** `raceHornToss` T1 · rung minotaur#1 — REWRITE (R.3): a true toss: damage/displacement, T1, 25 MP, 1 AP, rng 1, single, 80 physical, throw the target 3 tiles in any chosen direction (not just away), collisionBonus 60 (the Sky Tackle mechanic, no flight), finisher stagger×1.5 kept. Separates it from Body Check (straight shove, push 2). Stays minotaur#1.
- **Cliff Charge** `raceCliffCharge` T2 · rung goatman#2, krampus#2 — DELETE (F.g5): Gore Charge is the charge; nobody needs a worse one.
- **Labyrinth Roar** `raceLabyrinthRoar` T2 · rung minotaur#2 — REWRITE (F.g5): T2, 50 MP, self-aoe r2: Discord 2 AND Taunt 1 (they must swing at the minotaur). Desc: "The walls throw the bellow back from every direction. Everything nearby loses its head and comes for the horns." No longer a Dread Aura copy. · DESC (F§): "ATK lowered by 2 stages and DEF by 1 stage" is true (status discord 2) but four different texts for one status; use the status name (Discord) so Discord's 6 payoffs read as payoffs.
- **Bull Rush** `raceBullRush` T4 · rung minotaur#4 — REWRITE (F.g5): add dashDamage: 60 (keep 170, rng 4, finisher discord ×1.5). The text already promises path damage. · DESC (F§): Desc ("Dashes through the battlefield.") omits the main hit (170 to the TARGET plus path damage).

**Horseback Riding** `horsebackriding`
- **Brave Charge** `guardSlash` T1 — REWRITE (F.g7): charge rng 4 (was 3; a horse closes faster than legs), 100 physical, T1 25 MP 1 AP.

**Human Grit** `humangrit`
- **Elbow Grease** `raceElbowGrease` T1 · rung homosapien#1 — REWRITE (F.g7): 100 physical (metal) (was 90), rng 1, 25 MP 1 AP — on the T1 single scale, nothing else.
- **Improvise** `improvise` T1 · rung homosapien#1 — DELETE (F.g7): Elbow Grease covers the T1 hit (redundancy group "Bone Toss · Improvise").
- **Adrenaline Rush** `raceAdrenalineRush` T2 · rung homosapien#2 — RETUNE (F.g7): selfHealPct 0.55 → 0.40, keep SPD +1 and cleanse 2 (50 MP 1 AP). · DESC (F§): Reverse lie: desc does not mention the cleanse (cleanse: 2); write it (Immortal Cycle `raceJellyRebirth` "cleanses 2 debuffs" is the model text).
- **Underdog Spirit** `raceUnderdogSpirit` T3 · rung homosapien#3, door agent#3, firefighter#3 — REWRITE (F.g7): T3 75 MP 1 AP — self ATK +2 stages (was +1) and cleanse 1 debuff. "Nobody believed in you — good." (Mimicry is +2/+2 at T4.)
- **Indomitable Will** `raceIndomitableWill` T4 · rung homosapien#4, sidekick#4 — RECOST (F.g7): apCost 2 → 1 (100 MP, CD3 stays).

**Hunting Skills** `huntingskills`
- **Forest Ambush** `raceForestAmbush` T1 — MERGE → Camouflage (F.g8): Forest Ambush (T1 self ATK +1 stage — one of eight identical self atk+1 rows) folds into Camouflage (see camouflage REWRITE). Delete raceForestAmbush. Nobody's rung.
- **Camouflage** `camouflage` T2 — REWRITE (F.g8): Absorbs Forest Ambush: T2 50 MP CD 2, self Invisible 1 AND ATK +1 stage. Desc: "Go still in the brush. Invisible for a round and the next shot comes from ambush: +1 ATK stage."
- **Whistle** `raceWhistle` T3 · rung cowboy#3 — DESC (F.g8): Desc last line → "One hound per hunter." (it says "per cowboy" on a spell marksman, Robin and the sheriff own). Row unchanged.

**Ice Magic** `ice`
- **Ice Shard** `raceIceShard` T1 · rung yeti#1 — DELETE (F.g1): Strictly dominated by Ice Spear (+2 rng, +1 Slow, same 25MP); Grave Chill (Poltergeist) covers ghosts.
- **Ice Spear** `raceIceSpear` T1 · rung ice queen#1 — RECOST (F.g1): rng 5 -> 4; keeps Slow 2 (rng 5 at T1 was why Shard looked bad).
- **Summon Blizzard** `sharedSummonBlizzard` T1 — RETIER T1→T2 (F.g1): T1 -> T2, 25MP -> 50MP, 2AP -> 1AP: every weather summon unified on Sandstorm pricing (T2/50MP/1AP).
- **Ice Slide** `raceIceSlide` T2 · rung yeti#2 — RETUNE (F.g1): dmg 140 -> 130 (T2 single house).
- **Diamond Dust** `raceDiamondDust` T3 · rung ice queen#3 — RECOST (F.g1): 2AP -> 1AP (X r2 125 + Slow 2 unchanged).

**Infernal Court** `infernalcourt`
- **Hellfire Crown** `raceHellfireCrown` T1 · rung overlord#1 — REWRITE (F.g3): self, +1 stage to whichever of the caster's ATK / M ATK is higher, CD 2 (was 0), 25MP 1AP. One crown for the bruiser prince and the caster princess (was ATK+1, dead for the princess at ATK 8)
- **Infernal Conscription** `raceInfernalConscription` T2 · rung demon prince#2 — REWRITE (F.g3): T2 damageEffect/pull, -/magic, 50MP 1AP, rng 3→4, single: 60 magic dmg, pulls the target up to 3 tiles toward the caster (pullDistance:3, the field Undertow patches), Stagger 1 (replaces Marked 3). "Report for duty." The court's own Stagger setup — Dark Dominion self-contained for all three races
- **Infernal Decree** `raceInfernalDecree` T2 · rung overlord#2 — RECOST (F.g3): AP 2 → 1 · RETUNE (F.g3): dmg 130 → 100 (tier-rule offender at T2); Burn 2 stays — the Burn setup for Cataclysm Decree
- **Kiss of Decay** `raceKissOfDecay` T3 · rung demon princess#3 — RECOST (F.g3): rng 2 → 3 · RETUNE (F.g3): dmg 100 → 125, Poison 2 → 3; drain 40% and the Poison ×1.5 finisher stay. Now a real T3 (T3 single ≈125–135)
- **Cataclysm Decree** `raceCataclysmDecree` T4 · rung overlord#4 — RECOST (F§): RECOST 2 AP → 1 AP (Star Decree is the same shell at 1 AP; the lava is the difference, not an AP).
- **Dark Dominion** `raceDarkDominion` T4 · rung demon prince#4 — RETIER T4→T3 (★): T4 → T3 (75 MP), dmg → 135; keeps the Burn + Stagger finisher; aoe r1 [Q1: one T4 per family — applies only if mondo keeps 4 tiers] · RETUNE (F.g3): dmg 170 → 160 (house T4 area)
- **Dark Lullaby** `raceDarkLullaby` T4 · rung demon princess#4 — RETIER T4→T3 (F.g3): T4 → T3 (75MP): a 3×3 Silence at T3 is the court's control tool, not a third nuke · RETUNE (F.g3): dmg 160 → 125; Silence 1 + finisher Silence ×1.5 unchanged

**Insectoid Anatomy** `insectoid`
- **Venom Fang** `raceVenomFang` T1 · rung voidweaver#1, bee queen#1 — REWRITE (F.g6): 100 physical, rng 1, applies Poison 3; finisher ×1.5 vs POISONED (was vs Rooted), no statusFirst (the first bite envenoms, the second "goes deep"). Self-contained for every owner; also pays off Infectious Bite / Sting / Corrosive Splash. Desc: "A second bite on an envenomed target finds the vein."
- **Chitin Armor** `raceChitinArmor` T2 · rung mantid#2, bee queen#2 — PASSIVE (F.g6): becomes the family passive "Chitin Armor" (T2, 2 SP): "A shell that does not flinch: +8 DEF, immune to Stagger." (was self DEF +1 stage, the 4th copy at T2/50 MP). Rung fix is CONDITIONAL: only "if a RACE_TREE rung cannot be a …
- **Tunnel Network** `raceTunnelNetwork` T3 · rung antperson#3 — REWRITE (F.g6): range 3 → 4; new desc: "Dig a tunnel: one mouth beside you, one where you point (within 4). An ally standing at either mouth attacks and casts as if it stood at the other — range and line of sight from the far mouth. One tunnel per caster; three hits collapse both mouths." (mechanics already exist for door pairs; desc + range … · DESC (F§): Placeholder text ("Deploys a linked pair of objects.") on a real mechanic: write it (a two-ended tunnel).
- **Swarm Signal** `raceSwarmSignal` T4 · rung antperson#4, bee queen#4 — REWRITE (F.g6): keep ATK +2 stages for allies within 2, add +1 MOV for 2 rounds (the swarm closes); fix the desc to say +2. Desc: "The signal goes out. Everything with legs comes running." · DESC (F§): Desc must say +2 ATK / +1 DEF (it says +1).

**Jellyfish** `jellyfish`
- **Sting** `raceJellySting` T1 · rung jellyfish#1 — REWRITE (F.g6): 90 water magic (was 80), rng 2, Poison 2, finisher ×1.5 vs WET. Desc: "A tentacle brushes past. The venom runs faster through soaked skin." Bloom → Sting self-contained. SKEPTIC: the resolver reads the Wet STATUS only — the "standing in water counts" half needs bonusVsStatus to call _unitIsSoaked (engine).
- **Bloom** `raceJellyBloom` T2 · rung jellyfish#2 — RETUNE (F.g6): dmg 70 → 100 (T2 area scale), keep 3×3 / rng 3 / Wet 2.
- **Ocean Current** `raceJellyDrift` T2 · rung jellyfish#2 — MOVE → Jellyfish (F.g6): deepsea → jellyfish (jellyfish id + desc; jellyfish rung 2 alt stays legal; Deep Sea keeps Deep Dive as its one T2 movement).
- **Nematocyst Net** `raceJellyNet` T3 · rung jellyfish#3 — RETUNE (F.g6): dmg 95 → 125 (T3 scale), keep rng 3 / Rooted 2.

**Kaiju Rampage** `kaiju`
- **Cataclysm Stomp** `raceCataclysmStomp` T1 · rung kaiju#1 — RETIER T1→T2 (F.g5): T1 → T2 (50 MP), keep 2 AP, r2 (5×5), 100 dmg, Stagger 1, deform −2/−1. Kaiju rung 2 → raceCataclysmStomp (replaces the moved Seismic Leap; its old rung 1 goes to Car Toss).
- **Atomic Breath** `raceAtomicBreath` T4 · rung kaiju#4 — RETYPE (F.g5): -/magic → fire/physical (part of the REWRITE). · REWRITE (F.g5): element fire, damageType PHYSICAL (kaiju absorbs fire, so no self-harm), 160 line w1 rng 5, finisher stagger ×1.5. Scales off the 100 ATK (kaiju INT 25).

**Ki Energy** `ki`
- **Ki Volley** `raceKiBlast` T1 · rung ki fighter#1 — RETYPE (F.g7): light/magic → light/physical — part of the REWRITE. · REWRITE (F.g7): damageType physical (element light, ranged), 3 × 33 = 100 [sic: 3 × 33 = 99] (was 3 × 45 = 135 magic), rng 4, T1 25 MP 1 AP.
- **Ki Charge** `raceKiCharge` T2 · rung ki fighter#2 — REWRITE (F.g7): T2 50 MP 1 AP — self ATK +1 stage AND a 96-point ki barrier (shield: 96, Fortify's number). "Breathe in. Hold."
- **Ki Wave** `raceKiWave` T2 · rung ki fighter#2 — RETYPE (F.g7): light/magic → light/physical — part of the REWRITE. · REWRITE (F.g7): damageType physical (light), line 110 (was 135 magic), rng 5, T2 50 MP 1 AP (was 2 AP).

**Knighthood** `knight`
- **Oath of Valor** `raceOathOfValor` T3 · rung knight#3 — REWRITE (F.g2): T3 75MP 1AP aura r2: allies within 2 gain +1 ATK AND +1 DEF stage (was ATK only = Royal Decree at triple price). Royal Decree stays the cheap ATK-only one.
- **Crusade** `raceCrusade` T4 · rung knight#4 — RETYPE (F.g2): damageType magic -> physical (knight INT 29, Arthur INT 28). · REWRITE (F.g2): T4: self-centred cross r2 (aoeOriginSelf, rng 0; was cast from rng 4), 160, 2AP -> 1AP, +60 vs Unholy, MP pinned 75 (was 100; knight has 95, Arthur 80). 'Deus vult' is a charge through the line.

**Light** `light`
- **Aurora Ray** `raceAuroraRay` T1 · rung nordic#1, orb of light#1, deep sea fish#1 — RETUNE (F.g1): 3x3 dmg 100 -> 80 (T1 area house).
- **Smite** `raceSmite` T1 · rung priest#3, nun#1 — RECOST (F.g1): rng 3 -> 4 (parity with Radiant Bolt, which should go). · DESC (F§): Write the unholy-bonus sentence on the survivor (§1 O deletes Radiant Bolt, whose live unholyBonus 40 was also unwritten).
- **Luminous Shield** `raceLuminousShield` T2 · rung orb of light#2 — RETIER T2→T3 (F.g1): T2 -> T3, 50MP -> 75MP (area change in the RETUNE record). · RETUNE (F.g1): area r0 -> r1: a 3x3 of allies, shield 140 each - now the group shield.
- **Prism Burst** `racePrismBurst` T3 · rung orb of light#3 — RETYPE (F.g1): element blank -> light.
- **Judgment** `judgment` T4 — RETIER T4→T3 (★): T4 → T3 (75 MP), dmg → 135; magic per F.g1; keeps cross r3 and the Slow finisher [Q1: one T4 per family — applies only if mondo keeps 4 tiers] · RECOST (F.g1): add CD2 so the desc's 'Cooldown: 2 rounds' is true. · RETYPE (F.g1): damageType physical -> magic (light/magic): physical was dead on 6 of 8 owners (priest/nun/seraphim/angel/orb ATK 8, nordic 22). rng 1 cross r3 stays.
- **Merkaba** `raceMerkaba` T4 · rung seraphim#4 — RECOST (F§): RECOST all four 2 AP → 1 AP. A finisher is a rider, not a second AP.

**Lightning Magic** `lightning`
- **Summon Thunderstorm** `thunderstorm` T2 · rung mothman#2 — DESC (F.g1): Row is opaque. New desc: 'Summons a thunderstorm for 3 rounds: at the end of each round a bolt strikes one random visible enemy for 40 lightning damage, preferring Wet targets; flyers in the storm are grounded.' CONDITIONAL: if …
- **Thunderbolt** `thunder1` T2 — REWRITE (F.g1): T2 50MP 1AP, 130 magic single; rng 3 -> 4; REMOVE chainProfile [125,82,50] (the chain moves to NEW Chain Lightning); add finisher Wet x1.5. Desc: 'One bolt, one target. MEDIUM magic damage — a Wet target lights up for half again.' · REWRITE (★): ★ WITHOUT F.g1's Wet ×1.5 finisher: lightning already deals ×1.5 to a Soaked target through the live elemental combo layer, so the finisher would make it ×2.25. The rest of F.g1's rewrite stands (rng 4; the chain moves to the NEW Chain Lightning; desc) · DESC (F§): Thunderbolt's chain must be in the desc (it reads as a plain bolt).

**Living Stone** `livingstone`
- **Gothic Rampart** `raceGothicRampart` T2 · rung gargoyle#2 — DELETE (F.g5): Rampart (earth T4, 3 tiles) covers it; all three races own Earth.

**Machinery** `machinery`
- **Synthetic Punch** `raceHydraulicPunch` T1 · rung cyborg#1 — MOVE → Machinery (F.g4): row unchanged (T1 25MP 1AP, 100 physical, rng 1, push 2, finisher Jammed ×1.5); the melee Jammed payoff lives on the Machinery shelf; cyborg does not own Machinery · RENAME → "Hydraulic Punch" (F.g4): "Synthetic Punch" → "Hydraulic Punch" (the id already says so)
- **Hydraulic Crush** `raceHydraulicCrush` T3 · rung robot#3 — REWRITE (F.g4): merge target: Hydraulic Crush = T3 75MP 1AP, 135 metal/physical, rng 1, single, finisher Jammed OR Stagger ×1.5 (bonusVsStatus.status array — engine-supported, battle.js bonusStatusMatches)

**Main Character Energy** `maincharacter`
- **Dark Feather** `raceDarkFeather` T1 · rung chosen one#1 — REWRITE (F.g9): T1 25 MP, 2 AP → 1 AP, dash, 100 physical, rng 3, Poison 3 → Stagger 1. Desc line: "One black feather falls. Then he is already there." Ram Charge (T1 dash 100 + Stagger) is the twin; the setup for Roll Credits. chosen one rung 1.
- **Sad Backstory** `raceSadBackstory` T1 · rung swordfighter#1 — REWRITE (F§): REWRITE INTO "conditional surge": ATK+1, and ATK+2 instead while the caster is under 50% HP (needs a small stageIfBelowPct patch; nearest live hook is the passive lowHpBonus object). Keeps T1.
- **Plot Armor** `racePlotArmor` T2 · rung swordfighter#2, chosen one#2 — REWRITE (F.g9): T2 50 MP 1 AP, add CD 3 — self DEF +1 (fifth DEF +1 clone) → self Indomitable 1 ("the next killing blow leaves this unit at 1 HP"). Indomitable Will (T4, 3 rounds, humangrit) is the bigger version. swordfighter / chosen one rung 2.
- **Prophecy Fulfilled** `raceProphecyFulfilled` T3 · rung chosen one#3 — REWRITE (F.g9): T3 75 MP, 2 AP → 1 AP, add CD 2 — self Overclock 1 → Overclock 2 rounds AND cleanse every debuff. Desc line: "It was written. Everything written before it is struck out." chosen one rung 3.
- **To Be Continued** `raceToBeContinued` T3 · rung swordfighter#3 — REWRITE (F.g9): Set requireVision: true (row has false) so the row matches its text ("only while your team can still see them"); desc unchanged. swordfighter rung 3.
- **Blessed Blade** `raceBlessedBlade` T4 · rung swordfighter#4 — MOVE → Main Character Energy (F.g7): swordsmanship → maincharacter (fills its missing T4; swordfighter keeps it as its T4 rung through that family; skeleton stops carrying a light-element blade). · RETIER T4→T3 (★): T4 → T3 (75 MP), dmg → 135; moves to Main Character per F.g7; keeps r1 rng 1 [Q1: one T4 per family — applies only if mondo keeps 4 tiers] · DESC (F.g7): current desc is the stock "Deals HEAVY physical damage to All Enemies in an AOE." — give it a line of plot-armour flavour text when it lands (text not written by the section).

**Marksmanship** `marksmanship`
- **Long Rifle** `raceQuickDraw` T3 · rung cowboy#3 — MOVE → Marksmanship (F.g8): Long Rifle huntingskills → marksmanship (also stated in Hunting Skills Changes: "MOVE raceQuickDraw → marksmanship (above)"). It is a marksmanship spell wearing a hunting badge and duplicated Precision Shot's role at T3. The id … · RETIER T3→T2 (F.g8): T3 → T2 (50 MP). · RETUNE (F.g8): dmg 125 → 110 (110 sits at the T2 single bar beside Sword Beam 100). Desc: "Shoulder the long rifle. Deals MEDIUM physical damage to a Single Enemy up to 5 tiles away." Stays physical single rng 5.
- **Take Aim** `headshot` T4 — REWRITE (F.g8): bonusVsStatus { status: ['stun', 'root'], mult: 1.5 } (was Stun only) — the family's own Kneecap Shot (Root 1) now feeds its capstone; the stun hook stays for police/politician teammates. Rest unchanged: T4 180 physical rng 5, ignores DEF, lands at end of round while visible, executes ≤15% HP.

**Martial Arts** `martialarts`
- **Flurry of Blows** `raceFlurryOfBlows` T1 · rung ki fighter#1 — RETUNE (F.g7): hits 4 × 33 = 132 → 4 × 25 = 100 at T1.
- **Haymaker** `haymaker` T1 — REWRITE (F.g7): 100 physical, rng 1, push 1 sideways, collision +40, finisher ×1.5 vs Stagger (was vs Root). Stagger setters: Sentai's Yellow Thunder, luchador's Mic Drop today; Body Check only after the Dirty Fighting rewrite; the new Roundhouse sets it for all three races.
- **A Really Good Punch** `reallyGoodPunch` T4 — DELETE (F.g7): T4 pinned at 25 MP (off-ladder joke row, best dmg/MP, nobody's rung); Dragon Fist covers the T4 hit; the T3 slot goes to a real move.
- **Dragon Fist** `raceDragonFist` T4 · rung ki fighter#4 — REWRITE (F.g7): 180 fire/physical, rng 2, 100 MP 1 AP, finisher ×1.5 vs Stun — pays off Pressure Point (270 on a stunned target).

**Mech Pilot Skills** `mecha`
- **Mortar Salvo** `raceMortarSalvo` T1 · rung mech#1 — RETUNE (F.g4): 100 → 80 (T1 area house ≈80); keep ignoresLineOfSight (the through-cover is the point)
- **Siege Mode** `raceSiegeMode` T2 · rung mech#2 — REWRITE (F.g4): self, 50MP 1AP: for 3 rounds +1 ATK stage, +2 RNG, −2 MOV (a real lock-down, the same shape as Sedan's Transform). "Anchors down. Everything in range is a target." (was a plain self ATK+1)
- **Eject!** `raceEject` T3 · rung mech#3 — REWRITE (F.g4): T3, 75MP: teleport 3 away + cleanse 99 + heal 20% max HP ("the frame auto-repairs while the pilot is out"). A T3 escape-and-reset, the sustain mech lacks

**Meditation** `meditation`
- **Cleanse** `cleanse` T2 · rung hippie#2 — RENAME → "Inner Peace" (F.g2): 'Cleanse' -> 'Inner Peace'. · REWRITE (F.g2): T2 50MP 1AP rng 3 single ally: removes every debuff AND +1 M DEF stage (the cleanse that also hardens the mind). Hippie rung 2 keeps the id.

**Military Combat** `militarysupport`
- **Rally Command** `raceRallyCommand` T1 · rung general#1 — RECOST (F.g8): 2 AP → 1 AP (25 MP). Comparable: Royal Decree (camelot T1, identical at 1 AP).
- **Iron Bulwark** `raceIronBulwark` T2 · rung general#2 — REWRITE (F.g8): T2 50 MP: self DEF +1 → aura r2 warCry, DEF +1 stage AND M.DEF +1 stage to all allies within 2. Desc: "Shields up. Every ally within 2 tiles gains +1 DEF and +1 M.DEF stage." (No longer one of four identical self-DEF rows.) general rung 2.
- **Artillery Strike** `raceArtilleryStrike` T3 · rung general#3 — REWRITE (F.g8): Immediate, not delayed: drop delayTurns (kind delayed → an immediate area; new kind not named), add ignoresLineOfSight: true, dmg 135 → 125, 2 AP → 1 AP, aoe r1 rng 6, keep scorched + deform (T3 75 MP). Desc: "Fire mission, danger close. MEDIUM physical damage to every enemy in a 3×3 up to 6 tiles away, over any cover. Leaves …
- **Iron Dome** `shieldBash` T3 — REWRITE (F.g8): Iron Dome (T3 75 MP): role heal/healAll with heal 0 → role effect, kind aoeShield, self-centred aoe r2, shieldHp 160 on every ally inside (Tinker's Contraption's plumbing); drop the heal and the DEF stage. Desc: "Iron Dome up. Every ally within 2 tiles gets a 160-point shield." Fortify T1 single 96 → Iron Dome T3 team shield.
- **Rangefinder** `raceRangefinder` T3 · rung marksman#3 — RETIER T3→T2 (F.g8): T3 → T2 (50 MP) — vision for 75 MP is worth a T2 at most (Signal Flare is a 1-SP passive that reveals an area). "Marksman's rung stays inside the family."
- **Fire for Effect** `raceFireForEffect` T4 · rung marksman#4 — KEEP (F.g8): kept: the owning family section points a rung at it

**Mothman** `mothman`
- **Prophecy of Disaster** `raceProphecyOfDisaster` T4 · rung mothman#4 — RETUNE (F.g5): dmg 140 → 160 (T4 area scale; Quake / Cataclysm Decree are 160).

**Nature Magic** `nature`
- **Herbal Remedy** `raceHerbalRemedy` T1 · rung shaman#1, mushroom girl#1 — DESC (F§): desc must mention the cleanse (cleanse 2).
- **Treeline Retreat** `raceTreelineRetreat` T2 · rung bigfoot#2 — RENAME → "Into the Green" (F.g1): 'Treeline Retreat' -> 'Into the Green' (text was bigfoot-specific). · DESC (F.g1): Generic desc, same numbers: 'Step back into the undergrowth. Teleport 3 tiles and Regen for 2 rounds.'
- **Trunk Throw** `trunkThrow` T3 · rung bigfoot#3, tree person#3 — RETIER T3→T2 (F.g1): T3 -> T2, 75MP -> 50MP; keep 100 base (Green Thumb +30/tree stays the build-around). Rung n sits at tier n, so it leaves rung 3 and becomes a rung-2 alt.

**Necromancy** `necromancy`
- **Bone Barrage** `raceBoneBarrage` T3 · rung skeleton#3, necromancer#3 — MOVE → Necromancy (F.g3): Bone Density T3 (125 magic aoe r1 rng 4, DEF −1) becomes Necromancy's T3, numbers unchanged: a caster row the necromancer runs as his T3 rung (stays valid) and the skeleton (INT 42, ATK 70) cannot use; conjured bone shards are …

**Ooze Biology** `ooze`
- **Mitosis** `raceMitosisSplit` T4 · rung black goo#4 — REWRITE (F.g6): T4 deploy/summonUnit (was effect/buff self Regen 2), poison, 100 MP / 1 AP, rng 1, single tile, maxActivePerCaster: 1, summonDef: { key: 'blob', name: 'Blob', move: 3, dmg: 70, hits: 4, armored: true }. Desc: "Two of it now. Containment will want to know." The ooze trail (tile it stands on turns to ooze) needs a new …

**Piracy** `piracy`
- **Plunder** `racePlunder` T1 · rung pirate#1 — REWRITE (F.g7): 100 physical (was 70), rng 1, keep the steal (a T1 hit in PvP, a heist in story).
- **Walk the Plank** `raceWalkThePlank` T2 — RECOST (F.g7): apCost 2 → 1 (T2 50 MP; 90 dmg, 1-tile deep water, execute below 25% stay).
- **Cannonball** `raceCannonball` T4 · rung pirate#4 — RETUNE (F.g7): dmg 170 → 160 (T4 area scale; Meteor is 160).

**Poison Abilities** `poison`
- **Splash** `raceSplash` T3 · rung black goo#3, bee queen#3, mushroom girl#3 — RETIER T3→T2 (F.g1): T3 -> T2, 75MP -> 50MP, 2AP -> 1AP; keep 60, Goo 2, ooze 3 rounds. Leaves rung 3 (new Rot takes it) and becomes the rung-2 alt for bee queen and mushroom girl.

**Police Training** `policetraining`
- **Cuffed** `racePoliceCuffs` T3 · rung police officer#3, sheriff#3 — REWRITE (F.g8): dmg 60 → 100, statuses Root 2 + Stagger 1 (was Root 2). Stays T3 75 MP rng 1. Desc: "Hands behind your back. MEDIUM physical damage to an adjacent enemy, Rooted for 2 rounds and Staggered — they are not going anywhere and they are not doing anything about it."
- **Lockdown** `racePoliceLockdown` T4 · rung police officer#4 — REWRITE (F.g8): dmg 120 → 150, statuses Root 1 then Slow 2 (both entries; was Slow 2). Stays T4 aoe r1 rng 3. Desc: "Nobody in, nobody out. The block is cordoned: HEAVY physical damage to every enemy in a 3×3 within 3 tiles; they are Rooted for a round and Slowed for 2 after."

**Politics** `politics`
- **Filibuster** `raceFilibuster` T1 · rung politician#1 — RETIER T1→T2 (F§): RETIER → T2 (Silence is a T3-grade status; a zone of it at T1 is the cheapest lockout in the rack).
- **Executive Order** `raceExecutiveOrder` T3 · rung politician#3 — REWRITE (F.g8): T3 75 MP, 2 AP → 1 AP, add CD 2: single rng 4 → aoe r1 rng 4, every enemy in the 3×3 Stunned 1 round, no damage. Desc: "Signed, sealed, effective immediately. Every enemy in a 3×3 within 4 tiles is Stunned for a round." Comparable: Fluoride Water (T3 area Silence 2 with damage). politician rung 3.
- **Nuke** `sharedNuke` T4 · rung mech#4, general#4, politician#4 — MOVE → Politics (F.g8): Nuke militarysupport → politics (renamed Nuclear Option and rewritten in the Politics block). General and mech 4th rung → raceFireForEffect (RETIER-free: already T4, already in militarysupport). The politician's rung 4 … · RENAME → "Nuclear Option" (F.g8): "Nuke" → "Nuclear Option" (stated in Military Combat and Politics). · REWRITE (F.g8): dmg 160 → 180, delayTurns 1 → 2 (the launch takes a round longer than a fire mission); keep aoe r2 rng 5, 2 AP, destroys buildings, scorched, deform −3, CD 2. Desc: "The football is open. Mark the grid; two rounds later there is no grid. HEAVY magic damage to everything in a 5×5, buildings included. Cooldown 2." The …

**Poltergeist Abilities** `haunted`
- **Cold Spot** `raceColdSpot` T2 · rung ghost#2, jack o lantern#2 — DESC (F§): Placeholder text ("Creates a hostile zone that weakens enemies inside") on a real mechanic: write it (a Frozen zone).

**Psychedelics** `psychadelic`
- **Ayahuasca Retreat** `raceAyahuascaRetreat` T3 · rung shaman#3, hippie#3 — MOVE → Psychedelics (F.g1): -> psychadelic (Drug Use); becomes that family's T3 (tier unchanged). Shaman/hippie rung 3 stay valid (both own Drug Use). · DESC (F§): Reverse lie: desc does not mention the cleanse (cleanse: 99); write it (Immortal Cycle `raceJellyRebirth` "cleanses 2 debuffs" is the model text).
- **Bad Trip** `raceBadTrip` T4 · rung shaman#4 — RETIER T4→T3 (F.g2): T4 -> T3, 100MP -> 75MP (1AP, rng 3). Shaman rungs -> [raceHerbalRemedy, raceSpiritWalk, [raceAyahuascaRetreat, raceBadTrip], sharedEgoDeath]. · RETUNE (F.g2): dmg 180 -> 125; Slow 1 and finisher slow/voodoo x1.5 stay. The T3 that pays off Dosed and any teammate Slow.

**Psychic Abilities** `psychic`
- **Psychic Beam** `racePsychicBeam` T1 · rung occulus#1 — RECOST (F.g9): rng 5 → 4 (same bullet as the dmg cut). · RETUNE (F.g9): dmg 100 → 80 (keep Discord 1, T1 25 MP): one 80 pass with a rider is the T1 line weight (Sonic Boomerang's 80 buys a second pass instead). "Psychic Beam should NOT take Empowered until it is re-costed as above" — no block once …
- **Psychic Barrier** `racePsychicBarrier` T2 · rung telepath#2 — RETUNE (F.g9): Ally shield 150 → 200 (Light Shield, the other T2 shield row, gives 220 + DEF +1 for the same 50 MP). telepath rung 2.
- **Psychosis** `psychosis` T2 — REWRITE (F.g9): T2 50 MP 1 AP, rng 4, single — Discord 2 AND M.DEF −1 stage (was M.DEF −1 only). Desc line: "Two voices, then four, then all of them." Now the in-family setup for Migraine (Discord ×1.5); Brainwash (T3 Discord 2) and Discordance (T1 Discord 2) show T2 is the rung for Discord-plus-a-stat.
- **Teleport** `teleport` T3 — DESC (F.g9): Desc only: drop "Costs 1 less MP for Psychics" → "Third Eye trims its cost." (jobs are gone; the live discount is the Third Eye row's teleportMpDiscount hook). Row unchanged.
- **Migraine** `raceMindCrush` T4 · rung telepath#4, chosen one#4 — RETIER T4→T3 (★): T4 → T3 (75 MP), dmg → 135; keeps its M ATK −1 strip [Q1: one T4 per family — applies only if mondo keeps 4 tiers]
- **Mind Shatter** `mindShatter` T4 — REWRITE (F.g9): T4 100 MP 1 AP, rng 3: single → aoe r1 (3×3), dmg 180 → 160 psychic magic to all enemies, Silence 1 on each; keep finisher Silence ×1.5. The family's area nuke (comparable: Reality Pulse T4 170 aoe r1 + Discord, 1 AP). Migraine stays the single-target T4.

**Robotic Hardware** `robot`
- **Self-Repair Protocol** `raceSelfRepairProtocol` T2 · rung android#2 — RETUNE (F.g4): self heal 35% → 45%, cleanse 1 → 2 · DESC (F§): Reverse lie: desc does not mention the cleanse (cleanse: 1); write it (Immortal Cycle `raceJellyRebirth` "cleanses 2 debuffs" is the model text).
- **Robo Punch** `raceRoboPunch` T3 · rung honda civic#3 — MERGE → Hydraulic Crush (F.g4): Robo Punch (T3 135 rng 1, Stagger finisher) folds into Hydraulic Crush; the section also writes "DELETE raceRoboPunch from robot" (same act). Robot rung 3 unchanged (raceHydraulicCrush). Android / droid / cyborg lose Robo Punch …
- **Kill Mode** `raceChassisSlam` T4 · rung robot#4 — RETIER T4→T3 (★): T4 → T3 (75 MP), dmg → 125; keeps F.g4's rewrite: self-area r2, Stagger 1 on everything hit, 1 AP, CD 2 [Q1: one T4 per family — applies only if mondo keeps 4 tiers] · REWRITE (F.g4): Kill Mode (stays in robot): T4 100MP 1AP (was 2) CD2 (was 0), rng 0, self-aoe r2, 160 metal/physical, Stagger 1 on everything hit — mirror of EMP Burst (physical + Stagger for robot/cyborg/civic; magic + Jammed for android/droid). Sets up Hydraulic Crush

**Robotic Weapons** `cyberpunkweapons`
- **Taser Bolt** `raceTaserBolt` T1 — REWRITE (F.g4): T1 25MP rng 3: 70 lightning/magic (was 80) + Jammed 1; drop the Jammed ×1.5 finisher. "Two prongs into the housing. Systems stutter." 1AP setup for Synthetic Blade / Hydraulic Punch / Hydraulic Crush / Railgun. NOTE stays magic although the section's own Problem says 80 magic "does nothing for 3 of 4 owners" (robot INT 3, mech …
- **Plasma Cannon** `racePlasmaCannon` T3 · rung cyborg#3 — RETUNE (F.g4): 130 → 125 for the 2-wide line (T3 area house 125; the only w2 line at T3)
- **To the Moon** `raceRocketToss` T4 · rung cyborg#4 — REWRITE (F.g4): To the Moon: remove requiresFlight — the caster's own rockets carry them (carryHeight 6 stays); 150 + fall + collision 50, rng 1, 100MP 1AP. Cyborg's rung 4 castable on the ground

**Ropework** `ropework`
- **Grapple** `raceGrapple` T1 — REWRITE (F.g7): T1 utility, 25 MP 1 AP, rng 3, no damage — hook a wall, a standing door or an ALLY within 3 and pull YOURSELF to the tile beside it (self-pull only; the enemy pull and the hit are dropped — Lasso owns the enemy pull). Grapple = my position, Lasso = theirs.

**Sasquatch Abilties** `sasquatch`
- **Big Kick** `raceBigKick` T1 · rung bigfoot#1 — REWRITE (F.g5): 100 dmg, push 2 (was 120, no rider; a kick should kick). Same tier and cost.
- **Sasquatch Smash** `raceSasquatchSmash` T4 · rung bigfoot#4 — RECOST (F.g5): 2 AP → 1 AP (keep 180, 100 MP, finisher stagger ×1.5). Same shape, same AP as Colossal Crush (recost to 1 AP) and Jurassic Jaw.

**Scarecrow Abilities** `scarecrow`
- **Stuffed Double** `raceStuffedDouble` T2 · rung scarecrow#2 — REWRITE (F.g1): Straw decoy on an adjacent tile for 2 rounds (hp 1): enemies within 2 tiles of it are Taunted 2 (must target the decoy if able, while it stands); when it is destroyed every enemy adjacent to it is Feared 1. Desc: 'A second scarecrow, stuffed in a hurry. Anything nearby goes for the wrong one — and when the straw comes apart, … · DESC (F§): REWRITE the desc: it is a decoy that draws melee and ranged attacks — the row says so, the text ("Deploys an object on an empty tile.") does not.
- **Crow Storm** `raceCrowStorm` T4 · rung scarecrow#4 — RETYPE (F.g1): element blank -> shadow.

**Seduction** `seduction`
- **Love Bite** `raceLoveBite` T1 · rung catgirl#1 — RETUNE (F.g9): dmg 80 → 100 (the T1 hit-plus-DEF −1 rows — Synthetic Blade, Valkyrie Spear — are 100). catgirl rung 1.
- **Soul Suck** `raceSoulSuck` T1 · rung succubus#1 — REWRITE (F.g9): Drop the Charm status; 100 magic rng 2, drainPct 0.6 → 0.5, finisher Charm ×1.5 (T1 25 MP). Desc line: "Kiss them and take what they came with." The T1 payoff of the chain instead of a second setup (it dominated the T2 Charm). succubus rung 1.
- **Charm** `raceCharm` T2 · rung succubus#2 — REWRITE (F.g9): T2 50 MP 1 AP, CD 0 → 2, rng 3 — Charm 1 → Charm 2 rounds. Same weight as The Kool-Aid (T2, Charm 2, CD2); the family's one setup. succubus rung 2.
- **Enthrall** `raceEnthrall` T3 · rung succubus#3 — RECOST (F.g9): Add CD 3 (parity with Possession / Indoctrinate). succubus rung 3 (pair with Sleep Paralysis).
- **Draining Embrace** `raceDrainingEmbrace` T4 · rung succubus#4, barbarella#4 — RECOST (F.g9): apCost 2 → 1, rng 1 → 2 (keep 180, drain 0.6, finisher Charm ×1.5). succubus / barbarella rung 4.

**Sentai Colors** `sentai`
- **Blue Wave** `sentaiBlueWave` T2 — RETIER T2→T3 (F.g9): T2 → T3 (75 MP) — it was a tier offender (120 with a rider below T3). Nobody's rung. · RETUNE (F.g9): dmg 120 → 125 at the new T3, keep Slow 1 (line rng 4).
- **Pink Healing** `sentaiPinkHeal` T2 · rung super sentai#2 — RETIER T2→T1 (F.g9): T2 → T1 (25 MP), heal 140 unchanged (heals exactly what Divine Light heals at T1/25 MP).
- **Yellow Thunder** `sentaiYellowThunder` T2 — RETUNE (F.g9): dmg 80 → 100 (80 was the T1 area number; stays T2 aoe r1 rng 3 Stagger 1).

**Shadow** `shadow`
- **Shadow Crush** `raceShadowBind` T1 · rung shadow entity#1 — RETYPE (F.g1): element blank -> shadow.
- **Grim Resolve** `raceGrimResolve` T2 — DELETE (F.g1): 7th identical self '+1 ATK' row; no race uses it as a rung; Inner Demon / Hellfire Crown cover demons.
- **Shadow Infiltration** `raceShadowInfiltration` T2 — REWRITE (F.g1): T2 50MP; 2AP -> 1AP; dash to the target, 120 -> 110 physical, then the caster is Invisible 1 (hit and fade). Drop Poison 3.
- **Phase Shift** `racePhaseShift` T3 · rung shadow entity#3 — RETIER T3→T2 (F.g1): T3 -> T2, 75MP -> 50MP, keep CD2 (parity with Blurry Photo). · RETUNE (F.g1): Invisible 1 -> 2 rounds.
- **Shadow Step** `raceShadowStep` T3 · rung halfdemon#3 — RETIER T3→T2 (F§): RETIER → T2 (ignores LoS is worth one tier over Mirror Blink, not two).
- **Void Rush** `voidRush` T4 · rung shadow entity#4 — RETIER T4→T3 (★): T4 → T3 (75 MP), dmg → 135; keeps the teleport strike and takes synergy's Feared ×1.5 finisher [Q1: one T4 per family — applies only if mondo keeps 4 tiers] · RETYPE (F.g1): element arcane -> shadow.

**Sonic** `sonic`
- **Siren Song** `raceSirenSong` T1 · rung mermaid#1 — RETYPE (F.g1): element blank -> sonic.
- **Sonic Boomerang** `raceSonicBoomerang` T1 · rung siren#1 — RETUNE (F§): (section: RECOST) 80 → 50 per pass (100 total per enemy; boomerang hits out and back) — "or T2" (alternative; §2 picks T1 at 50 per pass). · DESC (F.g1): Row has no return/multiHit field (damage/line, 80, rng 4, line w1), so the return hit is not real. New desc: 'Hurl a scything crescent of sound down a line. WEAK magic damage to every enemy in its path.' Numbers unchanged (T1, …
- **Sonic Breaker** `raceSonicBreaker` T2 — RETUNE (F.g1): line dmg 120 -> 100 (Water Pulse is 100).
- **War Cry** `warCry` T2 — RENAME → "Anthem" (F.g1): 'War Cry' -> 'Anthem'. · RETIER T2→T3 (F.g1): T2 -> T3, 50MP -> 75MP; same numbers (aura r3, allies +2 ATK stages, self +1) - the tier now matches them (Swarm Signal does it at T4). · DESC (F.g1): Job-era text replaced: 'Every ally within 3 tiles sings along: +2 ATK stages. The singer takes +1.' (same numbers)
- **Lullaby** `lullaby` T3 — RETIER T3→T2 (F.g1): T3 -> T2, 75MP -> 50MP. · REWRITE (F.g1): dmg 130 -> 110, status Slow 2 -> Stun 1 (sleep), rng 4. Desc: 'Hush. MEDIUM magic damage and the target sleeps through its next activation.' Crescendo's '+1 range' line still applies.
- **Resonance Pulse** `raceResonancePulse` T3 — RETUNE (F.g1): self cross r2 dmg 135 -> 125.
- **Requiem** `requiem` T4 — RECOST (F.g1): 1AP -> 2AP. · RETUNE (F.g1): self-aoe r4 (a 9x9) -> r3.

**Spy Gear** `spygear`
- **Knife Throw** `knifeThrow` T1 — DESC (F.g8): Desc: "A knife from the sleeve. MEDIUM physical damage to a Single Enemy within 4 and Marks them: the next physical hit any ally lands deals +24 and they cannot hide." Strip the dead equipReq field. The Mark stays 24 (a T1 mark …
- **EMP Grenade** `raceEMPGrenade` T2 — RETIER T2→T3 (F.g8): T2 → T3; its pinned 75 MP becomes the ladder cost (100 area + Jammed 2 with two T4 payoffs for the MIB — Classified Weapon, Railgun). Nobody's rung. The family then reads T3 EMP Grenade + Poison Dart.
- **Poison Dart** `poisonDart` T3 — RETIER T3→T2 (F§): RETIER → T2 — a T3 whose only payload is the T1 status. · RECOST (F§): rng 3 → 4. · RETUNE (F§): 125 → 110 + poison 3.
- **Sneak Slash** `sneakSlash` T4 — REWRITE (F.g8): Strip the dead equipReq field; desc unchanged; mechanics unchanged (the section's verb is REWRITE — it is a dead-field strip only).

**Stage Presence** `stagepresence`
- **Provoke** `provoke` T2 — MOVE → Stage Presence (F.g1): -> stagepresence: a tank taunt on three glass supports (no rung uses it); luchador/clown/ringmaster own Stage Presence (g9 moves bunny girl off it) and on a bruiser a taunt is a tool. Popstar also owns Stage Presence so keeps … · RENAME → "Call Out" (F.g1): 'Provoke' -> 'Call Out'.
- **Stage Dive** `racePopStageDive` T2 · rung popstar#2, luchador#2 — RETUNE (F.g9): dmg 90 → 100 (T2 single scale). popstar / luchador rung 2.
- **Spotlight** `racePopSpotlight` T3 · rung popstar#3, bunny girl#3 — REWRITE (F.g9): T3 75 MP 1 AP CD2, rng 3 — DEF −1, M.DEF −1 AND Marked 2 ("the next hit against this unit consumes the mark for bonus damage"): the team's focus-fire call.
- **Space Disco** `raceSpaceDisco` T4 — RENAME → "Crowd Surge" (F.g9): "Space Disco" → "Crowd Surge" (RENAME + RETIER + REWRITE in one bullet). · RETIER T4→T3 (F.g9): T4 → T3 at 75 MP (it already cost T3 MP at T4). Nobody's rung. · REWRITE (F.g9): T3 75 MP 1 AP, CD 2 → no CD, damageEffect/aoePull (was barrage), element none → sonic/magic, self-aoe r2, dmg 160 → 110, pullToCenter (every enemy within 2 dragged 1 tile toward the caster), Stagger 1. Drops the Discord and the Stun finisher. Desc line: "The crowd rushes the stage, and the stage is you." Gravity Well (T1 80 …
- **Stadium Show** `racePopStadiumShow` T4 · rung popstar#4, ringmaster#4 — REWRITE (F.g9): dmg 130 → 150, CD 4 → CD 3, ADD finisher Stagger ×1.5 (keep Charm 1, aoe r2 rng 3, T4). The section files it as RECOST; the added finisher makes it a rewrite. The pyro lands hardest on those still reeling from Mic Drop / Crowd Surge. popstar / ringmaster rung 4.

**Street Smarts** `streetsmarts`
- **Drive-By** `raceDriveBy` T2 · rung gangster#2 — REWRITE (S): keep the id; streetsmarts T2 movement/dash (dmg 0, rng 3): ADD dashDamage:40 and status:stagger1 to every enemy on the dash path — Drive-By (50) → Body Check (25). Dirtyfighting (9 races) has NO stagger setup of its own (plus the §5 Concussive upgrade).
- **Choppa** `raceChoppa` T3 · rung gangster#3 — RETUNE (F.g8): dmg 110 → 125 (the T3 line bar ~125). Stays T3 line w1 rng 5.

**Superhero Powers** `superheropowers`
- **Heroic Leap** `raceHeroicLeap` T1 · rung superhero#1, sidekick#1 — REWRITE (S): superheropowers T1 Heroic Leap (plain 100, rng 3; superhero and sidekick rung #1): ADD finisher:frozen×1.5 — Freeze Breath (50) → Heroic Leap (25) is a 75-MP in-family loop on the 90-MP superhero.
- **Freeze Breath** `raceFreezeBreath` T2 · rung superhero#2 — RETUNE (F.g9): dmg 40 → 60 (Frozen 1 justifies a discount, not a 60% one). superhero rung 2 (pair with Invulnerable).
- **Invulnerable** `raceInvulnerable` T2 · rung superhero#2, antihero#2 — RECOST (F.g9): apCost 2 → 1 (50 MP, CD 2 stay) — Black Guard (sentai T2 Protect 2 CD2) does the same for 1 AP. superhero / antihero rung 2.
- **Shockwave Clap** `raceShockwaveClap` T3 · rung superhero#3 — REWRITE (F§): REWRITE: 125 + push 2 + Stagger 1 — as shipped Sonic Breaker (T2) is better.

**Swordsmanship** `swordsmanship`
- **Cross Slash** `crossSlash` T1 — REWRITE (F.g7): 100 metal, rng 1, applies Grievous 2 (the X-cut that will not close), no finisher (was finisher ×1.5 vs Slow). Every swordsman sets up his own finisher.
- **Dragon Slash** `dragonSlash` T4 — REWRITE (F.g7): 180 physical, rng 1, ignores DEF, finisher ×1.5 vs Grievous (was vs Burn), apCost 1 → 2, 100 MP.

**Symbiosis** `symbiosis`
- **Symbiote Armor** `raceSymbioteArmor` T2 · rung symbiote#2 — PASSIVE (F.g6): becomes the family passive "Symbiote Armor" (T2, 2 SP): "Once per life, when the host falls under 40% HP the suit knits it back for 30% of max HP." Distinct from Regen and from Immortal Cycle (active, 50%, CD4).
- **Symbiotic Drain** `raceSymbioticDrain` T3 · rung symbiote#3 — RETYPE (F.g6): magic → physical (symbiote atk 70 / int 31) — part of the REWRITE. · REWRITE (F.g6): damageType magic → PHYSICAL: 125 physical, rng 2, drain 40%, keep ×1.5 vs Poisoned. Desc: "The tendrils drink from the wound." Now distinct from Absorb (ooze, magic, rng 1).

**Teamwork** `teamwork`
- **Pep Talk** `jackOfAll` T2 · rung homosapien#2, sidekick#2 — RETIER T2→T3 (F.g7): T2 → T3 (75 MP). RUNGS (skeptic): a T3 row cannot sit in a rung-2 slot. · REWRITE (F.g7): target a friendly unit within 3 (not self), grant it the jackOfAll status (ATK/DEF/M.ATK/M.DEF +1, MOV +1, RNG +1) for 3 turns; T3, 75 MP 1 AP (was a SELF buff). Same weight as Oath of Valor (ATK +1 all nearby, T3).
- **Team Strike** `sentaiTeamStrike` T3 · rung super sentai#3, sidekick#3 — REWRITE (F.g7): T3 75 MP 1 AP (was 2 AP), rng 1, 5 × 27 physical, plus one extra 27-damage hit per allied unit adjacent to the target (max +3 → 216). NEW engine field bonusHitsPerAdjacentAlly: { dmg: 27, max: 3 } (nothing reads it today; skeptic flag, not a blocker). The surround-and-beat move.

**Temporal Abilities** `temporal`
- **Judgment Beam** `raceJudgmentBeam` T1 · rung watcher#1, cult leader#1 — REWRITE (F.g4): T1, 25MP 1AP (was 2AP), rng 5, line w1, 90 magic (was 100), Slow 1 (drop DEF −1). "The Watcher decides how long a second lasts." Slow feeds Entropic Beam / Star Decree / Paradox
- **Temporal Shift** `raceTemporalShift` T3 · rung watcher#3 — RETIER T3→T2 (F.g4): T3 → T2 (50MP); watcher rung 3 → the new T3 heal raceTimeRewindHeal (NOT raceTimeRewind, which keeps its id and becomes the T4 Paradox) · RECOST (F.g4): rng 3 → 4
- **Reality Pulse** `raceRealityPulse` T4 · rung watcher#4 — RETIER T4→T3 (★): T4 → T3 (75 MP), dmg → 135; aoe r1 + Discord 2 (F.g4's Discord 2) [Q1: one T4 per family — applies only if mondo keeps 4 tiers] · RETUNE (F.g4): 170 → 160, Discord 1 → 2 (Crow Storm's shape, time-flavoured)
- **Time Rewind** `raceTimeRewind` T4 · rung glitch#4, rabbit#4 — RENAME → "Paradox" (F.g4): "Time Rewind" → "Paradox"; glitch rung 4 and rabbit rung 4 keep the id · REWRITE (F.g4): T4, 180 (was 160) psychic/magic single rng 4, finisher Slow or Stagger ×1.5. "You were never standing there." · DESC (F§): desc must say it (the echoLastDealt replay, cap 500).

**Thievery** `thievery`
- **Hit a Lick** `raceHitALick` T2 · rung gangster#2 — MOVE → Thievery (F.g8): Hit a Lick (kind steal) streetsmarts → thievery (also stated in Thievery Changes, where it is retiered to T1 and renamed Stick-Up). The gangster is added to Thievery so his rung 2 [raceDriveBy, raceHitALick] stays legal. · RENAME → "Stick-Up" (F.g8): "Hit a Lick" → "Stick-Up" (reads on Robin Hood and the goblin as well as the gangster). Id unchanged. · RETIER T2→T1 (F.g8): T2 → T1 (25 MP) on the move into Thievery. Keep 60 physical rng 2, steals 1 Key + 1 item.
- **Steal from the Rich** `raceStealFromRich` T2 · rung robinhood#2, goblin#2 — REWRITE (F.g8): T2 50 MP rng 3: target ATK −1 stage AND the caster ATK +1 stage (new selfStageBoost: { atk: 1 } beside statStageBoost). Desc: "Steal from the rich. Lowers a Single Enemy's ATK by 1 stage and takes it for yourself." Now it steals.

**Training** `training`
- **Adaptable** `passiveAdaptable` T1 — RETIER T1→T2 (F.g9): T1 → T2 (2 SP): the single biggest team-building lever in the game (borrow any family) should cost a real slot.
- **Crescendo** `passiveCrescendo` T1 — REWRITE (F.g9): Hooks { buffTurnsBonus: 1 } only; desc "Buffs this unit applies last +1 turn." Drop the lullabyRangeBonus hook (a one-spell job leftover, "Lullaby has +1 range") from the row AND the battle.js line that reads it (no orphaned hooks).
- **Warpath** `passiveWarpath` T1 — RETIER T1→T2 (F.g9): T1 → T2 (2 SP): Brute Force's damage plus Bulwark's defence at the same 1 SP — strictly above both.

**Trap Making** `trapmaking`
- **Lucid Trap** `raceLucidTrap` T2 — RENAME → "Spring Snare" (F.g4): "Lucid Trap" → "Spring Snare" (old text was Dream Predation flavour, not a gnome's) · RETIER T2→T1 (F.g4): T2 → T1 (25MP, as it already costs) · DESC (F.g4): new text: hidden; the first enemy to step on it is Stunned 1; same placement rules. "Clockwork jaws under the leaves." Mechanics unchanged
- **Tinker's Contraption** `raceTinkersContraption` T2 · rung gnome#2 — DELETE (F.g4): not a trap; worse than Fortify at twice the cost; Fortify / Luminous Shield / Overtinker cover shields. Rung 2 → the new T2 Scrap Mine (a rung-2 default should be a T2 row; Spring Snare becomes T1)

**Trickery** `trickery`
- **Borrowed Claw** `raceBorrowedClaw` T1 · rung skinwalker#1 — MOVE → Trickery (F.g5): beastabilities → trickery (skinwalker rung 1; Trickery has no T1 and this IS trickery). Rung stays valid: skinwalker carries trickery. · DESC (F.g5): new desc: "Deals MEDIUM physical damage to a Single Enemy and tears one spell out of them — the skinwalker keeps it, they lose it for the match. Cooldown: 3 rounds." (current desc never mentions stealSpell / _stealSpellFrom)
- **Mimicry** `raceMimicry` T4 · rung skinwalker#4, bunny girl#4 — REWRITE (F.g9): T4 100 MP 1 AP, add CD 3 — self ATK +2, DEF +2 AND spawnDecoy (the Shed Skin decoy, draws 1 attack). Desc line: "Which one is the real one? Wrong." A trick, not a Thick Hide with a bigger number. skinwalker rung 4 (bunny girl rung 4 too).

**UFO Features** `ufo`
- **Probe** `raceProbe` T1 · rung grey#1 — REWRITE (F.g4): add Scanner 2 on hit (System Analysis' status: the target is inspected) — "free flavour, no balance cost"; 100 psychic/magic rng 4 unchanged
- **Implant** `raceImplant` T2 · rung grey#2 — REWRITE (F.g4): Marked 3 + −1 M DEF stage, rng 3 → 4. "It is behind the ear. It is always transmitting."
- **Abduction Beam** `raceAbductionBeam` T3 · rung grey#3 — REWRITE (F.g4): keep 110 + fall + collision; add finisher Marked ×1.5 ("the implant guides the beam"). Implant → Abduction is a self-contained 165+fall chain on grey's own rungs
- **Crop Circle** `raceCropCircle` T4 · rung grey#4 — RETIER T4→T3 (F§): ufo: Crop Circle → T3 125 r2 deform. · RETUNE (F§): 160 → 125.
- **War of the Worlds** `raceWarOfTheWorlds` T4 · rung martian#4 — REWRITE (F.g4): make the "/round" real: zone, 2 rounds — 100 metal/magic to every enemy in the 5×5 at the end of each round (200 over two rounds), rng 4, 100MP 2AP CD2 (was no CD). "No one would have believed it." Distinct from Crop Circle's instant 160 + crater · DESC (F§): no rewrite — just make the desc say it persists (the rack shows it as `aoe r2/round`, a persisting per-round area).

**Vampiric Abilities** `vampiricabilties`
- **Lifetap** `raceLifetap` T1 — RETYPE (F.g3): blood/magic → blood/physical (vampire ATK 61 / INT 31) · REWRITE (F.g3): T1 damageEffect/lifeDrain, blood/physical, 25MP 1AP, rng 2 → 1, dmg 80 → 100, drain 40%, Grievous 2. "Open the vein. The wound will not close." Physical, and the family's own setup
- **Bat Swarm** `raceBatSwarm` T3 · rung vampire#3 — RETYPE (F.g3): shadow/magic → blood/physical · REWRITE (F.g3): T3 damage/lifeDrain, blood/physical, 75MP 1AP, rng 4, aoe r1, dmg 125 → 110, drain 30% of the total dealt; DEF −1 is not in the new spec (dropped). "The only area drain in the game" —
- **Predator Drop** `racePredatorDrop` T4 · rung vampire#4 — REWRITE (F.g3): add finisher Grievous ×1.5 (fed by Lifetap); numbers otherwise unchanged; requiresFlight stays (vampire flies)

**Water Abilities** `water`
- **Whirlpool** `raceRiptide` T1 · rung siren#2, mermaid#3, atlantean#1, loch ness monster#1, firefighter#1 — RETUNE (F.g1): 3x3 dmg 100 -> 80 (T1 area house; Dust Devil is the same shape at 80); pull + Slow 1 unchanged.
- **Tidal Blessing** `raceTidalBlessing` T2 · rung mermaid#2, starfish#2 — REWRITE (R.3): heal/heal (was heal/zoneHeal 52/turn ×2), T2, 50 MP, 1 AP, no CD, rng 3, single ally, heal 140 + cleanse 1, element unchanged. Water then has an instant heal at T2 and the zone (Temporal Tide) at T3 — no duplicate; Tidal Blessing stays mermaid#2 / starfish#2 rung.
- **Water Pulse** `sharedTidalSurge` T2 · rung atlantean#2, firefighter#2 — REWRITE (F.g1): Status Slow 1 -> Wet 2; keep 100 line, rng 5, push 2. Wet rule needs the engine (see engine wet). Slow stays on Whirlpool/Tsunami/Tidal Slam so the family Slow finisher still works.
- **Temporal Tide** `raceTemporalTide` T3 · rung atlantean#3, starfish#3 — REWRITE (F.g1): T3 75MP 1AP rng 3, 3x3, 2 rounds: allies inside heal 60/turn (was 100) and shed 1 debuff per round; enemies inside are Slowed 1 each round ('time runs thick in the water'). Distinct from Tidal Blessing (pure 52/turn) instead of a bigger copy.
- **Call of the Deep** `raceCallOfTheDeep` T4 · rung siren#4, atlantean#4 — RETIER T4→T3 (F.g1): T4 -> T3, 100MP -> 75MP, 2AP -> 1AP (dmg/mechanic in the REWRITE record). · REWRITE (F.g1): dmg 160 -> 135; the target's tile becomes deep water AND the target starts drowning; keep finisher Silence x1.5 (Deafening Wail sets it on siren/mermaid). Desc: 'Something answers from below. MEDIUM magic damage to a Single Enemy, and the floor under them opens into deep water — they are drowning where they stand. Silenced …
- **Tidal Slam** `raceTidalSlam` T4 · rung loch ness monster#4, deep sea fish#4 — RETIER T4→T3 (★): T4 → T3 (75 MP), dmg → 135; keeps r1 self-area, Slow 2 and the Slow finisher, 1 AP [Q1: one T4 per family — applies only if mondo keeps 4 tiers] · RETUNE (F.g1): self 3x3 dmg 170 -> 160 (T4 house; it is 1AP).
- **Tsunami** `raceTsunami` T4 · rung atlantean#4, firefighter#4 — RETIER T4→T3 (F§): water: Tsunami → T3 135 w3. · RETUNE (F§): 160 → 135.

**Werewolf Powers** `werewolf`
- **Howl** `raceHowl` T2 · rung werewolf#2 — RETIER T2→T1 (F.g5): T2 → T1 (25 MP). · REWRITE (F.g5): pack cry: warCry, aura r2, +1 ATK stage to every ally within 2 (self included), 25 MP 1 AP. Desc: "The pack answers." Parity with Rally Command / Royal Decree T1 (was self +1 ATK).

**Winter Warfare** `winter`
- **Frozen Punch** `raceFrozenPunch` T1 · rung yeti#1 — RETUNE (F.g1): melee dmg 90 -> 100 (T1 single house). · DESC (F§): "MEDIUM physical damage" but 90: "Say WEAK, or set 100." (unresolved either/or).
- **Avalanche Strike** `raceAvalancheStrike` T4 · rung yeti#4 — RECOST (F.g1): add CD2; keep 180, Frozen 1 and finisher Frozen x1.5 (the loop remains but not every turn; every 2nd cast was 270 for 1AP).

**Witchcraft** `witchcraft`
- **Hex of Agony** `sharedHexOfToil` T2 · rung scarecrow#3, demon princess#2 — REWRITE (F.g3): "Hex of Agony": Hexed 3 + Grievous 3 (healing halved), rng 4, 50MP — the wound that will not close; distinct from the spread curse (was Hexed 3 only, same as Family Curse)
- **Family Curse** `raceCurseOfMisfortune` T3 · rung fortune teller#3, jack o lantern#3 — REWRITE (F.g3): "Family Curse": effect/aoe, rng 4, aoe r1, Hexed 3 on every enemy in the 3×3, 75MP 1AP. "It runs in the family." The T3 is the spread version (was single Hexed 3)
- **Hocus Pocus** `raceHocusPocus` T4 — REWRITE (F.g3): MP 25 → 100 (was off-ladder); add finisher Hexed ×1.5 — the old words become the family's capstone payoff. 180 arcane/magic single rng 4 unchanged

**Zombie Behavior** `zombie`
- **Infect** `raceInfect` T3 · rung zombie#3 — RECOST (F.g3): add CD 3 (was none); 75MP 1AP unchanged · RETUNE (F.g3): Infected 5 → 3; the target is yours for its next 4 → 2 activations (+1 ATK, +1 SPD, melee only). Still the strongest possess in the game, now priced like one
- **Outbreak** `raceOutbreak` T3 · rung zombie#3 — REWRITE (F.g3): 80 poison PHYSICAL damage on cast to every enemy in the 5×5, then Poison 2 reapplied for 3 rounds; drop finisher Poison ×1.5 (dead: multiplied zero); AP 2 → 1. "Patient zero should hit something on arrival."
- **Shambling Horde** `raceShamblingHorde` T4 · rung zombie#4 — RECOST (F§): RECOST all four 2 AP → 1 AP. A finisher is a rider, not a second AP.

360 existing rows changed. Verb count: REWRITE 159 · RETIER 82 · RETUNE 62 · DESC 48 · RECOST 44 · MOVE 22 · RETYPE 22 · DELETE 20 · RENAME 12 · MERGE 4 · KEEP 2 · PASSIVE 2 · UPGRADE 1.

### 6.3 New rows

Every new spell the plan adds, with the adopted spec. Ids are proposals (the `race` prefix is the house convention).

**Agriculture** `agriculture`
- T4 **Bumper Crop** `raceBumperCrop` (F.g1) — nature/magic, 100MP 2AP CD2, rng 4, 5x5, 120 dmg to enemies inside, Root 1, and a seed on every empty rim tile (sprouts next round into trees that block LOS and count for Green Thumb). Desc: 'Sow the whole field at once. Everything standing in it is rooted where it stands, and by next round there is a wood around them.' Reason: the flagship of a tree team (six trees for Green Thumb / Trunk Throw in one cast).

**Alien Weapons** `alientechnology`
- T4 **Disintegrator** `raceDisintegrator` (★) — T4 damage/damage, lightning/PHYSICAL, 100 MP 1 AP, rng 4, single, 180, finisher Stun or Minimize ×1.5. "There is no body to recover." (F.g4's row; damage type set to physical by the synthesis: two of Alien Weapons' three carriers are ATK races — martian ATK 88 / INT 30, barbarella ATK 72 / INT 31; men in black keep magic T4s in Advanced Technology.)

**Ancient Knowledge** `ancientknowledge`
- T3 **Sandstone Tomb** `raceSandstoneTomb` (F.g2) — earth/magic, 75MP 1AP, no CD, rng 4, single, 125 magic dmg, Rooted 2 rounds. Desc: 'The sand closes over them, and the sand remembers.' Family control rung and self-contained setup (anubis pays with Life Drain root x1.5, annunaki with Precision Shot). SKEPTIC renumbered to Sleep Paralysis parity (T3 125 + Rooted 2).

**Animal Handling** `animalhandling`
- T1 **Hawk** `raceHawk` (F.g9) — Element not stated. 25 MP 1 AP, no CD, rng 1, maxActivePerCaster 1, summonDef { key: 'hawk', name: 'Hawk', move: 6, dmg: 35, hits: 2, reveals: 2 }: at the end of every round it dives 6 tiles at the nearest enemy for 35; anything hidden within 2 of it is spotted; two hits to bring it down. Desc: "Two fingers on the glove. At the end of every round it dives 6 tiles at the nearest enemy for 35; anything hidden within …
- T2 **Wolf Pack** `raceWolfPack` (F.g9) — Element not stated. 50 MP 1 AP, no CD, rng 1, maxActivePerCaster 2, summonDef { key: 'wolf', name: 'Wolf', move: 4, dmg: 45, hits: 2 }. Desc: "Never one. At the end of every round each wolf runs 4 tiles at the nearest enemy and bites for 45. Two per handler." Bodies that block lanes and force AP.
- T3 **Crack the Whip** `raceCrackTheWhip` (F.g9) — -/magic, 75 MP 1 AP, no CD, rng 2, single, 125 dmg, Feared 1; no finisher. Desc: "The whip cracks — or the spirit roars — and they run." Feared ("can only flee, no attacks, no spells") had one setup (Fear) and one payoff (Terror Pounce); this is the single-target version at the Skull Crack (T3 125 + Silence) weight.
- T4 **Elephant** `raceElephant` (F.g9) — Element not stated. 100 MP 1 AP, no CD, rng 1, maxActivePerCaster 1, summonDef { key: 'elephant', name: 'Elephant', move: 3, dmg: 110, hits: 6 }. Desc: "The big top's biggest act. Walks 3, hits for 110, takes six hits to put down. One per handler." A T4 that is a wall with a trunk.

**Apex Predator** `apexpredator`
- T2 **Death Roll** `raceDeathRoll` (F.g5) — T2 damageEffect, -/physical, 50 MP 1 AP, CD -, rng 1, single, 100 dmg, Root 2, no finisher. Desc: "Clamp and spin. MEDIUM physical damage, and the prey is not going anywhere." A pin for two control-less bruisers; Root feeds Necromancy/Marksmanship root finishers on teammates.

**Arachnid Powers** `arachnid`
- T4 **Cocoon** `raceCocoon` (F.g6) — T4 damageEffect/damage, arcane/magic, 100 MP / 1 AP, CD -, rng 4, single, 170 magic, Silence 1, finisher ×1.5 vs Rooted. Desc: "The silk closes over the mouth first. HEAVY arcane damage; a Rooted target is wrapped tight and takes half again." The family payoff and voidweaver's damage T4.

**Arcane Magic** `arcane`
- T4 **Annihilation** `raceAnnihilation` (F.g1) — arcane/magic, 100MP 1AP CD2, rng 4, single, 180 dmg, purgeBuffs (strips every buff and shield first, as Terror Pounce does), no status. Desc: 'Unmake it. Every ward, every blessing, every stage they stacked — gone — and then HEAVY magic damage to what is left.' SKEPTIC added CD2 (180 + full purge at 1AP no CD would out-class Absolute Zero and undo the Avalanche Strike CD fix).

**Astral Projection** `astralprojection`
- T3 **Spirit Guide** `raceSpiritGuide` (F.g2) — psychic, 75MP 1AP, no CD, rng 4, single ally, no dmg: Invisible 1 round and Levitating 2 rounds. Desc: 'Take my hand. They cannot see what is not here.' The ally version of Spirit Walk (no teleport; they float out of the melee unseen).

**Athleticism** `athleticism`
- T1 **Sprint** `raceSprint` (F.g7) — T1 movement/dash, no damage, element -, 25 MP 1 AP, CD -, rng 3: run up to 3 tiles in a straight line; no opportunity strikes. Desc: "Go."
- T2 **Shake It Off** `raceShakeItOff` (F.g7) — T2 heal/selfHeal, element -, 50 MP 1 AP, CD2: heal 25% max HP and cleanse 2 debuffs. Desc: "Walk it off." Sustain for swordfighter, ki fighter, quarterback, rabbit, luchador; smaller than Adrenaline Rush (40%).
- T3 **Vault** `raceVault` (F.g7) — T3 damage/leapStrike, physical, 75 MP 1 AP, CD -, rng 3, 125 dmg, dmgPerLevel: 15, no status: leap over walls and bodies to a tile beside an enemy and land on them. Desc: "Over, not through."

**Beast Abilties** `beastabilities`
- T2 **Maul** `raceMaul` (F.g5) — T2 damageEffect, -/physical, 50 MP 1 AP, CD -, rng 1, single, 110 dmg, Grievous 2 (healing on them halved), no finisher. Desc: "Jaws lock and shake. MEDIUM physical damage and a wound that will not close." Fills the empty T2; anti-heal for every beast race; pairs with Bite.

**Black Magic** `blackmagic`
- T3 **Needle Work** `raceNeedleWork` (F.g3) — T3 damage, shadow/magic, 75MP 1AP, rng 4, single, dmg 125, ignoreArmor, finisher Voodoo ×1.5. Desc: "Push the pin in. Deals MEDIUM magic damage that ignores DEF; a Voodoo-bound target takes it worse." Ranged T3 payoff for the casters (necromancer, skinwalker); Voodoo → Needle Work is self-contained

**Blood Magic** `blood`
- T2 **Hemorrhage** `raceHemorrhage` (F.g1) — blood/magic, 50MP 1AP, no CD, rng 3, single, 100 dmg, Grievous 2. Desc: 'Open the vein. MEDIUM magic damage and a wound that will not close — healing on them is halved.' Reason: 'the T2 rung' (no rung reassignment named) and the setup for Life Sap / Exsanguinate.
- T4 **Exsanguinate** `raceExsanguinate` (F.g1) — blood/magic, 100MP 2AP CD2, rng 3, single, 180 dmg, drain 100%, finisher Grievous x1.5. Desc: 'Take all of it. HEAVY magic damage to a Single Enemy and every point of it comes back to you.' Reason: the flagship; the vampire build ends in a vampire spell.

**Bone Density** `bonedensity`
- T3 **Bone Lance** `raceBoneLance` (F.g3) — T3 damage, -/physical, 75MP 1AP, rng 4, line w1, dmg 125, ignoreArmor. Desc: "A femur, thrown like a javelin, through everyone in the way. Deals MEDIUM physical damage to All Enemies in a line. Ignores DEF." The physical T3 the skeleton scales with; skeleton's new T3 rung

**Cephalopod Anatomy** `tentacleappendages`
- T2 **Constrict** `raceConstrict` (F.g6) — T2 effect/debuff, water, 50 MP / 1 AP, CD -, rng 2, single: Rooted 2 and DEF −1 stage, no damage. Desc: "Two arms, then four. It is not going anywhere." The hold between the pull (T1) and the beating (T3).
- T3 **Eightfold Lash** `raceEightfoldLash` (F.g6) — T3 damage/multiHit, water/magic, 75 MP / 1 AP, CD -, rng 2, single, hitDamages: [32,32,32,32] (128 nominal; T3 single median 125), finisher ×1.5 vs Rooted (192 on its own Constrict). Desc: "All of them at once."

**Chemistry** `chemistry`
- T1 **Acid Flask** `raceAcidFlask` (F.g4) — T1 damageEffect/damage, poison/magic, 25MP 1AP, rng 3, single, 100, −1 DEF stage. "It eats the plate first." Softens for the physical teammates the scientist deploys
- T2 **Antidote** `raceAntidote` (F.g4) — T2 heal/heal, no element, 50MP 1AP, rng 3, single: heal 140 and cleanse 2 debuffs. "Drink it before it stops fizzing." Sustain for two races that have none
- T4 **Chain Reaction** `raceChainReaction` (F.g4) — T4 damage/aoe, fire/magic, 100MP 1AP CD2, rng 4, aoe r2 (5×5), 140, finisher Burn or Poison ×1.5 (Corroded counts via STATUS_DEFS countsAs). "One spark. The whole table goes." Pays off Concoction in-family and every Burn (21) / Poison (15) setup on the team

**Christmas Spirit** `christmasspirit`
- T3 **Milk and Cookies** `raceMilkAndCookies` (F.g1) — element 'christmas' (as written; not an element in data), 75MP 1AP, no CD, rng 0, aura r2: allies within 2 heal 100 and shed 1 debuff. Desc: 'Left out for whoever's still standing. Every ally within 2 tiles heals and shakes one thing off.' Reason: santa's missing sustain (new santa rung-3 twin); krampus eats them too.

**Computer Hacking Skills** `computerhacking`
- T4 **System Crash** `raceSystemCrash` (F.g4) — T4 damage/aoe, -/magic, 100MP 1AP CD2, rng 4, aoe r1 (3×3), 150 magic, finisher Jammed ×1.5; every Jammed enemy hit is also Staggered 1. "Fatal exception. Everything running on them stops." Area payoff for Memory Leak / EMP Burst / EMP Grenade / Deneuralizer; the T4 the family lacks

**Cowboy Skills** `cowboyskills`
- T3 **Slap Leather** `raceSlapLeather` (F.g8) — metal/physical, 75 MP 1 AP, no CD, rng 4, single, 125 physical, Stagger 1, actedTargetBonus: 30 (+30 vs a target that already acted this round); no finisher. Desc: "Hand hovers, then it doesn't. MEDIUM physical damage to a Single Enemy — they flinch and lose an AP. Hits harder on anyone who already made their move." Fills the T3 and makes High Noon self-contained on a 1-turn setup (Slap Leather Stagger → High Noon …

**Cryptid Abilities** `cryptid`
- T3 **Eyewitness** `raceEyewitness` (F.g5) — T3 effect/debuff, element -, 75 MP 1 AP, CD -, rng 4, aoe r1: Feared 1 (must flee) AND Blind 2 to all enemies in the 3×3, no damage. Desc: "They will describe it badly for the rest of their lives." Thrown from 4 tiles; the cryptid's control and the T4 setup.
- T4 **Out of the Dark** `raceOutOfTheDark` (F.g5) — T4 damage, -/physical, 100 MP 1 AP, CD -, rng 3 charge, single, 180 dmg, finisher feared ×1.5. Desc: "One clear look. That was the last photo on the roll." Physical for the bruiser/tank half (bigfoot, yeti, nessie, tree person, goatman).

**D.O.O.R. Gun** `doors`
- T1 **Shut Door** `gunShutDoor` (F.g7) — T1 deploy/doorDeploy, element -, 25 MP 1 AP, CD -, rng 4: a door with no destination — shut, it blocks movement and line of sight like a wall; the Keyholder's side may open it to pass; 3 hits to break (shared two-standing cap). Desc: "Just a door." The cheap wall and the prism/corner piece for Laser Door.
- T4 **Twin Doors** `gunTwinDoors` (F.g7) — T4 deploy/deployPair (reuse the existing kind — Tunnel Network raceTunnelNetwork; not a new engine kind), element -, 100 MP 1 AP, CD3, rng 4: place two doors within 4 as a pair; any unit that steps, is knocked, blown or pulled into one comes out of the other (Swing Door, Gust, Maw and Round-Up feed it). Desc: "Whatever goes in one comes out the other."

**D.O.O.R. Training** `door`
- T3 **Door Slam** `raceDoorSlam` (F.g7) — T3 damage, psychic/physical, 75 MP 1 AP, CD -, rng 4, 130 dmg, finisher ×1.5 vs Stagger: shoot a door onto a Staggered enemy's tile and slam it on them. Desc: "Mind your fingers." Air Mail → Door Slam = 195 at 4 tiles.

**Deep Sea Anatomy** `deepsea`
- T1 **Spout** `raceSpout` (F.g6) — T1 damageEffect/damage, water/magic, 25 MP / 1 AP, CD -, rng 3, single, 80 water magic, Wet 2, no finisher. Desc: "A jet of seawater from the gills. WEAK water damage and the target is soaked through." The family setup (feeds Depth Charge / Sting; hands lightning/ice teammates the soak combo).

**Deep State Connections** `deepstate`
- T1 **Surveillance** `raceSurveillance` (F.g8) — No element, 25 MP 1 AP, no CD, rng 6, single, no damage, Marked 2 rounds (bonusDamage 40). Marked's own engine behaviour is the whole effect (consumed by the next physical hit, pierces invisibility / cryptid hiding) — no new fog-reveal mechanic. Desc: "We have had a file on you for years. A Single Enemy within 6 tiles is Marked for 2 rounds: they cannot hide, and the next physical hit any ally lands deals +40." Red …

**Desert Acclimation** `desertacclimation`
- T3 **Quicksand** `raceQuicksand` (F.g5) — T3 utility/zoneDebuff, earth, 75 MP 1 AP, CD -, rng 4, aoe r1, 2 rounds: enemies inside are Rooted 1 at the end of each round and Slowed 1, no damage. Desc: "The ground is fine until it is not."
- T4 **Simoom** `raceSimoom` (F.g5) — T4 damageEffect/aoe, wind/magic, 100 MP 1 AP, CD -, rng 4, aoe r1, 160 dmg, Blind 1, no finisher. Desc: "The hot wind that kills. HEAVY magic damage to everything in the square, and nobody sees where it came from." Magic for the casters (anubis INT 86, djinn).

**Dragon Abilities** `dragonabilities`
- T2 **Ember Heart** `raceEmberHeart` (F.g5) — T2 heal/selfHeal, fire, 50 MP 1 AP, CD -, self: heal 20% max HP + Regen 2. Desc: "The furnace inside never goes out." The dragon's sustain gap; below Lunar Regeneration (T3) by tier.

**Dream Predation** `astral`
- T2 **Dreamwalk** `raceDreamwalk` (R.2) — element not given · 50MP 1AP CD2 · rng 0 · self · teleport 3 + invisible 1 — the same numbers as Corpse Crawl; the dreameater's new rung 2

**Fallen Angelic Powers** `fallenangel`
- T3 **Broken Halo** `raceBrokenHalo` (F.g3) — T3 damageEffect (single), shadow/magic, 75MP 1AP, rng 4, single, dmg 130, purgeBuffs (the field Terror Pounce uses), finisher Burn ×1.5. Desc: "What is left of the halo, thrown like a discus. Deals MEDIUM magic damage and strips every buff the target carries; Burning targets take it worse." Fills the empty T3 as the 1AP ranged Burn payoff; the nephilim's only dispel

**Feline Anatomy** `feline`
- T2 **Land on Your Feet** `raceLandOnYourFeet` (F.g5) — T2 movement/leap, element -, 50 MP 1 AP, CD -, rng 3: leap to any tile within 3 regardless of elevation, take no fall damage, +1 DEF stage for 1 round. Desc: "Cats do not fall. They arrive."
- T3 **Cat Nap** `raceCatNap` (F.g5) — T3 heal/selfHeal, element -, 75 MP 1 AP, CD -, self: heal 30% max HP, cleanse all. Desc: "Twenty minutes. Good as new." (slightly above Carrion Feast 25%.)

**Fire Magic** `fire`
- T2 **Combust** `raceCombust` (F.g1) — fire/magic, 50MP 1AP, no CD, rng 4, single, 130 dmg, no status, finisher Burn x1.5. Desc: 'Feed the fire what it wants. MEDIUM magic damage — a Burning target goes up like tinder.' Reason: 'the T2 rung' and the in-family Burn payoff a T1 Fireball enables; with Blast it is the family 3x3 detonation (no separate spell). No rung reassignment named.

**Football IQ** `football`
- T3 **Long Bomb** `raceLongBomb` (F.g7) — T3 damage, wind/physical, 75 MP 1 AP, CD -, rng 6, 135 dmg, ignoresLineOfSight (the ball arcs over cover), no status. Desc: "Let it fly." The T3 single hit the family lacked; distinct from Hail Mary (finisher, rng 5, T4).

**Fortune Telling** `fortunetelling`
- T2 **Mercury Retrograde** `raceMercuryRetrograde` (R.1, re-homed from Astrology) — arcane, 50MP 1AP, no CD, rng 4, aoe r1, no dmg, status discord1, zoneDuration 2
- T3 **Eclipse** `raceEclipse` (R.1, re-homed from Astrology) — arcane/magic, 75MP 1AP, no CD, rng 4, aoe r1, dmg 100, status blind1

**Fractal Pattern Recognition** `fractal`
- T2 **Strange Loop** `raceStrangeLoop` (F.g4) — T2 damageEffect/damage, arcane/magic, 50MP 1AP CD2, rng 4, single: 70 magic + Stun 1. "The pattern closes on itself. They cannot find the way out." Taser's exact T2 shape in arcane; setup for Fractal Needle's Stun finisher (255 chain) — mantid / voidweaver have no other Stun

**Galactic Federation Protocol** `galacticfederation`
- T1 **Pleiadian Touch** `racePleiadianTouch` (F.g4) — T1 heal/heal, light, 25MP 1AP, rng 3, single: heal 130, cleanse 1. "A hand on the shoulder. The wound remembers being whole." The family's T1; rung-1 alternative for a healer build (nordic has one heal in a pool of 16)

**Gambling** `gambling`
- T1 **Dead Man's Hand** `raceDeadMansHand` (F.g9) — arcane/magic, 25 MP 1 AP, no CD, rng 3, single, hitDamages [26,26,26,26] = 104; no status/finisher. Desc line: "Aces and eights, thrown edge-first." The T1 hit; Flurry of Blows (4×33 melee) is the comparable. Becomes bunny girl rung 1 (was racePopMicDrop).
- T2 **Stacked Deck** `raceStackedDeck` (F.g9) — Element not stated. 50 MP 1 AP, no CD, rng 4, single, no damage, Marked 2 and DEF −1 stage. Desc line: "You have been reading their tell all night." Makes the bunny girl the table's focus-fire caller.
- T3 **Double Down** `raceDoubleDown` (F.g9) — Element not stated. 75 MP 1 AP, no CD, self, ATK +2 stages, DEF −1 stage. Desc line: "Everything on the table." The risk row — Underdog Spirit (T3, ATK +2 per the g7 rewrite) without the cleanse and with a cost. Becomes bunny girl rung 3 (was racePopSpotlight).
- T4 **Jackpot** `raceJackpot` (F.g9) — arcane/magic (magic for the same reason as Dead Man's Hand), 100 MP 1 AP, no CD, rng 3, aoe r1, 160 dmg, Stagger 1; no finisher. Desc line: "The machine pays out. All of it. On their heads." The area capstone; Arrow Volley / Marrowstorm (T4 160 aoe) are the scale.

**Giant Abilities** `titan`
- T2 **Giant Stride** `raceGiantStride` (F.g5) — T2 movement/dash, element -, 50 MP 1 AP, CD -, rng 4: move to any tile within 4 ignoring terrain cost and elevation; enemies adjacent to the path take 60 physical. Desc: "Four of your steps. One of his."

**Healing Magic** `healingmagic`
- T1 **Soothe** `raceSoothe` (F.g2) — light, 25MP 1AP, no CD, rng 3, single ally: heal 80 and Regen 2 rounds. Desc: 'A hand on the brow. It does not fix you; it keeps you going.' A heal-over-time T1 (does not duplicate Divine Light's flat 140); starfish rung 1.

**Heavenly Duties** `angelic`
- T3 **Seraphic Fire** `raceSeraphicFire` (R.1) — light/magic, 75MP 1AP, no CD, rng 4, aoe r1, dmg 125, status burn2 — the seraph's own burn setter for Merkaba. g2's move of Divine Judgment into Heavenly Duties fills the same T3 role

**Hidden Technology** `advancedtechnology`
- T3 **Blue Beam** `raceBlueBeam` (F.g4) — T3 damageEffect/aoe, light/magic, 75MP 1AP, rng 5, aoe r1 (3×3), 125 magic, Discord 1. "Holograms in the sky. Half of them panic; the other half kneel." The family's area row; the conspiracy theorist's name-drop; Discord feeds Ratio'd / Migraine / Vehicular Manslaughter teammates

**Horns & Hooves** `horns`
- T3 **Horn Hook** `raceHornHook` (F.g5) — T3 damageEffect, -/physical, 75 MP 1 AP, CD -, rng 3, single, 110 dmg, pulls the target 2 tiles to the caster, Root 1, no finisher. Desc: "Hooked on the horns and dragged home. MEDIUM physical damage; they end the turn where the hooves are." (kind not named; pull inferred)

**Horseback Riding** `horsebackriding`
- T2 **Saddle Up** `raceSaddleUp` (F.g7) — T2 effect/buff, element -, 50 MP 1 AP, CD3, self: Overclock 2 rounds (ATK +1 stage, MOV +1) and cleanse Slow/Root (cleanse 2). Desc: "Mount up."
- T3 **Ride-By** `raceRideBy` (F.g7) — T3 damage/dash, physical, 75 MP 1 AP, CD -, rng 4: ride 4 tiles in a straight line: 110 to the enemy you end beside, 55 (dashDamage) to every enemy passed; no opportunity strikes. Desc: "Don't stop."
- T4 **Lance** `raceLance` (F.g7) — T4 damage/dash, physical, 100 MP 1 AP, CD -, rng 5, 170 dmg, knockback 2, collision +40. Desc: "Couched and level." Distinct from Rampage (path + Stagger) and Bull Rush (Discord finisher).

**Hunting Skills** `huntingskills`
- T1 **Snare** `raceSnare` (F.g8) — nature/physical, 25 MP 1 AP, no CD, rng 3, single tile. Trapdoor's placeTrap plumbing (raceTrapdoor, state.traps + _revealedTo) with trapSize: 1 instead of its 2×2 and no terrain sink; hidden from the enemy, revealed only by the Dowsing Rod's revealTrapsWithin; maxActivePerCaster 2. The first enemy to step on it takes 40 physical and is Rooted 2 rounds. No finisher. Desc: "A loop of wire where the game walks. The …

**Ice Magic** `ice`
- T1 **Shatter** `raceShatter` (F.g1) — ice/magic, 25MP 1AP, no CD, rng 4, single, 100 dmg, no status, finisher Frozen x1.5. Desc: 'Tap the ice and watch it go. MEDIUM magic damage — a Frozen target takes it through every crack.' Reason: in-family payoff making Flash Freeze -> Shatter a two-turn plan (mirrors Winter's Frozen Punch).

**Insectoid Anatomy** `insectoid`
- T2 **Brood** `raceBrood` (F.g6) — T2 deploy/summonUnit, poison, 50 MP / 1 AP, CD -, rng 1, single tile, maxActivePerCaster: 1, summonDef: { key: 'drone', name: 'Drone', move: 4, dmg: 55, hits: 3 } (engine pet model: hits-to-kill body, hunts the nearest enemy at end of round for dmg + half spell power). Desc: "One is never found alone." A poison bite needs the new summonDef.hitStatus hook (engine work, not shipped behaviour). Rung use: Ooze block …

**Internet Addiction** `internetaddiction`
- T1 **Doomscroll** `raceDoomscroll` (F.g4) — T1 effect/debuff, psychic, 25MP 1AP, rng 4, single: Discord 2 (−2 ATK / −1 DEF). "They read the comments. All of them." Setup for Ratio'd and teammates' Discord payoffs (Migraine, Vehicular Manslaughter, Bull Rush, Depth Charge, Requiem, Prophecy of Disaster)
- T2 **Rabbit Hole** `raceRabbitHole` (F.g4) — T2 movement/teleport, no element, 50MP 1AP, rng 3, single, teleportDistance 3. "Three hours later you are somewhere else entirely." Movement for both races (both "missing movement")
- T3 **Ratio'd** `raceRatiod` (F.g4) — T3 damage/damage, psychic/magic, 75MP 1AP, rng 4, single, 125, finisher Discord ×1.5, and the target loses 1 more ATK stage. "The whole internet piles on." Doomscroll → Ratio'd is a self-contained 187 chain

**Kaiju Rampage** `kaiju`
- T1 **Car Toss** `raceCarToss` (F.g5) — T1 damage, -/physical, 25 MP 1 AP, CD -, rng 4, single, 100 dmg, ignoresLineOfSight, no status/finisher. Desc: "Whatever was parked there." The small version of Skyscraper Toss (single → aoe is the family ladder). Kaiju rung 1 → raceCarToss.

**Ki Energy** `ki`
- T4 **Spirit Bomb** `raceSpiritBomb` (F.g7) — T4 damage/delayed, light/magic, 100 MP 2 AP, CD -, rng 5, aoe r1, delayTurns: 1, 160 magic, no status. Gather it this round; it lands on the marked 3×3 at the end of the next. Desc: "Lend me your energy." The one ki row that stays magic (it is everyone's ki).

**Knighthood** `knight`
- T2 **Shield Bash** `raceShieldBash` (F.g2) — physical (element not stated), 50MP 1AP, no CD, rng 1, single, 110 dmg, Stagger 1 (the target loses 1 AP). Desc: 'Edge of the shield, under the chin.' Fills T2 (knight rung 2); Stagger feeds Robo Punch / Horn Toss-style teammates.

**Lightning Magic** `lightning`
- T1 **Static Shock** `raceStaticShock` (F.g1) — lightning/magic, 25MP 1AP, no CD, rng 4, single, 100 dmg, Stagger 1. Desc: 'A crack of static across the gap. MEDIUM magic damage, and the jolt costs them an action.' Reason: 'the T1 rung' (no rung reassignment named); Stagger feeds Boulder Hurl / Robo Punch / Horn Toss payoffs.
- T3 **Chain Lightning** `raceChainLightning` (F.g1) — lightning/magic, 75MP 1AP, no CD, rng 4, single + chainProfile [130, 85, 50] (jumps to 2 more enemies within 2 tiles of the last), finisher Wet x1.5 on every hop. Desc: 'It never wanted just one of you.' Reason: the chain belongs at T3 next to Prism Burst; Thunderbolt's hidden mechanic moves here.
- T4 **Tempest** `raceTempest` (F.g1) — lightning/magic, 100MP 2AP CD2, rng 4, 3x3, 160 dmg, Stun 1, grounds flyers, finisher Wet x1.5. Desc: 'Call the sky down on the lot of them. HEAVY magic damage to a 3x3; everything in it stops moving for a round and nothing in it stays airborne.' Reason: the flagship; Stun 1 on a 3x3 at 2AP/CD2 sits under Permafrost's Frozen 2.

**Living Stone** `livingstone`
- T4 **Petrify** `racePetrify` (F.g5) — T4 effect/debuff, earth, 100 MP 1 AP, CD2, rng 3, single: Stun 2 + DEF −1 stage, no damage. Desc: "Grey climbs from the feet up. For two rounds they are a statue; when it lets go, the cracks stay." Needs no ATK/INT (golem INT 0); pairs with the stun finishers.

**Machinery** `machinery`
- T1 **racePistonJab** `racePistonJab` (R.3) — Piston Jab — T1 damageEffect/damage, metal/physical, 25 MP, 1 AP, no CD, rng 1, single, dmg 90, status jammed 1 (a Jammed SETUP that makes Hydraulic Crush self-contained).
- T2 **raceGreaseFire** `raceGreaseFire` (R.3) — Grease Fire — T2 damageEffect/aoe, fire/physical, 50 MP, 1 AP, no CD, rng 3, aoe r1, dmg 80, status burn 2, leaveTerrain scorched (a burning slick; the 3-tile line is Scorched Earth / Wall of Fire).
- T4 **raceCompactor** `raceCompactor` (R.3) — Compactor — T4 damageEffect/damage, metal/physical, 100 MP, 2 AP, no CD, rng 1, single, dmg 180, status root 2.

**Main Character Energy** `maincharacter`
- T4 **Roll Credits** `raceRollCredits` (F.g9) — physical (element not stated), 100 MP 1 AP, no CD, rng 2, single, 180 dmg, finisher Stagger ×1.5; no status. Desc line: "This is the part where it ends." The capstone the family never had, paid off by its own Dark Feather (Stagger) and by Mic Drop / Ram Charge / Yellow Thunder on allies (Body Check is a Stagger PAYOFF, not a setup); Weigh the Heart (T4 180, finisher Stagger) is the caster-side twin. Becomes chosen …

**Martial Arts** `martialarts`
- T2 **Roundhouse Kick** `raceRoundhouseKick` (F.g7) — T2 damage/barrage, physical, 50 MP 1 AP, CD -, self-aoe r1: 100 to every adjacent enemy, each Staggered 1. Desc: "Everyone in reach." The family area clear and its Stagger setup for Haymaker.
- T3 **Pressure Point** `racePressurePoint` (F.g7) — T3 damageEffect, physical, 75 MP 1 AP, CD2, rng 1, 100 dmg, Stun 1. Desc: "Two fingers. Lights out." Ki fighter's missing debuff; sets up Dragon Fist.

**Mech Pilot Skills** `mecha`
- T4 **Full Burst** `raceFullBurst` (F.g4) — T4 damage/aoe, -/physical, 100MP 2AP CD2, rng 5, aoe r2 (5×5), 150 physical, ignores line of sight. "Every hardpoint on the frame, at once." The in-family T4 (Nuke is delayed and magic; this is instant, physical, no spotter)

**Meditation** `meditation`
- T1 **Deep Breath** `raceDeepBreath` (F.g2) — element not stated, 25MP 1AP, no CD, self (rng 0), heal 100 and cleanse 1. Desc: 'In through the nose.' Cheap self-sustain; unlike Soothe (ally) it is self-only, unlike Reassemble (T2) it cleanses.
- T3 **Mantra** `raceMantra` (F.g2) — light, 75MP 1AP, no CD, aura r2: allies within 2 gain Regen 3 rounds (Regen = 40 HP/round, 120 per ally) and cleanse 2 each. Desc: 'One word, everyone breathing it.' Team-sustain T3 (pairs with Sanctuary / Tidal Blessing). SKEPTIC renumbered from Regen 2 + cleanse 1.

**Mirror Magic** `mirrormagic`
- T1 **Mirror Shard** `raceMirrorShard` (F.g9) — arcane/magic, 25 MP 1 AP, no CD, rng 4, single, 80 dmg, ricochet { radius 2, mult 0.5 }; no status. Desc line: "A sliver of the glass. It finds the next face too." Prism Burst (T3 125 ricochet) is the upper rung of the pattern. Becomes rabbit rung 1 (was raceSparkle).
- T2 **Seven Years** `raceSevenYears` (F.g9) — arcane/magic, 50 MP 1 AP, no CD, rng 4, single, 100 dmg, Hexed 2; no finisher. Desc line: "You broke it. You know the rule." Feeds Crystal Ball (fortune teller's own T4, finisher Hexed ×1.5), Crow Storm and Exorcism; Hex of Agony (T2 witchcraft) applies the same status with no damage.
- T3 **Shattered Mirror** `raceShatteredMirror` (F.g9) — arcane/magic, 75 MP 1 AP, no CD, rng 4, aoe r1, 125 dmg, Blind 1; no finisher. Desc line: "Every shard, every eye." The area rung; pays into Sucker Punch (rabbit has Trickery) and the Blind zone.
- T4 **Hall of Mirrors** `raceHallOfMirrors` (F.g9) — arcane/magic, 100 MP 1 AP, CD 2, rng 4, aoe r1, zoneDuration 3 (the engine's zone hook; Heat Death — kind aoe + zoneDuration — is the template), dmg 60 and Blind 1: enemies inside take 60 magic at the end of each of the 3 rounds and are Blinded 1 each time (3×60 = 180 over the zone's life = the T4 area budget). Desc line: "Nine of you, and none of them is the door."

**Mothman** `mothman`
- T2 **Premonition** `racePremonition` (F.g5) — T2 effect/buff, element -, 50 MP 1 AP, CD -, rng 4, single ally: Protect 1 + +1 SPD stage. Desc: "It saw the bridge go. It tells one of you to step back."
- T3 **Harbinger** `raceHarbinger` (F.g5) — T3 effect/debuff, element -, 75 MP 1 AP, CD -, rng 4, aoe r1: Marked 2 + Discord 2 to every enemy in the 3×3. Desc: "Everything in the square is on the list." Makes Prophecy self-contained.

**Nature Magic** `nature`
- T3 **Entangling Roots** `raceEntanglingRoots` (F.g1) — nature/magic, 75MP 1AP, no CD, rng 4, 3x3, 125 dmg, Root 1. Desc: 'The ground remembers what it grew. MEDIUM magic damage to a 3x3 and nothing in it moves next round.' Reason: family control rung (new rung 3 of bigfoot + tree person); Root has 5 payoffs and only single-target setups.
- T4 **Rejuvenation** `raceRejuvenation` (F.g1) — nature, 100MP 2AP CD2, rng 0, aura r3: every ally within 3 heals 120, gains Regen 2 and sheds 1 debuff. Desc: 'Everything green in you wakes up at once.' Reason: Nature had no T4; distinct from Heal All (T3, 140 flat, no regen) by Regen and radius.

**Necromancy** `necromancy`
- T3 **Mummify** `raceMummify` (R.2) — -/magic · 75MP 1AP · no CD · rng 3 · single · dmg 110 · silence 2 + grievous 2 — wrapped in bandages: cannot cast, cannot be healed. Necromancy has no T3 and no Silence.
- T3 **raceCorpseExplosion** `raceCorpseExplosion` (R.3) — Corpse Explosion — T3 damageEffect/aoe, poison/magic, 75 MP, 1 AP, no CD, rng 4, target an ally's gravestone or an enemy's pile of bones (Raise the Dead's objects), aoe r1 around it, dmg 125, status poison 2; the corpse is consumed and can never be revived. (g3 fills Necromancy's T3 by MOVing raceBoneBarrage in — collides.)

**Poison Abilities** `poison`
- T3 **Rot** `raceRot` (F.g1) — poison/magic, 75MP 1AP, no CD, rng 4, single, 125 dmg, Poison 2 + Grievous 2. Desc: 'It does not heal. MEDIUM magic damage; the wound Poisons and will not close — healing on them is halved.' Reason: anti-heal answer to Water/Light zones and Regen teams; new rung 3 of black goo / bee queen / mushroom girl.
- T4 **Miasma** `raceMiasma` (F.g1) — poison/magic, 100MP 2AP CD2, rng 4, 5x5, 160 dmg, Poison 3, finisher Poison x1.5, the centre 3x3 becomes poison terrain. Desc: 'The air goes green. HEAVY magic damage to a 5x5, Poison on all of it, and the middle stays poisoned after.' Reason: flagship and in-family payoff for Corrosive Splash -> Miasma.

**Politics** `politics`
- T2 **Campaign Promise** `raceCampaignPromise` (F.g8) — Id not given in the section (extractor-proposed raceCampaignPromise). No element, 50 MP 1 AP, no CD, rng 4, single, no damage, Charm 1 round (charm = cannot move or act). Desc: "Look them in the eye and promise everything. A Single Enemy within 4 tiles is Charmed for a round." The lore's compliance as a row; a T2 hard-CC that feeds Enthrall / Draining Embrace on succubus/siren/popstar teammates and sets up Take …

**Prism Lattice** `prismlattice`
- T4 **Shatter the Lattice** `raceShatterLattice` (F.g4) — T4 damage/aoe, arcane/magic, 100MP 2AP CD2, rng 0, self: every standing prism you own detonates in a 3×3 around itself for 80 magic in the current frequency (with its status: Burn 2 / DEF −1 / Slow 1), then the prisms are destroyed. "Eight panes. One note." Placement-scaled finisher (8 prisms = eight 3×3 blasts)

**Psychedelics** `psychadelic`
- T1 **Dosed** `raceDosed` (F.g2) — psychic/magic, 25MP 1AP, no CD, rng 3, single, 80 dmg, Slow 2 rounds. Desc: 'Something in the drink. Their feet stop agreeing with them.' The T1 setup for Bad Trip, Judgment/Star Decree/Tidal Slam teammates, and Ego Death.
- T3 **Contact High** `raceContactHigh` (F.g2) — psychic, 75MP 1AP, no CD, aura r2, no dmg: allies within 2 gain +1 M ATK and +1 SPD stage. Desc: 'Everyone in the tent is on something.' The caster-team rally (Telepathic Link is INT only); hippie/mushroom girl support row. SKEPTIC: was T2/50MP, renumbered to T3.

**Psychic Abilities** `psychic`
- T3 **Telekinetic Slam** `raceTelekineticSlam` (F.g9) — psychic/magic, 75 MP 1 AP, no CD, rng 4, single, 125 dmg, pullDistance 3, groundsFlyers; no status/finisher. Desc: "Grab them with your mind and drag them the whole way — through whatever is between you. Flyers come down first." The family had a shove (Kinetic Hurl) and a warp (Teleport) but no drag; Harvest Hook (T1 80 pull) / Siren Song (T1 pull 3) are the lower rungs elsewhere.

**Ropework** `ropework`
- T2 **Hogtie** `raceHogtie` (F.g7) — T2 effect/debuff, element -, 50 MP 1 AP, CD -, rng 1: an adjacent enemy is Rooted 2 and Staggered 1, no damage. Desc: "Hands and feet." Sets up Land Ho, Haymaker, High Noon.
- T3 **Rescue Line** `raceRescueLine` (F.g7) — T3 utility/pull (ally), element -, 75 MP 1 AP, CD -, rng 4: throw a rope to a friendly unit and haul it up to 3 tiles toward you, cleansing 1 debuff. Desc: "Grab hold."
- T4 **Round-Up** `raceRoundUp` (F.g7) — T4 movement/aoePull, element -, 100 MP 1 AP, CD3, self-aoe r2: every enemy within 2 is pulled 2 tiles toward the caster and Tethered 1, no damage. Desc: "Bring 'em in."

**Sasquatch Abilties** `sasquatch`
- T2 **Timber Stomp** `raceTimberStomp` (F.g5) — T2 damageEffect/aoe, earth/physical, 50 MP 1 AP, CD -, self-aoe r1, 100 dmg, Stagger 1, no finisher. Desc: "One foot down. Everything adjacent staggers." The setup for Sasquatch Smash; T2 area scale.

**Scarecrow Abilities** `scarecrow`
- T3 **Scare Off** `raceScareOff` (F.g1) — shadow, 75MP 1AP, no CD, rng 0, self r2, no dmg, Feared 1 + Discord 2. Desc: 'That is what it is for. Every enemy within 2 tiles is Feared for a round and shaken for two.' Reason: 'the T3 rung' (no rung reassignment named - scarecrow rung 3 is still sharedHexOfToil) and the thing a scarecrow does.

**Shadow** `shadow`
- T3 **Consuming Dark** `raceConsumingDark` (F.g1) — shadow/magic, 75MP 1AP, no CD, rng 4, 3x3, 125 dmg, no status, finisher Feared x1.5. Desc: 'The dark eats first what is already running. MEDIUM magic damage to a 3x3; Feared targets take it worse.' Reason: in-family payoff for Fear (T2); only Terror Pounce paid Feared.

**Street Smarts** `streetsmarts`
- T1 **Mean Mug** `raceMeanMug` (F.g8) — Id not given in the section (extractor-proposed raceMeanMug). No element, 25 MP 1 AP, no CD, rng 3, single, no damage, Discord 2 rounds (−2 ATK / −1 DEF). Desc: "Stare them down until they look away. A Single Enemy within 3 tiles is Discorded for 2 rounds." The family's own debuff (his Dirty Fighting debuffs are Grievous/Root/Silence); feeds Empty the Clip and Vehicular Manslaughter / Depth Charge / Bull Rush on …
- T4 **Empty the Clip** `raceEmptyTheClip` (F.g8) — metal/physical, 100 MP 1 AP, no CD, rng 4, lineWidth 3 (Tsunami's shape), 160 physical to every enemy in the 3-wide lane, finisher bonusVsStatus { status: ['discord'], mult: 1.5 }. Desc: "Hold the trigger down until it clicks. HEAVY physical damage to everything on a three-wide street in front of you — anyone already Discorded gets the rest of the belt." The choppa's escalation and the payoff for Mean Mug, instead …

**Symbiosis** `symbiosis`
- T1 **Tendril Whip** `raceTendrilWhip` (F.g6) — T1 damageEffect/damage, poison/physical, 25 MP / 1 AP, CD -, rng 2, single, 90 physical, applies Poison 2, NO drain, no finisher. Desc: "The suit lashes out two tiles. The barbs stay in." The family setup: Whip (Poison 2) → Symbiotic Drain (×1.5 vs Poisoned) → Tendril Strike (180, refreshes Poison).
- T2 **Web Swing** `raceWebSwing` (F.g6) — T2 movement/teleport, element -, 50 MP / 1 AP, CD -, rng 4, needs line of sight: fling a line of webbing and swing to any free tile within 4, no damage. Desc: "The line goes out, the host goes after it." Symbiote's clean close/escape (the family desc promised webbing).

**Teamwork** `teamwork`
- T1 **Tag In** `raceTagIn` (F.g7) — T1 movement/swap (ally only), element -, 25 MP 1 AP, CD2, rng 3: swap places with a friendly unit within 3, no damage. Desc: "Sub in. Sub out." Ally-only so it is not Skin Swap (T3).
- T4 **Everybody Up** `raceEverybodyUp` (F.g7) — T4 effect/warCry, element -, 100 MP 1 AP, CD3, aura r2: all allies within 2 get ATK +1, DEF +1 and are cleansed of every debuff. Desc: "On three." Sits above Oath of Valor (ATK +1 only, T3).

**Temporal Abilities** `temporal`
- T2 **Stutter** `raceStutter` (F.g4) — T2 effect/debuff, no element, 50MP 1AP, rng 4, single: Stagger 1 + Slow 1. "They drop a frame." Best pure setup row in the slice (Stagger 16 payoffs, Slow 8); the rabbit's assassin partner
- T3 **Time Rewind** `raceTimeRewindHeal` (F.g4) — T3 heal/heal, no element, 75MP 1AP, rng 3, single: heal 40% max HP and cleanse 99 ("restore them to the moment before"). Sustain for glitch / watcher / wraith / atlantean; watcher's new rung 3. Reuses the name "Time Rewind" freed by the Paradox rename

**Thievery** `thievery`
- T3 **Swipe** `raceSwipe` (F.g8) — Id not given in the section (extractor-proposed raceSwipe). metal/physical, 75 MP 1 AP, no CD, rng 2, single, 100 physical, then strips every buff status from the target and applies them to the caster (Spellsteal's stealSpell plumbing — raceSpellsteal — applied to buffs instead of spells). No finisher. Desc: "Bump, lift, gone. MEDIUM physical damage to a Single Enemy within 2 and every buff they were carrying is …

**Trap Making** `trapmaking`
- T2 **Scrap Mine** `raceScrapMine` (F.g4) — T2 deploy/deployObject, fire/physical, 50MP 1AP, rng 3, blast r1, hidden, max 2 per caster, hp 20: triggers on step for 100 physical in a 3×3 and Stagger 1. "Nails, powder, a spring. Cheap." Gnome's rung 2; goblin's Stagger setup for No Mercy / Body Check (harder-hitting cousin of Tesla Coil)
- T4 **Deathtrap** `raceDeathtrap` (F.g4) — T4 deploy/placeTrap, -/physical, 100MP 1AP, rng 4, hidden 3×3, max 1: the first enemy to enter drops the whole 3×3 two levels — 120 physical + fall to everyone inside, Rooted 2 (they are in a pit). "Do not stand anywhere." The room-sized Trapdoor; combos with Gravity Crush / Undertow teammates

**Trickery** `trickery`
- T1 **Misdirection** `raceMisdirection` (F.g9) — Element not stated. 25 MP 1 AP, no CD, rng 3, single, no damage, Blind 1 (attacks miss 50%). Desc line: "Look — over there." The family's cheap setup; Haunt (T1 Haunted 3) and Red Eyes (T1 Marked) are the T1-debuff comparables.
- T1 **Sucker Punch** `raceSuckerPunch` (F.g9) — physical (element not stated), 25 MP 1 AP, no CD, rng 1, single, 100 dmg, finisher Blind ×1.5; no status. Desc line: "They never saw it coming. Literally." Gives Blind its first payoff anywhere: Misdirection here, Glitter Bomb in Fae (fairy has both), Shattered Mirror in Mirror Magic (rabbit has both), Pepper Spray (police).

**Unethical Science** `unethicalscience`
- T1 **Vivisection** `raceVivisection` (F.g4) — T1 damageEffect/damage, poison/magic, 25MP 1AP, rng 2, single, 100 magic, Grievous 2 (healing halved). "For science. Hold still." The scientist's T1 in his own family + an anti-heal nobody else on the space faction has

**Vampiric Abilities** `vampiricabilties`
- T1 **Hypnotic Gaze** `raceHypnoticGaze` (R.2) — element not given · 25MP 1AP CD2 · rng 3 · single · no dmg · charm 1 — the vampire's stare; a soft control row a T1 pool lacks; Soul Suck already hands out Charm 1 at T1, so the tier holds

**Water Abilities** `water`
- T1 **Tide Pool** `raceTidePool` (R.2) — water · 25MP 1AP · no CD · rng 3 · single (ally) · heal 140 + cleanse 1 — Heal T1 is 192, so it sits under the line and the cleanse is the trade

**Werewolf Powers** `werewolf`
- T2 **Claw Sweep** `raceClawSweep` (F.g5) — T2 damageEffect, -/physical, 50 MP 1 AP, CD -, self-aoe r1, 100 dmg, Grievous 2, no finisher. Desc: "Both arms, every direction. MEDIUM physical damage to everything adjacent, and none of it heals right." AOE + debuff in one row (under Tremor Stomp 125).
- T3 **Lunar Regeneration** `raceLunarRegeneration` (F.g5) — T3 heal/selfHeal, element -, 75 MP 1 AP, CD -, self: heal 25% max HP + Regen 2 rounds + cleanse 1. Desc: "The wounds close while you watch." (Carrion Feast T3 is 25% flat.)

**Wind Control** `wind`
- T2 **Gale** `raceGale` (F.g1) — wind/magic, 50MP 1AP, no CD, rng 4, line w1, 100 dmg, push 3, no status. Desc: 'One long breath down the row. MEDIUM magic damage to everything in the line, and all of it three tiles further from you.' Reason: 'the T2 rung' (no rung reassignment named) and the family ranged shove.
- T2 **Updraft** `raceUpdraft` (F.g1) — wind, 50MP 1AP, no CD, rng 3, single ally, no dmg: Levitating 2 rounds and +1 MOV for 2 rounds (flat statBonus, not a stage). Desc: 'Give them the sky. One ally is Levitating for 2 rounds — flight, the high-ground bonus, and a little more reach.' Reason: the flight the family desc promises (Fairy Dust is the aura version).

**Winter Warfare** `winter`
- T2 **Snow Fort** `raceSnowFort` (F.g1) — ice (no damage type), 50MP 1AP, no CD, rng 3, tiles3, terrainType snow_wall (height +1, blocks LOS, melts after 3 rounds), no damage. Desc: 'Pack it, stack it, duck. Three tiles of snow wall — cover for three rounds, then a puddle.' Reason: 'the T2 rung' (no rung reassignment named) and Winter's tactical piece (a cheap Rampart that expires).
- T3 **Glacial Slam** `raceGlacialSlam` (F.g1) — ice/physical, 75MP 1AP, no CD, rng 0, self 3x3, 125 dmg, Slow 2, finisher Frozen x1.5. Desc: 'Bring both fists down. MEDIUM physical damage to everything around you, all of it Slowed — and anything Frozen shatters.' Reason: 'the T3 rung' (no rung reassignment named) and the area shatter inside a Permafrost/Flash Freeze.

**Witchcraft** `witchcraft`
- T1 **Evil Eye** `raceEvilEye` (F.g3) — T1 damageEffect, shadow/magic, 25MP 1AP, rng 4, single, dmg 80, Hexed 2. Desc: "One look is enough. Deals WEAK magic damage and Hexes the target for 2 rounds." Cheap setup/poke for the fortune teller; feeds Hocus Pocus, Crow Storm, Crystal Ball, Exorcism

**Zombie Behavior** `zombie`
- T1 **Grab** `raceGrab` (F.g3) — T1 damageEffect, -/physical, 25MP 1AP, rng 1, single, dmg 80, Root 1. Desc: "The hands do not let go. Deals WEAK physical damage and Roots the target for a round." Cheap opener; affordable even at 70 MP

128 new rows.

### 6.4 The passive layer and the upgrade registry

**Family passives.** A passive row is a `SPELL_BY_ID` row with `kind: 'passive'`, a tier (= its SP) and exactly ONE
family (rule 2); a kit holds at most two passive rows, so each one competes with the 16 GEAR and 13 TRAINING rows every
unit already has. The plan gives a family **at most one** passive, owned by its family block; synergy's cross-family
passives are homed in the one listed family that had none (the others still reach it by wearing that family). Hook
status: **LIVE** = every key is in `PASSIVE_HOOK_KEYS` today (data-only, Batch C); **PARTIAL** = the live part ships now,
the rest needs a key (Batch D); **NEW** = needs engine work (Batch D).

| Passive | Family | SP | Effect | Hooks | Status | Source |
|---|---|---|---|---|---|---|
| Cinder Touch | Fire Magic | 1 | basic attacks are fire-element and apply Burn 1 | `physicalElementRider: 'fire'` + `physicalHitStatus: {burn, 1}` | LIVE | F.g1 |
| Snowborn | Ice Magic | 1 | +1 M ATK stage in a blizzard; immune to the blizzard's blind; no sliding on ice | `weatherBonus` (live) + blind / slide immunity (new) | PARTIAL | F.g1 |
| Live Wire | Lightning Magic | 1 | basic attacks are lightning-element — so a Soaked target takes ×1.5 through the live combo layer | `physicalElementRider: 'lightning'` | LIVE (★ the "Stagger a Wet target" clause is dropped: the combo layer already pays Wet) | F.g1 |
| Gills | Water Abilities | 1 | swims; +1 SPD stage in water; regen 5% in water | `swim`, `terrainBonus` (live) + conditional regen (new) | PARTIAL | F.g1 |
| Mountainborn | Earth Abilities | 1 | no elevation move cost; +10% from high ground; terrain cannot displace it | new | NEW | F.g1 |
| Windborne | Wind Control | 1 | +20 SPD (one MOVE band); push / pull cannot move it | `statBonus` (live) + push immunity (new) | PARTIAL | F.g1 |
| Photosynthesis | Nature Magic | 1 | regen 5% while on grass / forest | conditional regen | NEW | F.g1 |
| Venomous | Poison Abilities | 1 | basic attacks apply Poison 1 | `physicalHitStatus: {poison, 1}` | LIVE | F.g1 |
| Consecrated | Light | 1 | once per life under 35%: heal 20% (and shed 1 debuff) | `healOnceBelowPct` (live) + the cleanse (new) | PARTIAL | F.g1 |
| Umbral | Shadow | 1 | the first basic attack each round while Invisible is a crit | new (`guaranteedCrit` does not exist) | NEW | F.g1 |
| Resonant Voice | Sonic | 1 | +1 range on Sonic spells | `rangeBonus` is global today; family scope new | PARTIAL | F.g1 |
| Mana Font | Arcane Magic | 1 | +10 MP at end of round | flat MP regen | NEW | F.g1 |
| Sanguine | Blood Magic | 1 | heal 6% at end of a round in which it dealt damage | conditional regen | NEW | F.g1 |
| Thick Fur | Winter Warfare | 1 | immune to Frozen; +1 SPD stage in a blizzard | `immuneStatus: ['frozen']`, `weatherBonus` | LIVE | F.g1 |
| Spirit of Giving | Christmas Spirit | 1 | adjacent allies regen 3% | aura regen | NEW | F.g1 |
| Fertile Ground | Agriculture | 1 | seeds sprout a round sooner; trees +50% HP | `seedBonus` | NEW | F.g1 |
| Restuffing | Scarecrow Abilities | 1 | regen 5% a round | `regenPerRound: 5` | LIVE (★ the "while not Burning" clause dropped) | F.g1 |
| Triage | Healing Magic | 1 | once per life under 40%: heal 30% | `healOnceBelowPct` | LIVE | F.g2 |
| Star Chart | Fortune Telling | 1 | +1 M ATK stage while her own sign rules the sky | `zodiacBonus: {own: {intStages: 1}}` | LIVE | F.g2 |
| Slow Rot | Zombie | 1 | regenerates 3% max HP a round ("it keeps getting up") | `regenPerRound: 3` (★ F.g3 wrote "16 HP"; the hook is % of max) | LIVE | F.g3 |
| Terminally Online | Internet Addiction | 1 | +14 AWR, +40 MP | `statBonus` | LIVE | F.g4 |
| Keen Nose | Beast Abilities | 1 | reveals invisible enemies within 2; +14 AWR | `revealInvisibleWithin`, `statBonus` (★ both live — F.g5 called them new) | LIVE | F.g5 |
| Unweathered | Living Stone | 1 | immune to Burn; +5 armor | `immuneStatus`, `armor` (★ both live) | LIVE | F.g5 |
| Deep Adapted | Deep Sea Anatomy | 1 | +1 DEF and +1 SPD stage in water | `terrainBonus` | LIVE | F.g6 |
| Chitin Armor (was the T2 spell) | Insectoid Anatomy | 2 | +8 DEF, immune to Stagger | `statBonus`, `immuneStatus` | LIVE | F.g6 |
| Symbiote Armor (was the T2 spell) | Symbiosis | 2 | once per life under 40%: heal 30% | `healOnceBelowPct` | LIVE | F.g6 |
| Second Wind | Human Grit | 2 | once per life under 35%: heal 30% | `healOnceBelowPct` | LIVE | F.g7 |
| Rising Power | Ki Energy | 2 | +1 ATK stage every 3 rounds, lost on death | `stagePerRounds`, `resetOnDeath` | LIVE | F.g7 |
| Cheap Shot | Dirty Fighting | 2 | every physical hit leaves Grievous 1 | `physicalHitStatus` | LIVE | F.g7 |
| Sea Legs | Piracy | 1 | swims; +1 ATK / DEF stage in water | `swim`, `terrainBonus` | LIVE | F.g7 |
| Overwatch | Marksmanship | 1 | basic attacks +1 range; +14 AWR | `basicAttackRangeBonus`, `statBonus` | LIVE | F.g8 |
| Ballistic Vest | Police Training | 1 | +5 armor; once per life under 30%: heal 25% | `armor`, `healOnceBelowPct` | LIVE | F.g8 |
| Foresight | Temporal Abilities | 2 | allies within 2 cannot be crit | `allyNoCritWithin` | NEW | R.4 |
| Aftershock | Giant Abilities | 2 | Stagger this unit applies lasts +1 round | per-status duration (`debuffTurnsBonus` is global today) | NEW | S (★ homed in titan; was earth / titan / kaiju) |
| Ambush | Hunting Skills | 2 | first damaging spell or basic out of Invisible +40% | `invisibleStrikeBonus` | NEW | S (★ homed; was 5 families) |
| Foreman | Engineering | 2 | deployables +40 HP / +20 dmg | `deployStatBonus` | NEW | S (★ homed) |
| Faraday Cage | Robotic Hardware | 1 | immune to Jammed; jammed enemies within 2 take 20 a round | `immuneStatus` (live) + `auraTick` (new) | PARTIAL | S (★ homed; replaces F.g4's Backup Battery, struck — its "+50 MP so Kill Mode is castable" rests on the base-MP error, §5) |
| Chorus | Stage Presence | 2 | Discord it applies +1 round; +8 INT | `statBonus` (live) + per-status duration (new) | PARTIAL | S (★ homed; sonic keeps Resonant Voice) |
| Hex Weaver | Witchcraft | 2 | Hexed targets take +25% magic from it; a hex jumps on death | `finisherBonus`, `spreadOnDeath` | NEW | S (★ homed; absorbs S's Echoing Hex upgrade) |
| Bloodlust | Vampiric Abilities | 2 | drains heal ×1.5; a kill raises ATK 1 stage | `lifeSapMult` (live) + on-kill stage (new) | PARTIAL | S (★ homed) |
| Choir | Heavenly Duties | 2 | heals +15%; healing a Blessed ally cleanses 1 | `healMult` (live) + `healRider` (new) | PARTIAL | S (★ homed in angelic) |
| Deep Breath | Jellyfish | 1 | swims; +1 SPD stage in water; enemies hit in water are Slowed | `swim`, `terrainBonus` (live) + hit rider (new) | PARTIAL | S (★ homed) |
| Event Horizon | Cosmic Abilities | 2 | Cosmic pull rows also Stagger | `pullRider` | NEW | S |
| Pack Tactics | Apex Predator | 2 | +15% vs a target adjacent to another ally | `flankBonus` | NEW | S (★ homed) |
| Showmanship | Seduction | 1 | Charm +1 round; charmed enemies −1 ATK stage | per-status duration + charm rider | NEW | S (★ homed; stage presence took Chorus) |
| Pathfinder | Athleticism | 1 | dash / leap rows +1 range, path damage +30% | `dashRangeBonus`, `dashDamageMult` | NEW | S (★ homed) |
| Iron Discipline | Military Combat | 1 | counter 30%; allies within 2 +5 DEF | `counterChance` (live) + stat aura (new) | PARTIAL | S (★ homed) |

47 family passives: 20 LIVE, 11 PARTIAL, 16 NEW. **Not adopted** (§11): S's Brittle (Ice's frozen payoff is F.g1's NEW
Shatter spell; Ice's passive is Snowborn), Septic (Poison has Venomous), Kindling (Fire has Cinder Touch), Cold Blood
(= Snowborn), Heavy Bones (its "half MP" half rests on the base-MP error; Earth / Titan / Living Stone are homed), S's
Second Wind (= F.g7's), F.g4's Backup Battery (base-MP error), F§'s Grim Resolve (F.g1 deletes the row) and Plot Armor
(F.g9 keeps it a spell).

**New upgrade rows.** Upgrades may name several families (`families: []`), so these keep their scope. **LIVE** = the
patch uses a key `_upgApplyPatch` / `SPELL_UPGRADE_FITS` read today. The single engine change that unlocks the most
content is an **`addStatus: {id, duration}` patch key** (the upgraded row also applies that status): eight upgrades
below use it. Per-row upgrade lists (which shipped upgrades each row takes or blocks — 151 entries across the family
blocks) are Spell Library configuration, applied row by row from the blocks' "Upgrades" lines; they are not repeated.

| Upgrade | Families | SP | Patch | Status | Source |
|---|---|---|---|---|---|
| Exploit: Marked | weaponstraining, spygear, marksmanship, mothman, artificialintelligence, ufo, infernalcourt | 1 | `statusBonus: {status: 'marked', mult: 1.5}` (the hit already consumes the mark) | LIVE | S |
| Frostbite (★ renamed from S's "Shatter" — F.g1 adds a spell named Shatter) | ice, winter, christmasspirit, haunted | 2 | `statusBonus: {status: 'frozen', mult: 1.5}`; "+50 and thaw" part new | PARTIAL | S |
| Encore Performance | stagepresence | 2 | `cooldownDelta: -1`, requires `cooldown` (★ both live — F.g9 called them new) | LIVE | F.g9 |
| Counterspell | arcane | 2 | `cooldownDelta: -1` on Spellsteal | LIVE | F.g1 |
| Grievous | dirtyfighting, ghoulish | 1 | `addStatus: {grievous, 2}` | NEW key | F§ |
| Overcharged | robot, cyberpunkweapons, artificialintelligence | 1 | `addStatus: {jammed, 1}` | NEW key | F§ |
| Venom Coat (★ absorbs F.g6's Envenomed Mandibles and F.g8's Poisoned Tips) | beastabilities, insectoid, arachnid, ghoulish, feline, archery | 1 | `addStatus: {poison, 2}` | NEW key | S + F.g6 + F.g8 |
| Incendiary | weaponstraining, archery, cyberpunkweapons, mecha | 1 | `addStatus: {burn, 1}` | NEW key | S |
| Concussive (★ absorbs F.g8's Danger Close) | earth, titan, kaiju, dirtyfighting, horns, athleticism, militarysupport | 2 | `addStatus: {stagger, 1}` | NEW key | S + F.g8 |
| Fairy Fire | fae | 1 | `addStatus: {blind, 1}` (★ F.g9 wrote `statusAdd`) | NEW key | F.g9 |
| Sticky | ooze | 1 | `addStatus: {goo, 1}` | NEW key | F.g6 |
| Anoint (★ renamed from S's "Consecrate") | light, angelic, biblestudy, holydefense | 1 | a heal or shield row also applies Blessed 1 (`addStatus` on heal rows) | NEW key | S |
| Reinforced (★ F§ + F.g2 merged) | holydefense, light, psychic | 1 | +60 shield; needs a `shieldHp` fit test and a `shieldDelta` patch | NEW | F.g2 + F§ |
| Sanctified Ground (★ renamed from F.g2's "Consecrated" — the name is Light's passive) | angelic | 2 | `aoe: {preset: '5x5'}` on Purify / Sanctuary; needs an `areaAny` fit (Widen tests damage) | NEW | F.g2 |
| Armor-Piercing | weaponstraining | 2 | `ignoreArmor: true` (the patch switch has no case) | NEW | F.g8 |
| Steady Rest | marksmanship | 1 | `actedTargetBonus: 30` (the row field is read; the patch is not) | NEW | F.g8 |
| Loaded Dice | gambling | 1 | +15% crit chance on the row | NEW | F.g9 |
| Barbed Rope | ropework | 1 | tethered drag 20 → 35 a tile | NEW | F.g7 |
| Undertow Charge | deepsea | 1 | `pullToCenter` on Depth Charge | NEW | F.g6 |
| Tripwire | trapmaking | 1 | traps trigger on adjacent passers | NEW | F.g4 |
| Tempered Glass | prismlattice | 1 | prisms take 3 hits | NEW | F.g4 |
| Soul Tax · Blood Price · Grave Robber · Calcium · Bottomless | demonicabilities · blackmagic · necromancy · bonedensity · ghoulish | 1–2 | one-row number changes (Void Contract drain 0.8; Baphomet's Rite 25% HP → 190; Raise Dead 5 hits; Reassemble 40% + cleanse; Carrion Feast CD 0) — needs a generic `set: {field: value}` patch | NEW | F.g3 |
| Restless · Nightfeeder | haunted · vampiricabilties | 1 | Haunted jumps on death; Bat Swarm drain 45% in Blood Rain | NEW | F.g3 |
| Conductive · Reprise | lightning · sonic | 1–2 | chain +1 hop vs Wet; Anthem also grants Encore's AP | NEW | F.g1 |
| Hush · Tidewater · Daisy Chain · Detonate · Overdrive | (S §5 scopes) | 1–2 | silence the Discorded; leave water; arc on Jammed; blow a deployable; dash refunds 1 AP on a kill | NEW | S |

**Not adopted** (§11): F§'s Contagious (Family Curse is itself the 3×3 hex row now, F.g3), S's Echoing Hex (= Hex Weaver's
spread), F.g1's Bedrock and Contagion (unit-level rules, not spell patches — and Earth / Poison have their passive).

### 6.5 Engine work — what the plan needs from the code, and what it does not

Every engine ask in the 15 sections, de-duplicated and checked against the 2026-09-30 code. Anything that makes a new
on-screen moment (a zone tick, a decoy, a detonation, a floating text) must be relayed to the online guest (RULE #2:
host `_emit('relay', …)` + a guest handler in online.js); anything that adds a `state.*` field checks `_serializeState`.

**Already true — the asks are dropped (the sections read the data, not the engine):**

| Ask | What the code already does |
|---|---|
| "Wet does nothing / give Wet a meaning" (F §3, F.g1, S §1) | The elemental combo layer (battle.js "SOAKED (wet)"): Soaked units take lightning ×1.5 and fire ×0.75, cannot burn, and frost flash-freezes them (Stun 1); every water-element hit soaks, and so does standing in water. The `bonusVsStatus: wet ×1.5` finishers S proposed on lightning rows would stack to ×2.25 — **not adopted**. |
| "Make `requiresFlight` accept Levitating" (S §2.11) | map.js `canFly` returns true while Levitating, and every `requiresFlight` gate calls it. Fairy Dust → Stone Drop / Dragon Toss / Descending Wrath on a non-flyer works today; write it in Fairy Dust's text. |
| "Verify Corroded counts as Burn and Poison" (S §1) | STATUS_DEFS `corroded.countsAs: ['burn','poison']`, honoured by the payoff check. |
| "Verify Incendiary Rounds burn" (R.1) | STATUS_DEFS `incendiary.basicAttackStatus: {burn, 2}`, read on every landed basic. The general IS self-contained. |
| "New `immuneStatus` / `armor` / `revealInvisibleWithin` hook keys" (F§, F.g5) | All three are in `PASSIVE_HOOK_KEYS`. (A SPELL that grants a timed status immunity — Chitin Armor's old rewrite — would be new; the plan makes Chitin Armor a passive instead.) |
| "New `cooldown` fit / `cooldownDelta` patch" (F.g9) | Both exist. |
| "Floor base MP at 100 / pin bruiser T4s" (S §4) | Not needed: level-100 MP is base + 100 (§5). |

**Dead fields — delete the field or wire it (Batch A unless noted):**

| Field | Rows | Plan |
|---|---|---|
| `guaranteedCrit` | Dead Eye, High Noon | Delete the field and the "always crits" sentence; Dead Eye keeps 180 (+ Marked per F.g8), High Noon keeps its no-LoS shot and drops to 1 AP (F§). S's "Marked = the next hit is a guaranteed crit" engine rule is **not adopted**: Marked already pays +40 on the next hit, and the Exploit: Marked upgrade (§6.4) is the finisher. |
| `executeBonusPct` | Weigh the Heart, No Mercy | Weigh the Heart: **wire it** (F.g2, Batch D) — ×1.5 below 50% HP, one read beside `unholyBonus` in `_applyDamageSpellHit`. No Mercy: F.g7's rewrite names `executePct`, which battle.js reads ONLY inside Walk the Plank's terrain flow — ★ use the live `executeBelowPct: 0.25` instead (Take Aim's key, judged before the hit). |
| `bonusVsDebuffed` | Recursive Loop, Dark Justice | Replace with a real `bonusVsStatus` list (F.g4 / F.g7 / F§ §3 — data only). |
| `bonusVsUnholy` | Smite | Rename to the live `unholyBonus` and write the sentence (F§ §3). |
| `selfCenter`, `lineLength`, `equipReq`, `equipCost`, `slotCost` | Ground Slam, Cosmic Slam, Plasma Whip, Knife Throw, Sneak Slash … | Delete (noise). Plasma Whip's "length 3" is expressed with a 3-tile `aoeMask` line, not `lineLength`. |
| `healOnSwap` | Miracle (Wings of Mercy) | F.g2 found it read by nothing: wire it (Batch D) or delete the number from the text. |
| `zoneDuration` on a plain `aoe` | Heat Death | F.g4 makes the zone real (below); until then the field is dead. |
| Soul Bind's 45% clause | Soul Bind | Keys off an INT stage no carrier has (F.g3): rewire to "while the binder is Contracted". |
| Scanner (status) | System Analysis | Display-only (read by nothing). ★ System Analysis applies Marked 2 instead (keeps F.g4's M DEF −1) — the setup for F.g4's Recursive Loop. |
| duplicate `raceAbsolution` | data.js | Two definitions; the seraphim one is dead (F.g2) — keep one. |

**New spell-row mechanics (Batch D), each named by the section that needs it** (F§'s `onDeathApplyStatus` for Death Pact and
`statusByTargetType` for Neural Hack are not needed: F.g3 rewrote Death Pact without it and F.g4 deletes Neural Hack):

| Key / mechanic | Needed by | Section |
|---|---|---|
| damage zone ticks (`zoneTickDamage`: X to every enemy inside at end of round for N rounds) | War of the Worlds (100 × 2 rounds, 5×5), Heat Death (70 × 2 at T3) | F.g4 |
| `aoeLifeDrain` (heal a % of the total dealt to all targets) | Bat Swarm 30%, Nightmare Pulse 25% | F.g3 |
| on-cast damage on a zone debuff | Outbreak (80 on cast + the Poison zone) | F.g3 |
| `stageIfBelowPct` | Sad Backstory (ATK +2 below 50%) | F§ |
| `statusIfTargetHas` | System Crash (Stagger only the Jammed) | F.g4 |
| `mpDrain` | Memory Leak (the target loses 30 MP) | F§ |
| `selfStageBoost` + buff steal | Swipe (the caster takes the stage the target loses) | F.g8 |
| `stageHigherOf` | a self buff that raises the higher of ATK / INT | F.g3 |
| `bonusHitsPerAdjacentAlly` | Team Strike | F.g7 |
| `healBonusVsStatus` | Hallelujah (×1.5 on Blessed allies) | F.g2 |
| `summonDef.hitStatus` / `summonDef.trailTerrain` | Brood drone (Poison 2), the Blob (ooze trail) | F.g6 |
| prism detonation | Shatter the Lattice | F.g4 |
| `snow_wall` terrain | Snow Fort | F.g1 |
| Scatter Shot's extra victims ignore LoS | Scatter Shot | F.g8 |
| `spawnDecoy` outside the escape kind | Mimicry | F.g9 |
| a finisher on `wet` reads "Soaked" (`_unitIsSoaked`), not just the status | Nematocyst Net (jellyfish's own loop) | F.g6 |
| the seed rows' real numbers surfaced; Thunderstorm / Blood Rain weather rules written | Healing Seed …, Summon Thunderstorm, Summon Blood Rain | F.g1 |

**New passive hook keys (Batch D):** the NEW / PARTIAL rows of §6.4 — per-status duration (`statusDurationBonus`),
`invisibleStrikeBonus`, `deployStatBonus`, `auraTick`, `finisherBonus`, `spreadOnDeath`, on-kill stage, `healRider`,
water-hit rider, `pullRider`, `flankBonus`, charm rider, `dashRangeBonus` / `dashDamageMult`, stat aura, flat MP regen,
conditional regen (terrain / weather / dealt-damage / aura), `seedBonus`, `allyNoCritWithin`, invisible crit, push
immunity, blind / slide immunity, family-scoped `rangeBonus`.

**New upgrade patch / fit keys (Batch D):** `addStatus` (one key, eight upgrades), `shieldHp` fit + `shieldDelta`,
`areaAny` fit, `ignoreArmor`, `actedTargetBonus`, `critChanceAdd`, `tetherDragDmg`, `pullToCenter`, a generic
`set: {field: value}` for the one-row F.g3 upgrades, trap trigger radius, prism hit count, weather-conditional patches,
Surplus on door rows raising the SHARED standing-door cap (F.g7), a family-scoped `excl` rule (F.g5), a status fit that
also reads `teamStatusEffects` (F.g2), and Exploit excluded on Enthrall's pre-baked ×2 (F§). Cleanup: remove the
orphaned `lullabyRangeBonus` hook and its battle.js read (F.g9).

## 7. Race pools after the plan

All 124 races. Families: kept · **+added** · ~~removed~~. Pool = rows in the race's families after the plan (tiers T1/T2/T3/T4,
passive rows not counted in the tiers). Rungs: only the ones that change. Identity: the race block's one line (R.1–R.4),
written before the reconciliation. A row marked † is not in this race's own family pool after the plan — deleted, moved, its
family left, or the line names a teammate's row or a universal GEAR / TRAINING row; check §6.2 before relying on it.

| Race | Class | Families after | Pool before → after | Tiers after | Rung changes | Identity |
|---|---|---|---|---|---|---|
| AI `ai` | specialist | Artificial Intelligence · Computer Hacking Skills · **+Engineering** · ~~Internet Addiction~~ | 10 → 16 | 3/4/4/3 | — | jam engine: Memory Leak/Neural Hack† → Crash Loop, Predictive Model → Recursive Loop, turrets + Firewall hold the line, Singularity pulls the clump |
| Android `android` | assassin | Robotic Hardware · Computer Hacking Skills · Robotic Weapons · **+Trickery** | 18 → 24 | 7/6/6/4 | 3: Neural Hack → Blue Screen | jam-payoff duelist: Memory Leak/Neural Hack† set, Synthetic Blade/Punch/Crash Loop pay, Self-Repair† sustains, Shed Skin decoy out, Mimicry for the last fight |
| Angel `angel` | healer | Heavenly Duties · Light · Healing Magic · ~~Wind Control~~ | 21 → 20 | 4/6/7/3 | 1: Radiant Bolt → Divine Light | zone healer: Sanctuary + Heal All + Miracle keep a melee team standing, Divine Light heals and burns the adjacent, Purify cleans both sides, Divine Smite vs the unholy |
| Annunaki `annunaki` | ranged | Cosmic Abilities · Ancient Knowledge · **+Alien Weapons** · ~~Earth Abilities~~ · ~~Marksmanship~~ | 27 → 23 | 6/4/10/3 | — | gravity artillery — Gravity Well cluster-and-slow, Pyramid Protocol to shape lanes, Star Decree / Entropic Beam Slow finishers, Heat Ray for a physical poke. |
| Antihero `antihero` | hybrid | Dirty Fighting · Superhero Powers · **+Spy Gear** · **+Human Grit** · ~~Cosmic Abilities~~ | 23 → 23 | 6/8/5/4 | 3: Cosmic Slam → Shockwave Clap | stagger→No Mercy execution bruiser with a spy's opener — Smoke Screen/Agent Vanish invisible → Sneak Slash, Cosmic Slam† stagger → Body Check / No Mercy ×1.5 (Body Check is a stagger payoff, not a … |
| Antperson `antperson` | bruiser | Insectoid Anatomy · Poison Abilities · Teamwork · Agriculture | 16 → 23 | 8/4/5/4 | — | swarm bruiser — Encore / Swarm Signal feed the team's damage, Formic Acid shreds DEF, Venom Fang in melee; the tunnel pair moves the squad. |
| Anubis `anubis` | caster | Ancient Knowledge · Necromancy · Desert Acclimation | 10 → 16 | 3/4/6/3 | — | judge of the dead — Rigormortis / Mummify Root into Life Drain, Weigh the Heart executes the low-HP target, Sandstorm blinds the field for the team. |
| Astronaut `astronaut` | ranged | Hidden Technology · Cosmic Abilities · **+Human Grit** · ~~Astronaut Camp~~ · ~~Athleticism~~ | 21 → 21 | 6/3/9/3 | 2: Gravity Boots → Phase Walk | the gravity ranged — Gravity Well / Gravity Crush pin and ground flyers, Deneuralizer → Railgun ×1.5 down the line; Sealed Suit walks the poison swamp. |
| Atlantean `atlantean` | support | Water Abilities · Arcane Magic · **+Temporal Abilities** · **+Ancient Knowledge** · ~~Ice Magic~~ | 20 → 25 | 5/7/9/4 | 4: Tsunami/Call of the Deep → Tsunami/Great Flood | zone healer + wave controller — Tidal Blessing instant heal/cleanse, Temporal Tide heal zone, Water Pulse/Tsunami shove lanes, Temporal Shift swap-saves, Whirlpool slow → Tidal Slam ×1.5 … |
| Barbarella `barbarella` | assassin | Alien Weapons · Seduction · **+Spy Gear** · ~~Astronaut Camp~~ | 11 → 19 | 5/7/4/3 | 1: Stun Ray → Heat Ray; 4: Draining Embrace → Sneak Slash | charm assassin — Stun Ray stun, Charm → Enthrall steals a double activation, Poison Dart → Sneak Slash from Agent Vanish's invisibility finishes (Draining Embrace for an INT build); Gravity Boots + … |
| Bee Queen `bee queen` | caster | Insectoid Anatomy · Poison Abilities · Agriculture · Teamwork | 16 → 23 | 8/4/5/4 | 1: Venom Fang → Corrosive Splash; 2: Chitin Armor → Brood; 3: Splash → Rot | the swarm summoner — Brood drones under Swarm Signal (+2 ATK, +1 MOV), Team Strike +27 per adjacent body, Corrosive Splash → Miasma ×1.5; Royal Jelly lets her stand in her own Poison Swamp. |
| Bigfoot `bigfoot` | bruiser | Sasquatch Abilties · Nature Magic · Cryptid Abilities · **+Athleticism** · ~~Agriculture~~ | 12 → 17 | 4/6/3/4 | 2: Blurry Photo/Treeline Retreat → Cryptid Vanish/Treeline Retreat; 3: Trunk Throw → Entangling Roots | stealth bruiser: Blurry Photo†/Treeline Retreat vanish-and-regen, Dread Aura discord on the clump, Wood Knock taunts onto 700 HP, a teammate's stagger → Sasquatch Smash |
| Black Goo `black goo` | specialist | Ooze Biology · Poison Abilities · **+Symbiosis** · ~~Alien Weapons~~ | 16 → 18 | 7/4/3/3 | 3: Splash/Toxic Nova → Rot/Toxic Nova | goo engine — Goo Shot/Splash goo the target (heals halved, magic ×1.25) → Absorb ×1.5 (poison OR goo) / Symbiotic Drain ×1.5 (poison only — Toxic Nova/Corrosive Splash supply it) and every magic … |
| Bunny Girl `bunny girl` | support | Seduction · Athleticism · Trickery · **+Gambling** · ~~Stage Presence~~ | 18 → 21 | 7/5/5/4 | 1: Mic Drop → Dead Man's Hand; 3: Spotlight → Double Down | the charm-and-mark support — Charm → Enthrall / Soul Suck / Draining Embrace, Stacked Deck calls the focus fire, Nimble Dodge out when the table turns. |
| Catgirl `catgirl` | assassin | Feline Anatomy · Athleticism · Seduction | 11 → 14 | 4/4/3/3 | — | hit-and-run melee assassin — Charm into Ninefold Scratch, Nimble Dodge out, Meow shreds DEF for the whole team. |
| Chosen One `chosen one` | assassin | Main Character Energy · Light · **+Shadow** · ~~Psychic Abilities~~ | 21 → 23 | 5/7/8/3 | 4: Migraine → Roll Credits | glass-cannon skirmisher — Dark Feather poison + Prophecy Fulfilled overclock → Shadow Step → Season Finale; Plot Armor/Protect/Phase Shift keep 390 HP alive long enough for the destiny moment. |
| Clown `clown` | assassin | Trickery · Dirty Fighting · Shadow · ~~Stage Presence~~ | 24 → 22 | 7/6/6/3 | — | the fear-and-blind assassin — Misdirection → Sucker Punch ×1.5, Fear → a teammate's Terror Pounce† / Out of the Dark†, Body Check → Curb Stomp / No Mercy, Shadow Step and Trick Room for the joke only … |
| Conspiracy Theorist `conspiracy theorist` | support | Conspiracy Knowledge · Hidden Technology · **+Deep State Connections** · Internet Addiction | 9 → 16 | 5/4/5/2 | — | silence/poison/jam setup support — Fluoride Water silence + Chemtrails poison feed Flat Earth ×1.5, Deneuralizer jammed feeds Classified Weapon and any Railgun teammate; Free Energy refuels the … |
| Cosmic Wraith `cosmic wraith` | ranged | Cosmic Abilities · Shadow · Temporal Abilities · ~~Marksmanship~~ | 26 → 25 | 5/7/10/3 | — | entropy artillery — Gravity Well / Black Hole cluster-and-slow into Entropic Beam / Star Decree / Heat Death, Phase Walk / Shadow Step to reposition, Judgment Beam DEF-shred. |
| Cowboy `cowboy` | ranged | Cowboy Skills · Hunting Skills · Gun Training · Ropework · ~~Horseback Riding~~ | 18 → 18 | 5/5/5/3 | 3: Long Rifle/Whistle → Whistle | rope-and-shoot ranged: Lasso drags and holds one target, Dynamite staggers the clump, High Noon deletes the tethered/staggered target through walls; the hound sniffs out invisibles |
| Crystal Guardian `crystal guardian` | tank | Living Stone · Prism Lattice · Holy Defense · Earth Abilities | 23 → 23 | 6/8/5/4 | 4: Rampart → Petrify | the doorkeeper — Shield Maiden taunts (g2 rewrite), Holy Bulwark shields the line, Rampart walls the doorway, Petrify / Calcify shut the casters down, the prism lattice turns the doorway into a kill … |
| Cult Leader `cult leader` | support | Cult of Personality · Meditation · **+Black Magic** · ~~Temporal Abilities~~ · ~~Persuasion~~ · ~~Healing Magic~~ | 12 → 13 | 3/4/3/3 | 1: Judgment Beam → Tithe | the possession engine — Kool-Aid → Indoctrinate for two activations, cult members as bodies, Voodoo tying their bruiser to your tank; pairs with Seduction's Charm† payoffs. |
| Cyborg `cyborg` | bruiser | Robotic Weapons · Robotic Hardware · Human Grit | 17 → 14 | 4/4/3/3 | 1: Synthetic Punch → Rocket Fist | self-jamming tech bruiser — EMP Burst / Cluster Rockets set up Synthetic Blade / Taser Bolt / Robo Punch† payoffs; Adrenaline Rush + Self-Repair† keep it running. |
| Cyclops `cyclops` | tank | Giant Abilities · Eyesight · Earth Abilities · ~~Stone Age~~ | 19 → 21 | 5/8/5/3 | 2: Baleful Gaze → Hypnotic Pulse | stagger-stun anchor — Hypnotic Pulse or Giant Smash Stun into Stone Throw / Death Gaze, Fissure / Tremor Stomp Stagger into Colossal Crush, Pupil Shield for the front line. |
| Deep Sea Fish `deep sea fish` | assassin | Deep Sea Anatomy · Water Abilities · **+Beast Abilties** · ~~Light~~ · ~~Poison Abilities~~ | 26 → 17 | 5/4/6/2 | 1: Aurora Ray → Bite; 2: Ink Cloud → Deep Dive | the wet-board assassin — Spout / Whirlpool soak, Deep Dive in under Protect†, Depth Charge ×1.5 on Wet, Bite / Maul / Tidal Slam to close. |
| Demon `demon` | bruiser | Demonic Abilities · Shadow · Fire Magic · Blood Magic | 23 → 24 | 5/9/6/4 | — | contract bruiser-caster: Contract/Soul Bind → Devour Soul drain, Shadow Realm isolates the carry, Hellmouth lava lane, Meteor for the clump |
| Demon Prince `demon prince` | bruiser | Infernal Court · Demonic Abilities · Fire Magic · Blood Magic | 22 → 23 | 5/7/7/4 | 3: Scorched Earth → Wall of Fire | infernal burn engine — Wall of Fire / Infernal Decree Burn into Cataclysm Decree / Dark Dominion (Hellfire Crown is a self-buff, Hellmouth leaves lava but sets no Burn), Contract / Soul Bind into … |
| Demon Princess `demon princess` | support | Infernal Court · Witchcraft · Poison Abilities · Blood Magic · **+Seduction** | 18 → 28 | 9/7/7/5 | 4: Dark Lullaby → Cataclysm Decree | curse-and-charm debuffer — Hex for the team's Hexed finishers (Crow Storm†, Exorcism†, Crystal Ball†), Poison Swamp into Kiss of Decay / Life Sap, Charm into Enthrall to steal an activation. |
| Dinosaur `dinosaur` | bruiser | Apex Predator · Beast Abilties · Earth Abilities | 20 → 18 | 6/6/4/2 | 1: Primal Roar/Tail Whip → Tail Whip; 3: Fissure/Apex Roar → Ground Slam/Apex Roar | self-contained stagger→Jurassic Jaw finisher (Stampede / Tremor Stomp / Fissure stagger → Jaw ignores DEF) with Primal Roar† discord and Apex Roar atk aura for the pack. |
| Djinn `djinn` | caster | Arcane Magic · Ancient Knowledge · Trickery | 12 → 17 | 5/4/5/3 | 2: Spellsteal → Spellsteal/Wish Granted; 3: Wish Granted → Polymorph | reality-warping support caster — Spellsteal and Trick Room for tempo, Wish Granted to buff/cleanse/heal, Sacred Geometry crystal cover, Weigh the Heart to finish a staggered target. |
| DOOR Agent `door agent` | assassin | D.O.O.R. Training · D.O.O.R. Gun · Human Grit | 10 → 19 | 3/8/5/3 | 1: Swing Door/Door Dash → Swing Door; 2: Breaking and Entering/Air Mail → Breaking and Entering/Air Mail/Door Dash | the geometry assassin — Swing Door / Air Mail Stagger → Door Slam ×1.5, a Gust lane into Twin Doors that exit onto a Hell lane. |
| Dragon `dragon` | caster | Dragon Abilities · Fire Magic · Wind Control · **+Beast Abilties** | 11 → 18 | 5/6/4/3 | — | burn engine — Dragon Breath lane + Dragonfire line burn everything, Dragon Toss ×1.5 on the burning target, Dragonfear discord for Bull Rush†/Depth Charge† teammates; the flying skyThrow specialist. |
| Dreameater `dreameater` | support | Dream Predation · Psychic Abilities · **+Shadow** · ~~Grave Hunger~~ | 17 → 22 | 5/8/6/3 | 2: Corpse Crawl → Dreamwalk | sleep-lock caster — Eternal Slumber Stun into Dream Siphon, Sleep Paralysis to pin the target in place, Psychic Beam Discord into Migraine, Fear to scatter, Dreamwalk out. |
| Droid `droid` | specialist | Computer Hacking Skills · Robotic Hardware · Engineering · **+Artificial Intelligence** | 18 → 21 | 4/6/5/4 | — | jam engine for a tech team — Memory Leak/EMP Burst jammed feeds Crash Loop, Recursive Loop, Railgun†/Classified Weapon† carriers; Repair + Firewall Protocol keep a Deploy Turret nest standing. |
| Fairy `fairy` | support | Fae Magic · Trickery · Nature Magic | 14 → 17 | 6/4/4/3 | 2: Pixie Dust/Fairy Dust → Fairy Dust | mobility support: Fairy Dust team flight, Pixie Dust† launches one diver, Trick Room flips turn order, Glitter Bomb blind → Fae Ring |
| Fallen Angel `fallen angel` | caster | Fallen Angelic Powers · Heavenly Duties · Demonic Abilities | 19 → 20 | 4/6/7/3 | — | burn-cross caster — Fallen Grace Burn into Descending Wrath dive, Sanctuary / Divine Light to hold the line, Contract into Devour Soul. |
| Firefighter `firefighter` | tank | Water Abilities · Human Grit · Teamwork · Athleticism | 20 → 23 | 5/6/8/4 | 4: Tsunami → Tidal Slam | the rescue tank — Turnout Gear walks through Wall of Fire† and lava, Tag In swaps the wounded out, Adrenaline / Indomitable / Second Wind keep him up, Whirlpool pulls the pile onto him and Tidal … |
| Fortune Teller `fortune teller` | support | Fortune Telling · Witchcraft · **+Astral Projection** · ~~Astrology~~ | 7 → 13 | 3/5/3/2 | — | hex support: Tarot Draw team stages, Palm Read the big heal, Family Curse → Crystal Ball, Star Crossed zodiac debuff, Grand Alignment team reset |
| Gangster `gangster` | bruiser | Street Smarts · Dirty Fighting · Gun Training · **+Thievery** | 18 → 20 | 6/5/6/3 | 4: Extended Clips → Empty the Clip | the stagger brawler with a gun — Body Check → Curb Stomp / No Mercy, Mean Mug's Discord for the team's Discord finishers, Drive-By / Choppa own the lane. |
| Gargoyle `gargoyle` | tank | Living Stone · Earth Abilities · Wind Control | 16 → 18 | 4/7/4/3 | 2: Stoneform/Gothic Rampart → Stoneform | stone-wall tank — Gothic Rampart† lanes, Stoneform to stall a round, Stonefall / Fissure Stagger into Stone Drop from the air. |
| General `general` | tank | Military Combat · Gun Training · Teamwork | 20 → 19 | 5/5/6/3 | 4: Nuke → Fire for Effect | commander tank — Rally Command / Extended Clips buff the line, Suppressive Fire slows the lane, Fortify / Iron Dome shield, Artillery Strike / Fire for Effect zone the map. |
| Ghost `ghost` | caster | Poltergeist Abilities · Shadow · **+Computer Hacking Skills** · ~~Trickery~~ | 17 → 20 | 4/7/5/3 | — | possession/haunt control caster — Haunt then Boo, Fear to scatter, Possession to steal a body, Memory Leak jam for the tech teammates' Jammed payoffs. |
| Ghoul `ghoul` | assassin | Grave Hunger · Poison Abilities · Shadow | 18 → 20 | 6/7/4/3 | 1: Ghoulish Bite/Frenzy → Ghoulish Bite; 2: Corpse Crawl/Fear → Corpse Crawl/Frenzy | self-sustaining melee assassin — Fear → Terror Pounce strips buffs and finishes, Frenzy's grievous shuts down enemy healers, Corpse Crawl/Shadow Step reach the backline. |
| Giant `giant` | tank | Giant Abilities · Earth Abilities · Dirty Fighting | 20 → 23 | 7/7/6/3 | — | stagger engine and payoff in one body: Tremor Stomp/Fissure/Stonefall set, Colossal Crush/Boulder Hurl/No Mercy pay; Loom taunts, Iron Grip + Rampart hold the lane |
| Glitch `glitch` | specialist | Computer Hacking Skills · Temporal Abilities · Artificial Intelligence | 14 → 17 | 3/5/5/3 | — | jam-and-punish tech debuffer — Memory Leak Jammed into Crash Loop / Recursive Loop, Blue Screen Stun for the Stun finishers, Firewall Protocol shields, Judgment Beam DEF-shred. |
| Gnome `gnome` | specialist | Engineering · Trap Making · **+Hidden Technology** · ~~Earth Abilities~~ | 17 → 15 | 4/3/4/3 | 1: Fissure → Tesla Coil; 2: Tinker's Contraption → Scrap Mine; 3: Clockwork Turret → 5G Tower | turret-and-trap zoner — Deploy Turret ×2 + Clockwork Turret† + Tesla Coil + Trapdoor, Overtinker shields the nest, Repair keeps it up; the specialist you fight through, not at. |
| Goatman `goatman` | bruiser | Horns & Hooves · Blood Magic · Black Magic | 12 → 15 | 4/5/3/3 | 2: Cliff Charge → Labyrinth Roar; 3: Blood Ritual → Life Sap; 4: Baphomet's Rite → Bull Rush | charge-and-stagger bruiser — Gore Charge Stagger into Horn Toss, Labyrinth Roar Discord into Bull Rush (the T4 rung), Death Pact / Blood Ritual to stack ATK. |
| Goblin `goblin` | assassin | Thievery · Trap Making · Dirty Fighting · Poison Abilities | 16 → 21 | 9/4/5/3 | — | the trapper-assassin — Scrap Mine / Trapdoor Stagger → Curb Stomp / No Mercy, Infectious Bite → Formic Acid ×1.5, Stick-Up / Swipe lift the carry's buffs; Cave Eyes shrug off the Blind he walks … |
| Golem `golem` | tank | Living Stone · Earth Abilities · **+Ancient Knowledge** · ~~Desert Acclimation~~ | 15 → 18 | 4/6/5/3 | 3: Fissure → Ground Slam | immovable wall — Stone Skin + Stoneform, Rampart/Fissure rewrite the map, Tremor Stomp/Quake stagger → Boulder Hurl; the tank that holds a chokepoint for 3,000 years. |
| Grey `grey` | support | UFO Features · Psychic Abilities · Cryptid Abilities | 17 → 19 | 5/5/6/3 | — | displacement support: Implant → Abduction Beam, Kinetic Hurl throws, Teleport anyone, Low Gravity for the jumpers, Migraine/Mind Shatter payoffs |
| Halfdemon `halfdemon` | assassin | Demonic Abilities · Shadow · Spy Gear | 23 → 22 | 4/10/5/3 | 1: Inner Demon → Demonic Roar | shadow assassin — Smoke Screen / Agent Vanish stealth into Sneak Slash (bonus while invisible) with Poison Dart setup, Shadow Step engage into Demonic Claw. |
| Hippie `hippie` | support | Psychedelics · Meditation · Nature Magic · Agriculture · ~~Healing Magic~~ | 14 → 19 | 4/4/6/4 | — | the commune healer — seeds + Photosynthesis + Mantra heal over time, Contact High rallies the casters, Dosed → Bad Trip / Ego Death for the one who would not share. |
| Homosapien `homosapien` | hybrid | Human Grit · Teamwork · Athleticism · **+Ropework** | 12 → 19 | 5/5/5/4 | 1: Elbow Grease/Improvise → Elbow Grease; 2: Adrenaline Rush/Pep Talk → Adrenaline Rush/Encore | the Adaptable† baseline (passiveAdaptable is a TRAINING row any unit may equip): Pep Talk + Indomitable Will make it the sturdy off-tank, Encore is the team AP battery, Lasso adds the pool's only … |
| Sedan `honda civic` | specialist | Driving Skills · Robotic Hardware · Machinery | 13 → 15 | 4/5/3/3 | 3: Robo Punch/Nitro Boost → Hydraulic Crush/Nitro Boost | fast flanker — 84 SPD + Nitro → Ram Charge stagger → Robo Punch† ×1.5; Transform into the mech for +2 RNG, +1 DEF / +2 M DEF (−3 SPD) when the lane is held, Exhaust Cloud discord → Vehicular … |
| Ice Queen `ice queen` | caster | Ice Magic · **+Cosmic Abilities** · **+Prism Lattice** · ~~Winter Warfare~~ · ~~Healing Magic~~ | 14 → 24 | 7/5/9/3 | — | the team's freeze supplier — Flash Freeze / Permafrost / Absolute Zero frozen for Frozen Punch†, Avalanche Strike† and Sleigh Dash† carriers, Heat Death/Black Hole to lock a zone; Diamond Dust ices the … |
| Jack-o'-Lantern `jack o lantern` | caster | Fire Magic · Agriculture · Poltergeist Abilities · Witchcraft | 15 → 18 | 5/4/4/4 | — | the DoT stacker — Haunt (28 / round, armor ignored) + Fireball's Burn + Evil Eye's Hex, paid by Combust / Meteor / Hocus Pocus / Boo; Cold Spot freezes the row of crops. |
| Jellyfish `jellyfish` | caster | Deep Sea Anatomy · Water Abilities · Jellyfish · ~~Poison Abilities~~ | 22 → 18 | 4/5/6/3 | — | the Wet engine — Bloom / Spout / Water Pulse soak the board, Sting ×1.5 on Wet, Poseidon's Wrath on everyone standing in water, Nematocyst Net roots the runner; she hands Lightning and Ice teammates … |
| Juggernaut `juggernaut` | tank | Athleticism · Dirty Fighting · Giant Abilities | 15 → 19 | 5/6/5/3 | 4: Unstoppable Charge → Rampage | stagger wall — Unstoppable Charge† / Fee Fi Fo Fum stagger → Body Check / No Mercy / Colossal Crush ×1.5; Iron Grip roots what tries to leave, and 800 HP means it never needs to. |
| Kaiju `kaiju` | bruiser | Kaiju Rampage · Earth Abilities · **+Giant Abilities** · ~~Deep Sea Anatomy~~ | 18 → 20 | 5/7/5/3 | 1: Cataclysm Stomp → Car Toss; 2: Seismic Leap → Cataclysm Stomp | stagger battery — Cataclysm Stomp / Seismic Leap† / Fee Fi Fo Fum stagger → Atomic Breath line or Colossal Crush ×1.5, all self-contained; every hit deforms the map. |
| Ki Fighter `ki fighter` | bruiser | Ki Energy · Martial Arts · Athleticism · **+Human Grit** | 12 → 19 | 5/6/4/4 | — | burst duelist — Ki Charge → Instant Transmission 5 tiles → Dragon Fist / A Really Good Punch†, Flurry of Blows chews shields; brings his own root payoff (Haymaker) for a Kneecap Shot†/Iron Grip† … |
| King Arthur `king arthur` | tank | Camelot Powers · Knighthood · Swordsmanship · **+Horseback Riding** | 12 → 16 | 4/4/4/4 | — | rally tank — Royal Decree + Oath of Valor atk auras, Knights of Round regroups the whole team on the king, Walls of Camelot holds the line, Excalibur Strike burn → Dragon Slash ×1.5. |
| King Kong `king kong` | bruiser | Kaiju Rampage · Beast Abilties · Great Ape · **+Giant Abilities** · ~~Agriculture~~ | 17 → 19 | 5/6/5/3 | — | stagger slugger — Chest Pound def-1 opener, Seismic Leap stagger → Ape Fury / Colossal Crush ×1.5, Skyscraper Toss for cover-ignoring AOE; atk 100 with nothing wasted. |
| Knight `knight` | tank | Knighthood · Camelot Powers · Swordsmanship · Horseback Riding | 13 → 16 | 4/4/4/4 | — | bodyguard tank: Chivalry intercepts, Challenge taunts, Oath of Valor shields the line, Walls of Camelot shape the lane, Knights of Round pulls the team in |
| Kraken `kraken` | support | Deep Sea Anatomy · Water Abilities · Cephalopod Anatomy · **+Cryptid Abilities** · ~~Wind Control~~ | 17 → 21 | 5/6/7/3 | 4: Vortex Slam → Tsunami | pull-and-punish controller — Tentacle Lash/Whirlpool drag into Ink Cloud discord → Depth Charge ×1.5 (self-contained); Tidal Blessing heals the melee it dragged them into. |
| Krampus `krampus` | bruiser | Christmas Spirit · Horns & Hooves · Black Magic · Winter Warfare | 17 → 21 | 6/6/5/4 | 1: Lump of Coal → Lump of Coal/Frozen Punch; 2: Cliff Charge → Labyrinth Roar; 3: Naughty List → White Christmas; 4: Baphomet's Rite → Baphomet's Rite/Avalanche Strike | the frozen shatterer — White Christmas / Snowball Volley Slow, Blizzard Present's Frozen → Sleigh Dash / Frozen Punch / Glacial Slam / Avalanche ×1.5; Naughty List's Mark → Blizzard Present; Gore … |
| Loch Ness Monster `loch ness monster` | tank | Deep Sea Anatomy · Water Abilities · Cryptid Abilities · **+Beast Abilties** · ~~Ice Magic~~ | 24 → 21 | 6/5/7/3 | — | amphibious frontliner — Deep Dive in with Protect†, Tidal Slam slow-finisher, Dread Aura for Depth Charge; the 92-DEF tank that vanishes (Cryptid Vanish) instead of dying. |
| Luchador `luchador` | bruiser | Martial Arts · Athleticism · Dirty Fighting · Stage Presence | 20 → 23 | 7/6/6/4 | — | the stagger brawler with a taunt — Call Out pulls them in (Iron Chin means they cannot stagger him back), Body Check / Roundhouse / Mic Drop Stagger → Haymaker / Curb Stomp / No Mercy, Rampage … |
| Machine Elves `machine elves` | specialist | Prism Lattice · Fractal Pattern Recognition · Psychedelics · Trickery | 13 → 21 | 7/3/7/4 | — | lattice engineer — Prism Mirror geometry, Tune Frequency, Pulse Lattice; Mirror Blink / Dimensional Fold positioning; Ego Death Stun into Fractal Needle. |
| Mad Scientist `mad scientist` | specialist | Unethical Science · Hidden Technology · Chemistry | 10 → 15 | 4/4/4/3 | — | deploy engine: Tesla Coils + Creation + Clone soak, Monster Serum on a bruiser, Deneuralizer jam → Classified Weapon, Chemical Concoction → Plandemic |
| Mantid `mantid` | assassin | Insectoid Anatomy · Fractal Pattern Recognition · Psychic Abilities | 16 → 19 | 6/4/5/3 | 1: Mandible Strike → Psychic Beam; 2: Chitin Armor → Psychic Barrier | psychic line caster — Psychic Beam Discord into Migraine, Fractal Stitch / Needle down the lane, Dimensional Fold to swap a bruiser into the enemy's backline. |
| Marksman `marksman` | ranged | Military Combat · Gun Training · Hunting Skills · Marksmanship | 24 → 21 | 6/6/6/3 | — | long-range setup-and-execute: Kneecap → Precision Shot, a teammate's stun → Take Aim, Rangefinder + Fire for Effect as the team's artillery spotter |
| Martian `martian` | ranged | Alien Weapons · UFO Features · Desert Acclimation · ~~Fire Magic~~ | 17 → 17 | 4/5/5/3 | 4: War of the Worlds → Disintegrator | anti-flyer / anti-bruiser gunner: Heat Ray burn → Death Ray down the lane, Shrink Ray on the tank, Dust Devil + Low Gravity reposition, War of the Worlds for the clump |
| Mech `mech` | tank | Mech Pilot Skills · Military Combat · Robotic Weapons | 17 → 17 | 6/4/4/3 | 4: Nuke → Fire for Effect | artillery tank: Mortar Salvo/Artillery Strike/Nuke indirect fire, Siege Mode stance, Reactor Vent point-blank ender, Plasma Cannon burn → Fire for Effect, Eject when the line breaks |
| Men in Black `men in black` | assassin | Spy Gear · Hidden Technology · Alien Weapons · Deep State Connections | 19 → 23 | 6/8/6/3 | — | jam-and-erase assassin: Deneuralizer/EMP Grenade jam → Classified Weapon; Agent Vanish + Smoke Screen hide the team; Shrink Ray neuters the enemy bruiser |
| Mermaid `mermaid` | healer | Water Abilities · Sonic · Deep Sea Anatomy | 23 → 22 | 6/5/8/3 | — | water healer — Tidal Blessing zones and Tide Pool heals, Siren Song pull to reposition, Whirlpool Slow into Tidal Slam, Deep Dive out. |
| Minotaur `minotaur` | bruiser | Horns & Hooves · Beast Abilties · Dirty Fighting | 19 → 16 | 7/3/4/2 | — | charge bruiser — Gore Charge stagger → No Mercy, Labyrinth Roar discord → Bull Rush ×1.5, Horn Toss places the body where the team wants it; the most self-sufficient bruiser in the slice. |
| Mothman `mothman` | support | Cryptid Abilities · Lightning Magic · Mothman · **+Psychic Abilities** · ~~Wind Control~~ | 10 → 22 | 6/6/6/4 | — | omen support — Dread Aura Discord and Red Eyes Mark, then Prophecy's meteor storm; Ill Portent Protect† / Telepathic Link / Barrier for the team; Thunderstorm weather control. |
| Mushroom Girl `mushroom girl` | support | Psychedelics · Nature Magic · Poison Abilities · Fae Magic | 17 → 22 | 8/4/6/4 | 2: Pixie Dust → Fairy Dust; 3: Splash → Rot | the spore support — Herbal Remedy / Rejuvenation / Contact High for her side, Corrosive Splash / Rot / Miasma for the other, Dosed → Bad Trip ×1.5 self-contained, Fae Ring for the ones who stepped … |
| Necromancer `necromancer` | caster | Necromancy · Bone Density · Black Magic · **+Poison Abilities** | 12 → 23 | 7/6/6/4 | — | attrition caster — Plaguefield + Poison Swamp rot the ground, Corrosive Splash poisons → Formic Acid/Marrowstorm ×1.5, Rigormortis roots → Life Drain ×1.5 sustain, Voodoo links the enemy carry to … |
| Nephilim `nephilim` | tank | Fallen Angelic Powers · Earth Abilities · Giant Abilities | 17 → 21 | 5/7/6/3 | 1: Fallen Grace → Tremor Stomp; 3: Fissure → Ground Slam; 4: Wrath of the Watchers → Colossal Crush | divine siege tank — Fissure / Tremor Stomp Stagger into Colossal Crush / Stone Drop, Abyssal Wings Protect†, Rampart walls. |
| Nordic `nordic` | support | Galactic Federation Protocol · Light · **+Psychic Abilities** · ~~Alien Weapons~~ | 16 → 21 | 6/5/8/2 | — | stun support: Stasis Beam → Aurora Ray / a teammate's Take Aim†, Light Shield + Federation Beacon + First Contact sustain, Nordic Accord + Telepathic Link for a caster team |
| Nun `nun` | healer | Bible Study · Light · Heavenly Duties | 22 → 22 | 5/6/8/3 | 1: Purify/Smite → Absolution/Blessing; 2: Blessing → Purify/Sermon | the Blessed engine — Blessing / Sermon → Prayer (barrier + Blessed) → Hallelujah ×1.5 on Blessed allies; Exorcism beside a witch or a demon-contract setter. |
| Occulus `occulus` | support | Eyesight · Psychic Abilities · Ancient Knowledge | 17 → 19 | 5/5/6/3 | — | vision + stun support — Omni-Vision scouts, Hypnotic Pulse stun → Death Gaze ×1.5 and every Take Aim†/Aurora Ray† teammate, Psychic Beam discord → Migraine; Teleport moves the carry, Pupil Shield … |
| Orb of Light `orb of light` | support | Light · Cosmic Abilities · Healing Magic | 22 → 23 | 6/4/10/3 | 2: Luminous Shield → Light Shield; 3: Prism Burst → Luminous Shield | slow-payoff artillery support: Gravity Well/Black Hole slow-and-pull, Entropic Beam/Star Decree pay it, Light Shield + Heal All for the team, Supernova when dived |
| Overlord `overlord` | bruiser | Infernal Court · Dirty Fighting · **+Demonic Abilities** · ~~Fire Magic~~ | 18 → 21 | 6/5/7/3 | 2: Infernal Decree → Infernal Conscription; 3: Scorched Earth → Brutal Slam | stagger→No Mercy executioner who self-supplies stagger only via Demonic Roar (Body Check and No Mercy are both stagger PAYOFFS) and drops Infernal Decree burn / Hellmouth lava lanes for … |
| Pirate `pirate` | bruiser | Piracy · Swordsmanship · Ropework | 13 → 15 | 5/4/3/3 | — | root-and-board bruiser: Anchor/Lasso pin, Land Ho pays root, Walk the Plank executes under 25%, Yo Ho is the physical team heal + ATK buff |
| Police Officer `police officer` | ranged | Police Training · Gun Training · **+Human Grit** · ~~Driving Skills~~ | 18 → 15 | 3/5/4/3 | — | the hard-control gun — Pepper Spray Blind, Taser Stun, Cuffed Root + Stagger set up any team's finishers (police + marksman is g8's designed pair), Lockdown cordons the block. |
| Politician `politician` | support | Politics · Deep State Connections · Military Combat · **+Cult of Personality** | 13 → 19 | 5/6/5/3 | — | control support — Filibuster silence zone, Executive Order stun, Brainwash discord, Kool-Aid/Indoctrinate steal activations; Black Budget overclocks the carry and Nuke is the late button. |
| Popstar `popstar` | support | Stage Presence · Sonic · Seduction · ~~Music Theory~~ | 20 → 20 | 6/5/6/3 | — | the Discord / Charm engine — Discordance → Requiem ×1.5, Stadium Show Charm → Enthrall (two activations) / Draining Embrace, Anthem +2 ATK for the front line, Spotlight's Mark calls the focus. |
| Priest `priest` | healer | Bible Study · Light · Healing Magic · ~~Heavenly Duties~~ | 25 → 18 | 5/4/6/3 | 1: Divine Light → Heal | cleanse/shield healer: Absolution + Prayer + Protect keep one carry alive, Hallelujah resets the team, Exorcism finishes a Contracted/Hexed demon |
| Professor `professor` | caster | Ancient Knowledge · Chemistry · Hidden Technology · ~~Psychic Abilities~~ | 18 → 15 | 4/3/5/3 | — | the jam-and-corrode caster — Deneuralizer → Classified Weapon / Railgun ×1.5, Concoction's Corroded (Burn AND Poison) → Chain Reaction, Sacred Geometry / Pyramid Protocol wall off the back row. |
| Quarterback `quarterback` | ranged | Football IQ · Athleticism · Teamwork · ~~Marksmanship~~ | 17 → 17 | 4/5/5/3 | 3: Audible/Spike the Ball → Audible/Long Bomb | tempo ranged — Bullet Pass line poke, Blitz/Spike stagger → Hail Mary ×1.5, Audible spd aura + Encore hands the carry an extra action. |
| Rabbit `rabbit` | assassin | Athleticism · Trickery · Temporal Abilities · **+Mirror Magic** · ~~Fae Magic~~ | 18 → 22 | 6/6/6/4 | 1: Sparkle → Sprint; 3: Trick Room → Vault; 4: Time Rewind → Time Rewind/Rampage | the tempo assassin — Stutter → Sucker Punch after Misdirection, Rampage through the line, Temporal Shift / Skin Swap to be where the report said he wasn't; Hall of Mirrors is for an INT teammate. |
| Reptilian `reptilian` | assassin | Conspiracy Knowledge · Trickery · Poison Abilities · Spy Gear | 20 → 25 | 9/7/5/4 | 4: Flat Earth → Sneak Slash | poison-and-silence assassin: Poison Dart/Chemtrails/Poison Swamp set, Smoke Screen or the Shed Skin decoy hides it, Sneak Slash pays; Fluoride Water silences a caster line |
| Ringmaster `ringmaster` | specialist | Stage Presence · Ropework · Trickery · Teamwork · **+Animal Handling** | 14 → 27 | 8/6/8/5 | — | the director — Encore / Tag In for tempo, Lasso / Round-Up drag the crowd into the ring, Hawk / Wolves / Elephant fill it, Stadium Show is the finale. |
| Robin Hood `robinhood` | ranged | Archery · Hunting Skills · Thievery · Marksmanship | 15 → 15 | 4/4/5/2 | 1: Fire Arrow/Poison Arrow → Fire Arrow | status archer — Fire Arrow burn → Splitting Arrow ricochet, Kneecap Shot root → Precision Shot, Piercing Arrow pins bodies to walls; Camouflage + Forest Ambush† alpha from the treeline. |
| Robot `robot` | tank | Robotic Hardware · Machinery · Robotic Weapons | 13 → 15 | 5/4/3/3 | — | jammer tank: EMP jams the clump, Synthetic Punch/Hydraulic Crush/Synthetic Blade pay it, Overclock a carry, Kill Mode point-blank AOE |
| Santa Clause `santa clause` | tank | Christmas Spirit · Winter Warfare · **+Engineering** · ~~Ice Magic~~ | 16 → 16 | 4/4/4/3 | 2: Sleigh Dash → Sleigh Dash/Naughty List; 3: Naughty List/White Christmas → White Christmas | gift support — Repair/Overtinker keep the team going, White Christmas + Blizzard Present freeze the lane for Sleigh Dash and every Frozen Punch carrier, Clockwork toys hold the chimney. |
| Scarecrow `scarecrow` | support | Scarecrow Abilities · Witchcraft · Nature Magic · Agriculture | 13 → 18 | 4/5/4/4 | — | field-control bruiser — Harvest Hook pulls a target into Hex range, Crow Storm pays the Hex off, seeds and the Stuffed Double hold the zone. |
| Seraphim `seraphim` | caster | Heavenly Duties · Bible Study · Light | 22 → 22 | 5/6/8/3 | 1: Rapture → Absolution; 2: Absolution → Rapture | burst caster of the holy team: Seraphic Fire → Merkaba, a Nordic's Stasis Beam† → Aurora Ray, Divine Smite vs the unholy; Sanctuary/Rapture as support |
| Shadow Entity `shadow entity` | assassin | Shadow · Poltergeist Abilities · **+Temporal Abilities** · ~~Spy Gear~~ | 20 → 19 | 4/7/5/3 | 2: Smoke Screen → Fear; 3: Phase Shift → Shadow Step | the isolator: Shadow Realm drags one target into a 1v1, Haunt → Boo, Fear scatters the rest, Shadow Step blinks through walls, Void Rush teleports-and-blasts |
| Shaman `shaman` | support | Nature Magic · Psychedelics · Astral Projection · Agriculture | 11 → 18 | 4/4/6/3 | 3: Ayahuasca Retreat → Ayahuasca Retreat/Bad Trip; 4: Bad Trip/Ego Death → Ego Death | drug-and-spirit support: seed sustain + Astral Barrier, Spirit Walk escape, Bad Trip sets and pays its own slow, Ego Death stun for a teammate's stun payoff, voodoo payoff for a Black Magic teammate |
| Sharkman `sharkman` | bruiser | Deep Sea Anatomy · Water Abilities · Beast Abilties · Apex Predator | 24 → 22 | 6/6/7/3 | 3: Ambush Lunge → Feral Dive | the self-contained stagger bruiser — Tail Whip / Stampede Stagger → Jurassic Jaw (a kill heals 25% and refunds the AP), Death Roll pins the runner, Water Pulse's Wet → Depth Charge ×1.5; Blood in … |
| Sheriff `sheriff` | ranged | Gun Training · Cowboy Skills · Police Training · Horseback Riding · **+Marksmanship** | 17 → 23 | 5/7/6/5 | — | the range-control lawman — Cuffed / Quick Draw Stagger → High Noon ×1.5, or Kneecap Shot Root → Precision Shot; Tin Star means no Charm† turns him. |
| Sidekick `sidekick` | hybrid | Superhero Powers · Teamwork · Athleticism · Human Grit | 17 → 19 | 4/6/5/4 | 2: Pep Talk → Encore | the second — Encore / Tag In / Team Strike beside the carry, Heroic Leap to close (a plain 100 charge — it sets nothing), Heat Vision's own Burn 1 → a second Heat Vision ×1.5 or a teammate's Burn … |
| Siren `siren` | support | Sonic · Water Abilities · Seduction | 23 → 23 | 7/5/8/3 | 3: Deafening Wail → Deafening Wail/Call of the Deep; 4: Call of the Deep → Tsunami | battlefield controller — Siren Song pull + Whirlpool cluster, Deafening Wail Silence into Sonic Breaker / Call of the Deep, Requiem Discord; heals on the side. |
| Skeleton `skeleton` | bruiser | Bone Density · Poltergeist Abilities · Swordsmanship | 14 → 13 | 4/3/3/3 | 3: Bone Barrage → Bone Lance | DEF-ignoring bruiser: Bone Toss/Marrowstorm ignore armor, Reassemble scatters and re-forms, Haunt → Boo; wants a Poison setter for Marrowstorm |
| Skinwalker `skinwalker` | assassin | Trickery · Black Magic · Cryptid Abilities · ~~Beast Abilties~~ | 18 → 16 | 5/4/4/3 | — | body-swap trickster — Skin Swap / Shed Skin repositioning, Voodoo link + Dread Aura debuffs, Borrowed Claw steals a spell, Trick Room flips the turn order. |
| Starfish `starfish` | healer | Water Abilities · Deep Sea Anatomy · Healing Magic · ~~Cosmic Abilities~~ | 27 → 17 | 4/4/6/3 | 1: Heal → Soothe; 2: Tidal Blessing → Heal/Tidal Blessing | the zone healer — Tidal Blessing + Temporal Tide (heal allies, Slow enemies) hold a point, Great Flood makes the point water, Deep Adapted teammates fight at +1/+1 in it and Poseidon's Wrath drowns … |
| Succubus `succubus` | support | Seduction · Dream Predation · Demonic Abilities | 17 → 17 | 5/5/4/3 | 3: Sleep Paralysis/Enthrall → Nightmare Pulse/Enthrall | mind-control support: Charm/Soul Suck → Enthrall (two activations) or Draining Embrace, Contract to heal off the carry, Eternal Slumber stuns the clump |
| Super Sentai `super sentai` | tank | Sentai Colors · Teamwork · Martial Arts | 13 → 16 | 5/4/4/3 | 2: Pink Healing → Black Guard | team tank — Black Guard protect + Pink Healing, Yellow Thunder stagger / Blue Wave slow set up the bruisers, Team Strike shreds shields, Red Slash burn → Megazord Blast as the group finisher. |
| Superhero `superhero` | hybrid | Superhero Powers · Wind Control · **+Athleticism** · **+Human Grit** · ~~Cosmic Abilities~~ | 19 → 19 | 4/7/4/4 | — | mobile front-line hybrid — Heroic Leap / Sky Tackle engage, Shockwave Clap pushes, Heat Vision Burn finisher, Invulnerable / Indomitable Will to eat the counter-attack. |
| Swordfighter `swordfighter` | bruiser | Main Character Energy · Swordsmanship · Athleticism | 14 → 16 | 4/4/5/3 | — | team finisher: a Slow setter feeds Cross Slash, a Burn setter feeds Dragon Slash; Blade Waltz/Blessed Blade clean up; Season Finale is the own ender |
| Symbiote `symbiote` | assassin | Symbiosis · Ooze Biology · **+Athleticism** · ~~Poison Abilities~~ | 14 → 16 | 4/5/3/3 | 2: Symbiote Armor → Web Swing | the drain assassin — Tendril Whip's Poison → Symbiotic Drain ×1.5 (physical after g6), Goo Shot halves their healing and slows the chase, Icky Surprise erupts from its own ooze, Web Swing in and … |
| Telepath `telepath` | caster | Psychic Abilities · Deep State Connections · Astral Projection | 12 → 15 | 5/4/5/1 | — | discord/silence caster: Psychic Beam or Brainwash → Migraine, Brainwash silence → Mind Shatter, Telepathic Link M ATK aura, Teleport anyone |
| Tree Person `tree person` | tank | Nature Magic · Earth Abilities · Agriculture · ~~Cryptid Abilities~~ | 19 → 19 | 5/6/4/3 | 2: Earthen Grasp → Earthen Grasp/Trunk Throw; 3: Trunk Throw → Entangling Roots | the rooted anchor — Earthen Grasp pulls and roots (Deep Roots makes it immune to the reply), Tremor Stomp / Quake Stagger, seeds sprout trees, trees feed Trunk Throw (+30 each), Bumper Crop walls … |
| Valkraye `valkraye` | bruiser | Holy Defense · Wind Control · **+Knighthood** · ~~Heavenly Duties~~ | 16 → 14 | 3/5/3/3 | — | the flying front-liner — Shield Bash / Spear soften, Divine Swoop from height, Chivalry intercepts and Chooser brings back the one who fell; the bruiser a glass team brings. |
| Vampire `vampire` | assassin | Vampiric Abilities · Beast Abilties · Blood Magic | 15 → 15 | 5/4/4/2 | — | drain assassin — Bite / Predator Drop drains, Thrall Bite steals an activation, Mist Form out; bring a poisoner for Life Sap. |
| Voidweaver `voidweaver` | assassin | Arachnid Powers · Insectoid Anatomy · Fractal Pattern Recognition · **+Shadow** | 11 → 22 | 5/7/5/4 | — | root trapper — Web Shoot / Web Snare Root into Venom Fang and Void Cocoon, Dimensional Web Slow zone for the team's Slow finishers, Shadow Step / Phase Shift ambush. |
| The Watcher `watcher` | support | Temporal Abilities · Cosmic Abilities · Astral Projection | 17 → 20 | 5/4/9/2 | 3: Temporal Shift → Time Rewind | the prediction support — Stutter / Judgment Beam / Gravity Well set Slow and Stagger, Cosmic Sight strips the fog, Star Decree / Paradox pay, Time Rewind keeps the carry alive. |
| Werewolf `werewolf` | bruiser | Werewolf Powers · Beast Abilties · **+Apex Predator** · ~~Hunting Skills~~ | 13 → 13 | 4/4/3/2 | — | lunar melee frenzy — Stampede Stagger into Jurassic Jaw, Blood Frenzy to execute the lowest enemy, Bite / Lunar Regeneration to stay in the fight. |
| Wizard `wizard` | caster | Arcane Magic · Lightning Magic · Fire Magic · Ice Magic | 18 → 22 | 5/8/5/4 | — | control caster: Permafrost/Flash Freeze/Ice Spear set slow and frozen, Polymorph/Spellsteal disarm the carry, Meteor + Absolute Zero pay off |
| Yeti `yeti` | bruiser | Ice Magic · Winter Warfare · Cryptid Abilities · **+Sasquatch Abilties** | 14 → 20 | 6/6/4/4 | 1: Frozen Punch/Ice Shard → Frozen Punch/Ice Spear | frozen-chain bruiser — Permafrost/Flash Freeze freeze → Frozen Punch / Avalanche Strike ×1.5, Ice Slide re-paves the lane in ice for the whole team's slide plays. |
| Zombie `zombie` | tank | Zombie Behavior · Poison Abilities · **+Grave Hunger** · ~~Necromancy~~ | 14 → 18 | 6/5/4/3 | — | horde tank — Infect sets the table for Shambling Horde (its only finisher key is Infected) while Outbreak pays off its own Poison; Cannibalize and Carrion Feast keep it standing; Formic Acid shreds … |

Pools after: min 13 · median 19 · max 28 (before: 7 · 17 · 27). Families per race after: 75 races × 3, 46 races × 4, 3 races × 5.

## 8. Team archetypes after the plan

The twelve archetypes of S §2, re-read with the plan applied, plus the three the plan opens. "Holes closed" names the rows
that do it (all in §6); the counters are unchanged unless stated. The strategy space is the point of the whole exercise:
each archetype needs a different pair of families, and each has at least two answers in other families.

| # | Archetype | Engine after the plan (setup → payoff) | Core races | Holes the plan closes | Counters |
|---|---|---|---|---|---|
| 1 | **Stagger train** | Stonefall / Fissure / Tremor Stomp / Mic Drop / Gore Charge / Drive-By's path → Colossal Crush · No Mercy (now an execute below 25%) · High Noon · Jurassic Jaw · Sasquatch Smash · Rampage (merged, now staggers) · Roll Credits · Boulder Hurl / Horn Toss at T1 | door agent, police officer, popstar, gangster → giant, cyclops, minotaur, dinosaur, kaiju, overlord, luchador | the "payoff races cannot pay" hole was a misreading (§5); Drive-By gives Dirty Fighting its own setup; Concussive (upgrade) and Aftershock (passive) let a bruiser loop alone; Crowd Surge (was Space Disco) staggers a clump | SPD — act before the finisher; cleanse (Purify, Absolution); kill the T1 setter |
| 2 | **Poison rot** | Corrosive Splash · Infectious Bite · Poison Swamp · Outbreak (now 80 on cast) · Chemtrails · Venomous basics → Rot (NEW T3) · Miasma (NEW T4 5×5) · Life Sap (Poison or Grievous) · Sneak Slash · Marrowstorm · Truth Bomb | zombie, reptilian, bee queen, mushroom girl → black goo, symbiote, demon princess, conspiracy theorist | Poison gets its T3 and T4; Venom Coat (upgrade) spreads it to the beast families | the poison-immune tech and undead; Purify, Hallelujah |
| 3 | **Jammed tech** | Deneuralizer · Memory Leak (Jammed 2, now drains 30 MP) · EMP Grenade (now T3 at its 75 MP) · EMP Burst → Crash Loop · System Crash (NEW T4: Stagger on the Jammed) · Railgun · Hydraulic Crush · Synthetic Blade | men in black, ai, glitch, droid → android, cyborg, robot, honda civic | Neural Hack (a worse Memory Leak) goes; Overcharged (upgrade) gives the robots a cheap jam; Faraday Cage (passive) wins the mirror match | cleanse; the payoffs are T1-heavy |
| 4 | **Freeze and shatter** | Flash Freeze · Permafrost · Absolute Zero · Cold Spot · Freeze Breath · Blizzard Present → Shatter (NEW Ice T1 payoff) · Frozen Punch · Avalanche Strike · Sleigh Dash · Heroic Leap (now pays Frozen) | yeti, ice queen, santa, krampus, wizard, superhero / sidekick | Ice pays its own freezes (Shatter); Diamond Dust drops to 1 AP; Frostbite (upgrade) for the Christmas and ghost setters | the ice-immune; fire thaws; cleanse priority |
| 5 | **Burn line** | Fireball (now Burn 2) · Heat Ray · Dragon Breath · Wall of Fire (rng 4) · Bomb Arrow (now burns) · Incendiary Rounds · Cinder Touch basics → Combust (NEW Fire T2) · Meteor · Dragon Slash · Merkaba · Fire for Effect · Splitting Arrow · Cataclysm Decree | martian, dragon, jack o lantern, robin hood, general | Fire gets a 50-MP payoff; the general is self-contained (verified: Incendiary's basic hits burn) | Soaked targets cannot burn (the combo layer); fire resist |
| 6 | **Discord / silence control** | Discordance · Dread Aura · Apex Roar (merged roar) · Psychic Beam · Ink Cloud · Brainwash · Filibuster · Polymorph (now Silence 2) → Requiem · Sonic Breaker · Mind Shatter (now the area silence nuke) · Migraine · Depth Charge · Call of the Deep · Truth Bomb | politician, bigfoot, dinosaur, grey, kraken → siren, mermaid, popstar, telepath, occulus | Polymorph and Ancient Magic give the casters a silence; Chorus (passive) and Hush (upgrade) stretch the window | discord does nothing to casters, silence nothing to bruisers — pick the target |
| 7 | **Puppetry** | Charm (now Charm 2, CD 2) · Kool-Aid · Stadium Show → Enthrall · Cult Indoctrinate (now Charm ×2 too) · Possession · Thrall Bite · Infect; Soul Suck becomes the drain payoff | succubus, siren, popstar, bunny girl, cult leader, vampire, zombie | the cult leader can pay his own charm; Showmanship (passive) adds the second window | bosses immune; spread out; Purity Censer |
| 8 | **Root and shoot** | Kneecap Shot · Anchor · Iron Grip (now 80 + Root 2) · Web Shoot / Web Snare · Earthen Grasp · Cuffed (now 100 + Root 2 + Stagger 1) · Nematocyst Net · Lockdown (now Root 1 + Slow 2, 150) → Precision Shot · Take Aim (now pays Root too) · Land Ho · Haymaker · Venom Fang · Soul Drain | marksman, quarterback, pirate, voidweaver, zombie | root finally has a T4 payoff (Take Aim) | teleports ignore root; the grounding roots take your own flyers down too |
| 9 | **Terrain warfare** | Fissure · Quake · Walls of Camelot · Gothic Rampart · Rampart (now T2) · Great Flood · Call of the Deep (now T3: deep water + drowning) · Walk the Plank · Wall of Fire · Plaguefield · Frost / Gust / Hell Doors → Poseidon's Wrath · Walk the Plank's execute; movers push into the hazards | gargoyle, golem, crystal guardian, mermaid, kraken, pirate, door agent, siren | a 75-MP water-maker (Call of the Deep at T3); Mountainborn (passive); Tidewater (upgrade) | flight (Levitating works today), teleports, your own walls |
| 10 | **Summoner / deploy wall** | Deploy Turret · 5G Tower · Tesla Coil · Scrap Mine (NEW) · Deathtrap (NEW) · Prism Mirror · Raise the Dead · Cult Gathering · Whistle · standing doors | gnome, droid, mad scientist, necromancer, machine elves, crystal guardian, door agent, goblin | the duplicate turret rows go; Foreman (passive) scales the wall and Detonate (upgrade) pays for having it out | Permafrost wipes deployables; any area |
| 11 | **Bruiser dive with enablers** | Encore · Pep Talk · Teleport · Knights of the Round · the swaps · Fairy Dust (Levitating = flight, live) · Overclock → Rampage · Bull Rush · Stampede (now T3, path damage) · Blitz · Giant Smash · Drop In · Seismic Leap | homosapien, sidekick, fairy + giant / nephilim / minotaur / luchador | Pathfinder (passive) and Overdrive (upgrade) reward the dive; the flight build is already real | roots that ground flyers; Fear; Chivalry intercepts |
| 12 | **Fog assassins** | Camouflage · Agent Vanish · Smoke Screen · Phase Shift · Blurry Photo · Shadow Infiltration (now hit-and-fade) · Mist Form · Corpse Crawl → Sneak Slash · Feral Dive · Breaking & Entering · Drop In | men in black, shadow entity, reptilian, werewolf, robin hood, vampire, ghoul, rabbit | Ambush (passive) and Umbral (passive) give invisibility its payoff layer | Hagstone, Binoculars, the Whistle hound, Keen Nose (NEW beast passive) |
| 13 | **Mark and execute** (opened by the plan) | Knife Throw · Red Eyes · Predictive Model · Implant · Dead Eye (Mark +60) · System Analysis (now Marked 2) · Spotlight (now Marked 2) · Harbinger (NEW) → Recursive Loop (Marked ×1.5) · Abduction Beam (Marked ×1.5) · Exploit: Marked (upgrade) · every hit (+40 consume) | ai, glitch, men in black, grey, mothman, marksman, popstar | Marked goes from 7 setters and 0 finishers to a real line | cleanse; the mark is consumed by ANY hit, so the order matters |
| 14 | **Blind and misdirect** (opened by the plan) | Glitter Bomb · Pepper Spray · Misdirection (NEW) · Eclipse (NEW) · Shattered Mirror (NEW) · Fairy Fire (upgrade) → Fae Ring (now pays Blind) · Sucker Punch (NEW) | fairy, rabbit, mushroom girl, police officer, fortune teller | Blind gets payoffs and a family (Mirror Magic owns it) | blind is a miss chance — spells still land |
| 15 | **Hex and curse** (opened by the plan) | Hex of Agony · Family Curse (now a 3×3 hex) · Seven Years (NEW, Mirror Magic) → Crystal Ball · Exorcism · Crow Storm; Hex Weaver (passive) makes the hex jump | fortune teller, jack o lantern, demon princess, scarecrow, priest | the hex family stops being two copies of one row | cleanse; Hexed is only a finisher key |

## 9. Implementation order

Every batch goes through the Spell Library (Settings → Developer) as one export → `node bake-spell-mods.js
<export.json>` → `node --check data.js` → deliver `data.js` (R2) + `index.html` with a fresh `?v=` token (RULE #1b; `npm
run deploy` does both) → Render redeploy. Data-only rows ride the host snapshot (`unit.spells` is serialized), so
Batches A–C need no online.js change; Batch D does wherever it adds an on-screen moment (RULE #2).

**Batch A — row edits, safe on their own.** Every RETIER, RECOST, RETUNE, RETYPE, RENAME and DESC in §6.2, every
REWRITE that uses live fields only (a new `bonusVsStatus`, a status, a range, a shape the engine already reads), and the
dead-field deletions of §6.5. Also the DELETE / MERGE of rows that are nobody's rung. **A2 (only if Q1 = four tiers):**
the thirteen T4 folds marked Q1 in §6.2.

**Batch B — the registry.** One export, because the bake refuses a `RACE_TREE` rung outside its race's families: the
eight family deletes / folds (§6.1), the 22 MOVEs, the rows that are someone's rung and are deleted / merged / turned
into a passive, every race's new family list (§7, 64 races) and every rung change (§7, 67 races), the family RENAMEs
(Scarecrow "Abilties" and Chemistry "Knowldege" typos; Occult Knowledge → Ancient Knowledge; Drug Use → Psychedelics;
Monkey Brains → Great Ape; Tentacle Appendages → Cephalopod Anatomy) and the UNIQUE flags that survive (Scarecrow
Abilities, Ki Energy; D.O.O.R. Gun is already flagged). After the bake: no race under 3 families, every rung inside its race's
families, "spells in no family" = 0, "families on no race" = 0 (the checks the 2026-09-30 `dump.js` printed; the
scripts are in git history at commit fdefd66, `docs/spell-audit/tools/`).

**Batch C — new content that needs no engine.** The 128 new rows of §6.3 whose mechanics are live (most of them: every
row built from existing kinds and fields); the 20 LIVE passives and the live halves of the PARTIAL ones (§6.4); the
three LIVE upgrades (Exploit: Marked, Encore Performance, Counterspell) and Frostbite's live half; the per-row upgrade
lists from the family blocks' "Upgrades" lines (151 entries). A new row that names a key from §6.5's "new mechanics" list
waits for Batch D.

**Batch D — engine** (battle.js / data.js, online.js for any new on-screen moment, the AI's scorers for any new key):
in value order — (1) the `addStatus` upgrade patch key (eight upgrades); (2) `executeBonusPct` for Weigh the Heart;
(3) the damage-zone tick (War of the Worlds, Heat Death); (4) `mpDrain`, `statusIfTargetHas`, `aoeLifeDrain`, on-cast
zone damage; (5) the per-status duration hook and the other passive hooks of §6.4; (6) the rest of §6.5. Each key gets a
`PASSIVE_HOOK_KEYS` / `_upgApplyPatch` / `SPELL_UPGRADE_FITS` entry so the Spell Library lint stops flagging it.

**After every bake:** re-dump (`dump.js` + `synergy.js` from fdefd66, run against the new data) and diff against
`docs/spell-audit/data/`: pools should match §7, ladders §6.1, and the tier-rule / off-ladder / dead-field sections of
`summary.md` should shrink toward zero. When the pools settle, regenerate `SPELL_CATALOGUE.md` from the library (it
predates the 2026-09-27 family export and the 2026-09-30 races). Playtest is mondo's (RULE #1c).

## 10. Decisions for mondo

Each with the plan's recommendation; the plan as written assumes the recommendation.

| # | Question | Recommendation | If the other way |
|---|---|---|---|
| Q1 | Four tiers with one T4 per family, or fold to three tiers? (§4) | **Four tiers, one T4 per family.** SP 16, kit shapes intact; the 13 Q1 folds in §6.2. | Every kept T4 becomes a T3 pinned at 100 MP; SP max 16 → 12; `--stamp-tiers` rewrites the field. |
| Q2 | Should the four lowest pools get a story-mode MP floor? (§5) | **Leave base MP alone** (PvP is fine at base + 100). If early story feels starved, raise `EW_MP_L1_FRAC` 0.30 → 0.35, or floor juggernaut / robot / giant / dinosaur at base 70. | S's "floor at 100" changes PvP too (every bruiser +up to 60 MP at level 100). |
| Q3 | Allow more than 5 families on a race? | **Hold the line at 5.** The plan needs none above 5 (75 races at 3, 46 at 4, 3 at 5). | Cowboy and sheriff would take Marksmanship / Hunting / Ropework adds from F.g8 / F.g7. |
| Q4 | The 25-MP T4 jokes | **A Really Good Punch goes** (F.g7: Dragon Fist is Martial Arts' T4, now paying Pressure Point's Stun); **Hocus Pocus → 100 MP + a Hexed finisher** (F.g3). | Keep the Punch as a gated joke (25 MP, CD 3 — F§). |
| Q5 | Dead fields: wire or reword? | **Reword `guaranteedCrit`** (delete it); **wire `executeBonusPct`** for Weigh the Heart (F.g2); `bonusVsDebuffed` → real `bonusVsStatus` lists; No Mercy uses the live `executeBelowPct`. | Weigh the Heart takes F§'s data-only `executeBelowPct: 0.2` instead. |
| Q6 | Pool-size target | **12–24 as a guide, not a cap.** Five races end above 24: reptilian 25, cosmic wraith 25, atlantean 25, ringmaster 27, demon princess 28 — each has four families with full ladders. | Trim one family each (the race blocks name the weakest fit). |
| Q7 | The family-passive layer | **Ship the 20 LIVE passives in Batch C**; the 27 PARTIAL / NEW wait for their hooks. | Skip passives: every family still works as a pool. |
| Q8 | The four built-from-empty families are single-race after the plan (Gambling: bunny girl; Animal Handling: ringmaster; Mirror Magic: rabbit; Internet Addiction: conspiracy theorist) | **Keep them** (rule 2 allows a one-race family; each fixes a race's hole). | Fold each into its race's nearest family. |
| Q9 | UNIQUE flags | **Scarecrow Abilities and Ki Energy** (one wearer each after the plan). Kaiju Rampage (F.g5) and Camelot Powers (F.g2) keep a second wearer (king kong, knight) because their race blocks kept them, so their flags are not set. | Remove king kong from Kaiju Rampage / the knight from Camelot and flag both. |
| Q10 | The stat pass the race blocks asked for (rule 8 — a race whose families' damage type fights its stats): cowboy ATK 40 → 70; annunaki INT 31 → 70; cosmic wraith INT 31 → 85 (and class caster); cyclops INT 25 → 55; werewolf ATK (no number); class relabels: demon prince and mantid → caster, santa → support, scarecrow → bruiser (tentative) | **Do the stat pass separately**, after Batch B, with a re-dump (the plan's pools change which rows each race actually has). | Retype rows instead (the race blocks name the candidates). |
| Q11 | Rungs whose tier differs from their ring (e.g. a T3 row on ring 2) | **Accept** — legal since explicit tiers (§11.2); the default kit and the tree only read oddly. | Re-seat the rung on a same-tier row of the race's families. |
| Q12 | New ids | The plan uses the house `race<Name>` form except where a section wrote another; confirm or rename at export time (casts resolve by name, not id). | — |

## 11. Reconciliation log

The fifteen sections were written in parallel and checked one at a time, so they disagree in places. The synthesis
turned every proposal into a change record (2,575 records: 18 per family on average, every race, every cross-family
verdict), applied them all to a copy of the 2026-09-30 data with the rules below, and re-checked the result against §3
(no race under 3 or over 5 families, every rung inside its race's families, one T4 per family, THE TIER RULE, no family
worn but empty, no family with rows but no wearer). The after-plan state in §6–§7 passes all of them.

### 11.1 The rules the synthesis applied

a. **The family block that owns a row decides the row.** When it is silent, the cross-family audit (F §1–§5) decides;
   then synergy (S); then the race blocks. A section's KEEP only blocks another section's change when the owning family
   block says it. Description-only fixes (DESC) from any section ride along.
b. **The race block decides which families its race wears**, and its rungs. A family block's RACE_ADD / RACE_REMOVE /
   RACE_SWAP that the race block did not take is not applied (§11.6). A family block's own registry verdict (DELETE /
   MERGE / RENAME) stands; a race that wore a folded family wears the family it folded into.
c. **A row the owning family block points a rung at survives** another section's DELETE (Fire for Effect, Feral Dive).
d. **New rows:** a family whose own block grew it is designed by that block — other sections' new rows in it are not
   adopted (§11.5, 65 rows); in a family its block did not grow, other sections' new rows are adopted in precedence
   order, one per name.
e. **Anything resting on a verified error is void** (§11.2): the MP floor and MP pins, the Wet engine rule and the
   lightning Wet finishers, the Levitating flight ask.
f. **Explicit resolutions (★, §11.7)** where a–e left a rule broken: a rung pointing at a non-adopted row, a family with a
   second T4 (Q1), a tier-rule breach, a field that would be dead on its row.

### 11.2 Facts the sections got wrong — verified in the code on 2026-09-30

| Claim in the sections | What the code says | Consequence |
|---|---|---|
| "Base MP is final … a giant (60 MP) can never cast a 100-MP T4" (S §3, §4, §6; R.1, R.2, R.4; F.g3, F.g4) | `computeUnitStats` returns base MP, but every unit is then built at a level: `levelStatGains` makes MP `(base + 100) × (0.30 + 0.70 × ((L−1)/99)^1.35)`, and every PvP mode builds at `LEVEL_CAP` = 100 → **base + 100** (juggernaut 140, giant 160 … casters 330–360) | The MP floor, the 75-MP T4 pins, the giant 150 / robot 130 / zombie 150 / valkraye 110 raises, Backup Battery, Heavy Bones' half-cost and Ki Charge's 0-MP battery are all dropped (§5). Story mode below level ~40 is the real, narrower issue (Q2). |
| "Wet does nothing yet" (F §3); "wet → lightning ×1.5 should be an engine rule" (S §1) | battle.js "SOAKED (wet) — the glue status of the elemental combo layer": lightning ×1.5 and fire ×0.75 on the Soaked, no burning, frost flash-freezes (Stun 1), every water-element hit soaks, standing in water soaks | The engine ask is dropped; F.g1's Wet ×1.5 finisher on Thunderbolt is struck (it would stack to ×2.25); water rows' Wet finishers (Depth Charge, Jelly Sting) stand. |
| "Make `requiresFlight` accept Levitating" (S §2.11) | map.js `canFly` already returns true while Levitating; every `requiresFlight` gate calls it | Dropped; write it in Fairy Dust's text. |
| "Corroded … treat as UNVERIFIED" (S §1) | STATUS_DEFS `corroded.countsAs: ['burn','poison']`, honoured by the payoff check | Verified; the Chemistry payoffs stand. |
| "A T3 row cannot sit in a rung-2 slot" (F.g7) / "a rung's ring must equal its tier somewhere" (R.3's check) | Every row has an explicit numeric `tier` since the 2026-09-26 `--stamp-tiers` bake; the ring is only the fallback for a row with none; MP cost is the row's own `cost`; the ring rule lived in spell-families.test.js, deleted with the tests on 2026-09-29 | Off-tier rungs are legal (Q11); the plan prefers tier-matching replacements. |
| "`immuneStatus` / `armor` / `revealInvisibleWithin` / `cooldownDelta` are new keys" (F§, F.g5, F.g9) | All are live | Those rows are data-only. |
| "`executePct: 0.25` is the live execute" for No Mercy (F.g7) | battle.js reads `executePct` only inside Walk the Plank's terrain flow; the live execute on a damage row is `executeBelowPct` (Take Aim) | ★ No Mercy uses `executeBelowPct`. |
| "System Analysis keeps Scanner 2" (F.g4) | The Scanner status is `category: 'display'` and read by nothing | ★ Marked 2 instead. |
| "Mothman's Widen gives 7×7" (F.g5) | Widen is a 5×5 | Text fix. |
| F.g3 "Slow Rot: `regenPerRound: 16` HP" | the hook is % of max HP | `regenPerRound: 3`. |

### 11.3 Row fates the sections disagreed on (one removes, another keeps or changes) — what the plan does

| Row | Proposals | Plan |
|---|---|---|
| A Really Good Punch `reallyGoodPunch` | F§ KEEP, F§ RECOST, F§ RECOST, F§ KEEP, F§ RECOST, F§ KEEP, F.g7 DELETE, R.3 RECOST, S RECOST, S REWRITE | DELETE (F.g7) — the owning family section decides the row |
| Ambush Lunge `raceAmbushLunge` | F§ REWRITE, F§ REWRITE, F§ REWRITE, F.g5 DELETE, R.2 RETUNE | DELETE (F.g5) — the owning family section decides the row |
| Blurry Photo `raceRealityShift` | F§ KEEP, F§ DESC, F.g5 DELETE | DELETE (F.g5) — the owning family section decides the row |
| Chitin Armor `raceChitinArmor` | F§ REWRITE, F.g6 PASSIVE | becomes a passive — the owning family section decides the row |
| Cliff Charge `raceCliffCharge` | F§ REWRITE, F.g5 DELETE | DELETE (F.g5) — the owning family section decides the row |
| Cosmic Slam `raceCosmicSlam` | F.g4 RECOST, R.3 MOVE→Superhero Powers, S DELETE | stays: RECOST (F.g4) — the owning family section decides the row |
| End Zone Dance `raceEndZoneDance` | F§ KEEP, F.g7 DELETE, R.3 KEEP | DELETE (F.g7) — the owning family section decides the row |
| Family Curse `raceCurseOfMisfortune` | F§ REWRITE, F§ RECOST, F§ REWRITE, F.g3 REWRITE, R.1 REWRITE, R.2 REWRITE, S MERGE→Hex of Agony | stays: REWRITE (F.g3) — the owning family section decides the row |
| Fire for Effect `raceFireForEffect` | F§ DELETE, F§ MERGE→Nuke, F§ DELETE, F§ MERGE→Nuke, R.2 KEEP | stays: KEEP (F.g8) — the owning family section points a rung at it |
| Gothic Rampart `raceGothicRampart` | F§ RETIER→T1, F.g1 DESC, F.g5 DELETE, R.2 KEEP | DELETE (F.g5) — the owning family section decides the row |
| Green Arrow `sentaiGreenArrow` | F§ REWRITE, F§ RETIER→T1, F§ RETIER→T1, F§ REWRITE, F§ REWRITE, F.g8 DELETE, R.3 MOVE→Sentai Colors, R.3 RETIER→T3, R.3 REWRITE, S RECOST | DELETE (F.g8) — the owning family section decides the row |
| Grim Resolve `raceGrimResolve` | F§ PASSIVE, F§ PASSIVE, F.g1 DELETE, R.1 RECOST, S RECOST | DELETE (F.g1) — the owning family section decides the row |
| Heat Death `raceHeatDeath` | F§ REWRITE, F§ RETUNE, F§ RECOST, F§ DESC, F§ RETIER→T3, F§ DESC, F§ RETIER→T3, F§ RETUNE, F.g4 REWRITE, S MERGE→Star Decree | stays: REWRITE + DESC + RETIER (F.g4, F§, ★) — cosmic keeps Black Hole; F.g4's zone mechanic is kept, priced as a T3 |
| Impact Round `riderImpactRound` | F§ KEEP, F.g8 DELETE | DELETE (F.g8) — the owning family section decides the row |
| Infernal Conscription `raceInfernalConscription` | F§ DELETE, F§ DELETE, F§ DELETE, F.g3 REWRITE | stays: REWRITE (F.g3) — the owning family section decides the row |
| Inner Demon `raceInnerDemon` | F§ REWRITE, F.g3 DELETE, R.2 REWRITE | DELETE (F.g3) — the owning family section decides the row |
| Lifetap `raceLifetap` | F§ KEEP, F.g3 REWRITE, F.g3 RETYPE, R.2 DELETE | stays: REWRITE + RETYPE (F.g3) — the owning family section decides the row |
| Luminous Shield `raceLuminousShield` | F§ DELETE, F§ DELETE, F.g1 RETIER→T3, F.g1 RETUNE, R.1 REWRITE | stays: RETIER + RETUNE (F.g1) — the owning family section decides the row |
| Neural Hack `raceNeuralHack` | F§ REWRITE, F§ RECOST, F§ REWRITE, F§ REWRITE, F.g4 DELETE, R.1 REWRITE, R.2 REWRITE, S MERGE→Memory Leak | DELETE (F.g4) — the owning family section decides the row |
| Plot Armor `racePlotArmor` | F§ PASSIVE, F.g9 REWRITE, R.1 REWRITE | stays: REWRITE (F.g9) — the owning family section decides the row |
| Poison Arrow `racePoisonArrow` | F§ KEEP, F.g8 UPGRADE | UPGRADE (F.g8) — three names for one upgrade |
| Pounce `racePounce` | F§ RETUNE, F§ RETUNE, F.g5 RETUNE, R.2 MOVE→Feline Anatomy, R.2 RETUNE, S DELETE | stays: RETUNE (F.g5) — the owning family section decides the row |
| Predator Leap `racePredatorLeap` | F§ KEEP, F.g5 DELETE, S RETIER→T2, S RETUNE | DELETE (F.g5) — the owning family section decides the row |
| Primal Roar `racePrimalRoar` | F§ KEEP, F§ DESC, F.g5 MERGE→Apex Roar | MERGE (F.g5) — the owning family section decides the row |
| Rapture `raceRapture` | F§ DELETE, F§ DELETE, F§ DELETE, F.g2 RETIER→T2, F.g2 REWRITE | stays: RETIER + REWRITE (F.g2) — the owning family section decides the row |
| Ricochet `ricochet1` | F§ KEEP, F§ RENAME, F.g8 DELETE | DELETE (F.g8) — the owning family section decides the row |
| Robo Punch `raceRoboPunch` | F§ KEEP, F.g4 MERGE→Hydraulic Crush, F.g4 MERGE→Hydraulic Crush | MERGE (F.g4) — the owning family section decides the row |
| Scorched Earth `sharedScorchedEarth` | F§ DELETE, F§ DELETE, F§ DELETE, F.g1 DELETE, R.1 KEEP, R.1 REWRITE | DELETE (F.g1) — the owning family section decides the row |
| Shield Maiden `raceShieldMaiden` | F§ DELETE, F§ DELETE, F.g2 REWRITE | stays: REWRITE (F.g2) — the owning family section decides the row |
| Symbiote Armor `raceSymbioteArmor` | F§ REWRITE, F.g6 PASSIVE | becomes a passive — the owning family section decides the row |
| Tinker's Contraption `raceTinkersContraption` | F§ REWRITE, F§ REWRITE, F.g4 DELETE | DELETE (F.g4) — the owning family section decides the row |
| Unstoppable Charge `raceUnstoppableCharge` | F§ KEEP, F.g7 MERGE→Rampage | MERGE (F.g7) — the owning family section decides the row |

(32 rows.)

### 11.4 Tier disagreements — what the plan does

| Row | Now | Proposals | Plan |
|---|---|---|---|
| Absolution `raceAbsolution` | T2 | F§ keep, F.g2 →T1 | T1 |
| Apex Roar `raceApexRoar` | T3 | F§ keep, F.g5 →T2 | T2 |
| Bad Trip `raceBadTrip` | T4 | F§ keep, F§ →T3, F.g2 →T3, S keep | T3 |
| Blood Ritual `raceBloodRitual` | T3 | F§ keep, F.g1 →T1 | T1 |
| Calcify `raceCalcify` | T3 | F§ →T2, F§ →T2, F.g5 keep | T3 |
| Call of the Deep `raceCallOfTheDeep` | T4 | F§ →T3, F.g1 →T3, S →T2 | T3 |
| Classified Weapon `raceClassifiedWeapon` | T4 | F§ keep, F§ →T3 | T3 |
| Cold Spot `raceColdSpot` | T2 | F§ →T3, F§ →T3, F.g3 keep | T2 |
| Crop Circle `raceCropCircle` | T4 | F§ keep, F§ →T3 | T3 |
| Cryptid Vanish `raceCryptidVanish` | T3 | F.g5 →T2, S keep | T2 |
| Curb Stomp `raceStompOut` | T1 | F§ →T2, F§ keep | T1 |
| Dark Dominion `raceDarkDominion` | T4 | F§ →T3, R.2 keep | T3 (Q1) |
| Dark Lullaby `raceDarkLullaby` | T4 | F§ keep, F§ →T3, F.g3 →T3, R.2 keep | T3 |
| Demonic Claw `raceDemonicClaw` | T4 | F§ keep, F§ keep, F§ →T3 | T3 (Q1) |
| Door Dash `raceDoorDash` | T1 | F§ keep, F.g7 →T2 | T2 |
| Exorcism `exorcism` | T4 | F§ keep, F§ →T3 | T3 |
| Extended Clips `raceExtendedClips` | T4 | F§ keep, F§ →T3 | T3 |
| Fissure `sharedFissure` | T1 | F§ keep, F.g1 →T2, R.3 keep | T2 |
| Gothic Rampart `raceGothicRampart` | T2 | F§ →T1, R.2 keep | gone |
| Green Arrow `sentaiGreenArrow` | T2 | F§ →T1, F§ →T1, R.3 →T3 | gone |
| Hit a Lick `raceHitALick` | T2 | F§ keep, F.g8 →T1 | T1 |
| Howl `raceHowl` | T2 | F§ keep, F.g5 →T1 | T1 |
| Lasso `raceLasso` | T1 | F§ →T2, F§ →T2, F.g7 keep | T1 |
| Light Shield `racePleiadianShield` | T2 | F§ →T3, F§ →T3, F.g1 keep | T2 |
| Migraine `raceMindCrush` | T4 | F§ keep, F§ →T3, F.g9 keep | T3 (Q1) |
| Predator Leap `racePredatorLeap` | T1 | F§ keep, S →T2 | gone |
| Rampart `rampart` | T4 | F§ →T2, F§ →T2, F§ →T2, F.g1 →T2, R.1 keep | T2 |
| Rangefinder `raceRangefinder` | T3 | F§ keep, F.g8 →T2 | T2 |
| Rigormortis `raceRigormortis` | T2 | F.g3 keep, S →T3 | T2 |
| Sermon `raceCultSermon` | T1 | F.g2 keep, F.g2 →T2 | T2 |
| Skin Swap `raceSkinSwap` | T3 | F§ →T2, F§ →T2, F.g9 keep | T3 |
| Skull Crack `skullCrack` | T3 | F§ keep, F.g7 keep, S →T2 | T3 |
| Star Decree `raceStarDecree` | T4 | F§ keep, F§ →T3 | T3 |
| Stone Drop `raceStoneDrop` | T4 | F§ keep, F§ →T3 | T3 |
| Summon Creation `raceSummonCreation` | T2 | F§ →T3, F§ →T3, F.g4 keep | T2 |
| Supernova `raceSupernova` | T4 | F§ keep, F§ →T3, F.g4 keep | T3 (Q1) |
| Tidal Slam `raceTidalSlam` | T4 | F§ keep, F§ →T3 | T3 (Q1) |
| Tsunami `raceTsunami` | T4 | F§ keep, F§ →T3 | T3 |
| Voodoo `raceVoodoo` | T3 | F§ keep, F.g3 →T2, S keep | T2 |
| War Cry `warCry` | T2 | F§ keep, F.g1 →T3 | T3 |
| Wish Granted `raceWishGranted` | T3 | F§ keep, F.g1 →T2 | T2 |

(41 rows.)

### 11.5 New rows proposed and not adopted

The rule (§11.1 d): a family whose own block grew it is designed by that block; other sections' new rows in it are not adopted.

| Proposed row | Family / tier | From | Why not |
|---|---|---|---|
| Death Ray `raceDeathRay` | Alien Weapons T4 | R.1 | F.g4 grew Alien Weapons with Disintegrator as the family T4; Disintegrator is made physical instead (below), which is what R.1 wanted Death Ray for |
| Void Cocoon `raceVoidCocoon` | Arachnid Powers T4 | R.2 | family section grew arachnid — its design wins |
| Spirit Animal `raceSpiritAnimal` | Astral Projection T3 | R.1 | family section grew astralprojection — its design wins |
| Retrograde `astroRetrograde` | Astrology T3 | S | the same zone debuff as R.1's Mercury Retrograde, which the plan keeps (Astrology folds into Fortune Telling) |
| Grand Alignment `raceGrandAlignment` | Astrology T4 | R.1 | Fortune Telling keeps Crystal Ball as its one T4 (R.1's third Astrology row; Astrology folds into Fortune Telling per F.g2) |
| raceZeroGKick `raceZeroGKick` | Astronaut Camp T1 | R.3 | Astronaut Camp is deleted (F.g4; its condition holds) — R.3's fills go with it |
| raceAirlock `raceAirlock` | Astronaut Camp T3 | R.3 | Astronaut Camp is deleted (F.g4; its condition holds) — R.3's fills go with it |
| raceReEntry `raceReEntry` | Astronaut Camp T4 | R.3 | Astronaut Camp is deleted (F.g4; its condition holds) — R.3's fills go with it |
| Shoulder Tackle `athShoulderTackle` | Athleticism T1 | S | family section grew athleticism — its design wins |
| Savage Maul `beastSavageMaul` | Beast Abilties T4 | S | family section grew beastabilities — its design wins |
| Hemorrhage `bloodHemorrhage` | Blood Magic T2 | S | family section grew blood — its design wins |
| Acid Vial `chemAcidVial` | Chemistry Knowldege T1 | S | family section grew chemistry — its design wins |
| Volatile Compound `chemVolatileCompound` | Chemistry Knowldege T4 | S | family section grew chemistry — its design wins |
| Acid Flask `raceAcidFlask` | Chemistry Knowldege T1 | R.1 | family section grew chemistry — its design wins |
| Stim Injection `raceStimInjection` | Chemistry Knowldege T2 | R.1 | family section grew chemistry — its design wins |
| Angler's Lure `raceAnglersLure` | Deep Sea Anatomy T2 | R.4 | family section grew deepsea — its design wins |
| raceRegimeChange `raceRegimeChange` | Deep State Connections T4 | R.3 | family section grew deepstate — its design wins |
| Scarab Swarm `raceScarabSwarm` | Desert Acclimation T3 | R.2 | family section grew desertacclimation — its design wins |
| Cat Nap `raceCatNap` | Feline Anatomy T2 | R.2 | family section grew feline — its design wins |
| Ember Strike `fireEmberStrike` | Fire Magic T2 | S | family section grew fire — its design wins |
| First Contact `raceFirstContact` | Galactic Federation Protocol T2 | R.1 | family section grew galacticfederation — its design wins |
| raceImpale `raceImpale` | Horns & Hooves T3 | R.3 | family section grew horns — its design wins |
| Trample `raceTrample` | Horseback Riding T2 | R.1 | family section grew horsebackriding — its design wins |
| Lance `raceLance` | Horseback Riding T3 | R.1 | family section grew horsebackriding — its design wins |
| raceCavalryWheel `raceCavalryWheel` | Horseback Riding T3 | R.3 | family section grew horsebackriding — its design wins |
| raceWildHunt `raceWildHunt` | Horseback Riding T4 | R.3 | family section grew horsebackriding — its design wins |
| Doomscroll `netDoomscroll` | Internet Addiction T1 | S | family section grew internetaddiction — its design wins |
| Ratio'd `netRatiod` | Internet Addiction T2 | S | family section grew internetaddiction — its design wins |
| DDoS `netDDoS` | Internet Addiction T3 | S | family section grew internetaddiction — its design wins |
| Go Viral `netGoViral` | Internet Addiction T4 | S | family section grew internetaddiction — its design wins |
| raceDoomscroll `raceDoomscroll` | Internet Addiction T1 | R.3 | family section grew internetaddiction — its design wins |
| raceRatiod `raceRatiod` | Internet Addiction T2 | R.3 | family section grew internetaddiction — its design wins |
| raceViralPost `raceViralPost` | Internet Addiction T3 | R.3 | family section grew internetaddiction — its design wins |
| raceDoxxed `raceDoxxed` | Internet Addiction T4 | R.3 | family section grew internetaddiction — its design wins |
| raceSpiritBomb `raceSpiritBomb` | Ki Energy T4 | R.3 | family section grew ki — its design wins |
| Challenge `raceChallenge` | Knighthood T2 | R.1 | family section grew knight — its design wins |
| raceVigil `raceVigil` | Knighthood T2 | R.3 | family section grew knight — its design wins |
| raceSigilWard `raceSigilWard` | Living Stone T1 | R.3 | family section grew livingstone — its design wins |
| Season Finale `raceSeasonFinale` | Main Character Energy T4 | R.1 | family section grew maincharacter — its design wins |
| raceSeasonFinale `raceSeasonFinale` | Main Character Energy T4 | R.3 | family section grew maincharacter — its design wins |
| Reactor Vent `raceReactorVent` | Mech Pilot Skills T4 | R.1 | family section grew mecha — its design wins |
| Wingbeat `mothWingbeat` | Mothman T2 | S | family section grew mothman — its design wins |
| Ill Portent `raceIllPortent` | Mothman T3 | R.2 | family section grew mothman — its design wins |
| Necrosis `poisonNecrosis` | Poison Abilities T4 | S | family section grew poison — its design wins |
| raceSmearCampaign `raceSmearCampaign` | Politics T2 | R.3 | family section grew politics — its design wins |
| raceStateOfEmergency `raceStateOfEmergency` | Politics T4 | R.3 | family section grew politics — its design wins |
| Contact High `raceContactHigh` | Drug Use T2 | R.1 | family section grew psychadelic — its design wins |
| Contact High `raceContactHigh` | Drug Use T2 | R.2 | family section grew psychadelic — its design wins |
| Wood Knock `raceWoodKnock` | Sasquatch Abilties T2 | R.1 | family section grew sasquatch — its design wins |
| Straw Mending `raceStrawMending` | Scarecrow Abilties T3 | R.2 | family section grew scarecrow — its design wins |
| raceGraspingArms `raceGraspingArms` | Tentacle Appendages T2 | R.3 | family section grew tentacleappendages — its design wins |
| raceConstrict `raceConstrict` | Tentacle Appendages T3 | R.3 | family section grew tentacleappendages — its design wins |
| raceEightArms `raceEightArms` | Tentacle Appendages T4 | R.3 | family section grew tentacleappendages — its design wins |
| racePickpocket `racePickpocket` | Thievery T1 | R.3 | family section grew thievery — its design wins |
| raceGiveToThePoor `raceGiveToThePoor` | Thievery T3 | R.3 | family section grew thievery — its design wins |
| raceHeist `raceHeist` | Thievery T4 | R.3 | family section grew thievery — its design wins |
| Loom `raceLoom` | Giant Abilities T2 | R.1 | family section grew titan — its design wins |
| raceTripwire `raceTripwire` | Trap Making T1 | R.3 | family section grew trapmaking — its design wins |
| raceRubeGoldberg `raceRubeGoldberg` | Trap Making T4 | R.3 | family section grew trapmaking — its design wins |
| Tunnel Under `raceTunnelUnder` | Trap Making T2 | R.4 | family section grew trapmaking — its design wins |
| Rend `wwRend` | Werewolf Powers T1 | S | family section grew werewolf — its design wins |
| Rend `raceRend` | Werewolf Powers T1 | R.2 | family section grew werewolf — its design wins |
| Lunar Regeneration `raceLunarRegeneration` | Werewolf Powers T3 | R.2 | family section grew werewolf — its design wins |
| raceSnowCover `raceSnowCover` | Winter Warfare T2 | R.3 | family section grew winter — its design wins |
| raceIceClub `raceIceClub` | Winter Warfare T3 | R.3 | family section grew winter — its design wins |

(65 rows.)

### 11.6 Membership — where a family block and a race block disagreed (the race block wins, §1)

| Race | Family | Family block proposed | Race block decided |
|---|---|---|---|
| antperson | Agriculture | F.g1 REMOVE | wears it |
| mushroom girl | Agriculture | F.g1 ADD | does not |
| nordic | Alien Weapons → UFO Features | F.g4 SWAP | Galactic Federation Protocol, Light, Psychic Abilities |
| shaman | Animal Handling | F.g9 ADD | does not |
| catgirl | Beast Abilties | F.g5 ADD | does not |
| necromancer | Bone Density → Poison Abilities | F.g3 SWAP | Necromancy, Bone Density, Black Magic, Poison Abilities |
| grey | Cryptid Abilities | F.g5 REMOVE | wears it |
| goatman | Cryptid Abilities | F.g5 ADD | does not |
| atlantean | Deep Sea Anatomy | F.g6 ADD | does not |
| reptilian | Deep State Connections | F.g8 ADD | does not |
| djinn | Desert Acclimation | F.g5 ADD | does not |
| golem | Desert Acclimation → Holy Defense | F.g5 SWAP | Living Stone, Earth Abilities, Occult Knowledge |
| grey | Eyesight | F.g5 ADD | does not |
| dreameater | Grave Hunger → Astral Projection | F.g3 SWAP | Dream Predation, Psychic Abilities, Shadow |
| sheriff | Hunting Skills | F.g8 ADD | does not |
| king kong | Kaiju Rampage | F.g5 REMOVE | wears it |
| djinn | Lightning Magic | F.g1 ADD | does not |
| cowboy | Marksmanship | F.g8 ADD | does not |
| super sentai | Mech Pilot Skills | F.g4 ADD | does not |
| ki fighter | Meditation | F.g2 ADD | does not |
| fortune teller | Mirror Magic | F.g9 ADD | does not |
| sheriff | Ropework | F.g7 ADD | does not |
| knight | Camelot Powers | F.g2 REMOVE | wears it |
| ringmaster | Sonic | F.g1 ADD | does not |
| nordic | Alien Weapons → UFO Features | F.g4 SWAP | Galactic Federation Protocol, Light, Psychic Abilities |

(25 rows. Family-block membership proposals the race block agreed with are not listed.)

### 11.7 Every explicit synthesis resolution (★)

- **Tidal Slam** `raceTidalSlam`: RETIER T4 → T3 (75 MP), dmg → 135; keeps r1 self-area, Slow 2 and the Slow finisher, 1 AP [Q1: one T4 per family — applies only if mondo keeps 4 tiers] — why: water keeps Great Flood (terrain rewrite, the categorical T4); g1 retuned Tidal Slam at T4 without addressing the rule
- **Void Rush** `voidRush`: RETIER T4 → T3 (75 MP), dmg → 135; keeps the teleport strike and takes synergy's Feared ×1.5 finisher [Q1: one T4 per family — applies only if mondo keeps 4 tiers] — why: shadow keeps Shadow Realm (the duel is unique); F §5 missed shadow's second T4
- **Judgment** `judgment`: RETIER T4 → T3 (75 MP), dmg → 135; magic per F.g1; keeps cross r3 and the Slow finisher [Q1: one T4 per family — applies only if mondo keeps 4 tiers] — why: light keeps Merkaba (F §5)
- **Migraine** `raceMindCrush`: RETIER T4 → T3 (75 MP), dmg → 135; keeps its M ATK −1 strip [Q1: one T4 per family — applies only if mondo keeps 4 tiers] — why: psychic keeps Mind Shatter — F.g9 made it the area silence nuke, the categorical one; F.g9 wanted Migraine as a second single-target T4
- **Demonic Claw** `raceDemonicClaw`: RETIER T4 → T3 (75 MP), dmg → 135; keeps F.g3's Contract / Soul Bound ×1.5 finisher (drops Marked per F.g3) [Q1: one T4 per family — applies only if mondo keeps 4 tiers] — why: demonic abilities keeps Hellmouth (F §5)
- **Colossal Crush** `raceColossalCrush`: RETIER T4 → T3 (75 MP), dmg → 135; keeps the Stagger ×1.5 finisher; 1 AP per F.g5 [Q1: one T4 per family — applies only if mondo keeps 4 tiers] — why: S §4 MP pin / 0-MP battery rests on the base-MP error (level-100 MP is base + 100, §5)
- **Ancient Magic** `raceAncientMagic`: RETIER T4 → T3 (75 MP), dmg → 135; keeps F.g2's Silence 1 (and synergy's Silence ×1.5 finisher is dropped — a row that sets and pays the same status in one cast is Mind Shatter's job) [Q1: one T4 per family — applies only if mondo keeps 4 tiers] — why: occult keeps Weigh the Heart (F §5)
- **Supernova** `raceSupernova`: RETIER T4 → T3 (75 MP), dmg → 135; self-area r2, DEF −1, 1 AP (F §5: Nebula's shape) [Q1: one T4 per family — applies only if mondo keeps 4 tiers] — why: cosmic keeps Black Hole (F §5)
- **Heat Death** `raceHeatDeath`: RETIER T4 → T3 (75 MP); keeps F.g4's real zone at T3 numbers: 3×3, 2 rounds, 70 magic per round (140 total), Slow 1 on entry, 1 AP [Q1: one T4 per family — applies only if mondo keeps 4 tiers] — why: cosmic keeps Black Hole; F.g4's zone mechanic is kept, priced as a T3
- **Reality Pulse** `raceRealityPulse`: RETIER T4 → T3 (75 MP), dmg → 135; aoe r1 + Discord 2 (F.g4's Discord 2) [Q1: one T4 per family — applies only if mondo keeps 4 tiers] — why: temporal keeps Time Rewind (F §5; the echo is live)
- **Kill Mode** `raceChassisSlam`: RETIER T4 → T3 (75 MP), dmg → 125; keeps F.g4's rewrite: self-area r2, Stagger 1 on everything hit, 1 AP, CD 2 [Q1: one T4 per family — applies only if mondo keeps 4 tiers] — why: S §4 MP pin / 0-MP battery rests on the base-MP error (level-100 MP is base + 100, §5)
- **Blessed Blade** `raceBlessedBlade`: RETIER T4 → T3 (75 MP), dmg → 135; moves to Main Character per F.g7; keeps r1 rng 1 [Q1: one T4 per family — applies only if mondo keeps 4 tiers] — why: Main Character's T4 is F.g9's Roll Credits (the owner of the family designed it); F.g7 moved Blessed Blade in to fill a T4 slot F.g9 filled
- **Dark Dominion** `raceDarkDominion`: RETIER T4 → T3 (75 MP), dmg → 135; keeps the Burn + Stagger finisher; aoe r1 [Q1: one T4 per family — applies only if mondo keeps 4 tiers] — why: infernal court keeps Cataclysm Decree (terrain rewrite, F §5); R.2 kept Dark Dominion at T4 as demon prince's rung — the rung stays, as a T3
- **No Mercy** `raceNoMercy`: REWRITE ★ use `executeBelowPct: 0.25` (live on damage rows, judged before the hit — Take Aim's key) instead of F.g7's `executePct`, which battle.js reads only inside Walk the Plank's terrain flow — why: S §4 MP pin / 0-MP battery rests on the base-MP error (level-100 MP is base + 100, §5)
- **System Analysis** `raceSystemAnalysis`: REWRITE ★ apply Marked 2 instead of Scanner 2 (the Scanner status is display-only — read by nothing); keeps F.g4's rng 5 and M DEF −1. It becomes the setup for F.g4's Recursive Loop (Marked ×1.5) — why: Scanner is dead (verified); S proposed Marked; F.g4 itself made Recursive Loop a Marked payoff
- **Frenzy** `raceFrenzy`: RETUNE dmg 120 → 110 at T2 (★ F.g3 wrote 130, which breaks THE TIER RULE; F§ §2 and R.3 both say 110 — Absorb is the T2 130 with no status) — why: tier rule
- **Poison Arrow** `racePoisonArrow`: DESC ★ the upgrade it becomes is Venom Coat (F.g8's Poisoned Tips merged with S's Venom Coat and F.g6's Envenomed Mandibles — one `addStatus: {poison, 2}` upgrade, §6.4); robin hood's rung 1 falls back to Fire Arrow — why: three names for one upgrade
- **Sasquatch Smash** `raceSasquatchSmash`:  — why: S §4 MP pin / 0-MP battery rests on the base-MP error (level-100 MP is base + 100, §5)
- **Shambling Horde** `raceShamblingHorde`:  — why: S §4 MP pin / 0-MP battery rests on the base-MP error (level-100 MP is base + 100, §5)
- **Blood Frenzy** `raceBloodFrenzy`:  — why: S §4 MP pin / 0-MP battery rests on the base-MP error (level-100 MP is base + 100, §5)
- **Quake** `raceQuake`:  — why: S §4 MP pin / 0-MP battery rests on the base-MP error (level-100 MP is base + 100, §5)
- **Marrowstorm** `raceMarrowstorm`:  — why: S §4 MP pin / 0-MP battery rests on the base-MP error (level-100 MP is base + 100, §5)
- **Terror Pounce** `raceTerrorPounce`:  — why: S §4 MP pin / 0-MP battery rests on the base-MP error (level-100 MP is base + 100, §5)
- **Baphomet's Rite** `raceBaphometsRite`:  — why: S §4 MP pin / 0-MP battery rests on the base-MP error (level-100 MP is base + 100, §5)
- **Giant Smash** `raceGiantSmash`:  — why: S §4 MP pin / 0-MP battery rests on the base-MP error (level-100 MP is base + 100, §5)
- **Ki Charge** `raceKiCharge`:  — why: S §4 MP pin / 0-MP battery rests on the base-MP error (level-100 MP is base + 100, §5)
- **5G Tower** `fiveGTower`:  — why: F.g4 owns the row and points the gnome's rung 3 at it in Engineering; R.3's move to Conspiracy Knowledge would orphan that rung (R.3 itself said "if both land, use Trapdoor" — the plan keeps F.g4's version instead)
- **Thunderbolt** `thunder1`: REWRITE ★ WITHOUT F.g1's Wet ×1.5 finisher: lightning already deals ×1.5 to a Soaked target through the live elemental combo layer, so the finisher would make it ×2.25. The rest of F.g1's rewrite stands (rng 4; the chain moves to the NEW Chain Lightning; desc) — why: the combo layer already pays Wet for lightning (verified in battle.js)
- **martian** rungs {"4":"raceDisintegrator"} — why: R.1 moved the martian's rung 4 off magic War of the Worlds onto a physical Alien Weapons T4; that row is Disintegrator (physical)
- **cowboy** rungs {"3":"raceWhistle"} — why: Long Rifle moves to Marksmanship (F.g8 owns both families); R.1 keeps the cowboy off Marksmanship, so the twin rung [Long Rifle, Whistle] collapses to Whistle (Hunting Skills T3)
- **antihero** rungs {"3":"raceShockwaveClap"} — why: F.g4 keeps Cosmic Slam in Cosmic (the family section wins on the row); R.3 takes the antihero off Cosmic (the race section wins on membership); S's repoint to Shockwave Clap (Superhero Powers T3) keeps both
- **chosen one** rungs {"4":"raceRollCredits"} — why: Season Finale (R.1) duplicates F.g9's Roll Credits; F.g9 already made Roll Credits the chosen one's rung 4
- **Astronaut Camp** DELETE — why: F.g4 DELETE (Gravity Boots → Alien Weapons) was contingent on barbarella gaining Spy Gear; F.g8 and R.3 both add it, so the delete stands; R.3's three Astronaut Camp fills go with the family
- **Disintegrator** `raceDisintegrator` (new row, re-specified): T4 damage/damage, lightning/PHYSICAL, 100 MP 1 AP, rng 4, single, 180, finisher Stun or Minimize ×1.5. "There is no body to recover." (F.g4's row; damage type set to physical by the synthesis: two of Alien Weapons' three carriers are ATK races — martian ATK 88 / INT 30, barbarella ATK 72 / INT 31; …

### 11.8 Proposals superseded by precedence

634 row-level proposals (not counting KEEPs, DESC fixes and struck items) were superseded because a higher-precedence section decided the same row: F§ 439 · S 87 · R.1 40 · R.2 37 · R.3 29 · F.g3 1 · F.g6 1. They remain readable in their sections; §6.2 carries only the adopted wording.
