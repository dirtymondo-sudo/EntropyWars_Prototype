---
name: blender-vfx-research-20261103
description: Blender spell VFX history (11-03 flipbook pilot -> 11-05 spell sims) and its FULL REVERT 11-08 (PR #1051); never bring back sim fire/smoke
metadata:
  type: project
  modified: 2026-11-08T11:40:01.193Z
---
HISTORY: 11-03 mondo asked how Blender could give AAA spell VFX (doc https://claude.ai/artifact/9GyNSPYdKBspThtoWa3vZu).
Built: PR #823 flipbook pilot (fb_explosion on Fireball + Meteor), PR #828 shared kinds (smoke/smoke-soft/dust-puff ->
fb_smoke, ember -> fb_ember game-wide via three-vfx.js _FB_KINDS), PR #830 smoke fade, PR #906 dissolve tail (fbTail),
PR #919 spell sims (fbhit / mblast / fbfly / mtail smoke+glow sheets on R2 Assets/fx/sprites/fb_*.png).

REVERTED 11-08 (PR #1051, token 20261108-vfxrevert-02-cors, three-vfx.js 9bcaa859 + three-vfx-effects.js d35a5088
uploaded): mondo sent Riot's VFX style guide (LoL, 2017); its p.28 "don't" (photo/sim explosion textures with superfluous
detail) "is the exact type of fire and smoke you tried to make in blender. So ditch the blender fire+smoke, go back to what
the game had before". ALL flipbook code removed (all 5 PRs); three-vfx.js is a byte copy of pre-#823. Sheets left on R2
unused (never delete R2 objects); bake-vfx.py + docs/BLENDER_VFX_GUIDE.md marked RETIRED. Notes docs/notes/spells-vfx.md
"THE BLENDER FIRE + SMOKE REVERTED". Proof /mnt/project-files/riot-vfx/revert/.

**Why:** mondo judged the sim look noisy and wrong for the game's style (Riot guide: hand-painted, concise shapes).
**How to apply:** NEVER bake spell fire/smoke/explosions in Blender again; VFX improvements are done in code with the
existing painted sprites (three-vfx.js _shapedHiResDefs canvas shapes). The Riot-guide VFX plan lives in thread
 (thread in the owner project) (awaiting his OK as of 11-08).

Still useful facts: in-game proof harness /mnt/project-files/spell-vfx-audit/harness (skip its setup.sh git checkout; use
?nohq + _goToVsCpu() + applyPartyBuild(false); teamLockedIn=true; startMatch() for a real match; set __ph.draw.mode="always";
pause the fake clock at now+300, never +50). Related [[spell-vfx-audit-20261026]] [[visual-rules]]
