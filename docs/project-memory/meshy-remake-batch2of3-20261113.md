---
name: meshy-remake-batch2of3-20261113
description: 11-13 PR #1261: remake batch 2 of 3 (units 22-41, glitch through police officer, 25 remade looks) shipped as a first pass; per-unit recipe, rough spots told to mondo, lessons
metadata:
  type: project
  modified: 2026-11-13T16:19:07.043Z
---
Thread (thread in the owner project). mondo 11-13 13:25Z asked for a first pass on ALL units ("combination of stuff we already have and new stuff with meshy"; creator pieces first, e.g. the creator quarterback helmet beat the Meshy one); he does a visual review after. Split = repo docs/notes/meshy-remake-batches.md (PR #1255). Plan [[meshy-remake-plan-20261112]].

- SHIPPED PR #1261 (~16:15Z), live on R2: 25 `RACE_REMADE_LOOKS` rows, 27 `ewm_t2*` wear GLBs, 23 unit faces (`<key>Face` + `ew_face_<key>`), mpfb_shapes.glb a9270d98, sprites.js 0fdd926c; file list uploaded_files.txt in the proof folder. Meshy models stay defaults; saved looks untouched.
- Creator pieces used: ewm_icecrown, ewm_overlordhelm, ewm_mushroomcap, ewm_beret, ewm_tricorn (pirate M), ewb_luchador, ewm_policebadge, mhw_mindfront_fishing_hat_01 (hippie M), Feathered wings (nephilim), mhw_elvs_lara_tank1 (marksman F). Saved-look units (halfdemon M/F, mad scientist M/F, men in black): no Meshy, saved clothes + unit face. No own face: overlord, glitch.
- Per-unit bake commands: plan doc section 8. New off-by-default knob `EYEH` (remake came back with no eye shells: pirate M).
- Rough spots TOLD to mondo: orb of light (body through gold suit at chest, loose strip by right arm), glitch head plain blue, marksman F wrist edges, homosapien fleck on coat shoulder, mushroom cap smaller than original, ki fighter face older, nephilim/overlord capped at height 1.15, overlord stock face. Nothing seen in a battle or Face Lab.
- LESSONS: "outfit piece missing" is often the HAIR LOCK rule eating it (`LOCKS=0`: ice queen bodice, overlord armour, glitch body). Look probe: abort non-character GLB/audio requests and wait for `ew-cv-ready`, else only the MANIFESTING spinner is shot; max 3 browsers at once on this box (~90 s a unit with TURN=1). `mh_bob01` hair covers faces; `mh_elvs_lady_hippy_hair` never loads. Dark/pale stock mismatch on a face = wrong stock skin, not gain. Batches landing in parallel conflict in sprites.js, bake-outfit.py, mpfb_shapes.glb: keep own rows in separate marked blocks (`/* T2 WEAR B2 >>> */`, `/* T2 FACES B2 >>> */`) and rerun `node bake-custom-shape.js` after the merge.
- FOLLOW-UP PR #1263 (~16:55Z): coordinator relayed his batch 1 notes (old Meshy hands instead of MPFB fingers, feet through boots, hair broken at the back, face through helmets, outfits not fitting). Hands checked on all 25: MPFB fingers on every one. Four-side shots showed shoulders through the BACK of coats: fixed on hippie M + homosapien (`RAY_IN=0.12 RAY_OUT=0.12`) and marksman M + police officer (+ `TORN=9`). `TORN=9` webs trouser legs / closes coat fronts (hippie, pirate M): check the front after using it. STILL OPEN, told him: overlord small bits floating beside the hands, pirate M loop floating over the hat + pirate F loose sword bits, nordic back of head, hippie M strand between the trouser legs, ice queen arm patches.
- Proof + T2 sources: /mnt/project-files/meshy-remake-b2/ (batch2_overview_1/2.jpg old|new, batch2_sides_1..5.jpg).
- His review + rules: [[meshy-remake-review-rules-20261113]].
- WAITING on his visual review; fixes for these 25 units go to this thread.
- Review fix rounds: [[meshy-remake-batch2-review-rounds-20261113]].
