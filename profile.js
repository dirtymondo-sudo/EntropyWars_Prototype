(function() {
'use strict';

const h = React.createElement;

const PROFILE_VERSION = 1;
const MAX_PROFILES = 3;
const MAX_MATCH_HISTORY = 100;
const MAX_ELO_HISTORY = 100;
const MAX_UNIT_BUILDS = 30;
const MAX_TEAM_PRESETS = 20;

const USERNAME_RE = /^[A-Za-z0-9_]{2,16}$/;

function defaultCareer() {
  return {
    matchesPlayed: 0, wins: 0, losses: 0,
    totalKills: 0, totalDeaths: 0, totalAssists: 0,
    totalDamage: 0, totalHealing: 0, totalCrits: 0,
    totalDodges: 0, totalCounters: 0,
    currentWinStreak: 0, bestWinStreak: 0, bestKillStreak: 0,
    totalTurnsPlayed: 0, totalMatchTimeMs: 0,
  };
}

function defaultProfile(username) {
  return {
    version: PROFILE_VERSION,
    username: username || 'Player',
    createdAt: new Date().toISOString(),
    career: defaultCareer(),
    classStats: {},
    raceStats: {},
    elo: 1000,
    peakElo: 1000,
    eloHistory: [],
    achievements: {},
    matchHistory: [],
    unitBuilds: [],
    teamPresets: [],
    favRaces: [],
  };
}

function backfillProfile(p) {
  if (!p) return defaultProfile();
  if (!p.career) p.career = defaultCareer();
  const dc = defaultCareer();
  for (const k of Object.keys(dc)) {
    if (p.career[k] === undefined) p.career[k] = dc[k];
  }
  if (!p.classStats) p.classStats = {};
  if (!p.raceStats) p.raceStats = {};
  if (p.elo === undefined) p.elo = 1000;
  if (p.peakElo === undefined) p.peakElo = p.elo;
  if (!p.eloHistory) p.eloHistory = [];
  if (!p.achievements) p.achievements = {};
  if (!p.matchHistory) p.matchHistory = [];
  if (!p.unitBuilds) p.unitBuilds = [];
  if (!p.teamPresets) p.teamPresets = [];
  if (!p.favRaces) p.favRaces = [];
  // Account economy mirror. When a server token exists the server is the source
  // of truth and this is just a read cache; with no token (offline / local-only /
  // profiles made before the account system) this IS the wallet, and purchasing
  // runs against it locally. Seed it so old profiles aren't stranded.
  if (!p.account || !Array.isArray(p.account.unlockedUnits)) {
    const starters = (typeof window !== 'undefined' && Array.isArray(window.ACCT_STARTER_UNITS))
      ? window.ACCT_STARTER_UNITS.slice()
      : ['men in black', 'wizard', 'werewolf', 'mad scientist', 'homosapien', 'catgirl',
         'fortune teller', 'bigfoot', 'grey', 'marksman', 'knight', 'fairy'];
    p.account = {
      gold: (typeof window !== 'undefined' && typeof window.ACCT_STARTING_GOLD === 'number') ? window.ACCT_STARTING_GOLD : 0,
      unlockedUnits: starters,
      freeTokens: (typeof window !== 'undefined' && typeof window.ACCT_FREE_TOKENS === 'number') ? window.ACCT_FREE_TOKENS : 1,
    };
  }
  // One-time heal for profiles created BEFORE the account system: their account
  // block was seeded with 0 free tokens, so grant the founding token once. The
  // flag stops it from re-granting after the token is spent. Server-account
  // players get their authoritative token count on login, which overrides this.
  if (p.account && !p.account._localFounderGrant) {
    p.account._localFounderGrant = true;
    const grant = (typeof window !== 'undefined' && typeof window.ACCT_FREE_TOKENS === 'number') ? window.ACCT_FREE_TOKENS : 1;
    if ((p.account.freeTokens || 0) < grant) p.account.freeTokens = grant;
  }
  return p;
}

function loadProfile(slot) {
  try {
    const raw = localStorage.getItem('ew-profile-' + slot);
    if (!raw) return null;
    return backfillProfile(JSON.parse(raw));
  } catch { return null; }
}

function saveProfile(slot, data) {
  try {
    localStorage.setItem('ew-profile-' + slot, JSON.stringify(data));
  } catch (e) { console.error('saveProfile failed:', e); }
}

function deleteProfile(slot) {
  localStorage.removeItem('ew-profile-' + slot);

  const active = getActiveProfileIndex();
  if (active === slot) {
    for (let i = 0; i < MAX_PROFILES; i++) {
      if (i !== slot && loadProfile(i)) {
        setActiveProfileIndex(i);
        return;
      }
    }
    localStorage.removeItem('ew-active-profile');
  }
}

function getActiveProfileIndex() {
  const v = localStorage.getItem('ew-active-profile');
  if (v === null) return null;
  const n = parseInt(v, 10);
  return (n >= 0 && n < MAX_PROFILES) ? n : null;
}

function setActiveProfileIndex(i) {
  localStorage.setItem('ew-active-profile', String(i));
}

function getActiveProfile() {
  const idx = getActiveProfileIndex();
  if (idx === null) return null;
  return loadProfile(idx);
}

function createProfile(username) {
  for (let i = 0; i < MAX_PROFILES; i++) {
    if (!loadProfile(i)) {
      const p = defaultProfile(username);
      saveProfile(i, p);
      setActiveProfileIndex(i);
      return i;
    }
  }
  return null;
}

function isValidUsername(s) {
  return USERNAME_RE.test(s);
}

function migrateOldData() {

  if (getActiveProfileIndex() !== null) return;

  const oldCareer = localStorage.getItem('entropy-wars-career-v1');
  const oldAchievements = localStorage.getItem('entropy-wars-achievements-v1');
  const oldTeams = localStorage.getItem('ew_saved_teams_v2');
  if (!oldCareer && !oldAchievements && !oldTeams) return;

  const p = defaultProfile('Player');

  if (oldCareer) {
    try {
      const c = JSON.parse(oldCareer);
      p.career.matchesPlayed = c.matchesPlayed || 0;
      p.career.wins = c.wins || 0;
      p.career.losses = c.losses || 0;
      p.career.totalKills = c.totalKills || 0;
      p.career.totalDamage = c.totalDamage || 0;
      p.career.totalHealing = c.totalHealing || 0;
      p.career.totalCrits = c.totalCrits || 0;
      p.career.totalDodges = c.totalDodges || 0;
      p.career.totalCounters = c.totalCounters || 0;
      p.career.currentWinStreak = c.currentWinStreak || 0;
      p.career.bestWinStreak = c.bestWinStreak || 0;
      p.elo = c.elo || 1000;
      p.peakElo = c.peakElo || p.elo;
      p.eloHistory = (c.eloHistory || []).slice(-MAX_ELO_HISTORY);

      if (c.classCounts) {
        for (const [cls, count] of Object.entries(c.classCounts)) {
          p.classStats[cls] = { played: count, wins: 0, kills: 0, deaths: 0, assists: 0, dmg: 0, healing: 0 };
        }
      }
      if (c.raceCounts) {
        for (const [race, count] of Object.entries(c.raceCounts)) {
          p.raceStats[race] = { played: count, wins: 0 };
        }
      }
    } catch {}
  }

  if (oldAchievements) {
    try { p.achievements = JSON.parse(oldAchievements); } catch {}
  }

  if (oldTeams) {
    try {
      const teams = JSON.parse(oldTeams);
      for (const [name, payload] of Object.entries(teams)) {
        if (p.teamPresets.length >= MAX_TEAM_PRESETS) break;
        const slots = [];
        const builds = payload.partyBuilds || {};
        const names = payload.partyNames || {};
        const loadouts = payload.loadouts || {};
        const meta = payload.partyMeta || {};

        const pb = builds[1] || [];
        for (let i = 0; i < pb.length; i++) {
          slots.push({
            cls: pb[i],
            race: meta[1]?.[i]?.race || 'human',
            gender: meta[1]?.[i]?.gender || 'male',
            unitName: (names[1] || [])[i] || pb[i],
            customSpells: meta[1]?.[i]?.customSpells || [],
            secondaryJob: meta[1]?.[i]?.secondaryJob || null,
            loadout: (loadouts[1] || [])[i] || { items: {}, equipment: {} },
          });
        }
        p.teamPresets.push({
          id: 'team-' + Date.now() + '-' + p.teamPresets.length,
          name: name,
          slots: slots,
          gameMode: 'arena',
          createdAt: payload.savedAt || new Date().toISOString(),
          lastUsed: payload.savedAt || new Date().toISOString(),
        });
      }
    } catch {}
  }

  saveProfile(0, p);
  setActiveProfileIndex(0);

  try {
    localStorage.removeItem('entropy-wars-career-v1');
    localStorage.removeItem('entropy-wars-achievements-v1');
    localStorage.removeItem('ew_saved_teams_v2');
  } catch {}

  window._profileNeedsRename = true;
}

function profileLoadCareerStats() {
  const p = getActiveProfile();
  if (!p) return {
    matchesPlayed: 0, wins: 0, losses: 0, totalKills: 0, totalDamage: 0, totalHealing: 0,
    totalCrits: 0, totalDodges: 0, totalCounters: 0, currentWinStreak: 0, bestWinStreak: 0,
    classCounts: {}, raceCounts: {}, elo: 1000, peakElo: 1000, eloHistory: []
  };

  return {
    matchesPlayed: p.career.matchesPlayed,
    wins: p.career.wins,
    losses: p.career.losses,
    totalKills: p.career.totalKills,
    totalDamage: p.career.totalDamage,
    totalHealing: p.career.totalHealing,
    totalCrits: p.career.totalCrits,
    totalDodges: p.career.totalDodges,
    totalCounters: p.career.totalCounters,
    currentWinStreak: p.career.currentWinStreak,
    bestWinStreak: p.career.bestWinStreak,
    classCounts: Object.fromEntries(Object.entries(p.classStats).map(([k,v]) => [k, v.played || 0])),
    raceCounts: Object.fromEntries(Object.entries(p.raceStats).map(([k,v]) => [k, v.played || 0])),
    elo: p.elo,
    peakElo: p.peakElo,
    eloHistory: p.eloHistory,
  };
}

function profileSaveCareerStats(stats) {
  const idx = getActiveProfileIndex();
  if (idx === null) return;
  const p = loadProfile(idx);
  if (!p) return;
  p.career.matchesPlayed = stats.matchesPlayed;
  p.career.wins = stats.wins;
  p.career.losses = stats.losses;
  p.career.totalKills = stats.totalKills;
  p.career.totalDamage = stats.totalDamage;
  p.career.totalHealing = stats.totalHealing;
  p.career.totalCrits = stats.totalCrits;
  p.career.totalDodges = stats.totalDodges;
  p.career.totalCounters = stats.totalCounters;
  p.career.currentWinStreak = stats.currentWinStreak;
  p.career.bestWinStreak = stats.bestWinStreak;
  p.elo = stats.elo;
  p.peakElo = stats.peakElo;
  p.eloHistory = stats.eloHistory;

  if (stats.classCounts) {
    for (const [cls, count] of Object.entries(stats.classCounts)) {
      if (!p.classStats[cls]) p.classStats[cls] = { played: 0, wins: 0, kills: 0, deaths: 0, assists: 0, dmg: 0, healing: 0 };
      p.classStats[cls].played = count;
    }
  }
  if (stats.raceCounts) {
    for (const [race, count] of Object.entries(stats.raceCounts)) {
      if (!p.raceStats[race]) p.raceStats[race] = { played: 0, wins: 0 };
      p.raceStats[race].played = count;
    }
  }
  saveProfile(idx, p);
}

function profileLoadAchievements() {
  const p = getActiveProfile();
  return p ? p.achievements : {};
}

function profileSaveAchievements(achievements) {
  const idx = getActiveProfileIndex();
  if (idx === null) return;
  const p = loadProfile(idx);
  if (!p) return;
  p.achievements = achievements;
  saveProfile(idx, p);
}

function profileUpdatePostMatch(viewerUnits, playerWon, matchSummary) {
  const idx = getActiveProfileIndex();
  if (idx === null) return;
  const p = loadProfile(idx);
  if (!p) return;

  for (const u of viewerUnits) {
    const cls = u.cls;
    if (!p.classStats[cls]) p.classStats[cls] = { played: 0, wins: 0, kills: 0, deaths: 0, assists: 0, dmg: 0, healing: 0 };

    p.classStats[cls].wins += playerWon ? 1 : 0;
    p.classStats[cls].kills += u._matchKills || 0;
    p.classStats[cls].deaths += u._matchDeaths || 0;
    p.classStats[cls].assists += u._trackAssists || 0;
    p.classStats[cls].dmg += u._trackDmgDealt || 0;
    p.classStats[cls].healing += u._trackHealDone || 0;

    const race = u.race;
    if (race) {
      if (!p.raceStats[race]) p.raceStats[race] = { played: 0, wins: 0 };
      p.raceStats[race].wins += playerWon ? 1 : 0;
    }

    const unitStreak = u._killStreak || 0;
    if (unitStreak > p.career.bestKillStreak) p.career.bestKillStreak = unitStreak;
  }

  for (const u of viewerUnits) {
    p.career.totalDeaths += u._matchDeaths || 0;
    p.career.totalAssists += u._trackAssists || 0;
  }

  if (matchSummary) {
    p.career.totalTurnsPlayed += matchSummary.durationTurns || 0;
    p.career.totalMatchTimeMs += matchSummary.durationMs || 0;
  }

  if (matchSummary) {
    p.matchHistory.unshift(matchSummary);
    if (p.matchHistory.length > MAX_MATCH_HISTORY) p.matchHistory.pop();
  }

  saveProfile(idx, p);
}

const SERVER_TOKEN_KEY = 'ew-server-token';
const SERVER_ID_KEY = 'ew-server-id';

function getServerToken() {
  return localStorage.getItem(SERVER_TOKEN_KEY) || null;
}

function getServerId() {
  return localStorage.getItem(SERVER_ID_KEY) || null;
}

function setServerCredentials(id, token) {
  localStorage.setItem(SERVER_ID_KEY, id);
  localStorage.setItem(SERVER_TOKEN_KEY, token);
}

function clearServerCredentials() {
  localStorage.removeItem(SERVER_ID_KEY);
  localStorage.removeItem(SERVER_TOKEN_KEY);
}

async function serverRegister(username) {
  try {
    const resp = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      return { ok: false, error: data.error || 'Registration failed.' };
    }
    setServerCredentials(data.id, data.token);

    _syncServerEloToLocal(data.elo, data.peakElo);
    _absorbEconomyFromResponse(data);
    console.log('[AUTH] Registered on server:', data.username, data.id);
    return { ok: true, data };
  } catch (err) {
    console.error('[AUTH] Register error:', err);
    return { ok: false, error: 'Network error.' };
  }
}

async function serverLogin() {
  const token = getServerToken();
  if (!token) return { ok: false, error: 'No token stored.' };

  try {
    const resp = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      if (resp.status === 401) {

        clearServerCredentials();
      }
      return { ok: false, error: data.error || 'Login failed.' };
    }

    _syncServerEloToLocal(data.elo, data.peakElo);
    _absorbEconomyFromResponse(data);
    console.log('[AUTH] Logged in:', data.username, '(ELO', data.elo + ')');
    return { ok: true, data };
  } catch (err) {
    console.error('[AUTH] Login error:', err);
    return { ok: false, error: 'Network error.' };
  }
}

function hasServerAccount() {
  return !!(getServerToken() && getServerId());
}

async function serverAuthenticateSocket() {
  const token = getServerToken();
  const net = window._NET;
  if (!token || !net || !net.socket || !net.socket.connected) {
    return { ok: false, error: 'No token or socket.' };
  }

  return new Promise(function(resolve) {
    net.socket.emit('authenticate', { token }, function(resp) {
      if (resp && resp.error) {
        console.warn('[AUTH] Socket auth failed:', resp.error);
        resolve({ ok: false, error: resp.error });
      } else {
        console.log('[AUTH] Socket authenticated:', resp.username);
        resolve({ ok: true, data: resp });
      }
    });
  });
}

function _syncServerEloToLocal(elo, peakElo) {
  const idx = getActiveProfileIndex();
  if (idx === null) return;
  const p = loadProfile(idx);
  if (!p) return;
  if (typeof elo === 'number') p.elo = elo;
  if (typeof peakElo === 'number') p.peakElo = Math.max(p.peakElo || 0, peakElo);
  saveProfile(idx, p);
}

// ── ACCOUNT ECONOMY (client mirror) ────────────────────────────────────
// The mirror is READ-ONLY UI cache. Every spend/grant decision is a server
// response — never trust this for purchases.
function getAccountEconomy() {
  const p = getActiveProfile();
  if (p && p.account) return p.account;
  const starters = (typeof window !== 'undefined' && Array.isArray(window.ACCT_STARTER_UNITS))
    ? window.ACCT_STARTER_UNITS.slice() : [];
  return { gold: 0, unlockedUnits: starters, freeTokens: 0 };
}

function _syncEconomyToLocal(econ) {
  if (!econ) return;
  const idx = getActiveProfileIndex();
  if (idx === null) return;
  const p = loadProfile(idx);
  if (!p) return;
  if (!p.account) p.account = { gold: 0, unlockedUnits: [], freeTokens: 0 };
  if (typeof econ.gold === 'number') p.account.gold = econ.gold;
  if (Array.isArray(econ.unlockedUnits)) p.account.unlockedUnits = econ.unlockedUnits.slice();
  if (typeof econ.freeTokens === 'number') p.account.freeTokens = econ.freeTokens;
  saveProfile(idx, p);
  try {
    if (typeof window !== 'undefined' && typeof window._refreshWallets === 'function') window._refreshWallets();
  } catch {}
}
// Pull the data fields a login/register response carries (or a bare economy obj).
function _absorbEconomyFromResponse(data) {
  if (!data) return;
  if (data.gold !== undefined || data.unlockedUnits !== undefined || data.freeTokens !== undefined) {
    _syncEconomyToLocal({ gold: data.gold, unlockedUnits: data.unlockedUnits, freeTokens: data.freeTokens });
  }
}

// Credit gold straight to the local mirror (offline / no online account).
// Server stays authoritative when one exists; this keeps solo play rewarding.
function creditLocalGold(amount) {
  amount = Math.max(0, Math.round(Number(amount) || 0));
  const idx = getActiveProfileIndex();
  if (idx === null) return 0;
  const p = loadProfile(idx);
  if (!p) return 0;
  if (!p.account) p.account = { gold: 0, unlockedUnits: [], freeTokens: 0 };
  p.account.gold = (p.account.gold || 0) + amount;
  saveProfile(idx, p);
  try { if (typeof window !== 'undefined' && typeof window._refreshWallets === 'function') window._refreshWallets(); } catch {}
  return p.account.gold;
}

async function serverFetchEconomy() {
  const token = getServerToken();
  const id = getServerId();
  if (!token || !id) return { ok: false, error: 'No account.' };
  try {
    const resp = await fetch('/api/economy/' + encodeURIComponent(id), {
      headers: { 'x-auth-token': token },
    });
    const data = await resp.json();
    if (!resp.ok) return { ok: false, error: data.error || 'Failed.' };
    _syncEconomyToLocal(data);
    return { ok: true, data };
  } catch (err) {
    console.error('[ECON] Fetch error:', err);
    return { ok: false, error: 'Network error.' };
  }
}

async function serverBankGold(matchGold, mode) {
  const token = getServerToken();
  if (!token) return { ok: false, error: 'No account.' };
  try {
    const resp = await fetch('/api/economy/bank', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, matchGold, mode }),
    });
    const data = await resp.json();
    if (!resp.ok) return { ok: false, error: data.error || 'Bank failed.' };
    _syncEconomyToLocal(data);
    return { ok: true, data };
  } catch (err) {
    console.error('[ECON] Bank error:', err);
    return { ok: false, error: 'Network error.' };
  }
}

// Spend the LOCAL wallet when there's no server account (offline / Steam solo /
// profiles made before the account system). Mirrors the server's purchase rules
// (validate race, reject dupes, token-first then gold) against p.account so the
// shop works without any login. When a token exists this is bypassed and the
// server stays authoritative.
function localPurchaseUnit(raceKey, useToken) {
  const idx = getActiveProfileIndex();
  if (idx === null) return { ok: false, error: 'No profile selected.' };
  const p = loadProfile(idx);
  if (!p) return { ok: false, error: 'No profile.' };
  if (!p.account || !Array.isArray(p.account.unlockedUnits)) {
    p.account = { gold: 0, unlockedUnits: [], freeTokens: 0 };
  }
  const races = (typeof window !== 'undefined' && Array.isArray(window.AVAILABLE_RACES)) ? window.AVAILABLE_RACES : null;
  if (races && races.indexOf(raceKey) === -1) return { ok: false, error: 'Unknown unit.' };
  if (p.account.unlockedUnits.includes(raceKey)) return { ok: false, error: 'Already owned.' };

  const price = (typeof window !== 'undefined' && typeof window.ACCT_UNIT_PRICE === 'number') ? window.ACCT_UNIT_PRICE : 5000;
  if (useToken && (p.account.freeTokens || 0) > 0) {
    p.account.freeTokens -= 1;
  } else if ((p.account.gold || 0) >= price) {
    p.account.gold -= price;
  } else {
    return { ok: false, error: 'Not enough gold. (' + (p.account.gold || 0).toLocaleString() + ' / ' + price.toLocaleString() + ')' };
  }
  p.account.unlockedUnits = p.account.unlockedUnits.concat([raceKey]);
  saveProfile(idx, p);
  try { if (typeof window !== 'undefined' && typeof window._refreshWallets === 'function') window._refreshWallets(); } catch {}
  return { ok: true, data: { gold: p.account.gold, unlockedUnits: p.account.unlockedUnits.slice(), freeTokens: p.account.freeTokens } };
}

async function serverPurchaseUnit(raceKey, useToken) {
  const token = getServerToken();
  // No server account → spend the local wallet so solo/offline play can unlock.
  if (!token) return localPurchaseUnit(raceKey, useToken);
  try {
    const resp = await fetch('/api/economy/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, raceKey, useToken: !!useToken }),
    });
    const data = await resp.json();
    if (!resp.ok) return { ok: false, error: data.error || 'Purchase failed.' };
    _syncEconomyToLocal(data);
    return { ok: true, data };
  } catch (err) {
    console.error('[ECON] Purchase error:', err);
    return { ok: false, error: 'Network error.' };
  }
}

async function serverAutoLogin() {
  if (!hasServerAccount()) return;
  const result = await serverLogin();
  if (result.ok) {

    const eloTag = document.getElementById('mmEloTag');
    if (eloTag && result.data) {
      eloTag.textContent = 'ELO ' + result.data.elo;
    }
  }
}

window.ProfileSystem = {
  loadProfile, saveProfile, deleteProfile,
  getActiveProfileIndex, setActiveProfileIndex,
  getActiveProfile, createProfile, isValidUsername,
  migrateOldData, defaultProfile, backfillProfile,
  loadCareerStats: profileLoadCareerStats,
  saveCareerStats: profileSaveCareerStats,
  loadAchievements: profileLoadAchievements,
  saveAchievements: profileSaveAchievements,
  updatePostMatch: profileUpdatePostMatch,
  MAX_PROFILES, MAX_MATCH_HISTORY, MAX_ELO_HISTORY,
  MAX_UNIT_BUILDS, MAX_TEAM_PRESETS,

  serverRegister,
  serverLogin,
  serverAutoLogin,
  serverAuthenticateSocket,
  hasServerAccount,
  getServerToken,
  getServerId,
  clearServerCredentials,
  getAccountEconomy,
  serverFetchEconomy,
  serverBankGold,
  serverPurchaseUnit,
  localPurchaseUnit,
  creditLocalGold,
};

function buildProfileMatchSummary() {
  const st = window.state;
  if (!st) return null;
  const viewer = typeof getViewerPlayer === 'function' ? getViewerPlayer() : 1;
  const playerWon = st.winner === viewer;
  const mpMode = typeof getActiveMultiplayerMode === 'function' ? getActiveMultiplayerMode() : null;
  const gmId = typeof activeGameMode !== 'undefined' ? activeGameMode : 'arena';
  const elapsed = st.startTime ? Date.now() - st.startTime : 0;

  const score = { p1: 0, p2: 0 };
  const viewerUnits = (st.units || []).filter(u => u.player === viewer);
  const oppUnits = (st.units || []).filter(u => u.player !== viewer);
  score.p1 = viewerUnits.reduce((s, u) => s + (u._matchKills || 0), 0);
  score.p2 = oppUnits.reduce((s, u) => s + (u._matchKills || 0), 0);

  let winCond = 'elimination';
  if (typeof getCurrentWinCondition === 'function') {
    const wc = getCurrentWinCondition();
    if (wc === 'tower_destruction') winCond = 'nexus';
    else if (wc === 'score_limit') winCond = 'score';
    else if (wc === 'stalemate' || wc === 'sudden_death') winCond = 'sudden_death';
    else if (wc === 'time_limit') winCond = 'time';
    else winCond = 'elimination';
  }

  const units = viewerUnits.map(u => {
    const kills = u._matchKills || 0;
    const deaths = u._matchDeaths || 0;
    const assists = u._trackAssists || 0;
    const dmgDealt = u._trackDmgDealt || 0;
    const dmgReceived = u._trackDmgReceived || 0;
    const healDone = u._trackHealDone || 0;
    const crits = u._matchCrits || 0;
    const maxKillStreak = u._killStreak || 0;
    const level = typeof getUnitLevel === 'function' ? getUnitLevel(u) : 1;
    return {
      cls: u.cls,
      race: u.race || 'unknown',
      name: u.name || u.cls,
      kills, deaths, assists,
      dmgDealt, dmgReceived, healDone, crits,
      maxKillStreak, levelReached: level,
      mvp: false,
    };
  });

  if (units.length) {
    let mvpIdx = 0;
    let mvpScore = -1;
    units.forEach((u, i) => {
      const s = u.dmgDealt + u.kills * 500 + u.assists * 200;
      if (s > mvpScore) { mvpScore = s; mvpIdx = i; }
    });
    units[mvpIdx].mvp = true;
  }

  const ts = Date.now();
  return {
    id: 'match-' + ts,
    timestamp: new Date().toISOString(),
    gameMode: gmId,
    multiplayerMode: mpMode ? mpMode.id : 'arena',
    mapName: st._mapPresetName || 'Unknown',
    mapId: st._mapPresetId || 'unknown',
    ranked: !!st.isRankedMatch,
    opponent: (window._NET && window._NET.online) ? (window._NET.opponentName || 'Online') : 'CPU',
    result: playerWon ? 'win' : 'loss',
    winCondition: winCond,
    score: score,
    eloDelta: window._lastEloDelta || 0,
    eloAfter: window._lastEloAfter || 1000,
    durationTurns: st.round || 0,
    durationMs: elapsed,
    units: units,
  };
}

window._buildProfileMatchSummary = buildProfileMatchSummary;

const EW = {
  bg: '#06070c', bg2: '#0b0d16', bg3: '#11141f',
  panel: 'rgba(20,24,38,0.85)',
  panelEdge: 'rgba(120,140,180,0.16)',
  panelEdgeHi: 'rgba(180,200,240,0.32)',
  ink: '#e6e9f2', inkMute: '#8a93a8', inkDim: '#555c70',
  good: '#6ee2a8', bad: '#ff7a8a', warn: '#f2c468',
  accent: '#5ab0ff',
  gold: '#ffd700',
};

const RANK_COLORS = {
  Grandmaster: '#ffd700', Diamond: '#b9f2ff', Gold: '#ffd700',
  Silver: '#c0c0c0', Bronze: '#cd7f32', Iron: '#888'
};

function timeAgo(isoStr) {
  const d = new Date(isoStr);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  const days = Math.floor(hrs / 24);
  if (days < 7) return days + 'd ago';
  return d.toLocaleDateString();
}

function fmtNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function getRankInfo(elo) {
  if (typeof getEloRankInfo === 'function') return getEloRankInfo(elo);
  if (elo >= 2000) return { icon: '👑', name: 'Grandmaster', color: '#ffd700' };
  if (elo >= 1700) return { icon: '💎', name: 'Diamond', color: '#b9f2ff' };
  if (elo >= 1400) return { icon: '🥇', name: 'Gold', color: '#ffd700' };
  if (elo >= 1200) return { icon: '🥈', name: 'Silver', color: '#c0c0c0' };
  if (elo >= 1000) return { icon: '🥉', name: 'Bronze', color: '#cd7f32' };
  return { icon: '⚙️', name: 'Iron', color: '#888' };
}

function EloSparkline({ data, width, height }) {
  if (!data || data.length < 2) return h('div', { style: { color: EW.inkDim, fontSize: 11 } }, 'Not enough data');
  const vals = data.map(d => d.elo || d);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const padY = 4;
  const points = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * width;
    const y = height - padY - ((v - min) / range) * (height - padY * 2);
    return `${x},${y}`;
  }).join(' ');
  const last = vals[vals.length - 1];
  const prev = vals[vals.length - 2];
  const color = last >= prev ? EW.good : EW.bad;
  return h('svg', { width, height, style: { display: 'block' } },
    h('polyline', {
      points,
      fill: 'none',
      stroke: color,
      strokeWidth: 2,
      strokeLinejoin: 'round',
    }),
    h('circle', {
      cx: width,
      cy: height - padY - ((last - min) / range) * (height - padY * 2),
      r: 3,
      fill: color,
    })
  );
}

function StatCard({ label, value, sub, color }) {
  return h('div', { style: {
    background: EW.panel, border: '1px solid ' + EW.panelEdge,
    borderRadius: 6, padding: '12px 14px', minWidth: 100,
  }},
    h('div', { style: { fontSize: 11, color: EW.inkMute, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 } }, label),
    h('div', { style: { fontSize: 22, fontWeight: 700, color: color || EW.ink, fontFamily: 'Cinzel, serif' } }, value),
    sub ? h('div', { style: { fontSize: 11, color: EW.inkDim, marginTop: 2 } }, sub) : null
  );
}

function OverviewTab({ profile }) {
  const c = profile.career;
  const winRate = c.matchesPlayed > 0 ? ((c.wins / c.matchesPlayed) * 100).toFixed(1) + '%' : '—';
  const kd = c.totalDeaths > 0 ? (c.totalKills / c.totalDeaths).toFixed(2) : c.totalKills > 0 ? '∞' : '—';

  let topClass = null, topClassCount = 0;
  for (const [cls, cs] of Object.entries(profile.classStats)) {
    if (cs.played > topClassCount) { topClass = cls; topClassCount = cs.played; }
  }

  let bestWrClass = null, bestWr = 0;
  for (const [cls, cs] of Object.entries(profile.classStats)) {
    if (cs.played >= 5) {
      const wr = cs.wins / cs.played;
      if (wr > bestWr) { bestWr = wr; bestWrClass = cls; }
    }
  }

  const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 };

  return h('div', { style: { padding: '16px 0' } },
    h('div', { style: grid },
      h(StatCard, { label: 'Matches', value: c.matchesPlayed }),
      h(StatCard, { label: 'Win Rate', value: winRate, color: EW.good }),
      h(StatCard, { label: 'Current Streak', value: c.currentWinStreak, color: c.currentWinStreak >= 3 ? EW.warn : EW.ink }),
      h(StatCard, { label: 'Best Streak', value: c.bestWinStreak }),
      h(StatCard, { label: 'Total Kills', value: fmtNum(c.totalKills) }),
      h(StatCard, { label: 'Total Deaths', value: fmtNum(c.totalDeaths) }),
      h(StatCard, { label: 'K/D Ratio', value: kd }),
      h(StatCard, { label: 'Total Damage', value: fmtNum(c.totalDamage), color: EW.bad }),
      h(StatCard, { label: 'Total Healing', value: fmtNum(c.totalHealing), color: EW.good }),
      h(StatCard, { label: 'Total Crits', value: fmtNum(c.totalCrits) }),
      h(StatCard, { label: 'Total Dodges', value: fmtNum(c.totalDodges) }),
      h(StatCard, { label: 'Total Counters', value: fmtNum(c.totalCounters) }),
      h(StatCard, { label: 'Best Kill Streak', value: c.bestKillStreak }),
      topClass ? h(StatCard, { label: 'Most Played', value: topClass, sub: topClassCount + ' games' }) : null,
      bestWrClass ? h(StatCard, { label: 'Best Win Rate', value: bestWrClass, sub: (bestWr * 100).toFixed(0) + '%', color: EW.good }) : null,
    ),

    profile.eloHistory.length >= 2 ? h('div', { style: {
      marginTop: 16, background: EW.panel, border: '1px solid ' + EW.panelEdge,
      borderRadius: 6, padding: 16,
    }},
      h('div', { style: { fontSize: 11, color: EW.inkMute, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 } }, 'Elo History'),
      h(EloSparkline, { data: profile.eloHistory.slice(-50), width: 280, height: 60 })
    ) : null,
  );
}

function MatchHistoryTab({ profile }) {
  const [modeFilter, setModeFilter] = React.useState('all');
  const [rankFilter, setRankFilter] = React.useState('all');
  const [resultFilter, setResultFilter] = React.useState('all');
  const [classFilter, setClassFilter] = React.useState('all');
  const [expanded, setExpanded] = React.useState(null);

  let matches = profile.matchHistory || [];

  if (modeFilter !== 'all') matches = matches.filter(m => m.multiplayerMode === modeFilter || m.gameMode === modeFilter);
  if (rankFilter === 'ranked') matches = matches.filter(m => m.ranked);
  if (rankFilter === 'unranked') matches = matches.filter(m => !m.ranked);
  if (resultFilter === 'wins') matches = matches.filter(m => m.result === 'win');
  if (resultFilter === 'losses') matches = matches.filter(m => m.result === 'loss');
  if (classFilter !== 'all') matches = matches.filter(m => m.units && m.units.some(u => u.cls === classFilter));

  const allClasses = new Set();
  (profile.matchHistory || []).forEach(m => (m.units || []).forEach(u => allClasses.add(u.cls)));

  const filterBtn = (label, active, onClick) => h('button', {
    onClick,
    style: {
      padding: '4px 10px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
      background: active ? EW.accent : 'rgba(255,255,255,0.06)',
      color: active ? '#000' : EW.inkMute,
      border: 'none', fontFamily: 'DotGothic16, monospace',
    }
  }, label);

  return h('div', { style: { padding: '16px 0' } },

    h('div', { style: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 } },
      filterBtn('All', resultFilter === 'all', () => setResultFilter('all')),
      filterBtn('Wins', resultFilter === 'wins', () => setResultFilter('wins')),
      filterBtn('Losses', resultFilter === 'losses', () => setResultFilter('losses')),
      h('span', { style: { width: 1, background: EW.panelEdge, margin: '0 4px' } }),
      filterBtn('All Ranks', rankFilter === 'all', () => setRankFilter('all')),
      filterBtn('Ranked', rankFilter === 'ranked', () => setRankFilter('ranked')),
      filterBtn('Unranked', rankFilter === 'unranked', () => setRankFilter('unranked')),
      allClasses.size > 1 ? h('select', {
        value: classFilter,
        onChange: e => setClassFilter(e.target.value),
        style: {
          padding: '4px 8px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
          background: 'rgba(255,255,255,0.06)', color: EW.inkMute, border: '1px solid ' + EW.panelEdge,
          fontFamily: 'DotGothic16, monospace',
        }
      },
        h('option', { value: 'all' }, 'All Classes'),
        ...[...allClasses].sort().map(cls => h('option', { key: cls, value: cls }, cls))
      ) : null,
    ),

    matches.length === 0 ? h('div', { style: { color: EW.inkDim, padding: 20, textAlign: 'center' } }, 'No matches found.') :
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: 4 } },
      matches.map((m, i) => {
        const isWin = m.result === 'win';
        const isExpanded = expanded === i;
        const mvp = (m.units || []).find(u => u.mvp);
        return h('div', { key: m.id || i },
          h('div', {
            onClick: () => setExpanded(isExpanded ? null : i),
            style: {
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
              background: EW.panel, border: '1px solid ' + EW.panelEdge,
              borderRadius: 6, cursor: 'pointer', transition: 'background .15s',
              borderLeft: '3px solid ' + (isWin ? EW.good : EW.bad),
            }
          },

            h('div', { style: { fontSize: 11, color: EW.inkDim, minWidth: 64 } }, timeAgo(m.timestamp)),

            h('div', { style: {
              fontSize: 10, padding: '2px 6px', borderRadius: 3,
              background: 'rgba(255,255,255,0.08)', color: EW.inkMute,
              textTransform: 'uppercase',
            }}, (m.multiplayerMode || m.gameMode || '').toUpperCase()),

            h('div', { style: { fontSize: 12, color: EW.inkMute, flex: 1 } }, m.mapName || '—'),

            h('div', { style: {
              fontSize: 12, fontWeight: 700, color: isWin ? EW.good : EW.bad,
              minWidth: 36, textAlign: 'center',
            }}, isWin ? 'WIN' : 'LOSS'),

            h('div', { style: { fontSize: 12, color: EW.ink, minWidth: 40, textAlign: 'center' } },
              m.score ? (m.score.p1 + ' - ' + m.score.p2) : '—'),

            m.ranked ? h('div', { style: {
              fontSize: 12, fontWeight: 600, minWidth: 40, textAlign: 'right',
              color: (m.eloDelta || 0) > 0 ? EW.good : (m.eloDelta || 0) < 0 ? EW.bad : EW.inkDim,
            }}, (m.eloDelta > 0 ? '+' : '') + (m.eloDelta || 0)) : null,

            mvp ? h('div', { style: { fontSize: 11, color: EW.warn, marginLeft: 4 } }, '⭐ ' + (mvp.cls || '')) : null,
          ),

          isExpanded && m.units ? h('div', { style: {
            background: 'rgba(10,12,20,0.8)', border: '1px solid ' + EW.panelEdge,
            borderTop: 'none', borderRadius: '0 0 6px 6px', padding: 10,
            overflowX: 'auto',
          }},
            h('table', { style: { width: '100%', borderCollapse: 'collapse', fontSize: 11, color: EW.ink } },
              h('thead', null,
                h('tr', { style: { color: EW.inkMute, textAlign: 'left' } },
                  ['Unit', 'Class', 'K', 'D', 'A', 'Dmg', 'Heal', 'Lv'].map(col =>
                    h('th', { key: col, style: { padding: '4px 6px', fontWeight: 400 } }, col)
                  )
                )
              ),
              h('tbody', null,
                m.units.map((u, j) =>
                  h('tr', { key: j, style: { borderTop: '1px solid rgba(255,255,255,0.04)' } },
                    h('td', { style: { padding: '4px 6px' } }, (u.mvp ? '⭐ ' : '') + (u.name || u.cls)),
                    h('td', { style: { padding: '4px 6px', color: EW.inkMute } }, u.cls),
                    h('td', { style: { padding: '4px 6px' } }, u.kills),
                    h('td', { style: { padding: '4px 6px' } }, u.deaths),
                    h('td', { style: { padding: '4px 6px' } }, u.assists),
                    h('td', { style: { padding: '4px 6px', color: EW.bad } }, fmtNum(u.dmgDealt)),
                    h('td', { style: { padding: '4px 6px', color: EW.good } }, fmtNum(u.healDone)),
                    h('td', { style: { padding: '4px 6px' } }, u.levelReached),
                  )
                )
              )
            )
          ) : null,
        );
      })
    ),
  );
}

function ChampionsTab({ profile }) {
  const entries = Object.entries(profile.classStats)
    .map(([cls, s]) => ({ cls, ...s }))
    .sort((a, b) => b.played - a.played);

  if (!entries.length) return h('div', { style: { color: EW.inkDim, padding: 20, textAlign: 'center' } }, 'No class data yet. Play some matches!');

  const minGames = 5;
  const qualified = entries.filter(e => e.played >= minGames);
  const mostPlayed = entries[0];
  const highestWr = qualified.length ? qualified.reduce((a, b) => (b.wins / b.played) > (a.wins / a.played) ? b : a) : null;
  const bestKda = qualified.length ? qualified.reduce((a, b) => {
    const kdaA = ((a.kills + a.assists) / Math.max(1, a.deaths));
    const kdaB = ((b.kills + b.assists) / Math.max(1, b.deaths));
    return kdaB > kdaA ? b : a;
  }) : null;
  const mostKills = entries.reduce((a, b) => b.kills > a.kills ? b : a);

  return h('div', { style: { padding: '16px 0' } },

    h('div', { style: { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 } },
      mostPlayed ? h(StatCard, { label: 'Most Played', value: mostPlayed.cls, sub: mostPlayed.played + ' games' }) : null,
      highestWr ? h(StatCard, { label: 'Highest Win Rate', value: highestWr.cls, sub: ((highestWr.wins / highestWr.played) * 100).toFixed(0) + '%', color: EW.good }) : null,
      bestKda ? h(StatCard, { label: 'Best KDA', value: bestKda.cls, sub: ((bestKda.kills + bestKda.assists) / Math.max(1, bestKda.deaths)).toFixed(2), color: EW.accent }) : null,
      mostKills.kills > 0 ? h(StatCard, { label: 'Most Kills', value: mostKills.cls, sub: mostKills.kills + ' kills', color: EW.bad }) : null,
    ),

    h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 } },
      entries.map(e => {
        const wr = e.played > 0 ? ((e.wins / e.played) * 100).toFixed(0) + '%' : '—';
        const kda = ((e.kills + e.assists) / Math.max(1, e.deaths)).toFixed(2);

        let topRace = null;

        return h('div', { key: e.cls, style: {
          background: EW.panel, border: '1px solid ' + EW.panelEdge,
          borderRadius: 6, padding: 12,
        }},
          h('div', { style: { fontWeight: 700, fontSize: 14, marginBottom: 6, fontFamily: 'Cinzel, serif', color: EW.ink } }, e.cls),
          h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px', fontSize: 12 } },
            h('span', { style: { color: EW.inkMute } }, 'Played'), h('span', { style: { color: EW.ink } }, e.played),
            h('span', { style: { color: EW.inkMute } }, 'Wins'), h('span', { style: { color: EW.good } }, e.wins),
            h('span', { style: { color: EW.inkMute } }, 'Win Rate'), h('span', { style: { color: EW.ink } }, wr),
            h('span', { style: { color: EW.inkMute } }, 'KDA'), h('span', { style: { color: EW.accent } }, kda),
            h('span', { style: { color: EW.inkMute } }, 'Kills'), h('span', { style: { color: EW.ink } }, e.kills),
            h('span', { style: { color: EW.inkMute } }, 'Deaths'), h('span', { style: { color: EW.ink } }, e.deaths),
            h('span', { style: { color: EW.inkMute } }, 'Damage'), h('span', { style: { color: EW.bad } }, fmtNum(e.dmg)),
            h('span', { style: { color: EW.inkMute } }, 'Healing'), h('span', { style: { color: EW.good } }, fmtNum(e.healing)),
          ),
        );
      })
    ),
  );
}

function AchievementsTab({ profile }) {

  const defs = typeof ACHIEVEMENT_DEFS !== 'undefined' ? ACHIEVEMENT_DEFS
             : (window.ACHIEVEMENT_DEFS || {});
  const allIds = Object.keys(defs);
  const unlocked = profile.achievements || {};
  const unlockedCount = allIds.filter(id => unlocked[id]).length;

  return h('div', { style: { padding: '16px 0' } },
    h('div', { style: { fontSize: 13, color: EW.inkMute, marginBottom: 12 } },
      unlockedCount + ' / ' + allIds.length + ' unlocked'
    ),
    allIds.length === 0 ? h('div', { style: { color: EW.inkDim } }, 'No achievements defined.') :
    h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 } },
      allIds.map(id => {
        const def = defs[id];
        const u = unlocked[id];
        const isUnlocked = !!u;
        return h('div', { key: id, style: {
          background: isUnlocked ? EW.panel : 'rgba(10,12,20,0.5)',
          border: '1px solid ' + (isUnlocked ? EW.panelEdgeHi : EW.panelEdge),
          borderRadius: 6, padding: 12,
          opacity: isUnlocked ? 1 : 0.5,
        }},
          h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 } },
            h('span', { style: { fontSize: 20 } }, isUnlocked ? def.icon : '🔒'),
            h('span', { style: { fontWeight: 700, fontSize: 13, color: isUnlocked ? EW.ink : EW.inkDim, fontFamily: 'Cinzel, serif' } }, def.name),
          ),
          h('div', { style: { fontSize: 11, color: EW.inkMute } }, def.desc),
          isUnlocked && u.unlockedAt ? h('div', { style: { fontSize: 10, color: EW.inkDim, marginTop: 4 } },
            'Unlocked ' + timeAgo(u.unlockedAt) + (u.unit ? ' — ' + u.unit : '')
          ) : null,
        );
      })
    ),
  );
}

function CreateProfileModal({ onCreated, onCancel }) {
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState('');

  const submit = () => {
    if (!isValidUsername(name)) {
      setError('2-16 chars, letters/numbers/underscores only');
      return;
    }
    const slot = createProfile(name);
    if (slot === null) {
      setError('All 3 profile slots are full');
      return;
    }

    serverRegister(name).then(function(result) {
      if (result.ok) {
        console.log('[AUTH] Server account created for', name);
      } else {
        console.warn('[AUTH] Server registration skipped:', result.error);
      }
    }).catch(function() {});
    if (onCreated) onCreated(slot);
  };

  return h('div', { style: {
    position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
  }},
    h('div', { style: {
      background: EW.bg2, border: '1px solid ' + EW.panelEdge,
      borderRadius: 10, padding: '28px 32px', minWidth: 300, maxWidth: 400,
      textAlign: 'center',
    }},
      h('div', { style: { fontSize: 18, fontFamily: 'Cinzel, serif', color: EW.ink, marginBottom: 16 } }, 'Create Profile'),
      h('input', {
        type: 'text', maxLength: 16, placeholder: 'Enter username',
        value: name,
        onChange: e => { setName(e.target.value); setError(''); },
        onKeyDown: e => { if (e.key === 'Enter') submit(); },
        autoFocus: true,
        style: {
          width: '100%', padding: '10px 14px', fontSize: 15, borderRadius: 6,
          background: 'rgba(255,255,255,0.06)', border: '1px solid ' + EW.panelEdge,
          color: EW.ink, outline: 'none', fontFamily: 'DotGothic16, monospace',
          boxSizing: 'border-box',
        }
      }),
      error ? h('div', { style: { color: EW.bad, fontSize: 12, marginTop: 6 } }, error) : null,
      h('div', { style: { display: 'flex', gap: 10, marginTop: 16, justifyContent: 'center' } },
        onCancel ? h('button', {
          onClick: onCancel,
          style: {
            padding: '8px 20px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
            background: 'rgba(255,255,255,0.06)', color: EW.inkMute, border: '1px solid ' + EW.panelEdge,
            fontFamily: 'DotGothic16, monospace',
          }
        }, 'Cancel') : null,
        h('button', {
          onClick: submit,
          style: {
            padding: '8px 24px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
            background: EW.accent, color: '#000', border: 'none', fontWeight: 700,
            fontFamily: 'DotGothic16, monospace',
          }
        }, 'Create'),
      ),
    )
  );
}

function LeaderboardPage() {
  const [players, setPlayers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [myRank, setMyRank] = React.useState(null);

  React.useEffect(() => {
    setLoading(true);
    fetch('/api/leaderboard?limit=50')
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); }
        else { setPlayers(data.players || []); }
        setLoading(false);
      })
      .catch(() => { setError('Failed to connect to server.'); setLoading(false); });

    var sid = getServerId();
    if (sid) {
      fetch('/api/player/' + sid + '/rank')
        .then(r => r.json())
        .then(data => { if (data.rank) setMyRank(data); })
        .catch(() => {});
    }
  }, []);

  var myPlayerId = getServerId();

  return h('div', { style: {
    position: 'fixed', inset: 0, zIndex: 9990,
    background: EW.bg, color: EW.ink, overflowY: 'auto',
    fontFamily: 'DotGothic16, monospace',
  }},
    h('div', { style: {
      background: 'linear-gradient(180deg, rgba(20,24,38,0.95) 0%, ' + EW.bg + ' 100%)',
      borderBottom: '1px solid ' + EW.panelEdge,
      padding: '20px 24px 16px', textAlign: 'center',
    }},
      h('button', {
        onClick: function() { if (typeof window._unmountLeaderboard === 'function') window._unmountLeaderboard(); },
        style: {
          position: 'absolute', top: 16, left: 16,
          background: 'rgba(255,255,255,0.06)', border: '1px solid ' + EW.panelEdge,
          color: EW.inkMute, padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
          fontSize: 13, fontFamily: 'DotGothic16, monospace',
        }
      }, '← Back'),
      h('div', { style: { fontSize: 22, fontFamily: 'Cinzel Decorative, Cinzel, serif', fontWeight: 700, letterSpacing: 2 } }, '🏆 LEADERBOARD'),
      myRank ? h('div', { style: { fontSize: 12, color: EW.inkMute, marginTop: 6 } },
        'Your rank: #' + myRank.rank + ' (' + myRank.elo + ' ELO)'
      ) : null,
    ),

    h('div', { style: { maxWidth: 700, margin: '0 auto', padding: '16px 16px 40px' } },
      loading ? h('div', { style: { textAlign: 'center', color: EW.inkMute, padding: 40 } }, 'Loading leaderboard...') :
      error ? h('div', { style: { textAlign: 'center', color: EW.bad, padding: 40 } }, error) :
      players.length === 0 ? h('div', { style: { textAlign: 'center', color: EW.inkDim, padding: 40 } }, 'No ranked players yet. Be the first!') :
      h('div', null,

        h('div', { style: {
          display: 'grid', gridTemplateColumns: '42px 1fr 80px 80px 80px',
          padding: '8px 12px', fontSize: 11, color: EW.inkDim, textTransform: 'uppercase', letterSpacing: 1,
          borderBottom: '1px solid ' + EW.panelEdge,
        }},
          h('span', null, '#'),
          h('span', null, 'Player'),
          h('span', { style: { textAlign: 'right' } }, 'ELO'),
          h('span', { style: { textAlign: 'right' } }, 'W / L'),
          h('span', { style: { textAlign: 'right' } }, 'Win %'),
        ),

        players.map(function(p) {
          var rank = getRankInfo(p.elo);
          var isMe = myPlayerId && p.id === myPlayerId;
          var winRate = p.totalGames > 0 ? ((p.wins / p.totalGames) * 100).toFixed(1) + '%' : '—';
          var medalIcon = p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : '';
          return h('div', { key: p.id, style: {
            display: 'grid', gridTemplateColumns: '42px 1fr 80px 80px 80px',
            padding: '10px 12px', alignItems: 'center',
            background: isMe ? 'rgba(90,176,255,0.08)' : (p.rank % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'),
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            borderLeft: isMe ? '3px solid ' + EW.accent : '3px solid transparent',
          }},
            h('span', { style: { fontSize: 13, fontWeight: 600, color: p.rank <= 3 ? EW.gold : EW.inkMute } },
              medalIcon || ('#' + p.rank)
            ),
            h('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
              h('span', { style: { fontSize: 15 } }, rank.icon),
              h('span', { style: { fontSize: 14, fontWeight: isMe ? 700 : 400, color: isMe ? EW.accent : EW.ink } }, p.username),
              isMe ? h('span', { style: { fontSize: 10, color: EW.accent, padding: '1px 5px', background: 'rgba(90,176,255,0.12)', borderRadius: 3 } }, 'YOU') : null,
            ),
            h('span', { style: { textAlign: 'right', fontSize: 14, fontWeight: 700, color: rank.color } }, p.elo),
            h('span', { style: { textAlign: 'right', fontSize: 12, color: EW.inkMute } }, p.wins + ' / ' + p.losses),
            h('span', { style: { textAlign: 'right', fontSize: 12, color: EW.good } }, winRate),
          );
        })
      )
    )
  );
}

function CommunityMapsPage() {
  var _useState = React.useState;
  var _useEffect = React.useEffect;

  var _maps = _useState([]);
  var maps = _maps[0], setMaps = _maps[1];
  var _loading = _useState(true);
  var loading = _loading[0], setLoading = _loading[1];
  var _error = _useState(null);
  var error = _error[0], setError = _error[1];
  var _sort = _useState('newest');
  var sort = _sort[0], setSort = _sort[1];
  var _submitting = _useState(false);
  var submitting = _submitting[0], setSubmitting = _submitting[1];
  var _showSubmit = _useState(false);
  var showSubmit = _showSubmit[0], setShowSubmit = _showSubmit[1];
  var _submitName = _useState('');
  var submitName = _submitName[0], setSubmitName = _submitName[1];
  var _submitDesc = _useState('');
  var submitDesc = _submitDesc[0], setSubmitDesc = _submitDesc[1];
  var _submitJson = _useState('');
  var submitJson = _submitJson[0], setSubmitJson = _submitJson[1];
  var _submitError = _useState('');
  var submitError = _submitError[0], setSubmitError = _submitError[1];

  function loadMaps(sortBy) {
    setLoading(true);
    fetch('/api/maps?sort=' + (sortBy || sort) + '&limit=30')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.error) { setError(data.error); }
        else { setMaps(data.maps || []); }
        setLoading(false);
      })
      .catch(function() { setError('Failed to connect to server.'); setLoading(false); });
  }

  _useEffect(function() { loadMaps(); }, [sort]);

  function handleSubmit() {
    if (!submitName.trim() || !submitJson.trim()) { setSubmitError('Name and map JSON required.'); return; }
    var token = getServerToken();
    if (!token) { setSubmitError('You need a server account. Create a profile first.'); return; }
    setSubmitting(true);
    setSubmitError('');
    fetch('/api/maps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
      body: JSON.stringify({ name: submitName.trim(), description: submitDesc.trim(), mapJson: submitJson.trim() }),
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        setSubmitting(false);
        if (data.error) { setSubmitError(data.error); }
        else {
          setShowSubmit(false); setSubmitName(''); setSubmitDesc(''); setSubmitJson('');
          loadMaps();
        }
      })
      .catch(function() { setSubmitting(false); setSubmitError('Network error.'); });
  }

  function handleRate(mapId, rating) {
    var token = getServerToken();
    if (!token) return;
    fetch('/api/maps/' + mapId + '/rate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
      body: JSON.stringify({ rating: rating }),
    })
      .then(function(r) { return r.json(); })
      .then(function() { loadMaps(); })
      .catch(function() {});
  }

  function handlePlay(mapId) {

    fetch('/api/maps/' + mapId)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.error || !data.mapJson) { alert(data.error || 'Failed to load map.'); return; }
        try {
          var mapData = typeof data.mapJson === 'string' ? JSON.parse(data.mapJson) : data.mapJson;

          if (typeof window._unmountCommunityMaps === 'function') window._unmountCommunityMaps();

          if (typeof window._mePlayCommunityMap === 'function') {
            window._mePlayCommunityMap(mapData);
          } else if (typeof window._meImportAndPlay === 'function') {
            window._meImportAndPlay(mapData);
          } else {
            alert('Map loading not available. Use the Map Editor to import manually.');
          }
        } catch (e) { alert('Invalid map data.'); }
      })
      .catch(function() { alert('Network error.'); });
  }

  function handleDelete(mapId) {
    if (!confirm('Delete this map? This cannot be undone.')) return;
    var token = getServerToken();
    if (!token) return;
    fetch('/api/maps/' + mapId, {
      method: 'DELETE',
      headers: { 'X-Auth-Token': token },
    })
      .then(function(r) { return r.json(); })
      .then(function() { loadMaps(); })
      .catch(function() {});
  }

  var sortBtn = function(id, label) {
    return h('button', {
      onClick: function() { setSort(id); },
      style: {
        padding: '5px 12px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
        background: sort === id ? EW.accent : 'rgba(255,255,255,0.06)',
        color: sort === id ? '#000' : EW.inkMute,
        border: 'none', fontFamily: 'DotGothic16, monospace',
      }
    }, label);
  };

  var myPlayerId = getServerId();

  return h('div', { style: {
    position: 'fixed', inset: 0, zIndex: 9990,
    background: EW.bg, color: EW.ink, overflowY: 'auto',
    fontFamily: 'DotGothic16, monospace',
  }},

    h('div', { style: {
      background: 'linear-gradient(180deg, rgba(20,24,38,0.95) 0%, ' + EW.bg + ' 100%)',
      borderBottom: '1px solid ' + EW.panelEdge,
      padding: '20px 24px 16px', textAlign: 'center',
    }},
      h('button', {
        onClick: function() { if (typeof window._unmountCommunityMaps === 'function') window._unmountCommunityMaps(); },
        style: {
          position: 'absolute', top: 16, left: 16,
          background: 'rgba(255,255,255,0.06)', border: '1px solid ' + EW.panelEdge,
          color: EW.inkMute, padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
          fontSize: 13, fontFamily: 'DotGothic16, monospace',
        }
      }, '← Back'),
      h('div', { style: { fontSize: 22, fontFamily: 'Cinzel Decorative, Cinzel, serif', fontWeight: 700, letterSpacing: 2 } }, '🗺️ COMMUNITY MAPS'),
      h('div', { style: { fontSize: 12, color: EW.inkMute, marginTop: 4 } }, 'Browse, play, and rate maps made by other players'),
    ),

    h('div', { style: { maxWidth: 800, margin: '0 auto', padding: '16px 16px 40px' } },

      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 } },
        h('div', { style: { display: 'flex', gap: 6 } },
          sortBtn('newest', '🕐 Newest'),
          sortBtn('popular', '🔥 Popular'),
          sortBtn('top_rated', '⭐ Top Rated'),
          sortBtn('featured', '✨ Featured'),
        ),
        h('button', {
          onClick: function() { setShowSubmit(!showSubmit); },
          style: {
            padding: '6px 16px', fontSize: 12, borderRadius: 6, cursor: 'pointer',
            background: EW.accent, color: '#000', border: 'none',
            fontFamily: 'DotGothic16, monospace', fontWeight: 700,
          }
        }, showSubmit ? '✕ Cancel' : '📤 Submit Map'),
      ),

      showSubmit ? h('div', { style: {
        background: EW.panel, border: '1px solid ' + EW.panelEdge,
        borderRadius: 8, padding: 16, marginBottom: 16,
      }},
        h('div', { style: { fontSize: 14, fontFamily: 'Cinzel, serif', fontWeight: 700, marginBottom: 10, color: EW.ink } }, 'Submit Your Map'),
        h('div', { style: { fontSize: 11, color: EW.inkMute, marginBottom: 10 } },
          'Export your map from the Map Editor (📋 Export button copies JSON to clipboard), then paste it below.'
        ),
        h('input', {
          type: 'text', placeholder: 'Map name (max 40 chars)', value: submitName, maxLength: 40,
          onChange: function(e) { setSubmitName(e.target.value); },
          style: {
            width: '100%', padding: '8px 12px', marginBottom: 8, fontSize: 13, borderRadius: 6,
            background: 'rgba(255,255,255,0.06)', border: '1px solid ' + EW.panelEdge,
            color: EW.ink, outline: 'none', fontFamily: 'DotGothic16, monospace', boxSizing: 'border-box',
          }
        }),
        h('input', {
          type: 'text', placeholder: 'Description (optional, max 200 chars)', value: submitDesc, maxLength: 200,
          onChange: function(e) { setSubmitDesc(e.target.value); },
          style: {
            width: '100%', padding: '8px 12px', marginBottom: 8, fontSize: 13, borderRadius: 6,
            background: 'rgba(255,255,255,0.06)', border: '1px solid ' + EW.panelEdge,
            color: EW.ink, outline: 'none', fontFamily: 'DotGothic16, monospace', boxSizing: 'border-box',
          }
        }),
        h('textarea', {
          placeholder: 'Paste map JSON here...', value: submitJson, rows: 4,
          onChange: function(e) { setSubmitJson(e.target.value); },
          style: {
            width: '100%', padding: '8px 12px', marginBottom: 8, fontSize: 11, borderRadius: 6,
            background: 'rgba(255,255,255,0.06)', border: '1px solid ' + EW.panelEdge,
            color: EW.ink, outline: 'none', fontFamily: 'DotGothic16, monospace', resize: 'vertical', boxSizing: 'border-box',
          }
        }),
        submitError ? h('div', { style: { color: EW.bad, fontSize: 12, marginBottom: 8 } }, submitError) : null,
        h('button', {
          onClick: handleSubmit, disabled: submitting,
          style: {
            padding: '8px 20px', fontSize: 13, borderRadius: 6, cursor: submitting ? 'wait' : 'pointer',
            background: EW.accent, color: '#000', border: 'none',
            fontFamily: 'DotGothic16, monospace', fontWeight: 700,
            opacity: submitting ? 0.6 : 1,
          }
        }, submitting ? 'Submitting...' : '📤 Submit'),
      ) : null,

      loading ? h('div', { style: { textAlign: 'center', color: EW.inkMute, padding: 40 } }, 'Loading maps...') :
      error ? h('div', { style: { textAlign: 'center', color: EW.bad, padding: 40 } }, error) :
      maps.length === 0 ? h('div', { style: { textAlign: 'center', color: EW.inkDim, padding: 40 } }, 'No community maps yet. Be the first to submit one!') :
      h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 } },
        maps.map(function(m) {
          var avgRating = m.rating ? parseFloat(m.rating) : 0;
          var stars = '';
          for (var si = 1; si <= 5; si++) stars += si <= Math.round(avgRating) ? '★' : '☆';
          var isMine = myPlayerId && m.authorId === myPlayerId;
          return h('div', { key: m.id, style: {
            background: EW.panel, border: '1px solid ' + (m.featured ? 'rgba(255,215,0,0.3)' : EW.panelEdge),
            borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 8,
          }},

            h('div', { style: { display: 'flex', alignItems: 'center', gap: 6 } },
              m.featured ? h('span', { style: { fontSize: 14 } }, '✨') : null,
              h('div', { style: { fontSize: 14, fontFamily: 'Cinzel, serif', fontWeight: 700, color: EW.ink, flex: 1 } }, m.name),
            ),

            h('div', { style: { fontSize: 11, color: EW.inkMute } },
              'by ' + m.authorName + ' · ' + m.width + '×' + m.height + ' · ' + m.teamSize + 'v' + m.teamSize
            ),

            m.description ? h('div', { style: { fontSize: 11, color: EW.inkDim } }, m.description) : null,

            h('div', { style: { display: 'flex', gap: 12, fontSize: 11 } },
              h('span', { style: { color: EW.warn } }, stars + (m.ratingCount > 0 ? ' (' + m.ratingCount + ')' : '')),
              h('span', { style: { color: EW.inkMute } }, '▶ ' + m.plays + ' plays'),
            ),

            h('div', { style: { display: 'flex', gap: 6, marginTop: 'auto' } },
              h('button', {
                onClick: function() { handlePlay(m.id); },
                style: {
                  flex: 1, padding: '6px 0', fontSize: 12, borderRadius: 4, cursor: 'pointer',
                  background: EW.accent, color: '#000', border: 'none',
                  fontFamily: 'DotGothic16, monospace', fontWeight: 600,
                }
              }, '▶ Play'),

              [1,2,3,4,5].map(function(r) {
                return h('button', {
                  key: r,
                  onClick: function() { handleRate(m.id, r); },
                  title: r + ' star' + (r > 1 ? 's' : ''),
                  style: {
                    padding: '6px 4px', fontSize: 12, borderRadius: 4, cursor: 'pointer',
                    background: 'rgba(255,255,255,0.06)', color: EW.warn, border: 'none',
                    minWidth: 24,
                  }
                }, r <= Math.round(avgRating) ? '★' : '☆');
              }),
              isMine ? h('button', {
                onClick: function() { handleDelete(m.id); },
                title: 'Delete your map',
                style: {
                  padding: '6px 8px', fontSize: 12, borderRadius: 4, cursor: 'pointer',
                  background: 'rgba(255,80,80,0.1)', color: EW.bad, border: 'none',
                }
              }, '🗑') : null,
            ),
          );
        })
      ),
    )
  );
}

function ProfilePage() {
  const [activeSlot, setActiveSlot] = React.useState(getActiveProfileIndex);
  const [profile, setProfile] = React.useState(null);
  const [tab, setTab] = React.useState('overview');
  const [editingName, setEditingName] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [showCreate, setShowCreate] = React.useState(false);
  const [, forceRender] = React.useState(0);

  const refresh = React.useCallback(() => {
    const idx = getActiveProfileIndex();
    setActiveSlot(idx);
    if (idx !== null) {
      setProfile(loadProfile(idx));
    } else {
      setProfile(null);
    }
  }, []);

  React.useEffect(() => { refresh(); }, [refresh]);

  if (profile === null && !showCreate) {
    return h(CreateProfileModal, {
      onCreated: () => { refresh(); setShowCreate(false); },
    });
  }
  if (showCreate) {
    return h(CreateProfileModal, {
      onCreated: () => { refresh(); setShowCreate(false); },
      onCancel: () => setShowCreate(false),
    });
  }

  const rank = getRankInfo(profile.elo);
  const winRate = profile.career.matchesPlayed > 0 ? ((profile.career.wins / profile.career.matchesPlayed) * 100).toFixed(1) + '%' : '—';

  const slots = [];
  for (let i = 0; i < MAX_PROFILES; i++) {
    const p = loadProfile(i);
    slots.push(p);
  }

  const switchProfile = (i) => {
    if (!loadProfile(i)) return;
    setActiveProfileIndex(i);
    refresh();
  };

  const handleDelete = (i) => {
    const p = loadProfile(i);
    if (!p) return;
    if (!confirm('Delete profile "' + p.username + '"? This cannot be undone.')) return;
    deleteProfile(i);
    refresh();
  };

  const handleRename = () => {
    if (!isValidUsername(newName)) return;
    const idx = getActiveProfileIndex();
    const p = loadProfile(idx);
    if (!p) return;
    p.username = newName;
    saveProfile(idx, p);
    setEditingName(false);
    refresh();
  };

  const tabBtn = (id, label) => h('button', {
    onClick: () => setTab(id),
    style: {
      padding: '8px 18px', fontSize: 12, borderRadius: '6px 6px 0 0', cursor: 'pointer',
      background: tab === id ? EW.panel : 'transparent',
      color: tab === id ? EW.ink : EW.inkMute,
      border: tab === id ? '1px solid ' + EW.panelEdge : '1px solid transparent',
      borderBottom: tab === id ? '1px solid transparent' : '1px solid ' + EW.panelEdge,
      fontFamily: 'Cinzel, serif', fontWeight: tab === id ? 700 : 400,
    }
  }, label);

  return h('div', { style: {
    position: 'fixed', inset: 0, zIndex: 9990,
    background: EW.bg, color: EW.ink, overflowY: 'auto',
    fontFamily: 'DotGothic16, monospace',
  }},

    h('div', { style: {
      background: 'linear-gradient(180deg, rgba(20,24,38,0.95) 0%, ' + EW.bg + ' 100%)',
      borderBottom: '1px solid ' + EW.panelEdge,
      padding: '20px 24px 12px',
    }},

      h('button', {
        onClick: () => { if (typeof window._unmountReactProfile === 'function') window._unmountReactProfile(); },
        style: {
          position: 'absolute', top: 16, left: 16,
          background: 'rgba(255,255,255,0.06)', border: '1px solid ' + EW.panelEdge,
          color: EW.inkMute, padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
          fontSize: 13, fontFamily: 'DotGothic16, monospace',
        }
      }, '← Back'),

      h('div', { style: { display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 } },
        slots.map((s, i) => h('button', {
          key: i,
          onClick: () => s ? switchProfile(i) : setShowCreate(true),
          style: {
            padding: '6px 16px', borderRadius: 6, cursor: 'pointer',
            background: i === activeSlot ? EW.accent : (s ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)'),
            color: i === activeSlot ? '#000' : (s ? EW.inkMute : EW.inkDim),
            border: '1px solid ' + (i === activeSlot ? EW.accent : EW.panelEdge),
            fontSize: 12, fontFamily: 'DotGothic16, monospace', fontWeight: i === activeSlot ? 700 : 400,
          }
        }, s ? s.username : '+ New')),

        h('button', {
          onClick: () => handleDelete(activeSlot),
          title: 'Delete profile',
          style: {
            padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
            background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.2)',
            color: EW.bad, fontSize: 12,
          }
        }, '🗑'),
      ),

      h('div', { style: { textAlign: 'center' } },
        editingName ? h('div', { style: { display: 'inline-flex', gap: 6, alignItems: 'center' } },
          h('input', {
            value: newName, onChange: e => setNewName(e.target.value),
            onKeyDown: e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditingName(false); },
            autoFocus: true, maxLength: 16,
            style: {
              padding: '6px 12px', fontSize: 18, fontFamily: 'Cinzel, serif',
              background: 'rgba(255,255,255,0.06)', border: '1px solid ' + EW.panelEdge,
              color: EW.ink, borderRadius: 6, outline: 'none', textAlign: 'center', width: 180,
            }
          }),
          h('button', { onClick: handleRename, style: { fontSize: 14, cursor: 'pointer', background: 'none', border: 'none', color: EW.good } }, '✓'),
          h('button', { onClick: () => setEditingName(false), style: { fontSize: 14, cursor: 'pointer', background: 'none', border: 'none', color: EW.bad } }, '✕'),
        ) : h('div', {
          onClick: () => { setNewName(profile.username); setEditingName(true); },
          style: { fontSize: 24, fontFamily: 'Cinzel, serif', fontWeight: 700, cursor: 'pointer', display: 'inline-block' },
          title: 'Click to edit username',
        }, profile.username),
        h('div', { style: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 8 } },
          h('span', { style: { fontSize: 18 } }, rank.icon),
          h('span', { style: { fontSize: 14, color: rank.color, fontWeight: 600 } }, rank.name),
          h('span', { style: { fontSize: 16, color: EW.ink, fontWeight: 700 } }, profile.elo),
          h('span', { style: { fontSize: 12, color: EW.inkMute } }, winRate + ' win rate'),
        ),
      ),
    ),

    h('div', { style: { display: 'flex', padding: '0 24px', borderBottom: '1px solid ' + EW.panelEdge } },
      tabBtn('overview', 'Overview'),
      tabBtn('history', 'Match History'),
      tabBtn('champions', 'Champions'),
      tabBtn('achievements', 'Achievements'),
    ),

    h('div', { style: { padding: '0 24px', maxWidth: 900, margin: '0 auto' } },
      tab === 'overview' ? h(OverviewTab, { profile }) : null,
      tab === 'history' ? h(MatchHistoryTab, { profile }) : null,
      tab === 'champions' ? h(ChampionsTab, { profile }) : null,
      tab === 'achievements' ? h(AchievementsTab, { profile }) : null,
    ),
  );
}

let _profileRoot = null;

window._mountReactProfile = function() {
  let container = document.getElementById('profileOverlay');
  if (!container) {
    container = document.createElement('div');
    container.id = 'profileOverlay';
    document.body.appendChild(container);
  }
  if (!_profileRoot) {
    _profileRoot = ReactDOM.createRoot(container);
  }
  _profileRoot.render(h(ProfilePage));
};

window._unmountReactProfile = function() {
  if (_profileRoot) {
    _profileRoot.unmount();
    _profileRoot = null;
  }
  const el = document.getElementById('profileOverlay');
  if (el) el.innerHTML = '';
};

window._refreshReactProfile = function() {
  if (_profileRoot) {
    _profileRoot.render(h(ProfilePage));
  }
};

let _leaderboardRoot = null;

window._mountLeaderboard = function() {
  let container = document.getElementById('leaderboardOverlay');
  if (!container) {
    container = document.createElement('div');
    container.id = 'leaderboardOverlay';
    document.body.appendChild(container);
  }
  if (!_leaderboardRoot) {
    _leaderboardRoot = ReactDOM.createRoot(container);
  }
  _leaderboardRoot.render(h(LeaderboardPage));
};

window._unmountLeaderboard = function() {
  if (_leaderboardRoot) {
    _leaderboardRoot.unmount();
    _leaderboardRoot = null;
  }
  const el = document.getElementById('leaderboardOverlay');
  if (el) el.innerHTML = '';
};

let _communityMapsRoot = null;

window._mountCommunityMaps = function() {
  let container = document.getElementById('communityMapsOverlay');
  if (!container) {
    container = document.createElement('div');
    container.id = 'communityMapsOverlay';
    document.body.appendChild(container);
  }
  if (!_communityMapsRoot) {
    _communityMapsRoot = ReactDOM.createRoot(container);
  }
  _communityMapsRoot.render(h(CommunityMapsPage));
};

window._unmountCommunityMaps = function() {
  if (_communityMapsRoot) {
    _communityMapsRoot.unmount();
    _communityMapsRoot = null;
  }
  const el = document.getElementById('communityMapsOverlay');
  if (el) el.innerHTML = '';
};

migrateOldData();

try {
  serverAutoLogin();
} catch(e) {  }

window._mePlayCommunityMap = function(mapData) {

  if (typeof window._meImport === 'function') {

  }

  if (typeof window._customEditorBoard !== 'undefined') {

    window._customEditorBoard = null;
  }

  if (typeof window._meSetAndPlay === 'function') {
    window._meSetAndPlay(mapData);
    return;
  }

  try {
    var w = mapData.w, ht = mapData.h;
    var board = [];
    for (var y = 0; y < ht; y++) {
      var row = [];
      for (var x = 0; x < w; x++) {
        var tid = mapData.grid[y] && mapData.grid[y][x] || 0;
        var tKey = (typeof ME_TERRAIN_IDS !== 'undefined' && ME_TERRAIN_IDS[tid]) ? ME_TERRAIN_IDS[tid] : 'grass';
        row.push(tid === 0 ? 'blank' : tKey);
      }
      board.push(row);
    }
    var spawns = mapData.spawns || { 1: [], 2: [] };
    var teamSize = Math.max(1, Math.min(spawns[1].length, spawns[2].length));

    if (typeof GAME_MODES !== 'undefined') {
      GAME_MODES['_custom_community'] = {
        id: '_custom_community',
        label: 'Community',
        desc: w + '×' + ht + ' community map',
        boardSize: Math.max(w, ht),
        boardWidth: w,
        boardHeight: ht,
        teamSize: teamSize,
        winHourglasses: Math.max(1, Math.floor(teamSize / 2)),
        hiddenItemSpawns: Math.floor((w * ht) / 20),
        blitzMode: true,
        hasTowers: false,
        terrainPatches: { water: [0,0,0], desert: [0,0,0], mountain: [0,0,0] },
        spawns: {
          1: spawns[1].map(function(s) { return { x: s.x, y: s.y }; }),
          2: spawns[2].map(function(s) { return { x: s.x, y: s.y }; })
        },
        defaultBuilds: {
          1: Array(teamSize).fill('Warrior'),
          2: Array(teamSize).fill('Warrior')
        }
      };
    }

    window._customEditorBoard = board;

    if (mapData.objects) {
      var objBoard = [];
      for (var oy = 0; oy < ht; oy++) {
        var oRow = [];
        for (var ox = 0; ox < w; ox++) {
          var stk = Array.isArray(mapData.objects[oy] && mapData.objects[oy][ox]) ? mapData.objects[oy][ox] : [];
          if (!stk.length) { oRow.push(null); continue; }
          oRow.push(stk.map(function(e) {
            return {
              key: (typeof ME_OBJECT_IDS !== 'undefined' && ME_OBJECT_IDS[e.oid]) || null,
              alignX: e.alignX || 'center', alignY: e.alignY || 'bottom',
              rot: e.rot || 0, flipX: !!e.flipX, flipY: !!e.flipY
            };
          }).filter(function(e) { return e.key; }));
        }
        objBoard.push(oRow);
      }
      window._customEditorObjects = objBoard;
    }

    if (mapData.heights) {
      window._customEditorHeights = mapData.heights;
    }

    if (mapData.voxels) {
      window._customEditorVoxels = mapData.voxels.map(function(row) {
        return row.map(function(col) {
          return (col || []).map(function(b) {
            var entry = { z: b.z, terrain: (typeof ME_TERRAIN_IDS !== 'undefined' && ME_TERRAIN_IDS[b.tid]) || 'grass' };
            if (b.sd) entry.stairDir = b.sd;
            return entry;
          });
        });
      });
    }
    if (mapData.sanctuaryZones) {
      window._customEditorSanctuaryZones = mapData.sanctuaryZones.map(function(r) { return r.slice(); });
    }

    if (typeof applyGameMode === 'function') applyGameMode('_custom_community');
    if (typeof CONFIG !== 'undefined') CONFIG.teamSize = teamSize;

    state.controllers[1] = (typeof CTRL !== 'undefined') ? CTRL.HUMAN : 'human';
    state.controllers[2] = (typeof CTRL !== 'undefined') ? CTRL.AI : 'ai';
    state.showPlayer2Builder = false;
    state.squadLeaderMode = false;
    state.isRankedMatch = false;
    if (typeof MULTIPLAYER_MODES !== 'undefined') state.activeMultiplayerMode = 'arena';

    if (typeof dismissTitleScreen === 'function') dismissTitleScreen();
    if (typeof render === 'function') render();
    state.audioUnlocked = true;
    if (typeof syncMusicToState === 'function') syncMusicToState().catch(function(){});
  } catch (e) {
    console.error('[COMMUNITY] Failed to load map:', e);
    alert('Failed to load community map.');
  }
};

})();
