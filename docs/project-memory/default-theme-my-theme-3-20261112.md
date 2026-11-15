---
name: default-theme-my-theme-3-20261112
description: The shipped default HUD theme is mondo's "My Theme 3" since PR #1198 (2026-11-12); bake-setup.js pitfall with SHIPPED-KEYS
metadata:
  type: project
  modified: 2026-11-12T11:49:48.333Z
---
PR #1198 (2026-11-12, (thread in the owner project): baked Entropy_Wars_Setup_2026-11-12_0544.json. Default theme = "My Theme 3" (c_mw5p8wvy2q54); the old default "Entropy Wars Theme" (c_mvc8nxl9fo9g) stays a pick in Settings > HUD Theme. hud.js UIM_SHIPPED = his whole store (3 themes). Token 20261112-theme3-01-cors, hud.js e90ee4bb live.

**Why:** mondo: "bake this theme into the game. Make this the new default theme and the other one as another option".

**How to apply:**
- `node bake-setup.js <file>` WITHOUT --keys rewrites index.html SHIPPED-KEYS down to the 3 look keys. Save the old SHIPPED-KEYS first and merge them back, or the 18 Settings values baked 11-01 are lost.
- NOT baked from that file (he asked for the theme only; offered once): his newer Settings values (CRT scanline/chroma, light rays 0.05, night mood 0.05, DOF 0.1, action cam 1, retro pixel scope screen, unit light, Entropy Style, grass low). Bake only on his word.
- Proof shots /mnt/project-files/theme3-bake/. Related: [[ui-maker]] [[hud-rules]]
