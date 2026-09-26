# Notes: hq-building-rooms

Moved verbatim from CLAUDE.md on 2026-09-24 (sections in original order). HQ rooms, floors, wings, gallery, seams, directory map, floor plans.
Append new notes for this system at the end of this file.

## ROOM 86 + ROOM VARIANTS (HQ plan 7.4 / 5.1) — added 2026-09-11
`DOOR_HQ.rooms.cafeteria` (data.js) is THE CAFETERIUM, a `kind: 'box'`
room off the ground ring at 75° (`central_egress.doors` id `cafeteria`,
`leaf_saloon`; the hall's break nook moved in). Counters: `notice` →
`_mountLeaderboard`, `till` → `_goToShop` (map.js's counter panel reads
the counter's `verb`). `npcSpots` = the roster on break; **`onlineSpots`**
= one anonymous D.O.O.R. agent per online player besides you
(online.js `_updateCounterUI` publishes `window._ewOnlineCount`;
three-renderer.js `_hqSpawnPopulation` seats them; `EW_HQ_ONLINE = n`
forces a crowd). Two new procs in `_hqProcBuilders`: `notice_board`
(wall, `depth`) and `mobius_bar` (the after-hours counter, `block`).
**VARIANTS**: a sheet room may carry `variants: { <id>: { when: { hours,
p }, label, sub, why, door, shell, drop, add, counters, agents, npcSpots,
onlineSpots, lines, spawn } }`. `hqRoomBase(id)` is the sheet
(`DOOR_HQ.roomsBase`); `hqVariantRoll(id, profile, { force, now })` = the
clock, else a roll seeded by `profile.door.hq.variantSeed` (set once per
profile in map.js `_hqRecordVisit`) + the day + the visit count;
`hqApplyRoomVariant(id, vid)` SWAPS `DOOR_HQ.rooms[id]` for the merged
copy (same `roomNo` / `kind` / `doors`) and re-plates every door whose
action leads into the room (`d._base` keeps the sheet's plate; `null`
restores); `hqRollRoomVariants(profile, opts)` does every room and is
called from map.js `_hqEnter` on a FRESH arrival only. Dev:
`?hqvariant=after_hours` / `window.EW_HQ_VARIANT` (`none` = the sheet).
Every reader goes through `DOOR_HQ.rooms[id]` — never cache a room
object across visits. doorhq.test.js guards the room, the roll, the
apply / restore and the source sites.

## ROOM 247 + FORM 365 + THE PUNCH CLOCK (HQ plan 7.4 / 7.9) — shipped 2026-09-11
`DOOR_HQ.rooms.clockroom` (data.js) is THE CLOCK ROOM, a `kind: 'box'` room
off the ground ring at 225° (`central_egress.doors` id `clockroom`,
`leaf_frosted`, between MEDICAL and RECORDS). Three counters: `form365`
→ `overlay: 'form365'` (map.js `_hqForm365Html`), `punch` → `overlay:
'punch'` (`_hqPunchHtml`), `codered` → the hall's Code Red panel. Three
procs in `_hqProcBuilders`: `world_clocks` (SHASTA · GIZA · LOCAL · CERN ·
THE MOON, none agree), `punch_clock`, `form_sheet`; every `wall_clock` in
the room hangs at its own height. **FORM 365 = Daily Office Operations
Requirements** (data.js, the block after `hqCodeRed`): `DOOR_HQ.dailyOps =
{ pay: 120, allBonus: 150, count: 3, force }`; `hqDailyOpsRows` draws three
lines from `HQ_DAILY_TEMPLATES` (site · cond · keys · exits · native ·
strike · delta · codered) seeded by `hqHash(date | employee no | 'form365')`
— the same sheet all day, a new one tomorrow; `hqDailyOps(profile, opts)`
reads progress from `door.hq.dailies` (date-matched); `hqDailyRowMet(row,
ev)` is the rule per template (lines that say WIN need a win); battle.js
`commitAchProgress` calls `hqDailyOpsJudge(p, ev)` AFTER the Code Red
commit (so a cleared Code Red counts), credits Hazard Pay locally
(`creditLocalGold`), sets `window._lastHqForm365` for the result stamp
(`_stampHqSite` → `.drs-site.form365`), and logs a 📋 line. Standard matches
only (`kind === 'match'`; MD / campaign never). The strip pill `#hqForm365`
(index.html, `.hq-strip-form`, map.js `_hqFillStrip`) mirrors the count and
opens the sheet (`window._hqOpenForm365`); Room 86's notice board mirrors it
too. Dev: `?form365=site,keys,strike` / `DOOR_HQ.dailyOps.force`.
`hqCanonToday(date)` = the day's canon date. **THE PUNCH CLOCK** = the
login streak: map.js `_hqRecordVisit(null)` (a fresh arrival from Play)
calls `hqPunchIn(profile)` once a day (`door.hq.punch = { last, streak,
best, days }`); `hqPunchClock(profile)` reads it (a missed day → streak 0,
`lapsed`). Viewer-local, nothing relayed (RULE #2). doorhq.test.js guards
the room, the sheet, the judge, the punch and the source sites.

## ROOM 1287 + THE HQ AVATAR (Occam's Barbershop, HQ plan 7.4) — added 2026-09-11
`DOOR_HQ.rooms.barbershop` (data.js) is OCCAM'S BARBERSHOP, a `kind:
'box'` room off the ground ring at 105° (`central_egress.doors` id
`barbershop`, `leaf_glass`, between the Quartermaster and Reception; the
vending machine moved to 98°, a `barber_pole` wall proc hangs at 111°).
**THE CHAIR** (counter `chair` → `overlay: 'barber'`, map.js
`_hqBarberHtml`) is where the officer chooses what they WALK THE BUILDING
AS: data.js `hqAvatarPref(profile)` → `{ mode: 'player' | 'vessel' | 'agent'
| 'race', race?, gender? }` from `door.hq.avatar` (default `player` = the
recruit, the Player cast model); `hqSetAvatar(profile, choice)` validates
and writes it (`door.hq.cuts` counts changes); `hqAvatarLabel(pref)` is the
wording. map.js `_hqAvatar(profile)` reads the pref AFTER the dev override
`EW_HQ_AVATAR` (`'vessel'` still forces the most-played rule); a `race`
whose model is missing falls through to the recruit. Picking = buttons with
`data-avatar` (`player` / `vessel` / `agent` / `race:<race>:<gender>`) →
`window._hqPickAvatar` → save → `ThreeRenderer.hq.setAvatar(av)` swaps
the model IN PLACE (same spot, heading, camera; the `hq-player` rig record
is evicted and respawned — never a room rebuild) → the panel re-renders.
Only declassified races with a rigged, animated model are offered
(`profile.account.unlockedUnits`, `getRace3DModel`, `_DEV_UNLOCK_ALL`).
**THE MIRROR** (counter `mirror` → `_mountReactProfile`) is the ID card;
profile.js `doorCardPortrait` now lets a `race` / `agent` pick lead the
photo (the recruit / vessel modes keep the most-played rule). Procs:
`barber_chair` (floor, `block`), `barber_mirror` (wall, the catalogue
`glow` = its vanity bulbs), `barber_pole` (wall, a canvas-helix stripe
texture cached in `_hqPoleTex`; it does not turn). The in-tray shows a
WALKS AS row. Cosmetic and viewer-local — nothing on `state`, nothing
relayed (RULE #2). This answers HQ plan D13. doorhq.test.js guards the
room, the helpers and the source sites.

## ROOM 111 + ROOM 1984 (The Trophy Case, The Interrogation Room, HQ plan 7.4) — added 2026-09-13
`DOOR_HQ.rooms.trophycase` (data.js) is THE TROPHY CASE, a `kind: 'box'`
room off the MEZZANINE at 290° (`central_egress.doors` id `trophycase`,
`level: 1`, `leaf_glass_exec`, between Bay 6 and the Bureau, directly
over the EMPLOYEE OF THE MONTH board; the frame that hung at 288° moved to
281°). Counter `cabinet` → `fn: '_mountReactTrophies'` (profile.js) =
`_mountReactProfile({ tab: 'achievements' })` — `ProfilePage({ initialTab })`
is the only change to the page; map.js `_HQ_MODAL` maps the new mount to
`_unmountReactProfile` (add any future tab-mount there too or the building
never resumes). **`hqTrophyCount(profile)`** (data.js, on `window`) =
`{ done, total, champs, feats, lines }` off `progress.unlocked` — the ONE
read for the panel's count and the proc's gold. Proc `trophy_case`
(three-renderer.js `_hqProcBuilders`, wall, `glow`): three rows of three
plaques, gold for the first `lines.length` (read once at build). `DOOR_HQ.
rooms.interrogation` is THE INTERROGATION ROOM, a box room off the ground
ring at 255° (door id `interrogation`, `leaf_cell`, between Records and
Bay 1; the frame / extinguisher / boxes there moved to 247° / 262° / 263°).
Counter `table` → `overlay: 'transcript'` → map.js `_hqTranscriptHtml`:
the TRAINING MATCH imitation ledger from battle.js `_ewImitationSnapshot()`
(`total` + `weights` vs `AI_WEIGHT_DEFAULTS`) and a `[data-transcript]`
button that opens `_ewImitationReport()` IN PLACE (never through
`_hqDoAction` — a bare `fn` outside `_HQ_MODAL` leaves the building),
enabled by the new one-liner `_ewImitationHasReport()`. Counter `glass`
has `action: {}` — `_hqCounterPanelHtml` renders its own panel by id. Proc
`steel_table` (floor, `block`, top at 0.76 — tabletop props sit at
`y: 0.76`). Both rooms are viewer-local (RULE #2). doorhq.test.js guards
the rooms, the helper and the source sites.

## ROOM 1111 + ROOM 5150 (Medical as a ward, The Padded Room, HQ plan 7.4) — added 2026-09-13 rev 3
`DOOR_HQ.rooms.medical` (data.js) is MEDICAL, a `kind: 'box'` room behind
the ground ring's hospital door at 210° (`central_egress.doors` id
`medical` — it was a door straight to `_goToCampaign`; the number `1111`
now sits on the ROOM, `hqDoorNo` reads it through). Counters: `desk` (THE
SERVICES DESK) → `_goToCampaign` (Challenge mode); `chart` (THE CHART, a
`clipboard` on the east wall between the two cots) → `overlay: 'chart'` →
map.js `_hqChartHtml`, which reads **`hqMedicalRecord(profile)`** (data.js,
on `window`, beside `hqTrophyCount`) = `{ matches, wins, exits, rate,
healing, dodges, crits, days, leave, condition, tone, note }` off
`profile.career` + the punch clock — the ONE read for the ward; the
CONDITION line is INTAKE / FIT FOR DUTY / UNDER OBSERVATION (exits >
wins) / ADMINISTRATIVE LEAVE (`profile.door.leave` truthy — the story's
hook, nothing sets it yet). Door `padded` (north wall, `leaf_cell`) →
`{ room: 'padded', at: 'egress' }`. `DOOR_HQ.rooms.padded` is ROOM 5150 ·
THE PADDED ROOM, a 3.6 × 3.6 box room: three walls wear the wall proc
`wall_padding` (three-renderer.js `_hqProcBuilders`, front +z, mount
0.1, no block), the fourth is the door's back to the ward; counter `hold`
has `action: {}` — `_hqCounterPanelHtml` renders its panel by id (the
chart's condition row + SERVE IT / NOT TODAY). Both rooms are viewer-local
(RULE #2). doorhq.test.js guards the rooms, the helper and the source
sites. NOTE for tests that read data.js through the vm sandbox: never
`deepStrictEqual` an array from it (a different `Array` realm fails on
identical contents) — compare `.join(',')` or `.length`.

## ROOM 42 + ROOM 1337 (Records as a room, IT, HQ plan 7.4) — added 2026-09-13
`DOOR_HQ.rooms.records` (data.js) is RECORDS, a `kind: 'box'` room behind
the ground ring's wired double door at 240° (`central_egress.doors` id
`records` — it was a screen door with two alts; the number `42` now sits
on the ROOM, `hqDoorNo` reads it through). Counters: `codex` (THE READING
DESK) → `_goToCodex`; `unfiled` (THE CARD CATALOGUE) → `_mountCommunityMaps`
— a MODAL over the paused building (map.js `_HQ_MODAL` maps it to
profile.js `_unmountCommunityMaps`). Door `tapes` (north wall, `leaf_exit`)
→ `{ room: 'observatorium', at: 'projector' }` (the old REPLAY alt, walked;
`_hqGoTo` resolves a counter id in a box room). `DOOR_HQ.rooms.it` is
ROOM 1337 · IT, a box room off the MEZZANINE at 120° (door id `it`,
`leaf_holographic` — `leaf_hollow_core` is the L2 rank leaf, so the plan's
keypad hangs INSIDE by the way out; the round cabinet moved 120° → 113°).
Counters: `library` → `_goToSpellLibrary` (map.js `_spellLibraryBack` now
returns to the building when `_hqHome`, else to Settings), `bench` →
`_launchBalanceSim`, `racks` → `_launchAITraining` — all three in
`_HQ_FN_LABELS`; they leave the building like every page fn. Procs in
`_hqProcBuilders` (three-renderer.js, wall, front +z): `card_catalogue`
(block), `server_rack` (block, `glow`), `keypad`. A counter with a `desc`
and no panel of its own states it (`_hqCounterPanelHtml`, before the fn
button). Both rooms are viewer-local (RULE #2). doorhq.test.js guards the
rooms, the moved prop, the counters ↔ props and the source sites.

## ROOM 360 + THE STAR CHART (The Observatorium, HQ plan 7.4) — added 2026-09-11
`DOOR_HQ.rooms.observatorium` (data.js) is THE OBSERVATORIUM, a `kind:
'box'` room off the MEZZANINE at 240° (`central_egress.doors` id
`observatorium`, `level: 1`, `leaf_holographic`, directly above Records
between Bay 3 and Bay 6; the office locker moved to 232°). A planetarium:
counter `projector` → `_ewReplayLastMatch` (Replay MOVED here from
Records — Records' door `alt` is now `{ room: 'observatorium', at:
'projector' }`; map.js `_hqDoorPanelHtml` renders a door alt with `room`
/ `at` as a `data-room` button) and counter `chart` → `overlay:
'starmap'` (map.js `_hqStarmapHtml`). **`hqStarChart(profile)`**
(data.js, before the Keys block; on `window`) is the ONE layout every
reader shares: a unit disc (x east, z south) in equal wedges in bay
order, Bay 1 at twelve and clockwise, each bay's sites zigzagging from
the rim inward in roster order (seeded by `hqHash(id + '|star')`, never
the clock), joined in that order; every star carries `st` (=
`doorSiteState` on a synthesized `{ action: { mission } }` door:
stabilized / unstable / codered / sealed), `done / total` and `siteRoom`.
Readers: three-renderer.js procs `star_dome` (ceiling Points + the
constellation LineSegments + a number plane per star facing down),
`star_chart` (a wall proc; `_hqStarChartTex` canvas, cached by the lamps
it shows), `star_projector` (the room's light) and `telescope`; the
panel's SVG (`.hq-starmap` / `.hq-sky-*` / `.hq-star` in
styles-base.css). **Point at a star** = `[data-star]` in the panel click
handler (read before `[data-fn]`) → `window._hqOpenThreshold(mapId,
{ star: true })` opens the threshold's OWN door panel from anywhere in
the building (a door synthesized from `DOOR_HQ.thresholds[id]` like the
CROSSING console's, id `chart` so the launch's `doorId` returns you to
the chart post-match); `d.star` adds ◂ THE CHART (`[data-starmap]` →
`window._hqOpenStarmap`). A box shell can be painted down:
`shell.floorColor` / `wallColor` / `dadoColor` / `ceilColor` and
`ceilTile` (metres per ceiling tile) — `_hqBuildBoxShell`; the room's
ceiling is the `void` terrain sheet. `_hqStarColor(st)` is the one
colour rule (green / amber / red / grey). Viewer-local, nothing relayed
(RULE #2). doorhq.test.js guards the room, the layout and the source
sites.

## HQ PLATES = ROOM № · NAME · FUNCTION + THE BATTLE MARKER — added 2026-09-12
Every door / counter / room `label` + `sub` in `DOOR_HQ` (data.js) follows
ONE rule: the plate reads **ROOM № · one name · what pressing E does**
(RECEPTION → VIEW PROFILE, QUARTERMASTER → SHOP, RECORDS → CODEX, MEDICAL →
CHALLENGE MODE, bays → BATTLE MAPS, ring thresholds → BATTLE SITE, the
site room → BATTLE SITE · BAY n, every way-back door → BACK TO THE MAIN
HALL / BACK TO THE BAY, the console → BATTLE SETUP). No second titles,
departments or lore on a plate — lore stays in `desc`. A new door /
counter = a name + its function in `sub`, nothing else. **THE BATTLE
MARKER**: `hqSiteRoom` gives every playable site room a counter `battle`
at the board centre (`proc: 'battle_marker'`, `verb: 'BATTLE'`, `overlay:
'crossing'` — the same terminal as the console, post-match returns you
there); three-renderer.js `_hqBuildBattleMarker` draws the beacon on the
centre cell's top, `_hqTickWorld` spins it. doorhq.test.js checks both.

## ROOM 1 (Reception as a room, HQ plan 7.4) — added 2026-09-14
`DOOR_HQ.rooms.reception` (data.js) is RECEPTION, a `kind: 'box'` room
behind the ground ring's window door at 120° (`central_egress.doors` id
`reception` — it was a door straight to `_mountReactProfile`; the number
`1` now sits on the ROOM, `hqDoorNo` reads it through). Counters:
`window` (THE INTAKE WINDOW) → `_mountReactProfile` (the ID card — the
callsign and the desk are still edited there); `laminator` (THE
LAMINATOR) → `overlay: 'intake'` → map.js `_hqIntakeHtml`, which reads
**`hqIntakeCard(profile)`** (data.js, on `window`, beside
`hqMedicalRecord`) = `{ onFile, status, tone, note, empNo, callsign, desk,
clearance, rank, issued, photo, visits, days, reissues, fee, feeCharged,
serving, ticket, queue }` — the ONE read for the sheet, the dispenser
panel and the sign; `ticket` (NOW SERVING) has `action: {}` —
`_hqCounterPanelHtml` renders its panel by id (the sign = the first half
of the employee number, the ticket = the second, AHEAD OF YOU = the gap).
Procs in `_hqProcBuilders` (three-renderer.js): `now_serving` (wall,
front +z, `glow`; the digits are a `_hzTextTex` plane keyed by the ACTIVE
profile's number at build, `000` without one) and `laminator` (a
tabletop proc — place it with `y` = the desk top, `foot` 0). The hall's
intake wedge at 128° is untouched (the window from the hall side).
Viewer-local (RULE #2). doorhq.test.js guards the room, the helper and
the source sites. `HQ_LOST_CARD_FEE` (86) is never charged — a number the
sheet prints, not an economy hook.

## THE BUREAU OF CONTINUITY + THE MOTTO PLAQUE (the reality barometer, HQ plan 4.4) — added 2026-09-15
`DOOR_HQ.rooms.continuity` (data.js) is THE CANON OFFICE, a `kind: 'box'`
room behind the mezzanine's house door at 315° (`central_egress.doors`
id `continuity`, `leaf_suburban_house`; the gate — GATEKEEPER + 24 Keys —
stays ON THE DOOR, and so does the number `№ — CONTESTED`: the room wears
no `roomNo`, `hqRoomNo('continuity')` reads the door's through). Two
by-id panels (`action: {}` → map.js `_hqCounterPanelHtml`): `plaque` (THE
MOTTO PLAQUE) and `notices` (CANON NOTICES). **THE BAROMETER** (data.js,
right after `hqCornerInspection`; all on `window`): `HQ_MOTTO_BANDS` maps
the CHAPTER BAND to a form of `HQ_MOTTO_FORMS` — until the story track
(4.1) lands the band is the clearance: L1–L2 → 0 DO OBSERVE OTHER
REALITIES · L3–L4 → 1 DON'T. OPEN. OBSERVE. REPORT. (the one orientation
taught; `hqCornerInspection` still prints it) · L5–L6 → 2 DO OPEN OUR
REALITY (MASTER A7). **`hqMottoBarometer(profile, opts)`** is the ONE read
(`{ idx, form, forms, band, act, tone, level, title, source, taught,
drift, changed, previous, remembered, reading, note }`); `profile.door.
mottoForm` (the story hook — map.js `window._doorSetMotto(n)`, null =
follow the band) beats the band, `opts.force` (dev: `?motto=n` /
`window.EW_HQ_MOTTO`, read through map.js `_hqMottoForce()`) beats both.
**`hqMottoObserve(profile)`** is the ONE write — map.js `_hqRecordVisit
(null)` calls it on every fresh arrival and files today's reading in
`door.hq.motto = { form, since, remembered: [{ form, until }] }`: a
wording the plaque no longer reads goes on the REMEMBERED list (one per
wording, never the current one) — the Mandela effect is the player's
alone. **`hqCanonNotices(profile)`** = the Bureau's board, GENERATED
(never stored): the motto (STANDING, or RETCON when it changed since your
last visit), one CORRECTION per remembered wording, the WORDING notice
when the story set the form, the ladder, the floors (no 13), Bay 6, the
front door, H-Wing, today's cleared Code Red, Room 86 after hours.
Readers: the plaque proc `motto_plaque` (three-renderer.js, after
`wall_plaques`; reads the barometer AT BUILD — a room is rebuilt per
entry — texture cached per form as `hq_motto_plaque_<idx>`), the two
panels, **the Bureau's DOOR panel in the hall** (the motto + the top
three notices, readable at ANY rank — "canon notices on the Bureau's
door"), and the LOADING CARD (`#hqLoadMotto`, `.hq-load-motto` — A7:
posters, plaques, loading screens). Viewer-local, nothing relayed (RULE
#2). doorhq.test.js guards the room, the helpers and the source sites;
hq-floors.test.js dropped its "the Bureau's door waits" exception. The
notices' copy is Claude's DRAFT (A15 — the user rewrites).

## THE FOURIER FOYER (the front door, HQ plan 7.4's last row) — added 2026-09-15
`DOOR_HQ.rooms.foyer` (data.js) is THE FOURIER FOYER, a `kind: 'box'`
vestibule SOUTH of the hall behind the ground ring's revolving door at
195° (`central_egress.doors` id `foyer`, `leaf_revolving`, wide — the
one free stretch of the lower wall, between the Training Room and
Medical; the cooler moved 196° → 204°, the round picture 188° → 186°).
No `roomNo` (a foyer; the register skips it). Doors: `egress` (north,
the same revolving leaf) → `central_egress@foyer`; `street` (south,
`leaf_entrance`) → `fn: '_hqExitToMenu'` — the strip's EXIT as a door,
the street IS the main menu (labelled in map.js `_HQ_FN_LABELS`; one
home). Counter `inspection` (CORNER INSPECTION, `action: {}`) → the by-id
panel in `_hqCounterPanelHtml`, which reads **`hqCornerInspection
(profile)`** (data.js, on `window`, beside `hqIntakeCard`) = `{ onFile,
empNo, callsign, corners: 4, angle: 90, verdict, tone, visits, days,
streak, punched, date, canon, motto, mottoForms, note }`; `HQ_MOTTO_FORMS`
= MASTER A7's three forms (the seal does NOT carry the motto — the
barometer is the Bureau's plaque, 4.4). Procs in `_hqProcBuilders`
(three-renderer.js, the Phase 8 block): `door_seal` (a 3.6 m canvas
decal, cached — the department's name + the Customs & Admissions slogan
round the rim, a door in a square in a circle), `doormat`,
`umbrella_stand` (block). **THE ARRIVAL**: map.js `_hqEnter({ from:
'play' })` lands in `_hqArrivalRoom()` = the foyer (spawn just inside the
front door, facing the revolving door) unless `?nofoyer` / localStorage
`ew_hq_foyer='off'` / `window.EW_HQ_NO_FOYER`; returns, walks, `opts.room`
and the dev entries land as before; the Code Red doorbell rings in the
foyer too. Viewer-local (RULE #2). doorhq.test.js guards the room, the
helper, the ration (the foyer's two faces of one door) and the source
sites.

## THE PENTHOUSE + ROOMS 4C + 8 (the elevator rides, HQ plan 5.4 stage 1 / 7.4) — added 2026-09-14
`DOOR_HQ.rooms.executive` (data.js) is THE PENTHOUSE, a `kind: 'box'` lobby
behind the mezzanine ELEVATOR at 0° (`central_egress.doors` id `elevator`,
`proc: 'elevator'`, KEYHOLDER + 12 Keys — the gate is that door's, the lobby
wears NO `roomNo`: it is a floor and the register skips it). The way down
is the car on the lobby's south wall (a box-room door with `proc:
'elevator'` and no leaf; never gated) → `{ room: 'central_egress', at:
'elevator' }`. Counter `floorpanel` has `action: {}` — `_hqCounterPanelHtml`
renders its panel by id (the elevator door's `floors` as chips, M and PH
lit, `M ▸ DOWN` = a `data-room` button). Two doors off it: **`rooms.corner`
= ROOM 4C · THE CORNER OFFICE** (east wall, `leaf_glass_exec`): counters
`intray` → `overlay: 'intray'` (the SAME case-file sheet as Room 101 —
the closet stays yours and keeps the rank door; 4C's door is never
`rankDoor`), `plaques` → `_mountReactTrophies`, `view` (`action: {}`) →
the by-id panel: one row per bay, `hqSiteMastery` summed over its
thresholds. **`rooms.pool` = ROOM 8 · THE INFINITY POOL** (north wall,
`leaf_glass`): the FIRST hand-authored OPEN room — `shell.open: true`,
`edge: 'low'` (the parapet), `shell.sky` = a hand copy of the
`prebuilt_heaven` env row (doorhq.test.js diffs tint / fog / scenery
against `EW_MAP_META` — edit both or the test fails), `apron: 'cloud_2'`,
terrain-sheet keys for floor / wall (`_hqTex` falls through to
`TERRAIN_SPRITES`), `shell.lights` = the point lights (an open room has no
fluorescents). Counters `edge` (`action: {}` → the by-id panel: the punch
clock as ON BREAK, the engraved count, the leaderboard button) and
`ranking` → `_mountLeaderboard`; `onlineSpots` on the loungers (Room 86's
rule). Procs in `_hqProcBuilders` (three-renderer.js, after `telescope`):
`floor_panel` (wall), `exec_desk` (wall, `block`, top 0.76 — desk props at
`y: 0.76`), `exec_chair` (floor, `block`), `wall_plaques` (wall; gold per
`hqTrophyCount` at build), `false_window` (wall, `glow`), `infinity_pool`,
`pool_lounger` (seat 0.42, `hqSit` at its x/z), `pool_umbrella`. **RECT
BLOCKERS**: a catalogue row may carry `rect: { hw, hd }` (metres, ROOM
axes — place the prop at `face` 0 / 180) and both prop-blocker sites in
`_hqPlaceProps` pass it through (`_hqBlkContains` already honoured
`b.rect`); the pool is the first. All three rooms are viewer-local (RULE
#2). doorhq.test.js guards the ride, both rooms, the sky diff, the rect and
the source sites. Still open in 7.4: the Fourier Foyer only.

## THE EXPLORATION FLOORS (HQ plan Phase 8 stage 1) — shipped 2026-09-14, local delivery
The elevator is a ROOM: `DOOR_HQ.rooms.car` has no doors — its FLOOR
PANEL (counter `panel` → map.js `_hqFloorPanelHtml`, shared with the
penthouse's `floorpanel`) rides to `DOOR_HQ.elevator.stops` (PH · 3 · M ·
G · B; read through `hqElevatorStops(profile, fromRoom)` — PH wears the
old KEYHOLDER + 12 Keys gate, the mezzanine door is ungated; `window.
_hqCarFrom` = the floor the car was boarded from). Every lobby's
`elevator` door (`proc: 'elevator'`) leads back to `car@panel`. Three
floors + an undercroft on no button (24 rooms, the block after
`training` in data.js; plan §8.2 has the table): **G** THE GARAGE (P1,
THE RAMP landmark, the booth panel) + the dock; **B** SERVICES (the
lobby), the kitchen (350, a saloon door UP into the Cafeterium), the cold
room (−18), the laundry (60), Service Corridors A and B, the boiler room
(451), the room at the end, the server room (127, a stair UP into IT);
**B2** the dungeon (24601), the ritual room (333), the sacrifice room
(322, THE ALTAR panel = Form 322), Room X (the `floating_orb`, THE
OBJECT panel); **3** THE ANNEX, the lecture hall (314, THE BOARD panel =
TYPE_CHART), the cubicle floor (9-5, the online shift's `onlineSpots`),
the bathroom (WC), the crawlspace, the locker room (26), the natatorium
(50M), the garden (1618, open under Olympus's sky by hand, the L5 gate →
Room X). Un-numbered rooms are lobbies / corridors (the register skips
them). **SECRET DOORS**: `door.secret: true` = no leaf / lamp / plate; the
renderer hangs a wall slab on a hinge in the shell's tinted wall
(`_hqBuildDoors` `wallMatS`); `hqSecretDoors()` lists the five. **ONE
HOME PER FUNCTION** (plan C-27): every `fn` / overlay has ONE counter or
door in the building (the ID card = Reception's window; the leaderboard
= the hall's board; the shop = the Quartermaster; Challenge = Medical's
desk; achievements = Room 111; the case file = Room 101) — a duplicate is
a by-id PANEL or a prop, never a second launch; hq-floors.test.js fails
on a second home, and no panel carries a YOUR CARD button. **Renderer
rules that came with it** (three-renderer.js): a catalogue proc may carry
`light: { color, intensity, dist, y }` (a PointLight the placer adds,
`HQ_PROP_LIGHT_MAX` 10 per room); a builder that moves pushes a ticker
(`_hq.tickers`, run by `_hqTickWorld`); a shell may say `strips: false`
and `mood.ambient` (a dim room lit by its own props); a placement's
`rect: false` refuses the catalogue rect. The 44 Phase 8 procs live in
`Object.assign(_hqProcBuilders, {…})` before `_hqProcProp`; `parked_car`
is the Sedan (`getRace3DModel('honda civic')`, MODEL_INDEX). **THE PAUSE**
(C-28): P = ESC in the building and the pause menu in a battle (ui.js);
an UNREQUESTED pointer-lock loss is the ESC the browser ate —
`_hqOnLockChange` (`_hqHadLock`, outside `_hqLockStaleAt`'s window) opens
the settings, Strike Mode's `pointerlockchange` (`_strikeLockReleasedAt`)
opens the pause menu. `npm test` runs `hq-floors.test.js`. Unseen live
(RULE #1c): all of it — plan §9 2026-09-14 rev 3 lists what to eyeball
first.

## H-WING (HQ plan 5.5 stage 1) + THE DOOR THAT OPENED THE SETTINGS — 2026-09-14 rev 4, local delivery
**The bug**: after C-28 (the eaten-ESC rule) EVERY door in the building
opened the settings. `_hqEnter` re-appended the shared canvas into the host
on every room entry; appendChild on an element already in the host
REMOVES and re-inserts it, a pointer-locked element removed from the
document loses its lock, and `_hqOnLockChange` read that as the walker's
ESC. Now the canvas / CSS2D layer are appended ONLY when their parent is
not the host, and the room-to-room swap stamps `_hqRebuildAt` (a loss
inside 2.5 s of it is never an ESC). RULE: never re-parent the shared
canvas while it may be pointer-locked; test `parentNode !== host` first.
**H-WING** (data.js `DOOR_HQ.hwing` + eight `rooms.hwing_*`, built OPEN —
the user's rule: build as end-game, lock later; the gates go on
`garage/p2`, `deadend/hwing` and the site back door as `minClearance`):
an H of two 48 m legs + a bar under the facility. Ways in: THE STAIR from
the garage's west wall (P2) and the room at the end's SECOND secret wall
(six secret doors now — hq-floors.test.js). The west leg's EXIT walks
into `site_prebuilt_backrooms@hwing` — **`DOOR_HQ.siteRooms.backDoors
[mapId]`** is a second door row `hqSiteRoom` appends after the way in
(three-renderer.js `_hqBuildSetting` keeps every room door's lane clear
of the setting now, not only the way in); a `room` door is never gated by
a sector lock, so Bay 6 stays sealed (C-12). THE FRACTAL: `hwing_office`
is ONE room behind all eight office doors and its way out lands at
`hwing_w@office_1`; the east leg's far end opens onto `hwing_w@lobby`;
HOME's kitchen door opens onto its own front door. HOME is SCAFFOLDING
(A14 Q5): the hallway only, `house_stairs` to the ceiling, counter `phone`
(map.js by-id panel, ANSWER disabled). Procs: `square_cubicle`,
`house_stairs` (Phase 8 block). Panels: `wingplan`, `phone`. No room in
the wing wears a number (the register skips it; `hqHWingRooms()` /
`hqHWingEntries()`). The wing's plain leaf is **`leaf_coffee`** — never
`leaf_hollow_core` (the L2 rank leaf; doorhq.test.js refuses it). The
car has no H stop (the lobby's elevator door still calls it). `npm test`
runs `hwing.test.js`. Unseen live (RULE #1c): all of it — plan §9
2026-09-14 rev 4 lists what to eyeball first.

## THE GALLERY'S EDGE + ROOM X + THE CAR + THE PLANET IN THE ROOM + THE ISLANDS — 2026-09-16, local delivery
Five of the user's HQ fixes (DOOR_HQ_BUILD_PLAN §9 has the log). **THE
GALLERY'S EDGE**: the third ring's fascia (`_hqBuildRing3`) faced the DRUM
(a `_hqBand` cylinder is FrontSide = outward) and the underside is a sliver
from below, so the rail floated on the stone from the mezzanine and the
floor; it is `BackSide` now + a 0.25 m soffit lip (oxblood between two teal
trims, closed under). RULE: a fascia at a slab's INNER radius is seen from
inside — `BackSide`. **ROOM X**: the door landing (2.4 m in) stood INSIDE
the orb's blocker in a 5 m room = a soft lock (`railing_1m` is `foot: 0` —
it never blocked); `_hqGoTo`'s box landing is clamped to the room's depth
and walked back toward the door until it stands on no blocker, and the
room is 7 × 7 with the orb ring north of centre. **THE CAR**: no `metal_3`
grate (brushed `aluminium` walls / dado), the leaves brushed aluminium
instead of the trim sheet tinted grey. **THE PLANET IN THE ROOM**:
`hqSiteRoom` sets `shell.planet` + `shell.world` for a map whose
`env.world.kind` is `planet`; under `K.hq` the near builder's
`_nrApron({ planet: true })` records craters on `K.planet` (`_nrCrater` /
`K.inCrater` read it), `_nrKit` takes `ctx.hq.keepOut` (the room's doors,
console, props, natives, masts, spawn, finds — hoisted from
`_hqBuildSetting`'s clear zones) and rides on `ctx.kit`; after the build
**`_hqBuildPlanetGround(room, g, K)`** runs `_wdBuildPlanet` + the `_WD_RIM`
builders + `_wdInject` (dissolve off, the shared uniforms pinned grounded,
`_wd.mats` / `_wd.hasGround` untouched — `o.hq`) in the setting group; the
flat floor / apron / skirt wear `_ew_hqGround` and hide when it lands;
`_hq.planet.yAt` is a layer of `_hqSurface`'s box branch (the walker walks
the bowls). Saturn's storm walls + rings come indoors (no `!HQ` gate). Mars
/ Saturn rooms wear the board's own sheet + tint. **THE ISLANDS**: Bermuda
is the open sea — beaches (spawn rows), shallows to wade, the deep, the
treasure island with the X (`dirt_2`) + the chest, a wreck on a rock islet
a side, a sandbar; full map + Δ authored from `ROWS` sheets; the near
builder builds NO sand apron (the sea at `depth: 1` = the board's water
level, beach tongues past the spawn rows, the lighthouse on a rock, palms,
`_nrRocks` `y`). Ship data.js to Render too. Unseen live (RULE #1c).

## THE GALLERY — two floors in ONE box room (HQ plan 9.2 stage 2) — 2026-09-15 rev 20, local delivery
`shell.gallery = { h, side: 'n'|'s'|'e'|'w', w, stairAt: 'start'|'end'|null,
rail }` on a box room (data.js) = a SLAB along one wall at height h, w
deep, a straight closed-string flight at the named end of the strip (its
LOW end at the wall's corner, its foot open at the side; twelve risers over
3.36 m for 2.9 m — `rise` / `run` override) and a banister on the open
edge. three-renderer.js (the block right before `_hqSurface`):
`_hqGalleryFrame(room)` → `_hq.gallery` (set in `_hqEnter` BEFORE the
shell build; s ALONG the wall from its start corner, t INTO the room,
`local` / `world`), **`_hqGalleryAt(x, z, curY)` = THE LAYER** `_hqSurface`'s
box branch reads after the site cell — a number (a tread / the slab), `null`
(a wall: the flight's mass from below, the rail band = 0.15 m + HQ_BODY_R
from the slab or a tread above a step), `undefined` (not the gallery's: off
the strip, or the FLOOR UNDER THE SLAB — a free query, curY null, is always
the floor's); `_hqGalleryFloor` seeds `_hqBlockerFloor` (a jump lands on
the slab / a tread; the portal aim lifts to them); `_hqGalleryAir`
(`_hqAirOK`) and `_hqGalleryCam` (`_hqCamBlocked`) make the slab's volume
and the flight solid; `_hqBuildGallery` draws it (deck in the floor sheet,
underside in the ceiling sheet, trim fascia, solid tread boxes + nosings,
posts + top + mid rail, the sloped rail up the flight, newels) and registers
`_hq.rails` (two runs) + `_hq.ramps` (the flight) for 9.8. **A door on the
gallery's wall STANDS ON THE SLAB** (`_hqDoorFloorY` → `gallery.h`; an
explicit `y: 0` puts it under; a numeric `y` wins) and `_hqGoTo` lands 2.4 m
in at that height. **THE FIX**: `_hqFindTarget` found a box door by the
rotunda's LEVEL, so a box door at a height (this doorway, the stairwell's
`landing` at y 6) was never offered — a box door is found by HEIGHT now
(|Δy| ≤ 1.2). Props stand on the slab with `y: h`, wall props above it with
`mount` from the floor. `stairAt: null` = the door gun's ledge; `rail: false`
draws nothing but the edge stays a balcony. THE FIRST: the Haunted House's
HALL (`site_prebuilt_haunted_hall`, h 5.8): THE LANDING along the north
wall at 2.9 m, the flight out of the east corner, the `stairs` door (→
upstairs, still its own box room) at x 1.0 ON the landing, the
`house_stairs` / banister props retired. Adding a gallery = one `shell.
gallery` row + doors on its wall + `y: h` props; hq-complex.test.js's
landing harness reads `_hqDoorFloorY` and its park rule accepts the
gallery's banister / flight. `npm test` runs `hq-gallery.test.js` (THE
CLIMB: a walker climbs the flight and crosses the slab to the door by the
step rule alone). NOT BUILT: 8.4's third ring on the rotunda, natives on
the slab, a gallery on a site / cave room. Unseen live (RULE #1c): the
deck / underside / tread sheets, the sloped rail, the first step onto the
foot from the side, the boom on the landing, the plate at 2.9 m.

## THE THIRD RING (the hall's GALLERY, HQ plan 8.4 / 9.3) + ROOM 345 · THE BERMUDA TRIANGLE (7.7 wave 2 begins) — 2026-09-16, local delivery
**THE THIRD RING**: `DOOR_HQ.rooms.central_egress.shell.ring3 = { h: 3.3,
inner: 20.6, outer: 24, thick: 0.35, railH: 1.05, stair: { from: 278, to:
312, rIn: 22.6, steps: 20 } }` (data.js) — a second ring slab 3.3 m over
the mezzanine (the same radii; `upperWallH` grew 5.4 → 6.6), ONE curved
flight off the mezzanine's walkway whose MASS stands on level 1 in that
arc (nothing else may stand there — doorhq.test.js checks doors and
props). The key is `ring3`, NEVER `gallery` (that is the box room's
two-floor slab). Doors / props / spots with **`level: 2`** stand on it:
the four EXPLORATION doors (engineering 90° · it 120° · observatorium
240° · executive 315°) — the mezzanine keeps the bays + the elevator
(hq-suites.test.js: 11 / 6 / 4). three-renderer.js: EVERY rotunda level
reader goes through **`_hqLevelY(S, level)` / `_hqLevelR(S, level)` /
`_hqLevelOf(S, y)`** — never write `level ? S.wallH` again
(hq-ring3.test.js refuses it); the ring is a LAYER read FIRST in
`_hqSurface`'s rotunda branch (`_hqRing3At(x, z, curY)`: a tread from
either level, the slab only for a walker already up there — a FREE query
is never the ring's — the rail band from the slab side, undefined over
the void), a mass in the air (`_hqRing3Air`) and a wall to the boom
(`_hqRing3Cam`); `_hqBuildRing3` (end of `_hqBuildShell`) builds the slab
cut over the flight's band + the strip inside it, the rails, the flight;
the rail joins `_hq.rails`. map.js's directory says THE GALLERY ·. The
car has no gallery stop. `npm test` runs `hq-ring3.test.js` (THE CLIMB by
the step rule alone). **ROOM 345 · THE BERMUDA TRIANGLE** (`prebuilt_
bermuda`, Hollow, `near: 'bermuda'`, tier 2): the 7.10 checklist end to
end — the board is TWO right triangles of `desert` shoal meeting at a
`deep_water` hypotenuse (NE → SW), a two-tile SANDBAR at the centre (on
the Δ it IS the nexus tiles (3,4) / (4,3) — the forge's two routes), the
corner buoys (floor torches), a `sea` motion at HALF the Dutchman's pace
(speed 2.5 — motion-maps' ≥ 5 rule is the three travellers' only; the
movers list is pinned there), the storm from round 3; the site room on
the Dutchman's moat recipe in daylight; `_NR_BUILDERS.bermuda` (before
the MOVING MAPS block) = the sand apron, the streaming sea, the
LIGHTHOUSE (`_hzLighthouse` scaled to the build's tile — it reads
CONFIG.tileSize) at the NW corner, the lantern BUOY + the ∠ 90° plate at
the SE. **THE WEIR**: `links.weir_bermuda` (route `deep`, a `pool` way
FREE at both ends — Room 8's west parapet corner, whose loungers moved
south for the landing, and the Triangle's north strip). Two tapes
re-homed (sacrifice / orb → 345; the hundred stays a hundred);
delta-maps.test.js expects 39 Δ boards. NOT BUILT: the waterspout,
Flight 19's flyover, the yacht as the quay, the HUD compass. Next in 7.7:
Tartaria, then the Tesseract. Unseen live (RULE #1c): all of it.

## THE SUITES (HQ plan 9.3 "the crowding" / C-27) — 2026-09-15 rev 9, local delivery
A DEPARTMENT gets ONE hall door onto its own LOBBY; its rooms hang off
that. Three new hand-authored box rooms in `DOOR_HQ.rooms` (data.js, the
block right after `padded`), each wearing **NO `roomNo`** (a lobby — the
foyer and the penthouse are the precedent, so `hqRoomRegister` skips it):
**`medwing`** · THE MEDICAL WING behind the ground ring's hospital door at
**210°** (`ward` → Room 1111, `interrogation` → Room 1984; Room 5150 stays
behind the WARD's own cell door), **`recwing`** · THE RECORDS WING behind
the wired double door at **240°** (`records` → Room 42, `clockroom` → Room
247) and **`execwing`** · THE EXECUTIVE SUITE behind the mezzanine's house
door at **315°** (`trophycase` → Room 111, `continuity` → the Bureau).
The ground ring is 13 → **11** doors (225° and 255° are free wall), the
mezzanine 11 → **10** (290° free). **THE RULE a suite keeps**: every moved
room's own `egress` id, leaf, `wide`, counters, cast and NUMBER are
untouched — only the FAR END of its way out moved (`central_egress@<id>`
→ the wing), and the three hall doors keep their ids (`medical` /
`records`, plus the new `executive`) so a remembered landing still
resolves. **THE BUREAU'S GATE AND ITS `№ — CONTESTED` STAY ON THE
BUREAU'S OWN DOOR** (GATEKEEPER + 24 Keys), which now hangs on the
suite's north wall: the suite is ungated, so a recruit walks it, reads
the notices and does not go in; `hqRoomNo('continuity')` still finds the
number (the helper scans every room's doors). A lobby LAUNCHES NOTHING
(C-27) — doors, a bench and a rail; THE PARK RULE is met with a
`railing_1m` run in each (the ramp waits on 9.8). The one non-data
change: map.js's door panel reads `d.id === 'continuity' || d.id ===
'executive'`, so the canon notices are still readable from the hall at
any rank (rev 2's promise). `npm test` runs **`hq-suites.test.js`** (the
lobbies + the register, one hall door per department + the freed angles +
the door counts, full reversibility, the gate + the number, C-27, and the
PRODUCTION landing on all nine lobby doors). Adding a suite = a lobby
room + re-point the rooms' `egress` far ends + a row in the test's
`SUITES` table. Unseen live (RULE #1c): all three lobbies, the two house
doors in the executive suite, the landing through a WIDE door in a small
box room.

## THE SEAMS THAT ARE NOT DOORS (HQ plan 9.3 `way`, the first two) — 2026-09-15 rev 6, local delivery
A `DOOR_HQ.links` row may carry **`way: '<kind>'`** instead of a `leaf`:
the seam is an ENTRYWAY OBJECT, not a door. **`DOOR_HQ.ways`** (data.js,
before `links`) is the catalogue AND the gate — `{ verb, sub, sfx, w, h }`
per kind; `hqLinkDoors` holds back a `way` it does not list, and one
unsupported end holds the WHOLE link back (never half a seam). Shipped:
`wardrobe` (upstairs in the Haunted House, east wall z 0.4 ⇄ Camelot's
north wall x −5 — the user's Narnia) and `well` (FREE in the cellar's floor
at (−2.6, 1.6) facing east ⇄ Hollow Earth's north wall x −5). A link end is
a wall end (`wall` n/s/e/w + x|z) or **free** (`wall: 'free', x, z, face`
= the heading its opening faces); an end may override the wear with its
own `leaf` (a plain door back) or `way`. Reads: `hqLinkEndOk`,
`hqLinkEndWear` (on `window`). The generated door row wears `way`, `leaf:
null`, the kind's `sub`, the link's `why` / `note`. **Renderer**
(three-renderer.js): `_hqBoxWall(room, 'free', spec)` returns the same
{ wx, wz, nx, nz, yaw } record off the object's own plane, so the scan,
the press-in, `_hqGoTo` (lands 2.4 m in front, facing AWAY — you climb
OUT of the wardrobe) and `_hqCamInDoorway` need nothing; `_hqWayBuilders
[kind](U, { free, cat, door, room })` → `{ g, motion, ow, oh, plateY }`
in the door's local frame (+Z into the room), `_hqBuildWay` places it and
pushes a door record (`way`, no lamp — `_hqLampApply` guards `lens`) with
`motion = { mode: 'way', tick(k) }`, driven by `_hqTickDoors` when the
walker stands at it; the press-in fires at 0.55 like a swinging leaf.
map.js: the prompt reads `DOOR_HQ.ways[kind].verb` (`_hqWayCat`), the room
change plays the kind's `sfx`. audio.js: `wayCreak` / `wayWell` recipes
(quiet; the buzz stays muted). **Adding a kind = a `DOOR_HQ.ways` row + a
builder in `_hqWayBuilders` + a link row** — hq-world.test.js diffs the
catalogue against the builders, runs every builder on a stub scene, and
checks both ends, the plates, the sounds and the production landings. The
other eight kinds in the plan's table (mirror · pool · painting ·
fireplace · phonebox · screen · train · closet) are not built. Viewer-local
(RULE #2). Unseen live (RULE #1c): the objects themselves.

## PHASE 8 STAGE 2 — TWO MORE FLOORS: 2 · THE WORKS + 4 · THE LABS (HQ plan §8.6) — 2026-09-15 rev 14, local delivery
Eighteen hand-authored box rooms in `DOOR_HQ.rooms` (data.js, the block
right before THE HAUNTED HOUSE COMPLEX), two new stops on the car
(`DOOR_HQ.elevator.stops`: `4` above 3, `2` between 3 and M — seven; the
car panel proc lights whatever the stops list). `hqStage2Rooms()` lists
them by floor. **2 · THE WORKS** (`works`): Room 1000 `warehouse` (belts
`conveyor` / `conveyor_z` with leaves riding them, `robot_arm`s opening and
shutting one door for ever, `door_stack`s), Room −1 `incinerator`
(`door_furnace`; THE MANIFEST panel = the register's SEALED sites), Room Y
`autopsy` (`autopsy_table` — the parts tagged; `hqDoorParts`), Room ½
`doorgarden` (`planter` + `door_vine` + `grow_lamp`), Room 24/7 `control`
(`monitor_stack` ×3; THE FEEDS panel = `hqSecurityFeeds(curRoom)` — one
row per numbered room, LIVE for yours), Room ? `lostfound` (`lost_shelf`;
THE CLAIMS BOOK = `hqClaimsBook(profile)`), `stairwell`, `tunnel`
(`track_bed` / `platform_edge` / `train_car` / `tube_map` (= `DOOR_HQ.
routes`) / `departures_board`), Room 1893 `carnival` (`bigtop`,
`ferris_wheel`, `carousel`, `fortune_tent`, `high_striker`, `ticket_booth`,
`popcorn_cart`, `festoon`). **4 · THE LABS** (`labs`): Room REM `dreamlab`
(`eeg_rack`, `dream_screen`; THE DREAM LOG = the last roster via
`_ewLoadLastParty`), Room 0dB `tank` (`iso_tank`), Room * `mandela`, Room
9 `upsidedown`, Room 4B `closet4b` (+ `supply` behind the blast door),
Room II `disposal` (`lone_gun`, `garbage_chute`). **RULES THAT CAME WITH
IT**: (1) **a box door may carry `y`** (metres) — it stands at that height
(three-renderer.js `_hqDoorFloorY`; the build, `_hqGoTo`'s landing spot
and the doorway camera blocker read it) — put a platform of blockers
under it (THE STAIRWELL: `stair_landing` at y 5.75, the `landing` door at
y 6; the walker descends three flights of `stair_step` / `stair_step_x`
blockers stacked by `y`, 0.25 m a tread, and DOWN at the bottom lands on
`stairwell@landing` — THE LOOP). For that: a blocker's base is the prop's
own `y` (`y: y0 + (p.y || 0)` at both `_hqPlaceProps` sites) and the step
rule skips a raised blocker only when it is above the floor AND above the
walker (`b.y > y + 1.2 && b.y > curY + 1.2`) — never "fix" that back.
(2) **`flip: true`** on a prop hangs it from the ceiling upside down (a
ceiling prop stands on the floor upside down): `rotation.z = π`, a wall
prop's `mount` measured down from the ceiling, NO blocker (Room 9). (3)
**ROOM DIALOGUE = `say` on an `npcSpots` row** (a line or a list): whoever
stands there — a race-hinted native or the roster draw — says THAT before
any roster line (three-renderer.js `sayOf` → `_hqSpawnCharacter` `line`;
map.js `_hqNpcPanelHtml` reads `t.line` first). The bathroom's spot is
the conspiracy theorist at the sink now; Room X has a watcher, the
cubicle floor a politician. **`clone: true`** on a spot spawns the
walker's OWN vessel (Room II: THE OTHER ONE). Every `say` is Claude's
DRAFT (A15). (4) **a variant with `when: { each: true }`** is rolled on
EVERY entry — data.js `hqVariantRollEach(roomId, profile, n, last)` (the
sheet + every `each` variant, seeded by variantSeed + day + n, never
twice the same in a row), applied by map.js `_hqEnter` on every entry
(`_hqEachN` / `_hqEachLast`, `window._hqMandelaLast` = what you
remember — THE FRAME panel); the visit roll (`hqVariantRoll` /
`hqRollRoomVariants`) skips `each` variants and rooms that have only
them. (5) **Supply Closet 4B's gate is on THE BLAST DOOR** (`leaf_vault`,
`minClearance: 6`), never on the vestibule; EVACUATION is a panel whose
button is a room move to the foyer (`data-room="foyer" data-at="street"
data-evac`) — never a second home for `_hqExitToMenu` (C-27). (6) THE
PARK RULE in every room (a `railing_1m` + a `riser_*` or the stair's own
treads — the test insists). Fourteen by-id panels (`line`, `manifest`,
`parts`, `bed`, `feeds`, `claims`, `departures`, `booth`, `log`, `lid`,
`frame`, `note`, `evac`, `chute`) in map.js `_hqCounterPanelHtml`; 37
procs in `Object.assign(_hqProcBuilders, {…})` "PHASE 8 STAGE 2" (with
`_hqMiniDoor`, the small leaf they share); the garage grew a `tunnel`
door (e, z −7). Numbers are REC (the user rules). No rank leaf on any of
it (doorhq.test.js). `npm test` runs `hq-stage2.test.js`. NOT BUILT:
tapes for the new rooms (the sheet is fixed at 100), a train that arrives
(the `train` way), cast on the new floors, sounds. UNSEEN LIVE (RULE
#1c): all of it — the treads under the walker and the boom on the
landing first, the belts' pace, the flipped office, the Mandela swap.

## THE SEAMS, THE SECOND BATCH (HQ plan 9.3 `way` ×6) — 2026-09-15 rev 22, local delivery
Six more `DOOR_HQ.ways` kinds (data.js) with builders in three-renderer.js
`_hqWayBuilders` and sounds in audio.js: `mirror` (`wayMirror`) · `pool`
(`waySplash`) · `painting` (`wayCanvas`) · `fireplace` (`wayFloo`) ·
`screen` (`wayStatic`) · `closet` (reuses `wayCreak`). Seven `links` rows
on `seams`: `mirror_lookingglass` (the Barbershop's east wall ⇄ **a FREE
end on the Looking-Glass's north strip** — its 18 m room has no north lane,
so it is the first free `way` on a site room; hq-world.test.js's landing
and lane rules skip `wall: 'free'` there, and every built site is a
station now), `natatorium_dutchman` (both ends free: the plunge pool beside
the lap pool ⇄ the bilge in the hold), `lodge_olympus`, `bureau_vatican`
(**the link carries `gate: { minClearance: 5, requiresKeys: 24 }` — the
Bureau's own — so the Vatican is no way round the Gatekeeper's door**),
`northpole_haunted` (the hall's EAST wall — the north wall is the gallery's
slab), `observatorium_singularity`, `nuketown_haunted`. RULES that came
with it: a prop the seam displaces MOVES (never deleted — the test checks);
a builder may use only the stub scene's geometry kinds (Box · Cylinder ·
Ring · Circle · Plane · Torus · Sphere) and its tick must move a
position / rotation / scale (the stub's JSON diff ignores materials);
`hqDoorNo` reads a room numbered on its own DOOR (the Bureau) by scanning
for an entry that carries a `roomNo` — never through `hqRoomNo` (it
recursed). NOT BUILT: `phonebox` (A14), `tent`, Room 8's weir ⇄ Atlantis
(no fourth north lane). Unseen live (RULE #1c): every object.

## THE HQ VISUAL PASS — the measured front, the tabletop seat, the kit tile, the vehicle turn (2026-09-16, local delivery)
The user's look at the building: backwards desks, props floating off desks,
trays floating off the counter, the subway sideways, the cars half-size on
their maps. Every one was a placer CONVENTION nobody measured. **THE KIT
TILE** (three-renderer.js `_hzKitTs` / `_hzKitTile()`): `_hzMiscKit` /
`_hzDoorKitGLB` / `_hzVehicleProc` / the beacon size in TILES and read the
CURRENT build's tile — `_hqBuildSetting` sets it round the near builder
(try / finally; 127.75 in a site room, `CONFIG.tileSize` on the board).
Never read `CONFIG.tileSize` in a helper a room can call: every vehicle,
utility box, rover and palm in a site room was 45 % of its size. **THE
VEHICLE TURN**: `_VEHICLE_KIT` rows wear `yaw: Math.PI / 2` (Meshy lays a
long model along X, front −X — every measured piece: the cannon, the
rowboat, the wreck, the crane, the skateboard) and the catalogue `car_*`
rows `turn: 90` (the placer applies `turn`, degrees, to the INSTANCE);
unmeasured — a nose that lands backward is `-π/2` / `turn: -90`, one
field. **THE FRONT OFF THE MESH** (`_hqAutoFrontYaw(inst, mode)`, catalogue
`front: 'back' | 'open'`): a GLB seat's facing is MEASURED when it lands
(backrest = the centroid of the band above 62 % of the height, the front
is the other way; a cubicle's opening = the emptiest side band between
desk and partition height) and the instance is turned so that front is
local +Z, the placer's contract — every chair / couch row and
`round_cubicle` carry it; a new seat / booth GLB = set `front`, never guess
`rot`. **THE TABLETOP SEAT** (`_hqSeatTabletops` / `_hqSeatLater`,
`_hq.tabletops`): a raised small prop (`y` ≥ 0.25, `foot` ≤ 0.35, not
block / rect / wall / ceiling) is seated on the surface a ray finds within
±0.3 m of its authored height once the furniture has landed (procs at
once, each GLB as it arrives, debounced) — type the surface you MEAN, the
mesh decides where; `EW_HQ_DEBUG` logs the rows with nothing under them.
**THE ROOMS**: Room 86's counter is the `serving_line` proc (3 m: hot
wells, sneeze guard, THE TRAY SLIDE at 0.85 m — trays at z = wall + 0.95),
Room 4C's `exec_desk` is centred, a FLOOR prop, drawers to the sitter,
modesty panel to the room, the visitors' chairs face the Director; Room
?'s clerk sits BEHIND her desk; the cubicle floor's `face` names the way
each mouth points and the shift sits at the mouth. Offline screenshots:
`node playtest_hq_offline.js <room> '<views>' [--nogltf]` (repo tooling —
the CDN is blocked from the sandbox; see PLAYTEST_NOTES "THE VISUAL
PASS"). `npm test` runs `hq-visual-pass.test.js`. UNSEEN LIVE (RULE #1c):
the real chairs' measured fronts, the cubicle's opening, every car's nose,
the train arriving nose first, the seat pass on the span-fitted tables.

## THE MAP — the directory as a subway map (2026-09-16, local delivery)
The Building Directory (the hall's kiosk, the pause menu's DIRECTORY, `Q`)
is a MAP: every room of the building and every site of the world is a
NODE, every door / lift / seam an EDGE, drawn as subway lines over the
impossible architecture, and it only shows what the officer has WALKED.
**THE LEDGER** (data.js, the block before THE COMPLEXES): `hqRoomSee
(profile, roomId)` is the ONE write — map.js `_hqEnter` calls
`_hqRecordRoomSeen(roomId)` on EVERY room entry (typeof-guarded; a first
sighting toasts ON THE MAP) — into both records, `door.hq.rooms.seen` and
the SYNCED blob `progress.hq.rooms.seen` (`mergeProgressBlobs` carries it,
the EARLIER day wins, `ACH_MERGE_CAPS.rooms` 512; `hqDoorSyncFold` folds
the local record in on every read — **ship data.js to Render too**);
`hqRoomsSeenRecord(profile)` is the union read. **THE GRAPH**
`hqMapGraph()` = every room reachable from the foyer along the DIRECTED
doors (the stage-1 `bay_*` rooms nobody can walk into are off the map) +
the car ⇄ its stops; edges deduped per pair, kind door / lift / secret /
way / link (a seam wears its route's colour), `gate` kept. **THE LAYOUT**
`hqMapLayout()` (cached per rooms object) is DETERMINISTIC and
collision-free — never a random number, never a force pass: the hall at
the origin, `ring_g` / `ring_m` drawn as RINGS round it, the hall's doors'
rooms at their door's `deg` (deg 0 at twelve, clockwise — the star chart's
rule; radius by level), the sites at their threshold's angle on the ring
(`HQ_MAP_L.siteR` per ring), the elevator a SHAFT at `shaftX` with a band
per stop (`floorDy`), H-Wing under the lowest stop, everything else walked
level-by-level from EVERY seed into the first FREE cell (band mode steps
left, polar mode steps outward; a same-site `links` row — the cave's
mouth — is a domestic door for the walk). Tune `HQ_MAP_L`, not the code.
**THE MODEL** `hqMapModel(profile, curRoom, { all, seen })` = nodes with
a state — `here` / `seen` (numbered: `hqMapRoomNo`, a part wears none) /
`q` (a question mark: an unseen room behind a NON-secret door of a seen
room; a link's far end too) — the rest are off the sheet; edges `known` /
`q` (never between two question marks; a secret door only once both rooms
are seen), `charted` off `hqLinksSeenRecord`; the BOX that fits the drawn
nodes. **THE PANEL** (map.js "THE MAP" block, before `_hqWorldHtml`):
`_hqMapHtml` draws the SVG (`.hq-map-svg`, `viewBox` = the fit box ×
`HQ_MAP_U` 100 px per unit; the hall a double circle, a site a diamond, a
part a small dot, a ring a dashed circle, the shaft a thick gold line with
a stub per stop, a seam a curve bowing away from the hall in its route
colour, a way dashed, an unwalked seam dotted, a `?` node dotted; the
number inside a numbered node, a label under an un-numbered / the here /
the picked one) + the bar (N OF M PLACES · Q IN QUESTION · seams walked,
+ / − / FIT) + the legend + THE CARD (`_hqMapCardHtml`: the picked node —
number · label · where (`pos.where`) · FIRST SEEN · doors charted · GO;
a `?` offers GO ANYWAY (C row G, GO stays); the here-card carries THIS
ROOM's WALK rows); then `<details>` THE ROOM REGISTER (reached places
only) and THE LINES (`html += _hqWorldHtml();` — hq-world.test.js pins
the literal). **THE REVEAL** `_hqMapAfterRender(body)` (called by
`_hqOpenPanel` after the innerHTML lands) diffs the model against what the
map LAST DREW — `door.hq.map = { n: { id: 'n' | 'q' }, e: { key: 1 }, box }`
(viewer-local, never synced: a memory of a drawing, not a discovery;
`_hqMap.mem` without a profile) — and animates the difference with CSS
classes delayed by `--d`: a `?` that became a number FLIPS (`.flip`: the ?
spins out, the number spins in, the dot's dashes solidify), a new room
POPS, a new `?` fades in (`.qin`), a new leg DRAWS itself (`.draw`,
`--len` = its length; dashed legs fade), and the frame ZOOMS OUT from the
last box to the new fit (`_hqMapTweenView`, `HQ_MAP_ZOOM_MS`); the first
open pops with no zoom; a re-render inside one open (a node picked, a
zoom button) finds no difference. `prefers-reduced-motion` kills it.
Wheel zooms about the cursor, a drag pans (a drag never picks), double
click / FIT refits; a discovery drops the officer's own view. Dev:
`window.EW_HQ_MAP_ALL` draws everything; `window._hqMapDev()`. Nothing
on `state`, nothing relayed (RULE #2). `npm test` runs `hq-map.test.js`
(the ledger, the graph, the layout's guarantees, the model's rules, the
panel headless, THE REVEAL through a fake DOM). UNSEEN LIVE (RULE #1c):
the whole look — the ring circles' weight, the label sizes at the fit
zoom, the flip's timing, the zoom-out's ease, the pan under the panel's
scroll (the stage is `touch-action: none`; the card scrolls).

## THE DIRECTORY GUARD — every room and map is on the map, or the test says so (2026-09-16)
The user's rule: "the map / room directory always gets flagged for update
with any rooms / maps we add". The directory (THE MAP, the register, the
world tab) is GENERATED from the doors — nothing is drawn by hand — so the
guard is a TEST: hq-map.test.js **THE DIRECTORY GUARD** fails, naming the
room, when any `DOOR_HQ.rooms` entry is not reachable from the foyer along
doors (`hqMapGraph`), when the layout cannot place a node, when a built
site / complex part / numbered threshold is off the map, or when the
register / world tab name a room the map cannot reach. Only `bay_*`
(stage-1 rooms) may be off the walk. ADDING A ROOM = give it a door from a
room that is on the map (or a `links` row) and run `npm test`; ADDING A
SITE = the 7.10 checklist (the threshold puts it on the map). No manual
directory edit exists to forget.

## THE FLOOR PLANS + THE ROOM LOOKS + THE VIDEO SETTINGS EVERYWHERE (HQ plan 9.3 stage 5) — 2026-09-17, local delivery
The user: "use room and hallway generation algorithms like cellular automata or
random room placing … I can see the square edge of the landscape, supposed to
be fog … the entire area is outlined in wood planks … see what can be done with
the graphics settings on a per map basis … I need the video settings in the
pause menu, not just during battles". **THE FLOOR PLAN**: a terrain room may
carry `terrain.gen = { kind: 'cave' | 'rooms', seed, … }` (data.js
`_hqTGenerate`, the block before `hqTerrainRooms`; the numbers in
`HQ_TERRAIN_GEN`): a MASK over the field says where the walker may go and
everything outside it is SOLID — rock to `wallH` (3.2 m) in a cave (the crag
everywhere, the cliff sheet to its top), a 1.7 m THICKET bank with the forest
on it in the woods. `cave` = cellular automata on a `cell` (1.4 m) lattice
(fill / born 5 / keep 4 / iters 3; a pinned OPEN neighbour is left out of the
count or it eats every rock beside it), rounded by two majority passes;
`rooms` = `n` elliptical CLEARINGS at seeded spots joined by a Prim tree +
`loops` extra edges of WINDING corridors, every authored `path` a corridor
too, the door pads rooms. Every authored thing is FORCED OPEN with a margin
(pads + their lanes, plateau tops + lip, ramps / decks, pools + half their
bank, streams, walls / rails, trees, props, natives, counters, the spawn, the
`findSpots` pins; relief — hills / dips / ridges — is NOT forced unless the row
says `open: true`; `gen.open` / `gen.solid` are hand rows). **THE GUARANTEE**:
the walker's own reach (`_hqTReachGrid`, hqTerrainFeet on the authored heights
restricted to the mask) is run from the first door; for every door it misses a
corridor is CARVED along the walker's shortest path over the UNRESTRICTED
field (`corridorW` 2.6 m); then every open pocket the walker cannot reach (and
no feature needs) is filled back in, and a solid island under `minIsland` m²
is opened (a bump is not a wall). The mask becomes a signed distance
(`info.maskD`, m; `hqTerrainMaskAt(info, x, z)` bilinear, +∞ without a plan)
and the rise is added to `info.H` over `edge` m — steeper than the walker
climbs, so the plan is a wall by the height rule alone and nothing new is read
by the renderer's walker. `freeFor` (trees / scatter) refuses the solid;
`info.thicket` = the trees on the woods' solid (`spacing` 2.1 m, the wall of
the woods first, `maxTrees` 280), planted by three-renderer.js
`_hqBuildTerrain` as blockers (`thicket: true`, never `tree: true` — the stub
test counts trees). Thirteen rooms carry a plan (the storm drain is a culvert).
`hqTerrainDump` / `node check-terrain.js` draw the solid as `#` and print the
open share and the corridors carved. **THE FOG PAST A FIELD**: `sky.fog.
density` (per METRE; the woods 0.03) → `_hqEnter`'s `scene.fog` (it was a
thin 0.00005 / unit — the square edge showed); a closed chamber's own
`shell.fog = { color, density }` (the cave's warm dark); the open field's
flat apron + skirt + the paving KERB (the "wood planks") are gone under a
terrain room — `_hqBuildOuterGround` runs the field's own material out
`HQ_OUTER_M` (54 m) past the shell, matched to the field's edge, rolling,
swelling into low rises and falling away under the fog; the treeline stands
on it (`_hqTerrainGround` → `_hq.outer.yAt`). **THE LOOKS**: data.js
`HQ_ROOM_LOOKS` (declared ABOVE `EW_MAP_META` — a const in its dead zone
throws at load) = a GRADE per place `{ name, retro: { enabled, preset,
pixelSize, ditherStrength, levels, tintAmount, grain }, cin: { vignette,
vigAmount, vigSize }, nightMood, bloom, exposure?, dof? }`: `shell.look` on a
room (the woods DREAMY, the cave AMBER, the drain / the Haunted House GREEN,
the Backrooms FADED, Hell amber), `env.look` on a map row (five maps + their
Δs). three-post.js **`ThreePost.setSceneLook(look | null)`** lays it OVER the
player's settings — `_lkRetro()` / `_lkCin()` / `_lkNum(key, base)` are the
reads at every consumer (retro uniforms + pass gate, cinematic uniforms +
gates, night mood, exposure, bloom, DoF) and the overlay never writes
localStorage; the getters the panels read keep answering the PREFERENCE.
three-renderer.js `_sceneLookOf` (null when localStorage `ew_scene_looks ===
'off'` / `window.EW_NO_SCENE_LOOKS`), `_applyEnvLook` (from
`_updateEnvironment`, keyed on the row; `activate()` resets the key),
`_hqEnter` wears the room's / `_hqLeave` drops it / `_menuEnter` is bare,
`ThreeRenderer.refreshSceneLook()`. **THE VIDEO SETTINGS EVERYWHERE**: ui.js
`window._buildVideoSettingsHTML(refreshJs, { battle, perf, extra, bare,
noFullscreen })` is the ONE sheet (Graphics · CRT · Retro · Particles + the
MAP LOOKS toggle `window._setSceneLooks`); `_buildPauseVideo` = it with
`battle: true`; map.js `_renderMainMenuSettings` renders it (`bare`) — and so
the HQ pause menu's SETTINGS has it. The hosts pass their own literal
`_buildVitalsLookHTML` / `_buildHudThemeHTML` / `_buildWorldModeHTML` /
`_buildPerfSettingsHTML` rows (older tests read those literals). `npm test`
runs `hq-floor-plan.test.js`. UNSEEN LIVE (RULE #1c): the plans' look (the
cave's rock masses, the thicket banks with the trees on them), the outer
ground's swell against the treeline, the fog's density (`sky.fog.density` is
the edit), each look's strength (the table is the edit), the settings sheet's
length in the HQ pause overlay.

## THE MAPS / ROOMS CLEANUP — Nuketown retired · Antarctica on the lunar route · CAMELOT KINGDOM · THE RANCH · THE HUBS · THE PLATE READS THE ROOM THROUGH THE DOOR — 2026-09-18, local delivery
**NUKETOWN IS GONE** (every runtime file: data.js builders / Δ / meta / site file / threshold 1945 / Bay 1 seat / built /
near / shells / flavour / three links / challenge pools; three-renderer.js `_NR_BUILDERS.nuketown`; map.js; server.js
`MAP_POOL` ×2; audio.js) — its tape is THE SCARECROWS on the ranch (the hundred kept); delta-maps expects 38. **ANTARCTICA
IS ON THE LUNAR ROUTE**: `links.antarctica_derelict` docked on the Spaceship's collar (a third course on the nav console).
**CAMELOT KINGDOM** = `routes.kingdom`: `links.northpole_camelot` (the North Pole n x −0.2 ⇄ THE OUTER WARD e z 24 — the
approach OUTSIDE the moat; a ward door inside the moat is unreachable, the solver says so); `camelot_lodge` is deleted (the
ley line is the stones alone). **THE RANCH** (`routes.ranch`; `DOOR_HQ.hubs.ranch`): `site_prebuilt_skinwalker_fields` ·
THE RANCH · THE CORN FIELDS (data.js, the block before H-WING; `hqRanchShell` / `HQ_RANCH_LANDMARKS` / `hqRingPts` beside
the woods shell; `HQ_ROOM_LOOKS.ranch`) — a `rooms` plan whose SOLID IS THE STANDING CORN, three crop circles as `path`
rings, the mesa + its ramp, THE BUTTE (the hard tape, pinned), the fence walls; `siteRooms.entry.prebuilt_skinwalker` →
the fields (the stable door lands you in the corn). Gates: `ranch_haunted` (the dead tree, off the pasture), `ranch_lodge`
(off Camelot's hall), `ranch_grove` (Bohemian Grove keeps its owl's gate to the redwoods = THE INTERCHANGE to the woods),
`well_skinwalker` (free in the farmyard). **HELD**: `ranch_graveyard` / `ranch_western` name sites that do not exist —
`hqLinkLive` holds them at both ends; build THE GRAVEYARD / THE WESTERN MAP (the 7.10 checklist) and the gates appear.
THE WOODS keep their seven parts (the pasture's two gates are the ranch's now). **THE HUBS**: `DOOR_HQ.hubs` `{ label,
room = the anchor, sites | facility, color }` (hq · cavern · woods · ranch · divine · city · dumb · kingdom);
`hqHubOf(roomId)` the ONE read; `hqMapGraph` / `hqMapModel` carry `hub` / `hubOf` / `hubLabel` / `hubColor` (never on a
`?`); map.js draws the anchor big in its ink with the hub's name always on, the members with a halo (`--hub` on the `<g>`;
CSS "THE HUBS" in the map block). Adding a hub = one row. **THE PLATE READS THE ROOM THROUGH THE DOOR** (the user: "it'll
say where that door eventually leads me to but not what's actually directly through the door"): data.js `hqDoorThrough
(door)` / `hqDoorPlateLabel(door)` / `hqReplateDoors()` — run once at load after the entries + the links; every door's
`label` = the label of the room its action lands in (the entry part of a bypassed board, the lobby behind a suite door;
`_own` keeps the authored plate; `plate: 'own'` opts out; a BAY door keeps its segment; a SECRET door its DRAUGHT);
`hqLinkDoors` labels a link door with the far ROOM's own label (CAMELOT · THE OUTER WARD). Never author a door label that
names the far destination again — name the room, put the rest in `sub`. `npm test` runs `hq-ranch.test.js`. Ship data.js to
Render too (the finds ledger). Unseen live (RULE #1c): the corn banks, the circles, the butte, the hub rings, the re-plated
hall.

## THE ROUND GARAGE — Room P1 as a drum, three decks in one room, the helix, the hidden stair (2026-09-20, local delivery) — SUPERSEDED 2026-09-26 by THE PARKING GARAGE (end of file): one deck, no helix, no H-Wing stair
The user: "make the parking garage bigger and better — a skating playground; a ROUND parking garage since it is part of DOOR's
facility; multiple floors in one room; the H-Wing door needs to be hidden way better." data.js `rooms.garage` is a TERRAIN
room now (the facility's first; still `kind: 'box'`, `roomNo` P1, the same door ids): a 48 × 48 × 12.4 box whose `halls` plan
opens ONE circle (`gen.open` r 22.4 — the traced plan wall in `urban:ConcreteStriped2c` IS the round wall, the box's corners
solid) and an AUTHORED HALL per door vestibule (`gen.halls`: elevator · tunnel · dock · rampdown · the dog-leg `alcove`).
RULE: in a `halls` plan every door pad is a Prim node — give each pad its own hall (its wall end = the pad's node, a
zero-length corridor) or the tree carves service corridors along the box walls from pad to pad (as bare `open` rows the
garage got one straight from THE RAMP DOWN's vestibule to the hidden stair's). THREE DECKS, every one signed P1 (the panel
has no P2; the lore keeps it): LOWER = the 8.5 m annulus (THE LOOP: the half-pipe, two `ramp` kickers, THE FUN BOX plateau,
the kerb-ledge `wall`, a `rail`, the painted `path` lane, three cars), UPPER 3.9 = a 16-chord BRIDGE RING over the whole
annulus (`hqRingBridges`; rails both edges; two cars at `y: 3.9`; THE DOCK OFFICE `stair_landing` at `y: 6.9` up a box
`climbs` ladder whose **`y0: 3.9` is set by hand** — `_hqClimbCompileBox`'s free query reads the ground, never a bridge),
TOP 7.8 = THE CORE (`plateau` r 9.9) + its parapet ring (`hqRingWalls`, a 60 m grind) + an 8-chord ring over the south
half STACKED over the upper ring + THE RAMP OUT (`garage_ramp` at `y: 7.8`). THE HELIX = **`hqHelixRamp`** (data.js beside
`hqRingPts`; `hqRingBridges` / `hqRingWalls` too): n straight `ramp` rows on an arc, every joint's outer notch covered by an
`ext` overlap, an optional parapet `wall` per segment from a given angle — 195° → 345° up to the north landing, 15° → 165°
up to the south one, ONE turn 0 → 7.8 (13 %). RULES the solver taught: a spiral on one height field cannot pass over itself
(one turn is the whole climb; every deck above the ground is a bridge ring); a landing's inner edge sits a metre INSIDE the
tier it joins (two edge blends meeting made a 4.5 m pocket → a rescue ramp); a bridge never lies over ground higher than
its top less a climb (`hqTerrainBridgeFor` would seat the walker on it). **THE HIDDEN STAIR**: `p2` is `secret: true`
(`leaf: null`, label A DRAUGHT — a wall slab, no lamp, no plate) at the end of the dog-leg alcove hall on the south-west of
the loop, the shelving across its mouth, a breaker panel at the dead end; the lobby's stair door is a plain door as before;
`hqHWingEntries` still reads `garage/p2`. A halls room hangs every wall prop FREE (`x / z / face / mount`) — the lesson
plaque stands on the drum wall at the ring's edge. `HQ_ROOM_LOOKS.garage`. Tests: hq-floors pins 45 secret doors (the
woods' clearing ⇄ ritual pair the old pin missed is in the string), hq-climb reads a prop at a ring's height as on the
ring, hq-terrain 78 / hq-floor-plan 69. `node check-terrain.js garage` before any retune: every door from every door,
nothing traps. Ship data.js to R2 AND Render. PRE-EXISTING at HEAD, not touched: hq-dumb's dream-lab exit count,
hq-stage2's ROOM DIALOGUE scan. UNSEEN LIVE (RULE #1c): the drum's facets, the parapets stepping with the ramp, the rails
at the chord joints, the stacked rings from below, the alcove's read, the light at 12.4 m.

## THE THREE ROOMS — THE THIRTEENTH FLOOR · THE NURSERY · THE SHOWROOM (the user: "weird, dark, trippy, eerie, nightmare-inducing; surprise me with three new rooms scattered throughout the map") — 2026-09-21, local delivery
Three prefab box rooms (family B), one per part of the world. **THE THIRTEENTH FLOOR** (data.js
`rooms.thirteenth`, no `roomNo` — a floor is not a room and this is not a floor): behind the
CRAWLSPACE's SECOND DRAUGHT (its east wall, z 2.6 — a `secret` pair, hq-floors counts 47 now); a
lobby with nothing on it under `HQ_ROOM_LOOKS.backrooms` and its own haze — three clocks, chairs
facing the walls, nameplates with no doors under them, THE DIRECTORY (counter `thirteen`, a by-id
panel: twelve suites, eleven VACANT, the twelfth is the officer's callsign + number, EXPECTED —
the `directory_board` proc reads `hqIntakeCard` at build like NOW SERVING), and in the corner with
its back to the room a `clone: true` spot (YOU). Two `each` variants (the Mandela rule, rolled on
every entry): `turned` (the chairs face the middle; the other one stands there facing the lift)
and `vacant` (nobody; a `floor_stain` where it stood). Its LIFT is a `proc: 'elevator'` door
into `car@panel` wearing `floors: ['13']` (map.js's door panel then prints "There is no 13.") —
the car has no stop here, so nothing ever comes back up this way. **THE NURSERY**
(`site_prebuilt_haunted_nursery`, the Haunted House's FIFTH part): the fifth door on the landing
(`upstairs` n x 2.6, `leaf_white_wood`, the door the lines call 237); five cots, a `crib_mobile`
(ceil, a ticker — no draught turns it), a `rocking_chair` (block, a ticker — it rocks harder when
you stand near it, nobody in it), a `music_box` on the table (the dancer STOPS when you come
close), THE TAG (counter `tag`: your number, BORN today's canon date at 03:33, EXPECTED the day
you first punched in, WEIGHT the same as you), a `nun` on a `stay: true` spot beside the chair.
hq-complex.test.js's PARTS has five. **THE SHOWROOM** (`site_prebuilt_downtown_showroom`, off
the TOWER LOBBY's south wall x 1.0, `leaf_glass`, `HQ_ROOM_LOOKS.mall`): EVERYTHING MUST GO —
six `clone: true` spots in a row facing the door (the sixth in the corner half-turned; every one
carries `race: 'homosapien'` — hq-urban insists a spot names a race, a clone ignores it), a
`price_tag` proc beside each (`text` on the row: SOLD · RESERVED · RETURNED), two `sale_banner`s
(`text`), THE RECEIPT (counter `receipt`: `hqPartyShifts` itemised at `CAMPAIGN_RACE_PRICES`,
the total), the floor manager (a `politician`, `stay`) at the till. hq-urban's `parts` list has
`showroom` after `lobby`; hq-city / hq-underworld count Downtown's complex as 11. **THE TAPES**:
the Strip's second (THE CHAPEL) is THE FIFTH BEDROOM in the nursery, the streets' second (RUSH
HOUR) is FLOOR MODEL in the showroom (the hundred stays a hundred; every part one). Six procs in
three-renderer.js "THE THREE ROOMS" (after the astral block; `_hqProcProp(name, p)` hands the
text procs their row). Three panels in map.js `_hqCounterPanelHtml` (before THE LID). Every line
is Claude's DRAFT (A15). Both parts wear a Δ board (`_MF_AREA_DELTA_BUILDERS` — the Δ-per-part rule; the
forge's spawn lane is rows 0–1 / 6–7 at x 2..5 and a +2 block never stands within a tile of it). Viewer-local
(RULE #2). `npm test` runs `hq-three-rooms.test.js`.
UNSEEN LIVE (RULE #1c): the clone standing in the corner (the Player rig facing a wall), the
chair's runners, the mobile's shapes at 2.7 m, the dancer, the directory's legibility, the
lift's plate on the floor between, the tags beside six copies of the officer.

## THE PARKING GARAGE — Room P1 rebuilt round, open and skateable; the H-Wing stair removed (2026-09-26, local delivery)
mondo: "way more open space … supposed to be round but it's all jagged and I get stuck between the floor pieces …
round like central egress … the ramp isn't even big enough to drive a car on … no door to H-wing (the garage is
easily accessible and H-wing needs to be hard to find) … better maps to skate on." The room is now BUILT, not
generated (`terrain` has no `gen`, noise 0, `stalactites: false`): 56×56 box, h 10.2, ambient 0.9, 10 ceiling lights.
- **THE DRUM**: one `hqRingWalls` ring r 27.8, n 96, every chord a mitred `quad` (`hqRingQuad`) so the wall draws
  as one smooth cylinder, `tier: true` (merged draw), `rail: false`. Three gaps (N dock, E elevator + tunnel, W the
  motor-pool ramp door) end on SIX JAMBS placed at the chord boundaries (the ring's skip ranges are midpoint-based,
  so a jamb at the nominal angle left a pocket — that pocket was a trap).
- **THE RAMP**: ONE `spiral` (r 17.9 → 28.0, 130° → 230°, 0 → 4.2 m, `edge: 0.01`) — a 10 m band, two cars
  abreast. Its inner parapet is 36 wall rows at r 17.5 with `slopeTop` (the renderer's `_hqPrismInto` draws a
  sloped mitred prism — no stair-steps) and a sloped `rail: [y0, y1]` to grind. An end wall at 230.76°.
- **THE DECK**: an arc `bridge` r 18 → 27.5 (drawn to 27.8 with `drawR1`), 230° → 490°, y 4.2, `rails: 'inner'`.
  **r1 stays INSIDE the drum**: a bridge overrides walls in `hqTerrainFeet`, so a deck that reached r 28.3 let the
  walker stroll over the drum into the box corners (traps). The three gaps get their own small decks (deck_n /
  deck_e / deck_w, r 27.2 → 29.2) clear of the jamb capsules. Eight columns at r 18.6 under it.
- **THE PLAZA**: nothing parked inside r 20 — the five cars (parked_car, ambulance, cop on the ground; suv, cadillac
  on the deck) park TANGENTIALLY at r 25.9. Centre: the island (a 0.45 m mitred ring ledge, r 3.4); two KICKERS
  (`ramp` rows with `kicker: true`, x ±11.6 → ±9.0 aimed at the island — three-renderer.js `_hqBuildKicker` draws a
  plywood wedge + steel coping instead of a mound); two quarter pipes at z ±14 facing in; a manual pad with a
  `rail: 'front'` ledge; a handrail. Paint (`marks`): lane dashes at r 22.4 on the ground and the deck, bay lines,
  P1 / UP text, the island ring.
- **THE DOCK OFFICE** landing (18, −17, y 7.2) on the deck with the ladder (y0 4.2 → y1 7.45) and the plaque.
- **H-WING**: the garage's `p2` door and hwing_lobby's `stair` are GONE; `DOOR_HQ.hwing.entries` is only
  deadend/hwing (the draught in the room at the end). Secret doors 47 → 46 (hq-floors pin). The booth panel copy
  (map.js) reads TWO DECKS, ONE RAMP.
- Tests: `stadium-garage.test.js` (shape + walker proof); hq-climb (one deck), hq-skate (kickers in the plaza; the
  traced-wall check now reads the motor pool's plan), hwing, hq-dumb, hq-floors updated. check-terrain: every door
  reached, nothing traps. Screenshots: the playtest probe needs WAIT ≥ 30 s for the garage (GLB 404 retries in the
  sandbox), else the shot shows Central Egress.
