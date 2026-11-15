---
name: status-lock-words-20261107
description: PR #993 (11-07) greyed verbs name the real status lock; blockAction statuses grey every action verb + engine refuses items/guard
metadata:
  type: project
  modified: 2026-11-07T06:00:33.258Z
---

PR #993 (merged + live 2026-11-07, buffs playtest family D). battle.js `unitMoveBlockKey` / `unitActionBlockKey` /
`statusLockWord` (one-word colorText else label): MOVE/BUILD say Rooted, Charmed, Roped, Frozen, Stoneform, Stunned,
Climbing instead of "Stunned" for all. Any blockAction status (Stoneform, stun, frozen, feared, door holds) greys
Attack/Abilities/Combo/Items/Guard in hud.js ActionMenu; doItem, doGuard, chooseItemAction, useStimItem, canUseItemNow
refuse like doAttack/doSpell. Before: a Stoneformed unit drank a potion with leftover AP. Proof shots:
/mnt/project-files/status-lock-words-20261107/. Browser harness (local scripts + Node-fetched CDN files, NODE_USE_ENV_PROXY=1)
was in the session scratchpad, modelled on playtest_capture.js; three.js now comes from jsdelivr, so route ALL .js
misses through Node fetch. Related [[playtest-buffs-utility-20261107]].
