---
name: second-developer-onboarding-20261115
description: mondo plans an associate on another Claude account (11-15); onboarding + owner rules + a frozen memory copy are in the repo (PR #1486); lasting facts must now also go in docs/notes
metadata:
  type: project
  modified: 2026-11-15T19:11:35.541Z
---
mondo 11-15: asked whether an associate on a different Claude account, connected to the same repo and R2 bucket, could continue or work in parallel; said "yes" to setting it up.

PR #1486 (docs only): `docs/notes/onboarding.md` (access: GitHub collaborator + Claude GitHub App, R2 Account API token Admin Read & Write as a Network secret for api.cloudflare.com, Meshy key as a Network secret, Render needs nothing; parallel-work rules; what does not travel: /mnt/project-files, threads, the inbox folder), `docs/notes/owner-rules.md` (his standing rules, from MEMORY.md + the linked rule files), `docs/project-memory/` (all memory files as of 11-15, thread/session ids removed, frozen), CLAUDE.md "NEW HERE?" section + 2 index rows.

**Why:** another account sees none of this project's memory, instructions or /mnt/project-files.
**How to apply:** when mondo sets a NEW standing rule, add it to `docs/notes/owner-rules.md` in a PR as well as to memory; lasting system facts go in the matching docs/notes file. Files the associate needs from /mnt/project-files must be copied to R2 `dirtymondo` (see [[project-files-r2-backup-20261113]]). He still has to do himself: add the collaborator on GitHub, make the associate's Cloudflare token, hand over a Meshy key.

Mistake to avoid (this thread): never guess a PR number for merge_pull_request; read the number from the create_pull_request result or list_pull_requests. A guessed #1485 merged the Desert thread's finished PR (no harm: complete, R2 matched main).
