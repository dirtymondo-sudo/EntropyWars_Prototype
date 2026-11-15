---
name: meshy-decor-concepts-20261103
description: Decor D01-D92 + S01-S04 Meshy concepts 11-03 (thread in the owner project), 71 modelled on Meshy, not wired in
metadata:
  type: project
  modified: 2026-11-03T07:09:07.930Z
---
Proxy injects the Meshy key for api.meshy.ai (send `Authorization: Bearer dummy`). Files /mnt/project-files/meshy/decor/:
concepts/<id>_<key>.png, decor_prompts.json (each row has `status`: meshy / pack: <pack> / hold / drop), decor_status.md,
sheets decor_meshy_v2_01..06.jpg (only status=meshy rows), scripts concepts.py + sheet.py + tasks.json.
v2 after audit: 65 to make (D41, D89 dropped per PR #831) on Meshy, 30 covered by free itch packs (asset-packs/, doc https://claude.ai/artifact/XH3QBNYvZdgLkDRV5umPAr),
9 on hold (paid packs D22 D39 D68 D78 D91, D40 anemone), 2 dropped as flat PNGs (D16 sign, S03 polaroid). Balance 7,179.
MODELLED 11-03: ALL 71 meshy rows (62 + the 9 held ones he OK'd, sheet decor_models_b3.jpg) = GLBs in meshy/decor/models (+_thumb), sheets decor_models_01..04.jpg + decor_models_b2.jpg, mtasks.json (pop an id to redo). Flaws D59 D77 D84 D45 D72 D06 D68 redone (D68 glass baked opaque: Meshy can't do glass, concept redone with no glass) (old in models/v1_flawed). Balance 5,964. NOT wired into game / MODEL_LIST yet (his call). mondo 11-03: no paid packs bought yet; Meshy is last resort but use Meshy for now.
The held paid-pack rows D22 D39 D68 D68b D78 D91 D91b D91c + D40 anemone are now Meshy too. Pack-covered now also D08b D28b D59b.
Blender 4.2.3 in scratchpad renders pack FBX pieces by object name (brender.py in meshy/decor/); packs extract with 7z (apt p7zip-full).

mondo's concept rules learned 11-03 (he was angry at repeats; apply ALL up front next time):
- Every holder/container and its contents are SEPARATE pieces (torch + wall bracket, umbrella + stand, table + chairs,
  stall + toilet, shelf empty, armour + stand, music box + dancer, carousel + horse, ferris frame + wheel + seat).
- Nothing that is VFX: no smoke, no lava inside a lava lamp (moves in game), no glows/lit LEDs.
- Flat things (signs, photos) are PNGs, not 3D models.
- Check MODEL_LIST.md + the packs first; reuse existing models (sword, vhs_tape, cardboard_box).
- No animal carvings; no ropes/cords/cables/rigging; sails UP; long broom handles; piano keys showing.
Related [[meshy-api-pieces]] [[model-list-master]]
