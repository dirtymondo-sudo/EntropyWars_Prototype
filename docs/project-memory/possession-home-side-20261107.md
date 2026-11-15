---
name: possession-home-side-20261107
description: PR #998 possession fix: possessed body keeps home seat, controller's seat only during its own activation
metadata:
  type: project
---

11-07 PR #998 (buffs/utility playtest family A). A possessed/infected body keeps unit.player = HOME seat; battle.js
_possessSettleSeats(activeId) gives it the controller's seat only while it is the active unit (activation start in
_continueBlitzWithUnit_impl + human hand-off timer; back after _possessSpendActivation). getControllingPlayer = controller;
state.js round order buckets by it. Simul keeps old whole-duration flip. Home team's cleanse CAN free its possessed
teammate (Possessed is a debuff, no rule changed) — possible question for mondo. Proven vs CPU + online two-seat.
Probe scripts: scratchpad only (not kept). Related [[playtest-buffs-utility-20261107]].
Known pre-existing race (not fixed): shot clock ending a possessed turn mid-attack releases the body before impact,
so its own side's follow-ups can join the hit.
