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
