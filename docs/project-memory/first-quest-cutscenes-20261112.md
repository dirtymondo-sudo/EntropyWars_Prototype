---
name: first-quest-cutscenes-20261112
description: First-quest cutscenes (6 scenes A-F): plan doc, his decisions + dialogue; B/C/D/E/F built + replay;; all six scenes built; A complete PR #1351
metadata:
  type: project
  modified: 2026-11-13T18:45:57.129Z
---
mondo's cinematic in-engine cutscenes for the first quest (subtitles only). Thread (thread in the owner project) "Finish first quest cutscenes".

- DOC (update it, never make another): https://claude.ai/artifact/Dsf1QbZQmTCroHe7XZLvG8 (docs id 6840466b-49f1-46db-9351-8aa1e876b999; "Status, 13 Nov" table).
- Scenes: A INTRO (Sedaniel drop-off, lone door, elevator descent, foyer), B TV CART, C AMBUSH, D AFTERMATH, E RHONDA LETS HER STAY + keys, F OFFICE (door choice, fade).
- SHIPPED: C PR #1244/#1245/#1248, D #1252, E #1254, replay for every scene #1256 (pause menu > QUESTS, a REPLAY button per scene), F #1259, B + his E/F notes #1293 (11-13).
- HIS DECISIONS: character created BEFORE the intro; sedan IS Sedaniel (DOOR_CAST.sedaniel = roster Honda Civic), drives itself; front desk = Rhonda's round desk; the Catgirl IS Kit and joins at the desk; elevator = separate entrance lift in the foyer; title ORIENTATION.
- LINES: the doc's Draft lines tables ARE the script, word for word (long ones split over two cards; "it's" -> "its"; player never speaks). Never invent dialogue or characters.
- HIS 11-13 NOTES (done PR #1293): no NPC may walk into a scene (office = `noWalkers` room, scene `cast` enforced every frame); faces must sit above the subtitle bar (shot `eye: { who, dy }` = head-bone height); keys shot on HIS FACE with the battle key celebration; KIT WEARS THE CATGIRL RACE LOOK (old Kit model = placeholder); a won quest fight revives the officer (1 HP, my pick) and during ORIENTATION the officer is always up + slot 1.
- SCENE A: desert storyboard (storyboard_A_desert.jpg, 9 frames in the menu's desert) APPROVED 11-13 13:06 ("yeah looks good"); the open door shows DARKNESS (his 11-15 pick).
- SCENE A DESERT HALF SHIPPED PR #1321 (11-13, token 20261113-dropoff-01-cors): room `intro_desert`, scene `orientation_intro`, plays before the foyer on a new story entry (flag `intro_seen`), replay = quest card REPLAY THE DROP-OFF; `window.EW_NO_INTRO = true` turns it off.
- DROP-OFF NOTES DONE PR #1341 (officer hidden till he gets out, Sedaniel scale 1.45, head shake hqNo). SCENE A COMPLETE PR #1351 (11-13): his "make the lift the front door" = foyer `street` door is now `proc: 'elevator'` THE FRONT LIFT (sealed); chain desert -> `car` (orientation_ride, shaft window speed act) -> foyer (orientation_arrive, lift opens, walk handed back). ALL SIX SCENES BUILT.
- Code map: docs/notes/story-party-progression.md "THE CUTSCENES", "EVERY SCENE REPLAYS", "SCENE F", "SCENE B", "HIS NOTES ON E + F". Director `EWScene` (three-camera.js), rows data.js `STORY_CUTSCENES`, HQ host map.js `_questHqScene`, renderer `hq.scenePlace/sceneWalk/sceneProps/sceneCast/sceneHead/sceneKey`.
- Harness: scratch only; base = /mnt/project-files/first-quest-cutscenes-20261112/tools/sc.js; serve EVERY repo .js/.css locally; one browser at a time; `EWScene.next()` skips a beat WITHOUT firing its later acts. Yaw 0 looks north (-Z), 180 south; +x is screen-left when looking south.
- HIS 14 NOV NOTES (B/D/F) DONE PR #1392: TV static act `screen` (hq.sceneScreen), Locke close-up, VHS spans, aftermath faces + new lines, eyeFit fits once (keys shot steady), door plates hidden in scenes, office reshot (legs walk-in, pans, Locke behind him on "Your office").
- HIS 15 NOV EDITOR NOTES (15): rules in [[cutscene-camera-rules]]. He OK'd 11-15 19:20 (card): RIDE = open cage down a shaft, glimpses of The Sewers, The D.U.M.B., The Cavern, Atlantis, Leylines, ~17 s; FOYER 17.5x10.5 m, 7 m ceiling, keep all props, 9 m DOOR logo wall (his PNGs) over the hall doors, shots 13-16 (lift opens on logo, crane, big logo pan, pull back). Pictures plan_15nov_*.jpg.
- Related [[quest-system-20261112]] [[spell-camera-grammar-20261110]].
