---
name: sky-throw-landing-pick
description: Sky throw (To the Moon, Abduction Beam, Dragon Toss, Infernal Hurl) landing pick rules + back-out refund, PR #356 2026-10-20
metadata:
  type: project
  modified: 2026-10-20T08:52:21.384Z
---

mondo 2026-10-20: To the Moon lifted the target, a lit tile was refused, right-click left the target in the air. PR #356 (token 20261020-landing-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261020-0852.zip: battle 18eaf269, hud 5f2119c5, online ab88a59c, three-renderer dddf2905, ui 1459f67c).

- The refusal: lit landing tiles in team fog hit clickTile's fog gate ("Out of sight"). Now exempt like the blink landing.
- **How to apply:** battle.js `skyThrowLandingPhase` / `getSkyThrowLandingTiles` = the lit ring; getSpellRangeTiles returns it during the pick. The grab arms the 'spells' view (no enemy list). The click uses the hovered tile, not a unit sprite.
- Back-out (right-click/BACK/ESC) = `cancelSkyThrowGrab`: the body drops, the spell is uncast, `_skyThrowGrab.mpPaid` is refunded. Every `_releaseSkyThrowGrab` refunds. Guest relays it to the host.
Related: [[spell-aim-rule]], [[forced-movement]].
