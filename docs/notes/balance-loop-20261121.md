> **11-22 REVIEW (mondo's answers):** the RACE STAT changes were judged noise (the baseline was already inside luck: 5.63
> vs 5.85; ~57 games a race = ±6.6 pts) and every RACE_BASE_STATS row is BACK to its pre-11-21 line. The SPELL FAMILY fixes
> stay (Sacrifice, Spygear incl. EMP Jammed 2 rounds, Psychic, Dirty Fighting, Fractal); their descriptions were made to match
> (EMP "Jams them for 2 rounds", Mind Blank MEDIUM, Migraine HEAVY, Telepathic Link "within 4 tiles"). Boltzmann Brain's
> four pass-4 pool removals are undone (mondo: "the random jump is surely the cause of its low wr"). train_headless.js got
> `--recycle N` (default 12): a fresh tab in the same context between matches, the old lab4 harness's way. A race needs
> ~100+ games a lab before its own read is worth a stat change (the 11-08 loop's floor). The state file and the race table below
> describe the undone passes: a new loop starts a fresh state file.

# THE BALANCE LOOP, 2026-11-21 (mondo: "run the balance lab yourself, a lot ... until all of the champs are close to 50% ... if you overshoot, revert and do half")

## How to run it (no browser by hand)
```
npm install   # playwright is a dependency; the container's Chromium is at /opt/pw-browsers/chromium
PW_CHROMIUM=/opt/pw-browsers/chromium node train_headless.js --lab balance --workers 3 --minutes 240 --out shots/bal/pN
node bal-analyze.js shots/bal/pN [more runs]        # every race: games, raw + team-adjusted win rate, K/D/damage
node bal-families.js shots/bal/pN                   # spell families past the noise (ZMIN=1.8; FAM=<name> for one)
TAU=0.04 node bal-plan.js docs/notes/balance-loop-20261121-state.json <pass> [--apply]   # the next pass's stat changes
```
- train_headless.js now writes the full Balance Lab tables into each worker-N.json (`stats`), and a crashed tab (they crash
  every 10-30 matches) keeps its data as worker-NcK.json and reboots in place.
- The local server refuses a STALE checkout (503): merge origin/main before every run or the runner dies with "server did
  not come up".
- Speed in a 4-core cloud container: ~4.5 matches a minute however many workers (1 tab = 3.4/min), so a 4-hour lab is
  ~1,100-1,200 matches, ~57 games for each of the 165 drafted races.

## What the data says (read this before the next pass)
- One lab cannot rank races: two unchanged 2-hour baselines agreed race by race at r 0.03. At ~57 games a race the luck
  alone is ±6.6 pts (1 sd); the real spread of race win rates is only ~2-4 pts. The 11-08 loop hit the same floor.
- Win rate barely follows POWER on this roster (r 0.12) and physical vs magic kits do not differ (50.7 vs 49.1 %).
- SPELL FAMILIES pool 10+ races and hundreds of games each, so they ARE readable: Spygear (58.7 %, z 4.5) and Psychic
  (43.8 %, z −3.6) were the clearest outliers in the whole dataset.

## Method
- Each race read over every lab since its stats last changed (mean of raw + team-adjusted win rate), the gap to 50 shrunk by
  the signal share tau²/(tau²+0.25/games), tau 4 pts. Changed when the shrunk gap is 2+ pts; size = gap / 17.3 pts per 100
  POWER (the 11-08 loop's measured rate), min 15 POWER; half to HP, half to the pool's damage stat (ATK / M.ATK by the share
  of physical vs magic damage spells), each stat capped ±25 %. No SPD / move / range changes.
- OVERSHOOT (mondo's rule): a race changed last pass that crossed 50 by 5+ pts the other way goes back to its old stats plus
  HALF the change.
- Row comments: "LAB LOOP 11-21 PASS n" on every changed RACE_BASE_STATS row and spell row. Pass state (every change,
  before/after, the read): docs/notes/balance-loop-20261121-state.json.

## The passes
| Lab | Matches | Changes going in | Raised races (read → now) | Cut races | Halved | Avg distance from 50 (luck-only) | Races ≤40 / ≥60 |
|---|---|---|---|---|---|---|---|
| baseline (2 labs) | 958 | none | | | | 5.63 (5.85) | 23 |
| pass 1 | 1,187 | 34 races + Sacrifice | 20: 37.6 → 48.9 % | 14: 64.5 → 50.1 % | – | 5.52 (5.26) | 27 |
| pass 2 | 919 | 45 races + Spygear / Psychic | 17: 40.9 → 50.1 % | 23: 57.4 → 48.0 % | 5: → 49.2 % | 6.34 (5.98) | 35 |
| pass 3 | 1,103 | 46 races + Dirty Fighting | 18: 43.4 → 51.0 % | 12: 57.6 → 51.8 % | 16: → 52.6 % | 5.71 (5.45) | 27 |
| pass 4 | 1,175 | 44 races + Boltzmann pool | 10: 43.5 → 49.5 % | 21: 57.0 → 50.9 % | 13: → 50.1 % | 5.75 (5.28) | 26 |
| pass 5 (final) | 1,211 | 34 races + Psychic II / Fractal | 13: 44.3 → 49.4 % | 15: 56.1 → 52.8 % | 6: → 52.7 % | **5.05 (5.21)** | **19** |

- Final lab: the race spread is no wider than luck alone (raw sd 6.3 vs 6.5 binomial), the first run where that is true.
- 118 races changed at least once: average 8.1 pts from 50 when first changed → 5.0 in the final lab, the same as the 47
  never-changed races (5.1) = the noise floor. The 25 that started 10+ pts off: 15.0 → 5.9.
- Caveat: part of each group's move is regression to the mean (a race read at 35 % on 50 games is partly unlucky); the
  untouched races' run-to-run slope was ~0.1, so most of a single read is luck. That is why sizes are shrunk.

## Spell / pool changes (data.js, each row commented)
- Pass 1: Sacrifice givePct 1.5 → 1.3 (holders 69 % over 72 unit-games, z 3.3, the one spell past the noise of 447).
- Pass 2, SPYGEAR (58.7 %, 654 unit-games, z 4.5): EMP Grenade dmg 100 → 90 + Jammed 3 → 2 rounds, Place Bomb 130 → 115,
  Poison Dart 110 → 100. → 47.5 % / 47.5 % / 48.6 % / 53.7 % in the next four labs (fixed).
- Pass 2, PSYCHIC (43.8 %, 827 unit-games, z −3.6): Mind Blank 90 → 105, Migraine 155 → 170, Telepathic Link aura 3 → 4.
  → 49.1 % then 45.3 / 45.1 % (46.3 % over 1,222 games). Pass 5, second smaller buff: Mind Shatter 160 → 175, Mind Blank
  105 → 115. Final lab 47.0 % (z −1.3, inside the noise).
- Pass 3, DIRTY FIGHTING (54.4 % over ~1,700 unit-games): Dark Justice 100 → 90, Body Check 100 → 90. → 48.5 %, 52.7 %.
- Pass 4, BOLTZMANN BRAIN (30 / 31 / 29 % in three labs while HP + M.ATK rose three times; 5.1 utility casts a game vs 2.0,
  41 basic damage vs 523): its pass-3 stats undone, RACE_SPELL_EXCLUDES + Teleport, Far Sight, Cosmic Sight, Psychosis
  (shared no-damage picks; 24 spells left). Pass 4 lab 26 %, final lab 43.5 %. FLAG FOR MONDO: the round-end random jump
  (fluctuation) is the likely root; stats did nothing for it.
- Pass 5, FRACTAL (44.0 % over 720 unit-games, z −3.2): Strange Loop 70 → 80, Fractal Stitch 130 → 145. Final lab 45.7 %
  (188 games, inside the noise).

## Still open
- Cryptid family read 56.7 % in the last two labs (395 games each, z 2.7) but 44.5 % in pass 2: watch it.
- Boltzmann Brain (above). Next pass: pool every lab since each race's last change; one more pass will not read finer than
  ±5 pts a race without far more matches (2,000+ a lab).

## Every race changed (first read vs the final lab; net stats from start to now)
| Race | Passes (↑ up, ↓ down, ½ halved back, * manual) | Read when first changed | Final lab | Net stat change |
|---|---|---|---|---|
| machine elves | 1↑ 4↓ 5½ | 28% | 49% | HP 1050→1090, M.ATK 183→199 |
| occulus | 1↑ | 32% | 48% | HP 1150→1200, M.ATK 193→213 |
| librarian | 1↑ | 34% | 58% | HP 1000→1040, M.ATK 190→207 |
| delivery boy | 1↑ 2↑ 5↑ | 34% | 52% | HP 1050→1180, ATK 95→151 |
| rabbit | 1↑ 2½ 4↓ | 35% | 44% | HP 1300→1270, ATK 97→93, M.ATK 185→177 |
| robot | 1↑ 3↓ 4↓ 5↓ | 36% | 53% | HP 1624→1540, ATK 95→68, M.ATK 7→6 |
| boltzmann brain | 1↑ 2↑ 3↑ 4* | 37% | 44% | HP 950→1060, M.ATK 210→257 |
| cameraman | 1↑ | 37% | 43% | HP 900→940, M.ATK 60→73 |
| superhero | 1↑ 4↑ | 38% | 45% | HP 1160→1220, ATK 174→186, M.ATK 140→157 |
| virus | 2↑ 4↑ 5½ | 38% | 47% | HP 780→860, M.ATK 180→211 |
| voidweaver | 1↑ | 38% | 45% | HP 870→900, ATK 166→169, M.ATK 116→127 |
| symbiote | 1↑ 2↑ 3½ 4½ | 39% | 38% | HP 810→870, ATK 122→140, M.ATK 72→80 |
| annunaki | 1↑ | 40% | 44% | HP 1330→1360, ATK 117→122, M.ATK 124→133 |
| demon princess | 1↑ | 40% | 41% | HP 640→670, M.ATK 111→124 |
| mummy | 1↑ | 40% | 45% | HP 890→920, M.ATK 125→137 |
| djinn | 1↑ 4↑ | 40% | 57% | HP 650→720, ATK 94→101, M.ATK 158→183 |
| fairy | 2↑ 3½ | 40% | 50% | HP 1060→1090, ATK 3→6, M.ATK 173→181 |
| referee | 1↑ 2½ 5↑ | 41% | 47% | HP 1150→1210, ATK 95→118 |
| trucker | 1↑ | 41% | 55% | HP 1350→1380, ATK 125→135, M.ATK 45→49 |
| cult leader | 2↑ 3½ | 41% | 56% | HP 1070→1090, M.ATK 212→223 |
| sheriff | 2↑ | 41% | 51% | HP 890→930, ATK 91→109 |
| hippie | 1↑ 3↑ 4½ | 41% | 54% | HP 1270→1320, ATK 10→18, M.ATK 170→185 |
| janitor | 1↑ 2½ 4↓ 5↓ | 41% | 50% | HP 1100→1060, ATK 110→101, M.ATK 110→97 |
| sewer gator | 1↑ | 41% | 44% | HP 1100→1130, ATK 168→175, M.ATK 60→66 |
| mantid | 2↑ 3½ | 42% | 50% | HP 860→880, ATK 164→166, M.ATK 192→200 |
| dreameater | 2↑ 5↑ | 42% | 48% | HP 870→940, M.ATK 160→189 |
| shogun | 3↑ | 42% | 47% | HP 1350→1390, ATK 130→149 |
| time cop | 3↑ 4½ 5½ | 42% | 63% | HP 760→790, ATK 93→103, M.ATK 29→35 |
| swamp monster | 3↑ 4½ | 43% | 49% | HP 1170→1190, ATK 101→104, M.ATK 53→60 |
| telepath | 2↑ | 43% | 40% | HP 650→690, M.ATK 195→210 |
| swordfighter | 3↑ | 43% | 35% | HP 1180→1220, ATK 111→128 |
| werewolf | 2↑ 3½ 4↓ 5½ | 43% | 42% | (back to start) |
| mech | 2↑ | 43% | 49% | HP 980→1010, ATK 109→119, M.ATK 65→69 |
| influencer | 3↑ 4½ | 44% | 52% | HP 900→920, ATK 30→32, M.ATK 180→187 |
| pirate | 3↑ | 44% | 53% | HP 1170→1200, ATK 106→120 |
| ghost | 3↑ 4½ | 44% | 60% | HP 460→480, M.ATK 110→117 |
| siren | 2↑ | 44% | 39% | HP 922→950, M.ATK 177→191 |
| mechanic | 2↑ 3½ | 44% | 41% | HP 1150→1170, ATK 120→127 |
| dinosaur | 2↑ 3½ | 45% | 44% | HP 1130→1150, ATK 131→137 |
| vtuber | 2↑ | 45% | 60% | HP 820→850, M.ATK 185→197 |
| bee queen | 3↑ 5↑ | 45% | 47% | HP 1200→1270, ATK 118→131, M.ATK 134→151 |
| televangelist | 5↑ | 45% | 50% | HP 1150→1190, M.ATK 190→205 |
| overlord | 2↑ | 45% | 53% | HP 910→940, ATK 71→78, M.ATK 68→75 |
| honda civic | 3↑ | 45% | 59% | HP 860→890, ATK 114→125 |
| knight | 3↑ | 45% | 55% | HP 1150→1180, ATK 105→118 |
| farmer | 3↑ 4½ | 45% | 49% | HP 1100→1120, ATK 110→116 |
| pope | 4↑ 5↑ | 45% | 47% | HP 1150→1210, ATK 40→48, M.ATK 160→182 |
| cicada brood | 3↑ 4↑ | 45% | 45% | HP 1000→1090, ATK 150→160, M.ATK 110→145 |
| door agent | 3↑ | 45% | 55% | HP 1030→1060, ATK 73→86 |
| antperson | 4↑ | 45% | 54% | HP 1650→1680, ATK 138→144, M.ATK 112→121 |
| general | 3↑ | 46% | 51% | HP 1650→1680, ATK 133→146 |
| conspiracy theorist | 4↑ | 46% | 59% | HP 1230→1260, M.ATK 164→179 |
| ai | 4↑ 5½ | 46% | 53% | HP 1010→1030, M.ATK 200→207 |
| demon | 4↑ | 46% | 51% | HP 690→720, ATK 141→145, M.ATK 101→112 |
| tree person | 5↑ | 46% | 60% | HP 1200→1230, ATK 125→135, M.ATK 47→51 |
| golem | 5↑ | 46% | 43% | HP 1160→1190, ATK 157→168 |
| grey | 5↑ | 46% | 49% | HP 870→900, M.ATK 197→210 |
| politician | 4↑ 5½ | 46% | 63% | HP 1810→1830, ATK 11→16, M.ATK 200→203 |
| kaiju | 5↓ | 53% | 52% | HP 690→660, ATK 92→80 |
| bligblog | 5↓ | 53% | 51% | HP 1270→1240, ATK 50→45, M.ATK 204→195 |
| gnome | 4↓ | 54% | 44% | HP 1520→1490, ATK 142→129 |
| lifeguard | 4↓ | 54% | 47% | HP 1250→1220, ATK 60→55, M.ATK 150→141 |
| chess piece | 5↓ | 54% | 55% | HP 1670→1640, ATK 230→217 |
| goblin | 4↓ | 54% | 44% | HP 1030→1000, ATK 148→140, M.ATK 77→72 |
| bunny girl | 4↓ | 54% | 53% | HP 1420→1390, ATK 96→88, M.ATK 160→154 |
| monk | 3↓ | 54% | 54% | HP 1200→1170, ATK 125→115 |
| jellyfish | 4↓ | 54% | 58% | HP 1170→1140, M.ATK 162→150 |
| men in black | 4↓ | 54% | 57% | HP 850→820, ATK 63→56, M.ATK 181→175 |
| santa clause | 5↓ | 54% | 43% | HP 980→950, ATK 79→71, M.ATK 117→111 |
| jack o lantern | 4↓ | 54% | 48% | HP 1270→1240, M.ATK 173→160 |
| juggernaut | 4↓ | 54% | 58% | HP 1250→1220, ATK 92→79 |
| luchador | 4↓ | 55% | 57% | HP 1480→1450, ATK 111→99 |
| minotaur | 4↓ | 55% | 53% | HP 1160→1130, ATK 99→86 |
| ice queen | 3↓ 5↓ | 55% | 51% | HP 730→670, M.ATK 156→130 |
| halfdemon | 3↓ | 55% | 51% | HP 680→650, ATK 128→120, M.ATK 87→81 |
| king kong | 4↓ 5↓ | 55% | 46% | HP 1270→1210, ATK 158→131 |
| vampire | 3↓ | 55% | 50% | HP 720→690, ATK 88→78 |
| chef | 2↓ | 55% | 50% | HP 1140→1110, ATK 84→79, M.ATK 114→105 |
| ghoul | 4↓ | 55% | 49% | HP 750→720, ATK 92→85, M.ATK 19→14 |
| succubus | 2↓ 3½ 5↑ | 55% | 58% | HP 620→640, ATK 65→67, M.ATK 121→127 |
| robinhood | 2↓ 3½ 4½ | 55% | 55% | HP 680→660, ATK 125→116 |
| sidekick | 2↓ | 55% | 55% | HP 1010→980, ATK 133→120 |
| eagleman | 4↓ 5↓ | 55% | 52% | HP 1040→980, ATK 160→143, M.ATK 71→58 |
| streamer | 3↓ 4½ | 55% | 45% | HP 950→940, ATK 120→118, M.ATK 130→125 |
| mad scientist | 2↓ 3↓ 5↓ | 56% | 45% | HP 580→480, M.ATK 147→104 |
| ninja | 3↓ 4½ | 56% | 51% | HP 940→930, ATK 150→144 |
| mermaid | 2↓ 3½ 4½ | 56% | 45% | HP 790→770, M.ATK 181→172 |
| flesheater | 2↓ | 56% | 44% | HP 1090→1060, ATK 116→105 |
| starfish | 2↓ 3½ | 56% | 64% | HP 1510→1500, ATK 63→61, M.ATK 200→195 |
| cosmic wraith | 2↓ 4↓ | 57% | 37% | HP 1350→1290, M.ATK 94→66 |
| karate frog | 2↓ | 57% | 51% | HP 1150→1120, ATK 135→127, M.ATK 60→54 |
| shadow entity | 2↓ 5↑ | 57% | 46% | M.ATK 151→150 |
| giant | 2↓ 3½ 5↑ | 57% | 43% | HP 1190→1230, ATK 123→140 |
| antihero | 2↓ | 57% | 47% | HP 1050→1020, ATK 208→195 |
| skater | 2↓ 5↑ | 58% | 51% | ATK 165→164 |
| reptilian | 2↓ | 58% | 50% | HP 1080→1040, ATK 172→165, M.ATK 101→91 |
| cyborg | 3↓ | 58% | 55% | HP 1200→1160, ATK 89→77, M.ATK 102→94 |
| nordic | 2↓ | 58% | 46% | HP 1420→1380, M.ATK 200→184 |
| sharkman | 2↓ 3½ | 58% | 51% | HP 1300→1280, ATK 146→142, M.ATK 29→26 |
| gangster | 2↓ 4↓ | 59% | 54% | HP 880→800, ATK 134→97 |
| firefighter | 2↓ 3½ | 59% | 39% | HP 1260→1240, ATK 77→72, M.ATK 80→75 |
| bigfoot | 1↓ 5↓ | 59% | 59% | HP 1160→1100, ATK 130→110 |
| kraken | 1↓ | 59% | 60% | HP 900→870, M.ATK 112→100 |
| cursed tv | 2↓ 3½ 4½ | 60% | 62% | HP 900→870, M.ATK 175→159 |
| spy | 2↓ 3½ | 60% | 54% | HP 793→770, ATK 159→150 |
| loch ness monster | 1↓ 2½ | 60% | 48% | HP 1220→1210, ATK 119→116, M.ATK 43→39 |
| jellyfish ufo | 1↓ 3↓ 4↓ 5↓ | 60% | 53% | HP 1200→1050, ATK 125→107, M.ATK 125→67 |
| mothman | 1↓ 5↓ | 61% | 57% | HP 840→770, M.ATK 179→151 |
| florida man | 1↓ 2↓ | 63% | 55% | HP 1300→1230, ATK 140→112 |
| gladiator | 2↓ 3↓ | 65% | 57% | HP 1250→1150, ATK 135→93 |
| clown | 1↓ 5↓ | 65% | 54% | HP 1420→1350, ATK 194→171 |
| goatman | 1↓ | 65% | 49% | HP 1260→1220, ATK 133→123, M.ATK 57→49 |
| shaman | 1↓ | 65% | 48% | HP 1030→990, ATK 55→49, M.ATK 217→204 |
| barbarella | 1↓ | 67% | 57% | HP 1180→1140, ATK 137→125, M.ATK 63→55 |
| ki fighter | 1↓ 3↑ 4½ | 67% | 44% | HP 1080→1060, ATK 125→114 |
| krampus | 1↓ 2½ | 67% | 41% | HP 1150→1130, ATK 136→129, M.ATK 96→93 |
| mole man | 1↓ 3↓ | 71% | 52% | HP 1450→1350, ATK 150→106 |
| wendigo | 1↓ 3↑ 5↓ | 74% | 70% | HP 1250→1190, ATK 150→137, M.ATK 30→22 |
