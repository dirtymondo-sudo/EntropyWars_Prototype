---
name: battle-map-boards-20261110
description: 11-10 "improve all 12x12 battle maps" last-third thread (PR #1086): the board-is-the-place pattern, ghost blocks, bake sizes/rs, the before/after shot recipe
metadata:
  type: project
  modified: 2026-11-10T03:09:04.971Z
---
mondo 11-10: "start some threads to make improvements to all of the battle maps (12x12) ... AAA presentation and polish". Three threads split by site id; last third = northpole, olympus, revenge, saturn, shasta, singularity, skinwalker, stadium, stonehenge, strip, technoticlan, vatican. Thread (thread in the owner project).

- PR #1086 (token 20261110-boardplace-01-cors, data.js 05ca98c2 uploaded): nine boards re-laid. Stonehenge (real sarsens/trilithons in the circle), Stadium (pitch centre), Vatican (nave pews + columns), Strip (plaza, two basins), Technoticlan (ball court turned north-south), Shasta (meadow + straight creek), Skinwalker (crop circle), Saturn (the hexagon), Singularity (obsidian arcs). Not yet reviewed by mondo; not played two-player.
- PR #1089 (token 20261110-boardplace-02-cors, data.js 4a8360c3): cover only on North Pole (tree lot SE corner), Olympus (braziers + angel statues), Flying Dutchman (crate stacks; they read small from the default camera). All twelve of the share delivered; waiting on mondo's review. `git push -f` is refused in these sessions: after a merged PR restart the branch from origin/main and push plain.
- Pattern: pin the 12 with HQ_ARENA_RULES.within, lay cover mirrored row r / row 11-r, keep the apron (cols 3..8, rows 0..1, 10..11) bare. Props block only via hidden walls `{ k:'wall', ghost:true, rail:false }` + prop `floor:true`. bake-arenas.js within rows take `sizes:[12,10]` and `rs:{12:2.6}`. gen plans clear with `gen.open` discs or one wide band (thin 3.5 m bands did not clear). A smooth `dip` under the nexus over ~1.2 m fails the house fit.
- Odd sizes (9, 11) cannot centre on a board laid for the 12; several are still found windows.
- Ledge heights are the full-ledges thread's (thread in the owner project), `terrain.levelM: 3.5`); it switches these rooms after each merge.
- Shot recipe: scratch copy of playtest_maps.js with REPO env (a git worktree of main for BEFORE), POSES top/iso, load at 320x200, wait `_ewAssetLedger.pending()==0`, resize 1280x800, one browser at a time, ~2.5 min a map. `pgrep -f shots.js` matches its own shell: wait on files instead. Sheets: /mnt/project-files/battle-maps-last-third/. Related [[headless-hq-proof-gotchas-20261108]].
- Notes: docs/notes/maps-terrain-battle.md "THE BOARD IS THE PLACE".
