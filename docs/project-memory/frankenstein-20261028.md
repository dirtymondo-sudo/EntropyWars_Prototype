---
name: frankenstein-20261028
description: PR #624 (10-28) mondo's Frankenstein GLB as the Mad Scientist's Summon Creation + editor cast row; how a cast rig rides the animal summon pipeline
metadata:
  type: project
  modified: 2026-10-28T00:35:40.816Z
---
mondo 10-28: "here's a frankenstein rigged model to use for mad scientist's creation spell" — R2 Assets/Sprites/Races/Homosapien/Male/engineer/Meshy_AI_fankenstein_Running.glb (typo is the real name; Meshy biped, ONE clip Running, 7.4 MB).
PR #624 merged, token 20261028-frank-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261028-0035.zip (sprites.js d6f1b2ba, three-renderer.js c6d32878). Proof shots /mnt/project-files/frankenstein/.

- sprites.js DOOR_CAST_MODELS.frankenstein (heightRatio 1.15, lib idle Zombie_Idle_Loop, walk Zombie_Walk_Fwd_Loop) → also editor PEOPLE tab "The cast".
- three-renderer.js _SUMMON_ANIMALS.creation = { cast: 'frankenstein' }; _castCreatureBuild gives a cast rig the animals' ctl shape so _summonAnimal3D runs it (run gap, strike per _bites, flinch). Own Running = run; library fills idle/walk/attack (castSlam)/hit; procedural lunge/recoil/breath if library off. Any future humanoid summon = one _SUMMON_ANIMALS row with `cast`.
- Missing clips filled from the shared animation library (the house way for Meshy humanoids), not procedural — told mondo.
- Online: guest's summon is hidden in fog (existing rule); seen idle/run/slam on both seats once visible.
Related [[elephant-20261027]] [[animals-20261027]]
