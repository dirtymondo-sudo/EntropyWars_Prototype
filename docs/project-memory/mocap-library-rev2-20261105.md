---
name: mocap-library-rev2-20261105
description: Mocap libs 5 (CMU) + 6 (100STYLE) are CREATOR PICKS ONLY, races keep defaults; bake-mocap.py rev 2; PRs #914/#915/#918/#920/#926 + REV 2.4
metadata:
  type: project
  modified: 2026-11-05T07:58:43.562Z
---
mondo 11-05 (furious at PR #902): "dont give them default idles and walks, just add them to the character creator and ill look
at them there. Put their defaults back". Rev 2 (thread "Redo pilot race idles and walks", PRs #914 + #915, live on R2):
- superhero/priest/cowboy/mad scientist/gangster defaults restored; NO race plays lib 5 unless a look picks it.
- Creator: Idle pose = Heroic stance, Calm, Weight shift, Fidget, Tough stance, Hands in pockets (hands on hips DROPPED: he hated it);
  new "Walk" row (sprites.js EW_WALK_STYLES, appearance.walk -> def.walkPick, 8 walks). Walk preview LOOPS until STOP WALK,
  at recorded speed (board ts = cycle/0.52 s).
- GOTCHA: CMU BVH set ships 77_02 and 139_02 as the SAME file (his "calm = weight shift" bug). Judge takes by motion.
- GOTCHA: MOC1_CMU.glb changed in place must be listed in ASSET_MANIFEST.json (sha1[:12]) or browsers keep the stored copy.
- REV 2.1 (PR #918): his "buttons dead after one pick" + sliding walks = his browser still played REV 1 from the asset store
  (a row stored unlisted got the manifest's new sha stamped on a hit). Fixed in three-renderer.js _asTouch/_asStale (no sha /
  no row / other sha / other size = refetch). If a pick "does nothing", suspect a stale stored file before the buttons.
  Walk row now has PLAY WALK / STOP WALK beside it (bottom PREVIEW WALK moved up).
- REV 2.2 (PR #920): he hated Heroic stance ("looks like they have to pee") -> removed; Macho + Bow-legged walks dropped; added UAL walk,
  UAL formal, Meshy woman. THE ARM CLEARANCE (three-renderer.js _ccArmClear in the appearance rig tick): hands pushed out of thighs
  on MPFB bodies, any clip. The "Add collision between bodies and clothes" thread owns the CLOTH side and stays off arm bones.
  Library = CMU Graphics Lab Motion Capture Database (not UAL; UAL = Quaternius, libs 0/1).
- REV 2.3 (PR #926): he also rejected Calm (CMU marker-noise shake), Tough stance (watch-check), Fidget (dance); Hands in pockets
  reads as hands on hips -> all out. Only mocap idle left: Weight shift. LESSON: CMU = acted prompts + noisy still poses; do NOT
  offer more CMU idles. Better sources to suggest: 100STYLE (CC BY 4.0 walks), Mixamo (free, he downloads), Meshy anim library.
- Tools: bake-mocap.py rev 2 (--scan; clean rest + flat feet fix twisted ankles; searched loop points + seam ease);
  clip list mocap-clips.json; notes docs/notes/models-assets.md "THE MOCAP LIBRARY rev 2".
- REV 2.4 (09:42 "use any of them"): lib 6 MOC2_100STYLE.glb from 100STYLE (Ian Mason, CC BY 4.0, credit in EW_CREDITS);
  mocap-100style.py converts Xsens BVH -> CMU names, then bake-mocap.py. 4 idles + 4 walks (Neutral, Hands behind back, Arms crossed,
  Proud). Rejected: Heavyset/Pockets/Old/Strutting. Free = free; CC BY just needs the credits line.
**Why:** he judges in the creator before anything becomes a default.
**How to apply:** new mocap clips go in as creator picks; ask him before making any a race default. Related [[idle-pose-picker-20261101]]
