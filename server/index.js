const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const path = require("path");
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
    const uniqueName =
      Date.now() + "-" + file.originalname;

    cb(null, uniqueName);
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

    const fileUrl = `${req.protocol}://${req.get(
      "host"
    )}/uploads/${req.file.filename}`;

    io.to(roomCode).emit("new-file", {
      fileName: req.file.originalname,
      fileUrl,
    });

    res.json({
      success: true,
      fileUrl,
    });
  }
);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomCode) => {
    if (!rooms[roomCode]) return;

    socket.join(roomCode);

    rooms[roomCode].users++;

    io.to(roomCode).emit(
      "users-count",
      rooms[roomCode].users
    );

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
    });
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});