---
name: map-looks-off-clean-20261024
description: Map Looks unchecked = the player's own settings in every area (PR #487 clean grade, PR #491 fog colour/night mood/bloom), 2026-10-24
metadata:
  type: feedback
---
mondo 10-24: "if i have map looks unchecked then why do i always have to change the settings..." then clarified: "i have the fog
settings a certain way like on haunted green, but going to any new area with different colored fog it takes away my green" and
"when i ... go somewhere new and the night mood is not the way i had it". His rule: Map Looks off = no area changes any of his settings.
- PR #487: untouched shipped PS1 grade (tint, dither, pixelate, grain, vignette, CRT) reads off while Map Looks is off (three-post.js _LOOK_CLEAN).
- PR #491: fog colour = his mood preset's fogColor everywhere (battle render(), HQ _hqFogHold incl. dome band + painted sky far fog);
  night mood = night x slider x 0.85 everywhere (_roomNight); bloom = his strength/threshold/spread everywhere (_bloomSteady).
- Fog DENSITY still = slider x area base (told him; open if he objects).
Zip r2-sync/ENTROPY_WARS_SYNC_20261024-1344. Proofs /mnt/project-files/map-looks/.

**Why:** he sets his look once and expects every area to respect it when Map Looks is off.
**How to apply:** any new per-area visual override (fog, grade, light mood, bloom) must check Map Looks (ThreePost.getPlayerFogHex / _looksOffNow) and yield to his settings when off.
