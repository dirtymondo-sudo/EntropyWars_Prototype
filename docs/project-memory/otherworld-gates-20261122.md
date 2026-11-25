---
name: otherworld-gates-20261122
description: Otherworld + mountain zone gates pass (PR #2439, 11-22): what was fixed, engine options added, what is left
metadata:
  type: project
---
Thread (owner-project id) "Fix the otherworld zone entrances" (mondo 2026-11-22: "Every single entrance/exit in the game needs to look good and natural"). PR #2439 merged + live. Related: [[road-gates-walked-20261122]].

Fixed and walked in the browser: Pilgrim Way door (led to a retired room); Grand Stair Heaven <-> ski mountain (did not cross; free cloud ends need `passage:{len:3,deep:1.2}`); Vatican east/west gates now open seams with roads running on, land outside at ground level (`terrain.edges.level`); River Road tapers + runs on; Ley Line east gate (a scattered stone blocked it; scatter now drops pieces in any walked wall gate's lane, all rooms).

Left / not done: from the Old Road the Vatican far off is a plain grey box with a dome; Bug Colony shows as sand on the world map from the Ley Line; press-E portals and boats of Outer Space, Astral Realm, Internet, Antarctica were checked in data only (both ends exist), not walked. Came A Lot's R4 gate reach problem was handed to the forest/kingdom thread.

**How to apply:** notes in docs/notes/areas-complexes.md "THE OTHERWORLD + THE MOUNTAINS, WHERE THE ZONES MEET". Walk probes: start 5-6 m from the door (software walker is slow); `ThreeRenderer.hq.dev.blockersNear(x,z,r)` shows what blocks.

ROUND 2 (PR #2443, live): portals, boats and screens of Astral Realm, Internet, Antarctica walked both ways, all cross. Way objects (boat, screen) are walked INTO, E does nothing by design. By design, not bugs: Polar Opening (Antarctica <-> Hollow Earth) is a secret door needing the protractor; Outer Space is one flown room (probe teleport does not work there, its bores/frames not walked). Vatican far sight from the Old Road is now a basilica front behind a brick wall (still hazed grey).
