const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const rooms = {};

function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";

  for (let i = 0; i < 6; i++) {
    code += chars.charAt(
      Math.floor(Math.random() * chars.length)
    );
  }

  return code;
}

function deleteRoom(roomCode) {
  if (rooms[roomCode]) {
    clearTimeout(rooms[roomCode].expiryTimer);
    delete rooms[roomCode];
    console.log("Room deleted:", roomCode);
  }
}

app.get("/", (req, res) => {
  res.send("PeerDrop Server Running");
});

app.post("/create-room", (req, res) => {
  let roomCode = generateRoomCode();

  while (rooms[roomCode]) {
    roomCode = generateRoomCode();
  }

  const expiryTimer = setTimeout(() => {
    deleteRoom(roomCode);
  }, 60 * 60 * 1000);

  rooms[roomCode] = {
    users: 0,
    expiryTimer,
  };

  res.json({
    roomCode,
    expiresIn: "1 hour",
  });
});

app.post("/join-room", (req, res) => {
  const { roomCode } = req.body;

  if (!rooms[roomCode]) {
    return res.status(404).json({
      message: "Room not found or expired",
    });
  }

  res.json({
    message: "Room found",
  });
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomCode) => {
    if (!rooms[roomCode]) {
      return;
    }

    socket.join(roomCode);

    rooms[roomCode].users++;

    io.to(roomCode).emit(
      "users-count",
      rooms[roomCode].users
    );

    socket.to(roomCode).emit("peer-joined");

    socket.on("disconnect", () => {
      if (rooms[roomCode]) {
        rooms[roomCode].users--;

        io.to(roomCode).emit(
          "users-count",
          rooms[roomCode].users
        );

        if (rooms[roomCode].users <= 0) {
          deleteRoom(roomCode);
        }
      }

      console.log("User disconnected:", socket.id);
    });
  });

  socket.on("offer", ({ roomCode, offer }) => {
    socket.to(roomCode).emit("offer", offer);
  });

  socket.on("answer", ({ roomCode, answer }) => {
    socket.to(roomCode).emit("answer", answer);
  });

  socket.on("ice-candidate", ({ roomCode, candidate }) => {
    socket.to(roomCode).emit(
      "ice-candidate",
      candidate
    );
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});