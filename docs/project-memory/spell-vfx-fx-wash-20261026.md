---
name: spell-vfx-fx-wash-20261026
description: FX-WASH (PR #574, 10-26): full-screen spell layers masked round bodies + capped, violet psychic grade, WebGPU pillar NaN noise fix
metadata:
  type: project
  modified: 2026-10-26T23:31:09.701Z
---
Spell VFX audit fix batch FX-WASH, PR #574 merged 10-26, zip ENTROPY_WARS_SYNC_20261026-2330. Notes:
docs/notes/spells-vfx.md "FX-WASH"; sheets + NOTES.md in /mnt/project-files/spell-vfx-audit/fix/FX-WASH/.

- battle.js `_cineMaskLayer` / `_cineMaskWhile`: CSS mask hole per body (cast target, hit ids, caster) on every
  full-screen DOM layer. Caps: `_SIG_FLASH_MAX` .3, whiteout .5, `_GRADE_DIM_MAX` .4, void veil .7.
- 'hue' grade = violet push (was hue-rotate 150 → green). Arcane = violet set.
- WebGPU pillar blue/black noise cause: NaN/overflow pixels in the HALF-FLOAT frame (WGSL smoothstep with equal edges,
  pow(0,x)) turned to noise by the post grade's spotlight pools. Fixed in the shell node twins + `SC` sanitizer in the
  cinematic node twin (three-post.js). Classic WebGL never shows it (8-bit frame). Any new node twin: guard smoothstep
  edges and pow bases.
- Sandbox: the HUD-path audit batch on --gpu webgpu times out (240 s/spell); prove WebGPU with sv-ctl.js direct casts.

Calls flagged to mondo (unanswered): caps, violet grade, psychosis band, arcane violet, void footprint bodies, stamps
top-right, title/letterbox fade under numbers, Crusade arms thinner. Related [[spell-vfx-audit-20261026]] [[visual-rules]].
