---
name: combat-text-colours
description: Combat log + combat text box colour coding (PR #314, 2026-10-18) — how log lines must tag unit names and spell names
metadata:
  type: project
  modified: 2026-10-18T12:11:43.317Z
---
PR #314 merged 2026-10-18 (token 20261018-ctcol-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261018-1211.zip).
mondo's rules: enemy names ALWAYS red, ally names ALWAYS blue (incl. "Player N"); damage numbers red, heal numbers green; no green-heart HP badge; spell names and status effects in CAPS, statuses in their badge colour.
- battle.js `_ctDecorate` formats the combat log AND the combat text box (log beats, showBattleDialogue lines, prompts).
- **How to apply:** new addLog / dialogue lines must write names as `${_ctName(unit)}` and spells as `${_ctSp(spell.name)}` (private-use team marks, so mirror matches colour right). Untagged names fall back to text matching. Exports strip the marks with `_ctPlain`.
- The UI Maker Combat text box is `keepCodes`: its All text ink skips `.ct` words. It has text parts for ally/enemy names, spells, statuses, dmg/heal numbers and KO words.
- Not yet seen by mondo. Details: docs/notes/ui-menus-audio.md "THE COMBAT TEXT COLOURS". Related: [[damage-numbers]], [[ui-maker]].
