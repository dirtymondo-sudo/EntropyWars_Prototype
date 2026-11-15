---
name: gold-rule-city-20261113
description: mondo 11-13 gold rule for buildings: approved gold = terrain/gilt.png via terrain key `gold`; never load gold.png / gold_2 / gold_3 files by name, also not in mock-ups
metadata:
  type: feedback
---
mondo 2026-11-13 17:12 (Hero Plaza mock-up, gold dome): "we absolutely never use that gold texture anywhere in the game, there is a better gold texture".
The better gold = R2 `Assets/Sprites/terrain/gilt.png` (Metal007, his pick 11-03, PR #867). In game the terrain keys `gold` / `gold_2` / `gold_3` already resolve to it (sprites.js TERRAIN_SPRITES), so a k:'arch' part uses `key: 'gold'`.
**Why:** the Hero Plaza mock-up was rendered outside the game from bucket files (my reading, not confirmed: it loaded the old `terrain/gold.png`, the riveted sci-fi panel he banned 09-21 and 11-03).
**How to apply:** never read `gold.png`, `gold_2.png`, `gold_3.png` by file name, in game code or in any mock-up render; mock-ups use `gilt.png`. Do not fake gold with tinted copper/metal. Written in docs/disaster-city/pack-claims.md (PR #1272).
Related [[gold-sheet-out-20261103]] [[disaster-city-shared-pieces-20261113]]
Checked 11-13 19:02 by fetching the sheets (R2 `Assets/world/terrain/`): gold.png = pixel coins + gold bars tile (the banned one); gilt.png = mottled Metal007 gold; with the calm look, key `gold` draws `calm/calm_gilt_1.png` (a darker gilt, avg 153,120,54). Under the city's building tint it can read dull: lift with the arch part's `gain` (about 1.4 to 1.6). Battle-sheet keys in arch parts are swapped for calm sheets (University's finding): prefer urban:, hq: or calm_* keys for coloured roofs.
