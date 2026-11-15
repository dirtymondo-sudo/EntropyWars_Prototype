---
name: spell-vfx-fx3-20261026
description: Spell VFX audit batch FX-3 (nature/poison + blood/shadow looks), PR #575 merged 10-27, calls flagged to mondo
metadata:
  type: project
---
FX-3 of the spell VFX audit fix (fix/BRIEF.md), PR #575 merged 2026-10-27, token 20261026-fx3-cors, zip ENTROPY_WARS_SYNC_20261027-0007.
Sheets + NOTES.md: /mnt/project-files/spell-vfx-audit/fix/FX-3/. Code block "SPELL LOOK FIX FX-3" in three-vfx-effects.js.
Calls flagged to mondo (unanswered at merge): 1 swamp/Black Ooze sheet Blue_06 -> Purple_01 darkened (overrides PR #545);
2 cloud poisons + The Swarm no longer lay the venom pool (_PV_CLOUD_OWN); 3 Indoctrinate cone robe removed; 4 Kool-Aid = cocoa mug;
5 Trunk Throw throws the board pine; 6 Chemical Concoction re-skinned poison; 7 Terror Pounce claws land with the number;
8 blood buffs crimson.
Known weak: Overrun ants still hard to see (no ant model; MISSING_MODELS.md lists sack, bee, ant, crow, voodoo doll, needle).
Harness gotcha: Soul Bind's second pick stalls on the HUD path; prove link spells with SV.prep(target:{targetId, partner}).
Related: [[spell-vfx-audit-20261026]] [[spell-fx-cam-20261026]] [[spell-vfx-fx5-20261026]]
