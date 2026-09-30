# SPELL FAMILY AUDIT — findings and plan (2026-09-30)

_Front matter (verdict, principles, master change tables, implementation order) pending synthesis — see SPELL_FAMILY_AUDIT_HANDOFF.md §6. The sections below are the verified audit._


---

## F. Cross-family audit — redundancy, tiers, costs, dead fields


Ground rules used below (derived from the data, then applied everywhere): the cheapest live instance of an effect sets its tier. A self ATK+1 is a T1 (End Zone Dance `raceEndZoneDance`, 25 MP). A Rooted 2 debuff is a T1 (Anchor `raceAnchor`). An ATK+1 aura is a T1 (Royal Decree `raceRoyalDecree`, 1 AP). A 3-tile self-teleport is a T1 (Mirror Blink `raceMirrorBlink`). A single-target 100-damage hit is the T1 unit (91 T1 rows, median 100). T2 single = 130 (Zombie Rush, Land Ho, Thunderbolt), T3 single = 125–135, T4 single = 180. AOE r1: T1 80, T2 100–110, T3 125, T4 160. A T4 must be 1 AP unless it is categorically bigger than a T3 (r2 + status, a revive, a summon). Same-family duplicates die; cross-family duplicates survive only if the family has no better use for the slot AND the tier matches the cheapest instance.

Aliases (one object, listed twice — never counted as a pair): `sharedRampart`=`rampart`, `raceEmpPulse`=`empBurst`, `raceOverclock`=`overclock`, `raceRampage`=`rampage`, `raceSuppressingFire`=`raceSuppressiveFire`, `raceChassisSlan`=`raceChassisSlam`, `raceLavaLamp`=`racePlasmaWhip`.

### 1. Redundancy groups — a verdict for every group

| Group (role/kind/shape) | Member (name `id` family T# dmg MP) | Verdict |
|---|---|---|
| **A. Self ATK+1 buff** (effect/buff, 15 rows — 14 self-buffs plus the ally-targeted Wish Granted; the sentence "Empowers the caster. Raises ATK by 1 stage." opens 14 of them, all but Wish Granted) | End Zone Dance `raceEndZoneDance` football T1 – 25 | KEEP — the baseline; it sets the price (T1, 25 MP, 1 AP). |
| | Sad Backstory `raceSadBackstory` maincharacter T1 – 25 | REWRITE INTO **conditional surge**: ATK+1, and ATK+2 instead while the caster is under 50% HP (needs a small `stageIfBelowPct` patch; nearest live hook is the passive `lowHpBonus` object). Keeps T1. |
| | Death Pact `raceDeathPact` blackmagic T1 – 25 | REWRITE INTO **the pact**: ATK+1 now; if the caster dies within 3 rounds its killer is Hexed 3 (`onDeathApplyStatus` — new key; Hexed already has 3 payoffs). T1. |
| | Forest Ambush `raceForestAmbush` huntingskills T1 – 25 | DELETE. MERGE its ATK+1 into Camouflage `camouflage` (T2: Invisible 1 + ATK+1 = the ambush). |
| | Hellfire Crown `raceHellfireCrown` infernalcourt T1 – 25 | REWRITE INTO **crown of fire**: M ATK+1 and the `incendiary` status 2 rounds (basic attacks Burn 1). The status already exists (Incendiary Rounds `raceIncendiaryRounds`). T1. |
| | Inner Demon `raceInnerDemon` demonicabilities T1 – 25 (costs 20% HP, CD2) | REWRITE: ATK+2 for 20% HP, CD2. Paying HP for what End Zone Dance gives free is a trap row today. T1. |
| | Overcalculate `raceOvercalculate` artificialintelligence T2 – 50 | REWRITE: M ATK+1 and M DEF+1 (self). The AI's damage rows are magic (Recursive Loop, Singularity) — an ATK buff on it was a lie by construction. T2 stands for two stages. |
| | Siege Mode `raceSiegeMode` mecha T2 – 50 | REWRITE INTO **a real siege mode**: ATK+1, DEF+1, self Rooted 2. Two stages for a self-root — T2. |
| | Ki Charge `raceKiCharge` ki T2 – 50 | REWRITE: ATK+1 and M ATK+1 (the ki fighter has Flurry (physical) and Ki Volley (magic)). T2. |
| | Howl `raceHowl` werewolf T2 – 50 | REWRITE INTO a pack call: warCry aura r3, allies ATK+1 and SPD+1. T2 (War Cry `warCry` gives +2 ATK at T2; +1/+1 is the same weight). |
| | Grim Resolve `raceGrimResolve` shadow T2 – **25 (off-ladder)** | BECOMES PASSIVE "Grim Resolve" (1 SP, families: shadow): hook `lowHpBonus: {threshold: 0.3, dmgMult: 1.25}` — +25% damage to enemies at or under 30% HP. "You make a list." The 25-MP pin already said this was not a T2. |
| | Underdog Spirit `raceUnderdogSpirit` humangrit T3 – 75 | REWRITE: ATK+2 and cleanse 1 (T3; Mimicry `raceMimicry` is +2/+2 at T4). Matches the g7 slice. |
| | Monkey Business `raceApeFury` apeintelligence T3 – 75 | REWRITE INTO **monkey business**: strip every buff/stage off a Single Enemy within 3 (`purgeBuffs`, live on Terror Pounce) and the caster gains ATK+1, DEF+1. T3. |
| | Blood Ritual `raceBloodRitual` blood T3 – 75 (costs 10% HP) | REWRITE INTO **the coven rite**: caster loses 15% HP; every ally within 2 gains ATK+1 and Regen 2. T3. |
| | Wish Granted `raceWishGranted` arcane T3 – 75 (ally, +cleanse 2) | REWRITE: a Single Ally regains 50 MP, gains ATK+1 and M ATK+1, and is cleansed of 2. MP restore exists (Free Energy `freeEnergy`). T3. |
| **A2. Self SPD+1** | Nitro Boost `raceNitroBoost` drivingskills T3 – 75 | RETIER → T2 and REWRITE: SPD+2 (one stage of SPD at T3 is a T1 effect priced ×3). |
| **B. Self DEF+1 buff** (5 identical rows, all T2 50 MP) | Thick Hide `raceThickHide` athleticism T2 | RETIER → T1 (a one-stage self buff is the T1 unit) — or DELETE if the athleticism rebuild in g7 drops it. |
| | Chitin Armor `raceChitinArmor` insectoid T2 | REWRITE: DEF+1 and immune to Poison for 2 rounds (new `immuneStatus` key; Corroded counts). T2. |
| | Stone Skin `raceStoneSkin` livingstone T2 | REWRITE: DEF+2, SPD−1 (stone is heavy). T2. Living Stone also has Stoneform `raceStoneform` T2 — three T2 rows in a 4-row family (Gothic Rampart is a wall, so two of them are self-buffs); this one must differ. |
| | Iron Bulwark `raceIronBulwark` militarysupport T2 | REWRITE: DEF+1 and M DEF+1 (a bulwark). T2. |
| | Plot Armor `racePlotArmor` maincharacter T2 | BECOMES PASSIVE "Plot Armor" (2 SP, families: maincharacter): hook `healOnceBelowPct: {pct: 25, healPct: 30}` — once per life, dropping under 25% heals 30%. Literal plot armor; Martyr's Talisman `gearMartyrsTalisman` is the 1-HP version, this is the heal version. |
| | Tin Foil Hat `raceTinFoilHat` conspiracyknowledge T1 (ally M DEF+1) | KEEP — ally-targeted, T1, the correct price for one stage. |
| **C. ATK+1 warcries** (effect/warCry aoe r2) | Royal Decree `raceRoyalDecree` royalty T1 – 25, 1 AP | KEEP — the baseline. |
| | Rally Command `raceRallyCommand` militarysupport T1 – 25, **2 AP** | RECOST: 2 AP → 1 AP (it is Royal Decree with an AP tax). |
| | Oath of Valor `raceOathOfValor` knight T3 – 75, aura r2 | REWRITE: allies within 2 gain ATK+1 and DEF+1 and cleanse 1. As shipped it is Royal Decree at T3. |
| | Apex Roar `raceApexRoar` apexpredator T3 – 75, aura r2 | REWRITE: allies within 2 ATK+1 AND every enemy within 2 Discord 1 (Primal Roar `racePrimalRoar` T1 in the same family already does Discord 2 r1, so this is the roar that does both). T3. |
| | Swarm Signal `raceSwarmSignal` insectoid T4 – 100, aoe r2, stage atk+2 | RETIER/REWRITE: War Cry `warCry` (sonic T2, aura r3) gives allies +2 ATK and self +1 for 50 MP — Swarm Signal is strictly worse at T4. Make it T4-worthy: aura r3, allies ATK+2 and DEF+1, 2 rounds… or fold to T3 with atk+2. Fix the desc either way (it says +1). |
| | War Cry `warCry` sonic T2 – 50, aura r3, allies +2 / self +1 | KEEP — the T2 warcry unit. |
| | Extended Clips `raceExtendedClips` weaponstraining T4 – 100, aura r3, team status 3 rounds (+1 range, +1 ATK) | KEEP at T4 only because range+1 for a gun team is categorical; otherwise T3. |
| | Audible `raceAudible` football T3 – 75, aura r2 SPD+1 | RETIER → T2 (one stage aura = Royal Decree weight; SPD is worth one tier more, not two). |
| | Telepathic Link `raceTelepathicLink` psychic T1 – 25, aura r3 M ATK+1 | KEEP (T1 aura unit, magic side). |
| **D. Overclock buffs** | Overclock `overclock` robot T2 – 50, ally, overclock 2 | KEEP — the unit. |
| | Black Budget `raceBlackBudget` deepstate T2 – 50, ally, overclock 1 | MERGE INTO Overclock's numbers (overclock 2) or REWRITE INTO **funding**: ally regains 50 MP and gains overclock 1. Deep State needs a distinct identity, take the rewrite. |
| | Prophecy Fulfilled `raceProphecyFulfilled` maincharacter T3 – 75, self, overclock 1, **2 AP** | REWRITE: self overclock 2 and ATK+1, 1 AP (T3). As shipped it is Overclock on yourself for +25 MP and +1 AP. |
| **E. Protect buffs** | Protect `protect1` light T2 – 50, ally, protect 1, CD3 | KEEP — the unit. |
| | Rapture `raceRapture` angelic T1 – 25, ally, protect 1, **2 AP**, CD2 | DELETE. Four of the six angelic races (priest, angel, seraphim, nun) also have light → two Protects in one pool; the 2 AP makes this one the worse copy. The other two angelic races do not carry light: fallen angel keeps its own Abyssal Wings `raceAbyssalWings`, valkraye loses its only Protect (acceptable — it keeps Holy Bulwark / Shield Maiden shields). |
| | Abyssal Wings `raceAbyssalWings` fallenangel T2 – 50, self, protect 1, CD2 | REWRITE: self protect 1 AND Levitating 1 (temporary flight — the wings), which turns on Descending Wrath's `requiresFlight`. T2. |
| | Invulnerable `raceInvulnerable` superheropowers T2 – 50, self, protect 2, **2 AP**, CD2 | RECOST: 2 AP → 1 AP; keep protect 2 / CD2. |
| | Black Guard `sentaiBlackGuard` sentai T2 – 50, self, protect 2, CD2 | KEEP (Sentai is a single-race closed set; identical to a fixed Invulnerable, acceptable under rule 2). |
| **F. Regen buffs** | Symbiote Armor `raceSymbioteArmor` symbiosis T2 – 50, regen 2 | REWRITE: regen 2 + DEF+1 (armor). T2. |
| | Mitosis `raceMitosisSplit` ooze T4 – 100, regen 2 | REWRITE INTO **mitosis**: spawn a decoy clone (`spawnDecoy`, live on Shed Skin) with 30% of max HP that draws attacks, and Regen 2 on the caster. Regen 2 alone at T4 is a T2 row priced ×2. |
| **G. Invisible self-buff** | Blurry Photo `raceRealityShift` cryptid T2 – 50, invis 2, cleanse 99, CD2 | KEEP — the best of the three, correctly T2. |
| | Camouflage `camouflage` huntingskills T2 – 50, invis 1, CD2 | REWRITE: invis 1 + ATK+1 (absorbs Forest Ambush). T2. |
| | Phase Shift `racePhaseShift` shadow T3 – 75, invis 1, CD2 | RETIER → T2, or REWRITE for T3: invis 1 and the caster may move through units this round (phasing — `unitIsPhasing` exists in the engine). Take the rewrite; shadow has three T2s already. |
| **H. Escape: teleport + Invisible** (movement/escape) | Agent Vanish `raceAgentVanish` spygear T2 – 50, 3 tiles, invis 2, CD2 | KEEP — the T2 ceiling of the shape. |
| | Mist Form `raceMistForm` vampiricabilties T2 – 3 tiles, invis 1, CD2 | KEEP (single-race family). |
| | Corpse Crawl `raceCorpseCrawl` ghoulish T2 – 3 tiles, invis 1, CD2 | KEEP (burrow flavour; ghoul/dreameater only). |
| | QB Sneak `raceQBSneak` football T2 – 3 tiles, invis 1, CD2 | KEEP (single race). |
| | Spirit Walk `raceSpiritWalk` astralprojection T2 – 4 tiles, invis 1, CD2 | KEEP (4 tiles is the differentiator). |
| | Nimble Dodge `raceNimbleDodge` athleticism T2 – 2 tiles, invis 1, **CD3** | RECOST: CD3 → CD2 and 2 → 3 tiles, or it is the worst of six identical rows at the same tier. |
| | Cryptid Vanish `raceCryptidVanish` cryptid T3 – 75, 2 tiles, invis 2, CD2 | RETIER → T2 — dominated by Agent Vanish (T2, 3 tiles, invis 2). Cryptid then has Blurry Photo + Cryptid Vanish both T2 both invisible; REWRITE Vanish to invis 2 + cleanse 99 + 3 tiles and DELETE Blurry Photo's cleanse, or MOVE one. Simplest: DELETE Cryptid Vanish, keep Blurry Photo. |
| | Treeline Retreat `raceTreelineRetreat` nature T2 – 3 tiles, regen 2 | KEEP — distinct payload. |
| | Deep Dive `raceDeepDive` deepsea T2 – 3 tiles, protect 1, CD2 | KEEP — distinct payload. |
| | Shed Skin `raceShedSkin` trickery T2 – 2 tiles, cleanse 1, decoy | KEEP — distinct payload. |
| | Eject! `raceEject` mecha T3 – 75, 3 tiles, nothing | RETIER → T1 or REWRITE: teleport 3 and the empty mech stays behind as a 100-HP decoy object (`spawnDecoy`) — then T3 is earned. As shipped it is Phase Walk (T2) at T3 with an "escape" label. |
| **I. Plain teleports** | Mirror Blink `raceMirrorBlink` prismlattice T1 – 25, 3 tiles | KEEP — sets the price: 3 tiles self = T1. |
| | Door Dash `raceDoorDash` door T1 – 25, 5 tiles, no opportunity strikes | KEEP (UNIQUE-ish flavour), but 5 tiles at T1 is the ceiling; nothing else may exceed it below T3. |
| | Phase Walk `racePhaseWalk` cosmic T2 – 50, 3 tiles | RETIER → T1. |
| | Gravity Boots `raceGravityBoots` astronautcamp T2 – 50, 3 tiles | RETIER → T1 (it is the family's only row; fine at T1). |
| | Ocean Current `raceJellyDrift` deepsea T2 – 50, 3 tiles | RETIER → T1, or REWRITE: 3 tiles and must end on/next to water for +2 range. |
| | Shadow Step `raceShadowStep` shadow T3 – 75, 4 tiles, ignores LoS, CD2 | RETIER → T2 (ignores LoS is worth one tier over Mirror Blink, not two). |
| | Instant Transmission `raceInstantTransmission` ki T3 – 75, 5 tiles | REWRITE for T3: 5 tiles and does not end the turn / costs 0 AP once per round (the whole point of the technique) — or RETIER → T2. |
| | Teleport `teleport` psychic T3 – 75, 4 tiles, any unit incl. enemy | KEEP — moving an enemy is categorical; T3 earned. |
| | Icky Surprise `raceIckySurprise` ooze T2 – 50, 6 tiles, ooze tiles only, no LoS | KEEP — conditional; distinct. |
| **J. Swaps** (movement/swap) | Dimensional Fold `raceDimensionalFold` fractal T1 – 25, rng 5, any unit | RETIER → T2 (it is strictly the best swap and sits at the lowest tier). |
| | Miracle `raceWingsOfMercy` angelic T2 – 50, rng 4, ally heals on arrival | KEEP — the T2 swap with a payload. |
| | Skin Swap `raceSkinSwap` trickery T3 – 75, rng 4 | RETIER → T2 and add: the target enemy is Marked 1 (you wore its skin). Two swaps at T3 with nothing extra is the same spell twice. |
| | Temporal Shift `raceTemporalShift` temporal T3 – 75, rng 3 | REWRITE for T3: swap AND the swapped enemy loses its next activation's first AP (Stagger 1) — time skipped. Otherwise T2. |
| | Knights of Round `raceKnightsOfRound` royalty T3 – pull every ally to the caster | KEEP — categorical. |
| **K. Shields** (effect/aoeShield, effect/shield) | Fortify `fortify` militarysupport T1 – 25, single, 96 | KEEP — T1 single shield unit (~100). |
| | Pupil Shield `racePupilShield` eyesight T1 – 25, "aoe r0" = single tile, 130 | REWRITE kind → `shield` single, 110. It is a single-target shield mislabelled as an AOE; at 130 it beats Psychic Barrier (T2, 150) per MP. |
| | Astral Barrier `raceAstralBarrier` astralprojection T1 – 25, aoe r1 self, 90 | KEEP — T1 area shield unit (small number, self-centred). |
| | Psychic Barrier `racePsychicBarrier` psychic T2 – 50, single, 150 | KEEP — T2 single unit. |
| | Prayer `racePrayer` biblestudy T3 – 75, single, 150 | REWRITE: 150 shield + Blessed 2 (the family's own status; Blessing `raceBlessing` gives Blessed 3 at T2) — or RETIER → T2. As shipped it is Psychic Barrier at T3. |
| | Luminous Shield `raceLuminousShield` light T2 – 50, aoe r0, 140 | DELETE — same family as Light Shield. |
| | Light Shield `racePleiadianShield` light T2 – 50, aoe r0, 220 + DEF+1 | RETIER → T3 (220 + a stage is the biggest shield in the game; T3 fills light's single T3 slot beside Prism Burst) and make it aoe r1. |
| | Shield Maiden `raceShieldMaiden` holydefense T2 – 50, aoe r0, 120 | DELETE — same family as Holy Bulwark. |
| | Holy Bulwark `raceHolyBulwark` holydefense T2 – 50, aoe r1, 160 | KEEP — T2 area unit (aoe r1 140–160). |
| | Tinker's Contraption `raceTinkersContraption` trapmaking T2 – 50, aoe r0, 100 | REWRITE INTO the clockwork turret (see Turrets): trapmaking gets a deployable, and a fifth generic shield dies. |
| | Firewall Protocol `raceFirewallProtocol` computerhacking T3 – 75, aoe r1, 120, **2 AP** | RECOST/REWRITE: 1 AP, 140, and allies inside are immune to Jammed while shielded (tech identity). As shipped it is worse than Holy Bulwark (T2, 1 AP, 160). |
| | Overtinker `raceOvertinker` engineering T4 – 100, self-aoe r2, 160, 2 AP | KEEP (r2 + contraptions is categorical). |
| **L1. Single heals** (heal/heal) | Heal `heal1` healingmagic T1 – 25, 192 (+48 under 40%) | RECOST: 150 base, keep `lowHpBonus` 48 — a 192 heal at T1 dominates Palm Read (T2, 190 + cleanse 2). |
| | Divine Light `raceDivineLight` angelic T1 – 25, 140 | KEEP — T1 unit (140–160). |
| | Herbal Remedy `raceHerbalRemedy` nature T1 – 25, 160 + cleanse 2 | KEEP (desc must mention the cleanse). |
| | Repair `repair` engineering T1 – 25, 155 | KEEP. |
| | Pink Healing `sentaiPinkHeal` sentai T2 – 50, 140 | RETIER → T1 (it is Divine Light at T2). |
| | Absolution `raceAbsolution` biblestudy T2 – 50, 80 + cleanse 99 | KEEP — the full cleanse is the payload; desc must say so. |
| | Green Arrow `sentaiGreenArrow` archery T2 – **25**, healAmt MISSING (`statusEffects: 'heal'` is a string → "status:undefined") | REWRITE the row: `healAmt: 150`, drop the bad `statusEffects`, T1 25 MP (rng 5 is the ranged-heal identity). |
| | Palm Read `raceSpiritChannel` fortunetelling T2 – 50, 190 + cleanse 2 | KEEP — T2 unit. |
| **L2. Heal All** | Heal All `healAll` healingmagic T3 – 75, 140 | KEEP — T3 unit. |
| | Hallelujah `raceHallelujah` biblestudy T4 – 100, 180 + cleanse 2, 2 AP | RECOST 2 AP → 1 AP (T4 heal-all with a cleanse is already categorical). |
| | Yo Ho `raceYoHo` piracy T3 – 75, 130 + ATK+1 / M ATK−1 + cleanse 2, 2 AP | RECOST 2 AP → 1 AP. |
| | Iron Dome `shieldBash` militarysupport T3 – heal 0, all allies DEF+1 | REWRITE kind → `warCry` (aura r99, DEF+1). It is filed as a heal and heals 0 — it inflates every "sustain" count in summary.md for marksman/mech/general/politician. |
| | Nordic Accord `raceNordicAccord` galacticfederation T4 – heal 0, all allies M DEF+1 & M ATK+1 | REWRITE kind → `warCry` (aura r99). Same lie. |
| **L3. Self heals** | Reassemble `raceReassemble` bonedensity T2 – 30% | KEEP — T2 unit (30–35%). |
| | Self-Repair Protocol `raceSelfRepairProtocol` robot T2 – 35% + cleanse 1 | KEEP. |
| | Adrenaline Rush `raceAdrenalineRush` humangrit T2 – **55%** + SPD+1 + cleanse 2 | RECOST 55% → 40% (g7 agrees). |
| | Carrion Feast `raceCarrionFeast` ghoulish T3 – 75, **25%** | REWRITE for T3: 25% + 15% more per corpse/gravestone within 2 (Cannibalize `raceCannibalize` proves remains are addressable) and Grievous is cleansed — or RETIER → T1. A T3 that heals less than both T2s is the clearest tier error in the heal column. |
| | Immortal Cycle `raceJellyRebirth` jellyfish T4 – 50% + cleanse 2, CD4 | KEEP. |
| | Ayahuasca Retreat `raceAyahuascaRetreat` nature T3 – 50% + M DEF+1 + cleanse 99, 2 AP | RECOST 2 AP → 1 AP, 50% → 40%. |
| | Awakening `raceAwakening` meditation T4 – 30% + ATK+2 SPD+2 + cleanse 99, 2 AP CD3 | KEEP (categorical). |
| **L4. Zone heals** | Tidal Blessing `raceTidalBlessing` water T2 – 52/turn × 2 | KEEP. |
| | Sanctuary `raceSanctuary` angelic T3 – 48/turn × 2 | RECOST 48 → 80 (a T3 that ticks less than the T2). |
| | Temporal Tide `raceTemporalTide` water T3 – 100/turn × 2 | KEEP — but water then has two zone heals (T2 52, T3 100); acceptable as a ladder. |
| **L5. Revives** | Revive `revive1` healingmagic T4 – 45%, 1 AP | KEEP. |
| | Chooser of the Slain `raceChooserOfSlain` holydefense T4 – (no `revivePct` shown), 2 AP | REWRITE: revive at 60% with Protect 1 on the risen ally (the valkyrie chooses). DELETE is not an option: neither crystal guardian (livingstone, prismlattice, holydefense, earth) nor valkraye (holydefense, angelic, wind) carries Healing Magic, so this is the only revive in both pools — and it is valkraye's T4 tree rung. |
| **M1. Debuff: Stun** ("Weakens a Single Enemy. Applies Stun.") | Hypnotic Pulse `raceHypnoticPulse` eyesight T3 – 75, 1 AP | KEEP — sets the price: pure Stun 1 = T3, 1 AP. |
| | Blue Screen `raceBlueScreen` computerhacking T3 – 75, **2 AP** | REWRITE: 1 AP, Stun 1 + Jammed 1 (the tech stun). |
| | Executive Order `raceExecutiveOrder` politics T3 – 75, **2 AP** | REWRITE: 1 AP, Stun 1 + Silence 1 (a gag order). |
| | Stasis Beam `raceStasisBeam` galacticfederation T3 – 75, 1 AP, groundsFlyers | KEEP (the flyer rider). |
| | Stun Ray `raceStunRay` alientechnology **T1** – 25, **100 dmg + Stun 1** | RETIER → T2 and RECOST 100 → 70, CD2 (= Taser `racePoliceTaser`, the honest damage+stun T2). A T1 that deals a full T1 hit AND the T3 debuff is the single most over-tuned row in the rack. |
| **M2. Debuff: Root** | Anchor `raceAnchor` piracy T1 – 25, root 2, rng 3, groundsFlyers | KEEP — sets the price: root 2 = T1. |
| | Iron Grip `ironGrip` dirtyfighting T2 – 50, root 2, rng 1, groundsFlyers | RETIER → T1, or REWRITE for T2: root 2 + the target cannot be pushed/pulled out of the grip (Stagger 1 stands in). As shipped it is Anchor with less range at a higher tier. |
| | Cuffed `racePoliceCuffs` policetraining T3 – 75, 60 dmg + root 2, rng 1 | RETIER → T2 and add Silence 1 ("hands behind your back" — no casting). A T3 whose whole payload is a T1's. |
| **M3. Debuff: Marked** | Predictive Model `racePredictiveModel` artificialintelligence T1 – marked 3 (bonusDamage 35) | KEEP — the unit. |
| | Red Eyes `raceRedEyes` mothman T1 – marked 3 | KEEP (single-race family; mothman needs a T1). |
| | Implant `raceImplant` ufo T2 – marked 3 | REWRITE for T2: marked 3 + `scanner` 3 (the implant tracks them through fog — status exists on System Analysis). |
| | Infernal Conscription `raceInfernalConscription` infernalcourt T2 – marked 3 | DELETE — a T1 effect at T2 in a 7-row family with three T4s. |
| | Knife Throw `knifeThrow` spygear T1 – 100 dmg + marked 1 | KEEP (marked 1 on a hit is a rider, not the debuff). |
| **M4. Debuff: Jammed** | Deneuralizer `raceDeneuralizer` advancedtechnology T1 – jammed 2 | KEEP — the unit. |
| | Memory Leak `raceMemoryLeak` computerhacking T2 – jammed 2 | REWRITE for T2: jammed 2 + the target loses 30 MP (`mpDrain` — new key; the "leak"). |
| | Neural Hack `raceNeuralHack` computerhacking T3 – **jammed 1** | DELETE (a T3 that gives one round less than the T1), or REWRITE into a real hack: Possessed 1 if the target is a `tech` type, Jammed 2 otherwise (needs `requiresTargetType`). Prefer the rewrite — it is the only possession a hacker should have. |
| **M5. Debuff: Hexed** | Hex of Agony `sharedHexOfToil` witchcraft T2 – hexed 3 | KEEP. |
| | Family Curse `raceCurseOfMisfortune` witchcraft T3 – hexed 3 | REWRITE: hexed 3 on the target AND every enemy adjacent to it (aoe r1) — the curse takes the family. Same family, identical row today. |
| **M6. Debuff: Discord** | Discordance `discordance` sonic T1 – discord 2, rng 3 | KEEP — sets the price. |
| | Brainwash `raceBrainwash` deepstate T3 – discord 2, rng 3 | REWRITE for T3: Charm 2 + Discord 2 (The Kool-Aid `raceCultKoolAid` sells Charm 2 alone at T2). |
| | Spotlight `racePopSpotlight` stagepresence T3 – DEF−1, M DEF−1, CD2 | RETIER → T2 (two stages ≈ Psychosis+Valkyrie rider; Discordance gives three stages' worth at T1). |
| **M7. Debuff: ATK−1** | Steal from the Rich `raceStealFromRich` thievery T2 – atk−1 | REWRITE: target ATK−1 AND the lowest-HP ally within 4 gains ATK+1 (give to the poor). T2. |
| | Naughty List `raceNaughtyList` christmasspirit T3 – atk−1 | RETIER → T2 and REWRITE: ATK−1, DEF−1, Marked 3 ("you're on the list"). A single stage at T3 is dominated by Discordance at T1. |
| **M8. Debuff: misc stages** | Psychosis `psychosis` psychic T2 – M DEF−1 | RETIER → T1 (one stage). |
| | Calcify `raceCalcify` livingstone T3 – M ATK−2 | KEEP (two stages, T3 is a touch high; T2 would be exact). RETIER → T2. |
| | Polymorph `racePolymorph` arcane T3 – ATK−1 M ATK−1, **2 AP**, CD3 | REWRITE INTO a polymorph: Silence 2 + Minimized 2, 1 AP, CD3. (Shrink Ray `sharedShrinkRay` sells Minimized 3 alone at T3.) |
| | Shrink Ray `sharedShrinkRay` alientechnology T3 – minimize 3 | KEEP. |
| | Charm `raceCharm` seduction T2 – charm 1 · The Kool-Aid `raceCultKoolAid` cult T2 – charm 2, CD2 | KEEP both (charm 1 vs 2 with CD; different single-race pools). Charm should read charm 2 CD2 too — same number, one price. |
| | Provoke `provoke` sonic T2 – taunt 2 | KEEP (taunt has no payoff — see §3; it is its own reward). |
| **N. Possess** (effect/possess, all T3) | Possession `racePossession` haunted – rng 3, CD3 | KEEP — the unit. |
| | Indoctrinate `raceCultIndoctrinate` cult – rng 2, CD3 | REWRITE: on top of Possessed 1, the target is Charmed 1 after the possession ends (it stays loyal one more round). Otherwise it is Possession with 1 less range. |
| | Enthrall `raceEnthrall` seduction – rng 2, ×2 activations on Charmed | KEEP — the finisher version. |
| | Thrall Bite `raceThrallBite` vampiricabilties – 80 dmg + drain .25 + possess | KEEP — damage+possess is distinct. |
| | Infect `raceInfect` zombie – infected 5 (4 activations, melee only, +1 ATK/SPD) | KEEP — categorical (a T4 in a T3 slot: 4 activations vs 1). RETIER → T4? zombie already has Shambling Horde at T4 and it pays Infected. Leave at T3 but CD3. |
| **O. T1 single-target ~100 dmg, no rider** (damage/damage) | Brave Charge `guardSlash` horsebackriding T1 100 · Heroic Leap `raceHeroicLeap` superheropowers T1 100 · Dark Justice `raceDarkJustice` dirtyfighting T1 100 (all "charge into melee first") | Brave Charge KEEP (the family's only row). Heroic Leap KEEP (superhero's T1). Dark Justice DELETE (dead `bonusVsDebuffed`; dirtyfighting has Body Check and Curb Stomp at T1). |
| | Borrowed Claw `raceBorrowedClaw` beastabilities T1 100, CD3, `stealSpell` | RETIER → T2. Spellsteal `raceSpellsteal` (arcane T2, CD3) does the steal with NO damage; this does it with a full hit at T1. |
| | Crash Loop `raceCrashLoop` computerhacking T1 100 (jammed finisher) · Synthetic Punch `raceHydraulicPunch` robot T1 100 push 2 (jammed finisher) · Rocket Fist `raceRocketFist` robot T1 100 push 2 rng 3 · Tail Whip `raceDinoTailWhip` beastabilities T1 100 push 2 | KEEP all: a finisher or a push is a rider. Rocket Fist vs Synthetic Punch (same family): ranged vs melee+finisher — KEEP both, note Rocket Fist is Synthetic Punch with Long Reach ×2 minus the finisher. |
| | Smite `raceSmite` light T1 100 (`bonusVsUnholy` 0.5) · Radiant Bolt `radiantBolt` angelic T1 100 (`unholyBonus` 40) · Probe `raceProbe` ufo T1 100 · Fireball `fire1` fire T1 80 · Elbow Grease `raceElbowGrease` humangrit T1 90 · Improvise `improvise` humangrit T1 80 · Bone Toss `raceBoneToss` bonedensity T1 80 ignoreArmor | Smite/Radiant Bolt: both T1 holy hits with an undocumented unholy bonus; KEEP one per family (priest/angel/seraphim/nun carry both light and angelic → two copies in one pool). DELETE Radiant Bolt (angelic keeps Divine Light, Purify at T1). Probe KEEP (ufo's only T1). Fireball RECOST 80 → 100 (the T1 unit; fire has no other T1). Improvise DELETE (g7). Bone Toss KEEP (ignoreArmor at 80 is the right trade). |
| | Big Kick `raceBigKick` sasquatch T1 **120** · Pounce `racePounce` beastabilities T1 **120** rng 3 · Boulder Hurl `raceBoulderHurl` earth T1 100 (stagger finisher) · Stone Throw `raceStoneThrow` stoneage T1 100 rng 5 LoS (stun finisher) | Big Kick RECOST → 100 (it is Stone Throw + Empowered). Pounce RECOST → 100 (rng 3 is already its edge). Boulder Hurl, Stone Throw KEEP. |
| **P. T2/T3 single-target damage-only** | Zombie Rush `raceZombieRush` zombie T2 130 · Land Ho `raceBoardingRush` piracy T2 130 (root finisher) · Thunderbolt `thunder1` lightning T2 130 (chain [125,82,50]) | KEEP all three — T2 single = 130 is consistent. Thunderbolt's chain must be in the desc (it reads as a plain bolt). |
| | Ambush Lunge `raceAmbushLunge` beastabilities T3 125 | DELETE — Pounce (T1, 120, rng 3) is the same move; a T3 for +5 damage. |
| | Recursive Loop `raceRecursiveLoop` artificialintelligence T3 125 (dead `bonusVsDebuffed`) | REWRITE: 125 + `bonusVsStatus: {status: ['jammed','marked','scanner'], mult: 1.5}` — "debuffed" made real with the family's own statuses (Predictive Model marks at T1). |
| | Long Rifle `raceQuickDraw` huntingskills T3 125 rng 5 | REWRITE: 135, rng 6, `ignoresLineOfSight` false but `ignoreArmor` true (a long rifle round). Precision Shot (T3, 125, rng 5, root finisher) already owns "125 at range 5". |
| | Precision Shot `precisionShot` marksmanship T3 125 rng 5 (root finisher) | KEEP. |
| | To Be Continued `raceToBeContinued` maincharacter T3 135, lands at end of round | RECOST 135 → 160 (a delayed hit is a downside; Take Aim pays 180 for the same delay at T4). |
| | Hydraulic Crush `raceHydraulicCrush` machinery T3 135 rng 1 (jammed finisher) · Robo Punch `raceRoboPunch` robot T3 135 rng 1 (stagger finisher) | KEEP both — robot and honda civic carry both families, so a robot player picks by finisher. |
| | Trunk Throw `trunkThrow` nature T3 **100** rng 4 | RECOST → 125 base (Green Thumb `passiveGreenThumb` adds +30 per tree — the passive was covering for the number). |
| | Dragon Toss `raceDragonToss` dragonabilities T3 **70** + 25/level + collision 60 (burn finisher, requiresFlight) | KEEP the shape, RECOST base 70 → 100 (Abduction Beam `raceAbductionBeam` is 110 + 25/level at T3 with no flight requirement). |
| | Spike the Ball `raceSpikeTheBall` football T3 **80** aoe r1 | RECOST → 125 (T3 aoe r1 unit) or RETIER → T1 at 80 (= Wing Attack). Football has two T3s; take the RECOST. |
| **Q. T4 ~180 single-target** | Ancient Magic `raceAncientMagic` ancientknowledge T4 180, no rider | RETIER → T3, 135, `ignoreArmor` ("older than armor") — Occult has no T3 and two T4 180s. |
| | Weigh the Heart `raceWeighTheHeart` ancientknowledge T4 180 (dead `executeBonusPct`, stagger finisher) | KEEP as the family T4; fix the lie (§3). |
| | A Really Good Punch `reallyGoodPunch` martialarts T4 180, **25 MP** | KEEP the joke pin, add CD3 (an arm needs a rest). At 4 SP it is the only T4 castable every round; the cooldown is the honest price. |
| | Dragon Fist `raceDragonFist` martialarts T4 180 rng 2, no rider | RETIER → T3: 135 fire, rng 2, burn finisher ×1.5 — fills martialarts' empty T3 and stops two T4 180s in one family. |
| | Hocus Pocus `raceHocusPocus` witchcraft T4 180, **25 MP**, no rider | RECOST → 100 MP, 160, `bonusVsStatus: {status: 'hexed', mult: 1.5}` — Witchcraft sets Hexed twice and pays it nowhere; the pin is an error, not an identity (the desc does not sell "cheap"). |
| | Time Rewind `raceTimeRewind` temporal T4 160, no visible rider | KEEP — the row already has `echoLastDealt: true` (live: replays the target's last blow, cap 500). The desc hides it (§3). |
| | Flat Earth `raceTruthBomb` conspiracyknowledge T4 180 (silence/poison finisher, flatten) | KEEP. |
| | Jurassic Jaw `raceJurassicJaw` apexpredator T4 180 (ignoreArmor, stagger finisher, kill heals 25% + refunds 1 AP) | KEEP, but it is the densest T4 in the rack; RECOST 180 → 160. |
| | Ape Fury `racePrimalSmash` apeintelligence T4 180 (slow finisher, deform) | KEEP. |
| | Sasquatch Smash `raceSasquatchSmash` sasquatch T4 180, 2 AP (stagger finisher) · Colossal Crush `raceColossalCrush` titan T4 180, 2 AP (stagger finisher, deform) | RECOST both 2 AP → 1 AP. Hail Mary `raceHailMary` (T4 180, 1 AP, rng 5, stagger finisher) proves the same row is 1 AP elsewhere. |
| | Take Aim `headshot` marksmanship T4 180 (ignoreArmor, stun finisher, delayed, execute ≤15%) | KEEP. |
| | High Noon `raceHighNoon` cowboyskills T4 180, 2 AP (stagger/tethered finisher, no LoS, dead `guaranteedCrit`) | RECOST 2 AP → 1 AP once the crit lie is removed (§3). |
| | No Mercy `raceNoMercy` dirtyfighting T4 180, 2 AP (stagger finisher, dead `executeBonusPct`) | Fix the lie (§3); 2 AP → 1 AP. |
| | Terror Pounce `raceTerrorPounce` ghoulish T4 180, 2 AP (feared finisher, purgeBuffs, charge 3) | KEEP at 2 AP (purge + charge is categorical). |
| | Divine Smite `raceDivineSmite` angelic T4 180, 2 AP (`unholyBonus` 80) | RECOST 2 AP → 1 AP. |
| | Excalibur Strike `raceExcaliburStrike` royalty T4 180 + burn 2 · Demonic Claw `raceDemonicClaw` demonicabilities T4 180 + marked 2 · Tendril Strike `raceTendrilStrike` symbiosis T4 180 + poison 2 | KEEP all (a status rider each, 1 AP, one per family). |
| | Blood Frenzy `raceBloodFrenzy` werewolf T4 180, 2 AP, rng 6, auto-targets lowest HP | RECOST 2 AP → 1 AP; the auto-target is a downside AND a reach. |
| | Bad Trip `raceBadTrip` psychadelic T4 180 (slow 1 + slow/voodoo finisher, self-contained) · Ego Death `sharedEgoDeath` psychadelic T4 180 + stun 1, 2 AP CD2 | KEEP both — same family, but one is a self-setting finisher and one is a hard CC; distinct. |
| | Absolute Zero `raceAbsoluteZero` ice T4 180 + frozen 2, 2 AP CD2 · Avalanche Strike `raceAvalancheStrike` winter T4 180 + frozen 1 + frozen finisher, 1 AP | Avalanche dominates (1 AP, self-contained finisher). RECOST Absolute Zero 2 AP → 1 AP, keep CD2 and frozen 2. |
| | Death Gaze `raceDeathGaze` eyesight T4 180 DEF−1 (stun finisher) · Migraine `raceMindCrush` psychic T4 180 M ATK−1 (discord finisher) · Mind Shatter `mindShatter` psychic T4 180 + silence 1 + silence finisher · Boo `raceBoo` haunted T4 180 + discord 2 (haunted finisher) · Classified Weapon `raceClassifiedWeapon` advancedtechnology T4 180 (jammed finisher) | KEEP all. Psychic has two T4 180s (Migraine, Mind Shatter): KEEP — one is a stage-strip, one is a self-contained silence finisher. |
| **R1. Single-target burn** (damageEffect, burn) | Heat Ray `raceHeatRay` alientechnology T1 100 + burn 2, rng 5 | KEEP — the ceiling of the T1 shape. |
| | Lump of Coal `raceLumpOfCoal` christmasspirit T1 100 (magic) + burn 2, rng 4 · Red Slash `sentaiRedSlash` sentai T1 100 + burn 1, rng 1 · Fire Arrow `raceFireArrow` archery T1 80 + burn 2, rng 5 | KEEP all (each is its family's T1; all at/below Heat Ray). |
| | Plasma Whip `racePlasmaWhip` alientechnology T3 125 + burn 2, **rng 2** | REWRITE INTO a whip: line w1, length 3, 125 + burn 2 (kind `line`). Today it is Heat Ray in the same family with +25 damage, −3 range and +50 MP. |
| **R2. Single-target slow** | Ice Spear `raceIceSpear` ice T1 100 + slow 2, rng 5 | KEEP. |
| | Ice Shard `raceIceShard` ice T1 100 + slow 1, rng 3 | DELETE — same family; Ice Spear is Ice Shard + Lingering + Long Reach ×2 for the same MP. |
| | Grave Chill `raceGraveChill` haunted T1 100 + slow 1, rng 3 | KEEP (haunted's T1 hit). |
| | Lullaby `lullaby` sonic T3 130 + slow 2 | REWRITE: 130 + Stun 1 (a lullaby puts them to sleep). As shipped it is Ice Spear + 30 damage for +50 MP and two tiers. |
| **R3. Single-target poison** | Infectious Bite `raceInfectiousBite` poison T1 100 + poison 3 | KEEP — the floor. |
| | Venom Fang `raceVenomFang` insectoid T1 100 + poison 3 (root finisher) · Ghoulish Bite `raceGhoulishBite` ghoulish T1 100 + poison 2 + drain .4 · Sting `raceJellySting` jellyfish T1 80 + poison 2 · Poison Arrow `racePoisonArrow` archery T1 80 + poison 3, rng 5 · Goo Shot `raceGooShot` ooze T1 90 + goo 2 | KEEP all (a rider or a weaker number each; no two share a family). |
| | Poison Dart `poisonDart` spygear T3 125 + poison 3 | RETIER → T2, 110 + poison 3, rng 4. A T3 whose only payload is the T1 status. |
| **R4. Single-target stagger** | Stonefall `raceStonefall` earth T1 100 + stagger 1, rng 4, no LoS · Gore Charge `raceGoreCharge` horns T1 100 + stagger 1 (charge) · Nightstick `racePoliceNightstick` policetraining T1 85 + stagger 1 · Mic Drop `racePopMicDrop` stagepresence T1 80 + stagger 1 · Swing Door `raceSwingDoor` door T1 40 + stagger + push 2 · Ram Charge `raceRamCharge` drivingskills T1 100 + stagger (dash) | KEEP all at T1 — stagger 1 is a T1 rider. |
| | Blitz `raceBlitz` football T2 100 + stagger 1 (dash) | RETIER → T1 (it is Ram Charge). Football keeps QB Sneak at T2. |
| | Air Mail `raceAirMail` door T2 110 + stagger + groundsFlyers | KEEP. |
| **R5. Single-target frozen** | see Q (Absolute Zero / Avalanche Strike) · Frozen Punch `raceFrozenPunch` winter T1 90 (frozen finisher) | KEEP. |
| **S. Life drains** (damage/lifeDrain) | Bite `raceBite` beastabilities T1 100, .30 rng 1 · Lifetap `raceLifetap` vampiricabilties T1 80, .40 rng 2 · Life Drain `raceSoulDrain` necromancy T1 100, .35 rng 3 (root finisher) · Dream Siphon `raceDreamSiphon` astral T1 100, .40 rng 3 (stun finisher) | KEEP all — T1 drain = 100, .30–.40, one finisher; Dream Siphon is the ceiling. |
| | Soul Suck `raceSoulSuck` seduction T1 100, **.60 + Charm 1** rng 2 | RETIER → T2 and drainPct .60 → .40. Charm 1 alone is the family's T2 (Charm `raceCharm`); a T1 that includes it plus a 100 hit plus the biggest drain in the tier is over-tuned three ways. |
| | Frenzy `raceFrenzy` ghoulish T1 **120** + grievous 2, .30 | RETIER → T2 (tier-rule offender), 130. |
| | Absorb `raceAbsorb` ooze T2 130, .40 rng 1 (poison/goo finisher) | KEEP — T2 unit. |
| | Kiss of Decay `raceKissOfDecay` infernalcourt T3 **100** + poison 2, .40 (poison finisher) | RECOST 100 → 125 (T3 drain unit is 125). |
| | Symbiotic Drain `raceSymbioticDrain` symbiosis T3 125, .40 rng 2 (poison finisher) | REWRITE: the drained HP also heals the lowest-HP ally within 2 (symbiosis) — otherwise it is Kiss of Decay without the poison, in a single-race family that could use the edge. |
| | Devour Soul `raceVoidContract` demonicabilities T3 125, .50, **2 AP** (contract/soulBound finisher) | RECOST 2 AP → 1 AP. |
| | Life Sap `lifeDrain` blood T3 135, **.70** rng 3 (poison finisher) | RECOST drainPct .70 → .50 — the T4 Draining Embrace drains .60; a T3 should not out-drain it. |
| | Draining Embrace `raceDrainingEmbrace` seduction T4 180, .60, 2 AP (charm finisher) | RECOST 2 AP → 1 AP. |
| | Predator Drop `racePredatorDrop` vampiricabilties T4 150 + fall, .20 (requiresFlight) | KEEP. |
| **T. Leap strikes** (damage/leapStrike, +dmg/level) | Predator Leap `racePredatorLeap` beastabilities T1 80 rng 3 (+20/lvl) | KEEP — the unit. |
| | Feral Dive `raceFeralDive` beastabilities T3 125 rng 3 (+20/lvl) | DELETE — same family, same move, +45 damage for +50 MP. Predator Leap + Empowered is the honest version. |
| | Cliff Charge `raceCliffCharge` horns T2 100 rng 2 (+20/lvl) | REWRITE for T2: leap + push 2 with `collisionBonus` 40 (knock them off the cliff). +20 damage over the T1 is not a tier. |
| | Titan Drop `raceTitanDrop` titan T3 125 rng 2 (+25/lvl, deform) | KEEP. |
| | Divine Swoop `raceDivineSwoop` holydefense T3 125 rng 3 (+20/lvl) | REWRITE: add Stagger 1 on landing. Identical to Feral Dive today. |
| | Seismic Leap `raceSeismicLeap` kaiju T2 100 aoe r1 + stagger (+30/lvl, deform) | KEEP — the AOE leap. |
| **U. Dashes / charges** | Rampage `rampage` athleticism T4 160, dashDamage 64, 1 AP · Unstoppable Charge `raceUnstoppableCharge` athleticism T4 180 + stagger 1, 1 AP | Same family, same shape; Unstoppable dominates. RETIER Rampage → T3 (125, dashDamage 50) — athleticism has no T3. |
| | Bull Rush `raceBullRush` horns T4 170 (discord finisher) · Giant Smash `raceGiantSmash` titan T4 170 + stun 1, dashDamage 56 | KEEP (each its family's T4). |
| | Sleigh Dash `raceSleighDash` christmasspirit T2 **130** + dashDamage 70 (frozen finisher) · Ice Slide `raceIceSlide` ice T2 **140** + dashDamage 70 + ice trail | RECOST both: 110 main hit. A T2 dash at 130–140 with 70 path damage out-hits every T3 single. |
| | Stampede `raceApexCharge` apexpredator T2 130 + stagger 1, **2 AP** | RECOST: 110, 1 AP (offender). |
| | Dark Feather `raceDarkFeather` maincharacter T1 100 + poison 3, **2 AP** · Shadow Infiltration `raceShadowInfiltration` shadow T2 **120** + poison 3, **2 AP** | Dark Feather RETIER → T2, 1 AP, 100 + poison 3. Shadow Infiltration REWRITE: 100 + poison 3, 1 AP, and "always a rear attack" (the `doorBreach` rear-attack rule from Breaking and Entering `raceBreakingEntering`) — the infiltration. |
| | Drive-By `raceDriveBy` streetsmarts T2 0 dmg dash + shot at weakest within 3 | KEEP — distinct. |
| **V. Delayed zones** (damage/delayed, 1-round mark) | Star Decree `raceStarDecree` cosmic T4 160 r1 rng 3, 1 AP (slow finisher) · Crystal Ball `raceCrystalBall` fortunetelling T4 160 r1 rng 5, 1 AP (hexed finisher) | KEEP both — same shell, different family and payoff, both 1 AP. |
| | Cataclysm Decree `raceCataclysmDecree` infernalcourt T4 160 r1 rng 5, **2 AP** (burn finisher, lava, deform) | RECOST 2 AP → 1 AP (Star Decree is the same shell at 1 AP; the lava is the difference, not an AP). |
| | Artillery Strike `raceArtilleryStrike` militarysupport T3 135 r1 rng 6, 2 AP | RECOST 2 AP → 1 AP (T3 delayed unit). |
| | Fire for Effect `raceFireForEffect` militarysupport T4 160 r2 rng 6, 2 AP (burn finisher, scorched) · Nuke `sharedNuke` militarysupport T4 160 r2 rng 5, 2 AP, **no cooldown field** (the desc's "Cooldown: 2 rounds" is unbacked — §3) (scorched, destroys buildings) | Same family, same row twice. DELETE `raceFireForEffect`; MERGE its burn finisher onto Nuke (`bonusVsStatus: {status: 'burn', mult: 1.5}`) and give Nuke the CD2 its desc already promises. |
| | Prophecy of Disaster `raceProphecyOfDisaster` mothman T4 **140** r2 rng 5, 2 AP (discord finisher, groundsFlyers) | RECOST 140 → 160 (lowest T4 area damage in the rack, at 2 AP). |
| **W1. T4 self-AOE r2** | EMP Burst `empBurst` robot T4 160 + jammed 1, 1 AP CD2 · Kill Mode `raceChassisSlam` robot T4 160, **2 AP**, no rider | Same family; Kill Mode is strictly worse. REWRITE Kill Mode: 160, 1 AP, and the caster gains Overclock 2 after ("weapons free"). |
| | Requiem `requiem` sonic T4 160 **r4** + discord 2 (discord finisher), 1 AP CD2 | RECOST r4 → r2. A 9×9 that hits for 160 with a three-stage debuff and pays itself off is the most oppressive area in the game. |
| | Space Disco `raceSpaceDisco` stagepresence T4 160 r2 + discord 1 (stun finisher), **75 MP**, CD2 | RECOST 75 → 100 (no identity behind the pin; Requiem at 100 is the comparable). |
| | Supernova `raceSupernova` cosmic T4 170 r2 DEF−1, 2 AP · Quake `raceQuake` earth T4 160 r2 + stagger 1, 2 AP · Tidal Slam `raceTidalSlam` water T4 170 r1 + slow 2 (slow finisher), 1 AP CD2 · Poseidon's Wrath `racePoseidonsWrath` deepsea T4 170 r99 water-only, 75 MP 2 AP | KEEP all; Supernova/Quake 2 AP is earned by r2. Poseidon's 75-MP pin is deliberate (conditional target set). |
| **W2. T4 AOE r1/r2 160** | Arrow Volley `raceArrowRain` archery T4 160 r1 rng 6, 1 AP, no rider, no CD | KEEP — it sets the honest T4 area unit: 160 r1, 1 AP. Everything below must beat it or cost the same. |
| | Merkaba `raceMerkaba` light T4 160 r1, **2 AP** CD2 (burn finisher) · Vehicular Manslaughter `raceMissileBarrage` drivingskills T4 160 r1, **2 AP** (discord finisher) · Shambling Horde `raceShamblingHorde` zombie T4 160 r1, **2 AP** (infected finisher) · Baphomet's Rite `raceBaphometsRite` blackmagic T4 160 r1, **2 AP**, −15% HP (stagger finisher) | RECOST all four 2 AP → 1 AP. A finisher is a rider, not a second AP. |
| | Megazord Blast `sentaiMegazordBlast` sentai T4 **180** r1, 2 AP (burn finisher) | RECOST 180 → 160, 2 AP → 1 AP. |
| | Marrowstorm `raceMarrowstorm` bonedensity T4 160 r2, ignoreArmor, 2 AP CD2 (poison finisher) · Eternal Slumber `raceEternalSlumber` astral T4 160 r2 + stun 1, 2 AP CD2 · War of the Worlds `raceWarOfTheWorlds` ufo T4 160 r2, 2 AP · Fae Ring `raceFaeRing` fae T4 160 r2 ring, 2 AP · Singularity `raceSingularity` artificialintelligence T4 160 r2 pull, 2 AP CD2 · Black Hole `sharedBlackHole` cosmic T4 160 r2 pull + slow, 75 MP 2 AP CD2 · Vortex Slam `sharedVortexSlam` wind T4 160 r1 pull + slow, 2 AP | KEEP the 2 AP on the r2 rows (categorical). Vortex Slam is r1 — RECOST 2 AP → 1 AP. Crop Circle `raceCropCircle` (ufo T4 160 r2, 1 AP CD2) and War of the Worlds are the same family's two r2 T4s: KEEP (one deforms, one is the swarm), but War of the Worlds must differ — make it hit twice (round start and end) at 100 each. |
| | Plandemic `racePlandemic` unethicalscience T4 160 r1 + poison 3, 1 AP · Cannonball `raceCannonball` piracy T4 170 r1 + burn 1, 1 AP · Blizzard Present `raceBlizzardPresent` christmasspirit T4 160 r1 + frozen 2 + ice, 1 AP CD2 · Dark Lullaby `raceDarkLullaby` infernalcourt T4 160 r1 + silence 1 (silence finisher), 1 AP · Crow Storm `raceCrowStorm` scarecrow T4 160 r1 + discord 2 (hexed finisher), 1 AP | KEEP. |
| | Meteor `meteor` fire T4 160 r1 + burn 3 (burn finisher), groundsFlyers, scorched, deform, 1 AP CD2 · Dark Dominion `raceDarkDominion` infernalcourt T4 170 r1 + burn 2 (stagger finisher), 1 AP CD2 · Reality Pulse `raceRealityPulse` temporal T4 170 r1 + discord 1, 1 AP | Meteor KEEP (fire's only T4, CD2 pays for the density). Dark Dominion RECOST 170 → 160. Reality Pulse RECOST 170 → 160 (Crow Storm gives discord 2 + a finisher at 160). |
| | Lockdown `racePoliceLockdown` policetraining T4 **120** r1 + slow 2 · Stadium Show `racePopStadiumShow` stagepresence T4 **130** r2 + charm 1, CD4 | Lockdown RECOST 120 → 160 (a T4 that hits like a T2 Dynamite). Stadium Show KEEP (charm 1 on a 5×5 is the payload; CD4 prices it). |
| | Heat Death `raceHeatDeath` cosmic T4 180 r1 + slow 1, 2 AP, `zoneDuration: 2` on kind `aoe` | The zone is dead (kind `aoe` never reads `zoneDuration`; only `lineZone` rows and zone kinds do — §3). REWRITE kind → `zoneDebuff`-with-damage or drop the "for 2 turns" text; RECOST 180 → 160, 2 AP → 1 AP. |
| **W3. Cross AOEs** | Judgment `judgment` light T4 160 cross r3 rng 1 (slow finisher), 1 AP · Wrath of the Watchers `raceWrathOfTheWatchers` fallenangel T4 **180** cross r2 + burn 1 (stagger finisher), 1 AP CD2 · Crusade `raceCrusade` knight T4 160 cross r2 rng 4, **2 AP** (`unholyBonus` 60) | Crusade RECOST 2 AP → 1 AP. Wrath RECOST 180 → 160. |
| | Blade Waltz `bladeWaltz` swordsmanship T3 125 cross r2 rng 0 · Crossfire `crossfire` weaponstraining T3 125 cross r2 rng 0 | KEEP both (pirate/knight/skeleton vs the gun races; no overlap). |
| | Divine Judgment `raceDivineJudgment` holydefense T3 135 cross r2 + burn 2, **50 MP, 2 AP** | RECOST: 75 MP, 1 AP (the pin was compensating the AP; neither belongs). |
| | Diamond Dust `raceDiamondDust` ice T3 125 cross r2 + slow 2 + ice, **2 AP** · Resonance Pulse `raceResonancePulse` sonic T3 135 cross r2 + slow 1 + push 1, 1 AP | Diamond Dust RECOST 2 AP → 1 AP. |
| | Arcane Sigil `raceArcaneBlast` arcane T1 **100 cross r3** · Fallen Grace `raceFallenGrace` fallenangel T1 100 cross r1 + burn 1 | Arcane Sigil RECOST 100 → 70 (a T3-shaped area at T1). Fallen Grace RECOST 100 → 80. |
| **W4. Lines** | Entropic Beam `raceEntropicBeam` cosmic T1 100 DEF−1 (slow finisher) rng 4, 1 AP · Judgment Beam `raceJudgmentBeam` temporal T1 100 DEF−1 rng 5, **2 AP** | Judgment Beam RECOST 2 AP → 1 AP, 100 → 80 (Entropic Beam with a finisher is the ceiling at T1). |
| | Psychic Beam `racePsychicBeam` psychic T1 100 + discord 1 rng 5 | RECOST 100 → 80 (Discordance sells discord 2 alone at T1; a full line hit plus discord at 25 MP is over). |
| | Sonic Boomerang `raceSonicBoomerang` sonic T1 80 line, `boomerang: true` (hits out and back = 160 per enemy) | RECOST 80 → 50 per pass (100 total per enemy), or T2. |
| | Bullet Pass `raceBulletPass` football T1 80 rng 4 · Suppressive Fire `raceSuppressiveFire` militarysupport T1 80 + slow 2 · Formic Acid `raceFormicAcid` poison T1 80 DEF−1 (poison finisher) + poison terrain · Dragon Breath `raceDragonBreath` dragonabilities T1 90 + burn 2 + burning lane 2 rounds (`lineZone`, live) | KEEP all at T1 (80–90 line is the unit). |
| | Baleful Gaze `raceBalefulGaze` eyesight T2 **130** rng 5, no rider, 1 AP · Ki Wave `raceKiWave` ki T2 135 rng 5, **2 AP** · Sword Beam `swordBeam` swordsmanship T2 100 rng 3 · Blue Wave `sentaiBlueWave` sentai T2 **120** + slow 1 · Chemtrails `raceChemtrails` conspiracyknowledge T2 100 + poison 2 + poison terrain · Water Pulse `sharedTidalSurge` water T2 100 + slow 1 + push 2 | T2 line unit = 100–110 (+ one rider). Baleful Gaze RECOST 130 → 110. Ki Wave RECOST 2 AP → 1 AP, 135 → 110. Blue Wave RECOST 120 → 100 (offender). Sword Beam KEEP. |
| | Choppa `raceChoppa` streetsmarts T3 **110** rng 5 · Fractal Stitch `raceFractalStitch` fractal T3 130 rng 5 hits flyers · Plasma Cannon `racePlasmaCannon` cyberpunkweapons T3 130 w2 + burn 1 · Piercing Arrow `racePiercingArrow` archery T3 120 push 2 (collision 60) · Shockwave Clap `raceShockwaveClap` superheropowers T3 125 push 2 · Sonic Breaker `raceSonicBreaker` sonic T2 120 push 2 (silence finisher) | Choppa RECOST 110 → 135 (a T3 out-hit by the T2 Baleful Gaze). Shockwave Clap REWRITE: 125 + push 2 + Stagger 1 — as shipped Sonic Breaker (T2) is better. Sonic Breaker RECOST 120 → 110. |
| | Freeze Breath `raceFreezeBreath` superheropowers T2 40 + frozen 1, 2-tile line | KEEP (frozen prices it). |
| | Atomic Breath `raceAtomicBreath` kaiju T4 160 (stagger finisher) rng 5 · Dragonfire `raceDragonfire` dragonabilities T4 160 + burn 2 · Hellmouth `raceHellmouth` demonicabilities T4 160 + lava · Heat Vision `raceLaserBeam` superheropowers T4 160 + burn 1 (burn finisher, self-contained) · Railgun `railgun` advancedtechnology T4 160 ignoreArmor (jammed finisher) · Tsunami `raceTsunami` water T4 160 w3 push 2 + slow 1, 2 AP | KEEP all; Tsunami's 2 AP is earned by w3. |
| **X. Walls** (damage/terrainCreate, 2-high, 3 tiles) | Rampart `rampart` earth **T4** 60 dmg · Walls of Camelot `raceShieldWall` royalty T2 60 dmg · Pyramid Protocol `raceZigguratProtocol` ancientknowledge T2 80 dmg · Gothic Rampart `raceGothicRampart` livingstone T2 50 dmg, 2 tiles | One mechanic, four monument skins. RETIER Rampart → T2 (a wall is a T2 everywhere else; earth keeps Quake/Stone Drop at T4). Pyramid Protocol RECOST 80 → 60. Gothic Rampart RETIER → T1 (2 tiles, "cheaper than Rampart" says the desc — make it so). |
| | Fissure `sharedFissure` earth T1 100 + stagger, chasm 3 tiles · Flash Freeze `sharedFlashFreeze` ice T2 90 + frozen 1, ice 3 tiles · Scorched Earth `sharedScorchedEarth` fire T3 **70**, scorched 3 tiles · Wall of Fire `wallOfFire` fire T3 80 + burn 2, burning 3 rounds, spreads | Scorched Earth DELETE — Wall of Fire in the same family is the same 3 tiles with burn and a lasting fire for the same MP. Fissure KEEP (T1 offender-adjacent: 100 + stagger + a chasm; RECOST 100 → 80). |
| | Sacred Geometry `raceSacredGeometry` ancientknowledge T1 0 dmg crystal 3 tiles · Plaguefield `racePlaguefield` necromancy T2 permanent 3×3 poison flesh · Poison Swamp `sharedPoisonSwamp` poison T1 80, 1 tile spreading · Ooze Trail `raceOozeTrail` ooze T1 1 tile swamp · Walk the Plank `raceWalkThePlank` piracy T2 90 deep water 1 tile, executes <25%, **2 AP** · Call of the Deep `raceCallOfTheDeep` water T4 160 deep water 1 tile (silence finisher), 2 AP · Great Flood `raceFlood` water T4 160 basin fill 12 tiles + slow, 2 AP CD2 | Walk the Plank RECOST 2 AP → 1 AP (the execute is capped at 25%). Call of the Deep RECOST 2 AP → 1 AP (1 tile). Others KEEP. |
| **Y1. Weather** (deploy/summonWeather) | Summon Blood Rain `sharedSummonBloodRain` blood T1, **2 AP** · Summon Blizzard `sharedSummonBlizzard` ice T1, **2 AP** · Summon Sandstorm `sharedSummonSandstorm` desertacclimation T2, 1 AP · Summon Thunderstorm `thunderstorm` lightning T2, 1 AP | One price for weather: RETIER Blood Rain and Blizzard → T2, 1 AP. |
| **Y2. Turrets** (deploy/deployTurret) | Deploy Turret `deployTurret` engineering T2 – 110 dmg / 60 HP / rng 3, max 2 · Clockwork Turret `raceClockworkTurret` engineering T3 – **65 dmg** / 80 HP / rng 3, max 1 | Same family; the T3 is worse. DELETE `raceClockworkTurret` from engineering and REWRITE Tinker's Contraption `raceTinkersContraption` (trapmaking T2) into it: a clockwork turret, 80 dmg / 80 HP / rng 3, max 1 — gnome and goblin get a turret, engineering keeps one. |
| | 5G Tower `fiveGTower` engineering T3 – aura −8 M DEF | KEEP. |
| **Y3. Summons** (deploy/summonUnit) | Summon Creation `raceSummonCreation` unethicalscience **T2** – 90 dmg, 4 hits, armored, move 3 · Whistle `raceWhistle` huntingskills T3 – 60 dmg, 3 hits, move 4, reveals 3 · The Gathering `raceCultGathering` cult T4 – 2× (55 dmg, 2 hits, move 3) | RETIER Summon Creation → T3 (it out-summons the T3 hound and the T4 cultists at T2). Whistle KEEP. The Gathering KEEP (two bodies). |
| **Y4. Decoys / objects** | Stuffed Double `raceStuffedDouble` scarecrow T2 – objectHp **1**, "Deploys an object on an empty tile." · Cloning Machine `raceCloneDecoy` unethicalscience T2 – objectHp 100, draws attention | Stuffed Double RECOST objectHp 1 → 60 and REWRITE the desc (it is a decoy that draws melee and ranged attacks — the row says so, the text does not). |
| **Y5. Scans** | Omni-Vision `raceOmniVision` eyesight T2 rng 5, reveals within 3 · Cosmic Sight `raceCosmicSight` cosmic T2 rng 6, reveals within 4 · Rangefinder `raceRangefinder` militarysupport T3 rng 8, several turns | KEEP all (Cosmic Sight ≥ Omni-Vision at the same tier — RECOST Omni-Vision to reveal 4). |
| **Y6. Steals** | Plunder `racePlunder` piracy T1 70 + item or key · Tithe `raceCultTithe` biblestudy T2 **25 MP** 50 + item · Hit a Lick `raceHitALick` streetsmarts T2 60 + key AND item | Tithe RETIER → T1 (its own 25-MP pin says so; a tithe is small). Others KEEP. |
| **Y7. Multi-hits** (damage/multiHit) | Mandible Strike `raceMandibleStrike` insectoid T1 3×45 = **135** rng 1 · Ki Volley `raceKiBlast` ki T1 3×45 = **135** rng 4 · Flurry of Blows `raceFlurryOfBlows` martialarts T1 4×33 = 132 rng 1 · Double Pump `doubleShot` weaponstraining T1 2×60 = 120 rng 3 · Team Strike `sentaiTeamStrike` teamwork T3 5×27 = 135, **2 AP** · Ninefold Scratch `raceNinefoldScratch` feline T4 5×32 = 160 rng 1 | Per-hit armor makes nominal totals overstate, but 135 at T1 is 35% over the unit. RECOST Mandible 3×35, Ki Volley 3×35, Flurry 4×27, Double Pump 2×50. Team Strike RECOST 2 AP → 1 AP (g7). Ninefold Scratch REWRITE: 9×20 = 180 (the name says nine). |
| **Y8. Roars / barrages** (effect, self-aoe) | Dread Aura `raceDreadAura` cryptid T1 discord 2 r2 · Primal Roar `racePrimalRoar` apexpredator T1 discord 2 r1 · Dragonfear `raceDragonfear` dragonabilities T2 discord 2 r3 · Labyrinth Roar `raceLabyrinthRoar` horns T2 discord 2 r2 · Demonic Roar `raceDemonicRoar` demonicabilities T1 stagger 1 r2 · Chest Pound `raceChestPound` apeintelligence T1 DEF−1 r2 · Meow `raceMeow` feline T3 DEF−1 r2 · Fear `raceFear` shadow T2 feared 1 r3 | Labyrinth Roar REWRITE for T2: discord 1 + Rooted 1 r2 (lost in the maze) — today it is Dread Aura at T2. Meow REWRITE for T3: DEF−1 + Charm 1 r2 ("adorable, disarming") — today it is Chest Pound at T3. Others KEEP. |
| **Y9. Zone debuffs** | Filibuster `raceFilibuster` politics **T1** silence zone 3×3 × 2 · Ink Cloud `raceInkCloud` deepsea T2 discord 2 zone · Exhaust Cloud `raceExhaustCloud` drivingskills T2 discord 1 zone self · Dimensional Web `raceDimensionalWeb` arachnid T3 slow 2 zone · White Christmas `raceWhiteChristmas` christmasspirit T3 slow 1 zone → ice · Cold Spot `raceColdSpot` haunted **T2** frozen 1 zone × 2 · Outbreak `raceOutbreak` zombie T3 poison zone r2 × 3, 2 AP · Smoke Screen `sharedSmokeScreen` spygear T2 ally-invisible zone · Low Gravity `sharedLowGravity` ufo T2 · Gravity Crush `sharedGravityCrush` cosmic T3 | Filibuster RETIER → T2 (Silence is a T3-grade status; a zone of it at T1 is the cheapest lockout in the rack). Cold Spot RETIER → T3 (a zone that re-freezes every round is two rounds of no-act for 50 MP). Dimensional Web RETIER → T2 (a slow zone is White Christmas without the ice). Outbreak RECOST 2 AP → 1 AP. |
| **Y10. Pulls** | Harvest Hook `raceHarvestHook` scarecrow T1 80 pull 4 rng 4 · Tentacle Lash `raceTentacleLash` tentacleappendages T1 80 pull 2 rng 3 · Earthen Grasp `raceEarthenGrasp` earth T2 80 pull 2 + root 1, groundsFlyers · Siren Song `raceSirenSong` sonic T1 pull 3, no dmg, groundsFlyers · Lasso `raceLasso` ropework T1 pull 2 + tethered 2, groundsFlyers · Grapple `raceGrapple` ropework T1 pull 2 + a hit | Tentacle Lash REWRITE: pull 3 + `groundsFlyers` (the kraken drags flyers down) — today it is Harvest Hook with less of everything, in a one-row family. Lasso is dense for T1 (Tethered = root + drag + 20/tile) → RETIER → T2. Others KEEP. |
| **Y11. Knock-around melee** (damage/displacement) | Haymaker `haymaker` martialarts T1 100 shove (root finisher, collision 40) · Body Check `raceBodyCheck` dirtyfighting T1 100 push 2 (stagger finisher) · Horn Toss `raceHornToss` horns T1 80 push 3 (stagger finisher) · Kinetic Hurl `kineticHurl` psychic T1 100 shove (collision 64) | KEEP all — same shape, four finisher/collision mixes, no two in one family. |
| **Y12. Ricochets** | Ricochet `ricochet1` weaponstraining T2 100 + bounce · Prism Burst `racePrismBurst` light T3 125 + bounce · Splitting Arrow `raceSplittingArrow` archery T3 125 + bounce (burn finisher) | KEEP as rows (each family needs the rung) but see §4: each is exactly "the tier's single hit + the Ricochet upgrade (2 SP)". |
| **Y13. Sky throws / drops** (requiresFlight unless noted) | Infernal Hurl `raceInfernalHurl` demonicabilities T2 90 (+25/lvl, collision 50) · Dragon Toss `raceDragonToss` T3 70 (+25/lvl, collision 60) · Abduction Beam `raceAbductionBeam` ufo T3 110 (+25/lvl, collision 50, no flight needed) · To the Moon `raceRocketToss` cyberpunkweapons T4 150 (+25/lvl, collision 50) · Stone Drop `raceStoneDrop` earth T4 150 (+25/lvl, stagger finisher, deform) · Predator Drop `racePredatorDrop` T4 150 (+15/lvl, drain .2) · Descending Wrath `raceDescendingWrath` fallenangel T4 160 + burn 2 (burn finisher), 2 AP | KEEP all as a ladder (90 / 100 / 110 / 150). Descending Wrath RECOST 2 AP → 1 AP (Stone Drop is the same shape at 1 AP). |
| **Y14. Damage + Silence** | Skull Crack `skullCrack` dirtyfighting T3 125 + silence 1 · Deafening Wail `raceDeafeningWail` sonic T3 125 self-aoe r2 + silence 1 · Fluoride Water `raceFluorideWater` conspiracyknowledge T3 125 aoe r1 rng 3 + **silence 2** | Fluoride Water RECOST silence 2 → 1 (an area silence 2 at T3 beats the T4 Dark Lullaby's silence 1). Others KEEP. |
| **Y15. Damage + Frozen area** | Permafrost `racePermafrost` ice T3 120 aoe r1 + frozen 2 + ice, 2 AP CD2 · Blizzard Present (T4) · Flash Freeze (T2, frozen 1, 3 tiles) | KEEP (frozen 2 on a 3×3 is worth the 2 AP + CD). |

### 2. Tier corrections

| Spell `id` (family) | now T# / MP / AP / dmg | should be T# / MP | reason (comparable) |
|---|---|---|---|
| Tremor Stomp `raceTremorStomp` (earth) | T1 / 25 / 1 / 125 self-aoe r1 + stagger 1 + deform | T2 / 50, 100 dmg | Offender. Identical to Fee Fi Fo Fum `raceTitanStep` T3 / 75 / 125. Giant, cyclops and nephilim carry both earth and titan, so the same row would sit twice at T3; T2 at 100 makes it the rung under it. |
| Curb Stomp `raceStompOut` (dirtyfighting) | T1 / 25 / 1 / 120 + grievous 2 | T2 / 50 | Offender. Body Check `raceBodyCheck` T1 is 100 with a finisher; +20 and a status is a tier. |
| Frenzy `raceFrenzy` (ghoulish) | T1 / 25 / 1 / 120 + grievous 2 + drain .3 | T2 / 50, 130 | Offender. Ghoulish Bite `raceGhoulishBite` T1 is 100 + poison 2 + drain .4; this is a T2 drain (Absorb `raceAbsorb` T2 130). |
| Stampede `raceApexCharge` (apexpredator) | T2 / 50 / **2** / 130 + stagger 1 | T2 / 50, 1 AP, 110 | Offender. Ram Charge `raceRamCharge` T1 is 100 + stagger at 1 AP. |
| Shadow Infiltration `raceShadowInfiltration` (shadow) | T2 / 50 / **2** / 120 + poison 3 | T2 / 50, 1 AP, 100 (+ rear attack) | Offender. Dark Feather `raceDarkFeather` is the same dash+poison at 100. |
| Infernal Decree `raceInfernalDecree` (infernalcourt) | T2 / 50 / **2** / 130 aoe r1 + burn 2 | T2 / 50, 1 AP, 110 | Offender. Dynamite `raceDynamite` / Cluster Rockets `raceClusterRockets` T2 are 110 aoe r1 + stagger at 1 AP. |
| Blue Wave `sentaiBlueWave` (sentai) | T2 / 50 / 1 / 120 line + slow 1 | T2 / 50, 100 | Offender. Water Pulse `sharedTidalSurge` T2 is 100 line + slow 1 + push 2. |
| Pounce `racePounce` (beastabilities) | T1 / 25 / 1 / 120 rng 3 | T1 / 25, 100 | Ambush Lunge `raceAmbushLunge` T3 is 125 rng 3; a T1 five points under a T3 is not a T1. |
| Big Kick `raceBigKick` (sasquatch) | T1 / 25 / 1 / 120 rng 1 | T1 / 25, 100 | Stone Throw `raceStoneThrow` and Boulder Hurl `raceBoulderHurl` T1 are 100 with a finisher. |
| Cataclysm Stomp `raceCataclysmStomp` (kaiju) | T1 / 25 / **2** / 100 self-aoe **r2** + stagger + deform | T1 / 25, 1 AP, 80, r1 | The only T1 damage 5×5 besides Photon Scatter `racePhotonScatter` (alientechnology T1, 80 self-aoe r2, 1 AP, no rider), and it costs 2 AP. At 80 r2 1 AP with stagger + deform it would strictly dominate Photon Scatter, so it drops to r1 at 80 (= Wing Attack `raceWingGust` T1 80 self-aoe r1); Demonic Roar `raceDemonicRoar` T1 is stagger r2 with no damage. Kaiju keeps its footprint (deform). |
| Mortar Salvo `raceMortarSalvo` (mecha) | T1 / 25 / 1 / 100 aoe r1 rng 5, no LoS | T1 / 25, 80 | Skyscraper Toss `raceSkyscraperToss` T3 is 125 aoe r1 rng 5 no LoS; T1 aoe unit is 80 (Corrosive Splash, Glitterburst, Snowball Volley). |
| Aurora Ray `raceAuroraRay` (light) | T1 / 25 / 1 / 100 aoe r1 rng 5 DEF−1 (stun finisher) | T1 / 25, 80 | Glitterburst `raceGlitterburst` T1 is 80 aoe r1 DEF−1. |
| Whirlpool `raceRiptide` (water) | T1 / 25 / 1 / 100 aoe r1 pull + slow 1 | T1 / 25, 80 | Gravity Well `raceGravityWell` T1 is 80 aoe r1 pull + slow 1 + groundsFlyers. |
| Arcane Sigil `raceArcaneBlast` (arcane) | T1 / 25 / 1 / 100 cross r3 | T1 / 25, 70 | Blade Waltz `bladeWaltz` T3 is 125 cross r2. |
| Fallen Grace `raceFallenGrace` (fallenangel) | T1 / 25 / 1 / 100 cross r1 + burn 1 | T1 / 25, 80 | Divine Judgment T3 is 135 cross r2 + burn 2. |
| Psychic Beam `racePsychicBeam` (psychic) | T1 / 25 / 1 / 100 line + discord 1 | T1 / 25, 80 | Discordance `discordance` T1 is discord 2 alone. |
| Stun Ray `raceStunRay` (alientechnology) | T1 / 25 / 1 / 100 + stun 1 | T2 / 50, 70, CD2 | Taser `racePoliceTaser` T2 is 70 + stun 1 CD2; Hypnotic Pulse `raceHypnoticPulse` T3 is stun 1 alone. |
| Soul Suck `raceSoulSuck` (seduction) | T1 / 25 / 1 / 100 + charm 1 + drain .6 | T2 / 50, drain .4 | Charm `raceCharm` T2 is charm 1 alone; Dream Siphon `raceDreamSiphon` T1 is 100 + drain .4. |
| Borrowed Claw `raceBorrowedClaw` (beastabilities) | T1 / 25 / 1 / 100 + stealSpell, CD3 | T2 / 50 | Spellsteal `raceSpellsteal` T2 CD3 steals with no damage. |
| Filibuster `raceFilibuster` (politics) | T1 / 25 / 1 / silence zone 3×3 × 2 | T2 / 50 | Skull Crack T3 pays 75 MP for silence 1 on one target. |
| Knife Throw `knifeThrow` (spygear) | T1 / 25 / 1 / 100 + marked 1 | T1 / 25 (keep) | Marked 1 is a rider; noted because Predictive Model sells marked 3 alone at T1 — the debuff column, not this row, is the odd one. |
| Sonic Boomerang `raceSonicBoomerang` (sonic) | T1 / 25 / 1 / 80 line ×2 passes | T1 / 25, 50 per pass | 160 per enemy in a line at T1; Suppressive Fire is 80 once. |
| Mandible Strike `raceMandibleStrike` / Ki Volley `raceKiBlast` / Flurry of Blows `raceFlurryOfBlows` | T1 / 25 / 1 / 135, 135, 132 | T1 / 25, 105, 105, 108 | Elbow Grease `raceElbowGrease` T1 is 90 in one hit. |
| Fissure `sharedFissure` (earth) | T1 / 25 / 1 / 100 + stagger + chasm | T1 / 25, 80 | Stonefall `raceStonefall` T1 is 100 + stagger, no terrain. |
| Trunk Throw `trunkThrow` (nature) | T3 / 75 / 1 / 100 | T3 / 75, 125 | Precision Shot T3 125; Green Thumb was hiding the number. |
| Recursive Loop `raceRecursiveLoop` (artificialintelligence) | T3 / 75 / 1 / 125 (dead bonus) | T3 / 75 with a live `bonusVsStatus` | Without the bonus it is Long Rifle without the range. |
| Long Rifle `raceQuickDraw` (huntingskills) | T3 / 75 / 1 / 125 rng 5 | T3 / 75, 135 rng 6 ignoreArmor | Precision Shot T3 125 rng 5 + finisher already exists. |
| To Be Continued `raceToBeContinued` (maincharacter) | T3 / 75 / 1 / 135 delayed | T3 / 75, 160 | Take Aim T4 pays 180 for the same delay; Robo Punch T3 is 135 instant + finisher. |
| Ambush Lunge `raceAmbushLunge` (beastabilities) | T3 / 75 / 1 / 125 rng 3 | DELETE | Pounce T1 120 rng 3 in the same family. |
| A Really Good Punch `reallyGoodPunch` (martialarts) | T4 / **25** / 1 / 180 | T4 / 25, CD3 | The pin is the joke; keep it, gate it. Every other T4 180 costs 100. |
| Hocus Pocus `raceHocusPocus` (witchcraft) | T4 / **25** / 1 / 180 | T4 / 100, 160 + hexed finisher | The pin is an error: no identity in the text, and it is the cheapest damage-per-MP row in the rack (7.2/MP vs T4 median 1.6/MP). |
| Dragon Toss `raceDragonToss` (dragonabilities) | T3 / 75 / 1 / 70 (+25/lvl) | T3 / 75, 100 base | Abduction Beam T3 110 (+25/lvl), no flight needed. |
| Spike the Ball `raceSpikeTheBall` (football) | T3 / 75 / 1 / 80 aoe r1 | T3 / 75, 125 | Bone Barrage `raceBoneBarrage` T3 125 aoe r1 + DEF−1. |
| Rampart `rampart` (earth) | T4 / 100 / 1 / 60, 3-tile wall | T2 / 50 | Walls of Camelot `raceShieldWall` T2 / 50 / 60 is the same wall. |
| Scorched Earth `sharedScorchedEarth` (fire) | T3 / 75 / 1 / 70, 3 tiles | DELETE | Wall of Fire `wallOfFire` T3 / 75 / 80 + burn 2 + 3-round fire, same family. |
| Kiss of Decay `raceKissOfDecay` (infernalcourt) | T3 / 75 / 1 / 100 drain | T3 / 75, 125 | Symbiotic Drain T3 125 .4. |
| Cuffed `racePoliceCuffs` (policetraining) | T3 / 75 / 1 / 60 + root 2 | T2 / 50 (+ silence 1) | Anchor T1 is root 2 alone. |
| Nematocyst Net `raceJellyNet` (jellyfish) | T3 / 75 / 1 / 95 + root 2 | T3 / 75, 125 | Sleep Paralysis `raceSleepParalysis` T3 125 + root 2. |
| Lockdown `racePoliceLockdown` (policetraining) | T4 / 100 / 1 / 120 aoe r1 + slow 2 | T4 / 100, 160 | Plandemic T4 160 aoe r1 + poison 3. |
| Prophecy of Disaster `raceProphecyOfDisaster` (mothman) | T4 / 100 / 2 / 140 r2 | T4 / 100, 160 | Every other T4 r2 is 160. |
| Time Rewind `raceTimeRewind` (temporal) | T4 / 100 / 1 / 160 | keep; the echo is live | `echoLastDealt` replays the target's last hit (cap 500) — desc must say it. |
| Ancient Magic `raceAncientMagic` (ancientknowledge) | T4 / 100 / 1 / 180 | T3 / 75, 135 ignoreArmor | Family has two T4 180s and no T3. |
| Dragon Fist `raceDragonFist` (martialarts) | T4 / 100 / 1 / 180 | T3 / 75, 135 + burn finisher | Family has two T4 180s and no T3. |
| Carrion Feast `raceCarrionFeast` (ghoulish) | T3 / 75 / 1 / 25% self heal | T3 with corpse scaling, else T1 | Reassemble T2 30%, Self-Repair T2 35%. |
| Phase Shift `racePhaseShift` (shadow) | T3 / 75 / 1 / invis 1 CD2 | T2 / 50 | Camouflage `camouflage` T2 identical; Blurry Photo T2 better. |
| Cryptid Vanish `raceCryptidVanish` (cryptid) | T3 / 75 / 1 / 2 tiles + invis 2 | T2 / 50 or DELETE | Agent Vanish T2 3 tiles + invis 2. |
| Eject! `raceEject` (mecha) | T3 / 75 / 1 / 3 tiles | T1 / 25 or rewrite | Mirror Blink T1 3 tiles. |
| Phase Walk `racePhaseWalk` / Gravity Boots `raceGravityBoots` / Ocean Current `raceJellyDrift` | T2 / 50 / 3 tiles | T1 / 25 | Mirror Blink T1 3 tiles. |
| Shadow Step `raceShadowStep` (shadow) | T3 / 75 / 4 tiles no LoS CD2 | T2 / 50 | Spirit Walk T2 4 tiles + invisible. |
| Instant Transmission `raceInstantTransmission` (ki) | T3 / 75 / 5 tiles | T2 / 50 (or free-action rewrite) | Door Dash T1 5 tiles. |
| Dimensional Fold `raceDimensionalFold` (fractal) | T1 / 25 / swap any unit rng 5 | T2 / 50 | Skin Swap / Temporal Shift sell the same swap at T3. |
| Skin Swap `raceSkinSwap` (trickery) | T3 / 75 / swap rng 4 | T2 / 50 | Miracle `raceWingsOfMercy` T2 swap + heal. |
| Iron Grip `ironGrip` (dirtyfighting) | T2 / 50 / root 2 rng 1 | T1 / 25 | Anchor T1 root 2 rng 3. |
| Psychosis `psychosis` (psychic) | T2 / 50 / M DEF−1 | T1 / 25 | Tin Foil Hat T1 is one stage. |
| Spotlight `racePopSpotlight` (stagepresence) | T3 / 75 / DEF−1 M DEF−1 CD2 | T2 / 50 | Discordance T1 is three stages' worth. |
| Naughty List `raceNaughtyList` (christmasspirit) | T3 / 75 / ATK−1 | T2 / 50 (+DEF−1, marked 3) | Steal from the Rich T2 ATK−1. |
| Calcify `raceCalcify` (livingstone) | T3 / 75 / M ATK−2 | T2 / 50 | Two stages = Spotlight weight. |
| Neural Hack `raceNeuralHack` (computerhacking) | T3 / 75 / jammed 1 | DELETE or tech-possess rewrite | Deneuralizer T1 jammed 2. |
| Implant `raceImplant` / Infernal Conscription `raceInfernalConscription` | T2 / 50 / marked 3 | Implant T2 with scanner; Conscription DELETE | Predictive Model / Red Eyes T1 marked 3. |
| Audible `raceAudible` (football) | T3 / 75 / SPD+1 aura r2 | T2 / 50 | Royal Decree T1 ATK+1 aura r2. |
| Nitro Boost `raceNitroBoost` (drivingskills) | T3 / 75 / SPD+1 self | T2 / 50, SPD+2 | End Zone Dance T1 is one stage. |
| Underdog Spirit / Monkey Business / Blood Ritual / Wish Granted (T3 ATK+1) | T3 / 75 | T3 only with the §1 rewrites | End Zone Dance T1 ATK+1. |
| Overcalculate / Siege Mode / Ki Charge / Howl (T2 ATK+1) | T2 / 50 | T2 only with the §1 rewrites | Same. |
| Oath of Valor `raceOathOfValor` / Apex Roar `raceApexRoar` (T3 ATK+1 aura) | T3 / 75 | T3 only with the §1 rewrites | Royal Decree T1. |
| Swarm Signal `raceSwarmSignal` (insectoid) | T4 / 100 / ATK+2 aoe r2 | T3 / 75 (or the §1 T4 rewrite) | War Cry `warCry` T2 allies +2 ATK aura r3. |
| Mitosis `raceMitosisSplit` (ooze) | T4 / 100 / regen 2 | T4 only with the clone rewrite | Symbiote Armor T2 regen 2. |
| Prayer `racePrayer` (biblestudy) | T3 / 75 / shield 150 | T2 / 50 (or + Blessed 2 at T3) | Psychic Barrier `racePsychicBarrier` T2 shield 150. |
| Light Shield `racePleiadianShield` (light) | T2 / 50 / 220 + DEF+1 | T3 / 75, aoe r1 | Holy Bulwark T2 160 r1 is the T2 ceiling. |
| Firewall Protocol `raceFirewallProtocol` (computerhacking) | T3 / 75 / **2** / 120 r1 | T3 / 75, 1 AP, 140 | Holy Bulwark T2 160 r1 1 AP. |
| Pupil Shield `racePupilShield` (eyesight) | T1 / 25 / 130 "aoe r0" | T1 / 25, kind shield, 110 | Fortify `fortify` T1 96 single. |
| Heal `heal1` (healingmagic) | T1 / 25 / 192 (+48) | T1 / 25, 150 (+48) | Palm Read T2 190 + cleanse 2. |
| Pink Healing `sentaiPinkHeal` (sentai) | T2 / 50 / 140 | T1 / 25 | Divine Light T1 140. |
| Sanctuary `raceSanctuary` (angelic) | T3 / 75 / 48/turn | T3 / 75, 80/turn | Tidal Blessing T2 52/turn. |
| Adrenaline Rush `raceAdrenalineRush` (humangrit) | T2 / 50 / 55% + SPD+1 + cleanse 2 | T2 / 50, 40% | Self-Repair T2 35% + cleanse 1. |
| Summon Creation `raceSummonCreation` (unethicalscience) | T2 / 50 / 90-dmg 4-hit armored summon | T3 / 75 | Whistle T3 hound 60 dmg 3 hits. |
| Clockwork Turret `raceClockworkTurret` (engineering) | T3 / 75 / 65 dmg | DELETE (moves to trapmaking as Tinker's Contraption) | Deploy Turret T2 110 dmg. |
| Lasso `raceLasso` (ropework) | T1 / 25 / pull 2 + tethered 2 (root + drag + 20/tile) | T2 / 50 | Anchor T1 root 2 alone; Harvest Hook T1 pull only. |
| Cold Spot `raceColdSpot` (haunted) | T2 / 50 / frozen zone × 2 | T3 / 75 | Permafrost T3 frozen 2 is 2 AP + CD2. |
| Dimensional Web `raceDimensionalWeb` (arachnid) | T3 / 75 / slow 2 zone × 2 | T2 / 50 | White Christmas T3 slow zone + ice terrain. |
| Sleigh Dash `raceSleighDash` / Ice Slide `raceIceSlide` | T2 / 50 / 130, 140 + 70 path | T2 / 50, 110 | Zombie Rush T2 130 is a single hit with no path damage. |
| Baleful Gaze `raceBalefulGaze` (eyesight) | T2 / 50 / 130 line rng 5 | T2 / 50, 110 | Sword Beam `swordBeam` T2 100 line rng 3. |
| Choppa `raceChoppa` (streetsmarts) | T3 / 75 / 110 line | T3 / 75, 135 | Fractal Stitch T3 130; Baleful Gaze T2 130. |
| Fluoride Water `raceFluorideWater` (conspiracyknowledge) | T3 / 75 / 125 aoe + silence 2 | T3 / 75, silence 1 | Dark Lullaby T4 silence 1. |
| Requiem `requiem` (sonic) | T4 / 100 / 160 self-aoe **r4** | T4 / 100, r2 | Space Disco / EMP Burst r2. |
| Jurassic Jaw `raceJurassicJaw` (apexpredator) | T4 / 100 / 180 + ignoreArmor + finisher + kill heal + AP refund | T4 / 100, 160 | Dragon Slash T4 180 ignoreArmor + finisher, nothing else. |
| Wrath of the Watchers `raceWrathOfTheWatchers` / Dark Dominion `raceDarkDominion` / Reality Pulse `raceRealityPulse` / Megazord Blast `sentaiMegazordBlast` | T4 / 100 / 180, 170, 170, 180 area | T4 / 100, 160 | Arrow Volley T4 160 r1 1 AP no CD is the honest unit. |
| Every T1 that costs 2 AP: Rapture `raceRapture`, Summon Blood Rain `sharedSummonBloodRain`, Summon Blizzard `sharedSummonBlizzard`, Rally Command `raceRallyCommand`, Dark Feather `raceDarkFeather`, Cataclysm Stomp `raceCataclysmStomp`, Judgment Beam `raceJudgmentBeam` | T1 / 25 / 2 AP | Rapture DELETE; the two weathers → T2 1 AP; Rally Command → 1 AP; Dark Feather → T2 1 AP; Cataclysm Stomp → 1 AP r1 80; Judgment Beam → 1 AP 80 | A T1 is the cheap action; 2 AP at T1 is a contradiction in every case (the T1 comparables are all 1 AP). |
| T2 2-AP rows: Walk the Plank, Pulse Lattice `racePulseLattice`, Shadow Infiltration, Invulnerable, Infernal Decree, Stampede, Ki Wave | T2 / 50 / 2 AP | all → 1 AP except Pulse Lattice (a lattice detonation is categorical) | Their T2 comparables are 1 AP. |
| **Off-ladder MP pins** | | | |
| Green Arrow `sentaiGreenArrow` | T2 / **25** / no healAmt | T1 / 25, healAmt 150 | Error: the row is broken (`statusEffects: 'heal'`), the pin is the only T1 thing about it. |
| Sacrifice `raceSacrifice` | T2 / **25** | keep pin | Deliberate: the price is 30% of the giver's HP; MP is not the cost. |
| Tithe `raceCultTithe` | T2 / **25** / 50 + item | T1 / 25 | The pin says T1; the SP should agree. |
| EMP Grenade `raceEMPGrenade` | T2 / **75** / 100 aoe r1 + jammed 2 | T2 / 50 | Error: a T3 price on a T2 row (Yellow Thunder T2 80 aoe + stagger is 50). |
| Lucid Trap `raceLucidTrap` | T2 / **25** / stun trap, never uses the slot | T1 / 25 | Deliberate-cheap; make the tier match (Tesla Coil `raceTeslaTrap` is T1 25). |
| Grim Resolve `raceGrimResolve` | T2 / **25** / ATK+1 | passive (§1) | The pin admits it is not a T2. |
| Divine Judgment `raceDivineJudgment` | T3 / **50** / 2 AP / 135 cross | T3 / 75, 1 AP | Error: the pin was balancing the 2 AP; fix both. |
| Voodoo `raceVoodoo` | T3 / **25** / link, no damage | keep pin | Deliberate: cheap to cast, 3 SP to equip — a link that deals nothing itself. |
| A Really Good Punch `reallyGoodPunch` | T4 / **25** / 180 | keep pin + CD3 | Deliberate joke; needs a gate. |
| Hocus Pocus `raceHocusPocus` | T4 / **25** / 180 | 100 | Error (see above). |
| Black Hole `sharedBlackHole` | T4 / **75** / 2 AP CD2 / 160 r2 pull | keep pin | Deliberate: 2 AP + CD2 is the price; shared cosmic. |
| Poseidon's Wrath `racePoseidonsWrath` | T4 / **75** / 2 AP / 170 water-only | keep pin | Deliberate: conditional target set. |
| Space Disco `raceSpaceDisco` | T4 / **75** / 160 r2 + discord 1, CD2 | 100 | No identity behind the pin; Requiem is 100. |

### 3. Descriptions that lie (dead fields)

`SPELL_DEAD_FIELDS` in data.js lists `bonusVsDebuffed, guaranteedCrit, executeBonusPct, selfCenter, lineLength, equipCost, slotCost, equipReq` — the engine reads none of them, and the auto-describer (data.js `if (d.guaranteedCrit) S.push('Always crits.')`, `if (d.bonusVsDebuffed) S.push('Deals bonus damage to debuffed targets.')`) still writes the sentence from the dead field. Delete the field and the lie goes with it; implement it and the sentence becomes true. Live mechanics available: `bonusVsStatus: {status: id | [ids], mult}` (the finisher; Corroded counts as burn+poison), `executeBelowPct` (Take Aim: outright kill at or under the fraction, judged before the hit), `executePct` (Walk the Plank: kill under the fraction in the terrain flow), `ignoreArmor`, `unholyBonus` (flat add vs `unholy`/`anomaly` types), `sneakBonus` (×1.5 while the caster is invisible), `echoLastDealt`, `boomerang`, `lineZone` + `zoneDuration`, `purgeBuffs`, `spawnDecoy`, `stealSpell`, `onKillHealPct`/`onKillRefundAp`, `autoTargetLowestHp`, `delayedMark`. A guaranteed crit is **not implemented** anywhere (`rollCrit` only reads AWR); a "more damage the lower their HP" scalar for spells is **not implemented** (`lowHpBonus` on a spell row is a HEAL bonus; the damage version is a passive object read through `unitPassiveValue`).

| Row | The text promises | The row does | Fix |
|---|---|---|---|
| Recursive Loop `raceRecursiveLoop` (artificialintelligence T3) | "Deals bonus damage to debuffed targets." (`bonusVsDebuffed: 0.50`) | 125 magic, nothing else | Implement as `bonusVsStatus: {status: ['jammed','marked','scanner','stun'], mult: 1.5}` — the AI races' own setups (Predictive Model in-family; Memory Leak, System Analysis, Blue Screen from computerhacking, which both ai and glitch carry — Deneuralizer is advancedtechnology and neither AI race has it). Drop `bonusVsDebuffed`. |
| Dark Justice `raceDarkJustice` (dirtyfighting T1) | same (`bonusVsDebuffed: 0.40`) | 100 charge | DELETE the row (§1 O). If kept: `bonusVsStatus: {status: ['stagger','grievous','root','silence'], mult: 1.5}`. |
| Dead Eye `deadEye` (weaponstraining T4) | "Always lands a critical hit." (`guaranteedCrit: true`) | 180 + marked 2 | Not implemented. Rewrite the desc: "180 physical, Marked 2." Or implement `guaranteedCrit` in `rollCrit` (one line: `if (spell && spell.guaranteedCrit) return true`) — the crit multiplier is ×1.8 (×2.0 with Deadeye `passiveDeadeye`), which would make this 324 at T4; if implemented, RECOST dmg 180 → 120. Recommend: delete the field, keep 180. |
| High Noon `raceHighNoon` (cowboyskills T4) | "Always a critical hit." (`guaranteedCrit: true`) | 180, no LoS, stagger/tethered finisher, 2 AP | Same. Delete the field; the "one bullet through every wall" is `ignoresLineOfSight` and is real. Set 1 AP once the crit is gone. |
| Weigh the Heart `raceWeighTheHeart` (ancientknowledge T4) | "Deals more damage the lower the target's HP." (`executeBonusPct: 0.5`) | 180 + stagger finisher | Nearest live mechanic: `executeBelowPct: 0.2` (kill outright at ≤20% — "the heart is weighed, the feather wins") — or implement `executeBonusPct` in the `_riders` block beside `unholyBonus` (battle.js ~5250): `dmg *= 1 + pct * (1 − hp/maxHp)`. Take the execute; it is what the name means. |
| No Mercy `raceNoMercy` (dirtyfighting T4) | "Deals far more damage the lower the target's HP." (`executeBonusPct: 0.75`) | 180 + stagger finisher, 2 AP | Same choice. `executeBelowPct: 0.25` ("they had it coming") at 1 AP, or the scalar. |
| Ground Slam `groundSlam` (earth T3) · Cosmic Slam `raceCosmicSlam` (cosmic T3) | (`selfCenter: true` — no text) | aoe r1 at rng 0 = already centred on the caster | No lie in the text; the field is noise. Delete it, or change kind → `barrage` (the live self-aoe kind: Brutal Slam `raceBrutalSlam`) so the shape reads as self-centred in the rack. |
| Knife Throw `knifeThrow` · Sneak Slash `sneakSlash` (spygear) | (`equipReq: 'knife'` — no text) | no equipment system exists | Delete the field. Sneak Slash's "bonus damage while invisible" is `sneakBonus` and is LIVE — keep that sentence. |
| **Other lies found in families.md** | | | |
| Swarm Signal `raceSwarmSignal` (insectoid T4) | "Raises ATK by 1 stage." | `stage: atk+2` | Desc understates; say +2 (or retier per §1). |
| Heat Death `raceHeatDeath` (cosmic T4) | "Impose entropy on a 3×3 area for 2 turns — everything inside takes HEAVY damage." | kind `aoe` + `zoneDuration: 2`: one 180 hit + slow 1; `zoneDuration` is read only by `lineZone` rows and the zone kinds — the 2-turn field is dead here | Either rewrite the desc (one blast) or make it a zone: kind `zoneDebuff` with `zoneDmgPerTurn: 90` (new key, or reuse the delayed-zone flow). |
| Time Rewind `raceTimeRewind` (temporal T4) | "Deals HEAVY magic damage to a Single Enemy." | 160 AND `echoLastDealt: true` (live: replays the target's last blow, cap 500) | Reverse lie — the row is better than it says. Desc: "160 magic, then the target's last blow is replayed against them (up to 500)." |
| Thunderbolt `thunder1` (lightning T2) | "Deals MEDIUM magic damage to a Single Enemy." | `chainProfile: [125, 82, 50]` — chains to two more | Reverse lie. Desc: "130 magic that chains: 82 to a second enemy, 50 to a third." |
| Radiant Bolt `radiantBolt` (angelic T1) · Smite `raceSmite` (light T1) | plain "MEDIUM magic damage" | `unholyBonus: 40` / `bonusVsUnholy: 0.50` | Radiant Bolt: reverse lie (the bonus is live and unwritten). Smite: the key is `bonusVsUnholy`, which battle.js never reads (0 hits) — a third dead field the `SPELL_DEAD_FIELDS` list misses. Rename to `unholyBonus: 50` and write the sentence on whichever of the two survives (§1 O deletes Radiant Bolt). |
| Exorcism `exorcism` / Divine Smite `raceDivineSmite` / Crusade `raceCrusade` | "Deals bonus damage to Unholy targets." | `unholyBonus` 80 / 80 / 60 — live | True. Fine. |
| Green Arrow `sentaiGreenArrow` (archery T2) | "Restores a MEDIUM amount of HP." | no `healAmt`/`heal`; `statusEffects: 'heal'` is a string (renders "status:undefined") | Broken row: set `healAmt: 150`, remove `statusEffects`. |
| Iron Dome `shieldBash` (militarysupport T3) · Nordic Accord `raceNordicAccord` (galacticfederation T4) | kind `heal/healAll` | `heal: 0` — pure stat auras | Kind lie: change kind to `warCry` (aura r99). summary.md's "sustain" counts for marksman/mech/general/politician/nordic are inflated by these two. |
| Stuffed Double `raceStuffedDouble` (scarecrow T2) · Tunnel Network `raceTunnelNetwork` (insectoid T3) · Cold Spot `raceColdSpot` (haunted T2) | "Deploys an object on an empty tile." / "Deploys a linked pair of objects." / "Creates a hostile zone that weakens enemies inside" | decoy that draws melee AND ranged (1 HP) / a two-ended tunnel / a Frozen zone | Placeholder text on real mechanics; write them. Stuffed Double: "a straw decoy; enemies target it (60 HP)". |
| Sleigh Dash `raceSleighDash` (christmasspirit T2) · Bull Rush `raceBullRush` (horns T4) | "dealing WEAK physical damage to enemies along the path" / "Dashes through the battlefield." | 130 (Sleigh) and 170 (Bull Rush) to the TARGET plus path damage | Desc omits the main hit on both. |
| Frozen Punch `raceFrozenPunch` (winter T1) | "MEDIUM physical damage" | 90 | Say WEAK, or set 100. |
| Absolution `raceAbsolution` · Blurry Photo `raceRealityShift` · Wish Granted `raceWishGranted` · Adrenaline Rush `raceAdrenalineRush` · Self-Repair `raceSelfRepairProtocol` · Palm Read `raceSpiritChannel` · Herbal Remedy `raceHerbalRemedy` · Ayahuasca Retreat `raceAyahuascaRetreat` | no mention of a cleanse | `cleanse: 99 / 99 / 2 / 2 / 1 / 2 / 2 / 99` | Reverse lies: the cleanse is the reason to pick several of them; write it (Immortal Cycle `raceJellyRebirth` already says "cleanses 2 debuffs" — the model text). |
| Nuke `sharedNuke` (militarysupport T4) | "Cooldown: 2 rounds." | no `cooldown` field on the row (Black Hole, Merkaba, Meteor carry a real CD2) | Add `cooldown: 2` (the §1 verdict) or drop the sentence. |
| Double Pump `doubleShot` (weaponstraining T1) | "Hits harder on Marked targets." | nothing on the row; Marked's `bonusDamage` is consumed by ANY hit (`consumeMarked`) | True of every hit in the game; the sentence implies a special bonus. Drop it, or give the row a real `bonusVsStatus: {status:'marked', mult:1.5}` (which would also make Marked's 7 setups pay off somewhere besides the generic consume). |
| Dragonfear `raceDragonfear` · Labyrinth Roar `raceLabyrinthRoar` · Dread Aura `raceDreadAura` · Primal Roar `racePrimalRoar` | "ATK lowered by 2 stages and DEF by 1 stage" | `status: discord 2` (Discord = −2 ATK / −1 DEF) | True, but four different texts for one status; use the status name so Discord's 6 payoffs read as payoffs. |
| Nebula `sharedNebula` (cosmic T3) | "goes SUPERNOVA" | 135 aoe r2 + burn 2 | Supernova `raceSupernova` is a different row in the same family; rename the sentence (a nebula collapses, it does not go supernova). |
| Chooser of the Slain `raceChooserOfSlain` (holydefense T4) | "Revives a fallen ally." | no `revivePct` in the rack line (Revive `revive1` shows 0.45) | Confirmed: the row has `kind: 'revive', apCost: 2` and NO `revivePct` — it revives at whatever the engine defaults to, so the two revives differ only by an AP tax. Pin `revivePct: 0.6` and 1 AP (per §1), or delete. |

Statuses whose setups have NO payoff anywhere (synergy.md): blessed (2 setups), blind (2), corroded (1 — but it counts as burn+poison so it inherits 19 payoffs; fine), extendedClips, grievous (2), incendiary, indomitable, invisible (11 setups, 0 payoffs — but `sneakBonus` on Sneak Slash IS an invisible payoff the scanner missed), jackOfAll, levitating, marked (7 setups — the generic `consumeMarked` bonus is the payoff, not a finisher), minimize, monster, overclock (4), pixieDust, possessed (4), protect (6), regen (3), scanner, shadowRealm, sparkling, stoneform, taunt, wet (1: Bloom `raceJellyBloom` — a status with no effect listed and no payoff; give Wet a meaning: ×1.25 lightning/ice damage taken, or delete it). Blind and Grievous are self-justifying (miss chance, half healing) and need no finisher. Wet does nothing yet.

### 4. Spells that should be upgrades, not spells

Registry vocabulary: `dmgMult` (Empowered), `ricochet: {radius, mult}` (Ricochet), `extraTargets`/`extraTargetsMult` (Forked), `statusBonus: {add}` (Exploit), `pushDistance` (Knockback), `pullDistance` (Undertow), `aoe: {preset, mult}` (Blast '3x3' ×0.5 / Widen '5x5'), `costDelta` (Efficient), `rangeDelta` (Long Reach), `statusDuration` (Lingering), `deployCapDelta` (Surplus), `turret: {…}` (Overclocked), `gun: {…}` (Hot Loads). Upgrades may carry `families: []` to scope them.

**Rows that are a base row + a shipped upgrade (delete the row, the upgrade already exists):**
- `raceFeralDive` (Feral Dive T3 125) = `racePredatorLeap` + Empowered ×2. DELETE.
- `raceAmbushLunge` (T3 125) = `racePounce` + Empowered. DELETE.
- `raceIceShard` (T1 100 slow 1 rng 3) = `raceIceSpear` minus Lingering minus Long Reach ×2, same family. DELETE.
- `raceNeuralHack` (T3 jammed 1) = `raceDeneuralizer` minus Lingering. DELETE (or the tech-possess rewrite).
- `raceShieldMaiden` (T2 120 r0) = `raceHolyBulwark` minus range, same family. DELETE.
- `raceLuminousShield` (T2 140 r0) = `racePleiadianShield` minus 80 minus DEF+1, same family. DELETE.
- `raceFireForEffect` (T4 160 r2 burn finisher) = `sharedNuke` + Exploit-shaped finisher, same family. DELETE, move the finisher onto Nuke.
- `sharedScorchedEarth` (T3 70, 3 tiles) = `wallOfFire` minus burn minus the lasting fire, same family. DELETE.
- `raceClockworkTurret` (T3 65 dmg) = `deployTurret` minus 45 dmg minus Surplus, same family. DELETE from engineering (becomes trapmaking's Tinker's Contraption).
- `raceRapture` (T1 protect 1, 2 AP) = `protect1` with an AP tax; four of the six angelic races (priest, angel, seraphim, nun) also hold light — fallen angel and valkraye do not, see §1 E. DELETE.
- `raceCurseOfMisfortune` (Family Curse T3 hexed 3) = `sharedHexOfToil` exactly, same family. If not rewritten to the 3×3 hex: DELETE and add a family-scoped upgrade **"Contagious"** (2 SP, families: ['witchcraft'], roles: ['effect'], requires 'status', patch `aoe: {preset: '3x3'}` for status rows — new: `aoe` on an effect row) so Hex of Agony can be widened.
- `raceForestAmbush` (T1 ATK+1) → folded into `camouflage`. DELETE.
- `improvise` (T1 80) → `raceElbowGrease` covers. DELETE (g7).
- `radiantBolt` (angelic T1 100 unholy 40) → `raceSmite` (light T1 100 unholy) is in the pool of priest, angel, seraphim and nun; fallen angel and valkraye have no light, but keep their own T1 hits (Fallen Grace `raceFallenGrace`, Valkyrie Spear `raceValkyrieSpear`). DELETE.
- `raceInfernalConscription` (T2 marked 3) → `racePredictiveModel`/`raceRedEyes` at T1 elsewhere; not needed in a 7-row family. DELETE.

**Rows that should become a named upgrade on a base row (new patch keys marked NEW):**
- `raceStompOut` Curb Stomp → upgrade **"Grievous"** (1 SP, families: ['dirtyfighting','ghoulish'], roles damage/damageEffect, requires 'singleDmg', patch `addStatus: {id: 'grievous', duration: 2}` NEW) on `raceBodyCheck` / `skullCrack` / `raceGhoulishBite`. Keep Curb Stomp only if dirtyfighting wants a T2 hit; otherwise delete and let the upgrade carry the wound.
- `raceRocketFist` Rocket Fist → it IS `raceHydraulicPunch` + Long Reach ×2 minus the jammed finisher. Keep as the ranged twin OR delete and give robot an upgrade **"Rocket Arm"** (1 SP, families: ['robot'], patch `rangeDelta: 2`) on Synthetic Punch.
- `raceSplittingArrow` Splitting Arrow (T3 125 ricochet + burn finisher) = `racePiercingArrow`-tier hit + Ricochet (2 SP) + Exploit. As a spell it costs 3 SP; the pieces cost 6 SP. That discount is fine for a single-race family — but `racePrismBurst` (light T3 125 ricochet, no finisher) is exactly "Smite-tier T3 hit + Ricochet" and light has no plain T3 hit: REWRITE Prism Burst into a plain 135 T3 hit and let Ricochet (the upgrade) make the burst.
- `ricochet1` Ricochet (weaponstraining T2 100 + bounce) = a T1 gun hit + the Ricochet upgrade, and it bears the upgrade's name. Rename the spell (**"Trick Shot"**) or delete it and let Double Pump + Ricochet be the build; guns have 8 rows.
- `riderImpactRound` Impact Round (T2 90 + 50% splash on adjacent) = a 90 shot + Blast (3×3 ×0.5). Keep only because Gun Training needs a T2 body; otherwise DELETE.
- `riderScatterShot` Scatter Shot (T2 3 random × 64) ≈ Forked ×2 with no aim. KEEP (random targeting is its own thing) but note the overlap.
- `raceIceSpear` vs `raceGraveChill`: Grave Chill (haunted) = Ice Spear minus Lingering minus Long Reach ×2 — different families, keep both, but it shows the slow-hit ladder is one row + three 1-SP upgrades.
- `raceOverclock`/`overclock` (ally overclock 2) vs `raceBlackBudget` (ally overclock 1) = Overclock minus Lingering. Rewrite Black Budget (§1) or delete.
- `raceChemtrails` (T2 100 line + poison 2 + poison terrain) vs `raceFormicAcid` (T1 80 line + DEF−1 + poison finisher + poison terrain): Chemtrails = Formic Acid + Empowered + a status instead of a finisher. Both stay (different families), but it means Empowered on Formic Acid is a 1-SP Chemtrails.
- `raceWebSnare` (T2 100 aoe root 1) = `raceWebLaunch` (T1 80 root 1) + Blast + Empowered, same family. KEEP (arachnid has 3 rows) but this is the pattern: a T1 single + Blast (2 SP) is a T2 area for 3 SP total — the T2 area row at 2 SP is a 1-SP discount, which is the correct reason for it to exist as a row.

**The reverse — shipped upgrades that already provide what a separate row sells:**
- Blast on `raceInfectiousBite` (T1 100 poison 3) = `raceCorrosiveSplash` (T1 80 aoe poison 2) for 3 SP instead of 1 — the row is the discount; keep both.
- Widen on `meteor` (3×3 → 5×5) = `sharedNebula` (5×5, 135, burn 2) for 6 SP vs 3 — the row is cheaper. Keep.
- Knockback on `raceHydraulicPunch` (push 2 → 3) = `raceHornToss` (push 3). Fine.
- Lingering on `raceIceShard` (slow 1 → 2) = `raceIceSpear`'s slow — the reason to delete Ice Shard.
- Long Reach on `raceTitanDrop` (rng 2 → 3) = `raceDivineSwoop`/`raceFeralDive` (rng 3). Fine.
- Efficient on any T2 (50 → 40) is 1 SP; Grim Resolve's 25-MP pin is "Efficient ×2.5 for free" — that is why the pin reads as an error unless the row is deliberately cheap by identity.
- Surplus on `deployTurret` (max 2 → 3) makes `raceClockworkTurret` (max 1, 65 dmg) pointless — the reason it is deleted above.
- Exploit on any finisher (×1.5 → ×2.0): Enthrall `raceEnthrall` already ships a ×2 (`finisher: charm×2`) — it is the only row that pre-bakes Exploit; fine as a T3 identity, but Exploit should be excluded on it (`excl`) or it reaches ×2.5.

**New upgrades worth adding (family-scoped, from the audit):**
- **"Reinforced"** (1 SP, roles ['effect'], requires shield, patch `shieldDelta: 40` NEW) — lets the four surviving shield rows scale instead of five near-copies.
- **"Grievous"** — above.
- **"Contagious"** — above.
- **"Overcharged"** (1 SP, families: ['robot','cyberpunkweapons','artificialintelligence'], requires 'status', patch `addStatus: {id: 'jammed', duration: 1}` NEW) — Jammed has 7 payoffs and only 6 setups; the tech families need one more setter without another "Weakens a Single Enemy. Applies Jammed." row.

### 5. The tier question

**What the matrix says.** T4 holds 119 rows: 61 damage + 42 damageEffect = 103 (87%), 8 effect, 5 heal, 2 deploy, 1 utility, 0 movement, 0 terrain. T1 holds 174 rows and is the only tier with passives (29, all 1 SP). Damage-only single rows: T1 n=91 med 100 / 25 MP, T2 n=47 med 100 / 50, T3 n=61 med 125 / 75, T4 n=102 med 160 / 100. Damage per MP falls every tier (4.0 → 2.0 → 1.67 → 1.6): the reason to buy a higher tier is burst per AP, not efficiency. 45 of the 119 T4s cost 2 AP; 180/2 = 90 per AP, which is less than a T3's 125 per AP. So a 2-AP T4 without a categorical effect (r2, hard CC, revive, summon) is worse than the T3 it replaces on every axis except the SP it burns.

**The 16-SP / 7-slot economy with 4 tiers.** Kit shapes: 4+3+3+2+2+1+1 (7 rows, one ult); 4+4+3+2+2+1 (6 rows, two ults); 4+4+4+2+1+1 (6 rows, three ults, two of them probably 2-AP — a kit that cannot cast twice a round); 3+3+3+3+2+1+1 (no T4, four T3s); 4+3+2+2+2+2+1. Passives cap at 2 rows = 2 SP. That is five genuinely different shapes, and the "one T4" shape is the natural one — it gives every unit an ult and six cheaper actions. This is good for team building: the T4 is the row a player builds the rest of the kit around (set up its finisher with the T1/T2 statuses, protect the 2-AP turn with the T2 escape).

**The 3-tier alternative.** Fold every T4 into T3 as a "capstone" with a pinned 100 MP. SP max must drop or a 7-slot kit fills with capstones: 3+3+3+3+2+1+1 = 16 puts four 100-MP rows on one unit. With 3 tiers the honest max is 12 SP: 3+3+2+2+1+1 (6 rows, two capstones), 3+2+2+2+1+1+1 (7 rows, one capstone), 3+3+3+1+1+1 (three capstones, three T1s). What collapses: 33 populated families have no T4 today (Alien Weapons, Arachnid, Arcane, Astral Projection, Astrology, Astronaut Camp, Beast, Blood, Chemistry, Computer Hacking, Cryptid, D.O.O.R. Gun, Deep State, Desert Acclimation, Horseback Riding, Hunting Skills, Ki, Lightning, Living Stone, Machinery, Main Character, Mech Pilot, Nature, Poison, Politics, Prism Lattice, Ropework, Stone Age, Street Smarts, Teamwork, Tentacle Appendages, Thievery, Trap Making — Cowboy Skills has a T4 but no T3) — a fold makes them complete without writing 33 new ults. What it costs: the T4 "categorical" language (r2 + status, revive, summon) has nowhere to sit above the ordinary T3, so the capstone rule must be enforced by MP pin + CD instead of tier, and 103 damage rows land in one bucket with the 61 existing T3s.

**Recommendation: keep 4 tiers, redefine T4.** Rule: **one T4 per family** (today cosmic has 4, water 4, earth 4 listed / 3 real, infernalcourt 3, athleticism 3 listed / 2 real, robot 4 listed / 2 real, light 2, psychic 2, fallenangel 2, martialarts 2, ancientknowledge 2, swordsmanship 2, psychadelic 2, ufo 2, stagepresence 2, militarysupport 2, titan 2, weaponstraining 2, demonicabilities 2, biblestudy 2, temporal 2, advancedtechnology 2; cowboyskills, deepsea and ghoulish already have exactly one), and **a T4 must be categorically bigger than a T3** — a 5×5, a self-contained finisher (sets and pays its own status: Dark Lullaby, Bad Trip, Tidal Slam, Heat Vision, Avalanche Strike, Mind Shatter), a hard CC on an area (Eternal Slumber, Blizzard Present), a revive, a summon, a team-wide aura, a terrain rewrite (Great Flood, Cataclysm Decree), or an execute (Take Aim). Anything that is "a T3 + 35 damage" folds to T3 with a 75-MP cost. With the §1/§2 changes already made, the fold list is:

- → T3 (75 MP): Ancient Magic `raceAncientMagic`, Dragon Fist `raceDragonFist`, Rampage `rampage`, Rampart `rampart` (→ T2), Mitosis `raceMitosisSplit` (unless the clone rewrite), Swarm Signal `raceSwarmSignal`, Nordic Accord `raceNordicAccord` (a two-stage team aura is Iron Dome + one stage; T3), Extended Clips `raceExtendedClips` (T3 unless range+1 is judged categorical), Lockdown `racePoliceLockdown` (T3 at 125 + slow 2, or T4 at 160), Arrow Volley `raceArrowRain` (160 r1 with no rider is the T4 floor — keep as the reference row, but it is the weakest legitimate T4), Blessed Blade `raceBlessedBlade` (170 r1 rng 1, no rider → T3 135), Kill Mode `raceChassisSlam` (unless the overclock rewrite), Ninefold Scratch `raceNinefoldScratch` (unless 9×20), Demonic Claw `raceDemonicClaw` / Tendril Strike `raceTendrilStrike` / Excalibur Strike `raceExcaliburStrike` (180 + one 2-round status is the T4 single-target floor; keep, but each is the family's ONLY T4 so the one-per-family rule holds), Time Rewind `raceTimeRewind` (keep at T4 only because the echo is live and uncapped below 500).
- Families with two or more T4s that must pick one: cosmic (keep Black Hole + Heat Death as the two shared/different shapes? no — keep **Supernova** for orb of light's self-aoe and **Black Hole**; Star Decree → T3 delayed 135, Heat Death → T3 zone), earth (keep **Quake**; Stone Drop → T3 125 skyDrop, Rampart → T2), water (keep **Great Flood**; Tsunami → T3 135 w3, Tidal Slam → T3 135, Call of the Deep → T3), infernalcourt (keep **Cataclysm Decree**; Dark Dominion → T3 135 aoe burn, Dark Lullaby → T3 125 + silence), athleticism (keep **Unstoppable Charge**), robot (keep **EMP Burst**; Kill Mode → T3 125 self-aoe), light (keep **Merkaba**; Judgment → T3 135 cross r3), psychic (keep **Mind Shatter**; Migraine → T3 135 M ATK−1), fallenangel (keep **Wrath of the Watchers**; Descending Wrath → T3 135 skySlam), martialarts (keep **A Really Good Punch**), ancientknowledge (keep **Weigh the Heart**), swordsmanship (keep **Dragon Slash**; Blessed Blade → T3), psychadelic (keep **Ego Death**; Bad Trip → T3 135 self-contained), ufo (keep **War of the Worlds**; Crop Circle → T3 125 r2 deform), stagepresence (keep **Stadium Show**; Space Disco → T3 125 r2), militarysupport (keep **Nuke**), titan (keep **Giant Smash**; Colossal Crush → T3 135), weaponstraining (keep **Dead Eye**; Extended Clips → T3), demonicabilities (keep **Hellmouth**; Demonic Claw → T3 135 + marked 2), biblestudy (keep **Hallelujah**; Exorcism → T3 135 with its finisher — the contract/hexed payoff still lands), temporal (keep **Time Rewind** for the live echo; Reality Pulse → T3 135 aoe r1 + discord 1), advancedtechnology (keep **Railgun**; Classified Weapon → T3 135 + jammed finisher), cowboyskills/deepsea/ghoulish/others already have one.
- SP max stays 16; the passive cap stays 2. The kit template "one T4, two T3, two T2, two T1" becomes true by construction instead of by convention, because there is exactly one T4 to choose per family and it is always worth 4 SP.

If mondo takes the 3-tier fold instead: every row above marked "keep at T4" becomes a T3 with `cost: 100` pinned (and its CD/2-AP kept as the gate), every "→ T3" row becomes an ordinary T3 at 75 MP, SP max becomes 12, the passive cap stays 2, the MP ladder becomes 25/50/75 with the capstone pin at 100, and the `tier` field on the 119 rows is rewritten by `bake-spell-mods.js --stamp-tiers` from a library export — no engine change, since tier is already just the SP number.


---

## S. Synergy and team building


Sources: synergy.md (status setup/payoff map, per-race loops), summary.md (pools, role x tier, missing tiers), family-index.md, races.md, families.md. One engine fact pulled from the repo because every kit below hinges on it: a unit's MP is the race base and never scales (`computeUnitStats` in data.js: `mp: base.mp`), field MP regen is 3% of max per round (`MP_REGEN_PERCENT = 0.03`, battle.js), spawn-zone regen 15%. A giant (60 MP) can never cast a 100-MP T4 on the field; a juggernaut (40 MP) cannot cast a T2.

### 1. The status economy

Legend: HEALTHY = setups and payoffs on several families; SIGNATURE = one setup + one payoff, deliberately one race/family; SETUP-ONLY = applied, nobody pays; BUFF = an ally status that is its own reward (no finisher wanted); DEAD = applied, does nothing.

| status | setups (n, families) | payoffs (n, families) | verdict | proposal |
|---|---|---|---|---|
| stagger | 23 — earth ×4 (`raceStonefall`, `sharedFissure`, `raceTremorStomp`, `raceQuake`), titan, cowboyskills, policetraining, stagepresence, door ×3, trapmaking, cyberpunkweapons, demonicabilities, horns, cosmic, apexpredator, kaiju ×2, drivingskills, athleticism, football, sentai | 16 — earth ×2, ancientknowledge, sasquatch, titan, cowboyskills, infernalcourt, blackmagic, fallenangel, dirtyfighting ×2, apexpredator, kaiju, robot, horns, football | HEALTHY, the spine of the game | Stagger lasts 1 round and 12 of the 16 payoffs are T4 (5 of those 2 AP: `raceSasquatchSmash`, `raceColossalCrush`, `raceHighNoon`, `raceNoMercy`, `raceBaphometsRite`; the other seven T4 payoffs are 1 AP), so a bruiser cannot set up and finish in one activation — the setup MUST come from a teammate. That is good team-building, but see §4: the payoff races (giant 60 MP, cyclops 65, minotaur 70, dinosaur 60, juggernaut 40, king kong 75) cannot pay the 100 MP. |
| slow | 26 by the script, 25 distinct (Suppressive Fire is counted under both of its ids) — sonic ×2, earth, haunted, shadow, water ×5, psychadelic, militarysupport, policetraining, cosmic ×3, arachnid, wind, ice ×3, ooze, winter, christmasspirit, sentai | 8 — light `judgment`, swordsmanship `crossSlash`, shadow `raceShadowBind`, psychadelic `raceBadTrip`, cosmic `raceStarDecree` `raceEntropicBeam`, water `raceTidalSlam`, apeintelligence `racePrimalSmash` | HEALTHY (over-supplied: 26 setups is the most of any status) | Ice sets slow 3× and pays 0×. Give `raceIceSlide` (ice T2 dash 140, plain) finisher:slow×1.5 with dmg 120 — "skates through the slowed". |
| burn | 21 by the script, 20 distinct (Plasma Whip is counted under both of its ids) — fire ×2, holydefense, piracy, alientechnology ×2, cyberpunkweapons, infernalcourt ×2, fallenangel ×3, cosmic, superheropowers, dragonabilities ×2, royalty, archery, christmasspirit, sentai (+ `raceIncendiaryRounds` via basic attacks, not counted by the script) | 10 — swordsmanship `dragonSlash`, fire `meteor`, light `raceMerkaba`, militarysupport `raceFireForEffect`, fallenangel `raceDescendingWrath`, superheropowers `raceLaserBeam`, infernalcourt `raceCataclysmDecree`, dragonabilities `raceDragonToss`, archery `raceSplittingArrow`, sentai `sentaiMegazordBlast` | HEALTHY | All 10 payoffs are T3/T4; the only T3 (75-MP) burn payoffs are `raceDragonToss` (requiresFlight) and `raceSplittingArrow` (archery, robin hood only). Add a T1/T2 burn payoff for physical teams: `raceExcaliburStrike` stays a setup; give `sentaiRedSlash`-style rows nothing; instead RETIER nothing and give `raceFrozenPunch`'s twin: NEW fire T2 `fireEmberStrike` "Ember Strike" 110 physical, finisher:burn×1.5 (fills fire's missing T2). |
| poison | 15 — spygear, poison ×2, zombie, unethicalscience, jellyfish, infernalcourt, shadow, insectoid, conspiracyknowledge, maincharacter, ghoulish, ooze, archery, symbiosis | 9 — blood `lifeDrain`, spygear `sneakSlash`, zombie `raceOutbreak`, bonedensity `raceMarrowstorm`, poison `raceFormicAcid`, infernalcourt `raceKissOfDecay`, conspiracyknowledge `raceTruthBomb`, ooze `raceAbsorb`, symbiosis `raceSymbioticDrain` | HEALTHY | The Poison element family itself is 4×T1 + `raceSplash` T3 with no T2/T4 — 12 races carry it and its only payoff is the T1 `raceFormicAcid`. Add NEW poison T4 `poisonNecrosis` "Necrosis": single 160 magic, finisher:poison×1.5, consumes the poison for +1 round of ticks up front. |
| discord | 14 — sonic ×2, haunted, cryptid, scarecrow, deepstate, apexpredator, dragonabilities, deepsea, stagepresence, drivingskills, horns, psychic, temporal | 6 — sonic `requiem`, mothman `raceProphecyOfDisaster`, psychic `raceMindCrush`, deepsea `raceDepthCharge`, drivingskills `raceMissileBarrage`, horns `raceBullRush` | HEALTHY | Cryptid (7 races) sets it with `raceDreadAura` T1 and pays nothing: give `raceSasquatchSmash` finisher:stagger,discord (bigfoot loop) and `raceCryptidVanish` nothing. |
| stun | 10 — computerhacking, psychadelic, policetraining, galacticfederation, titan, trapmaking, astral, politics, alientechnology, eyesight | 8 — marksmanship `headshot`, light `raceAuroraRay`, fractal `raceFractalNeedle`, desertacclimation `raceDustDevil`, stoneage `raceStoneThrow`, astral `raceDreamSiphon`, stagepresence `raceSpaceDisco`, eyesight `raceDeathGaze` | HEALTHY | Stun setups are mostly T3 (`raceBlueScreen`, `raceHypnoticPulse`, `raceExecutiveOrder`, `raceStasisBeam` = four identical 75-MP single stuns); the cheap ones are `racePoliceTaser` T2 (50), `raceLucidTrap` T2 (25 MP, off-ladder) and `raceStunRay` T1; `raceBlueScreen` and `raceExecutiveOrder` are also 2 AP. Fine. |
| root | 10 — dirtyfighting, marksmanship, astral, earth, piracy, policetraining, jellyfish, arachnid ×2, necromancy | 5 — martialarts `haymaker`, marksmanship `precisionShot`, piracy `raceBoardingRush`, insectoid `raceVenomFang`, necromancy `raceSoulDrain` | HEALTHY (small) | Voidweaver has both arachnid setups and the insectoid payoff; pirate, marksman, zombie loop. Good as is. |
| jammed | 6 by the script, 5 distinct (EMP Burst is counted under both of its ids) — robot `empBurst` (T4), computerhacking ×2 (T2/T3), advancedtechnology `raceDeneuralizer` T1, spygear `raceEMPGrenade` T2 | 7 — advancedtechnology ×2, computerhacking `raceCrashLoop`, machinery `raceHydraulicCrush`, cyberpunkweapons ×2, robot `raceHydraulicPunch` | HEALTHY on paper | Robot family's ONLY jam is the T4 `empBurst` (100 MP on robot 50 MP / cyborg 100 / honda civic 90). REWRITE `raceRocketFist` (robot T1, plain 100 + push, redundant with `raceHydraulicPunch`) → 80 dmg, push 2, applies jammed1. Every robot race gets a castable setup. |
| silence | 6 — dirtyfighting `skullCrack` T3, psychic `mindShatter` T4, sonic `raceDeafeningWail` T3, infernalcourt `raceDarkLullaby` T4, conspiracyknowledge `raceFluorideWater` T3, politics `raceFilibuster` T1 | 5 — psychic `mindShatter`, sonic `raceSonicBreaker`, water `raceCallOfTheDeep`, infernalcourt `raceDarkLullaby`, conspiracyknowledge `raceTruthBomb` | HEALTHY | Setups are expensive; RETIER `skullCrack` T3→T2 (dmg 125→100) so the 9 dirtyfighting races have a 50-MP silence. |
| frozen | 7 — haunted `raceColdSpot`, ice ×3 (`sharedFlashFreeze`, `racePermafrost`, `raceAbsoluteZero`), superheropowers `raceFreezeBreath`, winter `raceAvalancheStrike`, christmasspirit `raceBlizzardPresent` | 3 — winter `raceAvalancheStrike`, winter `raceFrozenPunch`, christmasspirit `raceSleighDash` | LOPSIDED: the Ice family (8 rows, 6 races) has 3 setups and 0 payoffs | Give `raceDiamondDust` (ice T3 cross) finisher:frozen×1.5 and rename "Shatter Dust"; wizard/atlantean/loch ness get a loop (Flash Freeze T2 → Diamond Dust T3). Blizzard weather already states "Frozen victims take extra damage" — keep. |
| hexed | 2 — witchcraft `sharedHexOfToil` T2, `raceCurseOfMisfortune` T3 (identical rows) | 3 — scarecrow `raceCrowStorm`, biblestudy `exorcism`, fortunetelling `raceCrystalBall` | HEALTHY-small | The two setups are duplicates (both single hexed3). MERGE `raceCurseOfMisfortune` into `sharedHexOfToil`, and REWRITE `raceHocusPocus` (witchcraft T4, 180 dmg for 25 MP — off ladder) → cost 100, finisher:hexed×1.5. Witchcraft then loops for all four races (demon princess, jack o lantern gain a payoff). |
| charm | 4 — seduction ×2, cult `raceCultKoolAid`, stagepresence `racePopStadiumShow` | 2 — seduction `raceDrainingEmbrace`, `raceEnthrall` (×2 activations) | HEALTHY inside seduction; cult leader sets and cannot pay | Give `raceCultIndoctrinate` the same finisher:charm×2 rule as `raceEnthrall`. |
| marked | 7 — spygear `knifeThrow`, weaponstraining `deadEye`, mothman `raceRedEyes`, artificialintelligence `racePredictiveModel`, ufo `raceImplant`, infernalcourt `raceInfernalConscription`, demonicabilities `raceDemonicClaw` | 0 (`doubleShot` "Hits harder on Marked targets" is description only) | SETUP-ONLY, the worst offender: seven families pay 25–100 MP for nothing | Two-part fix. (a) Engine: Marked = the next damaging hit on the target is a guaranteed crit and consumes the mark (replaces the dead `guaranteedCrit` on `deadEye`/`raceHighNoon`). (b) bonusVsStatus marked×1.5 on one payoff per setup family: `doubleShot` (weaponstraining, makes its text true), `headshot` (marksmanship, add to stun), `raceProphecyOfDisaster` (mothman, add to discord), `raceRecursiveLoop` (AI — replace the dead `bonusVsDebuffed` with finisher:marked,jammed), `raceAbductionBeam` (ufo), `raceCataclysmDecree` (infernalcourt, add to burn). Family-scoped upgrade "Exploit: Marked" in §5 covers the rest. |
| blind | 2 — fae `raceGlitterBomb` T3, policetraining `racePoliceSpray` T2 | 0 | SETUP-ONLY | `raceFaeRing` finisher:blind×1.5 (the blinded stumble onto the ring: fairy/mushroom girl/rabbit loop) and `racePoliceLockdown` finisher:blind×1.5 (Pepper Spray T2 → Lockdown T4: police officer and sheriff loop). |
| wet | 1 — jellyfish `raceJellyBloom` | 0 | SETUP-ONLY | Wet should be the lightning/ice amplifier: engine rule wet → lightning ×1.5 and any ice hit Freezes 1. Payoffs: `thunder1` and `raceStunRay` finisher:wet×1.5; jellyfish self-loop via `raceJellyNet` finisher:wet×1.5. |
| minimize | 1 — alientechnology `sharedShrinkRay` T3 | 0 | SETUP-ONLY | `raceAbductionBeam` (ufo T3) finisher:minimize×1.5 — martian (alientechnology + ufo) gets Shrink Ray → Abduction Beam. |
| corroded | 1 — chemistry `raceOvercharge` | 0 by the scan; the row's text says it counts as burn AND poison | HEALTHY IF the engine honours the alias; the audit script did not find it, so treat as UNVERIFIED | Verify `bonusVsStatus` resolves corroded for both burn and poison finishers. Mad scientist and professor have no burn/poison payoff of their own, so Corroded is a teammate-feeding status by design (mad scientist + dragon/demon prince/reptilian). |
| grievous | 2 — dirtyfighting `raceStompOut`, ghoulish `raceFrenzy` | 0 | UTILITY (anti-heal is the payoff) | Optional: NEW blood T2 `bloodHemorrhage` (90 dmg, grievous2) + blood T4 `bloodExsanguinate` (160 drain 0.5, finisher:grievous×1.5) fills Blood Magic's missing T2/T4 and gives vampire/demon/goatman a bleed loop. |
| possessed | 4 — haunted `racePossession`, seduction `raceEnthrall`, cult `raceCultIndoctrinate`, vampiricabilties `raceThrallBite` (+ zombie `raceInfect`) | 0 | SELF-PAYING (you get the unit) | No finisher wanted. Five possess rows across five families is fine: all T3 at 75 MP, each with a different rider (Enthrall ×2 activations on a Charmed target, Thrall Bite drains 25%, Indoctrinate CD3, Infect is 4 activations melee-only). |
| taunt | 1 — sonic `provoke` | 0 | UTILITY | No change; only sonic has it, fine. |
| scanner | 1 — computerhacking `raceSystemAnalysis` | 0 | DEAD (no described effect) | MERGE into marked: `raceSystemAnalysis` applies marked3 at range 5; or DELETE the row (computerhacking has 6 rows). |
| feared | 1 — shadow `raceFear` | 1 — ghoulish `raceTerrorPounce` | SIGNATURE cross-family: only ghoul owns both | Dead end for the other 6 shadow races (a 50-MP self-aoe r3 control with no payoff) — give shadow its own: `voidRush` finisher:feared×1.5 ("chase the fleeing"). |
| haunted | 1 — haunted `raceHaunt` | 1 — haunted `raceBoo` | SIGNATURE, in-family, 4 races | Good. Haunt T1 → Boo T4 is a 125-MP loop; shadow entity (130 MP), ghost, skeleton (120), jack o lantern all afford it once. |
| infected | 1 — zombie `raceInfect` | 1 — zombie `raceShamblingHorde` | SIGNATURE, unique race | Good but uncastable: Infect 75 + Horde 100 = 175 MP on a 70-MP zombie. RECOST `raceShamblingHorde` to 50 MP (row override) or floor zombie MP (§4). |
| contract | 1 — demonicabilities `raceContract` | 2 — demonicabilities `raceVoidContract`, biblestudy `exorcism` | SIGNATURE + one cross-faction payoff | Good: Contract's own 40% lifesteal pays itself, Devour Soul hits the contracted ×1.5 and drains 50% of the hit, and a priest teammate can Exorcise the contracted. Keep. |
| soulBound | 1 — demonicabilities `raceSoulBind` | 1 — demonicabilities `raceVoidContract` | SIGNATURE, 5 races | Good (the link's 30% share is self-paying). |
| tethered | 1 — ropework `raceLasso` | 1 — cowboyskills `raceHighNoon` | SIGNATURE cross-family: cowboy loops; pirate and ringmaster set it and cannot pay | `raceBoardingRush` finisher:root,tethered (pirate: Lasso T1 → Land Ho T2, 75 MP) and `racePopStageDive` finisher:tethered (ringmaster drags the roped one into the wall). |
| voodoo | 1 — blackmagic `raceVoodoo` | 1 — psychadelic `raceBadTrip` | CROSS-RACE ONLY: no race owns both families (skinwalker/goatman/necromancer/krampus vs shaman/machine elves/mushroom girl/hippie) | The reflect is self-paying, and skinwalker + shaman is a thematically great duo — keep the cross-race payoff but add an in-family one: `raceBaphometsRite` finisher:stagger,voodoo. |
| goo | 2 — ooze `raceGooShot`, poison `raceSplash` | 1 — ooze `raceAbsorb` (+ goo's own magic ×1.25) | SIGNATURE, 2 races | Good. Add `raceToxicNova` finisher:goo×1.5 so black goo/symbiote have a T3 payoff. |
| blessed | 2 — biblestudy `raceCultSermon`, `raceBlessing` | 0 | BUFF | Optional flavour payoff: `raceBlessedBlade` +25% while the caster is Blessed (skeleton/knight need a priest). |
| protect (6), regen (3), overclock (4), invisible (11), indomitable, jackOfAll, extendedClips, levitating, pixieDust, sparkling, monster, stoneform, incendiary | ally buffs | 0 (invisible: `sneakSlash` "bonus while invisible" is caster-side) | BUFF | Invisible is the only buff worth a payoff layer: 11 setups across 9 families, one payoff row. See "Ambush" passive in §5. Incendiary is a burn generator (feeds §2 Burn line). |
| shadowRealm | 1 — shadow `raceShadowRealm` | 0 | UNIQUE duel | Fine. |

### 2. Team archetypes

Each: setup families → payoff families, example races, counter-play, and the hole.

**1. Stagger train.** Setups: earth (`sharedFissure` T1, `raceStonefall` T1 through cover, `raceTremorStomp` T1), door (`raceSwingDoor` T1 40 dmg + push 2), policetraining (`racePoliceNightstick` T1), stagepresence (`racePopMicDrop` T1), horns (`raceGoreCharge` T1), demonicabilities (`raceDemonicRoar` T1 self-aoe r2), cowboyskills (`raceDynamite` T2 3×3), cyberpunkweapons (`raceClusterRockets` T2), kaiju (`raceCataclysmStomp` T1 2 AP r2). Payoffs: titan `raceColossalCrush`, dirtyfighting `raceNoMercy`/`raceBodyCheck`, cowboyskills `raceHighNoon`, apexpredator `raceJurassicJaw`, kaiju `raceAtomicBreath`, infernalcourt `raceDarkDominion`, ancientknowledge `raceWeighTheHeart`, earth `raceBoulderHurl` (T1!) / `raceStoneDrop`, robot `raceRoboPunch`, horns `raceHornToss` T1. Setup side: door agent, police officer, popstar, demon, cowboy. Payoff side: giant, cyclops, minotaur, dinosaur, kaiju, nephilim, overlord. Counter: stagger is 1 round and costs 1 AP, so a team that acts before the finisher (SPD) shrugs it; `racePurify`, `raceAbsolution` cleanse:99, `gearPurityCenser`; kill the T1 setup unit first. HOLE: the payoff races cannot pay. Giant 60 MP, cyclops 65, dinosaur 60, minotaur 70, juggernaut 40, king kong 75: `raceColossalCrush` (100 MP, 2 AP) is never castable on the field. Fix in §4 (MP floor 100 or pin bruiser T4s to 50). Cheap working loop today: `raceStonefall` (25) → `raceBoulderHurl` (25) on annunaki/gargoyle/gnome/crystal guardian, and `raceGoreCharge` → `raceHornToss` on minotaur/goatman/krampus.

**2. Poison rot.** Setups: poison (`raceCorrosiveSplash` T1 aoe, `raceInfectiousBite` T1, `sharedPoisonSwamp` terrain), zombie `raceOutbreak` (5×5 for 3 rounds, reapplies), conspiracyknowledge `raceChemtrails` line + terrain, spygear `poisonDart`, archery `racePoisonArrow`, ghoulish `raceGhoulishBite`, ooze `raceToxicNova`, unethicalscience `racePlandemic`, symbiosis `raceTendrilStrike`. Payoffs: blood `lifeDrain` (135 drain 0.7), spygear `sneakSlash`, bonedensity `raceMarrowstorm` (aoe ignoreArmor), infernalcourt `raceKissOfDecay`, conspiracyknowledge `raceTruthBomb`, ooze `raceAbsorb`, symbiosis `raceSymbioticDrain`, poison `raceFormicAcid`. Setup: zombie, reptilian, bee queen, mushroom girl, jellyfish. Payoff: demon princess, black goo, symbiote, skeleton (Marrowstorm needs a poisoner), conspiracy theorist. Counter: robot/android/droid/mech/honda civic/gargoyle/golem/skeleton/ghost/ai poison-immune, zombie/necromancer/ghoul/demon/cyborg/super sentai resist (black goo has no poison affinity); `racePurify`, `raceHallelujah`; grievous does not stop the payoffs. HOLE: Poison has no T2 and no T4; the element's own payoff is a T1. NEW poison T4 "Necrosis" (§1) and the Septic passive (§5). Also `raceOutbreak` is 2 AP 75 MP on a 70-MP zombie — RECOST 50.

**3. Jammed tech.** Setups: advancedtechnology `raceDeneuralizer` T1, computerhacking `raceMemoryLeak` T2 / `raceNeuralHack` T3 (identical roles — MERGE Neural Hack into Memory Leak), spygear `raceEMPGrenade` T2 (75 MP off-ladder → 50), robot `empBurst` T4. Payoffs: advancedtechnology `railgun` (line, ignoreArmor) / `raceClassifiedWeapon`, computerhacking `raceCrashLoop` T1, machinery `raceHydraulicCrush` T3, cyberpunkweapons `raceSyntheticBlade`/`raceTaserBolt` T1, robot `raceHydraulicPunch` T1. Setup: men in black, ai, glitch, droid, mad scientist. Payoff: android, cyborg, robot, honda civic, professor, astronaut. Counter: jammed cleanses like any debuff; the payoffs are mostly T1 100-dmg rows, so the ceiling is low unless `railgun` lands a line. HOLE: robot's only setup is T4. REWRITE `raceRocketFist` → jammed1 (§1); then android (140 MP) runs Rocket Fist (25) → Synthetic Punch (25) → Robo Punch (75).

**4. Freeze-and-shatter.** Setups: ice `sharedFlashFreeze` T2 (3-tile ice, frozen1), `racePermafrost` T3 (3×3 frozen2, kills deployables), `raceAbsoluteZero` T4; haunted `raceColdSpot` T2 zone; superheropowers `raceFreezeBreath` T2 (40 dmg, frozen1 — tied with `raceColdSpot` as the cheapest freeze in the game at 50 MP); christmasspirit `raceBlizzardPresent`; winter `raceAvalancheStrike`. Payoffs: winter `raceFrozenPunch` T1 (90, ×1.5), `raceAvalancheStrike`, christmasspirit `raceSleighDash` T2 (130 + dash 70). Both sides: yeti, ice queen, santa clause, krampus. Setup only: wizard, atlantean, loch ness monster, superhero/sidekick/antihero, ghost/skeleton/shadow entity. Counter: ice queen is ice-immune; frozen is a hard "no act" so cleanse priority is highest (`cleanse`, `raceAbsolution`); fire melts Frost Door lanes. HOLE: Ice pays nothing (§1: `raceDiamondDust` → Shatter Dust). Second hole: superhero (90 MP) + sidekick have `raceFreezeBreath` and no payoff — a superhero + yeti team works; or give `raceHeroicLeap` (T1 plain 100) finisher:frozen×1.5.

**5. Burn line.** Setups: fire `wallOfFire` T3 (keeps burning 3 rounds), `meteor`; dragonabilities `raceDragonBreath` T1 (line + burning tiles), alientechnology `raceHeatRay` T1 (100 dmg burn2 range 5 — the best T1 setup in the game), infernalcourt `raceInfernalDecree` T2, fallenangel `raceFallenGrace` T1 cross, archery `raceFireArrow` T1, christmasspirit `raceLumpOfCoal` T1, sentai `sentaiRedSlash` T1, weaponstraining `raceIncendiaryRounds` (basic attacks burn 2 rounds), piracy `raceCannonball`. Payoffs: swordsmanship `dragonSlash` (ignoreArmor), light `raceMerkaba`, militarysupport `raceFireForEffect` (5×5 delayed), fallenangel `raceDescendingWrath`, superheropowers `raceLaserBeam`, infernalcourt `raceCataclysmDecree`, dragonabilities `raceDragonToss` T3, archery `raceSplittingArrow` T3 (ricochet), sentai `sentaiMegazordBlast`, fire `meteor`. Setup: martian, dragon, jack o lantern, robin hood, cowboy (Incendiary). Payoff: knight/king arthur (`dragonSlash`), general/marksman (`raceFireForEffect`), super sentai, priest/nun (`raceMerkaba`). Counter: demon princess fire-resist, water/ice terrain, `racePurify`. HOLE: every payoff is 75–100 MP; martian (T1 Heat Ray) + knight (95 MP, Dragon Slash 100) is a team that cannot fire. NEW fire T2 "Ember Strike" finisher:burn (§1) and Kindling passive (§5). General is actually self-contained (Incendiary Rounds → basic attack → Fire for Effect) — the script missed it.

**6. Discord / silence control.** Setups: sonic `discordance` T1, cryptid `raceDreadAura` T1 self-aoe r2, apexpredator `racePrimalRoar` T1, psychic `racePsychicBeam` T1 line, deepsea `raceInkCloud` T2 zone, horns `raceLabyrinthRoar` T2, dragonabilities `raceDragonfear` T2 r3, deepstate `raceBrainwash` T3, drivingskills `raceExhaustCloud`; silence: politics `raceFilibuster` T1 zone, dirtyfighting `skullCrack` T3, sonic `raceDeafeningWail` T3, conspiracyknowledge `raceFluorideWater` T3. Payoffs: sonic `requiem` (self-aoe r4) / `raceSonicBreaker` T2, psychic `raceMindCrush` / `mindShatter`, deepsea `raceDepthCharge` T3, drivingskills `raceMissileBarrage`, horns `raceBullRush`, mothman `raceProphecyOfDisaster`, water `raceCallOfTheDeep`, infernalcourt `raceDarkLullaby`, conspiracyknowledge `raceTruthBomb`. Setup: politician, bigfoot, dinosaur, grey, kraken. Payoff: siren, mermaid, popstar, telepath, occulus, minotaur, honda civic. Counter: discord (-2 ATK/-1 DEF) does nothing to casters; silence does nothing to bruisers — pick the wrong target and the whole line is wasted; cleanse. HOLE: cryptid and politics set up with no payoff (`raceSasquatchSmash` discord, §1; politician + siren is the intended duo). Duplicate roar rows: `raceDreadAura` T1 / `raceDragonfear` T2 / `raceLabyrinthRoar` T2 / `racePrimalRoar` T1 are the same effect (self-aoe discord2) on four families, differing only in radius (r2 / r3 / r2 / r1) — fine across families, but RETIER `raceLabyrinthRoar` to T1 to match Dread Aura (same r2).

**7. Puppetry (charm/possess).** Setups: seduction `raceSoulSuck` T1 (charm1 + drain 0.6), `raceCharm` T2, cult `raceCultKoolAid` T2, stagepresence `racePopStadiumShow` T4 (5×5 charm). Payoffs/control: seduction `raceEnthrall` T3 (2 activations if charmed), `raceDrainingEmbrace` T4, haunted `racePossession` T3, cult `raceCultIndoctrinate` T3, vampiricabilties `raceThrallBite` T3, zombie `raceInfect` T3 (4 melee activations). Races: succubus, siren, popstar, bunny girl, catgirl, barbarella; ghost, shadow entity, skeleton, jack o lantern; cult leader; vampire; zombie. Counter: bosses immune; possession is one activation, so spread out and never stand next to your healer; `gearPurityCenser` purges the charm and lashes back. HOLE: charm's payoff exists only in seduction; `raceCultIndoctrinate` should get the ×2 rule. All five possess rows sit at T3 — no cheap possess exists and none should.

**8. Root-and-shoot.** Setups: marksmanship `kneecapShot` T1 range 5, piracy `raceAnchor` T1 (groundsFlyers), dirtyfighting `ironGrip` T2, arachnid `raceWebLaunch` T1 / `raceWebSnare` T2 aoe, necromancy `raceRigormortis` T2 aoe, earth `raceEarthenGrasp` T2 pull, policetraining `racePoliceCuffs` T3, jellyfish `raceJellyNet` T3, astral `raceSleepParalysis` T3. Payoffs: marksmanship `precisionShot` T3, piracy `raceBoardingRush` T2, martialarts `haymaker` T1, insectoid `raceVenomFang` T1, necromancy `raceSoulDrain` T1. Loops: marksman/quarterback/robin hood (Kneecap → Precision), pirate (Anchor → Land Ho), voidweaver (Web → Venom Fang), zombie/anubis/necromancer (Rigormortis → Life Drain). Counter: teleports (`teleport`, `raceShadowStep` ignores LoS) ignore root; `raceAnchor`/`ironGrip`/`raceEarthenGrasp` also ground flyers (the other root rows do not), so `raceStoneDrop`/`raceDragonToss` casters lose their own flight if hit by those. HOLE: root has no T4 payoff at all; give `headshot` finisher:stun,root (marksman then has a full T1→T3→T4 ladder on his own status).

**9. Terrain warfare.** Makers: earth `sharedFissure` (chasm), `rampart`/`sharedRampart` (2-high wall), `raceQuake` deform; royalty `raceShieldWall` T2; livingstone `raceGothicRampart` T2; ancientknowledge `raceSacredGeometry` T1 (crystal, blocks ranged) / `raceZigguratProtocol` T2; water `raceFlood` (fills basins), `raceCallOfTheDeep`, `raceTidalSlam` (deep water), piracy `raceWalkThePlank` (executes <25%); fire `sharedScorchedEarth`/`wallOfFire`; necromancy `racePlaguefield` (permanent); ooze `raceOozeTrail`; ice `sharedFlashFreeze`/`raceIceSlide`; doors `gunFrostDoor`/`gunGustDoor`/`gunHellDoor`; cosmic `sharedGravityCrush` (falls ×3, no jumping); ufo `sharedLowGravity`. Movers: dirtyfighting `raceBodyCheck` push 2, horns `raceHornToss` push 3, water `sharedTidalSurge`/`raceTsunami` (3-wide push 2), wind `raceSkyTackle` (carry 4), sonic `raceSirenSong` (pull 3 through hazards) / `raceSonicBreaker` (line push 2), cosmic `raceGravityWell`/`sharedBlackHole` pull, artificialintelligence `raceSingularity`. Payoff: deepsea `racePoseidonsWrath` (all enemies in water, map-wide), `raceWalkThePlank` execute. Races: gargoyle, golem, crystal guardian, annunaki, knight, mermaid, kraken, starfish, pirate, door agent, siren. Counter: flight (`raceFairyDust` levitating, `gearJetpack`), teleports, and your own walls block your own LoS. HOLE: the water loop needs 4 AP (Great Flood 2 AP + Poseidon's Wrath 2 AP), i.e. two units — fine as a duo (mermaid floods, kraken wraths), but there is no cheap water-maker: RETIER `raceCallOfTheDeep` (T4, 1 tile of deep water, 160 dmg, 2 AP) → T2 "Sinkhole" 50 MP 1 AP 90 dmg, keep the silence finisher off it.

**10. Summoner / deploy wall.** engineering `deployTurret` T2 (×2, 110 dmg end of round), `raceClockworkTurret` T3, `fiveGTower` T3 (-8 M DEF aura), `raceOvertinker` T4 shield 160 incl. contraptions; unethicalscience `raceCloneDecoy`, `raceSummonCreation` (90 dmg clubber, 4 hits armored); cult `raceCultGathering` (2 cultists 55×2); huntingskills `raceWhistle` (hound reveals invisible); necromancy `raceRaiseDead`; advancedtechnology `raceTeslaTrap` ×3; spygear `placeBomb` ×3; trapmaking `raceLucidTrap`/`raceTrapdoor`; prismlattice `racePrismMirror` ×8 + `racePulseLattice`; galacticfederation `raceFederationBeacon` (40 HP regen aura); insectoid `raceTunnelNetwork`; doors (2 standing doors). Races: gnome, droid, mad scientist, cult leader, necromancer, machine elves, crystal guardian, door agent, cowboy, goblin. Upgrades Surplus/Overclocked turret already exist. Counter: `racePermafrost` destroys deployables in its 3×3, `meteor`/`sharedNuke` destroy buildings, any aoe (turret 60 HP); the summons attack the nearest enemy, so a tank baits them. HOLE: nothing scales the deployables and nothing pays for having them out. Foreman passive (§5) and a "Detonate" family-scoped upgrade (§5).

**11. Bruiser dive with enablers.** Enablers: teamwork `encore` (+1 AP to a unit that acted — the only ally-targeted AP tool; `raceJurassicJaw` refunds 1 AP to its caster on a kill), `jackOfAll` Pep Talk, psychic `teleport` (any unit, range 4), royalty `raceKnightsOfRound` (pull every ally), fractal `raceDimensionalFold`/trickery `raceSkinSwap`/temporal `raceTemporalShift`/angelic `raceWingsOfMercy` swaps, fae `raceFairyDust` (levitating 2 rounds = flight → unlocks every requiresFlight row: `raceStoneDrop`, `raceDragonToss`, `raceInfernalHurl`, `raceDescendingWrath`, `raceRocketToss`, `racePredatorDrop` on units that do not fly), `gearJetpack`, overclock rows (`overclock`, `raceBlackBudget`, +1 MOV). Divers: athleticism `rampage`/`raceUnstoppableCharge` (12 races), apexpredator `raceApexCharge`, horns `raceBullRush`, drivingskills `raceRamCharge` T1, football `raceBlitz` T2, beastabilities `raceAmbushLunge`, titan `raceGiantSmash`, door `raceDropIn`, kaiju `raceSeismicLeap`. Counter: `ironGrip`/`raceAnchor`/`racePoliceCuffs` (root, groundsFlyers), `raceFear` (must flee), `raceGravityWell` grounds flyers, `raceChivalry` intercepts, walls. HOLE: verify that levitating satisfies requiresFlight; if it does, fairy + nephilim/giant/vampire is the sleeper build and should be documented; if not, make it so. Athleticism lacks T1/T3: NEW athleticism T1 `athShoulderTackle` "Shoulder Tackle" 80 dmg push 1 stagger1 and give `rampage` finisher:stagger×1.5 — homosapien/rabbit/ki fighter/luchador gain a T1→T4 loop.

**12. Fog assassins.** Invisibility: huntingskills `camouflage` T2, spygear `raceAgentVanish` T2 (2 turns) / `sharedSmokeScreen` (ally zone), shadow `racePhaseShift` T3, cryptid `raceRealityShift` T2 / `raceCryptidVanish` T3, athleticism `raceNimbleDodge` T2, astralprojection `raceSpiritWalk`, vampiricabilties `raceMistForm`, ghoulish `raceCorpseCrawl`, football `raceQBSneak`. Payoffs: spygear `sneakSlash` (bonus while invisible + poison), door `raceBreakingEntering`/`raceDropIn` (always rear attack). Races: men in black, shadow entity, reptilian, halfdemon, cowboy, werewolf, robin hood, vampire, ghoul, rabbit, catgirl, bigfoot. Counter: `gearHagstone` (reveals within 4 at end of round), `gearBinoculars` (AWR 84+ senses hidden at 2), `raceWhistle` hound (3 tiles), `raceOmniVision`/`raceCosmicSight`, `gearWardTotem`; fog is enforced online so this archetype is real in PvP. HOLE: 11 setups, 1 payoff. "Ambush" passive (§5) for huntingskills/shadow/vampiricabilties/cryptid: the first damaging spell out of invisibility +40%. Werewolf, vampire, cowboy, bigfoot become self-contained.

### 3. Races with no plan

| race (class, MP) | what it can apply | loops | verdict | fix (cite) |
|---|---|---|---|---|
| homosapien (hybrid, 140) | indomitable, jackOfAll, invisible, stagger (`raceUnstoppableCharge` T4) | 0/0 | Acceptable as the Adaptable baseline (`passiveAdaptable` borrows spells), weak alone | Athleticism T1 "Shoulder Tackle" + `rampage` finisher:stagger (§2.11); `raceElbowGrease`/`improvise` are two identical T1 80-90 dmg rows — DELETE `improvise`. |
| fairy (support, 220) | sparkling, pixieDust, levitating, blind, regen | 0/0 | Acceptable — she is an enabler (levitation unlocks flight rows, Pixie Dust +2 MOV) | `raceFaeRing` finisher:blind (Glitter Bomb T3 → Fae Ring T4, 175 MP). |
| werewolf (bruiser, 80) | invisible only | 0/0 | HOLE. 13 rows, one T4 `raceBloodFrenzy` (100 MP 2 AP — uncastable at 80 MP); `raceHowl` T2 atk+1 duplicates `raceForestAmbush` T1 atk+1 in his own pool | Werewolf Powers → a bleed family: NEW T1 `wwRend` "Rend" 90 dmg grievous2; REWRITE `raceHowl` → self-aoe r3 feared1 + atk+1 self ("the pack hears"); `raceBloodFrenzy` RECOST 75 MP 1 AP, finisher:grievous,feared×1.5. Ambush passive covers Camouflage. |
| valkraye (bruiser, 80) | burn (`raceDivineJudgment` 50 MP 2 AP), protect, slow | 0/0 | Half-acceptable: 4 heal-kind rows (`raceDivineLight`, `racePurify`, `raceSanctuary`, the `raceChooserOfSlain` revive) + 2 shields (`raceHolyBulwark`, `raceShieldMaiden`) make her a paladin, but her damage rows do not talk to each other | REWRITE `raceDivineSwoop` (T3 leapStrike 125, a clone of `raceTitanDrop`/`raceCliffCharge`) → finisher:burn×1.5 "dives on the burning" (Divine Judgment 50 → Swoop 75 = 125 MP: needs a Free Energy or MP floor). `raceChooserOfSlain` duplicates `revive1` (healingmagic) at 2 AP instead of 1 — no race carries both, so leave it or RECOST it to 1 AP. |
| door agent (assassin, 170) | stagger ×4 (`raceSwingDoor`, `raceAirMail`, `raceDropIn`, `gunMawDoor`), indomitable | 0/0 | Deliberate support-assassin: he is the best stagger SETUP unit in the game and the D.O.O.R. Gun is his plan | Give him one self-payoff: `raceBreakingEntering` (T2 85, rear attack) finisher:stagger×1.5 — Swing Door (25) → B&E (50) is a 75-MP kick-the-door-catch-them-reeling two-step. |
| cult leader (support, 220) | charm, possessed, discord (`raceRealityPulse`), heals ×4 | 0/0 | Acceptable role (controller-healer), but 1 of his 5 families is empty (Persuasion 0) and Temporal is a stretch | `raceCultIndoctrinate` finisher:charm×2; FAMILY_DELETE persuasion or fill it (T1 "Sales Pitch" taunt2, T2 "Gaslight" discord2, T3 "Us vs Them" team atk+1/enemy def-1 aura, T4 "Mass Hysteria" 5×5 charm1 = the row `racePopStadiumShow` already is). |
| rabbit (assassin, 130) | invisible, stagger, sparkling, pixieDust, blind, discord | 0/0 | HOLE and a rule-1 flag: Fae Magic on a rabbit only makes sense if it is a magic rabbit; 6 T4s (`rampage`, `raceUnstoppableCharge`, `raceFaeRing`, `raceMimicry`, `raceRealityPulse`, `raceTimeRewind`) on 130 MP | REWRITE `raceTimeRewind` (T4 plain 160, Temporal's only single-target) → finisher:discord,stagger×1.5 "hits them before they recover" — rabbit, glitch, watcher, cosmic wraith, cult leader all gain a payoff (Reality Pulse → Time Rewind). |
| djinn (caster, 240) | NOTHING — the only race that applies no status | 0/1 (`raceWeighTheHeart` needs stagger) | HOLE | `racePolymorph` add status:silence2 (a frog cannot speak the words) and `raceAncientMagic` (T4 plain 180, twin of Weigh the Heart) → finisher:silence×1.5. Djinn: Polymorph 75 → Ancient Magic 100 on 240 MP. Wizard/atlantean gain a silence setup. |
| ki fighter (bruiser, 120) | invisible, stagger (`raceUnstoppableCharge` 100 MP) | 0/1 (`haymaker` needs root) | HOLE; Ki family has no T4; `reallyGoodPunch` is 180 dmg for 25 MP (off ladder) | `raceFlurryOfBlows` last hit applies stagger1; `reallyGoodPunch` RECOST 100, finisher:stagger×1.5. Flurry (25) → Punch (100) = 125 of 120 MP: also give `raceKiCharge` (atk+1, one of 8 identical rows) REWRITE → "Ki Charge: restore 50 MP, next Ki spell +1 range" so the fighter is his own battery. |
| vampire (assassin, 155) | invisible, possessed | 0/1 (`lifeDrain` needs poison) | HOLE — 4 drains (`raceLifetap`, `raceBite`, `lifeDrain`, `racePredatorDrop`) and no status game; 7 T1 / 1 T2 / 6 T3 / 1 T4 | Blood Magic T2 "Hemorrhage" grievous2 + T4 "Exsanguinate" finisher:grievous (§1) gives him Hemorrhage (50) → Life Sap/Exsanguinate; `raceBatSwarm` (T3 aoe def-1) add status:blind1 (bats in the eyes). |
| skinwalker (assassin, 160) | voodoo, discord, invisible | 0/1 (`raceBaphometsRite` needs stagger) | HOLE | `raceBaphometsRite` finisher:stagger,voodoo,discord — Dread Aura (25) → Baphomet (100). |
| gangster (bruiser, 100) | grievous, root, silence, incendiary, marked | 0/2 (`raceBodyCheck`/`raceNoMercy` need stagger; dirtyfighting has NO stagger setup of its own) | HOLE shared by all 9 dirtyfighting races | `raceDriveBy` (streetsmarts T2): "anyone shoved aside is Staggered" — Drive-By (50) → Body Check (25). Plus Concussive upgrade (§5). |
| swordfighter (bruiser, 95) | poison (`raceDarkFeather`), overclock, invisible, stagger | 0/2 (`crossSlash` slow, `dragonSlash` burn) | HOLE for all 5 swordsmanship races: the family's two finishers key off statuses nobody in the family applies | `swordBeam` (T2 line 100, plain) add status:slow1 ("the wind of the blade") → Sword Beam (50) → Cross Slash (25) loop for pirate/swordfighter/knight/skeleton/king arthur. |
| bigfoot (bruiser, 80) | regen, discord, invisible | 0/1 | HOLE | `raceSasquatchSmash` finisher:stagger,discord (Dread Aura → Smash; RECOST Smash 75 MP 1 AP for an 80-MP unit). |
| ringmaster (specialist, 180) | stagger (`racePopMicDrop`), discord, charm, tethered, jackOfAll | 0/1 (`raceSpaceDisco` needs stun) | HOLE for all 5 stagepresence races | `raceSpaceDisco` finisher:stun,stagger — Mic Drop T1 → Space Disco T4 loops popstar/ringmaster/clown/bunny girl/luchador; `racePopStageDive` finisher:tethered for the Lasso. |
| priest / seraphim / nun (healers, 230/260/250) | blessed, protect | 0/4 each (`exorcism`, `raceAuroraRay`, `judgment`, `raceMerkaba` all need a teammate's status) | ACCEPTABLE — a healer's finishers are team payoffs by design (priest + stagger/burn team) | No change required; optional `raceBlessedBlade`/`exorcism` +25% while caster is Blessed. |
| general (tank, 95) | slow, incendiary, marked, jackOfAll | 0/1 by the script | ACTUALLY SELF-CONTAINED: `raceIncendiaryRounds` → basic attack burn → `raceFireForEffect` | None; note the 95-MP cap vs Fire for Effect 100. |
| politician (support, 165) | silence (`raceFilibuster` T1), stun, overclock, discord, slow | 0/1 | Acceptable controller; his payoff is a siren/telepath teammate | Optional: `raceExecutiveOrder` T3 2 AP stun → 1 AP (matches `raceHypnoticPulse`/`raceStasisBeam`; `raceBlueScreen` is the other 2-AP one and should follow). |
| ai (specialist, 200) | marked, jammed, scanner, stun | 1 (`raceCrashLoop`) | Thin: 10 rows, 1 T4, Internet Addiction empty | Fill internetaddiction (T1 "Doomscroll" discord1 line, T2 "Ratio'd" silence1, T3 "DDoS" aoe jammed2, T4 "Go Viral" aoe 160 finisher:discord,jammed) — ai and conspiracy theorist both need it. |
| fortune teller (support, 210) | hexed | 1 (`raceCrystalBall`) | Too small to build (7 rows) | §4. |

### 4. Balance flags

**The MP gate is the biggest balance problem in the data.** Base MP is final (`computeUnitStats`), regen is 3%/round. Races below 100 MP and the rows they can never cast on the field:

| race | MP | T3 (75) | T4 (100) | rows dead at start |
|---|---|---|---|---|
| juggernaut | 40 | 4 | 5 | 9 of 15 — cannot cast a T2 (50) either: 12 of 15 |
| robot | 50 | 3 | 3 | 6 of 13 (+3 T2 at exactly 50, one cast) |
| giant | 60 | 5 | 6 | 11 of 20 |
| dinosaur | 60 | 4 | 4 | 8 of 20 |
| cyclops | 65 | 4 | 6 | 10 of 19 |
| golem, minotaur, zombie | 70 | 2/4/3 | 3/2/2 | 5/6/5 |
| king kong, overlord | 75 | 4/5 | 3/5 | 3/5 (T3 castable once) |
| bigfoot, king arthur, werewolf | 80 | — | 2/4/1 | every T4 |
| gargoyle, goatman, honda civic, luchador, nephilim, sharkman, superhero | 90 | — | 4/2/3/7/7/6/6 | every T4 (nephilim: 7 of 17 rows; luchador 7 of 20) |
| general, knight, loch ness monster, swordfighter | 95 | — | 4/4/6/4 | every T4 |

Every finisher-bruiser archetype in §2 fails on this. Recommendation, in order: (1) floor base MP at 100 for every race (giant 60 → 100 etc.; RACE_BASE_STATS in data.js — the server `ECON` derives from data.js so no server edit); (2) pin the 2-AP T4s that only bruiser families own to 75 MP by row override (`raceColossalCrush`, `raceNoMercy`, `raceSasquatchSmash`, `raceQuake`, `raceChassisSlam`, `raceBloodFrenzy`, `raceShamblingHorde`, `raceMarrowstorm`, `raceTerrorPounce`, `raceBaphometsRite`; `raceGiantSmash` is 1 AP but deserves the same pin for the same races); (3) leave caster T4s at 100. Without (1) the tier ladder is a caster-only ladder.

**Tier skews (pool: T1/T2/T3/T4):** annunaki 27 (8/4/5/10), starfish 27 (4/7/6/10), cosmic wraith 26 (5/5/7/9), deep sea fish 26 (7/8/4/7), astronaut 21 (5/5/3/8), nephilim 17 (5/2/3/7), luchador 20 (6/4/3/7), orb of light 22 (5/5/5/7). The common cause is Cosmic (11 rows, 4 T4) stacked on Water (8, 4 T4) or Earth (10, 4 T4). Bottom-heavy: minotaur 19 (10/3/4/2), dinosaur 20 (10/2/4/4), black goo 16 (9/2/4/1), king kong 17 (8/2/4/3), vampire 15 (7/1/6/1), goblin 16 (7/4/4/1), barbarella 11 (5/2/3/1), werewolf 13 (6/2/4/1), ai 10 (2/3/4/1), anubis 10 (3/4/0/3 — no T3 at all). Beast Abilities (5×T1, 0 T2, 2×T3, 0 T4) is the cause for minotaur/dinosaur/king kong/vampire/werewolf.

**What a healthy pool looks like:** 14–20 rows from 3 families (a 4th only when two are ≤3 rows); tiers roughly 4–5 / 4–5 / 3–4 / 3–4; at least one heal-or-self-sustain or one movement row; one aoe; one setup and one payoff that share a status; no more than one "raise ATK by 1 stage" row (there are 8 identical ones: `raceSiegeMode`, `raceOvercalculate`, `raceWishGranted`, `raceBloodRitual`, `raceHellfireCrown`, `raceApeFury`, `raceDeathPact`, `raceForestAmbush`, plus `raceHowl`, `raceEndZoneDance`, `raceKiCharge`, `raceSadBackstory`, `raceInnerDemon`, `raceGrimResolve`, `raceUnderdogSpirit` — 15 rows doing one thing; 20 rows carry stage:atk+1 in all once the four team auras and `raceYoHo` are counted); and the race's MP must cover its own T4 once.

**Concrete family moves to hit the standard:**
- Cosmic: too big at 11 and on 8 races. Cap at 8: MOVE `raceSupernova` + `raceCosmicSight` to a new orb-only family, or DELETE `raceCosmicSlam` (a `raceTremorStomp` clone at 2 AP) and MERGE `raceHeatDeath` into `raceStarDecree` (both slow-keyed T4 aoes). RACE_REMOVE cosmic from starfish (a starfish with Black Hole is a pun, not a plan → pool 16) and marksmanship from annunaki (→ 24) and cosmic wraith (→ 23). RACE_REMOVE poison from deep sea fish (→ 21; Light = the lure, keep).
- Beast Abilities: DELETE `racePounce` (T1 120 dmg, a tier offender and a `raceBigKick` twin), RETIER `racePredatorLeap` → T2 (dmg 110), NEW T4 `beastSavageMaul` "Savage Maul" 170 physical, finisher:root,stagger×1.5, cost pinned 50 (its owners are the low-MP beasts). Minotaur becomes 8/4/4/3.
- Fortune teller (7): FAMILY_MERGE astrology into fortunetelling and fill to 5 (NEW T3 "Retrograde" 3×3 slow2 zone), giving 8 rows on 2 families; or RACE_ADD psychic (a seer reads minds — internal sense holds) → 15.
- Conspiracy theorist (9) and ai (10): fill Internet Addiction (§3). Mad scientist (10): Chemistry is 1 row — fill (T1 "Acid Vial" 80 poison2, T2 "Smoke Bomb" = MOVE `sharedSmokeScreen` here? no, spygear keeps it; T4 "Volatile Compound" aoe 160 finisher:corroded). Mothman (10): Mothman family is 2 rows — add T2 "Wingbeat" (wind aoe push) and T3 "Omen" (marked3 aoe). Barbarella (11): Astronaut Camp is 1 row on 2 races — FAMILY_MERGE `raceGravityBoots` into athleticism (fills its missing T2 slot? it has T2s; put it at T1 to fill T1) and RACE_ADD something with internal sense.
- Anubis: no T3. RETIER `raceRigormortis` T2→T3 with dmg 110? No — give Necromancy its missing T3 instead: MOVE `raceSoulDrain`... keep; NEW necromancy T3 `necroGraveHands` "Grave Hands" 3×3 root1 + 100 dmg, DELETE `raceRigormortis` (same role at T2, 80 dmg).
- 2-AP T4s: 44 of the 115 distinct T4 rows cost 2 AP (45 of 119 as the rack lists them, Kill Mode counted under both ids). With 1-round statuses, a 2-AP finisher can never follow its own setup in one activation — this is what forces teams, keep it, but never put a 2-AP T4 on a race whose family gives no 1-AP payoff (juggernaut: `raceColossalCrush`, `raceNoMercy`, `rampage`... all 2 AP or 100 MP).
- Off-ladder MP that breaks the SP=tier economy: `reallyGoodPunch` T4 25 MP, `raceHocusPocus` T4 25 MP, `raceVoodoo` T3 25 MP (fine — link, no damage), `raceEMPGrenade` T2 75 MP, `raceDivineJudgment` T3 50 MP 2 AP, `sharedBlackHole`/`racePoseidonsWrath`/`raceSpaceDisco` T4 75 MP, plus five T2 rows at 25 MP (`sentaiGreenArrow`, Sacrifice, Tithe, `raceLucidTrap`, `raceGrimResolve`). Ladder them unless the cheapness is the design (Black Hole at 75 for 2 AP CD2 is fine).

### 5. Family passives and family-scoped upgrades

Passives (kind 'passive', tier = SP; hook keys marked NEW where the engine has none today). Two passive rows max per kit, so each must beat a GEAR row.

| # | name | family | SP | hook | effect | why it makes the family a build |
|---|---|---|---|---|---|---|
| 1 | Brittle | ice, winter | 2 | `finisherBonus` NEW: {frozen:+0.25} | Frozen targets take +25% physical and magic from this unit; a frozen target that dies shatters for 40 on adjacent enemies | Ice has 3 freezes and no payoff; wizard/atlantean/loch ness now shatter |
| 2 | Septic | poison, ooze, zombie | 2 | `statusTickRider` NEW: poison → stage def-1 (once) | The first poison tick on a target also lowers DEF 1 stage | Poison rot teams get armour shred for the physical payoffs (`raceMarrowstorm`, `sneakSlash`) |
| 3 | Aftershock | earth, titan, kaiju | 2 | statusDurationBonus {stagger:+1} (Third Eye scoped to stagger) | Stagger this unit applies lasts 2 rounds | Lets a giant `raceStonefall` this round and `raceColossalCrush` next — the only way the low-MP bruisers loop alone |
| 4 | Kindling | fire, dragonabilities, infernalcourt | 1 | terrainBonus {scorched,lava: burn tick +12} | Burn ticks 24 → 36 while the target stands on scorched/lava | Ties Wall of Fire / Scorched Earth / Hellmouth terrain to the burn payoffs |
| 5 | Cold Blood | ice, winter, christmasspirit, cryptid(yeti) | 1 | weatherBonus {blizzard: +20% dmg, immune blind} | In blizzard weather +20% damage and immune to its blinding | `sharedSummonBlizzard` becomes a team plan for yeti/ice queen/santa |
| 6 | Ambush | huntingskills, shadow, vampiricabilties, cryptid, spygear | 2 | `invisibleStrikeBonus` NEW 0.4 | First damaging spell or basic attack cast while Invisible +40% | 11 invisibility setups, 1 payoff (§2.12); werewolf/vampire/cowboy/bigfoot self-contained |
| 7 | Foreman | engineering, unethicalscience, trapmaking | 2 | `deployStatBonus` NEW {hp:+40, dmg:+20} | Deployables +40 HP and +20 damage; `repair` may target contraptions | Summoner archetype scales with nothing today |
| 8 | Faraday Cage | robot, cyberpunkweapons, machinery | 1 | statusImmune {jammed} + `auraTick` NEW | Immune to Jammed; jammed enemies within 2 take 20 at end of round | Jammed tech mirror-match protection and a slow payoff for the T1-heavy robots |
| 9 | Chorus | sonic, stagepresence | 2 | statusDurationBonus {discord:+1}, statBonus int+8 | Discord lasts +1 round, +8 M ATK | Discord control gets time to land `requiem` after `discordance` |
| 10 | Hex Weaver | witchcraft, blackmagic, fortunetelling | 2 | `finisherBonus` {hexed:+0.25}, `spreadOnDeath` NEW {hexed} | Hexed targets take +25% magic; when one dies the hex jumps to an adjacent enemy | Fortune teller/scarecrow/demon princess get a real hex plan |
| 11 | Heavy Bones | titan, earth, livingstone | 2 | immunePush + statBonus def+10 + spellCostMult {family:0.5} | Cannot be knocked back or pulled, +10 DEF, titan/earth rows cost half MP | Half of the MP fix for the 60-MP giants without touching base stats |
| 12 | Second Wind | humangrit, teamwork, athleticism | 1 | healOnceBelowPct {30: heal 25%, +1 AP} | Once per life, dropping below 30% heals 25% and refunds 1 AP | Human underdogs; stacks with `raceIndomitableWill` flavour |
| 13 | Bloodlust | blood, beastabilities, ghoulish, vampiricabilties | 2 | drainMult 1.5 + onKill stage atk+1 | Life drains heal +50%; a kill raises ATK 1 stage | Turns the 4-drain vampire and the beast T1 spam into a snowball |
| 14 | Choir | angelic, biblestudy, healingmagic, light | 2 | healMult 1.15 + `healRider` NEW {blessed: cleanse 1} | Heals +15%; healing a Blessed ally also cleanses 1 debuff | Gives blessed a job (§1) and the healers a reason to run Blessing |
| 15 | Deep Breath | water, deepsea, jellyfish | 1 | canSwim + terrainBonus {water: +1 MOV, hits apply slow1} | Swims, +1 MOV in water, enemies hit while standing in water are Slowed | Terrain warfare: floods feed the 8 slow payoffs and Poseidon's Wrath |
| 16 | Event Horizon | cosmic | 2 | `pullRider` NEW {stagger1} | Cosmic's pull rows (`raceGravityWell`, `sharedBlackHole`) also Stagger (`raceSingularity` is AI, `raceDustDevil` is desertacclimation — out of scope unless the passive is widened) | Cosmic joins the stagger train instead of only the slow line |
| 17 | Pack Tactics | apexpredator, horns, beastabilities, kaiju | 2 | flankBonus 0.15 | +15% damage to a target adjacent to another ally | Rewards the dive archetype's positioning; minotaur/dinosaur/sharkman |
| 18 | Showmanship | stagepresence, seduction, cult | 1 | statusDurationBonus {charm:+1}, charmed enemies stage atk-1 | Charm lasts +1 round and charmed enemies deal less | Puppetry gets its second activation window |
| 19 | Pathfinder | athleticism, football, drivingskills, horns | 1 | dashRangeBonus +1, dashDamageMult 1.3 | Dash/leap rows +1 range, path damage +30% | The 12 athleticism races have Rampage/Unstoppable Charge and nothing else to build around |
| 20 | Iron Discipline | militarysupport, policetraining, knight | 1 | counter 0.3 + statBonusAura {def+5, r2} | Counterattacks at 30%; allies within 2 get +5 DEF | Tank identity for general/police/knight beyond `passiveBulwark` |

Family-scoped upgrades (registry rows with `families: []`; max 2 per spell, own SP):

| # | name | families | SP | patch |
|---|---|---|---|---|
| 1 | Exploit: Marked | weaponstraining, spygear, marksmanship, mothman, artificialintelligence, ufo, infernalcourt | 1 | add marked to `bonusVsStatus` ×1.5 and consume the mark |
| 2 | Shatter | ice, winter, christmasspirit, haunted | 2 | add frozen to `bonusVsStatus` ×1.5; the hit removes frozen and deals +50 flat |
| 3 | Incendiary | weaponstraining, archery, cyberpunkweapons, mecha | 1 | the row applies burn1 ("the shot rides fire") |
| 4 | Venom Coat | beastabilities, insectoid, arachnid, ghoulish, feline | 1 | a melee damage row applies poison2 |
| 5 | Concussive | earth, titan, kaiju, dirtyfighting, horns, athleticism | 2 | a damage row applies stagger1 (one per kit) — the missing dirtyfighting/athleticism setup |
| 6 | Hush | sonic, psychic, infernalcourt, politics, conspiracyknowledge | 1 | an aoe/debuff row applies silence1 to targets already Discorded |
| 7 | Echoing Hex | witchcraft, blackmagic, scarecrow | 1 | when a Hexed target dies to this row the hex jumps to the nearest enemy |
| 8 | Tidewater | water, deepsea, jellyfish, piracy | 1 | the row leaves water on the target's tile (feeds `racePoseidonsWrath`, Deep Breath) |
| 9 | Consecrate | light, angelic, biblestudy, holydefense | 1 | a heal or shield row also applies blessed1 |
| 10 | Daisy Chain | lightning, robot, computerhacking, cyberpunkweapons | 2 | a hit on a Jammed target arcs 50% to every adjacent Jammed enemy |
| 11 | Detonate | engineering, advancedtechnology, spygear, prismlattice | 1 | the deploy row may be re-cast on your own deployable to blow it: 3×3 for its remaining HP ×2 |
| 12 | Overdrive | athleticism, drivingskills, football, apexpredator | 1 | a dash row refunds 1 AP on a kill |

### 6. Recommended kit templates

7 rows, 16 SP, tier = SP, ≤2 passive/gear rows, upgrades at their own SP.

**Setup support — police officer (110 MP; policetraining, weaponstraining, drivingskills).** `racePoliceNightstick` T1 (1, stagger) · `raceRamCharge` T1 (1, stagger dash) · `racePoliceTaser` T2 (2, stun) · `racePoliceSpray` T2 (2, blind 3×3) · `racePoliceCuffs` T3 (3, root2) · `raceIncendiaryRounds` T2 (2, basic attacks burn) · `passiveThirdEye` (1, debuffs +1 round) = 12 SP. Upgrades: Lingering on Taser (1), Widen on Pepper Spray (2), Efficient on Cuffed (1) = 16. Two setups per round for four different payoff teams (stagger, stun, root, burn). Where it breaks: 110 MP buys Cuffed once (75) and then T1s; the kit really runs Nightstick/Ram Charge/Taser; and blind has no payoff until §1's Lockdown fix.

**Finisher bruiser — giant (60 MP; titan, earth, dirtyfighting).** `raceStonefall` T1 (1, stagger through cover) · `raceTremorStomp` T1 (1, self-aoe stagger) · `raceBoulderHurl` T1 (1, finisher stagger) · `raceBodyCheck` T1 (1, finisher stagger + push) · `raceColossalCrush` T4 (4, finisher stagger 2 AP) · `passiveWarpath` (1) · `gearChronoLocket` (1) = 10. Upgrades: Exploit on Boulder Hurl (1), Exploit on Body Check (1), Knockback on Body Check (1), Empowered on Colossal Crush (1), Aftershock family passive (2) would make 16 but breaks the 2-passive cap — drop Chrono Locket for Aftershock. On paper: Stonefall → Boulder Hurl ×1.5(+0.5) = a 200-dmg T1 loop for 50 MP. Where it breaks: 60 MP is one loop, then 2 MP a round; Colossal Crush (100) is a dead row for the whole match. This kit is the proof for §4's MP floor — with 100 MP it is the best budget finisher in the game.

**Area caster — wizard (255 MP; arcane, fire, ice, lightning).** `raceArcaneBlast` T1 (1, cross 100) · `raceIceSpear` T1 (1, slow2 range 5) · `sharedFlashFreeze` T2 (2, 3-tile ice + frozen) · `wallOfFire` T3 (3, burning wall 3 rounds) · `raceDiamondDust` T3 (3, cross slow, 2 AP) · `meteor` T4 (4, 3×3 burn3 finisher:burn) · `passiveArcaneSurge` (1) = 15; Efficient on Meteor (1) = 16. MP: Wall (75) + Meteor (90) + Diamond Dust (75) = 240 of 255 — three big casts, then T1s and the 8-MP regen. Wall of Fire → Meteor is self-contained burn. Where it breaks: Flash Freeze's frozen pays nothing in the pool (needs the Shatter upgrade or Brittle), and the 2-AP Diamond Dust leaves no AP to move on the round it is cast (Flash Freeze is 1 AP).

**Healer — priest (230 MP; healingmagic, angelic, biblestudy, light).** `heal1` T1 (1, 192, more below 40%) · `racePurify` T1 (1, 3×3 cleanse-all / strip enemy buffs) · `raceBlessing` T2 (2, def/mdef +1, 40 HP/round) · `raceAbsolution` T2 (2, 80 + cleanse:99) · `racePrayer` T3 (3, 150 shield) · `raceHallelujah` T4 (4, 180 all + cleanse 2, 2 AP) · `passiveGrace` (1, +2 range +24 heal) = 14; Efficient on Hallelujah (1), Long Reach on Prayer (1) = 16. Works: every row is a different tool and Purify is the counter to every archetype in §2. Where it breaks: the pool offers four single-target heals (`heal1` 192, `raceDivineLight` 140, `raceAbsolution` 80, plus `sentaiGreenArrow`-class rows elsewhere) and a kit wants one — `raceDivineLight` should be DELETED or become the T1 of a family that lacks a heal; and three of the priest's four damage T4s are finishers keyed to statuses he cannot apply (`exorcism` contract/hexed, `judgment` slow, `raceMerkaba` burn; `raceDivineSmite` is plain) — unreachable without a hex/slow/burn team.

**Controller — siren (220 MP; sonic, water, seduction).** `discordance` T1 (1, discord2) · `raceSirenSong` T1 (1, pull 3 through hazards, grounds flyers) · `raceSonicBreaker` T2 (2, line push, finisher:silence) · `provoke` T2 (2, taunt) · `raceDeafeningWail` T3 (3, self-aoe silence) · `requiem` T4 (4, self-aoe r4 discord + finisher:discord) · `passiveThirdEye` (1) = 14; Lingering on Deafening Wail (1), Efficient on Requiem (1) = 16. Two self-contained loops: Discordance (25) → Requiem (90), Deafening Wail (75) → Sonic Breaker (50). Where it breaks: Requiem and Deafening Wail are self-centred on a 520-HP support — she must stand in the melee she is disarming; swap Provoke for `raceDeepDive`-style escape if the race had it (it does not: siren has no movement row but Siren Song).

**Summoner — gnome (205 MP; engineering, earth, trapmaking).** `repair` T1 (1, 155) · `deployTurret` T2 (2, ×2, 110 end of round) · `raceLucidTrap` T2 (2, 25 MP stun trap, free placement) · `raceTinkersContraption` T2 (2, 100 shield aoe) · `raceClockworkTurret` T3 (3, 65/round) · `fiveGTower` T3 (3, -8 M DEF aura) · `passiveTinker` (1, turrets +1 range) = 14; Surplus on Deploy Turret (1, 3 turrets), Efficient on Clockwork Turret (1) = 16. Round 1: two turrets (100 MP) + trap (25); round 2: Clockwork (65) — 190 of 205 MP, then the wall stands and the gnome repairs. Where it breaks: nothing in the kit pays for the wall existing (no Foreman/Detonate yet), `fiveGTower` is 75 MP for -8 M DEF, and one `racePermafrost` or `meteor` erases the whole board state; the gnome's own earth rows (`raceBoulderHurl` finisher:stagger, `sharedFissure` stagger) are the better second half — swap 5G Tower for Fissure (1) + Boulder Hurl (1) and the summoner becomes a trap-and-stagger controller at 14 SP.


---

## F.g1 Families — elements, winter, Christmas, agriculture, scarecrow

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


---

## F.g2 Families — holy, knightly, occult, cult, astral

### 👼 Heavenly Duties `angelic` — VERDICT: KEEP (reshape: 4/1/1/1 → 2/2/2/1)
**Identity.** The angelic support kit — mercy in motion: heal, cleanse, lift, rescue-swap, consecrated ground, and one heaven-sent smite that punishes the Unholy.
**Races.** priest ✓ (channels divine energy), angel ✓, seraphim ✓, nun ✓ (sister of mercy), valkraye ✓ (divine psychopomp — she carries the slain to heaven), **fallen angel ✓ (KEEP)** — his lore says he "retains angelic power output"; the powers are still his, only the directive is gone. [SKEPTIC: the proposed RACE_REMOVE fallen angel / RACE_ADD `infernalcourt` is STRUCK — Infernal Court is "the rule of hell: decrees, conscriptions and dark crowns"; his lore has no court, no command and no Lucifer, so it fails the yeti test harder than the family it replaced, and the removal would also strip his only heals (Divine Light / Purify / Sanctuary — all three of his heal rows). Rung 3 stays `raceSanctuary`.] No race off the family plainly belongs on it.
**Now.**
- T1 Divine Light `raceDivineLight` · heal 140 single, rng 3, 25MP.
- T1 Purify `racePurify` · 3×3 at rng 3: allies lose every debuff, enemies lose every buff.
- T1 Radiant Bolt `radiantBolt` · 100 light magic single, rng 4.
- T1 Rapture `raceRapture` · Protect 1 round on an ally, rng 4, **2 AP**, CD2.
- T2 Miracle `raceWingsOfMercy` · swap with an ally, "heals on arrival" (`healOnSwap: 60`).
- T3 Sanctuary `raceSanctuary` · 3×3 zone, 48 HP/round for 2 rounds.
- T4 Divine Smite `raceDivineSmite` · 180 light magic single, rng 4, **2 AP**, +80 vs Unholy.
**Problems.**
- Radiant Bolt is Smite (`raceSmite`, Light T1, 100 light magic) with +1 range; priest/angel/seraphim/nun own both families and get two identical T1 bolts (summary redundancy group "damage | damage | light | single | 3").
- `healOnSwap` is read by nothing (data.js:6170 is its only occurrence in the repo): Miracle's "the ally heals on arrival" is a dead promise.
- Sanctuary at T3 (48/round × 2 = 96) is worse than Water's T2 Tidal Blessing (52/round × 2 for 50MP) and far under T3 Temporal Tide (100/round).
- Divine Smite costs 2 AP for 180 single; Exorcism (T4, 1 AP) does 160 + the same +80 Unholy AND a ×1.5 finisher. Ancient Magic/Flat Earth/Jurassic Jaw are 180 at 1 AP.
- Rapture (T1, 2 AP, CD2) and Protect (`protect1`, Light T2, 1 AP, CD3) both apply protect 1 round to the same four races — same effect, two rows.
- Purify at T1 (double-sided AREA cleanse) dominates every single-target cleanse in the game (Absolution T2, Cleanse T2, Herbal Remedy T1 cleanse 2).
- Four T1 rows, one row each at T2/T3/T4.
**Changes.**
- DELETE `radiantBolt` (Smite covers it for every caster on the family; valkraye is a 26-INT bruiser who never wanted a magic bolt). Angel rung 1 `radiantBolt` → `raceDivineLight`.
- RETIER `racePurify` T1 → T2 (50MP). It stays the only area cleanse in the game and now sits above the single-target ones. Nun rungs: see Bible Study below — ONE set, `[[raceAbsolution, raceBlessing], [racePurify, raceCultSermon], racePrayer, raceHallelujah]` (the file previously gave two different nun rung sets; this is the one that stands — every id is in Bible Study or Heavenly Duties, both hers).
- RETIER + REWRITE `raceRapture` T1 → T2 (50MP), 1 AP, CD2, rng 4: the ally is lifted — Protect 1 round AND Levitating 2 rounds (temporary flight with the high-ground bonus). Now it differs from Protect: it pulls a tank out of a melee scrum or over a wall. Seraphim rungs → `[raceAbsolution, raceRapture, raceSanctuary, raceMerkaba]`.
- REWRITE `raceWingsOfMercy` (Miracle): keep the swap; wire `healOnSwap` in battle.js and set it to 100 (a T2 heal-lite). Until wired, strike the "heals on arrival" clause.
- REWRITE `raceSanctuary`: healPerTurn 48 → 90, zoneDuration 2 → 3 (270 per ally over 3 rounds if they hold the ground — the consecration rewards holding a point, which is the tank/healer plan).
- RECOST `raceDivineSmite` 2 AP → 1 AP (100MP, 180, +80 vs Unholy stays). It is the anti-Unholy hammer; Exorcism is the anti-curse one.
- MOVE `raceDivineJudgment` (Holy Defense → `angelic`): it is defined in the seraphim's block (data.js:6085) but the seraphim is not on Holy Defense, so only valkraye (INT 26) and crystal guardian (INT 40) can equip a 135 MAGIC cross. RECOST 50MP → 75 (on ladder), 2 AP → 1 AP, dmg 135 → 125, Burn 2 kept. It becomes the family's T3 damage and feeds Merkaba's burn finisher (seraphim rung 4) inside one race.
**Additions.** None — after the moves the ladder is T1 Divine Light, (Purify→T2) · T2 Purify, Rapture, Miracle · T3 Sanctuary, Divine Judgment · T4 Divine Smite. Seven rows, every tier filled, nothing duplicated.
**Upgrades.** Efficient on Divine Light; Long Reach on Miracle (rescue from 5); Lingering on Rapture (Protect 2 rounds for 1 SP — the family's premium defensive line); Empowered + Blast on Divine Smite (Blast makes it the family's 3×3 — no separate area smite). `upWiden` only takes damage roles (its `area` fit in SPELL_UPGRADE_FITS also tests `spellHasDamage`), so Purify/Sanctuary cannot grow: add a family-scoped upgrade **Consecrated** (2 SP, `families: ['angelic']`, patch `{ aoe: { preset: '5x5' } }`) for Purify and Sanctuary — it needs a NEW fit key (e.g. `areaAny`: `aoeRadius > 0`, no damage test) added to SPELL_UPGRADE_FITS, because the existing `area` key would reject both rows (no dmg).

### 📖 Bible Study `biblestudy` — VERDICT: KEEP (6 rows; the cult rows leave)
**Identity.** Scripture as support: bless, absolve, shield with prayer, and — when the enemy is cursed or contracted — burn the curse out with an Exorcism.
**Races.** priest ✓, nun ✓ ("blessings that hold under fire, a choir that can be heard through the wall"), seraphim ✓ (the scripture's own source; Blessing/Prayer/Exorcism/Hallelujah all read as a seraph's). No misfits; nobody off the family plainly belongs (knight/arthur are already holy through Knighthood).
**Now.**
- T1 Sermon `raceCultSermon` · aura r2, allies Blessed 2 rounds; shadow element, spellType unholy, "the word is him".
- T2 Absolution `raceAbsolution` · heal 80 + cleanse ALL, rng 3. (**Defined twice**: data.js:6090 seraphim = healAll 130 + cleanse, 2 AP; data.js:7077 priest = heal 80 single. `RACE_ABILITY_BY_ID` is last-write-wins, so the priest row is live and the seraphim row is dead code.)
- T2 Blessing `raceBlessing` · Blessed 3 rounds single (+1 DEF, +1 M DEF, 40 HP/round).
- T2 Tithe `raceCultTithe` · 50 shadow magic + steal 1 item, rng 2, 25MP (off-ladder), "everything you own belongs to the family".
- T3 Prayer `racePrayer` · 150 HP barrier single.
- T4 Exorcism `exorcism` · 160 light magic, 1 AP, rng 3, finisher contract/hexed ×1.5, +80 vs Unholy.
- T4 Hallelujah `raceHallelujah` · heal 180 all allies + cleanse 2, 2 AP.
**Problems.**
- Sermon and Tithe are cult-leader rows (ids `raceCult*`, unholy, shadow, cult voice) filed under a family the cult leader does not own. Tithe is identity drift; Sermon is a priest's verb wearing the wrong robe.
- Sermon at T1 (team Blessed 2 rounds, 25MP) dominates Blessing at T2 (single Blessed 3 rounds, 50MP): N allies × 2 rounds beats 1 ally × 3 rounds.
- Blessed has SETUP 2 / PAYOFF 0 (synergy.md) — nothing in the game cares that an ally is Blessed.
- Prayer (T3, 75MP, shield 150) is Psychic Barrier (T2, 50MP, shield 150) at a higher price.
- Absolution's duplicate row: the seraphim's rung 2 resolves to the priest's version; the healAll-130 version can never be equipped.
**Changes.**
- MOVE `raceCultTithe` → `cult` and RETIER T2 → T1 (it already costs 25MP; 50 dmg + steal is a T1 payload). Cult of Personality gets its missing T1.
- REWRITE `raceCultSermon` (stays here — priests give sermons): element shadow → light, spellType unholy → divine, desc "Gather round. Allies within 2 tiles are Blessed for 2 rounds — they have heard the word." RETIER T1 → T2 (50MP): team-wide Blessed is a T2 payload.
- RETIER `raceBlessing` T2 → T1 (25MP): single Blessed 3 rounds is the family's cheap opener; Sermon is the T2 team version.
- RETIER `raceAbsolution` T2 → T1 (25MP): heal 80 + full cleanse single is a T1 next to Herbal Remedy (T1, 160 + cleanse 2). DELETE the dead seraphim row at data.js:6090 so the id is defined once.
- REWRITE `racePrayer` (T3, 75MP, 1 AP, rng 3): shield 150 → 200 AND the ally is Blessed 2 rounds — prayer is barrier plus blessing, distinct from Psychic Barrier and from Blessing.
- REWRITE `raceHallelujah`: Blessed allies are healed ×1.5 (270) — the Blessed payoff. Needs a small hook (`healBonusVsStatus: { status: 'blessed', mult: 1.5 }`) in the healAll path.
- Tree rungs: priest `[raceDivineLight, protect1, raceSmite, exorcism]` → rung 3 `raceSmite` (a T1 in ring 3) → `racePrayer`. Nun → `[[raceAbsolution, raceBlessing], [racePurify, raceCultSermon], racePrayer, raceHallelujah]`.
**Additions.** None. Ladder: T1 Absolution, Blessing · T2 Sermon · T3 Prayer · T4 Exorcism, Hallelujah.
**Upgrades.** Lingering on Blessing (Blessed +1 round, 1 SP — the family's obvious pick); Sermon only takes Lingering if its aura is written as `statusEffects` — today it uses `teamStatusEffects`, which the `status` fit in SPELL_UPGRADE_FITS does not read; Exploit on Exorcism (×2 vs hexed/contract — pair a priest with a witch or a demon and that is the team's finisher); Efficient on Hallelujah. No Blast/Forked on Exorcism by default — it is the single-target rite; a Forked Exorcism is fine as a player choice.

### 🏥 Healing Magic `healingmagic` — VERDICT: KEEP (fill T2, fix the over-tuned T1)
**Identity.** The plain white-magic ladder every healer class can lean on: burst heal, party heal, revive — no flavour, pure sustain.
**Races.** priest ✓, angel ✓ ("radiates restorative energy field"), orb of light ✓ (divine support), starfish ✓ ("keep the squad alive"; rungs heal1/revive1), hippie ✓ (support, "keep a whole squad on its feet"). **ice queen ✗** — absolute-zero crystalline caster with "dominion over the frozen places between the stars"; nothing in her lore heals. RACE_SWAP ice queen: `healingmagic` → `cosmic` (Entropic Beam / Heat Death / Black Hole ARE the frozen places between the stars; her rungs are all Ice, nothing breaks). **cult leader ✗** — his lore is charm, indoctrination and "the passing of a cup", not healing; Meditation (below) gives him sustain. RACE_REMOVE cult leader.
**Now.**
- T1 Heal `heal1` · heal 192 single, rng 3, more on allies under 40% HP.
- T3 Heal All `healAll` · heal 140 all allies, 1 AP.
- T4 Revive `revive1` · revive at 45% HP, rng 4, once per unit per match.
**Problems.**
- Heal at T1 (192) out-heals every T2 heal in the game (Palm Read T2 190, Absolution T2 80) and Divine Light (T1 140) by a mile; a 25MP row that also scales up on low allies is the best heal per MP in the game.
- No T2.
**Changes.**
- RETIER `heal1` T1 → T2 (50MP). Numbers stay (192, +bonus under 40%). Starfish rung 1 `heal1` → new `raceSoothe`; rung 2 → `[heal1, raceTidalBlessing]`.
**Additions.**
- NEW **Soothe** `raceSoothe` — T1 heal/heal, light, 25MP 1 AP, rng 3, single: heal 80 and Regen 2 rounds. "A hand on the brow. It does not fix you; it keeps you going." The T1 that is a heal-over-time, so it does not duplicate Divine Light's flat 140 and rewards casting before the hit lands.
- PASSIVE **Triage** `passiveTriage` — T1 (1 SP), `hooks: { healOnceBelowPct: { pct: 40, healPct: 30 } }`: once per life, dropping under 40% HP heals 30% max HP. The healer who keeps herself alive when the assassin dives her.
**Upgrades.** Efficient + Long Reach on Heal (the workhorse); Efficient on Heal All (already 1 AP; this just makes the 75MP party heal cheaper). Revive takes Long Reach only. Grace (Training) already stacks +24/+2 range onto all of these — that is the intended passive pairing; do not add a healMult family passive on top of Devout + Grace.

### 👼⚔️ Holy Defense `holydefense` — VERDICT: KEEP (5 rows; the magic cross leaves, the duplicate shield becomes a taunt)
**Identity.** The holy front line: shield the squad, hold the ground, dive the flank with a spear, and choose who comes back from the dead.
**Races.** valkraye ✓ (spear, honor, chooser of the slain), crystal guardian ✓ ("stood watch over one door… hold ground"). [SKEPTIC: the proposed RACE_ADD **knight** is STRUCK — four of the family's five rows are Norse-valkyrie rows by name (Valkyrie Spear, Shield Maiden, Divine Swoop, Chooser of the Slain = the literal translation of "valkyrie"); a chivalric human in full plate throwing a Valkyrie Spear is the yeti in the Santa hat. The knight keeps Knighthood (4) + Swordsmanship (5) + Horseback Riding (1) = 3 families, pool 10, all four rungs inside Knighthood — legal and on-theme.] Golem (divine sigils) is thematically close but has 70 MP and INT 0 — leave him on Living Stone.
**Now.**
- T1 Valkyrie Spear `raceValkyrieSpear` · 100 physical single, rng 2, DEF −1.
- T2 Holy Bulwark `raceHolyBulwark` · 160 shield to all allies in a 3×3 at rng 3.
- T2 Shield Maiden `raceShieldMaiden` · 120 shield, `aoeRadius: 0` = one ally, rng 3.
- T3 Divine Judgment `raceDivineJudgment` · 135 MAGIC cross r2 + Burn 2, 50MP (off-ladder), 2 AP.
- T3 Divine Swoop `raceDivineSwoop` · leap strike 125 physical, +20 per level dropped.
- T4 Chooser of the Slain `raceChooserOfSlain` · revive at 60%, rng 4, 2 AP, once per unit per match.
**Problems.**
- Shield Maiden is Holy Bulwark with a smaller number and no area, same tier, same races — strictly dominated (summary group "effect | aoeShield").
- Divine Judgment is a magic cross on a family whose owners have INT 26 / 40; it was written for the seraphim (data.js:6085) who cannot equip it. Off-ladder 50MP at T3.
- Chooser of the Slain costs 100MP; the valkraye has **80 MP** — her own rung-4 capstone is uncastable.
**Changes.**
- REWRITE `raceShieldMaiden` (T2, 50MP, 1 AP, self): +1 DEF stage and every enemy within 2 tiles is Taunted for 1 round (must attack her). The shield-maiden stands in front — a tank's tool, not a second shield. Valkraye rung 2 stays `raceShieldMaiden`.
- MOVE `raceDivineJudgment` → `angelic` (see Heavenly Duties for its retune).
- RECOST `raceChooserOfSlain` MP 100 → 75 (pinned override; keeps 2 AP, 60%). The valkraye must be able to cast her capstone with 80 MP. Same problem hits Crusade/Excalibur below.
**Additions.** None. Ladder: T1 Spear · T2 Bulwark, Shield Maiden · T3 Swoop · T4 Chooser. Five rows for a support-tank family is the right size; valkraye pads her front with Chivalry/Shield Bash from Knighthood (her RACE_ADD below).
**Upgrades.** Knockback on Valkyrie Spear (spear-shove off a ledge, 1 SP); Empowered on Divine Swoop; Lingering on Shield Maiden (Taunt 2 rounds). Shields cannot take Widen (damage roles only): add a family-scoped **Reinforced** (1 SP, `families: ['holydefense']`, patch `{ shieldHp: +60 }`) for Holy Bulwark — SPELL_UPGRADE_FITS has no `shieldHp` key today, so add one (`shieldHp: d => (d.shieldHp | 0) > 0`). Chooser takes Long Reach only.

### ♞ Knighthood `knight` — VERDICT: GROW (3 → 4; shared with every knightly race)
**Identity.** The code, not the crown: take the hit for your ally, bash and stagger, swear an oath that lifts the line, and crusade through the Unholy.
**Races.** knight ✓, king arthur ✓. RACE_ADD **valkraye** ("unwavering honor code, refuses to engage unworthy opponents" — the code is in her lore line; Crusade's +60 vs Unholy suits a divine psychopomp, and she has the 80 MP for its pinned 75). [SKEPTIC: the proposed RACE_ADD **crystal guardian** is STRUCK — "in the shape of a knight" is a silhouette, not a code; its lore is "hold ground… do not move unless something makes them", which Chivalry (dash to an ally) and Crusade (a charge through the line) contradict outright. It already has 4 families / pool 23 and needs nothing.] Knighthood becomes the shared knightly-code family; Camelot Powers stays Arthur's court.
**Now.**
- T1 Chivalry `raceChivalry` · guard an ally: next time they are attacked you dash over and take the hit, CD2.
- T3 Oath of Valor `raceOathOfValor` · aura r2, ATK +1 stage, 75MP.
- T4 Crusade `raceCrusade` · 160 MAGIC cross r2, rng 4, 2 AP, +60 vs Unholy.
**Problems.**
- Oath of Valor (T3, 75MP) is Royal Decree (`raceRoyalDecree`, Camelot T1, 25MP) — the same ATK +1 aura r2 on the same two races, at triple the price (summary's "effect | warCry | atk1" group lists Royal Decree beside Rally Command; Oath of Valor escapes it only because its element is light).
- Crusade is MAGIC damage on a knight with INT 29 and an Arthur with INT 28; and it is 2 AP, and it costs 100MP on a knight with **95 MP** and an Arthur with **80 MP** — neither can cast it. It also duplicates Judgment (Light T4, cross).
- No T2.
**Changes.**
- REWRITE `raceOathOfValor` (T3, 75MP, 1 AP, aura r2): allies within 2 gain +1 ATK AND +1 DEF stage. The T3 oath is the two-stat rally; Royal Decree stays the cheap ATK-only one.
- REWRITE `raceCrusade` (T4): damageType physical, self-centred cross r2 (`aoeOriginSelf`, rng 0), 160, 1 AP, +60 vs Unholy, MP pinned 75. "Deus vult" is a charge through the line, not a spell lobbed from 4 tiles.
- Knight rungs → `[raceChivalry, raceShieldBash, raceOathOfValor, raceCrusade]` (rung 2 was `raceShieldWall`, which goes unique to Arthur).
**Additions.**
- NEW **Shield Bash** `raceShieldBash` — T2 damageEffect/damage, physical, 50MP 1 AP, rng 1, single: 110 and Stagger 1 (the target loses 1 AP). "Edge of the shield, under the chin." Fills T2; Stagger also feeds Robo Punch/Horn Toss-style teammates and is the setup a knight with Excalibur (burn) → Dragon Slash (burn finisher) does not otherwise have.
**Upgrades.** Chivalry takes no Lingering (it is a `utility/guard` row with no `statusEffects`; Lingering fits only damageEffect/effect rows that apply a status) — Efficient and Long Reach are its picks; Knockback on Shield Bash (the `push` fit accepts any single-target damage hit); Empowered + Widen on Crusade (Widen turns the self-cross into the 5×5 — do not add a separate area crusade). Efficient on Oath for the 80-MP Arthur.

### 🏰 Camelot Powers `royalty` — VERDICT: KEEP → UNIQUE to king arthur
**Identity.** The court of Camelot: a king's decree, his curtain wall, the Round Table answering the call, and Excalibur.
**Races.** king arthur ✓. **knight ✗** — Arthur's lore: Excalibur "cannot be wielded by any other tested subject", yet the knight owns the family and equips Excalibur Strike. RACE_REMOVE knight; set `unique: 'king arthur'` (the D.O.O.R. Gun model). The knight keeps Knighthood (grown to 4), Swordsmanship (5) and Horseback Riding (1): 3 families, pool 10 (was 13; the Holy Defense add was struck — see that family). Knight rungs `[raceChivalry, raceShieldBash, raceOathOfValor, raceCrusade]` all sit in Knighthood.
**Now.**
- T1 Royal Decree `raceRoyalDecree` · aura r2, ATK +1 stage.
- T2 Walls of Camelot `raceShieldWall` · 3 castle-wall tiles in a line, 60 dmg to enemies on them, blocks move and sight.
- T3 Knights of Round `raceKnightsOfRound` · every ally on the field is pulled to the King (rooted ones cannot come).
- T4 Excalibur Strike `raceExcaliburStrike` · 180 physical, rng 1, Burn 2, 100MP.
**Problems.**
- Excalibur Strike costs 100MP; Arthur has **80 MP**. His own rung-4 capstone is uncastable.
- Otherwise a clean 1/1/1/1 with a unique T3 (the only whole-team pull in the game).
**Changes.**
- RECOST `raceExcaliburStrike` MP 100 → 75 (pinned). Burn 2 stays — it is Arthur's setup for Dragon Slash (Swordsmanship T4, burn ×1.5), his own self-contained finisher chain.
- FAMILY registry: `unique: 'king arthur'`.
**Additions.** None.
**Upgrades.** Empowered + Exploit-free (no finisher) on Excalibur; Long Reach on Walls (place from 4); Efficient on Knights of Round. Do not allow Widen on Walls (tiles3 is a line, not an area — `requires: 'area'` already excludes it).

### 🧘 Meditation `meditation` — VERDICT: GROW (2 → 4; the self-mastery family)
**Identity.** Inner peace as sustain: breathe, cleanse, chant the team into regen, then wake up as the prophecy.
**Races.** hippie ✓ ("camped at the stones on the solstice"), cult leader ✓ (the guru at the altar). RACE_ADD **ki fighter** — meditation is the root of every martial art, Awakening (cleanse, +30% HP, ATK +2 / SPD +2 self) is the power-up transformation his kit is missing, and summary.md lists ki fighter as missing "sustain". Shaman already has Ayahuasca Retreat for this role — leave him off.
**Now.**
- T2 Cleanse `cleanse` · remove harmful statuses from one ally, rng 3.
- T4 Awakening `raceAwakening` · self, 2 AP, CD3: cleanse all, heal 30%, ATK +2, SPD +2.
**Problems.**
- Cleanse (T2, 50MP, cleanse only) is dominated by Absolution (heal 80 + cleanse all) and Herbal Remedy (T1, heal 160 + cleanse 2); after this audit Purify (area) sits at the same tier.
- No T1, no T3.
**Changes.**
- RENAME + REWRITE `cleanse` "Cleanse" → "Inner Peace" (T2, 50MP, 1 AP, rng 3, single ally): removes every debuff AND +1 M DEF stage. Now it is the cleanse that also hardens the mind; hippie rung 2 keeps the id.
**Additions.**
- NEW **Deep Breath** `raceDeepBreath` — T1 heal/selfHeal, 25MP 1 AP, self: heal 100 and cleanse 1. "In through the nose." The cheap self-sustain a support casts between real turns; unlike Soothe (ally) it is self-only, unlike Reassemble (T2) it cleanses.
- NEW **Mantra** `raceMantra` — T3 effect/warCry, light, 75MP 1 AP, aura r2: allies within 2 gain Regen 3 rounds (Regen = 40 HP/round in data.js, so 120 per ally) and cleanse 2 each. "One word, everyone breathing it." The team-sustain T3 that makes a meditation build viable without a dedicated healer; pairs with Sanctuary/Tidal Blessing zones. [SKEPTIC: was Regen 2 + cleanse 1 — 80 HP per ally, which the rewritten Sermon (T2, aura r2, Blessed 2 = the same 80 HP PLUS +1 DEF/+1 M DEF) dominated from a tier below; renumbered so the T3 beats the T2.]
- Ladder: T1 Deep Breath · T2 Inner Peace · T3 Mantra · T4 Awakening.
**Upgrades.** Lingering on Mantra (Regen +1 round) only if its aura Regen is written as `statusEffects` (the `status` fit ignores `teamStatusEffects`); Inner Peace as written (cleanse + a stat stage) applies no status, so Lingering does not fit it — Efficient/Long Reach instead; Efficient on Awakening (100 → 90; the ki fighter has 120 MP, so the capstone is castable as-is — one cast per life, which is right for a transformation). Awakening has no dmg, so Empowered never applies — nothing to do.

### ✌️ Cult of Personality `cult` — VERDICT: GROW (3 → 4, T1 arrives from Bible Study)
**Identity.** Control the room: take their things, pass the cup, own their next turn, and call the family out of the dark.
**Races.** cult leader ✓ — and only him; the family reads as one man's charisma. Nobody else belongs (politician/ringmaster persuade, they do not indoctrinate).
**Now.**
- T2 The Kool-Aid `raceCultKoolAid` · Charm 2 rounds single, rng 3, CD2.
- T3 Indoctrinate `raceCultIndoctrinate` · Possessed: the enemy's next activation is yours, rng 2, CD3.
- T4 The Gathering `raceCultGathering` · summon a Cult Member (walks 3, hits 55, 2 HP), max 2.
**Problems.**
- No T1 (summary: "Cult of Personality: missing T1").
- Kool-Aid (Charm) sets up nothing in his own pool: Charm's payoffs are Seduction's Enthrall (×2 activations if charmed) and Draining Embrace. Indoctrinate is Enthrall without the charm payoff — the family's own setup→payoff is missing.
**Changes.**
- MOVE `raceCultTithe` (Bible Study → `cult`), RETIER T2 → T1 (already 25MP): 50 shadow magic + steal an item, rng 2. It was always his ("everything you own belongs to the family").
- REWRITE `raceCultIndoctrinate`: add `bonusVsStatus: { status: 'charm', mult: 2 }` on the `possess` row (exactly Enthrall's field at data.js:6296 — two activations if the target is Charmed). Kool-Aid → Indoctrinate becomes a real two-turn plan.
- Cult leader rungs `[raceJudgmentBeam, raceCultKoolAid, raceCultIndoctrinate, [raceCultGathering, raceAwakening]]` → rung 1 `raceCultTithe`.
**Additions.** None. Ladder: T1 Tithe · T2 Kool-Aid · T3 Indoctrinate · T4 Gathering.
**Upgrades.** Lingering on Kool-Aid (Charm 3 rounds — with Indoctrinate's ×2 this is the family's build); Surplus on The Gathering (+1 member, the summon family's natural 1 SP); Efficient on Tithe.

### 🗣️ Persuasion `persuasion` — VERDICT: DELETE
**Identity.** (empty) — talking people into things.
**Races.** cult leader (0 spells).
**Now.** Nothing.
**Problems.** Every kit a Persuasion family could hold already exists on the races who would own it: charm/possess is Cult of Personality (cult leader) and Seduction; discord-by-words is Brainwash (Deep State, politician) and Sonic's Discordance; silence/stun-by-words is Filibuster/Executive Order (Politics); taunt is Provoke (Sonic). A fourth mind-debuff family would be filler.
**Changes.**
- FAMILY_DELETE `persuasion`; RACE_REMOVE cult leader (his charisma IS Cult of Personality, now a full 1/1/1/1). Cult leader pool after this audit: Cult 4 + Temporal 4 + Meditation 4 = 12, same size as today and every row on-theme.
**Additions.** None.
**Upgrades.** n/a.

### 🔮 Fortune Telling `fortunetelling` — VERDICT: GROW (3 → 5, absorbs Astrology)
**Identity.** Foresight as a weapon: read the stars against a target, draw a card for the team, channel the spirits to mend, and drop what the cards foretold on the tile you were always going to stand on.
**Races.** fortune teller ✓ — only her (tarot, scrying, palm reading are her focus tools). Nobody else divines this way (mothman has Prophecy of Disaster in his own family). Her pool is 7, the smallest in the game: RACE_ADD fortune teller → `astralprojection` (séance = the spirit world; gives her an escape and a shield), which lifts her to 10 spells (Fortune Telling 4 + Witchcraft 3 + Astral Projection 3) plus the Star Chart passive.
**Now.**
- T1 Tarot Draw `raceTarotDraw` · `auraRadius: 99`: EVERY ally +1 stage of a random stat (atk/int/def/mdef), CD3.
- T2 Palm Read `raceSpiritChannel` · heal 190 + cleanse 2, rng 3.
- T4 Crystal Ball `raceCrystalBall` · delayed 3×3, 160 arcane magic after 1 turn, rng 5, hexed ×1.5.
**Problems.**
- Tarot Draw at T1 buffs the whole map for 25MP; Royal Decree (1 AP) and Rally Command (2 AP) give one guaranteed stat to allies within 2 for the same MP. The randomness is a discount, not a T1 licence.
- "Palm Read" is a 190 heal — a palm reading heals nobody; the id says what the row does (spirit channel).
- No T3.
- (For the Witchcraft reviewer: her other family holds Hex of Agony T2 and Family Curse T3 as identical hexed-3 rows — her rung 3 `raceCurseOfMisfortune` is the T3 one.)
**Changes.**
- MOVE `raceStarCrossed` (Astrology → `fortunetelling`), T1 stays: 70 arcane magic + an affliction by the target's zodiac (burn / root+exposed / silence / drowsy), +50% if the sign rules the sky — `zodiacReading` is read by battle.js, so it works. Her new T1 and rung 1.
- RETIER `raceTarotDraw` T1 → T2 (50MP); keep r99, random stat, CD3.
- RENAME `raceSpiritChannel` "Palm Read" → "Séance" (heal 190 + cleanse 2 stays at T2 — now on par with Heal after its retier). "The spirits mend what the living broke."
- Fortune teller rungs → `[raceStarCrossed, [raceTarotDraw, raceSpiritChannel], raceCurseOfMisfortune, raceCrystalBall]`.
**Additions.**
- [SKEPTIC: the proposed NEW **Tower Card** `raceTowerCard` (T3 damage/delayed, one tile, 150 + Hexed 2) is STRUCK — it is Crystal Ball's own role (`damage/delayed`) in the same family with a smaller area and −10 dmg, and "smaller area" is what the Blast/Widen upgrades are for; its stated purpose, a hexed setup for Crystal Ball, is already the fortune teller's rung 3 Family Curse (`raceCurseOfMisfortune`, Witchcraft T3, hexed 3) — synergy.md already lists Crystal Ball as her self-contained finisher. The family has no T3; that is allowed, and her T3 rung lives in Witchcraft.]
- PASSIVE **Star Chart** `passiveStarChart` — T1 (1 SP), `hooks: { zodiacBonus: { own: { intStages: 1 } } }`: +1 M ATK stage while her own sign rules the sky. The zodiac system already exists (unit meta `zodiac`, the `zodiacBonus` hook); this is the row that makes a fortune teller check the sky.
- Ladder: T1 Star Crossed · T2 Tarot Draw, Séance · T4 Crystal Ball (no T3 — her rung 3 is Family Curse in Witchcraft).
**Upgrades.** Exploit on Crystal Ball (hexed ×2 — with Family Curse she is self-contained); Widen on Crystal Ball (5×5 is the family's big area — no separate spell; `delayed` is in `_UPG_AOE_KINDS`, so it fits); Long Reach on Star Crossed; Efficient on Tarot Draw.

### ♐️ Astrology `astrology` — VERDICT: MERGE INTO `fortunetelling`
**Identity.** Reading the stars — one spell.
**Races.** fortune teller.
**Now.**
- T1 Star Crossed `raceStarCrossed` · 70 arcane magic + zodiac affliction, +50% if the sign rules the sky.
**Problems.** One row on one race that already owns the divination family; the zodiac hook is a mechanic, not a family. Growing Astrology to four rows for a single race would split her 7-spell pool across three families for no team-building gain.
**Changes.**
- MOVE `raceStarCrossed` → `fortunetelling` (T1). FAMILY_DELETE `astrology`; RACE_REMOVE fortune teller. The zodiac flavour survives as the Star Chart passive in Fortune Telling.
**Additions.** None.
**Upgrades.** n/a (Star Crossed: Long Reach, Efficient. Not Lingering — it is a `damage` role and its affliction comes from `zodiacReading`, not `statusEffects`, so the `status` fit rejects it).

### 🚫 Occult Knowledge `ancientknowledge` — VERDICT: RENAME → "Ancient Knowledge" (📜) + GROW (4 → 5)
**Identity.** What the old civilisations knew: draw the pattern in crystal, raise the ziggurat, entomb, and unmake with words older than the lamp — the terrain-shaping caster family.
**Races.** annunaki ✓ (the tablets), djinn ✓ ("older than the lamp"), anubis ✓ (weighs the heart), occulus ✓ (the all-seeing eye that "draws the pattern" in Sacred Geometry's own text), professor ✓ ("four doctorates in fields the university does not list"). RACE_ADD **atlantean** ("civilisation appears to predate all known human records") — plainly ancient knowledge; his kit is water/ice/arcane with no terrain shaping. The registry glyph 🚫 is a placeholder and the name says "Occult" over an id that says "ancient"; every row is Egypt/Sumer, not the occult.
**Now.**
- T1 Sacred Geometry `raceSacredGeometry` · 3 crystal tiles in a line (DEF up, blocks ranged), 0 dmg.
- T2 Pyramid Protocol `raceZigguratProtocol` · 3 ziggurat blocks in a line, 80 dmg to enemies on them, blocks move + sight.
- T4 Ancient Magic `raceAncientMagic` · 180 magic single, rng 4, 1 AP — no rider.
- T4 Weigh the Heart `raceWeighTheHeart` · 180 magic single, rng 4, stagger ×1.5; `executeBonusPct: 0.5` is DEAD (only ui.js reads it — the "more damage the lower their HP" text is a lie).
**Problems.**
- Two T4s that are the same 180 single magic bolt at 100MP/1 AP (summary group "damage | damage | - | single | 5"); Weigh the Heart's only real difference is a stagger finisher that four of the five owners cannot set up themselves (anubis/djinn/occulus/professor all "need teammate" for it in synergy.md; only annunaki is self-contained, via Earth's Boulder Hurl / Stone Drop).
- No T3.
**Changes.**
- FAMILY_RENAME `ancientknowledge` "Occult Knowledge" → "Ancient Knowledge", glyph 🚫 → 📜.
- REWRITE `raceWeighTheHeart` (T4, 100MP, 1 AP, rng 4): 160 magic, ×1.5 when the target is under 50% HP (wire `executeBonusPct` in battle.js's damage path AND remove it from `SPELL_DEAD_FIELDS` in data.js, where it is listed today); DROP the stagger finisher. It becomes the game's honest execute (240 on a wounded target) — the heart weighed and found wanting.
- REWRITE `raceAncientMagic` (T4, 100MP, 1 AP, rng 4): 170 magic + Silence 1. "The old words unmake theirs." Distinct from Weigh; feeds Mind Shatter's silence finisher (Psychic — occulus and professor own it) and Call of the Deep (atlantean).
**Additions.**
- NEW **Sandstone Tomb** `raceSandstoneTomb` — T3 damageEffect/damage, earth/magic, 75MP 1 AP, rng 4, single: 125 magic and Rooted 2 rounds. "The sand closes over them, and the sand remembers." The family's control rung, and a self-contained setup: anubis pays it with Life Drain (root ×1.5), annunaki with Precision Shot (root ×1.5), everyone with Weigh the Heart once the rooted target has been chewed under half. [SKEPTIC: was effect-only Rooted 2 + DEF −1 at T3 — Rigormortis (Necromancy T2, 80 magic in a 3×3 + Rooted 2, 50MP) dominated it from a tier below; renumbered to Sleep Paralysis parity (Dream Predation T3: 125 + Rooted 2, 75MP), which the tier rule allows only at T3+.]
- Ladder: T1 Sacred Geometry · T2 Pyramid Protocol · T3 Sandstone Tomb · T4 Ancient Magic, Weigh the Heart.
**Upgrades.** Exploit-free (no finishers left by design; Weigh's execute is its own multiplier). Empowered on both T4s; Forked on Ancient Magic (silence two casters); Lingering on Sandstone Tomb (root 3). Long Reach on Sacred Geometry/Pyramid Protocol (build the wall from 4).

### 😴 Astral Projection `astralprojection` — VERDICT: GROW (2 → 3)
**Identity.** Leave the body: throw up a barrier from the spirit side, step through it, and carry an ally into the unseen — the escape/shield utility kit of the spirit-walkers.
**Races.** shaman ✓ ("consciousness transference"), telepath ✓ ("psychokinetic barrier projection"), watcher ✓ (observes every stream without moving — remote viewing). RACE_ADD **fortune teller** (séance, "genuine anomalous perception"; lifts the smallest pool in the game). Ghost is already a spirit — no.
**Now.**
- T1 Astral Barrier `raceAstralBarrier` · 90 shield to allies in a 3×3 around the caster, 25MP.
- T2 Spirit Walk `raceSpiritWalk` · teleport 4 + Invisible 1, CD2.
**Problems.**
- No T3/T4. Nothing internal is redundant; Astral Barrier (T1, 90, area) sits sensibly under Holy Bulwark (T2, 160) and Pupil Shield (T1, 130, one ally).
**Changes.** None to existing rows.
**Additions.**
- NEW **Spirit Guide** `raceSpiritGuide` — T3 effect/buff, psychic, 75MP 1 AP, rng 4, single ally: Invisible 1 round and Levitating 2 rounds. "Take my hand. They cannot see what is not here." The ally version of Spirit Walk (no teleport; they float out of the melee unseen) — a rescue for the telepath's tank or the shaman's frontliner that no other family offers to an ALLY.
- No T4 on purpose: the family is utility (the role×tier matrix has 0 movement rows at T4 game-wide), and every owner already carries a T4 nuke elsewhere (Bad Trip/Ego Death, Migraine/Mind Shatter, Reality Pulse, Crystal Ball). Three sharp rows beat a padded capstone.
**Upgrades.** Lingering on Spirit Guide (Invisible 2; it is an `effect` row with `statusEffects`) — not on Spirit Walk, whose `movement` role is outside Lingering's damageEffect/effect gate (Efficient is Spirit Walk's pick); Long Reach on Spirit Guide; no Widen (shield rows are not damage roles) — the Consecrated/Reinforced family upgrades above are the template if Astral Barrier ever needs one; it does not.

### 😵‍💫 Drug Use `psychadelic` — VERDICT: RENAME → "Psychedelics" + GROW (2 → 4)
**Identity.** Altered states as damage: dose them, share the high, send them on a bad trip, and dissolve the self entirely — the slow/stun psychic line.
**Races.** shaman ✓ ("plant-derived compounds… psychoactive"), hippie ✓, mushroom girl ✓ (psilocybin in a hat). **machine elves** — they are the DMT hallucination, not the user; "Drug Use" fails the yeti test for them, but "Psychedelics" (the id already says `psychadelic`) covers the entities as well as the substances, and Ego Death is their rung 4. Rename fixes the fit; keep all four.
**Now.**
- T4 Bad Trip `raceBadTrip` · 180 psychic magic single, rng 3, Slow 1, finisher slow/voodoo ×1.5, 1 AP.
- T4 Ego Death `sharedEgoDeath` · 180 psychic magic single, rng 3, Stun 1, 2 AP, CD2.
**Problems.**
- Two T4s and nothing under them: nobody can build toward the family; two 180-point single-target psychic bolts on the same four races is the same role twice.
- Bad Trip applies its own Slow and then pays it off — the finisher never needs the team; that is a 1 AP 270 at T4.
**Changes.**
- FAMILY_RENAME `psychadelic` "Drug Use" → "Psychedelics" (glyph stays).
- RETIER + REWRITE `raceBadTrip` T4 → T3 (75MP, 1 AP, rng 3): 125 + Slow 1, finisher slow/voodoo ×1.5 stays. The T3 that pays off Dosed and any teammate's Slow (26 setups game-wide). Shaman rungs → `[raceHerbalRemedy, raceSpiritWalk, [raceAyahuascaRetreat, raceBadTrip], sharedEgoDeath]`.
**Additions.**
- NEW **Dosed** `raceDosed` — T1 damageEffect/damage, psychic/magic, 25MP 1 AP, rng 3, single: 80 and Slow 2 rounds. "Something in the drink. Their feet stop agreeing with them." The T1 setup for Bad Trip, for Judgment/Star Decree/Tidal Slam teammates, and — because Slowed units act later — for Ego Death's stun to land first.
- NEW **Contact High** `raceContactHigh` — T3 effect/warCry, psychic, 75MP 1 AP, aura r2: allies within 2 gain +1 M ATK and +1 SPD stage. "Everyone in the tent is on something." The caster-team rally (Telepathic Link is INT only; this is the two-stat version) — the hippie/mushroom girl support row. [SKEPTIC: was T2/50MP — this file's own scale puts a one-stat aura r2 at T1 (Royal Decree) and a two-stat aura r2 at T3 (Oath of Valor rewrite); a two-stat aura at T2 undercuts both. Renumbered to T3. The family has no T2; allowed.]
- Ladder: T1 Dosed · T3 Bad Trip, Contact High · T4 Ego Death.
**Upgrades.** Exploit on Bad Trip (×2 vs Slow — with Dosed the family is a self-contained chain); Lingering on Dosed (Slow 3) and on Ego Death (Stun 2 — strong, 1 SP is fair at 2 AP/CD2); Efficient on Ego Death. Do not add Blast to Ego Death by default — the area stun at T4 belongs to Eternal Slumber (Dream Predation, aoe r2 = 5×5, 160 psychic + Stun 1, 2 AP CD2).

SPELL COUNT: 47 → 54 for this group (−1 Radiant Bolt; +8 Soothe, Shield Bash, Deep Breath, Mantra, Sandstone Tomb, Spirit Guide, Dosed, Contact High — Tower Card struck; plus 2 new family passives: Triage, Star Chart)


---

## F.g3 Families — demonic, infernal, necromantic, undead, vampiric, dream predation

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


---

## F.g4 Families — AI, robots, engineering, science, aliens, UFO, cosmic, temporal, prism, mech, driving

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


---

## F.g5 Families — beasts, apex, horns, cryptids, kaiju, giants, living stone, dragon, eyesight

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


---

## F.g6 Families — insectoid, arachnid, symbiosis, ooze, jellyfish, tentacles, deep sea

### 🐜 Insectoid Anatomy `insectoid` — VERDICT: KEEP (rewrite the venom loop, make the shell a passive, add the hive rung)
**Identity.** The exoskeleton kit: chitin, mandibles, venom that stacks, and the hive that digs tunnels and moves as one — a melee-poison bruiser family whose team value is the T3 tunnel and the T4 swarm buff.
**Races.** mantid (insectoid alien, "forelimb strike velocity 23m/s") fits, but it is atk 22 / int 94 and every damage row here is physical — its rung 1 `raceMandibleStrike` is a trap; keep it on the family for Chitin Armor / Tunnel Network / Swarm Signal and move its RACE_TREE rung 1 to `racePsychicBeam` (Psychic is a mantid family). antperson (eusocial, "swarm tactics: DEVASTATING", atk 94) is the model owner. bee queen (hive mother, "poison, command and multiply", Royal Jelly = immune to poison) fits. voidweaver is an arachnid, not an insect, but chitin + venom fangs are arachnid anatomy too and it needs `raceVenomFang` as rung 1 and as the payoff for its own webs — keep. ~~RACE_ADD mothman~~ STRUCK (skeptic): the yeti test fails — mothman's lore line is "winged humanoid … luminous red ocular organs … appears before catastrophic events … prophetic visions"; nothing in it is chitin, mandibles, venom, tunnels or a hive, and a moth has none of those either. Sharing the word "insect" is the Christmas-Spirit-on-a-yeti case. Its atk 8 would also make Mandible Strike / Venom Fang dead rows. Mothman's pool-of-10 problem belongs to the Mothman / Cryptid slice, not here. No race added; the family stays at four.
**Now.**
- T1 Mandible Strike `raceMandibleStrike` · 3 hits × 45 physical, rng 1.
- T1 Venom Fang `raceVenomFang` · 100 physical, rng 1, Poison 3, ×1.5 vs Rooted.
- T2 Chitin Armor `raceChitinArmor` · self DEF +1 stage, 50 MP.
- T3 Tunnel Network `raceTunnelNetwork` · deployPair, rng 3, 1 per caster, desc "Deploys a linked pair of objects."
- T4 Swarm Signal `raceSwarmSignal` · warCry aoe r2, ATK +2 stages (data) — desc says "+1 stage".
**Problems.**
- Venom Fang is the same row as Infectious Bite `raceInfectiousBite` (Poison family: 100 physical, rng 1, Poison 3) and antperson + bee queen own BOTH families; its Rooted finisher has no setup on mantid, antperson or bee queen (synergy.md: all three "need teammate" for Venom Fang) — only voidweaver (Web Shoot) can pay it.
- Chitin Armor is the fourth copy of "self DEF +1 stage at T2 / 50 MP" (Iron Bulwark, Stone Skin, Thick Hide — summary redundancy group). For an ANATOMY family the shell should be always-on, not a stance.
- Tunnel Network's description is the engine placeholder; nobody can tell from the rack that it is a door pair whose far mouth is a cast origin (battle.js "The Long Way Round": range + LOS from the twin, 3 hits break both).
- Swarm Signal: data grants ATK +2 stages, the desc promises +1 — one of them is wrong; the row is otherwise a bigger Apex Roar (T3, ATK +1, aoe r2) with no hive flavour.
- No T2 active once Chitin becomes a passive, and nothing in the family says "swarm" except the T4 buff.
**Changes.**
- REWRITE `raceVenomFang`: 100 physical, rng 1, applies Poison 3; finisher becomes ×1.5 vs POISONED (no statusFirst, so the first bite envenoms and the second bite "goes deep"). Self-contained loop for every owner; also pays off Infectious Bite / Sting / Corrosive Splash from teammates. Desc: "A second bite on an envenomed target finds the vein."
- PASSIVE: `raceChitinArmor` becomes the family passive "Chitin Armor" (T2, 2 SP, hooks `{ statBonus: { def: 8 }, immuneStatus: ['stagger'] }`) — "A shell that does not flinch: +8 DEF, immune to Stagger." If a RACE_TREE rung cannot be a passive, mantid rung 2 → `racePsychicBarrier` and bee queen rung 2 → the new `raceBrood`.
- REWRITE `raceTunnelNetwork`: range 3 → 4; desc "Dig a tunnel: one mouth beside you, one where you point (within 4). An ally standing at either mouth attacks and casts as if it stood at the other — range and line of sight from the far mouth. One tunnel per caster; three hits collapse both mouths." (Mechanics already exist for door pairs; this is a desc + range change.)
- REWRITE `raceSwarmSignal`: keep ATK +2 stages for allies within 2, add +1 MOV for 2 rounds (the swarm closes); fix the desc to say +2. "The signal goes out. Everything with legs comes running."
**Additions.**
- NEW **Brood** `raceBrood` — T2, deploy/summonUnit, poison, 50 MP / 1 AP, rng 1, single tile, `maxActivePerCaster: 1`, `summonDef: { key: 'drone', name: 'Drone', move: 4, dmg: 55, hits: 3 }` — the engine's pet model (battle.js summonUnit: hits-to-kill body, hunts the nearest enemy at end of round for dmg + half spell power, no HP/DEF/expiry fields exist), sized between Cult Member (T4, dmg 55 / 2 hits, max 2) and Hound (T3, dmg 60 / 3 hits). "One is never found alone." SKEPTIC: the original spec (HP 150, ATK 60% of caster, DEF 30, Poison 2 on hit, 3-round expiry) used fields the summon model does not have; a poison bite needs a new `summonDef.hitStatus: { id: 'poison', duration: 2 }` hook — list it as engine work, not as shipped behaviour. Fills the family's T2 active and gives antperson / bee queen the body-count their lore promises: a blocker for Tunnel Network mouths, a fifth body for Team Strike, a Swarm Signal recipient. mantid and voidweaver simply won't equip it (pool ≠ kit).
**Upgrades.** Venom Fang takes Exploit (×2 vs Poisoned) and Lingering (Poison 4) — that is the family's damage ceiling, do not add a "Deep Venom" spell. Mandible Strike: Empowered only (3 hits already spread; Ricochet/Forked/Blast should be excluded on multiHit rows). Brood takes Surplus (+1 drone). Swarm Signal takes Lingering. Family-scoped upgrade worth creating: "Envenomed Mandibles" (1 SP, families: ['insectoid'], on `raceMandibleStrike`: patch `{ statusEffects: [{ id: 'poison', duration: 1 }] }`) so the multi-hit can open the venom loop.

### 🕷️🕸️ Arachnid Powers `arachnid` — VERDICT: GROW (add the T4 payoff, make the zone a web)
**Identity.** Root control from range: single web, area web, a persistent web zone, then the payoff that eats what is caught — voidweaver's ambush ladder.
**Races.** voidweaver only ("reality-anchored webs that trap subjects between dimensional layers") — fits exactly; rule 2 applies, no other race in races.md is arachnid. Nothing to add.
**Now.**
- T1 Web Shoot `raceWebLaunch` · 80 PHYSICAL, rng 4, Rooted 1.
- T2 Web Snare `raceWebSnare` · 100 MAGIC 3×3, rng 4, Rooted 1.
- T3 Dimensional Web `raceDimensionalWeb` · zone 3×3 for 2 turns, rng 4, Slow 2; desc says "heavily slowed".
**Problems.**
- Web Shoot is physical on a race with atk 40 / int 58 while Web Snare and both Fractal damage rows (Fractal Stitch 130, Fractal Needle 170; Dimensional Fold is a swap) are magic — one damage type per race.
- Dimensional Web is a slow zone in a family whose whole point is ROOT; it overlaps the 26 slow setups in the game and does nothing for Venom Fang (root finisher) or Land Ho-style payoffs. A web that "traps subjects between dimensional layers" should hold, not slow.
- No T4: the family sets Rooted two ways today (Web Shoot, Web Snare — Dimensional Web is a Slow zone; three ways after the rewrite below) and the only payoff voidweaver owns is T1 Venom Fang (×1.5 on a 100 hit).
**Changes.**
- RECOST `raceWebLaunch` damageType physical → magic (arcane), keep 80 / rng 4 / Rooted 1. Desc: "A thread of void-silk. WEAK arcane damage and the target is Rooted for a round."
- REWRITE `raceDimensionalWeb`: zone 3×3 for 2 rounds, rng 4, 75 MP; enemies inside are Rooted 1 at the start of each of their turns (re-applied while they stand in it) instead of Slow 2. "Weave a web between dimensions. Whatever stands in it cannot leave." Burst root (Web Snare, with damage) vs persistent root (this, no damage) is a real choice.
**Additions.**
- NEW **Cocoon** — T4, damageEffect/damage, arcane/magic, 100 MP / 1 AP, rng 4, single, 170 magic, Silence 1, ×1.5 vs Rooted. "The silk closes over the mouth first. HEAVY arcane damage; a Rooted target is wrapped tight and takes half again." The family's payoff and voidweaver's damage T4 (its only other damage T4 is Fractal Needle, which needs a teammate's Stun; its other T4 is the Swarm Signal buff); with Exploit it is ×2 on a rooted victim.
**Upgrades.** Web Shoot: Long Reach (rng 5) and Lingering (Rooted 2) — do not add a "Long Web". Web Snare: Widen (5×5 root) is the area ceiling. Dimensional Web: Lingering (3 rounds). Cocoon: Exploit + Empowered. Exclude Blast/Forked on Cocoon (it is the single-target reward).

### 🕸️ Symbiosis `symbiosis` — VERDICT: KEEP (rebuild as a PHYSICAL living-suit ladder)
**Identity.** The suit fights for the host: reach-2 tendrils that feed on the hit, a web-line to close distance, and a shell that knits the host once per life — a physical assassin's sustain-through-damage family.
**Races.** symbiote only ("host bonded with an extraterrestrial parasitic organism … strength +400%, regenerative capacity") — fits; rule 2, nobody else is a host. Nothing to add.
**Now.**
- T2 Symbiote Armor `raceSymbioteArmor` · self Regen 2, 50 MP.
- T3 Symbiotic Drain `raceSymbioticDrain` · 125 MAGIC lifeDrain, rng 2, drain 40%, ×1.5 vs Poisoned.
- T4 Tendril Strike `raceTendrilStrike` · 180 physical, rng 2, Poison 2.
**Problems.**
- Symbiote is atk 70 / int 31: Symbiotic Drain (magic) is a dead row on its only owner, and it is the same row as Absorb `raceAbsorb` (Ooze T2: 130 magic lifeDrain, rng 1, drain 40%, ×1.5 vs Poison/Goo) which symbiote ALSO owns at a lower tier — summary redundancy group "damage | lifeDrain".
- Symbiote Armor (Regen 2 self, T2, 50 MP) is the same row as Mitosis `raceMitosisSplit` (Ooze T4, Regen 2 self, 100 MP) — symbiote owns both; one of them is pointless.
- No T1; the desc promises "webbing" and there is none.
**Changes.**
- REWRITE `raceSymbioticDrain`: damageType magic → PHYSICAL, 125 physical, rng 2, drain 40%, keep ×1.5 vs Poisoned. "The tendrils drink from the wound." Now the suit's drain vs the ooze's drain are different stats, different ranges and different finishers.
- PASSIVE: `raceSymbioteArmor` becomes the family passive "Symbiote Armor" (T2, 2 SP, hooks `{ healOnceBelowPct: { pct: 40, healPct: 30 } }`) — "Once per life, when the host falls under 40% HP the suit knits it back for 30% of max HP." Distinct from Regen and from Immortal Cycle (active, 50%, CD4).
**Additions.**
- NEW **Tendril Whip** `raceTendrilWhip` — T1, damageEffect/damage, poison/physical, 25 MP / 1 AP, rng 2, single, 90 physical, applies Poison 2, NO drain. "The suit lashes out two tiles. The barbs stay in." SKEPTIC: the first draft (100 physical, rng 2, drain 25%) was a second physical reach-2 lifeDrain in a family whose T3 (Symbiotic Drain, rewritten above) is exactly that row with bigger numbers — a "bigger tendril" is Empowered, not a spell (rule d). As a poison opener it is instead the family's SETUP: Whip (Poison 2) → Symbiotic Drain (×1.5 vs Poisoned, the family's only drain) → Tendril Strike (180, refreshes Poison) is a self-contained loop for symbiote. Distinct from Infectious Bite (Poison T1: rng 1, 100, Poison 3) by reach and numbers.
- NEW **Web Swing** — T2, movement/teleport, 50 MP / 1 AP, rng 4, needs line of sight: fling a line of webbing and swing to any free tile within 4. "The line goes out, the host goes after it." Symbiote's only mobility today is Icky Surprise (ooze tiles only); an assassin needs a clean close/escape and the family desc promised webbing.
**Upgrades.** Tendril Whip: Lingering (Poison 3) + Long Reach (rng 3). Symbiotic Drain: Empowered, Long Reach (rng 3), Exploit (×2 vs Poisoned). Tendril Strike: Lingering (Poison 3) + Empowered — do not add a bigger tendril. Web Swing: Long Reach.

### 🫧 Ooze Biology `ooze` — VERDICT: KEEP (Mitosis must split; Splash comes home)
**Identity.** Paint the floor black and punish anyone standing on it: goo (heals halved, −1 MOV, magic ×1.25), ooze terrain, teleports through ooze, drains on gooed targets, and a body that divides — the terrain-control specialist family.
**Races.** black goo (Oozing passive: contact goo + trails ooze) is the model owner; symbiote ("same biological class as BLACK GOO") fits. Nothing else in races.md is an ooze — keep at two.
**Now.**
- T1 Goo Shot `raceGooShot` · 90 magic, rng 4, Goo 2 first, paints the tile ooze 3 rounds.
- T1 Ooze Trail `raceOozeTrail` · terrain: 1 tile swamp (spreads downhill), rng 4, Slow 1.
- T2 Absorb `raceAbsorb` · 130 magic lifeDrain, rng 1, drain 40%, ×1.5 vs Poison/Goo.
- T2 Icky Surprise `raceIckySurprise` · teleport to any ooze tile within 6, no LOS.
- T3 Toxic Nova `raceToxicNova` · 125 magic self 5×5, Poison 3, 2 AP.
- T4 Mitosis `raceMitosisSplit` · self Regen 2, 100 MP.
**Problems.**
- Mitosis is a 100 MP Regen 2 — identical to Symbiote Armor (T2, 50 MP), worthless at T4, and the name / family desc ("absorbing and splitting") promise a split that does not happen.
- Splash `raceSplash` (Poison T3: 60 magic self 3×3, Goo 2, paints the whole 3×3 ooze 3 rounds) is pure ooze — "Burst outward … turns to ooze" — sitting in the Poison family that 12 races own. Bee queen's rung 3 is Splash: a bee bursting into black ooze is the yeti test failing.
- Goo has exactly one payoff in the game (Absorb) and it is melee; Toxic Nova (5×5 Poison 3, 2 AP) is the family's only area and it is on scale (T3 area ~125) — fine as is.
**Changes.**
- REWRITE `raceMitosisSplit`: T4 deploy/summonUnit, poison, 100 MP / 1 AP, rng 1, single tile, `maxActivePerCaster: 1`, `summonDef: { key: 'blob', name: 'Blob', move: 3, dmg: 70, hits: 4, armored: true }` — a hits-to-kill body on the engine's pet model (compare Summon Creation T2: dmg 90 / 4 hits / armored; Blob is slower and softer-hitting but a T4 body that survives four hits). "Two of it now. Containment will want to know." SKEPTIC: the first draft (caster pays 20% current HP; Blob = 40% of caster's max HP with the caster's ATK/DEF/MDEF, Oozing passive, 3-round expiry) used fields that exist nowhere in data.js or battle.js — there is no hpCost hook and the summon model has no HP/DEF/expiry/passive slots. The one thing that makes this an OOZE body — the tile it stands on turning to ooze — needs a new `summonDef.trailTerrain: { type: 'ooze', rounds: 3 }` hook: list as engine work. Until it lands, Mitosis is still a real T4 (a second body for Icky Surprise to reach and Absorb to feed beside), which the Regen 2 row never was.
- MOVE `raceSplash` → `ooze` (black goo's rung 3 alt stays legal). Bee queen RACE_TREE rung 3 → the new `raceBrood` (insectoid). Poison Abilities loses its only T3 — that family's slice should replace it with a real poison T3 rather than keep a black-goo spell.
**Additions.** None — with Splash home the ladder is T1 ×2 / T2 ×2 / T3 ×2 / T4 and every rung has a distinct job (goo + paint, terrain, drain, teleport, big area, split).
**Upgrades.** Goo Shot: Blast (3×3 goo) and Long Reach — the family's ranged area goo is that upgrade, not a new spell. Absorb: Exploit (×2 vs gooed) is the payoff ceiling. Toxic Nova: Widen is pointless (already 5×5); Lingering (Poison 4). Mitosis: Surplus (+1 blob). Family-scoped upgrade worth creating: "Sticky" (1 SP, families: ['ooze'], on `raceOozeTrail`: patch `{ statusEffects: [{ id: 'goo', duration: 1 }] }`) so the trail also goos what wades through it.

### 🪼 Jellyfish `jellyfish` — VERDICT: KEEP (retune every number, take Ocean Current in, make Wet pay)
**Identity.** The drifting sovereign: a control caster that soaks the field, stings what is soaked, roots what gets close, drifts away and grows back — Wet is its currency, and it hands lightning / ice teammates a ×1.5 / flash-frozen (Stun 1) board via the engine's soak combo layer.
**Races.** jellyfish only — fits by definition; rule 2. Nothing to add.
**Now.**
- T1 Sting `raceJellySting` · 80 magic, rng 2, Poison 2.
- T2 Bloom `raceJellyBloom` · 70 magic 3×3, rng 3, Wet 2.
- T3 Nematocyst Net `raceJellyNet` · 95 magic, rng 3, Rooted 2.
- T4 Immortal Cycle `raceJellyRebirth` · self heal 50% + cleanse 2, CD 4.
- (in Deep Sea today) T2 Ocean Current `raceJellyDrift` · teleport within 3; desc "the bell folds, the water carries it".
**Problems.**
- Sting is strictly worse than Infectious Bite `raceInfectiousBite` (Poison family, which jellyfish owns: 100 physical + Poison 3) except for range 2 — and it is a magic row, so it should win on this race, not lose.
- Bloom 70 area at T2 (house T2 area ~100) and Net 95 single at T3 (house ~125–135) are both a full tier under-tuned; the statuses do not justify it because no SPELL pays off Wet (synergy.md: wet PAYOFF(0) NONE — its only value is the engine combo layer: lightning ×1.5, frost flash-freezes to Stun 1, fire ×0.75, immune to Burn, all of which need a teammate) and Rooted has no payoff in the jellyfish pool.
- Ocean Current has a jellyfish id, a jellyfish desc and sits in the 8-race Deep Sea family beside Deep Dive (also T2, also 3 tiles) — the same rung twice in one family.
**Changes.**
- REWRITE `raceJellySting`: 90 water magic, rng 2, Poison 2, finisher ×1.5 vs WET. "A tentacle brushes past. The venom runs faster through soaked skin." Bloom → Sting is now a self-contained loop; standing in water counts as Wet, so it also pays off the Water family's floods. SKEPTIC: today the finisher resolver reads the Wet STATUS only — the burn-immunity check (battle.js ~7715) is what consults `_unitIsSoaked`; the water-tile half of this claim needs the `bonusVsStatus` check to call `_unitIsSoaked(target)` when the key is `wet` (one-line engine change, shared with Depth Charge below).
- RECOST `raceJellyBloom` dmg 70 → 100 (T2 area scale), keep 3×3 / rng 3 / Wet 2.
- RECOST `raceJellyNet` dmg 95 → 125 (T3 scale), keep rng 3 / Rooted 2.
- MOVE `raceJellyDrift` → `jellyfish` (jellyfish rung 2 alt stays legal; Deep Sea keeps Deep Dive as its one T2 movement).
**Additions.** None — T1 / T2 / T2 / T3 / T4 with setup (Bloom), payoff (Sting), control (Net), mobility (Current) and sustain (Cycle) is a complete kit.
**Upgrades.** Bloom: Widen (5×5 Wet) is the family's board-soak — do not add a bigger bloom; Lingering (Wet 3). Sting: Exploit (×2 vs Wet) + Ricochet. Net: Lingering (Rooted 3). Immortal Cycle: Efficient. Ocean Current: Long Reach.

### 🦑 Tentacle Appendages `tentacleappendages` — VERDICT: RENAME → "Cephalopod Anatomy" + GROW (3 rungs; Ink Cloud moves in)
**Identity.** The kraken's arms and ink: pull, hold, thrash, blind — a slow support controller's ladder that feeds its Water / Wind T4s (Vortex Slam, Tidal Slam, Call of the Deep) by dragging enemies into place.
**Races.** kraken only ("Cephalopod entity … biochemical discharge that disrupts electronic sensors" = ink) — fits; rule 2. No other cephalopod in races.md. The rename is because Ink Cloud (below) is not a tentacle, and it parallels Insectoid / Deep Sea "Anatomy".
**Now.**
- T1 Tentacle Lash `raceTentacleLash` · 80 PHYSICAL, rng 3, pull 2 (kraken is atk 40 / int 69).
- (in Deep Sea today) T2 Ink Cloud `raceInkCloud` · zone 3×3 for 2 turns, rng 4, Discord 2 (ATK −2 / DEF −1).
**Problems.**
- One-spell family; the one spell is physical on a caster-statted support and is the same row as Harvest Hook (scarecrow T1, 80 pull 4).
- Ink Cloud sits in Deep Sea Anatomy where mermaid, sharkman, nessie, starfish, jellyfish and deep sea fish all "spray ink" — only a cephalopod does. It is kraken's rung 2; it belongs on kraken's own family.
- Kraken's pool has no Rooted payoff and no buff (summary: kraken missing buff) — it needs a control loop of its own.
**Changes.**
- FAMILY_RENAME `tentacleappendages` "Tentacle Appendages" → "Cephalopod Anatomy" (glyph 🦑 stays).
- RECOST `raceTentacleLash` damageType physical → magic (water), keep 80 / rng 3 / pull 2. "An arm from below the surface. WEAK water damage and the target is dragged two tiles toward you."
- MOVE `raceInkCloud` → `tentacleappendages` (kraken rung 2 stays legal). Deep sea fish RACE_TREE rung 2 (`raceInkCloud`) → `raceDeepDive`; an anglerfish that dives fits its "lure, blind and bite" lore better than ink.
**Additions.**
- NEW **Constrict** — T2, effect/debuff, water, 50 MP / 1 AP, rng 2, single: Rooted 2 and DEF −1 stage. "Two arms, then four. It is not going anywhere." The hold between the pull (T1) and the beating (T3); also sets up Venom Fang / Land Ho / Precision Shot teammates.
- NEW **Eightfold Lash** `raceEightfoldLash` — T3, damage/multiHit, water/magic, 75 MP / 1 AP, rng 2, single, `hitDamages: [32,32,32,32]` (128 nominal, the T3 single median is 125), ×1.5 vs Rooted (192 on its own Constrict). SKEPTIC: trimmed from 4 × 35 = 140 — that beat Team Strike (T3, 5 × 27 = 135, 2 AP, no finisher) at 1 AP before the finisher, in a family that has no T4 to sit above it. "All of them at once." The family's payoff on its own Constrict; the multi-hit shape is the one thing a kraken should have that nobody else does.
- No T4 on purpose: kraken already carries six T4s (Vortex Slam, Call of the Deep, Great Flood, Tidal Slam, Tsunami, Poseidon's Wrath); this family is the T1–T3 control ladder that makes those land.
**Upgrades.** Tentacle Lash: Undertow (pull 3) and Long Reach — that is the "long tentacle"; do not add one. Constrict: Lingering (Rooted 3). Eightfold Lash: Exploit + Empowered; exclude Ricochet / Forked / Blast on multiHit. Ink Cloud: Widen (5×5 discord) + Lingering.

### 🌊 Deep Sea Anatomy `deepsea` — VERDICT: KEEP (the shared aquatic body: soak, dive, punish the water)
**Identity.** What every sea creature has in common: it is at home in water and its enemies are not — a T1 soak, a dive that resurfaces protected, a blast that hits soaked targets harder, and the T4 that drowns everyone standing in water. Pairs with the Water family's floods and with lightning / ice teammates.
**Races.** mermaid, kraken, loch ness monster, jellyfish, starfish, deep sea fish, sharkman all fit (aquatic bodies; six of the seven carry water resist / lightning weak — jellyfish is the only one with no affinity). RACE_REMOVE kaiju: nothing in its lore is aquatic ("bipedal organism … hybrid biological-technological anatomy … directed-energy discharge"); it has no ink, no drift, no gills — the yeti test. SKEPTIC: as written this left kaiju on TWO families (Kaiju Rampage + Earth), below the 3-family floor. Paired fix — RACE_ADD kaiju → `titan` (Giant Abilities: Fee Fi Fo Fum, Titan Drop, Colossal Crush, Giant Smash — all physical stomps/drops on an atk 100 bruiser, and the one family whose theme IS the lore line "organism of unprecedented scale, est. 8–12m height"; giant / cyclops / nephilim / juggernaut are its current owners). Kaiju's four RACE_TREE rungs all sit in Kaiju Rampage, so nothing else moves; the Giant slice should note the new owner. RACE_ADD atlantean: "recovered from submerged ruins at depth 4,200m", water resist, and summary.md lists atlantean as missing movement — Deep Dive is exactly that.
**Now.**
- T2 Deep Dive `raceDeepDive` · teleport 3, Protect 1 on emerging, CD 2.
- T2 Ink Cloud `raceInkCloud` · zone 3×3 Discord 2 (→ moving to Cephalopod Anatomy).
- T2 Ocean Current `raceJellyDrift` · teleport 3 (→ moving to Jellyfish).
- T3 Depth Charge `raceDepthCharge` · 125 PHYSICAL 3×3, rng 4, ×1.5 vs Discord.
- T4 Poseidon's Wrath `racePoseidonsWrath` · 170 magic to every enemy standing in water anywhere, 2 AP, 75 MP.
**Problems.**
- Three T2s and two of them are the same rung (Deep Dive and Ocean Current both move 3 tiles); no T1.
- Ink Cloud fails the yeti test on every owner but kraken (seven of eight, kaiju included; see Cephalopod Anatomy).
- Depth Charge's Discord finisher is set up only by Ink Cloud inside the family; with Ink Cloud gone, starfish, jellyfish and deep sea fish have no Discord source at all (synergy.md per-race lines) — and the row is physical, dead on mermaid (atk 8), starfish (26), jellyfish (18), kraken (40).
- Poseidon's Wrath is off the MP ladder (75 at T4; summary "MP cost vs tier").
- The family's real mechanic — water tiles — is only referenced by the T4; Wet (which standing in water applies, battle.js `_soakUnit` / `_unitIsSoaked`) has no spell finisher anywhere in the game (synergy.md: wet PAYOFF(0)) — only the engine combo layer (lightning ×1.5, frost flash-freeze = Stun 1, fire ×0.75, immune to Burn) rewards it, and none of that is in this family.
**Changes.**
- MOVE `raceInkCloud` → `tentacleappendages`; MOVE `raceJellyDrift` → `jellyfish` (both above).
- REWRITE `raceDepthCharge`: 125 physical 3×3, rng 4, finisher ×1.5 vs WET instead of Discord. "It goes off under the surface. Anything soaked — or standing in the water — takes the shock through its body." Every owner can now set it up (Spout, Bloom, any flood, any water tile — the water-tile case needs the same `bonusVsStatus` → `_unitIsSoaked` engine line noted under Sting); it stays the bruiser rung (sharkman 92, deep sea fish 84, nessie 54) while Poseidon's Wrath is the caster rung.
- RECOST `racePoseidonsWrath` 75 MP → 100 MP (T4 ladder), keep 170 / 2 AP / water-only.
- RACE_REMOVE kaiju (with RACE_ADD kaiju → `titan`, so it stays at 3 families); RACE_ADD atlantean.
**Additions.**
- NEW **Spout** — T1, damageEffect/damage, water/magic, 25 MP / 1 AP, rng 3, single, 80 water magic, Wet 2. "A jet of seawater from the gills. WEAK water damage and the target is soaked through." The family's setup: feeds Depth Charge and Sting inside the sea, and hands Thunderbolt / Ice Shard teammates ×1.5 lightning and flash-frozen (Stun 1) targets via the engine's soak combo layer — the team-building hook for a whole "wet board" strategy.
- PASSIVE: new family passive **Deep Adapted** — T1, 1 SP, hooks `{ terrainBonus: { water: { defStages: 1, spdStages: 1 }, deep_water: { defStages: 1, spdStages: 1 } } }`. "Built for pressure: +1 DEF stage and +1 SPD stage while standing in water." Makes the Water family's floods a home-field advantage for these races instead of a hazard for everyone.
**Upgrades.** Spout: Blast (3×3 soak) and Long Reach — the area soak is the upgrade, not a spell (jellyfish has Bloom for that). Depth Charge: Exploit (×2 vs Wet) + Widen. Deep Dive: Lingering (Protect 2), Efficient. Poseidon's Wrath: Empowered, Efficient; exclude Widen / Blast (it is already everywhere). Family-scoped upgrade worth creating: "Undertow Charge" (1 SP, families: ['deepsea'], on `raceDepthCharge`: patch `{ pullToCenter: true }` — the top-level flag Whirlpool `raceRiptide` already carries; the engine reads it on the aoePull kind, so the patch must also be honoured on damage/aoe or set `kind: 'aoePull'` — one-line engine check) — the blast drags the 3×3 into the water it just hit.

SPELL COUNT: 27 → 36 for this group (8 new rows: Brood, Cocoon, Tendril Whip, Web Swing, Constrict, Eightfold Lash, Spout, Deep Adapted; +1 moved in from Poison: Splash; Ink Cloud and Ocean Current move within the group; 0 deleted). RACE CHANGES after skeptic pass: deepsea −kaiju +atlantean; kaiju +titan (cross-slice, keeps it at 3 families); insectoid unchanged (mothman add struck). ENGINE WORK flagged, not assumed: `summonDef.hitStatus` (Brood poison bite), `summonDef.trailTerrain` (Mitosis ooze trail), `bonusVsStatus` reading `_unitIsSoaked` for `wet` (Sting / Depth Charge water-tile finisher), `pullToCenter` honoured on damage/aoe (Undertow Charge).


---

## F.g7 Families — grit, teamwork, athleticism, martial arts, ki, swords, dirty fighting, piracy, D.O.O.R., football

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


---

## F.g8 Families — guns, marksmanship, archery, hunting, cowboy, police, street, thievery, military, politics, deep state, conspiracy, spy

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


---

## F.g9 Families — psychic, seduction, stage, trickery, fae, main character, superhero, sentai, the empty registries, gear, training

### 🔮 Psychic Abilities `psychic` — VERDICT: KEEP (re-shaped)
**Identity.** The mind-caster's control kit: telekinetic displacement (shove, drag, warp), Discord/Silence setups and the two heavy psychic payoffs — the debuff-and-punish family for units that fight from the back with M.ATK.
**Races.** telepath ("sustained telepathic contact, psychokinetic barrier projection" — the core race), grey ("Psionic capability rating: EXTREME"), mantid ("telepathic communication with Grey species"), dreameater ("psionic parasite"), occulus ("pupil emits focused psychic energy") all fit. chosen one: no psionics in its lore, but the Chosen-One archetype (Neo, Skywalker) IS mind-over-matter; keep, and move its T4 rung to the new Main Character T4 below so its psychic rows stop being its capstone. professor: "four doctorates in fields the university does not list" is thin, but the psychic professor is the obvious reading (Telepathic Link = the lecture); keep. Nobody missing.
**Now.**
- T1 Kinetic Hurl `kineticHurl` · 100 psychic magic, rng 3, shoves sideways (collisionBonus 64).
- T1 Psychic Beam `racePsychicBeam` · 100 magic line rng 5, Discord 1 (−2 ATK/−1 DEF).
- T1 Telepathic Link `raceTelepathicLink` · aura r3, allies M.ATK +1 stage.
- T2 Psychic Barrier `racePsychicBarrier` · ally shield 150, rng 3.
- T2 Psychosis `psychosis` · single M.DEF −1 stage, rng 4.
- T3 Teleport `teleport` · warp ANY unit to an empty tile within 4.
- T4 Migraine `raceMindCrush` · 180 psychic magic single rng 4, M.ATK −1, finisher Discord ×1.5.
- T4 Mind Shatter `mindShatter` · 180 psychic magic single rng 3, Silence 1, finisher Silence ×1.5.
**Problems.** Psychic Beam is on the over-tuned-T1 list (synergy: "Psychic Beam psychic line 100 ... discord") — 100 down a 5-tile line PLUS a Discord for 25 MP; Entropic Beam (T1, 100 line rng 4, DEF −1 AND a Slow finisher ×1.5 — on the same over-tuned list) and Sonic Boomerang (T1, 80 line rng 4, no rider, but it hits every enemy in the line twice — out and back) are the comparables. Migraine and Mind Shatter are the same row twice (T4 · 180 · single · psychic magic · a status finisher), and the family has no area damage at all. Psychosis (one stat −1 for 50 MP) is the Steal-from-the-Rich filler pattern and sets up nothing. Psychic Barrier's 150 single shield sits above Pupil Shield (T1, 130) and Luminous Shield (T2, 140) — both are `aoeRadius: 0`, one tile, so effectively single-ally too — but well under Light Shield (T2, 220 shield AND DEF +1 for the same 50 MP). Teleport's text still says "Costs 1 less MP for Psychics" — jobs are gone (the live discount is the Third Eye row's `teleportMpDiscount` hook). T3 holds only Teleport.
**Changes.**
- RECOST `racePsychicBeam` dmg 100 → 80, rng 5 → 4 (keep Discord 1, T1 25 MP): one 80 pass with a rider is the T1 line weight (Sonic Boomerang's 80 buys a second pass instead of a rider; Entropic Beam's 100 + DEF −1 + Slow finisher is the other over-tuned T1 line and should come down the same way).
- REWRITE `psychosis`: T2 50 MP 1 AP, rng 4, single — Discord 2 AND M.DEF −1 stage. "Two voices, then four, then all of them." Now the in-family setup for Migraine (Discord ×1.5); Brainwash (T3, Discord 2, deepstate) and Discordance (T1, Discord 2, sonic) show the T2 is the right rung for Discord-plus-a-stat.
- RECOST `racePsychicBarrier` shield 150 → 200 (Light Shield, the other T2 shield row, gives 220 + DEF +1 for the same 50 MP; a plain shield at 150 is the worst T2 shield buy).
- REWRITE `mindShatter`: T4 100 MP 1 AP, rng 3, aoe r1 (3×3), 160 psychic magic to all enemies, Silence 1 on each; keep finisher Silence ×1.5. The family's area nuke; Reality Pulse (T4, 170 aoe r1 + Discord, 1 AP) is the comparable. Migraine stays the single-target T4.
- REWRITE `teleport` desc only: drop "Costs 1 less MP for Psychics" → "Third Eye trims its cost." (row unchanged).
- RACE_SWAP chosen one tree rung 4 `raceMindCrush` → `raceRollCredits` (Main Character, below).
**Additions.**
- NEW **Telekinetic Slam** `raceTelekineticSlam` — T3, damage/pull, psychic/magic, 75 MP 1 AP, rng 4, single, 125 dmg, pullDistance 3, groundsFlyers. "Grab them with your mind and drag them the whole way — through whatever is between you. Flyers come down first." The family's telekinesis had a shove (Kinetic Hurl) and a warp (Teleport) but no drag; a 125-damage pull at T3 is a real hit and a positioning tool (drag into Fae Ring, Cold Spot, Rampart, a melee ally). Harvest Hook (T1, 80, pull) and Siren Song (T1, pull 3, no dmg) are the lower rungs elsewhere.
**Upgrades.** Migraine: Empowered, Exploit (Discord → ×2), Forked. Kinetic Hurl: Knockback (+1 shove). Telekinetic Slam: Undertow (+1 pull), Long Reach. Mind Shatter: Widen is the family's 5×5 — do not add a separate spell for it; Lingering (+1 Silence round). Psychosis: Lingering, Long Reach. Psychic Beam should NOT take Empowered until it is re-costed as above.

### 💋 Seduction `seduction` — VERDICT: KEEP (chain fixed)
**Identity.** Charm-and-cash-in: one setup (Charm, a hard CC) and three payoffs that drain, possess or nuke a charmed target — the family for support units who win by turning the enemy's own bodies against them.
**Races.** succubus ("extreme psychic persuasion", the core), siren (the lure), barbarella ("irresistible charisma… HONEY TRAP RISK"), popstar ("Several have been charmed trying"), bunny girl ("keep a whole squad moving on charm alone") fit. catgirl: "playful demeanor that belies lethal close-quarters combat" — the flirt-then-claw archetype; Love Bite is its rung 1; keep. ~~ADD vampire~~ — STRUCK (skeptic): vampire's lore line is a hemoglobin predator with an "enhanced sensory array" — no mesmerism, no persuasion; the only link is the blood element on Love Bite, which is the yeti/Christmas failure. The stated motive ("vampire has no debuff") is gap-filling, not character. Mechanically Soul Suck / Draining Embrace are M.ATK drains on a 31-INT assassin — two of five rows dead on arrival. Vampire keeps its 3 families.
**Now.**
- T1 Love Bite `raceLoveBite` · 80 blood physical rng 1, DEF −1.
- T1 Soul Suck `raceSoulSuck` · 100 magic rng 2, Charm 1, drains 60%.
- T2 Charm `raceCharm` · Charm 1, rng 3.
- T3 Enthrall `raceEnthrall` · Possessed 2 (you run its next activation; two if Charmed), rng 2, no CD.
- T4 Draining Embrace `raceDrainingEmbrace` · 180 magic rng 1, 2 AP, drains 60%, finisher Charm ×1.5.
**Problems.** Soul Suck (T1, 25 MP) applies the same Charm 1 as Charm (T2, 50 MP) and ALSO deals 100 and heals 60% of it — the T2 row is strictly dominated by the T1 row. Enthrall has no cooldown while both pure possess rows do (Possession CD3, Indoctrinate CD3; Thrall Bite has none either, but it is an 80-damage melee hit that only possesses if the victim survives). Draining Embrace pays 2 AP at melee range for 180 single — Migraine is 180 at rng 4 for 1 AP; on support-class casters (succubus, siren, popstar, bunny girl) a rng-1 2-AP nuke is dead weight. Love Bite is 80 where the T1 hit-plus-DEF −1 rows (Synthetic Blade, Valkyrie Spear) are 100.
**Changes.**
- RECOST `raceLoveBite` dmg 80 → 100.
- REWRITE `raceSoulSuck`: drop the Charm status; 100 magic rng 2, drainPct 0.5, finisher Charm ×1.5. "Kiss them and take what they came with." The T1 payoff of the chain instead of a second setup.
- REWRITE `raceCharm`: T2 50 MP 1 AP CD2, rng 3 — Charm 2 rounds. Same weight as The Kool-Aid (T2, Charm 2, CD2); it is now the family's one setup and worth its slot.
- RECOST `raceEnthrall` add CD3 (parity with Possession / Indoctrinate).
- RECOST `raceDrainingEmbrace` apCost 2 → 1, rng 1 → 2 (keep 180, drain 0.6, finisher Charm ×1.5).
- ~~RACE_ADD vampire~~ — struck, see Races.
**Additions.** None — T1 hit / T1 drain / T2 setup / T3 possess / T4 payoff is a complete ladder with a real internal chain (Charm → Soul Suck, Enthrall, Draining Embrace).
**Upgrades.** Draining Embrace and Soul Suck: Exploit (Charm ×2) and Empowered. Charm: Lingering (+1 round) and Long Reach. Enthrall: Long Reach. Love Bite: Blast is its 3×3 — do not add an area row. Draining Embrace should NOT take Forked (the drain would heal off two bodies).

### 👩‍🎤 Stage Presence `stagepresence` — VERDICT: KEEP (Space Disco re-shaped)
**Identity.** Playing to the crowd: stagger the front row, drag the house toward the stage, put one enemy under the lights, then the pyro — the showman's control-and-burst family, with Stagger as its house status.
**Races.** popstar (the core), ringmaster ("a voice that fills a stadium"), clown (a performer), luchador ("play to a crowd whether or not there is one") fit. **bunny girl** does not: she works a casino floor and "reads a table faster than the dealer" — that is the empty Gambling family, not a stage; RACE_SWAP bunny girl stagepresence → gambling (her rungs move with it, see Gambling). Nobody else belongs.
**Now.**
- T1 Mic Drop `racePopMicDrop` · 80 sonic magic rng 2, Stagger 1.
- T2 Stage Dive `racePopStageDive` · 90 sonic physical tackle rng 3, carries 2 tiles, +30 and Stagger on a crash.
- T3 Spotlight `racePopSpotlight` · DEF −1 and M.DEF −1, rng 3, CD2.
- T4 Space Disco `raceSpaceDisco` · 160 magic self-aoe r2, Discord 1, finisher Stun ×1.5, **75 MP** (off-ladder), CD2.
- T4 Stadium Show `racePopStadiumShow` · 130 sonic magic aoe r2 (5×5) rng 3, Charm 1, CD4.
**Problems.** Space Disco is nobody's rung, costs T3 MP at T4, and is the same row as Requiem (T4 self-aoe r4, 160, Discord 2, finisher Discord, CD2 — a bigger radius and a longer Discord for the ladder price) which popstar already carries in Sonic; its Stun finisher has no setup anywhere in the family. Two T4s, no T3 damage. Stadium Show at 130 is under the T4 area scale (~160) and CD4 is the longest cooldown in the game for a 130 hit. Spotlight is −1/−1 for 75 MP where Hypnotic Pulse (T3) is a Stun. Stage Dive's 90 is short of the T2 single scale.
**Changes.**
- RENAME + RETIER + REWRITE `raceSpaceDisco` "Space Disco" → "Crowd Surge": T3 75 MP 1 AP, no CD, damageEffect/aoePull, sonic/magic, self-aoe r2, 110 dmg, pullToCenter (every enemy within 2 is dragged 1 tile toward the caster), Stagger 1. "The crowd rushes the stage, and the stage is you." Drops the Discord and the Stun finisher. Gravity Well (T1, 80 aoePull + Slow) is the lower rung of the pattern; this is the family's third Stagger source.
- RECOST `racePopStageDive` dmg 90 → 100.
- REWRITE `racePopSpotlight`: T3 75 MP 1 AP CD2, rng 3 — DEF −1, M.DEF −1 AND Marked 2 ("the next hit against this unit consumes the mark for bonus damage"). Every eye in the house on them: the team's focus-fire call, and Marked finally does something for a showman's squad.
- RECOST `racePopStadiumShow` dmg 130 → 150, CD4 → CD3, add finisher Stagger ×1.5 (keep Charm 1). The pyro lands hardest on the ones still reeling from Mic Drop / Crowd Surge — the family's own setup→payoff.
- RACE_SWAP bunny girl → gambling (see below).
**Additions.** None: T1 Mic Drop / T2 Stage Dive / T3 Spotlight + Crowd Surge / T4 Stadium Show is the ladder.
**Upgrades.** Stadium Show already IS the 5×5 — no Widen. Crowd Surge: Undertow (+1 pull), Lingering. Mic Drop: Empowered, Ricochet (the mic bounces). Stage Dive: Knockback. Spotlight: Lingering, Long Reach. Family-scoped upgrade worth adding: **"Encore Performance"** (2 SP, families: [stagepresence], requires: 'cooldown' — a NEW requires key: the row has cooldown ≥ 1; the registry's existing 'cost' key only means "has an MP cost" and would offer it on Mic Drop / Stage Dive where it does nothing) — patch `{ cooldownDelta: -1 }` (new patch key, floor 0) on Spotlight (CD2 → 1) and Stadium Show (CD3 → 2); the show runs again sooner.

### 🎼 Music Theory `musictheory` — VERDICT: DELETE
**Identity.** Would be: rhythm/tempo buffs for the popstar. Sonic (element, 10 rows on popstar already: Discordance, Lullaby, Requiem, War Cry…) plus Stage Presence cover every musical idea the game has, and tempo is Teamwork's Encore and the Crescendo training row.
**Races.** popstar only (pool 20 without it).
**Now.** Empty.
**Problems.** A third sound family on one race that already has 15 sound-adjacent rows.
**Changes.**
- FAMILY_DELETE `musictheory`; RACE_REMOVE popstar from it (no rung touches it).
**Additions.** None.
**Upgrades.** n/a.

### 🎭 Acting Chops `actingchops` — VERDICT: DELETE
**Identity.** Would be: disguise, decoys, playing dead. Trickery already owns the decoy (Shed Skin), the swap (Skin Swap) and the impersonation buff (Mimicry), and this audit adds Misdirection to it; nothing an "acting" kit would do is not a Trickery row.
**Races.** None.
**Now.** Empty.
**Problems.** Total overlap with Trickery; no race names it.
**Changes.**
- FAMILY_DELETE `actingchops`.
**Additions.** None (the acting flavour lands in the Trickery additions below).
**Upgrades.** n/a.

### 🤥 Trickery `trickery` — VERDICT: GROW
**Identity.** Misdirection: blind them, hit them while they look the wrong way, leave a decoy, swap bodies, reverse the clock — the tempo-and-position family for tricksters, with Blind as its house status (Blind had two setups and ZERO payoffs game-wide; synergy.md).
**Races.** fairy (mischief), reptilian ("infiltration expertise", Shed Skin rung), skinwalker (shape-shifter; Shed Skin, Skin Swap AND Mimicry are its rungs — the core), djinn ("Do not make verbal requests within earshot" — the wish-twister), machine elves (McKenna's "self-transforming machine elves" are jesters; keep), ringmaster (showman, Skin Swap rung), clown ("never where the light was pointing", Trick Room rung), bunny girl (sleight of hand at the table; keeps this alongside Gambling), rabbit (the Wonderland rabbit, Trick Room rung) fit. **ghost**: ~~RACE_REMOVE~~ STRUCK (skeptic) — ghost holds exactly three families (Poltergeist, Shadow, Trickery); removing one leaves it at 2, under the 3-family floor. It stays; a phase-shifting haunt that "is most effective when ignored" reads as misdirection anyway (pool stays 17).
**Now.**
- T2 Shed Skin `raceShedSkin` · decoy (draws 1 attack) + cleanse 1 + teleport 2.
- T3 Skin Swap `raceSkinSwap` · swap with any unit within 4 (LOS).
- T3 Trick Room `raceTrickRoom` · turn order reversed for 3 rounds, 2 AP.
- T4 Mimicry `raceMimicry` · self ATK +2, DEF +2.
**Problems.** No T1 (summary: missing T1) and no damage row at all on a family carried by four assassins. Mimicry is a plain stat buff that mimics nothing. Skin Swap duplicates Temporal Shift (T3 swap, temporal) but rabbit is the only race with both — fine.
**Changes.**
- REWRITE `raceMimicry`: T4 100 MP 1 AP CD3 — self ATK +2, DEF +2 AND spawnDecoy (the Shed Skin decoy, draws 1 attack). "Which one is the real one? Wrong." A trick, not a Thick Hide with a bigger number.
- ~~RACE_REMOVE ghost~~ — struck (would leave ghost with 2 families).
**Additions.**
- NEW **Misdirection** `raceMisdirection` — T1, effect/debuff, 25 MP 1 AP, rng 3, single: Blind 1 (attacks miss 50%). "Look — over there." The family's cheap setup; Haunt (T1, Haunted 3) and Red Eyes (T1, Marked) are the T1-debuff comparables.
- NEW **Sucker Punch** `raceSuckerPunch` — T1, damage/damage, physical, 25 MP 1 AP, rng 1, 100 dmg, finisher Blind ×1.5. "They never saw it coming. Literally." Gives Blind its first payoff anywhere: Misdirection here, Glitter Bomb in Fae (fairy has both), Shattered Mirror in Mirror Magic (rabbit has both), Pepper Spray (police).
**Upgrades.** Sucker Punch: Exploit (Blind → ×2), Empowered, Blast. Misdirection: Lingering, Long Reach. Shed Skin / Skin Swap: Long Reach. Trick Room: Efficient. Mimicry should NOT take Lingering (stages are not statuses).

### 🧚🏻 Fae Magic `fae` — VERDICT: KEEP (trimmed)
**Identity.** Glitter and toadstools: light-element area control (DEF shred, Blind), team flight, and the ring — the support-caster family for the Fairy Forest.
**Races.** fairy (the core) and mushroom girl ("grown from the floor of the Fairy Forest… a ring of mushrooms comes up wherever they stand still" = Fae Ring) fit. **rabbit** is the Looking-Glass rabbit, not a fairy — nothing in its lore is fae; RACE_SWAP rabbit fae → mirrormagic (see Mirror Magic; rung 1 `raceSparkle` → `raceMirrorShard`). Two races is fine (mondo's rule 2). gnome (folklore fae) was considered and rejected: its lore is 200-year-ahead engineering, pool 17 already.
**Now.**
- T1 Glitterburst `raceGlitterburst` · 80 light magic aoe r1 rng 3, DEF −1.
- T1 Sparkle `raceSparkle` · ally Sparkling 2 (+1 SPD stage, sheds Blind motes).
- T2 Fairy Dust `raceFairyDust` · aura r3, allies Levitating 2 (flight).
- T2 Pixie Dust `racePixieDust` · ally +2 MOV for 2 turns.
- T3 Glitter Bomb `raceGlitterBomb` · 100 light magic aoe r1 rng 4, Blind 1.
- T4 Fae Ring `raceFaeRing` · 160 nature magic on the rim of a 5×5, rng 4, 2 AP.
**Problems.** Three ally-mobility buffs at T1–T2 (Sparkle +SPD, Fairy Dust flight, Pixie Dust +MOV) do one job three times; Pixie Dust is the weakest and the least distinct (flight already ignores terrain). Glitter Bomb at 100 is under the T3 area scale (~125) even with the Blind.
**Changes.**
- DELETE `racePixieDust` (Fairy Dust is the family's mobility buff; the status name lives on as the glitter-mote array). mushroom girl rung 2 `racePixieDust` → `raceFairyDust`; fairy rung 2 pair `[racePixieDust, raceFairyDust]` → `raceFairyDust`.
- RECOST `raceGlitterBomb` dmg 100 → 120.
- RACE_SWAP rabbit → mirrormagic.
**Additions.** None — T1 Glitterburst + Sparkle / T2 Fairy Dust / T3 Glitter Bomb / T4 Fae Ring is a full ladder with one row per job.
**Upgrades.** Glitterburst and Glitter Bomb: Widen is the family's 5×5 (Fae Ring is already 5×5-rimmed — no Widen there). Glitter Bomb: Lingering (Blind 2). Sparkle / Fairy Dust: Lingering. Fae Ring: Empowered, Long Reach. Family-scoped upgrade worth adding: **"Fairy Fire"** (1 SP, families: [fae], requires: area) — patch `{ statusAdd: { id: 'blind', duration: 1 } }` on Glitterburst so the T1 area can carry the house status too.

### 🌟 Main Character Energy `maincharacter` — VERDICT: GROW
**Identity.** Narrative power: the protagonist buffs himself into the fight, refuses to die on cue, and lands the hit that was always going to land — self-buff plus inevitable damage, with Stagger as its setup.
**Races.** swordfighter (rungs Sad Backstory / Plot Armor / To Be Continued — the shonen lead) and chosen one ("Power scales with narrative proximity to destiny moments") fit. sidekick is explicitly not the main character; antihero has 23 rows. No additions.
**Now.**
- T1 Dark Feather `raceDarkFeather` · 100 physical dash rng 3, **2 AP**, Poison 3.
- T1 Sad Backstory `raceSadBackstory` · self ATK +1.
- T2 Plot Armor `racePlotArmor` · self DEF +1.
- T3 Prophecy Fulfilled `raceProphecyFulfilled` · self Overclock 1, **2 AP**.
- T3 To Be Continued `raceToBeContinued` · 135 metal physical rng 3, delayed mark — lands at end of round.
**Problems.** Two 2-AP rows (synergy 2AP list: Dark Feather at T1, Prophecy Fulfilled at T3) for a 100 hit and an Overclock 1 — Black Budget gives the same Overclock for 1 AP at T2. Poison on "Dark Feather" is identity drift (the row is a chosen-one dash, not a toxin). Plot Armor is the fifth DEF +1 clone (Thick Hide, Iron Bulwark, Stone Skin, Chitin Armor). No T4 (summary). To Be Continued's text says the hit only lands "while your team can still see them" but the row has `requireVision: false`.
**Changes.**
- REWRITE `raceDarkFeather`: T1 25 MP **1 AP**, dash, 100 physical, rng 3, Stagger 1; no Poison. "One black feather falls. Then he is already there." Ram Charge (T1, dash 100 + Stagger) is the twin; Stagger is the setup for Roll Credits below.
- REWRITE `racePlotArmor`: T2 50 MP 1 AP CD3 — self Indomitable 1 ("the next killing blow leaves this unit at 1 HP"). That is what plot armor IS; Indomitable Will (T4, 3 rounds, humangrit) is the bigger version.
- REWRITE `raceProphecyFulfilled`: T3 75 MP **1 AP** CD2 — self Overclock 2 rounds and cleanse every debuff. "It was written. Everything written before it is struck out."
- REWRITE `raceToBeContinued` row: set `requireVision: true` so the row matches its text ("only while your team can still see them"); desc unchanged.
**Additions.**
- NEW **Roll Credits** `raceRollCredits` — T4, damage/damage, physical, 100 MP 1 AP, rng 2, single, 180 dmg, finisher Stagger ×1.5. "This is the part where it ends." The capstone the family never had, paid off by its own Dark Feather (Stagger) and by Mic Drop / Ram Charge / Yellow Thunder on allies (Body Check is a Stagger PAYOFF — finisher ×1.5 — not a setup); Weigh the Heart (T4, 180, finisher Stagger) is the caster-side twin. Becomes chosen one's rung 4 (was `raceMindCrush`) and swordfighter keeps `raceBlessedBlade`.
**Upgrades.** Roll Credits: Exploit (Stagger → ×2), Empowered, Forked. Dark Feather: Knockback, Long Reach. Plot Armor / Prophecy Fulfilled: Lingering. To Be Continued: Empowered, Long Reach — NOT Blast (a delayed splash reads badly).

### 🦸🏻‍♂️ Superhero Powers `superheropowers` — VERDICT: KEEP
**Identity.** The comic-book power set: leap in, freeze breath, invulnerability, the thunderclap, heat vision — one of each, physical up front and beams behind.
**Races.** superhero (the core), antihero ("alien-derived augmentations", Invulnerable rung), sidekick (the hand-me-down cape, Heroic Leap rung) all fit. Nobody missing (super sentai has its own family; chosen one is a prophecy, not a cape).
**Now.**
- T1 Heroic Leap `raceHeroicLeap` · 100 physical rng 3, charges into melee.
- T2 Freeze Breath `raceFreezeBreath` · 40 ice magic 2-tile line, Frozen 1.
- T2 Invulnerable `raceInvulnerable` · self Protect 2, **2 AP**, CD2.
- T3 Shockwave Clap `raceShockwaveClap` · 125 sonic physical line rng 4, push 2.
- T4 Heat Vision `raceLaserBeam` · 160 magic line rng 3, Burn 1, finisher Burn ×1.5.
**Problems.** Invulnerable pays 2 AP for exactly what Black Guard (sentai, T2, Protect 2, CD2) does for 1 AP. Freeze Breath's 40 is the lowest damage number in the T2 book — Frozen justifies a discount, not a 60% one. Otherwise clean: five rows, five jobs, all tiers.
**Changes.**
- RECOST `raceInvulnerable` apCost 2 → 1 (50 MP, CD2 stay).
- RECOST `raceFreezeBreath` dmg 40 → 60.
**Additions.** None.
**Upgrades.** Heat Vision: Empowered, Exploit (Burn → ×2), Long Reach. Shockwave Clap: Knockback (+1 push). Freeze Breath: Lingering (Frozen 2) — flag it: two rounds of "cannot act" for 1 SP is the strongest Lingering in the game; consider excluding Freeze Breath from Lingering (`upgrades: ['upReach','upDamage']`). Heroic Leap: Empowered, Blast.

### 🌈 Sentai Colors `sentai` — VERDICT: KEEP (re-tiered)
**Identity.** "One color, one move": five rangers, five rows, one Megazord — a self-contained mini-kit that covers hit, guard, line, heal, area and the finisher.
**Races.** super sentai only, by design (rule 2). Nobody else may have it.
**Now.**
- T1 Red Slash `sentaiRedSlash` · 100 fire physical rng 1, Burn 1.
- T2 Black Guard `sentaiBlackGuard` · self Protect 2, CD2.
- T2 Blue Wave `sentaiBlueWave` · **120** magic line rng 4, Slow 1.
- T2 Pink Healing `sentaiPinkHeal` · heal 140 single, rng 4.
- T2 Yellow Thunder `sentaiYellowThunder` · 80 lightning magic aoe r1 rng 3, Stagger 1.
- T4 Megazord Blast `sentaiMegazordBlast` · 180 magic aoe r1 rng 4, 2 AP, finisher Burn ×1.5.
**Problems.** Four T2s and no T3 (summary: missing T3). Blue Wave is on the tier-offender list (120 with a rider below T3). Pink Healing at T2/50 MP heals exactly what Divine Light heals at T1/25 MP. Yellow Thunder's 80 is the T1 area number. The Megazord's Burn finisher is fed by Red Slash — good, keep.
**Changes.**
- RETIER `sentaiPinkHeal` T2 → T1 (25 MP), heal 140.
- RETIER `sentaiBlueWave` T2 → T3 (75 MP), dmg 120 → 125, keep Slow 1.
- RECOST `sentaiYellowThunder` dmg 80 → 100.
- RACE tree rung 2 `sentaiPinkHeal` → `sentaiBlackGuard` (a tank's rung 2 is its guard; Pink stays in the pool at T1).
**Additions.** None — six rows is the concept.
**Upgrades.** Megazord Blast: Widen (the 5×5), Exploit. Blue Wave: Empowered, Long Reach. Yellow Thunder: Lingering. Pink Healing: Efficient, Long Reach. Red Slash: Blast.

### 🎰 Gambling `gambling` — VERDICT: GROW (new kit)
**Identity.** Risk and payout: cards as weapons, a marked mark, doubling down on yourself, and the jackpot — a physical damage-and-focus family for humans who live at the table.
**Races.** **bunny girl** only (from Stage Presence: "read a table faster than the dealer… lost their per diem twice" — the casino IS her lore; pool 18 → 17). ~~cowboy~~, ~~gangster~~ STRUCK (skeptic): the cowboy lore line is firearms, quickdraw and "a peculiar code of honor involving fair duels"; the gangster's is small arms, shanking and vehicle-borne violence — neither mentions a table, cards or dice. "Maverick / the numbers racket" is genre adjacency, which is the yeti/Christmas failure. A one-race family is fine (mondo's rule 2). Not sheriff (he shuts the game down), not fortune teller (tarot is divination, not a wager).
**Now.** Empty.
**Problems.** n/a.
**Changes.**
- FAMILY_NEW `gambling` with the four rows below; RACE_ADD bunny girl (only).
- bunny girl tree rungs `[racePopMicDrop, raceNimbleDodge, racePopSpotlight, raceMimicry]` → `[raceDeadMansHand, raceNimbleDodge, raceDoubleDown, raceMimicry]`.
**Additions.**
- NEW **Dead Man's Hand** `raceDeadMansHand` — T1, damage/multiHit, arcane/magic, 25 MP 1 AP, rng 3, single, hitDamages [26,26,26,26] = 104. (Skeptic: magic, not physical — the family's only race is a 40-ATK / 62-INT support; a physical kit would be dead on the one unit that owns it. The cards are a card trick, not a blade.) "Aces and eights, thrown edge-first." The T1 hit; Flurry of Blows (4×33 melee) is the comparable.
- NEW **Stacked Deck** `raceStackedDeck` — T2, effect/debuff, 50 MP 1 AP, rng 4, single: Marked 2 and DEF −1 stage. "You have been reading their tell all night." Marked ("the next hit against this unit consumes the mark for bonus damage") had seven setups and no reason to exist on a support; this makes the bunny girl the table's focus-fire caller.
- NEW **Double Down** `raceDoubleDown` — T3, effect/buff, 75 MP 1 AP, self: ATK +2 stages, DEF −1 stage. "Everything on the table." The risk row — Underdog Spirit (T3, ATK +2 per the g7 rewrite) without the cleanse and with a cost.
- NEW **Jackpot** `raceJackpot` — T4, damage/aoe, arcane/magic, 100 MP 1 AP, rng 3, aoe r1, 160 dmg, Stagger 1 (magic for the same reason as Dead Man's Hand). "The machine pays out. All of it. On their heads." The area capstone; Arrow Volley / Marrowstorm (T4, 160 aoe) are the scale.
**Upgrades.** Dead Man's Hand: Empowered (per card), Long Reach. Double Down: self-target — it takes no Long Reach. Stacked Deck: Lingering, Long Reach. Jackpot: Widen (5×5), Empowered. Double Down should NOT take Lingering (stages). Family-scoped upgrade worth adding: **"Loaded Dice"** (1 SP, families: [gambling], requires: dmg) — patch `{ critChanceAdd: 0.15 }`; the house always wins.

### 🦮 Animal Handling `animalhandling` — VERDICT: GROW (new kit)
**Identity.** The beastmaster: bodies on the board — a scout bird, a wolf pack, the whip, the elephant. The only family built on summons (Whistle, The Gathering and Summon Creation are one-offs elsewhere); tactically it is vision, blockers and end-of-round pressure.
**Races.** **ringmaster** (top hat, whip, circus — the lion tamer is the archetype; pool 14 → 18), **shaman** (lore: "spirit-animal manifestation" — the summons are spirit animals; pool 11 → 15; only fortune teller 7, conspiracy theorist 9 and five 10-row races sit below it). cowboy was considered (Whistle's hound) and left out: his hound already lives in Cowboy Skills, and his lore line is guns and duels, not a kennel. Not bigfoot, not king kong (they ARE the animal).
**Now.** Empty.
**Problems.** n/a.
**Changes.**
- FAMILY_NEW `animalhandling` with the four rows below; RACE_ADD ringmaster, shaman (rungs unchanged — both races' rungs already sit in other families).
**Additions.**
- NEW **Hawk** `raceHawk` — T1, deploy/summonUnit, 25 MP 1 AP, rng 1, maxActivePerCaster 1, summonDef `{ key: 'hawk', name: 'Hawk', move: 6, dmg: 35, hits: 2, reveals: 2 }`. "Two fingers on the glove. At the end of every round it dives 6 tiles at the nearest enemy for 35; anything hidden within 2 tiles of it is spotted. Two hits to bring it down." (Skeptic: reveals 4 → 2 — the T3 Whistle hound reveals 3 and the 1-SP Hagstone reveals 4; a 25-MP T1 scout must not out-see both. Its 6 MOV is the edge: it gets there.) The scout — a second cheap counter to fog and Invisible (11 setups, 0 payoffs) beside the Hagstone gear row (1 SP, reveals Invisible within 4) and the cowboy's Whistle hound (T3, sniffs out Invisible within 3).
- NEW **Wolf Pack** `raceWolfPack` — T2, deploy/summonUnit, 50 MP 1 AP, rng 1, maxActivePerCaster 2, summonDef `{ key: 'wolf', name: 'Wolf', move: 4, dmg: 45, hits: 2 }`. "Never one. At the end of every round each wolf runs 4 tiles at the nearest enemy and bites for 45. Two per handler." Bodies that block lanes and force AP.
- NEW **Crack the Whip** `raceCrackTheWhip` — T3, damageEffect/damage, -/magic, 75 MP 1 AP, rng 2, single, 125 dmg, Feared 1. (Skeptic: magic, not physical — shaman, one of the family's two races, has ATK 18; ringmaster is 54/58 and loses nothing.) "The whip cracks — or the spirit roars — and they run." Feared ("can only flee, no attacks, no spells") had one setup (Fear) and one payoff (Terror Pounce); this is the single-target version at the Skull Crack (T3, 125 + Silence) weight.
- NEW **Elephant** `raceElephant` — T4, deploy/summonUnit, 100 MP 1 AP, rng 1, maxActivePerCaster 1, summonDef `{ key: 'elephant', name: 'Elephant', move: 3, dmg: 110, hits: 6 }`. "The big top's biggest act. Walks 3, hits for 110, takes six hits to put down. One per handler." A T4 that is a wall with a trunk.
**Upgrades.** Hawk / Wolf Pack / Elephant: Surplus (+1 active) — cap Surplus to Hawk and Wolf Pack (`upgrades: ['upDeploy']`) and exclude it on Elephant (two elephants is a map problem). Crack the Whip: Lingering (Feared 2), Empowered, Long Reach.

### 🛕 Archaeology `archaeology` — VERDICT: DELETE
**Identity.** Would be: tombs, relics, curses, the whip. Occult Knowledge (Sacred Geometry, Pyramid Protocol, Ancient Magic, Weigh the Heart) is already the ancient-ruins family on professor, annunaki, anubis, djinn and occulus; the whip is Ropework; the curse is Witchcraft.
**Races.** None. The only race it would suit (professor, the Indiana Jones reading) already holds Occult Knowledge.
**Now.** Empty.
**Problems.** Full overlap.
**Changes.**
- FAMILY_DELETE `archaeology`.
**Additions.** None.
**Upgrades.** n/a.

### 🧑🏻‍🍳 Culinary Arts `culinaryarts` — VERDICT: DELETE
**Identity.** Would be: food as buffs/heals. No race's lore is a cook; the eating rows that exist (Carrion Feast, Cannibalize, Healing Seed, Herbal Remedy) belong to Grave Hunger, Zombie Behavior, Agriculture and Nature, which cover the sustain job.
**Races.** None.
**Now.** Empty.
**Problems.** No owner, no theme strong enough for a race to pass the yeti test.
**Changes.**
- FAMILY_DELETE `culinaryarts`.
**Additions.** None.
**Upgrades.** n/a.

### 🪞 Mirror Magic `mirrormagic` — VERDICT: GROW (new kit)
**Identity.** Glass and reflection: shards that bounce, bad luck for the one who broke it, a face full of glass, and a hall the enemy cannot see out of — an arcane control-caster family that owns Blind and feeds Hexed.
**Races.** **rabbit** (lore: "recovered from the far side of the Looking-Glass" — swapped in from Fae; pool 18 → 16), **fortune teller** ("crystal scrying" — divination by looking into glass; the scrying mirror; pool 7 → 11, the smallest pool in the game; Seven Years feeds her own Crystal Ball). ~~ice queen~~ STRUCK (skeptic): her lore line is crystalline ice and freezing water — no mirror; Andersen's troll-mirror is outside the file, and "ice looks like glass" is the shared-element failure the yeti/Christmas rule names. Not machine elves or crystal guardian — Prism Lattice (Prism Mirror, Mirror Blink) is already their glass.
**Now.** Empty.
**Problems.** n/a.
**Changes.**
- FAMILY_NEW `mirrormagic` with the four rows below; RACE_ADD rabbit, fortune teller.
- rabbit tree rung 1 `raceSparkle` → `raceMirrorShard`.
**Additions.**
- NEW **Mirror Shard** `raceMirrorShard` — T1, damage/ricochet, arcane/magic, 25 MP 1 AP, rng 4, single, 80 dmg, ricochet { radius 2, mult 0.5 }. "A sliver of the glass. It finds the next face too." The T1 hit with the family's signature bounce; Prism Burst (T3, 125 ricochet) is the upper rung of the pattern. (Skeptic: 100 → 80 — at 100 this is Kinetic Hurl with the 2-SP Ricochet upgrade baked in for free; the T1 rows that carry a built-in second hit pay for it in the base number — Sonic Boomerang is 80.)
- NEW **Seven Years** `raceSevenYears` — T2, damageEffect/damage, arcane/magic, 50 MP 1 AP, rng 4, single, 100 dmg, Hexed 2. "You broke it. You know the rule." Feeds Crystal Ball (fortune teller's own T4, finisher Hexed ×1.5), Crow Storm and Exorcism; Hex of Agony (T2, witchcraft) applies the same status with no damage, so 100 + Hexed 2 is the T2 line.
- NEW **Shattered Mirror** `raceShatteredMirror` — T3, damageEffect/aoe, arcane/magic, 75 MP 1 AP, rng 4, aoe r1, 125 dmg, Blind 1. "Every shard, every eye." The area rung; pays into Sucker Punch (rabbit has Trickery) and the Blind zone below.
- NEW **Hall of Mirrors** `raceHallOfMirrors` — T4, damageEffect/aoe with `zoneDuration: 3` (the engine's zone hook — there is no `zoneDebuff` kind; Heat Death is the template), arcane/magic, 100 MP 1 AP CD2, rng 4, aoe r1, dmg 60, status Blind 1: enemies inside take 60 magic at the end of each of the 3 rounds and are Blinded 1 each time. "Nine of you, and none of them is the door." Heat Death (T4, zone + damage + Slow) is the pattern; 3×60 = 180 over the zone's life is the T4 area budget.
**Upgrades.** Mirror Shard: Empowered, Long Reach — NOT Ricochet (it already bounces; give it `upgrades: ['upDamage','upReach','upBlast']`). Seven Years: Lingering (Hexed 3), Forked. Shattered Mirror: Widen (5×5), Lingering. Hall of Mirrors: Widen, Lingering.

### ◈ Gear `gear` — VERDICT: KEEP (re-tiered)
**Identity.** Universal accessories as passive rows (at most 2 passive/gear rows in the 7): vision, mobility, survival and the two locked-in stat brands. Every unit's pool; no race owns it.
**Races.** Universal by design.
**Now.** 16 rows, all T1 (1 SP), all live (the map.js `unitHasAccessory` helpers read `accessory`; hooks statBonus / regenPerRound / surviveLethalOnce / purgeDebuff / spellLock / grantSpell / basicEcho / revealInvisibleWithin / buildBonus / revealTrapsWithin):
- Binoculars `gearBinoculars` +28 AWR, crit, senses hidden at AWR 84+ · Telescope `gearTelescope` +28 AWR, sky targeting rng 5 · Walkie Talkie `gearWalkieTalkie` +14 AWR, shared LOS · Signal Flare `gearSignalFlare` +14 AWR, one-use reveal · Ward Totem `gearWardTotem` +14 AWR, deployable vision · Hagstone `gearHagstone` reveals Invisible within 4 · Dowsing Rod `gearDowsingRod` reveals traps within 3.
- Jetpack `gearJetpack` flight, ignores terrain, +1 MOV · Grapnel Gauntlet `gearGrapnelGauntlet` grants Grapple · Mason's Gauntlets `gearMasonsGauntlets` build/dig ×2.
- Chrono Locket `gearChronoLocket` +5% HP/round · Martyr's Talisman `gearMartyrsTalisman` survive the first killing blow each life · Censer of Purity `gearPurityCenser` purge 1 debuff/round + 40% ATK lash · Echo Band `gearEchoBand` basic attacks hit twice (echo 50%).
- Berserker's Brand `gearBerserkersBrand` +16 ATK, spell-locked · Archon's Focus `gearArchonsFocus` +14 M.ATK, spell-locked.
**Problems.** Five AWR accessories at the same price — Signal Flare and Ward Totem are both "+14 AWR plus a reveal" and compete for the same slot; not a duplicate (thrown one-use vs. placed persistent) but it is the crowded corner. The data.js comment says "tier I (1 SP) until the catalogue re-tiers it" — nothing has been re-tiered, so the 1-SP rows that decide fights (a free death save, flight, a 1.5× basic-attack multiplier) cost the same as +14 AWR.
**Changes.**
- RETIER `gearMartyrsTalisman` T1 → T2 (2 SP): a per-life death save is Plot Armor / Indomitable Will as a passive.
- RETIER `gearJetpack` T1 → T2 (2 SP): permanent flight is the high-ground bonus and terrain immunity for the whole match; Fairy Dust buys 2 rounds of it for 50 MP.
- RETIER `gearEchoBand` T1 → T2 (2 SP): +50% on every basic attack outclasses Brute Force (+20%) and Warpath (+15%) at the same 1 SP.
- KEEP both `gearSignalFlare` and `gearWardTotem` (no merge — thrown one-use vs. placed persistent); REWRITE `gearSignalFlare` desc only, to say "one use — thrown up to 8 tiles into the fog, reveals a diamond 6 tiles out from where it lands; the flare is spent" so the two read as different tools (ui.js `doFlair`: range 8, `flairRadius = 6`, the accessory is removed on use; battle.js only dispatches `actionMode === 'flair'`).
**Additions.** None — 16 accessories is plenty; the universal pool should not grow.
**Upgrades.** Passive rows take no upgrades (spellUpgradeFits rejects kind 'passive'); none to scope.

### ✦ Training `training` — VERDICT: KEEP (three rows go home, two re-tiered)
**Identity.** The 13 old job passives as universal 1-SP edges: crit, counters, spell power, healing reach, duration extenders, and Adaptable (borrow other families).
**Races.** Universal by design.
**Now.** 13 rows, all T1 (hooks live: critMult, basicDmgMult, counterChance, armor, damageSoak, spellPower, healRangeBonus/healBonus, scannerCap/inspectBonus, debuffTurnsBonus/teleportMpDiscount, lifeSapMult/plantedTrees, turretRangeBonus/repairMult, buffTurnsBonus/lullabyRangeBonus, borrowFamilies, swim, counterAtkPct):
- Deadeye `passiveDeadeye` +10 SPD, crit ×2.0 · Warpath `passiveWarpath` +15% basic, +5 armor, 30% counter · Bulwark `passiveBulwark` −8 soak, +5 armor, 30% counter · Riposte `passiveRiposte` 35% counter at 60% ATK · Brute Force `passiveBruteForce` +20% basic, swim · Arcane Surge `passiveArcaneSurge` +8 spell dmg · Grace `passiveGrace` heals +2 rng, +24 · Crescendo `passiveCrescendo` buffs +1 turn, Lullaby +1 rng · Third Eye `passiveThirdEye` debuffs +1 turn, Teleport −1 MP · Adaptable `passiveAdaptable` borrow families · Tinker `passiveTinker` turrets +1 rng, Repair +20% · Green Thumb `passiveGreenThumb` trees buff ATK/spell power, Life Sap +20% · Field Operative `passiveFieldOperative` 2 scanners, inspect +1.
**Problems.** Three rows are useless to ~120 of 124 races: Tinker (Engineering's turrets and Repair — droid, gnome), Green Thumb (Agriculture's seeds, Nature's Trunk Throw and Blood's Life Sap — the seed races), Field Operative (System Analysis scanners — the hacking races). They clutter every unit's universal list. Crescendo carries a one-spell job leftover ("Lullaby has +1 range"). Warpath is Brute Force's damage plus Bulwark's defence at the same 1 SP — strictly above both. Adaptable rewrites the whole team-building rule (borrow any family) for 1 SP.
**Changes.**
- MOVE `passiveTinker` → `engineering` as that family's passive (tier 1, same hooks). Cross-slice: the engineering block should confirm.
- MOVE `passiveGreenThumb` → `agriculture` as a family passive (tier 1, same hooks). Cross-slice.
- MOVE `passiveFieldOperative` → `computerhacking` as a family passive (tier 1, same hooks). Cross-slice.
- REWRITE `passiveCrescendo`: hooks `{ buffTurnsBonus: 1 }` only; desc "Buffs this unit applies last +1 turn." Drop the `lullabyRangeBonus` hook from the row AND the battle.js line that reads it (no orphaned hooks).
- RETIER `passiveWarpath` T1 → T2 (2 SP).
- RETIER `passiveAdaptable` T1 → T2 (2 SP): the single biggest team-building lever in the game should cost a real slot.
**Additions.** None — the universal pool shrinks to 10 and every remaining row is useful to any unit.
**Upgrades.** Passive rows take no upgrades; none to scope.

SPELL COUNT: 73 → 85 for this group (existing families 44 → 47: +Telekinetic Slam, +Misdirection, +Sucker Punch, +Roll Credits, −Pixie Dust; three new kits +12: Gambling 4, Animal Handling 4, Mirror Magic 4; Gear 16 → 16; Training 13 → 10 with Tinker / Green Thumb / Field Operative re-homed; Music Theory, Acting Chops, Archaeology, Culinary Arts deleted at 0)


---

## R.1 Race fit — Homosapien … Mech (31 races)

### Races part 1 (31 races: humans, aliens, cryptids, tech, divine, unholy)

### Homosapien `homosapien` — hybrid · space · human · pool 12
- **Now:** Human Grit (5) · Teamwork (3) · Athleticism (5)
- **Fit:** Human Grit ✓ ("no powers, just nerve" — the race's whole point; every rung has a Human Grit member, with rung 2 the pair Adrenaline Rush / Pep Talk `jackOfAll`, the latter a Teamwork row) · Teamwork ✓ (tool-user, adaptable, the team template) · Athleticism ✓ (baseline athletic human).
- **Proposed families:** Human Grit KEPT · Teamwork KEPT · Athleticism KEPT · Ropework ADDED (Grapple `raceGrapple` + Lasso `raceLasso`: rope is the oldest human tool, and it gives the pool its only debuff/pull — Lasso's tethered2). Pool 12 → 14. Rungs untouched. Note for the family auditors: `raceElbowGrease` (T1 90 dmg rng 1, metal) and `improvise` (T1 80 dmg rng 2, no element) are the same row twice in the same family (summary.md buckets Improvise with Bone Toss only because Elbow Grease carries the metal element; the shape is identical); the rung is the pair `["raceElbowGrease","improvise"]`, so merge Improvise into Elbow Grease (rng 2, 90 dmg) and the rung still resolves.
- **Pool gaps:** AOE — intended (a hybrid brawler; `rampage`'s dashDamage 64 already hits the path). Debuff — a hole for a hybrid; Ropework fixes it. Sustain is Adrenaline Rush (55% self-heal) and Indomitable Will; fine.
- **Identity in one line:** the Adaptable carrier — `passiveAdaptable` borrows a teammate's family, Pep Talk (`jackOfAll`) + Indomitable Will make it the sturdy off-tank, Encore is the team's AP battery for a carry.

### Pirate `pirate` — bruiser · chaos · human · pool 13
- **Now:** Piracy (6) · Swordsmanship (5) · Ropework (2)
- **Fit:** Piracy ✓ (pirate-only — not flagged UNIQUE, only D.O.O.R. Gun carries the flag — and holds all 4 rungs) · Swordsmanship ✓ (cutlass) · Ropework ✓ (rigging, grapple-and-board).
- **Proposed families:** all three KEPT. Pool 13 is right for a bruiser with a 6-row signature family.
- **Pool gaps:** buff — not really a gap: Yo Ho `raceYoHo` (T3, heal 130 all + ATK+1 stage) is counted as heal but is the team's ATK buff. Sustain/movement intended (Land Ho `raceBoardingRush` charges, Lasso pulls). Setup→payoff is self-contained: Anchor `raceAnchor` root2 → Land Ho root×1.5; Cannonball burn1 → Dragon Slash burn×1.5. Cross Slash (slow) needs a teammate. Lasso's tethered has no payoff in this pool (High Noon is the cowboy's) — fine, the drag itself is the value.
- **Identity in one line:** root-and-board bruiser: Anchor/Lasso pin the target, Land Ho pays it off, Walk the Plank executes below 25%; Yo Ho is the only physical-team heal+ATK buff in the game.

### Swordfighter `swordfighter` — bruiser · time · human · pool 14
- **Now:** Main Character Energy (5) · Swordsmanship (5) · Athleticism (5). Lore line is EMPTY — write one ("the anime protagonist with a sword").
- **Fit:** Main Character Energy ✓ (rungs Sad Backstory, Plot Armor, To Be Continued) · Swordsmanship ✓ (Blessed Blade rung) · Athleticism ✓ (agile duelist).
- **Proposed families:** all KEPT. Fix the internal duplication instead: the pool holds FOUR self-buffs — Sad Backstory `raceSadBackstory` (T1 atk+1), Plot Armor `racePlotArmor` (T2 def+1), Prophecy Fulfilled `raceProphecyFulfilled` (T3 overclock = atk+1/mov+1, 2AP) and Thick Hide `raceThickHide` (T2 def+1, 50MP) — Plot Armor and Thick Hide are the identical row. REWRITE Plot Armor `racePlotArmor` to stage def+1 AND mdef+1 (T2, light, 50MP 1AP, self; the "survive at 1 HP" flavour is Indomitable's, so no) — it is also the Chosen One's rung 2 and keeps its tier. To Be Continued `raceToBeContinued` (T3 135 delayed, no rider, under-tuned T3 list) → dmg 150, everything else unchanged. Main Character Energy has no T4 — NEW T4 "Season Finale" `raceSeasonFinale` (damage/damage, metal/physical, 100MP 1AP, dmg 180, rng 1, single; a kill refunds 1 AP) gives the race a signature ender instead of borrowing Dragon Slash. Pool 14 → 15.
- **Pool gaps:** sustain — intended (Plot Armor is its defence). Debuff — intended and actually good design: Cross Slash (slow×1.5) and Dragon Slash (burn×1.5) both need a setter, so the swordfighter is the finisher who wants a Wizard/Sonic slow-setter or a burn-setter beside him. It can set stagger (Unstoppable Charge) and poison (Dark Feather `raceDarkFeather`, T1 2AP dash 100 + poison3 — a Chosen One row that reads odd here; fine).
- **Identity in one line:** team finisher: bring a Slow setter for Cross Slash and a Burn setter for Dragon Slash; Blade Waltz/Blessed Blade for the AOE cleanup.

### Knight `knight` — tank · time · human/divine · pool 13
- **Now:** Knighthood (3) · Camelot Powers (4) · Swordsmanship (5) · Horseback Riding (1)
- **Fit:** Knighthood ✓ · Camelot Powers ✓ (Arthurian; Walls of Camelot rung) · Swordsmanship ✓ · Horseback Riding ✓ (a knight rides — but the family is one row, Brave Charge `guardSlash`, a plain 100-dmg charge identical to Heroic Leap/Dark Justice, and the T1 shape of Ambush Lunge (T3 125)).
- **Proposed families:** Knighthood KEPT · Camelot Powers KEPT · Swordsmanship KEPT · Horseback Riding KEPT — it is also the Sheriff's family, so no FAMILY_DELETE (rule (a)) and no "keep only if"; grow it here: NEW T2 "Trample" `raceTrample` (damage/dash, -/physical, 50MP 1AP, dmg 110, rng 4, single, dashDamage 50: ride through the line) and NEW T3 "Lance" `raceLance` (damageEffect/damage, metal/physical, 75MP 1AP, dmg 125, rng 3, single, status stagger1, the caster charges into melee first). Brave Charge stays its T1. Two fixes inside Knighthood: (1) Oath of Valor `raceOathOfValor` (T3 warCry atk+1 aura r2) is the same row as Royal Decree `raceRoyalDecree` (T1 warCry atk+1 aoe r2) in the same pool, two tiers apart — REWRITE Oath of Valor into the tank's sustain: effect/warCry, light, 75MP 1AP, aura r2, allies inside gain stage def+1 and shieldHp 96 (Fortify-sized); T3 kept, it is the knight's rung 3. (2) Knighthood has no T2 and the knight has no taunt — NEW T2 "Challenge" `raceChallenge` (effect/debuff, -, 50MP 1AP, rng 3, single, status taunt2 — Sonic's Provoke `provoke` row copied): a knight calls out a duel; that is the debuff the pool lacks and the code-of-chivalry lore. Pool 13 → 16.
- **Pool gaps:** sustain — a hole for a tank with hp 635/def 64 and only Chivalry's intercept; the Oath rewrite fixes it. Debuff — hole; Challenge fixes it. Four T4s (Crusade, Excalibur Strike, Blessed Blade, Dragon Slash) on a 13-row pool is top-heavy; Crusade `raceCrusade` (T4 light/MAGIC cross r2 160, rng 4, 2AP) and Judgment `judgment` (T4 light/PHYSICAL cross r3 160, rng 1) share a redundancy bucket but differ in damage type — and that is the knight's real problem: his T4 rung Crusade is MAGIC on int 29 / atk 76. REWRITE Crusade to light/physical (a mounted charge in a cross; numbers unchanged) so the rung scales with the tank; keep the Unholy bonus, that is its identity. King Arthur (atk 70 / int 28) shares the row and gains the same way.
- **Identity in one line:** bodyguard tank: Chivalry intercepts the hit, Walls of Camelot shapes the lane, Knights of Round pulls the whole team to him; wants a Slow setter for Cross Slash.

### Shaman `shaman` — support · time · human/anomaly · pool 11
- **Now:** Nature Magic (4) · Drug Use (2) · Astral Projection (2) · Agriculture (3)
- **Fit:** Nature Magic ✓ (ethnobotanical; Herbal Remedy AND Ayahuasca Retreat `raceAyahuascaRetreat` rungs — Ayahuasca sits in Nature Magic today, not Drug Use) · Drug Use ✓ (psychoactive — the Bad Trip/Ego Death rung pair) · Astral Projection ✓ (consciousness transference; Spirit Walk rung) · Agriculture ✓ (a herbalist who plants seeds — Healing Seed/Poison Seed/Leech Seed are the shaman's plant compounds).
- **Proposed families:** all four KEPT; the pool is under 12 because three of the families are stubs. Fixes: Drug Use is two T4 single-target 180 nukes (Bad Trip `raceBadTrip`, Ego Death `sharedEgoDeath`) and nothing else. Ego Death STAYS T4 [skeptic: it is the lone rung-4 of Machine Elves and Mushroom Girl — a T3 retier pushes their rung 4 out of the ladder; and the two rows are different roles (slow + slow/voodoo payoff vs 2AP stun setter), not twins]. NEW T2 "Contact High" `raceContactHigh` (effect/zoneDebuff, psychic, 50MP 1AP, rng 4, aoe r1, status discord1, zoneDuration 2) as the family's setup row. Astral Projection: NEW T3 "Spirit Animal" `raceSpiritAnimal` (deploy/summonUnit, nature, 75MP 1AP, rng 1, maxActivePerCaster 1, summon move 4 / dmg 60 / 3 hits — Whistle's hound shape) — the lore line literally says "spirit-animal manifestation". Pool 11 → 13.
- **Pool gaps:** debuff — a hole for a support; Contact High + Poison Seed cover it. Sustain is strong (Herbal Remedy 160+cleanse2, Healing Seed, Astral Barrier shield 90, Ayahuasca 50% self-heal). Note Bad Trip pays off voodoo, which only Black Magic's Voodoo `raceVoodoo` sets — the shaman is a natural partner for a skinwalker/necromancer/krampus.
- **Identity in one line:** the drug-and-spirit support: seed sustain + Astral Barrier, Spirit Walk escape, Bad Trip (applies slow1 and pays slow/voodoo ×1.5 — it sets up its own second cast; Ego Death's stun feeds a teammate's Dust Devil / Aurora Ray / Take Aim, not Bad Trip), and the voodoo payoff for a Black Magic teammate.

### Mad Scientist `mad scientist` — specialist · space · human/tech · pool 10
- **Now:** Unethical Science (4) · Hidden Technology (5) · Chemistry Knowldege (1)
- **Fit:** Unethical Science ✓ (mad-scientist-only, not flagged UNIQUE; Cloning/Creation/Serum/Plandemic rungs) · Hidden Technology ✓ (Tesla Coil rung; "improvised electromagnetic devices") · Chemistry ✓ ("unstable chemical compounds"; Chemical Concoction `raceOvercharge` is a rung — note the id says Overcharge, the name says Concoction; fix the family's spelling "Knowldege" while there).
- **Proposed families:** all three KEPT. Pool 10 is a problem for a specialist and Chemistry is a one-row family: grow Chemistry to a ladder — NEW T1 "Acid Flask" `raceAcidFlask` (damageEffect/damage, poison/magic, 25MP 1AP, dmg 80, rng 3, single, status poison2, stage def-1), NEW T2 "Stim Injection" `raceStimInjection` (heal/heal, -, 50MP 1AP, rng 3, single ally, healAmt 120, stage spd+1: the medic side of a mad doctor), keep Chemical Concoction T3; Chemistry stops at T3 [skeptic: the proposed T4 "Volatile Compound" (aoe r1 160 corroded2) was Chemical Concoction with more damage — same family, same role, that is the Empowered upgrade, not a spell; three tiers is allowed]. Corroded is a DEAD status (PAYOFF none): REWRITE Plandemic `racePlandemic` to add finisher poison,corroded ×1.5 so Chemical Concoction → Plandemic is a self-contained chain. Hidden Technology has no T2/T3 (3/0/0/2) — family auditors. Pool 10 → 12.
- **Pool gaps:** sustain — Stim Injection fixes it (Free Energy `freeEnergy` MP restore is the other half). Movement — intended (a deployer who hides behind Tesla Coils and a Creation).
- **Identity in one line:** deploy engine: Tesla Coils + Creation + Clone soak, Monster Serum on a bruiser (+1 reach, +25% HP), Deneuralizer jam → Classified Weapon/Railgun, Concoction → Plandemic.

### Cowboy `cowboy` — ranged · space · human · pool 18
- **Now:** Cowboy Skills (3) · Hunting Skills (4) · Gun Training (8) · Horseback Riding (1) · Ropework (2)
- **Fit:** Cowboy Skills ✓ · Hunting Skills ✓ (frontier; Whistle `raceWhistle` "one hound per cowboy" and Long Rifle `raceQuickDraw` are rungs) · Gun Training ✓ · Horseback Riding ✗ for THIS unit — cowboys ride, but the one row is a melee 100-dmg charge on a unit with atk 40 and a ranged kit; dead weight · Ropework ✓ (Lasso rung).
- **Proposed families:** Cowboy Skills KEPT · Hunting Skills KEPT · Gun Training KEPT · Ropework KEPT · Horseback Riding REMOVED (no rung there). Pool 18 → 17. Inside the pool: Fan the Hammer `raceFanTheHammer` (T2 aoe r1 100, rng 2) is strictly worse than Dynamite `raceDynamite` (T2 aoe r1 110 + stagger, rng 3) in the same family — the rung is the pair, so REWRITE Fan the Hammer into the six-shooter it names: damage/multiHit, metal/physical, 50MP 1AP, hitDamages [23,23,23,23,23,23] (138 total — inside the T2 ceiling of 140; the first draft's [35×6] = 210 was above every T4 in the game), single, rng 2; it is also the Sheriff's rung 2 and stays T2. Long Rifle `raceQuickDraw` (T3 125 rng 5, no rider — under-tuned T3 list) keeps its name [skeptic: "Quick Draw" collides with the cowboy's Quickdraw passive, and a long rifle is the one gun nobody quick-draws] and gains finisher marked ×1.5: Marked has SEVEN setters (Knife Throw, Dead Eye, Red Eyes, Predictive Model, Implant, Infernal Conscription, Demonic Claw) and ZERO wired payoffs (Double Pump `doubleShot`'s text says "hits harder on Marked targets" but synergy.md finds no payoff field — fix that text or wire it too).
- **Pool gaps:** sustain — intended (ranged). Debuff — not really: Lasso `raceLasso` tethered2 (drag + no self-move), Dynamite stagger1, Dead Eye marked2 are setups, and High Noon `raceHighNoon` pays stagger/tethered ×1.5 self-contained. Stat flag: atk 40 with eleven physical damage rows (9 damage + 2 damageEffect, every one physical; Marksman has atk 80) — either the Quickdraw passive carries it or ATK needs +30.
- **Identity in one line:** rope-and-shoot ranged: Lasso drags one target out of formation and holds it, Dynamite staggers the clump, High Noon deletes the tethered/staggered target through walls; the hound sniffs out invisibles.

### Men in Black `men in black` — assassin · space · human/tech · pool 19
- **Now:** Spy Gear (7) · Hidden Technology (5) · Alien Weapons (6) · Deep State Connections (2)
- **Fit:** Spy Gear ✓ · Hidden Technology ✓ (Deneuralizer + Classified Weapon rungs) · Alien Weapons ✓ (alien-derived hardware) · Deep State Connections ✓ (the [REDACTED] agency; Black Budget is their money).
- **Proposed families:** all four KEPT. Tier flags inside the pool: Stun Ray `raceStunRay` (T1, 100 dmg + stun1, 25MP) is a full stun at T1 while Blue Screen/Hypnotic Pulse/Executive Order/Stasis Beam are T3 pure stuns — Stun Ray STAYS T1 [skeptic: it is Barbarella's rung 1] and is RETUNED instead: dmg 100 → 60, status stun1 kept, CD2 added (Taser's shape at a T1 budget). EMP Grenade `raceEMPGrenade` is T2 at 75MP (off ladder) — RECOST to 50. Plasma Whip appears twice (`racePlasmaWhip`/`raceLavaLamp` alias, one object). Stat flag: atk 40 / int 66 while Spy Gear's damage (Knife Throw, Poison Dart, Sneak Slash 160) is physical — the MIB's real build is the magic side: Deneuralizer/EMP jam → Classified Weapon (magic 180 jammed×1.5); Sneak Slash is a decoy row for it.
- **Pool gaps:** sustain — intended (assassin). Everything else present; 19 rows across four themed families is healthy.
- **Identity in one line:** jam-and-erase assassin: Deneuralizer/EMP Grenade jam → Classified Weapon/Railgun; Agent Vanish + Smoke Screen give the team stealth; Shrink Ray neuters the enemy bruiser.

### Telepath `telepath` — caster · chaos · human/anomaly · pool 12
- **Now:** Psychic Abilities (8) · Deep State Connections (2) · Astral Projection (2)
- **Fit:** Psychic Abilities ✓ · Deep State Connections ✗ — the telepath is a "containment priority: HIGH" subject, not an agent with a black budget; it is on the list only because Brainwash `raceBrainwash` (its rung) sits there, and Brainwash is a psychic act (discord2, psychic element) that shares nothing with Black Budget · Astral Projection ✓ ("psychokinetic barrier projection" is Psychic Barrier, its own rung; Astral Barrier is the team version of it and Spirit Walk the projection).
- **Proposed families:** Psychic Abilities KEPT · Astral Projection KEPT · Deep State Connections REMOVED; MOVE `raceBrainwash` to Psychic Abilities (Psychic Beam already sets discord1 and Migraine pays it, so Brainwash is the family's proper T3 debuff). Rung preserved by the move. Pool 12 → 11 (loses Black Budget only); acceptable for a caster sitting on an 8-row family, and it climbs back when Astral Projection gets its T3/T4 (Spirit Animal proposed under Shaman; add a T4 "Astral Storm" aoe psychic 160).
- **Pool gaps:** sustain — Psychic Barrier (shield 150) is the caster's sustain; intended. Tier flag: Psychic Beam `racePsychicBeam` (T1 line 100 + discord1, 25MP) is on the over-tuned T1 list — RETIER to T2.
- **Identity in one line:** discord/silence caster: Psychic Beam or Brainwash → Migraine, Mind Shatter's self-silence chain, Telepathic Link M ATK aura for a caster team, Teleport to move anyone.

### Marksman `marksman` — ranged · space · human/tech · pool 24
- **Now:** Military Combat (10) · Gun Training (8) · Hunting Skills (4) · Marksmanship (3)
- **Fit:** Military Combat ✓ (sniper as forward observer: Suppressive Fire, Rangefinder, Fire for Effect rungs; only Nuke/Rally Command/Iron Dome read as an officer's rows) · Gun Training ✓ (Incendiary Rounds rung) · Hunting Skills ✓ (72-hour prone patience; Camouflage) · Marksmanship ✓.
- **Proposed families:** all KEPT. Pool 24 sits exactly at the ceiling — not a problem, but if the family auditors ever split Military Combat, the marksman keeps the spotter/suppression half, not Nuke. Inside the pool: Precision Shot `precisionShot` (T3 125, root×1.5) and Long Rifle (T3 125, nothing) are twins — the Quick Draw rewrite above separates them. Take Aim `headshot` (T4 180, ignoreArmor, stun×1.5, execute ≤15%) vs Dead Eye `deadEye` (T4 180 crit + marked2) are distinct enough; Dead Eye's guaranteedCrit is a DEAD field per synergy.md — make it real or drop the text.
- **Pool gaps:** movement — intended (he does not move). Debuff — present as damageEffect setups (Kneecap Shot root1, Suppressive Fire slow2). Kneecap → Precision Shot is self-contained; Fire for Effect's burn is self-contained through Incendiary Rounds basic attacks; Take Aim needs a Stun setter (Nordic's Stasis Beam, AI's Blue Screen, Men in Black's Stun Ray — the Grey sets no stun) — a good team hook. (synergy.md counts Fire for Effect as needing a teammate because the data tracks `incendiary`, not `burn`; Incendiary Rounds' text says the basic attacks Burn, so verify the rider actually applies burn.)
- **Identity in one line:** long-range setup-and-execute: Kneecap → Precision Shot, a teammate's Stun → Take Aim execute, Rangefinder + Fire for Effect as the team's artillery spotter.

### Priest `priest` — healer · time · human/divine · pool 25
- **Now:** Bible Study (7) · Light (8) · Heavenly Duties (7) · Healing Magic (3)
- **Fit:** Bible Study ✓ (Sermon, Tithe, Exorcism rung) · Light ✓ (Protect + Smite rungs) · Heavenly Duties ✗ for the priest — it is the ANGELS' job list (Rapture, Miracle/Wings of Mercy, Sanctuary, Divine Smite "the full weight of heaven"); the priest is on it only for Divine Light, and Healing Magic + Bible Study already give him five heal rows (Heal, Heal All, Revive, Absolution, Hallelujah) · Healing Magic ✓.
- **Proposed families:** Bible Study KEPT · Light KEPT · Healing Magic KEPT · Heavenly Duties REMOVED; rung `raceDivineLight` → `heal1` (Heal, T1 192, Healing Magic). Pool 25 → 18, and the 8-heal redundancy (heal-kind rows today: Divine Light 140, Purify cleanse-area, Sanctuary zone, Heal 192, Heal All 140, Revive, Absolution 80+cleanse 99, Hallelujah 180 all+cleanse 2 — Blessing is a buff and Miracle a swap, not heals) collapses to five distinct roles. Also: Sermon `raceCultSermon` and Tithe `raceCultTithe` are cult-leader rows (ids) parked in Bible Study with SHADOW element and Tithe at 25MP (T2, off ladder) — REWRITE both to light element, Tithe to 50MP. Blessed is a payoff-less status (Sermon, Blessing) — fine, Blessing's regen/def is the effect.
- **Pool gaps:** debuff — intended (healer); Purify leaves with Heavenly Duties, but Exorcism (contract/hexed ×1.5, bonus vs Unholy) is the priest's team hook with a Demon-fighting or Witchcraft-setting partner. DEAD ROW flag: Judgment `judgment` (Light T4) is light/PHYSICAL 160 on a unit with atk 8 — dead for priest, nordic, angel, seraphim and orb of light (five of Light's eight races). REWRITE Judgment to magic.
- **Identity in one line:** the cleanse/shield healer: Absolution + Prayer (150 barrier) + Protect keep one carry alive, Hallelujah resets the team, Exorcism finishes a Contracted/Hexed demon.

### Wizard `wizard` — caster · chaos · human/unholy · pool 18
- **Now:** Arcane Magic (4) · Lightning Magic (2) · Fire Magic (4) · Ice Magic (8)
- **Fit:** all four ✓ — the classic elementalist; rungs Arcane Sigil, Spellsteal, Polymorph, Absolute Zero.
- **Proposed families:** all KEPT. Inside the pool: Ice Shard `raceIceShard` (T1 100 + slow1, rng 3) is strictly worse than Ice Spear `raceIceSpear` (T1 100 + slow2, rng 5) in the same family — DELETE Ice Shard (or make it the T1 with rng 3 and dmg 110 and no slow; the game does not need both). Scorched Earth `sharedScorchedEarth` (T3 70 dmg, scorched line) is strictly worse than Wall of Fire `wallOfFire` (T3 80 + burn2 + a wall that keeps burning) — DELETE Scorched Earth (it is also on the dmg-vs-tier outlier list). Fireball `fire1` (T1 80, no rider) is the weakest T1 in the pool — REWRITE to 100 + burn1 so Meteor's burn×1.5 is set up by the family's own T1. Lightning Magic is two T2 rows (Thunderbolt 130 chain, Thunderstorm) — family auditors: it needs a T1/T3/T4.
- **Pool gaps:** sustain, movement — intended (glass caster, mp 255). T4 count 2 (Meteor, Absolute Zero) is right; six T3s is where the fat is (Polymorph, Wish Granted, Scorched Earth, Wall of Fire, Diamond Dust, Permafrost).
- **Identity in one line:** the control caster: Permafrost/Flash Freeze/Ice Spear set slow and frozen, Polymorph/Spellsteal disarm the enemy carry, Meteor + Absolute Zero pay off; a natural partner for Cross Slash / Judgment slow-finishers.

### Fortune Teller `fortune teller` — support · time · human/anomaly · pool 7
- **Now:** Fortune Telling (3) · Witchcraft (3) · Astrology (1)
- **Fit:** Fortune Telling ✓ · Witchcraft ✓ borderline (a reader, not a witch — but the rung `raceCurseOfMisfortune` = Family Curse lives there and Crystal Ball pays off hexed, so the curse IS her design) · Astrology ✓ (one row, Star Crossed).
- **Proposed families:** Fortune Telling KEPT · Witchcraft KEPT · Astrology KEPT · Astral Projection ADDED (Astral Barrier, Spirit Walk: crystal scrying and spirit contact are her trade — Palm Read's id is literally `raceSpiritChannel`). Pool 7 is the worst in the game; the families are stubs. Grow them: Astrology NEW T2 "Mercury Retrograde" (zoneDebuff 3×3 discord1, 2 rounds), NEW T3 "Eclipse" (aoe r1 100 magic + blind1), NEW T4 "Grand Alignment" (team warCry: +1 to a random stat of every ally, 3 rounds — the T4 Tarot Draw); Fortune Telling NEW T3 "Bad Omen" (debuff: marked3 + the target's next spell costs +25 MP). Witchcraft: Hex of Agony `sharedHexOfToil` (T2 hexed3) and Family Curse `raceCurseOfMisfortune` (T3 hexed3) are the identical row a tier apart — REWRITE Family Curse to a 3×3 hexed3 ("the whole family"). Hocus Pocus `raceHocusPocus` (T4 180 at 25MP) — RECOST to 100. Pool 7 → 13 after Astral (2) + 4 new rows + nothing removed.
- **Pool gaps:** movement — intended (support). Sustain is Palm Read (190 + cleanse2) alone; Astral Barrier adds a team shield.
- **Identity in one line:** the hex support: Tarot Draw random team stages, Palm Read the big heal, Family Curse → Crystal Ball (and a teammate's Crow Storm / Exorcism), Star Crossed per-target zodiac debuff.

### Giant `giant` — tank · time · human · pool 20
- **Now:** Giant Abilities (4) · Earth Abilities (10) · Dirty Fighting (7)
- **Fit:** Giant Abilities ✓ · Earth Abilities ✓ (Boulder Hurl, Earthen Grasp rungs; "skeletal density exceeds titanium") · Dirty Fighting ✓ loosely — a clumsy brute grabs, stomps and crushes (Iron Grip is the most giant row in the game; Curb Stomp, Brutal Slam fit); the ONE misfit row is Dark Justice `raceDarkJustice` (an antihero line, "bonusVsDebuffed" DEAD field) — MOVE it to Superhero Powers.
- **Proposed families:** all KEPT. Giant Abilities has no T1/T2 (0/0/2/2): NEW T2 "Loom" (taunt2 on enemies within 2 + def+1 self) — the tank has no taunt. Giant Smash `raceGiantSmash` (T4 dash 170 + stun1) and Colossal Crush `raceColossalCrush` (T4 180 stagger×1.5, 2AP) plus Earth's Quake/Rampart/Stone Drop (Stone Drop needs flight) and Dirty Fighting's No Mercy give this pool SIX T4s — Rampart `rampart` (T4 60 dmg wall) belongs at T2 with Walls of Camelot/Gothic Rampart; RETIER.
- **Pool gaps:** sustain — intended (hp 815, def 94). Movement — intended (Titan Drop leaps). Buff — Loom covers it. THE real hole: **mp 60**. Every T4 in this pool costs 100 MP and every T3 75; the giant can cast one T2 per match unless MP regen carries it. Either raise MP to ~140 or RECOST the giant's rungs (Fee Fi Fo Fum `raceTitanStep` T3 → 50, Colossal Crush T4 → 75). Same problem on Robot (mp 50).
- **Identity in one line:** stagger engine and payoff in one body: Tremor Stomp/Fissure/Stonefall stagger, Colossal Crush/Stone Drop/Boulder Hurl/No Mercy pay it; Iron Grip + Rampart hold the lane.

### Fairy `fairy` — support · chaos · anomaly · pool 14
- **Now:** Fae Magic (6) · Trickery (4) · Nature Magic (4)
- **Fit:** Fae Magic ✓ · Trickery ✓ (fae are tricksters; Trick Room rung) · Nature Magic ✓ for the family THEME (growth, seeds, thorns — a woodland sprite) but ✗ for two of its rows: Trunk Throw `trunkThrow` (a 12 cm fairy throwing a tree) and Ayahuasca Retreat `raceAyahuascaRetreat` are Bigfoot/Shaman rows parked in a shared family. Keep only if the family auditors move those two out (Trunk Throw → Sasquatch Abilities, Ayahuasca → Drug Use).
- **Proposed families:** Fae Magic KEPT · Trickery KEPT · Nature Magic KEPT (conditionally, see above — Herbal Remedy is the fairy's only heal). Blind is a DEAD status (Glitter Bomb, Sparkle's trail, Pepper Spray set it; nothing pays it) — REWRITE Fae Ring `raceFaeRing` to add finisher blind ×1.5 ("they never saw the ring"), which makes Glitter Bomb → Fae Ring the fairy's own chain.
- **Pool gaps:** debuff — not a hole: Glitterburst (def-1 aoe) and Glitter Bomb (blind) are its debuffs. Sustain is Herbal Remedy + Treeline Retreat regen. Pixie Dust (single, +2 MOV) vs Fairy Dust (team levitate) are distinct.
- **Identity in one line:** mobility support: Fairy Dust gives the whole team flight for the high-ground bonus, Pixie Dust launches one diver, Trick Room flips turn order for a slow-tank team, Glitter Bomb → Fae Ring.

### Martian `martian` — ranged · space · alien · pool 17
- **Now:** Alien Weapons (6) · UFO Features (6) · Fire Magic (4) · Desert Acclimation (2)
- **Fit:** Alien Weapons ✓ (Heat Ray + Shrink Ray rungs; "natural affinity for energy weapon discharge") · UFO Features ✓ (Low Gravity, War of the Worlds rungs) · Fire Magic ✗ — a martian with a heat ray is not a fire mage; Fireball/Wall of Fire/Meteor are wizardry, and they scale on int 30 (atk 88) so they are dead rows anyway · Desert Acclimation ✓ (Mars is a desert; Dust Devil, Sandstorm rung).
- **Proposed families:** Alien Weapons KEPT · UFO Features KEPT · Desert Acclimation KEPT · Fire Magic REMOVED. Pool 17 → 13. Damage-type flag: the martian is atk 88 / int 30 but UFO Features is entirely magic (Probe psychic, Abduction Beam light, Crop Circle nature, War of the Worlds metal/magic) — its T4 rung does not scale with its stats. REWRITE War of the Worlds `raceWarOfTheWorlds` to physical (strafing saucers are ordnance). Alien Weapons is 3/0/3/0 with two T3 Plasma Whips (alias) — family auditors: needs a T2 and a T4 ("Death Ray" line physical 160).
- **Pool gaps:** sustain, movement, buff — all intended for a ranged gunner; Low Gravity is its team utility. Heat Ray's burn has no payoff left once Meteor goes — pair with a Swordfighter (Dragon Slash) or Marksman (Fire for Effect).
- **Identity in one line:** the anti-flyer / anti-bruiser gunner: Heat Ray burn for a payoff teammate, Shrink Ray (minimize) on the enemy tank, Dust Devil + Low Gravity to reposition the fight, War of the Worlds wide AOE.

### Nordic `nordic` — support · time · alien · pool 16
- **Now:** Galactic Federation Protocol (3) · Light (8) · Alien Weapons (6)
- **Fit:** Galactic Federation Protocol ✓ (nordic-only, not flagged UNIQUE) · Light ✓ (Pleiadian light; Aurora Ray + Light Shield `racePleiadianShield` rungs) · Alien Weapons ✗ — the "benevolent" tall alien does not carry a plasma whip or a heat ray; and Heat Ray/Plasma Whip are physical on atk 22, so 2 of the family's 5 real rows are dead (the second Plasma Whip is the `raceLavaLamp` alias). The lore says "telepathic capability" and nothing about guns.
- **Proposed families:** Galactic Federation Protocol KEPT · Light KEPT · Alien Weapons REMOVED · Psychic Abilities ADDED (8 rows; int 88; Telepathic Link/Psychic Barrier/Teleport are exactly a telepathic benefactor's kit). Pool 16 → 19 (−5 +8; 20 with First Contact). Rungs (Aurora Ray, Pleiadian Shield, Stasis Beam, Nordic Accord) all stay. GFP is 1/0/1/1 — NEW T2 "First Contact" (ally cleanse 2 + shield 100) fills the ladder. Nordic Accord `raceNordicAccord` is typed heal/healAll with heal:0 — REWRITE its kind to effect/warCry.
- **Pool gaps:** movement — Teleport (Psychic) fixes it. Stasis Beam (stun1) → Aurora Ray (stun×1.5) is self-contained; Merkaba's burn is not (fine).
- **Identity in one line:** stun support: Stasis Beam → Aurora Ray / a teammate's Take Aim, Light Shield (220 + def+1) + Federation Beacon regen for sustain, Nordic Accord + Telepathic Link for a caster team.

### Grey `grey` — support · chaos · alien · pool 17
- **Now:** UFO Features (6) · Psychic Abilities (8) · Cryptid Abilities (3)
- **Fit:** UFO Features ✓ (abductions; all four rungs) · Psychic Abilities ✓ ("psionic capability: EXTREME", telepathic networks) · Cryptid Abilities ✓ loosely — the blurry-photo/vanish rows are the UFO-sighting trope too, and Dread Aura is "do not make sustained eye contact".
- **Proposed families:** all KEPT. Marked is a DEAD status and the grey sets it (Implant `raceImplant` marked3): REWRITE Abduction Beam `raceAbductionBeam` to add finisher marked ×1.5 ("the implant guides the beam") so Implant → Abduction Beam is the grey's own chain.
- **Pool gaps:** sustain — Psychic Barrier (shield 150) is its sustain; intended for a debuff-and-displacement support. Four T4 nukes for a "support" (Crop Circle, War of the Worlds, Migraine, Mind Shatter) — it is really a caster; fine.
- **Identity in one line:** the displacement support: Abduction Beam/Kinetic Hurl throws, Teleport anyone, Low Gravity for the team's jumpers, Psychosis/Implant softening, Migraine/Mind Shatter payoffs.

### Bigfoot `bigfoot` — bruiser · space · anomaly · pool 12
- **Now:** Sasquatch Abilties (2) · Nature Magic (4) · Cryptid Abilities (3) · Agriculture (3)
- **Fit:** Sasquatch ✓ (fix the family spelling "Abilties") · Nature Magic ✓ (forest; Treeline Retreat and Trunk Throw are its own rungs) · Cryptid Abilities ✓ (Dread Aura, Blurry Photo `raceRealityShift` rungs) · Agriculture ✗ — Bigfoot does not plant Healing/Poison/Leech Seeds; he lives in the woods, he does not farm them.
- **Proposed families:** Sasquatch KEPT · Nature Magic KEPT · Cryptid KEPT · Agriculture REMOVED · Athleticism ADDED ("extraordinary stealth despite massive frame", 180 kg athlete; Thick Hide is literally fur, Nimble Dodge is the vanishing act, Unstoppable Charge sets stagger). Sasquatch is T1+T4 only — NEW T3 "Treeline Charge" (damageEffect/dash 125 + stagger1): Sasquatch Smash `raceSasquatchSmash` pays off stagger and the race currently cannot set it (synergy.md: needs teammate). NEW T2 "Wood Knock" (the famous knock: taunt2 on enemies within 3). Trunk Throw `trunkThrow` (T3 100, under-tuned list) → 125 base. Pool 12 → 9 → 15 (Athleticism is 4 real rows — the second Rampage is the `raceRampage` alias — plus the 2 new Sasquatch rows).
- **Pool gaps:** none flagged; sustain is Treeline Retreat regen + Herbal Remedy + Healing Seed (gone). Movement is Treeline Retreat / Cryptid Vanish.
- **Identity in one line:** stealth bruiser: Blurry Photo/Treeline Retreat vanish-and-regen, Dread Aura discord on the clump, Treeline Charge stagger → Sasquatch Smash.

### Shadow Entity `shadow entity` — assassin · time · anomaly · pool 20
- **Now:** Shadow (8) · Poltergeist Abilities (5) · Spy Gear (7)
- **Fit:** Shadow ✓ · Poltergeist Abilities ✓ (non-corporeal, haunts) · Spy Gear ✗ — a non-corporeal silhouette throwing knives, lobbing EMP grenades and planting bombs is the yeti/Christmas case exactly; it is on the list only because the rung `sharedSmokeScreen` lives there.
- **Proposed families:** Shadow KEPT · Poltergeist KEPT · Spy Gear REMOVED; rung `sharedSmokeScreen` → `raceFear` (Shadow T2, "let them see what you are" — the rung reads better than smoke). Pool 20 → 13 with a clean ladder (T1 3 / T2 4 / T3 3 / T4 3). Shadow Infiltration `raceShadowInfiltration` (T2 2AP dash 120 + poison3) is on the tier-offender list; at 2AP it is fine, but its poison payoff (Sneak Slash) leaves with Spy Gear — pair with a Life Sap/Marrowstorm teammate. Grim Resolve `raceGrimResolve` T2 at 25MP — RECOST 50.
- **Pool gaps:** sustain — intended (assassin). Haunt → Boo (haunted×1.5) and Shadow Crush (slow → slow×1.5) are self-contained; Cold Spot (frozen zone) is a gift to a Yeti/Santa teammate.
- **Identity in one line:** the isolator: Shadow Realm drags one target into a 1v1, Haunt → Boo, Fear scatters the rest, Shadow Step blinks through walls (ignores line of sight) and Void Rush teleports-and-blasts.

### Reptilian `reptilian` — assassin · chaos · anomaly · pool 20
- **Now:** Conspiracy Knowledge (4) · Trickery (4) · Poison Abilities (5) · Spy Gear (7)
- **Fit:** Conspiracy Knowledge ✓ (the reptilian RUNS the chemtrails and the fluoride; Flat Earth `raceTruthBomb` is its rung — only Tin Foil Hat is the theorist's row) · Trickery ✓ (chameleon skin; Shed Skin rung) · Poison ✓ (Poison Swamp rung; saurian venom) · Spy Gear ✓ ("infiltration expertise"; Smoke Screen rung).
- **Proposed families:** all KEPT. Damage-type flag: atk 86 / int 31, but the T4 rung Flat Earth is magic 180 and every Conspiracy damage row plus four of the five Poison rows are magic (only Infectious Bite `raceInfectiousBite` is poison/physical) — the setups can stay weak magic, but REWRITE Flat Earth to physical (a tail-slam that flattens the ground; keep finisher silence,poison ×1.5) so the rung scales with the assassin.
- **Pool gaps:** sustain — Shed Skin cleanse 1 + decoy; intended. Debuff — Chemtrails poison2, Fluoride Water silence2, Poison Dart poison3 are its setups; Sneak Slash/Flat Earth/Formic Acid pay them, all self-contained.
- **Identity in one line:** poison-and-silence assassin: Poison Dart/Chemtrails/Poison Swamp set, Smoke Screen or the Shed Skin decoy hides it, Sneak Slash (bonus while invisible) and Flat Earth pay; Fluoride Water silences a caster line.

### AI `ai` — specialist · space · tech · pool 10
- **Now:** Artificial Intelligence (4) · Computer Hacking Skills (6) · Internet Addiction (0)
- **Fit:** Artificial Intelligence ✓ (all four rungs) · Computer Hacking Skills ✓ · Internet Addiction ✗ — empty family, and an AGI is not "addicted"; that is the conspiracy theorist's joke.
- **Proposed families:** Artificial Intelligence KEPT · Computer Hacking KEPT · Internet Addiction REMOVED (RACE_REMOVE; the family auditors can FAMILY_DELETE it or hand it to the theorist with rows) · Engineering ADDED (Repair, Deploy Turret, 5G Tower, Clockwork Turret, Overtinker — an AI directing drones and towers is the "specialist" deployer the class name promises, and Repair is the missing sustain). Pool 10 → 15. Inside AI: Predictive Model `racePredictiveModel` sets marked3 (DEAD status) and Recursive Loop `raceRecursiveLoop` has the DEAD field bonusVsDebuffed — REWRITE Recursive Loop to finisher marked ×1.5 so the T1 → T3 chain is real. Inside Hacking: Neural Hack `raceNeuralHack` (T3 jammed1) is strictly worse than Memory Leak `raceMemoryLeak` (T2 jammed2) in the same family — REWRITE Neural Hack to possess a TECH enemy for its next activation (possessed1) and jammed2 on anything else; it is the android's rung and deserves to be a T3.
- **Pool gaps:** sustain — Firewall Protocol shield 120 + Repair (Engineering). Movement — intended (a processing unit on treads). No T4 beyond Singularity: Overtinker (T4 shield) adds one.
- **Identity in one line:** jam engine: Memory Leak/Neural Hack → Crash Loop (and a teammate's Railgun), Predictive Model → Recursive Loop, turrets + Firewall hold the line, Singularity pulls the clump for an AOE teammate.

### Robot `robot` — tank · space · tech · pool 13
- **Now:** Robotic Hardware (10) · Machinery (1) · Robotic Weapons (5)
- **Fit:** Robotic Hardware ✓ · Machinery ✓ but it is one row (Hydraulic Crush `raceHydraulicCrush`, a rung) shared with the honda civic — FAMILY_MERGE Machinery into Robotic Hardware (Hydraulic Crush T3 135 jammed×1.5 is the twin of Robo Punch T3 135 stagger×1.5; both can live in Hardware) · Robotic Weapons ✓ in theme, ✗ in numbers: int 3, and Taser Bolt / Cluster Rockets / Plasma Cannon are MAGIC — dead rows on this unit; To the Moon requires flight. Only Synthetic Blade is usable.
- **Proposed families:** Robotic Hardware KEPT · Robotic Weapons KEPT with REWRITES: Cluster Rockets `raceClusterRockets` and Plasma Cannon `racePlasmaCannon` to physical damage (rockets and a cannon are ordnance), Taser Bolt `raceTaserBolt` stays magic (it is the android/cyborg row) · Machinery MERGED away. EMP Burst `empBurst` (T4 lightning/magic 160 + jammed1) is also dead on int 3 — REWRITE to an effect row: no damage, jammed2 self-aoe r2, RETIER T3 (75MP); Kill Mode stays the physical T4 AOE. Pool stays 13 (the Machinery fold moves Hydraulic Crush into Robotic Hardware — a rename, not a loss).
- **Pool gaps:** movement — intended (tank); Rocket Fist's knockback is its positioning. Debuff — EMP (jam) → Synthetic Punch / Hydraulic Crush / Synthetic Blade payoffs, self-contained once EMP is castable. THE hole: **mp 50** — Overclock (50) once, then nothing; Kill Mode/EMP at 100 never. Raise MP to ~120 or RECOST the rungs (see Giant).
- **Identity in one line:** the jammer tank: EMP jams the clump, Synthetic Punch/Hydraulic Crush/Synthetic Blade pay it, Overclock a carry, Kill Mode point-blank AOE when surrounded.

### Android `android` — assassin · space · tech · pool 18
- **Now:** Robotic Hardware (10) · Computer Hacking Skills (6) · Robotic Weapons (5)
- **Fit:** Robotic Hardware ✓ (Self-Repair, EMP rungs) · Computer Hacking ✓ (Neural Hack rung) · Robotic Weapons ✓ (Synthetic Blade rung).
- **Proposed families:** all KEPT · Trickery ADDED — the lore is "capable of mimicking any observed behavior pattern" and Trickery's T4 is named Mimicry `raceMimicry`; Shed Skin (decoy + 2-tile escape) and Skin Swap are the movement rows the assassin lacks. Pool 18 → 22. Same damage-type note as Robot (atk 75 / int 31): the Robotic Weapons rewrite to physical serves the android too.
- **Pool gaps:** movement — a hole for a spd-60 assassin; Trickery fixes it (Overclock's +1 MOV is not a dash). Sustain is Self-Repair (35% + cleanse 1). Jam chain is fully self-contained (Memory Leak/Neural Hack/EMP → Synthetic Blade/Punch/Crash Loop/Taser Bolt), and so is Robo Punch's stagger (Cluster Rockets `raceClusterRockets` sets stagger1 in the same pool).
- **Identity in one line:** the jam-payoff duelist: Memory Leak/Neural Hack set, Synthetic Blade/Punch/Crash Loop pay, Self-Repair sustains, Shed Skin decoy out and Mimicry (+2/+2) for the last fight.

### Angel `angel` — healer · time · divine · pool 21
- **Now:** Heavenly Duties (7) · Light (8) · Wind Control (3) · Healing Magic (3)
- **Fit:** Heavenly Duties ✓ (Wings of Mercy, Sanctuary, Divine Smite, Radiant Bolt rungs) · Light ✓ · Wind Control ✗ — wings are not weather; the family is gusts/knockback (Wing Attack 80 physical, Sky Tackle 110 physical) on a unit with atk 8: two of three rows dead, the third (Vortex Slam) is a storm-caller's row · Healing Magic ✓.
- **Proposed families:** Heavenly Duties KEPT · Light KEPT · Healing Magic KEPT · Wind Control REMOVED. Pool 21 → 18. Inside the pool: Divine Light `raceDivineLight` (T1 heal 140) is strictly worse than Heal `heal1` (T1 192, more below 40%) — REWRITE Divine Light so it differs: heal 140 on the ally AND 70 light damage to every enemy adjacent to them (holy radiance). Judgment (physical) dead row, see Priest.
- **Pool gaps:** debuff — intended (healer); Purify strips enemy buffs. Six heal rows is still a lot (Divine Light, Purify, Sanctuary, Heal, Heal All, Revive — Miracle is a swap, not a heal row) but each is a different shape.
- **Identity in one line:** the zone healer: Sanctuary + Heal All + Miracle (swap-and-heal) keep a melee team standing, Purify cleans both sides, Protect/Rapture on the carry, Divine Smite vs the unholy.

### Seraphim `seraphim` — caster · time · divine · pool 22
- **Now:** Heavenly Duties (7) · Bible Study (7) · Light (8)
- **Fit:** Heavenly Duties ✓ (Rapture, Sanctuary rungs) · Bible Study ✗ — sermons, tithes (Tithe TAKES AN ITEM), prayer and Hallelujah are the human clergy's family (priest, nun); a six-winged celestial whose "energy output exceeds a small nuclear detonation" is the subject of the book, not its student. Rung `raceAbsolution` is the only tie · Light ✓ (Merkaba rung).
- **Proposed families:** Heavenly Duties KEPT · Light KEPT · Bible Study REMOVED; rung `raceAbsolution` → `raceDivineLight` (Heavenly Duties T1). Pool 22 → 15. The caster problem: the seraph has FOUR finishers that all need a teammate (Exorcism leaves; Aurora Ray stun, Judgment slow, Merkaba burn remain) and cannot set any of them — NEW T3 in Heavenly Duties "Seraphic Fire" (light/magic aoe r1 125 + burn2, 75MP: the six wings of flame) makes Merkaba self-contained and gives the family a real damage rung between Radiant Bolt and Divine Smite.
- **Pool gaps:** debuff — with Seraphic Fire (burn) and Purify it is covered; before that it was a hole for a caster.
- **Identity in one line:** the burst caster of the holy team: Seraphic Fire → Merkaba, a Nordic's Stasis Beam → Aurora Ray, Divine Smite vs the unholy; Sanctuary/Rapture as its support side.

### Orb of Light `orb of light` — support · time · divine · pool 22
- **Now:** Light (8) · Cosmic Abilities (11) · Healing Magic (3)
- **Fit:** Light ✓ (Aurora Ray, Luminous Shield, Prism Burst rungs) · Cosmic Abilities ✓ ("mass undetectable", Category OMEGA — a star; Supernova rung) · Healing Magic ✓ (radiates "profound understanding"; the support half).
- **Proposed families:** all KEPT. Inside the pool: Luminous Shield `raceLuminousShield` (T2 aoeShield 140, aoe r0) is strictly worse than Light Shield `racePleiadianShield` (T2 aoeShield 220 + def+1, aoe r0) in the same family and tier — REWRITE Luminous Shield to a 3×3 (aoe r1) 120 shield so it is the group version. Dead rows for atk 8: Cosmic Slam `raceCosmicSlam` (physical) and Judgment (physical). Black Hole `sharedBlackHole` T4 at 75MP — RECOST 100.
- **Pool gaps:** debuff — Entropic Beam/Supernova (def-1), Gravity Well/Black Hole (slow) are its debuffs; intended. Seven T4s (Judgment, Merkaba, Black Hole, Heat Death, Star Decree, Supernova, Revive) — Cosmic's 4 T4s are the cause; not the orb's problem. Slow chain fully self-contained (Gravity Well → Entropic Beam/Star Decree/Judgment).
- **Identity in one line:** the slow-payoff artillery support: Gravity Well/Black Hole slow-and-pull, Entropic Beam/Star Decree pay it, Light Shield + Heal All for the team, Supernova when dived.

### Demon `demon` — bruiser · chaos · unholy · pool 23
- **Now:** Demonic Abilities (8) · Shadow (8) · Fire Magic (4) · Blood Magic (3)
- **Fit:** Demonic Abilities ✓ · Shadow ✓ (Shadow Realm rung) · Fire Magic ✓ ("thermal rifts, 1,200°C surface") · Blood Magic ✓ (feeds, contracts).
- **Proposed families:** all KEPT. Class flag: "bruiser" with atk 48 / int 76 — it is a caster-bruiser; Demonic Claw `raceDemonicClaw` (T4 physical 180) and Infernal Hurl (physical, requires flight) are weak on it, Hellmouth/Meteor/Devour Soul are its real damage. Blood Ritual `raceBloodRitual` (T3 atk+1, self-damage 10%) is Inner Demon `raceInnerDemon` (T1 atk+1, self-damage 20%) two tiers up in the same pool — REWRITE Blood Ritual to atk+1 AND int+1 (the demon's two halves). Pool 23 is under the cap; no removal needed.
- **Pool gaps:** none in summary.md. Contract/Soul Bind → Devour Soul, Fireball(burn, after rewrite) → Meteor, Shadow Crush slow → slow are all self-contained.
- **Identity in one line:** contract bruiser-caster: Contract/Soul Bind → Devour Soul drain, Shadow Realm to isolate the enemy carry, Hellmouth lava lane, Meteor for the clump.

### Succubus `succubus` — support · chaos · unholy · pool 17
- **Now:** Seduction (5) · Dream Predation (4) · Demonic Abilities (8)
- **Fit:** Seduction ✓ · Dream Predation ✓ (Sleep Paralysis rung; incubus/succubus lore) · Demonic Abilities ✓ (infernal origin) — but Demonic Claw (physical 180 on atk 16) and Infernal Hurl (physical, flight) are dead rows for her; Contract/Soul Bind/Devour Soul/Hellmouth (magic) and Demonic Roar (a no-damage stagger roar) are the live ones, Inner Demon (ATK+1) is pointless on atk 16.
- **Proposed families:** all KEPT. Inside Seduction: Soul Suck `raceSoulSuck` (T1 100 dmg, drain 60%, charm1) is strictly better than Charm `raceCharm` (T2 charm1, nothing else) a tier below it — REWRITE Charm to a 3×3 (aoe r1) charm1 at rng 3 ("the whole room falls for her"), so it is the group setup for Enthrall (×2 activations if Charmed) and Draining Embrace.
- **Pool gaps:** movement — intended (support). Charm → Enthrall/Draining Embrace, Dream Siphon (stun payoff, but nothing in the pool sets stun) — Eternal Slumber sets stun1 at T4; fine. Sleep Paralysis root2 is a gift to a Pirate/Marksman teammate.
- **Identity in one line:** the mind-control support: Charm/Soul Suck → Enthrall (two activations) or Draining Embrace, Contract to heal off the enemy carry, Eternal Slumber stuns the clump.

### Skeleton `skeleton` — bruiser · chaos · unholy · pool 14
- **Now:** Bone Density (4) · Poltergeist Abilities (5) · Swordsmanship (5)
- **Fit:** Bone Density ✓ (Bone Toss, Reassemble, Bone Barrage, Marrowstorm rungs) · Poltergeist Abilities ✓ (undead; "animating field"; Grave Chill rung) · Swordsmanship ✓ (the classic skeleton warrior).
- **Proposed families:** all KEPT. The lore says "moves faster than biomechanics should permit" and the pool has no movement: REWRITE Reassemble `raceReassemble` (T2 selfHeal 30%) into "the bones scatter and re-form": teleport 3 tiles + heal 20% — sustain and movement in one rung. Poltergeist rows are magic (Grave Chill, Boo 180) on int 42 — mediocre but not dead.
- **Pool gaps:** movement — Reassemble rewrite. Buff — intended (bruiser). Marrowstorm (poison×1.5) and Dragon Slash (burn×1.5, and the skeleton is fire-weak) need teammates; Haunt → Boo and Cross Slash (Grave Chill slow) are self-contained.
- **Identity in one line:** the DEF-ignoring bruiser: Bone Toss/Marrowstorm ignore armor, Haunt → Boo, Cold Spot for a Frozen teammate; wants a Poison setter (Reptilian) for Marrowstorm.

### Mech `mech` — tank · space · human/tech · pool 17
- **Now:** Mech Pilot Skills (3) · Military Combat (10) · Robotic Weapons (5)
- **Fit:** Mech Pilot Skills ✓ (mech-only, not flagged UNIQUE; Mortar, Siege Mode, Eject rungs) · Military Combat ✓ (a combat vehicle; Nuke rung) · Robotic Weapons ✓ (Cluster Rockets and Plasma Cannon ARE the mech — after the physical rewrite they scale on its atk 54; today they are magic on int 30).
- **Proposed families:** all KEPT. Mech Pilot Skills has no T4 — NEW T4 "Reactor Vent" (self-aoe r2 fire 160 + burn2: the rear coolant manifold blows) gives the mech its own ender and a burn setter for Fire for Effect. Siege Mode `raceSiegeMode` (T2 atk+1) is the generic self-buff row — REWRITE to the mech's identity: cannot move this round, +2 RNG, +1 ATK and +1 DEF stage (a Transform-style stance). Mortar Salvo `raceMortarSalvo` (T1 aoe r1 100 rng 5 through cover at 25MP) is on the over-tuned T1 list and is the same row as Skyscraper Toss (T3 125) — keep it T1 (it is rung 1) at dmg 80.
- **Pool gaps:** debuff — Suppressive Fire slow2, Cluster Rockets stagger1 are its setups; a tank with no taunt is the real gap — if the family auditors add a Military "Draw Fire" taunt, the mech should carry it. Sustain: Fortify (single-ally 96 shield) and Iron Dome (team DEF+1) are team sustain; Iron Bulwark `raceIronBulwark` is a self DEF+1 — no self-heal, intended for a 645-HP tank.
- **Identity in one line:** artillery tank: Mortar Salvo/Artillery Strike/Nuke indirect fire, Fortify + Iron Dome for the team, Siege Mode stance, Plasma Cannon burn → Fire for Effect, Eject when the line breaks.

### Pool-size watchlist (running, this slice)
- **Under 12 today:** fortune teller 7 (PROBLEM — support with 2/2/1/2; fixed to 13 by Astral Projection + 4 new Astrology/Fortune rows) · mad scientist 10 (PROBLEM — specialist; fixed to 13 by the Chemistry ladder) · ai 10 (PROBLEM — fixed to 15 by Engineering) · shaman 11 (mild; fixed to 13 by Contact High + Spirit Animal).
- **Under 12 after the proposals above, on purpose:** telepath 11 (fine: 8-row Psychic core; climbs when Astral Projection gets T3/T4) · bigfoot 9 before the adds → 15 after Athleticism (4 real rows) + Treeline Charge + Wood Knock (must land together with the Agriculture cut).
- **Over 24 today:** priest 25 (PROBLEM — eight heal rows; fixed to 18 by cutting Heavenly Duties). marksman 24 is at the cap, not over; no change.
- **Large drops proposed (not problems):** shadow entity 20 → 13, seraphim 22 → 15, angel 21 → 18, martian 17 → 13 — each cut removes a family whose rows were off-theme or dead for the unit's stats, and each keeps a T1-T4 ladder.


---

## R.2 Race fit — Ghost … General (31 races)

### Races part 2 (31 races: ghost … general)

Pool-size watch list (under 12 / over 24), kept running through the section:

| Race | Pool | Verdict |
|---|---|---|
| `anubis` | 10 | Problem — 0 T3 rows, three thin families; fix with two NEW T3 rows below (→ 12). |
| `mothman` | 10 | Problem — a support with 2 dead physical rows; swap Wind Control → Psychic Abilities + one NEW Mothman row (→ 16). |
| `catgirl` | 11 | Problem — Feline Anatomy has no T1/T2; move Pounce in + one NEW row (→ 13). |
| `voidweaver` | 11 | Problem — Arachnid has no T4; NEW Void Cocoon + add Shadow (→ 20). |
| `djinn` | 12 | At the floor, not a problem — every row fires for an INT 83 caster. |
| `goatman` | 12 | At the floor, not a problem — 3 self-contained finishers (Horn Toss, Bull Rush, Baphomet's Rite); the T4 rung re-points from the magic Rite to Bull Rush (see entry). |
| `siren` / `halfdemon` / `mermaid` | 23 | Fine — under 24. |
| `cosmic wraith` | 26 | Problem — Marksmanship is a misfit; removing it lands at 23. |
| `annunaki` | 27 | Problem — Earth + Marksmanship are misfits; swap both for Alien Weapons (→ 20). |

---

### Ghost `ghost` — caster · time · human/anomaly · pool 17
- **Now:** Poltergeist Abilities (5) · Shadow (8) · Trickery (4).
- **Fit:**
  - Poltergeist Abilities ✓ — literally the ghost's kit; all four rungs (`raceHaunt`, `raceColdSpot`, `racePossession`, `raceBoo`) live here.
  - Shadow ✓ — phase-shifting, fear, intangibility; `raceFear` rung. Caveat: `raceShadowInfiltration` (physical dash 120) and `raceGrimResolve` (ATK+1) are dead rows for ATK 0 — the family fits, two rows don't.
  - Trickery ✗ — Shed Skin / Skin Swap / Mimicry are skin-changer rows (skinwalker, reptilian); Mimicry is ATK+2/DEF+2 on an ATK 0 unit. Only Trick Room has poltergeist flavour. The lore hook the ghost actually has — "can inhabit and disrupt electronic systems" — is Computer Hacking Skills (Crash Loop, Memory Leak, Blue Screen, Firewall Protocol): a ghost in the machine.
- **Proposed families:** Poltergeist Abilities KEPT · Shadow KEPT · Trickery REMOVED · Computer Hacking Skills ADDED. Pool 5+8+6 = 19. No rung is displaced.
- **Pool gaps:** summary says *sustain*. Intended — an Incorporeal, poison-immune control caster does not heal. Movement (Shadow Step, Shed Skin, Skin Swap; Phase Shift is an invisibility buff, not a move), debuff (Haunt, Cold Spot, Fear, Boo discord) and T4 (Boo, Shadow Realm, Void Rush) are all present. Haunt → Boo is self-contained (only Haunted payoff in the game).
- **Identity in one line:** possession/haunt control caster — Haunt then Boo, Fear to scatter, Possession to steal a body, Memory Leak jam for the tech teammates' Jammed payoffs.

### Zombie `zombie` — tank · chaos · human/unholy · pool 14
- **Now:** Zombie Behavior (5) · Poison Abilities (5) · Necromancy (4).
- **Fit:**
  - Zombie Behavior ✓ — one-race family; holds rungs 2–4 (Zombie Rush / Cannibalize, Outbreak / Infect, Shambling Horde). The T1 rung `raceInfectiousBite` sits in Poison Abilities.
  - Poison Abilities ✓ — rot and infection; poison-resist; `raceInfectiousBite` is the T1 rung and lives here.
  - Necromancy ✗ — the zombie is the *product* of necromancy, not the practitioner. Life Drain (magic 100), Rigormortis (magic aoe) and Raise the Dead are a necromancer's rows; with INT 0 every damage row here is dead.
- **Proposed families:** Zombie Behavior KEPT · Poison Abilities KEPT · Necromancy REMOVED · Grave Hunger ADDED ("Feeding on the fallen: frenzies, bites and corpse crawls" — that is the zombie; Frenzy 120 + grievous, Ghoulish Bite drain, Carrion Feast 25% self-heal, Corpse Crawl teleport, Terror Pounce 180 physical all fire on ATK 68). Pool 5+5+5 = 15.
- **Pool gaps:** summary: *movement, buff*. Movement is fixed by Corpse Crawl. Buff: intended (mindless). Tier flags: `raceInfect` (T3, 75MP) hands you the enemy for **4 activations with +1 ATK / +1 SPD** while `racePossession` / `raceEnthrall` / `raceCultIndoctrinate` (all T3) give one — keep Infect at T3 (it is the zombie's rung-3 row; a T4 in that slot breaks the ladder) and REWRITE it to 2 activations (status infected 3 rounds), melee-only, +1 ATK / +1 SPD kept — 2 melee-only activations for 75MP sits between Possession (1 free activation) and nothing. `raceZombieRush` T2 130 is in line with the other T2 charges (Land Ho 130, Stampede 130 — plain damage rows, outside the damageEffect tier rule). `raceAmbushLunge` T3 125 (Beast) cannot drop to T2 — it is the sharkman's rung-3 row (`raceBite`, `raceApexCharge`, `raceAmbushLunge`, `raceJurassicJaw`); REWRITE dmg 125 → 135 instead (Robo Punch T3 135 precedent) so the T3 charge earns its tier. [Skeptic: struck the T2 retier and the T4 retier — both displace a rung.]
- **Identity in one line:** horde tank — Infect sets the table for Shambling Horde (its only finisher key is Infected) while Outbreak pays off its own Poison; Cannibalize and Carrion Feast keep it standing; Formic Acid shreds DEF for the team.

### Annunaki `annunaki` — ranged · space · human/alien · pool 27
- **Now:** Cosmic Abilities (11) · Occult Knowledge (4) · Earth Abilities (10) · Marksmanship (3).
- **Fit:**
  - Cosmic Abilities ✓ — sky gods; rungs `raceGravityWell`, `sharedGravityCrush`, `raceStarDecree`. Caveat: the family is magic and the race has INT 31 / ATK 80 — two of the four tree rungs (Gravity Well magic 80, Star Decree magic 160) are weak on its own stats; Pyramid Protocol is earth/physical 80 and Gravity Crush deals no damage (see gaps).
  - Occult Knowledge ✓ — tablets and ziggurats; `raceZigguratProtocol` rung; Weigh the Heart / Ancient Magic.
  - Earth Abilities ✗ — Boulder Hurl, Tremor Stomp, Quake, Stone Drop (needs flight) are giant / gargoyle / golem rows. An ancient astronaut stomping tremors is the yeti-in-Christmas case; the ziggurat wall it should have is already in Occult Knowledge.
  - Marksmanship ✗ — Kneecap Shot / Precision Shot / Take Aim is a rifle sniper's kit. It was added for the "ranged" class label, not the character.
- **Proposed families:** Cosmic Abilities KEPT · Occult Knowledge KEPT · Earth Abilities REMOVED · Marksmanship REMOVED · Alien Weapons ADDED ("technology indistinguishable from magic": Heat Ray fire/physical 100 rng 5 works on ATK 80 — Photon Scatter is magic 80 and will not; Stun Ray, Shrink Ray give control). Pool 11+4+5 = 20 (Plasma Whip alias counted once).
- **Pool gaps:** summary: *sustain, buff, debuff*. Debuff is actually covered (Gravity Well slow, Entropic Beam DEF-1, Shrink Ray minimize). Sustain / buff: intended for artillery. Stat flag: an ATK 80 / INT 31 unit whose four rungs are a magic pull (Gravity Well), a physical wall (Pyramid Protocol), a no-damage utility zone (Gravity Crush) and one magic nuke (Star Decree) — give the Annunaki INT ~70 in the stat pass (the lore is all energy tech). [Skeptic: struck the "swap rung 4 to a physical row" option — none of its three families has a physical T4: Cosmic's four T4s and Occult's two are magic, Alien Weapons has no T4 at all.] Gravity Well (T1) sets Slow and Entropic Beam / Star Decree pay it off, so the tree is self-contained once the stats agree.
- **Identity in one line:** gravity artillery — Gravity Well cluster-and-slow, Pyramid Protocol to shape lanes, Star Decree / Entropic Beam Slow finishers, Heat Ray for a physical poke.

### Skinwalker `skinwalker` — assassin · chaos · human/anomaly · pool 18
- **Now:** Trickery (4) · Beast Abilities (7) · Black Magic (4) · Cryptid Abilities (3).
- **Fit:**
  - Trickery ✓ — the family is built around it (`raceShedSkin`, `raceSkinSwap`, `raceMimicry` rungs).
  - Beast Abilities ✓/✗ — thematically right (it becomes the animal; `raceBorrowedClaw` is its T1 rung) but the race has **ATK 28 / INT 88**, so all seven physical rows are dead. Identity says yes, stats say no.
  - Black Magic ✓ — Navajo witch; Voodoo, Sacrifice, Baphomet's Rite.
  - Cryptid Abilities ✓ — it is a cryptid; Dread Aura / Blurry Photo / Cryptid Vanish.
- **Proposed families:** Trickery KEPT · Black Magic KEPT · Cryptid Abilities KEPT · Beast Abilities REMOVED, with MOVE `raceBorrowedClaw` → Trickery (it is a stealSpell mimic move, the trickster's claw) and REWRITE it to `T1 · damage/damage · -/magic · 25MP 1AP CD3 · dmg 100 · rng 1 · single · stealSpell` (same numbers, magic type) so the rung fires on INT 88; Trickery gains its missing T1 for all ten owners (rabbit ATK 80 / reptilian lose a little on the hit, keep the steal). Pool 5+4+3 = 12. Alternative if the stat pass gives the skinwalker ATK ~70 instead: keep Beast Abilities and leave Borrowed Claw where it is.
- **Pool gaps:** no sustain (Sacrifice is a transfer), one debuff (Dread Aura), no self-contained finisher (Baphomet's Rite wants Stagger). Acceptable for a body-swap trickster; the team supplies Stagger. `raceDeathPact` (ATK+1) is dead for it — REWRITE to "+1 ATK and +1 M ATK" so goatman and skinwalker both use it.
- **Identity in one line:** body-swap trickster — Skin Swap / Shed Skin repositioning, Voodoo link + Dread Aura debuffs, Borrowed Claw steals a spell, Trick Room flips the turn order.

### Werewolf `werewolf` — bruiser · chaos · human/unholy · pool 13
- **Now:** Werewolf Powers (2) · Beast Abilities (7) · Hunting Skills (4).
- **Fit:**
  - Werewolf Powers ✓ — unique; `raceHowl`, `raceBloodFrenzy` rungs.
  - Beast Abilities ✓ — `raceBite`, `raceFeralDive` rungs; Pounce / Predator Leap are wolf moves.
  - Hunting Skills ✗ — Long Rifle and Whistle (summon a hound) are cowboy / marksman rows. A werewolf with a long rifle is the yeti-Christmas case; Camouflage and Forest Ambush are the only two that suit it.
- **Proposed families:** Werewolf Powers KEPT (grown to 4 rows) · Beast Abilities KEPT · Hunting Skills REMOVED · Apex Predator ADDED (Primal Roar discord, Stampede dash+stagger, Apex Roar team ATK, Jurassic Jaw 180 stagger finisher — a lunar apex predator; gives the pool its first AOE, debuff and self-contained finisher). Yeti test: the family is "stampedes, roars and the jaw at the top of the food chain" and a wolf IS an apex predator, so it passes; `raceJurassicJaw` is the one dinosaur-flavoured NAME — the family auditor should rename it (e.g. "Killing Jaw") once a non-dinosaur owns it. Pool 4+7+4 = 15.
  - Werewolf Powers fill: NEW T1 **Rend** (damageEffect/damage · -/physical · 25MP 1AP · dmg 100 · rng 1 · single · grievous 2 — "regeneration in transformed state" mirrored as a heal-shutdown claw; Bite in the same pool is the drain, Rend is the wound); REWRITE `raceHowl` (T2, 50MP 1AP, rng 0, aura r3) from self ATK+1 into the pack's tempo call: every ally within 3 (self included) gains +1 SPD stage for 3 rounds [Skeptic: the draft's team-ATK Howl was struck — Apex Roar (T3, 75MP, allies ATK+1, aura r2) arrives with Apex Predator, and a 50MP T2 copy would make the T3 dead in the same pool; the "duplicate of Forest Ambush / Death Pact" claim is also void — neither row is in the pool once Hunting Skills leaves, and Black Magic never was]; NEW T3 **Lunar Regeneration** (heal/selfHeal · 75MP 1AP CD2 · rng 0 · self-heal 35% + cleanse 1 — the lore's "catastrophic wounds heal in minutes"; Carrion Feast T3 is 25%, so 35% + cleanse is the tier); `raceBloodFrenzy` T4 stays.
- **Pool gaps:** summary: *movement, AOE, debuff*. Movement was never missing (Feral Dive / Predator Leap are leapStrikes; Pounce is a plain rng-3 strike with no move; Stampede is a dash). AOE and debuff arrive with Primal Roar. Sustain arrives with Lunar Regeneration. Stat flag: ATK 50 is low for a bruiser whose pool is 100% physical (goatman 94, antperson 94) — unless Lycanthropy's transformed state adds ATK, raise it.
- **Identity in one line:** lunar melee frenzy — Stampede Stagger into Jurassic Jaw, Blood Frenzy to execute the lowest enemy, Bite / Lunar Regeneration to stay in the fight.

### Gargoyle `gargoyle` — tank · space · unholy · pool 16
- **Now:** Living Stone (4) · Earth Abilities (10) · Wind Control (3).
- **Fit:**
  - Living Stone ✓ — Stoneform / Gothic Rampart / Calcify are its rungs.
  - Earth Abilities ✓ — stone body, earth-resist; `raceStonefall` and `raceStoneDrop` rungs; ATK 50 handles the physical rows.
  - Wind Control ✓ — winged predator; `raceWingGust` rung.
- **Proposed families:** all three KEPT. Nothing added; 16 is a healthy tank pool.
- **Pool gaps:** summary: *sustain, movement*. Stoneform (no damage, 15% max HP per round for 2 rounds) *is* sustain — the counter misses it. Movement: it flies (Stone Drop requiresFlight is the T4 rung). Intended. Redundancy inside the pool: `raceGothicRampart` T2 (2 wall tiles, 50MP) and `rampart` T4 (3 wall tiles, 100MP) serve the same role — keep Gothic Rampart (the rung) and let Rampart be the Earth family's problem; the gargoyle should simply never take `rampart` (Widen is 3×3→5×5, not tiles 2→3, so no shipped upgrade bridges the two rows); whether Rampart itself is cut is Earth's auditor's call, after checking it is nobody's rung. Calcify (M ATK −2) is the biggest M ATK cut in the slice (Polymorph and Migraine take 1 stage) — good.
- **Identity in one line:** stone-wall tank — Gothic Rampart lanes, Stoneform to stall a round, Stonefall / Fissure Stagger into Stone Drop from the air.

### Djinn `djinn` — caster · time · divine · pool 12
- **Now:** Arcane Magic (4) · Occult Knowledge (4) · Trickery (4).
- **Fit:**
  - Arcane Magic ✓ — raw reality-bending; `raceSpellsteal`, `raceWishGranted` rungs.
  - Occult Knowledge ✓ — "older than the lamp, older than the sands"; `raceSacredGeometry`, `raceAncientMagic` rungs.
  - Trickery ✓ — a wish-twister; Trick Room (warp time) is the best fit in the game for it. Mimicry (ATK+2/DEF+2) is dead on ATK 8, but the family belongs.
- **Proposed families:** all three KEPT. Pool 12 — at the floor but every non-Mimicry row fires.
- **Pool gaps:** summary: *sustain*. A wish-granter with no heal is the odd one — REWRITE `raceWishGranted` (T3, 75MP 1AP, rng 3, single ally) to +1 ATK and +1 M ATK stage + cleanse 2 + heal 140 (Heal All's per-ally number): "grant a wish" as buff + cleanse + heal makes the djinn the arcane support it reads as, and the double stage means the wish is never dead on a caster ally. `racePolymorph` (T3, **2AP**, 75MP) for ATK−1 / M ATK−1 is over-costed next to `raceNaughtyList` (T3, 1AP, ATK−1) — RECOST to 1AP, keep CD3 and the −1/−1 stages (it is the wizard's rung 3, so the row stays). [Skeptic: struck the "or REWRITE to Minimize" option — `sharedShrinkRay` is already the T3 Minimize row.]
- **Identity in one line:** reality-warping support caster — Spellsteal and Trick Room for tempo, Wish Granted to buff/cleanse/heal, Sacred Geometry crystal cover, Weigh the Heart to finish a staggered target.

### Anubis `anubis` — caster · time · divine/unholy · pool 10
- **Now:** Occult Knowledge (4) · Necromancy (4) · Desert Acclimation (2).
- **Fit:**
  - Occult Knowledge ✓ — `raceWeighTheHeart` is *the* Anubis spell.
  - Necromancy ✓ — jackal god of the dead; INT 86 drives Life Drain / Rigormortis; `raceRigormortis` rung.
  - Desert Acclimation ✓ — Egypt; `raceDustDevil`, `sharedSummonSandstorm` rungs.
- **Proposed families:** all three KEPT — the identity is exactly these three; the problem is size, not fit. Fill the families:
  - NEW Necromancy T3 **Mummify** (damageEffect/damage · -/magic · 75MP 1AP · dmg 110 · rng 3 · single · silence 2 + grievous 2 — wrapped in bandages: cannot cast, cannot be healed). Necromancy has no T3 and no Silence. [Skeptic: the draft's root 2 was struck — `raceRigormortis` (T2, 80 aoe, root 2) is already this family's Root setup for Life Drain's finisher; a second Root row in the same family is the redundancy the audit is cutting elsewhere.]
  - NEW Desert Acclimation T3 **Scarab Swarm** (damageEffect/aoe · poison/magic · 75MP 1AP · dmg 110 · rng 4 · aoe r1 · poison 2) — the family is 2 rows on 3 races. [Skeptic: 90 was under the T3 AOE line — Nightmare Pulse / Deafening Wail / Bat Swarm are 125; 110 with a status is the tier.]
  - Pool → 12.
- **Pool gaps:** summary: *movement, buff, debuff*; tiers T3 **0**. Debuff is present (Rigormortis root, Plaguefield). Movement / buff: intended for a slow (SPD 31) judge-caster. The two NEW T3 rows fix the empty tier. Dust Devil's Stun finisher has no Stun in the pool — a teammate combo, fine.
- **Identity in one line:** judge of the dead — Rigormortis / Mummify Root into Life Drain, Weigh the Heart executes the low-HP target, Sandstorm blinds the field for the team.

### Catgirl `catgirl` — assassin · chaos · human/anomaly · pool 11
- **Now:** Feline Anatomy (2) · Athleticism (5) · Seduction (5).
- **Fit:**
  - Feline Anatomy ✓ — unique; `raceMeow`, `raceNinefoldScratch` rungs.
  - Athleticism ✓ — "3.2× reflexes"; `raceNimbleDodge` rung.
  - Seduction ✓ — the playful catgirl archetype; `raceLoveBite` rung. Caveat: Soul Suck / Draining Embrace are magic drains on INT 26 — Charm and Love Bite are the rows she really uses.
- **Proposed families:** all three KEPT; grow Feline Anatomy to four tiers:
  - MOVE `racePounce` (Beast T1, nature/physical 120 rng 3 — flagged over-tuned for T1) → Feline Anatomy as its T1, REWRITE dmg 120 → 100. Beast keeps Predator Leap for the same role; Pounce is nobody's tree rung, so the move displaces nothing.
  - NEW Feline T2 **Cat Nap** (heal/selfHeal · 50MP 1AP CD2 · rng 0 · self-heal 30% + cleanse 1) — her only sustain.
  - Pool → 13.
- **Pool gaps:** no sustain (fixed by Cat Nap); movement (Nimble Dodge) ✓; debuff (Meow DEF−1, Love Bite DEF−1, Charm) ✓. Tier flag: `raceNinefoldScratch` T4 = 5×32 = 160 "WEAK" with no rider for 100MP versus Take Aim 180 ignoreArmor — REWRITE to add finisher Charm ×1.5 so Love Bite / Charm → Ninefold Scratch is her own combo.
- **Identity in one line:** hit-and-run melee assassin — Charm into Ninefold Scratch, Nimble Dodge out, Meow shreds DEF for the whole team.

### Mantid `mantid` — assassin · time · alien · pool 16
- **Now:** Insectoid Anatomy (5) · Fractal Pattern Recognition (3) · Psychic Abilities (8).
- **Fit:**
  - Insectoid Anatomy ✓ — insectoid; `raceMandibleStrike`, `raceChitinArmor` rungs. Caveat: Mandible Strike (3×45 physical) and Venom Fang are dead on **ATK 22**.
  - Fractal Pattern Recognition ✓ — compound-eye pattern reading; `raceFractalStitch`, `raceFractalNeedle` rungs.
  - Psychic Abilities ✓ — telepathic with the Greys; INT 94 drives all eight rows.
- **Proposed families:** all three KEPT. Pool 16.
- **Pool gaps:** summary: *sustain* — intended glass cannon. The real hole is the stat/class clash: an "assassin" with ATK 22 / INT 94 whose T1 rung is a physical 3-hit. [Skeptic: struck the draft's "REWRITE Mandible Strike to magic" — the row is shared with the antperson (ATK 94 / INT 29), who would lose it.] RE-POINT the mantid's rung 1 from `raceMandibleStrike` to `racePsychicBeam` (Psychic T1, magic 100 line + Discord 1 — inside its families, fires on INT 94, and it is the setup for its own Migraine finisher), and relabel the class caster. Fractal Needle's Stun finisher has no Stun in the pool (a teammate combo); Psychic Beam Discord → Migraine is self-contained.
- **Identity in one line:** psychic line caster — Psychic Beam Discord into Migraine, Fractal Stitch / Needle down the lane, Dimensional Fold to swap a bruiser into the enemy's backline.

### Antperson `antperson` — bruiser · space · alien/anomaly · pool 16
- **Now:** Insectoid Anatomy (5) · Poison Abilities (5) · Teamwork (3) · Agriculture (3).
- **Fit:**
  - Insectoid Anatomy ✓ — `raceTunnelNetwork`, `raceSwarmSignal` rungs; Mandible / Venom Fang fire on ATK 94.
  - Poison Abilities ✓ — formic acid is literally ant venom; `raceFormicAcid`, `sharedPoisonSwamp` rungs. Rows are magic on INT 29, but Formic Acid's DEF−1 + poison-finisher is utility, not damage.
  - Teamwork ✓ — eusocial swarm; Encore / Pep Talk / Team Strike is the best Teamwork owner in the game.
  - Agriculture ✓ — ants farm (leafcutters, aphid herds); Healing Seed is the bruiser's only sustain. Weak but lore-true.
- **Proposed families:** all four KEPT.
- **Pool gaps:** summary: *movement, debuff*. Tunnel Network (linked pair) is its movement; Formic Acid / Poison Seed are debuffs. Fine. Data flag: `raceSwarmSignal` T4 has `stage:atk+2` in the row but "+1 stage" in the description — keep the row's `atk+2` and fix the description to "+2 stages" (the T4 team aura should be the big one; it is also the bee queen's rung 4, so it stays T4). The row that is off is `warCry` (Sonic T2, 50MP, +2 ATK stages aura r3) — flag to the Sonic auditor to cut it to +1 stage. [Skeptic: struck the "drop Swarm Signal to T3" option.]
- **Identity in one line:** swarm bruiser — Encore / Swarm Signal feed the team's damage, Formic Acid shreds DEF, Venom Fang in melee; the tunnel pair moves the squad.

### Mothman `mothman` — support · time · anomaly · pool 10
- **Now:** Cryptid Abilities (3) · Lightning Magic (2) · Wind Control (3) · Mothman (2).
- **Fit:**
  - Cryptid Abilities ✓ — `raceDreadAura`, `raceCryptidVanish` rungs.
  - Lightning Magic ✓ — the omen before the storm; `thunderstorm` rung.
  - Wind Control ✗ — Wing Attack (physical 80) and Sky Tackle (physical 110) are dead on **ATK 8**; only Vortex Slam fires. The mothman is a psychic omen, not a wing-brawler.
  - Mothman ✓ — unique; `raceRedEyes`, `raceProphecyOfDisaster` rungs.
- **Proposed families:** Cryptid Abilities KEPT · Lightning Magic KEPT · Mothman KEPT (grown) · Wind Control REMOVED · Psychic Abilities ADDED ("generates prophetic visions in nearby subjects": Telepathic Link and Psychic Barrier finally make it a *support*, Migraine pays off its own Discord, Psychosis adds an M DEF shred). Pool 3+2+8+2(+1) = 16.
  - Mothman fill: NEW T3 **Ill Portent** (effect/warCry · 75MP 1AP · rng 0 · aura r3 · every ally within 3 gains Protect 1 — the omen warns the team of the blow before it lands; the family's only support row and the mothman's first ally buff). [Skeptic: the draft's 3×3 Discord zone was struck — `raceDreadAura` (Cryptid T1, already in the pool and a rung-1 option) is Discord 2 in radius 2 for 25MP, so a 75MP Discord zone would be a worse copy in the same pool, and Prophecy's Discord setup already exists.] Marked has **zero payoffs in the game**, so `raceRedEyes` is a dead setup: `raceProphecyOfDisaster` already carries finisher Discord ×1.5 — ADD Marked to that finisher list (Discord *or* Marked ×1.5) so Red Eyes → Prophecy becomes self-contained too.
- **Pool gaps:** summary: *sustain*. A support with no heal — Psychic Barrier (150 shield) plugs it. Movement: Cryptid Vanish. Prophecy of Disaster (T4, 2AP, 140 dmg 5×5 delayed) is 20 under the T4 AOE norm (160) — the 5×5 justifies it.
- **Identity in one line:** omen support — Dread Aura Discord and Red Eyes Mark, then Prophecy's meteor storm; Ill Portent Protect / Telepathic Link / Barrier for the team; Thunderstorm weather control.

### Siren `siren` — support · space · unholy · pool 23
- **Now:** Sonic (10) · Water Abilities (8) · Seduction (5).
- **Fit:**
  - Sonic ✓ — the voice; `raceSonicBoomerang`, `raceDeafeningWail` rungs.
  - Water Abilities ✓ — aquatic; `raceRiptide`, `raceCallOfTheDeep` rungs; water-resist.
  - Seduction ✓ — sirens lure sailors; every magic drain fires on INT 88.
- **Proposed families:** all three KEPT. Pool 23, under the cap.
- **Pool gaps:** none listed; heals (Tidal Blessing, Temporal Tide), movement (Siren Song pull, Water Pulse push), debuffs galore, six self-contained finishers. Redundancy inside the pool: `raceTidalBlessing` T2 (zone heal 52/turn) and `raceTemporalTide` T3 (zone heal 100/turn, nothing temporal about it) are the same role — [Skeptic: the draft's MERGE was struck — `raceTemporalTide` is the atlantean's AND the starfish's rung 3.] REWRITE Temporal Tide (T3, 75MP 1AP, rng 3, aoe r1, 2 rounds) so it is actually temporal: heal 100/turn AND cleanse 1 debuff per turn from every ally inside (the tide rolls the round back); Tidal Blessing stays the plain 52/turn T2. `lullaby` T3 (75MP 1AP, rng 4, single 130 + slow 2) is a sleep song that slows — REWRITE to 130 + Stun 1 (sleep) so the siren has a Stun and Dust-Devil-type teammates get a setup (Stun Ray is 100 + Stun 1 at T1, so the tier holds).
- **Identity in one line:** battlefield controller — Siren Song pull + Whirlpool cluster, Deafening Wail Silence into Sonic Breaker / Call of the Deep, Requiem Discord; heals on the side.

### Scarecrow `scarecrow` — support · chaos · unholy · pool 13
- **Now:** Scarecrow Abilties (3) · Witchcraft (3) · Nature Magic (4) · Agriculture (3).
- **Fit:**
  - Scarecrow Abilties ✓ — unique; `raceHarvestHook`, `raceStuffedDouble`, `raceCrowStorm` rungs.
  - Witchcraft ✓ — witch-made construct; `sharedHexOfToil` rung.
  - Nature Magic ✓ — "controls local flora within 50m".
  - Agriculture ✓ — guards agricultural zones.
- **Proposed families:** all four KEPT; fill the unique family: NEW Scarecrow T3 **Straw Mending** (heal/selfHeal · 75MP 1AP CD2 · rng 0 · self-heal 30% + cleanse 1 — the lore's "redistributes mass to repair damage"). Pool → 14.
- **Pool gaps:** not on the missing list; heals (Herbal Remedy, Healing Seed), movement (Treeline Retreat), debuff (Hex, Crow Storm discord). The clash is stats vs class: **ATK 84 / HP 650 / DEF 58 / INT 30** is a bruiser-tank, yet the T4 rung `raceCrowStorm` is magic 160 and Hocus Pocus is magic — REWRITE Crow Storm to physical damage (crows peck) so the rung fires, and consider relabeling the class bruiser.
- **Identity in one line:** field-control bruiser — Harvest Hook pulls a target into Hex range, Crow Storm pays the Hex off, seeds and the Stuffed Double hold the zone.

### Glitch `glitch` — specialist · space · tech/anomaly · pool 14
- **Now:** Computer Hacking Skills (6) · Temporal Abilities (4) · Artificial Intelligence (4).
- **Fit:**
  - Computer Hacking Skills ✓ — `raceCrashLoop`, `raceMemoryLeak`, `raceBlueScreen` rungs.
  - Temporal Abilities ✓ — "multiple probability states"; `raceTimeRewind` rung.
  - Artificial Intelligence ✓ (partial) — the glitch is an anomaly, not an AI, but Recursive Loop / Singularity read as glitch words and the rows fire on INT 84. Keep.
- **Proposed families:** all three KEPT.
- **Pool gaps:** summary: *sustain* — intended. Row fixes: `raceOvercalculate` (ATK+1) is dead on ATK 22 — REWRITE to M ATK+1 (the AI is a caster too). `raceBlueScreen` (T3, **2AP**, stun 1, no damage) vs `raceHypnoticPulse` (T3, 1AP, stun 1) — RECOST to 1AP. `raceNeuralHack` (T3, jammed 1) is strictly worse than `raceMemoryLeak` (T2, jammed 2) — [Skeptic: DELETE struck — it is the android's rung 3.] REWRITE Neural Hack (T3, 75MP 1AP, rng 3, single): applies Jammed 2; if the target was ALREADY Jammed, its next activation is YOURS (possessed 2, bosses immune) — Memory Leak → Neural Hack becomes the hackers' own possess combo and the row stops being a worse Memory Leak (usable on the android's ATK 75 too, it is a status row). `raceTimeRewind` (T4, 160 single, no rider) is under the T4 norm and has no rewind — REWRITE: 160 magic single, rng 4, 100MP 1AP, and the caster cleanses 2 of its own debuffs and resets its own cooldowns (the "rewind"; also the rabbit's rung 4, still in Temporal). [Skeptic: struck the "regains 1 AP" option — a 1AP row that refunds 1AP is a free 160 every round.]
- **Identity in one line:** jam-and-punish tech debuffer — Memory Leak Jammed into Crash Loop / Recursive Loop, Blue Screen Stun for the Stun finishers, Firewall Protocol shields, Judgment Beam DEF-shred.

### Machine Elves `machine elves` — specialist · chaos · alien/tech · pool 13
- **Now:** Prism Lattice (4) · Fractal Pattern Recognition (3) · Drug Use (2) · Trickery (4).
- **Fit:**
  - Prism Lattice ✓ — built for them; three rungs.
  - Fractal Pattern Recognition ✓ — impossible topology.
  - Drug Use ✓ — the DMT entities themselves; `sharedEgoDeath` rung.
  - Trickery ✓ — the jester entities of trip reports; Trick Room fits; Mimicry (ATK+2/DEF+2) is dead on ATK 18.
- **Proposed families:** all four KEPT. Drug Use is two T4 rows (100MP each) on four races — the family auditor should give it a T1/T2 (e.g. NEW T2 **Contact High** · effect/aoe · psychic · 50MP 1AP · rng 3 · aoe r1 · Discord 2 — a shared trip that scrambles the target and its neighbours) so the elves have a cheap row there.
- **Pool gaps:** summary: *sustain, debuff*. Debuff exists (Tune Frequency UV shreds DEF, Bad Trip slow, Ego Death stun). Sustain intended. Ego Death Stun → Fractal Needle is self-contained.
- **Identity in one line:** lattice engineer — Prism Mirror geometry, Tune Frequency, Pulse Lattice; Mirror Blink / Dimensional Fold positioning; Ego Death Stun into Fractal Needle.

### Cyclops `cyclops` — tank · time · anomaly · pool 19
- **Now:** Giant Abilities (4) · Eyesight (5) · Earth Abilities (10) · Stone Age (1).
- **Fit:**
  - Giant Abilities ✓ — `raceTitanDrop`, `raceGiantSmash` rungs.
  - Eyesight ✓ — the one eye. Caveat: `raceBalefulGaze` (rung, magic 130) and `raceDeathGaze` (magic 180) run on **INT 25** — the lore says "intelligence previously underestimated": raise INT to ~55 or the T2 rung is dead.
  - Earth Abilities ✓ — boulder-hurling giant; earth-resist. `raceStoneDrop` requiresFlight — dead for a cyclops (also for annunaki, giant, golem…); Earth's auditor should note the family carries a flyer-only T4.
  - Stone Age ✗ as a family — one spell, one race. FAMILY_MERGE into Giant Abilities (which has no T1/T2): MOVE `raceStoneThrow` → Giant Abilities, FAMILY_DELETE Stone Age; rung 1 stays valid.
- **Proposed families:** Giant Abilities KEPT (+Stone Throw) · Eyesight KEPT · Earth Abilities KEPT · Stone Age REMOVED (merged). Pool stays 19 (5+5+9 — Earth's Rampart is one object under two ids; the merge moves a row, it adds none).
- **Pool gaps:** summary: *sustain, movement* — intended for a tank; Titan Drop is a leap; Pupil Shield is team mitigation. Redundancy: `raceStoneThrow` (T1, 100, rng 5, ignores LoS, Stun finisher) vs `raceBoulderHurl` (T1, 100, rng 3, Stagger finisher) — same role in the same pool and Stone Throw is strictly better; REWRITE Stone Throw to drop ignoresLineOfSight (keep it T1 so the rung order holds). Hypnotic Pulse / Giant Smash Stun → Stone Throw / Death Gaze are self-contained.
- **Identity in one line:** stagger-stun anchor — Hypnotic Pulse or Giant Smash Stun into Stone Throw / Death Gaze, Fissure / Tremor Stomp Stagger into Colossal Crush, Pupil Shield for the front line.

### Cyborg `cyborg` — bruiser · space · tech · pool 17
- **Now:** Robotic Weapons (5) · Robotic Hardware (10) · Human Grit (5).
- **Fit:**
  - Robotic Weapons ✓ — `raceClusterRockets`, `racePlasmaCannon`, `raceRocketToss` rungs.
  - Robotic Hardware ✓ — `raceHydraulicPunch`, `overclock` rungs.
  - Human Grit ✓ — "retains human adaptability": the only machine with grit; Adrenaline Rush is its sustain.
- **Proposed families:** all three KEPT.
- **Pool gaps:** summary: *movement, debuff*. Debuff: Synthetic Blade DEF−1, EMP Burst Jammed, Cluster Rockets Stagger. Movement: Overclock +1 MOV. Fine. Flags: (1) **ATK 46 / INT 72** on a "bruiser" — the magic rows (Cluster Rockets, Plasma Cannon, Taser Bolt, EMP Burst) outclass the physical punches; it plays as a hybrid, label it so or raise ATK. (2) `raceRocketToss` (To the Moon, T4 rung) requiresFlight — if Power Core does not grant flight, the rung is dead. (3) `raceElbowGrease` (T1, 90, rng 1) and `improvise` (T1, 80, rng 2) are the same row — DELETE `improvise` and keep Elbow Grease (the family's description literally names it, and the homosapien's rung-1 pair `[raceElbowGrease, improvise]` collapses to Elbow Grease with nothing lost). [Skeptic: flipped which id dies.] (4) `raceHydraulicPunch` (Synthetic Punch, T1 100 push 2 rng 1) vs `raceRocketFist` (T1 100 push 2 rng 3) — same role; the Jammed finisher on Synthetic Punch is the only difference.
- **Identity in one line:** self-jamming tech bruiser — EMP Burst / Cluster Rockets set up Synthetic Blade / Taser Bolt / Robo Punch payoffs; Adrenaline Rush + Self-Repair keep it running.

### Demon Prince `demon prince` — bruiser · chaos · unholy · pool 22
- **Now:** Infernal Court (7) · Demonic Abilities (8) · Fire Magic (4) · Blood Magic (3).
- **Fit:**
  - Infernal Court ✓ — `raceInfernalConscription`, `raceDarkDominion` rungs.
  - Demonic Abilities ✓ — `raceDemonicRoar` rung.
  - Fire Magic ✓ — infernal, fire-resist; `sharedScorchedEarth` rung.
  - Blood Magic ✓ — demon blood rites.
- **Proposed families:** all four KEPT. Pool 22.
- **Pool gaps:** summary: *movement* — intended (Infernal Hurl needs flight). The clash is the class label: **ATK 28 / INT 72** is a caster, not a bruiser — `raceDemonicClaw` (T4 physical 180) and `raceInfernalHurl` are dead for it. Row fixes: `raceHellfireCrown` (T1 ATK+1) → REWRITE to "+1 ATK and +1 M ATK" — NOT M ATK only: it is the overlord's rung 1 (ATK 90 / INT 37); `raceInnerDemon` (ATK+1, −20% HP) → REWRITE to "+1 ATK and +1 M ATK" (demon prince, fallen angel and succubus are all INT users). `raceInfernalDecree` (T2, **2AP**, 130 aoe burn) is over-tuned for T2 — RECOST to 1AP / 110 dmg (Cluster Rockets T2 = 110, 1AP). Infernal Court carries three T4 magic AOEs, but all three are rungs (Dark Dominion → demon prince, Dark Lullaby → demon princess, Cataclysm Decree → overlord) and their roles differ (instant Burn + Stagger finisher / delayed lava crater with Burn finisher / Silence + Silence finisher) — keep all three. [Skeptic: struck the consolidation.]
- **Identity in one line:** infernal burn engine — Wall of Fire / Infernal Decree Burn into Cataclysm Decree / Dark Dominion (Hellfire Crown is a self-buff, Hellmouth leaves lava but sets no Burn), Contract / Soul Bind into Devour Soul for sustain, Demonic Roar Stagger for the team's Stagger finishers.

### Demon Princess `demon princess` — support · chaos · unholy · pool 18
- **Now:** Infernal Court (7) · Witchcraft (3) · Poison Abilities (5) · Blood Magic (3).
- **Fit:**
  - Infernal Court ✓ — `raceKissOfDecay`, `raceDarkLullaby` rungs.
  - Witchcraft ✓ — "curse propagation"; `sharedHexOfToil` rung.
  - Poison Abilities ✓ — decay; `sharedPoisonSwamp` rung; INT 84 drives the magic rows.
  - Blood Magic ✓ — Life Sap is her Poison payoff.
- **Proposed families:** all four KEPT · Seduction ADDED — the lore says "charm aura affects even shielded personnel" and she has no Charm at all; Soul Suck / Charm / Enthrall / Draining Embrace are magic drains on INT 84. Pool 7+3+5+3+5 = 23.
- **Pool gaps:** summary: *movement* — intended. The bigger hole: a "support" with **zero** heals or ally buffs (her only buffs are Hellfire Crown and Blood Ritual, both self ATK+1, dead on ATK 8; Kiss of Decay's drain is her only sustain). She is a debuff caster; label her so, or the Seduction Charm → Enthrall control is the "support". Redundancy: `sharedHexOfToil` (T2, hexed 3) and `raceCurseOfMisfortune` (Family Curse, T3, hexed 3) are identical — REWRITE Family Curse (T3, 75MP 1AP, rng 4, aoe r1 — hexed 3 on everyone in the 3×3, a family-wide curse) so Witchcraft's T3 is distinct; it stays the fortune teller's and jack-o'-lantern's rung 3.
- **Identity in one line:** curse-and-charm debuffer — Hex for the team's Hexed finishers (Crow Storm, Exorcism, Crystal Ball), Poison Swamp into Kiss of Decay / Life Sap, Charm into Enthrall to steal an activation.

### Dreameater `dreameater` — support · time · alien · pool 17
- **Now:** Dream Predation (4) · Psychic Abilities (8) · Grave Hunger (5).
- **Fit:**
  - Dream Predation ✓ — `raceDreamSiphon`, `raceNightmarePulse`, `raceEternalSlumber` rungs.
  - Psychic Abilities ✓ — psionic parasite, INT 94.
  - Grave Hunger ✗ — "feeding on the fallen: frenzies, bites and corpse crawls" is the ghoul; the dreameater feeds on REM sleep. Frenzy / Ghoulish Bite / Terror Pounce are physical (ATK 8 — dead). Only `raceCorpseCrawl` (its T2 rung) and Carrion Feast are usable.
- **Proposed families:** Dream Predation KEPT (+1) · Psychic Abilities KEPT · Grave Hunger REMOVED · Shadow ADDED ("feels like 3 AM": Fear, Shadow Crush, Shadow Step, Shadow Realm, Void Rush all fire on INT 94; nightmares are fear). Rung 2 replacement: NEW Dream Predation T2 **Dreamwalk** (movement/escape · 50MP 1AP CD2 · rng 0 · teleport 3 + invisible 1 — the same numbers as Corpse Crawl, so the tree keeps its escape; the ghoul keeps Corpse Crawl as its own rung 2). Pool 5+8+8 = 21.
- **Pool gaps:** a "support" with no heal or ally buff beyond Psychic Barrier (shield) and Telepathic Link (team M ATK+1) — like the demon princess it is a debuff caster. Eternal Slumber Stun → Dream Siphon, Psychic Beam Discord → Migraine and Mind Shatter's own Silence are self-contained; Sleep Paralysis Root has NO payoff in the pool (Root finishers are Venom Fang / Life Drain / Precision Shot / Land Ho / Haymaker — none here), so it is a pin, not a setup.
- **Identity in one line:** sleep-lock caster — Eternal Slumber Stun into Dream Siphon, Sleep Paralysis to pin the target in place, Psychic Beam Discord into Migraine, Fear to scatter, Dreamwalk out.

### Fallen Angel `fallen angel` — caster · chaos · divine/unholy · pool 19
- **Now:** Fallen Angelic Powers (4) · Heavenly Duties (7) · Demonic Abilities (8).
- **Fit:**
  - Fallen Angelic Powers ✓ — `raceFallenGrace`, `raceAbyssalWings`, `raceDescendingWrath` rungs.
  - Heavenly Duties ✓ — "retains angelic power output"; `raceSanctuary` rung.
  - Demonic Abilities ✓ — "combined divine and infernal signatures". The lore genuinely spans both.
- **Proposed families:** all three KEPT.
- **Pool gaps:** none listed (heals: Divine Light, Sanctuary; movement: Miracle swap). T3 is thin (2 rows). Tier flags: `raceFallenGrace` (T1, cross r1, 100, burn 1) is on the over-tuned-T1 list; `raceWrathOfTheWatchers` (T4, **1AP**, cross r2, 180, burn + Stagger finisher, CD 2) outclasses `raceCrusade` (T4, 2AP, cross r2, 160) — RECOST to 2AP. Descending Wrath requiresFlight — fine, it flies. `raceInnerDemon` ATK+1 is dead here too (see demon prince).
- **Identity in one line:** burn-cross caster — Fallen Grace Burn into Descending Wrath dive, Sanctuary / Divine Light to hold the line, Contract into Devour Soul.

### Goatman `goatman` — bruiser · chaos · anomaly/unholy · pool 12
- **Now:** Horns & Hooves (5) · Blood Magic (3) · Black Magic (4).
- **Fit:**
  - Horns & Hooves ✓ — `raceGoreCharge`, `raceCliffCharge` rungs; ATK 94 loves it.
  - Blood Magic ✓ — `raceBloodRitual` rung.
  - Black Magic ✓ — occult signature, Baphomet; `raceBaphometsRite` rung.
- **Proposed families:** all three KEPT. Pool 12 — at the floor, three self-contained finishers (Horn Toss, Bull Rush, Baphomet's Rite); Life Sap's Poison needs a teammate.
- **Pool gaps:** summary: *movement* — Gore Charge dash and Cliff Charge leap cover it. Row fixes: `raceBloodRitual` (T3, ATK+1, −10% HP) is strictly worse than `raceDeathPact` (T1, ATK+1) in the same pool — REWRITE to ATK+2 (the blood buys the bigger stage). `raceBaphometsRite` (T4 rung, magic 160 aoe, −15% HP) runs on **INT 29** — [Skeptic: struck the physical rewrite — Black Magic is also the skinwalker's (INT 88) and necromancer's (INT 82) family, and no row in the data scales off the higher of ATK / M ATK.] RE-POINT the goatman's rung 4 from `raceBaphometsRite` to `raceBullRush` (Horns & Hooves T4, physical 170 dash, Discord finisher — Labyrinth Roar in the same family sets the Discord, so the tree pays itself off); the Rite stays magic in the pool. Krampus (ATK 90) has the same dead rung — races-3 should make the same swap.
- **Identity in one line:** charge-and-stagger bruiser — Gore Charge Stagger into Horn Toss, Labyrinth Roar Discord into Bull Rush (the T4 rung), Death Pact / Blood Ritual to stack ATK.

### Halfdemon `halfdemon` — assassin · chaos · unholy/human · pool 23
- **Now:** Demonic Abilities (8) · Shadow (8) · Spy Gear (7).
- **Fit:**
  - Demonic Abilities ✓ — `raceInnerDemon`, `raceDemonicClaw` rungs (ATK 77 makes Claw the one demon who uses it).
  - Shadow ✓ — "agility approaches Shadow Entity benchmarks"; `raceShadowStep` rung.
  - Spy Gear ✓ (partial) — the human half's "tactical reasoning": knives, smoke, poison darts; `sharedSmokeScreen` rung. EMP Grenade is the one off-theme row. Keep.
- **Proposed families:** all three KEPT. Pool 23.
- **Pool gaps:** none listed. Redundancy across its pool: four stealth/mobility rows — `raceAgentVanish` (T2, teleport 3 + invisible 2), `raceShadowStep` (T3, teleport 4), `racePhaseShift` (T3, invisible 1 only), `sharedSmokeScreen`. Phase Shift is strictly worse than Agent Vanish one tier down — RETIER Phase Shift to T2 (Shadow auditor). Demonic Claw applies Marked, which has no payoff anywhere.
- **Identity in one line:** shadow assassin — Smoke Screen / Agent Vanish stealth into Sneak Slash (bonus while invisible) with Poison Dart setup, Shadow Step engage into Demonic Claw.

### Mermaid `mermaid` — healer · time · anomaly · pool 23
- **Now:** Water Abilities (8) · Sonic (10) · Deep Sea Anatomy (5).
- **Fit:**
  - Water Abilities ✓ — "hydromantic healing"; `raceTidalBlessing`, `raceRiptide`, `raceFlood` rungs.
  - Sonic ✓ — "sonar-range vocalization"; `raceSirenSong` rung.
  - Deep Sea Anatomy ✓ — aquatic; Deep Dive escape.
- **Proposed families:** all three KEPT · NEW Water T1 **Tide Pool** (heal/heal · water · 25MP 1AP · rng 3 · single · heal 140 + cleanse 1; Heal T1 is 192, so it sits under the line and the cleanse is the trade) — a *healer* whose only heals are two zone rows has no direct heal, no cleanse, no revive. Pool 24, at the cap (Temporal Tide stays — it is the atlantean's and starfish's rung, see siren).
- **Pool gaps:** not on the missing list, but the healer role is under-served (above). Note the siren / mermaid overlap: 18 shared rows (Sonic + Water); the split holds only if the mermaid's identity is the heals and the siren's is the control — the NEW heal row and the Seduction/Deep Sea difference carry that.
- **Identity in one line:** water healer — Tidal Blessing zones and Tide Pool heals, Siren Song pull to reposition, Whirlpool Slow into Tidal Slam, Deep Dive out.

### Nephilim `nephilim` — tank · time · divine/human · pool 17
- **Now:** Fallen Angelic Powers (4) · Earth Abilities (10) · Giant Abilities (4).
- **Fit:**
  - Fallen Angelic Powers ✓ — the Watchers' children; Wrath of the Watchers is named for them; `raceFallenGrace`, `raceAbyssalWings`, `raceWrathOfTheWatchers` rungs. Caveat: two of the three damage rungs (Fallen Grace, Wrath of the Watchers) are magic on **INT 27** — only Fissure (earth/physical 100) fires; the tree is half dead.
  - Earth Abilities ✓ — 2.7 m / 200 kg; `sharedFissure` rung; ATK 68.
  - Giant Abilities ✓ — proportion.
- **Proposed families:** all three KEPT. The fix is the tree, not the families: RE-POINT rungs 1 and 4 to `raceTremorStomp` (Earth T1, physical 125 self-aoe + Stagger) and `raceColossalCrush` (Giant T4, physical 180, Stagger finisher) — both inside its families, both fire on ATK 68, and Tremor Stomp → Colossal Crush is a self-contained Stagger line; Abyssal Wings (T2) and Fissure (T3) stay. [Skeptic: struck the "or raise INT to ~60" option — a melee tank whose T4 is a cross-shaped magic AOE is the mismatch, not the number.] Stone Drop and Descending Wrath requiresFlight — Abyssal Wings implies it flies; confirm.
- **Pool gaps:** summary: *sustain, movement, debuff* — a tank; Ground Slam Slow and Fissure Stagger are debuffs. T4 has **7** rows and T2 has 2 — Earth's 4/1/1/4 shape (family auditor). Five self-contained finishers: four Stagger (Wrath of the Watchers, Boulder Hurl, Stone Drop, Colossal Crush) plus Descending Wrath's Burn.
- **Identity in one line:** divine siege tank — Fissure / Tremor Stomp Stagger into Colossal Crush / Stone Drop, Abyssal Wings Protect, Rampart walls.

### Vampire `vampire` — assassin · chaos · unholy · pool 15
- **Now:** Vampiric Abilities (5) · Beast Abilities (7) · Blood Magic (3).
- **Fit:**
  - Vampiric Abilities ✓ — unique; `raceMistForm`, `raceBatSwarm`, `raceThrallBite`, `racePredatorDrop` rungs.
  - Beast Abilities ✓ (partial) — bat / wolf forms; `raceBite` rung. Tail Whip is a dinosaur row in a grab-bag family, not the vampire's problem.
  - Blood Magic ✓ — obviously.
- **Proposed families:** all three KEPT.
- **Pool gaps:** summary: *debuff* — Bat Swarm DEF−1 covers it. T2 has 1 row, T4 has 1. Redundancy: `raceLifetap` (Vampiric T1, magic 80, drain 40%) vs `raceBite` (Beast T1, physical 100, drain 30%) — same role, and Lifetap is magic on INT 31: DELETE Lifetap; NEW Vampiric T1 **Hypnotic Gaze** (effect/debuff · 25MP 1AP CD2 · rng 3 · single · charm 1 — the vampire's stare; a soft control row a T1 pool lacks; Soul Suck already hands out Charm 1 at T1, so the tier holds). `raceBatSwarm` (T3, magic 125 aoe) also runs on INT 31 — REWRITE to physical (bats bite). Life Sap's Poison finisher needs a teammate; Predator Drop requiresFlight (bat form — fine).
- **Identity in one line:** drain assassin — Bite / Predator Drop drains, Thrall Bite steals an activation, Mist Form out; bring a poisoner for Life Sap.

### Voidweaver `voidweaver` — assassin · space · alien · pool 11
- **Now:** Arachnid Powers (3) · Insectoid Anatomy (5) · Fractal Pattern Recognition (3).
- **Fit:**
  - Arachnid Powers ✓ — unique; `raceWebSnare`, `raceDimensionalWeb` rungs.
  - Insectoid Anatomy ✓ (partial) — spiders are not insects, but Venom Fang (its T1 rung), Chitin Armor and Tunnel Network read arachnid enough. Keep for the rows.
  - Fractal Pattern Recognition ✓ — dimensional folds and webs; `raceFractalNeedle` rung.
- **Proposed families:** all three KEPT · Shadow ADDED ("extradimensional void-space… undetectable until strike": Phase Shift invisible, Shadow Step, Void Rush is literally its name; ATK 40 / INT 58 hybrid uses the magic rows). Arachnid fill: NEW T4 **Void Cocoon** (damageEffect/damage · -/magic · 100MP 1AP · dmg 170 · rng 4 · single · root 2, finisher Root ×1.5 — Web Shoot / Web Snare set Root, so the family pays itself off; Bad Trip T4 is 180 + Slow 1 + finisher at 1AP, so it is on the line). Pool 4+5+3+8 = 20.
- **Pool gaps:** summary: *sustain, debuff* — Root and Slow are debuffs, so only sustain, which is intended. Fractal Needle's Stun finisher needs a teammate. Stat flag: ATK 40 / INT 58 straddles both — Web Shoot / Venom Fang / Mandible physical, Web Snare / Needle magic; pick a side in the stat pass.
- **Identity in one line:** root trapper — Web Shoot / Web Snare Root into Venom Fang and Void Cocoon, Dimensional Web Slow zone for the team's Slow finishers, Shadow Step / Phase Shift ambush.

### Cosmic Wraith `cosmic wraith` — ranged · space · alien/tech · pool 26
- **Now:** Cosmic Abilities (11) · Shadow (8) · Temporal Abilities (4) · Marksmanship (3).
- **Fit:**
  - Cosmic Abilities ✓ — dark energy; all four rungs (`raceEntropicBeam`, `racePhaseWalk`, `sharedNebula`, `raceHeatDeath`).
  - Shadow ✓ — spectral void entity.
  - Temporal Abilities ✓ — "partially exists outside conventional spacetime".
  - Marksmanship ✗ — Kneecap Shot / Precision Shot / Take Aim is a rifle kit on a dark-matter ghost; added for the class label.
- **Proposed families:** Cosmic Abilities KEPT · Shadow KEPT · Temporal Abilities KEPT · Marksmanship REMOVED. Pool 23.
- **Pool gaps:** summary: *sustain* — intended. The real issue: **ATK 83 / INT 31** on a "ranged" unit whose three damage rungs are all magic (Entropic Beam, Nebula, Heat Death; the fourth, Phase Walk, is a teleport) — the lore is pure energy; make it a caster (INT ~85) in the stat pass or the tree is dead. Gravity Well / Black Hole Slow → Entropic Beam / Star Decree are self-contained.
- **Identity in one line:** entropy artillery — Gravity Well / Black Hole cluster-and-slow into Entropic Beam / Star Decree / Heat Death, Phase Walk / Shadow Step to reposition, Judgment Beam DEF-shred.

### Superhero `superhero` — hybrid · space · human/alien · pool 19
- **Now:** Superhero Powers (5) · Cosmic Abilities (11) · Wind Control (3).
- **Fit:**
  - Superhero Powers ✓ — `raceHeroicLeap`, `raceInvulnerable`, `raceFreezeBreath`, `raceShockwaveClap`, `raceLaserBeam` rungs.
  - Cosmic Abilities ✗ — Gravity Well, Nebula, Black Hole, Heat Death, Star Decree are an astro-caster's rows (INT 42); a cape does not collapse singularities. Only Cosmic Slam and Phase Walk fit. Yeti-in-Christmas.
  - Wind Control ✓ — flight; `raceSkyTackle` rung; Shockwave-type pushes.
- **Proposed families:** Superhero Powers KEPT · Wind Control KEPT · Cosmic Abilities REMOVED · Athleticism ADDED (Nimble Dodge, Thick Hide, Rampage, Unstoppable Charge — heroic physicality) · Human Grit ADDED ("heroic compulsion", human subject: Adrenaline Rush, Underdog Spirit, Indomitable Will). Pool 5+3+4+5 = 17 (Athleticism is 4 objects — Rampage is one row under two ids).
- **Pool gaps:** summary: *sustain, debuff*. Adrenaline Rush (55% self-heal) fixes sustain; Freeze Breath Frozen is a debuff. Heat Vision Burn → Heat Vision finisher is self-contained. Cost flag: `raceInvulnerable` (T2, **2AP**, protect 2, CD 2) vs `sentaiBlackGuard` (T2, 1AP, protect 2, CD 2) — RECOST to 1AP.
- **Identity in one line:** mobile front-line hybrid — Heroic Leap / Sky Tackle engage, Shockwave Clap pushes, Heat Vision Burn finisher, Invulnerable / Indomitable Will to eat the counter-attack.

### General `general` — tank · time · human · pool 20
- **Now:** Military Combat (10) · Gun Training (8) · Teamwork (3).
- **Fit:**
  - Military Combat ✓ — `raceRallyCommand`, `raceIronBulwark`, `raceArtilleryStrike`, `sharedNuke` rungs.
  - Gun Training ✓ — a sidearm; fine for ATK 78.
  - Teamwork ✓ — the commander.
- **Proposed families:** all three KEPT.
- **Pool gaps:** summary: *movement, debuff* — Suppressive Fire Slow is a debuff; movement intended for a tank. Cost flags: `raceRallyCommand` (T1, **2AP**, aoe ATK+1) vs `raceRoyalDecree` (T1, 1AP, same) — RECOST to 1AP. `raceFireForEffect` (T4, 2AP, 160 fire/**physical**, rng 6, 5×5 delayed, Burn finisher) and `sharedNuke` (T4, 2AP, 160 fire/**magic**, rng 5, 5×5 delayed, CD 2) are the same role in the same family — but on the general (ATK 78 / INT 23) only Fire for Effect fires, and Nuke is the T4 rung. [Skeptic: the draft's MERGE into one physical row was struck — `sharedNuke` is also the politician's rung 4 (ATK 22 / INT 66) and the mech's; a physical Nuke kills the politician's tree.] RE-POINT the general's rung 4 to `raceFireForEffect` (same family, physical, fires on ATK 78, and its Burn finisher is fed by Incendiary Rounds in Gun Training). Nuke stays magic for the politician; the Military Combat auditor may still sharpen the pair (Nuke keeps the building-destroying crater and CD 2, Fire for Effect the rng 6 and Burn finisher) but must not delete either id. `shieldBash` (Iron Dome) is kind heal/healAll with heal 0 — it is a team DEF+1 buff, file it as effect/warCry.
- **Identity in one line:** commander tank — Rally Command / Extended Clips buff the line, Suppressive Fire slows the lane, Fortify / Iron Dome shield, Artillery Strike / Fire for Effect zone the map.


---

## R.3 Race fit — Droid … Super Sentai (31 races)

### RACES part 3 (31 races: droid → super sentai)

### Droid `droid` — specialist · space · tech · pool 18
- **Now:** Computer Hacking Skills (6) · Robotic Hardware (10) · Engineering (5)
- **Fit:**
  - Computer Hacking Skills ✓ — sapient AI platform; int 90 drives Crash Loop.
  - Robotic Hardware ✓ (stat caveat) — it is a robot body, but 4 of 10 rows are physical (`raceRocketFist` 100, `raceHydraulicPunch` 100, `raceRoboPunch` 135, `raceChassisSlam` 160) on atk 15 — dead weight. The magic/utility half (`empBurst` rung, `overclock`, `raceSelfRepairProtocol`) is what it uses.
  - Engineering ✓ — "classified as equipment" that deploys equipment; Repair/turrets on a 220-MP unit.
- **Proposed families:** KEPT Computer Hacking Skills · KEPT Robotic Hardware · KEPT Engineering · ADDED Artificial Intelligence (4: `racePredictiveModel`, `raceOvercalculate`, `raceRecursiveLoop`, `raceSingularity`) — the lore line is literally "most advanced mobile AI platform"; ai/glitch already share it. Pool → 22 (21 if `fiveGTower` moves to Conspiracy Knowledge as proposed under the conspiracy theorist). Ask the family auditors to make `raceOvercalculate` +1 M ATK instead of +1 ATK (every AI-family owner is a caster). Rungs `raceCrashLoop`/`raceSystemAnalysis`/`raceFirewallProtocol`/`empBurst` all stay inside.
- **Pool gaps:** summary says movement only. A 22-SPD turret nest with Firewall Protocol has no business dashing — intended. Sustain (Repair 155, Self-Repair 35%), AOE (EMP Burst, Singularity), buff (Overclock), debuff (Memory Leak/Neural Hack jammed, System Analysis scanner, Blue Screen stun), T4 (EMP Burst, Overtinker, Singularity) all present.
- **Identity in one line:** jam engine for a tech team — Memory Leak/EMP Burst jammed feeds Crash Loop, Recursive Loop, Railgun/Classified Weapon carriers; Repair + Firewall Protocol keep a Deploy Turret nest standing.

### Antihero `antihero` — hybrid · space · human/alien · pool 23
- **Now:** Dirty Fighting (7) · Cosmic Abilities (11) · Superhero Powers (5)
- **Fit:**
  - Dirty Fighting ✓ — rogue operative, atk 66, No Mercy is his rung.
  - Cosmic Abilities ✗ — Nebula, Black Hole, Heat Death, Star Decree, Supernova, Gravity Well, Entropic Beam are all magic on int 29; "alien-derived augmentations" does not make a brawler birth stars. This is the Watcher/Orb of Light kit worn because of the "space" faction — the yeti/Christmas case. Only `raceCosmicSlam` (physical 125 self-AOE stagger, his T3 rung) belongs to him.
  - Superhero Powers ✓ — the anti-superhero; Heroic Leap, Invulnerable (rung), Shockwave Clap are physical. Freeze Breath/Heat Vision are magic (int 29) but stay as the "alien" flavor.
- **Proposed families:** KEPT Dirty Fighting · KEPT Superhero Powers (+1: MOVE `raceCosmicSlam` → Superhero Powers, keeps the rung inside and gives that family its missing self-AOE) · REMOVED Cosmic Abilities · ADDED Spy Gear (7) — "former operative": Smoke Screen, Agent Vanish, Knife Throw marked, Sneak Slash T4 physical · ADDED Human Grit (5) — "peak human physique… refuses to align": Adrenaline Rush is the sustain he lacks, Indomitable Will fits "0 losses". Pool 7 + 6 + 7 + 5 = 25 (one over the soft cap; if 24 is hard, drop Human Grit → 20 and accept no sustain).
- **Pool gaps:** summary: sustain. Fixed by Human Grit `raceAdrenalineRush` (55% self-heal). Everything else present; three stagger/burn finishers stay self-contained once `raceCosmicSlam` (the pool's only stagger SETUP) moves with him (Body Check, No Mercy, Heat Vision) — the two slow finishers (Entropic Beam, Star Decree) leave with Cosmic.
- **Identity in one line:** stagger→No Mercy execution bruiser with a spy's opener — Smoke Screen/Agent Vanish invisible → Sneak Slash, Cosmic Slam stagger → Body Check / No Mercy ×1.5 (Body Check is a stagger payoff, not a setup); Invulnerable/Adrenaline Rush make him the hybrid that does not die.

### Conspiracy Theorist `conspiracy theorist` — support · time · human · pool 9
- **Now:** Conspiracy Knowledge (4) · Internet Addiction (0) · Hidden Technology (5)
- **Fit:**
  - Conspiracy Knowledge ✓ — all four rungs; int 72 for Chemtrails/Fluoride/Flat Earth.
  - Internet Addiction ✗ as shipped — 0 spells; thematically fine (he posts), mechanically empty.
  - Hidden Technology ✓ — "encyclopedic knowledge of classified programs": Deneuralizer, Free Energy, Tesla Coil, Classified Weapon. `railgun` (physical 160 line) is dead on atk 18.
- **Proposed families:** KEPT Conspiracy Knowledge (MOVE `fiveGTower` here from Engineering — a 5G mind-scrambling tower is a conspiracy joke, not gnome/droid engineering; gives him a second deployable beside Tesla Coil and the family a 5th row) · KEPT Hidden Technology · ADDED Deep State Connections (2: `raceBlackBudget`, `raceBrainwash`) — an ex-intelligence analyst; men in black/telepath/politician share it · Internet Addiction KEPT ONLY IF the family auditors fill it (NEW suggestions: T1 "Doomscroll" self int+1/spd-1, T2 "Ratio'd" single discord, T3 "Viral Post" aoe marked, T4 "Doxxed" single 180 magic finisher marked×1.5); otherwise REMOVED. Pool 9 → 12 (16 if filled).
- **Pool gaps:** summary: sustain, movement. Movement is intended (backline support). Sustain: he has Free Energy (MP restore all) and Tin Foil Hat mdef but no heal — acceptable for a control support IF Internet Addiction or Deep State gets one cleanse/shield row; otherwise a hole. T4 is healthy (Flat Earth, Classified Weapon, Railgun — the last dead).
- **Identity in one line:** silence/poison/jam setup support — Fluoride Water silence + Chemtrails poison feed Flat Earth ×1.5, Deneuralizer jammed feeds Classified Weapon and any Railgun teammate; Free Energy refuels the caster team.

### Overlord `overlord` — bruiser · chaos · unholy · pool 18
- **Now:** Infernal Court (7) · Fire Magic (4) · Dirty Fighting (7)
- **Fit:**
  - Infernal Court ✓ (stat caveat) — a 4,000-year warlord ruling hell's court is the family's premise, and three rungs sit here. But 5 of 7 rows are magic on int 37 / atk 90 (Infernal Decree 130, Kiss of Decay, Cataclysm Decree 160, Dark Dominion 170, Dark Lullaby 160). Only Hellfire Crown (atk+1) and Infernal Conscription (marked) suit him.
  - Fire Magic ✗ — Fireball/Meteor/Wall of Fire on a "body designed for war" with int 37; fire resist is not fire mastery. His rung `sharedScorchedEarth` is the only tie.
  - Dirty Fighting ✓ — Curb Stomp, Body Check, No Mercy — conquest by boot.
- **Proposed families:** KEPT Infernal Court · KEPT Dirty Fighting · REMOVED Fire Magic · ADDED Demonic Abilities (8) — "documented under various names" = a demon lord; Demonic Roar (self-AOE stagger) makes his stagger chain self-contained, Demonic Claw is a physical T4 (180, marked), Inner Demon atk+1, Contract self-heals off the enemy's damage. Pool 7 + 7 + 8 = 22. Rung replacement for `sharedScorchedEarth` → `raceDemonicRoar` (Demonic Abilities). Ask the family auditors to make `raceInfernalDecree` (his T2 rung) physical or "higher of ATK/INT" — the decree is enforced by the warlord, not cast.
- **Pool gaps:** summary: movement. Dark Justice charges into melee, Body Check shoves — intended for a walker. No heal (Kiss of Decay drains but is magic) — bruiser, intended. Three T4 options after the change (No Mercy, Demonic Claw, Cataclysm Decree-if-INT-build).
- **Identity in one line:** stagger→No Mercy executioner who self-supplies stagger only via Demonic Roar (Body Check and No Mercy are both stagger PAYOFFS — today no row in his pool applies stagger, per synergy) and drops Infernal Decree burn / Hellmouth lava lanes for burn-finisher teammates.

### Chosen One `chosen one` — assassin · time · unholy/divine · pool 21
- **Now:** Main Character Energy (5) · Psychic Abilities (8) · Light (8)
- **Fit:**
  - Main Character Energy ✓ — the whole character; three rungs.
  - Psychic Abilities ✗ — nothing in the lore is psychic; Telepathic Link, Psychosis, Teleport, Psychic Barrier are the telepath/grey/occulus kit. Only the T4 rung `raceMindCrush` (Migraine) ties him here, and only because MCE has no T4.
  - Light ✓ — "divine energy signature": Smite, Aurora Ray, Judgment (physical cross 160 — good on atk 56), Protect.
- **Proposed families:** KEPT Main Character Energy · KEPT Light · REMOVED Psychic Abilities · ADDED Shadow (8) — the "unholy" half of "both signatures simultaneously": Shadow Infiltration (dash, poison, physical 120 — an assassin's engage), Shadow Step teleport 4, Phase Shift invisible, Shadow Realm 1v1, Void Rush. Light + Shadow IS the character. NEW T4 in Main Character Energy to replace the rung: `raceSeasonFinale` "Season Finale" — damage/damage 180 physical, rng 1, ignoreArmor, finisher poison×1.5 (pairs with his own Dark Feather poison), a kill refunds 1 AP ("the credits roll"). Rung `raceMindCrush` → `raceSeasonFinale`. Pool 6 + 8 + 8 = 22.
- **Pool gaps:** summary: sustain. Assassin with hp 390 — intended; Plot Armor def+1, Protect, Phase Shift, Shadow Realm are his survival. Movement (Dark Feather, Shadow Step), AOE (Aurora Ray, Judgment, Void Rush), buff (Sad Backstory, Prophecy Fulfilled), debuff (Fear, Aurora Ray def-1) all present.
- **Identity in one line:** glass-cannon skirmisher — Dark Feather poison + Prophecy Fulfilled overclock → Shadow Step → Season Finale; Plot Armor/Protect/Phase Shift keep 390 HP alive long enough for the destiny moment.

### Politician `politician` — support · time · human · pool 13
- **Now:** Politics (2) · Deep State Connections (2) · Military Combat (10)
- **Fit:**
  - Politics ✓ — Filibuster silence zone, Executive Order stun; both rungs. Only 2 rows (missing T2, T4).
  - Deep State Connections ✓ — Black Budget (rung), Brainwash; exactly him. Only 2 rows (missing T1, T4).
  - Military Combat ✗ (half) — the commander-in-chief call-ins fit (Rally Command, Fortify, Artillery Strike, Rangefinder, Fire for Effect, `sharedNuke` rung); Suppressive Fire (physical 80, atk 22), Iron Bulwark self-def, Iron Dome are a soldier's, not his. Kept for the rung and the only AOE/T4 he has; ask the family auditors whether Military Combat should split into "Fire Support" (call-ins) and "Infantry" — he would take only the first.
- **Proposed families:** KEPT Politics (NEW fill: T2 "Smear Campaign" single marked+atk-1, T4 "State of Emergency" aura team def+1/atk+1 or a 100-MP Nuke-style call-in) · KEPT Deep State Connections (NEW fill: T1 "Leak" single scanner, T4 "Regime Change" possess) · KEPT Military Combat (caveat above) · ADDED Cult of Personality (3: The Kool-Aid charm, Indoctrinate possess, The Gathering summon) — "speech patterns induce compliance in 89% of listeners"; the family name is a political term · ADDED Persuasion once filled (currently 0 rows; it is the anomaly in his lore line). Pool 13 → 16 (+fills).
- **Pool gaps:** summary: movement — intended. No heal: Fortify shield 96, Iron Dome team def+1, Black Budget overclock — a control support; acceptable, but Persuasion's fill should carry one cleanse. T4: Nuke, Fire for Effect (burn finisher needs a teammate).
- **Identity in one line:** control support — Filibuster silence zone, Executive Order stun, Brainwash discord, Kool-Aid/Indoctrinate steal activations; Black Budget overclocks the carry and Nuke is the late button.

### Atlantean `atlantean` — support · time · human/anomaly · pool 20
- **Now:** Water Abilities (8) · Ice Magic (8) · Arcane Magic (4)
- **Fit:**
  - Water Abilities ✓ — all four rungs; water resist.
  - Ice Magic ✗ — lore is water + temporal fields, nothing about cold; "water freezes" is the element-adjacency argument, i.e. yeti/Christmas.
  - Arcane Magic ✓ — a civilization predating all records casts old magic; Spellsteal/Polymorph fit int 64.
- **Proposed families:** KEPT Water Abilities · KEPT Arcane Magic · REMOVED Ice Magic · ADDED Temporal Abilities (4: Judgment Beam, Temporal Shift swap, Reality Pulse, Time Rewind) — "innate manipulation of localized temporal fields" is the lore verbatim; also MOVE `raceTemporalTide` (his T3 rung, heal zone 100/turn) from Water into Temporal Abilities where the name belongs and where the family has no heal · ADDED Occult Knowledge (4: Sacred Geometry crystal tiles, Pyramid Protocol, Ancient Magic, Weigh the Heart) — Atlantean crystals and a pre-record civilization. Pool 7 + 4 + 5 + 4 = 20.
- **Pool gaps:** summary: movement. Temporal Shift (swap) fills it. Redundancy inside his pool: `raceTidalBlessing` (T2, 52/turn ×2) and `raceTemporalTide` (T3, 100/turn ×2) are the same zone-heal twice — moving Temporal Tide to Temporal Abilities keeps both but on different family shelves; if the family auditors want one, keep Temporal Tide and make Tidal Blessing a family-scoped UPGRADE "Blessed Tide" (+1 zone round, 1 SP) on Whirlpool. atk 62 is wasted on a caster/support — flag for a stat pass.
- **Identity in one line:** zone healer + wave controller — Temporal Tide heal zone, Water Pulse/Tsunami shove lanes, Temporal Shift swap-saves, Whirlpool slow → Tidal Slam ×1.5 self-contained.

### Dinosaur `dinosaur` — bruiser · space · anomaly · pool 20
- **Now:** Apex Predator (4) · Beast Abilties (7) · Earth Abilities (10)
- **Fit:**
  - Apex Predator ✓ — built for it (Jurassic Jaw rung).
  - Beast Abilties ✓ — Bite, Pounce, Tail Whip (`raceDinoTailWhip` rung), Ambush Lunge. `raceBorrowedClaw` (stealSpell) is skinwalker text on every beast — flag for the family auditors.
  - Earth Abilities ✓ (half) — a 7-ton biped shaking the ground (Tremor Stomp, Ground Slam, Quake, `sharedFissure` rung) makes internal sense; Boulder Hurl, Stonefall, Rampart menhirs, Stone Drop (requires flight) do not. If Earth is split into Seismic vs Stonework, the dinosaur takes Seismic only.
- **Proposed families:** KEPT Apex Predator · KEPT Beast Abilties · KEPT Earth Abilities (Seismic half). Pool stays 20 (drops to ~15 on a split). Rungs unchanged.
- **Pool gaps:** summary: movement. Stampede (dash), Pounce rng 3, Ambush Lunge charge, Predator Leap — the engage is there; intended. Sustain: Bite 30% drain + Jurassic Jaw kill-heal 25% — enough for a bruiser. T1-heavy (10 T1 / 2 T2) because Beast has 5 T1 and Earth 4 T1; Beast needs its missing T2/T4 (family auditors). `raceApexCharge` Stampede T2 130 dmg 2AP is a tier-rule offender by the summary; the 2 AP justifies it — keep.
- **Identity in one line:** self-contained stagger→Jurassic Jaw finisher (Stampede / Tremor Stomp / Fissure stagger → Jaw ignores DEF) with Primal Roar discord and Apex Roar atk aura for the pack.

### Dragon `dragon` — caster · chaos · unholy/anomaly · pool 11
- **Now:** Dragon Abilities (4) · Fire Magic (4) · Wind Control (3)
- **Fit:**
  - Dragon Abilities ✓ — all four rungs.
  - Fire Magic ✓ — 1,400°C combustion discharge; int 54, fire resist.
  - Wind Control ✓ — winged quadruped; Wing Attack is a rung alternative.
- **Proposed families:** KEPT all three · ADDED Beast Abilties (7) — reptilian beast: Bite (blood drain — its only sustain), Tail Whip, Feral Dive (a diving leap-strike for a flyer), Ambush Lunge. Pool 11 → 18.
- **Pool gaps:** summary: sustain, movement, buff. Movement is intended (it flies). Sustain: Bite 30% drain from Beast. Buff: none — a caster/breather; acceptable, but if the family auditors want one, NEW Dragon Abilities row is not needed (family is T1–T4 complete); leave it. `raceDragonToss` T3 base dmg 70 is a listed outlier — its payload is the fall/collision (dmgPerLevel 25, collisionBonus 60) plus burn×1.5; fine as designed but the description should say the base is light.
- **Identity in one line:** burn engine — Dragon Breath lane + Dragonfire line burn everything, Dragon Toss ×1.5 on the burning target, Dragonfear discord for Bull Rush/Depth Charge teammates; the flying skyThrow specialist.

### Ghoul `ghoul` — assassin · chaos · unholy · pool 18
- **Now:** Grave Hunger (5) · Poison Abilities (5) · Shadow (8)
- **Fit:**
  - Grave Hunger ✓ — its own family; Terror Pounce rung.
  - Poison Abilities ✓ (half) — "paralytic compound delivered via bite" justifies Infectious Bite (physical 100 poison) and the `sharedPoisonSwamp` rung; Corrosive Splash/Formic Acid/Splash are magic on int 20.
  - Shadow ✓ — an undead night predator; Fear is a rung, Shadow Infiltration (physical dash 120 poison) and Shadow Step are assassin tools.
- **Proposed families:** KEPT all three. Pool 18. Rungs unchanged. Changes inside: RETIER `raceFrenzy` T1 → T2 (50 MP): 120 dmg + grievous + 30% drain is a tier-rule offender and sits on the same T1 shelf as Ghoulish Bite (100 + poison + 40% drain) — two T1 bite-drains in one family. Grave Hunger becomes 1/2/1/1 (the T1 rung alternative [`raceGhoulishBite`,`raceFrenzy`] then drops Frenzy, since a T2 row cannot sit in the T1 slot). Optionally REWRITE `raceGhoulishBite` poison2 → poison2 + root1 ("paralytic") so the Precision Shot/Haymaker root payoffs on teammates fire.
- **Pool gaps:** summary lists none. Sustain (Frenzy, Ghoulish Bite, Carrion Feast), movement (Corpse Crawl, Shadow Step), AOE (Corrosive Splash, Void Rush), T4 (Terror Pounce, Shadow Realm, Void Rush) — complete. Fear → Terror Pounce ×1.5 is self-contained.
- **Identity in one line:** self-sustaining melee assassin — Fear → Terror Pounce strips buffs and finishes, Frenzy's grievous shuts down enemy healers, Corpse Crawl/Shadow Step reach the backline.

### Gnome `gnome` — specialist · time · anomaly · pool 17
- **Now:** Engineering (5) · Earth Abilities (10) · Trap Making (3)
- **Fit:**
  - Engineering ✓ — 200–300 years ahead; Clockwork Turret and Overtinker are rungs.
  - Earth Abilities ✗ — a 50-cm engineer does not hurl boulders or quake; atk 34 kills every physical Earth row. The only tie is the "garden gnome = earth spirit" pun, not the lore. Rung `sharedFissure` lives here.
  - Trap Making ✓ — "booby-trap personal spaces with alarming creativity"; Tinker's Contraption is a rung. `raceLucidTrap` text ("You're still dreaming") is dreameater flavor — rename for the shared family.
- **Proposed families:** KEPT Engineering · KEPT Trap Making (NEW fill: T1 "Tripwire" single root1 placed trap, T4 "Rube Goldberg" chain-trigger of all standing traps/turrets) · REMOVED Earth Abilities · ADDED Hidden Technology (5: Tesla Coil trap, Free Energy, Deneuralizer, Classified Weapon, Railgun) — the "exceeds current human technology" line. Rung `sharedFissure` → `raceLucidTrap` (Trap Making) or `raceTeslaTrap` (Hidden Technology). Pool 4 + 3(+2) + 5 = 12–14 with `fiveGTower` moved to Conspiracy Knowledge as proposed above (13–15 if it stays); Engineering keeps Repair/Deploy Turret/Clockwork Turret/Overtinker.
- **Pool gaps:** summary: movement, debuff. Movement intended (28 SPD nest-builder). Debuff: Deneuralizer jammed and Tesla Coil from Hidden Technology fill it. Sustain: Repair. T4: Overtinker, Classified Weapon (int 36 — weak), Railgun (atk 34 — weak): its real T4 is Overtinker; the NEW Trap Making T4 gives it a second.
- **Identity in one line:** turret-and-trap zoner — Deploy Turret ×2 + Clockwork Turret + Tesla Coil + Trapdoor, Overtinker shields the nest, Repair keeps it up; the specialist you fight through, not at.

### Kaiju `kaiju` — bruiser · chaos · unholy/tech · pool 18
- **Now:** Kaiju Rampage (4) · Earth Abilities (10) · Deep Sea Anatomy (5)
- **Fit:**
  - Kaiju Rampage ✓ — all four rungs.
  - Earth Abilities ✓ — an 8–12 m walker IS a quake; Tremor Stomp/Quake/Ground Slam/Fissure fit, Boulder Hurl fits (it throws things); Rampart/Stone Drop do not but are ignorable. atk 100 makes every row live.
  - Deep Sea Anatomy ✗ (mostly) — Godzilla wading ashore is iconic, but the rows are Ink Cloud (kraken text), Ocean Current ("the bell folds" — jellyfish text), Poseidon's Wrath (magic, int 25). Only Deep Dive and Depth Charge (physical 125 AOE) work.
- **Proposed families:** KEPT Kaiju Rampage · KEPT Earth Abilities · REMOVED Deep Sea Anatomy · ADDED Giant Abilities (4: Fee Fi Fo Fum stagger AOE, Titan Drop leap, Colossal Crush 180 stagger×1.5, Giant Smash dash stun) — it is the biggest thing on the field. Pool 4 + 10 + 4 = 18. REWRITE `raceAtomicBreath` (T4 rung) damage type magic → physical: "directed-energy discharge" is a body function and the unit has int 25 / atk 100; as shipped the signature move is its weakest row.
- **Pool gaps:** summary: sustain, buff. Sustain = Thermal Regen passive + fire absorb (intended). Buff: none — bruiser, intended. Movement: Seismic Leap, Titan Drop.
- **Identity in one line:** stagger battery — Cataclysm Stomp / Seismic Leap / Fee Fi Fo Fum stagger → Atomic Breath line or Colossal Crush ×1.5, all self-contained; every hit deforms the map.

### Kraken `kraken` — support · space · anomaly · pool 17
- **Now:** Deep Sea Anatomy (5) · Water Abilities (8) · Wind Control (3) · Tentacle Appendages (1)
- **Fit:**
  - Deep Sea Anatomy ✓ — Ink Cloud and Depth Charge are its rungs; the family's ink row is literally the kraken's.
  - Water Abilities ✓ — int 69, water resist.
  - Wind Control ✗ — Wing Attack and Sky Tackle on a cephalopod; only the rung `sharedVortexSlam` (wind/magic pull) ties it, and a kraken's vortex is water.
  - Tentacle Appendages ✓ — its own; 1 row (Tentacle Lash rung).
- **Proposed families:** KEPT Deep Sea Anatomy · KEPT Water Abilities · KEPT Tentacle Appendages (NEW fill: T2 "Grasping Arms" aoe r1 pull-to-center + root1, T3 "Constrict" single 125 physical + root2 + 30/round, T4 "Eight Arms" multiHit 8×[30] with Ricochet-style bounce) · REMOVED Wind Control · ADDED Cryptid Abilities (3: Dread Aura discord, Blurry Photo invisible, Cryptid Vanish) — "It's choosing when to be seen" is the lore line; loch ness/bigfoot share it. Rung `sharedVortexSlam` → `raceCallOfTheDeep` (Water, T4 — the name is the kraken's). Pool 5 + 8 + 1(+3) + 3 = 17–20.
- **Pool gaps:** summary: buff. A control support with no ally buff — Blurry Photo (self invisible) is the only "buff". Hole: give the Tentacle T2 or the Cryptid family an ally row, or accept that its support is Ink Cloud discord + Tidal Blessing heals (Temporal Tide leaves Water if the atlantean move above goes through). Movement (Deep Dive, Ocean Current), AOE, debuff, T4 present.
- **Identity in one line:** pull-and-punish controller — Tentacle Lash/Whirlpool drag into Ink Cloud discord → Depth Charge ×1.5 (self-contained); Tidal Blessing heals the melee it dragged them into.

### Loch Ness Monster `loch ness monster` — tank · space · anomaly · pool 24
- **Now:** Deep Sea Anatomy (5) · Water Abilities (8) · Cryptid Abilities (3) · Ice Magic (8)
- **Fit:**
  - Deep Sea Anatomy ✓ — Deep Dive rung; aquatic reptile.
  - Water Abilities ✓ (stat caveat) — Whirlpool and Tidal Slam are rungs; Tidal Slam (physical 170) is its real T4, the magic rows (Tsunami, Great Flood, Call of the Deep, Water Pulse) are weak on int 31.
  - Cryptid Abilities ✓ — THE cryptid; "acoustic camouflage" = Cryptid Vanish rung.
  - Ice Magic ✗ — a cold loch is a location, not a power; ice resist ≠ cryomancer, int 31. Same argument as Christmas on the yeti.
- **Proposed families:** KEPT Deep Sea Anatomy · KEPT Water Abilities · KEPT Cryptid Abilities · REMOVED Ice Magic · ADDED Beast Abilties (7) — "aquatic reptilian entity": Bite (drain), Tail Whip (push 2), Pounce; a plesiosaur bites and tail-whips. Pool 5 + 8 + 3 + 7 = 23.
- **Pool gaps:** summary lists none. Sustain (Tidal Blessing, Bite; Temporal Tide only while it stays in Water — see atlantean), movement (Deep Dive), AOE (Whirlpool, Tidal Slam, Depth Charge), debuff (Dread Aura, Ink Cloud), T4 (Tidal Slam) — complete for a tank. Dread Aura discord → Depth Charge ×1.5 and Whirlpool slow → Tidal Slam ×1.5 are self-contained.
- **Identity in one line:** amphibious frontliner — Deep Dive in with Protect, Tidal Slam slow-finisher, Dread Aura for Depth Charge; the 92-DEF tank that vanishes (Cryptid Vanish) instead of dying.

### Yeti `yeti` — bruiser · time · anomaly · pool 14
- **Now:** Ice Magic (8) · Winter Warfare (3) · Cryptid Abilities (3)
- **Fit:**
  - Ice Magic ✓ — "cryokinetic capability", int 52 carries the magic rows; Ice Shard/Ice Slide/Permafrost are rungs.
  - Winter Warfare ✓ — Frozen Punch and Avalanche Strike are the yeti's own physical rows (atk 60).
  - Cryptid Abilities ✓ — "alpine apex cryptid".
- **Proposed families:** KEPT all three · ADDED Sasquatch Abilties (2: Big Kick 120, Sasquatch Smash 180 stagger×1.5) — the yeti is the Himalayan sasquatch ("upper body strength exceeds any primate by factor of 3"); mondo's rule allows one-race families but this one is the same creature. Pool 14 → 16. Winter Warfare needs its missing T2/T3 (family auditors): NEW T2 "Snow Cover" self invisible1 + regen1, NEW T3 "Ice Club" physical 125 rng 1 frozen×1.5 ("crude weapons from ice and stone" — lore verbatim). Rungs unchanged.
- **Pool gaps:** summary: sustain — bruiser, intended (Snow Cover regen would soften it). Movement: Ice Slide dash. Debuff: Dread Aura, slows. T4: Avalanche Strike, Absolute Zero (magic 2AP), Sasquatch Smash. Frozen chain (Flash Freeze/Permafrost → Frozen Punch/Avalanche ×1.5) is self-contained.
- **Identity in one line:** frozen-chain bruiser — Permafrost/Flash Freeze freeze → Frozen Punch / Avalanche Strike ×1.5, Ice Slide re-paves the lane in ice for the whole team's slide plays.

### Barbarella `barbarella` — assassin · space · human/anomaly · pool 11
- **Now:** Alien Weapons (6) · Seduction (5) · Astronaut Camp (1)
- **Fit:**
  - Alien Weapons ✓ — "directed-energy sidearms and a plasma-whip": Stun Ray and Plasma Whip are rungs (Plasma Whip shows twice only as the `raceLavaLamp` alias).
  - Seduction ✓ — "HONEY TRAP RISK"; Draining Embrace rung.
  - Astronaut Camp ✓ — Gravity Boots rung ("anti-gravity propulsion"); 1 row, needs fill (NEW T1 "Zero-G Kick" 90 physical push 2, T3 "Airlock" single push 4 + collision, T4 "Re-entry" leapStrike 160 burn).
- **Proposed families:** KEPT all three · ADDED Spy Gear (7) — a honey trap is a spy: Agent Vanish, Knife Throw, Poison Dart, Sneak Slash T4 physical (she has one T4 today and it is magic). Pool 11 → 18. Flag: her T4 rung `raceDrainingEmbrace` is magic 180 on int 31 / atk 72 — on her it is the weakest T4 in the pool. Alien Weapons is missing T2/T4: NEW T4 `racePlasmaLash` "Plasma Lash" physical 180 rng 2 burn2 finisher burn×1.5 (the whip, cranked) and set her T4 rung to it.
- **Pool gaps:** summary: buff — assassin, intended. Movement (Gravity Boots, Agent Vanish), debuff (Stun Ray, Charm, Shrink Ray), sustain (Soul Suck 60% drain) present. Charm → Enthrall / Draining Embrace is self-contained.
- **Identity in one line:** charm assassin — Stun Ray stun, Charm → Enthrall steals a double activation, Draining Embrace/Plasma Lash finish; Gravity Boots + Agent Vanish get her behind the line and out again.

### Black Goo `black goo` — specialist · chaos · anomaly/unholy · pool 16
- **Now:** Ooze Biology (6) · Poison Abilities (5) · Alien Weapons (6)
- **Fit:**
  - Ooze Biology ✓ — its own; five of the seven rung slots (Goo Shot, Icky Surprise, Absorb, Toxic Nova, Mitosis).
  - Poison Abilities ✓ — corrosive; Corrosive Splash/Splash are the other two rung slots (Poison Swamp is the ghoul's rung, not his); int 46 is enough for the 80–125 magic rows.
  - Alien Weapons ✗ — a blob does not hold a heat ray, a stun ray or a shrink ray. "Impact site" origin is not a weapons rack.
- **Proposed families:** KEPT Ooze Biology · KEPT Poison Abilities · REMOVED Alien Weapons · ADDED Symbiosis (3: Symbiote Armor regen, Symbiotic Drain poison×1.5, Tendril Strike T4 physical 180 poison) — "absorbs organic material on contact, growing proportionally" is the symbiote; the symbiote race already shares Ooze Biology the other way. Pool 6 + 5 + 3 = 14. REWRITE `raceMitosisSplit` (T4 rung, currently effect/buff regen2 — a T4 that is a worse Symbiote Armor): make it deploy/summonUnit "Mitosis" — split off a goo spawn on an adjacent tile (move 3, dmg 55, 2 hits, maxActivePerCaster 2, spawns Gooed on hit); that is what mitosis means and it gives the pool a real T4.
- **Pool gaps:** summary lists none; but tiers are 9 T1 / 2 T2 / 4 T3 / 1 T4 — the T4 is the regen buff. Symbiosis' Tendril Strike + the Mitosis rewrite fix the top. Movement: Icky Surprise. Sustain: Absorb 40% drain, Symbiote Armor.
- **Identity in one line:** goo engine — Goo Shot/Splash goo the target (heals halved, magic ×1.25) → Absorb ×1.5 (poison OR goo) / Symbiotic Drain ×1.5 (poison only — Toxic Nova/Corrosive Splash supply it) and every magic caster on the team hits harder; Ooze Trail slows the lane, Icky Surprise erupts from any ooze tile.

### Golem `golem` — tank · time · human/divine · pool 15
- **Now:** Living Stone (4) · Earth Abilities (10) · Desert Acclimation (2)
- **Fit:**
  - Living Stone ✓ — stone and clay; Stone Skin rung; Stoneform is its regen.
  - Earth Abilities ✓ — int 0, and every Earth row is physical: Boulder Hurl, Fissure, Quake are rungs; Rampart menhirs fit a construct that IS masonry.
  - Desert Acclimation ✗ — Dust Devil is magic (int 0 → 0 damage) and Summon Sandstorm is a martian/anubis weather; a clay golem animated by sigils has no desert in its lore.
- **Proposed families:** KEPT Living Stone · KEPT Earth Abilities · REMOVED Desert Acclimation. Pool 4 + 10 = 14. Living Stone is missing T1/T4 (family auditors): NEW T1 "Sigil Ward" utility/guard (the Chivalry mechanic: dash to an ally and take the hit — a golem is built to protect), NEW T4 "Unmake the Word" self-AOE 170 physical stagger + the golem loses 25% max HP (erase a letter of the sigil). No added family: nothing else in the index fits a mute clay guardian, and 14 with two full-tier families is enough.
- **Pool gaps:** summary: sustain, movement. Movement intended (25 SPD wall). Sustain is actually present: Stoneform regenerates 15% max HP/round for 2 rounds while immune. Buff (Stone Skin), debuff (Calcify int-2, Earthen Grasp root), AOE (Tremor Stomp, Quake), T4 (Quake, Rampart) all present; stagger → Boulder Hurl ×1.5 self-contained.
- **Identity in one line:** immovable wall — Stone Skin + Stoneform, Rampart/Fissure rewrite the map, Tremor Stomp/Quake stagger → Boulder Hurl; the tank that holds a chokepoint for 3,000 years.

### Sedan `honda civic` — specialist · space · tech · pool 13
- **Now:** Driving Skills (5) · Robotic Hardware (10) · Machinery (1)
- **Fit:**
  - Driving Skills ✓ — Ram Charge, Transform, Exhaust Cloud, Nitro Boost, Vehicular Manslaughter are all rungs.
  - Robotic Hardware ✓ — the mech form; atk 78 makes the physical rows live (Robo Punch rung). `empBurst`/`overclock` lightning rows are the only ones off-stat (int 10).
  - Machinery ✓ — Hydraulic Crush; 1 row, needs fill (NEW T1 "Piston Jab" 90 physical jammed×1.5, T2 "Grease Fire" 3-tile scorched line, T4 "Compactor" single 180 physical + root2).
- **Proposed families:** KEPT all three. Pool 13 (+fills). REWRITE `raceMissileBarrage` "Vehicular Manslaughter" (T4 rung): today it is damage/aoe 160 rng 4 — a bombardment with a running-people-over name (the id says missile barrage). Either RENAME it "Missile Barrage" (mech form fires the rack) or REWRITE it as damage/dash 160 dashDamage 70 finisher discord×1.5 (run the line down, Exhaust Cloud discord → ×1.5). The dash version is the car's identity and the pool's only dash today is the T1 Ram Charge (100, stagger) — no T4 dash; recommend the rewrite.
- **Pool gaps:** summary: movement, debuff. Movement: Ram Charge dash + Nitro Boost + 84 SPD — intended. Debuff: Exhaust Cloud is a discord zone (the summary counts only debuff-kind rows). Sustain: Self-Repair Protocol 35%. T4: Vehicular Manslaughter, Kill Mode, EMP Burst (dead on int 10).
- **Identity in one line:** fast flanker — 84 SPD + Nitro → Ram Charge stagger → Robo Punch ×1.5; Transform into the mech for +2 RNG, +1 DEF / +2 M DEF (−3 SPD) when the lane is held, Exhaust Cloud discord → Vehicular Manslaughter.

### Ice Queen `ice queen` — caster · time · divine/anomaly · pool 14
- **Now:** Ice Magic (8) · Winter Warfare (3) · Healing Magic (3)
- **Fit:**
  - Ice Magic ✓ — all four rungs; ice immune, int 82.
  - Winter Warfare ✗ — Frozen Punch (physical 90) and Avalanche Strike (physical 180) on atk 8 are zero; a queen does not throw haymakers. Snowball Volley is the one usable row.
  - Healing Magic ✗ — nothing in her lore heals; Heal/Heal All/Revive are here because "divine". She is a frost sovereign, not a cleric.
- **Proposed families:** KEPT Ice Magic · REMOVED Winter Warfare · REMOVED Healing Magic · ADDED Cosmic Abilities (11) — "dominion over the frozen places between the stars" is the lore line: Heat Death (the universe's final cold), Black Hole, Gravity Well slow, Nebula, Phase Walk; every row is magic except `raceCosmicSlam` (physical 125) — which the antihero entry moves to Superhero Powers, leaving Cosmic at 10 rows, all magic. Pool 8 + 10 = 18 (19 if Cosmic Slam stays). Inside Ice Magic: DELETE `raceIceShard` (T1 100 slow1 rng 3) — `raceIceSpear` (T1 100 slow2 rng 5) is strictly better in the same slot; the yeti's rung alternative [`raceFrozenPunch`,`raceIceShard`] becomes [`raceFrozenPunch`,`raceIceSpear`].
- **Pool gaps:** summary: movement, buff, debuff. Cosmic fills movement (Phase Walk) and debuff (Gravity Well slow, Entropic Beam def-1, Supernova def-1). Buff stays empty — a pure control caster; acceptable. Sustain gone with Healing Magic — she was never the healer (245 MP goes to Absolute Zero 2AP + Permafrost). T4: Absolute Zero, Black Hole, Heat Death, Star Decree, Supernova.
- **Identity in one line:** the team's freeze supplier — Flash Freeze / Permafrost / Absolute Zero frozen for Frozen Punch, Avalanche Strike and Sleigh Dash carriers, Heat Death/Black Hole to lock a zone; Diamond Dust ices the floor for slide plays.

### Juggernaut `juggernaut` — tank · chaos · unholy/human · pool 15
- **Now:** Athleticism (5) · Dirty Fighting (7) · Giant Abilities (4)
- **Fit:**
  - Athleticism ✓ (one row off) — Thick Hide and Unstoppable Charge are rungs, Rampage fits; Nimble Dodge ("gracefully dash 2 tiles and vanish") contradicts "Subject does not run" — it cannot be gated per race, ignore.
  - Dirty Fighting ✓ — Body Check and Brutal Slam are rungs; Skull Crack (silence, int 0 unit) is a fun anti-caster tool.
  - Giant Abilities ✓ — 3.8 m, 2,200 kg.
- **Proposed families:** KEPT all three. Pool 15. No rung changes.
- **Pool gaps:** summary: sustain — 800 HP, def 79, Thick Hide: intended, the tank that walks through it. Movement: Unstoppable Charge/Rampage/Giant Smash are dashes. Debuff: Iron Grip root, Skull Crack silence, Curb Stomp grievous. T4: No Mercy, Rampage, Unstoppable Charge, Colossal Crush, Giant Smash — five, all physical; stagger chain self-contained (Unstoppable Charge/Fee Fi Fo Fum stagger → Body Check/No Mercy/Colossal Crush ×1.5 — Body Check is a payoff, not a setup).
- **Identity in one line:** stagger wall — Unstoppable Charge / Fee Fi Fo Fum stagger → Body Check / No Mercy / Colossal Crush ×1.5; Iron Grip roots what tries to leave, and 800 HP means it never needs to.

### Ki Fighter `ki fighter` — bruiser · time · human · pool 12
- **Now:** Ki Energy (4) · Martial Arts (4) · Athleticism (5)
- **Fit:**
  - Ki Energy ✓ — its own; three rungs. Stat caveat: Ki Volley (3×45) and Ki Wave (135 line) are light/magic on int 46 while atk is 82 — the lore says ki is "channeled through trained physical movements": REWRITE `raceKiBlast` and `raceKiWave` to physical damage type. Lore also promises "defensive barriers" and the family has none: REWRITE `raceKiCharge` (T2 atk+1 — a duplicate of every atk+1 buff) to atk+1 + shield 120 ("charge up").
  - Martial Arts ✓ — Flurry of Blows and Dragon Fist are rungs.
  - Athleticism ✓ — Mach 0.3 bursts; Nimble Dodge, Rampage.
- **Proposed families:** KEPT all three · ADDED Human Grit (5) — a human who eats 12,000 calories a day: Adrenaline Rush (55% self-heal + spd+1) is the sustain the pool lacks, Underdog Spirit/Indomitable Will fit a tournament fighter. Pool 12 → 17. Ki Energy is missing T4 (family auditors): NEW T4 "Spirit Bomb" delayed aoe r2 180 physical, 2AP, delayTurns 1 — the charge-up finisher.
- **Pool gaps:** summary: sustain, debuff. Sustain fixed by Human Grit. Debuff: Haymaker shoves and only Unstoppable Charge (Athleticism T4) applies a status (stagger1) — a duelist bruiser, intended; Haymaker's root×1.5 needs a teammate. T3 is thin (Instant Transmission only) — the Ki Charge shield rewrite and Underdog Spirit fill the mid-game.
- **Identity in one line:** burst duelist — Ki Charge → Instant Transmission 5 tiles → Dragon Fist / A Really Good Punch, Flurry of Blows chews shields; brings his own root payoff (Haymaker) for a Kneecap Shot/Iron Grip teammate.

### King Arthur `king arthur` — tank · time · human/divine · pool 12
- **Now:** Camelot Powers (4) · Knighthood (3) · Swordsmanship (5)
- **Fit:**
  - Camelot Powers ✓ — all four rungs.
  - Knighthood ✓ — Chivalry (guard an ally), Oath of Valor aura. `raceCrusade` (T4 cross light/MAGIC 160) is dead on int 28 — and on the Knight; REWRITE Crusade to physical (a crusade is swung).
  - Swordsmanship ✓ — Excalibur; Blessed Blade (physical 170 AOE) and Dragon Slash (burn×1.5, self-contained via Excalibur Strike burn) suit atk 70.
- **Proposed families:** KEPT all three · ADDED Horseback Riding (1: Brave Charge; knight/cowboy/sheriff) — the king rides; needs fill (NEW T2 "Lance" line 110 physical push, T3 "Cavalry Wheel" swap with an ally + both gain atk+1, T4 "Wild Hunt" dash 170 stagger). Pool 12 → 13 (+fills). Knighthood is missing T2: NEW T2 "Vigil" self-heal 30% + cleanse 1.
- **Pool gaps:** summary: sustain, debuff. Sustain: Chivalry redirects, nothing heals — the Knighthood "Vigil" fill answers it. Debuff: Excalibur Strike burn only — a leader tank, intended. Movement: Knights of Round (pulls the team to him). T4: Excalibur Strike, Crusade, Blessed Blade, Dragon Slash.
- **Identity in one line:** rally tank — Royal Decree + Oath of Valor atk auras, Knights of Round regroups the whole team on the king, Walls of Camelot holds the line, Excalibur Strike burn → Dragon Slash ×1.5.

### King Kong `king kong` — bruiser · chaos · anomaly · pool 17
- **Now:** Kaiju Rampage (4) · Beast Abilties (7) · Monkey Brains (3) · Agriculture (3)
- **Fit:**
  - Kaiju Rampage ✓ — Seismic Leap rung; Skyscraper Toss is the Empire State moment. `raceAtomicBreath` (magic 160, int 20) is Godzilla's, not Kong's — ignorable.
  - Beast Abilties ✓ — a great ape: Bite, Pounce, Ambush Lunge.
  - Monkey Brains ✓ — his own; three rungs. Note the id/name cross: `raceApeFury` is named "Monkey Business" (T3 buff) and `racePrimalSmash` is named "Ape Fury" (T4) — flag for the data cleanup, no gameplay change.
  - Agriculture ✗ — Healing Seed/Poison Seed/Leech Seed: Kong eats bananas, he does not plant them.
- **Proposed families:** KEPT Kaiju Rampage · KEPT Beast Abilties · KEPT Monkey Brains · REMOVED Agriculture · ADDED Giant Abilities (4) — a 12 m, 8,000 kg ape is a giant; Titan Drop leap, Colossal Crush stagger×1.5. Pool 4 + 7 + 3 + 4 = 18. REWRITE `racePrimalSmash` "Ape Fury" finisher slow×1.5 → stagger×1.5: his pool has no slow (needs a teammate today) but three stagger sources (Cataclysm Stomp, Seismic Leap, Fee Fi Fo Fum).
- **Pool gaps:** summary: movement. Seismic Leap, Titan Drop, Pounce/Ambush Lunge engage — intended. Sustain: Bite drain (bruiser, fine). Buff: Monkey Business atk+1. Debuff: Chest Pound def-1 self-AOE.
- **Identity in one line:** stagger slugger — Chest Pound def-1 opener, Seismic Leap stagger → Ape Fury / Colossal Crush ×1.5, Skyscraper Toss for cover-ignoring AOE; atk 100 with nothing wasted.

### Minotaur `minotaur` — bruiser · chaos · unholy/human · pool 19
- **Now:** Horns & Hooves (5) · Beast Abilties (7) · Dirty Fighting (7)
- **Fit:**
  - Horns & Hooves ✓ — all four rungs; 65 km/h charges.
  - Beast Abilties ✓ — bovine beast; Pounce/Bite are odd for a bull but Tail Whip/Ambush Lunge fit.
  - Dirty Fighting ✓ — a labyrinth brawler; No Mercy.
- **Proposed families:** KEPT all three. Pool 19. Inside: `raceHornToss` (T1 displacement 80, push 3, stagger×1.5) and `raceBodyCheck` (T1 displacement 100, push 2, stagger×1.5) are the same T1 row twice in his pool — REWRITE Horn Toss as a true toss: kind skyThrow-lite, "throw the target 3 tiles in any chosen direction, collisionBonus 60", keep stagger×1.5; now one is the straight shove and one is the placement tool. Horns & Hooves is missing T3: NEW T3 "Trample" dash 125 physical, dashDamage 60, stagger1.
- **Pool gaps:** summary: movement, buff. Gore Charge/Cliff Charge/Bull Rush are the engage — intended. Buff: none — bruiser. T1-heavy (10 T1) because all three families are T1-stacked; the Trample fill and Beast's missing T2/T4 are the family-side fix. Both finisher chains self-contained (Gore Charge stagger → Horn Toss/No Mercy; Labyrinth Roar discord → Bull Rush ×1.5).
- **Identity in one line:** charge bruiser — Gore Charge stagger → No Mercy, Labyrinth Roar discord → Bull Rush ×1.5, Horn Toss places the body where the team wants it; the most self-sufficient bruiser in the slice.

### Necromancer `necromancer` — caster · chaos · unholy · pool 12
- **Now:** Necromancy (4) · Bone Density (4) · Black Magic (4)
- **Fit:**
  - Necromancy ✓ — Life Drain, Plaguefield, Raise the Dead are rungs; missing T3.
  - Bone Density ✓ (half) — Bone Barrage (magic AOE, rung) fits; Bone Toss (physical 80) and Marrowstorm (physical 160 AOE) are zero on atk 8, Reassemble (self-heal 30%) is a skeleton's trick. He animates bone, he does not throw it: ask the family auditors to make `raceMarrowstorm` "higher of ATK/INT" so both owners use it.
  - Black Magic ✓ — Voodoo, Sacrifice, Baphomet's Rite; `raceDeathPact` (atk+1) is dead on every Black Magic owner except goatman/krampus — make it int+1.
- **Proposed families:** KEPT all three · ADDED Poltergeist Abilities (5: Grave Chill, Haunt 28 DoT ignoring armor — "weaponized decay", Cold Spot, Possession, Boo) — a practitioner commanding the restless dead; shadow entity/skeleton/ghost/jack o lantern share it. Pool 12 → 17. Necromancy NEW T3 "Corpse Explosion": target a gravestone/bone pile within 4, aoe r1 125 magic poison2, consumes the corpse (the Raise the Dead alternative).
- **Pool gaps:** summary: movement — caster, intended. Sustain: Life Drain 35%, Sacrifice. AOE: Bone Barrage, Rigormortis, Baphomet's Rite. Debuff: Rigormortis root, Voodoo, Haunt. T4: Raise the Dead, Marrowstorm (dead), Baphomet's Rite, Boo. Haunt → Boo ×1.5 self-contained; Marrowstorm's poison×1.5 has Plaguefield as its own setup once Marrowstorm scales on INT.
- **Identity in one line:** attrition caster — Plaguefield + Haunt tick the enemy down, Rigormortis roots → Life Drain ×1.5 sustain, Voodoo links the enemy carry to your tank, Raise the Dead turns every corpse into pressure.

### Occulus `occulus` — support · time · anomaly/divine · pool 17
- **Now:** Eyesight (5) · Psychic Abilities (8) · Occult Knowledge (4)
- **Fit:**
  - Eyesight ✓ — Omni-Vision, Hypnotic Pulse, Death Gaze are rungs.
  - Psychic Abilities ✓ — "pupil emits focused psychic energy"; Psychic Beam rung; int 84.
  - Occult Knowledge ✓ — Sacred Geometry's own text says "the all-seeing eye draws the pattern"; Pyramid Protocol (eye on the pyramid), Weigh the Heart. Fits.
- **Proposed families:** KEPT all three. Pool 17. Flag `raceBalefulGaze` (Eyesight T2, 130 magic line, 50 MP, 1 AP): the only 1-AP line at 130 below T3 (Ki Wave 135 costs 2 AP, Blue Wave/Sonic Breaker are 120) — RETIER to T3 or drop to 110.
- **Pool gaps:** summary: sustain. A support with no heal — Pupil Shield (aoe shield 130) and Psychic Barrier (shield 150) are its sustain; acceptable for a vision/stun support, but it is the reason it should never be a team's only support. Movement: Teleport (any unit). Debuff: Hypnotic Pulse stun, Psychosis, Psychic Beam discord. T4: Death Gaze, Migraine, Mind Shatter, Ancient Magic, Weigh the Heart.
- **Identity in one line:** vision + stun support — Omni-Vision scouts, Hypnotic Pulse stun → Death Gaze ×1.5 and every Take Aim/Aurora Ray teammate, Psychic Beam discord → Migraine; Teleport moves the carry, Pupil Shield covers the front.

### Quarterback `quarterback` — ranged · space · human · pool 17
- **Now:** Football IQ (7) · Athleticism (5) · Teamwork (3) · Marksmanship (3)
- **Fit:**
  - Football IQ ✓ — all four rung slots.
  - Athleticism ✓ — the athlete.
  - Teamwork ✓ — team sport; Encore ("Audible" energy), Pep Talk.
  - Marksmanship ✗ — Kneecap Shot / Precision Shot / Take Aim are metal firearm rows on a man who throws a ball; "inhuman accuracy" is already Football IQ's Bullet Pass/Hail Mary. Sharing "aim" is the element argument, not the identity.
- **Proposed families:** KEPT Football IQ · KEPT Athleticism · KEPT Teamwork · REMOVED Marksmanship. Pool 7 + 5 + 3 = 15. Inside Football IQ: `raceSpikeTheBall` (T3, aoe 80 physical — a listed under-tuned outlier) — REWRITE to aoe 110 + stagger1 (spiking the ball on someone's head) so it feeds Hail Mary; End Zone Dance (T1 atk+1) is the generic atk buff — fine.
- **Pool gaps:** summary: sustain, debuff. Sustain intended (ranged skirmisher; Nimble Dodge is the escape). Debuff: Blitz stagger, Spike-the-Ball stagger after the rewrite. Movement: QB Sneak, Blitz. T4: Hail Mary, Rampage, Unstoppable Charge. Blitz stagger → Hail Mary ×1.5 self-contained.
- **Identity in one line:** tempo ranged — Bullet Pass line poke, Blitz/Spike stagger → Hail Mary ×1.5, Audible spd aura + Encore hands the carry an extra action.

### Robin Hood `robinhood` — ranged · time · human · pool 15
- **Now:** Archery (7) · Hunting Skills (4) · Thievery (1) · Marksmanship (3)
- **Fit:**
  - Archery ✓ — six rung slots. `sentaiGreenArrow` "Green Arrow" (T2 heal with no healAmt pinned — "MEDIUM" by default, 25 MP off-ladder, a sentai id) is a stray: MOVE it to Sentai Colors (see super sentai) — the archer's kit should not carry the team's heal.
  - Hunting Skills ✓ — Sherwood: Forest Ambush, Camouflage, Whistle (the hound). `raceQuickDraw` "Long Rifle" is a rifle row — ignorable on him, flag for the family auditors.
  - Thievery ✓ — Steal from the Rich is a rung; 1 row, needs fill (NEW T1 "Pickpocket" 60 physical + steal, T3 "Give to the Poor" transfer a stolen buff/heal 120 to an ally, T4 "Heist" strip all buffs single 160).
  - Marksmanship ✓ — "split-arrow shots at 200 m"; Kneecap Shot (an arrow to the knee), Precision Shot root×1.5, Take Aim execute — accuracy IS his identity, unlike the quarterback's. Keep.
- **Proposed families:** KEPT all four. Pool 15 → 14 after the Green Arrow move (+Thievery fills).
- **Pool gaps:** summary: movement, debuff. Movement intended (Camouflage is the disengage; awr 98 ranged). Debuff: Steal from the Rich atk-1, Poison Arrow, Kneecap Shot root. Sustain: none after the move — ranged, intended. T4: Arrow Volley, Take Aim (stun×1.5 needs a teammate). Fire Arrow burn → Splitting Arrow ×1.5 and Kneecap Shot root → Precision Shot ×1.5 self-contained.
- **Identity in one line:** status archer — Fire Arrow burn → Splitting Arrow ricochet, Kneecap Shot root → Precision Shot, Piercing Arrow pins bodies to walls; Camouflage + Forest Ambush alpha from the treeline.

### Santa Clause `santa clause` — tank · time · divine/anomaly · pool 16
- **Now:** Christmas Spirit (5) · Winter Warfare (3) · Ice Magic (8)
- **Fit:**
  - Christmas Spirit ✓ — his own; five rung slots.
  - Winter Warfare ✓ (one row) — Snowball Volley is a rung; Frozen Punch/Avalanche Strike are physical on atk 34. Kept for the rung.
  - Ice Magic ✗ — the mirror of Christmas-on-the-yeti: the North Pole is where he lives, not what he does; Blizzard Present already gives him his one ice T4. int 74 makes it usable, which is not the test.
- **Proposed families:** KEPT Christmas Spirit · KEPT Winter Warfare · REMOVED Ice Magic · ADDED Engineering (5) — "material generation ex nihilo" is the workshop: Deploy Turret (toy soldier), Clockwork Turret (a wind-up toy, verbatim), Repair, Overtinker · ADDED Teamwork (3) — Encore hands an ally an extra action (a gift), Pep Talk, Team Strike (reindeer). Pool 5 + 3 + 5 + 3 = 16. Class is listed tank on hp 580 / atk 34 / int 74 / def 46 — he plays as a support/caster; flag for a class relabel. REWRITE `raceNaughtyList` (T3 atk-1 — the same row as Steal from the Rich T2) → marked3 + atk-1 ("on the list") so Double Pump/Knife-Throw teammates get a payoff.
- **Pool gaps:** summary: sustain, movement, buff. All three closed: Repair (sustain), Sleigh Dash (dash), Encore/Pep Talk/Overtinker (buff). White Christmas slow zone + Blizzard Present frozen → Sleigh Dash ×1.5 is self-contained; Lump of Coal burn feeds any burn finisher.
- **Identity in one line:** gift support — Encore/Repair/Overtinker keep the team going, White Christmas + Blizzard Present freeze the lane for Sleigh Dash and every Frozen Punch carrier, Clockwork toys hold the chimney.

### Super Sentai `super sentai` — tank · space · tech/human · pool 13
- **Now:** Sentai Colors (6) · Teamwork (3) · Martial Arts (4)
- **Fit:**
  - Sentai Colors ✓ — three rungs; missing T3.
  - Teamwork ✓ — five of them; Team Strike is a rung.
  - Martial Arts ✓ — the ground game before the Megazord.
- **Proposed families:** KEPT all three. Pool 13 → 14. MOVE `sentaiGreenArrow` from Archery back here as the missing Green row and REWRITE it: T3, 75 MP, damage/damage 125 rng 5 physical marked1 ("Green Arrow" — the ranger's bow); Sentai Colors becomes 1/4/1/1 and it no longer duplicates Pink Healing. Flag: `sentaiMegazordBlast` (T4 rung, magic 180 aoe, 2AP) on int 23 / atk 58 — the robot's blast should be physical, same problem as Kaiju's Atomic Breath; `sentaiBlueWave` T2 120 magic line is a tier-rule offender on paper but on int 23 it lands soft — fine.
- **Pool gaps:** summary: movement, debuff. Movement: none — a 32-SPD team tank, intended. Debuff: Blue Wave slow, Yellow Thunder stagger, Green Arrow marked after the move — covered by damageEffect rows. Sustain: Pink Healing 140. T4: Megazord Blast, A Really Good Punch (25 MP T4 — off-ladder outlier, RECOST to 100), Dragon Fist. Red Slash burn → Megazord Blast ×1.5 self-contained.
- **Identity in one line:** team tank — Black Guard protect + Pink Healing, Yellow Thunder stagger / Blue Wave slow set up the bruisers, Team Strike shreds shields, Red Slash burn → Megazord Blast as the group finisher.

### Pool-size running list (this slice)
| Race | Now | After proposals | Problem? |
|---|---|---|---|
| conspiracy theorist | **9** | 12 (16 if Internet Addiction is filled) | Yes — under 12 today; 5G Tower move + Deep State fixes it, Internet Addiction fill makes it comfortable. |
| dragon | **11** | 18 | Yes, mild — one family short; Beast Abilties closes it. |
| barbarella | **11** | 18 | Yes — Spy Gear + Astronaut Camp fills close it. |
| ki fighter | 12 | 17 | At the floor, not under; Human Grit adds depth and the missing sustain. |
| king arthur | 12 | 13 (+Knighthood/Horseback fills) | At the floor; fine — three families with rungs in every tier. |
| necromancer | 12 | 17 | At the floor; Poltergeist closes it. |
| loch ness monster | 24 | 23 | At the ceiling, not over; Ice Magic out / Beast in keeps it there. |
| antihero | 23 | 25 | One over after Cosmic (11) out and Spy Gear + Human Grit in; drop Human Grit to sit at 20 if 24 is a hard cap. |
| gnome | 17 | 12–14 (13–15 if 5G Tower stays in Engineering) | No — drops with Earth removed; Trap Making fills restore it. |
| golem | 15 | 14 | No. |
| black goo | 16 | 14 | No. |
| politician | 13 | 16 (+fills) | No. |
| quarterback | 17 | 15 | No. |
| ice queen | 14 | 18 (19 if Cosmic Slam stays in Cosmic) | No. |
| overlord | 18 | 22 | No. |
| droid | 18 | 22 (21 with the 5G Tower move) | No. |
| chosen one | 21 | 22 | No. |
| kraken | 17 | 17–20 | No. |
All other races in the slice (atlantean 20, dinosaur 20, ghoul 18, kaiju 18, yeti 16, honda civic 13, juggernaut 15, king kong 18, minotaur 19, occulus 17, robinhood 14, santa clause 16, super sentai 14) stay inside 12–24.


---

## R.4 Race fit — Symbiote … Hippie (31 races)

### Races part 4 (31 races: the sea, the show, the law, the forest, the new-race batch)

Pool counts below are "today → after the family auditors' g1–g9 verdicts plus this section's family list"; the family auditors' new rows are cited by the names they gave them.

### Symbiote `symbiote` — assassin · chaos · unholy/anomaly · pool 14
- **Now:** Symbiosis (3) · Ooze Biology (6) · Poison Abilities (5)
- **Fit:** Symbiosis ✓ (the living suit; 3 of 4 rungs) · Ooze Biology ✓ ("same biological class as BLACK GOO"; rung Goo Shot) — but Goo Shot, Absorb and Toxic Nova are magic on INT 31 · Poison Abilities ✗ (the parasite's venom is already Tendril Strike / Toxic Nova; Corrosive Splash, Formic Acid, Poison Swamp and the new Rot/Miasma are caster rows on an ATK 70 / INT 31 host, and Infectious Bite duplicates the new Tendril Whip). The lore's "strength +400%, speed +300%" has no family at all.
- **Proposed families:** Symbiosis KEPT (g6 rebuild: Tendril Whip T1, Web Swing T2, Symbiote Armor as a passive, Symbiotic Drain physical T3, Tendril Strike T4) · Ooze Biology KEPT · Athleticism ADDED (Sprint, Nimble Dodge, Shake It Off, Vault, Rampage — the enhanced host) · Poison Abilities REMOVED. Rung 2 `raceSymbioteArmor` becomes a passive → rung 2 `raceWebSwing`; `raceGooShot`, `raceSymbioticDrain`, `raceTendrilStrike` stay. Pool 14 → 17.
- **Pool gaps:** debuff — Goo (heals halved, −1 MOV, magic ×1.25) from Goo Shot / Splash is the debuff; losing Formic Acid's DEF −1 is fine. Sustain: Tendril Whip and Symbiotic Drain drain, Symbiote Armor knits once, Shake It Off cleanses — right for an assassin. AOE: Toxic Nova and Splash are magic; on INT 31 they are goo-painters, not nukes — acceptable, but flag that `raceAbsorb` (130 magic, ×1.5 vs Goo) is the pool's best payoff and the symbiote cannot use it: RECOST Absorb to blood/physical, or raise symbiote INT 31 → 50.
- **Identity in one line:** the drain assassin — Goo Shot goos, Absorb / Symbiotic Drain eat the gooed target, Icky Surprise erupts from its own ooze, Web Swing in and Sprint out.

### Valkraye `valkraye` — bruiser · time · divine · pool 16
- **Now:** Holy Defense (6) · Heavenly Duties (7) · Wind Control (3)
- **Fit:** Holy Defense ✓ (spear, shield maiden, chooser of the slain — all 4 rungs) · Heavenly Duties ✗ (a Norse psychopomp is not a chaplain: Divine Light, Purify, Sanctuary, Miracle are cleric rows; Divine Smite / Divine Judgment are magic on INT 26; with 80 MP nothing at 100 MP is castable. The one thing she does for heaven — carry the slain — is Chooser of the Slain in Holy Defense) · Wind Control ✓ (winged, "sustained flight").
- **Proposed families:** Holy Defense KEPT · Wind Control KEPT (g1: Gale, Updraft, Windborne) · Knighthood ADDED (g2 adds her: "unwavering honor code, refuses to engage unworthy opponents" — Chivalry, Shield Bash, Oath of Valor, the physical Crusade pinned at 75 MP) · Heavenly Duties REMOVED (no rung). Pool 16 → 15.
- **Pool gaps:** debuff — Valkyrie Spear DEF −1, Shield Maiden's taunt (g2 rewrite), Shield Bash Stagger: fixed. Sustain — only Chooser's revive: intended for a bruiser, but MP 80 means a single T3 per match; recommend MP 80 → 110 (today Chooser is 100 MP 2 AP and Crusade 100 MP 2 AP — neither castable on 80; g2 recosts Chooser 100 → 75 and pins the rewritten Crusade at 75). T4 after g2: Chooser 75, Crusade 75, Vortex Slam 100 (caster row, uncastable — fine).
- **Identity in one line:** the flying front-liner — Shield Bash / Spear soften, Divine Swoop from height, Chivalry intercepts and Chooser brings back the one who fell; the bruiser a glass team brings.

### The Watcher `watcher` — support · time · divine/anomaly · pool 17
- **Now:** Temporal Abilities (4) · Cosmic Abilities (11) · Astral Projection (2)
- **Fit:** Temporal Abilities ✓ (all temporal streams; 3 rungs) · Cosmic Abilities ✓ (an ancient cosmic entity; Cosmic Sight's own text is "Nothing is hidden from The Watcher"; Cosmic Slam is physical and dead on ATK 8 — pool ≠ kit) · Astral Projection ✓ (observes without intervening = remote viewing).
- **Proposed families:** all three KEPT. Rung 3 `raceTemporalShift` → `raceTimeRewindHeal` (g4 retiers Temporal Shift to T2 and adds the T3 heal). Pool 17 → 20.
- **Pool gaps:** sustain — Time Rewind (heal 40% + cleanse, Temporal T3) fixes it; debuff — Judgment Beam Slow, Stutter (Stagger+Slow), Entropic Beam DEF −1, Reality Pulse Discord: fixed. Nothing in the pool says "100% prediction": a Temporal family passive "Foresight" (allies within 2 cannot be crit) would be the row, if the g4 auditor wants one.
- **Identity in one line:** the prediction support — Stutter / Judgment Beam / Gravity Well set Slow and Stagger, Cosmic Sight strips the fog, Star Decree / Paradox pay, Time Rewind keeps the carry alive.

### Gangster `gangster` — bruiser · space · human · pool 18
- **Now:** Street Smarts (3) · Dirty Fighting (7) · Gun Training (8)
- **Fit:** Street Smarts ✓ (unique; the lore line by line) · Dirty Fighting ✓ (Shank, "shanked"; rungs Curb Stomp, and No Mercy's shape) · Gun Training ✓ ("small-arms proficiency is exceptional"; rung Extended Clips) · g8 adds Thievery ✓ ("Do not let them near your pockets"; Hit a Lick moves there) · g9 adds Gambling ✗ (nothing in the lore — the yeti test; it would also push him to 25).
- **Proposed families:** Street Smarts KEPT (g8: Mean Mug T1, Drive-By, Choppa, Empty the Clip T4) · Dirty Fighting KEPT · Gun Training KEPT · Thievery ADDED · Gambling NOT ADDED. Rung 2 pair `[raceDriveBy, raceHitALick]` stays legal through Thievery. Pool 18 → 21.
- **Pool gaps:** sustain — a bruiser; intended (Shank punishes anyone who leaves). MP 100 against four 100-MP T4s (Extended Clips, Empty the Clip, No Mercy, Dead Eye): one cast per match, and rung 4 `raceExtendedClips` (a team reload) is the least gangster of them — rung 4 → `raceEmptyTheClip` once it exists.
- **Identity in one line:** the stagger brawler with a gun — Body Check → Curb Stomp / No Mercy, Mean Mug's Discord for the team's Discord finishers, Drive-By / Choppa own the lane.

### Nun `nun` — healer · time · human/divine · pool 22
- **Now:** Bible Study (7) · Light (8) · Heavenly Duties (7)
- **Fit:** Bible Study ✓ ("sister", blessings that hold under fire, the choir = Hallelujah) · Light ✓ (radiance and shields; rung alt Smite) · Heavenly Duties ✓ (Purify, the cleansing of hostile enchantments).
- **Proposed families:** all three KEPT. Rungs per g2: `[[raceAbsolution, raceBlessing], [racePurify, raceCultSermon], racePrayer, raceHallelujah]`. Pool 22 → 22.
- **Pool gaps:** debuff — the lore says "No offensive capability of note"; intended (Aurora Ray's DEF −1 is there anyway). The opposite problem: the pool carries seven nukes (Smite, Prism Burst, Judgment, Merkaba, Divine Judgment, Divine Smite, Exorcism) for a race whose lore says none — pool ≠ kit, and Exorcism (burns the curse out) is the one that is hers.
- **Identity in one line:** the Blessed engine — Blessing / Sermon → Prayer (barrier + Blessed) → Hallelujah ×1.5 on Blessed allies; Exorcism beside a witch or a demon-contract setter.

### DOOR Agent `door agent` — assassin · time · human/anomaly · pool 10
- **Now:** D.O.O.R. Training (5) · D.O.O.R. Gun (7) · Human Grit (5)
- **Fit:** D.O.O.R. Training ✓ · D.O.O.R. Gun ✓ (UNIQUE, the model) · Human Grit ✓ ("Stats are unremarkable"; rung Underdog Spirit).
- **Proposed families:** all three KEPT. Pool 10 → 21 via g7 (Door Slam T3, Shut Door T1, Twin Doors T4, Second Wind). Rungs per g7: rung 1 `raceSwingDoor`, rung 2 `[raceBreakingEntering, raceAirMail, raceDoorDash]`. One conflict for g7: the inherent Keyholder already IS `doorFreeToggle`, so the proposed Doorman passive would be a duplicate on its only owner — make Doorman "+1 standing door (cap 2 → 3)" or drop it.
- **Pool gaps:** AOE — Drop In's splash, the Hell / Frost lanes, Twin Doors: fixed. Debuff — three Stagger rows, Frost Slow, Light Blind, Maw Stagger: fixed. Sustain — Adrenaline Rush / Second Wind. The only pool under 12 in this slice today; 21 after.
- **Identity in one line:** the geometry assassin — Swing Door / Air Mail Stagger → Door Slam ×1.5, a Gust lane into Twin Doors that exit onto a Hell lane.

### Police Officer `police officer` — ranged · time · human · pool 18
- **Now:** Police Training (5) · Gun Training (8) · Driving Skills (5)
- **Fit:** Police Training ✓ (all 4 rungs; the escalation ladder is the lore) · Gun Training ✓ (service pistol) · Driving Skills ✗ (the lore is baton / taser / spray / cuffs / a vest / a radio — no cruiser; Transform is car ⇄ mecha and Nitro / Vehicular Manslaughter are the civic's; the g4 auditor already flagged Transform as failing on the officer. The "vehicle-borne engagements" line is the gangster's lore, not hers).
- **Proposed families:** Police Training KEPT (g8 adds Ballistic Vest — literally her vest) · Gun Training KEPT · Human Grit ADDED (g7 adds her: Adrenaline Rush is a cop's second wind and fixes the "sustain" gap) · Driving Skills REMOVED. Pool 18 → 17.
- **Pool gaps:** movement — intended for a ranged class (Point Blank ×1.3 within 2 means she wants targets close: Taser / Pepper Spray at 2–3, then Nightstick / Cuffed). Debuff — every Police row lands a named status. T4 — Lockdown (Root 1 + Slow 2 on a 3×3 after g8).
- **Identity in one line:** the hard-control gun — Pepper Spray Blind, Taser Stun, Cuffed Root + Stagger set up any team's finishers (police + marksman is g8's designed pair), Lockdown cordons the block.

### Jellyfish `jellyfish` — caster · chaos · anomaly/alien · pool 22
- **Now:** Deep Sea Anatomy (5) · Water Abilities (8) · Poison Abilities (5) · Jellyfish (4)
- **Fit:** Deep Sea Anatomy ✓ (Bermuda deep) · Water Abilities ✓ ("Floats", the drifting sovereign) · Jellyfish ✓ (unique; all 4 rungs after Ocean Current moves in) · Poison Abilities ✗ borderline (the "neurotoxic-anomalous" venom is Sting and Nematocyst Net in her own family; corrosive splashes, poison swamps and the new Miasma are nothing a jellyfish does, and the family would push her to 26 with a sixth T4).
- **Proposed families:** Deep Sea Anatomy KEPT · Water Abilities KEPT · Jellyfish KEPT · Poison Abilities REMOVED. Pool 22 → 19.
- **Pool gaps:** buff — Deep Adapted / Gills passives; a control caster, intended. Depth Charge is physical (dead on ATK 18) — Poseidon's Wrath is her Deep Sea T4. Still five T4s (Immortal Cycle, Poseidon's Wrath, Great Flood, Tsunami, Tidal Slam-physical) on a 19-row pool.
- **Identity in one line:** the Wet engine — Bloom / Spout / Water Pulse soak the board, Sting ×1.5 on Wet, Poseidon's Wrath on everyone standing in water, Nematocyst Net roots the runner; she hands Lightning and Ice teammates ×1.5 and longer freezes.

### Cult Leader `cult leader` — support · chaos · human/unholy · pool 12
- **Now:** Cult of Personality (3) · Temporal Abilities (4) · Persuasion (0) · Healing Magic (3) · Meditation (2)
- **Fit:** Cult of Personality ✓ (unique; charm, indoctrination, the entourage) · Temporal Abilities ✗ (robes and candles, nothing temporal; his rung there, Judgment Beam, is a laser — g4 removes him) · Persuasion ✗ (empty; g2 deletes it) · Healing Magic ✗ (the passing of a cup is not bandages — g2 removes him) · Meditation ✓ (the guru at the altar) · g3 adds Black Magic ✓ (the altar at Bohemian Grove, "an owl the size of a house" — Sacrifice and Voodoo are his kind of support).
- **Proposed families:** Cult of Personality KEPT (g2: Tithe T1 in, Indoctrinate ×2 activations on a Charmed target) · Meditation KEPT (g2 grow to 4) · Black Magic ADDED · Temporal Abilities REMOVED · Healing Magic REMOVED · Persuasion REMOVED (deleted). Rung 1 `raceJudgmentBeam` → `raceCultTithe` (g2's call — NOT g4's `heal1`, which conflicts with g2 removing him from Healing Magic). Pool 12 → 13.
- **Pool gaps:** sustain — Deep Breath / Mantra / Awakening / Sacrifice: fixed. Debuff — Kool-Aid Charm, Voodoo. AOE — Baphomet's Rite (160 fire magic; INT 74 uses it). T4 — Gathering, Awakening, Baphomet's Rite. Damage below T3 is Tithe (50) only: a support, intended.
- **Identity in one line:** the possession engine — Kool-Aid → Indoctrinate for two activations, cult members as bodies, Voodoo tying their bruiser to your tank; pairs with Seduction's Charm payoffs.

### Popstar `popstar` — support · space · human/anomaly · pool 20
- **Now:** Stage Presence (5) · Sonic (10) · Seduction (5) · Music Theory (0)
- **Fit:** Stage Presence ✓ (the core; all 4 rungs) · Sonic ✓ (the voice; The Show Must Go On = immune Silence) · Seduction ✓ ("Several have been charmed trying") · Music Theory ✗ (empty; g9 deletes it — Sonic and Stage already are her music).
- **Proposed families:** Stage Presence KEPT · Sonic KEPT · Seduction KEPT · Music Theory REMOVED. Pool 20 → 21.
- **Pool gaps:** sustain — none at all on a 460-HP support; the summary does not flag her, and her defence is the hard CC (Charm, Stun via Lullaby's rewrite, Taunt via Call Out) — acceptable, but she is the one support in this slice with zero heal/cleanse; Encore Performance (g9's family upgrade) is the closest thing.
- **Identity in one line:** the Discord / Charm engine — Discordance → Requiem ×1.5, Stadium Show Charm → Enthrall (two activations) / Draining Embrace, Anthem +2 ATK for the front line, Spotlight's Mark calls the focus.

### Starfish `starfish` — healer · time · anomaly · pool 27
- **Now:** Water Abilities (8) · Deep Sea Anatomy (5) · Healing Magic (3) · Cosmic Abilities (11)
- **Fit:** Water Abilities ✓ ("keep the squad alive with the tide"; rungs Tidal Blessing, Temporal Tide) · Deep Sea Anatomy ✓ (the temple steps of Atlantis) · Healing Magic ✓ (rungs heal1, revive1) · Cosmic Abilities ✗ ("starfish" is a pun, not a cosmology; no rung; g4 removes her).
- **Proposed families:** Water Abilities KEPT · Deep Sea Anatomy KEPT · Healing Magic KEPT · Cosmic Abilities REMOVED. Rung 1 `heal1` → `raceSoothe`, rung 2 → `[heal1, raceTidalBlessing]` (g2 retiers Heal to T2). Pool 27 → 19.
- **Pool gaps:** buff — Deep Adapted / Gills passives; intended for a healer. Depth Charge is physical (dead on ATK 26); her damage is all Water magic — Whirlpool (100), Water Pulse (100), Call of the Deep (160), Poseidon's Wrath (170), Great Flood (160), Tsunami (160).
- **Identity in one line:** the zone healer — Tidal Blessing + Temporal Tide (heal allies, Slow enemies) hold a point, Great Flood makes the point water, Deep Adapted teammates fight at +1/+1 in it and Poseidon's Wrath drowns whoever followed.

### Ringmaster `ringmaster` — specialist · chaos · human · pool 14
- **Now:** Stage Presence (5) · Ropework (2) · Trickery (4) · Teamwork (3)
- **Fit:** Stage Presence ✓ (rung Stadium Show) · Ropework ✓ (the whip; rung Lasso) · Trickery ✓ (the switch; rung Skin Swap) · Teamwork ✓ ("runs a fight like a programme"; rung Encore) · g9 adds Animal Handling ✓ (top hat, red coat, whip = the lion tamer; Hawk / Wolves / Elephant are his acts) · g1 adds Sonic ✗ (the "voice that fills a stadium" is already Mic Drop / Call Out in Stage Presence; ten magic rows on INT 58 would push him to 36).
- **Proposed families:** Stage Presence KEPT · Ropework KEPT (g7 grow: Hogtie, Rescue Line, Round-Up) · Trickery KEPT · Teamwork KEPT · Animal Handling ADDED · Sonic NOT ADDED. Pool 14 → 26. If 24 is a hard cap: drop Trickery (rung 3 `raceSkinSwap` → `raceRescueLine`, Ropework T3) for 19.
- **Pool gaps:** sustain — no heal; Rescue Line and Everybody Up cleanse, the summons take the hits — a specialist, acceptable.
- **Identity in one line:** the director — Encore / Tag In for tempo, Lasso / Round-Up drag the crowd into the ring, Hawk / Wolves / Elephant fill it, Stadium Show is the finale.

### Bee Queen `bee queen` — caster · chaos · alien/anomaly · pool 16
- **Now:** Insectoid Anatomy (5) · Poison Abilities (5) · Agriculture (3) · Teamwork (3)
- **Fit:** Insectoid Anatomy ✓ (the hive: Brood, Tunnel Network, Swarm Signal — but Mandible Strike / Venom Fang are physical on ATK 30, so her rung 1 `raceVenomFang` is a trap) · Poison Abilities ✓ ("poison"; the magic rows suit INT 76) · Agriculture ✓ borderline (pollination, "multiply"; g1 keeps her; Bumper Crop's orchard is the hive's) · Teamwork ✓ ("command").
- **Proposed families:** all four KEPT. Rungs: 1 `raceVenomFang` → `raceCorrosiveSplash` (Poison T1, magic); 2 `raceChitinArmor` becomes a passive → `raceBrood` (g6) if a rung cannot be a passive; 3 `raceSplash` (moving to Ooze) → `raceRot` (Poison T3); 4 `raceSwarmSignal` stays. Pool 16 → 23.
- **Pool gaps:** movement — Tunnel Network (cast from the far mouth) and Tag In; debuff — Formic Acid DEF −1, Rot Grievous, Poison Seed: fixed. T4s: Swarm Signal, Miasma, Bumper Crop, Everybody Up — fine.
- **Identity in one line:** the swarm summoner — Brood drones under Swarm Signal (+2 ATK, +1 MOV), Team Strike +27 per adjacent body, Corrosive Splash → Miasma ×1.5; Royal Jelly lets her stand in her own Poison Swamp.

### Professor `professor` — caster · time · human · pool 18
- **Now:** Occult Knowledge (4) · Chemistry Knowldege (1) · Hidden Technology (5) · Psychic Abilities (8)
- **Fit:** Occult → Ancient Knowledge ✓ ("four doctorates in fields the university does not list"; 3 rungs) · Chemistry ✓ (rung Chemical Concoction) · Hidden Technology ✓ (a D.U.M.B. lecture hall; "things he read about once") · Psychic Abilities ✗ (nothing psionic in the lore — reading about it is books, not telekinesis; no rung; the g9 auditor himself calls the fit "thin").
- **Proposed families:** Ancient Knowledge KEPT · Chemistry KEPT (g4 grow: Acid Flask, Antidote, Chain Reaction) · Hidden Technology KEPT · Psychic Abilities REMOVED. Pool 18 → 15.
- **Pool gaps:** sustain — Antidote (Chemistry T2): fixed. Movement — intended ("fights from the back of the room"). Debuff — Deneuralizer Jammed, Acid Flask DEF −1, Sandstone Tomb Root.
- **Identity in one line:** the jam-and-corrode caster — Deneuralizer → Classified Weapon / Railgun ×1.5, Concoction's Corroded (Burn AND Poison) → Chain Reaction, Sacred Geometry / Pyramid Protocol wall off the back row.

### Deep Sea Fish `deep sea fish` — assassin · space · alien/anomaly · pool 26
- **Now:** Deep Sea Anatomy (5) · Water Abilities (8) · Light (8) · Poison Abilities (5)
- **Fit:** Deep Sea Anatomy ✓ (rungs Depth Charge, and Deep Dive after g6) · Water Abilities ✓ borderline (rung Tidal Slam; the sea creatures share it — Whirlpool / Tidal Slam are the fish's, floods are not) · Light ✗ (the lure is one light on a stalk, not radiance, shields and Merkaba; eight Light rows on an ATK 84 / INT 40 assassin: four magic nukes that only chip (Aurora Ray, Smite, Prism Burst, Merkaba), three ally shields (Light Shield, Luminous Shield, Protect), and Judgment — 160 light PHYSICAL cross, the one row he could swing, not worth eight slots of pool) · Poison Abilities ✗ (no venom in the lore; g1 removes him). The lore's "bite" has no row anywhere.
- **Proposed families:** Deep Sea Anatomy KEPT · Water Abilities KEPT · Beast Abilities ADDED (Bite, Pounce, Maul, Feral Dive, Keen Nose — sharkman is already on it) · Light REMOVED · Poison Abilities REMOVED. Rung 1 `raceAuroraRay` → `raceBite`; rung 2 `raceInkCloud` → `raceDeepDive` (g6). NEW for Deep Sea (or a UNIQUE one-row family): **Angler's Lure** — T2, effect/pull, light, 50 MP 1 AP, rng 4, single: pull 2 + Blind 1 — the lore's own verbs ("lure, blind"); Abyss Eyes means it never blinds itself. Pool 26 → 19 (+1 with the Lure).
- **Pool gaps:** heal — Bite's drain; intended. AOE — Depth Charge / Tidal Slam, both physical. T4 — Tidal Slam, Poseidon's Wrath.
- **Identity in one line:** the wet-board assassin — Spout / Whirlpool soak, Deep Dive in under Protect, Depth Charge ×1.5 on Wet, Bite / Maul / Tidal Slam to close.

### Clown `clown` — assassin · chaos · human/anomaly · pool 24
- **Now:** Trickery (4) · Stage Presence (5) · Dirty Fighting (7) · Shadow (8)
- **Fit:** Trickery ✓ (rung Trick Room; "never where the light was pointing") · Dirty Fighting ✓ (rungs Dark Justice, No Mercy) · Shadow ✓ (rung Fear; the utility half — Fear, Phase Shift, Shadow Step, Shadow Realm — is him; the magic half is dead on INT 34) · Stage Presence ✗ (a Haunted House clown "with no circus on record"; no rung; six rows that would push him to 30).
- **Proposed families:** Trickery KEPT (g9 grow: Misdirection, Sucker Punch) · Dirty Fighting KEPT · Shadow KEPT · Stage Presence REMOVED. Pool 24 → 24.
- **Pool gaps:** sustain — an assassin; intended. Debuff — Fear, Misdirection Blind, Curb Stomp Grievous, Skull Crack Silence.
- **Identity in one line:** the fear-and-blind assassin — Misdirection → Sucker Punch ×1.5, Fear → a teammate's Terror Pounce / Out of the Dark, Body Check → Curb Stomp / No Mercy, Shadow Step and Trick Room for the joke only he is in on.

### Bunny Girl `bunny girl` — support · space · human/anomaly · pool 18
- **Now:** Seduction (5) · Athleticism (5) · Stage Presence (5) · Trickery (4)
- **Fit:** Seduction ✓ ("charm alone") · Athleticism ✓ ("keep a whole squad moving"; rung Nimble Dodge) · Trickery ✓ (sleight of hand at the table; rung Mimicry) · Stage Presence ✗ (a casino floor is not a stage — g9 swaps her to the new Gambling ✓, "reads a table faster than the dealer").
- **Proposed families:** Seduction KEPT · Athleticism KEPT · Trickery KEPT · Gambling ADDED · Stage Presence REMOVED. Rungs per g9 `[raceDeadMansHand, raceNimbleDodge, raceDoubleDown, raceMimicry]` — but Dead Man's Hand is 4 × 26 PHYSICAL on ATK 40: rung 1 → `raceSoulSuck` (Seduction T1, magic drain) or `raceStackedDeck`. Pool 18 → 21.
- **Pool gaps:** sustain — Shake It Off, Soul Suck's drain; buff — Double Down; debuff — Charm, Stacked Deck (Marked + DEF −1), Misdirection: fixed.
- **Identity in one line:** the charm-and-mark support — Charm → Enthrall / Soul Suck / Draining Embrace, Stacked Deck calls the focus fire, Nimble Dodge out when the table turns.

### Sharkman `sharkman` — bruiser · chaos · anomaly · pool 24
- **Now:** Deep Sea Anatomy (5) · Water Abilities (8) · Beast Abilties (7) · Apex Predator (4)
- **Fit:** Deep Sea Anatomy ✓ · Water Abilities ✓ (water resist; Tidal Slam is physical) · Beast Abilities ✓ (rung Bite; "does not let go") · Apex Predator ✓ (rungs Stampede, Jurassic Jaw; "closes on it at speed").
- **Proposed families:** all four KEPT. Rung 3 `raceAmbushLunge` → `raceFeralDive` (g5 deletes Ambush Lunge). Pool 24 → 24.
- **Pool gaps:** none listed; Water's magic rows (Whirlpool, Water Pulse, floods) are chip on INT 16 — pool ≠ kit, the pull / push / Wet are why he casts them.
- **Identity in one line:** the self-contained stagger bruiser — Tail Whip / Stampede Stagger → Jurassic Jaw (a kill heals 25% and refunds the AP), Death Roll pins the runner, Water Pulse's Wet → Depth Charge ×1.5; Blood in the Water means nothing Slows him.

### Crystal Guardian `crystal guardian` — tank · time · anomaly/divine · pool 23
- **Now:** Living Stone (4) · Prism Lattice (4) · Holy Defense (6) · Earth Abilities (10)
- **Fit:** Living Stone ✓ (rungs Stone Skin, Calcify; "do not move unless something makes them") · Prism Lattice ✓ ("split light into weapons"; rung Prism Mirror) · Holy Defense ✓ ("stood watch over one door") · Earth Abilities ✓ borderline (earth resist, but Boulder Hurl / Fissure / Stonefall / Ground Slam / Quake (and g1's new Landslide) are a bruiser's throws and stomps on ATK 50; its rung there, Rampart, drops to T2 under g1) · g2 adds Knighthood ✓ ("in the shape of a knight" — Chivalry, taking the hit in an ally's place, is its whole lore).
- **Proposed families:** Living Stone KEPT (g5: Petrify T4, Unweathered) · Prism Lattice KEPT · Holy Defense KEPT · Knighthood ADDED · Earth Abilities REMOVED. Rung 4 `rampart` → `racePetrify` (Living Stone T4). Pool 23 → 19.
- **Pool gaps:** sustain — Stoneform (15% / round, immune while stone), Chooser's revive: fixed. Faceted (immune Stagger) + Unweathered (immune Burn) make it the tank that ignores two of the game's biggest currencies.
- **Identity in one line:** the doorkeeper — Chivalry intercepts, Shield Maiden taunts, Holy Bulwark shields the line, Petrify / Calcify shut the casters down, the prism lattice turns the doorway into a kill lane.

### Jack-o'-Lantern `jack o lantern` — caster · chaos · unholy/anomaly · pool 15
- **Now:** Fire Magic (4) · Agriculture (3) · Poltergeist Abilities (5) · Witchcraft (3)
- **Fit:** Fire Magic ✓ (Candlelit, fire resist; rungs fire1, meteor) · Agriculture ✓ ("the crop fields… after the harvest") · Poltergeist Abilities ✓ ("burn, curse and haunt"; rung Cold Spot) · Witchcraft ✓ (rung Family Curse).
- **Proposed families:** all four KEPT; rungs unchanged. Pool 15 → 19.
- **Pool gaps:** movement, buff — intended (a pumpkin head on a body of vines). Sustain — Healing Seed.
- **Identity in one line:** the DoT stacker — Haunt (28 / round, armor ignored) + Fireball's Burn + Evil Eye's Hex, paid by Combust / Meteor / Hocus Pocus / Boo; Cold Spot freezes the row of crops.

### Sidekick `sidekick` — hybrid · space · human · pool 17
- **Now:** Superhero Powers (5) · Teamwork (3) · Athleticism (5) · Human Grit (5)
- **Fit:** Superhero Powers ✓ (the hand-me-down cape; rung Heroic Leap) · Teamwork ✓ ("fights better next to someone"; rungs Pep Talk, Team Strike) · Athleticism ✓ · Human Grit ✓ ("always the last one standing"; rung Indomitable Will).
- **Proposed families:** all four KEPT. Rung 2 `jackOfAll` becomes an ally-targeted T3 under g7 → rung 2 `encore` (Teamwork T2). Pool 17 → 20.
- **Pool gaps:** debuff — Freeze Breath's Frozen is the hard CC; otherwise a hole a hybrid can live with. "Picks up whatever the hero dropped" is the Adaptable training row — the sidekick is its natural carrier.
- **Identity in one line:** the second — Encore / Tag In / Team Strike beside the carry, Heroic Leap to close (a plain 100 charge — it sets nothing), Heat Vision's own Burn 1 → a second Heat Vision ×1.5 or a teammate's Burn payoff (nothing else in his four families sets Burn), Indomitable Will to be the last one standing.

### Mushroom Girl `mushroom girl` — support · time · anomaly · pool 17
- **Now:** Drug Use (2) · Nature Magic (4) · Poison Abilities (5) · Fae Magic (6)
- **Fit:** Psychedelics ✓ (psilocybin in a hat; rung Ego Death) · Nature Magic ✓ (rung Herbal Remedy) · Poison Abilities ✓ ("rot the other"; Sporeborn) · Fae Magic ✓ (grown from the Fairy Forest; "a ring of mushrooms" = Fae Ring) · g1 adds Agriculture ✗ (spores are not seeds; a fifth family would push her to 28).
- **Proposed families:** all four KEPT · Agriculture NOT ADDED. Rungs: 2 `racePixieDust` → `raceFairyDust` (g9 deletes Pixie Dust); 3 `raceSplash` → `raceRot` (g1). Pool 17 → 23.
- **Pool gaps:** debuff — Dosed Slow, Rot Grievous, Glitterburst DEF −1, Formic Acid: fixed.
- **Identity in one line:** the spore support — Herbal Remedy / Rejuvenation / Contact High for her side, Corrosive Splash / Rot / Miasma for the other, Dosed → Bad Trip ×1.5 self-contained, Fae Ring for the ones who stepped inside.

### Tree Person `tree person` — tank · time · anomaly · pool 19
- **Now:** Nature Magic (4) · Earth Abilities (10) · Agriculture (3) · Cryptid Abilities (3)
- **Fit:** Nature Magic ✓ (rung Trunk Throw) · Earth Abilities ✓ (rungs Tremor Stomp, Earthen Grasp, Quake) · Agriculture ✓ (Deep Roots; its trees are the Green Thumb build) · Cryptid Abilities ✗ (the survey team counted it — it was on the clipboard; Cryptid Vanish (teleport + invisible) contradicts "very hard to move"; no rung).
- **Proposed families:** Nature Magic KEPT · Earth Abilities KEPT · Agriculture KEPT · Cryptid Abilities REMOVED. Rung 3 `trunkThrow` (retiered to T2 by g1) → `raceEntanglingRoots` if rung tiers must climb. Pool 19 → 22.
- **Pool gaps:** none flagged; sustain — Photosynthesis, Into the Green's Regen, Healing Seed; Herbal Remedy / Entangling Roots are magic on INT 30 — pool ≠ kit.
- **Identity in one line:** the rooted anchor — Earthen Grasp pulls and roots (Deep Roots makes it immune to the reply), Tremor Stomp / Quake Stagger, seeds sprout trees, trees feed Trunk Throw (+30 each), Bumper Crop walls the lane.

### Sheriff `sheriff` — ranged · time · human · pool 17
- **Now:** Gun Training (8) · Cowboy Skills (3) · Police Training (5) · Horseback Riding (1)
- **Fit:** Gun Training ✓ (the revolver; rung Double Pump) · Cowboy Skills ✓ (rungs Fan the Hammer, High Noon) · Police Training ✓ ("bring it back alive"; rung Cuffed) · Horseback Riding ✓ ("on foot or horseback" — lore-explicit) · g8 adds Marksmanship ✓ ("keeps the peace at range"; Long Rifle moves there) and Hunting Skills ✓ ("track anything") · g7 adds Ropework ✓. Seven families would be 32 rows: Hunting (Snare / Camouflage / Whistle) overlaps the job Cowboy + Marksmanship already do, and Ropework's Lasso is the cowboy's signature while the sheriff's "bring back" is Cuffed.
- **Proposed families:** Gun Training KEPT · Cowboy Skills KEPT · Police Training KEPT · Horseback Riding KEPT · Marksmanship ADDED · Hunting Skills NOT ADDED · Ropework NOT ADDED. Pool 17 → 25. If trimming to 24: Horseback is the weakest MECHANICAL fit (three melee charges on a ranged class) even though it is the most lore-explicit — dropping it gives 21.
- **Pool gaps:** sustain — a ranged unit; intended. Movement — Saddle Up / Ride-By. Debuff — Kneecap Shot Root, Cuffed Root + Stagger, Quick Draw Stagger, Pepper Spray Blind: fixed.
- **Identity in one line:** the range-control lawman — Cuffed / Quick Draw Stagger → High Noon ×1.5, or Kneecap Shot Root → Precision Shot; Tin Star means no Charm turns him.

### Astronaut `astronaut` — ranged · space · human/tech · pool 21
- **Now:** Astronaut Camp (1) · Hidden Technology (5) · Cosmic Abilities (11) · Athleticism (5)
- **Fit:** Hidden Technology ✓ ("a railgun that was classified before it was built"; rung Railgun) · Cosmic Abilities ✓ (zero gravity as a weapon; rungs Gravity Well, Gravity Crush) · Astronaut Camp ✗ (one row; g4 deletes it and moves Gravity Boots to Alien Weapons) · Athleticism ✗ (a suited pilot; g7 removes him). That leaves two families — under mondo's three-family floor.
- **Proposed families:** Hidden Technology KEPT · Cosmic Abilities KEPT · Human Grit ADDED (a NASA-trained human who "never takes the helmet off" — Adrenaline Rush is the "sustain" the summary flags; Elbow Grease / Indomitable Will fit) · Athleticism REMOVED · Astronaut Camp REMOVED. Rung 2 `raceGravityBoots` → `racePhaseWalk` (g4). Alternative if mondo prefers a signature: rebuild Astronaut Camp as a UNIQUE 4-row kit (Mag Boots T1 movement, EVA Tether T2 ally pull, Zero-G Slam T3 skyThrow, Re-entry T4 delayed area) instead of Human Grit — rule 2 allows it. Pool 21 → 22.
- **Pool gaps:** sustain — fixed by Human Grit. AOE — Gravity Well / Black Hole (magic; INT 46 is enough for the pull). T4 — Railgun, Classified Weapon, Black Hole, Heat Death, Star Decree, Supernova (six on a 22-row pool; Heat Death and Supernova are 2-AP magic on INT 46 — dead weight).
- **Identity in one line:** the gravity ranged — Gravity Well / Gravity Crush pin and ground flyers, Deneuralizer → Railgun ×1.5 down the line; Sealed Suit walks the poison swamp.

### Krampus `krampus` — bruiser · chaos · unholy/anomaly · pool 17
- **Now:** Christmas Spirit (5) · Horns & Hooves (5) · Black Magic (4) · Winter Warfare (3)
- **Fit:** Christmas Spirit ✓ ("the names Santa Clause crossed off"; rungs Lump of Coal, Naughty List) · Horns & Hooves ✓ (horned, hooved) · Black Magic ✓ loosely (the chained goat-devil; rung Baphomet's Rite) · Winter Warfare ✓ (Alpine Hide, cold-proof).
- **Proposed families:** all four KEPT. Rung 2 `raceCliffCharge` → `raceLabyrinthRoar` (g5 deletes Cliff Charge). Caveat: rung 1 Lump of Coal (100 fire MAGIC) and rung 4 Baphomet's Rite (160 fire magic) scale off INT 36 on an ATK 90 bruiser — his opener and his capstone are his two weakest rows; rung 1 → `[raceLumpOfCoal, raceFrozenPunch]`, rung 4 → `[raceBaphometsRite, raceAvalancheStrike]`. Pool 17 → 23.
- **Pool gaps:** sustain — Milk and Cookies (g1): fixed. Movement — Sleigh Dash, Gore Charge, Horn Hook: fixed.
- **Identity in one line:** the frozen shatterer — White Christmas / Snowball Volley Slow, Blizzard Present's Frozen → Sleigh Dash / Frozen Punch / Glacial Slam / Avalanche ×1.5; Naughty List's Mark → Blizzard Present; Gore Charge → Horn Toss.

### Rabbit `rabbit` — assassin · time · anomaly · pool 18
- **Now:** Athleticism (5) · Trickery (4) · Fae Magic (6) · Temporal Abilities (4)
- **Fit:** Athleticism ✓ (Quick Feet; rung Nimble Dodge) · Trickery ✓ ("never where the report says"; rung Trick Room) · Temporal Abilities ✓ ("a watch that runs in both directions"; rung Time Rewind) · Fae Magic ✗ (the Looking-Glass rabbit is not a fairy; g9 swaps him to the new Mirror Magic ✓). Caveat: Mirror Magic and Temporal's damage rows are MAGIC on INT 40 — g9's rung 1 Mirror Shard (100 arcane magic) and rung 4 Paradox (180 psychic magic) would be his weakest rows; and rung 3 Trick Room reverses turn order, which punishes the fastest race in the slice (SPD 66) on its own rung.
- **Proposed families:** Athleticism KEPT · Trickery KEPT · Temporal Abilities KEPT · Mirror Magic ADDED · Fae Magic REMOVED. Rungs: 1 → `raceSprint` (Athleticism T1) rather than `raceMirrorShard`; 2 `raceNimbleDodge` stays; 3 `raceTrickRoom` → `raceVault` (Athleticism T3) or `raceSkinSwap`; 4 → `[raceTimeRewind (Paradox), rampage]`. Pool 18 → 22.
- **Pool gaps:** sustain — Shake It Off, Time Rewind heal: fixed. Debuff — Stutter (Stagger + Slow), Misdirection Blind: fixed.
- **Identity in one line:** the tempo assassin — Stutter → Sucker Punch after Misdirection, Rampage through the line, Temporal Shift / Skin Swap to be where the report said he wasn't; Hall of Mirrors is for an INT teammate.

### Luchador `luchador` — bruiser · space · human · pool 20
- **Now:** Martial Arts (4) · Athleticism (5) · Dirty Fighting (7) · Stage Presence (5)
- **Fit:** Martial Arts ✓ (the punches) · Athleticism ✓ ("dive off anything taller"; rung Rampage) · Dirty Fighting ✓ (rungs Body Check, Brutal Slam) · Stage Presence ✓ ("play to a crowd whether or not there is one"; rung Stage Dive; Call Out moves in from Sonic under g1).
- **Proposed families:** all four KEPT; rungs unchanged. Pool 20 → 24. The lore's "throw, slam" has no throw row (Stage Dive carries, Haymaker shoves) — a UNIQUE "Lucha Libre" family (Suplex = displacement, Top Rope = leapStrike, Tag Team) is the natural growth if mondo wants a signature; not needed at 24.
- **Pool gaps:** sustain — Shake It Off (Athleticism T2): fixed.
- **Identity in one line:** the stagger brawler with a taunt — Call Out pulls them in (Iron Chin means they cannot stagger him back), Body Check / Roundhouse / Mic Drop Stagger → Haymaker / Curb Stomp / No Mercy, Rampage through the crowd.

### Firefighter `firefighter` — tank · time · human · pool 20
- **Now:** Water Abilities (8) · Human Grit (5) · Teamwork (3) · Athleticism (5)
- **Fit:** Water Abilities ✓ ("the same hose"; rungs Whirlpool, Water Pulse, Tsunami) · Human Grit ✓ (rung Underdog Spirit) · Teamwork ✓ (an engine company; Tag In is "carry the wounded out") · Athleticism ✓ ("walk into what everyone else is running out of"). Caveat: Water's damage is magic on INT 22 — Whirlpool (100) and Water Pulse (100) are cast for the pull / push / Wet, not the number, and rung 4 `raceTsunami` (160 magic) is a dead capstone.
- **Proposed families:** all four KEPT; rung 4 → `raceTidalSlam` (170 physical, Slow finisher). Pool 20 → 24.
- **Pool gaps:** debuff — Whirlpool Slow, Water Pulse Wet, Rampage Stagger: fine.
- **Identity in one line:** the rescue tank — Turnout Gear walks through Wall of Fire and lava, Tag In swaps the wounded out, Adrenaline / Indomitable / Second Wind keep him up, Whirlpool pulls the pile onto him and Tidal Blessing heals the team standing behind him.

### Goblin `goblin` — assassin · chaos · anomaly · pool 16
- **Now:** Thievery (1) · Trap Making (3) · Dirty Fighting (7) · Poison Abilities (5)
- **Fit:** Thievery ✓ ("somebody else's wallet"; rung Steal from the Rich) · Trap Making ✓ ("rig the ground they stand on"; rung Trapdoor) · Dirty Fighting ✓ (rung No Mercy) · Poison Abilities ✓ ("something in their teeth"; rung Infectious Bite — the rest of the family is magic on INT 30, pool ≠ kit).
- **Proposed families:** all four KEPT. Pool 16 → 22.
- **Pool gaps:** sustain — an assassin; intended. Movement — a real hole for "small, green, quick": nothing in four families moves him. Fix: NEW T2 in Trap Making **Tunnel Under** — movement/teleport, 50 MP 1 AP, rng 4, no line of sight: pop out of the ground beside any trap you have placed (the Hollow Earth tunnels; gnome shares it) — every Scrap Mine / Trapdoor becomes an escape route. Else the Grapnel Gauntlet gear slot.
- **Identity in one line:** the trapper-assassin — Scrap Mine / Trapdoor Stagger → Curb Stomp / No Mercy, Infectious Bite → Formic Acid ×1.5, Stick-Up / Swipe lift the carry's buffs; Cave Eyes shrug off the Blind he walks through.

### Hippie `hippie` — support · time · human · pool 14
- **Now:** Drug Use (2) · Meditation (2) · Nature Magic (4) · Agriculture (3) · Healing Magic (3)
- **Fit:** Psychedelics ✓ (rung Ayahuasca Retreat moves here under g1) · Meditation ✓ ("camped at the stones on the solstice"; rungs Cleanse → Inner Peace, Awakening) · Nature Magic ✓ ("grow their own medicine") · Agriculture ✓ (rung Healing Seed; "seeds") · Healing Magic ✗ borderline (plain white magic is a priest's; the lore is "seeds, herbs and good intentions" — the other three families — and three heal families overlap: Herbal Remedy / Rejuvenation, Soothe / Heal / Heal All, Deep Breath / Mantra).
- **Proposed families:** Psychedelics KEPT · Meditation KEPT · Nature Magic KEPT · Agriculture KEPT · Healing Magic REMOVED. Rung 3 `raceAyahuascaRetreat` stays legal through Psychedelics. Pool 14 → 20 (25 if Healing Magic is kept).
- **Pool gaps:** AOE — Entangling Roots, Bumper Crop, Miasma-free: fixed. Debuff — Dosed Slow, Poison Seed, Bad Trip's Slow: fixed. He loses Revive; Rejuvenation and Awakening remain — if a revive matters to the team plan, keep Healing Magic and accept 25.
- **Identity in one line:** the commune healer — seeds + Photosynthesis + Mantra heal over time, Contact High rallies the casters, Dosed → Bad Trip / Ego Death for the one who would not share.

### Pool-size watchlist (part 4)
- **Under 12 today:** door agent 10 — a problem (four T1s, one T3); fixed to 21 by g7's additions, no family change needed. cult leader sits at 12 today with two empty/misfit families; 13 after, every row on-theme.
- **Over 24 today:** starfish 27 (Cosmic pun — dropped, 19), deep sea fish 26 (Light + Poison misfits — dropped, 19). sharkman 24 and clown 24 stay at 24.
- **Over 24 after the family auditors' additions if every RACE_ADD were accepted:** ringmaster 36 (Sonic declined → 26; Trickery trim → 19), sheriff 32 (Hunting + Ropework declined → 25; Horseback trim → 21), gangster 25 (Gambling declined → 21), mushroom girl 28 (Agriculture declined → 23), crystal guardian 31 (Earth dropped → 19), hippie 25 (Healing Magic dropped → 20). The two that still sit above 24 after this section — ringmaster 26 and sheriff 25 — are each one lore-explicit family over, and the trim for each is named above.
