const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

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
    files: [],
  };

  res.json({ roomCode });
});

app.post("/join-room", (req, res) => {
  const { roomCode } = req.body;

  if (!rooms[roomCode]) {
    return res.status(404).json({
      message: "Room not found",
    });
  }

  res.json({
    success: true,
  });
});

app.post(
  "/upload/:roomCode",
  upload.single("file"),
  (req, res) => {
    const { roomCode } = req.params;

    if (!rooms[roomCode]) {
      return res.status(404).json({
        message: "Room not found",
      });
    }

    const fileData = {
      fileName: req.file.originalname,
      fileUrl: `${req.protocol}://${req.get(
        "host"
      )}/uploads/${req.file.filename}`,
    };

    rooms[roomCode].files.push(fileData);

    io.to(roomCode).emit("new-file", fileData);

    res.json({
      success: true,
    });
  }
);

io.on("connection", (socket) => {
  socket.on("join-room", (roomCode) => {
    if (!rooms[roomCode]) return;

    socket.join(roomCode);

    rooms[roomCode].users++;

    io.to(roomCode).emit(
      "users-count",
      rooms[roomCode].users
    );

    socket.emit(
      "room-history",
      rooms[roomCode].files
    );

    socket.on("disconnect", () => {
      if (!rooms[roomCode]) return;

      rooms[roomCode].users--;

      io.to(roomCode).emit(
        "users-count",
        rooms[roomCode].users
      );

      if (rooms[roomCode].users <= 0) {
        deleteRoom(roomCode);
      }
    });
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("Server running");
});