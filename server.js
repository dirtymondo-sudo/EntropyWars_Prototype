// ─────────────────────────────────────────────────────
// Entropy Wars Online – Relay Server
// Node.js + Socket.IO – just relays messages between
// two players in the same room. No game logic here.
// ─────────────────────────────────────────────────────

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Serve game files from the same directory as server.js (repo root)
app.use(express.static(__dirname));

// ── Room management ──
const rooms = {};

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I or O (ambiguous)
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

io.on('connection', (socket) => {
  console.log(`[+] Connected: ${socket.id}`);

  // ── Create a new room ──
  socket.on('create-room', (callback) => {
    leaveCurrentRoom(socket);

    const code = generateRoomCode();
    rooms[code] = {
      host: socket.id,
      guest: null,
      hostReady: false,
      guestParty: null,
      created: Date.now()
    };
    socket.join(code);
    socket.data.roomCode = code;
    socket.data.role = 'host';
    console.log(`[room] ${socket.id} created room ${code}`);
    callback({ code });
  });

  // ── Join an existing room ──
  socket.on('join-room', (code, callback) => {
    code = (code || '').toUpperCase().trim();
    const room = rooms[code];
    if (!room) return callback({ error: 'Room not found. Check the code and try again.' });
    if (room.guest) return callback({ error: 'Room is full — someone else already joined.' });

    leaveCurrentRoom(socket);
    room.guest = socket.id;
    socket.join(code);
    socket.data.roomCode = code;
    socket.data.role = 'guest';
    console.log(`[room] ${socket.id} joined room ${code}`);
    callback({ success: true });

    // Tell both sides the room is now full
    io.to(code).emit('room-full', { host: room.host, guest: room.guest });
  });

  // ── Relay: game actions (guest → host) ──
  socket.on('game-action', (data) => {
    const code = socket.data.roomCode;
    if (!code) return;
    socket.to(code).emit('game-action', data);
  });

  // ── Relay: full state sync (host → guest) ──
  socket.on('state-sync', (data) => {
    const code = socket.data.roomCode;
    if (!code) return;
    socket.to(code).emit('state-sync', data);
  });

  // ── Relay: party config (guest → host before battle) ──
  socket.on('party-config', (data) => {
    const code = socket.data.roomCode;
    if (!code) return;
    socket.to(code).emit('party-config', data);
  });

  // ── Relay: generic messages (chat, ready signals, etc.) ──
  socket.on('relay', (data) => {
    const code = socket.data.roomCode;
    if (!code) return;
    socket.to(code).emit('relay', data);
  });

  // ── Disconnect cleanup ──
  socket.on('disconnect', () => {
    const code = socket.data.roomCode;
    console.log(`[-] Disconnected: ${socket.id} (room: ${code || 'none'})`);
    if (code && rooms[code]) {
      io.to(code).emit('player-disconnected', { role: socket.data.role });
      delete rooms[code];
    }
  });
});

function leaveCurrentRoom(socket) {
  const code = socket.data.roomCode;
  if (code) {
    socket.leave(code);
    if (rooms[code]) {
      io.to(code).emit('player-disconnected', { role: socket.data.role });
      delete rooms[code];
    }
    socket.data.roomCode = null;
    socket.data.role = null;
  }
}

// ── Periodic cleanup of stale rooms (>2 hours old with no guest) ──
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of Object.entries(rooms)) {
    if (!room.guest && now - room.created > 2 * 60 * 60 * 1000) {
      console.log(`[cleanup] Removing stale room ${code}`);
      io.to(code).emit('room-expired');
      delete rooms[code];
    }
  }
}, 60 * 1000);

// ── Start server ──
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🎮 Entropy Wars Online server running on port ${PORT}`);
  console.log(`   Open http://localhost:${PORT} in your browser\n`);
});
