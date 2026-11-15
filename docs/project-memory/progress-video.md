---
name: progress-video
description: Dev-progress video (2026-10-13) from old commits; rig that boots any old commit with its own scripts lives in /mnt/project-files/progress-video/source
metadata:
  type: project
  modified: 2026-10-13T04:23:28.020Z
---

2026-10-13 thread "progress video": /mnt/project-files/progress-video/ENTROPY_WARS_PROGRESS.mp4 (50.8 s, 1080p30, silent), 26 battle shots sampled every ~100 commits (2,595 commits, Mar 25 to Oct 12 2026), minimal motion graphics (rolling commit counter, date, hash, timeline bar).

How old builds were played: source/tools/rig.js answers every request via Playwright routes: page + R2 scripts from `git show <commit>:<file>`; a script the commit lacked comes from the nearest git-history version (top-level const clashes renamed); three.js/socket.io from npm (cdnjs/jsdelivr are blocked by the sandbox proxy); assets from the live CDN. Full clone needed (`git fetch --unshallow`).

Gaps: Apr 8 to Jun 4 (commits ~541-667) loaded every script from the old r2.dev bucket and no copy survives, so those builds can't be replayed. Apr 6-7 builds needed the June 5 data.js. June+ builds go `_goToVsCpu()` → mode → builder → startMatch; from ~commit 1601 the `.ms-mode-card` selector no longer matches, so they start on the default Proving Grounds map.

Never `pkill -f` a pattern that appears in your own command line (it kills the shell). Related: [[trailer]].
