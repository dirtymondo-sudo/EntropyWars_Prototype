---
name: spell-buttons
description: Spell button look + top/bottom row layout shared by the Abilities list, quick menus and desc bar (PR #366)
metadata:
  type: project
  modified: 2026-10-20T10:57:48.015Z
---

- Damage-kind icon = the button glyph: ⚔ physical, three diamonds magic (hud.js EW_MAGIC_PATH SVG). The old burst/orb marks are gone; mondo chose "sword + magic wand or 3 diamonds", thread picked three diamonds (2026-10-20).
- One look for every spell button: hud.js `_hrlgSpellLook(sp)`, spread by the Abilities list and every quick menu (enemy/ally/tile). Change a spell button's content there, never per menu: mondo "i dont want to have edit them individually".
- Row layout: UI Maker db.ux `bRows` ('part:side|top|bot|off,…', default EW_BTN_ROWS_DEF = his old look) + `bFold`; form "Spell buttons: top + bottom row" on Layout pieces Unit info panel / Command panels / Quick action list. New button parts go in EW_BTN_PARTS + the default string.
- Party builder TECHNIQUES: the red category circles (.pb-sc-disc, .pb-ls-disc, .pb-technique-disc) carry the kind via party-builder.js pbCatGlyph (PR #382). mondo: NO physical/magic icon after a spell's name anywhere; the front circle says it.
- Desc bar `_renderSpellDescBar` reuses the badge/shape elements via `_ewStaticHtml` (React element -> HTML string).

- BADGE LOOKS (PR #526, 2026-10-25, UI Maker pass 30): the element on spell buttons = the unit info panel's R2 art (data.js elementIconUrl), size kElemSize (18). The status multiplier (×2 HNT) is its own button part `mult` (can sit on the other row). UI Maker "Spell buttons: how each part looks" (hud.js btnLookForm, db.ux k* keys, window._ewBadgeLook, _hrlgBadgeEl): per part Look/Size/Words/Letters/Colour/Font, kNameMin, sets "The game's look" / "Tell them apart". Untouched = old look except the element art. Party builder + HQ racks still read badge label/style (emoji), not changed. mondo chose (10-25): keep the old look as default; "Tell them apart" stays a one-click starting look.

Related: [[ui-maker]] [[ap-press-icons]].
