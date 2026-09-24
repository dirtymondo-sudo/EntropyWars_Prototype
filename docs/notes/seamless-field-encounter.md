# Notes: seamless-field-encounter

Moved verbatim from CLAUDE.md on 2026-09-24 (sections in original order). Encounter, Phase 9 field stages, Seamless Field deliveries 1-10.
Append new notes for this system at the end of this file.

## THE ENCOUNTER — PLAYER-INITIATED (HQ plan 9.4 stage 1) — 2026-09-15 rev 16 / rev 17 THE CLICK, local delivery
**Never random (the user's rule).** In a WILD room (data.js
`hqEncounterRoomOk(roomId)` = `hqRoomSite` non-null — a site's board room
or a complex part; the facility is safe by construction) the officer
**LEFT-CLICKS with the door gun HOLSTERED** (rev 17, the user's
correction: "when you are not wielding the gun, clicking should do the
attack; press F and wield the gun, then clicking places a door" — the
1 · 2 · 3 · 4 keys are GONE, there is one gesture, the walker's
basic-attack clip: the def's `basicAttackKind` → `_attackChainFor`) —
three-renderer.js `_hqStrikeClick()` plays the one-shot on the walker's
rig (`pl.strike`, LoopOnce; the walker squares up on the camera's aim)
and takes `_hqEncounterAim()` = the nearest `hqEncounterCharOk` character
(a native / roster draw; never the cast, an agent, the online shift, the
clone) within `reach` 3.4 m, in the 55° aim `cone`, with `_hqLosClear`
line of sight (blockers except people, rock / raised cells, doorway
walls); `opts.onStrike` fires at once (the toast), `opts.onEncounter` on
the clip's STRIKE FRAME (`_slotStrikeMs`, else 380 ms) — guarded by `_hq
=== H` so a room change under the swing never lands. THE CLICK RULE in
`H.onMouseDown`: the door gun DRAWN reads the click first (LEFT places,
RIGHT holsters — never an attack); holstered, a LEFT click with the
pointer LOCKED strikes at once, the first (unlocked) click only grabs the
pointer, and with the lock refused a left click that did not drag strikes
on mouseup (`H.drag.strike`). `HQ_ENCOUNTER_RULES` = `{ reach, cone, dy,
cooldownMs, trigger: 'click', gesture: 'attack', labels }` — no `gun`, no
`keys`; `hqEncounterGesture('click')` → `'attack'`. API: `hq.strike()`,
`hq.encounterAim()`. map.js `_hqEncounterFire(ev)` →
data.js **`hqEncounterLaunch(roomId, ch, cfgRaw, { gesture })`** (pure:
the site, `delta: true`, the STICKY CONFIG `hqEncounterConfig` off
localStorage `ew_hq_encounter_cfg` — written by `_msConfirm` for every
crossing filed from the building, Clash / Gauntlet fall back to Arena ·
4 — the roster = the native's race first + `hqMissionPool`, `doorId:
'crossing'`) → `_hqEncounterStart`: THE LAST ROSTER (`_hqLastParty`)
rides `window._hqEncounterParty` into **`_msConfirm`**, which runs every
config rule as today and then seats it (`_hqApplyLastParty`), randomises
the CPU, `applyPartyBuild(false)` + `startMatch()` — NO party builder;
no roster on file → `_hqLaunchMission(...)` (the terminal, once).
`window._hqEncounterRun = { site, room, race, label, gesture, date, eye,
noIntro: true }`: battle.js `_introCineEligible` + the leaf warm-up skip
the intro PER LAUNCH (never `EW_DISABLE_INTRO_CINE`); the commit (before
the Code Red block) consumes it win or lose → `hqEncounterRecord(p, ev)`
→ `door.hq.encounters = { count, wins, losses, last }` (`hqEncounterLog`
reads; the OFFICER sheet's ENCOUNTERS row) and `window._hqEncounterResult`
→ `_hqReturnOrMenu`: a LOSS re-enters at `medical` (the ward, Part C row
30), a win at the console; a toast either way. The prompt reads `[CLICK]
ATTACK · ENGAGE` while holstered + aimed. Off: localStorage
`ew_hq_encounter = 'off'` / `window.EW_HQ_NO_ENCOUNTER`. VS-CPU only
(RULE #2 — `isOnlineMatch` refuses). `npm test` runs
`hq-encounter.test.js`. NOT BUILT: the walker's eye as the first battle
frame (the event carries it; three-camera.js has no initial-pose API),
the `spawnSide` mirror, the dissolve, a cleared-room rule. UNSEEN LIVE
(RULE #1c): the one-shot on the Player cast rig, the strike timing, the
builder-less first frame, the ward landing.

## THE ENCOUNTER stage 2 — THE EYE, THE CLEARED ROOM, THE GUARDED ENVELOPE (HQ plan 9.4) — 2026-09-15 rev 24, local delivery
**THE EYE (seam 2)**: three-camera.js **`ThreeCamera.seedPose(seed, easeS)`**
(+ `seedState()`) is the ONE initial-pose entry point: `seed = { tx, tz, up,
dx, dy, dz, look }` in TILES (`up` above the ground under the eye's column,
read through `_groundYWorld`); the next `sync()` — both branches — starts the
smoothed state THERE, renders that frame as the seed, then damps home with
time constant easeS / 3; `snapImmediate()` is IGNORED while the seed eases
(a match start snaps the camera; the seed survives it). The renderer's
`onEncounter` payload carries `eye` (`_hqEncounterEye`: the HQ camera's
position + gaze in room metres, the ground under it) and `board`
(`_hqEncounterBoard`: `{ N, C, half }`, null in a cave / a complex part);
data.js **`hqEncounterEye(ev)`** (pure) → the seed; map.js files it on
`window._hqEncounterRun.eye` (`walker` = the raw pose); battle.js
`showVSSplash` seeds it and returns — an encounter has NO VS card and no
cinematic. **THE CLEARED ROOM**: `hqEncounterRecord` writes a WIN to
`door.hq.cleared[roomId] = { date, ids }` (the native's spawn id rides the
run marker as `id` → the commit); **`hqEncounterCleared(profile, roomId,
now)`** = today's clearing or null; `_hqSpawnPopulation` leaves those ids out
(`hq-native-<spot>` / `hq-npc-<draw>`) until tomorrow. **THE GUARDED
ENVELOPE**: **`hqRoomGuarded(roomId)`** = a wild room with a race-hinted
`npcSpots` row → `hqBuildFinds` marks its pay row `guard: true`;
`hqFindsInRoom` hides a guarded row until the room is cleared today (51
rooms; one line to strike). **THE WARD**: `hqMedicalRecord` → CONDITION
`RECOVERING` (+ `exited`) the day you were exited from a wild room; leave
outranks it. **NOT BUILT, with the reason**: the `spawnSide` mirror — the
spawn zones (map.js `state.spawnZones[1]` = P1's ROW) and the Arena's
`spawn1` / `spawn2` nexus points are keyed by seat + row, never by `SPAWNS`;
a lane swap seats P1 on P2's spawn nexus. Never swap `SPAWNS` alone. Seam
(3) the dissolve is open. `npm test` runs hq-encounter.test.js (17).
Unseen live (RULE #1c): the eased move from the boom to the frame, the
emptier walkway, the envelope after a win.

## PHASE 9 DELIVERY 1 — THE LEDGER + the open edge + the Works' kit doors (2026-09-16, local delivery)
PHASE9_QUALITY_PLAN §9's Delivery 1, plus two rules of the user's. **B1 THE
STABLE TAPE ID**: data.js `DOOR_TAPES[i].id` is `<sheetKey>#<slot>`
(`prebuilt_revenge#0`) — the claim a profile files (`taken['tape:<id>']`,
`tapes[]`); `num` ('T077') / `no` are the DISPLAY number, recomputed per
build (map.js `_hqTapesHtml` prints `num`, files `id` in `data-tape`).
`hqTapeById` accepts either; `hqTapeLegacyId` / `hqFindLegacyId` read a
positional claim as the tape at that position today (`hqFindsRecord`
migrates on every read). Adding a site never renumbers a collection.
**B2 THE LEDGER**: the claims live in TWO places and `hqFindsRecord` is
their UNION — `door.hq.finds` (the building's local record + the pay tally)
and **`progress.hq.finds.taken`** (the SYNCED blob: `mergeProgressBlobs`
carries `hq.finds.taken` — `true` beats a date, two dates keep the later,
`FIND_RE` + `ACH_MERGE_CAPS.finds`; profile.js `profileLoadProgress` folds
the local record in on every read). `hqCollectFind(profile, id, now,
{ serverPays })` writes both; with `serverPays` (map.js `_hqTakeFind` passes
`PS.hasServerAccount()`) the local wallet is NOT credited — the take
schedules the debounced push (`PS.scheduleProgressSync`, exported now) and
server.js `/api/progress/sync` pays every newly-merged `pay:` claim once
through data.js **`hqFindsSyncPay(before, after)`** (`ACH.findsPay`; on the
FIRST sync too — a local credit never reached the server). A profile with no
v2 blob never gets one invented (`hqFindsSyncedTaken`). **Hardening**: the
encounter marker carries `armed: true`; battle.js `startMatch` spends it on
its own launch and DROPS a stale one on any later match. **B3 copy**: map.js
`_hqEncounterBoardCopy(board)` — THE ROOM IS THE BOARD on a board room, THE
SITE IS THE BOARD from a complex part / a cave. **THE OPEN EDGE** (the rule
above): no outdoor battle room wears facility walls. **THE WORKS WEAR THE
KIT** (the user: "the doors in the works need to be the GLB doors, not
procedurally generated ones — visual consistency"): three-renderer.js
`_hqWorksLeaf(U, w, h, i, knobSide)` = a catalogue leaf from
`_HQ_WORKS_LEAVES` (16 plain leaves, never a rank leaf) cloned through
`_miscModelInstance` + `_hqPropMatPick`, fitted to w × h on its bottom edge
facing +Z, the `_hqMiniDoor` panel a hidden STAND-IN once the file lands —
the belt, the arm's gripper, the pallet, the furnace, the vine, the shelf
all take it (hq-stage2.test.js insists no proc builds a panel of its own).
Still open from §8: D1 (return to the swing spot), D2 (the native's
identity), the dissolve, D3–D9. `npm test` 1439 / 0 / 4 skipped. UNSEEN
LIVE (RULE #1c): the open Stadium / Camelot / city rooms without their
walls (the link doors and the wardrobe stand alone on the north line), the
kit leaves at 0.2 m on the vine, the ledger's toast wording.

## PHASE 9 QUALITY REVIEW — the brief reconciled (2026-09-16, docs only)
`PHASE9_QUALITY_PLAN.md` is the ACTIVE Phase 9 specification (§1: one answer per
behaviour — read it before the plan's Phase 9 section, whose superseded bullets are marked
in place) plus the findings and the plan. Before the finds go live, ship §8 items 1–2:
**tape ids are POSITIONAL** (data.js `DOOR_TAPES` numbers T001… by `siteRooms.built` +
`HQ_TAPE_SHEET` order; claims are `tape:Tnnn` — give every sheet row a stable key and make
`Tnnn` display-only) and **hazard pay is a local credit the server wallet overwrites**
(`hqCollectFind` → `profile.account.gold`; `serverSyncProgress` → `_syncEconomyToLocal`
replaces it; `door.hq.*` is not in the synced progress blob — put a monotonic `hq.finds.taken`
map in the blob and let `/api/progress/sync` pay each new `pay:` claim once). From a complex
part or a cave the encounter fights the SITE'S Δ with no eye seed — the toast must not say
THE ROOM IS THE BOARD there. THE FIELD (§11: the room's own lattice as the 8×8 window,
in/out cells, heights clamped so walker-reachable ⇒ unit-reachable, units snapped to cell
centres at the strike frame, explicit spawn cells per seat, the battle built at the room's
transform behind a 0.6 s dissolve) and THE LOOK (§10: one material path, one light rig, THE
WORLD in the open room, the room's furniture in the battle) are staged there; the user's
decisions are §14. `npm test` at HEAD: 1438 / 0 / 4 skipped.

## PHASE 9 DELIVERY 2 — THE ENCOUNTER'S TRUTH (D1 · D2 · the dissolve) (2026-09-16, local delivery)
PHASE9_QUALITY_PLAN §8 items 3 + 7. **D1 THE SWING SPOT**: the run marker's
`walker` (feet + camera yaw at the strike) rides home on `_hqEncounterResult`
(battle.js commit); data.js `hqEncounterReturnSpot(result)` → `{ x, z, y, face°,
swing }`; map.js `_hqReturnOrMenu` lands a WIN there when the strike's room is
the return room (a loss = the ward, another room = the console); three-renderer.js
`_hqGoTo` accepts the FREE-SPOT form (any object with numeric x / z: the
walkable surface at the recorded level, the recorded heading, `faceAway`
ignored) before its door scan — use it for any "stand exactly here" landing.
**D2 THE LEAD**: `hqEncounterLaunch(...).encounter.name` = the room's label for
the native; `hqEncounterLead(enc)` validates race / gender / name; state.js
`optimizeRandomizeParty(2)` pins P2's SEAT 1 to it off `_hqPreselect.encounter`
(`randomizeIdentity(false, race)`, the gender, `sanitizeUnitName`) — the enemy
lead IS the character you hit. **THE DISSOLVE (seam 3)** = a 2D CROSSFADE, not
the material dissolve: `_hqLeave({ dissolve: true })` → `_hqDissolveStart` renders
the room once more and copies it over the canvas IN THE SAME TASK (the drawing
buffer is not preserved across tasks), disposes the room, holds 150 ms, fades
600 ms (`HQ_DISSOLVE_MS`); THE EYE seeds the battle from the same viewpoint.
Only `_hqEncounterStart` asks for it (map.js `window._hqLeave(opts)` passes it
through; a screen / menu exit still cuts). Off: `EW_HQ_NO_DISSOLVE`, reduced
motion. Any test that anchors on `window._hqLeave = function (opts)` reads the
new signature. `npm test` 1444 / 0 / 4 skipped. Unseen live (RULE #1c): the
crossfade's feel, the swing landing on a tier, the lead's nameplate. Next in
§8: items 5–6 (Delivery 3 — THE GUN READS: the ghost's refusal reason, the A/B
shape cue, the hatch-loop cap + the F-hold escape).

## PHASE 9 DELIVERY 4 — THE MAP REMEMBERS (D6 · D7 · D8 · D9 + THE LIP) (2026-09-16, local delivery)
PHASE9_QUALITY_PLAN §8 items 8 + 9. **D6 DISCOVERED ROUTES**: a world-graph link
is CHARTED when the officer walks one of its doors — map.js `_hqRecordVisit` on a
`link_<id>` door → data.js **`hqLinkSee(profile, id)`** (the ONE write; both
records: `door.hq.links.seen[id] = 'YYYY-MM-DD'` + the SYNCED blob
`progress.hq.links.seen` — `mergeProgressBlobs` carries it, EARLIER day wins,
`ACH_MERGE_CAPS.links` 512; profile.js folds the local record in on every read
like the finds; **ship data.js to Render too**), the caller saves once, a first
sighting toasts ROUTE CHARTED. Reads: `hqLinksSeenRecord` (the union),
`hqLinkSeen`, `hqWorldCharted(profile)`, and **`hqWorldRoutes(curRoom, { profile
})`** marks every leg `seen` / station `known` (`hqWorldApplyKnown`: here, a
FACILITY room, or a charted leg touches it) — no `opts` = no marks. THE WORLD
tab (map.js `_hqWorldHtml`) draws an unseen leg DOTTED (`.hq-world-unseen`), an
unknown stop as a hollow `?` + an UNCHARTED row; **GO stays on every stop** (the
user's rule, C row G). **D7**: `room.quiet = true` (the attic, the airlock) =
a tape and NO envelope (`hqBuildFinds`); the Spaceship's reveal is
`sun_viewport` (three-renderer.js proc + ticker) on the bridge's bow wall.
**D8 THE LEARNING SEQUENCE**: data.js `HQ_GUN_LESSONS` / `hqGunLessons()` (six
rows, `draft: true`, A15), catalogue `lesson_plaque` (wall) / `lesson_sign`
(a post) → proc `lesson_plaque(U, p)` — **`_hqProcProp(name, p)` hands a proc
its own placement row now** (a builder ignoring the 2nd arg is unaffected);
the six rows sit in training · the haunted hall · the foyer · upsidedown · the
stairwell · the Singularity's flavour (`lesson: '<id>'`); the hall's tape is
PINNED on the landing (`findSpots`, `y: 2.9`). **THE LIP (item 9)**:
`hqFindHardReach(row)` (data.js) proves every `hard` board find has a shot
from a walkway point — it FAILED on the gun as it stood (a 3.5 m top is
invisible from a 1.6 m eye; a wall exit lands at the base), so
`HQ_PORTAL_RULES.ledgeSnapM` (0.9) + three-renderer.js `_hqPortalLedgeSnap`:
a WALL hit on a raised board cell's side within 0.9 m of its top = a FLOOR
door ON the top, 0.55 m in (never in a cave; the ghost says THE LIP · ON TOP).
**D9**: `node check-find-spots.js --suggest` audits every find (spot · relax ·
distance · lesson · the case for a pin); the ~20 pins are the user's (§14 E).
`npm test` runs `hq-map-remembers.test.js`. NOT built: D5's blob keys, D7
variant beats for the Dutchman / Strip / Downtown, D3d. Unseen live (RULE
#1c): the dotted map, the plates, the post, the sun's pass, the snap's feel.

## PHASE 9 DELIVERY 5 — THE SYNCED BUILDING + THE THREE REVEALS (D5 · D7) (2026-09-16, local delivery)
PHASE9_QUALITY_PLAN §6 D5 + the rest of D7. **D5**: `hq.cleared` / `hq.encounters` /
`hq.skate` ride the progress blob beside the finds and the links (data.js
`mergeProgressBlobs`, MONOTONIC: the later day + the ids' union; per-field max +
the later `last`; the best line by score; `ACH_MERGE_CAPS.cleared` 256 ×
`clearedIds` 32). RULE: every READ is the UNION of `door.hq.*` and
`progress.hq.*` (`hqEncounterLog` / `hqEncounterCleared` / `hqSkateRecord` —
never read `door.hq.encounters` or `.cleared` or `.skate` directly again),
every WRITE continues from the union and lands in BOTH (`hqEncounterRecord` /
`hqSkateBank` → `hqSyncedHq(profile, true)`, which never invents a v2 blob);
profile.js `profileLoadProgress` folds the local record in through
`hqDoorSyncFold(prog.hq, p.door)`. `portal` and `punch` stay local. **Ship
data.js to Render as well as R2** (the server merges off it). **D7**: the last
three complexes' reveals are VARIANTS on the parts (never new rooms; rolled on
a fresh arrival like Room 86, the way in re-plated): `site_prebuilt_revenge_
gundeck.variants.battle_stations` (night / p 0.25), `site_prebuilt_strip_
casino.variants.dead_hour` (3–6) + `.jackpot` (p 0.2), `site_prebuilt_downtown_
subway.variants.rush_hour` (7–10) + `.last_train` (0–5). A variant on a part
keeps the identity the room's test pins (the casino: no clock, no window, one
door, eight machines; the platform: nobody on the track; the gun deck: the
guns where they stand) — hq-synced-building.test.js runs every beat through
the urban / Dutchman prop rules (landings, the spawn, the lights ≤ 10). Dev:
`?hqvariant=jackpot`. Lines are Claude's DRAFT (A15). `npm test` runs
`hq-synced-building.test.js`. Unseen live (RULE #1c): all five beats.

## PHASE 9 DELIVERY 6 — THE FIELD, STAGE A (the seamless encounter) (2026-09-16, local delivery)
PHASE9_QUALITY_PLAN §11.3 stage A, the user's rules: no VS screen, one click
back to where you were walking, TDM (Arena with a Cube / Code Red), a loss
wakes you in your office or the ward, "forget spawn zones — slid to the
nearest square tile, right up close to each other". **THE LATCH**: battle.js
`_encMatch` (module-local, never on `state`) is the run for THIS match, set in
`startMatch` from the armed marker; `_encRun()` is the ONE read for the intro
gate, the leaf warm-up, the VS card, the eye and the commit — nothing that
touches `window._hqEncounterRun` after the launch can bring the card back;
`window._ewEncounterField()` publishes its field; a rematch / a plain match
clears it. **THE FIELD RECORD** (data.js, after `hqEncounterEye`):
`hqEncounterField(ev)` = the board (or null), both feet, the walker → native
HEADING, the raw eye, and on a board the two CELLS (clamped in from the
walkway, never shared) + `snap` (their centres, room metres);
**`hqEncounterSeats(field, { W, H, n1, n2, free })`** = the START of both
parties: P1 seat 1 the walker's cell, P2 seat 1 the native's (no board → the
map's centre, P2 one cell east), each nudged to the nearest FREE cell, the
rest of each party on its own side nearest its lead; `free` is the caller's
walkability. map.js `autoGenerateSpawnZones` → **`_encounterPlaceSeats()`**
(a free cell = `_respawnTileSafe` + a walkable surface + nothing landing-
blocked) seats the units and the row relocation SKIPS them — the zones and
SPAWNS stand as before, so a TDM respawn still comes home to the team's row
and Arena's spawn nexuses are untouched. **THE SLIDE**: map.js
`_hqEncounterFire` → `ThreeRenderer.hq.encounterSnap({ walker, target,
targetId }, HQ_ENCOUNTER_RULES.snapMs, cb)` — three-renderer.js `H.snap` owns
the walker's frame (`_hqTickSnap`, smoothstep, no input, both bodies squared
up, the native's group moved) and the launch fires from its callback with the
eye re-read (`hq.encounterEye()`); a room with no board starts at once.
**THE EYE WITHOUT A BOARD**: `hqEncounterEyeFromSeats(field, seats)` (routed
through `hqEncounterEye(field, seats)`) hangs the camera's offset, rotated by
the heading, on P1's lead at `tileM` per tile — battle.js seeds it from
`field.seats` once the zone builder placed them. **THE MODE**:
`hqEncounterConfig(raw, ctx)` = `gm` TDM, `gmCodeRed` Arena when the site is
today's uncleared Code Red (map.js reads `hqCodeRed` and the encounter IS the
response — `L.codeRedRun` → `window._hqCodeRedRun`, `codeRed` on the
preselect); only the sticky TEAM SIZE is kept, rounds are the mode's own.
**NO ROSTER ON FILE** = a stand-in squad (`party.fallback` →
`_hqApplyLastParty` pads, `_msConfirm` randomises identities + loadouts),
never the terminal. **THE WAY OUT**: battle.js `_encounterResultButtons()`
replaces the result bar with ONE button (▸ BACK TO THE ROOM / ▸ WAKE UP →
`backToMainMenu` → `_hqReturnOrMenu`); `showResultOverlay` restores the
standard bar first when the last match left the encounter's. **WHERE YOU
WAKE**: `hqEncounterWakeRoom(profile)` = the ward on an odd loss count, your
office (Room 101) on an even one (the commit already counted this exit);
`_hqReturnOrMenu` lands there (`encRes.wake`), the toast says which. NOT
BUILT (stage A's rest): the battle at the room's transform with the room's
furniture as the setting (§10 stage 4), explicit spawn zones per seat for
respawns, the rasteriser (stages B–D — a cave / a complex part still fights
the site's Δ from its centre). `npm test` runs hq-encounter.test.js (30).
UNSEEN LIVE (RULE #1c): the slide's feel under the strike clip, the eased
first frame off the seats, the stand-in squad's identities, the one-button
card over the podium.

## PHASE 9 DELIVERY 7 — THE FIELD, STAGE A rev 2 (the seats are the zones, the board untouched) (2026-09-16, local delivery)
Delivery 6 seated the parties on their cells but the zone builder still ran its
ROW pass first — the site board's two edge rows were FLATTENED and their egress
rows rewritten for a fight the walker had just crossed, a TDM respawn came home
to an edge row and a Code Red Arena fight put spawn nexuses there. Now map.js
`autoGenerateSpawnZones` takes THE FIELD branch right after the custom-map one
(`_encounterPlaceSeats()` → `{ zones, index, seats }`): the seats ARE the zones
— data.js **`hqEncounterZones(seats)`** = `{ 1: [cells], 2: [cells], field: true }`,
EXPLICIT PER SEAT (`_spawnIndex` = the seat, `SPAWNS` = the seats) — and the
builder RETURNS: no row, no flatten, no egress rewrite, no `_initArenaSpawnNexuses`.
**`isFieldSpawnZones()`** (map.js, on `window`) is the ONE read every zone PERK
gates on: `getSpawnZoneOwnerAt` → 0 (the end-of-round regen / scorch skips; the
nexus branch is untouched), the Arena spawn nexuses stand down, three-renderer.js
skips the spawn wash / the sanctuary curtain / the minimap tint on a `field`
record. The respawn readers (`getRespawnZoneFor` → `section: 'home'`, recall,
Gauntlet reinforcements) keep the tiles — a respawn comes home to the seat you
started on. **`hqFieldTransform(board)`** (data.js, on `window`) is THE ONE
room-metre ↔ tile rule (`toTile` / `toRoom` / `cellOf` / `centre` / `inside`);
`hqEncounterField` and `hqEncounterEye` read it — never write `(x + half) / C`
again. Nothing relayed (an encounter is VS-CPU; `field` is a plain boolean on a
synced object). `npm test` runs hq-encounter.test.js (33). UNSEEN LIVE (RULE
#1c): a respawn landing on a mid-board seat beside the enemy, the Code Red
fight with only the centre nexus. Still open in stage A: §10 stage 4 (the room's
furniture as the battle's setting), §14 B (the party's arrival).

## PHASE 9 DELIVERY 8 — THE FIELD, STAGE B (the rasteriser on the cave) (2026-09-16, local delivery)
PHASE9_QUALITY_PLAN §11.3 B: "anywhere you stand becomes the 8×8" — a CAVE
chamber (no Δ under the walker; it fought Hollow Earth's board from the centre)
now fights ITS OWN WINDOW. data.js, the block after `hqEncounterWakeRoom`:
**`HQ_FIELD_RULES`** (size 8, base = MF_DELTA_BASE_H, rockMin 3 / rockPad 2,
fluidMin −1, prefix `field:`), **`hqFieldRoomOk`** (stage B = a wild room with
a `cave` grid), **`hqFieldRaster(roomId, ox, oz)`** (the 8 × 8 of the cave grid
at origin (ox, oz) — off the grid / `#` = ROCK at max(rockMin, the tallest IN
cell + rockPad), every cell's `tile` = its height in BATTLE LEVELS: a plain
cell round(top / C), a ramp its middle, a fluid floor(sheet / C) ≥ −1; a
hazard the walker never enters is OUT but drawn as the liquid), **`hqFieldReach`**
(the walker's own step rule inside the window), **`hqFieldWindow(roomId,
walkerPt, targetPt)`** (THE WINDOW'S CHOICE: every origin holding both feet,
scored by the walker's reach inside it, then the nearest centre to the feet's
midpoint → `{ id, board: { N, C, x0, z0, cave: true }, cells, raster }`),
**`hqFieldBuild`** (the map entry through the forge's `_mfNew`: the shared
bed, the site Δ's tints, deep water / a bridge flooding the layer under them,
spawns = `hqEncounterSeats` over the IN cells — explicit per seat, rule §7),
**`hqFieldRegister`** (PREBUILT_MAPS + MAP_LAYOUT_PRESETS under
`field:<roomId>:<ox>,<oz>`, the site Δ's env → the cavern world + `near`).
THE GUARANTEE (rule §4) holds by construction — round() of half-levels never
splits a walker's step — and hq-field.test.js proves it on every window of
every chamber (2910 windows). `hqFieldTransform` takes an explicit ORIGIN
(`x0` / `z0`; a site board stays centred) so THE SLIDE / THE SEATS / THE EYE
read a cave like a board; **`hqSiteId` reads a `field:` id as its room's
site** (the CPU pool, the Code Red response, the checklist, the stamp).
map.js: `_hqEncounterFire` chooses the window in a cave and hands its frame
to the event as `board`; `_hqEncounterStart` → **`_hqFieldRegister`** (the
GAME_MODES row + an MS_MAP_LIST row wearing `field: true` — match-select.js's
card filter drops it) and launches the field id; the toast says THE CAVE IS
THE BOARD. **Two bugs the probe measured and fixed**: (1) THE SLIDE's
callback leaves the building INSIDE the walker's tick — `_hqFrame` now
returns when `_hq !== H` after the walker / the crossing tick (the frame
ticked a disposed room's `chars`); (2) D2's seat-1 pin NEVER FIRED —
`_msConfirm` nulls `_hqPreselect` long before `optimizeRandomizeParty(2)`;
the lead rides **`window._hqEncounterLead`** across the null and is spent
after the draw (state.js reads the marker first). **THE PROBE**:
`node playtest_field_offline.js [roomId]` (repo tooling — the offline HQ
harness + a strike; needs the server + `npm i --no-save playwright
three@0.128.0 react@18 react-dom@18 three.meshline`) prints the mode, the
zones, the units, the heights; PLAYTEST_NOTES "THE FIELD PROBE". Measured:
`field:site_prebuilt_hollow_earth_gallery:3,7`, TDM, the seats the zones, P1
seat 1 on the walker's cell, P2 seat 1 the Gnome wearing the room's name one
cell east, the ledge at +1 / the rock at +2 in the heights. NOT built: box
rooms (stage C), the window's thin walls / a door as a threshold (stage D),
the HUD of the field (E), the room as the battle's setting (§10 stage 4).
UNSEEN LIVE (RULE #1c): the real cave sheets on the field's columns, the
rock's height against the chamber's walls, the eye's first frame in a cave.

## PHASE 9 DELIVERY 9 — THE FIELD, STAGE C (the rasteriser on the box rooms) (2026-09-16, local delivery)
PHASE9_QUALITY_PLAN §11.3 C's rasteriser: a COMPLEX PART (a box room with no Δ
under the walker — the hall, the hold, the casino, the platform) fights ITS OWN
WINDOW like a cave since stage B. data.js (the stage B block, grown):
**`HQ_FIELD_RULES.box`** (cell = HQ_CAVE_CELL · cover 0.5 · margin 0.4 · the
bands low 0.5 / high 2.2 · footMin 0.7 · climbM 1.46 = the walker's jump apex ·
dropM · galleryRise / galleryRun = the renderer's constants, hq-field.test.js
diffs them); **`hqFieldRoomOk`** = a cave chamber OR a wild box room that is not
a site's BOARD room; **`hqFieldBoxInfo(roomId)`** = THE LATTICE (cells of a
battle tile on the room's axes, edges at off + k·C from the centre, `off` per
axis 0 or half a cell — the one that puts the most cells inside; a cell is IN
when ≥ 50 % of it lies inside and its centre stands 0.4 m off the wall) + THE
COVERS (every floor prop the renderer BLOCKS — `foot > 0` and `block` or
standing, top = `y + cat.h || 1`, the renderer's own read — as a box in room
axes; a disc as the square of its area, ignored under footMin; a cover on
≥ 50 % of a cell sets its top; `seat: false` on a cover) + the gallery through
**`hqFieldGallery`** (`_hqGalleryFrame`'s frame in data: the slab a +2, the
flight's treads at the run's middle → +1 then +2); cached per room OBJECT (a
variant swap re-rasterises). **`hqFieldBoxTile(top)`** = the band (< 0.5 the
floor · < 2.2 a +1 · else a +2). **`hqFieldLattice(roomId)`** is ONE shape over
the cave grid and the box lattice (`walk(gx, gy)`) for **`hqFieldWindow`**,
which nudges a foot in a partial edge cell to the nearest walkable
(`hqFieldNearestWalk`) and marks the board `box: true`. **`hqFieldRasterBox`**:
OUT = the room's WALL (rock in the shell's wall sheet), IN = the floor sheet at
its band. **`hqFieldBoxStep(a, b)`** = the walker's own step (up ≤ climbM,
down ≤ dropM, the flight + the slab one run) — `hqFieldReach` dispatches on
`R.box`; THE GUARANTEE (walker-reachable ⇒ unit-reachable) holds by the bands
and the test proves it on every window of every part. `hqFieldLayout(site,
base, { box })`: a box field is INDOORS — no `near`, no `motion`, THE WORLD
inert (`kind: 'room'`); the site's sky stands until §10 stage 4 draws the room
round the field. map.js `_hqEncounterBoardCopy` says THE ROOM IS THE BOARD in
a part. Nothing relayed (VS-CPU; RULE #2). NOT built: §10 stage 4, stage D
(the thin walls / a door as a threshold), stage E (the HUD). Measured: the
hall 56 IN / three heights, the platform 5 wide inside rock, the attic 15 IN
(the plan's "≥ 24" predates the measurement; the test pins ≥ 12). Unseen live
(RULE #1c): the wall sheets as rock columns, the +2 landing, the eye's first
frame in a box room.

## PHASE 9 DELIVERY 10 — THE ROOM ROUND THE FIELD (§10 stage 4) (2026-09-16, local delivery)
An encounter's battle is built INSIDE the room the officer struck from. three-renderer.js
"THE ROOM ROUND THE FIELD" (right before `_hqEnter`): **`_hqBattleRoom()`** reads battle.js
**`window._ewEncounterRoom()`** (the latched run's `room` / `field` / `fieldId`; null outside an
encounter — a plain match never wears a room) and answers `{ room, T, site, base, field }` for a
box room that is not a cave (a site room only when the board is its Δ); **`_hqBattleRoomMatrix`**
= ONE matrix, hqFieldTransform's rule (cell (0,0)'s NW corner on tile (0,0)'s, the floor on the
base top, `(ts / C) / U`); **`_hqBuildRoomInBattle(ctx)`** (from `_buildHorizonScenery` at every
`scene.add` site, after THE WORLD; **`_hqBattleRoomKey()` rides the horizon key**) runs the HQ
builders on a SCRATCH `_hq` record in a try / finally (`_hqBuildBoxShell` · `_hqBuildGallery` ·
`_hqBuildSiteDressing` · `_hqBuildDoors` · `_hqBuildCounters` minus the `battle` marker ·
`_hqPlaceProps`), filters the pieces (CSS2D plates; `_ew_hqPart` floor / ceil / pipe / strip on a
site room, `ceil` on a part; a site room's `_ew_hqGround`; a prop on a COVER cell —
`_hqBattleRoomCoverAt`, the raster's '2'..'9'), bakes each through the matrix and hangs them as the
occlusion fade's facility group: a piece wearing **`_ew_hqWall`** (every shell slab — set in
`slab()` — every box-wall door / seam / wall prop) goes into its side's `_ew_occWall` group, so the
wall between the eye and a unit fades. A scratch record's **`floorHole`** makes the box shell draw
its floor as four bands round the window (the field's columns fill it). **`_hqBuildSiteDressing`**
is the site board's tail (signs · signboards · masts · lamps · strips) split off so it can stand
without the board. RULES: any new piece of a box shell must wear `_ew_hqPart` (the bridge drops by
part); a builder that reads `_hq` must tolerate the scratch record (null profile / site / setting,
every list present); `HQ_BATTLE_ROOM_LIGHTS` (4) caps the room's point lights in a battle. Kill-switch
`EW_HQ_NO_ROOM_IN_BATTLE`. NOT drawn: a cave chamber (the cavern world stands), the console's
crossing (no marker), the tickers. `npm test` runs `hq-room-in-battle.test.js`. Unseen live (RULE
#1c): all of it — DOOR_HQ_BUILD_PLAN §9 lists what to eyeball first.

## PHASE 9 DELIVERY 11 — THE SWOOP + THE CAVE ROUND THE FIELD (the encounter's seam) (2026-09-16, local delivery)
The user's three notes: the cave fight opened under Hollow Earth's stars / nebula / floating crystal roster, a
loading card stood between the strike and the board, and the cut should be ONE camera swoop. **THE DARK
CEILING**: data.js `hqFieldLayout(site, base, { cave })` — a cave field is indoors like a box field (no `near` /
`motion`, `world: { kind: 'room' }`) AND `scenery: 'none'`, `stars: 0`, `nebula: 0` (the fog + tint stay; the
site's own EW_MAP_META row is untouched). THE WORLD's dissolve was never it (`_wd.stab` starts grounded).
**THE CAVE ROUND THE FIELD**: three-renderer.js `_hqBattleRoom` takes a cave (`R.cave`); `_hqBuildRoomInBattle`
runs `_hqBuildCave(copy)` on the scratch record BEFORE the shell; `_hqBuildCave` reads `_hq.floorHole` and draws no
floor / ledge / ramp / bridge / pool / glow inside the window (the field's columns stand there) — its ROCK is drawn
inside too (the crag encloses the field's short rock column), stalactites outside only. RULE: a builder that runs
on the scratch record reads `_hq.floorHole` for the window. **NO LOADING CARD**: battle.js `showBattleLoadingScreen`
— `_encMatch` takes the auto-sim path (warmers fire, microtask boot, models stream in). **THE SWOOP**:
three-camera.js tweens the seed (`_seedFrom` → the ideal, smoothstep over the window, `_seedT0 / _seedEase`) — never
a damp (a damp reads as a jump then a drift); the ordinary damp after the window. **THE DISSOLVE keyed on the
first frame**: `_hqDissolveStart(H, { onFrame: true, hold, ms })` holds the room's last frame until `renderFrame`
has drawn the battle once (`_hqDissolveRec` → `_hqDissolveFrame`; `hold` = the cap), then fades over `ms`; map.js
`_hqEncounterStart` asks `{ onFrame: true, hold: 1500, ms: 220 }`. `npm test` 1512 / 1508 / 0 / 4 skipped. Unseen
live (RULE #1c): the swoop's feel (`seedPose(eye, 1.4)`'s second argument is the edit), the fade's pop, the GLBs
popping in, the black sky over the chamber, the crag at the window's rim.

## PHASE 9 DELIVERY 12 — THE FIELD, STAGES D + E (THE EDGE + THE HUD OF THE FIELD) (2026-09-16, local delivery)
PHASE9_QUALITY_PLAN §11.3 D and E — the last two stages of THE FIELD. **THE EDGE (D)**: a box room's lattice
used to sit at offset 0 or half a cell, whichever gave the most cells; an OUT partial cell is a ROCK COLUMN filling
its whole cell, so its inside share stood INSIDE the room in front of the true wall (the hold: a metre of rock proud
of BOTH long walls; a door in that wall buried). data.js `hqFieldBoxInfo`'s `axis` now picks the offset per axis
among the exact alignments (a wall on an edge, the two partials shared, 0, half) then a 0.05 m sweep by the rock
PROUD of the walls — `HQ_FIELD_RULES.box.edgeSnap` 0.3 (flush) / `proudMax` 0.8 (the bound the test proves — a
residue r < 0.8 m goes on ONE wall, r ≥ 0.8 splits into two IN partials, nothing proud) / `doorWeight` 3 (a wall
with doors stays flush when the other is free) / `sweep`; `bi.edges = { w, e, n, s: { proud, flush, doors, at } }`,
`bi.colsX / colsZ`. **THE RIM + THE DOORS ON THE FRAME** (`hqFieldRimBox`, run by `hqFieldRasterBox`): every OUT
cell touching an IN cell wears `edge: 'wall'` + `proud`; `R.doors` = every room door whose landing lies in the
window (`{ id, wall, rim, x, y, inX, inY, proud, flush, link, wide }`, the rim cell marked `door`) — a RECORD only
(rule §10: the rim IS rock in the engine; `entry.field.doors / edges / dump`). **THE DUMP**: `hqFieldDump(R,
{ walker, target, seats })` (8 lines: `#` rock · `%` rock proud > edgeSnap · `.` floor · `1`/`2` up · `!` hazard ·
`D` a door's rim cell · W / T / a / b); **`node check-field-windows.js [--all] [--json] [room]`** prints every
wild room's window from its door landings — stage D's acceptance grid, the user's to read; `--json` is what the
test reads (never `process.exit` after prints in a tool the test spawns — a draining pipe lost the tail under
the parallel run). hq-field.test.js proves LEGALITY FROM EVERYWHERE (every cell the walker can stand on in every
wild room: both feet in, the walker's cell IN, reach ≥ 8, both squads of four seated; ≥ 1500 windows). Fixed on
the way: **a lead never displaces the other lead** (`hqEncounterSeats` holds the native's cell while the walker
is nudged off a table top). NOT built, by decision: the thin-wall primitive on the rim (a thin wall is vaulted /
hovered over / breached — a floor strip behind the true wall would not be sealed; the rock column is the honest
cell, the true wall is §10 stage 4's) and the door as the party's ARRIVAL threshold (superseded by the user's
seat rule, Delivery 6). **THE HUD OF THE FIELD (E)**: the scoreboard's mode line reads THE FIELD · TEAM
DEATHMATCH while an encounter is live (hud.js reads battle.js `_ewEncounterField()` + `HQ_FIELD_RULES.hudLabel`),
the result stamp reads HELD / EXITED · THE ENCOUNTER · the room · the native with the mastery flag after it
(battle.js `_stampHqSite` READS `window._hqEncounterResult`, never consumes it — the return spends it; a Code Red
cleared still outranks), the pause menu's OFFICER row says LAST <RACE> IN <ROOM>. **`hqEncounterRoomLabel
(roomId)`** (data.js, on `window`) is the ONE wording for where a fight was (a room's label; a site's board room
the site's label; never an id). `npm test` runs hq-field.test.js (18). UNSEEN LIVE (RULE #1c): the residue wall
(the attic's north, the casino's east, the subway's north — 0.25–0.75 m of wall sheet before the true wall), the
scoreboard line's width with the tag, the stamp's length on the card.

## LIVE COMBAT IN THE AREAS — the plan (2026-09-19, docs only)
`LIVE_ACTION_PLAN.md` is THE doc for the Skyrim-style live combat the user asked for
(dual-wield the seven spells, LEFT / RIGHT click per hand, a roll, a middle-click
weapon wheel, a HUD health bar). Read it before building any of it. The rule it
sets: live combat is a SECOND SMALL RESOLVER (THE LIVE ENGINE, a walker mode like
the ride) that reads the same spell ROWS and applies them to real-time ACTORS in
`H.chars`, reusing only the pure math (`computeSpellBase`, `getTypeDamageMultiplier`,
`STATUS_DEFS` fields) and the VFX through the forge stage's `VFX3D.stage` route with a
ground callback — never `doSpell` / `applyDamageToUnit` / `state`. A tile is 1.75 m:
`range × 1.75` = reach, `(aoeRadius + 0.5) × 1.75` = the blast radius, a cooldown
round = 2.5 s. §2.2 maps every kind class to a live delivery; §4 lists the decisions
the user owns (the roll key, the wheel's bind gesture, live vs tactical toggle,
followers). Nothing built; VS-CPU only (RULE #2 has nothing to relay).

## THE SEAMLESS FIELD, delivery 1 — THE TRUE GROUND (the encounter stands on the room, no board mesh) — 2026-09-22, local delivery
The user: "turn-based combat straight from exploration, same world, same screen, seamless; but keep the high ground —
there are ledges, bridges, rooftops." THE EXPERIMENT'S ROOM is the Haunted House's HALL (any BOX complex part
qualifies; a site's board room and a cave keep their columns; a TERRAIN room still fights its part's Δ — delivery 2).
**THE TRUE GROUND**: data.js `hqFieldBuild` files every IN cell's REAL top in room metres on the entry
(`entry.field.tops`, `null` for rock); three-renderer.js **`_fieldGround()`** (the block right before
`_hqBuildRoomInBattle`; keyed on the room + the window + the tile) reads it through `_hqBattleRoom()` and
**`_fieldGroundTop(x, y)` is the FIRST line of `tileTopY`** — every unit, tween, highlight, float and VFX ground read
lands on the room's floor, a table's top, a tread or the 2.9 m slab, never on `level × tile`; `rebuildTerrain` builds
NO column under a true-ground field (the shell's walls, the gallery's slab and the props ARE the geometry); the room
round the field keeps its WHOLE floor (`H.floorHole = null` after the pinned cut) and every prop (the cover drop is
skipped); `_fieldGroundDress` stands the shell's fluorescents + desk lamps in the battle through the matrix and arms
the room's height fog in the battle's frame (cleared in `deactivate`); `activate()` arms the gate
(`_fieldGroundArmed`, before the board builds) and holds the BUILDING'S exposure context; ui.js's HUD write holds the
DOM cycle at `day` while `ThreeRenderer.fieldGroundLive()` (the rules' clock is untouched). THE ENGINE IS UNTOUCHED —
a +2 slab cell is still level base+2 to every rule; it is DRAWN where the slab is. Kill-switch
`window.EW_HQ_NO_TRUE_GROUND` (data.js `hqFieldGroundOn`; `HQ_FIELD_RULES.ground.on`). **THE TIER RULE** (for
delivery 2, the terrain rooms — tested now): `hqFieldTierOf(topM, refM)` = a cell is a LEVEL only when it stands
≥ `ground.tierMin` (1.2 m) over the reference floor, one more per `ground.step` (1.75 m), capped `tierMax` — a
rooftop, a bridge deck, a plateau, a slab keep the high-ground bonus and the LOS step; a mound never earns one. KNOWN
in delivery 1: THE EDGE's residue strip (0.25–0.75 m of rock proud of a wall) is no longer drawn — the eye reads floor
the engine refuses; the battle's hemi / sun / dome still light the room over its own lamps (the room's rig is not
replicated); the crossfade stays as the safety net. `npm test` runs `seamless-field.test.js`. UNSEEN LIVE (RULE #1c):
the hall under the battle's sun, a unit on the slab, the treads under a move tween, the table tops, the exposure
through the cut, the residue strip.

## THE SEAMLESS FIELD, delivery 2 — THE FIELD WINS + THE TERRAIN ROOMS (the haunted house fights on its own ground) — 2026-09-22, local delivery
The user: "encounters in the haunted house still go to a voxel grid map, not what I wanted at all." TWO CAUSES, both in the
routing: (1) data.js `hqEncounterLaunch` handed every part with an area Δ (THE Δ AREA PASS) its `launchId`, and map.js
`_hqEncounterFire` gates the window on `!L.launchId` — so the hall's true ground (delivery 1) NEVER FIRED; (2) `hqFieldRoomOk`
refused every TERRAIN room — and every generated AREA (THE GROUNDS the bay door lands you in, the cave, the woods) is one, so
they fought the site's Δ. NOW: **THE FIELD WINS** — `hqEncounterLaunch` returns `seamless: true, launchId: null` for any room
`hqFieldRoomOk` takes; the area Δ is THE MARKER's fight only (`hqMarkerLaunch` — the crystal's "battle on the delta map") and
the fallback for a room the rasteriser refuses (a room with `terrain.sea` — a swim has no tile). **THE TERRAIN LATTICE**
(data.js, after `hqFieldRaster`; `HQ_FIELD_RULES.terrain` = cell · sub · cover · margin · treePad): **`hqFieldTerrainInfo
(roomId)`** = every lattice cell of a terrain room judged once (cached on the room against its compiled record — a fresh
survey / a variant re-rasterises): a battle tile per cell about the room's centre, IN when the WALKER'S OWN FEET RULE
(`hqTerrainFeet` free query, refused on the plan's solid (`hqTerrainMaskAt < solidPad`), under a trunk (`info.trees` +
`info.thicket`), on a face steeper than `maxSlope` — a wall's top and a deck excepted) stands on ≥ `cover` of `sub × sub`
samples AND at the centre (a centre on a tier's edge blend takes the median of its standing samples; a centre on the solid
is OUT whatever the samples say); `top` = the feet there (THE TRUE GROUND), `key` = the path sheet on a path / `water` on a
wade (`seat: false`) / the room's floor; a pool the walker never enters is a HAZARD cell in its liquid; a wall row's top
wears `wall`, a deck its `bridge` layer. **`hqFieldRasterTerrain(ti, ox, oz)`** = the window: OUT = rock in the room's cliff
sheet at `rockTile`, a hazard at its sheet's tier (else `fluidMin`), an IN cell's LEVEL = **THE TIER RULE** `hqFieldTierOf
(top, ref)` over the window's OWN lowest IN top (`R.ref`) — `step` 1.75 > the jump 1.46, so THE GUARANTEE (a walker's step
never splits two levels) holds by construction and seamless-field.test.js proves it on every window of the grounds;
`hqFieldTerrainStep` is the reach's step (up ≤ climbM, down anything); `hqFieldLattice` / `hqFieldRaster` / `hqFieldReach` /
`hqFieldWindow` (`board.terrain: true`) / `hqFieldBuild` (`entry.field.terrain / open / ref`; a hazard's top = its sheet) /
`hqFieldLayout({ terrain, open })` (no near, no motion, THE WORLD inert; an OPEN room keeps the site's sky + roster, a closed
one is a dark ceiling) dispatch on it. **THE RENDERER**: `_hqBattleRoom` carries `terrain`; `_hqBuildRoomInBattle` builds
the scratch record with `opts: { room }` (so `_hqBuildTerrain` finds the SURVEYED record by id) and runs **`_hqBuildTerrain
(copy)`** before the shell — the field mesh, the water, the decks / bridges, the walls, the rails, the trees, the scatter,
the outer ground to the fog, the treeline, a city's lots — and `_hqBuildClimbs(copy)` after the props; the true ground
(delivery 1) then stands every unit on it, no column drawn. map.js's copy reads THE GROUND IS THE BOARD. `check-field-windows
.js` sweeps terrain rooms only with `--terrain` (a compile is seconds a room). Tests: seamless-field.test.js (8);
hq-terrain / hq-woods / hq-field's `hqFieldRoomOk` pins flipped. KNOWN: a tier's CLIFF is one level to the engine (level
+1 is a step) — a unit climbs the porch's 1.6 m face the walker takes by the stair (the plan's rule 4 promises
walker-reachable ⇒ unit-reachable, never the converse); the water sheets and the traffic do not tick in the battle; the
hall's residue strip (delivery 1) stands. Ship data.js to R2 AND Render. UNSEEN LIVE (RULE #1c): the grounds under the
battle's night, the tiers' read against the engine's levels (the porch +1, the crypt +1, the gazebo roof +3), a unit on the
footbridge, the trees as rock cells, the treeline and the fog past the window, the eye's first frame on a slope.

## THE SEAMLESS FIELD rev 3 — THE LIGHT HOLDS · THE CLICKS · THE HELD SWOOP (2026-09-22, local delivery)
The user: "I don't want the lighting to change, it makes the transition really abrupt; still a rough transition; I can't
click on tiles when I am trying to move". **THE LIGHT HOLDS**: the battle WEARS THE ROOM — three-renderer.js
`_fieldGroundDress` rebuilds the room's rig in the battle's frame (the same numbers `_hqEnter`'s box branches use — keep
them in step) and hands the key + hemisphere to **`ThreePost.setFieldLight(o | null)`** (three-post.js: the sun IS the
room's key — colour · intensity · direction, the board's shadow frame casts it —, the hemisphere the room's, the ambient 0,
the exposure `_expLk()` alone (no day preset), the bloom the building's (`renderScene`'s rule, ONE `_bloomThrFor` site),
the night grade 0, the tilt-shift off round the composer render, `_ssaoApply` forced to `'hq'`; `setFieldLight(null)`
hands every dial back); the fill + the point lights stand under the matrix (a PointLight's `distance` is world units the
parent's scale never touches — metres × `s`, the battle's px per metre); the room's FOG goes on `scene.fog` (the density
re-based to battle px; restored on deactivate); the room-box AO is re-centred — `_HQ_AO2` is a vec4 now (`.zw` = the box
centre; `_hqAoArm` writes 0, 0 — the building's room stands at the origin); the room's pieces cast + receive the key's
shadow (`_hqShadowFlags` on the scratch record; the `castShadow = false` traverse is skipped under true ground); the
whole HQ light budget (`H.propLights = 0`); **the CEILING STAYS** (`drop.ceil = false`) and fades as the eye rises through
it (`_fieldCeilRegister` clones its materials, `_fieldGroundTick` from renderFrame eases the opacity by the camera's
height); the dome is SNAPPED to the room on the first frame (`_envSnapPending` in `_updateEnvironment` — the eased tint /
stars used to arrive over the first second); data.js `hqFieldLayout(site, base, { look, dome })` carries the room's
`shell.look` as `env.look` and paints a CLOSED room's dome its fog colour (`hqFieldRegister` reads the shell). **THE
CLICKS**: `_fieldPickBuild(ts)` (from `rebuildTerrain`'s field branch) puts one invisible double-sided quad per IN cell at
its real top in `terrainGroup` (`colorWrite: false`, `_ew_occSkip`) — `screenToTile` raycasts that group, and under the
true ground there was nothing to hit. **THE SEAM**: `activate()` → `_fieldGroundArm` opens a ledger gate (`adoptLive`)
and `ThreeCamera.seedHold(true)`; `_hqDissolveFrame` fades the held snapshot only when `_fieldDissolveReady()` (nothing
pending, or the timer already faded it, or the hold's cap) and releases the hold (`_fieldSeedRelease`; the timer's
`fade` releases too); THE SWOOP's clock is pushed every held frame, so the crane starts the frame the fade does; the
walker's LENS rides the eye (`fov` on `_hqEncounterEye` → data.js `hqEncounterEye` → `seedPose`), the first frame is
shot at it and the swoop tweens it to the board's — the 52° → 45° pop is gone. Pins kept: the room-in-battle test's
`drop` / `propLights` literals (overridden on the next line), hq-encounter's `if (_hqDissolveRec) _hqDissolveFrame();`,
hdr-bloom's three threshold sites + `_tmSync` before each composer render, premium-polish-3's `_ssaoApply('battle')`.
`npm test` runs seamless-field.test.js (rev 3 ×3). UNSEEN LIVE (RULE #1c): the first frame against the last, the
ceiling's fade, the room's shadow under the board's bias, the fog on the units, the dome past the walls, the FOV tween.

## THE SEAMLESS FIELD, delivery 4 — THE READOUT · THE BATTLE RADIUS · THE HAND-OVER (2026-09-22, local delivery)
The user: "in a larger area like the city or the sewers the frame rate tanks once the battle starts — can we not
only load a smaller portion of the map?" **`SEAMLESS_FIELD_PLAN.md` is THE doc for the seamless field** (the contract
of the three earlier deliveries, the causes, the rule, the seven steps — read it before touching
`_hqBuildRoomInBattle`; append to its §7). THE CAUSE was never loading: the walk's room was DISPOSED and REBUILT
whole (every builder, every GLB re-cloned) and every piece of a 200 m room stood in the battle. THE RULE: **a battle
keeps what stands within THE BATTLE RADIUS of its window, beyond it only a backdrop; the walk's room is HANDED to the
battle, never rebuilt.** data.js `HQ_FIELD_RULES.ground.keepM` (28 m) / `keepFarM` (48 m) / `handover`. three-renderer.js:
`_hqHandoverRules` (the reads + `EW_HQ_NO_ROOM_HANDOVER` / `EW_HQ_NO_BATTLE_RADIUS`); `_hqLeave({ handover: true })` (map.js's
encounter start alone) stashes the shell / door / prop groups in `_hqRoomHandover` AFTER the dissolve's snapshot and BEFORE
the disposal loop (a reflector's mirrored material put back); `_hqBuildRoomInBattle` takes the stash for the same room under
TRUE GROUND and runs NO builder (the shadow flags still run), else rebuilds as before; `_hqHandoverDrop` at `_hqEnter` /
`deactivate` / a new stash. THE RADIUS in `take`: `farOf(c)` = the piece's box (room px, `Box3.setFromObject`; a streaming
GLB by its position) against the window's rect — a prop / door / counter / lamp / car past `keepM` is not taken, a lot
(`_ew_hqLot`) / backdrop prism (`_ew_hqBackdrop`) / tree (`_ew_hqTree`) past `keepFarM`; anything wearing `_ew_hqPart`,
`_ew_hqTerrain`, `_ew_hqOuter` or a merged batch (its box spans the room) always stands; the battle marker
(`grp._ew_hqMarker`, set in `_hqBuildCounters`) and the atmosphere (`drop.fx`) never. THE READOUT: `_perfTick` in BOTH loops
(renderFrame + `_hqFrameGuarded`), **`ThreeRenderer.perf()` / `hq.perf()`** = `{ fps, ms, calls, triangles, points, lines,
geometries, textures, programs, field, hq, room: _fieldRoomStats }`, and the build ALWAYS logs one line (`[HQ→battle] <room>:
kept n · culled m (props p · scenery s) · radius 28/48 m · handed over`). READ THAT FIRST on any "the battle is slow" report:
the walk's `hq.perf()` against the battle's `perf()` in the same room. OPEN (the plan's steps 4–7): chunk the merged batches
(the terrain mesh, `_hqTexBatch`, the road paint, the treeline) so the camera / shadow frusta cull them, a STATIC shadow pass
(refresh on a move, not every frame), the occlusion blocker set bounded to the subject lines, SSAO at half res in a field.
`npm test` runs seamless-field.test.js (delivery 4 ×4). Ship data.js to R2 AND Render. UNSEEN LIVE (RULE #1c): all of it —
the CDN is unreachable from the sandbox; the numbers are the user's.

## THE SEAMLESS FIELD — THE SECOND PLAN (THE CUT) — 2026-09-22, planning only
The user: the hall is fine, a city ~10 fps; "slice a 12×12 chunk, 8×8 the map, the rest a moat / holo grid, keep the fog
and the weenies, strata under the 8×8 per room, puzzles later — are we doubling something?" `SEAMLESS_FIELD_PLAN.md` §8
is the answer and the order — READ IT before touching the field again. THE DOUBLING (read off the code): (1) the
occlusion fade's raycast (`_occComputeBlockers`) runs recursively over `_facilityNearGroup`, which under the hand-over
is the WHOLE room — a city's ~300 k-triangle terrain mesh + every merged batch, no BVH, with the board's five grid
points as extra subjects: ~600 rays/s × 3 × 10⁵ triangles — that IS the 10 fps (the walk never raycasts geometry;
`_hqCamBlocked` reads data); (2) the board's shadow frame draws the whole room on every dirty frame; (3) an open
terrain room builds the SITE's far roster while the ROOM's sky + weenies (`H.sky`) are not handed over. THE ORDER:
5 THE BLOCKER SET (merged meshes out of the raycast `groups`, the board-point subjects gone under true ground) · 6 THE
STATIC SHADOW · 7 THE CUT (a 12 × 12 chunk RE-CUT from the same data — `_hqBuildTerrain(copy, { rect })`, the lots /
paint / treeline filtered by rect; the moat = the world-dissolve edge into a holo grid plane, the room's fog, the room's
sky + landmarks handed over, never the site's roster) · 8 THE STRATA (`HQ_FIELD_RULES.beds[family]`; a column drawn
ONLY where `boardHeights` differs from the cell's filed level — Meteor / Flat Earth / Build work in a field) · 9 THE
SWITCH (a counter that launches a pinned window — the puzzle hook) · 10 THE POST. Nothing coded, nothing measured live.

## THE SEAMLESS FIELD, delivery 5 — THE BLOCKER SET · THE STATIC SHADOW · THE SKY ONCE (SEAMLESS_FIELD_PLAN §8.3 steps 5–6 + §8.1 item 3) — 2026-09-22, local delivery
The second plan's first three items, in its order. **THE BLOCKER SET** (three-renderer.js, the block right before `_occInit`; the 10 fps
in a city): under a true-ground field `_occComputeBlockers` never raycasts the facility group whole (three r128 has no BVH — every ray
tested every triangle of the handed-over city). `_occFieldBuild(group, mPx, HR)` (run at the end of `_hqBuildRoomInBattle`, after the
pieces landed in the facility group) lists the group's DIRECT CHILDREN (the holders = the fade roots) with a measured bounding sphere;
a root carrying a merged / ground mesh (`_ew_hqTerrain` · `_ew_hqOuter` · `_ew_hqGround` · `_ew_hqTexBuilding` · `_ew_hqRoadMark` ·
`_ew_hqRoad` · `_ew_hqBackdrop`, or over `OCC_FIELD_TRI_MAX` 40 k triangles) is OUT of the list AND every mesh of it wears
`_ew_occSkip` — the ground never fades, a wall does. Per ray `_occFieldCandidates` hands the raycaster only the roots whose sphere lies
within `HQ_FIELD_RULES.ground.blockerM` (2.5 m) of the eye→subject segment (+ the board's own three groups); the FIVE BOARD-POINT
SUBJECTS are gone under a field (the units + the focal tile are the subjects — the shell's walls are the only thing that hides them).
A streaming GLB has an empty box: judged by its position, re-measured every recompute until it lands; every sphere on `occRefreshS` (2 s).
The list dies with the facility group (`_occFieldDrop` at both null sites). Readout: `ThreeRenderer.perf().occ` = `{ roots, merged,
rays, tests, ms }` (the LAST recompute's rays / candidate roots, a rolling ms) and the build line prints `blockers n (m merged out)` —
READ THAT FIRST on a slow field: `tests` should read a handful per ray. **THE STATIC SHADOW**: under a field the depth-pass gate in
`renderFrame` reads `_shadowsDirty` + the lighting ease ALONE (`staticShadow`; `EW_HQ_NO_STATIC_SHADOW` = every moving frame as
before) — never a tween frame, a rig's idle, the fog's fade, a flyer's bob — and the four tween-end loops (walk · displace · jump ·
strike) stamp `_shadowsDirty` on a landing, so a moving unit's cast shadow lands with it. **THE SKY ONCE**: data.js `hqFieldLayout` says
`scenery: 'none'` for EVERY field (box and terrain; an open room keeps its stars / day / tint — the site's far roster was built and
animated over a room whose own sky vanished); `_hqHandoverStash` carries the room's own floaters + landmarks (`sky: { group, landmarks }`,
`_hqHandoverDrop` disposes them) and `_hqBuildRoomInBattle` hangs them under a matrix holder `hq_sky` in the HORIZON group, outside the
facility group (`_ew_occSkip` on every piece — never raycast, never faded; `roomSky` / `EW_HQ_NO_ROOM_SKY`); a rebuild (no stash) builds
the landmarks again on a scratch record (`_hqBuildLandmarks(Hs, …)` — the floaters are the stash's alone). RULES: a new merged / ground
mesh in the HQ wears one of the tags above (or the fade raycasts it); a field never builds the site's roster; the rules live on
`HQ_FIELD_RULES.ground` (`_hqHandoverRules` reads them with defaults). `npm test` runs seamless-field.test.js (19 — the candidate
arithmetic in a vm); hq-field / hq-room-in-battle's box-layout pins moved. Ship data.js to R2 AND Render. OPEN in the plan: 7 THE CUT
proper (the re-cut 12 × 12 chunk + the moat), 8 THE STRATA, 9 THE SWITCH, 10 THE POST. UNSEEN LIVE (RULE #1c): the CDN is unreachable
from the sandbox — the fps in Downtown / the Grid / the sewers / the cavern is the user's to read (`hq.perf()` on the walk vs `perf()`
in the fight), a unit's shadow lagging its walk until it lands, the room's floaters standing still over the fight, the landmarks'
scale through the matrix (HQ px × the battle's px per metre).

## THE ARRIVAL — the seam from the walk into the fight is ONE camera move (2026-09-22, local delivery)
The user: "still a little janky and it zooms out way too much to an over-the-board view; fluid, stylish, cinematic,
seamless, no cuts, no loads." THE CAUSE (read off the code): `_afterVSSplash` ran the stock `resetBoardCamera(true)`
after the seed, so THE SWOOP flew from the walker's eye to the BOARD'S OVERVIEW (zoom ≈ 1, tilt 40, yaw 45), the ROUND 1
card played, then the first activation pulled back in to the lead — two moves, a card, a 45° spin (the walker's heading
thrown away), and `getCameraMode()` re-applying the preset FOV popped the 52° lens to 45° mid-swoop. NOW: data.js
`HQ_ENCOUNTER_RULES.arrival` is THE table (`tilt` 50 · `zoomMult` · `lead` 0.42 · `swoopS` 2.1 · `settleMs` · `barsVh`
· `crane { bow, lookLead, fovLate }`); `hqEncounterYawOf(dx, dz)` (both eye reads carry `yaw`) and
`hqEncounterArrival(eye, lead, foe, opts)` → THE MEDIUM TWO-SHOT (pure, on `window`). battle.js (the block after
`_encRun`): `_encArrivalFrame()` SNAPS the 2D controller to the two-shot in place of the overview reset (the focal
between the officer's lead and the native's, `getTurnFramingZoom() × zoomMult`, the arrival tilt, THE WALKER'S OWN
YAW — `snap` files it as the fight's resting orientation, so the first activation is a slide, never a re-frame; C
restores the player's preset), `_encArrivalRound(cb)` replaces the ROUND 1 card (letterbox `.enc-arrival-bars` ride
the crane and retract before it lands; `body.enc-arrival` holds the HUD at opacity 0 and `enc-arrived` fades it in;
cb after `settleMs`; styles-cinematic.css "THE ARRIVAL"), `showVSSplash` seeds `seedPose(eye, swoopS, crane)` and keeps
`er.eyeSeeded`. three-camera.js THE CRANE: the swoop's third argument shapes it — an ease-in-out cubic (`_seedEaseK`),
the gaze `lookLead` ahead of the body, the eye bowed over the chord by `bow` × its travel on a half-sine, the lens held
at the walker's until `fovLate`; **`setFOV` under the tween writes `fovTo`, never the live lens**; a window that elapses
between two frames lands the record (it used to linger). No opts = the straight tween as before. Nothing on `state`,
nothing relayed (VS-CPU; RULE #2). `npm test` runs `encounter-arrival.test.js`; hq-encounter's two swoop pins moved.
UNSEEN LIVE (RULE #1c): the bow under a low ceiling (`crane.bow`), the tilt against the preset (`arrival.tilt`), the
bars on a wide screen, the fade's pace. A 9 × 9 / 10 × 10 window is `HQ_FIELD_RULES.size` + the reach / seat pins.
**THE FIRST STRIKE (same day)**: the user — "it makes me select my unit first before I can make an action". Measured with a
scratch offline probe (the field probe + a selection read): the engine DID auto-select the first active unit, but the first
activation went to the FASTEST unit (the catgirl, SPD 70) while the arrival framed the officer. Now the officer who swung
opens round 1 — battle.js `_afterVSSplash` sets `window._ewEncounterFirstId` to the walker's unit (`_encLeadUnit` off the
field's seat cell) BEFORE the order is built, state.js `buildBlitzTurnOrder` consumes it after the tutorial's hook (round 1
only, the unit to the front, the rest the SPD order), `startMatch`'s latch clears it. `buildBlitzTurnOrder` is a watched
function (TUTORIAL_MECHANICS `turn`): `first_steps` re-read (its copy states the SPD order of a plain match, unchanged) and
re-stamped. encounter-arrival.test.js pins it.

## THE SEAMLESS FIELD, delivery 6 — THE CUT + THE STRATA (dig and build in a field) + THE RED CI (2026-09-22, local delivery)
**THE CUT WAS UNDONE the same day (the next section) — the paragraph's CUT half describes code that no longer exists; THE STRATA and THE RED CI stand.**
**THE RED CI**: one stale source pin (hq-encounter.test.js's "a plain match starts with no latch" wanted the pre-FIRST-STRIKE
literal) — a regex now. **THE CUT** (SEAMLESS_FIELD_PLAN §8.3 step 7; `HQ_FIELD_RULES.cut = { on, moatTiles 2, fadeM 3, moat 'grid'
| 'flat' | 'none', outM 60, gridTiles }`, `EW_HQ_NO_FIELD_CUT`): a TERRAIN room's battle is built over the CHUNK = the window +
moatTiles a side (12 × 12). three-renderer.js `_hqBuildRoomInBattle` puts **`_hq.cut`** (room metres + fadeM) on the scratch
record; a handed-over room keeps its pieces (doors / props / counters) and DROPS the walk's shell group (the whole field's merged
meshes), re-cut by `_hqBuildTerrain(copy)` + `_hqBuildBoxShell` + `_hqBuildClimbs`; `keepM = keepFarM` = the moat's edge. RULE: a
builder that lays a merged mesh or a piece in a terrain room asks **`_hqCutHit(cut, x0, z0, x1, z1, pad)`** (no cut = true) before
it builds; the field's samples are `_hqCutRange(info, cut)` (the chunk + the fade band — the SAME samples); the outer ground, the
treeline, the sea, the traffic, the circuit are never built under a cut; the seed order stays (draw the rng, then test). THE FADE =
`_hqTerrainMat(info, S, cut)`'s `uCut` / `uCutFade` dithered discard past the chunk; THE MOAT = `_fieldMoatBuild` (four strips at
`R.field.ref` in the room's floor colour + a lattice pass at the tile pitch; `_ew_hqOuter` + `_ew_occSkip` + `_ew_hqMoat`); the
build line prints `cut 12×12 (moat grid)`. **THE STRATA** (step 8 — the user: "I still need to eventually be able to dig and
build"; `HQ_FIELD_RULES.strata = { on, beds[hub], fallback }`, `EW_HQ_NO_FIELD_STRATA`): data.js `hqFieldBuild` files
**`field.levels`** (every cell's engine height at the build), **`hqFieldBedFor(roomId)`** → `{ side, floor, hub }` (a room's
`terrain.bed`, else its hub's row, else the fallback — every key a terrain sheet); the renderer's `_fieldGround()` record reads
**`deltaAt(x, y)` = `getBaseHeightAt` LIVE − the level** and `yAt` = the true top + delta × the level step (every tween / float /
pick quad follows a dig or a raise at once); `rebuildTerrain`'s field branch runs **`_fieldStrataBuild(ts)`** on every
`_heightVersion` change: `_fieldStrataFaces(N, yAt, deltaAt, elev)` (pure) plans a top quad per moved cell (a raise the room's
floor sheet, a dig the bed's floor) and a face per edge where the top differs from the neighbour's (outward from the higher cell,
inward — the pit wall — into a dug cell beside an unmoved one, none between two digs) in the bed's side sheet, into `terrainGroup`
(`_ew_fieldStrata`). THE ENGINE IS UNTOUCHED (Meteor / Build / Flat Earth / reshape write `state.boardHeights` as on a board).
`npm test` runs seamless-field.test.js (26). Ship data.js to R2 AND Render. OPEN: §8.3 steps 9 (THE SWITCH) + 10 (THE POST); a
flooded dig draws no water under a field; the AI still forecasts a dig by the board's rule. UNSEEN LIVE (RULE #1c): the fps after
the cut, the fade under each fog, the lattice's brightness, the bed sheets in a crater.

## THE CUT UNDONE — the field is built whole round the window again (2026-09-22, local delivery)
The user: "undo the cut — it wasn't necessary any more, the frame rate was fine during battles now even
in the city" (delivery 5's BLOCKER SET + STATIC SHADOW were the fix). Backed out whole: data.js
`HQ_FIELD_RULES.cut`; three-renderer.js `_hqCutHit` / `_hqCutOf` / `_hqCutRange` / `_hqCutPtsBox`, every
`cut &&` guard in `_hqBuildTerrain` and the city / lamp / paint / stalactite / scatter builders, the
`uCut` / `uCutFade` dithered fade in `_hqTerrainMat`, the chunk branch of `_hqBuildRoomInBattle` (a
handed-over shell group stands whole again; `keepM` / `keepFarM` are delivery 4's radius), `_fieldMoatBuild`
+ its lattice texture, the `cut` read in `_hqHandoverRules`, `EW_HQ_NO_FIELD_CUT`; the three cut tests in
seamless-field.test.js (the rules test asserts the row is GONE). RULE: a TERRAIN room's field is built
WHOLE round the window (delivery 2–5's rule) — the outer ground, the treeline, the sea, the traffic and
the circuit build as before delivery 6. THE STRATA (`field.levels`, `hqFieldBedFor`, `_fieldStrataBuild`)
and THE RED CI fix are untouched. SEAMLESS_FIELD_PLAN §8.3 strikes step 7; the way back, if a room ever
needs it, is the plan's item 4 (frustum-culled chunks of the merged batches), never the moat.

## THE SEAMLESS FIELD, delivery 7 — THE HIGHLIGHTS CONFORM · THE LIVE LEVELS · THE WAY BACK (2026-09-22, local delivery)
The user's three. **THE HIGHLIGHTS CONFORM**: three-renderer.js `_fieldGroundSampler()` / **`_fieldGroundSampleAt(wx, wz, x, y)`**
(the block after `_fieldGroundLive`) is the SUB-TILE read of a true-ground field — a TERRAIN room's compiled height field
through `hqTerrainFeet` at the cell's OWN layer (a deck / a wall top resolves to the surface the unit stands on), the battle
point mapped to room metres by the matrix's rule inverted, the strata delta added, a refused sample (a wall, a hazard, the
solid) = the cell top, capped at `HL_FIELD_MAX_DY` (one tile) off it; a box room answers null (its cells are flat).
`_buildDrapeGeo` samples it at every vertex of the highlight grid (the field branch LEADS the stair and the landform
branches), so every move / attack / spell / inspect wash, the hover ring and the underfoot ring lie on the slope, the
bank, the ramp. The pick quads (`_fieldPickBuild`) stay flat at the cell top (a click on a steep cell lands a few px off
the drawn plate). **THE LIFT (rev 2, the same day — the user: "raised slightly so they don't get covered up by the
texture of the floor")**: a field plate rides `HL_FIELD_LIFT` (0.04 tile ≈ 7 cm) over the ground through `_fieldGroundLiftPx(ts,
hx, hy)` (added to the mesh's y in `_makeHlTile`; rock / off-window = 0) at `HL_FIELD_SEGS` 6 (the drape's grid, so the plate
follows the field between the 0.35–0.5 m samples) — the two constants are the edits if a plate still sinks or floats. **THE LIVE LEVELS**: battle.js `grantXP` no longer holds a story unit's XP — a kill / assist / trickle
lands on `_xp`, the level-up card, the cue and the burst play ON THE BOARD, `_recomputeStatsForLevel` climbs the stats
mid-fight (the unit was built at its ledger's level with its ledger's xp, so the ledger and the board agree); what the
unit earned is tallied on it (`_xpBattle`) and earning is FIGHTING (`_encFought`) — `spendAP` marks it too. THE VICTORY
SHARE (data.js `HQ_LEVEL_RULES.share = { fought: 1, present: 0.5, down: 0, poolMult: 0.6 }`; `hqPartyXpShare`): a WIN
shares the pool (`_encXpPool` = the natives' worth × `poolMult` — the kills already paid the killer live; the one dial)
with the WHOLE party — a body that fought takes the full share, one alive that never fought (the bench, an idle body)
the present share, a body DEAD at the end nothing (what it earned in the field it keeps); a LOSS shares nothing. The
commit's vit rows carry `xpBattle` + `fought` (`xpHeld` / `bench` still read); `hqPartyAfterMatch`'s beats carry
`battle · share · fought · bench · dead · won`; THE EXPERIENCE card's tag reads the rule (DOWN · NO SHARE / DID NOT FIGHT
· HALF SHARE / IN THE FIELD +a · THE ENCOUNTER +b / THE ROOM WAS LOST · NO SHARE). **THE WAY BACK**: the debrief's
▸ BACK TO THE ROOM runs battle.js `_encReturnLeave` — `ThreeRenderer.fieldSnapshot({ ms, holdCap })` returns a record,
the panel fades (`.result-overlay.vic-leaving`, `ENC_RETURN_FADE_MS`), then **`rec.take()`** renders the battle's frame once
more through its own post chain into a 2D canvas over the WebGL canvas (z 100050 — the crossing's dissolve in reverse)
and reads **THE EYE**: the debrief camera's position + gaze in ROOM METRES through `_hqBattleRoomMatrix(R, ts).invert()`
with its lens; `window._hqReturnArrive` rides it into `backToMainMenu` → map.js `_hqReturnOrMenu` → `_hqEnter({ …,
seamless })`: NO load card, no progress line, no arrival card; the renderer's `_hqEnter` takes `opts.arrive` → `H.arrive`
and `_hqTickCamera` HOLDS the camera at the eye (the lens too) until `H.ready`, then eases onto the walker's boom over
`HQ_RETURN_EASE_MS` (1500, smoothstep, the lens to 52) while map.js's `onReady` fades the snapshot; `holdCap` (4.5 s)
fades it regardless; a return that never enters the building drops it; no snapshot (reduced motion, `EW_HQ_NO_DISSOLVE`,
a failed take) = the old return with its card. **`_encRoomLast`** (battle.js): `window._ewEncounterRoom` outlives the
commit (which spends `_encMatch` before the debrief) — the podium stands on the TRUE GROUND (it stood on `level × step`
on a tiered field) and the return can read the room's frame; `startMatch` writes it from the latch (a plain match null),
a rematch drops it. `npm test` runs seamless-field.test.js (the sampler in a vm + the sources); party-levels /
hq-encounter / hq-room-in-battle pins moved. UNSEEN LIVE (RULE #1c — the CDN is unreachable from the sandbox): the drape
on a real slope against the plates' opacity, the level-up card mid-fight on the story units, the panel's fade into the
held frame, the ease's length (`HQ_RETURN_EASE_MS`), the fade's pop when a walker's rig takes a moment to attach.

## THE SEAMLESS FIELD, delivery 8 — THE DEFORM (a dig bowls the room's own floor, the map comes back) + THE RINGS ABOVE (2026-09-23, local delivery)
The user: "digging still doesn't show; spells that lower terrain put the units underground since the floor doesn't change —
temporarily overwrite the floor elevation for a tile / an area and put the map back after the battle; natural deformation,
not voxels; and the selection / vital rings are buried under the floor textures and the tile highlights." **THE DEFORM**
(three-renderer.js, the block before `_fieldStrataMats`; SEAMLESS_FIELD_PLAN §7 has the entry): a DIG is no longer a
column drawn UNDER the floor — `_fieldStrataBuild` runs **`_fieldDeformApply(ts)`** FIRST: the room's own floor meshes
(`_fieldFloorMeshes` = a terrain room's field `_ew_hqTerrain`, a box room's `_ew_hqPart === 'floor'` planes; never the
outer ground / a site's apron / the backdrop / the strata) are deformed IN PLACE in the battle frame by the pure planner
**`_fieldDeformPlan(N, deltaAt, elev, band)`** — a bowl per dug cell: the centre drops the full delta × elev (tileTopY's
number), a plateau `1 − 2·band`, the wall a smoothstep over `band` (`HQ_FIELD_RULES.strata.deformBand` 0.3 tile) either
side of the edge, the shared edge the two cells' mean (continuous; two dug neighbours share one floor; an unmoved neighbour
keeps its centre); a RAISE stays a BLOCK (the strata quad + faces draw only for `delta > 0` once the deform landed). The
ORIGINAL vertices are kept on the mesh (`_ew_fieldOrig`; a box floor's one quad is SUBDIVIDED on the first dig,
`_ew_fieldOrigGeo` kept) and every rebuild re-derives from them; `deactivate()` → `_fieldDeformRestore()` puts the floor
back — and the next room entry rebuilds from data anyway. `_fieldGroundSampler` carries the bowl (a box room gets a sampler
once something is dug), so the highlight plates and the rings follow it. Kill-switch `EW_HQ_NO_FIELD_DEFORM`. RULE: a floor
mesh under a field is deformed through this path, never a second mesh over it; a new floor-carrying builder tags its mesh
`_ew_hqPart: 'floor'` (or `_ew_hqTerrain`) or a dig will not show on it. **THE RINGS ABOVE**: the team reticle and the
selected-tile marker wear `renderOrder` **4** (`RING_RENDER_ORDER`; the plates are 0 / 2, nobody writes depth — the later
draw wins on every board); under a true-ground field they are GRIDS (`RING_FIELD_SEGS`) that **`_fieldRingsTick(g)`**
(both branches of `_updateUnitFacing`) drapes over the ground through the highlights' sampler, lifted `RING_FIELD_LIFT`
× the plates' lift (≈ 12 cm), capped half a tile off the unit's top, keyed on spot + yaw + the height version; a body in
the air wears them flat. `npm test` runs seamless-field.test.js (delivery 8 ×3). UNSEEN LIVE (RULE #1c): the bowl's read
in each floor sheet (the sheet stretches down the wall — `deformBand` is the edit), the box floor's subdivision under the
AO, the ring's lift against a rig's feet, a dig beside a raise.

## THE SEAMLESS FIELD, delivery 9 — THE NO-DEFORM FLAG + THE SINK (the fountain question) — 2026-09-23, local delivery
The user: "a circular fountain GLB sits on four cells — I dig a corner, what happens?" The deform moves FLOORS, never props
(the basin hung over a pit; a box cover cell dug from the fountain's rim). Now: data.js **`hqFieldFixedCells(R)`** files
`entry.field.fixed` (one letter per cell) at the build — C a cover · P a prop whose footprint covers ≥ `HQ_FIELD_RULES.
strata.fixedOverlap` (8 %) of MORE THAN ONE cell · D a door landing / rim (a terrain pad) · W water / a hazard · L a wall
row · B a bridge · G the gallery · K a counter · **S a prop wholly in ONE cell = NOT fixed** · `.` free; a cave carries none.
**`hqFieldFixedAt(field, x, y)`** = the reason (`fixedLabels`) or null. battle.js **`fieldCellFixed(x, y)`** (off the latched
field's `PREBUILT_MAPS` entry; null outside a field) is read by `applyTerrainDeform` (the cell is skipped like a wall),
`_buildProblem`'s dig and `_placeBlockProblem` (`Fixed ground: <reason>`). **THE SINK**: three-renderer.js `_hqPlaceProps` tags
every floor prop's group `_ew_hqProp`; `_fieldSinkProps` (run by `_fieldDeformApply`) drops one standing on a dug cell by the
bowl at its spot (its base kept, put back by `_fieldDeformRestore`). RULE: a new thing a unit must never dig under = a
letter in `hqFieldFixedCells`, never a check at a call site. **OPEN (the user's note): THE STRUCTURE HEIGHTS** —
SEAMLESS_FIELD_PLAN §9: measure roofs / bridges / stairs / platforms / building tops as a structure table per room, read by
the raster as a LAYER per cell, before any second-floor fight. `npm test` runs seamless-field.test.js (delivery 9 ×2).
UNSEEN LIVE (RULE #1c): the refusal's log line, a barrel sinking into a crater, the crater stopping at a landing.

## THE SEAMLESS FIELD, delivery 10 — THE UNITS STAND ON THE GROUND (the floating officer, the catgirl in the stairs) — 2026-09-23, local delivery
The user: "my character is on this raised circle but floating in the air, yet their vital ring is on the ground correctly; my catgirl is
inside the stairs; allow decimal heights if that is the issue." THE CAUSE: the ring was draped through `_fieldGroundSampleAt` (delivery 8),
but the BODY was placed by three-renderer.js `unitSurfaceY` and every tween's end by `_tileSurfaceY`, and neither read the field — both
returned the ENGINE's integer level × the level step (THE TIER RULE calls a 1.2 m dais level +1 = 1.75 m → the officer floated; a stair
cell whose centre is mid-flight is level 0 → the catgirl stood at the floor inside the treads). `tileTopY` (delivery 1) was right; the unit
path never went through it. NOW: **`_fieldSurfaceY(tx, ty, tz, wx, wz)`** (right after `_fieldGroundSampleAt`) is the ONE field-aware
surface read — the cell's real top (the strata's dig / raise folded in), sampled at a world point when given, and for a z ABOVE the cell's
engine height (a flyer, a jump node) that clearance over the real top. Readers: `unitSurfaceY` (a grounded body FIRST, before the roof /
multi-floor / natural branches; a flyer's hover sink over the real top), `_tileSurfaceY` (every tween's ends, the puffs, the projectile
heights), and `_updateWalkTweens` samples the ground under the body every frame of a grounded leg (a walk rides the treads / the slope; a
jump leg keeps its arc). The VFX file's `unitSurfaceZ` anchors to the renderer's unit and inherits it. THE ENGINE IS UNTOUCHED: a cell's
LEVEL stays THE TIER RULE's integer (the high-ground bonus, the LOS step); only the DRAWN height is the room's decimal one — the decimal
height was never the problem, the field already carried it. RULE: a new "where does a body stand" read under a field goes through
`_fieldSurfaceY` (or `tileTopY` / `surfaceYAt`), never `getBaseHeightAt × ELEV_STEP_RATIO`. `npm test` runs seamless-field.test.js (31).
SEAMLESS_FIELD_PLAN §7 has the entry. UNSEEN LIVE (RULE #1c): the foot contact on the treads during a walk, a flyer's bob over a dais,
the strike leap's landing on a slope.
