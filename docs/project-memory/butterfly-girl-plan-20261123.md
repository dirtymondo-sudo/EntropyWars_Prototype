---
name: butterfly-girl-plan-20261123
description: Butterfly Girl (blue morpho) kit SHIPPED 11-23 PR #2465: Flutter stacks -> twister, Flash and Vanish, Specimen finisher, flapping wing bones
metadata:
  type: project
  modified: 2026-11-23T11:49:22.356Z
---
Thread (owner-project id). Plan https://claude.ai/artifact/7V3xVKvFCkYrZ3wEDJJTqZ; mondo OK'd all 4 questions ("yeah thas fine").
SHIPPED 11-23 PR #2465 (merged + uploaded, ?v=20261123-butterflygirl-02-cors). Playable (AVAILABLE_RACES, data.js + server.js).
- FLUTTER status 1-3, +1 each round end, at 3 a twister on its 3x3 (carrier's side, push 1). T1 Flutter, T2 Eyespots (Fear r2 + Flutter), T3 Butterfly Effect (+1 all now), T4 raceTornado. Passive Flash and Vanish. Finisher Specimen (glass case + pin + label). Home forest / Fairy Forest.
- Wings flap: bake-wings.py adds ewwing_L/R bones; model ..._wings2_Running.glb (the first _wings_ file had a wrong inverse bind: 0.01 armature scale shrank the wings to nothing). three-renderer.js _gearTick beats them.
- Notes champions-combat.md "THE BUTTERFLY GIRL", models-assets.md "THE WING BONES". Proof + probes /mnt/project-files/butterfly-girl/.
- Not seen yet: wings in a battle board view are small; the generic pink rune circle on Eyespots is the shared debuff circle, not hers.
FIX PR #2467 (live, battle.js 41f10434): my Rat King merge in #2465 cut her battle.js block (a conflict regex matched a '=======' inside a comment) and every round end threw for ~30 min; restored, plus Codex fixes (Flash and Vanish after the reveal; a spell's 3rd Flutter sets the twister off). LESSON: resolve conflicts with line-anchored markers and compare line counts ours+theirs vs result.
Related: [[char-concepts-20261123]].
