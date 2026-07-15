# Entropy Wars — JRPG Flow & Menu Navigation Analysis

*A senior-dev review of the battle flow, menu system, and the four reported bugs — with root
causes, exact fix locations, and design recommendations. Written 2026-07-15 from a full-codebase
sweep (hud.js, ui.js, battle.js, state.js, three-renderer.js, three-camera.js, online.js,
match-select.js, party-builder.js, profile.js, index.html, PLAYTEST_NOTES.md).*

---

## ✅ Implementation status (2026-07-15, token `20260715a`)

**P0 — all four reported bugs fixed** (battle.js, ui.js, state.js, hud.js):
1. Camera — **§4's diagnosis was WRONG** (corrected 2026-07-15 after user feedback). The real problem:
   `getTacticalTilt()` returns the PRESET tilt (40), which is identical to the default resting view —
   so clicking Move changed nothing but zoom ("camera barely moves"). Fix: new `TILE_PICK_TILT = 20`
   (battle.js, next to DEFAULT_BOARD_TILT) — Move/Jump/Build and free-aim spell framing now sweep to a
   genuinely over-the-map overhead. It's transient by construction (moveTo never writes `_restTilt`),
   so the next unit's turn start returns to the normal resting view automatically. Do NOT cap the pick
   tilt at `_restTilt` — that was tried and it makes Move a no-op. `_restTilt` still resets per match.
2. Super-effective: the four ui.js highlight writers share one `_spellEffClass` helper that backs STAB
   out (`>1.001/<0.999`) — the nameplate `!` badge self-corrects since it parses these classes.
3. Spell targeting: `_getSpellValidTargets` now LOS-exempts `delayed` and fog-filters (with the
   telescope exemption, mirroring doSpell exactly); map clicks z-snap to the sole valid target in a
   column; free-aim clicks run `spellTargetUsableOn` (full-HP ally heal rejected on click 1, with reason).
4. Jump: fall damage applies at LANDING (in `_doPostJump`); local-human jumps no longer pan the camera
   (walk parity — AI/remote keep the fog-gated follow); post-jump re-arm 650→500 ms; damaging landings
   paint **hazard-crimson** in both Move and Jump overlays via new pure `predictFallDamage` (state.js,
   twin of `applyFallDamage`); quick-menu "Jump here" shows the exact `−N HP`; Jump blade explains
   itself when greyed ('Jumped' / 'No AP' / 'No landing').

**P1 — input correctness, all six done** (ui.js, hud.js, battle.js):
Esc single-owner (dialog > pause-close > back-one-level > pause; `_escHasBackTarget`); arrow keys owned
by the drum while browsable (`window._hrlgArrowsOwned`, board keeps WASD; aiming returns arrows to the
board); `_execAction` hoisted out of clickTile and EVERY latch-setting path funnels through it (setTool
self-casts, selectTargetFromMenu, the hud.js quick-cast `_fireEnemyAction`); quick-menu anchors cleared
in `setActionMode`; forfeit now confirms via a new generic `confirm` uiDialog type (late-binds the
online.js wrapper); menu failsafe — drum force-shows after 4 s of stuck-busy on a local human turn.

**Not yet done:** P2 TargetQuery refactor, P3 genre features (forecast card, threat overlay, undo move,
turn timeline, height readout, onboarding, speed control, minimap toggle).

---

## 0. Executive summary

The bones here are genuinely good: one declarative menu component (the Horologe drum) driven
purely by `state`, one central click dispatcher (`clickTile`), a two-click confirm model, blitz
initiative, and a contextual camera. That's the right architecture for an FFT/XCOM-class game.

The bugs all share one disease: **the same question is answered by more than one piece of code,
and the answers disagree.**

- "Can this spell hit that unit?" is answered by **three different validators** (target list,
  map click, quick menu) plus a fourth final authority (`doSpell`). → the "works from the list
  but not the map (or vice versa)" bug.
- "Is this attack super effective?" is answered by **five indicator systems**; four divide out
  the STAB self-bonus, one doesn't. → the false green `!`.
- "What pitch should the camera be at?" is answered by **two variables** (`camera._restTilt`
  vs `getTacticalTilt()`); turn-start reads one, the Move button reads the other. → the
  camera reversal.
- "When does a jump hurt you, and does the camera follow?" is answered differently for jumps
  vs walks. → "jumping is still kind of weird."

Every one of these has a small, local fix (§1–§4), and one architectural fix (§6.1, a single
`TargetQuery` source of truth) prevents the whole class from coming back.

---

## 1. BUG — Spell works from target list but not map click (or vice versa)

### Architecture (why this can happen at all)

There are **three input paths** into a spell cast, each with its own validity logic, plus the
final authority:

| Path | Candidate/validity source | Executes via |
|---|---|---|
| A. Map click (free-aim, tile-targeted spells) | `getSpellRangeTiles` (battle.js:3947) + `_spellTargetTeamOk` (battle.js:26914) in `clickTile` (battle.js:28231–28279) | `doSpell` (battle.js:28679) |
| A′. Map click (unit-target spells, `spellTargets` view) | `_getSpellValidTargets` (battle.js:26826) in `clickTile` (battle.js:28188–28197) | `doSpell` |
| B. Target-list drum | `_getSpellValidTargets` (hud.js:2614 → battle.js:26826) | `selectTargetFromMenu` (battle.js:27361) → `doSpell` — **no re-validation** |
| C. Quick-enemy menu | Its own re-implementation: `_computeEnemyActions` (hud.js:3651) with private `_fogSees`/`spLos`/`inSpellRange` (hud.js:3798/3997/4076) | `_fireEnemyAction` (hud.js:4700) → `doSpell` |
| Final authority | `doSpell` re-checks range (battle.js:33216), LOS (33229), fog (33238–33244) | — |

For **tile-targeted spells** (aoe, cross, bomb, `delayed`, zones, line, teleport… — table at
battle.js:251–323) the map uses `getSpellRangeTiles` while the list uses
`_getSpellValidTargets`. Those two functions disagree in specific, fixable ways:

### D1 — `delayed` (artillery) LOS: castable from map, missing from list  ← primary
- `getSpellRangeTiles` LOS-exempts `delayed`: battle.js:3978.
- `doSpell` LOS-exempts `delayed`: battle.js:33229.
- `_getSpellValidTargets`'s skipLOS set **omits `delayed`** (battle.js:26835–26836), so its LOS
  check (26882) drops any artillery target behind terrain.
- **Fix:** add `spell.kind === 'delayed'` (and audit `ignoresLineOfSight` parity) to the skipLOS
  set at battle.js:26835.

### D2 — Fog: list offers fogged enemies the cast then silently rejects
- `getSpellRangeTiles` filters fog (battle.js:4002); `clickTile` blocks fogged clicks
  (28005–28019); `doSpell` rejects fogged targets (33238–33244).
- `_getSpellValidTargets` has **no fog/vision check at all** (26842–26900). A fogged enemy shows
  in the drum, you pick it, `doSpell` bounces → "the list target does nothing."
- **Fix:** add the same `fogLimit && !fogExempt && !isInVision` guard near battle.js:26881.

### D3 — Per-target usability only in the list
- List filters via `spellTargetUsableOn` (battle.js:26898 → 17437: full-HP allies for heals,
  clean allies for cleanse, etc.). The free-aim map path never calls it (28231–28278), and
  `_spellTargetTeamOk` early-returns true for tile-targeted kinds (26914).
- **Result:** map lets you arm a heal on a full-HP ally the list correctly omits.
- **Fix:** run the same usability check in the free-aim click/hover gates (~28267, ~27867).

### D4 — Target height (z) resolves differently
- Map: `state._clickedZ` is the unit's z only if you hit the sprite/mesh; clicking the tile
  under a flyer resolves to ground z (three-renderer.js:20697–20711). List always passes exact
  `tUnit.z` (hud.js:2649/2672).
- **Result:** stacked units (flyer over ground unit) — list reliably targets the picked unit,
  map click hits whichever z the pick resolved.
- **Fix:** in `clickTile` spell views, snap z to the *intended valid target's* z when x,y match
  a valid target (the valid-target entry already knows its z).

### D5 / D6 — Structural asymmetries (decide, then document)
- Beams (`line`/`linePush`): map accepts any of 8 headings, unlimited reach
  (battle.js:28236–28262, 33212); the list only offers in-range LOS-clear units. Quick menu
  matches the map (`beamRayHits`, hud.js:4019).
- Move-then-cast: map (`_tryMoveThenCast`, battle.js:18324, invoked 28211/28244) and quick menu
  (hud.js:4088–4139) offer approach-then-cast; the target list never does — the same enemy can be
  "castable" from the board and "No targets in range" in the list.
- **Fix:** add approach rows to `_hrlgTargetBlades` for spells (attacks already have a
  "move + attack" hint at hud.js:2709), and for beams list the 8 headings as directional rows.

### The real fix (architectural)
One `TargetQuery(unit, action)` module that returns `{targets, tiles, reasonsByTile}` and is the
**only** thing the list, the map hover, the map click, the quick menus, and `doSpell` consult
(doSpell keeping its own final gate is fine — it should just call the same function). Every
divergence above becomes structurally impossible. See §6.1.

---

## 2. BUG — "Jumping is still kind of weird"

Jump traversal: `getUnitJumpStat` (battle.js:124), `getUnitJumpClimb` (137), `getJumpTiles`
(30031), `doJump` (30168), arc tween (three-renderer.js:12631). Entered via teal `move-jump`
tiles folded into Move (ui.js:2454–2470), a Jump button that only appears when walking is
exhausted (hud.js:3034–3044), or the tile quick-menu "Jump here" (hud.js:5103–5119).

Ranked list of what actually feels weird:

1. **Camera lurches on jump but not on walk.** A human's walk never pans
   (battle.js:29914–29915); a human's jump always fires a 400 ms `animateBoardCameraPath` pan
   (30227–30242). Since jump tiles live inside the Move overlay, the camera "randomly" jerks
   only when you tap a teal tile. **Fix:** make them match — drop the human-jump pan (or add the
   same gentle pan to walk).
2. **Fall damage lands before the unit does.** `doJump` applies fall damage synchronously at
   jump-start (30211) while the sprite is mid-arc — HP bar drops from an empty tile. The "⬇
   DROP" text is delayed 420 ms (30224) but the damage isn't. **Fix:** move `applyFallDamage`
   into `_doPostJump` (30258) so it lands with the unit.
3. **Dangerous drops look identical to safe hops.** Upward hops are capped by climb
   (30069) but drops are uncapped, and tile tinting (ui.js:2674–2678) never flags height-drop
   damage — surprise self-damage from an innocent-looking teal tile. **Fix:** tint
   fall-damage landings orange/red and show the predicted HP loss on hover (FFT would never let
   a "safe" tile hurt you unannounced).
4. **Jump tiles vanish after the first hop with no explanation.** One leap per turn
   (`_jumpedThisTurn`, 30034) is a fine rule, but the teal tiles just disappear. **Fix:** show a
   greyed Jump state / "already jumped" hint instead of silence.
5. **Discoverability:** the Jump button appears only when you can't walk (hud.js:3034–3036);
   otherwise jump exists only as teal tiles. Players hunting a Jump verb won't find one.
   **Fix:** always show Jump (disabled with tooltip when unavailable), or add a legend chip for
   teal tiles.
6. **Dead beat after landing:** arc is 480 ms, camera 400 ms, but `_doPostJump` re-arms at
   650 ms (30257) — a ~170 ms input-dead tail on every jump. Tighten to ~500 ms.
7. **Leaping over tall walls/enemies** (landing-only validation, 30053–30055) is documented as
   intended ("arcs over gaps") but reads as clipping when the wall is taller than the unit's
   climb. Consider an apex-clearance check: `apexHeight = max(fromZ,toZ)+2` must clear
   intermediate tiles, or visibly arc *around* nothing-blocking paths.
8. **Online guest ghosting:** guest jump shows a 45 %-opacity ghost at the destination
   immediately, then plays the arc after the host round-trip (online.js:411–416, 459–465,
   1426–1441) — occasionally reads as teleport-then-hop. Lower priority.

Also: `hud.js:5107` offers "Jump here" even when the tile is walk-reachable (notes say it should
be jump-only) — redundant menu entry.

---

## 3. BUG — False "super effective" green `!`

**Root cause (confirmed):** the nameplate badge is the *only* effectiveness indicator that does
not divide out the STAB (same-type attack bonus, ×1.25, data.js:130).

- `getTypeDamageMultiplier` (state.js:2697–2721) returns `effectMult × stabMult` — STAB baked in.
- The four spell-highlight writers set `type-strong` when that raw product `> 1`:
  **ui.js:2987–2988, 3035–3036, 3082–3083, 3120–3121**.
- The per-frame nameplate badge just trusts the `type-strong` class:
  `_updatePlateEffBadges` (three-renderer.js:9545, predicate 9576–9585).
- Every other consumer backs STAB out and uses `> 1.001`: damage callout (battle.js:13888–13897),
  combat note (state.js:2723–2733), target-drum `!` chip (hud.js:2642–2645), map intent badge
  (ui.js:8629–8639).

So: **Fire-type caster + Fire spell + type-neutral enemy → 1.0 × 1.25 = 1.25 > 1 → green `!`**
on every in-range neutral enemy, while the damage text and target list correctly stay silent.
Basic attacks pass no spellType, so attack mode is immune — that's why it's intermittent.

**Fix (one pattern, four lines):** at each of the four ui.js sites, compute
`const stab = (unit.types||[]).includes(spell.spellType) ? STAB_MULTIPLIER : 1;
const eff = typeMult / stab;` and use `eff > 1.001` / `eff < 0.999` for
`type-strong`/`type-weak` — i.e., mirror `getTypeCombatNote` (state.js:2727–2732). This also
fixes the mis-colored tiles, since the same class strings drive tile tinting.

**Hardening:** `_updatePlateEffBadges` should call the affinity function itself (like
`_getTypeEffLabel` does) instead of parsing a CSS class written by four separate sites.

**Design note:** STAB is still worth communicating — just not as "super effective." A small
separate chip (e.g. an amber "STAB" tag in the forecast card, §6.2) keeps the Persona/SMT rule
that the exclamation mark *always* means the matchup, never the caster's self-bonus.

---

## 4. BUG — Camera: top-down at turn start, angled after clicking Move

> ⚠️ **This section's diagnosis and fix were WRONG** — see the implementation-status note at the top.
> The intended design (per the game's author): clicking Move sweeps UP to a distinct over-the-map
> overhead (`TILE_PICK_TILT = 20`), and the next unit's turn start returns to the normal resting view.
> The preset tilt (40) equals the default rest tilt, so the old `getTacticalTilt()` framing was a
> visual no-op — and capping it at `_restTilt` (the fix below) makes it worse. Kept for the record.

**Convention:** tilt 0 = straight down (top-down); bigger tilt = lower/more angled
(three-camera.js:139–141). Presets: standard 40 / far 30 / close 55 (battle.js:9935–9939);
`REST_TILT_MAX = 62` (battle.js:8560–8576).

**Root cause (confirmed):** two sources of truth for "resting pitch":

- **Turn start** (battle.js:26638–26646) frames the active unit at
  `min(camera._restTilt, REST_TILT_MAX)` — it honors wherever the player last orbited,
  because `camera.snap()` overwrites `_restTilt` with the hand-orbited tilt
  (battle.js:9089, fed from the drag handlers at state.js:4947/5219/5893, range 0–170).
- **Move button** → `setActionMode('move')` → the framing block at battle.js:27529–27552 uses
  `tilt: getTacticalTilt()` (27547) — the **fixed preset tilt (40)**, ignoring `_restTilt`.
  The free-aim spell path does the same at battle.js:26739.

So after you hand-orbit to top-down (tilt ~15–30), turn start keeps the top-down view but Move
snaps you back to the more-angled 40. It's intermittent because it needs that prior hand-orbit —
and it's one-directional (if you leave the camera angled, Move at 40 correctly reads as *more*
top-down, so nobody complains about that side).

**Fix:**
1. battle.js:27547 and 26739 — replace `getTacticalTilt()` with
   `Math.min(getTacticalTilt(), camera._restTilt ?? DEFAULT_BOARD_TILT)`
   so tile-picking is **never more angled** than your resting view (Move = the most top-down
   context, matching the stated intent and the contextual-camera doc at battle.js:9883–9892).
2. New-match reset (battle.js:21246–21251) resets `camera.tilt` but not `camera._restTilt` —
   add `camera._restTilt = Math.min(getCameraPreset().tilt, REST_TILT_MAX);` so stale tilts
   don't leak across matches.

The cinematic shots are clean — they all round-trip through `_preCineView`/`_restTilt`
(battle.js:12991, 9450–9516); the Move/free-aim framing is the lone outlier.

---

## 5. Menu-navigation defects (found during the sweep)

The menu system itself (Horologe drum: `ActionMenu` hud.js:2998, `HorologeMenu` hud.js:1832,
all state-driven, single `clickTile` dispatcher battle.js:27977) is well built. Defects:

1. **Escape double-fires.** Two independent keydown listeners: ui.js:8213 → `togglePauseMenu`,
   ui.js:9344 → `handleBackAction`. Pause sets `_gamePaused`, not `state.uiDialog`, so neither
   guards the other: one Esc press with a submenu open both opens Pause **and** backs a menu
   level. **Fix:** one Escape owner — if a submenu/aim mode is open, Esc = back; only at root
   does Esc = pause.
2. **Arrow keys double-bound.** HorologeMenu claims ArrowUp/Down for the cursor (hud.js:1975–
   1987) while ui.js:9556–9592 maps all four arrows to board movement/kb-cursor. Up/Down hit
   *both* (menu cursor moves and a provisional move starts). **Fix:** while the drum is visible
   and has focus, arrows belong to the menu; WASD stays on the board (they're already split
   in spirit — enforce it).
3. **One-click vs two-click asymmetry.** Entering Attack (battle.js:27554–27564) or arming a
   unit-target spell (26777–26782) pre-arms `pendingTarget` on the first candidate, so clicking
   *that* enemy fires instantly while any other enemy needs the standard two clicks. Either
   don't pre-arm from mode entry, or make the pre-armed state visually unmistakable (big
   confirm reticle + forecast card, §6.2).
4. **`_actionExecuting` set outside the watchdog.** The 8-second stuck-input watchdog only arms
   in `_execAction` (battle.js:28629–28639), but `_actionExecuting=true` is also set at
   setTool self-cast (26765/26786), selectTargetFromMenu (27384), and sky-throw (28179). Any
   early-returning doSpell on those paths can wedge input with no recovery. **Fix:** funnel all
   of them through `_execAction`.
5. **Right-click has three owners on the board:** demolish-hold (three-renderer.js:20758),
   camera pan (state.js:4776), and quick-back (state.js:4861–4898, <450 ms + no-drag). It mostly
   reconciles, but it's fragile; the drum's own right-click=back (hud.js:2091) is the model —
   consider moving demolish to a modifier (hold-Alt) or a Build-mode-only gesture.
6. **Quick-menu anchors are hidden, not cleared, when a mode arms** (`_enemyActionTargetId` /
   `_tileActionTarget` render-gated at hud.js:3386–3389): cancel a mode and a stale enemy card
   can pop back. Clear them in `setActionMode`.
7. **No menu failsafe:** drum visibility is gated on `boardBusy`/`_hrlgHoldUntil`
   (hud.js:159–205); if a busy flag sticks, the entire command UI vanishes. Add an "if hidden
   for > 4 s while a local unit is active, show anyway" escape hatch.
8. **Third validator in the quick menus** (`_computeEnemyActions` hud.js:3651 re-implements
   fog/LOS/range) — fold into TargetQuery (§6.1).

---

## 6. Genre-staples gap analysis (the Square Enix / Atlus / Firaxis checklist)

What exists and is good: status icons + tooltips everywhere, a battle log, a strong pause/stats
screen, results/rematch flow, extensive keyboard+gamepad support, an options suite, blitz
turn-order shown on the scoreboard flanks, fog, height, facing. That's more meta-UI than most
prototypes. The gaps, in order of how loudly the genre demands them:

### 6.1 One rulebook (engineering prerequisite)
Single `TargetQuery` (see §1). Every targeting bug in this report is a symptom of not having it.

### 6.2 Damage / hit forecast — **the #1 missing feature**
There is **no** damage or hit-chance preview anywhere, yet the combat *is* probabilistic
(miss/dodge with AP penalty — battle.js:16930–16934, 17528). FFT, Fire Emblem, XCOM, Persona —
the confirm step always shows the contract: dmg range, hit %, crit, effectiveness, and what
retaliation you're exposed to. You already have the perfect hook: the two-click confirm
(`pendingTarget`, battle.js:28297–28332). On first click/arm, render a forecast card next to the
drum: `dmg ~34–41 · 92% · WEAK! (×1.3) · STAB · counter: 12–15`. This single feature converts
"clicking and praying" into tactics, teaches the type chart passively, and makes the green `!`
self-verifying. It also gives STAB its honest home (§3).

### 6.3 Enemy threat range ("danger zone")
Threat maps already exist — for the AI only (ai.js:456, 672–695). Expose them: hover/pin an
enemy → red overlay of move+attack reach; a global toggle for all-enemy threat (XCOM's pod
awareness, FE's danger area). The data is computed; this is UI work.

### 6.4 Undo move
FFT lets you cancel a move before acting; XCOM's biggest UX complaint was the lack of it. You
already snapshot undo state in `doJump` — extend it: until a unit *acts* (attack/spell/build),
allow one "Undo Move" blade at the root. Blitz + fog makes full undo exploitable
(scout-and-retreat), so use the standard rule: undo is disabled if the move revealed new fog
tiles or triggered a reaction/trap.

### 6.5 Turn-order forecast timeline
The scoreboard's flank layout shows *who has acted*, but not "who acts in the next N slots" the
way FFX/Grandia/Child of Light do. A thin linear strip (8–10 portraits, active leftmost) above
the drum would let players plan around initiative — and it's derived from data you already have
(`getNextBlitzUnit`, battle.js:23763).

### 6.6 Height and terrain legibility
Elevation matters mechanically (climb caps, fall damage, LOS) but has no numeric surface — FFT
prints `h3` on every tile cursor. Add height to the tile hover/kb-cursor readout and to the
move-overlay tooltips (pairs with the jump-drop warning, §2.3).

### 6.7 Onboarding
No tutorial of any kind (the only "onboarding" is the shop upsell modal, ui.js:8069–8098).
Minimum viable: a guided first VS-CPU match with contextual tooltips (move → attack → spell →
end turn), plus a "?" chip on the drum linking to a controls card. The control-hint bar
(hud.js:5700–5707) is a good seed.

### 6.8 Smaller but expected
- **Forfeit confirmation** — one misclick currently ends the match (ui.js:9300 →
  battle.js:21687) and a dialog system already exists (`state.uiDialog`). Two-line fix.
- **Battle speed** is dev-sim in a trench coat (pause "Game Speed" literally clicks the dev
  buttons, ui.js:7196–7201). Ship a real ×1/×2 animation-speed setting; keep dev-sim behind a
  dev flag, along with the raw Camera/Cin/Vis/Anim/Fog checkboxes (index.html:348–362).
- **Minimap is built but hidden** (three-renderer.js:20016+, suppressed at hud.js:5734–5735).
  For big maps/CTF/domination it earns its place — unhide behind a toggle.
- **Wait/Defend verb:** pure-AP is fine, but a "Defend" (end turn + damage reduction / face
  choice) gives a meaningful null action — SRPG players expect *some* defensive stance.
- **Mode availability consistency:** ranked = Arena+TDM only (index.html:555–556), friendly =
  5 modes (609–613), VS-CPU = all 8 (map.js:1274–1283). Deliberate or not, surface it in the
  UI ("ranked rotation") so it reads as design, not omission.
- **Two party-builder surfaces** (legacy `#setupToolbar` at ui.js:9124–9266 + React builder)
  with duplicated Ready/Save/Load — retire the legacy one.

---

## 7. Prioritized fix plan

**P0 — the reported bugs (small, surgical):**
1. Camera: `min(getTacticalTilt(), _restTilt)` at battle.js:27547 + 26739; reset `_restTilt` at
   battle.js:21246–21251.
2. Super-effective: divide out STAB + `>1.001` at ui.js:2987/3035/3082/3120.
3. Spell targeting: add `delayed` to skipLOS (battle.js:26835) and fog filter (~26881) in
   `_getSpellValidTargets`; snap click-z to the valid target's z in spell views.
4. Jump feel: move fall damage to landing (battle.js:30211 → `_doPostJump`); align jump camera
   with walk (30227–30255); warn on fall-damage tiles (ui.js:2674–2678).

**P1 — input correctness:** Escape single-owner; arrow-key ownership; `_actionExecuting` via
`_execAction` everywhere; clear quick-menu anchors in `setActionMode`; forfeit confirm; menu
failsafe.

**P2 — the one refactor:** `TargetQuery` single validator consumed by list/map/hover/quick
menus/doSpell (kills D1–D6 and the class of bug permanently).

**P3 — genre features by impact:** damage/hit forecast card → threat-range overlay → undo move →
turn timeline strip → height readout → onboarding → real speed control → minimap toggle.

**Online parity note (RULE #2):** the P0 camera/indicator fixes are view-local (safe). The
forecast card, threat overlay, and any new banners must be either guest-computed from synced
state or relayed; fog-gate anything keyed to enemy units via `_isTileVisibleToViewer`.

---

## Appendix — key file:line index

- Menu: `ActionMenu` hud.js:2998 · `HorologeMenu` hud.js:1832 · target drum `_hrlgTargetBlades`
  hud.js:2602 · quick menus hud.js:3651/5031/4700 · back cascade ui.js:4482 · cancel ui.js:4433
- Dispatch: `clickTile` battle.js:27977 · `_screenClick` three-renderer.js:20664 ·
  `setActionMode` battle.js:27478 · `setTool` battle.js:26690 · `selectTargetFromMenu`
  battle.js:27361 · confirm battle.js:28297–28332
- Spell validity: `_getSpellValidTargets` battle.js:26826 · `getSpellRangeTiles` battle.js:3947 ·
  `doSpell` battle.js:33109 (range 33216, LOS 33229, fog 33238)
- Jump: `getJumpTiles` battle.js:30031 · `doJump` battle.js:30168 (fall dmg 30211, camera 30227,
  post 30257) · tiles ui.js:2454–2470 · button hud.js:3034
- Effectiveness: mult state.js:2697 · note state.js:2723 · badge three-renderer.js:9545/9576 ·
  writers ui.js:2987/3035/3082/3120 · chip hud.js:2642 · intent ui.js:8629 · STAB data.js:130
- Camera: presets battle.js:9935 · turn start battle.js:26638 · Move framing battle.js:27529–52 ·
  free-aim battle.js:26739 · `_restTilt` write battle.js:9089 · match reset battle.js:21246
- Keys: menu cursor hud.js:1975 · movement ui.js:9556 · Esc ui.js:8213 & 9344 · Tab ui.js:8218
