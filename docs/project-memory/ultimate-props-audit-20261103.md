---
name: ultimate-props-audit-20261103
description: 11-03 ultimates placeholder-prop audit + replacements; rounds 1-2 merged (PR #870, #874), all 7 stand-ins replaced
metadata:
  type: project
  modified: 2026-11-03T13:03:18.531Z
---

Audit only, nothing changed (2026-11-03). Doc: https://claude.ai/artifact/KFwXoLmigSgHjr2sdkE8ZB ; shots in /mnt/project-files/ultimate-props-audit/.

Confirmed code-built stand-ins (three-vfx-effects.js):
- The Gathering `_sigGathering3D` (cone+ball robe) -> Meshy cult1-5
- Lockdown `_sigLockdown3D` (box sawhorses) -> Meshy police barricade / traffic_cone
- Stadium Show `_sigStadiumShow3D` (cylinder masts, box truss) -> Meshy truss tower
- Flat Earth `_PZ_SIGS.f4FlatEarth` (painted disc) -> Meshy disc
- Raise the Dead `_sigFleshMound3D` (spheres) -> Halloween pack body-part heap (as _hzFleshMound)
- Drop In `_doorBody` (cylinder + box visor) -> unitDouble of caster
- Weigh the Heart: no prop at all -> Meshy scales
Borderline (reads as energy): Draining Embrace wings, Plandemic viruses, Atomic Breath plates, _capSpikes rock cones.
Load-time fallbacks only: Blizzard Present, Marrowstorm, Jurassic Jaw/Blood Frenzy, Immortal Cycle.

**How to apply:** a thread doing these replacements starts from this list; don't redo the audit. Tier-4 signatures (e.g. Excessive Machine) not audited yet. Related: [[meshy-decor-concepts-20261103]] [[held-props-row24-20261103]]

ROUND 1 merged PR #870 (Gathering cult rig, Raise Dead pack heap, Drop In caster double), zip 1323. Round 2 picks (mondo 13:23):
barricade U01a (Meshy, no free pack has one; Pizza Doggy Mega Pack II has barricades, unbought), Stadium Show = EXISTING
decor `flood_mast` (I missed it: searched truss/stage, not flood; mondo angry), Flat Earth U03b, scales U04a, feather U06a,
heart = Halloween Body_part_04. Files /mnt/project-files/meshy/ultimates/.
LESSON: before proposing any new model, grep MODEL_LIST.md with synonyms (flood/light/lamp/mast...) incl. the decor D-table + packs.

ROUND 2 merged PR #874 (zip 20261103-1346 incl. Assets/props police_barricade/flat_earth/heart_scales/maat_feather.glb by hand). Weigh the Heart is a bolt spell (no 'impact' intent) -> listed in _GEOM_ON_BURST. Stadium masts placed off the camera side. Borderline ones (Draining Embrace wings etc.) untouched.
