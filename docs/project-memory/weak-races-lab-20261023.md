---
name: weak-races-lab-20261023
description: 10-23 study of Clown/Wizard/Nordic/Crystal Guardian/Angel balance; lab results and buff tests, nothing applied
metadata:
  type: project
  modified: 2026-10-23T10:22:37.988Z
---
Analysis only, mondo picks. Report https://claude.ai/artifact/7ntHViRpv7225gYf5aUWes. Files: /mnt/project-files/balance/weak-races-study/. Harness: /mnt/project-files/balance/weak-races-harness/.
- Solo-forced Arena lab (~2,400 matches) win rates: Clown 34%, Wizard 40%, Angel 43%, Nordic 51%, Crystal Guardian 50%. His Nordic and Crystal Guardian lows did not reproduce.
- Hand-played 5v5 vs CPU with all five: lost 319-456 on Arena score.
- Wizard: SPD 23->50 (move 2) took it from 36-40% to 47%. HP 500 on top added nothing. Clearest result of the study.
- Clown: base ATK 120, or ATK+INT 130, did NOT help (36.5%, 29%). At L100 the base stat is a small share of the final stat. About 20% of its AI casts are Trick Room or Mimicry, which deal 0 damage. No proven fix yet. Next tests: SPD 88, and the CPU not casting Trick Room or Mimicry.
- Angel: SPD 50 (+HP 800) raises kills but not win rate.
- Bigger heals (healPct) make the AI heal 3-25x more, but win rate is unchanged: Arena score doesn't count healing.
- Lab noise: ±8 points per arm of ~500 matches. Races left unchanged swung between 44% and 57%.
**Why:** mondo's 10-23 Balance Lab flagged these five as weak.
**How to apply:** don't re-run the same tests; build on these results. Related: [[win-condition-balance]].
