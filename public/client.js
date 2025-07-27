const socket = io();

const lobby = document.getElementById('lobby');
const chat = document.getElementById('chat');
const nameInput = document.getElementById('name');
const roomInput = document.getElementById('room');
const nameErr = document.getElementById('nameErr');
const enterBtn = document.getElementById('enter');
const roomsList = document.getElementById('rooms');
const usersList = document.getElementById('users');
const roomTitle = document.getElementById('room-name');
const chatBox = document.getElementById('messages');
const msgForm = document.getElementById('msgForm');
const msgInput = document.getElementById('msgInput');

let username = '';
let currentRoom = '';

// Join chat
enterBtn.onclick = () => {
  const name = nameInput.value.trim();
  const room = roomInput.value.trim();
  if (!name || !room) return;

  username = name;
  currentRoom = room;

  socket.emit('join-request', { name, room });
};

// Username conflict
socket.on('name-exists', () => {
  nameErr.classList.remove('hidden');
});

// Update room list
socket.on('room-list', rooms => {
  roomsList.innerHTML = rooms.map(r => `<li>${r}</li>`).join('');
});

// Update user list
socket.on('user-list', users => {
  usersList.innerHTML = users.map(u => `<li>${u}</li>`).join('');
  // Show chat view
  lobby.classList.add('hidden');
  chat.classList.remove('hidden');
  roomTitle.textContent = currentRoom;
});

// Receive a system message
socket.on('system-msg', msg => {
  appendMessage(msg, 'sys');
});

// Receive a chat message
socket.on('chat-msg', data => {
  const { sender, text, time } = data;
  const isUser = sender === username;
  appendMessage(`
    <span class="sender">${sender}</span><br>
    ${text}
    <span class="stamp">${time}</span>
  `, isUser ? 'user' : '');
});

// Send message
msgForm.onsubmit = (e) => {
  e.preventDefault();
  const message = msgInput.value.trim();
  if (message) {
    socket.emit('chat-msg', message);
    msgInput.value = '';
  }
};

function appendMessage(html, className = '') {
  const li = document.createElement('li');
  li.className = className;
  li.innerHTML = html;
  chatBox.appendChild(li);
  li.scrollIntoView({ behavior: 'smooth' });
}
