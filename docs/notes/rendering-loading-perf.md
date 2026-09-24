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
