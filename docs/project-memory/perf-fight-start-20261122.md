---
name: perf-fight-start-20261122
description: mondo's walk-to-fight freeze (11-22): the copy scene was the dip, the fight now draws the walked room (PR #2444/#2445), what is still unverified, how to probe it in the cloud
metadata:
  type: project
  modified: 2026-11-22T21:08:56.336Z
---
mondo 11-22 (angry, asked for months): "Still freezes and drops to 0 when a fight starts. Why is rebuilding stuff? Its the same room". Frame dips (thread in the owner project); the walked-room work is its OWN (thread in the owner project) (the dips thread does not touch hand-over code). Follows [[perf-battle-damage-dips-20261122]].

FACTS:
- The old fight was a SECOND scene: `_hqBuildRoomInBattle` cloned ~3,000 pieces of the parked walk; new scene + camera + lights = every recording and many pipelines made again ("2486 re-recorded", worst frame 1,465 ms). Every fight, not only the first.
- Earlier trims: PR #2405 grass grows in as a job; PR #2411 grass never ray-tested (Pick 881 -> 30 ms/s); PR #2416 the dip log covers fights (tag FIGHT START).
- PR #2444 THE FIGHT IN THE WALKED ROOM (three-renderer `_fw*`): the fight renders the WALK'S scene, battle scene pushed in as a child per draw, walk's camera object. Off `EW_FIGHT_COPIES`. Copies still used for DOOR HQ stage rooms, round worlds, a vessel, a room still LOADING. Also "A THROWN DRAW LEAVES NO MARK" (three `_callDepth` + shadow override leak after a throw; F3 "thrown renders").
- His F3 after #2444 (Disaster City, Firefox M1 WebGPU): 63 re-recorded but still 7.4 s dip, worst 1,777 ms, 61 shader builds + 69 pipelines + 286 ms lay; "Still freezes in during the transition".
- PR #2445 (token walkedroom-02, three-renderer 07cbfd81): (1) no dissolve / held still snapshot into a walked-room fight (`_hqLeave` `fwGo`; back on `EW_FW_DISSOLVE`); (2) THE LATE LOOK was OFF in walked fights (it compared against the battle scene): now follows `_fw.HS` + walk camera from frame one (off `EW_FW_LATE_WAIT`); (3) F3 dip lines end "worst frame: JS X ms (part) · built: 6x <look> | ..." so his next F3 names the first-time looks.
- 11-23 PR #2477 (token warmreal-01, three-renderer 75048147): THE ROOM WARM-UP WAS NEVER USED on WebGPU: it compiled in a stand-in scene with raw lights, frames draw through THE ONE RIG, so 0 of ~830 builds matched; unseen pieces built at first sight (fight's wide camera). `_hqWarmRun` now stands the rig and compiles in the room's own scene (kids lent). Cloud: room builds at fight start ~60-90 -> 0 in 3 of 4 runs. Left: rig growth re-keys everything. Probe trick that found it: compare a new build's render object with the same object's older one (mk/dk/ik/ctx/lightsNode).
- NOT CUT: the lay (`activate` ~220 ms, first-time unit load / anim bake, React HUD). On Firefox a new pipeline holds the frame even async.
- NOT VERIFIED: his Mac after #2445 (asked for Shift+F3 a few s into a fight); dig/sink and wall fades on screen; city on WebGPU (cloud crashes there, classic renderer works).

**How to apply:** do not ship small trims as "the fix"; he is out of patience. Read his next F3's "built:" list and cut exactly those (warm them under the room's load card). Probe: `playtest_handover.js <room> --gpu --post --fight=4000 [--fprofile --flip --again --early]`, `EW_PROBE_GL=webgpu` for counts, classic for pictures; never two probes at once; server 503 = stale checkout, merge main and restart. Notes: docs/notes/seamless-field-encounter.md "THE FIGHT IN THE WALKED ROOM"; design /mnt/project-files/fight-walked-room/HANDOFF.md.
