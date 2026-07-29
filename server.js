const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const d1 = require('./d1');

const app = express();
app.disable('x-powered-by');
// Render (and any reverse proxy) fronts this server — trust one hop of
// X-Forwarded-For so req.ip is the real client IP for HTTP rate limiting.
app.set('trust proxy', 1);
const server = http.createServer(app);
// EW_ALLOWED_ORIGINS: optional comma-separated origin allowlist for the
// socket layer (e.g. "https://entropywars.net,http://localhost:3000").
// Unset = '*' (current behavior). Set it in production so arbitrary sites
// can't open sockets against the matchmaker from their visitors' browsers.
const ALLOWED_ORIGINS = (process.env.EW_ALLOWED_ORIGINS || '')
    .split(',').map(s => s.trim()).filter(Boolean);
const io = new Server(server, {
    cors: { origin: ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : '*' },
    transports: ['websocket', 'polling']
});

// gzip everything Express serves (index.html alone drops ~110KB → ~25KB).
// Optional so a stale node_modules can't crash the server.
try { app.use(require('compression')()); } catch (e) { console.warn('[BOOT] compression middleware unavailable:', e.message); }

app.use(express.json());

// ── HTTP RATE LIMITING ─────────────────────────────────────────────────
// Same token-bucket idea as the socket-event limiter below, keyed per
// client IP per route group. The D1-writing endpoints get tight buckets;
// read-only endpoints just need flood protection. In-memory on purpose —
// single-process server, and a restart forgiving everyone is fine.
const _httpBuckets = new Map(); // "<group>|<ip>" -> { tokens, last }
function httpRateLimit(group, perMinute, burst) {
    return (req, res, next) => {
        const key = group + '|' + (req.ip || req.socket.remoteAddress || 'unknown');
        const now = Date.now();
        let b = _httpBuckets.get(key);
        if (!b) { b = { tokens: burst, last: now }; _httpBuckets.set(key, b); }
        b.tokens = Math.min(burst, b.tokens + ((now - b.last) / 60000) * perMinute);
        b.last = now;
        if (b.tokens < 1) {
            res.set('Retry-After', '60');
            return res.status(429).json({ error: 'Too many requests — slow down.' });
        }
        b.tokens -= 1;
        next();
    };
}
setInterval(() => {
    const cutoff = Date.now() - 10 * 60 * 1000;
    for (const [k, b] of _httpBuckets) if (b.last < cutoff) _httpBuckets.delete(k);
}, 10 * 60 * 1000);
const limitAuth = httpRateLimit('auth', 15, 10);        // register/login
const limitEcon = httpRateLimit('econ', 30, 20);        // wallet reads + writes
const limitRead = httpRateLimit('read', 120, 60);       // profiles/leaderboard/maps browse
const limitMapWrite = httpRateLimit('map-write', 10, 10); // map submit/rate/delete

// Serve ONLY the entry page. Every script/style/asset the game uses loads
// from the CDN, so blanket express.static(__dirname) exposed things that must
// never be public: server.js itself (guard/anti-cheat logic), the internal
// docs, the .git directory, and ./replays/ (per-match logs). Opt back into
// full-directory serving for local tinkering with EW_DEV_STATIC=1.
if (process.env.EW_DEV_STATIC === '1') {
    app.use(express.static(path.join(__dirname), {
        extensions: ['html'],
        index: 'index.html'
    }));
} else {
    const INDEX_HTML = path.join(__dirname, 'index.html');
    app.get(['/', '/index.html'], (req, res) => {
        // Must stay revalidated so a ?v= cache-bust token bump is seen
        // immediately — the CDN assets are immutable, the entry page is not.
        res.set('Cache-Control', 'no-cache');
        res.sendFile(INDEX_HTML);
    });
}

function uuid() { return crypto.randomUUID(); }

// ── ACCOUNT ECONOMY (PvP) — server-authoritative wallet + unlock system ──
// data.js is browser-only (assigns to `window`), so the server keeps its own
// copy of the economy constants + race list. Keep these in sync with data.js.
const ACCT_UNIT_PRICE     = 5000;
const ACCT_STARTING_GOLD  = 0;
const ACCT_FREE_TOKENS    = 1;
const ACCT_MATCH_GOLD_CAP = 5000;
const ACCT_PVP_MODES = new Set(['arena', 'tdm', 'clash']);
const ACCT_STARTER_UNITS = [
    'men in black', 'wizard', 'werewolf', 'mad scientist', 'homosapien', 'catgirl',
    'fortune teller', 'bigfoot', 'grey', 'marksman', 'knight', 'fairy',
    'telepath', 'quarterback', 'ki fighter', 'cowboy', 'atlantean', 'pirate', 'vampire',
    'shaman', 'giant', 'halfdemon',
    // 2026-07-06: new rigged 3D models wired in sprites.js
    'martian', 'machine elves', 'nordic', 'annunaki', 'demon',
    // 2026-07-11: batch-upload wave (sprites.js RACE_MODELS_3D)
    'scarecrow', 'santa clause', 'mermaid', 'anubis',
    'robinhood', 'antperson', 'necromancer', 'succubus', 'barbarella',
    'king arthur', 'mantid', 'mech', 'minotaur', 'mothman', 'reptilian',
    'robot', 'cyborg',
    // 2026-07-13 batch (was missing here — client data.js had them already)
    'swordfighter', 'zombie', 'fallen angel',
    // 2026-07-19 batch + the never-listed nun (keep in sync with data.js
    // ACCT_STARTER_UNITS; login unions this list into existing accounts)
    'priest',
    'yeti', 'skeleton', 'kaiju', 'superhero', 'demon princess',
    'voidweaver', 'honda civic',
    // 2026-07-22 batch (divine host wave)
    'valkraye', 'angel', 'ghost', 'nephilim',
    // 2026-07-24 batch
    'djinn', 'orb of light',
    // 2026-07-25 batch (monsters & main characters)
    'gnome', 'king kong', 'goatman', 'kraken',
    'politician', 'conspiracy theorist', 'overlord',
];
const AVAILABLE_RACES = new Set(['homosapien', 'pirate', 'knight', 'shaman', 'mad scientist', 'cowboy', 'men in black', 'telepath', 'marksman', 'priest', 'wizard', 'fortune teller', 'giant', 'fairy', 'martian', 'nordic', 'grey', 'bigfoot', 'shadow entity', 'reptilian', 'ai', 'robot', 'android', 'angel', 'seraphim', 'orb of light', 'demon', 'succubus', 'skeleton', 'mech', 'ghost', 'zombie', 'annunaki', 'skinwalker', 'werewolf', 'gargoyle', 'djinn', 'anubis', 'catgirl', 'mantid', 'antperson', 'mothman', 'siren', 'scarecrow', 'glitch', 'machine elves', 'cyclops', 'cyborg', 'demon prince', 'demon princess', 'dreameater', 'fallen angel', 'goatman', 'halfdemon', 'mermaid', 'nephilim', 'vampire', 'voidweaver', 'cosmic wraith', 'superhero', 'general', 'droid', 'antihero', 'conspiracy theorist', 'overlord', 'chosen one', 'politician', 'atlantean', 'dinosaur', 'dragon', 'ghoul', 'gnome', 'kaiju', 'kraken', 'loch ness monster', 'yeti', 'barbarella', 'black goo', 'golem', 'honda civic', 'ice queen', 'juggernaut', 'ki fighter', 'king arthur', 'king kong', 'minotaur', 'necromancer', 'occulus', 'quarterback', 'robinhood', 'santa clause', 'super sentai', 'swordfighter', 'symbiote', 'valkraye', 'watcher']);

// data.js is the canonical source for the economy. The literals above are the
// hand-synced FALLBACK — keep them as plain `const NAME = <literal>`, because
// check-data-parity.js extracts them from this file's source text. At boot we
// load data.js headlessly (load-data.js vm sandbox) and copy the REAL values
// into ECON; runtime code reads ECON.* only, so a drifted literal shows up as
// a parity-test failure instead of live server behavior.
const ECON = {
    ACCT_UNIT_PRICE, ACCT_STARTING_GOLD, ACCT_FREE_TOKENS, ACCT_MATCH_GOLD_CAP,
    ACCT_PVP_MODES, ACCT_STARTER_UNITS, AVAILABLE_RACES,
};
(function deriveEconomyFromDataJs() {
    let data;
    try {
        data = require('./load-data').loadGameData();
    } catch (e) {
        console.error('[ECON] FAILED to load data.js — running on hand-synced fallback literals:', e.message);
        return;
    }
    const bad = [];
    const asList = v => (v instanceof Set) ? [...v] : (Array.isArray(v) ? v : null);
    for (const k of ['ACCT_UNIT_PRICE', 'ACCT_STARTING_GOLD', 'ACCT_FREE_TOKENS', 'ACCT_MATCH_GOLD_CAP']) {
        if (typeof data[k] === 'number' && Number.isFinite(data[k])) ECON[k] = data[k];
        else bad.push(k);
    }
    for (const k of ['ACCT_PVP_MODES', 'AVAILABLE_RACES']) {
        const list = asList(data[k]);
        if (list && list.length) ECON[k] = new Set(list); // server code calls .has()
        else bad.push(k);
    }
    {
        const list = asList(data.ACCT_STARTER_UNITS);
        if (list && list.length) ECON.ACCT_STARTER_UNITS = list.slice();
        else bad.push('ACCT_STARTER_UNITS');
    }
    if (bad.length) console.error('[ECON] data.js loaded but missing/invalid: ' + bad.join(', ') + ' — fallback literals kept for those');
    console.log(`[ECON] economy derived from data.js (${ECON.ACCT_STARTER_UNITS.length} starters, ${ECON.AVAILABLE_RACES.size} races, unit price ${ECON.ACCT_UNIT_PRICE})`);
})();

// ── D1 SCHEMA MIGRATIONS ───────────────────────────────────────────────
// Versioned SQL files under ./migrations, applied in filename order and
// recorded in a schema_migrations table. "duplicate column" / "already
// exists" errors are tolerated so the runner converges on the live database
// (built by hand + the old ad-hoc economy ALTERs before this existed).
// Schema changes go in a NEW NNN_*.sql file — never ad-hoc ALTERs in code.
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

function splitSqlStatements(sql) {
    return sql
        .split('\n').filter(l => !l.trim().startsWith('--')).join('\n')
        .split(';')
        .map(s => s.trim())
        .filter(Boolean);
}

async function runMigrations() {
    await d1.execute("CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (datetime('now')))");
    const applied = new Set((await d1.getAll('SELECT id FROM schema_migrations')).map(r => r.id));
    let files = [];
    try { files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort(); }
    catch (e) { console.warn('[DB] migrations directory missing:', e.message); return; }
    for (const file of files) {
        if (applied.has(file)) continue;
        const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
        for (const stmt of splitSqlStatements(sql)) {
            try { await d1.execute(stmt); }
            catch (e) {
                const msg = (e.message || '').toLowerCase();
                if (msg.includes('duplicate column') || msg.includes('already exists')) continue;
                throw new Error(`migration ${file}: ${e.message}`);
            }
        }
        await d1.execute('INSERT INTO schema_migrations (id) VALUES (?1)', [file]);
        console.log('[DB] applied migration:', file);
    }
}

// Single-flight wrapper: endpoints hitting the DB concurrently on a cold
// boot must not race the runner (a double INSERT into schema_migrations
// would throw). A failed run clears itself so the next request retries.
let _migrationsPromise = null;
function ensureMigrations() {
    if (!d1.isConfigured()) return Promise.resolve();
    if (!_migrationsPromise) {
        _migrationsPromise = runMigrations().catch(err => {
            _migrationsPromise = null;
            throw err;
        });
    }
    return _migrationsPromise;
}

// ── ACCOUNT TOKENS — hashed at rest ────────────────────────────────────
// Only SHA-256(token) is stored and queried (players.token_hash); the
// plaintext column keeps a '#'-prefixed tombstone purely to satisfy its
// UNIQUE constraint. A D1 leak therefore no longer leaks login credentials.
// Legacy plaintext rows still match via the fallback lookup and are
// upgraded in place; backfillTokenHashes() sweeps the rest at boot.
function hashToken(token) {
    return crypto.createHash('sha256').update(String(token)).digest('hex');
}

// The single lookup path for every token-authenticated endpoint.
// `cols` MUST include `id` — the legacy-row upgrade needs it.
async function findPlayerByToken(token, cols) {
    if (!token) return null;
    await ensureMigrations().catch(() => {}); // token_hash column must exist
    const h = hashToken(token);
    let player = await d1.getOne(`SELECT ${cols} FROM players WHERE token_hash = ?1`, [h]);
    if (player) return player;
    // Legacy plaintext row → upgrade: store the hash, tombstone the plaintext.
    player = await d1.getOne(`SELECT ${cols} FROM players WHERE token = ?1`, [token]);
    if (player) {
        try {
            await d1.execute('UPDATE players SET token_hash = ?1, token = ?2 WHERE id = ?3', [h, '#' + h, player.id]);
        } catch (e) { console.warn('[AUTH] token-hash upgrade failed:', e.message); }
    }
    return player;
}

async function backfillTokenHashes() {
    if (!d1.isConfigured()) return;
    let total = 0;
    for (let batch = 0; batch < 50; batch++) {
        const rows = await d1.getAll(
            "SELECT id, token FROM players WHERE (token_hash IS NULL OR token_hash = '') AND token IS NOT NULL AND token != '' AND token NOT LIKE '#%' LIMIT 100"
        );
        if (rows.length === 0) break;
        for (const r of rows) {
            const h = hashToken(r.token);
            await d1.execute('UPDATE players SET token_hash = ?1, token = ?2 WHERE id = ?3', [h, '#' + h, r.id]);
            total++;
        }
        if (rows.length < 100) break;
    }
    if (total) console.log(`[AUTH] hashed ${total} legacy plaintext token(s)`);
}

function parseUnlocked(raw) {
    try { const a = JSON.parse(raw || '[]'); return Array.isArray(a) ? a : []; }
    catch { return []; }
}

// Returns normalized economy for a player row, backfilling starters + token for
// existing accounts that predate the economy (empty unlocked_units).
async function getOrBackfillEconomy(player) {
    let unlocked = parseUnlocked(player.unlocked_units);
    let freeTokens = player.free_tokens || 0;
    const gold = player.gold || 0;
    if (unlocked.length === 0) {
        unlocked = ECON.ACCT_STARTER_UNITS.slice();
        freeTokens = ECON.ACCT_FREE_TOKENS;
        await d1.execute(
            "UPDATE players SET unlocked_units = ?1, free_tokens = ?2 WHERE id = ?3 AND (unlocked_units IS NULL OR unlocked_units = '' OR unlocked_units = '[]')",
            [JSON.stringify(unlocked), freeTokens, player.id]
        );
        console.log(`[ECON] backfilled starters for ${player.id}`);
    } else {
        // Starters are a floor, not just a new-account seed: when the starter
        // list grows, existing accounts pick up the new defaults on next read.
        const missing = ECON.ACCT_STARTER_UNITS.filter(r => !unlocked.includes(r));
        if (missing.length > 0) {
            unlocked = unlocked.concat(missing);
            await d1.execute(
                "UPDATE players SET unlocked_units = ?1 WHERE id = ?2",
                [JSON.stringify(unlocked), player.id]
            );
            console.log(`[ECON] granted new starters (${missing.join(', ')}) to ${player.id}`);
        }
    }
    return { gold, unlockedUnits: unlocked, freeTokens };
}

const rooms = new Map();

function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return rooms.has(code) ? generateCode() : code;
}

setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms) {
        if (!room.guest && now - room.created > 2 * 60 * 60 * 1000) {
            rooms.delete(code);
            console.log(`[IO] Cleaned stale room ${code}`);
        }
    }
}, 10 * 60 * 1000);

function findRoomBySocket(socketId) {
    for (const [code, room] of rooms) {
        if (room.host === socketId || room.guest === socketId) return { code, room };
    }
    return null;
}

// ── MATCH INTEGRITY + REPLAYS ───────────────────────────────────────────────
// The gameplay sim stays on the host client, but the relay is no longer a
// blind pipe:
//  • Direction enforcement — in this protocol only the GUEST emits
//    'game-action' and only the HOST emits 'state-sync' / 'friendly-config' /
//    'ranked-result'. A modified client emitting the other side's events
//    (e.g. a guest pushing a forged state-sync over the host's authority) is
//    dropped and logged.
//  • Turn-ownership gating — the host's state-syncs flow through us, so the
//    server always learns a turn handoff BEFORE the guest can act on it.
//    Mutating guest actions while it isn't player 2's turn are dropped.
//  • Per-socket rate limits — token buckets per event type stop a hacked
//    client from flooding the room (or the disk, via replay logging).
//  • Replays — every started match appends a JSONL action log under
//    ./replays/: header, party configs, the full semantic game-action
//    stream, periodic state snapshots (baseline at battle start, then every
//    60s, then the final state) and an end record. Enough to reconstruct or
//    scrub any ranked match after the fact.

const REPLAY_DIR = path.join(__dirname, 'replays');
try { fs.mkdirSync(REPLAY_DIR, { recursive: true }); } catch (e) { console.error('[REPLAY] mkdir failed:', e.message); }

const RATE_LIMITS = {
    'game-action':  { rate: 12, burst: 30 },   // human input tops out well below this
    'state-sync':   { rate: 30, burst: 60 },   // host throttles to 50ms + heartbeat
    'relay':        { rate: 60, burst: 120 },  // VFX/floating-text bursts on big AOEs
    'party-config': { rate: 2,  burst: 6 },
};
const _rateBuckets = new Map(); // socketId -> { evt: { tokens, last } }
function allowEvent(socketId, evt) {
    const cfg = RATE_LIMITS[evt];
    if (!cfg) return true;
    let sock = _rateBuckets.get(socketId);
    if (!sock) { sock = {}; _rateBuckets.set(socketId, sock); }
    const now = Date.now();
    let b = sock[evt];
    if (!b) b = sock[evt] = { tokens: cfg.burst, last: now, warned: 0 };
    b.tokens = Math.min(cfg.burst, b.tokens + ((now - b.last) / 1000) * cfg.rate);
    b.last = now;
    if (b.tokens < 1) {
        if (now - b.warned > 5000) {
            b.warned = now;
            console.warn(`[GUARD] rate limit: dropping '${evt}' from ${socketId}`);
        }
        return false;
    }
    b.tokens -= 1;
    return true;
}

function replayInit(room, code) {
    if (room._replay) return;
    const stamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    room._replay = {
        file: path.join(REPLAY_DIR, `${stamp}_${code}.jsonl`),
        buf: [],
        count: 0,
        hasBaseline: false,
        lastSnapshotAt: 0,
    };
    replayWrite(room, {
        t: Date.now(), e: 'header', v: 1, code,
        ranked: !!room.ranked,
        rankedMode: room.rankedMode || null,
        mapModeId: room.mapModeId || null,
        teamSize: room.teamSize || null,
        host: room.hostUsername || null,
        guest: room.guestUsername || null,
        friendlyConfig: room.friendlyConfig || null,
    });
    // Party configs relayed before match-started were stashed on the room.
    if (room._preMatchEvents) {
        for (const entry of room._preMatchEvents) replayWrite(room, entry);
        room._preMatchEvents = null;
    }
}

function replayWrite(room, entry) {
    const r = room._replay;
    if (!r || r.count > 20000) return; // runaway-match backstop
    r.count++;
    try { r.buf.push(JSON.stringify(entry)); } catch (e) { return; }
    if (r.buf.length >= 25) replayFlush(room);
}

function replayFlush(room) {
    const r = room._replay;
    if (!r || !r.buf.length) return;
    const chunk = r.buf.join('\n') + '\n';
    r.buf = [];
    fs.appendFile(r.file, chunk, (err) => {
        if (err) console.error('[REPLAY] write failed:', err.message);
    });
}

function replayEnd(room, reason, extra) {
    if (!room._replay) return;
    replayWrite(room, Object.assign({ t: Date.now(), e: 'end', reason }, extra || {}));
    replayFlush(room);
    room._replay = null;
}

// State snapshots inside the replay: baseline at battle start, then at most
// one per 60s, plus the final winning state. Full syncs run ~20/s — logging
// them all would be tens of MB per match for no extra information.
function maybeReplaySnapshot(room, data) {
    const r = room._replay;
    if (!r) return;
    const now = Date.now();
    const battleStart = data.phase === 'battle' && !r.hasBaseline;
    const matchEnd = !!data.winner && !room._matchEnded;
    if (matchEnd) room._matchEnded = true;
    const periodic = r.hasBaseline && (now - r.lastSnapshotAt) > 60000;
    if (!battleStart && !matchEnd && !periodic) return;
    try {
        if (JSON.stringify(data).length > 2000000) return; // never log a pathological payload
    } catch (e) { return; }
    r.hasBaseline = true;
    r.lastSnapshotAt = now;
    replayWrite(room, {
        t: now,
        e: matchEnd ? 'final-state' : (battleStart ? 'baseline' : 'snapshot'),
        round: data.round,
        state: data,
    });
    if (matchEnd) replayFlush(room);
}

// ── SERVER-AUTHORITATIVE RANKED OUTCOME ────────────────────────────────────
// ELO used to be recorded purely on the host's say-so: a 'ranked-result'
// event with a host-chosen winnerId. Now the winner is DERIVED from the
// host's mirrored state-sync stream (the same state the guest renders from):
//  • the first battle-phase sync stamps the battle start (server-side match
//    duration — the host's durationMs claim is no longer trusted),
//  • a sync carrying winner 1|2 is what actually records the ELO,
//  • 'ranked-result' is accepted only when it AGREES with that mirror,
//  • a disconnect-forfeit records ELO for the remaining player, and
//  • a stall watchdog (turn timer) forfeits a side that holds the turn
//    forever or a host that mutes its sync stream.
const MIN_RANKED_MATCH_MS = 30000;
const TURN_STALL_MS = 5 * 60 * 1000;   // one side holding the turn this long forfeits
const SYNC_SILENCE_MS = 2 * 60 * 1000; // host sync stream dead during guest's turn

async function applyRankedElo(room, code, winnerPlayerNum, reason) {
    if (!room.ranked || room._resultProcessed) return;
    if (winnerPlayerNum !== 1 && winnerPlayerNum !== 2) return;
    room._resultProcessed = true;
    room._matchEnded = true;

    // Duration is measured server-side from the first battle-phase sync.
    const durationMs = room._battleStartAt ? Date.now() - room._battleStartAt : 0;
    replayWrite(room, {
        t: Date.now(), e: 'ranked-result', reason,
        winner: winnerPlayerNum, durationMs,
    });
    replayFlush(room);

    if (durationMs < MIN_RANKED_MATCH_MS) {
        console.warn(`[ELO] Rejected fast match (${durationMs}ms, ${reason}) in room ${code}`);
        return;
    }
    if (!d1.isConfigured()) {
        console.warn('[ELO] D1 not configured — skipping server-side ELO');
        return;
    }

    // Auth snapshots taken at match-started survive the socket teardown a
    // disconnect-forfeit implies (authenticatedSockets drops on disconnect).
    const hostAuth = authenticatedSockets.get(room.host) || room._hostAuth;
    const guestAuth = authenticatedSockets.get(room.guest) || room._guestAuth;
    if (!hostAuth || !guestAuth) {
        console.warn(`[ELO] Unauthenticated players in room ${code} — skipping`);
        return;
    }

    const hostPlayerId = hostAuth.playerId;
    const guestPlayerId = guestAuth.playerId;
    const actualWinnerId = winnerPlayerNum === 1 ? hostPlayerId : guestPlayerId;
    const actualLoserId = winnerPlayerNum === 1 ? guestPlayerId : hostPlayerId;
    const teamSize = room.teamSize || 4;
    const mapModeId = room.mapModeId || null;

    try {
        const winner = await d1.getOne('SELECT id, elo, total_games FROM players WHERE id = ?1', [actualWinnerId]);
        const loser = await d1.getOne('SELECT id, elo, total_games FROM players WHERE id = ?1', [actualLoserId]);
        if (!winner || !loser) {
            console.warn('[ELO] Player not found in DB');
            return;
        }

        const winnerK = winner.total_games < 10 ? 40 : winner.total_games < 30 ? 32 : 24;
        const loserK = loser.total_games < 10 ? 40 : loser.total_games < 30 ? 32 : 24;

        const expectedWinner = 1 / (1 + Math.pow(10, (loser.elo - winner.elo) / 400));
        const expectedLoser = 1 / (1 + Math.pow(10, (winner.elo - loser.elo) / 400));

        const winnerDelta = Math.round(winnerK * (1 - expectedWinner));
        const loserDelta = Math.round(loserK * (0 - expectedLoser));

        const newWinnerElo = winner.elo + winnerDelta;
        const newLoserElo = Math.max(100, loser.elo + loserDelta);

        await d1.execute(
            `UPDATE players SET elo = ?1, peak_elo = MAX(peak_elo, ?1), wins = wins + 1,
             total_games = total_games + 1, last_seen = datetime('now') WHERE id = ?2`,
            [newWinnerElo, actualWinnerId]
        );
        await d1.execute(
            `UPDATE players SET elo = ?1, losses = losses + 1,
             total_games = total_games + 1, last_seen = datetime('now') WHERE id = ?2`,
            [newLoserElo, actualLoserId]
        );

        const matchId = uuid();
        await d1.execute(
            `INSERT INTO matches (id, winner_id, loser_id, winner_elo_before, winner_elo_after,
             loser_elo_before, loser_elo_after, team_size, map_mode_id, duration_ms)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
            [matchId, actualWinnerId, actualLoserId, winner.elo, newWinnerElo,
             loser.elo, newLoserElo, teamSize, mapModeId, durationMs]
        );

        console.log(`[ELO] ${hostAuth.username} vs ${guestAuth.username} (${reason}): winner=${actualWinnerId === hostPlayerId ? hostAuth.username : guestAuth.username} (${winner.elo}→${newWinnerElo}), loser=(${loser.elo}→${newLoserElo})`);

        // Refresh cached ratings (live socket entry AND the match snapshot).
        const isHostWinner = actualWinnerId === hostPlayerId;
        for (const [auth, won] of [[hostAuth, isHostWinner], [guestAuth, !isHostWinner]]) {
            auth.elo = won ? newWinnerElo : newLoserElo;
        }
        const liveHost = authenticatedSockets.get(room.host);
        const liveGuest = authenticatedSockets.get(room.guest);
        if (liveHost) liveHost.elo = isHostWinner ? newWinnerElo : newLoserElo;
        if (liveGuest) liveGuest.elo = isHostWinner ? newLoserElo : newWinnerElo;

        const hostSocket = io.sockets.sockets.get(room.host);
        const guestSocket = io.sockets.sockets.get(room.guest);
        if (hostSocket) {
            hostSocket.emit('elo-update', {
                myNewElo: isHostWinner ? newWinnerElo : newLoserElo,
                myEloDelta: isHostWinner ? winnerDelta : loserDelta,
                opponentNewElo: isHostWinner ? newLoserElo : newWinnerElo,
            });
        }
        if (guestSocket) {
            const isGuestWinner = !isHostWinner;
            guestSocket.emit('elo-update', {
                myNewElo: isGuestWinner ? newWinnerElo : newLoserElo,
                myEloDelta: isGuestWinner ? winnerDelta : loserDelta,
                opponentNewElo: isGuestWinner ? newLoserElo : newWinnerElo,
            });
        }
    } catch (err) {
        console.error('[ELO] Error calculating ELO:', err.message);
    }
}

// ── RANKED TURN TIMER / STALL WATCHDOG ─────────────────────────────────────
// A player who simply stops playing used to be able to hold a ranked match
// hostage forever (the client shot clock is host-enforced, so a modified
// host just disables it). Server-side: forfeit whichever side has held the
// turn past TURN_STALL_MS, or a host whose sync stream goes dead during the
// guest's turn (the 1.2s handoff heartbeat makes real silence impossible).
setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms) {
        if (!room.ranked || !room._matchStarted || room._matchEnded || room._resultProcessed) continue;
        if (room._disconnected) continue;   // rejoin window has its own 90s timer
        if (!room._battleStartAt) continue; // battle not underway yet
        const ls = room._lastState;
        let stalled = 0, why = '';
        if (ls && ls.activePlayer === 2 && room._lastSyncAt && now - room._lastSyncAt > SYNC_SILENCE_MS) {
            stalled = 1; why = 'host sync stream silent';
        } else if (room._turnMark && (room._turnMark.activePlayer === 1 || room._turnMark.activePlayer === 2)
                   && now - room._turnMark.at > TURN_STALL_MS) {
            stalled = room._turnMark.activePlayer;
            why = `turn held ${Math.round((now - room._turnMark.at) / 1000)}s`;
        }
        if (!stalled) continue;
        console.warn(`[GUARD] room ${code}: P${stalled} forfeits on turn timer (${why})`);
        io.to(code).emit('match-forfeit', {
            forfeitPlayer: stalled,
            role: stalled === 1 ? 'host' : 'guest',
            reason: 'turn-timer',
        });
        applyRankedElo(room, code, stalled === 1 ? 2 : 1, 'stall-forfeit');
        replayEnd(room, 'stall-forfeit', { forfeitPlayer: stalled });
        rooms.delete(code);
    }
}, 15000);

const queues = {};

// ── 2026-07 map overhaul: ranked pool mirrors the MapForge roster in
// data.js (EW_MAP_META). Δ maps are the 10×10 mirror-balanced competitive
// cuts (4s queue backbone); full maps serve the 6- and 8-team queues.
const MAP_POOL = [
    // 10×10 Δ ranked variants (4v4)
    { modeId: 'prebuilt_shasta_delta', w: 10, h: 10, team: 4 },
    { modeId: 'prebuilt_stonehenge_delta', w: 10, h: 10, team: 4 },
    { modeId: 'prebuilt_giza_delta', w: 10, h: 10, team: 4 },
    { modeId: 'prebuilt_nuketown_delta', w: 10, h: 10, team: 4 },
    { modeId: 'prebuilt_heaven_delta', w: 10, h: 10, team: 4 },
    { modeId: 'prebuilt_hell_delta', w: 10, h: 10, team: 4 },
    { modeId: 'prebuilt_cyberpunk_delta', w: 10, h: 10, team: 4 },
    { modeId: 'prebuilt_camelot_delta', w: 10, h: 10, team: 4 },
    { modeId: 'prebuilt_stadium_delta', w: 10, h: 10, team: 4 },
    { modeId: 'prebuilt_atlantis_delta', w: 10, h: 10, team: 4 },
    { modeId: 'prebuilt_babel_delta', w: 10, h: 10, team: 4 },
    { modeId: 'prebuilt_olympus_delta', w: 10, h: 10, team: 4 },
    { modeId: 'prebuilt_mars_delta', w: 10, h: 10, team: 4 },
    { modeId: 'prebuilt_area51_delta', w: 10, h: 10, team: 4 },
    { modeId: 'prebuilt_antarctica_delta', w: 10, h: 10, team: 4 },
    { modeId: 'prebuilt_skinwalker_delta', w: 10, h: 10, team: 4 },
    { modeId: 'prebuilt_hollow_earth_delta', w: 10, h: 10, team: 4 },
    { modeId: 'prebuilt_fairy_forest_delta', w: 10, h: 10, team: 4 },
    { modeId: 'prebuilt_moon_delta', w: 10, h: 10, team: 4 },
    { modeId: 'prebuilt_technoticlan_delta', w: 10, h: 10, team: 4 },
    { modeId: 'prebuilt_agartha_delta', w: 10, h: 10, team: 4 },
    { modeId: 'prebuilt_vatican_delta', w: 10, h: 10, team: 4 },
    { modeId: 'prebuilt_bohemian_grove_delta', w: 10, h: 10, team: 4 },
    { modeId: 'prebuilt_gobekli_delta', w: 10, h: 10, team: 4 },
    { modeId: 'prebuilt_dumb_delta', w: 10, h: 10, team: 4 },
    { modeId: 'prebuilt_cern_delta', w: 10, h: 10, team: 4 },
    { modeId: 'prebuilt_backrooms_delta', w: 10, h: 10, team: 4 },
    { modeId: 'prebuilt_northpole_delta', w: 10, h: 10, team: 4 },
    { modeId: 'prebuilt_flatlands_delta', w: 10, h: 10, team: 4 },
    // full launch maps (6v6 / 8v8 queues)
    { modeId: 'prebuilt_nuketown', w: 14, h: 14, team: 6 },
    { modeId: 'prebuilt_stonehenge', w: 16, h: 16, team: 6 },
    { modeId: 'prebuilt_moon', w: 16, h: 16, team: 6 },
    { modeId: 'prebuilt_gobekli', w: 16, h: 16, team: 6 },
    { modeId: 'prebuilt_dumb', w: 16, h: 16, team: 6 },
    { modeId: 'prebuilt_cern', w: 16, h: 16, team: 6 },
    { modeId: 'prebuilt_backrooms', w: 16, h: 16, team: 6 },
    { modeId: 'prebuilt_northpole', w: 16, h: 16, team: 6 },
    { modeId: 'prebuilt_flatlands', w: 16, h: 16, team: 6 },
    { modeId: 'prebuilt_shasta', w: 20, h: 20, team: 6 },
    { modeId: 'prebuilt_giza', w: 20, h: 20, team: 6 },
    { modeId: 'prebuilt_heaven', w: 20, h: 20, team: 6 },
    { modeId: 'prebuilt_hell', w: 20, h: 20, team: 6 },
    { modeId: 'prebuilt_mars', w: 20, h: 20, team: 6 },
    { modeId: 'prebuilt_area51', w: 20, h: 20, team: 6 },
    { modeId: 'prebuilt_skinwalker', w: 20, h: 20, team: 6 },
    { modeId: 'prebuilt_hollow_earth', w: 20, h: 20, team: 6 },
    { modeId: 'prebuilt_fairy_forest', w: 20, h: 20, team: 6 },
    { modeId: 'prebuilt_vatican', w: 20, h: 20, team: 6 },
    { modeId: 'prebuilt_bohemian_grove', w: 20, h: 20, team: 6 },
    { modeId: 'prebuilt_babel', w: 16, h: 24, team: 6 },
    { modeId: 'prebuilt_stadium', w: 16, h: 28, team: 8 },
    { modeId: 'prebuilt_cyberpunk', w: 24, h: 24, team: 8 },
    { modeId: 'prebuilt_camelot', w: 24, h: 24, team: 8 },
    { modeId: 'prebuilt_atlantis', w: 24, h: 24, team: 8 },
    { modeId: 'prebuilt_olympus', w: 24, h: 24, team: 8 },
    { modeId: 'prebuilt_antarctica', w: 24, h: 24, team: 8 },
    { modeId: 'prebuilt_technoticlan', w: 24, h: 24, team: 8 },
    { modeId: 'prebuilt_agartha', w: 24, h: 24, team: 8 },
];

function pickRandomMap(teamSize) {

    const eligible = MAP_POOL.filter(m => m.team >= teamSize);
    if (eligible.length === 0) {

        const sorted = [...MAP_POOL].sort((a, b) => Math.abs(a.team - teamSize) - Math.abs(b.team - teamSize));
        return sorted[0];
    }
    return eligible[Math.floor(Math.random() * eligible.length)];
}

function getQueue(teamSize) {
    if (!queues[teamSize]) queues[teamSize] = [];
    return queues[teamSize];
}

function removeFromAllQueues(socketId) {
    for (const ts in queues) {
        const q = queues[ts];
        const idx = q.findIndex(e => e.socketId === socketId);
        if (idx !== -1) {
            q.splice(idx, 1);
            return true;
        }
    }
    return false;
}

setInterval(() => {
    const now = Date.now();
    for (const queueKey in queues) {
        const q = queues[queueKey];
        if (q.length < 2) continue;

        q.sort((a, b) => a.elo - b.elo);

        const matched = new Set();

        for (let i = 0; i < q.length - 1; i++) {
            if (matched.has(i)) continue;

            const a = q[i];
            const waitTimeA = now - a.joinedAt;

            let eloRange = 200;
            if (waitTimeA > 30000) eloRange = 400;
            if (waitTimeA > 60000) eloRange = 800;
            if (waitTimeA > 90000) eloRange = Infinity;

            for (let j = i + 1; j < q.length; j++) {
                if (matched.has(j)) continue;

                const b = q[j];
                const waitTimeB = now - b.joinedAt;
                const maxWait = Math.max(waitTimeA, waitTimeB);

                let range = eloRange;
                if (maxWait > 30000) range = Math.max(range, 400);
                if (maxWait > 60000) range = Math.max(range, 800);
                if (maxWait > 90000) range = Infinity;

                if (Math.abs(a.elo - b.elo) <= range) {

                    matched.add(i);
                    matched.add(j);

                    const rankedMode = a.rankedMode || 'arena';
                    // Clash always plays 4v4 on its fixed JRPG stage.
                    const actualTeamSize = rankedMode === 'clash' ? 4 : (a.teamSize || parseInt(queueKey));
                    const code = generateCode();
                    const map = rankedMode === 'clash' ? { modeId: 'clash_stage' } : pickRandomMap(actualTeamSize);

                    let host = a, guest = b;
                    if (b.elo > a.elo || (b.elo === a.elo && Math.random() > 0.5)) {
                        host = b;
                        guest = a;
                    }

                    const rejoinToken = uuid();
                    rooms.set(code, {
                        host: host.socketId,
                        guest: guest.socketId,
                        hostUsername: host.username,
                        guestUsername: guest.username,
                        created: Date.now(),
                        ranked: true,
                        mapModeId: map.modeId,
                        teamSize: actualTeamSize,
                        rankedMode: rankedMode,
                        rejoinToken: rejoinToken,
                        _disconnected: null,
                        _matchStarted: false
                    });

                    const hostSocket = io.sockets.sockets.get(host.socketId);
                    const guestSocket = io.sockets.sockets.get(guest.socketId);

                    if (hostSocket) hostSocket.join(code);
                    if (guestSocket) guestSocket.join(code);

                    console.log(`[MM] Matched ${host.username} (${host.elo}) vs ${guest.username} (${guest.elo}) → Room ${code} on ${map.modeId} [${rankedMode}] (${actualTeamSize}v${actualTeamSize})`);

                    if (hostSocket) {
                        hostSocket.emit('match-found', {
                            roomCode: code,
                            role: 'host',
                            opponent: guest.username,
                            opponentElo: guest.elo,
                            mapModeId: map.modeId,
                            teamSize: actualTeamSize,
                            rankedMode: rankedMode
                        });
                    }
                    if (guestSocket) {
                        guestSocket.emit('match-found', {
                            roomCode: code,
                            role: 'guest',
                            opponent: host.username,
                            opponentElo: host.elo,
                            mapModeId: map.modeId,
                            teamSize: actualTeamSize,
                            rankedMode: rankedMode
                        });
                    }

                    io.to(code).emit('room-full', {
                        host: host.socketId,
                        guest: guest.socketId,
                        hostUsername: host.username,
                        guestUsername: guest.username,
                        ranked: true,
                        mapModeId: map.modeId,
                        teamSize: actualTeamSize,
                        rankedMode: rankedMode,
                        rejoinToken: rejoinToken
                    });

                    break;
                }
            }
        }

        const indices = [...matched].sort((a, b) => b - a);
        for (const idx of indices) {
            q.splice(idx, 1);
        }
    }
}, 3000);

app.get('/api/queue-stats', limitRead, (req, res) => {
    // Per-queue breakdown so the filler-bot manager (bots.js) can tell whether a
    // real human is stuck waiting with nobody to play. `humans`/`bots` split lets
    // it summon exactly one filler per lonely queue and never bot-vs-bot.
    const now = Date.now();
    const stats = {};
    for (const key in queues) {
        const q = queues[key];
        let humans = 0, bots = 0, oldestHuman = Infinity, oldestHumanElo = null;
        for (const e of q) {
            if (e.isBot) { bots++; }
            else { humans++; if (e.joinedAt < oldestHuman) { oldestHuman = e.joinedAt; oldestHumanElo = e.elo; } }
        }
        stats[key] = {
            total: q.length,
            humans,
            bots,
            oldestHumanWaitMs: isFinite(oldestHuman) ? (now - oldestHuman) : 0,
            oldestHumanElo, // ELO of the longest-waiting human (the one a filler fills for)
        };
    }
    res.json({ queues: stats, rooms: rooms.size });
});

// ── FILLER-BOT ELO SYNC ────────────────────────────────────────────────
// Lets bots.js pin a bot account's ELO to within ±100 of the human it's about
// to fill for, so the match forms instantly and the human's ELO swing is fair.
// Gated by a shared secret (BOT_ADMIN_SECRET) so real players can't move their
// own rating; disabled entirely when the secret is unset.
app.post('/api/bot/sync-elo', limitEcon, async (req, res) => {
    if (!d1.isConfigured()) {
        return res.status(503).json({ error: 'Database not configured.' });
    }
    const secret = process.env.BOT_ADMIN_SECRET;
    if (!secret) {
        return res.status(503).json({ error: 'Bot admin not enabled (set BOT_ADMIN_SECRET).' });
    }
    if ((req.headers['x-bot-secret'] || '') !== secret) {
        return res.status(403).json({ error: 'Forbidden.' });
    }
    const { token, elo } = req.body || {};
    if (!token) {
        return res.status(401).json({ error: 'Token required.' });
    }
    let target = Math.round(Number(elo));
    if (!isFinite(target)) {
        return res.status(400).json({ error: 'Invalid elo.' });
    }
    target = Math.max(100, Math.min(4000, target));
    try {
        const player = await findPlayerByToken(token, 'id');
        if (!player) {
            return res.status(401).json({ error: 'Invalid token.' });
        }
        await d1.execute('UPDATE players SET elo = ?1, peak_elo = MAX(peak_elo, ?1) WHERE id = ?2', [target, player.id]);
        res.json({ ok: true, elo: target });
    } catch (err) {
        console.error('[BOT] sync-elo error:', err.message);
        res.status(500).json({ error: 'Failed to sync elo.' });
    }
});

const authenticatedSockets = new Map();

// Sockets that have identified themselves as filler bots (via `bot-hello`).
// Used only to split humans-vs-bots in /api/queue-stats so bots.js can decide
// when a real human is stuck waiting. Has no effect on matchmaking itself.
const botSockets = new Set();

const USERNAME_RE = /^[A-Za-z0-9_]{2,16}$/;

app.post('/api/register', limitAuth, async (req, res) => {
    if (!d1.isConfigured()) {
        return res.status(503).json({ error: 'Database not configured. Set CF_ACCOUNT_ID, CF_D1_DATABASE_ID, CF_API_TOKEN.' });
    }

    const { username } = req.body || {};
    if (!username || !USERNAME_RE.test(username)) {
        return res.status(400).json({ error: 'Invalid username. 2-16 chars, alphanumeric and underscores only.' });
    }

    try {
        await ensureMigrations();

        const existing = await d1.getOne('SELECT id FROM players WHERE username = ?1', [username]);
        if (existing) {
            return res.status(409).json({ error: 'Username already taken.' });
        }

        const id = uuid();
        const token = uuid();
        const tokenHash = hashToken(token);
        const starters = JSON.stringify(ECON.ACCT_STARTER_UNITS);

        // Only the hash is stored; the client keeps the plaintext token from
        // this response. The token column gets the '#'-tombstone (UNIQUE-safe).
        await d1.execute(
            'INSERT INTO players (id, username, token, token_hash, elo, peak_elo, wins, losses, total_games, gold, unlocked_units, free_tokens) VALUES (?1, ?2, ?3, ?4, 1200, 1200, 0, 0, 0, ?5, ?6, ?7)',
            [id, username, '#' + tokenHash, tokenHash, ECON.ACCT_STARTING_GOLD, starters, ECON.ACCT_FREE_TOKENS]
        );

        console.log(`[AUTH] Registered: ${username} (${id})`);
        res.json({
            id, token, username, elo: 1200, peakElo: 1200, wins: 0, losses: 0,
            gold: ECON.ACCT_STARTING_GOLD, unlockedUnits: ECON.ACCT_STARTER_UNITS.slice(), freeTokens: ECON.ACCT_FREE_TOKENS,
        });
    } catch (err) {
        console.error('[AUTH] Register error:', err.message);
        res.status(500).json({ error: 'Registration failed.' });
    }
});

app.post('/api/login', limitAuth, async (req, res) => {
    if (!d1.isConfigured()) {
        return res.status(503).json({ error: 'Database not configured.' });
    }

    const { token } = req.body || {};
    if (!token) {
        return res.status(400).json({ error: 'Token required.' });
    }

    try {
        await ensureMigrations();
        const player = await findPlayerByToken(token,
            'id, username, elo, peak_elo, wins, losses, total_games, gold, unlocked_units, free_tokens');

        if (!player) {
            return res.status(401).json({ error: 'Invalid token.' });
        }

        await d1.execute('UPDATE players SET last_seen = datetime(\'now\') WHERE id = ?1', [player.id]);

        const econ = await getOrBackfillEconomy(player);

        console.log(`[AUTH] Login: ${player.username} (${player.id})`);
        res.json({
            id: player.id,
            username: player.username,
            elo: player.elo,
            peakElo: player.peak_elo,
            wins: player.wins,
            losses: player.losses,
            totalGames: player.total_games,
            gold: econ.gold,
            unlockedUnits: econ.unlockedUnits,
            freeTokens: econ.freeTokens,
        });
    } catch (err) {
        console.error('[AUTH] Login error:', err.message);
        res.status(500).json({ error: 'Login failed.' });
    }
});

// ── ECONOMY ENDPOINTS ──────────────────────────────────────────────────
app.get('/api/economy/:id', limitEcon, async (req, res) => {
    if (!d1.isConfigured()) {
        return res.status(503).json({ error: 'Database not configured.' });
    }
    try {
        await ensureMigrations();
        const token = req.headers['x-auth-token'] || req.query.token;
        // Resolve by token when supplied (authoritative); otherwise fall back to id.
        const player = token
            ? await findPlayerByToken(token, 'id, gold, unlocked_units, free_tokens')
            : await d1.getOne('SELECT id, gold, unlocked_units, free_tokens FROM players WHERE id = ?1', [req.params.id]);
        if (!player) {
            return res.status(404).json({ error: 'Player not found.' });
        }
        const econ = await getOrBackfillEconomy(player);
        res.json(econ);
    } catch (err) {
        console.error('[ECON] Get error:', err.message);
        res.status(500).json({ error: 'Failed to load economy.' });
    }
});

app.post('/api/economy/bank', limitEcon, async (req, res) => {
    if (!d1.isConfigured()) {
        return res.status(503).json({ error: 'Database not configured.' });
    }
    try {
        await ensureMigrations();
        const { token, matchGold, mode } = req.body || {};
        if (!token) {
            return res.status(401).json({ error: 'Authentication required.' });
        }
        if (!ECON.ACCT_PVP_MODES.has(mode)) {
            return res.status(400).json({ error: 'Unrecognized PvP mode.' });
        }
        const player = await findPlayerByToken(token, 'id, gold, unlocked_units, free_tokens');
        if (!player) {
            return res.status(401).json({ error: 'Invalid token.' });
        }
        let amt = Math.round(Number(matchGold));
        if (!isFinite(amt) || amt < 0) amt = 0;
        amt = Math.min(amt, ECON.ACCT_MATCH_GOLD_CAP); // server-enforced anti-cheat cap

        await d1.execute('UPDATE players SET gold = gold + ?1 WHERE id = ?2', [amt, player.id]);
        const updated = await d1.getOne('SELECT gold, unlocked_units, free_tokens FROM players WHERE id = ?1', [player.id]);
        res.json({
            gold: updated.gold,
            banked: amt,
            unlockedUnits: parseUnlocked(updated.unlocked_units),
            freeTokens: updated.free_tokens,
        });
    } catch (err) {
        console.error('[ECON] Bank error:', err.message);
        res.status(500).json({ error: 'Failed to bank gold.' });
    }
});

app.post('/api/economy/purchase', limitEcon, async (req, res) => {
    if (!d1.isConfigured()) {
        return res.status(503).json({ error: 'Database not configured.' });
    }
    try {
        await ensureMigrations();
        const { token, raceKey, useToken } = req.body || {};
        if (!token) {
            return res.status(401).json({ error: 'Authentication required.' });
        }
        if (!raceKey || !ECON.AVAILABLE_RACES.has(raceKey)) {
            return res.status(400).json({ error: 'Unknown unit.' });
        }
        const player = await findPlayerByToken(token, 'id, gold, unlocked_units, free_tokens');
        if (!player) {
            return res.status(401).json({ error: 'Invalid token.' });
        }
        // Backfill starters first so a pre-economy account can purchase.
        await getOrBackfillEconomy(player);
        const fresh = await d1.getOne('SELECT id, gold, unlocked_units, free_tokens FROM players WHERE id = ?1', [player.id]);
        const unlocked = parseUnlocked(fresh.unlocked_units);
        if (unlocked.includes(raceKey)) {
            return res.status(409).json({ error: 'Already owned.' });
        }
        const newUnlocked = JSON.stringify(unlocked.concat([raceKey]));

        let result;
        if (useToken && (fresh.free_tokens || 0) > 0) {
            // Atomic: guard on token availability AND the exact prior unlock list
            // so a double-click cannot redeem twice or double-add.
            result = await d1.execute(
                'UPDATE players SET free_tokens = free_tokens - 1, unlocked_units = ?1 WHERE id = ?2 AND free_tokens > 0 AND unlocked_units = ?3',
                [newUnlocked, player.id, fresh.unlocked_units]
            );
        } else {
            if ((fresh.gold || 0) < ECON.ACCT_UNIT_PRICE) {
                return res.status(402).json({ error: 'Insufficient gold.' });
            }
            // Atomic: WHERE gold >= price prevents double-spend on concurrent clicks.
            result = await d1.execute(
                'UPDATE players SET gold = gold - ?1, unlocked_units = ?2 WHERE id = ?3 AND gold >= ?1 AND unlocked_units = ?4',
                [ECON.ACCT_UNIT_PRICE, newUnlocked, player.id, fresh.unlocked_units]
            );
        }
        const changes = result && result.meta ? (result.meta.changes || 0) : 0;
        if (!changes) {
            return res.status(409).json({ error: 'Purchase failed — please retry.' });
        }

        const updated = await d1.getOne('SELECT gold, unlocked_units, free_tokens FROM players WHERE id = ?1', [player.id]);
        console.log(`[ECON] ${player.id} unlocked "${raceKey}" via ${useToken ? 'token' : 'gold'} → gold=${updated.gold}, tokens=${updated.free_tokens}`);
        res.json({
            gold: updated.gold,
            unlockedUnits: parseUnlocked(updated.unlocked_units),
            freeTokens: updated.free_tokens,
        });
    } catch (err) {
        console.error('[ECON] Purchase error:', err.message);
        res.status(500).json({ error: 'Failed to complete purchase.' });
    }
});

app.get('/api/player/:id', limitRead, async (req, res) => {
    if (!d1.isConfigured()) {
        return res.status(503).json({ error: 'Database not configured.' });
    }

    try {
        const player = await d1.getOne(
            'SELECT id, username, elo, peak_elo, wins, losses, total_games, created_at FROM players WHERE id = ?1',
            [req.params.id]
        );
        if (!player) {
            return res.status(404).json({ error: 'Player not found.' });
        }
        res.json({
            id: player.id,
            username: player.username,
            elo: player.elo,
            peakElo: player.peak_elo,
            wins: player.wins,
            losses: player.losses,
            totalGames: player.total_games,
            createdAt: player.created_at,
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to load player.' });
    }
});

app.get('/api/check-username/:username', limitRead, async (req, res) => {
    if (!d1.isConfigured()) {
        return res.status(503).json({ error: 'Database not configured.' });
    }

    const username = req.params.username;
    if (!USERNAME_RE.test(username)) {
        return res.json({ available: false, reason: 'Invalid format.' });
    }

    try {
        const existing = await d1.getOne('SELECT id FROM players WHERE username = ?1', [username]);
        res.json({ available: !existing });
    } catch (err) {
        res.status(500).json({ error: 'Check failed.' });
    }
});

app.get('/api/leaderboard', limitRead, async (req, res) => {
    if (!d1.isConfigured()) {
        return res.status(503).json({ error: 'Database not configured.' });
    }
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    try {
        const rows = await d1.getAll(
            'SELECT id, username, elo, peak_elo, wins, losses, total_games, created_at FROM players ORDER BY elo DESC LIMIT ?1',
            [limit]
        );
        res.json({
            players: rows.map((r, i) => ({
                rank: i + 1,
                id: r.id,
                username: r.username,
                elo: r.elo,
                peakElo: r.peak_elo,
                wins: r.wins,
                losses: r.losses,
                totalGames: r.total_games,
                createdAt: r.created_at,
            }))
        });
    } catch (err) {
        console.error('[API] Leaderboard error:', err.message);
        res.status(500).json({ error: 'Failed to load leaderboard.' });
    }
});

app.get('/api/matches', limitRead, async (req, res) => {
    if (!d1.isConfigured()) {
        return res.status(503).json({ error: 'Database not configured.' });
    }
    const playerId = req.query.playerId;
    if (!playerId) {
        return res.status(400).json({ error: 'playerId required.' });
    }
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    try {
        const rows = await d1.getAll(
            `SELECT m.id, m.winner_id, m.loser_id, m.winner_elo_before, m.winner_elo_after,
                    m.loser_elo_before, m.loser_elo_after, m.team_size, m.map_mode_id,
                    m.duration_ms, m.created_at,
                    pw.username AS winner_name, pl.username AS loser_name
             FROM matches m
             LEFT JOIN players pw ON pw.id = m.winner_id
             LEFT JOIN players pl ON pl.id = m.loser_id
             WHERE m.winner_id = ?1 OR m.loser_id = ?1
             ORDER BY m.created_at DESC LIMIT ?2`,
            [playerId, limit]
        );
        res.json({
            matches: rows.map(m => {
                const isWinner = m.winner_id === playerId;
                return {
                    id: m.id,
                    result: isWinner ? 'win' : 'loss',
                    opponent: isWinner ? m.loser_name : m.winner_name,
                    opponentId: isWinner ? m.loser_id : m.winner_id,
                    eloBefore: isWinner ? m.winner_elo_before : m.loser_elo_before,
                    eloAfter: isWinner ? m.winner_elo_after : m.loser_elo_after,
                    eloDelta: isWinner
                        ? (m.winner_elo_after - m.winner_elo_before)
                        : (m.loser_elo_after - m.loser_elo_before),
                    teamSize: m.team_size,
                    mapModeId: m.map_mode_id,
                    durationMs: m.duration_ms,
                    createdAt: m.created_at,
                };
            })
        });
    } catch (err) {
        console.error('[API] Matches error:', err.message);
        res.status(500).json({ error: 'Failed to load matches.' });
    }
});

app.get('/api/player/:id/rank', limitRead, async (req, res) => {
    if (!d1.isConfigured()) {
        return res.status(503).json({ error: 'Database not configured.' });
    }
    try {
        const player = await d1.getOne(
            'SELECT elo FROM players WHERE id = ?1',
            [req.params.id]
        );
        if (!player) {
            return res.status(404).json({ error: 'Player not found.' });
        }

        const result = await d1.getOne(
            'SELECT COUNT(*) as rank FROM players WHERE elo > ?1',
            [player.elo]
        );
        res.json({ rank: (result ? result.rank : 0) + 1, elo: player.elo });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get rank.' });
    }
});

app.post('/api/maps', limitMapWrite, async (req, res) => {
    if (!d1.isConfigured()) {
        return res.status(503).json({ error: 'Database not configured.' });
    }
    const token = req.headers['x-auth-token'];
    if (!token) {
        return res.status(401).json({ error: 'Authentication required.' });
    }

    try {
        const player = await findPlayerByToken(token, 'id, username');
        if (!player) {
            return res.status(401).json({ error: 'Invalid token.' });
        }

        const { name, description, mapJson } = req.body || {};
        if (!name || !mapJson) {
            return res.status(400).json({ error: 'name and mapJson required.' });
        }
        if (name.length > 40) {
            return res.status(400).json({ error: 'Name too long (max 40 chars).' });
        }
        if ((description || '').length > 200) {
            return res.status(400).json({ error: 'Description too long (max 200 chars).' });
        }

        let parsed;
        try {
            parsed = typeof mapJson === 'string' ? JSON.parse(mapJson) : mapJson;
        } catch {
            return res.status(400).json({ error: 'Invalid map JSON.' });
        }
        if (!parsed.w || !parsed.h || !parsed.grid) {
            return res.status(400).json({ error: 'Map JSON must have w, h, and grid.' });
        }

        const jsonStr = typeof mapJson === 'string' ? mapJson : JSON.stringify(mapJson);
        if (jsonStr.length > 500000) {
            return res.status(400).json({ error: 'Map data too large (max 500KB).' });
        }

        const countResult = await d1.getOne(
            'SELECT COUNT(*) as cnt FROM community_maps WHERE author_id = ?1',
            [player.id]
        );
        if (countResult && countResult.cnt >= 20) {
            return res.status(400).json({ error: 'Max 20 maps per player.' });
        }

        const teamSize = Math.max(1, Math.min(
            (parsed.spawns?.[1] || []).length,
            (parsed.spawns?.[2] || []).length
        ));

        const id = uuid();
        await d1.execute(
            `INSERT INTO community_maps (id, author_id, author_name, name, description, map_json, width, height, team_size)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`,
            [id, player.id, player.username, name, description || '', jsonStr, parsed.w, parsed.h, teamSize]
        );

        console.log(`[MAPS] ${player.username} submitted map "${name}" (${parsed.w}x${parsed.h})`);
        res.json({ id, name });
    } catch (err) {
        console.error('[MAPS] Submit error:', err.message);
        res.status(500).json({ error: 'Failed to submit map.' });
    }
});

app.get('/api/maps', limitRead, async (req, res) => {
    if (!d1.isConfigured()) {
        return res.status(503).json({ error: 'Database not configured.' });
    }
    const sort = req.query.sort || 'newest';
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = parseInt(req.query.offset) || 0;

    let orderBy = 'created_at DESC';
    if (sort === 'popular') orderBy = 'plays DESC';
    if (sort === 'top_rated') orderBy = 'CASE WHEN rating_count >= 3 THEN CAST(rating_sum AS REAL)/rating_count ELSE 0 END DESC, rating_count DESC';
    if (sort === 'featured') orderBy = 'featured DESC, created_at DESC';

    try {
        const rows = await d1.getAll(
            `SELECT id, author_id, author_name, name, description, width, height, team_size,
                    plays, rating_sum, rating_count, featured, created_at
             FROM community_maps ORDER BY ${orderBy} LIMIT ?1 OFFSET ?2`,
            [limit, offset]
        );
        res.json({
            maps: rows.map(m => ({
                id: m.id,
                authorId: m.author_id,
                authorName: m.author_name,
                name: m.name,
                description: m.description,
                width: m.width,
                height: m.height,
                teamSize: m.team_size,
                plays: m.plays,
                rating: m.rating_count >= 1 ? (m.rating_sum / m.rating_count).toFixed(1) : null,
                ratingCount: m.rating_count,
                featured: !!m.featured,
                createdAt: m.created_at,
            }))
        });
    } catch (err) {
        console.error('[MAPS] Browse error:', err.message);
        res.status(500).json({ error: 'Failed to load maps.' });
    }
});

app.get('/api/maps/:id', limitRead, async (req, res) => {
    if (!d1.isConfigured()) {
        return res.status(503).json({ error: 'Database not configured.' });
    }
    try {
        const m = await d1.getOne(
            `SELECT id, author_id, author_name, name, description, map_json, width, height, team_size,
                    plays, rating_sum, rating_count, featured, created_at
             FROM community_maps WHERE id = ?1`,
            [req.params.id]
        );
        if (!m) {
            return res.status(404).json({ error: 'Map not found.' });
        }

        await d1.execute('UPDATE community_maps SET plays = plays + 1 WHERE id = ?1', [m.id]);

        res.json({
            id: m.id,
            authorId: m.author_id,
            authorName: m.author_name,
            name: m.name,
            description: m.description,
            mapJson: m.map_json,
            width: m.width,
            height: m.height,
            teamSize: m.team_size,
            plays: m.plays + 1,
            rating: m.rating_count >= 1 ? (m.rating_sum / m.rating_count).toFixed(1) : null,
            ratingCount: m.rating_count,
            featured: !!m.featured,
            createdAt: m.created_at,
        });
    } catch (err) {
        console.error('[MAPS] Get map error:', err.message);
        res.status(500).json({ error: 'Failed to load map.' });
    }
});

app.post('/api/maps/:id/rate', limitMapWrite, async (req, res) => {
    if (!d1.isConfigured()) {
        return res.status(503).json({ error: 'Database not configured.' });
    }
    const token = req.headers['x-auth-token'];
    if (!token) {
        return res.status(401).json({ error: 'Authentication required.' });
    }

    try {
        const player = await findPlayerByToken(token, 'id');
        if (!player) {
            return res.status(401).json({ error: 'Invalid token.' });
        }

        const rating = parseInt(req.body.rating);
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be 1-5.' });
        }

        const mapId = req.params.id;
        const map = await d1.getOne('SELECT id, author_id FROM community_maps WHERE id = ?1', [mapId]);
        if (!map) {
            return res.status(404).json({ error: 'Map not found.' });
        }

        if (map.author_id === player.id) {
            return res.status(400).json({ error: 'Cannot rate your own map.' });
        }

        const existing = await d1.getOne(
            'SELECT rating FROM map_ratings WHERE map_id = ?1 AND player_id = ?2',
            [mapId, player.id]
        );

        if (existing) {
            const oldRating = existing.rating;
            await d1.execute(
                'UPDATE map_ratings SET rating = ?1 WHERE map_id = ?2 AND player_id = ?3',
                [rating, mapId, player.id]
            );

            await d1.execute(
                'UPDATE community_maps SET rating_sum = rating_sum + ?1 - ?2 WHERE id = ?3',
                [rating, oldRating, mapId]
            );
        } else {
            await d1.execute(
                'INSERT INTO map_ratings (map_id, player_id, rating) VALUES (?1, ?2, ?3)',
                [mapId, player.id, rating]
            );
            await d1.execute(
                'UPDATE community_maps SET rating_sum = rating_sum + ?1, rating_count = rating_count + 1 WHERE id = ?2',
                [rating, mapId]
            );
        }

        res.json({ ok: true, rating });
    } catch (err) {
        console.error('[MAPS] Rate error:', err.message);
        res.status(500).json({ error: 'Failed to rate map.' });
    }
});

app.delete('/api/maps/:id', limitMapWrite, async (req, res) => {
    if (!d1.isConfigured()) {
        return res.status(503).json({ error: 'Database not configured.' });
    }
    const token = req.headers['x-auth-token'];
    if (!token) {
        return res.status(401).json({ error: 'Authentication required.' });
    }

    try {
        const player = await findPlayerByToken(token, 'id');
        if (!player) {
            return res.status(401).json({ error: 'Invalid token.' });
        }

        const map = await d1.getOne(
            'SELECT id, author_id FROM community_maps WHERE id = ?1',
            [req.params.id]
        );
        if (!map) {
            return res.status(404).json({ error: 'Map not found.' });
        }
        if (map.author_id !== player.id) {
            return res.status(403).json({ error: 'Not your map.' });
        }

        await d1.execute('DELETE FROM map_ratings WHERE map_id = ?1', [map.id]);
        await d1.execute('DELETE FROM community_maps WHERE id = ?1', [map.id]);

        res.json({ ok: true });
    } catch (err) {
        console.error('[MAPS] Delete error:', err.message);
        res.status(500).json({ error: 'Failed to delete map.' });
    }
});

function broadcastPlayerCount() {
    const count = io.engine.clientsCount;
    io.emit('player-count', { count });
}

io.on('connection', (socket) => {
    console.log(`[IO] Connected: ${socket.id}`);

    broadcastPlayerCount();

    socket.on('authenticate', async (data, callback) => {
        if (!d1.isConfigured()) {
            if (callback) callback({ error: 'Database not configured.' });
            return;
        }
        const token = data && data.token;
        if (!token) {
            if (callback) callback({ error: 'Token required.' });
            return;
        }
        try {
            const player = await findPlayerByToken(token,
                'id, username, elo, peak_elo, wins, losses');
            if (!player) {
                if (callback) callback({ error: 'Invalid token.' });
                return;
            }
            authenticatedSockets.set(socket.id, {
                playerId: player.id,
                username: player.username,
                elo: player.elo,
            });
            console.log(`[AUTH] Socket ${socket.id} authenticated as ${player.username} (ELO ${player.elo})`);
            if (callback) callback({
                ok: true,
                id: player.id,
                username: player.username,
                elo: player.elo,
                peakElo: player.peak_elo,
                wins: player.wins,
                losses: player.losses,
            });
        } catch (err) {
            console.error('[AUTH] Socket auth error:', err.message);
            if (callback) callback({ error: 'Authentication failed.' });
        }
    });

    socket.on('create-room', (data, callback) => {
        const code = generateCode();
        const username = (data && data.username) || 'Player 1';
        const rejoinToken = uuid();
        rooms.set(code, {
            host: socket.id,
            guest: null,
            hostUsername: username,
            guestUsername: null,
            created: Date.now(),
            rejoinToken: rejoinToken,
            _disconnected: null,
            _matchStarted: false
        });
        socket.join(code);
        console.log(`[IO] Room ${code} created by ${username} (${socket.id})`);
        if (callback) callback({ code, rejoinToken });
    });

    socket.on('join-room', (data, callback) => {
        const code = (data && data.code) ? data.code.toUpperCase().trim() : '';
        const username = (data && data.username) || 'Player 2';
        const room = rooms.get(code);

        if (!room) {
            if (callback) callback({ error: 'Room not found.' });
            return;
        }
        if (room.guest) {
            if (callback) callback({ error: 'Room is full.' });
            return;
        }

        room.guest = socket.id;
        room.guestUsername = username;
        if (!room.rejoinToken) room.rejoinToken = uuid();
        socket.join(code);
        console.log(`[IO] ${username} (${socket.id}) joined room ${code}`);

        if (callback) callback({ ok: true, rejoinToken: room.rejoinToken });

        io.to(code).emit('room-full', {
            host: room.host,
            guest: room.guest,
            hostUsername: room.hostUsername,
            guestUsername: room.guestUsername,
            rejoinToken: room.rejoinToken,

            friendlyConfig: room.friendlyConfig || null
        });
    });

    socket.on('friendly-config', (data) => {
        const found = findRoomBySocket(socket.id);
        if (!found) return;
        const { room } = found;

        if (room.host !== socket.id) return;
        room.friendlyConfig = data;

        socket.to(found.code).emit('friendly-config', data);
    });

    // A filler bot (bots.js) announces itself right after connecting. We also
    // retro-tag any queue entry it already created, so ordering vs queue-join
    // never matters.
    socket.on('bot-hello', () => {
        botSockets.add(socket.id);
        for (const ts in queues) {
            for (const e of queues[ts]) {
                if (e.socketId === socket.id) e.isBot = true;
            }
        }
        console.log(`[MM] 🤖 ${socket.id} identified as filler bot`);
    });

    socket.on('queue-join', (data) => {
        const teamSize = (data && data.teamSize) || 4;
        const rankedMode = (data && data.rankedMode) || 'arena';

        const auth = authenticatedSockets.get(socket.id);
        const username = auth ? auth.username : ((data && data.username) || 'Player');
        const elo = auth ? auth.elo : ((data && typeof data.elo === 'number') ? data.elo : 1200);
        const playerId = auth ? auth.playerId : null;

        removeFromAllQueues(socket.id);

        const queueKey = teamSize + ':' + rankedMode;
        const q = getQueue(queueKey);
        q.push({
            socketId: socket.id,
            playerId: playerId,
            username: username,
            elo: elo,
            joinedAt: Date.now(),
            teamSize: teamSize,
            rankedMode: rankedMode,
            isBot: botSockets.has(socket.id)
        });

        console.log(`[MM] ${username} (ELO ${elo}${auth ? ' [verified]' : ''}${botSockets.has(socket.id) ? ' 🤖' : ''}) joined ${teamSize}v${teamSize} ${rankedMode} queue (${q.length} in queue)`);

        socket.emit('queue-status', {
            position: q.length,
            teamSize: teamSize,
            queueSize: q.length
        });
    });

    socket.on('queue-leave', () => {
        const removed = removeFromAllQueues(socket.id);
        if (removed) {
            console.log(`[MM] ${socket.id} left queue`);
        }
        socket.emit('queue-left', { ok: true });
    });

    socket.on('game-action', (data) => {
        const found = findRoomBySocket(socket.id);
        if (!found) return;
        const { room, code } = found;
        if (!allowEvent(socket.id, 'game-action')) return;

        // Direction: only the GUEST ever emits game-action (the host applies
        // its own input locally and broadcasts state-sync). Anything else is
        // a spoofed/modified client.
        if (socket.id !== room.guest) {
            console.warn(`[GUARD] game-action from non-guest socket in room ${code} — dropped`);
            return;
        }

        // Turn ownership: the host's state-syncs told us whose turn it is,
        // and a handoff always reaches the server before the guest can act on
        // it — so a mutating action while activePlayer is 1 is out-of-turn.
        // Non-mutating UI mirroring (selectUnit/setTool/…) and forfeit stay
        // allowed at any time.
        const MUTATING = { clickTile: 1, engine: 1, triggerEndTurn: 1, useRosterItem: 1, recall: 1 };
        const ls = room._lastState;
        if (data && MUTATING[data.type] && ls && ls.phase === 'battle' && !ls.winner &&
            typeof ls.activePlayer === 'number' && ls.activePlayer !== 2) {
            console.warn(`[GUARD] out-of-turn '${data.type}' from guest in room ${code} — dropped`);
            replayWrite(room, { t: Date.now(), e: 'blocked', from: 'guest', reason: 'out-of-turn', type: data.type });
            return;
        }

        // Ownership hardening: forfeit/toggleAuto act on the SENDER, and in
        // this protocol only the guest (player 2) emits game-action — pin the
        // player field so a forged payload can't forfeit the host or flip the
        // host onto auto-play. (The host re-derives the sender too.)
        if (data && (data.type === 'forfeit' || data.type === 'toggleAuto')) {
            if (data.player !== 2) {
                console.warn(`[GUARD] '${data.type}' with forged player=${data.player} from guest in room ${code} — pinned to 2`);
            }
            data.player = 2;
        }

        replayWrite(room, { t: Date.now(), e: 'action', from: 'guest', data });
        socket.to(code).emit('game-action', data);
    });

    socket.on('state-sync', (data) => {
        const found = findRoomBySocket(socket.id);
        if (!found) return;
        const { room, code } = found;
        if (!allowEvent(socket.id, 'state-sync')) return;

        // Only the HOST is authoritative — a guest emitting state-sync would
        // let a modified client overwrite the real match state.
        if (socket.id !== room.host) {
            console.warn(`[GUARD] state-sync from non-host socket in room ${code} — dropped`);
            return;
        }

        if (data && typeof data === 'object') {
            // Rematch: the host clears the winner and restarts. Re-arm the
            // room — forfeits count again and the rematch may report its own
            // ranked result — and start a fresh replay segment.
            if (room._matchEnded && !data.winner && data.phase) {
                room._matchEnded = false;
                room._resultProcessed = false;
                room._battleStartAt = null;
                room._turnMark = null;
                replayWrite(room, { t: Date.now(), e: 'rematch' });
                if (room._replay) room._replay.hasBaseline = false;
            }
            room._lastState = {
                activePlayer: data.activePlayer,
                phase: data.phase,
                winner: data.winner ?? null,
                round: data.round,
            };
            room._lastSyncAt = Date.now();
            // Battle-start stamp: server-side match duration + stall watchdog
            // arming both key off this, never off host-reported numbers.
            if (data.phase === 'battle' && !room._battleStartAt) {
                room._battleStartAt = Date.now();
            }
            // Turn timer bookkeeping: the mark refreshes whenever the active
            // player or round advances; a mark that never refreshes is a stall.
            if (data.phase === 'battle' && !data.winner) {
                const tm = room._turnMark;
                if (!tm || tm.activePlayer !== data.activePlayer || tm.round !== data.round) {
                    room._turnMark = { activePlayer: data.activePlayer, round: data.round, at: Date.now() };
                }
            }
            maybeReplaySnapshot(room, data);
            // Ranked outcome is DERIVED from this mirrored stream — the same
            // state the guest renders — not from the host's ranked-result claim.
            if (room.ranked && room._matchStarted && !room._resultProcessed
                && (data.winner === 1 || data.winner === 2)) {
                applyRankedElo(room, code, data.winner, 'state-sync');
            }
        }
        socket.to(code).emit('state-sync', data);
    });

    socket.on('party-config', async (data) => {
        const found = findRoomBySocket(socket.id);
        if (!found) return;
        const { room } = found;
        if (!allowEvent(socket.id, 'party-config')) return;

        // Ranked guest parties get server-side validation before relay: clamp
        // every array to the match team size (a modified client could field
        // extra units) and verify the account actually OWNS each race it
        // fields — the client-side shop check is trivially bypassed.
        if (room.ranked && room.guest === socket.id && data && typeof data === 'object') {
            const ts = room.teamSize || 4;
            if (Array.isArray(data.builds) && data.builds.length > ts) data.builds = data.builds.slice(0, ts);
            if (Array.isArray(data.loadouts) && data.loadouts.length > ts) data.loadouts = data.loadouts.slice(0, ts);
            if (Array.isArray(data.meta) && data.meta.length > ts) data.meta = data.meta.slice(0, ts);

            const auth = authenticatedSockets.get(socket.id);
            if (auth && d1.isConfigured() && Array.isArray(data.meta)) {
                try {
                    const row = await d1.getOne('SELECT unlocked_units FROM players WHERE id = ?1', [auth.playerId]);
                    if (row) {
                        // Starters are an account floor even before backfill runs.
                        const owned = new Set(parseUnlocked(row.unlocked_units).concat(ECON.ACCT_STARTER_UNITS));
                        const illegal = data.meta
                            .map(m => m && m.race)
                            .filter(r => r && !owned.has(r));
                        if (illegal.length > 0) {
                            console.warn(`[GUARD] party-config with unowned units (${illegal.join(', ')}) from ${auth.username} in room ${found.code} — dropped`);
                            replayWrite(room, { t: Date.now(), e: 'blocked', from: 'guest', reason: 'unowned-units', races: illegal });
                            return;
                        }
                    }
                } catch (e) {
                    console.warn('[GUARD] party ownership check failed:', e.message);
                }
            }
        }

        // Loadouts are needed to reconstruct a match; they usually arrive
        // before match-started, so stash them until the replay file opens.
        const entry = {
            t: Date.now(), e: 'party-config',
            from: room.host === socket.id ? 'host' : 'guest',
            data,
        };
        if (room._replay) {
            replayWrite(room, entry);
        } else {
            (room._preMatchEvents = room._preMatchEvents || []).push(entry);
            if (room._preMatchEvents.length > 8) room._preMatchEvents.shift();
        }
        socket.to(found.code).emit('party-config', data);
    });

    socket.on('relay', (data) => {
        const found = findRoomBySocket(socket.id);
        if (!found) return;
        if (!allowEvent(socket.id, 'relay')) return;

        // Only the small semantic relays matter for replays — the VFX /
        // floating-text / camera streams are re-derivable from the actions.
        const SEMANTIC = { 'rematch-request': 1, 'guest-locked': 1, 'host-locked': 1, 'pickup-response': 1 };
        if (data && SEMANTIC[data.type]) {
            replayWrite(found.room, {
                t: Date.now(), e: 'relay',
                from: found.room.host === socket.id ? 'host' : 'guest',
                data,
            });
        }
        socket.to(found.code).emit('relay', data);
    });

    socket.on('ranked-result', (data) => {
        const found = findRoomBySocket(socket.id);
        if (!found) return;
        const { room, code } = found;

        if (room.host !== socket.id) return;
        if (!room.ranked) return;
        if (room._resultProcessed) return;
        if (!data || (data.winnerId !== 1 && data.winnerId !== 2)) return;

        // The host's claim must AGREE with the winner its own mirrored
        // state-sync stream reported. No mirrored winner yet → the
        // winner-carrying sync is still in flight; the state-sync handler
        // will record the ELO from the mirror, so nothing is lost by
        // ignoring the claim here. A contradicting claim is a forged result.
        const mirrored = room._lastState ? room._lastState.winner : null;
        if (mirrored !== data.winnerId) {
            if (mirrored === 1 || mirrored === 2) {
                console.warn(`[GUARD] ranked-result winner=${data.winnerId} contradicts mirrored state winner=${mirrored} in room ${code} — dropped`);
                replayWrite(room, {
                    t: Date.now(), e: 'blocked', from: 'host',
                    reason: 'result-mismatch', claimed: data.winnerId, mirrored,
                });
            }
            return;
        }
        applyRankedElo(room, code, data.winnerId, 'ranked-result');
    });

    socket.on('match-started', () => {
        const found = findRoomBySocket(socket.id);
        if (!found) return;
        found.room._matchStarted = true;
        // Snapshot both players' auth now: a disconnect-forfeit needs the
        // leaver's identity for ELO, but authenticatedSockets drops it the
        // moment the socket disconnects.
        if (!found.room._hostAuth) found.room._hostAuth = authenticatedSockets.get(found.room.host) || null;
        if (!found.room._guestAuth) found.room._guestAuth = authenticatedSockets.get(found.room.guest) || null;
        replayInit(found.room, found.code);
        console.log(`[IO] Room ${found.code} match started`);
    });

    socket.on('rejoin-room', (data, callback) => {
        const code = (data && data.roomCode) ? data.roomCode.toUpperCase().trim() : '';
        const token = data && data.rejoinToken;
        const room = rooms.get(code);

        if (!room || room.rejoinToken !== token) {
            if (callback) callback({ error: 'Room not found or invalid token.' });
            return;
        }

        const dc = room._disconnected;
        if (!dc) {
            if (callback) callback({ error: 'No pending reconnection.' });
            return;
        }

        if (dc.timer) clearTimeout(dc.timer);

        const role = dc.role;
        if (role === 'host') {
            room.host = socket.id;
        } else {
            room.guest = socket.id;
        }
        room._disconnected = null;

        socket.join(code);
        console.log(`[IO] ${role} rejoined room ${code} as ${socket.id}`);
        replayWrite(room, { t: Date.now(), e: 'rejoin', role });

        if (callback) callback({ ok: true, role: role, myPlayer: role === 'host' ? 1 : 2 });

        io.to(code).emit('player-rejoined', { role: role, socketId: socket.id });
    });

    socket.on('disconnect', () => {
        console.log(`[IO] Disconnected: ${socket.id}`);

        broadcastPlayerCount();

        removeFromAllQueues(socket.id);

        authenticatedSockets.delete(socket.id);
        botSockets.delete(socket.id);
        _rateBuckets.delete(socket.id);

        const found = findRoomBySocket(socket.id);
        if (!found) return;

        const { code, room } = found;
        const role = room.host === socket.id ? 'host' : 'guest';

        if (!room._matchStarted) {
            socket.to(code).emit('player-disconnected', { role, reconnectable: false });
            rooms.delete(code);
            return;
        }

        // Match already decided (winner synced or ranked result processed):
        // a departure now is someone leaving the result screen, not a
        // forfeit. Close the room cleanly — postMatch tells the remaining
        // client to keep its result screen instead of reloading.
        if (room._matchEnded || room._resultProcessed) {
            console.log(`[IO] ${role} left room ${code} post-match — closing room`);
            socket.to(code).emit('player-disconnected', { role, reconnectable: false, postMatch: true });
            replayEnd(room, 'closed');
            rooms.delete(code);
            return;
        }

        console.log(`[IO] ${role} disconnected from room ${code} — 90s rejoin window`);

        socket.to(code).emit('player-disconnected', { role, reconnectable: true });
        replayWrite(room, { t: Date.now(), e: 'disconnect', role });

        room._disconnected = {
            role: role,
            socketId: socket.id,
            timer: setTimeout(() => {

                console.log(`[IO] ${role} failed to rejoin room ${code} — forfeit`);
                const forfeitPlayer = role === 'host' ? 1 : 2;
                io.to(code).emit('match-forfeit', { forfeitPlayer: forfeitPlayer, role: role });
                // A disconnect-forfeit is a real loss: record the ELO for the
                // remaining player instead of letting the leaver escape rating-free.
                applyRankedElo(room, code, forfeitPlayer === 1 ? 2 : 1, 'disconnect-forfeit');
                replayEnd(room, 'forfeit', { forfeitPlayer });
                rooms.delete(code);
            }, 90 * 1000)
        };
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[Entropy Wars] Server running on port ${PORT}`);
    ensureMigrations()
        .then(backfillTokenHashes)
        .catch(err => console.error('[DB] boot migration failed:', err.message));
});
