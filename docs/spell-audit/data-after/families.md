# FAMILIES (122)

## 🌾 Agriculture `agriculture` · kind discipline · 5 spells (T1 2 / T2 1 / T3 1 / T4 1)
desc: 
races (7): shaman, antperson, scarecrow, bee queen, jack o lantern, tree person, hippie

- T1 **Green Thumb** `passiveGreenThumb` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Trees grown from this unit's seeds buff its ATK & spell power (+7 each, up to 6 living trees) and fuel Trunk Throw (+30 damage each). Life Sap heals 20% more. Enemies can chop or burn the forest to shut it down.
- T1 **Healing Seed** `healingSeed` · heal/seedHeal · nature · 25MP 1AP · dmg - · rng 3 · single · 
  Plant a seed on a tile within 3; grass grows under it. An ally on the seed heals 8% of max HP each round (double in rain). After 2 rounds (1 beside water or in rain) it grows into a Healing Tree: allies within 1 tile heal 7% of max HP every round (double in rain) until it is cut down.
- T2 **Poison Seed** `poisonSeed` · utility/seedPoison · poison · 50MP 1AP · dmg - · rng 3 · single · 
  Plant a seed on a tile within 3. An enemy on the seed loses 6% of max HP and is Poisoned for 2 rounds, each round. After 2 rounds (1 beside water or in rain) it grows into a Toxin Tree: enemies within 1 tile lose 5% of max HP and are Poisoned for 2 rounds, every round, until it is cut down.
- T3 **Leech Seed** `leechSeed` · utility/leechSeed · nature · 75MP 1AP · dmg - · rng 3 · single · 
  Plant a seed on a tile within 3. An enemy on the seed loses 5% of max HP each round, sent to your weakest ally; an ally on it heals 4%. After 2 rounds (1 beside water or in rain) it grows into a Leech Tree: enemies within 1 tile lose 4% of max HP every round, sent to your weakest ally, until it is cut down.
- T4 **Bumper Crop** `raceBumperCrop` · damageEffect/aoe · nature/magic · 100MP 2AP CD2 · dmg 120 · rng 4 · aoe r2 · status:root1
  Sow the whole field at once. Everything standing in it is rooted where it stands, and by next round there is a wood around them. Deals MEDIUM magic damage to every enemy in a 5x5 area and Roots them for 1 round. A seed lands on every empty tile of the area's edge and grows into a tree at the end of the round; the trees block sight and count as yours. Cooldown: 2 rounds.

## 👽 Alien Weapons `alientechnology` · kind discipline · 8 spells (T1 2 / T2 2 / T3 3 / T4 1)
desc: 
races (4): men in black, martian, annunaki, barbarella

- T1 **Heat Ray** `raceHeatRay` · damageEffect/damage · fire/physical · 25MP 1AP · dmg 100 · rng 5 · single · status:burn2
  Deals MEDIUM physical damage to a Single Enemy. Applies Burn.
- T1 **Photon Scatter** `racePhotonScatter` · damage/barrage · -/magic · 25MP 1AP · dmg 80 · rng 0 · self-aoe r2 · 
  Deals WEAK magic damage to All Enemies around the caster (AOE).
- T2 **Gravity Boots** `raceGravityBoots` · movement/teleport · - · 50MP 1AP · dmg - · rng 3 · single · teleportDistance:3
  Activate anti-gravity boots to reposition up to 3 tiles. Far out.
- T2 **Stun Ray** `raceStunRay` · damageEffect/damage · lightning/magic · 50MP 1AP CD2 · dmg 100 · rng 4 · single · status:stun1
  Deals MEDIUM magic damage to a Single Enemy. Applies Stun.
- T3 **Plasma Whip** `racePlasmaWhip` · damageEffect/line · fire/physical · 75MP 1AP · dmg 125 · rng 3 · line w1 · status:burn2
  The whip cracks down the lane. Deals MEDIUM physical damage to All Enemies in a line up to 3 tiles long and sets them alight. It reaches further than it should and burns where it lands.
- T3 **Plasma Whip** `raceLavaLamp` · damageEffect/line · fire/physical · 75MP 1AP · dmg 125 · rng 3 · line w1 · status:burn2
  The whip cracks down the lane. Deals MEDIUM physical damage to All Enemies in a line up to 3 tiles long and sets them alight. It reaches further than it should and burns where it lands.
- T3 **Shrink Ray** `sharedShrinkRay` · effect/debuff · metal · 75MP 1AP · dmg - · rng 4 · single · status:minimize3
  Weakens a Single Enemy. Applies Minimized.
- T4 **Disintegrator** `raceDisintegrator` · damage/damage · lightning/physical · 100MP 1AP · dmg 180 · rng 4 · single · finisher:stun,minimize×1.5
  There is no body to recover. Deals HEAVY physical damage to a Single Enemy. Deals bonus damage to Stunned or Minimized targets.

## 🚫 Ancient Knowledge `ancientknowledge` · kind discipline · 5 spells (T1 1 / T2 1 / T3 2 / T4 1)
desc: 
races (7): annunaki, djinn, anubis, atlantean, golem, occulus, professor

- T1 **Sacred Geometry** `raceSacredGeometry` · terrain/terrainCreate · arcane/magic · 25MP 1AP · dmg 0 · rng 3 · tiles3 · terrainType:crystal
  Sing 3 crystal tiles into being in a line. Crystal terrain boosts DEF and blocks ranged. The all-seeing eye draws the pattern.
- T2 **Pyramid Protocol** `raceZigguratProtocol` · damage/terrainCreate · earth/physical · 50MP 1AP · dmg 60 · rng 3 · tiles3 · terrainType:mountain monument:{"kind":"ziggurat_block"} terrainDeform:{"centerDelta":2,"edgeDelta":0}
  Three stepped ziggurat blocks rise in a line — carved sandstone two tiles high that blocks the way and the sight (pick the orientation). Enemies on the targeted tiles take damage.
- T3 **Ancient Magic** `raceAncientMagic` · damageEffect/damage · -/magic · 75MP 1AP · dmg 135 · rng 4 · single · status:silence1
  Words older than the pyramids. Deals MEDIUM magic damage to a Single Enemy and Silences them for a round.
- T3 **Sandstone Tomb** `raceSandstoneTomb` · damageEffect/damage · earth/magic · 75MP 1AP · dmg 125 · rng 4 · single · status:root2
  The sand closes over them, and the sand remembers. Deals MEDIUM magic damage to a Single Enemy and Roots them for 2 rounds.
- T4 **Weigh the Heart** `raceWeighTheHeart` · damage/damage · -/magic · 100MP 1AP · dmg 160 · rng 4 · single · 
  The feather against the heart. Deals HEAVY magic damage to a Single Enemy — ×1.5 if the target is under half HP.

## 🦮 Animal Handling `animalhandling` · kind discipline · 4 spells (T1 1 / T2 1 / T3 1 / T4 1)
desc: 
races (1): ringmaster

- T1 **Hawk** `raceHawk` · deploy/summonUnit · nature · 25MP 1AP · dmg - · rng 1 · single · maxActivePerCaster:1 summonDef:{"key":"hawk","name":"Hawk","move":6,"dmg":35,"hits":2,"reveals":2}
  Two fingers on the glove. At the end of every round it dives 6 tiles at the nearest enemy for 35; anything hidden within 2 tiles of it is spotted. Two hits to bring it down.
- T2 **Wolf Pack** `raceWolfPack` · deploy/summonUnit · nature · 50MP 1AP · dmg - · rng 1 · single · maxActivePerCaster:2 summonDef:{"key":"wolf","name":"Wolf","move":4,"dmg":45,"hits":2}
  Never one. At the end of every round each wolf runs 4 tiles at the nearest enemy and bites for 45. Two per handler. Calls a Wolf to an adjacent tile; two hits to put one down.
- T3 **Crack the Whip** `raceCrackTheWhip` · damageEffect/damage · -/magic · 75MP 1AP · dmg 125 · rng 2 · single · status:feared1
  The whip cracks — or the spirit roars — and they run. Deals MEDIUM magic damage to a Single Enemy and Fears them for a round: on its next activation it can only flee.
- T4 **Elephant** `raceElephant` · deploy/summonUnit · nature · 100MP 1AP · dmg - · rng 1 · single · maxActivePerCaster:1 summonDef:{"key":"elephant","name":"Elephant","move":3,"dmg":110,"hits":6}
  The big top's biggest act. Walks 3, hits for 110, takes six hits to put down. One per handler. Calls an Elephant to an adjacent tile; at the end of every round it walks toward the nearest enemy and strikes.

## 🦖 Apex Predator `apexpredator` · kind discipline · 6 spells (T1 1 / T2 3 / T3 1 / T4 1)
desc: Stampedes, roars and the jaw at the top of the food chain.
races (3): werewolf, dinosaur, sharkman

- T1 **Tail Whip** `raceDinoTailWhip` · damage/damage · -/physical · 25MP 1AP · dmg 100 · rng 1 · single · pushDistance:2
  A spinning tail strike. Deals MEDIUM physical damage to a Single Enemy. Knocks the target back 2 tiles.
- T2 **Apex Roar** `raceApexRoar` · effect/warCry · sonic · 50MP 1AP · dmg - · rng 0 · aoe r2 aura r2 · stage:atk+1
  Empowers All Allies nearby. Raises ATK by 1 stage.
- T2 **Death Roll** `raceDeathRoll` · damageEffect/damage · -/physical · 50MP 1AP · dmg 100 · rng 1 · single · status:root2
  Clamp and spin. MEDIUM physical damage, and the prey is not going anywhere. Roots a Single Enemy for 2 rounds.
- T2 **Pack Tactics** `passivePackTactics` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  +15% damage against a target standing next to another ally.
- T3 **Stampede** `raceApexCharge` · damageEffect/dash · -/physical · 75MP 2AP · dmg 130 · rng 3 · single · status:stagger1 dashDamage:50
  Stampedes through the battlefield and ends up behind the target. Deals MEDIUM physical damage to the target, tramples every enemy on the path for WEAK damage, and Staggers everything it hits.
- T4 **Jurassic Jaw** `raceJurassicJaw` · damage/damage · -/physical · 100MP 1AP · dmg 160 · rng 1 · single · finisher:stagger×1.5 ignoreArmor
  Deals HEAVY physical damage to a Single Enemy. Ignores DEF. Deals bonus damage to Staggered targets. A kill heals 25% max HP and refunds 1 AP.

## 🕷️🕸️ Arachnid Powers `arachnid` · kind discipline · 4 spells (T1 1 / T2 1 / T3 1 / T4 1)
desc: 
races (1): voidweaver

- T1 **Web Shoot** `raceWebLaunch` · damageEffect/damage · arcane/magic · 25MP 1AP · dmg 80 · rng 4 · single · status:root1
  A thread of void-silk. Deals WEAK arcane damage to a Single Enemy and Roots them for a round.
- T2 **Web Snare** `raceWebSnare` · damageEffect/aoe · -/magic · 50MP 1AP · dmg 100 · rng 4 · aoe r1 · status:root1
  Deals MEDIUM magic damage to All Enemies in an AOE. Applies Rooted.
- T3 **Dimensional Web** `raceDimensionalWeb` · effect/zoneDebuff · - · 75MP 1AP · dmg - · rng 4 · aoe r1 · status:root1 zoneDuration:2
  Weave a web between dimensions over a 3×3 for 2 rounds. Enemies standing in it are Rooted. Whatever stands in it cannot leave.
- T4 **Cocoon** `raceCocoon` · damageEffect/damage · arcane/magic · 100MP 1AP · dmg 170 · rng 4 · single · status:silence1 finisher:root×1.5
  The silk closes over the mouth first. HEAVY arcane damage; a Rooted target is wrapped tight and takes half again. Silences a Single Enemy for a round.

## 🌀 Arcane Magic `arcane` · kind discipline · 6 spells (T1 2 / T2 2 / T3 1 / T4 1)
desc: Raw magic, warps and runes.
races (3): wizard, djinn, atlantean

- T1 **Arcane Sigil** `raceArcaneBlast` · damage/cross · arcane/magic · 25MP 1AP · dmg 80 · rng 4 · cross r2 · 
  Deals WEAK magic damage to All Enemies in an X-shaped AOE.
- T1 **Mana Font** `passiveManaFont` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  +10 MP at the end of every round.
- T2 **Spellsteal** `raceSpellsteal` · effect/debuff · arcane · 50MP 1AP CD3 · dmg - · rng 4 · single · stealSpell
  Reach into an enemy's mind and rip out a spell. Steal one of the target's spells — they lose it, you learn it.
- T2 **Wish Granted** `raceWishGranted` · effect/buff · arcane · 50MP 1AP · dmg - · rng 3 · single · stage:atk+1,int+1 cleanse:2
  Your wish is granted. Raises a Single Ally's ATK and M ATK by 1 stage and cleanses 2 debuffs.
- T3 **Polymorph** `racePolymorph` · effect/debuff · arcane · 75MP 1AP CD3 · dmg - · rng 4 · single · status:silence2 stage:atk-1
  Something small and harmless. Ribbit. The target is Silenced for 2 rounds and its ATK drops by 1 stage.
- T4 **Annihilation** `raceAnnihilation` · damage/damage · arcane/magic · 100MP 1AP CD2 · dmg 180 · rng 4 · single · 
  Unmake it. Every ward, every blessing, every stage they stacked — gone — and then HEAVY magic damage to what is left. Strips a Single Enemy's buffs, raised stat stages and shield before the hit. Cooldown: 2 rounds.

## 🏹 Archery `archery` · kind discipline · 5 spells (T1 1 / T2 1 / T3 2 / T4 1)
desc: 
races (1): robinhood

- T1 **Fire Arrow** `raceFireArrow` · damageEffect/damage · fire/physical · 25MP 1AP · dmg 80 · rng 5 · single · status:burn2
  Deals WEAK physical damage to a Single Enemy. Applies Burn.
- T2 **Bomb Arrow** `raceBombArrow` · damageEffect/aoe · fire/physical · 50MP 1AP · dmg 90 · rng 4 · aoe r1 · status:burn1
  An arrow with a powder charge lashed to the head. Deals WEAK physical damage to All Enemies in a 3×3 and sets them alight for a round.
- T3 **Piercing Arrow** `racePiercingArrow` · damageEffect/linePush · metal/physical · 75MP 1AP · dmg 120 · rng 5 · line w1 · pushDistance:2 collisionBonus:60
  A bodkin that carries its victim with it. Deals MEDIUM physical damage to All Enemies in a line and knocks them back 2 tiles; anyone pinned against a wall or another unit takes 60 more and both are Rooted for 1 turn.
- T3 **Splitting Arrow** `raceSplittingArrow` · damage/ricochet · -/physical · 75MP 1AP · dmg 125 · rng 4 · single · finisher:burn×1.5
  Deals MEDIUM physical damage to a Single Enemy, then bounces to nearby enemies. Deals bonus damage to targets with Burn.
- T4 **Arrow Volley** `raceArrowRain` · damage/aoe · -/physical · 100MP 1AP · dmg 160 · rng 6 · aoe r1 · ignoresLineOfSight
  Loose high and let gravity do the rest. HEAVY physical damage to every enemy in a 3×3 up to 6 tiles away. The arrows come down over any wall.

## 💻🧠 Artificial Intelligence `artificialintelligence` · kind discipline · 4 spells (T1 1 / T2 1 / T3 1 / T4 1)
desc: 
races (3): ai, glitch, droid

- T1 **Predictive Model** `racePredictiveModel` · effect/debuff · - · 25MP 1AP · dmg - · rng 4 · single · status:marked3 stage:mdef-1
  Weakens a Single Enemy. Applies Marked.
- T2 **Overcalculate** `raceOvercalculate` · effect/buff · - · 50MP 1AP · dmg - · rng 0 · single · stage:int+1,mdef+1
  Run the numbers again. Then again. Raises the caster's M ATK and M DEF by 1 stage.
- T3 **Recursive Loop** `raceRecursiveLoop` · damage/damage · -/magic · 75MP 1AP · dmg 125 · rng 4 · single · finisher:marked×1.5
  Deals MEDIUM magic damage to a Single Enemy. Deals bonus damage to Marked targets.
- T4 **Singularity** `raceSingularity` · damage/aoePull · -/magic · 100MP 2AP CD2 · dmg 160 · rng 4 · aoe r2 · pullToCenter
  Deals HEAVY magic damage to All Enemies in an AOE and drags them toward the center. The model converged. You were in the gradient.

## 😴 Astral Projection `astralprojection` · kind discipline · 3 spells (T1 1 / T2 1 / T3 1 / T4 0)
desc: 
races (4): shaman, telepath, fortune teller, watcher

- T1 **Astral Barrier** `raceAstralBarrier` · effect/aoeShield · - · 25MP 1AP · dmg - · rng 0 · aoe r1 · shieldHp:90
  Grants a damage-absorbing shield to All Allies in an AOE.
- T2 **Spirit Walk** `raceSpiritWalk` · movement/escape · psychic · 50MP 1AP CD2 · dmg - · rng 0 · single · status:invisible1 teleportDistance:4
  Enter the spirit world briefly. Teleport up to 4 tiles and become invisible for 1 turn.
- T3 **Spirit Guide** `raceSpiritGuide` · effect/buff · psychic · 75MP 1AP CD2 · dmg - · rng 4 · single · status:invisible1,levitating2
  Take my hand. They cannot see what is not here. An ally is Invisible for a round and Levitating for 2 rounds.

## 🏃 Athleticism `athleticism` · kind discipline · 7 spells (T1 2 / T2 2 / T3 1 / T4 2)
desc: 
races (14): homosapien, swordfighter, bigfoot, catgirl, superhero, juggernaut, ki fighter, quarterback, symbiote, bunny girl, sidekick, rabbit, luchador, firefighter

- T1 **Pathfinder** `passivePathfinder` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Dash and leap spells reach 1 tile farther. Dash path damage +30%.
- T1 **Sprint** `raceSprint` · movement/dash · wind/physical · 25MP 1AP · dmg 0 · rng 3 · single · 
  Go. Runs up to 3 tiles in a straight line.
- T2 **Nimble Dodge** `raceNimbleDodge` · movement/escape · wind · 50MP 1AP CD2 · dmg - · rng 0 · single · status:invisible1 teleportDistance:3
  Gracefully dash 2 tiles away and vanish for 1 turn. Perfect evasive maneuver. Needs 3 rounds between dodges.
- T2 **Shake It Off** `raceShakeItOff` · heal/selfHeal · - · 50MP 1AP CD2 · dmg - · rng 0 · single · selfHealPct:0.25 cleanse:2
  Walk it off. Restores 25% of the caster's max HP and cleanses 2 debuffs. Cooldown: 2 rounds.
- T3 **Vault** `raceVault` · damage/leapStrike · -/physical · 75MP 1AP · dmg 125 · rng 3 · single · dmgPerLevel:15
  Over, not through. Leaps over walls and bodies onto a Single Enemy within 3 tiles for MEDIUM physical damage.
- T4 **Rampage** `rampage` · damageEffect/dash · -/physical · 100MP 1AP · dmg 170 · rng 4 · single · status:stagger1 dashDamage:64
  Charges through the battlefield. Deals HEAVY physical damage to the target and hits every enemy on the path. Applies Stagger.
- T4 **Rampage** `raceRampage` · damageEffect/dash · -/physical · 100MP 1AP · dmg 170 · rng 4 · single · status:stagger1 dashDamage:64
  Charges through the battlefield. Deals HEAVY physical damage to the target and hits every enemy on the path. Applies Stagger.

## 🦏 Beast Abilties `beastabilities` · kind discipline · 5 spells (T1 3 / T2 1 / T3 1 / T4 0)
desc: 
races (9): werewolf, vampire, dinosaur, dragon, loch ness monster, king kong, minotaur, deep sea fish, sharkman

- T1 **Bite** `raceBite` · damage/lifeDrain · blood/physical · 25MP 1AP · dmg 100 · rng 1 · single · drainPct:0.3
  Deals MEDIUM physical damage to a Single Enemy. Heals the caster for part of the damage dealt.
- T1 **Keen Nose** `passiveKeenNose` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Invisible enemies within 2 tiles are revealed at the end of every round. +14 AWR.
- T1 **Pounce** `racePounce` · damage/damage · nature/physical · 25MP 1AP · dmg 100 · rng 3 · single · 
  Deals MEDIUM physical damage to a Single Enemy.
- T2 **Maul** `raceMaul` · damageEffect/damage · -/physical · 50MP 1AP · dmg 110 · rng 1 · single · status:grievous2
  Jaws lock and shake. MEDIUM physical damage and a wound that will not close. A Single Enemy takes a Grievous Wound for 2 rounds — healing on them is halved.
- T3 **Feral Dive** `raceFeralDive` · damage/leapStrike · nature/physical · 75MP 1AP · dmg 125 · rng 3 · single · dmgPerLevel:20
  Leaps to a Single Enemy, dealing MEDIUM physical damage.

## 📖 Bible Study `biblestudy` · kind discipline · 6 spells (T1 2 / T2 1 / T3 2 / T4 1)
desc: 
races (3): priest, seraphim, nun

- T1 **Absolution** `raceAbsolution` · heal/heal · - · 25MP 1AP · dmg - · rng 3 · single · healAmt:80 cleanse:99
  Restores a MEDIUM amount of HP to a Single Ally and cleanses every debuff.
- T1 **Blessing** `raceBlessing` · effect/buff · light · 25MP 1AP · dmg - · rng 3 · single · status:blessed3
  Bless a Single Ally for 3 rounds: +1 DEF stage, +1 M DEF stage, and 40 HP restored at the end of every round.
- T2 **Sermon** `raceCultSermon` · effect/warCry · light · 50MP 1AP · dmg - · rng 0 · aura r2 · team:blessed2
  Gather round. Allies within 2 tiles are Blessed for 2 rounds. They have heard the word.
- T3 **Exorcism** `exorcism` · damage/damage · light/magic · 75MP 1AP · dmg 135 · rng 3 · single · finisher:contract,hexed×1.5
  Deals MEDIUM magic damage to a Single Enemy. Deals bonus damage to Contracted or Hexed targets — the rite burns the curse out of them. Deals bonus damage to Unholy targets.
- T3 **Prayer** `racePrayer` · effect/shield · light · 75MP 1AP · dmg - · rng 3 · single · status:blessed2 shield:200
  Shields a Single Ally for 200 HP and Blesses them for 2 rounds.
- T4 **Hallelujah** `raceHallelujah` · heal/healAll · light · 100MP 2AP · dmg - · rng 0 · single · healAmt:180 cleanse:2
  The choir answers. Restores a LARGE amount of HP to All Allies and cleanses 2 debuffs from each.

## 🪄 Black Magic `blackmagic` · kind discipline · 5 spells (T1 1 / T2 2 / T3 1 / T4 1)
desc: 
races (5): skinwalker, goatman, necromancer, cult leader, krampus

- T1 **Death Pact** `raceDeathPact` · effect/buff · - · 25MP 1AP CD3 · dmg - · rng 0 · single · stage:atk+2 selfDamagePct:0.25
  Sign here. Raises the caster's ATK by 2 stages. Costs 25% of max HP (never fatal).
- T2 **Sacrifice** `raceSacrifice` · utility/transfer · nature · 50MP 1AP · dmg - · rng 3 · single · 
  The spirits trade flesh for flesh: pick an ally to give and an ally to receive (both within 3 tiles). The giver loses 30% of max HP (never fatal); the receiver heals for 150% of that, scaled by M ATK.
- T2 **Voodoo** `raceVoodoo` · effect/link · shadow · 50MP 1AP · dmg - · rng 3 · single · status:voodoo3
  Ties a doll of a Single Enemy to one of your allies (pick the enemy, then the ally). For 3 rounds, whenever that ally takes damage the enemy takes half of it. Bad Trip hits Voodoo targets harder.
- T3 **Needle Work** `raceNeedleWork` · damage/damage · shadow/magic · 75MP 1AP · dmg 125 · rng 4 · single · finisher:voodoo×1.5 ignoreArmor
  Push the pin in. Deals MEDIUM magic damage to a Single Enemy that ignores M DEF; a Voodoo-bound target takes it worse.
- T4 **Baphomet's Rite** `raceBaphometsRite` · damage/aoe · fire/magic · 100MP 1AP · dmg 160 · rng 4 · aoe r1 · finisher:stagger,voodoo×1.5 selfDamagePct:0.15
  Offer your own blood and speak the name. Deals HEAVY magic damage to All Enemies in an AOE. Costs a portion of your HP — the goat always collects. Deals bonus damage to Staggered targets.

## 🩸 Blood Magic `blood` · kind discipline · 6 spells (T1 2 / T2 2 / T3 1 / T4 1)
desc: Drain, sacrifice and frenzy.
races (5): demon, demon prince, demon princess, goatman, vampire

- T1 **Blood Ritual** `raceBloodRitual` · effect/buff · blood · 25MP 1AP CD2 · dmg - · rng 0 · single · stage:atk+1 selfDamagePct:0.1
  Empowers the caster. Raises ATK by 1 stage. Costs a portion of your HP.
- T1 **Sanguine** `passiveSanguine` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Heals 6% of max HP at the end of any round in which it dealt damage.
- T2 **Hemorrhage** `raceHemorrhage` · damageEffect/damage · blood/magic · 50MP 1AP · dmg 100 · rng 3 · single · status:grievous2
  Open the vein. MEDIUM magic damage and a wound that will not close — healing on them is halved. The Grievous Wound lasts 2 rounds.
- T2 **Summon Blood Rain** `sharedSummonBloodRain` · deploy/summonWeather · blood · 50MP 1AP · dmg - · rng 4 · single · weatherType:bloodRain
  Summons Blood Rain over 5 to 8 tiles for 3 to 5 rounds; it drifts. Each turn everyone under it is Soaked for 2 rounds and any Burn is put out. Divine units take WEAK damage each turn; Unholy units heal a little HP and MP.
- T3 **Life Sap** `lifeDrain` · damage/lifeDrain · blood · 75MP 1AP · dmg 135 · rng 3 · single · finisher:poison,grievous×1.5 drainPct:0.7
  Deals MEDIUM magic damage to a Single Enemy. Heals the caster for part of the damage dealt. Deals bonus damage to targets with Poison.
- T4 **Exsanguinate** `raceExsanguinate` · damage/lifeDrain · blood/magic · 100MP 2AP CD2 · dmg 180 · rng 3 · single · finisher:grievous×1.5 drainPct:1
  Take all of it. HEAVY magic damage to a Single Enemy and every point of it comes back to you. Deals bonus damage to targets with a Grievous Wound.

## 🦴 Bone Density `bonedensity` · kind discipline · 4 spells (T1 1 / T2 1 / T3 1 / T4 1)
desc: 
races (2): skeleton, necromancer

- T1 **Bone Toss** `raceBoneToss` · damage/damage · -/physical · 25MP 1AP · dmg 80 · rng 3 · single · ignoreArmor
  Deals WEAK physical damage to a Single Enemy. Ignores DEF.
- T2 **Reassemble** `raceReassemble` · movement/escape · - · 50MP 1AP · dmg - · rng 0 · single · selfHealPct:0.2 teleportDistance:3
  The bones come apart and put themselves back together somewhere else. Teleports up to 3 tiles and restores 20% of max HP.
- T3 **Bone Lance** `raceBoneLance` · damage/line · -/physical · 75MP 1AP · dmg 125 · rng 4 · line w1 · ignoreArmor
  A femur, thrown like a javelin, through everyone in the way. Deals MEDIUM physical damage to All Enemies in a line. Ignores DEF.
- T4 **Marrowstorm** `raceMarrowstorm` · damage/aoe · -/physical · 100MP 2AP CD2 · dmg 160 · rng 4 · aoe r2 · finisher:poison×1.5 ignoreArmor
  Deals HEAVY physical damage to All Enemies in an AOE. Ignores DEF. Deals bonus damage to targets with Poison. Cooldown: 2 rounds.

## 🏰 Camelot Powers `royalty` · kind discipline · 4 spells (T1 1 / T2 1 / T3 1 / T4 1)
desc: 
races (2): knight, king arthur

- T1 **Royal Decree** `raceRoyalDecree` · effect/warCry · - · 25MP 1AP · dmg - · rng 0 · aoe r2 · stage:atk+1
  Empowers All Allies nearby. Raises ATK by 1 stage.
- T2 **Walls of Camelot** `raceShieldWall` · damage/terrainCreate · earth/physical · 50MP 1AP · dmg 60 · rng 3 · tiles3 · terrainType:castle_wall monument:{"kind":"castle_wall"} terrainDeform:{"centerDelta":2,"edgeDelta":0}
  Raises three segments of Camelot's own curtain wall in a line — crenellated stone two tiles high that blocks the way and the sight (pick the orientation). Enemies on the targeted tiles take damage.
- T3 **Knights of Round** `raceKnightsOfRound` · movement/rallyPull · - · 75MP 1AP · dmg - · rng 0 · single · 
  Convene the Round Table — every ally on the field is pulled to the King's side. Rooted knights cannot answer the call.
- T4 **Excalibur Strike** `raceExcaliburStrike` · damageEffect/damage · -/physical · 100MP 1AP · dmg 180 · rng 1 · single · status:burn2
  Deals HEAVY physical damage to a Single Enemy. Applies Burn.

## 🦑 Cephalopod Anatomy `tentacleappendages` · kind discipline · 4 spells (T1 1 / T2 2 / T3 1 / T4 0)
desc: 
races (1): kraken

- T1 **Tentacle Lash** `raceTentacleLash` · damage/pull · water/magic · 25MP 1AP · dmg 80 · rng 3 · single · pullDistance:2
  An arm from below the surface. Deals WEAK water damage to a Single Enemy and drags them 2 tiles toward you.
- T2 **Constrict** `raceConstrict` · effect/debuff · water · 50MP 1AP · dmg - · rng 2 · single · status:root2 stage:def-1
  Two arms, then four. It is not going anywhere. Roots a Single Enemy for 2 rounds and lowers its DEF by 1 stage.
- T2 **Ink Cloud** `raceInkCloud` · effect/zoneDebuff · - · 50MP 1AP · dmg - · rng 4 · aoe r1 · status:discord2 zoneDuration:2
  Spray blinding ink over a 3×3 area for 2 turns. Enemies inside are disoriented — ATK lowered by 2 stages and DEF by 1 stage for 2 turns.
- T3 **Eightfold Lash** `raceEightfoldLash` · damage/multiHit · water/magic · 75MP 1AP · dmg - · rng 2 · single · finisher:root×1.5 hitDamages:[32,32,32,32]
  All of them at once. Deals WEAK magic damage to a Single Enemy across 4 hits. Deals bonus damage to Rooted targets.

## 🧪 Chemistry `chemistry` · kind discipline · 4 spells (T1 1 / T2 1 / T3 1 / T4 1)
desc: 
races (2): mad scientist, professor

- T1 **Acid Flask** `raceAcidFlask` · damageEffect/damage · poison/magic · 25MP 1AP · dmg 100 · rng 3 · single · stage:def-1
  It eats the plate first. Deals MEDIUM magic damage to a Single Enemy and lowers its DEF by 1 stage.
- T2 **Antidote** `raceAntidote` · heal/heal · - · 50MP 1AP · dmg - · rng 3 · single · healAmt:140 cleanse:2
  Drink it before it stops fizzing. Restores a BIG amount of HP to a Single Ally and cleanses 2 debuffs.
- T3 **Chemical Concoction** `raceOvercharge` · damageEffect/aoe · poison/magic · 75MP 1AP · dmg 125 · rng 3 · aoe r1 · status:corroded2
  Hurl the beaker. Deals MEDIUM magic damage to All Enemies in a 3×3 and leaves them Corroded for 2 rounds — one status that burns AND poisons (every Burn and Poison payoff counts it).
- T4 **Chain Reaction** `raceChainReaction` · damage/aoe · fire/magic · 100MP 1AP CD2 · dmg 140 · rng 4 · aoe r2 · finisher:burn,poison×1.5
  One spark. The whole table goes. Deals HEAVY magic damage to every enemy in a 5×5 area. Deals bonus damage to targets with Burn or Poison.

## 🎅🏻 Christmas Spirit `christmasspirit` · kind discipline · 7 spells (T1 2 / T2 2 / T3 2 / T4 1)
desc: 
races (2): santa clause, krampus

- T1 **Lump of Coal** `raceLumpOfCoal` · damageEffect/damage · fire/magic · 25MP 1AP · dmg 100 · rng 4 · single · status:burn2
  Deals MEDIUM magic damage to a Single Enemy. Applies Burn.
- T1 **Spirit of Giving** `passiveSpiritOfGiving` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Adjacent allies regenerate 3% of max HP at the end of every round.
- T2 **Naughty List** `raceNaughtyList` · effect/debuff · shadow · 50MP 1AP · dmg - · rng 3 · single · status:marked3 stage:atk-1
  You know what you did. The target is on the list: Marked for 3 rounds and its ATK drops by 1 stage.
- T2 **Sleigh Dash** `raceSleighDash` · damage/dash · ice/physical · 50MP 1AP · dmg 130 · rng 4 · single · finisher:frozen×1.5 dashDamage:70
  Dashes through the battlefield, dealing WEAK physical damage to enemies along the path. Deals bonus damage to targets with Frozen.
- T3 **Milk and Cookies** `raceMilkAndCookies` · heal/healAll · - · 75MP 1AP · dmg - · rng 0 · aura r2 · healAmt:100 cleanse:1
  Left out for whoever's still standing. Every ally within 2 tiles heals a MEDIUM amount of HP and is cleansed of 1 debuff.
- T3 **White Christmas** `raceWhiteChristmas` · effect/zoneDebuff · ice · 75MP 1AP · dmg - · rng 4 · aoe r1 · status:slow1 zoneDuration:2
  A 3×3 snow squall for 2 rounds: enemies inside are Slowed every round, and the ground freezes to ice when it clears.
- T4 **Blizzard Present** `raceBlizzardPresent` · damageEffect/aoe · ice/magic · 100MP 1AP CD2 · dmg 160 · rng 4 · aoe r1 · status:frozen1 finisher:marked×1.5 leaveTerrain:ice
  Deals HEAVY magic damage to All Enemies in an AOE. Applies Frozen. Leaves ice behind. Cooldown: 2 rounds.

## 💻 Computer Hacking Skills `computerhacking` · kind discipline · 7 spells (T1 2 / T2 2 / T3 2 / T4 1)
desc: 
races (5): ai, android, ghost, glitch, droid

- T1 **Crash Loop** `raceCrashLoop` · damage/damage · -/magic · 25MP 1AP · dmg 100 · rng 3 · single · finisher:jammed×1.5
  Deals MEDIUM magic damage to a Single Enemy. Deals bonus damage to targets with Jammed.
- T1 **Field Operative** `passiveFieldOperative` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Can carry up to 2 scanners and inspects 1 tile farther.
- T2 **Memory Leak** `raceMemoryLeak` · effect/debuff · - · 50MP 1AP · dmg - · rng 3 · single · status:jammed2
  The leak never closes. A Single Enemy is Jammed for 2 rounds and loses 30 MP.
- T2 **System Analysis** `raceSystemAnalysis` · effect/debuff · - · 50MP 1AP · dmg - · rng 5 · single · status:marked2 stage:mdef-1
  Every port open, every weakness listed. Marks a Single Enemy for 2 rounds and lowers its M DEF by 1 stage.
- T3 **Blue Screen** `raceBlueScreen` · damageEffect/debuff · -/magic · 75MP 1AP CD2 · dmg 80 · rng 4 · single · status:stun1
  Fatal exception. Deals WEAK magic damage to a Single Enemy and Stuns them for a round.
- T3 **Firewall Protocol** `raceFirewallProtocol` · effect/aoeShield · - · 75MP 1AP · dmg - · rng 3 · aoe r1 · shieldHp:150
  Grants a damage-absorbing shield to All Allies in an AOE.
- T4 **System Crash** `raceSystemCrash` · damage/aoe · -/magic · 100MP 1AP CD2 · dmg 150 · rng 4 · aoe r1 · finisher:jammed×1.5
  Fatal exception. Everything running on them stops. Deals HEAVY magic damage to every enemy in a 3×3 area. Deals bonus damage to targets with Jammed, and every Jammed enemy hit is also Staggered 1.

## 🐸 Conspiracy Knowledge `conspiracyknowledge` · kind discipline · 4 spells (T1 1 / T2 1 / T3 1 / T4 1)
desc: 
races (2): reptilian, conspiracy theorist

- T1 **Tin Foil Hat** `raceTinFoilHat` · effect/warCry · metal · 25MP 1AP · dmg - · rng 0 · aura r2 · stage:mdef+1
  Hats on, everybody. Every ally within 2 tiles gains +1 M DEF stage.
- T2 **Chemtrails** `raceChemtrails` · damageEffect/line · poison/magic · 50MP 1AP · dmg 100 · rng 4 · line w1 · status:poison2 leaveTerrain:poison
  Deals MEDIUM magic damage to All Enemies in a line. Applies Poison. Leaves poison behind.
- T3 **Fluoride Water** `raceFluorideWater` · damageEffect/aoe · water/magic · 75MP 1AP · dmg 105 · rng 3 · aoe r1 · status:silence2
  Deals MEDIUM magic damage to All Enemies in an AOE. Applies Silence.
- T4 **Flat Earth** `raceTruthBomb` · damage/damage · -/magic · 100MP 1AP · dmg 180 · rng 4 · single · finisher:silence,poison×1.5 terrainDeform:{"flatten":true,"radius":1}
  Deals HEAVY magic damage to a Single Enemy. Deals bonus damage to Silenced or Poisoned targets. The ground around them is flattened to its lowest point — it was never round.

## 🪐 Cosmic Abilities `cosmic` · kind discipline · 12 spells (T1 3 / T2 2 / T3 6 / T4 1)
desc: 
races (6): orb of light, annunaki, cosmic wraith, ice queen, watcher, astronaut

- T1 **Entropic Beam** `raceEntropicBeam` · damage/line · -/magic · 25MP 1AP · dmg 90 · rng 4 · line w1 · finisher:slow×1.5
  Deals WEAK magic damage to All Enemies in a line. Lowers DEF by 1 stage. Deals bonus damage to targets with Slow.
- T1 **Gravity Well** `raceGravityWell` · damageEffect/aoePull · arcane/magic · 25MP 1AP · dmg 80 · rng 4 · aoe r1 · status:slow1 groundsFlyers pullToCenter
  Deals WEAK magic damage to All Enemies in an AOE and pulls them toward the center. Applies Slow. Knocks flying enemies out of the sky.
- T1 **Phase Walk** `racePhaseWalk` · movement/teleport · - · 25MP 1AP · dmg - · rng 3 · single · teleportDistance:3
  Phase through reality up to 3 tiles. Repositioning tool.
- T2 **Cosmic Sight** `raceCosmicSight` · utility/scan · - · 50MP 1AP · dmg - · rng 4 · single · 
  See all. Reveal a massive area through fog within 4 tiles. Nothing is hidden from The Watcher.
- T2 **Event Horizon** `passiveEventHorizon` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Its Cosmic pull spells (Gravity Well, Black Hole) also Stagger every enemy they catch.
- T3 **Cosmic Slam** `raceCosmicSlam` · damageEffect/aoe · -/physical · 75MP 1AP · dmg 125 · rng 0 · aoe r1 · status:stagger1 terrainDeform:{"centerDelta":-1,"edgeDelta":0}
  Deals MEDIUM physical damage to All Enemies in an AOE. Applies Stagger.
- T3 **Gravity Crush** `sharedGravityCrush` · utility/zoneDebuff · arcane · 75MP 1AP · dmg - · rng 4 · aoe r1 · zoneDuration:3
  Crush a 3×3 area under triple gravity for 3 rounds. Inside the field NOBODY (yours included) can jump, flyers are slammed from the sky and stay grounded, and falls hit 3× harder. Cast it under a ledge and start shoving.
- T3 **Heat Death** `raceHeatDeath` · damageEffect/aoe · -/magic · 75MP 1AP · dmg - · rng 4 · aoe r1 · status:slow1 zoneDuration:2
  Impose entropy on a 3×3 area for 2 rounds. Enemies inside are Slowed when it lands, and every enemy inside at the end of each round takes WEAK magic damage.
- T3 **Nebula** `sharedNebula` · damageEffect/aoe · light/magic · 75MP 1AP CD2 · dmg 125 · rng 4 · aoe r1 · status:burn2
  Birth a star and let it burn. Deals MEDIUM magic damage to All Enemies in a 3×3; everything the starfire touches keeps burning.
- T3 **Star Decree** `raceStarDecree` · damage/delayed · light/magic · 75MP 1AP · dmg 135 · rng 3 · aoe r1 · finisher:slow×1.5 delayTurns:1
  Marks a zone. After 1 turn, deals MEDIUM magic damage to All Enemies inside (AOE). Deals bonus damage to Slowed targets.
- T3 **Supernova** `raceSupernova` · damageEffect/aoe · light/magic · 75MP 1AP · dmg 135 · rng 0 · self-aoe r2 · stage:def-1
  The orb goes supernova. Deals MEDIUM magic damage to All Enemies around the caster (AOE) and sears their armor, lowering DEF by 1 stage.
- T4 **Black Hole** `sharedBlackHole` · damageEffect/aoePull · shadow/magic · 100MP 2AP CD2 · dmg 160 · rng 4 · aoe r2 · status:slow1 groundsFlyers pullToCenter
  Collapse a singularity: everything in a 5×5 event horizon is dragged screaming toward the center and crushed for HEAVY magic damage. Applies Slow. Knocks flying enemies out of the sky. Cooldown: 2 rounds.

## 🤠 Cowboy Skills `cowboyskills` · kind discipline · 4 spells (T1 1 / T2 1 / T3 1 / T4 1)
desc: 
races (2): cowboy, sheriff

- T1 **Fan the Hammer** `raceFanTheHammer` · damage/barrage · metal/physical · 25MP 1AP · dmg 80 · rng 0 · self-aoe r1 · 
  Six shots from the hip. Deals WEAK physical damage to every enemy next to you.
- T2 **Dynamite** `raceDynamite` · damageEffect/aoe · fire/physical · 50MP 1AP · dmg 110 · rng 3 · aoe r1 · status:stagger1
  Light the fuse and lob a stick of dynamite up to 3 tiles. Deals MEDIUM physical damage to All Enemies in a 3×3 blast and Staggers them.
- T3 **Slap Leather** `raceSlapLeather` · damageEffect/damage · metal/physical · 75MP 1AP · dmg 125 · rng 4 · single · status:stagger1
  Hand hovers, then it doesn't. MEDIUM physical damage to a Single Enemy — they flinch and lose an AP. Hits harder on anyone who already made their move.
- T4 **High Noon** `raceHighNoon` · damage/damage · metal/physical · 100MP 1AP · dmg 180 · rng 6 · single · finisher:stagger,tethered×1.5 ignoresLineOfSight
  One bullet, fired at noon, bounces off every wall on the map before it finds them. HEAVY physical damage to a Single Enemy through any cover. Always a critical hit. Deals bonus damage to Staggered or Roped targets.

## 📷 Cryptid Abilities `cryptid` · kind discipline · 4 spells (T1 1 / T2 1 / T3 1 / T4 1)
desc: 
races (7): grey, bigfoot, skinwalker, mothman, kraken, loch ness monster, yeti

- T1 **Dread Aura** `raceDreadAura` · effect/barrage · - · 25MP 1AP · dmg - · rng 0 · self-aoe r2 · status:discord2
  Everything nearby feels it watching. All enemies within 2 tiles are Discorded for 2 rounds.
- T2 **Cryptid Vanish** `raceCryptidVanish` · movement/escape · - · 50MP 1AP CD2 · dmg - · rng 0 · single · status:invisible2 teleportDistance:2
  Was it real? The photo's blurry... Teleport 2 tiles, invisible 2 turns.
- T3 **Eyewitness** `raceEyewitness` · effect/aoe · - · 75MP 1AP · dmg - · rng 4 · aoe r1 · status:feared1,blind2
  They will describe it badly for the rest of their lives. Every enemy in a 3×3 within 4 tiles is Feared for a round and Blinded for 2 rounds.
- T4 **Out of the Dark** `raceOutOfTheDark` · damage/damage · -/physical · 100MP 1AP · dmg 180 · rng 3 · single · finisher:feared×1.5
  One clear look. That was the last photo on the roll. Charges up to 3 tiles and deals HEAVY physical damage to a Single Enemy. Deals bonus damage to Feared targets.

## ✌️ Cult of Personality `cult` · kind discipline · 4 spells (T1 1 / T2 1 / T3 1 / T4 1)
desc: 
races (2): politician, cult leader

- T1 **Tithe** `raceCultTithe` · damage/steal · shadow/magic · 25MP 1AP · dmg 50 · rng 2 · single · 
  Everything you own belongs to the family. Deals LIGHT magic damage to a Single Enemy within 2 tiles and takes an item off them.
- T2 **The Kool-Aid** `raceCultKoolAid` · effect/debuff · shadow · 50MP 1AP CD2 · dmg - · rng 3 · single · status:charm2
  Drink. A Single Enemy within 3 tiles is Charmed for 2 rounds — they will not raise a hand to the family.
- T3 **Indoctrinate** `raceCultIndoctrinate` · effect/possess · shadow · 75MP 1AP CD3 · dmg - · rng 2 · single · status:possessed2 finisher:charm×2
  They were always going to join. A Single Enemy within 2 tiles is YOURS for its next activation — move it, attack with it, cast with it. Applies Possessed. Bosses cannot be indoctrinated.
- T4 **The Gathering** `raceCultGathering` · deploy/summonUnit · shadow · 100MP 1AP · dmg - · rng 1 · single · maxActivePerCaster:2 summonDef:{"key":"cultist","name":"Cult Member","move":3,"dmg":55,"hits":2}
  The candles are lit and one of the family answers. A cult member steps out of the dark onto an adjacent tile: at the end of every round it walks 3 tiles toward the nearest enemy and strikes for 55. Two hits to put it down. Two members per leader.

## 🚪 D.O.O.R. Gun `doors` · kind signature · UNIQUE to door agent · 9 spells (T1 1 / T2 4 / T3 3 / T4 1)
desc: The Door Agent's destinations — the standing doors on the wheel.
races (1): door agent

- T1 **Shut Door** `gunShutDoor` · deploy/doorDeploy · physical · 25MP 1AP · dmg - · rng 4 · single · 
  Just a door. Shoot it onto an empty tile within 4. It lands shut and goes nowhere: nobody walks through it and nobody sees past it. Cast it on your own Shut Door to open or shut it (no MP). 3 hits to break; two standing doors per player.
- T2 **Archers' Door** `gunArchersDoor` · deploy/doorDeploy · physical/physical · 50MP 1AP · dmg - · rng 4 · single · 
  A door to Camelot's walls. Shoot it onto an empty tile within 4: Robin Hood's archers loose a volley of 3 arrows (WEAK physical each) at the nearest enemy within 4 they can see — when it lands, again at the end of every round, and at once on an enemy who steps or is knocked into range. It moves nobody: it punishes the body you pinned. 3 hits to break; two standing doors per player.
- T2 **Frost Door** `gunFrostDoor` · deploy/doorDeploy · ice/magic · 50MP 1AP · dmg - · rng 4 · single · 
  A door to the North Pole. Shoot it onto an empty tile within 4 and turn it to face a lane: 4 tiles of it turn to ICE for 3 rounds (water freezes into a walkable sheet, fire goes out), and every enemy in the lane takes a cold blast (WEAK) and Slow 1. A body shoved onto ice keeps sliding the way it was going, so a push along the lane runs its whole length. It freezes when it lands and again at the end of every round. 3 hits to break; two standing doors per player.
- T2 **Gust Door** `gunGustDoor` · deploy/doorDeploy · wind · 50MP 1AP · dmg - · rng 4 · single · 
  A door to the top of Mt Shasta. Shoot it onto an empty tile within 4 and turn it to face a lane: the mountain wind blows 4 tiles out of it for as long as it stands. EVERY body in that lane (yours too) is blown to the end of it and one tile past, walls, bodies and hazards as ever: when it lands, and whenever anyone walks, is knocked or teleports into the stream (a walk stops at the first windy tile). Only colossal bodies (a kaiju, a giant) stand in it unmoved. 3 hits to break; two standing doors per player.
- T2 **Light Door** `gunLightDoor` · deploy/doorDeploy · light/magic · 50MP 1AP · dmg - · rng 4 · single · 
  A door to the pearly gate. Shoot it onto an empty tile within 4 and turn it to face a lane: a shaft of Heaven's light shines 4 tiles out of it. Your side in the lane heals (MODERATE) and is cleansed of every debuff; enemies in it take a holy blast (MODERATE) and Blind 1. It shines when it lands, again at the end of every round, and at once on anyone who steps into it. 3 hits to break; two standing doors per player.
- T3 **Hell Door** `gunHellDoor` · deploy/doorDeploy · fire/magic · 75MP 1AP · dmg - · rng 4 · single · 
  A door to the pit of Hell. Shoot it onto an empty tile within 4 and turn it to face a lane: a tongue of lava licks 3 tiles out of it. The lane's ground BURNS for 2 rounds (anyone knocked or walking onto it burns, as on any fire), and every enemy in the lane takes a fire blast (MODERATE) and Burn 2. It melts a Frost Door's ice. It blasts when it lands and again at the end of every round. 3 hits to break; two standing doors per player.
- T3 **Laser Door** `gunLaserDoor` · deploy/doorDeploy · lightning/magic · 75MP 1AP · dmg - · rng 4 · single · 
  A door to the neon city. Shoot it onto an empty tile within 4 and turn it to face a line: a red beam runs straight out of it until a wall or a shut door stops it. A PRISM on its path turns it a quarter turn (toward the side with more enemies), up to 3 turns. Every enemy on the beam takes a tech blast (STRONG); your own side is never hit. It fires when it lands, again at the end of every round, and on any enemy who steps onto or walks across the beam. 3 hits to break; two standing doors per player.
- T3 **Maw Door** `gunMawDoor` · deploy/doorDeploy · psychic/magic · 75MP 1AP · dmg - · rng 4 · single · 
  A door to the Singularity. Shoot it onto an empty tile within 4: the void behind it DRAWS every enemy within 2 one tile toward it (over anything in the way: a bomb, a trap, a capture door). A body pulled onto the door itself is bitten (MODERATE alien damage + Stagger 1) and spat out of the back. It pulls when it lands, again at the end of every round, and at once on an enemy who steps into its reach. 3 hits to break; two standing doors per player.
- T4 **Twin Doors** `gunTwinDoors` · deploy/deployPair · psychic · 100MP 1AP CD3 · dmg - · rng 4 · single · maxActivePerCaster:1
  Whatever goes in one comes out the other. Pick two empty tiles within 4: a linked pair of doors opens on them. Anyone who walks onto one, or is knocked, blown or pulled into it, comes out of the other. One pair per agent. Cooldown: 3 rounds.

## 🚪 D.O.O.R. Training `door` · kind discipline · 6 spells (T1 1 / T2 3 / T3 1 / T4 1)
desc: 
races (1): door agent

- T1 **Swing Door** `raceSwingDoor` · damageEffect/damage · psychic/physical · 25MP 1AP · dmg 40 · rng 3 · single · status:stagger1 pushDistance:2
  Mind the door. Shoot a door onto an EMPTY tile beside an enemy within 3 — the hinge — and it swings through them: WEAK physical damage, Staggered, and they are pushed 2 tiles straight away from the hinge. Pick the hinge on the far side and you pick where they land.
- T2 **Air Mail** `raceAirMail` · damageEffect/damage · psychic/physical · 50MP 1AP · dmg 110 · rng 4 · single · status:stagger1 groundsFlyers
  Return to sender. Shoot a door at an enemy within 4 tiles: they go in, and a door opens three storeys over their head for them to fall out of. MEDIUM physical damage from the landing, flyers are grounded, the target is Staggered.
- T2 **Breaking and Entering** `raceBreakingEntering` · damage/doorBreach · psychic/physical · 50MP 1AP · dmg 85 · rng 4 · single · 
  Nobody said the door had to be yours. Shoot a door down beside an enemy within 4 tiles you can see and come through it: WEAK physical damage, always a rear attack.
- T2 **Door Dash** `raceDoorDash` · movement/teleport · psychic · 50MP 1AP · dmg - · rng 5 · single · 
  Take the short cut. Shoot a door onto an empty tile within 5, step into a door at your feet and out of that one. No damage, no opportunity strikes — you were never in between.
- T3 **Door Slam** `raceDoorSlam` · damage/damage · psychic/physical · 75MP 1AP · dmg 130 · rng 4 · single · finisher:stagger×1.5
  Mind your fingers. Shoot a door onto a Single Enemy within 4 tiles and slam it on them for MEDIUM physical damage. Deals bonus damage to Staggered targets.
- T4 **Drop In** `raceDropIn` · damageEffect/doorBreach · psychic/physical · 100MP 2AP · dmg 165 · rng 5 · single · status:stagger1
  Uninvited. Shoot a door into the air over an enemy within 5 tiles you can see and drop out of it onto them: HEAVY physical damage, always a rear attack, the target is Staggered, and every other enemy beside the landing takes WEAK physical damage from the slam.

## 🌊 Deep Sea Anatomy `deepsea` · kind discipline · 5 spells (T1 2 / T2 1 / T3 1 / T4 1)
desc: Stings, ink, tentacles and dives from the bottom of the sea.
races (7): mermaid, kraken, loch ness monster, jellyfish, starfish, deep sea fish, sharkman

- T1 **Deep Adapted** `passiveDeepAdapted` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  +1 DEF and +1 SPD stage while standing in water.
- T1 **Spout** `raceSpout` · damageEffect/damage · water/magic · 25MP 1AP · dmg 80 · rng 3 · single · status:wet2
  A jet of seawater from the gills. WEAK water damage and the target is soaked through.
- T2 **Deep Dive** `raceDeepDive` · movement/escape · - · 50MP 1AP CD2 · dmg - · rng 0 · single · status:protect1 teleportDistance:3
  Submerge and resurface up to 3 tiles away. Protected 1 turn upon emerging.
- T3 **Depth Charge** `raceDepthCharge` · damage/aoe · water/physical · 75MP 1AP · dmg 125 · rng 4 · aoe r1 · finisher:wet×1.5
  It goes off under the surface. Deals MEDIUM physical damage to All Enemies in a 3×3. Anything soaked — or standing in the water — takes the shock through its body: bonus damage to Soaked targets.
- T4 **Poseidon's Wrath** `racePoseidonsWrath` · damage/barrage · water/magic · 100MP 2AP · dmg 170 · rng 0 · self-aoe r99 · ignoresLineOfSight
  The sea rises in judgment. Deals HEAVY magic damage to ALL Enemies standing in water, anywhere on the battlefield. The deep remembers what it is owed.

## ✦ Deep State Connections `deepstate` · kind discipline · 3 spells (T1 1 / T2 1 / T3 1 / T4 0)
desc: 
races (4): men in black, telepath, conspiracy theorist, politician

- T1 **Surveillance** `raceSurveillance` · effect/debuff · - · 25MP 1AP · dmg - · rng 6 · single · status:marked2
  We have had a file on you for years. A Single Enemy within 6 tiles is Marked for 2 rounds: they cannot hide, and the next physical hit any ally lands deals +40.
- T2 **Black Budget** `raceBlackBudget` · effect/buff · - · 50MP 1AP · dmg - · rng 3 · single · status:overclock2
  Money that was never appropriated. Overclocks a Single Ally for 2 rounds: +1 ATK stage and +1 MOV (tech units also +1 RNG).
- T3 **Brainwash** `raceBrainwash` · effect/possess · psychic · 75MP 1AP CD3 · dmg - · rng 3 · single · status:possessed2
  Everyone has something, and we have it. A Single Enemy within 3 tiles takes its next activation under your orders — and comes back Discorded for 2 rounds. Bosses cannot be brainwashed.

## 😈 Demonic Abilities `demonicabilities` · kind discipline · 7 spells (T1 2 / T2 2 / T3 2 / T4 1)
desc: 
races (6): demon, succubus, demon prince, fallen angel, halfdemon, overlord

- T1 **Contract** `raceContract` · effect/debuff · shadow · 25MP 1AP · dmg - · rng 3 · single · status:contract3
  Binds a Single Enemy in an infernal contract for 3 turns: every time they deal damage, the demon collects 40% of it as healing. The fine print always favors the fiend.
- T1 **Demonic Roar** `raceDemonicRoar` · effect/aoe · - · 25MP 1AP · dmg - · rng 0 · self-aoe r2 · status:stagger1
  Terrifying roar. All enemies within 2 tiles are staggered, losing 1 AP.
- T2 **Infernal Hurl** `raceInfernalHurl` · damage/skyThrow · fire/physical · 50MP 1AP · dmg 90 · rng 1 · single · requiresFlight dmgPerLevel:25 carryHeight:4 collisionBonus:50
  Grabs the target, carries it skyward and hurls it up to 3 tiles. Deals WEAK physical damage, more if they crash into another unit. Caster must be flying.
- T2 **Soul Bind** `raceSoulBind` · effect/link · shadow · 50MP 1AP · dmg - · rng 3 · single · status:soulBound3
  Chains two enemies soul to soul (pick one, then another within 4 tiles of it). For 3 rounds, whenever either takes damage the other takes 30% of it — 45% while either of them is under the demon's Contract. Devour Soul hits Soul-Bound targets harder.
- T3 **Demonic Claw** `raceDemonicClaw` · damage/damage · shadow/physical · 75MP 1AP · dmg 135 · rng 1 · single · finisher:contract,soulBound×1.5
  Deals MEDIUM physical damage to a Single Enemy. Deals bonus damage to targets under a Contract or Soul Bound.
- T3 **Devour Soul** `raceVoidContract` · damage/lifeDrain · shadow/magic · 75MP 1AP · dmg 125 · rng 3 · single · finisher:contract,soulBound×1.5 drainPct:0.5
  Deals MEDIUM magic damage to a Single Enemy. Deals bonus damage to targets with Contract or Soul-Bound. Heals the caster for part of the damage dealt.
- T4 **Hellmouth** `raceHellmouth` · damage/line · fire/magic · 100MP 1AP · dmg 160 · rng 4 · line w1 · leaveTerrain:lava
  Deals HEAVY magic damage to All Enemies in a line. Leaves lava tiles behind.

## 🐫 Desert Acclimation `desertacclimation` · kind discipline · 4 spells (T1 1 / T2 1 / T3 1 / T4 1)
desc: 
races (2): martian, anubis

- T1 **Dust Devil** `raceDustDevil` · damage/aoePull · -/magic · 25MP 1AP · dmg 80 · rng 4 · aoe r1 · finisher:stun×1.5 pullToCenter
  Deals WEAK magic damage to All Enemies in an AOE and pulls them toward the center. Deals bonus damage to Stunned targets.
- T2 **Summon Sandstorm** `sharedSummonSandstorm` · deploy/summonWeather · wind · 50MP 1AP · dmg - · rng 4 · single · weatherType:sandstorm
  Summons sandstorm weather over the battlefield.
- T3 **Quicksand** `raceQuicksand` · effect/zoneDebuff · earth · 75MP 1AP · dmg - · rng 4 · aoe r1 · status:root1,slow1 zoneDuration:2
  The ground is fine until it is not. Turns a 3×3 to quicksand for 2 rounds: enemies inside are Rooted and Slowed.
- T4 **Simoom** `raceSimoom` · damageEffect/aoe · wind/magic · 100MP 1AP · dmg 160 · rng 4 · aoe r1 · status:blind1
  The hot wind that kills. HEAVY magic damage to everything in the square, and nobody sees where it came from. Applies Blind to All Enemies in the 3×3.

## 👊 Dirty Fighting `dirtyfighting` · kind discipline · 8 spells (T1 3 / T2 2 / T3 2 / T4 1)
desc: 
races (9): giant, antihero, overlord, juggernaut, minotaur, gangster, clown, luchador, goblin

- T1 **Body Check** `raceBodyCheck` · damageEffect/displacement · -/physical · 25MP 1AP · dmg 100 · rng 1 · single · status:stagger1 pushDistance:2
  Deals MEDIUM physical damage to a Single Enemy and shoves them 2 tiles. Applies Stagger.
- T1 **Curb Stomp** `raceStompOut` · damageEffect/damage · metal/physical · 25MP 1AP · dmg 100 · rng 1 · single · status:grievous2 finisher:stagger×1.5
  Put an adjacent enemy on the pavement and stomp. Deals MEDIUM physical damage to a Single Enemy and leaves a Grievous Wound — healing on them is halved for 2 rounds.
- T1 **Dark Justice** `raceDarkJustice` · damage/damage · -/physical · 25MP 1AP · dmg 100 · rng 3 · single · finisher:grievous,silence×1.5
  Charges in and deals MEDIUM physical damage to a Single Enemy. Bonus damage to the Wounded or the Silenced.
- T2 **Cheap Shot** `passiveCheapShot` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Every physical hit leaves a Grievous Wound for a round: the target's healing is halved.
- T2 **Iron Grip** `ironGrip` · damageEffect/debuff · -/physical · 50MP 1AP · dmg 80 · rng 1 · single · status:root2 groundsFlyers
  The grab that also hurts. Deals WEAK physical damage to a Single Enemy and Roots them for 2 rounds. Knocks flying targets out of the sky.
- T3 **Brutal Slam** `raceBrutalSlam` · damageEffect/barrage · -/physical · 75MP 1AP · dmg 110 · rng 0 · self-aoe r1 · status:grievous2
  Deals MEDIUM physical damage to All Enemies around the caster and leaves them Grievously Wounded: healing is halved.
- T3 **Skull Crack** `skullCrack` · damageEffect/damage · -/physical · 75MP 1AP · dmg 125 · rng 1 · single · status:silence1
  Deals MEDIUM physical damage to a Single Enemy. Applies Silence.
- T4 **No Mercy** `raceNoMercy` · damage/damage · shadow/physical · 100MP 2AP · dmg 180 · rng 1 · single · finisher:stagger×1.5
  Deals HEAVY physical damage to a Single Enemy. Executes a target below 25% HP outright. Deals bonus damage to Staggered targets.

## 🐉 Dragon Abilities `dragonabilities` · kind discipline · 5 spells (T1 1 / T2 2 / T3 1 / T4 1)
desc: 
races (1): dragon

- T1 **Dragon Breath** `raceDragonBreath` · damageEffect/line · fire/magic · 25MP 1AP · dmg 90 · rng 3 · line w1 · status:burn2 zoneDuration:2
  A short gout of flame. Deals MEDIUM magic damage to All Enemies in a 3-tile line and Burns them; the tiles keep burning for 2 rounds — anyone ending a turn there catches fire.
- T2 **Dragonfear** `raceDragonfear` · effect/aoe · - · 50MP 1AP · dmg - · rng 4 · aoe r1 · status:feared1,burn1
  Ancient terror, roared down from above. Every enemy in a 3×3 is Feared and set alight. They run, and they run burning.
- T2 **Ember Heart** `raceEmberHeart` · heal/heal · fire · 50MP 1AP · dmg - · rng 0 · single · status:regen2 healPct:0.2
  The furnace inside never goes out. Restores 20% of the caster's max HP and gives them Regen for 2 rounds.
- T3 **Dragon Toss** `raceDragonToss` · damage/skyThrow · -/physical · 75MP 1AP · dmg 70 · rng 1 · single · finisher:burn×1.5 requiresFlight dmgPerLevel:25 carryHeight:5 collisionBonus:60
  Grabs the target, carries it skyward and hurls it up to 3 tiles. The grab itself is light; the fall and any crash into another unit do the damage. Deals bonus damage to Burning targets.
- T4 **Dragonfire** `raceDragonfire` · damageEffect/line · fire/magic · 100MP 1AP · dmg 160 · rng 4 · line w1 · status:burn3 finisher:burn×1.5
  Exhale a roaring column of dragonfire, dealing HEAVY magic damage to All Enemies in a line. Applies Burn.

## 🛌 Dream Predation `astral` · kind discipline · 4 spells (T1 1 / T2 1 / T3 1 / T4 1)
desc: 
races (2): succubus, dreameater

- T1 **Dream Siphon** `raceDreamSiphon` · damage/lifeDrain · -/magic · 25MP 1AP · dmg 100 · rng 3 · single · finisher:stun×1.5 drainPct:0.4
  Deals MEDIUM magic damage to a Single Enemy. Deals bonus damage to targets with Stun. Heals the caster for part of the damage dealt.
- T2 **Sleep Paralysis** `raceSleepParalysis` · damageEffect/damage · shadow/magic · 50MP 1AP CD2 · dmg 60 · rng 3 · single · status:stun1
  Deals WEAK magic damage to a Single Enemy. It cannot move or act: Stunned for a round.
- T3 **Nightmare Pulse** `raceNightmarePulse` · damage/aoe · psychic/magic · 75MP 1AP · dmg 125 · rng 3 · aoe r1 · finisher:stun×1.5
  The dream finishes eating. Deals MEDIUM magic damage to All Enemies in a 3×3 within 3 tiles, and the caster heals 25% of all the damage dealt. Deals bonus damage to Stunned targets.
- T4 **Eternal Slumber** `raceEternalSlumber` · damageEffect/aoe · psychic/magic · 100MP 2AP CD2 · dmg 160 · rng 4 · aoe r2 · status:stun1
  Deals HEAVY magic damage to All Enemies in an AOE and drags them under — Stunned for 1 turn. Sleep now. The dream will finish eating on its own.

## ✇ Driving Skills `drivingskills` · kind discipline · 5 spells (T1 1 / T2 2 / T3 1 / T4 1)
desc: 
races (1): honda civic

- T1 **Ram Charge** `raceRamCharge` · damageEffect/dash · -/physical · 25MP 1AP · dmg 100 · rng 3 · single · status:stagger1
  Dashes through the battlefield. Applies Stagger. The caster charges into melee first.
- T2 **Exhaust Cloud** `raceExhaustCloud` · effect/zoneDebuff · - · 50MP 1AP · dmg - · rng 0 · self-aoe r1 · status:discord1 zoneDuration:2
  Pump toxic exhaust in a 3x3 cloud for 2 turns. Enemies inside are confused.
- T2 **Transform** `raceTransform` · utility/transform · - · 50MP 1AP · dmg - · rng 0 · single · 
  Stand up into the combat platform: −3 SPD, +1 DEF and +2 M DEF stages, +2 RNG. Or fold back down.
- T3 **Nitro Boost** `raceNitroBoost` · effect/buff · - · 75MP 1AP · dmg - · rng 0 · single · status:overclock2 stage:spd+1
  Floor it. The caster is Overclocked for 2 rounds (+1 ATK stage, +1 MOV) and gains +1 SPD stage.
- T4 **Vehicular Manslaughter** `raceMissileBarrage` · damage/dash · -/physical · 100MP 1AP · dmg 160 · rng 4 · single · finisher:discord×1.5 dashDamage:160
  It was an accident. Four times. Drives through every enemy in the lane for HEAVY physical damage. Deals bonus damage to Discorded targets.

## 🪨 Earth Abilities `earth` · kind discipline · 11 spells (T1 4 / T2 4 / T3 2 / T4 1)
desc: Stone, quakes and raised ground.
races (9): giant, gargoyle, cyclops, nephilim, dinosaur, kaiju, golem, crystal guardian, tree person

- T1 **Boulder Hurl** `raceBoulderHurl` · damage/damage · earth/physical · 25MP 1AP · dmg 100 · rng 3 · single · finisher:stagger×1.5
  Deals MEDIUM physical damage to a Single Enemy. Deals bonus damage to targets with Stagger.
- T1 **Mountainborn** `passiveMountainborn` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Climbing costs no extra movement. Hits from higher ground deal +10% damage. Ground raised under it cannot shove it aside.
- T1 **Stonefall** `raceStonefall` · damageEffect/damage · earth/physical · 25MP 1AP · dmg 100 · rng 4 · single · status:stagger1 ignoresLineOfSight
  Deals MEDIUM physical damage to a Single Enemy. Applies Stagger. Fires through cover.
- T1 **Tremor Stomp** `raceTremorStomp` · damageEffect/aoe · earth/physical · 25MP 1AP · dmg 80 · rng 0 · self-aoe r1 · status:stagger1 terrainDeform:{"centerDelta":-1,"edgeDelta":0}
  Deals WEAK physical damage to All Enemies in an AOE. Applies Stagger.
- T2 **Earthen Grasp** `raceEarthenGrasp` · damageEffect/pull · earth/physical · 50MP 1AP · dmg 80 · rng 3 · single · status:root1 pullDistance:2 groundsFlyers
  Deals WEAK physical damage to a Single Enemy and pulls it toward you. Applies Rooted. Knocks flying enemies out of the sky.
- T2 **Fissure** `sharedFissure` · damageEffect/terrainCreate · earth/physical · 50MP 1AP · dmg 100 · rng 4 · tiles3 · status:stagger1 terrainType:chasm terrainDeform:{"centerDelta":-2,"edgeDelta":0}
  Reshapes the battlefield — creates chasm across 3 tiles (pick the orientation). Applies Stagger.
- T2 **Rampart** `rampart` · damage/terrainCreate · earth/physical · 50MP 1AP · dmg 60 · rng 3 · tiles3 · terrainType:mountain monument:{"kind":"menhir"} terrainDeform:{"centerDelta":2,"edgeDelta":0}
  Raise three standing stones in a line — a wall two tiles high that blocks the way and the sight. Enemies on the targeted tiles take damage. Hold the line — build the line.
- T2 **Rampart** `sharedRampart` · damage/terrainCreate · earth/physical · 50MP 1AP · dmg 60 · rng 3 · tiles3 · terrainType:mountain monument:{"kind":"menhir"} terrainDeform:{"centerDelta":2,"edgeDelta":0}
  Raise three standing stones in a line — a wall two tiles high that blocks the way and the sight. Enemies on the targeted tiles take damage. Hold the line — build the line.
- T3 **Ground Slam** `groundSlam` · damageEffect/aoe · earth/physical · 75MP 1AP · dmg 125 · rng 0 · aoe r1 · status:slow2 terrainDeform:{"centerDelta":-1,"edgeDelta":0}
  Deals MEDIUM physical damage to All Enemies in an AOE. Applies Slow.
- T3 **Stone Drop** `raceStoneDrop` · damage/skyDrop · earth/physical · 75MP 1AP · dmg 125 · rng 1 · single · finisher:stagger×1.5 requiresFlight dmgPerLevel:25 carryHeight:4 terrainDeform:{"centerDelta":-1,"edgeDelta":0}
  Lifts the target high and drops it. Deals MEDIUM physical damage plus fall damage. Deals bonus damage to targets with Stagger. Caster must be flying.
- T4 **Quake** `raceQuake` · damageEffect/barrage · earth/physical · 100MP 2AP · dmg 160 · rng 0 · self-aoe r2 · status:stagger1 terrainDeform:{"centerDelta":-1,"edgeDelta":0}
  Deals HEAVY physical damage to All Enemies around the caster (AOE). Applies Stagger. Reshapes the ground on impact.

## 🛠️ Engineering `engineering` · kind discipline · 5 spells (T1 2 / T2 1 / T3 1 / T4 1)
desc: 
races (4): ai, droid, gnome, santa clause

- T1 **Repair** `repair` · heal/heal · metal · 25MP 1AP · dmg - · rng 2 · single · heal:155
  Restores a MEDIUM amount of HP to a Single Ally.
- T1 **Tinker** `passiveTinker` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Turrets have +1 range and Repair heals 20% more.
- T2 **Deploy Turret** `deployTurret` · deploy/deployTurret · - · 50MP 1AP · dmg - · rng 2 · single · maxActivePerCaster:2 turretDmg:110 turretHp:80 turretRange:3
  Deploy a turret on an empty tile (1 AP). It paints the nearest enemy within 3 tiles with a targeting laser — the shot lands at the end of the round for 110 damage. Max 2 per Engineer. Enemies can destroy turrets.
- T3 **5G Tower** `fiveGTower` · deploy/deployTurret · lightning · 75MP 1AP · dmg - · rng 2 · single · maxActivePerCaster:1 turretDmg:0 turretHp:3 turretRange:4
  Deploy a 5G radio tower (3 hits to destroy). Its signal scrambles thought — enemies within 4 tiles lose 8 M DEF while it stands. Max 1 per Engineer.
- T4 **Overtinker** `raceOvertinker` · effect/aoeShield · metal · 100MP 1AP CD2 · dmg - · rng 0 · self-aoe r2 · shieldHp:160
  One more adjustment. One MORE. Grants a heavy damage-absorbing shield to All Allies (and contraptions) around the caster.

## 👁️ Eyesight `eyesight` · kind discipline · 5 spells (T1 1 / T2 2 / T3 1 / T4 1)
desc: 
races (2): cyclops, occulus

- T1 **Pupil Shield** `racePupilShield` · effect/aoeShield · - · 25MP 1AP · dmg - · rng 3 · aoe r0 · shieldHp:130
  Grants a damage-absorbing shield to All Allies in an AOE.
- T2 **Baleful Gaze** `raceBalefulGaze` · damage/line · -/magic · 50MP 1AP · dmg 130 · rng 5 · line w1 · 
  Deals MEDIUM magic damage to All Enemies in a line.
- T2 **Omni-Vision** `raceOmniVision` · utility/scan · - · 50MP 1AP · dmg - · rng 5 · single · 
  The all-seeing eye reveals. Scan a massive area, revealing fog and hidden units within 3 tiles.
- T3 **Hypnotic Pulse** `raceHypnoticPulse` · effect/aoe · - · 75MP 1AP · dmg - · rng 3 · aoe r1 · status:stun1
  Everything that looks back stops. Every enemy in a 3×3 is Stunned for a round.
- T4 **Death Gaze** `raceDeathGaze` · damageEffect/damage · -/magic · 100MP 1AP · dmg 180 · rng 4 · single · stage:def-1 finisher:stun×1.5
  Deals HEAVY magic damage to a Single Enemy. Lowers the target's DEF by 1 stage. Deals bonus damage to Stunned targets.

## 🧚🏻 Fae Magic `fae` · kind discipline · 5 spells (T1 2 / T2 1 / T3 1 / T4 1)
desc: 
races (2): fairy, mushroom girl

- T1 **Glitterburst** `raceGlitterburst` · damageEffect/aoe · light/magic · 25MP 1AP · dmg 80 · rng 3 · aoe r1 · stage:def-1
  Deals WEAK magic damage to All Enemies in an AOE. Lowers the target's DEF by 1 stage.
- T1 **Sparkle** `raceSparkle` · effect/buff · light · 25MP 1AP · dmg - · rng 3 · single · status:sparkling2
  Dust an ally in gold. For 2 rounds they are Sparkling: +1 SPD stage, and every step sheds blinding glitter — an enemy who treads on it is Blinded.
- T2 **Fairy Dust** `raceFairyDust` · effect/warCry · wind · 50MP 1AP · dmg - · rng 0 · aura r3 · team:levitating2
  A happy thought for everyone. Allies within 3 tiles are Levitating for 2 rounds — temporary flight, with the high-ground bonus that comes with it.
- T3 **Glitter Bomb** `raceGlitterBomb` · damageEffect/aoe · light/magic · 75MP 1AP · dmg 120 · rng 4 · aoe r1 · status:blind1
  Deals MEDIUM magic damage to All Enemies in a 3×3 and Blinds them in a white-out of glitter.
- T4 **Fae Ring** `raceFaeRing` · damage/aoe · nature/magic · 100MP 2AP · dmg 160 · rng 4 · aoe r2/ring · finisher:blind×1.5
  A ring of toadstools erupts. Deals HEAVY magic damage to All Enemies standing on the ring (the rim of a 5×5 — the center is spared). Never step inside a fairy ring; never stand on one either.

## 🪽 Fallen Angelic Powers `fallenangel` · kind discipline · 5 spells (T1 1 / T2 1 / T3 2 / T4 1)
desc: 
races (2): fallen angel, nephilim

- T1 **Fallen Grace** `raceFallenGrace` · damageEffect/cross · -/magic · 25MP 1AP · dmg 80 · rng 4 · cross r1 · status:burn1
  Deals WEAK magic damage to All Enemies in an X-shaped AOE. Applies Burn.
- T2 **Abyssal Wings** `raceAbyssalWings` · movement/escape · - · 50MP 1AP CD2 · dmg - · rng 0 · single · status:protect1 teleportDistance:4
  Spread the black wings. Fly up to 4 tiles and land under Protect for a round.
- T3 **Broken Halo** `raceBrokenHalo` · damage/damage · shadow/magic · 75MP 1AP · dmg 130 · rng 4 · single · finisher:burn×1.5 purgeBuffs
  What is left of the halo, thrown like a discus. Deals MEDIUM magic damage and strips every buff the target carries; Burning targets take it worse.
- T3 **Descending Wrath** `raceDescendingWrath` · damageEffect/skySlam · -/magic · 75MP 1AP · dmg 135 · rng 1 · single · status:burn2 finisher:burn×1.5 requiresFlight dmgPerLevel:25 carryHeight:5 terrainDeform:{"centerDelta":-1,"edgeDelta":0}
  Dives from the sky onto the target, dealing MEDIUM magic damage. Applies Burn. Deals bonus damage to targets with Burn. Caster must be flying.
- T4 **Wrath of the Watchers** `raceWrathOfTheWatchers` · damageEffect/cross · -/magic · 100MP 1AP · dmg 160 · rng 4 · cross r2 · status:burn1 finisher:burn×1.5
  Deals HEAVY magic damage to All Enemies in a cross-shaped AOE. Applies Burn. Deals bonus damage to Staggered targets.

## 😼 Feline Anatomy `feline` · kind discipline · 4 spells (T1 1 / T2 1 / T3 1 / T4 1)
desc: 
races (1): catgirl

- T1 **Meow** `raceMeow` · effect/barrage · sonic · 25MP 1AP · dmg - · rng 0 · self-aoe r2 · stage:def-1
  An adorable, disarming meow. All enemies within 2 tiles have their DEF lowered for 2 turns. Deals no damage.
- T2 **Land on Your Feet** `raceLandOnYourFeet` · movement/teleport · physical · 50MP 1AP · dmg - · rng 3 · single · teleportDistance:3
  Cats do not fall. They arrive. Leap to any free tile within 3, whatever its height, and take no fall damage. +1 DEF stage for 1 round when you land.
- T3 **Cat Nap** `raceCatNap` · heal/selfHeal · - · 75MP 1AP · dmg - · rng 0 · single · selfHealPct:0.3 cleanse:99
  Twenty minutes. Good as new. Restores 30% of the caster's max HP and removes every debuff.
- T4 **Ninefold Scratch** `raceNinefoldScratch` · damage/multiHit · metal/physical · 100MP 1AP · dmg - · rng 1 · single · hitDamages:[20,20,20,20,20,20,20,20,20]
  Nine lives, nine scratches. Deals SEVERE physical damage to a Single Enemy across 9 hits.

## 🔥 Fire Magic `fire` · kind element · 5 spells (T1 2 / T2 1 / T3 1 / T4 1)
desc: Burns, blasts and scorched ground.
races (5): wizard, demon, demon prince, dragon, jack o lantern

- T1 **Cinder Touch** `passiveCinderTouch` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Basic attacks and physical spells are fire-element and Burn the target for a round.
- T1 **Fireball** `fire1` · damageEffect/damage · fire/magic · 25MP 1AP · dmg 100 · rng 3 · single · status:burn2
  A fist of fire. Deals MEDIUM magic damage to a Single Enemy; the target keeps burning.
- T2 **Combust** `raceCombust` · damage/damage · fire/magic · 50MP 1AP · dmg 130 · rng 4 · single · finisher:burn×1.5
  Feed the fire what it wants. MEDIUM magic damage — a Burning target goes up like tinder.
- T3 **Wall of Fire** `wallOfFire` · damageEffect/terrainCreate · fire/magic · 75MP 1AP · dmg 80 · rng 4 · tiles3 · status:burn2 terrainType:scorched
  Conjure a 3-tile wall of flame in a line (horizontal or vertical). Damages enemies caught, burns them for 2 turns — and the wall KEEPS BURNING for 3 rounds: it scorches anyone standing in or crossing it, and the fire can spread through grass and trees.
- T4 **Meteor** `meteor` · damageEffect/aoe · fire/magic · 100MP 1AP CD2 · dmg 160 · rng 4 · aoe r1 · status:burn3 finisher:burn×1.5 groundsFlyers leaveTerrain:scorched terrainDeform:{"centerDelta":-2,"edgeDelta":-1}
  Deals HEAVY magic damage to All Enemies in a 3×3 AOE. Applies Burn. Knocks flying targets out of the sky. Destroys buildings. Leaves scorched tiles behind. Reshapes the ground on impact. Cooldown: 2 rounds. Deals bonus damage to Burning targets.

## 🏈 Football IQ `football` · kind discipline · 7 spells (T1 2 / T2 2 / T3 2 / T4 1)
desc: 
races (1): quarterback

- T1 **Bullet Pass** `raceBulletPass` · damage/line · wind/physical · 25MP 1AP · dmg 80 · rng 4 · line w1 · 
  Deals WEAK physical damage to All Enemies in a line.
- T1 **Spike the Ball** `raceSpikeTheBall` · damage/aoe · earth/physical · 25MP 1AP · dmg 80 · rng 3 · aoe r1 · 
  Deals WEAK physical damage to All Enemies in an AOE.
- T2 **Blitz** `raceBlitz` · damageEffect/dash · earth/physical · 50MP 1AP · dmg 110 · rng 3 · single · status:stagger1
  Dashes through the battlefield. Applies Stagger. The caster charges into melee first.
- T2 **QB Sneak** `raceQBSneak` · movement/escape · earth · 50MP 1AP CD2 · dmg - · rng 0 · single · status:invisible1 teleportDistance:3
  Drops into a three-point stance and jukes clean out of the pile. Teleport 3 tiles and become Invisible for 1 turn.
- T3 **Audible** `raceAudible` · effect/warCry · sonic · 75MP 1AP · dmg - · rng 0 · aura r2 · team:overclock1
  Check with me. Every ally within 2 tiles is Overclocked for a round: +1 ATK stage and +1 MOV (tech allies also +1 RNG).
- T3 **Long Bomb** `raceLongBomb` · damage/damage · wind/physical · 75MP 1AP · dmg 135 · rng 6 · single · ignoresLineOfSight
  Let it fly. Deals MEDIUM physical damage to a Single Enemy up to 6 tiles away; the ball arcs over cover.
- T4 **Hail Mary** `raceHailMary` · damage/damage · wind/physical · 100MP 1AP · dmg 180 · rng 5 · single · finisher:stagger×1.5
  Deals HEAVY physical damage to a Single Enemy. Deals bonus damage to Staggered targets.

## 🔮 Fortune Telling `fortunetelling` · kind discipline · 5 spells (T1 2 / T2 2 / T3 0 / T4 1)
desc: 
races (1): fortune teller

- T1 **Star Chart** `passiveStarChart` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  +1 M ATK stage while this unit's own sign rules the sky.
- T1 **Star Crossed** `raceStarCrossed` · damage/debuff · arcane/magic · 25MP 1AP · dmg 70 · rng 4 · single · 
  Read the target's birth chart and turn their own stars against them. Magic damage plus an affliction by their zodiac: Fire signs burn, Earth signs are rooted and exposed, Air signs are silenced, Water signs grow drowsy. +50% damage if their sign rules the sky.
- T2 **Séance** `raceSpiritChannel` · heal/heal · psychic · 50MP 1AP · dmg - · rng 3 · single · healAmt:190 cleanse:2
  Call on the departed. Restores a BIG amount of HP to a Single Ally and cleanses 2 debuffs.
- T2 **Tarot Draw** `raceTarotDraw` · effect/warCry · arcane · 50MP 1AP CD3 · dmg - · rng 0 · aura r99 · 
  Empowers All Allies nearby. Raises a random stat of every ally by 1 stage. Cooldown: 3 rounds.
- T4 **Crystal Ball** `raceCrystalBall` · damage/delayed · arcane/magic · 100MP 1AP · dmg 160 · rng 5 · aoe r1 · finisher:hexed×1.5 delayTurns:1
  Marks a zone. After 1 turn, deals HEAVY magic damage to All Enemies inside (AOE). Deals bonus damage to Hexed targets.

## ✦ Fractal Pattern Recognition `fractal` · kind discipline · 4 spells (T1 1 / T2 1 / T3 1 / T4 1)
desc: 
races (3): mantid, machine elves, voidweaver

- T1 **Dimensional Fold** `raceDimensionalFold` · movement/swap · arcane · 25MP 1AP · dmg - · rng 3 · single · 
  Swaps positions with the target unit.
- T2 **Strange Loop** `raceStrangeLoop` · damageEffect/damage · arcane/magic · 50MP 1AP CD2 · dmg 70 · rng 4 · single · status:stun1
  The pattern closes on itself. They cannot find the way out. Deals WEAK magic damage to a Single Enemy within 4 tiles and Stuns them for a round.
- T3 **Fractal Stitch** `raceFractalStitch` · damage/line · arcane/magic · 75MP 1AP · dmg 130 · rng 5 · line w1 · 
  Deals MEDIUM magic damage to All Enemies in a line, high or low. The needle zigzags up and down through the air to stitch every body on the line, flyers included.
- T4 **Fractal Needle** `raceFractalNeedle` · damage/splitBeam · arcane/magic · 100MP 1AP · dmg 170 · rng 4 · single · finisher:stun×1.5
  Deals HEAVY magic damage to one enemy; the needle splits and seeks up to two more within 2 tiles for half. Bonus damage to Stunned targets.

## 👱🏻 Galactic Federation Protocol `galacticfederation` · kind discipline · 4 spells (T1 1 / T2 1 / T3 1 / T4 1)
desc: 
races (1): nordic

- T1 **Pleiadian Touch** `racePleiadianTouch` · heal/heal · light · 25MP 1AP · dmg - · rng 3 · single · healAmt:130 cleanse:1
  A hand on the shoulder. The wound remembers being whole. Heals an ally a BIG amount and removes one debuff.
- T2 **Federation Beacon** `raceFederationBeacon` · deploy/deployObject · light · 50MP 1AP · dmg - · rng 2 · aura r4 · maxActivePerCaster:1 objectHp:70
  Plant a pylon of Pleiadian light. At the start of each ally's turn within 4 tiles, the beacon pulses 40 HP of regeneration into them. Placing never uses your spell slot. The mothership is watching.
- T3 **Stasis Beam** `raceStasisBeam` · damageEffect/debuff · light/magic · 75MP 1AP CD2 · dmg 80 · rng 4 · single · status:stun1 groundsFlyers
  Held in the light. Held. Deals WEAK magic damage to a Single Enemy and Stuns them for a round. Knocks flying targets out of the sky.
- T4 **Nordic Accord** `raceNordicAccord` · effect/warCry · psychic · 100MP 1AP · dmg - · rng 0 · aura r99 · stage:mdef+1,int+1
  The accord is signed. Every ally on the field gains +1 M ATK and +1 M DEF stage.

## 🎰 Gambling `gambling` · kind discipline · 4 spells (T1 1 / T2 1 / T3 1 / T4 1)
desc: 
races (1): bunny girl

- T1 **Dead Man's Hand** `raceDeadMansHand` · damage/multiHit · arcane/magic · 25MP 1AP · dmg - · rng 3 · single · hitDamages:[26,26,26,26]
  Aces and eights, thrown edge-first. Four cards at a Single Enemy for WEAK magic damage each.
- T2 **Stacked Deck** `raceStackedDeck` · effect/debuff · - · 50MP 1AP · dmg - · rng 4 · single · status:marked2 stage:def-1
  You have been reading their tell all night. A Single Enemy within 4 tiles is Marked for 2 rounds (the next physical hit on them deals +40) and loses 1 DEF stage.
- T3 **Double Down** `raceDoubleDown` · effect/buff · - · 75MP 1AP · dmg - · rng 0 · single · stage:atk+2,def-1
  Everything on the table. Raises the caster's ATK by 2 stages and lowers their DEF by 1 stage.
- T4 **Jackpot** `raceJackpot` · damageEffect/aoe · arcane/magic · 100MP 1AP · dmg 160 · rng 3 · aoe r1 · status:stagger1
  The machine pays out. All of it. On their heads. Deals HEAVY magic damage to All Enemies in a 3×3 and Staggers them.

## ◈ Gear `gear` · kind support · UNIVERSAL · 16 spells (T1 13 / T2 3 / T3 0 / T4 0)
desc: Equipment as passive rows: the universal accessories every unit may carry (at most 2 passive / gear rows among the 7 slots).
races (0): NONE

- T1 **Archon's Focus** `gearArchonsFocus` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  +14 M ATK, but each life this unit is locked to the first spell it casts until it falls.
- T1 **Berserker's Brand** `gearBerserkersBrand` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  +16 ATK, but each life this unit is locked to the first spell it casts until it falls.
- T1 **Binoculars** `gearBinoculars` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  +28 AWR. Sharper perception: higher crit chance, and at AWR 84+ senses hidden enemies from 2 tiles.
- T1 **Censer of Purity** `gearPurityCenser` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Once per round, instantly purges an enemy-inflicted debuff and lashes back at the culprit for 40% of ATK.
- T1 **Chrono Locket** `gearChronoLocket` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  A sliver of borrowed time. Regenerates an extra 5% max HP at the end of every round.
- T1 **Dowsing Rod** `gearDowsingRod` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Twitches over buried danger: at the end of each round, enemy traps within 3 tiles of the bearer are revealed to your team.
- T1 **Grapnel Gauntlet** `gearGrapnelGauntlet` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Built-in grappling hook: grants the Grapple ability — hook a wall, a door or an ally within 3 and pull yourself beside it.
- T1 **Hagstone** `gearHagstone` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Peer through the veil: at the end of each round, invisible enemies within 4 tiles of the bearer are revealed.
- T1 **Mason's Gauntlets** `gearMasonsGauntlets` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  A master builder’s grip: every AP spent on the Build action places or digs 2 blocks instead of 1.
- T1 **Signal Flare** `gearSignalFlare` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  One use: thrown up to 8 tiles into the fog, it reveals a diamond 6 tiles out from where it lands. The flare is spent.
- T1 **Telescope** `gearTelescope` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Spot and target enemies in the sky from the ground (range 5). +28 AWR.
- T1 **Walkie Talkie** `gearWalkieTalkie` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Shares line of sight with allied Walkie Talkie carriers. +14 AWR.
- T1 **Ward Totem** `gearWardTotem` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Deployable ward (place within 3 tiles) that grants vision in an area. +14 AWR.
- T2 **Echo Band** `gearEchoBand` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Basic attacks strike twice — the echo hits for 50% damage.
- T2 **Jetpack** `gearJetpack` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Fly to the sky without nexus control. Ignores terrain movement cost. +1 MOV.
- T2 **Martyr's Talisman** `gearMartyrsTalisman` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Defies the first killing blow each life — survive at 1 HP. Recharges on respawn.

## 🪜 Giant Abilities `titan` · kind discipline · 8 spells (T1 1 / T2 4 / T3 2 / T4 1)
desc: 
races (6): giant, cyclops, nephilim, kaiju, juggernaut, king kong

- T1 **Stone Throw** `raceStoneThrow` · damage/damage · earth/physical · 25MP 1AP · dmg 100 · rng 5 · single · finisher:stun×1.5 ignoresLineOfSight
  Deals MEDIUM physical damage to a Single Enemy. Deals bonus damage to targets with Stun. Fires through cover.
- T2 **Aftershock** `passiveAftershock` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Stagger it applies lasts 1 round longer.
- T2 **Fee Fi Fo Fum** `raceTitanStep` · effect/barrage · earth/physical · 50MP 1AP · dmg - · rng 0 · self-aoe r2 · status:marked2,stagger1
  Fee. Fi. Fo. Fum. Every enemy within 2 tiles is Marked for 2 rounds and Staggered. He knows where you are, and the floor knows it too.
- T2 **Giant Stride** `raceGiantStride` · damage/dash · -/physical · 50MP 1AP · dmg 60 · rng 4 · single · 
  Four of your steps. One of his. Stride up to 4 tiles in a line; every enemy on or beside the path takes WEAK physical damage.
- T2 **Thick Hide** `raceThickHide` · effect/buff · - · 50MP 1AP · dmg - · rng 0 · single · stage:def+1
  Empowers the caster. Raises DEF by 1 stage.
- T3 **Colossal Crush** `raceColossalCrush` · damage/damage · earth/physical · 75MP 1AP · dmg 135 · rng 1 · single · finisher:stagger×1.5 terrainDeform:{"centerDelta":-1,"edgeDelta":0}
  Deals MEDIUM physical damage to a Single Enemy and stamps the ground flat where they stood. Deals bonus damage to Staggered targets.
- T3 **Titan Drop** `raceTitanDrop` · damage/leapStrike · -/physical · 75MP 1AP · dmg 125 · rng 2 · single · dmgPerLevel:25 terrainDeform:{"centerDelta":-1,"edgeDelta":0}
  Leaps to a Single Enemy, dealing MEDIUM physical damage.
- T4 **Giant Smash** `raceGiantSmash` · damageEffect/dash · -/physical · 100MP 2AP · dmg 170 · rng 2 · single · status:stun1 dashDamage:56
  Charges at a Single Enemy, dealing HEAVY physical damage. Enemies along the path also take damage. Applies Stun.

## 🦴 Grave Hunger `ghoulish` · kind discipline · 5 spells (T1 1 / T2 2 / T3 1 / T4 1)
desc: Feeding on the fallen: frenzies, bites and corpse crawls.
races (2): zombie, ghoul

- T1 **Ghoulish Bite** `raceGhoulishBite` · damageEffect/lifeDrain · poison/physical · 25MP 1AP · dmg 100 · rng 1 · single · status:poison2 drainPct:0.4
  Deals MEDIUM physical damage to a Single Enemy. Applies Poison. Heals the caster for part of the damage dealt.
- T2 **Corpse Crawl** `raceCorpseCrawl` · movement/escape · - · 50MP 1AP CD2 · dmg - · rng 0 · single · status:invisible1 teleportDistance:3
  Burrow through the earth up to 3 tiles away, turning invisible for 1 turn.
- T2 **Frenzy** `raceFrenzy` · damageEffect/lifeDrain · shadow/physical · 50MP 1AP · dmg 110 · rng 1 · single · status:grievous2 drainPct:0.3
  Tear in. Deals MEDIUM physical damage to a Single Enemy, heals the ghoul for 30% of it, and leaves a Grievous Wound — their healing is halved for 2 rounds.
- T3 **Carrion Feast** `raceCarrionFeast` · heal/cannibalize · - · 75MP 1AP CD2 · dmg - · rng 2 · single · stage:atk+1 healPct:0.5
  Feeds on a fallen unit's remains within 2 tiles — an ally's gravestone or an enemy's bones. Heals 50% of max HP and raises ATK by 1 stage. The remains are consumed and that unit's respawn is delayed 2 rounds.
- T4 **Terror Pounce** `raceTerrorPounce` · damage/damage · shadow/physical · 100MP 2AP · dmg 180 · rng 3 · single · finisher:feared×1.5 purgeBuffs
  Run the prey down. Charge up to 3 tiles and deal HEAVY physical damage to a Single Enemy, stripping every buff they carry. Deals bonus damage to Feared targets.

## 🙉 Great Ape `apeintelligence` · kind discipline · 4 spells (T1 1 / T2 1 / T3 1 / T4 1)
desc: 
races (1): king kong

- T1 **Chest Pound** `raceChestPound` · effect/barrage · - · 25MP 1AP · dmg - · rng 0 · self-aoe r2 · stage:def-1
  Pound chest with terrifying fury. All enemies within 2 tiles cower — -1 DEF stage.
- T2 **Seismic Leap** `raceSeismicLeap` · damageEffect/leapStrike · -/physical · 50MP 1AP · dmg 100 · rng 2 · aoe r1 · status:stagger1 dmgPerLevel:30 terrainDeform:{"centerDelta":-1,"edgeDelta":-1}
  Leaps to a Single Enemy, dealing MEDIUM physical damage. Applies Stagger.
- T3 **Go Ape** `raceApeFury` · effect/buff · - · 75MP 1AP · dmg - · rng 0 · single · stage:atk+2 selfDamagePct:0.1
  Raises the caster's ATK by 2 stages. Costs 10% of max HP (never fatal).
- T4 **Ape Fury** `racePrimalSmash` · damage/damage · -/physical · 100MP 1AP · dmg 180 · rng 1 · single · finisher:stagger×1.5 terrainDeform:{"centerDelta":-1,"edgeDelta":0}
  Deals HEAVY physical damage to a Single Enemy. Reshapes the ground on impact. Deals bonus damage to Slowed targets.

## 🔫 Gun Training `weaponstraining` · kind weapon · 6 spells (T1 1 / T2 2 / T3 2 / T4 1)
desc: 
races (6): cowboy, marksman, general, gangster, police officer, sheriff

- T1 **Double Pump** `doubleShot` · damage/multiHit · metal/physical · 25MP 1AP · dmg - · rng 3 · single · hitDamages:[60,60]
  Two barrels, no waiting. Deals MEDIUM physical damage to a Single Enemy across 2 hits.
- T2 **Incendiary Rounds** `raceIncendiaryRounds` · effect/buff · fire · 50MP 1AP · dmg - · rng 0 · single · status:incendiary2
  Loads a magazine of incendiary rounds: for 2 rounds every landed basic attack sets the target on fire (Burn, 2 rounds).
- T2 **Scatter Shot** `riderScatterShot` · damage/damage · metal/physical · 50MP 1AP · dmg 64 · rng 4 · rand×3 · ignoresLineOfSight
  Point it that way and pull. WEAK physical damage to 3 random enemies within 4 tiles — no aim, no line of sight needed.
- T3 **Crossfire** `crossfire` · damage/cross · metal/physical · 75MP 1AP · dmg 125 · rng 4 · cross r1 · 
  Two shooters' worth of lead on one crossing. Deals MEDIUM physical damage to every enemy on the X around the target.
- T3 **Dead Eye** `deadEye` · damageEffect/damage · metal/physical · 75MP 1AP · dmg 135 · rng 4 · single · status:marked3
  Deals MEDIUM physical damage to a Single Enemy and Marks them for 3 rounds: the next hit on them lands 60 harder.
- T4 **Extended Clips** `raceExtendedClips` · effect/warCry · metal · 100MP 1AP · dmg - · rng 0 · aura r3 · team:extendedClips3
  Everybody reload. Allies within 3 tiles pack Extended Clips for 3 rounds: +1 basic-attack range and +1 ATK stage.

## 🏥 Healing Magic `healingmagic` · kind discipline · 5 spells (T1 2 / T2 1 / T3 1 / T4 1)
desc: 
races (4): priest, angel, orb of light, starfish

- T1 **Soothe** `raceSoothe` · heal/heal · light · 25MP 1AP · dmg - · rng 3 · single · status:regen2 healAmt:80
  A hand on the brow. It does not fix you; it keeps you going. Heals an ally a MEDIUM amount and gives them Regen for 2 rounds.
- T1 **Triage** `passiveTriage` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Once per life, dropping under 40% HP heals 30% of max HP.
- T2 **Heal** `heal1` · heal/heal · light · 50MP 1AP · dmg - · rng 3 · single · heal:192
  Restores a LARGE amount of HP to a Single Ally. Heals more on allies below 40% HP.
- T3 **Heal All** `healAll` · heal/healAll · light · 75MP 1AP · dmg - · rng 0 · single · heal:140
  Restores a MEDIUM amount of HP to All Allies.
- T4 **Revive** `revive1` · heal/revive · light · 100MP 1AP · dmg - · rng 4 · single · revivePct:0.45
  Revives a fallen ally. Works once per unit per match.

## 👼 Heavenly Duties `angelic` · kind discipline · 8 spells (T1 1 / T2 4 / T3 2 / T4 1)
desc: 
races (4): angel, seraphim, fallen angel, nun

- T1 **Divine Light** `raceDivineLight` · heal/heal · light/magic · 25MP 1AP · dmg - · rng 3 · single · healAmt:140
  Restores a BIG amount of HP to a Single Ally, and every enemy standing next to that ally takes WEAK light damage.
- T2 **Choir** `passiveChoir` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Heals this unit casts are 15% stronger. Healing a Blessed ally also cleanses 1 debuff.
- T2 **Miracle** `raceWingsOfMercy` · movement/swap · - · 50MP 1AP · dmg - · rng 4 · single · 
  Swap places with an ally within 4 tiles; the ally arrives healed for a MEDIUM amount of HP.
- T2 **Purify** `racePurify` · heal/cleanseArea · light · 50MP 1AP · dmg - · rng 3 · aoe r1 · 
  A pillar of light over a 3×3 area up to 3 tiles away. Allies inside lose every debuff; enemies inside lose every buff.
- T2 **Rapture** `raceRapture` · effect/buff · - · 50MP 1AP CD2 · dmg - · rng 4 · single · status:protect1,levitating2
  The ally is lifted: Protect for a round and Levitating for 2 (flight and the high-ground bonus).
- T3 **Divine Judgment** `raceDivineJudgment` · damageEffect/cross · -/magic · 75MP 1AP · dmg 125 · rng 4 · cross r2 · status:burn2
  Deals MEDIUM magic damage to All Enemies in a cross-shaped AOE. Applies Burn.
- T3 **Sanctuary** `raceSanctuary` · heal/zoneHeal · - · 75MP 1AP · dmg - · rng 3 · aoe r1 · healPerTurn:90 zoneDuration:3
  Consecrate a 3x3 area for 2 turns. Allies standing in it heal each round.
- T4 **Divine Smite** `raceDivineSmite` · damage/damage · light/magic · 100MP 1AP · dmg 180 · rng 4 · single · 
  Deals HEAVY magic damage to a Single Enemy. Deals bonus damage to Unholy targets. The full weight of heaven, delivered.

## ✦ Hidden Technology `advancedtechnology` · kind discipline · 6 spells (T1 2 / T2 1 / T3 2 / T4 1)
desc: 
races (6): mad scientist, men in black, conspiracy theorist, gnome, professor, astronaut

- T1 **Deneuralizer** `raceDeneuralizer` · effect/debuff · psychic · 25MP 1AP · dmg - · rng 3 · single · status:jammed2
  Weakens a Single Enemy. Applies Jammed.
- T1 **Tesla Coil** `raceTeslaTrap` · deploy/deployObject · lightning · 25MP 1AP · dmg - · rng 2 · blast r1 · maxActivePerCaster:3 objectHp:20
  Deploy an electrified coil. Detonates when an enemy steps on it. 3×3 shock damage. Placing on an empty tile never ends your turn or uses your spell slot; throwing it directly onto an enemy shocks them on contact and ends your turn.
- T2 **Free Energy** `freeEnergy` · heal/manaRestoreAll · lightning · 50MP 1AP · dmg - · rng 0 · single · 
  Restores 40 MP to All Allies.
- T3 **Blue Beam** `raceBlueBeam` · damageEffect/aoe · light/magic · 75MP 1AP · dmg 125 · rng 5 · aoe r1 · status:discord1
  Holograms in the sky. Half of them panic; the other half kneel. Deals MEDIUM magic damage to All Enemies in a 3×3 and applies Discord.
- T3 **Classified Weapon** `raceClassifiedWeapon` · damage/damage · lightning/magic · 75MP 1AP · dmg 135 · rng 4 · single · finisher:jammed×1.5
  Deals MEDIUM magic damage to a Single Enemy. Deals bonus damage to Jammed targets.
- T4 **Railgun** `railgun` · damage/line · metal/physical · 100MP 1AP · dmg 160 · rng 5 · line w1 · finisher:jammed×1.5 ignoreArmor
  Deals HEAVY physical damage to All Enemies in a line. Ignores DEF. Deals bonus damage to Jammed targets.

## 👼⚔️ Holy Defense `holydefense` · kind discipline · 5 spells (T1 1 / T2 2 / T3 1 / T4 1)
desc: 
races (2): valkraye, crystal guardian

- T1 **Valkyrie Spear** `raceValkyrieSpear` · damageEffect/damage · -/physical · 25MP 1AP · dmg 100 · rng 2 · single · stage:def-1
  Deals MEDIUM physical damage to a Single Enemy. Lowers DEF by 1 stage.
- T2 **Holy Bulwark** `raceHolyBulwark` · effect/aoeShield · - · 50MP 1AP · dmg - · rng 3 · aoe r1 · shieldHp:160
  Grants a damage-absorbing shield to All Allies in an AOE.
- T2 **Shield Maiden** `raceShieldMaiden` · effect/buff · - · 50MP 1AP · dmg - · rng 0 · single · stage:def+1
  She plants the shield and calls them out. Raises the caster's DEF by 1 stage, and every enemy within 2 tiles is Provoked for a round — they must attack her.
- T3 **Divine Swoop** `raceDivineSwoop` · damageEffect/leapStrike · -/physical · 75MP 1AP · dmg 125 · rng 3 · single · status:stagger1 dmgPerLevel:20
  Leaps to a Single Enemy, dealing MEDIUM physical damage.
- T4 **Chooser of the Slain** `raceChooserOfSlain` · heal/revive · - · 100MP 2AP · dmg - · rng 4 · single · revivePct:0.6
  Revives a fallen ally. Works once per unit per match.

## 🐐 Horns & Hooves `horns` · kind discipline · 5 spells (T1 2 / T2 1 / T3 1 / T4 1)
desc: Gores, charges and roars from the horned beasts.
races (3): goatman, minotaur, krampus

- T1 **Gore Charge** `raceGoreCharge` · damageEffect/damage · -/physical · 25MP 1AP · dmg 100 · rng 3 · single · status:stagger1
  Deals MEDIUM physical damage to a Single Enemy. Applies Stagger. The caster charges into melee first.
- T1 **Horn Toss** `raceHornToss` · damage/displacement · -/physical · 25MP 1AP · dmg 80 · rng 1 · single · finisher:stagger×1.5 pushDistance:3 collisionBonus:60
  A true toss. Deals WEAK physical damage to a Single Enemy and throws it 3 tiles whichever way you pick (click the target, then a tile beside it). Slamming into something hurts more. Deals bonus damage to Staggered targets.
- T2 **Labyrinth Roar** `raceLabyrinthRoar` · effect/barrage · - · 50MP 1AP · dmg - · rng 0 · self-aoe r2 · status:discord2,taunt1
  The walls throw the bellow back from every direction. Every enemy within 2 tiles is Discorded and Taunted: they lose their heads and come for the horns.
- T3 **Horn Hook** `raceHornHook` · damageEffect/pull · -/physical · 75MP 1AP · dmg 110 · rng 3 · single · status:root1 pullDistance:2
  Hooked on the horns and dragged home. MEDIUM physical damage; they end the turn where the hooves are. Pulls the target 2 tiles toward the caster and Roots it.
- T4 **Bull Rush** `raceBullRush` · damage/dash · -/physical · 100MP 1AP · dmg 170 · rng 4 · single · finisher:discord×1.5 dashDamage:60
  Dashes through the battlefield. Deals bonus damage to targets with Discord. The caster charges into melee first.

## 🏇 Horseback Riding `horsebackriding` · kind discipline · 4 spells (T1 1 / T2 1 / T3 1 / T4 1)
desc: 
races (3): knight, king arthur, sheriff

- T1 **Brave Charge** `guardSlash` · damage/damage · -/physical · 25MP 1AP · dmg 100 · rng 4 · single · 
  Deals MEDIUM physical damage to a Single Enemy. The caster charges into melee first.
- T2 **Saddle Up** `raceSaddleUp` · effect/buff · - · 50MP 1AP CD3 · dmg - · rng 0 · single · status:overclock2 cleanse:2
  Mount up. The caster is Overclocked for 2 rounds (+1 ATK stage, +1 MOV) and cleansed of up to 2 debuffs.
- T3 **Ride-By** `raceRideBy` · damage/dash · -/physical · 75MP 1AP · dmg 110 · rng 4 · single · dashDamage:55
  Don't stop. Ride up to 4 tiles in a line: MEDIUM physical damage to the enemy at the end of the ride, and WEAK physical damage to every enemy passed.
- T4 **Lance** `raceLance` · damage/tackle · -/physical · 100MP 1AP · dmg 170 · rng 5 · single · pushDistance:2 collisionBonus:40
  Couched and level. Charges a Single Enemy up to 5 tiles away and drives it up to 2 tiles along the line. Deals HEAVY physical damage; crashing into a wall or another unit deals 40 more.

## 💪 Human Grit `humangrit` · kind discipline · 5 spells (T1 1 / T2 2 / T3 1 / T4 1)
desc: No powers, just nerve: adrenaline, stubbornness and elbow grease.
races (10): homosapien, cyborg, superhero, antihero, ki fighter, door agent, police officer, sidekick, astronaut, firefighter

- T1 **Elbow Grease** `raceElbowGrease` · damage/damage · metal/physical · 25MP 1AP · dmg 100 · rng 1 · single · 
  Deals MEDIUM physical damage to a Single Enemy. No tricks, no magic — just honest work.
- T2 **Adrenaline Rush** `raceAdrenalineRush` · heal/selfHeal · blood · 50MP 1AP · dmg - · rng 0 · single · stage:spd+1 selfHealPct:0.4 cleanse:2
  Restores 55% of the caster's max HP. Raises SPD by 1 stage.
- T2 **Second Wind** `passiveSecondWind` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Once per life, dropping under 35% HP heals 30% of max HP.
- T3 **Underdog Spirit** `raceUnderdogSpirit` · effect/buff · blood · 75MP 1AP · dmg - · rng 0 · single · stage:atk+2 cleanse:1
  Nobody believed in you. Good. Raises the caster's ATK by 2 stages and cleanses a debuff.
- T4 **Indomitable Will** `raceIndomitableWill` · effect/buff · blood · 100MP 1AP CD3 · dmg - · rng 0 · single · status:indomitable3
  Empowers the caster. For 3 rounds, the first blow that would kill you leaves you at 1 HP instead. Humanity's only superpower: refusing to die.

## 🏕️ Hunting Skills `huntingskills` · kind discipline · 4 spells (T1 1 / T2 2 / T3 1 / T4 0)
desc: 
races (3): cowboy, marksman, robinhood

- T1 **Snare** `raceSnare` · damage/placeTrap · nature/physical · 25MP 1AP · dmg 40 · rng 3 · single · maxActivePerCaster:2
  A loop of wire where the game walks. The first thing that steps in it is not going anywhere for 2 rounds. Hides a snare on an empty tile within 3; the enemy cannot see it. The first enemy to step on it takes WEAK physical damage and is Rooted for 2 rounds. Two snares per caster.
- T2 **Ambush** `passiveAmbush` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  The first damaging spell or basic attack it makes out of Invisible deals +40% damage.
- T2 **Camouflage** `camouflage` · effect/buff · nature · 50MP 1AP CD2 · dmg - · rng 0 · single · status:invisible1 stage:atk+1
  Go still in the brush. Invisible for a round, and the next shot comes from ambush: +1 ATK stage.
- T3 **Whistle** `raceWhistle` · deploy/summonUnit · nature · 75MP 1AP · dmg - · rng 1 · single · maxActivePerCaster:1 summonDef:{"key":"hound","name":"Hound","move":4,"dmg":60,"hits":3,"reveals":3}
  Two fingers, one whistle — the hound comes running to an adjacent tile. At the end of every round it runs 4 tiles toward the nearest enemy and bites for 60; anything invisible within 3 tiles of it is sniffed out. 3 hits to put it down. One hound per cowboy.

## ❄️ Ice Magic `ice` · kind discipline · 9 spells (T1 3 / T2 3 / T3 2 / T4 1)
desc: Freezes, slows and sliding floors.
races (3): wizard, yeti, ice queen

- T1 **Ice Spear** `raceIceSpear` · damageEffect/damage · ice/magic · 25MP 1AP · dmg 100 · rng 4 · single · status:slow2
  Deals MEDIUM magic damage to a Single Enemy. Applies Slow.
- T1 **Shatter** `raceShatter` · damage/damage · ice/magic · 25MP 1AP · dmg 100 · rng 4 · single · finisher:frozen×1.5
  Tap the ice and watch it go. MEDIUM magic damage — a Frozen target takes it through every crack.
- T1 **Snowborn** `passiveSnowborn` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  +1 M ATK stage while standing in a blizzard. The blizzard never blinds it, and it never slides on ice.
- T2 **Flash Freeze** `sharedFlashFreeze` · damageEffect/terrainCreate · ice/magic · 50MP 1AP · dmg 90 · rng 4 · tiles3 · status:frozen1 terrainType:ice
  Reshapes the battlefield — creates ice across 3 tiles (pick the orientation). Applies Frozen.
- T2 **Ice Slide** `raceIceSlide` · damage/dash · ice/physical · 50MP 1AP · dmg 130 · rng 4 · single · dashDamage:70 leaveTerrain:ice
  Dashes through the battlefield, dealing MEDIUM physical damage to enemies along the path. Leaves ice behind.
- T2 **Summon Blizzard** `sharedSummonBlizzard` · deploy/summonWeather · ice · 50MP 1AP · dmg - · rng 4 · single · weatherType:blizzard
  Summons blizzard weather that chases units, BLINDING those it batters. Frozen victims take extra damage.
- T3 **Diamond Dust** `raceDiamondDust` · damageEffect/cross · ice/magic · 75MP 1AP · dmg 125 · rng 4 · cross r2 · status:slow2 leaveTerrain:ice
  Deals MEDIUM magic damage to All Enemies in an X-shaped AOE. Applies Slow. Leaves ice behind.
- T3 **Permafrost** `racePermafrost` · damageEffect/terrainCreate · ice/magic · 75MP 2AP CD2 · dmg 120 · rng 3 · aoe r1 · status:frozen2 terrainType:ice
  Deep-freezes a 3×3 area into ice terrain. Enemies caught take MEDIUM magic damage and are FROZEN solid. Seeds and deployables in the area are destroyed; living trees die on the spot.
- T4 **Absolute Zero** `raceAbsoluteZero` · damageEffect/damage · ice/magic · 100MP 2AP CD2 · dmg 180 · rng 3 · single · status:frozen2
  Stop every molecule in the target's body. The world whites out, a crystal lattice locks around them, and time itself freezes before the shatter. Deals HEAVY magic damage to a Single Enemy and FREEZES them solid. Cooldown: 2 rounds.

## 👑 Infernal Court `infernalcourt` · kind discipline · 7 spells (T1 1 / T2 2 / T3 3 / T4 1)
desc: The rule of hell: decrees, conscriptions and dark crowns.
races (3): demon prince, demon princess, overlord

- T1 **Hellfire Crown** `raceHellfireCrown` · effect/buff · - · 25MP 1AP CD2 · dmg - · rng 0 · single · 
  One crown, whoever wears it. Raises the caster's ATK or M ATK by 1 stage — whichever is higher.
- T2 **Infernal Conscription** `raceInfernalConscription` · damageEffect/pull · -/magic · 50MP 1AP · dmg 60 · rng 4 · single · status:stagger1 pullDistance:3
  Report for duty. Deals WEAK magic damage to a Single Enemy, drags them 3 tiles toward the caster and Staggers them.
- T2 **Infernal Decree** `raceInfernalDecree` · damageEffect/aoe · -/magic · 50MP 1AP · dmg 100 · rng 3 · aoe r1 · status:burn2
  Deals MEDIUM magic damage to All Enemies in an AOE. Applies Burn.
- T3 **Dark Dominion** `raceDarkDominion` · damageEffect/aoe · -/magic · 75MP 1AP · dmg 135 · rng 4 · aoe r1 · status:burn2 finisher:burn,stagger×1.5
  Deals MEDIUM magic damage to All Enemies in an AOE. Applies Burn. Deals bonus damage to Staggered targets.
- T3 **Dark Lullaby** `raceDarkLullaby` · damageEffect/aoe · -/magic · 75MP 1AP · dmg 125 · rng 4 · aoe r1 · status:silence1 finisher:silence×1.5
  Deals MEDIUM magic damage to All Enemies in an AOE. Applies Silence. Deals bonus damage to targets with Silence.
- T3 **Kiss of Decay** `raceKissOfDecay` · damageEffect/lifeDrain · poison/magic · 75MP 1AP · dmg 125 · rng 3 · single · status:poison3 finisher:poison×1.5 drainPct:0.4
  Deals MEDIUM magic damage to a Single Enemy. Applies Poison. Deals bonus damage to targets with Poison. Heals the caster for part of the damage dealt.
- T4 **Cataclysm Decree** `raceCataclysmDecree` · damage/delayed · -/magic · 100MP 1AP · dmg 160 · rng 5 · aoe r1 · finisher:burn×1.5 delayTurns:1 leaveTerrain:lava terrainDeform:{"centerDelta":-2,"edgeDelta":-1}
  Marks a zone. After 1 turn, deals HEAVY magic damage to All Enemies inside (AOE). Leaves lava tiles behind. Reshapes the ground on impact. Deals bonus damage to Burning targets.

## 🐜 Insectoid Anatomy `insectoid` · kind discipline · 6 spells (T1 2 / T2 2 / T3 1 / T4 1)
desc: 
races (4): mantid, antperson, voidweaver, bee queen

- T1 **Mandible Strike** `raceMandibleStrike` · damage/multiHit · -/physical · 25MP 1AP · dmg - · rng 1 · single · hitDamages:[45,45,45]
  Deals MEDIUM physical damage to a Single Enemy across 3 hits.
- T1 **Venom Fang** `raceVenomFang` · damageEffect/damage · poison/physical · 25MP 1AP · dmg 100 · rng 1 · single · status:poison3 finisher:poison×1.5
  Deals MEDIUM physical damage to a Single Enemy and Poisons them. A second bite on an envenomed target finds the vein.
- T2 **Brood** `raceBrood` · deploy/summonUnit · poison · 50MP 1AP · dmg - · rng 1 · single · maxActivePerCaster:1 summonDef:{"key":"drone","name":"Drone","move":4,"dmg":55,"hits":3,"hitStatus":{"id":"poison","duration":2}}
  One is never found alone. Hatches a Drone beside the caster: at the end of every round it flies 4 tiles at the nearest enemy and stings for 55, Poisoning it for 2 rounds. Three hits to bring it down.
- T2 **Chitin Armor** `raceChitinArmor` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  A shell that does not flinch: +8 DEF, and Stagger never takes hold.
- T3 **Tunnel Network** `raceTunnelNetwork` · deploy/deployPair · - · 75MP 1AP · dmg - · rng 4 · single · maxActivePerCaster:1
  Dig a tunnel: one mouth beside you, one where you point (within 4). An ally standing at either mouth attacks and casts as if it stood at the other. One tunnel per caster; three hits collapse both mouths.
- T4 **Swarm Signal** `raceSwarmSignal` · effect/warCry · - · 100MP 1AP · dmg - · rng 0 · aura r2 · stage:atk+2
  The signal goes out. Everything with legs comes running. Every ally within 2 tiles gains +2 ATK stages and +1 MOV for 2 rounds.

## 🛜 Internet Addiction `internetaddiction` · kind discipline · 4 spells (T1 2 / T2 1 / T3 1 / T4 0)
desc: 
races (1): conspiracy theorist

- T1 **Doomscroll** `raceDoomscroll` · effect/debuff · psychic · 25MP 1AP · dmg - · rng 4 · single · status:discord2
  They read the comments. All of them. A Single Enemy within 4 tiles is Discorded for 2 rounds: ATK down 2 stages and DEF down 1.
- T1 **Terminally Online** `passiveTerminallyOnline` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  +14 AWR and +40 MP.
- T2 **Rabbit Hole** `raceRabbitHole` · movement/teleport · - · 50MP 1AP · dmg - · rng 3 · single · teleportDistance:3
  Three hours later you are somewhere else entirely. Teleports the caster to an unoccupied tile within 3.
- T3 **Ratio'd** `raceRatiod` · damageEffect/debuff · psychic/magic · 75MP 1AP · dmg 125 · rng 4 · single · stage:atk-1 finisher:discord×1.5
  The whole internet piles on. Deals MEDIUM magic damage to a Single Enemy and lowers their ATK by 1 stage. Deals bonus damage to targets with Discord.

## 🪼 Jellyfish `jellyfish` · kind discipline · 6 spells (T1 2 / T2 2 / T3 1 / T4 1)
desc: 
races (1): jellyfish

- T1 **Jelly Drift** `passiveJellyDrift` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Swims, and +1 SPD stage while standing in water. Enemies it hits while they stand in water are Slowed for a round.
- T1 **Sting** `raceJellySting` · damageEffect/damage · water/magic · 25MP 1AP · dmg 90 · rng 2 · single · status:poison2 finisher:wet×1.5
  A tentacle brushes past. Deals WEAK water damage and Poisons the target. The venom runs faster through wet skin: bonus damage to Soaked targets and to anything standing in water.
- T2 **Bloom** `raceJellyBloom` · damageEffect/aoe · water/magic · 50MP 1AP · dmg 100 · rng 3 · aoe r1 · status:wet2
  A thousand of them at once. Deals MEDIUM magic damage to every enemy in a 3×3 within 3 tiles and leaves them Wet for 2 rounds.
- T2 **Ocean Current** `raceJellyDrift` · movement/teleport · water · 50MP 1AP · dmg - · rng 3 · single · teleportDistance:3
  Go where the current goes. Drift to any tile within 3 — the bell folds, the water carries it, it opens again.
- T3 **Nematocyst Net** `raceJellyNet` · damageEffect/damage · water/magic · 75MP 1AP · dmg 125 · rng 3 · single · status:root2
  The skirt of tentacles closes. Deals MEDIUM magic damage to a Single Enemy within 3 tiles and Roots them for 2 rounds.
- T4 **Immortal Cycle** `raceJellyRebirth` · heal/selfHeal · water · 100MP 1AP CD4 · dmg - · rng 0 · single · selfHealPct:0.5 cleanse:2
  Turritopsis. The bell collapses back into a polyp and grows again: restores 50% of max HP and cleanses 2 debuffs. Once every 4 rounds.

## 🏙️ Kaiju Rampage `kaiju` · kind discipline · 4 spells (T1 1 / T2 1 / T3 1 / T4 1)
desc: City-sized monsters: stomps, atomic breath and thrown skyscrapers.
races (2): kaiju, king kong

- T1 **Car Toss** `raceCarToss` · damage/damage · -/physical · 25MP 1AP · dmg 100 · rng 4 · single · ignoresLineOfSight
  Whatever was parked there. Deals MEDIUM physical damage to a Single Enemy, over any wall.
- T2 **Cataclysm Stomp** `raceCataclysmStomp` · damageEffect/aoe · -/physical · 50MP 2AP · dmg 100 · rng 0 · self-aoe r2 · status:stagger1 terrainDeform:{"centerDelta":-2,"edgeDelta":-1}
  Deals MEDIUM physical damage to All Enemies in an AOE. Applies Stagger.
- T3 **Skyscraper Toss** `raceSkyscraperToss` · damage/aoe · -/physical · 75MP 1AP · dmg 125 · rng 5 · aoe r1 · ignoresLineOfSight terrainDeform:{"centerDelta":-1,"edgeDelta":-1}
  Deals MEDIUM physical damage to All Enemies in an AOE. Fires through cover.
- T4 **Atomic Breath** `raceAtomicBreath` · damage/line · fire/physical · 100MP 1AP · dmg 160 · rng 5 · line w1 · finisher:stagger×1.5
  Unleash a searing torrent of blue atomic fire, dealing HEAVY magic damage to All Enemies in a line. Deals bonus damage to Staggered targets.

## 💥 Ki Energy `ki` · kind discipline · UNIQUE to ki fighter · 6 spells (T1 1 / T2 3 / T3 1 / T4 1)
desc: 
races (1): ki fighter

- T1 **Ki Volley** `raceKiBlast` · damage/multiHit · light/physical · 25MP 1AP · dmg - · rng 4 · single · hitDamages:[33,33,34]
  Deals MEDIUM magic damage to a Single Enemy across 3 hits.
- T2 **Ki Charge** `raceKiCharge` · effect/buff · light · 50MP 1AP · dmg - · rng 0 · single · stage:atk+1 shield:96
  Breathe in. Hold. Raises the caster's ATK by 1 stage and wraps them in a 96-point ki barrier.
- T2 **Ki Wave** `raceKiWave` · damage/line · light/physical · 50MP 1AP · dmg 110 · rng 5 · line w1 · 
  Deals MEDIUM magic damage to All Enemies in a line.
- T2 **Rising Power** `passiveRisingPower` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  +1 ATK stage every 3 rounds. The stages fall away at death.
- T3 **Instant Transmission** `raceInstantTransmission` · movement/teleport · arcane · 75MP 1AP · dmg - · rng 5 · single · teleportDistance:5
  Teleports the caster to an unoccupied tile within range.
- T4 **Spirit Bomb** `raceSpiritBomb` · damage/delayed · light/magic · 100MP 2AP · dmg 160 · rng 5 · aoe r1 · delayTurns:1
  Lend me your energy. Marks a 3×3 within 5 tiles; at the end of the round it lands for HEAVY magic damage to everything inside.

## ♞ Knighthood `knight` · kind discipline · 4 spells (T1 1 / T2 1 / T3 1 / T4 1)
desc: 
races (3): knight, king arthur, valkraye

- T1 **Chivalry** `raceChivalry` · utility/guard · light · 25MP 1AP CD2 · dmg - · rng 4 · single · 
  Pledge to protect an ally. The next time that ally is targeted by an attack, you dash to their side and take the hit in their place.
- T2 **Shield Bash** `raceShieldBash` · damageEffect/damage · metal/physical · 50MP 1AP · dmg 110 · rng 1 · single · status:stagger1
  Edge of the shield, under the chin. Deals MEDIUM physical damage to an adjacent enemy and Staggers them: they lose 1 AP.
- T3 **Oath of Valor** `raceOathOfValor` · effect/warCry · light · 75MP 1AP · dmg - · rng 0 · aura r2 · stage:atk+1,def+1
  Every ally within 2 tiles gains +1 ATK and +1 DEF stage.
- T4 **Crusade** `raceCrusade` · damage/cross · light/physical · 100MP 1AP · dmg 160 · rng 0 · cross r2 · 
  Deus vult. Deals HEAVY physical damage to All Enemies in an X around the knight, and bonus damage to Unholy targets.

## ✨ Light `light` · kind element · 9 spells (T1 3 / T2 2 / T3 3 / T4 1)
desc: Radiance, healing and blinding.
races (7): priest, nordic, angel, seraphim, orb of light, chosen one, nun

- T1 **Aurora Ray** `raceAuroraRay` · damageEffect/aoe · light/magic · 25MP 1AP · dmg 80 · rng 5 · aoe r1 · stage:def-1 finisher:stun×1.5
  Deals WEAK magic damage to All Enemies in an AOE. Lowers DEF by 1 stage. Deals bonus damage to targets with Stun.
- T1 **Consecrated** `passiveConsecrated` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Once per life, dropping under 35% HP heals 20% of max HP and sheds 1 debuff.
- T1 **Smite** `raceSmite` · damage/damage · light/magic · 25MP 1AP · dmg 100 · rng 4 · single · 
  Deals MEDIUM magic damage to a Single Enemy, and bonus damage to Unholy targets.
- T2 **Light Shield** `racePleiadianShield` · effect/aoeShield · light · 50MP 1AP · dmg - · rng 3 · aoe r0 · stage:def+1 shieldHp:220
  Grants a damage-absorbing shield to All Allies in an AOE. Raises DEF by 1 stage.
- T2 **Protect** `protect1` · effect/buff · light · 50MP 1AP CD3 · dmg - · rng 3 · single · status:protect1
  Empowers a Single Ally. Applies Protect. Cooldown: 3 rounds.
- T3 **Judgment** `judgment` · damage/cross · light/magic · 75MP 1AP CD2 · dmg 135 · rng 1 · cross r3 · finisher:slow×1.5
  Deals MEDIUM physical damage to All Enemies in a cross-shaped AOE. Cooldown: 2 rounds. Deals bonus damage to Slowed targets.
- T3 **Luminous Shield** `raceLuminousShield` · effect/aoeShield · - · 75MP 1AP · dmg - · rng 3 · aoe r1 · shieldHp:140
  Grants a damage-absorbing shield to All Allies in an AOE.
- T3 **Prism Burst** `racePrismBurst` · damage/ricochet · light/magic · 75MP 1AP · dmg 125 · rng 4 · single · 
  Deals MEDIUM magic damage to a Single Enemy, then bounces to nearby enemies.
- T4 **Merkaba** `raceMerkaba` · damage/aoe · light/magic · 100MP 1AP CD2 · dmg 160 · rng 4 · aoe r1 · finisher:burn×1.5
  Summon the sacred chariot: counter-rotating star tetrahedra spin up over the battlefield, gather three rings of light, and collapse into a detonation. Deals HEAVY magic damage to All Enemies in an AOE. Cooldown: 2 rounds. Deals bonus damage to Burning targets.

## ⚡ Lightning Magic `lightning` · kind discipline · 6 spells (T1 2 / T2 2 / T3 1 / T4 1)
desc: Shocks, stuns and chain hits.
races (2): wizard, mothman

- T1 **Live Wire** `passiveLiveWire` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Basic attacks and physical spells are lightning-element, so a Soaked target takes ×1.5.
- T1 **Static Shock** `raceStaticShock` · damageEffect/damage · lightning/magic · 25MP 1AP · dmg 100 · rng 4 · single · status:stagger1
  A crack of static across the gap. MEDIUM magic damage, and the jolt costs them an action.
- T2 **Summon Thunderstorm** `thunderstorm` · deploy/summonWeather · lightning · 50MP 1AP · dmg - · rng 4 · single · weatherType:thunderstorm
  Summons a thunderstorm for 3 to 5 rounds. Each round it chases the nearest grounded enemy up to 2 tiles. Every enemy it passes over is Soaked for 2 rounds, then struck for WEAK lightning damage (Soaked targets take half again). Flyers are skipped. −5 DEF in the eye.
- T2 **Thunderbolt** `thunder1` · damage/damage · lightning/magic · 50MP 1AP · dmg 130 · rng 4 · single · 
  One bolt, one target. Deals MEDIUM magic damage to a Single Enemy. Soaked targets take half again.
- T3 **Chain Lightning** `raceChainLightning` · damage/damage · lightning/magic · 75MP 1AP · dmg 130 · rng 4 · single · chainProfile:[130,85,50]
  It never wanted just one of you. Deals MEDIUM magic damage to a Single Enemy, then jumps to up to 2 more enemies within 2 tiles of the last, weaker with each jump.
- T4 **Tempest** `raceTempest` · damageEffect/aoe · lightning/magic · 100MP 2AP CD2 · dmg 160 · rng 4 · aoe r1 · status:stun1 groundsFlyers
  Call the sky down on the lot of them. HEAVY magic damage to a 3x3; everything in it is Stunned for a round and flyers are knocked out of the air.

## 🗿 Living Stone `livingstone` · kind discipline · 5 spells (T1 1 / T2 2 / T3 1 / T4 1)
desc: Stoneform, gargoyle walls and golem skin: the body turned to rock.
races (3): gargoyle, golem, crystal guardian

- T1 **Unweathered** `passiveUnweathered` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Never Burned, and +5 armor.
- T2 **Stone Skin** `raceStoneSkin` · effect/buff · - · 50MP 1AP · dmg - · rng 0 · single · stage:def+1
  Empowers the caster. Raises DEF by 1 stage.
- T2 **Stoneform** `raceStoneform` · effect/buff · earth · 50MP 1AP · dmg - · rng 0 · single · status:stoneform2
  The gargoyle turns to stone for 2 rounds: it cannot move or act, takes no damage at all, and regenerates 15% of its max HP every round.
- T3 **Calcify** `raceCalcify` · effect/debuff · earth · 75MP 1AP · dmg - · rng 3 · single · stage:int-2
  Turn the target's thoughts to stone. Grey creeps up from their skull as the mind petrifies — lowers M ATK by 2 stages.
- T4 **Petrify** `racePetrify` · effect/debuff · earth · 100MP 1AP CD2 · dmg - · rng 3 · single · status:stun2 stage:def-1
  Grey climbs from the feet up. For two rounds they are a statue; when it lets go, the cracks stay. Stuns a Single Enemy for 2 rounds and lowers DEF by 1 stage. Cooldown: 2 rounds.

## ⚙️ Machinery `machinery` · kind discipline · 2 spells (T1 1 / T2 0 / T3 1 / T4 0)
desc: 
races (2): robot, honda civic

- T1 **Hydraulic Punch** `raceHydraulicPunch` · damage/damage · -/physical · 25MP 1AP · dmg 100 · rng 1 · single · finisher:jammed×1.5 pushDistance:2
  Deals MEDIUM physical damage to a Single Enemy. Deals bonus damage to targets with Jammed. Knocks the target back 2 tiles.
- T3 **Hydraulic Crush** `raceHydraulicCrush` · damage/damage · metal/physical · 75MP 1AP · dmg 135 · rng 1 · single · finisher:jammed,stagger×1.5
  Deals MEDIUM physical damage to a Single Enemy. Deals bonus damage to Jammed targets.

## 🌟 Main Character Energy `maincharacter` · kind discipline · 7 spells (T1 2 / T2 1 / T3 3 / T4 1)
desc: Sad backstories, plot armor and prophecies that come true.
races (2): swordfighter, chosen one

- T1 **Dark Feather** `raceDarkFeather` · damageEffect/dash · -/physical · 25MP 1AP · dmg 100 · rng 3 · single · status:stagger1
  One black feather falls. Then he is already there. Deals MEDIUM physical damage to a Single Enemy and Staggers them.
- T1 **Sad Backstory** `raceSadBackstory` · effect/buff · psychic · 25MP 1AP · dmg - · rng 0 · single · stage:atk+1
  It all comes back. Raises the caster's ATK by 1 stage — by 2 stages while under 50% HP.
- T2 **Plot Armor** `racePlotArmor` · effect/buff · light · 50MP 1AP CD3 · dmg - · rng 0 · single · status:indomitable1
  The hero cannot die yet. The next killing blow leaves the caster at 1 HP instead.
- T3 **Blessed Blade** `raceBlessedBlade` · damage/aoe · light/physical · 75MP 1AP · dmg 135 · rng 1 · aoe r1 · 
  Deals MEDIUM physical damage to All Enemies in an AOE.
- T3 **Prophecy Fulfilled** `raceProphecyFulfilled` · effect/buff · - · 75MP 1AP CD2 · dmg - · rng 0 · single · status:overclock2 cleanse:99
  It was written. Everything written before it is struck out. The caster is Overclocked for 2 rounds and cleansed of every debuff.
- T3 **To Be Continued** `raceToBeContinued` · damage/damage · metal/physical · 75MP 1AP · dmg 135 · rng 3 · single · 
  Deals MEDIUM physical damage to a Single Enemy. Marks the target: the hit lands at the end of the round, but only while your team can still see them.
- T4 **Roll Credits** `raceRollCredits` · damage/damage · -/physical · 100MP 1AP · dmg 180 · rng 2 · single · finisher:stagger×1.5
  This is the part where it ends. Deals HEAVY physical damage to a Single Enemy. Deals bonus damage to Staggered targets.

## 🎯 Marksmanship `marksmanship` · kind discipline · 5 spells (T1 2 / T2 1 / T3 1 / T4 1)
desc: 
races (3): marksman, robinhood, sheriff

- T1 **Kneecap Shot** `kneecapShot` · damageEffect/damage · metal/physical · 25MP 1AP · dmg 80 · rng 5 · single · status:root1
  Deals WEAK physical damage to a Single Enemy. Applies Rooted.
- T1 **Overwatch** `passiveOverwatch` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Basic attacks reach 1 tile further. +14 AWR.
- T2 **Long Rifle** `raceQuickDraw` · damage/damage · metal/physical · 50MP 1AP · dmg 110 · rng 5 · single · 
  Shoulder the long rifle. Deals MEDIUM physical damage to a Single Enemy up to 5 tiles away.
- T3 **Precision Shot** `precisionShot` · damage/damage · metal/physical · 75MP 1AP · dmg 125 · rng 5 · single · finisher:root×1.5
  Deals MEDIUM physical damage to a Single Enemy. Deals bonus damage to targets with Rooted.
- T4 **Take Aim** `headshot` · damage/damage · metal/physical · 100MP 1AP · dmg 180 · rng 5 · single · finisher:stun,root×1.5 ignoreArmor
  Deals HEAVY physical damage to a Single Enemy. Ignores DEF. Deals bonus damage to targets with Stun. Marks the target: the hit lands at the end of the round, but only while your team can still see them. A target at 15% HP or less is killed outright.

## 🥋 Martial Arts `martialarts` · kind discipline · 5 spells (T1 2 / T2 1 / T3 1 / T4 1)
desc: 
races (3): ki fighter, super sentai, luchador

- T1 **Flurry of Blows** `raceFlurryOfBlows` · damage/multiHit · wind/physical · 25MP 1AP · dmg - · rng 1 · single · hitDamages:[25,25,25,25]
  Deals MEDIUM physical damage to a Single Enemy across 4 hits.
- T1 **Haymaker** `haymaker` · damage/displacement · -/physical · 25MP 1AP · dmg 100 · rng 1 · single · finisher:stagger×1.5 collisionBonus:40
  Deals MEDIUM physical damage to a Single Enemy. Shoves the target sideways. Deals bonus damage to targets with Rooted.
- T2 **Roundhouse Kick** `raceRoundhouseKick` · damageEffect/barrage · -/physical · 50MP 1AP · dmg 100 · rng 0 · self-aoe r1 · status:stagger1
  Everyone in reach. Deals MEDIUM physical damage to All Enemies in the 3×3 around you and Staggers each of them.
- T3 **Pressure Point** `racePressurePoint` · damageEffect/damage · -/physical · 75MP 1AP CD2 · dmg 100 · rng 1 · single · status:stun1
  Two fingers. Lights out. Deals MEDIUM physical damage to an adjacent enemy and Stuns them for a round. Cooldown: 2 rounds.
- T4 **Dragon Fist** `raceDragonFist` · damage/damage · fire/physical · 100MP 1AP · dmg 180 · rng 2 · single · finisher:stun×1.5
  Deals HEAVY physical damage to a Single Enemy.

## 🚀 Mech Pilot Skills `mecha` · kind discipline · 4 spells (T1 1 / T2 1 / T3 1 / T4 1)
desc: 
races (1): mech

- T1 **Mortar Salvo** `raceMortarSalvo` · damage/aoe · -/physical · 25MP 1AP · dmg 80 · rng 5 · aoe r1 · ignoresLineOfSight
  Deals WEAK physical damage to All Enemies in an AOE. Fires through cover.
- T2 **Siege Mode** `raceSiegeMode` · effect/buff · - · 50MP 1AP · dmg - · rng 0 · single · status:siegeMode3
  Anchors down. Everything in range is a target. For 3 rounds the caster gains +1 ATK stage and +2 RNG, and loses 2 MOV.
- T3 **Eject!** `raceEject` · movement/escape · - · 75MP 1AP · dmg - · rng 0 · single · selfHealPct:0.2 teleportDistance:3 cleanse:99
  Punch out. The pilot escapes up to 3 tiles, sheds every debuff and the frame restores 20% of max HP.
- T4 **Full Burst** `raceFullBurst` · damage/aoe · -/physical · 100MP 2AP CD2 · dmg 150 · rng 5 · aoe r2 · ignoresLineOfSight
  Every hardpoint on the frame, at once. Deals HEAVY physical damage to All Enemies in a 5×5 within 5 tiles. Fires through cover.

## 🧘 Meditation `meditation` · kind discipline · 4 spells (T1 1 / T2 1 / T3 1 / T4 1)
desc: 
races (2): cult leader, hippie

- T1 **Deep Breath** `raceDeepBreath` · heal/selfHeal · - · 25MP 1AP · dmg - · rng 0 · single · healAmt:100 cleanse:1
  In through the nose. Restores a MEDIUM amount of HP to the caster and cleanses 1 debuff.
- T2 **Inner Peace** `cleanse` · heal/cleanse · light · 50MP 1AP · dmg - · rng 3 · single · stage:mdef+1
  Removes every debuff from a Single Ally and raises their M DEF by 1 stage.
- T3 **Mantra** `raceMantra` · effect/warCry · light · 75MP 1AP · dmg - · rng 0 · aura r2 · team:regen3 cleanse:2
  One word, everyone breathing it. Every ally within 2 tiles gains Regen for 3 rounds and is cleansed of 2 debuffs.
- T4 **Awakening** `raceAwakening` · effect/buff · light · 100MP 2AP CD3 · dmg - · rng 0 · single · stage:atk+2,spd+2 selfHealPct:0.3 cleanse:99
  The prophecy stops being about you and starts being you. Cleanses everything, restores 30% HP, and raises ATK and SPD by 2 stages.

## 🪖 Military Combat `militarysupport` · kind discipline · 10 spells (T1 5 / T2 2 / T3 2 / T4 1)
desc: 
races (4): marksman, mech, general, politician

- T1 **Fortify** `fortify` · effect/shield · - · 25MP 1AP · dmg - · rng 2 · single · shield:96
  Grants a damage-absorbing shield to a Single Ally.
- T1 **Iron Discipline** `passiveIronDiscipline` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  30% chance to counterattack when struck in melee. Other allies within 2 tiles gain +5 DEF.
- T1 **Rally Command** `raceRallyCommand` · effect/warCry · - · 25MP 1AP · dmg - · rng 0 · aoe r2 · stage:atk+1
  Empowers All Allies nearby. Raises ATK by 1 stage.
- T1 **Suppressive Fire** `raceSuppressiveFire` · damageEffect/line · metal/physical · 25MP 1AP · dmg 80 · rng 4 · line w1 · status:slow2
  Deals WEAK physical damage to All Enemies in a line. Applies Slow.
- T1 **Suppressive Fire** `raceSuppressingFire` · damageEffect/line · metal/physical · 25MP 1AP · dmg 80 · rng 4 · line w1 · status:slow2
  Deals WEAK physical damage to All Enemies in a line. Applies Slow.
- T2 **Iron Bulwark** `raceIronBulwark` · effect/warCry · - · 50MP 1AP · dmg - · rng 0 · aura r2 · stage:def+1,mdef+1
  Shields up. Every ally within 2 tiles gains +1 DEF and +1 M DEF stage.
- T2 **Rangefinder** `raceRangefinder` · utility/remoteView · metal · 50MP 1AP · dmg - · rng 8 · single · 
  Glass a distant area of the map, granting vision for several turns. Every barrage starts with a spotter.
- T3 **Artillery Strike** `raceArtilleryStrike` · damage/aoe · -/physical · 75MP 1AP · dmg 125 · rng 6 · aoe r1 · leaveTerrain:scorched ignoresLineOfSight terrainDeform:{"centerDelta":-2,"edgeDelta":-1}
  Fire mission, danger close. Deals MEDIUM physical damage to every enemy in a 3×3 up to 6 tiles away, over any cover. Leaves scorched ground and a crater.
- T3 **Iron Dome** `shieldBash` · effect/aoeShield · - · 75MP 1AP · dmg - · rng 0 · self-aoe r2 · shieldHp:160
  Iron Dome up. Every ally within 2 tiles gets a 160-point shield.
- T4 **Fire for Effect** `raceFireForEffect` · damage/delayed · fire/physical · 100MP 2AP · dmg 160 · rng 6 · aoe r2 · finisher:burn×1.5 delayTurns:1 leaveTerrain:scorched terrainDeform:{"centerDelta":-2,"edgeDelta":-1}
  Calls in the whole battery on a marked grid. After 1 turn, deals HEAVY physical damage to All Enemies inside (AOE). Leaves scorched tiles behind. Reshapes the ground on impact. Deals bonus damage to Burning targets.

## 🪞 Mirror Magic `mirrormagic` · kind discipline · 4 spells (T1 1 / T2 1 / T3 1 / T4 1)
desc: 
races (1): rabbit

- T1 **Mirror Shard** `raceMirrorShard` · damage/ricochet · arcane/magic · 25MP 1AP · dmg 80 · rng 4 · single · 
  A sliver of the glass. It finds the next face too. Deals WEAK magic damage to a Single Enemy, then bounces to another enemy within 2 tiles for half.
- T2 **Seven Years** `raceSevenYears` · damageEffect/damage · arcane/magic · 50MP 1AP · dmg 100 · rng 4 · single · status:hexed2
  You broke it. You know the rule. Deals MEDIUM magic damage to a Single Enemy and Hexes them for 2 rounds.
- T3 **Shattered Mirror** `raceShatteredMirror` · damageEffect/aoe · arcane/magic · 75MP 1AP · dmg 125 · rng 4 · aoe r1 · status:blind1
  Every shard, every eye. Deals MEDIUM magic damage to All Enemies in a 3×3 within 4 tiles and Blinds them for a round.
- T4 **Hall of Mirrors** `raceHallOfMirrors` · damageEffect/aoe · arcane/magic · 100MP 1AP CD2 · dmg - · rng 4 · aoe r1 · zoneDuration:3
  Nine of you, and none of them is the door. Lays a 3×3 zone within 4 tiles for 3 rounds: every enemy inside at the end of each round takes WEAK magic damage and is Blinded for a round.

## 🦟 Mothman `mothman` · kind discipline · 4 spells (T1 1 / T2 1 / T3 1 / T4 1)
desc: 
races (1): mothman

- T1 **Red Eyes** `raceRedEyes` · effect/debuff · - · 25MP 1AP · dmg - · rng 4 · single · status:marked3
  Weakens a Single Enemy. Applies Marked.
- T2 **Premonition** `racePremonition` · effect/buff · - · 50MP 1AP CD2 · dmg - · rng 4 · single · status:protect1 stage:spd+1
  It saw the bridge go. It tells one of you to step back. A Single Ally within 4 tiles gains Protect for a round and +1 SPD stage.
- T3 **Harbinger** `raceHarbinger` · effect/aoe · - · 75MP 1AP · dmg - · rng 4 · aoe r1 · status:marked2,discord2
  Everything in the square is on the list. Every enemy in a 3×3 within 4 tiles is Marked and Discorded for 2 rounds.
- T4 **Prophecy of Disaster** `raceProphecyOfDisaster` · damage/delayed · -/magic · 100MP 2AP · dmg 160 · rng 5 · aoe r2 · finisher:discord×1.5 delayTurns:1 groundsFlyers
  The mothman foretells the disaster: marks a 5×5 zone. At the end of the round a METEOR STORM falls on it — HEAVY magic damage to everything inside, flyers knocked from the sky. Deals bonus damage to targets with Discord.

## 🌿 Nature Magic `nature` · kind discipline · 6 spells (T1 2 / T2 2 / T3 1 / T4 1)
desc: Growth, seeds and thorns.
races (7): shaman, fairy, bigfoot, scarecrow, mushroom girl, tree person, hippie

- T1 **Herbal Remedy** `raceHerbalRemedy` · heal/heal · nature · 25MP 1AP · dmg - · rng 3 · single · healAmt:160 cleanse:2
  Restores a BIG amount of HP to a Single Ally and cleanses 2 debuffs.
- T1 **Photosynthesis** `passivePhotosynthesis` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Regenerates 5% of max HP at the end of every round while standing on grass or forest.
- T2 **Into the Green** `raceTreelineRetreat` · movement/escape · nature · 50MP 1AP · dmg - · rng 0 · single · status:regen2 teleportDistance:3
  Step back into the undergrowth. Teleport up to 3 tiles and Regen for 2 rounds.
- T2 **Trunk Throw** `trunkThrow` · damage/damage · nature/physical · 50MP 1AP · dmg 100 · rng 4 · single · 
  Deals MEDIUM physical damage to a Single Enemy.
- T3 **Entangling Roots** `raceEntanglingRoots` · damageEffect/aoe · nature/magic · 75MP 1AP · dmg 125 · rng 4 · aoe r1 · status:root1
  The ground remembers what it grew. Deals MEDIUM magic damage to All Enemies in a 3×3 and Roots them for a round.
- T4 **Rejuvenation** `raceRejuvenation` · heal/healAll · nature · 100MP 2AP CD2 · dmg - · rng 0 · aura r3 · team:regen2 healAmt:120 cleanse:1
  Everything green in you wakes up at once. Every ally within 3 tiles heals a MEDIUM amount of HP, is cleansed of 1 debuff and gains Regen for 2 rounds. Cooldown: 2 rounds.

## 😵 Necromancy `necromancy` · kind discipline · 5 spells (T1 1 / T2 2 / T3 1 / T4 1)
desc: 
races (2): anubis, necromancer

- T1 **Life Drain** `raceSoulDrain` · damage/lifeDrain · -/magic · 25MP 1AP · dmg 100 · rng 3 · single · finisher:root×1.5 drainPct:0.35
  Deals MEDIUM magic damage to a Single Enemy. Deals bonus damage to targets with Rooted. Heals the caster for part of the damage dealt.
- T2 **Plaguefield** `racePlaguefield` · terrain/terrainCreate · - · 50MP 1AP · dmg - · rng 4 · aoe r1 · terrainType:plague_flesh
  Corrupt a 3x3 area into a PERMANENT mass of plague-ridden flesh. Anyone (except the necromancer) who ends their turn standing on it is poisoned.
- T2 **Rigormortis** `raceRigormortis` · damageEffect/aoe · -/magic · 50MP 1AP · dmg 80 · rng 4 · aoe r1 · status:root2
  Deals WEAK magic damage to All Enemies in an AOE. Applies Rooted.
- T3 **Bone Barrage** `raceBoneBarrage` · damageEffect/aoe · -/magic · 75MP 1AP · dmg 125 · rng 4 · aoe r1 · stage:def-1
  Deals MEDIUM magic damage to All Enemies in an AOE. Lowers DEF by 1 stage.
- T4 **Raise the Dead** `raceRaiseDead` · deploy/raiseDead · - · 100MP 2AP · dmg - · rng 4 · single · 
  Reanimate the remains of the fallen — target an ally's gravestone or an enemy's pile of bones to raise a mindless flesh abomination. At the end of every round it attacks the nearest unit, friend or foe, until destroyed (3 hits). The consumed corpse can never be revived.

## 🫧 Ooze Biology `ooze` · kind discipline · 6 spells (T1 2 / T2 2 / T3 1 / T4 1)
desc: Goo shots, ooze trails, absorbing and splitting.
races (2): black goo, symbiote

- T1 **Goo Shot** `raceGooShot` · damageEffect/damage · poison/magic · 25MP 1AP · dmg 90 · rng 4 · single · status:goo2
  Spit a glob of black goo up to 4 tiles. The target is Gooed FIRST (heals halved, −1 MOV, magic hits ×1.25) and then takes MEDIUM magic damage through it; the tile under them turns to ooze for 3 rounds.
- T1 **Ooze Trail** `raceOozeTrail` · terrain/terrainCreate · - · 25MP 1AP · dmg - · rng 4 · tiles1 · status:slow1 terrainType:swamp
  Spit a glob of black ooze onto one tile. It oozes outward over the ground and downhill. Enemies caught in the slick are slowed.
- T2 **Absorb** `raceAbsorb` · damage/lifeDrain · -/magic · 50MP 1AP · dmg 130 · rng 1 · single · finisher:poison,goo×1.5 drainPct:0.4
  Deals MEDIUM magic damage to a Single Enemy. Deals bonus damage to Poisoned or Gooed targets. Heals the caster for part of the damage dealt.
- T2 **Icky Surprise** `raceIckySurprise` · movement/teleport · poison · 50MP 1AP · dmg - · rng 6 · single · 
  Melt into the floor and erupt from any ooze tile within 6 — no line of sight needed. Only ooze will do.
- T3 **Toxic Nova** `raceToxicNova` · damageEffect/barrage · poison/magic · 75MP 2AP · dmg 125 · rng 0 · self-aoe r2 · status:poison3
  Deals MEDIUM magic damage to All Enemies in an AOE. Applies Poison.
- T4 **Mitosis** `raceMitosisSplit` · deploy/summonUnit · poison · 100MP 1AP · dmg - · rng 1 · single · maxActivePerCaster:1 summonDef:{"key":"blob","name":"Blob","move":3,"dmg":70,"hits":4,"armored":true,"trailTerrain":{"terrain":"swamp","rounds":3}}
  Two of it now. Containment will want to know. Splits off a Blob that fights beside you; every tile it crawls off turns to ooze for 3 rounds.

## 🏴‍☠️ Piracy `piracy` · kind discipline · 7 spells (T1 3 / T2 2 / T3 1 / T4 1)
desc: 
races (1): pirate

- T1 **Anchor** `raceAnchor` · effect/debuff · metal · 25MP 1AP · dmg - · rng 3 · single · status:root2 groundsFlyers
  Weakens a Single Enemy. Applies Rooted.
- T1 **Plunder** `racePlunder` · damage/utility · metal/physical · 25MP 1AP · dmg 100 · rng 1 · single · 
  Strike an adjacent enemy and steal a random item or 1 Key from them.
- T1 **Sea Legs** `passiveSeaLegs` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Swims, and +1 ATK and +1 DEF stage while standing in water.
- T2 **Land Ho** `raceBoardingRush` · damage/damage · metal/physical · 50MP 1AP · dmg 130 · rng 3 · single · finisher:root×1.5
  Deals MEDIUM physical damage to a Single Enemy. Deals bonus damage to targets with Rooted. The caster charges into melee first.
- T2 **Walk the Plank** `raceWalkThePlank` · damage/terrainCreate · water/physical · 50MP 1AP · dmg 90 · rng 3 · tiles1 · terrainType:deep_water
  Force enemies overboard. Deep water erupts on one tile, overflowing the ground around it and drowning all caught in the spread. Executes any enemy below 25% HP.
- T3 **Yo Ho** `raceYoHo` · heal/healAll · water · 75MP 2AP · dmg - · rng 0 · single · stage:atk+1,int-1 healAmt:130 cleanse:2
  Restores a MEDIUM amount of HP to All Allies. Lowers M ATK by 1 stage. Raises ATK by 1 stage.
- T4 **Cannonball** `raceCannonball` · damageEffect/aoe · fire/physical · 100MP 1AP · dmg 160 · rng 5 · aoe r1 · status:burn1
  Deals HEAVY physical damage to All Enemies in an AOE. Applies Burn.

## ☠️ Poison Abilities `poison` · kind element · 8 spells (T1 5 / T2 1 / T3 1 / T4 1)
desc: Toxins, corrosion and rot.
races (10): reptilian, zombie, antperson, demon princess, ghoul, black goo, necromancer, bee queen, mushroom girl, goblin

- T1 **Corrosive Splash** `raceCorrosiveSplash` · damageEffect/aoe · poison/magic · 25MP 1AP · dmg 80 · rng 3 · aoe r1 · status:poison2
  Deals WEAK magic damage to All Enemies in an AOE. Applies Poison.
- T1 **Formic Acid** `raceFormicAcid` · damageEffect/line · poison/magic · 25MP 1AP · dmg 80 · rng 4 · line w1 · stage:def-1 finisher:poison×1.5 leaveTerrain:poison
  Deals WEAK magic damage to All Enemies in a line. Lowers DEF by 1 stage. Deals bonus damage to targets with Poison. Leaves poison behind.
- T1 **Infectious Bite** `raceInfectiousBite` · damageEffect/damage · poison/physical · 25MP 1AP · dmg 100 · rng 1 · single · status:poison3
  Deals MEDIUM physical damage to a Single Enemy. Applies Poison.
- T1 **Poison Swamp** `sharedPoisonSwamp` · damage/terrainCreate · poison/magic · 25MP 1AP · dmg 80 · rng 3 · tiles1 · terrainType:poison
  Conjure a poison spring on one tile. The toxin overflows onto the surrounding ground and runs downhill. Enemies caught in the spreading poison take damage; the terrain poisons anyone who wades through.
- T1 **Venomous** `passiveVenomous` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Every physical hit Poisons the target for a round.
- T2 **Splash** `raceSplash` · damageEffect/barrage · poison/magic · 50MP 1AP · dmg 60 · rng 0 · self-aoe r1 · status:goo2
  Burst outward. Deals WEAK magic damage to All Enemies in the 3×3 around you and Goos them; the whole 3×3 turns to ooze for 3 rounds.
- T3 **Rot** `raceRot` · damageEffect/damage · poison/magic · 75MP 1AP · dmg 125 · rng 4 · single · status:poison2,grievous2
  It does not heal. Deals MEDIUM magic damage to a Single Enemy; the wound Poisons and will not close — healing on them is halved.
- T4 **Miasma** `raceMiasma` · damageEffect/aoe · poison/magic · 100MP 2AP CD2 · dmg 160 · rng 4 · aoe r2 · status:poison3 finisher:poison×1.5 leaveTerrain:poison
  The air goes green. HEAVY magic damage to a 5x5, Poison on all of it, and the middle stays poisoned after. Deals bonus damage to targets with Poison. The centre 3x3 turns to poison ground.

## 👮🏾 Police Training `policetraining` · kind discipline · 6 spells (T1 2 / T2 2 / T3 1 / T4 1)
desc: 
races (2): police officer, sheriff

- T1 **Ballistic Vest** `passiveBallisticVest` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  +5 armor. Once per life, dropping under 30% HP heals 25% of max HP.
- T1 **Nightstick** `racePoliceNightstick` · damageEffect/damage · metal/physical · 25MP 1AP · dmg 85 · rng 1 · single · status:stagger1
  The baton comes off the belt. Deals WEAK physical damage to an adjacent enemy and Staggers them.
- T2 **Pepper Spray** `racePoliceSpray` · damageEffect/aoe · metal/magic · 50MP 1AP · dmg 45 · rng 2 · aoe r1 · status:blind2
  A can of it, straight in the eyes. Deals LIGHT magic damage to every enemy in a 3×3 within 2 tiles and Blinds them for 2 rounds.
- T2 **Taser** `racePoliceTaser` · damageEffect/damage · metal/magic · 50MP 1AP CD2 · dmg 70 · rng 3 · single · status:stun1
  Two prongs, fifty thousand volts. Deals WEAK magic damage to a Single Enemy within 3 tiles and Stuns them for a round.
- T3 **Cuffed** `racePoliceCuffs` · damageEffect/damage · metal/physical · 75MP 1AP · dmg 100 · rng 1 · single · status:root2,stagger1
  Hands behind your back. Deals MEDIUM physical damage to an adjacent enemy, Roots them for 2 rounds and Staggers them.
- T4 **Lockdown** `racePoliceLockdown` · damageEffect/aoe · metal/physical · 100MP 1AP · dmg 150 · rng 3 · aoe r1 · status:root1,slow2
  Nobody in, nobody out. Deals HEAVY physical damage to every enemy in a 3×3 within 3 tiles; they are Rooted for a round and Slowed for 2.

## 🏛️ Politics `politics` · kind discipline · 4 spells (T1 1 / T2 1 / T3 1 / T4 1)
desc: 
races (1): politician

- T1 **Filibuster** `raceFilibuster` · effect/zoneDebuff · - · 25MP 1AP · dmg - · rng 3 · aoe r1 · status:silence1 zoneDuration:2
  I yield the floor to NO ONE. 3×3 zone for 2 turns. Enemies inside are silenced.
- T2 **Campaign Promise** `raceCampaignPromise` · effect/debuff · - · 50MP 1AP · dmg - · rng 4 · single · status:charm1
  Look them in the eye and promise everything. A Single Enemy within 4 tiles is Charmed for a round.
- T3 **Executive Order** `raceExecutiveOrder` · effect/aoe · - · 75MP 1AP CD2 · dmg - · rng 4 · aoe r1 · status:stun1
  Signed, sealed, effective immediately. Every enemy in a 3×3 within 4 tiles is Stunned for a round.
- T4 **Nuclear Option** `sharedNuke` · damage/delayed · fire/magic · 100MP 2AP CD2 · dmg 180 · rng 5 · aoe r2 · delayTurns:2 leaveTerrain:scorched terrainDeform:{"centerDelta":-3,"edgeDelta":-1}
  The football is open. Mark the grid; two rounds later there is no grid. HEAVY magic damage to everything in a 5×5, buildings included.

## 👻 Poltergeist Abilities `haunted` · kind discipline · 5 spells (T1 2 / T2 1 / T3 1 / T4 1)
desc: 
races (4): shadow entity, skeleton, ghost, jack o lantern

- T1 **Grave Chill** `raceGraveChill` · damageEffect/damage · ice/magic · 25MP 1AP · dmg 100 · rng 3 · single · status:slow1
  A skull-shaped bolt of grave cold. Deals MEDIUM magic damage to a Single Enemy. Applies Slow.
- T1 **Haunt** `raceHaunt` · effect/debuff · shadow · 25MP 1AP · dmg - · rng 5 · single · status:haunted3
  A restless spirit sinks into a Single Enemy. Applies Haunted: 28 magic damage at the end of every round for 3 rounds, armor ignored. Boo hits Haunted targets harder.
- T2 **Cold Spot** `raceColdSpot` · effect/zoneDebuff · ice · 50MP 1AP · dmg - · rng 4 · aoe r1 · status:frozen1 zoneDuration:2
  Opens a cold spot over a 3×3 for 2 rounds. Enemies inside are Frozen.
- T3 **Possession** `racePossession` · effect/possess · psychic · 75MP 1AP CD3 · dmg - · rng 3 · single · status:possessed2
  Steals a Single Enemy's body: for its next activation the enemy unit is YOURS — move it, attack with it, cast with it. Applies Possessed. Bosses cannot be possessed.
- T4 **Boo** `raceBoo` · damageEffect/damage · psychic/magic · 100MP 1AP · dmg 180 · rng 2 · single · status:discord2 finisher:haunted×1.5
  Deals HEAVY magic damage to a Single Enemy. Lowers ATK by 2 stages and DEF by 1 stage. Deals bonus damage to Haunted targets.

## 🔷 Prism Lattice `prismlattice` · kind discipline · 5 spells (T1 2 / T2 1 / T3 1 / T4 1)
desc: Prisms, light frequencies and the lattice that fires through them.
races (3): machine elves, ice queen, crystal guardian

- T1 **Mirror Blink** `raceMirrorBlink` · movement/teleport · arcane · 25MP 1AP · dmg - · rng 3 · single · teleportDistance:3
  Fold through the light and blink to any tile within 3 — reposition inside your own lattice, or slip out of a collapsing trap.
- T1 **Prism Mirror** `racePrismMirror` · deploy/placeMirror · arcane · 25MP 1AP · dmg - · rng 4 · single · maxActivePerCaster:8
  Fold a laser-reflecting prism into being on an empty tile (up to 8) for just 1 AP. Folding never ends your turn or uses your spell slot, so you can fold another, Pulse Lattice, move or attack with the AP you have left. Beams auto-connect any of your prisms that share a row or column — enemies that path through a beam are seared, and enemies still standing in one at end of round take burn damage. A prism is sturdy glass: it takes two hits to shatter.
- T2 **Pulse Lattice** `racePulseLattice` · utility/pulseLattice · arcane · 50MP 2AP CD2 · dmg - · rng 0 · single · 
  Discharge the lattice (needs 3+ prisms): every enemy caught on a beam takes a burst in the current frequency. 4+ prisms across 2+ elevations enclose a 3-D volume — everyone inside is hit and the burst is amplified. 8 prisms in a perfect rectangular prism unleash a massive detonation through the whole volume.
- T3 **Tune Frequency** `raceTuneFrequency` · utility/tuneFrequency · arcane · 75MP 1AP CD1 · dmg - · rng 0 · single · 
  Shift your whole lattice to the next light frequency — Infrared (fire, burns), Ultraviolet (arcane, shreds DEF), or Gamma (charged, slows) — changing what every one of your beams does. Only once per round.
- T4 **Shatter the Lattice** `raceShatterLattice` · damage/pulseLattice · arcane · 100MP 2AP CD2 · dmg 80 · rng 0 · single · 
  Eight panes. One note. Every prism you have standing bursts: each enemy within 1 tile of a prism takes MEDIUM magic damage in the current frequency (Infrared: Burn 2; Ultraviolet: DEF down 1 stage; Gamma: Slow 1). Then every one of your prisms is gone. Needs at least 1 prism. Cooldown: 2 rounds.

## 😵‍💫 Psychedelics `psychadelic` · kind discipline · 5 spells (T1 1 / T2 0 / T3 3 / T4 1)
desc: 
races (4): shaman, machine elves, mushroom girl, hippie

- T1 **Dosed** `raceDosed` · damageEffect/damage · psychic/magic · 25MP 1AP · dmg 80 · rng 3 · single · status:slow2
  Something in the drink. Their feet stop agreeing with them. Deals WEAK magic damage to a Single Enemy and Slows them for 2 rounds.
- T3 **Ayahuasca Retreat** `raceAyahuascaRetreat` · effect/buff · nature · 75MP 2AP · dmg - · rng 0 · single · stage:mdef+1 selfHealPct:0.5 cleanse:99
  The caster restores 50% of max HP, cleanses every debuff and raises M DEF by 1 stage.
- T3 **Bad Trip** `raceBadTrip` · damageEffect/damage · psychic/magic · 75MP 1AP · dmg 125 · rng 3 · single · status:slow1 finisher:slow,voodoo×1.5
  Deals MEDIUM magic damage to a Single Enemy. Applies Slow. Deals bonus damage to targets with Slow or Voodoo.
- T3 **Contact High** `raceContactHigh` · effect/warCry · psychic · 75MP 1AP · dmg - · rng 0 · aura r2 · stage:int+1,spd+1
  Everyone in the tent is on something. Every ally within 2 tiles gains +1 M ATK and +1 SPD stage.
- T4 **Ego Death** `sharedEgoDeath` · damageEffect/damage · psychic/magic · 100MP 2AP CD2 · dmg 180 · rng 3 · single · status:stun1
  Dissolve the target's sense of self entirely. The world drains away, the colour wheel spins, and what is left of "them" implodes into white light. Deals HEAVY magic damage to a Single Enemy and Stuns them while the pieces reassemble. Cooldown: 2 rounds.

## 🔮 Psychic Abilities `psychic` · kind discipline · 9 spells (T1 3 / T2 2 / T3 3 / T4 1)
desc: Mind, telekinesis and confusion.
races (7): telepath, nordic, grey, mantid, mothman, dreameater, occulus

- T1 **Kinetic Hurl** `kineticHurl` · damage/displacement · psychic/magic · 25MP 1AP · dmg 100 · rng 3 · single · collisionBonus:64
  Deals MEDIUM magic damage to a Single Enemy. Shoves the target sideways.
- T1 **Psychic Beam** `racePsychicBeam` · damageEffect/line · -/magic · 25MP 1AP · dmg 80 · rng 4 · line w1 · status:discord1
  Deals WEAK magic damage to All Enemies in a line. Lowers ATK by 2 stages and DEF by 1 stage.
- T1 **Telepathic Link** `raceTelepathicLink` · effect/warCry · psychic · 25MP 1AP · dmg - · rng 3 · aura r3 · stage:int+1
  Empowers All Allies nearby. Raises M ATK by 1 stage.
- T2 **Psychic Barrier** `racePsychicBarrier` · effect/shield · psychic · 50MP 1AP · dmg - · rng 3 · single · shield:200
  Shields a Single Ally for 200 HP.
- T2 **Psychosis** `psychosis` · effect/debuff · psychic · 50MP 1AP · dmg - · rng 4 · single · status:discord2 stage:mdef-1
  Two voices, then four, then all of them. A Single Enemy is Discorded for 2 rounds and its M DEF drops by 1 stage.
- T3 **Migraine** `raceMindCrush` · damageEffect/damage · psychic/magic · 75MP 1AP · dmg 135 · rng 4 · single · stage:int-1 finisher:discord×1.5
  Deals MEDIUM magic damage to a Single Enemy. Lowers M ATK by 1 stage. Deals bonus damage to targets with Discord.
- T3 **Telekinetic Slam** `raceTelekineticSlam` · damage/pull · psychic/magic · 75MP 1AP · dmg 125 · rng 4 · single · pullDistance:3 groundsFlyers
  Grab them with your mind and drag them the whole way — through whatever is between you. Flyers come down first. Deals MEDIUM magic damage to a Single Enemy and pulls it 3 tiles toward the caster.
- T3 **Teleport** `teleport` · movement/teleport · arcane · 75MP 1AP · dmg - · rng 4 · single · 
  Warp any unit (self, ally or enemy) to any unoccupied tile within range. Third Eye trims its cost.
- T4 **Mind Shatter** `mindShatter` · damageEffect/aoe · psychic/magic · 100MP 1AP · dmg 160 · rng 3 · aoe r1 · status:silence1 finisher:silence×1.5
  Deals HEAVY magic damage to All Enemies in a 3×3 and Silences them. Deals bonus damage to Silenced targets.

## 🦾 Robotic Hardware `robot` · kind discipline · 9 spells (T1 2 / T2 3 / T3 2 / T4 2)
desc: 
races (5): robot, android, cyborg, droid, honda civic

- T1 **Faraday Cage** `passiveFaradayCage` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Never Jammed. Jammed enemies within 2 tiles take 20 damage at the end of every round.
- T1 **Rocket Fist** `raceRocketFist` · damage/damage · -/physical · 25MP 1AP · dmg 100 · rng 3 · single · pushDistance:2
  Deals MEDIUM physical damage to a Single Enemy. Knocks the target back 2 tiles.
- T2 **Overclock** `overclock` · effect/buff · lightning · 50MP 1AP · dmg - · rng 3 · single · status:overclock2
  Empowers a Single Ally. Raises ATK by 1 stage and MOV by 1.
- T2 **Overclock** `raceOverclock` · effect/buff · lightning · 50MP 1AP · dmg - · rng 3 · single · status:overclock2
  Empowers a Single Ally. Raises ATK by 1 stage and MOV by 1.
- T2 **Self-Repair Protocol** `raceSelfRepairProtocol` · heal/selfHeal · - · 50MP 1AP · dmg - · rng 0 · single · selfHealPct:0.45 cleanse:2
  Restores 35% of the caster's max HP.
- T3 **Kill Mode** `raceChassisSlam` · damageEffect/aoe · metal/physical · 75MP 1AP CD2 · dmg 125 · rng 0 · self-aoe r2 · status:stagger1
  Weapons free. Deals MEDIUM physical damage to All Enemies around the caster (AOE).
- T3 **Kill Mode** `raceChassisSlan` · damageEffect/aoe · metal/physical · 75MP 1AP CD2 · dmg 125 · rng 0 · self-aoe r2 · status:stagger1
  Weapons free. Deals MEDIUM physical damage to All Enemies around the caster (AOE).
- T4 **EMP Burst** `empBurst` · damageEffect/aoe · lightning/magic · 100MP 1AP CD2 · dmg 160 · rng 0 · self-aoe r2 · status:jammed1
  Deals HEAVY magic damage to All Enemies around the caster (AOE). Applies Jammed.
- T4 **EMP Burst** `raceEmpPulse` · damageEffect/aoe · lightning/magic · 100MP 1AP CD2 · dmg 160 · rng 0 · self-aoe r2 · status:jammed1
  Deals HEAVY magic damage to All Enemies around the caster (AOE). Applies Jammed.

## 🤖 Robotic Weapons `cyberpunkweapons` · kind discipline · 5 spells (T1 2 / T2 1 / T3 1 / T4 1)
desc: 
races (4): robot, android, mech, cyborg

- T1 **Synthetic Blade** `raceSyntheticBlade` · damageEffect/damage · -/physical · 25MP 1AP · dmg 100 · rng 1 · single · stage:def-1 finisher:jammed×1.5
  Deals MEDIUM physical damage to a Single Enemy. Lowers DEF by 1 stage. Deals bonus damage to targets with Jammed.
- T1 **Taser Bolt** `raceTaserBolt` · damageEffect/damage · lightning/magic · 25MP 1AP · dmg 70 · rng 3 · single · status:jammed1
  Two prongs into the housing. Systems stutter. Deals WEAK magic damage to a Single Enemy and Jams it for a round.
- T2 **Cluster Rockets** `raceClusterRockets` · damageEffect/aoe · fire/magic · 50MP 1AP · dmg 110 · rng 4 · aoe r1 · status:stagger1
  A shoulder rack of rockets rains on a 3×3. Deals MEDIUM magic damage to All Enemies in an AOE. Applies Stagger.
- T3 **Plasma Cannon** `racePlasmaCannon` · damageEffect/line · fire/magic · 75MP 1AP · dmg 125 · rng 4 · line w2 · status:burn1
  The arm morphs into a cannon and fires a beam two tiles wide. Deals MEDIUM magic damage to All Enemies in the line. Applies Burn.
- T4 **To the Moon** `raceRocketToss` · damage/skyThrow · -/physical · 100MP 1AP · dmg 150 · rng 1 · single · dmgPerLevel:25 carryHeight:6 collisionBonus:50
  Grabs the target, rockets skyward and hurls them AT THE MOON. The moon loses. Deals HEAVY physical damage plus the fall, more if the landing crushes another unit; the moon's debris rains on the landing. Caster must be flying.

## 🪢 Ropework `ropework` · kind discipline · 5 spells (T1 2 / T2 1 / T3 1 / T4 1)
desc: 
races (4): homosapien, pirate, cowboy, ringmaster

- T1 **Grapple** `raceGrapple` · utility/utility · metal · 25MP 1AP · dmg - · rng 3 · single · 
  Fire a grappling hook. Hook a wall, a door or an ally within 3 and pull yourself to the tile beside it. No damage.
- T1 **Lasso** `raceLasso` · movement/pull · metal · 25MP 1AP · dmg - · rng 3 · single · status:tethered2 pullDistance:2 groundsFlyers
  Rope an enemy and yank them 2 tiles toward you — then keep the rope on. For 2 rounds they are Roped: they cannot move on their own and are dragged behind you wherever you go, taking 20 damage per tile. Hauls flyers down to the dirt where they belong.
- T2 **Hogtie** `raceHogtie` · effect/debuff · - · 50MP 1AP · dmg - · rng 1 · single · status:root2,stagger1
  Hands and feet. Roots an adjacent enemy for 2 rounds and Staggers it for 1 round. No damage.
- T3 **Rescue Line** `raceRescueLine` · movement/pull · metal · 75MP 1AP · dmg - · rng 4 · single · pullDistance:3 cleanse:1
  Grab hold. Haul a Single Ally within 4 up to 3 tiles toward you and cleanse 1 debuff. No damage, no fall.
- T4 **Round Up** `raceRoundUp` · movement/aoePull · metal · 100MP 1AP CD3 · dmg - · rng 0 · self-aoe r2 · status:tethered1 pullDistance:2 pullToCenter
  Bring 'em in. Every enemy within 2 tiles is pulled 2 tiles toward you and Tethered for 1 round. No damage. Cooldown: 3 rounds.

## 👣 Sasquatch Abilties `sasquatch` · kind discipline · 3 spells (T1 1 / T2 1 / T3 0 / T4 1)
desc: 
races (2): bigfoot, yeti

- T1 **Big Kick** `raceBigKick` · damage/damage · earth/physical · 25MP 1AP · dmg 100 · rng 1 · single · pushDistance:2
  Deals MEDIUM physical damage to a Single Enemy and kicks them 2 tiles back.
- T2 **Timber Stomp** `raceTimberStomp` · damageEffect/aoe · earth/physical · 50MP 1AP · dmg 100 · rng 0 · self-aoe r1 · status:stagger1
  One foot down. Everything adjacent staggers. Deals MEDIUM physical damage to All Enemies around the caster and applies Stagger.
- T4 **Sasquatch Smash** `raceSasquatchSmash` · damage/damage · earth/physical · 100MP 1AP · dmg 180 · rng 1 · single · finisher:stagger×1.5
  Deals HEAVY physical damage to a Single Enemy. The photo would have been blurry anyway. Deals bonus damage to Staggered targets.

## 🧑‍🌾🐦‍⬛ Scarecrow Abilities `scarecrow` · kind discipline · UNIQUE to scarecrow · 5 spells (T1 2 / T2 1 / T3 1 / T4 1)
desc: 
races (1): scarecrow

- T1 **Harvest Hook** `raceHarvestHook` · damage/pull · -/physical · 25MP 1AP · dmg 80 · rng 4 · single · pullDistance:4
  Deals WEAK physical damage to a Single Enemy. Pulls the target toward the caster.
- T1 **Restuffing** `passiveRestuffing` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Regenerates 5% of max HP at the end of every round.
- T2 **Stuffed Double** `raceStuffedDouble` · deploy/deployObject · - · 50MP 1AP · dmg - · rng 1 · single · maxActivePerCaster:1 objectHp:1
  A second scarecrow, stuffed in a hurry. Sets a straw double on a tile beside you: every enemy within 2 tiles of it is Provoked for 2 rounds and must swing at it while it stands — and when the straw comes apart, every enemy beside it is Feared.
- T3 **Scare Off** `raceScareOff` · effect/barrage · shadow · 75MP 1AP · dmg - · rng 0 · self-aoe r2 · status:feared1,discord2
  That is what it is for. Every enemy within 2 tiles is Feared for a round and shaken for two. Applies Feared (1 round) and Discord (2 rounds); no damage.
- T4 **Crow Storm** `raceCrowStorm` · damageEffect/aoe · shadow/magic · 100MP 1AP · dmg 160 · rng 4 · aoe r1 · status:discord2 finisher:hexed×1.5
  Deals HEAVY magic damage to All Enemies in an AOE and lowers ATK by 2 stages and DEF by 1 stage. Deals bonus damage to Hexed targets.

## 💋 Seduction `seduction` · kind discipline · 6 spells (T1 3 / T2 1 / T3 1 / T4 1)
desc: 
races (7): succubus, catgirl, siren, demon princess, barbarella, popstar, bunny girl

- T1 **Love Bite** `raceLoveBite` · damageEffect/damage · blood/physical · 25MP 1AP · dmg 100 · rng 1 · single · stage:def-1
  Deals MEDIUM physical damage to a Single Enemy. Lowers the target's DEF by 1 stage.
- T1 **Showmanship** `passiveShowmanship` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Charm it applies lasts 1 round longer, and the charmed enemy also loses 1 ATK stage.
- T1 **Soul Suck** `raceSoulSuck` · damage/lifeDrain · -/magic · 25MP 1AP · dmg 100 · rng 2 · single · finisher:charm×1.5 drainPct:0.5
  Kiss them and take what they came with. Deals MEDIUM magic damage to a Single Enemy and heals the caster for half. Deals bonus damage to Charmed targets.
- T2 **Charm** `raceCharm` · effect/debuff · - · 50MP 1AP CD2 · dmg - · rng 3 · single · status:charm2
  Weakens a Single Enemy. Applies Charm.
- T3 **Enthrall** `raceEnthrall` · effect/possess · psychic · 75MP 1AP CD3 · dmg - · rng 2 · single · status:possessed2 finisher:charm×2
  Bends a Single Enemy to the succubus' will: its next activation is YOURS — two activations if the target is Charmed. Applies Possessed. Bosses cannot be enthralled.
- T4 **Draining Embrace** `raceDrainingEmbrace` · damage/lifeDrain · -/magic · 100MP 1AP · dmg 180 · rng 2 · single · finisher:charm×1.5 drainPct:0.6
  Deals HEAVY magic damage to a Single Enemy. Heals the caster for part of the damage dealt. Deals bonus damage to Charmed targets.

## 🌈 Sentai Colors `sentai` · kind discipline · 6 spells (T1 2 / T2 2 / T3 1 / T4 1)
desc: One color, one move: red, blue, black, yellow, pink and the Megazord.
races (1): super sentai

- T1 **Pink Healing** `sentaiPinkHeal` · heal/heal · - · 25MP 1AP · dmg - · rng 4 · single · healAmt:140
  Restores a MEDIUM amount of HP to a Single Ally.
- T1 **Red Slash** `sentaiRedSlash` · damageEffect/damage · fire/physical · 25MP 1AP · dmg 100 · rng 1 · single · status:burn1
  Deals MEDIUM physical damage to a Single Enemy. Applies Burn.
- T2 **Black Guard** `sentaiBlackGuard` · effect/buff · - · 50MP 1AP CD2 · dmg - · rng 0 · single · status:protect2
  Empowers the caster. Applies Protect. Cooldown: 2 rounds.
- T2 **Yellow Thunder** `sentaiYellowThunder` · damageEffect/aoe · lightning/magic · 50MP 1AP · dmg 100 · rng 3 · aoe r1 · status:stagger1
  Deals MEDIUM magic damage to All Enemies in an AOE. Applies Stagger.
- T3 **Blue Wave** `sentaiBlueWave` · damageEffect/line · -/magic · 75MP 1AP · dmg 125 · rng 4 · line w1 · status:slow1
  Deals MEDIUM magic damage to All Enemies in a line. Applies Slow.
- T4 **Megazord Blast** `sentaiMegazordBlast` · damage/aoe · -/magic · 100MP 2AP · dmg 180 · rng 4 · aoe r1 · finisher:burn×1.5
  Deals HEAVY magic damage to All Enemies in an AOE. Deals bonus damage to targets with Burn.

## 🌑 Shadow `shadow` · kind element · 9 spells (T1 2 / T2 4 / T3 2 / T4 1)
desc: Darkness, fear and the void.
races (10): shadow entity, demon, ghost, dreameater, halfdemon, voidweaver, cosmic wraith, chosen one, ghoul, clown

- T1 **Shadow Crush** `raceShadowBind` · damageEffect/damage · shadow/magic · 25MP 1AP · dmg 100 · rng 3 · single · status:slow2 finisher:slow×1.5
  Deals MEDIUM magic damage to a Single Enemy. Applies Slow. Deals bonus damage to targets with Slow.
- T1 **Umbral** `passiveUmbral` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  The first basic attack it makes each round while Invisible is a guaranteed crit.
- T2 **Fear** `raceFear` · effect/barrage · shadow · 50MP 1AP · dmg - · rng 0 · self-aoe r3 · status:feared1
  Let them see what you are. Every enemy within 3 tiles is Feared for a round: on its next activation it can only flee from you, then its turn ends.
- T2 **Phase Shift** `racePhaseShift` · effect/buff · - · 50MP 1AP CD2 · dmg - · rng 0 · single · status:invisible2
  Empowers the caster. Applies Invisible. Cooldown: 2 rounds.
- T2 **Shadow Infiltration** `raceShadowInfiltration` · damageEffect/dash · shadow/physical · 50MP 1AP · dmg 110 · rng 3 · single · 
  Dashes in and deals MEDIUM physical damage to a Single Enemy, then the caster turns Invisible for a round.
- T2 **Shadow Step** `raceShadowStep` · movement/teleport · shadow · 50MP 1AP CD2 · dmg - · rng 4 · single · teleportDistance:4
  Blink through shadow up to 4 tiles. Ignores line of sight. Needs 2 rounds to gather shadow between blinks.
- T3 **Consuming Dark** `raceConsumingDark` · damage/aoe · shadow/magic · 75MP 1AP · dmg 125 · rng 4 · aoe r1 · finisher:feared×1.5
  The dark eats first what is already running. MEDIUM magic damage to a 3×3; Feared targets take it worse.
- T3 **Void Rush** `voidRush` · damage/teleport · shadow/magic · 75MP 1AP · dmg 135 · rng 4 · aoe r1 · finisher:feared×1.5 teleportDistance:4
  Teleports the caster, then deals MEDIUM magic damage to All Enemies around the arrival tile (AOE).
- T4 **Shadow Realm** `raceShadowRealm` · effect/shadowRealm · shadow · 100MP 2AP CD3 · dmg - · rng 3 · single · status:shadowRealm2
  Drags a Single Enemy into the Shadow Realm with the demon for 2 rounds: to everyone else the two of you are gone — invisible, untargetable, immune to everything not from each other, beyond any healer's reach. In there, it is just you and them.

## 🔊 Sonic `sonic` · kind element · 10 spells (T1 4 / T2 2 / T3 3 / T4 1)
desc: Sound, shockwaves and screams.
races (3): siren, mermaid, popstar

- T1 **Discordance** `discordance` · effect/debuff · sonic · 25MP 1AP · dmg - · rng 3 · single · status:discord2
  Sows dissonance in a Single Enemy: lowers ATK by 2 stages and DEF by 1 stage for 2 turns.
- T1 **Resonant Voice** `passiveResonantVoice` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Sonic spells cast at range reach 1 tile farther.
- T1 **Siren Song** `raceSirenSong` · movement/pull · sonic · 25MP 1AP · dmg - · rng 4 · single · pullDistance:3 groundsFlyers
  An irresistible melody hooks a Single Enemy and drags it up to 3 tiles toward the siren — straight through any hazards on the way, and flyers are sung right out of the sky.
- T1 **Sonic Boomerang** `raceSonicBoomerang` · damage/line · sonic/magic · 25MP 1AP · dmg 50 · rng 4 · line w1 · 
  Hurl a scything crescent of sound down a line — then it comes BACK. Every enemy in its path takes WEAK magic damage on the way out AND again on the return.
- T2 **Lullaby** `lullaby` · damageEffect/damage · sonic/magic · 50MP 1AP · dmg 110 · rng 4 · single · status:stun1
  Hush. Deals MEDIUM magic damage to a Single Enemy and it sleeps through its next activation (Stun).
- T2 **Sonic Breaker** `raceSonicBreaker` · damage/linePush · sonic/magic · 50MP 1AP · dmg 100 · rng 4 · line w1 · finisher:silence×1.5 pushDistance:2
  Deals MEDIUM magic damage to All Enemies in a line and pushes them back. Deals bonus damage to Silenced targets.
- T3 **Anthem** `warCry` · effect/warCry · sonic · 75MP 1AP · dmg - · rng 0 · aura r3 · 
  Every ally within 3 tiles sings along: +2 ATK stages. The singer takes +1.
- T3 **Deafening Wail** `raceDeafeningWail` · damageEffect/aoe · sonic/magic · 75MP 1AP · dmg 125 · rng 0 · self-aoe r2 · status:silence1
  Deals MEDIUM magic damage to All Enemies in an AOE. Applies Silence.
- T3 **Resonance Pulse** `raceResonancePulse` · damageEffect/cross · sonic/magic · 75MP 1AP · dmg 125 · rng 0 · cross r2 · status:slow1 pushDistance:1
  Deals MEDIUM magic damage to All Enemies in a diamond-shaped AOE. Applies Slow.
- T4 **Requiem** `requiem` · damageEffect/barrage · sonic/magic · 100MP 2AP CD2 · dmg 160 · rng 0 · self-aoe r3 · status:discord2 finisher:discord×1.5
  Deals HEAVY magic damage to All Enemies in an AOE. Lowers ATK by 2 stages and DEF by 1 stage. Deals bonus damage to targets with Discord. Cooldown: 2 rounds.

## 🔪 Spy Gear `spygear` · kind discipline · 7 spells (T1 1 / T2 4 / T3 1 / T4 1)
desc: 
races (5): men in black, reptilian, halfdemon, antihero, barbarella

- T1 **Knife Throw** `knifeThrow` · damageEffect/damage · metal/physical · 25MP 1AP · dmg 100 · rng 4 · single · status:marked1
  A knife from the sleeve. Deals MEDIUM physical damage to a Single Enemy within 4 and Marks them: the next physical hit any ally lands deals +24.
- T2 **Agent Vanish** `raceAgentVanish` · movement/escape · shadow · 50MP 1AP CD2 · dmg - · rng 0 · single · status:invisible2 teleportDistance:3
  You didn't see anything. Teleport 3 tiles and go invisible for 2 turns.
- T2 **Place Bomb** `placeBomb` · damage/bomb · fire · 50MP 1AP · dmg 130 · rng 2 · blast r1 · maxActivePerCaster:3
  Places a bomb. Detonate it to deal MEDIUM magic damage in an AOE.
- T2 **Poison Dart** `poisonDart` · damageEffect/damage · poison/physical · 50MP 1AP · dmg 110 · rng 4 · single · status:poison3
  Deals MEDIUM physical damage to a Single Enemy. Applies Poison.
- T2 **Smoke Screen** `sharedSmokeScreen` · effect/zoneDebuff · wind · 50MP 1AP CD2 · dmg - · rng 3 · aoe r1 · ally:invisible1 zoneDuration:2
  Blanket a 3×3 area in smoke for 2 turns. Allies inside are hidden and stay invisible only while they remain in the cloud.
- T3 **EMP Grenade** `raceEMPGrenade` · damageEffect/aoe · lightning/magic · 75MP 1AP · dmg 100 · rng 4 · aoe r1 · status:jammed2
  Deals MEDIUM magic damage to All Enemies in an AOE. Applies Jammed.
- T4 **Sneak Slash** `sneakSlash` · damage/damage · -/physical · 100MP 1AP · dmg 160 · rng 1 · single · finisher:poison×1.5
  Deals HEAVY physical damage to a Single Enemy. Deals bonus damage while invisible. Deals bonus damage to Poisoned targets.

## 👩‍🎤 Stage Presence `stagepresence` · kind discipline · 7 spells (T1 1 / T2 3 / T3 2 / T4 1)
desc: 
races (3): popstar, ringmaster, luchador

- T1 **Mic Drop** `racePopMicDrop` · damageEffect/damage · sonic/magic · 25MP 1AP · dmg 80 · rng 2 · single · status:stagger1
  The mic hits the floor and the floor hits back. Deals WEAK magic damage to a Single Enemy within 2 tiles and Staggers them.
- T2 **Call Out** `provoke` · effect/debuff · sonic · 50MP 1AP · dmg - · rng 3 · single · status:taunt2
  Weakens a Single Enemy. Applies Provoked.
- T2 **Chorus** `passiveChorus` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  +8 INT. Discord it applies lasts 1 round longer.
- T2 **Stage Dive** `racePopStageDive` · damageEffect/tackle · sonic/physical · 50MP 1AP · dmg 100 · rng 3 · single · pushDistance:2 collisionBonus:30
  Off the stage and into the crowd. Charges a Single Enemy within 3 tiles and carries it up to 2 tiles along the line: LIGHT physical damage, and crashing into a wall or another unit deals 30 more and Staggers the target.
- T3 **Crowd Surge** `raceSpaceDisco` · damageEffect/aoePull · sonic/magic · 75MP 1AP · dmg 110 · rng 0 · self-aoe r2 · status:stagger1 pullToCenter
  The crowd rushes the stage, and the stage is you. Deals MEDIUM magic damage to every enemy within 2 tiles, drags them 1 tile toward the caster and Staggers them.
- T3 **Spotlight** `racePopSpotlight` · effect/debuff · light · 75MP 1AP CD2 · dmg - · rng 3 · single · status:marked2 stage:def-1,mdef-1
  The team's focus-fire call. Lowers a Single Enemy's DEF and M DEF by 1 stage and Marks them for 2 rounds.
- T4 **Stadium Show** `racePopStadiumShow` · damageEffect/aoe · sonic/magic · 100MP 1AP CD3 · dmg 150 · rng 3 · aoe r2 · status:charm1 finisher:stagger×1.5
  The pyro goes, the crowd goes. HEAVY magic damage to every enemy in a 5×5 within 3 tiles, and every one of them is Charmed for a round — they are fans now. Once every 4 rounds.

## 🏙️ Street Smarts `streetsmarts` · kind discipline · 4 spells (T1 1 / T2 1 / T3 1 / T4 1)
desc: 
races (1): gangster

- T1 **Mean Mug** `raceMeanMug` · effect/debuff · - · 25MP 1AP · dmg - · rng 3 · single · status:discord2
  Stare them down until they look away. A Single Enemy within 3 tiles is Discorded for 2 rounds.
- T2 **Drive-By** `raceDriveBy` · damageEffect/dash · metal/physical · 50MP 1AP · dmg 0 · rng 3 · single · status:stagger1 dashDamage:40
  Roll up. Dash up to 3 tiles — every enemy on the line takes WEAK physical damage and is Staggered — then fire a MEDIUM physical shot at the weakest enemy within 3 tiles of where you stop.
- T3 **Choppa** `raceChoppa` · damage/line · metal/physical · 75MP 1AP · dmg 125 · rng 5 · line w1 · 
  Let the choppa sing. Deals MEDIUM physical damage to every enemy on a 5-tile line.
- T4 **Empty the Clip** `raceEmptyTheClip` · damage/line · metal/physical · 100MP 1AP · dmg 160 · rng 4 · line w3 · finisher:discord×1.5
  Hold the trigger down until it clicks. HEAVY physical damage to everything on a three-wide street in front of you — anyone already Discorded gets the rest of the belt.

## 🦸🏻‍♂️ Superhero Powers `superheropowers` · kind discipline · 5 spells (T1 1 / T2 2 / T3 1 / T4 1)
desc: 
races (3): superhero, antihero, sidekick

- T1 **Heroic Leap** `raceHeroicLeap` · damage/damage · -/physical · 25MP 1AP · dmg 100 · rng 3 · single · finisher:frozen×1.5
  Deals MEDIUM physical damage to a Single Enemy. The caster charges into melee first.
- T2 **Freeze Breath** `raceFreezeBreath` · damageEffect/line · ice/magic · 50MP 1AP · dmg 60 · rng 2 · line w1 · status:frozen1
  A short blast of arctic breath. Deals WEAK magic damage to All Enemies in a 2-tile line. Applies Frozen.
- T2 **Invulnerable** `raceInvulnerable` · effect/buff · - · 50MP 1AP CD2 · dmg - · rng 0 · single · status:protect2
  Empowers the caster. Applies Protect. Cooldown: 2 rounds.
- T3 **Shockwave Clap** `raceShockwaveClap` · damageEffect/linePush · sonic/physical · 75MP 1AP · dmg 125 · rng 4 · line w1 · status:stagger1 pushDistance:2
  Deals MEDIUM physical damage to All Enemies in a line. Pushes them back. Knocks the target back 2 tiles.
- T4 **Heat Vision** `raceLaserBeam` · damageEffect/line · -/magic · 100MP 1AP · dmg 160 · rng 3 · line w1 · status:burn1 finisher:burn×1.5
  Deals HEAVY magic damage to All Enemies in a line. Applies Burn. Deals bonus damage to Burning targets.

## ⚔️ Swordsmanship `swordsmanship` · kind discipline · 4 spells (T1 1 / T2 1 / T3 1 / T4 1)
desc: 
races (5): pirate, swordfighter, knight, skeleton, king arthur

- T1 **Cross Slash** `crossSlash` · damageEffect/damage · metal/physical · 25MP 1AP · dmg 100 · rng 1 · single · status:grievous2
  The X-cut that will not close. Deals MEDIUM physical damage to a Single Enemy and leaves it Grievously Wounded: healing is halved.
- T2 **Sword Beam** `swordBeam` · damage/line · metal/physical · 50MP 1AP · dmg 100 · rng 3 · line w1 · 
  Deals MEDIUM physical damage to All Enemies in a line.
- T3 **Blade Waltz** `bladeWaltz` · damage/cross · metal/physical · 75MP 1AP · dmg 125 · rng 0 · cross r2 · 
  Deals MEDIUM physical damage to All Enemies in an X-shaped AOE.
- T4 **Dragon Slash** `dragonSlash` · damage/damage · -/physical · 100MP 1AP · dmg 180 · rng 1 · single · finisher:grievous×1.5 ignoreArmor
  Deals HEAVY physical damage to a Single Enemy. Ignores DEF. Deals bonus damage to targets with Burn.

## 🕸️ Symbiosis `symbiosis` · kind discipline · 5 spells (T1 1 / T2 2 / T3 1 / T4 1)
desc: A living suit: tendrils, drains, webbing and armor.
races (2): black goo, symbiote

- T1 **Tendril Whip** `raceTendrilWhip` · damageEffect/damage · poison/physical · 25MP 1AP · dmg 90 · rng 2 · single · status:poison2
  The suit lashes out two tiles. The barbs stay in. Deals WEAK physical damage to a Single Enemy within 2 and Poisons it for 2 rounds.
- T2 **Symbiote Armor** `raceSymbioteArmor` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Once per life, when the host falls under 40% HP the suit knits it back for 30% of max HP.
- T2 **Web Swing** `raceWebSwing` · movement/teleport · - · 50MP 1AP · dmg - · rng 4 · single · teleportDistance:4
  The line goes out, the host goes after it. Swing to any free tile within 4 you can see.
- T3 **Symbiotic Drain** `raceSymbioticDrain` · damage/lifeDrain · -/physical · 75MP 1AP · dmg 125 · rng 2 · single · finisher:poison×1.5 drainPct:0.4
  The tendrils drink from the wound. Deals MEDIUM physical damage to a Single Enemy and heals the caster for part of it. Deals bonus damage to Poisoned targets.
- T4 **Tendril Strike** `raceTendrilStrike` · damageEffect/damage · poison/physical · 100MP 1AP · dmg 180 · rng 2 · single · status:poison2
  Deals HEAVY physical damage to a Single Enemy. Applies Poison.

## 👏 Teamwork `teamwork` · kind discipline · 5 spells (T1 1 / T2 1 / T3 2 / T4 1)
desc: 
races (9): homosapien, antperson, general, quarterback, super sentai, ringmaster, bee queen, sidekick, firefighter

- T1 **Tag In** `raceTagIn` · movement/swap · physical · 25MP 1AP CD2 · dmg - · rng 3 · single · 
  Sub in. Sub out. Swap places with a Single Ally within 3. Cooldown: 2 rounds.
- T2 **Encore** `encore` · effect/encore · sonic · 50MP 1AP CD2 · dmg - · rng 3 · single · 
  Grant a friendly unit that already acted this turn 1 bonus AP, letting them take one more action. Each unit can only receive Encore once per round.
- T3 **Pep Talk** `jackOfAll` · effect/buff · - · 75MP 1AP · dmg - · rng 3 · single · status:jackOfAll3
  Pep talk. A Single Ally gains +1 ATK, DEF, M ATK and M DEF, +1 MOV and +1 RNG for 3 turns.
- T3 **Team Strike** `sentaiTeamStrike` · damage/multiHit · -/physical · 75MP 1AP · dmg - · rng 1 · single · hitDamages:[27,27,27,27,27]
  Deals MEDIUM physical damage to a Single Enemy across 5 hits, plus one more hit for every ally beside the target (up to 3).
- T4 **Everybody Up** `raceEverybodyUp` · effect/warCry · - · 100MP 1AP CD3 · dmg - · rng 0 · aura r2 · stage:atk+1,def+1 cleanse:99
  On three. Every ally within 2 tiles gains +1 ATK and +1 DEF stage and is cleansed of every debuff.

## ⏳ Temporal Abilities `temporal` · kind discipline · 7 spells (T1 1 / T2 3 / T3 2 / T4 1)
desc: 
races (6): shadow entity, glitch, cosmic wraith, atlantean, watcher, rabbit

- T1 **Judgment Beam** `raceJudgmentBeam` · damageEffect/line · -/magic · 25MP 1AP · dmg 90 · rng 5 · line w1 · status:slow1
  The Watcher decides how long a second lasts. Deals WEAK magic damage to All Enemies in a line and Slows them.
- T2 **Foresight** `passiveForesight` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Other allies within 2 tiles cannot be crit.
- T2 **Stutter** `raceStutter` · effect/debuff · - · 50MP 1AP · dmg - · rng 4 · single · status:stagger1,slow1
  They drop a frame. Staggers a Single Enemy for 1 round and Slows it for 1 round.
- T2 **Temporal Shift** `raceTemporalShift` · movement/swap · - · 50MP 1AP · dmg - · rng 4 · single · 
  Swaps positions with the target unit.
- T3 **Reality Pulse** `raceRealityPulse` · damageEffect/aoe · -/magic · 75MP 1AP · dmg 135 · rng 4 · aoe r1 · status:discord2
  Deals MEDIUM magic damage to All Enemies in an AOE and lowers ATK by 2 stages and DEF by 1 stage.
- T3 **Time Rewind** `raceTimeRewindHeal` · heal/heal · - · 75MP 1AP · dmg - · rng 3 · single · healPct:0.4 cleanse:99
  Restore them to the moment before. Heals an ally for 40% of their max HP and removes every debuff.
- T4 **Paradox** `raceTimeRewind` · damage/damage · psychic/magic · 100MP 1AP · dmg 180 · rng 4 · single · finisher:slow,stagger×1.5
  You were never standing there. Deals HEAVY magic damage to a Single Enemy, then replays the last blow it dealt against it. Deals bonus damage to Slowed or Staggered targets.

## 💰 Thievery `thievery` · kind discipline · 3 spells (T1 1 / T2 1 / T3 1 / T4 0)
desc: 
races (3): robinhood, gangster, goblin

- T1 **Stick-Up** `raceHitALick` · damage/steal · metal/physical · 25MP 1AP · dmg 60 · rng 2 · single · 
  Run up on an enemy within 2 tiles. Deals LIGHT physical damage to a Single Enemy and takes a Key AND an item off them.
- T2 **Steal from the Rich** `raceStealFromRich` · effect/debuff · - · 50MP 1AP · dmg - · rng 3 · single · stage:atk-1
  Steal from the rich. Lowers a Single Enemy's ATK by 1 stage and takes it for yourself.
- T3 **Swipe** `raceSwipe` · damage/damage · metal/physical · 75MP 1AP · dmg 100 · rng 2 · single · 
  Bump, lift, gone. MEDIUM physical damage to a Single Enemy within 2 and every buff they were carrying is yours now. Their buffs and raised stat stages move to you for the time they had left.

## ✦ Training `training` · kind support · UNIVERSAL · 10 spells (T1 8 / T2 2 / T3 0 / T4 0)
desc: Edges any unit can train: 1 SP each, at most 2 passive or gear rows among the 7 slots.
races (0): NONE

- T1 **Arcane Surge** `passiveArcaneSurge` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  +8 spell damage on every cast.
- T1 **Brute Force** `passiveBruteForce` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Basic attacks deal +20% damage, and the unit can swim.
- T1 **Bulwark** `passiveBulwark` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Reduces incoming damage by 8, +5 armor, and counterattacks at a 30% rate.
- T1 **Crescendo** `passiveCrescendo` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Buffs this unit applies last +1 turn.
- T1 **Deadeye** `passiveDeadeye` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  +10 SPD, and basic-attack crits hit ×2.0 instead of ×1.8. Always ready to draw first.
- T1 **Grace** `passiveGrace` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Heal and revive spells gain +2 range and +24 healing power.
- T1 **Riposte** `passiveRiposte` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  35% chance to counterattack when struck in melee, and counters swing at full sword strength (60% ATK instead of 40%).
- T1 **Third Eye** `passiveThirdEye` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Debuff statuses this unit applies last +1 turn. Teleport costs 1 less MP.
- T2 **Adaptable** `passiveAdaptable` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Borrow spells from the families other races carry (in story mode: only the vessels you own). Unequip it and the borrowed spells come off too.
- T2 **Warpath** `passiveWarpath` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Basic attacks hit +15% harder, +5 armor, and counterattacks at a hardened 30% rate. Born for the front line.

## 🪤 Trap Making `trapmaking` · kind discipline · 5 spells (T1 1 / T2 2 / T3 1 / T4 1)
desc: 
races (2): gnome, goblin

- T1 **Spring Snare** `raceLucidTrap` · deploy/deployObject · - · 25MP 1AP · dmg - · rng 3 · blast r0 · status:stun1 maxActivePerCaster:1 objectHp:1
  Clockwork jaws under the leaves. Hides a snare on a tile; the first enemy to step on it is Stunned for a round.
- T2 **Foreman** `passiveForeman` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Its turrets, summons, traps and mines deal +20 damage, and the ones with an HP bar get +40 HP.
- T2 **Scrap Mine** `raceScrapMine` · deploy/deployObject · fire/physical · 50MP 1AP · dmg - · rng 3 · blast r1 · status:stagger1 maxActivePerCaster:2 objectHp:20
  Nails, powder, a spring. Cheap. Sets a mine: the first enemy to step on it sets off a MEDIUM blast in a 3×3 that Staggers. Two per caster.
- T3 **Trapdoor** `raceTrapdoor` · damageEffect/placeTrap · psychic/physical · 75MP 1AP · dmg 60 · rng 4 · single · status:stagger1 maxActivePerCaster:1
  Do not stand in corners. Shoot a hidden 2×2 trapdoor onto four empty tiles within 4. The enemy cannot see it. The first enemy to step onto it drops: the four tiles sink two levels under them for WEAK physical damage plus the fall, and they are Staggered. One trapdoor per agent.
- T4 **Deathtrap** `raceDeathtrap` · damageEffect/placeTrap · physical/physical · 100MP 1AP · dmg 120 · rng 4 · single · status:root2 maxActivePerCaster:1
  Do not stand anywhere. Hide a 3x3 trap on empty tiles within 4; the enemy cannot see it. The first enemy to step on it drops the whole 3x3 two levels: every enemy on it takes MEDIUM physical damage plus the fall and is Rooted for 2 rounds. One per caster.

## 🤥 Trickery `trickery` · kind discipline · 7 spells (T1 3 / T2 1 / T3 2 / T4 1)
desc: 
races (10): fairy, reptilian, android, skinwalker, djinn, machine elves, ringmaster, clown, bunny girl, rabbit

- T1 **Borrowed Claw** `raceBorrowedClaw` · damage/damage · -/physical · 25MP 1AP CD3 · dmg 100 · rng 1 · single · stealSpell
  Deals MEDIUM physical damage to a Single Enemy and tears one spell out of them: the skinwalker keeps it, they lose it for the match. Cooldown: 3 rounds.
- T1 **Misdirection** `raceMisdirection` · effect/debuff · - · 25MP 1AP · dmg - · rng 3 · single · status:blind1
  Look — over there. Blinds a Single Enemy within 3 for 1 round: its attacks miss half the time.
- T1 **Sucker Punch** `raceSuckerPunch` · damage/damage · -/physical · 25MP 1AP · dmg 100 · rng 1 · single · finisher:blind×1.5
  They never saw it coming. Literally. Deals MEDIUM physical damage to an adjacent enemy. Deals bonus damage to Blinded targets.
- T2 **Shed Skin** `raceShedSkin` · movement/escape · - · 50MP 1AP · dmg - · rng 0 · single · teleportDistance:2 cleanse:1 spawnDecoy
  Leave a decoy, cleanse 1 debuff, teleport 2 tiles away. Decoy draws 1 attack.
- T3 **Skin Swap** `raceSkinSwap` · movement/swap · - · 75MP 1AP · dmg - · rng 4 · single · 
  Swaps positions with the target unit.
- T3 **Trick Room** `raceTrickRoom` · utility/trickRoom · arcane · 75MP 2AP · dmg - · rng 0 · single · 
  Warp the flow of time for 3 rounds. Turn order is reversed — the slowest units act first and the fastest act last.
- T4 **Mimicry** `raceMimicry` · effect/buff · - · 100MP 1AP CD3 · dmg - · rng 0 · single · stage:atk+2,def+2 spawnDecoy
  Which one is the real one? Wrong. Raises the caster's ATK and DEF by 2 stages and leaves a double of them on a tile beside them.

## 🛸 UFO Features `ufo` · kind discipline · 6 spells (T1 1 / T2 2 / T3 2 / T4 1)
desc: 
races (2): martian, grey

- T1 **Probe** `raceProbe` · damage/damage · psychic/magic · 25MP 1AP · dmg 100 · rng 4 · single · 
  Deals MEDIUM magic damage to a Single Enemy.
- T2 **Implant** `raceImplant` · effect/debuff · metal · 50MP 1AP · dmg - · rng 4 · single · status:marked3 stage:mdef-1
  Weakens a Single Enemy. Applies Marked.
- T2 **Low Gravity** `sharedLowGravity` · utility/zoneDebuff · arcane · 50MP 1AP · dmg - · rng 4 · aoe r1 · zoneDuration:3
  Loosen gravity over a 3×3 area for 3 rounds. EVERYONE inside (both teams) jumps +2 tiles further and higher, and takes zero fall damage. Moon-bounce your bruisers up a cliff — just remember the enemy can bounce too.
- T3 **Abduction Beam** `raceAbductionBeam` · damage/skyThrow · light/magic · 75MP 1AP · dmg 110 · rng 4 · single · finisher:marked×1.5 dmgPerLevel:25 carryHeight:5 collisionBonus:50
  Lift an enemy into your craft with a telekinetic tractor beam, then drop them. Fall damage scales with the drop; bonus damage if they land on another unit.
- T3 **Crop Circle** `raceCropCircle` · damage/aoe · nature/magic · 75MP 1AP · dmg 125 · rng 4 · aoe r2 · terrainDeform:{"centerDelta":-2,"edgeDelta":-1}
  Deals MEDIUM magic damage to All Enemies in an AOE. Reshapes the ground on impact.
- T4 **War of the Worlds** `raceWarOfTheWorlds` · damage/aoe · metal/magic · 100MP 2AP CD2 · dmg - · rng 4 · aoe r2 · zoneDuration:2
  The sky fills with saucers, and they stay. Lays a 5×5 zone within 4 tiles for 2 rounds: every enemy inside at the end of each round takes MEDIUM magic damage. No one would have believed it.

## 🔬 Unethical Science `unethicalscience` · kind discipline · 5 spells (T1 1 / T2 2 / T3 1 / T4 1)
desc: 
races (1): mad scientist

- T1 **Vivisection** `raceVivisection` · damageEffect/damage · poison/magic · 25MP 1AP · dmg 100 · rng 2 · single · status:grievous2
  For science. Hold still. Deals MEDIUM magic damage to a Single Enemy within 2 and inflicts Grievous Wound for 2 rounds (healing halved).
- T2 **Cloning Machine** `raceCloneDecoy` · deploy/deployObject · metal · 50MP 1AP · dmg - · rng 1 · single · maxActivePerCaster:1 objectHp:100
  Print a decoy clone on an adjacent tile. It draws enemy attention but cannot attack. Placing never uses your spell slot.
- T2 **Summon Creation** `raceSummonCreation` · deploy/summonUnit · lightning · 50MP 1AP · dmg - · rng 1 · single · maxActivePerCaster:1 summonDef:{"key":"creation","name":"Creation","move":3,"dmg":90,"hits":4,"armored":true}
  IT'S ALIVE! Stitch a creation together on an adjacent tile. At the end of every round it lumbers 3 tiles toward the nearest enemy and clubs for 90. 4 hits to destroy — physical blows only count for half. One creation per scientist.
- T3 **Monster Serum** `raceMonsterSerum` · effect/buff · poison · 75MP 1AP · dmg - · rng 3 · single · status:monster3
  Inject an ally with the serum. For 3 rounds they are Monstrous: +1 ATK / DEF / M.DEF / SPD stage, +1 reach and +25% max HP — but they cannot cast spells.
- T4 **Plandemic** `racePlandemic` · damageEffect/aoe · poison/magic · 100MP 1AP · dmg 160 · rng 4 · aoe r1 · status:poison3
  Deals HEAVY magic damage to All Enemies in an AOE. Applies Poison.

## 🧛🏻 Vampiric Abilities `vampiricabilties` · kind discipline · 6 spells (T1 1 / T2 2 / T3 2 / T4 1)
desc: 
races (1): vampire

- T1 **Lifetap** `raceLifetap` · damageEffect/lifeDrain · blood/physical · 25MP 1AP · dmg 100 · rng 1 · single · status:grievous2 drainPct:0.4
  Open the vein. The wound will not close. Deals MEDIUM physical damage to a Single Enemy, heals the caster for part of it and leaves the target Grievously Wounded.
- T2 **Bloodlust** `passiveBloodlust` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Drain spells heal 50% more. Each kill raises its ATK 1 stage.
- T2 **Mist Form** `raceMistForm` · movement/escape · wind · 50MP 1AP CD2 · dmg - · rng 0 · single · status:invisible1 teleportDistance:3
  Dissolve into mist. Teleport 3 tiles and become invisible for 1 turn.
- T3 **Bat Swarm** `raceBatSwarm` · damage/aoe · blood/physical · 75MP 1AP · dmg 110 · rng 4 · aoe r1 · 
  A cloud of teeth. Deals MEDIUM physical damage to All Enemies in a 3×3 within 4 tiles, and the caster heals 30% of all the damage dealt.
- T3 **Thrall Bite** `raceThrallBite` · damageEffect/possess · blood/physical · 75MP 1AP · dmg 80 · rng 1 · single · status:possessed2 drainPct:0.25
  Deals WEAK physical damage to a Single Enemy in melee and heals the caster for part of it. If the victim survives, its next activation is YOURS. Applies Possessed. Bosses cannot be made thralls.
- T4 **Predator Drop** `racePredatorDrop` · damage/skyDrop · blood/physical · 100MP 1AP · dmg 150 · rng 1 · single · finisher:grievous×1.5 drainPct:0.2 requiresFlight dmgPerLevel:15 carryHeight:4
  Lifts the target high and drops it. Deals HEAVY physical damage plus fall damage. Heals the caster for part of the damage dealt. Caster must be flying.

## 💧 Water Abilities `water` · kind discipline · 9 spells (T1 2 / T2 2 / T3 4 / T4 1)
desc: Floods, pushes and soaks.
races (10): siren, mermaid, atlantean, kraken, loch ness monster, jellyfish, starfish, deep sea fish, sharkman, firefighter

- T1 **Gills** `passiveGills` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Swims, and +1 SPD stage while standing in water. Regenerates 5% of max HP at the end of every round while standing in water.
- T1 **Whirlpool** `raceRiptide` · damageEffect/aoePull · water/magic · 25MP 1AP · dmg 80 · rng 4 · aoe r1 · status:slow1 pullToCenter
  Deals WEAK magic damage to All Enemies in an AOE. Drags everything caught toward the center. Applies Slow.
- T2 **Tidal Blessing** `raceTidalBlessing` · heal/heal · - · 50MP 1AP · dmg - · rng 3 · single · healAmt:140 cleanse:1
  Restores a BIG amount of HP to a Single Ally and cleanses a debuff.
- T2 **Water Pulse** `sharedTidalSurge` · damageEffect/linePush · water/magic · 50MP 1AP · dmg 100 · rng 5 · line w1 · status:wet2 pushDistance:2
  Deals MEDIUM magic damage to All Enemies in a line. Pushes them back. Applies Slow. Knocks the target back 2 tiles.
- T3 **Call of the Deep** `raceCallOfTheDeep` · damage/terrainCreate · water/magic · 75MP 1AP · dmg 135 · rng 3 · tiles1 · finisher:silence×1.5 terrainType:deep_water
  Something answers from below. Deals MEDIUM magic damage to a Single Enemy, and the floor under them opens into deep water. Silenced targets cannot call for help: bonus damage.
- T3 **Temporal Tide** `raceTemporalTide` · heal/zoneHeal · water · 75MP 1AP · dmg - · rng 3 · aoe r1 · healPerTurn:60 zoneDuration:2 cleanse:1
  Time runs thick in the water. Creates a 3×3 zone for 2 rounds: allies inside heal a WEAK amount and shed 1 debuff at the end of each round; enemies inside are Slowed.
- T3 **Tidal Slam** `raceTidalSlam` · damageEffect/aoe · water/physical · 75MP 1AP · dmg 135 · rng 0 · self-aoe r1 · status:slow2 finisher:slow×1.5 leaveTerrain:deep_water terrainDeform:{"centerDelta":-1,"edgeDelta":-1}
  Deals MEDIUM physical damage to All Enemies in an AOE. Applies Slow. Deals bonus damage to targets with Slow. Leaves deep_water behind. Cooldown: 2 rounds.
- T3 **Tsunami** `raceTsunami` · damageEffect/linePush · water/magic · 75MP 2AP · dmg 135 · rng 4 · line w3 · status:slow1 pushDistance:2
  Raise the sea and send it. A wall of water THREE tiles wide rolls 4 tiles out, dealing MEDIUM magic damage to All Enemies in its path, shoving them 2 tiles and Slowing them.
- T4 **Great Flood** `raceFlood` · damageEffect/terrainCreate · water/magic · 100MP 2AP CD2 · dmg 160 · rng 4 · tiles12 · status:slow1 terrainType:water
  Call the drowned deep. Water pours into the target tile and RISES to fill the surrounding basin (up to 12 tiles) — meteor craters and trenches flood to the rim, chasms become deep water. Enemies caught take HEAVY magic damage, are slowed, and can start to drown.

## 🐺 Werewolf Powers `werewolf` · kind discipline · 4 spells (T1 1 / T2 1 / T3 1 / T4 1)
desc: 
races (1): werewolf

- T1 **Howl** `raceHowl` · effect/warCry · sonic · 25MP 1AP · dmg - · rng 0 · aura r2 · stage:atk+1
  The pack answers. Every ally within 2 tiles gains +1 ATK stage.
- T2 **Claw Sweep** `raceClawSweep` · damageEffect/aoe · -/physical · 50MP 1AP · dmg 100 · rng 0 · self-aoe r1 · status:grievous2
  Both arms, every direction. MEDIUM physical damage to everything adjacent, and none of it heals right. Applies Grievous Wound for 2 rounds.
- T3 **Lunar Regeneration** `raceLunarRegeneration` · heal/selfHeal · - · 75MP 1AP · dmg - · rng 0 · single · status:regen2 selfHealPct:0.25 cleanse:1
  The wounds close while you watch. Restores 25% of the caster's max HP, cleanses 1 debuff and gives Regen for 2 rounds.
- T4 **Blood Frenzy** `raceBloodFrenzy` · damage/damage · blood/physical · 100MP 2AP · dmg 180 · rng 6 · single · 
  Deals HEAVY physical damage to a Single Enemy. Automatically strikes the visible enemy with the lowest HP.

## 🌪️ Wind Control `wind` · kind discipline · 6 spells (T1 2 / T2 2 / T3 1 / T4 1)
desc: Gusts, knockback and flight.
races (4): gargoyle, superhero, dragon, valkraye

- T1 **Windborne** `passiveWindborne` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  +20 SPD. Pushes and pulls cannot move it.
- T1 **Wing Attack** `raceWingGust` · damage/aoe · wind/physical · 25MP 1AP · dmg 80 · rng 0 · self-aoe r1 · pushDistance:2
  A sweeping blow with both wings. Deals WEAK physical damage to All Enemies around the caster (AOE) and knocks them back.
- T2 **Gale** `raceGale` · damage/linePush · wind/magic · 50MP 1AP · dmg 100 · rng 4 · line w1 · pushDistance:3
  One long breath down the row. MEDIUM magic damage to everything in the line, and all of it three tiles further from you.
- T2 **Updraft** `raceUpdraft` · effect/buff · wind · 50MP 1AP · dmg - · rng 3 · single · status:levitating2
  Give them the sky. One ally is Levitating for 2 rounds — flight, the high-ground bonus, and a little more reach. +1 MOV for 2 rounds.
- T3 **Sky Tackle** `raceSkyTackle` · damageEffect/tackle · wind/physical · 75MP 1AP · dmg 110 · rng 3 · single · pushDistance:4 collisionBonus:50
  Charges a Single Enemy and carries it up to 4 tiles along the line. Deals MEDIUM physical damage; crashing into a wall or another unit deals 50 more and Staggers the target.
- T4 **Vortex Slam** `sharedVortexSlam` · damageEffect/aoePull · wind/magic · 100MP 2AP · dmg 160 · rng 4 · aoe r1 · status:slow1 pullToCenter
  Deals HEAVY magic damage to All Enemies in an AOE and pulls them toward the center. Applies Slow.

## ⛄️ Winter Warfare `winter` · kind discipline · 6 spells (T1 3 / T2 1 / T3 1 / T4 1)
desc: 
races (3): yeti, santa clause, krampus

- T1 **Frozen Punch** `raceFrozenPunch` · damage/damage · ice/physical · 25MP 1AP · dmg 100 · rng 1 · single · finisher:frozen×1.5
  A frostbitten haymaker on a Single Enemy — MEDIUM physical damage. Deals bonus damage to Frozen targets.
- T1 **Snowball Volley** `raceSnowballVolley` · damageEffect/aoe · ice/magic · 25MP 1AP · dmg 80 · rng 4 · aoe r1 · status:slow1
  A fan of snowballs lobbed in a high arc. Deals WEAK magic damage to All Enemies in an AOE. Applies Slow.
- T1 **Thick Fur** `passiveThickFur` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Never Frozen, and +1 SPD stage while standing in a blizzard.
- T2 **Snow Fort** `raceSnowFort` · terrain/terrainCreate · ice · 50MP 1AP · dmg - · rng 3 · tiles3 · terrainType:snow_wall terrainDeform:{"centerDelta":1,"edgeDelta":0}
  Pack it, stack it, duck. Three tiles of snow wall in a line, one level high: it blocks sight and is slow to climb. It melts after 3 rounds and leaves a puddle. No damage.
- T3 **Glacial Slam** `raceGlacialSlam` · damageEffect/aoe · ice/physical · 75MP 1AP · dmg 125 · rng 0 · self-aoe r1 · status:slow2 finisher:frozen×1.5
  Bring both fists down. MEDIUM physical damage to everything around you, all of it Slowed — and anything Frozen shatters.
- T4 **Avalanche Strike** `raceAvalancheStrike` · damageEffect/damage · ice/physical · 100MP 1AP CD2 · dmg 180 · rng 3 · single · status:frozen1 finisher:frozen×1.5
  Charges into melee in a wall of snow, dealing HEAVY physical damage to a Single Enemy and freezing it solid for 1 turn. Deals bonus damage to targets already Frozen.

## 🧙🏻‍♀️ Witchcraft `witchcraft` · kind discipline · 5 spells (T1 1 / T2 2 / T3 1 / T4 1)
desc: 
races (4): fortune teller, scarecrow, demon princess, jack o lantern

- T1 **Evil Eye** `raceEvilEye` · damageEffect/damage · shadow/magic · 25MP 1AP · dmg 80 · rng 4 · single · status:hexed2
  One look is enough. Deals WEAK magic damage and Hexes the target for 2 rounds.
- T2 **Hex of Agony** `sharedHexOfToil` · effect/debuff · shadow · 50MP 1AP · dmg - · rng 4 · single · status:hexed3,grievous3
  Weakens a Single Enemy. Applies Hexed.
- T2 **Hex Weaver** `passiveHexWeaver` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  Hexed enemies take +25% magic damage from it. When a Hexed enemy dies, the hex jumps to an adjacent enemy.
- T3 **Family Curse** `raceCurseOfMisfortune` · effect/aoe · shadow · 75MP 1AP · dmg - · rng 4 · aoe r1 · status:hexed3
  It runs in the family. Every enemy in a 3×3 is Hexed for 3 rounds.
- T4 **Hocus Pocus** `raceHocusPocus` · damage/damage · arcane/magic · 100MP 1AP · dmg 180 · rng 4 · single · finisher:hexed×1.5
  The old words, spoken like they mean it. Deals HEAVY magic damage to a Single Enemy.

## ✦ Zombie Behavior `zombie` · kind discipline · 7 spells (T1 2 / T2 2 / T3 2 / T4 1)
desc: 
races (1): zombie

- T1 **Grab** `raceGrab` · damageEffect/damage · -/physical · 25MP 1AP · dmg 80 · rng 1 · single · status:root1
  The hands do not let go. Deals WEAK physical damage and Roots the target for a round.
- T1 **Slow Rot** `passiveSlowRot` · passive/passive · - · 0MP 1AP · dmg - · rng 0 · single · 
  It keeps getting up: regenerates 3% of max HP at the end of every round.
- T2 **Cannibalize** `raceCannibalize` · heal/cannibalize · poison · 50MP 1AP · dmg - · rng 2 · single · healPct:0.35
  Feeds on a fallen unit's remains within 2 tiles — an ally's gravestone or an enemy's bones. Heals 35% of max HP and delays that unit's respawn by 2 rounds. The remains are consumed.
- T2 **Zombie Rush** `raceZombieRush` · damage/damage · -/physical · 50MP 1AP · dmg 130 · rng 3 · single · 
  Deals MEDIUM physical damage to a Single Enemy. The caster charges into melee first.
- T3 **Infect** `raceInfect` · effect/possess · poison · 75MP 1AP CD3 · dmg - · rng 1 · single · status:infected3
  The rot takes hold: a Single Enemy in melee joins the horde for its next 4 activations — yours to move and swing, melee only, with +1 ATK and +1 SPD stage. Applies Infected. Shambling Horde hits Infected targets harder. Bosses cannot be infected.
- T3 **Outbreak** `raceOutbreak` · damageEffect/zoneDebuff · poison/physical · 75MP 1AP · dmg - · rng 4 · aoe r2 · status:poison2 zoneDuration:3
  Patient zero hits the ground. Deals WEAK physical damage to every enemy in a 5×5 within 4 tiles, then blights it for 3 rounds — enemies inside are Poisoned, and the infection reapplies every round they linger.
- T4 **Shambling Horde** `raceShamblingHorde` · damage/aoe · -/physical · 100MP 1AP · dmg 160 · rng 3 · aoe r1 · finisher:infected×1.5
  The horde descends. Deals HEAVY physical damage to All Enemies in an AOE. Deals bonus damage to Infected targets.

