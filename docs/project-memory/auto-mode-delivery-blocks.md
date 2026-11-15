---
name: auto-mode-delivery-blocks
description: The auto-mode classifier blocks commit/push and writing the zip until mondo says it in the thread himself; ask once, early, in one line
metadata:
  type: feedback
  modified: 2026-10-05T00:55:16.919Z
---
2026-10-05 (thread "stepped stairs", PR #104): auto mode blocked git commit/push ("Out-of-Place Publication", likely because the repo CLAUDE.md still says never commit or push) and also blocked writing the zip to /mnt/project-files. A coordinator relay was enough for the push, but the zip only went through after mondo typed "write the zip" in the thread himself. mondo was furious at being asked three times ("why do i have to keep telling these chats to push the merge and write the zip").

**Why:** a coordinator note is not the user's approval. The classifier wants mondo's own words in the thread.
**How to apply:** if the first commit or zip write is blocked, ask mondo for ONE combined line covering everything in a single message ("say: push, merge and write the zip") and don't let it come back as separate asks. Related: [[github-app-installed]].
