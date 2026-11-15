---
name: world-name-plates
description: Unit name plates are in-world canvas sprites since PR #404 (2026-10-22); mirror, stacking, kill switches, trade-offs told to mondo
metadata:
  type: project
  modified: 2026-10-22T00:32:30.380Z
---

PR #404 (merged 2026-10-22, main 576fa41, token 20261022-platesworld-01-cors): unit name plates (real, copies, sprite decoys) are canvas sprites in the battle scene, not CSS2D. The mondo ask came 10-21: "can we not make the nexus counter ... part of the world like the exploration door text? same with the name plates maybe?" The Nexus counter went in world in PR #403 (separate thread).

- The plate DOM is still built/patched as before, but lives in hidden `#ewPlateMirror`. `_pmPaint` rasterizes it, so UI Maker plate looks carry over. Code block "THE PLATES IN THE WORLD" in three-renderer.js; notes in docs/notes/ui-menus-audio.md.
- Plates no longer pile: bunched plates stack upward (acting, then targeted, then lowest keeps its place).
- Kill switches: `window.EW_PLATE_PILE = true` brings back the old pile. `window.EW_CSS_PLATES = true`, or the shared `ew_text='css'` / `EW_NO_GPU_TEXT`, plus a rebuild brings back the CSS2D plates.
- Trade-offs flagged to mondo:
  - The tilt-shift blur softens plates near the screen top/bottom.
  - Trees, walls and bodies in front hide plates (as asked).
  - Big bunches stack tall.
- Sync zip: ENTROPY_WARS_SYNC_20261022-0032.zip (battle.js 4ebeb805, hud.js 4ce2344b, three-renderer.js cbd31ae5).

**Why:** a future thread touching plates must know they are sprites now. A CSS-only plate change still shows if the painter supports that CSS. Pseudo-elements (::before/::after) are NOT painted.
**How to apply:** for plate look changes, use real elements, not pseudo-elements. Sprite offsets go through position, never Sprite.center (the node renderer ignores center changes).
