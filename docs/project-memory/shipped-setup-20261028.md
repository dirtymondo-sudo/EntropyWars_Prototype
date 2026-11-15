---
name: shipped-setup-20261028
description: SAVE EVERYTHING export + bake-setup.js (2026-10-28): his UI Maker exports were theme-only, zones/plates/Settings never left his browser; how his look now ships
metadata:
  type: project
  modified: 2026-10-28T12:16:19.210Z
---
mondo 10-28 (furious-ish): our screenshots lacked his Nexus zones + nameplates although he "exported the data from the ui maker";
"Every single change to the game needs to be exported so you can bake it, i cant sell a game to people and realize too late that
they are all running a different experience than i intended" ... "you need to make the export have that data".

- CAUSE: UI Maker Share > "Save file" wrote only the open theme. His two uploads (10-18 d933f6ea, 10-27 eacce0fb in
  uploads/hearth) are theme-only `{ewTheme, theme, slices}`. db.ux (zones zs*/zn*, plates p*, m*, pops f* ...), layout, bars,
  hero, faces, btns and every Settings value (ew_plateStyle ...) never left his browser.
- FIX: "Save everything" (UI Maker > Share, Settings > Video > HUD Theme row, `EW_SAVE_SETUP()`) writes
  Entropy_Wars_Setup_<date>_<hhmm>.json (format entropy-wars-setup: ui = whole store, keys = every setting). Old button = "Save theme".
- BAKE: `node bake-setup.js <file>` → hud.js UIM_SHIPPED (SHIPPED-UI markers) + index.html SHIPPED-KEYS (look keys ew_hud_theme,
  ew_plateStyle, ew_ringVitals). Other Settings keys only with --keys after asking him (his bloom/fog/light-rays OFF rules).
  Device keys never. Editors (race/spell/data/audio/map) already had complete exports with their own routes.
- Layering: own values win; untouched baked values follow later bakes; resets land on the shipped look.
- Other editors audited: Race Editor, Spell Library, Data Panel export their whole doc; map editor FILE > EXPORT zip; fine.

**Why:** a theme-only file must never again be taken as "his setup".
**How to apply:** when he sends a setup file, bake with bake-setup.js, show him the listed Settings values and ask which ship.
HIS REAL FILE BAKED 11-01 (PR #713, zip ENTROPY_WARS_SYNC_20261101-0042): he said "implement into the game", so ALL his Settings
values shipped (--keys all) incl. light rays 0.1, night mood 0.1, filmic, CRT, retro fog, flagged to him. Perf-preset knobs
(units3d/shadows/aa/fxaa/ambientFx) now per-computer in bake-setup.js (phone OOM guard). His Data Panel edits (ew_data_mods_v1)
also baked into data.js: element weak 1.25/resist 0.75 (hard-coded 1.5/0.5 copies now read the table), skate speeds, 26 AREA UNITS
room tables. Check ew_data_mods_v1 in every future setup file: it carries real game edits.
Proof shots /mnt/project-files/shipped-setup/. Notes docs/notes/ui-menus-audio.md "pass 32". [[ui-maker]] [[visual-rules]]
