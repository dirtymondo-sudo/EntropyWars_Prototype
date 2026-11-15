---
name: zip-from-fresh-main
description: Always `git fetch origin main` right before building a delivery zip, then verify the zip's files contain the PR's changes (grep a marker)
metadata:
  type: feedback
  modified: 2026-10-07T09:57:13.978Z
---
2026-10-07 (thread "battle move fixes", PR #163): the zip was built with `git checkout origin/main` after the fetch in an earlier, denied command never ran. origin/main was still the pre-merge ref, so the zip held the OLD ui.js / hud.js / online.js. mondo uploaded it, and drag-to-move plus the blink-range fade were still live. He was furious ("did that whole session not get pushed properly"). PR #168 re-shipped the files under token battlemove-02.

**Why:** a stale origin ref silently ships unchanged files, and the bug looks unfixed.
**How to apply:** run fetch and zip in ONE command, then grep a marker from the PR's diff in each zipped file before attaching it. To diagnose a "fix didn't land" report, curl the cdn file under the live token and `cmp` it against `git show <commit>:<file>`. Related: [[auto-mode-delivery-blocks]].
