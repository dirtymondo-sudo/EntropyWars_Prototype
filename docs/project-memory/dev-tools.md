---
name: dev-tools
description: Dev tools mondo picked on 2026-10-08 (Data Panel, item editor, NPC talk, encounter tables) are merged in PR #176; six more tools wanted eventually
metadata:
  type: project
  modified: 2026-10-08T05:47:06.583Z
---

PR #176 (merged 2026-10-08): Data Panel (F9 / DATA in pause menus / editor 🧮 DATA, `EWDataMods` diff layer, localStorage `ew_data_mods_v1`, off online), ITEMS tab makes new items via `like` (heal/mana/revive/elixir only), editor room ENCOUNTERS section (`rooms.<id>.encounters`, `hqRoomEncTable`), person TALK form (`npcSpots[].talk`, story flags in profile.door.hq.flags). Sync zip r2-sync/ENTROPY_WARS_SYNC_20261008-0546.zip.

Still wanted "eventually" (mondo: "2, 10, 5, 6, but eventually all of those"); don't start without him: 1 publish button, 3 local dev mode, 4 events/triggers, 7 cutscene timeline, 8 model/anim viewer, 9 battle setup maker.

**Why:** next dev-tools thread should not re-propose or rebuild these.
**How to apply:** build on EWDataMods / the editor inspector forms; see docs/notes/editor.md "THE ENCOUNTER TABLE + THE TALK" and ui-menus-audio.md "THE DATA PANEL".
