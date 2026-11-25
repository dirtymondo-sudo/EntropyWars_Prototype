---
name: zone-flags-20261123
description: Zone flags ((thread in the owner project), 11-23): built + live PR #2483 + #2494; his picks, where they fly, the banner/flag markers
metadata:
  type: project
  modified: 2026-11-23T17:02:36.214Z
---
mondo 11-23: flags for zones. HIS designs: Disaster City (exists: three-renderer.js _hqArchSignTex 'mark:flag', C.js flag() on Civic poles, flat quads), Katana Bay = red square on white (also his Relationship Web note on place "Katana Bay"), North Pole = red with green cross like a wrapped gift, Came A Lot = crest (sword+shield / dragon / lion, undecided). Flags should move "in between" flat and cloth sim.

Proposal (not built): artifact https://claude.ai/artifact/ASbdLqXahFRUu3vksdzuJQ, files /mnt/project-files/zone-flags/ (zone-flags.html, flags_src.html, crests/ = 4 Meshy text-to-image crests, 36 credits, gen_crest.py).
- Motion options A flat / B baked ripple / C vertex wave / D wave + gust on the trees' wind clock (_EW_WIND, _ewWindHook pattern + _ewNodeTag for WebGPU). Recommended D.
- North Pole A plain cross / B with bow. Came A Lot A sword+shield, B dragon, C lion (my pick: matches Meshy `banner` red/gold lion), D Holey Grail (parody).
- Suggested extra flags (from branding.md names, no new factions): DOOR HQ (his door_mark_color.png on navy), Nowhere (Western Town), Area 51 REDACTED bars, D.C. Beach Patrol red/yellow, Heaven Pearly Gates, Hell pitchfork, Antarctica Cold Shoulder. No flags for Woods/Sewers/Cavern/Leylines/Atlantis/Deep; Moon flag stays stiff.
- Carriers: Meshy `flag_pole` (white cloth) already at Area 51 gate, North Pole lookout, ski lodge, Colosseum plaza; swap cloth only.
HIS PICKS 11-23 17:09Z: motion D (wave + gust); North Pole B (bow); Came A Lot A (sword + shield, the Meshy picture crests/cam_sword_shield.png); extras YES = DOOR HQ, Nowhere, Area 51, Heaven. Beach Patrol NO (the beach is in the city: it flies the Disaster City flag). Hell = REDO. Antarctica = 'a flat earth map or something'. Round 2 = Hell A horns+flame / B contract (my pick) / C goat skull; Antarctica A flat-earth UN-style (my pick) / B dome; pics crests/*.png. BUILT + LIVE PR #2483 (token 20261123-zoneflags-01-cors, data.js b3f5115e, three-renderer.js 56305aea): data.js ZONE_FLAGS + zoneFlagsApply, catalogue zone_flag / zone_flag_hall, renderer HQ_FLAG_ART + _hqFlagCloth (wave on _EW_WIND, WebGPU k 'flag'), city Civic flags wave via _hqArchFlagsOut. Proof /mnt/project-files/zone-flags/in_game_flags.jpg. Notes branding.md THE ZONE FLAGS. NEXT: add Hell + Antarctica when he picks (img on R2 world/flags/, a ZONE_FLAGS row each). Not seen on WebGPU.
ROUND 3 LIVE PR #2494 (token 20261123-zoneflags-03-cors): Hell A + Antarctica A (R2 world/flags/hell.jpg, antarctica_flag.jpg), Heaven poles on the landing, Came A Lot banners = crest (royalBanner cloth 'mark:banner:camelot', tower flags 'mark:flag:camelot', Meshy banner -> zone_banner via ZONE_FLAGS.banners), beach flags = waving city flag ('mark:flag:dc' in B.js + beach S.js). Waits his look.
