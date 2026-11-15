---
name: element-share
description: Elemental damage split (PR #269, #270, #272, 2026-10-17) — type part vs element part, damage-scaled share, all 15 elements resistable, press/entropy rules
metadata:
  type: project
  modified: 2026-10-19T23:35:01.483Z
---
PR #269, #270, #272 merged 2026-10-17 (token 20261017-elemsplit-03-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261017-2204.zip).
- Combat-element spell: (1−share)×type matchup + share×affinity; STAB on whole hit. Share = spell row elemShare, else damage-scaled: 30% at power ≤80, 70% at ≥160, linear (data.js ELEM_SHARE_BAND / spellElemShareAuto). Source-less hits stay all element.
- Press: type decides; element presses only on neutral type; immune/absorb never (PRESS_OUTCOME.NULL, no drain). +4 entropy per enemy hit on an element weakness. mondo confirmed: no type chart on element part, no extra immune drain.
- 2026-10-18 PR #285 (mondo): TWELVE elements, light/shadow/arcane CUT (spells keep tag as vfxElement = look + family only; their race rows removed). Zodiac spell surge: data.js ZODIAC_SURGE_ELEMENT one element per sign x1.25 (Aries fire, Leo blood, Sag psychic, Cancer water, Scorpio poison, Pisces ice, Gemini wind, Libra sonic, Aquarius lightning, Taurus earth/ground, Virgo metal, Capricorn nature; order inside trines was Claude's default). Element box bands of 6. Summary /mnt/project-files/elements/TWELVE_ELEMENTS.md.
- (history) COMBAT_ELEMENTS was all 15 tags (orig six + wind, nature, sonic, psychic, light, shadow, blood with mondo-approved rows; arcane + metal at 21:55 "yes make them resistable too", rows picked by Claude: metal werewolf/fairy weak, gargoyle/juggernaut/kaiju resist, cosmic wraith immune; arcane scarecrow weak, wizard/fortune teller/gnome resist, machine elves absorb). Element box = bands of 8 (elemBoxBands), xl tracks fixed 32px.
- Barrage (Requiem) hits land on staggered timers; doSpell _pendingSpellHits gate makes finishAction wait so they press.
- Plan: /mnt/project-files/design/ELEMENTAL_DAMAGE_SPLIT_PLAN.md (section 6 refinements still unbuilt: +2 AP preview chip, split readout, weather share, coverage row).
- **How to apply:** any damage-math change must stay mirrored in forecastHitOnUnit, ai.js estDamage/pressEV. No status pairings for new elements unless asked.
- PR #295 (2026-10-18, mondo: green ! must guarantee the refund): every green ! (board badges, nameplates, target/combo drums, enemy quick menu) = battle.js forecastPressOn / ui.js window._pressOf, built on _pressCtxForHit (shared with the real collector) + forecastSpellPlan plan.press / h.press / h.pressBy, worst case over the blast. New press-affecting rules go in _pressCtxForHit/_pressOutcomeForHit so previews follow. Entropy Strike / finisher green ! are NOT press (they never refund) — left as is.
- PR #339 (2026-10-19): spellArmsPress now arms for kind 'bomb' (contact Place Bomb presses +2 AP and shows green !; empty-tile bomb records no hit). Field Detonate (doDetonate) still never presses. PR #341: same for seedPoison/leechSeed (planted sting); hud.js hudSpellCanPress gates the quick-menu/target-row green ! (not hudSpellShowsDamage). A spell kind missing from spellArmsPress = no green ! anywhere AND no refund.
Related: [[bane-forecast]].
