---
name: long-runs-where
description: Where long runs (balance labs, builds over 10 min) go in this project: in the cloud container, started right away
metadata:
  type: feedback
  modified: 2026-11-22T05:33:46.989Z
---
Long runs (4-hour balance labs, long builds) run in the cloud container right away.

**Why:** mondo never links a device (no device connection, per MEMORY.md), the repo has no CI (deleted 09-29), and on 11-22 he asked for balance passes to start now.

**How to apply:** a detached `setsid nohup` process DIES when the turn ends: the idle container is suspended (11-22 the lab died at 3 min; the container rebooted). Run each lab as a harness-tracked Bash `run_in_background` task of at most 115 minutes (the 2-hour cap) and pool back-to-back labs on the same stats. Don't ask him with a decision card. Ask again after 2026-12-22.

Related [[balance-loop-20261108]].
