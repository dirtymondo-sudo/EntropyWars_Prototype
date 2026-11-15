---
name: dressed-reveal-20261105
description: 11-05 PR #937: creator/MPFB bodies stay hidden behind MANIFESTING (or the board stand-in) until every look layer has loaded (rig.whenDressed)
metadata:
  type: project
  modified: 2026-11-05T10:45:08.439Z
---
mondo 11-05 (furious): MPFB bodies flashed naked before their clothes loaded, despite the MANIFESTING sign.
Shipped PR #937, token 20261105-dressed-01-cors, three-renderer.js live 9e53c195.
- _createAppearanceRig counts its async loads (its own _ccLoad* wrap the shared `_ccShared`); rig.dressed() / rig.whenDressed(cb), 20 s cap.
- Gated stages: creator stage (_cvSetCharacter, v.dressWait), board/HQ walk (_attachUnitModel -> _unitRevealDressed, sprite stand-in kept), team room show(), unit dock.
- Browser-checked the creator stage only (his 4 assigned looks, cold cache): before = 5-10 s naked; after = first frame shown fully dressed. Board/team room use the same signal but weren't driven on screen.
- Creator per-click freeze is a separate thread ("Fix creator freezing on every item pick").
Rev 2 PR #942 (token 20261105-dressed-03-cors, three-renderer d4351df3): mondo still saw a brief flash; the creator stage hid only the canvas (0.5 s CSS fade) so a cached-body swap drew the bare body ~9 frames. Now wrap.visible=false until dressed. Frame-capture probe (hook on renderer.render) = the proof style the coordinator wants.
Proof /mnt/project-files/dressed-reveal/ (+ flash-frames/). Notes: rendering-loading-perf.md "THE DRESSED REVEAL".
