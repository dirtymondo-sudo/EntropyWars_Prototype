---
name: playtest-elements-20261106
description: 11-06 elements + liquid terrain VS CPU playtest (report only): bug families A-G, suggestions list, harness tips
metadata:
  type: project
  modified: 2026-11-06T15:55:25.887Z
---

11-06 thread "playtest elements and liquid terrains" (thread in the owner project), main d0928fc, report only, nothing changed.
Report: /mnt/project-files/playtest-elements-20261106/PLAYTEST_ELEMENTS_20261106.md (+ shots/, ledger, 2 match exports).
2 battles Mount Shasta Arena 4v4 (Kraken/Ice Queen/Witch/Black Goo; Demon/Anubis/Ice Queen/Mothman).

Bug families: A ooze+fire coexist on Black Goo's tile (no detonation); B Great Flood on own Cube tile "Converted 0 tiles"
(_tileCanFlood refuses objective tiles, target list allows it); C flash-freeze applies Stun but says FROZEN, so Shatter
×1.5 vs frozen never pays; D statuses applied to a unit the same hit killed (Plasma Cannon); E opposite weathers together
(open decision card); F log wording (ice on lava says "lava meets water", soaked combos no log line, 1 HP lightning "super
effective"); G design questions. Only fire/lightning/ice react with terrain (classifySpellElement); 8 elements never do.
Suggestions list in the report is clearly marked NOT built (mondo decides).

Harness tips: Hell Arena card click via `ph text` didn't select it; 5v5 only on 9x9/11x11 boards; Siren has no 3D model
(isRace3DReady). Related [[playtest-battles-20261105]] [[weathers-together-20261029]]

11-07 mondo RULINGS + fixes (all live): frozen is FROZEN, never stun (PR #966); frost on burning tile -> water, frost on
burning unit douses+soaks (#967); WATER PUTS OUT FIRE everywhere: water spells on burning tiles, water paint, walking
through water, rain on burning units incl. flyers (#968); wet = ONE status (#969); then renamed WET everywhere, pill WET (#976, "wet fits much better on a status badge"). He was furious these
weren't already in: never list a basic element rule as a "suggestion", treat it as a bug.
Browser check 11-07 (coordinator: rules must be proven on screen, never syntax-only) found + fixed: Flash Freeze is an
ice-WALL paint so ice landed on fire (#974: any ice paint on a burning tile -> water); no Soaked badge anywhere (#975:
SOAK pill on panel + nameplate); Wall of Fire burned over river water (#975). Proof shots: playtest-elements-20261106/proof-20261107/.
Harness: tile-only casts (water/fire at a burning/ice square) show NO TARGET in the ability list; open the square's tile
menu, pick the spell, then click the square again. After a page reload run `ph draw always` ~40 s before board shots.
