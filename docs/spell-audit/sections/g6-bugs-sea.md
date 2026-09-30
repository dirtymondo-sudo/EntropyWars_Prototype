### 🐜 Insectoid Anatomy `insectoid` — VERDICT: KEEP (rewrite the venom loop, make the shell a passive, add the hive rung)
**Identity.** The exoskeleton kit: chitin, mandibles, venom that stacks, and the hive that digs tunnels and moves as one — a melee-poison bruiser family whose team value is the T3 tunnel and the T4 swarm buff.
**Races.** mantid (insectoid alien, "forelimb strike velocity 23m/s") fits, but it is atk 22 / int 94 and every damage row here is physical — its rung 1 `raceMandibleStrike` is a trap; keep it on the family for Chitin Armor / Tunnel Network / Swarm Signal and move its RACE_TREE rung 1 to `racePsychicBeam` (Psychic is a mantid family). antperson (eusocial, "swarm tactics: DEVASTATING", atk 94) is the model owner. bee queen (hive mother, "poison, command and multiply", Royal Jelly = immune to poison) fits. voidweaver is an arachnid, not an insect, but chitin + venom fangs are arachnid anatomy too and it needs `raceVenomFang` as rung 1 and as the payoff for its own webs — keep. ~~RACE_ADD mothman~~ STRUCK (skeptic): the yeti test fails — mothman's lore line is "winged humanoid … luminous red ocular organs … appears before catastrophic events … prophetic visions"; nothing in it is chitin, mandibles, venom, tunnels or a hive, and a moth has none of those either. Sharing the word "insect" is the Christmas-Spirit-on-a-yeti case. Its atk 8 would also make Mandible Strike / Venom Fang dead rows. Mothman's pool-of-10 problem belongs to the Mothman / Cryptid slice, not here. No race added; the family stays at four.
**Now.**
- T1 Mandible Strike `raceMandibleStrike` · 3 hits × 45 physical, rng 1.
- T1 Venom Fang `raceVenomFang` · 100 physical, rng 1, Poison 3, ×1.5 vs Rooted.
- T2 Chitin Armor `raceChitinArmor` · self DEF +1 stage, 50 MP.
- T3 Tunnel Network `raceTunnelNetwork` · deployPair, rng 3, 1 per caster, desc "Deploys a linked pair of objects."
- T4 Swarm Signal `raceSwarmSignal` · warCry aoe r2, ATK +2 stages (data) — desc says "+1 stage".
**Problems.**
- Venom Fang is the same row as Infectious Bite `raceInfectiousBite` (Poison family: 100 physical, rng 1, Poison 3) and antperson + bee queen own BOTH families; its Rooted finisher has no setup on mantid, antperson or bee queen (synergy.md: all three "need teammate" for Venom Fang) — only voidweaver (Web Shoot) can pay it.
- Chitin Armor is the fourth copy of "self DEF +1 stage at T2 / 50 MP" (Iron Bulwark, Stone Skin, Thick Hide — summary redundancy group). For an ANATOMY family the shell should be always-on, not a stance.
- Tunnel Network's description is the engine placeholder; nobody can tell from the rack that it is a door pair whose far mouth is a cast origin (battle.js "The Long Way Round": range + LOS from the twin, 3 hits break both).
- Swarm Signal: data grants ATK +2 stages, the desc promises +1 — one of them is wrong; the row is otherwise a bigger Apex Roar (T3, ATK +1, aoe r2) with no hive flavour.
- No T2 active once Chitin becomes a passive, and nothing in the family says "swarm" except the T4 buff.
**Changes.**
- REWRITE `raceVenomFang`: 100 physical, rng 1, applies Poison 3; finisher becomes ×1.5 vs POISONED (no statusFirst, so the first bite envenoms and the second bite "goes deep"). Self-contained loop for every owner; also pays off Infectious Bite / Sting / Corrosive Splash from teammates. Desc: "A second bite on an envenomed target finds the vein."
- PASSIVE: `raceChitinArmor` becomes the family passive "Chitin Armor" (T2, 2 SP, hooks `{ statBonus: { def: 8 }, immuneStatus: ['stagger'] }`) — "A shell that does not flinch: +8 DEF, immune to Stagger." If a RACE_TREE rung cannot be a passive, mantid rung 2 → `racePsychicBarrier` and bee queen rung 2 → the new `raceBrood`.
- REWRITE `raceTunnelNetwork`: range 3 → 4; desc "Dig a tunnel: one mouth beside you, one where you point (within 4). An ally standing at either mouth attacks and casts as if it stood at the other — range and line of sight from the far mouth. One tunnel per caster; three hits collapse both mouths." (Mechanics already exist for door pairs; this is a desc + range change.)
- REWRITE `raceSwarmSignal`: keep ATK +2 stages for allies within 2, add +1 MOV for 2 rounds (the swarm closes); fix the desc to say +2. "The signal goes out. Everything with legs comes running."
**Additions.**
- NEW **Brood** `raceBrood` — T2, deploy/summonUnit, poison, 50 MP / 1 AP, rng 1, single tile, `maxActivePerCaster: 1`, `summonDef: { key: 'drone', name: 'Drone', move: 4, dmg: 55, hits: 3 }` — the engine's pet model (battle.js summonUnit: hits-to-kill body, hunts the nearest enemy at end of round for dmg + half spell power, no HP/DEF/expiry fields exist), sized between Cult Member (T4, dmg 55 / 2 hits, max 2) and Hound (T3, dmg 60 / 3 hits). "One is never found alone." SKEPTIC: the original spec (HP 150, ATK 60% of caster, DEF 30, Poison 2 on hit, 3-round expiry) used fields the summon model does not have; a poison bite needs a new `summonDef.hitStatus: { id: 'poison', duration: 2 }` hook — list it as engine work, not as shipped behaviour. Fills the family's T2 active and gives antperson / bee queen the body-count their lore promises: a blocker for Tunnel Network mouths, a fifth body for Team Strike, a Swarm Signal recipient. mantid and voidweaver simply won't equip it (pool ≠ kit).
**Upgrades.** Venom Fang takes Exploit (×2 vs Poisoned) and Lingering (Poison 4) — that is the family's damage ceiling, do not add a "Deep Venom" spell. Mandible Strike: Empowered only (3 hits already spread; Ricochet/Forked/Blast should be excluded on multiHit rows). Brood takes Surplus (+1 drone). Swarm Signal takes Lingering. Family-scoped upgrade worth creating: "Envenomed Mandibles" (1 SP, families: ['insectoid'], on `raceMandibleStrike`: patch `{ statusEffects: [{ id: 'poison', duration: 1 }] }`) so the multi-hit can open the venom loop.

### 🕷️🕸️ Arachnid Powers `arachnid` — VERDICT: GROW (add the T4 payoff, make the zone a web)
**Identity.** Root control from range: single web, area web, a persistent web zone, then the payoff that eats what is caught — voidweaver's ambush ladder.
**Races.** voidweaver only ("reality-anchored webs that trap subjects between dimensional layers") — fits exactly; rule 2 applies, no other race in races.md is arachnid. Nothing to add.
**Now.**
- T1 Web Shoot `raceWebLaunch` · 80 PHYSICAL, rng 4, Rooted 1.
- T2 Web Snare `raceWebSnare` · 100 MAGIC 3×3, rng 4, Rooted 1.
- T3 Dimensional Web `raceDimensionalWeb` · zone 3×3 for 2 turns, rng 4, Slow 2; desc says "heavily slowed".
**Problems.**
- Web Shoot is physical on a race with atk 40 / int 58 while Web Snare and both Fractal damage rows (Fractal Stitch 130, Fractal Needle 170; Dimensional Fold is a swap) are magic — one damage type per race.
- Dimensional Web is a slow zone in a family whose whole point is ROOT; it overlaps the 26 slow setups in the game and does nothing for Venom Fang (root finisher) or Land Ho-style payoffs. A web that "traps subjects between dimensional layers" should hold, not slow.
- No T4: the family sets Rooted two ways today (Web Shoot, Web Snare — Dimensional Web is a Slow zone; three ways after the rewrite below) and the only payoff voidweaver owns is T1 Venom Fang (×1.5 on a 100 hit).
**Changes.**
- RECOST `raceWebLaunch` damageType physical → magic (arcane), keep 80 / rng 4 / Rooted 1. Desc: "A thread of void-silk. WEAK arcane damage and the target is Rooted for a round."
- REWRITE `raceDimensionalWeb`: zone 3×3 for 2 rounds, rng 4, 75 MP; enemies inside are Rooted 1 at the start of each of their turns (re-applied while they stand in it) instead of Slow 2. "Weave a web between dimensions. Whatever stands in it cannot leave." Burst root (Web Snare, with damage) vs persistent root (this, no damage) is a real choice.
**Additions.**
- NEW **Cocoon** — T4, damageEffect/damage, arcane/magic, 100 MP / 1 AP, rng 4, single, 170 magic, Silence 1, ×1.5 vs Rooted. "The silk closes over the mouth first. HEAVY arcane damage; a Rooted target is wrapped tight and takes half again." The family's payoff and voidweaver's damage T4 (its only other damage T4 is Fractal Needle, which needs a teammate's Stun; its other T4 is the Swarm Signal buff); with Exploit it is ×2 on a rooted victim.
**Upgrades.** Web Shoot: Long Reach (rng 5) and Lingering (Rooted 2) — do not add a "Long Web". Web Snare: Widen (5×5 root) is the area ceiling. Dimensional Web: Lingering (3 rounds). Cocoon: Exploit + Empowered. Exclude Blast/Forked on Cocoon (it is the single-target reward).

### 🕸️ Symbiosis `symbiosis` — VERDICT: KEEP (rebuild as a PHYSICAL living-suit ladder)
**Identity.** The suit fights for the host: reach-2 tendrils that feed on the hit, a web-line to close distance, and a shell that knits the host once per life — a physical assassin's sustain-through-damage family.
**Races.** symbiote only ("host bonded with an extraterrestrial parasitic organism … strength +400%, regenerative capacity") — fits; rule 2, nobody else is a host. Nothing to add.
**Now.**
- T2 Symbiote Armor `raceSymbioteArmor` · self Regen 2, 50 MP.
- T3 Symbiotic Drain `raceSymbioticDrain` · 125 MAGIC lifeDrain, rng 2, drain 40%, ×1.5 vs Poisoned.
- T4 Tendril Strike `raceTendrilStrike` · 180 physical, rng 2, Poison 2.
**Problems.**
- Symbiote is atk 70 / int 31: Symbiotic Drain (magic) is a dead row on its only owner, and it is the same row as Absorb `raceAbsorb` (Ooze T2: 130 magic lifeDrain, rng 1, drain 40%, ×1.5 vs Poison/Goo) which symbiote ALSO owns at a lower tier — summary redundancy group "damage | lifeDrain".
- Symbiote Armor (Regen 2 self, T2, 50 MP) is the same row as Mitosis `raceMitosisSplit` (Ooze T4, Regen 2 self, 100 MP) — symbiote owns both; one of them is pointless.
- No T1; the desc promises "webbing" and there is none.
**Changes.**
- REWRITE `raceSymbioticDrain`: damageType magic → PHYSICAL, 125 physical, rng 2, drain 40%, keep ×1.5 vs Poisoned. "The tendrils drink from the wound." Now the suit's drain vs the ooze's drain are different stats, different ranges and different finishers.
- PASSIVE: `raceSymbioteArmor` becomes the family passive "Symbiote Armor" (T2, 2 SP, hooks `{ healOnceBelowPct: { pct: 40, healPct: 30 } }`) — "Once per life, when the host falls under 40% HP the suit knits it back for 30% of max HP." Distinct from Regen and from Immortal Cycle (active, 50%, CD4).
**Additions.**
- NEW **Tendril Whip** `raceTendrilWhip` — T1, damageEffect/damage, poison/physical, 25 MP / 1 AP, rng 2, single, 90 physical, applies Poison 2, NO drain. "The suit lashes out two tiles. The barbs stay in." SKEPTIC: the first draft (100 physical, rng 2, drain 25%) was a second physical reach-2 lifeDrain in a family whose T3 (Symbiotic Drain, rewritten above) is exactly that row with bigger numbers — a "bigger tendril" is Empowered, not a spell (rule d). As a poison opener it is instead the family's SETUP: Whip (Poison 2) → Symbiotic Drain (×1.5 vs Poisoned, the family's only drain) → Tendril Strike (180, refreshes Poison) is a self-contained loop for symbiote. Distinct from Infectious Bite (Poison T1: rng 1, 100, Poison 3) by reach and numbers.
- NEW **Web Swing** — T2, movement/teleport, 50 MP / 1 AP, rng 4, needs line of sight: fling a line of webbing and swing to any free tile within 4. "The line goes out, the host goes after it." Symbiote's only mobility today is Icky Surprise (ooze tiles only); an assassin needs a clean close/escape and the family desc promised webbing.
**Upgrades.** Tendril Whip: Lingering (Poison 3) + Long Reach (rng 3). Symbiotic Drain: Empowered, Long Reach (rng 3), Exploit (×2 vs Poisoned). Tendril Strike: Lingering (Poison 3) + Empowered — do not add a bigger tendril. Web Swing: Long Reach.

### 🫧 Ooze Biology `ooze` — VERDICT: KEEP (Mitosis must split; Splash comes home)
**Identity.** Paint the floor black and punish anyone standing on it: goo (heals halved, −1 MOV, magic ×1.25), ooze terrain, teleports through ooze, drains on gooed targets, and a body that divides — the terrain-control specialist family.
**Races.** black goo (Oozing passive: contact goo + trails ooze) is the model owner; symbiote ("same biological class as BLACK GOO") fits. Nothing else in races.md is an ooze — keep at two.
**Now.**
- T1 Goo Shot `raceGooShot` · 90 magic, rng 4, Goo 2 first, paints the tile ooze 3 rounds.
- T1 Ooze Trail `raceOozeTrail` · terrain: 1 tile swamp (spreads downhill), rng 4, Slow 1.
- T2 Absorb `raceAbsorb` · 130 magic lifeDrain, rng 1, drain 40%, ×1.5 vs Poison/Goo.
- T2 Icky Surprise `raceIckySurprise` · teleport to any ooze tile within 6, no LOS.
- T3 Toxic Nova `raceToxicNova` · 125 magic self 5×5, Poison 3, 2 AP.
- T4 Mitosis `raceMitosisSplit` · self Regen 2, 100 MP.
**Problems.**
- Mitosis is a 100 MP Regen 2 — identical to Symbiote Armor (T2, 50 MP), worthless at T4, and the name / family desc ("absorbing and splitting") promise a split that does not happen.
- Splash `raceSplash` (Poison T3: 60 magic self 3×3, Goo 2, paints the whole 3×3 ooze 3 rounds) is pure ooze — "Burst outward … turns to ooze" — sitting in the Poison family that 12 races own. Bee queen's rung 3 is Splash: a bee bursting into black ooze is the yeti test failing.
- Goo has exactly one payoff in the game (Absorb) and it is melee; Toxic Nova (5×5 Poison 3, 2 AP) is the family's only area and it is on scale (T3 area ~125) — fine as is.
**Changes.**
- REWRITE `raceMitosisSplit`: T4 deploy/summonUnit, poison, 100 MP / 1 AP, rng 1, single tile, `maxActivePerCaster: 1`, `summonDef: { key: 'blob', name: 'Blob', move: 3, dmg: 70, hits: 4, armored: true }` — a hits-to-kill body on the engine's pet model (compare Summon Creation T2: dmg 90 / 4 hits / armored; Blob is slower and softer-hitting but a T4 body that survives four hits). "Two of it now. Containment will want to know." SKEPTIC: the first draft (caster pays 20% current HP; Blob = 40% of caster's max HP with the caster's ATK/DEF/MDEF, Oozing passive, 3-round expiry) used fields that exist nowhere in data.js or battle.js — there is no hpCost hook and the summon model has no HP/DEF/expiry/passive slots. The one thing that makes this an OOZE body — the tile it stands on turning to ooze — needs a new `summonDef.trailTerrain: { type: 'ooze', rounds: 3 }` hook: list as engine work. Until it lands, Mitosis is still a real T4 (a second body for Icky Surprise to reach and Absorb to feed beside), which the Regen 2 row never was.
- MOVE `raceSplash` → `ooze` (black goo's rung 3 alt stays legal). Bee queen RACE_TREE rung 3 → the new `raceBrood` (insectoid). Poison Abilities loses its only T3 — that family's slice should replace it with a real poison T3 rather than keep a black-goo spell.
**Additions.** None — with Splash home the ladder is T1 ×2 / T2 ×2 / T3 ×2 / T4 and every rung has a distinct job (goo + paint, terrain, drain, teleport, big area, split).
**Upgrades.** Goo Shot: Blast (3×3 goo) and Long Reach — the family's ranged area goo is that upgrade, not a new spell. Absorb: Exploit (×2 vs gooed) is the payoff ceiling. Toxic Nova: Widen is pointless (already 5×5); Lingering (Poison 4). Mitosis: Surplus (+1 blob). Family-scoped upgrade worth creating: "Sticky" (1 SP, families: ['ooze'], on `raceOozeTrail`: patch `{ statusEffects: [{ id: 'goo', duration: 1 }] }`) so the trail also goos what wades through it.

### 🪼 Jellyfish `jellyfish` — VERDICT: KEEP (retune every number, take Ocean Current in, make Wet pay)
**Identity.** The drifting sovereign: a control caster that soaks the field, stings what is soaked, roots what gets close, drifts away and grows back — Wet is its currency, and it hands lightning / ice teammates a ×1.5 / flash-frozen (Stun 1) board via the engine's soak combo layer.
**Races.** jellyfish only — fits by definition; rule 2. Nothing to add.
**Now.**
- T1 Sting `raceJellySting` · 80 magic, rng 2, Poison 2.
- T2 Bloom `raceJellyBloom` · 70 magic 3×3, rng 3, Wet 2.
- T3 Nematocyst Net `raceJellyNet` · 95 magic, rng 3, Rooted 2.
- T4 Immortal Cycle `raceJellyRebirth` · self heal 50% + cleanse 2, CD 4.
- (in Deep Sea today) T2 Ocean Current `raceJellyDrift` · teleport within 3; desc "the bell folds, the water carries it".
**Problems.**
- Sting is strictly worse than Infectious Bite `raceInfectiousBite` (Poison family, which jellyfish owns: 100 physical + Poison 3) except for range 2 — and it is a magic row, so it should win on this race, not lose.
- Bloom 70 area at T2 (house T2 area ~100) and Net 95 single at T3 (house ~125–135) are both a full tier under-tuned; the statuses do not justify it because no SPELL pays off Wet (synergy.md: wet PAYOFF(0) NONE — its only value is the engine combo layer: lightning ×1.5, frost flash-freezes to Stun 1, fire ×0.75, immune to Burn, all of which need a teammate) and Rooted has no payoff in the jellyfish pool.
- Ocean Current has a jellyfish id, a jellyfish desc and sits in the 8-race Deep Sea family beside Deep Dive (also T2, also 3 tiles) — the same rung twice in one family.
**Changes.**
- REWRITE `raceJellySting`: 90 water magic, rng 2, Poison 2, finisher ×1.5 vs WET. "A tentacle brushes past. The venom runs faster through soaked skin." Bloom → Sting is now a self-contained loop; standing in water counts as Wet, so it also pays off the Water family's floods. SKEPTIC: today the finisher resolver reads the Wet STATUS only — the burn-immunity check (battle.js ~7715) is what consults `_unitIsSoaked`; the water-tile half of this claim needs the `bonusVsStatus` check to call `_unitIsSoaked(target)` when the key is `wet` (one-line engine change, shared with Depth Charge below).
- RECOST `raceJellyBloom` dmg 70 → 100 (T2 area scale), keep 3×3 / rng 3 / Wet 2.
- RECOST `raceJellyNet` dmg 95 → 125 (T3 scale), keep rng 3 / Rooted 2.
- MOVE `raceJellyDrift` → `jellyfish` (jellyfish rung 2 alt stays legal; Deep Sea keeps Deep Dive as its one T2 movement).
**Additions.** None — T1 / T2 / T2 / T3 / T4 with setup (Bloom), payoff (Sting), control (Net), mobility (Current) and sustain (Cycle) is a complete kit.
**Upgrades.** Bloom: Widen (5×5 Wet) is the family's board-soak — do not add a bigger bloom; Lingering (Wet 3). Sting: Exploit (×2 vs Wet) + Ricochet. Net: Lingering (Rooted 3). Immortal Cycle: Efficient. Ocean Current: Long Reach.

### 🦑 Tentacle Appendages `tentacleappendages` — VERDICT: RENAME → "Cephalopod Anatomy" + GROW (3 rungs; Ink Cloud moves in)
**Identity.** The kraken's arms and ink: pull, hold, thrash, blind — a slow support controller's ladder that feeds its Water / Wind T4s (Vortex Slam, Tidal Slam, Call of the Deep) by dragging enemies into place.
**Races.** kraken only ("Cephalopod entity … biochemical discharge that disrupts electronic sensors" = ink) — fits; rule 2. No other cephalopod in races.md. The rename is because Ink Cloud (below) is not a tentacle, and it parallels Insectoid / Deep Sea "Anatomy".
**Now.**
- T1 Tentacle Lash `raceTentacleLash` · 80 PHYSICAL, rng 3, pull 2 (kraken is atk 40 / int 69).
- (in Deep Sea today) T2 Ink Cloud `raceInkCloud` · zone 3×3 for 2 turns, rng 4, Discord 2 (ATK −2 / DEF −1).
**Problems.**
- One-spell family; the one spell is physical on a caster-statted support and is the same row as Harvest Hook (scarecrow T1, 80 pull 4).
- Ink Cloud sits in Deep Sea Anatomy where mermaid, sharkman, nessie, starfish, jellyfish and deep sea fish all "spray ink" — only a cephalopod does. It is kraken's rung 2; it belongs on kraken's own family.
- Kraken's pool has no Rooted payoff and no buff (summary: kraken missing buff) — it needs a control loop of its own.
**Changes.**
- FAMILY_RENAME `tentacleappendages` "Tentacle Appendages" → "Cephalopod Anatomy" (glyph 🦑 stays).
- RECOST `raceTentacleLash` damageType physical → magic (water), keep 80 / rng 3 / pull 2. "An arm from below the surface. WEAK water damage and the target is dragged two tiles toward you."
- MOVE `raceInkCloud` → `tentacleappendages` (kraken rung 2 stays legal). Deep sea fish RACE_TREE rung 2 (`raceInkCloud`) → `raceDeepDive`; an anglerfish that dives fits its "lure, blind and bite" lore better than ink.
**Additions.**
- NEW **Constrict** — T2, effect/debuff, water, 50 MP / 1 AP, rng 2, single: Rooted 2 and DEF −1 stage. "Two arms, then four. It is not going anywhere." The hold between the pull (T1) and the beating (T3); also sets up Venom Fang / Land Ho / Precision Shot teammates.
- NEW **Eightfold Lash** `raceEightfoldLash` — T3, damage/multiHit, water/magic, 75 MP / 1 AP, rng 2, single, `hitDamages: [32,32,32,32]` (128 nominal, the T3 single median is 125), ×1.5 vs Rooted (192 on its own Constrict). SKEPTIC: trimmed from 4 × 35 = 140 — that beat Team Strike (T3, 5 × 27 = 135, 2 AP, no finisher) at 1 AP before the finisher, in a family that has no T4 to sit above it. "All of them at once." The family's payoff on its own Constrict; the multi-hit shape is the one thing a kraken should have that nobody else does.
- No T4 on purpose: kraken already carries six T4s (Vortex Slam, Call of the Deep, Great Flood, Tidal Slam, Tsunami, Poseidon's Wrath); this family is the T1–T3 control ladder that makes those land.
**Upgrades.** Tentacle Lash: Undertow (pull 3) and Long Reach — that is the "long tentacle"; do not add one. Constrict: Lingering (Rooted 3). Eightfold Lash: Exploit + Empowered; exclude Ricochet / Forked / Blast on multiHit. Ink Cloud: Widen (5×5 discord) + Lingering.

### 🌊 Deep Sea Anatomy `deepsea` — VERDICT: KEEP (the shared aquatic body: soak, dive, punish the water)
**Identity.** What every sea creature has in common: it is at home in water and its enemies are not — a T1 soak, a dive that resurfaces protected, a blast that hits soaked targets harder, and the T4 that drowns everyone standing in water. Pairs with the Water family's floods and with lightning / ice teammates.
**Races.** mermaid, kraken, loch ness monster, jellyfish, starfish, deep sea fish, sharkman all fit (aquatic bodies; six of the seven carry water resist / lightning weak — jellyfish is the only one with no affinity). RACE_REMOVE kaiju: nothing in its lore is aquatic ("bipedal organism … hybrid biological-technological anatomy … directed-energy discharge"); it has no ink, no drift, no gills — the yeti test. SKEPTIC: as written this left kaiju on TWO families (Kaiju Rampage + Earth), below the 3-family floor. Paired fix — RACE_ADD kaiju → `titan` (Giant Abilities: Fee Fi Fo Fum, Titan Drop, Colossal Crush, Giant Smash — all physical stomps/drops on an atk 100 bruiser, and the one family whose theme IS the lore line "organism of unprecedented scale, est. 8–12m height"; giant / cyclops / nephilim / juggernaut are its current owners). Kaiju's four RACE_TREE rungs all sit in Kaiju Rampage, so nothing else moves; the Giant slice should note the new owner. RACE_ADD atlantean: "recovered from submerged ruins at depth 4,200m", water resist, and summary.md lists atlantean as missing movement — Deep Dive is exactly that.
**Now.**
- T2 Deep Dive `raceDeepDive` · teleport 3, Protect 1 on emerging, CD 2.
- T2 Ink Cloud `raceInkCloud` · zone 3×3 Discord 2 (→ moving to Cephalopod Anatomy).
- T2 Ocean Current `raceJellyDrift` · teleport 3 (→ moving to Jellyfish).
- T3 Depth Charge `raceDepthCharge` · 125 PHYSICAL 3×3, rng 4, ×1.5 vs Discord.
- T4 Poseidon's Wrath `racePoseidonsWrath` · 170 magic to every enemy standing in water anywhere, 2 AP, 75 MP.
**Problems.**
- Three T2s and two of them are the same rung (Deep Dive and Ocean Current both move 3 tiles); no T1.
- Ink Cloud fails the yeti test on every owner but kraken (seven of eight, kaiju included; see Cephalopod Anatomy).
- Depth Charge's Discord finisher is set up only by Ink Cloud inside the family; with Ink Cloud gone, starfish, jellyfish and deep sea fish have no Discord source at all (synergy.md per-race lines) — and the row is physical, dead on mermaid (atk 8), starfish (26), jellyfish (18), kraken (40).
- Poseidon's Wrath is off the MP ladder (75 at T4; summary "MP cost vs tier").
- The family's real mechanic — water tiles — is only referenced by the T4; Wet (which standing in water applies, battle.js `_soakUnit` / `_unitIsSoaked`) has no spell finisher anywhere in the game (synergy.md: wet PAYOFF(0)) — only the engine combo layer (lightning ×1.5, frost flash-freeze = Stun 1, fire ×0.75, immune to Burn) rewards it, and none of that is in this family.
**Changes.**
- MOVE `raceInkCloud` → `tentacleappendages`; MOVE `raceJellyDrift` → `jellyfish` (both above).
- REWRITE `raceDepthCharge`: 125 physical 3×3, rng 4, finisher ×1.5 vs WET instead of Discord. "It goes off under the surface. Anything soaked — or standing in the water — takes the shock through its body." Every owner can now set it up (Spout, Bloom, any flood, any water tile — the water-tile case needs the same `bonusVsStatus` → `_unitIsSoaked` engine line noted under Sting); it stays the bruiser rung (sharkman 92, deep sea fish 84, nessie 54) while Poseidon's Wrath is the caster rung.
- RECOST `racePoseidonsWrath` 75 MP → 100 MP (T4 ladder), keep 170 / 2 AP / water-only.
- RACE_REMOVE kaiju (with RACE_ADD kaiju → `titan`, so it stays at 3 families); RACE_ADD atlantean.
**Additions.**
- NEW **Spout** — T1, damageEffect/damage, water/magic, 25 MP / 1 AP, rng 3, single, 80 water magic, Wet 2. "A jet of seawater from the gills. WEAK water damage and the target is soaked through." The family's setup: feeds Depth Charge and Sting inside the sea, and hands Thunderbolt / Ice Shard teammates ×1.5 lightning and flash-frozen (Stun 1) targets via the engine's soak combo layer — the team-building hook for a whole "wet board" strategy.
- PASSIVE: new family passive **Deep Adapted** — T1, 1 SP, hooks `{ terrainBonus: { water: { defStages: 1, spdStages: 1 }, deep_water: { defStages: 1, spdStages: 1 } } }`. "Built for pressure: +1 DEF stage and +1 SPD stage while standing in water." Makes the Water family's floods a home-field advantage for these races instead of a hazard for everyone.
**Upgrades.** Spout: Blast (3×3 soak) and Long Reach — the area soak is the upgrade, not a spell (jellyfish has Bloom for that). Depth Charge: Exploit (×2 vs Wet) + Widen. Deep Dive: Lingering (Protect 2), Efficient. Poseidon's Wrath: Empowered, Efficient; exclude Widen / Blast (it is already everywhere). Family-scoped upgrade worth creating: "Undertow Charge" (1 SP, families: ['deepsea'], on `raceDepthCharge`: patch `{ pullToCenter: true }` — the top-level flag Whirlpool `raceRiptide` already carries; the engine reads it on the aoePull kind, so the patch must also be honoured on damage/aoe or set `kind: 'aoePull'` — one-line engine check) — the blast drags the 3×3 into the water it just hit.

SPELL COUNT: 27 → 36 for this group (8 new rows: Brood, Cocoon, Tendril Whip, Web Swing, Constrict, Eightfold Lash, Spout, Deep Adapted; +1 moved in from Poison: Splash; Ink Cloud and Ocean Current move within the group; 0 deleted). RACE CHANGES after skeptic pass: deepsea −kaiju +atlantean; kaiju +titan (cross-slice, keeps it at 3 families); insectoid unchanged (mothman add struck). ENGINE WORK flagged, not assumed: `summonDef.hitStatus` (Brood poison bite), `summonDef.trailTerrain` (Mitosis ooze trail), `bonusVsStatus` reading `_unitIsSoaked` for `wet` (Sting / Depth Charge water-tile finisher), `pullToCenter` honoured on damage/aoe (Undertow Charge).
