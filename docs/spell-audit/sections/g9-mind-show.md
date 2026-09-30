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
