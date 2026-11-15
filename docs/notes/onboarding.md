# ONBOARDING — a second developer on another Claude account (2026-11-15)

This is for a developer (and their Claude) who joins from a DIFFERENT Claude account than the owner's. Everything you
need to carry on is in this repo and in the R2 buckets. Nothing you need lives only in the owner's Claude project any more.

Read in this order: this file, `CLAUDE.md` (the workflow rules, word for word), `docs/notes/owner-rules.md` (what the
owner wants and never wants), then the `docs/notes/` file for the system you will touch.

## 1. What you need access to

No secret is written in this repo, and none may ever be. The owner hands each one over himself.

| What | Why | How you get it |
|---|---|---|
| GitHub repo `dirtymondo-sudo/EntropyWars_Prototype` (private) | All code, notes and tools. | The owner adds your GitHub user as a collaborator with write access. Install the Claude GitHub App on the repo for your account, so your Claude can push, open PRs and merge. |
| Cloudflare R2, account API token, **Admin Read & Write** | The game loads its scripts and assets from bucket `ewmusicsfx` (public as `cdn.entropywars.net`). Bucket `dirtymondo` is the private art / archive / inbox bucket. | The owner makes a token for you in the Cloudflare dashboard. In your Claude cloud environment add a **Network secret**: host `api.cloudflare.com`, header `Authorization: Bearer <token>`. Object Read & Write tokens do NOT work with the upload tool. The account id is in `sync-zip.js` (not a secret). |
| Render | Serves `index.html` and runs `server.js` (matchmaking). It auto-deploys from `main`. | You need nothing to ship. Only the owner's dashboard can cancel a stuck deploy or change env vars (`EW_ALLOWED_ORIGINS`, the `CF_*` database vars, `BOT_ADMIN_SECRET`). |
| Cloudflare D1 (accounts, ELO) | Used by the live server only. | Nothing. Local runs work without it ("Database not configured" is expected). |
| Meshy API key | Only for approved Meshy model work (`docs/notes/meshy-remake-plan.md`). | The owner gives you a key. Add it as a Network secret for host `api.meshy.ai`. Never in a file, chat log or commit. |

Check your access before your first change:

```bash
git fetch origin main && git merge origin/main      # the fresh check, CLAUDE.md RULE #1d
node fresh-check.js                                  # must print FRESH
node sync-zip.js --dry-run                           # lists R2 files that differ from main (reads only)
# proves your R2 token works (the account id is the one in sync-zip.js); expect "success": true
curl -sS "https://api.cloudflare.com/client/v4/accounts/<account id>/r2/buckets/dirtymondo/objects?prefix=inbox/" | head -c 300
```

## 2. Set your Claude up the same way

A Claude on another account starts with none of the owner's project settings. Copy these into your own project
instructions (or just rely on `CLAUDE.md`, which says the same):

- You are pre-approved to commit, push your branch, open a PR, merge it to `main` and upload to R2 in the same turn as
  the fix, without asking.
- Before merging: `git fetch origin main`, merge it into your branch; on a conflict keep BOTH sides by hand. Never
  force-push `main`.
- After merging: bump the `?v=` token in `index.html` (in the same PR as any R2 file change), then
  `node sync-zip.js --upload`, then confirm each live file's sha256 matches `origin/main`.

If your Claude's safety layer refuses a push or an upload, it wants the approval in your own words in that chat: type
one line naming the action ("push, merge to main and upload to R2").

Editing `CLAUDE.md` or `AGENTS.md`: use the editor tool and the GitHub tools; shell commands that touch those two files
tend to get refused.

## 3. The delivery workflow in one screen

The full text is `CLAUDE.md` RULE #1, #1b, #1d. In short:

1. `git fetch origin main && git merge origin/main` FIRST, every session. A cloud clone is shallow and can be days old.
2. Edit the existing files in place. Never add a new game `.js` (the R2 upload set is fixed). Repo-root dev tools are fine.
3. `node --check <file>` on every JS file you edited. There is no test suite; do not add one.
4. Changed any file the game loads from R2? Bump the `?v=` token in `index.html` in the same PR.
5. Commit on your own branch, push, open a PR, fetch + merge `main` into it again, merge the PR.
6. `node sync-zip.js --upload`. It uploads every file that differs from `origin/main` and re-reads each one live.
7. Report each file with the first 8 characters of its sha256.

**The zip fallback** (only when the upload is refused): `node sync-zip.js --out <dir>` writes
`ENTROPY_WARS_SYNC_<UTC yyyymmdd-hhmm>.zip` holding EVERY file that differs between live R2 and `origin/main`, all inside
one top-level folder of the same name (never loose files). Someone with bucket access uploads the newest zip only; it
always replaces every older one. The default output folder `/mnt/project-files/r2-sync` exists only in the owner's
project, so pass `--out`.

**When a fix seems missing in the game:** fetch the file from `cdn.entropywars.net` twice, once with the live `?v=`
token and once with a random query string, and compare both to `origin/main`. R2 differs = upload again. Only the token
URL differs = the CDN cached the old file under that token: bump the token again in a new PR.

## 4. Working at the same time as the owner

The owner runs many Claude threads at once and they all merge to `main` many times a day. That is the normal state, and
the workflow above is built for it:

- One branch per piece of work. Merge `main` in before you merge out. Two people editing the same lines = a conflict you
  resolve by hand, keeping both changes, then re-read the area.
- `index.html`'s `?v=` token is the one line everybody changes. After merging `main`, re-bump it to a fresh value.
- `node sync-zip.js --upload` is safe to run by anyone at any time: it makes R2 equal `origin/main`, whoever merged.
- `data.js`, `three-renderer.js`, `battle.js`, `map.js` and `hud.js` are huge and edited constantly. Keep edits small
  and merge often.
- Tell the owner which system you are working on, so two people do not rebuild the same thing. The big areas each have
  a notes file that says what is done and what is waiting on his answer.

## 5. Where the state of the project lives

| You want | Look in |
|---|---|
| The rules of delivery, tooling, online parity | `CLAUDE.md` |
| What the owner wants / forbids | `docs/notes/owner-rules.md` |
| The history and current state of a system | `docs/notes/<system>.md` (index table at the top of `CLAUDE.md`) |
| Every 3D model and how it was made | `MODEL_LIST.md` (`node list-models.js` rewrites it) |
| Where files sit on R2 | `docs/notes/r2-layout-plan.md`, `docs/notes/r2-inventory.tsv`, `ASSET_MANIFEST.json` |
| Area layouts | `docs/disaster-city/`, `docs/areas/<area>/layout.json`, `docs/notes/areas-complexes.md` |
| Story and world design | `DOOR_MASTER.md`, `DOOR_STORY.md`, `docs/notes/door-docs.md` |
| How to drive the game in a browser | `PLAYTEST_NOTES.md` |
| The owner project's memory, as it stood 2026-11-15 | `docs/project-memory/` (`INDEX.md` first; 668 dated notes, grep by topic) |
| What changed and why | The merged PR descriptions on GitHub (over 1,480 of them) |

`docs/project-memory/` is a frozen copy. It is not updated after 2026-11-15. New lasting facts go in the matching
`docs/notes/` file, in the same PR as the change, so both accounts see them.

## 6. What does NOT travel to another account

- **`/mnt/project-files/...`** is the owner project's shared folder. The notes mention it often (proof pictures, sync
  zips, the inbox, Meshy outputs, harness scripts). You cannot see it. The big source archives were copied to R2 bucket
  `dirtymondo` under `project-files/<same path>`; anything else, ask the owner to drop into that bucket.
- **The inbox** (`docs/notes/inbox.md`): the owner's drop-off folder is in his project. The R2 half
  (`dirtymondo`, prefix `inbox/`) is reachable with your token.
- **Threads.** Notes say "thread" for a conversation in the owner's project. Those are not reachable; the PR and the
  notes file hold the result.
- **Decisions waiting on the owner.** Many notes end with "waits his OK". Do not build those until he says so.
- **Local saves, themes and settings** live in each player's browser, not in the repo.
