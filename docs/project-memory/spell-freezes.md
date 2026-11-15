---
name: spell-freezes
description: Spell/combo/Entropy Strike freeze fixes (PR #153, 2026-10-07) — screen grades moved into the post shader, frame-pass twin warm, no bloom toggling, void/splitscreen recompile fixes
metadata:
  type: project
  modified: 2026-10-07T00:45:09.139Z
---

PR #153 merged 2026-10-07 (token 20261007-spellfreeze-01-cors). The R2 files are battle.js, three-post.js, three-renderer.js, three-vfx-effects.js and styles-cinematic.css. The zip goes to spell-freezes/ENTROPY_WARS_SPELL_FREEZES.zip. Writing the zip was refused at first, so mondo had to type "write the zip" in the thread.

**Rules for future spell VFX** (the details are in docs/notes/rendering-loading-perf.md "THE SPELL FREEZES"):
- Never use CSS filter, backdrop-filter or mix-blend-mode over the game canvas. Firefox re-composites the whole canvas every frame. Use ThreePost.screenGrade instead.
- Never toggle the player's bloom setting from a spell. Use bloomPulse or bloomSwell. Related: [[perf-lens]].
- Never set scene.fog to null or add or remove lights mid-cast. Both re-key every material's shader.
- Split-screen pane cameras are kept in _ss.cams. Panes render into per-size targets (_paneTarget).

Mondo still needs to F3-check this on Firefox WebGPU.

**Split panes vs render bundles (PR #236, 2026-10-16):** on WebGPU a replayed render bundle drew another pane's camera, so combo / Entropy Strike panes showed the same unit. Any extra camera drawn in the same frame must set `renderer._ew_paneRender` (or `_ew_sideRender`) so bundle groups draw the classic way. Repro probe: real WebGPU sandbox per [[sandbox-webgpu]].
