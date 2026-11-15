---
name: terrain-spell-count
description: terrainCreate cast line "Converted N tiles to X": ground spells count footprint tiles that ARE the terrain (PR #385); wall/monument spells count standing pieces (PR #399) + browser sweep recipe
metadata:
  type: project
  modified: 2026-10-21T13:00:51.464Z
---
mondo 10-20: Flash Freeze log said "Converted 0 tiles to ice" though 3 tiles were ice. PR #385: battle.js terrainCreate counts footprint tiles whose terrain now equals the paint (already-ice recast was the 0 path).
10-21 (mondo: "it is clearly a bug that exists"): the real remaining 0 was WALL SPELLS (monument rows: Pyramid Protocol, Walls of Camelot). They never paint ground, so convertedTiles was always empty -> always "Converted 0". PR #399 (main fc598c7, token 20261021-wallcount-02-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261021-1259.zip): monument cast line is written after placeSpellMonument and counts footprint tiles with a piece of that kind (state.monuments). Screens /mnt/project-files/tile-count/.
- Browser sweeps 10-21 (Mount Shasta, Haunted, North Pole arenas): Flash Freeze/Permafrost counts all matched the board.
- Probe recipe (scratchpad, cloud only): Playwright chromium-1194, --use-angle=swiftshader, ?nohq&ew_gpu=webgl2; route cdn.jsdelivr /npm/<pkg>@v/<path> to an npm install of the import-map versions, cdn.socket.io to socket.io-client dist, react/react-dom/MeshLine curled from CDN, cdn.entropywars.net *.js/css to repo. Launch: _goToVsCpu, set _msSelectedMap (MS_MAP_LIST modeId e.g. prebuilt_shasta_delta) + _msSelectedGM, _msConfirm, click the "SEAL YOUR FATE" element. Downtown arena stayed in 'setup' phase (bogus casts). logEntries are plain strings: use a UNIQUE marker + lastIndexOf. Fog/LOS reject casts: teleport the caster 2 tiles from the target. Combat log hides (opacity 0) while board busy: add class 'hold' to #ewCombatLog for screenshots. Don't pkill -f a pattern in your own command line.
Related: [[lava-water-stone]], [[combat-log]], [[hands-on-playtest]].
