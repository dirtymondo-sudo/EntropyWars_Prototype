---
name: spell-camera-grammar-20261110
description: THE SPELL CAMERA GRAMMAR (mondo 11-10 approved "okay sounds good"): rules every spell shot follows, where the code lives, kill switch, recorder tools + gotchas
metadata:
  type: feedback
  modified: 2026-11-10T09:40:00.000Z
---
mondo 11-10 (thread in the owner project): spell action camera "spins around/pans when a cut would be better, or vice versa ... zoom in/out and spin/rotate/pan at the same time but then it cuts to a different angle anyway ... cuts too early away from the spell landing or the person taking damage ... AAA studio quality". He approved the grammar below ("okay sounds good").

THE GRAMMAR (every spell shot, shared code, never per-spell hacks):
1. Four shots only: CAST, HIT, FOLLOW (a travelling body, pan only), REVEAL (weather/zone/summon: one slow pull-back, no turn).
2. CUT OR MOVE, NEVER BOTH. New subject or angle change > ~40° = hard cut. A move changes one thing (push in, follow, drift <= 30°).
3. No move a cut throws away. 4. The shot OPENS WITH A CUT. 5. Cut on the release, land on the impact.
6. HOLD THE HIT >= 1 s from a number on a body (no cut/glide away, no pull-out). 7. A kill keeps the close-up.
8. Cuts >= 0.5 s apart; no jump cuts. 9. 180° rule. 10. Auto helpers (clear angle, frame guard, crane) decide AT the cut.
11. Home: one cut back (a glide only if close).
Code: battle.js "THE SHOT GRAMMAR" block (_shotGrammarMove/_shotGrammarCut under _cineBeatMove/_cineHardCut, _shotGNoteRead, _shotGAdvanceGuard, camera._returnIsBusy) + three-camera.js _clearAngle (CA_MIDBEAT_MAX, _caCutPend, _caFrameNo). Kill switch window.EW_NO_SHOT_GRAMMAR. Probe window._shotGrammarState(). Notes docs/notes/spells-vfx.md "THE SHOT GRAMMAR".
SHIPPED PR #1094. Proof sheets /mnt/project-files/spell-camera-20261110/proof/. Clean casts 120/877 -> 770 (#1094) -> 807 (#1096). TABLE /mnt/project-files/spell-camera-20261110/SPELL_CAMERA_TABLE.md. PASS 2 SHIPPED PR #1096: non-damage numbers wait for the lens (_shotGNumberWaits, kill EW_NO_NUMBER_WAIT), glides land+hold 400 ms before shot end, drifts clamp 24°, _returnCut uses drawn yaw (+clear angle delta). Proof warCry_pass2.jpg. PASS 3 SHIPPED PR #1097 (token 20261110-shotgrammar-03-cors): frame guard holds its frame through a beat (_fgHold), frames forecast knockback landing (_cineGuardLandingPts), guard jump >=1.6 sq becomes a cut (camera._guardMayCut), cut draws its own frame, lens returns on the next cut (setFOVAtCut), first hit body only is primary. Kill switches EW_NO_GUARD_HOLD / _LANDING / _CUT, EW_NO_LENS_AT_CUT. Clean casts 832/876. Proof cordyceps_pass3.jpg, gale_pass3.jpg. LEFT: leap/drop caster followed down (Divine Swoop, Feral Dive, Descending Wrath); clear angle nudge (Space Disco, Round Up); guard steps <1.6 sq ease (strike family); Chivalry slow-mo cut; board cam before late bespoke shots (Colossal Crush, Crop Circle, Headshot); Marrowstorm 1-sq growth.
Kept: [[camera-rules]] [[camera-one-move-20261107]] [[camera-hand-vs-auto-20261109]] [[impact-hold-camera-20261105]]. PR #1078 (_cineOpenBeat) compatible.

Recorder: /mnt/project-files/spell-camera-20261110/tools (sc-run.js + sc-lib.js per-frame camera/calls/numbers, Action Cam forced on; sc-an.js classifies ENTRY SWOOP..AUTO MOVE; sc-table.js the before/after table). Setup: /mnt/project-files/spell-vfx-audit/harness/setup.sh. Serve a worktree's JS with env EW_JSROOT=<dir> (patched /tmp/ew-harness/route.js). Kill-switch "before" runs: --opts '{"id":{"pre":"window.EW_NO_SHOT_GRAMMAR=true;window.EW_NO_OPEN_CUT=true"}}'.
Gotchas: sample ThreeCamera.getCamera() on any render (draw-on-demand). camera._apply() runs ThreeCamera.sync synchronously and the render loop skips its own sync that frame (_appliedThisFrame). ~1 in 40 HUD casts misfire (CONFIRM shown, nothing cast: NO SHOT): re-run them. 3 browsers max. The FIRST spell after a race switch often fails ('ABILITIES not found', loading screen still up): list a proof spell twice.
