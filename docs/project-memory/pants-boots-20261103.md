---
name: pants-boots-20261103
description: PR #885 (11-03) creator Pants + boots OUTSIDE / TUCKED IN (appearance.pantsTuck); what was tried and dropped
metadata:
  type: project
  modified: 2026-11-03T19:20:05.248Z
---

PR #885 (merged + uploaded to R2 2026-11-03): the creator shows "Pants + boots: OUTSIDE / TUCKED IN" on OUTFIT > LEGS > Bottoms and FOOTWEAR > Shoes + boots while long trousers are worn with a boot whose shaft is over their hem. The setting is appearance.pantsTuck and defaults to out. The code is sprites.js EW_BOOT_TOPS / EW_PANT_HEMS / pantsBootsWorn and three-renderer.js wearBootFit / wearBootHide. It is MPFB bodies only. Tracker row 12q. Notes are in character-creator.md "THE PANTS IN THE BOOTS". Shots are in /mnt/project-files/pants-boots/.

**Why:** mondo asked for it in (thread in the owner project). The thread stays open until he says it's good.

**How to apply:**
- A new long trouser or boot needs a row in EW_PANT_HEMS / EW_BOOT_TOPS. Measure it from the fitted GLB.
- Do NOT re-add a "let the boot opening out" push. Pushing per vertex crumpled the biker boot collar, and pushing per cell flared every boot into a funnel.
- Known: small jeans flecks show at the cowboy boot band when posed.
