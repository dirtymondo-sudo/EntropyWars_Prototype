# PARTY BUILDER REDESIGN — THE FORGE TERMINAL
### The vessel-assignment screen becomes one CRT monitor · rev 1 (2026-09-09 — plan written, nothing shipped yet)

Read CLAUDE.md first (RULE #1 delivery — full files in chat, never a patch;
#1b the `?v=` bump in index.html with EVERY R2 file; #1c no playtest unless
asked; #2 online parity). This file is the step-by-step plan for rebuilding
the party builder (`party-builder.js`) around the seven reference images in
`party_builder_references/` (committed 2026-09-09 — Claude can view them
with the Read tool). It is the anti-"start over" memory for the builder:
what to build, in what order, in which EXISTING files, and what is decided
vs. still the user's call. **Append to §9 (build log) every session that
touches the builder.**

---

## 0. The brief (the user's words, 2026-09-09)

> Reference photos for a new party builder, specifically the part where you
> select your spells. Selecting a champ (the smash bros / mortal kombat like
> grid) and selecting the spells should be separate — different tabs of the
> same screen. It should be diegetic with the computer monitor. The passives
> or something can be sticky notes. The party (currently a column on the
> left) should be a row on the bottom. Circles or rounded corners instead of
> squares where possible. The hero unit should actually play its spell
> animations and VFX when you are selecting a spell. Do it in stages.

Everything below serves those seven sentences.

## 1. What the references say (read them once, then build from this)

Seven images, one screen: a **CRT monitor** (bezel, glass, scanlines, a
paper label on the frame) running a **character terminal**.

| What                         | How the references do it                                                                                                                                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tabs**                     | A bar across the top of the glass: `[L1] STATUS · TECHNIQUES · EQUIPMENT · DOSSIER [R1]` (U.N.A.), `SKILLS · GEAR · LORE` (Bigfoot), `STATUS · LOADOUT · SKILLS · ARCHIVE · SYSTEM` (Nexus Veil). Shoulder buttons cycle them.                    |
| **The hero**                 | Full-height in the middle or right third, lit, in front of a mood backdrop. Aya Voss shows the **MOVE PREVIEW**: the hero mid-animation with the technique's slash drawn across the frame.                                                       |
| **The technique tree**       | Three **pillars** (PSI / EXOGENESIS / WARFARE; TIDES / SONG / SCALES; FLESH / MIND / ABYSS), each with a title, a one-line tagline, a lit ring-1 node and three dimmer nodes below, joined by a vertical line. Nexus Veil and Aya Voss draw the nodes as **circles**; Aya Voss curls the whole tree into a ring. |
| **The technique panel**      | Bottom-left, under the tree: big icon · `PSI LV 1: TELEKINESIS` · one-line description · `AP COST 1` · the verb (`PURCHASE` / `LEARN` / `CONFIRM`). Every reference has this panel.                                                                 |
| **Stats**                    | A right-hand block. Nexus Veil / Aya Voss: each stat is a **round icon disc** + label + a rounded bar + the number ("pills"). Plus a RESISTANCE / AFFINITIES row of six **circular type icons** (NUL / RES / WKN).                                     |
| **The party**                | A **row along the bottom** of the glass: circular portraits, the active one larger and ringed, `◂ ▸` caps (L1 / R1), names under, `PARTY 4/6`. Nemesis-OS has the same row as square film-strip frames.                                            |
| **Sticky notes**             | Paper notes stuck on the **bezel** (outside the glass), slightly rotated, handwritten: `PASSIVE: SECOND WIND — Recover 8% HP after a perfect evade.` (pink, top-right) · `Passive: Sixth Sense — Slightly increases evade vs. ambush.` (yellow, bottom-left). |
| **Chrome**                   | An OS header (`NEMESIS·OS v2.3.1 · OCCULT ASSET MANAGEMENT TERMINAL`), a motto on the right, a paper label on the bezel (`PROPERTY OF THE UNSEEN`), a barcode, a power LED, `SELECT · CONFIRM · BACK · VIEW INFO` button legend.                        |

What the game already has that matches this: **THE TERMINAL** (match-select
is a CRT — `.ms-crt` in styles-base.css, match-select.js renders bezel →
glass → screen), the D.O.O.R. paper/stamp language (`door-stamp`,
`door-file-*`), the DOOR synth kit (`playDoorSfx('crtOn' | 'vhsEject' |
'stamp' | 'dotMatrix')`), the phosphor palette (`--ph-*`), and a live 3D
hero stage (`EWCharViewer`). The builder does not need a new look; it needs
to be moved INTO the look the match-select screen already wears.

## 2. What exists today (the anatomy — read before editing)

**party-builder.js** (2 821 lines, React via `React.createElement`, one
IIFE, injects its own `<style id="pb-hover-css">`). One component,
`PartyBuilder()` (line ~1595), mounted two ways:

- **Pre-match**: ui.js `renderBuilder()` (~583) → `window._mountReactPartyBuilder()` → `#builderOverlay` (index.html, INSIDE `#battlePanel`). `backToModeSelect` (map.js) leaves it. Online: the same component; `window._NET` carries `role`, `_lockState`, `_waitingForOpponent`, `ranked`; the foot shows CONFIRM / SEAL / WAITING / START MATCH from those flags.
- **Standalone** ("PARTY BUILDER" on the main menu, the Quartermaster door's `alt` in the HQ): map.js `_goToTeamBuilder` → `_showTitlePage('teamBuilderPage')` → `window._mountReactTeamBuilder()` → `#teamBuilderBody`; `_pbStandaloneMode` = true; opens on the TEAM ARCHIVE locker (`tbView === 'locker'`), FORGE edits a preset, SAVE TEAM writes `profile.teamPresets`.

Today's layout (all inline styles): header bar (46px) → 3-column grid
`112px | 1fr | clamp(380px,36vw,640px)`:
- left = **THE PARTY** column (slot cards with `PortraitSprite`, FILED stamp, numeral);
- centre = **hero showcase** (54% height: gear rail · `HeroViewer3D` · item rail; the assessment sheet with ASSESSMENT / DOSSIER tabs, `VitalBar` / `StatBar` / `RangeDiamond` / `RACE_TRAITS`) over the **Codex of Vessels** roster grid (search, sort, type / job / faction filters, ★ favourites, 🔒 shop gate);
- right = **Abilities**: `SpellTreePanel` (tree classes) or the flat pool / 6-slot rack fallback; twin / wildcard node picker overlay.
→ command bar (56px): BACK · 🎲 ONE · 🎲 ALL · RESET · ★ SAVE · ↑ LOAD · CONFIRM n · SEAL YOUR FATE.
Overlays: team save/load modal, equip picker (`subjob` / `item` / `accessory1|2`), the locker.

State the builder writes (unchanged by this plan): `state.partyBuilds[p][i]`
(job), `state.partyMeta[p][i]` (`race`, `gender`, `zodiac`, `secondaryJob`,
`customSpells`), `state.partyNames`, `state.loadouts[p][i].{items,equipment}`,
`state.builderSelectedSlot/Player`, `state.builderConfirmedSlots`,
`state.teamLockedIn`, `state.showPlayer2Builder`.

**The spell tree** — `SpellTreePanel` (~1211): `TREE_NODE_POS` puts `root`,
`R1–R4` (race pillar, centre), `P1–P4` (primary job, left), `S1–S4`
(subclass / wildcards, right) in a 100×100 space; edges are SVG `<line>`s
under opaque 46px **circular** chips; state per node = root / socket /
empty / equipped / reachable / far / sealed / blocked
(`computeTreeEquipPath`, `treeReachableKeys`, `isTreeLoadoutLegal`,
`treeLegalSubset`); twin nodes (`tree.alts`, ⇄ badge) and Freelancer
sockets (`tree.sockets`) share one picker overlay. Category colours =
hud.js `_HRLG_CAT` (red damage / green heal / blue buff / purple debuff /
gold utility). None of this logic changes; only its skin does.

**The 3D hero** — `EWCharViewer` (three-renderer.js ~28440–29108,
`window.EWCharViewer`): a SINGLETON second WebGL context; `mount(host, race,
gender, { accent })`, `setCharacter`, `unmount`, `resetView`, `isMounted`,
`supports`. It loads the race's `RACE_MODELS_3D` GLB through the same cache
as the board (`_loadUnitGLB`, `_cloneUnitModel`), bakes the shared animation
library onto it (`_animLibBakeForModel` → `baked[slot]` for EVERY
`def.libClips` slot: idle, walk, castMagic, castRanged, castMelee, castAOE…
see sprites.js `UAL_SLOTS`) and today plays only `baked.idle`. Drag = yaw,
wheel = zoom, dblclick = reset. `HeroViewer3D` (party-builder.js ~806)
mounts it into `.pb-hero3d` with the 2D sprite as the loading frame
(`ew-cv-loading / ready / fail` host classes, styles-hud.css).

**How the board plays a cast** (what the preview must mirror): battle.js
`triggerCastAnim(unit, spell)` → `state._castAnimKind[uid] =
classifySpellAnimKind(spell)` (sprites.js — 'magic' | 'support' | 'ranged' |
'melee' | 'throw' | 'plant' | 'heal' | 'aoe' | 'slam' | 'arrow' | 'kick' |
'punch' | 'claw' | 'consume' | 'deploy') → three-renderer.js ~18589 turns
the kind into a **fallback chain** (`['castMagic','cast']`,
`['castSlam','castAOE','castMelee','cast']`…) → `_maybeStartModelAnim(uid,
chain)` → `_playUnitModelAnim` (reset · play · `crossFadeFrom(prev,
MODEL_ANIM_FADE)`), one-shot for `min(clip.duration / timeScale, 1.4 s)`,
then the state machine returns to idle. Basic attacks:
`def.basicAttackKind` (sprites.js) → castMelee / castRanged.

**How the board draws a spell's VFX**: battle.js `_stageSpellCast` /
`_fireStageBeat` → `window.VFX3D.fire(intent, spellId, params)`
(three-vfx-effects.js ~3485). Intents: `windup` / `burst` / `finish`
(the data-driven STAGING beats — every spell has them, resolved from
cost / tier / kind / element, no SPELL_MAP entry needed) and the mapped
ones from `SPELL_MAP[spellId]` (`impact`, `aura`, `bolt`, `beam`, `aoe`,
`descent`, `wall`, `chain`, `teleport`). Particles are spawned by
three-vfx.js `ThreeVFX` (one `_scene`, set once by `init(scene)` from the
battle renderer; pooled sprites / quads / globs; `tick(dt)` from the battle
loop). Positions come from `tilePx(tx, ty)` (CONFIG tile maths, px),
`unitSurfaceZ` (`ThreeRenderer.tileTopY` when the board is active) and
`unitZBoost`. `_suppressed()` refuses everything unless `state.phase ===
'battle'`. **online.js WRAPS `VFX3D.fire` to relay host → guest** (~2176) —
a builder preview must never go through the wrapped `fire`.

**The Spell Lab** (ui.js ~9516, Settings → Developer → Spell Library → ⚗)
is the existing "play the real cast" tool: it boots a private 8×8 match and
free-casts through `GAME.doSpell`. It is the reference for what a preview
should look like, not the mechanism (it takes over `state` and the battle
renderer).

**Passives**: data.js `PASSIVE_DEFS[id]` = `{ id, icon, name, desc, …hook
fields }`; `RACE_PASSIVES[race]` = up to two ids; `getUnitPassives(unit)`
adds `flying` first for any unit `canFly` says flies, capped at
`MAX_UNIT_PASSIVES`. The builder also carries `RACE_TRAITS` (party-builder.js
~1409): a hand-written table of terrain rules / design-intent passives per
race (`{ icon, name, desc }`), some `CODED`, some not — today's "RACE
TRAITS · PASSIVES & TERRAIN" list on the assessment sheet.

**The CRT chrome** (match-select.js ~676, styles-base.css "THE TERMINAL"
block ~4210): `.ms-crt.ms-crt-<frame>.ms-crt-<variant>` → `.ms-crt-bezel`
→ `.ms-crt-glass` → `.ms-crt-screen` → `.ms-tty` (head / body / foot) +
`.ms-crt-scan` + `.ms-crt-glare`; `.ms-crt-label` (the paper label),
`.ms-crt-brand`, `.ms-crt-led`. Phosphor vars on `.ms-crt`: `--ph`,
`--ph-dim`, `--ph-faint`, `--ph-gold`, `--ph-teal`, `--ph-green`,
`--ph-red`, `--ph-line`, `--ph-line-hi`, `--ph-glow`. Power-on / off =
`.hq-terminal.on / .off` (`msCrtOn` / `msCrtOff`). Two homes: `#modePage`
(`frame: 'page'`, the monitor on black) and `#hqTerminal` (`frame: 'room'`,
the camera pushed onto a desk's `crt_terminal` prop by
`ThreeRenderer.hq.focusScreen({ counterId })`, map.js `_hqOpenTerminal`).
The match-select IIFE does not export the chrome; the builder renders the
same class structure itself (the CSS is shared).

**Tests that read party-builder.js**: champ-rework.test.js ("Phase 6")
asserts `'gangster': '` and `'nun': '` appear in the source (the
`CODEX_LORE` rows). Keep `CODEX_LORE` and its shape. `npm test` also
syntax-checks every repo JS. Add `party-builder.test.js` in Stage 1 (§5.1).

## 3. The design rules (apply in every stage)

1. **One monitor.** The whole builder lives inside `.ms-crt`. Nothing floats outside the bezel except the sticky notes (§5.5), which are ON the bezel. Overlays (pickers, modals, the locker) are windows drawn on the glass, not browser modals.
2. **The rounding rule.** New chrome is round: `--pb-r: 16px` panels, `--pb-r-sm: 9px` rows, `999px` pills for buttons / chips / tabs, `50%` for portraits, tree nodes, stat discs, type icons, gear slots. The only squares that stay: the D.O.O.R. rubber stamps (`door-stamp`), the paper label, the sticky notes (paper is square), and the MOVE / RANGE footprint diamonds (they ARE the shape of the rule they explain — put them inside a round badge).
3. **Phosphor first, faction second.** The chrome keeps the D.O.O.R. terminal's warm phosphor (`--ph-*`); the selected vessel's **faction colour** (`--pb-fc`, already on the root) tints the active tab, the party ring, the technique panel edge, the summoning circle. Category colours (`_HRLG_CAT`) stay on tree nodes — same coding as the battle action menu.
4. **Type = font + case.** `DotGothic16` for terminal text (uppercase, tracked), `Cormorant SC` for names and headings, `IBM Plex Mono` for the prompt line. Sticky notes get one handwriting face (decision C-6).
5. **Every mechanic keeps its function name.** `pickRace`, `toggleSpell`, `treeNodeClick`, `twinPickSpell`, `flEquipWildcard`, `handleSecJobChange`, `equipAccessory`, `setItemCount`, `confirmSlot`, `doStart`, `saveTeamAs`, `loadTeamPreset`, `tbSaveTeam` — the redesign re-skins, it does not re-implement. If a stage needs to change a rule, it says so in its list.
6. **RULE #2 in the builder.** The builder is local UI (nothing relays), but: (a) the online lock / waiting / start flow in the foot must survive every stage exactly (`isWaitingOnline`, `opponentLockedToo`, `friendlyHostCanStart`); (b) the stage preview must bypass the relayed `VFX3D.fire` (§5.3); (c) `state.partyMeta` shapes are what `applyPartyBuild` and the host's `treeLegalSubset` validation read — untouched.
7. **RULE #1c.** No Playwright. Validation per stage = `node --check` + `npm test` + the source-scan test + reading the render code. The user looks at it.
8. **Mobile survives.** `window.EW_MOBILE` / `@media (max-width: 1180px | 940px)`: the bezel thins, the stats column drops under the stage, the party row scrolls, the tree scrolls. Nothing may require hover.

## 4. The screen (target anatomy — every stage fills a zone)

```
┌ BEZEL ──────────────────────────────────────────────────────────────────────┐
│ ┌ GLASS ─────────────────────────────────────────────────────────────────┐  │
│ │ HEAD  ENTROPY WARS · D.O.O.R. CUSTOMS & ADMISSIONS · VESSEL ASSIGNMENT  │  │
│ │       [officer chip]                      ARENA · 4 SLOTS · ESC hint   │  │
│ │ TABS  [L1]  ( ROSTER )  ( TECHNIQUES )  ( GEAR )  ( DOSSIER )   [R1]   │  │
│ │ ┌ TECH ───────────┐ ┌ STAGE ───────────────────┐ ┌ STATS ───────────┐  │  │
│ │ │ pillar  pillar  │ │      (MOVE PREVIEW)      │ │ ● HP  ▬▬▬▬▬▬ 640 │  │  │
│ │ │  ◯ ─── ◯ ─── ◯  │ │                          │ │ ● MP  ▬▬▬  120  │  │  │
│ │ │  ◯     ◯     ◯  │ │        the hero          │ │ ● ATK ▬▬▬▬  78  │  │  │
│ │ │  ◯     ◯     ◯  │ │      (EWCharViewer)      │ │ ● DEF ▬▬    44  │  │  │
│ │ │  ◯     ◯     ◯  │ │                          │ │ …               │  │  │
│ │ │ ┌ TECHNIQUE ──┐ │ │      ◇ MOVE   ◇ RANGE    │ │ AFFINITIES       │  │  │
│ │ │ │ ◯ RING 2 ·  │ │ │                          │ │ ◯ ◯ ◯ ◯ ◯ ◯      │  │  │
│ │ │ │ FIREBALL    │ │ └──────────────────────────┘ └──────────────────┘  │  │
│ │ │ │ desc · cost │ │                                                    │  │
│ │ │ └─ [ EQUIP ] ─┘ │                                                    │  │
│ │ └─────────────────┘                                                    │  │
│ │ PARTY ROW  ◂  (I)  (II)  (III)  (IV)   ▸        P1 | P2      4 / 4     │  │
│ │ FOOT  ◂ BACK  SLOT II · name · race · job    > forge --slot 2   [SEAL] │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│  ▣ PROPERTY OF D.O.O.R. · FORGE-1 · DO NOT UNPLUG      ENTROPY DATA  ● LED │
└──────────────────────────────────────────────────────────────────────────────┘
   ┌ STICKY ┐ (on the bezel corners)                            ┌ STICKY ┐
   │PASSIVE:│                                                   │TERRAIN │
```

Per tab the body grid changes; the STAGE (the hero) and the STATS column
stay on TECHNIQUES / GEAR / DOSSIER; ROSTER swaps the tree for the champ
grid and slides the stage to the right third (the Union Arms layout).

| Zone      | Tab       | Content                                                                                                 |
| --------- | --------- | ------------------------------------------------------------------------------------------------------- |
| TECH      | ROSTER    | the champ-select grid (full width minus the stage)                                                      |
| TECH      | TECHNIQUES| the three-pillar circuit + the technique panel                                                          |
| TECH      | GEAR      | gear circles · item circles · subclass pill · name · zodiac wheel                                        |
| TECH      | DOSSIER   | the D.O.O.R. customs file (lore, disposition, point of entry, annotation)                                 |
| STAGE     | all       | the hero; MOVE PREVIEW pill; the summoning circle; on ROSTER a hover-preview of the hovered vessel        |
| STATS     | all but ROSTER | vitals + stat pills + MOVE/RANGE + AFFINITIES; on ROSTER a 4-stat quick read under the hero           |
| PARTY ROW | all       | circular portraits, active ring, FILED badge, `◂ ▸`, P1/P2 (local only), `n / size`                      |
| FOOT      | all       | BACK · summary · prompt · CONFIRM n · SEAL / WAITING / START / SAVE TEAM                                  |

## 5. The stages

Each stage is one session's deliverable: the full edited files in chat +
the index.html `?v=` bump (RULE #1b) + `npm test` green + a §9 entry. The
order is deliberate: the skeleton first (everything else hangs on the
tabs), then the user's headline ask (the spell tab + the preview), the
riskiest tech (VFX in the stage) isolated in its own stage with a shipped
fallback behind it, then the champ grid, then the dressing, then the desk
in the building.

### 5.1 · Stage 1 — THE MONITOR: tabs + the party row (the skeleton)

**Goal.** The existing builder, re-homed into a CRT with four tabs and the
party as a row along the bottom. No mechanic changes. Every action reachable
before is reachable after.

**Files.** party-builder.js · styles-base.css · index.html (bump) · NEW
repo-only `party-builder.test.js`.

**Work.**
1. `PB_TABS = [{ id:'roster', label:'ROSTER', hint:'CHOOSE A VESSEL' }, { id:'tech', label:'TECHNIQUES', hint:'EQUIP ITS SPELLS' }, { id:'gear', label:'GEAR' }, { id:'dossier', label:'DOSSIER' }]` (module constant, on `window.PB_TABS` for the test). React state `pbTab`; `Q` / `E` and `[` / `]` cycle (the L1 / R1 caps in the tab bar are clickable too); `1–4` jump. Open on ROSTER; a `pickRace` flips to TECHNIQUES (decision C-1 — default yes).
2. The monitor: the root renders `.ms-crt.ms-crt-page.ms-crt-forge` → `.ms-crt-bezel` → `.ms-crt-glass` → `.ms-crt-screen` → `.ms-tty.pb-tty` + `.ms-crt-scan` + `.ms-crt-glare`; `.ms-crt-label` = `D.O.O.R. · CUSTOMS & ADMISSIONS · FORGE-1 · DO NOT UNPLUG`; `.ms-crt-brand` = `ENTROPY DATA SYSTEMS`; `.ms-crt-led`. `.ms-crt-forge` overrides in styles-base.css (a new "THE FORGE TERMINAL" block right after "THE TERMINAL"): a wider bezel top/bottom (room for the sticky notes later), `--pb-r` / `--pb-r-sm` tokens, the `pb-*` classes below. **Keep `.pb-tarot` on the root** (hover CSS keys off it) and `--pb-fc`.
3. HEAD (`.ms-tty-head`): `DoorSeal` · ENTROPY WARS · `D.O.O.R. · CUSTOMS & ADMISSIONS · VESSEL ASSIGNMENT` (standalone: `RECORDS · SQUAD MANIFESTS`) · `OfficerChip` · mode + `n SLOTS` · `[ESC] BACK`.
4. TABS (`.pb-tabs`): pills, active pill in `--pb-fc` with the phosphor glow, the hint under the bar (`CHOOSE A VESSEL` etc.), `[L1]` `[R1]` end caps.
5. BODY (`.pb-body[data-tab]`): a CSS grid per tab —
   `tech`: `clamp(330px,30vw,470px) minmax(0,1fr) clamp(240px,21vw,320px)`;
   `gear` / `dossier`: `clamp(300px,26vw,420px) minmax(0,1fr) clamp(240px,21vw,320px)`;
   `roster`: `minmax(0,1fr) clamp(300px,27vw,420px)` (grid | stage+quick stats).
   **The stage is rendered ONCE** (`.pb-stage`, stable React key, always mounted) and placed by `grid-area`; tabs change the template, never the element — `EWCharViewer` is a singleton canvas and must not remount per tab (the codex → builder handoff already relies on this).
6. Move the existing pieces into the tabs, unchanged inside: ROSTER ← the Codex of Vessels grid + its filter row; TECHNIQUES ← `SpellTreePanel` (+ the flat-pool / slot-rack fallback, the node picker overlay, the RND / RST / CLR tools); GEAR ← gear rail, item rail, subclass bar, NAME, ZODIAC; DOSSIER ← the customs file. STATS column ← `VitalBar` / `StatBar` / `RangeDiamond` / `RACE_TRAITS` (the traits list moves out in Stage 5).
7. PARTY ROW (`.pb-party`): `◂` cap · one `.pb-party-slot` per slot: a `border-radius:50%` portrait clip (`PortraitSprite`, `object-fit: cover`), a 2px ring in the slot's faction colour (active: 3px + glow + 1.12 scale), the numeral in a small disc top-left, the FILED stamp (`door-stamp door-stamp-sm admit`) bottom-right, name under, `RACE · JOB` under that · `▸` cap · `P1 | P2` toggle when `state.showPlayer2Builder` (local only; sets `builderSelectedPlayer`) · `n / size` counter. `←` / `→` move the selection; `selectSlot` semantics unchanged. Under 940px the row scrolls horizontally.
8. FOOT (`.ms-tty-foot`, the match-select classes): `◂ BACK` (`ms-tty-btn danger`) · `.ms-tty-sum` (`SLOT II · <name>` / `race · job · spells 5/6`) · the prompt `> forge --slot 2 --job "Black Mage"` · `.ms-tty-spacer` · the dice (`🎲 ONE` / `🎲 ALL` / `RESET`, `★ SAVE` / `↑ LOAD`) as small `ms-tty-btn`s · `CONFIRM II` · the primary (`ms-tty-btn primary`): SEAL YOUR FATE / ⌛ WAITING… / ⚔ START MATCH / 💾 SAVE TEAM — same conditions as today, verbatim.
9. Overlays → glass windows: `.pb-window` (rounded, `--ph-line` border, the phosphor black, a title strip, ✕): the team modal, the equip / subjob / item picker, the node picker. The standalone locker stays a full-glass view (`.pb-locker`) with rounded team cards.
10. `party-builder.test.js` (repo tooling, `node --test`): source-scans party-builder.js for `PB_TABS` with the four ids, the `.ms-crt-forge` root, `.pb-party`, one `.pb-stage`, the lock-flow names (`isWaitingOnline`, `opponentLockedToo`, `friendlyHostCanStart`, `doStart`, `confirmSlot`), the mechanic names in rule 3.5, and that styles-base.css carries `.ms-crt-forge` + `.pb-tabs` + `.pb-party`. Grows with every stage.

**Acceptance.** Pre-match VS CPU, online host + guest, standalone archive: every button works; keyboard tabs; the viewer survives tab switches without a reload; `npm test` green; index.html bumped.

**Risks.** `#builderOverlay` sits inside `#battlePanel` (a grid panel) — the CRT root needs `position:absolute; inset:0`. The old `.pb-*` CSS block at styles-base.css ~1106–3150 ("Character Select Screen v2") is dead legacy from an earlier builder — leave it (deleting is a separate cleanup; note it in §9 when confirmed unused). `EWCharViewer.unmount()` in `_unmountReactPartyBuilder` stays.

### 5.2 · Stage 2 — TECHNIQUES: the circuit, the technique panel, the move preview (animation)

**Goal.** The spell tab looks like the references (three pillars of glowing
circles with taglines, the technique panel under it) and the hero PLAYS the
cast animation when a technique is hovered or equipped.

**Files.** party-builder.js · styles-base.css · three-renderer.js
(`EWCharViewer.play` / `playSpell`, shared cast chain) · index.html (bump) ·
party-builder.test.js.

**Work.**
1. **The circuit.** `TREE_NODE_POS` stays (same keys, same legality). Connectors become SVG `<path>`s with `stroke-linecap: round`, lit segments in the phosphor, the hover path in gold, dashed for unlit. Chips: 50px circles (ring-4 capstones 58px with a thin outer ring instead of the ♛), the category glyph inside, the twin ⇄ as a satellite disc, sockets as dashed gold rings, sealed as a 🔒 disc in `--ph-faint`. Pillar heads become pills: title (`BLACK MAGE` / `<RACE>` / `SUBCLASS ▾`) + a tagline line under (`Discipline destroys.` style — decision C-5: Claude drafts the ~30 job + ~98 race taglines for approval, or the user writes them; until then the line shows the pillar's spell count, `4 TECHNIQUES`).
2. **Selection model.** `techSel` (node key) + `techHover`. Mouse: hover previews, click selects + does what it does today (`treeNodeClick` / `onTwinPick` / `onSocketClick`). Keyboard: `↑ ↓` along a pillar, `← →` across pillars, `ENTER` = click, `BACKSPACE` = unequip. The panel follows `techHover || techSel`.
3. **The technique panel** (`.pb-technique`, bottom of the TECH column): a 44px category disc with the glyph · `RING 2 · TIER II · DAMAGE` · the name (Cormorant) · desc · a chip row: `AP n` / `MP n` / `RNG n` / `AOE r` / `PWR n` (`pbPowerStat`) / the type badge with the matchup words (`pbTypeBadgeStyle`, `pbDmgIcon`) / status effects (`pbSpellEffects`) / `n SLOT(S)` · the verb pill: `EQUIP` / `UNEQUIP` / `⇄ PICK` / `＋ BROWSE` / `SEALED — <why>` / `PATH: +2 NODES` (auto-equips the path, as today). The hover tooltip (`buildSpellTooltip`) stays for the picker rows and the flat pool only.
4. **The picker** (twin / wildcard) as a `.pb-window` over the TECH column with rounded rows (`SpellBlade` restyled: `--pb-r-sm`, the slot numerals in discs).
5. **`EWCharViewer.play`** (three-renderer.js):
   - `_cvSetCharacter` keeps the WHOLE baked map: `v.clips = baked` (or the per-character `def.clips` table for `noAnimLib` defs), `v.actions = {}` built lazily via `mixer.clipAction`, idle as today.
   - `play(names, opts)`: `names` = a slot or a fallback chain; first slot with a clip wins; `LoopOnce`, `clampWhenFinished`, `timeScale` = the same per-slot scale the board applies (`def.libTimeScales[slot]`, else `UAL_SLOTS[slot].ts`), `reset().play()`, `crossFadeFrom(idle, 0.12)`; on `finished` crossfade back to idle. Returns the clip's ms (capped at 1.4 s like the board — `opts.full` lifts the cap for the preview). One preview at a time: a new `play` cuts the old one.
   - `playSpell(spell, def?)`: `classifySpellAnimKind(spell)` → the chain. **Extract the board's inline chain table (three-renderer.js ~18589) into `_castChainFor(kind)`** and use it from both sites so the preview can never drift from the battle. The root node (Basic Attack) uses `def.basicAttackKind` → `castMelee` / `castRanged`, like `triggerAttackAnim`.
   - `onState` callback (`{ playing: slot | null, ms }`) → the builder shows the `MOVE PREVIEW` pill over the stage while a clip runs.
   - Sprite-only vessels: `play` returns 0; the pill says `NO PREVIEW · SPRITE VESSEL`.
6. **Triggers** in the builder: node hover → `playSpell` after a 180 ms debounce, only if idle; node click / equip / twin pick → `playSpell` immediately (restarts); the technique panel's verb pill has a small `▶ PREVIEW` next to it for keyboard users. `state.animationsDisabled` and `window.EW_NO_PB_PREVIEW` disable the trigger (the pill says `PREVIEW OFF`).
7. Test: the chain helper is shared (`_castChainFor` appears at both call sites), `EWCharViewer` exposes `play` / `playSpell`, `PB_TABS` unchanged, `.pb-technique` present.

**Acceptance.** Tree legality identical (twin / wildcard / path / sealed);
keyboard-only equip works; every 3D-ready race plays a cast clip on hover
(the user checks a handful; RULE #1c); no new asset loads (the library bake
is the board's, cached per model).

**Risks.** A `def.noAnimLib` vessel loads per-character Meshy clip GLBs on
demand (the board's legacy path) — slower, fine. Long clips (`castTrap`
4 s at 0.25×) — the cap holds unless `opts.full`. The board's
`_maybeStartModelAnim` is untouched; only the chain table moves.

### 5.3 · Stage 3 — THE SPELL LIGHTS UP THE STAGE (VFX in the viewer)

**Goal.** Equipping or previewing a technique fires its real VFX around the
hero — the staging beats at the caster, the spell's own effect at a dummy
target two tiles to the side — and the monitor reacts (a colour grade, a
scanline roll, the DOOR click).

**Files.** three-vfx.js (`attach`) · three-vfx-effects.js (the stage
adapter) · three-renderer.js (viewer stage group, `ThreeVFX.tick` in
`_cvFrame`) · party-builder.js (the trigger, the CRT beat) · styles-base.css
(grades) · index.html (bump) · party-builder.test.js.

**Work.**
1. **`ThreeVFX.attach(parent)` / `detach()`** (three-vfx.js): re-parent every pooled object (`_spritePool`, `_worldMeshPool`, `_quadMeshPool`, `_globPool`, live particle clouds) from `_scene` to `parent` and remember the board scene; `detach()` puts them back. `init(scene)` stays single-shot; the battle renderer's `ThreeVFX.init(scene)` (three-renderer.js ~25314) is unaffected. Nothing is allocated twice.
2. **`VFX3D.stage`** (three-vfx-effects.js): `enter({ group, tilePx, heroH })` / `exit()` / `fire(intent, spellId, params)`. While staged: `_suppressed()` returns false regardless of `state.phase`; `tilePx` maps tile (0,0) to the hero's feet and (2,0) two tiles to screen-right in a frame whose "tile" is `tilePx` world units (the viewer's hero is ~1 unit tall; `_cfg()` returns `{ tileSize: 128, boardPadding: 0 }` and the **stage group is scaled `tilePx / 128`** so every px-authored size lands right); `unitSurfaceZ` → 0; `unitZBoost` → `heroH × 0.5` in px; `window.shakeBoard` → a CRT jolt callback instead; `_spell3DGeometry[id]` builders and `ThreeLightning` are SKIPPED unless tagged `stageSafe` (they reach into the board renderer). **`stage.fire` calls the internal `fire` implementation directly — never `window.VFX3D.fire`, which online.js wraps for the host → guest relay** (rule 3.6b). Add a source-scan assertion that party-builder.js contains no `VFX3D.fire(`.
3. **The viewer side** (three-renderer.js): `_cvEnsure` adds `v.vfxGroup` (a `THREE.Group` at the origin); `_cvFrame` calls `ThreeVFX.tick(dt)` while `v.staged`; `EWCharViewer.stageEnter()` / `stageExit()` wrap `ThreeVFX.attach(v.vfxGroup)` + `VFX3D.stage.enter(...)`; `unmount()` always exits the stage (so the pools are back in the board scene before any match starts — `startMatch` → `_unmountReactPartyBuilder` already runs first). A faint 5×3 tile grid decal (phosphor, 8 % opacity) under the hero so AoE footprints read.
4. **The beat script** (`EWCharViewer.previewSpell(spell, opts)`): yaw the hero to face screen-right (tween `v.yaw` → −90° over 200 ms; restore after), `stage.fire('windup', id, { sx:0, sy:0, tx:2, ty:0 })`, `playSpell` (Stage 2), at 45 % of the clip `stage.fire('burst', …)` then the mapped intent(s) at the target: `aura` for self / ally casts at (0,0), else `impact` / `bolt` / `beam` / `aoe` / `chain` at (2,0) (`hasMapping` decides; `descent` / `wall` / `teleport` at (2,0) too — they are the fun ones), `finish` at the end. One preview at a time; a new one clears the live particles (`ThreeVFX.clear()` if present, else let them die).
5. **The monitor reacts** (party-builder.js + styles-base.css): `.ms-crt-forge[data-grade="<spellType>"]` for 600 ms — six grades reusing the ENTROPY STRIKE typed palettes (styles-cinematic.css `.ews-t-<id>`: human / alien / divine / unholy / tech / anomaly); a scanline roll (`.pb-crt-roll`); `playDoorSfx('crtOn', { volume: 0.3 })` on equip, `'stamp'` on CONFIRM (already), the jolt class on `shakeBoard`. Gated by `state.animationsDisabled` / `EW_NO_PB_PREVIEW`.
6. Test: `attach` / `detach` exist, `VFX3D.stage` exists, the viewer exposes `stageEnter` / `stageExit` / `previewSpell`, no `VFX3D.fire(` in party-builder.js.

**Acceptance.** A preview in the builder shows the same particles the Spell
Library lab shows for that spell; no particle survives into the next match;
an online room's guest never receives a preview relay (host + guest both in
the builder — nothing appears on the other screen); kill-switch works.

**Risks — the highest of the plan.** three-vfx-effects.js is 23 k lines of
board assumptions. The adapter overrides the four coordinate helpers and one
gate; anything that reaches `ThreeRenderer.*` directly stays off the stage
(the `stageSafe` whitelist grows by inspection, effect by effect). **Stage 2
is the shipped fallback**: if the adapter slips, the animation-only preview
stands and this stage retries.

### 5.4 · Stage 4 — ROSTER: the champ-select grid + the rounding pass

**Goal.** The ROSTER tab is the Smash / Mortal Kombat wall: a grid of
portrait tiles, hover shows the vessel on the stage, click seats it in the
active slot. Plus the sweep that rounds every remaining square.

**Files.** party-builder.js · styles-base.css · index.html (bump) ·
party-builder.test.js.

**Work.**
1. `.pb-roster`: fixed-size tiles (`--pb-r` corners, `aspect-ratio: 1`, the 128×128 portrait when `getUnitPortraitUrl` has one else the sprite bottom-anchored, a 2px faction ring on hover / active, three tiny type dots, ★ favourite, 🔒 → `_goToShop(race)` as today), one flat grid (decision C-4) sorted by `sortKey`, faction bands as thin coloured rules between groups when sorted by faction.
2. Hover → `EWCharViewer.setCharacter(race, gender)` after 220 ms (cached GLBs swap instantly; uncached ones show the summoning ring, as the codex does); leaving the grid → back to the slot's vessel. Click → `pickRace(race, gender, job)` (unchanged) → the party ring pulses → TECHNIQUES (C-1).
3. Filters as round chips: faction ×3 (coloured rings), type ×6 (circles with the type glyph, `TYPE_C`), the job dropdown → a `.pb-window` list, search as a pill input, sort as a pill menu. `filteredRoster` / `rosterEntries` logic unchanged.
4. The right pane on ROSTER: the stage + a card under it: name · race · job · type chips · four quick pills (HP ATK DEF SPD) · `CONFIRM n` (`confirmSlot`).
5. **The rounding pass** (rule 3.2) across every element still square after Stages 1–3: `EquipSlotBox` → circles; `SpellBlade` rows; the locker's team cards and mini portraits; the picker rows; the codex chips; every `clipPath` polygon removed. Stamps and diamonds excepted.
6. Test: `.pb-roster` present, no `clipPath` left in party-builder.js except inside `door-` markup.

**Acceptance.** Unlock gate, favourites, filters, P2 (CPU) team editing,
standalone NEW TEAM all behave as before.

### 5.5 · Stage 5 — STICKY NOTES, STAT PILLS, AFFINITIES, GEAR, DOSSIER

**Goal.** The dressing: passives as paper notes on the bezel, the stats as
the references draw them, the affinity ring, and the two quiet tabs.

**Files.** party-builder.js · styles-base.css · index.html (bump + one
Google-Fonts family for the handwriting, decision C-6) ·
party-builder.test.js.

**Work.**
1. **Sticky notes** (`.pb-notes`, a layer over the BEZEL, outside the glass; corners top-right and bottom-left like the references, a third at bottom-right if needed): one note per passive from `getUnitPassives({ race, gender, … })` (a pseudo-unit built from the slot's identity — it resolves `flying` first, the race's ids after, capped like the engine), paper colour per faction (pink / yellow / cream), rotation seeded by the race id (±3°), a folded corner, the handwriting face. Text = `PASSIVE: <name>` (underlined) + `desc` (Claude-written mechanics; user-authored marginalia = decision C-7). `RACE_TRAITS` terrain rules become a smaller `TERRAIN` note. Max three; overflow → a paperclip `+n` that opens a `.pb-window` list. Hover / focus lifts the note (`translate(-2px,-4px)`, a deeper shadow) and shows the full text. Notes never overlap the glass content (the bezel is wider since Stage 1).
2. **Stat pills** (`.pb-stat`): a 22px round disc (stat colour + a glyph: ♥ HP · ◆ MP · ✊ ATK · 🛡 DEF · ✦ M ATK · ◈ M DEF · ➶ SPD · ◉ AWR · ✧ CRT · ↯ EVA) · label · a rounded bar (`--pb-r-sm`) · the value; zodiac ▲▼ and subclass / gear deltas as today (`VitalBar` / `StatBar` restyled, `computeFullStats` untouched); the grade chip → a tiny ring; MOVE / RANGE diamonds inside round badges.
3. **AFFINITIES** (`.pb-affinity`): six circular type icons (`TYPE_C` colour, the type glyph). For the vessel's own type(s) the ring reads incoming matchups from `TYPE_CHART`: `WEAK` (red ring, ×1.30), `RESIST` (green ring, ×0.75), neutral (faint). Hover → `takes 1.3× from ALIEN`.
4. **GEAR tab**: two accessory circles + three item circles flanking the hero (the pickers unchanged), the SUBCLASS pill (opens the subjob picker; `handleSecJobChange` as today), NAME as a pill input, ZODIAC as a wheel of twelve round glyph chips (`ZODIAC_ICONS`, `handleZodiacChange`) with the nature's buff / debuff named under it.
5. **DOSSIER tab**: the customs file as it is (stamps stay square), the lore in Cormorant, the `TOP SECRET // NOFORN` foot.
6. Test: `.pb-notes` reads `getUnitPassives`, `.pb-affinity` reads `TYPE_CHART`, no `<select>` in party-builder.js except the sort menu (decision C-9).

**Acceptance.** Every number equals today's (same helpers); the notes show
`flying` for SKY_RACES and both passives for the werewolf; the wheel sets
the same `zodiac` value the `<select>` did.

### 5.6 · Stage 6 — THE DESK: the forge in the building, sounds, kill-switch

**Goal.** In the D.O.O.R. headquarters the builder runs on a real desk's CRT
(camera push, power-on) and the pre-match flow stays on ONE monitor: the
site terminal FILES the crossing, the same screen swaps to the forge, SEAL
leaves the building into the crossing cinematic.

**Files.** map.js (`_hqOpenTerminal` kind `forge`, the swap) · ui.js
(`renderBuilder` host choice) · party-builder.js (mount opts `{ host, frame,
variant }` like match-select) · data.js (the forge counter on a desk,
decision C-8) · styles-base.css (`.hq-terminal .ms-crt-forge`) · index.html
(bump) · doorhq.test.js + party-builder.test.js.

**Work.**
1. `window._mountReactPartyBuilder(opts)` accepts `{ host: 'builderOverlay' | 'hqTerminal' | 'teamBuilderBody', frame: 'page' | 'room', variant: 'match' | 'archive' }`; `frame: 'room'` = transparent bezel over the pushed camera (the `.hq-terminal` rules already do this for `.ms-crt`).
2. The one-monitor pre-match flow: when `_msConfirm` runs inside an open HQ terminal and the filed mode needs a party, map.js swaps programs instead of closing — `_hqTerminalSwap('forge')`: unmount match-select from `#hqTerminal`, mount the builder there (`frame: 'room'`, `variant: 'match'`; the building stays suspended, `_hqSuspend`); ui.js `renderBuilder()` mounts into `hqTerminal` when `window._hqTerminalIsOpen()`. `◂ BACK` swaps back to the SITE terminal (the crossing record is still `window._hqPreselect`). `SEAL` → `_hqTerminalClose({ launch: true })` → the existing start path (`doStart` unchanged, the return spot stays the console — `_hqLastDoor`). ESC = STEP AWAY (`_hqTerminalClose()`, power-down, `unfocus(560)`, `_hqResume`) — the walker's `onEscape` already checks `_hqTerm` first.
3. The standalone forge on a desk: a `crt_terminal` prop + a counter `{ id: 'forge', label: 'THE FORGE', sub: 'SQUAD MANIFESTS', verb: 'USE', action: { overlay: 'forge' }, radius: 1.5 }` in the room decision C-8 picks (recommend the OFFICE — your own desk, next to the in-tray); `_hqConsoleTerminal` routes `overlay: 'forge'` → `_hqOpenTerminal({ variant: 'archive', counterId: 'forge', kind: 'forge' })`; the Quartermaster door's `alt: PARTY BUILDER` keeps pointing at `_goToTeamBuilder` (the monitor on black) until the desk ships, then points at the desk. doorhq.test.js learns the counter (the room register is untouched — a counter wears no number).
4. Sounds: `uiCursorMove` on tab / row moves, `crtOn` on power-up (map.js already), `vhsEject` on power-down, `stamp` on CONFIRM, `dotMatrix` on SAVE TEAM, `identSting` on SEAL.
5. Kill-switch: `?nopbcrt` / localStorage `ew_pb_crt='off'` / `window.EW_NO_PB_CRT` → the same tabs and row without the bezel (a flat phosphor page). `EW_NO_PB_PREVIEW` (Stages 2–3) stays.
6. Docs: a CLAUDE.md paragraph ("THE FORGE TERMINAL"), a PLAYTEST_NOTES section (the `window.GAME`-side hooks a future playtest would drive: `PB_TABS`, `_pbSetTab`, the row keys), §9 here.

**Acceptance.** HQ: console → SITE → FILE → the forge on the same glass →
SEAL → the crossing; STEP AWAY at every step returns to the walk with the
pointer lock released (the dead-cursor rules in CLAUDE.md "THE TERMINAL").
`?nohq` route: the monitor on black, as Stage 1. `npm test` (doorhq +
party-builder) green.

## 6. Decisions awaiting the user (answer inline; Claude proceeds on the recommendation if unanswered)

| #   | Question                                                                                                  | Recommendation                                                                                              |
| --- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| C-1 | Picking a vessel on ROSTER flips to TECHNIQUES automatically?                                             | Yes — that is the references' flow (select entity → techniques). `CONFIRM n` stays on every tab.            |
| C-2 | Tab names: ROSTER · TECHNIQUES · GEAR · DOSSIER, or STATUS · SKILLS · LOADOUT · ARCHIVE?                   | ROSTER · TECHNIQUES · GEAR · DOSSIER (the game already says "abilities/techniques", "gear", "dossier").     |
| C-3 | STATS: a persistent right column, or its own tab?                                                         | Persistent (every reference keeps the stats on screen); ROSTER shows a 4-stat quick read.                  |
| C-4 | The champ grid: one flat wall (Smash) or faction sections?                                                | One flat wall, sortable, faction rings + thin band rules when sorted by faction.                            |
| C-5 | Pillar taglines ("The Mind Reaches Further."): Claude drafts for approval, user writes, or none?           | Claude drafts a table (jobs + races) in a later session; until approved the line shows `n TECHNIQUES`.     |
| C-6 | The handwriting face for the sticky notes (one Google Fonts family, allowed by the CSP allowlist)?          | `Caveat` (readable at 12–14px, looks like a marker); alternative `Kalam`.                                    |
| C-7 | Sticky-note marginalia (a second, user-voiced line under the mechanics — A15 rule: lines are user-authored)? | Data slot `PASSIVE_DEFS[id].note` (string) read if present; Claude never writes it.                        |
| C-8 | Which desk hosts the standalone forge in the HQ: the OFFICE (your desk, by the in-tray) or DISPATCH?       | The OFFICE — your manifest is filed from your own desk; DISPATCH's screen stays the crossing terminal.       |
| C-9 | Keep any native `<select>`? (sort menu is the last one)                                                   | Replace it too in Stage 4 (a pill menu) — one input language on the glass.                                 |
| C-10| Preview trigger: hover previews the animation, click adds the VFX — or VFX on hover too?                   | Hover = animation only (cheap, calm); click / equip = animation + VFX + the monitor beat.                   |

## 7. Keyboard (and the pad, when the bindings screen gets a builder page)

| Key                 | Action                                                 |
| ------------------- | ------------------------------------------------------ |
| `Q` / `E`, `[` / `]`| previous / next tab (L1 / R1)                          |
| `1`–`4`             | jump to a tab                                          |
| `←` / `→`           | previous / next party slot (the row)                   |
| `↑ ↓ ← →` (TECH)    | move across the circuit (arrows on the row only when the tree has no focus) |
| `ENTER`             | equip / pick / confirm the focused thing; on the foot = SEAL |
| `BACKSPACE`         | unequip the focused node                               |
| `SPACE`             | replay the preview                                     |
| `ESC`               | close a window → BACK / STEP AWAY                      |

## 8. Kill-switches and fallbacks

- `window.EW_NO_PB_CRT` / `?nopbcrt` / localStorage `ew_pb_crt='off'` — the flat page (Stage 6).
- `window.EW_NO_PB_PREVIEW` — no cast clips, no VFX (Stages 2–3); `state.animationsDisabled` implies it.
- `window.EW_DISABLE_3D_UNITS` — the viewer already refuses; the sprite stays, the pill says NO PREVIEW.
- Stage 3 absent or failing → Stage 2's animation-only preview is the shipped behaviour.
- No React (`window.React` missing) → ui.js's legacy fallback path is unchanged.

## 9. Build log (append every session)

- **2026-09-09 — rev 1.** Plan written from the seven references and a read of party-builder.js, match-select.js, the `EWCharViewer` block, the VFX binding (`ThreeVFX.init` single-scene, `VFX3D.fire` relayed by online.js), `classifySpellAnimKind` + the renderer's cast chain, `PASSIVE_DEFS` / `getUnitPassives`, the HQ terminal plumbing. Nothing shipped. Next: Stage 1.
