# THE R2 LAYOUT PLAN — reorganizing the asset buckets (2026-11-04, PLAN ONLY)

mondo 11-04: "how would you better reorganize the assets and folder layout, to reflect what assets are actually called
in the code? ... come up with a plan to reorganize it, like a senior software dev or AAA game studio would." Plus: "refer
to your model list/audit too."

**Status: a proposal. Nothing in either bucket or in the game code has been moved, renamed or deleted.** Every move below
waits for mondo's go; every deletion waits for his OK on the exact list.

Companion file: `docs/notes/r2-inventory.tsv` — one row per bucket key (6,178 rows): `key, bytes, verdict, why,
proposed_home`. It is the input the migration tool reads; a later thread regenerates it rather than editing it by hand.

---

## 1. What is in the buckets today (listed 2026-11-04 20:45 UTC, main `7b421e5`)

| bucket | public? | files | size | what it holds |
| --- | --- | --- | --- | --- |
| `ewmusicsfx` | yes, `cdn.entropywars.net` | 6,178 | 9.37 GB | the game: 29 code files at the root, 5,769 assets under `Assets/`, plus 367 stray repo files at the root and 13 under `docs/` |
| `dirtymondo` | no domain (private) | 9 | 31 MB | mondo's art PNGs (`apocalypse.png`, `bubblegum gloom.png`, `liquidation.jpg`, ...). No `inbox/` prefix yet. Not game files; this plan leaves them alone. |

### How each key is used (the verdicts in the inventory)

The verdict comes from a static scan of origin/main: the 26 game files index.html loads (every literal string, plus the
real values of the sprites.js + data.js tables evaluated in the load-data.js sandbox, so template-built paths count),
`charactercreation/*.json`, ASSET_MANIFEST.json (`files` + `alt`), and MODEL_LIST.md (its game tables §2-§10 and its
R2 audit §13).

| verdict | files | size | meaning |
| --- | --- | --- | --- |
| LIVE | 3,784 | 5.19 GB | a path, file name or name prefix the game code or a MODEL_LIST game table names; or the `Assets/opt/` copy the manifest swaps in for one |
| FALLBACK | 190 | 1.59 GB | per-character Meshy `_Animation_*_withSkin.glb` clips a RACE_MODELS_3D entry still names. They only load when the shared anim library fails (`EW_DISABLE_ANIM_LIB`, `noAnimLib`). Keep them. |
| PROBABLY-LIVE | 794 | 0.16 GB | its folder is a base path in code and the name is built at runtime (sky sets, eyebrow/eyelash looks, tornado frames, pack textures an FBX/OBJ/glTF reads by relative path). Treated as live. |
| SOURCE | 132 | 0.10 GB | `.fbx` / `.blend` / `.dae` / `.c4d` / `.3ds` / `.zip` working files the game does not load (Quaternius trees as FBX + .blend, pack sources, the swordfighter zip) |
| ORPHAN | 1,278 | 2.34 GB | nothing loads it (section 5 lists them by group) |

A static scan can miss a name the code builds in an unusual way, so **no orphan gets deleted on this verdict alone**:
section 6 step 0 confirms it with a real-load trace first.

### The problems, ranked

1. **The folder names don't say what is in them.** `Assets/Sprites/Races/` is 4.3 GB of rigged 3D Meshy models and
   animation clips with a few PNG sprites mixed in. `Assets/misc/` is 1.2 GB: 149 Meshy props, the horizon/monument
   models, 61 Elbolilloduro pack pieces, the castle kit and the angel wings. `Assets/weapons/` is the spell props.
   `Assets/door/` is the DOOR HQ room kit. To find a model today you have to know its history, not what it is.
2. **The same kind of thing lives in many places.** Props are split across `decor/`, `props/`, `misc/`, `door/models/`,
   `christmas/`, `halloween/`, `oceanic/`, `Metro_PSX/`, `traps/`, `instruments/`, `chess/`, `stairs/`. Animations are in
   `Assets/Models/` (the shared libraries + 56 loose Meshy clips) and `Assets/Sprites/Races/animations/`.
3. **Casing and spelling are inconsistent, and the casing is load-bearing.** 5,427 keys have capitals. Race folders mix
   `Homosapien/Female`, `Demon/Male`, `Werewolf/female` and `angel/female`, and sprites.js `RACE_PATH_RULES.capGender`
   encodes which is which. R2 is case-sensitive but mondo's Mac is not, so a bucket mirror or a zip can merge two
   folders. There are spelling duplicates (`anunaki` + `annunaki`, `sherrif` + `sherriff`) and a misspelled top folder
   (`foilage`).
4. **276 keys have spaces, brackets or commas** (`night cities files/`, `Car 05/`, `Bumpy Sky/`, `door hq 2.mp3`,
   `urban pop_v2(1).ogg`, `sprite-atlantean-queen,-und-128px(1).png`). Every one needs `%20`/`%28` escaping in code and
   breaks on some tools.
5. **The public bucket root is a dump of the repo.** 367 non-game files are on the CDN for anyone to download:
   `server.js`, `d1.js`, `bots.js`, `004_progress.sql`, `ci.yml`, `.gitignore`, 212 old `*.test.js`, 63 design `.md` docs,
   `phase6repofiles.zip`, a 61 MB `assets.js`, and a stale `index.html` (Render serves the real one). This is
   also a small security concern: the server code and the DB schema are public.
6. **Source files sit on the public CDN** next to the runtime GLBs (FBX, .blend, .c4d, .dae, a Unity package). They cost
   storage and they can't be loaded by the game anyway.
7. **Paths are hard-coded in ~45 places.** Each file has its own base constant (`_S`, `_T`, `_R2_BASE`, `_R2_MISC`,
   `_R2_WEAPONS`, `_R2_METRO`, `_R2_XMAS`, `_R2_HW`, `_R2_ANIMALS`, `_R2_OCEAN`, `_R2_TRAPS`, `_R2_INSTRUMENTS`,
   `_CAR_PACK_BASE`, `_PROPS_BASE`, `_HQ_DECOR_BASE`, `DOOR_HQ_ASSETS`, `EW_CHARACTER_ASSET_BASE`, `TEX`,
   `ELEMENT_ICON_BASE`, ...), and 76 more paths sit in `styles-animations.css` alone. Moving a folder today means
   hunting all of them by hand. **This is the real problem to fix first.** Once the paths live in one table, every
   later move is a one-line change.

What is already good, and stays as it is: `Assets/opt/` (content-addressed `<sha8>_<name>.opt.glb` copies reached through
ASSET_MANIFEST `alt`, the same build-artifact pattern AAA pipelines use), the `?v=` cache token, the manifest's `?h=<sha>`
per-file busting, and the creator's piece prefixes (`mhw_` MakeHuman wear, `ewb_` Blender bakes, `ewm_` Meshy pieces,
`ewf_` fur).

---

## 2. The target layout

Principles (the AAA convention: **a path says WHAT a file is; HOW it was made lives in MODEL_LIST + the manifest**):

- The top level splits by domain: characters, world, fx, ui, audio, plus the generated `opt/`.
- A **pack that references its own files by relative path** (FBX/OBJ/glTF + textures, licence) moves as one unit and is
  never split up.
- **Source files and orphans leave the public bucket.** They go to the private `dirtymondo` bucket and are not deleted.
- The `Assets/` top folder stays, so every URL keeps its prefix and any Cloudflare cache/CORS rule keyed on it still
  applies.
- Code files stay at the bucket root exactly where index.html loads them. sync-zip.js, deploy.js and the `?v=` token all
  assume the root, and moving them gains nothing.

```
ewmusicsfx  (public, cdn.entropywars.net)
├── index.html's 29 code files + ASSET_MANIFEST.json          (unchanged)
└── Assets/
    ├── characters/
    │   ├── races/<race id>/<male|female>/      rig GLB, per-race sprites + portrait (was Sprites/Races/)
    │   │                                       folder = the data.js race id, lower case, ONE spelling
    │   ├── animations/                         UAL1_Standard, UAL2_Standard, MAL1_Sniper (was Models/)
    │   │   └── legacy/                         the Meshy per-character clips the fallback still names
    │   ├── creator/                            = Models/charactercreation/ moved whole, inner layout unchanged
    │   │                                       (bodies in mpfb/, wear/, hair/, looks/, clothingtextures/)
    │   ├── gear/                               worn gear + wings (UNIT_GEAR_WEAR, misc/wings/)
    │   ├── portraits/  sprites/                2D portraits, 64x64 + character sprites
    ├── loose_sprites/                          the loose files of the old Sprites/ root (mixed: sort in W6)
    ├── world/
    │   ├── hq/{models,textures}/               DOOR HQ kit (was door/)
    │   ├── props/meshy/                        Meshy props (was misc/Meshy_AI_*)
    │   ├── props/meshy_decor/                  the Meshy decor the procs wear (was decor/)
    │   ├── props/misc/                         (was props/)
    │   ├── packs/<maker>_<pack>/               every human-made pack, whole: elbolilloduro (ebd_*),
    │   │                                       elbolilloduro_christmas, _halloween, _metro_psx, ocean, instruments,
    │   │                                       traps, chess, stairs, mcsteeg_castles, ...
    │   ├── nature/                             trees + foliage (was foilage/)
    │   ├── animals/   vehicles/                (vehicles' sound files go to audio/)
    │   ├── terrain/                            terrain textures (was Sprites/terrain/)
    │   └── sky/                                sky sets, night-city backdrops (was skies/, Sprites/night cities files/)
    ├── fx/
    │   ├── spell_props/                        _WPN_MODELS (was weapons/)
    │   ├── flipbooks/  sprites/  projectiles/  (were Sprites/Effects/, Sprites/vfx/, Sprites/projectiles/)
    ├── ui/
    │   ├── icons/  status/  sprites/  fonts/  mapshots/
    │   └── brand/                              the logo video + DOOR logo PNGs
    ├── audio/{music,sfx}/
    ├── opt/                                    generated, content-addressed (unchanged)
    └── World/                                  reserved: the editor's Publish output (EDITOR_PLAN; nothing published yet)

dirtymondo  (private)
├── <his art PNGs>                              untouched
├── inbox/                                      his big hand uploads (docs/notes/inbox.md)
├── source/<same path as the asset>             FBX / .blend / .c4d / .dae / zips / Unity packages + pack licences
└── archive/2026-11/<old key>                   orphans parked here instead of deleted (section 5)
```

The inventory's `proposed_home` column gives the exact new key for every file under these rules. Splitting
`props/meshy/` further by use (room prop vs horizon monument, using the MODEL_LIST section that names each file) is
possible, but that is a per-file move, not a per-folder one. It is an optional later wave (section 6, W6) and only worth
it if mondo wants it.

How this lines up with MODEL_LIST.md (THE model list): the list already groups every model by source and section. After
the move, its paths change, but the list stays the place that says how each model was made. `list-models.js` SOURCES
rows match on bucket paths (`/Assets\/Models\/UAL\d/`, `/charactercreation\/wear\/ewb_/`, ...), so each wave's PR
updates those regexes, reruns `node list-models.js --r2` and commits MODEL_LIST.md + R2_MODEL_FILES.json. The packs
folder names (`<maker>_<pack>`) are the MODEL_LIST pack headings, so a list heading points straight at its folder.

---

## 3. Naming conventions (for moved folders and every new file)

1. **Lower case ASCII only: `a-z 0-9 _ - .`** No spaces, brackets, commas or `(1)` copies. Folders are lower case nouns.
2. **Race folder = the data.js race id, spelled once.** `anunaki` goes into `annunaki`, `sherrif` and `sherriff` into
   the race id, `Homosapien/Female/gunslinger` into the race it draws. The gender folder is always `male` or `female`,
   which retires `RACE_PATH_RULES.capGender`.
3. **The move waves keep file names exactly as they are.** A file name is also an id: data tables, Meshy task stamps
   and MODEL_LIST provenance all use it. Changing the folder and the name in the same step doubles the risk. Renaming
   files is a separate, optional wave (W6) for the 276 broken names only.
4. **New files:** `<subject>[_<variant>].<ext>`, keeping the existing source prefixes (`mhw_`, `ewb_`, `ewm_`, `ewf_`,
   `ebd_`). Meshy downloads keep their Meshy name until wired; MODEL_LIST records the maker.
5. **No version suffixes** (`_v2`, `_final`, `(1)`). To replace a file, overwrite it in place and let the manifest sha
   (`?h=`) bust the cache. That already works today.
6. **Derived files only live in `opt/`** (`.opt.glb`, `.lod1.glb`, `.lod2.glb`), named `<sha8>_<name>`.
7. **Source formats never go in the public bucket.** They go to `dirtymondo:source/`. A pack's licence or readme goes
   with the pack's runtime folder (`packs/<pack>/LICENSE.*`) when the licence asks for it, and to `source/` otherwise.

---

## 4. The central path map (the code change that makes moves cheap)

**Step 1 (no file moves):** one table at the top of `sprites.js`, the first game script index.html loads, so every
later script can read it. This edits an existing file and adds no new game JS file, per CLAUDE.md:

```js
const EW_CDN = 'https://cdn.entropywars.net/';
const EW_ASSET_ROOTS = {          // every bucket folder the game reads, in ONE place
  races:  EW_CDN + 'Assets/Sprites/Races/',      // later: 'Assets/characters/races/'
  anims:  EW_CDN + 'Assets/Models/',
  creator:EW_CDN + 'Assets/Models/charactercreation/',
  terrain:EW_CDN + 'Assets/Sprites/terrain/',
  misc:   EW_CDN + 'Assets/misc/',  weapons: EW_CDN + 'Assets/weapons/',  door: EW_CDN + 'Assets/door/',
  music:  EW_CDN + 'Assets/music/', sfx: EW_CDN + 'Assets/SFX/',  /* ... one row per folder */
};
const EW_ASSET_MOVES = {};        // 'old/prefix/' -> 'new/prefix/' (filled by the flip PRs)
function ewAsset(url) { /* longest-prefix rewrite of a cdn URL through EW_ASSET_MOVES, memoized */ }
```

Every scattered constant (`_S`, `_T`, `_R2_*`, `_CAR_PACK_BASE`, `DOOR_HQ_ASSETS`, `EW_CHARACTER_ASSET_BASE`, audio.js
`_R2_BASE`, ...) becomes a read of `EW_ASSET_ROOTS`. This PR changes no URL: same strings, new source. It is purely
mechanical, so a thread checks it by diffing the evaluated URLs before and after (load-data.js sandbox), and it touches
many files, so it lands in one quiet window (section 7).

**`ewAsset()` is the safety net.** It is called at the load choke points that already exist: three-renderer.js
`_asResolve` / `_asNetUrl` (every GLB and texture through the asset store), audio.js's loader, `_ewCorsBust` (every
crossOrigin image). With it in place, a path that was missed, or that sits in a save file (editor rooms, UI Maker
setups, creator looks), or that arrives later in another thread's PR, still resolves after a flip. CSS `url()` can't
call JS, so each wave's flip PR edits the CSS lines directly (styles-animations.css has 76 of them, styles-base.css 9).

**ASSET_MANIFEST.json moves with the files.** Its `files` keys and `alt` map are keyed by bucket path. If a flip moves
files without rewriting the manifest, every `.opt.glb` swap and `?h=` bust silently stops: nothing breaks, the game just
gets slower and heavier. The bytes don't change, so each flip rewrites the keys through the move table (no re-hash needed).

---

## 5. Orphans — for mondo to OK (nothing is deleted without that)

The full per-file list is every `ORPHAN` and `SOURCE` row of `docs/notes/r2-inventory.tsv`. Grouped:

| group | files | size | proposal |
| --- | --- | --- | --- |
| Stray repo files at the bucket root + `docs/` (tests, playtest/probe/check scripts, .md docs, `server.js`, `d1.js`, bots, `.sql`, `.yml`, `.gitignore`, a 61 MB `assets.js`, `phase6repofiles.zip`, stale `index.html`) | 380 | 79 MB | archive, **first** (it also takes the server code off the public CDN) |
| Per-character Meshy clips that no RACE_MODELS_3D entry names (the shared library replaced them; 56 loose in `Assets/Models/`, the rest in race folders) | 202 | 1.66 GB | archive |
| Models MODEL_LIST §13 marks "on R2, the game does not load it" (unused Meshy props in `misc/` + `door/models/`, retired race rigs such as the old catgirl/Homosapien sniper/raider/kaiju outputs, `eagle.fbx/.glb` originals, 31 unused tree OBJs, 2 decor pieces) | 93 | 447 MB | archive (MODEL_LIST §13 keeps listing them, so THE PACK-FIRST RULE can still find them) |
| THE LAND tiles + `land.json` + `sea.bin` + `land-map.png` (the open world cut 2026-09-29, ZONES_PLAN Z0) | 427 | 46 MB | archive |
| `opt/` copies of originals nothing loads | 34 | 68 MB | archive with their originals |
| Other unreferenced files: `MakeHumanEyeTexturePack.unitypackage` (35 MB), 7 pre-MPFB `mhw_shoes01-06` / `mhw_fedora01` GLBs, 16 car sound effects (the game has no SFX by rule), night-city `.ase` files + 2 PDFs, Godot `.import` files beside the pyramid, `road texture.dds`, a duplicate `anunaki_male.png` | 40 | 39 MB | archive. The PDFs are the pack's licence, so they go to `source/` with the pack, not to archive. |
| Empty "folder" marker keys (0 bytes) | 104 | 0 | delete when their folder moves |
| SOURCE: FBX / .blend / .dae / .c4d / .3ds / zips nothing loads | 132 | 98 MB | move to `dirtymondo:source/` |

Total off the public CDN: about **2.4 GB of 9.4 GB**. The proposal is **archive, not delete**: copy to
`dirtymondo:archive/2026-11/<old key>`, verify the sha256, remove from `ewmusicsfx`. Anything can come back with one
copy. A real delete of the archive happens later, only if mondo asks for it.

### Missing files (the code names them, R2 doesn't have them)

| path | named by | effect today |
| --- | --- | --- |
| `Assets/Sprites/Races/Werewolf/female/werewolf_day.png` | sprites.js:401 `WEREWOLF_DAY_SPRITE_FEMALE` | the female werewolf's day sprite 404s (2D fallback paths only) |
| `Assets/Sprites/terrain/mountain_2.png` | sprites.js:6259 terrain table | the `mountain_2` terrain 2D texture 404s |
| `Assets/Sprites/terrain/objects/ruins.png` | sprites.js terrain object table | the `ruins` 2D object sprite 404s |
| `Assets/Sprites/Status/jammed.png`, `drowning.png` | data.js:12999 / 13013 | known; the status shows its emoji instead |

Not missing, though they look it: the classic Meshy creator bodies (`..._rigged.glb`) are served by server.js
`/api/character-model/` from the repo, and `Assets/World/` is the editor's Publish target, which has never been
published. Every ASSET_MANIFEST entry and `alt` copy exists on R2.

---

## 6. The migration — copy first, flip in one PR, keep the old keys

A new repo-only tool, `r2-layout.js` (dev tooling at the repo root, like sync-zip.js; it uses the same proxied curl
calls, and the token is never in a file), reads `r2-inventory.tsv` and has four modes:

- `--inventory`: relist both buckets and rewrite the TSV.
- `--copy <wave>`: copy each LIVE / FALLBACK / PROBABLY-LIVE key of the wave to its new key. R2's REST API has no
  server-side copy, so this is a GET + PUT through the proxy. Each copy is verified by size + sha256. It is idempotent:
  a key that is already there and matches gets skipped.
- `--verify <wave>`: fetch every new key from `cdn.entropywars.net` with a random query and compare its sha256 to the
  old key.
- `--archive <wave>`: (only after mondo's OK) copy the wave's old keys to `dirtymondo:archive/`, verify, then remove
  them from `ewmusicsfx`.

**Step 0, the real-load check (before any deletion).** The static scan's orphans get confirmed by what the game
actually requests. The browser already records every fetched URL: in a normal session, set
`performance.setResourceTimingBufferSize(100000)` early (a `?ewassettrace=1` flag in index.html can do it), play, and
dump `performance.getEntriesByType('resource')` filtered to `cdn.entropywars.net`. mondo can do this while he plays, or
a thread can, with his OK only, because of the no-playtest rule. Any "orphan" that shows up in a trace goes back to LIVE.

**The waves**, each its own short PR, ordered by risk from lowest to highest:

| wave | folders | code touched |
| --- | --- | --- |
| W0 | root junk + `docs/` + THE LAND → archive (needs mondo's OK; no code change) | none |
| W1 | the central path map + `ewAsset()` (no files move) | ~45 constants across sprites, data, three-renderer, three-vfx-effects, hud, battle, editor, audio, ui |
| W2 | audio + ui (`music`, `SFX`, `fonts`, `Icons`, `Sprites/Status`, `Sprites/ui`, `MapShots`, logos) | roots table, CSS lines, audio.js |
| W3 | fx (`weapons`, `Sprites/Effects`, `Sprites/vfx`, `Sprites/projectiles`) | roots table |
| W4 | world (`door`, `decor`, `props`, `misc`, every pack, `foilage`, `skies`, `Sprites/terrain`, `vehicles`, `animals`) | roots table, data.js catalogue `base:` keys, list-models.js SOURCES |
| W5 | characters (`Sprites/Races`, `Models`, `Models/charactercreation`, portraits, 2D sprites) | roots table, `RACE_PATH_RULES` (lower case), docs/notes/inbox.md, the CLAUDE.md 3D-character recipe |
| W6 (optional) | rename the 276 broken file names; split `props/meshy/` by use | per-file move entries |

**Each wave, in order:**

1. `node r2-layout.js --copy W<n>`, then `--verify W<n>`. The old keys are untouched, so the live game can't notice.
2. **The flip PR**, which is small: the `EW_ASSET_ROOTS` rows for the wave point at the new folders,
   `EW_ASSET_MOVES` gets the wave's old→new prefixes, the CSS lines change, ASSET_MANIFEST.json keys + `alt` are
   rewritten through the move table, the list-models.js SOURCES regexes are updated and `node list-models.js --r2`
   is rerun (MODEL_LIST.md + R2_MODEL_FILES.json), and the matching docs/notes lines change. The PR also bumps
   **`?v=` in index.html** (RULE #1b) and gets `node --check` on every edited JS file.
3. Right before merging: rerun `--copy W<n>`, which picks up anything another thread uploaded to an old folder during
   the window. Then merge main in, merge the PR, and run `node sync-zip.js --upload` (the changed code files +
   ASSET_MANIFEST.json).
4. **The old keys stay.** A cached old index.html, a missed literal or an old save still finds its file. mondo checks
   the game on his side (Firefox / M1 / WebGPU is enough).
5. Only after he says the wave is good (a week of normal play, say) does `--archive W<n>` run on the old keys, and only
   with his OK.

Cost: copying 7 GB to new keys is about 4,800 PUTs and a temporary ~16 GB stored for a week. On R2 that is well under
$1 total (R2 has no egress fees). Each player re-downloads the files they use once after each flip, because the browser
asset store (`ew-assets-v1`) is keyed by URL. Expect one slower first load per wave, which matters most for the friend
on the weak Chrome PC, so waves shouldn't land right before a session with him. Nothing in IndexedDB is deleted.

---

## 7. Staying out of the way of other threads

- **W1 is the only broad edit.** It touches the base constants in ~10 files, so it goes in one quiet window, and it is
  mechanical enough to redo on a fresh main if it conflicts. The coordinator checks that no other thread is in the
  middle of a big edit to sprites.js / three-renderer.js / data.js first. After W1, every flip PR only changes the roots
  table, the CSS lines, the manifest and the notes, so it hardly ever conflicts.
- **Old folders keep working the whole time.** A thread that uploads to an old folder during a wave is fine: step 3's
  re-copy picks the file up. After the flip, `ewAsset()` rewrites old paths in its code. `sync-zip.js --put` should
  also learn the move table: a `--put` to an old prefix after a flip warns and writes the new key instead.
- **One wave at a time, one owner thread.** The coordinator posts "R2 wave Wn in progress: upload as normal, don't hand
  edit Assets paths in the roots table" when a wave starts and clears it when the flip merges. Waves don't run while an
  upload-heavy thread is going (an inbox sort, a Meshy batch, a pack import); the coordinator checks the thread list.
- **The usual merge rule still applies:** `git fetch origin main` and merge it before every merge, resolve conflicts by
  hand keeping both sides, and rebuild the manifest if main changed it meanwhile.
- **The docs move with the code.** docs/notes/inbox.md's routing table, the CLAUDE.md "Wiring up a 3D character"
  recipe, MODEL_LIST and team memory get the new folder names in the same flip PR. Otherwise the next thread uploads to
  the old place out of habit.

---

## 8. What mondo decides

1. Go / no-go on the target layout (section 2). Any folder he wants named differently, now is the time.
2. OK to archive the orphan groups in section 5. The root-junk + THE LAND group is the safe first step.
3. Whether W6 (renaming the 276 broken file names, splitting the Meshy props by use) is worth doing at all.

Nothing in this plan changes a game rule or how anything looks or plays. It only changes where files live and how the
code finds them.

---

## 9. THE LOG (mondo 11-04 21:47: "sounds like a good plan, go ahead")

- **W0 done 11-04 ~22:10.** 807 keys (124 MB) left the public bucket: 366 stray repo files at the root (server.js, d1.js,
  bots, tests, .md docs, .sql, .yml, assets.js, the zip, the stale index.html), `docs/` (13) and THE LAND (427, incl. folder
  markers). Each was copied to `dirtymondo:archive/2026-11/<same key>`, read back, sha256-matched, then removed from
  `ewmusicsfx` (`node r2-layout.js --archive`). Nothing is deleted for good: copy a key back to undo.
- **W1 (this PR):** sprites.js THE ASSET PATH MAP (`EW_ASSET_MOVES` empty, `ewAsset()` / `ewAssetKey()`, the safety net at
  fetch / XHR / img / audio / source / setAttribute — only installed once a row exists), three-renderer.js `_asKey` reads
  moved keys, sync-zip.js `--put` follows the moves, list-models.js shows moved paths (SOURCES rows match old or new),
  `r2-layout.js` + `r2-layout.json` (the waves). No URL changes yet.
- Wave rows (r2-layout.json): W2 audio + ui, W3 fx, W4 world, W5 characters. Race folders in W5 are lower-cased with the
  spelling duplicates joined (`anunaki` → `annunaki`, `sherrif`/`sherriff` → `sheriff`); other race folder names stay as
  they are (renaming them to race ids is W6, optional). `Assets/opt/` and the code files don't move.
- Before archiving any OLD key of a flipped wave: mondo has played on it, and `window.EW_ASSET_MOVE_HITS` /
  `EW_ASSET_MOVE_LOG` on his page show what still asks for the old paths.
- **W2 + W3 flipped 11-04 (PR after #895):** copied 262 + 197 keys (446 MB, each sha256-checked live), sprites.js
  EW_ASSET_MOVES got the 14 rows, `node r2-layout.js --rewrite W2 W3` rewrote 172 literal paths (index.html fonts/logos,
  styles-animations.css projectiles, data.js status/icons/projectiles, the spell props), audio.js `${_R2_BASE}/audio/...`,
  three-vfx.js flipbooks and the two UI cursors by hand; ASSET_MANIFEST.json rewritten (30 entries); MODEL_LIST rerun.
  Old keys kept.
- **W4 flipped 11-04:** copied 1,841 keys (2.3 GB, sha256-checked live). 22 rows; `--rewrite W4` rewrote 200 literal paths;
  by hand: sprites.js `_T`, data.js `DOOR_HQ_ASSETS` + `DOOR_HQ.assets`, the crow/rabbit atlas URL modifier and
  `_instrStem` regexes in three-renderer.js. LEFT AS WRITTEN on purpose (the code adds a name that may land in a sub-row):
  the `Assets/misc/` bases (`_R2_MISC`, `_HQ_PACK_WEAR_BASE`, data.js `folders.misc`, editor.js pack buildings,
  three-vfx-effects.js `base === 'misc'`) and `Assets/vehicles/` (`_CAR_PACK_BASE`, data.js `folders`): sprites.js
  `ewAsset` moves each full URL at fetch time, so **the W4 rows must stay in EW_ASSET_MOVES for good** (they are the alias
  table for those bases). ASSET_MANIFEST.json 426 entries rewritten; MODEL_LIST + MODEL_LIST_EXTRA paths updated.
  r2-layout.js fix: a key belongs to the wave whose row wins over ALL waves (15 stray `world/vehicles/Sound effects/`
  copies made before the fix were deleted; those files are W2's `audio/sfx/vehicles/`).
- **W5 flipped 11-04:** copied 2,408 keys (5.4 GB, sha256-checked live). 140 rows: every race folder lower-cased
  (`Homosapien/Female/` → `characters/races/homosapien/female/`, `anunaki` → `annunaki`, `sherrif`/`sherriff` → `sheriff`),
  `Models/charactercreation/` → `characters/creator/` (inner layout unchanged; the repo folder is still `charactercreation/`),
  `Models/` → `characters/animations/`, portraits / 64x64 / character_sprites → `characters/...`. The 214 loose files at
  the old `Sprites/` root (paper-doll pieces, icons, rings, rope, f22 ...) went to **`Assets/loose_sprites/`**, not
  "equipment" as §2 first said: they are mixed, sorting them is W6. By hand: `EW_CHARACTER_ASSET_BASE`, `_R2_TETHER`,
  hud.js FACE_AIMS lookup (`_faceAimFor`, old or moved path). LEFT AS WRITTEN: `_S` (`.../Assets/Sprites`) and everything
  built on it (`_mk3d`/`_mkUAL`, RACE_PATH_RULES with its capitalised genders, the 2D sprite tables), three-vfx.js `_R2`:
  the W5 rows are their permanent alias table. The safety net now also rewrites inline style backgrounds.
  ASSET_MANIFEST.json 1,100 entries rewritten; MODEL_LIST tally unchanged.

### What is left
- **Old keys:** every moved file still exists at its old key too (~8.5 GB). They are NOT needed by the game any more (the
  code and the alias rows ask for the new keys), but they stay until mondo has played on the new layout. Then, with his
  OK: `--archive` the old keys wave by wave (copy to `dirtymondo:archive/`, then remove), after a trace
  (`performance.getEntriesByType('resource')`) shows nothing still fetching an old path — the one thing the safety net
  can't catch is an innerHTML string with `style="background:url(<old path>)"`.
- The orphan groups of §5 other than W0 (unused Meshy clips, MODEL_LIST §13 "not loaded" models, opt copies of unused
  files, SOURCE files) were copied to their new homes like everything else; archiving them waits for the same OK.
- **The EW_ASSET_MOVES rows stay for good** (they are the alias table for base constants like `_S` and `_R2_MISC`).
  New files go straight to the new folders (sync-zip.js `--put` moves an old-folder key itself).
- W6 (optional): sort `loose_sprites/`, split `world/props/meshy/` by use, rename the 276 broken file names.
