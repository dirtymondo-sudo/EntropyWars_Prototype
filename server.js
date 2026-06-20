const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const crypto = require('crypto');
const d1 = require('./d1');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' },
    transports: ['websocket', 'polling']
});

app.use(express.json());

app.use(express.static(path.join(__dirname), {
    extensions: ['html'],
    index: 'index.html'
}));

function uuid() { return crypto.randomUUID(); }

// ── ACCOUNT ECONOMY (PvP) — server-authoritative wallet + unlock system ──
// data.js is browser-only (assigns to `window`), so the server keeps its own
// copy of the economy constants + race list. Keep these in sync with data.js.
const ACCT_UNIT_PRICE     = 5000;
const ACCT_STARTING_GOLD  = 0;
const ACCT_FREE_TOKENS    = 1;
const ACCT_MATCH_GOLD_CAP = 5000;
const ACCT_PVP_MODES = new Set(['arena', 'tdm', 'ffa', 'domination', 'hotspot', 'ctf']);
const ACCT_STARTER_UNITS = [
    'men in black', 'wizard', 'werewolf', 'mad scientist', 'homosapien', 'catgirl',
    'fortune teller', 'bigfoot', 'grey', 'marksman', 'knight', 'fairy',
];
const AVAILABLE_RACES = new Set(['homosapien', 'pirate', 'knight', 'shaman', 'mad scientist', 'cowboy', 'men in black', 'telepath', 'marksman', 'priest', 'wizard', 'fortune teller', 'giant', 'fairy', 'martian', 'nordic', 'grey', 'bigfoot', 'shadow entity', 'reptilian', 'ai', 'robot', 'android', 'angel', 'seraphim', 'orb of light', 'demon', 'succubus', 'skeleton', 'mech', 'ghost', 'zombie', 'annunaki', 'skinwalker', 'werewolf', 'gargoyle', 'djinn', 'anubis', 'catgirl', 'mantid', 'antperson', 'mothman', 'siren', 'scarecrow', 'glitch', 'machine elves', 'cyclops', 'cyborg', 'demon prince', 'demon princess', 'dreameater', 'fallen angel', 'goatman', 'halfdemon', 'mermaid', 'nephilim', 'vampire', 'voidweaver', 'cosmic wraith', 'superhero', 'general', 'droid', 'antihero', 'conspiracy theorist', 'overlord', 'chosen one', 'politician', 'atlantean', 'dinosaur', 'dragon', 'ghoul', 'gnome', 'kaiju', 'kraken', 'loch ness monster', 'yeti', 'barbarella', 'black goo', 'golem', 'honda civic', 'ice queen', 'juggernaut', 'ki fighter', 'king arthur', 'king kong', 'minotaur', 'necromancer', 'occulus', 'quarterback', 'robinhood', 'santa clause', 'super sentai', 'symbiote', 'valkraye', 'watcher']);

let _economyMigrated = false;
async function ensureEconomyColumns() {
    if (_economyMigrated || !d1.isConfigured()) return;
    const stmts = [
        "ALTER TABLE players ADD COLUMN gold INTEGER NOT NULL DEFAULT 0",
        "ALTER TABLE players ADD COLUMN unlocked_units TEXT NOT NULL DEFAULT '[]'",
        "ALTER TABLE players ADD COLUMN free_tokens INTEGER NOT NULL DEFAULT 0",
    ];
    for (const sql of stmts) {
        try { await d1.execute(sql); console.log('[ECON] migrated:', sql); }
        catch (e) { /* duplicate column on re-boot — expected, ignore */ }
    }
    _economyMigrated = true;
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
        unlocked = ACCT_STARTER_UNITS.slice();
        freeTokens = ACCT_FREE_TOKENS;
        await d1.execute(
            "UPDATE players SET unlocked_units = ?1, free_tokens = ?2 WHERE id = ?3 AND (unlocked_units IS NULL OR unlocked_units = '' OR unlocked_units = '[]')",
            [JSON.stringify(unlocked), freeTokens, player.id]
        );
        console.log(`[ECON] backfilled starters for ${player.id}`);
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

const queues = {};

const MAP_POOL = [
    { modeId: 'prebuilt_apartment', w: 4, h: 4, team: 2 },
    { modeId: 'prebuilt_skirmish', w: 8, h: 8, team: 4 },
    { modeId: 'prebuilt_suburb', w: 8, h: 8, team: 4 },
    { modeId: 'prebuilt_bunker', w: 8, h: 8, team: 4 },
    { modeId: 'prebuilt_tundra', w: 8, h: 8, team: 4 },
    { modeId: 'prebuilt_fungal_hollow', w: 8, h: 8, team: 4 },
    { modeId: 'prebuilt_ravine', w: 10, h: 10, team: 4 },
    { modeId: 'prebuilt_bleed_arena', w: 10, h: 10, team: 4 },
    { modeId: 'prebuilt_oasis', w: 10, h: 10, team: 4 },
    { modeId: 'prebuilt_dark_forest', w: 10, h: 10, team: 4 },
    { modeId: 'prebuilt_compound', w: 12, h: 12, team: 4 },
    { modeId: 'prebuilt_battlefield', w: 12, h: 12, team: 4 },
    { modeId: 'prebuilt_bastion', w: 12, h: 12, team: 4 },
    { modeId: 'prebuilt_mountain', w: 12, h: 12, team: 4 },
    { modeId: 'prebuilt_quarry', w: 12, h: 12, team: 4 },
    { modeId: 'prebuilt_volcanic_rift', w: 12, h: 12, team: 4 },
    { modeId: 'prebuilt_toxic_marsh', w: 12, h: 12, team: 4 },
    { modeId: 'prebuilt_frozen_citadel', w: 12, h: 12, team: 4 },
    { modeId: 'prebuilt_rift_plaza', w: 12, h: 12, team: 6 },
    { modeId: 'prebuilt_cavern', w: 12, h: 12, team: 6 },
    { modeId: 'prebuilt_workshop', w: 12, h: 12, team: 6 },
    { modeId: 'prebuilt_killbox', w: 12, h: 12, team: 6 },
    { modeId: 'prebuilt_dreamscape', w: 12, h: 12, team: 6 },
    { modeId: 'prebuilt_crossroads', w: 16, h: 16, team: 4 },
    { modeId: 'prebuilt_highlands', w: 16, h: 16, team: 4 },
    { modeId: 'prebuilt_crater', w: 16, h: 16, team: 6 },
    { modeId: 'prebuilt_fortress', w: 16, h: 16, team: 6 },
    { modeId: 'prebuilt_archipelago', w: 16, h: 16, team: 4 },
    { modeId: 'prebuilt_lattice', w: 16, h: 16, team: 8 },
    { modeId: 'prebuilt_palimpsest', w: 16, h: 16, team: 8 },
    { modeId: 'prebuilt_pyramid', w: 16, h: 16, team: 8 },
    { modeId: 'prebuilt_citadel', w: 20, h: 20, team: 4 },
    { modeId: 'prebuilt_caldera', w: 20, h: 20, team: 4 },
    { modeId: 'prebuilt_nexus_core', w: 20, h: 20, team: 10 },
    { modeId: 'prebuilt_babel', w: 20, h: 20, team: 6 },
    { modeId: 'prebuilt_skybridge', w: 20, h: 20, team: 8 },
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

                    const actualTeamSize = a.teamSize || parseInt(queueKey);
                    const rankedMode = a.rankedMode || 'arena';
                    const code = generateCode();
                    const map = pickRandomMap(actualTeamSize);

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

app.get('/api/queue-stats', (req, res) => {
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
app.post('/api/bot/sync-elo', async (req, res) => {
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
        const player = await d1.getOne('SELECT id FROM players WHERE token = ?1', [token]);
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

app.post('/api/register', async (req, res) => {
    if (!d1.isConfigured()) {
        return res.status(503).json({ error: 'Database not configured. Set CF_ACCOUNT_ID, CF_D1_DATABASE_ID, CF_API_TOKEN.' });
    }

    const { username } = req.body || {};
    if (!username || !USERNAME_RE.test(username)) {
        return res.status(400).json({ error: 'Invalid username. 2-16 chars, alphanumeric and underscores only.' });
    }

    try {
        await ensureEconomyColumns();

        const existing = await d1.getOne('SELECT id FROM players WHERE username = ?1', [username]);
        if (existing) {
            return res.status(409).json({ error: 'Username already taken.' });
        }

        const id = uuid();
        const token = uuid();
        const starters = JSON.stringify(ACCT_STARTER_UNITS);

        await d1.execute(
            'INSERT INTO players (id, username, token, elo, peak_elo, wins, losses, total_games, gold, unlocked_units, free_tokens) VALUES (?1, ?2, ?3, 1200, 1200, 0, 0, 0, ?4, ?5, ?6)',
            [id, username, token, ACCT_STARTING_GOLD, starters, ACCT_FREE_TOKENS]
        );

        console.log(`[AUTH] Registered: ${username} (${id})`);
        res.json({
            id, token, username, elo: 1200, peakElo: 1200, wins: 0, losses: 0,
            gold: ACCT_STARTING_GOLD, unlockedUnits: ACCT_STARTER_UNITS.slice(), freeTokens: ACCT_FREE_TOKENS,
        });
    } catch (err) {
        console.error('[AUTH] Register error:', err.message);
        res.status(500).json({ error: 'Registration failed.' });
    }
});

app.post('/api/login', async (req, res) => {
    if (!d1.isConfigured()) {
        return res.status(503).json({ error: 'Database not configured.' });
    }

    const { token } = req.body || {};
    if (!token) {
        return res.status(400).json({ error: 'Token required.' });
    }

    try {
        await ensureEconomyColumns();
        const player = await d1.getOne(
            'SELECT id, username, elo, peak_elo, wins, losses, total_games, gold, unlocked_units, free_tokens FROM players WHERE token = ?1',
            [token]
        );

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
app.get('/api/economy/:id', async (req, res) => {
    if (!d1.isConfigured()) {
        return res.status(503).json({ error: 'Database not configured.' });
    }
    try {
        await ensureEconomyColumns();
        const token = req.headers['x-auth-token'] || req.query.token;
        // Resolve by token when supplied (authoritative); otherwise fall back to id.
        const player = token
            ? await d1.getOne('SELECT id, gold, unlocked_units, free_tokens FROM players WHERE token = ?1', [token])
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

app.post('/api/economy/bank', async (req, res) => {
    if (!d1.isConfigured()) {
        return res.status(503).json({ error: 'Database not configured.' });
    }
    try {
        await ensureEconomyColumns();
        const { token, matchGold, mode } = req.body || {};
        if (!token) {
            return res.status(401).json({ error: 'Authentication required.' });
        }
        if (!ACCT_PVP_MODES.has(mode)) {
            return res.status(400).json({ error: 'Unrecognized PvP mode.' });
        }
        const player = await d1.getOne('SELECT id, gold, unlocked_units, free_tokens FROM players WHERE token = ?1', [token]);
        if (!player) {
            return res.status(401).json({ error: 'Invalid token.' });
        }
        let amt = Math.round(Number(matchGold));
        if (!isFinite(amt) || amt < 0) amt = 0;
        amt = Math.min(amt, ACCT_MATCH_GOLD_CAP); // server-enforced anti-cheat cap

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

app.post('/api/economy/purchase', async (req, res) => {
    if (!d1.isConfigured()) {
        return res.status(503).json({ error: 'Database not configured.' });
    }
    try {
        await ensureEconomyColumns();
        const { token, raceKey, useToken } = req.body || {};
        if (!token) {
            return res.status(401).json({ error: 'Authentication required.' });
        }
        if (!raceKey || !AVAILABLE_RACES.has(raceKey)) {
            return res.status(400).json({ error: 'Unknown unit.' });
        }
        const player = await d1.getOne('SELECT id, gold, unlocked_units, free_tokens FROM players WHERE token = ?1', [token]);
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
            if ((fresh.gold || 0) < ACCT_UNIT_PRICE) {
                return res.status(402).json({ error: 'Insufficient gold.' });
            }
            // Atomic: WHERE gold >= price prevents double-spend on concurrent clicks.
            result = await d1.execute(
                'UPDATE players SET gold = gold - ?1, unlocked_units = ?2 WHERE id = ?3 AND gold >= ?1 AND unlocked_units = ?4',
                [ACCT_UNIT_PRICE, newUnlocked, player.id, fresh.unlocked_units]
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

app.get('/api/player/:id', async (req, res) => {
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

app.get('/api/check-username/:username', async (req, res) => {
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

app.get('/api/leaderboard', async (req, res) => {
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

app.get('/api/matches', async (req, res) => {
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

app.get('/api/player/:id/rank', async (req, res) => {
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

app.post('/api/maps', async (req, res) => {
    if (!d1.isConfigured()) {
        return res.status(503).json({ error: 'Database not configured.' });
    }
    const token = req.headers['x-auth-token'];
    if (!token) {
        return res.status(401).json({ error: 'Authentication required.' });
    }

    try {
        const player = await d1.getOne(
            'SELECT id, username FROM players WHERE token = ?1',
            [token]
        );
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

app.get('/api/maps', async (req, res) => {
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

app.get('/api/maps/:id', async (req, res) => {
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

app.post('/api/maps/:id/rate', async (req, res) => {
    if (!d1.isConfigured()) {
        return res.status(503).json({ error: 'Database not configured.' });
    }
    const token = req.headers['x-auth-token'];
    if (!token) {
        return res.status(401).json({ error: 'Authentication required.' });
    }

    try {
        const player = await d1.getOne('SELECT id FROM players WHERE token = ?1', [token]);
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

app.delete('/api/maps/:id', async (req, res) => {
    if (!d1.isConfigured()) {
        return res.status(503).json({ error: 'Database not configured.' });
    }
    const token = req.headers['x-auth-token'];
    if (!token) {
        return res.status(401).json({ error: 'Authentication required.' });
    }

    try {
        const player = await d1.getOne('SELECT id FROM players WHERE token = ?1', [token]);
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
            const player = await d1.getOne(
                'SELECT id, username, elo, peak_elo, wins, losses FROM players WHERE token = ?1',
                [token]
            );
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

        socket.to(found.code).emit('game-action', data);
    });

    socket.on('state-sync', (data) => {
        const found = findRoomBySocket(socket.id);
        if (!found) return;
        socket.to(found.code).emit('state-sync', data);
    });

    socket.on('party-config', (data) => {
        const found = findRoomBySocket(socket.id);
        if (!found) return;
        socket.to(found.code).emit('party-config', data);
    });

    socket.on('relay', (data) => {
        const found = findRoomBySocket(socket.id);
        if (!found) return;
        socket.to(found.code).emit('relay', data);
    });

    socket.on('ranked-result', async (data) => {
        const found = findRoomBySocket(socket.id);
        if (!found) return;
        const { room, code } = found;

        if (room.host !== socket.id) return;

        if (!room.ranked) return;

        if (room._resultProcessed) return;
        room._resultProcessed = true;

        const winnerId = data.winnerId;
        const loserId = data.loserId;
        const durationMs = data.durationMs || 0;
        const teamSize = room.teamSize || 4;
        const mapModeId = room.mapModeId || null;

        if (durationMs < 30000) {
            console.warn(`[ELO] Rejected fast match (${durationMs}ms) in room ${code}`);
            return;
        }

        if (!d1.isConfigured()) {
            console.warn('[ELO] D1 not configured — skipping server-side ELO');
            return;
        }

        const hostAuth = authenticatedSockets.get(room.host);
        const guestAuth = authenticatedSockets.get(room.guest);
        if (!hostAuth || !guestAuth) {
            console.warn(`[ELO] Unauthenticated players in room ${code} — skipping`);
            return;
        }

        const hostPlayerId = hostAuth.playerId;
        const guestPlayerId = guestAuth.playerId;

        const actualWinnerId = winnerId === 1 ? hostPlayerId : guestPlayerId;
        const actualLoserId = loserId === 1 ? hostPlayerId : guestPlayerId;

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

            console.log(`[ELO] ${hostAuth.username} vs ${guestAuth.username}: winner=${actualWinnerId === hostPlayerId ? hostAuth.username : guestAuth.username} (${winner.elo}→${newWinnerElo}), loser=(${loser.elo}→${newLoserElo})`);

            if (actualWinnerId === hostPlayerId) {
                hostAuth.elo = newWinnerElo;
                guestAuth.elo = newLoserElo;
            } else {
                guestAuth.elo = newLoserElo;
                hostAuth.elo = newWinnerElo;
            }

            const hostSocket = io.sockets.sockets.get(room.host);
            const guestSocket = io.sockets.sockets.get(room.guest);

            if (hostSocket) {
                const isHostWinner = actualWinnerId === hostPlayerId;
                hostSocket.emit('elo-update', {
                    myNewElo: isHostWinner ? newWinnerElo : newLoserElo,
                    myEloDelta: isHostWinner ? winnerDelta : loserDelta,
                    opponentNewElo: isHostWinner ? newLoserElo : newWinnerElo,
                });
            }
            if (guestSocket) {
                const isGuestWinner = actualWinnerId === guestPlayerId;
                guestSocket.emit('elo-update', {
                    myNewElo: isGuestWinner ? newWinnerElo : newLoserElo,
                    myEloDelta: isGuestWinner ? winnerDelta : loserDelta,
                    opponentNewElo: isGuestWinner ? newLoserElo : newWinnerElo,
                });
            }
        } catch (err) {
            console.error('[ELO] Error calculating ELO:', err.message);
        }
    });

    socket.on('match-started', () => {
        const found = findRoomBySocket(socket.id);
        if (!found) return;
        found.room._matchStarted = true;
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

        if (callback) callback({ ok: true, role: role, myPlayer: role === 'host' ? 1 : 2 });

        io.to(code).emit('player-rejoined', { role: role, socketId: socket.id });
    });

    socket.on('disconnect', () => {
        console.log(`[IO] Disconnected: ${socket.id}`);

        broadcastPlayerCount();

        removeFromAllQueues(socket.id);

        authenticatedSockets.delete(socket.id);
        botSockets.delete(socket.id);

        const found = findRoomBySocket(socket.id);
        if (!found) return;

        const { code, room } = found;
        const role = room.host === socket.id ? 'host' : 'guest';

        if (!room._matchStarted) {
            socket.to(code).emit('player-disconnected', { role, reconnectable: false });
            rooms.delete(code);
            return;
        }

        console.log(`[IO] ${role} disconnected from room ${code} — 90s rejoin window`);

        socket.to(code).emit('player-disconnected', { role, reconnectable: true });

        room._disconnected = {
            role: role,
            socketId: socket.id,
            timer: setTimeout(() => {

                console.log(`[IO] ${role} failed to rejoin room ${code} — forfeit`);
                const forfeitPlayer = role === 'host' ? 1 : 2;
                io.to(code).emit('match-forfeit', { forfeitPlayer: forfeitPlayer, role: role });
                rooms.delete(code);
            }, 90 * 1000)
        };
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[Entropy Wars] Server running on port ${PORT}`);
    ensureEconomyColumns().catch(err => console.error('[ECON] Migration failed:', err.message));
});
