---
name: r2-layout-plan-20261104
description: R2 bucket reorganization DONE (PRs #894-#900): new Assets/ folder layout, EW_ASSET_MOVES alias table, r2-layout.js tool; old keys archived 11-05
metadata:
  type: project
  modified: 2026-11-04T22:56:49.591Z
---
mondo 11-04 asked for a senior-dev plan to reorganize R2 (thread "Plan an R2 asset folder reorganization"), then said
"sounds like a good plan, go ahead" (thread in the owner project). Plan + log: repo docs/notes/r2-layout-plan.md
(§9 THE LOG), per-key inventory docs/notes/r2-inventory.tsv.

DONE 11-04 (main 8e85ec6, token 20261104-r2w5-01-cors):
- W0: 807 junk keys (root repo files incl. server.js, docs/, THE LAND) ARCHIVED to dirtymondo:archive/2026-11/<key> (sha-checked), removed from ewmusicsfx.
- W1 PR #895: sprites.js EW_ASSET_MOVES + ewAsset()/ewAssetKey() + safety net (fetch/XHR/img/audio/source/setAttribute/inline style backgrounds);
  three-renderer _asKey moved keys; sync-zip.js --put maps old->new; list-models.js shows new paths; tool r2-layout.js (--copy/--verify/--manifest/--rewrite/--archive/--list) + r2-layout.json waves.
- W2+W3 PR #896 (audio, ui, fx), W4 PR #897 (world), W5 PR #898 (characters). New layout: Assets/characters/{races/<lowercase race>/<male|female>,creator,animations,portraits,sprites,gear},
  Assets/world/{hq,props/meshy,props/meshy_decor,packs/<maker>_<pack>,nature,sky,terrain,vehicles,animals}, Assets/fx/{spell_props,flipbooks,sprites,projectiles},
  Assets/ui/{icons,status,sprites,fonts,mapshots,brand}, Assets/audio/{music,sfx}, Assets/loose_sprites (old Sprites/ root, sort later). Assets/opt + code files unchanged.
- EW_ASSET_MOVES rows are PERMANENT aliases (_S, _R2_MISC, _CAR_PACK_BASE, three-vfx _R2 still build old paths). Never remove them.
- Repo folder charactercreation/ = R2 Assets/characters/creator/.

ARCHIVED 11-05 (mondo: "yeah everything seems to be working", (thread in the owner project): PR #899 widened the
safety net (innerHTML/outerHTML/insertAdjacentHTML, <style> textContent, new Audio(url)), token 20261105-r2arc-01-cors; then
`node r2-layout.js --archive-moved <wave>` moved 4,708 old W2-W5 keys (8.2 GB) to dirtymondo:archive/2026-11/<old key>. Use --jobs 2 (6 hits rate limits).
A 404 later = a code path missing ewAsset; the file is in the archive and at its new key.
STILL OPEN (his OK on exact list): §5 orphans (unused Meshy clips etc., now in new folders). W6 optional.
GOTCHA 11-05 PR #929: style.backgroundImage setters can't be wrapped in Chrome (no accessors) or new Firefox (CSSStyleProperties), so React inline backgrounds went to archived old keys -> 404 -> ORB warnings. sprites.js now remaps its 2D tables + sprite/portrait getters via ewAsset at load + a childList observer. New code: build URLs with ewAsset(), don't rely on the net for CSS backgrounds. atlas.png 404 FIXED PR #930 (crow/rabbit GLBs name ../textures/atlas.png; GLTF URL modifiers get path+uri UNRESOLVED, so resolve ../ before matching).
Gotchas: a flip must rewrite ASSET_MANIFEST (else opt swaps die silently); r2-layout waves assign a key by the winning row across ALL waves.
Related: [[r2-direct-upload-setup-20261103]] [[meshy-audit-pack-first-20261104]] [[inbox-dropoff-20261103]]
