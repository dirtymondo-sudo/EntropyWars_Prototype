const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const path    = require('path');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Serve the game HTML
app.use(express.static(__dirname));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Room state ──────────────────────────────────────────────
const rooms = {}; // code -> { host: socketId, guest: socketId|null }

function makeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < 5; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return rooms[c] ? makeCode() : c; // retry on collision
}

// ── Socket.io events ────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('[+] connected:', socket.id);

  // Host creates a room
  socket.on('create-room', (cb) => {
    const code = makeCode();
    rooms[code] = { host: socket.id, guest: null };
    socket.join(code);
    socket._roomCode = code;
    socket._role = 'host';
    console.log(`[room] created ${code} by ${socket.id}`);
    if (typeof cb === 'function') cb({ ok: true, code });
  });

  // Guest joins a room
  socket.on('join-room', (code, cb) => {
    code = (code || '').toUpperCase().trim();
    const room = rooms[code];
    if (!room) {
      if (typeof cb === 'function') cb({ ok: false, reason: 'Room not found.' });
      return;
    }
    if (room.guest) {
      // Room already full – tell the joiner and the room
      if (typeof cb === 'function') cb({ ok: false, reason: 'Room is full.' });
      socket.emit('room-full');
      return;
    }
    room.guest = socket.id;
    socket.join(code);
    socket._roomCode = code;
    socket._role = 'guest';
    console.log(`[room] ${socket.id} joined ${code}`);
    if (typeof cb === 'function') cb({ ok: true, code });
    // Tell the host a guest has arrived
    io.to(room.host).emit('guest-joined');
  });

  // Generic relay: forward any named event to the other player in the room
  function relay(evt, data) {
    const code = socket._roomCode;
    if (!code) return;
    socket.to(code).emit(evt, data);   // broadcast to everyone else in room
  }

  socket.on('game-action',  (d) => relay('game-action',  d));
  socket.on('state-sync',   (d) => relay('state-sync',   d));
  socket.on('party-config', (d) => relay('party-config', d));
  socket.on('relay',        (d) => relay('relay',        d));

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    console.log('[-] disconnected:', socket.id);
    const code = socket._roomCode;
    if (!code || !rooms[code]) return;
    // Notify the other player
    socket.to(code).emit('player-disconnected', { role: socket._role });
    // Clean up the room
    delete rooms[code];
    console.log(`[room] ${code} closed`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Entropy Wars server listening on port ${PORT}`));
