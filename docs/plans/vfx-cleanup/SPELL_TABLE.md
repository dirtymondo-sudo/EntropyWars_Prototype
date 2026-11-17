# VFX cleanup: every castable spell, its white layers and its rule

Written by the plan thread on 2026-11-17 from a static read of three-vfx-effects.js + data.js at main `da261dc` (script: the plan's section 9). **Rules:** STRIP = it has its own look, take the generic white off and add nothing · REPLACE = no own look, swap the white for the spell's own colour/accent · BEAM = goes onto the new beam kit · LEAVE = support grammar with no white, check the sheet only. The rule is the starting call; the batch thread confirms it on the before sheet and may move a spell one step (say so in the batch report).

Counts: STRIP 548 · BEAM 25 · REPLACE 315 · LEAVE 98 · total 986 castable spells (passives have no cast).

## B2 · Blades (his examples first) (9)

| Spell | id | Race / school | Element | Stage look | Weight | Rule | White layers found |
|---|---|---|---|---|---|---|---|
| Blessed Blade | `raceBlessedBlade` | swordfighter | - | divine | ultimate | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock+pillar); pale palette (divine); 1 flash layer; own look: screen flash, speed burst, 6 white colours |
| Red Slash | `sentaiRedSlash` | super sentai | fire | fire | standard | **STRIP** | stage burst (flash+ring+speedBurst); 1 flash layer; own look: screen flash, speed burst, 6 white colours |
| Brave Charge | `guardSlash` | Warrior | - | human | standard | **STRIP** | stage burst (flash+ring+speedBurst); pale palette (human); 1 flash layer; own look: screen flash, speed burst, 5 white colours |
| Sneak Slash | `sneakSlash` | Agent | - | human | ultimate | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (human); 1 flash layer; own look: screen flash, speed burst, 5 white colours |
| Cross Slash | `crossSlash` | Swordmaster | metal | metal | standard | **STRIP** | stage burst (flash+ring+speedBurst); pale palette (metal); pale noise wash; 3 flash layers; own look: screen flash, speed burst, 6 white colours |
| Synthetic Blade | `raceSyntheticBlade` | android | - | tech | standard | **STRIP** | stage burst (flash+ring+speedBurst); pale palette (tech); own look: screen flash, speed burst, 5 white colours |
| Dragon Slash | `dragonSlash` | Swordmaster | - | unholy | ultimate | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); 1 flash layer; own look: screen flash, speed burst, 6 white colours |
| Blade Waltz | `bladeWaltz` | Swordmaster | wind | wind | heavy | **STRIP** | stage burst (flash+lines+ring+crescent+speedBurst+crescent2+aftershock); pale palette (wind); pale noise wash; 1 flash layer; own look: screen flash, speed burst, 3 white colours |
| Sword Beam | `swordBeam` | Swordmaster | wind | wind | standard | **BEAM** | stage burst (flash+ring+crescent+speedBurst); pale palette (wind); pale noise wash; 1 flash layer; generic laser + white charge flash |

## B3 · Beams and lines (new beam kit) (47)

| Spell | id | Race / school | Element | Stage look | Weight | Rule | White layers found |
|---|---|---|---|---|---|---|---|
| Baleful Gaze | `raceBalefulGaze` | cyclops | - | alien | standard | **BEAM** | stage burst (flash+ring); generic laser + white charge flash |
| Entropic Beam | `raceEntropicBeam` | cosmic wraith | - | alien | standard | **BEAM** | stage burst (flash+ring); own look: 2 white colours; generic laser + white charge flash |
| Blue Wave | `sentaiBlueWave` | super sentai | - | anomaly | heavy | **STRIP** | stage burst (flash+lines+ring+orb+aftershock); pale palette (anomaly); own look: 2 white colours |
| Fractal Needle | `raceFractalNeedle` | mantid | - | arcane | ultimate | **REPLACE** | stage burst (flash+lines+ring+orb+aftershock); 1 flash layer |
| Fractal Stitch | `raceFractalStitch` | mantid | - | arcane | heavy | **STRIP** | stage burst (flash+lines+ring+orb+aftershock); own look: 2 white colours |
| Judgment Beam | `raceJudgmentBeam` | cult leader | - | divine | standard | **BEAM** | stage burst (flash+ring); pale palette (divine); 1 flash layer; generic laser + white charge flash |
| Last Light | `sigLastLight` | cosmic wraith | - | divine | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock+pillar); pale palette (divine); 1 flash layer; own look: 4 white colours |
| Mudslide | `raceMudslide` |  | earth | earth | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); own look: 3 white colours |
| Atomic Breath | `raceAtomicBreath` | kaiju | fire | fire | ultimate | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); 2 flash layers |
| Dragon Breath | `raceDragonBreath` | dragon | fire | fire | light | **REPLACE** | stage burst (flash+ring) |
| Dragonfire | `raceDragonfire` | dragon | fire | fire | ultimate | **REPLACE** | stage burst (flash+lines+ring+aftershock) |
| Flamethrower | `raceFlamethrower` |  | fire | fire | standard | **BEAM** | stage burst (flash+ring); own look: 1 white colours; generic laser + white charge flash |
| Heat Ray | `raceHeatRay` | martian | fire | fire | standard | **BEAM** | stage burst (flash+ring+speedBurst); generic laser + white charge flash |
| Heat Vision | `raceLaserBeam` | superhero | fire | fire | ultimate | **BEAM** | stage burst (flash+lines+ring+aftershock); 1 flash layer; own look: 4 white colours; generic laser + white charge flash |
| Hellmouth | `raceHellmouth` | demon | fire | fire | ultimate | **REPLACE** | stage burst (flash+lines+ring+aftershock) |
| Plasma Cannon | `racePlasmaCannon` | cyborg | fire | fire | heavy | **BEAM** | stage burst (flash+lines+ring+aftershock); 2 flash layers; generic laser + white charge flash |
| Plasma Whip | `racePlasmaWhip` | barbarella | fire | fire | heavy | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock); 1 flash layer |
| Tripod Sweep | `goTripodSweep` | martian | fire | fire | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock) |
| Freeze Breath | `raceFreezeBreath` | superhero | ice | ice | standard | **BEAM** | stage burst (flash+ring); pale palette (ice); pale noise wash; 2 flash layers; 1 white ring; own look: 2 white colours; generic laser + white charge flash |
| Ki Wave | `raceKiWave` | ki fighter | - | ki | heavy | **BEAM** | stage burst (flash+lines+ring+crescent+speedBurst+crescent2+aftershock); pale palette (ki); 2 flash layers; 1 white ring; own look: 2 white colours; generic laser + white charge flash |
| Piercing Arrow | `racePiercingArrow` | robinhood | wind | kinetic | standard | **BEAM** | stage burst (flash+ring+crescent+speedBurst); pale palette (kinetic); pale noise wash; 1 white ring; generic laser + white charge flash |
| Ball Lightning | `raceBallLightning` |  | lightning | lightning | standard | **BEAM** | stage burst (flash+ring); pale palette (lightning); own look: 4 white colours; generic laser + white charge flash |
| Firefly Swarm | `sigFireflySwarm` | fairy | lightning | lightning | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (lightning) |
| Forged Thunderbolt | `sigForgedThunderbolt` | cyclops | lightning | lightning | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (lightning); 1 flash layer; own look: 7 white colours |
| Choppa | `raceChoppa` | gangster | metal | metal | heavy | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (metal); pale noise wash |
| Empty the Clip | `raceEmptyTheClip` | gangster | metal | metal | ultimate | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (metal); pale noise wash |
| Suppressive Fire | `raceSuppressiveFire` | marksman | metal | metal | light | **REPLACE** | stage burst (flash+ring); pale palette (metal); pale noise wash; 2 flash layers |
| Suppressive Fire | `raceSuppressingFire` |  | metal | metal | light | **REPLACE** | stage burst (flash+ring); pale palette (metal); pale noise wash; 3 flash layers |
| Timber! | `pzTimber` | tree person | nature | nature | heavy | **BEAM** | stage burst (flash+lines+ring+speedBurst+aftershock); own look: 3 white colours; generic laser + white charge flash |
| Black Tendrils | `pzBlackTendrils` | symbiote | poison | poison | light | **BEAM** | stage burst (flash+ring); own look: 3 white colours; generic laser + white charge flash |
| Chemtrails | `raceChemtrails` | conspiracy theorist | poison | poison | standard | **STRIP** | stage burst (flash+ring); own look: 1 white colours |
| Formic Acid | `raceFormicAcid` | antperson | poison | poison | light | **REPLACE** | stage burst (flash+ring) |
| Plasma Whip | `raceLavaLamp` |  | fire | poison | standard | **STRIP** | stage burst (flash+ring+speedBurst) |
| Antimagic Gaze | `goAntimagicGaze` | occulus | psychic | psychic | standard | **STRIP** | stage burst (flash+ring); pale palette (psychic); own look: 1 white colours |
| Psychic Beam | `racePsychicBeam` | occulus | psychic | psychic | light | **BEAM** | stage burst (flash+ring); pale palette (psychic); 1 flash layer; generic laser + white charge flash |
| Chart Topper | `pzChartTopper` | popstar | sonic | sonic | heavy | **BEAM** | stage burst (flash+lines+ring+aftershock); pale palette (sonic); pale noise wash; own look: 3 white colours; generic laser + white charge flash |
| Shockwave Clap | `raceShockwaveClap` | superhero | sonic | sonic | heavy | **BEAM** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (sonic); pale noise wash; 1 white ring; generic laser + white charge flash |
| Sonic Boomerang | `raceSonicBoomerang` | siren | sonic | sonic | heavy | **REPLACE** | stage burst (flash+lines+ring+aftershock); pale palette (sonic); pale noise wash |
| Sonic Breaker | `raceSonicBreaker` | siren | sonic | sonic | standard | **BEAM** | stage burst (flash+ring); pale palette (sonic); pale noise wash; generic laser + white charge flash |
| Railgun | `railgun` | Engineer | metal | tech | heavy | **BEAM** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (tech); pale noise wash; generic laser + white charge flash |
| Bone Lance | `raceBoneLance` | skeleton | - | unholy | heavy | **BEAM** | stage burst (flash+lines+ring+speedBurst+aftershock); generic laser + white charge flash |
| Orichalcum Ray | `sigOrichalcumRay` | atlantean | water | water | standard | **BEAM** | stage burst (flash+ring); pale palette (water); own look: 1 white colours; generic laser + white charge flash |
| Rainspout | `goRainspout` | gargoyle | water | water | standard | **STRIP** | stage burst (flash+ring); pale palette (water) |
| Water Pulse | `sharedTidalSurge` | siren | water | water | standard | **BEAM** | stage burst (flash+ring); pale palette (water); own look: 1 white colours; generic laser + white charge flash |
| Bullet Pass | `raceBulletPass` | quarterback | wind | wind | light | **BEAM** | stage burst (flash+ring+crescent); pale palette (wind); pale noise wash; 1 flash layer; generic laser + white charge flash |
| Crosswind | `raceCrosswind` |  | wind | wind | standard | **BEAM** | stage burst (flash+ring+crescent+speedBurst); pale palette (wind); pale noise wash; own look: 1 white colours; generic laser + white charge flash |
| Gale | `raceGale` |  | wind | wind | standard | **BEAM** | stage burst (flash+ring+crescent+speedBurst); pale palette (wind); pale noise wash; own look: 1 white colours; generic laser + white charge flash |

## B4 · Blasts, bolts and duels (beam kit part 2) (16)

| Spell | id | Race / school | Element | Stage look | Weight | Rule | White layers found |
|---|---|---|---|---|---|---|---|
| Magic Missile | `pzMagicMissile` | wizard | - | arcane | standard | **STRIP** | stage burst (flash+ring); own look: 4 white colours |
| Aurora Ray | `raceAuroraRay` | orb of light | - | divine | standard | **STRIP** | stage burst (flash+ring); pale palette (divine); 3 flash layers; own look: screen flash, 2 white colours |
| Spirit Bomb | `raceSpiritBomb` |  | - | divine | ultimate | **REPLACE** | stage burst (flash+lines+ring+aftershock+pillar); pale palette (divine) |
| Plasma Loop | `goSolarFlare` | orb of light | fire | fire | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock) |
| Space Laser | `sigSpaceLaser` | astronaut | fire | fire | standard | **STRIP** | stage burst (flash+ring); own look: 3 white colours |
| Counterspell | `pzCounterspell` | wizard | - | hex | standard | **LEAVE** | pale palette (hex) |
| Shrink Ray | `sharedShrinkRay` | mad scientist | metal | hex | standard | **LEAVE** | pale palette (hex) |
| Dragon Fist | `raceDragonFist` | ki fighter | fire | ki | heavy | **STRIP** | stage burst (flash+lines+ring+crescent+speedBurst+crescent2+aftershock); pale palette (ki); 2 flash layers; 2 white rings |
| Flurry of Blows | `raceFlurryOfBlows` | ki fighter | wind | ki | light | **REPLACE** | stage burst (flash+ring+crescent); pale palette (ki); pale noise wash; 2 flash layers |
| Ki Charge | `raceKiCharge` | ki fighter | - | ki | heavy | **REPLACE** | stage burst (flash+lines+ring+crescent+speedBurst+crescent2+aftershock); pale palette (ki); 2 flash layers; 2 white rings |
| Ki Volley | `raceKiBlast` | ki fighter | - | ki | light | **REPLACE** | stage burst (flash+ring+crescent); pale palette (ki); 1 flash layer |
| Vehicular Manslaughter | `raceMissileBarrage` | honda civic | - | kinetic | ultimate | **STRIP** | stage burst (flash+lines+ring+crescent+speedBurst+crescent2+aftershock); pale palette (kinetic); 1 white ring |
| Stun Ray | `raceStunRay` | barbarella | lightning | lightning | standard | **REPLACE** | stage burst (flash+ring); pale palette (lightning); 1 flash layer |
| Zap Zap Zap | `bbZapZapZap` | bligblog | lightning | lightning | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (lightning); own look: screen flash, 3 white colours |
| Love Ray | `sigLoveRay` | barbarella | psychic | psychicHex | standard | **STRIP** | pale palette (psychicHex); own look: 2 white colours |
| Goop Ray | `bbGoopRay` | bligblog | water | water | light | **STRIP** | stage burst (flash+ring); pale palette (water); own look: screen flash, 4 white colours |

## B5 · Portal look (doors, teleports, summons, escapes) (81)

| Spell | id | Race / school | Element | Stage look | Weight | Rule | White layers found |
|---|---|---|---|---|---|---|---|
| Black Hole | `sharedBlackHole` | voidweaver | - | anomaly | ultimate | **STRIP** | stage burst (flash+lines+ring+orb+aftershock); pale palette (anomaly); own look: screen flash, 3 white colours |
| Cryptid Vanish | `raceCryptidVanish` | mothman | - | anomaly | standard | **REPLACE** | stage burst (flash+ring); pale palette (anomaly) |
| Deep Dive | `raceDeepDive` | loch ness monster | - | anomaly | standard | **REPLACE** | stage burst (flash+ring); pale palette (anomaly) |
| Land on Your Feet | `raceLandOnYourFeet` |  | physical | anomaly | standard | **REPLACE** | stage burst (flash+ring); pale palette (anomaly) |
| Shed Skin | `raceShedSkin` | reptilian | - | anomaly | standard | **REPLACE** | stage burst (flash+ring); pale palette (anomaly) |
| Mirror Blink | `raceMirrorBlink` | machine elves | - | arcane | light | **REPLACE** | stage burst (flash+ring) |
| Teleport | `teleport` | Psychic | - | arcane | standard | **REPLACE** | stage burst (flash+ring) |
| Summon Blood Rain | `sharedSummonBloodRain` | demon | blood | blood | standard | **STRIP** | stage burst (flash+ring); own look: 1 white colours |
| Thrall Bite | `raceThrallBite` | vampire | blood | blood | standard | **REPLACE** | stage burst (flash+ring+speedBurst); 1 flash layer |
| Light Door | `gunLightDoor` |  | - | divine | standard | **REPLACE** | stage burst (flash+ring); pale palette (divine) |
| Burrow | `nrBurrow` | mole man | earth | earth | light | **REPLACE** | stage burst (flash+ring) |
| QB Sneak | `raceQBSneak` | quarterback | earth | earth | standard | **REPLACE** | stage burst (flash+ring+speedBurst) |
| Hell Door | `gunHellDoor` |  | fire | fire | standard | **REPLACE** | stage burst (flash+ring) |
| Dimensional Fold | `raceDimensionalFold` | voidweaver | - | grapple | light | **REPLACE** | stage burst (flash+ring) |
| Fireman's Carry | `sigFiremansCarry` | firefighter | - | grapple | standard | **REPLACE** | stage burst (flash+ring+speedBurst) |
| Miracle | `raceWingsOfMercy` | angel | - | grapple | standard | **STRIP** | stage burst (flash+ring+speedBurst); 1 white ring; own look: 2 white colours |
| Singularity | `raceSingularity` | ai | - | grapple | ultimate | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); own look: screen flash, 3 white colours |
| Skin Swap | `raceSkinSwap` | skinwalker | - | grapple | standard | **REPLACE** | stage burst (flash+ring+speedBurst) |
| Tag In | `raceTagIn` |  | physical | grapple | light | **REPLACE** | stage burst (flash+ring) |
| Temporal Shift | `raceTemporalShift` | watcher | - | grapple | standard | **REPLACE** | stage burst (flash+ring+speedBurst) |
| Dimensional Web | `raceDimensionalWeb` | voidweaver | - | hex | standard | **REPLACE** | pale palette (hex); 1 flash layer; 1 white ring |
| Archers' Door | `gunArchersDoor` |  | physical | human | standard | **REPLACE** | stage burst (flash+ring+speedBurst); pale palette (human) |
| Doorstep Dash | `nrDoorstepDash` | delivery boy | - | human | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (human); own look: 1 white colours |
| Kickflip | `nrKickflip` | skater | - | human | light | **REPLACE** | stage burst (flash+ring); pale palette (human) |
| Rabbit Hole | `raceRabbitHole` |  | - | human | standard | **REPLACE** | stage burst (flash+ring); pale palette (human) |
| Shut Door | `gunShutDoor` |  | physical | human | light | **REPLACE** | stage burst (flash+ring); pale palette (human) |
| Frost Door | `gunFrostDoor` |  | ice | ice | standard | **REPLACE** | stage burst (flash+ring); pale palette (ice) |
| Summon Blizzard | `sharedSummonBlizzard` | cosmic wraith | ice | ice | standard | **STRIP** | stage burst (flash+ring); pale palette (ice); 1 flash layer; 1 white ring |
| Instant Transmission | `raceInstantTransmission` | ki fighter | - | ki | standard | **REPLACE** | stage burst (flash+ring+crescent+speedBurst); pale palette (ki) |
| Laser Door | `gunLaserDoor` |  | lightning | lightning | standard | **REPLACE** | stage burst (flash+ring); pale palette (lightning) |
| Summon Creation | `raceSummonCreation` | mad scientist | lightning | lightning | standard | **REPLACE** | stage burst (flash+ring); pale palette (lightning) |
| Summon Thunderstorm | `thunderstorm` | mothman | lightning | lightning | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (lightning); own look: 2 white colours |
| Cordyceps | `goCordyceps` | mushroom girl | nature | nature | standard | **STRIP** | stage burst (flash+ring) |
| Elephant | `raceElephant` |  | nature | nature | standard | **REPLACE** | stage burst (flash+ring) |
| Hawk | `raceHawk` |  | nature | nature | light | **REPLACE** | stage burst (flash+ring) |
| Into the Green | `raceTreelineRetreat` | bigfoot | nature | nature | standard | **STRIP** | stage burst (flash+ring); own look: 2 white colours |
| Spirit Animal | `pzSpiritAnimal` | shaman | nature | nature | standard | **STRIP** | stage burst (flash+ring) |
| Whistle | `raceWhistle` | cowboy | nature | nature | standard | **REPLACE** | stage burst (flash+ring); 2 flash layers; 2 white rings |
| Wolf Pack | `raceWolfPack` |  | nature | nature | standard | **REPLACE** | stage burst (flash+ring) |
| Brood | `raceBrood` | bee queen | poison | poison | standard | **REPLACE** | stage burst (flash+ring) |
| Eyes Go Black | `sigEyesGoBlack` | black goo | poison | poison | standard | **STRIP** | stage burst (flash+ring); own look: 2 white colours |
| Icky Surprise | `raceIckySurprise` | black goo | poison | poison | standard | **REPLACE** | stage burst (flash+ring) |
| Infect | `raceInfect` | zombie | poison | poison | standard | **REPLACE** | stage burst (flash+ring) |
| Mitosis | `raceMitosisSplit` | black goo | poison | poison | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock) |
| Astral Projection | `raceAstralProjection` |  | psychic | psychic | standard | **REPLACE** | stage burst (flash+ring); pale palette (psychic) |
| Brainwash | `raceBrainwash` | telepath | psychic | psychic | standard | **REPLACE** | stage burst (flash+ring); pale palette (psychic) |
| Breaking and Entering | `raceBreakingEntering` | door agent | psychic | psychic | standard | **REPLACE** | stage burst (flash+ring+speedBurst); pale palette (psychic) |
| Door Dash | `raceDoorDash` | door agent | psychic | psychic | standard | **REPLACE** | stage burst (flash+ring); pale palette (psychic) |
| Door Slam | `raceDoorSlam` |  | psychic | psychic | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (psychic); own look: 2 white colours |
| Drop In | `raceDropIn` | door agent | psychic | psychic | ultimate | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (psychic); 1 flash layer |
| Enthrall | `raceEnthrall` | succubus | psychic | psychic | standard | **REPLACE** | stage burst (flash+ring); pale palette (psychic) |
| Infernal Waltz | `sigInfernalWaltz` | demon princess | psychic | psychic | standard | **REPLACE** | stage burst (flash+ring); pale palette (psychic) |
| Maw Door | `gunMawDoor` |  | psychic | psychic | standard | **REPLACE** | stage burst (flash+ring); pale palette (psychic) |
| Play With Me | `nrPlayWithMe` | haunted doll | psychic | psychic | standard | **REPLACE** | stage burst (flash+ring); pale palette (psychic) |
| Possession | `racePossession` | ghost | psychic | psychic | standard | **STRIP** | stage burst (flash+ring); pale palette (psychic); own look: 3 white colours |
| Spirit Walk | `raceSpiritWalk` | shaman | psychic | psychic | standard | **REPLACE** | stage burst (flash+ring); pale palette (psychic) |
| Swing Door | `raceSwingDoor` | door agent | psychic | psychic | light | **REPLACE** | stage burst (flash+ring); pale palette (psychic) |
| Trapdoor | `raceTrapdoor` | door agent | psychic | psychic | standard | **STRIP** | stage burst (flash+ring+speedBurst); pale palette (psychic); own look: 3 white colours |
| Twin Doors | `gunTwinDoors` |  | psychic | psychic | standard | **REPLACE** | stage burst (flash+ring); pale palette (psychic) |
| Eject! | `raceEject` | mech | - | tech | standard | **REPLACE** | stage burst (flash+ring); pale palette (tech) |
| Gravity Boots | `raceGravityBoots` | barbarella | - | tech | standard | **REPLACE** | stage burst (flash+ring); pale palette (tech) |
| Phase Walk | `racePhaseWalk` | cosmic wraith | - | tech | light | **REPLACE** | stage burst (flash+ring); pale palette (tech) |
| Abyssal Wings | `raceAbyssalWings` | fallen angel | - | unholy | standard | **REPLACE** | stage burst (flash+ring); 1 flash layer |
| Agent Vanish | `raceAgentVanish` | men in black | - | unholy | standard | **REPLACE** | stage burst (flash+ring) |
| Corpse Crawl | `raceCorpseCrawl` | dreameater | - | unholy | standard | **REPLACE** | stage burst (flash+ring) |
| Devour Soul | `raceVoidContract` | demon | - | unholy | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); 1 flash layer |
| Indoctrinate | `raceCultIndoctrinate` | cult leader | - | unholy | standard | **STRIP** | stage burst (flash+ring) |
| Into the Sack | `goIntoTheSack` | krampus | - | unholy | standard | **STRIP** | stage burst (flash+ring) |
| Raise the Dead | `raceRaiseDead` | necromancer | - | unholy | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); 1 flash layer; 1 white ring; own look: 2 white colours |
| Reassemble | `raceReassemble` | skeleton | - | unholy | standard | **REPLACE** | stage burst (flash+ring) |
| Shadow Realm | `raceShadowRealm` | demon | - | unholy | ultimate | **REPLACE** | stage burst (flash+lines+ring+aftershock); 1 flash layer; 1 white ring |
| Shadow Step | `raceShadowStep` | halfdemon | - | unholy | standard | **REPLACE** | stage burst (flash+ring) |
| The Gathering | `raceCultGathering` | cult leader | - | unholy | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock) |
| Void Rush | `voidRush` | shadow entity | - | unholy | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock) |
| Web Swing | `raceWebSwing` | symbiote | - | unholy | standard | **REPLACE** | stage burst (flash+ring) |
| Ocean Current | `raceJellyDrift` | jellyfish | water | water | standard | **REPLACE** | stage burst (flash+ring); pale palette (water) |
| Cathedral Perch | `goCathedralPerch` | gargoyle | wind | wind | standard | **STRIP** | stage burst (flash+ring+crescent+speedBurst); pale palette (wind) |
| Gust Door | `gunGustDoor` |  | wind | wind | standard | **REPLACE** | stage burst (flash+ring+crescent+speedBurst); pale palette (wind) |
| Mist Form | `raceMistForm` | vampire | wind | wind | standard | **REPLACE** | stage burst (flash+ring+crescent+speedBurst); pale palette (wind) |
| Nimble Dodge | `raceNimbleDodge` | catgirl | wind | wind | standard | **REPLACE** | stage burst (flash+ring+crescent+speedBurst); pale palette (wind) |
| Summon Sandstorm | `sharedSummonSandstorm` | anubis | wind | wind | standard | **REPLACE** | stage burst (flash+ring+crescent+speedBurst); pale palette (wind) |

## B6a · Light: divine, aura, heal, mana, lightning (part 1) (96)

| Spell | id | Race / school | Element | Stage look | Weight | Rule | White layers found |
|---|---|---|---|---|---|---|---|
| Anthem | `warCry` | Warrior | sonic | aura | standard | **REPLACE** | pale palette (aura); 3 flash layers; 1 white ring |
| Apex Roar | `raceApexRoar` | dinosaur | sonic | aura | standard | **REPLACE** | pale palette (aura); 2 flash layers; 2 white rings |
| Astral Barrier | `raceAstralBarrier` | watcher | - | aura | light | **STRIP** | pale palette (aura); 1 white ring; own look: 3 white colours |
| Audible | `raceAudible` | quarterback | sonic | aura | standard | **REPLACE** | pale palette (aura); 1 flash layer; 1 white ring |
| Awakening | `raceAwakening` | cult leader | - | aura | ultimate | **REPLACE** | pale palette (aura); 1 flash layer; 2 white rings |
| Ayahuasca Retreat | `raceAyahuascaRetreat` | shaman | nature | aura | standard | **STRIP** | pale palette (aura); 1 flash layer; 1 white ring; own look: screen flash, 3 white colours |
| Azazel's Forge | `goAzazelsForge` | nephilim | metal | aura | standard | **LEAVE** | pale palette (aura) |
| Bath Salts | `nrBathSalts` | florida man | - | aura | standard | **LEAVE** | pale palette (aura) |
| Bipod | `goBipod` | marksman | - | aura | standard | **LEAVE** | pale palette (aura) |
| Black Budget | `raceBlackBudget` | politician | - | aura | standard | **REPLACE** | pale palette (aura); 1 flash layer |
| Black Guard | `sentaiBlackGuard` | super sentai | - | aura | standard | **REPLACE** | pale palette (aura); 1 flash layer; 1 white ring |
| Blessing | `raceBlessing` | priest | - | aura | light | **REPLACE** | pale palette (aura); 2 flash layers; 1 white ring |
| Blurry Photo | `sigBlurryPhoto` | bigfoot | nature | aura | standard | **STRIP** | pale palette (aura); 1 flash layer; own look: 2 white colours |
| Called by Name | `sigCalledByName` | chosen one | - | aura | standard | **STRIP** | pale palette (aura); own look: 1 white colours |
| Camouflage | `camouflage` | Sniper | nature | aura | standard | **LEAVE** | pale palette (aura) |
| Can't Stop Me | `goCantStopMe` | juggernaut | metal | aura | standard | **LEAVE** | pale palette (aura) |
| Collection Plate | `nrCollectionPlate` | televangelist | - | aura | standard | **LEAVE** | pale palette (aura) |
| Crystal Coffin | `sigCrystalCoffin` | crystal guardian | earth | aura | standard | **STRIP** | pale palette (aura); own look: 2 white colours |
| Death Pact | `raceDeathPact` | necromancer | - | aura | light | **STRIP** | pale palette (aura); own look: 3 white colours |
| Dig In | `nrDigIn` | cicada brood | earth | aura | light | **LEAVE** | pale palette (aura) |
| Double Down | `raceDoubleDown` | bunny girl | - | aura | standard | **LEAVE** | pale palette (aura) |
| Emet | `goEmet` | golem | earth | aura | light | **LEAVE** | pale palette (aura) |
| Encore | `encore` | Harbinger | sonic | aura | standard | **STRIP** | pale palette (aura); 1 white ring; own look: 1 white colours |
| Everybody Up | `raceEverybodyUp` |  | - | aura | standard | **LEAVE** | pale palette (aura) |
| Extended Clips | `raceExtendedClips` | gangster | metal | aura | standard | **LEAVE** | pale palette (aura) |
| Fairy Dust | `raceFairyDust` | fairy | wind | aura | standard | **REPLACE** | pale palette (aura); 2 flash layers; 2 white rings |
| Feathered Serpent | `nrFeatheredSerpent` | quetzalcoatl | wind | aura | light | **LEAVE** | pale palette (aura) |
| Filter | `nrFilter` | influencer | - | aura | standard | **STRIP** | pale palette (aura); own look: 1 white colours |
| Firewall Protocol | `raceFirewallProtocol` | droid | - | aura | standard | **REPLACE** | pale palette (aura); 1 flash layer |
| Fortify | `fortify` | Tank | - | aura | light | **STRIP** | pale palette (aura); 2 flash layers; 1 white ring; own look: 1 white colours |
| Forward March | `goForwardMarch` | general | - | aura | standard | **LEAVE** | pale palette (aura) |
| Go Ape | `raceApeFury` | king kong | - | aura | standard | **REPLACE** | pale palette (aura); 1 flash layer; 1 white ring |
| Grind | `nrGrind` | skater | - | aura | standard | **STRIP** | pale palette (aura); own look: 1 white colours |
| Hellfire Crown | `raceHellfireCrown` | overlord | - | aura | light | **STRIP** | pale palette (aura); 1 flash layer |
| Holy Bulwark | `raceHolyBulwark` | nephilim | - | aura | standard | **STRIP** | pale palette (aura); 3 flash layers; 2 white rings; own look: 3 white colours |
| Hop On | `nrHopOn` | delivery boy | - | aura | standard | **STRIP** | pale palette (aura); own look: 4 white colours |
| Howl | `raceHowl` | werewolf | sonic | aura | light | **STRIP** | pale palette (aura); 2 flash layers; 2 white rings; own look: screen flash, speed burst, 3 white colours |
| Incendiary Rounds | `raceIncendiaryRounds` | marksman | fire | aura | standard | **REPLACE** | pale palette (aura); 1 flash layer; 1 white ring |
| Inservice | `nrInservice` | lifeguard | - | aura | standard | **STRIP** | pale palette (aura); 1 white ring |
| Invulnerable | `raceInvulnerable` | superhero | - | aura | standard | **LEAVE** | pale palette (aura) |
| Iron Bulwark | `raceIronBulwark` | general | - | aura | standard | **STRIP** | pale palette (aura); 1 flash layer |
| Iron Dome | `shieldBash` | Tank | - | aura | heavy | **STRIP** | pale palette (aura); 1 flash layer; 1 white ring; own look: 4 white colours |
| Kawarimi | `nrKawarimi` | ninja | - | aura | standard | **LEAVE** | pale palette (aura) |
| Lawn Ornament | `goLawnOrnament` | gnome | earth | aura | standard | **STRIP** | pale palette (aura); own look: 4 white colours |
| Light Shield | `racePleiadianShield` | nordic | - | aura | standard | **REPLACE** | pale palette (aura); 1 flash layer |
| Luminous Shield | `raceLuminousShield` | orb of light | - | aura | standard | **STRIP** | pale palette (aura); 3 flash layers; 1 white ring; own look: 3 white colours |
| Mantra | `raceMantra` |  | - | aura | standard | **LEAVE** | pale palette (aura) |
| Mimicry | `raceMimicry` | skinwalker | - | aura | ultimate | **LEAVE** | pale palette (aura) |
| Monster Serum | `raceMonsterSerum` | mad scientist | poison | aura | standard | **REPLACE** | pale palette (aura); 2 flash layers; 1 white ring |
| Nitro Boost | `raceNitroBoost` | honda civic | - | aura | standard | **REPLACE** | pale palette (aura); 1 flash layer; 1 white ring |
| Oath of Valor | `raceOathOfValor` | knight | - | aura | standard | **STRIP** | pale palette (aura); own look: 1 white colours |
| On Duty | `nrOnDuty` | lifeguard | - | aura | standard | **LEAVE** | pale palette (aura) |
| Orchid Disguise | `goOrchidDisguise` | mantid | nature | aura | light | **LEAVE** | pale palette (aura) |
| Overcalculate | `raceOvercalculate` | ai | - | aura | standard | **REPLACE** | pale palette (aura); 1 flash layer |
| Overclock | `overclock` | robot | lightning | aura | standard | **REPLACE** | pale palette (aura); 2 flash layers; 1 white ring |
| Overclock | `raceOverclock` | Engineer | lightning | aura | standard | **REPLACE** | pale palette (aura); 1 flash layer |
| Overtinker | `raceOvertinker` | gnome | metal | aura | ultimate | **LEAVE** | pale palette (aura) |
| Pep Talk | `jackOfAll` | homosapien | - | aura | standard | **REPLACE** | pale palette (aura); 1 flash layer |
| Phase Shift | `racePhaseShift` | shadow entity | - | aura | standard | **REPLACE** | pale palette (aura); 1 flash layer |
| Plot Armor | `racePlotArmor` | swordfighter | - | aura | standard | **STRIP** | pale palette (aura); own look: 1 white colours |
| Prayer | `racePrayer` | priest | - | aura | standard | **REPLACE** | pale palette (aura); 2 flash layers; 1 white ring |
| Premonition | `racePremonition` |  | - | aura | standard | **LEAVE** | pale palette (aura) |
| Prophecy Fulfilled | `raceProphecyFulfilled` | chosen one | - | aura | standard | **LEAVE** | pale palette (aura) |
| Protect | `protect1` | priest | - | aura | standard | **REPLACE** | pale palette (aura); 2 flash layers; 1 white ring |
| Pupil Shield | `racePupilShield` | occulus | - | aura | light | **STRIP** | pale palette (aura); 1 white ring; own look: 3 white colours |
| Rally Command | `raceRallyCommand` | general | - | aura | standard | **STRIP** | pale palette (aura); 3 flash layers; 1 white ring |
| Rapture | `raceRapture` | seraphim | - | aura | standard | **STRIP** | pale palette (aura); 2 flash layers; own look: 1 white colours |
| Rescue Line | `raceRescueLine` |  | metal | aura | standard | **LEAVE** | pale palette (aura) |
| Royal Decree | `raceRoyalDecree` | king arthur | - | aura | standard | **STRIP** | pale palette (aura); 1 flash layer; 2 white rings |
| Saddle Up | `raceSaddleUp` |  | - | aura | standard | **LEAVE** | pale palette (aura) |
| Salt-Proof Stance | `nrSaltProof` | samurai slug | - | aura | standard | **STRIP** | pale palette (aura); own look: 2 white colours |
| Scabbard of Excalibur | `goScabbard` | king arthur | - | aura | standard | **LEAVE** | pale palette (aura) |
| Sermon | `raceCultSermon` | cult leader | - | aura | standard | **LEAVE** | pale palette (aura) |
| Sheltering Wings | `sigShelteringWings` | angel | - | aura | standard | **STRIP** | pale palette (aura); own look: 3 white colours |
| Shield Maiden | `raceShieldMaiden` | valkraye | - | aura | standard | **STRIP** | pale palette (aura); 1 flash layer; 1 white ring; own look: 1 white colours |
| Siege Mode | `raceSiegeMode` | mech | - | aura | standard | **REPLACE** | pale palette (aura); 1 flash layer; 1 white ring |
| Sleight of Hand | `nrSleightOfHand` | magician | - | aura | light | **STRIP** | pale palette (aura); own look: 2 white colours |
| Sparkle | `raceSparkle` | fairy | - | aura | light | **REPLACE** | pale palette (aura); 1 flash layer; 1 white ring |
| Sponsored | `nrSponsored` | influencer | - | aura | standard | **LEAVE** | pale palette (aura) |
| Stone Skin | `raceStoneSkin` | golem | - | aura | standard | **STRIP** | pale palette (aura); 1 white ring |
| Stoneform | `raceStoneform` | gargoyle | earth | aura | standard | **REPLACE** | pale palette (aura); 1 white ring |
| Submerge | `nrSubmerge` | sewer gator | water | aura | light | **STRIP** | pale palette (aura); own look: 2 white colours |
| Swarm Signal | `raceSwarmSignal` | antperson | - | aura | ultimate | **STRIP** | pale palette (aura); 1 flash layer |
| Tailwind | `raceTailwind` |  | wind | aura | standard | **STRIP** | pale palette (aura); 1 white ring; own look: 1 white colours |
| Take Root | `pzTakeRoot` | tree person | nature | aura | standard | **LEAVE** | pale palette (aura) |
| Tarot Draw | `raceTarotDraw` | fortune teller | - | aura | standard | **STRIP** | pale palette (aura); own look: screen flash, 2 white colours |
| Tax Exempt | `nrTaxExempt` | televangelist | - | aura | standard | **STRIP** | pale palette (aura); own look: 1 white colours |
| Thick Hide | `raceThickHide` | juggernaut | - | aura | standard | **REPLACE** | pale palette (aura); 1 white ring |
| Thirty Minutes or Less | `nrThirtyMinutes` | delivery boy | - | aura | ultimate | **STRIP** | pale palette (aura); own look: 1 white colours |
| Three Whistles | `nrThreeWhistles` | lifeguard | - | aura | ultimate | **LEAVE** | pale palette (aura) |
| Tin Foil Hat | `raceTinFoilHat` | conspiracy theorist | metal | aura | light | **REPLACE** | pale palette (aura); 1 flash layer |
| Updraft | `raceUpdraft` |  | wind | aura | standard | **LEAVE** | pale palette (aura) |
| Wish Granted | `raceWishGranted` | djinn | - | aura | standard | **REPLACE** | pale palette (aura); 2 flash layers; 1 white ring |
| Ancient Magic | `raceAncientMagic` | djinn | - | divine | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock+pillar); pale palette (divine); own look: 1 white colours |
| Blue Beam | `raceBlueBeam` |  | - | divine | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock+pillar); pale palette (divine) |
| Celibacy | `nrCelibacy` | pope | light | divine | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock+pillar); pale palette (divine); own look: 4 white colours |

## B6b · Light: divine, aura, heal, mana, lightning (part 2) (95)

| Spell | id | Race / school | Element | Stage look | Weight | Rule | White layers found |
|---|---|---|---|---|---|---|---|
| Chooser of the Slain | `raceChooserOfSlain` | valkraye | - | divine | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock+pillar); pale palette (divine); 2 flash layers; 1 white ring; own look: screen flash, speed burst, 5 white colours |
| Coil | `nrCoil` | quetzalcoatl | - | divine | standard | **STRIP** | stage burst (flash+ring+speedBurst); pale palette (divine) |
| Crusade | `raceCrusade` | knight | - | divine | ultimate | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock+pillar); pale palette (divine); 2 flash layers; 2 white rings; own look: screen flash, 3 white colours |
| Divine Judgment | `raceDivineJudgment` | seraphim | - | divine | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock+pillar); pale palette (divine); 4 flash layers; 4 white rings; own look: screen flash, speed burst, 6 white colours |
| Divine Smite | `raceDivineSmite` | angel | - | divine | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock+pillar); pale palette (divine); 1 flash layer; 1 white ring; own look: screen flash, 1 white colours |
| Excalibur Strike | `raceExcaliburStrike` | king arthur | - | divine | ultimate | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock+pillar); pale palette (divine); 1 flash layer; own look: screen flash, speed burst, 9 white colours |
| Excommunication | `nrExcommunication` | pope | light | divine | standard | **STRIP** | stage burst (flash+ring); pale palette (divine); own look: 2 white colours |
| Exorcism | `exorcism` | priest | - | divine | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock+pillar); pale palette (divine); 2 flash layers; 1 white ring; own look: 1 white colours |
| Fallen Grace | `raceFallenGrace` | fallen angel | - | divine | light | **STRIP** | stage burst (flash+ring); pale palette (divine); own look: screen flash |
| Glint | `sigGlint` | crystal guardian | - | divine | light | **STRIP** | stage burst (flash+ring); pale palette (divine); 1 flash layer; own look: 3 white colours |
| Glitter Bomb | `raceGlitterBomb` | fairy | - | divine | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock+pillar); pale palette (divine); 1 flash layer; 1 white ring; own look: 3 white colours |
| Glitterburst | `raceGlitterburst` | fairy | - | divine | standard | **REPLACE** | stage burst (flash+ring); pale palette (divine); 1 flash layer; 1 white ring |
| Horn Light | `uniHornLight` | unicorn | - | divine | light | **REPLACE** | stage burst (flash+ring); pale palette (divine) |
| Inner Peace | `cleanse` | White Mage | - | divine | standard | **REPLACE** | stage burst (flash+ring); pale palette (divine); 2 flash layers |
| Judgment | `judgment` | Warrior | - | divine | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock+pillar); pale palette (divine); 4 flash layers; 4 white rings; own look: screen flash, speed burst, 6 white colours |
| Knights of Round | `raceKnightsOfRound` | king arthur | - | divine | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock+pillar); pale palette (divine); 2 flash layers; own look: screen flash, speed burst, 8 white colours |
| Last Rites | `pzLastRites` | priest | - | divine | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock+pillar); pale palette (divine); own look: 3 white colours |
| Merkaba | `raceMerkaba` | seraphim | - | divine | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock+pillar); pale palette (divine); 1 white ring; own look: screen flash, 3 white colours |
| Morning Star | `nrMorningStar` | quetzalcoatl | light | divine | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock+pillar); pale palette (divine); own look: 1 white colours |
| Neuralyzer | `goNeuralyzer` | men in black | - | divine | standard | **STRIP** | stage burst (flash+ring); pale palette (divine); 1 flash layer; own look: screen flash, 2 white colours |
| Nothing Unseen | `pzNothingUnseen` | watcher | - | divine | standard | **STRIP** | stage burst (flash+ring); pale palette (divine); own look: 4 white colours |
| Obsidian Blade | `nrObsidianBlade` | quetzalcoatl | - | divine | standard | **STRIP** | stage burst (flash+ring+speedBurst); pale palette (divine) |
| Paparazzi Flash | `pzPaparazziFlash` | popstar | - | divine | standard | **STRIP** | stage burst (flash+ring); pale palette (divine); 1 flash layer; own look: screen flash, 1 white colours |
| Penance | `goPenance` | priest | - | divine | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock+pillar); pale palette (divine) |
| Photon Scatter | `racePhotonScatter` | orb of light | - | divine | standard | **REPLACE** | stage burst (flash+ring); pale palette (divine); 2 flash layers |
| Prism Burst | `racePrismBurst` | orb of light | - | divine | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock+pillar); pale palette (divine); 2 flash layers; 1 white ring; own look: screen flash, 2 white colours |
| Purify | `racePurify` | priest | - | divine | standard | **STRIP** | stage burst (flash+ring); pale palette (divine); own look: 1 white colours |
| Ratio | `nrRatio` | influencer | light | divine | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock+pillar); pale palette (divine) |
| Revive | `revive1` | White Mage | - | divine | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock+pillar); pale palette (divine); 2 flash layers; 2 white rings |
| Smite | `raceSmite` | angel | - | divine | standard | **STRIP** | stage burst (flash+ring); pale palette (divine); 1 flash layer; own look: 1 white colours |
| Star Decree | `raceStarDecree` | annunaki | - | divine | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock+pillar); pale palette (divine); 1 white ring |
| Supernova | `raceSupernova` | orb of light | - | divine | ultimate | **REPLACE** | stage burst (flash+lines+ring+aftershock+pillar); pale palette (divine); 3 flash layers |
| Unicorn Charge | `uniUnicornCharge` | unicorn | - | divine | heavy | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock+pillar); pale palette (divine) |
| Wrath of the Watchers | `raceWrathOfTheWatchers` | nephilim | - | divine | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock+pillar); pale palette (divine); 1 flash layer; 1 white ring; own look: screen flash, 1 white colours |
| Absolution | `raceAbsolution` | priest | - | heal | light | **STRIP** | pale palette (heal); 2 flash layers; 1 white ring; own look: 1 white colours |
| Antidote | `raceAntidote` |  | - | heal | standard | **LEAVE** | pale palette (heal) |
| Apple Seed | `appleSeed` | Harvester | nature | heal | standard | **LEAVE** | pale palette (heal) |
| Cat Nap | `raceCatNap` |  | - | heal | standard | **LEAVE** | pale palette (heal) |
| CPR | `nrCPR` | lifeguard | - | heal | standard | **STRIP** | pale palette (heal); own look: 2 white colours |
| Deep Breath | `raceDeepBreath` |  | - | heal | standard | **LEAVE** | pale palette (heal) |
| Divine Light | `raceDivineLight` | priest | - | heal | standard | **STRIP** | pale palette (heal); 2 flash layers; own look: 1 white colours |
| Ember Heart | `raceEmberHeart` |  | fire | heal | standard | **LEAVE** | pale palette (heal) |
| Emerald Heart | `sigEmeraldHeart` | crystal guardian | nature | heal | standard | **LEAVE** | pale palette (heal) |
| Hallelujah | `raceHallelujah` | priest | - | heal | ultimate | **STRIP** | pale palette (heal); 1 flash layer; 1 white ring |
| Heal | `heal1` | White Mage | - | heal | standard | **STRIP** | pale palette (heal); 2 flash layers; 1 white ring; own look: 1 white colours |
| Heal All | `healAll` | White Mage | - | heal | heavy | **REPLACE** | pale palette (heal); 2 flash layers; 1 white ring |
| Healing Horn | `uniHealingHorn` | unicorn | - | heal | standard | **LEAVE** | pale palette (heal) |
| Healing Seed | `healingSeed` | Harvester | nature | heal | light | **STRIP** | pale palette (heal); 1 white ring |
| Herbal Remedy | `raceHerbalRemedy` | shaman | nature | heal | standard | **STRIP** | pale palette (heal); own look: screen flash, 3 white colours |
| Hot and Fresh | `nrHotAndFresh` | delivery boy | fire | heal | light | **STRIP** | pale palette (heal); own look: 2 white colours |
| Immortal Cycle | `raceJellyRebirth` | jellyfish | water | heal | ultimate | **STRIP** | pale palette (heal); 1 flash layer; own look: 1 white colours |
| Laying On of Hands | `nrLayingOnHands` | televangelist | light | heal | light | **LEAVE** | pale palette (heal) |
| Line of Credit | `nrLineOfCredit` | banker | - | heal | light | **LEAVE** | pale palette (heal) |
| Lunar Regeneration | `raceLunarRegeneration` |  | - | heal | standard | **LEAVE** | pale palette (heal) |
| Milk and Cookies | `raceMilkAndCookies` |  | - | heal | heavy | **LEAVE** | pale palette (heal) |
| Miracle | `nrMiracle` | televangelist | light | heal | standard | **LEAVE** | pale palette (heal) |
| On the House | `bnOnTheHouse` | bunny girl | - | heal | standard | **LEAVE** | pale palette (heal) |
| Pink Healing | `sentaiPinkHeal` | super sentai | - | heal | standard | **REPLACE** | pale palette (heal); 1 white ring |
| Pleiadian Touch | `racePleiadianTouch` |  | - | heal | standard | **LEAVE** | pale palette (heal) |
| Rejuvenation | `raceRejuvenation` |  | nature | heal | heavy | **STRIP** | pale palette (heal); own look: 3 white colours |
| Repair | `repair` | Engineer | metal | heal | standard | **REPLACE** | pale palette (heal); 1 flash layer; 1 white ring |
| Sanctuary | `raceSanctuary` | seraphim | - | heal | standard | **STRIP** | pale palette (heal); 3 flash layers; 2 white rings; own look: 1 white colours |
| Séance | `raceSpiritChannel` | fortune teller | psychic | heal | standard | **REPLACE** | pale palette (heal); 1 flash layer |
| Self-Repair Protocol | `raceSelfRepairProtocol` | android | - | heal | standard | **LEAVE** | pale palette (heal) |
| Shake It Off | `raceShakeItOff` |  | - | heal | standard | **LEAVE** | pale palette (heal) |
| Soothe | `raceSoothe` | starfish | - | heal | light | **LEAVE** | pale palette (heal) |
| Taste Test | `nrTasteTest` | chef | - | heal | standard | **LEAVE** | pale palette (heal) |
| Temporal Tide | `raceTemporalTide` | atlantean | water | heal | standard | **STRIP** | pale palette (heal); own look: 4 white colours |
| Thoughts and Prayers | `nrThoughtsAndPrayers` | pope | light | heal | light | **LEAVE** | pale palette (heal) |
| Tidal Blessing | `raceTidalBlessing` | mermaid | - | heal | standard | **REPLACE** | pale palette (heal); 1 flash layer; 1 white ring |
| Time Rewind | `raceTimeRewindHeal` | watcher | - | heal | standard | **LEAVE** | pale palette (heal) |
| Yo Ho | `raceYoHo` | pirate | water | heal | heavy | **LEAVE** | pale palette (heal) |
| Bolt from the Blue | `raceBoltFromTheBlue` |  | lightning | lightning | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (lightning); own look: 4 white colours |
| Chain Lightning | `raceChainLightning` |  | lightning | lightning | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (lightning); 1 flash layer; own look: 3 white colours |
| Classified Weapon | `raceClassifiedWeapon` | men in black | lightning | lightning | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (lightning) |
| Conduction | `raceConduction` |  | lightning | lightning | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (lightning); 1 flash layer |
| Crystal Resonator | `sigCrystalResonator` | atlantean | lightning | lightning | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (lightning); 1 flash layer |
| Disintegrator | `raceDisintegrator` | martian | lightning | lightning | ultimate | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (lightning) |
| EMP Burst | `empBurst` | robot | lightning | lightning | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (lightning); 2 flash layers; 1 white ring |
| EMP Burst | `raceEmpPulse` | Engineer | lightning | lightning | ultimate | **REPLACE** | stage burst (flash+lines+ring+aftershock); pale palette (lightning) |
| EMP Grenade | `raceEMPGrenade` | cyborg | lightning | lightning | heavy | **REPLACE** | stage burst (flash+lines+ring+aftershock); pale palette (lightning); 1 flash layer; 1 white ring |
| Lag Spike | `goLagSpike` | glitch | lightning | lightning | light | **STRIP** | stage burst (flash+ring); pale palette (lightning) |
| Noisy Cricket | `goNoisyCricket` | men in black | lightning | lightning | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (lightning) |
| Orbital Strike | `sigOrbitalStrike` | astronaut | lightning | lightning | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (lightning); own look: 5 white colours |
| Shock Prod | `sigShockProd` | droid | lightning | lightning | standard | **STRIP** | stage burst (flash+ring); pale palette (lightning) |
| Stack Overflow | `goStackOverflow` | glitch | lightning | lightning | standard | **STRIP** | stage burst (flash+ring); pale palette (lightning) |
| Static Burst | `nrStaticBurst` | cursed tv | lightning | lightning | light | **STRIP** | stage burst (flash+ring); pale palette (lightning); 1 flash layer; own look: 1 white colours |
| Static Shock | `raceStaticShock` |  | lightning | lightning | standard | **STRIP** | stage burst (flash+ring); pale palette (lightning); own look: 2 white colours |
| Taser | `racePoliceTaser` | police officer | lightning | lightning | standard | **STRIP** | stage burst (flash+ring); pale palette (lightning); own look: 1 white colours |
| Taser Bolt | `raceTaserBolt` | droid | lightning | lightning | light | **REPLACE** | stage burst (flash+ring); pale palette (lightning); 1 flash layer |
| Tempest | `raceTempest` |  | lightning | lightning | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (lightning); own look: 3 white colours |
| Thunderbolt | `thunder1` | Black Mage | lightning | lightning | standard | **STRIP** | stage burst (flash+ring); pale palette (lightning); 2 flash layers; own look: 3 white colours |
| Topaz Jolt | `sigTopazJolt` | crystal guardian | lightning | lightning | light | **STRIP** | stage burst (flash+ring); pale palette (lightning) |
| Yellow Thunder | `sentaiYellowThunder` | super sentai | lightning | lightning | standard | **REPLACE** | stage burst (flash+ring); pale palette (lightning); 1 flash layer; 1 white ring |
| Free Energy | `freeEnergy` | mad scientist | lightning | mana | standard | **LEAVE** | pale palette (mana) |

## B7a · Air and cold: ice, water, wind, metal, sonic (part 1) (74)

| Spell | id | Race / school | Element | Stage look | Weight | Rule | White layers found |
|---|---|---|---|---|---|---|---|
| Absolute Zero | `raceAbsoluteZero` | wizard | ice | ice | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (ice); pale noise wash; own look: screen flash, speed burst, 7 white colours |
| Avalanche Strike | `raceAvalancheStrike` | yeti | ice | ice | ultimate | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (ice); pale noise wash; 1 flash layer; 1 white ring |
| Blizzard Present | `raceBlizzardPresent` | santa clause | ice | ice | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (ice); pale noise wash; 1 flash layer; 1 white ring; own look: screen flash, 1 white colours |
| Dark Justice | `raceDarkJustice` | antihero | - | ice | standard | **REPLACE** | stage burst (flash+ring+speedBurst); pale palette (ice); 1 flash layer |
| Diamond Dust | `raceDiamondDust` | ice queen | ice | ice | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (ice); pale noise wash; 1 white ring; own look: 2 white colours |
| Flash Freeze | `sharedFlashFreeze` | ghost | ice | ice | standard | **STRIP** | stage burst (flash+ring); pale palette (ice); pale noise wash; own look: 2 white colours |
| Frost Howl | `nrFrostHowl` | wendigo | ice | ice | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (ice); pale noise wash; own look: 1 white colours |
| Frozen Punch | `raceFrozenPunch` | yeti | ice | ice | standard | **REPLACE** | stage burst (flash+ring+speedBurst); pale palette (ice); pale noise wash |
| Glacial Slam | `raceGlacialSlam` |  | ice | ice | heavy | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (ice); pale noise wash |
| Glacier Break | `raceGlacierBreak` |  | ice | ice | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (ice); pale noise wash; own look: 2 white colours |
| Grave Chill | `raceGraveChill` | skeleton | ice | ice | standard | **REPLACE** | stage burst (flash+ring); pale palette (ice); pale noise wash |
| Hailstorm | `raceHailstorm` |  | ice | ice | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (ice); pale noise wash; own look: 2 white colours |
| Ice Spear | `raceIceSpear` | ice queen | ice | ice | standard | **STRIP** | stage burst (flash+ring); pale palette (ice); pale noise wash; own look: 2 white colours |
| Permafrost | `racePermafrost` | yeti | ice | ice | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (ice); pale noise wash; 1 flash layer; 1 white ring; own look: 2 white colours |
| Sapphire Frost | `sigSapphireFrost` | crystal guardian | ice | ice | standard | **STRIP** | stage burst (flash+ring); pale palette (ice); pale noise wash; own look: 1 white colours |
| Shatter | `raceShatter` |  | ice | ice | standard | **STRIP** | stage burst (flash+ring); pale palette (ice); pale noise wash; own look: 2 white colours |
| Snow Fort | `raceSnowFort` |  | ice | ice | standard | **REPLACE** | stage burst (flash+ring); pale palette (ice) |
| Snow Globe | `pzSnowGlobe` | santa clause | ice | ice | standard | **STRIP** | stage burst (flash+ring); pale palette (ice); pale noise wash; own look: 5 white colours |
| Snow Queen's Kiss | `goSnowQueensKiss` | ice queen | ice | ice | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (ice); pale noise wash |
| Snowball Volley | `raceSnowballVolley` | santa clause | ice | ice | standard | **REPLACE** | stage burst (flash+ring); pale palette (ice); pale noise wash |
| Whiteout Roar | `pzWhiteoutRoar` | yeti | ice | ice | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (ice); pale noise wash |
| Ankle Biter | `goAnkleBiter` | gnome | metal | metal | standard | **STRIP** | stage burst (flash+ring+speedBurst); pale palette (metal); pale noise wash; own look: 2 white colours |
| Atlatl | `goAtlatl` | homosapien | metal | metal | standard | **STRIP** | stage burst (flash+ring+speedBurst); pale palette (metal); pale noise wash |
| Compactor | `pzCompactor` | robot | metal | metal | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (metal); pale noise wash; own look: screen flash, 2 white colours |
| Crossfire | `crossfire` | Gunslinger | metal | metal | heavy | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (metal); pale noise wash; 1 flash layer |
| Cuffed | `racePoliceCuffs` | police officer | metal | metal | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (metal); pale noise wash; 1 flash layer; own look: 1 white colours |
| Dead Eye | `deadEye` | Gunslinger | metal | metal | heavy | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (metal); pale noise wash; 2 flash layers |
| Destiny Fulfilled | `sigDestinyFulfilled` | chosen one | metal | metal | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (metal); pale noise wash; own look: 4 white colours |
| Dogpile | `goDogpile` | goblin | metal | metal | standard | **STRIP** | stage burst (flash+ring+speedBurst); pale palette (metal); pale noise wash |
| Double Pump | `doubleShot` | Gunslinger | metal | metal | light | **REPLACE** | stage burst (flash+ring); pale palette (metal); pale noise wash; 1 flash layer |
| Elbow Grease | `raceElbowGrease` | homosapien | metal | metal | standard | **REPLACE** | stage burst (flash+ring+speedBurst); pale palette (metal); pale noise wash |
| Fan the Hammer | `raceFanTheHammer` | cowboy | metal | metal | standard | **REPLACE** | stage burst (flash+ring+speedBurst); pale palette (metal); pale noise wash; 4 flash layers; 1 white ring |
| Garden Shears | `goGardenShears` | gnome | metal | metal | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (metal); pale noise wash; own look: 2 white colours |
| Garrote Watch | `spyGarroteWatch` | spy | metal | metal | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (metal); pale noise wash; own look: 1 white colours |
| Grapple | `raceGrapple` | pirate | metal | metal | light | **REPLACE** | stage burst (flash+ring); pale palette (metal) |
| Halligan Breach | `sigHalligan` | firefighter | metal | metal | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (metal); pale noise wash; 1 flash layer |
| Hatchet Throw | `goHatchetThrow` | goatman | metal | metal | standard | **STRIP** | stage burst (flash+ring+speedBurst); pale palette (metal); pale noise wash |
| High Noon | `raceHighNoon` | cowboy | metal | metal | ultimate | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (metal); pale noise wash; 1 flash layer |
| Honour Blow | `goHonourBlow` | knight | metal | metal | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (metal); pale noise wash; own look: 4 white colours |
| Hydraulic Crush | `raceHydraulicCrush` | robot | metal | metal | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (metal); pale noise wash; 1 flash layer; own look: screen flash |
| Justice Is Served | `pzJusticeIsServed` | sheriff | metal | metal | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (metal); pale noise wash |
| Kill Mode | `raceChassisSlam` | robot | metal | metal | ultimate | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (metal); pale noise wash; 3 flash layers; 1 white ring; own look: screen flash, speed burst, 1 white colours |
| Kill Mode | `raceChassisSlan` |  | metal | metal | ultimate | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (metal); pale noise wash |
| Kneecap Shot | `kneecapShot` | Sniper | metal | metal | light | **REPLACE** | stage burst (flash+ring); pale palette (metal); pale noise wash; 1 flash layer |
| Knife Throw | `knifeThrow` | Agent | metal | metal | standard | **REPLACE** | stage burst (flash+ring+speedBurst); pale palette (metal); pale noise wash; 1 flash layer |
| Lipstick Pistol | `spyLipstickPistol` | spy | metal | metal | light | **STRIP** | stage burst (flash+ring); pale palette (metal); pale noise wash; own look: 3 white colours |
| Lockdown | `racePoliceLockdown` | police officer | metal | metal | ultimate | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (metal); pale noise wash; 1 flash layer; own look: 1 white colours |
| Long Rifle | `raceQuickDraw` | cowboy | metal | metal | standard | **REPLACE** | stage burst (flash+ring+speedBurst); pale palette (metal); pale noise wash |
| Lovers' Lane | `goLoversLane` | goatman | metal | metal | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (metal); pale noise wash; own look: 2 white colours |
| Nightstick | `racePoliceNightstick` | police officer | metal | metal | standard | **STRIP** | stage burst (flash+ring+speedBurst); pale palette (metal); pale noise wash; 1 flash layer; own look: 1 white colours |
| Ninefold Scratch | `raceNinefoldScratch` | catgirl | metal | metal | ultimate | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (metal); pale noise wash; 1 flash layer; own look: screen flash, speed burst, 5 white colours |
| One Shot, One Kill | `goOneShotOneKill` | marksman | metal | metal | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (metal); pale noise wash; 1 flash layer |
| Piledriver Arm | `sigPiledriver` | cyborg | metal | metal | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (metal); pale noise wash; 1 flash layer; own look: 4 white colours |
| Plunder | `racePlunder` | pirate | metal | metal | standard | **REPLACE** | stage burst (flash+ring+speedBurst); pale palette (metal) |
| Precision Shot | `precisionShot` | Sniper | metal | metal | heavy | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (metal); pale noise wash; 1 flash layer |
| Run Them Down | `goRunThemDown` | homosapien | metal | metal | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (metal); pale noise wash |
| Scatter Shot | `riderScatterShot` |  | metal | metal | standard | **REPLACE** | stage burst (flash+ring+speedBurst); pale palette (metal); pale noise wash |
| Shield Bash | `raceShieldBash` |  | metal | metal | standard | **REPLACE** | stage burst (flash+ring+speedBurst); pale palette (metal); pale noise wash |
| Shuriken | `nrShuriken` | ninja | metal | metal | light | **REPLACE** | stage burst (flash+ring); pale palette (metal); pale noise wash |
| Silent Treatment | `nrSilentTreatment` | mime | metal | metal | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (metal); pale noise wash; 1 flash layer; own look: 4 white colours |
| Six-Shooter | `sigSixShooter` | cowboy | metal | metal | standard | **STRIP** | stage burst (flash+ring+speedBurst); pale palette (metal); pale noise wash |
| Slap Leather | `raceSlapLeather` |  | metal | metal | heavy | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (metal); pale noise wash |
| Space Debris | `sigSpaceDebris` | astronaut | metal | metal | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (metal); pale noise wash |
| Stick-Up | `raceHitALick` | gangster | metal | metal | light | **REPLACE** | stage burst (flash+ring); pale palette (metal); pale noise wash |
| Swipe | `raceSwipe` |  | metal | metal | heavy | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (metal); pale noise wash |
| Take Aim | `headshot` | Sniper | metal | metal | ultimate | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (metal); pale noise wash; 1 flash layer |
| Termination Protocol | `sigTerminationProtocol` | android | metal | metal | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (metal); pale noise wash; own look: 1 white colours |
| Thousand Cuts | `pzThousandCuts` | swordfighter | metal | metal | standard | **STRIP** | stage burst (flash+ring+speedBurst); pale palette (metal); pale noise wash; 1 flash layer; own look: 3 white colours |
| Through the Wall | `sigThroughTheWall` | antihero | metal | metal | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (metal); pale noise wash; 1 flash layer; own look: 2 white colours |
| War of the Worlds | `raceWarOfTheWorlds` | martian | metal | metal | ultimate | **REPLACE** | stage burst (flash+lines+ring+aftershock); pale palette (metal); pale noise wash |
| Buzz | `nrBuzz` | cicada brood | sonic | sonic | standard | **STRIP** | stage burst (flash+ring); pale palette (sonic) |
| Cataclysm Stomp | `raceCataclysmStomp` | kaiju | sonic | sonic | heavy | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (sonic); pale noise wash; 1 flash layer |
| Chorus | `nrScreech` | cicada brood | sonic | sonic | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (sonic); pale noise wash |
| Crack the Whip | `raceCrackTheWhip` |  | sonic | sonic | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (sonic); pale noise wash |

## B7b · Air and cold: ice, water, wind, metal, sonic (part 2) (74)

| Spell | id | Race / school | Element | Stage look | Weight | Rule | White layers found |
|---|---|---|---|---|---|---|---|
| Crowd Surge | `raceSpaceDisco` | barbarella | sonic | sonic | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (sonic); pale noise wash; 1 flash layer; 1 white ring |
| Deafening Wail | `raceDeafeningWail` | siren | sonic | sonic | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (sonic); pale noise wash; own look: screen flash, speed burst, 3 white colours |
| Emergency Broadcast | `nrEmergencyBroadcast` | cursed tv | sonic | sonic | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (sonic); pale noise wash |
| Excessive Machine | `sigExcessiveMachine` | barbarella | sonic | sonic | standard | **STRIP** | stage burst (flash+ring); pale palette (sonic); pale noise wash |
| Gibberish | `bbGibberish` | bligblog | - | sonic | standard | **STRIP** | stage burst (flash+ring); pale palette (sonic); own look: 1 white colours |
| Lullaby | `lullaby` | Harbinger | sonic | sonic | standard | **STRIP** | stage burst (flash+ring); pale palette (sonic); pale noise wash; own look: screen flash, speed burst, 3 white colours |
| Lure of the Deep | `pzLureOfTheDeep` | siren | sonic | sonic | standard | **STRIP** | stage burst (flash+ring); pale palette (sonic); pale noise wash; own look: 1 white colours |
| Meow | `raceMeow` | catgirl | sonic | sonic | standard | **REPLACE** | stage burst (flash+ring); pale palette (sonic); 1 flash layer; 1 white ring |
| Mic Drop | `racePopMicDrop` | popstar | sonic | sonic | standard | **STRIP** | stage burst (flash+ring); pale palette (sonic); pale noise wash; own look: 1 white colours |
| Polyphemus Bellow | `sigBellow` | cyclops | sonic | sonic | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (sonic); pale noise wash; own look: 2 white colours |
| Requiem | `requiem` | Harbinger | sonic | sonic | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (sonic); pale noise wash; 1 flash layer; own look: 3 white colours |
| Resonance Pulse | `raceResonancePulse` | nordic | sonic | sonic | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (sonic); pale noise wash; 1 flash layer; own look: screen flash, speed burst, 3 white colours |
| Screech | `raceScreech` |  | sonic | sonic | standard | **STRIP** | stage burst (flash+ring); pale palette (sonic); pale noise wash |
| Shiver Down the Spine | `pzShiverDownTheSpine` | skeleton | sonic | sonic | standard | **STRIP** | stage burst (flash+ring+speedBurst); pale palette (sonic); pale noise wash |
| Siren Song | `raceSirenSong` | mermaid | sonic | sonic | light | **STRIP** | stage burst (flash+ring); pale palette (sonic) |
| Sonic Boom | `raceSonicBoom` |  | sonic | sonic | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (sonic); pale noise wash |
| Stadium Show | `racePopStadiumShow` | popstar | sonic | sonic | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (sonic); pale noise wash; 1 flash layer; own look: screen flash, 2 white colours |
| Stage Dive | `racePopStageDive` | popstar | sonic | sonic | standard | **STRIP** | stage burst (flash+ring+speedBurst); pale palette (sonic); pale noise wash |
| The Last Trumpet | `sigLastTrumpet` | angel | sonic | sonic | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (sonic); pale noise wash; own look: 1 white colours |
| Abyss Jaws | `sigAbyssJaws` | deep sea fish | water | water | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (water); own look: 2 white colours |
| Bloom | `raceJellyBloom` | jellyfish | water | water | standard | **STRIP** | stage burst (flash+ring); pale palette (water) |
| Call of the Deep | `raceCallOfTheDeep` | siren | water | water | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (water); own look: 5 white colours |
| Dashed on the Rocks | `pzDashedOnTheRocks` | siren | water | water | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (water); own look: 3 white colours |
| Depth Charge | `raceDepthCharge` | kraken | water | water | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (water); own look: 4 white colours |
| Drag Under | `nrDeathRoll` | sewer gator | water | water | standard | **STRIP** | stage burst (flash+ring+speedBurst); pale palette (water); own look: 2 white colours |
| Eightfold Lash | `raceEightfoldLash` |  | water | water | standard | **REPLACE** | stage burst (flash+ring); pale palette (water) |
| Enlil's Deluge | `sigEnlilsDeluge` | annunaki | water | water | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (water); own look: 4 white colours |
| Fire Hose | `sigFireHose` | firefighter | water | water | standard | **STRIP** | stage burst (flash+ring); pale palette (water) |
| Five-Armed Crush | `pzFiveArmedCrush` | starfish | water | water | standard | **STRIP** | stage burst (flash+ring+speedBurst); pale palette (water) |
| Fluoride Water | `raceFluorideWater` | conspiracy theorist | water | water | heavy | **REPLACE** | stage burst (flash+lines+ring+aftershock); pale palette (water) |
| Great Flood | `raceFlood` | siren | water | water | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (water); own look: 1 white colours |
| Holy Water | `pzHolyWater` | priest | water | water | standard | **STRIP** | stage burst (flash+ring); pale palette (water); own look: 3 white colours |
| Into the Bog | `smIntoTheBog` | swamp monster | water | water | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (water); own look: 1 white colours |
| Land Ho | `raceBoardingRush` | pirate | water | water | standard | **REPLACE** | stage burst (flash+ring+speedBurst); pale palette (water) |
| Long Neck | `goLongNeck` | loch ness monster | water | water | light | **STRIP** | stage burst (flash+ring); pale palette (water) |
| Maelstrom | `raceMaelstrom` |  | water | water | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (water); own look: 5 white colours |
| Muck Grab | `smMuckGrab` | swamp monster | water | water | light | **STRIP** | stage burst (flash+ring); pale palette (water) |
| Nematocyst Net | `raceJellyNet` | jellyfish | water | water | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (water) |
| Out of the Loch | `goOutOfTheLoch` | loch ness monster | water | water | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (water) |
| Poseidon's Wrath | `racePoseidonsWrath` | atlantean | water | water | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (water); own look: 1 white colours |
| Pull Them Under | `goPullThemUnder` | mermaid | water | water | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (water) |
| Rescue Tube | `nrRescueTube` | lifeguard | water | water | light | **STRIP** | stage burst (flash+ring); pale palette (water) |
| Sailor's Lure | `goSailorsLure` | mermaid | water | water | light | **STRIP** | stage burst (flash+ring); pale palette (water) |
| Spout | `raceSpout` |  | water | water | light | **STRIP** | stage burst (flash+ring); pale palette (water) |
| Sting | `raceJellySting` | jellyfish | water | water | light | **STRIP** | stage burst (flash+ring); pale palette (water) |
| Tail Sweep | `nrTailSweep` | sewer gator | water | water | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (water); own look: 6 white colours |
| Tentacle Lash | `raceTentacleLash` | kraken | water | water | standard | **REPLACE** | stage burst (flash+ring); pale palette (water); 1 flash layer |
| Tidal Slam | `raceTidalSlam` | loch ness monster | water | water | ultimate | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (water); own look: 1 white colours |
| Tongue Lash | `nrTongueLash` | karate frog | water | water | standard | **STRIP** | stage burst (flash+ring+speedBurst); pale palette (water) |
| Tsunami | `raceTsunami` | atlantean | water | water | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (water) |
| Tube Feet | `pzTubeFeet` | starfish | water | water | light | **STRIP** | stage burst (flash+ring); pale palette (water) |
| Walk the Plank | `raceWalkThePlank` | pirate | water | water | standard | **STRIP** | stage burst (flash+ring+speedBurst); pale palette (water); own look: 1 white colours |
| Water Jet | `raceWaterJet` |  | water | water | light | **STRIP** | stage burst (flash+ring); pale palette (water) |
| Watering Can | `wateringCan` | Harvester | water | water | light | **REPLACE** | stage burst (flash+ring); pale palette (water) |
| Whirlpool | `raceRiptide` | siren | water | water | standard | **STRIP** | stage burst (flash+ring); pale palette (water); own look: 6 white colours |
| Arrow Volley | `raceArrowRain` | robinhood | wind | wind | ultimate | **STRIP** | stage burst (flash+lines+ring+crescent+speedBurst+crescent2+aftershock); pale palette (wind); pale noise wash; 1 white ring |
| Eye of the Storm | `raceEyeOfTheStorm` |  | wind | wind | ultimate | **STRIP** | stage burst (flash+lines+ring+crescent+speedBurst+crescent2+aftershock); pale palette (wind); pale noise wash; own look: 2 white colours |
| Hail Mary | `raceHailMary` | quarterback | wind | wind | ultimate | **REPLACE** | stage burst (flash+lines+ring+crescent+speedBurst+crescent2+aftershock); pale palette (wind); pale noise wash; 1 flash layer |
| Heroic Leap | `raceHeroicLeap` | superhero | wind | wind | standard | **REPLACE** | stage burst (flash+ring+crescent+speedBurst); pale palette (wind); pale noise wash; 1 flash layer; 1 white ring |
| Host-Fetter | `pzHostFetter` | valkraye | wind | wind | standard | **STRIP** | stage burst (flash+ring+crescent+speedBurst); pale palette (wind); pale noise wash |
| Hurricane Party | `nrHurricaneParty` | florida man | wind | wind | heavy | **STRIP** | stage burst (flash+lines+ring+crescent+speedBurst+crescent2+aftershock); pale palette (wind); pale noise wash; own look: 6 white colours |
| Long Bomb | `raceLongBomb` | quarterback | wind | wind | heavy | **REPLACE** | stage burst (flash+lines+ring+crescent+speedBurst+crescent2+aftershock); pale palette (wind); pale noise wash |
| Ride to Valhalla | `pzRideToValhalla` | valkraye | wind | wind | heavy | **STRIP** | stage burst (flash+lines+ring+crescent+speedBurst+crescent2+aftershock); pale palette (wind); pale noise wash; own look: 1 white colours |
| Roundhouse Kick | `raceRoundhouseKick` |  | wind | wind | standard | **REPLACE** | stage burst (flash+ring+crescent+speedBurst); pale palette (wind); pale noise wash |
| Simoom | `raceSimoom` |  | wind | wind | ultimate | **REPLACE** | stage burst (flash+lines+ring+crescent+speedBurst+crescent2+aftershock); pale palette (wind); pale noise wash |
| Sky Tackle | `raceSkyTackle` | superhero | wind | wind | heavy | **REPLACE** | stage burst (flash+lines+ring+crescent+speedBurst+crescent2+aftershock); pale palette (wind); pale noise wash; 1 flash layer; 1 white ring |
| Splitting Arrow | `raceSplittingArrow` | robinhood | wind | wind | heavy | **REPLACE** | stage burst (flash+lines+ring+crescent+speedBurst+crescent2+aftershock); pale palette (wind); pale noise wash; 1 flash layer |
| Squall | `raceSquall` |  | wind | wind | standard | **STRIP** | stage burst (flash+ring+crescent+speedBurst); pale palette (wind); pale noise wash; own look: 3 white colours |
| Stoop Dive | `nrStoopDive` | eagleman | wind | wind | heavy | **STRIP** | stage burst (flash+lines+ring+crescent+speedBurst+crescent2+aftershock); pale palette (wind); pale noise wash; own look: 3 white colours |
| Talon Rake | `nrTalonRake` | eagleman | wind | wind | standard | **STRIP** | stage burst (flash+ring+crescent+speedBurst); pale palette (wind); pale noise wash |
| Tornado | `raceTornado` |  | wind | wind | heavy | **STRIP** | stage burst (flash+lines+ring+crescent+speedBurst+crescent2+aftershock); pale palette (wind); pale noise wash; own look: 3 white colours |
| Twisted Wish | `sigTwistedWish` | djinn | wind | wind | heavy | **STRIP** | stage burst (flash+lines+ring+crescent+speedBurst+crescent2+aftershock); pale palette (wind); pale noise wash |
| Valkyrie Spear | `raceValkyrieSpear` | valkraye | wind | wind | standard | **STRIP** | stage burst (flash+ring+crescent+speedBurst); pale palette (wind); pale noise wash; 1 flash layer; own look: 1 white colours |
| Wing Attack | `raceWingGust` | angel | wind | wind | standard | **REPLACE** | stage burst (flash+ring+crescent+speedBurst); pale palette (wind); pale noise wash; 1 white ring |

## B8a · Fire, earth, nature, poison, blood (part 1) (83)

| Spell | id | Race / school | Element | Stage look | Weight | Rule | White layers found |
|---|---|---|---|---|---|---|---|
| Arterial Spray | `raceArterialSpray` |  | blood | blood | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); own look: 1 white colours |
| Bat Swarm | `raceBatSwarm` | vampire | blood | blood | heavy | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock) |
| Bite | `raceBite` | werewolf | blood | blood | standard | **STRIP** | stage burst (flash+ring+speedBurst); 1 flash layer; own look: screen flash, speed burst, 4 white colours |
| Blood Frenzy | `raceBloodFrenzy` | werewolf | blood | blood | ultimate | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); own look: screen flash, speed burst, 7 white colours |
| Blood in the Water | `pzBloodInTheWater` | sharkman | blood | blood | standard | **STRIP** | stage burst (flash+ring+speedBurst); own look: screen flash, speed burst, 5 white colours |
| Brutal Slam | `raceBrutalSlam` | juggernaut | blood | blood | heavy | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock); 1 white ring |
| Claw Sweep | `raceClawSweep` |  | blood | blood | standard | **STRIP** | stage burst (flash+ring+speedBurst); own look: screen flash, speed burst, 5 white colours |
| Curb Stomp | `raceStompOut` | gangster | blood | blood | standard | **REPLACE** | stage burst (flash+ring+speedBurst) |
| Death Roll | `raceDeathRoll` |  | blood | blood | standard | **STRIP** | stage burst (flash+ring+speedBurst); 1 flash layer; own look: screen flash, speed burst, 4 white colours |
| Devil's Due | `goDevilsDue` | halfdemon | blood | blood | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock) |
| Devour Mankind | `goDevourMankind` | nephilim | blood | blood | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock) |
| Draining Embrace | `raceDrainingEmbrace` | succubus | blood | blood | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); own look: 3 white colours |
| Eaten Alive | `nrEatenAlive` | flesheater | blood | blood | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); own look: 1 white colours |
| Exsanguinate | `raceExsanguinate` |  | blood | blood | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); own look: 1 white colours |
| Feast | `nrFeast` | wendigo | blood | blood | standard | **STRIP** | stage burst (flash+ring+speedBurst) |
| Feeding Frenzy | `pzFeedingFrenzy` | sharkman | blood | blood | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); own look: screen flash, speed burst, 5 white colours |
| Ghoul's Supper | `goGhoulsSupper` | ghoul | blood | blood | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock) |
| Giant's Hand | `goGiantsHand` | nephilim | blood | blood | standard | **STRIP** | stage burst (flash+ring+speedBurst) |
| Gnash | `nrGnash` | flesheater | blood | blood | standard | **STRIP** | stage burst (flash+ring+speedBurst); own look: 1 white colours |
| Gore Charge | `raceGoreCharge` | goatman | blood | blood | standard | **REPLACE** | stage burst (flash+ring+speedBurst); 1 flash layer |
| Grave Grip | `udGraveGrip` | undead | blood | blood | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); own look: 1 white colours |
| Hemorrhage | `raceHemorrhage` |  | blood | blood | standard | **STRIP** | stage burst (flash+ring); own look: 1 white colours |
| Interrogation | `sigInterrogation` | antihero | blood | blood | standard | **STRIP** | stage burst (flash+ring+speedBurst); 2 flash layers; own look: 1 white colours |
| Jurassic Jaw | `raceJurassicJaw` | dinosaur | blood | blood | ultimate | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); 1 flash layer; own look: screen flash, speed burst, 4 white colours |
| Last Dance | `sigLastDance` | demon princess | blood | blood | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); own look: 1 white colours |
| Life Drain | `raceSoulDrain` | necromancer | blood | blood | standard | **STRIP** | stage burst (flash+ring); 1 flash layer; own look: 2 white colours |
| Life Sap | `lifeDrain` | Harvester | blood | blood | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); own look: 3 white colours |
| Lifetap | `raceLifetap` | vampire | blood | blood | standard | **REPLACE** | stage burst (flash+ring+speedBurst); 1 flash layer |
| Love Bite | `raceLoveBite` | catgirl | blood | blood | standard | **STRIP** | stage burst (flash+ring+speedBurst); own look: screen flash, speed burst, 5 white colours |
| Maul | `raceMaul` |  | blood | blood | standard | **STRIP** | stage burst (flash+ring+speedBurst); 1 flash layer; own look: screen flash, speed burst, 4 white colours |
| Open Vein | `raceOpenVein` |  | blood | blood | standard | **STRIP** | stage burst (flash+ring+speedBurst); 1 flash layer; own look: 1 white colours |
| Rotting Claw | `udRottingClaw` | undead | blood | blood | light | **STRIP** | stage burst (flash+ring) |
| Soul Harvest | `sigSoulHarvest` | demon | blood | blood | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); own look: 4 white colours |
| Symbiotic Drain | `raceSymbioticDrain` | symbiote | blood | blood | heavy | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock); 1 flash layer |
| Tendril Snare | `nrTendrilSnare` | flesheater | blood | blood | light | **STRIP** | stage burst (flash+ring) |
| Wear Your Skin | `pzWearYourSkin` | skinwalker | blood | blood | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); own look: 1 white colours |
| Adrenaline Rush | `raceAdrenalineRush` | homosapien | blood | bloodAura | standard | **REPLACE** | pale palette (bloodAura); 1 flash layer; 1 white ring |
| Blood Ritual | `raceBloodRitual` | goatman | blood | bloodAura | light | **STRIP** | pale palette (bloodAura); own look: 2 white colours |
| Indomitable Will | `raceIndomitableWill` | homosapien | blood | bloodAura | ultimate | **LEAVE** | pale palette (bloodAura) |
| Let It Out | `goLetItOut` | halfdemon | blood | bloodAura | standard | **LEAVE** | pale palette (bloodAura) |
| Underdog Spirit | `raceUnderdogSpirit` | homosapien | blood | bloodAura | standard | **STRIP** | pale palette (bloodAura); own look: 1 white colours |
| Big Kick | `raceBigKick` | bigfoot | earth | earth | standard | **REPLACE** | stage burst (flash+ring+speedBurst); 1 flash layer |
| Bishop | `chessBishop` | chess piece | earth | earth | standard | **REPLACE** | stage burst (flash+ring+speedBurst) |
| Boulder Hurl | `raceBoulderHurl` | giant | earth | earth | standard | **REPLACE** | stage burst (flash+ring+speedBurst); 1 flash layer; 1 white ring |
| Calcify | `raceCalcify` | gargoyle | earth | earth | standard | **REPLACE** | stage burst (flash+ring+speedBurst) |
| Cave-In | `nrCaveIn` | mole man | earth | earth | heavy | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock) |
| Clay Crush | `goClayCrush` | golem | earth | earth | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock) |
| Clay Grip | `goClayGrip` | golem | earth | earth | standard | **STRIP** | stage burst (flash+ring+speedBurst) |
| Colossal Crush | `raceColossalCrush` | giant | earth | earth | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock) |
| Diamond Lance | `sigDiamondLance` | crystal guardian | earth | earth | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); 1 flash layer |
| Earthen Grasp | `raceEarthenGrasp` | giant | earth | earth | standard | **STRIP** | stage burst (flash+ring+speedBurst); own look: 2 white colours |
| Erupt | `nrErupt` | mole man | earth | earth | standard | **REPLACE** | stage burst (flash+ring+speedBurst) |
| Fee Fi Fo Fum | `raceTitanStep` | giant | earth | earth | standard | **STRIP** | stage burst (flash+ring+speedBurst); 3 flash layers; 1 white ring |
| Fissure | `sharedFissure` | gargoyle | earth | earth | standard | **REPLACE** | stage burst (flash+ring+speedBurst); 1 flash layer |
| Ground Slam | `groundSlam` | king kong | earth | earth | heavy | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock); 2 flash layers |
| King | `chessKing` | chess piece | earth | earth | standard | **REPLACE** | stage burst (flash+ring+speedBurst) |
| Knight | `chessKnight` | chess piece | earth | earth | standard | **REPLACE** | stage burst (flash+ring+speedBurst) |
| Pawn | `chessPawn` | chess piece | earth | earth | standard | **REPLACE** | stage burst (flash+ring+speedBurst) |
| Petrify | `racePetrify` | crystal guardian | earth | earth | ultimate | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock) |
| Piledriver | `goPiledriver` | luchador | earth | earth | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); own look: 4 white colours |
| Pocket Sand | `goPocketSand` | goblin | earth | earth | standard | **STRIP** | stage burst (flash+ring+speedBurst) |
| Pyramid Protocol | `raceZigguratProtocol` | annunaki | earth | earth | standard | **REPLACE** | stage burst (flash+ring+speedBurst); 1 flash layer |
| Quake | `raceQuake` | golem | earth | earth | ultimate | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); 1 white ring |
| Queen | `chessQueen` | chess piece | earth | earth | ultimate | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock) |
| Quicksand | `raceQuicksand` |  | earth | earth | standard | **REPLACE** | stage burst (flash+ring+speedBurst) |
| Rampart | `rampart` | gargoyle | earth | earth | ultimate | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock) |
| Rampart | `sharedRampart` | Tank | earth | earth | standard | **REPLACE** | stage burst (flash+ring+speedBurst); 1 flash layer |
| Rockslide | `raceRockslide` |  | earth | earth | heavy | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock) |
| Rook | `chessRook` | chess piece | earth | earth | standard | **REPLACE** | stage burst (flash+ring+speedBurst) |
| Sandstone Tomb | `raceSandstoneTomb` |  | earth | earth | heavy | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock) |
| Sasquatch Smash | `raceSasquatchSmash` | bigfoot | earth | earth | ultimate | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock) |
| Shardstorm | `sigShardstorm` | crystal guardian | earth | earth | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock) |
| Spike the Ball | `raceSpikeTheBall` | quarterback | earth | earth | standard | **REPLACE** | stage burst (flash+ring+speedBurst); 1 white ring |
| Spike Trap | `raceSpikeTrap` |  | earth | earth | standard | **REPLACE** | stage burst (flash+ring+speedBurst) |
| Stone Drop | `raceStoneDrop` | gargoyle | earth | earth | standard | **STRIP** | stage burst (flash+ring+speedBurst) |
| Stone Throw | `raceStoneThrow` | cyclops | earth | earth | standard | **REPLACE** | stage burst (flash+ring+speedBurst); 1 flash layer |
| Stonefall | `raceStonefall` | gargoyle | earth | earth | standard | **REPLACE** | stage burst (flash+ring+speedBurst); 1 flash layer |
| Tail Sweep | `sigTailSweep` | dinosaur | earth | earth | standard | **STRIP** | stage burst (flash+ring+speedBurst); own look: 1 white colours |
| Timber Stomp | `raceTimberStomp` |  | earth | earth | standard | **REPLACE** | stage burst (flash+ring+speedBurst); 1 flash layer; 1 white ring |
| Tremor Stomp | `raceTremorStomp` | bigfoot | earth | earth | standard | **REPLACE** | stage burst (flash+ring+speedBurst); 1 flash layer; 1 white ring |
| Underfoot | `goUnderfoot` | giant | earth | earth | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock) |
| Walls of Camelot | `raceShieldWall` | knight | earth | earth | standard | **STRIP** | stage burst (flash+ring+speedBurst); 1 flash layer; own look: 4 white colours |
| Baphomet's Rite | `raceBaphometsRite` | goatman | fire | fire | ultimate | **REPLACE** | stage burst (flash+lines+ring+aftershock) |

## B8b · Fire, earth, nature, poison, blood (part 2) (82)

| Spell | id | Race / school | Element | Stage look | Weight | Rule | White layers found |
|---|---|---|---|---|---|---|---|
| Bomb Arrow | `raceBombArrow` | robinhood | fire | fire | standard | **REPLACE** | stage burst (flash+ring+speedBurst); 1 flash layer; 1 white ring |
| Burnout | `goBurnout` | orb of light | fire | fire | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); own look: screen flash, 4 white colours |
| Cannonball | `raceCannonball` | pirate | fire | fire | ultimate | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock) |
| Chain Reaction | `raceChainReaction` |  | fire | fire | ultimate | **REPLACE** | stage burst (flash+lines+ring+aftershock) |
| Cluster Rockets | `raceClusterRockets` | cyborg | fire | fire | standard | **REPLACE** | stage burst (flash+ring); 1 flash layer; 1 white ring |
| Combust | `raceCombust` |  | fire | fire | standard | **STRIP** | stage burst (flash+ring); own look: 1 white colours |
| Decapitation Strike | `goDecapitationStrike` | general | fire | fire | ultimate | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock) |
| Devil's Coal | `goDevilsCoal` | jack o lantern | fire | fire | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock) |
| Dynamite | `raceDynamite` | cowboy | fire | fire | standard | **REPLACE** | stage burst (flash+ring+speedBurst); 4 flash layers; 1 white ring |
| Extinction Event | `sigExtinctionEvent` | dinosaur | fire | fire | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); own look: 1 white colours |
| Fire Arrow | `raceFireArrow` | robinhood | fire | fire | light | **REPLACE** | stage burst (flash+ring) |
| Fire for Effect | `raceFireForEffect` | marksman | fire | fire | ultimate | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock) |
| Fireball | `fire1` | Black Mage | fire | fire | standard | **STRIP** | stage burst (flash+ring); 1 flash layer; 1 white ring |
| Flambé | `nrFlambe` | chef | fire | fire | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); own look: 3 white colours |
| Holy, Holy, Holy | `pzThriceHoly` | seraphim | fire | fire | standard | **STRIP** | stage burst (flash+ring); own look: 3 white colours |
| Hot Pan | `nrHotPan` | chef | fire | fire | standard | **STRIP** | stage burst (flash+ring+speedBurst) |
| Inferno | `raceInferno` |  | fire | fire | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); own look: 1 white colours |
| Live Coal | `pzLiveCoal` | seraphim | fire | fire | light | **STRIP** | stage burst (flash+ring); own look: 3 white colours |
| Lump of Coal | `raceLumpOfCoal` | santa clause | fire | fire | standard | **REPLACE** | stage burst (flash+ring); 1 flash layer |
| Morning Star | `sigMorningStar` | fallen angel | fire | fire | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); own look: 5 white colours |
| Nuclear Option | `sharedNuke` | mech | fire | fire | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); 2 flash layers; 1 white ring |
| Nuclear Pulse | `goNuclearPulse` | kaiju | fire | fire | standard | **STRIP** | stage burst (flash+ring); own look: screen flash |
| Ruby Spark | `sigRubySpark` | crystal guardian | fire | fire | light | **STRIP** | stage burst (flash+ring) |
| Shuttle Launch | `sigShuttleLaunch` | astronaut | fire | fire | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); own look: 3 white colours |
| Solar Flare | `pzSolarFlare` | superhero | fire | fire | standard | **STRIP** | stage burst (flash+ring); own look: screen flash |
| Throne of Ashes | `sigThroneOfAshes` | demon prince | fire | fire | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock) |
| Trick or Treat | `goTrickOrTreat` | jack o lantern | - | fire | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock) |
| Usurp | `sigUsurp` | demon prince | fire | fire | standard | **STRIP** | stage burst (flash+ring) |
| Ape Fury | `racePrimalSmash` | king kong | nature | nature | ultimate | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); 1 flash layer |
| Birch Switch | `goBirchSwitch` | krampus | nature | nature | light | **STRIP** | stage burst (flash+ring) |
| Bumper Crop | `raceBumperCrop` |  | nature | nature | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); own look: 1 white colours |
| Crop Circle | `raceCropCircle` | grey | nature | nature | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); 1 flash layer; own look: 2 white colours |
| Entangling Roots | `raceEntanglingRoots` | bigfoot | nature | nature | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); own look: 2 white colours |
| Fae Ring | `raceFaeRing` | fairy | nature | nature | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); 1 flash layer; own look: screen flash, 3 white colours |
| From the Treeline | `sigFromTheTreeline` | bigfoot | nature | nature | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock) |
| Make Love Not War | `goMakeLoveNotWar` | hippie | - | nature | standard | **STRIP** | stage burst (flash+ring) |
| Overgrowth | `raceOvergrowth` |  | nature | nature | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); own look: 1 white colours |
| Overrun | `sigOverrun` | antperson | nature | nature | standard | **STRIP** | stage burst (flash+ring+speedBurst) |
| Pollinate | `pollinate` |  | nature | nature | light | **REPLACE** | stage burst (flash+ring) |
| Pounce | `racePounce` | werewolf | nature | nature | standard | **STRIP** | stage burst (flash+ring+speedBurst); 1 flash layer; own look: screen flash, speed burst, 4 white colours |
| Raptorial Strike | `goRaptorialStrike` | mantid | nature | nature | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock) |
| Red Weed | `goRedWeed` | martian | nature | nature | standard | **STRIP** | stage burst (flash+ring) |
| Ruler Smack | `goRulerSmack` | priest | nature | nature | light | **STRIP** | stage burst (flash+ring); own look: 4 white colours |
| Sacrifice | `raceSacrifice` | shaman | nature | nature | standard | **REPLACE** | stage burst (flash+ring); 1 flash layer |
| Tail Whip | `raceDinoTailWhip` | dinosaur | nature | nature | standard | **REPLACE** | stage burst (flash+ring+speedBurst); 2 flash layers |
| Thornlash | `raceThornlash` |  | nature | nature | standard | **STRIP** | stage burst (flash+ring+speedBurst); own look: 2 white colours |
| Trunk Throw | `trunkThrow` | bigfoot | nature | nature | standard | **REPLACE** | stage burst (flash+ring+speedBurst) |
| Up the Apple Tree | `goUpTheAppleTree` | jack o lantern | nature | nature | light | **STRIP** | stage burst (flash+ring) |
| Web Snare | `raceWebSnare` | voidweaver | nature | nature | standard | **REPLACE** | stage burst (flash+ring); 3 flash layers; 1 white ring |
| Wrath of the Wild | `raceWrathOfTheWild` |  | nature | nature | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); own look: 3 white colours |
| A Thousand Stings | `sigThousandStings` | bee queen | poison | poison | standard | **STRIP** | stage burst (flash+ring+speedBurst); own look: 1 white colours |
| Acid Flask | `raceAcidFlask` |  | poison | poison | standard | **STRIP** | stage burst (flash+ring); own look: 3 white colours |
| Black Smoke | `goBlackSmoke` | martian | poison | poison | standard | **STRIP** | stage burst (flash+ring) |
| Cadaver Claws | `goCadaverClaws` | ghoul | poison | poison | standard | **STRIP** | stage burst (flash+ring+speedBurst) |
| Cannibalize | `raceCannibalize` | zombie | poison | poison | standard | **REPLACE** | stage burst (flash+ring); 1 flash layer; 1 white ring |
| Chemical Concoction | `raceOvercharge` | mad scientist | poison | poison | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); own look: 3 white colours |
| Corrosive Splash | `raceCorrosiveSplash` | black goo | poison | poison | standard | **STRIP** | stage burst (flash+ring); own look: 2 white colours |
| Engulf | `sigEngulf` | black goo | poison | poison | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock) |
| Ghoulish Bite | `raceGhoulishBite` | ghoul | poison | poison | standard | **STRIP** | stage burst (flash+ring+speedBurst); 1 flash layer; own look: screen flash, speed burst, 4 white colours |
| Goo Shot | `raceGooShot` | black goo | poison | poison | standard | **REPLACE** | stage burst (flash+ring) |
| Infectious Bite | `raceInfectiousBite` | zombie | poison | poison | standard | **STRIP** | stage burst (flash+ring+speedBurst); own look: screen flash, speed burst, 4 white colours |
| Kiss of Decay | `raceKissOfDecay` | demon princess | poison | poison | heavy | **REPLACE** | stage burst (flash+lines+ring+aftershock); 1 flash layer |
| Leech Seed | `leechSeed` | Harvester | nature | poison | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); own look: 3 white colours |
| Miasma | `raceMiasma` |  | poison | poison | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); own look: 2 white colours |
| Pepper Spray | `racePoliceSpray` | police officer | poison | poison | standard | **STRIP** | stage burst (flash+ring) |
| Plandemic | `racePlandemic` | mad scientist | poison | poison | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); 1 white ring |
| Poison Dart | `poisonDart` | Agent | poison | poison | standard | **REPLACE** | stage burst (flash+ring+speedBurst) |
| Poison Seed | `poisonSeed` | Harvester | poison | poison | standard | **REPLACE** | stage burst (flash+ring) |
| Rot | `raceRot` | bee queen | poison | poison | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); own look: 4 white colours |
| Slime Slash | `nrSlimeSlash` | samurai slug | poison | poison | standard | **STRIP** | stage burst (flash+ring+speedBurst) |
| Splash | `raceSplash` | black goo | poison | poison | standard | **REPLACE** | stage burst (flash+ring); 2 white rings |
| Spore Cloud | `goSporeCloud` | mushroom girl | poison | poison | standard | **STRIP** | stage burst (flash+ring) |
| Swamp Gas | `smSwampGas` | swamp monster | poison | poison | standard | **STRIP** | stage burst (flash+ring) |
| Tendril Strike | `raceTendrilStrike` | symbiote | poison | poison | ultimate | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); 1 flash layer |
| Tendril Whip | `raceTendrilWhip` |  | poison | poison | standard | **STRIP** | stage burst (flash+ring+speedBurst); own look: 2 white colours |
| The Swarm | `sigTheSwarm` | bee queen | poison | poison | standard | **STRIP** | stage burst (flash+ring+speedBurst) |
| Toxic Nova | `raceToxicNova` | black goo | poison | poison | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); 2 white rings; own look: 2 white colours |
| Unmasked | `pzUnmasked` | reptilian | poison | poison | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); own look: screen flash, speed burst, 7 white colours |
| Venom Burst | `raceVenomBurst` |  | poison | poison | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); own look: 3 white colours |
| Venom Fang | `raceVenomFang` | voidweaver | poison | poison | standard | **STRIP** | stage burst (flash+ring+speedBurst); 1 flash layer; own look: screen flash, speed burst, 5 white colours |
| Venom Spit | `raceVenomSpit` |  | poison | poison | standard | **STRIP** | stage burst (flash+ring); own look: 2 white colours |
| Vivisection | `raceVivisection` |  | poison | poison | standard | **REPLACE** | stage burst (flash+ring) |

## B9a · Mind and dark: arcane, psychic, hex, unholy, anomaly (part 1) (109)

| Spell | id | Race / school | Element | Stage look | Weight | Rule | White layers found |
|---|---|---|---|---|---|---|---|
| Borrowed Claw | `raceBorrowedClaw` | skinwalker | - | anomaly | standard | **STRIP** | stage burst (flash+ring+speedBurst); pale palette (anomaly); 1 flash layer; own look: screen flash, speed burst, 5 white colours |
| Chest Pound | `raceChestPound` | king kong | - | anomaly | standard | **REPLACE** | stage burst (flash+ring); pale palette (anomaly); 1 white ring |
| Cocktail Hour | `bnCocktailHour` | bunny girl | - | anomaly | standard | **STRIP** | stage burst (flash+ring); pale palette (anomaly); own look: 4 white colours |
| Death Gaze | `raceDeathGaze` | occulus | - | anomaly | ultimate | **REPLACE** | stage burst (flash+lines+ring+orb+aftershock); pale palette (anomaly); 1 flash layer |
| Eyewitness | `raceEyewitness` |  | - | anomaly | standard | **REPLACE** | stage burst (flash+ring); pale palette (anomaly) |
| Flying Kick | `nrFlyingKick` | karate frog | - | anomaly | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (anomaly) |
| Harbinger | `raceHarbinger` |  | - | anomaly | standard | **STRIP** | stage burst (flash+ring); pale palette (anomaly) |
| Iai Draw | `nrIaiDraw` | samurai slug | - | anomaly | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (anomaly); 1 flash layer; own look: 4 white colours |
| Leapfrog | `nrLeapfrog` | karate frog | - | anomaly | standard | **STRIP** | stage burst (flash+ring+speedBurst); pale palette (anomaly) |
| Prophecy of Disaster | `raceProphecyOfDisaster` | mothman | - | anomaly | ultimate | **STRIP** | stage burst (flash+lines+ring+orb+aftershock); pale palette (anomaly); 1 flash layer; 1 white ring; own look: 2 white colours |
| Reality Pulse | `raceRealityPulse` | watcher | - | anomaly | ultimate | **STRIP** | stage burst (flash+lines+ring+orb+aftershock); pale palette (anomaly); 1 flash layer; 1 white ring |
| Ronin's Wake | `nrRoninsWake` | samurai slug | - | anomaly | ultimate | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (anomaly); own look: 3 white colours |
| Sucker Punch | `raceSuckerPunch` |  | - | anomaly | standard | **REPLACE** | stage burst (flash+ring+speedBurst); pale palette (anomaly) |
| Annihilation | `raceAnnihilation` |  | - | arcane | heavy | **REPLACE** | stage burst (flash+lines+ring+orb+aftershock) |
| Arcane Sigil | `raceArcaneBlast` | wizard | - | arcane | light | **STRIP** | stage burst (flash+ring); own look: 3 white colours |
| Cocoon | `raceCocoon` |  | - | arcane | heavy | **STRIP** | stage burst (flash+lines+ring+orb+aftershock); own look: 2 white colours |
| Crystal Ball | `raceCrystalBall` | fortune teller | - | arcane | ultimate | **STRIP** | stage burst (flash+lines+ring+orb+aftershock); 1 flash layer; 1 white ring; own look: 2 white colours |
| Dead Man's Hand | `raceDeadMansHand` | bunny girl | - | arcane | light | **STRIP** | stage burst (flash+ring); own look: 3 white colours |
| Hall of Mirrors | `raceHallOfMirrors` |  | - | arcane | standard | **STRIP** | stage burst (flash+ring); own look: 1 white colours |
| Hocus Pocus | `raceHocusPocus` | wizard | - | arcane | heavy | **REPLACE** | stage burst (flash+lines+ring+orb+aftershock); 2 flash layers |
| Jackpot | `raceJackpot` |  | - | arcane | ultimate | **REPLACE** | stage burst (flash+lines+ring+orb+aftershock) |
| Kneel | `sigKneel` | annunaki | - | arcane | standard | **STRIP** | stage burst (flash+ring); own look: 1 white colours |
| Mirror Shard | `raceMirrorShard` |  | - | arcane | light | **REPLACE** | stage burst (flash+ring) |
| Prism Mirror | `racePrismMirror` | machine elves | - | arcane | light | **REPLACE** | stage burst (flash+ring); 1 flash layer |
| Seven Years | `raceSevenYears` |  | - | arcane | standard | **REPLACE** | stage burst (flash+ring) |
| Shattered Mirror | `raceShatteredMirror` |  | - | arcane | ultimate | **REPLACE** | stage burst (flash+lines+ring+orb+aftershock) |
| Strange Loop | `raceStrangeLoop` |  | - | arcane | standard | **STRIP** | stage burst (flash+ring); own look: 1 white colours |
| Web Shoot | `raceWebLaunch` | symbiote | - | arcane | standard | **STRIP** | stage burst (flash+ring); 1 flash layer; own look: 1 white colours |
| Anchor | `raceAnchor` | pirate | metal | hex | light | **REPLACE** | pale palette (hex); 1 flash layer; 1 white ring |
| Blue Screen | `raceBlueScreen` | glitch | - | hex | heavy | **LEAVE** | pale palette (hex) |
| Call Out | `provoke` | Tank | sonic | hex | standard | **STRIP** | pale palette (hex); own look: screen flash, speed burst, 3 white colours |
| Campaign Promise | `raceCampaignPromise` |  | - | hex | standard | **LEAVE** | pale palette (hex) |
| Card | `nrCard` | referee | - | hex | light | **LEAVE** | pale palette (hex) |
| Charm | `raceCharm` | succubus | - | hex | standard | **LEAVE** | pale palette (hex) |
| Cold Spot | `raceColdSpot` | ghost | ice | hex | standard | **STRIP** | pale palette (hex); 1 flash layer; 1 white ring; own look: 3 white colours |
| Constrict | `raceConstrict` |  | water | hex | standard | **LEAVE** | pale palette (hex) |
| Contract | `raceContract` | demon | - | hex | light | **LEAVE** | pale palette (hex) |
| Designate Target | `goDesignateTarget` | general | - | hex | light | **LEAVE** | pale palette (hex) |
| Discordance | `discordance` | Harbinger | sonic | hex | light | **STRIP** | pale palette (hex); own look: screen flash, speed burst, 3 white colours |
| Eagle Eye | `nrEagleEye` | eagleman | - | hex | standard | **STRIP** | pale palette (hex); own look: 1 white colours |
| Exhaust Cloud | `raceExhaustCloud` | honda civic | - | hex | standard | **LEAVE** | pale palette (hex) |
| Filibuster | `raceFilibuster` | politician | - | hex | light | **LEAVE** | pale palette (hex) |
| Flower in the Barrel | `goFlowerInTheBarrel` | hippie | - | hex | light | **LEAVE** | pale palette (hex) |
| Forsaken | `sigForsaken` | fallen angel | - | hex | standard | **STRIP** | pale palette (hex); own look: 1 white colours |
| Freeze! Police! | `pzFreezePolice` | police officer | - | hex | standard | **STRIP** | pale palette (hex); own look: 2 white colours |
| Go Viral | `nrGoViral` | influencer | - | hex | standard | **LEAVE** | pale palette (hex) |
| Gravity Crush | `sharedGravityCrush` | annunaki | - | hex | standard | **LEAVE** | pale palette (hex) |
| Haunt | `raceHaunt` | ghost | - | hex | light | **LEAVE** | pale palette (hex) |
| Hex of Agony | `sharedHexOfToil` | scarecrow | - | hex | standard | **STRIP** | pale palette (hex); own look: 3 white colours |
| Hogtie | `raceHogtie` |  | - | hex | standard | **LEAVE** | pale palette (hex) |
| Implant | `raceImplant` | grey | metal | hex | standard | **REPLACE** | pale palette (hex); 1 flash layer |
| Ink Cloud | `raceInkCloud` | kraken | - | hex | standard | **STRIP** | pale palette (hex); own look: 2 white colours |
| Iron Grip | `ironGrip` | Raider | - | hex | standard | **REPLACE** | pale palette (hex); 1 flash layer |
| Lamp Smoke | `sigLampSmoke` | djinn | wind | hex | standard | **LEAVE** | pale palette (hex) |
| Low Gravity | `sharedLowGravity` | martian | - | hex | standard | **LEAVE** | pale palette (hex) |
| Mark of the Beast | `sigMarkOfTheBeast` | demon | - | hex | standard | **STRIP** | pale palette (hex); own look: 1 white colours |
| Mean Mug | `raceMeanMug` |  | - | hex | light | **LEAVE** | pale palette (hex) |
| Memory Leak | `raceMemoryLeak` | glitch | - | hex | standard | **LEAVE** | pale palette (hex) |
| Mirror Splinter | `goMirrorSplinter` | ice queen | ice | hex | standard | **LEAVE** | pale palette (hex) |
| Misdirection | `raceMisdirection` |  | - | hex | light | **LEAVE** | pale palette (hex) |
| Mummify | `sigMummify` | anubis | - | hex | standard | **STRIP** | pale palette (hex); own look: 1 white colours |
| Naughty List | `raceNaughtyList` | santa clause | - | hex | standard | **STRIP** | pale palette (hex); 1 flash layer; 1 white ring; own look: 1 white colours |
| Outbreak | `raceOutbreak` | zombie | poison | hex | heavy | **LEAVE** | pale palette (hex) |
| Pick a Card | `nrPickACard` | magician | - | hex | standard | **STRIP** | pale palette (hex); own look: 1 white colours |
| Pixie Prank | `sigPixiePrank` | fairy | - | hex | light | **STRIP** | pale palette (hex); own look: 1 white colours |
| Polymorph | `racePolymorph` | wizard | - | hex | standard | **LEAVE** | pale palette (hex) |
| Predictive Model | `racePredictiveModel` | ai | - | hex | light | **LEAVE** | pale palette (hex) |
| Red Eyes | `raceRedEyes` | mothman | - | hex | light | **REPLACE** | pale palette (hex); 1 flash layer |
| Selfie Flash | `nrSelfieFlash` | influencer | light | hex | light | **STRIP** | pale palette (hex); 1 flash layer; own look: 6 white colours |
| Short Sell | `nrShortSell` | banker | - | hex | standard | **LEAVE** | pale palette (hex) |
| Showdown | `sigShowdown` | cowboy | - | hex | standard | **LEAVE** | pale palette (hex) |
| Smoke Screen | `sharedSmokeScreen` | shadow entity | wind | hex | standard | **REPLACE** | pale palette (hex); 1 flash layer; 1 white ring |
| Spellsteal | `raceSpellsteal` | wizard | - | hex | standard | **REPLACE** | pale palette (hex); 1 flash layer |
| Spiked Martini | `spySpikedMartini` | spy | - | hex | standard | **STRIP** | pale palette (hex); own look: 2 white colours |
| Spotlight | `racePopSpotlight` | popstar | - | hex | standard | **STRIP** | pale palette (hex); own look: 1 white colours |
| Stacked Deck | `raceStackedDeck` |  | - | hex | standard | **LEAVE** | pale palette (hex) |
| Star Crossed | `raceStarCrossed` | fortune teller | - | hex | standard | **STRIP** | pale palette (hex); own look: screen flash, 2 white colours |
| Stasis Beam | `raceStasisBeam` | nordic | - | hex | standard | **STRIP** | pale palette (hex); 1 flash layer |
| Steal from the Rich | `raceStealFromRich` | robinhood | - | hex | standard | **REPLACE** | pale palette (hex); 1 flash layer |
| Stutter | `raceStutter` |  | - | hex | standard | **LEAVE** | pale palette (hex) |
| Surveillance | `raceSurveillance` |  | - | hex | light | **LEAVE** | pale palette (hex) |
| System Analysis | `raceSystemAnalysis` | droid | - | hex | standard | **LEAVE** | pale palette (hex) |
| The Hat Man | `pzHatMan` | shadow entity | - | hex | standard | **LEAVE** | pale palette (hex) |
| The Kool-Aid | `raceCultKoolAid` | cult leader | - | hex | standard | **LEAVE** | pale palette (hex) |
| Throw Down the Gauntlet | `goThrowDownTheGauntlet` | knight | - | hex | light | **LEAVE** | pale palette (hex) |
| Vow of Silence | `goVowOfSilence` | priest | - | hex | standard | **LEAVE** | pale palette (hex) |
| Wanted Poster | `pzWantedPoster` | sheriff | - | hex | light | **STRIP** | pale palette (hex); own look: 1 white colours |
| White Christmas | `raceWhiteChristmas` | santa clause | ice | hex | standard | **LEAVE** | pale palette (hex) |
| Wither Starlight | `sigWitherStarlight` | cosmic wraith | - | hex | standard | **LEAVE** | pale palette (hex) |
| Cosmic Sight | `raceCosmicSight` | watcher | - | mind | standard | **STRIP** | stage burst (flash+ring); pale palette (mind); 2 white rings |
| Hypnotic Pulse | `raceHypnoticPulse` | occulus | - | mind | standard | **REPLACE** | stage burst (flash+ring); pale palette (mind) |
| Omni-Vision | `raceOmniVision` | occulus | - | mind | standard | **STRIP** | stage burst (flash+ring); pale palette (mind); 1 white ring |
| Pulse Lattice | `racePulseLattice` | machine elves | - | mind | standard | **REPLACE** | stage burst (flash+ring); pale palette (mind) |
| Rangefinder | `raceRangefinder` | marksman | metal | mind | standard | **REPLACE** | stage burst (flash+ring); pale palette (mind) |
| Shatter the Lattice | `raceShatterLattice` |  | - | mind | standard | **STRIP** | stage burst (flash+ring); pale palette (mind) |
| Trick Room | `raceTrickRoom` | fairy | - | mind | standard | **STRIP** | stage burst (flash+ring); pale palette (mind) |
| Tune Frequency | `raceTuneFrequency` | machine elves | - | mind | standard | **REPLACE** | stage burst (flash+ring); pale palette (mind) |
| Air Mail | `raceAirMail` | door agent | psychic | psychic | standard | **STRIP** | stage burst (flash+ring+speedBurst); pale palette (psychic); own look: 1 white colours |
| Amethyst Lull | `sigAmethystLull` | crystal guardian | psychic | psychic | light | **STRIP** | stage burst (flash+ring); pale palette (psychic); own look: 1 white colours |
| Aneurysm | `pzAneurysm` | telepath | psychic | psychic | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (psychic); own look: 3 white colours |
| Ascension Day | `sigAscensionDay` | cult leader | psychic | psychic | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (psychic); own look: 2 white colours |
| Bad Trip | `raceBadTrip` | shaman | psychic | psychic | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (psychic); own look: screen flash, 9 white colours |
| Boo | `raceBoo` | ghost | psychic | psychic | ultimate | **REPLACE** | stage burst (flash+lines+ring+aftershock); pale palette (psychic) |
| Call the Ancestors | `pzCallTheAncestors` | shaman | psychic | psychic | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (psychic); own look: screen flash |
| Counting Sheep | `sigCountingSheep` | dreameater | psychic | psychic | standard | **STRIP** | stage burst (flash+ring); pale palette (psychic) |
| Crushing Will | `goCrushingWill` | overlord | psychic | psychic | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (psychic) |
| Cut the Cord | `raceCutTheCord` | dreameater | psychic | psychic | standard | **REPLACE** | stage burst (flash+ring); pale palette (psychic) |
| Devour the Dream | `sigDevourTheDream` | dreameater | psychic | psychic | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (psychic); own look: 1 white colours |
| Dosed | `raceDosed` |  | psychic | psychic | standard | **REPLACE** | stage burst (flash+ring); pale palette (psychic) |

## B9b · Mind and dark: arcane, psychic, hex, unholy, anomaly (part 2) (108)

| Spell | id | Race / school | Element | Stage look | Weight | Rule | White layers found |
|---|---|---|---|---|---|---|---|
| Dream Siphon | `raceDreamSiphon` | dreameater | psychic | psychic | standard | **REPLACE** | stage burst (flash+ring); pale palette (psychic) |
| Ego Death | `sharedEgoDeath` | shaman | psychic | psychic | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (psychic); own look: screen flash, 6 white colours |
| Eternal Slumber | `raceEternalSlumber` | dreameater | psychic | psychic | ultimate | **REPLACE** | stage burst (flash+lines+ring+aftershock); pale palette (psychic) |
| Every Eye at Once | `goEyeStalks` | occulus | psychic | psychic | standard | **STRIP** | stage burst (flash+ring); pale palette (psychic) |
| Existential Dread | `nrExistentialDread` | boltzmann brain | psychic | psychic | standard | **STRIP** | stage burst (flash+ring); pale palette (psychic); own look: 3 white colours |
| Familiar Voice | `pzFamiliarVoice` | skinwalker | psychic | psychic | light | **STRIP** | stage burst (flash+ring); pale palette (psychic) |
| Far Sight | `raceFarSight` |  | psychic | psychic | standard | **REPLACE** | stage burst (flash+ring); pale palette (psychic) |
| Final Exam | `pzFinalExam` | professor | psychic | psychic | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (psychic); own look: 5 white colours |
| Jewelled Toys | `goJewelledToys` | machine elves | psychic | psychic | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (psychic); own look: 2 white colours |
| Kinetic Hurl | `kineticHurl` | Psychic | psychic | psychic | standard | **STRIP** | stage burst (flash+ring); pale palette (psychic); own look: 3 white colours |
| Late Fee | `nrLateFee` | librarian | psychic | psychic | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (psychic); own look: 3 white colours |
| Look Behind You | `nrLookBehindYou` | haunted doll | psychic | psychic | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (psychic); own look: 2 white colours |
| Mental Static | `pzMentalStatic` | telepath | psychic | psychic | standard | **STRIP** | stage burst (flash+ring); pale palette (psychic); own look: 3 white colours |
| Migraine | `raceMindCrush` | telepath | psychic | psychic | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (psychic); own look: 3 white colours |
| Mind Blank | `raceMindBlank` |  | psychic | psychic | standard | **STRIP** | stage burst (flash+ring); pale palette (psychic); own look: 5 white colours |
| Mind Shatter | `mindShatter` | Psychic | psychic | psychic | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (psychic); own look: screen flash, speed burst, 6 white colours |
| Nightmare Pulse | `raceNightmarePulse` | dreameater | psychic | psychic | heavy | **REPLACE** | stage burst (flash+lines+ring+aftershock); pale palette (psychic) |
| Overfit | `sigOverfit` | ai | psychic | psychic | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (psychic) |
| Paradox | `raceTimeRewind` | glitch | psychic | psychic | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (psychic); own look: screen flash, 2 white colours |
| Pin Prick | `nrPinPrick` | haunted doll | psychic | psychic | light | **STRIP** | stage burst (flash+ring); pale palette (psychic); 1 flash layer; own look: 2 white colours |
| Probe | `raceProbe` | grey | psychic | psychic | standard | **REPLACE** | stage burst (flash+ring); pale palette (psychic) |
| Psychosis | `psychosis` | Psychic | psychic | psychic | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (psychic); own look: screen flash, 5 white colours |
| Rewind | `nrRewind` | cursed tv | psychic | psychic | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (psychic) |
| Telekinetic Slam | `raceTelekineticSlam` |  | psychic | psychic | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (psychic) |
| The Oath Broken | `pzTheOathBroken` | watcher | psychic | psychic | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (psychic); own look: screen flash, 5 white colours |
| The Sermon | `sigSermon` | cult leader | psychic | psychic | standard | **STRIP** | stage burst (flash+ring); pale palette (psychic); 1 flash layer |
| The Whole House Shakes | `goWholeHouseShakes` | ghost | psychic | psychic | standard | **STRIP** | stage burst (flash+ring); pale palette (psychic) |
| Things That Go Bump | `goThingsThatGoBump` | ghost | psychic | psychic | light | **STRIP** | stage burst (flash+ring); pale palette (psychic) |
| Thought Spike | `nrThoughtSpike` | boltzmann brain | psychic | psychic | standard | **STRIP** | stage burst (flash+ring); pale palette (psychic); own look: 1 white colours |
| Tissue Sample | `goTissueSample` | grey | psychic | psychic | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (psychic) |
| Uncanny Smile | `sigUncannySmile` | android | psychic | psychic | light | **STRIP** | stage burst (flash+ring); pale palette (psychic); 1 white ring; own look: 2 white colours |
| Vacuum Collapse | `nrVacuumCollapse` | boltzmann brain | psychic | psychic | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); pale palette (psychic); own look: 3 white colours |
| Visible Language | `goVisibleLanguage` | machine elves | psychic | psychic | light | **STRIP** | stage burst (flash+ring); pale palette (psychic) |
| Contact High | `raceContactHigh` |  | psychic | psychicAid | standard | **LEAVE** | pale palette (psychicAid) |
| Fast Forward | `nrFastForward` | cursed tv | psychic | psychicAid | standard | **LEAVE** | pale palette (psychicAid) |
| Nordic Accord | `raceNordicAccord` | nordic | psychic | psychicAid | ultimate | **STRIP** | pale palette (psychicAid); own look: 2 white colours |
| Observer Effect | `nrObserverEffect` | boltzmann brain | psychic | psychicAid | light | **STRIP** | pale palette (psychicAid); own look: 2 white colours |
| Psychic Barrier | `racePsychicBarrier` | telepath | psychic | psychicAid | standard | **STRIP** | pale palette (psychicAid); own look: 3 white colours |
| Pull My String | `nrPullString` | haunted doll | psychic | psychicAid | standard | **STRIP** | pale palette (psychicAid); own look: 2 white colours |
| Sad Backstory | `raceSadBackstory` | swordfighter | psychic | psychicAid | light | **STRIP** | pale palette (psychicAid); own look: 1 white colours |
| Spirit Guide | `raceSpiritGuide` |  | psychic | psychicAid | standard | **LEAVE** | pale palette (psychicAid) |
| Telepathic Link | `raceTelepathicLink` | telepath | psychic | psychicAid | light | **LEAVE** | pale palette (psychicAid) |
| Debunked | `pzDebunked` | professor | psychic | psychicHex | standard | **STRIP** | pale palette (psychicHex); own look: 2 white colours |
| Deneuralizer | `raceDeneuralizer` | men in black | psychic | psychicHex | light | **STRIP** | pale palette (psychicHex); 1 flash layer; own look: 7 white colours |
| Doomscroll | `raceDoomscroll` |  | psychic | psychicHex | light | **LEAVE** | pale palette (psychicHex) |
| Invisible Box | `nrInvisibleBox` | mime | - | psychicHex | light | **STRIP** | pale palette (psychicHex); own look: 4 white colours |
| Missing Time | `goMissingTime` | grey | psychic | psychicHex | standard | **LEAVE** | pale palette (psychicHex) |
| Ratio'd | `raceRatiod` |  | psychic | psychicHex | heavy | **LEAVE** | pale palette (psychicHex) |
| Scrape | `sigScrape` | ai | psychic | psychicHex | standard | **STRIP** | pale palette (psychicHex); own look: 1 white colours |
| Shhh! | `nrShhh` | mime | - | psychicHex | standard | **STRIP** | pale palette (psychicHex); own look: 3 white colours |
| Shush | `nrShush` | librarian | psychic | psychicHex | light | **STRIP** | pale palette (psychicHex); own look: 2 white colours |
| Absorb | `raceAbsorb` | black goo | - | unholy | standard | **REPLACE** | stage burst (flash+ring); 1 flash layer |
| Ammit Devours | `sigAmmit` | anubis | - | unholy | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); own look: screen flash, speed burst, 8 white colours |
| Bone Barrage | `raceBoneBarrage` | skeleton | - | unholy | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); 1 white ring |
| Bone Toss | `raceBoneToss` | skeleton | - | unholy | light | **STRIP** | stage burst (flash+ring); 1 flash layer; own look: 3 white colours |
| Broken Halo | `raceBrokenHalo` |  | - | unholy | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock) |
| Car Toss | `raceCarToss` | kaiju | - | unholy | standard | **REPLACE** | stage burst (flash+ring+speedBurst) |
| Carrion Feast | `raceCarrionFeast` | ghoul | - | unholy | standard | **REPLACE** | stage burst (flash+ring); 1 flash layer; 1 white ring |
| Cataclysm Decree | `raceCataclysmDecree` | overlord | - | unholy | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); 1 flash layer; 1 white ring; own look: screen flash, 4 white colours |
| Clone Jutsu | `nrCloneJutsu` | ninja | - | unholy | ultimate | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock) |
| Consuming Dark | `raceConsumingDark` |  | - | unholy | heavy | **REPLACE** | stage burst (flash+lines+ring+aftershock) |
| Corner of Your Eye | `pzCornerOfYourEye` | shadow entity | - | unholy | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); own look: screen flash, speed burst, 6 white colours |
| Crow Storm | `raceCrowStorm` | scarecrow | - | unholy | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock) |
| Curse of the Tomb | `mmTombCurse` | mummy | - | unholy | standard | **STRIP** | stage burst (flash+ring); own look: 6 white colours |
| Danse Macabre | `pzDanseMacabre` | skeleton | - | unholy | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); own look: screen flash, 1 white colours |
| Dark Dominion | `raceDarkDominion` | demon prince | - | unholy | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); 1 flash layer; 1 white ring |
| Dark Lullaby | `raceDarkLullaby` | demon princess | - | unholy | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); own look: 1 white colours |
| Death Rattle | `udDeathRattle` | undead | - | unholy | standard | **STRIP** | stage burst (flash+ring); own look: 4 white colours |
| Demonic Claw | `raceDemonicClaw` | halfdemon | - | unholy | ultimate | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); 1 flash layer; own look: screen flash, speed burst, 5 white colours |
| Demonic Roar | `raceDemonicRoar` | demon prince | - | unholy | standard | **STRIP** | stage burst (flash+ring); 1 flash layer; 1 white ring; own look: screen flash, speed burst, 3 white colours |
| Dragonfear | `raceDragonfear` | dragon | - | unholy | standard | **STRIP** | stage burst (flash+ring); own look: 1 white colours |
| Dread Aura | `raceDreadAura` | mothman | - | unholy | standard | **STRIP** | stage burst (flash+ring); 2 flash layers; 1 white ring |
| Embalm | `mmEmbalm` | mummy | - | unholy | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); own look: 8 white colours |
| Evil Eye | `raceEvilEye` |  | - | unholy | light | **STRIP** | stage burst (flash+ring); own look: 2 white colours |
| Family Curse | `raceCurseOfMisfortune` | fortune teller | - | unholy | standard | **STRIP** | stage burst (flash+ring); own look: screen flash, 3 white colours |
| Fear | `raceFear` | ghost | - | unholy | standard | **STRIP** | stage burst (flash+ring); own look: 1 white colours |
| Frenzy | `raceFrenzy` | ghoul | - | unholy | standard | **REPLACE** | stage burst (flash+ring+speedBurst); 1 flash layer |
| Grab | `raceGrab` |  | - | unholy | light | **REPLACE** | stage burst (flash+ring) |
| Grave Whisper | `goGraveWhisper` | necromancer | - | unholy | light | **STRIP** | stage burst (flash+ring) |
| Heat Death | `raceHeatDeath` | cosmic wraith | - | unholy | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); own look: 2 white colours |
| Infernal Decree | `raceInfernalDecree` | overlord | - | unholy | standard | **REPLACE** | stage burst (flash+ring); 1 flash layer; 1 white ring |
| KNEEL | `goKneel` | overlord | - | unholy | standard | **STRIP** | stage burst (flash+ring) |
| Labyrinth Roar | `raceLabyrinthRoar` | minotaur | - | unholy | standard | **STRIP** | stage burst (flash+ring); 1 flash layer; 2 white rings; own look: screen flash, speed burst, 8 white colours |
| Last Kiss | `pzLastKiss` | succubus | - | unholy | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); own look: 1 white colours |
| Linen Bind | `mmLinenBind` | mummy | - | unholy | light | **STRIP** | stage burst (flash+ring); own look: 5 white colours |
| Marrowstorm | `raceMarrowstorm` | skeleton | - | unholy | ultimate | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock) |
| Needle Work | `raceNeedleWork` |  | - | unholy | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock) |
| No Mercy | `raceNoMercy` | antihero | - | unholy | ultimate | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); 1 flash layer; own look: screen flash, speed burst, 5 white colours |
| Out of the Dark | `raceOutOfTheDark` |  | - | unholy | heavy | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock) |
| Rend | `nrRend` | wendigo | - | unholy | standard | **STRIP** | stage burst (flash+ring+speedBurst) |
| Rigormortis | `raceRigormortis` | anubis | - | unholy | standard | **STRIP** | stage burst (flash+ring); 1 flash layer; own look: 2 white colours |
| Scare Off | `raceScareOff` |  | - | unholy | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock); own look: screen flash, speed burst, 3 white colours |
| Shadow Crush | `raceShadowBind` | shadow entity | - | unholy | standard | **STRIP** | stage burst (flash+ring); 1 white ring; own look: screen flash, speed burst, 7 white colours |
| Shadow Step | `nrShadowStep` | ninja | - | unholy | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); 1 flash layer; own look: 2 white colours |
| Shambling Horde | `raceShamblingHorde` | zombie | - | unholy | ultimate | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); own look: 2 white colours |
| Skull Crack | `skullCrack` | Raider | - | unholy | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); 1 flash layer |
| Skyscraper Toss | `raceSkyscraperToss` | kaiju | - | unholy | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); 1 flash layer |
| Sleep Paralysis | `raceSleepParalysis` | succubus | - | unholy | standard | **REPLACE** | stage burst (flash+ring) |
| Soul Bind | `raceSoulBind` | demon | - | unholy | standard | **STRIP** | stage burst (flash+ring) |
| Soul Suck | `raceSoulSuck` | succubus | - | unholy | standard | **REPLACE** | stage burst (flash+ring); 1 flash layer |
| Stolen Vitality | `pzStolenVitality` | succubus | - | unholy | standard | **STRIP** | stage burst (flash+ring) |
| Terror Pounce | `raceTerrorPounce` | ghoul | - | unholy | ultimate | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock) |
| The Reaping | `goSoulHarvest` | necromancer | - | unholy | heavy | **STRIP** | stage burst (flash+lines+ring+aftershock) |
| Tithe | `raceCultTithe` | cult leader | - | unholy | light | **STRIP** | stage burst (flash+ring) |
| Treeline Scream | `goTreelineScream` | goatman | - | unholy | standard | **STRIP** | stage burst (flash+ring) |
| Voodoo | `raceVoodoo` | shaman | - | unholy | standard | **STRIP** | stage burst (flash+ring) |
| Weigh the Heart | `raceWeighTheHeart` | anubis | - | unholy | ultimate | **STRIP** | stage burst (flash+lines+ring+aftershock); 1 flash layer |
| Zombie Rush | `raceZombieRush` | zombie | - | unholy | standard | **STRIP** | stage burst (flash+ring+speedBurst); own look: screen flash, speed burst |

## B10 · Bodies and tech: human, kinetic, grapple, skyfall, rig, tech, alien (112)

| Spell | id | Race / school | Element | Stage look | Weight | Rule | White layers found |
|---|---|---|---|---|---|---|---|
| Mandible Strike | `raceMandibleStrike` | mantid | - | alien | light | **REPLACE** | stage burst (flash+ring); 1 flash layer |
| Dust Devil | `raceDustDevil` | anubis | wind | grapple | standard | **STRIP** | stage burst (flash+ring+speedBurst); pale noise wash; 1 white ring; own look: 1 white colours |
| Electromagnet | `pzElectromagnet` | robot | metal | grapple | standard | **STRIP** | stage burst (flash+ring+speedBurst); pale noise wash; own look: 1 white colours |
| Grapple Arm | `sigGrappleArm` | cyborg | metal | grapple | light | **STRIP** | stage burst (flash+ring); pale noise wash; 1 flash layer; own look: 2 white colours |
| Gravity Well | `raceGravityWell` | annunaki | - | grapple | standard | **STRIP** | stage burst (flash+ring+speedBurst) |
| Harvest Hook | `raceHarvestHook` | scarecrow | nature | grapple | light | **REPLACE** | stage burst (flash+ring) |
| Horn Hook | `raceHornHook` |  | nature | grapple | heavy | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock) |
| Infernal Conscription | `raceInfernalConscription` | demon prince | - | grapple | standard | **REPLACE** | stage burst (flash+ring+speedBurst) |
| Krampus Chains | `goKrampusChains` | krampus | metal | grapple | standard | **STRIP** | stage burst (flash+ring+speedBurst) |
| Lasso | `raceLasso` | cowboy | metal | grapple | light | **REPLACE** | stage burst (flash+ring) |
| Lure | `sigLure` | deep sea fish | - | grapple | standard | **STRIP** | stage burst (flash+ring+speedBurst); own look: 3 white colours |
| Round Up | `raceRoundUp` |  | metal | grapple | heavy | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock) |
| Rustle | `raceRustle` |  | - | grapple | standard | **REPLACE** | stage burst (flash+ring+speedBurst) |
| Tether Line | `sigTetherLine` | astronaut | metal | grapple | standard | **STRIP** | stage burst (flash+ring+speedBurst); pale noise wash; own look: 3 white colours |
| Tongue Lash | `pzTongueLash` | reptilian | poison | grapple | standard | **STRIP** | stage burst (flash+ring+speedBurst) |
| Vine Whip | `raceVineWhip` |  | nature | grapple | standard | **STRIP** | stage burst (flash+ring+speedBurst); own look: 5 white colours |
| Vortex Slam | `sharedVortexSlam` | kraken | wind | grapple | ultimate | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale noise wash; own look: 2 white colours |
| Acquisition | `nrAcquisition` | tech ceo | - | human | light | **STRIP** | stage burst (flash+ring); pale palette (human); own look: 1 white colours |
| Artillery Strike | `raceArtilleryStrike` | general | - | human | ultimate | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (human); 2 flash layers; 1 white ring |
| Board Slam | `nrBoardSlam` | skater | - | human | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (human); own look: 1 white colours |
| Cosmic Slam | `raceCosmicSlam` | antihero | - | human | heavy | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (human); 1 flash layer; 1 white ring |
| Cut Off | `bnCutOff` | bunny girl | - | human | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (human); own look: 1 white colours |
| Disrupt | `nrDisrupt` | tech ceo | - | human | standard | **STRIP** | stage burst (flash+ring); pale palette (human); own look: 1 white colours |
| Dynamic Duo | `pzDynamicDuo` | sidekick | - | human | standard | **STRIP** | stage burst (flash+ring+speedBurst); pale palette (human); own look: speed burst, 1 white colours |
| Executive Order | `raceExecutiveOrder` | politician | - | human | standard | **REPLACE** | stage burst (flash+ring); pale palette (human); 1 flash layer |
| Felony Takedown | `pzFelonyTakedown` | police officer | - | human | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (human); own look: 1 white colours |
| Flat Earth | `raceTruthBomb` | reptilian | - | human | ultimate | **STRIP** | stage burst (flash+lines+ring+orb+aftershock); pale palette (human); own look: 1 white colours |
| Foreclose | `nrForeclose` | banker | - | human | heavy | **STRIP** | stage burst (flash+lines+ring+orb+aftershock); pale palette (human); own look: 2 white colours |
| Gator Toss | `nrGatorToss` | florida man | - | human | standard | **STRIP** | stage burst (flash+ring+speedBurst); pale palette (human); own look: 2 white colours |
| Hey, Over Here! | `pzOverHere` | sidekick | - | human | standard | **STRIP** | stage burst (flash+ring); pale palette (human); own look: 2 white colours |
| Lance | `raceLance` |  | - | human | heavy | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (human) |
| Layoffs | `nrLayoffs` | tech ceo | - | human | standard | **STRIP** | stage burst (flash+ring); pale palette (human); own look: 1 white colours |
| Overdue | `nrOverdue` | librarian | - | human | standard | **STRIP** | stage burst (flash+ring); pale palette (human); own look: 3 white colours |
| Penalty | `nrPenalty` | referee | - | human | standard | **REPLACE** | stage burst (flash+ring+speedBurst); pale palette (human) |
| Pie in the Face | `sigPieInTheFace` | clown | - | human | standard | **STRIP** | stage burst (flash+ring+speedBurst); pale palette (human); 1 flash layer; own look: 3 white colours |
| Pressure Point | `racePressurePoint` |  | - | human | heavy | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (human) |
| Roll Credits | `raceRollCredits` | chosen one | - | human | ultimate | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (human) |
| Saw in Half | `nrSawInHalf` | magician | - | human | heavy | **STRIP** | stage burst (flash+lines+ring+orb+aftershock); pale palette (human); 1 flash layer; own look: 3 white colours |
| Team Strike | `sentaiTeamStrike` | super sentai | - | human | standard | **REPLACE** | stage burst (flash+ring+speedBurst); pale palette (human); 1 flash layer |
| The Tribute | `goTribute` | minotaur | - | human | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (human) |
| Timeout | `nrTimeout` | referee | - | human | standard | **STRIP** | stage burst (flash+ring); pale palette (human); own look: 1 white colours |
| Abominable Ambush | `pzAbominableAmbush` | yeti | ice | kinetic | heavy | **STRIP** | stage burst (flash+lines+ring+crescent+speedBurst+crescent2+aftershock); pale palette (kinetic); pale noise wash; own look: 1 white colours |
| Blitz | `raceBlitz` | quarterback | earth | kinetic | standard | **REPLACE** | stage burst (flash+ring+crescent+speedBurst); pale palette (kinetic); 1 flash layer; 1 white ring |
| Body Check | `raceBodyCheck` | juggernaut | - | kinetic | standard | **REPLACE** | stage burst (flash+ring+crescent+speedBurst); pale palette (kinetic); 1 flash layer; 1 white ring |
| Bull Rush | `raceBullRush` | minotaur | nature | kinetic | ultimate | **STRIP** | stage burst (flash+lines+ring+crescent+speedBurst+crescent2+aftershock); pale palette (kinetic); 1 flash layer; 1 white ring |
| Dark Feather | `raceDarkFeather` | chosen one | - | kinetic | standard | **REPLACE** | stage burst (flash+ring+crescent+speedBurst); pale palette (kinetic); 1 flash layer |
| Divine Swoop | `raceDivineSwoop` | valkraye | wind | kinetic | heavy | **STRIP** | stage burst (flash+lines+ring+crescent+speedBurst+crescent2+aftershock); pale palette (kinetic); pale noise wash; 1 flash layer; own look: screen flash, speed burst |
| Down the Chimney | `pzDownTheChimney` | santa clause | - | kinetic | ultimate | **STRIP** | stage burst (flash+lines+ring+crescent+speedBurst+crescent2+aftershock); pale palette (kinetic); own look: 1 white colours |
| Drive-By | `raceDriveBy` | gangster | metal | kinetic | standard | **REPLACE** | stage burst (flash+ring+crescent+speedBurst); pale palette (kinetic); pale noise wash; 1 flash layer |
| Feral Dive | `raceFeralDive` | werewolf | nature | kinetic | heavy | **STRIP** | stage burst (flash+lines+ring+crescent+speedBurst+crescent2+aftershock); pale palette (kinetic); 1 flash layer; own look: screen flash, speed burst, 4 white colours |
| Fifty Times Its Weight | `sigFiftyTimes` | antperson | nature | kinetic | standard | **REPLACE** | stage burst (flash+ring+crescent+speedBurst); pale palette (kinetic) |
| From the Ceiling | `pzFromTheCeiling` | symbiote | - | kinetic | heavy | **STRIP** | stage burst (flash+lines+ring+crescent+speedBurst+crescent2+aftershock); pale palette (kinetic); own look: 1 white colours |
| Giant Smash | `raceGiantSmash` | cyclops | - | kinetic | ultimate | **STRIP** | stage burst (flash+lines+ring+crescent+speedBurst+crescent2+aftershock); pale palette (kinetic); 1 flash layer |
| Giant Stride | `raceGiantStride` |  | - | kinetic | standard | **REPLACE** | stage burst (flash+ring+crescent+speedBurst); pale palette (kinetic) |
| Grotesque Dive | `goGrotesqueDive` | gargoyle | earth | kinetic | heavy | **STRIP** | stage burst (flash+lines+ring+crescent+speedBurst+crescent2+aftershock); pale palette (kinetic) |
| Haymaker | `haymaker` | Raider | - | kinetic | standard | **STRIP** | stage burst (flash+ring+crescent+speedBurst); pale palette (kinetic); 1 flash layer; 1 white ring; own look: screen flash, 1 white colours |
| Horn Toss | `raceHornToss` | minotaur | nature | kinetic | light | **REPLACE** | stage burst (flash+ring+crescent); pale palette (kinetic); 1 flash layer; 1 white ring |
| Ice Slide | `raceIceSlide` | yeti | ice | kinetic | standard | **REPLACE** | stage burst (flash+ring+crescent+speedBurst); pale palette (kinetic); pale noise wash |
| Lunar Lander | `sigLunarLander` | astronaut | metal | kinetic | standard | **REPLACE** | stage burst (flash+ring+crescent+speedBurst); pale palette (kinetic); pale noise wash |
| Popemobile | `nrPopemobile` | pope | - | kinetic | standard | **REPLACE** | stage burst (flash+ring+crescent+speedBurst); pale palette (kinetic) |
| Quickdraw | `pzQuickdraw` | swordfighter | metal | kinetic | standard | **REPLACE** | stage burst (flash+ring+crescent+speedBurst); pale palette (kinetic); pale noise wash |
| Ram Charge | `raceRamCharge` | honda civic | - | kinetic | standard | **REPLACE** | stage burst (flash+ring+crescent+speedBurst); pale palette (kinetic); 1 flash layer |
| Rampage | `rampage` | juggernaut | - | kinetic | ultimate | **STRIP** | stage burst (flash+lines+ring+crescent+speedBurst+crescent2+aftershock); pale palette (kinetic); 1 white ring |
| Rampage | `raceRampage` | Raider | - | kinetic | heavy | **REPLACE** | stage burst (flash+lines+ring+crescent+speedBurst+crescent2+aftershock); pale palette (kinetic); 1 flash layer; 1 white ring |
| Ride-By | `raceRideBy` |  | - | kinetic | heavy | **REPLACE** | stage burst (flash+lines+ring+crescent+speedBurst+crescent2+aftershock); pale palette (kinetic) |
| Runaway Train | `goRunaway` | juggernaut | metal | kinetic | heavy | **STRIP** | stage burst (flash+lines+ring+crescent+speedBurst+crescent2+aftershock); pale palette (kinetic); pale noise wash; own look: 2 white colours |
| Seismic Leap | `raceSeismicLeap` | kaiju | - | kinetic | standard | **STRIP** | stage burst (flash+ring+crescent+speedBurst); pale palette (kinetic); 1 flash layer; own look: 2 white colours |
| Shadow Infiltration | `raceShadowInfiltration` | halfdemon | - | kinetic | standard | **REPLACE** | stage burst (flash+ring+crescent+speedBurst); pale palette (kinetic) |
| Shoulder Through | `goShoulderThrough` | juggernaut | metal | kinetic | light | **STRIP** | stage burst (flash+ring+crescent); pale palette (kinetic); pale noise wash |
| Sleigh Dash | `raceSleighDash` | santa clause | ice | kinetic | standard | **REPLACE** | stage burst (flash+ring+crescent+speedBurst); pale palette (kinetic); pale noise wash |
| Sprint | `raceSprint` | rabbit | wind | kinetic | light | **REPLACE** | stage burst (flash+ring+crescent); pale palette (kinetic) |
| Stampede | `raceApexCharge` | dinosaur | nature | kinetic | heavy | **REPLACE** | stage burst (flash+lines+ring+crescent+speedBurst+crescent2+aftershock); pale palette (kinetic); 1 flash layer |
| Suplex | `goSuplex` | luchador | - | kinetic | light | **STRIP** | stage burst (flash+ring+crescent); pale palette (kinetic); own look: 2 white colours |
| Titan Drop | `raceTitanDrop` | cyclops | - | kinetic | heavy | **REPLACE** | stage burst (flash+lines+ring+crescent+speedBurst+crescent2+aftershock); pale palette (kinetic); 2 flash layers |
| Vault | `raceVault` | rabbit | - | kinetic | heavy | **REPLACE** | stage burst (flash+lines+ring+crescent+speedBurst+crescent2+aftershock); pale palette (kinetic) |
| 5G Tower | `fiveGTower` | Engineer | lightning | rig | standard | **REPLACE** | stage burst (flash+ring); pale palette (rig); 1 flash layer; 1 white ring |
| Chivalry | `raceChivalry` | knight | - | rig | light | **REPLACE** | stage burst (flash+ring); pale palette (rig); 1 flash layer |
| Cloning Machine | `raceCloneDecoy` | mad scientist | metal | rig | standard | **REPLACE** | stage burst (flash+ring); pale palette (rig) |
| Deathtrap | `raceDeathtrap` |  | physical | rig | heavy | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (rig) |
| Deploy Turret | `deployTurret` | Engineer | - | rig | standard | **REPLACE** | stage burst (flash+ring); pale palette (rig); 1 flash layer; 1 white ring |
| Federation Beacon | `raceFederationBeacon` | nordic | - | rig | standard | **REPLACE** | stage burst (flash+ring); pale palette (rig) |
| Hologram | `sigHologram` | droid | - | rig | standard | **REPLACE** | stage burst (flash+ring); pale palette (rig) |
| Jack-in-the-Box | `sigJackInTheBox` | clown | metal | rig | standard | **REPLACE** | stage burst (flash+ring); pale palette (rig) |
| Ooze Trail | `raceOozeTrail` | black goo | - | rig | light | **REPLACE** | stage burst (flash+ring); pale palette (rig) |
| Plaguefield | `racePlaguefield` | necromancer | - | rig | standard | **STRIP** | stage burst (flash+ring); pale palette (rig); own look: 2 white colours |
| Poison Swamp | `sharedPoisonSwamp` | skeleton | poison | rig | light | **REPLACE** | stage burst (flash+ring); pale palette (rig) |
| Sacred Geometry | `raceSacredGeometry` | djinn | - | rig | light | **STRIP** | stage burst (flash+ring); pale palette (rig); 1 flash layer |
| Scrap Mine | `raceScrapMine` | gnome | fire | rig | standard | **REPLACE** | stage burst (flash+ring+speedBurst); pale palette (rig) |
| Snare | `raceSnare` |  | nature | rig | light | **REPLACE** | stage burst (flash+ring); pale palette (rig) |
| Spring Snare | `raceLucidTrap` | dreameater | - | rig | light | **REPLACE** | stage burst (flash+ring); pale palette (rig); 1 flash layer |
| Stuffed Double | `raceStuffedDouble` | scarecrow | - | rig | standard | **REPLACE** | stage burst (flash+ring); pale palette (rig) |
| Tesla Coil | `raceTeslaTrap` | mad scientist | lightning | rig | light | **STRIP** | stage burst (flash+ring); pale palette (rig); own look: screen flash, 2 white colours |
| Tunnel Network | `raceTunnelNetwork` | antperson | - | rig | standard | **REPLACE** | stage burst (flash+ring); pale palette (rig) |
| Wall of Fire | `wallOfFire` | Black Mage | fire | rig | standard | **STRIP** | stage burst (flash+ring); pale palette (rig) |
| Abduction Beam | `raceAbductionBeam` | grey | - | skyfall | heavy | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); 1 flash layer; own look: 2 white colours |
| Descending Wrath | `raceDescendingWrath` | fallen angel | wind | skyfall | standard | **REPLACE** | stage burst (flash+ring+speedBurst); pale noise wash; 1 flash layer |
| Dragon Toss | `raceDragonToss` | dragon | wind | skyfall | standard | **REPLACE** | stage burst (flash+ring+speedBurst); pale noise wash |
| Infernal Hurl | `raceInfernalHurl` | demon | fire | skyfall | standard | **REPLACE** | stage burst (flash+ring+speedBurst); 1 white ring |
| Meteor | `meteor` | Black Mage | fire | skyfall | ultimate | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); 2 flash layers; 1 white ring; own look: screen flash, speed burst, 1 white colours |
| Nebula | `sharedNebula` | cosmic wraith | - | skyfall | ultimate | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); own look: screen flash, 6 white colours |
| Place Bomb | `placeBomb` | Agent | fire | skyfall | standard | **REPLACE** | stage burst (flash+ring+speedBurst); 3 flash layers; 1 white ring |
| Predator Drop | `racePredatorDrop` | vampire | blood | skyfall | ultimate | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); 1 flash layer |
| To the Moon | `raceRocketToss` | cyborg | - | skyfall | ultimate | **REPLACE** | stage burst (flash+lines+ring+speedBurst+aftershock); 1 flash layer |
| Crash Loop | `raceCrashLoop` | glitch | - | tech | standard | **REPLACE** | stage burst (flash+ring); pale palette (tech); 1 flash layer |
| Full Burst | `raceFullBurst` |  | - | tech | ultimate | **STRIP** | stage burst (flash+lines+ring+speedBurst+aftershock); pale palette (tech); own look: 3 white colours |
| Hydraulic Punch | `raceHydraulicPunch` | cyborg | - | tech | standard | **REPLACE** | stage burst (flash+ring+speedBurst); pale palette (tech); 2 flash layers |
| Megazord Blast | `sentaiMegazordBlast` | super sentai | - | tech | ultimate | **STRIP** | stage burst (flash+lines+ring+orb+aftershock); pale palette (tech); 1 flash layer; 2 white rings |
| Mortar Salvo | `raceMortarSalvo` | mech | - | tech | standard | **REPLACE** | stage burst (flash+ring+speedBurst); pale palette (tech); 1 flash layer; 1 white ring |
| Recursive Loop | `raceRecursiveLoop` | ai | - | tech | heavy | **REPLACE** | stage burst (flash+lines+ring+orb+aftershock); pale palette (tech); 1 flash layer |
| Rocket Fist | `raceRocketFist` | robot | - | tech | standard | **REPLACE** | stage burst (flash+ring+speedBurst); pale palette (tech); 1 flash layer; 1 white ring |
| System Crash | `raceSystemCrash` |  | - | tech | ultimate | **REPLACE** | stage burst (flash+lines+ring+orb+aftershock); pale palette (tech) |
| Transform | `raceTransform` | honda civic | - | tech | standard | **REPLACE** | stage burst (flash+ring); pale palette (tech); 2 flash layers; 1 white ring |
