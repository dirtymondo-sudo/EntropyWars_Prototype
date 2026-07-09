# Balance Pass — 2026-07-08 (248-match Arena dataset)

Data-driven balance pass built from two exports:
`ewbalancestats5.json` (aggregate over **248 arena matches**, ~1,984 unit-slots)
and `entropywarsbatch2061.json` (20 full match logs). All matches were Arena
mode. This file is the memory for *why* the numbers moved — update it when a
future pass re-tunes off fresh data.

## How to read the data (confounds)
- **Job win-rate is the cleanest signal.** A job's WR = share of games where a
  unit of that job was on the winning team (baseline = 50%).
- **Race WR is mostly job-driven.** Low-tier races are low mostly because they
  default into a weak job (Warrior/Engineer). Fix the job → the race follows.
- **Spell WR is a proxy for its owner class.** Plasma Gun sat at 27% not because
  the spell is weak (148 line dmg / 30 MP is fine) but because only Engineers
  cast it. So spells were judged on **efficiency** (dmg/kills per MP·AP),
  independent of owner — not raw WR.

## The core problem
73% of matches reach round 15+ and are decided by **composite score**, which is
dominated by kills (15 pts each, uncapped; tower dmg caps at 150). So the meta
rewards **safe kill-farming**. Ranged/mobile classes (Gunslinger, Sniper, Agent)
farm kills and almost never die (Sniper KD 16.4, cowboy KD 25.7, only 6 deaths
in 64 games). Melee tanks (Warrior) and turret-summoners (Engineer) can neither
reach the ranged threats nor secure kills, so they lose.

### Job WR before (spread 38.3% → 57.7%, ~19 pts — too wide)
| Job | WR | | Job | WR |
|---|---|---|---|---|
| Gunslinger | 57.7% | | Sniper | 50.9% |
| Psychic | 56.2% | | Harvester | 45.8% |
| Black Mage | 54.5% | | Harbinger | 45.2% |
| Agent | 54.2% | | **Engineer** | **38.8%** |
| White Mage | 54.1% | | **Warrior** | **38.3%** |
| Raider | 52.3% | | Freelancer | 14.3% (7g, noise) |

### Race WR extremes
Top: catgirl 65.8%, telepath 61.1%, werewolf 60.9%, cowboy 60.9%, vampire 60.5%.
Bottom: nordic 34.2%, mad scientist 34.5%, giant 36.5%, shaman 40.7%, machine elves 43.6%.

## Changes made (all in `data.js`)

### JOB_MODIFIERS — the primary lever
- **Warrior** (38.3%, worst): `atk 16→24`, `hp 120→135`, `def 20→22`,
  `mdef 4→8`, `move 1→2`. The +8 ATK gives the kill pressure the class lacked;
  +1 MOVE + reach lets it close on ranged; +MDEF lets it survive caster burst.
  This is the biggest single fix (melee-can't-win was the root cause).
- **Engineer** (38.8%): `hp 50→80`, `atk 0→8` (had a pathetic 0 atk mod),
  `def 10→14`, `mdef 8→10`. Plus a kit repair (below).
- **Harvester** (45.8%): `atk 16→20`, `hp 80→95`.
- **Harbinger** (45.2%): `int 15→20`, `hp -30→-15`.
- **Gunslinger** (57.7%, top DPS): `atk 24→18` (−6). Keeps range-2 identity.
- **Psychic** (56.2%, control): `int 30→24`, `mdef 18→14`. Slightly less spell
  power and more killable — it won on control, not damage (KD 3.5).

### RACE_BASE_STATS — residual outliers beyond job
- **giant** (36.5%): `atk 40→46`, `spd 3→4` (immobile tank couldn't contribute).
- **nordic** (34.2%, worst race): `atk 50→56` (Warrior job buff does the rest).
- **werewolf** (60.9%, top bruiser): `atk 76→70`, `spd 9→8`.
- **catgirl** (65.8%, #1 overall): `spd 9→8` (+ Ninefold Scratch nerf + Gunslinger nerf).
- **cowboy** (60.9%, KD 25.7): `spd 8→7` (+ Fan the Hammer nerf + Gunslinger nerf).
  (mad scientist / machine elves / shaman ride the Engineer & Harvester job buffs.)

### SPELLS — buff genuinely-weak utility, trim over-efficient nukes
Buffs (weak Engineer kit — dragged Engineer to bottom):
- **Deploy Turret**: `turretHp 30→60` (died to one hit before it ever fired —
  the key fix), `turretDmg 100→110`.
- **Repair**: `heal 128→155` (Engineer's only heal).
- **Free Energy**: `mpRestore 20→35`, `cost 50→40`.
- **Bulwark Ring**: `apCost 2→1`, `cost 55→45` (too expensive to ever use).

Nerfs (over-efficient nukes, judged on efficiency not owner WR):
- **Ninefold Scratch** (catgirl signature): `140→110` total (5×28→5×22). Still
  shield-piercing. Was a 66%-WR nuke on the #1 race.
- **Arcane Blast** (wizard): `dmg 120→100`, `cost 30→38`. A 3×3 nuke for 30 MP
  was the most cost-efficient AoE in the game.
- **Fan the Hammer** (cowboy): `dmg 60→48`, `cost 25→28`.

## Left intentionally untouched
- **Sniper** (50.9% WR): balanced by WR despite a 16.4 KD. The "never dies"
  feel is real but the win rate is fine; the Warrior mobility buff makes snipers
  easier to catch, which is the right indirect lever. Re-check next dataset.
- **Scoring (ARENA_PTS)**: kills = 15 uncapped is what rewards farming. Raising
  objective value (tower cap / nexus / hourglass) vs kills would help
  non-killer comps at the mode level — deferred; this pass is character-focused.
- **Secondary-job inversion**: Agent is a strong primary (54%) but the weakest
  secondary splash (40.5%); Engineer/Harvester/Psychic splashes are best (54–55%).
  Low priority vs the primary-job spread.

## Next steps
Re-run the sim after upload and re-export. Target: all jobs within ~47–53%,
races within ~44–56%. If Warrior over-corrects past ~52%, walk back `move 2→1`
first (mobility is the strongest part of its buff).

---

# Balance Pass — 2026-07-09 (159-match ewbalancestats6 + batch8011 + match116 AI autopsy)

Data: `ewbalancestats6.json` (159 arena matches), `entropywarsbatch8011.json`
(80 match logs), `entropywarsmatch116.json` (human won TDM 9–6 with
nordic/fortune teller/martian/atlantean vs AI demon/quarterback/halfdemon/grey).

## Outliers this dataset
Top: vampire 68.3%, knight 63.2%, quarterback 60.9% (K/D 20.5, least dmg taken).
Bottom: nordic 32.7%, atlantean 37.0% (0.72 K/g, atk 77 final vs 115–147 peers),
fortune teller 37.5%, machine elves 42.0%, annunaki 44.1%, grey 44.6%, martian 45.5%.
Jobs: Agent 56.6% best; Harbinger 37.7% worst; White Mage 45.1% (healing
under-converts). Typing: unholy 57.9% > human 50.6% > alien 38.5% (systemic).

## Nerfs
- **vampire**: atk 60→55, spd 8→7; Bat Swarm 80→66, Lifetap 120→108.
- **knight**: hp 610→585, def 45→42; Chivalry gains cooldownRounds 2.
- **quarterback**: atk 60→54, spd 8→7; Hail Mary 104→92, Bullet Pass 92→80,
  Blitz 100→88, Spike the Ball 72→64. (Also: the Assassinate hidden-target fix
  below removes its cheapest kills.)
- **demon** (borderline): Devour Soul 150→132, Hellmouth 112→102.
- **werewolf**: Blood Frenzy 150→130.
- **Agent job**: spd +2→+1; EMP Burst 96→84; Sneak Slash tier II→III
  (out of secondary/cross pools).

## Buffs
- **nordic**: hp 535→560, def 38→44; Pleiadian Shield 150→220 shield,
  Resonance Pulse 130→150, Federation Beacon hp 50→70 / heal 35→40.
- **atlantean**: atk 36→46, spd 4→6; Riptide 120→135, Pillar of Atlantis hp
  3→80, Temporal Tide 65→80/turn; NEW signature **Flood** (see below).
- **fortune teller**: hp 500→515, int 52→56; Palm Read 100→150 + cleanse 2,
  Family Curse adds -1 INT.
- **martian** Heat Ray 135→155; **grey** Abduction Beam 95→110;
  **machine elves** hp 488→505, mdef 40→42, Refract Beam 118→140;
  **annunaki** atk 48→54; **ki fighter** Ki Wave 130→165 (human's magic STAB),
  Ki Volley 135→150, Dragon Fist 170→185; **mantid** Mandible Strike 144→168
  (alien's physical STAB); **skinwalker** Borrowed Claw 144→165.
- **Harbinger job**: hp -15→0, mdef 10→12, int 20→26; Requiem 96→112,
  Lullaby 144→160.
- **White Mage**: Heal All 128→160; Exorcism tier II→III.

## Tier III rule (new invariant)
Every job's strongest spell is Tier III, and Tier III is now genuinely
PRIMARY-ONLY: `applyRandomSpellsAndSecJob` (state.js) and the party-builder
secondary pools filter `tier === 'III'` out of secondary-job pools (cross-class
was already I/II only).
- Warrior: Judgment 176→210 (III), Dragon Slash 224→192 (II).
- Harvester: Overgrowth 112→168. Raider: Rampage 144→170, Haymaker 150→144.
- Engineer: NEW Tier III **Railgun** (line, physical, 190, armor-pierce, r5).
- Freelancer: A Really Good Punch → Tier III, 112→200.
- Already fine: Meteor, Dead Eye, Mind Shatter, Assassinate, Requiem.

## STAB coverage (≥1 strong physical + magic per typing)
human: Dragon Fist 185 / Ki Wave 165 · alien: Mandible 168 / Mind Shatter 224 ·
anomaly: Borrowed Claw 165 / Crystal Ball 180 · unholy: Dragon Slash 192 /
Meteor 192 · divine: Judgment 210 / Exorcism 160 · tech: Dead Eye 200 / Nuke 180.

## Bug fixes with balance impact
- **Assassinate vs hidden**: the end-of-round vision gate used a flat
  Manhattan-awareness check (`_isUnitVisibleToViewer`) that disagreed with the
  nameplate eye icon; shots landed on "hidden" units. New `isUnitSeenByTeam`
  (battle.js, true isInVision LOS) gates the detonation (state.js) and the
  laser beam render (three-renderer.js). Eye closed ⇒ shot fizzles.
- **Beam quick-menu**: enemy quick menu required orthogonal alignment + range +
  LOS for line/linePush while the engine casts them as unlimited direction rays
  (diagonals included). Now uses a true ray-walk check, offers diagonal beams,
  and provides beam-aware MOVE→CAST. Tile quick menu offers beams on any of the
  8 aligned headings. splitBeam reclassified as a unit-target spell in the menu.

## New spell
- **Flood** (atlantean, anomaly/water, ~70 MP derived, 110 dmg, r4, 2 AP,
  CD 2): elevation-aware `terrainCreate` mode (`elevationFlood`, battle.js) —
  BFS from the target over connected tiles at/below its height (cap 12);
  chasms and 2+-deep basins become deep_water (drowning), rest shallow water;
  enemies caught take damage + slow.

## AI pass (from match116 autopsy)
- **Hazard awareness** (`aiHazardPenaltyAt`, ai.js): penalties for ending turns
  on pending delayed-spell blast tiles (Crystal Ball killed 4 AI units), lava/
  deep water/poison/scorched/burning tiles; wired into applySurvivalPenalties +
  pickBestMoveTile; explicit "flee hazard" move candidate when standing on one.
- **Anti-cluster**: move-tile penalty when ≥2 allies adjacent (the 2×2 camp
  that made the triple-kill possible).
- **Focus fire**: getTargetPriority prior-damage bonus 20→30, killable 30→45.
- **MP dump**: spell scores scale up above 60% MP, harder near the round cap
  (a Psychic finished a match at 399/399 MP).
- **Structure targeting**: enemy deployed objects (heal beacons etc.) are now
  basic-attack candidates.
- **Loadouts**: `randomSpellLoadoutForClass` guarantees 1 healPotion + 1
  panacea before random items (CPU teams used to roll all-banes and die
  debuffed with no sustain).

## Next steps
Re-run the balance lab. Targets: vampire/knight/QB ≤58%, nordic/atlantean/
fortune teller ≥42%, Harbinger ≥45%, alien typing ≥45%. Watch: Judgment (210
3×3 stun may over-correct Warrior), Flood (new), Railgun (Engineer late game).

---

# Balance Pass — 2026-07-09b (162-match ewbalancestats7 + batch20101)

Data: `ewbalancestats7.json` (162 arena matches), `entropywarsbatch20101.json`
(20 match logs). Method upgrade this pass: race WR was decomposed into
**job expectation** (weighted WR of the job the race is locked to) and a
**race residual** (what the race's own kit/stats add). This separates the two
levers cleanly — fix jobs with JOB_MODIFIERS/job spells, fix residuals with
race stats/kits.

## The dataset
Jobs: White Mage 57.1 / Agent 57.1 / Black Mage 56.2 high; Warrior 43.6 /
Engineer 45.2 / Sniper 45.3 / Harvester 46.3 / Psychic 47.1 low.
Biggest race residuals: catgirl +13.1, bigfoot +9.0, fairy +7.9, halfdemon
+7.9, werewolf +7.0, knight +6.4 — martian −13.8, atlantean −9.5, shaman −6.3,
nordic −6.1, ki fighter −4.7.
White Mage's 45→57 jump came from last pass's Heal All 128→160 (Heal All WR
65.9%) — spell numbers move job WR MORE than chassis numbers do.

## Root cause found: stat-scaling mismatches
Spell damage = dmg + 0.35×ATK (physical) or 0.35×INT (magic). Three "buffed
twice, still losing" kits were magic kits on low-INT chassis:
- **martian** (Gunslinger, INT 38): Heat Ray 32% WR even at 155 dmg.
- **ki fighter** (Raider, INT 19): Ki Wave 38% at 165, Ki Volley 32%.
- **nordic** (Warrior, INT 30 after -10): entire 6-spell support kit 33-42%.
Number buffs can't fix a scaling mismatch — retype or rehome instead.

## Structural changes
- **nordic: default job Warrior → Harbinger** (RACE_DEFAULT_JOBS). Its kit
  (Resonance Pulse, Pleiadian Shield, Nordic Accord, Stasis Beam, Aurora Ray,
  Federation Beacon) is a support-caster kit; as Harbinger it gets INT 70 /
  MP 182 and every spell starts working. Thematically clean (resonance /
  accord / harmony = Harbinger's motif). Stats retuned for the role:
  atk 56→48, int 40→44. Also frees Warrior of its worst race.
- **Heat Ray & Ki Wave → damageType 'physical'** (they're a tripod weapon and
  a fighting-spirit beam): they now scale with the owner's real stat.
  Ki Wave 165→150, Heat Ray 155→150 (the retype is the buff). Ki Volley
  retyped physical too (multiHit takes no stat bonus — retype only shifts it
  onto enemy DEF, which casters lack).

## Jobs (JOB_MODIFIERS)
- Agent (57.1): hp −20→−40, int 10→6. Third consecutive Agent nerf — spd/spell
  trims didn't stick, so this one hits survivability.
- Warrior (43.6): mdef 8→12, spd −1→0 (dies to caster burst, loses ties).
- Engineer (45.2): atk 8→14, def 14→16.
- Sniper (45.3): hp −20→−5, def −15→−8 (Assassinate-vs-hidden fix last pass
  overshot the job; also Assassinate 180→200, Kneecap Shot 96→108).
- Harvester (46.3): hp 95→105. Psychic (47.1): int 24→26, Bubble shield
  200→260 (38.6% WR at 44 games — most-picked losing spell).

## Job spells
- White Mage: Heal All 160→140 (walk back half of last pass's +32), Protect
  cooldown 2→3 (65% WR).
- Black Mage: Thunderbolt 120→110 (chain 110/72/44), Wall of Fire 112→100.
- Agent: Shadow Lunge 80→72, marked bonus 40→25 (61.7%).

## Race nerfs (positive residuals)
- **catgirl** (64.7%, #1 three passes running): hp 508→496, atk 62→57;
  Love Bite 90→76, Ninefold Scratch 110→95 total.
- **halfdemon** (64.9%): atk 64→61; Inner Demon +cd2 (78.6% WR!), Shadow Step
  +cd2 (81.2% WR!). Compounds with the Agent chassis nerf.
- **fairy** (65.0%): spd 9→8; Glitterburst 80→64 (68.1%). Compounds with the
  White Mage trims.
- **werewolf** (57.8%): Pounce 144→128, Bite 128→116, Feral Dive 80→70,
  Blood Frenzy 130→118 (whole kit sat 61-63%).
- **bigfoot** (+9.0 resid): atk 68→64 (pre-compensates the Harvester buff).
- **knight** (+6.4): hp 585→575 (pre-compensates the Warrior buff).
- **wizard** (59.2): Arcane Blast 100→90, Spellsteal explicit cd3.
- **vampire**: Predator Drop 50→40 (68%).

## Race buffs (negative residuals)
- **martian** (37.7%, worst residual): Heat Ray retype (above); War of the
  Worlds turret 95dmg/100hp → 120/140.
- **atlantean**: Riptide 135→150, Flood 110→130.
- **shaman**: Totem Drop 50hp/45heal → 90/55, Bad Trip 90→110, Herbal
  Remedy 140→160.
- **ki fighter**: Ki Wave/Volley retype (above).

## Machine elves (new kit, 42.3%) — deep pass
Numbers (battle.js): beam walk-through 30+0.35pw → 42+0.5pw; end-of-round
burn 26+0.3pw → 34+0.45pw; Pulse Lattice 60+0.8pw → 95+1.0pw, 3-D volume
mult 1.6→1.8 (Pulse was 27.3% WR — the payoff spell didn't pay off);
Prism Mirror mirrorHp 1→2 (a 1-HP piece made the whole engine free to answer);
Refract Beam 140→150. Plus the Engineer chassis buff (+6 atk / +2 def).
**Visual pass** (user request): every kit spell now has bespoke VFX
(three-vfx-effects.js) — Prism Mirror crystalline fold-in burst, Tune
Frequency per-prism colour pulse in the new frequency (fired per prism from
battle.js), Refract Beam charged laser with scorching impacts, Pulse Lattice
frequency-coloured lasers per segment (infrared/ultraviolet/gamma variants
replace the generic turret-blast flash), Mirror Blink shatter-and-reassemble
bursts. Persistent lattice beams re-rendered as core+glow double cylinders
and prisms made more present (three-renderer.js).

## Left alone deliberately
- Gunslinger 51.6 / Raider 50.7 / Harbinger 47.2 chassis.
- cowboy Lasso (32%) — one weak spell in a 51.9% race; not worth ripple risk.
- demon 55.1 / men in black 52.8 / vampire 53.6 — the Agent/Black Mage trims
  pull all three toward 50 without race changes.
- grey/telepath/fortune teller/giant/quarterback/annunaki/mad scientist —
  all within ±5 of expectation once their job fix lands; don't double-dip.

## Watchlist for next dataset
- nordic on Harbinger (structural change — could land anywhere; kit numbers
  were NOT buffed alongside, tune those next if still <45%).
- Sniper +Assassinate (two buffs at once: check QB/annunaki don't pop >55%).
- White Mage after Heal All walk-back; fairy specifically.
- Machine elves lattice numbers (walk-hit 42 base + 2-HP prisms may make the
  zoning oppressive on small maps — watch Pulse Lattice WR vs 27.3% baseline).
- Ki Volley/Ki Wave/Heat Ray retype vs armored comps (physical wall).

## Addendum — 2026-07-09c: hybrid stat splits (user direction)
Design call: pure-attacker vs pure-caster for every race is boring — races
whose lore/kit straddles both should have real hybrid statlines. Ki blasts
are MAGIC (the retype to physical is reverted); the fix is giving the fighter
real INT instead.
- **ki fighter**: atk 68→64, int 24→50, mp 120→130. Ki Wave & Ki Volley back
  to damageType magic (descs restored). Dragon Fist / Flurry stay physical —
  fists scale with ATK, spirit scales with INT. The archetype hybrid.
- **grey**: Abduction Beam physical→magic — it was a physical spell on an
  ATK-8 psychic (reverse mismatch, 42.4% WR); it's a telekinetic tractor
  beam, now scales with INT 65.
- **annunaki**: int 32→44. Sniper rifle arm + an all-magic kit (Star Decree,
  Gravity Well, Summon Storm) = god-engineer hybrid.
- **shaman**: int 48→54 (Harvester bruiser-priest, spirit half nudged).
- Heat Ray stays PHYSICAL — it's the tripod's weapon, not martian sorcery;
  that retype was lore-correct.
Watch: ki fighter got both the hybrid INT and this pass's earlier kit
attention — if it lands >55% pull int 50→42 first.
