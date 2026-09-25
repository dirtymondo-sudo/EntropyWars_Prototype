# Notes: door-gun-skate-vehicles

Moved verbatim from CLAUDE.md on 2026-09-24 (sections in original order). Door Gun revs, skateboarding revs, vehicles.
Append new notes for this system at the end of this file.

## THE DOOR GUN — THE PORTABLE THRESHOLD (HQ plan 9.5 stage 1) — 2026-09-15 rev 13, local delivery
Two freestanding DOOR-issue doors the walker PLACES. **F** draws / holsters
(**Q** holsters a drawn one before it rings the bell; RIGHT CLICK too); a
GHOST frame follows the aim — three-renderer.js **`_hqPortalAim`**: the
camera's own ray marched against the room's WALKABLE SURFACE SET
(`_hqPortalSurf` = `_hqSurface(x, z, null, true)` lifted to
`_hqBlockerFloor`; the ray ends at a wall / rock / off the room and at a
blocker's side via `_hqAirClearOfBlockers`), green legal / red refused
(`fluid` · `near` 1.2 m · `twin` 1.6 m · `door` a room door's lane · `room`
the frame's footprint). **LEFT CLICK** places: `_hqPortalPlaceAim` →
`opts.onPortalPlace(spec)` (map.js `_hqPortalPlaced` — ONE profile
transaction: load → data.js **`hqPortalPlace`** → save) → the slot →
**`_hqPortalBuild(slot, spec)`**: the DOOR frame + seal + THRESHOLD A / B
+ the catalogue leaf on a swing pivot, pushed into `_hq.doors` as a FREE
box-wall record (`_hqBoxWall(room, 'free', …)`, `door.portal`, `verb:
'STEP THROUGH'`, `action: { portal }`) so the scan / swing / press-in /
`_hqGoTo` / `_hqCamInDoorway` read it unchanged; three discs on the leaf
line (`blocker.portal = slot`) make the shut door a wall from behind.
PORTAL'S RULE (data.js `hqPortalNextSlot`): an empty slot first (A, then
B), else the OLDER moves. ONE record, `door.hq.portal = { issued, a, b,
last }` — **`hqPortalStatus(profile, { force })`** is the ONE read;
`hqPortalRecord` / `hqPortalIssue` (KEYHOLDER + `HQ_PORTAL_RULES.cost` 24
Keys spent from the issued ledger `door.hq.keys`) / `hqPortalClear` (a
fresh arrival from Play, map.js `_hqRecordVisit(null)` — the rope is for
one visit) / `hqPortalLeaf(roomId)` (a site room's own threshold leaf when
it swings, else `leaf_coffee`, NEVER a rank leaf) / `hqPortalDoorsIn` /
`hqPortalSafeRoom` (= not `hqRoomSite`). The renderer rebuilds the pair's
doors in the current room on every entry (`_hqBuildPortals(room, opts)`,
`opts.portal` from map.js `_hqPortalOpts` — a fresh arrival hands none).
Walking into one (E or the press-in; `_hqInteractTarget` /
`_hqWalkThroughDoor` read `t.door.portal` FIRST) → map.js
`window._hqPortalStep(slot)`: the twin in this room → `hq.portalHop`
(`_hqGoTo('portal:<slot>', true)` + the latch, no rebuild); another room
→ `_hqGoRoom(twin.room, 'portal:<slot>')`. ISSUE = the QUARTERMASTER door
panel's row (`[data-portal-issue]` → `window._hqPortalIssue`, then
`hq.portalIssued(true)` — no rebuild); dev `?portal` / `EW_HQ_PORTAL`
(`_hqPortalForce`). Strip pill `#hqPortal` (click = draw), OFFICER sheet
row, `.hq-hints.portal`. API: `hq.portalDraw / portalDrawn /
portalIssued / portalAim / portalPlace / portalHop / portalRemove /
portalDoors`. Viewer-local, nothing on `state`, nothing relayed (RULE #2);
the Door Agent's Knock Knock stays the race's own object on the board.
`npm test` runs `hq-portal.test.js`. RULES: the walker's key line is
pinned by hq-floors.test.js (`… || k === 'q' || k === 'p') return k;` —
add a key BEFORE q); anything new `_hqEnter` (map.js) references must be
guarded with `typeof` — scene-lifecycle.test.js evals it alone. Unseen
live (RULE #1c): the ghost, the frame's scale, the swing, the hop's flash,
the cross-room landing.

## THE DOOR GUN rev 2 — ANY SURFACE, TWO BUTTONS, TWO COLOURS (2026-09-15, local delivery)
The user's brief: "it should place a door on whatever surface you aim it
at — walls and ceilings — FLAT on the surface, so I can fall down two
portals forever; two buttons for Door A and Door B; always two different
colours." All of it, in the same three files. **THE AIM** takes THREE
surface kinds now (three-renderer.js `_hqPortalAim(slot)`): the room's own
CEILING plane (`_hqPortalCeil` — a box room's `shell.h`, a bay's `wallH`;
an OPEN room and the hall's dome have none), the walkable FLOOR set
(`_hqPortalSurf`, unchanged) and the WALL — the first point the ray cannot
occupy (`_hqPortalSolidAt` = no surface / inside the ground / a blocker's
side), bisected by **`_hqPortalWallHit`**, whose normal comes off the
SOLIDNESS GRADIENT either side in x and z (falling back to the ray's own
heading). Refusals unchanged but for two: a CEILING is never refused for
being close (that is the trick), and the twin gap is **3D** — a floor
hatch under a ceiling hatch is a COLUMN, not a clash. `_hqPortalFits`
carries the footprint rule per kind (a floor level either side; solid
behind and clear in front at every corner of a wall / ceiling opening).
**THE DOOR LIES FLAT ON THE SURFACE**: `_hqPortalBasis(face, surf)` =
local +Z = the surface normal, local +Y = the door's own up (world up on a
wall, the officer's heading laid flat otherwise) → a quaternion off
`makeBasis` (verified headlessly against real three: right-handed in every
case, and the WALL case reproduces the old `rotation.y` with zero pitch,
so a wall door is the standing door it always was, dropped to the floor
when the aim is low). The opening's CENTRE lands on the aim, 4.5 cm clear
of the surface. A flat door keeps its leaf standing open (`_hqTickDoors`),
wears no sill / cap / seal plate, and lays **NO blockers** — you walk onto
a hatch; a wall door keeps its three discs. The record carries
`portalSurf` / `px,py,pz` / the normal. **THE CROSSING**: a wall door is
still walked into (the press-in / E — it is skipped by `_hqTickAutoEnter`,
`_hqCamInDoorway` and the box branch of `_hqFindTarget` for a flat one). A
FLAT door is crossed by TOUCH — **`_hqTickPortalCross`** (run from
`_hqFrame` right after the walker's tick) reads the FEET against a floor
hatch and the HEAD against a ceiling one (`_hqPortalInMouth`), remembers
the entry speed and reports it (`opts.onPortalCross` → map.js
`_hqPortalStep`). **`_hqPortalHop(slot, opts)`** leaves along the twin's
OWN normal: out of a ceiling hatch you come out below it still falling
(the entry's speed, ≥ 2 and ≤ 18 m/s — the clamp is the terminal velocity
that keeps a 60 fps step inside the 1.6 m mouth band), out of a floor
hatch you are thrown UP when you came in fast and stand on it when you did
not, out of a wall door you step clear as before. The mouth you came out
of is **HELD** (`H.portal.hold`) until the body leaves it, so the pair
never re-fires on itself. Simulated headlessly with the shipped numbers
(scratch harness, not a playtest): floor at 0 + ceiling at 2.7 m = a fall
that never lands, terminal in ~1 s. map.js throttles the crossing's SFX to
one every 260 ms (the loop crosses ~30×/s — the beat sang thirty times).
**TWO BUTTONS**: LEFT CLICK places THRESHOLD A, RIGHT CLICK places
THRESHOLD B (right-click no longer holsters — F and Q do). The slot is
explicit end to end: `_hqPortalPlaceAim(slot)` → `spec.slot` → data.js
`hqPortalPlace` (`spec.slot` / `opts.slot`, else the old Portal order), so
a named slot MOVES ITS OWN ROW and never blocks itself in the aim.
**TWO COLOURS, ALWAYS**: `HQ_PORTAL_COLORS.a` cyan `#49b0ff` / `.b` amber
`#ff8a2b` paint the frame's tint, both jamb lamps, the mouth glow and THE
APERTURE (a new additive pane + rim filling the opening — the read that
says A from B across a room); `HQ_PORTAL_RULES.colors` / `colorNames` /
`buttons` / `surfaces` are the words for them, and the CSS plate wears
`.hq-plate-portal-a` / `-b`. A row filed before rev 2 has no `surf` and
reads as a floor door. `npm test` runs `hq-portal.test.js` (11 tests).
UNSEEN LIVE (RULE #1c): all of it — the ghost on a wall and a ceiling, the
aperture's brightness, the hatch's leaf standing open in the floor, the
fall's speed in a tall room (a cave chamber, the hall), a wall door's drop
to the floor, and the two colours against each room's own light.

## SKATEBOARDING rev 3 — SEAMLESS: ONLY A FAILED TRICK BAILS, THE FITTED STANCE, THE FALL + THE GET-UP (2026-09-17, local delivery)
The user's brief: "way too easy to fall — running into objects makes me fall;
riding should be as seamless as walking (Tony Hawk / Jet Set Radio); only fall
on a failed trick; after a fall get back upright on the board (the character
got stuck sideways until a landed trick); the character runs the whole time
when it should idle on the board and only kick now and then." All of it in
three-renderer.js's "SKATEBOARDING — THE RIDER" block, data.js `HQ_SKATE_RULES`
and sprites.js. **THE BAIL RULE**: `_hqRideBail` is reached ONLY by a rotation
still turning at the touchdown (`unfinished`), a spin landed off-axis
(`offaxis`) and the balance lost on a rail (`balance`) — a wall / a prop / a
blocker is **`_hqRideWall`** (head-on = the speed scrubs to `wallScrub` 0.15 of
itself, glancing keeps the share it made, a door's lane a walking pace), a
walk-off DROP of any height is a landing, a CAR KNOCKS the rider along its
heading (`R.hd` / `R.v`, the hop) still on the deck; `bailV` / `bailDrop` stay
in the table as retired keys. **THE LATE LANDING**: a trick ≥ `landGrace` (0.8)
done when the ground comes up is snapped complete through `_hqRideTrickDone`
(the one finisher the trick tick and the landing share); a queued trick never
started is dropped. **THE SIDEWAYS BUG**: the bail never reset `flip` / `roll` /
`deckRoll` / `spinAcc` / `stance` — a bail mid-corkscrew left the root half
turned until the next clean landing wrote zeros. It resets every one now, the
roll runs out under the slide (0.35 ×, then 0.93 / frame), no root tumble. **THE
BAIL IS TWO CLIPS**: sprites.js `HQ_SKATE_CLIPS` (baked onto the walker's rig
beside `hqRide` like the gun clips) — `hqFall` = UAL2 `Slide_Start` (a run
into a slide on the floor) for `bailFall` 0.6 of `bailMs` 1400, then `hqGetup`
= `Slide_Exit` for the rest, each ONE playthrough sized to its share
(`_hqRideBailPhase` → the clip picker); THE SKID: the deck is never hidden —
it shoots 1.6 m out ahead on a sine and slides back under the feet by
`deckBackMs`. **THE STANCE IS FITTED** (`_hqRideFitStance`, every 0.25 s while
the ride clip plays): the LeftFoot / RightFoot bones measured in the model's
frame → the pose yaw that lays the foot LINE along the deck (the candidate
nearest `stanceYaw`: regular / goofy) and the deck CENTRED under the feet's
midpoint (`R.fit`, eased; `R.deckOx / deckOz` in the group's frame) — a flat
−90° put Idle_10's forward foot half a metre off the deck's side (measured).
**THE CADENCE**: `pushEvery` 0.85 s / `pushV` 4.2 / `friction` 0.993 (four
strokes to cruise, a long Tony Hawk roll), the stride is `hqPush` = UAL1
`Jog_Fwd_Loop` for `pushMs` 520 (the Running sprint is gone from the deck);
above **`cruiseV`** 10.5 W only HOLDS the speed (no friction, no stride — the
rider stands on the deck, `kickEvery` [2.5, 5.5] the occasional kick);
`turnMin` 0.4 = the carve's floor at a crawl; the grind's drift 0.25 /
balance 0.75. **THE COPING** check moved BEFORE the move (`here.t ≥ qpTop −
0.2` with the next step at / past the lip): the ground probe's body pad left
the curve a frame before the feet reached `qpTop`, and at a cruising pace that
read as a walk-off into the air and a "wall" inside the pipe. **THE PROBE**:
`node playtest_skate_offline.js <room> '<steps>' [tag]` (repo tooling — the
gun probe's mirror: every repo GLB from disk, the deck at the repo root, the
walker a POSED rig; `hq.skate(true)` + `hq.dev.press` + `hq.dev.lookAt` for a
side view; PLAYTEST_NOTES "THE SKATE PROBE") photographed the stance from two
sides, the stride, the fall lying on the floor and the rider back upright on
the deck. `npm test` runs hq-skate.test.js (16; hq-city.test.js reads the
knock). UNSEEN LIVE (RULE #1c): the clips at 60 fps (the slide's run-in, the
get-up's speed — `bailFall` / `bailMs` are the edits), the jog stride's read
against the deck, the fit on the CAST rigs (the probe posed the creator base).

## SKATEBOARDING rev 2 — THE RIDE STANCE, FAKIE, THE KICK, HOLD TO JUMP — 2026-09-15, local delivery
The user's brief: Idle_10 on the deck with the feet on the board, the
occasional run/kick, skate backwards with S, jump higher the longer SPACE is
held. **THE RIDE CLIP**: sprites.js `HQ_RIDE_CLIP` (= the library's Idle_10,
lib 2); three-renderer.js `_hqSpawnCharacter` bakes it onto the WALKER's rig
only as slot `hqRide` (a clone of the def — never the shared table; a def
without the library keeps its idle, `_playUnitModelAnim` falls `hqRide` →
idle); the clip picker plays `hqRide` on the deck, `run` for the stride.
**THE STANCE**: `_hqRidePose` turns the body `stanceYaw` (HQ_SKATE_RULES,
−π/2 = regular, chest to the right of travel; +π/2 = goofy) INSIDE the
travel frame — `e.model.quaternion = Euler(flip, yaw, roll + lean) ·
RotY(poseYaw)` — so Idle_10's feet-apart stance lies ALONG the deck and a
front flip still turns about the travel's lateral axis; `R.poseYaw` eases to
0 for the push / the kick / the bail (squared up for the stride). **FAKIE**:
S rolling forward is the brake; from a stop S is the fakie push (`R.v`
NEGATIVE along `hd`, `reversePushV` per cadence, capped `reverseMaxV`; W
while backwards brakes first); every speed read in the tick is `Math.abs`
now (the wall rule's progress carries the roll's sign, the grind lock's
direction folds it in, the door hand-off caps both ways). **THE KICK**:
coasting ≥ `kickMinV` the rider throws in a stride every `kickEvery` [lo,
hi] s (`pushAnim`, +0.25 m/s, beat `kick` → map.js plays `skatePush` low).
**HOLD TO JUMP**: the press pops `ollieTapV` (4.6 → ≈ 0.6 m); SPACE held
keeps lifting `ollieHoldAcc` (13 m/s²) for up to `ollieHoldS` (0.42 s) —
`R.holdOn` / `R.holdT`, cleared by the release, the cap, a grind hop-off;
a full hold ≈ 1.65 m (the old fixed ollie was 1.46). `ollieV` now only
sizes the grind's hop-off. hq-skate.test.js rev 2 (four tests) proves the
tap < half < full apexes, the fakie roll + the wall behind, the kick
cadence, the stance sites. UNSEEN LIVE (RULE #1c): Idle_10 turned sideways
on the deck (if the feet hang off, `stanceYaw`'s sign is the edit), the
squat during the hold (`scale.y` 0.94), the stride's ease.

## SKATEBOARD CONTROL CORRECTION — 2026-09-15, local delivery
First-push camera yaw must be converted to +Z-front rider yaw with
`atan2(sin(cam.yaw), -cos(cam.yaw))`. A/D subtract the right-minus-left
input from rider yaw. `_hqRideTurn` applies the inverse shortest heading delta
to camera yaw, keeping mouse-look offset through carves and rail bends.
Airborne stance/spin does not steer the camera. The grind branch updates the
rider group position and yaw before returning. Regression checks live in
`hq-skate.test.js`; cache token `20260915-skate-controls-02-cors`.
Local changes only; no browser playtest or upload.

## SKATEBOARDING — THE RIDER (HQ plan 9.8 stage 1) — 2026-09-15 rev 23, local delivery
A walker MODE, never a game mode: nothing on `state`, nothing relayed
(RULE #2; hq-skate.test.js reads the block for `state.` and online.js for
the word). **B** drops the deck / picks it up (three-renderer.js
`_hqRideToggle`; the arrows are their OWN keys now — `up / down / left /
right` — the walker reads them as WASD, the rider as tricks; B sits before
V in `_hqKeyName`'s line so the door gun's and P's pins hold). The block
"SKATEBOARDING — THE RIDER" (before the per-frame section) owns `_hq.ride`:
`_hqTickRide` takes the frame from `_hqTickWalker` while `ride.on` —
momentum (`v` along `hd`; W pushes on a cadence, S brakes, A / D carve,
time-based friction), THE OLLIE (SPACE = HQ_JUMP_V), GRINDS (an ollie
coming down within `grindSnap` of a rail in **`_hq.rails`** locks —
`_hqRailAt` / `_hqRailNearest` are ONE geometry for a straight run
`{ x0, z0, x1, z1, y }` and an arc `{ arc: true, r, a0, a1, y }`; A / D
balance; the end hops off), RAMPS (**`_hq.ramps`**: a `prof: 'qp'` row
is a SURFACE — `_hqRampSurfaceAt` is a layer of `_hqSurface` after the
gallery's and a mass in `_hqAirOK`; the coping launches; a flat register
turns a rise taken at speed into a hop), TRICKS (← kickflip · → heelflip
· ↑ front flip · ↓ backflip · W corkscrew · A / D a 180 each, an odd
count lands FAKIE · SHIFT the grab — rotations on the rider's model
(order YXZ about its centre, `_hqRidePose`) and the deck, no new clip),
THE COMBO (pts × tricks, live on `#hqTrick`, BANKED on a clean landing;
a trick still turning / a spin off-axis / a head-on wall at speed
(progress along the heading — the axis slide cannot see a wall) / a rail
lost = BAIL, the line lost). **THE REGISTERS (THE PARK RULE)**: `_hq.rails`
/ `_hq.ramps` start empty in `_hqEnter`'s literal and every builder
pushes — the mezzanine's rail arcs (`_hqBuildShell`), the gallery, the
cave, and `_hqRegisterPropPark` at BOTH prop-placer sites for a catalogue
`rail: { h }` (`railing_1m`) / `ramp: { w, len, h, prof? }` (`riser_*`,
`quarter_pipe` — a new proc; two face each other in Room P1). **THE
TABLE** is data.js `HQ_SKATE_RULES` (`_hqSkateRules` merges it over the
renderer's `HQ_SKATE_DEFAULT` — keep the keys in step, the test diffs
them); `free: true` = STANDARD ISSUE (the user's rule, the door gun's
precedent) — `free: false` puts THE DECK in Room 26 as a find of kind
`deck` (`hqBuildFinds`, `find_deck`, `hqCollectFind` → `door.hq.skate.
deck`). `hqSkateStatus(profile, { force })` is the ONE read (map.js
`_hqSkateOpts` → `opts.skate.issued`; the strip pill `#hqSkate`, click =
B; the OFFICER sheet's THE BOARD row); `hqSkateBank(profile, ev)` the ONE
write (map.js `_hqSkateFile`, one transaction per banked line / bail:
`door.hq.skate = { deck, since, best: { score, text, date }, total,
lines, bails }`). Beats reach map.js through `opts.onSkate` (`_hqSkateEvent`:
the trick line, six audio.js recipes `skate*`, the books). THE DECK is
the user's GLB (`_MISC_GLB.skateboard`, MODEL_INDEX §3d; `_hqRideDeckBuild`
fits it by span to 0.84 m, pre-turned π/2 to the rider's +Z, over a
stand-in). `_hqRideMem` carries the board through a door (`_hqRideArm`
after the population; `_hqGoTo` keeps it rolling at ≤ 2.5 m/s). Dev:
`?skate` / `EW_HQ_SKATE` = issued, `EW_HQ_NO_SKATE` = off; API
`hq.skate / skating / skateIssued / ride / rails / ramps`. `npm test` runs
`hq-skate.test.js` (the ride itself in a vm sandbox). UNSEEN LIVE (RULE
#1c): everything — the deck under the feet, the flips' pivot, the grind
height on the mezzanine arc, the quarter pipe, the trick line, the sounds.

## THE VEHICLE BATCH + THE TRAIN WAY (HQ plan 9.3 `train`) — 2026-09-15 rev 21, local delivery
Nine Meshy vehicles on R2 `Assets/misc/` (MODEL_INDEX §3c). Renderer:
`_MISC_GLB` rows `suv · cadillac · copcar · cybercar · firetruck ·
schoolbus · ambulance · subway_front · subway_cart`; **`_VEHICLE_KIT`**
(after `_hzMiscKit`) = per vehicle `m` (length, fitted `span`), `yaw`
(the pre-turn that puts the NOSE at +Z — a TARGET, unmeasured: a nose
that lands backward is `yaw: Math.PI` on that row, sideways ±π/2),
`foot`, the stand-in box, `lift`, `beacon`; **`_hzVehicle(kind, o)`** is
the ONE placer (`_hzVehicleProc` fallback = a lit box on wheels, so
EW_PERF_LOW still shows a car; the beacon pulse on the board only).
Placed with `_nrProp` in the URBAN settings (Nuketown's yellow boxes are
gone; Cyberpunk, the Stadium, the Strip, Downtown's EVACUATION) — the
site rooms inherit them. Room P1 parks five cars: the Sedan +
`DOOR_HQ.catalogue` rows `car_suv / car_cadillac / car_cop /
car_ambulance` (`base: 'misc'`, **`vehicle: true`** — map.js's booth
counts that flag); `car_cyber` / `fire_truck` / `school_bus` are
catalogued, unparked. **THE TRAIN** is the THIRD `way` kind:
`DOOR_HQ.ways.train`, `routes.subway`, link `tunnel_cyberpunk` — Room 2's
tunnel (a FREE end on the track bed, doors facing the platform; the
`train_car` prop is retired, never re-add it) ⇄ Cyberpunk's north wall x
−10 (the body half inside the wall — the wall is the tunnel).
`_hqWayBuilders.train` = the subway front (nose −X, doorway at x 0) + the
cart (the FREE end only — a wall end stands the front car alone so the
body never crosses the next lane's door) through `_hzVehicle`, THE
ARRIVAL ticker (26 m in over 3.2 s, nose first), the door leaves on the
way tick; **a way builder may return `blockers`**
(discs in its own frame — `_hqBuildWay` places them in the room's).
audio.js `wayTrain`. Downtown's / CERN's platforms wait on a free north
lane. `npm test`: misc-models.test.js (the vehicle block), hq-world,
hq-stage2. Unseen live (RULE #1c): every facing, the beacons, the
arrival, the half-buried body.

## THE DOOR GUN rev 3 — THE MODEL, THE SHOT, THE RECALL (Phase 9 Delivery 3 — THE GUN READS) — 2026-09-16, local delivery
The user's retro ray gun (R2 `Assets/door/models/Meshy_AI_a_retro_gun_that_
shoo_0916054449_texture.glb`, repo `doors/`; MODEL_INDEX §3b) is
`DOOR_HQ.catalogue.door_gun` (data.js; `span` 0.62, `gun: true`). **ONE
tuning row**: `HQ_PORTAL_RULES.gun = { key, bone, span, pos, rot, muzzle }` —
the grip in the hand bone's frame (metres / degrees) and the barrel's end in
the gun's own frame (metres from the instance's base centre, +X the barrel —
the Meshy long-on-X convention, muzzle read as −X UNMEASURED: a barrel that
lands backward is `rot[1]` ± 180). **THE BUILDING** (three-renderer.js, the
gun helpers right after `_hqPortalRules`): `_hqGunAttach` parents it to the
walker's RightHand through `_hqAttachHeld` (the Janitor's-mop holder), shown
only while DRAWN (`_hqGunShow` from `_hqPortalDraw`); `_hqGunMuzzle()` is
the ONE origin (world metres; the chest + half a metre while the GLB streams).
Drawn: THE LASER SIGHT (`_hqPortalSight`, a 1 px additive Line muzzle → hit
+ a dot; white while F is held), THE STANCE (standing, the officer squares up
on the aim), THE WORD (D3a: `_hqPortalGhostLabel` — `HQ_PORTAL_RULES.reasons
[reason]` over the ghost's lintel in red, the surface + `A / B` in green).
**THE SHOT**: `_hqPortalPlaceAim` files the record at the click as before
and builds with `{ fresh, flight: { from: muzzle } }` → `_hqPortalFlight`
hides the frame, flies a tumbling miniature + a comet trail on a shallow arc
(`HQ_PORTAL_RULES.shot`: msPerM / minMs / maxMs), then UNFOLDS it about the
opening's centre (ease-out-back, `unfoldMs`) over `_hqPortalLandBeat` (the
old mote ring + a shock ring in the surface's plane + a 600 ms PointLight +
`doorGunLand`); `_hqGunFire` at the trigger = muzzle flash + sparks + the
camera's pitch kick (`shot.kick`, eased back over `kickMs`) + the walker's
ranged clip (`_attackChainFor('ranged')`) + `doorGunShot`. A slot removed
mid-flight kills the projectile. **D3b THE SHAPES**: `HQ_PORTAL_RULES.
shapes` — the placed frame's aperture rim is a circle (A) or a four-segment
ring turned a quarter (B, a square), the jamb-lamp caps a ball / a cube.
**D3c**: a mouth re-arms only `rearmMs` (250) after its last crossing
(`rec.lastCrossAt`, the hatch-loop cap); **F is a TAP on the release** (the
press stamps `H.portal.fAt`, `_hqPortalTickHold` runs from
`_hqPortalTickAim` every frame) and a HOLD of `recallMs` (600) with a door
placed = **THE RECALL** — `_hqPortalRecall` drops both records at once
(`_hqPortalRemove(slot, { keep: true })` keeps the group), flies each frame
home to the muzzle shrinking on its own comet, `doorGunRecall`, then
`onPortal({ kind: 'recall', n })` → map.js clears the pair on the profile
(`hqPortalClear`, one transaction) + the toast. **D4**: `_hqPortalHop` out of
a flat twin nudges the body along the twin's normal up to `exitNudgeM` (0.6)
until `_hqAirClearOfBlockers` passes at the feet and the head. API:
`hq.portalRecall()`, `hq.gunMuzzle()`. **THE BOARD**: sprites.js
`RACE_MODELS_3D['door agent']` (both genders) carries `hold:
_DOOR_AGENT_HOLD` (sprites.js loads before data.js — the row is the
fallback; three-renderer.js `_unitAttachHeld(m, hold, ts)` merges the live
`HQ_PORTAL_RULES.gun` over it at attach time, parents the catalogue GLB to
the rig's hand bone at real scale (`ts / HQ_TILE_M` px per metre, the bone's
world scale undone), `_ew_noTwin`, and it rides the rig cache with the body;
any def may carry `hold` now). Every placement is a SHOT from the gun:
three-vfx-effects.js `_sigDoorGunShot3D` (registered `raceDoorGun:shot` —
a folded frame in the agent's teal on a comet trail from the caster's hand
to the tile, the muzzle flash, a shock ring on landing, the two cues voiced
INSIDE the recipe so the guest hears them — `playDoorSfx` is never relayed)
fired by battle.js through `window._doorGeom` (relayed `vfx3d-x`, RULE #2)
before Knock Knock's two doors (the second `delay: 140`), Breaking and
Entering's door, EXIT and the Trapdoor; the door recipes rise under it. The
basic attack stays the punch (the Closer's kit). audio.js: `doorGunShot`
(a ray-gun zap) / `doorGunLand` (the unfold) / `doorGunRecall` (the zap in
reverse) in `_DOOR_SFX_RECIPES` + `_DOOR_SFX_GAIN`. NOT BUILT: D3d (the
boom's pitch clamp in a loop, the fade after the third crossing — playtest
first), the `hard` reachability test (item 9), a holstered gun on the hip.
`npm test` runs hq-portal.test.js (14 tests: the hold's arithmetic in a vm).
UNSEEN LIVE (RULE #1c): the grip and the muzzle on the Player / Belle rigs
(`HQ_PORTAL_RULES.gun.pos / rot / muzzle` are the edits), the gun's scale in
a unit's hand at tile scale, the flight's arc and the unfold's overshoot,
the sight's brightness under each room's light, the three cues' loudness.

## THE DOOR GUN rev 4 — THE HOLD, THE HAND, ONE TRIGGER, THE WALL, THE CARRY (Phase 9 polish) — 2026-09-16, local delivery
The user's five fixed and MEASURED with `playtest_gun_offline.js` (repo tooling: the
offline HQ harness + every repo GLB served from disk, so the walker is a POSED rig
holding the real gun; keys through `hq.dev.press`, pointer lock stubbed — see
PLAYTEST_NOTES "THE DOOR GUN PROBE"). **THE HOLD**: `HQ_PORTAL_RULES.gun` = `rot
[0, −90, 90]` (the gun's +X barrel down the hand bone's +Y fingers, its +Y top along
−Z), `pos [0, 0.05, 0.06]` (the grip in the palm), `span 0.36` (`_hqGunAttach` passes
`h: G.span` — the holder read the catalogue's 0.62 before); a held prop is never
frustum-culled. **THE ANIMATION**: sprites.js `HQ_GUN_CLIPS` (UAL1 `Pistol_Aim_Neutral`
+ `Pistol_Shoot`) baked onto the walker's rig as `hqAim` / `hqShoot` (the `hqRide`
pattern); drawn + standing = `hqAim`; the shot plays `hqShoot` first. **THE HAND**:
in first person the gun is a VIEWMODEL under the camera (`_hqViewmodel` /
`_hqViewmodelTick`: the GLB at the rules' span, a black glove round the grip, the
cuff off the corner; `viewmodel.pos` / `adsPos` / `rot` / `bob` / `kick` in the rules;
the camera is added to the scene for it; `_hqGunMuzzle` answers its muzzle in FP).
**ONE TRIGGER**: LEFT CLICK shoots the SELECTED threshold (`H.portal.slot`, A first —
the ghost / sight / word wear its colour and the ghost judges THAT slot), a shot
auto-advances to the other, R flips, 1 / 2 pick (`_hqPortalSelect`, `_hqPortalFire`;
`buttons: { fire, aim, select, a, b }`); RIGHT CLICK held = AIM DOWN SIGHTS
(`_hqPortalAds` → `adsK` eased over `ads.ms`: the lens to `ads.fov`, the mouse ×
`ads.sens` via `_hqLookGain`, the boom to `ads.boom`, the viewmodel to the centre).
`_hqKeyName` knows R / 1 / 2 (before Q — the pinned line). **THE WALL**:
`_hqPortalWallSnap` moves a hit within 0.6 m of a box room's perimeter (or a
rotunda's drum) ONTO the shell plane (the march reads the walkable set, which stops a
body short of every wall — the frame floated and its back read as air); the aim
computes the wall door's OWN centre (on the floor in front when low, under the
ceiling when high) and the fit tests the FRAME's corners with a frame-sized front
(`_hqPortalFrontSolidAt`, a 6 cm pad, 0.45 m out) — never the walker's body pad; TOO
CLOSE is a floor door under you only; the wall lane is 1.45 m; in third person the
march starts at the officer's head. **THE CARRY** (no new physics engine — gravity
existed, horizontal momentum did not): `_hqTickWalker` measures `velX / velZ / velY`
off the frame and `pushX / pushZ` (the intended walk); a WALL door is crossed by
TOUCH (`_hqPortalWallTouch`, `carry.touchM` 1.05 past the discs, moving or pushing
in); `_hqPortalMapCarry(v, A, B)` (pure; `_hqPortalFrame` = the plain twin of
`_hqPortalBasis`) maps the entry vector through the pair — into A → out of B, up
stays, sideways mirrors, ≥ `carry.minOut` out of a wall, ≤ `carry.max`; the walker
keeps it as `pl.mvx / mvz` (`_hqTickCarry`: the walk's own slide / step rules, run
off over `carry.groundS` on the ground, kept in the air); `_hqPortalWallExit` stands
you clear of the twin's discs; wall → wall keeps the look's offset; across a room
change map.js calls `hq.portalCarryFor(twin)` before `_hqGoRoom` and
`_hqGoTo('portal:x')` spends `_hqPortalCarryMem`. Probe-only dev reads:
`hq.dev.walk()` / `playerGroup()` / `press()`, `hq.portalViewmodel()`. `npm test`
runs hq-portal.test.js (20). UNSEEN LIVE (RULE #1c): the grip on the CAST rigs
(the probe posed the creator base; `gun.pos` is the edit), the ADS feel, the
viewmodel's scale at the real lens, the fling through a ceiling hatch at speed.

## THE DOOR GUN rev 5 — THE NEW MODEL, PORTAL'S TWO BUTTONS, THE FAR PREVIEW, THE LEAF, THE FLING — 2026-09-18, local delivery
The user's brief, straight from Portal. **THE GUN** is `DOOR_HQ.catalogue.door_gun` = `Meshy_AI__0916054803_texture.glb`
(`base: 'misc'` — R2 `Assets/misc/`, repo root; MODEL_INDEX §3b). MEASURED (the vertex profile along X): its GRIP hangs at
+X, the opposite end from the first gun, so **`HQ_PORTAL_RULES.gun.turn` (degrees about the gun's own up) pre-turns the
INSTANCE in every holder** — three-renderer.js `_hqAttachHeld` (the walker), `_unitAttachHeld` (the Door Agent), `_hqViewmodel`
(first person); the glove / the muzzle / the shot keep the +X-barrel frame. A future gun that lands backward = that ONE field.
**TWO TRIGGERS** (rev 4's selector + aim-down-sights are GONE — `_hqPortalSelect` / `_hqPortalAds` / `_hqLookGain` / R · 1 · 2 /
`adsK` / the lens + boom pull / `ads` + `viewmodel.adsPos` no longer exist; never bring a right-click aim back): `H.onMouseDown`
→ **`_hqPortalFire('a')` on LEFT, `_hqPortalFire('b')` on RIGHT**; `HQ_PORTAL_RULES.buttons = { a, b }`; the ghost judges the
surface for EITHER button (`_hqPortalAim(null)`) and wears `HQ_PORTAL_COLORS.ok`. **THE REACH**: `reach` 160 m; `_hqPortalAim`'s
step grows with the distance (`HQ_PORTAL_STEP_K` × t ≤ `HQ_PORTAL_STEP_MAX`) and a floor hit is stepped back onto the surface —
the preview shows on any surface the eye can see. **THE LEAF**: `leafOpenDeg` 150 / `leafAlways` — a placed wall door swings
near flat and stands open from the landing (`_hqTickDoors`); the room's own doors are untouched. **THE FLING**: out of a floor
hatch the whole entry speed comes out (`C.max`, not 12). `npm test` runs hq-portal.test.js (22). UNSEEN LIVE (RULE #1c): the
grip / barrel on the rigs (`gun.turn` / `pos` / `rot`), the leaf at 150°, the far ghost, the fling.

## SKATE + PORTAL MOVEMENT INTEGRATION — 2026-09-18, local delivery (not uploaded)
Main bb51ae4 base. three-renderer.js: `_hqTickRide` substeps `_hqTickRideStep` at
≤ 1/120 s and records velocity; A/D flip for R.v < 0. `_hqRideSlide` retains the
free tangent; `_hqRideObstacleSlide` follows circular props/NPCs without overlap.
Body-centre ground probes retain the surface's existing body-radius collision pad.
`_hqPortalSweep` checks movement before collision/gravity, including grinds and the
walker, with full rectangular `_hqPortalInMouth` geometry. Wall mouths now hold exits
until the body leaves. `_hqPortalRideExit` puts mapped carry into signed R.v / R.hd
and clears the unused walker impulse. `_hqPortalRideState` keeps plain trick/queue/
combo/stance data through `_hqPortalCarryFor` → `_hqGoTo` on room changes, never rail
objects. Floor hatches do not prematurely bank/bail a trick. Raised wall exits fall;
flat exits keep mapped normal velocity. See the HQ plan/DOOR_MASTER build logs and
hq-skate.test.js regressions. R2: three-renderer.js; Render: index.html with fresh
20260918-skate-portals-0545-cors token; tests/docs repo-only. No browser playtest or
live upload; hands-on feel and cross-room scene-load pauses remain unverified.

Validation completed for this delivery: 49/49 skateboard + portal tests passed,
including 11 new movement/traversal regressions; edited JavaScript syntax and diff
whitespace checks passed. Full-suite attempt: 1642 passed, 6 skipped, seven assertion
failures reproduced on untouched main bb51ae4 (hq-stage2, hq-terrain, hq-urban), and
one interrupted hq-map-remembers process after ~8 minutes. Its seven non-exhaustive
checks subsequently passed; the exhaustive hard-find reachability check remains
unverified. No browser playtest. Full details are in the ZIP's README.txt.

## SKATEBOARDING rev 4 — THE STICK, THE CROUCH POP, AIR CONTROL, THE COMBO CARD (2026-09-19, local delivery)
The user: "impossible to move after I jump because WASD is used for tricks — click and drag for tricks like a hit stick;
WASD still steers in the air; hold SPACE to crouch, release to jump, a meter for the max; a long line's points get cut
off; make it fun, add juice." three-renderer.js "SKATEBOARDING — THE RIDER": **THE STICK** — on the deck the mouse
buttons are the trick stick (`_hqRideStickDown / Move / Up`, read in `H.onMouseDown` / `onMouseMove` BEFORE the strike
and the camera): a button held in the air accumulates the mouse travel and at `flickPx` the flick's DIRECTION fires the
trick (`_hqRideFlickDir` → `_hqRideFlick`; the accumulator resets, a second flick chains) — LEFT ← → ↑ ↓ = kickflip ·
heelflip · front flip · backflip, ↖ ↗ corkscrew, ↙ ↘ VARIAL kick / heel (new, the deck spins as it flips); RIGHT ← → =
180s, ↑ NOSEGRAB / ↓ indy grab (grabs are timed tricks). On the ground the travel is thrown away and the mouse aims;
there is NO strike from the board. The arrows + SHIFT still fire the flips / a grab for a keyboard-only rider. **AIR
CONTROL**: in the air A / D turn the heading (`airTurn`, the camera follows), W / S nudge the speed (`airAccel`) —
never a trick. **THE CROUCH POP** (`_hqRidePop`): SPACE held on the ground charges `R.crouch` over `crouchS` (the body
squats, the `charge` beat feeds THE METER `#hqOllie` — map.js `_hqOllieMeter`, gold + MAX at the top, red past
`crouchMaxHoldS`); the RELEASE pops `ollieTapV` → `ollieMaxV` by the charge; a release inside `popPerfectMs` of the top
= PERFECT POP (`tricks.pop` on the line, a flash). The rev 2 held boost is retired (`ollieHoldS` / `ollieHoldAcc` are
dead keys in the table). **THE COMBO CARD** (map.js `_hqComboCard` / `_hqComboChips`, CSS `.hq-trick-head` /
`.hq-trick-list`): the score pops on every add, the tricks are WRAPPING chips (repeats fold to ×n, the oldest past
nine to "+n MORE" — nothing clips), a banked line wears its RANK (`HQ_SKATE_RULES.ranks`). **THE JUICE**: the landing
squashes the body by the fall (`R.squash` / `R.landK`), a dust puff, a camera dip (`_hqRideCamDip`); four new cues
(audio.js `skateCharge` / `skatePop` / `skateTrick` / `skateSick`). The table keys are in data.js `HQ_SKATE_RULES`
(`flickPx` is the one to tune if flicks fire too eagerly). `npm test` runs hq-skate.test.js (29). Unseen live (RULE
#1c): the flick threshold at a real mouse, the meter's spot, the squat on the cast rigs, the dip's size.
**rev 4b (same day)**: THE CROUCH HOLDS FOR EVER (no deflate; `crouchMaxHoldS` retired), ONE TRICK PER FLICK
(`flickCoolMs` — the stick's travel is discarded for 220 ms after a flick fires), THE FIT (`_hqRideFitMs`: a rotation
started in the air is sped up to end inside `trickFitShare` of the air left, floored at `trickFitMin`; too little air =
REFUSED with the `late` beat, never a bail — `_hqRideAirLeft` is the ballistic estimate off `_hqSurface`; a queued trick
carries its fitted ms) and THE TUCK (`R.grabTuck` / `R.deckTuck` pitch the body + the deck on a grab). hq-skate.test.js (30).

## THE PAUSE MENU BACK + SKATEBOARDING rev 5 — HOLD TO JUMP (2026-09-19, local delivery)
**THE BLANK PAUSE MENU**: the party upload dropped map.js `_hqPauseHeadHtml` / `_hqPauseNavHtml` (the
overlay's title + vitals row and the command column) while `_hqPauseRender` still called them — a
ReferenceError on the first line, nothing landed. Both are back (before `_hqPausePartyHtml`), and the
render is FAULT-TOLERANT now: each section (head · nav · party / member · officer) renders inside its own
try, a throw prints a DID NOT RENDER plate naming the error instead of a blank frame. hq-pause.test.js
guards that every `_hqPause*Html` / `_hqParty*` the menu calls is defined. **SKATEBOARDING rev 5** (the
user: "change the jumps back to a normal jump with holding it to jump bigger; no crouch and release"):
rev 2's HOLD TO JUMP is the rule again — the PRESS leaves the ground at `ollieTapV` at once, SPACE held
keeps lifting `ollieHoldAcc` for `ollieHoldS` (the air branch), a tap ≈ 0.6 m, a full hold ≈ 1.65 m;
`_hqRideAirLeft` counts the lift still to come from a held jump, so a flick thrown on the way up is judged
against the jump it will be. The rev 4 crouch / `_hqRidePop` / the `#hqOllie` meter / PERFECT POP are
retired (the function and the element stand unused; `ollieMaxV` / `crouchS` / `popPerfectMs` are dead
keys in `HQ_SKATE_RULES`, `ollieHoldS` / `ollieHoldAcc` live). hq-skate.test.js's crouch test is the
hold test. `npm run test:quick` + hq-skate / hq-pause / hq-party green. Unseen live (RULE #1c): the
pause frame with the party grids, the hold's feel at 60 fps.

## SKATEBOARDING rev 6 — WASD LIKE WALKING, THE CAMERA IS THE MOUSE'S, THE KICK (2026-09-20, local delivery)
The user: "my character does a pushing animation with his arms instead of a kick animation; I want
AWSD movement with the skateboard just like walking; I don't want the camera to move with A and S —
I control the camera with the mouse, just like walking." **THE ARM PUSH** was a slot collision: the
walker is the Player CAST rig, which already carries `_CAST_POSES.hqPush` = `Push_Loop` (leaning into
a mop handle), and rev 3's bake guard `!def.libClips.hqPush` left the stride unbaked — the mop push
played on every stroke. The skate push is slot **`hqSkatePush`** now (three-renderer.js's bake,
`_playUnitModelAnim`'s fallback → `castKick` → run, the clip picker) and the clip is **THE KICK**:
sprites.js `HQ_SKATE_CLIPS.push` = MAL1 `Spartan_Kick` (lib 2) `trim: [0.4, 1.0]` at ts 1.15 — one
stroke fills `pushMs` (a libClips row may carry `trim`; the bake copies it). RULE: never bake a walker
slot under a `_CAST_POSES` name. **WASD IS A DIRECTION**: `_hqRideWantHeading(H, k, arrows)` = the
walker's own camera-relative input (forward / right flattened; the arrows count on the ground, in the
air they are tricks), `_hqRideDelta(R, want)` the shortest turn from the ROLL's direction (a negative
`R.v` travels along hd + π); on the ground the board CARVES toward it (`turn` at ≥ 3 m/s, up to 3.5×
tighter below — `turnMin` the crawl's floor), pushes on the cadence, a key more than 0.62π off the
roll is THE BRAKE, from a stop (|v| < 0.3) the heading snaps to the keys and the first push goes there
(S with the camera ahead turns the board round and rolls toward the camera — the rev 2 FAKIE PUSH is
retired, `reversePushV` a dead key; a negative `R.v` is only a portal exit's or a bail's); in the air
the heading turns toward the keys at `airTurn` and the speed is nudged by `cos(delta) × airAccel`.
**THE CAMERA NEVER TURNS**: `_hqRideTurn(R, heading)` wraps and writes the heading ONLY — no carve,
rail bend, wall slide or air control touches `_hq.cam.yaw` (hq-skate.test.js scans the block for a
yaw write). hq-skate.test.js (30). Unseen live (RULE #1c): the kick's read on the deck (`trim` / `ts`
are the edits), the carve's tightness at a crawl, the turn-round on S.

## THE LIGHT PASS + THE SUBTITLE + SKATEBOARDING rev 7 (no push clip) — 2026-09-20, local delivery
The user's three: "the skateboarding uses a weird kick to push — I'd rather have no kick animation at
all; character dialogue should still look like subtitles, black bar with white text; the map looks
setting resets between zones and the night mood is too aggressive — more torches or a key light, and the
brightness I set in a dark area blows out the battle". **THE CYCLE BUG (the root of "it resets")**: the HQ
never wrote `document.body.dataset.cycle`, so every room inherited the LAST BATTLE's day / night — a night
map left the night grade (`uNightGrade` × the look's `nightMood`) and the night exposure over a room that
lights itself, a day map left none; the same room read dark one visit and fine the next. Now
three-renderer.js `_hqEnter` writes **`HQ_LIGHT_RULES.cycle`** (`'day'`: no grade, exposure 1 — a room's
mood is its own lights, its fog, its look's retro preset); the battle rewrites the cycle from its map as
before. **THE NIGHT CAP**: `_sceneLookOf` clamps a look's `nightMood` to `HQ_LIGHT_RULES.nightCap` (0.45)
wherever it is worn (a battle's `env.look`); the `HQ_ROOM_LOOKS` table keeps its authored values (tests
pin them) — a mood, never the darkness. **THE KEY LIGHT**: data.js **`HQ_LIGHT_RULES`** (beside
`HQ_SKATE_RULES`, on `window`; three-renderer.js `_hqLightRules()` merges it over `HQ_LIGHT_DEFAULT` — keep
the keys in step) = `ambientFloor` 0.55 (a box room's `mood.ambient` never dims the fill below it — the
torches carry the vibe on top), `fill` / `fillColor` (a cool fill light from behind the key in every box
and open room — no black side on a face), `open` (an outdoor room's hemisphere / sun / lamps by day and
night: the night keeps a real MOON key — nightHemi 0.62 / nightSun 0.4, was 0.42 / 0.22). **THE TWO
BRIGHTNESSES** (three-post.js, the block after `EXPOSURE_MAX`): the Brightness slider is PER PLACE —
`ew_exposure` the battle's (the old key), `ew_exposure_hq` the building's (follows the battle's until
moved); `ThreePost.setExposureContext('hq' | 'battle')` (`_hqEnter` / `_hqLeave`) swaps the active value
and **`_expLk()`** eases the swap over ~0.4 s (`EXPOSURE_EASE_K`) — it is the ONE read every
`toneMappingExposure` write goes through (never `_lkNum('exposure', …)` directly again); a slider move
lands at once and files under the active place; ui.js's slider is labelled `Brightness · EXPLORING /
BATTLE`. **THE SUBTITLE**: map.js `_hqOpenPanel` toggles `hq-panel-say` on `#hqPanel` for every target
that is a PERSON (not a door / counter / notice); styles-base.css "THE SUBTITLE" (appended at the END, after
the HUD pass) makes the card a black bar along the foot of the screen — the name small above, the line
in white — the plate rules never reach it. **SKATEBOARDING rev 7**: NO push clip and NO kick — a push is
the speed + the sound (`R.pushAnim` stays 0; the picker never plays `hqSkatePush`; sprites.js
`HQ_SKATE_CLIPS` = the two bail clips only; the bake guard is `hqFall`); `pushMs` / `kickEvery` /
`kickMinV` are dead keys. hq-skate.test.js (30) pins it; the quarter-pipe test took a longer run-up and
the air-control test judges S while airborne (the retired kick's bump had hidden a landing inside its S
phase). PRE-EXISTING at HEAD, not touched: doorhq.test.js 60 / 61 (the Δ area pass's board reads).
UNSEEN LIVE (RULE #1c): every room under the day cycle (a room that now reads FLAT wants its own lights,
not the grade back), the moon key on the night areas, the eased swap through a door, the subtitle bar
against the walk.

## SKATEBOARDING rev 8 — THE RAMPS (the tangent, the lip, vert, the transition landing) + THE RUN-UP + THE TURNED RECT + THE TRACED WALL (2026-09-21, local delivery)
The user: "the ramps and slopes need to actually be functional — rotate the character back as they go
up, like the board sticks to the curve and then shoots the player up; right now nothing happens; no
reward, no mechanic, no juice; research how old school Tony Hawk games did it; no flower pots / fire
hydrants / trash cans in front of ramps; weird invisible walls in the garage and the cities." **THE
RAMPS** (three-renderer.js "SKATEBOARDING — THE RIDER", the block THE RAMPS after `_hqRideAirLeft`;
the numbers in data.js `HQ_SKATE_RULES`): THPS's transition model on the height field. `_hqRideGrade`
reads the ground `slopeProbe` (0.6 m) ahead and behind the feet along the heading — THE TANGENT IS THE
ROLL: the surface speed runs along it (the horizontal step is v·cos θ; the wall rule wants that share —
it used to compare the shortened step against the full speed and scrubbed the rider on every slope),
`slopeG` (3 m/s² along the incline — gentle, never a simulation) costs a climb and pays a descent, and
a stall on a wall steeper than `rollbackGrade` is THE ROLLBACK (the board turns round and rolls back
down FACING DOWN, `rollback` beat — never a stop on the wall; the crawl clamp leaves an incline
alone). THE LEAN: `R.pitch` eases to the grade (`pitchMax`) and `_hqRidePose` turns the body AND the
deck about the FEET on the roll's lateral axis (`qP`), over the centre-pivot flips. THE LIP
(`_hqRideSetY`): the ground falling away under a CLIMBING rider (`R.gradeBack` = the last probe-length
behind the feet) throws it along the tangent × `kickLaunch` (2.0), capped by the climb's own energy
(`R.rise` — a cinder block is a curb hop) — a kicker launches, a crest at a walk is followed, a flat
walk-off is the drop it was; a prop's flat register (a riser) keeps THE RISE hop. VERT: the coping's
check launches `qpLaunch` (1.15) of the surface speed straight up with `qpCarry` (0.15) of the roll as
drift, `R.vert` turns the heading π over `vertTurn` (0.6) of the estimated hang (`_hqRideTurn` — the
camera never), so the rider comes back down the same wall facing down; THE TRANSITION LANDING
(`_hqRideGravity`) projects the fall onto the surface under the feet (`R.v = v·cos θ + vy·sin θ`) —
down a wall you come out fast (the pump loop), onto a bank facing up you come out slow. SPACE inside
`lipOllieS` of a launch is THE LIP OLLIE (+`lipOllieV`; `ollie` beat with `lip`). THE REWARD: a launch
that hangs `airMinS` LEADS the line (`_hqRideComboLead`) with `tricks.vert` VERT AIR / `tricks.launch`
AIR + `tricks.air.perM` a metre over the launch point (`R.airApex − R.launchY`); the camera kicks up
(`_hqRideCamKick`, `launchKick`); `launch` carries `vert` / `big`; map.js plays audio.js `skateLaunch`
(+ `skateVert` on a coping); `friction` 0.996. `_hqRideLaunch` is the ONE launch (the record, the beat,
the kick). **THE RUN-UP** (data.js `HQ_TERRAIN_RULES.rampRunUp` 10 / `rampLanding` 6): `hqTerrainRunUps
(room, features)` = the lanes before every kicker's foot and past its top (a terrain `ramp` that is not
stairs / an escalator / a helix segment; a PROP ramp — a quarter pipe, a riser — at its approach side,
local +Z of `π − face`), `hqTerrainCompile`'s scatter refuses them, `hqTerrainRunUpOffenders(room)`
lists authored props (their own foot as the tolerance) / counters / spots / trees in one and
hq-skate.test.js FAILS naming them for the garage, the three cities and the mall — ADDING A RAMP = run
the test. Moved: the garage's kickers (both run ALONG the lane now — the west one ran into a pillar
and the south pipe's back), the half-pipe 0.9 m out, a barrel, a sign; Downtown's Cadillac, the SUV /
taxi, the boxes, the church square's tree; two natives. **THE TURNED RECT**: `_hqBlkContains` reads
`b.yaw` (the prop placer files `grp.rotation.y`) — a catalogue rect is in the PROP's frame; read in
room axes every car at 60° / 90° / 270°, every bus shelter, the truck, the train car blocked as an
unturned box (a 5–12 m wall ACROSS the lane). **THE TRACED WALL**: a halls / ley plan's walls are
drawn inside the mask by their chain's reach (`row.push`; `info.gen.wallSlack` the largest — 0.6 m on
the garage's drum) — `hqTerrainSolidAt` lets the walker in that far and `hqTerrainWallAt` (bucketed
on a 3 m lattice, `_hqTWallIndex`) reads the plan walls as walls INSIDE THAT BAND ONLY (never on floor
the mask has always allowed — the motor pool's door onto THE PLATFORM leaves by a half-metre sliver
that clips a wall by 9 cm, and every halls / ley room was solved against that; a plan wall is never a
floor, not even to a free query), so the body stops at the DRAWN face. The city's `solidPad` stays 0.3
(0.05 was tried: the Grid grew a rescue ramp, the kerb scatter moved). `npm test` runs hq-skate.test.js (34). UNSEEN LIVE (RULE #1c): the
lean on the cast rigs at a coping (`pitchMax`), the vert's height (`qpLaunch`), the kicker's pop
(`kickLaunch`), the turnaround's timing (`vertTurn`), the two cues, the cars' footprints, the drum's
wall under the hand.

## THE DOOR WHEEL IN THE ROOM (DOOR_GUN_PLAN.md Phase 3) — 2026-09-25, local delivery
Full log in DOOR_GUN_PLAN.md §11. HOLD MIDDLE CLICK (`DOOR_GUN_RULES.wheel.holdMs` 140 ms) in the room opens
`#hqWheel` (index.html, styles-base.css `.hq-wheel*`): eight wedges from data.js `doorGunWheel(profile, { room: true })`
— the Threshold, then Gust, Archers, Hell, Maw, Frost, Laser, Light. The room runs at `wheel.slow` (0.15) while it is
open (never paused); the RELEASE takes the wedge under the mouse; a pause or a blur closes it untaken. Taking a door
draws the gun. `H.gun.door === 'threshold'` is revs 1–5 exactly. A standing door: LEFT CLICK stands it on the floor
under the aim (walls / ceilings refuse), RIGHT CLICK turns the lane 45°, the default faces away from the officer.
Two stand (the battle's per-player cap), the oldest folds. The record is `profile.door.hq.gunPlaced.list`
(`hqGunDoorPlace` / `hqGunDoorClear` / `hqGunDoorsIn`; NOT `door.hq.gunDoors`, the earned ledger), filed by map.js
`_hqGunDoorPlaced` and cleared on a fresh arrival from Play with the pair. Live acts (`_hqTickGunDoors`): the gust
blows the walker (the carry `pl.mvx / mvz`) and the kickables along its lane all the time it stands, and the maw
draws them in. Hell and frost dress their lanes, the laser marches to the first solid, and the light door is a real
SpotLight (`EW_HQ_NO_GUN_LIGHT`). Every door pulses each `HQ_GUN_RULES.actMs`, and the archers' arrows fly at the
nearest native (visual only until Phase 4's strike). Probe API: `ThreeRenderer.hq.gunSelect / gunWheelOpen /
gunDoorAim / gunDoorFire / gunDoorTurn / gunDoors`. Headless probe gotcha: the aim's march treats a roaming native as a
wall, so a shot from where a native stands in front reads "A STANDING DOOR NEEDS A FLOOR". Test: hq-gun.test.js.

## THE ENGAGEMENT + THE CARRY-OVER (DOOR_GUN_PLAN.md Phase 4) — 2026-09-25, local delivery
Zip `door-gun/ENTROPY_WARS_DOOR_GUN_4.zip`, token `20260925-door-gun-05-cors`. **THE STRIKE** (three-renderer.js
"THE STRIKE"): every frame `_hqGunStrikeScan` looks for a roaming native (`hqEncounterCharOk`) inside a standing
door's act: the gust / hell / frost / light lane (`hqGunDoorCovers`), the maw's disc, the laser to its wall. The
archers strike when their arrows land (the pulse's timer). The report is the swing's own `onEncounter` with
`gesture: 'door'` and `door: { key, at, x, y, z, face }`, and map.js `_hqEncounterFire` lets it through with the gun
drawn (`if (drawn && !ev.door)`). Gates: map.js `_hqGunOpts().strike.ok` (a wild room, the encounter switch),
`HQ_GUN_RULES.strike` = armed `armMs` 3000 after entry (a fight's return never re-engages at once), the native within
`maxM` 12 m of the walker, one strike per `cooldownMs` 4000, and a refused launch (the party down…) backs off 11 s more.
**THE CARRY** (data.js `hqGunDoorCarry`, filed by map.js `_hqEncounterStart` on `_hqEncounterRun.carry`): every
standing door on the fight's board (`hqFieldTransform(field.board).inside`, same floor ±3 m) goes onto its cell with its
hits and its facing (`hqGunDoorBoardFace`: board x = room x, board y = room z). No board (a rotated-seat fight) carries
nothing. battle.js `encounterCarryDoors(free)` runs from map.js `_encounterPlaceSeats` BEFORE `hqEncounterSeats`, and
the seats use `freeSeat` (no seat on a door). Records are `kind: 'standing'` / `'capture'`, `owner` = the party's seat,
`ownerId` = its Door Agent (else null), `_roomAt` = the room record's `at`. **THE OPENING** (`hqGunDoorOpening`, battle.js
`encounterOpening`, run on the arrival's landing before the first activation, and after the ROUND 1 card when there
is no arrival): when the striking door was carried and covers the native lead, the door's own act runs on it
(`_gunDoorGust(door, lead)`… so the chain runs: a native blown onto the carried capture door is TAKEN on the first
frame). Otherwise the act lands as numbers from the battle row: the hit(s), the status, the gust's shove along its
lane, the maw's one tile toward the door. **AFTER** (the commit, `hqGunDoorsAfterFight(p, carry, _encDoorResults(carry))`):
each carried door gets the hp the board left it, a broken or folded one is removed, and a carried capture door is
spent. **THE ONE-WAY WEDGE**: the room wheel is now nine wedges (`wheel.wedges: 9`; the capture wedge after the
Threshold). LEFT CLICK stands a capture door from the bag (`hqGunCapturePlace`, one at a time, a second returns the
first), and RIGHT CLICK cycles the kind the bag holds (`hqGunCaptureChoices`; a Tuned Door is one choice per type, so
the player picks it). The record is `profile.door.hq.gunPlaced.capture`, and every room entry runs
`_hqGunCaptureSettle` (`hqGunCaptureRefund` unless it stands in that room), as does `hqGunDoorClear`. Probe API:
`ThreeRenderer.hq.gunCaptureSel / gunStrikeCheck`. Not browser-probed this delivery. Test: hq-gun-carry.test.js.
