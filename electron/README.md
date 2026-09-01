# Entropy Wars — Electron / Steam shell (Phase 6)

Repo tooling only (nothing here uploads to R2). Implements ACHIEVEMENTS_PLAN.md
§8: the game runs unmodified inside Electron, and the shell injects the
4-function `window.SteamGlue` surface that battle.js pushes achievements and
stats through.

## Run it

```bash
cd electron
npm install          # electron + (optionally) steamworks.js
npm start
```

- With the Steam client running and `steam_appid.txt` present (480 = Valve's
  Spacewar test app), achievements/stats calls go to Steam for real — Spacewar
  won't have our schema configured, so expect silent no-ops per call, but the
  init/glue path is exercised end-to-end.
- Without Steam (or with `steamworks.js` not installed — it's an
  optionalDependency), the shell still runs and the game behaves exactly like
  the browser build (`SteamGlue.available === false`).

What the window loads, in priority order:
1. `EW_APP_URL` env var — point at `http://localhost:3000` during development.
2. `../dist/index.html` if it exists — the self-contained bundle from the
   LAUNCH_READINESS §6 asset-localization track (that track is separate work;
   until it lands, option 3 is the interim).
3. The live site.

## The pieces

| file | role |
|---|---|
| `main.js` | window + IPC host; owns the binding lifecycle |
| `preload.js` | exposes `window.SteamGlue = { available, setStat, setAchievement, storeStats }` |
| `steam.js` | **the swappable binding** — currently steamworks.js; §8.1 says the swap to steamworks-ffi-node is an afternoon: rewrite only `init()` here |
| `steam_appid.txt` | dev-only app id (replace with the real one at release; do NOT ship it in the final build — Steam supplies the id at launch) |

Game-side consumers (already live in battle.js, browser-safe no-ops):
- boot: re-asserts every locally-earned curated achievement + all stat values
  (idempotent per Valve — local profile and Steam converge automatically).
- every match commit: pushes stats, asserts earned achievements, `storeStats()`
  once (Valve's recommended cadence; triggers overlay toasts).
- mid-match feat unlock: immediate assert + store for the instant toast.

## Steamworks admin setup

The curated schema (≤100 achievements, per the 100-cap for new games) lives in
`data.js` (`STEAM_ACH_DEFS` / `STEAM_STAT_DEFS`) and is validated by
`npm test`. To get the copy-paste checklist for the Steamworks admin panel
(Stats & Achievements section — stat definitions plus stat-backed unlock
thresholds, which give free native progress bars):

```bash
npm run steam:schema     # from the repo root
```

Offline play: nothing extra to build — the Steam client caches stat/achievement
writes made offline and uploads on reconnect (the game must have run online
once so the client knows the schema).
