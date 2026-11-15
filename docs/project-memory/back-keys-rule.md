---
name: back-keys-rule
description: mondo's input rule (11-15) - Escape closes, E leaves what E opened, right click is the universal back button
metadata:
  type: feedback
  modified: 2026-11-15T15:34:00.854Z
---

mondo, 2026-11-15: "pressing escape just opens the pause menu again forever and ever, it needs to close the menu if it is open", "i press e to talk to them but then i have to click with the mouse to exit. e should exit the dialogue too", "right click is supposed to be universal back button".

**Why:** he plays keyboard-first (Firefox on an M1 Mac) and hates reaching for the mouse to leave a box.

**How to apply:** every new menu, panel, dialogue box or screen must close on Escape and on a plain right click, and a box opened with E must close with E (never re-triggering the talk). Shipped in PR #1447: map.js `window._hqBack`, the right click = ESCAPE sender and `_ewBackKeyFallback` (a screen with a BACK button gets both for free; an ESC handler must preventDefault). Notes: docs/notes/ui-menus-audio.md "THE BACK". Thread (thread in the owner project); awaiting his Mac/Firefox confirmation of the Escape loop (cloud Chromium could not reproduce the loop itself).
