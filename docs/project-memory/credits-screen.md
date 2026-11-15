---
name: credits-screen
description: Main menu CREDITS page (PR #745, 11-01): where credit rows live, which asset pack authors are known, which packs still need mondo to name a source
metadata:
  type: project
  modified: 2026-11-01T10:02:25.250Z
---
mondo 11-01: wanted a real game credits section (main menu / settings), not in the character creator; credit every third-party pack + "Dirty Mondo" for music/soundtrack and SFX.
PR #745 merged, token 20261101-credits-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261101-1002.zip (data.js, map.js, party-builder.js).
- Main menu → CREDITS (last button) → #creditsPage; rows = data.js EW_CREDITS.sections; `makehuman: true` section also loads mpfb/CREDITS.json. Creator's CREDITS button removed.
- DEVELOPMENT section (PR #749, zip 20261101-1035): mondo's own credit = "As Above So Below Studios" (Developed by; his words "As for me just say as above so below studios"); Kenneth Robnett = Game Designer (spells, playstyles, passives, stats/rankings, rules, playtesting). Dirty Mondo kept on music + SFX.
- New credited asset = add a row to EW_CREDITS (CC-BY MakeHuman assets go via bake-mpfb.py CREDITS.json automatically).

Authors found from the files (11-01): Quaternius CC0 (Assets/foilage/License.txt, UAL1/2); Pizza Doggy Retro Tree Pack CC0; Elbolilloduro (Metro_PSX CC0, halloween.fbx + Christmas.fbx = "Paquete de modelos psx 3"); FlexUnit UFO_Low_Poly CC0 (notes said mondo made it, files match FlexUnit's free pack); stairs.glb Ansh_Singla + stairs_railings ATD-London (Sketchfab CC-BY 4.0, MUST stay credited); cars GGBot (OBJ header); liquids Screaming Brain Studios CC0; 1024x512 sky sets = Screaming Brain Studios Seamless Sky Backgrounds CC0 (skies switched off, not listed); fonts Manfred Klein (Aida), Fredrick Nader/Apostrophic Lab (Contra), Cundrawan (Ghiya Strokes), CAT Fonts (Indira K).
UNKNOWN, not on screen, asked mondo: insects, oceanic, traps, instruments, orchestral, chess set, farm animals, horse, bats, elephant, crow+rabbit, street lamp, urban sheets, terrain sheets, door/models non-Meshy (doors, chairs, asteroids), pyramid, spear.
itch.io hosts are not on the env allow list (WebFetch fails); WebSearch works.
Related [[mpfb-asset-packs]] [[character-models-plan-doc]]
