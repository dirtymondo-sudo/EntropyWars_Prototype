---
name: area-units-20261024
description: AREA UNITS dev tool (PR #494, 10-24): per-area unit picker with portraits; HQ_AREA_ENCOUNTERS via EWDataMods; calls made
metadata:
  type: project
---
PR #494 (merged 2026-10-24, token 20261024-areaunits-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261024-1425.zip): mondo asked for a dev tool to pick which units appear in which areas, with portraits. ui.js AREA UNITS window (Shift+F9, Data Panel button, Settings > Developer, editor ENCOUNTERS button). Writes data.js HQ_AREA_ENCOUNTERS[roomId] through EWDataMods (localStorage). No row = game default. Details are in docs/notes/editor.md "THE AREA UNITS".

Calls the thread made (flagged to mondo): placed people (PEOPLE spots) whose race is off the list stand as a list race (toggle per list; talk/cast/clone spots are kept); travellers not on the list are kept out; city rooms (Disaster City/Sewers) now follow tables; the Data Panel + this window pause the HQ walk while open (pointer-lock fix); AREA UNITS is not a pause-menu row (the menu was already overflowing at 720p).

**Why:** the next dev-tools thread should build on this instead of making a second picker.
**How to apply:** extend the ui.js AREA UNITS IIFE / hqRoomEncTable. [[dev-tools]]
