### 🪽 Fallen Angelic Powers `fallenangel` — VERDICT: GROW
**Identity.** Grace turned to fire: a burn-setup family whose payoff is a sky-dive or a wide cross of wrath; the bitter ex-celestial who still has the wings and none of the restraint.
**Races.** fallen angel — fits (the family is written for it). nephilim — fits by lore (the Nephilim are the children of the Watchers; `raceWrathOfTheWatchers` is literally its T4 rung), and it is a 680-HP tank with 27 INT, so the two magic rows are chip for it — acceptable because the nephilim is a SKY_RACES flyer (map.js `SKY_RACES`), so Descending Wrath is castable for it as shipped and the family's melee T4 is its real payoff. Nobody else belongs: chosen one is "prophecy", not "fallen".
**Now.**
- T1 Fallen Grace `raceFallenGrace` · 100 magic, cross r1, rng 4, Burn 1, 25MP 1AP.
- T2 Abyssal Wings `raceAbyssalWings` · self Protect 1, CD2, 50MP.
- T4 Descending Wrath `raceDescendingWrath` · 160 magic melee sky-slam, +25/level from carry height 5, Burn 2, finisher Burn ×1.5, requiresFlight, 100MP 2AP.
- T4 Wrath of the Watchers `raceWrathOfTheWatchers` · 180 magic cross r2 (9 tiles), rng 4, Burn 1, finisher Stagger ×1.5, 1AP CD2, 100MP.
**Problems.** No T3 and two T4s. Fallen Grace is a 100-dmg cross AOE with a status at T1 (house T1 area ≈ 80; synergy.md lists it among the T1 rows with AOE dmg ≥100; the T3 comparable Divine Judgment is 135). Wrath of the Watchers is 180 on a 9-tile cross at T4 (house T4 area ≈ 160; Dark Dominion is 170 on 9 tiles and Meteor 160) and its Stagger finisher is not fed by anything in this family — the family sets up Burn twice and only Descending Wrath pays it. Abyssal Wings is the fourth Protect-buff row with CD2 (summary redundancy group: Rapture T1 — ally-targeted rng 4, Protect 1, 2AP, and it sits in Heavenly Duties, which the fallen angel ALREADY owns; Invulnerable T2 — self Protect 2, 2AP; Black Guard T2 — self Protect 2), so the fallen angel's pool holds two Protect rows. (SKEPTIC: the earlier claim that Descending Wrath's `requiresFlight` is dead for the nephilim was wrong — map.js `SKY_RACES` lists both nephilim and fallen angel; both cast it as shipped.)
**Changes.**
- RECOST `raceFallenGrace` dmg 100 → 80 (Burn 1 stays; it is the setup row, not the nuke).
- REWRITE `raceAbyssalWings`: T2, movement/dash, -, 50MP 1AP CD 2, self: fly up to 4 tiles (`teleportDistance:4`, the Spirit Walk field; the path ignores ground and units) and land under Protect 1. "Spread the black wings." A reposition-plus-guard, not a fourth Protect-buff row: the nephilim reaches melee for Descending Wrath in one action, and the fallen angel gets the escape it lacks (Heavenly Duties' Miracle is a swap, not a dash). SKEPTIC: the earlier 'Protect 1 + Levitating 2' version was struck — both owners are already SKY_RACES flyers, so Levitating added nothing.
- RECOST `raceWrathOfTheWatchers` dmg 180 → 160; finisher Stagger → Burn ×1.5 (fed by Fallen Grace; the Stagger payoff stays available to the infernal royalty via Dark Dominion; Baphomet's Rite is Black Magic's, not a demon row).
**Additions.**
- NEW **Broken Halo** — T3, damageEffect, shadow/magic, 75MP 1AP, rng 4, single, dmg 130, `purgeBuffs` (the field Terror Pounce already uses), finisher Burn ×1.5. "What is left of the halo, thrown like a discus. Deals MEDIUM magic damage and strips every buff the target carries; Burning targets take it worse." Fills the empty T3 as the family's 1AP ranged Burn payoff (Descending Wrath is 2AP melee). The purge is a rider, not the role: the fallen angel already strips enemy buffs with Purify (Heavenly Duties T1, 3×3) — the nephilim does not, and this is its only dispel.
**Upgrades.** Lingering on Fallen Grace (Burn 1 → 2) is the family's setup upgrade — do not add a longer-burn spell. Efficient on Descending Wrath (100 → 90 MP, it is 2AP). Widen does not apply (crosses are not areas); do not add a 5×5 to this family. No family-scoped upgrade needed.

### 😈 Demonic Abilities `demonicabilities` — VERDICT: KEEP (trim)
**Identity.** The fine print: bind the enemy in a Contract or a Soul Bind, then Devour it; the rest is hellfire for when the paperwork fails.
**Races.** demon, demon prince, halfdemon, succubus ("of infernal origin") — fit. fallen angel — fits ("combined divine and infernal signatures") and this is its only route to a self-contained Contract → Devour line. demon princess is not on it and does not need it (Infernal Court + 3 others). No additions.
**Now.**
- T1 Contract `raceContract` · Contract 3 (demon heals 40% of what the target deals), rng 3, 25MP.
- T1 Demonic Roar `raceDemonicRoar` · self-aoe r2 Stagger 1, 25MP.
- T1 Inner Demon `raceInnerDemon` · self ATK +1, costs 20% HP, CD2, 25MP.
- T2 Infernal Hurl `raceInfernalHurl` · 90 physical sky-throw, +25/level (carry 4), +50 on collision, requiresFlight, 50MP.
- T2 Soul Bind `raceSoulBind` · links two enemies, each takes 30% of the other's damage for 3 rounds (45% "while the demon's M ATK is raised"), 50MP.
- T3 Devour Soul `raceVoidContract` · 125 magic, drain 50%, finisher Contract/SoulBound ×1.5, rng 3, 75MP **2AP**.
- T4 Demonic Claw `raceDemonicClaw` · 180 physical melee, Marked 2, 100MP.
- T4 Hellmouth `raceHellmouth` · 160 fire magic line w1 rng 4, leaves lava, 100MP.
**Problems.** Inner Demon is the same row as Grim Resolve (Shadow T2, 25MP, ATK +1 — demon and halfdemon own Shadow), Hellfire Crown (Infernal Court, demon prince) and Blood Ritual (Blood T3, ATK +1 with a 10% HP cost — demon and demon prince own Blood); the demon's pool currently holds three ATK+1 self-buffs. Demonic Claw applies Marked, a status with ZERO payoffs anywhere (synergy: marked PAYOFF(0)) — a T4 rider that does nothing. Soul Bind's 45% clause keys off "M ATK raised" and no race on this family has an INT-stage buff in its pool, so it never fires. Devour Soul at 2AP is strictly worse than Life Sap (Blood T3: 135, drain 70%, 1AP) for demon/demon prince unless the finisher lands.
**Changes.**
- DELETE `raceInnerDemon` (Grim Resolve / Blood Ritual / Hellfire Crown cover ATK +1 for every physical race here; succubus and fallen angel have 16/8 ATK and never wanted it). Halfdemon's T1 rung `raceInnerDemon` → `raceDemonicRoar`.
- REWRITE `raceSoulBind`: 30% shared damage, 45% while either bound target is Contracted (in-family trigger replaces the dead M-ATK clause); everything else unchanged.
- RECOST `raceVoidContract` AP 2 → 1 (125 + 50% drain at 75MP is Life Sap's tier; the finisher is what earns it the T3 slot).
- REWRITE `raceDemonicClaw`: 180 physical melee, drop Marked, add finisher Contract/SoulBound ×1.5. Now the physical demons (demon prince, halfdemon) have a payoff for the family's setups that scales off ATK, mirroring Devour Soul for the casters.
**Additions.** None — after the delete the family is 7 rows at T1 2 / T2 2 / T3 1 / T4 2, which is enough.
**Upgrades.** Lingering on Contract (3 → 4 rounds) and on Soul Bind are the natural picks. Forked on Devour Soul is the family's "eat two souls" — do not add an AOE drain here. Family-scoped: **Soul Tax** (2 SP, families: [demonicabilities]) on `raceVoidContract`: drainPct 0.5 → 0.8.

### 👑 Infernal Court `infernalcourt` — VERDICT: KEEP (retier)
**Identity.** The rule of hell: a crown for the ruler, a conscription that drags the enemy to the throne, decrees that burn the field — the setup is Stagger and Burn, the payoffs are Dominion and Cataclysm.
**Races.** demon prince, demon princess — fit (infernal royalty/nobility). overlord — fits ("warlord entity documented across 4,000 years under various names"; conquest is the job). No additions; the rank-and-file demon stays off the court.
**Now.**
- T1 Hellfire Crown `raceHellfireCrown` · self ATK +1, 25MP.
- T2 Infernal Conscription `raceInfernalConscription` · Marked 3, rng 3, 50MP.
- T2 Infernal Decree `raceInfernalDecree` · 130 magic aoe r1 rng 3, Burn 2, 50MP **2AP**.
- T3 Kiss of Decay `raceKissOfDecay` · 100 magic drain 40%, Poison 2, finisher Poison ×1.5, rng 2, 75MP.
- T4 Cataclysm Decree `raceCataclysmDecree` · 160 magic delayed 1 turn, aoe r1 rng 5, lava + terrain deform, finisher Burn ×1.5, 100MP 2AP.
- T4 Dark Dominion `raceDarkDominion` · 170 magic aoe r1 rng 4, Burn 2, finisher Stagger ×1.5, 1AP CD2, 100MP.
- T4 Dark Lullaby `raceDarkLullaby` · 160 magic aoe r1 rng 4, Silence 1, finisher Silence ×1.5, 100MP.
**Problems.** Three T4 3×3 nukes (160 Burn / 170 Burn / 160 Silence) for one T1 and one real T2. Infernal Conscription applies Marked, which has no payoff in the game. Infernal Decree is a tier-rule offender (130 area at T2; house T2 area ≈ 100) and 2AP on top. Kiss of Decay shares its summary redundancy signature with Ghoulish Bite (T1, 25MP, 100 dmg, Poison 2, drain 40% — physical melee where Kiss is magic at rng 2) and is sold at T3 for 75MP. Hellfire Crown is dead for the princess (ATK 8). Dark Dominion's Stagger finisher "needs a teammate" for demon princess and overlord (synergy.md) because nothing in the court applies Stagger.
**Changes.**
- REWRITE `raceHellfireCrown`: self, +1 stage to whichever of the caster's ATK / M ATK is higher, CD 2, 25MP 1AP. One crown that serves the bruiser prince and the caster princess. SKEPTIC: was '+1 ATK AND +1 M ATK' — two stages at T1 out-tiers Grim Resolve (T2, one stage) and Blood Ritual (T3, one stage + HP cost); one stage keyed to the right stat fixes the dead-for-the-princess problem without breaking the buff ladder.
- REWRITE `raceInfernalConscription`: T2, damageEffect/pull, -/magic, 50MP 1AP, rng 4, single: 60 magic dmg, pulls the target up to 3 tiles toward the caster (`pullDistance:3`, the field Undertow patches), Stagger 1. "Report for duty." The court's own Stagger setup — Dark Dominion becomes self-contained for all three races.
- RECOST `raceInfernalDecree` dmg 130 → 100, AP 2 → 1 (Burn 2 stays; it is the Burn setup for Cataclysm Decree).
- REWRITE `raceKissOfDecay`: dmg 100 → 125, Poison 2 → 3, rng 2 → 3, drain 40% and the Poison finisher stay. Now a real T3 (T3 single ≈ 125–135).
- RETIER `raceDarkLullaby` T4 → T3 (75MP), dmg 160 → 125, Silence 1 + finisher Silence ×1.5 unchanged. A 3×3 Silence at T3 is the court's control tool, not a third nuke. Demon princess's T4 rung `raceDarkLullaby` → `raceCataclysmDecree`.
- RECOST `raceDarkDominion` dmg 170 → 160 (house T4 area).
**Additions.** None — the family lands at T1 1 / T2 2 / T3 2 / T4 2.
**Upgrades.** Blast is pointless here (everything is already 3×3); Widen on Dark Dominion is the family's 5×5 — do not add one. Lingering on Infernal Decree (Burn 2 → 3). Undertow on Infernal Conscription (pull +1) stacks with the rewrite naturally. Efficient on Cataclysm Decree.

### 🪄 Black Magic `blackmagic` — VERDICT: GROW
**Identity.** Everything has a price: pacts that cost blood, dolls that redirect pain, a goat that always collects. The setup is Voodoo, the payoff is the needle and the rite.
**Races.** skinwalker — fits (a skinwalker is, in the source folklore, a witch). goatman — fits (occult signature, Baphomet's Rite is its rung). necromancer — fits. krampus — fits loosely (horned devil, Baphomet's Rite is its T4 rung; the chained goat-devil "collecting" names is on theme). Missing race: **cult leader** (human/unholy, altar at Bohemian Grove, "the passing of a cup", currently carrying the empty Persuasion family) — RACE_ADD cult leader to Black Magic; Sacrifice and Voodoo are exactly his kind of support.
**Now.**
- T1 Death Pact `raceDeathPact` · self ATK +1, 25MP.
- T2 Sacrifice `raceSacrifice` · ally gives 30% max HP, another ally heals 150% of it, **25MP** (off-ladder).
- T3 Voodoo `raceVoodoo` · link enemy ↔ ally, enemy takes 50% of the ally's damage taken for 3 rounds, **25MP** (off-ladder).
- T4 Baphomet's Rite `raceBaphometsRite` · 160 fire magic aoe r1 rng 4, finisher Stagger ×1.5, costs 15% HP, 100MP **2AP**.
**Problems.** Death Pact is one of TEN plain ATK+1 self-buff rows in the game (summary redundancy groups: Inner Demon, Grim Resolve, Hellfire Crown, Blood Ritual, Siege Mode, Overcalculate, Wish Granted, Monkey Business, Forest Ambush) and carries no pact (no price) — it is the one row here that does not fit the family's own identity. Sacrifice (T2) and Voodoo (T3) are both pinned at 25MP; Voodoo at 25MP is a 3-round 50% damage reflect for the price of a T1. Voodoo's only payoff is Bad Trip (Drug Use), which no Black Magic race owns — the setup has no payoff for its own races. Baphomet's Rite is taxed twice (2AP AND 15% HP) and its Stagger finisher needs a teammate for skinwalker and necromancer. No damage row below T4.
**Changes.**
- REWRITE `raceDeathPact`: self ATK +2 stages, costs 25% max HP (never fatal), CD 3, 25MP 1AP. "Sign here." A real pact: big power, blood price. (Necromancer never wanted an ATK buff; this is the goatman/krampus/skinwalker row.)
- RECOST `raceSacrifice` MP 25 → 50 (ladder).
- RETIER `raceVoodoo` T3 → T2 (50MP); effect unchanged. Description: add "Needle Work and Baphomet's Rite hit Voodoo targets harder."
- REWRITE `raceBaphometsRite`: AP 2 → 1 (keep the 15% HP cost — that is the identity), finisher Stagger,Voodoo ×1.5.
**Additions.**
- NEW **Needle Work** — T3, damage, shadow/magic, 75MP 1AP, rng 4, single, dmg 125, ignoreArmor, finisher Voodoo ×1.5. "Push the pin in. Deals MEDIUM magic damage that ignores DEF; a Voodoo-bound target takes it worse." Gives the two casters (necromancer, skinwalker) a ranged T3 payoff inside the family, so Voodoo → Needle Work is a self-contained line. Family lands at T1 1 / T2 2 / T3 1 / T4 1.
**Upgrades.** Lingering on Voodoo (3 → 4 rounds). Blast on Needle Work is the family's small AOE — do not add one. Efficient on Baphomet's Rite. Family-scoped: **Blood Price** (1 SP, families: [blackmagic]) on `raceBaphometsRite`: selfDamagePct 0.15 → 0.25, dmg 160 → 190 — the rite for players who want to pay more.

### 🧙🏻‍♀️ Witchcraft `witchcraft` — VERDICT: GROW
**Identity.** The hex: one curse, then the payoff. The fortune teller's, scarecrow's and princess's shared control kit; Hexed is fed here (both setups in the game are Witchcraft rows) but today paid only elsewhere — Crow Storm, Crystal Ball, Exorcism; nothing in the family pays it yet.
**Races.** fortune teller — fits (the tarot-and-curse reader; and with a 7-spell pool, the smallest in the game, she needs this family to be whole). demon princess — fits ("curse propagation"). jack o lantern — fits ("burn, curse and haunt"). scarecrow — fits as folk-magic construct; Crow Storm pays Hexed. No additions (skinwalker and cult leader already have 4–5 families).
**Now.**
- T2 Hex of Agony `sharedHexOfToil` · Hexed 3, rng 4, 50MP.
- T3 Family Curse `raceCurseOfMisfortune` · Hexed 3, rng 4, 75MP.
- T4 Hocus Pocus `raceHocusPocus` · 180 arcane magic single, rng 4, **25MP** 1AP.
**Problems.** Hex of Agony and Family Curse are the same row (Hexed 3, rng 4) at two prices — summary redundancy group "effect | debuff | shadow | hexed". Hocus Pocus is a 180-damage T4 for 25MP (off-ladder, flagged) and has no relationship to the hex. No T1.
**Changes.**
- REWRITE `sharedHexOfToil` "Hex of Agony": Hexed 3 + Grievous 3 (healing halved), rng 4, 50MP. The agony is the wound that will not close — distinct from the spread curse.
- REWRITE `raceCurseOfMisfortune` "Family Curse": effect/aoe, rng 4, aoe r1, Hexed 3 on every enemy in the 3×3, 75MP 1AP. "It runs in the family." The T3 is the spread version.
- RECOST `raceHocusPocus` MP 25 → 100; add finisher Hexed ×1.5. The old words are the family's capstone payoff.
**Additions.**
- NEW **Evil Eye** — T1, damageEffect, shadow/magic, 25MP 1AP, rng 4, single, dmg 80, Hexed 2. "One look is enough. Deals WEAK magic damage and Hexes the target for 2 rounds." The cheap setup/poke the fortune teller has been missing (3 damage rows in her whole pool); feeds Hocus Pocus, Crow Storm, Crystal Ball, Exorcism. Family lands at T1 1 / T2 1 / T3 1 / T4 1.
**Upgrades.** Lingering on Evil Eye (Hexed 2 → 3). Widen on Family Curse is the 5×5 — do not add a bigger curse. Efficient on Hocus Pocus. No family-scoped upgrade needed.

### 😵 Necromancy `necromancy` — VERDICT: GROW
**Identity.** Command the ground and the dead: Root them (Rigormortis), drain them (Life Drain pays Root), rot the ground (Plaguefield), and turn the bodies into weapons (Bone Barrage, Raise the Dead).
**Races.** necromancer — fits. anubis — fits (god of the dead, "cellular necrosis"; Rigormortis is its rung; INT 86). **zombie — fails**: INT 0 and 70 MP, so Life Drain/Rigormortis/Bone Barrage deal nothing and Raise the Dead (100MP) can never be cast; none of its rungs are here. RACE_SWAP zombie: Necromancy → Grave Hunger (`ghoulish`) — physical corpse-eating, which is what a zombie does (see Grave Hunger). No other additions (ghost is a poltergeist, skeleton is bones, not a caster).
**Now.**
- T1 Life Drain `raceSoulDrain` · 100 magic drain 35%, finisher Root ×1.5, rng 3, 25MP.
- T2 Plaguefield `racePlaguefield` · permanent 3×3 plague flesh, poisons anyone but the necromancer who ends a turn on it, rng 4, 50MP.
- T2 Rigormortis `raceRigormortis` · 80 magic aoe r1 rng 4, Root 2, 50MP.
- T4 Raise the Dead `raceRaiseDead` · raise an abomination from a gravestone/bones within 4, attacks nearest unit each round, 3 hits, 100MP 2AP.
**Problems.** No T3. Otherwise the ladder is coherent: Rigormortis → Life Drain is a self-contained Root line for both remaining races. Rigormortis at 80 is under house T2 area (≈100) but a 2-round AOE Root is the payment; leave it.
**Changes.**
- MOVE `raceBoneBarrage` (Bone Density T3: 125 magic aoe r1 rng 4, DEF −1) → `necromancy` as its T3. It is a caster row (magic) that the necromancer already runs as his T3 rung and the skeleton (INT 42, ATK 70) cannot use; conjured bone shards are necromancy, not skeletal anatomy. Numbers unchanged.
**Additions.** None beyond the move — the family lands at T1 1 / T2 2 / T3 1 / T4 1 with the corpse economy (Plaguefield, Raise the Dead) intact.
**Upgrades.** Surplus on Raise the Dead (+1 deployable) is the family's "mass grave" — do not add a second raise spell. Lingering on Rigormortis (Root 2 → 3). Widen on Bone Barrage. Family-scoped: **Grave Robber** (1 SP, families: [necromancy]) on `raceRaiseDead`: the abomination takes 5 hits instead of 3.

### 🦴 Bone Density `bonedensity` — VERDICT: KEEP (sharpen)
**Identity.** The skeleton's body: everything it throws ignores DEF, and it puts itself back together. A physical armor-piercing brawler kit.
**Races.** skeleton — fits (ATK 70, "remarkably resistant to kinetic damage"). **necromancer — fails**: ATK 8, so Bone Toss and Marrowstorm (both physical) are dead rows for him, and his one usable row (Bone Barrage, magic) moves to Necromancy above. RACE_SWAP necromancer: Bone Density → Poison Abilities (`poison`) — "projecting weaponized decay", poison-resist affinity, and Plaguefield already poisons; Formic Acid/Poison Swamp give him the Poison setup that Marrowstorm no longer needs to. Family stays skeleton-only (rule 2).
**Now.**
- T1 Bone Toss `raceBoneToss` · 80 physical rng 3, ignoreArmor, 25MP.
- T2 Reassemble `raceReassemble` · self heal 30% max HP, 50MP.
- T3 Bone Barrage `raceBoneBarrage` · 125 MAGIC aoe r1 rng 4, DEF −1, 75MP.
- T4 Marrowstorm `raceMarrowstorm` · 160 physical aoe r2 (5×5) rng 4, ignoreArmor, finisher Poison ×1.5, 100MP 2AP CD2.
**Problems.** Bone Barrage is the only magic row in a physical family, and identical in signature to Bat Swarm (T3 125 magic aoe DEF −1) — same role twice across the undead. After it moves, the family has no T3. Marrowstorm's Poison finisher needs a teammate (skeleton is poison-immune and applies none) — acceptable as the cross-team hook with zombie/ghoul/necromancer, keep it.
**Changes.**
- MOVE `raceBoneBarrage` → `necromancy` (see above). Skeleton's T3 rung `raceBoneBarrage` → `raceBoneLance` (new).
**Additions.**
- NEW **Bone Lance** — T3, damage, -/physical, 75MP 1AP, rng 4, line w1, dmg 125, ignoreArmor. "A femur, thrown like a javelin, through everyone in the way. Deals MEDIUM physical damage to All Enemies in a line. Ignores DEF." The physical T3 the skeleton actually scales with; keeps the family's rule (every attack ignores DEF) unbroken from T1 to T4. Family lands at T1 1 / T2 1 / T3 1 / T4 1.
**Upgrades.** Ricochet on Bone Toss (it is a thrown bone — this is the family's bounce; do not add a bouncing bone spell). Efficient on Marrowstorm. Reassemble should NOT take Lingering (no status). Family-scoped: **Calcium** (1 SP, families: [bonedensity]) on `raceReassemble`: selfHealPct 0.3 → 0.4 and cleanse 1 debuff.

### 👻 Poltergeist Abilities `haunted` — VERDICT: KEEP
**Identity.** The haunting: sink a spirit into them (Haunted DoT, 28/round ignoring armor), chill the room, take their body, then the scare (Boo pays Haunted). The one undead family whose setup and payoff are both inside it.
**Races.** ghost — fits (written for it). shadow entity — fits ("non-corporeal", "phase through matter"). jack o lantern — fits ("subjects burn, curse and haunt"). skeleton — soft misfit (animated bone, not a restless spirit; Possession/Boo are off-stat at INT 42) but KEEP. SKEPTIC: the RACE_SWAP to Dirty Fighting proposed earlier was STRUCK — a gangster/luchador/clown brawling kit has no more claim on a reanimated skeleton than the graveyard does (yeti test), Grave Chill is the skeleton's shipped T1 rung, and the skeleton keeps physical rows through Swordsmanship; that swap was churn, not a fix. Skeleton's rung `[raceBoneToss, raceGraveChill]` stays. No additions, no removals.
**Now.**
- T1 Grave Chill `raceGraveChill` · 100 ice magic single rng 3, Slow 1, 25MP.
- T1 Haunt `raceHaunt` · Haunted 3 (28 magic/round, armor ignored), rng 5, 25MP.
- T2 Cold Spot `raceColdSpot` · 3×3 zone rng 4, Frozen 1 reapplied for 2 rounds, 50MP.
- T3 Possession `racePossession` · Possessed 2 (you run its next activation), rng 3, CD3, 75MP.
- T4 Boo `raceBoo` · 180 psychic magic single rng 2, Discord 2, finisher Haunted ×1.5, 100MP 1AP.
**Problems.** None structural. Grave Chill shares the Ice Shard signature (100 ice, Slow 1, rng 3; Ice Spear is Slow 2 at rng 5) but is the family's only poke and none of these races own Ice Magic — keep. Cold Spot is the strongest T2 in the slice (a 3×3 that Freezes for 2 rounds is Flash Freeze on a zone); watch it in play, but it is a rung for ghost and jack o lantern and it is the family's control row. Possession is one of five possess rows in the game (Enthrall, Thrall Bite, Indoctrinate, and Zombie Behavior's Infect) but it is the original and on the right race.
**Changes.** None.
**Additions.** None — 5 rows, T1 2 / T2 1 / T3 1 / T4 1 is a finished shape.
**Upgrades.** Lingering on Haunt (3 → 4 rounds of 28) is the family's damage upgrade; Long Reach on Boo (rng 2 → 3) is the quality-of-life pick. Widen on Cold Spot should be blocked (a 5×5 rolling Freeze is too much) — give `raceColdSpot` a row field `noUpgrades: ['upWiden']` (NEW field; the SPELL_UPGRADES eligibility check gets one guard for it — the same field serves Sleep Paralysis/Lingering, Dream Siphon/Blast and Ghoulish Bite/Knockback below). Family-scoped: **Restless** (1 SP, families: [haunted]) on `raceHaunt`: when a Haunted target dies, Haunted jumps to the nearest enemy for its remaining rounds.

### ✦ Zombie Behavior `zombie` — VERDICT: GROW
**Identity.** The horde: cheap grabs, eat the fallen, infect one of theirs, and then everyone shambles in. Infected is the family's own setup for Shambling Horde.
**Races.** zombie — fits, sole owner (rule 2). No additions.
**Now.**
- T2 Cannibalize `raceCannibalize` · eat a corpse within 2, heal 35%, delays that respawn 2 rounds, 50MP.
- T2 Zombie Rush `raceZombieRush` · 130 physical dash rng 3, 50MP.
- T3 Infect `raceInfect` · melee, Infected 5: the target is YOURS for its next 4 activations (+1 ATK, +1 SPD, melee only), 75MP 1AP, no CD.
- T3 Outbreak `raceOutbreak` · 5×5 zone rng 4, Poison 2 reapplied for 3 rounds, no damage, finisher Poison ×1.5, 75MP **2AP**.
- T4 Shambling Horde `raceShamblingHorde` · 160 physical aoe r1 rng 3, finisher Infected ×1.5, 100MP 2AP.
**Problems.** The zombie has **70 MP** (races.md) and every row in its own family costs 50–100: it can cast ONE T2 and never Infect, Outbreak or Shambling Horde — two of its four tree rungs (the T3 pair at 75MP, Shambling Horde at 100MP) are unreachable; only Infectious Bite (25MP, Poison Abilities) and the Zombie Rush/Cannibalize rung (50MP) are castable. That is the whole problem with this family and it is a race-sheet problem: recommend zombie MP 70 → 150 (INT 0 stays; it casts physical rows only) rather than pinning off-ladder MP on every row. Infect is a T4-plus effect at T3 with no cooldown: 4 controlled activations vs Possession's 1 (T3, CD3) and Enthrall's 1–2. Outbreak's Poison finisher multiplies zero damage (dead clause). No T1.
**Changes.**
- REWRITE `raceInfect`: Infected 3, the target is yours for its next 2 activations (+1 ATK, +1 SPD, melee only), CD 3, 75MP 1AP. Still the strongest possess in the game, now priced like one.
- REWRITE `raceOutbreak`: 80 poison PHYSICAL damage on cast to every enemy in the 5×5 (SKEPTIC: was 'magic' — the zombie, the family's only owner, is INT 0, so a magic number here is zero; it is bile, not a spell), then Poison 2 reapplied for 3 rounds; drop the finisher; AP 2 → 1. Patient zero should hit something on arrival.
- RACE (flag for the race audit): zombie MP 70 → 150 so the family is castable.
**Additions.**
- NEW **Grab** — T1, damageEffect, -/physical, 25MP 1AP, rng 1, single, dmg 80, Root 1. "The hands do not let go. Deals WEAK physical damage and Roots the target for a round." The cheap opener the family lacks; a rooted target cannot leave the horde's reach before Zombie Rush/Shambling Horde land, and it is affordable even at 70 MP.
- PASSIVE: new family passive **Slow Rot** (T1, hook regenPerRound: 16 HP) — "It keeps getting up." A zero-MP sustain row for a race that cannot afford spells; pairs with the zombie's tank stats (660 HP / 84 DEF).
Family lands at T1 1 (+1 passive) / T2 2 / T3 2 / T4 1.
**Upgrades.** Surplus does not apply; Widen does not apply to Outbreak (already 5×5) — do not add a bigger Outbreak. Efficient on Shambling Horde (100 → 90) matters more here than anywhere. Lingering on Infect (Infected 3 → 4 rounds, activations unchanged).

### 🦴 Grave Hunger `ghoulish` — VERDICT: KEEP (retier)
**Identity.** Feeding on the fallen: bite, tear, burrow, eat the corpse, run the prey down. Grievous (healing halved) is the family's own wound; Feared is the payoff it borrows from Shadow.
**Races.** ghoul — fits (written for it; owns Shadow, so Fear → Terror Pounce is self-contained). **dreameater — fails the yeti test**: a psionic parasite that "feeds on REM-state neural activity" does not chew corpses or burrow; the only thing it shares with a ghoul is the word "feed". RACE_SWAP dreameater: Grave Hunger → Astral Projection (`astralprojection`: Astral Barrier, Spirit Walk — dream-state, on shaman/telepath/watcher; if the astralprojection slice deletes that family, the fallback is Trickery (`trickery`: Shed Skin / Skin Swap / Trick Room / Mimicry — the dreameater "appears as shifting humanoid form"); NOT Cryptid, the blurry-photo family of bigfoot and nessie, which fails the yeti test for an alien parasite); dreameater's T2 rung `raceCorpseCrawl` → `raceSleepParalysis` (retiered to T2 below). RACE_ADD zombie (from Necromancy, above): physical, corpse-eating, tank stats; Ghoulish Bite/Frenzy/Grab-then-Bite is a zombie's kit.
**Now.**
- T1 Frenzy `raceFrenzy` · 120 physical melee, drain 30%, Grievous 2, 25MP (flagged: T1 with dmg ≥120).
- T1 Ghoulish Bite `raceGhoulishBite` · 100 physical melee, Poison 2, drain 40%, 25MP.
- T2 Corpse Crawl `raceCorpseCrawl` · teleport 3, Invisible 1, CD2, 50MP.
- T3 Carrion Feast `raceCarrionFeast` · self heal 25%, 75MP.
- T4 Terror Pounce `raceTerrorPounce` · charge 3, 180 physical, purgeBuffs, finisher Feared ×1.5, 100MP 2AP.
**Problems.** Two T1 melee drains in the same family (same role twice; both are the ghoul's T1 rung). Frenzy at 120 is over-tuned for T1 (summary tier-rule offender). Carrion Feast is a worse Reassemble (25% for 75MP vs 30% for 50MP at T2) — wrong tier and no corpse in a family called Grave Hunger. Corpse Crawl is the Mist Form row exactly (teleport 3 + Invisible 1, CD2; Nimble Dodge is the same shape at teleport 2/CD3, Spirit Walk at teleport 4), but every assassin needs an escape and the burrow flavour is right — keep.
**Changes.**
- RETIER `raceFrenzy` T1 → T2 (50MP): dmg 120 → 130, drain 30%, Grievous 2. Ghoul's T1 rung `[raceGhoulishBite, raceFrenzy]` → `raceGhoulishBite`; T2 rung `[raceCorpseCrawl, raceFear]` → `[raceCorpseCrawl, raceFrenzy]`.
- REWRITE `raceCarrionFeast`: T3, 75MP 1AP CD 2, rng 2: feeds on a gravestone or pile of bones within 2 — heals 50% max HP and raises ATK by 1 stage; the remains are consumed (that unit's respawn delayed 2 rounds). Corpse-gated like Cannibalize (zombie T2, 35%), bigger because it is T3 — the two are now a ladder, not a clash.
**Additions.** None — the family lands at T1 1 / T2 2 / T3 1 / T4 1.
**Upgrades.** Lingering on Frenzy (Grievous 2 → 3). Exploit on Terror Pounce (Feared finisher 1.5 → 2.0) is the assassin's pick. Knockback on Ghoulish Bite should be blocked (a drain wants to stay in melee) — `raceGhoulishBite` gets `noUpgrades: ['upKnockback']`. Family-scoped: **Bottomless** (1 SP, families: [ghoulish]) on `raceCarrionFeast`: CD 2 → 0 and the respawn delay is 3 rounds.

### 🧛🏻 Vampiric Abilities `vampiricabilties` — VERDICT: KEEP (rewrite the magic rows)
**Identity.** The predator that heals by hurting: every damage row drains; open a wound (Grievous), make a thrall, then drop them from the sky. Physical, because the vampire is (ATK 61 / INT 31, assassin).
**Races.** vampire — fits, sole owner (rule 2). No additions (succubus drains through Seduction; blood-drinking demons have Blood Magic).
**Now.**
- T1 Lifetap `raceLifetap` · 80 blood MAGIC rng 2, drain 40%, 25MP.
- T2 Mist Form `raceMistForm` · teleport 3, Invisible 1, CD2, 50MP.
- T3 Bat Swarm `raceBatSwarm` · 125 shadow MAGIC aoe r1 rng 4, DEF −1, 75MP.
- T3 Thrall Bite `raceThrallBite` · 80 physical melee, drain 25%, Possessed 2, 75MP.
- T4 Predator Drop `racePredatorDrop` · 150 blood physical sky-drop (+15/level, carry 4), drain 20%, requiresFlight, 100MP 1AP.
**Problems.** Two of five rows scale off INT 31 on a 61-ATK assassin: Lifetap and Bat Swarm are near-dead for the only race that owns them. Bat Swarm is the same row as Bone Barrage (125 magic aoe DEF −1). The vampire has zero self-contained finishers (synergy.md: "self-contained 0") and applies only Invisible and Possessed. Predator Drop's `requiresFlight` is fine: vampire is in map.js `SKY_RACES`.
**Changes.**
- REWRITE `raceLifetap`: T1, damageEffect/lifeDrain, blood/physical, 25MP 1AP, rng 1, dmg 100, drain 40%, Grievous 2. "Open the vein. The wound will not close." Physical, and the family's own setup.
- REWRITE `raceBatSwarm`: T3, damage/lifeDrain, blood/physical, 75MP 1AP, rng 4, aoe r1, dmg 110, drain 30% of the total dealt. The only area drain in the game — the vampire's identity applied to a crowd — and it uses ATK.
- REWRITE `racePredatorDrop`: add finisher Grievous ×1.5 (fed by Lifetap); numbers otherwise unchanged, requiresFlight stays (the vampire flies).
**Additions.** None — T1 1 / T2 1 / T3 2 / T4 1 with every damage row draining is the family.
**Upgrades.** Lingering on Lifetap (Grievous 2 → 3). Widen on Bat Swarm is the 5×5 feed — do not add a larger swarm. Exploit on Predator Drop. Family-scoped: **Nightfeeder** (1 SP, families: [vampiricabilties]) on `raceBatSwarm`: drain 30% → 45% while Blood Rain weather is up (the vampire can bring it via Blood Magic's Summon Blood Rain).

### 🛌 Dream Predation `astral` — VERDICT: KEEP (retier)
**Identity.** Put them to sleep, then eat the dream: Stun is the family's setup and Dream Siphon / Nightmare Pulse are its payoffs; Eternal Slumber is the 5×5 version of both at once.
**Races.** succubus — fits (the succubus is the dream demon of the source folklore). dreameater — fits (written for it). No additions (telepath/grey are Psychic, not sleep).
**Now.**
- T1 Dream Siphon `raceDreamSiphon` · 100 magic drain 40%, finisher Stun ×1.5, rng 3, 25MP.
- T3 Nightmare Pulse `raceNightmarePulse` · 125 magic **self**-aoe r1, nothing else, 75MP.
- T3 Sleep Paralysis `raceSleepParalysis` · 125 magic single rng 3, Root 2, 75MP.
- T4 Eternal Slumber `raceEternalSlumber` · 160 magic aoe r2 rng 4, Stun 1, 100MP 2AP CD2.
**Problems.** No T2, two T3s. The T1 payoff (Stun finisher) has no setup below T4 — in-family Stun only arrives with Eternal Slumber, so Dream Siphon's finisher needs a teammate until 100MP. Sleep Paralysis applies Root, but sleep paralysis is "cannot move OR act" — that is Stun; the row is mis-statused and, with Root, is just Cuffed with better numbers. Nightmare Pulse is a plain self-centred 125 AOE on two 23/20-DEF support casters who should not be standing in the middle of the enemy.
**Changes.**
- RETIER `raceSleepParalysis` T3 → T2 (50MP, CD 2): dmg 125 → 60, status Root 2 → Stun 1, rng 3. Same tier and shape as Taser (police T2, 70 dmg + Stun 1, CD2). Now the T2 sets up the T1. Succubus's T3 rung `[raceSleepParalysis, raceEnthrall]` → `[raceNightmarePulse, raceEnthrall]`; dreameater's T2 rung → `raceSleepParalysis`.
- REWRITE `raceNightmarePulse`: T3, damage/lifeDrain, psychic/magic, 75MP 1AP, rng 3, aoe r1 (targeted, not self-centred), dmg 125, drain 25%, finisher Stun ×1.5. "The dream finishes eating." The AOE payoff for Sleep Paralysis / Eternal Slumber, cast from the back line.
**Additions.** None — the family lands at T1 1 / T2 1 / T3 1 / T4 1 as a closed setup-payoff loop.
**Upgrades.** Efficient on Eternal Slumber (it is 2AP, 100MP on 220/225-MP casters). Lingering on Sleep Paralysis should be blocked (Stun 2 at T2 is too much) — `raceSleepParalysis` gets `noUpgrades: ['upLinger']`. Forked on Dream Siphon. Blast on Dream Siphon is redundant with Nightmare Pulse — `raceDreamSiphon` gets `noUpgrades: ['upBlast']`. No family-scoped upgrade needed.

SPELL COUNT: 58 → 62 for this group (plus 1 new family passive, Slow Rot)
