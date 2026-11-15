---
name: mhm-face-presets-20261103
description: MakeHuman .mhm face preset sources (11-03): community repo offline, what free .mhm exist, which were baked, FaReT GPL-3 question
metadata:
  type: project
  modified: 2026-11-03T02:40:22.926Z
---

Face presets from .mhm files (plan row 29b), 2026-11-03. Importer = bake-faces.js (PR #814), rows in sprites.js EW_MPFB_FACE_PRESETS.

- makehumancommunity.org user-contributed repo was OFFLINE ("Community services offline"); only static.makehumancommunity.org up.
  web.archive.org is blocked from the cloud. Thingiverse scraping was refused by the auto-mode classifier.
- Free .mhm found: OpenGameArt warrior-female-3d-model (CC0, DREAM_SEARCH_REPEAT) + gnome-0 (CC0, Cheb Gonaz) = BAKED as Warrior / Gnome.
  Sam (frontlinestudios.itch.io/asset-sam, CC0) has 0 face modifiers; Syl (archive.org thingiverse-1657065) 2 tiny; OGA female-dwarf-0 is
  MakeHuman 1.0 format (importer reads 1.1+). Files + LICENSES.txt in project files mhm-faces/.
- Most free .mhm carry their look in body macros, which fixed MPFB bodies drop: always --dry-run first.
- FaReT (github.com/fsotoc/FaReT, model-database/identities, 24 detailed faces + 3 averages) is GPL-3: asked mondo on a decision card
  (recommended skip). He said "i'll take the risk" (wants a paid game, was told copied numbers may still count): 27 FaReT faces baked (F01-F12, M01-M12, Avg F/M/all), license GPL-3.0. Then mondo: "take out the gpl3 credit, this game is NOT open source": renamed Face F01../M01../Avg, NO credit row. Never re-add a FaReT credit.

Related: [[aaa-creator-face-sliders-20261102]] [[credits-screen]] [[character-models-plan-doc]]
