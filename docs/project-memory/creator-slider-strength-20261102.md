---
name: creator-slider-strength-20261102
description: 11-02 PR #807: MPFB creator sliders "don't work" = too weak, not broken; per-slider SHAPE_GAIN + height scaling; probe method
metadata:
  type: project
  modified: 2026-11-02T12:50:13.751Z
---
mondo 11-02 11:20: "most of the sliders dont really work for the mpfb body, only the mpfb classic body?"

Measured (all 66 shape sliders x all 10 MPFB bodies, real creator + rig.update): every slider moves the SAME mm on every MPFB body,
clothes follow. Not a per-body bug. Real causes: MakeHuman +-1 is mm for most face sliders (eye size 2.4 mm) and the tall bodies
(heavy/thin/female tall thin, 2.3-2.4 m local) are shrunk by the stage => ~25% weaker than MPFB classic (1.70 m).

Shipped PR #807, zip r2-sync/ENTROPY_WARS_SYNC_20261102-1249.zip (three-renderer.js), token 20261102-sliders-04-cors; follow-up PR #809 (epicanthus - end 1.2), zip 20261102-1302:
three-renderer.js SHAPE_GAIN per slider ([+,-] pairs where one end tears), x part.height / SHAPE_REF_H 1.70. Bust kept 1.
Tear limits seen: nose tip into lip, nostrils crossing (width -), eye slits / red inner lid (eye size), pinched jaw, lumpy cheekbones.
If mondo wants ranges bigger/smaller: tune SHAPE_GAIN only.

Probe method (fast, no UI): playtest_creator.js routes copied, EWCharViewer.mount on a fixed div, then
EWCharViewer.dev.state().appearanceRig.update(app); frameCreator('face') for face shots. Anim libs often don't land headless
(odd crouch pose). Before/after sheets: /mnt/project-files/creator-sliders/.
Related [[aaa-creator-face-sliders-20261102]] [[character-models-plan-doc]]
