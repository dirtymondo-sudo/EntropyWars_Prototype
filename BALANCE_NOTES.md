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
