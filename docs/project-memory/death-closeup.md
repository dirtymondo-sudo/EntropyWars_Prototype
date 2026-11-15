---
name: death-closeup
description: Death close-up camera + multi-kill split screen (PR #248, 2026-10-17) and how to browser-check it in the sandbox
metadata:
  type: project
  modified: 2026-10-17T08:14:06.767Z
---
PR #248 merged 2026-10-17 (token 20261017-deathcam-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261017-0813.zip: battle/map/online/three-renderer).
- mondo asked: camera close + centred on a dying unit to see the death anim; double/triple kills split screen like combos / Entropy Strikes.
- map.js defeatUnit → battle.js playDeathCloseup → ThreeSplitscreen owner 'death'; later deaths during the shot add panes (max 4). Turn waits (_deathCamLive). Skipped during executions. Guest gets relay 'death-cam' and now plays the death clip itself (before, guest units just vanished). Graves wait for the rigged death tween. Kill switch EW_NO_DEATH_CAM. Notes: docs/notes/spells-vfx.md "THE DEATH CLOSE-UP".
- Sandbox browser check recipe: route jsdelivr npm paths to a local `npm install` dir served as Buffer (utf8 corrupts basis_transcoder.wasm and models never draw); WebGPU needs a GPUTexture.createView init script that drops `swizzle`, else every split pane throws silently; page.screenshot and toDataURL of a WebGPU canvas are black unless grabbed right after the pane draw (hook renderer.setScissorTest(false)); SwiftShader runs ~1 fps, so stretch the anim clock (ThreeAnim.slowMo 0.03) to catch a death. ~1 in 3 runs never reach battle; retry. Related: [[sandbox-webgpu]], [[spell-freezes]].

PR #278 (2026-10-18, token 20261018-deathpace-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261018-0141.zip): mondo's "pause after a death / empty space at the end of spells". Close-up now ends when the body is DOWN (ThreeAnim.deathProgress >= 0.72), not fully dissolved; turn loop + GAME.boardBusy treat numbers/flashes/particles/death dissolve as decor (max 250 ms tail, DECOR_TAIL_MS); no tail/settle right after a close-up. Timing probe: /tmp scratch only; sandbox ~2 fps so serve copies with the VFX 0.05 s and anim 250 ms dt clamps removed and read gate ORDER, not absolute ms.

PR #291 (2026-10-18, token 20261018-closeups-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261018-0536.zip): mondo "cuts too fast, show them lying ≥0.5 s; death cam closeness = all close-ups; key close-up too". Death tween = clip land time + MODEL_DEATH_LIE_MS 650 + fade 650; shot ends at ThreeAnim.deathShotDone. battle.js CLOSEUP_LENS (fov 32, dist 2.6→1.85) is the one close-up lens (panes + main cine beats via CINE_CLOSEUP_DIST_TILES). Key close-up: _playKeyCloseup, splitscreen owner 'key', kill switch EW_NO_KEY_CAM. Probe tip: key GLB draws only after ThreeRenderer.keyFxWarm(); HUD 4 s failsafe shows the menu if a probe stretches timers.

PR #318 (2026-10-18, token 20261018-closelook-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261018-1328.zip): mondo wants close-ups to MATCH the battle's post look (settings apply the same everywhere). All split panes now go through ThreePost.renderPanes (1 pane = battle cam borrows pane pose; several = atlas + one chain pass). Bare path only with no chain or EW_BARE_PANES. Probe: scratch panes.js style (npm-pack mirror routes, curl R2 assets to cache) worked for WebGL + ?ew_gpu=webgpu.

PR #331 (2026-10-18, token 20261018-deathglide-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261018-1739.zip): mondo "after the death animation the camera should move from the dead body to the next position/action in one continuous motion". _dcEnd hides with a handoff → ThreeCamera.seedPose from pane 0's eye/gaze/lens (seed `wy`), swoop 1.1 s, crane `follow` damps the target, world up during the swoop (else the frame rolled). EW_DEATH_CAM_CUT = old cut. Probe: wrap ThreePost.render/renderPanes to log the drawn camera; stretch seedPose easeS ×12 to see the glide at ~1 fps.
