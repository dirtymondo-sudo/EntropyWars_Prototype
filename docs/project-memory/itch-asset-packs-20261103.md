---
name: itch-asset-packs-20261103
description: 45 free itch.io PSX packs downloaded to project files asset-packs/ (11-03) to replace Meshy/code models; paid list for mondo; Pizza Doggy license limits
metadata:
  type: project
  modified: 2026-11-03T07:05:32.643Z
---
mondo 11-03: goal is to eventually replace Meshy models with human-made packs; he likes Elbolilloduro and Pizza Doggy.
Thread (thread in the owner project) downloaded 45 FREE packs (original archives) to
/mnt/project-files/asset-packs/: elbolilloduro/<pack>/ (33 packs, all CC0 except Characters PSX = free commercial, no re-upload)
and other/<author>_<pack>/ (12: derelict furniture, castle+fort, gothic church CC0, BlenderVoyage graveyard+submarine CC-BY = credit,
Molten Maps sci-fi CC0, industrial, alxinc lab (license vague), jamzuz, playground, beach props (no license), DreamKit monsters).
contents-lists/ = object names inside every pack (json) + Pizza Doggy Mega Pack I/II contents + their license PDF.
Doc mapping packs -> gaps: https://claude.ai/artifact/XH3QBNYvZdgLkDRV5umPAr (free packs fill ~30 of 92 §10A decor gaps, ~50 Meshy swaps).
WIRED 11-03 (PR #837, mondo asked): 26 Meshy props -> Elbolilloduro pack pieces, R2 Assets/misc/ebd_<pack>_<item>.glb (not in repo; in sync zip
by hand; copies in project files asset-packs/meshy-swap/glb + side-by-side sheets). bake-pack-pieces.py rebuilds them. MODEL_LIST 10F = the table.
Kept Meshy: school_bus, cardboard boxes, wooden_bucket, fridges, signpost, urban buildings (mondo: later); car_cop already drawn by car pack.

Paid (mondo buys himself, never Claude): Pizza Doggy Mega Pack I + II 11.97 EUR each (sale), ALL IN ONE bundle 39 EUR
(includes both), carnival pack (applethecode) 4 USD, wildenza medieval 5.99 USD CC0, retro-futurism furniture 3.74 USD.
Pizza Doggy license (also covers Retro Tree Pack, which MODEL_LIST wrongly calls CC0): no AI input/reference (no Meshy from
their renders), assets must not be extractable as standalone files (we serve GLBs from public R2: flagged to mondo).
itch.io tag/browse pages are Cloudflare-blocked for curl/playwright; author subdomain pages + downloads work
(POST <game>/file/<upload_id>?source=view_game&as_props=1 with csrf_token gives the CDN url for free/PWYW uploads).
Related [[model-list-master]] [[credits-screen]] [[meshy-api-pieces]]
