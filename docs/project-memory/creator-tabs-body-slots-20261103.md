---
name: creator-tabs-body-slots-20261103
description: Creator split into 5 tabs + OUTFIT by RPG body part (PR #851, 11-03); where a new piece's slot is set
metadata:
  type: project
  modified: 2026-11-03T10:28:02.734Z
---
mondo 11-03: "tabs instead of one long list ... clothes+accessories organized by body part like a typical rpg; head, torso, left arm, right arm, legs, footwear".
PR #851 (zip ENTROPY_WARS_SYNC_20261103-1027): creator tabs BODY/FACE/SKIN/HAIR/OUTFIT (sticky bar); OUTFIT = Head, Face, Neck, Torso, Back, Left arm, Right arm, Waist, Legs, Footwear, one kind at a time; pairs (gloves/nails/sleeves/arm armour) on both arm tabs under BOTH ARMS. Left/right = piece's side in MPFB bind pose (+x = character's left).
Display only on top of THE SHELVES ([[creator-shelves-20261102]]): shelf still decides one-pick rule.
**Why:** later threads adding pieces must give them a body part.
**How to apply:** sprites.js THE BODY SLOTS: EW_WEAR_SLOTS / EW_WEAR_GROUPS / EW_WEAR_GROUP_OF_SHELF / EW_WEAR_GROUP_MOVE (per-id). Notes character-creator.md "THE TABS + THE BODY SLOTS", plan row 12n. Shots /mnt/project-files/creator-tabs/. MEN/WOMEN switch shows only on sided kinds (never a do-nothing setting).
