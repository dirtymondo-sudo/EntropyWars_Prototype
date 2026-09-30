== ALIAS CHECK: same object under two ids? ==
alias sharedRampart == rampart
alias raceEmpPulse == empBurst
alias raceOverclock == overclock
alias raceRampage == rampage
alias raceSuppressingFire == raceSuppressiveFire
alias raceChassisSlan == raceChassisSlam
alias raceLavaLamp == racePlasmaWhip
familyMemberIds(athleticism): [
  'raceNimbleDodge',
  'raceThickHide',
  'rampage',
  'raceUnstoppableCharge'
]
familyMemberIds(earth): [
  'raceBoulderHurl',
  'sharedFissure',
  'raceStonefall',
  'raceTremorStomp',
  'raceEarthenGrasp',
  'groundSlam',
  'raceQuake',
  'rampart',
  'raceStoneDrop'
]
familyMemberIds(robot): [
  'raceRocketFist',
  'raceHydraulicPunch',
  'overclock',
  'raceSelfRepairProtocol',
  'raceRoboPunch',
  'empBurst',
  'raceChassisSlam'
]
familyMemberIds(militarysupport): [
  'fortify',
  'raceRallyCommand',
  'raceSuppressiveFire',
  'raceIronBulwark',
  'raceArtilleryStrike',
  'shieldBash',
  'raceRangefinder',
  'raceFireForEffect',
  'sharedNuke'
]
familyMemberIds(alientechnology): [
  'raceHeatRay',
  'racePhotonScatter',
  'raceStunRay',
  'racePlasmaWhip',
  'sharedShrinkRay'
]

== DEAD FIELDS on rows ==
bonusVsDebuffed: raceRecursiveLoop(Recursive Loop), raceDarkJustice(Dark Justice)
guaranteedCrit: deadEye(Dead Eye), raceHighNoon(High Noon)
executeBonusPct: raceWeighTheHeart(Weigh the Heart), raceNoMercy(No Mercy)
selfCenter: groundSlam(Ground Slam), raceCosmicSlam(Cosmic Slam)
equipReq: knifeThrow(Knife Throw), sneakSlash(Sneak Slash)

== STATUS SETUP -> which spells apply it (family) ==
blessed: SETUP(2) Sermon[biblestudy/ally], Blessing[biblestudy]
    PAYOFF(0) NONE
blind: SETUP(2) Glitter Bomb[fae], Pepper Spray[policetraining]
    PAYOFF(0) NONE
burn: SETUP(21) Wall of Fire[fire], Meteor[fire], Divine Judgment[holydefense], Cannonball[piracy], Heat Ray[alientechnology], Plasma Cannon[cyberpunkweapons], Dark Dominion[infernalcourt], Fallen Grace[fallenangel], Descending Wrath[fallenangel], Wrath of the Watchers[fallenangel], Nebula[cosmic], Heat Vision[superheropowers], Infernal Decree[infernalcourt], Dragon Breath[dragonabilities], Dragonfire[dragonabilities], Plasma Whip[alientechnology], Excalibur Strike[royalty], Fire Arrow[archery], Lump of Coal[christmasspirit], Red Slash[sentai], Plasma Whip[alientechnology]
    PAYOFF(10) Dragon Slash[swordsmanship T4], Meteor[fire T4], Merkaba[light T4], Fire for Effect[militarysupport T4], Descending Wrath[fallenangel T4], Heat Vision[superheropowers T4], Cataclysm Decree[infernalcourt T4], Dragon Toss[dragonabilities T3], Splitting Arrow[archery T3], Megazord Blast[sentai T4]
charm: SETUP(4) Soul Suck[seduction], Charm[seduction], The Kool-Aid[cult], Stadium Show[stagepresence]
    PAYOFF(2) Draining Embrace[seduction T4], Enthrall[seduction T3]
contract: SETUP(1) Contract[demonicabilities]
    PAYOFF(2) Devour Soul[demonicabilities T3], Exorcism[biblestudy T4]
corroded: SETUP(1) Chemical Concoction[chemistry]
    PAYOFF(0) NONE
discord: SETUP(14) Discordance[sonic], Requiem[sonic], Boo[haunted], Dread Aura[cryptid], Crow Storm[scarecrow], Brainwash[deepstate], Primal Roar[apexpredator], Dragonfear[dragonabilities], Ink Cloud[deepsea], Space Disco[stagepresence], Exhaust Cloud[drivingskills], Labyrinth Roar[horns], Psychic Beam[psychic], Reality Pulse[temporal]
    PAYOFF(6) Requiem[sonic T4], Prophecy of Disaster[mothman T4], Migraine[psychic T4], Depth Charge[deepsea T3], Vehicular Manslaughter[drivingskills T4], Bull Rush[horns T4]
extendedClips: SETUP(1) Extended Clips[weaponstraining/ally]
    PAYOFF(0) NONE
feared: SETUP(1) Fear[shadow]
    PAYOFF(1) Terror Pounce[ghoulish T4]
frozen: SETUP(7) Cold Spot[haunted], Flash Freeze[ice], Freeze Breath[superheropowers], Permafrost[ice], Avalanche Strike[winter], Absolute Zero[ice], Blizzard Present[christmasspirit]
    PAYOFF(3) Avalanche Strike[winter T4], Frozen Punch[winter T1], Sleigh Dash[christmasspirit T2]
goo: SETUP(2) Goo Shot[ooze], Splash[poison]
    PAYOFF(1) Absorb[ooze T2]
grievous: SETUP(2) Curb Stomp[dirtyfighting], Frenzy[ghoulish]
    PAYOFF(0) NONE
haunted: SETUP(1) Haunt[haunted]
    PAYOFF(1) Boo[haunted T4]
hexed: SETUP(2) Hex of Agony[witchcraft], Family Curse[witchcraft]
    PAYOFF(3) Crow Storm[scarecrow T4], Exorcism[biblestudy T4], Crystal Ball[fortunetelling T4]
incendiary: SETUP(1) Incendiary Rounds[weaponstraining]
    PAYOFF(0) NONE
indomitable: SETUP(1) Indomitable Will[humangrit]
    PAYOFF(0) NONE
infected: SETUP(1) Infect[zombie]
    PAYOFF(1) Shambling Horde[zombie T4]
invisible: SETUP(11) Camouflage[huntingskills], Phase Shift[shadow], Smoke Screen[spygear/ally], Blurry Photo[cryptid], Nimble Dodge[athleticism], Spirit Walk[astralprojection], Agent Vanish[spygear], Mist Form[vampiricabilties], Corpse Crawl[ghoulish], Cryptid Vanish[cryptid], QB Sneak[football]
    PAYOFF(0) NONE
jackOfAll: SETUP(1) Pep Talk[teamwork]
    PAYOFF(0) NONE
jammed: SETUP(6) EMP Burst[robot], Memory Leak[computerhacking], Neural Hack[computerhacking], Deneuralizer[advancedtechnology], EMP Grenade[spygear], EMP Burst[robot]
    PAYOFF(7) Railgun[advancedtechnology T4], Crash Loop[computerhacking T1], Hydraulic Crush[machinery T3], Synthetic Blade[cyberpunkweapons T1], Classified Weapon[advancedtechnology T4], Synthetic Punch[robot T1], Taser Bolt[cyberpunkweapons T1]
levitating: SETUP(1) Fairy Dust[fae/ally]
    PAYOFF(0) NONE
marked: SETUP(7) Knife Throw[spygear], Dead Eye[weaponstraining], Red Eyes[mothman], Predictive Model[artificialintelligence], Implant[ufo], Infernal Conscription[infernalcourt], Demonic Claw[demonicabilities]
    PAYOFF(0) NONE
minimize: SETUP(1) Shrink Ray[alientechnology]
    PAYOFF(0) NONE
monster: SETUP(1) Monster Serum[unethicalscience]
    PAYOFF(0) NONE
overclock: SETUP(4) Overclock[robot], Prophecy Fulfilled[maincharacter], Black Budget[deepstate], Overclock[robot]
    PAYOFF(0) NONE
pixieDust: SETUP(1) Pixie Dust[fae]
    PAYOFF(0) NONE
poison: SETUP(15) Poison Dart[spygear], Infectious Bite[poison], Outbreak[zombie], Plandemic[unethicalscience], Sting[jellyfish], Kiss of Decay[infernalcourt], Shadow Infiltration[shadow], Venom Fang[insectoid], Chemtrails[conspiracyknowledge], Dark Feather[maincharacter], Ghoulish Bite[ghoulish], Corrosive Splash[poison], Toxic Nova[ooze], Poison Arrow[archery], Tendril Strike[symbiosis]
    PAYOFF(9) Life Sap[blood T3], Sneak Slash[spygear T4], Outbreak[zombie T3], Marrowstorm[bonedensity T4], Formic Acid[poison T1], Kiss of Decay[infernalcourt T3], Flat Earth[conspiracyknowledge T4], Absorb[ooze T2], Symbiotic Drain[symbiosis T3]
possessed: SETUP(4) Possession[haunted], Enthrall[seduction], Indoctrinate[cult], Thrall Bite[vampiricabilties]
    PAYOFF(0) NONE
protect: SETUP(6) Protect[light], Rapture[angelic], Abyssal Wings[fallenangel], Invulnerable[superheropowers], Deep Dive[deepsea], Black Guard[sentai]
    PAYOFF(0) NONE
regen: SETUP(3) Treeline Retreat[nature], Mitosis[ooze], Symbiote Armor[symbiosis]
    PAYOFF(0) NONE
root: SETUP(10) Iron Grip[dirtyfighting], Kneecap Shot[marksmanship], Sleep Paralysis[astral], Earthen Grasp[earth], Anchor[piracy], Cuffed[policetraining], Nematocyst Net[jellyfish], Web Snare[arachnid], Rigormortis[necromancy], Web Shoot[arachnid]
    PAYOFF(5) Haymaker[martialarts T1], Precision Shot[marksmanship T3], Land Ho[piracy T2], Venom Fang[insectoid T1], Life Drain[necromancy T1]
scanner: SETUP(1) System Analysis[computerhacking]
    PAYOFF(0) NONE
shadowRealm: SETUP(1) Shadow Realm[shadow]
    PAYOFF(0) NONE
silence: SETUP(6) Skull Crack[dirtyfighting], Mind Shatter[psychic], Deafening Wail[sonic], Dark Lullaby[infernalcourt], Fluoride Water[conspiracyknowledge], Filibuster[politics]
    PAYOFF(5) Mind Shatter[psychic T4], Sonic Breaker[sonic T2], Call of the Deep[water T4], Dark Lullaby[infernalcourt T4], Flat Earth[conspiracyknowledge T4]
slow: SETUP(26) Lullaby[sonic], Ground Slam[earth], Grave Chill[haunted], Shadow Crush[shadow], Water Pulse[water], Bad Trip[psychadelic], Suppressive Fire[militarysupport], Lockdown[policetraining], Gravity Well[cosmic], Resonance Pulse[sonic], Dimensional Web[arachnid], Black Hole[cosmic], Heat Death[cosmic], Tsunami[water], Whirlpool[water], Great Flood[water], Vortex Slam[wind], Tidal Slam[water], Ice Shard[ice], Ooze Trail[ooze], Ice Spear[ice], Diamond Dust[ice], Snowball Volley[winter], White Christmas[christmasspirit], Blue Wave[sentai], Suppressive Fire[militarysupport]
    PAYOFF(8) Judgment[light T4], Cross Slash[swordsmanship T1], Shadow Crush[shadow T1], Bad Trip[psychadelic T4], Star Decree[cosmic T4], Entropic Beam[cosmic T1], Tidal Slam[water T4], Ape Fury[apeintelligence T4]
soulBound: SETUP(1) Soul Bind[demonicabilities]
    PAYOFF(1) Devour Soul[demonicabilities T3]
sparkling: SETUP(1) Sparkle[fae]
    PAYOFF(0) NONE
stagger: SETUP(23) Stonefall[earth], Fissure[earth], Tremor Stomp[earth], Fee Fi Fo Fum[titan], Dynamite[cowboyskills], Nightstick[policetraining], Mic Drop[stagepresence], Swing Door[door], Air Mail[door], Trapdoor[trapmaking], Drop In[door], Cluster Rockets[cyberpunkweapons], Demonic Roar[demonicabilities], Gore Charge[horns], Cosmic Slam[cosmic], Stampede[apexpredator], Cataclysm Stomp[kaiju], Seismic Leap[kaiju], Quake[earth], Ram Charge[drivingskills], Unstoppable Charge[athleticism], Blitz[football], Yellow Thunder[sentai]
    PAYOFF(16) Stone Drop[earth T4], Weigh the Heart[ancientknowledge T4], Sasquatch Smash[sasquatch T4], Boulder Hurl[earth T1], Colossal Crush[titan T4], High Noon[cowboyskills T4], Dark Dominion[infernalcourt T4], Baphomet's Rite[blackmagic T4], Wrath of the Watchers[fallenangel T4], No Mercy[dirtyfighting T4], Jurassic Jaw[apexpredator T4], Atomic Breath[kaiju T4], Robo Punch[robot T3], Body Check[dirtyfighting T1], Horn Toss[horns T1], Hail Mary[football T4]
stoneform: SETUP(1) Stoneform[livingstone]
    PAYOFF(0) NONE
stun: SETUP(10) Blue Screen[computerhacking], Ego Death[psychadelic], Taser[policetraining], Stasis Beam[galacticfederation], Giant Smash[titan], Lucid Trap[trapmaking], Eternal Slumber[astral], Executive Order[politics], Stun Ray[alientechnology], Hypnotic Pulse[eyesight]
    PAYOFF(8) Take Aim[marksmanship T4], Aurora Ray[light T1], Fractal Needle[fractal T4], Dust Devil[desertacclimation T1], Stone Throw[stoneage T1], Dream Siphon[astral T1], Space Disco[stagepresence T4], Death Gaze[eyesight T4]
taunt: SETUP(1) Provoke[sonic]
    PAYOFF(0) NONE
tethered: SETUP(1) Lasso[ropework]
    PAYOFF(1) High Noon[cowboyskills T4]
voodoo: SETUP(1) Voodoo[blackmagic]
    PAYOFF(1) Bad Trip[psychadelic T4]
wet: SETUP(1) Bloom[jellyfish]
    PAYOFF(0) NONE

== PER RACE: finishers whose setup status is NOT in the race pool (needs a teammate) ==
homosapien: self-contained 0 [] · needs teammate 0 [] · statuses it can apply: indomitable,jackOfAll,invisible,stagger
pirate: self-contained 2 [Land Ho(root), Dragon Slash(burn)] · needs teammate 1 [Cross Slash(slow)] · statuses it can apply: root,burn,tethered
swordfighter: self-contained 0 [] · needs teammate 2 [Cross Slash(slow), Dragon Slash(burn)] · statuses it can apply: poison,overclock,invisible,stagger
knight: self-contained 1 [Dragon Slash(burn)] · needs teammate 1 [Cross Slash(slow)] · statuses it can apply: burn
shaman: self-contained 1 [Bad Trip(slow,voodoo)] · needs teammate 0 [] · statuses it can apply: regen,slow,stun,invisible
mad scientist: self-contained 2 [Classified Weapon(jammed), Railgun(jammed)] · needs teammate 0 [] · statuses it can apply: monster,poison,jammed,corroded
cowboy: self-contained 1 [High Noon(stagger,tethered)] · needs teammate 0 [] · statuses it can apply: stagger,invisible,incendiary,marked,tethered
men in black: self-contained 3 [Sneak Slash(poison), Classified Weapon(jammed), Railgun(jammed)] · needs teammate 0 [] · statuses it can apply: marked,invisible,jammed,poison,burn,stun,minimize,overclock,discord
telepath: self-contained 2 [Migraine(discord), Mind Shatter(silence)] · needs teammate 0 [] · statuses it can apply: discord,silence,overclock,invisible
marksman: self-contained 1 [Precision Shot(root)] · needs teammate 2 [Fire for Effect(burn), Take Aim(stun)] · statuses it can apply: slow,incendiary,marked,invisible,root
priest: self-contained 0 [] · needs teammate 4 [Exorcism(contract,hexed), Aurora Ray(stun), Judgment(slow), Merkaba(burn)] · statuses it can apply: blessed,protect
wizard: self-contained 1 [Meteor(burn)] · needs teammate 0 [] · statuses it can apply: burn,slow,frozen
fortune teller: self-contained 1 [Crystal Ball(hexed)] · needs teammate 0 [] · statuses it can apply: hexed
giant: self-contained 5 [Colossal Crush(stagger), Boulder Hurl(stagger), Stone Drop(stagger), Body Check(stagger), No Mercy(stagger)] · needs teammate 0 [] · statuses it can apply: stagger,stun,root,slow,grievous,silence
fairy: self-contained 0 [] · needs teammate 0 [] · statuses it can apply: sparkling,pixieDust,blind,regen
martian: self-contained 2 [Meteor(burn), Dust Devil(stun)] · needs teammate 0 [] · statuses it can apply: burn,stun,minimize,marked
nordic: self-contained 2 [Aurora Ray(stun), Merkaba(burn)] · needs teammate 1 [Judgment(slow)] · statuses it can apply: stun,protect,burn,minimize
grey: self-contained 2 [Migraine(discord), Mind Shatter(silence)] · needs teammate 0 [] · statuses it can apply: marked,discord,silence,invisible
bigfoot: self-contained 0 [] · needs teammate 1 [Sasquatch Smash(stagger)] · statuses it can apply: regen,discord,invisible
shadow entity: self-contained 3 [Shadow Crush(slow), Boo(haunted), Sneak Slash(poison)] · needs teammate 0 [] · statuses it can apply: slow,feared,poison,invisible,shadowRealm,haunted,frozen,possessed,discord,marked,jammed
reptilian: self-contained 3 [Flat Earth(silence,poison), Formic Acid(poison), Sneak Slash(poison)] · needs teammate 0 [] · statuses it can apply: poison,silence,goo,marked,invisible,jammed
ai: self-contained 1 [Crash Loop(jammed)] · needs teammate 0 [] · statuses it can apply: marked,jammed,scanner,stun
robot: self-contained 5 [Synthetic Punch(jammed), Robo Punch(stagger), Hydraulic Crush(jammed), Synthetic Blade(jammed), Taser Bolt(jammed)] · needs teammate 0 [] · statuses it can apply: overclock,jammed,stagger,burn
android: self-contained 5 [Synthetic Punch(jammed), Robo Punch(stagger), Crash Loop(jammed), Synthetic Blade(jammed), Taser Bolt(jammed)] · needs teammate 0 [] · statuses it can apply: overclock,jammed,scanner,stun,stagger,burn
angel: self-contained 1 [Judgment(slow)] · needs teammate 2 [Aurora Ray(stun), Merkaba(burn)] · statuses it can apply: protect,slow
seraphim: self-contained 0 [] · needs teammate 4 [Exorcism(contract,hexed), Aurora Ray(stun), Judgment(slow), Merkaba(burn)] · statuses it can apply: protect,blessed
orb of light: self-contained 4 [Judgment(slow), Merkaba(burn), Entropic Beam(slow), Star Decree(slow)] · needs teammate 1 [Aurora Ray(stun)] · statuses it can apply: protect,slow,stagger,burn
demon: self-contained 4 [Devour Soul(contract,soulBound), Shadow Crush(slow), Meteor(burn), Life Sap(poison)] · needs teammate 0 [] · statuses it can apply: contract,stagger,soulBound,marked,slow,feared,poison,invisible,shadowRealm,burn
succubus: self-contained 4 [Enthrall(charm), Draining Embrace(charm), Dream Siphon(stun), Devour Soul(contract,soulBound)] · needs teammate 0 [] · statuses it can apply: charm,possessed,root,stun,contract,stagger,soulBound,marked
skeleton: self-contained 2 [Boo(haunted), Cross Slash(slow)] · needs teammate 2 [Marrowstorm(poison), Dragon Slash(burn)] · statuses it can apply: slow,haunted,frozen,possessed,discord
mech: self-contained 1 [Fire for Effect(burn)] · needs teammate 2 [Synthetic Blade(jammed), Taser Bolt(jammed)] · statuses it can apply: slow,stagger,burn
ghost: self-contained 2 [Boo(haunted), Shadow Crush(slow)] · needs teammate 0 [] · statuses it can apply: slow,haunted,frozen,possessed,discord,feared,poison,invisible,shadowRealm
zombie: self-contained 4 [Outbreak(poison), Shambling Horde(infected), Formic Acid(poison), Life Drain(root)] · needs teammate 0 [] · statuses it can apply: infected,poison,goo,root
annunaki: self-contained 6 [Entropic Beam(slow), Star Decree(slow), Weigh the Heart(stagger), Boulder Hurl(stagger), Stone Drop(stagger), Precision Shot(root)] · needs teammate 1 [Take Aim(stun)] · statuses it can apply: slow,stagger,burn,root
skinwalker: self-contained 0 [] · needs teammate 1 [Baphomet's Rite(stagger)] · statuses it can apply: voodoo,discord,invisible
werewolf: self-contained 0 [] · needs teammate 0 [] · statuses it can apply: invisible
gargoyle: self-contained 2 [Boulder Hurl(stagger), Stone Drop(stagger)] · needs teammate 0 [] · statuses it can apply: stoneform,stagger,root,slow
djinn: self-contained 0 [] · needs teammate 1 [Weigh the Heart(stagger)] · statuses it can apply: 
anubis: self-contained 1 [Life Drain(root)] · needs teammate 2 [Weigh the Heart(stagger), Dust Devil(stun)] · statuses it can apply: root
catgirl: self-contained 2 [Enthrall(charm), Draining Embrace(charm)] · needs teammate 0 [] · statuses it can apply: invisible,stagger,charm,possessed
mantid: self-contained 2 [Migraine(discord), Mind Shatter(silence)] · needs teammate 2 [Venom Fang(root), Fractal Needle(stun)] · statuses it can apply: poison,discord,silence
antperson: self-contained 1 [Formic Acid(poison)] · needs teammate 1 [Venom Fang(root)] · statuses it can apply: poison,goo,jackOfAll
mothman: self-contained 1 [Prophecy of Disaster(discord)] · needs teammate 0 [] · statuses it can apply: discord,invisible,slow,marked
siren: self-contained 6 [Sonic Breaker(silence), Requiem(discord), Call of the Deep(silence), Tidal Slam(slow), Enthrall(charm), Draining Embrace(charm)] · needs teammate 0 [] · statuses it can apply: discord,taunt,silence,slow,charm,possessed
scarecrow: self-contained 1 [Crow Storm(hexed)] · needs teammate 0 [] · statuses it can apply: discord,hexed,regen
glitch: self-contained 1 [Crash Loop(jammed)] · needs teammate 0 [] · statuses it can apply: jammed,scanner,stun,discord,marked
machine elves: self-contained 2 [Fractal Needle(stun), Bad Trip(slow,voodoo)] · needs teammate 0 [] · statuses it can apply: slow,stun
cyclops: self-contained 5 [Colossal Crush(stagger), Death Gaze(stun), Boulder Hurl(stagger), Stone Drop(stagger), Stone Throw(stun)] · needs teammate 0 [] · statuses it can apply: stagger,stun,root,slow
cyborg: self-contained 4 [Synthetic Blade(jammed), Taser Bolt(jammed), Synthetic Punch(jammed), Robo Punch(stagger)] · needs teammate 0 [] · statuses it can apply: stagger,burn,overclock,jammed,indomitable
demon prince: self-contained 7 [Kiss of Decay(poison), Cataclysm Decree(burn), Dark Dominion(stagger), Dark Lullaby(silence), Devour Soul(contract,soulBound), Meteor(burn), Life Sap(poison)] · needs teammate 0 [] · statuses it can apply: marked,burn,poison,silence,contract,stagger,soulBound
demon princess: self-contained 5 [Kiss of Decay(poison), Cataclysm Decree(burn), Dark Lullaby(silence), Formic Acid(poison), Life Sap(poison)] · needs teammate 1 [Dark Dominion(stagger)] · statuses it can apply: marked,burn,poison,silence,hexed,goo
dreameater: self-contained 3 [Dream Siphon(stun), Migraine(discord), Mind Shatter(silence)] · needs teammate 1 [Terror Pounce(feared)] · statuses it can apply: root,stun,discord,silence,grievous,poison,invisible
fallen angel: self-contained 3 [Descending Wrath(burn), Wrath of the Watchers(stagger), Devour Soul(contract,soulBound)] · needs teammate 0 [] · statuses it can apply: burn,protect,contract,stagger,soulBound,marked
goatman: self-contained 3 [Horn Toss(stagger), Bull Rush(discord), Baphomet's Rite(stagger)] · needs teammate 1 [Life Sap(poison)] · statuses it can apply: stagger,discord,voodoo
halfdemon: self-contained 3 [Devour Soul(contract,soulBound), Shadow Crush(slow), Sneak Slash(poison)] · needs teammate 0 [] · statuses it can apply: contract,stagger,soulBound,marked,slow,feared,poison,invisible,shadowRealm,jammed
mermaid: self-contained 5 [Call of the Deep(silence), Tidal Slam(slow), Sonic Breaker(silence), Requiem(discord), Depth Charge(discord)] · needs teammate 0 [] · statuses it can apply: slow,discord,taunt,silence,protect
nephilim: self-contained 5 [Descending Wrath(burn), Wrath of the Watchers(stagger), Boulder Hurl(stagger), Stone Drop(stagger), Colossal Crush(stagger)] · needs teammate 0 [] · statuses it can apply: burn,protect,stagger,root,slow,stun
vampire: self-contained 0 [] · needs teammate 1 [Life Sap(poison)] · statuses it can apply: invisible,possessed
voidweaver: self-contained 1 [Venom Fang(root)] · needs teammate 1 [Fractal Needle(stun)] · statuses it can apply: root,slow,poison
cosmic wraith: self-contained 4 [Entropic Beam(slow), Star Decree(slow), Shadow Crush(slow), Precision Shot(root)] · needs teammate 1 [Take Aim(stun)] · statuses it can apply: slow,stagger,burn,feared,poison,invisible,shadowRealm,discord,root
superhero: self-contained 3 [Heat Vision(burn), Entropic Beam(slow), Star Decree(slow)] · needs teammate 0 [] · statuses it can apply: frozen,protect,burn,slow,stagger
general: self-contained 0 [] · needs teammate 1 [Fire for Effect(burn)] · statuses it can apply: slow,incendiary,marked,jackOfAll
droid: self-contained 2 [Crash Loop(jammed), Synthetic Punch(jammed)] · needs teammate 1 [Robo Punch(stagger)] · statuses it can apply: jammed,scanner,stun,overclock
antihero: self-contained 5 [Body Check(stagger), No Mercy(stagger), Entropic Beam(slow), Star Decree(slow), Heat Vision(burn)] · needs teammate 0 [] · statuses it can apply: grievous,root,silence,slow,stagger,burn,frozen,protect
conspiracy theorist: self-contained 3 [Flat Earth(silence,poison), Classified Weapon(jammed), Railgun(jammed)] · needs teammate 0 [] · statuses it can apply: poison,silence,jammed
overlord: self-contained 4 [Kiss of Decay(poison), Cataclysm Decree(burn), Dark Lullaby(silence), Meteor(burn)] · needs teammate 3 [Dark Dominion(stagger), Body Check(stagger), No Mercy(stagger)] · statuses it can apply: marked,burn,poison,silence,grievous,root
chosen one: self-contained 2 [Migraine(discord), Mind Shatter(silence)] · needs teammate 3 [Aurora Ray(stun), Judgment(slow), Merkaba(burn)] · statuses it can apply: poison,overclock,discord,silence,protect
politician: self-contained 0 [] · needs teammate 1 [Fire for Effect(burn)] · statuses it can apply: silence,stun,overclock,discord,slow
atlantean: self-contained 1 [Tidal Slam(slow)] · needs teammate 1 [Call of the Deep(silence)] · statuses it can apply: slow,frozen
dinosaur: self-contained 3 [Jurassic Jaw(stagger), Boulder Hurl(stagger), Stone Drop(stagger)] · needs teammate 0 [] · statuses it can apply: discord,stagger,root,slow
dragon: self-contained 2 [Dragon Toss(burn), Meteor(burn)] · needs teammate 0 [] · statuses it can apply: burn,discord,slow
ghoul: self-contained 3 [Terror Pounce(feared), Formic Acid(poison), Shadow Crush(slow)] · needs teammate 0 [] · statuses it can apply: grievous,poison,invisible,goo,slow,feared,shadowRealm
gnome: self-contained 2 [Boulder Hurl(stagger), Stone Drop(stagger)] · needs teammate 0 [] · statuses it can apply: stagger,root,slow,stun
kaiju: self-contained 4 [Atomic Breath(stagger), Boulder Hurl(stagger), Stone Drop(stagger), Depth Charge(discord)] · needs teammate 0 [] · statuses it can apply: stagger,root,slow,protect,discord
kraken: self-contained 2 [Depth Charge(discord), Tidal Slam(slow)] · needs teammate 1 [Call of the Deep(silence)] · statuses it can apply: protect,discord,slow
loch ness monster: self-contained 2 [Depth Charge(discord), Tidal Slam(slow)] · needs teammate 1 [Call of the Deep(silence)] · statuses it can apply: protect,discord,slow,invisible,frozen
yeti: self-contained 2 [Frozen Punch(frozen), Avalanche Strike(frozen)] · needs teammate 0 [] · statuses it can apply: slow,frozen,discord,invisible
barbarella: self-contained 2 [Enthrall(charm), Draining Embrace(charm)] · needs teammate 0 [] · statuses it can apply: burn,stun,minimize,charm,possessed
black goo: self-contained 2 [Absorb(poison,goo), Formic Acid(poison)] · needs teammate 0 [] · statuses it can apply: goo,slow,poison,regen,burn,stun,minimize
golem: self-contained 2 [Boulder Hurl(stagger), Stone Drop(stagger)] · needs teammate 1 [Dust Devil(stun)] · statuses it can apply: stoneform,stagger,root,slow
honda civic: self-contained 4 [Vehicular Manslaughter(discord), Synthetic Punch(jammed), Robo Punch(stagger), Hydraulic Crush(jammed)] · needs teammate 0 [] · statuses it can apply: stagger,discord,overclock,jammed
ice queen: self-contained 2 [Frozen Punch(frozen), Avalanche Strike(frozen)] · needs teammate 0 [] · statuses it can apply: slow,frozen
juggernaut: self-contained 3 [Body Check(stagger), No Mercy(stagger), Colossal Crush(stagger)] · needs teammate 0 [] · statuses it can apply: invisible,stagger,grievous,root,silence,stun
ki fighter: self-contained 0 [] · needs teammate 1 [Haymaker(root)] · statuses it can apply: invisible,stagger
king arthur: self-contained 1 [Dragon Slash(burn)] · needs teammate 1 [Cross Slash(slow)] · statuses it can apply: burn
king kong: self-contained 1 [Atomic Breath(stagger)] · needs teammate 1 [Ape Fury(slow)] · statuses it can apply: stagger
minotaur: self-contained 4 [Horn Toss(stagger), Bull Rush(discord), Body Check(stagger), No Mercy(stagger)] · needs teammate 0 [] · statuses it can apply: stagger,discord,grievous,root,silence
necromancer: self-contained 1 [Life Drain(root)] · needs teammate 2 [Marrowstorm(poison), Baphomet's Rite(stagger)] · statuses it can apply: root,voodoo
occulus: self-contained 3 [Death Gaze(stun), Migraine(discord), Mind Shatter(silence)] · needs teammate 1 [Weigh the Heart(stagger)] · statuses it can apply: stun,discord,silence
quarterback: self-contained 2 [Hail Mary(stagger), Precision Shot(root)] · needs teammate 1 [Take Aim(stun)] · statuses it can apply: stagger,invisible,jackOfAll,root
robinhood: self-contained 2 [Splitting Arrow(burn), Precision Shot(root)] · needs teammate 1 [Take Aim(stun)] · statuses it can apply: burn,poison,invisible,root
santa clause: self-contained 3 [Sleigh Dash(frozen), Frozen Punch(frozen), Avalanche Strike(frozen)] · needs teammate 0 [] · statuses it can apply: burn,slow,frozen
super sentai: self-contained 1 [Megazord Blast(burn)] · needs teammate 1 [Haymaker(root)] · statuses it can apply: burn,protect,slow,stagger,jackOfAll
symbiote: self-contained 3 [Symbiotic Drain(poison), Absorb(poison,goo), Formic Acid(poison)] · needs teammate 0 [] · statuses it can apply: regen,poison,goo,slow
valkraye: self-contained 0 [] · needs teammate 0 [] · statuses it can apply: burn,protect,slow
watcher: self-contained 2 [Entropic Beam(slow), Star Decree(slow)] · needs teammate 0 [] · statuses it can apply: discord,slow,stagger,burn,invisible
gangster: self-contained 0 [] · needs teammate 2 [Body Check(stagger), No Mercy(stagger)] · statuses it can apply: grievous,root,silence,incendiary,marked
nun: self-contained 0 [] · needs teammate 4 [Exorcism(contract,hexed), Aurora Ray(stun), Judgment(slow), Merkaba(burn)] · statuses it can apply: blessed,protect
door agent: self-contained 0 [] · needs teammate 0 [] · statuses it can apply: stagger,indomitable
police officer: self-contained 1 [Vehicular Manslaughter(discord)] · needs teammate 0 [] · statuses it can apply: stagger,blind,stun,root,slow,incendiary,marked,discord
jellyfish: self-contained 3 [Depth Charge(discord), Tidal Slam(slow), Formic Acid(poison)] · needs teammate 1 [Call of the Deep(silence)] · statuses it can apply: protect,discord,slow,poison,goo,wet,root
cult leader: self-contained 0 [] · needs teammate 0 [] · statuses it can apply: charm,possessed,discord
popstar: self-contained 4 [Sonic Breaker(silence), Requiem(discord), Enthrall(charm), Draining Embrace(charm)] · needs teammate 1 [Space Disco(stun)] · statuses it can apply: stagger,discord,charm,taunt,silence,slow,possessed
starfish: self-contained 4 [Tidal Slam(slow), Depth Charge(discord), Entropic Beam(slow), Star Decree(slow)] · needs teammate 1 [Call of the Deep(silence)] · statuses it can apply: slow,protect,discord,stagger,burn
ringmaster: self-contained 0 [] · needs teammate 1 [Space Disco(stun)] · statuses it can apply: stagger,discord,charm,tethered,jackOfAll
bee queen: self-contained 1 [Formic Acid(poison)] · needs teammate 1 [Venom Fang(root)] · statuses it can apply: poison,goo,jackOfAll
professor: self-contained 4 [Classified Weapon(jammed), Railgun(jammed), Migraine(discord), Mind Shatter(silence)] · needs teammate 1 [Weigh the Heart(stagger)] · statuses it can apply: corroded,jammed,discord,silence
deep sea fish: self-contained 4 [Depth Charge(discord), Tidal Slam(slow), Judgment(slow), Formic Acid(poison)] · needs teammate 3 [Call of the Deep(silence), Aurora Ray(stun), Merkaba(burn)] · statuses it can apply: protect,discord,slow,poison,goo
clown: self-contained 3 [Body Check(stagger), No Mercy(stagger), Shadow Crush(slow)] · needs teammate 1 [Space Disco(stun)] · statuses it can apply: stagger,discord,charm,grievous,root,silence,slow,feared,poison,invisible,shadowRealm
bunny girl: self-contained 2 [Enthrall(charm), Draining Embrace(charm)] · needs teammate 1 [Space Disco(stun)] · statuses it can apply: charm,possessed,invisible,stagger,discord
sharkman: self-contained 3 [Depth Charge(discord), Tidal Slam(slow), Jurassic Jaw(stagger)] · needs teammate 1 [Call of the Deep(silence)] · statuses it can apply: protect,discord,slow,stagger
crystal guardian: self-contained 2 [Boulder Hurl(stagger), Stone Drop(stagger)] · needs teammate 0 [] · statuses it can apply: stoneform,burn,stagger,root,slow
jack o lantern: self-contained 2 [Meteor(burn), Boo(haunted)] · needs teammate 0 [] · statuses it can apply: burn,slow,haunted,frozen,possessed,discord,hexed
sidekick: self-contained 1 [Heat Vision(burn)] · needs teammate 0 [] · statuses it can apply: frozen,protect,burn,jackOfAll,invisible,stagger,indomitable
mushroom girl: self-contained 2 [Bad Trip(slow,voodoo), Formic Acid(poison)] · needs teammate 0 [] · statuses it can apply: slow,stun,regen,poison,goo,sparkling,pixieDust,blind
tree person: self-contained 2 [Boulder Hurl(stagger), Stone Drop(stagger)] · needs teammate 0 [] · statuses it can apply: regen,stagger,root,slow,discord,invisible
sheriff: self-contained 1 [High Noon(stagger,tethered)] · needs teammate 0 [] · statuses it can apply: incendiary,marked,stagger,blind,stun,root,slow
astronaut: self-contained 4 [Classified Weapon(jammed), Railgun(jammed), Entropic Beam(slow), Star Decree(slow)] · needs teammate 0 [] · statuses it can apply: jammed,slow,stagger,burn,invisible
krampus: self-contained 6 [Sleigh Dash(frozen), Horn Toss(stagger), Bull Rush(discord), Baphomet's Rite(stagger), Frozen Punch(frozen), Avalanche Strike(frozen)] · needs teammate 0 [] · statuses it can apply: burn,slow,frozen,stagger,discord,voodoo
rabbit: self-contained 0 [] · needs teammate 0 [] · statuses it can apply: invisible,stagger,sparkling,pixieDust,blind,discord
luchador: self-contained 3 [Haymaker(root), Body Check(stagger), No Mercy(stagger)] · needs teammate 1 [Space Disco(stun)] · statuses it can apply: invisible,stagger,grievous,root,silence,discord,charm
firefighter: self-contained 1 [Tidal Slam(slow)] · needs teammate 1 [Call of the Deep(silence)] · statuses it can apply: slow,indomitable,jackOfAll,invisible,stagger
goblin: self-contained 3 [Body Check(stagger), No Mercy(stagger), Formic Acid(poison)] · needs teammate 0 [] · statuses it can apply: stun,stagger,grievous,root,silence,poison,goo
hippie: self-contained 1 [Bad Trip(slow,voodoo)] · needs teammate 0 [] · statuses it can apply: slow,stun,regen

== 2AP rows by tier ==
T1: Rapture, Summon Blood Rain, Summon Blizzard, Rally Command, Dark Feather, Cataclysm Stomp, Judgment Beam
T2: Walk the Plank, Pulse Lattice, Shadow Infiltration, Invulnerable, Infernal Decree, Stampede, Ki Wave
T3: Divine Judgment, Devour Soul, Outbreak, Trick Room, Blue Screen, Yo Ho, Ayahuasca Retreat, Polymorph, Nebula, Artillery Strike, Firewall Protocol, Cosmic Slam, Prophecy Fulfilled, Executive Order, Permafrost, Splash, Toxic Nova, Diamond Dust, Team Strike
T4: Merkaba, Supernova, Divine Smite, Shadow Realm, Draining Embrace, Shambling Horde, Marrowstorm, Prophecy of Disaster, Blood Frenzy, Fae Ring, Sasquatch Smash, Call of the Deep, Nuke, Singularity, Kill Mode, Colossal Crush, Indomitable Will, Crusade, Ego Death, High Noon, Fire for Effect, Drop In, Hallelujah, War of the Worlds, Eternal Slumber, Descending Wrath, Baphomet's Rite, Black Hole, Heat Death, No Mercy, Cataclysm Decree, Awakening, Tsunami, Great Flood, Poseidon's Wrath, Terror Pounce, Overtinker, Vortex Slam, Quake, Vehicular Manslaughter, Absolute Zero, Raise the Dead, Megazord Blast, Chooser of the Slain, Kill Mode

== T1 rows with dmg>=120 or aoe dmg>=100 ==
Pounce beastabilities damage 120 25MP 1 AP   
Tremor Stomp earth aoe 125 25MP 1 AP aoe1  [{"id":"stagger","duration":1}]
Big Kick sasquatch damage 120 25MP 1 AP   
Mortar Salvo mecha aoe 100 25MP 1 AP aoe1  
Curb Stomp dirtyfighting damage 120 25MP 1 AP   [{"id":"grievous","duration":2}]
Arcane Sigil arcane cross 100 25MP 1 AP   
Aurora Ray light aoe 100 25MP 1 AP aoe1  
Fallen Grace fallenangel cross 100 25MP 1 AP   [{"id":"burn","duration":1}]
Entropic Beam cosmic line 100 25MP 1 AP  line 
Whirlpool water aoePull 100 25MP 1 AP aoe1  [{"id":"slow","duration":1}]
Frenzy ghoulish lifeDrain 120 25MP 1 AP   [{"id":"grievous","duration":2}]
Cataclysm Stomp kaiju aoe 100 25MP 2 AP aoe2  [{"id":"stagger","duration":1}]
Psychic Beam psychic line 100 25MP 1 AP  line [{"id":"discord","duration":1}]
Judgment Beam temporal line 100 25MP 2 AP  line 

== T3/T4 single-target damage-only rows with dmg<=125 and no rider ==
T3 Trunk Throw nature 100 75MP 4 Deals MEDIUM physical damage to a Single Enemy.
T3 Recursive Loop artificialintelligence 125 75MP 3 Deals MEDIUM magic damage to a Single Enemy. Deals bonus damage to debuffed targets.
T3 To Be Continued maincharacter 135 75MP 3 Deals MEDIUM physical damage to a Single Enemy. Marks the target: the hit lands at the end
T3 Long Rifle huntingskills 125 75MP 5 Shoulder the long rifle. Deals MEDIUM physical damage to a Single Enemy up to 5 tiles away
T3 Ambush Lunge beastabilities 125 75MP 3 Deals MEDIUM physical damage to a Single Enemy. The caster charges into melee first.
