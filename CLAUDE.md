# CLAUDE.md

Entropy Wars — a browser Tactical-JRPG PvP prototype. `server.js` (Express +
socket.io) is only matchmaking/relay; ALL gameplay logic is client-side in
`index.html` + ~35 scripts loaded from a Cloudflare R2 bucket (custom domain
`cdn.entropywars.net`, brotli + long-cache edge) and CDNs.

## NOTES INDEX — feature history lives in docs/notes/

**Do not append feature notes here. Put new notes in the matching docs/notes file and keep this file under 20 KB.**

Feature history (was 760 KB here) moved verbatim to these files. Grep the matching one; they are large.

| File | Covers | Read when |
|---|---|---|
| `docs/notes/door-docs.md` | Map of the DOOR design docs (DOOR_MASTER, HQ build plan, Phase 9 brief). | Before ANY DOOR / story / hub / HQ work. |
| `docs/notes/hq-building-rooms.md` | HQ rooms, floors, wings, gallery, seams, directory map, floor plans. | HQ room / floor / link work. |
| `docs/notes/areas-complexes.md` | Explorable areas, complexes, terrain rooms, Area Content Plan D1-D5, population. | Area / complex / site work. |
| `docs/notes/seamless-field-encounter.md` | Encounter, Phase 9 field stages, Seamless Field deliveries 1-10. | Fights in the explored room. |
| `docs/notes/story-party-progression.md` | Tutorial, party, bag, levels/XP, intake, debrief, capture. | Story-mode progression. |
| `docs/notes/champions-combat.md` | Battle rules, champ rework, races, Nexus/Arena, targeting, badges. | Combat rules / races. |
| `docs/notes/spells-vfx.md` | Spell VFX/timing, spell camera, finishers + EXECUTIONS, spell director. | Any spell / VFX work. |
| `docs/notes/door-gun-skate-vehicles.md` | Door Gun revs, skateboarding revs, vehicles. | Those systems. |
| `docs/notes/character-creator.md` | Character creator revs 3-11, cloth, wardrobe. | Creator work. |
| `docs/notes/models-assets.md` | Model batches, kits, model queue, asset store, matte bake. | Adding models/assets. |
| `docs/notes/maps-terrain-battle.md` | Battle maps, moving maps, horizon, planets, sky. | Battle map work. |
| `docs/notes/ui-menus-audio.md` | Main menu, terminal, forge, HUD, nameplates, pause menu, music. | UI / audio work. |
| `docs/notes/editor.md` | The in-game editor (EDITOR_PLAN.md): editor.js, world file, E0+. | Editor work. |
| `docs/notes/rendering-loading-perf.md` | Polish passes, bloom, textures, loading/lanes, freezes, crashes. | Render / load / perf work. |

## RULE #1 — DELIVERY WORKFLOW (do this, nothing else)
The game loads its scripts from the R2 bucket, NOT from the repo and NOT from a
local server. So Claude CANNOT make changes go live. The ONLY correct workflow:
1. Edit the ACTUAL existing files in the repo in place (never create new GAME
   .js files, never split game logic into a new module — work with what's
   already there; that rule protects the fixed R2 upload set. Repo-only dev
   tooling at the repo root (deploy.js, load-data.js, bake-*.js) is fine —
   see TOOLING).
2. Hand the user the COMPLETE edited file(s) in the chat AS ONE ZIP
   (SendUserFile). STANDARD since 2026-09-12 (the user's rule): every
   delivery is a single `ENTROPY_WARS_<TOPIC>.zip` built with `zip -j`
   (flat, no folders) in the scratchpad, holding every changed file —
   the R2 scripts, the bumped index.html (RULE #1b), and any repo-only
   files (docs, CLAUDE.md). Never a loose file list. The chat
   caption says which files go to R2, which to Render, which to the repo.
3. The user uploads them to the R2 bucket (and manually syncs the repo so future
   sessions start from the latest) — or runs `npm run deploy` (see TOOLING),
   which uploads + cache-busts in one command.
DO NOT `git commit`, DO NOT `git push` (it 403s anyway), DO NOT generate patches/
diffs. The deliverable is always the full edited file, produced in chat.

### TOOLING
- **NO TESTS (2026-09-29, mondo):** the test suite, the check-* tools and the CI workflow were deleted. Never write
  test files, never run a test suite, never re-add CI. Check work with `node --check <file>` on the JS you edited
  (a stray brace in data.js takes the whole game down) and, when useful, a quick load/playtest of what changed.
- **NO TAPE / FIND / OLD-SAVE GUARDS (2026-09-27, mondo):** "I do not care about the tapes or the finds ... I do
  not care about save files or old saves." Don't migrate old save keys, and let tapes/finds move or drop when a
  room changes.
- The server RUNTIME derives the ACCT_* constants / starter lists / race lists from data.js at boot (server.js
  `ECON` object, headless load via load-data.js); the server literals are the boot-failure fallback, so keep them
  synced by hand when you change those lists in data.js.
- `npm run deploy` — USER-run (needs wrangler auth + EW_R2_BUCKET env): finds
  the changed R2 files (git status, explicit args, or `--all`), node --checks
  them, bumps the `?v=` token in index.html, uploads via wrangler, and prints
  the Render-redeploy reminder. `--dry-run` previews. Without a bucket it
  still bumps the token and prints a manual upload checklist. Claude has no
  wrangler creds — Claude's deliverable is still files in chat (RULE #1);
  this script is how the USER ships them.
- `load-data.js` — loads data.js headlessly in a Node vm sandbox (real
  values, not a copy). Use it for any new data validation/tooling instead of
  regex-scraping data.js.
- `bake-spell-mods.js` (2026-09-26, SPELL_LIBRARY_PLAN.md Phase 0) — bakes a
  Spell Library export into data.js's literal rows (`node bake-spell-mods.js
  <export.json>`; `--stamp-tiers` wrote the explicit numeric `tier` on every
  row). Notes go to docs/spell-notes.md, never data.js.
  Phase 1 (the v2 screen): probe playtest_library.js. Phase 2 (the grid + the look): notes in ui-menus-audio.md +
  spells-vfx.md. Phases 3/4/5/6/7 (riders/passives/upgrades/families/pools): notes in champions-combat.md + ui-menus-audio.md. Phase 6: RACE_FAMILIES is the pool; SPELL_CATALOGUE.md.
- `optimize-assets.js` / `manifest-assets.js` (2026-09-27, OPEN_WORLD_PLAN Phase 9): `npm run optimize -- <dir>` writes
  `<name>.opt.glb` (meshopt + WebP, NO quantize: r128 reads it raw on the CPU) beside each GLB; `npm run manifest --
  <bucket mirror>` writes ASSET_MANIFEST.json ([bytes, sha] per bucket path). The game loads a listed `.opt.glb` in place
  of its original and fetches every listed file as `?h=<sha>`. Notes: docs/notes/models-assets.md "THE ASSETS".
  Phase 10: `--lod` also bakes `<name>.lod1.glb` / `.lod2.glb` (geometry only) that the game draws far off.
  Phase 11 (the smooth attach: sliced build, compile warm-up, static batch, bitmaps): notes in
  rendering-loading-perf.md "THE SMOOTH ATTACH".
  Phase 12 = WORLD_GEOGRAPHY_PLAN G1 (portals `_hqCull*`, memory budget `_mm*`, the MEM line): notes rendering-loading-perf.md "THE PORTALS + THE MEMORY BUDGET".
- THE LAND is CUT (2026-09-29, ZONES_PLAN.md Z0): no bake-land.js, no land.json, no HQ_LAND, no LAND/ATLAS map tabs, no
  editor land mode. The world is DOOR HQ + zones behind doors (ZONES_PLAN.md, the plan of record; its §12 is the log). The
  stage (door-joined parts, no card) is HQ-only: HQ_STAGE_RULES.zones. Engine rows (heap, LOD, instance, cull, queue) are
  HQ_ENGINE_RULES. OPEN_WORLD_PLAN.md + WORLD_GEOGRAPHY_PLAN.md are history in docs/archive/.
- `migrations/*.sql` (added 2026-07-29) — versioned D1 schema, applied at
  boot by server.js `runMigrations` (recorded in `schema_migrations`;
  duplicate-column/already-exists errors are tolerated so it converges on
  the pre-existing live DB). Schema changes = a NEW `NNN_*.sql` file, never
  ad-hoc ALTERs in code. Account tokens are SHA-256-hashed at rest since
  2026-07-29 (`players.token_hash`; plaintext column holds a `'#'+hash`
  tombstone, legacy rows are backfilled at boot — all lookups MUST go
  through server.js `findPlayerByToken`). HTTP endpoints are per-IP
  rate-limited (`httpRateLimit`). Production checklist: set
  `EW_ALLOWED_ORIGINS` on Render so arbitrary sites can't open sockets.

### RULE #1c — DO NOT PLAYTEST UNLESS EXPLICITLY ASKED
Playtesting (Playwright runs, browser automation, driving the game) burns a LOT
of the user's tokens and they are fully capable of testing themselves. After
making changes: syntax-check the edited JS (`node --check <file>`) and hand the
files over — that's it. Only run the playtest harness / any browser automation
when the user explicitly requests it (e.g. "playtest <mode>") or when a change
is genuinely impossible to validate any other way AND the user has agreed.

### RULE #1b — CACHE-BUSTING (MANDATORY on EVERY R2 file delivery)
Assets are served with immutable long-cache headers, so an uploaded file does
NOTHING until `index.html`'s version token changes — players keep the cached old
copy otherwise. Therefore: **whenever you deliver ANY R2-hosted file (.js/.css/
asset) in chat, you MUST also bump the `?v=` token in `index.html` and deliver
the updated `index.html` in the SAME message.** No exceptions — one R2 file
changed ⇒ ship a fresh index.html too.
- Bump = one global find/replace of the current token to a new unique one:
  `sed -i 's/?v=<OLD>/?v=<NEW>/g' index.html`  (e.g. `20260705a` → `20260705b`,
  or a fresh date). The token is shared across every URL, so one bump
  invalidates everything — that's intended. KEEP any suffix after the date+rev
  (the current tokens end in `-cors` — that part is load-bearing).
  `npm run deploy` / `node deploy.js` does this bump automatically.
- `index.html` is served by Render (NOT R2); the user redeploys it to Render.
  It must stay revalidated (short/no cache), so the new token is seen immediately.
- Asset URLs *inside* the JS (sprites/textures/audio/GLB in sprites.js `_S`,
  audio.js `_R2_BASE`, inline data.js/three-renderer.js URLs) are NOT `?v=`-tagged.
  Since 2026-09-27 a file changed in place reaches players once ASSET_MANIFEST.json
  lists its new sha (`npm run manifest`, then deploy); else rename it or tell the user.

## RULE #2 — ONLINE PVP PARITY (every gameplay/visual change MUST work online)
Online is host-authoritative: the HOST runs the entire engine (blitz turns, AI
auto-play, damage, banners, camera); the GUEST is a dumb mirror that only (a)
applies `state-sync` snapshots and (b) replays `relay` events it's explicitly
sent (online.js). **Anything that happens engine-side — a banner, a camera move,
a VFX, floating text — simply does not exist for the guest unless it is relayed.**
That's why online kept drifting behind VS-CPU. So, for EVERY change:
- New on-screen moment (banner/announce/VFX/camera)? Wrap the global fn in
  online.js like `showTurnBanner`/`showPlayerTurnAnnounce`/
  `playOffensiveActionCamera`: host `_emit('relay', {type: ...})`, plus a guest
  handler in the `socket.on('relay')` dispatcher. Relay ALL opts that change
  behavior (dropping `noActionCam` is how guests got cinematics on basic attacks).
- New `state.*` field the guest needs? Check `_serializeState`'s skip list.
  New UI-only field? ADD it to the skip list + `_guestUIKeys` if guest-local.
- New player action? Guest must EMIT it (engine-wrapper pattern, see
  `doEntropyStrike`/`doBuildAction`), never execute locally.
- Fog is ENFORCED online. Any camera pan / select / text keyed to an ENEMY unit
  must gate on screen-true visibility: `_shouldCameraFollowUnit` /
  `_isTileVisibleToViewer` (both use the fog renderer's `computeVisibleTiles`
  set — do NOT reintroduce flat awr-radius checks, they see through walls and
  leak positions to the opponent).
- Before delivering, ask: "what does PLAYER 2 (guest) see when this fires?"
  If the answer is "nothing" and it's player-facing, it's not done.
- NEVER store a unit / state OBJECT on a unit or on `state` — store the ID
  (`_lastDamageSourceId`, resolve with `unitFromId`). A back reference made
  `state.units` cyclic and every host snapshot threw (2026-09-12 freeze; see
  PLAYTEST_NOTES "Online freeze"). online.js `_ewSafeStringify` now cuts a
  cycle and warns with the key instead of killing the sync — treat that
  warning as a bug in the writer.

## Most common request: "playtest <mode>"
The user wants Claude to **actually play Player 1 against the CPU** (NOT auto-sim /
dev-sim — they can do that themselves) and report pain points: unresponsive
clicks, getting stuck, confusing UI, bad pacing, plus the bug classes in
PLAYTEST_NOTES.md. There is a ready-made harness — don't rebuild it:

```bash
npm install && npm start            # server on :3000 (background it)
# first time only:
npm install playwright && npx playwright install chromium --with-deps
node playtest.js tdm                # arena | tdm | clash | simul | gauntlet
```

It drives the real menus → starts a VS-CPU match → plays P1 with real tactics and
spells → flags bugs → writes screenshots + combat log + `<mode>-flags.json` to
`shots/`. Read the console output and the artifacts, then summarize findings.

**Read `PLAYTEST_NOTES.md` first** — it has the full menu flow, the `window.GAME`
API (blitz turn model, move/attack/spell calls), and prior findings. That file is
the anti-"start over" memory; keep it updated when you learn something new.

## Wiring up a 3D character (frequent request)
Units can render as rigged Meshy GLB models instead of sprites. Since
2026-07-10 animations come from SHARED libraries on R2 (`Assets/Models/`):
Quaternius `UAL1_Standard.glb` + `UAL2_Standard.glb` (non-root-motion), and
since 2026-07-11 `MAL1_Sniper.glb` — the 20 Meshy animations exported ONCE
from the male sniper, consolidated offline into a 1.4MB animation-only GLB.
three-renderer.js retargets all of them onto every Meshy rig at load, so
per-character animation exports are no longer needed; Meshy-sourced
libraries retarget exactly like UAL ones (_libEnsureSrc auto-detects rig
naming). To grow the library: download animations for ONE character, then
consolidate (strip meshes/textures, merge clips named by file stem — see
PLAYTEST_NOTES "MAL library"). Retargeting
keeps each character's OWN rest posture (hunched beasts stay hunched; only
arm bind angles are standardized), and per-character clip flavor is one
`lib: {slot: {clip, lib, ts}}` opt (see UAL_SLOTS + PLAYTEST_NOTES). Recipe:
1. The user uploads the rigged model `..._Character_output.glb` (or any
   `_withSkin` export) to the race's R2 sprite folder. The
   `_generate`/`_texture` stage GLBs are BONELESS — never use them.
2. Add ONE line in sprites.js RACE_MODELS_3D:
   `'<race>': { male: _mkUAL('<folder>', '<meshy file prefix>', { heightRatio: 1.0 }) }`
   — done. Slot→clip map + timescales live in `UAL_SLOTS` (sprites.js);
   heightRatio is relative to the male fortune teller (=1.0). The renderer
   measures true SKINNED bounds for scaling — don't compensate manually.
3. Optional 128×128 `portrait.png` in the same folder + a `RACE_PORTRAITS`
   entry → shows in HUD panels/turn clock instead of the map sprite.
4. Verify a GLB before wiring (rigged? boneless?): parse its JSON chunk with a
   node script (see PLAYTEST_NOTES.md "Rigged 3D unit models").
5. Deliverable: hand the edited sprites.js back via chat (RULE #1).
Legacy path: per-character Meshy `..._Animation_<Name>_withSkin.glb` clips
(must be exported FROM that character — direct cross-character playback warps
the mesh) still wire via `_mk3d(folder, prefix, {slot: Clip})` and are the
automatic fallback when the library fails or a def sets `noAnimLib: true`.
Kill-switches (console): `window.EW_DISABLE_3D_UNITS = true` (all 3D),
`window.EW_DISABLE_ANIM_LIB = true` (library → per-character Meshy clips).

## Key facts
- Server: `npm start` → http://localhost:3000.
- External assets load behind TLS inspection → Playwright needs
  `ignoreHTTPSErrors:true` and `--use-gl=swiftshader` (already in playtest.js).
- Turn model is blitz (`GAME.state._blitzActiveUnitId`); the engine auto-plays AI
  (P2) units and waits when a local P1 unit is active.
- TDM/FFA score is `state.matchKills`, NOT `state.matchScores`.

## Conventions
- Don't run auto-sim/dev-sim for playtesting — play P1 manually.
- `node_modules/`, `package-lock.json`, `shots/` are gitignored; commit code + docs.
- Dev branch: `claude/great-cray-5OS8X`. NOTE: in this environment BOTH `git push`
  and the GitHub API/MCP return 403 for the agent — Claude cannot write to the repo.
  To persist new files, hand them to the user (SendUserFile) to upload via GitHub
  manually. Don't waste time retrying pushes.

