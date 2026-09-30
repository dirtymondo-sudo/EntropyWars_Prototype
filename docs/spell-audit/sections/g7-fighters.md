### 💪 Human Grit `humangrit` — VERDICT: KEEP
**Identity.** The powerless human's kit: one honest hit, then sustain and refuse-to-die buffs — the self-sufficiency family for units whose other families are all offence.
**Races.** homosapien, sidekick, firefighter, door agent ("Stats are unremarkable") all fit; cyborg fits (lore: "retain human adaptability"). ADD **police officer** — a plain human with no sustain in its pool (summary: "police officer: sustain, movement, debuff" missing) and Adrenaline Rush is exactly a cop's second wind. No misfits.
**Now.**
- T1 Elbow Grease `raceElbowGrease` · 90 physical (metal), rng 1.
- T1 Improvise `improvise` · 80 physical, rng 2.
- T2 Adrenaline Rush `raceAdrenalineRush` · self-heal 55% max HP, SPD +1, cleanse 2.
- T3 Underdog Spirit `raceUnderdogSpirit` · self ATK +1 stage. 75 MP.
- T4 Indomitable Will `raceIndomitableWill` · Indomitable 3 (first killing blow leaves 1 HP), 2 AP, CD3.
**Problems.** Two T1 weak hits with no rider do the same job (summary redundancy group "Bone Toss · Improvise"; Elbow Grease is the same row with a metal tag). Underdog Spirit is a T1 effect priced at T3: End Zone Dance, Sad Backstory, Forest Ambush all give ATK +1 for 25 MP at T1. Adrenaline Rush's 0.55 is the highest `selfHealPct` in the game (others run 0.25–0.50) — on a 700-HP firefighter it is 385 HP for 50 MP at T2, more than Yo Ho's T3 130-per-ally. Indomitable Will spends 2 AP for a status nothing pays off (synergy: indomitable PAYOFF 0) — Invulnerable does Protect 2 at T2 for the same 2 AP.
**Changes.**
- DELETE `improvise` (Elbow Grease covers the T1 hit; homosapien's rung 1 pair `[raceElbowGrease, improvise]` becomes `raceElbowGrease` alone).
- REWRITE `raceElbowGrease`: 100 physical (metal), rng 1, 25 MP 1 AP — on the T1 single scale, nothing else.
- RECOST `raceAdrenalineRush` selfHealPct 0.55 → 0.40, keep SPD +1 and cleanse 2 (50 MP 1 AP).
- REWRITE `raceUnderdogSpirit`: T3 75 MP 1 AP — self ATK +2 stages and cleanse 1 debuff. "Nobody believed in you — good." (Mimicry is +2/+2 at T4; +2 ATK plus a cleanse is the T3 rung.)
- RECOST `raceIndomitableWill` apCost 2 → 1 (100 MP, CD3 stays).
- PASSIVE: new family passive **Second Wind** `passiveSecondWind` — T2 (2 SP), hook `healOnceBelowPct: { pct: 35, healPct: 30 }`: once per life, dropping under 35% HP heals 30% max HP. The grit the other families cannot buy.
**Additions.** None — T1 hit / T2 heal / T3 buff / T4 survive is a complete ladder.
**Upgrades.** Elbow Grease takes Empowered, Forked, Blast (the family's only damage row, so Blast is its 3×3). Adrenaline Rush: Efficient. Indomitable Will: Lingering (+1 round). Underdog Spirit should NOT take Lingering — stat stages are not statuses.

### 👏 Teamwork `teamwork` — VERDICT: GROW
**Identity.** The squad family: tempo and positioning for allies — extra actions, swaps, ally buffs, and a strike that rewards surrounding a target.
**Races.** All nine fit: antperson ("coordinated swarm tactics"), general, quarterback, super sentai (a team of five), ringmaster ("every ally where the crowd can see them"), bee queen (the hive), sidekick ("fights better next to someone"), firefighter (an engine company), homosapien. No additions needed.
**Now.**
- T2 Encore `encore` · 1 bonus AP to an ally that already acted, rng 3, CD2.
- T2 Pep Talk `jackOfAll` · SELF: ATK/DEF/M.ATK/M.DEF +1 stage, MOV +1, RNG +1, 3 turns. 50 MP 1 AP.
- T3 Team Strike `sentaiTeamStrike` · 5×27 = 135 physical, rng 1, 2 AP.
**Problems.** Pep Talk is a six-stat SELF buff for 50 MP — it out-buffs Mimicry (T4, ATK +2 / DEF +2) and has nothing to do with teammates; identity drift and a tier offender. Team Strike pays 2 AP for 135 damage, which a 1-AP T3 (Skull Crack 125 + Silence) beats; nothing about it is a team move. No T1, no T4 (summary: missing T1, T4).
**Changes.**
- REWRITE + RETIER `jackOfAll` "Pep Talk": target a friendly unit within 3 (not self), grant it the jackOfAll status (ATK/DEF/M.ATK/M.DEF +1, MOV +1, RNG +1) for 3 turns; T2 → T3, 75 MP 1 AP. Oath of Valor gives ATK +1 to all nearby at T3; one ally getting six stats is the same weight. RUNGS (skeptic): a T3 row cannot sit in a rung-2 slot — sidekick rung 2 `jackOfAll` → `encore`; homosapien rung 2 `[raceAdrenalineRush, jackOfAll]` → `[raceAdrenalineRush, encore]` (Encore is T2 Teamwork, inside both races' families).
- REWRITE `sentaiTeamStrike`: T3 75 MP **1 AP**, rng 1, 5×27 physical, plus one extra 27-damage hit per allied unit adjacent to the target (max +3 → 216) — NEW engine field `bonusHitsPerAdjacentAlly: { dmg: 27, max: 3 }` (nothing reads it today; skeptic flag, not a blocker). The surround-and-beat move.
- KEEP `encore` at T2 (CD2 keeps a premium tempo tool honest).
**Additions.**
- NEW **Tag In** `raceTagIn` — T1, movement/swap (ally only), 25 MP 1 AP, rng 3, CD2. Swap places with a friendly unit within 3. "Sub in. Sub out." Pulls a wounded ally out of melee and puts the tank in — the cheapest positioning tool in the game, ally-only so it is not Skin Swap (T3).
- NEW **Everybody Up** `raceEverybodyUp` — T4, effect/warCry, 100 MP 1 AP, aura r2, CD3. All allies within 2: ATK +1, DEF +1, cleansed of every debuff. "On three." The team reset before the push; sits above Oath of Valor (ATK +1 only, T3).
**Upgrades.** Encore takes Long Reach and Efficient. Team Strike takes Empowered (per hit) — not Blast (its bonus is already positional). Pep Talk takes Lingering (+1 round) and Long Reach. Everybody Up should not take Widen (aura, not a targeted area).

### 🏃 Athleticism `athleticism` — VERDICT: KEEP (rebuilt)
**Identity.** Pure body: sprint, dodge, vault, charge — the mobility family for humans and near-humans with no magic to move them.
**Races.** Fit: homosapien, swordfighter, catgirl ("reflexes 3.2× baseline"), ki fighter, quarterback, bunny girl, sidekick, rabbit ("Quick Feet"), luchador ("dive off anything taller"), firefighter ("carry the wounded out"). **juggernaut** — "Subject does not run. Subject walks." — is the thematic stretch, BUT it has only three families (Athleticism, Dirty Fighting, Giant Abilities) and the audit floor is 3, so it STAYS (skeptic: struck the removal). Its one honest athletic row is the charge: the merged `rampage` below IS its Unstoppable Charge. MISFIT: **astronaut** — a suited NASA pilot whose lore is zero-g and a railgun; it already has Gravity Boots for movement. REMOVE astronaut (pool 21 → 17).
**Now.** (`rampage` and `raceRampage` are one object.)
- T2 Nimble Dodge `raceNimbleDodge` · teleport 2 + Invisible 1, CD3.
- T2 Thick Hide `raceThickHide` · self DEF +1.
- T4 Rampage `rampage` · dash charge 160, rng 4, path enemies take 64.
- T4 Unstoppable Charge `raceUnstoppableCharge` · dash charge 180, rng 4, Stagger 1.
**Problems.** Two T4 dash charges (summary redundancy group "Rampage · Bull Rush · Rampage"; Unstoppable Charge is the same kind at 180). Thick Hide is the fourth DEF +1 clone (Iron Bulwark, Stone Skin, Chitin Armor) and is not athletic. No T1, no T3. Five listed rows, four objects, two real roles.
**Changes.**
- MERGE `raceUnstoppableCharge` into `rampage`: REWRITE `rampage` — T4 100 MP 1 AP, rng 4, 170 physical on the target, 64 to every enemy on the path, target Staggered 1. Juggernaut's T4 rung `raceUnstoppableCharge` → `rampage` (the merged row, still in Athleticism).
- MOVE `raceThickHide` → `titan` (Giant Abilities has no T1/T2; a thick hide belongs to giants, cyclops, nephilim and the juggernaut). Juggernaut's T2 rung follows it. Cross-slice: the titan block should confirm.
- RACE_REMOVE astronaut only (juggernaut stays: removing it would leave the race with 2 families).
**Additions.**
- NEW **Sprint** `raceSprint` — T1, movement/dash, no damage, 25 MP 1 AP, rng 3. Run up to 3 tiles in a straight line; no opportunity strikes. "Go." The cheap gap-closer/escape the family had no T1 for; pairs with any melee row.
- NEW **Shake It Off** `raceShakeItOff` — T2, heal/selfHeal, 50 MP 1 AP, CD2. Heal 25% max HP and cleanse 2 debuffs. "Walk it off." Gives swordfighter, ki fighter, quarterback, rabbit and luchador their missing sustain (summary lists all five under "sustain"; catgirl is not on that list — Draining Embrace covers her), smaller than Adrenaline Rush (40%) which only five races carry.
- NEW **Vault** `raceVault` — T3, damage/leapStrike, physical, 75 MP 1 AP, rng 3, 125 dmg, `dmgPerLevel: 15`. Leap over walls and bodies to a tile beside an enemy and land on them. "Over, not through." The T3 the family lacked; Cliff Charge (T2 100) and Titan Drop (T3 125) are the comparables.
**Upgrades.** Rampage takes Empowered, Knockback and Exploit (it now applies Stagger itself, so Exploit reads on the path bonus only — skip it) → Empowered + Knockback. Vault takes Long Reach. Nimble Dodge and Sprint take Long Reach. Shake It Off takes Efficient.

### 🥋 Martial Arts `martialarts` — VERDICT: GROW
**Identity.** Unarmed close-quarters offence: fast hits, a knockdown, a pressure-point stun and one heavy punch — the melee spine for fighters who carry no weapon.
**Races.** ki fighter and super sentai are exactly this. luchador is wrestling, not karate, but Haymaker and the punches read fine on a masked brawler — keep. No additions (antihero and gangster belong to Dirty Fighting).
**Now.**
- T1 Flurry of Blows `raceFlurryOfBlows` · 4×33 = 132 physical (wind), rng 1.
- T1 Haymaker `haymaker` · 100, shove sideways, collision +40, finisher ×1.5 vs Root.
- T4 A Really Good Punch `reallyGoodPunch` · 180 physical, rng 1, **25 MP** 1 AP.
- T4 Dragon Fist `raceDragonFist` · 180 fire/physical, rng 2, 100 MP.
**Problems.** Flurry is 132 damage at T1 (T1 median 100). A Really Good Punch is a T4 pinned at 25 MP (summary off-ladder list) — a joke row that is the best damage-per-MP in the game and nobody's rung. Two plain 180 punches at T4. Haymaker's Root finisher is self-contained for luchador only (Iron Grip); ki fighter "needs teammate 1 [Haymaker(root)]". No T2, no T3.
**Changes.**
- RECOST `raceFlurryOfBlows` hits 4×33 → 4×25 (100 total) at T1.
- REWRITE `haymaker`: 100 physical, rng 1, push 1 sideways, collision +40, finisher ×1.5 vs **Stagger** (Sentai's Yellow Thunder and luchador's Mic Drop set it today; luchador's Body Check sets it only after its Dirty Fighting rewrite below — today it pays Stagger off, it does not apply it; the new Roundhouse sets it for all three races, so the finisher is self-contained for all three).
- DELETE `reallyGoodPunch` (Dragon Fist covers the T4 hit; the T3 slot goes to a real move).
- REWRITE `raceDragonFist`: 180 fire/physical, rng 2, 100 MP 1 AP, finisher ×1.5 vs **Stun** — pays off Pressure Point below.
**Additions.**
- NEW **Roundhouse Kick** `raceRoundhouseKick` — T2, damage/barrage, physical, 50 MP 1 AP, self-aoe r1, 100 to every adjacent enemy, each Staggered 1. "Everyone in reach." The family's area clear and its Stagger setup for Haymaker.
- NEW **Pressure Point** `racePressurePoint` — T3, damageEffect, physical, 75 MP 1 AP, rng 1, 100 dmg, Stun 1, CD2. "Two fingers. Lights out." Gives ki fighter its missing debuff and sets up Dragon Fist (180 × 1.5 = 270 on a stunned target across two turns — the family's own combo).
**Upgrades.** Flurry takes Empowered (per hit). Haymaker and Roundhouse take Knockback. Dragon Fist takes Exploit and Long Reach. Pressure Point must NOT take Lingering (Stun 2 at T3 + 1 SP is out of scale; Taser is Stun 1 with CD2) — scope Lingering off this row.

### 💥 Ki Energy `ki` — VERDICT: GROW (flag UNIQUE: ki fighter)
**Identity.** Ranged ki blasts, a charge-up and the teleport — what makes the ki fighter a bruiser who can also fight at 4–5 tiles.
**Races.** ki fighter only; nobody else channels ki. Mark UNIQUE so it stays that way.
**Now.**
- T1 Ki Volley `raceKiBlast` · 3×45 = 135 **magic**, rng 4.
- T2 Ki Charge `raceKiCharge` · self ATK +1. 50 MP.
- T2 Ki Wave `raceKiWave` · line 135 magic, rng 5, 2 AP.
- T3 Instant Transmission `raceInstantTransmission` · teleport 5.
**Problems.** Ki rows are `damageType: magic` on a race with ATK 82 / INT 46 — the fighter's own family scales off its worst stat. Ki Volley is 135 at T1 (T1 ~100). Ki Charge is the ATK +1 T1 clone priced at T2 (End Zone Dance, Sad Backstory: 25 MP). Ki Wave: 135 line at T2 is a T3 number, and 2 AP at T2 is the wrong knob. No T4 (summary).
**Changes.**
- REWRITE `raceKiBlast`: damageType **physical** (element light, ranged), 3×33 = 100, rng 4, T1 25 MP 1 AP.
- REWRITE `raceKiCharge`: T2 50 MP 1 AP — self ATK +1 stage AND a 96-point ki barrier (`shield: 96`, Fortify's number). "Breathe in. Hold." Buff plus shield is a T2 weight; the lore's "defensive barriers" finally exist.
- REWRITE `raceKiWave`: damageType physical (light), line 110, rng 5, T2 50 MP **1 AP**.
- KEEP `raceInstantTransmission` T3.
- PASSIVE: new family passive **Rising Power** `passiveRisingPower` — T2 (2 SP), hooks `stagePerRounds: { atk: 1, every: 3 }`, `resetOnDeath: true`: +1 ATK stage every 3 rounds, lost on death. The power-level fantasy as a row.
**Additions.**
- NEW **Spirit Bomb** `raceSpiritBomb` — T4, damage/delayed, light/magic, 100 MP **2 AP**, rng 5, aoe r1, `delayTurns: 1`, **160** magic (skeptic: 180 area beat Nuke 160 / Merkaba 160 and the Cannonball recost to 160 in this very file; every delayed row — Nuke, Artillery Strike — is 2 AP, and the gather IS the second AP). Gather it this round; it lands on the marked 3×3 at the end of the next. "Lend me your energy." The one ki row that stays magic (it is everyone's ki); the delayed-area shape (Artillery Strike, Nuke, Fire for Effect) exists only in Military Combat (marksman, mech, general, politician) and is missing from every family in this group.
**Upgrades.** Ki Volley: Empowered, Long Reach. Ki Wave: Hot Loads does not apply (not a gun) — Empowered only. Spirit Bomb: Widen (5×5) is the family's big-area answer; do not add a separate spell for it.

### ⚔️ Swordsmanship `swordsmanship` — VERDICT: KEEP
**Identity.** The blade: a cut that leaves a wound, a beam, a whirl and a finishing slash — physical metal damage in every shape.
**Races.** pirate (cutlass), swordfighter, knight, king arthur fit. skeleton is the trope skeleton-with-sword — keep — but Blessed Blade (light) on an unholy skeleton is the one row that fails the yeti test, and it is moving (below). No additions.
**Now.**
- T1 Cross Slash `crossSlash` · 100 metal, finisher ×1.5 vs Slow.
- T2 Sword Beam `swordBeam` · line 100, rng 3.
- T3 Blade Waltz `bladeWaltz` · cross r2 around self, 125.
- T4 Blessed Blade `raceBlessedBlade` · light aoe r1 at rng 1, 170.
- T4 Dragon Slash `dragonSlash` · 180, ignores DEF, finisher ×1.5 vs Burn, 1 AP.
**Problems.** Cross Slash's Slow finisher needs a teammate for 4 of 5 races (synergy: swordfighter/knight/pirate/arthur "needs teammate [Cross Slash(slow)]"). Dragon Slash at 1 AP with 180 + ignoreArmor + a finisher outclasses every 2-AP T4 (Colossal Crush 180 + finisher costs 2 AP). Blessed Blade duplicates Merkaba's signature (summary redundancy group: damage/aoe/light r1, 160 vs 170) and its description is the generic "Deals HEAVY physical damage to All Enemies in an AOE." — no sword lore at all; it is swordfighter's T4 rung, and swordfighter's other family, Main Character Energy, has no T4 at all. Grievous has ZERO payoff anywhere in the game (synergy: grievous PAYOFF 0).
**Changes.**
- REWRITE `crossSlash`: 100 metal, rng 1, applies **Grievous 2** (the X-cut that will not close), no finisher. Every swordsman now sets up his own finisher.
- REWRITE `dragonSlash`: 180 physical, rng 1, ignores DEF, finisher ×1.5 vs **Grievous**, apCost 1 → **2**, 100 MP. Cross Slash → Dragon Slash = 270 through armour over two turns, self-contained for all five races.
- MOVE `raceBlessedBlade` → `maincharacter` (fills its missing T4; swordfighter keeps it as its T4 rung through that family; skeleton stops carrying a light-element blade; give it a line of plot-armour flavour text when it lands — the current desc is the stock AOE sentence). Cross-slice: the maincharacter block should confirm.
- KEEP `swordBeam` T2, `bladeWaltz` T3.
**Additions.** None — T1 wound / T2 line / T3 whirl / T4 slash is a clean four-rung ladder; the family does not need a second T4.
**Upgrades.** Cross Slash: Lingering (Grievous 3) and Forked. Sword Beam: Long Reach, Empowered. Blade Waltz: Widen should be scoped OFF (a cross is not a square). Dragon Slash: Exploit (×2 vs Grievous) — the family's top-end.

### 👊 Dirty Fighting `dirtyfighting` — VERDICT: KEEP
**Identity.** Brawling that breaks rules: stagger, wounds that will not heal, a grab, a silence and an execution — the melee debuff family.
**Races.** antihero, clown, gangster, goblin, luchador, juggernaut (rungs here; all fight dirty) fit. minotaur (a beast that curb-stomps) and giant (stomps, no finesse) fit the physical rows. overlord is the stretch — "genius-level strategic mind" — but a warlord's No Mercy fits and its other two families are all magic; keep. No additions (pirate's dirty tricks go in Piracy).
**Now.**
- T1 Body Check `raceBodyCheck` · 100, push 2, finisher ×1.5 vs Stagger.
- T1 Curb Stomp `raceStompOut` · 120, Grievous 2.
- T1 Dark Justice `raceDarkJustice` · charge rng 3, 100, `bonusVsDebuffed` (DEAD).
- T2 Iron Grip `ironGrip` · Root 2 + grounds flyers, rng 1, no damage.
- T3 Brutal Slam `raceBrutalSlam` · self-aoe r1, 125.
- T3 Skull Crack `skullCrack` · 125, Silence 1.
- T4 No Mercy `raceNoMercy` · 180, 2 AP, finisher ×1.5 vs Stagger, `executeBonusPct` (DEAD).
**Problems.** Nothing in the family SETS Stagger, yet two rows pay it off (gangster "needs teammate 2 [Body Check, No Mercy]"). Curb Stomp is a summary tier-rule offender (120 + status at T1). Dark Justice's description promises bonus damage vs debuffed targets that the row cannot deliver (synergy dead field). Iron Grip at T2, rng 1, no damage is strictly worse than Anchor (T1, rng 3, same Root 2 + grounds flyers). Brutal Slam is Fee Fi Fo Fum (T3 125 self-aoe + Stagger) without the Stagger — juggernaut and giant carry both. No Mercy's "far more damage the lower the target's HP" is a dead field while `executePct` is live on Walk the Plank.
**Changes.**
- REWRITE `raceBodyCheck`: 100 physical, rng 1, push 2, applies **Stagger 1**, no finisher. The family's own setup.
- REWRITE `raceStompOut` "Curb Stomp": 100 physical (was 120), Grievous 2, finisher ×1.5 vs Stagger. Body Check → Curb Stomp = 150 + a wound for two T1 rows.
- REWRITE `raceDarkJustice`: charge rng 3, 100 physical, `bonusVsStatus: [grievous, silence] ×1.5` (the live list form High Noon uses) — "bonus damage to the Wounded or Silenced"; drop the dead `bonusVsDebuffed`.
- REWRITE `ironGrip`: T2 50 MP 1 AP, rng 1, **80 physical** + Root 2 + grounds flyers. The grab that also hurts; Cuffed (T3) is 60 + Root 2.
- REWRITE `raceBrutalSlam`: T3 75 MP 1 AP, self-aoe r1, **110** physical, every enemy hit takes Grievous 2. The anti-heal area — a role no other AoE in the game has.
- REWRITE `raceNoMercy`: 180 physical, rng 1, 2 AP, finisher ×1.5 vs Stagger, `executePct: 0.25` (outright kill below 25% HP, the live Walk the Plank field) — drop the dead `executeBonusPct`.
- KEEP `skullCrack` T3.
- PASSIVE: new family passive **Cheap Shot** `passiveCheapShot` — T2 (2 SP), hook `physicalHitStatus: { id: 'grievous', duration: 1 }`: every physical hit leaves a 1-round Grievous wound. The healer-hunter's row.
**Additions.** None — seven rows across four tiers with two internal combos (Stagger → Curb Stomp/No Mercy; Grievous/Silence → Dark Justice) is already the densest human family.
**Upgrades.** Body Check: Knockback (push 3). Curb Stomp, No Mercy, Dark Justice: Exploit. Skull Crack: Lingering (Silence 2). Brutal Slam: Widen is the family's big area — do not add a separate spell. Iron Grip: Lingering (Root 3).

### 🏴‍☠️ Piracy `piracy` — VERDICT: KEEP
**Identity.** Boarding action: root them, charge them, drown them, then rally the crew — the pirate's control-plus-support kit.
**Races.** pirate only, and it should stay so (a family for one race is fine). No additions.
**Now.**
- T1 Anchor `raceAnchor` · Root 2 + grounds flyers, rng 3, no damage.
- T1 Plunder `racePlunder` · 70 physical, steals an item or Key.
- T2 Land Ho `raceBoardingRush` · charge rng 3, 130, finisher ×1.5 vs Root.
- T2 Walk the Plank `raceWalkThePlank` · 90, one tile → deep water spreading, executes below 25%, **2 AP**.
- T3 Yo Ho `raceYoHo` · heal all 130, cleanse 2, ATK +1 / M.ATK −1, 2 AP.
- T4 Cannonball `raceCannonball` · aoe r1 rng 5, **170** fire/physical, Burn 1.
**Problems.** Plunder's 70 is under the T1 scale (Elbow Grease 90–100) and its steal is a story-mode economy effect that does nothing in PvP. Walk the Plank at 2 AP for 90 damage makes the T1 Anchor + T2 Land Ho line (195 in two 1-AP turns) the only opener anyone picks. Cannonball 170 is above the T4 area scale (~160; Meteor is 160). Anchor → Land Ho is a good self-contained combo; keep it.
**Changes.**
- REWRITE `racePlunder`: 100 physical, rng 1, keep the steal (it stays a T1 hit in PvP, a heist in story).
- RECOST `raceWalkThePlank` apCost 2 → 1 (T2 50 MP; 90 dmg, 1-tile deep water, execute below 25% stay).
- RECOST `raceCannonball` dmg 170 → 160.
- KEEP `raceAnchor`, `raceBoardingRush`, `raceYoHo`.
- PASSIVE: new family passive **Sea Legs** `passiveSeaLegs` — T1 (1 SP), hooks `swim: true`, `terrainBonus: { water: { atkStages: 1, defStages: 1 }, deep_water: { atkStages: 1, defStages: 1 } }`: swims, and fights harder standing in water. Turns Walk the Plank's flood into home ground.
**Additions.** None — the family has 2/2/1/1 with one hit, one heal, one control, one charge, one area, one terrain row.
**Upgrades.** Anchor: Lingering (Root 3), Long Reach. Land Ho: Exploit (×2 vs Root). Cannonball: Widen (5×5) — the family's big area, do not add a spell for it. Yo Ho: Efficient. Walk the Plank: Long Reach.

### 🏇 Horseback Riding `horsebackriding` — VERDICT: GROW
**Identity.** Mounted combat: charges that close from farther than any leap, a ride-by that hits everyone in the lane, and the lance.
**Races.** knight, cowboy, sheriff ("track anything on foot or horseback") all ride. ADD **king arthur** — the High King rides at the head of his knights, and his pool (12) is missing sustain and debuff; three charges do not fix that but the family belongs to him before it belongs to a sheriff.
**Now.**
- T1 Brave Charge `guardSlash` · charge rng 3, 100 physical.
**Problems.** One row, and it is the generic charge (summary redundancy group: Brave Charge · Heroic Leap · Dark Justice · Borrowed Claw · Rocket Fist · Tail Whip…; Gore Charge sits outside it because it adds Stagger). A family cannot live on a clone; either it merges into Cowboy Skills (which would strand knight and arthur) or it grows. The theme is strong and no other family covers "mounted", so GROW.
**Changes.**
- REWRITE `guardSlash` "Brave Charge": charge rng **4** (a horse closes faster than legs), 100 physical, T1 25 MP 1 AP.
**Additions.**
- NEW **Saddle Up** `raceSaddleUp` — T2, effect/buff, 50 MP 1 AP, CD3. Self: Overclock 2 rounds (ATK +1 stage, MOV +1) and cleanse Slow/Root (cleanse 2). "Mount up." Robot's Overclock is a T2 at 50 MP; the cleanse is what makes it a horse.
- NEW **Ride-By** `raceRideBy` — T3, damage/dash, physical, 75 MP 1 AP, rng 4. Ride 4 tiles in a straight line: 110 to the enemy you end beside, 55 (`dashDamage`) to every enemy passed; no opportunity strikes. "Don't stop." The lane damage a mounted unit should have; Rampage's shape at T3 numbers.
- NEW **Lance** `raceLance` — T4, damage/dash, physical, 100 MP 1 AP, rng 5, **170** dmg, knockback 2, collision +40 (skeptic: 180 + knockback + collision at 1 AP outran Bull Rush 170, Giant Smash 170 + Stun and the merged Rampage 170; 170 is the 1-AP T4 dash line). "Couched and level." Distinct from Rampage (path damage + Stagger) and Bull Rush (Discord finisher): the lance sends them flying.
**Upgrades.** Brave Charge: Empowered, Forked. Ride-By: Empowered, Long Reach. Lance: Knockback (3), Long Reach. Saddle Up: Lingering (Overclock 3).

### 🪢 Ropework `ropework` — VERDICT: GROW
**Identity.** Rope control: pull, tether, tie and haul — the family that decides where bodies stand, for allies and enemies alike.
**Races.** pirate (rigging), cowboy (rung), ringmaster (whip and rope; rung) fit. ADD **sheriff** — "bring it back alive or otherwise" is a lasso, and its pool (17) is missing debuff and movement, both of which Lasso is. No misfits.
**Now.**
- T1 Grapple `raceGrapple` · utility: pull an enemy 2 and hit, or pull yourself to a wall. No status.
- T1 Lasso `raceLasso` · pull 2, Tethered 2 (dragged behind you, 20/tile), grounds flyers.
**Problems.** Grapple is also granted to EVERY unit by the Grapnel Gauntlet gear row (`grantSpell: raceGrapple`), so as a family row it is a 1-SP universal passive's ability wearing a family tag, and it is Lasso minus the tether. Two T1 pulls, nothing above T1. Tethered has one payoff (High Noon).
**Changes.**
- ~~MOVE `raceGrapple` → `gear`~~ STRUCK (skeptic): `gear` is the UNIVERSAL passive family — `families: ['gear']` puts Grapple in all 124 pools as an active T1 row (raceFamilyPoolIds walks familyMemberIds('gear')); there is no hidden-row flag on spells. The Gauntlet's `grantSpell` hook is not a family tag. Instead REWRITE `raceGrapple`: T1 utility, 25 MP 1 AP, rng 3, no damage — hook a wall, a standing door or an ALLY within 3 and pull YOURSELF to the tile beside it (self-pull only; the enemy pull and the hit are dropped — Lasso owns the enemy pull). Two T1s, two roles: Grapple = my position, Lasso = theirs. The Grapnel Gauntlet grants the same object, so its gear desc line should read "pull yourself to a wall, door or ally" (cross-slice: gear).
- KEEP `raceLasso` T1 unchanged — the best control row in the human families.
**Additions.**
- NEW **Hogtie** `raceHogtie` — T2, effect/debuff, 50 MP 1 AP, rng 1. An adjacent enemy is Rooted 2 and Staggered 1. "Hands and feet." Sets up Land Ho, Haymaker, High Noon; Cuffed (T3) is 60 + Root 2 alone.
- NEW **Rescue Line** `raceRescueLine` — T3, utility/pull (ally), 75 MP 1 AP, rng 4. Throw a rope to a friendly unit and haul it up to 3 tiles toward you, cleansing 1 debuff. "Grab hold." The only ally-pull in the game besides Knights of Round (which takes everyone); firefighter-grade lifesaving on a ringmaster.
- NEW **Round-Up** `raceRoundUp` — T4, movement/aoePull, 100 MP 1 AP, CD3, self-aoe r2. Every enemy within 2 is pulled 2 tiles toward the caster and Tethered 1. "Bring 'em in." The team's AoE setup: pull the pile, then Cannonball / Brutal Slam / Dynamite it.
**Upgrades.** Lasso and Round-Up: Undertow (+1 pull), Lingering (Tethered +1). Hogtie: Lingering (Root 3). Rescue Line: Long Reach. Family-scoped upgrade worth creating: **Barbed Rope** (1 SP, families ['ropework']): tethered drag damage 20 → 35 per tile (patch `tetherDragDmg: 35` — a NEW field; the 20/tile is a constant today, so battle.js must read the patch).

### 🚪 D.O.O.R. Training `door` — VERDICT: KEEP
**Identity.** The agent's own doors: a teleport, three ways to put a body where you want it (all Stagger), and a rear-attack drop — positional melee for a unit with assassin stats.
**Races.** door agent only; correct.
**Now.**
- T1 Door Dash `raceDoorDash` · teleport 5, no CD, 25 MP.
- T1 Swing Door `raceSwingDoor` · 40, Stagger 1, push 2 from a hinge tile, rng 3.
- T2 Air Mail `raceAirMail` · 110, Stagger 1, grounds flyers, rng 4.
- T2 Breaking and Entering `raceBreakingEntering` · 85, always a rear attack, caster arrives beside the target, rng 4.
- T4 Drop In `raceDropIn` · 165, rear attack, Stagger 1, WEAK splash to neighbours, 2 AP, rng 5.
**Problems.** Door Dash is a 5-tile teleport with no cooldown for 25 MP at T1 while Teleport (psychic) and Instant Transmission are T3 at 75 MP and Phase Walk / Gravity Boots are T2 — on a 170-MP unit it is six free teleports. Three rows apply Stagger and the agent's whole pool has ZERO Stagger payoff (synergy: door agent "self-contained 0, statuses it can apply: stagger, indomitable"). No T3 (summary).
**Changes.**
- RETIER `raceDoorDash` T1 → T2 (50 MP), keep teleport 5 and no CD; rung 1 pair `[raceSwingDoor, raceDoorDash]` becomes `raceSwingDoor`, rung 2 `[raceBreakingEntering, raceAirMail, raceDoorDash]`.
- KEEP `raceSwingDoor`, `raceAirMail`, `raceBreakingEntering`, `raceDropIn`.
- ~~PASSIVE **Doorman** (`doorFreeToggle: true`)~~ STRUCK (skeptic): the door agent already HAS this — its inherent race passive Keyholder (data.js `keyholder: { doorFreeToggle: true }`, races.md passives: Keyholder) is exactly one free friendly door toggle a turn; a 1-SP row that re-buys an inherent would be a dead SP. The family is 1/2/1/1 with Door Slam and needs no passive.
**Additions.**
- NEW **Door Slam** `raceDoorSlam` — T3, damage, psychic/physical, 75 MP 1 AP, rng 4, 130 dmg, finisher ×1.5 vs Stagger. Shoot a door onto a Staggered enemy's tile and slam it on them. "Mind your fingers." Air Mail → Door Slam = 195 at 4 tiles: the payoff three setups were waiting for.
**Upgrades.** Door Slam: Exploit (×2 vs Stagger) — the agent's whole game plan. Swing Door: Knockback (push 3 along the hinge line). Air Mail, Drop In: Lingering (Stagger 2). Breaking and Entering: Empowered. Door Dash: Efficient.

### 🚪 D.O.O.R. Gun `doors` — VERDICT: KEEP (UNIQUE)
**Identity.** Standing doors as terrain: lanes of ice, fire, light, wind and laser, a pull and an archer post — the deployable family that makes the map fight for the agent.
**Races.** door agent only, UNIQUE; correct.
**Now.** (all deploy, rng 4, 1 AP, 3 hits to break, two standing per player)
- T2 Archers' Door `gunArchersDoor` · 3 weak arrows at the nearest enemy within 4, each round and on entry.
- T2 Frost Door `gunFrostDoor` · 4-tile ice lane, weak cold + Slow 1, 3 rounds; bodies slide.
- T2 Gust Door `gunGustDoor` · 4-tile wind lane that blows every body (yours too) to its end +1; no damage.
- T2 Light Door `gunLightDoor` · 4-tile light lane: allies healed (moderate) + cleansed; enemies moderate + Blind 1.
- T3 Hell Door `gunHellDoor` · 3-tile lava lane, ground burns 2 rounds, moderate + Burn 2; melts Frost.
- T3 Laser Door `gunLaserDoor` · beam to the first wall, prisms turn it, strong to enemies only.
- T3 Maw Door `gunMawDoor` · pulls every enemy within 2 one tile toward it; a body on the door is bitten (moderate + Stagger 1).
**Problems.** No redundancy — every door has a different shape (arrows / two elemental lanes that interact / a heal lane / a pure-position lane / a beam / a pull). Shape 0/4/3/0: no T1, no T4. Note the "capture door" in the descriptions is a STORY bag item (data.js `kind: 'captureDoor'`, `story: true`), not a gun row — do not build a PvP T4 around it.
**Changes.** None to the seven rows.
**Additions.**
- NEW **Shut Door** `gunShutDoor` — T1, deploy/doorDeploy, 25 MP 1 AP, rng 4. A door with no destination: shut, it blocks movement and line of sight like a wall; the Keyholder's side may open it to pass. 3 hits to break. "Just a door." The cheap wall the lore promises ("use them as roads, walls and firing angles") and the prism/corner piece for Laser Door.
- NEW **Twin Doors** `gunTwinDoors` — T4, deploy/deployPair (the kind already exists: Tunnel Network `raceTunnelNetwork`, insectoid T3, "Deploys a linked pair of objects" — reuse it, this is not a new engine kind), 100 MP 1 AP, rng 4, CD3. Place two doors within 4 as a pair: any unit that steps, is knocked, blown or pulled into one comes out of the other (Swing Door, Gust, Maw and Round-Up all feed it). "Whatever goes in one comes out the other." The lore's core mechanic as the family's capstone; a Gust lane into a twin that exits onto a Hell lane is the agent's endgame.
**Upgrades.** Hot Loads IS this family's upgrade (+20% lane/arrow/beam damage and heal, +1 bounce) — take it on Archers', Frost, Light, Hell, Laser. Surplus on any door row should raise the shared standing-door cap 2 → 3 (say so in the row text). Long Reach: rng 4 → 5 on any door. Overclocked (turret) must be scoped OFF doors. Widen/Blast do not apply.

### 🏈 Football IQ `football` — VERDICT: KEEP
**Identity.** The quarterback's playbook: passes that hit at range, a blitz that staggers, a juke, a team call and the Hail Mary — ranged physical offence with a Stagger finisher.
**Races.** quarterback only; correct.
**Now.**
- T1 Bullet Pass `raceBulletPass` · line 80, rng 4.
- T1 End Zone Dance `raceEndZoneDance` · self ATK +1.
- T2 Blitz `raceBlitz` · charge rng 3, 100, Stagger 1.
- T2 QB Sneak `raceQBSneak` · teleport 3 + Invisible 1, CD2.
- T3 Audible `raceAudible` · allies within 2: SPD +1.
- T3 Spike the Ball `raceSpikeTheBall` · aoe r1 rng 3, **80** dmg.
- T4 Hail Mary `raceHailMary` · 180, rng 5, finisher ×1.5 vs Stagger.
**Problems.** Spike the Ball is a summary damage outlier: 80 area damage at T3 is the T1 area number (Yellow Thunder is 80 + Stagger at T2). End Zone Dance is one of six T1 self ATK +1 clones (Death Pact, Inner Demon, Forest Ambush, Hellfire Crown, Sad Backstory, End Zone Dance) and is nobody's rung. Audible at T3 gives one stat that Oath of Valor (ATK +1 all, T3) beats. Blitz at 100 + Stagger is Ram Charge (T1) priced at T2. QB Sneak duplicates Nimble Dodge in the QB's own pool (Athleticism) — pool-level, acceptable. Blitz → Hail Mary is self-contained; good.
**Changes.**
- DELETE `raceEndZoneDance` (ATK +1 self clone; Audible is the family's buff).
- RETIER `raceSpikeTheBall` T3 → T1 (25 MP), 80 aoe r1 rng 3 — the number was always T1. Rung 3 pair `[raceAudible, raceSpikeTheBall]` becomes `[raceAudible, raceLongBomb]`.
- RECOST `raceBlitz` dmg 100 → 110 (T2 with Stagger; Stampede is 130 and a tier offender — 110 is the line).
- REWRITE `raceAudible`: T3 75 MP 1 AP, aura r2 — every ally within 2 gains Overclock 1 (ATK +1 stage, MOV +1; tech allies also +1 RNG). "Check with me." The play call that moves the whole team one tile farther.
- KEEP `raceBulletPass`, `raceQBSneak`, `raceHailMary`.
**Additions.**
- NEW **Long Bomb** `raceLongBomb` — T3, damage, wind/physical, 75 MP 1 AP, rng 6, 135 dmg, `ignoresLineOfSight` (the ball arcs over cover). "Let it fly." The T3 single hit the family lacked; distinct from Hail Mary (finisher, rng 5, T4) by the arc and the range.
**Upgrades.** Bullet Pass: Long Reach, Empowered. Spike the Ball: Widen is the family's 5×5 — do not add a spell. Blitz: Lingering (Stagger 2). Hail Mary: Exploit (×2 vs Stagger), Long Reach (rng 6). Long Bomb: Forked, Empowered.

SPELL COUNT: 61 → 76 for this group (61 listed today = 60 objects, `rampage`/`raceRampage` being one; proposed 76 = 72 spells + 4 family passives; net: −4 deleted/merged (`improvise`, `reallyGoodPunch`, `raceEndZoneDance`, `raceUnstoppableCharge`→`rampage`), −2 moved out (`raceThickHide`→titan, `raceBlessedBlade`→maincharacter; `raceGrapple` stays in Ropework), +22 new rows = 18 spells + 4 passives (Doorman struck))
