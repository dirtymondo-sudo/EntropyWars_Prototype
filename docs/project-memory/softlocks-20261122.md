---
name: softlocks-20261122
description: mondo's no-crevice rule (11-22), the soft-lock finder find-softlocks.js, what PR #2417 fixed at the source and the per-zone list still open
metadata:
  type: project
  modified: 2026-11-22T17:21:34.606Z
---
Thread (owner-project id). mondo 11-22 (Sewers, fell into a gap at a wall's foot, soft locked): "no tiny crevices or huge drops where there is no room to get out or move. know when to raise the terrain with a gradient on the side and when to just raise it straight up ... by a wall ... Please fix this everywhere in the game, use as many threads as you need".

RULE (his): beside a wall, a mass or an edge the ground goes STRAIGHT UP; a gradient only on open ground that leads somewhere; anything the walker can get into has a walked way out.

PR #2417 (merged 11-22, token 20261122-nocrevice-02-cors, data.js live on R2):
- data.js `_hqTGenerate` THE STRAIGHT RAISE (a mass plan's solid takes the open floor's height beside it) and `hqTerrainVoidAt` THE SHEER EDGE (a floating tile's side is the void). bake-labyrinth.js: `noRescue: true`, sump brims. Sewers: 0 traps, 0 crevices.
- `node find-softlocks.js --all [--jobs 4]` | `<room id>` | `--zone "<ZONE>"` (TRAP, CREVICE, DIP, SLOT; rows give x, z, y). Output shots/softlocks/. Notes: docs/notes/areas-complexes.md "THE SOFT-LOCK FINDER + THE STRAIGHT RAISE".

STILL OPEN after the PR (150 terrain rooms scanned, 17 hold a soft lock: 94 traps, 42 crevices), list `/mnt/project-files/softlocks/softlocks_by_zone.md`: Disaster City streets DONE (0 traps / crevices; thread 'Remove trap spots in Disaster City streets'; notes areas-complexes.md "DISASTER CITY, THE SOFT-LOCK HUNT": door stoops on the door's side, closing walls 60 m, square fills `block: true`, plot corners raised straight, `doorwayClear`, `railOnBridge`; walker rules `_hqTNodeFeet` THE LINTEL IS NO PLACE + `hqTerrainWallAt` taller wall by over 1.3 m); Camelot Kingdom 6 + 8 crevices, Castle 7; Hell 2 + 10; underground DONE in PR #2420 (all five rooms 0 traps / crevices / dips; tools bake-underground.js, bake-ug.js, bake-agartha.js); D.U.M.B. 5 + 4; Outer Space 5 + 2; Mountains 1 + 6; Bug Colony 5; Katana 3 crevices; Heaven 1 + 1; Temple 1. Coordinator was asked to start zone threads. Finder limits: Heaven under-read (floating stairs), sludge traps may be hauled out of, each row must be looked at.

SUMP RULES from PR #2420 (any tool writing `w` squares in a `kind: 'plan'` room): the sump is its own `space` row pulled 0.6 m back from rock sides; bed 1.2 m and water 0.3 m under the lowest floor beside it; a liquid row's `key` = how it is walked, `look: 'deep_water'` = how it is drawn (PR #2422, mondo 11-22: "the color shouldnt change the behavior of the water"; never propose changing one to get the other); a waded dark lake = `key: 'water', look: 'deep_water', absY: true`. A low rail does not stop the walker (jump 1.3 m).

WHOLE GAME 11-22 evening: `--all` reads 0 traps, 0 crevices in all 150 rooms (dips + slots left, second priority). The walker rules in data.js are shared: after changing one, rerun `--all` (10 min), a rule change in one thread brought 6 traps back in the city.

**How to apply:** any thread that builds or changes a terrain room runs the finder on it before its PR; a new TRAP or CREVICE is a bug.
