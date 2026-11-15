---
name: headless-hq-proof-gotchas-20261108
description: How to get big HQ/site rooms to fully load in headless Playwright for on-screen proof (local CDN stand-in, tiny viewport while loading)
metadata:
  type: reference
  modified: 2026-11-08T15:00:13.077Z
---
Found 11-08 proving PSX pack prop swaps (thread in the owner project).

- Playwright `context.route('**/*')` serving every CDN file makes big site rooms (bunker, Camelot keep) close the page/browser a few seconds after `_hqEnter`. Don't route everything.
- Fix that worked: run a local HTTPS stand-in for cdn.entropywars.net (Node https, self-signed cert, port 443). It serves repo .js/.css, then a disk cache, then `curl -m 90` from the live CDN. Launch Chromium with `--host-resolver-rules=MAP cdn.entropywars.net 127.0.0.1` and add cdn.entropywars.net to the proxy bypass. Use `ignoreHTTPSErrors`. Node http2 gave ERR_HTTP2_PROTOCOL_ERROR, so stay on HTTP/1.1.
- Models still never landed at 1280x800, because swiftshader starves the main thread and the 6 HTTP/1.1 sockets stall. Load at a 320x200 viewport, then `setViewportSize(1280x800)` just before the screenshot. Rooms then load in about 4-5 min.
- Useful switches: `EW_NO_MODEL_QUEUE`, `EW_NO_RIG_LANE`, `EW_NO_OPT_ASSETS`. Pending loads: `window._ewAssetLedger.list()`. Run browsers one at a time; parallel runs get OOM-killed.
Related [[psx-mega-pack-20261108]]

11-12 (foyer door thread): playtest_city.js itself closed the browser ~10 s in, right after the room entered (exit code 0, "Connection terminated while reading from pipe"), even on unmodified code. Cheap fix that worked: serve the routed responses ONE AT A TIME (wrap the route handler in a promise chain + 15 ms sleep) and `require('/opt/node-tools/node_modules/playwright')` with executablePath `/opt/pw-browsers/chromium`. Foyer + hall then load in ~2.5 min at 1280x800. `ThreeRenderer.hq.dev.hqDoors()` lists door records (room + neighbours).
