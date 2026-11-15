---
name: balance-stats34-20261101
description: 11-01 STATS34 read (1,675 matches, first run on the jump/climb CPU, fresh start) + PR #731 20-race stats-only pass; speed no longer buys wins (SPD refit not baked, flagged)
metadata:
  type: project
  modified: 2026-11-01T08:00:02.295Z
---
mondo 11-01 07:49 sent ew-balance-stats34.json: "treat this as a fresh start ... balance the top 5 or 10 weakest/strongest ... power level affects win rate".
Copy: /root/.claude/uploads (thread-local). Older exports for bake-power: S33 e6e323b8 + the list in [[balance-stats33-20261031]] (uploads/hearth).

Findings: all 1,675 on PR #711 race stats. Noise 4.8 pts, true sd 4.1 (τ² .0017). New CPU reshuffled: untouched S33→S34 slope .24.
#711 landed ~6 pts/100 POWER (±3.7). SPEED NO LONGER WINS: move-5 races 47.3%, move-1 56.5%; HP r +.39. Refit on S34 alone: SPD 0 (was 1.13),
M.DEF .63, LORO .40 vs current .34; 2-run fit put 5.19 on VISION. mondo 08:02: refit OK but SPD must keep a real weight (moving first/most tiles matters). PR #732 refit fit-on=1 --min=spd:0.6 (new bake-power.js floor): hp .25 mp 0 atk .58 int .55 def .13 mdef .74 spd .6 vision .53 range 33 perPoint 52; LORO .38; median 790. Zip ENTROPY_WARS_SYNC_20261101-0804 = data.js 067ba356 (supersedes 0759). mondo 08:08 "nothing should have a weight of zero" (MP): PR #734 floors on EVERY stat (~half the 10-30 weights, SPD .6): hp .25 mp .1 atk .58 int .5 def .15 mdef .71 spd .6 vision .65 crt .2 range 32 perPoint 53; LORO .385; median 809. Zip ENTROPY_WARS_SYNC_20261101-0809 (data.js d6c2c8d1 + ai.js 7b342b5d from #733). RULE: never let a POWER weight fit to 0; always pass --min floors.

SHIPPED PR #731 (merged, token 20261101-stats34-01-cors, zip ENTROPY_WARS_SYNC_20261101-0759 = data.js 655ea46f). Top 10 each side by
mean(raw, adj). Size 0.45 x gap at 6.5/100 POWER, min 40; seesaws x0.6 on the stats #711 moved (Occulus, Cosmic Wraith, Gangster, Politician).
Rabbit (non-mover) + M.DEF 64->120. No SPD/move/spell/exclude changes. Spells part of POWER rebaked, median 764.
Next in line not changed: Symbiote, Sheriff, Fairy, Angel (~42%); Ghoul, Tree Person, King Arthur (~59%), Antperson 58.
