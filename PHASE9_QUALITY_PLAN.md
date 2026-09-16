# PHASE 9 — THE WORLD · QUALITY PLAN (reconciliation of the 2026-09-15 brief against rev 63)

Prepared 2026-09-16 (UTC) for the user, from the repo at HEAD `a716f25` (`DOOR_HQ_BUILD_PLAN.md`
rev 63, `index.html` token `20260916-ring3-bermuda-01-cors`). Repo-only document; nothing in the
game files changed in this pass. The brief reviewed plan rev 60 — three revs (61 THE EYE,
62 THE URBAN BLOCK, 63 THE THIRD RING + THE BERMUDA TRIANGLE) landed after it.

**How this was verified.** Every claim below is labelled:
`CONFIRMED IN CODE` (read at the named file/function), `DOCUMENTED UNFINISHED` (the build
log says so and the code agrees), `DESIGN RECOMMENDATION` (a judgement, not a defect),
`REQUIRES PLAYTEST` (only a browser run can settle it — RULE #1c, none was run).
`npm test` was run at HEAD: **1438 pass · 0 fail · 4 skipped** (the four skips are the
pre-existing server-boot and network skips). Per-file counts for the Phase 9 tests are in §3.
Nothing was deployed; no Playwright, no browser. The "Deployment evidence" column is
**unknown** everywhere: the repo carries the rev 63 token, but whether R2 / Render carry the
same files is not something the repo can prove.

---

## 0. THE SHORT VERSION

1. The brief is mostly right about *what to look at* and mostly outdated about *what is
   missing*: THE EYE, the cleared room, the guarded envelope and the ward hook are built
   (rev 24 / plan rev 61); the any-surface, two-button, two-colour door gun is built (9.5 rev 2);
   both the gun and the deck are standard issue (`HQ_PORTAL_RULES.free`, `HQ_SKATE_RULES.free`);
   encounters are player-initiated by the holstered left click. Those decisions are preserved
   here as the active specification (§1).
2. **Two confirmed defects that must ship before the finds go live** (both latent because
   nothing is uploaded yet):
   - **Tape identity is positional.** `DOOR_TAPES` numbers T001…T100 by the order of
     `siteRooms.built` + the sheet's key order, and the profile files claims as `tape:Tnnn`.
     Every re-home since rev 18 (the spaceship, the Dutchman, the urban block, the Triangle)
     silently renumbered the shelf. After deployment, the next site added or tape moved
     re-labels every player's collection. §4 B1.
   - **Hazard pay is overwritten for a server account.** `hqCollectFind` credits
     `profile.account.gold` locally; the next `/api/progress/sync` returns the authoritative
     wallet and `_syncEconomyToLocal` replaces it. `door.hq.*` is not in the synced progress
     blob either, so claims never reach a second device. §4 B2.
3. **One confirmed copy/contract mismatch**: from a complex part or a cave chamber the strike
   toast says "THE ROOM IS THE BOARD" but the launch is always the SITE'S Δ (`launchId =
   site + '_delta'`), and the eye seed is null there (no board under the room). §4 B3.
4. The rest of the brief's Priority 1 is `REQUIRES PLAYTEST` — the plan's own build log says
   "unseen live" for all of Phase 9, and the tests are geometry/step-rule/source-scan tests,
   not camera-comfort tests. §7 lists exactly what a first playtest should record.
5. The two new asks are answered in §10 (rooms ↔ boards look) and §11 (THE FIELD — anywhere
   becomes an 8×8), each as a staged programme with acceptance, on the facts of the code:
   the site room already holds the Δ at 1:1 on a 1.7534 m lattice, the cave grid is already
   the battle's cell + half-level, and the seam today is a hard cut (`_hqLeave` disposes the
   HQ scene; `activate()` rebuilds the battle) softened only by the 1.4 s camera seed.

---

## 1. ACTIVE SPECIFICATION (P0) — one answer per behaviour, 2026-09-16

The build plan's Phase 9 section was written as a proposal and patched by appending. Where
the plan and the code disagree, **the code + the user's latest explicit decision win** and
are stated here. The plan's superseded bullets are marked in place (see §13).

| Behaviour | Active answer (verified in code) | Superseded text still in the plan |
|---|---|---|
| Encounter trigger | Player-initiated only. Door gun HOLSTERED + LEFT CLICK = the walker's attack clip; a native within `reach` 3.4 m, `cone` 55°, `dy` 1.8 m, line of sight (`_hqLosClear`), cooldown 1400 ms. E talks. `HQ_ENCOUNTER_RULES` (data.js), `_hqStrikeClick` / `_hqEncounterAim` (three-renderer.js), `_hqEncounterFire` (map.js). VS-CPU only (`isOnlineMatch()` refuses). | 9.4's "The roamer" (patrol, sight, hostile run, stinger, contact), the ROAMERS settings row, `EW_HQ_NO_ROAMERS`, rev 16's number keys. |
| Where encounters happen | Any WILD room = `hqRoomSite(roomId)` non-null (a site's board room or a complex part, the cave included). Facility rooms are safe by construction. | — (agrees) |
| What board an encounter fights on | Always the site's Δ 8×8 (`delta: true`, `launchId = site + '_delta'`), Arena · 4 unless the sticky config says otherwise (Clash / Gauntlet forced back to Arena). | 9.4 "the area you stand in becomes the board" is the GOAL (§11), not the shipped behaviour. |
| First battle frame | THE EYE: `hqEncounterEye(ev)` → `ThreeCamera.seedPose(seed, 1.4)`; no VS card, no intro cinematic, per launch (`_hqEncounterRun.noIntro`). Null (plain start) from a complex part or a cave. | 9.4's "three-camera.js has no initial-pose API". |
| Spawn orientation | NOT mirrored, on purpose: zones are keyed by seat + row (map.js `state.spawnZones[1]` = P1's row). Never swap `SPAWNS` alone. | 9.4's `spawnSide` bullet and its test line. |
| The dissolve (seam 3) | NOT built. Hard cut: `_hqLeave` disposes the room; `activate()` rebuilds the battle; the HQ load card is entry-only. | 9.4's "the crossing's dissolve shader on the HQ scene for 0.6 s" is still a promise. |
| After an encounter | Win → the same wild room, landing 1.0 m in front of the CROSSING console (`_hqGoTo('crossing')`), the beaten native gone until tomorrow (`door.hq.cleared`), its guarded envelope lit. Loss → Medical's cot, the chart reads RECOVERING. No hazard pay docked. | — (agrees; row 30 REC stands) |
| Door gun availability | STANDARD ISSUE for the test: `HQ_PORTAL_RULES.free: true` (cost 0, rank 1). The Quartermaster's signature returns with `free: false, cost: 24, rank: 4`. | 9.5 "Issue" (Keyholder + 24 Keys) and the plan's "Current implementation" paragraph. |
| Door gun controls | F draws / holsters, Q holsters. Drawn: LEFT CLICK places THRESHOLD A (cyan), RIGHT CLICK places THRESHOLD B (amber); a named slot moves its own row. Surfaces: floor set, WALL, CEILING; the door lies flat in the surface's plane. `_hqPortalAim(slot)`, `_hqPortalBasis`, `HQ_PORTAL_COLORS`. | 9.5 "LEFT CLICK places A, the next click B, the third moves A", "any WALKABLE SURFACE … never a wall". |
| Crossing a placed door | A wall door is walked into (press-in / E). A floor or ceiling hatch is crossed by TOUCH (`_hqTickPortalCross`), the twin's mouth HELD until the body leaves it; speed carried (clamped 2–18 m/s). Same room = hop; another room = the ordinary room change (`_hqGoRoom`). | — |
| Portal lifetime | ONE profile record `door.hq.portal`, rebuilt in the current room on every entry, kept across a match return and a modal, CLEARED on a fresh arrival from Play (`hqPortalClear` in `_hqRecordVisit(null)`). | — (agrees) |
| Skateboard availability | STANDARD ISSUE: `HQ_SKATE_RULES.free: true`; `free: false` = the find in Room 26. B drops / lifts the deck. | 9.8's "a `find` of kind `deck` in the locker room" as the only source. |
| Skate controls | W push (fakie push from a stop with S), S brake, A/D carve (right-minus-left subtracted from rider yaw; camera follows through `_hqRideTurn`), SPACE tap = small ollie, hold ≤ 0.42 s = higher, arrows = tricks, SHIFT grab. Ride stance Idle_10 turned `stanceYaw`. | 9.8's "the jump is an OLLIE (the existing HQ_JUMP_V)". |
| Finds | Tapes + daily pay (+ the deck when `free: false`). Potions / items / cubes REFUSED by `hqCollectFind` until an inventory owner exists. One profile transaction per take (map.js `_hqTakeFind`). | 9.1's `creditLocalGold` path (replaced by the one-transaction rule). |
| The hundred | Fixed at 100 (`HQ_FIND_RULES.tapes`, hq-finds.test.js). Re-homing a tape = moving a sheet row; every clip is `null` until the user's file is on R2. | 9.1's "unique ids and clips" test wording. |
| Links / ways | `DOOR_HQ.links` on `DOOR_HQ.routes` (ten lines incl. `undercroft`, `subway`); `hqLinkLive` the one liveness rule; nine `way` kinds built (wardrobe · well · train · mirror · pool · painting · fireplace · screen · closet); `phonebox` waits on A14, `tent` on a site. | 9.3's "the other eight kinds are builders + rows to come". |
| Complexes | Six: the Haunted House (4 parts, hall gallery), the cave (7, Hollow Earth's), the Spaceship (3), the Dutchman (3), the Strip (2), Downtown (2). A part launches its SITE'S Δ. | 9.2's "the first four complexes (REC)" table is history. |
| The crowding | Suites (rev 9) AND the third ring (rev 63) both shipped: exploration doors at level 2. | 9.3 "(b) THE GALLERY … when the box gallery ships". |
| Reviewed order | Every stage in the REC order has shipped locally at least once. There is no "NEXT: 9.5 then 9.4". | The "Reviewed order" paragraph. |

**Acceptance for P0:** a developer reading §1 + the marked plan cannot implement a
superseded behaviour by accident. The plan edits made in this pass are listed in §13.

---

## 2. CORRECTIONS TO THE BRIEF (what it could not know at rev 60)

- P2's "unfinished work" list: the explorer camera as the first frame, cleared-room behaviour
  and the Medical condition hook are **built** (rev 24). The dissolve and the spawn mirror are
  the two that remain, and the mirror is blocked for a stated engine reason (§1).
- P1 "floor-only, alternating-click portal instructions conflict with the later revision" —
  correct; the plan's 9.5 prose is the stale one and is now marked (§13).
- P1 "the simulated floor/ceiling loop reaching ~30 crossings per second" — the loop is real
  (`_hqTickPortalCross` runs every frame; the only rate limit is the mouth HOLD, released the
  moment the body leaves the mouth) and the audio throttle (map.js `_hqPortalStep`, one voice
  per 260 ms) is the only mitigation. The escape today is ESC → the pause menu → DIRECTORY
  → GO (the pause key is a document listener, so it works mid-air), or F then a placement on
  another surface while falling. Neither is a designed recovery. §6 D3, §8 item 6.
- P3 "hard tapes on high cells — a high cell alone does not prove the puzzle": the door gun's
  surface set (`_hqPortalSurf` = `_hqSurface(…, free)` lifted to `_hqBlockerFloor`) DOES
  include a +2 column's top (the site cell pushes a rect blocker with `top`), so a `hard` find
  is reachable in principle; no test proves each one is (`hq-finds.test.js` only pins
  `hard ⇔ lvl ≥ 2`). §8 item 9.
- P4 "discovered-route states": there are none — `door.hq` records `visits`, `lastDoor`,
  `lastRoom`, never a per-room or per-link "seen" set; `hqWorldRoutes` draws every live link.
  §6 D6.
- The brief's benchmark journey route exists end to end (verified by hq-complex / hq-world /
  hq-gallery tests): bay → `site_prebuilt_haunted` → THE FRONT DOOR (north wall, x −7.5) →
  the hall (the landing at 2.9 m, the flight out of the east corner) → the `stairs` door on the
  landing → upstairs → THE WARDROBE (east wall, z 0.4) → Camelot's north wall (x −5) → back
  through the same wardrobe, or Camelot's well → the cave → the mouth. §12.

---

## 3. STATUS TABLE

Automated evidence = the test file and its count at HEAD (all pass). Visual acceptance =
what the build log says the user has seen; `unseen` means the entry itself says so.
Deployment evidence = `unknown` for every row (see the header).

| Feature | Current behaviour | Remaining work | Automated evidence | Visual acceptance | Deployment |
|---|---|---|---|---|---|
| 9.1 Finds — tapes + pay | 100 tapes generated from `HQ_TAPE_SHEET`, one pay envelope per tape room (`hqBuildFinds`), sparkle procs, TAKE via E, the shelf in Room 360, strip pill, OFFICER row | B1 stable tape ids; B2 server-side pay; reserved kinds; clips (user); reachability test for `hard` rows; a TV that plays the last tape (stage 3) | hq-finds.test.js 8 | unseen | unknown |
| 9.2 Complexes (6) | Haunted House 4 parts (hall with gallery), cave 7, Spaceship 3, Dutchman 3, Strip 2, Downtown 2; `backDoors` arrays; park rule | Distinct landmarks / reveals per complex (§6 D7); natives on gallery slabs; a gallery on a site/cave room; a turning flight | hq-complex 7 · hq-gallery 7 · hq-cave 11 · hq-spaceship 6 · hq-dutchman 6 · hq-urban 6 | unseen | unknown |
| 9.3 World graph — links, routes, ways | 10 routes, every built site a station, 9 `way` kinds with builders + sounds, THE WORLD tab (subway map), the suites, the third ring | `phonebox` (A14), `tent`; the star chart's route lines; discovered-route state (D6); Room 8's weir ⇄ Atlantis (no lane) | hq-world 15 · hq-suites 6 · hq-ring3 7 · doorhq 97 | unseen | unknown |
| 9.4 Encounter | Holstered left click at a native → the site's Δ, THE LAST ROSTER, no builder, no intro, THE EYE seed, win → console / loss → the ward, cleared room, guarded envelope | B3 copy in parts/caves; return to the swing spot (D1); the native's identity pinned (D2); the dissolve (seam 3); THE FIELD (§11) | hq-encounter.test.js 17 | unseen (the one-shot on the Player rig, the eased first frame) | unknown |
| 9.5 Door gun rev 2 | Any surface, two buttons, two colours, flat-in-plane, touch crossing with carried speed, one profile record, standard issue | Specific refusal reason at the aim (D3); a designed recovery (D3); a rate/comfort cap on hatch loops (D3); arrival validation after async props (D4); learning situations (§6 D8) | hq-portal.test.js 11 | unseen | unknown |
| 9.8 Skateboarding rev 2 + control fix | Momentum rider, grinds on `_hq.rails`, quarter pipes, tricks, combo/bank, hold-to-jump, fakie, ride stance, camera-follow yaw fix | Feel (P5, playtest); soundtrack slot; graffiti; garage `skate` variant | hq-skate.test.js 15 | unseen | unknown |
| Promotion ladder / checklist | Field clearance from stabilized sites + Keys; `hqSiteChecklist` on the CRT and the door panels | Balance of the rungs (user) | rank-ladder.test.js 6 | unseen | unknown |
| Persistence of Phase 9 records | `door.hq.finds / portal / skate / encounters / cleared` in the localStorage profile only; gold local-credit | B2; multi-device sync of `door.hq` (D5) | (no sync test) | n/a | unknown |
| 7.7 wave 2 | 345 · THE BERMUDA TRIANGLE + the weir | Tartaria, the Tesseract, the waterspout, Flight 19 | delta-maps · motion-maps 5 · doorhq | unseen | unknown |

---

## 4. CONFIRMED IN CODE (defects)

### B1 · Tape identity is positional — `data.js` `DOOR_TAPES` (IIFE after `HQ_TAPE_SHEET`), `hqBuildFinds`, `hqCollectFind`
`DOOR_TAPES` assigns `id: 'T' + n` by walking `siteRooms.built.filter(k => HQ_TAPE_SHEET[k])`
then the sheet's remaining keys in insertion order. `hqBuildFinds` files each cassette as
`id: 'tape:' + t.id`; `hqCollectFind` writes `R.taken['tape:Tnnn'] = true` and
`R.tapes.push('Tnnn')`; `hqTapeShelf` and the pill read those ids back.
**Failure:** insert `prebuilt_tartaria` into `built` before `prebuilt_saturn` (wave 2's
next site) → every tape from that point shifts by two; a player's `T077` (THE HELM) becomes
THE COURSE. This has already happened four times locally (revs 18, 19, urban, Triangle);
nothing is deployed, so no profile is wrong yet. **Player impact after deployment:** the
collection silently re-labels; the "hint" rule (`hqTapeShelf`) points at the wrong rooms.
**Fix (one data.js change, no migration if it ships before the first upload):** give every
sheet row a STABLE key — `<sheetKey>#<slot>` (e.g. `prebuilt_revenge#0`) or an explicit
`tid` on the row — and make that the claim id (`tape:<key>`) and the record's `tapes` entry;
keep `no`/`Tnnn` as the DISPLAY number only (recomputed per build). hq-finds.test.js: adding a
site to `built` (in a vm copy) leaves every existing key unchanged; a claim made against the
old table resolves to the same title.

### B2 · Hazard pay does not survive a server sync; `door.hq` never syncs — `data.js hqCollectFind`, `profile.js serverSyncProgress → _absorbEconomyFromResponse → _syncEconomyToLocal`
`hqCollectFind` adds `amount` to `profile.account.gold`. For a server account,
`serverSyncProgress` (login, every match commit, the achievements tab) receives the
authoritative wallet and `_syncEconomyToLocal` sets `p.account.gold = econ.gold` — the local
credit is gone. The server pays only what `mergeProgressBlobs` reconciles from the
`progress` blob, and `door.hq.*` is stored beside `progress`, not inside it, so neither the
claim nor the pay reaches the server or a second device. (`creditLocalGold` documents the
same contract — "server stays authoritative when one exists" — so the plan's 9.1 warning was
right.)
**Player impact:** an online-account player takes an envelope, sees +30, and loses it at the
next commit; an offline profile keeps it. Tapes found on a phone are not on the desktop.
**Fix (REC):** put a monotonic `hq: { finds: { taken: { id: date|true } } }` map into the
progress blob (union-merge in `mergeProgressBlobs`, the colon-safe `KEY_RE` already allows
the ids), and let the server credit each newly-merged `pay:` claim once, exactly as it pays
achievement tier gold (`/api/progress/sync` reward path). Then `hqCollectFind` credits the
local mirror only when there is no server account (the `creditLocalGold` rule). Idempotent
under retries by construction (the taken map is the ledger). Test: a vm round trip through
`mergeProgressBlobs` keeps a taken id; a second merge pays nothing. **This is the ownership
model the brief asked to verify; it does not exist today.**

### B3 · "THE ROOM IS THE BOARD" is false in a complex part or a cave — `map.js _hqEncounterFire` (toast), `_hqEncounterStart` (`launchId = L.site + '_delta'`), `three-renderer.js _hqEncounterBoard` (returns null for `!st || st.cave`)
Striking a ghost in `site_prebuilt_haunted_hall` fights on `prebuilt_haunted_delta`, the eye
seed is null (plain frame), and the win lands at the board room's console — a different room
from the one you were in. The copy promises what §11 will build.
**Fix now (copy + landing):** the toast reads "ENGAGING · THE SITE IS THE BOARD" when
`_hqEncounterBoard()` is null; `_hqEncounterResult.room` (already carried) should be the
room the strike happened in and `_hqReturnOrMenu` should land THERE (with `at` = the swing
spot, D1) rather than at the board room's console.

### B4 · (doc) The plan's 9.7 numbers two different decisions "35" (encounters; Tartaria + the Triangle) while DOOR_MASTER Part C has 34 = the Rooftop, 35 = Tartaria/Triangle, 36 = water polo, and files the encounter rule under row 35's text at rev 16/17. One number per decision — REC renumber the encounter rule as Part C **row 30** (the encounter row, where the cost REC already lives) in both files.

### Hardening (confirmed shape, not reachable through the UI today)
- `window._hqEncounterRun` is consumed only by the match commit (`battle.js` before the Code
  Red block) or the start-failure branch. Every UI exit from a battle either forfeits
  (`forfeitMatch → checkWin → finalizeMatch → commit`) or follows a commit, so the marker
  cannot go stale today; a future exit path that skips `finalizeMatch` would make the NEXT
  unrelated match skip its intro, seed a dead eye and record an encounter result. REC: clear
  it in `startMatch` for any launch whose `_hqPreselect.encounter` is absent. One line.
- `_hqEncounterRun.walker` is written and never read (dead field; keep or drop).
- `DOOR_HQ.units = 73` makes the room cell `128 / 73 = 1.7534 m` while `HQ_TILE_M = 1.75`
  (prop scale only). 2.7 cm over a board; harmless today, but §11 aligns everything on ONE
  constant.

---

## 5. DOCUMENTED UNFINISHED (the build log says so; the code agrees)

- 9.4 seam (3) the dissolve; the `spawnSide` mirror (blocked by the zone system — §11 solves it
  by generalising zones to explicit cells).
- 9.1 reserved kinds (potion / item / cube); the clips (user assets); a TV that plays the
  last tape.
- 9.2 natives on a gallery slab; a gallery on a site / cave room; a half-landing flight; the
  Dutchman's stern windows as a streaming-sea card.
- 9.3 `phonebox` (A14), `tent`; the star chart's route lines; the weir ⇄ Atlantis; a
  rock-shell cave ceiling; a stream that flows.
- 9.5 declared roofs (`shells[id].roofs`), the tutorial lesson for the gun.
- 9.8 soundtrack slot, graffiti, the garage `skate` variant.
- 7.7 wave 2: Tartaria, the Tesseract, the Triangle's waterspout / Flight 19 / yacht quay.
- Every Phase 9 entry: "unseen live".

---

## 6. DESIGN RECOMMENDATIONS (not defects)

- **D1 · Return to where you swung.** `_hqEncounterRun` already carries the strike's `x, z,
  y, yaw` (the dead `walker` field). Land the win there (`_hqEnter({ at: { x, z, face } })` —
  `_hqGoTo` takes a counter / door id today; add a free-spot form) with the beaten native gone
  from that spot. The brief's "why did I return here" then answers itself.
- **D2 · The native's identity.** `_hqCpuPool` pins the race FIRST in P2's random pool; the
  gender and look are not carried, and the unit is not guaranteed to be seat 1. Carry
  `{ race, gender, appearance? , name }` into `state.partyMeta[2][0]` from
  `_hqPreselect.encounter` (state.js `optimizeRandomizeParty` pinned path) so the enemy's lead
  IS the character you hit, named on the nameplate as the room named it.
- **D3 · Door-gun feedback and recovery.** (a) the ghost turns red with no reason at the aimed
  point — surface the `_hqPortalFits` reason as a 3D label on the ghost (`fluid` · `too near`
  · `the twin` · `a door's lane` · `the frame`); (b) A/B beyond colour: the ghost and the
  placed frame already wear "THRESHOLD A/B" text planes (`_hzTextTex`); add a SHAPE cue too
  (A = the door leaf, B = the leaf with the case line; or a triangle / square jamb lamp) for
  colour-blind reading; (c) a hatch loop: cap the crossings per second (a mouth re-arms only
  after 250 ms AND after the body has left it), and give the walker the ESCAPE: holding F for
  0.6 s removes both doors (`hq.portalRemove` exists, unbound) with a toast, from anywhere,
  falling included; (d) camera comfort in a loop: the boom must not re-seek through the
  ceiling on every hop — clamp the boom's pitch during `portal.cross` and fade the screen 80 ms
  per crossing after the third. REQUIRES PLAYTEST to tune.
- **D4 · Arrival validation.** `_hqGoTo` lands 2.4 m in front of a door; a portal's twin lands
  on `px, pz`. Props' blockers come from the catalogue `foot` / `rect` at placement, so an
  async GLB never changes the blocker set — but a `_hqSeatLater` re-seat can lift a small prop.
  REC: `_hqPortalHop` runs `_hqAirClearOfBlockers` for the whole body height at the exit and
  nudges along the twin's normal up to 0.6 m before giving up (then the recovery in D3c).
- **D5 · Multi-device `door.hq`.** B2's blob is the vehicle; add `cleared`, `encounters`,
  `skate.best` (monotonic) to it. `portal` and `punch` stay local (a visit's rope; a day's
  clock).
- **D6 · Discovered routes.** A per-link `seen` set in the progress blob written by
  `_hqEnter` when a link door is USED; THE WORLD tab draws unseen legs dotted and unlabelled,
  seen legs solid; GO stays available for every station (the user's convenience rule — no new
  fast-travel restriction without a decision). The register already answers "where am I"
  (the strip prints ROOM № · NAME · FUNCTION; a part prints its site's number).
- **D7 · Complex identity.** Each of the six complexes wants ONE landmark, one spatial idea,
  one reveal, one discovery, one return — the Haunted House has the hall's landing + the
  wardrobe + the well already; the Spaceship's is the sun through the bridge viewport and the
  airlock's collars; the Dutchman's the guns run out and the bilge's plunge pool; the Strip's
  the casino with no clock; Downtown's the platform and the train; the cave's the six well
  heads. Author the REVEAL beats (a door that opens onto the sun, the train's arrival) as room
  variants or tickers, not new rooms. Quiet rooms are allowed: strike the pay envelope from the
  smallest parts (the attic, the closet) so not every room reads tape + envelope + rail + exit.
- **D8 · The door-gun learning sequence.** Six situations exist in the world already; none is
  labelled. Bind them: (1) A→B on the floor: the Training Room's RANGE console (a plaque:
  PLACE A · PLACE B · STEP THROUGH); (2) a visible ledge: the Haunted House hall's landing with
  `stairAt` kept (the stair is the alternative — good: the first lesson must not be portal-
  exclusive); (3) rooms: the foyer ↔ the hall (safe both ends); (4) a wall exit: Room 9 (the
  upside-down room — a ceiling hatch out of the flipped office); (5) falling + momentum: the
  stairwell loop (a floor hatch at the bottom, a ceiling hatch on the top landing); (6) the
  combination: a `hard` tape on the Singularity's +2 rim seen from the walkway. Each gets a
  one-line plaque (Claude drafts, A15) and a `findSpots` pin so the payoff is where the lesson
  lands. Acceptance: a tester who has read no notes reaches the six payoffs; each situation has
  a non-portal way back (a door, a stair, ESC → DIRECTORY).
- **D9 · Tapes as different lessons.** Audit `hqFindSpot`'s "farthest free point" output per
  room (a headless dump: room → tape spot → the reason) and hand-pin (`DOOR_HQ.findSpots`)
  the ~20 that should teach observation / navigation / portal / optional fight / evidence,
  keeping the hundred and the ids (after B1). The user owns titles and captions (A15).

---

## 7. REQUIRES PLAYTEST (record these; do not tune blind)

The plan's build entries name what to eyeball first; the brief's P1/P5 add the following, all
of which have automated geometry proofs but no camera/feel proof:
1. The boom under the hall's landing and on the third ring; the boom on the stairwell's
   landings; the doorway blocker on wide (revolving / hangar) doors.
2. Every `way` object's traversal timing and sound (the wardrobe, the well, the train's
   arrival, the mirror, the pool, the painting, the hearth, the screen, the closet).
3. A hatch loop (floor 0 + ceiling 2.7 m) for 10 s: frame rate, audio, the boom, the escape.
4. The encounter's one-shot on the Player rig, the strike frame vs the toast, the eased first
   frame, the emptier walkway after a win, the ward landing.
5. The rider: deck alignment under Idle_10, the grind height on the mezzanine arc, the
   quarter pipe's launch, the camera at speed, a door at speed.
6. Frame time in the busiest rooms (the cavern 52 × 42 m, the ring with all bays, the casino)
   cold and warm — the brief's target table needs NUMBERS from named hardware; none exist.
Use `NODE_USE_ENV_PROXY=1 node playtest_hq.js <room>` (real CDN) or
`node playtest_hq_offline.js <room> '<views>'` (stand-in textures) per PLAYTEST_NOTES.

---

## 8. PRIORITIZED BACKLOG

Each item: impact · evidence · files · dependencies · change · acceptance.

1. **B1 stable tape ids** — impact: the collection survives every future site; evidence:
   confirmed; files: data.js (`HQ_TAPE_SHEET` rows → keys, `DOOR_TAPES`, `hqBuildFinds`,
   `hqCollectFind`, `hqTapeShelf`, `hqTapeById`), map.js `_hqTapesHtml` (reads `id`),
   hq-finds.test.js; deps: none — MUST precede the first finds upload; acceptance: the test in
   §4 B1; the shelf's display numbers unchanged today.
2. **B2 server-owned finds** — impact: online-account players keep hazard pay and their tapes
   follow them; evidence: confirmed; files: data.js `mergeProgressBlobs` (+ the `hq` key),
   `hqCollectFind` (credit rule), profile.js (`profileSaveProgress` after a take, so the
   debounced push fires), server.js `/api/progress/sync` (pay the newly-merged `pay:` claims
   once); deps: B1 (the ids in the blob must be stable); acceptance: vm merge test; a server
   boot smoke with a synthetic sync paying 30 once and 0 the second time; `npm run test:parity`
   untouched (no economy constants move).
3. **B3 + D1 + D2 encounter truth** — impact: "whom did I attack, where, why am I here";
   evidence: confirmed (B3) / recommendation (D1, D2); files: map.js `_hqEncounterFire`
   (copy), `_hqEncounterStart` / `_hqReturnOrMenu` (land in the strike's room at the swing
   spot), three-renderer.js `_hqGoTo` (a free-spot `at`), state.js `optimizeRandomizeParty`
   (pin the lead's identity), hq-encounter.test.js; deps: none; acceptance: from the hall,
   the toast says THE SITE IS THE BOARD, the return is the hall at the swing spot facing the
   empty spot, P2's unit 1 is the native's race + gender and wears its room name.
4. **Plan reconciliation (P0)** — done in this pass (§13); acceptance: §1's table has no row
   whose "superseded" text is unmarked in the plan.
5. **D3a/b portal feedback + A/B shape** — impact: the puzzle reads; evidence: recommendation;
   files: three-renderer.js `_hqPortalAim` (reason → ghost label), `_hqPortalBuild` (shape
   cue), data.js `HQ_PORTAL_RULES.labels`; deps: none; acceptance: every refusal reason in
   `_hqPortalFits` has a visible word; a monochrome screenshot tells A from B.
6. **D3c/d hatch-loop cap + ESCAPE** — impact: no trapped player; evidence: recommendation +
   the brief's loop; files: three-renderer.js `_hqTickPortalCross` (re-arm rule),
   `H.onKeyDown` (hold F = remove both), map.js `_hqPortalStep` (toast), hq-portal.test.js;
   deps: none; acceptance: a vm loop of 10 s crosses ≤ 4/s; F-hold from mid-air lands the
   walker on the floor under the lower hatch with both doors gone and the record cleared.
7. **THE DISSOLVE (seam 3) — stage A of §11** — impact: the cut stops being a load; files:
   three-renderer.js (`_hqLeave({ dissolve })` keeps the scene 0.6 s, fades shell / walkway /
   props / natives with the crossing's `_introFadeMats` rule, then disposes), battle.js
   `showVSSplash` (the seed already), map.js `_hqEncounterStart`; deps: 3; acceptance: a
   screenshot at t = 0 and t = 0.6 s from the same eye differ only by the dissolved pieces and
   the units; no load card.
8. **D6 discovered routes + D7 complex reveals** — files: data.js (`hqLinkSeen`, the blob key),
   map.js `_hqWorldHtml`, `_hqEnter`; the variants / tickers per complex; deps: B2's blob;
   acceptance: a fresh profile's WORLD tab shows the facility's line and dotted unknowns;
   walking a link solidifies it; each complex has its named reveal in the build log.
9. **`hard` reachability test + D8 learning plaques + D9 pins** — files: hq-finds.test.js (a vm
   `_hqPortalFits` at each `hard` cell from the walkway), data.js `findSpots`, six plaque
   procs; deps: 5, 6; acceptance: every `hard` find has a legal placement in reach of a
   walkable aim point; the six situations exist with a non-portal way back.
10. **Playtest pass (§7)** — once 1–7 are in and uploaded; the numbers go into PLAYTEST_NOTES.
11. **§10 rooms ↔ boards look, stages 1–3** — after 10 (the look needs eyes).
12. **§11 THE FIELD, stages B–E** — after 7 and the user's decisions in §14.
13. Deferred until the benchmark (§12) is accepted: urban interiors beyond the two, more
    platforms, new locations (Tartaria, the Tesseract), extra tricks, water polo.

---

## 9. IMPLEMENTATION SEQUENCE (reviewable deliveries)

- **Delivery 1 — THE LEDGER** (data.js, profile.js, server.js, tests; index.html bump): B1 +
  B2 + the `startMatch` clear. Ships before any finds go live.
- **Delivery 2 — THE ENCOUNTER'S TRUTH** (map.js, three-renderer.js, state.js, data.js copy;
  tests): B3 + D1 + D2 + the dissolve (item 7).
- **Delivery 3 — THE GUN READS** (three-renderer.js, data.js, map.js; tests): D3 + D4 + the
  `hard` reachability test.
- **Delivery 4 — THE MAP REMEMBERS** (data.js, map.js, styles-base.css; tests): D6 + D8 + D9.
- **Delivery 5 — the playtest** (PLAYTEST_NOTES.md) → then §10 / §11 in their own
  deliveries.
Each delivery = one `ENTROPY_WARS_<TOPIC>.zip`, `npm test` green, the token bumped, the
caption saying R2 / Render / repo per file (RULE #1, #1b).

---

## 10. THE LOOK — battle boards ↔ rooms, and vice versa (the user's first new ask)

**What is already shared (confirmed):** the site room draws the SAME Δ at 1:1
(`_hqBuildSiteBoard` ← `hqSiteBoardInfo`), runs the SAME near builder inside itself
(`_hqBuildSetting` → `_NR_BUILDERS[key]` with `ctx.hq`, the enclosure primitives no-op'd),
hangs the SAME sky and far roster (`_hqBuildSky` on the battle's `_envUni`), uses the SAME
monument builders and the SAME post stack (`ThreePost.renderScene` in `_hqFrame`).

**What differs, and why the board in a room does not look like the board in battle:**
| Piece | In the room | In the battle | Fix |
|---|---|---|---|
| Board cells | `siteMat`: `MeshPhongMaterial` (shininess 8, specular), `_hzTex(key)` + the cell's tint, emissive lift 0.12 with the map as emissiveMap; instanced planes + boxes, `CM × 0.995` | `rebuildTerrain` voxel columns, Lambert through `K.mat` / `_evTintMat` with `TERRAIN_BASE_TINT` (the street's darkening) and THE ONE TINT rule | **Stage 1**: build the room board's cell materials through the battle's material path (`_evTintMat` + base tint, Lambert, no emissive lift — the room's own lights carry it) and, REC, generate the top/side geometry with the battle's column mesher on a `K` kit (the §0 "no voxel mesher" guardrail was a cost rule; 64 columns cost nothing; shadows stay off) |
| Light | HQ constants per shell kind (open room: sky-tinted hemi + a sun at (0.45, 1, 0.3), 0.55 / night 0.22; box room: fluorescents + `mood`) | `_updateEnvironment`: the env row's tint, sun colour / direction / intensity, fog | **Stage 2**: an open site room takes its sun + hemi from the map's env row (one helper both sides call — `_envLightRig(env)` — the room adds its lamps on top) |
| The horizon | an apron / skirt past the walls, the far roster hung round, no ground to the horizon | THE WORLD (`_worldBuild`: ground disc / planet, rim, haze, root, the entropy dissolve) | **Stage 3**: run `_worldBuild` for an open site room with `edge: 'open'` at the room's transform, `stab` pinned to 1 (grounded), the cavern wall for `kind: 'cavern'`; kill-switch `EW_HQ_NO_WORLD` |
| Furniture | the walkway / quay, the console, the battle marker, the signboards, the lamp masts, the natives, the crossing threshold | none of it | **Stage 4 (the reverse)**: when a match is launched FROM a room (an encounter or the console), the battle's near setting also draws the room's furniture through the HQ builders on the battle scene (`_nrRoomFurniture(K, room)`: the quay's deck / the walkway / the masts / the console as blockers outside the board) — this is §11 stage C's bridge, built once |
| Scale constant | `128 / DOOR_HQ.units` = 1.7534 m; props at `HQ_TILE_M` 1.75 | `CONFIG.tileSize` 128 | **Stage 1**: `DOOR_HQ.units` → `128 / 1.75 = 73.142857…` or the room cell fixed at 1.75 m (`HQ_TILE_M`) everywhere; one constant, both sides |

**Acceptance (per stage, screenshot-driven — RULE #1c, the user eyeballs):** for three maps
(a planet, a moat map, an urban map) a pair of shots from the SAME eye — the room at the
console (`playtest_hq_offline.js`) and the battle at round 1 (`playtest_world.js`) — differ
only by the units, the HUD, the room's furniture and the sky's time. hq-visual-pass.test.js
grows a source guard: the room board's material factory calls the battle's tint path; no
`MeshPhongMaterial` on a site cell.

---

## 11. THE FIELD — anywhere you stand becomes the 8×8 (the user's second new ask)

**The goal as the user states it:** exploration → an 8×8 fight where you stand → back, near
seamless; and the two hard questions: the grid must impose on rooms that are not straight or
square, and the units are not on squares when the fight starts.

### 11.1 What the code already gives us (confirmed)
- A lattice already exists under every wild room: a site room's Δ at 1.7534 m per cell
  (`_hq.site.cells`, `_hqSiteCellAt`: room x → column, room z → row); a cave chamber at
  `HQ_CAVE_CELL` 1.75 m with `HQ_CAVE_LEVEL` 0.875 m = HALF a battle level (a battle level =
  one tile: `ELEV_STEP_RATIO` 1.0); a box room in metres with every prop a disc / rect
  blocker with a `top`, a gallery slab at `h`, layers the walker reads through ONE function
  (`_hqSurface` → the site cell / the cave feet / the gallery / the ring / the blockers).
- The Δ forge already builds a playable 8×8 from data (`_mfDeltaNew`, heights, terrain keys,
  thin walls `M.wall` with `see`, monuments, edge-wall slabs, objects), and the battle builds
  its board from `state.boardColumns` at `CONFIG.tileSize` with the near setting from
  `state.mapEnv.near`.
- THE EYE (`seedPose`) makes the first frame the walker's; the strike leap already tweens a
  body 0.45–0.9 tiles to square up on a victim.
- The seam is a hard cut: `_hqLeave` disposes the room scene; `activate()` rebuilds the
  battle. Nothing persists across it but the camera seed and the profile.

### 11.2 The reconciliation, stated as rules
1. **The grid is LOGICAL; the room is the geometry.** The 8×8 is a WINDOW laid over the
   room's own lattice, never a new floor. What you see in the fight is the room (its shell,
   props, gallery, water) drawn by the same builders; what you play on is 64 cells the
   rasteriser judged from the room. A wall may cut a corner of a cell — the CELL is in or out,
   the wall is drawn where it really is.
2. **The frame.** Origin = the room's lattice (a site room: the Δ's own — the window then
   coincides with the board when you fight on it; a cave: its grid; a box room: a lattice on
   the room's axes with its origin at the room centre). Position = the 8×8 whose centre is
   nearest the midpoint of the officer and the target, snapped to the lattice, then SLID
   (not rotated) so that both stand inside it and the count of IN cells is maximal. No
   rotation: rooms are axis-aligned boxes and the cave / site grids are already axis-aligned
   (the rotunda is safe by construction and never a field).
3. **In / out.** A cell is IN when its centre is inside the room's walkable surface set
   (`_hqSurface` free query non-null, not a never-fluid) and ≥ 50 % of its footprint is clear
   of the shell. An OUT cell is an OFF cell: `chasm` (impassable, sight passes) where the room
   simply ends (an open room's edge, a pit) and a `+2 rock` column (impassable, sight blocked)
   where the room's WALL stands — the thin-wall primitive (`M.wall`, `see`) draws the true
   wall plane on the cell's edge when the wall lies within 0.3 m of an edge. A corridor three
   cells wide yields a 3 × 8 field inside rock — that IS the corridor, and it plays.
4. **Heights.** `lvl = round(surface / 1.75)` from the room's floor; then a CONNECTIVITY
   pass: for every pair of adjacent IN cells the walker could step between (one cave level,
   `HQ_STEP_TOL`, a ramp letter), the battle delta is clamped to ≤ 1 by carrying a +1 stair
   along the slope (the cave's 24 ramp letters map straight onto this; a 0.875 m step becomes
   0 or +1, never a wall). Guarantee: **if the walker could reach a cell, a unit can**
   (`hqCaveReach`'s BFS run on both sides is the test).
5. **Props.** A blocker's `top` < 0.5 m → floor; 0.5–2.2 m → +1 (a table, a crate, a riser —
   climbable, sight passes); > 2.2 m → +2 (a cabinet, a pillar — a wall). A `rect` covering
   ≥ 50 % of a cell counts; smaller props are scenery the near pass draws and the cell ignores
   (the walker already walks round them at `HQ_BODY_R`). Fluids: `~` → water (wade), deep →
   `deep_water`, lava → lava, a moat → the Δ's own liquid.
6. **Layers.** A gallery slab (2.9 m) rounds to +2 with its flight as +1 treads → a real
   two-storey field (the top is reachable by the stairs, a wall from below). The third ring
   is never a field.
7. **Units off the squares.** At the strike frame every participant SNAPS to its cell centre
   with the strike-leap's own tween (≤ 0.9 m, 300 ms) BEFORE the cut — the officer's cell is
   P1's seat 1, the native's cell is P2's seat 1. The rest of both teams ARRIVE: P1's party
   through the nearest room door on the frame's edge (or a placed threshold — the door gun's
   A if it stands in the frame: the story's answer to "where did my team come from" is the
   crossing's threshold, which the intro already walks teams through), P2's from the native's
   side of the frame. This requires **explicit spawn cells per seat** (`SPAWNS[p] =
   [{x, y}…]` honoured by the zone builder instead of "seat + row") — the same change that
   unblocks the `spawnSide` mirror, done once.
8. **Modes.** A field is a WIPEOUT fight (TDM-style kills / team wipe, no nexus zones, no
   Keys, no Cube — a room has none of them); Arena stays the CONSOLE's crossing on the site's
   authored Δ. `hqEncounterConfig` already forces Clash / Gauntlet back to Arena; a field forces
   Arena → TDM. **User decision (§14 row A).**
9. **The cut.** The battle board is built AT THE ROOM'S TRANSFORM (the window's origin in
   room metres → the battle's tile origin: `_hqBuildSetting` already does the inverse with
   `g.position.set(-N·ts/2, -B·elev, -N·ts/2)`), so the eye seed is exact and the shared
   pieces (the room's shell, props, sky, setting, drawn by the HQ builders as the battle's
   near setting — §10 stage 4) do not move. What is NOT in the fight (the walkway's people,
   the console's screen, the finds) dissolves over 0.6 s (the crossing's fade rule) while the
   board's cell edges and the two spawn thresholds FADE IN over the room's floor. No load
   card. The return reverses it: units dissolve, the room's population comes back, the walker
   stands on P1 seat 1's final cell, facing the way it faced.
10. **Nothing on `state` but the board** (RULE #2): a field is a VS-CPU launch; the generated
    Δ rides the ordinary `PREBUILT_MAPS`-shaped object under a synthetic id
    (`field:<roomId>:<ox>,<oz>`), so online parity has nothing to relay.

### 11.3 The stages (each its own delivery, each shippable alone)
- **A · THE CUT ON A SITE ROOM (no rasteriser).** The site room's board IS the field: the
  window = the Δ. Build: the dissolve (§8 item 7), the snap + explicit spawn cells (rule 7),
  the native as P2 seat 1 (D2), the return to the cell (rule 9), the battle at the room's
  transform with the room's furniture as setting (§10 stage 4). Acceptance: from a site
  room's walkway, strike a native standing ON the board: the screen never cuts to black, the
  board's cells fade in under the walker's feet, seat 1 stands where the walker stood, the
  enemy's lead is the native; after the fight the walker stands on seat 1's last cell and the
  native is gone. hq-encounter.test.js: the snap picks the cell the walker's feet are in; the
  spawn list is explicit; the transform round-trips (room metres ↔ tiles) within 1 mm.
- **B · THE RASTERISER ON THE CAVE.** `hqFieldFromRoom(roomId, ox, oz)` (data.js, PURE: reads
  the room sheet — the cave grid's `hqCaveCompile` cells, the box shell, the catalogue props'
  `foot` / `rect` / `top`, the gallery) → a Δ object; the cave first because its grid is
  already the battle's lattice. Acceptance: hq-field.test.js — for every chamber and every
  legal window, `hqCaveReach` on the cave and the engine's move BFS on the Δ agree on
  reachability from the walker's cell; no cell is a wall the walker could step; OFF cells are
  rock; `npm test` builds and validates every generated Δ through the forge's own checks
  (`delta-maps.test.js`'s rules).
- **C · THE RASTERISER ON BOX ROOMS + THE ROOM AS THE SETTING.** The complex parts (the hall
  with its gallery, the hold, the casino). The near pass draws the room (`_nrRoom` from the
  DOOR_HQ sheet through the HQ builders on the battle scene — the bridge §10 stage 4 built).
  Acceptance: the six complexes' 18 parts each yield ≥ 24 IN cells with ≥ 2 heights from
  some window; the hall's landing is a +2 tier with its flight as +1 treads.
- **D · THE WINDOW'S CHOICE + THE EDGE.** Rule 2's slide, the thin walls on cell edges, the
  corridor case, a door on the frame's edge as a threshold object. Acceptance: a headless
  dump of every wild room's best window (a text grid per room in the test's output) reviewed
  by the user; the strike from any point of any wild room yields a legal field.
- **E · THE HUD OF THE FIELD.** The mode's copy (THE FIELD · WIPEOUT), the scoreboard, the
  result stamp's site line reading the room, the OFFICER sheet's encounters row by room.

### 11.4 What this does NOT change
The console's crossings on the authored Δs, Arena's zones, the bays, the tutorial, online
play, the Door Agent's board doors. The site room's board stays hand-authored; the field is
generated only from rooms that have no Δ under the walker.

---

## 12. THE BENCHMARK JOURNEY (adopt, with the verified route)

HQ foyer → the hall → Bay (Terrestrial) → threshold 13 → `site_prebuilt_haunted` (the board
room, the console) → THE FRONT DOOR (n, x −7.5) → THE HALL (the landing at 2.9 m, the flight
east; the hearth to the North Pole on the east wall) → `stairs` (on the landing, x 1.0) →
UPSTAIRS → THE WARDROBE (e, z 0.4) → CAMELOT (n, x −5) → back through the wardrobe (the same
object) — or CAMELOT's well → THE WELL ROOM → the gallery → the mouth → HOLLOW EARTH.
Exercises: facility navigation, the gallery's climb + the boom, an authored discovery (the
hall's tape THE FRONT DOOR, INSIDE; the upstairs tape THE WARDROBE), a portal situation (the
landing with the stair as the alternative), an unusual entrance with its sound (`wayCreak`),
a deliberate encounter (a native on the house's walkway) and its return, persistence (a
tape taken, the game reloaded, the shelf still shows it — after B1/B2).
**Acceptance targets to set before calling it done:** no black cut longer than the load
card's fade on any room change; no stuck walker (a walker that cannot move for > 2 s outside
a modal); no lost or duplicated claim across a reload; the tester names the room, the exit and
the site from the strip and the WORLD tab without help; the encounter's return is the swing
spot.

---

## 13. PLAN EDITS MADE IN THIS PASS (P0, docs only)

- `DOOR_HQ_BUILD_PLAN.md` Phase 9 heading: "(planned 2026-09-15, nothing shipped)" →
  "(stages 9.1–9.5 + 9.8 shipped locally, revs 43–63; active spec in
  PHASE9_QUALITY_PLAN.md §1)"; a short ACTIVE SPECIFICATION pointer block under the heading;
  a `[SUPERSEDED — see PHASE9_QUALITY_PLAN.md §1]` marker on 9.4's roamer / launch / seam
  bullets, on 9.5's "The object" / "Issue" / "Renderer" bullets, and on the "Reviewed order"
  paragraph. Historical text kept in place, marked, never deleted.
- `DOOR_HQ_BUILD_PLAN.md` §9: a build-log entry for this review.
- `DOOR_MASTER.md` Part D: one entry pointing here.
- `CLAUDE.md`: one section pointing here.
No game file changed; no cache bump.

---

## 14. USER-OWNED DECISIONS AND CONTENT (needed later, not blocking §8 items 1–7)

| # | Decision | Needed by |
|---|---|---|
| A | THE FIELD's mode: WIPEOUT (REC) vs the sticky mode with zones dropped | §11 stage A |
| B | The party's arrival in a field: through the nearest room door (REC), through the door gun's A, or seated in the nearest free cells | §11 stage A |
| C | Renumber the encounter decision to Part C row 30 (B4) | docs |
| D | Which six door-gun situations get plaques (D8's list is a proposal) and their wording (A15) | §8 item 9 |
| E | The tapes' titles, captions, clips (A15); which ~20 tapes are hand-pinned (D9) | §8 item 9 |
| F | Whether a won room stays quiet all day (shipped: until tomorrow) — row 35's open question | none |
| G | Discovered routes drawn dotted (D6) — a display rule only; GO stays for every station | §8 item 8 |
| H | The room cell constant: 1.75 m everywhere (REC) | §10 stage 1 |
| I | `phonebox` (A14 HOME's phone) — story | 9.3 |
