# LAUNCH_READINESS.md — Entropy Wars: browser parity, anti-cheat, and shipping plan

Written 2026-07-27. This is both a **changelog of what was changed in this pass**
and the **honest engineering answers** to: "why does Safari look broken", "why can
people edit my page", "how do I make it uncheatable", "can someone steal my
Claude account through the game", and "what's left before itch.io / Steam".
Hand this file to the next chat session — the TODO list at the bottom is
written to be executed.

---

## 1. What was changed in this pass (4 files)

| File | Change |
|---|---|
| `index.html` | (a) `structuredClone` polyfill for Safari < 15.4 (battle.js/state.js call it during match setup — on old Safari that threw and killed setup). (b) New diagnostics collector: open the game with `?ewdiag=1` (or run `EW_SHOW_DIAG()` in the console) → overlay with GPU/WebGL capability probe, uncaught JS errors with file:line, THREE shader/texture errors, failed CDN downloads, and a COPY REPORT button. (c) `?v=` token bumped `20260727f-replay` → `20260727g-compat`; `_EW_BUILD_TOKEN` now matches the `?v=` token. |
| `three-renderer.js` | Removed the hand-written `precision mediump float;` from the 3 light-shaft/pool/mote fragment shaders. ShaderMaterial already gets three.js's guarded precision prefix (highp where supported, mediump fallback). The manual override was fp32 on desktop but **real fp16 on Apple GPUs**, where session-time uniforms lose `sin()` precision within minutes — a classic "fine in Chrome, wrong in Safari/iOS" bug. |
| `server.js` | (a) **Stopped serving the whole repo directory.** `express.static(__dirname)` was publicly exposing `server.js` source (all the anti-cheat guard logic), every internal doc (`PLAYTEST_NOTES.md` etc.), potentially `.git/`, and `./replays/` (per-match logs). Production now serves ONLY `/` → `index.html` (with `Cache-Control: no-cache` so `?v=` bumps take effect immediately). Set `EW_DEV_STATIC=1` locally if you ever want the old behavior. (b) `x-powered-by` header disabled. (c) New optional `EW_ALLOWED_ORIGINS` env var (comma-separated) to lock the socket layer to your real domain(s); unset = `*` (unchanged). |
| `LAUNCH_READINESS.md` | This file. |

Audits performed with **no changes needed**:
- **Secret scan**: no API keys, tokens, or credentials anywhere in client code.
  All secrets (`CF_API_TOKEN`, `BOT_ADMIN_SECRET`, D1 IDs) are server-side env
  vars only. Nothing Anthropic/Claude-related exists anywhere in the codebase.
- **XSS audit**: every place a remote player's string is rendered (usernames,
  opponent name in battle HUD, community map names/descriptions, leaderboard)
  uses React `createElement` or `textContent` — auto-escaped, no `innerHTML`
  /`insertAdjacentHTML`/`document.write` sinks with network data anywhere.
  Usernames are additionally server-locked to `[A-Za-z0-9_]{2,16}`.
- **Modern-syntax scan**: none of the ~35 client scripts use post-ES2020 syntax
  that would hard-crash older Safari at parse time (lookbehind regex, class
  static blocks, `#private`, `??=`, `.at()`, `findLast`, `toSorted`, etc.).
  The only runtime-API gap found was `structuredClone` — now polyfilled.

Deployment: upload `three-renderer.js` to R2, redeploy `index.html` + `server.js`
on Render. The `?v=` bump is already done.

---

## 2. "Why does Safari render black chunks / different emojis?"

Two separate problems.

### 2a. Rendering differences (black terrain chunks)
Browsers don't share a graphics stack: Chrome/Edge use ANGLE→(D3D/Metal/GL),
Safari uses WebKit→Metal, and GPU drivers differ per device. 99% of a WebGL
game looks identical everywhere; the 1% that differs is always one of:

1. **Shader precision** — on Apple GPUs `mediump` is genuinely 16-bit
   (max representable value 65504, ~3 decimal digits). Desktop GPUs silently
   promote it to 32-bit, so the bug only appears on Apple hardware. One real
   instance was found and fixed this pass (see §1). Any *future* hand-written
   shader must not declare its own `precision`.
2. **Shader compile failures** — WebKit's GLSL translator is stricter; a shader
   that compiles on ANGLE can fail on WebKit, and three.js then renders that
   material as nothing/black. These print `THREE.WebGLProgram: shader error` to
   the console — which players never see.
3. **Texture limits/decoding** — `MAX_TEXTURE_SIZE` differs per GPU; oversized
   canvases silently render black on iOS.

**This is why the `?ewdiag=1` overlay was added.** Next time anyone sees black
chunks in Safari: open the same URL with `?ewdiag=1`, tap COPY REPORT, paste it
into a chat session. The report contains exactly which shader failed / which
texture didn't load / which script died — turning "Safari looks broken" from a
guessing game into a 5-minute fix. **Do this before attempting any further
blind Safari fixes.**

### 2b. Emojis look different per device
Emoji are **font glyphs**. Apple devices draw Apple's emoji font, Windows draws
Segoe UI Emoji, Android draws Noto. The game uses emoji extensively as UI/game
icons, so the game genuinely looks different per OS.

- The tempting fix (ship "Noto Color Emoji" webfont) **does not work for
  Safari**: Google serves it in COLRv1 format, which Safari cannot render —
  Safari would keep using Apple emoji. Rejected this pass (2MB download that
  doesn't fix the one browser being complained about).
- The real fix, and what Steam needs anyway: **stop rendering emoji as text.**
  Either run [Twemoji](https://github.com/jdecked/twemoji) over UI text so every
  emoji becomes an `<img>` (identical on every platform), or — better for a
  commercial game — replace UI-critical emoji with the game's own sprite icons.
  Note some emoji are drawn into **canvas** via `fillText` (minimap, floating
  text, generated textures); CSS/Twemoji can't reach those — they need
  `ctx.drawImage` with an icon atlas instead.
- This is a deliberate art/UI pass across `map.js`/`hud.js`/`ui.js`/`battle.js`.
  Sized as a TODO below, not something to sneak into a bugfix pass.

For a wrapped Steam build (Electron), this problem mostly disappears anyway:
Electron = Chromium on every OS, one consistent emoji font can be bundled.

---

## 3. "Why can people edit my page when Amazon's can't be edited?"

**Amazon's page absolutely can be edited.** Open DevTools on amazon.com, change
a price tag to $0, delete the nav bar — it works. Same on any government site.
What you're editing is *your own browser's copy* of the page. The server, and
every other visitor, are untouched. When you click "buy", Amazon's **server**
recomputes the real price and ignores whatever your browser claimed.

That is the entire model of web security, and the answer to "how do I stop
client editing" is: **you don't — you make it not matter.** Amazon doesn't
protect the page; it protects the *server*. Anything the player's machine runs
(browser page, Steam exe, console game) is modifiable by its owner — Steam DRM,
obfuscation, and anti-cheat raise effort, they never achieve impossibility.
AAA studios with kernel anti-cheat (Valorant's Vanguard) still have cheaters;
their real weapons are server authority + detection + bans.

So the security question for Entropy Wars is never "can a player modify the
game" (yes, always, forever) but "**what can a modified client actually
affect?**" — which is the next section.

---

## 4. Cheating: what's already protected, what isn't

### What a cheater can touch today, by mode
- **VS CPU / local modes**: a player can edit anything — and it affects only
  their own single-player experience. This is identical to using cheat codes in
  an offline game. **Not a real problem; do not spend effort here.**
- **Online, as GUEST**: well protected. The server enforces (verified in
  `server.js` this pass): guests can only send `game-action` (never
  `state-sync`), out-of-turn actions are dropped, `forfeit`/`toggleAuto` are
  pinned to the sender, ranked parties are clamped to team size and checked
  against server-side unit ownership in D1, and event rates are limited.
- **Online, as HOST**: **this is the real gap.** The architecture is
  host-authoritative — the host's browser runs the entire engine and the guest
  mirrors it. A modified host client can give itself extra damage/AP/vision and
  the server can't tell, because the server only relays state, it doesn't
  simulate the rules. Existing mitigations: ELO is derived from the mirrored
  state stream (not host claims), contradicting `ranked-result` claims are
  dropped, disconnect-forfeits are server-decided, and **full replays of every
  match are recorded server-side** (`./replays/`) — no longer publicly
  downloadable after this pass.

### The honest ladder of fixes (pick per launch stage)
1. **itch.io demo (now)**: current protections are adequate. Optionally ship
   the demo as VS-CPU only — with no online play there is *nothing* to cheat
   that matters. Minify/obfuscate the JS if you like (it's a speed bump, not a
   wall — treat it as tidiness, not security).
2. **Casual online (soon)**: add a **guest-side checksum**: guest hashes the
   key state fields each round and sends it; server stores both hashes in the
   replay. Divergence = one side modified. Doesn't *prevent* host cheating but
   makes it **detectable and provable**, enabling reports + bans. Cheap to
   build on the existing replay plumbing.
3. **Ranked at scale (later)**: the only *real* fix is **server-authoritative
   simulation** — the engine runs on the server (the engine is plain JS; the
   heavy lift is decoupling it from DOM/renderer so Node can run it), clients
   send only inputs. This is the standard endpoint for competitive PvP and the
   thing that makes cheating structurally impossible-in-the-part-that-matters.
   Everything before it is mitigation, and that's normal — ship with
   mitigations, build this when ranked integrity starts paying the bills.

### Console kill-switches
`window.EW_DISABLE_3D_UNITS` etc. are client-local render toggles — they don't
touch game state and relay nothing. Harmless; leave them.

---

## 5. "Can someone steal my Claude account through the game?"

**No.** Verified this pass:
- There are no Anthropic/Claude/OpenAI keys, no AI-related code, and no secrets
  of any kind in any client-served file. The horror stories are about people
  who shipped `.env` files or hardcoded API keys inside their client bundle;
  this codebase does not do that. Your Claude account is connected to your
  *development workflow*, not to the deployed game — there is no path from a
  player's browser to it.
- Server secrets (`CF_API_TOKEN` for D1, `BOT_ADMIN_SECRET`) live only in
  Render env vars. After this pass the server no longer serves its own source
  code, docs, or `.git` to the public — keep it that way.

Player-account security (the game's own accounts), current honest state:
- Auth is a **bearer token minted at register — there is no password and no
  recovery**. The token in the player's localStorage IS the account. XSS audit
  came back clean (that's the attack that steals localStorage), but tokens are
  stored **in plaintext in D1** — a DB leak = every account stolen. TODO below:
  store only a hash of the token, add rate limiting on `/api/login` and
  `/api/register`, and eventually offer optional email/password or OAuth for
  recovery before real money (unit purchases) rides on accounts.

---

## 6. Preparing for itch.io (demo) and Steam (wrapped build)

### itch.io — smallest step, do this first
itch.io hosts HTML5 games in an iframe; the current build already is one.
Checklist:
1. Decide demo scope — **recommended: VS-CPU only** (hide online menus behind a
   build flag). Kills all cheating stakes and the server dependency in one move.
2. itch can host the files itself (zip upload) or you keep loading from R2 +
   Render. Zip upload requires the asset-bundling work from the Steam section
   below — or keep the current CDN setup and just point itch at your URL.
3. Test in the itch iframe early: fullscreen button, pointer lock, audio
   autoplay policies (audio.js already resumes the AudioContext on gesture).

### Steam — the wrapped build
Wrap in **Electron** (Chromium + Node, the standard: Vampire Survivors shipped
this way) or Tauri (smaller, but uses each OS's native webview — on Windows
that's Edge WebView2, fine; but it reintroduces engine variance, so Electron is
the safer pick for "looks identical everywhere", and it makes the Safari class
of bugs irrelevant since every player runs the same Chromium).

The blocking work item is **self-containment**. The game currently cannot run
offline — hard external dependencies found this pass:
- ~35 game scripts + styles from `cdn.entropywars.net` (R2)
- three.js r128 + 8 example modules from cdnjs/jsdelivr
- socket.io client from cdn.socket.io
- React/ReactDOM from R2
- 7 font families from Google Fonts
- All sprites/textures/audio/GLB models from R2 (`sprites.js _S`, `audio.js
  _R2_BASE`, inline URLs in `data.js`/`three-renderer.js`)

Needed: a build script that downloads every asset into a local `dist/` tree and
rewrites the URL bases (they're already mostly centralized: `_S`, `_R2_BASE`,
and the `<script>`/`<link>` tags in index.html). That same `dist/` is also what
a zip-upload itch build wants — build it once, use it for both.

Steam specifics for later: Steamworks SDK via `steamworks.js` (achievements,
overlay), offline-first boot (menus must not hang when Render is unreachable),
code signing for the installer.

---

## 7. Prioritized TODO for the next session

**P0 — before any public link goes out**
1. Redeploy the 4 changed files (R2: `three-renderer.js`; Render: `index.html`,
   `server.js`).
2. Get a `?ewdiag=1` report from the actual Safari device that shows black
   terrain; fix the specific shader/texture it names. (Local approximation:
   `npx playwright install webkit` and run the playtest harness with a WebKit
   browser instance — engine-accurate for JS/CSS, not GPU-identical.)
3. Set `EW_ALLOWED_ORIGINS` on Render to the real game origin(s).
4. Decide demo scope for itch.io (recommended: VS-CPU only build flag).

**P1 — before accounts matter (unit purchases, ranked seasons)**
5. Hash auth tokens at rest in D1 (store `sha256(token)`, compare on login);
   add rate limiting to `/api/register`, `/api/login`, `/api/maps` (an
   `express-rate-limit` dependency or the existing `allowEvent` pattern).
6. Guest-side round checksum → replay stream (host-cheat *detection*, §4.2).
7. Emoji → image pass: Twemoji or first-party icons for DOM text; icon atlas
   for canvas-drawn emoji (`fillText` sites in map.js/hud.js/battle.js).

**P2 — Steam runway**
8. `dist/` bundling script: localize all CDN/R2 dependencies, rewrite `_S` /
   `_R2_BASE` / index.html tags. Verify the game boots with network disabled.
9. Electron shell + Steamworks integration; bundle one emoji/icon set.
10. Server-authoritative simulation for ranked (big; only when ranked traffic
    justifies it — see §4.3).

**Explicitly not worth doing** (so the next chat doesn't burn tokens on them):
- "Preventing" DevTools/page editing — impossible everywhere, see §3.
- Heavy JS obfuscation as a security measure — cosmetic only.
- Anti-cheat for VS-CPU/local modes — players can only cheat themselves.
