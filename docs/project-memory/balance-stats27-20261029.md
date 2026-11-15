---
name: balance-stats27-20261029
description: 10-29 STATS27 read (STATS26 pass worked; race spread now ~4-5 pts true) + PR #674 16-race pass, POWER rebaked fit-on=4; selection rule
metadata:
  type: project
  modified: 2026-10-29T12:19:54.965Z
---
mondo 10-29 12:05 sent ew-balance-stats27.json (587 Arena, all build stats26-02 = PR #673; uploads/hearth/c83f2b4f-083a-4dae-bbf8-f9c79a9a23f3;
S26 = d4c1fbf1-58e1-4da3-8122-03398e2a61fa) and asked: analysis of every Balance Lab tab + how to use each to balance weakest/strongest, then a pass.
Page: https://claude.ai/artifact/FKb8xCoyxEM8hgS4tjExZB

Findings: PR #672/#673 worked (cut group 64→51, raised 35→51; regression alone predicted 56.6/42.8). Untouched races S26↔S27 r .33;
true race spread ~4-5 pts sd vs ±8 noise per run. Builds tab: within-race loadout = chance (115 vs 102). Spells tab some signal
(32 vs 18), bottom = shared no-damage spells. Spread tab = POWER blind spots (Undead +23.5, Angel −25.5).

SHIPPED PR #674 (merged, token 20261029-stats27-01-cors, zip ENTROPY_WARS_SYNC_20261029-1216 = data.js 76be5419).
Rebake `--fit-stats --fit-on=4` (S27,S26,S25,S24 + 3 older), held out S27 .44; median 1198.
RULE used (flagged): unchanged races pooled S26+S27, 90% Wilson off 50; races changed last pass S27 only, 95%. Size = half the
pooled gap at 100 POWER ≈ 4 pts, cap 200; Angel/Seraphim on to −75. Weak: Tree Person, Jellyfish, Angel, Golem, Bligblog,
Antperson, Seraphim, Voidweaver. Strong: Honda Civic, Undead, Bigfoot, Cyborg, Firefighter, Cowboy, King Arthur, Succubus.
Shared no-damage excludes on 6 weak races. Watch next run: Demon (59 pooled), Vampire/Fairy/Unicorn (~42), Glitch/Hippie/Catgirl
(over-raised?), Sharkman/Antihero (over-cut?). Ghost Incorporeal card still open. Related [[balance-stats26-power-pass-20261029]] [[power-refit-20261029]].
