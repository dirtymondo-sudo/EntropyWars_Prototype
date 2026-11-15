---
name: balance-stats26-power-pass-20261029
description: 10-29 STATS26 pass PR #672: POWER rebaked on 3 runs, 30 lab-outlier races' stats moved to POWER ±75 of median; rule = only races the lab shows strong/weak
metadata:
  type: project
  modified: 2026-10-29T10:58:13.994Z
---
mondo 10-29 10:42 sent ew-balance-stats26.json (504 matches, all after PR #668/#669) and asked to make every race's POWER ±100 of
the median with 1-2 sensible stats. 10:54 he CORRECTED: "dont do it for every race, just the ones the balance lab data shows are
weak or strong. dont change a race's stats if their win rate is near 50 %". Apply this rule to any future POWER pass.

SHIPPED PR #672 (merged, token 20261029-stats26-01-cors, zip ENTROPY_WARS_SYNC_20261029-1057.zip = data.js 3b342eeb).
- Rebake fit-on=3 (S26+S25+S24): weights barely moved, median 1249. PR #669 POWER read S26 held out r .555.
- Rule used: STATS26 adjWr <=42% or >=58% AND POWER >100 off median same side -> 30 races. HP + own damage stat, half each, landed ~±75;
  move 5->4 (SPD 160) for fast strong races; move 2->3 (SPD 90) Shaman/Occulus/Hippie. Table /mnt/project-files/balance/stats26/STATS26_POWER_PASS.md.
- Nephilim/Dragon hit caps at +162/+160. mondo: NEVER cut unique/signature spells; use other stats too (DEF/MP/SPD), and cut
  SHARED-family spells via RACE_SPELL_EXCLUDES. PR #673 (merged, token stats26-02, zip ENTROPY_WARS_SYNC_20261029-1108 = data.js 52693b0b):
  Nephilim excl Quake/Rockslide/Stone Drop/Ground Slam, Dragon excl Vortex Slam/Eye of the Storm/Inferno/Meteor, both SPD 160→145 (move 4) → +89/+82.
- Ghost got HP 641->590, M.ATK 180->143 while the Incorporeal card is still open: undo if he picks that card.
- Left alone (POWER blind spots): lab-strong in band Honda Civic, King Arthur, Sheriff, Firefighter, Skeleton, Swamp Monster, Succubus,
  Police Officer, Door Agent, Chef; lab-weak in band Swordfighter, Antperson, Golem, Goblin, Bee Queen, Pirate, Cosmic Wraith; opposite Rabbit, Robot.
- Finding: after regression to the mean, the STATS25 single-race stat changes show no clear effect in S26 (32 games = ±9 pts noise per race).
Related [[power-refit-20261029]] [[balance-stats25-20261029]].
