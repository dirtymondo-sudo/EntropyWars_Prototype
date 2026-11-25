---
name: meshy-casts-20261124
description: 11-24 Meshy library casts: lib 9 MAL6 (46 dances/gestures), 32 spells got animClip picks (PR #2528); the 1.4 s cast cap; batch 2 pending
metadata:
  type: project
  modified: 2026-11-24T14:50:40.688Z
---
Thread (owner-project id) ("Use Meshy's animation library for spell casts"). mondo asked for a dance/flirty clip on Influencer Go Viral and more spell-anim variety for the ~20 newest units.
- We had pulled 130 of Meshy's ~680 clips (11-11), no dances. 11-24 pulled 46 more (168 credits, Meshy balance 1,157) -> lib 9 `Assets/characters/animations/MAL6_Sniper.glb`. Breakdance_1990 is broken.
- PR #2528 merged + uploaded (token 20261124-meshycasts-01-cors): 32 spell rows `animClip: {name, lib: 9, ts, trim, strikeAt}` (Go Viral = Gangnam_Groove), incl. Weatherman/News Anchor rows their thread asked for. sprites.js registerSpellAnimClips now copies strikeAt/trim/pinXZ/turn.
- RULE: board casts cap at 1.4 s (_maybeStartModelAnim) -> window/ts <= ~1.45 s.
- Batch 2 PR #2532 merged + uploaded (token 20261124-meshycasts-02-cors): 35 more clips -> lib 10 MAL7_Sniper.glb (105 credits; Meshy balance 650 at 15:55Z, other threads spend too); 18 more rows (Skinwalker, Nordic, Bear, Monk, Doll, Janitor, Mechanic, Gambler, Televangelist, Wendigo, Florida Man, Stadium Show, Hippie). mondo 11-24: "Feel free to download any more animations you think would fit" (standing OK to pull). New clips = a NEW lib file (old ones long-cached). Batch 3 gun units: 6 clips -> lib 11 MAL8_Sniper.glb (18 credits); 7 rows (Suppressive Fire, Empty the Clip, Choppa, Fan the Hammer, Incendiary Rounds, Extended Clips, Bipod). Still open: VFX review. Notes: docs/notes/spells-vfx.md "THE MESHY CASTS". Proof + sheets: /mnt/project-files/meshy-casts/.
