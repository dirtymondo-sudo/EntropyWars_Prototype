---
name: creator-icons-20261104
description: 11-04 creator tab + OUTFIT body-part icons from SunGraphica Minimal Game Icons (PR #892); where the icons/pack live, licence, how to add one
metadata:
  type: project
  modified: 2026-11-04T21:30:42.563Z
---
mondo 11-04: "add icons for the different tabs and wear to make it easier to navigate" + SunGraphica Minimal Game Icons Pack (itch.io sungraphica/minimal-game-icons-pack). PR #892 merged + uploaded, token 20261104-ccicons-01-cors.

- Free download = 90 menu icons only (no clothes/body). mondo OWNS the full 600 pack: R2 private bucket dirtymondo `inbox/Minimal icons(1).zip` (sha 9bd12d1c). He first put it in public ewmusicsfx inbox/; moved on his word 11-04 (PR #893 notes). He does NOT want asset packs in project files ("dont want to clog your project space"); only the free contact sheet is there.
- Licence: free commercial, edits OK, NO redistributing the original files, credit SunGraphica (data.js EW_CREDITS section ICONS). Never commit the pack to the repo; only cut icons go to R2.
- Icons: `python3 -I bake-creator-icons.py <zip> <out>` (ICONS table) -> 128px white+alpha -> R2 Assets/Icons/creator/<key>.png via `node sync-zip.js --put`. party-builder.js CC_ICONS/ccIcon draws them as CSS masks in the label colour (styles-base.css "THE CREATOR ICONS"). Kinds chips + Layers 1·2·3 have no icons (not asked).
- No hair or belt icon in the pack: HAIR = head silhouette, Waist = pouch.
- Probe: /tmp scratch script opened `window._mountReactCreator()`; Playwright needs executablePath /opt/pw-browsers/chromium + proxy {server: HTTPS_PROXY, bypass: 'localhost'}.

**Why:** later UI icon asks can reuse the same pack + bake tool instead of hunting art.
**How to apply:** new icon = add a row to bake-creator-icons.py ICONS + a CC_ICONS key, rebake, --put, bump ?v=. Notes character-creator.md "THE CREATOR ICONS", plan row 12s. Shots /mnt/project-files/creator-icons/. Related [[creator-tabs-body-slots-20261103]] [[creator-layers-123-20261104]] [[credits-screen]]
