---
name: door-official-logo-20261112
description: mondo's official DOOR logo pieces live at R2 Assets/ui/brand/door_logo/; no-text mark used in small spots, intro + foyer floor seal rebuilt from them (PR #1243)
metadata:
  type: project
  modified: 2026-11-13T00:23:24.468Z
---
mondo 11-12 (thread in the owner project): dropped folder DOOR (R2 `dirtymondo/inbox/DOOR/`, NOT /mnt/project-files/inbox) = his official logo, color + blackandwhite, png + svg, pieces arc / cube / door / door-text / subtitle. "replace any ai generated DOOR logos with these assets"; small spots need no text ("the game is already putting the text").

SHIPPED PR #1243, token 20261113-doorlogo-01-cors:
- His 24 files verbatim at R2 `ewmusicsfx` `Assets/ui/brand/door_logo/{color,blackandwhite}/{png,svg}/`. Text SVGs need STIX Two Text font: use PNGs for text. His text pieces are BLACK even in the "black bg" set (shown white with CSS invert in the intro).
- `door_mark_color` / `door_mark_mono` (.png 1024x795 + .svg) = arc + cube + door, no text, cropped from his whole-logo SVG. data.js `DOOR_TEXT.LOGO.mark / markMono / pieces`.
- Intro `#doorIdent` animates the pieces (cube, arc draw, door swing, wordmark wipe); stays 4.3 s because audio.js identSting tape stop is at 3.15 s (no SFX changes).
- Foyer "carpet" = three-renderer.js `door_seal` floor decal: code-drawn device removed, his mark drawn in; navy disc + brass rim text kept.
- Mark replaces the with-text PNG in title/menu seals, `.door-hdr` headers, HQ strip/loading/pause, forge, party builder, door plates, dispatch desk.
- LEFT: older with-text exports `DOOR_*_Logo*.png` (also his) for watermarks / ink masks / ID card.
- Notes: docs/notes/ui-menus-audio.md "THE OFFICIAL DOOR LOGO". Proof: /mnt/project-files/door-logo/.
- R2 `dirtymondo/inbox/` still holds unsorted: SBS texture packs (Abstract Noise, Abstract Texture, Noise Texture, Seamless Abstract) + "Minimal icons(1).zip" (not asked, untouched).

**How to apply:** any new DOOR logo spot uses `DOOR_TEXT.LOGO.mark` (small / text beside it) or his pieces; never draw a DOOR emblem in code. Unchecked: his Mac, online irrelevant (UI only).
Related [[inbox-dropoff-20261103]]
