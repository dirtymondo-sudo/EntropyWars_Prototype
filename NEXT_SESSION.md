# NEXT_SESSION.md — architecture-work handoff (updated 2026-07-29, session 4)

Read CLAUDE.md FIRST (delivery rules, online-parity rules, no-playtest rule).
This file tracks the ChatGPT architecture-suggestion work specifically: what's
done, what's next, and how to do the next items without re-deriving the plan.
Keep it updated when you finish (or intentionally reject) an item.

## Scoreboard — ChatGPT's 6 suggestions

| # | Suggestion | Status |
|---|-----------|--------|
| 1 | Break up combat monolith (staged extraction) | **Stages 1 + 5 done** — TargetQuery service; seeded engine RNG s3 (combat/status/AI/weather) + s4 (map-gen/towers/hourglasses/FFA-respawns, see below). Stages 2–4 open: pure damage/status fns, command layer, typed event stream. Stage-5 payoff test (same-seed replay ⇒ identical state) still open — needs the stage-2 headless harness |
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

## Priority queue (in order — pick by available effort)

### 1. Determinism payoff test (medium — blocked on the stage-2 harness)
- The PAYOFF test from the original plan is still open: a scripted battle
  replayed twice from the same seed ⇒ identical state. Needs a headless
  engine harness — same blocker as stage 2 below, do them together.
- Campaign/gauntlet enemy gen + `optimizeRandomizeParty` (ranked bot) are
  setup-time: convert only if full-match determinism is wanted there too.

### 2. Pure damage/status resolution + headless tests (large, staged)
Extraction stage 2. The damage pipeline lives in battle.js:
`_applyDamageSpellHit`, `_applyMultiHitDamage`, `_applyRicochetDamage`,
`_applyAoeDamage`, `_applyLineDamage`, `getRangeDamageMult`,
`getStatusDamageTakenMultiplier`, `getHourglassDamageReduction`, plus
status expiry in the turn code. Approach: inside battle.js, refactor the
NUMERIC CORE of each into pure `calcX(attacker, defender, spell, ctx) ->
{dmg, crit, ...}` functions (no state mutation, no VFX, no globals), called
by the existing appliers. Then test headlessly: extend load-data.js's sandbox
pattern to evaluate battle.js far enough to reach the pure functions, or
extract them by source (extractConst-style) — whichever works first. The
seeded RNG is in (session 3), so rolls are already injectable: thread
`engineRng` through ctx rather than calling the global inside pure fns.

### 3. Reproducible-build leftovers (small, mostly user decisions)
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
