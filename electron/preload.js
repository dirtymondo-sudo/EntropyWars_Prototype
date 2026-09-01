/* electron/preload.js — injects the SteamGlue surface (ACHIEVEMENTS_PLAN.md
   §8.1) into the game page. This is the ONLY difference the game code can
   observe between the browser build and the Steam build: battle.js checks
   `window.SteamGlue && window.SteamGlue.available` and no-ops without it.

   The availability handshake is a single synchronous IPC at page load (so
   `available` is a plain boolean, queryable before anything async settles);
   the three mutating calls are fire-and-forget sends — the game never waits
   on Steam. */

'use strict';

const { contextBridge, ipcRenderer } = require('electron');

let available = false;
try { available = !!ipcRenderer.sendSync('steam:available'); } catch (e) {}

contextBridge.exposeInMainWorld('SteamGlue', {
  available,
  setStat(name, val) { try { ipcRenderer.send('steam:setStat', name, val); } catch (e) {} },
  setAchievement(id) { try { ipcRenderer.send('steam:setAchievement', id); } catch (e) {} },
  storeStats()       { try { ipcRenderer.send('steam:storeStats'); } catch (e) {} },
});
