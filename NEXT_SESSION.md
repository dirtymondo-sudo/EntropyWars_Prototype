# NEXT_SESSION.md — architecture-work handoff (updated 2026-07-29, session 6)

Read CLAUDE.md FIRST (delivery rules, online-parity rules, no-playtest rule).
This file tracks the ChatGPT architecture-suggestion work specifically: what's
done, what's next, and how to do the next items without re-deriving the plan.
Keep it updated when you finish (or intentionally reject) an item.

## Scoreboard — ChatGPT's 6 suggestions

| # | Suggestion | Status |
|---|-----------|--------|
| 1 | Break up combat monolith (staged extraction) | **Stages 1 + 2 + 5 done (s6 finished stage 2, see below)** — TargetQuery service; seeded engine RNG s3 (combat/status/AI/weather) + s4 (map-gen/towers/hourglasses/FFA-respawns); s5+s6: pure `calc*` damage-math layer in battle.js (shared chokepoint + all per-resolver cores + status-duration tick) + `damage.test.js`. Stages 3–4 (command layer, typed event stream) open. Stage-5 payoff test (same-seed replay ⇒ identical state) still open |
| 2 | Canonical data (client/server) | **Done 2026-07-29** — server derives ACCT_*/starters/races from data.js at boot (`ECON` object, see below); literals kept as fallback + parity source; `npm run test:parity` still guards the fallback |
| 3 | Fast tests + CI | **Done 2026-07-29** — `npm test` (syntax, content schemas, parity, migrations, server smoke), `.github/workflows/ci.yml` |
| 4 | Reproducible builds / deploy | **Mostly done** — `npm run deploy` (upload + auto cache-bust). Open: lockfile decision, vendored CDN deps |
| 5 | Online hardening (near-term list) | **Fully done 2026-07-29** — hashed tokens, HTTP rate limits, `migrations/` dir, origin allowlist (+ boot log), guest state checksums + log-only anomaly detection |
| 6 | Server-side simulation for ranked | **Deliberately deferred** — rewrite-scale; don't start until cheating is an observed problem. Seeded RNG (item 1 below) is the prerequisite either way |

## Verified this session (2026-07-29, session 2)

- Step 0 from the previous handoff PASSED: the repo has `migrations/001–003`
  and server.js contains `runMigrations` / `findPlayerByToken` /
  `httpRateLimit` — the user synced the 2026-07-29 hardening delivery.
  STILL ASK the user (if not yet confirmed): was Render redeployed, and is
  `EW_ALLOWED_ORIGINS` set on Render? (Supported but off until the env var
  is set.)
- Item "server derives economy from data.js at boot" SHIPPED: server.js now
  builds an `ECON` object from the hand-synced literals, then overrides it at
  boot from `require('./load-data').loadGameData()` (type-validated per key;
  loud `[ECON]` console lines either way; literals remain the fallback if the
  vm load throws). All runtime reads go through `ECON.*`. The literal
  `const ACCT_* / AVAILABLE_RACES` declarations MUST stay as plain
  `const NAME = <literal>` — check-data-parity.js extracts them from source
  text. Verified: `npm test` 13/13 (incl. server-boot smoke), real boot logs
  `[ECON] economy derived from data.js (68 starters, 96 races, unit price
  5000)`, simulated load failure logs the fallback line and boots fine.

## Shipped 2026-07-29 (session 2): guest state checksum + anomaly detection

Implementation notes (for future debugging — the design shipped as planned):
- online.js `_ewStateChecksum(st)` (exposed as `window._ewStateChecksum`):
  FNV-1a over unit id/player/x/y/z/hp/mp/ap/dead + round/activePlayer/
  matchKills. All hashed fields ride state-sync verbatim, so host and guest
  hash identical values. Returns null when st/units absent (setup screens).
- HOST stamps `s._csumSeq` (counter) + `s._csum` in `_broadcastState`,
  AFTER the lastSyncJson dedup compare — the ever-changing seq inside the
  dedup JSON would otherwise defeat the dedup entirely. Don't move it.
- GUEST reports at the END of `_applyRemoteState` (nothing after
  `_deserializeInto` touches a hashed field), throttled to 1 per 1.5s:
  `relay {type:'state-checksum', seq, round, csum}`. Replay player never
  emits (NET.online false). `_ewApplyRelay` drops the type early in case a
  pre-upgrade server forwards it.
- SERVER (server.js): state-sync handler stores seq→hash in `room._csums`
  (64-entry window, oldest evicted) and STRIPS `_csum` before forwarding so
  the guest can't just echo it. Relay handler intercepts 'state-checksum'
  (guest-only, never forwarded); mismatch ⇒ `[GUARD]` console warn +
  replay `{e:'anomaly', kind:'state-checksum', seq, round, host, guest,
  count}`. LOG-ONLY by design — check Render logs / replays for real-match
  false positives BEFORE ever escalating to forfeits.
- Also added: `[BOOT]` line logging the socket origin allowlist state, so
  whether EW_ALLOWED_ORIGINS is live on Render is visible in boot logs.

## Shipped 2026-07-29 (session 3): seeded engine RNG (extraction stage 5, core)

Implementation (files: state.js, battle.js, ai.js, rng.test.js, index.html bump):
- state.js (top of file, after `randInt`): `_ewRngNext(s)` — PURE mulberry32
  step, uint32-in/`{s, v}`-out, deliberately dependency-free because
  rng.test.js extracts it by source text and diffs it against an independent
  reference implementation. `engineRng()` advances `state.rngState` through
  it; `engineRandInt(n)`; `seedEngineRng(seed)` sets rngSeed+rngState and
  logs `[RNG] engine seeded:`. Unseeded call ⇒ lazy self-seed (setup
  screens, pre-upgrade snapshots) — never throws.
- The ENTIRE PRNG state is one uint32 (`state.rngState`), so it rides
  state-sync + replays with no serializer work. rng.test.js asserts
  rngSeed/rngState are NOT on `_serializeState`'s skip list, and that BOTH
  battle boot paths seed: `startMatch()` AND `continueToNextMatch()` (the
  rematch path bypasses startMatch — easy to miss, now test-guarded).
- Exposed on `window.GAME` (`engineRng, engineRandInt, seedEngineRng`) —
  ai.js uses `g.engineRng()`; engine code in state/battle.js calls the bare
  globals (classic-script top-level fns are global). NOTE: the bare name
  `rng` was NOT used — battle.js has local `const rng` vars that would
  shadow it (e.g. _applyAoeDamage).
- CONVERTED (engine stream): battle.js — rollStatusApply, retreat
  opportunity-strike, burning spread, computeSpellBase + _applyAoeDamage
  variance, status resist, rollCrit/rollEvasion/rollCounter, counter dmg,
  turret/blast/entropy-strike/flood variance, blind miss, warp-rune dest,
  spell-steal + Tarot Draw picks, roaming-nexus spawn, startingPlayer coin
  flips, zodiacOffset, rubble variants, mat-drop scatter shuffle, simul-AI +
  secondary-job jitter. state.js — blitz turn-order shuffle, sky events,
  ALL weather (spawn/type/duration/tiles/direction/drift/damage callbacks).
  ai.js — softmax pick + fallback move/inspect picks.
- LEFT on Math.random/randInt ON PURPOSE (don't "fix"): all VFX/particle/
  audio/camera jitter, loading screen, podium; setup-time party/identity/
  loadout generation (incl. campaign+gauntlet enemy gen); Mystery Dungeon
  rolls (local-only, has its own seed field); realtime bot brawl (timer-
  driven, inherently non-deterministic); A/B training shuffles; bot Elo.
- `npm test` 17/17 (rng.test.js adds 4).

## Shipped 2026-07-29 (session 4): map-gen + objective rolls on the seeded stream

Files: map.js, battle.js, rng.test.js, index.html bump (→ 20260729g-cors).
- map.js CONVERTED to engineRng/engineRandInt: placeTowers gender flip,
  generateBelowTerrain mushroom/obsidian scatter, generateAboveTerrain
  cloud_thick scatter, _initTowersFromObjects + _autoPlaceTowersIfNeeded +
  huge-mode tower genders (tower gender is match state — rides state-sync),
  generateHugeMap lava/obsidian rolls, generateTerrainBoard forest/desert
  frontier growth, and processRespawns' FFA respawn-tile pick (a MID-BATTLE
  engine roll that s3 missed — it lives in map.js, not battle.js).
- battle.js CONVERTED: hourglass placement shuffles in
  randomizeSharedObjectives (both center pool + fallback) and the mid-battle
  spawnPeriodicHourglasses center-pool shuffle. All three were
  `sort(() => Math.random() - 0.5)` → `sort(() => engineRng() - 0.5)`
  (matches the existing mat-drop scatter convention from s3).
- LEFT on Math.random ON PURPOSE: map.js's local cosmetic `randInt` helper
  (line ~2453 — it SHADOWS state.js's identical global, map.js loads later;
  harmless, both are Math.random wrappers for cosmetic use) and the whole
  `_me*` map-editor biome generator (authoring tool, not battle state).
  Hidden items turned out VESTIGIAL: `_spawnHiddenItemsOnly` is an empty
  stub and nothing ever pushes to state.hiddenItems — no rolls to convert.
- Call-order verified: both boot paths seed before
  prepareBattleStateFromCurrentBuilds (battle.js seeds at ~25794/27553,
  prepare at ~25834/27608 → generateTerrainBoard/initMap inside it), and
  randomizeSharedObjectives runs after. processRespawns /
  spawnPeriodicHourglasses are mid-battle (host-side) — post-seed by nature.
- rng.test.js: new guard test extracts the 9 converted functions by source
  (balanced braces) and fails if Math.random/bare randInt( reappears in any
  of them. `npm test` 18/18 (17 pass + server-smoke skip w/o node_modules).

## Shipped 2026-07-29 (session 5): pure damage math core (extraction stage 2, core)

Files: battle.js (R2 — token bumped → 20260729h-cors), damage.test.js (new
repo-root test, auto-picked-up by `npm test`'s `*.test.js` glob).
- battle.js now has a **PURE DAMAGE MATH** block (right after
  `SPELL_DMG_VARIANCE`, ~line 157): 6 dependency-free functions —
  `calcRangeMult`, `calcSpellBase`, `calcStatusApplyChance`,
  `calcCounterChance`, `calcElementComboMult`, `calcDamageResolution`.
  CONTRACT (documented in the block header): args in, value out; no
  globals/state/window/RNG/logging — damage.test.js extracts them by
  balanced braces and EVALUATES them, so referencing any outer name breaks
  the suite (test 1 also greps for banned names). Tuning constants are
  passed in by wrappers, never read inside.
- Rewired wrappers (behavior-identical, verified stage-by-stage against the
  old inline code): `getRangeDamageMult`, `computeSpellBase` (draws
  engineRng ONLY when variance>0 — same stream discipline as before),
  `rollStatusApply`, `getCounterChance`, and `applyDamageToUnit`, whose
  cap→marked→level-scale→armor/soaks→status-mults→shield tail now runs
  through ONE `calcDamageResolution` call (side effects — marked consume,
  shield log/float — stay in the wrapper). Elemental combos resolve via
  `calcElementComboMult` returning a `note` key that drives the callouts.
- PARITY QUIRKS deliberately preserved (and pinned by tests — don't "fix"):
  the ranged-taken stage floors a 0-damage physical enemy hit to 1; each
  armor/soak stage floors at 1 independently; sub-×1 offensive products are
  uncapped; marked adds AFTER the cap, BEFORE level scaling.
- damage.test.js (14 tests): purity grep, wrapper-delegation guards,
  numeric-constant pins (sweet spot 3, ±10%/±20%, sniper 0.6→1.2, cap ×3,
  variance 8), full curve/table/stage-order coverage. Its `extractFnSource`
  skips the PARAM LIST before brace-matching (an `opts = {}` default param
  broke the naive rng.test.js version — reuse damage.test.js's copy for any
  future extraction). `npm test`: 32 tests, 31 pass + server-smoke skip.

## Shipped 2026-07-29 (session 6): per-resolver cores + status tick (stage 2 done)

Files: battle.js (R2 — token bumped → 20260729i-cors), damage.test.js.
- 8 new pure functions in the PURE DAMAGE MATH block (same contract, right
  after `calcDamageResolution`): `calcFlatSpellDamage` (base+power+floor —
  chain hops floor 16, beams 32, ricochet 0), `calcChainTargets` (chain-hop
  selection: lowest-HP living candidate within chainRadius, no revisits,
  profile-length cap), `calcSpellHitRiders` (single-hit rider stack: Time
  Rewind echo replaces-when-strictly-bigger capped 500 → acted/unholy flat
  adds → water ×1.5 floor → sneak ×1.5 floor; returns `{dmg, echoed,
  echoDmg}` — echoDmg is the pre-rider value the callout prints),
  `calcMultiHitDamage` (per-hit base + floor(spellPower/hitCount) + marked
  hit-2 rider), `calcBounceTarget` (ricochet bounce: lowest-HP in
  bounceRadius, excludes first victim), `calcAoeVariance` (noRandom → 0,
  rngRange → floor(half), else SPELL_DMG_VARIANCE) + `calcAoeHitDamage`
  (variance roll → water mult → min floor; rand passed in, unused at
  variance 0 — stream discipline), `calcStatusDurationTick` (end-of-round
  decrement/expiry split; input never mutated).
- Rewired wrappers (behavior-identical): `_applyDamageSpellHit` (both chain
  + single-hit paths; conditions/logs/VFX stay in the wrapper),
  `_applyMultiHitDamage`, `_applyRicochetDamage` (primary + bounce),
  `_applyAoeDamage` (engineRng drawn ONLY when variance > 0, as before),
  `_applyLineDamage`, `_tickAllStatusDurations` (unknown STATUS_DEFS keys
  still deliberately untouched; clearStatus + wore-off logs in the wrapper).
- damage.test.js: purity + delegation guards extended to all 14 calc* fns
  and the 6 wrappers, plus numeric pins for each new core (chain/bounce
  selection order & purity, echo cap/tie semantics, rider stage order,
  AoE variance window, status-tick non-mutation). `npm test`: 41 tests,
  40 pass + server-smoke skip.
- NOT extracted on purpose: the DoT magnitude curves (burn
  `min(200, 32+stacks*32)`, drowning `min(160, 24+stacks*24)`, poison 32,
  regen 40) live in data.js STATUS_DEFS onRoundEnd handlers, not battle.js —
  extracting them means a data.js pure block + test extraction from data.js.
  Fine to do later if wanted, but it's a different file's contract; the
  handlers already route through applyDamageToUnit (which is core-backed).

## Priority queue (in order — pick by available effort)

### 1. Determinism payoff test (medium-large)
The PAYOFF test from the original plan: a scripted battle replayed twice
from the same seed ⇒ identical state. Needs a headless engine harness —
evaluate state.js+battle.js in a load-data-style vm sandbox with enough DOM
stubbed, or drive via playtest.js/Playwright (user-approved only). The calc*
layer shrinks what the harness must stub, but the applier shell (VFX, timers,
camera) is still interleaved — stage-3 (command layer) would shrink it more.
- Campaign/gauntlet enemy gen + `optimizeRandomizeParty` (ranked bot) are
  setup-time: convert only if full-match determinism is wanted there too.

### 2. Reproducible-build leftovers (small, mostly user decisions)
- package-lock.json is currently gitignored (CLAUDE.md convention) — ask the
  user before changing that; committing it is ChatGPT's recommendation and is
  probably right now that CI exists (CI would then use `npm ci`).
- Local React bundles / THREE.MeshLine.js load from CDN/R2 without version
  pins in package.json — document exact versions in a BUILD_MANIFEST section
  here or in CLAUDE.md rather than fighting the no-new-files rule.
- Meaningful commit messages / tags are a user habit, not a code change —
  mention once, don't nag.

## Standing constraints (don't re-learn these the hard way)
- Push access varies by session environment: some 403 on git push AND the
  GitHub API/MCP; some (Claude Code on the web with a designated branch) can
  push. Try ONCE; on 403 fall back immediately to complete files via chat
  (SendUserFile) — user uploads/syncs manually or runs `npm run deploy`.
- ANY R2-hosted file (all game .js/.css) delivered ⇒ bump `?v=` in index.html
  and deliver index.html in the SAME message (RULE #1b). server.js/index.html
  are Render-served — no bump needed for server.js-only changes.
- No new GAME .js files ever (fixed R2 upload set). Repo-root tooling/tests/
  migrations/docs are fine.
- Every gameplay/visual change: answer "what does the GUEST see?" (RULE #2).
- Don't playtest unless explicitly asked. Don't delete load-bearing comments.
- ANY edit near ACCT_*/starters/races in data.js or server.js ⇒ run
  `npm run test:parity`. The server RUNTIME now derives from data.js, but the
  server literals are still the boot-failure fallback AND what the parity
  tool extracts — keep them synced and keep them as `const NAME = <literal>`.
