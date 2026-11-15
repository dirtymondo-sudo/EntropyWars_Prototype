---
name: balance-spread-20261029
description: 10-29 PR #662 Balance Lab "Spread" tab — pre-match win forecast, race over/under with teammates taken out, comps vs forecast
metadata:
  type: project
---
mondo 10-29 asked for a team comp tracker ("over/under spread": predict the winner from teammates + foes, then see who beats it; spot OP comps).

SHIPPED PR #662 (merged, token 20261029-spread-01-cors, zip ENTROPY_WARS_SYNC_20261029-0501.zip = battle.js 22a2d427).
battle.js BAL_SPREAD/_balSpreadFit: ridge logistic, race edge + POWER z-score weight + side; race ridge 20 tuned on stats24
(OOF: favourite won 67%, forecast 68%, Brier .203). Forecast made at draft (_balMakeForecast), stored matchLog[].pred +
stats.forecastLive. Spread tab views Races / Role mixes (RACE_CLASS) / Race pairs / Teams; tables out of fold over the log.
Export analysis.spread + analysis.forecastLive. teamAdjusted untouched.
Finding: with EVEN GAMES random drafts teammates average out at ~64 games (race expected 46-55%), so race over/under ≈ raw WR-50;
role mixes / pairs are the new signal but noisy (8-20 games). Screenshots /mnt/project-files/balance/spread/. Harness
/mnt/project-files/balance/weak-races-harness/spreadlab.js. Related [[balance-stats24-power-20261029]] [[balance-stats21-20261025]].
