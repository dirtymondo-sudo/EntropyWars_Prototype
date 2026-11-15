---
name: halloween-pack
description: mondo's Halloween pack on R2 Assets/halloween (2026-10-29): one FBX kit loaded + cut at load with lazy per-piece sheets, the shared loader API, Trick or Treat candy PR #677
metadata:
  type: project
  modified: 2026-10-29T22:09:47.731Z
---
mondo uploaded the pack 2026-10-29 and asked for it to be used across the game. The coordinator split it into threads: pumpkins/Jack, candy (this one), gore/body parts, gravestones, coffins/mummy/vampire, shovel/dig, and the male ghost.

R2 `Assets/halloween/models/halloween.fbx`: 712 KB, ONE binary FBX kit in cm, about 120 named meshes. Its sheets are loose in `textures/` (the FBX points at C:\ paths). The rigged `characters/` (Character, Character_Ghost, Character_Witch) are separate. The ghost thread baked Character_Ghost into a GLB for the male ghost.

Shared loader, three-renderer.js, merged in PR #677 (token 20261029-hwcandy-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261029-2209.zip):
- `_hwUrl(node)` → `<file>#<node>` through the misc loader.
- Sheets load lazily: each cut piece fetches only its own sheets.
- Spells: `ThreeRenderer.halloweenClone(node, target, align, o)` + `warmHalloweenModels(nodes)`.
- Rows: `{base:'halloween', node}`.
- Kill-switch: `window.EW_NO_HALLOWEEN_PACK`.
- Notes: docs/notes/models-assets.md "THE HALLOWEEN PACK".

Trick or Treat (Jack o' Lantern, the spell already existed, rule unchanged) now uses the pack: the candy bowl tips toward the team and real sweets fly to each buffed ally. Allies on fogged tiles get no candy drawn. Proof: /mnt/project-files/trick-or-treat/.

RULE CHANGE (mondo 10-29, PR #681, token hwcandy-02, zip ENTROPY_WARS_SYNC_20261029-2240):
- Trick or Treat = kind aoe, self-centred, aoeRadius 2, dmg 70, NEW key `aoeAllyHeal` 70.
- The heal is flat. mondo picked it on a card over a drain. It heals every ally in the area, Jack too, even when no enemy is hit.
- The random stat buff is gone.
- The pails (Candy_Container x3) drop upside down on the enemies at the hit (hitMs 650).

Harness trick for proving short VFX at about 1 fps (llvmpipe):
- Wrap `ThreeRenderer.hq.dev.renderer().render` to push `canvas.toDataURL` frames.
- Slow `performance.now` to 0.05-0.07x for the capture (VFX ticks use it), then restore it.

Related: [[christmas-pack]] [[sandbox-playtest-speed]]
