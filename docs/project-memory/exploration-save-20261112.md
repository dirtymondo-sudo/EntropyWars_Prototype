---
name: exploration-save-20261112
description: Exploration autosave + Continue resumes in the saved room/spot (PR #1219, 11-12); where it lives, what was not built, how to prove it
metadata:
  type: project
---
mondo 2026-11-12: "there needs to be a save feature so that i am not always loading in the foyer every time" (thread in the owner project).
- SHIPPED PR #1219, token 20261112-save-01-cors, map.js + three-renderer.js live on R2.
- Autosave only, no new UI: record `ew-hq-save-<slot>` in localStorage (room, x, z, y, face), filed on room ready, every 4 s while moving, on tab hide/close. Continue lands there; New Game clears it and uses the foyer. Off: `?noresume`. Console `_hqSaveState()`. Notes: docs/notes/story-party-progression.md "THE SAVE".
- Quests / party / bag were already in the profile (`ew-profile-<slot>`).
- NOT BUILT (offered once): a manual Save / Load page in the pause menu; needs his OK on a mock-up first.
- Not covered: a reload mid-fight resumes in the room at the last filed spot (the fight is not saved). Saved record is per browser, not synced to the server account.
- Proof harness: /mnt/project-files/exploration-save/probe_save.js (qt.js-style route cache, `?nointake&nomenu3d&ew_gpu=webgl2`, about 6 min per reload round). Passed in central_egress, office, site_prebuilt_cyberpunk_streets.
