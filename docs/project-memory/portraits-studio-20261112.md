---
name: portraits-studio-20261112
description: Portraits cut from a unit's own model (PR #1218), straight on (PR #1223), live blinking portraits shipped (PR #1232); Locke blink waits on her remake
metadata:
  type: project
---
Thread (thread in the owner project) (mondo 11-12: portrait "angle and framing is all messed up", cut a Locke portrait from her model, then live idle/blinking portraits "like harry potter picture frames" for the player + Agent Locke).

SHIPPED PR #1218 (token 20261112-portraits-01-cors, R2 uploaded): three-renderer.js THE PORTRAIT STUDIO (`window.EWPortraits.url(unit[, 'bust'])`), a 128 px second renderer that photographs a unit's own body off its Head bone. Units in a creator look and `appearance.cast` units (Locke) now show their own face in turn order, YOUR TURN panel, plates, HQ party card, team menus; ID photo re-aimed. Notes: docs/notes/ui-menus-audio.md "THE PORTRAIT STUDIO". Proof /mnt/project-files/portraits-20261112/.
Found: before this there was NO model portrait in battle at all (generic Door Agent sprite face); the "screenshot" was only the mirror's ID photo.

STRAIGHT ON PR #1223 (mondo 11-12: "The battle portraits should be straight on, just like the sprite portraits"). RULE: portraits are straight on, never three-quarter.

LIVE PORTRAITS SHIPPED PR #1232 (mondo "Do B"; token 20261112-liveportraits-01-cors, R2 uploaded): player's own look + Agent Locke idle/breathe/blink in turn order + YOUR TURN panel, 12 fps, max 2 bodies. Settings > Video > Live Portraits On/Off (default On, localStorage ew_livePortraits; console kill window.EW_NO_LIVE_PORTRAITS). Notes ui-menus-audio.md "THE LIVE PORTRAITS". Locke's Meshy model has NO eyelids: she only sways/breathes until remade on a creator body; REMADE on a creator body PR #1233 (other thread); PR #1235 keeps her portrait live on it (live mark read from DOOR_CAST_MODELS row). Her blink is driven but not seen on screen in headless (2 fps): mondo to confirm on his Mac.
Unchecked: his Mac, WebGPU, online guest, weak-PC cost, HQ party card (photo lands after first open in slow headless).
