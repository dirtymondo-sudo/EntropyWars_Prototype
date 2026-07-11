# CLAUDE.md

Entropy Wars — a browser Tactical-JRPG PvP prototype. `server.js` (Express +
socket.io) is only matchmaking/relay; ALL gameplay logic is client-side in
`index.html` + ~35 scripts loaded from a Cloudflare R2 bucket (custom domain
`cdn.entropywars.net`, brotli + long-cache edge) and CDNs.

## RULE #1 — DELIVERY WORKFLOW (do this, nothing else)
The game loads its scripts from the R2 bucket, NOT from the repo and NOT from a
local server. So Claude CANNOT make changes go live. The ONLY correct workflow:
1. Edit the ACTUAL existing files in the repo in place (never create new .js
   files, never split logic into a new module — work with what's already there).
2. Hand the user the COMPLETE edited file(s) in the chat (SendUserFile).
3. The user uploads them to the R2 bucket (and manually syncs the repo so future
   sessions start from the latest).
DO NOT `git commit`, DO NOT `git push` (it 403s anyway), DO NOT generate patches/
diffs. The deliverable is always the full edited file, produced in chat.

### RULE #1c — DO NOT PLAYTEST UNLESS EXPLICITLY ASKED
Playtesting (Playwright runs, browser automation, driving the game) burns a LOT
of the user's tokens and they are fully capable of testing themselves. After
making changes: syntax-check the edited JS (`node --check <file>`) and hand the
files over — that's it. Only run the playtest harness / any browser automation
when the user explicitly requests it (e.g. "playtest <mode>") or when a change
is genuinely impossible to validate any other way AND the user has agreed.

### RULE #1b — CACHE-BUSTING (MANDATORY on EVERY R2 file delivery)
Assets are served with immutable long-cache headers, so an uploaded file does
NOTHING until `index.html`'s version token changes — players keep the cached old
copy otherwise. Therefore: **whenever you deliver ANY R2-hosted file (.js/.css/
asset) in chat, you MUST also bump the `?v=` token in `index.html` and deliver
the updated `index.html` in the SAME message.** No exceptions — one R2 file
changed ⇒ ship a fresh index.html too.
- Bump = one global find/replace of the current token to a new unique one:
  `sed -i 's/?v=<OLD>/?v=<NEW>/g' index.html`  (e.g. `20260705a` → `20260705b`,
  or a fresh date). The token is shared across every URL, so one bump
  invalidates everything — that's intended.
- `index.html` is served by Render (NOT R2); the user redeploys it to Render.
  It must stay revalidated (short/no cache), so the new token is seen immediately.
- Asset URLs *inside* the JS (sprites/textures/audio/GLB in sprites.js `_S`,
  audio.js `_R2_BASE`, inline data.js/three-renderer.js URLs) are NOT yet
  `?v=`-tagged. If you change an asset in place, either rename its file (new path
  = auto cache-bust) or tell the user, since the token bump won't cover it.

## Most common request: "playtest <mode>"
The user wants Claude to **actually play Player 1 against the CPU** (NOT auto-sim /
dev-sim — they can do that themselves) and report pain points: unresponsive
clicks, getting stuck, confusing UI, bad pacing, plus the bug classes in
PLAYTEST_NOTES.md. There is a ready-made harness — don't rebuild it:

```bash
npm install && npm start            # server on :3000 (background it)
# first time only:
npm install playwright && npx playwright install chromium --with-deps
node playtest.js tdm                # arena | tdm | ffa | domination | hotspot | ctf
```

It drives the real menus → starts a VS-CPU match → plays P1 with real tactics and
spells → flags bugs → writes screenshots + combat log + `<mode>-flags.json` to
`shots/`. Read the console output and the artifacts, then summarize findings.

**Read `PLAYTEST_NOTES.md` first** — it has the full menu flow, the `window.GAME`
API (blitz turn model, move/attack/spell calls), and prior findings. That file is
the anti-"start over" memory; keep it updated when you learn something new.

## Wiring up a 3D character (frequent request)
Units can render as rigged Meshy GLB models instead of sprites. Since
2026-07-10 animations come from SHARED libraries on R2 (`Assets/Models/`):
Quaternius `UAL1_Standard.glb` + `UAL2_Standard.glb` (non-root-motion), and
since 2026-07-11 `MAL1_Sniper.glb` — the 20 Meshy animations exported ONCE
from the male sniper, consolidated offline into a 1.4MB animation-only GLB.
three-renderer.js retargets all of them onto every Meshy rig at load, so
per-character animation exports are no longer needed; Meshy-sourced
libraries retarget exactly like UAL ones (_libEnsureSrc auto-detects rig
naming). To grow the library: download animations for ONE character, then
consolidate (strip meshes/textures, merge clips named by file stem — see
PLAYTEST_NOTES "MAL library"). Retargeting
keeps each character's OWN rest posture (hunched beasts stay hunched; only
arm bind angles are standardized), and per-character clip flavor is one
`lib: {slot: {clip, lib, ts}}` opt (see UAL_SLOTS + PLAYTEST_NOTES). Recipe:
1. The user uploads the rigged model `..._Character_output.glb` (or any
   `_withSkin` export) to the race's R2 sprite folder. The
   `_generate`/`_texture` stage GLBs are BONELESS — never use them.
2. Add ONE line in sprites.js RACE_MODELS_3D:
   `'<race>': { male: _mkUAL('<folder>', '<meshy file prefix>', { heightRatio: 1.0 }) }`
   — done. Slot→clip map + timescales live in `UAL_SLOTS` (sprites.js);
   heightRatio is relative to the male fortune teller (=1.0). The renderer
   measures true SKINNED bounds for scaling — don't compensate manually.
3. Optional 128×128 `portrait.png` in the same folder + a `RACE_PORTRAITS`
   entry → shows in HUD panels/turn clock instead of the map sprite.
4. Verify a GLB before wiring (rigged? boneless?): parse its JSON chunk with a
   node script (see PLAYTEST_NOTES.md "Rigged 3D unit models").
5. Deliverable: hand the edited sprites.js back via chat (RULE #1).
Legacy path: per-character Meshy `..._Animation_<Name>_withSkin.glb` clips
(must be exported FROM that character — direct cross-character playback warps
the mesh) still wire via `_mk3d(folder, prefix, {slot: Clip})` and are the
automatic fallback when the library fails or a def sets `noAnimLib: true`.
Kill-switches (console): `window.EW_DISABLE_3D_UNITS = true` (all 3D),
`window.EW_DISABLE_ANIM_LIB = true` (library → per-character Meshy clips).

## Key facts
- Server: `npm start` → http://localhost:3000.
- External assets load behind TLS inspection → Playwright needs
  `ignoreHTTPSErrors:true` and `--use-gl=swiftshader` (already in playtest.js).
- Turn model is blitz (`GAME.state._blitzActiveUnitId`); the engine auto-plays AI
  (P2) units and waits when a local P1 unit is active.
- TDM/FFA score is `state.matchKills`, NOT `state.matchScores`.

## Conventions
- Don't run auto-sim/dev-sim for playtesting — play P1 manually.
- `node_modules/`, `package-lock.json`, `shots/` are gitignored; commit code + docs.
- Dev branch: `claude/great-cray-5OS8X`. NOTE: in this environment BOTH `git push`
  and the GitHub API/MCP return 403 for the agent — Claude cannot write to the repo.
  To persist new files, hand them to the user (SendUserFile) to upload via GitHub
  manually. Don't waste time retrying pushes.
