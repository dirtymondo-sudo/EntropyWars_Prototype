# Notes: rendering-loading-perf

Moved verbatim from CLAUDE.md on 2026-09-24 (sections in original order). Polish passes, bloom, textures, loading/lanes, freezes, crashes.
Append new notes for this system at the end of this file.

## MOBILE CRASH / SFX PASS — 2026-09-19 (local delivery, not deployed)
Reported: iPhone 13 reaches the menu but crashes entering HQ/a match; some SFX silent. `MOBILE_UPLOAD_README.md` records the exact upload paths, checks and remaining device validation.

`three-post.js` Low mode now returns after lighting setup BEFORE composer/bloom allocation; both render paths already fall back to direct rendering. `three-renderer.js` serializes unit/misc model loading in Low mode, caps embedded material textures at 512px, skips all character appearance preload when 3D units are disabled, and samples one in four tornado frames (same cycle duration). `sprites.js` no longer eagerly decodes the 99 tornado images. No board rules/collision/fog/host or guest state changes.

`audio.js` leaves music at preload none and plays file SFX through the existing gesture-resumed AudioContext (two decodes, 8 MiB LRU buffer cache, 16 pending URLs, 12 voices; 1.2s stale-event cutoff). The 37 Ogg cues now point to new `_mobile.mp3` files; the delivery includes converted originals, uploaded to R2 `Assets/SFX/`, retained under `mobile-audio/` in the repo. Upload assets BEFORE audio.js. Existing MP3 effects, mixer levels and cooldowns remain. Ogg music is not converted. Shared index token: `20260919-mobile-02-cors`.

Validation: all 204 JS syntax checks, data parity and 21 schema checks pass; targeted suite 65 pass / 3 optional dependency skips / 0 fail. Nine mobile regressions in `mobile-performance.test.js`; `character-creator.test.js` loader sandbox now loads the new helpers. Broader run exposed three pre-existing failures confirmed on original source (Astral obsolete token, DUMB dream-lab exit count, Astral sea column in water). No live playtest, upload or physical iPhone measurement; do not call this shipped or the crash device-confirmed.

## THE LOADING SCREEN + THE SURVEY — the freeze after the door, and the floor plans off the main thread (2026-09-19, local delivery)
The user: "when I click Play it does the door animation and then freezes — there needs to be a loading
screen there; textures / models load slowly." MEASURED (headless, `node`): a terrain room's floor plan
(data.js `hqTerrainCompile` — the automata, the reach BFS, the rescue ramps) takes **3–31 s** on a big
room (Downtown 31 s, the grid 23 s, the astral sea 18 s, the cavern 12 s; 206 s for all 77), and the finds
warm (`hqFindsWarm`, on idle after arrival) triggered it for every tape room in turn — that was the freeze;
and map.js `_hqEnter` showed the load card and BUILT THE ROOM IN THE SAME TASK, so the card was never
painted. Three rules now. **(1) THE PAINT**: map.js `_hqDeferBuild(fn)` runs the build a frame + a macrotask
after the card / the page switch (inline without rAF — scene-lifecycle.test.js's harness); on a walk the old
room HOLDS under the card through renderer `hq.hold(true)` (pause WITHOUT releasing the pointer lock — a
released lock reads as the eaten ESC). **(2) THE SURVEY**: the compile runs in a Web Worker — map.js
`_hqSurveyWorkerGet` builds a blob script = `_HQ_SURVEY_PRELUDE` (the browser stubs load-data.js's sandbox
uses) + `importScripts(<the page's own data.js URL>)` + data.js **`hqTerrainWorkerServe(self)`**; one job at
a time, the room being entered at the FRONT (`_hqSurvey(roomId, true)` — its build waits under the FULL
card: "surveying <room>… 12 s"), every other room in the background nearest-first (`_hqSurveyWarmAround`:
the rooms behind this room's doors through `hqDoorThrough`, then theirs, then the building; one hop on
EW_PERF_LOW). The record crosses as a PLAIN copy — data.js **`hqTerrainPlain(info)`** (no closures, no
`room` / `S` / `rules`, the typed arrays TRANSFERRED) — and is adopted by **`hqTerrainAdopt(roomId, plain)`**
(the room / shell / HQ_TERRAIN_RULES re-attached, `hFn` = the SAMPLED field — `hFnSampled: true`; nothing
outside the compiler reads the authored one —, the pads' doors re-pointed at the live rows by id + wall,
`_terrainInfo` defined); the worker compiles the ROOM OBJECT the page sends (`hqTerrainRoomPlain`), so a
variant compiles as the variant. `hqFindsWarm` SKIPS a terrain room whose record has not landed (the
adoption re-kicks the warm). No worker (file://, EW_HQ_NO_SURVEY, a dead import) = the sync compile under
the painted card. **(3) THE ARRIVAL WARM**: `window._hqWarmArrival()` (once per page load, from the main
menu's show and from Play) → renderer `hq.warmAvatar(spec)` (the walker's rig + the UAL libraries — the
card waits for exactly that model) + `hq.warmRoom(roomId)` (the arrival room's leaves, props, the door gun,
the shell's sheets through the same caches) + the survey worker set on the arrival's neighbours. The card's
note is live (`_hqLoadProgressStart`: the survey's clock, then `ThreeRenderer.assetsPending()` = GLB files
still in flight). RULE: never call `hqTerrainInfo` for a room the officer is not standing in from the main
thread — ask `_hqSurvey`. THE WEIGHT is the rest of the slowness and is the user's: the hall's furniture is
~100 MB of GLB (computer_chair_blue 16 MB, Wooden Door 11 MB, the door frame 8 MB, UAL1 + UAL2 16 MB) —
`gltf-transform optimize` with WebP textures at 1024 px would cut it ~5–10×. `npm test` runs
scene-lifecycle.test.js (the paint, the survey wait, the dead worker) + hq-terrain.test.js (THE SURVEY ×3).
UNSEEN LIVE (RULE #1c): the worker on iOS Safari (a blob worker importing a cross-origin classic script),
the card's clock, the hold on a walk.

## THE DESKTOP LOAD PASS — THE RIG LANE, THE SFX FAILURE MEMO, THE CDN CACHE (2026-09-20, local delivery)
The user: "loading textures really slowly after the iPhone session". MEASURED: the mobile pass (2026-09-18)
changed nothing for a PC in Auto / High — every renderer / post change is behind `EW_PERF_LOW` (a PC that
shows LOW in Settings → Performance gets one model at a time, 512 px model textures, sprite units and 30 fps:
click HIGH). What the same day DID add for everyone: THE POPULATION (2–12 extra rigged GLBs per room) and THE
ARRIVAL WARM (a whole room of props fired at once), both sharing the connection with the walker's own rig —
the file the HQ load card WAITS for. And the CDN: `curl -I` shows every object under `Assets/` and `music/`
(and any dashboard-uploaded js / css) is `cf-cache-status: DYNAMIC` with NO `cache-control` — R2 caches per
OBJECT, only the wrangler-uploaded files carry `max-age=31536000`; every player pulls textures and 16 MB
GLBs from origin, and the browser only guesses freshness (10 % of the file's age — a GLB uploaded yesterday
is re-validated within hours). **THE RIG LANE** (three-renderer.js, beside `_scheduleModelLoad`): a URL
marked by `_rigLaneMark` (the avatar's model + animation libraries — `hq.warmAvatar` and the player's
`_hqSpawnCharacter` mark them) starts at once; while any marked file is in flight every other model request
(`_loadUnitGLB`, `_loadMiscModel` — both hand their `url` to the scheduler now) is HELD and released
TOGETHER when the rig lands (a flush, never the phone's serial queue; a 12 s safety flush covers a stalled
file). Kill-switch `EW_NO_RIG_LANE`. **THE SFX FAILURE MEMO** (audio.js `_sfxFailed`): a cue that failed
twice in a row backs off 60 s instead of a fetch per play. **deploy.js** uploads with `--cache-control
'public, max-age=31536000, immutable'` (js / css are `?v=`-busted; a renamed asset is its own bust). THE
USER'S ACTION (the biggest win, no code): a Cloudflare Cache Rule on `cdn.entropywars.net` — Eligible for
cache, Edge TTL 1 year (ignore origin), Browser TTL 1 year — or `wrangler r2 object put --cache-control`
on the asset folders. mobile-performance.test.js has the lane + the memo (its "every replacement MP3" test
fails at HEAD because `mobile-audio/` was never committed — pre-existing). UNSEEN LIVE (RULE #1c): the
card's wait on a cold cache with the lane, the flush's burst of requests after the rig.

## THE BLACK BUILDING — THE RETRY, THE BACKGROUND LANE, THE MENU'S DOOR FIRST (2026-09-20, local delivery)
The user: "the door frame is always missing from the title screen, the rotunda stairs have no texture …
everything is just black". MEASURED (a scratch Playwright probe against the REAL CDN through the egress
proxy — `shots/.cdn-cache` keeps the files; the CDN is reachable and serves `access-control-allow-origin`
for the play origin `entropywars-prototype.onrender.com` with `vary: origin`, the edge keys on Origin, every
live script matches the repo byte for byte): (1) the menu's door leaf landed 70 s in, behind the 28 GLBs
THE ARRIVAL WARM fired at the same moment plus the VFX file's 20-weapon boot warm — the user never saw a
door; (2) the CDN is edge-cached for a YEAR now (the cache rule) and the browser keeps every copy as long —
a copy ever answered without its CORS header (a policy change; Safari's plain <img> of the same URL) or as
a 404 (a file asked for before its upload — the edge caches a 404 for the year too) is FROZEN, and a
texture / model that never lands is a black surface until the cache is cleared. Three rules now.
**THE RETRY** (three-renderer.js, beside `textureLoader`): every failed CDN load is fetched ONCE more under
`ewretry=<token>` (`_ewRetryUrl` — a new cache key on the edge AND in the browser) — the texture loader's
wrapper (onto the SAME Texture), `_loadUnitGLB` (before the character fallback), `_loadMiscModel`,
`_loadFoliageModel`, three-vfx-effects.js `_loadCachedTex` / `_wpnLoad`; every failure is one console line
(`_ewAssetFailed`) and a row on `window._ewAssetFailures` — READ THAT FIRST on any "black" report. Proven
by the probe with every first image / model request answered 403: the ground, the leaf and the car landed
on the second try. **THE BACKGROUND LANE** (`_scheduleModelLoad(start, url, bg)`): a warm — `hq.warmRoom`
(`_loadMiscModel(…, { bg: true })`), the roaming extras (`_hqSpawnRounds` under `_bgLoadDepth`), the weapon
boot warm (`_wpnLoad(key, { bg: true })` through `ThreeRenderer.bgModelLoad`) — runs at most `BG_MAX` 3
files at a time and only while no rig is streaming; a REAL request for a queued URL promotes it
(`_bgPromote` / `ThreeRenderer.bgPromote`). The rig lane is a SET (`_rigLaneLive`, never a counter).
**THE MENU'S DOOR FIRST**: map.js `_hqWarmArrivalSoon` — the main menu warms the building only after its
own leaf and car have landed (else 8 s in); Play still warms at once. mobile-performance.test.js pins the
lanes. UNSEEN LIVE (RULE #1c): the user's own browser — if a room is still black after this build, the
console names the URL and the Network tab shows the header (or the 404) the cache froze; a hard reload
(Ctrl+Shift+R) or clearing the site's cache is the reset, and a Cloudflare cache PURGE after an upload
that replaces a file that ever 404'd.

## THE LOADING PASS — NOTHING IS WARMED BEHIND THE TITLE (the 330 MB title screen) — 2026-09-20, local delivery
The user: "the page just loads forever — transferring data from cdn.entropywars.net… the title sprites never
finish". MEASURED with a headless browser against the REAL CDN (`playtest` scratch probe, request log by
phase): the TITLE SCREEN alone pulled **330 MB** in 355 requests before any click — the VFX file's boot warm of
all 29 weapon GLBs (5–13 MB each; the `first` burst at 3.5 s + a 700 ms drip), the renderer's projectile
(14 MB) and bone (27 MB) boot timers, the finisher rocks (both asteroids, 22 MB), AND the pre-match party
builder, which React-renders at boot INSIDE `.app.setup-mode` under the title overlay and whose `HeroViewer3D`
stage streamed the first slot's rig + UAL1 + UAL2 + MAL1 (26 MB); four of the weapon files were fetched TWICE
(the VFX cache and the renderer's misc cache share URLs). The menu added ~100 MB (the arrival warm's whole
room). The CDN itself is fast (a 18 MB file in 0.7 s from here) — the tab was simply queueing a third of a
gigabyte, and on a home line the 466 KB title sprite sheets sat behind it for minutes. THE RULE NOW: **no
model is ever warmed at boot, on the title or on the menu** — a weapon / a bone / a projectile loads on its
FIRST USE (every helper degrades gracefully while it streams), the battle's LOADING SCREEN warms only what
the two parties' basic attacks deliver (battle.js: `basicAttackDelivery` → `ThreeVFXEffects.warmWeapons
(['bullet' | 'arrow'])` + `ThreeRenderer.warmProjectileModels([dv.proj])`, both in the background lane,
fire-and-forget) and `finish()` starts **`ThreeVFXEffects.warmWeaponsDrip(4000, alive)`** — the rest of the
library one file every 4 s through the background lane while `gameState === GS.BATTLE`; `stopWeaponDrip`,
`EW_NO_WEAPON_WARM`. The menu's `_hqWarmArrivalSoon` warms the WALKER'S RIG only (`_hqWarmArrival({
avatarOnly: true })` — the one file the load card waits for); Play warms the room + the survey. **THE HIDDEN
STAGE**: `EWCharViewer.mount` parks a host that has no box OR whose centre is covered by an element outside
its own page / app root (`_cvHostHidden` — `host.closest('[id$="Page"], .app')`; a window of the SAME page
over it, the forge's locker, is not a cover) and polls it in (`_cvDeferMount`, 400 ms); `unmount` drops the
park. AFTER: the title is 22.7 MB (the scripts), the forge from the menu mounts its stage and streams its rig
on open. `npm test` runs `load-diet.test.js`. STILL THE USER'S (assets, not code): the menu scene's pyramid
wears a 28 MB `Pyramid/Textures/TextureBake.png`; the hall's chairs are 16 MB each; `railing_1m`'s file
`Meshy_AI_one_meter_of_railing_0903105339_texture.glb` is NOT in the bucket (a 404 + a retry in every room);
the Cloudflare cache rule caches a 404 for a year in the browser too — set the rule's Edge/Browser TTL for
status 200 only (404 → a minute) and PURGE after uploading a file that ever 404'd.

## THE LANES ARE OFF — everything loads at once again + THE CDN CORS PROBE (2026-09-20, local delivery)
The user, on the two-day-old rig lane + background lane: "everything used to load fast all at once — go back
to that; still black, everything loading slow." MEASURED on the live Render host (headless, the real CDN):
zero asset failures, every texture and GLB carries its CORS header, the hall renders textured after 90 s —
the black was assets not yet arrived, and the LANES were the delay (the walker's rig held every other model,
the room's props and the natives trickled three at a time). three-renderer.js `_scheduleModelLoad`: on a
desktop EVERY request starts the moment it is made; the rig lane and the background lane exist only under
`window.EW_MODEL_LANES = true` (the phone's serial queue under EW_PERF_LOW is untouched; the retry stays).
map.js `_hqWarmArrivalSoon` warms the WHOLE arrival room from the menu again (`avatarOnly` is still a valid
opt). index.html gains THE CDN CORS PROBE at boot: one small cors fetch of the CDN; when the page's origin
is not in the R2 bucket's CORS policy (only the Render host is today — entropywars.net / www get NO
`access-control-allow-origin`) a red banner names the origin and the fix and `window._ewCdnCorsBlocked` is
set — a blocked origin renders every texture and model black with nothing else in the console. The bucket's
policy is the user's (Cloudflare → R2 → bucket → Settings → CORS; `r2-cors-policy.json` in the delivery).
mobile-performance.test.js's lane test opts in; load-diet's menu test reads the full warm.

## THE FREEZE AFTER PLAY — the finds table compiled every area on the main thread (2026-09-20, local delivery)
MEASURED (a headless A/B against the real CDN, the Sept 18 build vs HEAD): Play → the foyer took 13.8 s on
the old build and 40 s on HEAD, with the main thread BLOCKED ~30 s under the "n models streaming…" card. The
CPU profile named it: three-renderer.js `_hqPlaceFinds` guarded on `D.finds` — data.js's LAZY GETTER
`_hqFindsAll`, which builds the finds of EVERY tape room, and since THE AREAS (2026-09-18) every one of the
twenty generated areas is a TERRAIN room with a tape, so the getter ran `hqTerrainCompile` on all of them
(3–31 s each) on the main thread, on every first room entry. The survey worker never saw it (the SURVEY
delivery fixed `hqFindsWarm` and missed this reader). RULES now: (1) NEVER read `DOOR_HQ.finds` / `D.finds`
in the game — a room's rows are `hqFindsInRoom(roomId)` / `hqFindsForRoom(roomId)`; (2) in a real page (a
`Worker` exists) the getter SKIPS a terrain room whose survey record has not landed and pins the table only
once complete; the Node sandbox / the tools still compile the lot (17 suites read the whole table);
`hqFindsBuildAll()` is the explicit full build for tooling. Not touched: the "models streaming" note on the
load card is the SURVEY delivery's live count of GLBs in flight (`ThreeRenderer.assetsPending`) — the card
waits only for the walker's own rig; the count is information, not the wait. The two Cloudflare cache
rules on cdn.entropywars.net are the user's to keep or drop; the CORS probe showed the edge keys on Origin
correctly and every asset carries its header. Still missing from R2: `Assets/door/models/
Meshy_AI_one_meter_of_railing_0903105339_texture.glb` (a 404 + one retry in every room).

## THE SHEETS FIRST — why a new place was BLACK, and the texture lane (2026-09-20, local delivery)
**SUPERSEDED the same day by THE LOAD GATE (the next section): the grey placeholder is GONE — the user: "I do not want stand-in textures, that is even worse." The high-priority image fetch, the one-fetch-per-file rule and the texture hold on the model queue stay.**
The user: "the floors and walls are always black when I go to a new place". TWO causes, both in
three-renderer.js. **(1) BLACK IS "NOT LANDED YET"**: a three.js material with a `map` whose image
has not arrived samples an UNBOUND GPU texture (r128 `setTexture2D` binds `__webglTexture` =
undefined at version 0) — the shader multiplies the diffuse by (0, 0, 0). Every floor / wall / ceiling
/ terrain / apron sheet in the building and on the board was black for exactly as long as its PNG was
in flight; a re-visit is instant because `_hqTexCache` / `_hzTexCache` keep the Texture. Now
**`_texShowPlaceholder(tex)`** (beside the loader wrapper) gives a tile sheet a 4 × 4 mid-grey canvas
as its image at once (`tex._ew_placeholder = true`; the real image replaces it on load) — `_hqTex`
and `_hzTex` call it; a room reads as a flat grey box that resolves, never a black one. RULE: a
reader that measures `tex.image` (an aspect ratio, a canvas copy) skips `tex._ew_placeholder`
(the two urban sign readers do); the placeholder is NOT applied to `getTexture` (the board's sprites
/ billboards read `.image` as "loaded"). **(2) THE PIPE**: a plain `<img>` is LOW priority in every
browser and the GLB fetches (XHR) are HIGH, so on one HTTP/2 connection a 20 KB sheet queued behind
the four streaming 5–16 MB models the queue keeps in flight. `textureLoader.load` is OUR OWN loader
now (no `THREE.ImageLoader`): an `<img>` with `crossOrigin` + **`fetchPriority = 'high'`** +
`decoding = 'async'`, the JPEG → RGB format rule kept, the retry through the same path
(`_texFetch`); **`_texInflight`** counts the sheets streaming and **`_mqTexHold`** makes `_mqPump`
hold every scene / warm model job (never the rig lane — the load card waits for that file) until
they land, `TEX_HOLD_MS` 2.5 s after the LAST sheet request at most (a hung PNG never wedges the
models). `_hqTex` also fetches ONE image per FILE (`_hqTexByUrl`; a second repeat pair is a
dependant Texture that takes the first's image — the same PNG used to be asked for once per repeat).
The CDN could not be reached from the sandbox this session (the egress proxy refused the CONNECT),
so nothing was measured live — the two mechanisms are read off the code and three r128. `npm test`
runs mobile-performance.test.js (THE SHEETS FIRST ×2). UNSEEN LIVE (RULE #1c): the grey-then-textured
pop on a cold cache, the props' arrival ~2 s later than before in a room with many sheets, the hold's
feel on a slow line (`TEX_HOLD_MS` is the edit).

## THE LOAD GATE — the loading screens serve their function, the placeholder is gone, the population halved (2026-09-20, local delivery)
The user: "I do not want stand-in textures, that is even worse. We need load screens that actually serve their
function and load assets and don't load a scene with assets missing or stand-in assets / textures, EVER. Cut the
characters in the areas in half." Measured cause (read off the code): every loading screen in the game waited on a
CLOCK or a SUBSET — the HQ card faded when the walker's rig attached (else 9 s), the battle card waited for the
unit rigs + a browser-cache warm of the terrain sheets while the BOARD ITSELF was built only after the VS splash
(the setting's door-kit / vehicle / foliage GLBs and the far roster streamed in behind the fade), and the menu
scene showed a procedural stand-in door until the 11 MB leaf landed. **THE ASSET LEDGER** (three-renderer.js,
the block after `_ewAssetFailed`): every request through the renderer's loaders — `textureLoader.load`
(`_hqTex` / `_hzTex` / `getTexture`), `_loadUnitGLB`, `_loadMiscModel`, `_loadFoliageModel`, `_ccLoadImage`, and
the VFX file's `_loadCachedTex` / `_wpnLoad` through **`ThreeRenderer.assetTrack(kind, url)`** — files a RECORD
(`_alTrack` → `rec.settle(ok, quiet)`) when it starts and settles it when the file lands or finally fails
(after THE RETRY and any fallback); a cache hit on a file still streaming JOINS the record (`_alJoin`, the
`_ew_alRec` / `_alRec` on the texture / entry). **A GATE SESSION** (`_alGateOpen(name, { adoptLive, minMs })`
→ `{ total, done, pending(), idle(), list(), failed(), close(), whenIdle(cb, capMs), progress() }`) records every
request made while open and is IDLE only once each has settled and nothing was asked for or landed within
`AL_SETTLE_MS` (300); a record that never settles is closed as failed after `AL_STALL_MS` (60 s) with a console
line naming the URL, so no card hangs for ever — a file that is not in the bucket is the ONE thing a card cannot
fix (`window._ewAssetFailures`, `window._ewAssetLedger.list()`). THE RULE: **a texture that has not landed is
BLACK, and nothing is SHOWN until every file it asked for has landed** — never add a placeholder image again.
**THE HQ**: `_hqEnter` opens `H.gate` before the build (the shell's sheets, the leaves, the props, the setting,
the natives', the population's and the walker's rigs all record); `_hqTickChars` sets `H.playerAttached`;
**`_hqGateTick`** (from `_hqFrame`) fires `onReady` — the card's fade — only when the walker attached (or has no
rig to wait for) AND the gate is idle, else at `HQ_GATE_CAP_MS` (75 s) naming what never landed; `_hqLeave`
closes the gate and **`_mqDropQueued(2)`** forgets the room's queued-but-unstarted BACKGROUND jobs (its
population, a warm — a job carries `drop` now: the cache entry is deleted, the record settles quietly, a later
request re-queues), so a left room never holds the next card. map.js `_hqLoadProgressStart` reads
**`ThreeRenderer.hq.gate()`** — `loading <room> · 12 / 48 files` + the bar (`#hqLoadFill`, index.html /
styles-base.css) — and a WALK's door-blink becomes the full card after `HQ_WALK_BLINK_MS` (700) when the next
room is cold. **THE MENU**: `_menuBuild` opens `M.gate`; the canvas stays at opacity 0 under the classic void
until the catalogue leaf is hot AND the gate is idle (`_menuGateTick` → `M.revealed`, `_menuShowCanvas` fades it
in over 0.9 s; `MENU_GATE_CAP_MS` 45 s reveals with the stand-in and a warning); `menu.revealed()`; map.js
`_hqWarmArrivalSoon` starts the walker's rig only after the reveal (the menu's own door first — the user: "how
can we load a floating pyramid but the door and frame load late"). **THE BATTLE**: `showBattleLoadingScreen`
opens `ThreeRenderer.assetGate('battle', { adoptLive: true, minMs: 1500 })` as a warmer and — 520 ms after the
card's fade-in, behind an OPAQUE card — runs **`_lsBoardBringUp()`** = the opening cinematic's own bring-up
(`renderBoard()` + `ThreeRenderer.activate()`), so every sheet, setting piece, roster model and rig the board
asks for is requested UNDER the card and counted in its bar (`prog.gate`); `finish()` closes the session;
`LS_MAX_WAIT_MS` stays the cap; the encounter / auto-sim / skip-visuals paths are untouched. **THE POPULATION
HALVED**: data.js `HQ_POPULATION_RULES` `perM2` 460 · `max` 4 · `facilityMax` 3 · `cityMax` 6 · `hqMax` 4 (every
extra is a 5–9 MB rig the card now waits for; the authored `npcSpots` are the room's design and stand). Dev:
`window._ewAssetLedger.gates()`. `npm test` runs mobile-performance.test.js (the ledger in a vm + the source
guards) and hq-population.test.js. NOT touched: the survey worker, the model queue's priorities, the retry.
UNSEEN LIVE (RULE #1c): the card's count on a cold cache (the hall is ~300 MB of GLB — the card will be HONEST
about it; `gltf-transform optimize` on the furniture is still the user's lever), the walk-blink turning into the
card, the menu's fade-in, the battle card's bar growing as the board asks.

## THE PREMIUM POLISH — THE LIGHT · AIR · PROP · CAMERA · POST PASSES over the building (2026-09-21, local delivery)
`PREMIUM_POLISH_PLAN.md` §9 has the full log; the sound pass (§4) is the user's. RULES that came with it: **(1) the
shared uniforms**: `_EW_HFOG` (the height fog) and `_HQ_AO` / `_HQ_AO2` (the room-box AO) are PLAIN OBJECTS shared by
reference into every material (three's cloneUniforms copies a plain object by reference, the vec4 setter reads .x .y
.z .w) — `_hqEnter` arms them (`_hqHeightFogArm` / `_hqAoArm`), `_hqLeave` and `_menuEnter` zero them, the battle never
sees them; the fog chunks are patched once at load (`_ewHeightFogPatch`, r128 names its depth `fogDepth`) and NO
ShaderMaterial in this repo may `#include` the fog chunks without declaring `uEwHFog` (the test checks the VFX file).
**(2) the shadow** is the room key's alone (`_hq.keyLight`, `_hqShadowArm` / `_hqShadowTick`): a new light branch in
`_hqEnter` names its key; a shell part that must never cast wears `_ew_hqPart` in `_HQ_NO_CAST_PART`; a mesh that lands
later is flagged by the 30-frame sweep. **(3) `_hqMat` / `_hqPropMatPick` wear `_hqAoHook`** — a material that must
not (a screen, a glow) passes `noAo: true`; the terrain field's `aAO` attribute must exist on EVERY geometry that
shares `_hqTerrainMat` (a missing attribute reads 0 = black). **(4) the tables are data.js**: `HQ_LIGHT_RULES`
(shadows · key · ao · heightFog · atmos — keys in step with the renderer's `HQ_LIGHT_DEFAULT`, premium-polish.test.js
diffs them), `HQ_ATMOS_SITES` + `hqRoomAtmos`, `hqRoomArrival`, `HQ_KICKABLE` + `hqPropKickable`, the catalogue's
`seat` / `sway` rows, `DOOR_HQ.lightShafts[room]` (+ the `light_shaft` proc), a look's `bloomThr` / `bloomRadius`,
`hqRoomFogHalfAt` (THE FAR END: a halls / ley / city plan's fog reaches 0.5 at ≤ 60 % of the diagonal — the test
insists). **(5) the walker modes**: `pl.sit` (E on a `seat`, any key stands — `_hqSit` / `_hqTickSit`, guarded in
`_hqTickWalker` for the skate vm) beside the ride / swim / climb; a kickable carries NO blocker (`_hqTickKicks`; its
disc follows flat). **(6) the post**: the building's bloom threshold is `HQ_BLOOM_THRESHOLD` (0.86) unless the look
says; THE AUTO EXPOSURE gain rides `_expLk` ONLY in the `hq` context (never the battle's day / night). Kill-switches:
`EW_HQ_NO_SHADOWS` · `EW_HQ_NO_AO` · `EW_HQ_NO_CONTACT` · `EW_HQ_NO_HEIGHT_FOG` · `EW_HQ_NO_SHAFTS` · `EW_HQ_NO_ATMOS`
· `EW_HQ_NO_SWAY` · `EW_HQ_NO_CAM_FEEL` · `EW_NO_AUTO_EXPOSURE`; readout `ThreeRenderer.hq.polish()`,
`ThreePost.getAutoExposure()`. `npm test` runs `premium-polish.test.js`. NOT built (the plan says why): 2.2 the hero
point-light shadow, 2.4 PBR (D2), 3.4 SSAO (D3), 5.2 read / toggle / open, 5.3 ripples, 5.4 reflectors, 5.5 decals,
6.4 motion blur, 7.1 LUTs (D8), 7.3 lens, 7.5 SMAA, the whole sound pass. UNSEEN LIVE (RULE #1c): the shadow's bias on
the cast rigs' faces, the frame rate in the cities with the map (`HQ_LIGHT_RULES.shadows.everyN` / the battle's Low tier
are the dials), the beam's strength (`HQ_SHAFT_GAIN` / `HQ_SHAFT_UW` are the edits; the battle's own god rays never drew their prism — the same uW arithmetic, a pool + motes), the height
fog's colour on the floor of a closed room (`shell.heightFog.amount`), the auto exposure's swing through a door
(`AE_MIN` / `AE_MAX` / `AE_EASE`), the arrival card over the real fonts, the sway on the real lantern GLBs.

## THE PREMIUM POLISH, THE SECOND PASS — the air thinned in the building, the wind, the ripples, the decals, the hero light, the transition, SMAA + the lens (2026-09-21, local delivery)
`PREMIUM_POLISH_PLAN.md` §9 has the full entry. RULES that came with it: **(1) THE TIERS** — `HQ_LIGHT_RULES.atmos` is
three densities (`facility` · `closed` · `open`), data.js `hqRoomAtmos` names the tier (`a.tier`: no site → facility, an
open wild shell → open, else closed) and the renderer reads it — a facility room breathes a few motes (≤ 40), the woods the
weather (≤ 720); tune the tier, never a room. **(2) THE WIND** — every HQ tree's leaf + bark material takes `_ewWindHook`
(the shared clock `_EW_WIND`, a plain object by reference like the height fog's; `_hqFrame` writes it) under `K.hq &&
!K._wdFog` only — never a battle rim tree (the world's fog / dissolve own their onBeforeCompile). **(3) THE RIPPLES** —
`_hqRippleEmit(x, sheetY, z, r)` is the ONE ring (a pooled quad on the sheet); `_hqTickRipples` reads the wader (the feet
under `_hqWetSheetAt` — a terrain fluid, a site / cave cell, never lava), the surface swimmer and the skiff; a plunge calls
`_hqRippleSplash`. **(4) THE DECALS** — data.js `HQ_DECAL_RULES.byKey` (a regex on a prop's key → kind + r), `.door` (the
WEAR patch inside every landing), `DOOR_HQ.decals[room]` hand rows (`{ kind | key: 'urban:<Name>', x, z, r, rot?, alpha? }`);
`_hqBuildDecals` runs after the atmosphere, refuses a slope, caps at `decals.max`; a new mark = a rule row or a hand row,
never a mesh in a builder. **(5) THE HERO LIGHT** — `_hqHeroShadow`: the first warm prop light (`shadows.hero.keys`) of a
room casts a cube map, ONE per room (`H.heroLit`); `shell.mood.hero: false` opts out. **(6) THE TRANSITION** — `_hqGoTo`
leaves the door you came through OPEN (`openT` 1 + `npcOpenUntil`) so it swings shut behind you. **(7) THE POST** —
`ThreePost.setAA('off' | 'fxaa' | 'smaa')` / `getAA()` is the ONE anti-aliasing switch (index.html loads SMAAShader +
SMAAPass; `setFXAA` maps onto it; localStorage `ew_aa`); a look's `lens: { chroma }` rides `uChromaRadial` under every frame
(`_lkLensChroma`). Kill-switches: `EW_HQ_NO_WIND` · `EW_HQ_NO_RIPPLES` · `EW_HQ_NO_DECALS` (+ the light pass's). NOT built:
2.4 PBR (no maps — the user), 3.4 SSAO (D3 waits on the real frame rate), 5.2 read / toggle / open, 5.4, 6.4, 7.1, §4.
`npm test` runs premium-polish.test.js (20). UNSEEN LIVE (RULE #1c): the plan's entry lists what to eyeball first.

## THE PREMIUM POLISH, THE THIRD PASS — THE POLISH SETTINGS · SSAO · MOTION BLUR · THE REFLECTORS (2026-09-21, local delivery)
`PREMIUM_POLISH_PLAN.md` §9 has the full entry. RULES that came with it: **(1) THE SETTINGS ARE THE CATALOGUE** — data.js
`HQ_POLISH_PREFS` (19 rows: key · label · hint · kind toggle | level | slider · def · scope hq | both · live · needs);
`hqPolishGet(key)` is the ONE read (the player's value, localStorage `ew_polish`, else the default), `hqPolishSet` the ONE
write; three-renderer.js reads a row BEFORE its EW_* kill-switch through **`_polishOff(key, flag)`** / **`_polishLevel(key)`**
(never a bare `W.EW_HQ_NO_*` at a polish site again), three-post.js through `_polishGet`; ADDING A POLISH = a row + a read at
its builder / tick (premium-polish-3.test.js fails on a row nothing reads). THE SHEET = ui.js `_buildPolishSettingsHTML`,
ONE collapsible group inside the shared `_buildVideoSettingsHTML` (the battle pause menu, the HQ pause menu's SETTINGS, the
main menu — never a second sheet); `window._setPolishPref` saves, then `ThreeRenderer.hq.polishApply()` (re-arms the
shadows / AO / height fog / reflectors in the room you stand in — `_hq.roomDef` — and shows or hides the shafts (`_ew_shaft`)
/ decals / atmosphere) + `ThreePost.polishApply()`. **(2) SSAO reads the composer's OWN depth**: `_ssaoAttachDepth` hangs a
DEPTH24_STENCIL8 `DepthTexture` on both composer targets and `_SsaoPass` (right after the RenderPass) reconstructs the scene
off it — never a second scene render, never an override material (skinned rigs would stand in their bind pose); the radius
is per context (`setSsaoScale('hq' | 'battle', units)`); `HQ_LIGHT_RULES.ssao`. **(3) THE BLUR** is the cinematic pass's
`uMotion` (every colour fetch through `fetchC`), fed only by the building (`_hqTickMotionBlur`: the deck past `fromV`, a fall
past `fallV`; the slider is the cap), zeroed by `_hqLeave`. **(4) A REFLECTOR is ONE plane per room** (`_hqBuildReflectors`:
the `puddle` decals' floor, the first `barber_mirror`'s glass; `HQ_LIGHT_RULES.reflect.max`): a small target drawn from the
camera reflected across the plane before the frame (`_hqTickReflectors` in `_hqFrame`), the surfaces hidden and
`renderer.clippingPlanes` set for the draw, the shadow pulse untouched, the target disposed in `_hqLeave`; the surface's
ShaderMaterial re-applies the room's exp² fog itself (no fog chunks — the height-fog patch owns those). `HQ_LIGHT_RULES` grew
`ssao` / `motionBlur` / `reflect` (the renderer's `HQ_LIGHT_DEFAULT` + its merge list in step). UNSEEN LIVE (RULE #1c): the
plan's entry lists what to eyeball first — the creases, the halo bias, the blur's onset, the puddles at night, the mirror's
handedness, the group's length in the pause frame.

## THE TEXTURE PASS + DISASTER CITY FILLED IN — the flicker, the banned sheets, THE INFILL, THE BOUNDARY WALLS, THE BACKDROP (2026-09-21, local delivery)
RULES that came with it. **(1) A SHEET IS RETIRED IN THE REGISTRY, NEVER BY HAND** (sprites.js TERRAIN_SPRITES + TERRAIN_BASE_TINT,
the marble / urban_street precedent): `metal_2` / `gunmetal_2` wear `gunmetal.png`, `metal_3` the aluminium sheet × `#8a949e`
(BLUED STEEL), `gold` / `gold_2` / `gold_3` the aluminium sheet × three warm tints (THE BRUSHED GILT — every board tile, monument,
trim, HQ shell and spell prop that names a gold key), `rock_wall_2` the cave rock. The keys stay (boards, rooms, the editor's
palette, the tests name them); the seven old PNGs stay in the bucket unreferenced. Never point a new row at metal_2.png /
metal_3.png / gunmetal_2.png / gold*.png / rock_wall_2.png again; rock_wall_1 (the glyph sheet) is for natural / ancient stone
only — never a man-made room. **(2) `_hzTex` resolves the D.O.O.R. HQ texture table** (`DOOR_HQ.textures` → `assets.textures`)
after TERRAIN_SPRITES and `urban:` — a terrain room's `cliff: 'concrete'` used to MISS and `_hqTerrainMat` fell back to
rock_wall_1 (THE GARAGE's every wall wore the glyphs); the fallback is the plain `cliff` sheet now. **(3) THE FLICKER**: a frame
strip stands PROUD of the plane it decorates (the door frames were coplanar with the jambs — `pd / 2 - 0.025`), a bridge deck
rides 2.5 cm over its data height at the mouths, and the key shadow's depth pass runs EVERY frame (`HQ_LIGHT_RULES.shadows.
everyN` 1 — an every-other-frame pass shimmers on every thin edge as the walker moves). **(4) THE INFILL** (data.js, the city
branch after THE OVERLAP SWEEP): the bare solid — block interiors, both sides of every alley / plaza / feature pocket, THE RIM —
is packed with axis-aligned lots on a lattice (`HQ_TERRAIN_GEN.city.infillPitch` 7.5, `infillRim` 14: a rim lot is tall, never
low), `infill: true` + `face: -1`, never a main front (a front on any edge onto open ground), ≥ 7.5 m from a door's pad;
`gen.infill: false` opts out. **(5) THE BOUNDARY WALLS**: the mask's whole boundary is traced (`_hqTTraceMaskWalls`) and every
run off a street face that is not a lot's face, a tier's cliff (seven samples along the run; a run climbing > 1 m is an edge
blend — a fence on it makes a wall top the walker can stand on = a trap) or a door's lane wears the district's fence
(`boundary: true` in `info.yardWalls`; readouts `info.gen.infill` / `.boundaryWalls`). **(6) THE BACKDROP**: three-renderer.js
`_hqBuildCityBackdrop` stands a skyline of map-builder prisms 4–6 m PAST an open city's shell on the outer ground (a gap round
every door; a tall block past each corner) — scenery only; `EW_HQ_NO_CITY_BACKDROP` / `terrain.backdrop: false`. Disaster City
is THE PRISM CITY (`texP` 0.22; the Grid / the Strip keep theirs). The Vatican's aisle is `carpet_4`. hq-city.test.js pins the
infill, the boundary walls and the rim. UNSEEN LIVE (RULE #1c): DOOR_HQ_BUILD_PLAN §9's entry lists what to eyeball first.

## THE RETRO-FUTURIST PASS — the curved shell, the kit, DOOR HQ · the Mall · the Spaceship (2026-09-21, local delivery)
The user's brief (five references: the TWA bridge, the orange conversation pit, the Palais Bulles, the Futuro, 2001's
console): "1960s era retro futuristic — rounded offices, windows, curved walls, groovy curved architecture, lava lamps;
DOOR HQ, the Mall, the Spaceship; make rooms bigger if need be". **THE CURVED SHELL**: a box room's `shell.round` (m)
FILLETS its four corners — three-renderer.js `_hqBuildFillets` (quarter-cylinder walls in the wall sheet, the dado and
the trims following the arc; every piece `_hqSweepStrip`, a profile swept along a path) — and the corner behind is
WALL by ONE exact rule, **`_hqInFillet`**, read by `_hqSurface` / `_hqAirOK` / `_hqCamBlocked` (never a blocker);
data.js **`hqShellInFillet(S, x, z, pad)`** is its twin (the finds refuse a corner) and **`hqShellDoorClearsFillet
(S, wall, at, half, margin)`** the door / wall-prop rule. `shell.cove` (the radius) = the wall meeting the ceiling in
a quarter-round along every wall and round every fillet (`_hqBuildCove`; `_hqInCove` keeps the boom out). Neither on
an open / cave / terrain / edge room. RULES: a door on a round room's wall ends ≥ 0.4 m before the fillet's tangent
point (the fillet radius is BOUNDED by the nearest door — reception 0.9, the bridge 2.3), a wall prop clears it, a
floor prop / spot / counter never stands inside one; `retro-futurism.test.js` fails naming the row. **THE KIT**
(`_hqProcBuilders` "THE RETRO-FUTURIST KIT — THE PROCS"; catalogue rows after `false_window`): `lava_lamp` /
`lava_lamp_floor` (the wax on a ticker; a light; `color` / `wax`), `sputnik_lamp` / `saucer_pendant` /
`disc_cluster` (ceiling lights), `mushroom_lamp`, `egg_chair` (the opening is +Z; a seat), `tulip_chair`,
`tulip_table` (`r`), `curved_sofa` (a 60° arc about a centre `r` IN FRONT — six rows make a ring, `face` toward
the centre), `porthole` / `pod_window` (`size`, `round`, `view`: sky · mountains · stars · space; the sky drifts —
`_hqPaneTex`), `retro_console` (2001's lamp bank on a ticker; the operator at +Z), `shag_rug`, `space_divider`,
`pod_bed`; doorhq's room-light regex counts the lamps. Looks `HQ_ROOM_LOOKS.retro` (the facility) / `.spaceship`;
the mall's retuned in place (an identity pin). THE ROOMS: the foyer, reception, Room 86 (15 × 12 — THE CONVERSATION
RING), the three wing lobbies (12 × 8 / 11 × 8), the penthouse (11 × 8), the corner office (a cove only), four floor
lava lamps in the hall; the spaceship's airlock / hold (17.5 × 14 — ten field cells, THE CRYO ROW) / bridge (16 × 12, THE CONSOLE BANK,
the nav counter at x 6.6); the mall's **THE FLIGHT TUBE** (`hqRingBridges` r 21 at y 4.63 — 3 cm proud of the
galleries, landing on their inner corners, open 215°–325° round the clock tower), THE LOUNGE rings, the pod windows
over the upper shopfronts (mount 8.6 / 9.2 — the shopfront band reaches ~8 m). A room variant's mood merges over a
sheet with NO mood (Room 86 keeps none — doorhq pins it). `npm test` runs `retro-futurism.test.js`. UNSEEN LIVE
(RULE #1c): DOOR_HQ_BUILD_PLAN §9's entry lists what to eyeball first.

## THE HDR BLOOM — the bloom is a property of light, never of albedo (2026-09-22, local delivery)
The user: "why does the bloom affect white things so badly? the sky in the city, the snow in Antarctica / the North
Pole — I have to turn the bloom all the way off just to see anything; I shouldn't see a glowing floor just because
the floor is white." ROOT CAUSE (three-post.js): the composer's target was 8-bit and every material tone-mapped
ITSELF (ACES + exposure in the fragment shader), so the frame the bloom read was clamped to [0, 1] — sunlit snow, a
white wall and a day sky sat at ~0.9, exactly where a lamp lens sits, and no threshold could tell them apart. NOW:
`_hdr` (half-float supported, no `EW_NO_HDR_BLOOM`) → the composer's target is `HalfFloatType`, the renderer's
`toneMapping` is `NoToneMapping` while the composer is up (`_recompileSceneMaterials` rebuilds anything compiled
before), the scene renders LINEAR light — a lit white can never exceed the light budget (sun 1.0 + hemi 0.45 +
ambient 0.38 ≈ 1.8 on a white albedo) while an emissive lens / an additive VFX stack / the sun's disc runs past it —
the bloom's own mip chain is retyped half-float (`_hdrBloomTargets`), every threshold site goes through
**`_bloomThrFor(ldrThr, base)`** = `_hdrEnc(BLOOM_HDR_LINEAR × min(1, ldrThr / base))` (`BLOOM_HDR_LINEAR` 2.0 —
THE ONE DIAL; a look's `bloomThr` / the LDR constants express a LOWER bar as a share of their default; the LDR
fallback keeps the old numbers), and **THE TONE MAP PASS** (`_toneMapPass`, right after the bloom, before DoF / AA /
cinematic / retro) does ACES (three r128's, verbatim) or linear × the same `toneMappingExposure` every site already
writes (`_tmSync` before both `_composer.render()`s), alpha through. The multiply decals' `toneMapped = false` now
does what it meant (the white multiplies the pre-grade floor). **`ThreePost.renderDirect(scene, cam, rect)`**: a
scene drawn straight to the canvas under the HDR chain is raw linear — the splitscreen panes (three-renderer.js
`showSplitscreen`'s pane loop) go through it (a canvas-sized half-float scratch target + the tone map quad in the
caller's viewport). RULES: never `renderer.render` to the screen from a battle / HQ scene while the composer is up —
`renderDirect`; a new post pass that reads LDR goes AFTER `_toneMapPass`; never write `_bloomPass.threshold =` bare.
The default strength is 0.3 under a fresh key (`ew_bloomStrength_v3` — the v2 values were workarounds for the bug),
the pause / settings slider steps by 0.01 (ui.js `step="1"`). THE DAY SKY's horizon band is a notch deeper
(`hor` 0.58,0.72,0.92 / `below` 0.48,0.56,0.68 — the pale near-white band read as a glowing strip once the fog
washed into it). `npm test` runs `hdr-bloom.test.js`; day-sky.test.js's horizon pin moved. UNSEEN LIVE (RULE #1c):
the whole look — a lamp lens vs the wall beside it, snow at noon with the slider at 1.0, an additive VFX stack's
roll-off under ACES (it lands brighter, then compresses), the panes' blit, iOS (half-float colour buffers).
`BLOOM_HDR_LINEAR` is the edit if a bright surface still glows (raise) or a lamp no longer does (lower).

## THE FRAME GUARD — the HQ loop survives a throw + the SMAA load order (2026-09-22, local delivery)
The user: "I cannot move at all inside DOOR HQ" after the seamless-field session. Headlessly (the repo scripts, stand-in
assets, the real path title → menu → intake → Play → the foyer, real key events; an encounter in the haunted hall and the
return) HEAD walked fine, and nothing in the three deliveries' diffs touches the walker — so the fault could not be named
from here. What WAS established: three r128's `renderer.setAnimationLoop` runs the callback BEFORE it requests the next
frame (WebGLAnimation.onAnimationFrame), so ONE exception anywhere in the HQ frame — a tick, a proc's ticker, a landed
model's hook, the post chain — ended the loop for good: the picture froze and every key was dead, exactly the report.
three-renderer.js **`_hqFrameGuarded`** (what setAnimationLoop takes now) runs `_hqFrame` under a try / catch: the error
is logged ONCE per message (`console.error('[HQ] the frame threw …')`, `window._ewHqFrameErrors`), map.js's
`onFrameError` toasts THE FRAME THREW · <message> · see the console, the scene is still drawn and the next frame comes.
**READ THAT FIRST on any "frozen building" report** — the console names the thrower; `_hqFrame` itself is untouched
(the source pins scan its body). Also fixed: index.html loaded `SMAAPass.js` BEFORE `EffectComposer.js` (which defines
`THREE.Pass`), so it threw "Class extends value undefined" on every page load and SMAA was never available — it loads
after the composer now. Token `20260922-hqframe-guard-01-cors`. Unseen live (RULE #1c): the user's own console.

## THE BUILDING IS 3D — the room that spawned nobody (`chars: 0`), the walker included (2026-09-22, local delivery)
The user: "I cannot move or look around inside DOOR HQ"; their console: `[HQ] entered foyer (box) — doors: 2 props: 31
chars: 0` and no `[HQ]` warning. ZERO characters = `_hqSpawnCharacter` returned null for the walker and everyone else,
and the ONE silent path to that is sprites.js `getRace3DModel` / `getCastModel` / `getRaceModelSkin` answering null
under **`window.EW_DISABLE_3D_UNITS`** (the board's "3D unit models" preference: Settings → Performance LOW, the
toggle, or Auto on a device that reads as mobile — index.html's boot block). The building has no sprite path, so
under that setting the room stood empty: no walker record → `_hqTickWalker` returns on its first line, the camera has
nothing to follow, the mouse is dead, nothing is logged. (The seamless-field rev 3 diff touches nothing on the spawn
path — the setting flipped on the user's machine, whatever flipped it.) RULES now (three-renderer.js): (1) the HQ
resolves its rigs with the flag LIFTED — `_hq3DOn()` / `_hq3DOff(was)` round `_hqSpawnCharacter`'s resolution, the
`_hqSpawnPopulation` call in `_hqEnter` (the roster / cast / skin reads inside), `warmAvatar` and `setAvatar`; the
board's own reads are untouched (a sprite board is still the player's choice); (2) a character that finds no rig is
NEVER silent — `[HQ] no rig resolves for <race> <gender> — <id> was not spawned` (a `[HQ]` warn); (3) the load
card waits for the walker's rig again (the gate's `EW_DISABLE_3D_UNITS` clause is gone). Read the flag first on any
"empty room" / "cannot move" report: `window.EW_DISABLE_3D_UNITS` in the console, `localStorage.ew_units3d` /
`ew_perfMode`.

## THE FLAT RINGS + THE CLEAN BOOT + THE BOOT DIAGNOSTIC (2026-09-23, local delivery)
**THE FLAT RINGS** (three-renderer.js `_fieldDrapeRing`): under a true-ground field the reticle and the
selected-tile marker are a FLAT PLANE again — lifted to the HIGHEST ground sampled under the ring's footprint
(capped half a tile off the unit's top) plus `RING_FIELD_LIFT × HL_FIELD_LIFT`; only the tile highlights
conform to the slope (the user's rule). The grid geometry stays (`RING_FIELD_SEGS` is one segment now).
**THE CLEAN BOOT** (battle.js `prepareBattleStateFromCurrentBuilds`, the block after `_finalizing = false` —
every launch path runs it): the loop's TRANSIENT latches are dropped on every boot — `_actionExecuting` +
its watchdog, `_blitzActiveUnitId` (a stale id parked the stall watchdog in its "active unit" branch, so a
match that never activated was never kicked), `_prevBlitzActivePlayer`, `aiThinking`, `pendingTarget`,
`uiDialog` (+ the overlay), the walk flag, the HUD's `_hrlgHoldUntil`, the arrival's timer + body classes,
the camera's seed hold, the AI safety / kick timers. The user's "second battle: no menu, no enemy, no
clicks" could NOT be reproduced headlessly (four endings, two launch paths — the two-fight probes in
PLAYTEST_NOTES "THE SECOND FIGHT"); this is the hardening. **THE BOOT DIAGNOSTIC** (`_afterVSSplash`): ten
seconds after the boot completes with no unit activated, ONE `[BOOT]` console line names every gate the
turn loop reads (`actionExecuting · roundAdvanceInProgress · pendingReplace · uiDialog · aiThinking ·
walkAnim · dying · cinematic · cameraBusy · bootPending · simul · spellLab · autoPlayers · controllers ·
order`) and kicks `maybeAdvanceTurn` once unless a dialog / a cinematic / a seat pick owns the frame — READ
THAT LINE FIRST on the next "the fight starts but nothing happens" report.

**THE BUILDING MERGE + THE INSTANCE PASS + THE WALK'S READOUT (OPEN_WORLD_PLAN.md Phase 0, 2026-09-26).**
Measured first (`measure_rooms.js`, repo root): Downtown drew 2,701 calls for 6,292 meshes, and the props
were NOT the bulk — the map-builder building prisms (`_nrSpriteBuilding`) drew a plane per storey per face
(~20 meshes a building). A face is now ONE mesh (a quad per storey, same vertices + UVs): 2,701 → 1,765.
THE INSTANCE PASS (three-renderer.js, before THE GATE; `HQ_STAGE_RULES.instanceMin` 2 / `instanceCell` 64)
batches, once the room is ready, the meshes that share a `_ew_shared` geometry and `_ew_shared` materials
(the misc cache + `_hqPropMatPick`) into one InstancedMesh per 64 m square; later files join as new batches
(2 s rescan). The originals stay (hidden, still raycast, still moved by their owners); `H.scene.onBeforeRender`
reads every copy back once a frame (hidden/detached ancestor → zeroed; changed material or an owner's
`visible = true` → handed back for good, `_ew_noInstance`), and a batch's matrix is scaled so the shared
geometry's bounding sphere covers the square (culling stays right for the camera AND the shadow map). Vertex
hooks other than `_hqAoHook` (which gained the `USE_INSTANCING` branch) keep a mesh out. `_hqLeave` drops the
batches (after `_hq = null`, before `_hqHandoverStash`) so the battle takes the originals as before.
Downtown with a stand-in GLB for every file: 2,299 → 1,931 calls. Kill-switch `window.EW_HQ_NO_INSTANCE`;
`ThreeRenderer.hq.dev.hqInst()`. THE READOUT: the FPS counter (Settings → Video) in the walk prints
`N CALLS · NK TRIS` summed over the frame's every render (`renderer.info.autoReset` off for the frame).
Test: hq-world-map.test.js (the pass on real three r128 in a vm; skipped without three).

**THE STAGE (OPEN_WORLD_PLAN.md Phase 1, 2026-09-26).** A staged room (a part of a zone in
`HQ_STAGE_RULES.zones`, today the city) builds its joined neighbours INTO THE SAME SCENE after it is ready:
the same builders, one step a frame, each into its own part record (`_hqPartFields`) under a root at the
neighbour's frame, `_hq` pointed at a stand-in while it builds (`_hqStageRun`). The record split is the rule
for every later edit: a key a builder writes that belongs to the ROOM stays out of `_HQ_ZONE_KEYS`; a key the
visit owns (the walker, the camera, the sky, the input, the light pass) goes in it, or the crossing will swap
it. A reader that asks about a point past the current box goes through `_hqStageSurface` / `_hqStageCam`
(the neighbour's own rules, in its metres). THE LAMP BUDGET keeps the count of lit point lights constant (a
change recompiles every material). The terrain field is 32 m tiles (`_hqTerrainTiles`; each tile its own
geometry — the battle's dig moves one mesh's vertices — with the whole field's normals). A neighbour attaches
only when its own gate is idle (the black-texture rule). Kill-switches: `window.EW_HQ_NO_STAGE`,
`window.EW_HQ_NO_TILES`. Measured headless (software GL ≈ 1 s a frame, stand-in textures): both Downtown
neighbours stood ~80 s after the card; the crossing itself is one frame. Test: hq-stage.test.js.

## THE SMOOTH ATTACH — the sliced build, the warm-up, the static batch, the bitmaps (2026-09-27, OPEN_WORLD_PLAN Phase 11, zip 14)
Full entry: OPEN_WORLD_PLAN.md §12 "PHASE 11 SHIPPED". What a later thread needs:
- **The slice**: `_hqBuildTerrain`, `_hqBuildOuterGround`, `_hqPlaceProps` are generators inside. Set `_hqSliceAsk = true`
  just before the call to get the iterator back; otherwise they drain themselves (the old synchronous behaviour).
  A new heavy loop inside them should add `if (_hqSliceDue()) yield;` (it is a no-op outside the stage's slice,
  `_hqSliceEnd` 0). A nested builder that is itself sliced is called with `yield*`. Budget: `HQ_STAGE_RULES.buildMs`.
  `hq.stage().parts[id].slice` shows frames, units, the longest unit and frame.
- **The warm-up** (`_hqWarmNew` / `_hqWarmRun`): a built part attaches only after its programs compiled under the
  lamp pick it will draw with (`_hqStagePick`). A new stage step that adds lights must go through `_hqStagePick`, or
  the warm-up compiles for the wrong light count and the attach stalls anyway. `HQ_STAGE_RULES.compileMs` (optional).
- **The static batch** (`_hqBatch*`, `hq.batch()`, `EW_HQ_NO_BATCH`): originals stay in the scene and hide only during
  `renderer.render`. To animate or recolour a shell mesh after attach, just do it: the watchdog breaks its batch
  within 500 ms. To opt a mesh out up front, give it one of the `_HQ_BATCH_FLAG_OFF` keys, a custom
  `onBeforeRender`, or `frustumCulled = false`.
- **The bitmaps** (`_texBmpOk` / `_texFetch` `o.bitmap`): Chromium only, walk sheets only; `EW_NO_BITMAPS` off.
- Test: `hq-attach.test.js`. A vm test that extracts `_hqStageRun` must also extract `_hqStageTZone` (and
  `_hqStageLamps` needs `_hqStagePick`).

## THE PORTALS + THE MEMORY BUDGET (2026-09-28, WORLD_GEOGRAPHY_PLAN G1 = OPEN_WORLD_PLAN Phase 12, zip WORLD_GEOGRAPHY_1)
- **The portals** (`_hqCull*` in three-renderer.js, beside the stage ring; ticked right after `_hqStageTick`). A
  neighbour joined ONLY by door spans (`_hqCullCand`) is hidden with `partRoot.visible = false` (kept built, attached,
  ticked) while every door toward it is shut (`_hqCullShut`: leaf landed under `rec.leafG`, `openT` 0, not see-through,
  walker beyond swing + 0.75 m) or its doorway box is off screen (`_hqCullSees`). `_hqCullWant` is the pure rule (the
  tests' truth table). Off unless the current part is a closed box with the eye inside, every other staged part is a
  closed box, and the room has no mirror. A part with a spot / sun / shadow-casting lamp is never hidden.
- **The light count.** Hiding a root drops its lamps from three's point-light count and would recompile every program.
  `_hqStagePick` counts a hidden root's lamps anyway and returns `pad`; `_hqStageLamps` lights that many dark pads
  (`hq_cull_pads` group in the scene, intensity 0, `_ew_cullPad`); `_hqWarmNew` drops pads from "now" and adds them to
  "next". Resets: `_hqStageSwap` (top), the `_hqStageAttach` detach branch, `_hqLeave`, the switch.
- **The memory budget** (`_mm*`, before `_miscModelInstance`). `_miscModelCache` entries carry `at` (Date.now: the vm
  tests have no `performance`) and `bytes` (`_mmBytes`). `_mmTick` every 4 s in the walk; over budget it gathers live
  geometry uuids (`_mmLive`: the walk scene, every stage part, the battle scene, the menu, the hand-over) and drops via
  `_mmPick` / `_mmEvict`. A file the spells took through `_oneFileGltf` is marked `_ewOneFile` and never dropped. A
  dropped file a stray clone still draws re-uploads from its arrays (three re-creates buffers), so a missed holder
  costs a hitch, not a black mesh. `_mmRead` = `hq.mem()` / `perf().mem`; `_mmLine` = the readout's MEM part.
- Switches: `window.EW_NO_PORTALS`, `window.EW_NO_MEM_BUDGET`, `window.EW_MEM_MB`. Tests: hq-joins, asset-store.

## THE RENDERER PLAN R1 — three.js r128 → r147 (2026-10-02, zip renderer/ENTROPY_WARS_R147.zip)
RENDERER_PLAN.md is the plan of record for the three.js upgrade (R1 r147, R2 current + the module shim, R3-R7 the
add-ons); its §9 is the log. R1: index.html's three.js + the ten `examples/js` add-ons move to 0.147.0 on jsdelivr
(the last release that ships `examples/js`; the UMD `three.min.js` is gone from npm at r160, so R2 is the module
shim). three-renderer.js `_ewHeightFogPatch` now reads the fog varying's name off `ShaderChunk.fog_vertex`
(`fogDepth` in r128, `vFogDepth` from r129) and warns when no anchor bites — the r128 string would have no-op'ed
silently and dropped the HQ height fog. The audit script (r128 vs r147, every `THREE.*` name + every shader string
our `onBeforeCompile` hooks replace) found nothing else; `getInverse` / `RGBFormat` / `getMaxAnisotropy` were already
guarded. The sandbox load check runs playtest_hq_offline.js with the mirror regexes pointed at `three@0.147.0`
(`npm i --no-save three@0.147.0`): REV 147, fog patch in both chunks, the post stack renders.

### R1b — the two r147 breaks the audit missed (2026-10-02, zip renderer/ENTROPY_WARS_R147B.zip)
mondo's first r147 playtest: rigged models missing, textures flickering, the city blown out. (1) The triplanar
terrain hook (`#include <map_fragment>` replacement) called `mapTexelToLinear()`, gone since r136 (the GPU decodes
sRGB textures now): the ground program failed to compile, the ground vanished (the sky + bloom washed the frame),
and the invalid program drew with whatever was bound before it (the flicker). Dropped the call. (2)
`SkinnedMesh.boneTransform(index, target)` reads the vertex FROM `target` since r129 (r151+: `applyBoneTransform`);
`_skinnedBBox` passed an unset target, the box collapsed and the fit scale went ~5000× (units 130 m up). Now
`v.fromBufferAttribute(pos, i)` first and `applyBoneTransform` when it exists. Sandbox repro: the offline harness
with CDN assets routed through the proxy (`route.fetch` + ACAO) and `VER=` picking the three.js tarball; battle
units on r128 measure world scale 0.77, on r147 5364 before the fix. Details + the lesson: RENDERER_PLAN.md §2.

## THE RENDERER PLAN R2 — three.js r147 → 0.186.1, the module shim (2026-10-02, zip renderer/ENTROPY_WARS_R186.zip)
One copy of the current three.js, loaded as ES modules: index.html's import map (`three`, `three/addons/`) now
points at 0.186.1 and an inline `<script type="module">` shim, where the r147 script tags were, imports three plus
the add-ons the game uses (composer, Pass + FullScreenQuad, Render/Shader/UnrealBloom/SMAA passes, the shaders,
CSS2D, OBJ/GLTF loaders, SkeletonUtils, MeshoptDecoder), copies the frozen namespace into a plain object, hangs the
add-ons on it under the examples/js names (`THREE.Pass.FullScreenQuad` too), sets `ColorManagement.enabled = false`
and assigns `window.THREE` / `window.MeshoptDecoder`. Every game `<script src>` carries `defer` (a module script is
deferred, so the game scripts must be too, to keep running after it in document order); the three inline blocks that
test a deferred script's globals (data.js fallback, sprites fallbacks, the first-launch profile hook) are modules now.
The menu sky shader shares that copy (it was a second, r160 one). Rules for the look, all in three-renderer.js:
`_ewTexSetSRGB` / `_ewTexIsSRGB` / `_ewTexCSKey` wrap `encoding` ↔ `colorSpace` (both spellings work, so the file
still runs on r147); the board renderer pins `outputColorSpace = LinearSRGBColorSpace` (r152's default is sRGB), the
creator viewer sRGB; `_ewLegacyLightPatch` (revision ≥ 155) puts r128's light maths back into `lights_pars_begin`
ONCE at load (× π on every light colour, the linear fall-off ramp, lightmap × π) and swaps `THREE.PointLight` /
`THREE.SpotLight` for subclasses whose decay defaults to 1 — no light construction changed. three-post.js: `_SsaoPass`
is a class extending `THREE.Pass`; the shadow type reads the chunk for `SHADOWMAP_TYPE_PCF_SOFT` and picks PCF when
it is gone (0.186.1 removed PCFSoft; its PCF samples a hardware shadow sampler = the soft look). Two breaks only the
load check found: the current three.js declares `vUv` only for anisotropy (maps read `vMapUv`), so the water hook on
MeshLambertMaterial carries its own `vEwUv` varying now; and `_skinnedBBox` gated on `typeof n.boneTransform` (gone
since r151) — rigs fell to the naive box and the fit scale went 94×; the gate accepts `applyBoneTransform`. The
creator viewer's deprecated `THREE.Clock` is a two-line delta timer. BatchedMesh for the static batch is R2b.
Sandbox check: probe_r186.js / probe_field_r186.js (the R1b probes with the mirror regex `three@0.186.1/(.+)` →
the npm tarball; modules need no special content type) — REV 186, the fog patch in both chunks, no failed program in
the rotunda, the city or a battle, rigs at the r147 scale. Details + the audit: RENDERER_PLAN.md §2 and §4.
Hotfix the same day (index.html only): the `modulepreload` links must come AFTER the import map — a module fetch that
starts first voids the map, and Firefox then refuses the bare `three` specifier (no window.THREE, every game script
dead at parse, the raw party builder DOM showing with no title). Chromium tolerated it; the sandbox check missed it.

**R2 follow-up (2026-10-02, after mondo's playtest):** bloom OFF by default — three-post.js `BLOOM_USER_STRENGTH = 0`, pref key
`ew_bloomStrength_v4` (the old key's 0.01 is ignored), and `_bloomUser()` returns 0 while the player has it off so neither a
scene look's `bloomStr` nor the HQ floor (0.42) can switch it back on; the slider still raises it. The grey vertical bar
on the main menu was Firefox's classic scrollbar on the overflowing `.mm-buttons` list (15 doors in a short window):
styles-base.css `scrollbar-width: none` + the webkit twin, and `.mm-label` is `white-space: nowrap` (PLAY VS CPU wrapped).

**R2 follow-up 2 (2026-10-02, "the grey horizontal bars"):** the menu scene's FogExp2 colour was the biome's pale haze
(`B.fog[0]`), the dome's fog band (`uFogTop` 0.04, pow 1.6) never reaches the horizon, so the 350 m ground sheet ended in a
pale strip across the dark sky, the ice ridges as lighter blocks inside it. `_menuHorizonColor(env, night)` = the dome's
`deepLo` at that night plus the nebula's mean lift; the ground and `scene.background` fog to it. Same on r147 (checked with
the reference probe), so a design seam, not an r186 regression.

**R3 KTX2 textures (2026-10-02, RENDERER_PLAN §9):** `npm run optimize -- <dir> --ktx2` (needs `npm i --no-save ktx2-encoder@0.6`
besides the usual gltf-transform deps) writes `.opt.glb` files whose textures are KHR_texture_basisu; `npm run manifest` marks
them `[bytes, sha, 1]`. three-renderer.js "THE KTX2 TEXTURES" (`_ktxLoader`, `_ktxDetect`, `_ktxWait`, `_ktxCpuRead`) loads a
flagged sibling only when the page's KTX2Loader is up and the GPU has a compressed format with an sRGB variant; else the
original .glb. Off switch: `window.EW_NO_KTX2`. Anything that draws a GLB texture into a canvas must call `_ktxNoCompress(url)`
before loading it (the creator hair does). F3 lens line "KTX2 textures".

**R3 second pass (2026-10-28, mondo: "compress the rest of the 3d models"):** 118 more GLBs baked the R3 way (`--ktx2 --check
--flat <mirror>/Assets/opt --root <mirror>`, 365 MB → 127 MB): every model the game loads that the 10-02 manifest missed (the
10-24..10-28 race looks, frankenstein, the 21 new props, space props, wings, unicorn horn, stairs packs, the animals / insects /
instruments / traps / jellyfish GLBs, retro trees). ASSET_MANIFEST.json is now COMMITTED in the repo (the live 431 + these 118,
549 `alt` rows; it was an empty stub), so it no longer counts as an R2-only file: rebuild it by merging, never from a partial
mirror (`npm run manifest -- <dir> --merge` drops every old row under the scanned prefix). Left out on purpose: the 170
per-character `_biped_Animation_<Clip>_withSkin.glb` exports (1.36 GB; loaded only when the animation library fails — no def
sets `noAnimLib`; the voidweaver spider's own clips are the exception and are baked), 8 tiny files the tool kept or refused
(camera_01 grew, PSX_lion, 3 PSX doors, ladybug lost its bones in the check, crow/rabbit point at a missing textures/atlas.png),
and every FBX / OBJ / DAE (the tool is GLB-only: the ocean pack, Spear.fbx, elephant, UFO_Low_Poly, eyeball, street lamp,
Christmas.dae, the car pack, the bats). Gotcha seen in the sandbox: three failed `.opt.glb` fetches set
`window.EW_NO_OPT_ASSETS` for the rest of the page (by design), so a flaky link makes later models load their originals.

**R5 pmndrs postprocessing (2026-10-02, RENDERER_PLAN §9):** three-post.js runs on pmndrs `postprocessing` when index.html's
module sets `window.EW_PP_LIB` (else, or with `EW_OLD_POST` / localStorage `ew_post = 'classic'`, the old three.js chain).
Two merged passes (A: AA + AO multiply + bloom + tone map; B: cinematic + retro) around the DoF. N8AO = Polish row
`ssaoMode` (data.js). F3 "Post" line. `ThreePost.getPostChain()` reports the chain.

**R6 GPU text, HQ plates (2026-10-03, RENDERER_PLAN §8/§9):** the HQ's door / way / portal / counter / trail plates are
troika-three-text rows in the scene when index.html's module sets `window.EW_TEXT_LIB` (else, or with `window.EW_NO_GPU_TEXT` /
localStorage `ew_text = 'css'`, the CSS2D plates). three-renderer.js "THE GPU PLATES": `_hqPlateMake(cls, parts, o)` is the one
builder (returns `{obj, el, chip, gpu}`); records carry `plateGpu` beside `plateEl`; `_hqGpuPlateSet` / `_hqGpuPlateChip` /
`_hqGpuPlateShow` / `_hqGpuPlateOp` / `_hqGpuPlateFace` are the GPU side of the DOM writes. Anything new that labels a place IN
the HQ should use `_hqPlateMake`. Unit nameplates and damage numbers stay DOM overlays on purpose (§8). F3 "Text (HQ plates)" line;
`ThreeRenderer.hq.dev.hqText()` for probes.

## THE RENDERER PLAN R7 — the batched particles (2026-10-03, zip renderer/ENTROPY_WARS_R7_PARTICLES.zip)
three-vfx.js "THE BATCHED PARTICLES": the sprite / world / quad pools draw as InstancedMesh groups (one per pool, blend, texture)
instead of one Sprite or Mesh (and one draw) per particle. Full write-up in RENDERER_PLAN.md §8 + §9. Off: `window.EW_NO_FX_BATCH`
or localStorage `ew_fxbatch = 'off'` (reload). Anything that reaches into a pool entry's `.sprite` / `.mesh` / `.material` must
guard: in batched mode the entries are bare `{ inUse }` slots.

## THE WEBGPU SWITCH — WEBGPU_PLAN W0 (2026-10-03, zip renderer/ENTROPY_WARS_W0_SWITCH.zip)

`?ew_gpu=webgpu | webgl2 | webgl` (sticks in localStorage `ew_gpu`; default webgl = nothing changes). On the
two node modes index.html document-writes a module that loads `three/webgpu` into `window.THREE_GPU`, and
three-renderer.js `_ewMakeBoardRenderer` builds a WebGPURenderer (`forceWebGL` for webgl2) for the board only.
`_ewGpuCompat` stubs capabilities/extensions, guards render/clear until `init()`, swaps ShaderMaterials for
plain stand-ins in the render-object hook, copies the shadow pulse onto per-light flags, registers the legacy
light classes. three-post.js: no post on the node renderer. F3 lens + `?ewdiag=1` name the backend. The picture
is plain on purpose: W0 measures the frame only. Full list of what changed from the plan: WEBGPU_PLAN.md §10.

### W0 fix 1 — the shared buffers (2026-10-03, zip renderer/ENTROPY_WARS_W0_FIX1.zip)
`webgpu` froze on Firefox: three 0.186.1's WebGPU backend destroys an interleaved attribute's shared InterleavedBuffer
on a geometry dispose and keeps the dead buffer on file ("Buffer with '' label has been destroyed"). `_ewGpuSafeBuffers`
leaves interleaved buffers to the GC and defers other destroys to the next frame's first render. F3's Renderer line
counts uncaptured GPU errors. Drop it when three fixes WebGPUAttributeUtils.destroyAttribute.

### W6 — the render bundles (2026-10-03, zip renderer/ENTROPY_WARS_W6_BUNDLES.zip)
Downtown on WebGPU cost 12.7 ms CPU vs 6.0 classic (three's per-draw cost). three-renderer.js `_ewBunTick` flags the
HQ's static groups as bundle groups in place (WebGPU backend only), re-records them from a per-frame signature, records
unculled, runs bundles after the backdrop (negative renderOrder) and before everything else (W6 fix 1: run first, the
camera-centred env ground painted over the hall's lower walls), re-records a group whose recording skipped a draw
because its pipeline was still compiling (W6 fix 2: the warm-up's compile is compileAsync on WebGPU), bumps an epoch on every freed GPU resource, and keeps three's bundle bookkeeping across a nested render (W6 fix 3: the shadow pass renders inside the first recording and cleared it, so the static batch's walls replayed with the first frame's camera). Full rules: WEBGPU_PLAN.md
§10 "W6 built". `ThreeRenderer.bundles()`; off with `?ew_bundles=0`.

### W2 — the shader programs (2026-10-03, zip renderer/ENTROPY_WARS_W2.zip)
Every hand-written GLSL program has a TSL twin the node renderer swaps in, keyed by its fragment source (three-renderer.js
"THE NODE PROGRAMS", `_ewProgs`); the twin reads the classic material's own uniforms, so the game still writes the
classic material. Other files register with `ThreeRenderer.nodeProgram(fs, key, fn)` (three-vfx.js ambient,
three-vfx-effects.js flame / energy / orb, three-lightning.js MeshLine). Sprite Points draw through an instanced quad
proxy (`_ewPointProxy`; WebGPU points are 1 px). A NEW ShaderMaterial needs a twin or it draws as a flat stand-in on
WebGPU. Console: `ThreeRenderer.nodePrograms()`. Details: WEBGPU_PLAN.md §10 "W2".

### THE WARMED TWIN (2026-11-12, the foyer's one `Material "ShaderMaterial" is not compatible` line)
The line came from the room warm-up, not from a missing object: `_hqWarmRun`'s renderer.compile is compileAsync on the node
renderer, and compileAsync calls `renderObject` straight, past the draw hook that swaps a ShaderMaterial for its twin. The
foyer's dust motes (`atmos:dust`, a Points ShaderMaterial) were warmed raw: three logged the line once and the twin the real
draw uses was never warmed (the motes always drew, through the hook). The `r.renderObject` wrap in `_ewGpuCompat` now gives an
unswapped classic shader material the same twin / point proxy. Any future "is not compatible" line: log the object in that wrap.

### W1 — the material layer (2026-10-03, zip renderer/ENTROPY_WARS_W1_MATERIALS.zip)
The node renderer draws the GLSL hooks' effects: the legacy light levels, the height fog, the room-box AO, the terrain
sheets, the fluid tops (waves, caustics, glints), the three sways, the creator's vertex-colour glow, the backdrop's horizon
band, the world dissolve and the batched particles' opacity. three-renderer.js `_ewNodeDress` dresses the node copy of
each hooked material (by hook identity or the factory's `_ewNode` tag; layer hooks carry `_ew_base` / `_ew_layer`).
A new GLSL hook needs a dress here too or it draws plain on WebGPU. `ThreeRenderer.nodeLayers()`. The grade is W3.

### W3 — the post stack (2026-10-04, zip renderer/ENTROPY_WARS_W3_POST.zip)
three-post.js "WEBGPU_PLAN W3 — THE NODE CHAIN": on the node renderer the post is one three `RenderPipeline` per shape
(`aa|ao|BDF`, cached): scene pass → AO (the classic SSAO ported, or GTAO for the "N8AO" row) → bloom (`BloomNode`, off
by default) → (no tone map: the classic post never tone-mapped, W3 fix 1) →
SMAA / FXAA → tilt-shift DoF → the Cinematic / Retro frame (one TSL `Fn`, model-only mask) → canvas. The rest of the
file drives stand-ins with the old shapes (`_bloomPass`, `_cinematicPass.material.uniforms`, ...), so every set* still
works. Auto exposure reads back async; `renderDirect` tone-blits per pane. Two traps found on the way: three's node
effects clear the render-object hook while they run (three-renderer.js re-arms it for the nested scene render, or no
shader twins / point proxies / shadow pulse inside the chain), and three 0.186.1 re-uploads only the FIRST attribute of
an interleaved geometry after a dispose (`_ewGpuInterleaveFix`; every Sprite shares one quad, so one disposed sprite hid
every light halo). No TRAA yet (W8 brings the velocity pass). `?ew_gpu=webgl` stays the reference look.
W3 fix 1 (main menu too pixelated + too dark): the retro grid now follows the canvas size once the chain has loaded;
the chain no longer tone-maps (classic WebGLRenderer r153+ tone-maps only straight to the canvas, so the classic post
look never had it; `_hdrSupported` was always false since `NoToneMapping` is 0); and a node dress must not read
`normalWorld` / `normalView` inside `setupDiffuseColor`: it builds three's once-only lit normal early and the direct
lights go dark on that material. Use `normalWorldGeometry` there (the `_hqAoHook` twin did this to every HQ wall and floor).

### W4 — the libraries and the edges (2026-10-04, zip renderer/ENTROPY_WARS_W4.zip)
On the node renderer the HQ plates are canvas-painted planes (`_hqCvPlate` / `_hqCvPaint`, same rows as the troika
plate, fonts from `document.fonts`); troika is WebGL-only. Clip planes: a material's `clippingPlanes` become discards
(`_ewNodeClip`), the reflector's mirrored draw uses a `ClippingGroup` (node three ignores `renderer.clippingPlanes` and
material planes). A lost WebGPU device rebuilds the board renderer in place (`_ewGpuRebuild`, `ThreePost.swapRenderer`,
max 3 a session; console `ThreeRenderer.gpuRebuild()`). The quarks row is hidden on the node renderer; the AO row
reads GTAO there. Sandbox trap: at ~2 fps with the proxy, a room's textures can take 30+ s, so its walls read black in
an early shot on BOTH branches; wait before comparing.

## THE NEAR ROOTS — the green props in the battle's room (2026-10-04, zip haunted-props/ENTROPY_WARS_HAUNTED_PROPS.zip)
mondo (Haunted House arena, WebGPU): the shrubs, rock pillar, sign post, trees and stump drew as flat green silhouettes, the
rim props too. Cause (both renderers): the battle's room (`_hqBuildRoomInBattle`) and the near setting (`_hzRunNearBuilder`)
sit in `_horizonGroup` and tagged their materials `_ew_hzNear` once, at build. GLBs that landed later (the room's Meshy props
and doors, the retro trees, `_hzMiscKit` snags/stumps) came with fresh untagged materials, and the next `_applyHorizonFog`
pass gave them the altitude fog meant for the far roster. Seen from the battle camera (looking down) its band is full, so
each drew as 95% of the retro fog colour (green preset 0x2f4d3f). Fix: both groups carry `_ew_hzNearRoot`; `_applyHorizonFog`
walks the tree and tags anything under such a root as near instead of fogging it. Same delivery: `garden_ring` (Room 1618 and
the haunted grounds) set its cobblestone UVs to ground metres (1.2 m a stone) — a RingGeometry's UVs span its diameter, so
the old 8 × 1 repeat stretched every stone. Latent, not fixed: the hzfog hook's closure has one toString for every base hook,
so on the node renderer two hzfog materials over different bases can share a build (three's cache key strings functions).
NO MESHY TREES (same day, mondo: "i dont even want to use that meshy tree anywhere in the game"): the catalogue rows dead_snag,
hollow_dead_tree, pine and hollow_tree are retro-pack files now (`base: 'rt'` = Assets/foilage/retrotreepack/GLB/, read by
_hqModelUrl and the held-prop loader); the near settings' snag / dead tree / hollow tree are `_nrTree` retro trees; the tree
WAYS (hollowtree / deadtree) keep their procedural trunk with the hole (no GLB over it); the four Meshy files are gone from _MISC_GLB.

## NO LIGHT BOX (2026-10-04, mondo: "lets get rid of this light box thing around the cube ... it looks like shit")
- The cube glow shell went in PR #92 (other thread); this note covers the shafts.
- `_buildLightRays`: the battle god-ray box shafts + floor pools + motes are no longer built (it clears any old group and returns).
- `_hqLightShaft` returns null: DOOR_HQ.lightShafts rows and the `light_shaft` catalogue prop draw nothing (same box beam).
- Don't bring any of these back.

## THE BUNDLE CONTENTS FIX (2026-10-05, arena floor over a dug unit)
mondo: "in the battle arena my unit is at lower elevation but the floor is still drawn above them". On WebGPU (ew_gpu=webgpu)
the field bundles (W5a round 5) replay the room's floor; a dig deforms that floor IN PLACE (_fieldDeformMesh writes new
positions + needsUpdate), so _ewBunGeo's structure hash (ids + lengths) held, the group stayed `static`, and three skips
geometries.updateForRender for a static bundle (three.webgpu.js NodeMaterialObserver.needsRefresh) — the new vertices were
never uploaded. Fix: every attribute/index `version` is now part of the VALUES hash (_ewBunGeo → g._ew_bunV, mixed into hv
by _ewBunObj): a static group re-records once, a group whose buffers keep moving is demoted to non-static (three's own check
uploads them). WebGL was never affected. Token 20261005-arenafloor-01-cors.

## NO LIGHT BOX, THE WHOLE GAME (2026-10-05, mondo: "get rid of all of those lights in the game, they look like absolute shit")
Every fake light volume (additive/see-through shafts, beams, cones, wedges, veils in openings, glow shells, floor light pools)
is gone from three-renderer.js; grep `NO LIGHT BOX (mondo 2026-10-05)` for each site. Real PointLight/SpotLight objects and
spell VFX stay. Sites: the battle intro crossing + main menu door (`_introBuildDoor`: veil, halo, wedge, pool, leaks);
battle door deployables (`_buildDoor3D` veil, `_captureDoorDress` glow/shim/floor, `_standingDoorDress` lit pane -> dark
tinted pane, god rays, hell lip, gust fan, floor), grave gate sheet -> dark, tesla corona, healing totem cone, crystal shells;
horizon/setting props (`_hzLoneDoor` veil+wedge+core, `_hzGateway`/`_hzGoldGate` veils, `_hzLightPillar` empty, saucer cones,
inner-sun shaft, holo pyramid/apron beams, tome cone, Luxor sky beam, cyberpunk/strip wet sheens, grin-skull pool, igloo door,
rose-window disc, crystal shard shells, grey tube shell, horizon lighthouse planes); HQ (`_hqSeaArm` god rays, submarine
cones, lighthouse cones, temple dome shell, gun-door pane+glow+lane cone (SpotLight kept), Threshold portal pane+mouth glow
(rim kept), dash-door pane, upwelling shaft, battle marker / heal zone columns, way openings (wardrobe, closet, train,
timemachine = dark backs; taxi, well, pool, gutter, tree hole, mirror, painting, screen = sheet/glow not added), void-island
floor glow, cine-void actor pools, HQ cube glow, heaven-stair gate glow, garage-ramp haze). Kept: sanctuary/nexus zone
walls (gameplay markers), action tile glow (attack/spell), derelict engine exhaust plumes, small bulb halos. Never bring back.

## NO STAND-INS (2026-10-05, mondo)
mondo: fallback models/geometry "look like absolute shit ... completely deleted from the game, never shown again. i would
rather the spells load without a model". Cause: spell props loaded only on first cast (the battle card warmed only
basic-attack props, the party builder warmed nothing), so `_wpnInstance` returned null and the procedural stand-in drew.
- three-vfx-effects.js: every load-time procedural prop (swords, guns, UFO, cannon, arrows, rocks, cars, moon, missiles,
  mushrooms, crowns, gates, clouds, jets...) is gone; a missing model draws nothing (empty Group). Kept: finisher
  choreography bodies (capsule victims), glows/particles/debris. `warmSpellLibrary(onProgress)` loads all `_WPN_MODELS`,
  the spell misc GLBs (`TR.warmMiscModels`, pinned), the sedan and terrain sheets once; textures capped at 512 (1024 for
  big props) via the new `texCap` on `TR.assetGltf` / `_capModelTextures` to keep M1 memory sane.
- battle.js: the loading card waits on warmSpellLibrary (label LOADING SPELLS), LS_MAX_WAIT_MS 90 s.
- party-builder.js: warms the library + every roster vessel on open; a clicked preview waits for it, hover skips.
  HeroViewer3D shows the 2D fallback only for vessels with no 3D model.
- three-renderer.js: units draw nothing (no sprite slab) while their GLB loads; a final load failure rebuilds with the
  2D sheet. HQ/board procedural stand-ins hide at once or were deleted (intro door panel, bone pile, grin skull, key,
  nr tree, canopy stand-in, vehicle proc). Modelled projectiles fly as an empty carrier until loaded.
Cultist summon (follow-up): the procedural robed figure is deleted; it wears the cult1 cast rig (posed on idle frame 0), warmed by warmSpellLibrary via TR.warmSummonModels.
Leftovers: PERF_LOW scenery kits, encounter fights have no loading card.

## THE SPELL FREEZES (2026-10-07, mondo: "frame rate and frozen screen issues for spells that change the whole screen. combos and entropy strikes too")
Root causes found and fixed (token 20261007-spellfreeze-01-cors):
- **CSS grades over the canvas.** battle.js `cineGrade` (sepia / desat / invert / hue / terminal) was a full-screen
  `backdrop-filter` element; cool / crimson / sepia / terminal tints were `mix-blend-mode` layers; the flashback, the trip and
  the freeze-frame tell wrote CSS `filter` onto the canvas every frame (three-vfx-effects.js). Firefox re-composites the whole
  canvas offscreen for each of those, every frame. Now THE SCREEN GRADE: three-post.js `screenGrade / screenGradeClear /
  screenGradeFreeze / canScreenGrade`, uniforms uCssA/uCssB/uCssT1/uCssT2/uCssM in the cinematic pass (GLSL + the node TSL
  twin, same maths, checked equal on one pixel). The DOM keeps only plain layers (dim, bone white, heat, whiteout, vignette,
  scope, speed lines). CSS filter path stays only as the Post FX off fallback.
- **The frame pass's first use.** A spell grade / drama dim / ripple switches the cinematic frame pass on: node chain = a new
  RenderPipeline (key ends in F) built + compiled mid-cast; pmndrs = pass B's shader + pass A's to-target variant compiled on
  first draw. THE FRAME TWIN: the first frame each set draws without the frame, its frame twin is drawn once first (both halves
  off, identical picture) so the pipelines exist before any spell.
- **Entropy Strike bloom.** `_ewsTweenBloom` tweened the PLAYER's bloom setting (localStorage write a frame): with bloom off
  (default) it switched bloom on and off per strike, each switch rebuilding the post chain. Now `ThreePost.bloomSwell` rides
  on top of the player's bloom like bloomPulse; bloom off stays off.
- **The void stage** (Entropy Strikes, void spells): `scene.fog = null` re-keyed every lit material (fog is in the shader);
  now the fog is thinned (density 0 / near-far pushed out) and restored. The 'toplight' key is `_voidKey`, a lamp in the scene
  from init at intensity 0 (a new PointLight changed the light count = WebGL recompiles all). Sky textures cached per palette,
  contact discs share one geometry + material.
- **Split screen** (combos, strikes): pane cameras are kept (`_ss.cams`; the node renderer keys render objects on the camera, so
  a new camera per show rebuilt every mesh's render object); panes draw into a target per pane size (`_paneTarget`; one shared
  target was resized twice a frame when panes differ by 1 px); on WebGL the panes no longer draw straight to the canvas (that
  compiled a canvas variant of every material in view on the first split screen), they draw into a target and blit with the
  colour-space encode.

## THE FOG SETTING + THE SKY RING (2026-10-07, mondo: "scene fog off ... still showing the fog"; "black hole in the sky or underneath the map")
- **Scene Fog off wins in the building.** Every room, zone part, crossing blend and world-clock hour writes its own fog, so the
  draw is made fog-free instead of chasing writers: `_hqFogHold(H)` (three-renderer.js) zeroes `scene.fog` density (FogExp2) /
  pushes near/far out (Fog), the height fog amount (`_EW_HFOG.z`) and the dome's horizon band (`_envUni.uFogAmount`, which the
  far scenery's injected fog shares) right before the frame's renders (mirrors included), and `_hqFogBack` restores them after,
  so blends keep their real numbers and turning the toggle on shows the fog at once. The fog object stays on the scene (density
  0): no recompiles. The Deep's underwater fog is the water's look and is kept. The field fight in a room
  (`_hqBuildRoomInBattle`) sets no fog / no height fog while the toggle is off; the battle's map-preset dome band
  (`_mapEnvFog`) and the far bodies' pale haze (`_hzHaze`) also obey it. The gate is `_ewSceneFogOn()` =
  `ThreePost.isRetroFogEnabled()`.
- **The black hole was a floating island.** `_hqBuildSky` hung the theme's far bodies (floating islands, monoliths, gateways,
  orbs) on the battle's ring (discR 6000 = 82 m) — inside any open room bigger than that (Downtown 453 × 357 m), among the
  buildings and under the streets; flown near (the cinematic camera) an island's dark underside filled the sky. The ring now
  starts past the room (`_hqSkyRingScale`: half diagonal + `HQ_SKY_CLEAR_M` 80 m, for the backdrop + outer ground) and every
  body is scaled by the same factor (breathing glows too). The menu scene keeps the old ring.
- **The far plane.** The building's camera had far = 20000 (274 m), less than Downtown's diagonal. `_hqFarTick` grows it (never
  shrinks within a visit) to cover the sky ring + room (`H.sky.farBase`) plus the eye's distance from the middle. The cinematic
  camera (three-camera.js `frame`) also grows the far plane by how far it has flown, in battle too, and restores it on exit.

## ONLINE PVP PASS (2026-10-07, mondo: voxel maps in friendly rooms, friend's frame rate, stuck VS on the 2nd match, his unit's tiles on my screen, pick the friendly map)
- **The opponent's tiles.** On the host, the REMOTE seat's activation (battle.js) mirrors the guest's unit as `selectedUnitId`
  but kept a leftover `actionMode`, so ui.js `_hlCache` / three-renderer `rebuildHighlights` drew move/attack tiles for the
  other player's unit. `_executeRemoteAction` also kept the guest's mode when the active unit changed. Both now clear
  actionMode / actionMenuView / selectedTool / pendingTarget / comboPartner; ui.js and `rebuildHighlights` refuse an online
  selection the viewer does not own.
- **The stuck VS (next room).** The result screen's Main Menu (online.js backToMainMenu wrapper) dropped the socket but kept
  `_autoStartFired` / `_waitingForOpponent` / `_lockState` / the arena waits, so in the next room the applyPartyBuild wrapper and
  `_tryAutoStartRanked` returned early and both seats sat in the ready room. `window._ewResetOnlineMatchFlags(leaving)` clears
  them on every way out (backToMainMenu, lobbyBackToPlayHub) and at every `room-full`.
- **The voxel maps (slow seat).** The big rooms take 25-40 s to survey on a fast machine (downtown 41 s, cyberpunk 26 s,
  stadium 18 s in node); the old flat 45 s launch wait ran out on a slower PC and the match started on the bare baked board.
  The host now surveys from the room's creation (`_friendlyEmitConfig`), the guest from the join, and the launch wait only
  gives up on a seat that stopped answering (`arena-check` every 4 s, guest answers `arena-busy`; 45 s silence or a 180 s cap).
  The host's manual Start (friendly without a squad) waits the same way (`_friendlyStartPending`).
- **The map pick.** The friendly room card has a MAP select: Random (default) plus the room's arenas (`_friendlyMapChoice`).
- **The lean sync.** `_leanTrim` drops top-level keys ≥ 1 KB whose JSON matches the last send (boardColumns / boardVoxels /
  loadouts … ~55 KB of a ~105 KB snapshot); a full snapshot every 3 s and on any match / phase / round / result change, and
  after match-generation / recovery (`NET._leanSent = null`). The guest merges, so a missing key keeps its value.
  `_ewSafeStringify` tries a plain JSON.stringify first. The guest repaints the HUD once per frame mid-fight (`_guestRenderSoon`).
- **Renderer.** `_computeUnitSerial` caches the appearance string (`_apSerial`, WeakMap). Unit lamps exist for dead units too
  (steady light count = no WebGL recompile on a kill) and re-resolve their unit by id when the guest's units array is replaced.
  THE FOG BATCH: settled fog boxes draw in one merged LineSegments per kind (`_fogBatch`), only boxes mid-fade keep their own.

## THE GUEST'S VIEW (2026-10-21, PvP audit #3 the rest; mondo: "start a new thread to work on the online sync")
The guest got every unit's real tile in each state-sync (and every enemy walk path in its relays), so a unit hidden in
the fog was one console line away. PR #394 already kept the host's unrevealed traps off the wire. online.js now:
- **Masks fogged enemies in the snapshot.** `_guestView()` (host only, fog ON, battle, no winner) works out the guest's
  sight: `computeVisibleTiles(guest)` with team vision forced on and the host's own `_fogRevealTiles` left out (they
  never sync), the renderer's z-exact eye line (`_gvLosSeen`, mirrors three-renderer `_unitLosSeen`) and the rules'
  `isInVision` (what attacks / spells check; a Blind / Jammed unit acting = `fogSoloUnit`, its own eyes). A living
  enemy that is concealed (`isUnitConcealedFrom`: Invisible, smoke, Cryptid, Shadow Realm) or neither seen nor
  aimable goes out masked (`_gvMaskUnit`): every stat, but `x = y = GV_HIDDEN_XY` (-999, off the board), `z = 0`, no
  remembered positions (`_dyingX/Y`, `_deathTile`, `_aiLastPos`, `_aiRecentTiles`, `_doorAttackOrigin`, any numeric
  `…X/Y/Z`, any object/array holding x,y) and `_netHidden: 1`. Off the board it never draws, blocks, gets targeted or
  framed, so no guest code path needed changing; the roster card shows "—" for its tile (ui.js). Dead units are not
  masked (the grave marks the spot). Fog OFF (Clash) or a decided match masks nothing. Cached on a vision key (units,
  statuses, zones, wards, doors, towers, terrain version, round, a 1 s tick).
- **Enemy decoys in the fog** are left out of `_deployedObjects` (a copy reads as a unit).
- **Checksum over the units as sent.** `_ewStateChecksum(st, units)`: the state-sync stamp, the recovery snapshot and
  recovery-confirmed hash the masked list, the guest hashes what it got, so the server's checks still agree.
- **Relays** (`window._ewGuestRelayFilter`, called by `_emit` on the host, after the recorder tap): the host sends what
  the guest's own `_ewApplyRelay` fog gates would show. Fully hidden walks / jumps / pushes / falls / shots / leaps /
  rider shots / sky throws / dashes / storm bolts / collision sparks / key fx / det-cine / vfx3d(-x) are dropped; a walk
  is trimmed to its seen stretch; a hit number in the fog keeps its value (the action shot's TOTAL DMG counts it) but
  its tile becomes -999; a hidden caster's `cx/cy` (spell-focus-cam, support-cine) and an offensive camera event's hidden
  side go to -999. When a shown beat involves a masked unit (a shot out of the fog at the guest's unit, a walk out of the
  fog) the relay carries `_at: [[id, x, y, z]]` and the guest puts the body there first (a walk's first SEEN tile, never
  the hidden one it left); `_netAt` makes the guest's checksum still hash it as sent until the next snapshot.
- **Not covered:** a decoy on screen is still flagged `isDecoy` in the guest's data; `cine-fx` payloads and the host's own
  view (the host runs the engine and holds everything). Browser check: two-tab host + guest match (scratchpad probe),
  85 steps over 7 rounds: the masks matched the guest's own fog every step (the only "visible tile but masked" hits were
  a Cryptid Bigfoot), 0 checksum mismatches, 0 page errors. Targeted: a guest socket drop + rejoin restores with the
  masks kept (the three recovery checksums agree); a fogged enemy decoy never reaches the guest, one in view does; a
  Blind guest unit acting = 4 tiles vs the team's 27; the filtered relays (walk out of the fog, shot from the fog,
  finisher on the guest's unit, spell cams, numbers in the fog) replay on the guest with no errors. Host cost: ~1 ms
  per vision change (cached otherwise), a whole masked snapshot ~1.3-2.5 ms on the sandbox CPU.

## THE WEBGPU HITCHES PASS (2026-10-12, mondo: "freeze or dip in FPS at heavy moments like combo spell animations ... transitioning from the explorable area to the battle and then from the end screen")
Full log: WEBGPU_PLAN.md §10 "THE HITCHES PASS". Node renderer only (`?ew_gpu=webgpu`); WebGL is still the default.
One shared light rig + one shared fog (scene swaps no longer rebuild every shader), InstancedMesh shaders shared across
meshes, bundle re-records only for the groups holding a freed resource, spell sheets uploaded one per frame ahead of
use. Switches: `EW_NO_LIGHT_RIG` / `?ew_lightrig=0`, `EW_NO_FOG_SHARE`, `EW_NO_INST_SHARE` / `?ew_instshare=0`, `EW_NO_SHEET_WARM`.
The sandbox runs real WebGPU (SwiftShader) when the page is served from localhost; compare counts, not ms.

## THE TERRAIN SPELL HITCH (2026-10-13, mondo: "for webgpu, there is still some performance and frame rate and freezing issues when a spell like rampart or meteor changes terrain")
Full log: WEBGPU_PLAN.md §10 "THE TERRAIN SPELL HITCH". Any terrain change rebuilt the whole zone outline (~100 new
meshes + materials + gradient canvases) and a field's strata faces one mesh each. Now the outline serial reads only the
zone tiles' tops, its materials / planes / canvases are shared and its meshes pooled (`_nxMat`, `_nxGeo`, `_nxGradTex`,
`_nxPiece`), and strata faces bake into one mesh per sheet (`_fieldStrataMergeFaces`, off `EW_NO_STRATA_MERGE`).
Rule: anything rebuilt on a terrain / height version must reuse shared materials, planes and canvases (`_ew_shared`) —
on WebGPU a new material or canvas per piece is a render object, bind groups and an upload each.


## THE FADE RULES (2026-10-14, mondo)
"the objects on the map are the objects on the map and shouldnt fade transparent". three-renderer.js
`_updateActionCamOcclusion` / `_occComputeBlockers`:
- In a cinematic shot (`camera._cineShotId` + `state.cinematicActionCam`, incl. the intro) anything between the camera and
  the caster/target still fades (terrain, props, walls, bystander units). Strike Mode's shoulder rig keeps that too.
- Outside a shot ONLY off-grid scenery fades (`_occRootOffGrid`): room shell walls (`_ew_occWall`), and roots whose world
  box centre is outside the board footprint and whose top rises above the subject's feet (aprons/moats never; pieces
  spanning >2× the board never). Terrain columns and edge walls are not raycast at all then. On-grid things stay solid and
  the unit behind them shows its hologram (the silhouette gate no longer hides it outside a shot).
- Subjects outside a shot: the active unit, the hand-pan focal, and wherever off-grid scenery exists (facility group, field
  set, or `_nearOccGroup` = a near builder that did not opt into `_ew_occNear`) a 4×4 board lattice + every unit the viewer
  can see, one ray each (hidden enemies never drive a fade).
- The roof/canopy cutaway is unchanged (mondo: "ignore roofs for this").

## THE OVERHEAD FADE + THE HIGHLIGHT GHOSTS (2026-10-16, token 20261016-overhead-02-cors)
mondo: "things ABOVE the units should still [fade], like there are these bridges on maps that go across a gap ... really big
trees whose leaves cover the map below ... or at least maybe tile highlights need to always be shown through stuff too like
the holograms". Both done, three-renderer.js only, WebGL + WebGPU.
- THE OVERHEAD FADE (`_occOverheadHit`, in `_occComputeBlockers`' hit loop): outside a shot an ON-GRID root still fades when
  the sight line to an `.ov` subject crosses it ABOVE the subject's head and either (1) a ray straight up from the subject's
  body meets the root (it stands under the deck / crown) or (2) the tile under the crossing is inside + `isTerrainPassable`
  and a ray up from its solid ground (`window._camSolidGroundPx`) meets the root's underside >= `OCC_OVER_CLEAR` (0.6) tiles
  up. Walls, rocks, trunks and buildings reach the ground (or stand on closed tiles) and stay solid + hologram (PR #200 rule).
- `.ov` subjects: the active unit, every unit the viewer can see (now on every map, one ray each; fog-gated as before,
  `_insideBuildingId` units excluded), the hand-pan focal tile, the hovered tile (`_lastHoverX/Y`). The 4x4 board lattice
  stays off-grid only. Terrain columns are still not raycast outside a shot (voxel decks keep the canopy cutaway).
  Room ceiling / sky holders never count. Switch: `window.EW_NO_OVERHEAD_FADE = true`.
- THE HIGHLIGHT GHOSTS (`_syncHlGhosts`, each frame after the overlay pulse): every highlightGroup mesh drawn with
  `_hlFragmentShader` (move/jump/attack/spell reach, AoE, cursor, selected tile) gets a child twin on the same geometry with a
  GreaterDepth copy of its material (polygonOffset -4 like the hologram, raycast off), uniforms shared except uOpacity =
  source x `HL_GHOST_K` (0.42). It paints only where something covers the tile. Note: the 2026-07-21 rule ("highlights
  depth-tested, no x-ray through roofs") is relaxed by mondo's ask; the ghost is the faint copy, the real highlight is still
  depth-tested. Switch: `window.EW_NO_HL_GHOST = true`.

## THE UNIT POP (2026-10-16, mondo: "make the units/characters pop a little more compared to the ground and objects ... more saturated or brighter ... and fade the ground a little bit")
- One colour grade on every LIT material's final colour, at the point the light sum becomes the fragment (after
  `opaque_fragment`, before tone mapping / colour space / fog): `mix(luma, c, x) * y`. World (every Lambert / Phong /
  Standard / Physical that is not a unit: the board, HQ rooms, props, trees, water) x 0.86 saturation, y 0.95 brightness;
  units (3D models in battle + exploration, sprite-slab units, the bar's party) x 1.22, y 1.10. Unlit MeshBasic (move
  tiles, previews, VFX) and ShaderMaterials (sky, holograms, team outlines) are untouched. No light added.
- WebGL: three-renderer.js `_ewPopPatch` patches ShaderLib lambert/phong/standard/physical once at load; uniforms
  `uEwPop` / `uEwPopU` hold the plain objects `_EW_POP_W` / `_EW_POP_U` (cloneUniforms keeps a plain object by
  reference, like the height fog), so the values are live. A unit material is marked by `_ewPopUnitMat` (define
  `EW_UNIT_POP` + string property `ewPop = 'unit'`, which also splits three's node cache key).
- WebGPU: `_ewNodePop` (called first in `_ewNodeDress`) grades setupOutput's input with node uniforms reading the same
  objects. Checked in a standalone probe: classic WebGL and the node renderer (WebGL2 backend) give identical pixels.
- Tune live: `EW_POP.world` / `EW_POP.unit` = { x: saturation, y: brightness, w: 1 on / 0 off }. Off at load: `?ew_pop=0`
  or `window.EW_NO_UNIT_POP = true`. A new unit material path must call `_ewPopUnitMat`, or that unit fades with the world.

## THE KEPT PROGRAMS ON WEBGL (2026-10-17, mondo: "still frame rate issues with spells like rampart")
- Cause: classic WebGLRenderer deletes a shader program when the last material using it is disposed, so every cast of a
  spell linked its programs again. Sandbox, Rampart cast 3x by the same unit (Fairy Forest arena): 10, 4, 8 links; a link
  stalls the frame it lands in (worst on Firefox). WebGPU already kept its builds (THE KEPT SHADERS, `_ewKeepSetup`).
- three-renderer.js `_glKeepSetup` (run on the WebGLRenderer the factory makes): after each render, every program in
  `renderer.info.programs` not yet held gets `usedTimes++` once (cap `_GL_KEEP_CAP` 640).
- ShaderMaterial keys also carry the id three's shader-text cache (WebGLShaderCache) gives the GLSL, and that id is dropped
  when the last material with that text is disposed, so the unit rings (`_makeTeamReticleMaterial`) and the spell energy
  sheets (three-vfx-effects.js `_SIG_ENERGY_FS`) still made 5 new keys a cast. `ShaderMaterial.prototype.dispose` is
  wrapped: the first drawn material of each vertex+fragment text that gets disposed stays undisposed as that text's anchor
  (`_glAnchor`, cap 160). After both: repeat casts link 0 programs (cast 1 still compiles what it first draws).
- Off: `window.EW_NO_SHADER_KEEP` or `?ew_keep=0` (same switch as WebGPU, reload).

## THE SETTINGS IN THE ROOMS (2026-10-18, mondo: "the tilt shift seems to only affect the voxel maps ... are there any other settings that are voxel only")
- **Tilt-Shift** (three-post.js): `render()` no longer turns the DoF off on a field-light board (room arenas, encounters);
  `renderScene(scene, cam, { focus })` runs the band when the caller hands a world point. The walk passes
  `_hqDofFocus(H)` (three-renderer.js: the walker's body centre, or the first-person look point); the menu and the team
  room pass none and stay crisp.
- **Brightness**: with Post FX on, the frame is drawn into a render target and three tone-maps only canvas draws, so
  `toneMappingExposure` never reached the screen (measured: exposure 1.55→1.94, luminance 0.262→0.264). The slider is now a
  gain in the cinematic pass (`uGain`, `_brightGain()` = the eased exposure, clamped 0.3-2; GLSL + TSL `_ngFrame`), and the pass
  switches on when the gain is off 1. Filmic Tone and the HQ Auto Exposure still only move `toneMappingExposure` (dead with
  post); left as they are, reported to mondo.
- **Shadows**: `setShadowQuality` re-arms the walk's key light (`ThreeRenderer.hq.polishApply()`), so Off/Low/High apply while
  exploring without re-entering the room.
- **Scene Fog**: `_fieldGroundDress` stores the room's own fog on the field light (`field.fog`); `_applySceneFog` restores
  THAT fog when the toggle comes back on mid-fight instead of the voxel mood preset's.
- **Retro → Models Only** in the walk: PR #316/#317 masked the walk's models (people, then every flagged model); mondo
  (same day): "i dont even think anything was wrong with it other than it not showing up on the closeups" — all of it is
  reverted: the walk pixelates the whole frame as before (renderScene hands no mask), the battle mask is as it was. A later
  try (pixel-pack trees unflagged, an occluder depth pass) was dropped unshipped.
- Voxel-board-only (no effect in rooms, kept; mondo decides): Fog Density, Fog Horizon, the mood preset fog colour, Night
  Mood, Batched Terrain (still used by the moving boards). Dead everywhere: Light Rays (`_buildLightRays` builds nothing since
  the light boxes went, 2026-10-04).

## THE ROOM SETTINGS (2026-10-20, mondo: "can we not just make those settings work with the current non voxel maps?? why do we have to get rid of them??")
The six settings the 10-18 audit found dead or voxel-only now change the picture on every map (voxel board, a fight on a room,
the walk), on the classic, pmndrs and node (TSL) chains. Nothing was removed. Defaults keep the picture players already saw.
- **Light Rays** (pause slider, `ew_lightRays`, default now 0): the box shafts stay gone (NO LIGHT BOX). The frame pass
  (`_CinematicShader` `lightRays` / `_ngFrame` twin, `uRays uRayPos uRayCol uRayThr`) marches 24 taps from each pixel toward the
  key light's screen point and adds the bright ones it passes. `three-post.js _raysAim`: the light's own point when it is in front
  of the eye, else a point past the screen edge along the light's on-screen direction (the battle camera has the sun behind it).
  The bar a pixel must pass is the frame's own mean luminance (the auto exposure's 16 × 16 read, `_aeMeasure`, which also runs
  while the rays are on), so a dark forest at night still throws moonbeams. Battle: `_sunLight`; walk: `_hqPostOpts` hands the
  room's `keyDir` / `keyLight`. The Polish sheet's Light Shafts row turns them off in the building.
- **Filmic Tone**: three never tone-maps a render into a target, so ACES never reached the screen with Post FX on. The frame pass
  draws decode · ACES (×1.3) · encode itself (`uFilmic`). Default OFF with the chain, ON in EW_PERF_LOW (no chain, the materials
  tone-map as before).
- **Auto Exposure** (Polish row, def now false): `_brightGain` multiplies `_ae.gain` in the building context (the walk and a
  fight on a room); the read is of the frame pass's input, so the loop is open and stable.
- **Fog Density / Fog Horizon** in a room: relative to their factory spots (`getRetroFogScale` = density / 0.00044,
  `getRetroFogLift` = horizon − 0.075). Walk: `_hqFogHold` now also SHAPES the fog while Scene Fog is on (scene.fog, height fog,
  dome band amount × scale; band top + lift, a room with no band gets one in its fog colour; the height fog's reach ×
  `_ewFogClimb(lift)`, ½ … 3.5×), restored after the frame; factory sliders = no hold. Many rooms paint their sky in the fog
  colour, so the band alone changed nothing there: the climbing ground mist is what Horizon shows in a room. Fight on a room:
  `_applySceneFog` scales the room's FogExp2 and `ThreeRenderer.setFieldFogScale` its height fog.
- **Night Mood** in a room: `_roomNight(night)` grades from the room's own night (walk: `H.sky.night`; fight: `field.night`
  from `_fieldCycle`). Factory 0.40 = as before; higher feeds `uNightGrade`, lower lifts the gain at night. Day = untouched.
- Probe (scratchpad, not in repo): SwiftShader frames take seconds, so a shot needs `frames` drawn after a setting change.

## THE ONLINE PLAYTEST FIXES (2026-10-23; the two-seat guest + host playtest reports, mondo: "do fixes for the guest and host findings")
- **The match end reaches the guest.** The end happens inside finalizeMatch (no broadcast) and the host's handoff
  heartbeat (online.js `_handoffHeartbeat`) stopped the moment `state.winner` was set, so the guest sat on the board
  (3½ min on the host thread's run) or got a sudden-death result without the last kill (4 v 4 vs 3 v 4). The heartbeat
  now keeps calling `_broadcastState` for 20 s after the end (`N._endSyncUntil`; the JSON dedup drops repeats), and the
  guest finalizes a draw too (`_winCondition === 'draw'`, winner 0 is falsy).
- **The guest's turn has a clock.** battle.js `_continueBlitzWithUnit_impl`'s REMOTE branch called `_stopShotClock()`
  and nothing restarted it (a guest turn sat open 33 min). It now `_startShotClock()`s: the clock syncs, the guest's
  own browser ends its turn, and the host backstop (`_shotClockExpired`, +8 s) has a running clock to fire on. The
  pill shows the remote turn's last 15 s on the host too. `_stopMatchClockInterval` now hides the pill (a "⏱ 4s"
  stayed over the result screen).
- **A drop on the loading screen.** Building the board holds a weak PC's main thread for tens of seconds; socket.io's
  20 s pingTimeout dropped the seat, and recovery gave the (still loading) host 20 s. server.js: `pingTimeout: 60000`
  and the recovery deadline 60 s; online.js `RECOVERY_WAIT_S = 60` for the host's poll and the overlay. **server.js
  changed** (the live matchmaker has to run the new copy).
- **The guest's log** (`_guestLogFilter`, called from `_guestViewFilter`, so state-sync and the recovery snapshot): the
  host judges each `logEntries` / `_fullLogEntries` / `logDialogue` entry ONCE as it first goes out, by the guest's own
  rule (battle.js `_logVisible`): another seat's line (`v`) dropped, a line naming a unit `_guestView` hides with none
  of the guest's own units named dropped, a line naming a tile in the guest's fog dropped. Kept beats get their `at`
  remapped onto the kept log. A decided match sends the whole log (like the units). Before, every line went out whole
  and only the guest's renderer judged it (fogged Bee Queen's Swarm Signal / War Cry, fogged Anubis "forms at E12",
  shot-clock lines were all in the guest's data). Refused-attack lines (camouflaged / blur / Shadow Realm / "Choose an
  enemy") are now the attacker's seat line (`addLog(msg, unit.player)`).
- **Per-viewer:** `lastCompletedMatch` + `matchHistory` are in `_serializeState`'s skip list (the host's copy landed
  between the guest's record and its result screen and greyed the guest's Export Last Match).
- **Smaller:** the friendly room opens on Arena's own round limit (20, was 15 until Arena was clicked); the canon year
  (`_lsRandomYear`, loading card + result stamp) is seeded from `NET.matchId` + match number online so both seats
  read the same year; the no-active-unit watchdog stands down while the opponent is away / the match is restoring
  (it forced a turn advance in the middle of a 7 s guest drop).
- Browser check: local server.js + two headless seats (scratchpad ctl.js), Arena 4v4: friendly room 20 rounds, a guest
  socket drop on the loading screen restored, guest turns ended on the clock (activation 1 → 2 on both seats), injected
  fog log lines filtered on the guest (hidden-unit and fogged-tile lines gone, own-unit / own-seat / plain lines kept),
  a sudden-death kill ended the match on both seats (VICTORY / DEFEAT, 3 v 4 on both, same year, guest Export enabled).

## THE LINELOOP (2026-10-23, WebGPU console spam)
- mondo on Firefox `?ew_gpu=webgpu`: "THREE.Renderer: Objects of type THREE.LineLoop are not supported" x999. The node
  renderer (three 0.186.1 `_projectObject`) logs that every frame for every visible LineLoop and draws nothing for it.
- The only LineLoop left was the terrain-paint ghost's tile rim (`showTerrainGhost` paint mode, shown while aiming a
  terrain or `leaveTerrain` spell). `_drapeRimGeo` now repeats its first point and the rim is a `THREE.Line`: same
  picture on WebGL, drawn on WebGPU. Never use `THREE.LineLoop` again; close the point list by hand (the zodiac rim does too).
- Checked on real WebGPU (SwiftShader) in a VS-CPU battle on Mount Shasta: old file 168 LineLoop errors in 8 s with the
  ghost up and no rim; new file 0 errors, 72 rim lines drawn, red rim visible on each tile.

## THE QUIET COUNT (2026-10-23, matchup playtests shared-bugs thread)
- The host's no-active-unit watchdog (battle.js `_noActiveUnitWatchdog`) skipped a whole round in Wipeout vs Wipeout
  (R9) and fired in Cube vs Cube (R12): 15 s of wall clock read a long blocked frame (a shader build on a slow PC)
  as 15 s of stall, in the middle of a live end of round, which then ran twice. A stall now also needs 7 answered
  ticks in a row (a tick that comes >4 s late starts the window over) and an unchanged signature (`_ewStallSignature`:
  round, log length, HP sum, `_blitzTurnGen`, round-advance flag).
- One live end of round at a time: `_eorChainGen` bumps when an end-of-round chain starts (and when the watchdog
  drops a stalled one); every beat of the chain checks it, so a slow old chain stops instead of running a second
  round end. The recovery/drop gate from PR #438 is unchanged.
- Checked in a rendered browser: a 16 s main-thread block no longer fires it; a truly dead round end still recovers ~17 s.

## THE ONE BRIGHTNESS (2026-10-24)
mondo: the battle pause menu said "Brightness · EXPLORING" in a VS CPU arena fight (arenas are cut from rooms, so the
fight runs in the building's exposure context 'hq'), and the battle and exploring kept two separate values
(ew_exposure / ew_exposure_hq, THE TWO BRIGHTNESSES 2026-09-20). Now three-post.js keeps ONE value (localStorage
ew_exposure) for battles and exploring alike; setExposureContext only switches the building's auto-exposure gain on/off.
The pause slider is labelled plain "Brightness" with the hint "the whole picture lighter or darker — one setting for
battles and exploring alike". Proven in a VS CPU arena: frame mean luma 40 at 0.55, 72 at 1.00, 90 at 1.25
(/mnt/project-files/brightness-slider/).

## THE SMOOTH PASS (2026-10-24, mondo: "optimize the game and save on frame rate, without drastically changing how the game looks ... There are light rays thats look like they come from every star in the sky")
- **THE RAY SOURCE** (three-post.js `_RaySrcShader`, `_raySrcRender`, node renderer `_ngRaySrc`): the Light Rays gathered every
  full-size pixel past the bar, and at night the bar is the dark frame's own (0.06), so every star threw a shaft. One small
  draw before the frame pass now shrinks the frame to 1/8 size (each cell = its 8 × 8 pixels as 16 bilinear taps, every tap
  past the bar counts); a cell keeps its light only when a quarter to half of it is lit (`smoothstep(0.25, 0.5, coverage)`).
  A moon, a brazier, a window, a glowing zone or a sunlit gap still throws shafts; a star or a glint does not. The frame
  pass's 24 taps read that little picture (`tRaySrc`) instead of the full frame. Drawn only while the rays are on (the node
  renderer's rtt flips `autoUpdate`). Checked: Göbekli Tepe night sky, rays 1, the rays' own contribution (rays 1 minus
  rays 0) before = streaks across the whole starry sky, after = only off the braziers and the zone glow; WebGPU rays draw.
- **THE SKY'S RAYS** (2026-11-14, mondo: "my unit rim light makes light rays but i think i just want the light rays to come
  from above like the sun or the moon"): the slider's Light Rays now come only from the SKY. The ray source (`_RaySrcShader`,
  `_ngRaySrc`) keeps a tap only where the scene drew nothing (depth still cleared = the dome: `uRaySky`, depth >= 0.999999);
  pmndrs reads `composer.inputBuffer.depthTexture`, the node chain `P.depthTex`, the classic chain a half-size mask made right
  after its RenderPass (`_skyMaskAfterScene`, its depth is gone by the frame pass). The 3D moon (`_skyMoon`) writes no depth
  so it counts as sky. The rays aim at the body the dome draws (`ThreeRenderer.getSkyLightDir(ctx)`: sun by day, moon by
  night, the world clock's pair in a clocked room, un-yawed), sun warm / moon cool; the battle used to aim at the key light.
  The rim light, the slider and 0 = off are untouched; a finisher `rayBeat` keeps every light (`uRaySky` 0). No sky on screen =
  no shafts. Old rays live: `window.EW_RAYS_ANY_LIGHT = true`. Checked on Shasta, day + night, rays 1: before = streaks off
  the lit tiles, the units and the board; after = shafts only falling out of the sky (pmndrs + the node chain on WebGL 2).
- **THE NO-STALL READ** (`_aeMeasure`): the 16 × 16 frame read that feeds the rays' bar and the building's auto exposure
  used `readRenderTargetPixels` every 220 ms, which makes the CPU wait for the GPU to finish the frame. WebGL 2 now uses
  `readRenderTargetPixelsAsync` (a pixel buffer + fence), as the node renderer already did. Sandbox (llvmpipe), Light Rays
  on: CPU per frame 800-950 ms → ~20-30 ms, walk and battle alike (the stall was the whole GPU frame).
- **THE PLATES' PASS** (three-renderer.js `_css2dRender`): CSS2DRenderer.render walked the whole scene's matrices a second
  time right after the draw did. A stamp on `scene.updateMatrixWorld` tells whether the draw walked it since the last plates
  pass; then the plates skip the walk (median 1.5 → 0.6 ms a frame in the sandbox). Panes drawn from another scene still walk.
- **THE MENU MEASURES**: battle.js `_menuFreeArea` queries only inside `.hrlg-rig` (was the whole ~10,000-node page, median
  5.0 → 2.5 ms a call); `_wmMenuRects` reads live `getElementsByClassName` lists instead of whole-page queries each frame.
- **THE EMPTY ROOTS** (`_occFieldRefresh`): a room root with no mesh (its light rig) was re-measured with a forced matrix
  walk on every blocker recompute (every frame in a shot); now at most every 250 ms.
- **PROPOSED, NOT BUILT** (a feel change, mondo decides): three-camera.js caps a frame's step at 0.05 s and the mixers at
  0.1 s, so below ~20 fps camera glides and animations run slower than real time.

## THE KEY LIGHT (2026-10-24, mondo: "can enclosed areas get like a key light or something? I just feel like the game is really dark overall, please fix")
Measured before (mean frame luminance 0-255, the walker's view): Merlin's Undercroft 4, The Cavern 8, the Catacombs 8, the haunted
cellar 9, the sewers 17, the office 30 (the main hall 77). Cause: a closed box room's light is `mood.ambient` × (hemi 0.5, key 0.22,
fill 0.14), CLAMPED at `ambientFloor` 0.55 — so every dim site room (caves, crypts, cellars, sewers: ambient 0.22-0.5) lit at
hemi 0.275 / key 0.12 plus one 9 m ceiling lamp at the room's centre; the walker's dark suit and the floor read black. A fight in the
same room was darker still: the field rig kept the pre-rig key 0.22 × mood while the walk's `_hqLightArm` sets 0.34.
- **THE KEY LIGHT** (three-renderer.js `_hqKeyLampArm` / `_hqKeyLampTick`): ONE PointLight (no shadow map, decay 1) that rides with the
  camera in an ENCLOSED room (`_hqEnclosed`: a box room without an open sky, a bay corridor), placed 35% of the way from the walker's
  head to the eye, 0.9 m up, 0.6 m to the camera's right; built once per visit (`keyLamp` is a zone key — the scene's light count never
  changes, so no material recompiles), eased to 0 in an open room / the hall. In a fight in an enclosed room (`_fieldGroundDress` →
  `_fieldKeyLampTick`, from `_fieldGroundTick`) it hangs 7 m over the floor point the camera looks at, reach 30 m, intensity 1.5.
- **THE LIFT** (`_hqMoodAmb`): a dim mood no longer clamps — ambient m lights at floor + (1 − floor) × m with `ambientFloor` 0.7
  (0.3 → 0.79, 0.55 → 0.87, ≥ 1 untouched), so the dark rooms read and every room keeps its order. Walk and fight share it.
- **THE FIGHT'S KEY** = the walk's (`HQ_LIGHT_RULES.key.box.intensity` / `shell.rig`) instead of 0.22 × mood.
- Numbers: data.js `HQ_LIGHT_RULES.keyLamp` (renderer default `HQ_LIGHT_DEFAULT.keyLamp`, keep in step). Setting: **Settings → Video →
  The Polish → Key Light** (HQ_POLISH_PREFS `keyLight`, slider, default 0.5 = the rule's intensity, 1 = double, 0 = off; scope both,
  live). Kill-switch `window.EW_NO_KEY_LIGHT`. Open rooms, the day / night clock, the looks, bloom and fog are untouched.
- After (same views): Undercroft 22, Cavern 20, Catacombs 24, cellar 26, sewers 32, office 54; D.U.M.B. arena fight 16 → 37, Lodge
  arena fight 22 → 40 (Key Light 0 in the Lodge: 28 — the slider proven on screen). Proof: /mnt/project-files/key-light/.

## THE NIGHT FILL (2026-10-24, mondo: "what about like the woods at night? That is really dark too, does that not get a soft fill?")
The Key Light above is enclosed-only, so outdoor nights got nothing. Measured: The Woods clearing 46 by day, 10-11 at night; the redwood
trail 52 / 12-13. Cause: an outdoor room's hemisphere colour at night was the night sky's tint (`#46544c` in the woods) + 22% white, so
the hemisphere lit at ~0.18 and under the canopy (the moon key shadowed by the trees) that is all the ground got; with the moon low
(just after dusk / before dawn) `_hqClockVals` gave no key at all (moonK ≈ 0).
- **`_hqSkyHemiC(skyC, night)`** (three-renderer.js, used by the walk's open branch, `_hqStageSkyValsRaw`, `_hqClockVals` and the fight's
  open rig): the old white mix, then `nightFill.amount` (0.5) × night of the way to a soft moonlight `nightFill.color` (`#a8bad8`).
- **The moon floor**: `_hqClockVals`'s moonK ≥ (1 − day) × (1 − sunK) × `nightFill.moonFloor` (0.75).
- **The Key Light outdoors**: `_hqKeyLampTick` lights an open box room at `nightFill.keyLight` (0.6) × the sky's night; a fight in an open
  room carries the lamp too, × the cycle's night (`_fieldCycleRigAt(...).t`) or the room's night. 0 by day: day frames unchanged.
- Numbers: data.js `HQ_LIGHT_RULES.nightFill` (renderer `HQ_LIGHT_DEFAULT.nightFill`). The Key Light slider scales the lamp part.
- After: clearing 18-21 at night (day 47), redwoods 20-22 (day 54); the Fairy Forest arena's night round 22 → 27. Proof:
  /mnt/project-files/key-light/ba_woods_*.jpg, ba_battle_woods_night.jpg (the night round was forced for that one screenshot only).

## THE BOOT GUARD + 3D ENGINE CHECK (2026-10-27, mondo's iPad opened on the party builder)
- Boot (online.js, after the relay wrappers) calls `resetGame()`, which switches to PARTY_BUILDER and renders, then
  `transitionTo(GS.TITLE)`. Any throw inside resetGame skipped the TITLE switch: the page opened on the party builder with
  the ENTER/title screen hidden and no input. Reproduced in Chromium's iPad emulation by blocking cdn.jsdelivr.net
  (window.THREE never set → `ThreeRenderer is not defined` in renderBoard). resetGame + the title render are now in
  try/catch; the error goes to the console and the ?ewdiag=1 JS ERRORS list.
- three.js r186 needs import maps AND class static blocks (Safari / iPadOS 16.4+). index.html's `_readyCheck` now shows the
  boot error box ("THE GAME CANNOT START") when `_gameReady` flips with no `window.THREE`, naming the reason: no import
  maps (old browser), jsdelivr files that failed to download, or "browser refused it".
- WebKit can't be downloaded in the cloud sandbox (cdn.playwright.dev is blocked); the proof ran in Chromium with the iPad
  Pro 11 device profile.

## THE KTX2 CAP (2026-10-27, mondo's iPhone 13 crashed at match start, "it has worked before")
- Measured on Chromium's "iPhone 13 landscape" profile (EW_PERF_LOW): the party builder mount at boot (resetGame renders under
  PARTY_BUILDER) and the battle card both call ThreeVFXEffects.warmSpellLibrary, which loads every spell prop + pack (117 models
  on 10-27, 46 on 10-18). JS memory at the title after the warm: 10-18 build 817 MB, 10-27 build 1,003 MB. Geometry was only
  29 MB; ~895 MB was transcoded KTX2 mip data (the .opt.glb props ship KTX2 sheets, 2048² + 11 mips ≈ 5.6 MB each, 4 per prop).
- three-renderer.js `_capModelTextures` skipped compressed textures ("small already"), so neither the phone's 512 cap
  (`_compactMobileModelTextures`) nor the spell props' `_WPN_TEX_CAP` touched them. `_capCompressedTexture` now drops the mip
  levels above the cap (the chain below is already there; dropped buffers are freed; the texture is disposed first so a GPU copy
  is re-made). Same build after: 180 MB at the title, 207 MB in a started VS CPU match. Capped props verified drawing (512²).

## THE HAUNTED LAWN BY DAY (2026-10-28, mondo: "why is the map so dark but the sky is bright and sunny? please fix")
Haunted House Arena, round 1 (the day half), Map Looks off, Haunted Green, Scene Fog off, in WebGL and WebGPU: the dome stood
bright overcast (dayLook fog 0x9aa4a0, clouds 0.7) over a board reading 33/255. The rig was the normal day rig (hemi 0.78, sun 0.6,
the same as the Bohemian Grove arena, which reads 54). Cause: the grounds' lawn and banks were still tinted for the night the room
was pinned to before 2026-10-17 (HQ_AREA_SPECS.prebuilt_haunted floorColor 0x3a4a34 / cliffColor 0x4a3e34, about a quarter of the
Grove's lawn in linear light), and the canonical day sun (27 deg) puts most of the 12x12 cut in the pines' shade, where only the
hemisphere reached the near-black lawn.
- floorColor 0x76906a / cliffColor 0x76665a (a greyer lawn than the Grove's).
- HQ_WORLD_CLOCK.dayLook rows take an optional `hemi`, a gain on the day hemisphere (three-renderer.js `_hqClockVals`, so the walk
  and the fight's day row both read it). site_prebuilt_haunted_grounds: hemi 1.5 (0.78 -> 1.17 by day). Night rows untouched.
- After: day 33 -> 48 (WebGL), 37 -> 49 (WebGPU); round 2 night 38. Sky, fog, looks, bloom, the clock's hours unchanged.
  Proof: /mnt/project-files/haunted-daylight/.
- ALL MAPS (same day, mondo: "make sure its not just the haunted house map"): all 22 outdoor clocked arenas measured the same way in
  round 1 (day). Every board read 50-130 except Göbekli Tepe, 40 under a 182 sky (the tell's floor dirt_3 is the darkest dirt,
  mean sRGB 47/40/31). Fix: the tell's floorColor/apronColor 0xc8a878 -> 0xecc89c and a dayLook row `site_prebuilt_gobekli_tell:
  { hemi: 2.0 }` (`hemi` is now read for a day room's row too; its other fields stay night-room-only). After: 57 (WebGL), 54 (WebGPU,
  was 39); night 34. Table + shots: /mnt/project-files/haunted-daylight/all-maps/.

## THE SHADER CACHE + THE ONE WRITE (2026-10-28, mondo: "Still lots of frame rate drops and jankiness ... in battle and exploration ... especially for spell animations")
Node renderer only (`?ew_gpu=webgpu` / `webgl2`); the classic WebGL default is untouched. Nothing on screen changes. Answer
doc (AAA techniques, numbers, proposals for mondo): https://claude.ai/artifact/EQxGVswEfpYPhVppuAyzbi
- Cause, measured (sandbox, cold 4v4 to round 4): 44 material builds (1.0 s), 63 shadow builds, 39 pipelines (35 s on
  llvmpipe), 23 frames over 1 s. Every spell look builds its shader + pipeline the first time it meets a fight in a page
  session; a reload forgets them all. Draw count is not the cause.
- **THE SHADER CACHE** (three-renderer.js `_ewSc*`, after THE KEPT SHADERS): when three builds a plain material
  (`N._createNodeBuilder`) inside the fight's or the walk's scene pass, `_ewScRecipe` writes a recipe (material type +
  changed props, texture sampling signatures, attribute layout, instancing, skinning, hooks `_hqAoHook` / vertex-colour
  emissive, defines). THE PROOF (`_ewScCheck`, 400 ms later): a stand-in made from the recipe must give the same
  material cache key AND byte-identical vertex + fragment code as the real build, else it is never kept. Recipes live in
  localStorage `ew_shaderCache_v1` (cap 400, newest kept, saved every 10 s + pagehide). THE WARM (`_ewScTick` in the frame
  loop): 600 ms into a fight / walk, one stand-in a frame is built with the frame's lights, target and MRT pinned
  (`_ewScPin`) and its pipeline made (compileAsync's steps), then dropped; the real object later finds the build and the
  pipeline cached. Refused (never kept): dressed materials (`_ewNode`, clipping), ShaderMaterials, morphs, unknown kinds.
  Off: `window.EW_NO_SHADER_CACHE` / `?ew_shadercache=0`. `ThreeRenderer.shaderCache()` = stats, `('clear')` empties.
  F3 line "Shader cache".
- A/B (same 16 spell looks fired with ThreeVFXEffects.fire('impact', …) after the warm, cold vs after a reload): plain builds
  5 (158 ms) -> 2 (49 ms), pipelines 5 (7.4 s llvmpipe) -> 2 (2.1 s), frames over 1 s 3 -> 1, p95 93 -> 61 ms. The warm cost
  40 stand-ins in 552 ms total, one a frame. The two left were fxBatch meshes whose layout was new in that run (kept next time).
- **THE ONE WRITE** (`_ewGpuOneWrite`, WebGPU backend): three wrote a uniform buffer as one queue.writeBuffer per run of
  changed values; now a buffer with 2+ runs is written once from the first changed value to the last (the values between
  are the CPU mirror's current ones, so the GPU holds the same bytes). Steady WebGPU battle: 807 -> 165 writeBuffer calls a
  frame (72 buffers coalesced). Off: `window.EW_NO_ONE_WRITE` (reload). `ThreeRenderer.oneWrite()`; F3 line "One write".
- Open for mondo (doc table): show-late on a miss, pre-build every look on the title screen, one shadow shader for fading
  trees, plate repaint rate, the 0.05 s camera step cap, the same cache for the classic WebGL renderer.

## THE LATE LOOK + THE SHADER CACHE ON WEBGL + THE TITLE WARM (2026-10-29, mondo: "can we start some threads to do some or most of these performance fixes? also keep in mind online PvP when doing these, just to be careful. experience has to be smooth online too for both players")
The shader cache doc's proposals 1, 2 and 6 (https://claude.ai/artifact/EQxGVswEfpYPhVppuAyzbi). three-renderer.js only;
no game state, nothing relayed, nothing drawn differently once a look stands.
- **Late look, classic WebGL (default renderer)** (`_glScSetup` wraps `renderBufferDirect`): in the fight's / walk's scene pass
  (main camera, the post chain's scene target, no override material), a material drawn for the first time whose look this
  session hasn't linked sits that frame out; next frame `renderer.compile(fakeScene, cam, liveScene)` hands it to
  KHR_parallel_shader_compile and it draws once its programs stand (4 s cap). First 600 ms of a fight/walk build as before.
  Without the extension nothing changes. A KNOWN material whose key changes (fading tree, shadow depth variant) still links
  at once; holding it would blink something already on screen (proposal 3 is the fix for trees).
  Transparent DoubleSide double pass: the side is read in `Material.prototype.onBeforeRender` (before three switches it).
- **Late look, node renderer** (`_ewLateSetup` replaces `_renderObjectDirect` with r186's body): new builds only while the frame
  spent < 4 ms on builds; new pipelines through `P.getForRender(ro, promises)` (createRenderPipelineAsync), `P.isReady` skips.
- **WebGL memory** (`_glSC`, localStorage `ew_shaderCacheGL_v1`, newest 400): recipe = the node cache's `_ewScRecipe` + the
  scene SHAPE (13 light counts, fog kind, env, shadow on/type, tone map, colour space, clipping). Proven in idle time: a
  stand-in in a rig built from the shape must get the same program cacheKey. Refused: ShaderMaterial/MeshLine ("material"),
  terrain/wind/fxBatch hooked materials ("dressed"): those still show late once a session.
- **Title warm**: title/menus/party builder compile one recipe a frame (none after a >50 ms frame) and hold the programs
  (THE KEPT PROGRAMS); node: the menu's pass warms too (tag 'm'). 600 ms into a fight with a new shape, re-warm there.
- Kill switches: `window.EW_NO_LATE_LOOK` / `?ew_late=0`, `window.EW_NO_TITLE_WARM` / `?ew_titlewarm=0`, memory
  `?ew_shadercache=0` / `?ew_keep=0`. `ThreeRenderer.shaderCache()` → `.gl`, `.late`; `shaderCache('late')` adds `.lateLog`;
  `shaderCache('clear')` forgets both caches. F3: "Late look", "Shader cache (WebGL)".
- Measured (sandbox harness, 16 fixed spell looks via `ThreeVFXEffects.fire('impact', …)`, Mount Shasta Arena, programs/builds
  counted inside `renderBufferDirect` / `_renderObjectDirect`, NOT FPS):
  - WebGL VS CPU fresh page: 34 programs linked inside a frame (28.9 s held) → 0 spell programs (1-2 shadow depth left).
  - WebGL online friendly room, both seats fresh: host 29 → 8 (58.5 s → 10.1 s), guest 19 → 4 (29.1 s → 5.5 s); the rest are
    tree / shadow re-keys.
  - WebGPU (SwiftShader) VS CPU: scene-pass pipelines made inside a frame 41 → 8 (render bundle re-records), frames 15 → 24 in
    the same minute. Node menu warm built 30 recipes in 2 min on the menu; its gain is under the run-to-run noise there.

## TREES, PLATES, CAMERA: proposals 3, 4, 5 of the shader-cache doc (2026-10-29, mondo: "can we start some threads to do some or most of these performance fixes? also keep in mind online PvP")
All three are each viewer's own (host and guest each draw, paint and step their own); nothing is relayed or synced.
- **ONE SHADOW FOR A FADING TREE** (three-renderer.js `_ewGpuCompat`, node renderer only): the occlusion fade's see-through
  clone (`_occCloneMat`) carries `_ew_occSrc` = the original; a wrapper on `r.renderObject` hands the ORIGINAL to the shadow
  pass, so no clone builds its own shadow shader + pipeline. The shadow never took the opacity, so it draws as before.
  Sandbox (Mount Shasta Arena, `?ew_gpu=webgl2`, round 1 + orbits): shadow builds while faded 12 of 45 -> 1 of 34 (the 1 is a
  tree faded before its original had drawn a shadow). The classic WebGL renderer already shares the program; untouched.
  Off: `window.EW_FADE_OWN_SHADOW = true` (live).
- **THE PLATE REPAINT RATE**: `PM_ANIM_MS` 40 -> 100 (a plate with a running CSS animation / transition repaints at ~10 fps,
  was ~25; a DOM change still repaints at once). The sandbox runs ~10 fps, where both rates paint every frame, so the A/B
  can't show there. Off: `window.EW_PLATE_ANIM_MS = 40` (live).
- **THE STEP CAP** (three-camera.js `STEP_CAP` / `_stepCap()`): every camera damp step capped at 0.1 s (was 0.05 s): the
  camera keeps real speed down to 10 fps. Sandbox at ~6-7 fps, one wheel zoom, 90% settled: 1.3-2.5 s -> 0.86-0.93 s.
  Mixers were already 0.1 s. battle.js / HQ walk / hud.js loops keep their 0.05 s (not camera). Off: `window.EW_CAM_STEP_CAP = 0.05`.
- Two-seat friendly (Area 51 Arena, `?ew_gpu=webgl2`, 2 rounds): host and guest counts equal, no page errors.

## THE LAB SWEEP (2026-10-30, mondo: "see why the balance lab and ai training is always freezing and crashing and takes a long time in between matches. I want to run it and leave it")
Measured in the sandbox (Chromium + llvmpipe, the board drawn like the in-browser lab, Balance Lab launched the way the menu does,
samples every 15 s: renderer/GPU process RSS, CDP heap, `renderer.info`, the memory-budget readout, a CPU profile).
- **The crash = memory that only grew.** The walk's memory budget (THE MEMORY BUDGET) never ran in a battle, and the unit models
  (`_unitGlbCache`) were never dropped at all. A lab plays a new arena and new races every match, so every arena's props and every
  race's model stayed parsed and on the GPU: by match 21 (10 min) props 218 files / 0.99 GB + unit models 171 / 1.2 GB, the tab's
  renderer 6.2 GB + GPU process 2.9 GB, climbing ~0.45 GB a match until it died.
- **The fix (three-renderer.js `_labSweep`, called from `_renderFrameBody` while `state.devAutoSim` and not in the walk):** every
  10 s the same budget (`_mmBudgetMB`, HQ_ENGINE_RULES.heapMB 700) is read in the battle; over it, props nothing draws and unit
  models no unit of this match wears (alive or dead), idle 30 s, are dropped oldest first to 85 % (24 a sweep). Never dropped: the
  animation libraries, loading/failed files, the roster's models (`_mmRosterUrls`), parked rigs (`_rigCarry`). `_mmRigEvict`
  disposes a unit model's geometry/materials/sheets; `_loadUnitGLB` stamps `at` on every use. The same sweep gives back the GPU
  copy of cached sheets no drawn material wears (`_labTexRelease`: `_hqTexCache` — one Texture per sheet AND repeat, the biggest
  grower — and the misc/foliage/horizon/rock sheet caches; `Texture.dispose` only, three uploads it again on the next draw).
  Off: `window.EW_NO_MEM_BUDGET` (the walk's switch).
- **The HUD:** `renderIfDirty` coalesced battle renders only for headless labs; every auto-sim with the animations hidden now
  coalesces too (250 ms with the board drawn, 500 ms headless). Was 11 % of the main thread + ~300 000 thrown-away DOM nodes.
- **The sprite scan** (ui.js `_finishSpriteOffsetScan`): read every new race's sheet back from a GPU canvas at full size (19 % of
  the main thread). Now a CPU canvas (`willReadFrequently`) at most 256 px tall; the gaps are percentages, native size kept.
- **The match history:** `state.matchHistory` (every unit + the whole combat log per match) keeps the last 40 while an auto-sim
  runs (unless `EW_BAL_AUTO_EXPORT`). The labs' own stats stores are untouched.
- **Result** (same harness, 30 min): 113 matches = 3.8 / min (before 1.5-2.0); builder → battle gap median 0.3 s, p90 4 s, every
  gap over 8 s in the first 4 minutes (first loads/compiles; before: p90 8-9 s, 24-31 s gaps mid-run); renderer RSS levels at
  3.2-3.7 GB and GPU 2.0-2.3 GB from match ~27 to 113 (before: 6.2 + 2.9 GB at match 21 and climbing). No watchdog fired in
  ~3 h of lab runs before or after: the freezes were long frames (GC, map builds, shader links) and the crash was memory.
- AI Training (same fixes, 9 min): 43 matches = 4.7 / min, renderer RSS flat at ~2.5 GB, no page errors.
- A background tab (simulated, Firefox-like: `document.hidden`, no rAF, timers clamped to 1 s; the sim clock's MessageChannel
  untouched) keeps the lab running — faster, nothing is drawn (AI Training: matches 9 → 41 in 2.25 min hidden). `beginBlitzRound`
  drives each match's first activation, so the boot's rAF is not on the lab's critical path.
- What is left in a lab's frame (sandbox): shader links when a new arena's light rig re-keys every look (THE LATE LOOK already
  links them on the driver's threads where KHR_parallel_shader_compile exists), the arena room build (`_hqBuildRoomInBattle`
  ~1.5 s a match here), the AI's own thinking.

## THE LAB GAP (2026-11-01, mondo: "the balance lab still loads really slow/freezes in between matches, on the party builder screen. Is it because its loading the map? Can we make it just cycle through like the same 5 random maps ... Or is something else from the party builder that is making it slow?")
- Measured (sandbox, llvmpipe, Balance Lab launched like the menu, CPU profile sliced to the between-match windows; harness in
  project files `lab-gap/`): the party builder itself costs nothing. The freezes were THE FLOOR PLAN COMPILE (data.js
  `hqTerrainCompile`, 14-17 s a big room here) run up to THREE times a match:
  1. `_simApplyModeAndMap` → `hqArenaUpgrade(compile)` for a room the lab had not played yet (once a room, sync, on the builder
     screen: the 17 s freeze mondo saw there);
  2. + 3. every battle start: `_hqBuildRoomInBattle` builds from a SHALLOW COPY of the room (`Object.assign`, which drops the
     non-enumerable `_terrainInfo`), and `_hqBuildOuterGround` / `_hqBuildDoors` / `_hqBuildCityEntrances` ask the copy for a
     door's sill (`hqTerrainDoorY`) → the copy found no record and no room id → a full compile on the main thread, under a null
     seed (another floor plan than the one drawn), thrown away with the copy. EVERY match, VS CPU arena fights and HQ
     encounters included.
- Fix: `hqTerrainDoorY` on a copy (same `terrain` + `shell` objects as a room row) reads that row's record (`hqTerrainInfo`, cached);
  map.js `_simWarmNextMap` hands the lab's NEXT map to the survey worker while this match plays (`_hqArenaWarm`, VS CPU's own
  off-thread path), so a new room is ready by the restart; three-renderer.js `_ewKeepScale`: a lab run (state.devAutoSim) holds 3×
  the kept programs (WebGL 640 → 1920, node keeps ×3) — the 71-board pool (36 rooms, ~25 programs a room's light rig) filled the
  640 two thirds of the way round, after which every later room linked its looks again on each visit.
- THE FIVE ARENAS: Settings → Map "Rotate 5 random arenas (faster between matches)" = Rotate over 5 arenas drawn from the PvP pool
  at launch (`_trainMapFew`, `_trainMapFewOf`; headless `_ewSimSetup(mode, 'rotate5')`). Default stays the full rotation.
- Before → after (14 min, same settings): 19 → 26 matches; longest frame 22.4 s → 14.2 s (what is left: in-frame program links
  for a room's first visit on the software GPU); no `hqTerrainCompile` left in any gap.

## THE BOARD FOG (2026-11-01, mondo: "i want the fog to get denser the further away from the board, not from the camera ... dont want to see that corner and edge ... i still want to see the sky in heavy fog settings, thats what i mean by horizontal ... this battle fix should be for online too")
- **What it was:** every fight (story field fight, PvP arena, voxel board) drew the room's / the preset's FogExp2 measured from the
  CAMERA, plus the room's height fog (also camera-distance). Zoomed out, the board sat deeper in fog than the far ground, and the room
  just ends: past it only the dome, whose band covered part of the view, so the ground's corner and edge showed (his Fairy Forest
  Arena shot). Exploration has the same camera fog + ground mist; it reads fine there (the camera rides close behind the walker).
- **Now (battle):** the patched fog chunks (`_ewHeightFogPatch`) and the node twin (`_ewNodeLayer` updateFog) carry a second term
  read from `_EW_BFOG` / `_EW_BFOG2` / `_EW_BFOG3` (shared plain objects like `_EW_HFOG`, node uniforms `bfog*` in `_ewNodeTick`): the
  fragment's flat distance from the board's rect (0 inside: the board, units and VFX are never fogged), FogExp2-shaped, full by
  `reach`, times a BANK term (full up to a top that rises `slope` per unit out, thinning over `soft` above it: a far hill or a castle
  tower stands out of it). `uEwBFog2.x` is the share (0 = the stock camera fog exactly). `_bfogTick` (battle frame, before
  `_skyOpenTick`, which thins it with the rest during a sky shot) writes it; `_bfogDome` makes the dome band full at / below the
  horizon and clear above `top`, in the scene fog's colour, so fogged ground meets the band with no seam and the sky stays visible.
- **The edge:** `_bfogEdge` = the nearest side of `_facilityNearGroup` (the fight's room) or `_nearOccGroup` (a voxel board's near
  setting) round the board, re-measured every 2 s for the first 12 s (late GLBs), else `BFOG.edgeFallbackTiles`. `reach` is never
  farther than it, so the ground's edge is fogged at any zoom. The bank's floor = the board's lowest square (`tileTopY`).
- **Settings:** Scene Fog off = no fog (no scene fog, share 0). Fog Density = how close to the board the fog closes in (`reach` =
  8 squares at the factory 55 %, ≈4 at 100 %, the map's edge at the low end: `BFOG.reachTiles / getRetroFogScale()`). Fog Horizon =
  the bank's climb (`_ewFogClimb`, ½ … 3.5×) and the dome band's top (= the slider's value, min 0.02). Defaults unchanged.
- **The change of scene:** `_bfogArm(fromWalk)` in activate(): a fight entered from the walk (`_fieldGroundArmed`) starts on the
  walk's camera fog and eases to the board fog over `BFOG.easeMs` (1.6 s); a fight from the menus starts on it. deactivate() →
  `_bfogLeave`: a field fight hands the board's rect + shape to the walk in the ROOM's frame (`st.bfogM`, the room → battle matrix
  stored by `_fieldGroundDress`); `_bfogWalkTick` (top of `_hqFogHold`) eases it out from the walk's first frame (same room only),
  dome band too (`_hqFogBack` restores the room's). `_menuEnter` / `_trEnter` clear it. Exploration keeps its camera fog: the camera
  sits at the walker, so distance from the eye IS distance from you, and a board rect means nothing on a walk.
- **Scene Fog off no longer takes the fog off the battle scene** (three-post.js `_applySceneFog`, three-renderer.js
  `_hqBuildRoomInBattle`): the FogExp2 stays at density 0. On WebGPU, toggling it off mid-fight (main as of 11-01) rebuilt every
  render object and the next submits used destroyed binding buffers ("used in submit while destroyed"): the picture froze and
  turning fog back on did nothing. Same rule as the walk's `_hqFogHold` and the void (THE VOID WITHOUT A RECOMPILE).
- Proof shots (WebGL + WebGPU, near / far, settings, the ease): /mnt/project-files/board-fog/.
- Online: drawn on each seat from the same board, nothing to relay. Probe: `ThreeRenderer.boardFog()`. Off: `window.EW_NO_BOARD_FOG`.

### THE FOG FADE (2026-11-01, PR after #760)
mondo: "the contrast between the board and the fog is pretty stark ... have it slowly get more dense from the board outward, not a
sharp cutoff around the board, that would be like the max setting on the slider". Before this, Fog Density moved where the board
fog was full (R), but nothing changed how sharply it climbed from the rim (always 1 - exp(-(2.6 d/R)^2): half fog at about 0.35 R).
- New setting **Fog Fade** (Settings > Video > Retro / Haunted, under Fog Horizon; three-post.js `_retro.fogFade`, 0..1, saved in
  ew_retro, factory 1). 100 % = that sharp curve, exactly as #760 shipped it. Lower blends in a straight ramp from the board's rim
  that is full only by L = R × (1 + 2 × (1 - fade)), never past the map's edge (so the edge stays hidden). 0 % = the ramp alone.
- Shader: `uEwBFog3.y` = 1 / L, `uEwBFog3.z` = the ramp's share (1 - fade), in the GLSL chunk and the node twin (`B3`). The way
  back to the walk converts 1 / L into the room frame like `den`. Probe: `ThreeRenderer.boardFog()` now has fadeLen + fadeSoft.
- On his shipped setup (Density 10 %) R is already at the map's edge (Fairy Forest Arena: about 19.6 squares), so the ramp is only
  softer, not longer. At Density 55 % the 0 % ramp is 2.4× longer. Shots: /mnt/project-files/board-fog/7-10.

## THE WHITE SHEETS (2026-11-03, mondo on the Heaven Arena: "something about these clouds is just really hard on the eyes, i cant see what im looking at. Bloom is off in the game but any map or area that has a lot of white still looks super bright")

**Cause (measured in the Heaven Arena on his shipped settings).** The scene draws into an 8-bit target with no tone map (three
only tone-maps a draw into the canvas, and three-post.js `_hdrSupported` reads `!THREE.NoToneMapping`, which is 0, so the HDR
chain never runs). A lit surface is texture × light. Daylight puts about 1.35× on a floor in an open room (hemi 0.78 of a
near-white sky + sun 0.6 + fill 0.14 + the brazier lamps) and about 1.5× on a battle's day rig. cloud_2.png has a mean sRGB of
0.92 and marble_light.png 0.88, so the whole sheet goes past 100% and is stored as one flat white. The marble's pattern, the
cloud shading and the sun-disc marks are gone before any later step runs.
- Filmic Tone (ewFilmic, on in his setup) then maps that white to about 0.91 and lifts light greys toward it.
- Filmic off shows the clip as pure white (35% of the board).
- Brightness, auto exposure and bloom act after the clip, so they cannot bring the pattern back.

**Options shown to him** (/mnt/project-files/white-glare/): A lower the light per map, B darken the white sheets, C auto-dim the
lights on white views. He picked B.

**THE WHITE SHEETS (sprites.js `TERRAIN_WHITE_SHEETS`, three-renderer.js `_ewWhiteGuard` in `textureLoader.load`).**
- What it changes: every terrain sheet whose mean brightness is 0.8 or more (measured off the R2 files) is darkened ONCE as it
  lands, to a mean of about 0.66. The pixels × the row's value go into a canvas; alpha is kept.
- The sheets: cloud, cloud_2, ice, ice_1, tilefloor, tilefloor_2, marble_light, enamel_2, wallpaper, floral_2.
- Keyed by FILE, so every key, map, room, wall, spell block and prop that wears the sheet gets it.
- The light is not changed.
- A Chromium bitmap (THE BITMAPS) was flipped at its decode, so its canvas copy is drawn back the file's way up and the
  texture's flipY handles it like an <img>.
- Not covered: textures inside GLB models (white statues, cloud prop models) keep their own pixels.

**THE WHITE DAYLIGHT (the same day, mondo: "can we just make light not 130% too? that seems so excessive ... A/C looks better
because i can actually see the middle thingy. so maybe do a c and b?" + "i dont want the game to change lighting based on the
white on the screen").** Nothing reads the screen. The light is lowered only where the ground is white, so grass, dirt and units
on other maps keep their light (he said in October the game was too dark). HQ_LIGHT_RULES.whiteDay = 0.75.
- ROOMS: an open room whose floor (terrain.floor, else shell.floor) is a white sheet wears its sky light × whiteDay.
  `_hqWhiteDay` / `_hqOpenLR(room)` in three-renderer.js scale the DAY hemisphere and sun key only. The night rig is left
  alone (follow-up the same day: Agartha Arena, a night room, came out too dark).
- Where the room rule applies (every `_hqLightRules().open` read): the walk (_hqEnter), the world clock (_hqClockVals,
  _hqStageSkyValsRaw) and the room fight's field light + the battle's day / night halves (_fieldGroundDress, _fieldCycleRig).
- TILE BOARDS: when half or more of the board's top tiles wear a white sheet, three-renderer.js `_boardWhiteDay` (each
  rebuildTerrain) calls ThreePost.setWhiteDay(0.75). That scales the battle rig's sun, hemisphere and ambient in _applyCurrent, by day
  only (`_whiteDayK` eases it back to 1 with the night factor).
  A room fight's field light is not scaled again.
- Fixed per map from what it is built of. Lamps, emissive glows and VFX are untouched.

**THE MARBLE MAPS CHECK (the same day, mondo: "can you also check other marble heavy maps").** Shot the Olympus, Antarctica,
North Pole, Agartha, Atlantis, Vatican and Looking-Glass arenas. Olympus, Antarctica and North Pole read fine under 0.75. Agartha
(a night room) was darkened by the first cut, fixed by the day-only rule above.
- THE GROUND TINT: Atlantis Arena (a closed box room) still clipped. Its floor wears shell.floorColor 0xb8c8c8, but the dais
  flight's mass and flanks (_hqBuildBuiltStairs sideMat, the stairs pack's side bucket in _spBuildFlights) were drawn in the
  cliff sheet with no floorColor, so the stair stood about 35% brighter than the floor and went flat white. Now the flanks in the
  room's cliff sheet wear floorColor, like the field's own cliff skirt and the editor boxes. A flight with its own `side` sheet
  keeps it untinted.
- THE WHITE ROOMS: Vatican City Arena (the basilica, a closed box room, floor `marble` = marble_light.png) clipped flat white in a
  pool round the point the camera looks at. That pool is THE KEY LIGHT (the point light riding over the look point, battle 1.5 ×
  the Key Light setting × 2 = 1.65, decay 1). Measured on the close view: Key Light 0 → 20% of the view at the grade's top
  drops to 0.6%; key light + hemisphere + key × 0.75 → 3%. `_hqWhiteIn(room)` = whiteDay for a CLOSED box room whose floor is
  a white sheet (else 1). It scales the hemisphere and the key (`_hqBoxLightVals`, `_hqIndoorLightVals`, `_hqLightArm`, the
  fight's `_fieldGroundDress`) and the Key Light (`_hqKeyLampTick` on the walk, `_fieldKeyLampTick` via st.keyWhite in a
  fight). The fill and the room's own lamps keep theirs. Rooms it hits: vatican_basilica, atlantis_temple and the DOOR HQ tiled
  rooms (kitchen, coldroom, laundry, bathroom, locker, natatorium, autopsy, tank).
- THE WHITE ROOM (2026-11-05, mondo on the Select Your Team room: "this room looks like it didnt get the fix that clouds and
  marble terrain got where they are too white and the light is making it too bright, it looks ugly af"). The Squad Desk's team
  room (three-renderer.js `_trBuild`, THE TEAM ROOM) has its own light rig outside HQ_LIGHT_RULES, so neither rule above reached
  it. Measured: the back wall took about 1.8× light (key 0.61 + fill 0.44 + hemisphere 0.52 + the ceiling lamp 0.24, all
  head-on), so the beige drywall (aged_beige_office_drywall.png, mean 0.69; under the 0.8 bar of TERRAIN_WHITE_SHEETS) stored as
  flat white. Now: the room's five lights × HQ_LIGHT_RULES.whiteDay (`_trWhiteK`, 0.75; the desk lamp keeps its own), and the
  room's drywall wears colour × `TR_ROOM.wallTone` (0.78), in this room only (the building's other drywall rooms keep theirs).
  The light alone (0.75) still left the back wall cream-white; the sheet tone is what brings the paint back. Proof:
  /mnt/project-files/white-glare/team_room_before_after*.jpg.
- THE DRESSED REVEAL (2026-11-05, mondo: "the mpfb bodies load naked before the clothes come on. Wtf is the point of the
  manifesting loading symbol if youre just gonna flash a god damn naked body before the clothes load?"). Every stage showed a
  creator body the moment its body GLB resolved, while the look's pieces (pack / Blender garment GLBs, hair, wings, the body
  sliders' shapes file, the look PNGs, fabric tiles, the eye pack, the own lashes) were still downloading. Now
  `_createAppearanceRig` counts every async load it starts: its own `_ccLoadWear / _ccLoadHair / _ccLoadWings / _ccLoadImage /
  _ccLoadFabric / _ccLoadEyeProxy / _ccOwnLashMap` shadow the shared ones (`_ccShared`) for that rig and wrap each callback
  (`dressHold`; the count drops AFTER the callback ran, so a load it starts in turn is counted first). The rig exposes
  `dressed()` and `whenDressed(cb)` (cb at once when dressed; after CC_DRESS_MAX_MS = 20 s at the latest). The stages:
  the creator stage (`_cvSetCharacter`) keeps `ew-cv-loading` (MANIFESTING, canvas at opacity 0) until dressed (`v.dressWait`
  stops the same-character path flipping it to ready early); the board / HQ walk (`_attachUnitModel`) hides the model and keeps
  the sprite stand-in until dressed (`_unitRevealDressed`; the rig-cache fast path leaves the stand-in to it); the team room's
  `show()` and the unit dock wait too. Later picks on a live body are not hidden (the old garment stays until the new one is in).
  Rev 2 (same day, mondo: "i still see the naked flash briefly"): the creator stage hid only its CANVAS (CSS opacity, a 0.5 s
  fade). On a body swap with the new body GLB already cached, the new body was added while the canvas was still fading out
  of the last character, so the bare body drew at up to full opacity for ~9 frames (caught by a per-render frame capture on
  Cowboy -> Demon). The stage now also hides the body itself (`wrap.visible = false` until whenDressed); the beat cancel's
  "never leave the hero gone" reset respects `v.dressWait`. Frame capture before / after: /mnt/project-files/dressed-reveal/flash-frames/.

## THE CACHED LANDING + THE MASK SEES NEW MODELS AT ONCE (2026-11-05, mondo on the Singularity Arena, WebGPU: "these crystals are not pixelating, or it looks like they are flickering on and off of being pixelated")
- Cause (measured in the cloud browser, WebGPU and the WebGPU renderer's WebGL2 backend): on a board with crystal tiles,
  `rebuildObjects` ran EVERY frame (7 rebuilds in 7 frames). `rebuildObjects` clears `_objectsDirty`, then calls
  `rebuildTerrainDecorations`; each crystal tile's cluster is `_gemCluster` → `_crystalModel` → `_miscModelInstance`, and a
  model already in `_miscModelCache` lands synchronously inside that call, whose callback set `_objectsDirty = true` again.
  So every board object and every crystal was a new mesh each frame. ThreePost's models-only pixelate mask only tags meshes
  (`_ew_pixelate` → camera layer 8) in a scan every PIX_SCAN_MS (400 ms), so at 30 fps the crystals were in the mask about
  one frame in twelve: the flicker, smooth most of the time.
- Fix 1 (three-renderer.js `_miscModelInstance`, THE CACHED LANDING): a landing inside the call only sets `_shadowsDirty`;
  a file that lands later still sets `_objectsDirty` as before. Board objects + decorations now rebuild only when something
  really changes (also a CPU win on every crystal board since PR #788/#792).
- Fix 2 (three-post.js THE MASK SEES NEW MODELS AT ONCE): `THREE.Object3D.prototype.add` bumps a counter (`_pixHookAdd`),
  and `_renderPixelMask` re-scans on the first frame after any add, so a rebuilt board, a new instance-pass batch or a
  spell prop clone is pixelated on the first frame it draws. The 400 ms timed scan stays for a flag set after the add.
- Online: looks only, both seats run their own renderer; nothing relayed.

## THE CORE ADAPTER (2026-11-05)
mondo's Firefox console (M1, ?ew_gpu=webgpu) warned: `User requested a WebGPU adapter with featureLevel: "compatibility", which is
not yet supported` (three.webgpu.js; bugzilla 1905951). three 0.186.1 WebGPUBackend.init() always asks for featureLevel
'compatibility' and requests the device with requiredLimits {}. three-renderer.js `_ewGpuCoreShim` (called in _ewMakeBoardRenderer,
mode webgpu only) wraps navigator.gpu.requestAdapter: on Firefox it drops featureLevel (core, the default; same adapter, no warning),
Chrome/Safari keep three's ask; on every browser the device asks for the adapter's maxVertexBuffers when above 8 (Dawn caps at 8, so
Chrome is unchanged). The adapter + device vertex limits print on the `board renderer:` console line and in gpuStatus()/?ewdiag=1.
Off: ?ew_gpucore=0. Meshes over 8 vertex buffers are still fixed at the mesh (cloth-collision attributes interleaved, team-select thread).

## THE CDN PROBE READS ITS ANSWER (2026-11-05)
index.html "THE CDN CORS PROBE" fetches `Assets/world/terrain/scorched.png` (moved there in R2 layout W4, PR #898 era; the old
`Assets/Sprites/terrain/` key is archived and answers 404). The probe used to throw on any non-OK status, so a moved probe
file showed a false "CDN BLOCKED" banner. Now any READABLE response (R2 sends Access-Control-Allow-Origin on its 404s too)
counts as "CORS fine": `_ewCdnCorsBlocked = false`, and a non-OK status only console.warns that the probe key needs updating.
The banner shows only when the fetch itself fails (the real CORS block, or no network). Checked in Chromium: localhost:3000
(allowed origin) no banner; probe rerouted to the archived 404 key, no banner + the warning; 127.0.0.1:3000 (not in the
bucket's CORS list) banner shows. Bucket CORS origins: entropywars.net, www.entropywars.net, entropywars-prototype.onrender.com,
localhost:3000.
## THE PER-FRAME AUDIT: THE STILL BATCHES + THE LANDING REBUILDS ONLY THE OBJECTS + THE STILL STAGE (2026-11-05, mondo after PR #939: "what other random items in the game are rebuilding every object on every frame ... fix any bullshit")
- Method (cloud browser, classic WebGL + swiftshader, no input): `instr.js`-style page hooks counted, per frame, every
  `Object3D.add/remove/clone`, `BufferGeometry.setAttribute/dispose`, `Material/Texture.dispose`, every `needsUpdate` on a
  texture / material / buffer attribute (= a GPU re-upload or a program re-check), new Object3D / geometry / material / texture
  ids (one probe instance of each before and after a window), `renderer.info.memory`, DOM mutations (MutationObserver) and
  `createElement`, each with its call site; plus a timing wrapper on every `rebuild*` (a served copy of three-renderer.js,
  never shipped). Scenes: Singularity Arena + Fairy Forest boards (VS CPU, HUD up), the HQ lobby, the Squad Desk team room
  with a random team, the creator stage, the post chain (N8AO + SMAA = 12 renders a frame, all from the settings).
- Clean once loaded (0 new objects / geometries / materials / textures a frame): both boards, the HQ, the team room, the
  creator stage. PR #939's crystal loop is gone (0 rebuilds in 45 frames on the Singularity Arena).
- THE STILL BATCHES (`_hqInstSync`): the instance pass's compare cache was a Float32Array, compared with double matrices, so it
  never matched (0.2290346920490265 vs 0.22903468738956553): every copy of every batch was rewritten and every batch's
  instanceMatrix re-uploaded EVERY frame with nothing moving. Measured 81 batch uploads a frame in the HQ lobby, 25 on the Fairy
  Forest board (the battle's room batches through the same code). Now a Float64Array: 0 uploads a frame when still.
- THE LANDING REBUILDS ONLY THE OBJECTS (`rebuildObjects(soft)`, `_objectsLanded`): every object rebuild also reset the unit
  serials (a full `rebuildUnits`: bodies, name plates' DOM + canvas repaint, unit lights) and rebuilt every terrain decoration,
  whatever triggered it, and most triggers are a file landing while a fight opens. Measured on the Fairy Forest load: ~45 unit
  rebuilds of 15-50 ms in 150 s, then decorations at 15-100 ms each. The 28 loader callbacks now set `_objectsLanded`; the frame
  runs `rebuildObjects(true)`: objects rebuilt (the landed model swaps in), decorations kept, units kept unless the battle room's
  ground read moved (`_fieldGroundCache.key`, e.g. a drawn roof landed). Every other trigger (`_objectsDirty`: the object
  serial, rebuildTerrain, resets, the memory budget; any external `ThreeRenderer.rebuildObjects()`) is the full rebuild as before.
  After: 1 unit rebuild in the same 150 s.
- THE STILL STAGE (battle.js): the camera wrote the same `#boardStage` transform string every frame (an inline-style change =
  a style recalc of the stage each frame) and `_renderDialogueBox` re-added/removed the subtitle bar's `visible` class every
  frame; both now write only on a change (the stage reads its style back, so the 2D pan's own writes are still caught).
- THE WARM-UP ON THE NODE RENDERER (`_hqWarmBegin` / `_hqWarmRun`): on ?ew_gpu=webgpu / webgl2 `renderer.compile` is
  compileAsync, which calls the scene's `onBeforeRender` and walks `children` / `layers`; the warm-up's stand-in scene had
  none of them, so every warmed object threw asynchronously (the try/catch never saw it): 600+ uncaught "sceneRef.onBeforeRender
  is not a function" errors each time an HQ room / part built, and nothing warmed. The stand-in now has no-op hooks, every
  layer, and `children` = the object + the warm's lamps; the promise is caught. Measured on the WebGL2 backend: 0 errors.
- Left as is (by design, not waste): three's own two-pass draw of double-sided transparent materials (2 `material.needsUpdate`
  per such mesh per frame inside WebGLRenderer), bone textures of skinned units, CSS2DRenderer's per-frame transform on the
  two CSS2D plates, video / skeleton textures.

## THE TWIN MORPHS (2026-11-05)
Classic WebGL threw `Cannot read properties of undefined (reading 'length')` from three's morph update every frame once a creator
body's eyes got their face shapes (blink/glance): the x-ray + team-outline twins (`_attachUnitModel`) are built on the parent
mesh's own geometry BEFORE rebuildGeometry writes morphAttributes onto it, so the twin had no morphTargetInfluences. 4 creator
units = the board stopped drawing. Fix (three-renderer.js): every twin's `onBeforeRender = _twinFollowParent` takes the parent's
influences + dictionary each draw (and follows a swapped parent geometry); `_cloneUnitModel` gives every skinned mesh of a clone
(hologram, finisher double, race actor, team room) `_morphListGuard`, which rebuilds a missing / wrong-length list before the draw
(Object3D.copy drops onBeforeRender). The node renderer never threw. Probe: /mnt/project-files/twin-morphs/ (classic WebGL,
EW_RACE_LOOKS_ARE_DEFAULT=true, cowboy/santa/demon/catgirl x2 on a TDM board): before = hundreds of errors and a blank board, after = 0.

## THE WHOLE BODY (2026-11-06, playtest A1: created looks missing at battle spawn)
Playtest 11-05 (PLAYTEST_BUGS_20261105.md A1/C4): the saved Cowboy/Catgirl looks showed a name plate and no body on their
Camelot spawn squares, Santa only his red suit. Not the spawn prism and not far culling. Cause: THE LATE LOOK (node renderer
`_ewLateSetup`, WebGL `_glScSetup`) holds every NEW look out of the frame till its own build stands, a few a frame; a created
character is dozens of looks (skin, eyes, lashes, hair, each garment, outline/x-ray twins), so a body first drawn after a
pass's first 600 ms came in piece by piece. The harness draws only 3 frames a screenshot, so there it stayed in pieces for
minutes; a real browser drawing every frame mostly builds them under the loading card, but a late dress / slow download /
the walk showed the pieces arrive. Fix (three-renderer.js): `_createAppearanceRig` marks its root `_ew_whole`; in the scene
pass a not-yet-shown body draws none of its pieces while any is still building (`_lwGate`, the builds go on), and shows
whole from the first frame all stand (`_lwTick`). First showing only (a drawn body never blinks for a new piece); a body
drawn in the pass's first 600 ms counts as shown (`_lwSync`); cap 4 s AND 240 drawn frames. Counts:
`ThreeRenderer.shaderCache().late.wholeBodies / .wholeHeld`. Browser-checked on Camelot (VS CPU, saved Cowboy/Catgirl/Santa
looks + DOOR Agent), frame by frame: WebGL2 backend before = red suit + specks for ~400 drawn frames, after = nothing then
all three whole at once; classic WebGL after = whole. Proof /mnt/project-files/whole-body/.

## THE GUEST'S RESULT EVERY MATCH + THE REMATCH VOTE (2026-11-07, timing/counters playtest H7 + H8; mondo: "Go ahead and start those fixes")
- H7 (guest stayed on the board after a sudden-death win, host on VICTORY): not the sudden death. online.js `_applyRemoteState`
  ran the guest's finalizeMatch once per `st._guestResultShown`, a bare `true` that only a rematch cleared. A second online match
  in the same page (Main Menu, new room) never showed its result. The latch holds the match's `NET.matchId` now, and
  `_ewResetOnlineMatchFlags` (every room in / out) clears it plus `_guestBoardBuilt`. (The 10-23 "THE LAST WORD" heartbeat was
  the same symptom.)
- H8 (REQUEST REMATCH started a host-only match against an unpicked team): ui.js binds the static `#nextMatchBtn` at load, before
  online.js wraps `continueToNextMatch`, so online the button ran the OFFLINE next match on the host (the server then dropped the
  host's snapshots, no votes). online.js rebinds the button to the wrapper right after wrapping; the wrapper is a vote only after
  a decided match; both votes -> `_startOnlineRematch` (both seats to team pick, the lock again).
- Proof (two real browsers, local server, live R2 code vs LOCAL_ASSETS=online.js, sudden-death kill ends each match):
  /mnt/project-files/online-result-rematch-20261107/. Live code: match 2 guest on the board (`M2_guest_before_fix`), host
  rematch = host in match 3 alone (`H8_host_before_fix`). Fixed: match 2 guest DEFEAT / host VICTORY, request -> guest
  "Accept Rematch" -> both party builder (still there 20 s later, no picks) -> lock + start -> match 3 -> both results.

## THE BLACK PYRAMID (2026-11-07, zones/traps playtest D5)
Pyramid Protocol's ziggurat blocks stood solid black (cyan glyph band only). Cause: a spell-made monument (`state.monuments`,
three-renderer.js `_buildMonumentObj` → `_hzZigguratBlock` / `_hzCastleWallSeg`) is built mid-battle when the spell lands, and its
builder asks `_hzTex` for its sheet (desert sand / castle bricks) only then. A board that never drew that sheet had never loaded it,
and a three.js texture with no pixels draws BLACK until it lands (seconds behind a busy model queue). Reproduced in Chromium with
real R2 sheets by slowing sand.png: blocks black with the sheet in flight. Fix: `ThreeRenderer.warmSpellMonuments()` builds every
`monument.kind` found in SPELL_BY_ID / RACE_ABILITY_BY_ID once, off-scene (warm copy's grade mats spliced off `_horizonMats`, then
disposed; sheets stay in `_hzTexCache`), called from `ThreeVFXEffects.warmSpellLibrary` and from the battle loading card (battle.js,
inside the asset gate, so a beach board's own desert sheet is warmed too: keyed kind + `_ewSandPart('desert')`). Proof shots:
/mnt/project-files/playtest-mechanics-20261107/pyramid-black-fix/. Any NEW spell monument kind is covered automatically.

## THE LATE SHEETS (2026-11-09, mondo on the Heaven Arena: "what are these black squares on heaven?")
WebGPU (`?ew_gpu=webgpu`, and the node renderer on WebGL 2) drew Heaven Arena's cloud-path squares solid black with soft edges
(the path blend). Classic WebGL was fine. Cause: a terrain room's field is one triplanar material whose cliff / path / painted
sheets live in its NODE GRAPH (`_ewNodeTag` D → `_ewNodeTerrain`), not in a material slot. three r186 re-reads a render
object's bindings only when its material observer sees a change, and the observer watches the slots (map, emissiveMap…), so a
sheet still loading at the field's first draw was bound as three's empty placeholder texture and never re-bound when it landed.
A sheet some other mesh wears as `map` got uploaded through that mesh; heaven's path (`cloud_2.png`, 1024², drawn by nothing
else) never did. Probe: `r._textures.get(D.path)` → `isDefaultTexture: true`, `version 0` while the texture was at version 1.
Same scan (9 arenas, node renderer on WebGL 2, before): Giza's path (`dirt_2`) and Camelot's path (`cobblestone`) were black
too; Shasta, Stonehenge, Hell, Babel, Olympus, Derelict clean (their sheets landed first or are worn elsewhere).
Fix (three-renderer.js `_ewNodeLayer`): `r._nodes.needsRefresh` is wrapped — a render object whose material carries `_ewNode`
gets one FULL refresh whenever the id/version signature of its node sheets (`_ewNodeSheets(D)`: every texture in D, arrays too)
changed since its last refresh, so the landed sheet is uploaded and bound. The WebGPU render bundles (`_ewBunMat`) now hash the
same node sheets, so a static bundle re-records (and refreshes) when one lands. Covers every hooked material with its own
sheets (terrain, fluid wave sheets, painted grids), every board, room and walk. Classic WebGL never runs this code.
Proof: /mnt/project-files/heaven-black-squares/ (before/after, node renderer on WebGL 2; headless WebGPU frames are black).

## THE BOUNCE + THE CEILING LAMPS FIRST (2026-11-09, mondo in Disaster City's mall: "the inside of the mall is all black")
His shot (Firefox, `?ew_gpu=webgpu`): the mall's floor lit, the ceiling, the gallery undersides and the top of the 12 m walls
near-black, only the lava lamps and the saucer glow sprites showing. Two causes, neither in the mall's data (unchanged since 09-30):
1. **The hemisphere ground colour.** A closed box room's HemisphereLight ground half was a fixed near-black `0x1c1a1e`, so every
   face that looks down took only the lamps near it. A 3.4 m office is lit by its fluorescent; the mall's 96 × 64 × 12 m hall
   is not. Probe: setting the ground colour white took the ceiling from ~20 to ~85 (8-bit) on screen; doubling the hemisphere
   intensity changed nothing there. Fix: `_hqBoxHemiG(room)` = `0x1c1a1e` lerped `HQ_LIGHT_RULES.bounce.amount` (0.6) toward
   the room's `shell.floorColor` (else `bounce.color` 0x8a847a; 112 of 122 closed rooms have a floorColor). Read by `_hqEnter`'s
   box branch, `_hqIndoorLightVals` (a door join's blend) and the field rig (a fight in the room). A dark floor throws back
   little, so caves and crypts stay dark. Open rooms, bays and the round hall keep their own rigs.
2. **The prop light budget.** `HQ_PROP_LIGHT_MAX` (10) went to the first rows that asked: the mall's 2 table lava lamps,
   2 floor lava lamps and 6 slot machines took all ten, so its 6 saucer pendants and 3 sputnik lamps (the room's overhead
   light) hung unlit. `_hqPlaceProps` now ranks the light rows when a room asks for more than it has left: ceiling lamps
   (`cat.ceil` / `p.ceil`) first, then row order. Only the mall lost ceiling lamps (scan of every room); Agartha's crystal city
   and the inner sun ask for >10 but have no ceiling lamps, so they keep exactly the lights they had.
Checked: every mall area, H-Wing's floor and a DOOR HQ room (the cafeteria) on the node renderer on WebGL 2 (headless WebGPU is
black). Harness note: in headless swiftshader a freshly entered big room draws floors / the walker black for minutes while
its shaders compile (they are skipped until ready); shoot each view twice and keep the second. Proof:
/mnt/project-files/mall-black-interior/.

## THE FRAME RATE PLAN 1 (2026-11-10, mondo: "proceed with plan 1")
The options doc (11 options, 3 plans; https://claude.ai/artifact/EZN4WmV1dJCm6uFB3sn3GA) named four fixes that change
nothing on screen. Three shipped, one was built, measured and taken out. Every one is the viewer's own drawing: nothing
is relayed, online is untouched. Measured on the node renderer with `?ew_gpu=webgl2`, 1280x720, software raster (counts
are true, milliseconds are the sandbox's).

- **THE ZERO STRENGTH** (three-post.js `_ngSig`). Both AO looks of the node chain are an exact identity at strength 0
  (the shipped `ew_polish.ssaoStrength`), yet the half-size AO pass and its full-size mix drew every frame. At 0 the
  chain is now the set without AO: key `smaa|off|-DF`, 8 passes in place of 9. The slider brings the passes back the
  frame it moves. Node chain only (WebGPU / webgl2): the classic chain's N8AO floors its intensity at 0.5, so 0 is NOT
  an identity there and it is left alone. Off: `window.EW_AO_AT_ZERO = true`.
- **THE STILL TORCH** (three-renderer.js `_hqHeroGate`, the hero light's six-sided map). The map is HELD while no shown
  caster inside the light's reach has changed: which pieces cast is hashed exactly (any change redraws, then 1.5 s of
  redraws), where each stands (a rigid piece's world matrix, a body's every bone) is compared with where it stood when
  the map was last drawn, and the map redraws once a piece has moved further than a QUARTER of one texel of the map at
  its distance. A shader-moved piece (wind, grass, fluid) always redraws. It redraws every second regardless. The read
  runs at the end of the frame's own matrix walk (`_hqWalkHook`, the draw that carries the shadow pulse; a mirror's
  render is skipped), so a piece that moved this frame is read where it now stands. The node bridge (`ewDraw`) and the
  classic renderer (`shadow.autoUpdate`) both honour `light._ew_heroHold`. The fight never holds.
  Off: `window.EW_HERO_SHADOW_EVERY_FRAME = true`. Counts: `ThreeRenderer.hq.dev.heroShadow()`.
  WHAT IT REALLY GAINS (smaller than the doc said): held, the Main Hall drops from 1,000 draws / 2.49 M triangles to
  878 / 1.62 M. But it only rests when nothing in the light's reach (7 to 8 m) moves a quarter texel:
    - nobody in reach: rests all but the once-a-second refresh;
    - a standing body breathes at 6 to 14 cm/s (hands), an orb bobs at 27 cm/s: the dungeon with the player 6 m, an
      agent 6.6 m and an orb 7.5 m from the torch rested 21 % of frames at a 60 fps step;
    - the MAIN HALL never rests: its hero light is a floor lava lamp (the key list has `lava`), whose four wax blobs are
      opaque casters moving 3 to 26 units from the bulb, and Locke stands 1.2 m from it.
  The real saving for a lived-in room is the static / moving split of the map (the doc's option 5, for the sun and the
  torch alike): draw the still casters once, redraw only the movers each frame.
- **THE RESTING HUD** (hud.js `_hudResting`, three-renderer.js `_wmMenuRects`). The quick cone's loop (sub menu dodge,
  list room, BACK chip, pinned room) and the world-text fade's menu boxes measured the page every frame. They now run
  every frame only while something may move: 700 ms after any pointer / key / wheel / touch / resize / scroll, a CSS
  transition or animation starting or ending, a DOM change (children, text, class, style, hidden), with a gamepad, the
  UI Maker, the zoom cone or an enemy action showing. Otherwise every 150 ms. Ignored as wakes (they tick on their own
  clock and move no box): the 3D plates' layer, the perf lens, the dial's second hand `.hrlg-sec`, the match timer.
  Proof: 178 boxes of the action menu and 290 of the Abilities list land in the same place resting or not (one 0.1 px
  difference on an arrow that bobs). An idle turn fires no wake at all. Gain: about 0.85 ms of layout reads a frame on
  the sandbox CPU, less on his. Off: `window.EW_HUD_NO_REST = true`. Counts: `window._ewHudRest()`.
- **THE STILL MATRICES: NOT SHIPPED.** A scene walk that kept an object's matrices while its position / quaternion /
  scale / matrix / world matrix read as they did when last made was exact (458,557 comparisons against three's own
  walk in a fight and in the Main Hall, 0 differences) and gained nothing: comparing the 37 numbers costs what three
  spends composing and multiplying (0.60 to 0.70 ms a walk against 0.62 to 0.67 ms, 3,542 objects). The time is the
  walk over the objects, not the arithmetic. A real gain needs still props to leave the walk altogether
  (`matrixAutoUpdate = false` at build, with every mover named: doors, kicks, sways, the editor), which is its own job.
  Also learned: the walk's scene is matrix-walked about 5 times a frame (each shadow and mirror render walks it again).
- battle.js `_menuFreeArea` already ran at most 8 times a second: left alone.

## THE RENDER SCALE (2026-11-10, the frame rate plan 2; mondo picked "Plan 2: Render Scale setting")
Video settings gains a **Render Scale** row: 50 % / 67 % / 75 % / 85 % / 100 % of the screen's own resolution
(min(devicePixelRatio, 2), what "Native" always meant). The 3D picture is drawn at that share and the browser stretches
it to the window; the HUD, menus and all text are DOM and keep full sharpness. Pixels drawn: 85 % = 72 %, 75 % = 56 %,
67 % = 45 %, 50 % = 25 %. Every screen pass of the post chain and every lit pixel pays per pixel, so on a Retina screen
this is the largest single GPU lever in the game.
- three-post.js `setRenderScale(share)` / `getRenderScale()` ({ratio, native, share, steps, w, h}); both go through the
  existing `setPixelRatio`, so ONE stored value (`ew_pixelRatio`, the absolute ratio) and one live path (renderer +
  post chain resize). The default is unchanged (Native, or 1 on the low preset): nothing looks different until he picks.
- ui.js: the **Pixel Ratio** row stays (Fast = ratio 1, Native = 100 %); a share in between lights neither of its
  buttons and the Render Scale row shows which share is on. Its hint reads the size being drawn ("drawing 1536 × 864").
- Applies to the game's main renderer: battle, exploration, the editor. The small preview canvases (look preview, float
  preview, the creator viewer) keep their own ratio. Viewer-local: nothing relayed.
- Proof (node renderer, `?ew_gpu=webgl2`, emulated Retina 1024 × 576 @2x, software raster, where the frame time follows
  the pixel count as a fill-bound GPU's does): 100 % 2048 × 1152 801 ms a frame, 75 % 1536 × 864 534 ms, 67 %
  1372 × 771 467 ms, 50 % 1024 × 576 336 ms. Every step clicked in the pause menu's Video tab; the walk redraws at the
  new size too. Screens: /mnt/project-files/perf-webgpu-20261109/render-scale/.
- The F3 lens's Resolution row is still the session-only preview (it can also go ABOVE the cap, uncapped Native).

## THE WEIGHTED SHEETS + THE LIGHT'S REACH (2026-11-10, the PvP demo's frame rate: mondo's friend on a weak Chrome PC)
The friend's Chrome runs the DEFAULT renderer (the classic WebGLRenderer, `ew_gpu` unset), not the node renderer mondo
plays on, so THE FRAME RATE PLAN 1's AO skip (node chain only) does nothing there. Measured first, on the Mount Shasta
Arena 12x12, 4v4, classic renderer, 1280x720, software raster (llvmpipe; shares are true, milliseconds are the sandbox's):
172 draws, 425K triangles, 15 renders a frame (scene 1, N8AO 7, SMAA 3, tilt-shift 2, ray source 1, frame 1).
Hiding one thing at a time: the screen passes are about 20 % of the frame (N8AO alone about 13 %), the GROUND about 30 %,
though it is 10 draws and 89K triangles: it fills the screen and its shader is the most expensive one in a fight.
Both fixes change what a pixel COMPUTES, not what it shows; nothing is relayed, online is untouched.
- **THE WEIGHTED SHEETS** (three-renderer.js `_hqTerrainMat`, the node look `_ewNodeTerrain`). The field read floor, cliff
  and path on three world axes plus every painted sheet for every pixel: 9 to 17 reads at 8x anisotropic. A read whose
  weight is under 0.0005 is skipped (flat ground: 1 read). The reads sit in branches, so they use textureGrad / `.grad()`
  with derivatives taken outside the branch (same mip level; on WebGPU a plain sample inside a branch is not even legal).
  Proof, ground alone, switch flipped live, frames otherwise bit-identical: classic 3,626 of 921,600 pixels differ, node
  (webgl2 backend) 2,340, every one by ONE step of 255. Ground-only frame: 200 ms -> 165 ms (classic). The program key
  is `hqTerrainTri2`. Off, live: `window.EW_TERRAIN_ALL_SAMPLES = true` (note: the off path keeps textureGrad, which
  llvmpipe runs SLOWER than the old plain reads, 250 ms: compare against the numbers here, not against the switch).
- **THE LIGHT'S REACH** (three-renderer.js `_ewLightReachPatch`, classic renderer only: a ShaderChunk patch of
  `lights_fragment_begin`). A fight has 13 point lights: 5 dark spares at intensity 0 (`ew void key` + 3 unnamed at
  y -99999, `ew key light`) and 8 unit lights reaching 320 units (2.5 squares). Every lit pixel of every Lambert / Phong
  / Standard material ran fall-off + BRDF for all 13. A point light is now skipped when its colour is black or the pixel
  is past its `distance` (decay > 0: exactly where the legacy fall-off returns 0); a spot light when three's own
  `directLight.visible` is false. Proof: 6 of 921,600 pixels differ by one step. Ground-only draw: 148 ms -> 115 ms
  (all point lights hidden: 108 ms). Off: localStorage `ew_lightsEveryPixel = '1'` (or `window.EW_LIGHTS_EVERY_PIXEL =
  true` before the scripts) and reload: a chunk patch is read once.
- Both together, the whole fight frame (draw to a forced 1-pixel readback, 20 frames x 3 runs): 395 ms -> 350 ms, 11 %.
  A real GPU will not give the same share: nobody has timed one. Screens: /mnt/project-files/perf-pvp-demo-20261110/.
- HOW TO A/B A CHUNK PATCH LIVE (harness only): three's program key for a built-in material does not hash the chunk
  text, so after swapping `THREE.ShaderChunk.x` every lit material needs a new `customProgramCacheKey` AND
  `needsUpdate`, or the old program is reused and the comparison measures nothing (it did, once).
- HOW TO TIME A FRAME HERE: rAF intervals quantise to 16.7 ms and half the rAFs draw nothing; `gl.finish()` returns at
  once in Chrome. Time from the frame's first `renderer.render` to a 1-pixel `readPixels` of the screen instead (+-5 %).
- **THE ZERO STRENGTH ON THE CLASSIC CHAIN** (2026-11-11, mondo tapped "Turn it off at 0"; three-post.js `_ppAoLive`).
  The pmndrs chain drew N8AO at intensity 0.5 even at AO strength 0 (`Math.max(0.5, strength * 2.5)`). At strength 0
  its AO passes (N8AO, or the classic AO + multiply) now rest, as the node chain's do: 15 renders a frame -> 8, the fight
  frame 376 ms -> 330 ms (12 %, software raster, switch flipped live). The picture loses a faint contact shading. N8AO is
  not even downloaded until the slider goes above 0. Off, live: `window.EW_AO_AT_ZERO = true` (the node chain's switch).
  Screens: /mnt/project-files/perf-pvp-demo-20261110/ao_off_at_zero_{old,new}.jpg.

## THE BLACK BLOOD (2026-11-11, mondo on WebGPU: "black ink blot looking things that appear with the blood") — three-renderer.js
- What they were: the blood's own floor marks (the stain each drop leaves, the kill spatter) and a few drops, drawn BLACK
  on the node renderer only (WebGPU, and `?ew_gpu=webgl2`). Classic WebGL draws them red. Nothing was removed.
- Cause: THE SHARED INSTANCING (`_ewInstShareSetup` / `_ewInstAttr`) gives a mesh on another mesh's build its own matrix and
  colour buffers. three 0.186 keeps the instance colours in a PLAIN `InstancedBufferAttribute` (a copy of the first mesh's
  `instanceColor`), not an interleaved stride-3 buffer, so the colour branch never matched: every three-vfx.js particle
  batch and the four blood-glob meshes drew with the FIRST batch's colours (black past that batch's count, wrong tints
  below it). So this was every batched particle's tint on WebGPU, not only blood.
- Fix: `_ewInstAttr` hands a sharer its own plain colour attribute (`o._ew_icp`), `getAttributes` swaps it in,
  `_ewInstSync` copies the version + update ranges each draw. Off as before: `window.EW_NO_INST_SHARE` / `?ew_instshare=0`.
- Proof (node renderer on WebGL 2, Spell Lab, real fireBlood kill): /mnt/project-files/ink-blots-20261111/
  black_blots_before_after.jpg; tools/blots.js (GPU=webgl2), marks.js (floor marks only), live.js (a kept-open lab that
  runs cmd files). Not seen on real WebGPU (headless frames are black).
## WEBGPU BY DEFAULT (2026-11-11)
mondo: "make the default game webgpu ... I dont wanna have to type ?ew_gpu=webgpu anymore or tell friends to type that".
index.html THE WEBGPU SWITCH: `window.EW_GPU_PICK` = auto (default) | webgpu | webgl2 | webgl, from `?ew_gpu=` (remembered in
localStorage `ew_gpu`) or Settings > Video > Renderer (Auto / WebGPU / WebGL, `_ewSetGpuPick`, applies on reload; `_ewGpuReload`
drops a `?ew_gpu=` left in the address and keeps the rest, e.g. `?join=CODE`). `EW_GPU_MODE` stays the mode that runs,
`EW_GPU_WHY` the reason in words (F3 backend line, ?ewdiag=1, the row's hint).
AUTO: no `navigator.gpu` -> classic at once. Else the node renderer loads and a probe asks for an adapter + a device: no
adapter, a software adapter (`isFallbackAdapter`) or a refused device writes localStorage `ew_gpu_probe` = `no:<why>` and
flips the mode to classic if the board renderer is not made yet (`window.EW_GPU_MADE`); the probe runs every load, so a
browser update turns WebGPU on one load later. The node renderer failing after a passed probe (init() rejects -> one reload;
three fell back to its own WebGL 2 backend; the device lost 3 times) writes `bad:<time>:<why>` through `window._ewGpuFailed`,
kept a week, cleared by picking Auto in the row or by `?ew_gpu=auto`. A picked WebGPU / WebGL is never second-guessed.
Proof (headless Chromium, WebGL only): six detection cases, a fight on the classic fallback, a fight where the device is
refused after the probe (node renderer on WebGL 2 that load, classic the next), Render Scale 50 % / 100 % on both renderers,
the row + Reload now with `?join=`. NOT seen: a real WebGPU frame (headless WebGPU is a software adapter, which Auto refuses).


## THE LOST RIG (2026-11-11, mondo in Occam's Barbershop on the default WebGPU renderer: "pitch black") — three-renderer.js
Root cause: THE ONE RIG (`_ewRigTick`, node renderer only) takes every room light off three's light list (layer mask 0) and
draws them through one session-wide lamp group that moves into whichever scene renders. It decided "am I in this scene" from
`group.parent` alone. A room with a reflector (the barbershop mirror, any `puddle` decal: sewers, tunnels, the Haunted cellar,
every room with a drain / manhole / culvert / sea vent) draws the scene FIRST each frame with `scene.children` lent to a
ClippingGroup (`_hqTickReflectors`, W4). The rig arriving from the last scene was pushed onto that one-render list, dropped
when the real list came back, and never re-added (parent still the scene): the room's lights masked, no lamp drawing them.
Everything lit went black; only unlit plates, glows and the spot rim showed. Classic WebGL has no rig, so it was fine; it
surfaced for everyone when WebGPU became the default (PR #1124).
Fix: the rig must be IN the scene's list (`scene._ew_lentKids` while lent, else `children`), not only parented; the
reflector hands whatever joined during the mirrored draw back to the real list. Proof (headless, node renderer on WebGL 2):
`/mnt/project-files/dark-rooms-20261111/` barbershop + Haunted cellar before / after. Harness gotcha: Chromium here DOES
reach the CDN through the agent proxy, so `--host-resolver-rules` stand-ins are bypassed; serve the repo's scripts with a
`context.route` on `cdn.entropywars.net/<file>.js` only.

## THE BORROWED COUNT (2026-11-12, mondo's Camelot fight on WebGPU, Firefox)
Console: `Buffer 'bindingBuffer2312…' has been destroyed` in a bundle, then `a draw failed and was skipped (hq:gaps:floor /
MeshBasicMaterial: GPUQueue.writeBuffer: Argument 1 is not an object)` every frame. Cause (three 0.186.1 + THE LATE LOOK):
a look's SHARED bind group (the `render` group: the camera's uniform buffer, one per node build, lent to every render object
of that build) is use-counted in `Bindings._createBindings` / `_destroyBindings`, but `deleteForRender` counts DOWN for a
render object whose bindings were never made. The late look's hold (`_ewLateSetup`: `O.get(...)` then `return` when the
frame has built enough) leaves exactly such render objects; one disposed before it ever drew (spell quad, the rain that
starts and stops, a culled prop) took the count of a group other meshes still drew with to 0, and three destroyed the buffer.
Fix: three-renderer.js `_ewGpuSafeBindings` — (1) `deleteForRender` of a render object with `initialized !== true` only
forgets it; (2) WebGPU `destroyUniformBuffer` is forgotten at once and destroyed at the next frame's first render
(`_ew_freeLater`, like the vertex buffers). Proof: a 2-mesh page on the real three 0.186.1, headless Chromium WebGPU
(SwiftShader): as shipped `render used 1` → `undefined, buffer GONE` + the same writeBuffer throw; with the fix `used 1,
buffer alive`, no GPU error. NOT seen: the Camelot fight itself on real WebGPU / Firefox.
Same PR: the key pickup's model URL (`_keyFxUrl`) used the DOOR folder + an encoded slash for the PSX pack key (404 since
11-08) → `_hqModelUrl(cat)`; the mermaid's `Swim_Idle_Loop` pointed at lib 1 (UAL2, no swim clips) → lib 0.

## THE ENTROPY STYLE (2026-11-12)
mondo: "some sort of shader(s) we can put over the whole game to help give it a unique and consistent style ... blend all of
these different assets and characters and maps into one consistent Entropy Wars visual style". Seven looks were shown on four
scenes (/mnt/project-files/shader-style-20261112/); he picked 1 (the grade) + 2 (ink + cel), "the lines look a little thick".
- three-post.js "THE ENTROPY STYLE": one screen pass UNDER the cinematic (CRT) / retro passes. THE GRADE = one palette pull
  (indigo shadows, warm lights, evened saturation, soft shoulder). THE INK = five soft light bands + a thin dark line where the
  DEPTH breaks, near side only, about one screen pixel (`_styleInkPx`), and only where the colour breaks too (a shape lost in
  the fog takes no line). Depth, not colour: speckled floors and grass sheets take no lines.
- A bright saturated pixel (spell, team outline, zone wash) keeps its colour and takes no ink (`sKeep` / `keep`).
- Three chains: node renderer `_ngStyle` (TSL; a part of the pipeline set, key letter S, so Off costs no pass), pmndrs
  `_ppStylePass` (draws to its own target when its turn is the buffer that owns the scene depth: no feedback loop), the legacy
  composer (a ShaderPass right after the AO, where the read buffer's depth is still the scene's). One GLSL (`_StyleShader`).
- Settings > Video: Entropy Style (Off / Grade / Grade + Ink, default Grade + Ink) and Ink Lines (Thin / Medium / Bold).
  `ThreePost.setStyle / setStyleParam / getStyle`, stored `ew_style`. Off live: `window.EW_NO_ENTROPY_STYLE = true`.
  Viewer-local (nothing relayed online). renderDirect panes are not styled.
- Seen on screen: battle + DOOR HQ main hall on the node renderer's WebGL 2 backend, a battle on the classic WebGL chain,
  the two rows. NOT seen: real WebGPU, a spell cast, the legacy composer, online guest, frame cost on a real GPU.
- 11-12 follow-up (mondo: "i like it with the lines on medium. Can we also go ahead and turn the pixelate off by default now"): Ink Lines default Medium (inkWidth 1.6); Pixelate default OFF (index.html SHIPPED-KEYS ew_retro pixelSize 1 + the code default). A browser that still holds the old shipped ew_retro follows the bake; one that moved the Pixelate slider itself keeps its value.
- THE BOLD UNIT LINE (11-12, mondo: "maybe just bolder lines on units, same thinness everywhere else"; he picked "Ship it on Bold"): a unit's
  body takes an ink line `unitBold` (1.9) times the map's width; scenery, props and terrain keep the Ink Lines width. A unit = the model
  mask the Pixelate "models" scope always drew (`_renderPixelMask`; bodies flagged `_ew_modelSkin`, held GLBs `_ew_pixelate`), half
  size, one extra draw of the bodies a frame while Grade + Ink is on. `_styleMaskFor` asks for it in both render paths (the board
  and the walk: `_scanPixelMaskTargets(sc)` now tags the walk's own scene); the retro pass's mask is reused when it drew one.
  Settings > Video > Unit Lines: Same / Bold / Bolder. Off live: `window.EW_NO_UNIT_INK = true`. A line-weight-by-distance try was
  built and dropped (barely visible on a board). Seen: node WebGL 2 (battle, DOOR HQ), classic WebGL (battle), the row.
  NOT seen: real WebGPU, split-screen panes, a unit behind a wall (the mask has no occluders: the wall's edge there goes bold).
- THE GRASS TAKES NO INK (11-12, mondo: "adding the ink shader makes the grass look kinda weird to me, like it ends up being a shadowy
  blob. Can we exclude grass from the shader or tweak whatever is causing that"): two causes. The five light bands cut every clump
  of THE GRASS FIELD into a lit tip and a near-black foot, and the ink line drew the squares' seams across the field (a tuft writes
  no depth, so the pass saw the ground under it). Now the style's mask (`_renderPixelMask`) draws the grass mesh once more, alone,
  with `_ggMaskU.value.x = 1` (three-renderer.js `_ggMat` / node twin `_ewNodeGGrass`): each tuft writes its view depth as
  log2(1 + z) / 20 in green + blue (16 bits; red stays the units). The style pass (`sGm` / `gmf`, 5 taps: the mask is half size)
  calls a pixel grass when the scene lies at or behind its tuft, and there it applies the grade only: no bands, no line. A tree, a
  wall or a body in front of the grass is nearer than the tuft and keeps both. Costs one more draw of the field at half size while
  Grade + Ink is on. Old look back, live: `window.EW_INK_ON_GRASS = true`. Do NOT encode the depth with the camera's near / far:
  the mask's and the scene's did not agree.
  THE MASK WAS FROZEN (same PR): `_styleMaskFor` took "the retro pass drew it this frame" from `_styleMaskAt === _styleFrame - 1`,
  which its own draw of the last frame also set, so the mask was drawn once and held: the bold unit line sat on the first frame's
  silhouettes. Now a flag (`_styleMaskRetro`) the retro pass sets. Seen: Training Room on the pmndrs chain and the node renderer's
  WebGL 2 backend, Fairy Forest on node WebGL 2 (proof /mnt/project-files/grass-ink-20261112/). NOT seen: real WebGPU / his Mac,
  the legacy composer, split-screen panes, rigged units standing in the grass (headless drew sprites).
- THE WHOLE STEP (11-12, mondo: "there are these black screen tears now" in the Main Hall; two shots, dashed black bars across the far
  floor, on the same screen rows in both): the ink's depth reads sat a FRACTION of a texel out (Thin on a Retina screen = 1.5 texels =
  the seam between two texels). Depth is read nearest, so on some rows the up read snapped a texel farther than the down read, a flat
  floor no longer cancelled, and the row took the ink wherever the speckle passed the colour gate. Seen here on real WebGPU (SwiftShader,
  2x) with Ink Lines Thin; Medium (2.4 texels) was clean here but leaves only 0.1 texel of slack, which his GPU may not give. Now every
  depth read is on a texel centre, a whole number of texels out, and a width between two whole steps blends the two tests (GLSL `sEdge`,
  TSL `edgeAt`; 9 depth reads, was 5). Colour reads unchanged. Proof /mnt/project-files/hall-ink-tears/. NOT seen: his Mac.
- THE STYLE ON A STAGE (11-12, mondo: "make sure the 2 new shaders (ink and the color grade) are on in the party builder as well.
  The 3d models dont have it"): the party builder / creator / intake / codex stage (three-renderer.js EWCharViewer) is a WebGL
  renderer of its OWN on a see-through canvas, so the board's chain never reached it. `ThreePost.styleDraw(r, scene, cam)` draws its
  frame through the same `_StyleShader`, same settings (the whole stage is a unit: its line takes the Unit Lines width): the scene
  into a 4x MSAA target + depth texture flagged `isXRRenderTarget` (three reads that flag only to tone map + encode in the materials
  as on the canvas), then one quad that styles the un-premultiplied colour and writes it back premultiplied (empty pixels stay empty).
  `_cvFrame` calls it and falls back to the plain draw when it returns false (style Off, or a failure). Off live:
  `window.EW_NO_STAGE_STYLE = true`. Already styled (ThreePost.renderScene): DOOR HQ, the menu room, the team room. Left plain: the
  ID-card photo (`snapshot`), the editor's 96 px prop thumbnails (cached pictures), the UI Maker dock's tile / float-text previews.
  Seen: party builder, classic WebGL (headless). NOT seen: his Mac, the creator's face close-up, a spell preview on the stage.
- THE CARD WAITS (11-12, mondo: "it always loads slow, what is the point of the loading screen before hand if it always loads slow,
  it needs to wait until the game is loaded"): the HQ load card (THE LOAD GATE) dropped early three ways, measured in a browser on
  the foyer. (1) A CLOCK: `HQ_GATE_CAP_MS` was 75 s from the entry, whatever was still arriving. (2) THE STALL ran from the moment
  a file was ASKED for (`AL_STALL_MS` 60 s), so a model waiting its turn in the model queue was written off as dead and the gate
  stopped waiting for it (18 hall models in the run). (3) Even on time, the card dropped the moment the last file landed, so all
  the work AFTER a file lands happened in the open room: the hall beside the foyer built and warmed (568 materials, 134 sheets),
  the instance pass and the static batch rebuilt the props (353 -> 1,439 meshes), the late looks drew piece by piece.
  Now (three-renderer.js `_hqGateTick`): NO CLOCK WHILE IT MOVES (`_hqGateProgress`: the cap counts from the last progress — a
  file landed, a part built a slice, a warm-up moved; `HQ_GATE_HARD_MS` 10 min is the one absolute limit; `_hqStageReady` the
  same for a part, and it no longer warns "gave up" in the middle of a finished part's warm-up); the stall re-arms while
  anything started or landed in the last 60 s (`AL_STALL_MAX_MS` 5 min); LANDED, THEN SETTLED: `H.landed` (every file in, the
  round hall beside the foyer) lets `_hqInstTick` / `_hqLodTick` / `_hqBatchTick` run under the card (the batch's two waits are
  `HQ_BATCH.cardWaitMs` 200 there; the warm-up and the batch take `HQ_CARD_SLICE_MS` 24 a frame while `!H.ready`), and
  `_hqSettled` holds `H.ready` (the card's fade) until: `_alPending() === 0` (the population's rigs too), the instance pass
  tried, the batches live once (`B.lived`; skipped on a door walk, `opts.walk` from map.js), THE WHOLE-SCENE WARM-UP done
  (`_hqWarmWholeNew`: every material in the scene compiled against the frame's lights and every sheet uploaded, the part
  warm-up's own steps through the shared `_hqWarmFake`), no shader building (`_hqShadersBusy`: a WebGL program not linked, a
  node pipeline in flight, the warm's own compile promises), and `HQ_SETTLE_FRAMES` (8) drawn frames + `HQ_SETTLE_MS` in which
  `_hqSettleSig` (geometries, sheets, programs on the card, the late look's held counts) did not change (a walk: 4 frames).
  A room that never rests drops its card after `HQ_SETTLE_CAP_MS` 30 s and 300 frames, with a console line. Every room logs
  `[HQ] <room> landed in N ms and settled in M ms more (...; the steps)`. The card's count (`hq.gate()`) now adds the room
  beside it (THE ROUND JOIN) and reports `landed` / `settle`; map.js's note ends "· setting the room…" while it settles. The
  way back from a fight (no card, `opts.arrive`) settles nothing. Off live: `window.EW_HQ_NO_SETTLE = true`.
  Seen (cloud browser, classic WebGL on llvmpipe, about 1 frame a second, so the seconds are not his): before, the card
  dropped 77 s after the entry, the hall stood 61 s later and the counters kept moving for about 10 s more; after, the card
  dropped once the hall stood and the room had rested, and geometries / sheets / programs / meshes did not move again. A load
  through a door (`_hqGoRoom`) lands and settles too. NOT seen: his Mac / real WebGPU (how many seconds the settle adds there),
  a cold cache on a slow line, the editor's viewport, a terrain zone. Proof /mnt/project-files/loading-wait/.

## THE WHOLE HALL LIT (2026-11-12, mondo in the Main Hall: "the walls further away are not lit until i walk closer") — three-renderer.js `_hqStagePick`
- Cause: THE LAMPS budget (stage §5.2) lit the N point lights nearest the EYE over every room on the stage alike, N = max(lampsLive 12,
  the current room's own). The hall has 13 lamps (centre, 4 desk, 4 floor ring, 4 gallery), the foyer 6: at the hall's entrance the
  foyer's lamps behind you took six places, so the hall's far wall lamps were dark until you walked toward them (from the foyer's
  doorway 5 of the hall's 13 were dark). Not the rig, not the hemisphere, not falloff.
- Fix: (1) the room you stand in lights ALL its own lamps first; (2) the rooms beside it share the rest, nearest first, never fewer
  than `HQ_STAGE_RULES.lampsNb` (4); (3) THE ROUND JOIN (hall + foyer) lights every lamp of both, up to `lampsRound` (32). Every
  stage zone gets (1) + (2). Count: the hall + foyer draw 19 point lights (was 13 / 12); other zones at most own + 4.
- Seen: cloud browser (node renderer on WebGL 2), standing in the foyer's doorway and at the hall's centre. NOT seen: his Mac / real
  WebGPU, the frame cost of the six extra lamps there. Proof /mnt/project-files/main-hall-far-walls/.

## THE STALE LIGHT LIST (2026-11-12, mondo: CONTINUE into the Main Hall, "after the load screen loads its just a black screen") — three-renderer.js
- His console: `a draw failed and was skipped (Render Pipeline / RenderPipeline: can't access property "map", lightData is undefined)`,
  stack NodeMaterialObserver.equals < needsRefresh < _renderBundle. Real WebGPU only (the render bundles are WebGPU-only).
- **Cause**: three's observer keeps, per render object, one record per light that casts a shadow (or a spot with a sheet), taken at
  the object's first draw; `equals` walks the frame's CURRENT list over it with no length check. A bundle REPLAY never asks
  three for the render objects again, so a shadow light that joined the list after a non-static group was recorded read past the
  record and threw. The throw skipped the WHOLE frame; `r._ew_lights` (what `_ewBunTick`'s lamp signature reads) is noted at the
  frame's first real draw, which never came, so the tick never saw the lamps move and never re-recorded: black for good.
  Not the save (PR #1219) itself; any arrival where the light list grows after the first recording could hit it.
- **Fix**: (1) the `needsRefresh` wrapper (THE LATE SHEETS) catches the throw, takes the record again from the frame's lights,
  returns FULL and flags the object's group (`_ew_bunFree`) to re-record next tick; count in `_ewBun.staleLights`.
  (2) `_ewRigTick`: a rig that grew bumps `_ewBun.epoch`, so every group re-records in that same frame.
- A throw anywhere in a frame's bundle replay blacks the frame: keep new replay-time hooks inside a try.

## THE MATERIAL RUNS + THE SKINNED PICK (2026-11-13, mondo's Atlantis fight at 4.7 fps on the Mac)
- **Report**: F3 readout, WebGPU: 3750 draws, "3415 room hq_piece (outside its bundle)", "Pick (raycasts) 164/s · 819 ms/s", CPU 209 ms.
  It was the new Atlantis board (PR #1246), not the Training Room: its sea life is the trigger, any room with ocean pack swimmers had it.
- **Cause 1 (draws)**: the ocean pack FBX files hand meshes whose triangles switch material back and forth (clownfish: 890 triangles,
  185 runs, 3 materials). three draws each run as one draw. The bundles replay them (not counted), but the unit ink / pixel mask pass
  (three-post.js, a side render: bundles off, room props wear `_ew_pixelate`) drew every run again classic: 2323 + 1179 draws a frame.
  Fix: `_ewGroupRuns(root)` at load (`_loadMiscModel` incl. the `_ewRig.src` moving copy, `_loadUnitGLB`): index rewritten once so each
  material is ONE run. Same triangles and materials. Off: `window.EW_NO_GROUP_RUNS` before the file loads.
- **Cause 2 (picks)**: three's `SkinnedMesh.raycast` keeps the sphere of the first pose (a shark's: 57 m) and skins every triangle
  corner per ray: 27-56 ms for one ray through a unit, 1-4 ms per fish. The hover pick (`screenToUnit`) asks every unit per mouse
  move, the wall-fade rays every swimmer near their line. Fix in `_bvhInstall`: THE SKINNED PICK, (1) a box round each bone's
  bind-pose vertex sphere as the bones stand now rejects a ray, (2) else the triangles are tested against skinned points computed in
  one typed-array pass, kept while no bone moves. Same hits as three (198 rays over units + swimmers: 0 mismatches in distance, face,
  point, uv, normal). Off: `window.EW_NO_SKIN_PICK`. Lens Pick line now shows "skinned N/s past their pose box, M/s tested".
- **Measured** (sandbox, SwiftShader WebGPU, Atlantis 4v4): draws 3657 -> 316, outside-bundle 3499 -> 166; 198 skinned rays
  1163 ms -> 22 ms; hover pick 8.2 -> 1.2 ms per mouse move. Proof: /mnt/project-files/perf-atlantis-20261113/.
- Not done: the mask pass still walks the room classic (166 draws); 20 point lights untouched; real Mac FPS not measured here.

## THE CHUNKS + THE ONE MATRIX WALK (2026-11-13, mondo in the 144-plot Disaster City on the Mac, WebGPU: 12 fps, "3.29M" triangles in 13 terrain draws; "we have the plots already, why not just make those the chunks or like a group of them")
three-renderer.js + data.js HQ_ENGINE_RULES (`chunkM: 42, chunkMinSpanM: 200, chunkPadM: 15, fenceFarM: 120, instFarM: 260, instSmallM: 1.7, instSmallFarM: 100`).
- **What the readout meant**: the six heaviest "hq_part terrain" draws (913K, 751K ...) were the STAIRS PACK fences. `_spBuildRailings`
  made ONE mesh per fence kind and role for the whole room: twelve meshes, 4.27M triangles (non-indexed), in the shell's render bundle
  (replayed unculled) and, wearing `_ew_pixelate`, drawn again by the model mask (the lens's "extra" pass). The instance pass cut its
  copies per 64 m cell (989 batches, 4.4M triangles: a 5,201-triangle Meshy prop x 315, the lamps x 288 ...) but all of it sat in ONE
  bundle, so no cell was ever culled. Measured headless: 10.6M triangles a frame from the spawn, 20,700 objects in the scene.
- **THE CHUNKS** (`_hqChunkBig`: the live walk's own room, at least chunkMinSpanM across; never the battle's room, a scratch build, a
  stage neighbour): a fence run goes to its PLOT's mesh (`_spFlush(..., grpOf)`), each plot a group under `H.chunks.root` (`hq_chunks`,
  beside the shell group in the part's root); the instance pass's cells are groups (`I.cells`, `hq_inst_cell`), and a placed prop
  whose whole sphere is under instSmallM (`_hqChunkSmall`: measured per placement, so a lamp's small parts stay with its pole) sits
  in a cell of its own kind (`|s`). Every such group is its own bundle target (`_ewBunTargets`) and is listed in `H.ckList`.
  `_hqChunkTick` (each frame, after the camera, before the draw; every renderer): a group whose sphere + chunkPadM is off the camera,
  or further than its far (fences fenceFarM, cells instFarM, small cells instSmallFarM), reads `visible = false`: not in the picture,
  the shadow map or the mask. `_ewBunTick` skips a group that is out (`_ew_ckOut`) without releasing it: its recording waits, no
  re-record when it comes back. `_ewBunWalk` no longer hashes a piece THE STATIC BATCH holds (only that it is held).
- **Nothing is removed**: `_hqChunkHome` (the hand-over to a fight, the crossing, the leave) puts every fence back in the shell group
  and shows every group; the instance pass is dropped as before. Off live: `window.EW_HQ_NO_CHUNK_CULL = true` (all drawn).
- **THE ONE MATRIX WALK**: the walk frame runs `scene.updateMatrixWorld()` once and holds `matrixWorldAutoUpdate` false for its
  renders (mirrors, the mask's two, the shadow map, the picture: four walks of 20,700 objects a frame before). Off:
  `window.EW_HQ_MW_EVERY_RENDER = true`.
- **Lens**: new line `Chunks: fence plots a/b drawn · prop cells c/d drawn`.
- **Not done**: the ground (256 tiles, 670K triangles) and the buildings stay in the shell bundle, drawn whole; the dense Meshy props
  have no LOD files (`optimize-assets --lod` would give the LOD tick levels to draw); the fence pack pieces are ~500 triangles a metre.

## THE FINDS FREEZE (2026-11-13, mondo: "story mode isnt loading anymore ... the loading screen just stayed forever and the browser slowed down")
- **Cause.** Not the loading itself. The background finds warm (map.js `_hqScheduleFindsWarm` -> data.js `hqFindsWarm`) builds
  every tape room's finds once the survey worker lands its floor plan. `hqFindSpot` walked the room in half-metre steps and each
  step read every prop / wall / tree of the room, with the walker's reach flood on top, all on the page. On the new 504 m
  Disaster City (PR #1258: a million steps, ~1600 props, ~1100 features) that was one task of 4.5 MINUTES in the cloud browser
  (measured: one 269 800 ms frame gap in the foyer; the build before #1258 had gaps of 5-9 s from the older big rooms).
  It hit a brand-new profile in the foyer too, because the survey warms every room in the background.
- **Fix (data.js + map.js).** (1) THE FINDS OFF THE PAGE: `hqTerrainWorkerServe` places the room's finds on the record it just
  compiled and posts them with it; the page takes them with `hqFindsAdopt(roomId, rows, gen)` (`hqFindsGen()` guards a
  `hqFindsDrop()` in between). The finds warm then finds the room already built. (2) THE FIND GRID (`hqFindGrid`): rooms with
  more than 48 blockers file them in 4 m cells, a step reads its own cell. (3) THE FAR POINTS FIRST (`hqFindOrder`): points
  are read farthest-first in quarter-metre rings and the walk stops 1.25 m inside the first free one.
- **Same results.** `hqBuildFinds` output for the 90 other find rooms is byte-identical before / after; the worker path gives
  the same rows as the direct path. City finds in Node: over 10 min -> 6.9 s (what is left is the reach flood, now in the worker).
- **Rule for big rooms.** Anything that walks a whole terrain room per point (finds, reach, nav) must run in the survey worker
  or be budgeted across frames. No worker (EW_HQ_NO_SURVEY, file://) = the finds still build on the page after the room's own entry.

## THE PROP CHUNKS + THE MASK'S OWN BUNDLES + THE STILL CHUNKS + THE LOD LEVELS (2026-11-14, Disaster City perf)
mondo's Mac lens in `site_prebuilt_downtown_streets`: 6.8 FPS, CPU 140.8 ms (submit 100.8), 3748 draws, "2996 site props
(outside its bundle)", extra pass 1958 draws / 4.05M tris, props 3165 calls / 4.55M tris, check 13.2 ms.
- **THE PROP CHUNKS (three-renderer.js, after `_hqChunkStats`).** In a chunked room (`_hqChunkBig`) every prop placement under
  `H.propGroup` moves into a chunk group (`_hqPropChunkSweep`, every 1.5 s or on a child-count change): props inside a closed
  hollow building (`H.terrain.texb` hollow, inset `roomInsetM`) go in that building's room group (`'b|<bld>'`, drawn within
  `roomFarM` 40 m, glass is opaque so they only show through open doorways); the rest go in the 42 m plot chunks
  (`ci,cj`, `|s` for small ones = `instSmallFarM`, else `propFarM` 260). The chunk walk culls them like the shell fences.
  Placements holding a light stay put. Instance cells key the same way (`b|` cells). `_hqPropChunkHome` puts everything back
  (hand-over, leave). Static batch: merged meshes are hosted IN their chunk (`_hqBatchHost`), chunk visibility is not a "change".
  Render bundles: one bundle per chunk group (`_ewBunTargets`). Off: `window.EW_HQ_NO_PROP_CHUNKS` (then re-enter).
  Rules: data.js HQ_ENGINE_RULES `propFarM`, `roomFarM`, `roomInsetM`.
- **THE MASK'S OWN BUNDLES (three-post.js static mask + three-renderer.js `_ewBunSetup`).** The model pixel mask (layer 8,
  half res) drew every static prop classic, one by one (the lens "extra" pass). It now renders with its own camera clone
  (`_maskCamS`) and `_renderer._ew_maskBun`, so chunk groups record their own mask bundles. Off: `window.EW_MASK_NO_BUNDLES`.
- **THE STILL CHUNKS.** An out chunk (off camera / past its far) also gets `matrixWorldAutoUpdate = false`, so three's per-frame
  matrix walk skips it (~35K objects in the city). Its matrices are refreshed as it leaves and on any frame something was added
  to the scene (`_ewAddCount`, a counter on Object3D.add). Collision snaps compose local matrices (`_mcSnap`), so unaffected.
  Off: `window.EW_HQ_CHUNK_MW_ALWAYS`.
- **THE LOD LEVELS shipped.** The LOD path (`_lodUrls`, `_hqLodTick`) had never run: no `.lodN.glb` was in ASSET_MANIFEST.json.
  Baked (meshopt simplify, same mesh names/order) and uploaded lod1/lod2 for the heaviest city repeats: city bench, traffic
  cone, police barricade, folding chair, hydrant, utility box, potted plant, palm, cup, cardboard boxes, sandbags, popcorn cart,
  ambulance, candle, piano, football, missile, conveyor (30 files, new-folder paths). Off: `window.EW_NO_LOD`.
- **Sandbox numbers (spawn camera, same view).** Mask static 852 draws / 3.14M tris -> 50-169 / ~0.2M; extra pass 854 / 3.18M
  -> 171 / 233K; props outside bundle 2475 -> 54; prop plots 32/240 drawn, rooms 0/88 drawn. The cloud shell draws classic
  (sandbox artefact), so compare counts, not FPS. Left: the bundle check cost (the shell walks ~10K children a frame), pixel
  ratio 2 on his Mac (Settings Render Scale exists; default untouched), one WebGPU "Texture with '' label" submit error.
## THE SEAT GRID (2026-11-14, Disaster City: card held 5+ min, then ~1 FPS)
- **Cause.** `_hqSeatTabletops` (THE TABLETOP SEAT) cast one ray per tabletop prop against the WHOLE prop group + shell
  (`intersectObject(root, true)`, ~35,000 meshes in the city, ~9-25 ms a ray) and `_hqSeatLater` re-runs it after every model
  that lands. One city load in the cloud browser: 17,332 seat rays, 193 s of main thread. The interiors passes added the tabletops.
  The lens "Pick (raycasts) ~105/s · ~950 ms/s · 25K plain" on his Mac was this.
- **Fix (three-renderer.js `_hqSeatGrid`).** Once per pass every mesh the whole walk would test (same roots, same layer test) is
  filed in 4 m cells by its world sphere (spheres over 24 m go in a short always-tested list); each tabletop ray tests its own
  cell + that list. Checked in the city: 900 rays, 0 differing hits, 22,986 ms -> 640 ms (+87 ms to build the grid).
  Off: `window.EW_HQ_SEAT_WHOLE = true`.
- The loading card's own big draw count (16,700 calls behind the card) is the settle warm-up drawing everything once on purpose.
- PR #1377 (prop chunks, mask bundles, still chunks, LOD rows) was rolled back in PR #1379 while this was found; it comes back
  after a clean city load.
- 11-14 10:10: mondo's F3 after #1381 loaded fine (5.5 FPS, picks 0/s); the #1377 pass is back (re-land of the rollback).

## THE LAMP'S REACH (2026-11-14, Disaster City shadows)
- After PR #1382 his Mac lens showed shadow 824 of 894 draws. The cloud browser (city, spawn): one drawn frame = the scene,
  two mask passes, the sun's map and the nearest lamp's six sides (the hero lamp, `_hqHeroGate`: a `lava_lamp` prop's point
  light, reach 3.5 m). Each side walked the WHOLE scene (~120,000 `_projectObject` visits a frame) and drew the unculled
  pieces past its far plane.
- **Fix (`_ewBunSetup`, three-renderer.js).** A render wrapper flags a shadow pass through a perspective camera (`_ew_reach`:
  camera position + far). Inside it a chunk (`_ew_ckSph`) past the reach is skipped whole, and a room's shell (`_ew_bunName`
  "... shell", >256 children) walks only children filed in 8 m cells the reach touches (`_ew_reachIdx`, built once, rebuilt
  when the child count changes; pieces over 32 m always walked). Measured: lamp-side visits 120K -> 18K a frame, lamp draws
  -24% (only pieces past the far plane), screenshots on/off differ less than two frames of the same setting.
  Off: `window.EW_SHADOW_REACH_OFF = true`.
- Sandbox share of the draw step before this: sun map ~40%, lamp sides ~17%, masks ~6%. The sun map is next.
- 11-14 ~11:00: #1383 turned the city black (every frame threw `can't access property "test" of undefined` in three's
  `_projectObject`): the new render wrapper was `var ro = r.render` inside `_ewBunSetup`, which already had `var ro =
  r._renderObjects` for the opaque-list hook; one var slot, so the hook called render(list). Rolled back (#1384), renamed
  `rReach`, re-landed after a clean load + drawn frame in the cloud browser (no frame errors). RULE: a new hook inside
  `_ewBunSetup` gets a name grep-checked against the whole function.

## THE BARE STACK + THE GROUND MERGES (2026-11-16, the walk's mesh count: the squares)

Where the walk stood (mondo's F3s 11-16 04:36-04:38, Firefox / M1 / WebGPU): 40-43 FPS at 1,900-2,100 replayed meshes;
squares ~1,220-1,330 of them: alone see-through / cut-out ~280, alone no sheet lit ~247, alone node terrain ~200-240, stacked
~180, one paint ~120, alone many looks ~85. (The fight: 66-71 FPS.) mondo: "do 2 first" (the mesh count before the joined rooms).
- THE BARE STACK (`_hqStackBareOk`, `_hqStkBare`, `_hqStackOf`'s fallback; `_ewNodeStack` with `D.bare`): a plain opaque Phong
  / Lambert part with NO map of any kind joins a stack with no layers: its colour rides in the points (the one paint's way),
  its glow x strength in `ewSk` (the sheet stack's way), and the merged mesh wears the look with no glow of its own; the dress
  sets `emissiveNode = ewSk.rgb` and reads no texture. So parts that differed only by colour or glow (lamp glass, lit
  windows, neon, trims) are one look per square. WebGPU only (`_hqStackOff`). Also serves the fight's merge. Off:
  `window.EW_HQ_NO_BARE_STACK` before the room. Lens: "stacked (no sheet) N".
- THE GROUND MERGES (`_hqBatchPieceOk(o, ter)`, `c.ter`): in a big room's shell a ground tile (`_ew_hqTerrain`, one look for
  all 320) is a normal merge candidate: the tiles of a 96 m square become one mesh on the ground's OWN look (key
  'ground|...', never the paint or a stack: `_hqBatchVcOk` now refuses any `_ewNode` look, whose copy would lose its dress).
  The ground's look reads each point's WORLD place and world normal and the tile's painted weights, which the merge carries.
  Off: `window.EW_HQ_NO_GROUND_MERGE` before the room. Lens: "ground, merged N".
- PROOF, the ground (WebGL on llvmpipe, `playtest_city.js`, the street at the spawn, merge on vs `--flags=EW_HQ_NO_GROUND_MERGE`,
  two sessions): 320 tiles -> 63 merged meshes, 0 singles, 0 errors; the road region differs in 9 of 46,000 pixels (over
  8/255), the pavement where no shadow or car crosses the same; the rest of the picture's difference is a passing van, the
  sun's shadows and the walker's pose. (A view over the bay is useless for this: the water moves.)
- PROOF, WebGPU (cloud, SwiftShader, counts only; HEAD on ca62f59 + this change; the merge still building when read:
  "build 3572->485", it was 8,376->1,569 at that stage on 11-15): in view "ground, merged 38 · stacked (no sheet) 29 ·
  alone: no sheet 3" (no "alone: no sheet, lit" line left), 0 frame errors, no pipeline or shader error in the log. The
  bare stack's PICTURE is not proven in the cloud (WebGPU renders black there): it is the part's own Phong / Lambert
  shading with the colour and the glow read from the points, both ways already proven (THE ONE PAINT, THE SHEET STACK).
  mondo's eyes on lit windows / lamps / neon are the check; `EW_HQ_NO_BARE_STACK` isolates it.
- WHAT IS LEFT in the squares after this: see-through / cut-out ~280 (signs with a clear ground: one canvas each; panes),
  many looks ~85-150 (several looks on one mesh: split by look, then merge), stacked ~180, one paint. Then instance cells
  (~250-360), shell rest (294), prop plots (~90).

## THE PARKED ROOM (2026-11-16, a fight no longer ends the walk: nothing is rebuilt either way)

mondo: "why does a fight rebuild everything? its supposed to be a seamless transition ... make it seamless. stop the pointless
rebuilds." His last F3 just back from a fight: 3.8 FPS, the room drawn while "build 3495->756".
What it was: `_hqLeave({handover})` handed every merged piece back and gave the room's groups to the fight, which kept what
stood near the board and DISPOSED the rest (~2,100 of ~16,600 pieces); the way back was a plain `_hqEnter`: every builder,
then the whole merge.
What it is now (three-renderer.js, big rooms = `_hqChunkBig`, the room READY, no stage; every other room keeps the old path):
- LEAVE: `_hqParkOk` -> `_hqLeave` skips the chunk home, the batch drop, the LOD / instance / portal resets, the mirrors'
  dispose and the scene's disposal, and `_hqParkStash` keeps the record: `_hqParked = { H, roomId, hfog, ao, mats }`. The
  walk's scene, merged squares, chunks, instance pass, doors: all as they stand, undrawn. Log: "[HQ] left (the room PARKED ...".
- THE FIGHT: `_hqBuildRoomInBattle` finds no stash and a parked room of its id: `_hqParkHand` gives it three empty groups (+
  copies of the sky / landmarks), `_hqParkFill(hand, farOf)` fills them with COPIES (`_hqParkClone`) of the pieces inside the
  fight's radius, read where the walk keeps them (`_hqParkPieces`: shell children + fence plots' children, doors, placements
  in their prop chunks). A copy shares geometry and looks, carries the piece's own `_ew_` flags and none of the walk's
  bookkeeping (`_HQ_PARK_SKIP`), shows a piece the merge or the instance pass hides, takes a rig-held lamp's own layers, never
  a LOD level; it is marked `_ew_parkClone` and `_disposeR` / the hand-over's dispose free nothing it wears. `take()` then
  runs as on a hand-over. A floor the fight digs is cloned first (`_fieldDeformMesh`, `_ew_parkOwnGeo`). The looks the fight
  changes (fog off on glows, `_ew_hzNear`) are listed (`P.mats`) and put back at the resume. Log: "... radius 28/48 m ·
  parked (N copies, M left in the walk)".
- THE WAY BACK: `_hqEnter` with `from: 'return'` into the parked room -> `_hqResume`: the record is `_hq` again, its per-entry
  state reset (opts, keys, camera boom as an entry lays it, arrive, a fresh gate, `ready` false until the people's files
  are in; `_resumed` skips the settle), the air and the look restored, the canvas laid in the host, the PEOPLE placed again
  (the fight carried their bodies: every char cleared as a stage part clears its own, residents' bodies forgotten, then
  `_hqSpawnPopulation`, `_hqRideArm`, `_hqRefreshLamps`), input bound, the loop set. No builder, no merge. Log: "[HQ]
  resumed <room> (parked N s; the fight had M copies) — nothing built, nothing merged".
- NOBODY CAME BACK: `_hqEnter` into another room / not a return / the switch on -> `_hqParkDrop` tears the parked room down
  as a left room. A resume that throws falls back to the full build. (deactivate does NOT drop it: map.js puts the board
  away just before the way back's enter.) Known: a player who leaves a fight for the menu keeps the parked room in memory
  until the next room entry.
- Off: `window.EW_HQ_NO_PARK = true` (the old hand-over, the old way back).
- EVERY ROOM (same day, mondo: "why not small rooms too? the fix needs to be game wide"): `_hqParkOk` no longer asks for a big
  room. A copy of a mirror's target wears the target's own look (`_ew_reflectOld`); a fading ceiling's looks are the copy's
  own (`_fieldCeilRegister` clones them; `_ew_parkOwnMat`, disposed with the copy); the resume files the door gun and the pair
  from the entry's opts (capture choices, strike gate, wedges; standing doors stay). Proof, same probe on a small indoor room
  (`node playtest_handover.js site_prebuilt_lodge_halls`): the fight drawn from 240 copies, back in 3.1 s, 786 -> 787 meshes,
  25 merged meshes before and after, the hall's walls and floor as before, 0 errors.
  THE ONE EXCEPTION: a room with joined neighbours (`H.stage`: the HQ wings, the plot dungeons) keeps the old hand-over.
  Their copies are written (`_hqParkPieces` reads each attached part through its part root, as `_hqStageFlatten` laid them;
  `_hqStageLeave` is skipped on a park) but NOT proven: no probe can start a fight there (`_hqEncounterRoomOkNow` refuses the
  HQ's own rooms; the Training Room's strike never fired). `window.EW_HQ_PARK_STAGE = true` tries it. NEXT: prove it on a
  plot dungeon fight or the first quest's Training Room fight, then drop the exception.
- mondo 11-16 04:07, first word on his Mac (WebGPU): "the transition into battle and out of battle is a lot smoother", but
  "overall its less fps": his F3 after a fight read 26.2 FPS with "tick: doors + residents + scene 15.6" ms (it is 1.3).
  Cause: `_hqResume` cleared `H.nav` with the people (copied from the stage's re-peopling), so `_hqTickResidents` ->
  `_hqNavBuild(HQ_NAV_BUDGET_MS)` built the city's whole walk map again after every fight, a budget of ms every frame until
  done. The walk map is the room's: it stays now. RULE for a resume: reset what holds a PERSON (chars, rounds, residents'
  bodies), never what is the ROOM's (nav, colliders, terrain, finds).
  His quick way to test a return: stand on a hidden square and ESCAPE (one unit in the party makes it easy).
  Same PR: `_hqResStart` on a resumed room keeps each resident's laid-out day (`tl`) when the day is the same (it laid every
  timeline again). Probe after the fix (city, parked path, `playtest_handover.js` now prints skinned + chars): 70 skinned
  meshes / 10 chars before the fight, 70 / 10 after: no body is left behind or doubled; 4,397 -> 4,384 merged meshes, 0 errors.
  A probe run whose room is not READY at the strike takes the OLD path on purpose (`_hqParkOk` wants `H.ready`).
- mondo 11-16 04:36-04:38, five F3s through one fight: walk 40.4 FPS -> THE FIGHT 66.3 and 71.3 FPS (it was 23.4 on 11-15;
  1,350 meshes, "the fight's room live 603->36") -> just back 25.2 FPS, "tick: doors + residents + scene 16.8" again -> a
  little later 43.5 FPS, that row 1.5. So keeping `H.nav` in `_hqResume` (#1739) was NOT the whole fix: the rounds' start-up
  (called by `_hqSpawnPopulation`, the line after `_hqResStart`) calls `_hqNavStart()` unconditionally and made a new, empty
  lattice. It now keeps the one a resumed room has. Cloud profile of the first 20 s back (`playtest_handover.js --profile`):
  `_hqResume` 0.27 s where the old path's `_hqEnter` is 20 s (`_hqBuildTerrain` 17.8 s of it); the cloud cannot show the nav
  row gone (its city never finishes the lattice before the fight), so his next F3 just after a fight is the proof.
  Probe: give a big room `--wait=480000`, else it strikes before READY and takes the old path.
PROOF (cloud browser, WebGL on llvmpipe through probe-fast.js, the new repo tool `node playtest_handover.js`; HEAD on 84580c2 +
this change): Disaster City, a strike 3.5 m from the spawn, the fight drawn (the street, palms, cars from copies: 2,513),
the enemy's hp set to 0 + `checkWin()`, BACK TO THE ROOM pressed. Before the fight: 43,095 meshes, 4,099 merged meshes, 49
squares. After the way back: 43,117 / 4,099 / 49: the SAME merge, never rebuilt; the picture is the lit city with the walker
in it; 0 page errors, 0 frame errors. From the button to the room ready: **9.4 s parked vs 66.2 s on the old path**
(`--flags=EW_HQ_NO_PARK`, same probe; software rendering, so his Mac will be far quicker on both).
A probe trap: a strike placed 3 m EAST of the spawn lands the walker in a doorway and the camera inside the wall (a black
picture on BOTH paths): strike 3.5 m in +z.
NOT PROVEN YET on his machine: WebGPU (the bundles re-record once on the first frame back), a second fight right after the
first, the residents' bodies after a resume, a fight whose props were still loading. STILL OPEN from below: the fight's
may-fade props, the 320 ground tiles, the 2,300 recorded holders ("bundle check 7.3").

## THE HAND-OVER'S THREE FREEZES (2026-11-16: the last picture, the field survey, the way back merges first)

mondo after #1547: the fight 23.4 -> 34.0 FPS (2,608 -> 1,158 meshes, "the fight's room live 450->24"), but "going into
and coming out of a fight is still really bad, frame rate drops to zero. Please fix the handover". His F3 a moment after
coming back: **1.5 FPS, 56,355 draw calls, 30,624 meshes, no Static batch line, no instance pass, no squares.**
Still open in the fight's own frame: "bundle check 7.3" (2,300 recorded groups), "mask: projection walk 4.4" (15K visits),
"rest of the frame 7.9", picks 309/s = 193 ms/s (840 plain meshes raycast), may-fade props 519 meshes in 1,378 groups.
What froze, and the fix (three-renderer.js):
1. GOING IN, the last picture (cloud profile of a strike: `_hqLeave -> _hqDissolveStart -> _hqRenderOnce` the longest step):
   the dissolve draws the room once more for its picture, AFTER `_hqChunkHome` + `_hqBatchDropAll`, so that draw was the whole
   city piece by piece (one ~600 ms frame on his Mac). `_hqLeave` now takes the picture first (same camera, the room still
   merged), then hands the pieces back.
2. GOING IN, the field survey: `hqFieldFrame -> hqFieldLattice -> hqFieldTerrainInfo` reads the room's whole lattice at the
   first strike of a session (cloud: 3.8 s; kept on the room after). `_hqGateTick` makes it behind the card for a terrain
   room, just before READY. Off: `window.EW_HQ_NO_FIELD_WARM`. (Costs that time once under the first loading card.)
3. COMING BACK: the way back draws the room from its first frame with no card, but the instance pass, prop chunks, LOD and
   the merge waited for `H.landed` (every file in). On an entry with `onFirstFrame` (the way back only) they now run from
   the first tick (`_hqPassOk`), and in a big room nothing is drawn and the debrief's picture is not faded until the first
   merge is live (`_hqBackHold`, at most HQ_BACK_HOLD_MS 5 s; the merge takes `HQ_BATCH.holdSliceMs` 220 ms a tick while
   nothing is drawn). This CHANGES his 10-25 "NO HELD FRAME": the debrief's picture stays ~2 s longer, in place of 10+ s at
   1-12 FPS; told him. Off: `window.EW_HQ_BACK_NO_HOLD` (draw from the first frame), `window.EW_HQ_BACK_OLD` (all as before).
Cloud (WebGPU on SwiftShader, a strike at the city's spawn, CPU profile; HEAD on 36cd5fd + this change): `_hqLeave` 34.5 s ->
0.32 s, the dissolve's draw 34.4 s -> 0.23 s, the field survey (3.8 s) gone from the strike (`room._fieldTerrainBy` made
under the card), the fight starts ("kept 2116 · culled 14443"), 0 page errors. THE WAY BACK WAS NOT PROVEN: the fight was
ended from the probe (`u.hp = 0; checkWin()`, then `#encReturnBtn`.click()) and the cloud browser was killed for memory while
the city was built again (the container's limit; it says nothing about the change). His Mac is the first real run of 3.
Other rows of the strike's profile, not touched: `_hqSeatTabletops` 1 s, the fight's first frames (2,300 new recordings).
11-16 02:57, his F3 just back with #1563: 3.8 FPS, the room DRAWN with "build 3495->756" and "tick: static batch 24.0": the
hold never held. The way back is READY at once (its gate does not wait for the merge) and `_hqBackHold` returned false on
`H.ready`; its 5 s were also counted from `H.t0`, before the builders ran. Fixed: the hold no longer reads `H.ready`, counts
6 s from its own first tick (`H._holdT0`). mondo, same message: "make it seamless. stop the pointless rebuilds".
STILL THE REAL FIX: THE PARKED CITY (see below, item 1): the fight should take the walk's groups whole (merged, chunked)
under one holder and give them back, so neither direction builds or merges anything.

## THE FIELD MERGE + THE FIRST MERGE IS FAST + THE FIGHT'S ONE MATRIX WALK (2026-11-16, fights in the city)

mondo: "going into a fight and the return from a fight are both terrible. I don't understand bc it's the same room. does all
of the optimization we have done just randomly turn off from fights?? fix all of it" and "why does a fight rebuild
everything? its supposed to be a seamless transition."
**The honest answer, for whoever reads this next: yes.** A fight is a different scene. `_hqLeave({handover})` hands every
merged piece back (`_hqChunkHome`, `_hqBatchDropAll`), `_hqBuildRoomInBattle` takes only what stands within keepM 28 m /
keepFarM 48 m of the board, hangs each kept piece in a holder of its own (`hq_piece`, one recording each: his "2262 groups")
and DISPOSES the rest (city: kept ~2,100, culled ~14,500). The way back is a plain `_hqEnter`: every builder runs again and
the room merges again. Nothing of the walk's merging reached the fight, and nothing survives it.
What this PR does (three-renderer.js):
- THE FIELD MERGE (`_fieldBatchTick`, `_fieldBatchDrop`, called beside `_fieldInstTick`): the static batch runs on the
  fight's room (the record of the fight's instance pass, `R.field`), with the one paint and the sheet stacks (`B.vc` and
  `_hqStackPrep` take `R.field`), on every piece that can never fade: the fade's own list (`_occFieldBuild`) marks each
  root it may ghost, each wall side, the ceiling and the sky holder `_ew_noBatch` (a new off flag). Merged meshes hang in one
  group `hq_field_batch` (`_hqBatchHost`: `root._ew_fbHost`), one recording. Dropped with the fight's instance pass.
  Off: `window.EW_FIELD_NO_BATCH`. Lens in a fight: "Static batch: the fight's room ...", kinds "fight: merged / may fade
  (own piece) / never fades, not merged / instances".
  Cloud fight at the city's spawn (`_hqEncounterFire`, counts): "the fight's room live 346 -> 31", 0 frame errors, 0 batch
  warnings. What the fight still draws one by one there (1,367 visible meshes): may-fade props 550, the ground's tiles 320
  (`_ew_hqTerrain`: ALL of the city's ground stands in a fight, farOf() never drops it), outer 58, alone 59.
- THE FIRST MERGE IS FAST (`_hqBatchTick`, `firstRun`): until a room's first shell + prop merge has gone live, the merge
  takes `HQ_BATCH.firstSliceMs` 28 ms a frame and waits as behind the card (200 ms). The way back has no card, so its merge
  ran at 3 ms a frame after two 1.5 s waits: his "12.4 FPS for 30 s". Off: `window.EW_HQ_BATCH_FIRST_SLOW`.
- THE FIGHT'S ONE MATRIX WALK (`_renderFrameBody`): one `_hqStillSceneWalk(scene)` then `matrixWorldAutoUpdate` false for
  the battle frame's renders, as the walk's frame since 11-13 (his fight F3: "mask: setup + lights + sort 8.0 · scene:
  setup 3.5" = two walks of the scene; the cloud profile's top JS rows in a fight are updateMatrix / updateMatrixWorld).
  Not for the split-screen panes. Off: `window.EW_BATTLE_MW_EVERY_RENDER`.
NOT DONE, in order (this is the real "seamless"):
1. THE PARKED CITY: do not dispose what the fight leaves; park it, and on the way back hand everything to the walk instead
   of building (the walk's record H must survive the fight: doors, counters, colliders, terrain, tickers; plates are
   stripped from kept pieces at the hand-over and must come back). Until then the way back still runs every builder.
2. The fight's may-fade props (most of what is left): merge them too and hand a root back the moment the fade's candidate
   list (`_occFieldCandidates`) names it.
3. The ground in a fight: 320 tiles stand; drop the ones past keepFarM or merge them per square.
4. Empty holders are still recorded groups (2,000+): leave a holder whose pieces are all held out of `_ewBunFieldTargets`.
5. The switch itself (profile of a cloud strike: `_hqTExactTop` 1.8 s, raycasts ~4 s of three's plain intersect, texture
   writes): not measured on his Mac yet.

## THE SHELL KEEPS ITS RECORDING (2026-11-15, the shell's rests answered)

mondo's three F3s of one session (23:48-23:50 UTC), after the lens could say why:
1. A FIGHT in the city: 23.4 FPS, frame 42.8 ms, CPU 31.4. "bundles 2262 groups, 2608 meshes", "mask: setup + lights + sort
   8.0", "scene: setup + lights + sort 3.5", "mask: projection walk 3.3" (15K visits), "rest of the frame 9.2", picks 234/s
   (42.9 ms/s), shader builds 3.8/s. NOT WORKED ON YET: the fight needs its own pass (2,262 recorded groups for 2,608 meshes;
   what the mask's first render pays; the 9.2 ms outside every span).
2. The walk right after the fight: 12.4 FPS for ~30 s. "Static batch ... build 6252->1265", "1086 terrain: alone in its look
   / not yet merged", shell released, 2,126 draw calls. This is the known "the way back rebuilds the whole city" (the
   hand-back disposes and re-merges everything). NOT WORKED ON YET: a hand-back that parks what the fight left.
3. Thirty seconds later, steady: 37.8 FPS, 26.3 ms at 2,799 meshes (price line: 25.9).
- The shell's tree changes by cause, steady: "tree 17 [merge 0, movers 10, shown/hidden 5, other 2], rests 2". So the rests
  come from MOVERS (a still-walk piece starts or stops: `_ew_bunOutA` on / off = a tree change each way; "21 moving" of
  12,874) and pieces shown / hidden, not from the merge. (The lens counted a merge-held piece as "hidden" because the
  bundle tick runs inside the draw, where a held piece reads hidden; fixed here: held pieces count as "merge".)
- Fix (`_ewBunTick`): a walk room's still group with over 1,000 children (the big room's shell) is released only at 24 tree
  re-records in 2 s (about every third frame), not 5. Below that it re-records each time: one walk of its children per
  change in place of that walk in every pass of every frame for 5 s. Other groups keep 5. Off: `window.EW_BUN_REST_AT_5`.
  Not run in a browser (a threshold; `node --check`).
- NEXT for the drops: THE SHELL'S SHORT WALK (three still visits the shell's ~10,000 hidden children on every record frame
  and in the lamp / mask passes: hand it only the children the merge does not hold, e.g. by lending `children` for the
  call, list re-made on a batch install / break); the rooms chunks that flip ("rooms b|dc:P03-06-B1 tree 36 [other 36],
  rests 7": same count hidden and shown = an LOD or a prop pair swapping at a threshold); then 1 and 2 above.

## THE SHELL'S RESTS (2026-11-15, OPEN: why the shell falls back to piece-by-piece; the lens only so far)

mondo's F3 after THE DOOR CHUNKS (23:37 UTC): 25.9 FPS, frame 38.8 ms, CPU 29.1 ms at 2,930 meshes (price line: 26.6).
"scene: projection walk 5.4 · sun shadow: projection walk 4.4", "Walk visits: scene 21K · sun shadow 20K" (were 1.8K),
"downtown_streets shell (values 0, tree 42, rests 3, classic now)", no "shell rest" kind, "Shader builds 1.0/s", "terrain:
Sprite 74" own draws, doors 66 meshes in 46 groups (the door chunks work: 223 -> 66).
- Reading: the readout was taken while the SHELL group was released (`_ewBunTick`: 5 tree re-records within 2 s = "the tree
  itself churns: classic for a while", `st.until = now + 5000`, counted as "rests"). For those 5 s three walks the shell's
  ~10,000 children in the scene pass and the sun pass (~10 ms) and draws its loose pieces one by one. Every F3 of the day
  shows rests (2 to 15 a session), so this is not new with the door chunks, but it is the "lag and frame drops" he feels,
  and nothing proved yet what churns the tree. Suspects: the static batch installing / handing back pieces over several
  frames (a re-scan every 4 s while files land: each slice hides pieces = a tree change a frame), movers going out and
  coming back, pieces shown / hidden.
- The lens now says it: "SLOW RIGHT NOW: <group> (N pieces) is drawn piece by piece for X s more ..." under the mesh kinds,
  and "Re-recorded most" gives the tree changes by cause: "tree 42 [merge a, movers b, shown/hidden c, added/removed d,
  other e]" (`st.why.tB/tO/tH/tN/tX`, set in `_ewBunTick` from `_ewBunWalkTop`'s counts of held / out / hidden children).
- NEXT: read that bracket on his next F3. If "merge" leads: commit a build's installs in one frame (prepare the merged
  geometry over frames, hide + add all at once = one tree change). If "movers": hold a mover out longer before it comes
  back. Never replay a stale recording (a held piece would draw twice: wrong for see-through pieces).

## THE DOOR CHUNKS (2026-11-15, each door of a big room is its own chunk and recording)

mondo's F3 after THE LOOSE PIECES (23:15 UTC): 43.2 FPS, frame 23.1 ms at 2,188 meshes (price line: 23.0, exact again),
"shell rest 278" (was 851), "573 loose pieces stood in", 7 stacks. By kind: squares 1,138 (20 groups) · instance cells 311 ·
shell rest 278 · doors 223 (1 group) · prop plots 148 · fences 53 · rooms 37. Squares: see-through / cut-out 295, no sheet
lit 203, stacked 166, node terrain 146 (the ground's stand-ins), one paint 128, many looks 81, sign canvas 28.
One GPU error that session ("In a execute_bundle command, Texture with 'PointSha...": a recording that still names a point
shadow map that was freed; the same class as the older "Texture with '' label"). Not chased yet.
- THE DOOR CHUNKS (three-renderer.js `_hqDoorChunks`, called from `_hqChunkTick`): in a big room every direct child group
  of the door group (`hq_city_door` and the room doors: frame, leaves, plate) is registered as a chunk where it hangs
  (`_ew_dChunk`, `_hqChunkReg(H, g, 1e12)` = frustum only, no far limit) and is a bundle target of its own
  (`_ewBunTargets`; the door group itself is a target only when it has no door chunk). Nothing is reparented, so the door
  group's still walk and THE DOORS REST work as before. The sun's render shows an off-camera door inside its box (as it does
  a shell square). A door-gun door (`_ew_noDChunk`) is never one: it shows and hides itself. `_hqChunkHome` makes them plain
  doors again. Off: `window.EW_HQ_NO_DOOR_CHUNKS` before the room. Lens: "Chunks: ... · doors a/b".
- Cloud (WebGPU on SwiftShader, HEAD on 75ffb21 + this change): 132 door chunks, 45 off camera at the spawn, 125 recorded,
  none left unchunked; walker teleported to a city door: its two leaves swing (pivot turn 0 -> +-0.026 and rising at the
  cloud's 0.2 fps), the group stays drawn; 0 frame errors. A door whose model has not landed has no sphere yet and is
  simply drawn (measured again every 2 s).
- NEXT: the squares (1,138): lit no-sheet pieces 203 (glow into the point data), cut-outs 295 (mostly sign canvases with a
  clear ground: 290 looks, one canvas each), the ground's 146 tiles (one look: could merge per square if the terrain look
  reads no object-space position; needs a pixel proof); then instance cells 311 and what is left of shell rest 278.

## THE LOOSE PIECES (2026-11-15, the shell pieces the merge refuses get a stand-in in their square)

mondo's F3 (22:35 UTC, 41.1 FPS, 24.5 ms, 3,022 meshes) with the new lines: "squares 1166 (24 groups) · shell rest 851
(1 groups) · instance cells 518 (49) · doors 223 (1 groups) · prop plots 152 · fences 84 · rooms 28". So 1,074 meshes (the
shell's own group + every door of the city) are replayed wherever the camera looks, and again for the sun.
Squares: stacked 277, alone no sheet lit 256, alone see-through / cut-out 251, one paint 147, alone sign canvas 104, alone
1024 px sheet 53, alone 128 px 30.
- THE LOOSE PIECES (three-renderer.js `_hqBatchLooseOk`, `_hqBatchSnapOf`, `c.loose` in `_hqBatchScan` / `_hqBatchBuild`): in
  a big room's shell, a piece the merge refuses (several looks on one mesh, a geometry the merge cannot join, the ground's
  `_ew_hqTerrain` look, a see-through sheet, a patched shader) is scanned as a LOOSE candidate with a key of its own, so it
  takes the stand-in path of THE SHELL CELLS: a mesh on its own geometry and own look(s) in its 96 m square. Never: moving /
  changing pieces (the watch breaks them back), children, own draw hooks, shader materials, every other off flag (cars,
  signals, sea, mirrors, decals, LODs, text), a piece wider than 3/4 of a square (it would hold the square on camera).
  Off: `window.EW_HQ_NO_LOOSE` before the room. Lens: "(N loose pieces stood in)" on the Static batch line.
- Cloud (WebGPU on SwiftShader, counts; HEAD on 5b48248 + this change): 523 loose stand-ins (320 ground, 177 many looks, 26
  see-through), every one checked against its piece: same geometry, look, shadow flags, layers, order, world matrix
  difference 0; 0 frame errors. Expect his "shell rest" 851 -> ~330 and the ground culled per square.
- NEXT by his numbers: doors 223 in one group (a group per plot, culled like props); instance cells 518; the squares' lit
  no-sheet pieces 256 (glow in the point data like THE SHEET STACK's `ewSk`, they merge with one paint) and cut-outs 251.
- THE HERO LAMP, where it is: the light is claimed by the FIRST prop whose key matches `shadows.hero.keys` and whose model
  lands, so it differs per session and some sessions have none (his last three F3s: "Shadow casters 1: dir"). The city's
  candidates: `lava_lamp` at room (175, -0.6) = a Bayside shop by the Mall door, ~60 m from the spawn (113.75, 22.75);
  four `brazier` by the Tower lobby (-37..-25, 4..37); two `candelabra` at the Chapel (-237, 100). In the cloud browser the
  lamp never claimed (teleport beside the lava lamp: `heroShadow().light` false). Do not send him to look for it: ask for a
  Shift+F3 wherever he sees the FPS fall.

## SHIFT+F3 + WHERE THE LAMP STANDS (2026-11-15, the lens only; mondo: "where is the point lamp ... I can only copy the f3 data when I am paused")

- **Shift+F3 copies the readout from the keyboard** (the lens's key handler; opens the lens first if it is closed). No pause,
  no mouse. Never ask him again to "copy the F3" without naming this key.
- Paused readings: a pause stops the walker, traffic, signals and doors (`H.paused`) but the room is drawn as before, so the
  mesh count and the frame are valid; the tick rows read a little low. Prefer an unpaused Shift+F3.
- The "Hero lamp" line ends with where it stands from the camera: "it stands 34 m ahead to the left" (`_lensLampWhere`).
  A room has ONE hero lamp (`_hqHeroShadow`: the first prop whose key matches HQ light rules `shadows.hero.keys`), so that
  line leads him to the 22.8 FPS spot. Never ask him to find a thing the lens can point at.

## THE FRAME IS THE CARD'S AGAIN + THE REPLAYED MESHES BY KIND (2026-11-15, the lens only)

mondo's F3 after THE KEPT LIGHT LIST (22:12 UTC): "render: node + rig ticks" 3.0 -> 0.4 ms, CPU 20.6 -> 17.8 ms, but the
frame only 27.2 -> 26.6 ms (37.5 FPS) at 3,230 meshes. **Lesson, measured: with the lamp off camera, cutting our JS does not
move the frame.** 2.8 ms of JS bought 0.6 ms. The price line still holds (12.5 + 4.8 us x 3,230 = 28.0): the frame follows
the count of replayed meshes (Firefox's GPU process), as THE SHELL CELLS said. Do not spend more turns on JS rows of 1-3 ms;
cut meshes. (The JS rows matter only where JS exceeds the card's time: the hero lamp on camera.)
- The lens now says what the replayed meshes are (three-renderer.js `_lensText`, read live from `_ewBun.marked`):
  "Replayed meshes by kind: squares N (groups) · instance cells · fences · prop plots · rooms · doors · shell rest ...",
  "squares, what each mesh is: stacked · one paint · merged · alone: no sheet / no sheet, lit / see-through / node wind /
  sign canvas / sheet 128px ..." (a stand-in carries `mesh._ew_bSingle`), "biggest groups: ...".
- NEXT: read those three lines on his next F3 and cut the biggest kind. Candidates already known: "alone" stand-ins with no
  sheet (3,534 shell pieces wear no sheet; they merge by colour but glow and shine still split them), far squares as one
  fused mesh, instance cells.
- mondo 22:12: "the mountain walls ... look bad bc of repeated pattern". Not answered yet whether that is new today (the
  stack) or the cliff sheet's tiling as built; asked him to compare with `EW_HQ_NO_STACK = true`. The Mountains rooms are
  another thread's (claims.md).

## THE KEPT LIGHT LIST (2026-11-15, the rig's walk of the whole scene every frame)

mondo's F3 after THE SPLIT STACK (21:54 UTC): 36.9 FPS, frame 27.2 ms, CPU 20.6 ms, 3,264 meshes (price line: 28.2), shell
9,024 -> 1,701 draws (was 1,961), "sheet stacks 5 (150 sheets)". The split stack is confirmed on his Mac. His word on the walls
is still not given in words.
What the frame is now (lamp off camera): our JS is 20.6 of 27.2 ms in rows of 1-3 ms: scene bundle replays 3.1, node + rig
ticks 3.0, matrix walk 2.3, mask setup 2.0 (= `_hqInstSync`, the frame's first render pays it), bundle check 2.0, scene
classic draws 1.5, mask walk 1.4 (5.5K visits). 60 FPS = all of them down, there is no single big row left.
- "render: node + rig ticks 3.0": `_ewRigTick` called `_ewRigWalk(scene)` every frame = every visible object of the scene
  (~40,000 in the city) to find ~30 lights. Now `_ewRigRead`: the scene's lights are listed once (`scene._ew_rigList`, every
  light, shown or not, walk order) and again when `_ewAddCount()` moved (nothing in the game adds a child but through
  `Object3D.add`: grep-checked), the scene's child list changed, or 1 s passed. Each frame: a listed light counts when it and
  every parent up to the scene are shown (what the walk reached); same treatment, same order, same caps. Every scene (walks
  and battles). Off: `window.EW_RIG_WALK_EVERY = true`.
- Checked by `node --check` and reading only (no browser run was asked for this one). If the city is dark or a lamp is
  missing after this PR, that switch tells at once.
- NEXT rows, by size: scene bundle replays 3.1 (284 groups; 863 of 5,533 objects refreshed a frame), matrix walk 2.3,
  `_hqInstSync` 2.0, bundle check 2.0. And the hero lamp on camera (11.5 ms, needs his F3 at that spot: the "Hero lamp" line).

## THE SPLIT STACK (2026-11-15, why the 1024 px sheets never stacked on mondo's Mac)

mondo's second F3 (20:50 UTC, lamp off the camera): 34.9 FPS, frame 28.6 ms, CPU 21.7 ms at 3,597 meshes (the price line says
29.8), "Shadow split: sun 1 renders, 33 calls, 25K tris · lamp 0", "Walk visits: scene 1.8K · sun shadow 1.8K · mask 4.7K",
"Hero lamp: off the camera". So the first F3's 11.5 ms of shadow rows (walk 8.3 + draws 3.2, 829K tris) is the hero lamp's cube
sides when the lamp is on camera; the sun's map is 1.4 ms. STILL OPEN: his F3 standing where the lamp is in view (the "Hero
lamp" line says why it redraws).

- Cause (cloud browser census of the shell's looks): the city wears 25 sheets of 1024 x 1024 with one sampling (the calm pack:
  hedge, concrete, tiles ...; it was 18 when THE SHEET STACK was sized). 25 x 4 MB = 105 MB, over `_hqStackPrep`'s 96 MB bucket
  limit, so the WHOLE bucket was left out (`skipped.tooBig`): 427 looks / 2,300 pieces kept a look per sheet. Not KTX2 (they
  are PNG images on every machine).
- Fix (`_hqStackPrep`): a bucket over the limit is cut into the fewest stacks that each fit, the most worn sheets together in
  the first (`uses`); each stack is filled the same way as before (the sheet's own picture, on the card), so nothing about a
  texel changes. All stacks together stay under 320 MB (`_hqStk.bytes`). Off (the bucket left out, as before):
  `window.EW_HQ_STACK_NO_SPLIT` before the room. `EW_HQ_NO_STACK` still turns every stack off.
- Cloud (counts only): stacks "128x128 x111 · 1024x1024 x13 · 1024x1024 x12 · 64x128 x8", 144 sheets, no refusal, 0 frame errors.
  The shell merge, still building when read: 8,376 pieces -> 1,569 draws (his Mac before: 9,024 -> 1,961). Expect ~1,600 on his Mac.
  Harness of this run: session scratchpad ph/ph.js (jsdelivr modules must be fulfilled, not redirected: a redirect breaks their relative imports).
- THE SIGN CANVASES ARE NOT WORTH A CUT (same census): 424 canvases on 555 pieces in 200 size / look kinds; 315 of the pieces
  are see-through or cut-out (never stackable), 87 share one 256 px canvas already. About 130 opaque pieces = 0.6 ms. Dropped
  from the list.
- Other things the census showed: 3,534 shell pieces wear no sheet at all (325 looks: lit parts, glass, decals; they merge by
  colour only), 2,580 wear a wind / terrain node look (trees, hedges: never in the stack).

## THE SHADOW SPLIT (2026-11-15, the lens only; from mondo's F3 after THE SHEET STACK)

mondo's F3 after #1478 (20:39 UTC, walk, his eyes on the walls not yet answered in words): 22.8 FPS, frame 43.3 ms, CPU 38.7 ms
(submit 30.1), bundles 444 groups / 3,624 meshes, shell 9,024 -> 1,961 draws, "sheet stacks 3 (125 sheets)". Two readings:
- **The frame at that spot is our JS, not the card**: the price line (12.5 ms + 4.8 us x meshes) gives 29.9 ms for 3,624 meshes; he
  measured 43.3 with 38.7 of it in the Frame JS rows. Top rows: "shadow: projection walk 8.3", matrix walk 4.8, scene bundle
  replays 4.6, node + rig ticks 3.7, "shadow: classic draws 3.2" (167 calls, 829K tris), scene classic 2.5, bundle check 2.3.
  The scene's own walk is 0.7 ms, so the shadow's 8.3 is not the plain walk. "Shadow casters 2: point 256x6, dir 1024": a hero
  lamp was lit, and 829K shadow triangles is the same figure as the room F3 behind THE MOVING SIDES (834K). Lead, NOT proven: a
  lamp's cube sides (they draw every bundle group the classic way) redrawn every frame. The cloud browser run to prove it was
  refused by the session's safety layer, so the lens now says it.
- **The 1024 px sheets did not stack on his Mac** (3 stacks = the 128 px tiles). Lead: his build loads KTX2 (ASTC) sheets and
  `_hqStackTex` leaves compressed textures out. That is ~485 draws THE SHEET STACK counted on. Open.
- The lens (three-renderer.js, lens open only): the Frame JS shadow rows are now "sun shadow: ..." and "lamp shadow: ..."
  (`_lensSpanHook`, by the shadow camera); new lines "Shadow split (a frame): sun N renders, calls, tris · lamp N side renders,
  calls, tris", "Walk visits (objects a frame): scene · sun shadow · lamp shadow · mask" (every `_projectObject` visit), and
  "Hero lamp: <why> · frames held / drawn · in reach · moving · sides drawn / skipped" (`_heroStat`).
- NEXT: read those lines on his next F3 at the same spot, cut the row they name (the lamp's sides, or the sun's walk), then the
  1024 px sheets, then the sign canvases (128 px tall, width by the board's shape 32-2048: exact-size stacks group few; needs a
  count of sizes first).

## THE SHEET STACK (2026-11-15, looks that differ only by their sheet merge: one array texture per sheet size)

mondo's F3 after THE ONE PAINT: 31.9 FPS, 32.5 ms at 4,247 meshes (the price line predicted 32.9 ms). What still split the
shell's 3,223 draws: the sheet (125 of its pictures are the Urban pack's 128 x 128 tiles = 1,515 draws, 18 are 1024 x 1024 =
485 draws, ~400 are sign canvases, one draw each) and a lit part's glow colour.

three-renderer.js `_hqStk`, `_hqStackPrep` (called when a shell batch leaves 'watch'), `_hqStackTex / _hqStackOf`,
`_hqStackFill`, `_hqStackWatch`, `_hqStackMat`, `_ewNodeStack` (the dress, `_ewNode.k === 'stack'`):
- Same-size sheets with the same sampling (wrap, filters, anisotropy, colour space, flip) are the layers of ONE
  `DataArrayTexture`. A layer is filled ON THE CARD from the sheet's own picture with the call three uploads that sheet with
  (`copyExternalImageToTexture`, same flip and alpha), mips by three's own generator. Nothing is decoded twice, resized or
  repainted. (A first try read the PNG bytes itself: wrong on Firefox / default Chromium decodes, which apply the files'
  gAMA + cHRM chunks, up to 9/255 off. Dropped.)
- In a big room's shell, the sheet, the colour and the glow leave the look key (`_hqBatchMatKey(m, vc, sk)`): each point
  carries `ewSk` = glow rgb x intensity, layer x 2 + (glow reads the sheet), its colour, and its uv with the sheet's own
  repeat / offset / turn applied. The merged mesh wears a copy of the look with no sheet (`_ew_stacked`).
- Only plain opaque Phong / Lambert parts with one sheet (emissiveMap may be the same one), no hook, WebGPU backend only.
  A lost device's stack is refilled (`_hqStackWatch`, once a frame from `_hqBatchTick`). Stacks live for the session
  (128 px x 115 layers = 8 MB; a bucket over 96 MB is left out). A stack whose fill throws is dropped, its sheets stay.
- Off: `window.EW_HQ_NO_STACK` before the room. Lens: "Static batch ... · sheet stacks N (M sheets)". Dev:
  `ThreeRenderer.hq.dev.stack()`.

Proof of the picture (standalone page, three r186 WebGPU on SwiftShader, session scratchpad st/t.html): four classic Phong
quads (own sheet, repeat, offset, colour, two with a glow that reads the sheet) against ONE merged mesh on a 4-layer stack:
7 of 262,144 bytes differ, by 1/255; the far view (mips) is identical.
Cloud city (counts only, HEAD on f21eb50): shell 9,002 pieces -> 1,713 draws (was 3,223), 359 stacked meshes over 106 layers,
replayed meshes at the start corner 4,190 -> 2,907, 0 frame errors, the WGSL reads the layer from the point.
Not stacked there: the 1024 px sheets (the sandbox shrinks them; on a real machine they are one more stack, 75 MB).

What is left in the shell after this: parts alone in their look and square (signs: one canvas each), see-through / cut-out
parts, the parts the batch never takes (terrain flag 320, multi-material 171, tangent 36). NEXT by yield: the sign canvases
on shared sheets (they clamp, so an atlas with a gutter), the instance cells and prop chunks (635 meshes in view), the sun
shadow held between frames.

## THE ONE PAINT (2026-11-15, the price of a mesh on mondo's Mac + colour out of the look)

mondo's two walk F3s after THE SHELL CELLS price a replayed mesh on his Mac (Firefox, WebGPU): 6,712 meshes = 44.7 ms,
5,601 = 39.4 ms, his 139-mesh lobby = 12.5 ms. So frame ~ 12.5 ms + 4.8 µs x meshes (the lens's "bundles ... meshes" count;
each is replayed in the scene pass and, when it casts in the sun's box, again in the shadow pass). **60 FPS wants under ~900
meshes in view.** Use this line to size any later cut.

What the shell's 5,259 draws were (cloud census of the merged meshes, by which part of the look splits them): 4,075 pieces
alone in their look and square; colour 650+ distinct values over ~300 textures (640 once every square is built). Texture
transform, sampler and specular split nothing. `_ew_bunHs / _ew_bunHv / _ew_bunF` (the bundle recorder's notes on a material)
were part of the look key and split a re-scan's batches: now left out of the key.

THE ONE PAINT (three-renderer.js `_hqBatchVcOk`, `_hqBatchVcMat`, `_hqBatchMerge(cs, vc)`): in a big room's shell (`B.vc`,
same rule as the shell cells) the colour is not part of a look. Pieces that differ only by colour merge; each point carries
its piece's colour (times its own painted colour when the look reads one); the merged mesh wears a copy of the look with a
white colour and `vertexColors` on (one copy per look per room, `B.vcMats`, freed in `_hqBatchDrop`). A lone piece keeps
its own material and geometry (the stand-in). Off: `window.EW_HQ_NO_ONE_PAINT` before the room is entered.

Cloud (SwiftShader, counts only, HEAD on e022511): shell 8,864 pieces -> 3,213 draws (was 5,259), 1,080 of them one-paint
meshes holding 6,731 pieces, colours equal to 6e-8, replayed meshes at the start corner 5,594 -> 4,190, 0 frame errors.

What still splits the shell (3,203 looks): the texture (636 pictures; with them unified 501 would be left), then emissive
(lit windows, 2,524 without it). In view at the start corner: shell squares 2,612 meshes, instance cells 353, prop chunks 282.
NEXT, in order of yield: one texture array per sheet size so looks differing only by picture merge (the big one); the sun
map held between frames (shadow replays ~27% of replay time; a hero shadow at half rate shows, so needs a static/moving
split); far squares as one fused mesh. Piece sizes (radius): 10% under 0.5 m, 25% under 1.2 m, half over 5 m, so a far
limit for small pieces buys little.

## THE SHELL CELLS (2026-11-15, the city walk is the graphics card's: the count of pieces)

mondo's tests after #1432: walk 20 FPS with CPU 20.8 ms (was 30); Render Scale at a quarter of the pixels = the SAME 21 FPS; his
lobby (139 replayed meshes) = 80 FPS. So the walk's frame is not our JS and not pixels: it is what the GPU process is fed, ~7,000
meshes replayed in the scene pass and again for the sun ("refreshed N of 12,591"). Every walk F3 of the day sat at 20-22 FPS
whatever the CPU did, for that reason. LESSON: when frame minus CPU does not move with the CPU or the pixels, count the replayed
meshes (the lens "bundles N groups, M meshes"), not the draw calls line (it leaves the bundles out).

- The city's ground, roads and buildings merge into ~1,100 batches per 96 m square and look, and all of them hung in the shell
  group: one recording for the whole 504 m city, never culled, drawn whole again for the sun.
- `_hqShellCell` (three-renderer.js, by `_hqBatchHost`): in a big room (`_hqChunkBig`) a shell batch hangs in its square's group
  `hq_shell_cell` under `H.chunks.root` (`_ew_chunk = 'shell:i,j'`, `_ew_sCell`, far 1e12 = frustum only, so a skyline stays).
  `_hqChunkTick` culls it like a fence plot; `_hqChunkHome` puts its meshes back before the hand-over's `_hqBatchDropAll`.
- A LONE piece (alone in its look + square: thousands in the city) gets a STAND-IN: a mesh on the piece's OWN geometry and
  material, the piece's shell-relative matrix decomposed onto it, hung in the square; the piece hides behind the batch's
  `visible` getter like any merged piece (`rec.single`: the break never disposes the shared geometry). minN is 1 for the shell of
  a big room only.
- THE SUN'S OWN CHUNKS also SHOWS a shell square that is off camera but inside the sun's box for the sun's render, so a tower
  behind the camera still shades the street.
- Lens: "ground + building squares a/b". Off (before entering the room): `window.EW_HQ_NO_SHELL_CELLS`, stand-ins only:
  `window.EW_HQ_NO_SHELL_SINGLES`.
- Cloud check (SwiftShader, the start corner, the batch stuck at 'scan' there as always): 38 squares, 26 drawn, bundles 8,306 ->
  5,594 meshes, 4,075 stand-ins all exactly on their pieces (worst matrix difference 1e-16), a strike still hands over (0 squares
  left in the fight), 0 frame errors. The log's 5 "Async render pipeline creation failed" lines (a missing sampler binding, one
  on an unlit SpriteMaterial) are the cloud browser's shrunk textures, not this.
- NEXT if his F3 is still short of 60: squares at 48 m, small far pieces of a square on a distance limit, the sun's map held
  between frames, Chrome's readout (Dawn replays bundles far cheaper than Firefox's wgpu).

## THE FIGHT'S OWN LAMPS + THE KEPT KEEP THEIR OWN + THE SUN'S OWN CHUNKS (2026-11-15, the walk to battle switch in Disaster City)

mondo after #1416 (fight 4.8 -> 50 FPS): "the transition from explore to battle was still terrible, takes forever and drops to 0 fps".
His two F3s: walk "rig 12/17", fight "Lights point 72 · rig 63/69", session builds 583/360 -> 875/522.

- Reproduced in the cloud browser with a STRIKE (`window._hqEncounterFire({ target: { kind: 'npc', id, race, x, z, y }, x, z, y, gesture: 'attack' })`;
  `_hqMarkerFight('tdm')` is NOT his path: it fights the old streets board, rebuilt). Census of the fight's scene: 67 lit point
  lights under `hq_field_lights`, distance 5 m: `_fieldGroundDress` hung one on EVERY desk_lamp / table_lamp prop of the room, and
  the city is one room. The rig grew 12 -> 64 at the switch, so every material of the fight was built again with 64 lamps.
- THE FIGHT'S OWN LAMPS: a desk / table lamp gets its light only inside THE BATTLE RADIUS (keepM from the board's rim), the nearest
  first (on the board first, the middle before the rim), HQ_PROP_LIGHT_MAX at most. Off: `window.EW_FIELD_LAMPS_ALL`.
- THE KEPT KEEP THEIR OWN (`_hqBuildRoomInBattle` take): the hand-over keeps 1,942 pieces and leaves 13,457; a piece left behind was
  disposed on the spot (geometry + material) and the city's copies share both, so the kept pieces made their buffers, pipelines
  and bindings again. Now only what no kept piece uses is disposed. Off: `window.EW_FIELD_DISPOSE_ALL`.
- THE SUN'S OWN CHUNKS (the walk, his F3 "shadow: bundle replays 8.7" ms): in the sun's shadow render a chunk whose sphere is
  outside the shadow camera's box is hidden for that render. Lens: "N left out of the sun shadow". Off: `window.EW_SHADOW_CHUNK_ALL`.
- NOT done: the way back still rebuilds the whole city (the hand-over disposes what it leaves); a hand-back that parks the left
  pieces would make the return instant.

## THE LAMP'S REACH ON THE NODE RENDERER (2026-11-15, the fight on Disaster City: 4.8 FPS)

mondo's battle F3 (Firefox, M1, WebGPU, 3456x1812): frame 210 ms, CPU 23.7 ms, "Lights point 72 · rig 63/70". The frame was the GPU's:
the node renderer ran the whole light maths for all 64 rig point lamps on every pixel (the walk lights 12 to 14). THE LIGHT'S REACH
(2026-11-10) skipped out-of-range lamps on the classic renderer only.

- three-renderer.js `_ewNodeLights`, `EwPointLightNode.setup`: for a rig point lamp (no shadow) on a Lambert / Phong / Standard /
  Physical material, the direct term is built inside `If(dot(lightColor, lightColor) > 0)`. lightColor = colour x the legacy ramp,
  exactly 0 past `distance` and for a dark spare, so the skipped work added 0: same picture.
- Only rig lamps: three sorts lights by id, the rig's sun lamps come first and build the shared terms (normalView, view direction)
  outside any branch. Toon / gradientMap materials are left alone (their direct term samples a texture; WGSL refuses that in a branch).
  `builder.material` is the game's CLASSIC material (type MeshPhongMaterial), not the node one: test the classic flags.
- Switch (read at shader build, reload): localStorage `ew_lightsEveryPixel = '1'` or `window.EW_LIGHTS_EVERY_PIXEL = true` (the classic switch).
- Cloud check (SwiftShader WebGPU, Main Hall): Phong, Lambert, Standard and Physical (clearcoat + sheen) compile with the branch, one
  `if` per rig lamp in the WGSL, 0 frame errors. FPS is his Mac's to measure.
- The rig is one per session and never shrinks, so after one 64-lamp fight every later scene carried 64 lamps a pixel too. With the
  branch a dark spare costs one compare.
- Still open in fights: shader builds 2.5/s mid-fight, 9 post passes at 6.3 M pixels, the props' 670K triangles.

## THE ROLLING WATCH + THE UNIT MASK + THE MOVING SIDES (2026-11-15, the 60 FPS thread; mondo: "22 fps with lag and frame drops is a joke")
His Mac (Firefox, WebGPU, 3456x1812): 21.9 FPS, frame 45.5 ms, CPU 31 ms; a second spot 20.8 FPS with "shadow 405 calls, 834K tris".
- WHERE THE FRAME GOES: frame minus CPU is ~14 ms that no JS row owns. Firefox on macOS presents a WebGPU canvas by CPU READBACK
  (Mozilla bug 1708023, open): 25 MB a frame at his canvas size. Asked him for three F3s (Chrome; Render Scale 67%; `?ew_gpu=webgl`).
  His post chain reads "20 passes · A[smaa|off|BDSF]": B = bloom ON in his profile (11 of the 20; the shipped default is 0).
- THE ROLLING WATCH (`_hqBatchCheck(R, B, rollMs)`, `HQ_BATCH.rollMs` 0.35): THE STATIC BATCH's watchdog read all ~8,200 merged pieces
  in ONE frame every 500 ms (the lens's "tick: static batch 4.1" average = ~45 ms twice a second). A round is spread over the frames;
  the next starts `checkMs` after the last ended. `visible` / `parent` writes still break a batch at once. Off (whole round in a frame):
  `window.EW_HQ_BATCH_CHECK_WHOLE`. THE RESCAN ON CHANGE: the late-piece scan (a forced matrix walk + a key read of every piece, every
  4 s for good) runs in a ready room only when something joined the scene (`_ewAddCount`) or every `rescanIdleMs` 30 s. Off:
  `window.EW_HQ_BATCH_RESCAN_ALWAYS`.
- THE UNIT MASK (three-post.js `_scanPixelMaskTargets`, `PIX_LAYER_UNIT` 9, `_renderPixelMask(..., unitOnly)`): with Pixelate off the
  mask's only reader is THE BOLD UNIT LINE, yet its static pass drew every `_ew_pixelate` mesh = every Meshy prop (his lens "extra":
  178 draws / 353K tris; props so wore the units' bold line, which his ask never wanted: "bolder lines on units, same thinness
  everywhere else"). The scan tags the still meshes that ride a unit (under a bone, or under the group holding an `_ew_modelSkin`
  body) on layer 9; the style's own mask draws layer 9, skips every chunk (`renderer._ew_maskUnit`, the `_projectObject` wrapper) and
  draws nothing when the scene holds none. The skinned pass short-walks chunk groups too (was every child of every drawn chunk; off
  `window.EW_MASK_CHUNK_FULL_WALK`). Pixelate "models" still draws every prop. LOOK CHANGE: props now take the map's ink width.
  Old mask: `window.EW_STYLE_MASK_PROPS = true`. Main Hall, cloud browser: extra pass 6-8 draws (the bodies), 0 frame errors.
- THE MOVING SIDES (`_hqHeroGate`, `_heroSideBits`, `_heroBodySides`, `_heroSidesHook`): a hero point lamp redrew all six cube sides
  whenever one body in reach moved. Now only the sides whose 90-degree pyramid a moved body touches (now + where the map last drew
  it); a body on bones asks every frame, a rigid mover (the lava lamp's wax: inside the lamp = every side) at THE SLOW PIECES' 10 Hz.
  All six on a list change, a live material, the lamp moving, the refresh, and every `HERO_FULL_MS` 4 s. The gate hands the sides to
  the draw (`L._ew_heroFaces`, read once); a wrapper on `THREE_GPU.PointShadowNode.prototype.renderShadow` leaves the other sides
  uncleared and undrawn (WebGPU side order +X -X -Y +Y +Z -Z). `HERO_REFRESH_MS` 1000 -> 3000 (a held lamp in view redrew all six
  once a second). Off: `window.EW_HERO_ALL_SIDES`. Counts: `heroShadow().sides / sidesDrawn / sidesSkipped`.
  NOT EXERCISED in the cloud browser (its frames are seconds apart, so the wax is always due = all six): `_heroSideBits` was checked
  against 20,000 random spheres (0 missed sides). Ask for his F3 beside a room lamp.
- THE CLOUD BROWSER'S GPU: headless Chromium lost the WebGPU device at boot ("Could not find SharedImageBackingFactory ...
  WebgpuSwapChainTexture", then "A valid external Instance reference no longer exists" and every createBuffer failing). Flags that
  work: `--enable-unsafe-webgpu --use-webgpu-adapter=swiftshader --use-gl=angle --use-angle=swiftshader --enable-features=Vulkan
  --use-vulkan=swiftshader --disable-vulkan-surface`. The picture is black there on main too: counts and errors only.
- LEFT (structural): the shell as per-plot chunks (cull + own bundle; today one group of 10,000 pieces, 209 classic draws); merged
  walls redrawn whole by a lamp's sides (a 96 m batch for a 3.5 m lamp); the pixel side (render scale by itself on Firefox + Mac).

## THE DOORS REST + THE COPIES REST + THE ADD'S OWN GROUP (2026-11-15, mondo's F3 after THE LAMP'S TIGHT REACH)
His readout: 20.3 FPS, CPU 39.2; matrix walk 6.5 · bundle check 6.1 · scene replays 4.9 · shadow replays 2.4; "refreshed 1809 of 12710",
"check 7.47 ms/frame (67 quiet skipped, 21 still-checked)", "Re-recorded most: doors (values 14, tree 17, demoted)".
- THE DOORS REST: the door group is a still-walk group in a chunked room (`_hqChunkTick` arms it, `st.hold = HQ_STILL_DOOR_HOLD_MS` 30 s).
  `_hqDoorMotionStep` / the revolving door wake their door (`_hqStillWake(d.group)`), so a leaf that swings is drawn outside the
  recording while it moves and 30 s after: one re-record a swing. Before, a swing changed the group's values every frame -> demoted
  (three refreshes each of its pieces in every pass; retried after 30 s .. 8 min, demoted again). Two city doors carry a part that
  never stops (a spinning way mark): those two are always out (12 meshes).
- THE COPIES REST (`rpList` / `rpReplay`): a "dynamic" instanced batch asked for a full refresh every frame in every pass (three's
  `hasDynamicInstancing`); it now rests after RP_REST quiet frames like node objects and is refreshed the frame its
  instanceMatrix / instanceColor version or count moves (`ro._ew_rqI`, `_ew_rqV`). Off: `window.EW_BUN_INST_NO_REST`.
- The still walk keeps each kept child's position / quaternion / scale objects in the group's arrays (`st.P/Q/SC`): no property
  read off 11,000 children of many kinds each frame.
- THE ADD'S OWN GROUP (`_ewBunTick`): the 7.47 ms average was the frames where the groups were NOT quiet: any Object3D.add anywhere
  had every group checked, and a re-recorded group needed 40 still checks (2 s) to be quiet again. Now the add hook marks only the
  bundle group the object lands under and the one it leaves (`_ew_bunDirty`), quiet comes after `BUN_QUIET` 8 checks, and a group
  quiet for `BUN_QUIET_LONG` 90 checks takes every fourth frame. Old rule: `window.EW_BUN_ADD_ALL`.
- The sandbox draws one frame every 5 s, so its ms rows and "quiet skipped" are not his; verify by counts (movers, outs, errors).
- WHERE EACH FIX RUNS (mondo 11-15 "make sure all of these fixes apply everywhere ... story mode, battles, all of it"):
  every HQ / story / site room (any `_hqFrame` scene): quiet replay, copies rest, quiet groups + the add's own group, movers /
  changers out, the mask's short walk, the lamp's reach + tight reach + held lamp, quiet instance sync, scans on change, the
  Frame JS lens. Battles in a room (the field bundles, `_ewBunFieldTargets`): quiet replay, copies rest, mask short walk, and
  since this PR THE QUIET GROUPS (`field` in `_ewBunTick`; VS CPU on Mount Shasta: 531 groups, 353 skipped a frame, check
  0.6 ms; off `window.EW_BUN_FIELD_CHECK_EVERY`). Big rooms only (>= chunkMinSpanM 200 m, today the city), on purpose: the
  chunks and THE STILL WALK / STILL CHECK / DOORS REST — a small room's whole matrix walk is under 1 ms (3,500 objects, 0.6 ms
  measured 11-09) and a still walk starts a hand-animated nested piece up to 0.5 s late, so there is nothing to win there.

## THE LAMP'S TIGHT REACH + THE CHEAP SWEEP (2026-11-15, mondo's F3 at another spot of the city)

His Mac after #1396, standing where a room's bedside lamp (the hero light, reach 3.5 m) is in view: 17.6 fps, CPU 51 ms; "shadow 564 calls,
943K tris", "shadow: classic draws 7.3 + projection walk 4.4", "matrix walk 10.8" with 0 moving. The mask rows fell 14.5 -> 6.3 ms.
- Reproduced in the cloud browser (teleport beside the lamp, `EW_HERO_SHADOW_UNSEEN = true`): 724 shadow draws, 3.5M tris a frame;
  `heroShadow().why` = "a mover in reach". By kind: instance batches 2.4M tris (a 42 m cell's batch, every copy), shell meshes with a
  sphere > 20 m 501K, static batches 99K. The reach cull tested bounding SPHERES.
- THE LAMP'S TIGHT REACH: `_ewRchBoxOut` (world box vs the reach + 0.5 m, cached per object on its matrix checksum) and `_ewRchInstOut`
  (any copy within reach; cached per lamp place + instanceMatrix.version) in the reach branch of the `_projectObject` wrapper (leaf meshes,
  not skinned / morphing) and in `_hqHeroGate`'s "in reach" test. Off `window.EW_SHADOW_REACH_LOOSE`.
- Cloud browser after: 3.5M -> 0.6M tris a lamp frame, instance batches 2.7M -> 2K, in reach 312 -> 74 pieces. What stays: the plot's own
  merged walls + ground (their boxes hold the lamp).
- Why it redrew EVERY frame: (1) the city's water sheet (`_ewNode.k === 'fluid'`, 645 x 505 m, 2.4 m under the lamp) was a "live material"
  = "a mover in reach"; `_heroLiveMat` no longer counts fluid. (2) the lava lamp's own wax blobs (rigid meshes 1-8 cm from the light).
  THE SLOW PIECES: when only rigid pieces drifted (no bones, no live material, no list change) the map redraws at most every
  `HERO_RIGID_MS` 100 ms; `heroShadow().why` = "held (slow pieces)". Off `window.EW_HERO_RIGID_EVERY_FRAME`.
- THE NEAR LIST: `_hqHeroGate` runs inside the frame's matrix walk (`scene._ew_afterWalk`), so its loop over all 31,000 casters showed as
  "matrix walk" (10.8 vs 4.6 ms with the lamp in view; cloud browser 38 vs 17). `G.near` = the casters within reach + 6 m (+ every
  instanced / skinned one), rebuilt every 500 ms / on a new list / lamp move; frames between read only it. Off `window.EW_HERO_NO_NEAR`.
- THE CHEAP SWEEP: THE STILL WALK's twice-a-second sweep composed + multiplied every in-view subtree to look for a change; `_hqStillSum`
  now sums each object's own position / quaternion / scale (its `matrix` when `matrixAutoUpdate` is false) and the sweep walks the
  subtree's matrices only when that sum changed.

## THE MASK'S SHORT WALK + THE QUIET SYNC (2026-11-15, from mondo's first Frame JS readout)

His Mac after #1395: 20.2 fps (was 13.1), CPU 38 ms, frame 48.5 ms. Biggest rows: "mask: projection walk 8.2", "mask: setup + lights + sort
6.3", matrix walk 4.6, scene bundle replays 4.2, bundle check 2.8.
- THE MASK'S SHORT WALK (`_ewBunSetup`'s `_projectObject` wrapper, `maskFile`): three-post's model mask renders the scene twice (skinned
  layer 7, static layer 8) as a side render, which draws bundle groups the classic way, so it walked the shell's 10,000 children twice. A
  group with > 32 children (not a chunk, not a clipping group) keeps `_ew_mkIdx`: the children whose subtree holds a layer other than 0, a
  light, a bundle group, a chunk, a clipping group or an LOD, with their layer union; a side render whose camera lacks layer 0 projects only
  those meeting its layers. Re-filed on an add (once a second at most), a child-count change or every 10 s. Off `window.EW_MASK_FULL_WALK`.
- THE QUIET SYNC (`_hqInstSync`, scene.onBeforeRender, so the frame's FIRST render pays it = the mask's "setup"): 12,000 instanced copies
  walked to the scene for visibility + a matrix multiply each, every frame. A batch with no change for 30 syncs (`HQ_INST_REST`) syncs
  every 4th frame; any change wakes it. Parent visibility once per parent a frame (`_hqInstShown`, stamp props `_ew_shS/_ew_shC/_ew_shV`).
  Off `window.EW_HQ_INST_SYNC_EVERY`.

## THE STILL CHECK + THE FRAME BREAKDOWN (2026-11-15, Disaster City, after THE OUTS ON A REPLAY FRAME)

mondo's Mac (#1393): CPU 70 ms of which submit 40 with 99 draws, "check 8.85 ms/frame", and the lens could not say where the rest went.
- THE STILL CHECK (`_ewBunTick`, `S.noM`): in a group THE STILL WALK owns (`g._ew_st`: the shell, fence + prop chunks) the pieces' matrices
  are no longer hashed every frame (12 rounded numbers x 6,500 pieces): a piece's matrix changes only through that walk, which turns a mover
  `_ew_bunOut` the same frame and back (a tree change = re-record) at rest. The group's own matrix is hashed. Off
  `window.EW_BUN_HASH_MATRICES`. Lens bundles line: "check X ms/frame (N quiet skipped, M still-checked)".
- THE FRAME BREAKDOWN (lens open only): `_lensIn/_lensOut` spans (exclusive time) + `_lensMark` checkpoints. `_hqFrame`'s ticks each get a
  "tick: …" row, "matrix walk", "mirrors", "bundle check", "render: node + rig ticks"; inside the renders `_lensSpanHook` wraps three's
  `_renderScene` (sets the pass: scene / shadow / mask / pane / mirror/extra / post), the top `_projectObject` ("projection walk"),
  `_renderBundles`, `_renderObjects`, `_renderTransparents`, `_renderOutput`, backend `beginRender` / `finishRender` ("pass end + submit").
  Printed as "Frame JS (ms/frame): …" (biggest first, + "rest of the frame" = CPU minus the spans). Never unwrapped (other hooks wrap over).
- Cloud browser cannot time a frame (software GPU, ~0.2 fps): ask mondo for the F3 with the Frame JS lines and cut the biggest row next.

## THE OUTS ON A REPLAY FRAME (2026-11-14, a bug shipped in #1391 / #1393, fixed the same day)

three r186 `_projectObject` projects a BundleGroup's children ONLY when the bundle needs a new recording; on a replay frame it pushes the
bundle and returns. So a piece that is out of the recording (`_ew_bunOut`: traffic cars, signals, movers, changers) was drawn on record
frames only: with a still shell (0 re-records/s) the cars and signals were INVISIBLE. mondo's readout showed it: no `_ew_hqCar` /
`_ew_hqSignal` draws in the scene pass. I had read "34 shell draws outside its bundle" in the cloud lens as proof; it was a record frame.
- Fix: `_ewBunTick`'s walk collects the out pieces per group (`g._ew_bunOuts`); the `_projectObject` wrapper, when the group's recording
  is current for this camera + context (`_ewBunCurrent`), projects them itself into the list the group was handed to (`_ewBunOutsDraw`).
  A flag set / cleared by THE STILL WALK marks the group `_ew_bunDirty` so the quiet-group skip does not delay its walk.
- Proof to use next time: wrap `onBeforeRender` of the out meshes and count per frame over replay frames (scratchpad outs.js).
- Rule: before diverting anything out of a three code path, read whether three runs that path every frame.

## THE CHANGERS OUT (2026-11-14, the regression after THE MOVERS OUT)

mondo's Mac on #1391: 11.2 fps (was 14.9), "1.9 re-records/s (values 1.9)", shell 2,802 draws "outside its bundle", bundles holding 881
meshes only. With the cars out the shell was a STILL recording for the first time, so any piece whose values change (a traffic signal's
lens colour, a flickering glow) re-recorded all 4,400 pieces; ~2 a second never reaches the "5 in 2 s" that demotes a group, so it went on
forever. Before #1391 the cars had demoted the shell and this never showed. Lesson: making a group static exposes every slow changer in it.
- `_ewBunWalkTop` (walk rooms): each direct child's own value hash; a child that changed 3 times in 20 s goes `_ew_bunOut` for good
  (`_ew_bunOutV`), unless a quarter of the group (or > 400) would go at once (the hour changing = left to demotion). Only once `_hq.ready`.
- Traffic signals are `_ew_bunOut` from the build.
- A slow churn demotes too: 8 value re-records in 20 s. A demoted group is retried as static after 30 s, doubling to 8 min.
- Lens line "Re-recorded most: <group> (values, tree, rests) · changers moved out N". Cloud browser: 0 re-records/s after 4, 3 moved out,
  draws 540 → 147.

## THE MOVERS OUT + THE QUIET REPLAY + THE QUIET GROUPS (2026-11-14, Disaster City, after THE STILL WALK)

mondo's Mac after THE STILL WALK: 14.9 fps (was 7.3), matrix walk 4.25 ms, but "Draw calls 95" with "submit 52.8 ms" and
"check 7.60 ms/frame". The draw time was not draws.

- What it was: three's `_renderBundle` replays a recording in one GPU call but still loops over EVERY render object in it, each pass
  (picture, model mask, sun depth = 3.3 a frame), calling `_nodes.needsRefresh`; a material whose monitor says `hasNode` (the depth
  pass's materials, the game's dressed ones) answers FULL every time = updateBefore + geometry + nodes + ALL bindings per object.
  And the shell was not even a static recording: the 16 traffic cars are children of the shell group, their matrices move every
  frame, so `_ewBunTick` re-recorded it 5 times then DEMOTED it (st.dyn: three checks every object's values every pass).
- THE MOVERS OUT: `object._ew_bunOut === true` → the `_projectObject` wrapper hands it to the list the bundle group itself was handed
  to (`this._ew_bunBase`): classic draw, culled, current matrices; `_ewBunWalk` hashes only "it is out". Set on traffic cars at build
  (`_hqBuildTraffic`) and by THE STILL WALK on any direct child it finds moving (`_ew_bunOutA`, cleared when it rests 4 s).
  Off: `window.EW_BUN_NO_OUT`. Cloud browser: shell "outside its bundle" 5,988 draws → 34 (the cars).
- THE QUIET REPLAY (the `rb` wrapper in `_ewBunSetup`): for a STATIC group whose recording is current and has had one whole replay
  by three since it was made (`bd._ewLoopV`): plain objects = only the first per monitor (one per shader; three hands that one the
  shared camera/light buffers and answers NONE for the rest); `hasNode` objects = refreshed in full while their refresh writes a
  non-shared buffer, rested after 20 frames with no write (every 20th frame, by place); a rested one that writes wakes all rested
  ones of that recording the same frame. Skinned / morph / dynamic-instanced never rest. Measured: main pass asks 47 of 5,933 shell
  objects. Moving the camera / the sun does not write object buffers (three computes model-view in the shader), checked.
  Off: `window.EW_BUN_FULL_REFRESH`. Lens: "refreshed N of M a frame".
- THE QUIET GROUPS (`_ewBunTick`): a recorded group unchanged for 40 checks is hashed every third frame; every group on a frame with
  an `Object3D.add`, a freed resource, a missing pipeline or a lamp change. Off: `window.EW_BUN_CHECK_EVERY`.
- Sandbox lesson: at 0.5 fps a group never reaches "5 changes in 2 s", so it re-records every frame instead of demoting; the shell
  drew classic there for that reason (not the texture shrink). With the cars out the sandbox finally matches the Mac's shape.
- three r186 facts worth keeping: `RenderObject.getMonitor()` is the node builder state's observer (shared per shader);
  `createBindings()` reuses shared bind groups per builder state; `needsRefresh` returns SHARED once per render per monitor.

## THE STILL WALK (2026-11-14, Disaster City, after THE UNSEEN LAMP)

mondo: "Still really slow and laggy ... there have to be multiple huge performance saves that you are missing" (7.3 fps, CPU 129.5 ms of
which submit 69.3: ~60 ms a frame was NOT the draw).

- What it was: three's `scene.updateMatrixWorld()` (once a frame since THE ONE MATRIX WALK) composes + multiplies the matrix of EVERY
  object, drawn or not, moved or not. The city has 59,082 objects; ~300 move (people, 16 cars, doors). Cloud Chrome: 21-45 ms a walk.
- THE STILL CHUNKS (same day) did nothing for the walk: `matrixWorldAutoUpdate = false` on a group only skips that group's own
  multiply, three recurses into the children regardless (36,145 objects under off-camera chunks were still walked). Lesson: read
  three's method before trusting a flag.
- The fix (`_hqStillArm / _hqStillUpdate / _hqStillSceneWalk`, three-renderer.js before `_hqChunkRules`): in a chunked room the shell
  group and every chunk group (prop plots, rooms, fence plots) carry their own `updateMatrixWorld`, used ONLY inside `_hqFrame`'s one
  walk (`_hqStWalk`); any other caller gets three's walk. Off-camera chunk: nothing. Drawn group: per direct child a 10-number compare
  of position / quaternion / scale; changed = walked now and for 4 s after (HQ_STILL_HOLD_MS); a child that got an `add` under it
  (the Object3D.add hook, `_hqStillAdded`) = walked that frame; the rest in slices, all of it every 500 ms (HQ_STILL_SWEEP_MS), a child
  whose subtree checksum changed joins the movers (inner parts: wax, fans, sway pivots, bones). Group moved / chunk back on camera =
  whole group twice (seeds the movers).
- Known limit: an INNER part that starts moving with no add and no move of its placement starts up to 500 ms late the first time.
  A mover that must not: `_hqStillWake(obj)` (also `ThreeRenderer.hq.dev.stillWake`).
- `_hqBatchCheck` no longer force-walks the shell + prop groups every 500 ms in such a room (it was the whole city twice a second).
- `_hqChunkTick`: an out chunk is re-walked only when something joined THAT chunk (was: any add anywhere, e.g. a gun flash).
- Lens: new line `Matrix walk N ms/frame · still groups …`. Counts: `ThreeRenderer.hq.dev.still()`. Off: `window.EW_HQ_STILL_OFF`.

## THE UNSEEN LAMP + THE SCANS ON CHANGE (2026-11-14, Disaster City, his 7.3 FPS readout)
His Mac after THE LAMP'S REACH: CPU 129.5 ms (submit 69.3), shadow 776 of 1,056 draws / 3.22M tris, "0 re-records/s".
A CDP CPU profile of the city in the cloud browser (harness `/profile` endpoint, `scratchpad prof_an.js`: self time folded
onto the nearest game function) showed the 60 ms outside the draws was whole-scene walks (37,000 objects) on timers.
- **THE UNSEEN LAMP (`_hqHeroGate`).** The 776 shadow draws were the hero lamp's six cube sides drawing the nearby instance
  batches + merged batches classic (one batch spans a 42 m plot; the lamp reaches 3.5 m), every frame, with the lamp streets
  away. A point lamp whose reach sphere (x1.15) is off the camera has its map held; it redraws the frame the sphere is back.
  Off: `window.EW_HERO_SHADOW_UNSEEN = true`.
- **The scans, now on change** (`_ewAddCount`: every Object3D.add counted; zero adds a frame standing still in the city):
  the hero lamp's caster list (was a scene walk every 100 ms; now on an add, and every 2 s); a prop chunk's sphere
  (`Box3.setFromObject` of the chunk every 4 s; now on an add / count change, and every 60 s); the LOD list (`_hqLodScan`
  every 2 s; now on an add or a landed level `_lodLandN`, and every 30 s); CSS2DRenderer (three scene walks a frame; skipped
  while the scene holds no label, `window.EW_CSS2D_ALWAYS`); THE MEMORY BUDGET over its cap with nothing free to drop
  (`_mmLive` every 4 s; now waits 30 s); the pixel mask's timed scan 400 -> 1500 ms (adds still re-scan at once).
- Left, in order: the shell is ONE group of 10,000 pieces (matrix walk, bundle check 7 ms, every pass) -> chunk it like the
  props; the static batch's forced matrix walk every 500 ms; Firefox's cost per draw.

## THE HELD KEEP THE CAMERA (2026-11-15, mondo: "trees and other props are moving when i move my camera ... its in door hq too")
- **Cause**: THE COPIES REST (#1409) let instanced batches be HELD in the quiet replay (`rpReplay`). The frame's camera sits in
  SHARED uniform buffers (one per set of shared values a shader reads); three writes each when the first object reading it is
  refreshed in a render. The instanced shaders read a set of their own, so with every batch held nobody wrote it: instanced props
  were drawn with the camera of up to 20 frames ago (glued to the view on a turn, then snapping home). Game-wide (HQ, city, sites).
- **Fix**: `rpShared` — the first held object of each shared bind group gets its SHARED part refreshed in every render
  (`updateSharedForRender`); the rest stay held. Off: `window.EW_BUN_HELD_NO_SHARED`. Count: `_ewBun.rpShared`.
- **Proof** (cloud browser, WebGPU, main hall, camera turned 70 degrees, the FIRST drawn frame against the settled one):
  fix off 1.8-2.3% of pixels differ (lamps, boxes, chairs at their old screen places); fix on 0.1%.
  `/mnt/project-files/props-move-camera-20261115/`.
- **How to test a camera-stale bug**: `teleport` `face` is in DEGREES. Rest 30 drawn frames, then in ONE eval teleport and
  allow one drawn frame (harness `__ph.draw.mode='demand'; frames=2`), screenshot, draw 30 more, screenshot, diff. A test that
  lets undrawn ticks pass, or a 1 degree turn, shows nothing.
- **Rule**: anything that skips an object's refresh in a replayed bundle must still refresh the shared buffers it reads.

## THE CRASH TRAIL (2026-11-15, mondo: "Crashed inside the door main hall/lobby", Firefox M1 WebGPU, no error in the console)
Not reproduced, cause NOT found. What was ruled out by reading: the `[terrain] bridge ... headroom` lines in his log are the
survey worker warming every room's floor plan from the main menu (map.js `_hqSurveyWarmAround`, started by the arrival
warm); Disaster City's plan compiles in 12 s and is 13 MB, so it is not a memory spike. The 681 Urban Decay sheets
(PR #1426) are names for the editor's picker, loaded lazily. His log had no `[HQ] entered` line, so that console was
either from before the hall landed or from the load after the crash.
What shipped (index.html only, THE FREEZE TRAIL grown): a session records how it ended (`clean` on pagehide, `frozen`
when the picture stops 5 s+ while timers run), where it was (`ThreeRenderer.hq.room()`, the model memory, `gpuStatus()`),
and the `[HQ]` / `[MENU]` / lab sweep console.log lines. A session that did not end cleanly is printed at the top of the
next load's console as one `[CRASH TRAIL]` block (so his usual console paste carries it) and kept in localStorage
`ew_freeze_trail_hist` (last 3; ?ewdiag=1 lists them). Read the block first on any future crash / freeze report.

## THE HOLDERS (2026-11-15, the main hall crash, second pass)
His F3 in DOOR HQ: `MEM 1726/700 MB` in the Foyer, `2047/700 MB` in the Main Hall (Firefox M1 WebGPU): three times the budget
and climbing through the door, the best lead for the crash. THE MEMORY BUDGET can only drop what nothing drawn wears, and in the
walk it never drops unit models, so "over the budget with nothing free to drop" was silent. three-renderer.js `_mmReport`: once
per room, when over the budget with nothing to drop, one `[MEM]` console.warn block: the props / unit-model split, how much is
worn by something drawn, the built stage parts, the 14 biggest props and 10 biggest unit models (LIVE / idle).
`ThreeRenderer.hq.memTop()` gives the lines on demand. Read-only; nothing is dropped differently yet. NEXT: read his block, then
cut what holds the memory (candidates: unit models never dropped in the walk, too many stage parts built, the menu scene kept).

## THE UNDRAWN MAPS (2026-11-15, the main hall crash, third pass: MEM 2047/700 MB)
Measured off the CDN files (no browser): the Main Hall + the Foyer place 69 distinct prop keys; 45 are Meshy `_texture.glb`
files that each ship three 2048 x 2048 sheets (colour, normal, metal + roughness) = 64 MB a file by the readout's count
(the security camera: nine sheets, 193 MB). Sum about 2.86 GB counted, of which only the colour sheet (a third) is ever drawn:
`_hqPropMatPick` draws a prop as a Lambert on `sm.map` alone. The loader still decoded all three and the cache held them.
Fix: three-renderer.js `_hqPropDropPbr(sm)` runs once per file material right after its room material is made: normalMap,
roughnessMap, metalnessMap, aoMap are set null, disposed, and their ImageBitmap closed (unless a kept sheet reads the same
source); the file material becomes matte. `_mmStale` makes `_mmRead` count the cache again. `hq.mem().undrawn` = sheets let go.
Off: `window.EW_KEEP_PBR_MAPS = true`. NOT run in a browser (repo rule); whether this was THE crash is not proven, it is the
memory his readout showed. The readers of a file material's normalMap are creator hair / wings (unit cache) and the gem / key
picks (their own files), none of them a room prop. NEXT if the hall is still far over budget: the unit models (also three
sheets each, also drawn as Lambert), and stripping the two sheets in the .opt.glb bake so they are never downloaded.

## THE ROOM NEXT DOOR (2026-11-15, mondo: "the lighting isnt on at first and suddenly turns on as i walk through the door")
- Seen: from the Foyer the Main Hall was dark with hard lit strips; one step through the door it was fully lit.
- Cause: THE ROOM-BOX AO (`_hqAoHook` GLSL, `_ewNodeAo` node renderer). Its box is the room you STAND in (`_hqAoArm`,
  re-armed at every `_hqStageSwap`), but the shader runs on everything drawn. A point outside the box read as hard
  against both walls and the ceiling, so every joined room seen through a door was drawn at the clamp (0.3 of its
  colour), bar the strips in line with the box's own walls. The crossing swapped the box and the room "turned on".
  Not the lamps, the rig, the lamp budget, the key shadow, the look or the fog (all measured the same on both sides).
- Fix: outside the box (past 0.15 of the reach, about 8 cm) the walls and ceiling shade nothing; the floor contact
  term stays, as in a round room. No lights added, no memory touched. Applies to every box room on a stage.
- Left as is: a box room's own corner shade only shows while you stand in it (small, near its walls).
- Proof: /mnt/project-files/hall-light-pop/. Cloud repro: WebGPU harness, enter central_egress, wait for the foyer,
  teleport {deg:195,r:22.5}, first person at {x:0,z:-3.05}, lookAt(4,-20,0).

## THE WALK DROPS UNIT MODELS TOO (2026-11-15, the main hall crash, fourth pass)
His [MEM] block after THE UNDRAWN MAPS: `1212 of 700 MB` in central_egress (was 2047): props 257 files 934 MB (worn 535, idle
399), unit models 56 files 278 MB (worn 81). The menu already held 577 MB / 216 files before the building. The idle props go by
the existing budget once 120 s idle (the block printed at the first tick, before that); the unit models were never dropped in
the walk. `_mmTick` now lists `_unitGlbCache` too: not worn (geometry, material or colour sheet, `_mmWorn`), not named by a
live rig / parked rig / roster / `H.chars`, idle `cacheIdleMs` -> `_mmRigEvict`. Never: the animation libraries, anything under
`/characters/creator/`. Off: `window.EW_WALK_KEEP_UNITS`. The [MEM] line now says whether it is dropping. Not browser-run.
STILL OVER after this: the 535 MB that IS drawn is 2048 x 2048 colour sheets on small props (camera_01 = 65 MB for three
materials, each lava lamp part 21 MB). Getting under 700 needs smaller sheets on small props (a look decision, his) or a bigger
budget. Spell props (Spear.fbx 22 MB, Christmas.dae 21 MB, halloween.fbx, top_fangs) are `_ewOneFile`, held by the weapon cache.

## THE SMALL PROPS (2026-11-15, the main hall crash, fifth pass; mondo "sure")
After THE UNDRAWN MAPS the hall still drew 535 MB of 2048 x 2048 colour sheets on small props. three-renderer.js
`_hqSmallPropCap(url, root)` runs where a misc model lands (both landings): a DOOR_HQ.catalogue file whose largest placed
size (max over its catalogue rows and every room prop row's `h` / `span` / `size`, turned into the model's longest side by
its box) is up to 0.6 m gets its colour sheet drawn down to 512 px, up to 1.15 m to 1024 px (`_capModelTextures(root, cap,
['map', 'emissiveMap', 'alphaMap'])`, new `only` argument). Bigger, a pack `node` piece, a row with a free `scale`, or no
size: untouched. In the hall + foyer: 18 files to 512 (papers, mug, pen, stapler, folders, security camera, fan, nameplate,
box, speakers, CRT, picture b, exit sign, hook rail), 11 to 1024 (pictures a/c, wet floor sign, folding / teal / office chair,
mop bucket, boxes, coffee table, railing, plant, cabinet, long hook rail), desks and everything larger full (preview:
scratch caps.js off the CDN files). R2 files untouched. Off: `window.EW_NO_SMALL_PROP_CAP`. `hq.mem().smallCapped`.
Not browser-run. If he says a prop reads soft: raise its size class here, do not turn the cap off for all.

## THE CITY AT 5.5 GB: THE LEAVE SWEEP + THE NEAREST SHEET READ WITH DERIVATIVES (2026-11-15)
mondo: "crashed going into camelot from the woods clearing". The trail of the session before: Disaster City at `[MEM] 5716 of 700 MB`
(props 680 files 5412 MB, 4725 MB of it worn), WGSL errors `no definition in scope for identifier: nodeUniform1_sampler`, one
`execute_bundle` validation error naming `PointShadowDepthTexture`. Nothing here was run in a browser (RULE #1c).
- WHY 5.5 GB (measured in Node off the CDN files: `DOOR_HQ.rooms.site_prebuilt_downtown_streets.props` -> catalogue -> GLB image
  headers): 5411 prop rows, 505 keys, 431 files; about 240 Meshy files wear one 2048² colour sheet (21 MB counted each) = 5035 MB of
  colour sheets. THE SMALL PROPS (0.6 m / 1.15 m) only brought that to 3723 MB: the city's props are furniture-sized.
  `_hqSmallPropCap` 1024 class widened 1.15 m -> 2.5 m: 1819 MB (61 files at 512, 235 at 1024, 57 full: statues, machinery,
  couches, the conference table, palm trees, the boxing ring). A soft-looking prop = raise its class, never switch the cap off.
- WHY IT WAS NOT GIVEN BACK: `_mmTick` only runs while a room stands ready, waits 120 s idle and drops 6 files a 4 s sweep. Between
  rooms nothing dropped, so the city's files were held while the Woods loaded and both while Camelot loaded.
  · `_mmLeaveSweep()` at the end of `_hqLeave` (not on a hand-over to a battle, not on a dissolve): over the budget, every file
    nothing drawn wears goes at once, oldest first, down to 85 %. Under the budget nothing is touched. Off `window.EW_NO_LEAVE_SWEEP`.
  · `_mmTick` far over (sum > 1.5x budget): idle wait 15 s, 48 files a sweep, next look in 6 s.
  · `_mmListRigs(H, live, list)` = the unit-model rows, shared by both.
- THE SHADER ERROR: three 0.186.1 WGSL declares no `<name>_sampler` for a texture with min AND mag NearestFilter
  (`isUnfilterable`), but `generateTextureGrad` / `generateTextureBias` still write `textureSampleGrad(tex, <name>_sampler, ...)`.
  The ground materials read their sheets with `.grad(gx, gy)` (`_ewNodeTerrain`, the calm fluid), so a nearest ground sheet made a
  shader that did not compile (that ground did not draw). `_ewGpuNearestGrad(r)` (beside `_ewGpuSafeBindings`) patches the node
  builder's prototype once: an unfilterable sheet read with grad / bias goes through `generateTextureLod(..., '0')` (textureLoad,
  what a nearest sheet with no mips is anyway). Counter `gpuStatus().nearestGrad`. Off `window.EW_NO_NEAREST_GRAD_FIX`.
- THE BUNDLE ERROR, NOT FIXED: the trail cut the line at 240 chars ("Texture with 'PointShadowDepthTexture' lab"). Read: a render
  bundle replayed a bind group whose point-shadow depth texture had been freed (`destroyTexture` is hooked -> `_ew_bunFree`, but the
  group only re-records on the next tick, so a free after the tick replays once). Seen once at 445 s. index.html's trail now keeps
  900 chars of a GPU / shader error and the whole `[MEM]` block (3200), so the next trail says the reason.

## THE BUILD IN ONE GO (2026-11-15, the real cause of `nodeUniform1_sampler`)
mondo's next trail (build woodsretire-01, the grad fix live) still had the error, and with 900 chars kept the line reads
`nodeVar0 = textureSample( nodeUniform1, nodeUniform1_sampler, ( object.nodeUniform2 * vec3( uv, 1.0 ) ).xy )` on MeshPhong /
MeshLambert: a material's own `map`, a plain read. THE NEAREST SHEET READ WITH DERIVATIVES above was a wrong reading of a line
cut at 240 chars (its patch is harmless and stays).
- CAUSE (read in three 0.186.1, not run): `MaterialNode` keeps ONE texture node for `material.map` for all materials
  (`_propertyCache`), repointed by `ReferenceNode.updateValue()` at setup and on every drawn object. `NodeBuilder.buildAsync()`
  (used by compileAsync / the async pipeline path) awaits `yieldToMain()` after each shader stage, then `buildCode()` lists the
  bindings (`needsSampler = !isUnfilterable(node.value)`). A frame drawn in the gap repoints the node: text written for a smooth
  sheet, bindings listed for a Nearest one (or the reverse) = "no definition in scope for identifier <name>_sampler".
- FIX: `_ewGpuNearestGrad`'s builder hook also replaces the prototype's `buildAsync` with `build()` in one go (resolved promise).
  Counter `gpuStatus().syncBuilds`. Off `window.EW_ASYNC_NODE_BUILD`. Cost: a shader's build no longer yields mid-way.
- MEMORY, same trail (Camelot Keep 895 of 700 MB, 607 MB idle, "nothing idle long enough"): `_mmTick` over the budget at all waits
  30 s idle (was 120); `_mmLeaveSweep` goes down to 50 % of the budget (was 85 %), the next room loads on top of what is kept.
- NOT TOUCHED: `computeBoundingSphere(): Computed radius is NaN` entering site_prebuilt_camelot_kingdom (the Camelot plot build).

## THE NATURAL ROCK — cliffs and far mountains without the repeat (2026-11-15)
mondo on the Hollywood Hills pictures: "the sides/cliffs texture looks too repeated, it needs to look more natural". Seen on screen after
(playtest_city.js, the Hills' cove + canyon, the Mountains' lodge + scree).
- CAUSE: the rock sheet (`rocks_5` = calm_rock) is one even pattern of cracks at one size. A steep face already read it without a repeat (ntRead),
  but it was still a wall of same-size cells; rock PAINTED on a gentler slope (terrain.paint) was the plain sheet, a tile a square; the land past the
  edge (_hqBuildEdgeLand) repeated one small sheet up a whole range.
- three-renderer.js `_hqTerrainMat`: a natural cliff sheet (the calm table's `noTile` list) is mixed 42 % with itself read 3.4 x larger and its tone
  drifts over the land (`natDrift`, two noises of about 40 m and 8 m); a painted natural sheet is read with ntRead and takes the same drift
  (`palNt`, per palette sheet; a paved / urban sheet is untouched). The node renderer's twin reads `palNt` / `natC` off the terrain tag.
- `_hqBuildEdgeLand` matFor: the far land's sheets drift in tone; rock and sea cliff are also mixed with themselves read 3.7 x larger (WebGL only:
  an onBeforeCompile on the Lambert material; the node renderer keeps the plain sheet).
- Every terrain room gets it (not only the Hills). Cost: up to three more plain reads on a cliff pixel. Kill switch `window.EW_NO_NATURAL_ROCK`.

## THE SLOW PROBES: probe-fast.js + THE SEAT'S SHARE (2026-11-16, mondo: "the screenshots and probes run slow as fuck")
Measured in the cloud container on the Disaster City (729 files, 5,296 props, every file already in the probe's disk cache):
- The software GPU (SwiftShader) drew the room at 0.3-0.5 FPS (7,000-9,000 draw calls, 1-2 M triangles). Mesa llvmpipe: 0.8-2 FPS.
- `page.screenshot` took 20-45 s EACH: ~10 round trips to a page whose main thread sits inside a 2-3 s frame. With the game loop
  held for the capture: 0.2-2 s.
- The load never finished in 6 minutes. CPU profile of the page while loading: 74 % drawing the room UNDER the load card (the files
  land between frames: 4 of 719 after 70 s), 20 % `getImageData` (ui.js `_alphaScanSprite`, a GPU-backed 2D canvas read back through
  the busy software GPU; `--disable-accelerated-2d-canvas` ends it). With the drawing off, HALF of what was left was
  `_hqSeatTabletops`: `_hqSeatLater` ran the pass 120 ms after the first model that asked, so with files landing all the time it ran
  back to back for the whole load.
- Harnesses with no route of their own loaded the LIVE R2 scripts and played on the red CODE MISMATCH page.
The fixes: `probe-fast.js` (repo tooling; all 30 harnesses launch through it: llvmpipe on its own Xvfb, the held screenshot,
`roomReady` = the gate + a quiet network with the drawing off until ready, the checkout's scripts for cdn.entropywars.net) and, in
the game, THE SEAT'S SHARE: three-renderer.js `_hqSeatLater` waits 12x the last pass's own cost (120 ms .. 5 s; `_hqSeatCost`, reset
per room), so the pass stays under a tenth of the main thread on any machine and the last model still gets its pass. Players get
that part too (a big room's load is shorter on a slow CPU). After: the city's files in ~95 s, ready in ~170 s, three pictures by
~200 s. What is left is the room's real work on a CPU-only machine (GLB parse, texture upload, `_hqWarmRun`, the still-matrix walk).
Not done, ideas only: the game could skip drawing under an opaque load card for players too (needs the shader warm-up kept).


## THE HILLS IN THE CITY'S ROOM — the ground zones, the dead strip, the numbers (2026-11-16, second side)

mondo 11-16: "make Hollywood hills a part of disaster city ... the whole point is to be able to look over the city". The Hills are 36 rows of
squares north of the city's plots in `site_prebuilt_downtown_streets` now (areas-complexes.md "THE HOLLYWOOD HILLS ARE PART OF DISASTER CITY").
Three engine pieces came with it:
- **THE GROUND ZONES** (three-renderer.js `_hqGroundZones`, `_hqTerrainTiles`; data.js `HQ_GROUND_RULES.paintMax` 8 -> 16): `terrain.zones:
  [{ x0, z0, x1, z1, floor, cliff, path, pal, floorTint, cliffTint, pathTint, floorColor }]`. Inside the box the field wears the zone's own floor /
  cliff / path sheets and its own eight painted sheets. The shader still reads 8 painted sheets a material (11 samplers with the three role
  sheets); the room's palette may be 16 long, and a zone's tiles map a node's sheet to the zone's slot. The tiles are cut on the zone's line
  (a quad is its middle's zone). A zone's material is made by `_hqTerrainMat` from a copy of the room's info, so the node renderer gets it
  through the same `_ewNodeTag`. One more ground material + one more program a zone. `EW_HQ_NO_GROUND_ZONES` = off (the zone wears the room's sheets).
  This is also the way to a ground sheet per city district (the note "the palette is FULL at 8"): a zone a district.
- **THE DEAD STRIP** (`_hqDeadStrip`): where `edges.<side>.inset` starts the land past the edge on the room's old line, the field under that land
  is not put in the mesh (quads more than 2 m past the line). The city: the 70 m west strip (drawn, unseen, since Bayside's beach grew the room)
  and the new 126 m south strip. Heights, walker and edge land read the same ground. `EW_HQ_DRAW_DEAD_STRIP` = draw it again.
- **`edges.n.back`** without `land` (`_hqEdgeLandFn`): how much of the made-up range stands past a north side (the city 0.35, behind the Hills' crest).
- **THE NUMBERS** (cloud browser, Mesa llvmpipe, the same two views before and after: x 105 z -190 y 12.4, first person, looking north up the
  mountain road and looking south down it; frames drawn in 30 s; before = main 4e39efb + newer, after = this change):
  looking NORTH (the Hills now fill that view): 49 -> 33 frames; looking SOUTH (no Hills in view): 19 -> 17 (16 before the dead strip was cut).
  Meshes in the scene 43,109 -> 44,352 (+2.9 %); visible in the north view 12,346 -> 12,614 (+2.2 %). The field is 741 x 869 nodes (was 741 x 581),
  a third of it not meshed. The software GPU pays for triangles and pixels, his Mac for meshes fed to the GPU (see THE SPLIT STACK), so the north
  view's drop there is the real hillside's triangles (126 x 546 m at 0.875 m a node in place of a coarse far mesh); on his Mac expect the +2 %
  meshes. NOT measured on his machine: his F3 on the mountain road looking north is the number that counts.
- If his F3 says the Hills cost too much: (1) a coarser lattice for a zone (`zones[].res`, not built: the field is one lattice); (2) the 95 oaks +
  5 palms are single `tree` rows (the thicket's instanced trees were the old room's generator).

## THE JOINED GLOWS (2026-11-18, the 60 FPS thread, restarted; mondo's F3: 36 FPS, 2,126 replayed meshes, "shell rest 296 (1 groups)")

- The 216K "chars" triangles in that F3 are six bodies counted twice (scene pass + style mask), ~18K each: normal. No character
  model has a distance LOD (the 11-14 `.opt.glb` copies are smaller files, same triangles).
- What "shell rest" was (census in the cloud, WebGPU): 386 additive glow SPRITES (`_hzGlowSprite`: street lamp halos and the
  like), each on its own material, all on ONE glow picture, hung in the shell group itself = replayed wherever the camera looks.
- `_hqGlowOk` / `_hqGlowKey` / `_hqGlowMat` / `_hqGlowGeo` (three-renderer.js, beside THE LOOSE PIECES): in a big room's shell the
  static batch scans sprites too; glows that share picture + blend + square join into ONE mesh per 96 m square (hung in the
  square, culled with it): a quad per glow, centre / size / colour+opacity in the points (`ewGc`, `ewGs`, `ewGk`), drawn by
  three's SpriteNodeMaterial (positionNode = centre, scaleNode = size, colorNode = materialColor x ewGk), which faces each quad
  exactly as a sprite. Additive + no depth write = order-free, so the sum is the same. Never: breathing glows (`_hzGlowPulse`),
  `_ew_night` lamps, turned / off-centre sprites, changers out. A later change hands the square's glows back (the batch's own
  watch: material snapshot, visible, parent, matrix). WebGPU only. Off: `window.EW_HQ_NO_GLOW_BATCH` before the room.
  Lens: "glows, joined N" in the squares line.
- PROOF: cloud (WebGPU on SwiftShader, counts): 286 glows -> 41 meshes (29 in view at the spawn), "shell rest" 296 -> 10, worst
  place difference 0.0008 units. Picture: standalone three 0.186.1 page, 40 random glows vs the joined mesh, render-target
  readback: max 3/255 on 7 of 307,200 channels (summing order), the glows themselves change 59,357 pixels.
- Tried and dropped: instance cells at 128 m (in view 526 -> 588 meshes: more cells reach the view); signs stacked by rounding
  their canvas width up (far copies differ, up to 101/255 on letter edges). Signs of the SAME canvas size in one stack (exact)
  are written but not shipped yet (scratchpad diff), not counted in the cloud.
- Cloud harness: `EW_PROBE_GL=webgpu` in probe-fast.js (the flags that keep WebGPU alive headless; counts only, picture black;
  the device still gets lost after a while in the full city, so no compile proof there). The full city with real sheets is
  ~10 GB in the cloud renderer: shrink GLB bitmaps (createImageBitmap hook) or it is killed.
- WHAT IS LEFT by the cloud's squares line: cut-out signs ~420 + opaque sign canvases ~88, many looks ~140 (multi-material
  pieces: split per material, then they stack), instance cells ~520.

## THE TICK LENS LINES (2026-11-18, Disaster City 60 FPS thread)
mondo's Shift+F3 after the joined glows: 1,748 meshes but still 35.5 FPS; the frame is our JS now (CPU 24.2 of 28.2 ms). The
biggest line was "doors + residents + scene" at 4.3 ms. `_hqFrame` now marks each tick on its own lens line: walker (seam),
portals + gun doors, scene moves + drop + cut beside, rounds (walking people), residents, ladder, crowd near, awareness + marks,
grass field, scene door + key + cast. No change on screen. Read the code first: residents / crowd / awareness picks are already
throttled (300-400 ms), so the per-walker rounds tick and the scene moves are the likely cost; his next readout says which.

## THE NAV GRID (2026-11-18, Disaster City 60 FPS thread)
His Shift+F3 after the tick lens lines: "tick: rounds (walking people)" 1.9 ms, the biggest tick. Each walking townsperson asks
`_hqNavQuery` for the floor up to three times a frame, and `_hqBlockersUnder` read EVERY blocker in the city for each ask. Now the
people's own list (`_hqNavStatics`) gets a grid of 8 m cells (`_hqNavGrid`, rebuilt when that list changes); an ask reads its cell
plus the blockers seen moving (1,500 positions re-read a frame; a blocker that moved or grew leaves the grid for good), in the list's
own order, so the answer is the same. Node check on 5,000 random discs / turned rects / model boxes: 0 of 6,000 asks differ, 39x
faster. The officer's walk and the ladder keep the whole list. Off: `window.EW_HQ_NAV_GRID_OFF = true`.

## THE HIDDEN CELLS (2026-11-18, Disaster City 60 FPS thread)
"mask: setup + lights + sort 2.6 ms" on his F3 was not the mask: the instance pass's sync (`_hqInstSync`, the scene's
onBeforeRender) runs once a frame inside the FIRST render, and the model mask renders first. It read ~15,000 copies (the quiet
ones every 4th frame) although 351 of 414 instance cells were hidden (off the camera / past far). A batch whose cell is hidden
draws in no pass that frame (the sun's own chunks re-show only shell cells and door chunks), so its copies are skipped and the
batch syncs in full (`qN = 0`) the first frame its cell is shown; the sync runs before that frame's first draw. Off:
`window.EW_HQ_INST_SYNC_HIDDEN = true`.

## THE CHECK'S + THE WALK'S SPLIT (2026-11-18, Disaster City 60 FPS thread)
His F3 after THE NAV GRID + THE HIDDEN CELLS: 35.1 -> 42.6 FPS (frame 28.2 -> 23.6 ms; rounds 1.9 -> 0.4, "mask setup" 2.6 -> 1.0).
Left on top: bundle replays 3.9, bundle check 2.3, matrix walk 2.1. Two lens lines (lens open only) say where the last two go:
"Bundle check by group" (each group's walk in `_ewBunTick`, ms a frame + meshes) and "Matrix walk by group" (`_hqStillSceneWalk`
does the scene's step of three's walk itself and times each top child; keeps `_hqWalkHook`'s reader and `_css2dRender`'s mark).

## THE MOVERS STAY OUT (2026-11-18, spikes thread)
mondo's Shift+F3 in Disaster City (23.4 FPS, worst 99 ms; three minutes earlier at the same spot 42.6 FPS): "bundle check 15.2"
(was 2.3), "scene: projection walk 4.8" (was 0.7), and the shell re-recorded 96 times, 70 of them "movers" (a piece the still walk
saw move going out of the shell's recording, or coming back 4 s after it rests). Each start and each stop cost a shell re-record
(three projects all ~10,000 children that frame) and a full check of the shell (`_ew_bunDirty` wakes it out of THE QUIET GROUPS).
Now (`_hqStillUpdate`): a piece comes back into the recording once; if it moves again it stays drawn outside the recording for good
(`_ew_bunOutS`). Lens: "movers kept out N" at the end of "Re-recorded most". Off: `window.EW_BUN_OUT_RETURN_ALWAYS`.

## THE HIDDEN PEOPLE (2026-11-18, Disaster City 60 FPS thread)
His F3 with the split lines: "Matrix walk by group: hq_part 2.31 · hq_instances 0.75"; "Bundle check by group: downtown_streets
shell 1.22 (10)" (the shell's ~10,000 children walked for 10 meshes; it is quiet-skipped only once its re-records stop: THE MOVERS
STAY OUT, PR #2107, other thread). The room holds 122 rigs, 22 animating: three's walk composed every bone of every hidden body
(residents past the drawn count, the crowd past its cap, a scene's taken-out cast) each frame. `_hqCharGroupMW` (the walk room's
charGroup's own updateMatrixWorld, armed in `_hqStillSceneWalk`, walk frames only) leaves a hidden body as it stands and walks it in
full (force) the first frame it is shown, before that frame's draws (visibility is set in the ticks, before the walk). Lens: the
Matrix walk line ends "N hidden people left as they stand". Off: `window.EW_HQ_CHAR_MW_ALL = true`.
- 11-18 correction: his next F3 (42.8 FPS, worst 38 ms after the spikes thread's #2107/#2109) showed no "hidden people" tail: "skinned 92 / rigs animating 12" counts skinned MESHES (a body is several), not rigs, so there were few hidden bodies; THE HIDDEN PEOPLE stays (cheap, exact) but bought little. "Matrix walk by group" now splits two more levels below each plain top group (`hq_part/<part>/<group>`, "(still)" = a still-walk group) to find the 1.8 ms in hq_part.

## THE MERGED QUARTER (2026-11-18, Disaster City 60 FPS thread)
His F3 at 45.5 FPS: "Matrix walk by group: hq_part 1.70 · hq_part/Group (still) 1.00" = the city shell's still walk comparing
~10,000 children's poses every frame. A child THE STATIC BATCH holds (`_ew_bRec`) is not drawn itself and the batch's watchdog
(`_hqBatchCheck`, rolling over seconds) is what notices it moved, so `_hqStillUpdate` compares a merged child on one frame in four
(its turn by its place; never skipped when it is new at its place, fresh, woken, a mover, or in the sweep slice). A moved one becomes
a mover and is walked every frame as before. Off: `window.EW_HQ_STILL_MERGED_EVERY = true`. The shell's bundle check (1.05 ms) is
the other ~10,000-child loop; it rests only when the shell stops re-recording ("merge 17" left).

## THE SLOW FRAMES + THE NEAR LIST (2026-11-18, spikes thread)
His 07:06 F3 during drops (26 FPS, worst 102 ms) had a new top line "tick: walker 7.2" (0.1 in steady play), "Static batch ... watch",
400 draws held. The lens averages could not say which frames.
- Lens "Slow frames": every gap of 50 ms+ between two frames, with the previous frame's JS and its three costliest parts / inner steps
  (last 6). A gap with little JS = the browser (GC, GPU, compositor).
- Lens "Inside the ticks": `_lensSub(k, t)` = a tick's own steps (kept out of the parts sum); `_hqTickWalker` marks stuck watch,
  modes, portal sweep, step (floor + blockers), carry, jump + landing, turn + place, swim check, climb check (prefixed "walker:").
- `_hqStuckFree` (THE WAY OUT OF A COLLIDER) asked the floor up to 2,560 times over EVERY blocker of the room (the officer's walk keeps
  the whole list): now the search swaps in the blockers within its 8.6 m reach. Off: `window.EW_HQ_STUCK_FULL_LIST`.

## THE SPIKES, ROUND 4 (2026-11-18, spikes thread; from the "Slow frames" lens line)
His 07:18 / 07:19 F3s named the slow frames: "tick: ladder 12.3" every frame (10.9 FPS), "tick: awareness + marks" 25 ms frames,
"tick: memory budget" 91 / 36 ms, "tick: prop chunk sweep" 96 ms (and "mask: setup" 73, "bundle check" 81: the 60 FPS thread's code).
- THE LADDER ON THE NAV GRID: `_hqLadderQuery` (a running / chasing / homing body's floor asks) uses `_hqNavStatics()` (THE NAV GRID's
  8 m cells) in place of its own people-less copy read whole. Off `EW_HQ_LADDER_OWN_LIST`.
- THE NEAR LINE: `_hqLosClear` reads only the blockers within half the line's length of its middle (once a line, not once a 35 cm
  sample). Off `EW_HQ_LOS_FULL_LIST`.
- THE SWEEP'S SHARE: `_hqPropChunkSweep` moves props into chunks 3 ms a frame at most, the rest next frame. Off `EW_HQ_PC_SWEEP_ALL`.
- THE DROPS SPREAD: `_mmTick` queues its drops, two a frame (`_mmDrain`; a file used again since the pick is kept); the worn walks stop
  at a file's first worn piece (`_mmWears`). Lens "Inside the ticks" gains memory: read / worn list / props list / unit models list /
  pick / drops. Off `EW_MM_DROP_ALL_AT_ONCE`.

## THE RIG GROWN AT THE DOOR (2026-11-18, Disaster City 60 FPS thread)
The spikes thread's "Slow frames" line (his 07:18/07:19 F3s) showed frames with "bundle check 81 ms" / "scene: bundle replays 32 ms"
and "mask: setup + lights + sort 73 ms"; the lens said "one rig: 2 grows". A point-rig grow (`_ewRigTick`, steps of 4 when a 9th /
13th / ... lamp is in view) is a new light list: every shader of the scene again and `_ewBun.epoch++`, so every recorded group is
walked and re-recorded that frame. In a big chunked room (`_hqChunkBig`) the walk scene's point rig now takes HQ_RIG_PREGROW_P = 20
slots on its first frame, behind the card; the spare slots stay dark (intensity 0; THE LAMP'S REACH skips them). The rig is one,
shared, and never shrinks (as before). Off: `window.EW_RIG_NO_PREGROW = true`.
- (2026-11-18 later) "Slow frames" entries also say how many bundle groups that frame re-recorded and "epoch moved" (a freed
  resource / a rig grow re-records every group); "Inside the ticks" gains camera: boom march / feel. His 07:34 F3: the ladder,
  awareness, memory and sweep spikes are gone; left: bundle replays 26-82 ms and check 58 ms frames (60 FPS thread), one
  "tick: camera 69 ms" frame (no lazy work found in the camera; likely a GC landing there: the new split will say).

## THE BUNDLE SPIKES (2026-11-18, Disaster City 60 FPS thread)
His 07:34 F3 "Slow frames": "scene: bundle replays 82 / 36 / 26 ms", "bundle check 58 ms". A replay spike is three RECORDING groups
(a re-record draws every mesh of the group into a new bundle). Lens line "Bundle spikes (last 6)": each `_ewBunTick` that took
6 ms+ or re-recorded 300+ meshes, with groups walked, groups re-recorded (+ meshes), the causes (tree / values / lamps / frees /
lod / cold / rests), LAMPS MOVED, and the three biggest re-recorded groups. Lens open only.

## THE ONE WORN WALK (2026-11-18, spikes thread)
His 07:44 F3 "Slow frames": "tick: memory budget 44 ms" = "memory: worn list 21" (`_mmLive`: the whole scene walked, 18,000 geometry
uuid strings written into an object) + "memory: unit models list 21" (`_mmListRigs` -> `_mmWorn`: the whole scene walked AGAIN for the
materials). Now `_mmLive` returns a Set of geometries and, from the same walk, `live.worn` (a Set of materials + colour sheets) that
`_mmListRigs` reads; `_mmWorn` stays as the fallback. Same answers.
## THE CULLED CHUNKS COUNT (2026-11-18, Disaster City 60 FPS thread)
His 07:44 F3 "Slow frames": "tick: instance pass 42 / 50 / 43 ms" (three of six). `_hqInstTick` rescans every rescanMs and runs the whole
`_hqInstAdd` (a forced `scene.updateMatrixWorld(true)` of ~45,000 objects, a second scan, the build) when the scan's count differs
from the copies it left alone. The scan was `traverseVisible`, and a prop chunk the camera culls reads hidden (`_ew_ckOut`), so the
count moved every time a chunk went out or came back and the pass re-ran for nothing. `_hqInstScan` now walks a culled chunk as if
shown (hidden pieces are still skipped), so the count moves only when a file lands or a copy is handed back. The "Bundle spikes"
line in the same F3 showed six 6 ms checks with 0 re-records: the bundle side is quiet. Off: `window.EW_HQ_INST_SCAN_VISIBLE = true`.
- 11-18 11:51 CORRECTION (his F3): THE CULLED CHUNKS COUNT made it worse: "tick: instance pass 61 ms" x3 and "2335 left alone" (was ~270): walking culled chunks counted every closed room's and far plot's pieces, mostly singletons, and the count still moved. Reverted to `traverseVisible`. In its place THE LEFT ALONE, BY NAME: `_hqInstAdd` keeps the pieces it left alone in `I.leftSet`; `_hqInstTick` re-runs the pass only when a candidate in view is in neither the set nor a batch (a file landed, a copy came home, a chunk seen for the first time), never because the camera culled or showed a chunk. Off: `window.EW_HQ_INST_RESCAN_COUNT = true` (the old count compare).

## THE RIDER'S GRID (2026-11-18, spikes thread)
His 11:51 F3: "walker: ride" 6-8 ms on every slow frame (on the board: `_hqTickRide` steps at 120 Hz and each step asks the floor several
times, each ask reading every blocker of the city). While `_hqTickWalker` runs (`_hqWalkGridOn`; the body is `_hqTickWalkerIn`) the
officer's own asks read THE NAV GRID over the whole blocker list, in its own slot (`_hqNavGrid(L, 'wgrid')`): same answers (the people in
the list are seen moving and read every ask; a list that grows or is replaced is laid again). Off `EW_HQ_WALK_GRID_OFF`. The lens's
"Inside the ticks" gains the static batch's steps (batch: check / stack prep / scan step / build step) for its 17-30 ms frames.

## THE FRONT DESK + THE SCAN ALARM (2026-11-18, Disaster City 60 FPS thread)
mondo 11-18: "how does this same bug of counting every single object in the room keep happening ... Can we go through
everything that does that and make sure it doesnt". The audit (every function reached from `_hqFrame` and `renderFrame`, two
calls deep, that walks the scene or loops a room-sized list) found four still polling the whole room:
- the shadow tick's flags (`_hqShadowTick`): prop + door + people groups walked every 30 frames;
- the hero lamp's caster list (`_hqHeroGate`): the WHOLE scene on any add anywhere (up to 10x a second) and every 2 s;
- the instance pass's fresh check (`_hqInstTick`): shell + prop + door groups with a string key per object, every 2 s;
- the airborne landing (`_hqBlockerFloor`): every blocker of the room each frame of a jump/fall (walker: spikes thread).
Also slow-polled, left for now: chunk spheres of non-prop chunks every 2 s (`_hqChunkTick`, spikes thread), LOD scan safety
read every 30 s (`_hqLodScan`), CSS2D label count every 60 s.

THE FRONT DESK (`_ewDeskQueue()` / `_ewDeskTake(Q)` / `_ewDeskUnder(o, root)`, beside `_ewAddCount`): the Object3D.add hook
also pushes each added object into every open queue. A reader takes `{ list, over }`: the roots that joined since its last
read (walk only those), or `over` = read the room once (new queue, more than 4,096 arrivals, or the queue was closed after
10 s unread). The shadow flags and the hero list now read arrivals only (hero list: whole scene every 20 s to drop what left,
`HERO_LIST_FULL_MS`). The instance pass stamps each top piece of its groups with the pass number once read; only an unread
piece, one an arrival joined, or one shown for the first time is read again (`_hqInstFresh`). Off: `window.EW_DESK_OFF` (desk
reads always full), `window.EW_HQ_INST_FULL_SCAN` (old fresh check).

THE SCAN ALARM: while F3 is open, `Object3D.prototype.traverse/traverseVisible` are wrapped (`_scanHook`); a walk of 500+
objects is charged to the first two named functions of its stack. Lens line "Scene walks (objects read a second · walks a
second · biggest)", top 8, `!!` = 20K+ a second. Rule: CLAUDE.md RULE #1e.

### THE LANDING ON THE GRID + THE CHUNKS MEASURE ON CHANGE (2026-11-18, spikes thread, from the 60 FPS thread's whole-room-scan audit)
- `_hqBlockerFloor` (the landing under a jump, a fall, a ride's landing) read every blocker of the city on each airborne frame. During
  the walker's / rider's own tick (`_hqWalkGridOn`) it now reads THE RIDER'S GRID (`_hqNavGrid(L,'wgrid')` + `_hqNavGridAt`): the grid
  pad (HQ_BODY_R + 0.1) holds HQ_BLK_STAND_PAD, and the highest top does not depend on order. Off: `EW_HQ_FLOOR_FULL_LIST` (or `EW_HQ_WALK_GRID_OFF`).
- `_hqChunkTick`: the non-prop chunks (fence, shell, door, instance cells, signals) re-measured their sphere every 2 s, all on the same
  frame (a door chunk's measure is a walk of the door). They now follow the prop chunks' rule: own count changed, add count changed
  (at most every 4 s), `g._ew_ckDirty` (set by `_hqInstFit` on its instance cell when a batch refits) or every 60 s. Door swings stay
  inside the 15 m chunk pad. Off: `EW_HQ_CHUNK_POLL_2S`.

### THE ONE BODY A FRAME + THE SLICED SCAN + THE MEASURES SPREAD (2026-11-18, spikes thread, his 12:18 F3)
Slow frames: "tick: residents 48-50", "tick: chunks 23", "batch: scan step 24".
- `_hqTickResidents`: the 0.4 s pick stood up EVERY newly wanted resident in the same frame (a whole character each). It now marks them
  `s.spawnDue` and stands ONE a frame, nearest first. Lens sub-marks "residents: new day / pick / new body / walk". Off: `EW_HQ_RES_SPAWN_ALL`.
- `_hqBatchScan`: `root.updateMatrixWorld(true)` + the recursive key-reading walk of the whole group ran in one step before the first
  yield. Now an explicit stack that yields with the slice (a Set stops a piece being taken twice) and each found piece
  `updateWorldMatrix(true,false)`. Off: `EW_HQ_BATCH_SCAN_WHOLE`.
- `_hqChunkTick`: the optional re-measures (add count, dirty, 60 s) stop at 2 ms a frame and finish on later frames; a count change or
  first measure is immediate. Off: `EW_HQ_CHUNK_MEASURE_ALL`.
- THE LIST'S OWN STAMP: the rider's grid now hangs on its own list (`L._ewWG`, so the stuck watch's near list and the people's list do not
  make it lay again as lists take turns), `_hqBlkListStamp` counts reorders of `_hq.blockers` (splice/shift/sort...: lay again) and joins
  at the end are read on every ask (a resident's body joining no longer shifts or rebuilds the grid).

### THE ONE-BY-ONE PASS + THE DESK FOR LOD AND LABELS (2026-11-18, his first F3 with the alarm)
The "Scene walks" line on his 12:18 F3 named: `_hqInstAdd` (47K a read: the pass re-ran in full every few seconds, "tick:
instance pass 36-37 ms", because each prop chunk shown for the first time had candidates the pass never saw), `_hqLodScan`
(74K every 2 s: any add anywhere re-read the room), `_css2dRender` (77K every second: same), `_lensCensus` (the lens itself).
- `_hqInstAdd(H, I, only)`: a run for fresh candidates reads only them + the left-alone set (no room-wide flags, no
  `scene.updateMatrixWorld(true)`, no scan; the new batches fill at the next sync). `_hqInstFresh` returns the fresh list; its
  stamps reset only when the desk overflowed (`I.seenN`). Full read: first run, `EW_HQ_INST_FULL_SCAN`.
- `_hqLodTick`: arrivals' meshes join `L.list`; full read when a LOD level landed (`_lodLandN`), the desk overflowed, every 60 s.
- `_css2dRender`: arrivals looked through for a label; recount when one arrived / overflow / every 60 s.
- Alarm names now parse Firefox's `ThreeRenderer</fn/<` frames; the lens's own census is marked "(the F3 lens itself)".

### THE RARE READ (2026-11-18, spikes thread, his 12:30 F3)
The "Scene walks" alarm named `_mmLive` (77K objects every 2-4 s): over the budget, `_mmTick` read the whole scene every 4 s to drop 6
files. After a sweep that found files the next read waits 20 s (8 s when 1.5x over) and takes up to 24 (48 far over); the drops still go
two a frame. Off: `EW_MM_READ_EVERY_4S`. Same F3: two 176-179 ms frames with only 19-20 ms of JS (the browser, not our code: KTX2 uploads /
pipelines while new models loaded, or GC); the instance pass 39-43 ms frames went to the 60 FPS thread.

### NO WARM IN PLAY ON FIREFOX (2026-11-19, spikes thread, his 12:16 F3)
His Disaster City F3: 10.6 FPS, frames 94 ms, slow frames 136-283 ms, each with only 18-24 ms of JS; the shader cache line "warmed 661
(67 to go)". Firefox builds a WebGPU pipeline in its GPU process in line with the frame submits, so even createRenderPipelineAsync holds the
frame (his 11-18 12:30 F3 already had 176 ms frames with 20 ms of JS beside "35 pipelines made off the frame"). `_ewScTick`'s warm made those
pipelines one after another during play. On Firefox (`_ewScGeckoHold`) the warm now runs only in the menu and while the walk's card is up
(`!_hq.ready`); in play a look builds when it first shows (THE LATE LOOK). Off: `EW_SC_WARM_IN_PLAY`.

### THE SLICED WORN WALK (2026-11-19, spikes thread, his 12:31 F3: 40.8 FPS steady after NO WARM IN PLAY)
- His slow frames still had "tick: memory budget 20, > memory: worn list 19" (the 20 s whole read). `_mmLiveSliced` walks the same roots
  2 ms a frame (a stack), then reads THE FRONT DESK's arrivals since the walk began (their whole subtrees) into the live/worn sets, so a
  file that came into use mid-walk still counts as worn; an overflowed desk = one whole `_mmLive` as before. `_mmTick` re-enters each
  frame until the walk is done. Off: `EW_MM_WALK_WHOLE`.
- A 70 ms "tick: static batch" frame named no inner step: new sub-marks "batch: sheet stack watch" (`_hqStackWatch`, which refills every
  sheet of a stack whose GPU texture was re-made) and "batch: hold check". Next F3 says which.
- Same F3, the 60 FPS thread's: bundle check 62/99 ms frames, sun shadow classic draws 68, scene classic draws 25; and 557-1000 ms gaps
  with 21-74 ms of JS (the browser).

### THE FIRST DRAWS ON THE SLOW FRAMES (2026-11-19)
His 11-19 F3 (40.8 FPS steady after the spikes thread's #2151) still had "sun shadow: classic draws 68 ms", "bundle check
62 / 99 ms" and 0.5-1 s gaps with 20-74 ms of JS. The suspected cause is Firefox building a GPU pipeline in its GPU process,
in line with the submit, the first time a look is drawn (new in a pass: the sun's depth pass, or a bundle re-record). The
"Slow frames" entries now say how many shader builds (`_ewKeep.builds`) and new pipelines (`_ewKeep.pipes`, every
createRenderPipeline) the frame made. "Bundle spikes" keeps only ticks of 12 ms or more (was 6 ms: the steady 6 ms ticks
pushed the big ones off the list).

### THE DESK SCAN + THE BAKES KEPT SIDE BY SIDE (2026-11-19, spikes thread, his 12:52 F3 via the 60 FPS thread)
- "batch: scan step 2.06 ms" every frame, the props' merge always in 'scan': since THE SLICED SCAN a rescan of the whole group took many
  frames and any add anywhere began the next one. A live merge's rescan now reads only THE FRONT DESK's arrivals under its group (`B.dq`;
  each arrival's chain read upward for visibility + `_HQ_BATCH_FLAG_OFF` flags); a whole walk on the first scan, an overflowed desk, and
  every `HQ_BATCH.rescanIdleMs` (30 s, `B.fullAt`). Off: `EW_HQ_BATCH_SCAN_WHOLE` (whole walks) / `EW_HQ_BATCH_RESCAN_ALWAYS`.
- "residents: new body 48 ms" with one body a frame: `_animLibBakeForModel0` kept ONE bake per model keyed by its slot count; a city
  resident's def has one more slot (`hqSleep`) than a native of the same race, so alternating bodies re-baked every clip. Bakes now stay
  by key (`modelEntry._libBakedMap`) and are handed back at once. Off: `EW_LIB_BAKE_ONE`. (If a body still costs 40 ms+, the next step is
  a body pool by model.)

## THE MEMORY PROFILE + THE GARBAGE CUT (2026-11-19, 60 FPS thread)
mondo OK'd a cloud memory profile of Disaster City (CDP HeapProfiler sampling, 90 s walking after a 30 s warm, WebGL backend in the
cloud). About 5 MB a second was thrown away; most of it is three.js's own per-draw work on the WebGL path (not his WebGPU path).
The game's own share, biggest first: `_hqNavGridAt` (a new answer array per walker ask, ~15 MB/90 s), `_hqStillSum` (number boxing
in the recursive checksum, 12.5 MB), `_hqSeaRules` (a fresh merged object per boat per frame via `_hqFindTarget`, 11 MB),
`_hqCharCullSetup` (once per body: the skinned bounding box), `_hqRoutePose` (traffic, 5 MB), `_hqBatchMatSnap` / residents /
`_hqNavPath` / `_mmVisit` / `_hqChunkTick` (spikes thread's areas, passed on). Cut here: `_hqSeaRules` caches its merge per rules
pair; `_hqNavGridAt` refills one array per grid (`G.out`, every caller reads it at once and keeps nothing; comparator hoisted to
`_hqNumUp`). Finding: the garbage rate is modest, so GC is a small part of the drops at best; minor collections, not big pauses.
- THE ONE-STAMP LIST (11-19, his 13:36 F3: 32.5 FPS, bundle check 2.2 ms/frame, check spikes 80 + 29 ms with 0 re-recorded): `_ewBunTargets`
  de-duplicated its ~722 groups with `out.indexOf` every frame (~260,000 compares); now a per-call stamp `_ew_bunTS` and one kept array
  (`_ewBun.tOut`). The F3 "Bundle spikes" entry now also says the time before the groups and the slowest group's walk (name, ms,
  pieces), so the next 80 ms spike names its cause.

### THE SLOWER WATCHDOG (2026-11-19, spikes thread, his 13:36 F3: 32.5 FPS, no slow frame in this thread's code)
"batch: check 1.35 ms" every frame: the merged pieces' check (~16,000 pieces, 0.35 ms a frame per merge, a round ~3 s) restarted 0.5 s
after each round. In a chunked room (`_hqChunkBig`, the current room) the next round now starts 4 s after the last (`ckGap`). Off:
`EW_HQ_BATCH_CHECK_FAST`. Same F3: #2156 holds (no re-bakes, 0 builds/s); bundle check/replay spikes 29-80 ms are the 60 FPS thread's.

## THE PIECE CAP (2026-11-19, spikes thread)
mondo's Firefox F3 at 13:42 still showed "batch: check 1.25 ms" every frame after PR #2158's 4 s gap. Firefox's `performance.now()` steps
coarsely (whole ms outside cross-origin isolation), so the rolling watchdog's "stop after HQ_BATCH.rollMs (0.35 ms)" ran until the next clock
tick: up to ~1 ms a batch, two batches a frame, and a round over 15,800 merged pieces never finished inside the gap. `_hqBatchCheck` now
also stops a slice after `HQ_BATCH.rollN` (160) pieces. A city round = ~65 frames, then the 4 s gap. Off: `window.EW_HQ_BATCH_CHECK_NOCAP`.
Any other "stop after N ms" slice is subject to the same coarse clock on Firefox: give it a count cap too.

### THE HELD PIECES ONCE (2026-11-19, 60 FPS thread, his 13:44 F3: 40.1 FPS after a walk, "downtown_streets shell 1.59 ms" bundle check)
The shell's ~10,000 children are nearly all held by the static batch, and every bundle check read each of them. `_ewBunWalkTop` now keeps,
for a group over 1,000 children, a book (`g._ew_bunF`): the held pieces' hash once (`hh`, count `hc`) and the rest (`live`) walked each
check. The book is laid again when the child count, `_hqBatchHoldN` (bumped where the batch takes / hands back a piece) or an add under the
group changes, and every 240 checks. Off: `window.EW_BUN_HELD_EVERY`. Same F3: one slow frame left (rig ticks 11 ms), 0 builds/s.


- THE FREES SPREAD (11-19, same F3: one slow frame, "render: node + rig ticks 11 ms"): that tick also destroyed every GPU buffer three
  forgot the frame before (`_ewGpuFreeLater`), hundreds at once when a chunk or room lets go. Now at most `EW_FREE_PER_FRAME` (48) a
  frame, the rest kept for later frames (a count, not a time: Firefox's whole-ms clock). The lens shows it as its own row
  "render: gpu frees". All at once: `window.EW_FREE_ALL_AT_ONCE`.

### THE DIP LOG (2026-11-19, 60 FPS thread; mondo: "do i have to shift f3 the exact moment it happens ... no where near stable yet")
Always on in the walk, lens open or not (`_dipBegin` / `_dipEnd` at `_hqFrameGuarded`'s edges). The walk's named parts are timed every
frame through the lens's own spans (`_dip.cur` stands in for the lens frame; `_lensIn` / `_lensMark` / `_lensSub` and the tick gates read
`_lensOn()`), without the lens's draw counting or census. A frame gap of 50 ms+ or a second under 30 FPS opens or extends a dip (closed
1.5 s after its last slow frame; a room's first 3 s are the load and skipped). Each dip keeps: time, length, lowest FPS, worst gap, slow
frames + their JS, where the officer stood (squares, start → end), its top 4 parts summed, and what happened in it (bundle re-records,
epoch moves, shader builds, new pipelines, GPU buffers freed, objects added, models loaded). Shift+F3 prints the last 12 of the session
as "Dips this session" (40 kept). Off: `window.EW_DIP_OFF`. Stability (the dips), not the average, is the goal from here.

### THE ZSEP — FACES SHARING A PLANE (2026-11-19, mondo: "z fighting ... textures flickering ... mostly on the sides/walls of buildings, some on the ground")
Cause: two surfaces drawn in the SAME plane (the depth test cannot choose, they trade pixels each frame). Not depth precision (near 4 units,
the separations were exactly 0). A detector sweep of Disaster City (121 squares of 62 m, every visible shell triangle, same-facing coplanar
overlaps) found 316 groups / ~8,500 m²: a storey's ceiling on the roof slab's underside, wall on wall, floor on floor, window sheet on its wall
(the Civic colonnade at x 133 z -19 = his screenshot: the brown base band over the window wall), a road on a roof. Nearly all from the
plot-built buildings (data.js arch rows + plot shells), so every plot-built area had them.
Fix: three-renderer.js `_hqZSep` (HQ_ZSEP), called once from `_hqBatchBuild` on the shell's pieces right before they merge (a build-time
pass, sliced with `_hqSliceDue`; nothing per frame). Faces = vertices joined by triangles; pairs = same quantized normal, same plane within
3 mm, overlap > 0.01 m². Per stack, biggest face stays, each smaller one is lifted 1.2 cm per layer toward its own front (max 4). The
terrain / bent sheets never move; polygon-offset decals are left out. A lifted piece's geometry is copied first (it may be shared).
City: 5,666 pairs, 4,732 faces lifted on 979 pieces, ~4.3 s sliced on the cloud's software renderer. Sweep after: 8 groups / 16 m² left
(props' instances, a few tilted pieces). Off: `window.EW_HQ_NO_ZSEP = true` before the room. The detector (scratch, not in the repo) is the
recipe: walk `dev.hqScene()` skipping `_ew_bRec`-merged originals' copies (`_ew_hqBatch`) and hidden instance sources.
The Bayside sea-wall ground in his second picture showed no overlapping surfaces in a sweep with decals and cut-outs included; if it still
flickers, suspect shadow acne at a low sun (HQ_LIGHT_RULES.shadows.normalBias 2.4 vs a ~3-6 cm shadow texel).

## THE NEW BODY SPLIT (2026-11-19, spikes thread)
mondo's 14:53 F3 had one 116 ms frame with "residents: new body 51 ms" (one body a frame since PR #2137, bakes kept per key since #2156),
and the lens could not say which step. Three lens sub-marks now name it: "new body: game unit" (createUnit), "new body: model + rig"
(`_attachUnitModel` in `_hqSpawnCharacter`), "new body: clip bake (first of a model)" (`_libBakeClips` in `_animLibBakeForModel0`).
They cost nothing with the lens shut. Next step decided by the readout: a big clip bake = slice the first bake of a model over frames;
a big model + rig = a parked-body pool per model in `_hqResDispose` / `_hqResSpawn`.
- THE DIP LOG FIX + FINER SPLITS (11-19, his 15:24 readout: every dip read "999 FPS · 0 ms"): a comment on the load-card line swallowed the worst-gap and lowest-FPS updates; fixed. Bundle spikes over 5 ms "before the groups" now print [start, targets (n), releases (n), lamps + rest]; the instance pass tick has inner rows "instance: fresh look", "instance: add N fresh", "instance: sync".
- THE LAMPS IN THEIR CHUNK (11-19): on the node renderer with the light rig, a prop whose only lights are plain point lights (rig kind `p`) now goes into its prop chunk (was: every lit prop stayed in the prop group, drawn classic). Shadow / spot lights and the classic path keep the old rule; `window.EW_HQ_PC_LAMPS_OUT` = old rule everywhere.
- THE DIP LOG MARKS THE LOAD (11-19, his 15:14 readout: a 32 s dip at 1 FPS = the city load): a dip whose frames ran under the load card (`!H.ready`) prints "LOADING (n of m frames under the load card)".
- THE LIGHTS AT THE DESK + THE BODY'S OWN BOUNDS (11-19, his first dip log, 14:53): the dips after the load were 0.1-2 s at 21-43 FPS.
  (1) "render: node + rig ticks 7-8 ms" in 4 of 6 slow frames = `_ewRigRead` re-reading the whole scene (45K objects, own recursion, so
  the scan alarm missed it) on ANY add anywhere and every second. Now arrivals from the front desk (a light, or the lights under an
  arrival); whole read on first frame / desk over / lent child list / 20 s. Old rule: `window.EW_RIG_LIST_EVERY_ADD`. (2) A new body's
  frame ("mask: projection walk 22" + "tick: characters 11"): three culls a SkinnedMesh by its own sphere, computed once by posing every
  vertex; `_hqCharCullSetup`'s `setFromObject` did the same for the box. The mesh now takes the geometry's padded rest sphere + rest box.
  Exact: `window.EW_HQ_SKIN_BOUNDS_EXACT`. Lesson: the scan alarm only sees `traverse`; hand-written recursions over the scene hide from it.

## THE WAITING PROPS (2026-11-19, spikes thread)
mondo's 15:14 F3, ~47 s after entering the city: ~160 props still drawn "outside its bundle" (18 when settled). `_hqPropChunkSweep`
re-measured every prop whose file had not landed (empty box) first on every sweep, in placement order; with hundreds waiting, the 3 ms
share ran out before a landed prop was reached and "the rest next frame" restarted from the top. Now a waiting prop is skipped for 0.5 s
after its last try (`p._ew_pcTry`), the share goes to landed props, and while any wait (`H._pcWait`) the sweep runs every 0.5 s, not 1.5 s.
Off: `window.EW_HQ_PC_RETRY_ALL`.

### THE WAKE KEEPS THE REST (2026-11-19, 60 FPS thread, his 16:11 F3: 29.7 FPS, "scene: bundle replays 5.3", "refreshed 1157 of 3948 a frame")
THE QUIET REPLAY wakes a recorded group when one of its rested objects writes something on its turn (every REST = 20th frame): every
held object of the group is refreshed that frame. Each was also set back to "awake" (`_ew_rq = 0`), so the whole group (a square holds
50-80 pieces) was refreshed IN FULL every frame for the next 20 frames, though nearly none of them wrote anything. One object writing
once a second kept its square hot most of the time. Now the woken ones are still all refreshed that frame (a shared change still reaches
every one), and only one that writes something on that refresh stays awake. Old rule: `window.EW_BUN_WAKE_ALL`.
The lens's bundles line now splits "refreshed N of M a frame" into awake (refreshed every frame: they wrote in the last 20), turns
(rested, their 1-in-20 turn), woken (held, refreshed by a wake), firsts (the one plain object per shader asked) and whole groups (a
group three replayed itself: recorded again, not static, or not yet seen through once). Next F3 says which one is left to cut.
- THE QUIET GROUP (11-19, his 16:33 F3: 40.0 FPS, "refreshed 188 of 3137 a frame (... firsts 108 ...)" yet "scene: bundle replays
  4.1 ms"): what was left was the bookkeeping: every own-node object of every group read each frame to learn that it rests. A group
  whose objects all rested last frame (none wrote) is a quiet group (`L.quiet` on the bundle's `_ewRep`): only this frame's turns
  (every REST-th object, by place) are visited, its instanced batches' versions are compared, and one object per set of shared buffers
  (`L.shr`, `rpShrList`) gets its shared refresh. A turn that writes or a batch rewritten sends that frame to the full loop with the
  wake already on (every object refreshed, only writers stay awake). Old loop: `window.EW_BUN_QUIET_LOOP`. The lens's bundles line
  adds "quiet groups N" (per frame, all passes).
- THE STILL BATCHES' WALK (11-19, his 16:42 F3: 32.8 FPS, "Matrix walk by group: hq_instances 0.93", "quiet groups 311" yet "scene:
  bundle replays 4.9"): the instance pass's ~2,700 batches never move (their copies' places live in the batch's buffer), yet three
  composed each one's matrix every frame. `hq_instances` now walks itself in the frame's one walk (`_hqInstGroupMW`): an off-camera
  cell is skipped (walked in full when it is back), and in a drawn cell a batch is walked when it joins, when its pose changed, or when
  the group / cell moved. Off: `window.EW_HQ_INST_MW_ALL`.
- THE REPLAY'S SPLIT (lens): "Inside the ticks" gets "replay: a group, all of it" (every group's whole replay, all passes) and "replay:
  the refreshes" (the quiet replay's own work). The quiet groups did not lower "bundle replays", so the cost is either the refreshes
  left (~160 a frame, each a full node update) or three's per-group steps around them; this says which.
- THE REFRESH BY OBJECT (11-19, his 17:40 F3, ~30 s after the load: 15.2 FPS, "replay: the refreshes 20.88" of "a group, all of it
  21.13" ms, ~400 refreshes a frame (awake 135, turns 147) = ~50 µs a refresh, ten times a plain one). So the replay's cost IS the
  refreshes, and something in them is heavy. Lens open only: every refresh of the quiet replay is timed and filed under what it is
  (name of the object or its nearest named parent, its look: node kind / sign canvas / video / see-through / material type, batch or
  skinned) with the sheet uploads it caused (backend `updateTexture` / `generateMipmaps`, counted in `_ewBun.uplN`). New lens line
  "Refreshes by object": the top 10 by ms a frame, refreshes a frame, uploads, worst single refresh.
  (11-19, his 18:06 F3 had no such line: it filled only on the lens's own sampled frames. It now fills from the dip log too (always on
  in the walk), over a rolling window of ~300 frames (`_ewBun.rf`, the last full window kept in `_ewBun.rfLast`).)
  (11-19, his 18:12 F3, the first with the line: 6.05 ms of refreshes a frame; the top one "hq_part · MeshLambertMaterial · batch 1.91
  ms a frame" for ONE refresh a frame (worst 4 ms), then static-batch "node stack" 0.86 (24 a frame) and the instance pass's Lambert
  batches 0.59 (58 a frame). The label now says where the object hangs (parent chain to the named one), its copies (drawn / room for),
  corners, looks and "never culled"; the top four also show full / shared refreshes and ms a frame per step: check (needsRefresh),
  before (updateBefore), geometry (attribute uploads), nodes (updateForRender), bindings (uniform / sheet writes), after.)

### THE SUN IN THE FIRST REFRESH + THE LONGER TURN + THE WAITING LEVELS (2026-11-19, his 18:28 F3: 36.0 FPS, worst 46 ms)
- READ THIS before chasing "Refreshes by object": its top row ("Mesh in Group<hq_part · MeshLambertMaterial · batch · 1610/1610 copies",
  2.03 ms, all of it "before") is the SUN'S SHADOW PASS: three draws the shadow map from the first lit object's updateBefore, inside that
  object's refresh. The row's ms are the shadow pass's, already counted in the "sun shadow:" rows. The rest (~4.4 ms) is ~220 small
  refreshes a frame (firsts ~110, turns ~70, awake ~30), ~20 µs each, mostly "bindings".
- THE LONGER TURN: a rested object (still rests after REST = 20 quiet frames) is asked on its turn every RP_TURN = 60 frames (was 20):
  turns a frame / 3. A change that moves no version (a node value set by hand on a still object) shows up to ~1 s late. Old:
  `window.EW_BUN_TURN_20`.
- THE WAITING LEVELS: `_hqLodTick` re-read the whole room (74,000 objects; the scan alarm's "!! _hqLodScan < _hqLodTick 36K/s") on every
  LOD level landing, i.e. every 2 s while models streamed ("tick: LOD 12 ms" frames). `_lodAttach` marks a model's geometries
  `_ew_lodWait`; meshes on them are kept aside as they arrive (`L.pend`, filled by the desk and the whole read), and a landing moves the
  ones whose levels came into the list. Whole read: first run, overflowed desk, every 60 s. A mesh placed BEFORE its model's attach
  marked it waits for the 60 s read. Old rule: `window.EW_LOD_LAND_RESCAN`.

### THE PIXEL RATIO TEST + THE TIMERS BETWEEN FRAMES (2026-11-19, his 18:44 / 18:45 F3s)
- Same spot, ratio 2.0 vs 1.5: 35.4 → 42.0 FPS, frame 28.2 → 23.1 ms, CPU 19.1 → 19.5 ms. At 2.0 the GPU is part of the limit; at 1.5 the
  CPU (~19.5 ms) is the wall to 60.
- At both ratios: a 90-125 ms frame EVERY 6 s exactly (18:44:08, :14, :20 ... 18:45:30), with ~20 ms of the frame's own JS and "nothing
  loaded or rebuilt". Not the HQ save timer (4 s, writes only when he moved), not the memory sweep (timed). The lens's slow-frame entries
  now carry "timers N ms (slowest …)": every setTimeout / setInterval callback made after three-renderer.js loads is timed (wrapper at
  the file's top; off: `window.EW_TIMER_WATCH_OFF` before load). If that reads ~0 on the 6 s frames, the time is the browser's own
  (Firefox GC / cycle collector, its GPU process): record it with the Firefox Profiler (about:profiling, "Graphics" preset).
- (18:57 F3) "timers 0" on every slow frame: the 6 s ~100 ms gaps are NOT game JS (no timer, no frame code). Firefox's own work (GC /
  cycle collector / GPU process); next step = a Firefox Profiler recording.
- THE MASK FILES BY THE DESK: the model mask's short walk (maskFile) made EVERY big group's file stale on any add in the scene, and the
  next mask render filed them all in one frame ("mask: projection walk 16-22 ms" whenever the instance pass added). Now the front desk's
  arrivals mark only the groups they landed under (`_ew_mkDirty`, climbing parents), three-post.js `_pixMkDirty` marks a group when a
  piece is tagged onto a mask layer, and each file is also made again on its own staggered ~10 s (`10000 + (id % 40) * 125` ms); an
  overflowed desk refiles all (`mkEpoch`). A layer turned on elsewhere waits for the 10 s refile. Old: `window.EW_MASK_FILE_ANY_ADD`.
- THE LEFT ALONE BY KIND: `_hqInstAdd`'s one-by-one run read the whole left-alone set (~2,300 pieces: matrix walk up, key, place) for
  every few fresh pieces ("instance: add 1-10 fresh 13-17 ms"). A left-alone piece keeps its key (`_ew_instK`) and is read again only
  when fresh copies of its kind came. Old: `window.EW_HQ_INST_LEFT_ALL`.

### HIS FIRST FIREFOX PROFILE (2026-11-19 19:14, Mac, 120 Hz, ~2 s, Graphics preset; how to record: docs below)
How to get one from him: Firefox address bar → `about:profiling` → pick "Graphics" (his Firefox has no Start button there) → in the game
tab Control+Shift+1 (start), ~15 s, Control+Shift+2 (capture) → profiler tab → Upload → link. share.firefox.dev / profiler.firefox.com
are blocked from the cloud container: ask him to drop the downloaded `.json.gz` instead (Upload's menu has "Download"). Read it with a
python script over `shared.stackTable` (`prefixOffset`: prefix = i - offset, 0 = root), `frameTable`, `funcTable`, `stringArray`.
What it said:
- The walk frame is ~21.5 ms of solid main-thread JS (no blocking; Firefox's WebGPU C++ is only ~0.6 ms of it). On 120 Hz a 21.5 ms
  frame lands on the 25 ms beat (40 FPS); ≤16.6 ms = 60. No major GC in the window (GCMinor 0.14 ms a frame). The 6 s hitches did not
  fall in these 2 s.
- GPU process: WebRender's "WR OS Compositor frame" ~11 ms a frame (max 13.6), "Lock MacIOSurfaceTexture" ~3.7 ms: compositing the
  3456×1812 canvas. Parallel to the main thread; pixel ratio 1.5 shrinks it.
- Fixed from it: THE SIZE BY OBSERVER (`_hqFrame` read `host.clientWidth/Height` every frame = a forced style + layout, 0.67 ms;
  now a ResizeObserver + a 1 s backstop; old: `window.EW_HQ_SIZE_EVERY_FRAME`); window flag reads hoisted out of hot loops
  (`_hqInstSyncHidden` once per batch = 0.42 ms a frame, `_hqStillOff` / EW_HQ_STILL_MERGED_EVERY once per still group: a missing
  property read off `window` is slow on Firefox, never put one in a per-object loop); the always-on dip log no longer does lens-only
  work (the per-pass visit count on every `_projectObject` 0.40 ms; the refresh-by-object clock reads run on lens frames or 1 dip frame
  in 8; the "replay:" sub-spans lens-only).

### HIS SECOND FIREFOX PROFILE: THE 6-SECOND HITCH IS FIREFOX'S CYCLE COLLECTOR (2026-11-19 19:26, 42 s, Mac 120 Hz)
- Recording tips that worked: raise the buffer on `about:profiling` (the Graphics preset's default kept only the last ~2 s); Control+Shift+1
  ONCE (pressing it again throws the recording away), play 20-30 s, Control+Shift+2; in the profiler tab Upload's panel → Download, drop the
  `.json.gz`. RefreshObserver markers come in pairs (~0 ms apart): count frames from one of each pair.
- Steady walk: ~1,550 frames in 42 s (~37 FPS), frame JS median 19.4 ms (p90 24, p99 34): it lands on the 25 ms beat of 120 Hz; under
  ~16 ms lands on 16.7 (60). Firefox's WebGPU C++ is ~0.6 ms of the frame; the rest is our JS + three's.
- THE HITCHES (100-161 ms gaps after a normal ~20 ms frame): the CYCLE COLLECTOR, `CC` markers every ~6.5 s, reason MANY_SUSPECTED
  (2,000-10,000 suspected), its first slice 77-134 ms on the main thread, NOT idle (the frame leaves no idle time). Inside it:
  `CycleCollectedJSRuntime::FixWeakMappingGrayBits` (~half; walks the runtime's WeakMap entries: three's WebGPU keeps a WeakMap entry per
  attribute / texture / binding / render object) and `TraverseRoots` (~a third; native objects holding JS). Also one GCMajor
  (TOO_MUCH_MALLOC, max pause 74 ms) and 6 GC slices over 20 ms in the 42 s. Timers: 0 (THE TIMERS BETWEEN FRAMES).
- What feeds "suspected": per-frame browser objects (each render's GPUCommandEncoder / render pass / command buffer: ~12 renders a frame
  with the 9 post passes), not audio (SFX go through Web Audio buffers). The 6.5 s cadence is Firefox's own CC timer; the lever is how
  much each CC has to read (live WebGPU objects, WeakMap entries), not when it runs.
- Next experiments (not done yet): (1) the same walk in Chrome (no cycle collector) to split "Firefox-only" from "the game";
  (2) free the GPU-side data of the static batch's merged originals (their geometries were uploaded while the room loaded and stay
  live while they are hidden: ~15,800 pieces' attribute buffers + three's WeakMap entries + render objects), a geometry `dispose()`
  once per geometry not shared with anything drawn; a handed-back piece re-uploads.

### THE SECOND PROFILE, READ FUNCTION BY FUNCTION: THE PAGE BEHIND THE WALK + FOUR CUTS (2026-11-19, 60 FPS thread; mondo: "Get the game to stable 60 fps")
His 19:26 Firefox profile again (42 s, 1,546 frames; main thread 100 % busy: 81.9 % the frame's JS, 14.5 % Firefox's own Paint) with
his 19:35 F3 (41.7 FPS, frame 24.0 ms, CPU 18.2 ms). 1 % of that profile = 0.27 ms a frame. Reading tool: a node script over
`shared.stackTable` (`prefixOffset`), `frameTable.func`, `funcTable.name / lineNumber`; the lines of three's own functions match
`three@0.186.1/build/three.webgpu.js` from jsdelivr exactly (DataMap.get = 31710, Backend.get = 69567, Renderer.render = 63157).
- THE COVERED SCREENS (the new find, ~3.9 ms a frame): `nsRefreshDriver::PaintIfNeeded` 14.5 % = Firefox building the HTML page's
  display list on every frame the canvas changes (DisplayList building 4.4 %, WebRender display list 9.9 %, of it
  `nsCSSGradientRenderer` / `ColorStopInterpolator::CreateStops` 5.8 %, and 124 "Image Paint" markers a frame). A DOM census in a
  city probe: `#builderOverlay` (the pre-match Party Builder, asleep behind the walk) = 2,024 laid-out elements, 250 gradients,
  220 background pictures, all still rendered under the opaque `#hqPage`; the menus' 36 motes, grain and title sprites still
  animating at opacity 0. Fix: three-renderer.js `_hqCoverSync` (a class observer on `#hqPage` / `#startOverlay`) puts
  `ew-hq-cover` on `<html>` 1.2 s after the walk's page is the active one and takes it off at once when it is not;
  styles-base.css: under it `#builderOverlay` is `visibility: hidden; content-visibility: hidden` and the other title pages'
  animations are paused. Off: `window.EW_HQ_NO_COVER`. RULE: a full-screen screen that stays mounted behind another one costs
  Firefox per element, per gradient, EVERY frame; a covered screen must be `display: none` / `visibility: hidden` /
  `content-visibility: hidden`, not only under something opaque or at opacity 0 with its animations running.
- THE FLAGS ARE THERE (~0.7 ms a frame left after #2187; 5.2 % in the profile): a read of a property that does not exist on
  `window` goes through `nsOuterWindowProxy::get` every time (Firefox cannot cache a miss: it must ask the page for an element of
  that name). Left after the hoists: `_hqCkOldPoll`, the bundle code's `_projectObject`, `rpReplay`, `rbOne`. Every `window.EW_*`
  name three-renderer.js and three-post.js read (358) is now defined on `window` at load (undefined, not enumerable) from a list
  at the top of three-renderer.js, so the read is a plain cached one. A flag set before load or later works as before. Keep the
  list fresh with the grep in its comment; a name missing from it only reads slowly.
- THE MAPS ON THE OBJECTS (the 6.5 s hitch + ~0.7 ms a frame): three keeps its per-object data in WeakMaps (`DataMap`: attributes,
  geometries, textures, pipelines, bindings, nodes; `Backend.data`); Firefox's cycle collector reads every WeakMap entry of the
  page (`FixWeakMappingGrayBits`, half of each 77-134 ms stop), and the `get`s were 2.6 % of the frame. `_ewGpuPropMaps(r)` (run
  first after `init()`) keeps that data on the object itself under a per-map Symbol (non-enumerable); an older entry is moved on
  its first read; a frozen object stays in the WeakMap. ChainMap is untouched. Old maps: `window.EW_GPU_WEAKMAPS` before the
  renderer is made. NOT measured on his Mac yet: the next profile's `CC` markers say what is left (TraverseRoots is the other third).
- THE HELD BOOK (`_hqStillUpdate`, 1.47 ms own time, the largest single function): "held by the static batch" is read from a byte
  array per group (laid again when the child count / `_hqBatchHoldN` changes or a new child is seen), not off each of ~14,000
  pieces every frame; a held piece with no children is no longer swept (the batch's watchdog has it). Off:
  `window.EW_HQ_STILL_NO_HELD_BOOK`.
- `_hqInstSync`: a batch's copies ask "is my parent shown" once per run of the same parent (`_hqInstShown` was 0.5 ms a frame).
- THE BARE BONES (`_projectObject` + its wrapper ~2.5 ms a frame over the mask, shadow and scene passes; the bones are a share of
  it: 342 visible bones in the probe's quiet view, more in a crowd): each pass walked every bone of every visible body. A bone whose subtree holds only bones and plain Object3Ds is not walked (`boneBare` in
  `_ewBunSetup`; the answer is kept on the bone and worked out again when the add counter moved, so a hat or held gear put on a
  bone later is seen). Off: `window.EW_BONES_WALK_ALL`. The lens's "Walk visits" line shows the drop.
  Runs on the WebGPU backend only (the bundle set-up), so the cloud cannot draw with it: its rule was run on the city's real rigs
  in a probe instead: 1,524 bones, 1,498 bare, 15 drawable things under bones (hair, held gear, the door gun), 0 under a bare bone.
- Checked in a city probe (node renderer on the WebGL 2 backend, HEAD of this PR): `<html>` carries `ew-hq-cover`, the builder is
  `hidden / hidden`, rendered elements 2,434 → ~420, running animations 39 → 1; `backend._ewPM` / `_attributes._ewPM` are set and
  26,000-29,000 position attributes carry their data as a property (that many entries left each WeakMap); the still walk sweeps
  ~290 pieces a frame (was ~1,000); no page errors, same picture. NOT measurable in the cloud: his Mac's frame time; the next F3 /
  Firefox profile is the proof.
- What the profile says is left (ms a frame, old code): the scene pass's bundle replay 5.0 (of it the shared uniform groups of
  ~110 shaders 2.6: `updateSharedForRender` → `NodeUniformsGroup.update` compares every uniform of every shader's shared group
  each render), the sun's shadow pass 1.7, the mask pass 2.0 without the sync (projection walk 1.3 for a dozen bodies), the bundle
  check 1.5, the matrix walk 3.3 (before THE HELD BOOK), the ticks ~2.5. On his 120 Hz screen a frame lands on 16.7 ms only when
  JS + Paint stay under ~16 ms AND the GPU does; at pixel ratio 2.0 (3456×1812, 9 post passes) the GPU was part of the limit in
  THE PIXEL RATIO TEST, so Render Scale 75 % is the test for "is it the GPU now".
- THE RESULT + THE LIST KEPT (11-19, his 20:11 F3 after #2189, same streets, pixel ratio 2.0): **59.5 FPS, frame 16.8 ms, CPU 13.7 ms**
  (was 41.7 / 24.0 / 18.2); matrix walk 2.3 (88 swept, was 1,000), walk visits scene 2.6K / shadow 2.5K / mask 3.4K. Left: (1) a
  70-99 ms gap every ~6 s with 11-17 ms of JS and "nothing loaded or rebuilt" = Firefox's cycle collector still (was 100-160 ms);
  the next Firefox profile's `CC` markers say what it reads now (TraverseRoots, ChainMap, the node caches). (2) "bundle check 40 /
  43 ms ... targets 29 / 38 (1044)": `_ewBunTargets` refilled its list every frame with three `for in` walks and a closure, about
  the only allocation left in a settled frame, so the collector's slices landed there. The list now stands until the add counter
  moves, the room changes or 30 frames passed. Every frame: `window.EW_BUN_TARGETS_EVERY`.
- THE REST OF THE MAPS (11-19, his third Firefox profile, 20:24, after #2189 / #2190): the ~6.5 s stop was still 62-64 ms (`CC`,
  MANY_SUSPECTED, 4,000-5,000 suspected) and ALL of it WeakMap reads (`FixWeakMappingGrayBits` 0.57 % + `TraverseRoots >
  TraceWeakMaps` 0.43 % of the profile). HOW TO COUNT WEAKMAPS (the recipe): a scratch copy of playtest_city.js with an init
  script that swaps `window.WeakMap` for a subclass (a record per map: its maker's stack, a WeakRef, a count of keys set) and a
  CDP `HeapProfiler.collectGarbage` exposed to the page; the view's eval collects, then sums the records whose map is still alive.
  City, node renderer on WebGL 2: **228,760 live entries in 53,781 maps** before; the top: render objects' ChainMap 76,000 entries
  in 53,000 one-entry maps, `Info.memoryMap` 71,000, `Geometries.attributeCall` 46,000, `NodeMaterialObserver.renderObjects`
  16,000. (Counting every map ever made, 1.1 million entries: 700,000 in the shader builders' NodeCaches, dead after the build.)
  `_ewGpuPropMaps` now also moves those: `_EwPropMap` (a WeakMap look-alike keeping the value on the key under its own Symbol;
  `info.memoryMap`, `_geometries.attributeCall` / `wireframes`, each observer's `renderObjects` through `NodeMaterial.setupObserver`)
  and ChainMap (`_getWeakMap` / `set` on its prototype: the first key carries the entry, the levels under it are plain Maps; a
  level that reaches 32 keys on one object is emptied, the valve). After: **17,552 live entries in 406 maps** (three's module
  caches 14,000, `_hqBatchIds` 1,400), same picture, no page errors. Old maps: `window.EW_GPU_WEAKMAPS`. On his Mac the proof is the
  next profile's CCSlice length (62-64 ms before).
- THE BAKE IN SLICES (11-19, his 20:49 F3, ~50 s after the load, 45.2 FPS while the static batch still scanned and bodies arrived):
  four dips in 40 s were "new body: clip bake (first of a model) 49 / 92 / 134 / 231 ms" in one frame each (the first body of a
  model retargets all 30-45 slots of the library at once). `_animLibBakeForModel0`: while the walk is drawing (`_hq.ready`, a walk
  frame in the last 250 ms) the eager slots are baked one at a time through `_libBakeClips(…, { only, ctx, byClip })` (new
  `opts.byClip`: one clip shared by the slots that name it, across calls), ~3 ms or 6 slots a frame on requestAnimationFrame, and
  the model settles when the last is done; a fight, the menus and the forge bake whole as before. Off: `window.EW_LIB_BAKE_WHOLE`.
  Probe (sliced vs whole, same view, 10 s): 22 bodies seen in both, 4 vs 5 changing pose, no retarget warning, no page errors.
  Still in that F3: 59-71 ms gaps with 14-19 ms of JS (the cycle collector, ~15 ms shorter than before THE REST OF THE MAPS; the
  WebGPU backend's own maps and Firefox's GPU wrappers are what a next profile would name), and "new body: model + rig" without
  the bake (the clone + rig of a body, ~5-15 ms).
- THE RESULT, SETTLED + THE SHADOW KEY KEPT (11-19, his 21:06 F3 + fourth Firefox profile, ~4 min after the load): **70.9 FPS, frame
  14.2 ms, CPU 11.9 ms**, worst 25 ms. The cycle collector's slice is under 18 ms (was 62-64 before THE REST OF THE MAPS, 77-134
  before THE MAPS ON THE OBJECTS): no `CCSlice` over 15 ms but one of 18. What the profile shows now:
  (1) MAJOR GCs: two in 27 s (`FULL_GC_TIMER`, `CC_FINISHED`), each ~300 ms of marking in 60-73 slices, longest 38-59 ms: the JS
  heap is ~800 MB (malloc heap 4.1-4.9 GB), and the mark time follows the live heap. Not cut here; the lever is the size of what
  stays alive (the hidden originals of 15,800 merged pieces, the parked rooms).
  (2) Short-lived garbage: 1,113 MB of nursery in 27 s (~41 MB/s, a minor GC about every frame, ~0.12 ms each). Of the minor GCs
  with a game frame under them the first name by far was three's `RenderObject.getMaterialCacheKey` under the SUN SHADOW's draws
  (also 1 % of the frame): the shadow pass draws every caster with one shared material and copies each caster's alphaTest onto
  it; three's `alphaTest` setter bumps the material's version whenever it crosses zero, so with cut-out and solid casters mixed
  every shadow render object looked stale on every draw and built its key string again. `_ewInstShareSetup`'s
  `getMaterialCacheKey` now keeps a shadow-pass key on the render object with the values the pass copies (alphaTest > 0,
  alphaMap, side, the three nodes, displacement, transparent, geometry id, receiveShadow, the clipping key). Off:
  `window.EW_SHADOW_KEY_EVERY`. Probe: palm (cut-out), lamp post and body shadows draw as before, no page errors.
  HOW TO READ ALLOCATIONS FROM A PLAIN PROFILE: the samples whose stack holds a `Nursery` / `Minor GC` frame, grouped by the
  nearest JS frames above it, are a sample of the allocation sites weighted by bytes. 136 of 209 had no JS frame (the browser's
  own objects, e.g. WebGPU wrappers per render).
- THE CHAIN MAPS, SECOND CUT (11-19, mondo's 21:37 F3 with "The cars are always glitching out of place"; cause NOT proven, the
  cloud has no WebGPU): THE REST OF THE MAPS had patched ChainMap's PROTOTYPE, so three's other chain maps changed too. One of
  them starts with a SHARED key: `NodeManager.groupsData` [group node, uniforms group]. With the entry on the one group node its
  inner Map collected every uniforms group of the scene, hit the 32-key valve constantly and forgot them all, so `updateGroup`
  answered "update" for shared groups again and again inside one render (three means once per render / frame). That is a real
  change of behaviour on the path the classic-drawn movers (the traffic cars, `_ew_bunOut`) take, and the one thing found that
  could misplace them. Now only the render objects' own chain maps are dressed (`RenderObjects.getChainMap` wrapped, per
  instance); every other ChainMap is three's own again. RULE: a "keep it on the key" map is only right when the FIRST key is one
  of a kind; and such data is INHERITED by `Object.create(key)` (a WeakMap's is not): `_ewScCheck`'s stand-in render object now
  shadows every such Symbol first (`_ewOwnSymbols`). A probe showed three's shader build does not read them off the stand-in (12
  builds, 0 inherited reads), so that one was a hazard, not the cause.
  If the cars still jump after this: bisect on his Mac with the off switches, set before the page loads: `EW_GPU_WEAKMAPS`,
  `EW_HQ_STILL_NO_HELD_BOOK`, `EW_BONES_WALK_ALL`, `EW_SHADOW_KEY_EVERY`, `EW_BUN_TARGETS_EVERY`.
- CONFIRMED (11-20, mondo's 00:20 F3 after #2199: "Cars are good now"): the cars out of place WERE the prototype-wide ChainMap
  patch (`groupsData` emptied by the valve, shared uniform groups updated over and over inside one render). Same F3, a busier
  corner (squares 28-32, 6-13; 259 draw calls, 214 meshes drawn one by one): 47.3 FPS, frame 21.3 ms, CPU 15.5 ms. The frame is
  5.8 ms longer than its CPU there (2.3 ms at the 70.9 FPS spot), so at pixel ratio 2.0 the GPU side is likely the limit at this
  corner: Render Scale 75 % is the test. CPU left at this corner: "props: one of a kind" 90 own draws, `_ew_hqSignal` 39,
  `_ew_hqCar` 22, fx 36 (131 props drawn outside their bundle).
- THE CPU IS THE CAP AT THE BUSY CORNERS (11-20, his 00:34 F3 at Render Scale 75 % = ratio 1.5, squares 49,18: 48.0 FPS, frame
  20.8 ms, CPU 17.0 ms, 284 draw calls): the lower resolution did not lift it, so there it is the game's JS (17 ms > 16.7), spread
  thin: bundle replays 4.2 (the ~100 shader "firsts" a frame + the sun shadow inside the first one), matrix walk 2.3, classic
  draws 1.5 (212 own draws: props one of a kind 92, `_ew_hqSignal` 39, `_ew_hqCar` 28, fx 26), bundle check 1.5, the mask pass 2.1.
  Cut here: (1) "Bundle spikes: 12-17 ms check, slowest downtown_streets shell 8-13 ms, 0 re-recorded" about every 15 s = THE HELD
  PIECES ONCE's just-in-case re-lay of the shell's 10,000 pieces every 240 checks; every real change (child count, the batch's
  hold counter, an add, a mover) already asks for a re-lay, so it is every 3,600 now. (2) the `_projectObject` wrapper (the
  frame's top own-time function in the fourth profile, 0.64 ms for ~9,000 calls) passed `arguments` through `apply` five times;
  now a plain call with the named arguments. What would move this corner by milliseconds is structural, not another small cut:
  the 39 signals and the one-of-a-kind props into recordings (fewer own draws), fewer distinct shaders (each costs a "first" in
  every render), or the unit mask drawn from a kept list of bodies in place of a walk of the scene.
- THE MASK'S LISTS (11-20, mondo picked cut 2 of three: "draw the character outline pass from a kept list of bodies"): the unit
  mask (THE BOLD UNIT LINE: two renders of the scene a frame, the skinned layer and the still parts that ride a unit) walked the
  scene for a few dozen pieces ("mask: projection walk 1.0-1.1 ms", "Walk visits: mask 3.4K-5.4K"). three-post.js
  `_scanPixelMaskTargets` (which already reads every object on an add / every 1.5 s) now writes down what stands on each of the
  two layers (`sc._ew_pixSkinL`, `sc._ew_pixUnitL`: by the layer bits, a piece under a listed one not listed again), and
  `_renderPixelMask` hands the list to the renderer for its render (`_ew_maskList`, `_ew_maskListSc`). three-renderer.js
  `_ewMaskListSetup` (any node renderer, set up after `init()`): for that render the scene's children are not walked; each listed
  piece whose parents are all shown up to the scene goes to three's own projection with its nearest Group's render order.
  The Pixelate "models" static pass and every other render are untouched. Off: `window.EW_MASK_LIST_OFF` (live).
  Proof (city probe, node renderer on WebGL 2, `--post`, ink style on, same frame conditions, the walk then the list): the mask
  drew the SAME objects in the SAME order (4 of 68 listed bodies in view); projection visits 30,487 → 37 (skinned) and 30,487 → 1
  (unit parts). On his WebGPU path the walk was already cut to ~4,000 by the mask files; the list makes it a few dozen.
  PROBE FACTS learned: playtest_city.js sets `EW_HQ_NO_POST` unless `--post` (no mask, no style without it); the ink style's
  picture is broken on the cloud's WebGL 2 software path (ground missing) with or without this change, so compare DRAWS (wrap
  `renderer.renderObject` during the render), not pixels; `EW_PROBE_GL=webgpu` + `--gpu=webgpu` runs real WebGPU on SwiftShader
  (black picture, counts only); a small room for a 40 s probe: `site_ow_r1`.
