---
name: creator-makeup-20261112
description: 11-12 PR #1179: creator MAKE-UP (eye liner, eye shadow, blush on MPFB bodies) + the knight's remade look wears it with the creator's anime eyes
metadata:
  type: project
---
mondo 11-12 06:48Z (thread in the owner project): "paint liner and eye shadow, and make a way in the creator to add makeup too. Also there are literally anime eyes available in the creator" (a correction: I had told him the knight's anime eyes could not carry over).

Shipped PR #1179, token 20261112-makeup-02-cors, uploaded to R2.
- FACE > EYES: Eye liner, Eye shadow; FACE > CHEEKS: Blush. None / Pick a colour + swatches. Keys linerTint/shadowTint/blushTint ('own'|'pick') + linerColor/shadowColor/blushColor.
- One mask mpfb/looks/makeup_mask.png + sprites.js EW_MH_MAKEUP box; three-renderer.js paintMakeup; bake-makeup.py measures the mask (needs bake-face.py's installs).
- Knight remade look: liner, shadow, blush + anime eyes `mhm_spamrakuen_sr_anime_maid-san_red_eyes` tinted #3a2418. Anime eye picks = EW_MH_EYE_PACK ids `mhm_*anime*` (FACE > EYES > Eye materials rows).
- Not checked: male bodies, online guest, WebGPU. Proof /mnt/project-files/meshy-parts-20261112/knight_makeup.jpg. Notes character-creator.md "THE MAKE-UP".

**Why:** he wants stylised units to keep their pretty painted look on the MPFB head.
**How to apply:** for the next stylised/female unit face use creator make-up + anime eyes; check what the creator already offers before saying something cannot be done. Related [[meshy-remake-plan-20261112]] [[lip-colour-eyes-tab-20261103]] [[eye-pack-20261103]]
