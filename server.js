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
    for (const teamSize in queues) {
        const q = queues[teamSize];
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

                    const code = generateCode();
                    const map = pickRandomMap(parseInt(teamSize));

                    // Higher ELO = host (or random if equal)
                    let host = a, guest = b;
                    if (b.elo > a.elo || (b.elo === a.elo && Math.random() > 0.5)) {
                        host = b;
                        guest = a;
                    }

                    // Create room
                    rooms.set(code, {
                        host: host.socketId,
                        guest: guest.socketId,
                        hostUsername: host.username,
                        guestUsername: guest.username,
                        created: Date.now(),
                        ranked: true,
                        mapModeId: map.modeId,
                        teamSize: parseInt(teamSize)
                    });

                    // Join both sockets to the room
                    const hostSocket = io.sockets.sockets.get(host.socketId);
                    const guestSocket = io.sockets.sockets.get(guest.socketId);

                    if (hostSocket) hostSocket.join(code);
                    if (guestSocket) guestSocket.join(code);

                    console.log(`[MM] Matched ${host.username} (${host.elo}) vs ${guest.username} (${guest.elo}) → Room ${code} on ${map.modeId} (${teamSize}v${teamSize})`);

                    // Notify both players
                    if (hostSocket) {
                        hostSocket.emit('match-found', {
                            roomCode: code,
                            role: 'host',
                            opponent: guest.username,
                            opponentElo: guest.elo,
                            mapModeId: map.modeId,
                            teamSize: parseInt(teamSize)
                        });
                    }
                    if (guestSocket) {
                        guestSocket.emit('match-found', {
                            roomCode: code,
                            role: 'guest',
                            opponent: host.username,
                            opponentElo: host.elo,
                            mapModeId: map.modeId,
                            teamSize: parseInt(teamSize)
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
                        teamSize: parseInt(teamSize)
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
    for (const ts in queues) {
        stats[ts + 'v' + ts] = queues[ts].length;
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
        rooms.set(code, {
            host: socket.id,
            guest: null,
            hostUsername: username,
            guestUsername: null,
            created: Date.now()
        });
        socket.join(code);
        console.log(`[IO] Room ${code} created by ${username} (${socket.id})`);
        if (callback) callback({ code });
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
        socket.join(code);
        console.log(`[IO] ${username} (${socket.id}) joined room ${code}`);

        if (callback) callback({ ok: true });

        // Notify both players
        io.to(code).emit('room-full', {
            host: room.host,
            guest: room.guest,
            hostUsername: room.hostUsername,
            guestUsername: room.guestUsername
        });
    });

    // ── Join matchmaking queue ──
    socket.on('queue-join', (data) => {
        const teamSize = (data && data.teamSize) || 4;

        // Prefer server-side identity from authenticated socket
        const auth = authenticatedSockets.get(socket.id);
        const username = auth ? auth.username : ((data && data.username) || 'Player');
        const elo = auth ? auth.elo : ((data && typeof data.elo === 'number') ? data.elo : 1200);
        const playerId = auth ? auth.playerId : null;

        // Remove from any existing queue first
        removeFromAllQueues(socket.id);

        const q = getQueue(teamSize);
        q.push({
            socketId: socket.id,
            playerId: playerId,
            username: username,
            elo: elo,
            joinedAt: Date.now()
        });

        console.log(`[MM] ${username} (ELO ${elo}${auth ? ' [verified]' : ''}) joined ${teamSize}v${teamSize} queue (${q.length} in queue)`);

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

        // Notify the other player
        socket.to(code).emit('player-disconnected', { role });

        // Clean up the room
        rooms.delete(code);
    });
});

// ── Start ──
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[Entropy Wars] Server running on port ${PORT}`);
});
