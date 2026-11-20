# THE KATANA + FLORA MESHY BATCH 1 (mondo 11-20)

mondo 11-20, after the flora thread's gap list ("Let's see if we can make some of these meshy models, at least the ones that
will be the most impactful. Low poly"). He picked, in this thread:

- **The top 14** non-tree pieces: torii gate, stone lantern, komainu, kitsune statue, seated Buddha, temple bell, offering box,
  red arched bridge, koi, lotus, barrel cactus, rice clump, wheat clump, sake barrel.
- **Meshy trees OK this time** (an exception to his 10-04 rule "never a Meshy tree": it holds for every other tree). This batch
  adds the four biggest tree gaps: bamboo clump, giant redwood, jungle tree, Joshua tree.
- **Run it on the `r2` cloud environment** (it has the Meshy and Cloudflare network secrets; the Default environment has
  neither). Start a new session there and say "make the Katana Meshy batch".

The rows, prompts and triangle targets are in `batch1.json` (18 pieces). Not in this batch (ask him before a batch 2): the
samurai armour + its empty stand, an empty katana rack, low table, cushion, futon, bath tub, hearth (no fire), food bowls, empty
festival stall, Japanese boat, dinosaur egg, empty nest, volcanic rocks, monkey, crane, water wheel; the other trees (mangrove,
black pine, wisteria, aspen, Japanese maple, bonsai); ivy, hedges / topiary, leaf litter, sea grass, snow bushes (code or kit
recolours, flora.md). Already covered, so NOT Meshy: pagoda tiers, keep roofs, the curved roof, shoji (code, bake-katana.js
`jroof` / `ctx.tiers`: buildings are walk-in architecture, not Meshy props); a katana (`ewm_katana`), bows and a spear (packs,
MODEL_LIST.md); cherry and maple trees (kit recolours); live dinosaurs (the dinosaur race model); banners (`banner`).

## THE FLOW (his, from 11-03; do not skip a stop)

1. **Concepts.** One Meshy text-to-image per row: `prompt` + ", " + `style` (model `nano-banana-pro`, ~9 credits each). Check the
   balance first (`GET https://api.meshy.ai/openapi/v1/balance`, header `Authorization: Bearer dummy`: the proxy puts the key in).
   Read every picture yourself; redo any that breaks a rule below before he sees it.
2. **One contact sheet** of all 18 (id + key under each) to mondo. **STOP.** He OKs or names redos. Nothing is modelled without
   his OK on that concept.
3. **Models.** Image-to-3D from the OK'd concept: low-poly mode = `model_type: "smart-topology"`, `ai_model: "meshy-t2.5"`,
   `target_polycount` = the row's `tris`, textured (2K). ("lowpoly" model_type retires 2026-11-30.) Check docs.meshy.ai first:
   the API moves.
4. **Renders** (three views a piece, one sheet) to mondo. **STOP** for redos.
5. **Wire only when he says.** Then: GLBs to R2 (`node sync-zip.js --put`): props `Assets/world/props/meshy/katana/<key>.glb`,
   plants and trees `Assets/world/nature/flora/meshy/<key>.glb`; a catalogue row each (`HQ_CATALOGUE` / `HQ_CATALOGUE_FLORA`,
   trees an `HQ_TREE_KINDS` row); a `list-models.js` SOURCES row if the folder is new, rerun it, commit MODEL_LIST.md in the
   same PR. Placing them in Katana Island is the Katana holder's (claims.md, thread 21); placing them in another zone is that
   zone's holder's.

Keep the concepts, models, renders and `tasks.json` (Meshy task ids, so one id can be redone) in R2 bucket `dirtymondo` under
`project-files/meshy/katana-flora-b1/` (the owner's `/mnt/project-files` is not visible from other accounts). Log what was made
and what he said in docs/notes/models-assets.md "THE KATANA + FLORA MESHY BATCH".

## HIS CONCEPT RULES (learned 11-03; every prompt already follows them, keep them on redos)

- A holder and what it holds are separate pieces (the bell has no frame, the barrel no stand, the armour later gets its own stand).
- Nothing that is VFX: no glow, no flame in the lantern, no water, no smoke, no lava.
- No ropes, cords, strings or chains (no shimenawa rope on the torii, no bell rope, no paper streamers).
- Flat things are PNGs, not models (the lily pads round the lotus are code cards; the lotus' own two pads are part of it).
- No writing on anything (plaques, boxes, barrels are plain).
- Something that moves in code is modelled straight (the koi).
