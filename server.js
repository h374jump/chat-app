const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const FILE = "messages.json";

// Load saved messages
function loadMessages() {
  if (!fs.existsSync(FILE)) return {};
  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}

// Save messages
function saveMessages(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

let messages = loadMessages();

io.on("connection", (socket) => {
  console.log("User connected");

  // join a room
  socket.on("joinRoom", (room) => {
    socket.join(room);
    console.log(`Joined room: ${room}`);

    // send old messages for that room
    if (!messages[room]) messages[room] = [];
    socket.emit("loadMessages", messages[room]);
  });

  // receive message
  socket.on("sendMessage", ({ room, msg }) => {
    if (!messages[room]) messages[room] = [];

    messages[room].push(msg);

    // keep only last 100 messages (prevents huge file)
    if (messages[room].length > 100) {
      messages[room].shift();
    }

    saveMessages(messages);

    io.to(room).emit("newMessage", msg);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});