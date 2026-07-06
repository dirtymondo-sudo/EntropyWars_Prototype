# Entropy Wars — Production Readiness Roadmap

Handoff document for the next working session (written 2026-07-05 after a full-codebase
audit: rendering pipeline, boot/asset flow, profile/achievements/economy, maps/modes/
matchmaking, plus an instrumented in-match probe). Read `CLAUDE.md` first for the
delivery workflow rules and `PLAYTEST_NOTES.md` for gameplay/engine memory. Everything
below cites `file:line` anchors that were verified against the current code.

**How to use this doc:** each section is independent. Sections 2–4 are engineering
(infrastructure, loading, performance); 5–8 are product (competitive integrity,
achievements, ranked maps, retention). §11 lists what was already changed this session
so nothing is redone. §12 is a suggested execution order.

---

## 1. Executive summary

**What's already strong** (more than a prototype):
- 7 game modes with real rules/win conditions (`MULTIPLAYER_MODES` state.js:645-780),
  ~56 named hand-authored maps (`GAME_MODES` state.js:7+, `PREBUILT_MAPS` data.js:8408+),
  ~94 races, a map editor with community-map uploads, campaign dialogue system.
- Working ELO matchmaking with widening skill windows (server.js:313-420), D1-backed
  accounts/leaderboard, 90-second reconnect windows with rejoin tokens (server.js:1509-1596),
  queue filler bots (bots.js).
- A working (local-only) achievement system: 14 defs + toasts + profile tab + victory
  screen grid (battle.js:4942-5059, profile.js:1061-1097).
- A shipped unit-unlock economy: gold, shop, server-side purchase with double-spend
  guards (server.js:644-700), match-end banking with itemized victory-screen breakdown.
- Turn shot clock + match clock exist (battle.js:26000-26100); no-contest voiding for
  stalled matches; replay logging server-side.

**The five blockers between this and "professional":**
1. **Delivery pipeline** — the game ships ~6 MB of uncompressed JS from a rate-limited
   R2 *dev* URL with zero cache headers and zero versioning (§2). This is the single
   biggest win available and requires almost no code changes.
2. **Trust model** — match results, gold, and achievements are all client-reported;
   accounts are token-only with no recovery (§5). Fine for friends, fatal for real ranked.
3. **Loading & first impression** — fixed fake load bar this session (§11), but match
   start still pops units from 2D→3D mid-match, and boot is ~40 render-blocking requests (§3).
4. **Frame-rate ceiling** — no instancing/batching: an 8×8 match carries ~1,800 scene
   objects and 2,016 unique materials (measured, §4), a 2048² soft-shadow pass re-renders
   every frame, and post-processing runs ~15 full-screen passes.
5. **Retention loop** — economy exists but there's no daily/weekly cadence, no
   progression visibility ("next unlock"), no onboarding tutorial (§8).

---

## 2. Delivery & infrastructure (do this first — biggest wins, least risk)

### Current state (verified)
- **Render** runs `server.js` (Express + socket.io) and serves `index.html` statically
  (server.js:22-25). Everything else loads from the **public R2 dev bucket**
  `pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev` + CDNs (index.html:892+).
- Verified by direct curl of `battle.js` on the dev bucket: **1,356,685 raw bytes, no
  `Cache-Control` header, no gzip/brotli, Content-Type `application/x-javascript`**.
  Every new player downloads ~6 MB of uncompressed JS; the dev endpoint is also
  rate-limited (documented throttling pain in PLAYTEST_NOTES.md "R2 throttling").
- ~40 render-blocking requests before first paint: 5 CSS files + three.js r128 + 11
  jsdelivr addons in `<head>`, then ~24 R2 game modules at body end. Not a single
  `defer`/`async` in the file.
- **Two full three.js copies load**: r128 globally (game) + 0.160 as ES modules for the
  two decorative menu/sky backgrounds (importmap at index.html:75-82).
- **No versioning**: bare URLs, so browsers heuristically cache against `Last-Modified`
  → after an R2 upload, players can run **mixed old/new file versions** until caches
  expire. There is no way to force-invalidate.
- **Repo/bucket drift**: several live files exist *only* in the bucket, not in git:
  `third-person.js`, `campaign-dialogue.js`, `styles-animations.css`, `styles-editor.css`,
  `THREE.MeshLine.js`, the React bundles. If the bucket is lost or a bad upload happens,
  these are unrecoverable and no session can review them.
- **No D1 schema in repo** — `players`/`matches`/`community_maps`/`map_ratings` exist
  only in the live database; `unitunlockeconomy.md:116` references a `d1-schema.sql`
  that doesn't exist.

### Plan (ordered by value/effort)
1. **Put a custom domain in front of the R2 bucket** (Cloudflare dashboard: R2 → bucket
   → Settings → Custom Domains; needs any CF-managed zone). This alone turns on brotli
   compression, edge caching, and real cache headers — the ~6 MB JS payload becomes
   roughly 1–1.5 MB over the wire and stops being throttled. **Zero code changes except
   swapping the hostname in index.html** (one search/replace of
   `pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev`). Do this before anything else.
2. **Versioned deploys.** Add `?v=<build>` to every R2 URL in index.html (they're all
   in one file — index.html is served by Render, so bumping one string per deploy is
   the whole process). With the custom domain set `Cache-Control: public, max-age=31536000, immutable`
   on the bucket and let `?v=` do invalidation. This kills the mixed-version failure mode.
3. **Pull the bucket-only files into the repo** and add `d1-schema.sql` (dump the live
   schema once). The repo must be the source of truth; today it isn't.
4. **A deploy script instead of manual uploads.** One `deploy.sh` using `wrangler r2 object put`
   (or rclone) that uploads changed files + bumps `?v=` in index.html. This also unlocks
   an optional minify step later (`esbuild file.js --minify` per file — no bundling, no
   module changes, keeps the "edit files in place" workflow; ~60-70% size cut before brotli).
5. **Single three.js.** Either port the two background shaders to r128 (they use basic
   materials + EffectComposer, both exist in r128) or lazy-load the 0.160 modules after
   ENTER. Also consider upgrading the game to a modern three.js eventually (r128 is
   April 2021; the `examples/js` global-script path was removed after r147, which is why
   the addons pin to 0.128 on jsdelivr) — but this is a large, risky migration; don't do
   it casually and don't block anything else on it.
6. **Render cold starts.** If the service is on a free/hobby tier it spins down and the
   first visitor eats a 30-60s cold start plus socket reconnect churn. Either upgrade
   the tier, add an external keepalive ping, or (cleaner) move static hosting to
   Cloudflare Pages and keep Render only for the socket relay. Longer-term the relay
   could become a Cloudflare Durable Object, collapsing the stack to one vendor — but
   that's a rewrite of server.js; treat as future work.
7. **Self-host the Google fonts + socket.io client on the same custom domain** — removes
   two third-party origins from the critical path (fonts.googleapis.com blocked = boot
   failure noise today; it's in the failure telemetry now).
8. **Later: a service worker** for offline-ish boot and instant repeat loads. Only after
   versioning exists (a SW without cache-busting discipline makes stale-code bugs worse).

---

## 3. Boot & loading experience

### Current state
- Title screen exists with a loading bar; **this session made the bar real** (it was a
  fixed 3s CSS animation) and added a boot failure overlay + watchdog (§11). The ENTER
  button arms only when `window._gameReady` flips (set at the end of ui.js init, ui.js:8567).
- Measured cold boot to interactive: **~13.5s with all assets served from a local disk
  cache** — i.e. that's parse/init time alone on a fast machine; real-network first
  boots are worse. Post-§2 (compressed, cached) plus a minify pass is how this drops.
- **Match start pops units from 2D sprites to 3D models.** `startMatch` (battle.js:14987)
  runs a fixed ~3,050 ms VS splash (battle.js:14783-14985) that does NOT preload
  anything; rigged GLBs (~6 files per race: model + idle/walk/cast/death clips,
  sprites.js:502-538) start loading only when `renderBoard` builds units
  (three-renderer.js:5541-5544 builds a flat placeholder and swaps "the moment the GLB
  arrives"). First battle music also streams on first play (`preload='none'`, audio.js:77).

### Plan
1. **Per-match model preload gate** (the highest-value loading fix): between
   `prepareBattleStateFromCurrentBuilds()` (battle.js:15031) and the splash, walk
   `state.units` → `RACE_MODELS_3D` (sprites.js:502) and fire the existing `_loadUnitGLB`
   (three-renderer.js:5560) for each model+clip; resolve when all are ready. Drive the
   VS-splash dismissal (timer at battle.js:14920-14984) off `Promise.race([allLoaded, maxTimeout])`
   instead of a fixed 3,050 ms — the existing cinematic becomes a real loading cover.
   Add a thin progress strip to the splash. (This changes what the player sees only in
   that units no longer pop in — confirm with the user before shipping since it alters
   perceived match-start timing.)
2. **Preload the chosen battle track** during the splash (flip that track's
   `preload` to `'auto'` when `state.currentBattleTrackKey` is set at battle.js:15025).
3. **Online match loading handshake:** both clients report "assets ready" before round 1
   starts (piggyback on the existing `state-sync`/`friendly-config` relay) so a slow
   opponent doesn't act while your board is still assembling.
4. **Defer the head 3D stack** (index.html:52-72: three.js r128 + 11 addons) — nothing
   on the title screen needs it. Load it after first paint (dynamic script chain or
   `defer` preserving order) so the title shows in ~1s on cold cache instead of after
   the full head resolves.
5. Boot failure overlay/watchdog: done this session (§11). Extend later with a retry-
   single-file path (re-inject failed script) instead of full reload.

---

## 4. Frame rate & draw calls

### Measured baseline (instrumented probe, 8×8 TDM, 8 units, this session)
- Scene census mid-match: **1,089 meshes + 684 sprites + 10 points; 752 visible
  drawables; 467 unique geometries; 2,016 unique materials; 11 lights.** DOM: 17,464
  body nodes, 212 CSS2D nameplate nodes. (Software-GL in the container, so FPS numbers
  aren't representative — the object/material counts are the signal. A future session
  can read live counts via `ThreeRenderer._renderer.info` — getter added this session.)

### What's already good (don't redo)
- Battle render loop fully stops in menus (`deactivate` three-renderer.js:13533);
  both menu backgrounds pause when hidden (index.html light-trails checks overlay
  visibility; sky shader early-returns when its backdrop has no size).
- **All post passes already self-disable when inert**: bloom (`enabled = strength>0`,
  three-post.js:1252-1266), DoF (`_applyDofUniforms` three-post.js:706-717), CRT/vignette
  (`_applyCinematicUniforms` three-post.js:1388-1399, defaults off), retro (gated).
  An earlier sub-audit claimed otherwise — it was wrong; verified in code.
- Base particle system is pooled (512 sprites / 256 quads, three-vfx.js:640-718).
- Geometry/material caches for flat tiles exist (`_boxGeoCache` three-renderer.js:1216,
  `_terrainMatCache` :1237); highlights use shared geo/mat; incremental rebuilds are
  gated by change-detection serials.
- Pause menu already has: shadow off/low/high, pixel-ratio Fast/Native, bloom/DoF
  sliders, FXAA/filmic/CRT toggles (ui.js:6434-6468).

### ⚠ Caveats discovered — read before optimizing shadows or adding a "skip render" gate
- **GLB units idle-animate continuously and cast shadows** (`n.castShadow = true`
  three-renderer.js:5707), and **the sun position/color eases every frame**
  (`syncLighting` three-post.js:541-559). A naive `shadow.autoUpdate = false` freezes
  shadows visibly. Correct form: re-render the shadow map when (any rebuild serial
  changed) OR (`hasActiveAnims()`) OR (any 3D-model unit is on the board) OR (sun moved
  beyond epsilon). On sprite-only boards this eliminates the whole depth pass most
  frames; with 3D units prefer halving shadow cadence or PCF instead.
- **Many materials animate time uniforms** (god rays three-renderer.js:13410-13425,
  water, dust motes, fireflies, nexus shaders) — the scene is never truly static, so a
  whole-frame "nothing changed, skip render" gate (the `renderIfDirty` stub referenced
  at three-renderer.js:14705 but never defined) would freeze ambient motion. Don't
  build it; spend the effort on the items below.

### Ranked optimizations (impact × effort, no visual change unless noted)
1. **Merge/instance static terrain** — every tile is an individual Mesh with a
   6-material box (buildBoxMaterials three-renderer.js:1245); stacked columns even
   bypass the material cache (:2029). Merge same-material tile faces into one
   BufferGeometry per texture at rebuild time (`rebuildTerrain` :1827-2067). Terrain
   is rebuilt rarely (serial-gated), so the merge cost is amortized. This is the
   single biggest draw-call cut (hundreds → tens) and is pixel-identical.
2. **Shadow-map dirty gating** per the caveat above (big GPU win on sprite boards),
   and/or default shadows to 1024/PCF on first run (minor visual change — user opt-in).
3. **Texture atlas for unit/terrain sprites** — 2,016 unique materials mostly = unique
   textures (`getTexture` :1131 caches per URL; no atlas). An atlas + shared material
   with UV offsets lets same-type quads batch. Do terrain decals first (bounded set),
   units later. Pixel-identical if pixel-snapped.
4. **Replace per-frame serial strings with version counters.** Eight `_compute*Serial`
   functions concatenate strings across all units/objects every frame
   (three-renderer.js:5116-5135, :2090, :2134, :7590). state.js already has
   `_terrainVersion`/`_heightVersion`/`_voxelVersion` — extend that pattern (bump a
   counter at mutation sites) and compare integers. Kills ~100 string allocs/frame.
5. **Pool spell VFX** (three-vfx-effects.js has ~350 `new Mesh/Geometry/Material` sites
   per-cast) or route them through the existing three-vfx.js pools; also give each
   effect a registration in a central "active effects" list killed on match end —
   today cleanup is tied to each effect's own rAF loop completing (leak if interrupted).
6. **Consolidate the per-spell rAF loops** (three-vfx-effects.js:2184+ — each cast runs
   its own `requestAnimationFrame` chain) into one ticker driven from `renderFrame`.
   Cheap, reduces callback overhead and makes pausing/cleanup trivial.
7. **FPS cap option** (30/60/uncapped) via delta accumulator in `renderFrame` — battery
   + 144Hz machines currently render every refresh (setAnimationLoop, :13520).
8. **CSS2D nameplate audit** — 212 DOM nodes repositioned per frame by CSS2DRenderer;
   `_patchPlateStats` does several `querySelector`s per unit on stat changes (:5153-5178).
   Cache element refs per unit; consider canvas-drawn plates only if profiling says so.
9. `textureCache` (:821) is never disposed — fine per match, but a long session
   accumulates VRAM; add an LRU or a match-end sweep of textures unused by the new board.

---

## 5. Competitive integrity & accounts (prerequisite for public ranked)

### Current trust model (all verified)
- Host client runs ALL game logic; server relays state wholesale (`state-sync`
  server.js:1305-1337) with only rate-limits + turn-ownership guards. A modified host
  fabricates anything.
- **Ranked ELO results are client-reported** (`ranked-result` emitted by host
  online.js:2609-2619; server validates only "host of a ranked room, once, ≥30s"
  server.js:1379-1416 — never the actual outcome).
- **Gold banking is client-computed** (`computeAccountMatchGold` data.js:8068), server
  only clamps to 5,000/match (server.js:619-628).
- **Achievements/career stats are localStorage only** — lost on cache clear, trivially
  editable, invisible to other players.
- **Auth is a bearer token minted at register** (server.js:504-540) — no password, no
  email, no recovery; lose the token (clear storage) = lose the account.
- Mitigations that DO exist: replay logging (server.js:1301,1334), rate limits, host/guest
  direction enforcement, rejoin tokens, bot ELO pinning behind `BOT_ADMIN_SECRET`.

### Phased plan
- **P1 (days):**
  - Dual-report results: both clients send `ranked-result`; agreement → commit,
    disagreement → hold + flag with the replay log attached. Cheap and catches the
    lazy 99%.
  - Server-side sanity: winner must be a room member (exists), duration vs. round
    count plausibility, ELO delta bounds, per-account daily gold cap (velocity check).
  - **Account recovery**: add optional email (magic link) or WebAuthn passkey on top of
    the token. Without this, ranked identity is disposable and bans are meaningless.
- **P2 (weeks):** report per-match stat summaries (kills/damage per unit — the payload
  already exists client-side as `buildProfileMatchSummary` profile.js:658-733) to a new
  endpoint; store in a `match_stats` table. Enables server-side achievements (§6),
  anomaly detection (impossible damage/turn counts), and public profiles.
- **P3 (months, only if the game gets real traction):** deterministic verification —
  seeded RNG + input log lets the server (or the opponent's client) replay and verify a
  match. The current wholesale-state relay doesn't require determinism, which is why
  this is deferred, but design new gameplay RNG through one seedable PRNG now to keep
  the door open.
- Leaderboard hardening: minimum games for placement, seasonal soft-reset, decay above
  a threshold — all trivial server-side once results are trustworthy.

---

## 6. Achievements & profile (explicitly requested)

### What exists (build on it, don't replace)
- 14 binary achievements in `ACHIEVEMENT_DEFS` (battle.js:4942-5013) with unlock +
  toast + per-match list (`checkAchievement` battle.js:5033-5059), persisted per local
  profile (profile.js:314-326), displayed in the profile's **Achievements tab**
  (profile.js:1061-1097) and on the victory screen with an N/14 counter
  (battle.js:13002-13013). Rich per-unit match trackers already exist
  (state.js:4594-4732) plus lifetime career aggregates (profile.js:15-24).

### Plan
1. **Extend the def schema** — keep ids stable, add:
   `{category: 'combat'|'career'|'modes'|'collection'|'mastery', tiers: [{target, name, reward:{gold?,token?}}], progressKey?: fn(profile)=>number, hidden?: bool}`.
   Binary achievements are just single-tier defs; existing 14 slot in unchanged.
2. **Career/cumulative achievements** driven from existing aggregates (career.kills,
   wins, damage, streaks — already tracked): kills 10/100/1,000/10,000; wins
   1/10/100/500; win-streaks; per-class mastery (classStats exists); per-mode wins
   (modes already recorded in match history); ELO milestones (peakElo exists);
   collection (own N units — `account.unlocked_units` exists); creator (publish a
   community map — upload path exists); social (win a private-room match).
   That's ~30-40 achievements with zero new tracking code — every data source
   already exists in `profile` state.
3. **Progress UI**: AchievementsTab gets progress bars (`progressKey(profile)/target`)
   and tier badges; victory screen highlights "closest to unlocking" (see §8 hook).
4. **Rewards**: on unlock, credit gold/tokens through the existing economy path
   (`creditLocalGold` profile.js:~640 / server bank endpoint) — the milestone
   free-token drip is already designed in unitunlockeconomy.md:80 and never built;
   achievements are the natural delivery vehicle.
5. **Server sync** (make them real): add `achievements TEXT` to `players` via the
   `ensureEconomyColumns` ALTER-on-boot pattern (server.js:42-90); add
   `POST /api/achievements/unlock` (token-auth like the economy endpoints,
   server.js:586-700) + merge-on-login alongside `_absorbEconomyFromResponse`
   (profile.js:507). P2 of §5 later makes them server-*verified*; syncing them now
   makes them durable, which is what players actually feel.
6. **Public profile**: `GET /api/player/:id/public` returning username, rank tier, ELO,
   career highlights, achievement showcase (player-picked 3-5). Surface: click a name
   on the leaderboard (profile.js leaderboard component) or in the lobby.

---

## 7. Ranked map standardization (explicitly requested)

### What exists — closer than expected
- A **fixed, curated, server-side ranked pool already exists**: `MAP_POOL`
  (server.js:246-283, 35 named prebuilt maps tagged `{modeId, w, h, team}`), consumed
  by `pickRandomMap(teamSize)` (server.js:285-294); the chosen `mapModeId` rides
  `match-found` (server.js:392) → `applyGameMode` on both clients (online.js:1078-1084).
  All pool maps are deterministic hand-authored boards (`PREBUILT_MAPS` data.js:8408+),
  so both players always see the identical map — no seed system needed (the host also
  relays the full board in `state-sync`, online.js:2715-2724).

### Plan
1. **Per-mode season pools**: filter by the queued `rankedMode` and cross-check
   `MULTIPLAYER_MODES[mode].compatibleMaps` server-side (today only team size filters —
   server.js:288). Curate 7–10 maps per mode per season; store as a versioned constant
   (`RANKED_SEASON_1 = {tdm: [...], arena: [...]}`).
2. **True rotation/cycling** (the "standardized maps cycled through" ask): replace
   uniform random with per-queue-bucket round-robin (a cursor per `teamSize:mode`
   bucket), plus "don't repeat either player's last 2 maps" using a short per-account
   history. Both are ~20 lines in the matchmaker loop (server.js:313-420).
3. **Veto phase (v2)**: after pairing, offer 3 maps, each side bans one within 20s,
   remaining map plays (coin-flip if both ban the same). Protocol: insert a
   `map-veto-offer`/`map-veto-pick` exchange before `match-found` finalizes; server
   already owns the pairing moment (server.js:357-406) so this is a contained change.
4. **Spawn-fairness audit** of the 35 pool maps (symmetric spawn distance to
   objectives) — do it with the existing playtest harness in dev-sim mode per map and
   compare P1/P2 win rates over N sims; drop or fix outliers.
5. **Single source of truth for mode text**: mode-card descriptions drifted from the
   actual rules (Arena said "33 rounds", rule is 15 — fixed this session, map.js:1028-1029).
   Generate the "N rounds" fragment from `MULTIPLAYER_MODES[id].roundLimit` instead of
   hardcoding it in `MS_GAME_MODES` so it can't drift again.
6. Keep **Gauntlet** out of ranked until it has playtest hours (newest mode, no round
   limit, unique roster mechanics — state.js:759-779).

---

## 8. Fun / addicting loop (design work, mostly small engineering)

The economy gives a reason to play *more matches*; nothing yet gives a reason to come
back *today*. Cheapest-first:
1. **"Next unlock" progress on the victory screen** — the gold-breakdown card
   (battle.js:12779-12814) already animates gold; add one line: nearest affordable unit
   + progress bar (`wallet / 5000`). Dopamine anchor at the exact right moment.
2. **First-win-of-the-day gold bonus** (server-side date check in the bank endpoint;
   client shows it in the breakdown). One column, ten lines.
3. **Daily quests (3/day)**: "Win a TDM", "Get 8 kills with a Tech unit", "Capture 2
   nexus points". All verifiable from the existing per-match trackers; store rolls in
   the profile (local first, server later). Reward: gold within the existing 5k cap
   economy + occasional free token (the designed-but-unbuilt drip,
   unitunlockeconomy.md:80).
4. **Account level / match XP** separate from ELO (losing still progresses something).
   Feed from matches played/won; show as a small level chip on profile + lobby.
   Cosmetic-only rewards: titles, profile borders, nameplate colors (all DOM, no art).
5. **Collection pressure**: a "N/94 races owned" strip in the shop and profile; sort
   shop by "almost affordable". (Shop exists, ui.js:~7050-7500.)
6. **Onboarding**: there is no tutorial. First launch drops into profile creation
   (index.html first-launch hook) then a menu with 8 buttons. Build a 5-minute scripted
   1v1 (the campaign-dialogue system + a tiny fixed map already exist) teaching move/
   attack/spell/objective; gate the ranked button behind account level 3 or 5 matches.
   This is the single highest-leverage *fun* item for new players.
7. **Anti-frustration**: shot clock + match clock exist (battle.js:26000+); add a
   surrender vote at round ≥ N for online, and AFK detection → auto-forfeit feeding
   the existing forfeit path (battle.js:14449, server.js:1587-1594).

---

## 9. QoL backlog (small items, in rough priority order)

1. Graphics **presets** (Low/Medium/High) mapping the existing toggles (shadows, DPR,
   bloom, DoF, FXAA) to one dropdown — the knobs exist (ui.js:6434-6468) but nobody
   tunes six sliders. Include an auto-detect first-run preset (mobile → Low).
2. **Score clarity in HUD**: TDM/FFA read `state.matchKills`, `matchScores` stays 0-0
   (chronic confusion, CLAUDE.md "Key facts", PLAYTEST_NOTES:735). Rename or alias the
   field, and make the HUD scoreboard label per-mode ("Kills 3–2", "Points 120–90").
3. **Stale highlight recompute** — the known "won't move to the orange tile" class of
   bugs is highlights not recomputed after state changes (PLAYTEST_NOTES:709-715).
   Centralize: any mutation that can invalidate (`AP spent`, ally moved, terrain
   deformed, fog change) bumps a version; the highlight layer recomputes on mismatch
   (pairs with §4.4's version counters).
4. **Settings persistence audit** — most graphics settings persist; verify audio
   channel volumes, HUD scale, camera prefs all survive reload (HUD scale was added
   2026-07-05, PLAYTEST_NOTES v4).
5. **Keybind remapping** + a visible shortcut reference (there are keyboard controls;
   they're undiscoverable).
6. **Colorblind-safe highlight palette option** (move/attack/spell tiles rely on
   red/green/orange distinctions) — palette swap only, no art.
7. **Mobile pass**: PWA manifest exists (index.html:13); audit touch targets in the
   horologe action carousel and party builder; verify iOS audio unlock (first-tap
   `AudioContext.resume`).
8. **Spectate / replay viewer (later)**: server already logs replays
   (server.js:1301-1334); a client-side player for those logs doubles as the §5 P3
   verification tool and a marketing asset (share clips).

---

## 10. Architecture & code health notes (for future Claude sessions)

- The "no build, edit-in-place, hand files back" workflow (CLAUDE.md RULE #1) is a real
  constraint — respect it, but §2.4's deploy script is compatible with it (it automates
  the upload half, changes nothing about editing).
- File sizes: battle.js ~1.36 MB / ~29k lines, three-renderer.js ~730 KB, data.js
  ~750 KB, ui.js ~500 KB, map.js ~500 KB. Navigation depends on grep + the section
  banners — keep PLAYTEST_NOTES.md updated (it's the cross-session memory and it works).
- `window.GAME` (battle.js) is the live-state API for harnesses; `ThreeRenderer` is a
  top-level `const` — **not** a `window` property; probe it as a bare identifier or via
  `typeof`, and use the new `ThreeRenderer._renderer` getter for `renderer.info`.
- Playtest harness: `node playtest.js <mode>` (see CLAUDE.md); asset_cache.js keeps
  Playwright from hammering R2. In the remote container, launch Chromium with
  `executablePath: '/opt/pw-browsers/chromium'`.
- Known engine invariants that bite: traversal must funnel through `unitCanTraverse`
  (map.js) including turrets/objects; Meshy GLB animation clips are per-character (rig
  rest poses differ — never share clips across characters); prebuilt maps have 5
  wiring touch-points (PLAYTEST_NOTES:1257).

---

## 11. Changed this session (2026-07-05) — do not redo

All non-visual; each verified end-to-end with a Playwright boot/match probe:
1. **index.html** — boot telemetry (first script in `<head>`): counts finished
   script/CSS downloads via the Performance API (Chromium doesn't propagate script
   `load` events to window capture — only `error`), records failed URLs; title loading
   bar now shows **real** progress (was a fixed 3s animation) and only hits 100% at
   `_gameReady`; **boot failure overlay** (dark card, failed-file list, RELOAD button)
   on core-file failure or 45s without readiness — replaces the silent
   "· LOADING ·" soft-lock; `preconnect` hints for R2/jsdelivr/cdnjs/socket.io; dark
   pre-CSS background so the first frame isn't white.
   Verified: healthy boot → bar 100%, no overlay, ENTER arms; blocked battle.js →
   overlay lists the file.
2. **server.js** — gzip via `compression` middleware (index.html 115 KB → 28 KB over
   the wire; wrapped in try/catch so a stale node_modules can't crash boot).
   **package.json** — added `compression` dependency.
3. **three-renderer.js** — `powerPreference: 'high-performance'` on the battle renderer
   (discrete-GPU hint, no pixel change); exposed `get _renderer()` next to `_scene`
   for draw-call/memory profiling (`ThreeRenderer._renderer.info.render`).
4. **map.js** — mode-select descriptions corrected to match actual rules (Arena
   33→15 rounds, TDM 15→12; `MULTIPLAYER_MODES` state.js:651,669 are the truth).
5. **match-select.js — real gameplay bug fix**: the globals `_msConfirm` reads
   (`_msSelectedRounds` etc.) were mirrored in a `useEffect` whose dependency array
   omitted `rounds` — so the per-mode round limit and any manual ROUNDS tweak were
   silently ignored (verified live: a TDM started via mode select ran a **15-round**
   match clock while the rules and combat log said 12). Deps alone weren't enough —
   a deferred effect can be outrun by a fast CONFIRM click — so the mirror now runs
   in the render body (globals always match the rendered UI). Verified end-to-end:
   HUD and `state.matchClock.roundLimit` now read 12 for TDM.
6. **ROADMAP.md** (this file).
7. **§3.1 + §3.2 SHIPPED (follow-up session, 2026-07-05/06): battle loading screen.**
   New NGE-title-card × Skyrim-tips loading screen between team lock-in and the VS
   splash — and it's the real asset gate: `ThreeRenderer.preloadUnitModels(units, cb)`
   (new public API, three-renderer.js — warms every RACE_MODELS_3D GLB incl. clips,
   settles on success OR failure) + `warmBattleTrack(key)` (audio.js — buffers the
   chosen battle track) + unit sprite PNG warms, all raced against a 12s cap with a
   2.6s minimum display. Kills the 2D→3D unit pop-in and cold-stream music hitch.
   Content: YEAR 2058 / mode / map ("THE <label>", generic size boards → "THE PROVING
   GROUNDS") / BATTLE:n in Cinzel; random ls1–ls5 pixel art w/ glow+glitch; entropy
   motes; rotating FIELD MANUAL / INTEL FRAGMENT hints mined from the codex dossiers;
   real progress strip. `showBattleLoadingScreen` in battle.js (also on `window` —
   online.js guest phase-flip path uses it too, so guests get the same gate).
   Dev-sim/animations-off skip visuals but still fire the warmers. Files touched:
   battle.js, three-renderer.js, audio.js, online.js, styles-cinematic.css (`.ls-*`),
   index.html (`?v=` bump). §3.3 (online ready handshake) and §3.4 (defer head 3D
   stack) remain open.

8. **§4 PERFORMANCE PASS SHIPPED (session 2026-07-06, user-approved):** items
   §4.1/4.2/4.4/4.6/4.7/4.8/4.9 are done — see the list below. Files touched:
   three-renderer.js, three-post.js, three-vfx-effects.js, ui.js, index.html
   (`?v=` bump → 20260706g).
   - **§4.1 terrain batching** (three-renderer.js `_rebuildMergedTerrain`):
     after every terrain rebuild, all static plain-Lambert tiles are baked into
     one merged mesh per unique material; the per-tile originals stay in the
     scene graph with `visible=false` (r128's Raycaster ignores `visible`, so
     picking still hits them) and merged meshes are render-only ghosts
     (`raycast` no-op). NOT merged: lava/fluid tiles, tiles that RISE ≥2 steps
     over any 8-neighbour (walls/cliff faces — kept individual so the
     action-cam occlusion fade still works; absolute height is NOT the test,
     a flat z=7 plateau merges fine), anything mid-fade or non-Lambert.
     Verified: pick parity 0/27 mismatches; on a half-mergeable map total draw
     calls −42%, triangles −47%. Batching auto-disables under fog of war
     and in the editor. Kill-switches: "Batched Terrain" toggle in Video
     settings, `window.EW_DISABLE_TERRAIN_MERGE`.
   - **§4.2 shadow gating**: `renderer.shadowMap.autoUpdate=false`; renderFrame
     sets `needsUpdate` only when a rebuild ran, tweens/GLB mixers are active,
     ThreePost.isLightingEasing() (day/night), turret arms / flying bob moved,
     tower cubes exist, or fog of war is on. Kill-switch:
     `window.EW_DISABLE_SHADOW_GATING = true`.
   - **§4.4**: all `_compute*Serial` string concats → 32-bit rolling hashes
     (`_hashStr/_hashInt/_hashVal`), zero per-frame allocation.
   - **§4.6**: three-vfx-effects.js per-cast rAF chains → ONE shared ticker
     (`_fxSchedule`/`_fxPump`); `ThreeVFXEffects.clear()` now hard-kills every
     live effect (3D geom, bubble domes, sig cinematics) and is called from
     `ThreeRenderer.resetForNewMatch()`. Also fixed a real bug: the light-lance
     / glacial-tomb effects referenced an UNDECLARED `_activeThreeMeshes` —
     casting them threw a ReferenceError and stranded their meshes; declared +
     swept now.
   - **§4.7 FPS cap** (Off/30/60, drift-free accumulator in renderFrame) +
     **FPS counter** (DotGothic16 retro readout, top-right, color-coded) —
     both in pause-menu Video → Graphics, persisted (`ew_fpsCap`,
     `ew_fpsCounter`, `ew_terrainBatch`).
   - **§4.8**: nameplate patchers use cached element refs (`_plateRefs`);
     `_scalePlates` skips the DOM transform write when the scale is unchanged.
   - **§4.9**: `getTexture` stamps a match epoch; `resetForNewMatch` disposes
     textures unused for 2 matches.
   - **Fog Grid toggle** (follow-up, same session): Video → Graphics "Fog Grid"
     (`ew_fogGrid`, default on). Off = no holographic fog boxes and no terrain
     dimming — the whole map renders — but fog-of-war INFORMATION is untouched:
     enemy units/plates/turrets/deployables outside vision stay hidden (same
     `_fogVisibleSet`, refreshed 0.2s, verified 0 leaks over a soak test). As a
     bonus, §4.1 terrain batching now engages on fog matches when the grid is
     hidden. Renderer API: `ThreeRenderer.setFogGrid(bool)`/`isFogGridOn()`.

Deliberately NOT done: §4.3 texture atlas (biggest remaining §4 item),
§4.2's optional 1024/PCF default (visual change), CSS2D plate canvas rewrite
(§4.8 second half), §2 deploy-process decisions.

---

## 12. Suggested execution order

| Phase | Focus | Items | Effort |
|---|---|---|---|
| A | Infrastructure | §2.1 custom domain, §2.2 versioning, §2.3 repo=truth, §2.4 deploy script | days, mostly config |
| B | First impression | §3.1 match preload gate, §3.2 audio preload, §3.4 defer head 3D stack, §8.6 tutorial | ~1-2 weeks |
| C | Competitive core | §5 P1 (dual-report + recovery), §7.1-2 ranked pools + rotation, §6.5 achievement sync | ~2 weeks |
| D | Retention | §6.1-4 achievement expansion + rewards, §8.1-5 daily loop, §9.1-2 QoL | ongoing |
| E | Performance deep work | §4.1 terrain merge, §4.2 shadow gating, §4.3 atlas, §4.5-6 VFX pooling | as needed, profile first |

Phase A is almost pure configuration and removes the worst production risk (throttled,
uncacheable, unversioned delivery). Phase B is what a new player feels in the first five
minutes. Phase C is what makes ranked real. D and E compound from there.
