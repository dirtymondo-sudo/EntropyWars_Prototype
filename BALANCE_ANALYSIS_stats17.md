# Balance Analysis — stats17 (2026-08-15)

Source: `ewbalancestats17.json` — 711 decisive arena matches (0 no-contests),
map rotation, Balance Lab non-mirror (equal AI weights, random tree-legal
teams).

**⚠ Provenance caveat — this export very likely MIXES old-AI and v4
matches.** The `ew-balance-stats-v3` aggregate persists across sessions, so
matches played before the 2026-08-15 ai.js rewrite are still in these
totals (and if the R2 bucket still served the old ai.js when this ran, ALL
of them are old-AI). The tell: Requiem whiffs 87% here, but v4's barrage
scorer is engine-true and vetoes empty novas — AI_REDESIGN.md's own
expectation for a clean v4 run is "Requiem whiff ≈ 0". **Treat stats17 as
the old-AI closing baseline: hit Reset in the Balance Lab dashboard, make
sure the deployed ai.js is v4, and re-run ~700 matches before acting on
anything AI-sensitive below.** (Exports now stamp `_meta.aiVersion` so this
ambiguity can't recur.) The structural findings — tree-shape effects, the
"matches go to time" meta, healing's payoff — are loadout/engine-driven and
should survive the re-run; the per-spell AI-behavior reads (Requiem,
cast-count concentration) may not.

## Headlines

1. **Sniper is the #1 balance problem.** 62.3% WR, Wilson-95 [58.0, 66.4] —
   the only job whose CI floor clears 56%. It is ALSO the best secondary job
   (57.8% [53.5, 62.0], the only significant secondary). The kit, not a race,
   is carrying: quarterback / robinhood / gargoyle / cosmic wraith / marksman
   all post 61-67% WR with near-zero race residual — they're just Sniper
   hosts. Kneecap Shot is the most-cast spell in the game (2,043 casts, 60.3%
   fielded WR), with Precision Shot 60.1%, Take Aim 60.7%, Camouflage 57.9%.
   Nerf the job kit (Kneecap Shot first), and the race table likely fixes
   itself.
2. **Harbinger is second** (55.9% [52.3, 59.4]). Lullaby is the 2nd-most-cast
   spell (1,978 casts, 57.7% fielded) — sleep CC is queen in a meta where the
   AI now values denial correctly. Discordance: 1,139 units fielded it, 55.0%.
3. **Psychic (43.6% [39.8, 47.6]) and Harvester (43.6% [39.0, 48.3]) are the
   significant losers.** Psychic's bread-and-butter reads weak: Kinetic Hurl
   45.0% over 1,031 games, Psychosis 44.0%. Harvester is dragged down by its
   support-flavored kit while scarecrow (its best race) carries a +24.4pt
   residual — i.e. the race kit, not the job, wins its games.
4. **Support play does not pay.** Every healing spell is a loser: Heal 46.3%
   (874 g), Heal All 39.9%, Cleanse 43.5%, Herbal Remedy 33.7%, Divine Light
   32.9%. White Mage 46.5%; priest race residual −15.7pts. See "meta shape"
   below — in a score-decided, low-death meta, a heal turn is a tempo loss.
5. **Matches go to time.** 363/400 logged matches ended going into round 16
   (the 15-round arena limit) — ~91% are decided by arena SCORE, not wipe /
   tower / hourglass sweep. Survival rates are 95.6-97.9% per job. First
   blood converts to a win 68.9% of the time and comebacks are rare (11.7%):
   an early lead quietly rides the scoreboard home. If we want more decisive
   arenas: raise kill pressure (respawn cost, score weight of kills) or
   tighten the round budget.

## Job table (WR, Wilson-95, n)

| Job | WR | CI | games | verdict |
|---|---|---|---|---|
| Sniper | 62.3% | [58.0, 66.4] | 517 | **nerf** |
| Harbinger | 55.9% | [52.3, 59.4] | 732 | **nerf (soft)** |
| Gunslinger | 53.8% | [48.6, 58.9] | 355 | watch |
| Engineer | 53.6% | [49.0, 58.1] | 457 | watch |
| Black Mage | 51.1% | [47.2, 55.1] | 614 | ok |
| Agent | 49.8% | [45.6, 54.0] | 534 | ok |
| Warrior | 49.5% | [44.9, 54.2] | 438 | ok |
| Swordmaster | 47.4% | [42.8, 51.9] | 456 | ok |
| Raider | 47.1% | [43.5, 50.7] | 733 | ok |
| White Mage | 46.5% | [41.8, 51.3] | 415 | watch (meta-shaped) |
| Tank | 45.1% | [39.9, 50.5] | 339 | watch |
| Freelancer | 44.7% | [37.6, 52.0] | 179 | low n |
| Psychic | 43.6% | [39.8, 47.6] | 612 | **buff** |
| Harvester | 43.6% | [39.0, 48.3] | 431 | **buff** |

## Races — real outliers after removing job expectation

Residual = race WR − its locked job's WR (the 2026-07-09b method, automatic
in the export). |resid| ≥ 8pts with n ≥ 70:

**Overperforming their job:** scarecrow +24.4 (68.1%!), kaiju +16.3,
voidweaver +14.5, mech +13.6, demon +10.4, atlantean +8.3.
**Underperforming their job:** priest −15.7 (30.8%), dinosaur −14.1 (33.0%),
kraken −13.0, swordfighter −12.5 (34.8%), anubis −10.3, shaman −9.0,
annunaki −9.2.

Scarecrow deserves a targeted look (Stuffed Double fields at 68.2%); priest,
dinosaur and swordfighter need kit help, not job help.

## Spell notes

- **Requiem is broken in the AI's hands: 87% whiff rate over 167 casts**
  (99.7 dmg/cast, 1.0 dmg/MP — worst in the game). Either the AI casts it
  when it can't connect or its resolution rarely lands. Fix the AI targeting
  gate or the spell; every Requiem unit is burning turns.
- Nuke-tier AoEs dominate per-MP efficiency: Cataclysm Stomp 19.3 dmg/MP,
  Fallen Grace 17.3, Arcane Sigil 16.5, Mortar Salvo 15.7 (261 casts, and
  Mortar Salvo units field at 69.0%). Siege Mode 70.0% / Railgun 64.2%
  fielded — the Engineer tower/turret package is quietly top-tier.
- Deployables: Deploy Turret 1,396 casts, 55.8% fielded over 654 games.
  With DoT/deploy attribution fixed since v3 this is real signal.
- Fielded-WR losers worth a pass: Boulder Hurl 40.0%, Fissure 37.1%, Heal All
  39.9%, Primal Roar 31.9%, Apex Charge 31.0%, Chest Pound 36.8%, Sad
  Backstory 35.7%, Spirit Walk 34.8%.
- 95 spells have <10 casts — the AI never picks them up (loadouts are random,
  so these ARE fielded; the AI just doesn't cast them). Low-cast + low-WR
  overlap is the "dead weight" list to mine next run (the new Casts-tab
  export now includes per-cast whiffs to make this obvious).

## Spell-tree shapes (back-computed from the 400-match log; live-tracked from stats v4 on)

3,844 tree units, all mapped 6/6 nodes onto R(ace)/P(rimary)/S(econdary)
pillars:

| Archetype (sorted depths) | units | WR |
|---|---|---|
| 4-1-1 (one capstone + splash) | 593 | 51.9% |
| 4-2-0 | 559 | 50.8% |
| 3-3-0 | 325 | 52.6% |
| 3-2-1 | 1,891 | 49.1% |
| 2-2-2 (flat spread) | 476 | 48.5% |

By capstone pillar: **race capstone 56.0% (n=359)** vs primary-job capstone
49.5%, secondary 49.1%, no capstone 49.4%. Going deep on the RACE pillar is
the strongest single pull in the tree — consistent with the Phase-B race
capstone power band (190-210) sitting on top of race kits like scarecrow's.
Concrete shape outliers: R4·P2·S0 57.7%, R0·P4·S2 57.0%, R4·P1·S1 55.0% vs
R0·P2·S4 39.5% and R3·P1·S2 43.8%. Balance lever if the gap persists at
higher n: race capstones down a notch, or job capstones up.

## Terrain / building

6,027 build ops (~8.5 per match): wood 3,129 / stone 2,171 / metal 582 /
dig 145. Raider (790), Psychic (656), Harvester (510), Agent (509) build
most. Terraforming is a real strategic axis now, not dead weight.

## Caveats

- All numbers are arena-only, AI-v4-piloted, random tree-legal loadouts.
  A spell the AI misplays (Requiem) reads worse than it is; a spell the AI
  spams well (Kneecap Shot) reads at its ceiling.
- Fielded-WR ("Spells" tab) credits a unit's whole result to each of its 6
  spells; use the per-cast efficiency table to separate the passenger spells
  from the drivers.

## Recommended actions (in order)

1. **Reset balance data + re-run ~700 matches on confirmed-v4 ai.js** (see
   provenance caveat) — stats18 becomes the real v4 baseline.
2. If Sniper still clears 56% CI-floor in stats18: Kneecap Shot / Sniper kit
   nerf pass. Same check for Lullaby/Harbinger.
3. Psychic + Harvester kit buffs (Kinetic Hurl, Psychosis numbers) if they
   stay under 46%.
4. Requiem: should self-resolve on v4 (engine-true barrage gate). If whiff
   is still >10% in stats18, the spell itself needs the look.
5. Priest / dinosaur / swordfighter race-kit passes (negative residuals are
   loadout-driven and should survive the re-run).
6. Decide whether the 91%-to-time arena meta is intended; if not, tune score
   pressure or round budget before trusting WR shifts from #2-5.
