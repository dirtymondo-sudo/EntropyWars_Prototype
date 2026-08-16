# Balance Analysis — stats18 (2026-08-16)

Source: `ewbalancestats18.json` — 362 decisive arena matches (0 no-contests),
map rotation, Balance Lab non-mirror, **clean v4.1 AI** (`_meta.aiVersion =
v4.1-2026-08-15`, no old-AI contamination — the ambiguity stats17 warned
about is resolved).

## Headlines

1. **Harbinger (59.8% [55–65]) and Sniper (59.0% [53–65]) are the top jobs**,
   and both are carried by their cheap tools, not their capstones. Lullaby is
   the most-cast spell in the game (1,057 casts, 57.4% fielded WR) at ring 2 /
   50 MP; Kneecap Shot (987 casts, 59.2%) and Camouflage (57.3%) carry Sniper,
   which is ALSO the best secondary at 58.7%. Sniper survived its stats17
   flagging basically unchanged.
2. **Harvester is the worst job on both pillars** (44.0% primary, 44.4%
   secondary — worst of each). Healing Seed 43.6% / Poison Seed 44.1% fielded.
   White Mage 46.0% with Heal All at 41.6% — healing output still isn't
   buying wins.
3. **Race residual outliers (WR minus job expectation):** demon princess
   +16.6 (76.3% raw — CI floor 61%), djinn +14.6, annunaki +13.7, mantid
   +12.9, pirate +10.9, vampire +10.1. Bottom: **yeti −18.4 (28.9% raw,
   worst in the game)**, gnome −14.7, swordfighter −12.9, anubis −10.1.
4. **Requiem still whiffs 77%** (92 casts, 71 whiffs, 3 kills) despite the
   v4 barrage scorer being "engine-true". Photon Scatter (85%), Toxic Nova,
   Quake and Space Disco show the same signature — the whole `kind:'barrage'`
   family whiffs when AI-cast, so this is an AI↔engine targeting divergence,
   not a Requiem data problem alone. (Root-cause investigation: see
   "Requiem / barrage whiff" below.)
5. **Deep beats wide in the tree.** Archetype 4-2-0 (deep primary, no
   secondary) is the best performer at 53.4%; shape R4·P0·S2 posts 63.0%
   (n=108, CI floor 53.6%). A race-pillar capstone wins 53.7% vs 49.2% with
   no capstone; secondary-pillar capstones don't pay (48.8%).
6. **First-kill win rate 68%, comeback rate 13.5%** at 16.2 avg rounds —
   arena is snowbally. Systemic lever, not a spell tweak.
7. **AI kit-usage blind spots distort race balance.** Discordance was fielded
   in 564 games but cast TWICE; Encore once (yet 59.5% fielded — pure pick
   correlation). Yeti's whole kit: Frozen Punch 8 casts / Ice Slide 17 /
   Permafrost 1 / Avalanche Strike 0 in ~45 games. Races whose spells the AI
   won't cast bleed win rate through dead slots.

## Actions taken (2026-08-16, this pass)

- **Lullaby → ring 3** (75 MP, tier II); **Encore → ring 2** (50 MP, tier I).
  `CLASS_SPELL_LEARN_ORDER` swap — tree-position pricing does the rest.
- **Demon princess: Kiss of Decay ↔ Poison Swamp ring swap.** Kiss of Decay
  (top-10 dmg/MP at 25 MP + drain + poison rider) now sits at ring 3 / 75 MP;
  Poison Swamp opens the pillar (already ring-1-priced via reptilian).
- **Yeti kit rescue** (28.9% WR was kit-driven, not stats — its base stats
  match minotaur's, which wins 56%):
  - **Avalanche Strike** had ZERO casts: `kind:'leapStrike'` requires standing
    strictly above the target (AI and engine both gate), i.e. dead on flat
    maps. Reworked into a `_mkCharge` melee charge (180 dmg, range 3,
    applies Frozen 1t, 1.5× vs Frozen) so the capstone exists and feeds
    Frozen Punch's rider.
  - **Permafrost** (1 cast ever): the AI's terrainCreate scorer only values
    raw dmg — 40 dmg looked worthless at 75 MP + 2 AP. Damage 40 → 120.
  - **Ice Slide**: ~2 dmg/MP at its ring-2 price. 100/50 → 140/70.

## Requiem / barrage whiff — VERDICT (2026-08-16)

stats17 predicted v4's engine-true barrage scorer would kill this class
("expected whiff ≈ 0"); stats18 (aiVersion v4.1) still shows Requiem at 77%
whiff, Photon Scatter 85%. Investigation result:

1. **The repo code cannot produce these whiffs.** The AI victim filter
   (ai.js `kind === 'barrage'`) and the engine's `_barrageTargets` were
   audited term-by-term (combatReach inputs, LOS helper + srcZ default,
   radius vs effective-range fallback, protection, fog) — the AI's victim
   set is a strict SUBSET of the engine's on identical state, so an
   AI-approved cast can't come up empty.
2. **Live reproduction attempt: zero whiffs.** An instrumented headless
   balance-sim (every unit force-fed Requiem + Photon Scatter, MP topped
   up — 9 barrage casts across 5 rounds of AI-vs-AI play) recorded
   9 hits / 0 whiffs against the current repo ai.js + battle.js.
3. **Conclusion: the stats18 lab almost certainly ran against a STALE
   battle.js on R2** — an engine whose barrage handler predates the shared
   `_barrageTargets` filter, while ai.js (which stamps `_meta.aiVersion`)
   WAS current. The whiff signature is exactly "new AI mirror vs old engine
   semantics". **Action: redeploy the full R2 script set with a cache-bust
   and re-run the lab; Requiem's whiff column is expected to collapse to
   ~0.**
4. Defensive normalization shipped anyway: Requiem's def was the only
   barrage using the range-fallback path — it now carries
   `aoeOriginSelf: true, aoeRadius: 4, range: 0` like the rest of the
   family, and was dropped from battle.js's CINE_GUN_SPELLS aim-cam list
   (it's a sonic nova, not a gun).

## Deferred (flagged, not yet changed)

- Fallen Grace: 21.7 dmg/MP (542/cast at 25 MP) — top damage outlier in the
  game; fallen angel's residual is modest, but the spell is out of band.
- Kneecap Shot / Camouflage (Sniper), second lab run in a row on top.
- Harvester seeds + White Mage heal numbers (worst jobs, both pillars).
- Wall of Fire: 1.34 dmg/MP, 0.4 targets/cast — enemies walk around it.
- 100 MP capstone tier is systematically MP-inefficient (~3–4.5 dmg/MP vs
  ~12 for ring 1): Take Aim 3.37, Rampage 2.63, Dead Eye, Mind Shatter,
  Meteor all deliver ≤450 dmg for 100 MP.
- First-kill snowball (68%) — needs a systemic catch-up lever if addressed.
