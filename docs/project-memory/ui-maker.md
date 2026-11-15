---
name: ui-maker
description: UI Maker (theme engine + editor screen in hud.js): what each pass added (PR #174 to pass 27 crit look) and where to extend it
metadata:
  type: project
  modified: 2026-10-20T01:16:23.789Z
---
mondo asked (2026-10-08) for a UI editor: themes, panel shapes, 9-slices, per-menu themes. All code at the end of hud.js; `window.openUiMaker()`; entries: Settings → Display → HUD Theme, both pause menus, editor 🎨 UI, F4 anywhere (Layout). Store localStorage `ew_ui_maker`, viewer-local, nothing relayed. Full notes: docs/notes/ui-menus-audio.md "THE UI MAKER" passes 1-27.

**Why:** the next thread must extend this rather than rebuild it.
**How to apply:** theme a new screen = one UIM_SURFACES row (+ UIM_SPECIMENS stand-in); Layout pieces = rows `[surf, id, label, sel]` after UIM_PIECES; menus with rows in no panel need a panel role (PR #181). Prove every control in a real battle.

- 1-15 (PR #174-#281): engine, skins, presets, undo, db.layout, live view, db.hero/bars/icons, stand-ins (mountStage); db.ux (rings, plates, bars, AP icons); unit card q*.
- 16 (PR #283): Layout on every screen (`surf`, Screen picker, snap, LOOK_DEF, db.words, db.picks).
- 17, 18, 20 (PR #288/#293/#301): free card parts (qParts), action list = own piece `qlist`, card never moves; QuickPeek; TEXT_PARTS `t:<part>:<key>`; shaped part skins.
- 19 (PR #298): Portraits mode `faces` (window.EWFaces.url, db.faces, `_ewFaceGen`).
- 21 (PR #306): Arrows + tiles mode `aim`: db.ux w*/t* → window._ewArrowLook/_ewTileLook + V; uLk* uniforms (GLSL + TSL); `ThreeRenderer.lookPreview(canvas, mode)` = the dock's board.
- 22 edge (PR #335, #338): Skins > Button/Selected "Colour edge" (skin.edge on,w,gap,ends,a,c,dead) = edgeCss ::before clip-path from edgeChain(shape), clamped so end gaps never cross; no skin = legacy inset line. Trapezoid shape `trap` (Slant, Lean -> `trapl` via shapeKey). PR #354 (10-20): Parallelogram `para` = own shape, same outline as `trapl` (Slant +right / -left); he wants both kept.
- #310 strike arrow; #327 default theme p_entropy. PR #612 (10-27): p_entropy = his newer export Entropy_Wars_Theme.ewtheme1.json (para buttons, purple-blue sel, Press Start 2P, Ghiya titles); the 10-18 one kept as p_entropy_1018. New theme export to bake = replace p_entropy literal verbatim, keep the old as a dated preset.
- 24 (PR #336, 10-19): Floating text mode `float` (dock button Pops): db.ux f* + fc<Kind> → floatSignal → window._ewFloatLook (only changed keys) + V; three-renderer shared `_floatSpawn`/`_floatStep(ctx)`; `ThreeRenderer.floatPreview(host)` = model + plate + pops; index.html lists Cinzel 400.
- 23 zones (PR #334): Arrows + tiles > "Spawn + nexus zones" tab (UI.aimPrev): db.ux zs*/zn* → window._ewZoneLook + _ewZoneLookV; three-renderer THE ZONE LOOK (paint + additive light layer, light walls Wall 0 default); defaults twice (ZONE_LOOK_DEF + hud zoneDefs); reset groups via uxGroupOf. PR #348: "Edit both together" (db.ux zLink, zoneTwin mirrors zs<->zn, asks which look to start from if they differ) + Copy Spawn→nexus / Nexus→spawn.
- Fonts (PR #350): FONTS [null, group] entries = optgroups; 61 Google fonts in index.html MORE FONTS link (add in BOTH, same order); fFont = list + sample.
- 25 combat pop-ups (PR #352, 10-20): map.js showCombatBanner `.combat-banner` (opportunity attack, Nexus, flag, key...) joined the battlePop surface + piece `ppcombat` "Combat pop-up". Other battle pop-ups still on old look (round banner, turn sweep, intro, Entropy Strike cards, acam chrome, achievement toasts): list in ui-menus-audio.md pass 25.
- 26 Pops (10-21): his 7 R2 fonts (Assets/fonts/, @font-face in index.html) = "Your fonts" group first in FONTS. Side by side/Scatter = THE BUNCH: a pop picks its spot once (fBunch size). Per kind: fk<Kind>Font/Weight/Size. Preview loops the clicked beat. Never per-frame layout (he hated it).
- 27 crit look (PR #391, 10-21): Pops > Critical hit: fCrit stamp|text|off + fCrit* (word, shape burst/plate/star/round/none, where, size, tilt, font, colours, glow) -> _ewFloatLook.crit; battle.js _hitReadStampGeo/_hitReadStamp; text = 'crit' word pop. Old fStamp migrated.
- 30 (PR #526, 10-25): spell button badge looks, k* keys [[spell-buttons]]
- 33 (PR #1039, 11-07): Layout > any piece > "Arrange + screen side" (LOOK_DEF flow/gap/jal = parts across or stacked, pin/pinM/pinA = stick to a screen side, position:fixed). Team select buttons each a piece (sqbback, sqbsize, sqbrnd, sqbedit, sqbnew, sqbgo); TEXT_PARTS sqbar. Shipped: button column left under the title bar. [[ui-buttons-stamp-20261024]]
- Sandbox: ?ew_gpu=webgl2.

Related: [[editor-plan]] [[damage-numbers]].
