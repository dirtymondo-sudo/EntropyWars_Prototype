# Balance Lab analysis + balance pass — 2026-10-06

Source: mondo's Balance Lab export (`ew-balance-stats.json`, exported 2026-10-06 07:55 UTC): 1,582 decisive
arena matches, 6v6, random teams, AI v4.13, 113 races (92–152 games each), 603 spells fielded.
A race needs about ±8.5 points of win rate before it is more than noise at this sample, so only races whose
95% interval clears 50% are called outliers below.

**Caveat:** the export has no build stamp, so it mixes every build since the lab's v4 reset. It predates
today's basic attack floor (PR #138, ATK × 0.75 instead of × 0.65), speed bands (PR #135), Guard restore
(PR #134) and the passive upgrades (PR #131). PR #138 makes high-ATK shooters stronger still, which is why the
top three below are nerfed on ATK.

## The nun

The nun's HP is not high. Her base HP is 460, grade C, 103rd of 124 races. What made her read as a tank:
in battle every unit is level 100 and carries its level growth on top of the race line (+360 HP, +58 ATK,
+62 DEF, +69 M DEF, +43 M ATK). The battle info card, the quick stats and the pause sheet graded those
grown numbers on the base ruler, so the nun's 8 ATK showed **A** and her 58 M DEF showed **S**, and every
unit's HP number sits near 800. Fixed: the grade now takes the level growth back off before picking the
letter (data.js `statGradeValForUnit`); the number beside it is still the live one. Her win rate is 47%,
inside the noise, so her stats are unchanged.

## Biggest race outliers (95% interval clear of 50%)

| Too strong | WR | Why | Too weak | WR | Why |
|---|---|---|---|---|---|
| marksman | 70.1% | range-4 basic attacks, AWR 98 crits | crystal guardian | 33.6% | 0.8 kills, 1,179 damage a game |
| quarterback | 67.4% | range-4 basic attacks | door agent | 35.2% | door kit rarely cast |
| vampire | 65.4% | Thrall Bite (best spell WR, 70%) | dreameater | 36.2% | paper body |
| kaiju | 65.4% | ATK 100, 2.6 kills a game | ice queen | 36.9% | 420 HP |
| dragon | 64.7% | Dragon Toss (954 a cast) | professor | 37.2% | 470 HP, 28 DEF |
| mad scientist | 63.7% | 2.4 kills a game | bee queen | 38.0% | |
| shadow entity | 62.2% | | firefighter | 38.3% | 0.5 kills a game, lowest damage |
| demon | 62.1% | Infernal Hurl (1,037 a cast) | orb of light | 39.2% | 415 HP |
| ghoul | 62.0% | | politician | 39.3% | 0.8 kills a game |
| jellyfish | 61.9% | Sting, the best Tier I | antperson | 39.5% | 94 ATK on 2 tiles |
| demon princess | 61.4% | 2.8 kills a game | mushroom girl | 39.7% | |
| robinhood | 61.3% | range-4 basic attacks | | | |

Patterns:
- **The Cube decides 80% of matches** (1,260 of 1,582 end on tower_destroyed; 270 on wipeout). Kill count is
  a weak predictor; the range-4 shooters win without killing much (marksman 1.4 kills, quarterback 1.05)
  because they hit the Cube from safety. The lab didn't record Cube damage per race until this pass.
- **Slow tanks lose.** crystal guardian, firefighter, antperson and dinosaur all have 700+ HP and land under
  41%. HP doesn't win a Cube race; reach and movement do.
- **Glass casters split** by kit, not stats: demon princess, mad scientist and fallen angel win; ice queen,
  dreameater, orb of light, professor and telepath lose.

## Biggest spell outliers

Spell MP is set by tier (25 / 50 / 75 / 100), so a spell's real levers are tier, damage and effects.

- **Tier II damage is a bad deal.** Median damage a cast: Tier I 285, Tier II 278, Tier III 384,
  Tier IV 472. Tier II costs double the MP and SP of Tier I and hits for the same, because the median Tier II
  row has base dmg 100, the same as Tier I. This is the biggest systemic finding; it's listed under next
  steps, not changed here, because it touches ~60 rows.
- **Sky throws are broken high:** Infernal Hurl (Tier II) 1,037 damage and 0.73 kills a cast; Dragon Toss
  (Tier III) 954 and 0.61. Each carries +25 a level of carry height (4–5 levels = +100–125) on top of its dmg.
- **Tier IV dashes are broken low:** Rampage (cast 867 times), Bull Rush and Giant Smash deal 227–267 a
  cast, half the Tier IV median. The landing target rarely gets the full hit, so the path damage (56–64) is
  all that lands. Ride-By (Tier III) 183.
- **Best Tier I rows:** Sting 425 a cast (+ poison), Glitterburst 412 (AoE + DEF down), Hydraulic Punch 404
  (the push crashes into a second unit, 1.8 targets).
- **Dead slots:** 74 active spells were fielded on 20+ units and never cast once in 1,582 matches. Kinds:
  buff 15, warCry 10, aoe 8, barrage 7, teleport 5, doorDeploy 4, placeTrap 3, summonWeather 3, zoneDebuff 3,
  and single rows of a dozen more. Among them: Ground Slam, Fear, Dread Aura, Demonic Roar, Indomitable Will,
  Extended Clips, Encore, Eyewitness, the nun's Blessing, and Frost Door / Hell Door / Door Dash for the door
  agent. Other spells of the same kinds do get cast, so it is per-spell (AI scoring or a missed count), and
  it means some races fight with 4 live spells out of 6. The export now lists them as `neverCast`.
- **Fielded win rate (confounded by race):** best Thrall Bite 70%, Broken Halo 69%, Camouflage 68%, Atomic
  Breath 67%, Divine Smite 67%; worst Prism Mirror 32%, Pulse Lattice 33% (prism lattice is cast 9 times in
  498 fielded games), Spirit Guide 34%, Contact High 35%.

## Biggest family outliers (fielded win rate, 150+ unit-games)

Best: vampiric abilities 67.6%, unethical science 64.2%, football 63.8%, dragon abilities 63.5%,
archery 61.9%, ghoulish 61.4%, marksmanship 60.2%. Worst: doors 34.4%, door 34.8%, prism lattice 36.7%,
politics 37.1%, psychedelic 40.0%, ki 40.0%, mothman 41.2%. The worst families are the ones the AI barely
casts (doors 16 casts in 305 games, prism lattice 9 in 498, meditation 15 in 374).

## What changed (data.js)

Race stats:

| Race | Before | After |
|---|---|---|
| marksman | ATK 80 | ATK 72 |
| quarterback | ATK 82 | ATK 74 |
| kaiju | ATK 100 | ATK 92 |
| vampire | ATK 61 | ATK 55 |
| mad scientist | M ATK 84 | M ATK 78 |
| crystal guardian | ATK 50 | ATK 60 |
| door agent | HP 520, ATK 48, M ATK 40 | HP 560, ATK 54, M ATK 46 |
| dreameater | HP 495, DEF 20 | HP 535, DEF 26 |
| ice queen | HP 420 | HP 470 |
| professor | HP 470, DEF 28 | HP 505, DEF 34 |
| bee queen | HP 500 | HP 535 |
| firefighter | ATK 58 | ATK 66 |
| orb of light | HP 415 | HP 455 |
| politician | M ATK 66 | M ATK 72 |
| antperson | SPD 29 (2 tiles) | SPD 41 (3 tiles) |
| mushroom girl | HP 480 | HP 515 |

Letter changes: quarterback ATK S → A, vampire ATK A → B, mad scientist M ATK S → A, firefighter ATK B → A,
door agent HP C → B and M ATK C → B, dreameater DEF F → C, ice queen HP F → C, antperson SPD C → B (2 → 3
tiles). Everything else moves inside its letter.

Spells:

| Spell | Before | After |
|---|---|---|
| Infernal Hurl (T2) | +25 a carry level, crash +50 | +15 a level, crash +30 |
| Dragon Toss (T3) | +25 a carry level, crash +60 | +15 a level, crash +40 |
| Rampage (T4) | path 64 | path 96 |
| Bull Rush (T4) | path 60 | path 90 |
| Giant Smash (T4) | path 56 | path 84 |
| Ride-By (T3) | path 55 | path 75 |
| Sting (T1) | dmg 90 | dmg 75 |
| Glitterburst (T1) | dmg 80 | dmg 70 |
| Hydraulic Punch (T1) | dmg 100 | dmg 90 |

Display: battle info card, battle quick stats and pause sheet grade on the base ruler (above).

## Balance Lab changes (battle.js)

- Every match is stamped with the game build (`?v=` token); the dashboard says how many matches came from an
  earlier build and the export carries `_meta.build` + `staleMatches`. Reset after a balance pass for a clean
  read.
- Cube damage per race (`towerDmgPerGame`), plus damage dealt / taken a game, in `analysis.races`.
- Damage-zone ticks (Heat Death, War of the Worlds) count as their spell's damage; they read as 99% whiffs.
- Spell rows carry tier + families; new `analysis.families` roll-up and `analysis.neverCast` list.
- The tree-shape roll-ups were empty (their regex still expected the pre-jobs-removal `R·P·S` sig); they now
  group by tier spread and Tier IV count.

## Next steps (not done here)

1. **Tier II damage rows:** lift the ~60 single-target Tier II damage rows from dmg ~100 to ~125, or give
   each a real rider. Biggest systemic win; wants mondo's go because it touches a lot of rows.
2. **Find out why 74 spells are never cast:** log every AI spell pick to the lab (picked / cast / failed) to
   split "AI never scores it" from "cast not counted", then fix the AI scoring for those kinds. Until then the
   races that carry them (door agent, nun, machine elves, ringmaster, politician) are judged on a partial kit.
3. **Per-spell win rate is a race proxy:** add a "WR when this spell was cast at least once" column, and
   a matchup table (race vs race) from the match log.
4. **Mode spread:** this whole set is arena. Run TDM and clash too; the Cube win condition dominates arena.
5. **Re-run 1,500+ matches on this build** and check the 16 race changes moved toward 50%.
