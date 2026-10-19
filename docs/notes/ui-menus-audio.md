# Notes: ui-menus-audio

Moved verbatim from CLAUDE.md on 2026-09-24 (sections in original order). Main menu, terminal, forge, HUD, nameplates, pause menu, music.
Append new notes for this system at the end of this file.

## THE CROSSING (opening cinematic) — added 2026-09-06
The match intro (battle.js `playOpeningCinematic` + three-renderer.js
`introCineStart/_introBuildDoor/_introUpdateDoors`) no longer marches teams up
a staircase (the MAP SETTINGS aprons buried it). Each team files through a
freestanding D.O.O.R. threshold standing on the setting's apron outside its
spawn lane (past the moat): the leaf is the map's own `DOOR_HQ.thresholds`
catalogue door (data.js; `_delta` stripped from the mode id, else the `near`
key, else `leaf_closet_alt`), buzzed open / stamped shut with the DOOR sound
kit, dissolved at the cross-map push. Units are hidden "on the other side"
until their turn (walk-tween `_holdHidden`). The near kit publishes the apron
facts in `_nrLastKit` (apron top, level `B`, moat gap) — a board with no
setting gets a floating landing instead. Loading screen pre-warms the leaf
(`introCineWarm`). Lone doors also float in every far roster (`_hzLoneDoor`,
monument key `door`). Kill-switch unchanged: `window.EW_DISABLE_INTRO_CINE`.
Camera framing for beats 1–2 is anchored on `info[p].doorOut`/`zB` (battle.js
`doorLift`) — tune those two numbers before touching the renderer.

## THE MAIN MENU SCENE (the lone door in the open) — added 2026-09-08
The main menu's black void is a PLACE: three-renderer.js `ThreeRenderer.menu`
(`_menuEnter/_menuLeave/_menuBuild`, right after `_hqApi`) is a self-contained
scene on the SHARED renderer — same contract as the HQ — re-parented into
`#menuStage` (index.html, first child of `#mainMenuPage`) by map.js
`_menuSceneEnter` (called from `_showTitlePage` for `mainMenuPage`; every
other page calls `_menuSceneLeave`). ONE crossing door stands ~65% across
the frame (right of the text column) in the middle of a desert or out on
the Antarctic ice, the Sedan (the honda civic's static car GLB) is parked
off to the side with its headlights on the door, the site's own sky + far
roster (`_hqBuildSky(room, Hx)` / `_hqTickSky(now, Hx)` now take a target
record) hang round it, the page's CSS motes drift over it, and a scrim
(`.void-menu.menu-3d .menu-stage::after`, styles-base.css) keeps the left
column readable. The door IS the match door: `_introBuildDoor` (the
crossing's threshold builder — frame, seal, case line, catalogue leaf —
the leaf is a PLAIN door, `leaf_hollow_core`, per the user) on a flat kit
at y=0; `_MENU_BIOMES` (renderer) holds every framing number (camAt /
lookAt / doorAt / doorYaw / sedanAt / sedanYaw / cineDist / cineSide /
cineLookOff in METRES, the leaf key, the floor terrain key, the far
roster, `lightMul`) — tune those, not the code. **The camera looks down
+Z, so SCREEN-RIGHT IS WORLD −X** (the door stands at x = −2.6 to land
right of frame — the first cut mirrored it). The door stands SHUT on a
fresh arrival from the title (`enterGameFromTitle` → `menu.reset()`);
ENTER on the menu (ui.js keydown → map.js `_menuSceneEnterKey`) plays
THE ENTER BEAT — `menu.playEnter()`: the camera pushes to cineDist m in
front of the door (`_MENU_CINE` keyframes: push 1.7 s, the buzz + swing
at 0.8 s, hold 1.1 s, pull 1.9 s), the leaf swings open with the light
behind it, then the pull back out with the door left open; ENTER again
shuts it (the stamp). The "⏎ ENTER · THE DOOR" hint (`#menuEnterHint`)
shows while it stands shut (`onState` callback). Screenshot it with
`NODE_USE_ENV_PROXY=1 node playtest_menu.js desert|antarctica [tag]`
(repo tooling; `EW_MENU_CINE_SCALE` stretches the beat so a ~1 fps
software-GL run can photograph it — see PLAYTEST_NOTES "THE MAIN MENU
SCENE"). Built once per session and kept across visits;
`menu.dispose()` drops it (the Settings biome button rebuilds). Off = the
classic void: `?nomenu3d`, localStorage `ew_menu3d='off'` (Settings → Main
Menu Scene), `window.EW_NO_MENU_SCENE`; `EW_MENU_BIOME` / `?menubiome=` /
localStorage `ew_menu_biome` pick desert / antarctica (else a coin toss per
load); `EW_MENU_NO_POST` = bare render. Entering parks a post-match battle
renderer (same guard as `_hqEnter`) and refuses over a live battle or the
building (map.js leaves a suspended HQ first). Fixed on the way: a HOT
crossing leaf (introCineWarm) landed synchronously before its group was
parented, so `_introBuildDoor`'s fit ran on `g.parent` = null and bailed —
the guard is now `rec.dead` (set by `_introDropDoors`). doorhq.test.js
source-scans the signatures.
NO DAIS (2026-10-18, mondo): the round platform `_introBuildDoor` stood under every crossing door (menu + match
intro) is removed; the frame and sill stand straight on the floor below (menu sand/ice, the apron, the room's ground;
on a void board with no floor the door now hangs in the void like the far roster's lone doors).

## THE TERMINAL (the match-select screen is a console's CRT) — added 2026-09-08
Match-select is DIEGETIC: match-select.js renders a full-frame CRT monitor
(`.ms-crt` bezel → glass → screen, scanlines, the phosphor's warm black;
CSS in styles-base.css "THE TERMINAL" block, `.ms-tty-*` = the terminal
typography) in two homes and two VARIANTS. Homes: `#hqTerminal` inside
`#hqPage` (map.js `_hqOpenTerminal(spec)` — the building waits underneath,
paused via `_hqSuspend`; three-renderer.js `hq.focusScreen({ counterId })`
pushes the camera onto the desk's `crt_terminal` prop (found by catalogue
key in `_hq.props`, +Z-front, `hq.unfocus(ms)` pulls it back; the avatar
hides under the push) and the overlay powers on 430 ms in (`.on` =
`msCrtOn`, `crtOn` SFX); `#modePage` = the classic route (`?nohq`,
VS CPU from the play hub) — the same monitor on black, `frame: 'page'`.
Variants (`_mountReactMatchSelect({ host, variant, frame, pre })`): **SITE**
(`pre.locked`) = the site is the room you stand in — site file, then BOARD
(Δ 8×8 ↔ the full site, `pickBoard`), GAME MODE (Clash excluded — it is
pinned to its own stage; Gauntlet on full boards only), TEAM, ROUNDS, CPU
TEMPO, FILE THE CROSSING; **FULL** = MODE · every SITE (cards, filters,
optional `pre.presets` chips) · CONFIG. Who opens what (map.js
`_hqInteractTarget` → `_hqConsoleTerminal`): a walkable site's CROSSING
console → SITE for `room.site` (sealed / gated sites keep their panel);
the Training Room's RANGE console → FULL with ORIENTATION / PRACTICE
presets (`_hqRangeTerminal`; the facility boards have NO Δ cut — launchId
is the site); DISPATCH's panel → "THE DESK'S SCREEN" (`data-terminal`,
`_hqDeskTerminal`) → FULL, bare pre; a bay threshold's CROSS / DEEP /
RESPOND (`_hqLaunchMission`) → SITE over the paused ring, no push. The
launch contract is unchanged: `_msSelected*` mirrored during render,
`window._hqPreselect` (+ `locked`, `presets`) read by `_msConfirm`, the
CPU pool pinned only while the filed map is the pre-selected site. FILE →
`_msConfirm` → `_hqTerminalClose({ launch: true })` drops the overlay and
`_hqLeave`s (the match owns the canvas next; the return spot is the
console — `doorId` → `_hqLastDoor`). STEP AWAY / ESC → `_hqTerminalClose()`
→ power-down (`.off`, `vhsEject`), `unfocus(560)`, `_hqResume`. `_msBack`
/ `_msConfirm` / the walker's `onEscape` check `_hqTerm` first; `_hqLeave`
and `_hqEnter` drop a screen left up. **THE DEAD-CURSOR FIX that came with
it**: `requestPointerLock` is async — closing a panel un-paused the walk,
which re-requested the lock, and the grab landed AFTER `_hqLeave` on the
match-select page. Now `_hqUnbindInput` exits the lock unconditionally and
stamps `_hqLockStaleAt`; a document `pointerlockchange` listener
(`_hqOnLockChange`) releases any lock that lands while the walk is PAUSED
or within 2.5 s of a leave; panels on the way to a launch close with
`_hqClosePanel({ keepPaused: true })`. `npm test` (doorhq.test.js "the
terminal") source-scans all of it. Fallback: no host / no React → the old
panel + the page.

## THE FORGE TERMINAL (party builder redesign) — Stage 1 SHIPPED 2026-09-09
`PARTY_BUILDER_PLAN.md` is the staged plan for rebuilding party-builder.js
around the seven reference images in `party_builder_references/` (view
them with the Read tool): ONE CRT monitor (the match-select `.ms-crt`
chrome), four tabs (ROSTER = the champ-select wall · TECHNIQUES = the
three-pillar circuit + the technique panel · GEAR · DOSSIER), the party as a
ROW of circular portraits along the bottom, stats as pills, passives as
sticky notes ON THE BEZEL, and the hero playing its real cast animation +
VFX on the stage when a spell is hovered / equipped. Read the plan's §2
(anatomy: mount points, `EWCharViewer`, the cast chain, the VFX binding —
`ThreeVFX.init` is single-scene and online.js RELAYS `VFX3D.fire`, so a
preview must route around it), §3 (the rounding rule and the other design
rules), §5 (the six stages, in order), §6 (decisions the user still owns)
before touching the builder; append to its §9 build log every session.
**Stage 1 shipped (2026-09-09)**: party-builder.js renders the monitor —
root `.ms-crt.ms-crt-page.ms-crt-forge.pb-tarot` → bezel → glass →
`.ms-tty.pb-tty` (head · `.pb-tabbar` · `.pb-body[data-tab]` · `.pb-party`
· `.pb-foot`); `PB_TABS` (`window.PB_TABS`, `window._pbSetTab(id)`), React
state `pbTab`, ROSTER first, `pickRace` flips to TECHNIQUES; Q / E, [ / ],
1–4, ← →, ESC (closes a window, else BACK). The STAGE (`.pb-stage`, one
keyed element) never remounts across tabs — `EWCharViewer` is a singleton.
Windows (`PbWindow`, module-level — a per-render component remounts on
every keystroke) replace the modals; the standalone locker is `.pb-locker`.
CSS = styles-base.css "THE FORGE TERMINAL" block (`#builderOverlay` is
positioned there because the CRT root is absolute). `npm test` runs
`party-builder.test.js` (source scans: tabs, root, row, one stage, the
lock-flow names, the mechanic names). Every mechanic kept its function name
(plan rule 3.5) — re-skin, never re-implement.
**Stage 2 shipped (2026-09-09)**: TECHNIQUES is THE CIRCUIT —
`SpellTreePanel` (same name, same `TREE_NODE_POS`, same rules) draws
round-capped `<path>` connectors, 50 px chips (capstones 58 px in a
`.pb-node-crown` ring), pillar-head PILLS in their own strip
(`.pb-circuit` = heads · board · pips), a gold halo on `techSel`; the
TECHNIQUE PANEL (`TechniquePanel`, `.pb-technique`, fed by
`pbTechInfo`) follows `techHover || techSel` and its verb (`techVerb`)
does what the chip click does. Keys on TECHNIQUES: arrows walk the
circuit (`treeStepKey`; SHIFT+← → = the party row), ENTER = verb,
BACKSPACE = unequip, SPACE = replay. THE MOVE PREVIEW: three-renderer.js
`_castChainFor(kind)` / `_attackChainFor(kind)` are the ONE chain table
(the board's cast + attack sites call them — never inline a chain
again); `EWCharViewer` keeps the whole library bake and exposes
`play(slotOrChain, { full, name })`, `playSpell(spell, { attack, full })`
(`classifySpellAnimKind` → the chain; a basic attack → the def's
`basicAttackKind`), `stopPreview`, `isPlaying`, `hasClips`, `onState(fn)`.
The builder's `pbPreview(sp, { hover })` fires it (hover / keyboard =
180 ms debounce, idle only; click / equip = immediately) and the stage
wears `.pb-stage-pill` (`MOVE PREVIEW · name`, `NO PREVIEW · SPRITE
VESSEL`, `PREVIEW OFF`). Kill-switches: `state.animationsDisabled`,
`window.EW_NO_PB_PREVIEW`. The party row is sized by
`.pb-party { --pb-portrait }` (96 / 76 / 64 px by breakpoint).
**Stage 3 shipped (2026-09-09)**: the spell LIGHTS UP the stage — a click /
equip / ENTER / ▶ on a technique runs `EWCharViewer.previewSpell` (hover
stays animation-only, C-10): the viewer borrows the battle's VFX layer
through `ThreeVFX.attach(v.vfxGroup)` (the pools re-parented; a stage
opened before the first match initialises them and the board's
`init(scene)` ADOPTS them; `detach()` clears and sends them home) and
`VFX3D.stage.enter/exit/fire` (three-vfx-effects.js `_VS`: the stage cfg,
flat ground, `_suppressed` ignores the phase, `_post` → a shim,
`_shake` / `_LT()` / `_geom3D` route every board shake / lightning /
geometry read — **never add a bare `window.shakeBoard(` /
`ThreeLightning.` / `_spell3DGeometry[` to that file again**;
`stage.fire` is the INTERNAL fire, never the online-wrapped one). The beat:
turn to +X, windup, the clip, burst + the mapped intents at 45 % ((2,0) =
two tiles to screen-right, aura at the hero), finish. The monitor reacts
through `onStageFx` → `data-grade` (the type's ENTROPY STRIKE colour),
`.pb-crt-roll-on`, `.pb-crt-jolt`. Kill-switches: `EW_NO_PB_VFX` (Stage
2's animation-only preview), `EW_PB_VFX_NO_GEOM`, `EW_NO_PB_PREVIEW`.
**Stage 4 shipped (2026-09-09, rev 5)**: ROSTER is THE WALL — `.pb-rtile`
tiles (portrait full-bleed else the sprite, faction ring, type dots, ★, 🔒),
round filters (`.pb-type-disc` ×6 `PB_TYPE_GLYPH`, `.pb-faction-ring` ×3,
search pill, SORT / JOB pills → `PbWindow` menus — no native `<select>` on
the wall), hover → the stage shows that vessel (`rosterHoverIn`, 220 ms;
`stageRace` etc. feed `HeroViewer3D`). Same rev: the row's OVAL portraits
fixed (the legacy `.pb-party-slot` height clamp at styles-base.css ~3467 is
overridden in the forge block — never delete that override), the VFX plays
on HOVER too (C-10 overruled by the user), and THE MOVE + THE FRAME
(three-renderer.js `_cvMovePlan` / `_cvMoveTo` / `v.frameTo`): a charge
RUNS to the tile beside its dummy at (3,0) and strikes on arrival, a dash
slides its line, a teleport blinks, a melee swing lunges, and `_cvFrame`
pulls the camera out to hold the whole beat (`VFX3D.stage.caster(x, y)`
moves the effects' caster anchor with the hero). Two instance bugs fixed:
`PartyBuilder(props)` reads `props.standalone` (the module flag was shared
by the sleeping pre-match instance) and the key handler acts only for the
instance on screen; match-select.js's ENTER / ESC listener returns while
its host is off screen. Screenshot the forge with `NODE_USE_ENV_PROXY=1
node playtest_builder.js [tag]` (repo tooling; standalone route; GLBs do
not load in the sandbox — DOM / CSS only).
**Stage 5 shipped (2026-09-09, rev 6)**: THE STICKY NOTES — `pbUnitNotes`
builds a pseudo-unit and reads data.js `getUnitPassives` (so `flying`
resolves through map.js `canFly`, jetpack included; never the race table),
the non-passive `RACE_TRAITS` rows become one TERRAIN note, `PbNotes`
renders them ON THE BEZEL in a widened right margin (`--pb-notes-w`,
132 px; closes under 1180 px → the same text inline as `.pb-traits-inline`),
paper per faction, `Caveat` handwriting (index.html Google-Fonts link),
`PASSIVE_DEFS[id].note` = user marginalia (C-7), a click opens THE NOTES
window. STAT PILLS: `StatBar` / `VitalBar` keep their names (+ `statKey`),
`PB_STAT_LOOK` is paint only, `.pb-grade-ring` is the grade, the MOVE /
RANGE diamonds sit in `.pb-foot-badge`. AFFINITIES: `pbAffinities` reads
`TYPE_CHART` **strongVs / weakVs** exactly like state.js
`getTypeDamageMultiplier` (WEAK ×1.30 red ring · RESIST ×0.75 green ring;
the `resists` field is documentation). GEAR: `.pb-sub-pill`, the ZODIAC
wheel (`.pb-zodiac-chip` ×12 → `handleZodiacChange`; `PB_ZODIAC_ELEMENT`
mirrors battle.js Star Crossed's `_zElementOf` — the test diffs them; there
is NO `ZODIAC_NATURES` table, the wheel states the engine's +10 % move &
armor rule). No native `<select>` survives in party-builder.js (C-9 —
tested). Next: Stage 6 (the desk in the building, sounds, `EW_NO_PB_CRT`).
**THE RELAYOUT (2026-09-09, rev 7)**: the glass IS the screen — the
notes are ON THE GLASS (`PbNotes` inside `.pb-stage-view`, top-right of
the hero's band; no bezel margin), the STAGE spans the whole body on
TECHNIQUES / GEAR / DOSSIER (`grid-column: 1 / -1`) with the circuit and
the stats floating TRANSPARENT over it (scrims via `::before`); the hero
stands in the free band: `PB_STAGE_CX` (0.575 = `--pb-tech-w` 36% +
half the rest, party-builder.test.js ties them) → `HeroViewer3D
{ focus }` → `EWCharViewer.setFocus(cx)` (three-renderer.js `v.focusX`,
`_cvFrame` slides camera + look; a wide beat frame eases it home). The
future ground + sky belong in the viewer (it already fills the body).
The circuit is THREE LANES (`.pb-lanes` → `.pb-lane` → `.pb-tn` node
rows: disc + name + `pbNodeMeta` line; CSS `.pb-link` segments onto a
`.pb-bus` with the root hub) — `SpellTreePanel`, `TREE_NODE_POS`,
`treeStepKey` and every legality rule unchanged. ONE head row (tabs
inside `.pb-head`) and ONE bottom bar (`.pb-party-left` BACK + summary ·
portraits · `.pb-party-right.pb-foot` tools + CONFIRM + the lock ladder
verbatim). Cut: the officer chip, the prompt line, the ◂ ▸ caps, the
counter, the stage title, the hover-hint sub-head, the tab hint.
`node playtest_builder.js [tag]` honours `PW_W` / `PW_H`.
**rev 8 (same day)**: the body grid has TWO rows — the sheet, then the
bottom bar; on TECHNIQUES `data-panel="1"` puts `TechniquePanel` in its
own `.pb-zone-panel` cell under the lanes, beside the party bar (which is
a body cell, `grid-area: party`; the stage spans both rows). Portraits
84 px, closer; the bar's summary is gone (identity = STATS column).

## THE SPELL TREE UX PASS — the fork, the cascade, 7 slots (2026-09-13, local delivery)
`SPELL_SLOT_MAX` is **7** (data.js; was 6 — one capstone per unit still
holds, 4 + 4 > 7). On the forge's TECHNIQUES circuit (party-builder.js
`SpellTreePanel`): a TWIN node is **THE FORK** — both alternates stand on
the tier as `.pb-tn-opt` option discs (the chain through the left one, an
⇄ bridge to the right), each with its own state from `treeAltState(tree,
sealed, equipped, key, altId)` (`equipped` / **`swap`** = the node wears
the other option, one click trades in place / reachable / far / blocked /
sealed), its own hover + select (`techHoverAlt` / `techSelAlt`;
`pbTechInfo(…, altId)` → `alt` / `otherAlt` / `drop` / `dropCount`) and
its own click (`treeAltClick` → `twinPickSpell(twinKey, spellId)`). The
twin picker window is gone (the Freelancer socket window stays). A fork's
wrapper wears `st-<state>`, never `is-<state>`. **THE CASCADE**: an
unequip always lands — `treeDropIds(tree, equipped, id)` (data.js
`treeReachableKeys` without the id) = the node + everything that hung off
it, dropped together (`treeLegalSubset` is the safety net); hovering an
equipped node paints `.will-drop` + `.pb-link.cut` and the pips forecast
`−N`; hovering a reachable node lights the gold path and the pips forecast
`+N` (`.pend` / `.over`). Every refused click explains itself through
`flashTreeNote` → `.pb-tree-note` (1.6 s). TAB on a selected fork = the
other option. `npm test` runs `spell-tree-ux.test.js`. PARTY_BUILDER_PLAN
§9 has the entry.

## RING VITALS + NAMEPLATE STYLES (Video settings) — added 2026-09-11
An alternative to the HP/MP bars on the nameplate: the two meters are drawn
ON the team reticle at the unit's feet. three-renderer.js `_plateLook`
(`rings`, `style`; localStorage `ew_ringVitals` / `ew_plateStyle`; API
`ThreeRenderer.setRingVitals / isRingVitalsOn / setPlateStyle /
getPlateStyle`, applied LIVE — no rebuild). The reticle shader
(`_reticleFragmentShader`) has a `uMeters` branch: HP is the outer meter on
the ring's own radius (0.42), MP the inner one (0.335), both filled
CLOCKWISE FROM THE SCREEN'S 12 O'CLOCK over a dark track — `uMeterRot` =
camera azimuth + π − facing yaw, fed per frame by `_updateRingVitals` from
`_updateUnitFacing` (bat swarms included); fills ease toward the unit's live
hp/mp/shield (`_seedRingVitals` at build so a rebuild never re-drains).
Colours: ally HP green / enemy HP red / MP blue (`RING_HP_ALLY_COLOR`,
`RING_HP_ENEMY_COLOR`, `RING_MP_COLOR` = the bar gradients); the facing
chevron keeps the team colour, the gap + ticks + accent arc are off in
meter mode. `_updateDmgPreviewPlates` also drives `uPrev` / `uPrevHeal`
(the confirm-step forecast blinks on the ring). Unit entries expose
`entry.reticle` (`_reticleOfUnit(uid)`). Plate STYLES: `'bars'` (classic),
`'compact'` (`.tp-compact`, no bars, type chips in a row), `'side'`
(`.tp-side`: a white leader line `.tp-side-line` + the name beside the
ring at foot level, HP/MP numbers under it — the CSS2D anchor drops to
`po._footY`, `_writePlateTransform` pushes it right by
`SIDE_PLATE_OFFSET_TILES` × the projected tile width; the far-zoom card
always wins and returns to the head anchor). Real AND decoy plates wear the
style (`_plateStyleClass`, `_anchorPlateForStyle`, `_applyPlateStyleLive`).
Settings: map.js `window._buildVitalsLookHTML(refreshJs)` (Vitals: Bars on
plate / Rings at feet · Nameplate: Classic / No bars / Side line) rendered
in the pause menu (ui.js, under Nametags) and the main-menu Settings
Display group. Viewer-local cosmetics — nothing relayed (both online seats
read their own synced hp/mp). `npm test` runs `ring-vitals.test.js`.

## THE ROUNDED HUD + THE PARTY DOCK — added 2026-09-12
**THE ROUNDING PASS** (hud.js `_injectHudHideStyles`, the block "THE
ROUNDING PASS" at the END of the injected stylesheet): nothing on the
battle HUD keeps a hard 90° corner any more — plates wear soft radii + a
bevelled rim, command rows are asymmetric BLADES (`.hrlg-body` 7px left /
15px right, the left spine still carries the function colour), chips are
pills, bars are capsules, the scoreboard plate (`.ew-score-plate`) and the
match-meta pill (`.ew-meta-plate`) are classes now (their inline
background/border stay in the JS), `ClipPanel` is a rounded plate
(`corner` = the radius), `UnitSprite` frames / turn chips / FrameCorners
round inline. The overrides live AFTER the rules they soften — restyle
there, never by re-editing the original blocks. The HP bar on the identity
column can NOT clip (the heartbeat trace escapes it) — the fill wears the
capsule itself. **THE PARTY DOCK** (hud.js `PartyRoster` → `PartyPortrait`,
CSS `.ew-party-*` / `.ew-pp*`): a bottom-right row of circular portraits
for the VIEWER's party (home seat via `unitHomePlayer` — a possessed body
stays in its owner's row, chained), each wearing HP (outer) and MP (inner)
as ring meters drawn in SVG (`_ppArc`: `pathLength=100` circles,
dasharray = the fill, rotation = where it starts; both transition on the
same curve so the arc's end stays pinned at 12). **The rings DEPLETE
CLOCKWISE**: the fill ends at the screen's 12 o'clock and the spent track
sweeps clockwise from it, like a cooldown — and the 3D reticle ring
vitals (`_reticleFragmentShader`, `frac = fract((ang − uMeterRot)/2π)`)
were flipped the same day to match (ring-vitals.test.js pins it). Shield
leads the HP fill in pale blue; `getPendingDamagePreview` blinks the
forecast slice; RenderBus `unit:damaged` blinks the face; the acting unit
wears a turning halo (`.active`), spent units dim, the fallen go grey
under a skull; click = `selectUnit`. Gauntlet reserves ride a pill strip
above the row; the dock is OFF on Mystery Dungeon floors (the SCANNER
owns that corner). Sits above the bottom-centre description bar at the
same lift as the Horologe rig, scales with `--ew-ui-scale`. Viewer-local,
nothing relayed (RULE #2).
**THE COLOUR PASS (same day, after the rounding pass in the injected
sheet)**: the violet-black chrome is gone — every Horologe plate (identity
column, header blade, mode strip, tool rows, item slots, command rows),
the scoreboard plate and the match-meta pill wear CLASSIC FF BLUE under a
bone-white double frame. The material is two tokens on `.hrlg-rig` /
`.ew-scoreboard` / `.ew-meta-plate` (`--ew-plate-bg`, `--ew-plate-edge`;
rows `--ew-row-bg` / `--ew-row-sel-bg`) — black or "none" is a one-line
swap there. The scoreboard's inline `EW.panel` background is beaten with
`!important` in that block on purpose. Every blade carries `data-bid`
(its id) so the ROOT VERBS wear their own colour (MOVE teal · ATTACK red ·
ABILITIES blue · COMBO violet · ITEMS green · GUARD amber · SWITCH orange
· END / CANCEL red via `.danger`); spell rows keep `catVars`. The
SELECTED row (cursor / hover / the armed verb in a dimmed parent) turns
GOLD (`--ew-sel`): text, glyph and frame, the blue fill lifts. Restyle in
that block, never upstream.
**HUD THEMES (same day)**: the material is a TOKEN SET on `:root`
(`--ew-plate-bg/-edge/-seam/-rim/-lip/-scan`, `--ew-head-bg/-ink`,
`--ew-row-bg/-sel-bg/-edge/-lip`, `--ew-ink/-mute/-dim`, `--ew-hair`,
`--ew-dead-*`, `--ew-sel/-soft/-faint`, `--ew-tshadow`, `--ew-drop`) and
a THEME is one `:root[data-hud-theme="<id>"]` block overriding it. hud.js
`HUD_THEMES` (crystal = Classic Blue, the default and the bare `:root`
block · void = the old violet-black · onyx · leather · parchment (light,
umber ink, dark-gold select) · glass); `window.getHudTheme /
setHudTheme / applyHudTheme` (localStorage `ew_hud_theme`, applied at
script load as `data-hud-theme` on `<html>`, live — no rebuild). The
scoreboard / meta pill write their inline ink through `EW_T` (`var(--ew-
ink…)`) so a light theme darkens it; `EW.time/space/chaos` stay literal.
Picker: map.js `_buildHudThemeHTML(refreshJs)` under the Vitals row in
BOTH the pause menu (ui.js) and the main-menu Settings Display group.
Adding a theme = one `HUD_THEMES` row + one token block;
`hud-theme.test.js` ties catalogue ↔ blocks ↔ picker ↔ scoreboard ink.

## THE VIEW SIZE THE BATTLE OWNS (nameplates / Cube bar / nexus bars offset) — 2026-09-14, local delivery
The shared renderer is sized by THREE owners: the battle (`renderFrame`'s
resize block → `renderer` + `ThreeCamera.resize` + `ThreePost.resize` +
`css2dRenderer.setSize`), the main-menu scene (`_menuEnter` → the canvas to
`#menuStage`) and the HQ (`_hqEnter` / `_hqFrame` → `.hq-stage`). The
battle's block used to key on the CANVAS BUFFER alone, so when a host had
already sized the canvas to `.map-center`'s exact pixels (the menu scene
on a full-window layout) the battle never re-applied its size: the camera
kept init's 960×540 aspect and the CSS2D renderer kept init's 960×540
half-sizes — every nameplate, Cube bar and nexus bar landed at 0.6× toward
the top-left (Play → VS CPU; a site room's BATTLE marker was fine because
`_hqEnter` had sized the CSS2D layer to the full window). Now three-
renderer.js keeps **`_viewW / _viewH`** = the size the BATTLE last applied,
the block re-applies when `.map-center` differs from THAT (or the buffer
drifted — `Math.floor(w × pr)`, what setSize writes, so a fractional
product no longer resizes every frame), and `activate()` resets it so the
first battle frame always re-applies. init sets the overlay's `cssText`
BEFORE `setSize` (the assignment wiped the px size). RULE: anything that
sizes the shared renderer for another host never touches the battle's
record — the battle re-derives it on activate. Measured headlessly with a
scratch probe (CSS2D transform ≡ the plate's projected position on both
launch paths at 1600×1000); the look live is unseen (RULE #1c).

## THE HQ PAUSE MENU + THE LAST ROSTER + THE LANDING — 2026-09-15, local delivery
**ESC / P in the building = THE PAUSE MENU** (map.js `_hqOpenPause` /
`_hqClosePause` / `_hqTogglePause`; `_hqOpenSettings` is an alias now): an
OVERLAY inside `#hqPage` (`#hqPause`, index.html; CSS "THE PAUSE MENU" in
styles-base.css, z 35 — over the strip / panel / terminal, under the load
card), never a title-page swap. The old ESC pushed the whole Settings PAGE
over the HQ page (`_showTitlePage('settingsPage')`) and the walker's page
faded out under it with the cursor still spoken for — "escape pauses but
something has my mouse". Now `_hqSuspend()` pauses the walk in place
(`hq.setPaused(true)` releases the pointer lock; `exitPointerLock` again
for a late one) and a JRPG command column stands over it: **RESUME · PARTY ·
OFFICER · SETTINGS · DIRECTORY · EXIT** (`_HQ_PAUSE_CMDS`; ↑↓ ENTER, ←→
cycle members, BACKSPACE back, ESC / P resume — `_hqPauseKey` on document;
the walker's own ESC / P handler routes through `onEscape`, which closes
the menu first). **PARTY = THE LAST ROSTER**: state.js `recordLastParty()`
(`window._ewRecordLastParty`, localStorage `ew_last_party_v1`, the HUMAN
seat: the online seat, else the LOCAL controller, else P1) is called by
battle.js `startMatch` for a standard match only (never campaign / MD /
spell lab / tutorial) and files `{ seat, mode, members: [{ cls, name, meta:
{ race, gender, secondaryJob, customSpells, zodiac, appearance }, loadout:
{ spells, items, equipment } }] }`; `loadLastParty()` (`_ewLoadLastParty`)
reads it. The menu builds each member with the REAL `createUnit` (level,
sec job, tree-legal spells, gear bonuses — cached per open in
`_hqPause.units`) for the cards and the sheet (`_hqPausePartyHtml` /
`_hqPauseMemberHtml`: portrait or R2 sprite, race label, job, Lv, HP / MP
/ ATK / DEF / INT / MDEF / SPD / AWR bars, MOVE / RANGE / INSPECT, type
chips, ABILITIES with `type` category · MP · AP · RNG · PWR · desc,
PASSIVES via `getUnitPassives`, GEAR via `EQUIP_DEFS`, ITEMS via
`ITEM_RULES`); a build that throws falls back to the record's bare ids.
**OFFICER** = the file (`hqIntakeCard` / `hqMedicalRecord` / `hqPunchClock`
/ `hqKeys` / `hqMasteryCount` / `hqDailyOps` / `hqAvatarLabel` /
`hqMottoBarometer` / `getEloRankInfo`) + buttons into the ID card, the
trophies, the board (`_hqPauseFn` → `_hqDoAction({ fn })`; the modals
resume the building, a page comes home through `_hqReturnOrMenu`).
**SETTINGS** renders the main menu's settings body INTO the overlay:
`_renderMainMenuSettings` writes to `window._hqPauseSettingsBody ||
#mmSettingsBody`, and `_openMainMenuSettings` (the buttons' rerender hook)
re-renders in place while the menu is on SETTINGS. **DIRECTORY** drops the
menu and opens the directory panel over the paused walk. `_hqResume`,
`_hqLeave` and `_hqEnter` all `_hqPauseDrop()` — a screen opened from the
menu never comes back under a stale overlay. **THE LANDING** (three-
renderer.js): `_hqGoTo` stands the walker 2.4 m in from a flat wall (was
1.6) / 2.6 m from a curved one, and **`_hqCamInDoorway`** makes every door
a camera blocker — a slab 1.5 m deep on the room side of the wall plane,
the opening + the leaf's swing wide, door height — read first by
`_hqCamBlocked`; the boom used to stop at the wall plane INSIDE the
doorway behind the open leaf, so the door you came through filled the
screen until you stepped forward. Viewer-local, nothing on `state`,
nothing relayed (RULE #2). `npm test` runs `hq-pause.test.js` (the
recorder and the doorway blocker in vm sandboxes + source guards).
UNSEEN LIVE (RULE #1c): the menu's look over the building, the settings
body's width in the sheet, the portraits' crop, the landing on a wide
(revolving / hangar) door.

## THE SOCKET PICKER'S TABS + FILTERS (the Freelancer pool window) — 2026-09-14, local delivery
The ＋ RACE SOCKET / ＋ JOB SOCKET window (party-builder.js, the node
picker after the RACE ABILITIES strip) wears five category TABS (ALL ·
DAMAGE · UTILITY · BUFF · DEBUFF · HEAL — `PB_SOCKET_TABS`, coloured by
`PB_CAT` through `--pb-fc`, each with a count judged inside the other
filters) and a FILTER ROW: DMG PHYS / MAGIC (`pbSpellDmgKind` — the
`ew-dmgicon` rule, damage-dealers only, `damageType`), the six TYPE discs
(`sp.spellType`, greyed when the pool has none), SHAPE single / multi /
aoe / line / self (`pbSpellShape` — ONE shape per row derived from the
kind + `lineWidth` / `pbAoeLabel` / `hitDamages` / `range 0`;
`_PB_SELF_KINDS` mirrors battle.js SPELL_KIND_META `selfCast`), the
socket's TIERS (only when it spans more than one, `pbTreeTierOf` = the
tree ring) and a search (name / desc / school). State `flSocketFilt`
(`PB_SOCKET_FILTER_EMPTY`; reset whenever `flSocketPick` changes), the
match is `pbSocketFilterMatch(sp, f)`; the sub-line reads shown / pool.
CSS: styles-base.css `.pb-socket-tabs` / `.pb-socket-filters` /
`.pb-socket-empty` right after `.pb-window-body`. Viewer-local UI,
nothing on `state` (RULE #2). party-builder.test.js evaluates the
classifiers on the real race + job pools. Unseen live (RULE #1c): the
sticky tab strip over a long scroll, the row wrapping at narrow widths.

## THE LOBBY THEME + THE TITLE THEME'S LIMITS + concrete_floor rev (2026-09-15, local delivery)
audio.js `doorLobby` = R2 `music/door_lobby.mp3` (the user's HQ track, MASTER
B4; `_R2_MUSIC` / `_LOCAL_MUSIC` / `AUDIO_BASE_VOLUMES`, pause-menu name in
ui.js `_TRACK_DISPLAY_NAMES`). map.js `syncMusicToState`: in the building
(`GS.HQ`) it plays `doorLobby` while `_hqCurRoom` is in
`_HQ_LOBBY_MUSIC_ROOMS` (foyer · central_egress · ring_g · ring_m — the
arrival and the main circular hall) and `mainTheme` in every other room
(`_hqEnter` re-syncs on every room entry, walks included). The `doorMuzak`
slot is retired. **ff7 (`titleTheme`) is the TITLE SCREEN's alone**: the
menu key is `titleTheme` only while `gameState === GS.TITLE`;
`enterGameFromTitle` and the campaign map play `mainTheme`.
**concrete_floor.png was repainted in place**: the sprite URL carries
`?v=20260915` (sprites.js `TERRAIN_SPRITES.concrete_floor` + the
training_floor fallback, ui.js's two dome URLs) because the sheet is
immutable-cached — bump that query on the next repaint; every loader reads
`TERRAIN_SPRITES[key][0]` verbatim, so the query is harmless.

## THE MIXER — per-song / per-cue master levels (dev tool, Settings → Audio) — 2026-09-16, local delivery
The songs and the cues were not mastered at one loudness. audio.js "THE
MIXER" block (right after `audioFadeVersion`): **`_mixLevel(channel, key,
base)`** is the ONE read at every play path — `getMusicBaseVolume` /
`getSfxBaseVolume` / `_ambienceTargetVol` / `playDoorSfx` — precedence
LOCAL dev override (localStorage `ew_audio_mix`, what the panel writes) →
**`AUDIO_MIX_SHIPPED`** (`{ music, sfx, ambience, door }`, the mix every
player gets) → the four base tables (`AUDIO_BASE_VOLUMES` ·
`SFX_BASE_VOLUMES` · `AMBIENCE_BASE_VOLUMES` · `_DOOR_SFX_GAIN`). A level
is an ABSOLUTE base (the file's share of full scale, 0–1.5, clamped to 1
at play time), never a multiplier — an exported number reads exactly like
the table entry it replaces. **`window.AudioMixer`**: `open(channel)` /
`close()` (the panel `#audioMixer`, z 100000, CSS injected by `_mixCss`;
tabs MUSIC · SFX · AMBIENCE · DOOR KIT, a filter, ▶ audition at the
current level — a song through `playMusic` (the shuffle continues from
it), a cue once, a bed for 12 s kept alive by `_desiredAmbienceKeys`
through `_mixAudition.ambience`, a door-kit recipe — a slider per key,
`tbl n` = the table's value, gold = set here, ↺ per row / per tab / all),
`get / shipped / base / isLocal / set / reset`, **`overrides()`** = every
key whose effective level differs from the TABLE (a shipped value still
wanted survives a re-export), `exportJson()` (= the override object —
**paste it over `AUDIO_MIX_SHIPPED` to ship the mix**), `exportJs()` (the
four tables rewritten with the mix folded in, for baking into the
literals), `importJson(text)`, `audition / stopAudition`. Buttons:
map.js `_renderMainMenuSettings` Audio group (so the HQ pause menu's
SETTINGS has it too) and ui.js `_buildPauseMusic`. Viewer-local, nothing
on `state`, nothing relayed (RULE #2). `npm test` runs
`audio-mixer.test.js`. The user's workflow: tune in the panel → EXPORT
JSON → hand it to Claude (or paste it over `AUDIO_MIX_SHIPPED`) → ship
audio.js. Unseen live (RULE #1c): the panel over the CRT / the pause menu,
the slider's feel, the bed audition's fade.

## THE PLAYLIST — songs wear TAGS, places ask for tags (2026-09-16, local delivery)
audio.js "THE PLAYLIST" block (right before `MUSIC_CROSSFADE_MS`). Two new
facility songs: `doorLobby2` / `doorLobby3` = R2 `music/door hq 2.mp3` /
`door hq 3.mp3` (the spaces are `%20` in `_R2_MUSIC`; display names in ui.js
`_TRACK_DISPLAY_NAMES`). **The model**: every song carries a SET of tags in
five dimensions (`MUSIC_TAG_GROUPS`: role · mood · energy · style · setting —
a song takes as many as fit); `MUSIC_TAGS_SHIPPED` is the tagging every
player gets (the role tags ARE the old wiring: ff7 = title, the main theme =
menu + battle, the door tracks = lobby + hq, the alts = battle; the mood /
style tags on the alts are Claude's guesses off the titles — retag in the
panel). A PLACE is a `MUSIC_CONTEXTS` row `{ any: [role tags], not,
fallback }` — title · menu · lobby · hq · exploration · battle · boss; a
map's MOODS (`MUSIC_SITE_MOODS[near key]`, or `env.music: [...]` on its
EW_MAP_META row) are asked for first (`MUSIC_MOOD_MIN` 2 matches or the
pool is topped up); an empty pool falls down `fallback` and ends at the
main theme. ONE read per song `MusicTags.get(key)` (LOCAL override in
localStorage `ew_music_tags` → shipped); ONE pool read
`MusicTags.pool(ctx, moods)`; per-pool SHUFFLE BAGS (`_musicDraw`: every
song once before a repeat, never the same song twice running); a pool of
ONE song loops, a pool of many advances on `ended` (the battle crossfades
9 s early as before) — no track has `loop = true` on its own any more
(`_musicApplyLoop`; the pause menu's 🔁 pins `_pinnedLoop`). Entry points:
`playContextMusic(ctx, { moods })` (keeps a playing song that still fits the
new pool — a walk from the hall into an office keeps the track),
`setMusicContext('battle')` (the match keeps the song it pre-warmed at
startMatch), **`skipTrack()` = ⏭ ANYWHERE** (the fix for "no way to change
the song" — map.js `skipBattleTrack` delegates; it was gated to battle /
editor). map.js **`musicContextForState()`** is the ONE resolver
(`syncMusicToState` calls it): battle → `battle`; HQ lobby rooms
(`_HQ_LOBBY_MUSIC_ROOMS`) → `lobby`; a WILD room (`hqRoomSite`) →
`exploration` + the site's moods (`_musicMoodsForSite`); other rooms → `hq`;
title → `title`; else `menu`. The legacy names (`battleMusicKeys` is GONE;
`refillBattleShuffleBag` / `drawFromBattleShuffleBag` / `chooseBattleTrackKey`)
are wrappers over the battle pool. **THE DEV TOOL**: the mixer panel has two
more tabs — 🏷 TAGS (a chip per tag per song, click toggles, gold = tagged
here, ▶ auditions) and ⌖ CONTEXTS (each place → its rule → the resolved pool,
▶ plays a draw; the site-mood table) — `AudioMixer.open('tags')` from
Settings → Audio → 🏷 Song Tags and the pause menu's Music tab. EXPORT JSON
carries `tags` (paste over `MUSIC_TAGS_SHIPPED`); EXPORT JS TABLES prints
the table; IMPORT takes either. **Settings → Audio wears NOW PLAYING**
(map.js `_buildNowPlayingHTML`: the song, its pool, ⏮ ⏭, a picker of every
song with the current pool first; the HQ pause menu's SETTINGS renders the
same body). Viewer-local, nothing on `state`, nothing relayed (RULE #2).
Adding a song = `_R2_MUSIC` + `_LOCAL_MUSIC` + `AUDIO_BASE_VOLUMES` + a
`MUSIC_TAGS_SHIPPED` row + a display name; adding a tag = its group's list;
adding a place = a `MUSIC_CONTEXTS` row + a branch in
`musicContextForState`. `npm test` runs `music-tags.test.js`. UNSEEN LIVE
(RULE #1c): the chips' wrap in the panel, the picker in the settings row,
the crossfade when a walk changes pools.

## THE HQ HUD PASS — the exploring HUD wears the battle HUD's themes (2026-09-16, local delivery)
The user: "a dark box with a gold or purple outline … the same issues plaguing
the battle HUD." The D.O.O.R. HQ's exploring HUD reads the BATTLE HUD's theme
TOKENS now: styles-base.css "THE HQ HUD PASS" (appended at the END of the file
so it wins the cascade — restyle THERE, never the HQ block above it) maps
`--hq-*` on `#hqPage` to `--ew-plate-bg / -edge / -seam / -rim / -lip / -scan`,
`--ew-row-*`, `--ew-ink*`, `--ew-sel*`, `--ew-drop` (Classic Blue fallbacks),
and every plate — the strip, the prompt, the toast, the trick line, the panel
card, the pause frame + its command blades, the map stage / card, the buttons
(capsules) — wears the Horologe's rounded, bevelled material; Settings →
Display → HUD Theme restyles the building with the battle. hud.js injects its
stylesheet (the tokens live in it) ONCE AT SCRIPT LOAD now
(`_injectHudHideStyles()` after its definition — idempotent, battle-scoped
rules), because the HQ renders before any battle HUD mounts. **THE STRIP**:
the room you stand in IS the title (`#hqRoomTitle`, map.js `_hqFillStrip`;
`#hqRoomName` under it = D.O.O.R. HEADQUARTERS · ROOM № · sub) — no second
box with the room's name anywhere; the CSS2D **door plates are floating
labels** (no background / border, a hairline of the function colour under
the name; the battle marker's inline border is gone); NO buttons (DIRECTORY /
EXIT are the pause menu's — ESC / P); a pill sits on the strip only while it
is LIVE: `_hqStripFlash(key, ms)` (the one write; `HQ_STRIP_FLASH_MS` 6 s) /
`_hqStripPillLive(key)` (the one read, the strip re-fills when the flash runs
out) — a found tape flashes TAPES, a placed door flashes THRESHOLD (drawn =
always shown), FORM 365 flashes on a fresh arrival and on a return from a
match that ticked a line; the SKATEBOARD pill shows only while riding. The
pause menu's OFFICER sheet carries every count. **M = THE MAP**:
three-renderer.js `_hqKeyName` knows `m` (inserted after `d` — the pinned
`e … q || p` chain is untouched), the handler routes `onHotkey('m')` BEFORE
the pause gate; map.js opens the directory, M again closes it (a pause menu /
terminal / other panel keeps the key). **A NODE CLICKED TWICE GOES**: the
first click picks the room (the card: where it is + GO), the second click on
the same node walks you there through `_hqDoAction({ room, at })` — the same
path as the card's GO; the card says CLICK THE NODE AGAIN TO GO. `npm test`
1532 / 0 / 4 skipped. UNSEEN LIVE (RULE #1c): the plate material over each
room's light, the floating plates' legibility against bright walls, the strip
at narrow widths, the pill fade, the parchment theme's light ink in the
building.

## THE BUGFIX PASS (2026-09-25, token 20260925-bugfix-01-cors)
- **The debrief never half-builds.** mondo: the victory/defeat screen sometimes came up with only the title and the
  MVP tag (no XP, no achievements, no buttons: a soft lock). battle.js `showResultOverlay` is now a wrapper around
  `_showResultOverlayBody`: every card (lineup, MVP, fact line, field report, performance, honours, rewards +
  achievements, command bar, hazard pay, tabs) sits in its own try and logs `[Debrief] <card> failed` on a throw;
  whatever happened, the wrapper shows the overlay, puts the encounter's BACK TO THE ROOM / WAKE UP (else the
  standard bar) into an empty `#vicBottom`, and syncs the tabs. A second fill of a screen already showing for the
  same match (`_vicShownKey`) is dropped. If the screen still comes up thin, the `[Debrief]` console line names the
  card that threw. Test: debrief-safety.test.js.
- **The pause menu on room entry.** three-renderer.js `_hqOnLockChange` reads a pointer-lock loss as the ESC the
  browser ate. The swap window (`_hqRebuildAt`) was stamped only on room-to-room builds and only when the build
  started, so a slow room, the return from a fight or the menu, or the load card / arrival card outlasting 2.5 s
  opened the pause menu. Now every `_hqEnter` stamps it, `H.ready` and `hq.hold()` restamp it, the window is 4 s,
  a room that is not ready is never paused by a lost lock, and a hidden tab / unfocused window never counts.
  ESC and P still open the menu as before. Test: hwing.test.js.

## THE SPELL LIBRARY v2 — THE SHELL (2026-09-26, token 20260926-spell-library-02-cors)
Settings → Developer → SPELL LIBRARY is a new screen (ui.js "SPELL LIBRARY v2 — THE SHELL", styles-hud.css
`.slb2-*`; SPELL_LIBRARY_PLAN.md §5 is the spec, §11 the log). Layout: top bar (tabs SPELLS · PASSIVES ·
FAMILIES · UPGRADES · POOLS · REPORT, search ⌘F, edit count, EDITS ON/OFF, undo/redo, EXPORT, IMPORT, LAB, ⋯),
then rail (filters with counts) · centre (chips bar + virtualised table or cards) · inspector (420 px). Under
1100 px the shell is `.narrow`: the rail is a drawer (☰), the inspector a sheet. The table renders only the
visible 32 px rows (`_slb2RenderWindow` on scroll, rAF-coalesced); columns carry a priority and hide by the
CENTRE's width, not the viewport's (`_slb2VisibleCols`), and what remains scrolls sideways (`--slb2-minw`).
Every edit goes through `window._slbSetField(id, field, raw, ftype)` → `_slb2WriteField` (added rows edit
whole, shipped rows a sparse patch in `EWSpellMods.doc.modified`) → `_slb2AfterEdit` patches ONE row + ONE
field in place; the whole doc is snapshotted on the 50-deep undo stack first. The Spell Lab and its timeline
(the `.slb-lab` / `.slb-tl` block) are unchanged and dock on the same names as before. Keys: ⌘K palette,
⌘F search, ⌘S export, ⌘L lab, ⌘Z / ⌘⇧Z, ⌘A select all, ↑ ↓ walk rows, Enter opens the inspector sheet when
narrow, Esc closes menus / the sheet / the drawer. Probe: `node playtest_library.js` (server on :3000) →
shots/library/. Test: `node --test spell-library-ui.test.js`.

## THE SPELL LIBRARY v2 — THE GRID + THE LOOK (2026-09-26, Phase 2, token 20260926-spell-library-03-cors)
The TARGET tab's FOOTPRINT group is now a 7×7 click grid (ui.js "THE GRID", `_slb2GridHtml` / `_slb2WriteMask` /
`_slb2GridDown` → `_slb2GridUp`; styles `.slb2-grid*`): the centre = the target tile (the caster for
`aoeOriginSelf`, the victim for a splash rider), click paints, drag paints, right-click erases, the centre is
locked ON; PRESET buttons stamp `AOE_PRESETS` (· 3×3 5×5 ◇1 ◇2 X1 X2 +1 +2 ○1 ○2 |3 |5 □), ↔ ↕ mirror, ⟳ rotate,
▦ fill, ✕ CLEAR drops the mask (and puts the radius / shape fields back to the shipped row), ORIGIN target / self
writes `aoeOriginSelf`. A row without a mask shows its computed footprint (radius / shape fields) and the first
click converts it. Writing the mask is ONE undo step that also sets the kind's radius field (`crossRadius` for
cross kinds, `blastRadius` for bombs, else `aoeRadius`) to the mask's reach — the engine's forty "is this an area?"
gates test that field — and clears `aoeShape` / `diamond` / `diagonal`; the lint `maskVsRadius` only fires when the
two disagree. A single-target kind (damage, heal…) gets an amber note: its mask only lights tiles; area damage on
it is the SPLASH rider (Phase 3). The `aoeMask` field row is a readout ("x2 · 9 tiles · reach 2"), never a textarea.
The LOOK tab (ui.js "THE LOOK", `_slb2LookExtraHtml`; styles `.slb2-stage*` / `.slb2-anim*`) mounts EWCharViewer
on a race picker (the row's owner race, else the last race used, else the fortune teller; 300 px, idle-looping;
`ew-cv-fail` when the model is off) with ▶ FULL · 🔁 LOOP · ■ · ✦ VFX (`previewSpell`, the real staging), the
current pick in words ("AUTO hurl → cast · Spell_Simple_Shoot · UAL1 · 1.0 s · strike 0.10 s"), the strike lead
(`animStrikeMs`, blank = the slot's strikeAt), a search box and the list: AUTO (`classifySpellAnimKind(d, {noPick})`),
CAST VERBS (`SPELL_ANIM_KINDS` with `ThreeRenderer.castChainFor(kind)[0]` resolved through `EWCharViewer.slotInfo`),
SLOTS (the 75 `UAL_SLOTS` rows: clip · library · played length · strike · TRAVEL tag), RAW CLIPS (the 69 unwired
clips from `EWCharViewer.libClips` — "bakes at load / on first play"). Hovering plays the option once on the stage
(`play(chain)` / `playClip(name, lib)`); clicking writes ONE of `animVerb` / `animSlot` / `animClip` and clears the
other two (one undo step). TRAVEL is the Lab's `_animOverride.travel` select moved here; archetype · weight ·
projectile stay the generic LOOK fields. The stage unmounts on every inspector re-render, on ▶ LAB and on BACK
(ui.js wraps `_spellLibraryBack`). Probe: `node playtest_library.js` now serves the five library GLBs from the repo
so RAW CLIPS fills (the race model itself is R2-only: the stage shows `ew-cv-fail` in the sandbox). Tests:
`aoe-mask.test.js` (presets, clipping, the four readers' parity on every shipped aoe / cross row + every preset,
the shaped fields on the card, the lint + the mana formula, `_aoeBound`) and `spell-anim-pick.test.js` (the pick's
precedence, the slot: kind string, every verb's chain, `registerSpellAnimClips`, the census pin).

## THE SPELL LIBRARY v2 — THE TARGETING (2026-09-26, Phase 3, token 20260926-spell-library-04-cors)
The TARGET tab's RIDERS group always shows `randomTargets` and `splash` on a damage row (ui.js `_slb2RiderEditor`):
unset = one ＋ button that writes the plan's defaults (`_SLB2_RIDER_DEFAULTS`: 3 distinct enemies × 1; splash × 0.5
radius 1 enemies); set = SHOTS number · ENEMIES / ANY UNIT · DISTINCT / REPEATS · × per hit, or × · RADIUS (or
"drawn" when the SPLASH grid holds a mask) · ENEMIES / ANY UNIT, with a line in words of what the normaliser makes
of it (the engine reads data.js `spellRandomTargetsOf` / `spellSplashOf`). Every change rewrites the whole object
through `_slbSetField` (one undo step, `_slb2RiderWrite`); the field's ✕ drops the rider; adding a splash makes
the SPLASH grid appear under the FOOTPRINT. A non-damage kind gets the button greyed and an amber "damage rows only".
The rail's HAS group gains "random / splash" (`riders` flag). The rack / HQ blades: 🎲×N and SPL N% badges
(hud.js `_hrlgRiderBadges`) and a splash row's card shape; the board: a random row's self-cast preview washes its
range and lights the pool, a splash row's hover lights the splash tiles with dmg × mult badges. CSS `.slb2-rider*`.

## ◈ THE PASSIVES ROW (SPELL_LIBRARY_PLAN.md Phase 4, 2026-09-26)

- **The forge's rack** (party-builder.js `pbTierCtx` → `ctx.passives`, `SpellTierPanel`'s `pb-tier pb-tier-pas`): passive /
  gear rows leave the four tier rows for a ◈ PASSIVES row under Tier I (the unit's own passive rows first, then the
  16 GEAR rows), head "◈ n/2"; a chip wears the row's icon, its statBonus as "+28 AWR", "PASSIVE", and a refused one
  reads "2 PASSIVES MAX" (`is-passives`, styles-base.css). The keyboard grid walks it; a passive never previews a cast.
- **The GEAR tab**: the two accessory slots are retired — the boxes SHOW the equipped passive rows (at most 2); a click
  opens TECHNIQUES, ✕ unequips. The gear picker, `handleAccChange`, `equipAccessory` and `ACC_ICONS` are gone. The stat
  preview reads `passiveIdsStatBonus(customSpells)`; the sticky notes show the rows (`pbUnitNotes(..., spellIds)`).
- **The HQ pause rack** (data.js `hqPartyTreeCircuit().passives`, map.js `_hqPauseCircuitHtml`): the same ◈ PASSIVES row
  under the tiers; the member sheet's GEAR section lists the kit's passive rows ("n / 2 · IN THE SPELL SLOTS").
- **The library** (ui.js SPELL LIBRARY v2): a passive row's EFFECTS tab opens on the structured HOOKS editor
  (`_slb2HooksEditor`: one line per key with its type, desc, reader and a typed control; ＋ HOOK ▾ lists every
  `PASSIVE_HOOK_KEYS` key with its example; every write is a NEW hooks object through `_slbSetField`, one undo step;
  the hook lint on top). The PASSIVES tab lists the gear rows (owner "gear · universal"); NEW ▾ passive templates match
  the engine (build = `buildBonus: { build: 1 }`; new passives default to the `gear` family = equippable by every unit —
  retag to scope one). Pure helpers `_slb2HookRows / _slb2HookPalette / _slb2HookParse / _slb2HookCheck / _slb2HooksWith`
  (tested in spell-library-ui.test.js). Fixed a Phase 1 bug on the way: popovers and modals attach to
  `#spellLibraryPage`, outside the body's click delegation, so their buttons were dead (NEW ▾ items, ROLE, ⋯, the
  dialogs' CANCEL, EXPORT's COPY / DOWNLOAD) — `_slb2BindFloat` gives each its own listeners.

## ⚙ THE UPGRADES IN THE RACKS + THE LIBRARY (SPELL_LIBRARY_PLAN.md Phase 5, 2026-09-26, token 20260926-spell-library-06-cors)
- **The forge (party-builder.js):** a loadout cell whose spell takes upgrades wears a ⚙ button (lit ⚙n = n on); it
  selects the spell without unequipping, and the TECHNIQUE PANEL shows ⚙ UPGRADES — one toggle per allowed upgrade (glyph,
  name, its SP, the desc or the refusal from `spellUpgradeVerdict`). Off until the spell is equipped. The panel's chips
  read the DERIVED def (`pbTechInfo` → `spD`), the kicker says "2 SP + 1 ⚙", an equipped chip shows its whole price and
  ⚙n, UNEQUIP gives back tier + upgrades. `pbTierCtx(race, cls, equipped, ups)` holds the repaired map (`pbEffUps`); every
  verdict and the SP meter count it. RST / CLR drop the map; RND rolls one (`buildRandomUpgrades`).
- **The HQ pause rack (map.js):** under ◈ PASSIVES, a ⚙ UPGRADES block — one line per equipped spell that takes upgrades
  (its upgraded numbers, ⚙ n / 2, +SP), a toggle per upgrade (`data-party-act="upg:member:spell:upgrade"` →
  data.js `hqPartyUpgradeClick`). The model is `hqPartyTreeCircuit(m).upgrades`; unequip drops the spell's upgrades
  (`hqPartySetSpells` repairs the map), RANDOM rolls them, CLEAR clears them.
- **The battle menu (hud.js):** a derived def wears ⚙n (the names on hover), plus ↯ n% (ricochet) / ⑂+n (forked) rider badges.
- **The library (ui.js):** a spell's UPGRADES tab — THE MODE (AUTO · CUSTOM · NONE; the first tick in AUTO pins the auto set
  as CUSTOM, unticking the last turns NONE), a TRY pair (up to two, one of a kind) whose resolved line reads "= 92 dmg ·
  15 MP · 4 SP" with the changed numbers bold, and the registry with each row's fit and its one-upgrade result. The
  UPGRADES registry inspector gains `requires` (the fit test), `excl` (one-of-a-kind group) and `auto`.

## ✦ POOLS · RACE FAMILIES + THE BIG ✕ (SPELL_LIBRARY_PLAN.md Phase 6, 2026-09-26, token 20260926-spell-library-07-cors)
- POOLS → RACE FAMILIES (was RACE ROWS): the rail counts each race's families (red outside 3–10); the detail lists the race's
  families (glyph, name, every member as a tier chip that jumps to the row, ↑ ↓ reorder, a big ✕), the tree rungs outside them,
  and ALL FAMILIES as toggle chips (member count, races on hover). Writes go through the doc's `raceFamilies` registry
  (`_slbRaceFamWrite` → `_slb2WriteReg('raceFamilies', …)`), so undo, export and the bake carry them; ↺ REVERT drops the row.
- ONE FAMILY PER SPELL: `_slb2FamilyOf(id, fam, true)` REPLACES the row's family (the toast says where it came from); the
  inspector's picker reads "⇄ move to family…", the bulk op "Move to a family", the member search "moves it here".
- The ✕ on a family's member list is `.slb2-xbig` (28 × 24 button); the inspector's owner chips' ✕ grew to 13 px with a hover.
- The matrix's lint is 3–10. Probe: playtest_library.js shoots `families_members`, `pools_race_families`, `pools_race_toggled`.

## ✦ THE RACK BY FAMILY + THE CODEX FAMILY PAGE (SPELL_LIBRARY_PLAN.md Phase 7, 2026-09-26, token 20260926-spell-library-09-cors)
The forge's TECHNIQUES rack and the HQ pause rack both FOLD BY FAMILY (default) or BY TIER — one per-viewer choice in localStorage
`ew_rack_group` (party-builder.js `pbRackGroupGet/Set`, map.js `_hqRackFold/_hqRackFoldSet`, the `fold:` party act). By family: a
row per family (`.pb-fam` / `.hq-circ-fam`, the family colour on the head's edge, the race's families first, others dimmer), chips
tier I → IV; the keyboard grid follows the fold; a Freelancer gets ONE ＋ BORROW (key `B0`, every tier) instead of one per tier.
Both borrow windows list family by family under `.pb-socket-fam` / `.hq-circ-famhead` headers; the forge's has a TIER filter in
the family fold and its search matches a family's name. The codex dossier's DOCUMENTED CAPABILITIES is the race's families
(ui.js `_codexBuildFamilies`, `.cdx-fam*` in styles-hud.css), RACE_ABILITIES the fallback. Pins: spell-families.test.js (Phase 7
block), spell-tree-ux.test.js (the family grid + B0), party-builder.test.js (the borrow window anchor).

## THE IDENTITY GENERATOR, second pass (2026-09-27)
ui.js SLB IDENTITY block: kits for the 23 families of the user's 2026-09-27 export; archetypes that duplicate a race are cut
(spell-identity.test.js compares every archetype name with AVAILABLE_RACES and RACE_PROFILES labels, plural-folded) — keep new
archetypes off race names; 68 new characters from the new families; the list of candidates for new races is in
/mnt/project-files/spell-library/NEW_CHARACTERS.md.

## ✦ THE FAMILY TABS (the jobs removal, 2026-09-27, token 20260927-spell-library-12-cors) — SUPERSEDED by THE FAMILY COLUMNS below
mondo: "Easy to read spell slots organized by family, maybe tabs for the families, with one section that shows the spell
info for whichever one you have selected/hovered on." The forge TECHNIQUES rack (party-builder.js SpellTierPanel) is now:
- **Head:** the loadout as seven slot cards 4 × 2 (`.pb-ls` with `--fam` = the family colour: disc, name on two lines,
  family label, tier numeral, ⚙ upgrades) plus the ALWAYS READY cell (`.pb-ls-ready`: the ☠ finisher `.pb-ls-fin` over the
  ⚔ basic attack `.pb-ls-root`, no slot, no SP); under it the tab bar
  (`.pb-famtabs` / `.pb-famtab`: glyph · name · n on, lit when the family holds an equipped spell). Tab order: the race's
  families, ✦ TRAINING, ◈ GEAR, ＋ BORROW (locked card with an OPEN TRAINING button until Adaptable is equipped).
- **Body** (the only scroller, `.pb-rack-body`): the open family's head (`.pb-famhead`: glyph, name, desc, count) then its
  cards tier I → IV two to a row with `.pb-famrule` tier dividers.
- **No foot strip** (the finisher strip / ALWAYS READY foot of the tier rack is gone; it lives in the loadout's 8th cell).
- **Info:** the TechniquePanel below (unchanged position) follows hover, else the selection; its kicker leads with the
  family glyph + name. Keys: `,` / `.` cycle the tabs; the grid keys walk the open tab (pbTierGrid).
- The rack state is `rackTab` (reset per unit); `pbTierCtx(race, cls, equipped, upsWish, tabWish)` returns `tabs` /
  `tab` / `sourceOf` / `famOf` / `borrows`. The old BY FAMILY / BY TIER toggle (ew_rack_group) is gone.
- Job pickers are gone from the builder, the roster wall (no job pill), the MD delver page, the campaign creator
  (`#cccJobSelect`), the shop, the HQ pause menu, the dungeon picker and the secondary-job dialog. Role labels in the
  builder read the race's role (pbRoleLabel = CODEX_CLASS_LABELS[RACE_CLASS[race]]).

## ✦ THE FAMILY COLUMNS (spell picker fix, 2026-10-01, token 20261001-spellpicker-01-cors) — replaces THE FAMILY TABS
mondo: the info panel covered the spells and flickered on hover; "Each spell family should be a column so I can see every
spell a unit has at one time. We dont need to show the tiers anywhere ... Get rid of the crt filter of scanlines ... Where
did the clear button for the spell slots?"
- **Cause of the flicker:** the technique panel sat in an `auto`-height grid row under the rack; a hovered spell's longer
  info grew the row upward over the cards, the mouse left the card, the panel shrank, repeat.
- **TECHNIQUES grid** (`.pb-body[data-tab="tech"][data-panel]`, styles-base.css "THE FAMILY COLUMNS"): columns
  `rack | --pb-side-w`, rows `46fr 54fr auto`, areas `"tech stage" "tech panel" "party party"`. The hero has its own cell
  (stageCx 0.5), the technique panel a FIXED cell under it that scrolls inside. No stats column on TECHNIQUES (they live
  on GEAR / DOSSIER). Sticky notes ride the hero cell, smaller.
- **The rack** (party-builder.js SpellTierPanel, `.pb-rack-cols`): tech bar (slots pips, SP meter, 🎲 RANDOM / ↺ DEFAULT /
  ✕ CLEAR ALL in `.pb-tech-tools`; the bar wraps, it used to clip RST + CLR; "SLOTS FULL" hint), the loadout strip (7 slot
  cards + ALWAYS READY, one row; a slot card shows its SP, ✕ on hover, click removes, ⚙ opens upgrades), then
  `.pb-famcols`: one `.pb-famcol` per `pbRackCols(ctx)` = ctx.tabs minus BORROW unless Adaptable is on. Each column scrolls
  on its own; the grid scrolls sideways when the glass is too narrow (min 136 px a column).
- **The card** `.pb-sc`: category disc, name (2 lines), then the gold SP chip + MP / range / AOE / power, or its own refusal
  (only SP / sealed; a full loadout or a full passive pair is said once in the bar). `.step` adds a gap where the cost goes up.
- **No tiers in the builder UI:** slot numerals, `TIER n` rules, panel kicker / chips, tooltips and the borrow window
  (its tier filter reads 1–4 SP) all show SP only. `pbTierOf` still drives costs and sorting.
- **The glass:** `.ms-crt-forge` hides `.ms-crt-scan`, `.ms-crt-glare`, `.pb-crt-roll`, stops the screen flicker and the
  heavy inset vignette. The type grade wash and the jolt stay.
- Keys: ↑↓ walk a column, ←→ change column (pbTierGrid / pbTierStep are column-based); `,` `.` are gone with the tabs.
- Small glass: ≤1400 px slot cards drop the disc; ≤1180 px the loadout is 4 × 2; ≤680 px tall (phone landscape) cards are
  one line (name + cost), party portraits shrink, notes hide; ≤940 px wide stacks hero / rack / panel / party.
- Not touched: the HQ pause menu's party rack (map.js) still shows tier rows.

## THE ONE BAR COLOUR + THE GRADE COLOURS (2026-10-01, token 20261001-spellpicker-02-cors)
mondo: "for the stat bars, get rid of the different colors ... why is B and S both blue? F red, C orange, B yellow, A green,
S Blue/Silver".
- Every stat bar is one ivory `#e3dcc6`: ui.js `EW_STAT_BAR_C` (inspect card, codex dossier), party-builder.js
  `PB_STAT_BAR_C` (forge pills; zodiac ▲▼ still tints green / red), map.js `_HQ_STAT_BAR_C` (pause-menu party sheet).
  HP / MP / EXP keep their own colours. PB_STAT_LOOK now only gives the ungraded rows their glyph.
- Grade faces live in styles-base.css `.ew-grade.grade-*` (the ONLY drawing path): F red, C orange, B yellow, A green,
  S blue / silver. data.js STAT_GRADE_COLORS / STAT_GRADE_FACE still hold the old hues but nothing draws from them.

## THE MAP (ZONES_PLAN Z3, 2026-09-30, token 20260930-zones-04-cors)
- Area sheet draws a LAYOUT room as its plan: data.js `hqRoomPlan(roomId)` / `hqRoomPlanModel(profile, roomId, hereSpace)`;
  map.js `_hqAreaPlans` (called after `_hqAreaLayout`, non-HQ areas only). Space node ids are `<room>~<space>`; `_hqMapTravel`
  and `_hqMapSpaceCardHtml` resolve them to the room (`planOf`). Lanes are edges with `pts` (sheet units) + `sw` (stroke px);
  `_hqMapSvg` draws them as paths before the plain edges. `HQ_MAP_PLAN_M` = 16 m per unit.
- Ledger: `profile.door.hq.spaces[roomId][spaceId] = date`, written by `_hqPlanTick` (setInterval 400 ms, started in
  `_hqEnter`). Not synced to the server blob.
- Secret links: `hqMapGraph` gives a link door with `secret` (row or end) kind 'secret'; the layout walk and
  `_hqWorldFloorOf` still treat it as a seam. `hqWorldRoutes(cur, { profile })` drops unwalked draughts and shut exits.
- Fast travel: `_hqMapCharted(roomId)` / `_hqMapChartedSite(site)` gate every map GO; `_hqWorldGoRoom(place)` picks the
  anchor if charted, else the first charted room of the place. `EW_HQ_MAP_ALL` still opens everything.


## THE SQUAD DESK (menu + PvP entry flow, 2026-09-30, token 20260930-menu-01-cors)
mondo: "I dont want players to get into a lobby and then spend five minutes assembling their teams." The flow now:
- **Main menu:** the first button reads NEW GAME until a story is on file (map.js `_storyOnFile`: the officer is on file,
  or `profile.storyStarted`, set by `_goToPlayHub` when the building opens), CONTINUE after (`_mmRefreshPlayLabel`, run by
  `_showTitlePage('mainMenuPage')`). ONLINE → ONLINE PVP, PRACTICE → PLAY VS CPU.
- **#squadDeskPage** (map.js block "THE SQUAD DESK" after `_playHubBack`): both battle doors open it first
  (`_openSquadDesk(mode, next)`). Cards = `profile.teamPresets` (the Party Builder archive), newest used first. Online needs
  4+ vessels (a smaller team shows "Needs 4 vessels"); VS CPU takes any (a team of 2 plays 2v2). A team of more than 4
  opens THE PICK (`_sqPickOpen`, keys 1–9 toggle, remembered as `preset.lastPick`). No team → BUILD YOUR FIRST TEAM →
  the standalone forge opens on a new sheet (`window._ewForgeOpen`) and SAVE / BACK return to the desk
  (`window._ewForgeReturn`, party-builder.js `tbSaveTeam` → `_ewForgeSaved`). EDIT on a card opens that team.
- The pick is `window._ewSquad = { mode, teamId, name, slots }` (UI-only, dropped by the main menu). `_ewApplySquad(seat)`
  seats it the way the forge's LOAD does.
- **VS CPU:** the desk goes to the practice terminal with `_hqPreselect.squad` (match-select.js shows YOUR SQUAD read-only,
  team size = the squad, no reserves); `_msConfirm` seats it, draws the CPU and starts the match (no builder; a failed start
  falls back to the builder). ESC on the terminal goes back to the team pick.
- **Online:** the desk → the online hub (squad strip + CHANGE) → Quick Play (mode only; 4v4; the server draws the map) or
  Friendly (the host picks mode + rounds; the map is drawn at random by `_friendlyDrawMap` at room create / mode change,
  sent in friendly-config as before). `_goToQuickPlay` / `_goToFriendlyMatch` open the desk first when no squad is armed
  (DISPATCH's desk in the building).
- **THE READY ROOM** (online.js `_rrOpen`, `#ewReadyRoom`, z 10000 under the loading screen): at room-full the squad is
  copied to `NET._squad`; `_enterOnlineMode` calls `_ewSquadAutoLock` (seat the squad on my seat, `applyPartyBuild(false)`
  after 450 ms). The host auto-starts friendly rooms too (`_tryAutoStartRanked` accepts `NET._squad`). The guest re-sends its
  party on every `host-locked` so a rematch reset order never loses it. Rematch reopens the room and re-locks. Closes when
  `.ls-overlay` appears, the session ends, or the phase turns to battle after setup was seen.
- Fixed on the way: the host stored the guest's `partyNames` array as one String (every guest unit read a single letter).
- Quick Play search is a radar (`.lq-radar`, "THE QUEUE" CSS); match found turns it gold.
- CSS: styles-base.css "THE SQUAD DESK" + "THE QUEUE" (end of file).

## THE TEAM ROOM (Squad Desk backdrop, 2026-10-07, token 20261007-teamroom-01-cors)
mondo: "instead of just a bunch of boxes with their portraits can we make it a room inside the door facility and your team is
just hanging out posing ... a desk and chair and computer and a plant ... a drop down menu or a button or arrows to choose a
different team that would have their portraits (sprites for fallback)".
- **The page** (map.js "THE TEAM ROOM" in the Squad Desk block): one team at a time. The card grid is gone; the bottom dock is
  ‹ the team's plate › + EDIT / NEW TEAM / DEPLOY. The plate (portraits via `_sqFace`, the map sprite as the fallback; a
  bigger team's bench faces dimmed) opens THE LIST (`#sqDrop`, every team with its faces). ← → / the arrows cycle teams,
  ENTER deploys, ESC closes the list then goes back. No key-hint text (the foot is empty; THE PICK's hint line is gone).
  The pick-4 sheet, the deploy beat, the forge round trip and the online / VS CPU hand-offs are unchanged.
- **The room** (three-renderer.js `ThreeRenderer.teamRoom`, "THE TEAM ROOM" before the API return): a small D.O.O.R. office
  drawn on the SHARED board renderer through the post chain (the menu scene's pattern: `enter({host})` / `leave()` /
  `setTeam(slots)`; no second WebGL context). Drywall over an oxblood dado, teal trim, carpet, acoustic ceiling (`_hqMat`,
  the building's sheets, 2 m tiles), catalogue props through `_miscModelInstance` + `_hqPropMatPick` (desk_wedge_a,
  crt_terminal + desk_lamp on the desk top, office_chair, potted_plant, water_cooler, wall_clock), real lights only (a
  hemisphere, the ceiling point light, key / fill / rim directionals, the desk lamp's point light), the box-room AO on, no
  fog. THE GATE (`own: true`) holds the canvas at opacity 0 until the room's own files land (cap 20 s). Members (the
  remembered pick of a bigger team, else the first four; `_sqShownIdx`) use the board's Lambert look and appear only once
  their rig AND idle are in (no T-pose); idles start at random phases, and every 5–9 s one member strikes a library pose
  (`TR_POSES`: castSupport / castHeal / castAOE). heightRatio 1.0 = 1.75 m. The camera frames the tallest member between the
  title and the dock (feet 33 % from the bottom, heads under 74 %) and drifts slightly. 30 fps on EW_PERF_LOW / phones.
  Tunables: `TR_ROOM`, `TR_PROPS`, `TR_SPOTS`, `TR_POSES`.
- **Hand-over:** `_showTitlePage` calls `window._sqRoomLeave` for any other page; the menu scene, the HQ and a battle
  `activate()` each leave the room first. The room refuses while the HQ or a battle holds the canvas (the desk then shows on
  the void as before). `#menuBgCanvas` is hidden while the room is up. CSS: styles-base.css "THE TEAM ROOM".


Follow-up (token 20261007-teamroom-03-cors, mondo: "turn the bloom off and add a ceiling ... make the ui look more like the hud of
the exploration mode ... match the ui theme of whatever the player has selected in the settings"):
- BLOOM: three-post.js `renderScene(scene, cam, opts)` takes `opts.noBloom`; the room passes it, so bloom strength is 0 for
  that draw only (restored in the finally). The player's slider is untouched everywhere else.
- CEILING: TR_ROOM.h 2.7 (was 3.1) so the lid sits in frame; hemisphere ground 0x8a7c6c / 0.7 and the ceiling point light at
  (0, h-0.6, 1.0) light it; the top page gradient is lighter (0.35 -> clear by 16%) so it is not hidden.
- HUD THEME: `#squadDeskPage` joins `#hqPage, #pauseOverlay` in the --hq-* token block (styles-base.css), and the block
  "THE TEAM ROOM — THE HUD THEME" restyles the head, plate, arrows, action rows (gold cursor on the hot one), drop list and
  pick panel as HUD windows, so they follow hud.js HUD_THEMES (data-hud-theme) like the exploration HUD.

## THE NAMES + THE ONE BATTLE PAUSE MENU — 2026-09-30 (token 20260930-pause-01-cors)
mondo: no random names, a unit is its race until the player types a name, rename in the story pause menu, one battle
pause menu (ESC and the HUD ☰ looked like two, and resuming from ESC ended the fight), no Strike Mode section.
- **Names.** state.js `generateRandomName` is gone; `getDefaultUnitName` returns `''` (empty = the race). battle.js
  `makeUnitsFromBuilds` falls back to createUnit's race label. `isGeneratedDefaultName` also treats the slot's own race
  label as a default. data.js `DEFAULT_PARTY_NAMES` (unused P1/P2 list) deleted. The forge's NAME field shows the
  typed name with the race as its placeholder (party-builder.js `customUnitName` / `resolveUnitName`). Default
  `state.nametagMode` is `'name'` (a nameless unit's name IS its race). One-time wipes: saved team slots
  (profile.js backfill, `p._namesV = 2`) and the story party's non-officer names (data.js hqPartyRecord, `r.names = 2`);
  `hqPartyNormMember` never files a race label as a name; `hqPartySpec` names a new member `''`.
- **Rename (story pause menu).** map.js member sheet: NAME block (`data-party-rename` input, ✎ RENAME, ✕ CLEAR, ENTER
  files it) → data.js `hqPartyRename(profile, id, name)` (18 chars; the race's label or empty = back to the race; the
  officer needs a name and it also writes door.hq.officer.name + the look's name). CSS `.hq-pp-name*` in styles-base.css.
- **The ESC bug.** The pre-match forge stays mounted in #builderOverlay through the battle, and its ESC listener ran BACK
  (`backToModeSelect`) under the pause menu: the fight ended and RESUME landed in the room. party-builder.js now ignores
  keys while `state.phase === 'battle'` or when the forge is not on screen.
- **The battle pause menu** (ui.js `_renderPauseMenu`): one menu for ESC / P / ☰ / START, in the building's frame (the
  `.hq-pause-*` layout + THE HQ HUD PASS tokens, now also defined on `#pauseOverlay`; `bp-*` CSS in styles-hud.css).
  Commands RESUME · PARTY (your units: portrait, LV, HP/MP, statuses; bench + escaped) · MATCH (the scoreboard + awards)
  · STATUSES · SETTINGS (AUDIO · VIDEO · GAME [speed, auto, CPU difficulty] · CONTROLS) · FORFEIT. ↑↓ commands, ←→
  settings pages, ESC / P resume. The Strike Mode block (and `_ewStrikeRebind`) is gone from the shared controls page.

## THE PHONE FIT + THE TOUCH CONTROLS (2026-10-01)

mondo: "mobile controls, like a joystick and maybe some buttons … especially for the exploration mode … the menus are kind
of impossible to navigate on mobile … one finger drag for pan and two for rotate … without changing how it is on desktop".
Everything is gated on `window.EW_MOBILE` / `html.ew-mobile` (index.html: touch + a coarse pointer or a phone UA), so the
desktop page, CSS and mouse / keyboard input are unchanged (the battle's touch gestures change for any touch screen).

- **THE PHONE FIT** (index.html, right after the mobile detection). The UI is laid out for a desktop window; a phone's
  390 px short side cropped every panel. On a touch device the viewport meta is rewritten to `width = deviceW / s,
  initial = min = max-scale = s` with `s = min(1, shortSide / 540)` (screen.width/height, so ONE scale in both
  orientations; iPhone 13 → s 0.722, layout 1169×541 landscape / 540×~920 portrait). The browser scales the page down;
  css px stay css px, so taps, raycasts and the canvas all agree (no CSS zoom). Tablets (short side ≥ 540) are untouched.
  `window.EW_FIT_SCALE` = s, `--ew-touch-k` = 1 / s (`calc(Npx * var(--tk))` = N real px on the glass). Settings >
  Performance > **Screen Fit** (phones only, map.js `_buildScreenFitHTML` / `_ewSetScreenFit`): Small 600 · Normal 540 ·
  Large 470 · Off; stored as `ew_mobileFit`, applied live (`window._ewApplyFit`).
- **THE WALK** (map.js `_hqTouchControls`, three-renderer.js `ThreeRenderer.hq.touch`). `#hqTouch` inside #hqPage (z 19:
  over the stage, under the strip / panels / pause). A floating thumbstick on the left 42% (analog: `touch.pad(ix, iy,
  run)` feeds `H.pad` into `_hqTickWalker` for any-direction walking and mirrors W/A/S/D/SHIFT into `H.keys` for the ride,
  helm, swim and climb; the rim (> 0.9) runs). A one-finger drag anywhere else looks (`touch.look`, mouse gain × the fit),
  two fingers pinch the boom (`touch.zoom`, the wheel's 1.5–7.5 m) and turn with the midpoint. Right thumb: JUMP (SPACE),
  USE (E; glows while the prompt is up), ATTACK / DOOR A / FIRE / FLIP, DOOR B / TURN / SPIN (`touch.fire('a'|'b')` = the
  mouse buttons; on the board both are THE STICK via `touch.stick`), DASH (C; reads DIVE / DOWN in water / at a helm). Top
  right column: GUN (F, only when issued), DOORS (the middle-button wheel: hold, drag, let go), BOARD (B, when issued), 1ST
  / 3RD (V), MAP (M), ☰ (P). Key buttons send real `KeyboardEvent`s on document, so every rule behind a key stays the
  keyboard's (F tap / hold recall included). The layer shows only when the walk runs (not paused, not editing, load done,
  not in a battle, not suspended) and lets go of every held key when it hides. `#hqHints` is hidden on phones; the
  prompt's `[CLICK]` / `[E]` read `[ATTACK]` / `[USE]`. A portrait walk / fight shows one "turn sideways" pill per visit.
- **THE BATTLE CAMERA** (state.js touch handlers on `.map-center`). One finger = pan (as before). Two fingers = ORBIT now
  (the pair's drag turns / tilts like the middle mouse button, the pinch zooms, a twist turns); three fingers still orbit.
  A touch that starts on the HUD (Horologe, panels, buttons, lists) is the HUD's and never drags the board.
- **THE BATTLE HUD on a phone** (ui.js `_applyUIScale`): `--ew-ui-scale` = min(0.72 / fit, h / 590) so the Horologe's
  blades are finger-sized (desktop 0.61 rule left them ~16 real px); `--ew-hud-scale` floors at min(0.56 / fit, h / 700).
  The ☰ on the match plate is a 24 px button.
- **CSS** (styles-base.css tail, all `html.ew-mobile`): safe-area insets for title pages / overlays / the strip / the
  terminal, a thin CRT bezel, `dvh` caps for dialogs / panels / pause cards, touch scrolling on the lists, portrait title
  + main-menu seal fixes.
- Not covered: the Mystery Dungeon hub walker (its own strike-mode input; `ThreeRenderer.hubFreeRoam.setPadInput` exists if
  it is ever wanted) and the editor. Checked in the sandbox at iPhone 13 size (landscape + portrait): menus, terminal,
  forge, HQ walk (stick walks 3.7 m, look turns, JUMP holds SPACE, ☰ pauses and hides the layer), battle start.

### THE BATTLE MOUSE (2026-10-04, mondo)
In a battle: LEFT-drag pans, RIGHT-drag orbits (the old middle-drag job), a plain right click still backs out
(handleBackAction), a plain left click still selects. Middle-drag and right-drag pan are gone in battle; the map editor
keeps right-drag pan + middle-drag orbit. state.js: the left pan arms on mousedown over the canvas/#boardStage and only
starts past BATTLE_PAN_DRAG_PX (6 px); the click after a real drag is swallowed by a window capture listener. A press on
the active unit's tile that starts drag-to-move (ui.js window._ewDragMoveActive) never pans. Hints: hud.js hints bar,
ui.js pause-menu keybinds + camera help. Touch and exploration untouched.

## MOVE MODE → QUICK MENU (2026-10-05)
mondo: clicking the Cube or another unit while Move is armed must open its quick action menu. Root cause: the
2026-09-19 "MODE HOLDS" rule in battle.js clickTile answered a unit-sprite click in move mode with "Pick a highlighted
tile" (and an occupied tile with "That tile is occupied"); the Cube tile fell through to move-towards/doMove. PR #94's
left-drag pan was NOT involved (it only swallows the click that follows a >6 px drag). Now `_moveClickMenuTarget`
(battle.js) picks a unit (its sprite, or its tile when that tile is no legal landing) or a Cube/turret tile, and
`_exitModeAndShowUnitMenu` / `_exitModeAndShowTileMenu` drop the mode and set the same anchors the no-mode click sets
(`_enemyActionTargetId` for any other unit, ally or enemy; `_tileActionTarget` for object tiles). Fogged tiles never
open a menu. Empty tiles still hold the mode. online.js guest wrapper uses the same helpers (viewer-local UI).

## THE QUICK-CAST AIM + PREVIEWS (2026-10-05, mondo)
"it doesnt show aoes that can hit them ... its just the center tile isnt on them", "i need to see ricochet damage",
"if its an aoe it doesnt show its aoe preview when i hover on it in the tile quick action menu".
- battle.js `isTileAoeSpell` (aoe / aoePull / tile-aimed cross) + `findBestAoeAimForTarget(unit, spell, tx, ty,
  {castFrom})`: legal centres from getSpellRangeTiles whose footprint covers the clicked unit; most visible enemies,
  then fewest allies, then nearest the victim. Memoized ~300 ms (the HUD rebuilds the menu every render).
- hud.js `_computeEnemyActions`: tile AoEs use it for in-range rows and for a MOVE→CAST search over walk/jump tiles
  when no approach puts a centre on the enemy. Rows carry `aim` + `aimFrom`; `_fireEnemyAction` casts at `aim`
  (re-picks if the caster ended elsewhere; a guest keeps the row's aim). Hover preview + nameplate forecast read the
  same aim (`_hoverActionForecast.aim` → ui.js forecastOnUnit 5th arg).
- ui.js `drawForecastChain`: forecast hits tagged bounce / chain / fork / split / splash get a crimson plate off the
  footprint (overlays `spellChain` normal aim, `actionPlanChain` quick menu; styles in three-renderer.js) and a
  crimson hop arrow; badges carry ↪ RICOCHET / ⚡ CHAIN / ⑂ FORK tags. The quick-menu hover now also renders the
  forecast badges (cleared in `_clearMoveArrowPreview`).
- Tile quick menu spell rows: hover calls `updateAoePreview(tx, ty, {unit, spell})` (new `ov` arg, also on
  updateIntentPreview) = the armed cast's footprint + forecast; hover-out clears it.

## ✦ THE VIEW CLICK (2026-10-06, token 20261006-spell-select-01-cors)
mondo: clicking an equipped spell to see its upgrades unequipped it (and dropped its upgrades). Now, in the forge rack
(party-builder.js SpellTierPanel): a click on an equipped card or loadout slot that is NOT the selected one only selects it
(the technique panel + its ⚙ upgrades show); a second click on the selected one takes it off. The loadout slot's ✕ is a
real button (styles-base.css .pb-ls-x lost pointer-events:none) that removes in one click. Passives / gear / training cards
share the same card, so they follow it. The HQ pause rack (map.js) lists every equipped spell's upgrades at once, so it
keeps its one-click toggle.

## THE CINEMATIC CAMERA + THE MAP SHOTS (2026-10-06, token 20261006-cinecam-01-cors)
mondo: "a cinematic cam mode where i can move the camera around the map and take screenshots or screen record ... a
screenshot of each map or arena so in the map select it can show the location in the background ... a cinematic pan ...
eventually ... cutscenes". Built in, no Theatre.js: its timeline editor (@theatre/studio) is AGPL, stalled since 2023 and
React-heavy; a keyframe path on three's own CatmullRomCurve3 does the pans and zooms and is the cutscene format.
- Code: three-camera.js `EWCine` (window.EWCine). three-renderer.js hands it the camera just before the draw
  (renderFrame after ThreeCamera.sync; _hqFrame in place of _hqTickCamera) and calls `EWCine.after(canvas)` right after the
  draw. In the building `_hqEditing(H)` is also true while it is on (`_hqCine()`): the walker stands, the room's keys and
  mouse stand down, a lost lock is never the walker's ESC.
- Open: CAMERA in either pause menu (map.js _HQ_PAUSE_CMDS, ui.js _pauseCmds) or F8. Leave: F8, ESC with the mouse free, EXIT.
- Fly = the editor's creative keys (WASD/arrows, SPACE up, SHIFT down, click or E captures the mouse, wheel = speed);
  Z / X lens. P photo (PNG, canvas size), M map shot, R record, K add key, BACKSPACE undo key, ENTER play path.
  The panel (buttons, SPEED / LENS sliders, SECONDS PER KEY) shows only while the mouse is free. No hint text.
- HUD: every page layer over the canvas (the canvas's ancestors' siblings) gets opacity 0 while on; stills and video read
  the canvas only.
- Stills/video read the canvas right after the draw through a 2D mirror (WebGL and WebGPU alike). Video = MediaRecorder on
  the mirror's captureStream(60), ≤1920 px long side, 16 Mbps, silent, MP4 if the browser records it else WebM.
- Path: keys {p:[x,y,z] METRES (world / unit; battle unit = tileSize/2), yaw, pitch, fov, s = seconds to the next key};
  localStorage `ew_cine_path:<hq|battle>:<room or mode>`; COPY PATH = the JSON; `EWCine.play(path, {record, onEnd})` flies
  it (one ease-in-out over the whole flight). Story cutscenes should call that.
- MAP SHOT: 1600×900 JPEG (centre crop) named `<site>.jpg` (hqSiteId: an arena and its full site share one). Saved to
  IndexedDB `ew_mapshots` (this browser's map select shows it at once) and downloaded; mondo uploads it to R2
  `Assets/MapShots/<site>.jpg` so every player sees it. match-select.js `MapShot` = `.ms-crt-shot` inside the tube's
  glass at 0.42 opacity (styles-base.css), fetched with the ?v= token; none = nothing drawn.

## THE SHOT RECORDER (2026-10-18, token 20261018-shotrec-01-cors)
mondo: "a tool that snapshots/records the current camera orientation for clicking on a unit and facing towards them ...
frame the shot myself for different scenarios like being in the air and the target on the ground or vice versa or far
away vs close ... let me export them all at once so you can take it and apply it".
- Code: three-camera.js `EWShots` (window.EWShots; the panel, the free framing, the store, the export) + battle.js
  `window._ewShotRecApi` (pair(): the last target pick `_shotRecPick`, set at the top of `_tpsTargetShot`; bodies via
  `_menuCamBody`; autoPose(): `_menuShotPose`; reframe(); place()/lift() staging). three-renderer.js renderFrame calls
  `EWShots.frame(cam)` after EWCine.frame (only while FRAME IT is on) and `EWShots.after(canvas)` after the draw (the picture).
- Open: SHOTS in the battle pause menu (ui.js _pauseCmds) or F7. Panel docks top-right.
- FRAME IT overrides the THREE camera each frame (the board rig is never touched, so stopping hands the game's camera back
  as it was): orbit pivot, yaw/tilt in the rig's convention, distance, lens. LEFT-DRAG orbit, RIGHT-DRAG / SHIFT pan, WHEEL
  dolly, SHIFT+WHEEL lens, WASD pivot, R/F height, Q/E orbit, T/G pitch, Z/X lens, ENTER record, ESC stop. Sliders mirror it.
  GAME SHOT = the menu camera's own solve (in FRAME IT) or the game re-framing the pair (outside it).
- RECORD SHOT: `framed` (eye, gaze, lens, swing off the caster→target line, pitch, eye/look offsets in the pair frame,
  look fraction along the pair, distances, both bodies' feet/head on screen, `moveTo` rig terms) + `scenario` (gap,
  height gap, who flies, kinds, menu, spell, mode/site) + `game` (the same numbers for _menuShotPose) + a 400 px JPEG.
  `source` = framed | game. TRY re-applies a shot's swing/pitch/look point/distance/lens to the pair on screen now.
- MOVE UNITS (VS-CPU only, not online): click a unit then a free tile (no AP, no arrival effects); ▲/▼ lift a flyer 0-4.
- Store localStorage `ew_shot_rec_v1`; EXPORT ALL = `EW_CAMERA_SHOTS_<stamp>.json` (conventions block inside).
  Viewer-local, nothing relayed. Browser-checked (WebGL, TDM): game-shot record matches the solver within ~1°.

## THE UI MAKER — phase 1: the theme engine + the editor screen (2026-10-08, mondo, token 20261008-uimaker-01-cors)
mondo: "a ui editor that lets me customize all uis and menus and follows the themes in the settings ... set different uis
to different menus or huds ... shapes of panels like squares or beveled or round or circular or even diamond ... outlines
or gradients or even material ... a 9 slice that can be reused ... the match select screen has a totally different feel".
All of it lives at the END of hud.js (one IIFE, "THE UI MAKER"); `window.openUiMaker()` opens it (Settings → Display →
🎨 UI MAKER under the HUD Theme row, the same row in both pause menus, the world editor's 🎨 UI top-bar button).
- **Themes are data.** `HUD_THEME_TOKENS` (hud.js, next to HUD_THEMES) holds the six built-in token sets as JS (the CSS
  blocks in THE COLOUR PASS stay). A custom theme = structured `colors` (→ the --ew-* tokens + `--uim-accent/-good/-bad/
  -well`), `skins` per ROLE (panel, head, button, buttonSel, chip, chipOn), `text` (body font, title font, caps, spacing,
  shadow/outline/glow). `UIM_PRESETS` ship five read-only ones made with it (Gilded, Steel, Oak & Brass, Phosphor =
  the terminal as a theme, Crystal Glass). Store: localStorage `ew_ui_maker` {themes, slices, assign}; viewer-local,
  nothing relayed (like HUD_THEMES). HUD_THEMES gets the presets + customs appended, so the Settings picker lists them.
- **Skins = baked 9-slices.** `bakeSkin` draws a shape (square, round, pill, bevel, notch, tab, scoop + the whole-box
  hex, diamond, circle) with fill (solid/gradient/radial/material/none), a terrain texture as MATERIAL (Assets/Sprites/
  terrain/*.png, CORS-readable; blend + strength), outline + inner rim, bevel light/shade, gloss, glow, drop shadow on a
  canvas (2× px), and applies it as `border-image: url(png) <slice> fill / <w> / <outset> stretch`. The box keeps its
  size (border-image-width ≠ border-width); the shadow/glow ride the OUTSET. A skin can instead point at a saved
  9-SLICE (`db.slices`: an uploaded image (≤512 px), a game texture, or "Save this skin as a 9-slice"; cuts t/r/b/l in
  image px, display scale, outset, stretch/tile, fill middle) — reusable by any role of any theme.
- **Surfaces.** `UIM_SURFACES` = every themed screen: scope + role selector lists. `native` ones already read the
  tokens (Battle HUD, Victory/defeat, Exploration HUD, Battle pause, Squad desk) and only get skins + text. The rest get
  a generated THEME PASS that paints their roles from the tokens (PAINT): Match select (the CRT's --ph-* mapped onto
  the theme, bezel/scan/glare hidden, the glass = a plate), Party builder forge (same), Settings + every .pm-* settings
  row, Codex/shop/library/tutorial, Online lobby, Dialogs, Battle pop-ups (inspect card, weather tip, banner) — all
  default to the Settings theme; Main menu + play hub, Loading screens and the World editor default to ORIGINAL LOOK.
  The MENUS tab assigns any theme (or Original) per surface (`db.assign`).
- **One sheet.** `UIMaker.apply()` writes `<style id="ew-ui-maker">` last in <head>: `:root:root {global tokens}` (also
  fixes the HQ falling back to Classic Blue after a battle unmounted the hud sheet), then per surface its scoped tokens
  (when not the global theme), its pass, its skins (`:root:root` prefix + !important). Adding a screen = one
  UIM_SURFACES row. Not themed yet: Profile / Leaderboard / Community Maps (React inline styles), the 3D nameplates,
  the party dock SVG, the campaign/challenge pages.
- Next (phase 2 per the plan): more presets, per-element layout editing (move/resize/hide HUD pieces).

## THE UI MAKER — pass 2: the old-school designer's kit + a UX pass (2026-10-08, mondo, token 20261008-uimaker-02-cors)
Ask: "what would a veteran old school ui designer want from this tool that it doesnt have now? Add those features ... make sure it is easy to use and looks well, UX." All in hud.js (the UI Maker IIFE at the end).
- **Skin engine:** a `pixel` shape (stepped corners); `s.pixel` = PIXEL SIZE 1-4 (skinGeom rounds corner/outset/middle and line widths to multiples of N, bakeSkin draws at scale 1/N, the rule gets `image-rendering: pixelated` with `> *` reset to auto; `_pixelCss` holds those border-image strings; a 9-slice with `crisp` joins it too); `s.dither` 1/2 = Bayer 4x4 ordered dither to 15-bit / 12-bit after the bake (PNG, not webp); fill kind `corners` (c1 TL, c2 TR, c3 BL, c4 BR, a 2x2 canvas scaled bilinear: the four-corner window).
- **Text:** effects `hard` (1px 1px 0 #000) and `hard2` (2px).
- **MOTION (per theme, `t.motion` {open, ms, cursor, bob}, motionOf()):** window open animation on each surface's panel role (`uim-pop/stretch/unroll/wipe/fade` keyframes in the generated sheet, `scale`/`clip-path`/opacity, fill-mode backwards; `noAnim` on battlePop + loading so the banner's own animation stays). Menu CURSOR glyph via the surface's `cursor` pseudo list (pause + exploration pause `.hq-pause-cmd` ::before, match select `.ms-tty-row.sel > em::before` with `cursorPre`, the preview); bob = `uim-bob` on `translate`.
- **HUD LAYOUT (`db.layout[id]` {x, y, s, o, hide}, UIM_PIECES):** exploration area name / hazard pay / party portraits / prompt / toast; battle command menu (no hide) / scoreboard / match info / party dock / spell description bar / minimap / centre banner. `layoutCss()` emits `translate`/`scale` (compose with the pieces' own transforms), `filter: opacity()`, `display:none`. Layout tab = sliders per piece; ARRANGE ON SCREEN (`arrangeOn`, also `UIMaker.arrange()`): html.uim-arranging hides the maker + #pauseOverlay/#hqPause/#settingsPage, a box per piece on screen (rAF re-measure), drag (8px snap, Alt = free; live inline translate, sheet on release), wheel = scale, arrows nudge (Shift 8), right-click hide, double-click reset, grid + TV safe area (5%), Esc/Enter = done.
- **Presets:** Corner Blue (four-corner blue, white rounded frame, hard 2px text, stretch open, ☞ cursor), Pixel Black (pixel corners at 2x, DotGothic16, ▶), PS1 Grey (strong dither, bevel, unroll).
- **UX:** top bar = open theme + tags, Undo/Redo (Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y; whole-theme snapshots, a drag = one step), Use in the game, Done. Built-ins/presets edit through a DRAFT: the first change makes "<name> copy" (and if it was the game's theme the copy becomes it, syncPickerRows first or setHudTheme rejects it). Click any part of the preview to edit that role (dashed pink highlight); preview zoom 1-3x (`zoom`), Replay open, a message-window mock. Every slider has a number box, every colour a hex box. Skin sections collapse (`<details>`, UI.shut). Copy/Paste skin, Use on every role, Reset. Colours tab shows ink-on-plate contrast. Save file / Load file (.ewtheme.json) next to copy/paste text. 9-slices: link cuts, crisp pixels, game textures from a dropdown. Keyboard: a window capture listener eats keys while the maker is open (game hotkeys stay quiet).

## THE UI MAKER — pass 3: the live view, the dodging panel, the hero section (2026-10-16, mondo, token 20261016-uimlive-01-cors)
Ask: "in the ui editor with the layout and menus sections it would be nice to [see] what i am editing like with arrange on
the screen. but arrange on screen has a box that has the controls but it doesnt go away and its on top of the very hud
element i want to adjust. Also i want to be able to adjust and change the horologe hero section. just make the entire ui
editor better and more robust". All in hud.js (the UI Maker IIFE).
- **LIVE VIEW** (`liveOn(mode)` / `liveOff`, `UIMaker.live('layout'|'menus')`, `UIMaker.arrange()` = layout): the
  LAYOUT ⧉ and MENUS ⧉ tabs no longer render in the editor's columns; the maker hides (`html.uim-live`) and the real
  screen shows. LAYOUT also sets `html.uim-arranging` (hides #pauseOverlay / #hqPause / #settingsPage over the HUD).
  Layout boxes: pink = on screen, blue = a stand-in for a piece that is not up (where it was LAST SEEN, localStorage
  `ew_ui_maker_seen` via `noteSeen`/`ghostRect`, re-dressed in the current move + size; else `UIM_PIECES[].def`),
  orange = pushed off the screen (box clamped to the edge so it can be grabbed). "Not up now" picks which group's
  stand-ins show (Auto = the group on screen). Smaller boxes sit on top (z by area), so a piece inside a piece stays
  clickable; the parent's tag sits right (`tagRight`). Drags keep 24 px of the piece on screen. Menus boxes (cyan):
  every UIM_SURFACES scope that is up; a whole-screen layer boxes its panel/head role elements instead; a menu not up
  shows a mini preview in the theme it wears (the dock holds the only #uimPreview while live; the editor's middle
  column is emptied).
- **THE DOCK** (the controls box): moves itself only when it would cover the selected piece (`dodge`: best of 8 edge
  spots, fewest other boxes covered, furthest from the selection; top right on ties), fades + lets clicks through
  while a piece is dragged (`.busy`), drags by its bar, folds (F / ▾), Peek (hold Space or the button) hides boxes +
  dock. The selected piece's controls sit above the piece list. Keys: Tab / Shift+Tab next piece (or menu), arrows
  nudge (Shift 8), + / − size, H hide, R reset, Esc / Enter back to the full editor.
- **THE HOROLOGE HERO SECTION**: new pieces `hero` (.hrlg-side) and `cmds` (.hrlg-panels) beside `rig` (both noHide,
  grow from the bottom-left corner). `db.hero` = { w, watch, gap, face clock|portrait|dial, glow, header, hide: {watch,
  chips, name, sub, types, vitals, ap, items, mats} } → `heroCss()` in the layout sheet (same in every theme). New
  skin ROLE `hero` (battle surface roles.hero = .hrlg-side, drawn after panel so it wins; off = wears the panel skin;
  `fixTheme` gives every stored / imported theme the role). The preview shows a hero mock (`HERO_MOCK`).
- **Robustness**: layout + hero CSS ride their own sheet `#ew-ui-layout` after `#ew-ui-maker` (`applyLayout`; a drag
  rewrites only it, no inline styles React can lose). Layout, hero, per-menu themes and the Settings theme are UNDO
  steps (`snapLayout`, one step per drag, none for a plain click). The store is sanitised on load (bad layout numbers
  dropped, broken themes skipped, missing skin parts filled).

## THE UI MAKER — pass 4: health bars, the Horologe's look, the hero outside its panel (2026-10-16, mondo, token 20261016-uimbars-01-cors)
mondo: "let me change how the health bars look and what gets a normal health bar and what gets a circular one. also i
dont see the same options for the horologe menu as all the other stuff, like why cant i change its panel's shape and
corners and colors ... i want to have the hero portion outside of the panel but still have the panel for below."
- HEALTH BARS: a third live-view mode ("Bars" in the panel bar, "Health bars ⧉" tab in the full editor). db.bars =
  { place: { hero | turns | dock: 'bar' | 'ring' | 'both' }, look: { shape, h, fill, seg, hp, foe, lowOn, low, mp,
  track, frame, frameW, glow, wave, nums, labels, ring, caps } }, same in every theme, undoes with the layout. The CSS
  is hud.js barsCss() in the #ew-ui-layout sheet; an untouched setting writes nothing, so the defaults leave every bar
  exactly as it was. Every place draws BOTH shapes and the sheet swaps them: the watch ring (HorologeHub g.hrlg-hring,
  HP r109 / MP r102.5, inline display:none) + .hrlg-vnums (the numbers when the bars give way to the ring);
  PartyPortrait .ew-pp-bars; map.js _hqFillDock .hq-dock-bars. Low HP (≤30%) = .low on .hrlg-vrow.hp,
  .hrlg-thp-fill, .ew-pp, .hrlg-hring (the dock already had it); enemy target fills carry .foe; the XP row is
  .hrlg-vrow.mp.xp. Target rows + the quick look are bars only. (Name plates: see pass 5.)
- THE HOROLOGE'S LOOK: picking the hero section, the command panels or the command menu in the Layout view shows the
  full skin editor (shape, corners, fill, frame, light, retro, 9-slice) for the theme the battle HUD wears, by role
  (Hero section / Windows / Command rows / Selected row), plus that theme's colours. A built-in or preset turns into
  the player's copy on the first change; materialize() now also re-points db.assign entries to the copy.
- HERO OUTSIDE THE PANEL: db.hero.split + out ('watch' | 'name' | 'vitals') + splitGap + pad. hud.js _hrlgSide
  renders the column as .hrlg-side.split > .hrlg-side-top + .hrlg-side-low (HorologeMenu re-renders on the
  'ew-uim-hero' event); heroCss strips the column's plate and the low part wears the Hero skin (else Windows; both
  roles list .hrlg-side-low), else the plate tokens. The title bar is off while split.

## THE UI MAKER — pass 5: the hero's parts move freely, flat hero bars, name plates in Health bars (2026-10-16, mondo, token 20261016-heroparts-01-cors)
mondo: "i want to rearrange the elements like i want to have the health bars right under the portrait and clock or a
little on it ... move that stuff around and move it all in and out of the panel. also that health bar is a pill
looking thing when it should be like the other health bars or let it be a preset as well".
- HERO PARTS: db.hero.order (ids watch, chips, name, sub, types, vitals, ap, items, mats, tools), db.hero.where
  { id: 'out' }, db.hero.nudge { id: { x, y, s } }. Untouched = the plain column. Once customised, hud.js _hrlgSide
  wraps each part in .hrlg-part-<id> in that order; runs outside float as .hrlg-side-top, runs inside become
  .hrlg-side-low panels (several if the order alternates). nudge: x = translate, y = margin-top (parts below follow;
  negative pulls a part onto the one above, e.g. bars over the watch), s = zoom. Layout view: the hero's Parts list
  (▲▼, In panel / Outside, show) + green boxes on screen per part (drag, wheel = size, arrows after a part click).
  PR #229's split/out flags convert to where on load (heroLegacy).
- HERO BARS: the rounding pass no longer rounds .hrlg-vbar/.hrlg-vfill/.hrlg-vspend (flat like the name plates);
  Health bars > Shape > "Hero bars" picks their ends on their own (Pill = the old capsule).
- NAME PLATES: three-renderer.js .tp-bar plates are DOM, not canvas (pass 4's note was wrong); the Health bars look now
  reaches them (colours, ends, track + frame; not thickness). Place row "Name plates" (bars only).

## THE UI MAKER — pass 6: text, font, colour and tilt options for a Persona 5 look (2026-10-16, mondo, token 20261016-textstyle-01-cors)
mondo (with a Persona 5 command-menu shot): "more customization options in the ui editor to allow similar stuff. more
text and font and color options ... lets make it as robust as we can with the stuff we have available." No fonts or
art downloaded.
- FONTS: 12 system stacks added after the Google ones (Impact, Arial Black, Arial Narrow, Helvetica, Futura, Trebuchet,
  Verdana, Times, Didot, Palatino, Copperplate, Lucida Console), each with fallbacks.
- TEXT (theme.text, defaults in TEXT_DEF / textOf; '' / 0 / 1 = the old look): weight + titleWeight, italic +
  titleItalic, titleSize + rowSize (zoom; rows zoom their children so the padding stays), tcase ('' / upper / cap /
  lower / none; old caps:true still reads as upper via caseOf), effect gains 'offset' (offX/offY), effectColor,
  outlineW (outline ring of 16 shadows above 1px), glowR, shadow2 + s2x/s2y (a second solid copy under the effect:
  outline + red offset = the P5 letters). Colours: titleInk, rowInk, selInk (words only; the frame keeps sel),
  firstInk. Lettering: bigFirst (::first-letter em on titles, header first child, and rows when bigRows), titlePlate
  (a colour box behind the title words), titleSlant (skewX), titleTilt (rotate). Text tab is now 5 sections.
- Title / header / row text rules use preHi() (:not(#uim-hi) x2) so they beat the body-font rule; before, a scope
  with an id (#reactHudRoot *) beat the class titles and the title font never showed in the battle HUD with a body font.
- Battle surface gained labels / selLabels (.hrlg-blabel) because the row words sit below the row's first child.
- MOTION > Tilt + slant (theme.motion): rowTilt (rotate) + rowAlt (every other row the other way: x:nth-child(even),
  or :nth-child(even) > x:only-child for the battle blade body), rowSlant (transform skewX) + rowUpright, selTilt +
  selGrow (rotate/scale on buttonSel), panelTilt. Uses the rotate/scale properties so layout translate/scale stay.
- SHAPES: Shard (a torn card, size = skew) and Jagged (a burst, size = spike depth), both whole shapes.
- PRESET "Red & Black" (p_redblack) shows them together. Checked in headless Chromium: preview, the real Horologe
  command rows, editing a preset into a copy.

## THE UI MAKER — pass 7: screen stand-ins (2026-10-16, mondo, token 20261016-standins-01-cors)
mondo: "i cant see the screen i am editing unless i am on that screen in the actual game. but i cant access the
pause/settings menu from the party builder or match select ... ideally it would just show me the screen i am editing".
- UIM_SPECIMENS (hud.js, before UIM_PREVIEW): one markup string per UIM_SURFACES id (all 15), captured from the real
  screens in headless Chromium (real classes, real labels, sample rows), stripped of scripts/handlers/inner ids
  (battle keeps its SVG defs ids renamed uims-*; results keeps #mainMenuBtn; lobby keeps #friendlyMapSelect).
- mountStage(host, surfaceId, themeFn, onPick): an iframe (1280x720, scaled by fitStage) holding a copy of every page
  stylesheet (stageSheets; the UI Maker's own sheets left out) plus #uim-stage-css = stageCss(S, T): tokens +
  surfaceCss for that ONE surface and theme, with its own skin vars. apply() refreshes every mounted stage. Lives in
  its own document, so game scripts (getElementById, _watchPhaseForHud) never see it and ids never clash.
- The battle HUD's sheet (#reactHudHideStyles) is removed outside a battle, so its text moved into _hudHideCss() and
  stageSheets adds it when missing.
- Full editor: SCREEN picker in the preview bar (Sample windows or any screen); the stand-in wears the theme being
  edited; clicking a part opens that role in Skins (stagePick, :hover parts ignored).
- Menus live view: a picked menu that is not on screen gets a full-screen stand-in behind the dock (.uim-stand,
  z 10059) in the theme it wears (liveStand); its windows feed A.rects so the dock dodges them; Space peeks.
- To refresh a specimen after a screen's markup changes: capture the real screen's outerHTML headless (strip
  handlers, ids, canvases; trim lists) and replace its string.

### UI Maker pass 8: the hero clock (2026-10-16, mondo: "add the little rotating dashed lines around the enemy turn clock icon ... to my current unit's clock+portrait ... restyle the clock ... resize how big the portrait is")
- The Horologe hub SVG now ends with circle.hrlg-halo (r105, dasharray 3 4, the turn icon's ewPpHalo 9s spin, stroke
  var(--hfc)). Default on. When the health ring shows (bars place ring/both) and Distance is left at 105 it moves to 116.
- Hub parts got classes for styling: hrlg-face / hrlg-rim / hrlg-inrim circles, hrlg-ticks, hrlg-nums (hrlg-rom
  numerals, hrlg-dia diamonds), hrlg-cap. Extra clipPaths hrlgClipSquare / hrlgClipDiamond / hrlgClipHex.
- db.hero keys (HERO_DEF): halo, haloStyle dash|dot|long|solid, haloSpeed (s, 0 = still), haloDir cw|ccw, haloGap
  96-140, haloW, haloColor; pShape circle|square|diamond|hex, pSize 0.4-1.8 (portrait group scale, x1.7 in Portrait
  face), pZoom (image inside the frame), pRing (bold inner frame); nums all|roman|dots|none, ticks, hands, rim,
  faceColor, clockColor (sets --hfc for the hub). clockCss(H, hub) writes them; CLOCK_LOOKS = the Look buttons
  (Classic, Clean, Ticks only, Numerals only, Bare).
- Dock: Layout > hero piece > "The clock", "The portrait", "Turn halo" (clockForm). data-dk heroset (key:value) and
  clocklook; colour rows use data-optc so unticked = the old look.
- Halo distance uses the CSS `scale` property (not the CSS `r` property, kept off for browser safety) with stroke-width divided back.
- The battle stand-in specimen predates this pass (no halo there); recapture it if it matters.

### UI Maker pass 9: icon rows, reserves, party portraits (2026-10-16, mondo: "let me change the vertical spacing between the turn clock icons ... Take the reserves out of the turn clock and let me place them separately ... what if i want them stacked vertical? ... i want the health bars to be underneath just like everywhere else and i dont need a panel for it")
- db.icons (ICONS_DEF, iconsOf/iconsTidy/iconsCss, part of the layout undo + "Reset the whole layout"): tcGap (px between turn
  order icons, -20..40; the sheet writes --tc-gap on .ew-turn-col, TurnColumn reads it in measure() and uses it for the gap
  and the fit maths; below 0 = negative margins via --tc-neg); dockDir row | col | colup; dockGap; dockTag none | under | panel.
- The reserves + the escaped left the turn column: TurnColumn returns a Fragment, the column plus .ew-reserves-box (absolute,
  right 12 bottom 12, scaled from its bottom-right). New UIM_PIECES row 'bench' ("Reserves"). The column's fit no longer
  reserves height for them.
- Exploration party portraits (map.js #hqDock markup untouched): iconsCss lays each .hq-dock-pp out as a grid (ring, then the
  bars under it, then the name + HP under them or beside them). Bars-mode place 'dock' now defaults to 'both' with the bars in
  the flow under the ring (position static); the lead's name + HP plate is hidden by default (dockTag none).
- Layout > Turn order / Party portraits show "The icons" (iconsForm; data-ipath sliders, data-dk iconset key:value buttons).

### UI Maker pass 10: rings, plates, scoreboard, hero bars, AP icons (2026-10-17, mondo: "let me mess with the unit selection rings ... how the directional arrow looks ... on only for the current unit ... make the horologe one look different from the turn icons ... customize stuff with the scoreboard ... customize the nameplates too and their health bars and type badges"; later "the ap icons, they are blinking a little too fast ... ideally they can slide to the left")
- db.ux (UX_DEF, uxOf/uxTidy, part of the layout undo; fields write through data-xpath / data-xset, per-group reset
  data-dk uxreset with the key prefix): r* rings, p* plates, s* scoreboard, a* AP icons. uxCss() rides the layout sheet.
- THE RING LOOK: three-renderer.js reticle shader (WebGL GLSL + the WebGPU TSL port in _ewProgsInit) reads SHARED uniform
  objects _retLookU (uRStyle line/dashed/double/none, uRSize, uRThick, uRGlow, uRPulse, uRTicks, uRAccent, uRGap, uROwn+uRCol,
  uROp, uArStyle double/single/triangle/dot/none, uArSize, uArOwn+uArCol, uSpan). hud.js ringSignal() publishes
  window._ewRingLook + bumps _ewRingLookV; _ringLookSync() (per frame in the facing loop) copies it once per change and grows
  uSpan (the mesh is scaled uSpan / RETICLE_SPAN) so a big ring or arrow never clips; _ringLookApply sets each reticle's
  visible from Show (all / mine / current = _blitzActiveUnitId || selectedUnitId / none) and its scale. Defaults = the old look.
  The ring-vitals meters take size + thickness too. Bars mode row "Selection rings" (UI.bar 'sel') opens ringDetail;
  RING_LOOKS = the one-click looks.
- Name plates: Bars mode > Name plates opens platesDetail above the bar look (size via the CSS scale property, width, name /
  level / numbers / MP / status toggles, name font/size/case/colours, type badges beside/above/below/hidden + shape + size,
  panel none/dark/theme, ally / enemy fade). CSS only, prefix :root:root:not(#uim-x):not(#uim-x).
- Scoreboard: Layout > Scoreboard (scoreForm). Classes added for it: ew-sb-strip/-mode/-scores/-num p1|p2/-dash/-line/-time/
  -rnum, ew-ent-lbl/-cap/-line/-tick/-socket/-trace, ew-tower ally|foe.
- Hero bars own look: BARS_DEF heroOwn + heroFill/heroSeg/heroH/heroTrack/heroFrame/heroFrameW/heroEdge/heroEdgeCol/heroGlow
  (Bars > Hero section bars); written after the shared rules with a higher-specificity prefix, so the turn icons keep theirs.
- AP press icons: Layout > AP press icons (apForm): Grow toward right | left (left = a box aAnchor icons wide, icons
  right-aligned so extra icons spill out to the left), size, spacing, blink time (the pend flash, default now 1s, was 0.62s),
  breathe time, spent opacity, cube + ring colours, glow.

### UI Maker pass 11: turn icons fit the space, scoreboard text layout + split bars (2026-10-17, mondo: "make it bunch up when theres a lot of icons and spread out more when there is less ... ideally it could just always expand to the top of the screen ... remove the arena mode text ... make the team names different colors, and do different settings for the entropy and tower bars ... move the round n/20 underneath the timer")

- **Turn order > Spacing = Fit the space** (db.icons tcFit 'fill', tcGapMin / tcGapMax / tcTop; iconsCss writes `--tc-fit/--tc-gmin/--tc-gmax/--tc-top` on .ew-turn-col). TurnColumn.measure reads them and measures the room ON SCREEN: the column's drawn bottom (getBoundingClientRect, so the UI Maker move + Size are included) up to tcTop px under the screen top, stopping under the AP press icons when they sit top left; divided by the column's real scale (drawn height / offsetHeight). The render spreads the gap over the room, clamped between the tightest and widest spacing; past the tightest the old "+N" fold takes over. **Icon size** tcSize (`--tc-size`, 0 = auto) fixes the icon size in both modes (auto still clamps to TC_MIN..TC_MAX).
- **Scoreboard > Text layout**: the UI Maker publishes `window._ewSbLook` (sbSignal in applyLayout, repaints with an `ew-state-change` event); Scoreboard builds its rows from it: sModeShow (sudden death still shows), sCapShow (the "SCORE" word), sTimePos line|top|off, sRoundPos line|under|top|off, sPipsPos bottom|top|off. New classes: ew-sb-cap, ew-sb-round, ew-sb-sep, ew-sb-top, ew-sb-under, ew-sb-pips; ScoreSide carries `p1` / `p2`.
- Per-team colours: sNameP1Col / sNameP2Col (replace sNameCol), sScoreP1Col / sScoreP2Col.
- The bars split: tower = sTowerH/Fill/Seg/Slant/Fade/Ticks/Label/Ally/Foe/Track/FrameCol/FrameW; entropy = sEntH/Fill/Seg/Slant/Fade/Ticks/Label/Col/Track/FrameCol/FrameW + sWave. uxMigrate (UX_SPLIT) copies a pass-10 shared key into both.

### UI Maker pass 12: the wide unit info panel, the turn icon quick menu, the zoom cone, wider action lists (2026-10-17, mondo: "the info panel should be more horizontal than vertical, with the quick actions hanging off the bottom right edge of it to make like a sideways L shape. The unit portrait should be bigger, and make like a zoom in cone thing from the turn clock icon ... The one that opens up when you click on their turn clock icon should open the quick menu instead ... extend the panel out horizontally to the right, since a lot of spell names get cut off")

- **The card**: a quick panel (`enemy|<id>` / `ally|<id>`) gets `.hrlg-panel.quick`; its header is `.hrlg-thead.qp[data-uid]` = a CSS grid (areas port / tab / qv / stats / elem): `.hrlg-qp-port` (the big portrait from _hrlgPortraitData), the name tab (its small .hrlg-tport hidden), the vitals, `_hrlgQuickStats` (stats grid `--qp-cols`, then the element box). The panel keeps the list width (`--qp-list-w`); the card is `max-content` wide (or `--qp-w`) and `align-self: flex-end`, so it hangs LEFT off the list's right end (the sideways L).
- **UI Maker**: Layout > **Unit info panel** (piece `quick`, sel `.hrlg-panel.quick > .hrlg-thead.qp`, origin bottom right: Move X/Y slides the card against its list). db.ux q* (UX_DEF): qShape wide | tall (the old column), qAlign right | left, qW, qPort (0 = the small one in the name row) + qPortShape square | round | circle, qNameSize, qStats, qStatsPos beside | below, qCols, qElem below | right | off (qpGrid builds the grid areas), qListW / qListH / qRowH / qRowFont = EVERY sub-menu list (`.hrlg-panel:not(.root)`; the cascade overlap follows half the width), qCone / qConeCol / qConeOp / qConeEdges, qKeep (Keep clear of the menu, default on), qZoom (sprite portrait zoom 1-3, default 1.5, 1 = whole body).
- **The zoom cone**: hud.js QuickCone (in ReactHUD) — while `_enemyActionTargetId` is set, a fixed SVG redrawn per rAF from the unit's turn icon (`.ew-tc-icon[data-uid]`) to the card's portrait (or its left edge); look from `window._ewQpCone` (qpSignal). Hidden in spell shots. QuickCone also runs `_qpKeepClear`: with a short action list the card would cover the root verbs / hero section, so the list gets a min-height lift (never past the top of the screen), and a card that runs off the left edge gets its marginRight cut.
- **The turn icon click**: battle.js `window._ewTurnIconQuickMenu(id)` (beside _exitModeAndShowUnitMenu): on the viewer's own controllable turn it opens that unit's quick menu (the board click's path; the same icon again closes it; the acting unit's own icon backs out to root); off-turn or for a foe the viewer can't see (`_isTileVisibleToViewer`) it returns false and TurnIcon falls back to the old info card (_tcInspect). The icon of the quick target wears `.inspecting`.

### UI Maker pass 13: the pinned card, more card layouts, column widths, cone anchors, the combat text box (2026-10-18, mondo: "the unit info panel pops up overlapping with the action menu when its a unit i cant do any quick actions on, i want it to always pop up in the same spot above the action menu ... put the hp bars and type badges beneath the portrait maybe, or use stat bars instead of letter grade, or both. Maybe i wanna put the name on top of the portrait ... no way for me to resize their individual columns ... Let me change where the zoom cone is attached or anchored to ... the subtitles or combat text box ... needs to be part of the layout too")

- **The pinned spot** (qSpot pin, the default): the card rode on its action list, so a unit with few actions dropped it onto the root menu. Now the quick list is a fixed height (`.hrlg-panel.quick > .hrlg-list { height: var(--ew-qp-room) }`): hud.js `_qpPinRoom` measures, in the panels' CSS px, max(root menu height, the hero section's top when the card hangs left) + qPinGap and writes `--ew-qp-room` on <html>. It runs every frame AND in a ResizeObserver on `.hrlg-panels` + `.hrlg-side` (the hero section changes height when a target is picked; RO runs before paint, so no one-frame jump on open). A longer list scrolls. qSpot list = the old ride-on-the-list + keep-clear (_qpKeepClear's lift only runs there). The left clamp now also stops at the turn order column (`.ew-turn-col`) when level with it.
- **Layouts**: qpGrid builds the grid from the portrait column (port, then `types` / `qv` under it) + the right side (name row, one row of side-by-side parts with their own column widths, the parts underneath). qNamePos beside | above (across the top) | on (the tab shares the port area, nowrap); qVitalsPos beside | under; qTypesPos bars | under | on | off (the card has its own `.hrlg-qp-types` node, the copy inside the vitals hides). qStatLook grade | bar | both | number: `_hrlgQuickStats` adds `.hrlg-qstat-bar` (the grade's pct + colour; ungraded stats keep an empty slot), qStatBarW, qStatGap. qColInfo / qColStats / qColElem px (0 = fit); a fixed stats column makes the cells 1fr and lets bars + labels shrink. qElemSize = zoom on the element box.
- **Cone anchors**: qConeFrom icon | centre (a point), qConeTo port | portcorner | card | corner | name (corners = a narrow tip at the top-left).
- **Combat text box**: UIM_PIECES `subtitle` = `#battleSubtitleText` (ui.js ensureBattleHUD's text box: the "is up — select an action" prompt and the combat lines), Layout > Combat text box.

### UI Maker pass 14: spacing + numbers + name colours on the unit info panel (2026-10-18, mondo: "the space between the columns of the stats only lets me change horizontal space, i need vertical spacing too. let me make the name different colors depending if its my team or the enemy team. let me change the layout and spacing between the elements, vertical and horizontal. i want to change the vertical spacing between the health and mana bars, or at least let me choose if the number go beneath it or next to it on on top of it etc.")

- db.ux: qStatRowGap (stats grid row-gap), qNameAllyCol / qNameFoeCol (the card's `.hrlg-thead.qp.ally|.enemy .hrlg-view-tab-text`; ally/enemy = the quick panel key, i.e. relative to the acting unit = the viewer's turn), qGapX / qGapY (the card grid's column-gap / row-gap between its parts), qBarGap (`.hrlg-qvitals` gap = HP ↔ MP), qBarH (the card's HP bar height, MP 80%; beats the Bars mode's global height inside the card), qNumPos right | left | above | under | on | off: anything but right turns `.hrlg-qv-row` into a small grid (areas lbl / bar / num / fc); `on` puts the number in the bar's area, centred (bars 14/12 px unless qBarH is set). Form: Name, bars + badges (numbers, HP↔MP space, thickness, the two name colours), Stats (stat rows space), Column widths + spacing (the two part gaps). The tall shape gets the same rows in its Stats + elements section.

## THE DATA PANEL + THE ITEM EDITOR (2026-10-08, thread "dev tools")

R2 files: data.js, ui.js, map.js, battle.js, hud.js, ai.js, online.js, state.js, editor.js. mondo picked tools 2 (a live data panel) and
10 (an item editor).

- **The layer:** data.js `EWDataMods` (end of the file), localStorage `ew_data_mods_v1` = `{ set: { TABLE: { 'a.b.c': value } } }`. Edits
  are written INTO the live tables (restore-all then re-apply on every change, pristine values captured before the first write). A path the
  table lacked adds a key (new items, a shop row, a drop weight). A path under an edited ancestor folds into the ancestor's stored value.
  OFF online (online.js `applyOnlineRules` → `setOnline(true)`, state.js menu states → `setOnline(false)`). `T` at the top lists the tables
  (race and spell tables stay with their editors; rooms/maps with the map editor). Export / Import / Reset / ON-OFF like the race editor.
- **The window:** ui.js "THE DATA PANEL", `window.openDataPanel(tab)` / `closeDataPanel` / `toggleDataPanel`; F9 anywhere (not while typing),
  DATA in both pause menus, Settings → Developer (Open Data Panel / Open Item Editor), the editor's 🧮 DATA button. A floating, draggable,
  resizable window (position + tab in localStorage `ew_data_panel`). TABLES = a lazy tree (numbers, words, on/off, lists of numbers or words;
  functions read-only) with search; edited rows go orange with "was" + ↺.
- **ITEMS:** every ITEM_RULES row (name, icon, ITEM_META short label, description, carry max, shop price, the behaviour's numbers, story only,
  sold at the Dispensary = HQ_DISPENSARY.stock, drop weight / rarity = HQ_DROP_RULES). + NEW ITEM copies a template: heal / mana / revive /
  elixir set `like` (data.js `ITEM_LIKE_KEYS`, `itemBase`, `itemKeysLike`); throws (baneType), stims (selfBoost) and capture doors (kind)
  were data-driven already. Every heal/mana/revive/elixir key check now reads `itemBase` (battle.js `_ewItemLike` in canUse, targeting and
  doItem; ui.js highlights + previews; hud.js item rows, target blades and the inspect potions; ai.js loops `itemKeysLike` for potions;
  data.js `hqFieldItemOk` for the field; map.js pause item checks). Scanner, panacea and warp stone stay one of a kind. Equipment is the
  GEAR passives (Spell Library), so the panel has no equipment tab.

## THE SELECTED TILE MARKER (2026-10-11, mondo)
"if i select a tile, it should have the corner markers displayed on it even when i move my mouse off of it."
three-renderer.js `_syncSelectedTileMarker` (run every frame from renderFrame and on each cursor repaint) keeps a
second yellow corner-bracket mesh (`selTileMesh`, built by the same `_buildCursorMesh` as the hover cursor) on the
tile whose quick action panel is open: `state._tileActionTarget`, or the clicked unit's tile for
`_enemyActionTargetId`, only while `actionMode` is empty and the menu view is root (exactly when hud.js shows the
quick panel). Hidden while the cursor sits on the same tile, during busy states (`_hoverCursorSuppressed`), and
kept out of rebuildHighlights' sweep. Guest-local (the target fields are guest UI keys), so online works as is.

## THE WAY OUT STAYS (2026-10-12)
mondo: an encounter "got stuck on the victory screen, the buttons to return back to the game didnt show up". Cause: a UI
Maker theme with a window-open motion (Corner Blue ships `stretch`) wrote `animation: uim-<open> … backwards !important`
on the results scope's panels (.vic-debrief, .vic-mvp-tag, .vic-bottom). Those three start at opacity 0 and rely on their
own forwards entrance (vicFadeUp / vicPanelIn) to show; the theme's animation replaced it, so after the open they fell
back to opacity 0 and BACK TO THE ROOM / WAKE UP was invisible. Fix: hud.js UI_SCOPES `results.openAt` lists each
plate's entrance time; the motion rule opens each at that time with `both` fill and rests it at opacity 1. Any future
scope whose panels start hidden for their own entrance needs an `openAt` too (or `noAnim`).

## THE TURN ORDER COLUMN + THE SCORE SIDES (2026-10-13, mondo, token 20261013-turncol-01-cors)
Ask: combine the party dock (bottom right) and the scoreboard's turn-order portraits into one clickable column on the
left above the Horologe; the Horologe's portrait is the current unit; units that already acted loop to the top; click
= the unit's stats. Tower bar as long as the entropy gauge. All in hud.js unless named.
- **TurnColumn** (replaces PartyRoster and the scoreboard's TurnChip/TurnFlank, all deleted): one `.ew-tc-plate` the
  width of `.hrlg-side` (216), same token material, header TURN ORDER + R<round>. Rows from `_scoreboardTurnData`,
  both teams, read BOTTOM-UP: bottom row acts next, already-acted units sit at the top under a "↻ ROUND n+1" hairline.
  On the viewer's turn (`_tcViewerCommands`, ActionMenu's gate) the acting unit is NOT in the column (the Horologe is
  the NOW slot) and a notch points down into the rig; on other turns the bottom row is the acting unit (bigger, NOW
  tag). Position: `bottom` in px, measured from `.hrlg-side`'s rect every render + a 160 ms poll (UI Maker moves
  included); kept while the rig blinks out for animations; else the rig's own bottom. Rows shrink 42→24px to fit,
  then the latest-acting fold into "+N". Fallen = skull strip at the top; Gauntlet reserves / escaped pills inside.
- **Row** = `PartyPortrait` ring (HP outer, MP inner; `foe` = red HP ring; no name tag any more) + name + HP/MP/Lv.
  Click = `_tcInspect` (the Horologe ⓘ toggle aimed at any unit: focusUnitPanel + toggleUnitInfo). The ⓘ card
  (`.unit-hover-hud`) now docks right of the column (hud sheet override of `left`). battle.js `previewUnitInfoRange`
  skips the reach overlay for units `_shouldCameraFollowUnit` says the viewer can't see (fog/concealment leak).
- **ScoreSide** (replaces ScoreSideColumn): per team one block `SCORE_SIDE_W` wide = name row (keys / kills at the
  outer end) → `TowerBar` (11px skewed groove, chip-damage lag fill, ticks, low-HP pulse) → `EntropyWing` (now
  width 100%). Both meters use `SCORE_TAIL_MASK` (fade only the last ~12%) so they read the same length.
- UI Maker: piece `turns` (Turn order, `.ew-turn-col`) replaces `party`; `.ew-tc-plate` joined the battle panel
  role. Tutorial step `dock` (data.js) points at `.ew-turn-col`. state.js touch-on-HUD + styles-cinematic arrival
  fade list `.ew-turn-col`.
- **Same day, mondo: "just circular icons not big old panels".** The plate, header, names and HP text are gone
  (token 20261013-turncol-02-cors): bare ring portraits (`TurnIcon`, 46→26px) stacked on the clock face's centre line
  (the column box is 216 wide, icons centred), NEXT = gold dotted halo, NOW (other turns) = 1.3× + glow, acted units
  dimmed above a ↻ mark, "+N" pip when they don't fit, tooltip for name/HP. `.ew-tc-plate` left the panel role.
- **Same day again, mondo: "put them on the edge of the screen like a normal turn clock".** Icons are left-aligned
  flush on the screen edge (left 10px, the Horologe plate's edge), not centred over the clock face (token
  20261013-turncol-03-cors).

## THE AP PRESS ICONS (2026-10-17, mondo: "move ap pips to the top left ... a cube inside a circle ... glow when you have AP, fade when it is used, and flash when you are hovering or selected on an action that would use ap ... when you get a press refund it should show 2 new ones so 4 total but those first 2 are still faded ... similar to shin megami tensei v press icons")
- hud.js `ApPress` (mounted in ReactHUD, own piece, outlives the Horologe hiding while the board animates): one bare
  cube-in-a-ring SVG per AP of the viewer's active unit, top left (`.ew-ap-press`, l 14 t 12, --ew-ui-scale). Spent
  icons fade hollow on the LEFT, live ones glow gold on the right; level-up AP green, refund icons white-hot rim.
  The Horologe's old AP row (`.hrlg-ap`) is gone; its `_hrlgSide` slot stays null so the hero part order holds.
- Icon count = max AP + `unit._apRefundIcons` (battle.js: grown by applyPressTurn's refund and by onKillRefundAp,
  reset with `_pressGainedThisTurn` at every turn reset). Synced unit fields only → guest sees the same.
- THE REAL DRAIN: battle.js `TargetQuery.apSpend(unit, kind, opts)` mirrors the commit paths (step 1 AP, second step
  all; attack / combo / Entropy Strike / finisher / Guard / damaging or Protect cast = all; support cast = apCost (+
  the step of MOVE→CAST); Clash = all). hud.js `_hrlgApSpendOf` maps a blade to it (row cost pips now show it too, so
  Attack shows 2 pips at 2 AP); `_hrlgArmedApSpend` covers armed modes / target lists. HorologeMenu publishes the
  cursor row's drain through `_apPressSetPending` ('ew-ap-pending' event); those icons flash (remounted per pending
  set so the flashes stay in step).
- Juice: deal-in per turn, spend burst + ring, refund icons spin in with a ring, staggered. Fades out with the turn
  clock during spell shots (`body.ew-spell-shot`); its animations pause there so a mid-shot refund pops in after.
- UI Maker Layout piece `press` ("AP press icons"). TurnColumn stops under the icons when it would reach them.
- Browser-checked in a VS-CPU arena: hover Move = 1 flashing, Attack = 2, move then crit attack → 4 icons, first 2 faded.

## THE PASSIVE COLOUR (2026-10-17)
mondo: "make sure that passives are a separate color than utility moves." Passive rows (kind 'passive', category
'utility') paint rose `#f28ad0` (glyph ◈) instead of the utility gold in the party builder: rack cards, loadout slots,
info panel, hover card (party-builder.js `pbColourCat`; TREE_CAT_C / PB_CAT / TREE_CAT_GLYPH `passive`). Filters and
ordering still use classifySpellLocal. The type chip rule (only on damaging spells) is in champions-combat.md.

## THE STAT CARD BUFF READ (2026-10-17)
mondo: "make sure the unit info panel has its status effect badges ... green and red numbers ... should only show like that if the
unit is currently buffed or debuffed". ui.js renderSelectedUnitPanel (#unitHoverHud, the ⓘ card):
- Before: each stat was tinted green/red whenever the effective number differed from the race's raw stat, so gear armour,
  terrain, weather, day/night sleep affinity, zodiac and kill streak all lit it, and RNG was ALWAYS green (getEffectiveRange
  adds the basic attack's +1 reach).
- Now the number stays the real effective stat, but green/red + the white base tick come only from live buffs/debuffs: status
  atk/int/armor/mdef/move/range deltas, stat stages, the celestial nexus buff (Blood Moon also folds into M ATK; Lunar Eclipse
  into DEF / M DEF on the card), a key charge's move, SPD stages crossing a move band. CRT/EVA never tint.
- The old text pills are replaced by the nameplate/Horologe badge row (hud.js _hrlgStatusChips, class hrlg-schip, one hue per
  status from _HRLG_SB_COLORS) plus a celestial-buff chip. The panel FP now also keys on statStageMods, skyBuff, hourglassBuff,
  _killStreak.
- Known combat quirk found here: getEffectiveArmor clamps gear+status armour at 0 BEFORE folding the DEF stat in, so a DEF / M DEF
  debuff (and any negative terrain/weather/5G armour mod) does nothing to a unit with no positive armour mods. The card then shows
  DEF red with an unchanged number.

## THE RACE EXCLUDES (2026-10-17, mondo: "exclude certain spells from a race's family, just a toggle")
- data.js `RACE_SPELL_EXCLUDES[race] = [spell ids]` (after RACE_FAMILIES): family members that race does not learn. The
  family keeps the row for every other race. `raceExcludedSpellIds` / `raceSpellExcluded` / `raceFamilyMemberIds`;
  `raceFamilyPoolIds` drops them, so the pool, DEFAULTS kit, AI kits, recruits, party builder and verdicts follow;
  `flRacePool` never lets Adaptable borrow one back; the codex family page skips them.
- Spell Library → POOLS → a race: every member chip has a ✓ box (click = off for this race, struck through; click again =
  back on); an "Off for this race" line lists them with ↺ chips. REVERT clears the race's families AND excludes.
- Doc registry `raceExcludes` (EWSpellMods, list registry like raceFamilies; empty list = null), export summary line
  `RACE EXCLUDES <race>: [...]`, baked by bake-spell-mods.js into `const RACE_SPELL_EXCLUDES = {`.

### UI Maker pass 15: three fixes (2026-10-18, mondo: "increasing the glow settings on the button makes the entire button bigger"; "the height button for actions list for the unit info panel does nothing ... need it to change where the top button is"; "i still cannot change the spacing between the element icons ... the element box column does nothing")
- Skins, whole shapes (hex / diamond / circle / shard / jagged): bakeSkin's border-image cut the image at 50%, so the glow / shadow margin stretched along with the shape and a bigger glow drew a bigger shape. Now the margin is its own slice ring (`O` px) sitting in the outset; only the shape stretches to the box.
- Unit info panel > Action lists > Height: the quick list was pinned to the measured room (`--ew-qp-room`), which beat qListH. qListH now sets the quick list's real height (min 60), so its top button and the card above it move; other lists keep it as their scroll cap.
- Element box: new db.ux qElemGapX (column-gap between icons), qElemGapY (row-gap between the icon and symbol rows), qElemIcon (icon px; cells = icon + 5), qElemSpread (the box stretches across its grid area, 8 equal columns). qColElem ("Element box width") now sets the box width wherever it sits (it only sized a grid column that exists when the box is on the right) and spreads the icons over it.
- Browser check: every q* setting in a VS-CPU Training Room battle changes the card on screen (qNameFoeCol needs an enemy card).

### UI Maker pass 16: Layout on every screen (2026-10-18, mondo: "i want to be able to do that with any screen/menu. like the match select ... how it's arranged or what text shows up in the panels or what the panels look like and color ... make it like obs where you can snap panels into place and above and below other panels")
- Pieces per screen: rows (the `[surf, id, label, sel]` list after UIM_PIECES) pushed onto UIM_PIECES with `surf` = a UIM_SURFACES id (match, forge, menu, squad, settings, shell, lobby, dialog, loading, results, pause, battlePop, editor). `groupOf(P)` = surf, else battle / explore. `allPieces()` = UIM_PIECES + picks; `pieceById`.
- Layout dock: Screen picker (Auto = `autoGroup()`: HUD first, then AUTO_ORDER via `surfUp`, which also needs a hit-test on top so the party builder under the menus doesn't count). A screen that isn't up mounts its UIM_SPECIMENS stand-in (`liveStand`, layout mode too); `pieceVis` boxes pieces on it (st.k scale; drags divide by k). `uim-arranging` (pause menus hide) only for HUD groups. F4 anywhere toggles the Layout view (Auto); F4 again goes back where it came from.
- Snap to pieces (UI.snapTo): `snapLines` = edges + middles of the screen / stand-in and every other live piece of the screen (its own children skipped), `snapAxis` 7px, cyan `.uim-guide` lines. Corner handle `.uim-rs` on the selected box = `sizeDrag` (sets L.w / L.h).
- Per-piece look (LOOK_DEF keys on db.layout[id], `lookCss`, `preP` specificity): Size + order (w, h, pad, z (+zrel only for static boxes), ord), Panel look (skin = a theme role via `pieceSkinCss` in apply(), skinT theme, bg/bg2 gradient, edge/edgeW, rad, shad, glow/glowC), Text look (ink, font, fw, fsz, tcase, track, tfx, align). Forms: `lookForm` with `lp()` (data-lpath / data-lset).
- Words: db.words[piece id] = { game text: shown text ('' hidden) }; `wordsApply` swaps text nodes in place (MutationObserver re-swaps, original restored when the entry goes); `wordsForm` lists `pieceWordsNow(el)`.
- Pick a part (db.picks [{id, surf, label, sel, selAll, all}]): `pickMode` catcher + `elementsFromPoint` (html.uim-picking forces pointer-events; the stand-in iframe too), wheel = the part around it, `pickSels` builds nth-child + every-one-like-it selectors (state classes skipped). Detail: name, Every one like it, ⬑ The part around it, Remove.
- Stand-ins wear the layout (`stageLay`: layoutCss + pieceSkinCss + wordsApply in the iframe). Undo covers words + picks. Reset this screen / Reset the whole layout.
- Browser check: real squad desk (pick, words, look, snap under the title bar), match select stand-in (drag, words, pick) then the real match select shows the same edits.

### UI Maker pass 17: the unit info card's parts, free (2026-10-18, mondo: "just make the actions list its own separate thing. let me change the panel background of the portrait and the elements and let me have the option to add one to the stats. let me rearrange the stats ... i need to be able to move these individual elements freely on the panel or come up with something better than a bunch of checkboxes")
- **The action list is its own piece.** The card (`.hrlg-thead.qp`) is `position: absolute` off the quick panel's right edge (bottom = `--ew-qp-room`), so the "Unit info panel" piece moves the card only; the new UIM_PIECES row `qlist` ("Quick action list", sel `.hrlg-panel.quick > .hrlg-list`) moves / sizes / looks the list alone. layoutCss gives the panel's BACK chip the same translate as `qlist`.
- **Free parts** (db.ux `qArr: 'free'`, wide shape only): the card is a `qFreeW × qFreeH` box and every part (port, tab, types, hp, mp, stats, elem; or each stat with `qStatEach`) is absolute at `db.ux.qParts[id] = {x, y, w, h}` (card px). `qpFreeCss` writes it at the end of uxCss. In the Layout view with the Unit info panel piece picked, `qpBoxes` draws a green box per part: drag moves, the corner sizes, snaps to the card's edges/centre and the other parts (Alt or Snap off = free), arrows nudge, undo works. The first drag of a card placed by settings runs `qpFreeze` (measures every part as it stands, nothing jumps) and flips to free; a part dragged past the right/bottom edge grows the card (`qpGrow`). "Placed by settings" goes back to the old grid rows (kept, hidden while free).
- **Backgrounds per part** (free or grid): qParts[id].look (`panel` window / `well` inset / `clear` none) + bg / edge / edgeW / rad / pad, or hide. The portrait takes background-color only (its image stays).
- **Stats**: Stat order section: show checkbox + ▲▼ per stat (`qStatOrder` / `qStatHide`, CSS order). With each stat on its own, ▲▼ swaps the two stats' spots. Stat rows carry `data-qs` (atk, matk, def, mdef, mov, rng, vis, crt, eva).
- **Combat text box steps aside** (mondo: "slide to right to avoid the action menu secondary menus, and slide back whenever it can"): hud.js `_subDodge`, run from QuickCone's rAF. Each frame it checks the text box's home spot (the bar's live transform undone via DOMMatrix m41, so a mid-ease frame doesn't move home) against the children of every `.hrlg-panels > .hrlg-panel:not(.root)` (not the unit info card), slides `#battleSubtitleBar` right until clear (never past the right edge), 0 when nothing's in the way; eased by a transform transition. Off while `html.uim-arranging`.

### UI Maker pass 18: the unit info card fixes + every text its own (2026-10-18, mondo: "taking away the background of the portrait ... makes the whole portrait go away ... there is still a dark panel behind it" / "right of the bar puts the hp and mp numbers under the bar" / "changing the height of the quick actions list moves the height of the unit info panel too" / "anywhere with text should be editable" / "clicking on a turn order icon still brings up the old unit info panel")
- **Layers.** The card's panel is its own child `.hrlg-qp-bg` (classed `.hrlg-thead`, so the header blade's look + theme skins land on it; the card itself is forced bare by a 4-id rule). The sprite is its own `.hrlg-qp-img` inside `.hrlg-qp-port` (was the port's inline background, which `clear` wiped). QP_PARTS gained `panel` ("Card panel": size / move / look / hide it alone; `qpPanelSpot` cuts it at the portrait's right edge when the portrait's background is None). Placed by settings, None on the portrait starts `.hrlg-qp-bg` at the portrait column. The Unit info panel piece's own Panel look (lookCss) goes on `panelSel` (= `.hrlg-qp-bg`).
- **HP/MP numbers.** Every qNumPos (right included) makes the row a grid ("lbl bar num fc" etc.), label column `max-content`, bar `minmax(36px, 1fr)`; with the bars under the portrait and numbers beside them the portrait column widens to fit (`minmax(port, max-content)`). Grid-only settings are gated off in free parts.
- **Card and list apart, both ways.** The card's right end sits where a default 316px list ends (`right: calc(100% - 316px)`), never the list's width; `qSpot`/`qKeep` (ride on the list, list lift) are gone; uxMigrate (`db.qpAnchored`) moves a card saved beside a wider list by the difference once. The quick panel is the pinned room tall (`height: --ew-qp-menu`) and its list hangs from the top, right under the card (the L), shrinking to fit; qListH / qlist h only move its bottom end. Measured in a battle: 17 list/card settings each leave the other's box unchanged.
- **One spot.** `_qpPinRoom` keeps the tallest room met this battle (the hero is 83px taller at the root menu with its tool rows): reset on a new `state.units` / viewport; a UI Maker apply (`window._ewUimGen`) re-measures but keeps the old room as a floor until the root menu is up.
- **Turn icon peek.** TurnIcon → `_ewTurnIconQuickMenu` (quick menu, unchanged) else `_tcPeek` (the old `_tcInspect` / INFO card path is gone): `QuickPeek` draws `_hrlgQuickCard` (the card builder, shared with HorologeMenu) inside a stand-in `.hrlg-rig.hrlg-peek` (ghost side + ghost root, invisible, no clicks) so the card lands in the quick card's spot with every UI Maker setting. No camera move, no list, no distance (a fog foe gives nothing away). Viewer-local module var `_tcPeekId` (not on state, nothing to sync). Same icon / ESC / right-click closes (window capture listener bound once, so no pause menu); a quick menu opening replaces it; QuickCone draws the cone to it.
- **Every text its own.** `TEXT_PARTS[piece id]` = [part, label, selector inside the piece] for quick, hero, cmds, qlist, score, meta, turns, desc, subtitle, banner. Text look → "Which text" (All text / a part); a part's keys sit on db.layout[id] as `t:<part>:<key>` (TX_KEYS: ink font fw fsz tcase track tfx align hide), `textPartsCss` writes them at preP specificity (beats the q*/s* HI rules), tidyLayout keeps them. Name plates gained `pLvlSize`, `pNumSize`, `pNumCol` (Level + numbers).

### UI Maker pass 19: Portraits, faces zoomed from the sprites (2026-10-18, mondo: "for units that dont have a portrait and just a sprite, add a section in the ui maker that makes a portrait from their sprite by zooming in on their face. let me be able to readjust them and choose whether to use their portrait or their zoomed in sprite if they have both")
- **One hook.** sprites.js `getUnitPortraitUrl` = `getUnitPortraitArtUrl` (the RACE_PORTRAITS lookup, renamed) then asks hud.js `window.EWFaces.url(unit, art)`: undefined keeps the art, null = no portrait (the caller's whole-sprite fallback), a string = the face. Every caller already treats a portrait as a square face (cover), so turn icons, the unit info card, the Horologe clock, name plates, the INFO card, lists, exploration party/squad faces, the party builder rail + roster tiles and the debrief all wear it with no change of their own.
- **The face.** A square cut from the unit's own map sprite (`getBattleMapSpriteUrl` for a field unit, so a job sheet / form / werewolf day; `getR2RaceSpriteUrl` for a bare `{race, gender}`), loaded once with `crossOrigin` (the bucket answers CORS for the game's origin; a sprite that throws on getImageData keeps the whole sprite), drawn nearest-neighbour onto a 192px canvas, handed out as a PNG data URL, cached per sprite + aim. Async: until the sprite is in, the caller gets the art / null; then `faceBump` bumps `window._ewFaceGen` (the PartyPortrait + UnitSprite memos key on it), fires `ew-state-change` and `faceSweep` repaints markup portraits tagged `data-ew-face="<unit id>"` (+ `data-ew-face-sc` = the sprite class to drop): three-renderer `_platePortraitHtml`, ui.js `renderUnitPortrait`.
- **Auto aim** (`faceAim`, from the alpha): figure bbox; side = 0.34 × figure height for a tall figure, up to 0.8 for a squat one (height / the median row's opaque count, 1.8 → 1.2); centred on the head rows' pixels within ±0.45 side of the whole figure's centroid (wings / staffs / capes to one side don't pull it); top at 0.08 side above the figure; widened ×1.2 (≤8 times) while under 30% filled. Checked on all 102 sprites without art: ~90 land on the face; misses (occulus, watcher, gnome hat, mothman, starfish, kraken, dreameater, voidweaver, seraphim m) are what the aiming is for.
- **Store** db.faces = { off: true (units without art keep the whole sprite), u: { 'race|gender': { use: 'art' | 'face' | 'sprite', x, y, s } } }: x / y = the square's middle as parts of the sprite's width / height, s = its side as a part of the height; no s = auto aim; `use` only when it is not the default (art if the race has art, else face unless off). In the undo state (layState). Viewer-local like the rest of the UI Maker, nothing relayed.
- **The panel** = a 4th live mode `faces` (tab "Portraits ⧉", dock button Portraits, `UIMaker.live('faces')`): yellow boxes on every portrait on screen (turn icons, the card portrait, the Horologe hub, far plates; click picks that unit), "No art" switch, On the field rows (face thumb + use tag), Any unit (every RACE_PROFILES race × gender), then the unit: Portrait / Zoomed sprite / Whole sprite (· = default, Portrait only with art), the aiming view (232px canvas, the sprite with the square: drag inside to move, click outside to jump there, drag the corner to size, wheel to zoom), Zoom / Left-right / Up-down sliders, Auto aim, Turn icon + Unit info previews; Reset every portrait. `faceDockRefresh` redraws the open unit when its sprite comes in (`[data-fwait]`).

### UI Maker pass 20: card parts past the edge, the Back button, shaped part skins, stat sizes, status + buffs, the grown row (2026-10-18, mondo: "they are bound by the borders of the panel and they get cropped when they go past it ... let me move the red back button in the actions list around and resize it ... for the backgrounds i need the same panel options as the main ui editor that has the different shapes ... i can hardly read the ATK and DEF etc" / "the selected button grows bigger, but its making it clip out of the bounding box of the actions list" / "the unit info panel needs to have the unit's status effect badges and debuffs/buffs as sections too ... show and hide the number just like the letter grades and bars")
- **The cut was the piece height.** `lookCss` gave any piece with a Height `overflow: auto` (3-id preP rule), which beat the free card's `overflow: visible` (HI, 2 ids): a sized card scrolled and cut every part placed past its edge. Pieces flagged `qp` (the card) or `noScroll` keep their overflow now.
- **Back button piece** (UIM_PIECES `qback`, sel `.hrlg-panel:not(.root) > .hrlg-backchip`, every sub-menu's BACK chip): move / scale / size / look like any piece; TEXT_PARTS qback (word, arrow). On the quick list it still rides with the list: layoutCss writes the quick chip's translate as qlist + qback. `flowH: 24` = a sized chip grows upward (margin-top 24 − h) so the list under it never moves. The chip centres its insides.
- **Part skins.** db.ux.qParts[id].sk = only the changed keys of a skin spec; `qpSkinOf` fills the rest from `blankSkin(battle theme colours, 'panel')`. The dock part detail has "Shape + skin" = `skinForm(null, 'panel', true, { skin, path: 'sk' })` (the main editor's form: 13 shapes, fill kinds, texture, frame, light + shadow, retro, 9-slice; no theme buttons) rewritten by `qpx` to `data-qppath="<id>.sk.…"`. `qpSet` takes nested keys (setPath) and calls scheduleApply. `qpSkinCss` (in apply(), the theme sheet, 5-id prefix `#qp-k`) bakes it with bakeSkin → border-image (skinVar), border 0 solid transparent, background none. A skinned portrait: overflow visible, no inner shading, and the sprite clipped to whole shapes (`qpShapeClip`: ellipse, diamond, hex by the portrait size, shard, bevel, notch, rounded inset).
- **Status effects + buffs / debuffs** = two card parts (`status`, `buffs`, inside `.hrlg-qvitals` as `.hrlg-qp-status` / `.hrlg-qp-buffs`, from `_hrlgStatusChips`: st-* + flow state / stg-* + KEY + MOV). Always rendered (empty when nothing), hidden when empty; free mode draws their box at their spot anyway (qpBoxes) and a card made free earlier puts them under its MP bar (`qpUnderMp`). Each card stat with a live stage (`_hrlgStageOf`, MOV via `_hrlgMovDelta`) gets `.hrlg-qstat-stg` ▲n / ▼n beside its number; its chip carries `data-st` and hides in the part. `qBuffAt` stat (default) / part / both; a hidden stat or no stats sends its chips to the part.
- **Stat sizes**: qStatLblSize (9, the label's 34 px slot scales as min-width, nowrap), qStatNumSize (12), qGradeSize (16: `--gsz` on `.ew-grade.sm` + the letter at 0.56), qChipSize (9, status + buff badges + stat marks). "Each stat shows" = Letter grade / Bar / Number checkboxes (grade + bar still stored as qStatLook grade | bar | both | number, numbers = qStatNum).
- **The grown row** (`_listRoom`, in QuickCone's rAF next to `_subDodge`): the theme's MOTION numbers are published on the surface root (`--uim-sel-grow`, `--uim-sel-tilt`, `--uim-row-tilt`, `--uim-row-slant`). A list whose rows fit (measured from layout boxes, so transforms never count) gets `.ew-fits` (overflow visible, 4-id rule over any piece height); a list that scrolls gets `.ew-room` with `--ew-room-x / -t / -b` margins so the grown, tilted, slanted row lands inside its box. Nothing grows = no class.
- **Parts that fit what they hold** (qpFreeCss): free `status` / `buffs` take their set height as min-height (height auto, so a long badge row grows down); `stats` and each `st-*` take `width: max-content` with the set size as minimum (big names / numbers / grades widen the stats, never overlap the next one). `qpLiveSpot` measures the real size, so Fit the card to its parts and a drag past the edge (`qpGrow`) count it. Part boxes stack smallest on top (z by size), so a badge row over the element box still takes the mouse.
- Browser check (arena, real clicks in the Layout dock): Back button dragged + corner-sized (list stays put); card Height 296 + the name dragged above the card shows in full; Hex on the name, Circle on the portrait (sprite clipped), Shard on the status row; stat sizes 15 / 18 / 26 with numbers off, bars on; buffs In their own part; grow 1.3 row stands out of the quick list, and with the list at 110 px it stays inside the scrolling box. Buffs part dragged under the stats (after landing under MP + status by itself); Beside their stat shows ▲1 / ▼2 / ▼1 next to M ATK / DEF / M DEF with the part empty; 15 / 18 / 26 sizes with numbers on: no stat overlaps, Fit widened the card to 828.
- **Shortest + Tallest for the quick action list** (mondo: "never go below a certain height and never go past a certain height"): db.ux qListMin / qListMax (0 = none), in Action lists and in the Quick action list piece's dock ("Fit its rows", `qlistFit`). Either set = a 4-id rule (`#ew-lh`) gives the quick list height auto, min-height min(min, 100%), max-height min(max, 100%), so it fits its rows between them over qListH and the piece's own Height. It still hangs from right under the card (the card never moves) and stays inside the room (100% of the quick panel = down to the bottom of the command menu). Checked: piece Height 300 = 3 rows stood 305 tall (his report); Shortest 200 / Tallest 240 = 3 and 4 rows 203, 5 rows 244 and scrolling; Shortest 120 = 155 / 198 / 244; the card at the same spot every time.

### UI Maker pass 21: Arrows + tiles, the preview arrows and the tile highlights (2026-10-18, mondo: "i dont really like how the arrows look for spell/move previews. they look too simple or childish. add a section for them and the tile highlights to the ui maker" — thickness (too thick now), brightness, pulse, colour, the travelling dots' look + speed, a colour per action; tiles: outline, fill, brightness, colours per situation; "can you show them on screen as im changing them")
- **Where**: UI Maker tab "Arrows + tiles ⧉" and the live dock's "Arrows" button (`liveOn('aim')`, LIVE_MODES). The dock carries a small live board (`ThreeRenderer.lookPreview(canvas)`: its own WebGLRenderer, 7×4 tiles, every situation's tile + the walk / strike / heal / shove arrows + the gold cast glow), sticky at the top of the dock so it stays in view while scrolling; the legend chips under it show the current colours. The game stays clickable behind the dock, so the real arrows and tiles change too.
- **db.ux keys**: arrows `wShaft` solid|dashed|none, `wThick`, `wHead` cone|none, `wHeadLen`, `wHeadW`, `wOpacity`, `wBright`, `wGlow`, `wGlowW`, `wCore` (white-hot line inside), `wPulse`, `wPulseSpd`, `wDots`, `wDotShape` ball|diamond|streak|ring, `wDotSize`, `wDotCount`, `wDotSpd`, `wDotBright`, `wDotCol`; `wc<Kind>` per action (AIM_ARROW_KINDS move / hit / heal / force / util). Tiles `tLine` (outline width, 0 = none), `tEdge`, `tHalo`, `tHot`, `tLineCol`, `tFill`, `tBright`, `tOpacity`, `tPulse`, `tSpeed`, `tSize` (gap between tiles), `tRound`; `tc<Kind>` per situation (AIM_TILE_KINDS: moving, attacks + spells, other, the spell glow). Every number is on top of the game's own look (1 = as the game). Looks: ARROW_LOOKS game / fine / laser / dashed / comet, TILE_LOOKS game / clean / neon / soft / bold (a look resets that side's shape + light keys, colours stay).
- **The hand-off**: hud.js `aimSignal()` (from applyLayout) publishes `window._ewArrowLook` / `_ewTileLook` and bumps `_ewArrowLookV` / `_ewTileLookV` only on a change.
- **Tiles** (three-renderer.js): `_hlFragmentShader` + its TSL twin read shared look uniforms (`_hlLookU`, uLk*; a cloned subfloor material re-shares them, `_hlShareLook`); the defaults reproduce the old frame exactly. Each material records `userData.ewHl = { src, kind }`; the kind comes from the hl type (`_hlKindOfType`), the overlay name (`_HL_OVERLAY_KIND`, weather = none) or the colour (`_HL_HEX_KIND`); `_hlLookSync()` (each frame, once per version) writes the uniforms and repaints every cached material + the scene (`_hlPaint`). The cast glow (`_glowMakeMat`) takes glowFoe / glowFriend through `_ew_glowBase`.
- **Arrows**: `_buildArrowFromPoints` reads `_arrowLook()` (shaft, glow tube, hot core, head, dots, kind colour from `_ARROW_HEX_KIND`); `_arrowTick` runs pulse + dot speed + dot shapes; every board build is recorded (`_arrowBuilds`) and rebuilt on a version change, so a held hover redraws at once. The takeover hide (THE GAME HAS THE BOARD) still runs after them each frame.

### THE STRIKE ARROW: the red arrow in the Attack target menu (2026-10-18, mondo: "when i have attack selected and im hovering or selected on an enemy, i need to see the red attack preview arrow, im in the target menu from the attack button and i dont see arrows at all")
- **Cause**: the only red arrow was the approach preview (`_attackApproachHoverPreview` → `_drawSpellApproachPreview`: blue walk + red strike), drawn only for a target OUT of reach. A target already in reach went through `updateAoePreview`'s non-spell branch, which cleared every arrow and returned; opening the menu on the default pick drew nothing; the target rows had no hover hook.
- **Now** (ui.js `_drawAttackAimArrow` + `window._ewAttackAimArrow`): `updateAoePreview` in attack mode draws a red arc (0xff3333, arc 0.35, flowing dots, unit torso → target torso via `unitSurfaceY`) onto the hovered/picked tile. battle.js `setTool('attack')` calls `updateAoePreview` on the default pick so the arrow is there the moment the menu opens. hud.js `_hrlgTargetBlades` gives attack rows `hoverIn` (arrow onto that row's target) / `hoverOut` (arrow back onto `state.pendingTarget`). Confirm still clears it (`clearAoePreview`), and the PR #302 takeover hide still hides it while the attack plays out. Viewer-local like every preview (no relay). It takes the UI Maker arrow look like every board arrow.
- Checked in a real VS-CPU arena with real clicks: opening the menu, hovering each row, hovering an enemy on the board, picking a row and Confirm (the hit landed, the arrow cleared, no errors).

### THE STRIKE ARROWS: one arrow per body a spell hits + the ricochet hop (2026-10-18, mondo: "also an arrow should show for a ricochet , like from the target to the nearby enemy. and for an aoe or multi target spell i wanna see multiple damage arrows from the caster to the enemies that change with where i am hovering the spell over.")
- battle.js forecastSpellPlan's `hit()` marks `h.direct` on a body the cast itself reaches: an untagged hit or one tagged `random` / `return` / `shockwave` / `delayed` (`_FC_DIRECT_TAGS`). Hops off a victim (bounce, chain hop, fork, split, splash) and knock-ons (collision, pinned, intercepts, afterShot) are not direct.
- ui.js `drawForecastStrikes(plan, caster, fromX, fromY, fromPx)`: an arced crimson arrow (EW_PREVIEW.hit → UI Maker kind 'hit', arc 0.35) from the cast tile onto every direct body; returns the count. The hop arrows stay `drawForecastChain`'s (victim → bounce target).
- Wired into: the armed spell's board aim (`updateIntentPreview`, so it follows the hovered tile), the quick menu row hover (hud.js `_showMoveArrowPreview`: the single aim arrow is drawn only when the forecast hits nobody, e.g. heals / utility / basic attack), the board move-then-cast preview (battle.js `_drawSpellApproachShove` now also draws the strikes + hops from the cast tile, overlay `spellApproachChain`), and the spell target list rows (hud.js `hoverIn` → ui.js `window._ewSpellAimHover`, rows in reach only; leaving goes back to the pick).

### THE SHOT RECORDER, ROUND 2: his framing applied (2026-10-18, token 20261018-shotframe-01-cors)
mondo exported 11 shots (EW_CAMERA_SHOTS_20261018-055717.json): "keeping the caster in the middle except nudged to the
right a little bit because the action menu with the spell list open takes up like half the screen. the target in the top
right of the 3x3 camera grid, but closer to the point in the bottom left of that corner. there should be a little bit of
space between the caster and the target, not overlapping. obviously zoomed in way more. the last one is for when its first
one of my units turns or the top of the action menu with no actions selected. let me drag the shots panel".
- **Averages of his pair shots** (look-up shots and the turn shot left out): caster chest at screen (0.50, 0.39), target
  chest (0.68, 0.30), eye 1.64 tiles from the caster chest, behind-right at about shoulder height (often on the floor clamp).
- **battle.js THE MENU CAMERA, rewritten** (old _menuCamSolve / _menuPoseOf / MENU_CAM_SWING gone): `MENU_CASTER_AT`
  [0.53, 0.40], `MENU_TARGET_AT` [0.68, 0.30], `MENU_EYE_DIST` 1.65 tiles (scaled up to 1.6x for big bodies),
  `MENU_EYE_FLOOR` 0.4 tiles. `_menuShotPose` grid-searches the eye on a sphere round the caster chest (azimuth round
  behind the line, elevation -30..60°), `_menuAim` solves yaw/tilt in closed form so the TARGET chest lands exactly on
  MENU_TARGET_AT, and the cost scores the caster's screen error, terrain occlusion, other bodies in the way and side
  changes. `_menuPoseFromEye` turns eye + aim into the rig's {x,y,elevZ,zoom,tilt,yaw}.
- **The turn shot** (his last shot): `_menuUnitPose` / `_menuUnitShot` — eye `MENU_UNIT_EYE` 1.85 tiles ahead, 0.65 to the
  side of the unit's facing, low, chest at `MENU_UNIT_AT` [0.50, 0.58]; swings 25/50° or flips side when a body blocks.
  Used on a local hand-played unit's turn start (`_tpsUnitShot`), back to the root of the action menu (`_tpsTurnShot`) and
  menu home (`_ewMenuCamHome` when no action is selected).
- **Exact orbit** (three-camera.js sync): while `cam._menuShot` (or `_menuExactUntil`, set when leaving a menu shot and in
  `_captureCineReturnView`) the sky crane, head turn and subject look are off, so the eye sits where the solver put it.
- `_menuAttackTrackLeap` now translates the hold pose by the landing offset instead of re-solving.
- **The SHOTS panel drags** by its header; position saved in localStorage `ew_shot_rec_v1:pos`, clamped to the window.
- Checked in a real VS-CPU arena (headless, 7 s settle per shot): pairs landed caster ≈ (0.53, 0.35-0.44), target ≈
  (0.66-0.73, 0.26-0.35); the turn shot caster ≈ (0.50, 0.58); the panel drag moved and was restored.

### ROUND 2 UNDONE (2026-10-18, token 20261018-shotundo-01-cors)
mondo: "lets go ahead and undo those shots, they didnt turn out the way i wanted". battle.js is back to its pre-#311 state
(the old MENU CAMERA: _menuCamSolve / _menuPoseOf / MENU_CAM_SWING, no turn shot) and the three-camera.js exact orbit is
gone. Kept: the shot recorder and the draggable SHOTS panel. The Round 2 section above is history only.
### THE COMBAT TEXT COLOURS: names by side, damage red, heals green, spells + statuses in caps (2026-10-18, mondo: "there is a green heart emoji for hp which is confusing ... the damage number should always be in red, if its a heal the number should be in green ... Enemy names should ALWAYS be red ... ally name's ... blue (OBVIOUSLY). Status effects need to be capitalized ... spell names need to be made capital ... Easy to tell what is happening at a glance with color coding and caps")
- **Cause**: the log's `decorateTextWithIcons` put the Heal badge (💚) on every "HP", so "takes 45 HP damage" wore a green heart; "Player N" was only coloured before a few words ("turn", "wins"), so "Player 1's team attack is READY" stayed white; dialogue lines (`showBattleDialogue`) never went through the colouring at all, and their whole-line classes painted names too (the defeat line was one colour, name included); names were matched by text, so a mirror match (both sides "Grey") coloured both the same.
- **Now** (battle.js "THE COMBAT TEXT COLOURS", `_ctDecorate`): one formatter for the combat log AND the combat text box (log beats, dialogue lines, prompts — `_renderDialogueBox`). Unit names: your side blue (`.ct-ally`), the other red (`.ct-enemy`), "Player N" too; spell names gold CAPS (`.ct-spell`); status effects CAPS in their badge's colour (the stroke of the STATUS_DEFS icon, `--ct-c`) with the badge in front (`.ct-status`); damage numbers red (`.ct-dmg`), heal numbers green (`.ct-heal`); KO words caps (`.ct-ko`: RETURNED TO THE VOID, IS DEFEATED …). No HP badge. Hotseat keeps P1 blue / P2 red; online each screen colours its own side blue.
- **The tags**: the writer marks names and spells at the source — `_ctName(unit)` (private-use marks U+E001-E009 = player, U+E00A no player, U+E000 end) and `_ctSp(name)` (U+E00B … U+E000). Every `addLog` / dialogue line in battle.js, map.js and ui.js uses them (a mechanical pass swapped `unitDisplayName(` → `_ctName(` and `${spell.name}` / `${x.spellName}` / `${combo.name}` → `${_ctSp(…)}` on those lines). An untagged name falls back to a name match (a name both sides wear: the unit on turn first, the other side after); multi-word spell names from SPELL_BY_ID / RACE_ABILITY_BY_ID / COMBO_REGISTRY are matched too (one-word names only when tagged — "Heal", "Fear" are plain words). The match export strips the marks (`_ctPlain`). **New log lines: write names as `${_ctName(u)}` and spells as `${_ctSp(spell.name)}`.**
- Whole-line `dlg-damage` / `dlg-heal` / `dlg-status` colours in the box are now the box's ink (`color: inherit`, styles-hud.css): the coded words carry the meaning.
- **UI Maker**: the Combat text box piece is `keepCodes` — its All text colour paints the plain words only (`:not(.ct)`), and its Text tab has new parts: Ally names, Enemy names, Spell names, Status effects, Damage numbers, Heal numbers, Knock-out words.
- Checked in a real VS-CPU TDM battle (real `applyDamageToUnit`, `applyStatusPayload`, `addEntropy`, a real kill and the defeat line, a Grey-vs-Grey mirror, the turn prompt), with and without a UI Maker ink on the box.

## ENDS TURN (2026-10-18, mondo: "instead of damaging spells costing 2 ap, they really cost 1 ap and end your turn ... any damaging spell and the basic attack should have a text that says ENDS TURN on its button somewhere, clearly distinguishable from spells that dont end your turn")
- **Before**: row cost pips and the AP press icons showed the whole-pool drain (`TargetQuery.apSpend`), so a damaging spell read 2 AP before a move and 1 after, and hovering a "1 AP" spell flashed 2 icons.
- **Now** (battle.js `TargetQuery.apUse(unit, kind, opts)` → `{ n, ends }`, plus `TargetQuery.spellEndsTurn`): n = what the action costs (1 for an attack / damaging cast, 2 for a combo), ends = it ends the turn (attack, combo, Guard, Escape, structure attack, damaging / Protect casts, Entropy Strike + Finisher rows, the turn's last step; every paid act in Clash). The engine drain is unchanged (`apSpend` / `spendAllAP`), so the press refund still hands AP back.
- hud.js `_hrlgApUseOf` / `_hrlgArmedApUse` feed `b.apUse`; HorologeBlade draws n pips and a red `.hrlg-endsturn` tag after them (root verbs: under the name, where grey-out reasons go). Rows can force it with `endsTurn: true`. The description bar's cost line adds "· ENDS TURN".
- AP press icons (ApPress): an ending action flashes only its cost; the AP left behind gets `.lost` (dark, red slash, no blink) and `.ew-ap-ends` "ENDS TURN" sits under the icons (over them when the icons are in the lower half of the screen).
- **UI Maker**: AP press icons > ENDS TURN words > Where (Auto / Under / Over / Right / Left / Hidden, `ux.aEnds`); text parts "ENDS TURN words" (press piece) and "ENDS TURN tags" (every action list).
- Checked headless in a VS-CPU TDM battle (enemies placed adjacent): Attack / Combo / Guard tags, Elbow Grease tag vs support spells without one, the 1-flash + 1-lost icons, the Where = Right setting clicked in the UI Maker.

### THE COMBAT LOG: the whole match on the right, fading to the top (2026-10-18, mondo: "lets add a collapsaible combat log on the right side of the screen of course editable with the ui maker. it should be easy to read and track damage and health changes, basically the same stuff in the combat text panel but i can scroll all the way up to the start of the match. make it fade towards the top. allow me to adjust the size and everything. one button collapse, auto hide during spell animations/camera movements and any other time it is not necessary")
- **Where** (ui.js `renderFloatCombatLog`, was an empty stub; it already ran on every log / HUD render): `#ewCombatLog` in `#mapRow`, right 12 px, bottom 120 px, 340 × 340. Lines = `state.logEntries` through the combat text box's own filters (`_logVisible` fog + `_isDialogueWorthy`), plus the box's beats that are not log lines (`state.logDialogue`, battle.js `_clogKeepBeats`, written in `_realShowBattleDialogue_impl`: round-end heals, Free action!, FLOW STATE …; a beat whose words are ≥ 70 % in one of the last 40 log lines is the same news and is left out). Each line goes through `formatCombatLogLine` / `_ctDecorate`, so names by side, damage red, heals green, spells + statuses in caps read exactly like the box. Incremental: only new entries are formatted and appended; a reset log / another viewer / another filter rebuilds. DOM capped at 3000 lines.
- **HP after a hit**: `addLog(msg, vis, hp)` — an entry with `hp` becomes `{ m, h: [hp, maxHp] }` (numbers only). applyDamageToUnit passes it on its "takes N HP damage" line; applyHealingToUnit notes the healed unit (`_clogNoteHp`) and the heal line written within 1.5 s that names it (tagged or plain) takes it (`_clogHealHp`, log lines and box beats). Drawn as a small bar (green > 50 %, amber > 25 %, red) + `hp/max`.
- **Fade + scroll**: a mask on the whole box (`--clog-fade` 45 %, `--clog-top` 0); the mouse on it clears the fade (`--clog-top-h`). It sticks to the newest line unless scrolled up; then a ▼ NEW chip. Wheel / drag / clicks on it never reach the board (stopPropagation).
- **Fold**: ▾ (or the COMBAT LOG word) folds it to its bar; localStorage `ew_clog_folded`, viewer-local. The folded height is inline `auto !important`, so a UI Maker Height never holds it open.
- **Away**: three-renderer `_syncTakeoverHighlights` (THE GAME HAS THE BOARD, PR #302) now also writes `body.ew-board-busy` (the same `busy`: playing out, CPU / opponent turn, camera tween, banner, post-cast hold) and `body.ew-board-cam` (`_takeoverCamBusy`: camera flight, cinematic, death close-up, banner, a cine shot), only when they flip. CSS hides the log on those (+ `body.ew-spell-shot`) in 0.18 s and brings it back 0.5 s after (so a pan between two beats never blinks it); never while the mouse is on it (`.hold`); always shown in the UI Maker Layout view (`html.uim-arranging`). Off a battle / after a winner / while empty it is `display: none`.
- **UI Maker**: piece `clog` (Battle, "Combat log", keepCodes, noScroll) = move / scale / size handle / hide / panel look / text look; TEXT_PARTS: title, collapse button, round lines, HP numbers, ally / enemy names, spells, statuses, damage, heal, KO, big words. Its own section (`clogForm`, db.ux `l*`): Lines (combat lines | everything), HP after a hit (bar + number | bar | number | off), Round lines, title, Flash new lines, Fade length %, Left at the top, Clear while the mouse is on it, Hide while (the game has the board | spell shots + camera | never), Space between lines, Backing. uxCss writes the CSS; `clogSignal` publishes `window._ewLogLook = { auto, show }` and re-renders the log.
- **Online**: nothing relayed. The guest builds its own from the synced `logEntries` / `logDialogue` (only the host writes beats); its own colours, its own fog filter, its own fold.
- **Steady end of round** (2026-10-19, mondo: "during the end of round, the combat log keeps fading in and out between camera movements, either keep it on or keep it off for the end of round"): kept ON. battle.js `_setRoundAdvance` mirrors `_roundAdvanceInProgress` into synced `state._eorLive` (`isEndOfRoundLive()`); three-renderer `_takeoverBodyClasses` sets `body.ew-eor`; styles-hud.css keeps `.ew-clog.auto-board/auto-shots` up under it ("Hide while: Never" unchanged). Up from the first beat (status ticks) through the round banner, storms and announcements; it hides again on the first unit's pan. Browser-checked: a real round 2→3 end of round, visible at every sample through 8 camera flips.

### THE SELF-CAST CONFIRM: self-casts wait for the green CONFIRM (2026-10-18, mondo: "self cast spells still get a confirm button, im tired of clicking on an aoe not realizing its a self cast and then it automatically goes off. the self cast doesnt need a target list since it can only be the caster, it just needs the green confirm button after i click it")
- battle.js `setTool`: a self-cast (`isSpellSelfCast`) no longer fires on the pick. It arms `pendingTarget = {caster tile, selfCast: true}` in the `'spells'` aim view with the footprint up (`updateAoePreview`). The confirm (HUD CONFIRM, a click on the caster, or LMB in Strike Mode) goes `selectTargetFromMenu` → `_fireSelfCast` (keeps Crossfire's MOVE→CAST step). A spell whose only valid target is the caster now lists the caster pre-marked ✓ instead of firing.
- Board while armed: hover never re-aims or clears it (`updateHoveredTarget` returns early); a click on any other tile beeps "… is cast on X: press CONFIRM." and keeps it armed.
- hud.js: the aim view for a self-cast has no target list (`_aimSelf`), mode label "<SPELL> — SELF CAST · CONFIRM TO CAST", the big green CONFIRM reads "CONFIRM — SELF".
- Quick menus (enemy / ally): `_hrlgSelfCastRow` wraps self-cast rows. The first click arms the row (✓, footprint), the inline green CONFIRM or a second click casts. The arm key (`_hrlgSelfArmKey`, module-level, never on `state`) holds menu + caster + row + tile + AP and is dropped once no quick menu is up. Tile-menu spell rows keep setTool's caster pick for self-casts.
- Online: the guest arms locally (setTool still relays), the confirm runs the same `doSpell` relay as every other confirmed spell.

### THE PRESS MARKS + UI Maker pass 22: the green ! over the enemies a hovered spell presses (2026-10-18, mondo: "hovering over a spell from the abilities menu needs to show the green exclamation point super effective icon on the enemy units that spell is super effective against. this way i can see what is super effective without clicking on an enemy first. also make the icon more clear like give it an outline or add it somewhere in the ui maker so i can make it look better")
- Hover a spell row in the abilities menu (hud.js `_hrlgSpellBlades` hoverIn) → battle.js `previewSpellPressMarks(name)`: every enemy the
  viewer can see (`_shouldCameraFollowUnit`, the screen-true fog gate; Blind/Jammed solo sight comes with it) for which
  `forecastPressOn(caster, enemy, spell)` presses (aimed at that body, in reach or not) gets a mark. Same rule as PR #295:
  only a hit the refund really pays for. Shows even when the row is greyed (no AP / no target in reach). Cleared on hoverOut
  and by `clearSpellRangePreview` (every cast / mode change). Viewer-local, nothing relayed (the guest's own hover reads its
  own state copy).
- three-renderer.js `showPressMarks(ids)` / `clearPressMarks()`: `.ti-press-mark` DOM marks in the intent badge overlay,
  re-projected every frame (`_updatePressMarks` in the loop) at the unit's `_ew_spriteTopY`, so camera moves keep them on the
  head; dropped when the phase leaves battle or an action executes.
- ONE LOOK for every green ! (the intent badges' `_SE_CIRCLE_HTML`, the menu rows' `.hrlg-supereff`, the marks): ui.js
  `_seBangHtml(px, big)` (window._ewSeBangHtml) builds it from CSS variables `--ew-se-fill/-mark/-line/-lw/-glow/-rad/-menu/
  -big/-lift/-anim`; the var() fallbacks are the defaults (green, dark !, 2px WHITE OUTLINE new, glow, mark 26px, 36px above
  the head so it clears the name plate, bobs).
- UI Maker: Arrows + tiles ⧉ > "Super effective !" (top of the panel, with a specimen of the mark, the badge and a menu row):
  db.ux e* (eHover, eBig, eLift, eBob, eFill, eMark, eLine, eLineW, eGlow, eShape, eMenu) → hud.js `seSignal()` sets the
  variables on <html> + window._ewSeLook.hover. Browser-checked in a VS-CPU battle: 4 marks on 4 pressed enemies, none on the
  fogged ones, gone on leave; Square + outline 4 + size 40 + red fill changed the marks on the board live.

### UI Maker pass 23: Spawn + nexus zones (2026-10-19, mondo: "add them to the arrows and highlights section so i can change their settings and appearance and glow and all that")
- Arrows + tiles ⧉ has two tabs over the little board: "Arrows + tiles" (as before) and "Spawn + nexus zones" (UI.aimPrev;
  `ThreeRenderer.lookPreview(cv, 'zones')` = an 8 × 4 board with your spawn, a neutral, a yours and an enemy nexus and the
  enemy spawn, built by the board's own `_zoneMaskDraw` / `_zonePaint`, own maps + materials + context).
- db.ux zs* (spawn zones: TDM strips + Arena spawn nexuses) and zn* (every other nexus), keys from hud.js `zoneDefs(pre)`:
  Show, Fill, Rim, RimStyle, RimW, RimIn, Soft, Round, Glow, GlowW, Halo, HaloW, Pat / PatAmt / PatScale, Bright, Op,
  Pulse, PulseSpd, Wall, WallOp, ColAlly / ColFoe / ColNeutral. `zoneSignal()` → window._ewZoneLook {spawn, nexus} +
  _ewZoneLookV → three-renderer.js `_zoneLook()`. One-click ZONE_LOOKS per side (colours + Show stay).
- Reset groups are now `uxGroupOf(k)`: the first letter, except the zones' first two (zs / zn), so each side resets alone.
- Viewer-local like the rest of the UI Maker: nothing relayed, the guest draws its own look over its own state copy.
- **Both at once (2026-10-19, mondo: "with the nexus and spawn zones, i would like the option to edit that together or copy
  paste the settings from on to the other")**: a "Spawn + nexus together" block heads the tab. **Edit both together** = db.ux
  `zLink` (UX_DEF, false): the tab shows ONE form ("Spawn + nexus zones", the zs keys) and hud.js `zoneTwin(k)` makes every
  change land on the other side too (the data-xpath ranges / checks / colours, the data-xset segments), plus the one-click
  looks and **Reset both** (uxreset zs resets zs + zn while linked). Turning it on while the two differ asks "Which look should
  both start from?" (zonelinkfrom zs | zn copies that side over, then links; UI.zLinkAsk); a saved zLink with sides that differ
  shows the same ask. Unlinked, **Copy: Spawn → nexus / Nexus → spawn** (zonecopy) puts EVERY zone key of one side (Show and
  the colours too, `ZONE_KEYS` = zoneDefs keys) onto the other, one undo step. The renderer is unchanged (zoneSignal still
  publishes both looks). Browser-checked in a VS-CPU Arena (spawn nexuses + the earth nexus) and TDM (the spawn strips): the
  spawn colours alone turned only the spawn zones green, the copy turned the earth nexus green too, linked colour + light walls
  changed every zone, Undo / Reset both / unlink behaved.

### UI Maker pass 24: Floating text, the pops over the units (2026-10-19, mondo: "in the ui maker, lets add a floating text editor like for the damage and stuff. make it like the arrow and tile highlights editor where i can see a preview of what the floating text will look like with a model with a nameplate for scale")
- Live mode `float` (dock head button **Pops**, tab "Floating text" in TABS). db.ux f* keys (UX_DEF, hud.js): font / weight / case /
  letter spacing / icons, sizes (numbers, words, smallest + biggest number and smallest word as % of the screen height, big-hit
  swell, small hits smaller), outline + its colour, shadow, shine, gradient or flat, glow + its colour, the hit read (element
  colours, CRIT stamp, weakness icon, killing-blow glow), motion (rise, life, pop, fade start, start height chest/head/above,
  scatter, word wait, gap), which pops show (damage, heal, MP, TOTAL, hit words, status words, XP/pickups/Nexus) and a colour per
  kind (`fc<Kind>`, FLOAT_KINDS). Looks row FLOAT_LOOKS (As the game, Clean, Pixel, Comic, Impact, Glow). Reset = `xReset('f')`.
- `floatSignal()` (in the applyLayout signal chain) publishes ONLY the keys that differ from UX_DEF as `window._ewFloatLook`
  (null when untouched, so an untouched look draws the exact old pops) and bumps `window._ewFloatLookV`; a picked font is
  `document.fonts.load`ed first (a canvas never fetches one) and the version bumps again when it lands.
- three-renderer.js: `_buildFloatTextCanvas(text, kind, look)` reads the look (fonts, weights, case, emoji strip, colours as
  gradients from one colour, outline/shadow/shine/glow, chip). `_floatSpawn(ctx, ...)` + `_floatStep(ctx, cam, viewW, viewH,
  fullH, pane)` are the ONE spawn + step for the board (`_floatGameCtx`) and the preview: rise/life/pop/fade/start/scatter/wait/
  gap and the min/max sizes; Size multiplies AFTER the min/max clamp so it shows at every zoom. `_floatShows` hides a pop group.
  `startFloatingText` / `ThreeAnim.floatingText` return the pop (null when hidden) and battle.js dresses only that one.
- battle.js `_hitReadStyle` reads the look (elem, stamp, glyph, swell, killGlow); `window._ewHitReadDress(c, kind, opts)` lets
  the preview dress its pops with the same hit read. Viewer-local styling on both ends (the pop facts already ride the relay),
  so nothing new is relayed (RULE #2).
- The preview: `ThreeRenderer.floatPreview(host, opts)` = its own WebGL context (like lookPreview): the race's rigged model on a
  few tiles, its name plate (`_buildClonePlate`, global .tp-wrap CSS so the Name plates look shows), the battle lens (FOV 45,
  40° pitch, 45° yaw, board / turn / close-up distances) and a crop of a whole screen this size (setViewOffset), so number,
  plate and body keep battle proportions. Beats (FLOAT_PREV_BEATS): Hit, Crit, Heal, Status, Miss, MP + XP, Combo, KO; Loop;
  model picker (this turn's unit in a battle, else Fortune teller, or any race with a 3D model). A look change redraws the
  pops on screen at once.
- Browser-checked (scratchpad probe, jsdelivr served from a local npm mirror since the sandbox proxy blocks it): the dock
  preview showed the model, its plate and looping pops; in a VS-CPU arena battle each control was set through the dock's own
  inputs and the next real pop (window.showFloatingTextAtTile) was measured against one before.

### THE GAME DEFAULT THEME: mondo's Entropy Wars Theme (2026-10-18, mondo: "can we add these ui settings as a preset but also make it the default for the game", with his export Entropy_Wars_Theme.ewtheme.json)
- **The preset**: hud.js `UIM_PRESETS` opens with `p_entropy` "Entropy Wars Theme", his exported theme as a literal with every value as exported (only the id is the preset's own; `slices` was empty, so no images). Read-only like every preset: editing it makes a copy.
- **The default**: `HUD_THEME_DEFAULT = 'p_entropy'` (getHudTheme / setHudTheme fallback, UI Maker `globalId()`, the fallback after deleting the theme the game wears). `HUD_THEME_BASE = 'crystal'` keeps Classic Blue as the token base with no data-hud-theme. Only a profile that never picked a theme (no `ew_hud_theme`) gets it; a picked theme stays.
- Checked in a real browser on a fresh profile (no ew_ui_maker / ew_hud_theme): the battle HUD opened in it, the UI Maker showed it as PRESET + IN THE GAME, and the generated `<style id="ew-ui-maker">` was byte-identical to the one his own export makes when loaded as a custom theme.

## THE RETRO PARTS (2026-10-18)
mondo: "what is the point of the retro filter toggle that says dither + grade if there is already a dither slider ... what if i want pixelate but no dither?"
- The old "Retro Filter" toggle switched the whole retro pass (pixelate + grade + dither + quantize + grain) and collapsed the Retro / Haunted section, so pixelate needed it and brought the rest along.
- Now the toggle is **Color Grade** (mood tint, levels, saturation, Color Depth quantize). three-post.js `_retroLive()` runs the pass while ANY part is on: grade, Pixelate > 1, Dither > 0, Grain > 0. Uniform `uGradeOn` gates `grade()` in all three shaders (GLSL `_RetroShader`, the pmndrs frame built from it, the TSL `_ngFrame`). The dither + quantize block runs only when the grade is on or Dither > 0, so Dither 0 = no weave at all.
- Pixelate with no dither = Color Grade off, Pixelate 2x+, Dither 0. The section stays open (toggle no longer re-renders), summary lists the live parts.
- Ownership: `ew_retro_owned` (localStorage) marks every retro setting the player SET in the menu; a scene look (map / room `look.retro`) only fills settings the player never set. Before this, every look's `pixelSize: 1` beat a Pixelate slider left on its 2x factory value.

### UI Maker pass 22: the colour edge follows the button shape + the Trapezoid shape (2026-10-19, mondo: "see the colored lines sticking out at the left end of the action menu? those need to be put into the ui maker or they need to automatically follow what the shape of the button panel is so that they dont stick out like that. also i would like a trapezoid shape for the panels please, the closest right now is shard but i want a trapezoid with straight top and bottom edges")
- **The cause**: the battle surface's `keep` rule drew each command row's colour (`--bc`: move teal, attack red, a spell's type) as `box-shadow: inset 3px 0 0` on the square box. A skin's border-image fill covers an inset shadow, so under his shard skin only the part OUTSIDE the slanted shape showed: a straight line with a round top poking out at the left.
- **THE COLOUR EDGE** (hud.js after `roleSkin`): `edgeCss(S, T)` for surfaces with `edge: { row, sel, dead, pe, legacy }` (battle rows; the Sample windows preview on `::after`, its MOVE / ATTACK / ABILITIES / ITEMS carry the verbs' `--bc`). A skinned row gets `isolation: isolate` + a `::before` at `z-index: -1` (above the skin, under the words) filled with `--bc` and clipped by `edgeClip(s, E)`: `edgeChain(s)` = the shape's left side as `[x%, x px, y%, y px]` points (whole shapes in % because they are stretched, sliced shapes in px corners; 9-slice images count as square), moved right by the gap, as wide as the width, ends cut by the end gap (px-exact on sliced corners). Auto gaps = just inside the outline (in % for whole shapes, whose outline stretches). The selected row follows the Selected skin's shape. A role with no skin keeps the old inset line (`legacy`), so skinless themes look as before.
- **Settings** (`skins.button.edge`, `skins.buttonSel.edge`; Selected's unset keys come from Button; edge is left out of the bake cache key): Skins > Button / Selected > "Colour edge": Show, Width, Gap from the side, Gap at the ends, One colour (off = each action's own), Opacity, Greyed-out rows (Button only), Reset edge.
- **THE TRAPEZOID** (`trap`, a whole shape like shard): straight top + bottom, the Slant slider (-40..40 = 0..20% of the width; above 0 the top is the short edge, below 0 the bottom) + "Lean one way" (`lean`, both sides slant the same way; shapePath key `trapl` via `shapeKey(s)`). Also in card-part skins (`qpShapeClip`). Like every whole shape it is stretched to the box, so its outline is thinner along the top and bottom of a wide row (as shard).
- Browser-checked in a VS-CPU battle (local files swapped in for the CDN): the default theme's stripes now sit inside the shard's slanted side; all 14 shapes (trapezoid +/- slant, leaning, hex, round, pill, bevel, notch, scoop, diamond, circle, square, jagged, tab, pixel) keep the band inside; the spell list's type colours follow it; Width / Gap / One colour / Opacity / Greyed-out rows / Selected-only / no skin all changed the rows; the UI Maker's Trapezoid button, Slant -14 and Lean drew \‾\ rows live.
- **End gap clamp** (after review, 2026-10-19): `edgeClip` wraps every y in `clamp(min(top, mid), y, max(bottom, mid))`, so a Gap at the ends past half the row closes the band in the middle and keeps it shut. Before, a 21-24 px end gap on a 42 px battle row crossed the ends and brought the band back as a growing block in the middle. Measured on the ABILITIES row: 10 px = 18 coloured rows, 16 px = 6, 19 / 20 / 21 / 24 px = 0; trapezoid and shard at 24 px = none.
