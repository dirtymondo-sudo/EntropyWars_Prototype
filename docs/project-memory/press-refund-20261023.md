---
name: press-refund-20261023
description: PR #434 (10-23) status combo + crit both refund +2 AP, hit % on attack button; open question on 2 presses/turn and unified press rule
metadata:
  type: project
---

mondo 2026-10-23: "status combos (the multipliers) also reward +2 ap, but not if the type spell is resisted ... crits allow 2 ap instead of 1 since that means you could potentially get 3 attacks off if the first 2 crit. Also ... accuracy percentage on the attack button."

BUILT PR #434 (merged 10-23, token 20261023-press-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261023-0600.zip):
- battle.js _pressCtxForHit records `combo` (bonusStatusMatches on opts.bonusVsStatus); _pressOutcomeForHit: combo = WEAK unless type resisted (typeTier<0) or element part resist/immune/absorb. pressBy 'combo' (_pressByOf); ui.js forecast "⚗ COMBO" badge.
- PRESS_CRIT_REFUND_AP 2. PRESS_MAX_BONUS_AP kept 2 (ONE press/turn). applyPressTurn caps one hit at +2 (hitRoom); weak crit's second +2 vents to entropy.
- getAttackHitChance (back arc / EVA / Blind / Protected) -> hud.js _hrlgHitPct chip .hrlg-acc on Attack verb (lo–hi over enemies in reach), attack target drum, enemy quick menu.
- ai.js pressEV counts combo, crit chance full weight.

PR #435 (10-23, mondo's pick, zip ENTROPY_WARS_SYNC_20261023-0613): THE PRESS SUM — each resistance (type, element part) takes 1 AP off the +2 (PRESS_OUTCOME.HALF = +1; two resists = 0); immune/absorb blocks every refund; AoE: best hit pays, any resister in the blast -1, any absorber blocks; ONE press per turn by count (_pressedAlready), so two attacks max. Calls I made (flagged): immune treated like absorb. PR #436 (mondo: "give +1 its own look"): +1 press = HOLLOW green ! (dark disc, green ring+mark) everywhere (hud _hrlgPressMark superEff 'half', ui _seBangHtml half, three-renderer showPressMarks halfIds); +2 = solid. Screenshot /mnt/project-files/press-refund/plus1_vs_plus2.png.

OLD (before #435) CONTRADICTION flagged to mondo: with one press/turn, +2 crits make his "3 attacks if first 2 crit" IMPOSSIBLE (old +1 crits allowed it). Raising to 2 presses also needs: '1 spell/turn' gate (_castsAllowed in getSpellBlockReason) per press, tutorial the_press lesson (second SMITE "can't press again"). Unified rule question (any type/element resist vetoes every press) asked via decision card.

Browser-check recipe that works in this sandbox: scratchpad probe from playtest_builder.js + npm-install three@0.186.1 etc into a scratch dir and map cdn.jsdelivr.net /npm/<pkg>@<v>/<path> to it (jsdelivr is blocked).
