---
name: push-as-you-go-long-jobs-20261105
description: Long thread jobs (bakes, sims, training) must push every finished piece at once; the 11-03 Blender VFX thread lost everything when its machine died
metadata:
  type: feedback
  modified: 2026-11-05T07:12:24.466Z
---
11-03 thread "Learn Blender VFX and remake fireball" (thread in the owner project) kept its guide
(docs/BLENDER_VFX_GUIDE.md), Blender scripts, game code and partial bakes only on its cloud container. Last update 08:41,
then started ~90 min of bakes; the container died and was wiped. Nothing on any branch or in /mnt/project-files. Nobody
noticed for 2 days (dead thread can't post; checklist stayed "in progress"). mondo 11-05: "diagnose wtf happened, this is bs".

**Why:** cloud containers are ephemeral; uncommitted work is gone when they die.
**How to apply:** any thread doing long work pushes its branch (WIP commits OK) and copies outputs to /mnt/project-files/<topic>/
as each piece lands, BEFORE starting the next long step; run long bakes in chunks of <=~20 min. Coordinator: a thread silent
for >1h mid-job is presumed dead, check it. Redo thread: (thread in the owner project).
Related [[blender-vfx-research-20261103]]
