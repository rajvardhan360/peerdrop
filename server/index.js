const express = require("express");
const http = require("http");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const { Server } = require("socket.io");

const app = express();

app.use(cors());
app.use(express.json());

const rooms = {};

function generateRoomCode() {
  return uuidv4().slice(0, 6).toUpperCase();
}

app.get("/", (req, res) => {
  res.send("PeerDrop Server Running");
});

app.post("/create-room", (req, res) => {
  const roomCode = generateRoomCode();

  rooms[roomCode] = {
    createdAt: Date.now(),
  };

  res.json({
    success: true,
    roomCode,
  });
});

app.post("/join-room", (req, res) => {
  const { roomCode } = req.body;

  if (!rooms[roomCode]) {
    return res.status(404).json({
      success: false,
      message: "Room not found",
    });
  }

  res.json({
    success: true,
    message: "Room joined",
  });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomCode) => {
    socket.join(roomCode);

    const clients = io.sockets.adapter.rooms.get(roomCode);
    const count = clients ? clients.size : 0;

    socket.to(roomCode).emit("peer-joined");

    io.to(roomCode).emit("users-count", count);
  });

  socket.on("offer", ({ roomCode, offer }) => {
    socket.to(roomCode).emit("offer", offer);
  });

  socket.on("answer", ({ roomCode, answer }) => {
    socket.to(roomCode).emit("answer", answer);
  });

  socket.on("ice-candidate", ({ roomCode, candidate }) => {
    socket.to(roomCode).emit("ice-candidate", candidate);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});