---
name: sprite-ai-connection
description: Sprite AI (pixel-art generator) works from cloud threads via proxy-injected auth on https://sprite-ai.art/api/mcp (NOT www.); tools + token costs
metadata:
  type: reference
  modified: 2026-11-17T05:20:17.797Z
---
Connected 2026-11-17 ((thread in the owner project)). The cloud proxy injects mondo's key for host `sprite-ai.art` only: POST JSON-RPC (initialize, tools/list, tools/call) to `https://sprite-ai.art/api/mcp` with `Accept: application/json, text/event-stream`, no auth header needed; replies are SSE `data:` lines. `www.sprite-ai.art` returns 401 (no injection). Not an MCP tool in sessions; use curl.

Plan "production", 1502 tokens on 11-17 (900 monthly + 604 bought). Costs: sprite_generate 1 token (32-400 px, asset types character/creature/prop/weapon/vehicle/tile/background/ui/effect); sprite_generate_animation 14 tokens at 8 frames, up to 20 at 16; refined background removal 1; import/standard bg removal/palettes/capabilities free. Other tools: restyle, combine, normal_map, rotate (8-direction strip), get_job, list_creations, get_balance. Download URL `https://sprite-ai.art/api/sprites/<id>/download` (no auth).

Test sprite only (64x64 knight) in /mnt/project-files/sprite-ai-test/. Art generation rules still apply: nothing goes into the game without mondo approving Sprite AI as a source (see [[visual-rules]]). mondo pasted the raw key in chat 11-17; told to rotate.

RACE SPRITE PIPELINE (tested 11-17 on Mole Man, mondo asked to automate his web flow): his 128x128 race sprites come from the Meshy concept art (/mnt/project-files/new-races/concepts/<key>.png, 1024 px grey bg). The MCP has NO image-to-pixel-art / resize tool, so: (1) locally cut the grey bg (border flood fill of low-saturation light pixels), crop, fit the figure into 128x128 feet-down, hard alpha; (2) sprite_import it (free); (3) sprite_generate with reference_asset_id + prompt describing the unit, 128x128, 1 token = the good one (faithful, fills the square). v1 generate-with-reference = faithful but painterly. v2 (mondo prefers the restyle LOOK, closer to his pixel style): sprite_restyle of the imported concept, prompt naming every colour/item ("BROWN leather apron, not overalls"), palette_extras 4, size 160 (restyle shrinks the figure ~80%), then crop 128x128 around the figure feet-down = 2 tokens; first restyle without these drifted to blue overalls + small figure. Helper /tmp/claude-0/sai.py (scratch). Mole Man version A SHIPPED PR #1901 (mole_man_px.png on R2, recipe in docs/notes/models-assets.md "THE PIXEL SPRITES FROM SPRITE AI"). The other 11-16 races still have model cuts (80x128); offered to do them the same way.

11-17 batch SHIPPED PR #1903: banker, sewer gator, skater, tech ceo, magician, lifeguard, male shaman, time cop (<race>_px.png). Use restyle size 128 directly (160+crop cut heads). Time Cop source = future-cop model render (no concept).
REDO PR #1905 (6 were cropped at top): cause = my bg cut drifted into dark/grey clothes (neighbour-compare flood fill), ref was fragments. Fixed cut = numpy distance to BORDER colours + flood; always eyeball cut-out on magenta before tokens. Files <race>_px2.png.
BATCH 3 PR #1906 (18 units from new-races/concepts). DOOR agent M/F (recruit + Agent Belle cast GLBs, not creator looks) done PR #1907 from three.js front renders of the GLBs. mondo 11-17: skip male skater, male lifeguard, female nordic, male ghost for now.
11-19 SIX MORE PR #2152 ((thread in the owner project)): E-Girl, Golem, Seraphim (eye-wheel 3D look), Shaman M (px3), Streamer M, V-Tuber from 3D model front renders; scripts /mnt/project-files/sprites-six-20261119/. Waiting on his look.
