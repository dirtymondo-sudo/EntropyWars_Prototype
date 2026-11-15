---
name: github-app-installed
description: 2026-09-29 mondo installed the Claude GitHub App; threads can now push branches, open PRs and merge to main
metadata:
  type: project
  modified: 2026-09-29T18:18:53.848Z
---
2026-09-29 mondo connected the Claude GitHub App on dirtymondo-sudo/EntropyWars_Prototype after being annoyed at hand-deleting files. Pushes now work: the "Remove tests" thread pushed a branch, opened PR #1 and squash-merged it to main (tests, check-* tools and CI deleted).

This supersedes the "pushes 403" part of the delivery convention for REPO files. R2 scripts still have to be uploaded to the bucket by mondo, and index.html still goes to Render.

**How to apply:** repo-only changes (docs, deletions, tooling) can go straight to the repo via branch + PR; ask mondo whether he now wants game-file deliveries pushed too instead of zipped. See [[tests-removed]].
