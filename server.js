// ── Entropy Wars: Multiplayer Server ──
// Express + Socket.IO — serves static files, room-code matchmaking, ranked queue, and player accounts.

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

// ── JSON body parsing for API endpoints ──
app.use(express.json());

// ── Serve static files from repo root ──
app.use(express.static(path.join(__dirname), {
    extensions: ['html'],
    index: 'index.html'
}));

function uuid() { return crypto.randomUUID(); }

// ── Room storage ──
const rooms = new Map(); // code → { host, guest, hostUsername, guestUsername, created, ranked, mapModeId, teamSize }

function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I/O to avoid confusion
    let code = '';
    for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return rooms.has(code) ? generateCode() : code;
}

// ── Stale room cleanup (every 10 min, remove rooms older than 2 hours with no guest) ──
setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms) {
        if (!room.guest && now - room.created > 2 * 60 * 60 * 1000) {
            rooms.delete(code);
            console.log(`[IO] Cleaned stale room ${code}`);
        }
    }
}, 10 * 60 * 1000);

// ── Helper: find room by socket ID ──
function findRoomBySocket(socketId) {
    for (const [code, room] of rooms) {
        if (room.host === socketId || room.guest === socketId) return { code, room };
    }
    return null;
}

// ══════════════════════════════════════════════════════
// ── MATCHMAKING QUEUE ──
// ══════════════════════════════════════════════════════

// queues[teamSize] = [ { socketId, username, elo, joinedAt } ]
const queues = {};

// Available maps grouped by approximate team size compatibility
// Maps that support >= teamSize players on each side
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
    // Filter maps that support at least this team size
    const eligible = MAP_POOL.filter(m => m.team >= teamSize);
    if (eligible.length === 0) {
        // Fallback: pick maps closest to the team size
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

// Matchmaking scan — runs every 3 seconds
setInterval(() => {
    const now = Date.now();
    for (const queueKey in queues) {
        const q = queues[queueKey];
        if (q.length < 2) continue;

        // Sort by ELO for adjacency matching
        q.sort((a, b) => a.elo - b.elo);

        const matched = new Set();

        for (let i = 0; i < q.length - 1; i++) {
            if (matched.has(i)) continue;

            const a = q[i];
            const waitTimeA = now - a.joinedAt;

            // Expand ELO range over time
            let eloRange = 200;
            if (waitTimeA > 30000) eloRange = 400;
            if (waitTimeA > 60000) eloRange = 800;
            if (waitTimeA > 90000) eloRange = Infinity; // match with anyone

            for (let j = i + 1; j < q.length; j++) {
                if (matched.has(j)) continue;

                const b = q[j];
                const waitTimeB = now - b.joinedAt;
                const maxWait = Math.max(waitTimeA, waitTimeB);

                // Also expand based on opponent's wait time
                let range = eloRange;
                if (maxWait > 30000) range = Math.max(range, 400);
                if (maxWait > 60000) range = Math.max(range, 800);
                if (maxWait > 90000) range = Infinity;

                if (Math.abs(a.elo - b.elo) <= range) {
                    // MATCH FOUND
                    matched.add(i);
                    matched.add(j);

                    const actualTeamSize = a.teamSize || parseInt(queueKey);
                    const rankedMode = a.rankedMode || 'arena';
                    const code = generateCode();
                    const map = pickRandomMap(actualTeamSize);

                    // Higher ELO = host (or random if equal)
                    let host = a, guest = b;
                    if (b.elo > a.elo || (b.elo === a.elo && Math.random() > 0.5)) {
                        host = b;
                        guest = a;
                    }

                    // Create room
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

                    // Join both sockets to the room
                    const hostSocket = io.sockets.sockets.get(host.socketId);
                    const guestSocket = io.sockets.sockets.get(guest.socketId);

                    if (hostSocket) hostSocket.join(code);
                    if (guestSocket) guestSocket.join(code);

                    console.log(`[MM] Matched ${host.username} (${host.elo}) vs ${guest.username} (${guest.elo}) → Room ${code} on ${map.modeId} [${rankedMode}] (${actualTeamSize}v${actualTeamSize})`);

                    // Notify both players
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

                    // Also emit room-full to trigger the existing online flow
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

                    break; // Move to next unmatched player
                }
            }
        }

        // Remove matched players from queue (iterate backwards)
        const indices = [...matched].sort((a, b) => b - a);
        for (const idx of indices) {
            q.splice(idx, 1);
        }
    }
}, 3000);

// ── Queue stats endpoint (for debugging / monitoring) ──
app.get('/api/queue-stats', (req, res) => {
    const stats = {};
    for (const key in queues) {
        stats[key] = queues[key].length;
    }
    res.json({ queues: stats, rooms: rooms.size });
});

// ══════════════════════════════════════════════════════
// ── PLAYER ACCOUNTS (D1) ──
// ══════════════════════════════════════════════════════

// In-memory authenticated sockets: socketId → { playerId, username, elo }
const authenticatedSockets = new Map();

// Username validation (matches client-side USERNAME_RE)
const USERNAME_RE = /^[A-Za-z0-9_]{2,16}$/;

// ── POST /api/register — create a new player account ──
app.post('/api/register', async (req, res) => {
    if (!d1.isConfigured()) {
        return res.status(503).json({ error: 'Database not configured. Set CF_ACCOUNT_ID, CF_D1_DATABASE_ID, CF_API_TOKEN.' });
    }

    const { username } = req.body || {};
    if (!username || !USERNAME_RE.test(username)) {
        return res.status(400).json({ error: 'Invalid username. 2-16 chars, alphanumeric and underscores only.' });
    }

    try {
        // Check if username already exists
        const existing = await d1.getOne('SELECT id FROM players WHERE username = ?1', [username]);
        if (existing) {
            return res.status(409).json({ error: 'Username already taken.' });
        }

        const id = uuid();
        const token = uuid();

        await d1.execute(
            'INSERT INTO players (id, username, token, elo, peak_elo, wins, losses, total_games) VALUES (?1, ?2, ?3, 1200, 1200, 0, 0, 0)',
            [id, username, token]
        );

        console.log(`[AUTH] Registered: ${username} (${id})`);
        res.json({ id, token, username, elo: 1200, peakElo: 1200, wins: 0, losses: 0 });
    } catch (err) {
        console.error('[AUTH] Register error:', err.message);
        res.status(500).json({ error: 'Registration failed.' });
    }
});

// ── POST /api/login — validate token, return player data ──
app.post('/api/login', async (req, res) => {
    if (!d1.isConfigured()) {
        return res.status(503).json({ error: 'Database not configured.' });
    }

    const { token } = req.body || {};
    if (!token) {
        return res.status(400).json({ error: 'Token required.' });
    }

    try {
        const player = await d1.getOne(
            'SELECT id, username, elo, peak_elo, wins, losses, total_games FROM players WHERE token = ?1',
            [token]
        );

        if (!player) {
            return res.status(401).json({ error: 'Invalid token.' });
        }

        // Update last_seen
        await d1.execute('UPDATE players SET last_seen = datetime(\'now\') WHERE id = ?1', [player.id]);

        console.log(`[AUTH] Login: ${player.username} (${player.id})`);
        res.json({
            id: player.id,
            username: player.username,
            elo: player.elo,
            peakElo: player.peak_elo,
            wins: player.wins,
            losses: player.losses,
            totalGames: player.total_games,
        });
    } catch (err) {
        console.error('[AUTH] Login error:', err.message);
        res.status(500).json({ error: 'Login failed.' });
    }
});

// ── GET /api/player/:id — public player info ──
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

// ── GET /api/check-username/:username — check if username is available ──
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


// ══════════════════════════════════════════════════════
// ── LEADERBOARD & MATCH HISTORY API ──
// ══════════════════════════════════════════════════════

// ── GET /api/leaderboard ──
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

// ── GET /api/matches — match history for a player ──
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

// ── GET /api/player/:id/rank — player's rank position ──
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
        // Count players with higher ELO
        const result = await d1.getOne(
            'SELECT COUNT(*) as rank FROM players WHERE elo > ?1',
            [player.elo]
        );
        res.json({ rank: (result ? result.rank : 0) + 1, elo: player.elo });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get rank.' });
    }
});

// ══════════════════════════════════════════════════════
// ── COMMUNITY MAPS API ──
// ══════════════════════════════════════════════════════

// ── POST /api/maps — submit a community map ──
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

        // Parse to validate and extract dimensions
        let parsed;
        try {
            parsed = typeof mapJson === 'string' ? JSON.parse(mapJson) : mapJson;
        } catch {
            return res.status(400).json({ error: 'Invalid map JSON.' });
        }
        if (!parsed.w || !parsed.h || !parsed.grid) {
            return res.status(400).json({ error: 'Map JSON must have w, h, and grid.' });
        }

        // Limit: 500KB for map JSON
        const jsonStr = typeof mapJson === 'string' ? mapJson : JSON.stringify(mapJson);
        if (jsonStr.length > 500000) {
            return res.status(400).json({ error: 'Map data too large (max 500KB).' });
        }

        // Limit: 20 maps per player
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

// ── GET /api/maps — browse community maps ──
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

// ── GET /api/maps/:id — get a single map with full JSON ──
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
        // Increment play count
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

// ── POST /api/maps/:id/rate — rate a community map (1-5) ──
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
        // Can't rate your own map
        if (map.author_id === player.id) {
            return res.status(400).json({ error: 'Cannot rate your own map.' });
        }

        // Upsert rating
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
            // Adjust community_maps rating_sum
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

// ── DELETE /api/maps/:id — delete your own map ──
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


// ── Socket.IO ──
io.on('connection', (socket) => {
    console.log(`[IO] Connected: ${socket.id}`);

    // ── Authenticate socket (attach player identity for ranked) ──
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
    // ── Create room ──
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
            _disconnected: null,      // { role, socketId, timer }
            _matchStarted: false
        });
        socket.join(code);
        console.log(`[IO] Room ${code} created by ${username} (${socket.id})`);
        if (callback) callback({ code, rejoinToken });
    });

    // ── Join room ──
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

        // Notify both players — include rejoinToken so both can rejoin on disconnect
        io.to(code).emit('room-full', {
            host: room.host,
            guest: room.guest,
            hostUsername: room.hostUsername,
            guestUsername: room.guestUsername,
            rejoinToken: room.rejoinToken,
            // Include host's friendly config if present
            friendlyConfig: room.friendlyConfig || null
        });
    });

    // ── Host sets friendly match config (before match starts) ──
    socket.on('friendly-config', (data) => {
        const found = findRoomBySocket(socket.id);
        if (!found) return;
        const { room } = found;
        // Only host can set config
        if (room.host !== socket.id) return;
        room.friendlyConfig = data;
        // Relay to guest
        socket.to(found.code).emit('friendly-config', data);
    });

    // ── Join matchmaking queue ──
    socket.on('queue-join', (data) => {
        const teamSize = (data && data.teamSize) || 4;
        const rankedMode = (data && data.rankedMode) || 'arena';

        // Prefer server-side identity from authenticated socket
        const auth = authenticatedSockets.get(socket.id);
        const username = auth ? auth.username : ((data && data.username) || 'Player');
        const elo = auth ? auth.elo : ((data && typeof data.elo === 'number') ? data.elo : 1200);
        const playerId = auth ? auth.playerId : null;

        // Remove from any existing queue first
        removeFromAllQueues(socket.id);

        // Queue key combines team size AND ranked mode so arena/tdm players don't mix
        const queueKey = teamSize + ':' + rankedMode;
        const q = getQueue(queueKey);
        q.push({
            socketId: socket.id,
            playerId: playerId,
            username: username,
            elo: elo,
            joinedAt: Date.now(),
            teamSize: teamSize,
            rankedMode: rankedMode
        });

        console.log(`[MM] ${username} (ELO ${elo}${auth ? ' [verified]' : ''}) joined ${teamSize}v${teamSize} ${rankedMode} queue (${q.length} in queue)`);

        // Send queue position feedback
        socket.emit('queue-status', {
            position: q.length,
            teamSize: teamSize,
            queueSize: q.length
        });
    });

    // ── Leave matchmaking queue ──
    socket.on('queue-leave', () => {
        const removed = removeFromAllQueues(socket.id);
        if (removed) {
            console.log(`[MM] ${socket.id} left queue`);
        }
        socket.emit('queue-left', { ok: true });
    });

    // ── Game action (guest → host) ──
    socket.on('game-action', (data) => {
        const found = findRoomBySocket(socket.id);
        if (!found) return;
        // Forward to the other player in the room
        socket.to(found.code).emit('game-action', data);
    });

    // ── State sync (host → guest) ──
    socket.on('state-sync', (data) => {
        const found = findRoomBySocket(socket.id);
        if (!found) return;
        socket.to(found.code).emit('state-sync', data);
    });

    // ── Party config (guest → host) ──
    socket.on('party-config', (data) => {
        const found = findRoomBySocket(socket.id);
        if (!found) return;
        socket.to(found.code).emit('party-config', data);
    });

    // ── Generic relay (bidirectional) ──
    socket.on('relay', (data) => {
        const found = findRoomBySocket(socket.id);
        if (!found) return;
        socket.to(found.code).emit('relay', data);
    });

    // ── Ranked match result — server-side ELO calculation ──
    socket.on('ranked-result', async (data) => {
        const found = findRoomBySocket(socket.id);
        if (!found) return;
        const { room, code } = found;

        // Only host can report results
        if (room.host !== socket.id) return;
        // Must be a ranked room
        if (!room.ranked) return;
        // Only process once per room
        if (room._resultProcessed) return;
        room._resultProcessed = true;

        const winnerId = data.winnerId;
        const loserId = data.loserId;
        const durationMs = data.durationMs || 0;
        const teamSize = room.teamSize || 4;
        const mapModeId = room.mapModeId || null;

        // Anti-cheat: reject suspiciously fast matches
        if (durationMs < 30000) {
            console.warn(`[ELO] Rejected fast match (${durationMs}ms) in room ${code}`);
            return;
        }

        if (!d1.isConfigured()) {
            console.warn('[ELO] D1 not configured — skipping server-side ELO');
            return;
        }

        // Validate both players exist in the auth map
        const hostAuth = authenticatedSockets.get(room.host);
        const guestAuth = authenticatedSockets.get(room.guest);
        if (!hostAuth || !guestAuth) {
            console.warn(`[ELO] Unauthenticated players in room ${code} — skipping`);
            return;
        }

        // Determine winner/loser from player IDs
        const hostPlayerId = hostAuth.playerId;
        const guestPlayerId = guestAuth.playerId;

        // The winnerId/loserId from client is player number (1 or 2), map to actual player IDs
        const actualWinnerId = winnerId === 1 ? hostPlayerId : guestPlayerId;
        const actualLoserId = loserId === 1 ? hostPlayerId : guestPlayerId;

        try {
            const winner = await d1.getOne('SELECT id, elo, total_games FROM players WHERE id = ?1', [actualWinnerId]);
            const loser = await d1.getOne('SELECT id, elo, total_games FROM players WHERE id = ?1', [actualLoserId]);
            if (!winner || !loser) {
                console.warn('[ELO] Player not found in DB');
                return;
            }

            // ELO calculation
            const winnerK = winner.total_games < 10 ? 40 : winner.total_games < 30 ? 32 : 24;
            const loserK = loser.total_games < 10 ? 40 : loser.total_games < 30 ? 32 : 24;

            const expectedWinner = 1 / (1 + Math.pow(10, (loser.elo - winner.elo) / 400));
            const expectedLoser = 1 / (1 + Math.pow(10, (winner.elo - loser.elo) / 400));

            const winnerDelta = Math.round(winnerK * (1 - expectedWinner));
            const loserDelta = Math.round(loserK * (0 - expectedLoser));

            const newWinnerElo = winner.elo + winnerDelta;
            const newLoserElo = Math.max(100, loser.elo + loserDelta); // floor at 100

            // Update players
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

            // Record match
            const matchId = uuid();
            await d1.execute(
                `INSERT INTO matches (id, winner_id, loser_id, winner_elo_before, winner_elo_after,
                 loser_elo_before, loser_elo_after, team_size, map_mode_id, duration_ms)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
                [matchId, actualWinnerId, actualLoserId, winner.elo, newWinnerElo,
                 loser.elo, newLoserElo, teamSize, mapModeId, durationMs]
            );

            console.log(`[ELO] ${hostAuth.username} vs ${guestAuth.username}: winner=${actualWinnerId === hostPlayerId ? hostAuth.username : guestAuth.username} (${winner.elo}→${newWinnerElo}), loser=(${loser.elo}→${newLoserElo})`);

            // Update in-memory auth ELO
            if (actualWinnerId === hostPlayerId) {
                hostAuth.elo = newWinnerElo;
                guestAuth.elo = newLoserElo;
            } else {
                guestAuth.elo = newLoserElo;
                hostAuth.elo = newWinnerElo;
            }

            // Notify both players of ELO update
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

    // ── Mark match as started (enables reconnection window on disconnect) ──
    socket.on('match-started', () => {
        const found = findRoomBySocket(socket.id);
        if (!found) return;
        found.room._matchStarted = true;
        console.log(`[IO] Room ${found.code} match started`);
    });

    // ── Rejoin room after disconnect ──
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

        // Clear the forfeit timer
        if (dc.timer) clearTimeout(dc.timer);

        // Swap socket ID
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

        // Notify both players
        io.to(code).emit('player-rejoined', { role: role, socketId: socket.id });
    });

    // ── Disconnect ──
    socket.on('disconnect', () => {
        console.log(`[IO] Disconnected: ${socket.id}`);

        // Remove from matchmaking queues
        removeFromAllQueues(socket.id);

        // Remove from authenticated sockets
        authenticatedSockets.delete(socket.id);

        const found = findRoomBySocket(socket.id);
        if (!found) return;

        const { code, room } = found;
        const role = room.host === socket.id ? 'host' : 'guest';

        // If match hasn't started yet, clean up immediately (lobby disconnect)
        if (!room._matchStarted) {
            socket.to(code).emit('player-disconnected', { role, reconnectable: false });
            rooms.delete(code);
            return;
        }

        // Match is in progress — start 90-second rejoin window
        console.log(`[IO] ${role} disconnected from room ${code} — 90s rejoin window`);

        // Notify the other player about disconnection with reconnectable flag
        socket.to(code).emit('player-disconnected', { role, reconnectable: true });

        // Store disconnect info and start forfeit timer
        room._disconnected = {
            role: role,
            socketId: socket.id,
            timer: setTimeout(() => {
                // Forfeit: disconnector loses
                console.log(`[IO] ${role} failed to rejoin room ${code} — forfeit`);
                const forfeitPlayer = role === 'host' ? 1 : 2;
                io.to(code).emit('match-forfeit', { forfeitPlayer: forfeitPlayer, role: role });
                rooms.delete(code);
            }, 90 * 1000)
        };
    });
});

// ── Start ──
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[Entropy Wars] Server running on port ${PORT}`);
});
