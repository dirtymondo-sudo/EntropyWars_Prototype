---
name: spell-picker-columns
description: Party builder spell picker rework 2026-10-01 (PR #40): one column per family, fixed info panel, no tier labels, no forge scanlines
metadata:
  type: project
  modified: 2026-10-01T10:27:24.122Z
---
MERGED 2026-10-01 (PR #40, main 86283fc, token 20261001-spellpicker-01-cors). R2 files: party-builder.js, styles-base.css
(index.html is the repo's). Zip target: /mnt/project-files/spell-picker/ENTROPY_WARS_SPELL_PICKER.zip, written 2026-10-01 after mondo said "write the zip".

mondo's asks: family columns showing every spell at once, no tiers anywhere (SP cost says it), CRT scanlines removed,
CLEAR button back, info panel must not cover spells (it grew over the rack and flickered on hover).
Notes: docs/notes/ui-menus-audio.md "THE FAMILY COLUMNS". Supersedes THE FAMILY TABS in [[spell-library-plan]].
Open: the HQ pause menu's party rack (map.js) still shows tier rows; offered to mondo as a follow-up.
Follow-up 2026-10-01 (PR #41, token 20261001-spellpicker-02-cors, zip spell-picker/ENTROPY_WARS_STAT_COLORS.zip =
party-builder.js, ui.js, map.js, styles-base.css; supersedes the picker zip): stat bars one ivory everywhere, grade faces
F red, C orange, B yellow, A green, S blue/silver (styles-base.css .ew-grade.grade-*).
