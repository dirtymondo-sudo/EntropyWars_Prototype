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

## THE SPELL LIBRARY v2 — THE IDENTITY TAB (2026-09-26, token 20260926-spell-library-08-cors)
- IDENTITY tab (ui.js `_slb2RenderIdentity`, styles-hud.css "IDENTITY tab"): pick 1-4 families → written archetypes that
  match, a composed name / concept / look from the family kits (↻ REROLL = `_slbIdSeed++`), signature spells, how the pool
  plays, close archetypes, races on the combo, pairs well with. State `_slbIdFams` / `_slbIdSeed` / `_slbIdQuery`; acts
  `idToggle` / `idLoad` / `idRandom` / `idClear` / `idReroll` / `idCopy`, input `idQuery`.
- The data + `slbIdentityBuild` live in the DOM-free `/* SLB IDENTITY BEGIN */ … END` block (sliced by spell-identity.test.js):
  a new family needs a row in `SLB_IDENTITY_KITS` (the test fails without one) or an `identity` on its registry row; an
  archetype is `[name, 'fam fam fam', line]`.
- FAMILIES inspector → IDENTITY KIT: four `data-input="famIdentity"` textareas → `_slb2SetFamilyIdentity` → the row's
  `identity` via `_slb2WriteReg('families', …)`.
