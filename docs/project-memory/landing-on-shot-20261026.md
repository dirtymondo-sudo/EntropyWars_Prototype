---
name: landing-on-shot-20261026
description: Spell hits land when the camera frames them (PR #570, 10-26) — what moved, the helpers, the crash-number rule call left
metadata:
  type: project
  modified: 2026-10-26T23:04:17.838Z
---
PR #570 merged 2026-10-26 (token 20261026-landing-2-cors, zip ENTROPY_WARS_SYNC_20261026-2303 = battle.js + three-renderer.js
(FX-2's) + three-vfx-effects.js). mondo: "stick up and plunder and any other spells that need timing fixes for the camera and
damage landing". Timing only, same damage/rules.
Helpers: battle.js `_spellShotLanding` / `_landOnShot` / `_supportShotTimes` (hit on sourceHold + travelMs of the support
shot); `_stageBurstOnHit` (first caster hit after 250 ms fires the staging burst); VFX `aoeLandMs` (geometry `landMs` /
missiles.flyMs), `hitLeadMs` (geometry or _GO_SIG fn `hitMs`: Valkyrie Spear 710, Underfoot 700), `beamFrontMs` (Tsunami).
Moved: Stick-Up/Tithe (steal), Plunder, Door Slam, Trapdoor, gun doors (doorGunPlace actOnLanding), Outbreak, Void Rush,
erupting block, Revive, Shatter the Lattice, Skyscraper Toss, Merkaba, Snowball Volley, Tsunami, Valkyrie Spear, Underfoot.
Crash call: mondo said YES (10-26) -> PR #571: resolveForcedSlide slam/crash/auto attack land on the impact atMs via _slideHitAt; _slideDown (pending dmg >= hp) keeps the old dead-reads (wall wins, no chain). Zip ENTROPY_WARS_SYNC_20261026-2324.
Other GO signatures with an internal fall may still lead their visual; add `hitMs` on the fn to fix one.
Harness gotcha: HUD path sometimes clicks "Move + cast" on the wrong row; my /tmp sv-run copy takes opts {"direct":true}.
Sheets: /mnt/project-files/spell-vfx-audit/fix/LANDING/after/. Related [[spell-fx-cam-20261026]] [[spell-vfx-audit-20261026]].
