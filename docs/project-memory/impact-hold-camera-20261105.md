---
name: impact-hold-camera-20261105
description: PR #947 (11-05) action camera holds 1.2 s past every spell impact (Meteor cut back on impact); kill switch EW_NO_IMPACT_HOLD
metadata:
  type: project
  modified: 2026-11-05T11:55:04.883Z
---
mondo 11-05: "action camera for meteor cuts back to my character right as the meteor is hitting ... Fix this for all spells." PR #947 merged, battle.js live (5b79a7a5), token 20261105-impacthold-01-cors.
- Cause: shot length counted only travel; descent spells land telegraph+fall after launch, so Meteor's shot ended on impact and the cast finish returned the camera 0.2 s later.
- Fix: battle.js CINE_IMPACT_AFTERMATH_MS 1200; `_cineHoldShotToImpact` stretches every cine shot; `camera._impactHoldUntil` also extended on each non-DoT hit during a shot; isBusy/softResetToUnit/restore/_armLevelSettle wait it out. Probe `window._cineImpactHoldLeft()`.
- Browser-verified by camera-call log only (headless, no screenshots shown to him). Online guest not clicked.
- Notes: docs/notes/spells-vfx.md "THE IMPACT HOLD". Related: [[spell-camera-hit-20261029]] [[camera-rules]]

11-07 PR #1016 (THE SHOT HOLD, timing playtest D1): marked shots (Take Aim, To Be Continued), non-cine detonations and turret volleys now wait for the 380 ms glide and arm the hold before the hit (`window._cineHoldImpactAftermath`); cineFreezeFrame extends a live hold. New battle.js `playEorShotFocus` relayed by online.js as `eor-shot-focus` (guest camera follows, fog-gated). Proven in a real VS CPU match (camera on Kraken at the hit, left 3.08 s later); online two-seat NOT run. Token 20261107-shothold-01-cors, uploaded. Proof /mnt/project-files/marked-shot-hold/.
