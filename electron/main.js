/* electron/main.js — Entropy Wars Steam-build shell (ACHIEVEMENTS_PLAN.md §8;
   LAUNCH_READINESS §6). Repo tooling only — nothing under electron/ ships to
   R2, and the game files stay identical across browser and Steam builds: the
   ONLY thing this shell adds to the page is the injected `window.SteamGlue`
   surface (see preload.js).

   What the game loads, in priority order:
   1. EW_APP_URL env var (point at localhost:3000 during development)
   2. a self-contained ../dist/index.html, once the asset-bundling track from
      LAUNCH_READINESS §6 exists (the real Steam build — works offline)
   3. the live site (interim: proves the glue end-to-end before dist/ lands)

   Run it:   cd electron && npm install && npm start
   Dev Steam testing needs the Steam client running and steam_appid.txt (480
   = Spacewar). Without Steam or without steamworks.js installed, the shell
   still runs — SteamGlue degrades to unavailable and the game behaves like
   the browser build. */

'use strict';

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const steam = require('./steam.js');
let glue = steam.NOOP;

/* steamworks.js needs these switches for the Steam overlay to hook the GPU
   process; harmless when Steam is absent. Must run before app 'ready'. */
app.commandLine.appendSwitch('in-process-gpu');
app.commandLine.appendSwitch('disable-direct-composition');

function resolveTarget() {
  if (process.env.EW_APP_URL) return { url: process.env.EW_APP_URL };
  const dist = path.join(__dirname, '..', 'dist', 'index.html');
  if (fs.existsSync(dist)) return { file: dist };
  return { url: 'https://entropywars.net' };
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 900,
    backgroundColor: '#0a0a12',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // preload uses ipcRenderer.sendSync for the availability handshake
    },
  });

  const target = resolveTarget();
  if (target.file) win.loadFile(target.file);
  else win.loadURL(target.url);
  return win;
}

app.whenReady().then(() => {
  glue = steam.init();

  /* The 4-function SteamGlue surface (§8.1), bridged over IPC. The renderer
     side (preload.js) exposes it as window.SteamGlue; battle.js
     _steamPushProgress / _steamAssertFeat are the only consumers. Calls are
     fire-and-forget (send, not invoke): cheap, ordered, and the game never
     blocks on Steam. */
  ipcMain.on('steam:available', (ev) => { ev.returnValue = !!glue.available; });
  ipcMain.on('steam:setStat', (ev, name, val) => glue.setStat(name, val));
  ipcMain.on('steam:setAchievement', (ev, id) => glue.setAchievement(id));
  ipcMain.on('steam:storeStats', () => glue.storeStats());

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  /* Valve: pending stats are effectively flushed at process exit, but flush
     explicitly anyway — cheap insurance for the "quit right after the match"
     case (§2.1). */
  try { glue.storeStats(); } catch (e) {}
  app.quit();
});
