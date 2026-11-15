---
name: halloween-coffins-20261029
description: PR #680 (10-29) put the Halloween pack's coffins + wrapped bodies into Embalm, Curse of the Tomb and Mist Form; calls flagged
metadata:
  type: project
  modified: 2026-10-29T22:35:08.284Z
---
PR #680 merged 2026-10-29, token 20261029-hwcoffins-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261029-2234.zip. Proof
/mnt/project-files/halloween-coffins/. Looks only, built on the shared loader ThreeRenderer.halloweenClone (PR #677,
trick-or-treat thread). Code: three-vfx-effects.js "THE HALLOWEEN COFFINS" (`_hwc*`, `_HWC_BOX` = piece boxes in file cm).
- Embalm: Coffin_01 + Coffin_Top_01 stand round the victim, lid shuts at the seal. Replaced the sarcophagus LID in Embalm only.
- Curse of the Tomb: Body / Body_01 lie by the sarcophagus and swap to Body001 / Body_01001 (sitting) = they sit up.
- Mist Form: Coffin + Coffin_Top (cross) on the vampire's OLD tile, lid shuts on the mist; gated on _pzSeen(old tile).
Calls flagged to mondo: Embalm lost the sarcophagus lid; Mist Form picked as "the vampire spell"; Mummify untouched.
File facts: lengths run along Z with the head at -Z, coffin open top +Y. Sitting pieces exist for both bodies.
Test gotcha: the vfx harness shot with paused=1 runs 150 ms extra per frame.
Related [[traps-pack-20261027]] [[undead-batch-20261025]].
