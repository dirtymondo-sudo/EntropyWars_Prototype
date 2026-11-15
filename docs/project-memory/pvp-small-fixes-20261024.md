---
name: pvp-small-fixes-20261024
description: PR #488 (10-24) fixed the smaller bugs from the 10-24 online PvP playtest; which calls the thread made that mondo may want to change
metadata:
  type: project
---

PR #488 merged 2026-10-24 (main 00fdebd, token 20261024-pvpsmall-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261024-1327.zip).
Fixed: three-vfx-effects.js window.ThreeRenderer checks (spell GLBs never loaded; ThreeRenderer now exports doorLeaf + castChainFor); follow-up log number; Solar Flare twice; builder NO SLOT reason in the technique panel; "armor" wording in data.js descs; ON FILE line in online logs; Online chip on result screen.

Calls the thread made (flagged to mondo):
- Natural weather never forms when the same kind is already up; cast weather can still stack.
- Online matches still mark the defeated ledger (shop unlock), only the log line is dropped.
- "+5 armor" became "every hit taken is 5 smaller"; "armor ignored" became "DEF/M DEF ignored".
Seen, not fixed: the ranked PvP result screen shows a story "FORM 365 · WIN A CROSSING AT <site>" chip.
Related: [[online-pvp-playtest-20261024]] [[sandbox-playtest-speed]]
