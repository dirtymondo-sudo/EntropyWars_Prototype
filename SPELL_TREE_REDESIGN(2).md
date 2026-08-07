# Spell Tree Redesign — "Tree of Life" Spell Selector

**Status: DESIGN / AUDIT — not yet implemented.** This doc is the blueprint for replacing
the flat spell pool in the party builder with a Kabbalah-style skill tree: **4 race
abilities + 4 primary-job spells + 4 secondary-job spells**, rooted at Basic Attack,
with adjacency-gated equipping into the existing 6 spell slots.

---

## 1. The Tree

### 1.1 Layout (13 nodes)

Mapped onto the classic Tree of Life. Middle pillar = **Race** (your blood — always with
you). Right pillar (Mercy) = **Primary Job**. Left pillar (Severity) = **Secondary Job**.

```
        [S4★]   [R4★]   [P4★]      ← capstones (Binah-crown / KETER / Chokhmah-crown)
                  |
         [S3]---[R3]---[P3]        ← ring 3 (tier II)   + cross-links
          |       |      |
         [S2]---[R2]---[P2]        ← ring 2 (tier I)    + cross-links
          |       |      |
         [S1]   [R1]   [P1]        ← ring 1 (tier I)
            \     |    /
             [ ROOT ]              ← MALKHUT: Basic Attack (always known, 0 slots)
```

- **Root = Basic Attack** (Malkhut). Always equipped, costs no slot. Connects to all
  three ring-1 nodes (exactly like Malkhut → Yesod/Hod/Netzach).
- **R3 renders as Da'at** — the dashed "hidden sephira" — a free flavor win.
- **Capstones (ring 4)** connect ONLY to their own branch's ring-3 node. No cross-links
  at the top.
- **Cross-links** exist at ring 2 (S2↔R2↔P2) and ring 3 (S3↔R3↔P3). Decorative extra
  paths can be drawn faintly to evoke the full 22-path tree, but only the functional
  paths glow.

### 1.2 Rules

1. **Equip rule:** a spell can be equipped iff it is adjacent (via a functional path) to
   an already-equipped node (root counts). 1 slot each, `SPELL_SLOT_MAX = 6`.
2. **Unequip rule:** only if the remaining equipped set stays connected to the root.
   Otherwise block with a shake + tooltip ("would sever X, Y"). (Cascade-refund was
   considered; blocking is more predictable.)
3. **Tiers are the rings:** ring 1–2 = tier I, ring 3 = tier II, ring 4 = tier III.
   This *replaces* the current half-implemented tier system as the source of truth.
4. **Capstone scarcity is emergent, no extra rule needed:**
   - Master one branch + 1 from each other branch: `R1 R2 R3 R4★ + P1 + S1` = 6 ✓
   - Two from each branch: `R1 R2 P1 P2 S1 S2` = 6 ✓
   - Two capstones: full branch (4) + other branch's 3+4 via ring-3 cross-link = 6 ✓
   - **Three capstones: impossible** (each capstone needs its own ring-3; 3×(3+1) > 6).
5. **Respec is free** any time in the builder (it's pre-match loadout, not progression).

### 1.3 UX so players "get it" instantly

- **Reachable** nodes pulse with a faint gold ring; **equipped** nodes are filled and lit;
  unreachable nodes are dim with dark paths.
- **Hover an unreachable node** → the cheapest path to it lights up ("costs 3 slots").
- **Click an unreachable node** → auto-equip the cheapest path if slots allow (one click
  = whole path). This removes 90% of adjacency confusion.
- Reuse the existing rich tooltip (`buildSpellTooltip` in party-builder.js) on hover.
- Slot counter rendered as 6 pips near the root; the existing 6-slot "rack" stays in sync.
- Fits the builder's existing tarot/occult skin (`pb-tarot`) — same palette, DotGothic16.

---

## 2. Kit grammar — every 4-spell branch follows the same shape

A branch is not "4 spells we happened to keep." Every branch reads the same way:

| Ring | Role | Budget |
|---|---|---|
| **r1 — Opener** | Cheap, spammable. Either the kit's **setup** (applies its signature status) or its bread-and-butter poke. | Tier I, low MP |
| **r2 — Tool** | Utility/mobility/defense: the thing that defines *how this kit plays* (dash, shield, zone, deploy, cleanse). | Tier I |
| **r3 — Payoff / Heavy** | The reward for the setup (bonus-vs-status hit) or the kit's heavy commitment play. | Tier II |
| **r4★ — Capstone** | The one clearly-strongest button. Big numbers, big moment. | Tier III |

### 2.1 ONE EFFECT PER CAST — the single-status rule

**No spell may apply more than one named status effect. Ever. Capstones included.**
A damage spell + one status rider is fine (that's the setup engine); status + status is not.

Audit found exactly these offenders — fix them:

| Spell | Today | Fix |
|---|---|---|
| `sharedHexOfToil` ("Hex of Agony") | Hexed **+ Poison** | **Drop Poison.** Hexed alone (hurts on move AND cast) is already a full effect. Used by shaman/fortune teller/scarecrow/demon princess. |
| `raceLavaLamp` (barbarella) | Poison **+ Slow** | **Delete** (already cut from barbarella's final 4). |
| `raceCurseOfMisfortune` | −1 ATK **and** −1 DEF | One stat only: −2 ATK (it's a curse on your strength). |
| `raceStealFromRich` | −1 ATK **and** −1 DEF | −2 ATK only (already cut, but fix if kept anywhere). |
| `raceNaughtyList` | −1 ATK **and** −1 DEF | −2 ATK only. |

Same rule for stat stages below capstone: **one stat per buff/debuff, deeper stages
instead of wider spread** (−2 ATK reads cleaner and combos harder than −1/−1).
21 race buffs currently raise two stats at once (mimicry, siegeMode, wishGranted,
innerDemon, rallyCommand, royalDecree, apeFury, kiCharge, hellfireCrown, nitroBoost,
etc.) plus warCry's hardcoded +2 ATK/+1 DEF: retune all non-capstones to a single stat.
**Capstone buffs** (wishGranted★, innerDemon★…) may keep a two-stat spread — that's their
tier III power budget — but still max ONE named status.

### 2.2 Setup → Payoff matrix

The `bonusVsStatus` payoff mechanic already exists — the tree makes it a design pillar.
Every named status needs intrinsic value AND at least one payoff; every payoff needs a
setup **either in its own kit (internal combo) or reliably on the other pillars
(cross-pillar combo — the tree's whole point: race sets up, job cashes in).**

| Status | Setup sources (post-redesign) | Payoff | Combo type |
|---|---|---|---|
| Rooted | kneecapShot (Sniper r1), ironGrip (Raider r2) | precisionShot (×1.5), **haymaker — RETUNE from vs-Stagger to vs-Rooted** (can't slip a haymaker while rooted; its knockback vs a rooted target is the joke) | **internal** in both kits |
| Stun | race stuns (blueScreen, sandglassPrison, hypnoticPulse, stasisBeam, executiveOrder…) | headshot (×1.5) | **cross-pillar** — stun-race + Sniper is a build |
| Silence | skullCrack (Raider), mindShatter itself | mindShatter (×1.5) — self-looping 2-cast pattern | internal loop |
| Slow | groundSlam (Warrior), lullaby (Harbinger), race slows | crossSlash (×1.5) | **cross-pillar** — slow-race or Warrior/Harbinger secondary + Swordmaster |
| Poison | poisonDart (Agent), poisonSeed (Harvester), poison swamps (races) | lifeDrain (×1.5) | **internal** (Harvester) + cross |
| Marked | knifeThrow, deadEye★, spotter-style race marks (implant, redEyes, predictiveModel…) | built-in +dmg for EVERYONE; doubleShot doubles down | self-paying |
| Burn | fire1, wallOfFire, meteor, dragonfire | **dragonSlash★** (×1.5 vs Burn — now the Swordmaster capstone) | **cross-pillar** — fire-race or Black Mage secondary + Swordmaster is a build |
| Frozen | flashFreeze (shared) | raceFrozenPunch (yeti, ×2) | cross/internal |
| Discord | discordance, requiem★ | exorcism (priest, ×1.5) | cross-pillar |
| Hexed | hexOfToil (post-fix) | punishes move/cast by itself | self-paying |
| Stagger | sneakSlash★ (Agent capstone) | none — Stagger's turn-disruption IS the value; a ×-payoff can be added later if it feels flat | CC |

This matrix is the balance checklist for every future spell: *which row does it feed?*

---

## 3. Job Audit — final 4 per job

14 jobs. Counting learn-order spells + orphaned `SPELL_LIBRARY` spells that are native to
the class but absent from `CLASS_SPELL_LEARN_ORDER` (10 orphans exist: revive1, protect1,
darkPact, teleport, remoteView, railgun, camouflage, voidRush, rocketCharge, bubble).

Ring order below is 1 → 2 → 3 → 4★ (capstone). **★ = promote to tier III** (power pass to
the 190–220 dmg band or equivalent utility weight) if not already III. The **Playstyle**
column is the test from §2 — if you can't name the kit's playstyle/combo in five words,
the kit is wrong.

| Job | Final 4 (r1→r4★) | Playstyle / combo | Cut / moved |
|---|---|---|---|
| **Gunslinger** | doubleShot, ricochet1, crossfire, **deadEye★** | Marked loop: deadEye★ marks + crits → doubleShot hits harder vs Marked | shootout (≈ crossfire, both weak AoE) |
| **Warrior** | guardSlash, warCry, groundSlam, **judgment★** | Frontline initiator: warCry rally (retune to +2 ATK only, §2.1) → groundSlam Slow + terrain deform → judgment★ stun | — (already a perfect 4) |
| **Tank** | fortify, provoke, shieldBash, **rampart★** (I→III) | Area control: provoke forces targeting, fortify absorbs it, rampart★ walls the map | **BUG:** shieldBash is `kind:healAll` "+1 DEF all allies" — rename ("Phalanx Call") or make it an actual bash |
| **Black Mage** | fire1, thunder1, wallOfFire, **meteor★** | Elemental zoning: Burn DoT + chain lightning + fire wall → meteor★ | thunderstorm → **mothman race kit** (storm-omen lore), darkPact (orphan, delete) |
| **White Mage** | heal1, cleanse, healAll, **revive1★** (orphan II→III) | Pure lifeline; Revive is the classic white capstone and it's already coded | radiantBolt → **angel race kit** (staple divine damage lives on), protect1 → **priest race kit** (JRPG staple lives on), veilOfLight (delete) |
| **Agent** | knifeThrow, placeBomb, poisonDart, **sneakSlash★** | Attrition setup: Marked + Poison + bomb tempo → sneakSlash★ (bonus while Invisible — cross-pillar with Sniper's camouflage — and applies Stagger) | pistolWhip (≈knifeThrow), **assassinate (delete — redundant twin of sneakSlash)**, shadowLunge |
| **Psychic** | kineticHurl, psychosis, teleport (orphan), **mindShatter★** | Control mage: psychosis −2 MDEF amplifies, teleport repositions anyone, mindShatter★ self-loops (applies Silence, pays off Silence) | glare (merge into psychosis — but §2.1: keep it ONE stat, −MDEF), remoteView, bubble; voidRush → race-only |
| **Harvester** | healingSeed, poisonSeed, lifeDrain, **leechSeed★** (II→III) | **Internal combo:** poisonSeed sets Poison → lifeDrain ×1.5 vs Poison; seeds = zone economy | trunkThrow → **bigfoot race kit** (a sasquatch hurling trees is the right home) |
| **Engineer** | repair, deployTurret, fiveGTower, **railgun★** (orphan, already III) | Field engineer: repair + two deployables (turret paints targets, 5G tower scrambles) → railgun★ pierce | plasmaGun (≈railgun, too similar — delete), rocketCharge; **overclock → cyborg race-only**; **empBurst → race-only** (robot/android/droid capstone) |
| **Harbinger** | discordance, lullaby, encore, **requiem★** | Tempo bard: Discord setup → requiem★ AoE; lullaby Slow feeds crossSlash cross-pillar; encore = bonus AP | sonicCharge, fermata |
| **Freelancer** | improvise, jackOfAll, **wildcard socket**, **reallyGoodPunch★** | Jack of all trades made literal: r3 is an open socket — slot any tier I/II spell from any job. **No new spells authored** | — |
| **Raider** | haymaker, ironGrip, skullCrack, **rampage★** | **Internal combo (after retune):** ironGrip Roots → haymaker ×1.5 vs Rooted (retuned from Stagger, §2.2); skullCrack silences casters; rampage★ finisher | — |
| **Sniper** | kneecapShot, camouflage (orphan), precisionShot, **headshot★** | **Internal combo:** kneecapShot Roots → precisionShot ×1.5 vs Rooted; headshot★ ×1.5 vs Stun (cross-pillar with stun races); camouflage = repositioning | spotter (Marked overlap), steadyAim |
| **Swordmaster** | crossSlash, swordBeam, bladeWaltz, **dragonSlash★** (retag II→III) | Escalating geometry: single cut → line → diamond AoE → dragonSlash★ (severe, ignores DEF, **×1.5 vs Burn** — cross-pillar with fire setups) | zantetsuken (delete), parryStance, lungingStrike; dragonSlash already had capstone stats at tier II — retagging it III makes the label honest |

Race/job overlap conflicts resolved by the cuts above: `empBurst` (→races),
`rampart` (→Tank only; the 6 races that borrowed it lose it — all were over 4 anyway,
except gnome, see below), `overclock` (**cut from Engineer → cyborg keeps it**, dupe
resolved with no rename), `rampage` (→Raider; juggernaut promotes its
own unstoppableCharge instead), `groundSlam` (→Warrior; king kong promotes primalSmash).

**Authoring rule going forward: no spell id may appear in both a job tree and a race tree.**

---

## 4. Race Audit — 96 races

Current distribution: **1 ability:** 1 race · **2:** 2 · **3:** 12 · **4:** 23 · **5:** 25 ·
**6:** 21 · **7:** 10 · **8:** 2. Only 4 races carry a tier III today; 457 of 470 race
abilities have no tier at all — the ring system supersedes that.

Heuristics used: keep uniques over `shared*` copies; cut within-race duplicates
(e.g. two lifeDrains); cut weather summons first when over budget; and the §2 grammar —
opener/setup, tool, payoff/heavy, capstone. Race kits deliberately carry **setup
statuses** (stuns, roots, slows, marks) so job pillars can cash them in (§2.2): a
stun-race Sniper or a slow-race Swordmaster is a *build*, and that's the point.
All §2.1 single-status fixes apply (hexOfToil loses its Poison rider everywhere it
appears below).
**★ = promote to tier III with a power pass.** *(add)* = new ability to author.

| Race | Final 4 (r1→r4★) | Cut | Add / notes |
|---|---|---|---|
| homosapien | raceAdrenalineRush r2 | — | **+3 (add):** r1 "Elbow Grease" (dmg), r3 "Underdog Spirit" (buff when outnumbered), r4★ "Indomitable Will" (survive lethal at 1 HP, once) |
| pirate | boardingRush, plunder, yoHo, **cannonball★** ("Broadside") | walkThePlank, anchor, grapple | |
| swordfighter | sadBackstory, plotArmor, toBeContinued, **blessedBlade★** | — | two buffs in kit is fine for the joke-race identity |
| knight | chivalry, shieldWall, oathOfValor, **+ "Crusade"★** *(add)* | — | capstone: holy cross dmg + ally shield |
| shaman | herbalRemedy, spiritWalk, badTrip, **ayahuascaRetreat★** | sharedHexOfToil, sharedEgoDeath | egoDeath stays with machine elves |
| mad scientist | teslaTrap, cloneDecoy, overcharge, **plandemic★** | sharedShrinkRay, freeEnergy | |
| cowboy | lasso, fanTheHammer, **+ "Quick Draw"** *(add: counter-shot)*, **highNoon★** | — | |
| men in black | deneuralizer, agentVanish, smokeScreen, **classifiedWeapon★** | — | already 4 |
| telepath | telepathicLink, psychicBarrier, brainwash, **mindCrush★** | — | already 4 |
| marksman | *(merged)* suppressiveFire, smokeScreen, **+1** *(add)*, **+capstone** *(add)* | — | **BUG:** raceSuppressiveFire + raceSuppressingFire are near-duplicate ids — merge into one (line dmg + debuff). Identity overlaps Sniper job heavily — needs a design pass. Suggest r3 "Rangefinder" (self +RNG), r4★ "Fire for Effect" (delayed artillery grid) |
| priest | divineLight, protect1, smite, **exorcism★** | absolution, sanctuary | protect1 rehomed from White Mage (JRPG staple); sanctuary stays angel's; absolution = heal dupe |
| wizard | arcaneBlast, manaShield, spellsteal, **+ "Polymorph"★** *(add)* | — | capstone: hard transform-debuff, distinct from Black Mage nukes |
| fortune teller | tarotDraw, spiritChannel, curseOfMisfortune, **crystalBall★** | starCrossed, sharedHexOfToil | starCrossed ≈ curseOfMisfortune |
| giant | boulderHurl, earthenGrasp, titanStep, **+ "Colossal Crush"★** *(add)* | — | |
| fairy | glitterburst, **+ "Pixie Dust"** *(add: ally MOV/float buff)*, trickRoom, **+ "Fae Ring"★** *(add: zone — ally regen/evasion)* | — | |
| martian | heatRay, sharedLowGravity, sharedShrinkRay, **warOfTheWorlds★** | scorchedEarth, sandstorm | tripod turret = the signature |
| nordic | auroraRay, pleiadianShield, stasisBeam, **nordicAccord★** | resonancePulse, federationBeacon | |
| grey | probe, implant, abductionBeam, **cropCircle★** | gravityCrush, lowGravity | |
| bigfoot | trunkThrow, realityShift, tremorStomp, **+ "Sasquatch Smash"★** *(add)* | bigKick | trunkThrow rehomed from Harvester — a sasquatch hurling trees |
| shadow entity | shadowBind, smokeScreen, phaseShift, **voidRush★** (II→III) | — | already 4 |
| reptilian | tailWhip, shedSkin, poisonSwamp, smokeScreen → **tailWhip★ power pass** | — | exactly 4 but no capstone-grade ability; cheapest fix: promote tailWhip ("Tail Guillotine"); better: swap smokeScreen for *(add)* "Basilisk Gaze" (petrify) |
| ai | predictiveModel, overcalculate, recursiveLoop, **+ "Singularity"★** *(add: aoe pull + dmg)* | — | |
| robot | rocketFist, chassisSlam, hydraulicCrush, **empBurst★** (already III) | — | **BUG:** id/name `raceChassisSlan` → typo for Slam |
| android | syntheticBlade, selfRepairProtocol, neuralHack, **empBurst★** | smokeScreen | |
| angel | radiantBolt, wingsOfMercy, sanctuary, **smite★** ("Divine Smite") | wingGust | radiantBolt rehomed from White Mage — the staple divine damage |
| seraphim | rapture, absolution, divineJudgment, **merkaba★** | — | already 4; merkaba is a perfect esoteric capstone |
| orb of light | photonScatter, luminousShield, prismBurst, **+ "Supernova"★** *(add)* | — | |
| demon | contract, infernalHurl, voidContract, **hellmouth★** | wingGust, scorchedEarth, bloodRain | |
| succubus | soulSuck, charm, sleepParalysis, **drainingEmbrace★** | — | already 4; differentiate the two drains: soulSuck = ranged poke, drainingEmbrace = melee capstone w/ charm rider |
| skeleton | boneToss, reassemble, poisonSwamp, **+ "Marrowstorm"★** *(add: bone AoE)* | fissure | |
| mech | mortarSalvo, siegeMode, eject, **nuke★** | scorchedEarth | |
| ghost | boo, coldSpot, flashFreeze, **possession★** | — | already 4 |
| zombie | infectiousBite, zombieRush, shamblingHorde, **+ "Outbreak"★** *(add: zone mass-infect)* | — | |
| annunaki | gravityWell, zigguratProtocol, gravityCrush, **starDecree★** | fissure | |
| skinwalker | borrowedClaw, skinSwap, mimicry → **mimicry★** ("Perfect Mimicry") | smokeScreen, poisonSwamp | 4th: keep poisonSwamp at r1? No — keep borrowedClaw, skinSwap, **+ keep smokeScreen** as r1 utility; final: borrowedClaw, smokeScreen, skinSwap, mimicry★ |
| werewolf | bite, howl, feralDive, **bloodFrenzy★** | pounce | pounce ≈ feralDive |
| gargoyle | stonefall, perchForm, calcify, **stoneDrop★** ("Terminal Velocity") | gothicRampart, fissure, wingGust, rampart | worst over-budget offender (8) |
| djinn | dustDevil, sandglassPrison, sandstorm, **wishGranted★** ("Wish") | — | already 4 |
| anubis | fissure, gravePassage, sandstorm, **weighTheHeart★** (execute low-HP) | — | already 4 |
| catgirl | loveBite, nimbleDodge, meow, **ninefoldScratch★** | smokeScreen | |
| mantid | mandibleStrike, chitinArmor, ambushLunge, **fractalNeedle★** | poisonSwamp | machine elves keep fractalNeedle? No — cut there (see below), mantid owns it |
| antperson | formicAcid, poisonSwamp, tunnelNetwork, **swarmSignal★** ("The Swarm") | infectiousBite | infectiousBite belongs to zombie |
| mothman | redEyes, thunderstorm, abduction, **prophecyOfDisaster★** | dreadAura, sandstorm, wingGust | thunderstorm rehomed from Black Mage — mothman sightings precede storms; perfect omen lore |
| siren | sonicBoomerang, riptide, deafeningWail, **callOfTheDeep★** | sonicBreaker, tidalSurge, flood | |
| scarecrow | harvestHook, stuffedDouble, hexOfToil, **crowStorm★** | sandstorm | |
| glitch | crashLoop, memoryLeak, blueScreen, **timeRewind★** | fissure | |
| machine elves | tuneFrequency, prismMirror, pulseLattice, **egoDeath★** | mirrorBlink, fractalNeedle | DMT-lore capstone |
| cyclops | stoneThrow, balefulGaze, titanDrop, **giantSmash★** | rampart | |
| cyborg | hydraulicPunch, empGrenade, rocketToss, **overclock★** | — | already 4; Engineer dropped its copy, so no rename needed |
| demon prince | demonicRoar, infernalConscription, scorchedEarth, **darkDominion★** | bloodRain | |
| demon princess | kissOfDecay, hexOfToil, poisonSwamp, **darkLullaby★** | bloodRain | |
| dreameater | dreamSiphon, lucidTrap, nightmarePulse, **+ "Eternal Slumber"★** *(add: mass sleep + drain)* | — | |
| fallen angel | fallenGrace, abyssalWings, sanctuary, **descendingWrath★** | bloodRain, scorchedEarth, wingGust | |
| goatman | goreCharge, cliffCharge, bloodRitual, **+ "Baphomet's Rite"★** *(add: HP sacrifice → unholy AoE)* | — | |
| halfdemon | demonicClaw, smokeScreen, shadowStep, **innerDemon★** ("Unleash…") | shadowInfiltration, scorchedEarth | shadowInfiltration ≈ shadowStep |
| mermaid | sirenSong, tidalBlessing, riptide, **flood★** | flashFreeze, tidalSurge | |
| nephilim | smite, holyBulwark, fissure, **wrathOfTheWatchers★** | wingGust, rampart | |
| vampire | bite, mistForm, batSwarm, **predatorDrop★** | lifetap, bloodRain, smokeScreen | lifetap ≈ bite (both drains) |
| voidweaver | venomFang, webSnare, dimensionalWeb, **blackHole★** | poisonSwamp, dimensionalFold | |
| cosmic wraith | entropicBeam, phaseWalk, nebula, **heatDeath★** | fissure, blizzard, blackHole | heat-death-of-the-universe capstone = on-brand for Entropy Wars |
| superhero | heroicLeap, invulnerable, shockwaveClap, **laserBeam★** ("Ultra Beam") | nebula | |
| general | rallyCommand, ironBulwark, artilleryStrike, **nuke★** | rampart | |
| droid | taserBolt, systemAnalysis, firewallProtocol, **empBurst★** | — | already 4 |
| antihero | darkJustice, **+ "Grim Resolve"** *(add: self-buff on kill/low HP)*, cosmicSlam, **+ "No Mercy"★** *(add: execute)* | — | |
| conspiracy theorist | tinFoilHat, deadAir, sandstorm, **voxBroadcast★** ("The Broadcast") | — | already 4 |
| overlord | hellfireCrown, infernalDecree, scorchedEarth, **cataclysmDecree★** | nuke | leave nuke to mech/general/politician |
| chosen one | darkFeather, phantomDouble, prophecyFulfilled, **+ "Awakening"★** *(add: transform surge + AP refresh)* | — | |
| politician | filibuster, blackBudget, executiveOrder, **nuke★** | — | already 4; politician-with-the-football is flavor gold |
| atlantean | riptide, orichalcumBarrier, tidalSurge, **temporalTide★** | flood, flashFreeze | flood stays mermaid's capstone |
| dinosaur | jurassicJaw, apexCharge, fissure, **primalRoar★** | — | already 4 |
| dragon | wingGust, dragonfear, dragonToss, **dragonfire★** | scorchedEarth, fissure | |
| ghoul | ghoulishBite, corpseCrawl, poisonSwamp, **carrionFeast★** | — | already 4 |
| gnome | flashbangMine, tinkersContraption, clockworkTurret, **+ "Overtinker"★** *(add: upgrade + shield all own turrets)* | rampart | rampart returned to Tank |
| kaiju | cataclysmStomp, seismicLeap, skyscraperToss, **atomicBreath★** | fissure | |
| kraken | tentacleLash, inkCloud, depthCharge, **vortexSlam★** ("Maelstrom") | tidalSurge, riptide, flood | |
| loch ness monster | riptide, deepDive, cryptidVanish, **tidalSlam★** ("Ness Tsunami") | flashFreeze, tidalSurge, flood | |
| yeti | frozenPunch, iceSlide, permafrost, **avalancheStrike★** | blizzard | |
| barbarella | stunRay, gravityBoots, plasmaWhip, **spaceDisco★** | lavaLamp, charm | charm stays succubus |
| black goo | corrosiveSplash, absorb, toxicNova, **mitosisSplit★** (spawn a copy) | oozeTrail, poisonSwamp | |
| golem | boulderHurl, stoneSkin, fissure, **quake★** ("Worldquake") | rampart | |
| honda civic | ramCharge, exhaustCloud, nitroBoost, **missileBarrage★** | roboPunch | |
| ice queen | iceSpear, flashFreeze, diamondDust, **absoluteZero★** | blizzard, frozenPunch | frozenPunch stays yeti |
| juggernaut | bodyCheck, thickHide, brutalSlam, **unstoppableCharge★** | rampage | rampage returned to Raider |
| ki fighter | kiBlast, kiCharge, instantTransmission, **dragonFist★** | flurryOfBlows, kiWave | flurry ≈ kiBlast |
| king arthur | royalDecree, shieldWall, excaliburStrike, **knightsOfRound★** | — | already 4; KotR as ultimate = the FF homage done right |
| king kong | chestPound, boulderHurl, apeFury, **primalSmash★** | groundSlam | groundSlam returned to Warrior |
| minotaur | hornToss, labyrinthRoar, goreCharge, **bullRush★** ("Labyrinth Charge") | — | already 4 |
| necromancer | soulDrain, plaguefield, boneBarrage, **raiseDead★** | rigormortis, deathPact | the obvious capstone |
| occulus | psychicBeam, omniVision, hypnoticPulse, **deathGaze★** | pupilShield, sacredGeometry, wingGust | |
| quarterback | bulletPass, blitz, audible, **hailMary★** | spikeTheBall, endZoneDance | |
| robinhood | fireArrow, stealFromRich, splittingArrow, **arrowRain★** | bombArrow, poisonArrow, forestAmbush | |
| santa clause | lumpOfCoal, sleighDash, naughtyList, **blizzardPresent★** | — | already 4 |
| super sentai | redSlash, pinkHeal, teamStrike, **megazordBlast★** | blueWave, blackGuard, greenArrow, yellowThunder | **gimmick loss** — alternative: merge the 5 color moves into ONE cycling "Ranger Rotation" ability, freeing slots to keep teamStrike + megazord |
| symbiote | webLaunch, symbioteArmor, symbioticDrain, **tendrilStrike★** ("Tendril Storm") | predatorLeap | |
| valkraye | valkyrieSpear, shieldMaiden, divineSwoop, **chooserOfSlain★** (revive) | wingGust | |
| watcher | judgmentBeam, cosmicSight, temporalShift, **realityPulse★** | astralBarrier, wingGust | |

**Totals:** ~125 ability-instance cuts (mostly `shared*` copies — the shared defs stay in
data.js, just fewer references), **~19 new abilities to author** (concentrated in the
thin races: homosapien, fairy, antihero, marksman + the three-ability races; five cut
job spells — thunderstorm, radiantBolt, protect1, trunkThrow, overclock — were rehomed
to races instead of deleted), **~80 capstone promotions** (tier III tag + power pass,
no new mechanics).

---

## 5. Data model changes (data.js)

```js
// Single source of truth for the tree. Ring index IS the tier (0,1 → I; 2 → II; 3 → III).
const CLASS_TREE = {
  'Warrior':    ['guardSlash', 'warCry', 'groundSlam', 'judgment'],
  'Black Mage': ['fire1', 'thunder1', 'wallOfFire', 'meteor'],
  // ... all 14
};
const RACE_TREE = {
  'vampire':    ['raceBite', 'raceMistForm', 'raceBatSwarm', 'racePredatorDrop'],
  // ... all 96
};
// Functional adjacency, by node key: root | (branch 0..2, ring 0..3)
// root—(b,0) for all b;  (b,r)—(b,r+1);  cross: (0,1)-(1,1)-(2,1) and (0,2)-(1,2)-(2,2)
function getTreeEdges() { ... }
function isTreeLoadoutLegal(race, cls, secJob, spellIds) { ... }  // connectivity + count
function buildTreeLegalLoadout(race, cls, secJob, budget, rng) { ... } // random walk, for AI
```

- `CLASS_SPELL_LEARN_ORDER` stays for level-gated progression modes (order = ring order).
- Cut spells: **delete the entries** (Rule "delete, don't hide") — except shared defs
  still referenced by another race. Kept-but-cut ids listed above should also be removed
  from `DEFAULT_BUILDS` and any preset that references them.
- Extend `content-schema.test.js`: every race/class has exactly 4 tree ids, all resolve
  in `SPELL_BY_ID`, 4th is tier III, **no id appears in both a class tree and a race
  tree**, no id appears twice in one unit's possible tree.

## 6. Party-builder implementation (party-builder.js)

Replace the flat pool block (the `SPELL POOL` section, ~line 1837) with a
`SpellTreePanel` React component inside the same `pb-tarot` chrome:

- **Rendering:** one absolutely-positioned container; SVG `<path>` layer underneath for
  the 14 functional paths (+ faint decorative paths); 13 node divs on top (circle chips,
  ~44px, faction-colored per branch: race = faction color, primary = job color, secondary
  = desaturated). Root shows the basic-attack icon. R3 gets the dashed Da'at ring;
  capstones get a crown glyph + slow glow pulse.
- **State:** reuses `customSpells` exactly as today (array of equipped ids). Tree
  position is derived (`RACE_TREE`/`CLASS_TREE` index), so **no save-format change**.
- **Interactions:** click equipped → try unequip (connectivity check); click reachable →
  equip; click unreachable → auto-equip cheapest path if budget allows, else shake.
  Hover → existing `buildSpellTooltip` + path preview.
- **Validation:** `repairPartyBuilderState` and `legalCustomSpellIds` get a
  connectivity pass (drop orphaned ids, keep-largest-connected-subset), covering stale
  saves and race/job switches.
- **AI:** `battle.js:18823` (random pool loadout) switches to `buildTreeLegalLoadout`.
- **Modes:**
  - **Arena** hides the pool today → arena presets become tree-legal `DEFAULT_BUILDS`.
  - **Clash** bans movement spells (`_clashSpellAllowed`). ⚠ A banned mid-branch node
    would sever the chain — render banned nodes as **"sealed" pass-through**: cannot be
    equipped, but still count as connected for adjacency.
  - **Freelancer** has no subclass and gets **no new authored spells** — the identity IS
    borrowing. Primary pillar: improvise → jackOfAll → **wildcard socket** (any tier I/II
    spell from any job) → reallyGoodPunch★. Left pillar: **four wildcard sockets**,
    ring-tier-capped (r1–2 any tier I, r3 any tier II, r4 any tier III capstone).
    Cheap v1 alternative: render a 2-pillar tree until sockets are built.
  - **Online:** builder is pre-match; loadouts already sync via party meta. Host runs
    `isTreeLoadoutLegal` on receipt as the authority (RULE #2 posture).

## 7. Known issues & mitigations

1. **Content debt is the long pole** (~20 new abilities, ~80 power passes, 110 trims).
   → Phase A: ship tree UI + 14 job trees + `RACE_TREE` defaulting to "first 4 of
   RACE_ABILITIES" for un-audited races. Phase B: race waves by faction (audit table
   above is the spec). Nothing blocks on authoring.
2. **Secondary capstone policy.** Today secondary-job tier IIIs are excluded from the
   pool. Recommendation: **allow them** — reaching S4★ costs 4 connected slots, which is
   already a heavy commitment; symmetric pillars are much easier to teach. (Fallback
   balance lever: render S4 as a "sealed sephira" — visible, locked to primary.)
3. **Cross-branch duplicate spells** (empBurst, rampart, overclock, rampage, groundSlam)
   → resolved by the authoring rule + parity test (§4).
4. **Same spell in race tree and job tree for one unit** (e.g. robot Engineer pre-dedupe)
   → prevented by the same rule.
5. **Sniper vs marksman identity collision** — marksman needs its own niche (suggested:
   artillery/area-denial vs Sniper's single-target). Flagged, not solved here.
6. **Data bugs found during audit:** `raceSuppressiveFire`/`raceSuppressingFire`
   near-duplicates (merge); `raceChassisSlan` typo; Tank `shieldBash` name/effect
   mismatch; `dragonSlash` mislabeled tier II with capstone stats (fixed by making it
   the Swordmaster capstone); `sharedHexOfToil` and `raceLavaLamp` double statuses (§2.1).
7. **Mobile/layout:** tree is tall — scale-to-fit the existing pool region, nodes ≥40px,
   pinch-safe. The 6-slot rack stays visible for the "what do I have" summary.
8. **Player comprehension risk** of adjacency → solved by reachable-glow + path preview +
   click-to-auto-path (§1.3). Free respec means no punishing mistakes.

## 8. Why this is better than the flat pool

- **Choice becomes legible:** 12 curated options in 3 themed columns instead of a
  9–16-row scroll list with redundant picks.
- **Build identity:** specialist (4-1-1), hybrid (3-3), generalist (2-2-2) are visually
  distinct shapes on the tree — screenshots of builds become readable.
- **Tier III finally means something:** exactly one crown per branch, gated by
  commitment, capped at 2 per unit by geometry instead of by rulebook.
- **It's already on-brand:** the builder is literally themed as a tarot spread; the
  fortune-teller race reads cards. The Tree of Life is the same esoteric register.
