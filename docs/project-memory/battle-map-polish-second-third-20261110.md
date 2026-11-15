---
name: battle-map-polish-second-third-20261110
description: 11-10 battle map polish (dumb..moon share): PR #1085 six boards redone; how to author fair boards in a room (house columns, gen.solid, pins, bakes)
metadata:
  type: project
  modified: 2026-11-10T03:01:39.240Z
---
mondo 11-10: "make improvements to all of the battle maps (12x12) ... AAA presentation and polish". Three threads split the sites by id; this share = dumb, fairy_forest, giza, gobekli, haunted, heaven, hell, hollow_earth, lodge, lookingglass, mars, moon. Thread (thread in the owner project).

- PR #1085 merged (token 20261110-mappolish2-02-cors, data.js 57aec671): Fairy Forest (trees on square centres), Lodge (piers, galleries, bookcases), Moon (crater board), Mars (canyon under the arch), D.U.M.B. (maze -> concourse with 4 blocks), Haunted House (avenue through the hedge). Before/after: /mnt/project-files/battle-map-polish-2/. Not yet seen by mondo.
- PR #1088 merged (token 20261110-mappolish2-03-cors, data.js dc14f4cc): Giza four palms, Hollow Earth two tree twins. Hell, Heaven, Gobekli left alone (already even); Looking-Glass left alone (HQ_LG_CHESS = mondo's three chess positions). Share finished; thread waits on mondo's review.
- Hollow Earth is still lopsided (lake corner on P2's side, dark); a real fix needs a new window or moving the lake. Not done.
- Recipe + gotchas are in docs/notes/maps-terrain-battle.md "THE BATTLE MAP POLISH, second third": keep board columns 4..7 clear end to end (9/10/11 house rows), all house tiles level 0, forced-open things (plaza disc, paths, props) erase gen.solid, `dip` takes positive h, run bake-holes.js before bake-arenas.js, pin with HQ_ARENA_RULES.within.
- Full-height ledges thread (thread in the owner project), `terrain.levelM: 3.5`) switches rooms after each merge; in a switched room (Giza, Gobekli, Hell) author ledges at 3.5 / 7 / 10.5 m.
- Shot tooling: one harness at a time, ~2.5 min per map; the harness serves data.js from the checkout, so never edit data.js while a shot run is loading. For a true "before", put `git show HEAD:data.js` in place for the run.
- Pre-existing, not fixed: Fairy Forest FULL SITE 20x20 own board fails `bake-arenas --own` since 2x EVERYWHERE.
