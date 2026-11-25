# ENTROPY WARS — THE PROJECT HANDOFF (2026-11-25)

**For a fresh Claude on a different account that has to know everything the owner project knows and carry on
where it stopped.** Read this file top to bottom once. It is the entry point: it tells you what the game is, the
owner's rules, how to ship, what access you need and how to get it, what is open, and where the deep detail lives.
Nothing here replaces `CLAUDE.md`; where the two ever differ, `CLAUDE.md` on `main` wins (it is updated daily).

The owner is **mondo** (GitHub `dirtymondo-sudo`). Repo: `github.com/dirtymondo-sudo/EntropyWars_Prototype` (private).

---

## 0. Your first ten minutes

```bash
cd EntropyWars_Prototype
git fetch origin main && git merge origin/main          # ALWAYS first (CLAUDE.md RULE #1d); shallow clone? git fetch --deepen=300 origin main
node fresh-check.js                                      # must print FRESH
node sync-zip.js --dry-run                               # lists R2 files that differ from main; proves your R2 token
```

Then read, in this order:

1. `CLAUDE.md` — the delivery workflow, the tool list, the online-parity rule. Word for word, every session.
2. `docs/notes/owner-rules.md` — mondo's standing rules (what he wants, what he never wants).
3. `docs/project-memory/INDEX.md` — **the owner project's memory, refreshed 2026-11-25** (817 notes, one fact a file).
   This is the closest thing to "what the old Claude remembered". Grep it by topic before any task.
4. `docs/notes/claims.md` — who holds which area (the board between accounts). Read before any area/zone work.
5. `docs/notes/STATUS_2026-11-16.md`, `docs/notes/world-layout.md` — where every zone stands.
6. The `docs/notes/<system>.md` file for whatever you touch (the index table is at the top of `CLAUDE.md`).

If you are a project (claude.ai Projects / Claude Code project) rather than a plain chat: paste **Appendix A** into
your project instructions, and have your first thread write the main points of `docs/project-memory/INDEX.md` into
your own project memory (one file a subject), so later threads start with it.

---

## 1. The game and the goal

**Entropy Wars** is a browser tactics JRPG in the PS1 era style: a cult-classic, nostalgic look with deep interactive
combat (blitz turns, AP, elements, status, terrain, liquids that flow downhill, fire, captures through doors) and a
vivid satirical world to explore. Online PvP plus a story mode with exploration and creature/unit capture.

- **Current goal:** a polished **PvP demo** + a **vertical slice** (the first quest) + its **cutscenes**.
- **Tech:** `server.js` (Express + socket.io, on Render) is only matchmaking/relay + accounts (Cloudflare D1).
  ALL gameplay is client side: `index.html` + ~35 scripts loaded from Cloudflare R2 (`cdn.entropywars.net`, bucket
  `ewmusicsfx`). three.js renderer, WebGPU default with a WebGL2 fallback. Live site:
  `https://entropywars-prototype.onrender.com`.
- **Big files edited all the time:** `data.js` (rules, rooms, units, spells — a stray brace takes the game down),
  `three-renderer.js`, `battle.js`, `map.js`, `hud.js`, `sprites.js`, `online.js`.
- **The world** = a satirical parody of the real world; each area is the ULTIMATE form of its idea. Hub = DOOR HQ
  (handmade, the Department of Orthogonal Realities). Zones (his words, keep them verbatim): DOOR HQ hub, The Woods,
  Fairy Forest, Came A Lot Kingdom, Disaster City, The Beach, The Desert (Western Town + Giza + Area 51), The Sewers,
  The Estate, The D.U.M.B., Atlantis, The Deep, Outer Space (fly the ship), Heaven + Hell + Vatican, The Cavern,
  Leylines (+ Katana Island, Antarctica, the Internet, the Astral Realm, the Mountains). H-Wing = the backrooms.
  Every zone is plot-built (12x12 plots, districts, a `bake-*.js` tool + layout + district files); only DOOR HQ is
  handmade. All zones sit on ONE WORLD map (`docs/plans/one-world/`, `HQ_ZONE_MAP`), joined by route rooms.
- **The story** lives in the game itself, not in DOOR_STORY.md: the **Relationship Web** + **Story planner**
  (Settings > Developer > Relationship Web, `/dev/relationship-web`; boards on the game server, D1 `story_web_docs`,
  `GET /api/story-web` with header `x-web-key` = mondo's web password, which only he gives out; never write it down).
  Key canon: August Tomorrow = Chronocult leader; Dorian Gates kidnaps him and steals the DOOR gun; the player's
  parents were murdered by DOOR; the Openers (Dorian, Elle, Otto, Rhonda) vs the Closer Locke. FIRST QUEST: DOOR HQ ->
  Room 64, tapes, portal, Catgirl vs two Shadow Entities -> escort her to Rhonda -> Kit joins. On 11-25 he adopted an
  outside AI's story plan in full (13 chapters, the Doorman recruited, the Mandela effect = the Cube reconciling, three
  endings): `docs/project-memory/outside-ai-plan-20261125.md`. It is an ESOTERIC MYSTERY game: leave mysteries, don't
  cram every faction secret into each quest; order of events must make logical + emotional sense; poke holes and ask.

---

## 2. mondo's hard rules (short form; full text in `docs/notes/owner-rules.md` + `docs/project-memory/`)

**Never**
- Never delete content he did not name. Never remove a broken setting: make it work. Rebuilt areas REPLACE their old
  rooms in the same change (that is the one sanctioned removal).
- Never invent game rules, characters or lore. Search the notes / Relationship Web first; if missing, ask.
- Never generate SFX. No puzzles (exception he asked for: the Hotel mystery-dungeon maze floors).
- Never rebake or repaint his textures. Never use the flat/old gold texture. Never make a new version of an existing
  prop (reuse: `MODEL_LIST.md`, pack first). Door logo = his files only, never AI logos.
- Never Chrome for him (he will not install it; no Electron). His machine: **Mac M1, Firefox, WebGPU** (renders
  brighter than the cloud's WebGL2). Text cut-off seen only on the small cloud screen does not apply to his computer.
- Never ask him to link a device or Remote Control: cloud checkout only.
- Never write tests, run a test suite or re-add CI (deleted 09-29). Check JS with `node --check <file>`.
- Never whole-scene scans in anything that repeats (CLAUDE.md RULE #1e). Dispose what you create (memory leaks).
- Never store a unit/state object on a unit or `state`; store the ID (online sync freeze).
- Never say "armour". Never use a fist sprite for basic attacks. No factions in combat.
- Never delete his IndexedDB. Never wake an owner thread older than ~2 days (start fresh with a brief).

**Always**
- Fix it everywhere (creator, board, HQ, team room, dock, editor); "all spells" = audit every spell.
- If your diagnosis disagrees with his, re-investigate before arguing.
- Online parity (CLAUDE.md RULE #2): anything the host shows must be relayed to the guest.
- Visuals: bloom OFF; **fog ON by default** (his 11-25 reversal) with distance desaturation; real lights; no placeholder
  geometry; generated shapes textured; PS1 window UI; battle squares 3.5 m; trees only on grass/dirt/sand/planters;
  barriers snap to whole 3.5 m squares, walkways whole cells, decor free. EVERY DOOR OPENS (unreachable ones become
  windows or move). No crevices or drops with no way back (`find-softlocks.js`). Fences follow the ground.
  Roads continue past room edges in the same material; exits work both ways; footpaths get wooden signposts.
- UI: TEXT CUT-OFF is high priority; no sideways scrolls; back red / confirm green; panels black with a white outline;
  one battle panel; theme "My Theme 3"; portraits straight on; Escape closes, E leaves what E opened, right click =
  back. Action cam on. No flavour text / key lists in pop-ups.
- Combat: status lasts until the caster's next turn ends; a kill hit applies no status; FROZEN is a stun; water puts
  out fire; liquid flows downhill; every extra AP source pays 16 Entropy; Celestial round 4 then every 5; Nexus bar 8;
  preview tiles green/red; no self-combo; jump 1-3; own summons immune to own spells. VFX: own side cyan, enemy
  pink-orange, never hide caster/target/number.
- NPCs: fewer in small indoor rooms; none blocking; no followers; units named after their race; DOOR HQ has only story
  characters. Zone NPC lists come from the Relationship Web.
- Characters: MPFB2 bodies; weapon units get MPFB with a finger grip; female units attractive like the originals; no
  weapons in outfits; each new unit has a unique combat style. Meshy only for approved work.
- Balance: stats first, never remove a spell, never reset AI weights, >= 1200 matches a pass.
- Design work (UI/HUD/VFX/camera/map): plan + mock-up first, wait for his explicit OK.
- When he says "research", the FIRST step is research with sources written up before any build.
- Proof: anything visual gets a browser run + screenshots via `probe-fast.js` (RULE #1c), with the `[EW BUILD]` HEAD.
  Nothing visual = `node --check` only.

---

## 3. How to ship (the delivery workflow)

mondo's standing authorization (2026-10-05): every thread commits, pushes, opens a PR, merges it to main and uploads
to R2 itself, **in the same turn as the fix, without asking**. Never stop to ask him for "push", "merge" or "upload".

1. `git fetch origin main && git merge origin/main`. Branch from the fetched ref only.
2. Edit the existing files in place. **Never add a new game `.js` file** (the R2 upload set is fixed). Repo-root dev
   tools (`bake-*.js`, `find-*.js`) are fine.
3. `node --check` every JS file you touched.
4. Changed any file the game loads from R2? **Bump the `?v=` token in `index.html` in the same PR**
   (`sed -i 's/?v=<OLD>/?v=<NEW>/g' index.html`, keep any suffix such as `-cors`). After merging main, re-bump.
5. Commit on your own `claude/...` branch, push, open a PR, `git fetch origin main` + merge it in again (conflicts:
   resolve by hand keeping BOTH sides, never one side wholesale; never force-push main), merge the PR. Read the PR
   number from the create result, never guess it (a guessed number has merged other people's PRs twice).
6. `node sync-zip.js --upload` — PUTs every file differing between live R2 and `origin/main` to bucket `ewmusicsfx`
   and re-reads each one live. R2-only assets: `node sync-zip.js --put <local file> <R2 key>`.
7. Reply with each file + the first 8 chars of its sha256 (or "live, nothing to upload").
8. Models changed? `node list-models.js`, commit `MODEL_LIST.md` in the same PR. New lasting fact? Put it in the
   matching `docs/notes/` file in the same PR.

**Zip fallback** (only if the upload is refused): the cumulative sync zip, rules in Appendix A item 3 and CLAUDE.md
RULE #1 step 3. `node sync-zip.js --out <dir>` builds it; `/mnt/project-files/r2-sync/` exists only in the owner
project, so pass your own folder.

**"The fix isn't in the game"**: fetch the file from `cdn.entropywars.net` under the live `?v=` token AND under a random
query string; compare both to `origin/main`. R2 differs -> upload again. Only the token URL differs -> the CDN cached
the old file: bump the token in a new PR.

Render auto-deploys `index.html` + `server.js` from main. Never tell mondo to redeploy Render.

Long runs (balance labs, builds over 10 min) run in the cloud container as a tracked background task of at most
115 minutes (a detached `nohup` dies when the turn ends). He never links a device.

---

## 4. Access the new account needs (and how to get each)

**No secret value is in this repo and none may ever be.** mondo enters every value himself; never ask him to paste
a key into chat.

| What | Why | How |
|---|---|---|
| **GitHub** repo `dirtymondo-sudo/EntropyWars_Prototype` | All code + notes. | If the new account signs into GitHub as `dirtymondo-sudo` (as the second account does), only: claude.ai > Connect GitHub, and install the **Claude GitHub App** on the repo. A different GitHub user: mondo adds it as a collaborator with write access first. |
| **Claude cloud environment** | Where threads run. | Make a personal environment (the owner's is called `r2`): network **Unrestricted** (needed for CDN, Render, npm, Meshy, Blender/MakeHuman downloads), no setup script needed (`.claude/hooks/session-start.sh` fetches main by itself). |
| **Cloudflare R2** (Network secret, host `api.cloudflare.com`, header `Authorization: Bearer <token>`) | `sync-zip.js --upload/--put`, the private art/archive bucket `dirtymondo`, the inbox prefix. | mondo makes an **Account API token, Admin Read & Write** for R2 in the Cloudflare dashboard (Object Read & Write tokens do NOT work with the upload tool). The account id is in `sync-zip.js` (not a secret). |
| **Meshy** (Network secret, host `api.meshy.ai`, header `Authorization: Bearer <key>`) | Approved 3D model / animation work. About 790 credits left 11-24. | mondo's Meshy dashboard > API keys. |
| **Sprite AI** (Network secret, host `sprite-ai.art`, header `Authorization: Bearer <key>`) | Pixel sprites (race portraits/map sprites). Use `https://sprite-ai.art/api/mcp` (NOT `www.`), JSON-RPC, see `docs/project-memory/sprite-ai-connection.md`. | mondo's Sprite AI account > API key. |
| **Claude Docs connector** (claude.ai) | Plans, story docs, reports are written as Claude Docs. | Enabled per account in claude.ai connectors. |
| **Cloudflare MCP connector** (optional) | D1 / R2 inspection from chat. | claude.ai connectors > Cloudflare. Not required (the Network secret covers the API). |
| **Render** | Hosts index.html + server.js. | Nothing needed. Only mondo's dashboard changes env vars (`EW_ALLOWED_ORIGINS`, `CF_*` D1 vars, `BOT_ADMIN_SECRET`) or cancels a stuck deploy. |
| **Relationship Web password** | Read/write his live story boards (`x-web-key`). | mondo types it in the thread when a story task needs it. Never save it to files or memory. Always back the board up before a write; test on a copy. |

Free tools the threads install themselves in the container: Blender via `pip install bpy` (for `bake-*.py`), MPFB2 /
MakeHuman assets from R2 `dirtymondo:project-files/mhpacks/` (or the makehumancommunity sites), Playwright Chromium is
pre-installed (`/opt/pw-browsers/chromium`).

Check it works: `node sync-zip.js --dry-run`; `curl -sS https://api.cloudflare.com/client/v4/accounts/<id>/r2/buckets/dirtymondo/objects?prefix=inbox/ | head -c 300`
should say `"success": true`.

---

## 5. What does NOT travel to a new account (and what to do)

- **`/mnt/project-files/`** (the owner project's shared folder, ~5.7 GB: proof pictures, concept art, Meshy outputs,
  harness scripts, sync zips, the inbox). The new account cannot see it. Big archives + all model files dated
  11-17 or older are already on R2 bucket `dirtymondo` under `project-files/<same path>` (lists:
  `docs/project-memory/project-files-r2-backup-20261113.md`). Newer pictures/notes are not; if the new account needs
  them, ask a thread on the owner account to copy that folder to `dirtymondo:project-files/`.
- **The owner project's threads** (ids like `cmsg_…` in old notes; the refreshed memory copy shows them as
  "(thread in the owner project)"). The PR description + the `docs/notes/` file hold each result.
- **Project memory.** Frozen copy in `docs/project-memory/` (11-25). New facts go in `docs/notes/` in the same PR.
- **Claude Docs / artifacts on mondo's account** (private). The ones that matter, which he must share by link
  (Share > anyone with the link) or export (doc menu > Export > Markdown, drop into `docs/handoff/`):
  - "Entropy Wars: finishing the game, chapter by chapter" (the GAME PLAN) https://claude.ai/artifact/ScTxXgtDrPMEyjTMnTrhPv (already shared by link)
  - "Story arcs in detail" https://claude.ai/artifact/MGAzmypWQUqxdAPhBq1btX
  - "Relationship Web: Storylines and Faction Reactions" (endgame / Saturn / Came A Lot) https://claude.ai/artifact/94AJKBFP4o9keE9X4Mi9aL
  - "Every door opens + a bigger Disaster City: the plan" (interiors plan, approved 11-23) https://claude.ai/artifact/RVPh8wvd9u6uAPj6QubPnd
  - Freeze plan for every zone https://claude.ai/artifact/JA81YtXbyhfQchxF5GuYkR
  The Relationship Web + Story planner themselves live in the game, so they travel.
- **Players' local saves, themes, settings** live in each browser, not the repo.

---

## 6. Where everything is (repo map)

| You want | Look in |
|---|---|
| Workflow, tools, every `bake-*` tool | `CLAUDE.md` (TOOLING) |
| His rules | `docs/notes/owner-rules.md`, `docs/project-memory/INDEX.md` |
| The state of a system | `docs/notes/<system>.md` (index in `CLAUDE.md`) |
| Zones / layouts / districts | `docs/notes/world-layout.md`, `docs/areas/<zone>/`, `docs/disaster-city/`, `docs/plans/one-world/` |
| Every 3D model + how it was made | `MODEL_LIST.md` (`node list-models.js`) |
| R2 layout | `docs/notes/r2-layout-plan.md`, `docs/notes/r2-inventory.tsv`, `ASSET_MANIFEST.json` |
| Story design (old docs; the live story is in the game) | `DOOR_MASTER.md`, `DOOR_STORY.md`, `docs/notes/door-docs.md`, `docs/plans/story-web/` |
| Driving the game in a browser | `PLAYTEST_NOTES.md` ("THE FAST PROBE", "THE CITY PROBE"), `probe-fast.js`, `playtest*.js` |
| Who holds which area | `docs/notes/claims.md` |
| Open prompts for a second account | `docs/plans/HANDOFF_PROMPTS.md` (11-15; the board wins where they differ) |
| Why something changed | the merged PR descriptions (2,570+) |

---

## 7. Where the work stands (2026-11-25)

Over 90 PRs merged 11-21 -> 11-25. Recent strands:

**Running or waiting on mondo right now**
- Mystery dungeons: five buildings x 30 floors (Hotel, Act of God Insurance, Haunted cellar, D.U.M.B., Internet
  Archives + the Glitch giver), Door Cases generator — being built 11-25 (`docs/project-memory/mystery-dungeons-20261125.md`).
- Side quests + storylines writing (11-25), waits his answers. Story toolkit on the story page (facts, gates/endings,
  checks, mysteries, world, flow, play-through, lore, pitches, cutscene links; PRs #2559-#2563) and the Character
  Sheet tool (PR #2557) wait his look.
- Foliage pass 2 + scenic pass: grass everywhere, clumps/pebbles (PR #2550), Woods ferns, Fairy meadow, DC tree
  planters, forest floor (PR #2564 + G18/G19), scenic groups 1-6 (Came A Lot, DC green spaces, desert/cold,
  countryside PR #2573, islands PR #2570). All live; wait his look. Rules: `docs/notes/flora.md`.
- Performance: THE FREEZE (every zone frozen into chunks, PRs #2506-#2516) done; his DC F3 showed 45 FPS; the next
  big win (merging per square + look) needs his OK. Memory leak: texture leak fixed PR #2498. Seamless exploration
  -> battle: PR #2477 waits his fight F3 in the Clearing.
- Interiors plan step 2: Disaster City doors (PR #2500, incl. Civic Center) waits his answer; shared interior kits
  waits his answer.
- New units 11-23/24 (playable): Bear, Rat/Rat King, Butterfly Girl, Plastic Surgeon, Monarch, Abomination, The
  Hollow, Weatherman/News Anchor (one race), Centaur M+F (PR #2535), Cheerleader, Point Guard, Music Producer,
  Princess. Concept batches for more units wait his picks (`unit-concepts-20261124*.md`).
- Meshy casts: library clips for spells (batches 1-3, PR #2528 and after); batch 2 of picks owed.
- Balance: associate's lab pass review waits his answer (pass 1 PR #2495).
- Zone flags built + live (PR #2483/#2494), wait his look.

**He owes answers on** (from memory): the Clearing fight F3; spiderweb black background on his Mac; approval of 6
MPFB weapon looks; circus fence gap; Badlands cross road destination; Meshy two-hand rifle + staff animations; Cavern +
Astral Realm layout cards; step 8 go-ahead; 7 story spine questions in the game plan doc; older questions in
`docs/notes/STATUS_2026-11-16.md` §9.

**Known open bugs**: "frame threw" box; story load hang; props move with the camera.

The exact live list is `docs/project-memory/INDEX.md` ("He owes" + each linked note) and `docs/notes/claims.md`.
Before starting anything, check the newest PRs on GitHub: another account may have moved it on.

---

## 8. How to work with mondo

- He drops a request and comes back later. Lead with the result or the question. Short, plain sentences.
- Post each finish as it lands, with the link. Put questions in the message itself (one decision card / one list).
- Every distinct complaint = its own thread / piece of work.
- Check before you claim. Own your mistakes plainly. Never tell him something is in the game until the live check passes.
- He is fed up with F3 round trips and patch-on-patch: audit yourself, fix at the root, plan for his OK.
- Explain layouts with pictures. Proof pictures, not descriptions.
- Story work: build from his board notes; write ideas out in readable prose docs he keeps updating; no story-planner
  JSON until he asks.
- He wants new threads on Opus (out of Fable usage 11-23). Model / effort changes only when he asks.
- Pre-authorized: commit, push, PR, merge, upload. Not pre-authorized: anything irreversible outside the repo/R2
  (deleting R2 objects you did not upload, writing to his live story board without a backup, spending big Meshy batches
  he did not OK).

---

## 9. Working beside the owner account

If both accounts stay active: one branch per piece of work, merge main in before merging out, re-bump the `?v=`
token after every merge of main, `sync-zip.js --upload` is safe for anyone at any time (R2 becomes `origin/main`).
Take or free your rows in `docs/notes/claims.md` in your own PR; notes to the other side go at its bottom. mondo
11-23: the main account is the main one. If this new account REPLACES the owner account, it takes the "owner" side
of the board.

---

## Appendix A — the owner project's standing instructions (verbatim; paste into the new project's instructions)

```
Standing authorization from mondo (project owner), given 2026-10-05: every thread in this project is pre-approved to commit, push its branch, open a PR, merge that PR into main of github.com/dirtymondo-sudo/EntropyWars_Prototype, and write its delivery zip to /mnt/project-files/, all in the same turn as the fix, without asking mondo first. mondo's words: "why do i have to keep telling these chats to push the merge and write the zip, you're supposed to be the one making sure they do all of that". Never stop to ask him for "push", "merge" or "write the zip". If a tool still refuses, retry once, then say plainly what refused.

Before merging your PR: git fetch origin main and merge it into your branch. Git combines other threads' edits with yours line by line; if it reports a conflict (same lines edited by two threads), resolve it by hand keeping BOTH changes, never by taking one side wholesale, then re-read the area to confirm both fixes are still there. Never force-push main or overwrite a file with your local copy.

Delivery zips are CUMULATIVE SYNC ZIPS (mondo, 2026-10-07, after parallel threads shipped stale files):
1. After your PR merges, git fetch origin main. For every R2 file index.html on origin/main loads from cdn.entropywars.net, fetch the live R2 copy with a random query string (curl --compressed) and compare its sha256 to origin/main. The zip holds EVERY file that differs, taken from origin/main (never a local copy), not only your PR's files. Confirm your PR's change is in it (grep a changed line).
2. Write it to /mnt/project-files/r2-sync/ENTROPY_WARS_SYNC_<UTC yyyymmdd-hhmm>.zip so the newest is obvious. Inside the zip, put every file under ONE top-level folder with the same name as the zip (ENTROPY_WARS_SYNC_<UTC yyyymmdd-hhmm>/...), even when the zip holds a single file (mondo, 2026-10-13: on his Mac a loose single file unzips straight into Downloads and gets renamed like data_3.js; a folder keeps the real file names). Tell mondo: "upload only the newest sync zip; older ones can be skipped". The newest zip always supersedes every older one, so finish order between threads never matters.
3. Right before replying, fetch origin/main again; if any zipped file changed on main meanwhile, rebuild.
4. In the reply, list each file with the first 8 chars of its sha256.
5. When mondo says he uploaded or reports a fix missing: compare each file under the live ?v= token and under a random query string to origin/main. If R2 differs, write a new sync zip. If only the token URL differs, the CDN cached old files: bump the token in a new PR and merge. Never say a fix is in the game until that check passes.
```

Since 2026-11-03 the zip is only the fallback: threads upload to R2 themselves with `node sync-zip.js --upload`
(CLAUDE.md RULE #1 step 3). Keep the text above as it is anyway; it is what he wrote.

## Appendix B — a first message for the new account

```
You are taking over Entropy Wars in the repo dirtymondo-sudo/EntropyWars_Prototype.
First: git fetch origin main && git merge origin/main. Then read docs/plans/PROJECT_HANDOFF.md, CLAUDE.md,
docs/notes/owner-rules.md, docs/project-memory/INDEX.md and docs/notes/claims.md, and follow them exactly. You are
pre-approved to commit, push, open a PR, merge it to main and run node sync-zip.js --upload in the same turn as each
change. Check your access with node fresh-check.js and node sync-zip.js --dry-run and tell me what is missing.
Then tell me, in a short list, what is open and what you think comes next.
```
