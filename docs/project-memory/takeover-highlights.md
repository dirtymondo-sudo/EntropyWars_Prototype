---
name: takeover-highlights
description: No tile highlights while the game plays out; gold action glow ends on the hit (PR #302, 2026-10-18) + how to browser-probe highlights
metadata:
  type: project
  modified: 2026-10-19T23:45:42.782Z
---
PR #302 merged 2026-10-18 (token 20261018-takeover-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261018-0808.zip).
mondo: no hover/range highlights when the game takes over (CPU turn, walks, spells, pans, death cam); during a spell only the gold anticipation glow, gone at the hit.
- battle.js isGamePlayingOut(); three-renderer.js _syncTakeoverHighlights() per frame hides highlightGroup children except _ew_overlay actionGlow/zone/weather; hover pieces (cursor, selTile, enemyRange wash, unit ring) stay off until a real mouse move (_hoverWaitMove latch).
- actionGlow: no caster tile; actionGlowBurst ends the glow (80 ms).
- **How to apply:** a new board marking that must show during play-outs needs _ew_overlay 'zone' (or add its name to the keep list).
- Probe: scratchpad hlprobe.js pattern = npm-pack jsdelivr packages + route repo JS, inject `window.__ewHLG = highlightGroup`, rAF-sample visible children (see [[sandbox-webgpu]]). SwiftShader runs ~1 fps.
- END OF ROUND (PR #342, 2026-10-19, mondo annoyed "thought we already went over this"): isGamePlayingOut also true while state._eorLive (battle.js _setRoundAdvance, synced to guest) and no active unit. Leak only showed when the round's last unit was the human's. body.ew-eor keeps the combat log up regardless of ew-board-busy.
- Hover a unit in a probe with a real page.mouse.move to ThreeRenderer.worldToScreen(x,y,ts*0.5) (canvas #threeCanvas); calling hover fns directly gets overwritten by the raycast.
The UI Maker part of the same ask (arrow/highlight looks) went to the "UI editor on Opus extra" thread [[ui-maker]].
