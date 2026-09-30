### 🔥 Fire Magic `fire` — VERDICT: KEEP (reshape the T1–T3)
**Identity.** The burn engine: set Burn cheaply, then detonate it — the family every other Burn payoff in the game (Merkaba, Dragon Slash, Fire for Effect, Heat Vision, Splitting Arrow) wants on the team. Flavour: hellfire, wizard fire, candle-fire.
**Races.** Fit: wizard (generic caster), demon (1,200°C surface, fire resist), demon prince, overlord (fire resist, Hellfire Crown, Scorched Earth rung), dragon (combustion discharge), jack o lantern (Candlelit, fire resist, rungs `fire1` + `meteor`). Misfit: **martian** — lore is "energy weapon discharge"; his burn is Heat Ray in Alien Weapons and none of his 4 rungs touch this family. Yeti test fails: Mars is red, not on fire. RACE_REMOVE martian (Alien Weapons + UFO + Desert already carry him at pool 17→13). No missing race is obvious; the other fire-resist races (halfdemon, goatman, fallen angel) and the fire-ABSORB kaiju all burn through their own kits.
**Now.**
- T1 Fireball `fire1` · single 80 magic, rng 3, no status.
- T3 Scorched Earth `sharedScorchedEarth` · 3-tile line, 70 dmg, rng 4, leaves scorched.
- T3 Wall of Fire `wallOfFire` · 3-tile line, 80 dmg, rng 3, Burn 2, scorched, wall persists 3 rounds and spreads through grass/trees.
- T4 Meteor `meteor` · 3×3 160, Burn 3, finisher Burn ×1.5, grounds flyers, crater deform, scorched, 1AP CD2.
**Problems.** Fireball is 80 at T1 (house 100; Ice Spear 100 + Slow, Smite 100) and applies nothing — the family's own T4 finisher (Meteor, Burn ×1.5) has no in-family setup below T3. No T2 at all. Two T3 terrain-lines do the same job and Wall of Fire is better at the same 75MP in everything but reach (80 vs 70, Burn 2, persists, spreads; Scorched Earth's only edge is rng 4 vs 3). Meteor is fine as the flagship.
**Changes.**
- REWRITE `fire1` Fireball: 100 magic single, rng 3, **Burn 2**, 25MP 1AP. "A fist of fire. MEDIUM magic damage; the target keeps burning." This is the setup for Meteor and for every allied Burn payoff.
- DELETE `sharedScorchedEarth` (Wall of Fire covers the scorched line better in every column but range; give `wallOfFire` rng 4 so nothing is lost). Demon prince rung 3 and overlord rung 3 (`sharedScorchedEarth`) → `wallOfFire`.
- RECOST `meteor`: keep numbers; REWRITE description to strike "Destroys buildings" — checked the row: status/finisher/groundsFlyers/leaveTerrain/terrainDeform only, no building field, so the sentence is a lie today.
- PASSIVE: new family passive **Cinder Touch** (T1, 1 SP, hook `physicalElementRider`: basic attacks are fire-element and apply Burn 1). Gives demon/dragon/overlord melee builds a Burn source without a spell slot.
**Additions.**
- NEW **Combust** `raceCombust` — T2, damage/damage, fire/magic, 50MP 1AP, rng 4, single, 130 dmg, finisher Burn ×1.5. "Feed the fire what it wants. MEDIUM magic damage — a Burning target goes up like tinder." Reason: the T2 rung and the in-family Burn payoff a T1 Fireball can enable next turn; with the Blast upgrade it is the family's "explode the burning guy" 3×3 — no separate spell needed.
**Upgrades.** Blast on Combust is the family's detonation (do not add a Fire Blast spell). Widen on Meteor for the 5×5. Lingering on Fireball (Burn 3) is the cheap enabler. No family-scoped upgrade needed.

### ❄️ Ice Magic `ice` — VERDICT: KEEP (trim the T1 twins, add the shatter)
**Identity.** Control caster: Slow at range, Freeze in an area, then shatter what is frozen; leaves ice floors that change movement. Cold as a weapon, not as a season.
**Races.** Fit: wizard, yeti (cryokinetic, ice resist), ice queen (ice immune), santa clause (North Pole, ice resist). Misfits: **loch ness monster** — SKEPTIC: an ice-resist stat is not a theme; her lore is armour plating, acoustic camouflage and a deep loch, none of her four rungs (Whirlpool, Deep Dive, Cryptid Vanish, Tidal Slam) is here, and she no more makes ice than the yeti makes Christmas. RACE_REMOVE loch ness monster (pool 24 → 16; Deep Sea Anatomy + Water + Cryptid remain = 3). **atlantean** — lore is "innate manipulation of localized temporal fields", water affinity, no ice; none of his rungs are in this family. RACE_SWAP atlantean: Ice Magic → Temporal Abilities (glitch, cosmic wraith, watcher, cult leader, rabbit already own it; Temporal Tide is literally his rung). Missing: none — superhero's Freeze Breath and ghost's Grave Chill/Cold Spot are correctly flavoured in their own kits.
**Now.**
- T1 Ice Shard `raceIceShard` · 100 single, rng 3, Slow 1.
- T1 Ice Spear `raceIceSpear` · 100 single, rng 5, Slow 2.
- T1 Summon Blizzard `sharedSummonBlizzard` · weather, 25MP **2AP**.
- T2 Flash Freeze `sharedFlashFreeze` · 3-tile line 90, Frozen 1, ice terrain.
- T2 Ice Slide `raceIceSlide` · dash, 140 physical, 70 along the path, leaves ice.
- T3 Diamond Dust `raceDiamondDust` · X r2 125, Slow 2, ice, **2AP**.
- T3 Permafrost `racePermafrost` · 3×3 120, Frozen 2, ice, kills seeds/trees, 2AP CD2.
- T4 Absolute Zero `raceAbsoluteZero` · single 180, Frozen 2, 2AP CD2.
**Problems.** Ice Spear is Ice Shard with +2 range and +1 Slow at the same 25MP — a strictly dominated twin (Grave Chill in Poltergeist is the same row a third time). Weather summons are priced four ways across the game: Blizzard T1/25MP/2AP, Blood Rain T1/25MP/2AP, Thunderstorm T2/50MP/1AP, Sandstorm T2/50MP/1AP. Diamond Dust costs 2AP for 125 X-shape + Slow 2 while Resonance Pulse (Sonic T3) does 135 cross + Slow 1 + push for 1AP. Ice sets Frozen three times (Flash Freeze, Permafrost, Absolute Zero) but has no Frozen payoff of its own — the only shatters are Winter Warfare and Christmas rows. Absolute Zero (180, Frozen 2, 2AP, CD2) is out-classed by Avalanche Strike (Winter T4: 180, Frozen 1, finisher Frozen ×1.5, 1AP, no CD) on the very same races — fixed on the Winter side below.
**Changes.**
- DELETE `raceIceShard` (dominated by Ice Spear; Grave Chill exists for ghosts). Yeti rung 1 `[raceFrozenPunch, raceIceShard]` → `[raceFrozenPunch, raceIceSpear]`.
- RECOST `raceIceSpear`: rng 5 → 4 (keeps Slow 2; rng 5 at T1 was the reason Shard looked bad, not the reason Spear was good).
- RETIER `sharedSummonBlizzard` T1 → T2, 25MP → 50MP, 2AP → 1AP (unify every weather summon on Sandstorm's pricing).
- RECOST `raceDiamondDust`: 2AP → 1AP.
- RECOST `raceIceSlide`: 140 → 130 (T2 single house).
- PASSIVE: new family passive **Snowborn** (T1, 1 SP, hooks `weatherBonus` + `terrainBonus`): immune to the blizzard's blinding, does not slide on ice tiles, +10% magic damage while a blizzard is up.
**Additions.**
- NEW **Shatter** `raceShatter` — T1, damage/damage, ice/magic, 25MP 1AP, rng 4, single, 100 dmg, finisher Frozen ×1.5. "Tap the ice and watch it go. MEDIUM magic damage — a Frozen target takes it through every crack." Reason: the in-family payoff that makes Flash Freeze → Shatter a two-turn plan for the caster, mirroring Winter's melee Frozen Punch.
**Upgrades.** Widen on Permafrost (5×5 freeze) is the big-lock option — do not add a 5×5 ice spell. Lingering on Flash Freeze (Frozen 2) is the value pick. Forked on Shatter turns one shatter into two. Do not let Ice Slide take Blast (it is already a path hit).

### ⚡ Lightning Magic `lightning` — VERDICT: GROW
**Identity.** Burst and chain: one bolt that jumps, a storm that keeps striking, and the payoff for Wet targets — the cross-element partner for Water teams.
**Races.** Fit: wizard; mothman (Thunderstorm is his T2 rung; "appears before catastrophe" — the storm that comes with him). Missing: **djinn** — "Elemental entity of immense energy manipulation capability" is the only race described as an elemental, and his pool is 12. RACE_ADD djinn. (Mad scientist's Tesla Coil and sentai's Yellow Thunder are tech/colour flavour and stay where they are.)
**Now.**
- T2 Summon Thunderstorm `thunderstorm` · weather, 50MP 1AP, description says nothing about what the weather does.
- T2 Thunderbolt `thunder1` · single 130, rng 3, chainProfile [125, 82, 50] — the description says "Single Enemy" and never mentions the chain.
**Problems.** Two spells, both T2. Thunderbolt's row carries a three-target chain worth 257 total at 50MP while the text sells it as a single hit; a 3-chain at T2 out-damages Prism Burst and Splitting Arrow (both T3 125 ricochet). The weather summon has no readable effect. Wet (set by Bloom) has zero payoffs anywhere in the game — this is the family that should own that payoff.
**Changes.**
- REWRITE `thunder1` Thunderbolt: T2, 130 magic single, rng 4, **no chain**, finisher Wet ×1.5. "One bolt, one target. MEDIUM magic damage — a Wet target lights up for half again."
- REWRITE `thunderstorm` description to state the weather rule (the row is opaque): "Summons a thunderstorm for 3 rounds: at the end of each round a bolt strikes one random visible enemy for 40 lightning damage, preferring Wet targets; flyers in the storm are grounded." If the engine's thunderstorm does something else, write that instead — the current text promises nothing.
- PASSIVE: new family passive **Live Wire** (T1, 1 SP, hook `physicalElementRider`): basic attacks are lightning-element and apply Stagger 1 to a Wet target.
**Additions.**
- NEW **Static Shock** `raceStaticShock` — T1, damageEffect/damage, lightning/magic, 25MP 1AP, rng 4, single, 100 dmg, Stagger 1. "A crack of static across the gap. MEDIUM magic damage, and the jolt costs them an action." Reason: the T1 rung; Stagger feeds Boulder Hurl / Robo Punch / Horn Toss payoffs on mixed teams.
- NEW **Chain Lightning** `raceChainLightning` — T3, damage/damage, lightning/magic, 75MP 1AP, rng 4, single, chainProfile [130, 85, 50] (jumps to 2 more enemies within 2 tiles of the last), finisher Wet ×1.5 on every hop. "It never wanted just one of you." Reason: the chain belongs at T3 next to Prism Burst; this is where Thunderbolt's hidden mechanic moves.
- NEW **Tempest** `raceTempest` — T4, damageEffect/aoe, lightning/magic, 100MP 2AP CD2, rng 4, 3×3, 160 dmg, Stun 1, grounds flyers, finisher Wet ×1.5. "Call the sky down on the lot of them. HEAVY magic damage to a 3×3; everything in it stops moving for a round and nothing in it stays airborne." Reason: the flagship; Stun 1 on a 3×3 at 2AP/CD2 sits under Permafrost's Frozen 2 at T3.
**Upgrades.** Forked on Thunderbolt is the cheap "two bolts" — keep it single-target so Forked has a job. Ricochet on Static Shock, not on Chain Lightning (it already chains). Widen on Tempest for the 5×5. Family-scoped upgrade worth adding: **Conductive** (1 SP, families: [lightning]) — chain hops gain +1 jump against Wet targets.

### 💧 Water Abilities `water` — VERDICT: KEEP (one T4 comes down, the zone heals stop twinning)
**Identity.** Battlefield-shaping control and sustain: pull, push, flood, slow — and now Wet, the tag Lightning and Ice pay off. The tide as terrain.
**Races.** Fit: all ten. Siren, mermaid (hydromancy), atlantean, kraken, loch ness monster, jellyfish, starfish, deep sea fish, sharkman are all sea creatures; firefighter's lore names the hose ("puts out fires, floods and fights with the same hose") and three of his four rungs are here. Missing: none — robots and AI are *weak* to water, not users of it.
**Now.**
- T1 Whirlpool `raceRiptide` · 3×3 **100**, pull to centre, Slow 1.
- T2 Tidal Blessing `raceTidalBlessing` · zone heal 52/turn, 2 rounds.
- T2 Water Pulse `sharedTidalSurge` · line 100, rng 5, push 2, Slow 1.
- T3 Temporal Tide `raceTemporalTide` · zone heal 100/turn, 2 rounds.
- T4 Call of the Deep `raceCallOfTheDeep` · single 160, 1 tile → deep water, finisher Silence ×1.5, 2AP; description is a template ("creates deep_water across 1 tiles").
- T4 Great Flood `raceFlood` · basin fill up to 12 tiles, 160, Slow 1, drowning, 2AP CD2.
- T4 Tidal Slam `raceTidalSlam` · self 3×3 170 physical, Slow 2, finisher Slow ×1.5, deep water, 1AP CD2.
- T4 Tsunami `raceTsunami` · 3-wide line 160, push 2, Slow 1, 2AP.
**Problems.** Whirlpool is a 100-damage 3×3 with pull and Slow at T1 (house T1 area 80; Dust Devil is the same shape at 80). Tidal Blessing and Temporal Tide are the same zone heal at two sizes — one role, two rungs. Four T4s and one T3. Call of the Deep's text is unwritten. Nothing in Water applies Wet even though Wet is the water status.
**Changes.**
- RECOST `raceRiptide` Whirlpool: 100 → 80.
- REWRITE `sharedTidalSurge` Water Pulse: status Slow 1 → **Wet 2** (keep 100 line, rng 5, push 2). Wet rule (needs the engine to honour it): Lightning finishers ×1.5, Frozen applied to a Wet unit lasts +1 round. Slow stays on Whirlpool/Tsunami/Tidal Slam so the family's own Slow finisher still works.
- REWRITE `raceTemporalTide` Temporal Tide (T3, 75MP 1AP, rng 3, 3×3, 2 rounds): allies inside heal 60/turn and shed 1 debuff per round; enemies inside are Slowed 1 each round ("time runs thick in the water"). Distinct from Tidal Blessing (pure 52/turn) instead of a bigger copy; the temporal name finally does something.
- RETIER `raceCallOfTheDeep` T4 → T3, 100MP → 75MP, 2AP → 1AP, 160 → 135; the target's tile becomes deep water and the target starts drowning; keep finisher Silence ×1.5 (Deafening Wail sets it on siren/mermaid). REWRITE description: "Something answers from below. MEDIUM magic damage to a Single Enemy, and the floor under them opens into deep water — they are drowning where they stand. Silenced targets cannot call for help: bonus damage." Siren rung 3 → `[raceDeafeningWail, raceCallOfTheDeep]`, rung 4 → `raceTsunami`; atlantean rung 4 `[raceTsunami, raceCallOfTheDeep]` → `[raceTsunami, raceFlood]`.
- RECOST `raceTidalSlam`: 170 → 160 (T4 house; it is 1AP).
- PASSIVE: new family passive **Gills** (T1, 1 SP, hooks `terrainBonus` + `regenPerRound`): water and deep water cost no extra movement and never drown this unit; regenerates 5% max HP at end of round while standing in water.
**Additions.** None — after the retier the ladder is T1 Whirlpool · T2 Tidal Blessing, Water Pulse · T3 Temporal Tide, Call of the Deep · T4 Great Flood, Tidal Slam, Tsunami.
**Upgrades.** Undertow on Whirlpool (pull +1) is the family pick. Widen on Tidal Blessing turns it into the raid heal — do not add a bigger zone heal. Knockback on Water Pulse (push 3). Lingering on Water Pulse extends Wet for the Lightning partner. Do not stack Blast on Call of the Deep (the drowning is the payoff).

### 🪨 Earth Abilities `earth` — VERDICT: KEEP (tiers are inverted; fix them)
**Identity.** Stagger and stone: heavy physical hits that cost the target actions, plus the ability to rewrite the floor — chasms, walls, craters. The tank/bruiser element.
**Races.** Fit: giant, cyclops, gargoyle, golem, crystal guardian (all earth-resist or stone-bodied), tree person (Deep Roots; rungs Tremor Stomp / Earthen Grasp / Quake), gnome (rung Fissure; classic earth spirit), kaiju (stomps, quake), dinosaur (stomps, rung Fissure), nephilim (giant-blooded, rung Fissure). Misfit: **annunaki** — ancient-astronaut lore, gravity rungs, Pyramid Protocol already in Occult; earth is not what he does and his pool is tied for the game's largest (27, with starfish). RACE_REMOVE annunaki — CONTINGENT (skeptic): g8 also drops him from Marksmanship, and both cannot land (Cosmic + Occult = 2 families, under the floor). If g8's removal stands, this line is VOID and annunaki stays on Earth — of the two, Earth is the one he can justify (Pyramid Protocol `raceZigguratProtocol` is an earth/physical terrain row: the ziggurat builder). Missing: bigfoot and king kong are earth-resist but their own kits already throw earth-element hits (Big Kick, Sasquatch Smash) — leave them.
**Now.**
- T1 Boulder Hurl `raceBoulderHurl` · 100 single, rng 3, finisher Stagger ×1.5.
- T1 Fissure `sharedFissure` · 3-tile line 100, **chasm terrain**, Stagger 1, deform −2.
- T1 Stonefall `raceStonefall` · 100 single, rng 4, Stagger 1, ignores LOS.
- T1 Tremor Stomp `raceTremorStomp` · self 3×3 **125**, Stagger 1, deform.
- T2 Earthen Grasp `raceEarthenGrasp` · 80 single, pull 2, Root 1, grounds flyers.
- T3 Ground Slam `groundSlam` · 3×3 125, Slow 2, deform; dead field `selfCenter`.
- T4 Quake `raceQuake` · self 5×5 160, Stagger 1, deform, 2AP.
- T4 Rampart `rampart` (alias `sharedRampart`) · 3 standing stones, 60 dmg, wall 2 high, 100MP.
- T4 Stone Drop `raceStoneDrop` · 150 + 25/level fall, finisher Stagger ×1.5, requires flight.
**Problems.** Tremor Stomp is a 125 area at T1 (the summary's first tier-rule offender) and is the same spell as Fee Fi Fo Fum (Titan T3, 125) — one of them is mispriced and it is the T1. Fissure digs a permanent 3-tile chasm for 25MP at T1 while Flash Freeze (T2) makes 3 tiles of ice for 50MP. Rampart is a T4 at 100MP that does exactly what Walls of Camelot does at T2/50MP (tiles3, wall 2 high, 60 dmg) and Pyramid Protocol at T2/80 dmg — it is the worst-priced row in the group. T2 and T3 have one spell each; T1 has four and T4 three (the index shows four because Rampart is listed under both `rampart` and its alias `sharedRampart`). Stone Throw (Stone Age, cyclops) is Boulder Hurl's 100/25MP body with Stonefall's rng-5-through-cover delivery and a Stun finisher — that section should fold it.
**Changes.**
- RECOST `raceTremorStomp`: 125 → 80 (T1 area house). Keep at T1 (tree person rung 1 stays).
- RETIER `sharedFissure` T1 → T2, 25MP → 50MP (keep 100, chasm, Stagger 1). Gnome rung 1 `sharedFissure` → `raceStonefall`; nephilim rung 3, golem rung 3, dinosaur rung 3 alt `sharedFissure` → `groundSlam`.
- RETIER `rampart` T4 → T2, 100MP → 50MP (matches Walls of Camelot). Crystal guardian rung 4 `rampart` → `raceQuake`. Fix Gothic Rampart's "Cheaper than Rampart" line in Living Stone.
- REWRITE `groundSlam`: remove the dead `selfCenter` field; it is already rng 0 self-centred. Keep Slow 2 (Earth's one Slow source for the Tidal Slam / Judgment payoffs).
- PASSIVE: new family passive **Mountainborn** (T1, 1 SP, hook `terrainBonus`): ignores elevation movement cost; +10% damage when attacking from higher ground; cannot be displaced by terrain deform.
**Additions.**
- ~~NEW Landslide (T3 line w1, 125, push 2, Stagger 1)~~ STRUCK (skeptic): a rng-4 earth/physical line that Staggers 1 is Fissure's row (line w1, Stagger 1, earth/physical) plus Empowered (+dmg) plus Knockback (push) — rule (d): a bigger number or a push on an existing shape is an upgrade, not a spell. Earth's T3 stays Ground Slam; after the retiers the ladder is T1 Boulder Hurl, Stonefall, Tremor Stomp · T2 Earthen Grasp, Fissure, Rampart · T3 Ground Slam · T4 Quake, Stone Drop — every tier filled, no addition needed.
**Upgrades.** Knockback on Fissure (push 1 across the chasm lip — the "shove them in" line without a new spell). Blast on Boulder Hurl for the ranged 3×3 — do not add a ranged earth area spell. Widen on Ground Slam. Exploit on Boulder Hurl and Stone Drop (they are the Stagger finishers). Family-scoped upgrade: **Bedrock** (1 SP, families: [earth]) — terrain this unit creates (chasm, mountain, crater) cannot be deformed by enemy spells.

### 🌪️ Wind Control `wind` — VERDICT: GROW
**Identity.** Displacement and flight: knock them where you want them, carry them into walls, lift your own people. The positioning element.
**Races.** Fit: angel, gargoyle, mothman, dragon, valkraye (all winged), superhero (flight; Sky Tackle is his rung alt). Misfit: **kraken** — a cephalopod making wind fails the yeti test; his rung here is Vortex Slam, which is a whirlpool in everything but element. RACE_SWAP kraken: Wind Control → Cryptid Abilities (lore: "It's not hiding from us. It's choosing when to be seen"; loch ness monster and mothman are already there); kraken rung 4 `sharedVortexSlam` → `raceTsunami`. Missing: seraphim (six wings) and fallen angel (Abyssal Wings) would pass, but their pools are 22 and 19 — leave them.
**Now.**
- T1 Wing Attack `raceWingGust` · self 3×3 80 physical, push 2.
- T3 Sky Tackle `raceSkyTackle` · 110 single, carry 4 tiles, +50 and Stagger on collision.
- T4 Vortex Slam `sharedVortexSlam` · 3×3 160 magic, pull to centre, Slow 1, 2AP.
**Problems.** No T2. The description promises "flight" and no row grants it (Fairy Dust in Fae does). Vortex Slam is a Whirlpool at T4 — keep it here as the tornado now that kraken is gone.
**Changes.**
- PASSIVE: new family passive **Windborne** (T1, 1 SP, hook `statBonus`): +1 MOV; push and pull effects cannot move this unit.
**Additions.**
- NEW **Gale** `raceGale` — T2, damageEffect/linePush, wind/magic, 50MP 1AP, rng 4, line w1, 100 dmg, push 3. "One long breath down the row. MEDIUM magic damage to everything in the line, and all of it three tiles further from you." Reason: the T2 rung and the family's ranged shove (Water Pulse pushes 2 with Wet; this pushes 3 with nothing).
- NEW **Updraft** `raceUpdraft` — T2, effect/buff, wind, 50MP 1AP, rng 3, single ally, Levitating 2 rounds and +1 MOV for 2 rounds (a flat statBonus, not a stage). "Give them the sky. One ally is Levitating for 2 rounds — flight, the high-ground bonus, and a little more reach." Reason: the flight the family's description already promises, as a single-target rung (Fairy Dust is the aura version).
**Upgrades.** Knockback on Wing Attack and Gale (the family's whole point). Undertow on Vortex Slam. Long Reach on Sky Tackle (carry 5). Do not give Updraft Surplus (it is not a deployable).

### 🌿 Nature Magic `nature` — VERDICT: KEEP (druid kit; seeds stay in Agriculture)
**Identity.** The druid: heal, cleanse, root, and a T4 that puts the whole squad back on its feet. Green healing and green control; the seeds and trees are Agriculture's job.
**Races.** Fit: shaman (ethnobotanical medicine, rung Herbal Remedy), fairy (no plant lore on her card — "reality distortion fields" — but the Fairy Forest is her home site per mushroom girl's file; borderline, kept), bigfoot (rung Treeline Retreat alt, forest cryptid), scarecrow ("controlling local flora within 50m"), mushroom girl (Sporeborn, rung Herbal Remedy), tree person, hippie ("grow their own medicine"). No misfits; no obvious missing race.
**Now.**
- T1 Herbal Remedy `raceHerbalRemedy` · heal 160, cleanse 2, rng 3.
- T2 Treeline Retreat `raceTreelineRetreat` · teleport 3, Regen 2; text is bigfoot-specific ("Lopes backwards… to eat berries").
- T3 Ayahuasca Retreat `raceAyahuascaRetreat` · self M DEF +1, heal 50%, cleanse all, 2AP.
- T3 Trunk Throw `trunkThrow` · 100 physical single, rng 4 (Green Thumb adds +30 per living tree).
**Problems.** Ayahuasca is a Drug Use spell by name and by owners (shaman and hippie, its two rung-holders, are both on Drug Use, which has only two T4s and nothing below). Trunk Throw is 100 at T3 (the summary's under-tuned T3 list) — its real power is the tree scaling, so its base belongs at T2. No T4. Treeline Retreat reads as one race's spell in a seven-race family.
**Changes.**
- MOVE `raceAyahuascaRetreat` → `psychadelic` (Drug Use): it becomes that family's T3; shaman/hippie rung 3 stays valid because both own Drug Use.
- RETIER `trunkThrow` T3 → T2, 75MP → 50MP (keep 100 base; Green Thumb still makes it the build-around). Bigfoot rung 3 and tree person rung 3 `trunkThrow` → `raceEntanglingRoots` (the new T3; both own Nature). Rung n sits at tier n everywhere this audit touches (yeti, santa, ice queen, orb…), so a T2 cannot stay on rung 3; Trunk Throw becomes their rung 2 alt: bigfoot `[raceRealityShift, raceTreelineRetreat]` → `[raceRealityShift, raceTreelineRetreat, trunkThrow]`, tree person `raceEarthenGrasp` → `[raceEarthenGrasp, trunkThrow]`.
- RENAME `raceTreelineRetreat` "Treeline Retreat" → "Into the Green"; REWRITE description generic: "Step back into the undergrowth. Teleport 3 tiles and Regen for 2 rounds." (Same numbers.)
- PASSIVE: new family passive **Photosynthesis** (T1, 1 SP, hooks `terrainBonus` + `regenPerRound`): regenerates 5% max HP at end of round while standing on grass or forest.
**Additions.**
- NEW **Entangling Roots** `raceEntanglingRoots` — T3, damageEffect/aoe, nature/magic, 75MP 1AP, rng 4, 3×3, 125 dmg, Root 1. "The ground remembers what it grew. MEDIUM magic damage to a 3×3 and nothing in it moves next round." Reason: the family's control rung; Root has five payoffs in the game (Haymaker, Precision Shot, Land Ho, Venom Fang, Life Drain) and only single-target setups so far.
- NEW **Rejuvenation** `raceRejuvenation` — T4, heal/healAll, nature, 100MP 2AP CD2, rng 0, aura r3: every ally within 3 heals 120, gains Regen 2 and sheds 1 debuff. "Everything green in you wakes up at once." Reason: Nature is the support element and had no T4; distinct from Heal All (Healing Magic T3, 140 flat, no regen) by the Regen and the radius.
**Upgrades.** Lingering on Entangling Roots (Root 2) is the lock. Widen on Rejuvenation. Efficient on Herbal Remedy. Trunk Throw takes Empowered, never Blast (the tree count is its scaling).

### ☠️ Poison Abilities `poison` — VERDICT: KEEP (four T1s, then nothing; build the top)
**Identity.** Attrition: cheap Poison on many targets, ground that keeps poisoning, and payoffs that punish the already-sick — plus Grievous for the anti-heal role no other element owns.
**Races.** Fit: reptilian (rung Poison Swamp), zombie (rung Infectious Bite), antperson (rung Formic Acid), demon princess (rung Poison Swamp; "curse propagation"), ghoul (paralytic bite), black goo, symbiote, jellyfish (neurotoxic venom), bee queen, mushroom girl (spores that rot), goblin (rung Infectious Bite). Misfit: **deep sea fish** — lore is lure, blind, bite; no venom, no rung here, and a pool of 26 (tied second-largest with cosmic wraith, behind annunaki/starfish at 27). RACE_REMOVE deep sea fish. Missing: none (mad scientist's Corroded lives in Chemistry).
**Now.**
- T1 Corrosive Splash `raceCorrosiveSplash` · 3×3 80, Poison 2.
- T1 Formic Acid `raceFormicAcid` · line 80, DEF −1, finisher Poison ×1.5, leaves poison.
- T1 Infectious Bite `raceInfectiousBite` · melee 100, Poison 3.
- T1 Poison Swamp `sharedPoisonSwamp` · spring on 1 tile, 80, spreads downhill.
- T3 Splash `raceSplash` · self 3×3 **60**, Goo 2, ooze for 3 rounds, **2AP**.
**Problems.** Four T1s, no T2, no T4. Splash pays 75MP and the whole activation for 60 damage — Goo is good (heals halved, −1 MOV, magic ×1.25) but not 2AP-at-T3 good; it is the rung for black goo, bee queen and mushroom girl. Formic Acid and Poison Swamp both leave poison ground but in different shapes and both are heavily used as rungs — keep both.
**Changes.**
- RETIER `raceSplash` T3 → T2, 75MP → 50MP, 2AP → 1AP (keep 60, Goo 2, ooze 3 rounds). Black goo rung 3 `[raceSplash, raceToxicNova]` → `[raceRot, raceToxicNova]`; bee queen rung 3 and mushroom girl rung 3 `raceSplash` → `raceRot` (the new T3; all three own Poison). Splash becomes bee queen's and mushroom girl's rung 2 alt (`[raceChitinArmor, raceSplash]`, `[racePixieDust, raceSplash]`).
- PASSIVE: new family passive **Venomous** (T1, 1 SP, hook `physicalElementRider`): basic attacks apply Poison 1.
**Additions.**
- NEW **Rot** `raceRot` — T3, damageEffect/damage, poison/magic, 75MP 1AP, rng 4, single, 125 dmg, Poison 2 + Grievous 2. "It does not heal. MEDIUM magic damage; the wound Poisons and will not close — healing on them is halved." Reason: the anti-heal answer to Water/Light zones and Regen teams; Grievous has two setups (Curb Stomp, Frenzy) and no dedicated caster row.
- NEW **Miasma** `raceMiasma` — T4, damageEffect/aoe, poison/magic, 100MP 2AP CD2, rng 4, 5×5, 160 dmg, Poison 3, finisher Poison ×1.5, the centre 3×3 becomes poison terrain. "The air goes green. HEAVY magic damage to a 5×5, Poison on all of it, and the middle stays poisoned after." Reason: the flagship and the in-family payoff for Corrosive Splash → Miasma.
**Upgrades.** Lingering on Infectious Bite (Poison 4). Exploit on Formic Acid (the family's T1 finisher). Widen on Corrosive Splash instead of a second 5×5 below Miasma. Family-scoped upgrade: **Contagion** (2 SP, families: [poison]) — when a Poisoned enemy this unit damaged dies, adjacent enemies gain Poison 2.

### ✨ Light `light` — VERDICT: KEEP (twin shields split by tier; Judgment must be magic)
**Identity.** Radiant damage that punishes Stunned/Slowed/Burning targets plus the shields that keep a line standing. The caster-healer's offensive element.
**Races.** Fit: priest, nun, angel, seraphim, orb of light, nordic (Aurora Ray and "Pleiadian" Shield are his rungs), chosen one (divine/unholy). Deep sea fish is odd on paper but lore-backed (the anglerfish lure, Abyss Eyes, rung Aurora Ray) — keep. No missing race.
**Now.**
- T1 Aurora Ray `raceAuroraRay` · 3×3 **100**, rng 5, DEF −1, finisher Stun ×1.5.
- T1 Smite `raceSmite` · 100 single, rng 3.
- T2 Light Shield `racePleiadianShield` · single-tile aoe shield 220 + DEF +1.
- T2 Luminous Shield `raceLuminousShield` · single-tile aoe shield 140.
- T2 Protect `protect1` · single Protect 1, CD3.
- T3 Prism Burst `racePrismBurst` · 125 ricochet; element blank.
- T4 Judgment `judgment` · cross r3 160 **physical**, finisher Slow ×1.5; text says "Cooldown: 2 rounds", row has no CD.
- T4 Merkaba `raceMerkaba` · 3×3 160, finisher Burn ×1.5, 2AP CD2.
**Problems.** Aurora Ray is a 100-damage 3×3 with a debuff and a finisher at T1 (house 80). Light Shield dominates Luminous Shield at the same tier and cost (220 + DEF stage vs 140). Judgment is physical on a family where five of the eight owners have ATK 8 (priest, nun, seraphim, angel, orb) and nordic has 22 — it is dead on six of eight races (only chosen one 56 and deep sea fish 84 can swing it). Smite is Radiant Bolt (Heavenly Duties T1, 100, rng 4) on the same four races; the angelic section should delete Radiant Bolt. Prism Burst has no element.
**Changes.**
- RECOST `raceAuroraRay`: 100 → 80.
- RETIER `raceLuminousShield` T2 → T3, 50MP → 75MP, area r0 → r1 (3×3 of allies, shield 140 each). Now the group shield; Light Shield stays the single big one. Orb rungs `[raceAuroraRay, raceLuminousShield, racePrismBurst, raceSupernova]` → `[raceAuroraRay, racePleiadianShield, raceLuminousShield, raceSupernova]`.
- REWRITE `judgment`: damage type physical → **magic** (light/magic); add CD2 to the row so the text is true; rng 1 cross r3 stays.
- RECOST `racePrismBurst`: element blank → light.
- RECOST `raceSmite`: rng 3 → 4 (parity with Radiant Bolt, which should go).
- PASSIVE: new family passive **Consecrated** (T1, 1 SP, hook `healOnceBelowPct` 0.35): once per life, the first time this unit drops below 35% HP it heals 20% and sheds 1 debuff.
**Additions.** None — ladder is T1 Aurora Ray, Smite · T2 Light Shield, Protect · T3 Luminous Shield, Prism Burst · T4 Judgment, Merkaba.
**Upgrades.** Exploit on Aurora Ray (Stun ×2.0 — the partner for Taser (Police Training), Stun Ray, Stasis Beam and the rewritten Lullaby below; no Sonic row sets Stun today). Forked on Smite. Widen on Luminous Shield is the raid shield — do not add a bigger one. Efficient on Protect.

### 🌑 Shadow `shadow` — VERDICT: KEEP (drop the filler buff, fix the mobility tiers)
**Identity.** The assassin element: fear, vanish, blink, and a place nobody can follow you into. Damage is single-target and personal.
**Races.** Fit: shadow entity, ghost, halfdemon (rung Shadow Step), demon (rung alt Shadow Realm), cosmic wraith (dark-energy spectre), ghoul (rung Fear; Terror Pounce pays it off), clown (rung Fear; "never where the light was pointing"). No misfit, no missing race.
**Now.**
- T1 Shadow Crush `raceShadowBind` · 100 single, Slow 2, finisher Slow ×1.5; element blank.
- T2 Fear `raceFear` · self r3, Feared 1.
- T2 Grim Resolve `raceGrimResolve` · self ATK +1, **25MP** (off-ladder).
- T2 Shadow Infiltration `raceShadowInfiltration` · dash **120** physical, Poison 3, **2AP** (tier-rule offender).
- T3 Phase Shift `racePhaseShift` · self Invisible 1, CD2, 75MP; element blank.
- T3 Shadow Step `raceShadowStep` · teleport 4, ignores LOS, CD2.
- T4 Shadow Realm `raceShadowRealm` · you and one enemy vanish for 2 rounds, 2AP CD3.
- T4 Void Rush `voidRush` · teleport 4 then 3×3 160; element arcane.
**Problems.** Grim Resolve is the seventh identical "+1 ATK self" row in the game (Inner Demon, Death Pact, Hellfire Crown, Howl, Monkey Business, Blood Ritual) and no race uses it as a rung. Shadow Infiltration is a 120-damage T2 that costs the whole turn and applies Poison for no shadow reason. Phase Shift (Invisible 1, no teleport) is a T3 that loses to Agent Vanish (Spy Gear T2: Invisible 2 + teleport 3) on the shadow entity's own pool — and it is his T3 rung. T3 is thin.
**Changes.**
- DELETE `raceGrimResolve` (Inner Demon / Hellfire Crown cover demons; nobody else needs it).
- REWRITE `raceShadowInfiltration`: T2, 50MP, **1AP**, dash to the target, 110 physical, then the caster is Invisible 1 (hit and fade). Drop Poison.
- RETIER `racePhaseShift` T3 → T2, 75MP → 50MP, Invisible 1 → 2, keep CD2 (parity with Blurry Photo). Shadow entity rung 3 `racePhaseShift` → `raceShadowStep`.
- RECOST `raceShadowBind` and `voidRush`: element → shadow.
- PASSIVE: new family passive **Umbral** (T1, 1 SP, hook `crit`): the first basic attack this unit makes while Invisible each round is a guaranteed crit. (Skeptic: the "+1 Invisible round" clause is dropped — no listed passive hook carries a status-duration rider, and Lingering on Phase Shift already does that job for 1 SP.)
**Additions.**
- NEW **Consuming Dark** `raceConsumingDark` — T3, damage/aoe, shadow/magic, 75MP 1AP, rng 4, 3×3, 125 dmg, finisher Feared ×1.5. "The dark eats first what is already running. MEDIUM magic damage to a 3×3; Feared targets take it worse." Reason: the in-family payoff for Fear (T2) — currently only Terror Pounce (Grave Hunger) pays Feared.
**Upgrades.** Exploit on Shadow Crush (it sets and pays its own Slow). Long Reach on Shadow Step. Widen on Void Rush. Do not let Shadow Realm take anything but Efficient (it is already a match-defining lock).

### 🔊 Sonic `sonic` — VERDICT: KEEP (shed the tank leftovers, tune the top)
**Identity.** Voice as a weapon: debuff (Discord, Silence, sleep), reposition (pull, push), and one anthem — the support element that also hits.
**Races.** Fit: siren, mermaid ("sonar-range vocalization"), popstar. Missing: **ringmaster** — "a voice that fills a stadium without a microphone"; pool 14. RACE_ADD ringmaster (his Encore rung is a sonic-element row already, though it lives in Teamwork, not here).
**Now.**
- T1 Discordance `discordance` · Discord 2 single.
- T1 Siren Song `raceSirenSong` · pull 3, grounds flyers; element blank.
- T1 Sonic Boomerang `raceSonicBoomerang` · line 80, text says it hits again on the return; the row has no field for a second hit.
- T2 Provoke `provoke` · Taunt 2 single.
- T2 Sonic Breaker `raceSonicBreaker` · line **120**, push 2, finisher Silence ×1.5.
- T2 War Cry `warCry` · aura r3 allies +2 ATK stages, self +1; text says "The Warrior himself".
- T3 Deafening Wail `raceDeafeningWail` · self r2 125, Silence 1.
- T3 Lullaby `lullaby` · 130 single, Slow 2.
- T3 Resonance Pulse `raceResonancePulse` · self cross r2 **135**, Slow 1, push 1.
- T4 Requiem `requiem` · self **r4** 160, Discord 2, finisher Discord ×1.5, 1AP CD2.
**Problems.** Provoke is a tank taunt on three glass supports (no rung uses it). War Cry gives +2 ATK stages to every ally in a 7×7 for 50MP at T2 (Swarm Signal does it at T4/100MP) and its text is job-era. Sonic Breaker is 120 on a line at T2 (Water Pulse 100). Resonance Pulse is 135 area at T3. Requiem's self-aoe r4 is a 9×9 for 1AP. Sonic Boomerang either double-hits (160 on a line at T1) or its text lies. Lullaby Slows instead of putting anyone to sleep.
**Changes.**
- MOVE `provoke` → `stagepresence`, RENAME "Provoke" → "Call Out" (luchador/clown/ringmaster own it there — g9 moves bunny girl off Stage Presence; on a bruiser a taunt is a tool). Note popstar also owns Stage Presence, so she keeps access — the move takes it off siren and mermaid, which is the point.
- RETIER `warCry` T2 → T3, 50MP → 75MP; RENAME "War Cry" → "Anthem"; REWRITE description: "Every ally within 3 tiles sings along: +2 ATK stages. The singer takes +1." (Same numbers; the tier now matches them.)
- RECOST `raceSonicBreaker`: 120 → 100.
- REWRITE `lullaby`: T3 → T2, 75MP → 50MP, 110 dmg, status Slow 2 → **Stun 1** (sleep), rng 4. "Hush. MEDIUM magic damage and the target sleeps through its next activation." Crescendo's "+1 range" line still applies.
- RECOST `raceResonancePulse`: 135 → 125.
- RECOST `requiem`: self-aoe r4 → r3, 1AP → 2AP.
- REWRITE `raceSonicBoomerang` description only: the row carries no return/multiHit field (checked: damage/line, 80, rng 4, line w1 and nothing else), so the return hit is not real. New text: "Hurl a scything crescent of sound down a line. WEAK magic damage to every enemy in its path." Numbers unchanged (T1, 25MP, 80).
- RECOST `raceSirenSong`: element → sonic.
- PASSIVE: new family passive **Resonant Voice** (T1, 1 SP, hook `statBonus`): +1 range on every Sonic spell.
**Additions.** None — ladder is T1 Discordance, Siren Song, Sonic Boomerang · T2 Sonic Breaker, Lullaby · T3 Anthem, Deafening Wail, Resonance Pulse · T4 Requiem.
**Upgrades.** Exploit on Requiem (Discord ×2.0 after Discordance). Lingering on Lullaby (Stun 2 — expensive and worth 1 SP). Knockback on Sonic Breaker. Widen on Deafening Wail. Family-scoped upgrade: **Reprise** (2 SP, families: [sonic]) — Anthem also grants Encore's bonus AP to one ally in range.

### 🌀 Arcane Magic `arcane` — VERDICT: GROW (one T4)
**Identity.** Raw spellcraft that manipulates the enemy's magic — steal it, silence it, strip it. The anti-caster element.
**Races.** Fit: wizard (rungs Arcane Sigil, Spellsteal, Polymorph), djinn (rungs Spellsteal, Wish Granted), atlantean (lost advanced civilisation; keeps this one). No misfit; no missing race — professor's "read about once" is Occult, machine elves' geometry is Prism Lattice.
**Now.**
- T1 Arcane Sigil `raceArcaneBlast` · X **r3** (13 tiles) 100, rng 4.
- T2 Spellsteal `raceSpellsteal` · steal one enemy spell, CD3.
- T3 Polymorph `racePolymorph` · ATK −1, M ATK −1, **2AP**, CD3.
- T3 Wish Granted `raceWishGranted` · ally ATK +1, cleanse 2; element blank.
**Problems.** Arcane Sigil is a 13-tile 100-damage area at T1 (overtuned list). Polymorph pays 2AP and a 3-round cooldown for two −1 stages while Calcify (Living Stone T3) does −2 M ATK for 1AP and no CD — a polymorph that leaves the frog casting is not a polymorph. Wish Granted is a generic +1 stage buff at T3. No T4.
**Changes.**
- RECOST `raceArcaneBlast` Arcane Sigil: 100 → 80, cross r3 → r2.
- REWRITE `racePolymorph`: T3, 75MP, **1AP**, CD3, **Silence 2** + ATK −1 stage. "Something small and harmless. Ribbit." The frog cannot cast — and Silence feeds Call of the Deep, Sonic Breaker, Mind Shatter, Dark Lullaby.
- RETIER `raceWishGranted` T3 → T2, 75MP → 50MP; REWRITE: ally +1 ATK **and** +1 M ATK stage, cleanse 2; element arcane. Djinn rung 3 `raceWishGranted` → `racePolymorph` (T3; djinn owns Arcane); Wish Granted becomes his rung 2 alt `[raceSpellsteal, raceWishGranted]`.
- PASSIVE: new family passive **Mana Font** (T1, 1 SP, hook `regenPerRound` MP): +10 MP at end of every round.
**Additions.**
- NEW **Annihilation** `raceAnnihilation` — T4, damage/damage, arcane/magic, 100MP 1AP **CD2**, rng 4, single, 180 dmg, purgeBuffs (strips every buff and shield first, as Terror Pounce does). "Unmake it. Every ward, every blessing, every stage they stacked — gone — and then HEAVY magic damage to what is left." Reason: the flagship and the anti-buff answer to Anthem / Light Shield / Stoneform teams. (Skeptic: CD2 added — a 180 + full purge at 1AP with no cooldown would out-class Absolute Zero (180, 2AP, CD2) and undo the Avalanche Strike CD fix below.)
**Upgrades.** Efficient on Spellsteal. Widen on Arcane Sigil is the 5×5. Empowered on Annihilation. Family-scoped upgrade: **Counterspell** (2 SP, families: [arcane]) — Spellsteal's cooldown becomes 2.

### 🩸 Blood Magic `blood` — VERDICT: GROW
**Identity.** Pay in HP, take it back with interest: bleed, drain, frenzy. The sustain-through-violence element.
**Races.** Fit: demon, demon prince, demon princess (contracts and cursed blood), goatman (rung Blood Ritual; Baphomet's Rite), vampire (Hemophage). Missing: none required — werewolf's Blood Frenzy and sharkman's Blood in the Water are already their own; leave them.
**Now.**
- T1 Summon Blood Rain `sharedSummonBloodRain` · weather, 25MP **2AP**; text does not say what the rain does.
- T3 Blood Ritual `raceBloodRitual` · self ATK +1, costs 10% HP; element blank.
- T3 Life Sap `lifeDrain` · 135 single, drain 70%, finisher Poison ×1.5; element shadow.
**Problems.** Blood Ritual is Inner Demon (Demonic T1: ATK +1, 20% HP, CD2) at T3 prices — and it is goatman's T3 rung. Blood Rain is priced like Blizzard (T1/2AP) while Thunderstorm/Sandstorm are T2/1AP, and nobody can tell what it does. Life Sap's Poison finisher needs a teammate on vampire (no Poison in his pool) — the family should feed its own finisher. No T2, no T4.
**Changes.**
- RETIER `raceBloodRitual` T3 → T1, 75MP → 25MP (keep +1 ATK, 10% HP), add **CD2**; element blood. (Skeptic: without the cooldown a 10%-HP T1 strictly dominates Inner Demon — T1, +1 ATK, 20% HP, CD2 — on demon and demon prince, who own both.) Goatman rung 3 `raceBloodRitual` → `lifeDrain`.
- RETIER `sharedSummonBloodRain` T1 → T2, 25MP → 50MP, 2AP → 1AP; REWRITE description with the rule (proposal, since the row is opaque): "Blood rain for 3 rounds: every unit heals 10% of the damage it deals; healing spells heal half."
- REWRITE `lifeDrain` Life Sap: element shadow → blood; finisher Poison ×1.5 → **Poison or Grievous ×1.5** (multi-status finisher like Bad Trip) so the family's own Hemorrhage sets it up.
- PASSIVE: new family passive **Sanguine** (T1, 1 SP, hook `regenPerRound`): heal 6% max HP at end of any round in which this unit dealt damage.
**Additions.**
- NEW **Hemorrhage** `raceHemorrhage` — T2, damageEffect/damage, blood/magic, 50MP 1AP, rng 3, single, 100 dmg, Grievous 2. "Open the vein. MEDIUM magic damage and a wound that will not close — healing on them is halved." Reason: the T2 rung and the setup for Life Sap / Exsanguinate; Grievous had no caster source.
- NEW **Exsanguinate** `raceExsanguinate` — T4, damage/lifeDrain, blood/magic, 100MP 2AP CD2, rng 3, single, 180 dmg, drain 100%, finisher Grievous ×1.5. "Take all of it. HEAVY magic damage to a Single Enemy and every point of it comes back to you." Reason: the flagship; the vampire's build finally ends in a vampire spell.
**Upgrades.** Exploit on Life Sap. Lingering on Hemorrhage (Grievous 3). Efficient on Exsanguinate. Do not add Forked to the drains (the heal would double).

### ⛄️ Winter Warfare `winter` — VERDICT: GROW (the physical cold kit)
**Identity.** Cold as a bruiser fights it: frostbitten fists, snow forts, avalanches — the melee/physical partner to Ice Magic's caster kit, and the home of the Frozen shatter payoffs.
**Races.** Fit: yeti (alpine apex, rungs Frozen Punch / Avalanche Strike), krampus (Alpine Hide, cold-proof), santa clause (North Pole tank, rung Snowball Volley). Misfit: **ice queen** — every physical row here is dead on ATK 8 (Frozen Punch, Avalanche Strike, the new Glacial Slam) and none of her rungs are in this family; Ice Magic already is her. SKEPTIC: on today's races.md she owns only Ice + Winter + Healing Magic, so removing her here leaves 2 families — under the floor. RACE_REMOVE ice queen is therefore CONTINGENT on g2's RACE_SWAP healingmagic → cosmic AND g9's Mirror Magic RACE_ADD both landing (Ice + Cosmic + Mirror Magic = 3); if either is dropped she stays on Winter (Snowball Volley is magic and Snow Fort deals no damage — both are caster-usable). No missing race.
**Now.**
- T1 Frozen Punch `raceFrozenPunch` · melee 90 physical, finisher Frozen ×1.5.
- T1 Snowball Volley `raceSnowballVolley` · 3×3 80 magic, rng 4, Slow 1.
- T4 Avalanche Strike `raceAvalancheStrike` · charge 180 physical, Frozen 1 **and** finisher Frozen ×1.5, 1AP, **no CD**.
**Problems.** Avalanche Strike both applies Frozen and pays it off, with no cooldown: every second cast is 270 for 1AP at 100MP — it out-classes Absolute Zero (Ice T4: 180, Frozen 2, 2AP, CD2) on the same yeti/santa pools. Frozen Punch is 90 (T1 single house 100). No T2, no T3.
**Changes.**
- RECOST `raceFrozenPunch`: 90 → 100.
- RECOST `raceAvalancheStrike`: add CD2 (keep 180, Frozen 1, finisher). The loop still exists; it just cannot be every turn.
- PASSIVE: new family passive **Thick Fur** (T1, 1 SP, hook `weatherBonus`): immune to Frozen; +1 MOV during a blizzard.
**Additions.**
- NEW **Snow Fort** `raceSnowFort` — T2, deploy/terrainCreate, ice, 50MP 1AP, rng 3, tiles3, terrainType snow_wall (height +1, blocks LOS, melts after 3 rounds), no damage. "Pack it, stack it, duck. Three tiles of snow wall — cover for three rounds, then a puddle." Reason: the T2 rung and Winter's tactical piece (a cheap Rampart that expires).
- NEW **Glacial Slam** `raceGlacialSlam` — T3, damageEffect/aoe, ice/physical, 75MP 1AP, rng 0, self 3×3, 125 dmg, Slow 2, finisher Frozen ×1.5. "Bring both fists down. MEDIUM physical damage to everything around you, all of it Slowed — and anything Frozen shatters." Reason: the T3 rung and the area shatter for a yeti/krampus standing in the middle of a Permafrost or Flash Freeze.
**Upgrades.** Exploit on Frozen Punch and Avalanche Strike (they are the shatters). Surplus on Snow Fort (a fourth wall tile). Widen on Snowball Volley. Do not put Blast on Avalanche Strike.

### 🎅🏻 Christmas Spirit `christmasspirit` — VERDICT: KEEP (add the loop and the cookies)
**Identity.** Naughty and nice: mark them, then decide — coal for the list, a present that freezes, and a squall that turns the field to ice. The Santa/Krampus pair kit.
**Races.** Fit: santa clause, krampus ("the one who comes for the names Santa Clause crossed off"). No misfit, no missing race — and, per mondo, the yeti stays off it.
**Now.**
- T1 Lump of Coal `raceLumpOfCoal` · 100 fire single, Burn 2.
- T2 Sleigh Dash `raceSleighDash` · dash 130 (text says "WEAK"), 70 along the path, finisher Frozen ×1.5; element blank.
- T3 Naughty List `raceNaughtyList` · ATK −1 single; element blank.
- T3 White Christmas `raceWhiteChristmas` · 3×3 squall, Slow each round for 2 rounds, then ice.
- T4 Blizzard Present `raceBlizzardPresent` · 3×3 160, **Frozen 2**, ice, 1AP CD2.
**Problems.** Naughty List is a −1 ATK stage at T3 (Steal from the Rich does it at T2) and it is the rung for both races. Blizzard Present gives Frozen 2 on a 3×3 for 1AP — stronger than Permafrost (T3, Frozen 2, 2AP, CD2) at the same shape. Sleigh Dash's text contradicts its 130. Santa has no sustain at all (summary: santa missing sustain/movement/buff). Marked has seven setups in the game and zero payoffs.
**Changes.**
- RETIER `raceNaughtyList` T3 → T2, 75MP → 50MP; REWRITE: **Marked 3** + ATK −1 stage; element shadow. "You know what you did. The target is on the list." Rungs (rung n sits at tier n): santa rung 3 `[raceNaughtyList, raceWhiteChristmas]` → `[raceWhiteChristmas, raceMilkAndCookies]` and santa rung 2 `raceSleighDash` → `[raceSleighDash, raceNaughtyList]`; krampus rung 3 `raceNaughtyList` → `raceWhiteChristmas` and krampus rung 2 `raceCliffCharge` → `[raceCliffCharge, raceNaughtyList]` — the list stays a rung for both.
- REWRITE `raceBlizzardPresent`: Frozen 2 → Frozen 1, add finisher **Marked ×1.5**. The present hits the naughty harder — the first Marked payoff in the game.
- RECOST `raceSleighDash`: element → ice; fix the description to MEDIUM.
- PASSIVE: new family passive **Spirit of Giving** (T1, 1 SP, hook `regenPerRound` aura): allies adjacent to this unit regenerate 3% max HP at end of round.
**Additions.**
- NEW **Milk and Cookies** `raceMilkAndCookies` — T3, heal/healAll, christmas, 75MP 1AP, rng 0, aura r2: allies within 2 heal 100 and shed 1 debuff. "Left out for whoever's still standing. Every ally within 2 tiles heals and shakes one thing off." Reason: santa's missing sustain; Krampus eats them too and that is fine.
**Upgrades.** Exploit on Blizzard Present (Marked ×2.0). Lingering on White Christmas (3 rounds). Efficient on Milk and Cookies. Blast on Lump of Coal is the "coal in the whole stocking" 3×3.

### 🌾 Agriculture `agriculture` — VERDICT: KEEP (the seed/tree kit; trim the farmhands)
**Identity.** Plant now, profit later: seeds that heal, poison and leech over rounds, and a T4 that turns the field into a forest — the Green Thumb build-around (trees buff ATK/spell power and fuel Trunk Throw).
**Races.** Fit: hippie ("grow their own medicine", rung Healing Seed), scarecrow (guards agricultural zones), tree person (Deep Roots), jack o lantern (the crop fields, harvest), bee queen ("poison, command and multiply" — a hive; the pollination link is inferred, not in the file), shaman (ethnobotanical). Misfits by the yeti test: **bigfoot** (forages, does not farm — Nature covers him), **antperson** (a swarm bruiser; no rung here), **king kong** (nothing in his lore touches a field). RACE_REMOVE bigfoot, antperson, king kong. Missing: **mushroom girl** — "a ring of mushrooms comes up wherever they stand still" is fungiculture; RACE_ADD mushroom girl.
**Now.**
- T1 Healing Seed `healingSeed` · seed heals nearby allies each turn — no number on the row.
- T2 Poison Seed `poisonSeed` · seed poisons nearby enemies each turn — no number.
- T4 Leech Seed `leechSeed` · seed on an enemy drains HP each turn to the caster — no number, 100MP.
**Problems.** None of the three rows states its per-turn amount, radius or duration; the rack cannot be judged and the player cannot compare. Leech Seed is a T4 for a single-target DoT of unstated size. No T3. The tree mechanic that Green Thumb and Permafrost both reference ("living trees", "seeds… destroyed") is invisible in these descriptions.
**Changes.**
- REWRITE all three descriptions with numbers and the sprout rule (proposal; surface the engine's real values if they differ): Healing Seed — heals allies within 1 tile for 40/turn for 3 rounds, then sprouts a tree; Poison Seed — enemies within 1 tile take Poison 1 each round for 3 rounds, then sprouts; Leech Seed — 50/turn from the target to the caster for 3 rounds.
- RETIER `leechSeed` T4 → T3, 100MP → 75MP.
- PASSIVE: new family passive **Fertile Ground** (T1, 1 SP, new hook key `seedBonus`): seeds this unit plants sprout one round sooner and its trees have +50% HP.
**Additions.**
- NEW **Bumper Crop** `raceBumperCrop` — T4, damageEffect/aoe, nature/magic, 100MP 2AP CD2, rng 4, 5×5, 120 dmg to enemies inside, Root 1, and a seed on every empty rim tile (sprouts next round into trees that block LOS and count for Green Thumb). "Sow the whole field at once. Everything standing in it is rooted where it stands, and by next round there is a wood around them." Reason: the flagship that makes a tree team real — six trees for Green Thumb and Trunk Throw in one cast; Permafrost and fire are the counters.
**Upgrades.** Surplus on Healing Seed and Poison Seed (a second seed) is the family's core pick — do not add "Double Seed" spells. Lingering on Leech Seed (4 rounds). Widen does not apply (Bumper Crop is already 5×5).

### 🧑‍🌾🐦‍⬛ Scarecrow Abilities `scarecrow` — VERDICT: RENAME → "Scarecrow Abilities" (fix "Abilties") and flag UNIQUE: scarecrow
**Identity.** The field's guardian: hook them in, scare them off, put a straw double where the crows will go. One race's signature kit, like the D.O.O.R. Gun.
**Races.** scarecrow only — correct; mark the family UNIQUE so nothing else can pick it up.
**Now.**
- T1 Harvest Hook `raceHarvestHook` · 80 physical, pull 4.
- T2 Stuffed Double `raceStuffedDouble` · deploys an object (hp 1, max 1); description is the template "Deploys an object on an empty tile".
- T4 Crow Storm `raceCrowStorm` · 3×3 160, Discord 2, finisher Hexed ×1.5; element blank.
**Problems.** Stuffed Double has no stated behaviour — a 1-HP object that does nothing is a wasted rung (it is his T2 rung). No T3. Crow Storm's Hexed finisher is self-contained via Hex of Agony in Witchcraft — good, keep. Harvest Hook's pull 4 at T1 is the strongest pull below T2 (Tentacle Lash pulls 2, Earthen Grasp 2) — acceptable for a one-race family.
**Changes.**
- REWRITE `raceStuffedDouble`: a straw decoy on an adjacent tile for 2 rounds (hp 1): enemies within 2 tiles of it are Taunted 2 (must target the decoy if able, for the 2 rounds it stands); when it is destroyed, every enemy adjacent to it is Feared 1. "A second scarecrow, stuffed in a hurry. Anything nearby goes for the wrong one — and when the straw comes apart, they run."
- RECOST `raceCrowStorm`: element → shadow.
- FAMILY_RENAME `scarecrow`: "Scarecrow Abilties" → "Scarecrow Abilities"; set unique: scarecrow.
- PASSIVE: new family passive **Restuffing** (T1, 1 SP, hook `regenPerRound`): regenerates 5% max HP at end of round while not Burning (lore: "redistribute mass to repair damage").
**Additions.**
- NEW **Scare Off** `raceScareOff` — T3, effect/barrage, shadow, 75MP 1AP, rng 0, self r2, Feared 1 + Discord 2. "That is what it is for. Every enemy within 2 tiles is Feared for a round and shaken for two." Reason: the T3 rung and the thing a scarecrow does; Feared pays off into Consuming Dark / Terror Pounce, Discord into Crow Storm's neighbours.
**Upgrades.** Undertow on Harvest Hook (pull 5). Surplus on Stuffed Double (two decoys). Exploit on Crow Storm (Hexed ×2.0 after Hex of Agony). Widen on Crow Storm for the 5×5 murder.

SPELL COUNT: 90 → 105 active rows for this group (3 deleted: Scorched Earth, Ice Shard, Grim Resolve; 2 moved out: Ayahuasca Retreat → Drug Use, Provoke → Stage Presence; 20 new — Landslide struck by the skeptic), plus 17 new family passives (1 per family) = 122 rows.

SKEPTIC PASS (g1): race moves checked against races.md — loch ness monster off Ice (fails the yeti test); ice queen and annunaki removals made contingent (each would fall to 2 families once g2/g8/g9 land or do not); every "if rungs must climb" conditional resolved as rung n = tier n; Landslide struck as Fissure + upgrades; Annihilation and Blood Ritual given CD2; Meteor and Sonic Boomerang text conditionals resolved from the rows; all NEW rows given ids; Scare Off / Stuffed Double / Live Wire / Umbral / Updraft given full numbers.
