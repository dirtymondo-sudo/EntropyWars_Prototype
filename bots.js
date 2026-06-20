// Entropy Wars — FILLER BOT MANAGER.
//
// Keeps "enough bots online that someone can always find a match" WITHOUT a
// standing army of idle browsers. It polls the matchmaking server and only
// summons a bot when a real human has been stuck alone in a queue past a
// threshold — an on-demand filler. One bot per lonely queue (never bot-vs-bot),
// capped total concurrency. Each bot is a headless browser (bot_client.js) that
// plays one match then exits.
//
// Run it on the SAME box as the game server (so it can hit it over localhost and
// reuse the on-disk asset cache):
//
//   node bots.js
//
// First, mint some bot accounts once (so ranked ELO counts for the human):
//   node bot_register.js 3        # writes bots.tokens.json
// Without accounts it still works, but matches are unauthenticated (no ELO).
//
// Tunables (env vars, all optional):
//   BOT_SERVER_URL        default http://localhost:3000
//   BOT_FILL_WAIT_MS      default 20000   how long a human waits alone before a bot is summoned
//   BOT_POLL_MS           default 4000    queue poll interval
//   BOT_MAX_CONCURRENT    default 2       max simultaneous bots
//   BOT_QUEUE_TIMEOUT_MS  default 60000   a summoned bot leaves the queue if unmatched
//   BOT_MODES             default *       comma list to restrict which modes get filled (e.g. "arena,tdm")
//   BOT_HEADLESS          default 1       set 0 to watch a bot in a real window

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { runBot } = require('./bot_client');

const SERVER_URL = process.env.BOT_SERVER_URL || 'http://localhost:3000';
const FILL_WAIT_MS = parseInt(process.env.BOT_FILL_WAIT_MS, 10) || 20000;
const POLL_MS = parseInt(process.env.BOT_POLL_MS, 10) || 4000;
const MAX_CONCURRENT = parseInt(process.env.BOT_MAX_CONCURRENT, 10) || 2;
const QUEUE_TIMEOUT_MS = parseInt(process.env.BOT_QUEUE_TIMEOUT_MS, 10) || 60000;
const HEADLESS = process.env.BOT_HEADLESS !== '0';
const MODE_FILTER = (process.env.BOT_MODES || '').split(',').map(s => s.trim()).filter(Boolean);
// Pin each summoned bot to within ±BOT_ELO_JITTER of the waiting human so the
// match forms instantly and the human's ELO swing is fair. Needs the same
// BOT_ADMIN_SECRET set on the server; without it, bots queue at their own ELO.
const ADMIN_SECRET = process.env.BOT_ADMIN_SECRET || '';
const ELO_JITTER = parseInt(process.env.BOT_ELO_JITTER, 10) || 100;

const TOKENS_FILE = path.join(__dirname, 'bots.tokens.json');

function ts() { return new Date().toISOString().replace('T', ' ').slice(0, 19); }
function log(...a) { console.log(`[bots ${ts()}]`, ...a); }

// ── load bot accounts (optional) ──
let ACCOUNTS = [];
try {
  if (fs.existsSync(TOKENS_FILE)) {
    const raw = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
    ACCOUNTS = (Array.isArray(raw) ? raw : raw.accounts || []).filter(a => a && a.token && a.username);
  }
} catch (e) { log('could not read bots.tokens.json:', e.message); }
if (ACCOUNTS.length) log(`loaded ${ACCOUNTS.length} bot account(s): ${ACCOUNTS.map(a => a.username).join(', ')}`);
else log('no bot accounts found (bots.tokens.json) — running UNAUTHENTICATED (matches will not award ELO)');

// ── tiny JSON GET ──
function getJSON(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
    });
    req.on('error', reject);
    req.setTimeout(8000, () => req.destroy(new Error('timeout')));
  });
}

// ── tiny JSON POST ──
function postJSON(url, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const body = JSON.stringify(payload);
    const u = new URL(url);
    const req = lib.request({
      hostname: u.hostname, port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname, method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }, headers),
    }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => { let j = {}; try { j = JSON.parse(data); } catch (e) {} resolve({ status: res.statusCode, body: j }); });
    });
    req.on('error', reject);
    req.setTimeout(8000, () => req.destroy(new Error('timeout')));
    req.write(body); req.end();
  });
}

// Pin a bot account's ELO to ~targetElo (±ELO_JITTER). Returns the ELO actually set.
async function syncBotElo(account, targetElo) {
  const jitter = Math.floor(Math.random() * (2 * ELO_JITTER + 1)) - ELO_JITTER;
  const want = Math.max(100, Math.round(targetElo + jitter));
  const r = await postJSON(SERVER_URL + '/api/bot/sync-elo', { token: account.token, elo: want }, { 'x-bot-secret': ADMIN_SECRET });
  if (r.status !== 200 || !r.body || !r.body.ok) throw new Error(`sync-elo ${r.status} ${JSON.stringify(r.body)}`);
  return r.body.elo;
}

// ── live bot tracking ──
const busyAccounts = new Set();   // usernames currently in a match
const queueLocks = new Set();     // queueKeys with an outstanding bot (launch→exit)
let anonCount = 0;                // synthetic ids for unauthenticated bots
let active = 0;

function pickAccount() {
  for (const a of ACCOUNTS) if (!busyAccounts.has(a.username)) return a;
  return null;
}

async function launch(queueKey, teamSize, mode, humanElo) {
  const account = pickAccount(); // may be null → unauthenticated
  if (ACCOUNTS.length && !account) { log(`want a bot for ${queueKey} but all accounts busy`); return; }

  const who = account ? account.username : `anon#${++anonCount}`;
  // Reserve synchronously (before any await) so the next poll won't double-launch.
  if (account) busyAccounts.add(account.username);
  queueLocks.add(queueKey);
  active++;
  log(`→ summoning ${who} into ${queueKey} (active=${active})`);

  // Pin to ~human ELO so the match forms immediately and the swing is fair.
  if (account && ADMIN_SECRET && typeof humanElo === 'number') {
    try { const set = await syncBotElo(account, humanElo); account.elo = set; log(`   ${who} ELO set ≈ ${set} (human ~${humanElo})`); }
    catch (e) { log(`   ELO sync failed for ${who}: ${e.message} — queuing at own ELO`); }
  } else if (account && !ADMIN_SECRET && typeof humanElo === 'number') {
    log(`   (BOT_ADMIN_SECRET unset — ${who} queues at its own ELO ${account.elo || '?'}, not matched to the human's)`);
  }

  runBot({
    serverUrl: SERVER_URL,
    teamSize,
    mode,
    account,
    elo: typeof humanElo === 'number' ? humanElo : undefined, // skill scales to the player even if unauthenticated
    headless: HEADLESS,
    queueTimeoutMs: QUEUE_TIMEOUT_MS,
    log: (...a) => console.log(`[bot ${who}]`, ...a),
  }).then(r => {
    log(`← ${who} done: ${JSON.stringify(r)}`);
  }).catch(e => {
    log(`← ${who} errored: ${e.message}`);
  }).finally(() => {
    if (account) busyAccounts.delete(account.username);
    queueLocks.delete(queueKey);
    active--;
  });
}

async function tick() {
  let stats;
  try { stats = await getJSON(SERVER_URL + '/api/queue-stats'); }
  catch (e) { log('queue-stats fetch failed:', e.message); return; }

  const queues = (stats && stats.queues) || {};
  for (const queueKey of Object.keys(queues)) {
    const q = queues[queueKey];
    if (!q || typeof q !== 'object') continue; // old server shape (plain counts) → skip safely

    const [tsStr, mode] = queueKey.split(':');
    const teamSize = parseInt(tsStr, 10) || 4;
    if (MODE_FILTER.length && !MODE_FILTER.includes(mode)) continue;

    const lonely = (q.humans % 2) === 1;             // at least one unpaired human
    const noBotYet = (q.bots || 0) === 0 && !queueLocks.has(queueKey);
    const waitedEnough = (q.oldestHumanWaitMs || 0) >= FILL_WAIT_MS;

    if (lonely && noBotYet && waitedEnough) {
      if (active >= MAX_CONCURRENT) { log(`max concurrency (${MAX_CONCURRENT}) reached — ${queueKey} must wait`); continue; }
      // launch() reserves its slot synchronously, so not awaiting here is safe.
      launch(queueKey, teamSize, mode, typeof q.oldestHumanElo === 'number' ? q.oldestHumanElo : undefined);
    }
  }
}

if (ADMIN_SECRET && ACCOUNTS.length) log(`ELO matching ON — bots pinned within ±${ELO_JITTER} of the waiting player`);
else if (ACCOUNTS.length) log(`ELO matching OFF (no BOT_ADMIN_SECRET) — bots queue at their own ELO; far-from-1200 players may match slowly/unevenly`);
log(`watching ${SERVER_URL} — fill after ${FILL_WAIT_MS}ms wait, max ${MAX_CONCURRENT} bots${MODE_FILTER.length ? `, modes=${MODE_FILTER.join(',')}` : ''}`);
let polling = false;
setInterval(async () => {
  if (polling) return; // don't overlap slow ticks
  polling = true;
  try { await tick(); } finally { polling = false; }
}, POLL_MS);

process.on('SIGINT', () => { log('shutting down'); process.exit(0); });
process.on('SIGTERM', () => { log('shutting down'); process.exit(0); });
