---
name: atlantis-sunken-agora-20261113
description: Atlantis battle map redesign (mondo 11-13): board moved from the dry temple onto the abyss sea floor; built on branch, WAITS his OK; how drowned rooms became fightable; harness crash fix
metadata:
  type: project
  modified: 2026-11-13T02:47:10.883Z
---
mondo 11-13: "redesign the atlantis map ... i dont see any fish or coral at all ... epic underwater deep oceanic kingdom with greek inspired architecture ... merges science fiction technology and magic". Thread (thread in the owner project).

- Cause: the Atlantis board was a window of THE TEMPLE (dry air pocket). All the ocean pack life lives in THE ABYSS room.
- Built (SHIPPED PR #1246 11-13 after his "thats good for now", token 20261113-atlantis-01-cors, data.js 3dbdbabd + three-renderer.js 10c219bb live; shots in /mnt/project-files/atlantis-redesign/): board pinned to site_prebuilt_atlantis_abyss at (-3.5, 42): `board` feature 12x12 pale marble at h 1.2, corner marble blocks, 7 m columns, 4 lit crystal pylons, coral stands, THE PALACE north (podium, stair, temple_dome, columns, obelisks, statues, tesla coils), flank colonnades, jellies, sharks, dolphins, mantas, fish schools. Sizes 9-12 baked, fit.js true. Temple room untouched.
- Engine: data.js hqFieldRoomOk now passes a drowned room whose sea has `field: true` (side effect: abyss encounters fight on the sea floor). three-renderer.js: room round a battle board lights prop lamps nearest the board first (`_hq.lightAt`).
- Thread left open for his look on the Mac (brightness, kelp/coral colours).
- Open offers to him: no real Atlantean tech kit exists in the packs (only crystals, tesla coils, bathyscaphe) so a few Meshy pieces (energy conduit, shield pylon, holo panel) need his approval; exploration swim over the agora unchecked; headless shots are dark, kelp/coral colours unproven (his Mac).
- Swimmers must keep off the board footprint (anything above a unit hides it from the camera, including from the south side).

**How to apply:** harness = /mnt/project-files/battle-map-polish/first-third/tools/pm.js; with a warm .asset-cache the browser dies at load ("Connection terminated while reading from pipe") unless route replies are serialised (one fulfil at a time); chromium at /opt/pw-browsers/chromium-1243/chrome-linux64/chrome; ~6 min a run. `git fetch origin main` before branching: the local origin/main ref was 160 PRs stale.
Related [[battle-map-polish-first-third-20261110]] [[battle-map-boards-20261110]]
