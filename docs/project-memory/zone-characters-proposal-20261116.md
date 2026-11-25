---
name: zone-characters-proposal-20261116
description: Zone-character units (mondo 11-16/17): his picks, Meshy rules, and the 11 races shipped in PR #1908 (kits, rules, models)
metadata:
  type: project
  modified: 2026-11-16T22:45:09.677Z
---
Thread (owner-project id) "Brainstorm new characters for every zone" (mondo 11-16 22:35: more unit concepts per zone/district, variety, no zone with only 3-4 natives, each a unique combat style, South Park-style satire + scifi/fantasy/esoteric/conspiracy, meme-able).
Doc: https://claude.ai/artifact/XYvVFvEcJ9XWUspBrTfX5z ("New characters for every zone"). No repo change.

Native counts used DOOR_TEXT.POINT_OF_ENTRY + HQ_CITY_RESIDENTS homes (main PR #1886). Thinnest: DOOR HQ 1, Sewers 1, Astral 2 (Dreameater/Occulus = my reading), Vatican 2, Heaven 3, Antarctica 3, Woods 4; DC Civic 0, Hills 0.
45 concepts (11 DC + 34 other zones), 10 need a new rule (Smiler light map, DMV Clerk blitz order, Crypto Bro stake, Delivery Rider carry, Plastic Surgeon stat swap, Plumber linked squares, Gatekeeper karma, Flight 19 off-board, Bloop permanent invisible, Trucker group move).
First batch recommended: Florida Man, Area 51 Raider, Partygoer, Sleep Paralysis Demon, Fatberg, Doomsday Prepper, Wellness Guru, Flat Earther.
Not repeated: the earlier list [[new-units-areas-proposal-20261116]].

**How to apply:** none approved until mondo picks; next step after picks = looks (MPFB2 first, Meshy for missing pieces).

History: picks 11-16 (Delivery Boy, Librarian, Televangelist, Pilot, Eskimo, Ghost Hunter, SPD, Plague Doctor, + Wendigo, TMNT sewer parody); he insists on HIS names. RULE: never put comedic/satirical/cartoon words in a Meshy concept prompt (Pixar look angered him); add 'realistic proportions, NOT cartoon, NOT Pixar'.
11-17 00:27 CT mondo approved: DELIVERY BOY, LIBRARIAN, TELEVANGELIST B (only these three so far). Models made + Meshy-rigged: /mnt/project-files/new-races-2/models/<key>_rigged/_walking/_running.glb (keys delivery_boy, librarian, televangelist_b); models_sheet.jpg. Flaw: dark scratch specks in textures (same as batch 1). 
11-17 01:13 CT mondo: also Influencer, Referee, Florida Man, Boltzmann Brain, Wendigo, Karate Frog, Samurai Slug, Cicada Brood. SHIPPED 11-17 PR #1908: all 11 playable races (one new rule each; notes champions-combat.md "THE NEW RACES 2"), models on R2 Assets/characters/races/<slug>/, proof pics new-races-2/proof/. Not done: Influencer doll face redo (offered), Filter disguise, per-spell VFX polish, NPC residents in zones.
Sprites: mondo wants SPRITE AI 128x128 sprites for every new race (not model cuts). Done PR #1911 (<slug>_px.png, files new-races-2/sprites/).
REFEREE POLISH 11-17 PR #1915 ((thread in the owner project)): red card was blocked on a booked+Marked foe (fixed), CPU now aims for it, exited units drawn as shade, own VFX; proof new: /mnt/project-files/referee-polish/. Probe harness probe_ref.js there (race swap leaves HUD name of old unit).
FLORIDA MAN POLISH 11-17 PR #1925 ((thread in the owner project)): own VFX + BREAKING NEWS paper, Gator Toss x1.5 on Wet, headline announced at turn start, CPU values headline (Bath Salts before hit). Proof /mnt/project-files/florida-man-polish/. Probe harness fm-lib.js there. Log names carry invisible \uE000/\uE001 markers (regex on names must allow them).
