---
name: balance-stats28-20261029
description: 10-29 STATS28 read (STATS27 raises overshot; stat change ≈ 5 pts/100 POWER, move 1→2 huge) + PR #684 28-race pass (13 own-spell numbers + stats), POWER fit-on=5
metadata:
  type: project
  modified: 2026-10-29T23:05:56.625Z
---
mondo 10-29 22:51 sent ew-balance-stats28.json ("analyze and balance"): 1,499 Arena, ~97 a race, builds zonemove-01/chessset-02/hwcoffins-01 =
all after PR #674, all BEFORE PR #681 (Trick or Treat AoE dmg+heal not in data). Upload: /mnt/project-files/uploads/hearth/3aea14df-7088-4112-9dbf-e20e1eb94683. Page: https://claude.ai/artifact/ThXoRNSaUXoDRT8vseL4ok

Findings: STATS27 raised 8 went 32.7→54.5 (regression predicted 42.8), cut 8 62.4→49.5 (pred 55.1). Golem 34→68, Angel 29→63, Tree Person 28→61.
CALIBRATION: stat change ≈ 5 pts per 100 POWER (both directions, without move-change races); POWER cross-section says 3.4. Move 1→2 (Golem, TP)
≈ +20-25 pts, far above POWER. True race sd ~5 pts vs 5.1 noise per run. Loadouts = chance again (117 vs 106). Machine Elves never cast Tune
Frequency / Shatter the Lattice (AI use). Shipped POWER read S28 fresh r .49.

SHIPPED PR #684 (merged, token 20261029-stats28-01-cors, zip ENTROPY_WARS_SYNC_20261029-2303 = data.js aae04775). Rebake fit-on=5 (fit-on=4 put
1.26 on VISION); median 1010. Bar = STATS27's (unchanged: S27+S28 pooled 90% Wilson; changed by #674: S28 alone 95%) → 17 strong, 12 weak.
Size = half gap × 20 POWER a point. No move changes. Spells first: own spells ≥1.25×/≤0.8× tier with 20+ casts (13 rows). Ghost untouched (card open),
Jack untouched. Gnome ATK 39→140 + Free Energy excluded. Flagged: a 95% bar would drop Gangster, Fallen Angel, Cult Leader, Annunaki, Time Cop,
Reptilian, Bee Queen. Watch next run: Golem/Angel/Tree Person second correction; Vampire +207/Mantid +110 over POWER median. Not lab-checked.
Related [[balance-stats27-20261029]] [[power-refit-20261029]].
