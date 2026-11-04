# THE INBOX — mondo's drop-off folder (2026-11-03)

mondo (11-03): "for files i do need to manually upload for whatever reason ... a inbox or dropoff folder where i can
just upload stuff and then you reorganize it whereever it needs to go."

## Where things get dropped

1. **`/mnt/project-files/inbox/`** — THE inbox. mondo uploads here from the Claude app (Project files). Every thread and
   the coordinator can see it straight away. `README.txt` and `_sorted-log.md` live there and are never sorted.
2. **Loose files at the top of `/mnt/project-files/`** that no thread wrote (e.g. `eagle.glb`, 10-27). If the app only lets
   him upload to the top level, they land there. Treat a top-level file as inbox only when no thread/doc names it
   (grep the notes + memory for its name first); never touch the topic folders.
3. **Too big for the app only:** R2 bucket **`dirtymondo`**, prefix **`inbox/`** (private, no public domain), uploaded in the
   Cloudflare dashboard. List: `curl -sS "https://api.cloudflare.com/client/v4/accounts/b2608d464c04fdeec48ba91f04b8aeb7/r2/buckets/dirtymondo/objects?prefix=inbox/"`
   (the proxy adds the token). NEVER an inbox/ prefix in `ewmusicsfx`: that bucket is the public CDN (cdn.entropywars.net).
4. Files he attaches to a chat message land in `/mnt/project-files/uploads/hearth/<id>` (no extension). Those belong to the
   message they came with; the thread that gets the message handles them. Not part of the inbox sweep.

## When to sort

- mondo says "sort the inbox", "I dropped X in the inbox", or a task needs a file he says he dropped.
- Coordinator: a "sort the inbox" ask is a FRESH thread (titled e.g. "Sort the inbox drop-offs"). Brief: cloud checkout only,
  read docs/notes/inbox.md, R2 upload approved (cmsg_01XWpxyTn3nnw98znVzKdFjs74EuWHjG3idGQi9F1ina8J).
- Don't sort unasked in the middle of unrelated work; a file he hasn't explained may be meant for a thread already running.

## The routine (every thread, every time)

1. **List** everything: `ls -laR /mnt/project-files/inbox/`, the top-level loose files (rule 2 above), the R2 `dirtymondo/inbox/` listing.
2. **Identify** each file before moving it: name, `file <path>`, size, `sha256sum`. Copy to a NEW empty scratch dir to look inside;
   never run anything from it (Python with `-I`). Zips: `unzip -l` first. GLBs: parse the JSON chunk (rigged? boneless?
   `_generate`/`_texture` Meshy stages are BONELESS, never wire them). Read his message for what it is for.
3. **Not sure what it is or where it goes? Leave it in the inbox** and ask him ONE question (decision card). Never guess-wire,
   never invent a use for it, never delete it.
4. **Route** it (check MODEL_LIST.md first: is the model already in the game?):

| Kind | Home | How |
|---|---|---|
| Game code he edited (`*.js`, `*.css`, `index.html` with repo names) | the repo file IN PLACE | diff vs origin/main first (other threads changed it since); merge by hand keeping both. Never a new game .js. PR, merge, bump `?v=`, `node sync-zip.js --upload`. |
| Rigged character / race model (`_Character_output.glb`, `_withSkin`) | R2 `ewmusicsfx` `Assets/characters/races/<race folder>/<male|female>/` (lower case; since the R2 layout W5, docs/notes/r2-layout-plan.md) | `node sync-zip.js --put`; wire per CLAUDE.md "Wiring up a 3D character" only if he asked. |
| Prop / decor / building / vehicle / animal / weapon model | R2 `ewmusicsfx` `Assets/world/<props/meshy | props/meshy_decor | packs/<maker>_<pack> | vehicles | animals | nature>/`, spell props `Assets/fx/spell_props/` (r2-layout-plan.md §2) | `--put`; wire only if he asked. |
| Creator pieces (clothes, hair, MPFB, faces, `.mhm`) | repo `charactercreation/` (= R2 `Assets/characters/creator/`) | commit + `--put`; bake tools in CLAUDE.md TOOLING; update its row in docs/notes/character-models-plan.md. |
| Asset pack (zip of a pack) | `/mnt/project-files/asset-packs/<pack name>/` (zip + unzipped) | CHECK THE LICENCE: CC0 / CC-BY OK (add credits), GPL NO, non-commercial = flag to him. Only pieces actually used go to R2. Add a list in `asset-packs/contents-lists/`. |
| Game texture / sky / icon / font | R2 `ewmusicsfx` `Assets/world/{terrain,sky}/`, `Assets/ui/{icons,fonts,status,sprites}/`, audio `Assets/audio/{music,sfx}/` | `--put` (an old folder name is moved to the new one by sync-zip.js). |
| PNG art / concept art not loaded by the game | R2 `dirtymondo` (art bucket) | `EW_R2_BUCKET=dirtymondo node sync-zip.js --put <local> <key>`. |
| Reference images, screenshots, videos, docs for a task | `/mnt/project-files/<topic folder>/` | move; the thread doing that task reads it there. |
| Setup / balance / look / spell-library exports (`Entropy_Wars_*.json`) | the bake tool | bake-setup.js / bake-power.js / bake-looks.js / bake-spell-mods.js per CLAUDE.md TOOLING (ask before baking non-look settings). |
| Audio | ask first | mondo's rule: NO sound/SFX unless he asks for it. |
| Anything with a key / token / password | nowhere | never copy it; tell him to delete it and use an env Network secret. |

5. **Models:** every model that goes into the game: a SOURCES row in `list-models.js` if it is a new folder / pack / maker,
   rerun `node list-models.js`, commit MODEL_LIST.md in the same PR (CLAUDE.md NOTES INDEX). Replacing an EXISTING R2 file in place?
   Update its ASSET_MANIFEST.json entry (`[bytes, sha256[:12]]`, see models-assets.md "THE ASSETS") in the same PR or players keep
   the cached copy.
6. **Upload + verify:** `node sync-zip.js --put <local> <R2 key> ...` for R2-only files; after a repo PR merges,
   `node sync-zip.js --upload` (RULE #1 step 3). It re-checks each key live with a random query; check the sha256 matches.
7. **Clear the inbox:** only once a file is at its home AND verified (sha256 at the destination = the inbox copy), remove the
   inbox copy (`rm`; for R2 `dirtymondo/inbox/<key>` an API DELETE of that one key). Clearing means MOVED, not deleted: never
   remove anything that has no verified home, and never delete anything outside the inbox. Keep the shared folder under ~9 GB
   (`du -sh /mnt/project-files/`, cap 10 GB); if a pack would push it over, ask him first.
8. **Log** one line per file in `/mnt/project-files/inbox/_sorted-log.md`: date, file, where it went (path or R2 key),
   sha256[:8], thread link. Files left behind get a line too, with the question asked.
9. **Reply** to him: each file -> where it went (sha256[:8] for R2), what is still in the inbox and why.
