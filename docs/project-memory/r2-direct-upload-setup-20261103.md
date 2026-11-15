---
name: r2-direct-upload-setup-20261103
description: Threads upload to R2 themselves since 11-03 (PR #876): node sync-zip.js --upload / --put; game bucket is ewmusicsfx; token is a proxy-injected Network secret
metadata:
  type: project
  modified: 2026-11-03T14:17:17.030Z
---
mondo 11-03 (thread "Get direct upload access to R2", (thread in the owner project): threads now upload to R2 directly; no more zips for him.

How it works:
- Cloud env **Network secret**: host api.cloudflare.com, header Authorization = `Bearer <token>`. Token = R2 **Account API token, Admin Read & Write** (he made "claude-upload-2"). Injection reached the running session mid-turn, no new thread needed. Token never in files/chat/memory.
- **Object Read & Write tokens FAIL** on the REST object API (10002 Unauthorized); they only work over S3 SigV4, which needs keys in env (his env screen has NO env-variables box, only Network secrets). Don't suggest Object R&W again (he was furious about the redo).
- Account id b2608d464c04fdeec48ba91f04b8aeb7 (not secret). **Game bucket = `ewmusicsfx`** (custom domain cdn.entropywars.net). `dirtymondo` = art/png bucket, no domain. He wants the music marketing project to use the same token (it covers all buckets).
- `node sync-zip.js --upload` PUTs every file differing from origin/main and re-checks live (random query); `--put <local> <key> ...` for R2-only assets. Uses curl (honours HTTPS_PROXY). CLAUDE.md RULE #1 step 3 updated; zip = fallback only.
- 11-03 first real `--upload` was BLOCKED by the auto-mode classifier (production upload without his own words). R2 matched main then, so nothing was lost. Asked him to add an upload line to the project instructions.
- His older User API tokens: "Cloudflare Agent Token" (Admin Read only) probably powers the Cloudflare connector; keep it.
Related: [[sync-zip-script]] [[cdn-token-stale-cache]] [[auto-mode-delivery-blocks]]
