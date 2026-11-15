---
name: hit-readability-pvp-20261111
description: 11-11 PvP demo item 3 (who-hit-whom at the hit): plan parts 1-4 BUILT as "THE HIT SIDE" (flare, attacker tell, number edge, VFX step back + tame fire), off switches EW_NO_HIT_SIDE[_A-_D]
metadata:
  type: project
---
Thread "Make hits readable in two-player VFX and SFX" (thread in the owner project) (item 3 of the
PvP-demo list mondo approved with "All" 11-10). Plan doc: https://claude.ai/artifact/W2nQT5ZYg5h3jCRPk7F7eT. mondo chose
"Build 1-4" 11-11 01:18Z (5, the pop fan-out, NOT chosen: do not build it unless he asks).

BUILT = THE HIT SIDE (notes docs/notes/spells-vfx.md "THE HIT SIDE"; PR #1106 merged 11-11, 5 files live on R2):
1 flare: ring in the VICTIM's side colour (team ring rule: cyan-blue yours, pink-red theirs) at the hit, drawn after every
VFX layer (three-renderer.js hitSide, render order 400); 2 attacker's ring pings in its colour + arrowhead on the victim
pointing at the attacker, only if this seat may see the attacker; 3 damage number's outer edge = victim's side colour
(battle.js _hitReadSideEdge); 4 for 0.4 s impact meshes/flashes on the hit square at half strength, fire spells keep
red-orange-yellow (no white heart), single-target firestorm column cut to 1.5 squares, near-lens fade.
Hook: battle.js _juiceHitFx -> VFX3D.juiceHit(..., unitId, attackerId) (already relayed). Floating-text relay now carries
the victim's player + the hit weight (the guest's numbers used to be weight 0).
OFF SWITCHES (console): window.EW_NO_HIT_SIDE = true (all), EW_NO_HIT_SIDE_A flare / _B attacker tell / _C number edge /
_D step back + fire; localStorage ew_hitside[_a.._d] = 'off'.
PROOF: /mnt/project-files/hit-readability-20261111/after/ (same room, same hit, switch off vs on, both seats): Grave
Chill, Dragonfire, Fireball, Meteor, basic attack crit (sheets 01-05). Before set + mock-up in .../before/.
FOG CHECKED on both seats (attacker hidden by fog: flare only, no ring pulse, no arrowhead; tools/fog_probe.js).
ROOF FIX PR #1107 (11-11, from the Codex review on #1106): arrowhead pointed at an enemy on a LIT square whose body is
hidden under a roof; _hitSideSees now = body drawn + not concealed + square lit + _unitLosSeen, asked every frame
(tools/roof_probe.js, sheet after/06_fog_roof_fix.jpg). Lesson: an enemy-keyed mark gates on the renderer's own
unit rule (_occSubjectViewerVisible / entry.group.visible), not the fog tile set alone.
NOT CHECKED: real WebGPU, the 2D board number edge, traps, Inferno (never captured). His hit blink (white body) kept.
Awaiting mondo's look (replies sent 11-11 ~05:20Z + ~05:30Z); thread left open.

SFX owed: unchanged since the 11-08 audit [[sfx-gaps-audit-20261108]], nothing new on R2 since 11-04; fireImpact 1.2 s first.

TOOLS: /mnt/project-files/hit-readability-20261111/tools (ph-clock.js = harness ph.js with --clock + /clock endpoint,
Playwright fake clock). cap3.sh shoots both seats only from the first logged hit on; one.sh = one capture with the
switch off or on; rearm.sh resets AP / once-a-turn / cooldowns / victim HP / shot clock on the host so the same hit can
be cast again; until2.sh ends turns without moving. Gotchas: pause the clock >= 2.5 s ahead or pauseAt throws "past";
a shot takes ~7 s per seat; two llvmpipe seats + 90 shots once OOM-killed the worker (save to project files as you go);
to repeat a crit for a before/after pair force rollCrit / getEvasionChance on the host for one swing (tools/ba_on.sh);
a self-centred spell (Inferno) confirms with .hrlg-confirm, the rest with .hrlg-confirm-inline; after a host eval that
changes cooldowns press Escape so the ability list redraws; reloading both seats keeps the saved teams (new room needed).
