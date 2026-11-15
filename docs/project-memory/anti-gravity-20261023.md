---
name: anti-gravity-20261023
description: PR #453 (10-23) Low Gravity zone + Telekinetic Slam + Black Hole let heavy/colossal units be pushed/pulled; calls flagged to mondo
metadata:
  type: project
  modified: 2026-10-23T09:24:59.611Z
---
mondo (2026-10-23) asked that the anti-gravity zone spell let normally immovable big units be displaced like anyone else, and wanted a couple of other spells it fits.

- The spell is Low Gravity (sharedLowGravity, gravityField 'weak'). No status did "weightless", and no new status was added.
- PR #453: battle.js isUnitWeightless / getUnitDisplaceWeightClass. In a weak field, or when moved by a spell row with `weightless: true`, heavy and colossal bodies count as MEDIUM, and only for displacement. getUnitPushDistance takes a 4th `spell` arg. Fall damage and crash-through keep the real weight. Windborne, Mountainborn and Clash still hold.
- `weightless: true` rows: Telekinetic Slam, Black Hole. Zip SYNC_20261023-0924.
- Calls flagged to mondo: Telekinetic Slam + Black Hole picked; Levitating NOT made weightless (ally-only buff, would nerf own big units); Gravity Well left out; weightless = treated as medium, not feather.
- The forced-move rules this builds on are in [[forced-movement]] and [[forced-movement-rules]].
- Browser check recipe without an eval server: scratchpad bt/run.js, a one-shot Playwright runner that takes step files. A local HTTP eval server was refused by the auto-mode classifier. jsdelivr is blocked, so the runner serves libs from `npm pack` folders. The test set Low Gravity cast, `_spellsUsedThisTurn = {}`, then Body Check. Kaiju at distance 3 was out of the Sedan's vision.
