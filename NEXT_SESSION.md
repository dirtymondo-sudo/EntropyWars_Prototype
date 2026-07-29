# NEXT_SESSION.md — architecture-work handoff (updated 2026-07-29, session 2)

Read CLAUDE.md FIRST (delivery rules, online-parity rules, no-playtest rule).
This file tracks the ChatGPT architecture-suggestion work specifically: what's
done, what's next, and how to do the next items without re-deriving the plan.
Keep it updated when you finish (or intentionally reject) an item.

## Scoreboard — ChatGPT's 6 suggestions

| # | Suggestion | Status |
|---|-----------|--------|
| 1 | Break up combat monolith (staged extraction) | **Stage 1 done** (TargetQuery/action-validity service). Stages 2–5 open: pure damage/status fns, command layer, typed event stream, seeded RNG |
| 2 | Canonical data (client/server) | **Done 2026-07-29** — server derives ACCT_*/starters/races from data.js at boot (`ECON` object, see below); literals kept as fallback + parity source; `npm run test:parity` still guards the fallback |
| 3 | Fast tests + CI | **Done 2026-07-29** — `npm test` (syntax, content schemas, parity, migrations, server smoke), `.github/workflows/ci.yml` |
| 4 | Reproducible builds / deploy | **Mostly done** — `npm run deploy` (upload + auto cache-bust). Open: lockfile decision, vendored CDN deps |
| 5 | Online hardening (near-term list) | **Done 2026-07-29** — hashed tokens, HTTP rate limits, `migrations/` dir, origin allowlist supported. Open: guest checksums + anomaly detection (item 1 below) |
| 6 | Server-side simulation for ranked | **Deliberately deferred** — rewrite-scale; don't start until cheating is an observed problem. Seeded RNG (item 2 below) is the prerequisite either way |

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

## Priority queue (in order — pick by available effort)

### 1. Guest state checksum + anomaly detection (medium, client+server)
Completes suggestion #5's near-term list. Design:
- Host already streams `state-sync`; the GUEST computes a cheap checksum of
  gameplay-relevant fields after applying each sync (unit hp/xy/z/mp/ap,
  round, activePlayer, matchKills — skip UI/fog/guest-local keys, reuse
  `_serializeState`'s skip list knowledge in online.js) and emits
  `relay {type:'state-checksum', round, hash}` (guests may only relay — never
  a new server event type that breaks direction enforcement).
- server.js: compare guest hash vs a hash the HOST also attaches to each sync
  (cheapest: host stamps `data._csum`, server compares guest's report).
  Mismatch ⇒ `replayWrite(room, {e:'anomaly', ...})` + console [GUARD] log.
  LOG ONLY at first — no forfeits until false-positive rate is known.
- Touches online.js (R2!) ⇒ RULE #1b: deliver online.js AND a `?v=`-bumped
  index.html in the same message. server.js too (chat delivery, Render).

### 2. Seeded RNG for engine rolls (large, battle.js/state.js, staged)
Extraction stage 5; prerequisite for replay verification and any future
server-side/deterministic ranked (suggestion #6). battle.js has ~98
`Math.random()` sites, state.js ~15, ai.js 3 — but only ENGINE-affecting rolls
(damage variance, crits, dodge, AI tie-breaks, spawn/loot rolls) need seeding;
cosmetic rolls (VFX jitter, sfx pitch, camera shake) must STAY on Math.random
so the stream isn't polluted by presentation. Plan:
- Add a tiny PRNG (mulberry32) + `state.rngSeed` + `GAME.rng()` in state.js
  (no new files — RULE #1). Host seeds at battle start; seed rides state-sync
  to the guest automatically (verify it isn't on `_serializeState`'s skip list).
- Convert call sites INCREMENTALLY, engine paths first (grep damage/crit/
  dodge/AI sections); each converted batch = still-passing `npm test` +
  syntax check. Do NOT bulk sed 98 sites in one pass.
- Payoff test: a scripted battle replayed twice from the same seed produces
  identical state (deterministic-scenario test, suggestion #3's last gap).

### 3. Pure damage/status resolution + headless tests (large, staged)
Extraction stage 2. The damage pipeline lives in battle.js:
`_applyDamageSpellHit`, `_applyMultiHitDamage`, `_applyRicochetDamage`,
`_applyAoeDamage`, `_applyLineDamage`, `getRangeDamageMult`,
`getStatusDamageTakenMultiplier`, `getHourglassDamageReduction`, plus
status expiry in the turn code. Approach: inside battle.js, refactor the
NUMERIC CORE of each into pure `calcX(attacker, defender, spell, ctx) ->
{dmg, crit, ...}` functions (no state mutation, no VFX, no globals), called
by the existing appliers. Then test headlessly: extend load-data.js's sandbox
pattern to evaluate battle.js far enough to reach the pure functions, or
extract them by source (extractConst-style) — whichever works first. Best
done AFTER #2 so rolls are injectable (pass rng into ctx).

### 4. Reproducible-build leftovers (small, mostly user decisions)
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
