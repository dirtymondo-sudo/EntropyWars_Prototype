---
name: shadow-realm-20261026
description: Shadow Realm spell reworked to match its text (PR #553, 2026-10-26): second plane both ways, pair hidden off their turns, dark realm view; calls flagged
metadata:
  type: project
  modified: 2026-10-26T10:31:46.951Z
---

mondo 10-26: Shadow Realm "doesn't work as it says" (units didn't disappear, partner got opportunity-attacked by his own unit, wants to see the pair only on their turns, simple all-dark realm). PR #553 merged; sync zip ENTROPY_WARS_SYNC_20261026-1031.

- Rule = the row text in data.js raceShadowRealm. battle.js `shadowRealmKey` / symmetric `isUnitRealmShieldedFrom` / `realmViewKey` / `isUnitOutOfRealmView`; three-renderer `_realmTick` (dark view, Cubes hidden). Full notes: docs/notes/champions-combat.md "THE SHADOW REALM WORKS AS WRITTEN".
- Calls flagged to mondo (unanswered at delivery): hidden pair still holds its squares; turn column still lists them; AoE in the realm still paints terrain on real squares; realm units skip Nexus/zone/traps/pickups; pair always see each other, lend team no sight.

**Why:** he asked for the spell to behave exactly as its description says.
**How to apply:** any new interaction path (new push, new auto-hit, new target list) must gate on `isUnitRealmShieldedFrom`. Related: [[auto-attack-push-20261026]] [[minimap-20261026]]
