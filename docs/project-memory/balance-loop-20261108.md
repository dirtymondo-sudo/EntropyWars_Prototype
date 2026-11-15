---
name: balance-loop-20261108
description: 11-08 iterative balance loop (mondo: lab → buff/nerf weakest/strongest → rerun → repeat, split the difference on overshoot); harness, method, passes shipped
metadata:
  type: project
  modified: 2026-11-08T08:54:21.776Z
---
Thread (thread in the owner project). Folder /mnt/project-files/balance-loop-20261108/ (PASS_LOG.md, harness/an.js plan.js apply.js propose.js, runs/).
Harness: `bash /mnt/project-files/balance/weak-races-harness/setup.sh` then `EW_HARNESS_DIR=/tmp/ew-harness node /tmp/ew-harness/lab4.js --minutes 170 --workers 3 --recycle 12 --out DIR`
(serves the REPO working tree, so local edits are what runs; ~9.5 matches/min on 11-08 main, 125 races → ~105 games/race in 170 min).
GOTCHA: `git fetch origin main` BEFORE `git checkout -B branch origin/main` — the first baseline ran on a stale PR #813 checkout and was thrown out.
GOTCHA: don't merge main into the working tree mid-run (pages recycle and reload files); restart the run after a merge.
Method: shrink gap by tau²/(tau²+noise²) (~0.5), MEASURED 17.3 pts per 100 POWER on the 11-08 engine (pass 1 assumed 6.5 and overshot 2.7x), min 15, HP + pool damage stat, ±25 %/stat cap, rest to DEF/M.DEF. Stats only.
Pass 1 = PR #1049 (token 20261108-loop1-02-cors, data.js 5dcfae43): 12 up / 12 down. Baseline 35-63 %, POWER r .28 with WR.
Pass 2 = PR #1052 (token 20261108-loop2-01-cors, data.js c035912d): split the difference on 14 overshoots (harness/refit.js, own-line interpolation t clamp .2-.8), 28 new from p0+p1 pooled, annunaki/loch ness pushed. Pass 2 result: sd 6.5->5.7, MAD 5.18->4.56, true spread ~3.1. Pass 3 = PR #1060 (token 20261108-loop3-01-cors, data.js 91693316): 27 races, read since last change (harness/poolsince.js), tau 3.1, min 12. Pass 3 result: MAD 4.43, true spread ~2.7, misses 3.6 (< noise). Pass 4 = PR #1062 (token 20261108-loop4-01-cors, data.js cd73ff6e): 19 races. Pass 4 result: MAD 4.18, true spread ~2.0, pass-4 races moved within noise -> LOOP STOPPED. Pass 5 = PR #1063 (token 20261108-loop5-01-cors, data.js 95ffeddc): minotaur split back only, not re-measured. FINAL_TABLE.md in the folder (75 races changed). Delivered to mondo ~20:45Z; awaiting his review. If he wants more: rerun lab, poolsince.js over p0-p5 + plan1-5.
Unchanged races correlate only r .16 run to run: pool runs for races not changed.
Related [[balance-stats34-20261101]] [[balance-lab-rules-stamp-20261108]].
