### 🔫 Gun Training `weaponstraining` — VERDICT: KEEP (trim 8 → 6)
**Identity.** The shared sidearm/long-arm kit of every gun-carrying human: reliable single-target bullets, one ammo buff, one team reload — the "weapon" family the specialist families (Cowboy, Police, Marksmanship, Street Smarts) build on.
**Races.** cowboy ✓ (firearms specialist), marksman ✓, general ✓ (a sidearm is standard issue), gangster ✓ ("small-arms proficiency is exceptional"), police officer ✓ (service pistol), sheriff ✓ (the revolver). Nobody misfits. Not adding anyone: men in black / astronaut carry ray guns and railguns (Alien Weapons / Hidden Technology), Robin Hood carries a bow.
**Now.**
- T1 Double Pump `doubleShot` · 2 hits × 60 physical, rng 3; rider `markedSecondHitBonus: 3` (+3 dmg on hit 2 vs Marked).
- T2 Impact Round `riderImpactRound` · 90 physical single rng 4, 50 % splash to adjacent enemies.
- T2 Incendiary Rounds `raceIncendiaryRounds` · self buff 2 rounds: every landed basic attack applies Burn 2.
- T2 Ricochet `ricochet1` · 100 physical single rng 3, then bounces to nearby enemies.
- T2 Scatter Shot `riderScatterShot` · 64 physical to 3 random enemies in rng 4.
- T3 Crossfire `crossfire` · 125 physical, cross r2 centred on the CASTER (rng 0).
- T4 Dead Eye `deadEye` · 180 physical single rng 4, applies Marked 2 (bonusDamage 40), `guaranteedCrit: true`.
- T4 Extended Clips `raceExtendedClips` · aura r3, allies get Extended Clips 3 rounds (+1 basic-attack range, +1 ATK stage).
**Problems.**
- Four T2 rows, three of which are "one bullet plus a spread gimmick": Impact Round IS the shipped **Blast** upgrade (3×3 ×0.5 on a single hit), Ricochet IS the shipped **Ricochet** upgrade (bounce ×0.5). Keeping them as rows wastes two slots on what a 2-SP upgrade on Double Pump / Dead Eye already gives.
- Dead Eye's "Always lands a critical hit" is a dead field (`guaranteedCrit` is in SPELL_DEAD_FIELDS; battle.js never reads it) — the card lies. What Dead Eye REALLY does is the Mark: Marked is consumed by the next physical hit from any ally for +40 flat (battle.js `_markedBonus`) and pierces invisibility/cryptid hiding. Nothing in the card says so.
- Double Pump's `markedSecondHitBonus: 3` is a +3-damage rider — a rounding error dressed up as "Hits harder on Marked targets". And any physical hit already eats the Mark for +40, so the first pellet consumes it before the second one can "hit harder".
- Crossfire is a self-centred X (rng 0, r2) — the exact shape of Blade Waltz (swordsmanship T3 125 cross r2 rng 0). A gunner standing still and shooting four directions is a sword move with a bullet skin; a gun cross should be fired AT a tile.
- Scatter Shot (3 × 64 = 192 spread over random enemies at T2) is the only T2 damage left once the two upgrade-clones go; it is fine as the "no aim" row but its description should say what "no aim" buys (it does not need line of sight to the extra victims — make that true).
**Changes.**
- DELETE `riderImpactRound` (Blast upgrade on Double Pump or Dead Eye covers it exactly; nobody's rung).
- DELETE `ricochet1` (Ricochet upgrade covers it; nobody's rung).
- REWRITE `doubleShot`: drop `markedSecondHitBonus`; desc "Two barrels, no waiting. Deals MEDIUM physical damage to a Single Enemy across 2 hits." Keep 2 × 60, rng 3, 25 MP.
- REWRITE `deadEye`: drop `guaranteedCrit`; raise the Mark's `bonusDamage` 40 → 60 and duration 2 → 3; desc "One breath, one shot. Deals HEAVY physical damage to a Single Enemy and Marks them for 3 rounds: the next physical hit any ally lands on them deals +60, and a Marked target cannot hide." (Now it is an honest T4 setup piece for the whole gun team, not a fake crit.)
- REWRITE `crossfire`: rng 0 → 4, cross r2 → r1 centred on the target tile (Fallen Grace's shape, rng 4 cross r1), 125 physical, 75 MP 1 AP; desc "Two shooters' worth of lead on one crossing. Deals MEDIUM physical damage to every enemy on the X around the target."
- REWRITE `riderScatterShot`: add `ignoresLineOfSight: true` for the random targets; desc "Point it that way and pull. WEAK physical damage to 3 random enemies within 4 tiles — no aim, no line of sight needed."
**Additions.** None — the family reads T1 Double Pump · T2 Incendiary Rounds + Scatter Shot · T3 Crossfire · T4 Dead Eye + Extended Clips. Six rows, every one with a different job (burst, ammo buff, spray, area, mark, team reload).
**Upgrades.** Blast and Ricochet on Double Pump / Dead Eye are the family's splash and bounce — never re-add them as rows. Forked on Scatter Shot is pointless (it already multi-targets) — mark `riderScatterShot` `upgrades: ['upDamage','upReach','upEfficient']`. Lingering on Incendiary Rounds and Extended Clips is the right buy. New family-scoped upgrade **Armor-Piercing** (2 SP, `families: ['weaponstraining']`, `requires: 'singleDmg'`, `patch: { ignoreArmor: true }`) — turns Double Pump or Dead Eye into a DEF-ignoring shot without another spell.

### 🎯 Marksmanship `marksmanship` — VERDICT: GROW (3 → 4 + 1 passive)
**Identity.** Precision at long range: pin the target (Root), then punish it (Precision Shot), then end it (Take Aim's delayed execute). The family that makes "root" a team currency.
**Races.** marksman ✓, robinhood ✓ ("confirmed split-arrow shots at 200 m"), quarterback ✓ borderline but his lore is literally "inhuman accuracy to 80+ meters" — keep. annunaki ✗ — ancient astronauts whose "Technology [is] indistinguishable from magic"; nothing in the lore aims a weapon, and the race already carries 27 spells. cosmic wraith ✗ — a dark-energy spectre that "returns only coordinates"; not a shooter, 26 spells already. REMOVE both. ADD cowboy ("preternatural accuracy at range … they never miss twice") and sheriff ("keeps the peace at range") — both are the yeti-test opposite: they are DEFINED by aiming. Cowboy needs it anyway once Long Rifle moves here (his rung `raceQuickDraw`).
**Now.**
- T1 Kneecap Shot `kneecapShot` · 80 physical rng 5, Root 1.
- T3 Precision Shot `precisionShot` · 125 physical rng 5, ×1.5 vs Rooted.
- T4 Take Aim `headshot` · 180 physical rng 5, ignores DEF, ×1.5 vs Stun, hit lands at end of round while visible, executes ≤ 15 % HP.
**Problems.**
- No T2. Meanwhile Hunting Skills holds Long Rifle `raceQuickDraw` (T3, 125 plain, rng 5 — flagged in synergy.md as an under-tuned T3 with no rider) which is a marksmanship spell wearing a hunting badge and duplicates Precision Shot's role at the same tier.
- Take Aim's stun payoff needs a teammate for marksman/robinhood/quarterback (synergy.md: all three "need teammate: Take Aim(stun)"); the family's own currency is Root. Fine as a team hook, but the card should also pay the family's own status.
- The id `raceQuickDraw` is named "Long Rifle" while the cowboy's inherent passive is Quickdraw — confusing; the id stays (rungs reference it), the name is right.
**Changes.**
- MOVE `raceQuickDraw` (Long Rifle) huntingskills → marksmanship; RETIER T3 → T2 (50 MP), dmg 125 → 110 (SKEPTIC: 130 at T2 broke THE TIER RULE — ≥120 must be T3+; 110 sits at the T2 single bar beside Sword Beam 100); desc "Shoulder the long rifle. Deals MEDIUM physical damage to a Single Enemy up to 5 tiles away." (Cowboy's rung stays legal because cowboy joins Marksmanship.)
- REWRITE `headshot`: `bonusVsStatus: { status: ['stun', 'root'], mult: 1.5 }` — the family's own Kneecap Shot now feeds its own capstone; the stun hook stays for police/politician teammates.
- RACE_REMOVE annunaki, cosmic wraith; RACE_ADD cowboy, sheriff.
- PASSIVE: new family passive **Overwatch** (T1, `hooks: { basicAttackRangeBonus: 1, statBonus: { awr: 14 } }`) — "A longer barrel and a sharper eye: basic attacks reach 1 tile further, +14 AWR." Gives the four gun races a passive that is theirs instead of only Gear. (SKEPTIC: the marksman's inherent Longshot already reaches any visible enemy, so for him Overwatch is the +14 AWR; the range tile is for cowboy / sheriff / robinhood / quarterback. Both hook keys exist in data.js's hook registry.)
**Additions.** None beyond the move and the passive: T1 Kneecap Shot · T2 Long Rifle · T3 Precision Shot · T4 Take Aim (+ Overwatch).
**Upgrades.** Exploit on Precision Shot (×2 vs Rooted) and on Take Aim is the family's power buy. Long Reach on Kneecap Shot (rng 6) is how a sniper opens. Blast/Forked on Take Aim should be blocked (`upgrades: ['upDamage','upFinisher','upReach','upEfficient']`) — the delayed execute is a single-target contract. Family-scoped **Steady Rest** (1 SP, `families: ['marksmanship']`, `requires: 'singleDmg'`, `patch: { actedTargetBonus: 30 }`) — +30 flat against a target that already acted this round (battle.js reads `actedTargetBonus`); the patient-shooter fantasy without a new row.

### 🏹 Archery `archery` — VERDICT: KEEP (trim 7 → 5)
**Identity.** Robin Hood's quiver: one elemental setup arrow, one powder arrow, two trick arrows (pierce / split), and the volley. Burn is the family's currency (Fire Arrow → Splitting Arrow).
**Races.** robinhood only ✓ — mondo's rule 2 says that is fine, and nobody else in the roster draws a bow (valkraye throws a spear, sheriff/cowboy shoot). Keep single-race.
**Now.**
- T1 Fire Arrow `raceFireArrow` · 80 physical rng 5, Burn 2.
- T1 Poison Arrow `racePoisonArrow` · 80 physical rng 5, Poison 3.
- T2 Bomb Arrow `raceBombArrow` · 80 physical aoe r1 rng 4.
- T2 Green Arrow `sentaiGreenArrow` · heals a single ally MEDIUM, 25 MP (off-ladder), `status:undefined` on the row.
- T3 Piercing Arrow `racePiercingArrow` · 120 physical line, push 2, +60 on collision, both Rooted 1.
- T3 Splitting Arrow `raceSplittingArrow` · 125 physical, bounces (70, r2), ×1.5 vs Burn.
- T4 Arrow Volley `raceArrowRain` · 160 physical aoe r1 rng 6, no rider.
**Problems.**
- Two T1 arrows with the same role (80 + a DoT). Only Burn has an in-family payoff; Poison has none for Robin (his Serrated passive already bleeds every physical hit). Poison Arrow is a colour swap.
- Green Arrow is a Super Sentai leftover (id `sentaiGreenArrow`, a DC-hero pun) — a healing arrow on Robin Hood is identity drift, it is off the MP ladder, and the row carries a broken `status:undefined` entry.
- Arrow Volley sits in summary.md's "T4 160 aoe" redundancy group with Shambling Horde / Marrowstorm / Vehicular Manslaughter, but it is the ODD one out, not a twin: the other three are 2 AP and each carries a finisher (Shambling Horde ×1.5 vs Infected; Marrowstorm aoe r2, ×1.5 vs Poison, ignores DEF, CD 2; Vehicular Manslaughter ×1.5 vs Discord). Arrow Volley is the only 1-AP, rider-less 160 aoe r1 in the game — a plain number. A volley should arc over cover — that is the whole point of a volley, and it is the rider this row lacks.
- Bomb Arrow at 80 is under the T2 area bar (~100) and sits beside Dynamite (T2 110 + Stagger).
**Changes.**
- DELETE `sentaiGreenArrow` (identity drift; Robin has no healer role and never should — a heal belongs to Healing Magic).
- UPGRADE: `racePoisonArrow` becomes a family-scoped upgrade **Poisoned Tips** (1 SP, `families: ['archery']`, `requires: 'dmg'`, `patch: { addStatus: { id: 'poison', duration: 2 } }` — new patch key, adds a status entry to the row) and the row is deleted. Robin's rung `[raceFireArrow, racePoisonArrow]` collapses to `raceFireArrow`.
- REWRITE `raceBombArrow`: dmg 80 → 90, add Burn 1 (fire/physical — a powder charge burns); desc "An arrow with a powder charge lashed to the head. Deals MEDIUM physical damage to All Enemies in a 3×3 and sets them alight for a round." (SKEPTIC: 100 + Burn 1 (24) = 124 tripped THE TIER RULE at T2; 90 + 24 = 114 stays under it and still beats the old 80.) Now the area setup for Splitting Arrow.
- REWRITE `raceArrowRain`: add `ignoresLineOfSight: true`; desc "Loose high and let gravity do the rest. HEAVY physical damage to every enemy in a 3×3 up to 6 tiles away — the arrows come down over any wall."
**Additions.** None: T1 Fire Arrow · T2 Bomb Arrow · T3 Piercing Arrow + Splitting Arrow · T4 Arrow Volley. Five rows, two currencies (Burn, Root), one line, one bounce, one indirect area.
**Upgrades.** Widen on Arrow Volley is the 5×5 rain — never a separate spell. Exploit on Splitting Arrow (×2 vs Burn) with Fire/Bomb Arrow is Robin's self-contained combo. Knockback on Piercing Arrow (push 3) makes the wall-pin reliable. Poisoned Tips (above) is the family's own upgrade.

### 🏕️ Hunting Skills `huntingskills` — VERDICT: KEEP as a 3-tier setup family (4 → 3)
**Identity.** The tracker's craft — hide, snare, hound. A utility family that sets up the shooters (Root feeds Precision Shot; the hound sniffs out invisibles; camouflage is the ambush). It deliberately has no T4: its payoffs live in Marksmanship / Gun Training.
**Races.** cowboy ✓, marksman ✓ ("72+ hours prone observation"), robinhood ✓ (Sherwood). werewolf — STRUCK (SKEPTIC): removing it leaves the werewolf with 2 families (Werewolf Powers + Beast Abilities), below the 3-family floor, and no third family is offered; it stays. The theme holds well enough anyway — a wolf going still in the brush (Camouflage) and running prey into a snare is what a wolf does; Long Rifle leaves the family, so the one row a beast could never use is gone. ADD sheriff ("track anything on foot or horseback and bring it back alive or otherwise").
**Now.**
- T1 Forest Ambush `raceForestAmbush` · self ATK +1 stage (one of eight identical "self atk+1" rows in summary.md).
- T2 Camouflage `camouflage` · self Invisible 1, CD 2.
- T3 Long Rifle `raceQuickDraw` · 125 physical rng 5, plain (→ Marksmanship, see above).
- T3 Whistle `raceWhistle` · summons a Hound (move 4, bites 60 each round end, reveals invisibles within 3, 3 hits), 1 per caster.
**Problems.**
- Forest Ambush is a generic stat buff with a forest name; Camouflage is Invisible for 1 round on a 2-round cooldown — separately they are two weak rows, together they are one ambush.
- Long Rifle is a Marksmanship spell (moved).
- No T1 that does anything a hunter does; no Root source although every shooter on the family pays off Root.
**Changes.**
- MERGE `raceForestAmbush` into `camouflage`: Camouflage becomes T2 50 MP CD 2, self Invisible 1 AND ATK +1 stage; desc "Go still in the brush. Invisible for a round and the next shot comes from ambush: +1 ATK stage." Delete `raceForestAmbush`.
- MOVE `raceQuickDraw` → marksmanship (above).
- REWRITE `raceWhistle` desc last line "One hound per hunter." (it says "per cowboy" on a spell marksman, Robin and the sheriff own).
- RACE_ADD sheriff. (RACE_REMOVE werewolf struck — see Races.)
**Additions.**
- NEW **Snare** (`raceSnare`) — T1, damageEffect/placeTrap, nature/physical, 25 MP 1 AP, rng 3, single tile (Trapdoor's `placeTrap` plumbing — `raceTrapdoor`, `state.traps` + `_revealedTo` — with `trapSize: 1` instead of its 2×2 and no terrain sink; hidden from the enemy, revealed only by the Dowsing Rod's `revealTrapsWithin`), `maxActivePerCaster: 2`; the first enemy to step on it takes 40 physical and is Rooted 2 rounds. (SKEPTIC: the original mixed two plumbings — Lucid Trap's `deployObject` is a VISIBLE object; a hidden snare is a `placeTrap` row, full stop.) "A loop of wire where the game walks. The first thing that steps in it is not going anywhere for 2 rounds." Fills the T1 and hands marksman / robinhood / cowboy (via Marksmanship) their own Root for Precision Shot and Take Aim; Surplus makes it 3 snares.
**Upgrades.** Surplus on Snare and Whistle (2 hounds) is the family's scaling. Lingering on Camouflage (2 rounds invisible + ATK) is the strong buy. Overclocked does not fit (the hound is a summon, not a turret) — block it on `raceWhistle`.

### 🤠 Cowboy Skills `cowboyskills` — VERDICT: GROW (3 → 4)
**Identity.** The frontier duel: close-range revolver spray, a stick of dynamite, the flinch, and the one bullet at noon. Stagger is the currency (Dynamite / Quick Draw → High Noon), Roped (Lasso, Ropework) is the second.
**Races.** cowboy ✓, sheriff ✓. Nobody else — pirate has Piracy, gangster has Street Smarts. Keep two.
**Now.**
- T2 Dynamite `raceDynamite` · 110 physical aoe r1 rng 3, Stagger 1.
- T2 Fan the Hammer `raceFanTheHammer` · 100 physical aoe r1 rng 2.
- T4 High Noon `raceHighNoon` · 180 physical rng 6, 2 AP, ignores LoS (the ricochet trick shot), ×1.5 vs Stagger/Roped, `guaranteedCrit: true`.
**Problems.**
- Two T2 3×3 areas at rng 2–3 (100 vs 110 + Stagger): same role twice; Dynamite is strictly better. Both are the cowboy's rung-2 alternatives.
- No T1, no T3.
- High Noon: "Always a critical hit" is the dead `guaranteedCrit` field (never read). And at 2 AP it is the worst T4 gun in the game on paper — Dead Eye and Take Aim are 180 at 1 AP; the ricochet-through-cover and the ×1.5 do not justify a whole extra AP.
**Changes.**
- RETIER `raceFanTheHammer` T2 → T1 (25 MP) and REWRITE as the point-blank spray: kind `barrage`, self-aoe r1 (every enemy adjacent to the cowboy), dmg 100 → 80, rng 0; desc "Six shots from the hip. WEAK physical damage to every enemy next to you." Now it is the T1 answer to being rushed (neither race has a close-range passive — Point Blank belongs to the marksman and the police officer; cowboy's is Quickdraw, sheriff's is Tin Star — so this row is their only point-blank answer; sheriff's rung `raceFanTheHammer` stays legal).
- RECOST `raceHighNoon` 2 AP → 1 AP (keep 100 MP); drop `guaranteedCrit`; desc "One bullet, fired at noon, bounces off every wall on the map before it finds them. HEAVY physical damage to a Single Enemy through any cover. Deals bonus damage to Staggered or Roped targets."
**Additions.**
- NEW **Slap Leather** (`raceSlapLeather`; SKEPTIC renamed from "Quick Draw" — the cowboy already has an inherent passive named Quickdraw AND an id `raceQuickDraw` that is Long Rifle; a third "quick draw" on one card is the confusion the section itself flagged. "Slap leather" is the frontier verb for drawing.) — T3, damageEffect/damage, metal/physical, 75 MP 1 AP, rng 4, single, 125 physical, Stagger 1, `actedTargetBonus: 30` (+30 vs a target that already acted this round). "Hand hovers, then it doesn't. MEDIUM physical damage to a Single Enemy — they flinch and lose an AP. Hits harder on anyone who already made their move." Fills the T3 and makes High Noon self-contained on a 1-turn setup (Quick Draw → High Noon ×1.5) without needing Lasso.
**Upgrades.** Exploit on High Noon (×2 vs Stagger/Roped) is the duel build. Widen on Dynamite (5×5) is the family's big blast — no separate spell. Long Reach on Fan the Hammer is meaningless (rng 0) — block it. Lingering on Slap Leather does nothing useful (Stagger drains AP on landing) — block it there.

### 👮🏾 Police Training `policetraining` — VERDICT: KEEP (5 → 5 + 1 passive)
**Identity.** The escalation ladder — baton, spray, taser, cuffs, cordon. A hard-control family: every row lands a named status (Stagger, Blind, Stun, Root, Slow) and the capstone locks a block down.
**Races.** police officer ✓, sheriff ✓ (the lore's "bring it back alive" and the sheriff's rung `racePoliceCuffs`). No additions: general is military, MIB is federal. Keep two.
**Now.**
- T1 Nightstick `racePoliceNightstick` · 85 physical rng 1, Stagger 1.
- T2 Pepper Spray `racePoliceSpray` · 45 magic aoe r1 rng 2, Blind 2.
- T2 Taser `racePoliceTaser` · 70 magic rng 3, Stun 1, CD 2.
- T3 Cuffed `racePoliceCuffs` · 60 physical rng 1, Root 2.
- T4 Lockdown `racePoliceLockdown` · 120 physical aoe r1 rng 3, Slow 2.
**Problems.**
- Cuffed at T3 (75 MP) for 60 damage + Root 2 is overpriced: Kneecap Shot is T1 80 + Root 1, Iron Grip is T2 Root 2 (no damage). A T3 row must carry more than a T2 debuff plus a poke.
- Lockdown at 120 is under the T4 area bar (~160) and Slow is the wrong status for "nobody in, nobody out" — Fluoride Water (T3, 125 + Silence 2 on a 3×3) outclasses it a tier lower.
- Blind has no payoff anywhere in the game (synergy.md: PAYOFF NONE) but it is intrinsically strong (50 % miss) — fine, no change.
**Changes.**
- REWRITE `racePoliceCuffs`: dmg 60 → 100, Root 2 + Stagger 1 (getting cuffed costs you the action); desc "Hands behind your back. MEDIUM physical damage to an adjacent enemy, Rooted for 2 rounds and Staggered — they are not going anywhere and they are not doing anything about it." Now a real T3 and a Stagger source for the sheriff's High Noon.
- REWRITE `racePoliceLockdown`: dmg 120 → 150, statuses Root 1 then Slow 2 (both entries); desc "Nobody in, nobody out. The block is cordoned: HEAVY physical damage to every enemy in a 3×3 within 3 tiles; they are Rooted for a round and Slowed for 2 after."
- PASSIVE: new family passive **Ballistic Vest** (T1, `hooks: { armor: 5, healOnceBelowPct: { pct: 30, healPct: 25 } }`) — "Kevlar under the uniform: +5 armor, and once per life the vest takes the round that should have dropped you — the first time you fall under 30% HP you recover 25% of max HP." The police officer's lore item as a row; gives the two law races a durability passive that is theirs. (SKEPTIC: the proposed `armor 5 + damageSoak 5` was a strict subset of the universal Training passive Bulwark — soak 8, armor 5, 30% counter — so it failed rule (d); both hook keys here exist in the registry.)
**Additions.** None — T1 Nightstick · T2 Pepper Spray + Taser · T3 Cuffed · T4 Lockdown (+ Ballistic Vest). Two T2s are fine: one area soft-CC, one single hard-CC on a cooldown.
**Upgrades.** Lingering is the family's upgrade (Taser Stun 2, Cuffed Root 3, Lockdown Slow 3) — that is where the SP should go. Widen on Pepper Spray / Lockdown is the 5×5 cordon. Exploit does not apply (no finishers here — the payoffs are Marksmanship's Take Aim ×1.5 vs Stun and Precision Shot vs Root: police + marksman is a designed pairing). Blast on Taser should be blocked (one target, one pair of prongs).

### 🏙️ Street Smarts `streetsmarts` — VERDICT: GROW (3 → 4; Hit a Lick moves to Thievery)
**Identity.** The corner: intimidation, the roll-up, the choppa. A mobile bruiser-shooter kit — get in the enemy's face and spray the street.
**Races.** gangster only ✓ — his lore is this family line by line. Nobody else fits (the pirate's "improvised weaponry" is Piracy). Keep single-race.
**Now.**
- T2 Drive-By `raceDriveBy` · dash 3 (shoves the line), then a 100 physical shot at the weakest enemy within 3.
- T2 Hit a Lick `raceHitALick` · 60 physical rng 2, steals a Key AND an item (kind `steal`).
- T3 Choppa `raceChoppa` · 110 physical line w1 rng 5.
**Problems.**
- Hit a Lick is a Thievery spell (kind `steal`) sitting in Street Smarts because Thievery had one row — it belongs with Steal from the Rich and the gangster should own Thievery ("Do not let them near your pockets").
- Choppa at 110 is under the T3 line bar (~125); Sword Beam does 100 at T2, Railgun 160 at T4.
- No T1, no T4; Street Smarts itself has no debuff row (the gangster's debuffs all come from Dirty Fighting — Curb Stomp Grievous 2, Iron Grip Root 2, Skull Crack Silence 1; summary.md lists his pool gap as SUSTAIN, not debuff — out of this family's scope).
**Changes.**
- MOVE `raceHitALick` → thievery (see Thievery; the gangster is added to Thievery so his rung `[raceDriveBy, raceHitALick]` stays legal).
- RECOST `raceChoppa` dmg 110 → 125.
**Additions.**
- NEW **Mean Mug** — T1, effect/debuff, no element, 25 MP 1 AP, rng 3, single, Discord 2 rounds (−2 ATK / −1 DEF). "Stare them down until they look away. A Single Enemy within 3 tiles is Discorded for 2 rounds." The family's own debuff (his Dirty Fighting ones are Grievous/Root/Silence — Discord is new to him); feeds Vehicular Manslaughter / Depth Charge / Bull Rush on teammates and Body Check's Stagger line stays separate.
- NEW **Empty the Clip** (`raceEmptyTheClip`) — T4, damage/line, metal/physical, 100 MP 1 AP, rng 4, `lineWidth: 3`, 160 physical to every enemy in the 3-wide lane (Tsunami's shape), `bonusVsStatus: { status: ['discord'], mult: 1.5 }`. "Hold the trigger down until it clicks. HEAVY physical damage to everything on a three-wide street in front of you — anyone already Discorded gets the rest of the belt." The choppa's escalation and the payoff for Mean Mug: a self-contained T1 → T4 combo the gangster owns instead of borrowing Extended Clips as a capstone. (SKEPTIC: without the finisher this was Choppa + width + damage, which rule (d) calls an upgrade; the Discord payoff is the job Choppa does not have.)
**Upgrades.** Long Reach on Choppa (6-tile line) and Empowered on Empty the Clip are the buys. Knockback on Drive-By already exists as the shove — block `upKnockback` on it. Lingering on Mean Mug (Discord 3) is the debuff build. Widen does not apply to lines — nothing to block.

### 💰 Thievery `thievery` — VERDICT: GROW (1 → 3)
**Identity.** Take what is theirs: items, stat stages, buffs. A 3-tier utility family with no T4 by design — thieves win by attrition, the capstones live in Archery / Dirty Fighting / Street Smarts.
**Races.** robinhood ✓ (wealth redistribution), goblin ✓ ("somebody else's wallet"), ADD gangster (Hit a Lick moves here; "Do not let them near your pockets"). pirate stays off — Plunder lives in Piracy.
**Now.**
- T2 Steal from the Rich `raceStealFromRich` · single rng 3, ATK −1 stage (a generic debuff; twin of Naughty List T3).
**Problems.** One spell, and it does not steal anything — it lowers a stat. A family called Thievery whose only row is "−1 ATK" has no identity.
**Changes.**
- MOVE `raceHitALick` streetsmarts → thievery; RETIER T2 → T1 (25 MP); RENAME "Hit a Lick" → "Stick-Up" (reads on Robin Hood and the goblin as well as the gangster); keep 60 physical rng 2, steals 1 Key + 1 item.
- REWRITE `raceStealFromRich` (T2, 50 MP, rng 3): target ATK −1 stage AND the caster ATK +1 stage (new `selfStageBoost: { atk: 1 }` beside `statStageBoost`); desc "Steal from the rich. Lowers a Single Enemy's ATK by 1 stage and takes it for yourself." Now it steals.
**Additions.**
- NEW **Swipe** — T3, damageEffect/debuff, metal/physical, 75 MP 1 AP, rng 2, single, 100 physical, then strips every buff status from the target and applies them to the caster (Spellsteal's `stealSpell` plumbing, `raceSpellsteal`, applied to buffs instead of spells). "Bump, lift, gone. MEDIUM physical damage to a Single Enemy within 2 and every buff they were carrying is yours now." Fills T3 with the family's real trick: answers Extended Clips / Overclock / Protect stacks.
**Upgrades.** Efficient and Long Reach on Stick-Up; Lingering on Steal from the Rich (stages are not statuses — block it there, `upgrades: ['upEfficient','upReach']`). Exploit does not apply. No family-scoped upgrade needed.

### 🪖 Military Combat `militarysupport` — VERDICT: KEEP (10 listed / 9 unique → 8; Nuke moves to Politics)
**Identity.** Doctrine: suppress, fortify, spot, then bring the guns down on the grid. The general's and the mech's book — shields and stat lines for the squad, delayed indirect fire for the enemy.
**Races.** marksman ✓, mech ✓, general ✓. politician — STRUCK (SKEPTIC): removing him leaves the politician with 2 families (Politics + Deep State), under the 3-family floor. He stays as the commander-in-chief: Rally Command, Fortify and calling a fire mission are exactly what the office orders; "Direct combat capability: unknown" describes the man, not the chain of command. The Nuke still moves to Politics (below) — that part of the argument stands. No additions — astronaut's railgun is Hidden Technology, the police officer is municipal.
**Now.**
- T1 Fortify `fortify` · shield 96 on an ally, rng 2.
- T1 Rally Command `raceRallyCommand` · aura r2 ATK +1 stage, **2 AP** (Royal Decree is the same row at 1 AP).
- T1 Suppressive Fire `raceSuppressiveFire` (alias `raceSuppressingFire`) · 80 physical line rng 4, Slow 2.
- T2 Iron Bulwark `raceIronBulwark` · self DEF +1 stage (generic; twin of Stone Skin / Thick Hide / Chitin Armor).
- T3 Artillery Strike `raceArtilleryStrike` · 135 physical delayed 1 turn, aoe r1 rng 6, 2 AP, scorched, deforms ground.
- T3 Iron Dome `shieldBash` · role heal/healAll with `heal: 0` + DEF +1 all allies — a broken row (a heal that heals nothing).
- T3 Rangefinder `raceRangefinder` · remote vision rng 8, 75 MP.
- T4 Fire for Effect `raceFireForEffect` · 160 physical delayed 1 turn, aoe r2 rng 6, 2 AP, scorched, deforms, ×1.5 vs Burn.
- T4 Nuke `sharedNuke` · 160 magic delayed 1 turn, aoe r2 rng 5, 2 AP, destroys buildings, scorched, deforms, CD 2.
**Problems.**
- Fire for Effect and Nuke are the same row (summary.md redundancy group: delayed fire aoe r2 160 100 MP 2 AP) — one physical, one magic. Two T4s of one shape in one family.
- Artillery Strike is Fire for Effect minus one ring (r1 vs r2) minus the burn payoff — i.e. Fire for Effect is Artillery Strike + Widen. Three delayed barrages in one family, all 2 AP.
- Iron Dome is a healAll with heal 0 under the id `shieldBash` — the engine runs a heal for nothing and then applies DEF +1. Nobody could tell what it does.
- Rally Command at 2 AP for a T1 aura buff when Royal Decree (`raceRoyalDecree`, camelot T1) is identical at 1 AP.
- Rangefinder — vision for 75 MP at T3 — is worth a T2 slot at most (Signal Flare is a 1-SP passive that reveals an area).
- The general's rungs: `raceRallyCommand, raceIronBulwark, raceArtilleryStrike, sharedNuke`; the mech's 4th rung is `sharedNuke` — both need a replacement capstone once Nuke goes.
**Changes.**
- MOVE `sharedNuke` → politics (RENAME "Nuke" → "Nuclear Option", see Politics). General and mech 4th rung → `raceFireForEffect` (RETIER-free: it is already their T4).
- RECOST `raceRallyCommand` 2 AP → 1 AP (25 MP). Comparable: Royal Decree.
- REWRITE `raceArtilleryStrike`: immediate, not delayed — drop `delayTurns`, add `ignoresLineOfSight: true`, dmg 135 → 125, 1 AP, aoe r1 rng 6, keep scorched + deform; desc "Fire mission, danger close. MEDIUM physical damage to every enemy in a 3×3 up to 6 tiles away, over any cover. Leaves scorched ground and a crater." The T3 is now the fast indirect strike; Fire for Effect stays the slow, huge, burn-paying battery. (Caveat: the mech already owns Mortar Salvo `raceMortarSalvo` — Mech Pilot Skills T1, 100 physical aoe r1 rng 5, 1 AP, ignores LoS — so for the mech this rewrite is Mortar Salvo +25 dmg +1 rng + scorched/crater at T3; the scorched terrain and crater must stay on Artillery Strike or the mech has no reason to equip it.)
- REWRITE `raceIronBulwark` (T2, 50 MP): self DEF +1 → aura r2 warCry, DEF +1 stage AND M.DEF +1 stage to all allies within 2; desc "Shields up. Every ally within 2 tiles gains +1 DEF and +1 M.DEF stage." (No longer one of four identical self-DEF rows. SKEPTIC: a single-stat r2 aura is a T1 row — Royal Decree, Rally Command and the rewritten Tin Foil Hat are all 25 MP — so the T2 has to carry both stages to earn its cost.)
- REWRITE `shieldBash` (Iron Dome, T3, 75 MP): role effect, kind `aoeShield`, self-centred aoe r2, `shieldHp: 160` on every ally inside (Tinker's Contraption's plumbing); drop the heal and the DEF stage; desc "Iron Dome up. Every ally within 2 tiles gets a 160-point shield." (Fortify T1 single shield 96 → Iron Dome T3 team shield: a clean escalation. SKEPTIC: 100 was under the house line — Holy Bulwark is T2, aoe r1, 160 shield — so a T3 r2 must be 160.)
- RETIER `raceRangefinder` T3 → T2 (50 MP). Marksman's rung stays inside the family.
- (RACE_REMOVE politician struck — see Races.)
**Additions.** None — T1 Fortify + Rally Command + Suppressive Fire · T2 Iron Bulwark + Rangefinder · T3 Artillery Strike + Iron Dome · T4 Fire for Effect. Eight rows across three races is right for the doctrine family; every row now has a job no other row has.
**Upgrades.** Widen on Artillery Strike is the 5×5 fast strike — do not re-grow a delayed r2 T3. Exploit on Fire for Effect with Incendiary Rounds is the marksman's designed combo. Lingering on Suppressive Fire (Slow 3) is the pin build. Block Blast/Ricochet/Forked on Suppressive Fire (a line). Family-scoped **Danger Close** (1 SP, `families: ['militarysupport']`, `requires: 'area'`, `patch: { addStatus: { id: 'stagger', duration: 1 } }` — the same `addStatus` patch key Poisoned Tips introduces) — the barrage Staggers what it hits; pairs the general with every Stagger finisher in the game.

### 🏛️ Politics `politics` — VERDICT: GROW (2 → 4)
**Identity.** Compliance by decree: silence the floor, win the room, order a stop, and — when the general will not — push the button. The only race in the game that owns the nuke.
**Races.** politician only ✓ (single-race is fine). Nobody else legislates.
**Now.**
- T1 Filibuster `raceFilibuster` · 3×3 zone 2 turns rng 3, enemies inside Silenced.
- T3 Executive Order `raceExecutiveOrder` · single rng 4, Stun 1, **2 AP**, 75 MP.
**Problems.**
- Executive Order at 2 AP + 75 MP for a 1-round stun: Taser is T2, 1 AP, 70 damage AND Stun 1; Stun Ray is T1 100 + Stun 1. It is the worst stun in the game per AP.
- No T2, no T4; the politician's capstone was borrowed from Military.
- The politician's lore ("speech patterns induce compliance in 89 % of listeners") is Charm — and the kit has no charm.
**Changes.**
- REWRITE `raceExecutiveOrder` (T3, 75 MP, 2 AP → 1 AP, CD 2): single rng 4 → aoe r1 rng 4, every enemy in the 3×3 Stunned 1 round; desc "Signed, sealed, effective immediately. Every enemy in a 3×3 within 4 tiles is Stunned for a round." (SKEPTIC: the plain recost left a T3 single Stun 1 beside the new T2 Campaign Promise single Charm 1 — and `charm` in data.js is hard CC, blockMove + no act, i.e. the same job one tier cheaper. The T3 is now the room-wide order, the T2 the one-on-one promise. Comparable: Fluoride Water T3 area Silence 2 with damage; a damage-less area Stun 1 on CD 2 is the stun-tier equivalent.)
- MOVE `sharedNuke` militarysupport → politics; RENAME "Nuke" → "Nuclear Option"; REWRITE: dmg 160 → 180, `delayTurns` 1 → 2 (the launch takes a round longer than a fire mission), keep aoe r2 rng 5, 2 AP, destroys buildings, scorched, deform −3, CD 2; desc "The football is open. Mark the grid; two rounds later there is no grid. HEAVY magic damage to everything in a 5×5, buildings included. Cooldown 2." The politician's rung `sharedNuke` stays legal.
**Additions.**
- NEW **Campaign Promise** — T2, effect/debuff, no element, 50 MP 1 AP, rng 4, single, Charm 1 round (charm = cannot move or act). "Look them in the eye and promise everything. A Single Enemy within 4 tiles is Charmed for a round." The lore's compliance as a row; a T2 hard-CC that feeds Enthrall / Draining Embrace on succubus/siren/popstar teammates, and sets up Take Aim's execute for a marksman ally (charmed units cannot flee the delayed shot).
**Upgrades.** Lingering on Filibuster (3-turn silence zone) and Campaign Promise (Charm 2) is the control build. Widen on Filibuster is the 5×5 gag order. Efficient on Nuclear Option (90 MP) matters on a 165-MP unit. Widen on Executive Order is the 5×5 order; Lingering on it (area Stun 2) is the one buy to watch — leave it priced at 1 SP but note it here as the family's ceiling. Blast/Forked never apply (no damage — `requires` already fails).

### ✦ Deep State Connections `deepstate` — VERDICT: GROW (2 → 3; Brainwash becomes the family's possess)
**Identity.** Favours from the people who are not on any org chart: surveillance, off-book funding, and leverage that makes an enemy fight for you. A 3-tier insider-utility family with no T4 by design — its owners' capstones live in Hidden Technology / Politics / Conspiracy Knowledge.
**Races.** men in black ✓ (the agency), politician ✓ (the elected front). telepath — STRUCK (SKEPTIC): removing it leaves the telepath with 2 families (Psychic + Astral Projection), under the 3-family floor. It stays, and the theme holds: a contained psionic subject the agency points at people IS a deep-state programme (the MK-Ultra / remote-viewing file) — "Containment priority: HIGH" is the agency's stamp on its asset. With the telepath staying, Brainwash has no reason to leave; it becomes the family's possess instead (below), which keeps the rung `raceBrainwash` inside a family the telepath owns. ADD reptilian — "subterranean civilization predating human surface occupation … infiltration expertise": in this game's lore the reptilians ARE the deep state.
**Now.**
- T2 Black Budget `raceBlackBudget` · ally Overclock 1 round (+1 ATK stage, +1 MOV; tech +1 RNG) — Overclock (robot T2) gives the same for 2 rounds.
- T3 Brainwash `raceBrainwash` · single rng 3, Discord 2 (the only user of the `_DISCORD_BOLT` template — a generic single-target Discord bolt; the other Discord 2 rows, Dread Aura / Dragonfear / Labyrinth Roar, are self-centred auras of r2/r3, not bolts).
**Problems.**
- Black Budget is Overclock at half the duration and a tier-mate's cost.
- Brainwash is a T3 that does what Dread Aura does at T1 (Discord 2 — and Dread Aura does it on an r2 aura); a single-target Discord 2 bolt is a T1 shape wearing a T3 cost, and "brainwash" promises control, not −2 ATK.
- No T1; nothing in the family surveils, funds or leverages anything.
**Changes.**
- RECOST `raceBlackBudget`: Overclock duration 1 → 2 rounds (matches `overclock`); desc "Money that was never appropriated. Overclocks a Single Ally for 2 rounds: +1 ATK stage, +1 MOV (tech units also +1 RNG)."
- REWRITE `raceBrainwash` (T3, 75 MP 1 AP, CD 3, rng 3, single): kind `possess` (Possession / Enthrall / Indoctrinate plumbing), Possessed 2 (its next activation is yours) and Discord 2 left behind when the programming wears off; desc "Everyone has something, and we have it. A Single Enemy within 3 tiles takes its next activation under your orders — and comes back Discorded for 2 rounds. Bosses cannot be brainwashed." (SKEPTIC: this replaces the MOVE and the proposed NEW Blackmail, which was the same possess row under another name — rule (d). Possession / Indoctrinate are T3 possess CD 3 rng 3, so the tier is proven; the Discord tail is what makes it Deep State's version rather than a twin.)
- RACE_ADD reptilian. (RACE_REMOVE telepath struck — see Races.)
**Additions.**
- NEW **Surveillance** (`raceSurveillance`) — T1, effect/debuff, no element, 25 MP 1 AP, rng 6, single, Marked 2 rounds (`bonusDamage: 40`); Marked's own engine behaviour (consumed by the next physical hit, pierces invisibility / cryptid hiding) is the whole effect — no new fog-reveal mechanic (SKEPTIC struck the "tile stays visible" clause: that is a second, unbuilt mechanic). "We have had a file on you for years. A Single Enemy within 6 tiles is Marked for 2 rounds: they cannot hide, and the next physical hit any ally lands deals +40." The T1 the family is missing; Red Eyes / Predictive Model are the same shape (T1 marked) so the tier is proven; pairs MIB's Knife Throw and the gun team's Dead Eye/Double Pump.
- ~~NEW **Blackmail**~~ — STRUCK (SKEPTIC): a T3 possess in the same family as the rewritten Brainwash (T3 possess) is the same role twice — rule (d). Its line and its leverage went into Brainwash's rewrite above. The family reads T1 Surveillance · T2 Black Budget · T3 Brainwash: surveil, fund, own.
**Upgrades.** Lingering on Surveillance (Marked 3) and Black Budget (Overclock 3) is the family's build. Long Reach on Brainwash (rng 4). Nothing to block — no damage rows.

### 🐸 Conspiracy Knowledge `conspiracyknowledge` — VERDICT: KEEP (4 → 4)
**Identity.** The theories, weaponised: chemtrails, fluoride, the flat earth — a magic control-damage family with a self-contained finisher (Chemtrails' Poison / Fluoride Water's Silence → Flat Earth ×1.5). The one family in this slice already shaped T1–T4.
**Races.** reptilian ✓ (they run the programmes — a reptilian SPRAYING chemtrails is coherent), conspiracy theorist ✓ (he knows the programmes). The Tin Foil Hat on a reptilian is the one giggle; tolerable because the rest of the kit is the reptilian's own operations. No additions — grey / martian have UFO Features.
**Now.**
- T1 Tin Foil Hat `raceTinFoilHat` · ally M.DEF +1 stage, rng 2.
- T2 Chemtrails `raceChemtrails` · 100 magic line rng 4, Poison 2, leaves poison terrain.
- T3 Fluoride Water `raceFluorideWater` · 125 magic aoe r1 rng 3, Silence 2.
- T4 Flat Earth `raceTruthBomb` · 180 magic single rng 4, ×1.5 vs Silence/Poison, flattens the ground r1.
**Problems.**
- Tin Foil Hat is a generic single-target stage buff (one of many); for a family whose joke is "hats for everybody" it should be an aura.
- Fluoride Water is over-tuned: 125 damage on a 3×3 AND a 2-round area Silence at 1 AP / 75 MP — Lockdown (T4!) is 120 + Slow 2 on the same shape; Mind Shatter's silence is a T4. The area silence is the value; the damage should give some back.
**Changes.**
- REWRITE `raceTinFoilHat`: kind warCry, aura r2, M.DEF +1 stage to every ally within 2 (25 MP); desc "Hats on, everybody. Every ally within 2 tiles gains +1 M.DEF stage."
- RECOST `raceFluorideWater` dmg 125 → 105 (keep Silence 2, aoe r1, rng 3, 75 MP 1 AP).
**Additions.** None — T1 Tin Foil Hat · T2 Chemtrails · T3 Fluoride Water · T4 Flat Earth.
**Upgrades.** Exploit on Flat Earth (×2 vs Silence/Poison) is the family's payoff buy; Lingering on Chemtrails (Poison 3) sets it up. Widen on Fluoride Water is the 5×5 silence — powerful, priced at 2 SP, fine. Block Blast/Ricochet/Forked on Flat Earth — the flatten rider is single-target by design (`upgrades: ['upDamage','upFinisher','upReach','upEfficient']`).

### 🔪 Spy Gear `spygear` — VERDICT: KEEP (7 → 7; one race in)
**Identity.** The operative's bag: a thrown knife that marks, a vanish, a smoke zone, a planted charge, an EMP, a poison dart, and the knife in the back. Poison and Marked are the currencies; Invisible is the delivery.
**Races.** men in black ✓, reptilian ✓ ("infiltration expertise"). shadow entity and halfdemon — removals STRUCK (SKEPTIC): each has exactly 3 families (Shadow + Poltergeist + Spy Gear; Demonic + Shadow + Spy Gear) and no replacement is offered, so removal breaks the 3-family floor; both stay and their rung `sharedSmokeScreen` stays as it is. The theme is tolerable: "origins remain classified" and "retains human tactical reasoning" both read as agency assets. If the Shadow-slice owner later adds a third family (Astral Projection fits the shadow entity's "adjacent dimensional layers"; Fire Magic fits the fire-resistant halfdemon), this removal can go through then. ADD barbarella — "encountered during deep-space reconnaissance … HONEY TRAP RISK": a spy by dossier, and an 11-spell pool that needs it.
**Now.**
- T1 Knife Throw `knifeThrow` · 100 physical rng 4, Marked 1 (`bonusDamage: 24`); `equipReq: 'knife'` (dead field).
- T2 Agent Vanish `raceAgentVanish` · teleport 3 + Invisible 2, CD 2.
- T2 EMP Grenade `raceEMPGrenade` · 100 magic aoe r1 rng 4, Jammed 2 — **75 MP pinned** (off the T2 ladder).
- T2 Place Bomb `placeBomb` · plants a charge (3 active), detonate for 130 in a 3×3.
- T2 Smoke Screen `sharedSmokeScreen` · 3×3 zone 2 turns, allies inside Invisible while inside, CD 2.
- T3 Poison Dart `poisonDart` · 125 physical rng 3, Poison 3.
- T4 Sneak Slash `sneakSlash` · 160 physical rng 1, ×1.5 while invisible (`sneakBonus`), ×1.5 vs Poison; `equipReq: 'knife'` (dead field).
**Problems.**
- Four T2s. EMP Grenade is pinned at 75 MP because it is a T3 in everything but the number: 100 area damage + Jammed 2 (AWR 0 — blind to the map) with two T4 payoffs (Classified Weapon, Railgun) for the MIB. Its tier is wrong, not its cost.
- Two invisibility rows at T2 (Agent Vanish self, Smoke Screen zone) — different roles (escape vs team hide), keep both, but neither should be the family's rung for races that do not belong here.
- Knife Throw's Mark is 24 where Dead Eye's is 40 and the engine default is 40; a T1 mark at 24 is fine, but the card does not say what Marked does.
- `equipReq` on Knife Throw and Sneak Slash is dead (SPELL_DEAD_FIELDS) — strip it.
- Sneak Slash at 160 is under the T4 single bar (180) but carries two multipliers (invisible ×1.5, Poison ×1.5) — correct as is.
**Changes.**
- RETIER `raceEMPGrenade` T2 → T3 (its pinned 75 MP becomes the ladder cost); the family then reads T3 EMP Grenade + Poison Dart.
- REWRITE `knifeThrow` desc: "A knife from the sleeve. MEDIUM physical damage to a Single Enemy within 4 and Marks them: the next physical hit any ally lands deals +24 and they cannot hide." Strip `equipReq`.
- REWRITE `sneakSlash`: strip `equipReq`; desc unchanged.
- RACE_ADD barbarella. (RACE_REMOVE shadow entity / halfdemon struck — see Races.)
**Additions.** None — T1 Knife Throw · T2 Agent Vanish + Place Bomb + Smoke Screen · T3 EMP Grenade + Poison Dart · T4 Sneak Slash. Seven rows for five races, three T2s with three jobs (escape, trap, team hide).
**Upgrades.** Exploit on Sneak Slash (×2 vs Poison) after Poison Dart is the assassin line. Surplus on Place Bomb (4 charges) and Widen on EMP Grenade are the demolition build. Lingering on Agent Vanish (3 rounds invisible) is strong but priced; leave it. Block Knockback on Knife Throw (a thrown knife does not shove — `upgrades: ['upDamage','upReach','upEfficient','upLinger']`).

SPELL COUNT: 58 → 62 for this group (59 listed rows, one an alias; −5: Impact Round, Ricochet, Poison Arrow → upgrade, Green Arrow, Forest Ambush merged; +7 new spells: Snare, Slap Leather, Mean Mug, Empty the Clip, Swipe, Campaign Promise, Surveillance; +2 family passives: Overwatch, Ballistic Vest; Long Rifle, Hit a Lick and Nuke move within the group; Brainwash stays in Deep State as its possess). SKEPTIC race-count check after edits: no race in this slice drops below 3 families (annunaki 3, cosmic wraith 3 after the Marksmanship removals; werewolf, politician, telepath, shadow entity, halfdemon kept); every rung named in races.md sits inside a family its race still owns (cowboy `raceQuickDraw` via Marksmanship, gangster `raceHitALick` via Thievery, general/mech rung 4 → `raceFireForEffect`, politician `sharedNuke` via Politics, robinhood rung 1 collapses to `raceFireArrow`).
