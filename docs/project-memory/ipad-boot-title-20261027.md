---
name: ipad-boot-title-20261027
description: PR #613 (10-27) — iPad opened on party builder; boot guard + "THE GAME CANNOT START" notice when three.js never starts
metadata:
  type: project
  modified: 2026-10-27T09:22:18.709Z
---

mondo's iPad skipped the ident/title and opened on the party builder (10-27). Cause: online.js boot runs resetGame() (PARTY_BUILDER + render) before transitionTo(GS.TITLE); any throw inside skipped the title. Reproduced only when three.js doesn't start (window.THREE unset). three.js r186 needs import maps + class static blocks = Safari/iPadOS 16.4+, so an older iPad is the likely trigger (his iPadOS version NOT confirmed — asked him).

PR #613: resetGame + title render guarded in online.js; index.html _readyCheck shows the boot error box naming the reason when THREE is missing. Live R2 matched main except online.js (no stale-file mix).

**Why:** WebKit can't be downloaded in the cloud sandbox (cdn.playwright.dev blocked), and cdn.jsdelivr.net + entropywars.net are blocked too; proof used Chromium "iPad Pro 11" profile with jsdelivr routed to npm-registry tarballs.
**How to apply:** if he reports the notice or still a broken iPad, get his iPadOS version / ?ewdiag=1 report before changing code.

iPHONE 13 CRASH (PR #620, 10-27): warmSpellLibrary (boot via party builder mount + battle card) holds every prop; .opt.glb props are KTX2 and _capModelTextures skipped KTX2 → ~900 MB of mips on the phone. _capCompressedTexture drops mips above the cap. Emulated iPhone 13: 1,003 → 180 MB at title, 207 MB in match. Each new prop pack adds ~20 MB/prop uncapped — keep KTX2 under the cap. Old iPad fallback (transpiled three bundle = new R2 file) offered to mondo, not built.
