---
name: camera-hand-vs-auto-20261109
description: PR #1076 camera "focusing on nothing" + PR #1078 Pupil Shield camera jumps (cut-open rule, shield pull-back), kill switches, recorder tools
metadata:
  type: project
  modified: 2026-11-09T21:05:10.074Z
---
mondo 2026-11-09: "end of round camera focusing on nothing or action camera focusing on nothing ... might be from when i move the camera around and then the automatic camera takes over". Fixed in PR #1076 (token 20261109-camnothing-01-cors), (thread in the owner project). Notes: docs/notes/champions-combat.md "THE CAMERA SHOWS SOMETHING". See [[camera-rules]] [[camera-one-move-20261107]].

Rules now in the game (camera only, viewer-local):
- END OF ROUND read frames the living units the viewer can see (or the units the beat names), widening only as far as the default view; never the board's middle square. Recovery numbers wait for the camera. Kill switch `EW_NO_FIELD_FRAME`, probe `_fieldFrameState()`.
- A hand snap (wheel / orbit / pan, all arrive with `_force`) pins only the axes it names; a running glide and the pending return home carry on. Kill switch `EW_NO_GLIDE_KEEP`.
- While an action shot PLAYS, hand input does not move the camera; the first pan / orbit step on a finished shot's frame takes the camera home first. Kill switch `EW_NO_SHOT_LENS`.
- The third-person shot rig stays with a finished shot's frame until the pose leaves it (`_poseGen`). Kill switch `EW_NO_SHOT_HOLD`.
- Online: `eor-focus` / `eor-read` relays. NOT run with two seats.

Not bugs (checked, do not "fix"): the zodiac sky cinematic looks at the sky 4-6 s; a weather spawn dives to its tile; a hovering unit is centred on its body; a top-down strike shot frames the target, not the caster.

**How to apply:** a new camera complaint = record first with the tools in `/mnt/project-files/camera-nothing-20261109/tools/` (README there): every camera call with its stack + what is on screen every 100 ms, then `an.js` / `ends.js`. Test on a HILLY map with flyers (Mount Shasta Arena): the first field frame was only right on flat ground. Not checked by mondo in his own game yet; no screenshot proof of the hand-during-shot fix (numbers from the recording only).

FOLLOW-UP PR #1078 (2026-11-10, token 20261110-cleanopen-01-cors), mondo: "Bligblog used pupil shield and the camera jumps all over the place". Recorded: lens turned 205 deg in <3 s. Fix (battle.js, notes champions-combat.md "THE CLEAN OPEN + THE SHIELD'S OWN FRAME"):
- `_cineOpenBeat`: self / support shot opening that must turn >60 deg (pose turn + clear angle's turn) CUTS to the caster's hero angle; kill switch `EW_NO_OPEN_CUT`.
- shield / aoeShield pull-back (`partyCry` director) frames caster + units the shield reached (`_cineShieldReach`), from the view the shot left (`_preCineView` yaw + pitch), cut when lens >60 deg away; kill switch `EW_NO_SHIELD_FRAME`.
- Result old vs new same match: glided turn 125-214 deg -> 0 for Pupil Shield self/ally, Fortify, War Cry, Luminous Shield. Not compared: `buff` family glam beat (Protect ends the turn). Not two-seat tested.
- Per-cast recorder (fire one real doSpell, per-frame lens, cuts vs glides, old/new A/B, slow-mo stills via `cineSlowMo(0.1, 60000)`): /mnt/project-files/pupil-shield-camera-20261110/tools (README there). Cast only on the caster's OWN turn. Headless screenshots take 2-3 s each: use slow-mo for stills.
- The wider "rethink every spell shot" job (spin vs cut, cutting away early) is (thread in the owner project), not this one.
