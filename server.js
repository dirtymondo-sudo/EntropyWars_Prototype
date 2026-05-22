// ── Entropy Wars: Multiplayer Server ──
// Express + Socket.IO — serves static files and handles room-code matchmaking.

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' },
    transports: ['websocket', 'polling']
});

// ── Serve static files from repo root ──
app.use(express.static(path.join(__dirname), {
    extensions: ['html'],
    index: 'index.html'
}));

// ── Room storage ──
const rooms = new Map(); // code → { host, guest, hostUsername, guestUsername, created }

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

// ── Socket.IO ──
io.on('connection', (socket) => {
    console.log(`[IO] Connected: ${socket.id}`);

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
