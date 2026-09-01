/* electron/steam.js — the swappable Steamworks binding (ACHIEVEMENTS_PLAN.md
   §8.1). This module is the ONLY place that knows which npm binding is in
   use; everything else (main.js IPC, the game's SteamGlue surface) sees just
   the 4-function interface:

       { available, setStat(name, val), setAchievement(id), storeStats() }

   Current binding: steamworks.js (ceifa/steamworks.js — stalled since 2024
   but functional). To swap to steamworks-ffi-node (actively published, §2.5),
   rewrite ONLY the `init` body below — the interface stays put.

   Every call is duck-typed and wrapped: a missing binding, a missing Steam
   client, or an API mismatch degrades to a silent no-op — the game must
   always boot, achievements or not (offline-first, LAUNCH_READINESS §6). */

'use strict';

const NOOP = {
  available: false,
  setStat() {},
  setAchievement() {},
  storeStats() {},
};

/* App id resolution: the real id comes from Steam itself when launched
   through the client; in dev, steam_appid.txt (480 = Valve's Spacewar test
   app) sits next to this file and the binding picks it up from cwd. An
   EW_STEAM_APPID env var overrides for local testing. */
function resolveAppId() {
  const fromEnv = parseInt(process.env.EW_STEAM_APPID || '', 10);
  if (Number.isFinite(fromEnv) && fromEnv > 0) return fromEnv;
  try {
    const fs = require('fs');
    const path = require('path');
    const txt = fs.readFileSync(path.join(__dirname, 'steam_appid.txt'), 'utf8');
    const n = parseInt(txt.trim(), 10);
    if (Number.isFinite(n) && n > 0) return n;
  } catch (e) {}
  return 480;
}

function init() {
  let steamworks, client;
  try {
    steamworks = require('steamworks.js');
  } catch (e) {
    console.log('[steam] steamworks.js not installed — running without Steam');
    return NOOP;
  }
  try {
    client = steamworks.init(resolveAppId());
  } catch (e) {
    console.log('[steam] Steam client not available:', e.message);
    return NOOP;
  }

  // Overlay support for the achievement toasts (steamworks.js requires the
  // matching Electron command-line switches — set BEFORE app ready; main.js
  // calls this via electronEnableSteamOverlay when the binding exposes it).
  const glue = {
    available: true,
    _client: client,
    _steamworks: steamworks,

    setStat(name, val) {
      try {
        if (typeof name !== 'string' || !Number.isFinite(val)) return;
        const stats = client.stats;
        if (stats && typeof stats.setInt === 'function') stats.setInt(name, Math.round(val));
        else if (stats && typeof stats.setStat === 'function') stats.setStat(name, Math.round(val));
      } catch (e) {}
    },

    setAchievement(id) {
      try {
        if (typeof id !== 'string') return;
        const ach = client.achievement;
        if (ach && typeof ach.activate === 'function') ach.activate(id);
      } catch (e) {}
    },

    storeStats() {
      try {
        const stats = client.stats;
        if (stats && typeof stats.store === 'function') stats.store();
        // steamworks.js activates achievements immediately; stats.store()
        // flushes stat-backed progress so Steam evaluates panel-configured
        // thresholds and shows progress bars (§2.1).
      } catch (e) {}
    },
  };

  console.log('[steam] Steamworks initialized');
  return glue;
}

module.exports = { init, NOOP };
