---
name: mobile-controls
description: Phone fit + exploration touch controls + two-finger battle orbit (PR #36, 2026-10-01), how it is gated and where it lives
metadata:
  type: project
---
DONE + MERGED 2026-10-01 (PR #36, main 5258d0b, token 20261001-mobile-01-cors, zip mobile/ENTROPY_WARS_MOBILE.zip = map.js,
state.js, three-renderer.js, ui.js, styles-base.css; built on spell audit Batch D, upload after it).

- Everything gated on window.EW_MOBILE / html.ew-mobile (index.html detection). Desktop untouched.
- PHONE FIT: index.html rewrites the viewport meta so a phone lays out at short side 540 css px and the browser scales down
  (EW_FIT_SCALE, --ew-touch-k = 1/scale; Settings > Performance > Screen Fit, localStorage ew_mobileFit). No CSS zoom.
- WALK: map.js _hqTouchControls (#hqTouch) + three-renderer.js ThreeRenderer.hq.touch {pad, look, zoom, fire, stick, status}.
  Key buttons dispatch real KeyboardEvents on document. Stick is analog via H.pad in _hqTickWalker.
- BATTLE: state.js two-finger = orbit + pinch (was pan); ui.js _applyUIScale has a phone branch.
- Not covered: Mystery Dungeon hub walker, editor.
Notes: docs/notes/ui-menus-audio.md "THE PHONE FIT + THE TOUCH CONTROLS".
Sandbox phone preview trick: Playwright iPhone 13 context, proxy {server: HTTPS_PROXY}, route cdn.entropywars.net *.js/css to
repo files, jsdelivr three@0.128.0 + cdnjs three + socket.io to node_modules (npm i --no-save three@0.128.0 playwright),
page origin http://localhost:3000 via route (CORS allowlist), fonts stubbed. HQ needs ~100 s to load at sandbox speed.
