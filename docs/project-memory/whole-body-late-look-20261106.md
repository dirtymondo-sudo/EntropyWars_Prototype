---
name: whole-body-late-look-20261106
description: Playtest A1 (created looks missing/in pieces at battle spawn) = THE LATE LOOK shader queue + harness draw-on-demand; PR #964 whole-body gate
metadata:
  type: project
  modified: 2026-11-06T15:39:44.734Z
---
11-06 thread "Fix created looks missing at battle spawn" (thread in the owner project), PR #964, token 20261106-wholebody-02-cors, three-renderer.js live 79b420bf.

Cause of playtest A1/C4: NOT the spawn prism or culling. THE LATE LOOK (node renderer _ewLateSetup + WebGL _glScSetup) builds new shader looks a few per DRAWN frame and draws each piece when its own build stands. Created (MPFB) bodies = ~25 looks each, so they came in piece by piece (Santa red suit only, specks). The playtest harness draws 3 frames per screenshot (draw on demand) so pieces took minutes; a real browser drawing every frame mostly builds them under the loading card.

Fix: _createAppearanceRig marks root `_ew_whole`; _lwGate/_lwTick hold every piece of a not-yet-shown body until all stand (first showing only; cap 4 s + 240 drawn frames; _lwSync = drawn in the pass's first 600 ms counts as shown). Stats: ThreeRenderer.shaderCache().late.wholeBodies/wholeHeld.

No sprite stand-ins exist for 3D units (mondo 10-05 "NO STAND-INS"), so the square shows only the plate till the body is whole.

Harness tip (added to playtest-harness README traps): after a battle starts run `ph draw always` ~30 s before judging missing bodies/props. Inject a saved team via localStorage keys ew-profile-0 / ew-active-profile / ew_last_party_v1 + reload to skip rebuilding it.
Proof /mnt/project-files/whole-body/. Related [[playtest-battles-20261105]] [[dressed-reveal-20261105]] [[sandbox-playtest-speed]]
