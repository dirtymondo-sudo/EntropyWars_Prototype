---
name: creator-reference-toggle-20261101
description: 11-01 PR #776: creator stage pill SHOW ORIGINAL MODEL shows the race's Meshy model as a reference without touching the slot's look
metadata:
  type: project
  modified: 2026-11-01T21:48:27.769Z
---
mondo 11-01: wanted a button/toggle to see the race's original Meshy model while editing its creator look.
USE ORIGINAL MODEL (PR #765) was NOT that: it writes {model:'original'} on the slot and drops the slot's edits.

Shipped PR #776, zip r2-sync/ENTROPY_WARS_SYNC_20261101-2148.zip (party-builder.js 25a0b715), token 20261101-refmodel-01-cors.
- party-builder.js: the stage's top pill is a button while the creator is open: "◐ SHOW ORIGINAL MODEL" / gold "◑ ORIGINAL MODEL · BACK TO MY LOOK".
  State creatorRef = player:slot:race:gender; any creator edit turns it off. UI only.
- Probe: scratch copy of playtest_creator.js picking the Cowboy roster tile; the headless shots draw the creator look without cloth textures (same before/after, not this change).
Notes: docs/notes/character-creator.md "THE REFERENCE". Related [[race-looks-cowboy-20261101]] [[character-models-plan-doc]]
