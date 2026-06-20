// Entropy Wars — one-time FILLER BOT account registration.
//
// Mints bot accounts on the server (via /api/register) and saves their tokens to
// bots.tokens.json (gitignored), which bots.js reads. Authenticated bots make
// ranked matches count for the human's ELO. Re-running tops up to the requested
// count and keeps any accounts you already have.
//
//   node bot_register.js [count]            default count = 3
//   BOT_SERVER_URL=https://your-host node bot_register.js 4
//   BOT_NAME_PREFIX=Filler_ node bot_register.js 3   (names: Filler_1, Filler_2, …)
//
// Requires the server's database (Cloudflare D1) to be configured — otherwise
// /api/register returns 503 and there is nothing to register against.

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const SERVER_URL = process.env.BOT_SERVER_URL || 'http://localhost:3000';
const PREFIX = process.env.BOT_NAME_PREFIX || 'Filler_';
const COUNT = parseInt(process.argv[2], 10) || 3;
const TOKENS_FILE = path.join(__dirname, 'bots.tokens.json');
const USERNAME_RE = /^[A-Za-z0-9_]{2,16}$/;

function postJSON(url, payload) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const body = JSON.stringify(payload);
    const u = new URL(url);
    const req = lib.request({
      hostname: u.hostname, port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => { let j = {}; try { j = JSON.parse(data); } catch (e) {} resolve({ status: res.statusCode, body: j }); });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => req.destroy(new Error('timeout')));
    req.write(body); req.end();
  });
}

(async () => {
  let accounts = [];
  try { if (fs.existsSync(TOKENS_FILE)) accounts = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8')); } catch (e) {}
  if (!Array.isArray(accounts)) accounts = [];
  console.log(`Have ${accounts.length} account(s); target ${COUNT}. Server: ${SERVER_URL}`);

  let n = 0, attempts = 0;
  while (accounts.length < COUNT && attempts < COUNT + 50) {
    attempts++;
    n++;
    const username = `${PREFIX}${n}`;
    if (!USERNAME_RE.test(username)) { console.error(`Invalid bot name "${username}" (2-16 alphanumerics/underscore). Adjust BOT_NAME_PREFIX.`); break; }
    if (accounts.some(a => a.username === username)) continue; // already have it

    let resp;
    try { resp = await postJSON(SERVER_URL + '/api/register', { username }); }
    catch (e) { console.error(`register ${username} failed: ${e.message}`); break; }

    if (resp.status === 200 && resp.body && resp.body.token) {
      accounts.push({ id: resp.body.id, token: resp.body.token, username: resp.body.username, elo: resp.body.elo || 1200 });
      console.log(`  ✓ registered ${username}`);
    } else if (resp.status === 409) {
      // name taken by someone else (we don't hold its token) — try the next number
      continue;
    } else if (resp.status === 503) {
      console.error('Server has no database configured (503). Set CF_ACCOUNT_ID / CF_D1_DATABASE_ID / CF_API_TOKEN on the server, then retry.');
      break;
    } else {
      console.error(`  ✗ ${username}: ${resp.status} ${JSON.stringify(resp.body)}`);
      break;
    }
  }

  fs.writeFileSync(TOKENS_FILE, JSON.stringify(accounts, null, 2));
  console.log(`Wrote ${accounts.length} account(s) to ${TOKENS_FILE}`);
  if (accounts.length < COUNT) process.exitCode = 1;
})();
