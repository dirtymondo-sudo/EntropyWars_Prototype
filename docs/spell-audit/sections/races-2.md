## Races part 2 (31 races: ghost … general)

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
