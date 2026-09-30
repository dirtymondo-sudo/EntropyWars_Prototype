### 💻🧠 Artificial Intelligence `artificialintelligence` — VERDICT: KEEP (give Marked its payoff)
**Identity.** The caster-debuffer's chain: mark a target, out-compute it, then cash the mark; the 5×5 Singularity is the team's pull-and-nuke. Flavour: a model converging on you.
**Races.** Fit: ai (all four rungs live here), glitch (tech/anomaly "probability states" — a software fault, int 84; rungs use Hacking + Temporal but the fit is real). Missing: **droid** — lore is literally "most advanced mobile AI platform ever constructed", int 90, and it owns nothing in this family. RACE_ADD droid (pool 18 → 22; it already carries the sibling Hacking family).
**Now.**
- T1 Predictive Model `racePredictiveModel` · Marked 3, rng 4, 25MP 1AP.
- T2 Overcalculate `raceOvercalculate` · self ATK +1 stage, 50MP.
- T3 Recursive Loop `raceRecursiveLoop` · 125 magic single, rng 3; desc promises bonus vs debuffed (dead field `bonusVsDebuffed`).
- T4 Singularity `raceSingularity` · 160 magic 5×5, pull to center, rng 4, 2AP CD2.
**Problems.** Marked has 7 setups game-wide and ZERO payoffs (synergy.md) — Predictive Model does nothing. Recursive Loop's "bonus damage to debuffed targets" is a dead field, so it is a plain 125 at T3 (under-tuned list). Overcalculate raises ATK on races with ATK 18 (ai) / 22 (glitch) / 15 (droid): it is one of 8 identical `stage:atk+1` self-buffs and the only one whose owners cannot use it. Singularity is fine (160 5×5 + pull, 2AP CD2 = Black Hole's shape at proper 100MP).
**Changes.**
- REWRITE `raceOvercalculate`: self buff, T2 50MP 1AP, rng 0: **INT (M ATK) +1 stage and M DEF +1 stage** (`stage:int+1,mdef+1`; was `stage:atk+1`). "Run the numbers again. Then again." Same tier/cost; now it is for the units that own it. SKEPTIC: there is no AWR stage in the engine (stage keys are atk/def/mdef/spd/int — Nordic Accord's "M ATK" is `int+1`), so the AWR half is replaced with M DEF.
- REWRITE `raceRecursiveLoop`: 125 magic, rng 3 → **rng 4**, replace dead `bonusVsDebuffed` with **finisher Marked ×1.5** (187 on a Marked target). This is the first Marked payoff in the game — it also turns Knife Throw, Red Eyes, Implant, Dead Eye and Demonic Claw teammates into setup for an AI.
- REWRITE `racePredictiveModel`: T1 25MP 1AP, rng 4, single: keep **Marked 3**, add **−1 M DEF stage** (`stage:mdef-1`) so the row does something on its own turn (Psychosis T2 is mdef −1 alone at 50MP; at T1 with Marked it is the family's real T1).
**Additions.** None — the ladder is 1/1/1/1 and every rung is now doing a job.
**Upgrades.** Exploit on Recursive Loop (×2 vs Marked) is the family's whole build; Efficient on Singularity; Undertow on Singularity is redundant (it already pulls) — do not offer it. Lingering on Predictive Model (Marked 4). No family-scoped upgrade needed.

### 💻 Computer Hacking Skills `computerhacking` — VERDICT: KEEP (cut the twin, add the T4)
**Identity.** The Jammed engine: jam the target (setup), stun/shield to control the fight, then crash every jammed enemy in an area. Flavour: exploits, blue screens, firewalls.
**Races.** Fit: ai, android, glitch, droid — all tech, all rungs consistent (Crash Loop, Memory Leak, Blue Screen, System Analysis, Firewall Protocol are rungs). No misfits; no missing race (men in black's hacking is Spy Gear/Deep State).
**Now.**
- T1 Crash Loop `raceCrashLoop` · 100 magic single rng 3, finisher Jammed ×1.5.
- T2 Memory Leak `raceMemoryLeak` · Jammed 2, rng 3.
- T2 System Analysis `raceSystemAnalysis` · Scanner 2, rng 5.
- T3 Blue Screen `raceBlueScreen` · Stun 1, rng 3, **2AP**, no damage.
- T3 Firewall Protocol `raceFirewallProtocol` · 120 shield to allies in a 3×3, rng 3, **2AP**.
- T3 Neural Hack `raceNeuralHack` · Jammed 1, rng 3, 75MP.
**Problems.** Neural Hack (T3, Jammed 1) is strictly worse than Memory Leak (T2, Jammed 2) — same role, higher tier, shorter status. Blue Screen costs 2AP and 75MP for a Stun 1 with no damage while Taser (Police T2, 50MP, 1AP, CD2) does 70 + Stun 1 and Stun Ray (Alien T1) does 100 + Stun 1. Firewall Protocol at 2AP/T3 for 120 is worse than Luminous Shield (Light T2, 1AP, 140). Scanner has no payoff anywhere (synergy.md) so System Analysis is a 50MP nothing. No T4: the family sets Jammed twice and never cashes it in an area.
**Changes.**
- DELETE `raceNeuralHack` (Memory Leak covers it). Android rung 3 `raceNeuralHack` → `raceBlueScreen`.
- REWRITE `raceSystemAnalysis`: rng 5, Scanner 2 **plus −1 M DEF stage**; "Every port open, every weakness listed." Now the caster's setup for Crash Loop / Recursive Loop / System Crash.
- REWRITE `raceBlueScreen`: **1AP**, CD2, rng 4, **80 magic** + Stun 1. Matches Taser's price point one tier up with range and damage.
- RECOST `raceFirewallProtocol`: 2AP → **1AP**, shield 120 → **150** (T3 3×3 shield sits between Luminous Shield T2 140 r0 and Overtinker T4 160 r2).
**Additions.**
- NEW **System Crash** — T4, damage/aoe, −/magic, 100MP 1AP CD2, rng 4, aoe r1 (3×3), **150** magic, **finisher Jammed ×1.5**, every Jammed enemy hit is also Staggered 1. "Fatal exception. Everything running on them stops." The area payoff for Memory Leak / EMP Burst / EMP Grenade / Deneuralizer — a hacking team's finisher, and the T4 the family lacks.
**Upgrades.** Exploit on Crash Loop and System Crash (Jammed ×2). Widen on System Crash is the 5×5 — do not add a separate spell. Lingering on Memory Leak (Jammed 3). Do not offer Blast on Blue Screen (an area stun is Eternal Slumber territory — the game's only one, a T4 160 5×5 at 2AP CD2).

### 🛜 Internet Addiction `internetaddiction` — VERDICT: GROW (3 spells + 1 passive)
**Identity.** Discord-based mind debuff for the two people who never log off: make the enemy furious, disappear down a rabbit hole, then get them ratio'd. Flavour: doomscrolling, rage bait, the comments section.
**Races.** ai (pool 10 — tied third-smallest with mad scientist, anubis, mothman and door agent) and conspiracy theorist (pool 9 — smallest after fortune teller). Both need rows; both are the only two units whose lore is "online 24/7". Fit is real, nobody else belongs (glitch is a rendering error, not a poster). Keep both.
**Now.** Empty (registry only).
**Problems.** Zero spells on two of the thinnest pools in the game (9 and 10; only fortune teller is thinner). The theme is thin but distinct — no other family does "discord as a mind-game" outside Sonic/Psychic, and neither race has movement (summary.md: ai and conspiracy theorist both "missing movement").
**Changes.** None to existing rows.
**Additions.**
- NEW **Doomscroll** — T1, effect/debuff, psychic, 25MP 1AP, rng 4, single: **Discord 2** (−2 ATK / −1 DEF). "They read the comments. All of them." Setup for Ratio'd and for every Discord payoff a teammate carries (Migraine, Vehicular Manslaughter, Bull Rush, Depth Charge, Requiem, Prophecy of Disaster).
- NEW **Rabbit Hole** — T2, movement/teleport, −, 50MP 1AP, rng 3, single, teleportDistance 3. "Three hours later you are somewhere else entirely." Gives both races the movement they lack.
- NEW **Ratio'd** — T3, damage/damage, psychic/magic, 75MP 1AP, rng 4, single, **125**, **finisher Discord ×1.5**, and the target loses 1 more ATK stage. "The whole internet piles on." The in-family payoff — Doomscroll then Ratio'd is a self-contained 187 chain.
- PASSIVE: new family passive **Terminally Online** (T1, 1 SP, hook `statBonus: { awr: 14, mp: 40 }`): +14 AWR and +40 max MP at build. "Never logs off." A caster-economy row for the two MP-hungry owners. SKEPTIC: `regenPerRound` is "% max HP regenerated each round end" (data.js hook registry) and there is no per-round MP-regen hook, so the MP half is a flat max-MP bonus instead — `statBonus` lists `mp` as a legal key.
**Upgrades.** Exploit on Ratio'd (Discord ×2); Lingering on Doomscroll (Discord 3); Long Reach on Rabbit Hole. No Blast — keep it single-target so it stays a sniper-debuffer kit, not a second Sonic.

### 🦾 Robotic Hardware `robot` — VERDICT: KEEP (Machinery stays as the hydraulics shelf, the melee punches merge THERE, split the two nukes)
**Identity.** The chassis: hit hard from the frame, overclock an ally, self-repair, and dump the reactor in a self-centered nuke — physical (Kill Mode) for the tanks, magic + Jammed (EMP Burst) for the AI platforms.
**Races.** Fit: robot, android, cyborg, droid, honda civic (a sedan that "undergoes rapid mechanical transformation into a bipedal combat platform" — hardware; rung `raceRoboPunch`). No misfit. Missing: mech is a piloted vehicle, not a robot — leave him on Weapons/Mecha.
**Now.** (`overclock`/`raceOverclock`, `empBurst`/`raceEmpPulse`, `raceChassisSlam`/`raceChassisSlan` are aliases — 7 real rows.)
- T1 Rocket Fist `raceRocketFist` · 100 physical, rng 3, push 2.
- T1 Synthetic Punch `raceHydraulicPunch` · 100 physical, rng 1, push 2, finisher Jammed ×1.5.
- T2 Overclock `overclock` · ally Overclock 2 (ATK +1, MOV +1), rng 3.
- T2 Self-Repair Protocol `raceSelfRepairProtocol` · self heal 35%, cleanse 1.
- T3 Robo Punch `raceRoboPunch` · 135 physical rng 1, finisher Stagger ×1.5.
- T4 EMP Burst `empBurst` · 160 lightning/magic self-aoe r2, Jammed 1, 1AP CD2.
- T4 Kill Mode `raceChassisSlam` · 160 metal/physical self-aoe r2, 2AP, no status.
**Problems.** Two T1 punches at 100/push 2 differ only by range vs a Jammed finisher. Robo Punch (T3 135 rng 1 stagger-finisher) and Machinery's Hydraulic Crush (T3 135 rng 1 jammed-finisher) are the same row on the same races. Kill Mode is EMP Burst with a worse damage type for the casters, no status, and 2AP — dominated. Self-Repair (35% + cleanse 1, T2) is under Adrenaline Rush (Human Grit T2: 55% + SPD +1 + cleanse 2). Robot has **50 MP**: every T4 here costs 100 and robot's rung 4 is Kill Mode — a rung it can never cast; honda civic (90 MP) can't either. In-family the only Jammed payoff is Synthetic Punch (Robo Punch cashes Stagger), but across robot's three families there are four Jammed payoffs (Synthetic Punch, Hydraulic Crush, Synthetic Blade, Taser Bolt) and no Jammed setup below a 100MP T4 — EMP Burst (fixed on the Weapons side: Taser Bolt).
**Changes.**
- ~~MERGE `raceHydraulicPunch` (Synthetic Punch) into `raceRocketFist`~~ — STRUCK (skeptic): the fold below would leave robot AND honda civic with 2 families (rule b). Instead: MOVE `raceHydraulicPunch` → `machinery` and RENAME "Synthetic Punch" → **"Hydraulic Punch"** (the id already says so); row unchanged (T1 25MP 1AP, 100 physical, rng 1, push 2, finisher Jammed ×1.5). Rocket Fist stays as written (T1, 100 physical, rng 3, push 2, no finisher — the ranged twin; the melee Jammed payoff now lives on the Machinery shelf, so they are no longer the same row in the same family). Cyborg rung 1 `raceHydraulicPunch` → `raceRocketFist` (cyborg does not own Machinery).
- ~~MOVE `raceHydraulicCrush` → `robot`~~ — STRUCK (same reason). `raceHydraulicCrush` STAYS in `machinery`; MERGE `raceRoboPunch` into it there: Hydraulic Crush = T3 75MP 1AP, 135 metal/physical, rng 1, single, **finisher Jammed OR Stagger ×1.5** (`bonusVsStatus.status` takes an array — ai.js `_bonusVsMatches` does `[].concat(bvs.status)`). DELETE `raceRoboPunch` from `robot`. Honda civic rung 3 `[raceRoboPunch, raceNitroBoost]` → `[raceHydraulicCrush, raceNitroBoost]` (civic owns Machinery); robot rung 3 unchanged. Android/droid/cyborg lose Robo Punch — each keeps at least two other T3s (Blue Screen/Firewall/Plasma Cannon; 5G Tower; Plasma Cannon).
- REWRITE `raceChassisSlam` Kill Mode (stays in `robot`): T4 100MP **1AP CD2**, rng 0, self-aoe r2, 160 metal/physical, **Stagger 1** on everything hit (mirror of EMP Burst: physical + Stagger for robot/cyborg/civic, magic + Jammed for android/droid). Sets up Hydraulic Crush.
- RECOST `raceSelfRepairProtocol`: 35% → **45%**, cleanse 1 → 2.
- PASSIVE: new family passive **Backup Battery** (T1, 1 SP, hook `statBonus: { mp: 50 }`): +50 max MP at build. SKEPTIC: the "regenerate 15 MP" version could never fire robot's T4 — end-of-round MP regen is clamped to `maxMp` (battle.js 8517 `u.mp = Math.min(u.maxMp, ...)`) and `regenPerRound` is a % max-HP hook, so a 50-MP robot stays at 50 forever. A flat +50 max MP (a legal `statBonus` key) lifts robot to 100 and makes Kill Mode castable once a match; civic 90 → 140, cyborg 100 → 150.
**Additions.** None — the Hardware ladder is now T1 Rocket Fist · T2 Overclock, Self-Repair · T4 EMP Burst, Kill Mode (5 rows + Backup Battery). It has no T3: the frame's T3 melee is Machinery's Hydraulic Crush, which every heavy chassis that would want it (robot, civic) owns; android/droid/cyborg are Hacking/Engineering/Weapons casters at T3 and never took Robo Punch over Plasma Cannon or Blue Screen.
**Upgrades.** Knockback on Rocket Fist (push 3); Widen is meaningless on self-aoe r2 (already 5×5) — exclude EMP Burst / Kill Mode from Widen; Efficient on both T4s matters more here than anywhere (robot's MP). Overclock takes Lingering (3 rounds). Exploit on Hydraulic Crush moves to the Machinery entry.

### 🤖 Robotic Weapons `cyberpunkweapons` — VERDICT: KEEP (make Taser Bolt the setup, let To the Moon fire)
**Identity.** The arsenal bolted onto the frame: blade, taser, rocket rack, arm cannon, and the one-shot moonshot. Physical/fire damage kit for the metal bruisers; pairs with Hardware's Jammed finishers.
**Races.** Fit: robot, android, mech ("piloted bipedal combat vehicle" — weapons yes, hardware no), cyborg (rungs Cluster Rockets, Plasma Cannon, To the Moon). No misfit. Missing: none (honda civic's guns are Driving's Vehicular Manslaughter).
**Now.**
- T1 Synthetic Blade `raceSyntheticBlade` · 100 physical rng 1, DEF −1, finisher Jammed ×1.5.
- T1 Taser Bolt `raceTaserBolt` · 80 lightning/magic rng 3, finisher Jammed ×1.5.
- T2 Cluster Rockets `raceClusterRockets` · 110 fire/magic 3×3 rng 4, Stagger 1.
- T3 Plasma Cannon `racePlasmaCannon` · 130 fire/magic line w2 rng 4, Burn 1.
- T4 To the Moon `raceRocketToss` · 150 physical skyThrow rng 1, +25/level, carry 6, collision +50, **requiresFlight**.
**Problems.** Two T1 Jammed finishers and — across Hardware + Weapons + Machinery — FOUR Jammed payoffs on robot (Synthetic Punch, Hydraulic Crush, Synthetic Blade, Taser Bolt; Robo Punch is the Stagger one) with zero Jammed setup below a 100MP T4 (synergy.md: robot's "self-contained" list is an illusion; the setups are all EMP Burst). Taser Bolt is 80 magic on robot (INT 3) and mech (INT 30) — it does nothing for 3 of 4 owners. To the Moon requires flight on four races none of which fly; it is cyborg's rung 4 and needs a Jetpack gear slot to exist. Cluster Rockets is a Dynamite twin (110 3×3 Stagger 1 at T2) — fine, it is the family's area.
**Changes.**
- REWRITE `raceTaserBolt`: T1, 25MP, rng 3, **70 lightning/magic + Jammed 1** (drop the finisher). "Two prongs into the housing. Systems stutter." The whole metal line now has a 1AP setup for Synthetic Blade / Hydraulic Punch / Hydraulic Crush / Railgun (Rocket Fist keeps no finisher — see Hardware/Machinery).
- REWRITE `raceRocketToss` To the Moon: **remove `requiresFlight`** — the caster's own rockets carry them (carryHeight 6 stays), 150 + fall + collision 50, rng 1, 100MP 1AP. Cyborg's rung 4 becomes castable on the ground.
- RECOST `racePlasmaCannon`: 130 → **125** for the 2-wide line (T3 area house 125; it is the only w2 line at T3 in the game).
**Additions.** None — ladder 2/1/1/1 with a setup, a melee payoff, an area, a line and a flagship.
**Upgrades.** Blast on Synthetic Blade (3×3 on a Jammed target = the family's melee splash); Long Reach on Plasma Cannon; Knockback on Cluster Rockets; Lingering on Taser Bolt (Jammed 2). Exclude To the Moon from Blast/Forked (skyThrow does not split).

### ⚙️ Machinery `machinery` — VERDICT: KEEP (the hydraulics shelf; the delete was VOID)
**Identity.** Pistons and hydraulics: the melee of the two frames that are all hardware and no software — a piston punch that cashes Jammed, a crush that cashes Jammed or Stagger.
**Races.** robot, honda civic — both also on `robot`. SKEPTIC: FAMILY_DELETE was struck because robot's families are Hardware + Machinery + Weapons and civic's are Driving + Hardware + Machinery; dropping Machinery leaves BOTH at 2 families (rule b floor is 3), and no other shelf passes the yeti test for a 2001 sedan. Rule 2 says a small family is fine.
**Now.**
- T3 Hydraulic Crush `raceHydraulicCrush` · 135 metal/physical rng 1, finisher Jammed ×1.5.
**Problems.** A 1-spell family that duplicates Robo Punch (same tier, same 135, same range) on the same units, with no T1 entry point.
**Changes.**
- MOVE `raceHydraulicPunch` (Synthetic Punch → renamed **"Hydraulic Punch"**) from `robot` → `machinery`, row unchanged: T1 25MP 1AP, 100 physical, rng 1, single, push 2, finisher Jammed ×1.5. The family's T1 entry point; it stops being Rocket Fist's melee twin because it no longer sits beside it.
- MERGE `raceRoboPunch` into `raceHydraulicCrush` (here): T3 75MP 1AP, 135 metal/physical, rng 1, single, **finisher Jammed OR Stagger ×1.5** (array `status`, engine-supported). Robot rung 3 stays `raceHydraulicCrush`; civic rung 3 → `[raceHydraulicCrush, raceNitroBoost]`.
- Ladder: T1 Hydraulic Punch · T3 Hydraulic Crush (2 rows). Robot pool 13 → 13 (Hardware 5 + Backup Battery + Machinery 2 + Weapons 5); civic 13 → 13 (Driving 5 + Hardware 5 + Backup Battery + Machinery 2).
**Additions.** None — Kill Mode (Stagger) and Taser Bolt (Jammed) already set up both finishers on the same races; a T2/T4 here would only repeat Hardware's.
**Upgrades.** Exploit on Hydraulic Crush (×2 vs Jammed/Stagger — the frame's whole melee build); Knockback on Hydraulic Punch (push 3); Blast on Hydraulic Punch is the melee splash.

### 🛠️ Engineering `engineering` — VERDICT: KEEP (one turret, not two)
**Identity.** The contraption support: repair allies, drop turrets and a jamming tower, then shield the whole workshop. Deployable-economy family — Surplus/Overclocked turret upgrades are its second half.
**Races.** Fit: droid ("classified as equipment"; rungs System Analysis/Firewall are Hacking but Engineering fits an AI platform that maintains itself), gnome ("engineering exceeding human technology by 200–300 years"; rungs Clockwork Turret, Overtinker). Missing: mad scientist builds machines but has Unethical Science for it; honda civic is a car, not a mechanic. Keep as is.
**Now.**
- T1 Repair `repair` · heal 155 single, rng 2.
- T2 Deploy Turret `deployTurret` · turret 110 dmg/round (end of round), hp 60, range 3, **max 2**.
- T3 5G Tower `fiveGTower` · aura r4: enemies −8 M DEF, 3 hits to kill, max 1.
- T3 Clockwork Turret `raceClockworkTurret` · turret 65 dmg, hp 80, range 3, max 1.
- T4 Overtinker `raceOvertinker` · 160 shield to allies + contraptions in self 5×5, **2AP**.
**Problems.** Clockwork Turret (T3, 75MP, one turret at 65) is dominated by Deploy Turret (T2, 50MP, two turrets at 110 each) — the only thing it adds is +20 turret HP, which is exactly what an upgrade is for (rule 4). Overtinker is the only T4 area shield in the game, and it and Firewall Protocol (fixed above) are the only two of the nine aoeShield rows that cost 2AP — the other seven (Astral Barrier, Pupil Shield, Holy Bulwark 160, Shield Maiden, Light Shield 220, Luminous Shield, Tinker's Contraption) are all 1AP; Holy Bulwark already gives 160 for 1AP at T2. (The T4 team-buff peer Nordic Accord is 1AP; Hallelujah, the T4 heal-all, is 2AP; Iron Dome is a T3 DEF buff, not a shield.)
**Changes.**
- DELETE `raceClockworkTurret` (Deploy Turret + Overclocked turret / Surplus upgrades cover it). Gnome rung 3 `raceClockworkTurret` → `fiveGTower`.
- RECOST `raceOvertinker`: 2AP → **1AP**, add CD2.
- RECOST `deployTurret`: turret hp 60 → **80** (inherit Clockwork's one virtue).
**Additions.** None. Ladder T1 Repair · T2 Deploy Turret · T3 5G Tower · T4 Overtinker; a 4-row support family with a clear job. (Trap Making's shield row is deleted rather than moved here — see below — because droid would otherwise hold three area shields.)
**Upgrades.** Overclocked turret and Surplus on Deploy Turret are the family's core; Surplus on 5G Tower (max 2) is strong but fair at 1 SP; Efficient on Repair. The Training passive Tinker (+1 turret range, Repair +20%) already exists — no family passive needed.

### 🪤 Trap Making `trapmaking` — VERDICT: GROW (a real trap ladder)
**Identity.** Hidden ground: place things the enemy cannot see and make them walk into them. Control by denial — stun, splash, drop, pit.
**Races.** Fit: gnome ("booby-trap personal spaces with alarming creativity"), goblin ("rig the ground they stand on"; rung Trapdoor). No misfit; no missing race (mad scientist has Tesla Coil in Hidden Tech).
**Now.**
- T2 Lucid Trap `raceLucidTrap` · 25MP (off-ladder), stun 1 on first enemy to step, rng 3, hp 1, max 1.
- T2 Tinker's Contraption `raceTinkersContraption` · 100 shield, aoe r0 (one tile), rng 3.
- T3 Trapdoor `raceTrapdoor` · hidden 2×2, 60 physical + 2-level fall, Stagger 1, rng 4, max 1.
**Problems.** Tinker's Contraption is not a trap (identity drift) and is worse than Fortify (Military T1: 96 shield single at 25MP) at twice the cost — it is a gnome rung only because the family needed a T2. Lucid Trap costs 25MP at T2 (off the ladder) and its text ("dream snare… you're still dreaming") is Dream Predation flavour, not a gnome's. No T1, no T4.
**Changes.**
- DELETE `raceTinkersContraption` (Fortify/Luminous Shield/Overtinker cover shields; not a trap). Gnome rung 2 `raceTinkersContraption` → `raceScrapMine` (the new T2 below — a rung-2 default should be a T2 row, and Spring Snare becomes T1).
- RETIER + RENAME `raceLucidTrap` T2 → **T1** (25MP as it already costs), "Lucid Trap" → **"Spring Snare"**: hidden, first enemy to step on it is Stunned 1; same placement rules. "Clockwork jaws under the leaves."
**Additions.**
- NEW **Scrap Mine** `raceScrapMine` — T2, deploy/deployObject, fire/physical, 50MP 1AP, rng 3, blast r1, hidden, max 2 per caster, hp 20: triggers on step for **100** physical in a 3×3 and **Stagger 1**. "Nails, powder, a spring. Cheap." The damage trap (Tesla Coil is the shock version in Hidden Tech at T1 with 3 charges; this hits harder, staggers, and gives goblin its Stagger setup for No Mercy/Body Check).
- NEW **Deathtrap** — T4, deploy/placeTrap, −/physical, 100MP 1AP, rng 4, hidden 3×3, max 1: the first enemy to enter drops the whole 3×3 two levels — **120** physical + fall to everyone inside, **Rooted 2** (they are in a pit). "Do not stand anywhere." The room-sized Trapdoor; combos with Gravity Crush / Undertow teammates who push enemies onto it.
- Ladder: T1 Spring Snare · T2 Scrap Mine · T3 Trapdoor · T4 Deathtrap.
**Upgrades.** Surplus on Scrap Mine and Spring Snare (+1 deployable); Lingering on Spring Snare (Stun 2 — strong, gate at 1 SP is fine because the enemy chooses to step); Widen on Trapdoor is nonsense (fixed 2×2) — exclude. Family-scoped upgrade worth adding: **Tripwire** (1 SP, `families: ['trapmaking']`): traps trigger on enemies passing ADJACENT to them, not only on the tile.

### ✦ Hidden Technology `advancedtechnology` — VERDICT: KEEP (fill the empty middle)
**Identity.** Black-project hardware: jam a target's head, refuel the squad, drop a coil, then fire the weapon that does not officially exist. Jammed setup → Jammed payoff, shared by the five humans who know too much.
**Races.** Fit: mad scientist (rung Tesla Coil), men in black ("alien-derived technology and neurological suppression devices"; rungs Deneuralizer, Classified Weapon), conspiracy theorist ("encyclopedic knowledge of classified programs"), astronaut ("a railgun that was classified before it was built"; rung Railgun), professor (borderline — "things he read about once and should not have understood"; keep, he needs the T4s since Occult has no T3). No missing race.
**Now.**
- T1 Deneuralizer `raceDeneuralizer` · Jammed 2, rng 3.
- T1 Free Energy `freeEnergy` · restores MP to ALL allies, rng 0 — no amount on the row.
- T1 Tesla Coil `raceTeslaTrap` · coil, 3×3 shock on step, max 3, hp 20 — no damage number on the row.
- T4 Classified Weapon `raceClassifiedWeapon` · 180 lightning/magic single rng 4, finisher Jammed ×1.5.
- T4 Railgun `railgun` · 160 metal/physical line w1 rng 5, ignores DEF, finisher Jammed ×1.5.
**Problems.** 3/0/0/2: nothing between 25MP and 100MP. Free Energy is a team-wide MP restore at T1/25MP with no listed amount — as written it is either useless or the best row in the game. Tesla Coil's shock damage is likewise unlisted. The two T4s are fine as a pair (magic single for the casters, armour-piercing physical line for MIB/astronaut), and both cash Deneuralizer.
**Changes.**
- RETIER `freeEnergy` T1 → **T2** (50MP) and pin the number: **restores 40 MP to every ally**. Half the cost back to a 4-unit team is a fair T2.
- RECOST `raceTeslaTrap`: pin the shock at **80** lightning/magic in the 3×3 (T1 area house), keep 3 charges.
**Additions.**
- NEW **Blue Beam** — T3, damageEffect/aoe, light/magic, 75MP 1AP, rng 5, aoe r1 (3×3), **125** magic, **Discord 1**. "Holograms in the sky. Half of them panic; the other half kneel." The family's area row and the conspiracy theorist's own name-drop; Discord feeds Ratio'd / Migraine / Vehicular Manslaughter teammates.
- Ladder: T1 Deneuralizer, Tesla Coil · T2 Free Energy · T3 Blue Beam · T4 Classified Weapon, Railgun (6).
**Upgrades.** Exploit on Classified Weapon and Railgun (Jammed ×2 — with Deneuralizer the family is a 1AP→T4 chain); Long Reach on Railgun; Surplus on Tesla Coil (4 coils); Widen on Blue Beam. Do not offer Efficient on Free Energy (it would pay for itself).

### 🔬 Unethical Science `unethicalscience` — VERDICT: KEEP (add the T1)
**Identity.** The lab: a decoy that draws fire, a creation that clubs, a serum that turns an ally into a monster, and a pandemic. Summoner/support with one poison nuke.
**Races.** mad scientist only (rungs 2, 3, 4 live here) — rule 2 says that is fine, and nobody else's lore is "200+ safety violations". Keep unique in practice; no RACE_ADD.
**Now.**
- T2 Cloning Machine `raceCloneDecoy` · decoy, hp 100, adjacent, max 1.
- T2 Summon Creation `raceSummonCreation` · summon: move 3, 90 dmg, 4 hits (physical count half), max 1.
- T3 Monster Serum `raceMonsterSerum` · ally: +1 ATK/DEF/M DEF/SPD, +1 reach, +25% max HP, no spells, 3 rounds.
- T4 Plandemic `racePlandemic` · 160 poison/magic 3×3 rng 4, Poison 3, 1AP.
**Problems.** No T1 — the scientist's first rung is Tesla Coil (Hidden Tech). Two T2 deployables is not redundancy (decoy vs attacker) and the rungs offer them as a pair. Monster Serum's `monster` status has no payoff, but it is a buff and does not need one. Plandemic 160 3×3 + Poison 3 at 1AP is at the top of T4 area house; acceptable for a race with ATK 12.
**Changes.** None to existing rows.
**Additions.**
- NEW **Vivisection** — T1, damageEffect/damage, poison/magic, 25MP 1AP, rng 2, single, **100** magic, **Grievous 2** (healing halved). "For science. Hold still." Gives the scientist a T1 in his own family and an anti-heal debuff nobody else on the space faction has; Grievous currently has 2 setups and no payoff, which is fine for a pure denial status.
**Upgrades.** Surplus on Summon Creation (two creations) is the build; Widen on Plandemic; Lingering on Monster Serum (4 rounds). Exclude Cloning Machine from Overclocked turret (it is not a turret).

### 🧪 Chemistry Knowldege `chemistry` — VERDICT: GROW + RENAME → "Chemistry"
**Identity.** Beakers: acid that strips armour, an antidote, the corroding concoction, and the chain reaction that detonates Burn AND Poison. The one family whose status counts for both elemental payoff pools.
**Races.** mad scientist (rung Chemical Concoction) and professor (rung Chemical Concoction; "four doctorates") — both fit; both are flagged "missing sustain" in summary.md, which the T2 fixes. No missing race (black goo / symbiote are biology, not chemistry).
**Now.**
- T3 Chemical Concoction `raceOvercharge` · 110 poison/magic 3×3 rng 3, Corroded 2 (= Burn + Poison for every payoff).
**Problems.** One spell, typo'd family name, and Corroded is set here and cashed nowhere in the family (synergy.md: PAYOFF 0). 110 is under the T3 area house (125).
**Changes.**
- FAMILY_RENAME `chemistry` "Chemistry Knowldege" → **"Chemistry"**.
- RECOST `raceOvercharge`: 110 → **125** (T3 area house).
**Additions.**
- NEW **Acid Flask** — T1, damageEffect/damage, poison/magic, 25MP 1AP, rng 3, single, **100**, **−1 DEF stage**. "It eats the plate first." The T1 damage row; softens for the physical teammates the scientist deploys (Creation, Monster Serum ally).
- NEW **Antidote** — T2, heal/heal, −, 50MP 1AP, rng 3, single: heal **140** and cleanse 2 debuffs. "Drink it before it stops fizzing." Sustain for two races that have none.
- NEW **Chain Reaction** — T4, damage/aoe, fire/magic, 100MP 1AP CD2, rng 4, aoe r2 (5×5), **140**, **finisher Burn or Poison ×1.5** (Corroded counts). "One spark. The whole table goes." Pays off Concoction in-family and every Burn (21 setups) and Poison (15 setups) row on the team — the most team-friendly finisher in the slice.
- Ladder: T1 Acid Flask · T2 Antidote · T3 Chemical Concoction · T4 Chain Reaction.
**Upgrades.** Exploit on Chain Reaction (×2 vs Burn/Poison — deliberately the strongest exploit in the game because it needs a 2-cast setup); Lingering on Concoction (Corroded 3); Blast on Acid Flask. Exclude Widen from Chain Reaction (already 5×5).

### 👽 Alien Weapons `alientechnology` — VERDICT: KEEP (retier the stun, rewrite the whip, add the T4, drop the goo)
**Identity.** Ray guns: burn at range, stun, shrink, whip, disintegrate. The extraterrestrial sidearm kit — a ranged control/damage family for the aliens and the humans who took their toys.
**Races.** Fit: martian ("natural affinity for energy weapon discharge"; rung Heat Ray, Shrink Ray), men in black (alien-derived tech), barbarella ("directed-energy sidearms and a plasma-whip"; rungs Stun Ray, Plasma Whip). Misfit: **black goo** — an amorphous organism that absorbs matter; its rungs are all Ooze/Poison and a puddle does not hold a ray gun (yeti test fails). RACE_REMOVE black goo — but SKEPTIC: Ooze + Poison alone is 2 families (rule b floor is 3), so pair it with RACE_ADD black goo → `symbiosis` (Symbiote Armor regen, Symbiotic Drain, Tendril Strike): symbiote's own lore says its organism is "of the same biological class as Subject: BLACK GOO", and an amorphous mass that "absorbs organic and inorganic material on contact" is a drain/tendril body, not a ray gun (g6 rebuilds Symbiosis as a living-suit ladder; it is not flagged UNIQUE, so a second owner breaks nothing). Pool 16 → 14 (Ooze 6 + Poison 5 + Symbiosis 3). **nordic** — "benevolent" telepathic support with none of its rungs here; heat rays and stun rays are the wrong shelf. RACE_SWAP nordic: Alien Weapons → UFO Features (see UFO). Missing: none.
**Now.** (`raceLavaLamp` is an alias of `racePlasmaWhip` — 5 real rows.)
- T1 Heat Ray `raceHeatRay` · 100 fire/physical rng 5, Burn 2.
- T1 Photon Scatter `racePhotonScatter` · 80 magic self-aoe r2 (5×5).
- T1 Stun Ray `raceStunRay` · 100 lightning/magic rng 4, **Stun 1**.
- T3 Plasma Whip `racePlasmaWhip` · 125 fire/physical rng 2, Burn 2.
- T3 Shrink Ray `sharedShrinkRay` · Minimize 3, rng 4.
**Problems.** Stun Ray at T1/25MP does 100 + Stun 1 with no cooldown; Taser (T2, 50MP, CD2) does 70 + Stun 1 and Blue Screen (T3) stuns for 2AP — Stun Ray is the most over-tuned T1 in the slice. Plasma Whip is Heat Ray at T3: same Burn 2, +25 damage, −3 range, +50MP — dominated. No T2, no T4; Minimize has no payoff anywhere.
**Changes.**
- RETIER `raceStunRay` T1 → **T2** (50MP), add CD2; keep 100 + Stun 1, rng 4. Barbarella rung 1 `raceStunRay` → `raceHeatRay`.
- REWRITE `racePlasmaWhip`: T3, 125 fire/physical, **line w1, rng 3** (the whip cracks through every enemy in the lane), Burn 2. "It reaches further than it should and burns where it lands." Now a different shape from Heat Ray.
- MOVE `raceGravityBoots` (from the deleted Astronaut Camp) → `alientechnology` as its T2 movement row, unchanged (teleport 3, 50MP). Barbarella's lore lists "anti-gravity propulsion" beside her sidearms; her rung 2 stays valid. CONTINGENT on the Astronaut Camp delete standing (it needs g8's RACE_ADD barbarella → Spy Gear for her 3-family floor — see that entry); if it is void, Gravity Boots stays put and this ladder is 6 rows.
**Additions.**
- NEW **Disintegrator** — T4, damage/damage, lightning/magic, 100MP 1AP, rng 4, single, **180**, **finisher Stun or Minimize ×1.5**. "There is no body to recover." The in-family payoff for Stun Ray and Shrink Ray; Minimize finally has a reason to exist.
- Ladder: T1 Heat Ray, Photon Scatter · T2 Stun Ray, Gravity Boots · T3 Plasma Whip, Shrink Ray · T4 Disintegrator (7).
**Upgrades.** Exploit on Disintegrator; Long Reach on Plasma Whip; Blast on Heat Ray (the Burn splash); Lingering on Shrink Ray. Exclude Photon Scatter from Widen (self-aoe r2 already).

### 🛸 UFO Features `ufo` — VERDICT: KEEP (give Marked a payoff, separate the two T4s)
**Identity.** The saucer: probe, implant, tractor-beam, then the sky fills with craft. Mothership control kit — pull-and-drop plus two very different 5×5 finishers.
**Races.** Fit: grey ("primary species involved in civilian abduction events… mastery of gravitational manipulation"; all four rungs here), martian (rungs Low Gravity, War of the Worlds). Add: **nordic** (RACE_SWAP from Alien Weapons — "the mothership is watching", Pleiadian craft; abduction/tractor beams and low gravity are mothership tech, ray guns are not). No misfit.
**Now.**
- T1 Probe `raceProbe` · 100 psychic/magic single rng 4.
- T2 Implant `raceImplant` · Marked 3, rng 3.
- T2 Low Gravity `sharedLowGravity` · 3×3 zone 3 rounds: +2 jump, no fall damage, both teams.
- T3 Abduction Beam `raceAbductionBeam` · 110 light/magic skyThrow rng 4, +25/level, carry 5, collision +50.
- T4 Crop Circle `raceCropCircle` · 160 nature/magic 5×5 rng 4, 1AP CD2, ground −2/−1.
- T4 War of the Worlds `raceWarOfTheWorlds` · 160 metal/magic 5×5 rng 4, 2AP, "aoe r2/round".
**Problems.** Marked has no payoff (synergy.md) — Implant is a 50MP nothing on grey's rung 2. Two T4s that are both 160 in a 5×5 at rng 4; War of the Worlds costs 2AP for the same number with no deform, and the "/round" on its area is either a per-round zone (then 160/round is far past house) or a dead notation. Probe is a plain 100 (house, but the flagship T1 of the abduction race says nothing).
**Changes.**
- REWRITE `raceImplant`: Marked 3 **+ −1 M DEF stage**, rng 4. "It is behind the ear. It is always transmitting."
- REWRITE `raceAbductionBeam`: keep 110 + fall + collision, add **finisher Marked ×1.5** ("the implant guides the beam"). Implant → Abduction is now a self-contained 165+fall chain on grey's own rungs.
- REWRITE `raceWarOfTheWorlds`: make the "/round" real and price it — **zone, 2 rounds: 100 metal/magic to every enemy in the 5×5 at the end of each round** (200 over two rounds), rng 4, 100MP 2AP CD2. "No one would have believed it." Distinct from Crop Circle's instant 160 + crater.
- RECOST `raceProbe`: add **Scanner 2** on hit (System Analysis' status: the target is inspected) — free flavour, no balance cost.
**Additions.** None — 1/2/1/2 with every rung doing a distinct thing (single, mark, zone, throw, crater, strafe).
**Upgrades.** Exploit on Abduction Beam (Marked ×2); Undertow on Crop Circle (pull into the crater); Efficient on War of the Worlds. Exclude Widen from both T4s (already 5×5) and Forked/Blast from Abduction Beam (skyThrow).

### 👱🏻 Galactic Federation Protocol `galacticfederation` — VERDICT: GROW (a heal at T1, a price on the beacon)
**Identity.** Pleiadian support: regeneration pylon, stasis, and the accord that lifts the whole team's mind. The nordic's reason to exist on a team — sustain + control + group buff.
**Races.** nordic only (rungs Stasis Beam, Nordic Accord; rung 2 Light Shield `racePleiadianShield` lives in Light — fine). Unique in practice; nobody else is Pleiadian.
**Now.**
- T1 Federation Beacon `raceFederationBeacon` · pylon, hp 70, aura r4: 40 HP regen to each ally at the start of their turn, max 1.
- T3 Stasis Beam `raceStasisBeam` · Stun 1 + grounds flyers, rng 4, no damage.
- T4 Nordic Accord `raceNordicAccord` · all allies +1 M DEF, +1 M ATK stage, 1AP.
**Problems.** Beacon is a permanent 40 HP/round team aura for 25MP at T1 — Tidal Blessing (Water T2, 50MP) is a 2-round zone heal, Temporal Tide (T3) heals 100/turn for 2 turns in a 3×3. Beacon is destructible (hp 70) but it is still under-priced by a tier. Stasis Beam is a 75MP stun with no damage (Stun Ray does 100 + Stun 1 at T2 after retier; Blue Screen gets 80 after rewrite). No T2 in the ladder.
**Changes.**
- RETIER `raceFederationBeacon` T1 → **T2** (50MP), keep 40 HP regen r4, hp 70. Nordic rungs unchanged (rung 1 is Aurora Ray).
- REWRITE `raceStasisBeam`: T3, add **80 light/magic damage** to the Stun 1 + groundsFlyers, rng 4, CD2. "Held in the light. Held."
**Additions.**
- NEW **Pleiadian Touch** — T1, heal/heal, light, 25MP 1AP, rng 3, single: heal **130**, cleanse 1. "A hand on the shoulder. The wound remembers being whole." Nordic (M ATK 88, support class) has one heal in a pool of 16 — this is the T1 the family needs and the rung-1 alternative for a healer build.
- Ladder: T1 Pleiadian Touch · T2 Federation Beacon · T3 Stasis Beam · T4 Nordic Accord.
**Upgrades.** Surplus on Federation Beacon (two pylons — strong, 1 SP is the right gate); Lingering on Stasis Beam (Stun 2) — allow, it is the nordic's only hard control; Efficient on Nordic Accord. Grace (Training) already boosts Pleiadian Touch.

### 👨‍🚀 Astronaut Camp `astronautcamp` — VERDICT: DELETE (the one row moves to Alien Weapons)
**Identity.** None: a single teleport shared by two races who already own the same teleport elsewhere or can hold it in a better-fitting family.
**Races.** barbarella, astronaut.
**Now.**
- T2 Gravity Boots `raceGravityBoots` · teleport 3, rng 3, 50MP.
**Problems.** Identical to Phase Walk (Cosmic T2, teleport 3, 50MP) — and astronaut is on Cosmic. A 1-spell family named for one race's day job holding only a generic reposition.
**Changes.**
- MOVE `raceGravityBoots` → `alientechnology` (barbarella's "anti-gravity propulsion"; see Alien Weapons). Barbarella rung 2 stays `raceGravityBoots`.
- Astronaut rung 2 `raceGravityBoots` → `racePhaseWalk` (Cosmic, same effect).
- FAMILY_DELETE `astronautcamp`; RACE_REMOVE barbarella, astronaut. Astronaut pool 21 → 20 (Hidden Tech + Cosmic + Athleticism = 3, fine); barbarella 11 → 12 (Alien Weapons grows by two). SKEPTIC — CONTINGENT: barbarella's families are Alien Weapons + Seduction + Astronaut Camp, so this delete alone leaves her at 2 (rule b). It stands only because g8 proposes RACE_ADD barbarella → `spygear` ("deep-space reconnaissance … HONEY TRAP RISK"), which restores the floor (Alien Weapons + Seduction + Spy Gear). If g8's add does not land, this FAMILY_DELETE is VOID: Astronaut Camp stays with Gravity Boots as its one T2 row, the MOVE of `raceGravityBoots` to `alientechnology` is cancelled (a spell sits in one family), and Alien Weapons' ladder is 6 rows with Stun Ray as its only T2.
**Additions.** None.
**Upgrades.** n/a.

### 🪐 Cosmic Abilities `cosmic` — VERDICT: KEEP (fix the four nukes, drop the starfish)
**Identity.** Gravity and stars: pull, slow, ground flyers, then detonate a 5×5. The magic-area family of the space faction and the Slow engine for Star Decree / Judgment / Tidal Slam teammates.
**Races.** Fit: orb of light (Category OMEGA psionic; rung Supernova), annunaki (ancient astronauts; rungs Gravity Well, Gravity Crush, Star Decree), cosmic wraith (exotic matter outside spacetime; rungs Entropic Beam, Phase Walk, Nebula, Heat Death), watcher (rung Cosmic Sight), astronaut (rungs Gravity Well, Gravity Crush), antihero (human/alien; rung Cosmic Slam), superhero (human/alien, Project CAPE; no rung here but Cosmic Slam is the physical row for him — keep, borderline). Misfit: **starfish** — a walking echinoderm from Atlantis; "starfish" is a pun, not a cosmology (yeti test fails), none of its rungs are here. RACE_REMOVE starfish (pool 27 → 16 on Water 8 + Deep Sea 5 + Healing 3 — the smallest of the five healer-class pools after priest 25, mermaid 23, nun 22, angel 21, but still a full kit with 5 heal rows; today 11 of its 27 rows are cosmic nukes a healer never casts). Missing: none.
**Now.**
- T1 Entropic Beam `raceEntropicBeam` · 100 magic line w1 rng 4, DEF −1, finisher Slow ×1.5.
- T1 Gravity Well `raceGravityWell` · 80 arcane/magic 3×3 rng 4, pull, Slow 1, grounds flyers.
- T2 Cosmic Sight `raceCosmicSight` · scan, rng 6 (desc says "within 4 tiles").
- T2 Phase Walk `racePhaseWalk` · teleport 3.
- T3 Cosmic Slam `raceCosmicSlam` · 125 physical, rng 0 aoe r1, Stagger 1, deform, **2AP**; dead field `selfCenter`.
- T3 Gravity Crush `sharedGravityCrush` · 3×3 zone 3 rounds: no jumps, flyers grounded, falls ×3.
- T3 Nebula `sharedNebula` · **135 magic 5×5** rng 4, Burn 2, 2AP CD2 — at 75MP.
- T4 Black Hole `sharedBlackHole` · 160 shadow/magic 5×5, pull, Slow 1, grounds flyers, **75MP** 2AP CD2.
- T4 Heat Death `raceHeatDeath` · **180** magic 3×3, Slow 1, zone 2 turns, 2AP.
- T4 Star Decree `raceStarDecree` · 160 light/magic 3×3 delayed 1 turn, finisher Slow ×1.5, 1AP.
- T4 Supernova `raceSupernova` · 170 light/magic self-aoe r2, DEF −1, 2AP.
**Problems.** Entropic Beam at T1 is a 100 line + DEF −1 + a finisher for 1AP — Judgment Beam (Temporal) is the same row and charges 2AP; Psychic Beam (100 line + Discord) is the ceiling for a T1 line. Nebula is a T4 (5×5 135 + Burn 2) sold at 75MP; its text says "goes SUPERNOVA" while Supernova is the orb's actual T4. Black Hole is off the ladder (75MP for a 160 5×5). Heat Death says "everything inside takes HEAVY damage" for 2 turns with dmg 180 — if the zone ticks, that is 360; if not, the zone is decoration. Cosmic Slam carries a dead `selfCenter` and costs 2AP for 125 (Fee Fi Fo Fum, Titan T3, is 125 self-3×3 + Stagger at 1AP). Cosmic Sight's range (6) and text (4) disagree. Four 5×5 nukes (Nebula, Black Hole, Supernova, Singularity on the AI side) blur into each other.
**Changes.**
- REWRITE `raceEntropicBeam`: 100 → **90**, drop `stage:def-1`, keep finisher Slow ×1.5, 1AP. Still the best T1 line for a Slow team, no longer three effects for 25MP.
- RECOST `raceCosmicSlam`: 2AP → **1AP**; REMOVE the dead `selfCenter` field — the row is already rng 0 / aoe r1, i.e. a self-centred 3×3, so the field adds nothing. Final row: T3 75MP 1AP, 125 physical, rng 0, aoe r1, Stagger 1, terrainDeform center −1.
- REWRITE `sharedNebula`: T3, 75MP, **3×3 (aoe r1), 125**, Burn 2, **1AP** CD2; new text: "Birth a star and let it burn — MEDIUM magic damage in a 3×3, everything the starfire touches keeps burning." Loses the supernova line (that is the orb's row).
- RECOST `sharedBlackHole`: 75MP → **100MP** (ladder). Keep everything else — pull + Slow + grounds flyers at 160 5×5 is the correct T4.
- REWRITE `raceHeatDeath`: make the zone real and priced — **3×3 zone, 2 rounds, 90 magic to every enemy inside at the end of each round** (180 total), Slow 1 on entry, 100MP 2AP. "Nothing inside gets warmer again."
- RECOST `raceCosmicSight`: rng 6 → **4** to match the text ("within 4 tiles"); the text stays as written. A T2 50MP scan at rng 4 is the price of Cryptid Vanish-class utility; rng 6 was the outlier.
**Additions.** None — 11 rows on 7 races is already the biggest discipline in the slice; the fixes above make Nebula (T3 3×3 burn), Black Hole (T4 pull nuke), Heat Death (T4 zone), Star Decree (T4 delayed Slow-payoff), Supernova (T4 self-nuke) five different spells instead of four of the same.
**Upgrades.** Widen on Nebula is the family's 5×5 (that is why Nebula shrinks); Exploit on Star Decree (Slow ×2 — Gravity Well/Black Hole set it in-family); Lingering on Gravity Crush (4 rounds); Efficient on Supernova. Exclude Undertow from Gravity Well/Black Hole (they pull already) and Widen from Black Hole/Supernova (already 5×5).

### ⏳ Temporal Abilities `temporal` — VERDICT: KEEP (make it actually temporal; keep the cult leader for the floor, add the atlantean)
**Identity.** Time as a weapon: thicken it (Slow), skip a frame (Stagger), trade places, rewind an ally's wounds, then hit with a paradox. The Slow/Stagger setup family for the time faction.
**Races.** Fit: glitch ("exists simultaneously across multiple probability states"; rung Time Rewind), cosmic wraith ("partially exists outside conventional spacetime"), watcher ("maintains awareness of all temporal streams simultaneously"; rungs Judgment Beam, Temporal Shift, Reality Pulse), rabbit ("a watch that runs in both directions… arrive before they are sent for"; rung Time Rewind). Misfit: **cult leader** — robes, candles, Bohemian Grove; nothing in the lore touches time and his only rung here (Judgment Beam) is a laser. Yeti test fails — but ~~RACE_REMOVE cult leader; rung 1 → `heal1`~~ is STRUCK (skeptic): g2 already RACE_REMOVEs him from Healing Magic (so `heal1` would be outside his families) and FAMILY_DELETEs Persuasion, leaving Cult of Personality + Temporal + Meditation as his three floor families (g2 counts his pool that way). Cult of Personality has no T1 (Kool-Aid T2 / Indoctrinate T3 / Gathering T4) and Meditation has none either, so Judgment Beam is his only rung-1 candidate. He stays; the rewritten Judgment Beam (a Slow line) is at least carried by "an entourage that arrives before it is called for". Revisit only if g3's RACE_ADD cult leader → Black Magic lands and gives him a T1 there. Missing: **atlantean** — "innate manipulation of localized temporal fields", rung Temporal Tide; the g1 auditor already proposes RACE_SWAP atlantean Ice → Temporal. RACE_ADD atlantean here (agree).
**Now.**
- T1 Judgment Beam `raceJudgmentBeam` · 100 magic line w1 rng 5, DEF −1, **2AP**.
- T3 Temporal Shift `raceTemporalShift` · swap with target, rng 3.
- T4 Reality Pulse `raceRealityPulse` · **170** magic 3×3 rng 4, Discord 1, 1AP.
- T4 Time Rewind `raceTimeRewind` · 160 psychic/magic single rng 4, no rider.
**Problems.** Nothing here is temporal: a laser, a swap, a generic area, a plain single. Judgment Beam is Entropic Beam at 2AP. Temporal Shift (T3 swap) is the same row as Miracle (T2 swap + heal) and Dimensional Fold (Fractal T1 swap rng 5). Reality Pulse at 170 + Discord for 1AP is above the T4 area house (160; Crow Storm is 160 + Discord 2 at 1AP). "Time Rewind" is the family's best name and it is on a plain 160 single with no rider — not in synergy.md's under-tuned list (that list stops at 125), but every other rider-less T4 single in the game sits at 180 (Dragon Slash, Ancient Magic, Flat Earth, Jurassic Jaw, Ape Fury…). No T2. Three of five owners (glitch, watcher, cosmic wraith) are flagged "missing sustain".
**Changes.**
- REWRITE `raceJudgmentBeam`: T1, 25MP **1AP**, rng 5, line w1, **90** magic, **Slow 1** (drop DEF −1). "The Watcher decides how long a second lasts." Slow feeds Entropic Beam / Star Decree / Paradox.
- RETIER `raceTemporalShift` T3 → **T2** (50MP), rng 3 → 4. Watcher rung 3 → `raceTimeRewindHeal` (the new T3 heal below — NOT `raceTimeRewind`, which keeps its id and becomes the T4 Paradox).
- RECOST `raceRealityPulse`: 170 → **160**, Discord 1 → **2** (Crow Storm's shape, time-flavoured).
- RENAME `raceTimeRewind` "Time Rewind" → **"Paradox"** and REWRITE: T4, 180 psychic/magic single rng 4, **finisher Slow or Stagger ×1.5**. "You were never standing there." Glitch rung 4 and rabbit rung 4 keep the id.
**Additions.**
- NEW **Stutter** — T2, effect/debuff, −, 50MP 1AP, rng 4, single: **Stagger 1 + Slow 1**. "They drop a frame." Stagger has 16 payoffs game-wide and Slow 8 — the best pure setup row in the slice, and the rabbit's assassin partner.
- NEW **Time Rewind** `raceTimeRewindHeal` — T3, heal/heal, −, 75MP 1AP, rng 3, single: heal **40% max HP** and cleanse 99 ("restore them to the moment before"). Sustain for glitch/watcher/wraith/atlantean; the family's rung 3 for the watcher.
- Ladder: T1 Judgment Beam · T2 Temporal Shift, Stutter · T3 Time Rewind · T4 Reality Pulse, Paradox (6).
**Upgrades.** Exploit on Paradox (Stagger/Slow ×2 — Stutter + Paradox is a self-contained 2-cast kill line); Lingering on Stutter; Long Reach on Temporal Shift. Exclude Blast from Paradox (keep the single-target identity; Reality Pulse is the area).

### ✦ Fractal Pattern Recognition `fractal` — VERDICT: KEEP (add the T2)
**Identity.** Geometry as a weapon: fold space to swap, stitch a line through every elevation, split a beam into self-similar needles. Arcane line/ricochet damage for the impossible-topology aliens.
**Races.** Fit: machine elves ("geometric humanoid constructs of impossible topology", passive Fractal Mind), voidweaver ("reality-anchored webs… between dimensional layers"; rung Fractal Needle), mantid (rungs Fractal Stitch, Fractal Needle; "compound visual organs… near-omnidirectional" — pattern recognition is a stretch but its rungs live here; keep). No missing race.
**Now.**
- T1 Dimensional Fold `raceDimensionalFold` · swap with target, rng 5, 25MP.
- T3 Fractal Stitch `raceFractalStitch` · 130 arcane/magic line w1 rng 5, hits every elevation.
- T4 Fractal Needle `raceFractalNeedle` · 170 arcane/magic single rng 4, splitBeam to nearby enemies, finisher Stun ×1.5; desc says "All Enemies in a line".
**Problems.** No T2. Dimensional Fold is a swap at T1 rng 5 while Temporal Shift/Skin Swap charge T3 and Miracle T2 — too cheap for a rng-5 reposition of an enemy. Fractal Needle's text ("All Enemies in a line") contradicts the row (single + split). Fractal Stitch 130 for a line at T3 is right at house.
**Changes.**
- RECOST `raceDimensionalFold`: rng 5 → **3** (keep T1/25MP; the family's identity utility, priced by range).
- REWRITE `raceFractalNeedle` text only: "HEAVY magic damage to one enemy; the needle splits and seeks up to two more within 2 tiles for half. Bonus damage to Stunned targets." Row unchanged (170, splitBeam, finisher stun).
**Additions.**
- ~~NEW **Recursive Cut** (100 single + one ×0.5 bounce)~~ — STRUCK (skeptic, rule d): a plain 100 single with a baked-in bounce is exactly the Ricochet upgrade (2 SP, bounce ×0.5) on a plain T2; an upgrade is not a spell. Replaced by:
- NEW **Strange Loop** `raceStrangeLoop` — T2, damageEffect/damage, arcane/magic, 50MP 1AP CD2, rng 4, single: **70** magic + **Stun 1**. "The pattern closes on itself. They cannot find the way out." Taser's exact T2 shape (70 + Stun 1, CD2) in arcane, and the family's own setup for Fractal Needle's Stun finisher — mantid and voidweaver have no other Stun in their pools, so Strange Loop → Fractal Needle becomes a self-contained 255 chain.
- Ladder: T1 Dimensional Fold · T2 Strange Loop · T3 Fractal Stitch · T4 Fractal Needle.
**Upgrades.** Long Reach on Strange Loop; Forked on Fractal Stitch; Exploit on Fractal Needle (Stun ×2 — Strange Loop sets it in-family, Ego Death on machine elves too). Exclude Lingering from Strange Loop (a 70-damage Stun 2 at T2 would out-control Blue Screen) and Blast from Fractal Needle (splitBeam already splashes).

### 🔷 Prism Lattice `prismlattice` — VERDICT: KEEP (add the T4)
**Identity.** The board-control puzzle: fold prisms, connect beams, tune the frequency, pulse — the only build-your-own-map family in the game. Reward scales with placement, not with a number on the row.
**Races.** Fit: machine elves (rungs Prism Mirror, Pulse Lattice, Tune Frequency), crystal guardian ("split light into weapons"; rung Prism Mirror). No misfit; nobody else is made of glass.
**Now.**
- T1 Mirror Blink `raceMirrorBlink` · teleport 3, 25MP.
- T1 Prism Mirror `racePrismMirror` · place a prism (up to 8), never ends the turn; beams sear and burn at end of round; 2 hits to shatter.
- T2 Pulse Lattice `racePulseLattice` · discharge the lattice (3+ prisms), volume bonus at 4+/8, 2AP CD2.
- T3 Tune Frequency `raceTuneFrequency` · shift all beams: Infrared (burn) / Ultraviolet (DEF shred) / Gamma (slow), CD1.
**Problems.** No T4 — the family builds up for three tiers and never spends the board. Tune Frequency at 75MP for a mode switch is the price of a T3 nuke, but it changes every beam on the map — acceptable. Mirror Blink is a T1 teleport 3 (Phase Walk charges T2) — justified because the lattice needs the caster inside it.
**Changes.** None to existing rows.
**Additions.**
- NEW **Shatter the Lattice** — T4, damage/aoe, arcane/magic, 100MP 2AP CD2, rng 0, self: every standing prism you own detonates in a 3×3 around itself for **80** magic in the current frequency (with its status: Burn 2 / DEF −1 / Slow 1), then the prisms are destroyed. "Eight panes. One note." A placement-scaled finisher (8 prisms = eight 3×3 blasts) that ends the build and forces the choice between pulsing again and cashing out.
- Ladder: T1 Mirror Blink, Prism Mirror · T2 Pulse Lattice · T3 Tune Frequency · T4 Shatter the Lattice.
**Upgrades.** Surplus on Prism Mirror (9 prisms) and Efficient on Pulse Lattice are the natural picks; Lingering on Tune Frequency is meaningless (no duration) — exclude. Family-scoped upgrade worth creating: **Tempered Glass** (1 SP, `families: ['prismlattice']`): prisms take 3 hits to shatter instead of 2.

### 🚀 Mech Pilot Skills `mecha` — VERDICT: GROW (real siege mode, a T4, and the Megazord pilot)
**Identity.** The cockpit: indirect fire through cover, lock the frame down for range, punch out when the coolant goes, and — at the top — fire everything at once.
**Races.** mech (rungs Mortar Salvo, Siege Mode, Eject!, then Military's Nuke). Missing: **super sentai** — "Megazord Blast" is his T4 and a Megazord is a piloted mech; pool 13 on Sentai 6 + Martial Arts 4 + Teamwork 3. RACE_ADD super sentai. (Honda civic pilots itself — Driving covers it.)
**Now.**
- T1 Mortar Salvo `raceMortarSalvo` · **100** physical 3×3 rng 5, ignores line of sight.
- T2 Siege Mode `raceSiegeMode` · self ATK +1 stage (one of 8 identical rows).
- T3 Eject! `raceEject` · escape teleport 3, 75MP (Shed Skin, Trickery T2, is teleport 2 + decoy + cleanse at 50MP).
**Problems.** Mortar Salvo is a 100 3×3 through cover at T1/25MP — the T1 area house is ~80 and the summary flags it (T1 aoe ≥100 list; Skyscraper Toss does 125 for the same shape at T3). Siege Mode is a name with no siege in it. Eject! is a T2 escape at T3 price. No T4 (mech's rung 4 borrows Nuke).
**Changes.**
- RECOST `raceMortarSalvo`: 100 → **80**, keep ignoresLineOfSight (the through-cover is the point).
- REWRITE `raceSiegeMode`: self, 50MP 1AP: for 3 rounds **+1 ATK stage, +2 RNG, −2 MOV** (a real lock-down, the same shape as Sedan's Transform). "Anchors down. Everything in range is a target."
- REWRITE `raceEject`: T3, 75MP: teleport 3 away **+ cleanse 99 + heal 20% max HP** ("the frame auto-repairs while the pilot is out"). Now a T3 escape-and-reset, the sustain mech lacks.
**Additions.**
- NEW **Full Burst** — T4, damage/aoe, −/physical, 100MP 2AP CD2, rng 5, aoe r2 (5×5), **150** physical, ignores line of sight. "Every hardpoint on the frame, at once." The in-family T4 (Nuke is delayed and magic; this is instant, physical, and needs no spotter).
- Ladder: T1 Mortar Salvo · T2 Siege Mode · T3 Eject! · T4 Full Burst.
**Upgrades.** Widen on Mortar Salvo (5×5 through cover at T1+2SP is the mech's real trick); Long Reach on Mortar Salvo; Efficient on Full Burst. Exclude Widen from Full Burst (already 5×5).

### ✇ Driving Skills `drivingskills` — VERDICT: KEEP (make the T4 a drive-through, give Nitro a job)
**Identity.** Vehicle combat: ram, gas the block, stand up into combat mode, nitro, and run everyone over. Stagger/Discord setup into a line finisher.
**Races.** Fit: honda civic (rungs Ram Charge, Transform/Exhaust Cloud, Nitro Boost, Vehicular Manslaughter), police officer (a cruiser: Ram Charge, Exhaust Cloud, Nitro, Vehicular Manslaughter all read as pursuit driving). Transform ("Car ⇄ Mecha") is a civic mechanic on a shared family — flagged, not moved (see Problems). No missing race.
**Now.**
- T1 Ram Charge `raceRamCharge` · dash, 100 physical, Stagger 1, rng 3.
- T2 Exhaust Cloud `raceExhaustCloud` · self 3×3 zone 2 turns, Discord 1.
- T2 Transform `raceTransform` · Car ⇄ Mecha: −3 SPD, +1 DEF, +2 M DEF stages, +2 RNG, until re-cast.
- T3 Nitro Boost `raceNitroBoost` · self SPD +1 stage, 75MP.
- T4 Vehicular Manslaughter `raceMissileBarrage` · 160 physical 3×3 rng 4, finisher Discord ×1.5, 2AP.
**Problems.** Nitro Boost at T3/75MP for one SPD stage is under Adrenaline Rush (T2: 55% heal + SPD +1). Vehicular Manslaughter (id `raceMissileBarrage`) is a generic 3×3 (one of the four identical 160 T4 areas in summary.md) with a name that describes a car driving through people. Transform makes no sense for a police officer on foot; it is the civic's identity row living in a shared family — it works because the row is self-targeted and the officer simply never takes it, but it is the one row here that fails the yeti test for its co-owner.
**Changes.**
- REWRITE `raceNitroBoost`: T3, 75MP 1AP, self: **Overclock 2** (ATK +1, MOV +1) **+ SPD +1 stage**. "Floor it." The pre-charge buff for Ram Charge / Vehicular Manslaughter.
- REWRITE `raceMissileBarrage` Vehicular Manslaughter: T4, 100MP **1AP**, damage/dash **line w1 rng 4**: the caster drives through every enemy along the line for **160** physical, **finisher Discord ×1.5**, and ends on the far tile. "It was an accident. Four times." Exhaust Cloud → Manslaughter is the in-family chain; the shape is now the car's.
- REWRITE `raceTransform` description only: "Stand up into the combat platform (the civic's mecha; a cruiser's riot rig) — −3 SPD, +1 DEF and +2 M DEF stages, +2 RNG — or fold back down." Numbers unchanged; the text stops assuming a Honda.
**Additions.** None — 1/2/1/1 and every row has a distinct job.
**Upgrades.** Knockback on Ram Charge; Lingering on Exhaust Cloud (3 turns); Exploit on Vehicular Manslaughter (Discord ×2); Long Reach on the new line T4. Exclude Blast/Widen from Manslaughter (a line dash does not splash).

SPELL COUNT: 86 → 100 for this group (plus 2 new family passives: Terminally Online, Backup Battery). Skeptic recount: the auditor's 99 assumed Synthetic Punch merged away; it now MOVES to Machinery instead (+1). Strange Loop replaces Recursive Cut one-for-one. If the Astronaut Camp contingency fails, the count is unchanged (Gravity Boots moves or stays — one row either way).
