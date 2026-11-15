---
name: pumpkins-jack-20261029
description: THE PUMPKINS (10-29): Halloween pack carved lanterns across Jack o' Lantern's spells, PR #686, zip 20261029-2328, gotchas
metadata:
  type: project
  modified: 2026-10-29T23:28:56.325Z
---
mondo 10-29 (Halloween pack ask, one thread per asset): "I want the pumpkins to be used a lot in the jack o lantern's spells
and animations with custom animations." Looks only, no rule/number changes.

SHIPPED PR #686 (token 20261029-pumpkins-03-cors), zip ENTROPY_WARS_SYNC_20261029-2328. No new R2 uploads (shared loader
PR #677 reads halloween.fbx). Code: three-vfx-effects.js block "THE PUMPKINS" (_pkLantern, _pkStage/_pkBolt hooks in
_fireStage/_fireBoltMapped, _pkSmash), three-renderer.js passes race to the party-builder stage. Notes: spells-vfx.md
"THE PUMPKINS". Proof sheets: /mnt/project-files/pumpkins/.

Where: every Jack windup = shoulder lantern (cut on burst/bolt), bolts fly a lantern, Trick or Treat grin (lid flips; main's
pails/sweets kept), Apple Tree pumpkin patch, Devil's Coal lantern + smash, Meteor = giant lantern when Jack casts,
Grave Robbery finisher = 4 corner lanterns + evil grin at headstone.

Gotchas: VFX sprites draw over meshes and wash them out — glow a lantern by splitting faces (inner faces = candle colour
group 0, outer = texture group 1), not halo sprites or BackSide skins (shells are thick). sv-run.js (spell-vfx-audit
harness) is the best capture tool; first job needs --opts '{"<id>":{"wait":15000}}'. Pack textures look pale on the
party-builder stage. Related [[halloween-male-ghost-20261029]] [[severed-parts-20261029]] [[spell-vfx-audit-20261026]].
