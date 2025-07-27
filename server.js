// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

app.use(express.static('public'));

const users = new Map(); // Tracks connected users: socket.id → { name, room }
const rooms = new Set(); // Set of room names

io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);

  socket.on('join-request', ({ name, room }) => {
    if ([...users.values()].some(u => u.name === name)) {
      socket.emit('name-exists');
      return;
    }

    users.set(socket.id, { name, room });
    rooms.add(room);
    socket.join(room);

    socket.emit('room-list', [...rooms]);
    io.to(room).emit('user-list', getUsersInRoom(room));
    io.to(room).emit('system-msg', `${name} has joined the room.`);

    io.emit('room-list', [...rooms]);
  });

  socket.on('chat-msg', (text) => {
    const user = users.get(socket.id);
    if (!user) return;

    const msg = {
      sender: user.name,
      text: sanitize(text),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    io.to(user.room).emit('chat-msg', msg);
  });

  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (!user) return;

    const { name, room } = user;
    users.delete(socket.id);
    io.to(room).emit('system-msg', `${name} has left the room.`);
    io.to(room).emit('user-list', getUsersInRoom(room));

    if (getUsersInRoom(room).length === 0) rooms.delete(room);
    io.emit('room-list', [...rooms]);
  });

  function getUsersInRoom(room) {
    return [...users.values()].filter(u => u.room === room).map(u => u.name);
  }

  function sanitize(str) {
    return str
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
  }
});

server.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
