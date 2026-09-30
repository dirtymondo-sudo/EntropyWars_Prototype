### 🦏 Beast Abilities `beastabilities` — VERDICT: KEEP (trim to a 3-tier foundation kit)
**Identity.** The shared animal-melee foundation every beast race builds on: a bite that heals, a pounce that closes, a maul that stops the healing, a dive from height. Deliberately capped at T3 — every race on it already carries its signature T4 in its own family (Blood Frenzy, Predator Drop, Jurassic Jaw, Ape Fury, Bull Rush), so Beast is the floor, not the ceiling.
**Races.** Fit: werewolf, vampire (bat/wolf forms, Bite), dinosaur, king kong, minotaur, sharkman. Skinwalker fits by lore (takes animal forms) but its ATK 28 / INT 88 line makes every physical Beast row dead weight; keep it for the theme, but note that once Borrowed Claw moves out it has no Beast row it can actually use well. ADD catgirl (feline predator, Pounce/Bite are her whole lore — see Feline Anatomy). Yeti is a primate by lore ("upper body strength exceeds any known primate by factor of 3"; bigfoot's file only says "large bipedal cryptid") but both get their own kits below; do not stack them here.
**Now.** T1 Bite `raceBite` · 100 phys lifeDrain 30%, rng 1 · T1 Borrowed Claw `raceBorrowedClaw` · 100 phys rng 1, CD3, `stealSpell` (engine `_stealSpellFrom` strips a random spell off the victim for good and hands it to the caster — the description never says so) · T1 Pounce `racePounce` · 120 phys charge rng 3 (over-tuned T1: synergy.md "T1 rows with dmg>=120") · T1 Predator Leap `racePredatorLeap` · 80 +20/level leapStrike rng 3 · T1 Tail Whip `raceDinoTailWhip` · 100 phys rng 1, push 2 · T3 Ambush Lunge `raceAmbushLunge` · 125 phys charge rng 3, no rider (synergy.md under-tuned T3) · T3 Feral Dive `raceFeralDive` · 125 +20/level leapStrike rng 3.
**Problems.** Five T1s and nothing at T2/T4. Two T1 gap-closers (Pounce 120 charge vs Predator Leap 80 leap) and two T3 gap-closers (Ambush Lunge 125 charge vs Feral Dive 125 leap) — the same role four times. Borrowed Claw is a skinwalker shapeshift trick hiding in a beast family, with a description that omits its only interesting mechanic. Tail Whip is named for one race (dinosaur) in a family shared by werewolves and vampires who have no tail.
**Changes.**
- MOVE `raceBorrowedClaw` → `trickery` (skinwalker's rung 1; Trickery has no T1 and this IS trickery). REWRITE its description: "Deals MEDIUM physical damage to a Single Enemy and tears one spell out of them — the skinwalker keeps it, they lose it for the match. Cooldown: 3 rounds."
- MOVE `raceDinoTailWhip` → `apexpredator` (dinosaur and sharkman both have tails; it becomes Apex's T1 attack and keeps dinosaur's rung-1 alternate valid).
- DELETE `racePredatorLeap` (Pounce covers the T1 close; Feral Dive covers the leap-from-height).
- DELETE `raceAmbushLunge` (a bare 125 charge at 75 MP; Feral Dive is the T3). Sharkman rung 3 `raceAmbushLunge` → `raceFeralDive`.
- RECOST `racePounce` dmg 120 → 100 (T1 single house scale; it keeps rng 3 + charge as its value).
**Additions.**
- NEW **Maul** — T2, damageEffect, -/physical, 50 MP 1 AP, rng 1, single, 110 dmg, Grievous 2 (healing on them halved). "Jaws lock and shake. MEDIUM physical damage and a wound that will not close." Fills the empty T2 and gives every beast race the anti-heal tool that only Curb Stomp/Frenzy carry today; pairs with Bite (drain the target you just stopped from healing). [SKEPTIC: was 130 — damage+effect ≥120 must be T3+ (THE TIER RULE); 110 keeps it a T2 and above Bite's 100.]
- PASSIVE: new family passive **Keen Nose** — T1 (1 SP), hooks `revealInvisibleWithin: 2` (new hook key — engine patch), `statBonus: { awr: 14 }`. "Smells prey it cannot see: at the end of each round, invisible enemies within 2 tiles are revealed." Eleven spells in the game set Invisible and beast bruisers have no answer; this is theirs.
**Upgrades.** Pounce takes Long Reach and Knockback; Bite takes Empowered and Forked (a drain that forks is a real sustain build); Maul takes Lingering (Grievous 3) and Exploit does not apply (no finisher — keep it that way). Do not give Feral Dive Blast: Seismic Leap is the aoe leap and lives elsewhere.

### 🦖 Apex Predator `apexpredator` — VERDICT: KEEP
**Identity.** Top of the food chain: the roar that turns a fight, the stampede that flattens a line, the jaw that ends it. Stagger setup → Jurassic Jaw payoff, self-contained.
**Races.** Dinosaur and sharkman both fit (reptilian/elasmobranch apex hunters with tails). No additions — loch ness monster is the obvious third but she is a 54-ATK tank already on four families (Deep Sea Anatomy, Water, Cryptid, Ice) and Apex is a bruiser kit.
**Now.** T1 Primal Roar `racePrimalRoar` · Discord 2, self-aoe r1, 25 MP · T2 Stampede `raceApexCharge` · 130 phys dash rng 3 + Stagger 1, 2 AP, ends behind the target, no path damage (tier-rule offender: damageEffect 130 below T3) · T3 Apex Roar `raceApexRoar` · +1 ATK aura r2 allies, 75 MP · T4 Jurassic Jaw `raceJurassicJaw` · 180 phys rng 1, ignores DEF, finisher stagger ×1.5, kill heals 25% and refunds 1 AP.
**Problems.** Two roars in a four-spell family. Apex Roar is Royal Decree (`royalty` T1, aoe r2 +1 ATK, 25 MP 1 AP) at three times the price, and Rally Command (`militarysupport` T1, same aoe r2 +1 ATK, 25 MP but 2 AP) is the other T1 version. Stampede says "stampedes through the battlefield" but is a plain single-target dash with no `dashDamage`, and 130 + Stagger at T2 for 2 AP is both over the tier line and under-delivering for the AP.
**Changes.**
- MERGE `racePrimalRoar` into `raceApexRoar`: one roar, RETIER `raceApexRoar` T3 → T2 (50 MP): enemies within 2 get Discord 2 AND allies within 2 get +1 ATK stage. "The whole valley hears it. Everything near the apex flinches; everything behind it bares its teeth." Dinosaur rung 1 `["racePrimalRoar","raceDinoTailWhip"]` → `"raceDinoTailWhip"` (the Primal Roar id no longer exists; Tail Whip is now in this family), rung 3 alternate stays `raceApexRoar`.
- REWRITE + RETIER `raceApexCharge` Stampede: T2 → T3, 75 MP, 2 AP, rng 3: 130 phys to the target, `dashDamage: 50` to every enemy on the path, Stagger 1 on everything hit, caster ends behind the target. The path damage is what buys the second AP. [SKEPTIC: the section itself flagged 130+Stagger at T2 as a tier-rule offender, then kept it at T2 — damage+effect ≥120 is T3+, so it moves up. Dinosaur rung 2 and sharkman rung 2 stay `raceApexCharge` (still inside the family).]
- MOVE IN `raceDinoTailWhip` as the T1 attack (100 phys, push 2, rng 1) — see Beast.
**Additions.**
- NEW **Death Roll** — T2, damageEffect, -/physical, 50 MP 1 AP, rng 1, single, 100 dmg, Root 2. "Clamp and spin. MEDIUM physical damage, and the prey is not going anywhere." Fills the T2 beside the roar (Stampede is now the T3) and gives two bruisers with no control a pin for the runner they are chasing; Root also feeds the Necromancy/Marksmanship root finishers on teammates. [SKEPTIC: was T3 125 — with Stampede retiered to T3 the ladder is Tail Whip T1 / Apex Roar + Death Roll T2 / Stampede T3 / Jurassic Jaw T4; 100+Root 2 sits under the 120 tier line.]
**Upgrades.** Jurassic Jaw: Exploit (×2 on Stagger) is the build — Stampede/Tail Whip set it. Stampede should be excluded from Blast/Forked (it already spreads). Death Roll takes Lingering (Root 3). Apex Roar takes Widen (5×5 roar) — do not add a bigger roar as a spell.

### 🐐 Horns & Hooves `horns` — VERDICT: KEEP
**Identity.** Charge, gore, toss: the horned bruiser's stagger loop (Gore Charge sets, Horn Toss pays) with a discord loop on top (Labyrinth Roar sets, Bull Rush pays).
**Races.** Goatman, minotaur, krampus all horned and hooved — all fit. No additions (demons have horns, no hooves; dinosaur has neither).
**Now.** T1 Gore Charge `raceGoreCharge` · 100 phys charge rng 3 + Stagger 1 · T1 Horn Toss `raceHornToss` · 80 phys rng 1, push 3, finisher stagger ×1.5 · T2 Cliff Charge `raceCliffCharge` · 100 +20/level leapStrike rng 2 · T2 Labyrinth Roar `raceLabyrinthRoar` · Discord 2 self-aoe r2, 50 MP · T4 Bull Rush `raceBullRush` · 170 phys dash rng 4, finisher discord ×1.5, no path damage.
**Problems.** Cliff Charge is a second charge one tier up with LESS base damage than T1 Pounce (100 vs 120) and the same 100 as T1 Gore Charge minus the Stagger — filler. Labyrinth Roar is Dread Aura (`cryptid` T1, Discord 2 r2, 25 MP) at double the price and a tier up. Bull Rush's text says it dashes through the battlefield but has no `dashDamage` (Rampage T4 has 64). No T3.
**Changes.**
- DELETE `raceCliffCharge` (Gore Charge is the charge; nobody needs a worse one). Goatman rung 2 and krampus rung 2 `raceCliffCharge` → `raceLabyrinthRoar`.
- REWRITE `raceLabyrinthRoar`: T2, 50 MP, self-aoe r2: Discord 2 AND Taunt 1 (they must swing at the minotaur). "The walls throw the bellow back from every direction. Everything nearby loses its head and comes for the horns." Now a real T2 (Discord + tank pull) and no longer a copy of Dread Aura.
- REWRITE `raceBullRush`: add `dashDamage: 60` (keep 170, rng 4, finisher discord ×1.5). The text already promises it.
**Additions.**
- NEW **Horn Hook** — T3, damageEffect, -/physical, 75 MP 1 AP, rng 3, single, 110 dmg, pulls the target 2 tiles to the caster, Root 1. "Hooked on the horns and dragged home. MEDIUM physical damage; they end the turn where the hooves are." All three races lack movement/reach; this is the bruiser's fetch, and it lines the victim up for Horn Toss's push or Bull Rush.
**Upgrades.** Horn Toss takes Knockback (+1) and Exploit; Gore Charge takes Lingering (Stagger 2 = two payoffs). Horn Hook takes Undertow. Bull Rush should not take Blast (path damage already spreads).

### 🐺 Werewolf Powers `werewolf` — VERDICT: GROW
**Identity.** The moon-cycle hunter: a pack howl, a claw sweep that stops the bleeding from being fixed, a regeneration that matches the lore ("catastrophic wounds heal in minutes"), and the frenzy that runs down the weakest thing in sight. Bloodcraze (+25% damage against enemies at or under 30% HP, +1 SPD stage while one is visible) is the inherent this family pays into.
**Races.** Werewolf only — correct, keep it that way.
**Now.** T2 Howl `raceHowl` · self +1 ATK, 50 MP · T4 Blood Frenzy `raceBloodFrenzy` · 180 phys rng 6, 2 AP, auto-targets the lowest-HP visible enemy.
**Problems.** Howl is Forest Ambush (`huntingskills` T1, self +1 ATK, 25 MP) — and the werewolf HAS Hunting Skills, so it is a strictly worse copy of a row in its own pool. Pool gaps per summary.md: no movement, no AOE, no debuff. Two spells, no T1/T3.
**Changes.**
- RETIER `raceHowl` T2 → T1 (25 MP) and REWRITE as a pack cry: warCry, aura r2, +1 ATK stage to every ally within 2 (self included). "The pack answers." Parity with Rally Command / Royal Decree T1. [SKEPTIC: was r3 — both rows it claims parity with are r2 (and Rally Command costs 2 AP); an r3 version at 25 MP 1 AP would be the best +1 ATK aura in the game at T1. Widen is the bigger howl.]
- KEEP `raceBloodFrenzy` as is (2 AP, 180, rng 6, auto-target): with Bloodcraze it is the ×1.25 execute the race is built around.
**Additions.**
- NEW **Claw Sweep** — T2, damageEffect, -/physical, 50 MP 1 AP, self-aoe r1, 100 dmg, Grievous 2. "Both arms, every direction. MEDIUM physical damage to everything adjacent, and none of it heals right." Fills AOE + debuff in one row at the T2 area scale (Tremor Stomp is the over-tuned T1 comparison at 125; this sits under it).
- NEW **Lunar Regeneration** — T3, heal/selfHeal, -, 75 MP 1 AP, self: heal 25% max HP + Regen 2 rounds + cleanse 1. "The wounds close while you watch." The race's sustain; Carrion Feast (`ghoulish` T3) is 25% flat, this trades the cleanse and regen for the same price.
**Upgrades.** Blood Frenzy: Empowered and Exploit do not apply (no finisher) — leave it; Efficient is the pick. Claw Sweep takes Lingering and Widen. Howl takes Lingering (buffs +1 round).

### 😼 Feline Anatomy `feline` — VERDICT: GROW (and put catgirl on Beast for the pounce/bite half)
**Identity.** What only a cat's body does: a disarming meow, always landing on her feet, the nap that fixes everything, and nine claws at once. Beast Abilities supplies her Pounce/Bite/Maul; Feline keeps the flavour rows.
**Races.** Catgirl only — fits. RACE_ADD catgirl → `beastabilities` (her lore is "feline predatory adaptation", and a cat that cannot Pounce is wrong).
**Now.** T3 Meow `raceMeow` · DEF −1 self-aoe r2, 75 MP · T4 Ninefold Scratch `raceNinefoldScratch` · 5 hits × 32 = 160 metal/phys rng 1.
**Problems.** Meow at T3 is Chest Pound (`apeintelligence` T1, DEF −1 self-aoe r2, 25 MP) at triple price. "Ninefold" Scratch has five hits. Two spells, nothing below T3.
**Changes.**
- RETIER `raceMeow` T3 → T1 (25 MP). Same effect; parity with Chest Pound.
- REWRITE `raceNinefoldScratch`: 9 hits × 20 = 180 (T4 single house scale; nine because the name says nine; multi-hit already rewards Echo Band / per-hit riders).
**Additions.**
- NEW **Land on Your Feet** — T2, movement/leap, -, 50 MP 1 AP, rng 3: leap to any tile within 3 regardless of elevation, take no fall damage, +1 DEF stage for 1 round. "Cats do not fall. They arrive." Her vertical mobility (Nimble Dodge in Athleticism is the escape; this is the approach).
- NEW **Cat Nap** — T3, heal/selfHeal, -, 75 MP 1 AP, self: heal 30% max HP, cleanse all. "Twenty minutes. Good as new." An assassin's reset; slightly above Carrion Feast (25%) because it costs the cat her position.
**Upgrades.** Ninefold Scratch takes Empowered only — Forked/Blast on a 9-hit row would be the strongest thing in the game, exclude them via a family-scoped `excl`. Meow takes Widen.

### 👣 Sasquatch Abilities `sasquatch` — VERDICT: GROW
**Identity.** The big quiet thing in the treeline: a kick that moves you, a stomp that rattles you, a thrown trunk you never saw coming, and the smash that ends the photo. Timber Stomp sets Stagger so Sasquatch Smash is finally self-contained (synergy.md: bigfoot "needs teammate" for its own T4 today).
**Races.** Bigfoot only — fits. Note for the Agriculture auditor: bigfoot on Agriculture (seed planting) fails the yeti test; with this family grown to four he can drop it.
**Now.** T1 Big Kick `raceBigKick` · 120 earth/phys rng 1 (over-tuned T1 per synergy.md) · T4 Sasquatch Smash `raceSasquatchSmash` · 180 earth/phys, 2 AP, finisher stagger ×1.5.
**Problems.** T1 at 120 with no rider is above the house scale. No T2/T3, and the T4 finisher has no setup in the race's pool.
**Changes.**
- REWRITE `raceBigKick`: 100 dmg, push 2 (a kick should kick). Same tier and cost.
- RECOST `raceSasquatchSmash` 2 AP → 1 AP (keep 180, 100 MP, finisher stagger ×1.5). [SKEPTIC: the section KEEPs it at 2 AP "same shape as Colossal Crush" while recosting Colossal Crush to 1 AP below — that would leave Sasquatch Smash strictly worse than Crush and Jurassic Jaw (180 + stagger finisher, 1 AP). Same shape, same AP.]
**Additions.**
- NEW **Timber Stomp** — T2, damageEffect/aoe, earth/physical, 50 MP 1 AP, self-aoe r1, 100 dmg, Stagger 1. "One foot down. Everything adjacent staggers." The setup for Sasquatch Smash; sits at the T2 area scale.
- ~~NEW **Uproot** — T3 thrown tree, rng 3, 125, through cover, finisher discord~~ STRUCK [SKEPTIC: bigfoot already owns a thrown tree — `trunkThrow` (Nature Magic T3, 100 phys rng 4) is his own rung 3; a second ranged tree throw in the same race's pool is the role duplicate rule 4 exists to catch. Three rows (T1/T2/T4) is allowed. If a discord payoff is wanted, add `finisher: discord ×1.5` to `trunkThrow` and flag it to the Nature Magic auditor.]
**Upgrades.** Sasquatch Smash: Exploit. Timber Stomp: Widen, Lingering. Big Kick: Knockback (push 3).

### 📷 Cryptid Abilities `cryptid` — VERDICT: KEEP (fix the roster, replace one of two vanishes)
**Identity.** The things that are never on camera: dread before you see them, gone before you can aim, witnesses who run, and the one clear look you get right before it hits you.
**Races.** Fit: bigfoot (inherent Cryptid), skinwalker, mothman, loch ness monster, yeti ("alpine apex cryptid"), tree person (the extra tree on the survey). MISFIT: grey — an alien from UFO folklore, not a cryptid; it already has UFO Features + Psychic; RACE_REMOVE grey (see Eyesight for where it goes). RACE_ADD goatman — the Goatman is a real cryptid file and his lore ("mimicking human speech to lure subjects") is exactly this family.
**Now.** T1 Dread Aura `raceDreadAura` · Discord 2 self-aoe r2, 25 MP · T2 Blurry Photo `raceRealityShift` · Invisible 2 + cleanse all, CD2, 50 MP · T3 Cryptid Vanish `raceCryptidVanish` · teleport 2 + Invisible 2, CD2, 75 MP.
**Problems.** Blurry Photo and Cryptid Vanish are the same row (go invisible for 2) with a 2-tile hop as the only difference between T2 and T3. Nothing at T4. Dread Aura is the best discord aura in the game for the price (Primal Roar is also 25 MP but only r1; Labyrinth Roar/Dragonfear cost double) — fine here, it is the family's T1.
**Changes.**
- DELETE `raceRealityShift` Blurry Photo (Cryptid Vanish covers it). Bigfoot rung 2 `["raceRealityShift","raceTreelineRetreat"]` → `["raceCryptidVanish","raceTreelineRetreat"]` (a rung must not point at a deleted id; Cryptid Vanish is a T2 after the retier below).
- RETIER `raceCryptidVanish` T3 → T2 (50 MP): teleport 2 + Invisible 2, CD2. Parity with Mist Form / Corpse Crawl / Nimble Dodge (all T2 escapes). Mothman rung 3 and loch ness rung 3 stay valid.
**Additions.**
- NEW **Eyewitness** — T3, effect/debuff, -, 75 MP 1 AP, rng 4, aoe r1: Feared 1 (must flee) AND Blind 2 to all enemies in the 3×3. "They will describe it badly for the rest of their lives." Fear (`shadow` T2, 50 MP) is already an aoe fear — self-aoe r3, Feared 1 — so a bare 3×3 fear at T3 would be a worse copy; what buys the tier here is that it is thrown from 4 tiles (the cryptid does not have to stand in the crowd) and a two-round Blind rides along. It is the cryptid's control and sets up the T4. [SKEPTIC: was Blind 1 — that made it the exact shape of the Dragonfear rewrite (T2, 50 MP, rng 4, aoe r1, Feared 1 + one 1-round rider) at a tier more; Blind 2 is what separates the T3 from the T2.]
- NEW **Out of the Dark** — T4, damage, -/physical, 100 MP 1 AP, rng 3 charge, single, 180 dmg, finisher feared ×1.5. "One clear look. That was the last photo on the roll." Physical because the bruiser/tank half (bigfoot, yeti, nessie, tree person, goatman) is the half that closes; skinwalker/mothman have their caster T4s elsewhere.
**Upgrades.** Dread Aura: Widen and Lingering — do not add a bigger dread spell. Out of the Dark: Exploit (×2 on Feared). Cryptid Vanish: Efficient.

### 🦟 Mothman `mothman` — VERDICT: GROW
**Identity.** The harbinger: it marks what is about to go wrong, warns the one ally who will survive it, exposes the whole enemy line, and then the disaster it foretold lands. Support kit for a 215-MP, ATK 8 support race with a 10-spell pool.
**Races.** Mothman only — correct.
**Now.** T1 Red Eyes `raceRedEyes` · Marked 3 rng 4 (Marked has no finisher payoff anywhere, but it exposes a Cryptid and breaks invisibility) · T4 Prophecy of Disaster `raceProphecyOfDisaster` · 140 magic delayed aoe r2 (5×5), 2 AP, rng 5, finisher discord ×1.5, grounds flyers.
**Problems.** Two spells, no T2/T3. Prophecy is 140 for 2 AP with a one-round delay — under the T4 area scale (160) while paying the AP and the delay; Quake (`earth` T4, the same 5×5 r2 footprint, 160, 2 AP) lands instantly, and Cataclysm Decree (`infernalcourt` T4, the other delayed meteor, 3×3 r1) is 160 too.
**Changes.**
- RECOST `raceProphecyOfDisaster` dmg 140 → 160.
- KEEP `raceRedEyes` (Marked 3 at 25 MP is the reveal tool this support is for).
**Additions.**
- NEW **Premonition** — T2, effect/buff, -, 50 MP 1 AP, rng 4, single ally: Protect 1 + +1 SPD stage. "It saw the bridge go. It tells one of you to step back." The support row: negate the next hit on the ally the mothman chooses.
- NEW **Harbinger** — T3, effect/debuff, -, 75 MP 1 AP, rng 4, aoe r1: Marked 2 + Discord 2 to every enemy in the 3×3. "Everything in the square is on the list." Mass reveal plus the Discord that Prophecy pays off — the T4 becomes self-contained without borrowing Dread Aura.
**Upgrades.** Prophecy: Exploit and Widen (7×7 disaster) — never Efficient (it is already the race's whole turn). Harbinger: Lingering. Red Eyes: Long Reach.

### 🏙️ Kaiju Rampage `kaiju` — VERDICT: KEEP, make it UNIQUE to kaiju (Kong moves to his own kit)
**Identity.** The city as a weapon: a thrown car, a stomp that cracks the block, a thrown skyscraper, and the beam. Stagger from the stomp → Atomic Breath payoff.
**Races.** Kaiju fits every row. King kong fails the yeti test on Atomic Breath (a gorilla does not breathe atomic fire) — RACE_REMOVE king kong; his city-wrecking moves (Seismic Leap) go to Great Ape below and he keeps Beast. Flag UNIQUE: kaiju.
**Now.** T1 Cataclysm Stomp `raceCataclysmStomp` · 100 phys self-aoe r2 (5×5) + Stagger 1 + deform −2/−1, 2 AP, 25 MP · T2 Seismic Leap `raceSeismicLeap` · 100 +30/level leapStrike aoe r1 + Stagger 1 · T3 Skyscraper Toss `raceSkyscraperToss` · 125 phys aoe r1 rng 5, through cover · T4 Atomic Breath `raceAtomicBreath` · 160 MAGIC line w1 rng 5, finisher stagger ×1.5.
**Problems.** Atomic Breath is magic damage on a race with INT 25 (kaiju) — the family's own T4 finisher does nothing for the only unit that should have it. Cataclysm Stomp is a 5×5 100-damage stagger at T1 for 25 MP; Quake (`earth` T4) is the same shape at 160 for 100 MP and 2 AP — Stomp is a tier too low for its footprint.
**Changes.**
- REWRITE `raceAtomicBreath`: element fire, damageType PHYSICAL (kaiju absorbs fire, so no self-harm), 160 line w1 rng 5, finisher stagger ×1.5. Scales off the 100 ATK it was always meant to.
- RETIER `raceCataclysmStomp` T1 → T2 (50 MP), keep 2 AP, r2, 100 dmg, Stagger 1, deform. Kaiju rung 2 → `raceCataclysmStomp`.
- MOVE `raceSeismicLeap` → `apeintelligence` (Kong's rung 2 — it is his Empire State leap; kaiju keeps Stomp for the same job).
- FAMILY flag UNIQUE: kaiju.
**Additions.**
- NEW **Car Toss** — T1, damage, -/physical, 25 MP 1 AP, rng 4, single, 100 dmg, `ignoresLineOfSight`. "Whatever was parked there." The T1 rung and the small version of Skyscraper Toss (single → aoe is the family's ladder). Kaiju rung 1 → `raceCarToss`.
**Upgrades.** Atomic Breath: Exploit; Car Toss: Blast is the family's 3×3 at low tier — allow it, and Long Reach. Cataclysm Stomp: exclude Widen (it is already 5×5).

### 🙉 Monkey Brains `apeintelligence` — VERDICT: RENAME → "Great Ape", GROW to Kong's full kit
**Identity.** The 12-metre gorilla: pound the chest, leap from the tower, go ape, and the smash that reshapes the ground. Stagger from the leap → Ape Fury payoff.
**Races.** King kong only — correct. Note for the Agriculture auditor: Kong on Agriculture (seeds) fails the yeti test; with Great Ape at four rows and Beast, he can drop it. RACE_ADD king kong → `titan` (Giant Abilities): he is a giant by every measure and Titan Drop / Giant Smash read as his moves.
**Now.** T1 Chest Pound `raceChestPound` · DEF −1 self-aoe r2 · T3 Monkey Business `raceApeFury` · self +1 ATK, 75 MP · T4 Ape Fury `racePrimalSmash` · 180 phys rng 1, finisher SLOW ×1.5, deform (Kong has no Slow in his pool — needs a teammate).
**Problems.** The id/name mismatch (`raceApeFury` is the buff, `racePrimalSmash` is "Ape Fury") will keep biting whoever edits data.js. Monkey Business at T3 for +1 ATK is Death Pact (`blackmagic` T1) at three times the price. The T4 finisher keys on a status the race cannot apply. "Monkey Brains" promises intelligence; the rows are rage.
**Changes.**
- FAMILY_RENAME `apeintelligence` "Monkey Brains" → "Great Ape".
- RENAME `raceApeFury` "Monkey Business" → "Go Ape"; REWRITE: T3, 75 MP, self +2 ATK stages, `selfDamagePct: 0.1`. (Blood Ritual T3 gives +1 for the same HP price — this is the bruiser version.)
- REWRITE `racePrimalSmash` Ape Fury: finisher slow ×1.5 → stagger ×1.5 (Seismic Leap sets it; the loop closes inside the race).
- MOVE IN `raceSeismicLeap` (T2, 100 +30/level leap aoe r1 + Stagger 1) from `kaiju`.
**Additions.** None — Chest Pound T1, Seismic Leap T2, Go Ape T3, Ape Fury T4 is the ladder.
**Upgrades.** Ape Fury: Exploit. Seismic Leap: Widen. Chest Pound: Widen/Lingering.

### 🪜 Giant Abilities `titan` — VERDICT: KEEP (fill the bottom, fix the two T4s)
**Identity.** Very big things doing very big things: the sniff-and-stomp, the thrown rock, a stride that crosses the map, the drop from above, and two finishers. Stagger loop self-contained (Fee Fi Fo Fum sets, Colossal Crush pays).
**Races.** Giant, cyclops, nephilim (2.7 m), juggernaut (3.8 m) all fit. RACE_ADD king kong (12 m). Not loch ness / tree person — enormous but the rows are bipedal leaps and stomps.
**Now.** T3 Fee Fi Fo Fum `raceTitanStep` · 125 earth/phys self-aoe r1 + Stagger 1, 75 MP · T3 Titan Drop `raceTitanDrop` · 125 +25/level leapStrike rng 2 · T4 Colossal Crush `raceColossalCrush` · 180 earth/phys, 2 AP, finisher stagger ×1.5 · T4 Giant Smash `raceGiantSmash` · 170 phys dash rng 2 + `dashDamage` 56 + Stun 1, 1 AP.
**Problems.** Fee Fi Fo Fum is Tremor Stomp (`earth` T1: 125 self-aoe r1 + Stagger 1, 25 MP) at T3 pricing — and giant, cyclops and nephilim all own Earth, so three of four races have the same spell twice. Giant Smash (170 + path damage + STUN for 1 AP) is strictly better than Colossal Crush (180 + finisher for 2 AP). No T1/T2; giant, cyclops and nephilim all lack movement (summary.md).
**Changes.**
- REWRITE `raceTitanStep` Fee Fi Fo Fum → T2 (50 MP), effect, self-aoe r2: every enemy within 2 is Marked 2 (smelled out; invisible broken) and Staggered 1. "Fee. Fi. Fo. Fum. He knows where you are, and the floor knows it too." A row that is not Tremor Stomp, keeps the rhyme's meaning, and is the family's stagger setup. Giant rung 3 stays `raceTitanStep`. [SKEPTIC: was T1, self-aoe r3 — a 7×7 no-damage Stagger (every enemy loses an AP) plus Marked for 25 MP is beyond every T1 aura on the board (Primal Roar 3×3, Dread Aura 5×5, both Discord only) and matches the 7×7 T2 rows (Fear, Dragonfear). 5×5 at T2 is the house shape; Stone Throw (moved in below) is the family's T1 entry point.]
- MOVE IN `raceStoneThrow` from `stoneage` as the T1 ranged option (100 earth/phys rng 5, finisher stun ×1.5, through cover) — see Stone Age.
- RECOST `raceGiantSmash` 1 AP → 2 AP (170 + path 56 + Stun is a two-AP turn; Absolute Zero's freeze costs 2).
- RECOST `raceColossalCrush` 2 AP → 1 AP (180 + stagger finisher, same as Jurassic Jaw at 1 AP).
**Additions.**
- NEW **Giant Stride** — T2, movement/dash, -, 50 MP 1 AP, rng 4: move to any tile within 4 ignoring terrain cost and elevation; enemies adjacent to the path take 60 physical. "Four of your steps. One of his." The movement row three of these races have none of.
**Upgrades.** Colossal Crush: Exploit. Stone Throw: Long Reach, Exploit (stun from Hypnotic Pulse on cyclops). Giant Smash: Lingering (Stun 2) is the scary one — allow it, it costs the 2 AP now. Titan Drop: Blast (the aoe drop) rather than a new spell.

### 🗿 Living Stone `livingstone` — VERDICT: KEEP
**Identity.** The body turned to rock: skin that hardens, stasis that heals, minds and then whole enemies petrified. A tank family — control and self-preservation, no damage (all three races carry Earth for that).
**Races.** Gargoyle, golem, crystal guardian all fit. No additions (tree person is wood; statue-like races end here).
**Now.** T2 Gothic Rampart `raceGothicRampart` · 2 wall tiles, 50 dmg, rng 2 · T2 Stone Skin `raceStoneSkin` · self +1 DEF · T2 Stoneform `raceStoneform` · 2 rounds no act, no damage, +15% HP/round · T3 Calcify `raceCalcify` · INT −2 rng 3.
**Problems.** Gothic Rampart is Rampart (`earth` T4, 3 tiles) minus a tile — and all three races own Earth, so it is a redundant wall in every pool that has it (the Earth auditor should retier Rampart down; its 60 dmg at T4 is the outlier summary.md flags). Three T2s, no T1, no T4.
**Changes.**
- DELETE `raceGothicRampart` (Rampart covers it; gargoyle rung 2 keeps its alternate `raceStoneform`).
- KEEP `raceStoneSkin` at T2 (parity with Thick Hide / Chitin Armor / Iron Bulwark, all T2 +1 DEF), `raceStoneform` T2, `raceCalcify` T3.
**Additions.**
- PASSIVE: new family passive **Unweathered** — T1 (1 SP), hooks `immuneStatus: ['burn']`, `armor: 5` (both new hook keys — engine patch). "Stone does not burn." The T1 rung as a passive: gargoyle/golem already carry poison immunity by affinity; burn is the one that still lands on rock.
- NEW **Petrify** — T4, effect/debuff, earth, 100 MP 1 AP CD2, rng 3, single: Stun 2 + DEF −1 stage. "Grey climbs from the feet up. For two rounds they are a statue; when it lets go, the cracks stay." A tank's T4 that needs no ATK/INT (golem has 0 INT); pairs with the game's stun finishers (Death Gaze, Stone Throw, Take Aim, Dust Devil, Aurora Ray, Fractal Needle, Dream Siphon, Space Disco).
**Upgrades.** Petrify: EXCLUDE Lingering via a family-scoped rule (Stun 3 on a single target = three lost activations for 1 AP; the CD does not make that fair) — Long Reach and Efficient are its upgrades. Calcify: Long Reach. Stoneform: Lingering (3 rounds of stasis) should be excluded via a family-scoped rule — it would be un-killable.

### 🗿 Stone Age `stoneage` — VERDICT: DELETE (fold the one spell into Giant Abilities)
**Identity.** "Caveman tech" — one thrown rock. Not a family.
**Races.** Cyclops only. Cyclops already owns Earth (Boulder Hurl T1 100 rng 3 stagger-finisher; Stonefall T1 100 rng 4 stagger, through cover), so a third T1 thrown rock in a family of its own is the definition of filler — but the stun finisher is the cyclops's own cross-family loop (Hypnotic Pulse → Stone Throw), so the row itself should live.
**Now.** T1 Stone Throw `raceStoneThrow` · 100 earth/phys rng 5 single, finisher stun ×1.5, through cover.
**Problems.** A one-spell family with no possible ladder; the spell is Stonefall (100 rng 4 through cover, applies Stagger) with +1 range and the Stagger swapped for a Stun finisher.
**Changes.**
- MOVE `raceStoneThrow` → `titan` (T1). Cyclops rung 1 `raceStoneThrow` stays inside his families.
- FAMILY_DELETE `stoneage`.
**Additions.** None.
**Upgrades.** See Giant Abilities.

### 🐫 Desert Acclimation `desertacclimation` — VERDICT: GROW
**Identity.** The desert as a caster's battlefield: pull them into the dust, bury the map in sand, sink them in quicksand, scour them with the wind. A control family — Root and Stun setups for the finishers its races already carry (Life Drain root ×1.5 on anubis; Dust Devil's own stun payoff).
**Races.** Anubis (Egypt) fits. Martian (Mars is a desert planet; Sandstorm is his rung-2 alternate) fits. MISFIT: golem — a Prague-clay construct with INT 0; Dust Devil is magic and Sandstorm is the only row he can use; RACE_REMOVE golem (his rungs are all Earth/Living Stone, nothing breaks). [SKEPTIC: the removal alone leaves golem with TWO families (Living Stone, Earth) — below the 3-family floor. RACE_ADD golem → `holydefense` (Holy Defense: Valkyrie Spear T1 phys, Holy Bulwark / Shield Maiden T2 shields, Divine Swoop T3 phys leap): golem is typed human/divine and "animated through inscription of divine sigils" to guard, which is the family's theme, and every row is usable at INT 0. Flag to the Holy Defense auditor.] RACE_ADD djinn — his own T4 Ancient Magic reads "older than the lamp, older than the sands" (the race lore itself only says "elemental entity... bound by complex metaphysical contract system"); a desert spirit caster with a 12-spell pool and no control rows (synergy.md: statuses it can apply — none).
**Now.** T1 Dust Devil `raceDustDevil` · 80 magic aoe r1 rng 4, pull to centre, finisher stun ×1.5 · T2 Summon Sandstorm `sharedSummonSandstorm` · sandstorm weather, rng 4.
**Problems.** Two spells, nothing above T2; summary.md lists movement as a gap for all three owners (martian: sustain/movement/buff; anubis: movement/buff/debuff; golem: sustain/movement) and this family gives them none of it.
**Changes.** None to the existing rows.
**Additions.**
- NEW **Quicksand** — T3, utility/zoneDebuff, earth, 75 MP 1 AP, rng 4, aoe r1, 2 rounds: enemies inside are Rooted 1 at the end of each round and Slowed 1. "The ground is fine until it is not." Root feeds anubis's Life Drain finisher and any Marksmanship/Insectoid teammate; the zone shape is what a 3-caster family wants.
- NEW **Simoom** — T4, damageEffect/aoe, wind/magic, 100 MP 1 AP, rng 4, aoe r1, 160 dmg, Blind 1. "The hot wind that kills. HEAVY magic damage to everything in the square, and nobody sees where it came from." Magic because two of the three owners are casters (anubis INT 86, djinn); martian's value is the control rows and Sandstorm (his ATK build has Alien Weapons for damage).
**Upgrades.** Dust Devil: Undertow (+1 pull), Widen, Exploit. Quicksand: Lingering. Simoom: Widen.

### 🐉 Dragon Abilities `dragonabilities` — VERDICT: KEEP
**Identity.** Fire from a flying serpent: the short breath that burns the ground, the terror that scatters them, the claws that carry one into the sky, the long breath that finishes the burning. Burn loop self-contained (Breath sets, Toss and Dragonfire pay).
**Races.** Dragon only — correct. No additions (kaiju is atomic, not dragonfire).
**Now.** T1 Dragon Breath `raceDragonBreath` · 90 fire/magic line 3 + Burn 2 + tiles burn 2 rounds · T2 Dragonfear `raceDragonfear` · Discord 2 self-aoe r3, 50 MP · T3 Dragon Toss `raceDragonToss` · 70 +25/level skyThrow, carry 5, collision 60, finisher burn ×1.5, needs flight (summary.md outlier at 70 base, but 5 levels of carry is +125 — fine) · T4 Dragonfire `raceDragonfire` · 160 fire/magic line rng 4 + Burn 2.
**Problems.** Dragonfire is Dragon Breath with bigger numbers and no finisher — the T4 does not pay off the Burn the T1 sets (only Dragon Toss does). Dragonfear is the third Discord aura (Dread Aura T1 does it for 25 MP) and the dragon has no Discord payoff. Pool 11; summary.md: no sustain, no movement (flight covers it), no buff.
**Changes.**
- REWRITE `raceDragonfire`: 160 fire/magic line w1 rng 4, Burn 3, finisher burn ×1.5. Breath → Dragonfire is now the family's loop, not just a scale-up.
- REWRITE `raceDragonfear`: T2, 50 MP, rng 4, aoe r1: Feared 1 (must flee) AND Burn 1 to every enemy in the 3×3. "Ancient terror, roared down from above. They run, and they run burning." Fear (`shadow` T2, 50 MP) is ALREADY a self-aoe r3 Feared 1 — the obvious "self-aoe r3 fear" rewrite would be a straight copy of it. Throwing the roar 4 tiles from the air (the dragon flies; it does not stand in the crowd) at a 3×3 with a Burn 1 rider makes it the dragon's scatter that also feeds Toss/Dragonfire, and it stops being a Dread Aura copy.
**Additions.**
- NEW **Ember Heart** — T2, heal/selfHeal, fire, 50 MP 1 AP, self: heal 20% max HP + Regen 2. "The furnace inside never goes out." The race's sustain gap; below Lunar Regeneration (T3, 25% + cleanse) by tier.
**Upgrades.** Dragonfire: Exploit (×2 on Burn), Widen does not apply (line) — do not add a cone spell, Long Reach is the line's growth. Dragon Breath: Lingering (Burn 3 → more Toss/Dragonfire windows). Dragon Toss: Empowered.

### 👁️ Eyesight `eyesight` — VERDICT: KEEP
**Identity.** The eye as a weapon and a shield: it guards, it sees everything, it stares a group still, it kills what it looks at. Stun loop self-contained (Hypnotic Pulse sets, Death Gaze pays; cyclops also pays with Stone Throw).
**Races.** Cyclops (one giant eye) and occulus (IS an eye) fit. RACE_ADD grey ("disproportionately large ocular organs", "do not make sustained eye contact", INT 99 — the gazes are made for it; it comes off Cryptid). Caveat on cyclops: Baleful Gaze and Death Gaze are magic on a 25-INT tank, so his real Eyesight rows are Pupil Shield, Omni-Vision and Hypnotic Pulse; swap cyclops rung 2 `raceBalefulGaze` → `raceHypnoticPulse`.
**Now.** T1 Pupil Shield `racePupilShield` · 130 shield, rng 3 aoe r0 (one ally) · T2 Baleful Gaze `raceBalefulGaze` · 130 magic line w1 rng 5 · T2 Omni-Vision `raceOmniVision` · scan r3 rng 5 · T3 Hypnotic Pulse `raceHypnoticPulse` · Stun 1 single rng 3, no damage · T4 Death Gaze `raceDeathGaze` · 180 magic single rng 4, DEF −1, finisher stun ×1.5.
**Problems.** Hypnotic Pulse (75 MP, stun only) is strictly worse than Stun Ray (`alientechnology` T1: 100 dmg + Stun 1 for 25 MP — it is not on summary.md's tier-rule list, which only catches damageEffect ≥120 below T3, but a T1 that carries a full Stun on top of house-scale damage is under-priced; flag to the Alien Weapons auditor). Otherwise the ladder is complete and the numbers are on scale (Baleful Gaze 130 = Thunderbolt T2 130; Pupil Shield 130 ≈ Psychic Barrier 150 at T2).
**Changes.**
- REWRITE `raceHypnoticPulse`: T3, 75 MP, rng 3, aoe r1: Stun 1 to every enemy in the 3×3. "Everything that looks back stops." A 3×3 stun is worth T3; the only other aoe stun is Eternal Slumber (`astral` T4, 160 magic 5×5 + Stun 1, 2 AP CD2), so a damage-free 3×3 stun at 1 AP is a row nothing else has; single-target stun stays Alien Weapons' T1.
- KEEP the other four as they are.
**Additions.** None.
**Upgrades.** Death Gaze: Exploit (×2 on Stun) — with Hypnotic Pulse or Petrify (gargoyle teammate) it is the cleanest 360 in the game; allow it. Baleful Gaze: Long Reach. Hypnotic Pulse: Lingering (Stun 2 in a 3×3) should be excluded via a family-scoped rule. Pupil Shield: Widen is the group-shield upgrade — do not add a second shield spell.

SPELL COUNT: 54 → 67 for this group (6 rows deleted/merged, 1 moved out to Trickery, 20 new incl. 2 passives — Uproot struck; Stone Age folded into Giant Abilities; Kaiju Rampage flagged UNIQUE kaiju).

SKEPTIC PASS (g5): checked every race in the group against the 3-family floor and its tree rungs after the moves — golem was the only breach (fixed above); catgirl 4, grey 3 (UFO/Psychic/Eyesight), cyclops 3, kong 3 without Agriculture, bigfoot 3 without Agriculture, goatman 4, djinn 4. No spell lands in two families (Tail Whip, Borrowed Claw, Seismic Leap, Stone Throw each move once; Stone Age is deleted with no races). Family adds pass the yeti test on the race's own lore line: grey → Eyesight ("disproportionately large ocular organs", "do not make sustained eye contact"), goatman → Cryptid ("mimicking human speech to lure subjects"), catgirl → Beast ("feline predatory adaptation"), kong → Giant Abilities (12 m), djinn → Desert (the character is an Arabian desert spirit — the theme belongs to the djinn, not merely to sand).
